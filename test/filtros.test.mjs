// Filtros do Pipeline: listas com "é" / "não é", períodos de data, contagem das opções e textos dos chips.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAMPOS, GRUPOS, SEM, campo, cidadeDe, noPeriodo, valido, limpar, passa, aplicar, contar,
  alternarValor, definirPeriodo, alternarOperador, tirar, descrever, FILTRO_DO_RITMO,
} from "../painel/src/filtros.js";

const hoje = "2026-10-14"; // quarta, ciclo 2 (09 a 15/10)
const PAD = n => ["enviar_demo", "cobranca_1", "cobranca_2", "cobranca_3"].map((id, i) => ({ id, texto: "Item " + i, feito: i < n }));
const leads = [
  { id: "a", etapa: "primeiro_contato", segmento: "Ótica", cidade: "Lapa · São Paulo", tags: ["ciclo 2"], checklist: PAD(1), link_demo: "/demo/a", link_flyer: "/flyer/a.png", criado_em: "2026-10-12T15:00:00Z", followup_em: "2026-10-13" },
  { id: "b", etapa: "sem_resposta", segmento: "Ótica", cidade: "Centro · Mauá", tags: ["ciclo 1", "vip"], checklist: PAD(4), interesse: "interessado", criado_em: "2026-10-01T15:00:00Z" },
  { id: "c", etapa: "demo_pronta", segmento: "Odontologia", cidade: "Jabaquara · São Paulo", tags: [], checklist: PAD(0), link_demo: "/demo/c", criado_em: "2026-10-13T15:00:00Z" },
  { id: "d", etapa: "finalizado", resultado: "perda", segmento: "", cidade: "", tags: ["ciclo 1"], checklist: [], nao_contatar: true, criado_em: "2026-09-29T15:00:00Z" },
];
const interacoes = {
  a: [{ id: "i1", lead_id: "a", tipo: "primeiro_contato", precisao: "exata", ocorreu_em: "2026-10-13" }],
  b: [{ id: "i2", lead_id: "b", tipo: "primeiro_contato", precisao: "exata", ocorreu_em: "2026-10-07" }, { id: "i3", lead_id: "b", tipo: "resposta", precisao: "exata", ocorreu_em: "2026-10-10" }],
  d: [{ id: "i4", lead_id: "d", tipo: "primeiro_contato", precisao: "aproximada", ocorreu_em: "2026-08-01" }],
};
const ctx = {
  hoje, interacoesDe: id => interacoes[id] || [], tarefasDe: id => (id === "a" ? { total: 1, atrasadas: 1 } : id === "c" ? { total: 2, atrasadas: 0 } : undefined),
  demoDe: l => (l.id === "a" ? "no_ar" : l.id === "c" ? "fora" : null), temVideo: l => l.id === "c",
};
const ids = filtros => aplicar(leads, filtros, ctx).map(l => l.id).join("");

test("todo campo tem grupo, ícone e tipo; ids únicos", () => {
  assert.equal(new Set(CAMPOS.map(c => c.id)).size, CAMPOS.length);
  for (const c of CAMPOS) {
    assert.ok(GRUPOS.includes(c.grupo), c.id);
    assert.ok(c.icone, c.id);
    assert.ok(c.tipo === "lista" ? typeof c.opcoes === "function" : Array.isArray(c.periodos), c.id);
  }
  assert.equal(cidadeDe({ cidade: "Centro Empresarial de SP (Jardim São Luís) · São Paulo" }), "São Paulo");
  assert.equal(cidadeDe({ cidade: "Osasco" }), "Osasco");
});

