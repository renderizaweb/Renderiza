// A função "convidar" (supabase/functions/convidar/logica.js): quem pode, para onde volta, e-mail novo ou que já tem
// login. O Supabase aqui é de mentira; a de verdade é conferida no STG.
import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, destinoPermitido, cabecalhosCors, traduzirErro } from "../supabase/functions/convidar/logica.js";

const ID = "6f1c2e7a-1b2c-4d3e-8f90-123456789abc";
const DESTINO = "https://painel.renderizaweb.com.br/convite";
const agora = Date.parse("2026-10-29T12:00:00Z");

function deps({ convite = { id: ID, email: "rafael@villa.teste", nome: "Rafael", expira_em: "2026-11-05T12:00:00Z", nome_da_conta: "Villa Alecrim" }, jaExiste = false, falhar = null } = {}) {
  const chamadas = [];
  return {
    chamadas,
    usuario: async token => (token === "valido" ? { id: "u1" } : null),
    convite: async (token, id) => (id === ID ? convite : null),
    convidar: async (email, dados, destino) => { chamadas.push(["convidar", email, dados, destino]); if (falhar) throw falhar; return { jaExiste }; },
    mandarAcesso: async (email, destino) => { chamadas.push(["acesso", email, destino]); },
  };
}
const pedido = (corpo, extra = {}) => ({ metodo: "POST", origem: "https://painel.renderizaweb.com.br", token: "valido", corpo, agora, ...extra });

test("só endereços do painel, na tela /convite", () => {
  assert.ok(destinoPermitido("https://painel.renderizaweb.com.br/convite"));
  assert.ok(destinoPermitido("https://renderiza-painel-clientes-git-x-renderiza.vercel.app/convite"));
  assert.ok(destinoPermitido("http://localhost:5180/convite"));
  assert.ok(!destinoPermitido("https://painel.renderizaweb.com.br.golpe.com/convite"));
  assert.ok(!destinoPermitido("https://painel.renderizaweb.com.br/entrar"));
  assert.ok(!destinoPermitido("javascript:alert(1)"));
  assert.equal(cabecalhosCors("https://golpe.com")["Access-Control-Allow-Origin"], "https://painel.renderizaweb.com.br");
  assert.equal(cabecalhosCors("http://localhost:5180")["Access-Control-Allow-Origin"], "http://localhost:5180");
});

test("e-mail novo: o convite do Auth, com o nome da conta, de volta para /convite", async () => {
  const d = deps();
  const r = await atender(pedido({ convite: ID, destino: DESTINO }), d);
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, { enviado: "convite" });
  assert.deepEqual(d.chamadas, [["convidar", "rafael@villa.teste", { nome_da_conta: "Villa Alecrim", nome: "Rafael" }, DESTINO]]);
});

test("e-mail que já tem login: o link de acesso, direto para o painel", async () => {
  const d = deps({ jaExiste: true });
  const r = await atender(pedido({ convite: ID, destino: DESTINO }), d);
  assert.deepEqual(r.corpo, { enviado: "acesso" });
  assert.deepEqual(d.chamadas[1], ["acesso", "rafael@villa.teste", "https://painel.renderizaweb.com.br/"]);
});

test("o que barra", async () => {
  assert.equal((await atender(pedido({ convite: ID, destino: DESTINO }, { token: "" }), deps())).status, 401);
  assert.equal((await atender(pedido({ convite: ID, destino: DESTINO }, { token: "vencido" }), deps())).status, 401);
  assert.equal((await atender(pedido({ convite: "x", destino: DESTINO }), deps())).status, 400);
  assert.equal((await atender(pedido({ convite: ID, destino: "https://golpe.com/convite" }), deps())).status, 400);
  assert.equal((await atender(pedido({ convite: "6f1c2e7a-1b2c-4d3e-8f90-000000000000", destino: DESTINO }), deps())).status, 404, "a RLS não deixou ler: não manda");
  assert.equal((await atender(pedido({ convite: ID, destino: DESTINO }), deps({ convite: { id: ID, email: "a@b.c", aceito_em: "2026-10-01" } }))).status, 409);
  assert.equal((await atender(pedido({ convite: ID, destino: DESTINO }), deps({ convite: { id: ID, email: "a@b.c", expira_em: "2026-10-01T00:00:00Z" } }))).corpo.erro, "Esse convite venceu. Use “Reenviar”.");
  assert.equal((await atender({ metodo: "OPTIONS", origem: "http://localhost:5180" }, deps())).status, 204);
  assert.equal((await atender({ metodo: "GET" }, deps())).status, 405);
  const falha = await atender(pedido({ convite: ID, destino: DESTINO }), deps({ falhar: { status: 429, message: "Email rate limit exceeded" } }));
  assert.equal(falha.status, 502);
  assert.match(falha.corpo.erro, /Muitos e-mails/);
  assert.equal(traduzirErro(new Error("boom interno")), "O e-mail não saiu agora. Tente de novo em alguns minutos.", "nada de detalhe técnico");
});
