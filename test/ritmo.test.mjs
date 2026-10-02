// Regras do placar da tela Ritmo.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  semanaDe, mesDe, somarDias, placar, metaProporcional, ritmoNecessario, retornoSugerido, filaDeRetornos,
  turma, semPrimeiroContato, pistaDoPainelAntigo, chaveDoNome, indexar, cicloParaMostrar, cicloVigente, semanasDoCiclo,
  contatoPelaEtapa,
} from "../painel/src/ritmo.js";

let seq = 0;
const lead = (id, extra = {}) => ({ id, empresa: "Ótica " + id, etapa: "a_trabalhar", followup_em: null, nao_contatar: false, interesse: "nao_avaliado", ...extra });
const int = (lead_id, tipo, ocorreu_em, extra = {}) => ({ id: "i" + ++seq, lead_id, tipo, ocorreu_em, precisao: "exata", criado_em: "2026-09-01T00:00:0" + (seq % 10), ...extra });

// Semana de 21 a 27/09/2026 (segunda a domingo).
const LEADS = [
  lead("A"), lead("B", { followup_em: "2026-09-28" }), lead("C"), lead("D", { followup_em: "2026-09-25" }),
  lead("E"), lead("F", { followup_em: "2026-09-24" }), lead("G", { followup_em: "2026-09-26" }),
  lead("H", { followup_em: "2026-09-26", nao_contatar: true }),
  lead("I", { etapa: "finalizado", resultado: "ganho", data_fechamento: "2026-09-24", valor_fechado: 2500 }),
  lead("J", { followup_em: "2026-10-10" }),
];
const INTERACOES = [
  int("A", "primeiro_contato", "2026-09-22"), int("A", "retorno", "2026-09-29", { previsto_para: "2026-09-29" }), int("A", "resposta", "2026-09-30"),
  int("B", "primeiro_contato", "2026-09-21"),                       // segunda-feira: entra na semana
  int("C", "primeiro_contato", "2026-09-27"),                       // domingo: entra na semana
  int("D", "primeiro_contato", "2026-09-20"),                       // domingo anterior: fora da semana
  int("E", "primeiro_contato", "2026-09-01", { precisao: "aproximada" }), int("E", "retorno", "2026-09-23"), // recuperada; retorno sem data prevista
  int("F", "primeiro_contato", null, { precisao: "desconhecida" }), int("F", "retorno", "2026-09-24", { previsto_para: "2026-09-24" }),
  int("H", "primeiro_contato", "2026-09-22"),
  int("J", "primeiro_contato", "2026-09-10"),                       // follow-up de 23/09 reagendado para 10/10, sem retorno
  int("ZZ", "primeiro_contato", "2026-09-22"),                      // lead excluído: ignorado
];
const SEMANA = semanaDe("2026-09-25");

test("semana vai de segunda a domingo", () => {
  assert.deepEqual(semanaDe("2026-09-25"), { tipo: "semana", inicio: "2026-09-21", fim: "2026-09-27" });
  assert.deepEqual(semanaDe("2026-09-27"), { tipo: "semana", inicio: "2026-09-21", fim: "2026-09-27" });
  assert.deepEqual(semanaDe("2026-09-28"), { tipo: "semana", inicio: "2026-09-28", fim: "2026-10-04" });
  assert.equal(semanaDe("2026-12-31").fim, "2027-01-03");
});

test("mês usa o último dia certo", () => {
  assert.deepEqual(mesDe("2026-02-10"), { tipo: "mes", inicio: "2026-02-01", fim: "2026-02-28" });
  assert.equal(mesDe("2028-02-10").fim, "2028-02-29");
  assert.equal(mesDe("2026-12-05").fim, "2026-12-31");
  assert.equal(somarDias("2026-12-25", 7), "2027-01-01");
});

test("ótica nova só conta pelo primeiro contato com data exata dentro do período", () => {
  const p = placar({ leads: LEADS, interacoes: INTERACOES, periodo: SEMANA });
  assert.deepEqual(p.novas.map(n => n.lead.id).sort(), ["A", "B", "C", "H"]);
  // D (domingo anterior), E (data aproximada), F (desconhecida), G (só follow-up), I (fechou) e ZZ (excluído) não contam
});