test("listas: qualquer um dos valores; 'não é' inverte; vazio conta como opção", () => {
  assert.equal(ids([{ campo: "etapa", op: "e", valores: ["primeiro_contato", "sem_resposta"] }]), "ab");
  assert.equal(ids([{ campo: "etapa", op: "nao", valores: ["finalizado:perda"] }]), "abc");
  assert.equal(ids([{ campo: "ciclo", op: "e", valores: ["ciclo 1"] }]), "bd");
  assert.equal(ids([{ campo: "ciclo", op: "e", valores: [SEM] }]), "c");
  assert.equal(ids([{ campo: "nicho", op: "e", valores: ["Odontologia", SEM] }]), "cd");
  assert.equal(ids([{ campo: "cidade", op: "e", valores: ["São Paulo"] }]), "ac");
  assert.equal(ids([{ campo: "tags", op: "e", valores: ["vip"] }]), "b");
  assert.equal(ids([{ campo: "interesse", op: "e", valores: ["nao_avaliado"] }]), "acd");
  assert.equal(ids([{ campo: "checklist", op: "e", valores: ["completa"] }]), "b");
  assert.equal(ids([{ campo: "proximo", op: "e", valores: ["Item 1"] }]), "a");
  assert.equal(ids([{ campo: "materiais", op: "e", valores: ["flyer"] }]), "a");
  assert.equal(ids([{ campo: "materiais", op: "nao", valores: ["demo"] }]), "bd");
  assert.equal(ids([{ campo: "demo", op: "e", valores: ["fora"] }]), "c");
  assert.equal(ids([{ campo: "tarefas", op: "e", valores: ["atrasada"] }]), "a");
  assert.equal(ids([{ campo: "tarefas", op: "e", valores: [SEM] }]), "bd");
  assert.equal(ids([{ campo: "marcacoes", op: "e", valores: ["nao_contatar"] }]), "d");
});

test("campos diferentes valem juntos", () => {
  assert.equal(ids([{ campo: "nicho", op: "e", valores: ["Ótica"] }, { campo: "ciclo", op: "e", valores: ["ciclo 2"] }]), "a");
  assert.equal(ids([{ campo: "nicho", op: "e", valores: ["Ótica"] }, { campo: "etapa", op: "e", valores: ["demo_pronta"] }]), "");
});

test("datas: períodos para trás, para frente e entre datas", () => {
  assert.equal(noPeriodo("2026-10-14", { periodo: "hoje" }, hoje), true);
  assert.equal(noPeriodo("2026-10-13", { periodo: "ontem" }, hoje), true);
  assert.equal(noPeriodo("2026-10-08", { periodo: "7d" }, hoje), true);
  assert.equal(noPeriodo("2026-10-07", { periodo: "7d" }, hoje), false);
  assert.equal(noPeriodo("2026-10-09", { periodo: "ciclo" }, hoje), true);
  assert.equal(noPeriodo("2026-10-08", { periodo: "ciclo" }, hoje), false);
  assert.equal(noPeriodo("2026-10-02", { periodo: "ciclo_passado" }, hoje), true);
  assert.equal(noPeriodo("2026-10-13", { periodo: "atrasado" }, hoje), true);
  assert.equal(noPeriodo("2026-10-21", { periodo: "prox7" }, hoje), true);
  assert.equal(noPeriodo("2026-10-22", { periodo: "prox7" }, hoje), false);
  assert.equal(noPeriodo(null, { periodo: "sem" }, hoje), true);
  assert.equal(noPeriodo(null, { periodo: "hoje" }, hoje), false);
  assert.equal(noPeriodo("2026-10-10", { periodo: "intervalo", de: "2026-10-09", ate: "2026-10-12" }, hoje), true);
  assert.equal(noPeriodo("2026-10-13", { periodo: "intervalo", de: "2026-10-09", ate: "2026-10-12" }, hoje), false);
  assert.equal(noPeriodo("2026-10-13", { periodo: "intervalo", de: "2026-10-09" }, hoje), true);
  // início da conversa = primeiro contato; retorno previsto = follow-up ainda por cumprir; entrou = criado_em
  assert.equal(ids([{ campo: "inicio", periodo: "ciclo" }]), "a");
  assert.equal(ids([{ campo: "inicio", periodo: "sem" }]), "c");
  assert.equal(ids([{ campo: "ultima", periodo: "7d" }]), "ab");
  assert.equal(ids([{ campo: "retorno", periodo: "atrasado" }]), "a");
  assert.equal(ids([{ campo: "criado", periodo: "ciclo" }]), "ac");
});

