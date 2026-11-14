// Financeiro (Missão 3, bloco D): situação e vencimento da parcela, números do mês, filtros, "Lançar parcelas",
// lembrete, mês a mês e o que mais vende.
import { test } from "node:test";
import assert from "node:assert/strict";
import { situacaoDaParcela, textoDoVencimento, resumo, chipsDeParcelas, filtrarParcelas, planoDeParcelas, mensagemDeLembrete, mesAMes, maisVendidos,
  opcoesDoQueE, dinheiroDaReserva, sugestaoDoValor, periodos, noPeriodo, recortar, clientesDasParcelas } from "../src/modulos/financeiro/logica.js";
import { nicho } from "../src/nichos/index.js";

const SP = "America/Sao_Paulo";
const hoje = "2026-10-29";
const parcelas = [
  { id: "a", cliente_id: "c1", reserva_id: "r1", descricao: "Sinal", valor: 1000, vence_em: "2026-10-05", pago_em: "2026-10-05", clientes: { nome: "Ana Souza" } },
  { id: "b", cliente_id: "c1", reserva_id: "r1", descricao: "Parcela 1/2", valor: 500, vence_em: "2026-10-20", pago_em: null, clientes: { nome: "Ana Souza" } },
  { id: "c", cliente_id: "c2", reserva_id: "r2", descricao: "Parcela 2/2", valor: 750.5, vence_em: "2026-10-29", pago_em: null, clientes: { nome: "Júlia & Caio" } },
  { id: "d", cliente_id: "c2", reserva_id: "r2", descricao: "Restante", valor: 300, vence_em: "2026-11-15", pago_em: null, clientes: { nome: "Júlia & Caio" } },
  { id: "e", cliente_id: "c3", reserva_id: null, descricao: "Ensaio extra", valor: 200, vence_em: "2026-12-20", pago_em: null, clientes: { nome: "Bruno" } },
  { id: "f", cliente_id: "c3", reserva_id: null, descricao: "Álbum", valor: 400, vence_em: "2026-09-10", pago_em: "2026-09-12", clientes: { nome: "Bruno" } },
];

test("situação e texto do vencimento", () => {
  assert.deepEqual(parcelas.map(p => situacaoDaParcela(p, hoje)), ["paga", "atrasada", "hoje", "aberta", "aberta", "paga"]);
  assert.equal(textoDoVencimento(parcelas[1], hoje, SP), "atrasada há 9 dias");
  assert.equal(textoDoVencimento({ vence_em: "2026-10-28" }, hoje, SP), "atrasada desde ontem");
  assert.equal(textoDoVencimento(parcelas[2], hoje, SP), "vence hoje");
  assert.equal(textoDoVencimento({ vence_em: "2026-10-30" }, hoje, SP), "vence amanhã");
  assert.equal(textoDoVencimento(parcelas[3], hoje, SP), "vence em 17 dias");
  assert.match(textoDoVencimento(parcelas[4], hoje, SP), /^vence \S+, 20\/12$/, "longe: a data");
  assert.match(textoDoVencimento(parcelas[0], hoje, SP), /^recebido em \S+, 05\/10$/);
});

test("números do mês: recebido, falta no mês, 30 dias, atrasadas", () => {
  assert.deepEqual(resumo(parcelas, hoje), { recebidoNoMes: 1000, faltaNoMes: 750.5, aReceber30: 1050.5, quantasEm30: 2, atrasadas: 500, quantasAtrasadas: 1 });
  assert.deepEqual(resumo([], hoje), { recebidoNoMes: 0, faltaNoMes: 0, aReceber30: 0, quantasEm30: 0, atrasadas: 0, quantasAtrasadas: 0 });
});

test("chips e filtros: a receber pelo vencimento, recebidas da mais recente, busca e cliente", () => {
  assert.deepEqual(chipsDeParcelas(parcelas, hoje).map(c => [c.valor, c.quantos]), [["receber", 4], ["atrasadas", 1], ["recebidas", 2], ["todas", 6]]);
  assert.deepEqual(filtrarParcelas(parcelas, { hoje }).map(p => p.id), ["b", "c", "d", "e"]);
  assert.deepEqual(filtrarParcelas(parcelas, { grupo: "atrasadas", hoje }).map(p => p.id), ["b"]);
  assert.deepEqual(filtrarParcelas(parcelas, { grupo: "recebidas", hoje }).map(p => p.id), ["a", "f"]);
  assert.deepEqual(filtrarParcelas(parcelas, { grupo: "todas", busca: "julia", hoje }).map(p => p.id), ["c", "d"], "sem acento");
  assert.deepEqual(filtrarParcelas(parcelas, { grupo: "todas", busca: "album", hoje }).map(p => p.id), ["f"], "pela descrição");
  assert.deepEqual(filtrarParcelas(parcelas, { grupo: "todas", cliente: "c3", hoje }).map(p => p.id), ["f", "e"]);
  assert.deepEqual(filtrarParcelas(parcelas, { grupo: "todas", reserva: "r2", hoje }).map(p => p.id), ["c", "d"]);
});

