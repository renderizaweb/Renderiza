// Atendimento (Missão 3, bloco C): etapas, filtros, funil, de onde vêm, mensagem pronta, data livre, horário ao fechar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ETAPAS, etapasDoNicho, chipsDaLista, filtrar, funil, deOndeVem, mensagemDeResposta, dataLivre, horarioParaFechar, instantesDaReserva, chegou, resumoDoPedido, linhaDoNovoPedido } from "../src/modulos/atendimento/logica.js";
import { gruposDaEspera, mensagemDaVaga } from "../src/modulos/atendimento/espera.js";
import { nicho } from "../src/nichos/index.js";

const agora = Date.parse("2026-10-29T15:00:00Z");
const h = horas => new Date(agora - horas * 36e5).toISOString();
const ped = (id, etapa, extra = {}) => ({ id, etapa, origem: "whatsapp", criado_em: h(1), clientes: { nome: "Cliente " + id, whatsapp: "11988887777" }, ...extra });

test("as etapas do banco, com a visita só nos eventos", () => {
  assert.deepEqual(ETAPAS.map(e => e.id), ["novo", "em_conversa", "visita_marcada", "orcamento_enviado", "aguardando_sinal", "fechado", "perdido"]);
  assert.ok(etapasDoNicho("eventos").some(e => e.id === "visita_marcada"));
  assert.ok(!etapasDoNicho("fotografia").some(e => e.id === "visita_marcada"));
});

test("lista: abertos por padrão, novos em cima, busca por nome (sem acento) ou WhatsApp", () => {
  const pedidos = [ped("a", "em_conversa", { criado_em: h(1) }), ped("b", "novo", { criado_em: h(30) }), ped("c", "fechado"), ped("d", "perdido"),
    ped("e", "orcamento_enviado", { clientes: { nome: "Júlia Ramos", whatsapp: "11977776666" } })];
  assert.deepEqual(filtrar(pedidos).map(p => p.id), ["b", "a", "e"]);
  assert.deepEqual(filtrar(pedidos, { etapa: "fechado" }).map(p => p.id), ["c"]);
  assert.deepEqual(filtrar(pedidos, { etapa: "todas", busca: "julia" }).map(p => p.id), ["e"]);
  assert.deepEqual(filtrar(pedidos, { etapa: "todas", busca: "7776" }).map(p => p.id), ["e"]);
  const chips = chipsDaLista(pedidos, "eventos");
  assert.deepEqual(chips[0], { valor: "abertos", rotulo: "Abertos", quantos: 3 });
  assert.equal(chips.find(c => c.valor === "novo").quantos, 1);
});

test("funil dos 30 dias e de onde vêm (90 dias)", () => {
  const pedidos = [ped("a", "novo"), ped("b", "visita_marcada"), ped("c", "orcamento_enviado", { origem: "instagram" }), ped("d", "fechado", { origem: "agenda_online" }), ped("e", "fechado", { criado_em: h(24 * 40) })];
  const f = funil(pedidos, { agora, idNicho: "eventos" });
  assert.deepEqual(f.map(l => [l.id, l.n]), [["pedidos", 4], ["visita", 3], ["orcamento", 2], ["fechado", 1]]);
  assert.equal(f[1].pct, 75);
  assert.ok(!funil(pedidos, { agora, idNicho: "fotografia" }).some(l => l.id === "visita"));
  const o = deOndeVem(pedidos, { agora });
  assert.equal(o[0].id, "whatsapp");
  assert.equal(o.reduce((s, x) => s + x.n, 0), 5);
});

test("mensagem pronta, chegou por onde e o resumo da linha", () => {
  const p = ped("a", "novo", { origem: "indicacao", data_desejada: "2027-03-14", convidados: 120, tipos_reserva: { nome: "Casamento" }, clientes: { nome: "Juliana Souza" } });
  assert.equal(mensagemDeResposta(p, { conta: { nome: "Villa Alecrim" }, pessoa: { nome: "Marina Alves" }, nicho: nicho("eventos") }),
    "Oi, Juliana! Aqui é Marina, do espaço Villa Alecrim. Recebi o seu pedido para casamento em dom, 14/03. Podemos conversar?");
  assert.match(chegou(p, agora), /por indicação$/);
  assert.match(chegou({ ...p, origem: "agenda_online" }, agora), /pela agenda online$/);
  assert.equal(resumoDoPedido(p, nicho("eventos"), { hoje: "2026-10-29" }), "Casamento · dom, 14/03/27 · 120 convidados · Indicação");
  assert.equal(resumoDoPedido({ ...p, data_desejada: null }, nicho("fotografia")), "Casamento · data a combinar · Indicação");
});

