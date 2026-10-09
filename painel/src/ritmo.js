// Placar da tela Ritmo: funções puras (sem tela e sem banco), testadas em test/ritmo.test.mjs.
//
// Regras (as mesmas do banco, em supabase/schema.sql):
// - Ótica nova = PRIMEIRO CONTATO com data exata dentro do período. Um por ótica. Criar lead,
//   criar demo ou atualizar a linha não conta. Mudar a etapa de antes do contato para "Em
//   andamento" (ou depois) registra o primeiro contato do dia, se a ótica ainda não tiver (contatoPelaEtapa).
// - Retorno feito = interação "retorno" (nova abordagem sua a uma ótica já contatada) no período.
//   Resposta da ótica não conta; reagendar o follow-up não conta.
// - Retorno previsto no período = retornos feitos que cumpriram um follow-up marcado para o período
//   + óticas já contatadas com follow-up no período ainda sem retorno.
// - Primeiro contato recuperado (data aproximada ou desconhecida) nunca conta como ótica nova.
//
// Datas são sempre "AAAA-MM-DD" (dia do calendário local) e são comparadas como texto.

import { ETAPAS, pesoDoInteresse, faseDaEtapa } from "./modelo.js";

/* ---------- datas ---------- */
const paraData = iso => { const [a, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(a, m - 1, d)); };
const paraIso = d => d.toISOString().slice(0, 10);
export const somarDias = (iso, n) => { const d = paraData(iso); d.setUTCDate(d.getUTCDate() + n); return paraIso(d); };
/** Dias de a até b (b - a). */
export const diasEntre = (a, b) => Math.round((paraData(b) - paraData(a)) / 864e5);
export const dentro = (iso, p) => !!iso && iso >= p.inicio && iso <= p.fim;
export function hojeLocal(agora = new Date()) {
  return agora.getFullYear() + "-" + String(agora.getMonth() + 1).padStart(2, "0") + "-" + String(agora.getDate()).padStart(2, "0");
}

/** Semana de segunda a domingo que contém o dia. */
export function semanaDe(iso) {
  const dow = (paraData(iso).getUTCDay() + 6) % 7; // segunda = 0
  const inicio = somarDias(iso, -dow);
  return { tipo: "semana", inicio, fim: somarDias(inicio, 6) };
}
export function mesDe(iso) {
  const [a, m] = iso.split("-").map(Number);
  const inicio = `${a}-${String(m).padStart(2, "0")}-01`;
  const fim = paraIso(new Date(Date.UTC(a, m, 0)));
  return { tipo: "mes", inicio, fim };
}
export function cicloComoPeriodo(ciclo) { return { tipo: "ciclo", inicio: ciclo.inicio, fim: ciclo.fim }; }

/** Ciclo cuja cadência vale hoje: o mais recente que já começou (igual ao banco). */
export function cicloVigente(ciclos, hoje) {
  return [...ciclos].filter(c => c.inicio <= hoje).sort((a, b) => b.inicio.localeCompare(a.inicio))[0] || null;
}
/** Ciclo para abrir a tela: o que contém hoje; senão o mais recente que já começou; senão o próximo. */
export function cicloParaMostrar(ciclos, hoje) {
  const ordenados = [...ciclos].sort((a, b) => a.inicio.localeCompare(b.inicio));
  return ordenados.find(c => c.inicio <= hoje && hoje <= c.fim) || cicloVigente(ordenados, hoje) || ordenados[0] || null;
}

/* ---------- interações por ótica ---------- */
const precisao = i => i.precisao || "exata";
export const contaComoNova = i => i.tipo === "primeiro_contato" && precisao(i) === "exata" && !!i.ocorreu_em;

/** Map lead_id -> interações em ordem cronológica (sem data no começo). Ignora interações de leads que não existem. */
export function indexar(leads, interacoes) {
  const ids = new Set(leads.map(l => l.id));
  const porLead = new Map();
  for (const i of interacoes) {
    if (!ids.has(i.lead_id)) continue;
    if (!porLead.has(i.lead_id)) porLead.set(i.lead_id, []);
    porLead.get(i.lead_id).push(i);
  }
  for (const lista of porLead.values()) lista.sort(cronologica);
  return porLead;
}
export const cronologica = (a, b) => String(a.ocorreu_em || "").localeCompare(String(b.ocorreu_em || "")) || String(a.criado_em || "").localeCompare(String(b.criado_em || ""));