test("primeiro contato repetido por dado ruim conta uma vez só", () => {
  const extra = [...INTERACOES, int("A", "primeiro_contato", "2026-09-23")];
  assert.equal(placar({ leads: LEADS, interacoes: extra, periodo: SEMANA }).novas.filter(n => n.lead.id === "A").length, 1);
});

test("retornos feitos: só retornos, pela data em que aconteceram; respostas não contam", () => {
  const p = placar({ leads: LEADS, interacoes: INTERACOES, periodo: SEMANA });
  assert.deepEqual(p.retornosFeitos.map(r => r.lead.id).sort(), ["E", "F"]);
  assert.equal(p.respostas, 0);
  const seguinte = placar({ leads: LEADS, interacoes: INTERACOES, periodo: semanaDe("2026-09-28") });
  assert.deepEqual(seguinte.retornosFeitos.map(r => r.lead.id), ["A"]);
  assert.equal(seguinte.respostas, 1);
  assert.equal(seguinte.novas.length, 0, "voltar a falar com a mesma ótica não é ótica nova");
});

test("previstos = cumpridos no período + pendentes no período; reagendar não conclui", () => {
  const p = placar({ leads: LEADS, interacoes: INTERACOES, periodo: SEMANA });
  assert.deepEqual(p.cumpridos.map(r => r.lead.id), ["F"]);
  assert.deepEqual(p.pendentes.map(r => r.lead.id), ["D"]);   // G não foi contatada, H pediu para parar, F já foi feito, J foi reagendado
  assert.equal(p.previstos, 2);
  const outubro = placar({ leads: LEADS, interacoes: INTERACOES, periodo: mesDe("2026-10-01") });
  assert.deepEqual(outubro.pendentes.map(r => r.lead.id), ["J"]);
  assert.equal(outubro.retornosFeitos.length, 0);
});

test("sem retorno previsto: previstos = 0 (a tela mostra frase, não porcentagem)", () => {
  const p = placar({ leads: LEADS, interacoes: INTERACOES, periodo: { inicio: "2026-08-01", fim: "2026-08-31" } });
  assert.equal(p.previstos, 0);
});

test("fechamentos aparecem como contexto do período", () => {
  const p = placar({ leads: LEADS, interacoes: INTERACOES, periodo: SEMANA });
  assert.deepEqual(p.ganhos.map(l => l.id), ["I"]);
});

test("mês e ciclo usam as mesmas regras", () => {
  const setembro = placar({ leads: LEADS, interacoes: INTERACOES, periodo: mesDe("2026-09-25") });
  assert.deepEqual(setembro.novas.map(n => n.lead.id).sort(), ["A", "B", "C", "D", "H", "J"]);
  assert.equal(setembro.retornosFeitos.length, 3);
  const ciclo = { inicio: "2026-09-21", fim: "2026-12-31", meta_novas: 180 };
  assert.equal(placar({ leads: LEADS, interacoes: INTERACOES, periodo: ciclo }).novas.length, 4);
});

test("meta proporcional aos dias do período dentro do ciclo", () => {
  const ciclo = { inicio: "2026-10-01", fim: "2026-12-31", meta_novas: 180 }; // 92 dias
  assert.equal(metaProporcional(ciclo, semanaDe("2026-10-07")), 14);
  assert.equal(metaProporcional(ciclo, mesDe("2026-10-07")), 61);
  assert.equal(metaProporcional(ciclo, semanaDe("2026-09-30")), 8);   // só 4 dias da semana estão no ciclo
  assert.equal(metaProporcional(ciclo, semanaDe("2026-09-10")), 0);
  assert.equal(metaProporcional(null, SEMANA), null);
});

