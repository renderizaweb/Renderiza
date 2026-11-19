// O uso do painel (19/11/2026): o contador do app (src/uso.js), um sinal por minuto só com o painel à vista e em uso,
// e as frases do Admin (src/admin/logica.js). As regras do banco estão em supabase/testes/091_uso_do_painel.sql.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ligarContadorDeUso, contaEsteMinuto, MINUTO, PARADO } from "../src/uso.js";
import { duracao, resumoDoUso, situacaoDoUso } from "../src/admin/logica.js";

function ambiente() {
  let agora = 1_000_000, tique = null;
  const ouvintes = {}, sinais = [];
  const doc = { visibilityState: "visible" };
  const janela = { addEventListener: (ev, fn) => { ouvintes[ev] = fn; } };
  const banco = { rpc: async (f, a) => { sinais.push([f, a]); } };
  const uso = ligarContadorDeUso(banco, { janela, doc, agora: () => agora, cada: (fn, ms) => { assert.equal(ms, MINUTO); tique = fn; } });
  return { uso, doc, sinais, mexer: ev => ouvintes[ev](), passar: async ms => { agora += ms; tique(); await new Promise(r => setTimeout(r, 0)); } };
}

test("o contador manda um sinal por minuto, com a conta e o módulo, só dentro de uma conta", async () => {
  const a = ambiente();
  await a.passar(MINUTO);
  assert.equal(a.sinais.length, 0, "fora de uma conta: nada");
  a.uso.onde("conta-1", "agenda");
  a.mexer("pointerdown");
  await a.passar(MINUTO);
  assert.deepEqual(a.sinais, [["registrar_uso", { conta: "conta-1", modulo: "agenda" }]]);
  a.uso.onde(null);
  await a.passar(MINUTO);
  assert.equal(a.sinais.length, 1, "saiu da conta (Admin, contas): para");
});

test("aba escondida ou parado há 5 minutos não conta; mexeu, volta a contar", async () => {
  const a = ambiente();
  a.uso.onde("conta-1", "clientes");
  a.mexer("keydown");
  a.doc.visibilityState = "hidden";
  await a.passar(MINUTO);
  assert.equal(a.sinais.length, 0, "aba escondida");
  a.doc.visibilityState = "visible";
  await a.passar(PARADO);
  assert.equal(a.sinais.length, 0, "painel aberto esquecido");
  a.mexer("wheel");
  await a.passar(MINUTO);
  assert.equal(a.sinais.length, 1);
  assert.ok(contaEsteMinuto({ visivel: true, ultimoMexer: 0, agora: PARADO - 1 }) && !contaEsteMinuto({ visivel: true, ultimoMexer: 0, agora: PARADO }));
});

test("o sinal que falha não atrapalha", async () => {
  let agora = 0, tique = null;
  const uso = ligarContadorDeUso({ rpc: () => { throw new Error("fora do ar"); } }, { janela: { addEventListener() {} }, doc: { visibilityState: "visible" }, agora: () => agora, cada: fn => { tique = fn; } });
  uso.onde("c", "agenda");
  agora += MINUTO;
  assert.doesNotThrow(() => tique());
  await new Promise(r => setTimeout(r, 0));
});

test("as frases do Admin: o tempo, o resumo e a situação de cada pessoa", () => {
  assert.equal(duracao(0), "nada");
  assert.equal(duracao(45), "45 min");
  assert.equal(duracao(60), "1 h");
  assert.equal(duracao(200), "3 h 20 min");
  const nome = id => ({ agenda: "Agenda", clientes: "Clientes", "meu-site": "Meu site" })[id] || id;
  assert.equal(resumoDoUso({ entradas: 5, minutos: 80, dias_com_uso: 3, modulos: [{ modulo: "agenda", minutos: 50 }, { modulo: "outro", minutos: 5 }, { modulo: "clientes", minutos: 25 }] }, nome),
    "5 entradas · 1 h 20 min de uso em 3 dias · mais em Agenda e Clientes");
  assert.equal(resumoDoUso({ entradas: 1, minutos: 0, dias_com_uso: 0, modulos: [] }), "1 entrada · sem tempo de uso contado");
  assert.equal(resumoDoUso({ entradas: 0, minutos: 0, modulos: [] }), "0 entradas");
  const t = Date.parse("2026-11-19T12:00:00Z");
  assert.equal(situacaoDoUso({ visto_em: "2026-11-19T11:55:00Z", primeira_entrada: "2026-11-18T10:00:00Z" }, t), "usando agora");
  assert.equal(situacaoDoUso({ visto_em: null, primeira_entrada: null }, t), "criou o acesso, mas ainda não entrou");
  assert.match(situacaoDoUso({ visto_em: "2026-11-18T12:00:00Z", primeira_entrada: "2026-11-18T12:00:00Z" }, t), /^último acesso /);
});