export const primeiroContato = lista => lista.find(i => i.tipo === "primeiro_contato") || null;
export function ultimaInteracao(lista) {
  const comData = lista.filter(i => i.ocorreu_em);
  return comData.length ? comData[comData.length - 1] : lista[lista.length - 1] || null;
}

// Antes do contato: Leads a trabalhar e Prontas para trabalhar. Com contato: Em andamento e Finalizado.
const antesDoContato = etapa => ["a_trabalhar", "demo_pronta"].includes(faseDaEtapa(etapa));
const depoisDoContato = etapa => ["em_andamento", "finalizado"].includes(faseDaEtapa(etapa));
/** Mudar a etapa de antes do contato para "Em andamento" (ou depois) registra o primeiro contato,
 *  se a ótica ainda não tiver um. `lista` = interações da ótica. */
export const contatoPelaEtapa = (de, para, lista) =>
  antesDoContato(de) && depoisDoContato(para) && !primeiroContato(lista);

/** Data do retorno ainda por fazer (ou null): ótica já contatada, com follow-up, sem pedido para parar,
 *  não finalizada, e nenhum retorno já cumpriu essa data. */
export function retornoPendente(lead, lista) {
  if (!lead.followup_em || lead.nao_contatar || lead.etapa === "finalizado") return null;
  if (!primeiroContato(lista)) return null; // follow-up antes do primeiro contato é prospecção planejada, não retorno
  if (lista.some(i => i.tipo === "retorno" && i.previsto_para === lead.followup_em)) return null;
  return lead.followup_em;
}

/** Próximo retorno pela cadência, só para quem ainda não respondeu (igual a renderiza_retorno_sugerido no banco). */
export function retornoSugerido(lead, lista, ciclo) {
  if (lead.nao_contatar || lead.etapa === "finalizado") return null;
  const pc = primeiroContato(lista);
  if (!pc || !contaComoNova(pc)) return null;
  if (lista.some(i => i.tipo === "resposta")) return null; // respondeu: vale a data combinada
  const d1 = (ciclo && ciclo.dias_primeiro_retorno) || 7;
  const d2 = (ciclo && ciclo.dias_segundo_retorno) || 21;
  const feitos = lista.filter(i => i.tipo === "retorno").length;
  if (feitos === 0) return { data: somarDias(pc.ocorreu_em, d1), texto: `1º retorno, ${d1} dias depois do primeiro contato` };
  if (feitos === 1) return { data: somarDias(pc.ocorreu_em, d2), texto: `2º retorno, ${d2} dias depois do primeiro contato` };
  return null; // dois retornos sem resposta: fica em espera até haver motivo para retomar
}

/* ---------- placar ---------- */
/**
 * @returns {{novas: object[], retornosFeitos: object[], cumpridos: object[], pendentes: object[],
 *            previstos: number, respostas: number, ganhos: object[], perdas: object[], encerrados: object[]}}
 */
export function placar({ leads, interacoes, periodo, porLead = indexar(leads, interacoes) }) {
  const r = { periodo, novas: [], retornosFeitos: [], cumpridos: [], pendentes: [], respostas: 0, ganhos: [], perdas: [], encerrados: [] };
  const fechados = { ganho: r.ganhos, perda: r.perdas, encerrado: r.encerrados };
  for (const lead of leads) {
    const lista = porLead.get(lead.id) || [];
    const pc = primeiroContato(lista); // só o primeiro: uma ótica conta uma vez, mesmo com dado repetido
    if (pc && contaComoNova(pc) && dentro(pc.ocorreu_em, periodo)) r.novas.push({ lead, interacao: pc });
    for (const i of lista) {
      if (i.tipo === "retorno") {
        if (dentro(i.ocorreu_em, periodo)) r.retornosFeitos.push({ lead, interacao: i });
        if (dentro(i.previsto_para, periodo)) r.cumpridos.push({ lead, interacao: i });
      }
      if (i.tipo === "resposta" && dentro(i.ocorreu_em, periodo)) r.respostas++;
    }
    const pendente = retornoPendente(lead, lista);
    if (pendente && dentro(pendente, periodo)) r.pendentes.push({ lead, data: pendente });
    if (lead.etapa === "finalizado" && fechados[lead.resultado] && dentro(lead.data_fechamento, periodo)) fechados[lead.resultado].push(lead);
  }
  r.previstos = r.cumpridos.length + r.pendentes.length;
  return r;
}