test("ritmo necessário", () => {
  const ciclo = { inicio: "2026-10-01", fim: "2026-12-31", meta_novas: 180 };
  const r = ritmoNecessario({ ciclo, feitas: 38, hoje: "2026-10-20" });
  assert.equal(r.faltam, 142);
  assert.equal(r.dias, 73);
  assert.equal(r.porSemana, 14);
  assert.equal(r.mediaPorSemana, 13.3);
  assert.equal(ritmoNecessario({ ciclo, feitas: 0, hoje: "2026-09-25" }).estado, "futuro");
  assert.equal(ritmoNecessario({ ciclo, feitas: 150, hoje: "2027-01-02" }).estado, "encerrado");
  assert.equal(ritmoNecessario({ ciclo, feitas: 170, hoje: "2026-12-29" }).porSemana, 10, "menos de uma semana: tudo o que falta");
  assert.equal(ritmoNecessario({ ciclo, feitas: 200, hoje: "2026-11-01" }).porSemana, 0);
});

test("cadência: 7 e 21 dias para quem não respondeu, depois espera", () => {
  const l = lead("K");
  const pc = int("K", "primeiro_contato", "2026-09-01");
  assert.equal(retornoSugerido(l, [pc], null).data, "2026-09-08");
  assert.equal(retornoSugerido(l, [pc, int("K", "retorno", "2026-09-08")], null).data, "2026-09-22");
  assert.equal(retornoSugerido(l, [pc, int("K", "retorno", "2026-09-08"), int("K", "retorno", "2026-09-22")], null), null);
  assert.equal(retornoSugerido(l, [pc, int("K", "resposta", "2026-09-02")], null), null, "respondeu: vale a data combinada");
  assert.equal(retornoSugerido({ ...l, nao_contatar: true }, [pc], null), null);
  assert.equal(retornoSugerido(l, [int("K", "primeiro_contato", "2026-09-01", { precisao: "aproximada" })], null), null);
  assert.equal(retornoSugerido(l, [pc], { dias_primeiro_retorno: 5, dias_segundo_retorno: 15 }).data, "2026-09-06");
});

test("fila de retornos por semana, com atrasados à parte", () => {
  const f = filaDeRetornos({ leads: LEADS, interacoes: INTERACOES, hoje: "2026-09-26" });
  assert.deepEqual(f.atrasados.map(x => x.lead.id), ["D"]);
  assert.deepEqual(f.estaSemana.map(x => x.lead.id), []);
  assert.deepEqual(f.proxima.map(x => x.lead.id), ["B"]);
  assert.deepEqual(f.emDuas.map(x => x.lead.id), ["J"]);
});

test("turma do mês: quem teve o primeiro contato no mês, mais interesse primeiro", () => {
  const leads = [lead("A"), lead("B", { interesse: "perto_de_fechar" }), lead("C", { interesse: "interessado" }), lead("D")];
  const interacoes = [
    int("A", "primeiro_contato", "2026-09-02"), int("A", "resposta", "2026-09-20"),
    int("B", "primeiro_contato", "2026-09-05"),
    int("C", "primeiro_contato", "2026-09-10"),
    int("D", "primeiro_contato", "2026-08-30"),
  ];
  const t = turma({ leads, interacoes, periodo: mesDe("2026-09-01") });
  assert.deepEqual(t.map(x => x.lead.id), ["B", "C", "A"]);
  assert.equal(t[2].ultima.tipo, "resposta");
  assert.equal(t[2].respondeu, true);
});

test("dados antigos: pista do painel antigo e lista de quem falta registrar", () => {
  const antigo = lead("P", { etapa: "demo_enviada", legado: { status: "enviado", enviadoEm: "2026-09-24T23:35:35.552Z", ultimoContato: "2026-09-24" } });
  assert.equal(pistaDoPainelAntigo(antigo).data, "2026-09-24");
  assert.match(pistaDoPainelAntigo(antigo).texto, /24\/09\/2026/);
  const leads = [antigo, lead("Q"), lead("R", { etapa: "follow_up" }), lead("S", { etapa: "follow_up" })];
  const faltam = semPrimeiroContato({ leads, interacoes: [int("S", "primeiro_contato", "2026-09-01")] });
  assert.deepEqual(faltam.map(l => l.id), ["R", "P"]);
  // nenhuma dessas conta como ótica nova
  assert.equal(placar({ leads, interacoes: [], periodo: mesDe("2026-09-01") }).novas.length, 0);
});

