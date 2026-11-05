// Filtros e indicadores da tela Atividade (painel/src/filtros-atividade.js e visitas.js).   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { agruparVisitas, sinaisDaVisita, categoriaDoClique, alvoDoClique, indicadoresDaAtividade, textoDoPasso } from "../painel/src/visitas.js";
import { ATIVIDADE, CAMPOS, faixaDoTempo, filtrosDoEstadoAntigo } from "../painel/src/filtros-atividade.js";
import { SEM, PIPELINE, aplicar as aplicarNoPipeline } from "../painel/src/filtros.js";

const quando = min => new Date(Date.UTC(2026, 10, 4, 19, min)).toISOString();
const D = (lead, min, evento, detalhe = {}, extra = {}) => ({ id: lead + min + evento, lead_id: lead, demo: lead, pagina: "demo", evento, detalhe, criado_em: quando(min),
  visitante: lead + "-v", sessao: lead + "-s", equipe: false, ip: "200.0.0." + lead.length, local: "Santo André · SP", aparelho: "celular · iPhone · Safari", ...extra });

// Três fotógrafas: a Tia viu tudo e testou o WhatsApp do site; a Pri abriu o valor (pílula antiga); a Ana só olhou.
const VISITAS = [
  D("tia", 0, "abriu"), D("tia", 1, "clicou", { alvo: "menu", para: "Horários" }), D("tia", 2, "clicou_whatsapp", { onde: "demo", parte: "Horários" }),
  D("tia", 3, "rolou_fim"), D("tia", 4, "tempo", { s: 200, saiu: true, secoes: [["Capa", 90], ["Horários", 40]] }),
  D("pri", 0, "abriu"), D("pri", 1, "clicou", { alvo: "botao", texto: "Renderiza R$ 399 · até 04/11" }), D("pri", 2, "clicou", { alvo: "oferta", texto: "garantir" }),
  D("pri", 3, "tempo", { s: 45, saiu: true, secoes: [["Capa", 30], ["Portfólio", 15]] }),
  D("ana", 0, "abriu", { sub: "natal" }), D("ana", 1, "tempo", { s: 20, saiu: true, secoes: [["Capa", 20]] }),
  D("eu", 0, "abriu", {}, { equipe: true }),
];
const grupos = () => VISITAS.reduce((m, v) => (m[v.lead_id] = [...(m[v.lead_id] || []), v], m), {});
const todas = () => Object.values(grupos()).flatMap(vs => agruparVisitas(vs));
const LEADS = { tia: { segmento: "Fotografia", etapa: "primeiro_contato" }, pri: { segmento: "Fotografia", etapa: "em_negociacao" }, ana: { segmento: "Eventos", etapa: "primeiro_contato" } };
const ctx = { leadDe: id => LEADS[id] };
const ids = gs => gs.map(g => g.lead_id).sort().join(",");

test("o clique antigo na pílula ('Renderiza R$ …') e o novo (alvo valor) contam como ver o valor", () => {
  assert.equal(alvoDoClique({ alvo: "botao", texto: "Renderiza R$ 399 · até 04/11" }), "valor");
  assert.equal(alvoDoClique({ alvo: "valor" }), "valor");
  assert.equal(alvoDoClique({ alvo: "botao", texto: "Newborn12" }), "botao");
  assert.equal(textoDoPasso({ evento: "clicou", pagina: "demo", detalhe: { alvo: "botao", texto: "Renderiza R$ 399 · até 04/11" } }), "Abriu o card de valor da Renderiza");
  assert.equal(textoDoPasso({ evento: "clicou_whatsapp", pagina: "demo", detalhe: { onde: "demo", para: "renderiza" } }), "Chamou vocês no WhatsApp (botão da Renderiza na demo)");
});

test("sinais da visita: valor, oferta, WhatsApp do site ou da Renderiza, até o fim, Natal", () => {
  const [tia] = agruparVisitas(grupos().tia), [pri] = agruparVisitas(grupos().pri), [ana] = agruparVisitas(grupos().ana);
  assert.deepEqual([...sinaisDaVisita(tia)].sort(), ["fim", "whatsapp"]);
  assert.deepEqual([...sinaisDaVisita(pri)].sort(), ["oferta", "valor"]);
  assert.deepEqual([...sinaisDaVisita(ana)], ["natal"]);
  const fora = agruparVisitas([D("x", 0, "abriu", { fora: "vencida" }), D("x", 1, "clicou_whatsapp", { onde: "fora" })])[0];
  assert.deepEqual([...sinaisDaVisita(fora)].sort(), ["reabriu", "whatsapp_renderiza"]);
});

test("categoria do clique: menu, botões por parte, valor, oferta, WhatsApp; 'Fechar' não conta", () => {
  const c = (evento, detalhe) => categoriaDoClique({ evento, pagina: "demo", detalhe });
  assert.equal(c("clicou", { alvo: "menu", para: "Horários" }), "Menu: Horários");
  assert.equal(c("clicou", { alvo: "botao", parte: "Portfólio", texto: "Newborn12" }), "Botões em Portfólio");
  assert.equal(c("clicou", { alvo: "botao", texto: "Fechar" }), null);
  assert.equal(c("clicou", { alvo: "botao", texto: "Renderiza R$ 399 · até 04/11" }), "Card de valor da Renderiza");
  assert.equal(c("clicou", { alvo: "oferta", texto: "negociar" }), "Garantir ou Negociar");
  assert.equal(c("clicou_whatsapp", { onde: "demo" }), "WhatsApp do site");
  assert.equal(c("clicou_whatsapp", { onde: "demo", para: "renderiza" }), "WhatsApp da Renderiza");
  assert.equal(c("rolou_fim", {}), null);
});

