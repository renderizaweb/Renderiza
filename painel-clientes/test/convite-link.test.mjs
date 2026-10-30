// A função "aceitar-convite" (supabase/functions/aceitar-convite/logica.js; Missão 7, bloco B; D42): o link vale,
// a senha serve, cria o login ou troca a senha de quem já tem, e marca o link. O Supabase aqui é de mentira; o de
// verdade é conferido no STG (test/fluxos/piloto.fluxo.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, cabecalhosCors, senhaValida, traduzirErro } from "../supabase/functions/aceitar-convite/logica.js";

const CODIGO = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";
const agora = Date.parse("2026-10-30T12:00:00Z");
const CONVITE = { id: "c1", email: "espacojardim@acesso.renderizaweb.com.br", usuario: "espacojardim", nome: "Dona Jardim", expira_em: "2026-11-06T12:00:00Z", link_usado_em: null, cancelado_em: null };

function deps({ convite = CONVITE, login = null, falhar = null } = {}) {
  const chamadas = [];
  return {
    chamadas,
    convite: async codigo => (codigo === CODIGO ? convite : null),
    loginDoEmail: async email => { chamadas.push(["login?", email]); return login; },
    criarLogin: async (email, senha, nome) => { chamadas.push(["criar", email, senha, nome]); if (falhar) throw falhar; },
    trocarSenha: async (id, senha) => { chamadas.push(["trocar", id, senha]); if (falhar) throw falhar; },
    marcarUsado: async id => { chamadas.push(["usado", id]); },
  };
}
const pedido = corpo => ({ metodo: "POST", origem: "https://painel.renderizaweb.com.br", corpo, agora });

test("link válido e login novo: cria com o e-mail interno e a senha, marca o link e devolve o e-mail para entrar", async () => {
  const d = deps();
  const r = await atender(pedido({ codigo: CODIGO, senha: "jardim2026" }), d);
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, { email: CONVITE.email, usuario: "espacojardim", novo: true });
  assert.deepEqual(d.chamadas, [["login?", CONVITE.email], ["criar", CONVITE.email, "jardim2026", "Dona Jardim"], ["usado", "c1"]]);
});

test("quem já tem o usuário (link novo de quem esqueceu): troca a senha, não cria outro", async () => {
  const d = deps({ login: "u-123" });
  const r = await atender(pedido({ codigo: CODIGO, senha: "outrasenha9" }), d);
  assert.equal(r.status, 200);
  assert.equal(r.corpo.novo, false);
  assert.deepEqual(d.chamadas.map(c => c[0]), ["login?", "trocar", "usado"]);
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