test("chave do nome para achar duplicatas", () => {
  assert.equal(chaveDoNome("Óticas Perez"), chaveDoNome("Ótica Perez"));
  assert.equal(chaveDoNome("ÓPTICA São João!"), "sao joao");
  assert.equal(chaveDoNome("Ótica"), "otica");
});

test("ciclo mostrado e ciclo da cadência", () => {
  const ciclos = [{ id: 1, inicio: "2026-07-01", fim: "2026-09-30" }, { id: 2, inicio: "2026-10-01", fim: "2026-12-31" }];
  assert.equal(cicloParaMostrar(ciclos, "2026-09-25").id, 1);
  assert.equal(cicloParaMostrar(ciclos, "2027-02-01").id, 2);
  assert.equal(cicloParaMostrar(ciclos, "2026-01-01").id, 1);
  assert.equal(cicloVigente(ciclos, "2026-10-02").id, 2);
});

test("semana a semana do ciclo", () => {
  const ciclo = { inicio: "2026-09-21", fim: "2026-12-31", meta_novas: 180 };
  const linhas = semanasDoCiclo({ ciclo, leads: LEADS, interacoes: INTERACOES, hoje: "2026-09-30" });
  assert.equal(linhas.length, 2);
  assert.equal(linhas[0].novas, 4);
  assert.equal(linhas[1].retornosFeitos, 1);
  assert.ok(indexar(LEADS, INTERACOES).get("A").length === 3);
});

test("validação no painel repete as regras do banco", async () => {
  const { validarInteracao } = await import("../painel/src/ritmo.js");
  const hoje = "2026-09-25";
  const pc = int("V", "primeiro_contato", "2026-09-22");
  assert.match(validarInteracao(int("V", "primeiro_contato", "2026-09-23"), [pc], hoje), /já tem primeiro contato/);
  assert.match(validarInteracao(int("V", "retorno", "2026-09-23"), [], hoje), /ainda não tem primeiro contato/);
  assert.match(validarInteracao(int("V", "retorno", "2026-09-20"), [pc], hoje), /antes do primeiro contato/);
  assert.match(validarInteracao(int("V", "anotacao", "2026-09-27"), [pc], hoje), /ainda não chegou/);
  assert.match(validarInteracao(int("V", "retorno", "2026-09-01", { precisao: "aproximada" }), [pc], hoje), /primeiro contato de uma conversa antiga/);
  assert.equal(validarInteracao(int("V", "retorno", "2026-09-25"), [pc], hoje), null);
  assert.equal(validarInteracao(int("V", "resposta", "2026-09-23"), [], hoje), null, "resposta sem primeiro contato é aceita (a ótica pode ter chamado)");
  assert.equal(validarInteracao({ ...pc, resumo: "corrigido" }, [pc], hoje), null, "editar o próprio primeiro contato");
  assert.equal(validarInteracao(int("W", "primeiro_contato", null, { precisao: "desconhecida" }), [], hoje), null);
});

test("mudar para Contato iniciado registra o primeiro contato só quando falta", () => {
  assert.equal(contatoPelaEtapa("a_trabalhar", "demo_enviada", []), true);
  assert.equal(contatoPelaEtapa("gravacao_realizada", "follow_up", []), true);
  assert.equal(contatoPelaEtapa("demo_criada", "finalizado", []), true);
  assert.equal(contatoPelaEtapa("a_trabalhar", "demo_enviada", [int("X", "primeiro_contato", "2026-08-01", { precisao: "aproximada" })]), false);
  assert.equal(contatoPelaEtapa("follow_up", "finalizado", []), false);       // já estava depois do contato
  assert.equal(contatoPelaEtapa("demo_criada", "gravacao_realizada", []), false); // ainda antes do contato
  assert.equal(contatoPelaEtapa("demo_enviada", "a_trabalhar", []), false);
});
