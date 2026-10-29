// Clientes (Missão 3, bloco A): filtros pela situação, próxima reserva, contato, prazo da entrega, linha do tempo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chipsDeClientes, filtrarClientes, reservasPorCliente, validarCliente, linhaDoCliente, normalizarInstagram, prazoDaEntrega, linhaDoTempo } from "../src/modulos/clientes/logica.js";
import { nicho } from "../src/nichos/index.js";

const SP = "America/Sao_Paulo";
const agora = Date.parse("2026-10-29T15:00:00Z");
const clientes = [
  { id: "a", nome: "Ana Souza", whatsapp: "11988887777", situacao: "reservado" },
  { id: "b", nome: "Bruno Lima", email: "bruno@exemplo.teste", situacao: "interessado" },
  { id: "c", nome: "Júlia & Caio", instagram: "julia.caio", situacao: "realizado" },
  { id: "d", nome: "Daniel", situacao: "reservado", arquivado_em: "2026-10-01T00:00:00Z" },
  { id: "e", nome: "Érica", situacao: null },
];

test("chips e filtros pela situação; arquivados à parte", () => {
  const chips = chipsDeClientes(clientes);
  assert.deepEqual(chips.map(c => [c.valor, c.quantos]), [["todos", 4], ["reservado", 1], ["interessado", 1], ["realizado", 1], ["nao_fechou", 0], ["arquivados", 1]]);
  assert.deepEqual(filtrarClientes(clientes, { grupo: "arquivados" }).map(c => c.id), ["d"]);
  assert.deepEqual(filtrarClientes(clientes, { busca: "julia" }).map(c => c.id), ["c"], "sem acento");
  assert.deepEqual(filtrarClientes(clientes, { busca: "@julia" }).map(c => c.id), ["c"], "Instagram com @");
  assert.deepEqual(filtrarClientes(clientes, { busca: "8887" }).map(c => c.id), ["a"], "parte do WhatsApp");
  assert.deepEqual(filtrarClientes(clientes, { busca: "bruno@" }).map(c => c.id), ["b"], "e-mail");
});

test("quem tem reserva marcada vem primeiro, pela data; o resto pelo nome", () => {
  const reservas = [
    { cliente_id: "b", inicio: "2026-12-01T22:00:00Z", fim: "2026-12-02T06:00:00Z", situacao: "pre_reserva" },
    { cliente_id: "a", inicio: "2026-11-01T22:00:00Z", fim: "2026-11-02T06:00:00Z", situacao: "confirmada" },
    { cliente_id: "a", inicio: "2027-01-01T22:00:00Z", fim: "2027-01-02T06:00:00Z", situacao: "confirmada" },
    { cliente_id: "c", inicio: "2026-05-01T22:00:00Z", fim: "2026-05-02T06:00:00Z", situacao: "realizada" },
    { cliente_id: "e", inicio: "2026-11-05T22:00:00Z", fim: "2026-11-06T06:00:00Z", situacao: "cancelada" },
  ];
  const { proxima, ultima } = reservasPorCliente(reservas, agora);
  assert.equal(proxima.a.inicio, "2026-11-01T22:00:00Z", "a mais perto");
  assert.equal(ultima.c.situacao, "realizada");
  assert.equal(proxima.e, undefined, "cancelada não conta");
  assert.deepEqual(filtrarClientes(clientes, { proxima }).map(c => c.id), ["a", "b", "e", "c"], "Ana (1/11), Bruno (1/12), depois Érica e Júlia pelo nome");
});

test("contato: valida e normaliza", () => {
  assert.deepEqual(validarCliente({ nome: " " }), { nome: "Digite o nome." });
  assert.ok(validarCliente({ nome: "X", whatsapp: "123" }).whatsapp);
  assert.ok(validarCliente({ nome: "X", email: "sem-arroba" }).email);
  assert.ok(validarCliente({ nome: "X", instagram: "com espaço" }).instagram);
  assert.deepEqual(validarCliente({ nome: "X", whatsapp: "(11) 98888-7777", email: "a@b.co", instagram: "@Julia.Caio" }), {});
  assert.equal(normalizarInstagram("https://www.instagram.com/Julia.Caio/"), "julia.caio");
  assert.deepEqual(linhaDoCliente({ nome: " Ana ", whatsapp: "+55 (11) 98888-7777", email: " A@B.CO ", instagram: "@Ana", origem: "qualquer" }),
    { nome: "Ana", whatsapp: "11988887777", email: "a@b.co", instagram: "ana", origem: null });
});

test("prazo da entrega", () => {
  const hoje = "2026-10-29";
  assert.deepEqual(prazoDaEntrega({ situacao: "edicao", prazo: "2026-10-28" }, hoje), { texto: "prazo passou", tom: "perigo" });
  assert.deepEqual(prazoDaEntrega({ situacao: "edicao", prazo: "2026-10-29" }, hoje), { texto: "prazo hoje", tom: "alerta" });
  assert.deepEqual(prazoDaEntrega({ situacao: "escolhendo", prazo: "2026-10-31" }, hoje), { texto: "prazo em 2 dias", tom: "alerta" });
  assert.deepEqual(prazoDaEntrega({ situacao: "escolhendo", prazo: "2026-11-20" }, hoje), { texto: "prazo em 22 dias", tom: "" });
  assert.equal(prazoDaEntrega({ situacao: "entregue", entregue_em: "2026-10-20" }, hoje).tom, "sucesso");
});

test("linha do tempo: tudo do cliente, do mais novo para o mais antigo; parcelas viram um item por reserva", () => {
  const itens = linhaDoTempo({
    pedidos: [{ id: "p", etapa: "fechado", criado_em: "2026-02-03T12:00:00Z", data_desejada: "2026-10-31", tipos_reserva: { nome: "Casamento" } }],
    reservas: [{ id: "r", inicio: "2026-10-31T22:00:00Z", situacao: "confirmada", tipos_reserva: { nome: "Casamento" } }],
    compromissos: [{ id: "v", tipo: "visita", inicio: "2026-03-10T17:00:00Z" }],
    contratos: [{ id: "k", situacao: "aceito", aceito_em: "2026-02-27T12:00:00Z", criado_em: "2026-02-20T12:00:00Z" }],
    parcelas: [
      { id: "1", reserva_id: "r", cliente_id: "a", descricao: "Sinal", valor: 1000, vence_em: "2026-03-01", pago_em: "2026-03-01" },
      { id: "2", reserva_id: "r", cliente_id: "a", descricao: "Parcela 2/2", valor: 2000, vence_em: "2026-11-01", pago_em: null },
    ],
  }, { fuso: SP, nicho: nicho("eventos"), moeda: v => `R$ ${v}` });
  assert.deepEqual(itens.map(i => i.tipo), ["parcela", "reserva", "compromisso", "contrato", "pedido"]);
  const pag = itens[0];
  assert.equal(pag.titulo, "Pagamentos · R$ 3000");
  assert.equal(pag.sub, "1 de 2 pagas · próxima vence dom, 01/11");
  assert.equal(pag.pago, false);
  assert.equal(pag.href, "/financeiro?reserva=r");
  assert.equal(itens[1].href, "/agenda?reserva=r");
  assert.equal(itens[4].href, "/atendimento?pedido=p");
});
