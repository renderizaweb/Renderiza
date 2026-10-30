import { test } from "node:test";
import assert from "node:assert/strict";
import { criarSessao, validarEntrada, validarEmail, validarSenhaNova, SENHA_MINIMA, emailDeEntrada, usuarioDoEmail } from "../src/sessao.js";
import { criarAdaptadorSupabase, traduzir } from "../src/adaptadores/supabase.js";

// Um supabase-js de mentira: guarda a sessão e avisa os ouvintes, como o de verdade.
const pedidos = [];
function clienteFalso({ senhaCerta = "certa" } = {}) {
  let sessao = null;
  const ouvintes = [];
  const avisar = (ev, s) => ouvintes.forEach(fn => fn(ev, s));
  return {
    auth: {
      async getSession() { return { data: { session: sessao } }; },
      async signInWithPassword({ email, password }) {
        if (password !== senhaCerta) return { data: null, error: { message: "Invalid login credentials", status: 400 } };
        sessao = { user: { id: "u1", email } };
        avisar("SIGNED_IN", sessao);
        return { data: { session: sessao }, error: null };
      },
      async signOut() { sessao = null; avisar("SIGNED_OUT", null); return { error: null }; },
      async resetPasswordForEmail(email, { redirectTo }) { pedidos.push({ email, redirectTo }); return { data: {}, error: null }; },
      async updateUser({ password }) {
        if (!sessao) return { data: null, error: { message: "Auth session missing!" } };
        if (password === "igual12345") return { data: null, error: { message: "New password should be different from the old password." } };
        return { data: { user: sessao.user }, error: null };
      },
      onAuthStateChange(fn) { ouvintes.push(fn); return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from: () => ({}),
    rpc: async () => ({ data: 42, error: null }),
  };
}

const adaptador = opcoes => criarAdaptadorSupabase({ url: "https://x.supabase.co", chave: "sb_publishable_x", createClient: () => clienteFalso(opcoes) });

test("validarEntrada pede e-mail (ou usuário) e senha", () => {
  assert.equal(validarEntrada("", "x"), "Digite o seu e-mail ou usuário.");
  assert.match(validarEntrada("fulano@", "x"), /não parece certo/);
  assert.equal(validarEntrada("espacojardim", "x"), null, "o usuário do convite por link (D42)");
  assert.match(validarEntrada("fu", "x"), /usuário não parece certo/);
  assert.match(validarEntrada("Com Espaço", "x"), /usuário não parece certo/);
  assert.equal(validarEntrada("ana@villa.com", ""), "Digite a sua senha.");
  assert.equal(validarEntrada(" ana@villa.com ", "x"), null);
});

test("entrar e sair", async () => {
  const sessao = criarSessao(await adaptador());
  await sessao.iniciar();
  assert.equal(sessao.logado(), false);
  await sessao.entrar(" ana@villa.com ", "certa");
  assert.equal(sessao.logado(), true);
  assert.equal(sessao.usuario().email, "ana@villa.com");
  await sessao.sair();
  assert.equal(sessao.logado(), false);
});

test("senha errada vira mensagem em português e não loga", async () => {
  const sessao = criarSessao(await adaptador());
  await sessao.iniciar();
  await assert.rejects(sessao.entrar("ana@villa.com", "errada"), { message: "E-mail ou senha incorretos." });
  assert.equal(sessao.logado(), false);
});

test("avisa a casca quando muda quem está logado (ex.: outra aba)", async () => {
  const sessao = criarSessao(await adaptador());
  await sessao.iniciar();
  const avisos = [];
  sessao.aoMudar(s => avisos.push(s ? s.user.email : null));
  await sessao.entrar("ana@villa.com", "certa");
  await sessao.sair();
  assert.deepEqual(avisos, ["ana@villa.com", null]);
});

test("traduz os erros comuns", () => {
  assert.equal(traduzir({ message: "Email not confirmed" }), "Seu e-mail ainda não foi confirmado. Abra o link que enviamos por e-mail.");
  assert.match(traduzir({ message: "Request rate limit reached", status: 429 }), /Muitas tentativas/);
  assert.match(traduzir({ message: "TypeError: Failed to fetch" }), /Sem conexão/);
  assert.equal(traduzir({ code: "42501", message: "new row violates row-level security policy" }), "Você não tem permissão para isso.");
});

test("rpc devolve os dados", async () => {
  assert.equal(await (await adaptador()).rpc("qualquer", {}), 42);
});

test("validações de e-mail e de senha nova", () => {
  assert.equal(validarEmail(""), "Digite o seu e-mail.");
  assert.equal(validarEmail(" ana@villa.com "), null);
  assert.equal(SENHA_MINIMA, 8);
  assert.equal(validarSenhaNova(""), "Digite a senha nova.");
  assert.equal(validarSenhaNova("1234567"), "A senha precisa ter pelo menos 8 caracteres.");
  assert.equal(validarSenhaNova("12345678"), null);
});

test("esqueci a senha: valida o e-mail e manda o link para a tela /nova-senha", async () => {
  const sessao = criarSessao(await adaptador());
  await sessao.iniciar();
  await assert.rejects(sessao.pedirNovaSenha("fulano", "https://painel/nova-senha"), { message: /não parece certo/ });
  await sessao.pedirNovaSenha(" ana@villa.com ", "https://painel/nova-senha");
  assert.deepEqual(pedidos.at(-1), { email: "ana@villa.com", redirectTo: "https://painel/nova-senha" });
});

test("nova senha: pede 8 caracteres, exige a sessão do link e traduz os erros", async () => {
  const sessao = criarSessao(await adaptador());
  await sessao.iniciar();
  await assert.rejects(sessao.definirSenha("curta"), { message: "A senha precisa ter pelo menos 8 caracteres." });
  await assert.rejects(sessao.definirSenha("novasenha1"), { message: /link não vale mais/ });
  await sessao.entrar("ana@villa.com", "certa");
  await assert.rejects(sessao.definirSenha("igual12345"), { message: "A senha nova precisa ser diferente da atual." });
  await sessao.definirSenha("novasenha1");
  assert.equal(sessao.logado(), true);
});

test("o usuário do convite por link vira o e-mail interno do login, e volta para mostrar", () => {
  assert.equal(emailDeEntrada(" EspacoJardim "), "espacojardim@acesso.renderizaweb.com.br");
  assert.equal(emailDeEntrada("ana@villa.com"), "ana@villa.com");
  assert.equal(usuarioDoEmail("espacojardim@acesso.renderizaweb.com.br"), "espacojardim");
  assert.equal(usuarioDoEmail("ana@villa.com"), null);
});
