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

/* ---------- o pacote de issues: o .md que vai e volta entre o painel e as sessões ---------- */
// Cada issue começa com "# Título" (o título é a linha toda); logo abaixo, as linhas de dados que quiser (status,
// estimativa, ciclo, responsavel, numero) e, depois de uma linha em branco, a documentação (Markdown, títulos a partir
// de ##). O que vem antes da primeira "# " é só apresentação: a importação ignora. Ver docs/projetos-e-issues.md.

const CHAVES_DO_PACOTE = { status: "status", estimativa: "estimativa", ciclo: "ciclo", responsavel: "responsavel", "responsável": "responsavel", numero: "numero", "número": "numero" };
const NOMES_DE_STATUS = {
  backlog: "backlog", todo: "todo", "to-do": "todo", "to do": "todo", "a fazer": "todo",
  in_progress: "in_progress", "in progress": "in_progress", "in-progress": "in_progress", doing: "in_progress", fazendo: "in_progress",
  validation: "validation", validacao: "validation", "validação": "validation", review: "validation", "em validação": "validation",
  done: "done", feito: "done", feita: "done", pronto: "done", "concluído": "done", concluido: "done",
};
const RE_CERCA_PACOTE = /^\s*(```|~~~)/;
/** A documentação dentro do pacote: um "# " (fora do código) viraria outra issue; vira "## ". */
function docParaPacote(doc) {
  let codigo = false;
  return String(doc || "").replace(/\r\n?/g, "\n").split("\n").map(l => {
    if (RE_CERCA_PACOTE.test(l)) { codigo = !codigo; return l; }
    return !codigo && /^#\s/.test(l) ? "#" + l : l;
  }).join("\n").trim();
}

/** Uma issue no formato do pacote (com o número: assim a importação atualiza a mesma issue). */
export function issueParaPacote(i) {
  const dados = [
    Number(i.numero) > 0 ? `numero: ${i.numero}` : null,
    `status: ${i.status || "backlog"}`,
    i.estimativa ? `estimativa: ${i.estimativa}` : null,
    i.ciclo ? `ciclo: ${i.ciclo}` : null,
    i.responsavel ? `responsavel: ${i.responsavel}` : null,
  ].filter(Boolean);
  const doc = docParaPacote(i.descricao);
  return `# ${String(i.titulo || "").replace(/\s+/g, " ").trim()}\n${dados.join("\n")}\n${doc ? "\n" + doc + "\n" : ""}`;
}

/** O projeto inteiro para levar a uma sessão: a apresentação (o projeto e a documentação dele) e as issues, na ordem. */
export function pacoteDoProjeto(projeto, issues, { cliente = "", hoje } = {}) {
  const dm = d => (d ? d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4) : "");
  const ordem = [...issues].sort((a, b) => ordemDoStatus(a.status) - ordemDoStatus(b.status) || compararIssues(a, b));
  const cabeca = [
    `Projeto: ${projeto.nome}`,
    cliente ? `Cliente: ${cliente}` : null,
    `Situação: ${nomeDaSituacao(projeto.situacao)}` + (projeto.inicio ? ` · início ${dm(projeto.inicio)}` : "") + (projeto.meta ? ` · meta ${dm(projeto.meta)}` : "") + (projeto.concluido_em ? ` · concluído em ${dm(projeto.concluido_em)}` : ""),
    hoje ? `Ciclo de hoje: ${cicloDoDia(hoje)} (de segunda a domingo)` : null,
    `Issues: ${issues.length} (${progresso(issues).feitas} em Done)`,
    "Formato: docs/projetos-e-issues.md (o painel importa este mesmo arquivo: com \"numero\", atualiza a issue).",
  ].filter(Boolean).join("\n");
  const doc = docParaPacote(projeto.descricao);
  return [cabeca, doc ? "Documentação do projeto:\n\n" + doc : null, "---", ...ordem.map(issueParaPacote)].filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

/**
 * Lê um pacote. Devolve { issues: [{ titulo, doc, numero, status, estimativa, ciclo, responsavel, campos }], avisos }.
 * `campos` diz o que veio (para a atualização mexer só nisso). `hoje` resolve "ciclo: atual" e "ciclo: próximo".
 */
