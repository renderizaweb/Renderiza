// Início (Missão 3, bloco F): "Para fazer agora" (a ordem e o próximo passo), os números de cada módulo e "O que a
// equipe fez" em frases.
import { test } from "node:test";
import assert from "node:assert/strict";
import { saudacao, paraFazerAgora, numeros, frase } from "../src/modulos/inicio/logica.js";
import { nicho } from "../src/nichos/index.js";

const SP = "America/Sao_Paulo";
const hoje = "2026-10-29";
const agora = Date.parse("2026-10-29T15:00:00Z");
const eventos = nicho("eventos");

test("saudação pela hora", () => {
  assert.deepEqual([3, 8, 13, 20].map(saudacao), ["Boa noite", "Bom dia", "Boa tarde", "Boa noite"]);
});

test("para fazer agora: atrasadas, pedidos novos, vence hoje ou amanhã, contratos esperando, hoje e amanhã", () => {
  const itens = paraFazerAgora({
    parcelas: [
      { id: "p1", descricao: "Parcela 2/3", valor: 1500, vence_em: "2026-10-20", pago_em: null, clientes: { nome: "Ana" } },
      { id: "p2", descricao: "Sinal", valor: 500, vence_em: "2026-10-29", pago_em: null, clientes: { nome: "Bia" } },
      { id: "p3", descricao: "Restante", valor: 900, vence_em: "2026-10-30", pago_em: null, clientes: { nome: "Caio" } },
      { id: "p4", descricao: "Pago", valor: 900, vence_em: "2026-10-10", pago_em: "2026-10-10", clientes: { nome: "Davi" } },
      { id: "p5", descricao: "Longe", valor: 900, vence_em: "2026-12-10", pago_em: null, clientes: { nome: "Eva" } },
    ],
    pedidos: [
      { id: "n2", etapa: "novo", origem: "instagram", criado_em: "2026-10-29T12:00:00Z", clientes: { nome: "Gabi" } },
      { id: "n1", etapa: "novo", origem: "agenda_online", criado_em: "2026-10-28T12:00:00Z", data_desejada: "2026-12-12", clientes: { nome: "Fabi" } },
      { id: "n3", etapa: "em_conversa", origem: "whatsapp", criado_em: "2026-10-20T12:00:00Z", clientes: { nome: "Hugo" } },
    ],
    contratos: [{ id: "c1", situacao: "enviado", enviado_em: "2026-10-22T12:00:00Z", clientes: { nome: "Isa" } }, { id: "c2", situacao: "aceito", clientes: { nome: "Juca" } }],
    reservas: [
      { id: "r1", inicio: "2026-10-29T22:00:00Z", situacao: "confirmada", tipos_reserva: { nome: "Casamento" }, clientes: { nome: "Lia & Leo" } },
      { id: "r2", inicio: "2026-10-30T22:00:00Z", situacao: "pre_reserva", tipos_reserva: { nome: "15 anos" }, clientes: { nome: "Mel" } },
      { id: "r3", inicio: "2026-10-30T20:00:00Z", situacao: "cancelada", clientes: { nome: "Nina" } },
    ],
    compromissos: [{ id: "v1", tipo: "visita", inicio: "2026-10-29T17:00:00Z", clientes: { nome: "Olga" } }, { id: "v2", tipo: "visita", titulo: "Visita · Rui", inicio: "2026-10-31T17:00:00Z", clientes: { nome: "Rui" } }],
  }, { hoje, fuso: SP, agora, nicho: eventos });
  assert.deepEqual(itens.map(i => i.id), ["parcela-p1", "pedido-n1", "pedido-n2", "parcela-p2", "parcela-p3", "contrato-c1", "compromisso-v1", "reserva-r1", "reserva-r2"]);
  const porId = Object.fromEntries(itens.map(i => [i.id, i]));
  assert.equal(porId["parcela-p1"].sub, "Parcela 2/3 · atrasada há 9 dias");
  assert.deepEqual(porId["parcela-p1"].acao, { rotulo: "Recebi", tipo: "recebi", id: "p1" });
  assert.match(porId["pedido-n1"].sub, /^chegou ontem · pela agenda online · para \S+, 12\/12$/);
  assert.equal(porId["pedido-n1"].href, "/atendimento?pedido=n1");
  assert.equal(porId["parcela-p3"].sub, "Restante · vence amanhã");
  assert.equal(porId["contrato-c1"].sub, "esperando o aceite há 7 dias");
  assert.deepEqual([porId["compromisso-v1"].sub, porId["reserva-r1"].sub, porId["reserva-r2"].sub], ["Hoje, 14h", "Hoje, 19h", "Amanhã, 19h · pré-reserva"]);
  assert.equal(porId["reserva-r1"].titulo, "Casamento · Lia & Leo");
  assert.equal(porId["compromisso-v1"].titulo, "Visita · Olga");
  assert.deepEqual(paraFazerAgora({}, { hoje, fuso: SP, agora, nicho: eventos }), [], "nada: tudo em dia");
});

