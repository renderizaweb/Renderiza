// Clientes (Missão 3, bloco A): as regras sem tela, testadas em test/clientes.test.mjs. A situação do cliente é a do
// banco (05, regra 5: situacao(cliente), calculada, nunca digitada); aqui só o nome, o tom e os filtros.

import { dia, dataCurta, hora, instanteNoFuso, normalizarWhatsapp, whatsappValido } from "../../ui/formatos.js";

export const SITUACOES = {
  reservado: { nome: "Com reserva", tom: "sucesso" },
  interessado: { nome: "Interessado", tom: "info" },
  realizado: { nome: "Já fez", tom: "" },
  nao_fechou: { nome: "Não fechou", tom: "" },
};

/** A entrega das fotos (fotografia; 05, entregas). */
export const ENTREGAS = {
  escolhendo: { nome: "Escolhendo as fotos", tom: "alerta" },
  edicao: { nome: "Em edição", tom: "info" },
  entregue: { nome: "Entregue", tom: "sucesso" },
};

export const ORIGENS = [
  { id: "whatsapp", nome: "WhatsApp" }, { id: "instagram", nome: "Instagram" }, { id: "agenda_online", nome: "Agenda online" },
  { id: "indicacao", nome: "Indicação" }, { id: "google", nome: "Google" }, { id: "outro", nome: "Outro" },
];
const ORIGEM = Object.fromEntries(ORIGENS.map(o => [o.id, o.nome]));
export const nomeDaOrigem = id => ORIGEM[id] || "";

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Os chips da lista: todos (sem os arquivados), cada situação e os arquivados, com quantos. */
export function chipsDeClientes(clientes) {
  const ativos = clientes.filter(c => !c.arquivado_em);
  return [
    { valor: "todos", rotulo: "Todos", quantos: ativos.length },
    ...Object.entries(SITUACOES).map(([id, s]) => ({ valor: id, rotulo: s.nome, quantos: ativos.filter(c => c.situacao === id).length })),
    { valor: "arquivados", rotulo: "Arquivados", quantos: clientes.length - ativos.length },
  ];
}

/**
 * Filtra pelo grupo e pela busca (nome, WhatsApp, e-mail ou Instagram). Ordem: quem tem reserva marcada, pela data;
 * depois os outros, pelo nome.
 */
export function filtrarClientes(clientes, { grupo = "todos", busca = "", proxima = {} } = {}) {
  const termo = semAcento(busca).trim();
  const digitos = String(busca || "").replace(/\D/g, "");
  return clientes
    .filter(c => (grupo === "arquivados" ? !!c.arquivado_em : !c.arquivado_em && (grupo === "todos" || c.situacao === grupo)))
    .filter(c => !termo || semAcento(c.nome).includes(termo) || semAcento(c.email).includes(termo) || semAcento(c.instagram).includes(termo.replace(/^@/, ""))
      || (digitos.length >= 3 && String(c.whatsapp || "").includes(digitos)))
    .sort((a, b) => {
      const pa = proxima[a.id], pb = proxima[b.id];
      if (pa && pb) return Date.parse(pa.inicio) - Date.parse(pb.inicio);
      if (pa || pb) return pa ? -1 : 1;
      return semAcento(a.nome).localeCompare(semAcento(b.nome));
    });
}

/** A próxima reserva (futura, não cancelada) e a última (que já passou) de cada cliente. */
export function reservasPorCliente(reservas, agora = Date.now()) {
  const proxima = {}, ultima = {};
  for (const r of reservas) {
    if (r.situacao === "cancelada") continue;
    const inicio = Date.parse(r.inicio);
    if (Date.parse(r.fim) >= agora) { if (!proxima[r.cliente_id] || inicio < Date.parse(proxima[r.cliente_id].inicio)) proxima[r.cliente_id] = r; }
    else if (!ultima[r.cliente_id] || inicio > Date.parse(ultima[r.cliente_id].inicio)) ultima[r.cliente_id] = r;
  }
  return { proxima, ultima };
}