export function lerPacote(texto, hoje) {
  const linhas = String(texto || "").replace(/\r\n?/g, "\n").split("\n");
  const lidas = [], avisos = [];
  let atual = null, codigo = false, lendoDados = false;
  for (const l of linhas) {
    const cerca = RE_CERCA_PACOTE.test(l);
    if (!codigo && !cerca && /^#\s+\S/.test(l)) {
      atual = { titulo: l.replace(/^#\s+/, "").trim(), dados: {}, doc: [] };
      lidas.push(atual);
      lendoDados = true;
      continue;
    }
    if (cerca) codigo = !codigo;
    if (!atual) continue; // a apresentação
    if (lendoDados && !cerca) {
      const m = l.match(/^\s*([A-Za-zÀ-ú]+)\s*:\s*(.*?)\s*$/);
      const chave = m && CHAVES_DO_PACOTE[m[1].toLowerCase()];
      if (chave) { atual.dados[chave] = m[2]; continue; }
      lendoDados = false;
      if (!l.trim()) continue;
    }
    lendoDados = false;
    atual.doc.push(l);
  }
  const issues = [];
  for (const a of lidas) {
    let titulo = a.titulo;
    const comNumero = titulo.match(/^#(\d+)\s*[·:-]?\s+(.+)$/);
    const nome = (comNumero ? comNumero[2] : titulo).trim();
    const onde = nome ? `"${nome}"` : "(sem título)";
    if (!nome) { avisos.push("Uma issue sem título ficou de fora."); continue; }
    const campos = new Set(Object.keys(a.dados));
    const i = { titulo: nome, doc: a.doc.join("\n").replace(/^\s*\n/, "").replace(/\s+$/, ""), numero: null, status: null, estimativa: null, ciclo: null, responsavel: null, campos };
    const numero = a.dados.numero !== undefined ? a.dados.numero.replace(/^#/, "") : comNumero ? comNumero[1] : "";
    if (numero) { if (/^\d+$/.test(numero) && Number(numero) > 0) { i.numero = Number(numero); campos.add("numero"); } else avisos.push(`${onde}: número "${numero}" não entendido; vai como issue nova.`); }
    if (campos.has("status")) {
      const s = NOMES_DE_STATUS[String(a.dados.status).toLowerCase().trim()];
      if (s) i.status = s; else { avisos.push(`${onde}: status "${a.dados.status}" não existe; vai para Backlog.`); i.status = "backlog"; }
    }
    if (campos.has("estimativa")) {
      const e = String(a.dados.estimativa).replace(/\s*(pts?|pontos?)$/i, "").trim();
      if (!e || e === "-") i.estimativa = null;
      else if (ESTIMATIVAS.includes(Number(e))) i.estimativa = Number(e);
      else avisos.push(`${onde}: estimativa "${a.dados.estimativa}" fora da escala (${ESTIMATIVAS.join(", ")}); fica sem.`);
    }
    if (campos.has("ciclo")) {
      const c = semAcento(a.dados.ciclo).replace(/^ciclo\s*/, "").replace(/^c/, "").trim();
      const atualDoDia = hoje ? cicloDoDia(hoje) : null;
      if (!c || c === "-") i.ciclo = null;
      else if (/^\d+$/.test(c) && Number(c) > 0) i.ciclo = Number(c);
      else if (c === "atual" && atualDoDia) i.ciclo = atualDoDia;
      else if (c === "proximo" && atualDoDia) i.ciclo = atualDoDia + 1;
      else avisos.push(`${onde}: ciclo "${a.dados.ciclo}" não entendido; fica sem.`);
    }
    if (campos.has("responsavel")) i.responsavel = String(a.dados.responsavel).trim() || null;
    issues.push(i);
  }
  return { issues, avisos };
}

const tituloComparavel = t => semAcento(t).replace(/\s+/g, " ").trim();

/**
 * O que a importação faz num projeto: com número, atualiza aquela issue (se for deste projeto); sem número, atualiza a
 * issue de mesmo título do projeto (assim, importar o mesmo arquivo de novo não duplica) ou cria uma nova.
 * Na atualização, só muda o que veio; documentação vazia não apaga a que existe.
 * Devolve { criar: [dados para novaIssue], atualizar: [{ issue, patch }], avisos }.
 */
export function planoDeImportacao(lidas, existentes, projetoId, hoje, agora = new Date()) {
  const doProjeto = existentes.filter(i => i.projeto_id === projetoId);
  const criar = [], atualizar = [], avisos = [];
  const vistos = new Set();
  for (const l of lidas) {
    let alvo = null;
    if (l.numero) {
      const achada = existentes.find(i => Number(i.numero) === l.numero);
      if (!achada) { avisos.push(`#${l.numero} não existe; "${l.titulo}" ficou de fora.`); continue; }
      if (achada.projeto_id !== projetoId) { avisos.push(`#${l.numero} é de outro projeto; "${l.titulo}" ficou de fora.`); continue; }
      alvo = achada;
    } else {
      const iguais = doProjeto.filter(i => tituloComparavel(i.titulo) === tituloComparavel(l.titulo));
      if (iguais.length === 1) alvo = iguais[0];
      else if (iguais.length > 1) { avisos.push(`"${l.titulo}": há ${iguais.length} issues com esse título no projeto; ficou de fora (ponha o número).`); continue; }
    }
    const chave = alvo ? "#" + alvo.id : tituloComparavel(l.titulo);
    if (vistos.has(chave)) { avisos.push(`"${l.titulo}" aparece duas vezes no arquivo; valeu a primeira.`); continue; }
    vistos.add(chave);
    if (!alvo) {
      criar.push({ titulo: l.titulo, descricao: l.doc, projeto_id: projetoId, status: l.status || "backlog", estimativa: l.estimativa, ciclo: l.ciclo, responsavel: l.responsavel });
      continue;
    }
    const patch = {};
    if (l.titulo !== alvo.titulo) patch.titulo = l.titulo;
    if (l.doc && l.doc !== (alvo.descricao || "")) patch.descricao = l.doc;
    for (const c of ["estimativa", "ciclo", "responsavel"]) if (l.campos.has(c) && (l[c] ?? null) !== (alvo[c] ?? null)) patch[c] = l[c];
    if (l.campos.has("status") && l.status !== alvo.status) Object.assign(patch, patchDeStatus({ ...alvo, ciclo: patch.ciclo !== undefined ? patch.ciclo : alvo.ciclo }, l.status, hoje, agora));
    if (Object.keys(patch).length) atualizar.push({ issue: alvo, patch });
  }
  return { criar, atualizar, avisos };
}
