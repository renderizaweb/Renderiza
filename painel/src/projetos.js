// Projetos e issues (tela Projetos; supabase/projetos.sql): as contas, sem tela (testadas em test/projetos.test.mjs).
//   Projeto = começo, meta e fim; com cliente (um lead) ou sem. Um cliente pode ter vários (fase 1, fase 2…).
//   Issue   = o trabalho: Backlog → To-do → In progress → Validation → Done, com estimativa (opcional), ciclo e
//             responsável. Os ciclos são os da prospecção (tags.js): de segunda a domingo desde 30/11/2026.

import { cicloDoDia, periodoDoCiclo } from "./tags.js";

export const STATUS = [
  { id: "backlog", nome: "Backlog", dica: "Ainda vamos fazer, e ainda não paramos para pensar." },
  { id: "todo", nome: "To-do", dica: "Pronto para fazer." },
  { id: "in_progress", nome: "In progress", dica: "Fazendo agora." },
  { id: "validation", nome: "Validation", dica: "Feito, falta conferir (ou o cliente validar)." },
  { id: "done", nome: "Done", dica: "Feito." },
];
export const ESTIMATIVAS = [1, 2, 3, 5, 8];
export const SITUACOES_DO_PROJETO = [
  { id: "em_andamento", nome: "Em andamento" },
  { id: "concluido", nome: "Concluído" },
];
/** No quadro, o Done mostra só as feitas nestes últimos dias; as outras ficam num "ver as mais antigas". */
export const DIAS_DO_DONE = 7;
export const SEM = "_sem"; // filtro: sem projeto, sem ciclo, sem responsável

export const nomeDoStatus = id => (STATUS.find(s => s.id === id) || STATUS[0]).nome;
export const ordemDoStatus = id => Math.max(0, STATUS.findIndex(s => s.id === id));
export const nomeDaSituacao = id => (SITUACOES_DO_PROJETO.find(s => s.id === id) || SITUACOES_DO_PROJETO[0]).nome;

/** "#12" (o número curto, por dono). */
export const codigoDaIssue = i => (i && Number(i.numero) > 0 ? "#" + i.numero : "");
/** O próximo número (o banco também põe sozinho, se vier vazio). */
export const proximoNumero = issues => Math.max(0, ...issues.map(i => Number(i.numero) || 0)) + 1;

/**
 * O que muda junto com o status: no Done, o momento (e, sem ciclo, o ciclo do dia, para o esforço contar em algum
 * ciclo); saindo do Done, sem o momento. `hoje` = "AAAA-MM-DD" (o dia de Brasília).
 */
export function patchDeStatus(issue, para, hoje, agora = new Date()) {
  if (!issue || para === issue.status) return {};
  const patch = { status: para };
  if (para === "done") {
    patch.feita_em = agora.toISOString();
    if (!issue.ciclo) patch.ciclo = cicloDoDia(hoje);
  } else if (issue.status === "done") patch.feita_em = null;
  return patch;
}

const pontosDe = lista => lista.reduce((s, i) => s + (Number(i.estimativa) || 0), 0);

/** Quantas feitas e quantos pontos (só as estimadas somam pontos), e quantas em cada status. */
export function progresso(issues) {
  const feitas = issues.filter(i => i.status === "done");
  return {
    total: issues.length,
    feitas: feitas.length,
    pontos: pontosDe(issues),
    pontosFeitos: pontosDe(feitas),
    porStatus: Object.fromEntries(STATUS.map(s => [s.id, issues.filter(i => i.status === s.id).length])),
    fracao: issues.length ? feitas.length / issues.length : 0,
  };
}

