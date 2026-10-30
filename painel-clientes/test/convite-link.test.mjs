// A função "aceitar-convite" (supabase/functions/aceitar-convite/logica.js; Missão 7, bloco B; D42): o link vale,
// a senha serve, cria o login ou troca a senha de quem já tem, e marca o link. O Supabase aqui é de mentira; o de
// verdade é conferido no STG (test/fluxos/piloto.fluxo.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, cabecalhosCors, senhaValida, traduzirErro } from "../supabase/functions/aceitar-convite/logica.js";

const CODIGO = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";
const agora = Date.parse("2026-10-30T12:00:00Z");
const CONVITE = { id: "c1", email: "espacojardim@acesso.renderizaweb.com.br", usuario: "espacojardim", nome: "Dona Jardim", expira_em: "2026-11-06T12:00:00Z", link_usado_em: null, cancelado_em: null };

function deps({ convite = CONVITE, login = null, falhar = null, pode = true, marca = true } = {}) {
  const chamadas = [];
  return {
    chamadas,
    convite: async codigo => (codigo === CODIGO ? convite : null),
    loginDoEmail: async email => { chamadas.push(["login?", email]); return login; },
    podeUsarLogin: async c => { chamadas.push(["pode?", c.id]); return pode; },
    criarLogin: async (email, senha, nome) => { chamadas.push(["criar", email, senha, nome]); if (falhar) throw falhar; },
    trocarSenha: async (id, senha) => { chamadas.push(["trocar", id, senha]); if (falhar) throw falhar; },
    marcarUsado: async id => { chamadas.push(["usado", id]); return marca; },
    desmarcar: async id => { chamadas.push(["desmarcar", id]); },
  };
}
const pedido = corpo => ({ metodo: "POST", origem: "https://painel.renderizaweb.com.br", corpo, agora });

test("link válido e login novo: cria com o e-mail interno e a senha, marca o link e devolve o e-mail para entrar", async () => {
  const d = deps();
  const r = await atender(pedido({ codigo: CODIGO, senha: "jardim2026" }), d);
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, { email: CONVITE.email, usuario: "espacojardim", novo: true });
  assert.deepEqual(d.chamadas, [["login?", CONVITE.email], ["usado", "c1"], ["criar", CONVITE.email, "jardim2026", "Dona Jardim"]], "marca o link antes de criar");
});

test("quem já tem o usuário (link novo de quem esqueceu): troca a senha, não cria outro", async () => {
  const d = deps({ login: "u-123" });
  const r = await atender(pedido({ codigo: CODIGO, senha: "outrasenha9" }), d);
  assert.equal(r.status, 200);
  assert.equal(r.corpo.novo, false);
  assert.deepEqual(d.chamadas.map(c => c[0]), ["login?", "pode?", "usado", "trocar"]);
});

test("segurança: o link não troca a senha de quem é de outra conta; dois toques ao mesmo tempo usam o link uma vez só", async () => {
  const outra = deps({ login: "u-999", pode: false });
  const r = await atender(pedido({ codigo: CODIGO, senha: "tomeiconta1" }), outra);
  assert.equal(r.status, 403);
  assert.deepEqual(outra.chamadas.map(c => c[0]), ["login?", "pode?"], "nem marca, nem troca");
  const segundo = deps({ marca: false });
  assert.equal((await atender(pedido({ codigo: CODIGO, senha: "jardim2026" }), segundo)).status, 409);
  assert.ok(!segundo.chamadas.some(c => c[0] === "criar"), "quem chegou depois não cria nada");
  const falhou = deps({ falhar: new Error("qualquer") });
  await atender(pedido({ codigo: CODIGO, senha: "jardim2026" }), falhou);
  assert.deepEqual(falhou.chamadas.at(-1), ["desmarcar", "c1"], "se o login falha, o link volta a valer");
});