test("contagem das opções considera os outros filtros, não o do próprio campo", () => {
  const filtros = [{ campo: "nicho", op: "e", valores: ["Ótica"] }, { campo: "ciclo", op: "e", valores: ["ciclo 2"] }];
  const ciclos = contar(leads, filtros, campo("ciclo"), ctx);
  assert.equal(ciclos.get("ciclo 1"), 1);
  assert.equal(ciclos.get("ciclo 2"), 1);
  const nichos = contar(leads, filtros, campo("nicho"), ctx);
  assert.equal(nichos.get("Ótica"), 1);
  assert.equal(nichos.get("Odontologia") || 0, 0);
  const inicio = contar(leads, [], campo("inicio"), ctx);
  assert.equal(inicio.get("sem"), 1);
  assert.equal(inicio.get("ciclo"), 1);
  // opções vindas dos dados, das mais comuns para as menos
  assert.deepEqual(campo("cidade").opcoes(leads, ctx).map(o => o.valor), ["São Paulo", "Mauá", SEM]);
  assert.deepEqual(campo("ciclo").opcoes(leads, ctx).map(o => o.curto || o.nome), ["C1", "C2", "Sem ciclo"]);
});

test("mudar filtros: alternar valor, operador, período e tirar", () => {
  let f = alternarValor([], "ciclo", "ciclo 2");
  assert.deepEqual(f, [{ campo: "ciclo", op: "e", valores: ["ciclo 2"] }]);
  f = alternarValor(f, "ciclo", "ciclo 1");
  assert.deepEqual(f[0].valores, ["ciclo 2", "ciclo 1"]);
  f = alternarOperador(f, "ciclo");
  assert.equal(f[0].op, "nao");
  f = alternarValor(alternarValor(f, "ciclo", "ciclo 2"), "ciclo", "ciclo 1");
  assert.deepEqual(f, [], "sem valores, o filtro some");
  f = definirPeriodo([], "inicio", "7d");
  f = definirPeriodo(f, "inicio", "intervalo", "2026-10-01", null);
  assert.deepEqual(f, [{ campo: "inicio", periodo: "intervalo", de: "2026-10-01", ate: null }]);
  assert.deepEqual(tirar(f, "inicio"), []);
});

test("filtros inválidos são descartados; chips com texto claro", () => {
  assert.deepEqual(limpar([{ campo: "x", valores: ["a"] }, { campo: "etapa", valores: [] }, { campo: "inicio", periodo: "intervalo" }, { campo: "inicio", periodo: "hoje" }, null]),
    [{ campo: "inicio", periodo: "hoje" }]);
  assert.equal(valido({ campo: "retorno", periodo: "ciclo" }), false, "retorno previsto olha para frente");
  const opCiclo = campo("ciclo").opcoes(leads, ctx);
  assert.deepEqual(descrever({ campo: "ciclo", op: "e", valores: ["ciclo 2"] }, opCiclo), { campo: "Ciclo", operador: "é", valores: "C2" });
  const opEtapa = campo("etapa").opcoes(leads, ctx);
  assert.deepEqual(descrever({ campo: "etapa", op: "nao", valores: ["a_trabalhar", "demo_pronta", "finalizado:perda"] }, opEtapa),
    { campo: "Etapa", operador: "não é nenhum de", valores: "Leads a trabalhar, Prontas para trabalhar +1" });
  assert.deepEqual(descrever({ campo: "inicio", periodo: "7d" }, []), { campo: "Início da conversa", operador: "", valores: "nos últimos 7 dias" });
  assert.deepEqual(descrever({ campo: "inicio", periodo: "intervalo", de: "2026-10-09", ate: "2026-10-13" }, []).valores, "de 09/10 a 13/10");
  for (const f of Object.values(FILTRO_DO_RITMO)) assert.ok(valido(f));
  assert.equal(passa(leads[0], FILTRO_DO_RITMO.retornos_atrasados, ctx), true);
});
