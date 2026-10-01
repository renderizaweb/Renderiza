// Tarefas e clientes: as contas, sem tela (testadas em test/tarefas.test.mjs).
//   Tarefa = o que fazer, com dia (opcional), hora (opcional), cliente (opcional) e responsável (opcional).
//   Cliente = um registro de leads. Pode estar no funil (Pipeline) ou fora dele (só na lista de Clientes).

import { somarDias, hojeLocal } from "./ritmo.js";

/** Quem pode ser responsável. Só um rótulo para separar e filtrar: o login é o mesmo. */
export const RESPONSAVEIS = ["Kaue", "Milena"];
export const SEM_RESPONSAVEL = "_sem";

export const GRUPOS = [
  ["atrasadas", "Atrasadas"],
  ["hoje", "Hoje"],
  ["amanha", "Amanhã"],
  ["proximos", "Próximos 7 dias"],
  ["adiante", "Mais adiante"],
  ["sem_data", "Sem data"],
];

export function grupoDaTarefa(t, hoje) {
  if (!t.dia) return "sem_data";
  if (t.dia < hoje) return "atrasadas";
  if (t.dia === hoje) return "hoje";
  if (t.dia === somarDias(hoje, 1)) return "amanha";
  if (t.dia <= somarDias(hoje, 7)) return "proximos";
  return "adiante";
}

/** Por dia; no mesmo dia, as com hora primeiro (em ordem de hora); depois, na ordem em que foram criadas. */
export function compararTarefas(a, b) {
  return (a.dia || "9999").localeCompare(b.dia || "9999")
    || (a.hora || "99").localeCompare(b.hora || "99")
    || String(a.criado_em || "").localeCompare(String(b.criado_em || ""));
}

export const passaNoResponsavel = (t, filtro) =>
  !filtro || (filtro === SEM_RESPONSAVEL ? !t.responsavel : t.responsavel === filtro);

/** Tarefas em aberto, separadas nos grupos (só os que têm alguma). */
export function agruparTarefas(tarefas, hoje) {
  const grupos = new Map(GRUPOS.map(([id]) => [id, []]));
  for (const t of tarefas) if (!t.feita_em) grupos.get(grupoDaTarefa(t, hoje)).push(t);
  return GRUPOS.map(([id, nome]) => ({ id, nome, tarefas: grupos.get(id).sort(compararTarefas) })).filter(g => g.tarefas.length);
}

/** Dia (no fuso de quem usa) em que a tarefa foi marcada como feita. */
export const diaDaConclusao = t => (t.feita_em ? hojeLocal(new Date(t.feita_em)) : null);

/** Feitas nos últimos `dias` dias, da mais recente para a mais antiga. */
export function feitasRecentes(tarefas, hoje, dias = 7) {
  const desde = somarDias(hoje, -dias);
  return tarefas.filter(t => t.feita_em && diaDaConclusao(t) >= desde)
    .sort((a, b) => String(b.feita_em).localeCompare(String(a.feita_em)));
}

/** Próxima tarefa em aberto de um cliente (as sem data por último). */
export function proximaTarefa(tarefas, leadId) {
  return tarefas.filter(t => t.lead_id === leadId && !t.feita_em).sort(compararTarefas)[0] || null;
}

/* ---------- clientes ---------- */

export const SITUACOES = [
  ["em_venda", "Em venda"],
  ["ganho", "Ganhos (pós-venda)"],
  ["perda", "Perdas"],
  ["fora", "Fora do funil"],
];

export function situacaoDoCliente(l) {
  if (l.fora_do_funil) return "fora";
  if (l.etapa === "finalizado") return l.resultado === "perda" ? "perda" : "ganho";
  return "em_venda";
}

/**
 * Próximas ações anotadas nos clientes (campo antigo "Próxima ação") que ainda não viraram tarefa.
 * Só sugestão: nada é criado sozinho.
 */
export function sugestoesDeTarefa(leads, tarefas) {
  const comTarefa = new Set(tarefas.filter(t => !t.feita_em && t.lead_id).map(t => t.lead_id));
  return leads
    .filter(l => String(l.proxima_acao || "").trim() && !comTarefa.has(l.id) && !l.nao_contatar && l.etapa !== "finalizado")
    .sort((a, b) => (a.followup_em || "9999").localeCompare(b.followup_em || "9999")
      || String(a.empresa || "").localeCompare(String(b.empresa || ""), "pt-BR", { sensitivity: "base" }));
}
