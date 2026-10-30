// Admin (Missão 5A): a situação da conta em palavras, os grupos e a busca, o código público, a mensalidade
// sugerida, os pagamentos do mês, o aparelho e o "usando agora". E a casca do Admin no registro das partes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoDaConta, chipsDeContas, filtrarContas, codigoDoNome, codigoValido, mensalidadeSugerida, pagamentosDoMes, somarMeses, nomeDoMes, aparelho, usandoAgora, prazoAte, ultimoAcesso } from "../src/admin/logica.js";
import { AREAS_ADMIN } from "../src/admin/index.js";

const agora = new Date("2026-10-30T15:00:00Z");

test("a conta em palavras: teste, teste acabou, ativa com e sem prazo, prazo vencido, desligada", () => {
  assert.deepEqual(estadoDaConta({ situacao: "teste", teste_ate: "2026-11-02T15:00:00Z" }, agora), { nome: "Em teste", tom: "destaque", sub: "teste até 02/11/2026 (3 dias)", liberada: true });
  assert.equal(estadoDaConta({ situacao: "teste", teste_ate: "2026-10-30T20:00:00Z" }, agora).sub, "teste até 30/10/2026 (último dia)");
  assert.deepEqual(estadoDaConta({ situacao: "teste", teste_ate: "2026-10-20T15:00:00Z" }, agora), { nome: "Teste acabou", tom: "alerta", sub: "o teste acabou em 20/10/2026", liberada: false });
  assert.equal(estadoDaConta({ situacao: "ativa", ativa_ate: null }, agora).sub, "sem prazo");
  assert.equal(estadoDaConta({ situacao: "ativa", ativa_ate: "2026-12-31" }, agora).sub, "até 31/12/2026");
  assert.equal(estadoDaConta({ situacao: "ativa", ativa_ate: "2026-10-30" }, agora).liberada, true, "o último dia ainda vale");
  assert.deepEqual(estadoDaConta({ situacao: "ativa", ativa_ate: "2026-10-01" }, agora), { nome: "Prazo venceu", tom: "alerta", sub: "o prazo venceu em 01/10/2026", liberada: false });
  assert.equal(estadoDaConta({ situacao: "desligada" }, agora).nome, "Desligada");
});

test("grupos e busca: para aprovar é o cadastro em teste; a Renderiza busca pelo e-mail do dono", () => {
  const contas = [
    { id: "a", nome: "Villa Alecrim", codigo: "villa-alecrim", situacao: "ativa", origem: "renderiza", criado_em: "2026-10-01", donos: [{ nome: "Marina", email: "marina@villa.teste" }] },
    { id: "b", nome: "Estúdio Ciranda", codigo: "estudio-ciranda", situacao: "teste", origem: "cadastro", criado_em: "2026-10-20", donos: [] },
    { id: "c", nome: "Espaço de teste", codigo: "espaco-teste", situacao: "teste", origem: "renderiza", criado_em: "2026-10-25", donos: [] },
    { id: "d", nome: "Chácara Sol", codigo: "chacara-sol", situacao: "desligada", origem: "cadastro", criado_em: "2026-09-01", donos: [] },
  ];
  assert.deepEqual(chipsDeContas(contas).map(c => [c.valor, c.quantos]), [["aprovar", 1], ["ativas", 1], ["teste", 1], ["desligadas", 1], ["todas", 4]]);
  assert.deepEqual(filtrarContas(contas).map(c => c.id), ["c", "b", "a", "d"], "as mais novas primeiro");
  assert.deepEqual(filtrarContas(contas, { busca: "marina@" }).map(c => c.id), ["a"]);
  assert.deepEqual(filtrarContas(contas, { busca: "estudio" }).map(c => c.id), ["b"], "sem acento");
  assert.deepEqual(filtrarContas(contas, { grupo: "aprovar" }).map(c => c.id), ["b"]);
});

test("o código público sai do nome e passa na regra do banco", () => {
  assert.equal(codigoDoNome("Villa Alecrim"), "villa-alecrim");
  assert.equal(codigoDoNome("Estúdio & Cia. Ciranda!"), "estudio-e-cia-ciranda");
  assert.equal(codigoDoNome("Jô"), "jo-conta");
  assert.ok(codigoValido(codigoDoNome("Um nome muito comprido demais para caber num código de quarenta letras")));
  assert.ok(!codigoValido("-comeca") && !codigoValido("Maiuscula") && !codigoValido("ab") && codigoValido("abc"));
});

test("a mensalidade sugerida: R$ 49 com 2 módulos, e cada um a mais pelo preço dele", () => {
  const catalogo = [{ id: "agenda", preco: "14.99" }, { id: "clientes", preco: "14.99" }, { id: "financeiro", preco: "14.99" }, { id: "meu-site", preco: "19.90" }];
  assert.equal(mensalidadeSugerida(["agenda", "clientes"], catalogo), 49);
  assert.equal(mensalidadeSugerida(["agenda"], catalogo), 49);
  assert.equal(mensalidadeSugerida(["agenda", "clientes", "financeiro"], catalogo), 63.99);
  assert.equal(mensalidadeSugerida(["agenda", "clientes", "financeiro", "meu-site"], catalogo), 78.98, "os mais caros entram no plano");
});

test("os pagamentos do mês: ativas pagam; quem falta vem primeiro; desligada só aparece se pagou", () => {
  const contas = [{ id: "a", nome: "Bela Festa", situacao: "ativa" }, { id: "b", nome: "Arco", situacao: "ativa" }, { id: "c", nome: "Teste", situacao: "teste" }, { id: "d", nome: "Saiu", situacao: "desligada" }];
  const pagamentos = [{ conta_id: "a", mes: "2026-10-01", valor: "49.00" }, { conta_id: "a", mes: "2026-10-01", valor: "14.99" }, { conta_id: "d", mes: "2026-10-01", valor: "49.00" }, { conta_id: "b", mes: "2026-09-01", valor: "49.00" }];
  const linhas = pagamentosDoMes(contas, pagamentos, "2026-10-01");
  assert.deepEqual(linhas.map(l => [l.conta.id, l.pago]), [["b", 0], ["a", 63.99], ["d", 49]]);
  assert.equal(somarMeses("2026-12-01", 1), "2027-01-01");
  assert.equal(somarMeses("2026-01-01", -1), "2025-12-01");
  assert.equal(nomeDoMes("2026-10-01"), "outubro de 2026");
});

test("prazo, aparelho, usando agora e último acesso", () => {
  assert.equal(prazoAte("sem", "2026-10-30"), null);
  assert.equal(prazoAte("30", "2026-10-30"), "2026-11-29");
  assert.equal(prazoAte("2027-01-15", "2026-10-30"), "2027-01-15");
  assert.equal(aparelho("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari/604.1"), "Safari no iPhone");
  assert.equal(aparelho("Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537"), "Chrome no Windows");
  assert.equal(aparelho(""), "");
  const t = Date.parse("2026-10-30T15:00:00Z");
  assert.ok(usandoAgora("2026-10-30T14:50:00Z", t) && !usandoAgora("2026-10-30T14:40:00Z", t) && !usandoAgora(null, t));
  assert.equal(ultimoAcesso([null], t), "nunca entrou");
});

test("as partes do Admin têm ícone e caminho", () => {
  assert.deepEqual(AREAS_ADMIN.map(a => a.id), ["contas", "onboarding", "modulos", "pessoas", "pagamentos", "indicadores"]);
  assert.ok(AREAS_ADMIN.every(a => a.icone && a.nome && typeof a.carregar === "function"));
});