test("link usado, vencido, cancelado ou que não existe: não cria nada e diz o porquê", async () => {
  const casos = [
    [{ ...CONVITE, link_usado_em: "2026-10-30T10:00:00Z" }, 409, /já foi usado.*espacojardim/],
    [{ ...CONVITE, expira_em: "2026-10-30T11:59:00Z" }, 410, /venceu/],
    [{ ...CONVITE, cancelado_em: "2026-10-30T10:00:00Z" }, 404, /não vale/],
    [null, 404, /não vale/],
  ];
  for (const [convite, status, msg] of casos) {
    const d = deps({ convite });
    const r = await atender(pedido({ codigo: CODIGO, senha: "jardim2026" }), d);
    assert.equal(r.status, status);
    assert.match(r.corpo.erro, msg);
    assert.equal(d.chamadas.length, 0, "nada foi criado nem marcado");
  }
  const r = await atender(pedido({ codigo: "curto", senha: "jardim2026" }), deps());
  assert.equal(r.status, 404);
});

test("a senha: no mínimo 8 caracteres, no máximo 72; erro do login em português", async () => {
  assert.match(senhaValida("1234567"), /8 caracteres/);
  assert.equal(senhaValida("12345678"), "");
  assert.match(senhaValida("x".repeat(73)), /72/);
  const r = await atender(pedido({ codigo: CODIGO, senha: "curta" }), deps());
  assert.deepEqual([r.status, r.corpo.campo], [400, "senha"]);
  const falhou = await atender(pedido({ codigo: CODIGO, senha: "jardim2026" }), deps({ falhar: { status: 429, message: "rate limit" } }));
  assert.equal(falhou.status, 502);
  assert.match(falhou.corpo.erro, /Muitas tentativas/);
  assert.match(traduzirErro({ message: "Password should be at least 8 characters" }), /fraca/);
  assert.match(traduzirErro(new Error("qualquer")), /Tente de novo/);
});

test("só POST; CORS só para o painel (e o localhost de qualquer porta, para os fluxos)", async () => {
  assert.equal((await atender({ metodo: "OPTIONS", origem: "", corpo: {} }, deps())).status, 204);
  assert.equal((await atender({ metodo: "GET", origem: "", corpo: {} }, deps())).status, 405);
  assert.equal(cabecalhosCors("http://localhost:5203")["Access-Control-Allow-Origin"], "http://localhost:5203");
  assert.equal(cabecalhosCors("https://golpe.com")["Access-Control-Allow-Origin"], "https://painel.renderizaweb.com.br");
});

// A peça do Admin (e da Equipe): src/ui/convite-link.js
import { novoCodigoDeLink, usuarioDoNome, usuarioValido, emailDoUsuario, linkDoConvite, mensagemDoConvite } from "../src/ui/convite-link.js";

test("o código do link, o usuário sugerido pelo nome e a mensagem pronta", () => {
  const codigo = novoCodigoDeLink();
  assert.match(codigo, /^[a-z0-9]{32}$/, "o formato que o banco aceita");
  assert.notEqual(codigo, novoCodigoDeLink(), "sorteado a cada vez");
  assert.equal(usuarioDoNome("Espaço Jardim & Cia."), "espacojardimcia");
  assert.equal(usuarioDoNome("Villa Alecrim Eventos e Festas Ltda"), "villaalecrimeventose", "até 20");
  assert.equal(usuarioDoNome("Zé"), "", "curto demais: a Renderiza escolhe");
  assert.ok(usuarioValido("espacojardim") && !usuarioValido("Espaço") && !usuarioValido("ab"));
  assert.equal(emailDoUsuario("espacojardim"), "espacojardim@acesso.renderizaweb.com.br");
  assert.equal(linkDoConvite("abc", "https://painel.renderizaweb.com.br"), "https://painel.renderizaweb.com.br/boas-vindas/abc");
  const m = mensagemDoConvite({ nome: "Marina Alves", negocio: "Espaço Jardim", usuario: "espacojardim", link: "https://x/boas-vindas/abc" });
  assert.match(m, /^Oi, Marina!/);
  assert.match(m, /https:\/\/x\/boas-vindas\/abc/);
  assert.match(m, /Seu usuário: espacojardim/);
  assert.match(mensagemDoConvite({ usuario: "u1u", link: "L", novaSenha: true }), /senha nova.*\n?.*L/s);
});