/** Parte da meta do ciclo que cabe no período (proporcional aos dias em comum). */
export function metaProporcional(ciclo, periodo) {
  if (!ciclo) return null;
  const inicio = periodo.inicio > ciclo.inicio ? periodo.inicio : ciclo.inicio;
  const fim = periodo.fim < ciclo.fim ? periodo.fim : ciclo.fim;
  if (inicio > fim) return 0;
  return Math.round(ciclo.meta_novas * (diasEntre(inicio, fim) + 1) / (diasEntre(ciclo.inicio, ciclo.fim) + 1));
}

/** Quanto falta e quantas novas por semana são precisas para bater a meta do ciclo. */
export function ritmoNecessario({ ciclo, feitas, hoje }) {
  if (!ciclo) return null;
  const faltam = Math.max(0, ciclo.meta_novas - feitas);
  if (hoje > ciclo.fim) return { estado: "encerrado", feitas, faltam, meta: ciclo.meta_novas };
  const desde = hoje < ciclo.inicio ? ciclo.inicio : hoje;
  const dias = diasEntre(desde, ciclo.fim) + 1; // conta o dia de hoje
  const porSemana = faltam === 0 ? 0 : dias < 7 ? faltam : Math.ceil(faltam / (dias / 7));
  const decorridos = hoje < ciclo.inicio ? 0 : diasEntre(ciclo.inicio, hoje) + 1;
  const media = decorridos >= 7 ? Math.round((feitas / decorridos) * 7 * 10) / 10 : null;
  return { estado: hoje < ciclo.inicio ? "futuro" : "andamento", feitas, faltam, meta: ciclo.meta_novas, dias, porSemana, mediaPorSemana: media };
}

/** Retornos que ainda vão cair, por semana (para ajustar o ritmo de prospecção). */
export function filaDeRetornos({ leads, interacoes, hoje, porLead = indexar(leads, interacoes) }) {
  const semana = semanaDe(hoje);
  const proxima = semanaDe(somarDias(semana.inicio, 7));
  const emDuas = semanaDe(somarDias(semana.inicio, 14));
  const fila = { atrasados: [], estaSemana: [], proxima: [], emDuas: [], depois: [] };
  for (const lead of leads) {
    const data = retornoPendente(lead, porLead.get(lead.id) || []);
    if (!data) continue;
    const item = { lead, data };
    if (data < hoje) fila.atrasados.push(item);
    else if (data <= semana.fim) fila.estaSemana.push(item);
    else if (data <= proxima.fim) fila.proxima.push(item);
    else if (data <= emDuas.fim) fila.emDuas.push(item);
    else fila.depois.push(item);
  }
  Object.values(fila).forEach(l => l.sort((a, b) => a.data.localeCompare(b.data)));
  return fila;
}

/** Semana a semana dentro do ciclo, até a semana de hoje. */
export function semanasDoCiclo({ ciclo, leads, interacoes, hoje, porLead = indexar(leads, interacoes) }) {
  const linhas = [];
  const ultima = hoje < ciclo.fim ? hoje : ciclo.fim;
  for (let s = semanaDe(ciclo.inicio); s.inicio <= ultima; s = semanaDe(somarDias(s.inicio, 7))) {
    const p = placar({ leads, interacoes, periodo: s, porLead });
    linhas.push({ periodo: s, novas: p.novas.length, meta: metaProporcional(ciclo, s), retornosFeitos: p.retornosFeitos.length, previstos: p.previstos });
  }
  return linhas;
}

/**
 * A turma do mês: óticas cujo primeiro contato (data exata) caiu no período, e como estão hoje.
 * Ordem: mais interesse primeiro, depois a interação mais recente.
 */
export function turma({ leads, interacoes, periodo, porLead = indexar(leads, interacoes) }) {
  const linhas = [];
  for (const lead of leads) {
    const lista = porLead.get(lead.id) || [];
    const pc = primeiroContato(lista);
    if (!pc || !contaComoNova(pc) || !dentro(pc.ocorreu_em, periodo)) continue;
    linhas.push({
      lead,
      primeiro: pc.ocorreu_em,
      ultima: ultimaInteracao(lista),
      respondeu: lista.some(i => i.tipo === "resposta"),
      retornos: lista.filter(i => i.tipo === "retorno").length,
      pendente: retornoPendente(lead, lista),
    });
  }
  return linhas.sort((a, b) =>
    pesoDoInteresse(b.lead.interesse) - pesoDoInteresse(a.lead.interesse)
    || String((b.ultima && b.ultima.ocorreu_em) || "").localeCompare(String((a.ultima && a.ultima.ocorreu_em) || ""))
    || String(a.lead.empresa).localeCompare(String(b.lead.empresa), "pt-BR"));
}

