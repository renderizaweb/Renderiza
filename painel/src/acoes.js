// Gravações usadas por mais de uma tela. Tudo passa por dados.js (só vale o que o banco confirmou).

import * as dados from "./dados.js";
import { aviso } from "./ui.js";

/** Erro de gravação: sem rede o aviso grande já aparece; nos outros casos, um aviso curto. */
export function falhou(e) {
  if (!e.rede) aviso("Não salvei: " + e.message + (/[.!?]$/.test(e.message) ? "" : ".") + " Nada mudou no banco.", "erro");
}
export async function salvar(tabela, id, mudancas) {
  try { return await dados.salvar(tabela, id, mudancas); } catch (e) { falhou(e); throw e; }
}
export async function criar(tabela, linha) {
  try { return await dados.criar(tabela, linha); } catch (e) { falhou(e); throw e; }
}

const agora = () => new Date().toISOString();
const historicoDe = lead => (Array.isArray(lead.historico) ? lead.historico : []);

/** Muda o interesse (não é etapa) e deixa a mudança no histórico. */
export function patchDeInteresse(lead, para, motivo) {
  const de = lead.interesse || "nao_avaliado";
  if (para === de) return motivo !== undefined && motivo !== lead.interesse_motivo ? { interesse_motivo: motivo } : {};
  const patch = { interesse: para, historico: [...historicoDe(lead), { em: agora(), tipo: "interesse", de, para }] };
  if (motivo !== undefined) patch.interesse_motivo = motivo;
  return patch;
}

/** Pediu (ou deixou de pedir) para não receber contato: sai da fila de retornos. */
export function patchDeNaoContatar(lead, para) {
  if (!!lead.nao_contatar === para) return {};
  const patch = { nao_contatar: para, historico: [...historicoDe(lead), { em: agora(), tipo: "nao_contatar", para }] };
  if (para) patch.followup_em = null;
  return patch;
}

/** Junta patches de lead, somando as linhas de histórico. */
export function juntar(lead, ...patches) {
  const final = {};
  const extras = [];
  for (const p of patches) {
    const { historico, ...resto } = p;
    Object.assign(final, resto);
    if (historico) extras.push(...historico.slice(historicoDe(lead).length));
  }
  if (extras.length) final.historico = [...historicoDe(lead), ...extras];
  return final;
}
