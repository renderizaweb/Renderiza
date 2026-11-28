// Projetos e issues (painel/src/projetos.js): status, Done com o dia e o ciclo, progresso, ordem, filtros e ciclos.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STATUS, ESTIMATIVAS, SEM, codigoDaIssue, proximoNumero, patchDeStatus, progresso, compararIssues, posicaoEntre,
  posicaoNoFim, filtrarIssues, separarDone, ciclosDaTela, resumoDoCiclo, ciclosParaEscolher, diasParaAcabar,
  ordenarProjetos, projetoAtrasado, issuesPorStatus, novaIssue, nomeDoStatus,
  issueParaPacote, pacoteDoProjeto, lerPacote, planoDeImportacao,
} from "../painel/src/projetos.js";

const AGORA = new Date("2026-12-02T15:00:00Z");

test("os status são os do Linear, em inglês, nesta ordem; estimativa na escala de Fibonacci", () => {
  assert.deepEqual(STATUS.map(s => s.nome), ["Backlog", "To-do", "In progress", "Validation", "Done"]);
  assert.deepEqual(STATUS.map(s => s.id), ["backlog", "todo", "in_progress", "validation", "done"]);
  assert.deepEqual(ESTIMATIVAS, [1, 2, 3, 5, 8]);
  assert.equal(nomeDoStatus("in_progress"), "In progress");
  assert.equal(nomeDoStatus("qualquer"), "Backlog");
});

test("o número curto: #12; o próximo é o maior mais um", () => {
  assert.equal(codigoDaIssue({ numero: 12 }), "#12");
  assert.equal(codigoDaIssue({}), "");
  assert.equal(proximoNumero([]), 1);
  assert.equal(proximoNumero([{ numero: 3 }, { numero: 17 }, {}]), 18);
});

test("ir para Done guarda o momento e, sem ciclo, o ciclo do dia; sair do Done tira o momento", () => {
  assert.deepEqual(patchDeStatus({ status: "in_progress", ciclo: null }, "done", "2026-12-02", AGORA), { status: "done", feita_em: AGORA.toISOString(), ciclo: 10 });
  assert.deepEqual(patchDeStatus({ status: "validation", ciclo: 9 }, "done", "2026-12-02", AGORA), { status: "done", feita_em: AGORA.toISOString() }, "o ciclo que já tinha fica");
  assert.deepEqual(patchDeStatus({ status: "done", feita_em: "x" }, "validation", "2026-12-02"), { status: "validation", feita_em: null });
  assert.deepEqual(patchDeStatus({ status: "backlog" }, "todo", "2026-12-02"), { status: "todo" });
  assert.deepEqual(patchDeStatus({ status: "todo" }, "todo", "2026-12-02"), {});
});

test("progresso: feitas, pontos (só os estimados) e quantas em cada status", () => {
  const p = progresso([
    { status: "done", estimativa: 3 }, { status: "done" }, { status: "in_progress", estimativa: 5 }, { status: "backlog", estimativa: 2 },
  ]);
  assert.equal(p.total, 4);
  assert.equal(p.feitas, 2);
  assert.equal(p.pontos, 10);
  assert.equal(p.pontosFeitos, 3);
  assert.equal(p.fracao, 0.5);
  assert.deepEqual(p.porStatus, { backlog: 1, todo: 0, in_progress: 1, validation: 0, done: 2 });
  assert.equal(progresso([]).fracao, 0);
});

test("ordem na coluna: a de arrastar, depois o número; no Done, a mais recente primeiro", () => {
  const a = { status: "todo", posicao: 2000, numero: 1 }, b = { status: "todo", posicao: 1000, numero: 2 }, c = { status: "todo", numero: 3 };
  assert.deepEqual([a, b, c].sort(compararIssues), [b, a, c]);
  const d1 = { status: "done", feita_em: "2026-11-20T10:00:00+00:00", numero: 1 }, d2 = { status: "done", feita_em: "2026-11-27T10:00:00.000Z", numero: 2 };
  assert.deepEqual([d1, d2].sort(compararIssues), [d2, d1]);
  assert.equal(posicaoEntre({ posicao: 1000 }, { posicao: 2000 }), 1500);
  assert.equal(posicaoEntre({ posicao: 1000 }, null), 2000);
  assert.equal(posicaoEntre(null, { posicao: 1000 }), 0);
  assert.equal(posicaoEntre(null, null), 1000);
  assert.equal(posicaoNoFim([{ posicao: 500 }, { posicao: 3000 }, {}]), 4000);
  assert.equal(posicaoNoFim([]), 1000);
});

