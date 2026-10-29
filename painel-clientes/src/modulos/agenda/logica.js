// Agenda (Missão 3, bloco B): as regras sem tela, testadas em test/agenda.test.mjs. Os dias são "aaaa-mm-dd" no fuso
// da conta; os instantes do banco (timestamptz) viram dia e hora pelo fuso (src/ui/formatos.js).

import { dia, hora, somarDias, instanteNoFuso, dataCurta } from "../../ui/formatos.js";

/** As situações da reserva (05), com o tom da etiqueta (.rz-etiqueta--tom). Cancelada não segura a data. */
export const SITUACOES = {
  pre_reserva: { nome: "Pré-reserva", tom: "alerta" },
  confirmada: { nome: "Confirmada", tom: "sucesso" },
  realizada: { nome: "Realizada", tom: "" },
  cancelada: { nome: "Cancelada", tom: "perigo" },
};

/** Os tipos de compromisso (05); a visita e a degustação são dos eventos. */
export const COMPROMISSOS = {
  visita: { nome: "Visita", soEventos: true },
  degustacao: { nome: "Degustação", soEventos: true },
  reuniao: { nome: "Reunião" },
  outro: { nome: "Outro" },
};
export const tiposDeCompromisso = idNicho => Object.entries(COMPROMISSOS).filter(([, c]) => !c.soEventos || idNicho === "eventos").map(([id, c]) => ({ id, ...c }));