test("os números: só dos módulos que a pessoa vê, no máximo 4", () => {
  const dados = {
    reservasDoMes: [{ inicio: "2026-10-03T22:00:00Z", situacao: "realizada" }, { inicio: "2026-10-31T22:00:00Z", situacao: "confirmada" }, { inicio: "2026-10-20T22:00:00Z", situacao: "cancelada" }],
    pedidosDaSemana: [{ etapa: "novo" }, { etapa: "em_conversa" }, { etapa: "novo" }],
    resumoFinanceiro: { recebidoNoMes: 12000, faltaNoMes: 3000, aReceber30: 8000, quantasAtrasadas: 1 },
    contratos: [{ situacao: "enviado" }, { situacao: "aceito", aceito_em: "2026-10-05T12:00:00Z" }, { situacao: "aceito", aceito_em: "2026-09-05T12:00:00Z" }],
  };
  const todos = numeros(dados, { hoje, fuso: SP, agora, nicho: eventos, pode: () => true });
  assert.deepEqual(todos.map(n => [n.id, n.valor, n.sub]), [
    ["agenda", "2", "1 já foi · 1 pela frente"],
    ["recebido", "R$ 12.000", "falta R$ 3.000 no mês"],
    ["receber", "R$ 8.000", "1 atrasada"],
    ["pedidos", "3", "2 esperando resposta"],
  ]);
  assert.equal(todos[0].rotulo, "Festas no mês");
  const soAgenda = numeros(dados, { hoje, fuso: SP, agora, nicho: nicho("fotografia"), pode: m => m === "agenda" || m === "contratos" });
  assert.deepEqual(soAgenda.map(n => [n.rotulo, n.valor, n.sub]), [["Ensaios no mês", "2", "1 já foi · 1 pela frente"], ["Contratos esperando aceite", "1", "1 aceito no mês"]]);
});

test("o que a equipe fez: frases sem valores, com quem fez", () => {
  const f = (a, extra = {}) => frase(a, { nicho: eventos, cliente: "Isabela Martins", pessoa: "Rafael Costa", ...extra });
  assert.deepEqual(f({ tabela: "contratos", acao: "mudou", detalhe: { situacao: ["orcamento", "enviado"] } }), { quem: "Rafael", texto: "mandou o contrato para Isabela Martins" });
  assert.deepEqual(f({ tabela: "contratos", acao: "mudou", detalhe: { situacao: ["enviado", "aceito"] } }, { pessoa: null }), { quem: "", texto: "Isabela Martins aceitou o contrato pelo link" });
  assert.equal(f({ tabela: "parcelas", acao: "mudou", detalhe: { pago: true } }).texto, "registrou um pagamento de Isabela Martins");
  assert.equal(f({ tabela: "pedidos", acao: "mudou", detalhe: { etapa: ["novo", "visita_marcada"] } }).texto, "passou Isabela Martins para visita marcada");
  assert.deepEqual(f({ tabela: "pedidos", acao: "criou", detalhe: {} }, { pessoa: null }), { quem: "", texto: "Chegou um pedido de Isabela Martins" });
  assert.equal(f({ tabela: "reservas", acao: "mudou", detalhe: { situacao: ["pre_reserva", "confirmada"] } }).texto, "confirmou a festa de Isabela Martins");
  assert.equal(frase({ tabela: "reservas", acao: "criou", detalhe: {} }, { nicho: nicho("fotografia"), cliente: "Ana", pessoa: "Duda" }).texto, "reservou o ensaio de Ana");
  assert.equal(f({ tabela: "clientes", acao: "mudou", detalhe: { arquivado: true } }).texto, "arquivou Isabela Martins");
  assert.deepEqual(f({ tabela: "compromissos", acao: "criou", detalhe: {}, pelo_suporte: true }, { pessoa: null }), { quem: "Suporte da Renderiza", texto: "marcou um compromisso com Isabela Martins" });
});