test("filtros: projeto, sem projeto, ciclo atual e próximo, sem ciclo, responsável e busca (com #número e o projeto)", () => {
  const projetos = [{ id: "p1", nome: "Vereador Mateuzinho" }, { id: "p2", nome: "Ricardo Motors" }];
  const issues = [
    { id: "1", numero: 1, titulo: "Layout da home", projeto_id: "p1", ciclo: 10, responsavel: "Kaue" },
    { id: "2", numero: 2, titulo: "Domínio", projeto_id: "p2", ciclo: 11, responsavel: "Milena" },
    { id: "3", numero: 3, titulo: "Ideia solta", descricao: "Revisar a proposta", projeto_id: null, ciclo: null },
  ];
  const ids = f => filtrarIssues(issues, f, { hoje: "2026-12-02", projetos }).map(i => i.id);
  assert.deepEqual(ids({}), ["1", "2", "3"]);
  assert.deepEqual(ids({ projeto: "p1" }), ["1"]);
  assert.deepEqual(ids({ projeto: SEM }), ["3"]);
  assert.deepEqual(ids({ ciclo: "atual" }), ["1"]);
  assert.deepEqual(ids({ ciclo: "proximo" }), ["2"]);
  assert.deepEqual(ids({ ciclo: SEM }), ["3"]);
  assert.deepEqual(ids({ ciclo: "11" }), ["2"]);
  assert.deepEqual(ids({ responsavel: "Kaue" }), ["1"]);
  assert.deepEqual(ids({ responsavel: SEM }), ["3"]);
  assert.deepEqual(ids({ busca: "#2" }), ["2"]);
  assert.deepEqual(ids({ busca: "ricardo" }), ["2"], "pelo nome do projeto");
  assert.deepEqual(ids({ busca: "proposta" }), ["3"], "pela descrição");
  assert.deepEqual(ids({ busca: "layout home" }), ["1"], "todas as palavras");
});

test("o Done do quadro: as feitas nos últimos 7 dias; as outras à parte", () => {
  const done = [{ id: "a", feita_em: "2026-11-30T12:00:00+00:00" }, { id: "b", feita_em: "2026-11-24T12:00:00+00:00" }, { id: "c" }];
  const { recentes, antigas } = separarDone(done, "2026-12-02");
  assert.deepEqual(recentes.map(i => i.id), ["a", "c"]);
  assert.deepEqual(antigas.map(i => i.id), ["b"]);
});

test("ciclos da tela: o atual, o próximo, os passados (do mais novo) e os de depois; o resumo de um ciclo", () => {
  const issues = [{ ciclo: 7, status: "done", estimativa: 3 }, { ciclo: 9, status: "done" }, { ciclo: 9, status: "todo", estimativa: 2 }, { ciclo: 13, status: "backlog" }, { ciclo: null }];
  assert.deepEqual(ciclosDaTela(issues, "2026-12-02"), { atual: 10, proximo: 11, passados: [9, 7], adiante: [13] });
  const r = resumoDoCiclo(issues, 9);
  assert.equal(r.inicio, "2026-11-27");
  assert.equal(r.fim, "2026-11-29");
  assert.equal(r.total, 2);
  assert.equal(r.feitas, 1);
  assert.equal(r.ficaram, 1);
  assert.equal(r.pontos, 2);
  assert.equal(r.pontosFeitos, 0);
  assert.deepEqual(ciclosParaEscolher("2026-12-02"), [8, 9, 10, 11, 12, 13]);
  assert.deepEqual(ciclosParaEscolher("2026-12-02", 3), [3, 8, 9, 10, 11, 12, 13]);
  assert.equal(diasParaAcabar(10, "2026-11-30"), 7, "segunda: 7 dias");
  assert.equal(diasParaAcabar(10, "2026-12-06"), 1, "domingo: o último");
});