/* ---------- dados históricos incertos ---------- */
/** O que o painel antigo guardou sobre contato (só como pista; nunca vira primeiro contato sozinho). */
export function pistaDoPainelAntigo(lead) {
  const l = lead.legado;
  if (!l || typeof l !== "object") return null;
  const dia = v => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
  const enviado = dia(l.enviadoEm), ultimo = dia(l.ultimoContato);
  if (!enviado && !ultimo) return null;
  const partes = [];
  if (enviado) partes.push(`marcou "Enviado" em ${enviado.split("-").reverse().join("/")}`);
  if (ultimo && ultimo !== enviado) partes.push(`último contato em ${ultimo.split("-").reverse().join("/")}`);
  else if (ultimo && !enviado) partes.push(`último contato em ${ultimo.split("-").reverse().join("/")}`);
  return { data: enviado || ultimo, texto: "O painel antigo " + partes.join(" e ") + "." };
}

/** Óticas que parecem já contatadas (etapa, interações ou painel antigo) mas não têm primeiro contato registrado. */
export function semPrimeiroContato({ leads, interacoes, porLead = indexar(leads, interacoes) }) {
  return leads.filter(lead => {
    const lista = porLead.get(lead.id) || [];
    if (primeiroContato(lista)) return false;
    return depoisDoContato(lead.etapa) || lista.length > 0 || !!pistaDoPainelAntigo(lead);
  }).sort((a, b) => ETAPAS.findIndex(e => e.id === b.etapa) - ETAPAS.findIndex(e => e.id === a.etapa) || String(a.empresa).localeCompare(String(b.empresa), "pt-BR"));
}

/* ---------- validação (as mesmas regras de interacoes_validar no banco) ---------- */
/** Devolve a mensagem de erro, ou null se a interação pode ser gravada. `outras` = demais interações da ótica. */
export function validarInteracao(nova, outras, hoje) {
  const p = nova.precisao || "exata";
  if (!["primeiro_contato", "retorno", "resposta", "anotacao"].includes(nova.tipo)) return "Tipo de interação desconhecido.";
  if ((p === "desconhecida") !== !nova.ocorreu_em) return p === "desconhecida" ? "Data desconhecida não leva data." : "Falta a data em que aconteceu.";
  if (p !== "exata" && nova.tipo !== "primeiro_contato") return "Só o primeiro contato de uma conversa antiga pode ficar sem data exata.";
  if (nova.ocorreu_em && nova.ocorreu_em > hoje) {
    return `A interação está com data de ${nova.ocorreu_em.split("-").reverse().join("/")}, que ainda não chegou. Interação é o que já aconteceu; datas planejadas vão em Follow-up.`;
  }
  const demais = outras.filter(i => i.id !== nova.id);
  const pc = demais.find(i => i.tipo === "primeiro_contato");
  if (nova.tipo === "primeiro_contato") {
    if (pc) return "Esta ótica já tem primeiro contato registrado. Uma nova abordagem é um retorno.";
    if (p === "exata" && demais.some(i => i.tipo === "retorno" && i.ocorreu_em < nova.ocorreu_em)) return "Há retorno registrado antes dessa data; o primeiro contato não pode ser depois dele.";
  }
  if (nova.tipo === "retorno") {
    if (!pc) return "Esta ótica ainda não tem primeiro contato registrado. Registre o primeiro contato (ou recupere como já contatada) antes do retorno.";
    if (contaComoNova(pc) && nova.ocorreu_em < pc.ocorreu_em) return "O retorno não pode ser antes do primeiro contato.";
  }
  return null;
}

/* ---------- nomes ---------- */
export const normalizar = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
/** Mesma chave do banco (renderiza_chave_nome): "Óticas Perez" e "Ótica Perez" viram "perez". */
export function chaveDoNome(t) {
  const n = normalizar(t);
  return n.replace(/\b(o|op)ticas?\b/g, " ").replace(/\s+/g, " ").trim() || n;
}
