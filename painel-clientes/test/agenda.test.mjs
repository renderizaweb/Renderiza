// Agenda (Missão 3, bloco B): calendário, itens do dia, conflito de horário, horários livres, campanhas, Stories.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gradeDoMes, semana, somarMeses, nomeDoMes, itemDaReserva, itemDoCompromisso, itensDoDia, filtrarItens, seguraHorario, conflitos,
  bloqueioDoDia, horariosDoDia, horariosLivres, resumoDaCampanha, textoDoStories, linhaDaReserva, quandoFoi, tiposDeCompromisso,
} from "../src/modulos/agenda/logica.js";
import { nicho } from "../src/nichos/index.js";

const SP = "America/Sao_Paulo";
const agora = Date.parse("2026-10-29T15:00:00Z");
const res = (id, inicio, fim, extra = {}) => ({ id, inicio, fim, situacao: "confirmada", criado_em: "2026-10-01T12:00:00Z", clientes: { nome: "Cliente " + id }, ...extra });

test("o mês em semanas inteiras, de domingo a sábado", () => {
  const out = gradeDoMes("2026-10-01");
  assert.equal(out.length, 35);
  assert.equal(out[0], "2026-09-27");
  assert.equal(out.at(-1), "2026-10-31");
  assert.equal(gradeDoMes("2026-02-01").length, 28, "fevereiro que começa no domingo");
  assert.equal(gradeDoMes("2026-08-01").length, 42, "agosto de 2026 pede 6 semanas");
  assert.deepEqual(semana("2026-10-29"), ["2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"]);
  assert.equal(somarMeses("2026-12-01", 1), "2027-01-01");
  assert.equal(somarMeses("2026-01-01", -1), "2025-12-01");
  assert.equal(nomeDoMes("2026-10-01"), "Outubro de 2026");
});

test("a festa da noite fica no dia em que começa; os itens na ordem da hora", () => {
  const festa = itemDaReserva(res("a", "2026-10-31T22:00:00Z", "2026-11-01T06:00:00Z", { tipos_reserva: { nome: "Casamento", cor: "#d6456b" } }), SP);
  assert.deepEqual([festa.dia, festa.ini, festa.fim, festa.sub, festa.cor], ["2026-10-31", "19h", "3h", "Casamento", "#d6456b"]);
  const visita = itemDoCompromisso({ id: "v", tipo: "visita", inicio: "2026-10-31T13:00:00Z", fim: null, clientes: { nome: "Ana" }, responsavel_id: "p1" }, SP);
  assert.equal(visita.titulo, "Ana");
  assert.deepEqual(itensDoDia([festa, visita], "2026-10-31").map(i => i.id), ["v", "a"]);
  assert.equal(itensDoDia([festa], "2026-11-01").length, 0);
});

test("filtrar: quem cuida, o que esconder e as canceladas", () => {
  const a = itemDaReserva(res("a", "2026-10-31T22:00:00Z", "2026-11-01T06:00:00Z", { responsavel_id: "p1", tipo_id: "t1" }), SP);
  const b = itemDaReserva(res("b", "2026-10-31T14:00:00Z", "2026-10-31T20:00:00Z", { producao_id: "p2", situacao: "cancelada" }), SP);
  assert.deepEqual(filtrarItens([a, b]).map(i => i.id), ["a"]);
  assert.deepEqual(filtrarItens([a, b], { canceladas: true, pessoa: "p2" }).map(i => i.id), ["b"], "a produção do dia também é \"dela\"");
  assert.deepEqual(filtrarItens([a, b], { escondidas: ["t1"] }).map(i => i.id), []);
});

test("conflito de horário: a mesma regra da agenda online (05)", () => {
  const velha = "2026-10-20T12:00:00Z";
  const reservas = [
    res("conf", "2026-10-31T22:00:00Z", "2026-11-01T06:00:00Z"),
    res("canc", "2026-10-31T22:00:00Z", "2026-11-01T06:00:00Z", { situacao: "cancelada" }),
    res("pre-site", "2026-10-31T22:00:00Z", "2026-11-01T06:00:00Z", { situacao: "pre_reserva", criado_em: velha, pedido_id: "ps" }),
    res("pre-equipe", "2026-10-31T14:00:00Z", "2026-10-31T20:00:00Z", { situacao: "pre_reserva", criado_em: velha, pedido_id: "pe" }),
  ];
  const origem = id => (id === "ps" ? "agenda_online" : "whatsapp");
  assert.equal(seguraHorario(reservas[2], { agora, origemDoPedido: origem }), false, "pré-reserva da agenda online vencida não segura");
  assert.equal(seguraHorario(reservas[3], { agora, origemDoPedido: origem }), true, "a da equipe segura");
  assert.deepEqual(conflitos(reservas, { inicio: "2026-10-31T23:00:00Z", fim: "2026-11-01T05:00:00Z", agora, origemDoPedido: origem }).map(r => r.id), ["conf"]);
  assert.deepEqual(conflitos(reservas, { inicio: "2026-10-31T23:00:00Z", fim: "2026-11-01T05:00:00Z", ignorar: "conf", agora, origemDoPedido: origem }).map(r => r.id), [], "a própria reserva não conflita");
  assert.deepEqual(conflitos(reservas, { inicio: "2026-10-31T20:00:00Z", fim: "2026-10-31T22:00:00Z", agora, origemDoPedido: origem }).map(r => r.id), [], "encostar não é cruzar");
});

