// A conversa de boas-vindas (Missão 7, bloco E; src/telas/montar/roteiro.js): o roteiro fixo, o que a demo já sabe,
// o perfil e a ordem do menu pelo objetivo. Dados fictícios.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ASSUNTOS, assuntosDoNicho, perguntasDaConversa, perfilDasRespostas, ordemDoMenu, confirmacoes, tiposParaEscolher } from "../src/telas/montar/roteiro.js";
import { TAREFAS } from "../supabase/functions/assistente/logica.js";

test("o roteiro: 5 perguntas na conversa (as que mudam o painel na hora); as outras ficam para depois", () => {
  assert.deepEqual(assuntosDoNicho("eventos").map(a => a.assunto), ["objetivo", "tamanho", "organiza", "horarios", "pacotes"]);
  assert.match(assuntosDoNicho("fotografia").find(a => a.assunto === "pacotes").pergunta, /ensaios/);
  assert.ok(assuntosDoNicho("eventos", { todos: true }).some(a => a.assunto === "contrato"), "o contrato fica guardado para depois");
  assert.equal(assuntosDoNicho("fotografia").length, 5);
  assert.ok(assuntosDoNicho("eventos", { todos: true }).some(a => a.assunto === "porte"), "o porte fica guardado, só para eventos");
  assert.ok(!assuntosDoNicho("fotografia", { todos: true }).some(a => a.assunto === "porte"));
  assert.match(assuntosDoNicho("fotografia", { todos: true }).find(a => a.assunto === "volume").pergunta, /ensaios/);
  assert.deepEqual(perfilDasRespostas([{ assunto: "objetivo", valor: "agenda" }, { assunto: "tamanho", valor: null }]), { objetivo: "agenda" }, "o pulado não entra no perfil");
});

test("as perguntas da conversa: as da IA na ordem dela, completadas com as do roteiro; sem a IA, as do roteiro", () => {
  const daIa = [
    { assunto: "pacotes", pergunta: "Os pacotes do Espaço Lira já têm preço?", opcoes: [{ valor: "com_preco", rotulo: "Sim", reacao: "Ótimo." }, { valor: "nao", rotulo: "Ainda não", reacao: "A gente monta junto." }] },
    { assunto: "inventado", pergunta: "?", opcoes: [{ valor: "a", rotulo: "a" }, { valor: "b", rotulo: "b" }] },
    { assunto: "pacotes", pergunta: "de novo", opcoes: [{ valor: "nao", rotulo: "x" }, { valor: "com_preco", rotulo: "y" }] },
  ];
  const lista = perguntasDaConversa("eventos", daIa);
  assert.deepEqual(lista.map(p => p.assunto), ["pacotes", "objetivo", "tamanho", "organiza", "horarios"]);
  assert.equal(lista[0].opcoes[1].reacao, "A gente monta junto.");
  assert.deepEqual(perguntasDaConversa("eventos", null).map(p => p.assunto), assuntosDoNicho("eventos").map(p => p.assunto));
  assert.match(perguntasDaConversa("eventos", null)[0].opcoes[1].reacao, /começa pela Agenda/, "sem a IA, a reação é o que o painel faz com a resposta");
  assert.match(lista[1].opcoes[0].reacao, /Atendimento/, "a que a IA não mandou também vem com a reação do roteiro");
  for (const a of assuntosDoNicho("eventos")) for (const o of a.opcoes) assert.ok(o.efeito && o.efeito.length <= 100, `${a.assunto}/${o.valor} tem o efeito`);
});

test("o que o painel manda para a IA cabe no formato que a função aceita", () => {
  assert.ok(TAREFAS.perguntas.entradaValida({ perguntas: assuntosDoNicho("eventos") }));
  for (const a of ASSUNTOS) assert.match(a.assunto, /^[a-z_]{2,30}$/);
});

test("a ordem do menu pelo objetivo, só com os módulos ligados", () => {
  const ligados = ["agenda", "atendimento", "clientes", "financeiro"];
  assert.deepEqual(ordemDoMenu("dinheiro", ligados), ["financeiro", "agenda", "atendimento", "clientes"]);
  assert.deepEqual(ordemDoMenu("pedidos", ligados, ["clientes", "agenda"]), ["atendimento", "agenda", "clientes", "financeiro"]);
  assert.deepEqual(ordemDoMenu("vender", ["agenda", "clientes"]), ["agenda", "clientes"], "sem o Atendimento ligado, nada muda");
  assert.deepEqual(ordemDoMenu(undefined, ligados, ["financeiro"]), ["financeiro", "agenda", "atendimento", "clientes"]);
});

test("o que a demo sabe: o WhatsApp da conta vale mais que o da demo; os tipos da demo vêm marcados, as sugestões não", () => {
  const c = confirmacoes({ conta: { nome: "Espaço Lira", whatsapp: "11999990000" }, dados: { whatsapp: "11888880000", regiao: "Campo Limpo", google: { nota: "4,9", total: "259" }, tipos: ["Casamento", "15 anos"] } });
  assert.equal(c.whatsapp, "11999990000");
  assert.equal(c.google, "nota 4,9 no Google, 259 avaliações");
  assert.deepEqual(confirmacoes({ conta: { nome: "X" }, dados: null }).tipos, []);
  const t = tiposParaEscolher(["Casamento", "15 anos"], [{ nome: "casamento", cor: "#111111" }, { nome: "Infantil", cor: "#222222" }]);
  assert.deepEqual(t.map(x => [x.nome, x.marcada]), [["Casamento", true], ["15 anos", true], ["Infantil", false]], "sem repetir o casamento");
});

test("os horários da Agenda numa frase: os dias seguidos juntos, só os gerais", async () => {
  const { resumoDosHorarios } = await import("../src/telas/montar/roteiro.js");
  const h = (d, i, f = null, s = null) => ({ dia_semana: d, inicio: i, fim: f, servico_id: s });
  const semana = [2, 3, 4, 5].flatMap(d => [h(d, "08:00:00"), h(d, "17:00:00")]).concat([h(6, "08:00:00"), h(6, "15:00:00"), h(2, "09:00:00", null, "x")]);
  assert.equal(resumoDosHorarios(semana), "Terça a sexta, das 8h às 17h · Sábado, das 8h às 15h");
  assert.equal(resumoDosHorarios([h(0, "11:00", "17:00"), h(6, "11:00", "17:00")]), "Sábado a domingo, das 11h às 17h");
  assert.equal(resumoDosHorarios([h(1, "09:30")]), "Segunda, às 9h30");
  assert.equal(resumoDosHorarios([]), "");
});
