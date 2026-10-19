// Filtros do Pipeline (tabela e kanban), no jeito do Linear, só que simples. Cada filtro é um campo e:
// - nas listas (etapa, ciclo, nicho…): os valores escolhidos e o operador "é" ou "não é" (vale qualquer um deles);
// - nas datas (início da conversa, retorno previsto…): um período (hoje, últimos 7 dias, neste ciclo, entre datas…).
// Filtros de campos diferentes valem todos juntos. Aqui só a lógica (testada em test/filtros.test.mjs); a tela
// fica em filtros-ui.js. `ctx` traz o que não está no lead: {hoje, interacoesDe(id), tarefasDe(id), demoDe(l), temVideo(l)}.

import { ETAPAS, RESULTADOS, INTERESSES } from "./modelo.js";
import { tagsDe, numeroDoCiclo, tagDoCiclo, classeDaTag, cicloDoDia, periodoDoCiclo, descricaoDaTag } from "./tags.js";
import { itensDe, progresso } from "./checklist.js";
import { primeiroContato, ultimaInteracao, retornoPendente, semanaDe, somarDias } from "./ritmo.js";

export const SEM = "__sem";
const comparar = (a, b) => String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base", numeric: true });
/** "Jardim São Paulo · São Paulo" → "São Paulo" (a cidade vem depois do ponto). */
export const cidadeDe = l => { const s = String(l.cidade || ""); return (s.includes("·") ? s.split("·").pop() : s).trim(); };
const diaLocal = ts => { const d = new Date(ts); return ts && !Number.isNaN(d.getTime()) ? d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") : null; };
/** Opções tiradas dos próprios leads, das mais comuns para as menos. */
function doDados(leads, ctx, valores, rotulo = v => v) {
  const conta = new Map();
  for (const l of leads) for (const v of valores(l, ctx)) if (v !== SEM) conta.set(v, (conta.get(v) || 0) + 1);
  return [...conta.keys()].sort((a, b) => conta.get(b) - conta.get(a) || comparar(a, b)).map(v => ({ valor: v, nome: rotulo(v) }));
}

/* ---------- períodos (campos de data) ---------- */
export const PERIODOS = {
  hoje: "Hoje", ontem: "Ontem", "7d": "Nos últimos 7 dias", "30d": "Nos últimos 30 dias",
  ciclo: "Neste ciclo", ciclo_passado: "No ciclo passado",
  atrasado: "Atrasado", semana: "Até o fim da semana", prox7: "Nos próximos 7 dias", qualquer: "Com data",
  intervalo: "Entre datas…", sem: "Sem data",
};
const PASSADO = ["hoje", "ontem", "7d", "30d", "ciclo", "ciclo_passado", "intervalo", "sem"];
const FUTURO = ["atrasado", "hoje", "semana", "prox7", "qualquer", "intervalo", "sem"];

/** O dia `d` ("AAAA-MM-DD" ou null) está no período do filtro? */
export function noPeriodo(d, f, hoje) {
  if (f.periodo === "sem") return !d;
  if (!d) return false;
  switch (f.periodo) {
    case "qualquer": return true;
    case "hoje": return d === hoje;
    case "ontem": return d === somarDias(hoje, -1);
    case "7d": return d >= somarDias(hoje, -6) && d <= hoje;
    case "30d": return d >= somarDias(hoje, -29) && d <= hoje;
    case "ciclo": case "ciclo_passado": {
      const p = periodoDoCiclo(cicloDoDia(hoje) - (f.periodo === "ciclo" ? 0 : 1));
      return d >= p.inicio && d <= p.fim;
    }
    case "atrasado": return d < hoje;
    case "semana": return d >= hoje && d <= semanaDe(hoje).fim;
    case "prox7": return d >= hoje && d <= somarDias(hoje, 7);
    case "intervalo": return (!f.de || d >= f.de) && (!f.ate || d <= f.ate);
    default: return true;
  }
}

/* ---------- campos ---------- */
const lista = (id, nome, icone, grupo, valores, opcoes, extra = {}) => ({ id, nome, icone, grupo, tipo: "lista", valores, opcoes, ...extra });
const data = (id, nome, icone, grupo, dia, periodos) => ({ id, nome, icone, grupo, tipo: "data", dia, periodos });
const sim = (nome, valor = SEM) => ({ valor, nome });

export const GRUPOS = ["Funil", "Ótica", "Datas", "Outros"];
export const CAMPOS = [
  lista("etapa", "Etapa", "kanban", "Funil",
    l => [l.etapa === "finalizado" ? "finalizado:" + (l.resultado || "") : l.etapa],
    () => [...ETAPAS.filter(e => e.id !== "finalizado").map(e => ({ valor: e.id, nome: e.nome })),
      ...RESULTADOS.map(r => ({ valor: "finalizado:" + r.id, nome: "Finalizado · " + r.nome, classe: "resultado-" + r.id }))],
    { plural: "etapas" }),
  lista("ciclo", "Ciclo", "relogio", "Funil",
    l => { const c = tagsDe(l).map(numeroDoCiclo).filter(Boolean).map(tagDoCiclo); return c.length ? c : [SEM]; },
    leads => {
      const ns = [...new Set(leads.flatMap(l => tagsDe(l).map(numeroDoCiclo).filter(Boolean)))].sort((a, b) => a - b);
      return [...ns.map(n => ({ valor: tagDoCiclo(n), nome: "Ciclo " + n, curto: "C" + n, classe: classeDaTag(tagDoCiclo(n)), dica: descricaoDaTag(tagDoCiclo(n)) })), sim("Sem ciclo")];
    }, { plural: "ciclos" }),
  lista("interesse", "Interesse", "alvo", "Funil", l => [l.interesse || "nao_avaliado"], () => INTERESSES.map(x => ({ valor: x.id, nome: x.nome }))),
  lista("proximo", "Próximo passo", "direita", "Funil",
    l => { const p = progresso(itensDe(l)).proximo; return [p ? p.texto : SEM]; },
    (leads, ctx) => [...doDados(leads, ctx, l => { const p = progresso(itensDe(l)).proximo; return [p ? p.texto : SEM]; }), sim("Nada pendente")],
    { plural: "passos", busca: true }),
  lista("checklist", "Checklist", "tarefas", "Funil",
    l => { const p = progresso(itensDe(l)); return [!p.total ? SEM : p.completa ? "completa" : "pendente"]; },
    () => [sim("Com itens pendentes", "pendente"), sim("Toda feita", "completa"), sim("Sem checklist")]),

  lista("nicho", "Nicho", "camadas", "Ótica", l => [String(l.segmento || "").trim() || SEM],
    (leads, ctx) => [...doDados(leads, ctx, l => [String(l.segmento || "").trim() || SEM]), sim("Sem nicho")], { plural: "nichos" }),
  lista("cidade", "Cidade", "local", "Ótica", l => [cidadeDe(l) || SEM],
    (leads, ctx) => [...doDados(leads, ctx, l => [cidadeDe(l) || SEM]), sim("Sem cidade")], { plural: "cidades", busca: true }),
  lista("tags", "Tags", "nota", "Ótica",
    l => { const t = tagsDe(l).filter(x => !numeroDoCiclo(x)); return t.length ? t : [SEM]; },
    (leads, ctx) => [...doDados(leads, ctx, l => tagsDe(l).filter(x => !numeroDoCiclo(x))), sim("Sem tags")], { plural: "tags" }),
  lista("materiais", "Materiais", "imagem", "Ótica",
    (l, ctx) => { const m = [String(l.link_demo || "").trim() && "demo", ctx.temVideo(l) && "video", String(l.link_flyer || "").trim() && "flyer"].filter(Boolean); return m.length ? m : [SEM]; },
    () => [sim("Com demo", "demo"), sim("Com vídeo", "video"), sim("Com flyer", "flyer"), sim("Sem nenhum")], { plural: "materiais" }),
  lista("demo", "Demo no ar", "monitor", "Ótica", (l, ctx) => [ctx.demoDe(l) || SEM],
    () => [sim("No ar", "no_ar"), sim("No último dia", "ultimo_dia"), sim("Expirada ou fora do ar", "fora"), sim("Sem demo")]),

  data("inicio", "Início da conversa", "conversa", "Datas", (l, ctx) => { const pc = primeiroContato(ctx.interacoesDe(l.id)); return (pc && pc.ocorreu_em) || null; }, PASSADO),
  data("ultima", "Última interação", "mensagem", "Datas", (l, ctx) => { const u = ultimaInteracao(ctx.interacoesDe(l.id)); return (u && u.ocorreu_em) || null; }, PASSADO),
  data("retorno", "Retorno previsto", "calendario", "Datas", (l, ctx) => retornoPendente(l, ctx.interacoesDe(l.id)), FUTURO),
  data("criado", "Entrou no painel", "mais", "Datas", l => diaLocal(l.criado_em), PASSADO),

  lista("tarefas", "Tarefas", "certo", "Outros",
    (l, ctx) => { const t = ctx.tarefasDe(l.id); return !t ? [SEM] : t.atrasadas ? ["aberta", "atrasada"] : ["aberta"]; },
    () => [sim("Com tarefa em aberto", "aberta"), sim("Com tarefa atrasada", "atrasada"), sim("Sem tarefa em aberto")]),
  lista("marcacoes", "Marcações", "alerta", "Outros",
    l => { const m = [l.nao_contatar && "nao_contatar", l.revisar && "revisar"].filter(Boolean); return m.length ? m : [SEM]; },
    () => [sim("Não contatar", "nao_contatar"), sim("Marcado para revisar", "revisar"), sim("Sem marcação")]),
];
export const campo = id => CAMPOS.find(c => c.id === id) || null;

/* ---------- aplicar ---------- */
/** Filtro com campo conhecido e algo escolhido; o resto é descartado (ex.: o que veio de uma versão antiga). */
export function valido(f) {
  const c = f && campo(f.campo);
  if (!c) return false;
  if (c.tipo === "lista") return Array.isArray(f.valores) && f.valores.length > 0;
  return c.periodos.includes(f.periodo) && (f.periodo !== "intervalo" || !!(f.de || f.ate));
}
export const limpar = filtros => (Array.isArray(filtros) ? filtros.filter(valido).map(f => ({ ...f })) : []);

export function passa(l, f, ctx) {
  const c = campo(f.campo);
  if (c.tipo === "data") return noPeriodo(c.dia(l, ctx), f, ctx.hoje);
  const tem = c.valores(l, ctx).some(v => f.valores.includes(v));
  return f.op === "nao" ? !tem : tem;
}
/** Leads que passam em todos os filtros (menos o do campo `exceto`, para contar as opções dele). */
export const aplicar = (leads, filtros, ctx, exceto = null) =>
  leads.filter(l => filtros.every(f => f.campo === exceto || !valido(f) || passa(l, f, ctx)));

/** Quantos leads há em cada opção do campo, considerando os outros filtros. */
export function contar(leads, filtros, c, ctx) {
  const base = aplicar(leads, filtros, ctx, c.id);
  const conta = new Map();
  if (c.tipo === "lista") for (const l of base) for (const v of new Set(c.valores(l, ctx))) conta.set(v, (conta.get(v) || 0) + 1);
  else for (const p of c.periodos) if (p !== "intervalo") conta.set(p, base.filter(l => noPeriodo(c.dia(l, ctx), { periodo: p }, ctx.hoje)).length);
  return conta;
}

/* ---------- mudar ---------- */
/** Liga ou desliga um valor no filtro do campo (cria o filtro se precisar; some quando fica vazio). */
export function alternarValor(filtros, idCampo, valor) {
  const i = filtros.findIndex(f => f.campo === idCampo);
  if (i < 0) return [...filtros, { campo: idCampo, op: "e", valores: [valor] }];
  const f = filtros[i], valores = f.valores.includes(valor) ? f.valores.filter(v => v !== valor) : [...f.valores, valor];
  return valores.length ? filtros.map((x, j) => (j === i ? { ...f, valores } : x)) : filtros.filter((_, j) => j !== i);
}
export const definirPeriodo = (filtros, idCampo, periodo, de = null, ate = null) =>
  [...filtros.filter(f => f.campo !== idCampo), { campo: idCampo, periodo, ...(periodo === "intervalo" ? { de, ate } : {}) }];
export const alternarOperador = (filtros, idCampo) => filtros.map(f => (f.campo === idCampo ? { ...f, op: f.op === "nao" ? "e" : "nao" } : f));
export const tirar = (filtros, idCampo) => filtros.filter(f => f.campo !== idCampo);

/* ---------- texto do filtro ---------- */
const dm = d => (d ? d.slice(8, 10) + "/" + d.slice(5, 7) : "");
/** {campo, operador, valores} para o chip: "Etapa" "é um de" "Em conversa, Sem resposta". */
export function descrever(f, opcoes) {
  const c = campo(f.campo);
  if (c.tipo === "data") {
    const texto = f.periodo !== "intervalo" ? PERIODOS[f.periodo].toLowerCase()
      : f.de && f.ate ? `de ${dm(f.de)} a ${dm(f.ate)}` : f.de ? `a partir de ${dm(f.de)}` : `até ${dm(f.ate)}`;
    return { campo: c.nome, operador: "", valores: texto };
  }
  const nome = v => { const o = opcoes.find(x => x.valor === v); return o ? o.curto || o.nome : v === SEM ? "vazio" : v; };
  const varios = f.valores.length > 1;
  const operador = f.op === "nao" ? (varios ? "não é nenhum de" : "não é") : varios ? "é um de" : "é";
  const valores = f.valores.length <= 2 ? f.valores.map(nome).join(", ") : `${nome(f.valores[0])}, ${nome(f.valores[1])} +${f.valores.length - 2}`;
  return { campo: c.nome, operador, valores };
}

/** O filtro que a fila de retornos do Ritmo abre no Pipeline. */
export const FILTRO_DO_RITMO = {
  retornos_atrasados: { campo: "retorno", periodo: "atrasado" },
  retornos_semana: { campo: "retorno", periodo: "semana" },
  retornos: { campo: "retorno", periodo: "qualquer" },
};