/** Valida o contato; devolve os erros por campo (ou nada). */
export function validarCliente({ nome, whatsapp, email, instagram }) {
  const erros = {};
  if (!String(nome || "").trim()) erros.nome = "Digite o nome.";
  if (String(whatsapp || "").trim() && !whatsappValido(whatsapp)) erros.whatsapp = "Confira o número: DDD e o número.";
  if (String(email || "").trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email).trim())) erros.email = "Esse e-mail não parece certo.";
  const insta = normalizarInstagram(instagram);
  if (String(instagram || "").trim() && !/^[a-z0-9._]{1,30}$/.test(insta)) erros.instagram = "Só letras, números, ponto e _ (sem espaço).";
  return erros;
}
export const normalizarInstagram = t => String(t || "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "").toLowerCase();

/** O que o cliente grava (só os campos do contato). */
export function linhaDoCliente(d) {
  return {
    nome: String(d.nome || "").trim().slice(0, 120),
    whatsapp: normalizarWhatsapp(d.whatsapp),
    email: String(d.email || "").trim().toLowerCase() || null,
    instagram: normalizarInstagram(d.instagram) || null,
    origem: ORIGEM[d.origem] ? d.origem : null,
  };
}

/** O prazo da entrega: "prazo passou", "prazo hoje", "prazo em 3 dias" (e o tom). */
export function prazoDaEntrega(e, hoje) {
  if (e.situacao === "entregue") return { texto: e.entregue_em ? `entregue ${dataCurta(instanteNoFuso(e.entregue_em, "12:00"))}` : "entregue", tom: "sucesso" };
  if (!e.prazo) return { texto: "sem prazo", tom: "" };
  const n = Math.round((Date.parse(e.prazo + "T12:00:00Z") - Date.parse(hoje + "T12:00:00Z")) / 864e5);
  if (n < 0) return { texto: "prazo passou", tom: "perigo" };
  if (n === 0) return { texto: "prazo hoje", tom: "alerta" };
  return { texto: `prazo em ${n} ${n === 1 ? "dia" : "dias"}`, tom: n <= 3 ? "alerta" : "" };
}

/**
 * A linha do tempo da ficha (05: pedidos, reservas, compromissos, contratos, parcelas e entregas, em ordem, cada
 * item abrindo o seu módulo). Só entra o que veio (o banco já não entrega o que a pessoa não pode ver).
 * Ordem: do mais novo para o mais antigo (o que está por vir fica em cima).
 */
export function linhaDoTempo({ pedidos = [], reservas = [], compromissos = [], contratos = [], parcelas = [], entregas = [] }, { fuso, nicho, moeda = v => String(v) }) {
  const itens = [];
  const quando = iso => `${dataCurta(new Date(iso), fuso)}, ${hora(new Date(iso), fuso)}`;
  for (const p of pedidos) itens.push({ data: p.criado_em, tipo: "pedido", icone: "conversa", titulo: `Pedido${(p.tipos_reserva && ` · ${p.tipos_reserva.nome}`) || (p.servicos && ` · ${p.servicos.nome}`) || ""}`, sub: `chegou ${dataCurta(new Date(p.criado_em), fuso)}${p.data_desejada ? ` · para ${dataCurta(instanteNoFuso(p.data_desejada, "12:00", fuso), fuso)}` : ""}`, etapa: p.etapa, href: `/atendimento?pedido=${p.id}` });
  for (const r of reservas) itens.push({ data: r.inicio, tipo: "reserva", icone: "agenda", titulo: (r.titulo || (r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome) || nicho.palavras.reserva).replace(/^./, c => c.toUpperCase()), sub: quando(r.inicio), situacaoReserva: r.situacao, href: `/agenda?reserva=${r.id}` });
  for (const c of compromissos) itens.push({ data: c.inicio, tipo: "compromisso", icone: "relogio", titulo: c.titulo || { visita: "Visita", degustacao: "Degustação", reuniao: "Reunião" }[c.tipo] || "Compromisso", sub: quando(c.inicio), href: `/agenda?dia=${dia(new Date(c.inicio), fuso)}` });
  for (const c of contratos) itens.push({ data: c.aceito_em || c.enviado_em || c.criado_em, tipo: "contrato", icone: "contrato", titulo: "Contrato", sub: c.aceito_em ? `aceito ${dataCurta(new Date(c.aceito_em), fuso)}` : c.enviado_em ? `enviado ${dataCurta(new Date(c.enviado_em), fuso)}` : "rascunho", contrato: c.situacao, href: `/contratos?contrato=${c.id}` });
  // as parcelas de cada reserva viram um item só ("Pagamentos · 7 de 9 pagas · próxima vence…"), para a ficha não virar extrato
  const grupos = new Map();
  for (const p of parcelas) { const k = p.reserva_id || "sem-reserva"; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(p); }
  for (const [k, lista] of grupos) {
    const pagas = lista.filter(p => p.pago_em);
    const abertas = lista.filter(p => !p.pago_em).sort((a, b) => a.vence_em.localeCompare(b.vence_em));
    const total = lista.reduce((t, p) => t + Number(p.valor), 0);
    const proxima = abertas[0];
    const ultimaPaga = pagas.map(p => p.pago_em).sort().at(-1);
    const quando = proxima ? proxima.vence_em : ultimaPaga || lista[0].vence_em;
    itens.push({
      data: instanteNoFuso(quando, "12:00", fuso).toISOString(), tipo: "parcela", icone: "carteira",
      titulo: `Pagamentos · ${moeda(total)}`,
      sub: `${pagas.length} de ${lista.length} ${lista.length === 1 ? "paga" : "pagas"}${proxima ? ` · próxima vence ${dataCurta(instanteNoFuso(proxima.vence_em, "12:00", fuso), fuso)}` : ""}`,
      pago: !abertas.length, href: k === "sem-reserva" ? `/financeiro?cliente=${lista[0].cliente_id || ""}` : `/financeiro?reserva=${k}`,
    });
  }
  for (const e of entregas) itens.push({ data: instanteNoFuso(e.entregue_em || e.prazo || dia(new Date(e.criado_em), fuso), "12:00", fuso).toISOString(), tipo: "entrega", icone: "imagem", titulo: "Entrega das fotos", sub: ENTREGAS[e.situacao] ? ENTREGAS[e.situacao].nome : "", entrega: e.situacao, href: `/clientes?aba=entregas&entrega=${e.id}` });
  return itens.sort((a, b) => Date.parse(b.data) - Date.parse(a.data));
}
