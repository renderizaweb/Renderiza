// Tags de ciclo (C1, C2…) e checklist do card.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  INICIO_DOS_CICLOS, cicloDoDia, periodoDoCiclo, numeroDoCiclo, cicloDoLead, limparTag, comTag, semTag, emOrdem, rotuloDaTag,
  descricaoDaTag, classeDaTag, patchDeCiclo,
} from "../painel/src/tags.js";
import {
  ITENS_PADRAO, listaPadrao, itensDe, progresso, marcar, adicionar, renomear, remover, mover, patchDaChecklist, patchAoMudarEtapa,
} from "../painel/src/checklist.js";

test("ciclos semanais de sexta a quinta, a partir de 02/10/2026; antes disso é ciclo 1", () => {
  assert.equal(cicloDoDia("2026-08-01"), 1);
  assert.equal(cicloDoDia("2026-10-02"), 1);
  assert.equal(cicloDoDia("2026-10-08"), 1);
  assert.equal(cicloDoDia("2026-10-09"), 2); // sexta
  assert.equal(cicloDoDia("2026-10-13"), 2);
  assert.equal(cicloDoDia("2026-10-15"), 2); // quinta
  assert.equal(cicloDoDia("2026-10-16"), 3);
  assert.equal(cicloDoDia("2027-01-01"), 14);
  assert.deepEqual(periodoDoCiclo(2), { inicio: "2026-10-09", fim: "2026-10-15" });
  assert.deepEqual(periodoDoCiclo(3), { inicio: "2026-10-16", fim: "2026-10-22" });
});

test("tag de ciclo: reconhece, limpa e mostra como C1, C2", () => {
  assert.equal(numeroDoCiclo("ciclo 2"), 2);
  assert.equal(numeroDoCiclo(" Ciclo  12 "), 12);
  assert.equal(numeroDoCiclo("ciclo"), null);
  assert.equal(numeroDoCiclo("ciclo 0"), null);
  assert.equal(numeroDoCiclo("vip"), null);
  assert.equal(limparTag("  Ciclo   3 "), "ciclo 3");
  assert.equal(limparTag("  indicação   da Milena "), "indicação da Milena");
  assert.equal(rotuloDaTag("ciclo 2"), "C2");
  assert.equal(rotuloDaTag("vip"), "vip");
  assert.equal(classeDaTag("ciclo 1"), "tag-ciclo ciclo-cor-1");
  assert.equal(classeDaTag("ciclo 7"), "tag-ciclo ciclo-cor-1");
  assert.equal(classeDaTag("vip"), "tag-livre");
  assert.equal(descricaoDaTag("ciclo 1"), "Ciclo 1 · a conversa começou até 08/10");
  assert.equal(descricaoDaTag("ciclo 2"), "Ciclo 2 · a conversa começou de 09/10 a 15/10");
  assert.equal(cicloDoLead({ tags: ["vip", "ciclo 3", "ciclo 2"] }), 2);
  assert.equal(cicloDoLead({ tags: null }), null);
});

test("comTag não repete (nem com outra maiúscula); semTag tira; ciclo vem primeiro", () => {
  assert.deepEqual(comTag(["vip"], "VIP"), ["vip"]);
  assert.deepEqual(comTag(["vip"], "   "), ["vip"]);
  assert.deepEqual(comTag(["vip"], "Ciclo 2"), ["vip", "ciclo 2"]);
  assert.deepEqual(semTag(["vip", "ciclo 2"], "vip"), ["ciclo 2"]);
  assert.deepEqual(emOrdem(["vip", "ciclo 2", "indicação", "ciclo 1"]), ["ciclo 1", "ciclo 2", "vip", "indicação"]);
});

test("o ciclo entra ao sair de Prontas (ou de A trabalhar), uma vez só", () => {
  const pronta = { etapa: "demo_pronta", tags: [] };
  assert.deepEqual(patchDeCiclo(pronta, "primeiro_contato", "2026-10-13"), { tags: ["ciclo 2"] });
  assert.deepEqual(patchDeCiclo({ etapa: "a_trabalhar", tags: ["vip"] }, "sem_resposta", "2026-10-16"), { tags: ["vip", "ciclo 3"] });
  assert.deepEqual(patchDeCiclo(pronta, "a_trabalhar", "2026-10-13"), {}, "continua antes do contato");
  assert.deepEqual(patchDeCiclo({ etapa: "primeiro_contato", tags: [] }, "em_negociacao", "2026-10-13"), {}, "já estava em andamento");
  assert.deepEqual(patchDeCiclo({ etapa: "demo_pronta", tags: ["ciclo 1"] }, "primeiro_contato", "2026-10-13"), {}, "já tem ciclo");
});

