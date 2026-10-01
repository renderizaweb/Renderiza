// Tarefas e clientes.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  grupoDaTarefa, agruparTarefas, passaNoResponsavel, feitasRecentes, proximaTarefa,
  situacaoDoCliente, sugestoesDeTarefa, SEM_RESPONSAVEL,
} from "../painel/src/tarefas.js";

const HOJE = "2026-10-01";
let seq = 0;
const tarefa = (extra = {}) => ({ id: "t" + ++seq, titulo: "Tarefa " + seq, dia: null, hora: null, lead_id: null, responsavel: null, feita_em: null, criado_em: "2026-09-30T10:00:0" + (seq % 10), ...extra });

test("cada tarefa cai no grupo do seu dia", () => {
  assert.equal(grupoDaTarefa(tarefa({ dia: "2026-09-30" }), HOJE), "atrasadas");
  assert.equal(grupoDaTarefa(tarefa({ dia: HOJE }), HOJE), "hoje");
  assert.equal(grupoDaTarefa(tarefa({ dia: "2026-10-02" }), HOJE), "amanha");
  assert.equal(grupoDaTarefa(tarefa({ dia: "2026-10-08" }), HOJE), "proximos");
  assert.equal(grupoDaTarefa(tarefa({ dia: "2026-10-09" }), HOJE), "adiante");
  assert.equal(grupoDaTarefa(tarefa(), HOJE), "sem_data");
});

test("agrupa só as em aberto, na ordem de dia e hora, sem grupos vazios", () => {
  const sem = tarefa({ dia: HOJE });
  const as9 = tarefa({ dia: HOJE, hora: "09:00:00" });
  const as14 = tarefa({ dia: HOJE, hora: "14:00:00" });
  const feita = tarefa({ dia: HOJE, feita_em: "2026-10-01T12:00:00Z" });
  const atrasada = tarefa({ dia: "2026-09-20" });
  const grupos = agruparTarefas([sem, as14, feita, atrasada, as9], HOJE);
  assert.deepEqual(grupos.map(g => g.id), ["atrasadas", "hoje"]);
  assert.deepEqual(grupos[1].tarefas.map(t => t.id), [as9.id, as14.id, sem.id]);
});

test("filtro de responsável: todos, uma pessoa ou sem responsável", () => {
  const k = tarefa({ responsavel: "Kaue" }), m = tarefa({ responsavel: "Milena" }), n = tarefa();
  const filtrar = f => [k, m, n].filter(t => passaNoResponsavel(t, f)).map(t => t.id);
  assert.deepEqual(filtrar(""), [k.id, m.id, n.id]);
  assert.deepEqual(filtrar("Kaue"), [k.id]);
  assert.deepEqual(filtrar(SEM_RESPONSAVEL), [n.id]);
});

test("feitas recentes: últimos 7 dias, a mais nova primeiro", () => {
  const velha = tarefa({ feita_em: "2026-09-01T12:00:00" });
  const ontem = tarefa({ feita_em: "2026-09-30T12:00:00" });
  const agora = tarefa({ feita_em: "2026-10-01T09:00:00" });
  assert.deepEqual(feitasRecentes([velha, ontem, agora, tarefa()], HOJE).map(t => t.id), [agora.id, ontem.id]);
});

test("próxima tarefa do cliente ignora as feitas e deixa as sem data por último", () => {
  const semData = tarefa({ lead_id: "A" });
  const depois = tarefa({ lead_id: "A", dia: "2026-10-10" });
  const antes = tarefa({ lead_id: "A", dia: "2026-10-03" });
  const feita = tarefa({ lead_id: "A", dia: "2026-10-02", feita_em: "2026-10-01T10:00:00" });
  assert.equal(proximaTarefa([semData, depois, antes, feita, tarefa({ lead_id: "B", dia: HOJE })], "A").id, antes.id);
  assert.equal(proximaTarefa([semData], "A").id, semData.id);
  assert.equal(proximaTarefa([feita], "A"), null);
});

test("situação do cliente", () => {
  assert.equal(situacaoDoCliente({ etapa: "a_trabalhar" }), "em_venda");
  assert.equal(situacaoDoCliente({ etapa: "follow_up" }), "em_venda");
  assert.equal(situacaoDoCliente({ etapa: "finalizado", resultado: "ganho" }), "ganho");
  assert.equal(situacaoDoCliente({ etapa: "finalizado", resultado: "perda" }), "perda");
  assert.equal(situacaoDoCliente({ etapa: "finalizado", resultado: "ganho", fora_do_funil: true }), "fora");
  assert.equal(situacaoDoCliente({ etapa: "a_trabalhar", fora_do_funil: true }), "fora");
});

test("sugestões: próxima ação anotada, sem tarefa aberta, nem finalizado nem 'não contatar'", () => {
  const leads = [
    { id: "A", empresa: "Ótica A", etapa: "a_trabalhar", proxima_acao: "Mandar vídeo", followup_em: "2026-10-05" },
    { id: "B", empresa: "Ótica B", etapa: "a_trabalhar", proxima_acao: "Ligar", followup_em: "2026-09-28" },
    { id: "C", empresa: "Ótica C", etapa: "a_trabalhar", proxima_acao: "  " },
    { id: "D", empresa: "Ótica D", etapa: "a_trabalhar", proxima_acao: "Ligar" },
    { id: "E", empresa: "Ótica E", etapa: "finalizado", resultado: "perda", proxima_acao: "Ligar" },
    { id: "F", empresa: "Ótica F", etapa: "a_trabalhar", proxima_acao: "Ligar", nao_contatar: true },
    { id: "G", empresa: "Ótica G", etapa: "a_trabalhar", proxima_acao: "Ligar" },
  ];
  const tarefas = [tarefa({ lead_id: "D" }), tarefa({ lead_id: "G", feita_em: "2026-09-30T10:00:00" })];
  assert.deepEqual(sugestoesDeTarefa(leads, tarefas).map(l => l.id), ["B", "A", "G"]);
});
