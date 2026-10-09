// Funil de 09/10/2026: fases, etapas de Em andamento, resultado Encerrado e os ids antigos.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ETAPAS, FASES, RESULTADOS, etapaAtual, comEtapaAtual, rotuloEtapa, nomeDaEtapa, nomeCompletoDaEtapa,
  textoDoHistorico, opcoesDeEtapa, faseDaEtapa, ehEmAndamento,
} from "../painel/src/modelo.js";
import { migrarLead, completarLead } from "../painel/src/migracao.js";
import { opcoesPlanas } from "../painel/src/dom.js";

test("quatro fases; Em andamento junta Em conversa, Em negociação e Sem resposta", () => {
  assert.deepEqual(FASES.map(f => f.nome), ["Leads a trabalhar", "Prontas para trabalhar", "Em andamento", "Finalizado"]);
  assert.deepEqual(FASES.find(f => f.id === "em_andamento").etapas, ["primeiro_contato", "em_negociacao", "sem_resposta"]);
  // cada etapa está em uma fase só, e na ordem do funil
  assert.deepEqual(FASES.flatMap(f => f.etapas), ETAPAS.map(e => e.id));
  assert.equal(faseDaEtapa("sem_resposta"), "em_andamento");
  assert.equal(ehEmAndamento("demo_pronta"), false);
  assert.deepEqual(RESULTADOS.map(r => r.id), ["ganho", "perda", "encerrado"]);
});

test("ids antigos vão para a etapa nova (o mesmo mapeamento do schema.sql)", () => {
  assert.equal(etapaAtual("demo_criada"), "demo_pronta");
  assert.equal(etapaAtual("gravacao_realizada"), "demo_pronta");
  assert.equal(etapaAtual("demo_enviada"), "primeiro_contato");
  assert.equal(etapaAtual("follow_up", "nao_avaliado"), "sem_resposta");
  assert.equal(etapaAtual("follow_up", "interessado"), "em_negociacao");
  assert.equal(etapaAtual("follow_up", "perto_de_fechar"), "em_negociacao");
  for (const e of ETAPAS) assert.equal(etapaAtual(e.id, "interessado"), e.id, "etapa nova não muda");
  const novo = { id: "x", etapa: "sem_resposta" };
  assert.equal(comEtapaAtual(novo), novo, "sem cópia quando nada muda");
  assert.equal(comEtapaAtual({ id: "y", etapa: "follow_up", interesse: "interessado" }).etapa, "em_negociacao");
});

test("rótulos: Em andamento leva o nome da fase; Finalizado leva o resultado", () => {
  assert.equal(nomeCompletoDaEtapa("em_negociacao"), "Em andamento · Em negociação");
  assert.equal(nomeCompletoDaEtapa("demo_pronta"), "Prontas para trabalhar");
  assert.equal(rotuloEtapa({ etapa: "sem_resposta" }), "Em andamento · Sem resposta");
  assert.equal(rotuloEtapa({ etapa: "finalizado", resultado: "encerrado" }), "Finalizado · Encerrado");
  assert.equal(nomeDaEtapa("follow_up"), "Em conversa", "id antigo mantém o nome que tinha");
  assert.equal(rotuloEtapa({ etapa: "primeiro_contato" }), "Em andamento · Em conversa", "primeiro_contato aparece como Em conversa");
});

test("histórico: linhas antigas, a reorganização e mudanças dentro de Em andamento", () => {
  assert.equal(textoDoHistorico({ de: "demo_enviada", para: "follow_up" }), "Contato iniciado → Em conversa");
  assert.equal(textoDoHistorico({ de: "follow_up", para: "sem_resposta", origem: "reorganizacao" }), "Em conversa → Em andamento · Sem resposta (etapas reorganizadas)");
  assert.equal(textoDoHistorico({ de: "primeiro_contato", para: "em_negociacao" }), "Em andamento: Em conversa → Em negociação");
  assert.equal(textoDoHistorico({ de: "sem_resposta", para: "finalizado", resultado: "encerrado" }), "Em andamento · Sem resposta → Finalizado · Encerrado");
  assert.equal(textoDoHistorico({ de: "a_trabalhar", para: "demo_pronta", origem: "ia" }), "Leads a trabalhar → Prontas para trabalhar (pela IA)");
});

test("opções de etapa: Em andamento num grupo; Finalizado com o texto pedido ou de fora", () => {
  const ops = opcoesDeEtapa({ finalizado: "Finalizado · Ganho" });
  assert.equal(ops.length, 4);
  assert.deepEqual(ops[2], { grupo: "Em andamento", opcoes: [["primeiro_contato", "Em conversa"], ["em_negociacao", "Em negociação"], ["sem_resposta", "Sem resposta"]] });
  assert.deepEqual(ops[3], ["finalizado", "Finalizado · Ganho"]);
  assert.equal(opcoesDeEtapa({ finalizado: false }).length, 3);
  assert.deepEqual(opcoesPlanas(ops).map(o => o[0]), ETAPAS.map(e => e.id));
  assert.equal(opcoesPlanas(ops)[3][2], "Em andamento", "a opção do grupo sabe o grupo (para colar \"Em andamento · Sem resposta\")");
});

test("painel antigo (banco do Claude) entra no funil novo", () => {
  assert.equal(migrarLead({ status: "pronto" }, "a").etapa, "demo_pronta");
  assert.equal(migrarLead({ status: "enviado" }, "b").etapa, "primeiro_contato");
  const ambiguo = migrarLead({ status: "respondeu" }, "c");
  assert.equal(ambiguo.etapa, "em_negociacao");
  assert.equal(ambiguo.revisar, true);
  assert.equal(migrarLead({ status: "producao", demoStatus: "pronta" }, "d").etapa, "demo_pronta");
  assert.equal(completarLead({ id: "e", etapa: "gravacao_realizada" }).etapa, "demo_pronta");
});

test("o banco aceita exatamente as etapas e os resultados do painel", () => {
  const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  const lista = re => [...sql.match(re)[1].matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
  const ids = ETAPAS.map(e => e.id);
  assert.deepEqual(lista(/add constraint leads_etapa_check\s+check \(etapa in \(([^)]*)\)\)/), ids);
  assert.deepEqual(lista(/add constraint leads_resultado_check\s+check \(resultado in \(([^)]*)\)\)/), RESULTADOS.map(r => r.id));
  assert.deepEqual(lista(/v_etapas text\[\] := array\[([^\]]*)\]/), ids, "a função da IA usa a mesma lista");
  assert.deepEqual(lista(/etapa\s+text not null default 'a_trabalhar'\s+check \(etapa in \(([^)]*)\)\)/), ids, "e a tabela criada do zero também");
});