test("projetos: em andamento primeiro (meta mais perto), depois os concluídos (o mais recente); atrasado é meta vencida", () => {
  const ps = [
    { id: "c1", situacao: "concluido", concluido_em: "2026-11-17" },
    { id: "a1", situacao: "em_andamento", inicio: "2026-11-16" },
    { id: "c2", situacao: "concluido", concluido_em: "2026-11-27" },
    { id: "a2", situacao: "em_andamento", meta: "2026-12-10", inicio: "2026-11-01" },
  ];
  assert.deepEqual(ordenarProjetos(ps).map(p => p.id), ["a2", "a1", "c2", "c1"]);
  assert.equal(projetoAtrasado({ situacao: "em_andamento", meta: "2026-12-01" }, "2026-12-02"), true);
  assert.equal(projetoAtrasado({ situacao: "concluido", meta: "2026-12-01" }, "2026-12-02"), false);
  assert.equal(projetoAtrasado({ situacao: "em_andamento" }, "2026-12-02"), false);
});

test("as issues do projeto por status, na ordem dos status, só os que têm", () => {
  const grupos = issuesPorStatus([{ status: "done", feita_em: "2026-11-20" }, { status: "todo", numero: 2 }, { status: "todo", numero: 1 }]);
  assert.deepEqual(grupos.map(g => g.id), ["todo", "done"]);
  assert.deepEqual(grupos[0].issues.map(i => i.numero), [1, 2]);
});

test("issue nova: número e posição do fim da coluna; criada já em Done ganha o dia e o ciclo", () => {
  const existentes = [{ numero: 4, status: "backlog", posicao: 3000 }];
  const n = novaIssue({ titulo: "  Layout  ", estimativa: "3", ciclo: "10", projeto_id: "p1" }, existentes, "2026-12-02", AGORA);
  assert.deepEqual(n, { titulo: "Layout", descricao: "", projeto_id: "p1", status: "backlog", estimativa: 3, ciclo: 10, responsavel: null, numero: 5, posicao: 4000 });
  assert.equal(novaIssue({ titulo: "x", estimativa: "4" }, [], "2026-12-02").estimativa, null, "fora da escala: sem estimativa");
  const feita = novaIssue({ titulo: "x", status: "done" }, [], "2026-12-02", AGORA);
  assert.equal(feita.feita_em, AGORA.toISOString());
  assert.equal(feita.ciclo, 10);
});

const PACOTE = [
  "Apresentação do projeto: a importação ignora tudo isto, até a primeira issue.",
  "# Ideia de antes (isto não é issue: está num bloco de código)",
  "",
  "# Layout da página inicial",
  "status: To-do",
  "estimativa: 3",
  "ciclo: C10",
  "responsavel: Kaue",
  "",
  "## Contexto",
  "A home do mandato.",
  "",
  "```bash",
  "# isto é um comentário de shell, não uma issue",
  "npm run site -- vereador-mateuzinho-silva",
  "```",
  "",
  "## O que fazer",
  "- [ ] Seções",
  "",
  "# #16 · Proposta",
  "status: done",
  "",
  "# Domínio no Registro.br",
  "estimativa: 4",
  "ciclo: próximo",
  "status: esperando",
].join("\n");