const posicao = i => (typeof i.posicao === "number" ? i.posicao : Infinity);
const momento = v => { const t = Date.parse(v || ""); return Number.isNaN(t) ? 0 : t; };
/** Dentro de uma coluna: a ordem de arrastar, depois o número. No Done, a feita mais recente primeiro. */
export function compararIssues(a, b) {
  if (a.status === "done" && b.status === "done") return momento(b.feita_em) - momento(a.feita_em) || (Number(b.numero) || 0) - (Number(a.numero) || 0);
  return posicao(a) - posicao(b) || (Number(a.numero) || 0) - (Number(b.numero) || 0);
}
/** Posição para soltar entre dois cartões (sem vizinho, 1000 antes ou depois; sem nenhum, 1000). */
export function posicaoEntre(antes, depois) {
  const a = antes && Number.isFinite(antes.posicao) ? antes.posicao : null;
  const d = depois && Number.isFinite(depois.posicao) ? depois.posicao : null;
  if (a !== null && d !== null) return (a + d) / 2;
  if (a !== null) return a + 1000;
  if (d !== null) return d - 1000;
  return 1000;
}
/** A posição do fim de uma coluna. */
export const posicaoNoFim = doStatus => Math.max(0, ...doStatus.map(i => (Number.isFinite(i.posicao) ? i.posicao : 0))) + 1000;

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Os filtros do quadro: projeto ("" todos, SEM sem projeto, ou o id), ciclo ("" todos, "atual", "proximo", SEM, ou o
 * número), responsável ("" todos, SEM, ou o nome) e a busca (título, descrição, #número, nome do projeto).
 */
export function filtrarIssues(issues, filtro = {}, { hoje, projetos = [] } = {}) {
  const { projeto = "", ciclo = "", responsavel = "", busca = "" } = filtro;
  const atual = hoje ? cicloDoDia(hoje) : null;
  const nomeDoProjeto = new Map(projetos.map(p => [p.id, p.nome]));
  const termos = semAcento(busca).split(/\s+/).filter(Boolean);
  return issues.filter(i => {
    if (projeto === SEM ? i.projeto_id : projeto && i.projeto_id !== projeto) return false;
    if (ciclo === SEM && i.ciclo) return false;
    if (ciclo === "atual" && i.ciclo !== atual) return false;
    if (ciclo === "proximo" && i.ciclo !== atual + 1) return false;
    if (/^\d+$/.test(String(ciclo)) && i.ciclo !== Number(ciclo)) return false;
    if (responsavel === SEM ? i.responsavel : responsavel && i.responsavel !== responsavel) return false;
    if (termos.length) {
      const texto = semAcento([codigoDaIssue(i), i.numero, i.titulo, i.descricao, nomeDoProjeto.get(i.projeto_id)].join(" "));
      if (!termos.every(t => texto.includes(t))) return false;
    }
    return true;
  });
}

/** No quadro, o Done: as feitas nos últimos DIAS_DO_DONE dias (em Brasília) e as outras, guardadas à parte. */
export function separarDone(done, hoje, dias = DIAS_DO_DONE) {
  const desde = Date.parse(hoje + "T00:00:00-03:00") - dias * 86400000;
  const antiga = i => !!i.feita_em && momento(i.feita_em) < desde;
  return { recentes: done.filter(i => !antiga(i)), antigas: done.filter(antiga) };
}

/** Os ciclos da tela: o atual (pelo dia), o próximo, os que já passaram e os de depois do próximo, se tiverem issue. */
export function ciclosDaTela(issues, hoje) {
  const atual = cicloDoDia(hoje);
  const usados = [...new Set(issues.map(i => Number(i.ciclo)).filter(n => n > 0))];
  return {
    atual,
    proximo: atual + 1,
    passados: usados.filter(n => n < atual).sort((a, b) => b - a),
    adiante: usados.filter(n => n > atual + 1).sort((a, b) => a - b),
  };
}
/** Um ciclo: o período, o progresso e o que ficou sem terminar. */
export function resumoDoCiclo(issues, n) {
  const doCiclo = issues.filter(i => Number(i.ciclo) === n);
  const p = progresso(doCiclo);
  return { ciclo: n, ...periodoDoCiclo(n), ...p, ficaram: p.total - p.feitas, issues: doCiclo };
}
/** Os ciclos para escolher numa issue: dois para trás, o atual e três à frente, e o dela, se estiver fora disso. */
export function ciclosParaEscolher(hoje, daIssue = null) {
  const atual = cicloDoDia(hoje);
  const lista = [];
  for (let n = Math.max(1, atual - 2); n <= atual + 3; n++) lista.push(n);
  if (daIssue && !lista.includes(Number(daIssue))) lista.push(Number(daIssue));
  return lista.sort((a, b) => a - b);
}
/** Dias que faltam para o ciclo acabar (contando hoje): 1 no último dia. */
export const diasParaAcabar = (n, hoje) => Math.round((Date.parse(periodoDoCiclo(n).fim) - Date.parse(hoje)) / 86400000) + 1;

/** Projetos: em andamento primeiro (a meta mais perto, depois o mais novo); depois os concluídos, o mais recente antes. */
export function ordenarProjetos(projetos) {
  const andando = p => p.situacao !== "concluido";
  return [...projetos].sort((a, b) => {
    if (andando(a) !== andando(b)) return andando(a) ? -1 : 1;
    if (andando(a)) {
      if ((a.meta || "") !== (b.meta || "")) return !a.meta ? 1 : !b.meta ? -1 : a.meta.localeCompare(b.meta);
      return String(b.inicio || b.criado_em || "").localeCompare(String(a.inicio || a.criado_em || ""));
    }
    return String(b.concluido_em || "").localeCompare(String(a.concluido_em || ""));
  });
}
/** A meta passou e o projeto ainda está em andamento. */
export const projetoAtrasado = (p, hoje) => p.situacao !== "concluido" && !!p.meta && p.meta < hoje;

/** As issues de um projeto, agrupadas por status, na ordem dos status (só os que têm). */
export function issuesPorStatus(issues) {
  return STATUS.map(s => ({ ...s, issues: issues.filter(i => i.status === s.id).sort(compararIssues) })).filter(g => g.issues.length);
}

/** Issue nova a partir dos dados da janela (o número e a posição saem do que já existe). */
export function novaIssue(dados, existentes, hoje, agora = new Date()) {
  const status = dados.status || "backlog";
  const linha = {
    titulo: String(dados.titulo || "").trim(),
    descricao: String(dados.descricao || "").trim(),
    projeto_id: dados.projeto_id || null,
    status,
    estimativa: ESTIMATIVAS.includes(Number(dados.estimativa)) ? Number(dados.estimativa) : null,
    ciclo: Number(dados.ciclo) > 0 ? Number(dados.ciclo) : null,
    responsavel: dados.responsavel || null,
    numero: proximoNumero(existentes),
    posicao: posicaoNoFim(existentes.filter(i => i.status === status)),
  };
  if (status === "done") Object.assign(linha, patchDeStatus({ status: "backlog", ciclo: linha.ciclo }, "done", hoje, agora));
  return linha;
}
