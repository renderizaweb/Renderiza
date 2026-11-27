// Os módulos da base (Missão 2, bloco B): Equipe e acessos e Serviços. As regras; as telas, no navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { modulosDaGrade, acessosDoFormulario, resumoDosAcessos, vistoEm } from "../src/modulos/equipe/index.js";
import { abasDoNicho, lerServico, lerCampanha } from "../src/modulos/servicos/index.js";
import { nicho, modoDaAgenda, agendaNoSite } from "../src/nichos/index.js";
import { passosDaConta } from "../src/modulos/inicio/primeiros-passos.js";
import { JEITOS } from "../src/modulos/configuracoes/index.js";

const conta = { nicho: "eventos", modulos: ["agenda-online", "agenda", "financeiro"] };

test("equipe: a grade tem os módulos ligados (sem a agenda online) e Serviços", () => {
  const m = modulosDaGrade(conta);
  assert.deepEqual(m.map(x => x.id), ["agenda", "financeiro", "servicos"]);
  assert.equal(m.find(x => x.id === "servicos").nome, "Pacotes");
  assert.deepEqual(m.find(x => x.id === "servicos").niveis.map(n => n.valor), ["ver", "editar"], "Serviços todos veem: não tem 'sem acesso'");
  assert.equal(modulosDaGrade({ ...conta, nicho: "fotografia" }).find(x => x.id === "servicos").nome, "Tipos de ensaio");
});

test("equipe: o formulário vira acessos (sem acesso some; Serviços 'só vê' é o padrão)", () => {
  const m = modulosDaGrade(conta);
  assert.deepEqual(acessosDoFormulario({ "acesso-agenda": "ver", "acesso-financeiro": "", "acesso-servicos": "ver" }, m), { agenda: "ver" });
  assert.deepEqual(acessosDoFormulario({ "acesso-agenda": "editar", "acesso-financeiro": "editar", "acesso-servicos": "editar" }, m), { agenda: "editar", financeiro: "editar", servicos: "editar" });
  assert.deepEqual(resumoDosAcessos({ dono: false, acessos: { agenda: "ver", financeiro: "editar" } }, m), ["Agenda (só vê)", "Financeiro"]);
  assert.deepEqual(resumoDosAcessos({ dono: true, acessos: {} }, m), ["Tudo (dono)"]);
  assert.deepEqual(resumoDosAcessos({ dono: false, acessos: {} }, m), ["Só o Início"]);
  const agora = Date.parse("2026-10-29T15:00:00Z");
  assert.equal(vistoEm(null, agora), "ainda não entrou");
  assert.equal(vistoEm("2026-10-29T14:58:00Z", agora), "agora");
  assert.equal(vistoEm("2026-10-29T13:00:00Z", agora), "há 2 h");
});

test("serviços: as abas mudam pelo nicho", () => {
  assert.deepEqual(abasDoNicho(nicho("eventos")).map(a => a.id), ["servicos", "tipos", "adicionais", "horarios", "bloqueios"]);
  assert.deepEqual(abasDoNicho(nicho("fotografia")).map(a => a.id), ["servicos", "horarios", "campanhas", "bloqueios", "adicionais"]);
  assert.equal(abasDoNicho(nicho("fotografia"))[0].novo, "Novo tipo de ensaio");
  assert.equal(abasDoNicho(nicho("eventos")).find(a => a.id === "bloqueios").nome, "Datas fechadas");
});

test("o jeito da agenda: a escolha da conta, senão o do nicho (a regra do banco, modo_da_agenda)", () => {
  assert.equal(modoDaAgenda({ nicho: "fotografia", ajustes: {} }), "horario");
  assert.equal(modoDaAgenda({ nicho: "eventos", ajustes: null }), "turno");
  assert.equal(modoDaAgenda({ nicho: "fotografia", ajustes: { agenda: { modo: "turno" } } }), "turno");
  assert.equal(modoDaAgenda({ nicho: "eventos", ajustes: { agenda: { modo: "horario" } } }), "horario");
  assert.equal(modoDaAgenda({ nicho: "eventos", ajustes: { agenda: { modo: "qualquer" } } }), "turno", "valor que não existe: o do nicho");
  assert.equal(modoDaAgenda(null), "turno", "sem conta: o do nicho padrão (eventos)");
  assert.deepEqual(JEITOS.map(j => j.id), ["horario", "turno"]);
});

