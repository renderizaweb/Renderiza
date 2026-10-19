// Contas da tela Indicadores.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { analisar, categoriaDoMotivo, cicloDoContato, indicadores, resumo } from "../painel/src/indicadores.js";
import { indexar } from "../painel/src/ritmo.js";

let seq = 0;
const lead = (id, extra = {}) => ({ id, empresa: "Loja " + id, etapa: "primeiro_contato", resultado: null, interesse: "nao_avaliado", segmento: "Ótica", tags: [], historico: [], checklist: [], ...extra });
const pc = (lead_id, ocorreu_em, extra = {}) => ({ id: "i" + ++seq, lead_id, tipo: "primeiro_contato", ocorreu_em, precisao: "exata", criado_em: "2026-10-01T00:00:00", ...extra });

test("motivo da perda: silêncio fica de fora e a ordem das categorias vale", () => {
  assert.equal(categoriaDoMotivo("Sem retorno"), null);
  assert.equal(categoriaDoMotivo("Sem retorno nenhum - contatar em janeiro/27"), null);
  assert.equal(categoriaDoMotivo("Já possuem site próprio").id, "ja_tem_site");
  assert.equal(categoriaDoMotivo("Não tem interesse pois já tem um profissional fazendo esse trabalho").id, "ja_tem_site");
  assert.equal(categoriaDoMotivo("Está sem recursos para incluir no site (videos, fotos e etc)").id, "sem_verba");
  assert.equal(categoriaDoMotivo("Sem interesse nesse momento").id, "agora_nao");
  assert.equal(categoriaDoMotivo("Sem interesse").id, "sem_interesse");
  assert.equal(categoriaDoMotivo("Mudou de ramo").id, "outro");
});

test("ciclo do contato: lista de agosto é 0, a etiqueta manda, sem contato é null", () => {
  assert.equal(cicloDoContato(lead("A", { etapa: "demo_pronta" }), []), null);
  assert.equal(cicloDoContato(lead("A", { tags: ["ciclo 1"] }), [pc("A", "2026-08-01", { precisao: "aproximada" })]), 0);
  assert.equal(cicloDoContato(lead("A", { tags: ["ciclo 2"] }), [pc("A", "2026-10-16")]), 2);
  assert.equal(cicloDoContato(lead("A"), [pc("A", "2026-10-16")]), 3);
});

test("situação de cada contato", () => {
  const s = (l, lista = [pc(l.id, "2026-10-09")]) => analisar(l, lista).situacao;
  assert.equal(s(lead("A")), "aguardando");
  assert.equal(s(lead("A", { etapa: "em_negociacao" })), "interessado");
  assert.equal(s(lead("A", { interesse: "perto_de_fechar" })), "interessado");
  assert.equal(s(lead("A", { etapa: "finalizado", resultado: "ganho" })), "venda");
  assert.equal(s(lead("A", { etapa: "finalizado", resultado: "perda", motivo_perda: "Já tem site" })), "nao");
  assert.equal(s(lead("A", { etapa: "finalizado", resultado: "perda", motivo_perda: "Sem retorno" })), "silencio");
  assert.equal(s(lead("A", { etapa: "finalizado", resultado: "encerrado" })), "silencio");
  assert.equal(s(lead("A", { etapa: "sem_resposta" })), "silencio");
  assert.equal(s(lead("A", { etapa: "finalizado", resultado: "encerrado", historico: [{ em: "2026-10-10", para: "em_negociacao" }] })), "esfriou");
  assert.equal(s(lead("A", {}), [pc("A", "2026-10-09"), { id: "r", lead_id: "A", tipo: "resposta", ocorreu_em: "2026-10-10", precisao: "exata" }]), "conversando");
  assert.equal(s(lead("A", { interesse: "interessado" }), [pc("A", "2026-10-09"), { id: "r", lead_id: "A", tipo: "resposta", ocorreu_em: "2026-10-10", precisao: "exata" }]), "interessado");
});

test("dias até a resposta e cobranças", () => {
  const l = lead("A", { etapa: "finalizado", resultado: "perda", motivo_perda: "Sem interesse", historico: [{ em: "2026-10-12T15:00:00Z", para: "finalizado" }],
    checklist: [{ id: "enviar_demo", texto: "Enviar", feito: true }, { id: "cobranca_1", texto: "1ª", feito: true }, { id: "cobranca_2", texto: "2ª", feito: false }] });
  const a = analisar(l, [pc("A", "2026-10-09")]);
  assert.equal(a.diasAteResposta, 3);
  assert.deepEqual(a.cobrancas, { feitas: 1, total: 2 });
});

test("resumo, nichos e leitura", () => {
  const leads = [
    lead("A", { tags: ["ciclo 1"], etapa: "em_negociacao", atualizado_em: "2026-10-10T00:00:00Z" }),
    lead("B", { tags: ["ciclo 1"], etapa: "finalizado", resultado: "perda", motivo_perda: "Já tem site" }),
    lead("C", { tags: ["ciclo 1"], etapa: "finalizado", resultado: "encerrado", checklist: [{ id: "cobranca_1", texto: "1ª", feito: false }] }),
    lead("D", { tags: ["ciclo 2"], segmento: "Eventos" }),
    lead("E", { etapa: "demo_pronta", link_demo: "/demo/e", segmento: "Eventos" }),
  ];
  const ints = ["A", "B", "C"].map(id => pc(id, "2026-10-03")).concat(pc("D", "2026-10-10"));
  const r = indicadores(leads, indexar(leads, ints), { hoje: "2026-10-19" });
  assert.deepEqual(r.nichos, ["Eventos", "Ótica"]);
  assert.equal(r.total.contatados, 4);
  assert.equal(r.total.respondeu, 2);
  assert.equal(r.total.taxaResposta, 50);
  assert.equal(r.total.interessados, 1);
  assert.equal(r.total.aguardando, 1);
  assert.deepEqual(r.porCiclo.map(c => [c.ciclo, c.contatados]), [[1, 3], [2, 1]]);
  assert.equal(r.producao.prontasSemEnvio, 1);
  assert.equal(r.quentes[0].diasParado, 9);
  assert.ok(r.alertas.some(a => /Nenhuma resposta registrada/.test(a.texto)));
  assert.ok(r.alertas.some(a => /1 de 1 conversas sem resposta/.test(a.texto)));
  const ev = indicadores(leads, indexar(leads, ints), { nicho: "Eventos", hoje: "2026-10-19" });
  assert.equal(ev.total.contatados, 1);
  assert.equal(resumo([]).taxaResposta, null);
});