test("checklist: padrão, progresso e próxima ação = primeiro pendente", () => {
  const lista = listaPadrao();
  assert.deepEqual(lista.map(i => i.texto), ITENS_PADRAO.map(i => i.texto));
  assert.ok(lista.every(i => !i.feito && i.feito_em === null));
  const umFeito = marcar(lista, "enviar_demo", true, "2026-10-13T12:00:00.000Z");
  assert.equal(umFeito[0].feito_em, "2026-10-13T12:00:00.000Z");
  assert.deepEqual(progresso(umFeito), { feitos: 1, total: 4, proximo: umFeito[1], completa: false });
  assert.equal(patchDaChecklist(umFeito).proxima_acao, "1ª cobrança: mandar o flyer de cortesia");
  const tudo = umFeito.reduce((l, i) => marcar(l, i.id, true), umFeito);
  assert.equal(progresso(tudo).completa, true);
  assert.equal(patchDaChecklist(tudo).proxima_acao, "");
  assert.equal(marcar(tudo, "cobranca_3", false)[3].feito_em, null);
  assert.equal(progresso([]).completa, false);
});

test("checklist: adicionar, renomear, remover e mover", () => {
  let l = adicionar(listaPadrao(), "  Está   em análise ");
  assert.equal(l.length, 5);
  assert.equal(l[4].texto, "Está em análise");
  assert.equal(adicionar(l, "   ").length, 5);
  l = renomear(l, l[4].id, "Disse que está em análise");
  assert.equal(l[4].texto, "Disse que está em análise");
  assert.equal(renomear(l, l[4].id, "  ")[4].texto, "Disse que está em análise");
  l = mover(l, l[4].id, -1);
  assert.equal(l[3].texto, "Disse que está em análise");
  assert.equal(mover(l, l[0].id, -1), l);
  l = remover(l, "cobranca_3");
  assert.deepEqual(l.map(i => i.id).slice(0, 3), ["enviar_demo", "cobranca_1", "cobranca_2"]);
  assert.equal(l.length, 4);
});

test("itensDe ignora lixo e não deixa data em item pendente", () => {
  const l = itensDe({ checklist: [{ id: "a", texto: "Ok", feito: false, feito_em: "2026-10-01" }, { id: "b", texto: "  " }, null, { texto: "Sem id", feito: 1, feito_em: "x" }] });
  assert.equal(l.length, 2);
  assert.equal(l[0].feito_em, null);
  assert.equal(l[1].feito, true);
  assert.ok(l[1].id);
  assert.deepEqual(itensDe({}), []);
});

test("ao mudar de etapa: padrão ao chegar em Prontas; demo enviada ao abrir a conversa", () => {
  const agora = "2026-10-14T13:00:00.000Z";
  const p1 = patchAoMudarEtapa({ etapa: "a_trabalhar", checklist: [] }, "demo_pronta", agora);
  assert.deepEqual(p1.checklist.map(i => i.id), ["enviar_demo", "cobranca_1", "cobranca_2", "cobranca_3"]);
  assert.equal(p1.proxima_acao, "Enviar a demo e o vídeo");

  const p2 = patchAoMudarEtapa({ etapa: "demo_pronta", checklist: p1.checklist }, "primeiro_contato", agora);
  assert.equal(p2.checklist[0].feito, true);
  assert.equal(p2.checklist[0].feito_em, agora);
  assert.equal(p2.proxima_acao, "1ª cobrança: mandar o flyer de cortesia");

  // item à mão que já existia fica antes dos padrão
  const p3 = patchAoMudarEtapa({ etapa: "a_trabalhar", checklist: [{ id: "x", texto: "Conseguir fotos", feito: true }] }, "demo_pronta", agora);
  assert.deepEqual(p3.checklist.map(i => i.id), ["x", "enviar_demo", "cobranca_1", "cobranca_2", "cobranca_3"]);

  assert.deepEqual(patchAoMudarEtapa({ etapa: "primeiro_contato", checklist: [] }, "sem_resposta", agora), {}, "dentro de Em andamento não mexe");
  assert.deepEqual(patchAoMudarEtapa({ etapa: "demo_pronta", checklist: [] }, "finalizado", agora), {}, "finalizar não marca a demo como enviada");
  assert.deepEqual(patchAoMudarEtapa({ etapa: "demo_pronta", checklist: p2.checklist }, "primeiro_contato", agora), {}, "nada a mudar");
});

test("o banco usa os mesmos itens padrão e o mesmo início dos ciclos (supabase/schema.sql)", () => {
  const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  const funcao = sql.slice(sql.indexOf("function public.renderiza_checklist_padrao()"), sql.indexOf("function public.leads_ajustar_checklist()"));
  const doBanco = JSON.parse(funcao.slice(funcao.indexOf("'[") + 1, funcao.indexOf("]'") + 1));
  assert.deepEqual(doBanco, listaPadrao());
  assert.match(sql, new RegExp(`\\(d - date '${INICIO_DOS_CICLOS}'\\) / 7`));
  for (const i of ITENS_PADRAO) assert.ok(sql.includes(`'${i.id}'`), i.id + " no gatilho leads_ajustar_checklist");
});
