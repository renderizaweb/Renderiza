// Checklist de cada card (coluna leads.checklist), no lugar da "próxima ação": os passos do contato, marcados
// conforme acontecem. Quando todos estão feitos e a ótica não respondeu, o card pode ir para Sem resposta ou ser
// encerrado. leads.proxima_acao continua no banco (Ritmo, Tarefas e a IA leem) e passa a ser o texto do primeiro
// item pendente, gravado junto com a checklist.
// Item: {id, texto, feito, feito_em}. Os itens padrão têm id fixo (o painel reconhece "enviar_demo").

import { faseDaEtapa } from "./modelo.js";

export const ITENS_PADRAO = [
  { id: "enviar_demo", texto: "Enviar a demo e o vídeo" },
  { id: "cobranca_1", texto: "1ª cobrança: mandar o flyer de cortesia" },
  { id: "cobranca_2", texto: "2ª cobrança: perguntar se viu a demo" },
  { id: "cobranca_3", texto: "3ª cobrança, a última" },
];
const IDS_PADRAO = new Set(ITENS_PADRAO.map(i => i.id));
export const MAX_TEXTO = 200;

const novoId = () => "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const novoItem = (texto, id = novoId()) => ({ id, texto: String(texto || "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO), feito: false, feito_em: null });
export const listaPadrao = () => ITENS_PADRAO.map(i => novoItem(i.texto, i.id));

/** Itens do lead, sem lixo (item sem texto some). */
export function itensDe(lead) {
  const lista = Array.isArray(lead && lead.checklist) ? lead.checklist : [];
  return lista.filter(i => i && typeof i.texto === "string" && i.texto.trim())
    .map(i => ({ id: String(i.id || novoId()), texto: i.texto, feito: !!i.feito, feito_em: i.feito ? i.feito_em || null : null }));
}

/** {feitos, total, proximo (primeiro pendente ou null), completa} */
export function progresso(itens) {
  const feitos = itens.filter(i => i.feito).length;
  return { feitos, total: itens.length, proximo: itens.find(i => !i.feito) || null, completa: itens.length > 0 && feitos === itens.length };
}

export const marcar = (itens, id, feito, agora = new Date().toISOString()) =>
  itens.map(i => (i.id === id ? { ...i, feito, feito_em: feito ? agora : null } : i));
export const adicionar = (itens, texto) => { const i = novoItem(texto); return i.texto ? [...itens, i] : itens; };
export const renomear = (itens, id, texto) => {
  const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO);
  return t ? itens.map(i => (i.id === id ? { ...i, texto: t } : i)) : itens;
};
export const remover = (itens, id) => itens.filter(i => i.id !== id);
/** Sobe (-1) ou desce (+1) um item. */
export function mover(itens, id, direcao) {
  const i = itens.findIndex(x => x.id === id), j = i + direcao;
  if (i < 0 || j < 0 || j >= itens.length) return itens;
  const nova = [...itens];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

/** O que gravar: a checklist e, junto, a próxima ação (o primeiro item pendente). */
export function patchDaChecklist(itens) {
  const p = progresso(itens).proximo;
  return { checklist: itens, proxima_acao: p ? p.texto : "" };
}

const antesDoContato = etapa => ["a_trabalhar", "demo_pronta"].includes(faseDaEtapa(etapa));
/**
 * Ao mudar de etapa:
 * - saindo de Leads a trabalhar (ou de Prontas) para Prontas ou Em andamento, sem nenhum item padrão: entram os padrão;
 * - saindo de antes do contato para Em andamento: "Enviar a demo e o vídeo" fica feito (foi assim que a conversa abriu).
 * Devolve {} se nada muda.
 */
export function patchAoMudarEtapa(lead, para, agora = new Date().toISOString()) {
  if (!antesDoContato(lead.etapa)) return {};
  const destino = faseDaEtapa(para);
  if (destino !== "demo_pronta" && destino !== "em_andamento") return {};
  const antes = itensDe(lead);
  let itens = antes;
  if (!itens.some(i => IDS_PADRAO.has(i.id))) itens = [...itens, ...listaPadrao()];
  if (destino === "em_andamento") itens = itens.map(i => (i.id === "enviar_demo" && !i.feito ? { ...i, feito: true, feito_em: agora } : i));
  return JSON.stringify(itens) === JSON.stringify(antes) ? {} : patchDaChecklist(itens);
}