test("Lançar parcelas: sinal primeiro, centavos na última, mês a mês e fim de mês", () => {
  const plano = planoDeParcelas({ total: 18000, sinal: 5000, vezes: 3, primeira: "2026-11-28", vencimentoDoSinal: "2026-10-29" });
  assert.deepEqual(plano, [
    { descricao: "Sinal", valor: 5000, vence_em: "2026-10-29" },
    { descricao: "Parcela 1/3", valor: 4333.33, vence_em: "2026-11-28" },
    { descricao: "Parcela 2/3", valor: 4333.33, vence_em: "2026-12-28" },
    { descricao: "Parcela 3/3", valor: 4333.34, vence_em: "2027-01-28" },
  ]);
  assert.equal(Math.round(plano.reduce((t, l) => t + l.valor, 0) * 100), 1800000, "a soma fecha no total");
  assert.deepEqual(planoDeParcelas({ total: 900, vezes: 3, primeira: "2027-01-31" }).map(l => l.vence_em), ["2027-01-31", "2027-02-28", "2027-03-31"], "dia 31 vira o último dia do mês");
  assert.deepEqual(planoDeParcelas({ total: 1200, vezes: 1, primeira: "2026-12-10" }), [{ descricao: "Restante", valor: 1200, vence_em: "2026-12-10" }]);
  assert.deepEqual(planoDeParcelas({ total: 500, sinal: 800, vezes: 2, primeira: "2026-12-10", vencimentoDoSinal: "2026-11-01" }), [{ descricao: "Sinal", valor: 500, vence_em: "2026-11-01" }], "sinal maior que o total: só o sinal");
  assert.equal(planoDeParcelas({ total: 100, vezes: "abc", primeira: "2026-12-10" }).length, 1, "vezes inválido vira 1");
  assert.equal(planoDeParcelas({ total: 100, vezes: 999, primeira: "2026-12-10" }).length, 48, "no máximo 48");
});

test("lembrete pelo WhatsApp: primeiro nome, negócio, valor e quando, sem cobrar", () => {
  const eventos = nicho("eventos");
  const atrasada = mensagemDeLembrete(parcelas[1], { conta: { nome: "Villa Alecrim" }, nicho: eventos, hoje, fuso: SP });
  assert.match(atrasada, /^Oi, Ana! Aqui é do espaço Villa Alecrim\./);
  assert.match(atrasada, /R\$ 500 \(Parcela 1\/2\) que venceu em \S+, 20\/10\./);
  assert.match(mensagemDeLembrete(parcelas[2], { conta: { nome: "Villa Alecrim" }, nicho: eventos, hoje, fuso: SP }), /que vence hoje\./);
  assert.match(mensagemDeLembrete({ ...parcelas[3], clientes: null }, { conta: null, nicho: eventos, hoje, fuso: SP }), /^Oi! Aqui é do espaço\. .*que vence em \S+, 15\/11\./);
});

