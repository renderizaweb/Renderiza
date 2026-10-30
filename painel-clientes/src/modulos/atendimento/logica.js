// Atendimento (Missão 3, bloco C): as regras sem tela, testadas em test/atendimento.test.mjs.
// Etapas e origens são as do banco (05, pedidos); os nomes e o tom da etiqueta são do painel (09, exemplo de eventos).

import { dia, dataCurta, hora, haQuanto, instanteNoFuso, somarDias, normalizarWhatsapp } from "../../ui/formatos.js";
import { doNegocio } from "../../nichos/index.js";

export { doNegocio };

/** As etapas, na ordem do funil. `aberta`: ainda pede atendimento. `tom`: a etiqueta (.rz-etiqueta--tom). `soEventos`: só no nicho de eventos. */
export const ETAPAS = [
  { id: "novo", nome: "Novo", tom: "destaque", aberta: true },
  { id: "em_conversa", nome: "Em conversa", tom: "info", aberta: true },
  { id: "visita_marcada", nome: "Visita marcada", tom: "sucesso", aberta: true, soEventos: true },
  { id: "orcamento_enviado", nome: "Orçamento enviado", tom: "alerta", aberta: true },
  { id: "aguardando_sinal", nome: "Aguardando sinal", tom: "alerta", aberta: true },
  { id: "fechado", nome: "Fechado", tom: "sucesso", aberta: false },
  { id: "perdido", nome: "Perdido", tom: "", aberta: false },
];
export const ETAPA = Object.fromEntries(ETAPAS.map(e => [e.id, e]));

/** As origens. `icone`: o da linha do pedido (.rz-origem--<id>, a cor de cada uma, como no exemplo). */
export const ORIGENS = [
  { id: "whatsapp", nome: "WhatsApp", por: "pelo WhatsApp", icone: "whatsapp" },
  { id: "instagram", nome: "Instagram", por: "pelo Instagram", icone: "instagram" },
  { id: "agenda_online", nome: "Agenda online", por: "pela agenda online", icone: "estrela" },
  { id: "indicacao", nome: "Indicação", por: "por indicação", icone: "coracao" },
  { id: "google", nome: "Google", por: "pelo Google", icone: "globo" },
  { id: "outro", nome: "Outro", por: "", icone: "conversa" },
];
export const ORIGEM = Object.fromEntries(ORIGENS.map(o => [o.id, o]));

/** As etapas que fazem sentido no nicho (a visita é dos espaços de eventos). */
export const etapasDoNicho = idNicho => ETAPAS.filter(e => !e.soEventos || idNicho === "eventos");

/** Os chips da lista: abertos (o padrão), cada etapa e os fechados e perdidos, com quantos. */
export function chipsDaLista(pedidos, idNicho) {
  const conta = id => pedidos.filter(p => p.etapa === id).length;
  return [
    { valor: "abertos", rotulo: "Abertos", quantos: pedidos.filter(p => ETAPA[p.etapa] && ETAPA[p.etapa].aberta).length },
    ...etapasDoNicho(idNicho).map(e => ({ valor: e.id, rotulo: e.nome, quantos: conta(e.id) })),
  ];
}

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtra pela etapa ("abertos", "todas" ou uma etapa) e pela busca (nome ou WhatsApp). Mais novos primeiro; novos sempre em cima. */
export function filtrar(pedidos, { etapa = "abertos", busca = "" } = {}) {
  const termo = semAcento(busca).trim();
  const digitos = String(busca || "").replace(/\D/g, "");
  return pedidos
    .filter(p => (etapa === "todas" ? true : etapa === "abertos" ? ETAPA[p.etapa] && ETAPA[p.etapa].aberta : p.etapa === etapa))
    .filter(p => {
      if (!termo) return true;
      const c = p.clientes || {};
      return semAcento(c.nome).includes(termo) || (digitos.length >= 3 && String(c.whatsapp || "").includes(digitos));
    })
    .sort((a, b) => ((b.etapa === "novo") - (a.etapa === "novo")) || Date.parse(b.criado_em) - Date.parse(a.criado_em));
}