test("filtros da Atividade: fez, clicou em, parte, tempo, quem, nicho e etapa", () => {
  const gs = todas();
  const f = (campo, valores, op = "e") => ATIVIDADE.aplicar(gs, [{ campo, op, valores }], ctx);
  assert.equal(ids(f("fez", ["valor"])), "pri", "quem viu o valor");
  assert.equal(ids(f("fez", ["whatsapp", "whatsapp_renderiza"])), "tia", "quem clicou no WhatsApp");
  assert.equal(ids(f("fez", [SEM])), "eu", "só olhou: nenhum sinal");
  assert.equal(ids(f("clicou", ["Menu: Horários"])), "tia");
  assert.equal(ids(f("parte", ["Portfólio"])), "pri");
  assert.equal(ids(f("tempo", ["3mais"])), "tia");
  assert.equal(ids(f("tempo", ["ate30"])), "ana");
  assert.equal(ids(f("quem", ["cliente"])), "ana,pri,tia");
  assert.equal(ids(f("quem", ["cliente"], "nao")), "eu");
  assert.equal(ids(f("nicho", ["Fotografia"])), "pri,tia");
  assert.equal(ids(f("etapa", ["em_negociacao"])), "pri");
  assert.equal(ids(ATIVIDADE.aplicar(gs, [{ campo: "nicho", op: "e", valores: ["Fotografia"] }, { campo: "fez", op: "e", valores: ["fim"] }], ctx)), "tia", "campos diferentes valem juntos");
  assert.equal(faixaDoTempo(0), SEM);
  assert.equal(faixaDoTempo(59), "30a60");
  assert.equal(faixaDoTempo(60), "1a3");
});

test("contagem das opções e as opções tiradas das visitas", () => {
  const gs = todas();
  const clicou = ATIVIDADE.campo("clicou");
  const opcoes = clicou.opcoes(gs, ctx).map(o => o.valor);
  assert.ok(opcoes.includes("Menu: Horários") && opcoes.includes("Card de valor da Renderiza") && opcoes.at(-1) === SEM);
  const conta = ATIVIDADE.contar(gs, [{ campo: "nicho", op: "e", valores: ["Fotografia"] }], ATIVIDADE.campo("fez"), ctx);
  assert.equal(conta.get("valor"), 1);
  assert.equal(conta.get("natal") || 0, 0, "a Ana é de Eventos: o filtro de nicho vale na contagem");
  assert.equal(ATIVIDADE.descrever({ campo: "fez", op: "e", valores: ["valor", "oferta"] }, ATIVIDADE.campo("fez").opcoes(gs, ctx)).valores, "Viu o valor, Clicou em Garantir ou Negociar");
  assert.ok(CAMPOS.every(c => c.tipo === "lista" && ["O que fez", "Quem e onde", "Lead"].includes(c.grupo)));
});

test("os filtros do Pipeline seguem iguais (o modelo agora é compartilhado)", () => {
  const leads = [{ id: "a", etapa: "primeiro_contato", segmento: "Fotografia" }, { id: "b", etapa: "finalizado", resultado: "ganho", segmento: "Ótica" }];
  const c = { hoje: "2026-11-05", interacoesDe: () => [], tarefasDe: () => null, demoDe: () => null, temVideo: () => false };
  assert.deepEqual(aplicarNoPipeline(leads, [{ campo: "etapa", op: "e", valores: ["finalizado:ganho"] }], c).map(l => l.id), ["b"]);
  assert.equal(PIPELINE.campo("etapa").nome, "Etapa");
});

test("as abas antigas (Quem e Onde) viram chips", () => {
  assert.deepEqual(filtrosDoEstadoAntigo({ quem: "clientes", onde: "demos" }), [{ campo: "quem", op: "e", valores: ["cliente"] }, { campo: "onde", op: "e", valores: ["demo"] }]);
  assert.deepEqual(filtrosDoEstadoAntigo({ quem: "voces" })[0].valores, ["equipe", "equipe_ip"]);
  assert.deepEqual(filtrosDoEstadoAntigo({ quem: "todos", onde: "tudo" }), []);
});

test("indicadores do recorte: visitas, leads, tempo, até o fim, valor, WhatsApp, partes, cliques e quem mais se interessou", () => {
  const r = indicadoresDaAtividade(todas().filter(g => g.quem === "cliente"));
  assert.equal(r.visitas, 3);
  assert.equal(r.leads, 3);
  assert.equal(r.segundosMediana, 45);
  assert.equal(r.fim, 1);
  assert.equal(r.fimPct, 33);
  assert.equal(r.valor, 1);
  assert.equal(r.whatsapp, 1);
  assert.equal(r.oferta, 1);
  assert.deepEqual(r.partes.find(p => p.nome === "Capa"), { nome: "Capa", visitas: 3, segundos: 140, media: 47, pct: 100 });
  assert.equal(r.cliques.find(c => c.nome === "Menu: Horários").leads, 1);
  assert.equal(r.porLead[0].lead_id, "pri", "valor + oferta pesam mais que o tempo");
  assert.equal(r.porLead.at(-1).lead_id, "ana");
  assert.deepEqual(indicadoresDaAtividade([]).porLead, []);
});

test("contador da demo: a pílula e o 'Ver a condição' gravam 'valor'; o WhatsApp da Renderiza vai marcado", () => {
  const contador = readFileSync(new URL("../exemplos/visitas.js", import.meta.url), "utf8");
  assert.match(contador, /\.rz-pilula, \.rz-abrir"\)\) return \{ alvo: "valor" \}/);
  assert.ok(contador.indexOf(".rz-pilula") < contador.indexOf('alvo: "botao"'), "antes do botão genérico");
  assert.match(contador, /para: "renderiza"/);
});