test("data livre: a regra da agenda online (cancelada e pré-reserva vencida não seguram)", () => {
  const pedido = { id: "p1", reserva_id: "r-proprio" };
  const velha = new Date(agora - 50 * 36e5).toISOString();
  assert.deepEqual(dataLivre({ reservas: [], pedido, agora }), { livre: true });
  assert.equal(dataLivre({ reservas: [{ id: "r1", situacao: "confirmada", criado_em: velha }], pedido, agora }).livre, false);
  assert.equal(dataLivre({ reservas: [{ id: "r1", situacao: "cancelada", criado_em: velha }], pedido, agora }).livre, true);
  assert.equal(dataLivre({ reservas: [{ id: "r-proprio", situacao: "pre_reserva", criado_em: velha }], pedido, agora }).livre, true, "a reserva do próprio pedido não conta");
  assert.equal(dataLivre({ reservas: [{ id: "r2", situacao: "pre_reserva", criado_em: velha, pedido_id: "x" }], pedido, agora, origemDoPedido: () => "agenda_online" }).livre, true, "pré-reserva da agenda online vencida");
  assert.equal(dataLivre({ reservas: [{ id: "r2", situacao: "pre_reserva", criado_em: velha, pedido_id: "x" }], pedido, agora, origemDoPedido: () => "whatsapp" }).livre, false, "a feita pela equipe segura");
  assert.equal(dataLivre({ bloqueado: true, pedido, agora }).motivo, "fechada");
});

test("fechar: a hora pedida ou a do nicho, a duração do ensaio ou do nicho, no fuso", () => {
  assert.deepEqual(horarioParaFechar({ data_desejada: "2027-03-14" }, nicho("eventos")), { data: "2027-03-14", inicio: "19:00", duracao: 480 });
  assert.deepEqual(horarioParaFechar({ data_desejada: "2027-03-14", hora_desejada: "10:30:00", servicos: { duracao_min: 180 } }, nicho("fotografia")), { data: "2027-03-14", inicio: "10:30", duracao: 180 });
  assert.deepEqual(instantesDaReserva({ data: "2027-03-14", inicio: "19:00", duracao: 480 }, "America/Sao_Paulo"), { inicio: "2027-03-14T22:00:00.000Z", fim: "2027-03-15T06:00:00.000Z" });
});

test("novo pedido: só o que veio, origem padrão WhatsApp, convidados só número", () => {
  const l = linhaDoNovoPedido({ origem: "instagram", data_desejada: "2027-05-15", convidados: "150 pessoas", tipo_id: "t1", mensagem: "  oi  " }, { contaId: "c", cliente: { id: "k" }, idNicho: "eventos", responsavel: "p" });
  assert.deepEqual(l, { conta_id: "c", cliente_id: "k", data_desejada: "2027-05-15", hora_desejada: null, tipo_id: "t1", servico_id: null, convidados: 150, origem: "instagram", mensagem: "oi", responsavel_id: "p" });
  assert.equal(linhaDoNovoPedido({ origem: "qualquer" }, { contaId: "c", cliente: { id: "k" }, idNicho: "fotografia" }).origem, "whatsapp");
});

test("lista de espera: por campanha (as gerais por último), na ordem; a mensagem da vaga", () => {
  const linhas = [
    { id: 1, campanha_id: null, posicao: 0, criado_em: h(5), clientes: { nome: "Ana" } },
    { id: 2, campanha_id: "n", campanhas: { nome: "Mini sessão de Natal" }, posicao: 1, criado_em: h(2), clientes: { nome: "Bia" } },
    { id: 3, campanha_id: "n", campanhas: { nome: "Mini sessão de Natal" }, posicao: 0, criado_em: h(1), clientes: { nome: "Carla Dias" } },
  ];
  const g = gruposDaEspera(linhas);
  assert.equal(g[0].campanha.nome, "Mini sessão de Natal");
  assert.deepEqual(g[0].linhas.map(l => l.id), [3, 2]);
  assert.equal(g[1].campanha, null);
  assert.equal(mensagemDaVaga(linhas[2], "Estúdio Ciranda", nicho("fotografia")), "Oi, Carla! Abriu um horário na Mini sessão de Natal aqui no Estúdio Ciranda. Ainda tem interesse?");
});