test("turnos e datas fechadas", () => {
  const horarios = [{ dia_semana: 6, inicio: "19:00:00", fim: "02:00:00", nome: "À noite" }, { dia_semana: 6, inicio: "11:00:00", fim: "17:00:00", nome: "De dia" }, { dia_semana: 6, inicio: "09:00:00", servico_id: "s1" }];
  assert.deepEqual(horariosDoDia(horarios, "2026-10-31").map(h => h.nome), ["De dia", "À noite"], "só os sem serviço próprio, na ordem");
  assert.equal(horariosDoDia(horarios, "2026-10-30").length, 0);
  const bloqueios = [{ de: "2026-12-24", ate: "2026-12-26", motivo: "Natal" }];
  assert.equal(bloqueioDoDia(bloqueios, "2026-12-25").motivo, "Natal");
  assert.equal(bloqueioDoDia(bloqueios, "2026-12-27"), null);
});

test("fotografia: horários livres do dia e da campanha", () => {
  const horarios = [9, 10.5, 14].map(h => ({ dia_semana: 3, inicio: `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}:00` }));
  const reservas = [res("r", "2026-11-04T13:30:00Z", "2026-11-04T15:00:00Z")]; // 10h30 às 12h em São Paulo
  assert.deepEqual(horariosLivres({ d: "2026-11-04", horarios, reservas, duracao: 60, fuso: SP, agora }), ["09:00", "14:00"]);
  assert.deepEqual(horariosLivres({ d: "2026-11-04", horarios, reservas, bloqueios: [{ de: "2026-11-04", ate: "2026-11-04" }], fuso: SP, agora }), []);
  const campanha = { id: "c", nome: "Mini sessão de Natal", dias: ["2026-11-14"], horarios: ["09:00:00", "09:40:00"], vagas: null };
  const naCampanha = [res("n", "2026-11-14T12:00:00Z", "2026-11-14T12:30:00Z", { campanha_id: "c", situacao: "pre_reserva", criado_em: "2026-10-29T10:00:00Z" })];
  assert.deepEqual(horariosLivres({ d: "2026-11-14", horarios, campanha, reservas: naCampanha, duracao: 30, fuso: SP, agora }), ["09:40"]);
  assert.deepEqual(resumoDaCampanha(campanha, naCampanha), { total: 2, reservadas: 1, restam: 1, comSinal: 0, esperandoSinal: 1 });
  const texto = textoDoStories({ campanha, livresPorDia: [{ dia: "2026-11-14", livres: 1 }], conta: { nome: "Estúdio Ciranda" }, nicho: nicho("fotografia"), servico: { duracao_min: 30, entrega: "10 fotos editadas" }, fuso: SP });
  assert.equal(texto, "Mini sessão de Natal no Estúdio Ciranda\nRestam só 1 horário: sáb, 14/11 (1).\n30 minutos, 10 fotos editadas.\nEscolha o seu horário no link da bio.");
  assert.match(textoDoStories({ campanha, livresPorDia: [], conta: { nome: "Villa Alecrim" }, nicho: nicho("eventos"), fuso: SP }), /^Mini sessão de Natal no espaço Villa Alecrim\nAgenda lotada!/);
});

test("reservar: a festa que passa da meia-noite termina no dia seguinte; o ensaio pela duração", () => {
  const festa = linhaDaReserva({ data: "2026-10-31", inicio: "19:00", fim: "03:00", convidados: "150", tipo_id: "t1", situacao: "confirmada" }, { contaId: "c", cliente: { id: "k" }, idNicho: "eventos", fuso: SP });
  assert.equal(festa.inicio, "2026-10-31T22:00:00.000Z");
  assert.equal(festa.fim, "2026-11-01T06:00:00.000Z");
  assert.equal(festa.convidados, 150);
  assert.equal(festa.situacao, "confirmada");
  const ensaio = linhaDaReserva({ data: "2026-11-04", inicio: "09:00", duracao: 90, servico_id: "s1", tipo_id: "x" }, { contaId: "c", cliente: { id: "k" }, idNicho: "fotografia", fuso: SP });
  assert.equal(ensaio.fim, "2026-11-04T13:30:00.000Z");
  assert.equal(ensaio.tipo_id, null, "fotografia não tem tipo de festa");
  assert.equal(ensaio.situacao, "pre_reserva");
});

test("quando foi e os compromissos do nicho", () => {
  assert.equal(quandoFoi("2026-10-29", "2026-10-29"), "hoje");
  assert.equal(quandoFoi("2026-10-30", "2026-10-29"), "amanhã");
  assert.equal(quandoFoi("2026-11-05", "2026-10-29"), "daqui a 7 dias");
  assert.equal(quandoFoi("2027-03-14", "2026-10-29"), "daqui a 5 meses");
  assert.equal(quandoFoi("2026-10-20", "2026-10-29"), "há 9 dias");
  assert.deepEqual(tiposDeCompromisso("eventos").map(t => t.id), ["visita", "degustacao", "reuniao", "outro"]);
  assert.deepEqual(tiposDeCompromisso("fotografia").map(t => t.id), ["reuniao", "outro"]);
});
