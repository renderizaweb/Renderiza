// Filtros da tela Atividade: os mesmos chips do Pipeline (filtros-ui.js), só que cada item é uma visita (o grupo de
// visitas.js) e não um lead. Campos: o que fez (viu o valor, WhatsApp, até o fim…), em que clicou, que parte viu,
// quanto tempo ficou, quem abriu, onde, o aparelho e, do lead, o nicho e a etapa. A lógica é a de filtros.js
// (modeloDeFiltros); `ctx` traz {leadDe(id)}. Testes: test/filtros-atividade.test.mjs.

import { modeloDeFiltros, SEM } from "./filtros.js";
import { SINAIS, sinaisDaVisita, categoriaDoClique } from "./visitas.js";
import { ETAPAS, RESULTADOS } from "./modelo.js";

const comparar = (a, b) => String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base", numeric: true });
const sim = (nome, valor = SEM) => ({ valor, nome });
/** Opções tiradas das próprias visitas, das mais comuns para as menos. */
function doDados(itens, ctx, valores) {
  const conta = new Map();
  for (const g of itens) for (const v of new Set(valores(g, ctx))) if (v !== SEM) conta.set(v, (conta.get(v) || 0) + 1);
  return [...conta.keys()].sort((a, b) => conta.get(b) - conta.get(a) || comparar(a, b)).map(v => ({ valor: v, nome: v }));
}
const lista = (id, nome, icone, grupo, valores, opcoes, extra = {}) => ({ id, nome, icone, grupo, tipo: "lista", valores, opcoes, ...extra });

const cliquesDe = g => { const c = [...new Set(g.passos.map(categoriaDoClique).filter(Boolean))]; return c.length ? c : [SEM]; };
const partesDe = g => (g.secoes && g.secoes.length ? g.secoes.map(([nome]) => nome) : [SEM]);
/** Faixas do tempo na visita. */
export const FAIXAS_DE_TEMPO = [["ate30", "Menos de 30 s"], ["30a60", "De 30 s a 1 min"], ["1a3", "De 1 a 3 min"], ["3mais", "Mais de 3 min"]];
export const faixaDoTempo = s => (!s ? SEM : s < 30 ? "ate30" : s < 60 ? "30a60" : s < 180 ? "1a3" : "3mais");
const ondeDe = g => [...new Set(g.passos.map(p => (p.pagina === "demo" ? "demo" : "painel")))];
const aparelhoDe = g => { const a = String(g.aparelho || "").split(" · ")[0].trim(); return [a || SEM]; };
const etapaDe = l => (!l ? SEM : l.etapa === "finalizado" ? "finalizado:" + (l.resultado || "") : l.etapa);

export const GRUPOS = ["O que fez", "Quem e onde", "Lead"];
export const CAMPOS = [
  lista("fez", "Fez", "alvo", "O que fez",
    g => { const s = sinaisDaVisita(g); return s.size ? [...s] : [SEM]; },
    () => [...SINAIS.map(([valor, nome]) => ({ valor, nome })), sim("Só olhou")], { plural: "ações" }),
  lista("clicou", "Clicou em", "direita", "O que fez", cliquesDe,
    (itens, ctx) => [...doDados(itens, ctx, cliquesDe), sim("Não clicou em nada")], { plural: "cliques", busca: true }),
  lista("parte", "Parte que viu", "camadas", "O que fez", partesDe,
    (itens, ctx) => [...doDados(itens, ctx, partesDe), sim("Sem tempo por parte")], { plural: "partes", busca: true }),
  lista("tempo", "Tempo na visita", "relogio", "O que fez", g => [faixaDoTempo(g.segundos)],
    () => [...FAIXAS_DE_TEMPO.map(([valor, nome]) => ({ valor, nome })), sim("Sem tempo medido")], { plural: "faixas" }),

  lista("quem", "Quem abriu", "pessoa", "Quem e onde", g => [g.quem],
    () => [sim("Cliente", "cliente"), sim("Vocês", "equipe"), sim("Provavelmente vocês (mesmo IP)", "equipe_ip")]),
  lista("onde", "Onde", "monitor", "Quem e onde", ondeDe,
    () => [sim("Demo", "demo"), sim("Link do Painel Renderiza", "painel")]),
  lista("aparelho", "Aparelho", "monitor", "Quem e onde", aparelhoDe,
    (itens, ctx) => [...doDados(itens, ctx, aparelhoDe), sim("Sem aparelho")], { plural: "aparelhos" }),

  lista("nicho", "Nicho", "camadas", "Lead", (g, ctx) => [String((ctx.leadDe(g.lead_id) || {}).segmento || "").trim() || SEM],
    (itens, ctx) => [...doDados(itens, ctx, (g, c) => [String((c.leadDe(g.lead_id) || {}).segmento || "").trim() || SEM]), sim("Sem nicho")], { plural: "nichos" }),
  lista("etapa", "Etapa do lead", "kanban", "Lead", (g, ctx) => [etapaDe(ctx.leadDe(g.lead_id))],
    () => [...ETAPAS.filter(e => e.id !== "finalizado").map(e => ({ valor: e.id, nome: e.nome })),
      ...RESULTADOS.map(r => ({ valor: "finalizado:" + r.id, nome: "Finalizado · " + r.nome })), sim("Lead apagado")], { plural: "etapas" }),
];

export const ATIVIDADE = modeloDeFiltros(CAMPOS, GRUPOS);

/** Os filtros antigos da tela (abas Quem e Onde, antes de 05/11/2026) viram chips. */
export function filtrosDoEstadoAntigo({ quem, onde } = {}) {
  const f = [];
  if (quem === "clientes") f.push({ campo: "quem", op: "e", valores: ["cliente"] });
  if (quem === "voces") f.push({ campo: "quem", op: "e", valores: ["equipe", "equipe_ip"] });
  if (onde === "demos") f.push({ campo: "onde", op: "e", valores: ["demo"] });
  if (onde === "painel") f.push({ campo: "onde", op: "e", valores: ["painel"] });
  return f;
}
