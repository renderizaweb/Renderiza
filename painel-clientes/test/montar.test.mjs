// A conversa de boas-vindas (Missão 7, bloco E; src/telas/montar/roteiro.js): o roteiro fixo, o que a demo já sabe,
// o perfil e a ordem do menu pelo objetivo. Dados fictícios.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ASSUNTOS, assuntosDoNicho, restantes, proximaFixa, perfilDasRespostas, ordemDoMenu, confirmacoes, tiposParaEscolher } from "../src/telas/montar/roteiro.js";
import { TAREFAS } from "../supabase/functions/assistente/logica.js";

test("o roteiro: o porte é só dos eventos; a pergunta no jeito do nicho; o que falta e a próxima sem a IA", () => {
  assert.ok(assuntosDoNicho("eventos").some(a => a.assunto === "porte"));
  assert.ok(!assuntosDoNicho("fotografia").some(a => a.assunto === "porte"));
  assert.match(assuntosDoNicho("fotografia").find(a => a.assunto === "volume").pergunta, /ensaios/);
  const respostas = [{ assunto: "quem", valor: "dono" }, { assunto: "objetivo", valor: null }];
  assert.equal(restantes("eventos", respostas).length, ASSUNTOS.length - 2, "respondido ou pulado, sai");
  assert.equal(proximaFixa("eventos", respostas).assunto, "tamanho");
  assert.equal(proximaFixa("eventos", ASSUNTOS.map(a => ({ assunto: a.assunto, valor: "x" }))), null);
  assert.deepEqual(perfilDasRespostas(respostas), { quem: "dono" }, "o pulado não entra no perfil");
});

test("o que o painel manda para a IA cabe no formato que a função aceita", () => {
  const entrada = { respostas: [{ assunto: "quem", pergunta: "Quem?", resposta: "Sou a dona" }], restantes: restantes("eventos", []) };
  assert.ok(TAREFAS.proxima_pergunta.entradaValida(entrada));
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
