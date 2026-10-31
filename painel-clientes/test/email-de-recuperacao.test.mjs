// O e-mail opcional para recuperar a senha (supabase/functions/email-de-recuperacao/logica.js; Missão 7, D42): o
// código de 6 números cifrado, a confirmação com tentativas e validade, um envio por minuto, e o link da senha nova
// pelo usuário ou pelo e-mail, com a resposta sempre igual. O Supabase e o Brevo aqui são de mentira.
import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, cifrar, novoCodigo, destinoValido, emailValido, emailDoLink, TENTATIVAS } from "../supabase/functions/email-de-recuperacao/logica.js";

const agora = Date.parse("2026-10-31T12:00:00Z");
const DESTINO = "https://painel.renderizaweb.com.br/nova-senha";
function deps({ linhas = {}, chave = true } = {}) {
  const banco = { ...linhas };
  const enviados = [];
  return {
    banco, enviados,
    temChave: chave,
    usuarioDoToken: async t => (t === "tok" ? { id: "u1" } : null),
    linha: async id => banco[id] || null,
    gravar: async (id, campos) => { banco[id] = { ...(banco[id] || {}), ...campos }; },
    apagar: async id => { delete banco[id]; },
    loginDoUsuario: async u => (u === "espacojardim" ? { id: "u1", email: "espacojardim@acesso.renderizaweb.com.br" } : null),
    linhasPeloEmail: async e => Object.entries(banco).filter(([, r]) => r.email === e && r.confirmado_em).map(([id, r]) => ({ usuario_id: id, email: r.email, ultimo_envio_em: r.ultimo_envio_em })),
    emailDoLogin: async id => (id === "u1" ? "espacojardim@acesso.renderizaweb.com.br" : "maria@exemplo.teste"),
    linkDeSenhaNova: async (email, destino) => `https://x.supabase.co/auth/v1/verify?token=abc&redirect_to=${destino}`,
    enviar: async m => { enviados.push(m); },
  };
}
const pedido = (corpo, token = "tok", quando = agora) => ({ metodo: "POST", origem: "https://painel.renderizaweb.com.br", token, corpo, agora: quando });

test("pôr o e-mail: o código vai por e-mail, o banco guarda só o cifrado, e confirma", async () => {
  const d = deps();
  const r = await atender(pedido({ acao: "pedir", email: " Dona.Jardim@Gmail.com " }), d);
  assert.equal(r.status, 200);
  const codigo = /(\d{6})/.exec(d.enviados[0].assunto)[1];
  assert.equal(d.enviados[0].para, "dona.jardim@gmail.com");
  assert.equal(d.banco.u1.email_pendente, "dona.jardim@gmail.com");
  assert.equal(d.banco.u1.codigo_hash, await cifrar("u1", codigo));
  assert.ok(!JSON.stringify(d.banco).includes(codigo), "o código nunca fica no banco");
  assert.equal((await atender(pedido({ acao: "confirmar", codigo: "000000" === codigo ? "111111" : "000000" }), d)).status, 400);
  assert.equal(d.banco.u1.tentativas, 1);
  const ok = await atender(pedido({ acao: "confirmar", codigo: codigo.slice(0, 3) + " " + codigo.slice(3) }), d);
  assert.deepEqual([ok.status, ok.corpo.email], [200, "dona.jardim@gmail.com"]);
  assert.equal(d.banco.u1.email, "dona.jardim@gmail.com");
  assert.equal(d.banco.u1.codigo_hash, null);
});

test("os limites: um envio por minuto, código que vence, 5 tentativas, e-mail que serve", async () => {
  const d = deps();
  await atender(pedido({ acao: "pedir", email: "a@b.teste" }), d);
  assert.equal((await atender(pedido({ acao: "pedir", email: "a@b.teste" }, "tok", agora + 30000), d)).status, 429, "um envio por minuto");
  assert.equal((await atender(pedido({ acao: "confirmar", codigo: "123456" }, "tok", agora + 16 * 60000), d)).status, 410, "vence em 15 minutos");
  d.banco.u1.tentativas = TENTATIVAS;
  assert.equal((await atender(pedido({ acao: "confirmar", codigo: "123456" }), d)).status, 429);
  assert.equal((await atender(pedido({ acao: "pedir", email: "x@acesso.renderizaweb.com.br" }, "tok", agora + 120000), deps())).status, 400, "o interno não serve");
  assert.ok(!emailValido("sem-arroba") && emailValido("ok@exemplo.com"));
  assert.equal((await atender(pedido({ acao: "pedir", email: "a@b.teste" }, ""), deps())).status, 401);
  assert.equal((await atender(pedido({ acao: "pedir", email: "a@b.teste" }), deps({ chave: false }))).status, 503);
});

test("esqueci a senha: o link vai para o e-mail confirmado, pelo usuário ou pelo e-mail; a resposta é sempre a mesma", async () => {
  const confirmado = { email: "dona.jardim@gmail.com", confirmado_em: "2026-10-30T10:00:00Z" };
  const d = deps({ linhas: { u1: { ...confirmado } } });
  const r = await atender(pedido({ acao: "recuperar", usuario: "EspacoJardim", destino: DESTINO }, ""), d);
  assert.deepEqual([r.status, r.corpo], [200, { ok: true }]);
  assert.equal(d.enviados[0].para, "dona.jardim@gmail.com");
  assert.match(d.enviados[0].texto, /usuário espacojardim/);
  assert.match(d.enviados[0].html, /redirect_to=https:\/\/painel\.renderizaweb\.com\.br\/nova-senha/);
  const de_novo = await atender(pedido({ acao: "recuperar", email: "dona.jardim@gmail.com", destino: DESTINO }, "", agora + 10000), d);
  assert.equal(de_novo.status, 200);
  assert.equal(d.enviados.length, 1, "um envio por minuto também aqui");
  for (const corpo of [{ usuario: "naoexiste" }, { email: "ninguem@exemplo.teste" }]) {
    const n = deps();
    const x = await atender(pedido({ acao: "recuperar", destino: DESTINO, ...corpo }, ""), n);
    assert.deepEqual([x.status, x.corpo, n.enviados.length], [200, { ok: true }, 0], "quem não tem: a mesma resposta, nada enviado");
  }
  const semConfirmar = deps({ linhas: { u1: { email_pendente: "a@b.teste" } } });
  await atender(pedido({ acao: "recuperar", usuario: "espacojardim", destino: DESTINO }, ""), semConfirmar);
  assert.equal(semConfirmar.enviados.length, 0, "sem confirmar, não manda");
  assert.equal((await atender(pedido({ acao: "recuperar", usuario: "espacojardim", destino: "https://golpe.com/nova-senha" }, ""), d)).status, 400);
});

test("as peças: o código, o destino e o e-mail do link", () => {
  assert.match(novoCodigo(), /^\d{6}$/);
  assert.equal(novoCodigo(() => [7]), "000007");
  assert.equal(destinoValido("http://localhost:5190/nova-senha?x=1"), "http://localhost:5190/nova-senha");
  assert.equal(destinoValido("https://painel.renderizaweb.com.br/admin"), null);
  assert.match(emailDoLink('https://x/"><script>', "u").html, /%22><script>/, "o link não fecha o atributo");
});