/** O que decide, na segunda linha: tipo (ou ensaio), data desejada, hora, convidados e origem. */
export function resumoDoPedido(p, nicho, { fuso, hoje } = {}) {
  const tipo = (p.tipos_reserva && p.tipos_reserva.nome) || (p.servicos && p.servicos.nome);
  const quando = p.data_desejada ? dataCurta(instanteNoFuso(p.data_desejada, "12:00", fuso), fuso) + (p.data_desejada.slice(0, 4) !== (hoje || dia(new Date())).slice(0, 4) ? "/" + p.data_desejada.slice(2, 4) : "") : null;
  return [
    tipo,
    quando ? (p.hora_desejada ? `${quando}, ${hora(instanteNoFuso(p.data_desejada, p.hora_desejada.slice(0, 5), fuso), fuso)}` : quando) : "data a combinar",
    nicho.temConvidados && p.convidados ? `${p.convidados} convidados` : null,
    ORIGEM[p.origem] ? ORIGEM[p.origem].nome : null,
  ].filter(Boolean).join(" · ");
}

/** "Chegou há 2 h pelo Instagram". */
export const chegou = (p, agora = Date.now()) => `Chegou ${haQuanto(new Date(p.criado_em), agora)}${ORIGEM[p.origem] && ORIGEM[p.origem].por ? ` ${ORIGEM[p.origem].por}` : ""}`;

/**
 * O funil dos últimos `dias` (09: recolhido, depois da lista): quantos pedidos chegaram, quantos foram além do
 * "novo", quantos receberam orçamento e quantos fecharam. A visita só conta nos eventos.
 */
export function funil(pedidos, { dias = 30, agora = Date.now(), idNicho } = {}) {
  const desde = agora - dias * 864e5;
  const doPeriodo = pedidos.filter(p => Date.parse(p.criado_em) >= desde);
  const antes = pedidos.filter(p => Date.parse(p.criado_em) >= desde - dias * 864e5 && Date.parse(p.criado_em) < desde).length;
  const passou = (p, ids) => ids.includes(p.etapa);
  const linhas = [
    { id: "pedidos", nome: `Pedidos em ${dias} dias`, n: doPeriodo.length, dos: "dos pedidos" },
    idNicho === "eventos" && { id: "visita", nome: "Visitaram o espaço", n: doPeriodo.filter(p => passou(p, ["visita_marcada", "orcamento_enviado", "aguardando_sinal", "fechado"])).length, dos: "das visitas" },
    { id: "orcamento", nome: "Receberam orçamento", n: doPeriodo.filter(p => passou(p, ["orcamento_enviado", "aguardando_sinal", "fechado"])).length, dos: "dos orçamentos" },
    { id: "fechado", nome: "Fecharam", n: doPeriodo.filter(p => p.etapa === "fechado").length },
  ].filter(Boolean);
  const comparado = d => (d > 0 ? `+${d} que no mês anterior` : d < 0 ? `−${-d} que no mês anterior` : "igual ao mês anterior");
  return linhas.map((l, i) => {
    const de = i ? linhas[i - 1].n : null;
    const pct = i && de ? Math.round((l.n / de) * 100) : null;
    // a linha de baixo: a primeira compara com o período anterior; as outras, quanto passou da etapa de cima
    const sub = !i ? comparado(l.n - antes) : pct != null ? `${pct}% ${linhas[i - 1].dos}` : "";
    return { id: l.id, nome: l.nome, n: l.n, de, pct, sub };
  });
}

/** De onde vêm os pedidos dos últimos `dias`: [{ id, nome, n, pct }], do que mais traz para o que menos traz. */
export function deOndeVem(pedidos, { dias = 90, agora = Date.now() } = {}) {
  const desde = agora - dias * 864e5;
  const conta = {};
  for (const p of pedidos) if (Date.parse(p.criado_em) >= desde) conta[p.origem] = (conta[p.origem] || 0) + 1;
  const total = Object.values(conta).reduce((a, b) => a + b, 0);
  return ORIGENS.filter(o => conta[o.id]).map(o => ({ ...o, n: conta[o.id], pct: Math.round((conta[o.id] / total) * 100) })).sort((a, b) => b.n - a.n);
}