export const DIAS_DA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Dia da semana (0 = domingo) de "aaaa-mm-dd". */
export const diaDaSemana = d => new Date(d + "T12:00:00Z").getUTCDay();
/** O domingo da semana do dia. */
export const inicioDaSemana = d => somarDias(d, -diaDaSemana(d));
/** Os 7 dias da semana do dia, de domingo a sábado. */
export const semana = d => Array.from({ length: 7 }, (_, i) => somarDias(inicioDaSemana(d), i));
/** "aaaa-mm-01" do mês do dia. */
export const primeiroDoMes = d => d.slice(0, 8) + "01";
/** Soma meses a "aaaa-mm-01". */
export function somarMeses(primeiro, n) {
  const [a, m] = primeiro.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
/** "outubro de 2026". */
export const nomeDoMes = primeiro => {
  const nome = MESES[Number(primeiro.slice(5, 7)) - 1];
  return `${nome[0].toUpperCase()}${nome.slice(1)} de ${primeiro.slice(0, 4)}`;
};

/** A grade do mês: semanas inteiras (domingo a sábado), de 4 a 6, sem uma última semana toda do mês seguinte. */
export function gradeDoMes(primeiro) {
  const comeco = inicioDaSemana(primeiro);
  const mes = primeiro.slice(0, 7);
  const dias = [];
  for (let i = 0; i < 42; i++) {
    const d = somarDias(comeco, i);
    if (i >= 28 && i % 7 === 0 && d.slice(0, 7) !== mes) break;
    dias.push(d);
  }
  return dias;
}

/** O que a agenda mostra de uma reserva ou compromisso, já com o dia e as horas no fuso. */
export function itemDaReserva(r, fuso) {
  const ini = new Date(r.inicio), fim = new Date(r.fim);
  return {
    tipo: "reserva", id: r.id, dia: dia(ini, fuso), ini: hora(ini, fuso), fim: hora(fim, fuso), inicio: r.inicio, termina: r.fim,
    titulo: r.titulo || (r.clientes && r.clientes.nome) || "Reserva",
    sub: (r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome) || "",
    cor: (r.tipos_reserva && r.tipos_reserva.cor) || (r.servicos && r.servicos.cor) || null,
    situacao: r.situacao, responsaveis: [r.responsavel_id, r.producao_id].filter(Boolean),
    categoria: r.tipo_id || r.servico_id || "sem-tipo", original: r,
  };
}
export function itemDoCompromisso(c, fuso) {
  const ini = new Date(c.inicio);
  return {
    tipo: "compromisso", id: c.id, dia: dia(ini, fuso), ini: hora(ini, fuso), fim: c.fim ? hora(new Date(c.fim), fuso) : "", inicio: c.inicio, termina: c.fim,
    titulo: c.titulo || (c.clientes && c.clientes.nome) || (COMPROMISSOS[c.tipo] ? COMPROMISSOS[c.tipo].nome : "Compromisso"),
    sub: COMPROMISSOS[c.tipo] ? COMPROMISSOS[c.tipo].nome : "", com: c.titulo && c.clientes ? c.clientes.nome : "", cor: null, situacao: null,
    responsaveis: [c.responsavel_id].filter(Boolean), categoria: "compromisso:" + c.tipo, original: c,
  };
}

/** Os itens de um dia, na ordem da hora; o que atravessa a meia-noite fica no dia em que começa. */
export function itensDoDia(itens, d) {
  return itens.filter(i => i.dia === d).sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}

/** O filtro do "Filtrar": quem cuida (uma pessoa) e as categorias escondidas. Canceladas só aparecem se pedir. */
export function filtrarItens(itens, { pessoa = null, escondidas = [], canceladas = false } = {}) {
  return itens.filter(i => (canceladas || i.situacao !== "cancelada")
    && (!pessoa || i.responsaveis.includes(pessoa))
    && !escondidas.includes(i.categoria));
}

/** A reserva segura o horário? (a mesma regra da agenda online, 05: cancelada não; pré-reserva da agenda online, só 48 horas) */
export function seguraHorario(r, { agora = Date.now(), origemDoPedido = () => null } = {}) {
  if (!["pre_reserva", "confirmada", "realizada"].includes(r.situacao)) return false;
  return !(r.situacao === "pre_reserva" && Date.parse(r.criado_em) < agora - 48 * 36e5 && origemDoPedido(r.pedido_id) === "agenda_online");
}

/** Conflito de horário: as reservas que seguram e se cruzam com [inicio, fim), fora a própria. */
export function conflitos(reservas, { inicio, fim, ignorar = null, agora, origemDoPedido } = {}) {
  const a = Date.parse(inicio), b = Date.parse(fim);
  return reservas.filter(r => r.id !== ignorar && Date.parse(r.inicio) < b && Date.parse(r.fim) > a && seguraHorario(r, { agora, origemDoPedido }));
}

/** A data está fechada? (bloqueios de/até inclusive) */
export const bloqueioDoDia = (bloqueios, d) => bloqueios.find(b => b.de <= d && b.ate >= d) || null;

/** Os turnos do dia da semana (eventos: "De dia", "À noite") ou os horários de início (fotografia), sem serviço próprio. */
export function horariosDoDia(horarios, d) {
  const ds = diaDaSemana(d);
  return horarios.filter(h => h.dia_semana === ds && !h.servico_id).sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Fim de um turno no mesmo dia ou no seguinte (fim antes do início passa da meia-noite). */
export function fimDoTurno(d, inicio, fim) {
  if (!fim) return null;
  return fim.slice(0, 5) <= inicio.slice(0, 5) ? { dia: somarDias(d, 1), hora: fim.slice(0, 5) } : { dia: d, hora: fim.slice(0, 5) };
}

/**
 * Fotografia: os horários de início do dia que ainda estão livres (os horários da conta, ou os da campanha nesse
 * dia), menos as reservas que seguram e as datas fechadas. `duracao` em minutos (a do ensaio padrão).
 */
export function horariosLivres({ d, horarios, campanha = null, reservas, bloqueios = [], duracao = 60, fuso, agora, origemDoPedido }) {
  if (bloqueioDoDia(bloqueios, d)) return [];
  const inicios = campanha && (campanha.dias || []).includes(d)
    ? (campanha.horarios || []).map(h => h.slice(0, 5))
    : horariosDoDia(horarios, d).map(h => h.inicio.slice(0, 5));
  return [...new Set(inicios)].sort().filter(h => {
    const comeca = instanteNoFuso(d, h, fuso);
    const termina = new Date(comeca.getTime() + duracao * 60000);
    return !conflitos(reservas, { inicio: comeca.toISOString(), fim: termina.toISOString(), agora, origemDoPedido }).length;
  });
}

/** A campanha: quantas vagas (vagas, ou dias × horários), quantas reservadas, com sinal (confirmadas) e esperando o sinal. */
export function resumoDaCampanha(campanha, reservas) {
  const dela = reservas.filter(r => r.campanha_id === campanha.id && r.situacao !== "cancelada");
  const total = campanha.vagas || (campanha.dias || []).length * (campanha.horarios || []).length;
  return {
    total, reservadas: dela.length, restam: Math.max(0, total - dela.length),
    comSinal: dela.filter(r => r.situacao === "confirmada" || r.situacao === "realizada").length,
    esperandoSinal: dela.filter(r => r.situacao === "pre_reserva").length,
  };
}

/** O texto pronto para o Stories, com os horários que restam por dia (09; exemplo de fotografia). */
export function textoDoStories({ campanha, livresPorDia, conta, servico, fuso }) {
  const comVaga = livresPorDia.filter(x => x.livres > 0);
  const restam = comVaga.reduce((t, x) => t + x.livres, 0);
  const dias = comVaga.map(x => `${dataCurta(instanteNoFuso(x.dia, "12:00", fuso), fuso)} (${x.livres})`).join(", ");
  return [
    `${campanha.nome}${conta && conta.nome ? ` no ${conta.nome}` : ""}`,
    restam ? `Restam ${restam === 1 ? "só 1 horário" : `só ${restam} horários`}: ${dias}.` : "Agenda lotada! Entre na lista de espera.",
    servico && servico.duracao_min ? `${servico.duracao_min} minutos${servico.entrega ? `, ${servico.entrega}` : ""}.` : "",
    "Escolha o seu horário no link da bio.",
  ].filter(Boolean).join("\n");
}

/** O horário de uma reserva como texto: "19h às 3h". */
export const faixa = item => (item.fim ? `${item.ini} às ${item.fim}` : item.ini);

/** "daqui a 3 dias", "hoje", "há 2 dias". */
export function quandoFoi(d, hoje) {
  const n = Math.round((Date.parse(d + "T12:00:00Z") - Date.parse(hoje + "T12:00:00Z")) / 864e5);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n === -1) return "ontem";
  if (n > 0) return n < 60 ? `daqui a ${n} dias` : `daqui a ${Math.round(n / 30)} meses`;
  return -n < 60 ? `há ${-n} dias` : `há ${Math.round(-n / 30)} meses`;
}

/** O que a reserva grava (nova ou editada), a partir do formulário. */
export function linhaDaReserva(d, { contaId, cliente, idNicho, fuso }) {
  const comeca = instanteNoFuso(d.data, d.inicio, fuso);
  let fimDia = d.data;
  if (d.fim && d.fim <= d.inicio) fimDia = somarDias(d.data, 1);
  const termina = d.fim ? instanteNoFuso(fimDia, d.fim, fuso) : new Date(comeca.getTime() + (Number(d.duracao) || 60) * 60000);
  const convidados = Number(String(d.convidados || "").replace(/\D/g, "")) || null;
  return {
    conta_id: contaId,
    cliente_id: cliente.id,
    tipo_id: idNicho === "eventos" ? d.tipo_id || null : null,
    servico_id: d.servico_id || null,
    titulo: String(d.titulo || "").trim().slice(0, 120) || null,
    inicio: comeca.toISOString(),
    fim: termina.toISOString(),
    convidados: convidados && convidados <= 10000 ? convidados : null,
    situacao: ["pre_reserva", "confirmada"].includes(d.situacao) ? d.situacao : "pre_reserva",
    responsavel_id: d.responsavel_id || null,
    producao_id: idNicho === "eventos" ? d.producao_id || null : null,
    observacoes: String(d.observacoes || "").trim().slice(0, 2000) || null,
  };
}