test("pacote: lê título, dados e documentação; o código com # não corta a issue; avisos do que não deu", () => {
  const { issues, avisos } = lerPacote(PACOTE, "2026-11-28");
  assert.deepEqual(issues.map(i => i.titulo), ["Ideia de antes (isto não é issue: está num bloco de código)", "Layout da página inicial", "Proposta", "Domínio no Registro.br"]);
  const layout = issues[1];
  assert.equal(layout.status, "todo");
  assert.equal(layout.estimativa, 3);
  assert.equal(layout.ciclo, 10);
  assert.equal(layout.responsavel, "Kaue");
  assert.match(layout.doc, /^## Contexto\nA home do mandato\./);
  assert.match(layout.doc, /# isto é um comentário de shell/);
  assert.match(layout.doc, /- \[ \] Seções$/);
  assert.equal(issues[2].numero, 16, "o número no título (#16 · Proposta)");
  assert.equal(issues[2].status, "done");
  assert.equal(issues[3].ciclo, 10, "ciclo: próximo (em 28/11, o atual é o 9)");
  assert.equal(issues[3].estimativa, null);
  assert.equal(issues[3].status, "backlog");
  assert.equal(avisos.length, 2, avisos.join(" | "));
  assert.match(avisos.join(" "), /estimativa "4" fora da escala/);
  assert.match(avisos.join(" "), /status "esperando" não existe/);
});

test("pacote: o que sai do painel volta igual (ida e volta), com o número e a documentação", () => {
  const issue = { numero: 18, titulo: "Layout da página inicial", status: "in_progress", estimativa: 3, ciclo: 10, responsavel: "Kaue",
    descricao: "# Título solto\n\n## O que fazer\n- [x] Seções\n\n```\n# comentário\n```" };
  const md = issueParaPacote(issue);
  assert.match(md, /^# Layout da página inicial\nnumero: 18\nstatus: in_progress\nestimativa: 3\nciclo: 10\nresponsavel: Kaue\n\n## Título solto/, "o # da documentação vira ##");
  const volta = lerPacote(md).issues[0];
  assert.deepEqual([volta.numero, volta.titulo, volta.status, volta.estimativa, volta.ciclo, volta.responsavel], [18, issue.titulo, "in_progress", 3, 10, "Kaue"]);
  assert.match(volta.doc, /```\n# comentário\n```$/, "dentro do código, o # fica");
  const projeto = { nome: "Vereador Mateuzinho Silva · Site + portal do gabinete", situacao: "em_andamento", inicio: "2026-11-27", descricao: "# Escopo\nDuas entregas." };
  const tudo = pacoteDoProjeto(projeto, [issue, { numero: 16, titulo: "Proposta", status: "done", feita_em: "2026-11-27T15:00:00Z" }], { cliente: "Vereador Mateuzinho Silva", hoje: "2026-11-28" });
  assert.match(tudo, /^Projeto: Vereador Mateuzinho Silva · Site \+ portal do gabinete\nCliente: Vereador Mateuzinho Silva\nSituação: Em andamento · início 27\/11\/2026\nCiclo de hoje: 9/);
  assert.match(tudo, /## Escopo\nDuas entregas\./);
  const lidas = lerPacote(tudo).issues;
  assert.deepEqual(lidas.map(i => i.numero), [18, 16], "a apresentação não vira issue; a ordem é a dos status");
});

test("importar: cria as novas, atualiza pelo número ou pelo título (sem duplicar) e só muda o que veio", () => {
  const existentes = [
    { id: "a", numero: 16, titulo: "Proposta", projeto_id: "p1", status: "done", feita_em: "2026-11-27T15:00:00Z", ciclo: 9, descricao: "Feita." },
    { id: "b", numero: 17, titulo: "Assinatura do termo", projeto_id: "p1", status: "done", ciclo: 9, descricao: "" },
    { id: "c", numero: 30, titulo: "Outra coisa", projeto_id: "p2", status: "todo" },
  ];
  const { issues } = lerPacote([
    "# Layout da página inicial", "status: todo", "estimativa: 3", "", "## O que fazer", "- [ ] Seções", "",
    "# assinatura do TERMO", "", "## Registro", "- 28/11 · assinado online",
    "# Proposta", "numero: 16", "status: validation",
    "# Algo", "numero: 30",
    "# Layout da página inicial", "estimativa: 5",
  ].join("\n"), "2026-11-28");
  const plano = planoDeImportacao(issues, existentes, "p1", "2026-11-28");
  assert.equal(plano.criar.length, 1);
  assert.deepEqual(plano.criar[0], { titulo: "Layout da página inicial", descricao: "## O que fazer\n- [ ] Seções", projeto_id: "p1", status: "todo", estimativa: 3, ciclo: null, responsavel: null });
  assert.equal(plano.atualizar.length, 2);
  const termo = plano.atualizar.find(u => u.issue.id === "b");
  assert.deepEqual(termo.patch, { titulo: "assinatura do TERMO", descricao: "## Registro\n- 28/11 · assinado online" }, "pelo título; o status não veio, fica");
  const proposta = plano.atualizar.find(u => u.issue.id === "a");
  assert.deepEqual(proposta.patch, { status: "validation", feita_em: null }, "a documentação vazia não apaga a que existe");
  assert.match(plano.avisos.join(" "), /#30 é de outro projeto/);
  assert.match(plano.avisos.join(" "), /aparece duas vezes/);
  // o mesmo arquivo de novo, depois de criado: nada novo
  const depois = [...existentes, { id: "d", numero: 31, ...plano.criar[0] }];
  const denovo = planoDeImportacao(lerPacote("# Layout da página inicial\nstatus: todo\nestimativa: 3\n\n## O que fazer\n- [ ] Seções").issues, depois, "p1", "2026-11-28");
  assert.equal(denovo.criar.length, 0);
  assert.equal(denovo.atualizar.length, 0, "nada mudou");
});