/** A mensagem pronta do "Responder": de quem atende, pelo nome da conta, citando o que a pessoa pediu. */
export function mensagemDeResposta(p, { conta, pessoa, nicho, fuso } = {}) {
  const primeiro = String((p.clientes && p.clientes.nome) || "").trim().split(/\s+/)[0];
  const eu = String((pessoa && pessoa.nome) || "").trim().split(/\s+/)[0];
  const tipo = (p.tipos_reserva && p.tipos_reserva.nome) || (p.servicos && p.servicos.nome);
  const quando = p.data_desejada ? dataCurta(instanteNoFuso(p.data_desejada, "12:00", fuso), fuso) : "";
  const pedido = [tipo ? `para ${tipo.toLowerCase()}` : `de ${nicho.palavras.reserva}`, quando && `em ${quando}`].filter(Boolean).join(" ");
  return `Oi${primeiro ? `, ${primeiro}` : ""}! Aqui é ${eu ? `${eu}, ` : ""}${doNegocio(conta && conta.nome, nicho)}. Recebi o seu pedido ${pedido}. Podemos conversar?`;
}

/**
 * A data desejada está livre? Mesma regra da agenda online (05): reserva cancelada não segura a data; a pré-reserva
 * que veio da agenda online, só nas primeiras 48 horas. A reserva do próprio pedido não conta.
 * `reservas`: as do dia; `origemDoPedido(id)`: a origem do pedido que criou a reserva (se conhecida).
 */
export function dataLivre({ reservas = [], bloqueado = false, pedido, agora = Date.now(), origemDoPedido = () => null }) {
  if (bloqueado) return { livre: false, motivo: "fechada" };
  const seguram = reservas.filter(r => r.id !== pedido.reserva_id && r.situacao !== "cancelada"
    && !(r.situacao === "pre_reserva" && Date.parse(r.criado_em) < agora - 48 * 36e5 && origemDoPedido(r.pedido_id) === "agenda_online"));
  return seguram.length ? { livre: false, motivo: "reservada", quantas: seguram.length } : { livre: true };
}

/** O começo e o fim da reserva ao fechar: a data desejada, a hora pedida (ou a do nicho) e a duração (do ensaio ou do nicho). */
export function horarioParaFechar(p, nicho) {
  const hp = nicho.horarioPadrao;
  const inicio = (p.hora_desejada && p.hora_desejada.slice(0, 5)) || hp.inicio;
  let duracao = (p.servicos && p.servicos.duracao_min) || hp.duracao;
  if (!duracao) {
    const min = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    duracao = min(hp.fim) - min(hp.inicio);
    if (duracao <= 0) duracao += 24 * 60;
  }
  return { data: p.data_desejada || "", inicio, duracao };
}

/** Os instantes da reserva (no fuso da conta) a partir do que foi escolhido na tela. */
export function instantesDaReserva({ data, inicio, duracao }, fuso) {
  const comeca = instanteNoFuso(data, inicio, fuso);
  return { inicio: comeca.toISOString(), fim: new Date(comeca.getTime() + duracao * 60000).toISOString() };
}

/** O dia seguinte (para buscar as reservas de um dia: de 00h do dia até 00h do seguinte, no fuso). */
export const limitesDoDia = (data, fuso) => ({ de: instanteNoFuso(data, "00:00", fuso).toISOString(), ate: instanteNoFuso(somarDias(data, 1), "00:00", fuso).toISOString() });

/** O que o novo pedido grava (só o que veio preenchido). */
export function linhaDoNovoPedido(d, { contaId, cliente, idNicho, responsavel }) {
  const convidados = Number(String(d.convidados || "").replace(/\D/g, "")) || null;
  return {
    conta_id: contaId,
    cliente_id: cliente.id,
    data_desejada: d.data_desejada || null,
    hora_desejada: d.hora_desejada || null,
    tipo_id: idNicho === "eventos" ? d.tipo_id || null : null,
    servico_id: d.servico_id || null,
    convidados: convidados && convidados <= 10000 ? convidados : null,
    origem: ORIGEM[d.origem] ? d.origem : "whatsapp",
    mensagem: String(d.mensagem || "").trim().slice(0, 2000) || null,
    responsavel_id: responsavel || null,
  };
}

export const whatsappDoCliente = p => normalizarWhatsapp(p.clientes && p.clientes.whatsapp);
