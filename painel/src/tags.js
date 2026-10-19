// Tags dos leads (coluna leads.tags). A de ciclo ("ciclo 2") diz em que ciclo de prospecção a conversa começou:
// ciclos semanais, de sexta a quinta, contados a partir do ciclo 1 (02 a 08/10/2026); o que veio antes (a lista de
// agosto) também é ciclo 1. Ela entra sozinha quando o lead sai de Leads a trabalhar ou de Prontas para trabalhar
// (aqui e no gatilho leads_marcar_ciclo do supabase/schema.sql) e aparece no cartão como C1, C2…, uma cor por ciclo.
// As outras tags são livres, escritas nos detalhes da ótica.

import { faseDaEtapa } from "./modelo.js";

export const INICIO_DOS_CICLOS = "2026-10-02"; // sexta em que começou o ciclo 1
const DIA = 86400000;
const emDias = iso => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / DIA;
const dataDe = dias => new Date(dias * DIA).toISOString().slice(0, 10);

/** Número do ciclo de um dia "AAAA-MM-DD" (antes do ciclo 1 também é 1). */
export const cicloDoDia = dia => Math.max(1, Math.floor((emDias(dia) - emDias(INICIO_DOS_CICLOS)) / 7) + 1);
/** Primeiro e último dia do ciclo n (sexta a quinta). */
export function periodoDoCiclo(n) {
  const inicio = emDias(INICIO_DOS_CICLOS) + (n - 1) * 7;
  return { inicio: dataDe(inicio), fim: dataDe(inicio + 6) };
}

export const tagDoCiclo = n => "ciclo " + n;
const RE_CICLO = /^ciclo\s+(\d+)$/i;
/** 2 para "ciclo 2"; null para as outras tags. */
export const numeroDoCiclo = tag => { const m = RE_CICLO.exec(String(tag || "").trim()); return m && Number(m[1]) > 0 ? Number(m[1]) : null; };
export const tagsDe = lead => (Array.isArray(lead && lead.tags) ? lead.tags.filter(t => typeof t === "string" && t.trim()) : []);
/** Ciclo em que a conversa começou (o menor, se tiver mais de um), ou null. */
export function cicloDoLead(lead) {
  const ns = tagsDe(lead).map(numeroDoCiclo).filter(Boolean);
  return ns.length ? Math.min(...ns) : null;
}

/** Tag escrita à mão: sem espaços sobrando, até 40 letras; "Ciclo 3" vira "ciclo 3", a forma que o painel reconhece. */
export function limparTag(texto) {
  const t = String(texto || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const n = numeroDoCiclo(t);
  return n ? tagDoCiclo(n) : t;
}
const mesma = (a, b) => a.toLocaleLowerCase("pt-BR") === b.toLocaleLowerCase("pt-BR");
/** Lista com a tag nova no fim (sem repetir, sem diferença de maiúscula). */
export function comTag(tags, nova) {
  const t = limparTag(nova);
  return !t || tags.some(x => mesma(x, t)) ? tags : [...tags, t];
}
export const semTag = (tags, tag) => tags.filter(t => t !== tag);
/** Ciclo primeiro (do menor para o maior); as outras na ordem em que entraram. */
export const emOrdem = tags => [...tags].sort((a, b) => (numeroDoCiclo(a) || Infinity) - (numeroDoCiclo(b) || Infinity));

/** Rótulo curto do cartão: "C2" para a de ciclo; as outras como foram escritas. */
export const rotuloDaTag = tag => { const n = numeroDoCiclo(tag); return n ? "C" + n : tag; };
/** "Ciclo 2 · 09 a 15/10": a dica ao passar o mouse. */
export function descricaoDaTag(tag) {
  const n = numeroDoCiclo(tag);
  if (!n) return tag;
  const { inicio, fim } = periodoDoCiclo(n);
  const dm = d => d.slice(8, 10) + "/" + d.slice(5, 7);
  return `Ciclo ${n} · a conversa começou ${n === 1 ? "até " + dm(fim) : "de " + dm(inicio) + " a " + dm(fim)}`;
}
/** Classe de cor: uma por ciclo, repetindo a cada 6; as outras tags ficam neutras. */
export const classeDaTag = tag => { const n = numeroDoCiclo(tag); return n ? "tag-ciclo ciclo-cor-" + (((n - 1) % 6) + 1) : "tag-livre"; };

/** Tags com o ciclo trocado (n = null tira o ciclo); as outras tags ficam como estão. */
export const comCiclo = (tags, n) => [...(n ? [tagDoCiclo(n)] : []), ...tags.filter(t => !numeroDoCiclo(t))];
/** Ciclos para escolher: do 1 até o próximo (o de hoje + 1), e mais algum que já esteja em uso. */
export function ciclosParaEscolher(hoje, emUso = []) {
  const ate = Math.max(cicloDoDia(hoje) + 1, ...emUso.filter(Boolean));
  return Array.from({ length: ate }, (_, i) => i + 1);
}
/** "Ciclo 2 · 09 a 15/10" (o 1: "Ciclo 1 · até 08/10"). */
export function nomeDoCiclo(n) {
  const { inicio, fim } = periodoDoCiclo(n);
  const dm = d => d.slice(8, 10) + "/" + d.slice(5, 7);
  const mesmoMes = inicio.slice(5, 7) === fim.slice(5, 7);
  return `Ciclo ${n} · ` + (n === 1 ? "até " + dm(fim) : (mesmoMes ? inicio.slice(8, 10) : dm(inicio)) + " a " + dm(fim));
}

const antesDoContato = etapa => ["a_trabalhar", "demo_pronta"].includes(faseDaEtapa(etapa));
/** Saiu de antes do contato e ainda não tem ciclo: entra o do dia (`hoje` = "AAAA-MM-DD"). */
export function patchDeCiclo(lead, para, hoje) {
  if (!antesDoContato(lead.etapa) || antesDoContato(para) || cicloDoLead(lead)) return {};
  return { tags: [...tagsDe(lead), tagDoCiclo(cicloDoDia(hoje))] };
}