test("mês a mês: recebido pelo mês em que entrou, previsto pelo vencimento", () => {
  const meses = mesAMes(parcelas, hoje, { antes: 2, depois: 2 });
  assert.deepEqual(meses.map(m => m.mes), ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
  assert.deepEqual(meses.map(m => [m.recebido, m.previsto]), [[0, 0], [400, 0], [1000, 1250.5], [0, 300], [0, 200]]);
  assert.deepEqual(meses.map(m => (m.atual ? "atual" : m.futuro ? "futuro" : "passado")), ["passado", "passado", "atual", "futuro", "futuro"]);
  assert.deepEqual(mesAMes([], "2027-01-15", { antes: 1, depois: 0 }).map(m => m.mes), ["2026-12", "2027-01"], "vira o ano");
});

test("o que mais vende: pelo tipo, com desconto, lista ou objeto, sem as canceladas", () => {
  const reservas = [
    { situacao: "confirmada", tipos_reserva: { nome: "Casamento" }, reservas_valores: [{ valor_total: 20000, desconto: 1000 }] },
    { situacao: "confirmada", tipos_reserva: { nome: "Casamento" }, reservas_valores: { valor_total: 18000, desconto: null } },
    { situacao: "pre_reserva", tipos_reserva: { nome: "15 anos" }, reservas_valores: [{ valor_total: 9000 }] },
    { situacao: "cancelada", tipos_reserva: { nome: "15 anos" }, reservas_valores: [{ valor_total: 50000 }] },
    { situacao: "confirmada", servicos: { nome: "Ensaio gestante" }, reservas_valores: [] },
  ];
  assert.deepEqual(maisVendidos(reservas), [{ nome: "Casamento", n: 2, total: 37000 }, { nome: "15 anos", n: 1, total: 9000 }]);
});

test("o que é: a lista, com a descrição que já existe e o Outro", () => {
  assert.deepEqual(opcoesDoQueE(""), ["Sinal", "Restante", "Pagamento total", "Parcela", "Outro"]);
  assert.deepEqual(opcoesDoQueE("Sinal"), ["Sinal", "Restante", "Pagamento total", "Parcela", "Outro"]);
  assert.deepEqual(opcoesDoQueE("Parcela 2/6")[0], "Parcela 2/6", "ao editar, a descrição de agora fica escolhida");
});

test("valor sugerido: pelo ensaio em Serviços, o restante depois do sinal, e nada sem total", () => {
  const newborn = { valor: 500, sinal: 150 };
  // nada pago: o sinal do ensaio
  let d = dinheiroDaReserva({ valores: null, servico: newborn, parcelas: [] });
  assert.deepEqual([d.total, d.sinal, d.recebido, d.doServico], [500, 150, 0, true]);
  let s = sugestaoDoValor(d, { jaRecebido: true, nome: "Newborn" });
  assert.deepEqual([s.tipo, s.valor], ["Sinal", 150]);
  assert.match(s.texto, /^Newborn: R\$ 500 \(valor em Serviços\), com sinal de R\$ 150\. Nada entrou ainda\.$/);
  assert.deepEqual(s.porTipo, { "Pagamento total": 500, Restante: 500, Sinal: 150 });
  // sinal pago: o restante, com a frase do porquê
  const sinalPago = { descricao: "Sinal", valor: 150, vence_em: "2026-10-01", pago_em: "2026-10-01" };
  d = dinheiroDaReserva({ servico: newborn, parcelas: [sinalPago] });
  s = sugestaoDoValor(d, { jaRecebido: true, nome: "Newborn" });
  assert.deepEqual([s.tipo, s.valor], ["Restante", 350]);
  assert.match(s.texto, /Já entrou R\$ 150 \(Sinal\): falta R\$ 350\.$/);
  // os valores da reserva valem mais que os de Serviços (com o desconto)
  d = dinheiroDaReserva({ valores: [{ valor_total: 600, sinal: null, desconto: 50 }], servico: newborn, parcelas: [] });
  assert.deepEqual([d.total, d.sinal, d.doServico], [550, null, false]);
  s = sugestaoDoValor(d, { jaRecebido: true });
  assert.deepEqual([s.tipo, s.valor], ["Pagamento total", 550]);
  // nova parcela olha o que já tem parcela (paga ou não)
  const aberta = { descricao: "Restante", valor: 350, vence_em: "2026-11-20", pago_em: null };
  d = dinheiroDaReserva({ servico: newborn, parcelas: [sinalPago, aberta] });
  assert.deepEqual(d.abertas.map(p => p.descricao), ["Restante"]);
  assert.equal(sugestaoDoValor(d, { jaRecebido: false }).valor, null, "as parcelas já somam o total");
  assert.equal(sugestaoDoValor(d, { jaRecebido: true }).valor, 350, "registrar: falta o que não entrou");
  // tudo pago; sem valor nenhum
  d = dinheiroDaReserva({ servico: newborn, parcelas: [sinalPago, { ...aberta, pago_em: "2026-11-01" }] });
  assert.match(sugestaoDoValor(d, { jaRecebido: true }).texto, /Já entrou tudo/);
  assert.equal(sugestaoDoValor(dinheiroDaReserva({ servico: { valor: null } }), { jaRecebido: true }), null);
});

test("filtros: período (últimos 30 dias, próximos 30, mês, tudo), cliente e forma", () => {
  // recebida conta pela data em que entrou; a receber, pelo vencimento
  assert.deepEqual(parcelas.filter(p => noPeriodo(p, "30d", hoje)).map(p => p.id), ["a", "b", "c"]);
  assert.deepEqual(parcelas.filter(p => noPeriodo(p, "prox30", hoje)).map(p => p.id), ["c", "d"]);
  assert.deepEqual(parcelas.filter(p => noPeriodo(p, "mes:2026-09", hoje)).map(p => p.id), ["f"]);
  assert.equal(parcelas.filter(p => noPeriodo(p, "tudo", hoje)).length, 6);
  const op = periodos(parcelas, hoje).map(o => o.valor);
  assert.deepEqual(op, ["30d", "prox30", "mes:2026-12", "mes:2026-11", "mes:2026-10", "mes:2026-09", "tudo"]);
  assert.match(periodos(parcelas, hoje).find(o => o.valor === "mes:2026-10").rotulo, /^Este mês · outubro de 2026$/);
  assert.deepEqual(recortar(parcelas, { periodo: "tudo", cliente: "c3", hoje }).map(p => p.id), ["e", "f"]);
  assert.deepEqual(recortar([{ ...parcelas[0], forma: "pix" }, parcelas[1]], { periodo: "tudo", forma: "pix", hoje }).map(p => p.id), ["a"]);
  assert.deepEqual(clientesDasParcelas(parcelas).map(c => c.nome), ["Ana Souza", "Bruno", "Júlia & Caio"]);
});