test("a agenda no site: só false desliga (a regra do banco, conta_do_site); a conta nova ganha o passo de ligar", () => {
  assert.equal(agendaNoSite({ ajustes: {} }), true, "sem o valor: ligada, como sempre");
  assert.equal(agendaNoSite({ ajustes: { agenda: { modo: "turno" } } }), true);
  assert.equal(agendaNoSite({ ajustes: { agenda: { site: true } } }), true);
  assert.equal(agendaNoSite({ ajustes: { agenda: { site: false } } }), false);
  const conta = ajustes => ({ nicho: "fotografia", modulos: ["agenda-online", "meu-site", "atendimento"], ajustes });
  const passo = ajustes => passosDaConta(conta(ajustes), { site: true }).find(p => p.id === "agenda-site");
  assert.equal(passo({}), undefined, "a conta de antes (sem o valor) não ganha o passo");
  assert.deepEqual([passo({ agenda: { site: false } }).feito, passo({ agenda: { site: true } }).feito], [false, true]);
  assert.equal(passosDaConta({ ...conta({ agenda: { site: false } }), modulos: ["meu-site"] }, { site: true }).some(p => p.id === "agenda-site"), false, "sem a agenda online, sem o passo");
});

test("serviços: no jeito por turno, a fotografia fica sem campanhas (são do jeito por horário)", () => {
  assert.deepEqual(abasDoNicho(nicho("fotografia"), "turno").map(a => a.id), ["servicos", "horarios", "bloqueios", "adicionais"]);
  assert.deepEqual(abasDoNicho(nicho("fotografia"), "horario").map(a => a.id), abasDoNicho(nicho("fotografia")).map(a => a.id));
  assert.deepEqual(abasDoNicho(nicho("eventos"), "horario").map(a => a.id), abasDoNicho(nicho("eventos")).map(a => a.id));
});

test("serviços: pacote e ensaio lidos do formulário", () => {
  const p = lerServico({ nome: "Clássico", valor: "26.500", sinal: "7.950,00", convidados_inclusos: "100", valor_convidado_extra: "95", inclui: "Espaço por 6 horas\n\nDJ\n", ativo: true }, nicho("eventos"));
  assert.deepEqual(p.erros, {});
  assert.equal(p.linha.valor, 26500);
  assert.equal(p.linha.sinal, 7950);
  assert.deepEqual(p.linha.inclui, ["Espaço por 6 horas", "DJ"]);
  assert.equal(lerServico({ nome: "X", valor: "100", sinal: "200" }, nicho("eventos")).erros.sinal, "O sinal não pode passar do valor.");
  assert.equal(lerServico({ nome: "", valor: "abc" }, nicho("eventos")).erros.valor, "Confira o valor (ex.: 1.900 ou 750,00).");
  const e = lerServico({ nome: "Newborn", duracao_min: "180", valor: "", entrega: "30 fotos", cor: "#c26a2a" }, nicho("fotografia"));
  assert.deepEqual(e.erros, {});
  assert.equal(e.linha.valor, null, "valor em branco: a preencher");
  assert.equal(e.linha.duracao_min, 180);
  assert.ok(!("inclui" in e.linha));
  assert.equal(lerServico({ nome: "X", duracao_min: "2" }, nicho("fotografia")).erros.duracao_min, "Entre 5 e 1440 minutos.");
});

test("serviços: campanha com dias e horários digitados", () => {
  const c = lerCampanha({ nome: "Natal", dias: "14/12\n15/12/2026\n14/12", horarios: "9h, 09:40 10:20", vagas: "", prazo_sinal_horas: "24" }, "2026-10-29");
  assert.deepEqual(c.erros, {});
  assert.deepEqual(c.linha.dias, ["2026-12-14", "2026-12-15"]);
  assert.deepEqual(c.linha.horarios, ["09:00", "09:40", "10:20"]);
  assert.equal(c.linha.vagas, null);
  assert.match(lerCampanha({ nome: "X", dias: "amanhã", horarios: "9h" }, "2026-10-29").erros.dias, /Não entendi: amanhã/);
  assert.match(lerCampanha({ nome: "X", dias: "14/12", horarios: "nove" }, "2026-10-29").erros.horarios, /Não entendi: nove/);
});
