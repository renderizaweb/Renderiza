// A assinatura (13-assinatura.md): o valor, o dia do vencimento, a situação de hoje e o extrato mês a mês.
import { test } from "node:test";
import assert from "node:assert/strict";
import { valorDoMes, diaDoVencimento, situacaoDaAssinatura, extrato } from "../src/modulos/assinatura/logica.js";

const CATALOGO = ["agenda", "clientes", "atendimento", "estoque", "meu-site"].map(id => ({ id, preco: 14.99 }));
const RICARDO = { valor: null, dia: 26, inicio: "2026-12-26" };

test("o valor: o combinado ou o do plano (R$ 49 com 2 módulos; o Meu site não conta)", () => {
  assert.equal(valorDoMes(RICARDO, ["meu-site", "estoque"], CATALOGO), 49);
  assert.equal(valorDoMes(RICARDO, ["meu-site", "estoque", "agenda", "clientes"], CATALOGO), 63.99, "um a mais");
  assert.equal(valorDoMes({ ...RICARDO, valor: "39.90" }, ["meu-site", "estoque"], CATALOGO), 39.9, "o combinado vale");
  assert.equal(valorDoMes(null, ["estoque"], CATALOGO), 49);
});

test("o dia do vencimento: o combinado ou o da primeira mensalidade", () => {
  assert.equal(diaDoVencimento(RICARDO), 26);
  assert.equal(diaDoVencimento({ inicio: "2027-01-10" }), 10);
  assert.equal(diaDoVencimento({}), null);
});

test("a situação de hoje: a combinar, antes da primeira, em dia, vence logo, vence hoje, atrasada", () => {
  assert.equal(situacaoDaAssinatura(null, [], "2026-11-26").estado, "a-combinar");
  assert.deepEqual(situacaoDaAssinatura(RICARDO, [], "2026-11-26"), { estado: "comeca", vencimento: "2026-12-26", mes: "2026-12-01", dias: 30 });
  assert.deepEqual(situacaoDaAssinatura(RICARDO, [], "2026-12-23"), { estado: "comeca", vencimento: "2026-12-26", mes: "2026-12-01", dias: 3 });
  assert.equal(situacaoDaAssinatura(RICARDO, [], "2026-12-26").estado, "vence-hoje");
  assert.deepEqual(situacaoDaAssinatura(RICARDO, [], "2026-12-30"), { estado: "atrasada", vencimento: "2026-12-26", mes: "2026-12-01", dias: 4, meses: 1 });
  const dezPago = [{ mes: "2026-12-01", valor: 49, pago_em: "2026-12-26" }];
  assert.deepEqual(situacaoDaAssinatura(RICARDO, dezPago, "2026-12-30"), { estado: "em-dia", vencimento: "2027-01-26", mes: "2027-01-01", dias: 27 });
  assert.equal(situacaoDaAssinatura(RICARDO, dezPago, "2027-01-22").estado, "vence-logo");
  const doisAbertos = situacaoDaAssinatura(RICARDO, [], "2027-02-01");
  assert.equal(doisAbertos.estado, "atrasada");
  assert.equal(doisAbertos.meses, 2, "dezembro e janeiro em aberto");
  assert.equal(doisAbertos.vencimento, "2026-12-26", "conta do mais antigo");
  const adiantado = [...dezPago, { mes: "2027-01-01", valor: 49, pago_em: "2026-12-26" }];
  assert.equal(situacaoDaAssinatura(RICARDO, adiantado, "2027-01-20").vencimento, "2027-02-26", "pago adiantado: a próxima é a de fevereiro");
});

test("o extrato: do mais novo ao mais antigo, até a próxima mensalidade, com os pagos fora do combinado", () => {
  const pagos = [{ mes: "2026-12-01", valor: 49, pago_em: "2026-12-27" }];
  const linhas = extrato(RICARDO, pagos, "2027-02-02");
  assert.deepEqual(linhas.map(l => [l.mes, l.vencimento, l.estado]), [
    ["2027-02-01", "2027-02-26", "a-vencer"], ["2027-01-01", "2027-01-26", "em-aberto"], ["2026-12-01", "2026-12-26", "pago"],
  ]);
  assert.equal(linhas[2].pagamentos[0].pago_em, "2026-12-27");
  assert.deepEqual(extrato(null, pagos, "2027-02-02").map(l => [l.mes, l.estado]), [["2026-12-01", "pago"]], "sem combinado: só os pagos");
  assert.deepEqual(extrato(RICARDO, [], "2026-11-26").map(l => [l.mes, l.estado]), [["2026-12-01", "a-vencer"]], "antes da primeira: só ela");
  const antigo = extrato(RICARDO, [{ mes: "2026-11-01", valor: 49, pago_em: "2026-11-20" }], "2026-11-26");
  assert.deepEqual(antigo.map(l => [l.mes, l.estado]), [["2026-12-01", "a-vencer"], ["2026-11-01", "pago"]], "um pagamento antes do combinado aparece");
});

test("a primeira no dia 31: nos meses mais curtos, vence no último dia", () => {
  const a = { inicio: "2027-01-31" };
  assert.deepEqual(extrato(a, [{ mes: "2027-01-01", valor: 49, pago_em: "2027-01-31" }], "2027-02-10").map(l => l.vencimento), ["2027-02-28", "2027-01-31"]);
  assert.equal(situacaoDaAssinatura(a, [{ mes: "2027-01-01", valor: 49, pago_em: "2027-01-31" }], "2027-03-01").vencimento, "2027-02-28");
});
