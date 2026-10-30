// Admin · Onboarding (Missão 7, bloco G; src/admin/onboarding/logica.js): a etapa de cada conta, quando travou, os
// marcos e a mensagem pronta. Dados fictícios.
import { test } from "node:test";
import assert from "node:assert/strict";
import { etapaDaConta, marcosDaConta, funilDoOnboarding } from "../src/admin/onboarding/logica.js";

const agora = Date.parse("2026-11-05T12:00:00Z");
const h = horas => new Date(agora - horas * 3600000).toISOString();
const base = { nome: "Espaço Lira", dono: "Vivian Lira", criado_em: h(100), convite_em: h(100), marcos: {} };

test("cada etapa, na ordem, com a mensagem pelo nome e o 'travou' no tempo certo", () => {
  const c = etapaDaConta(base, agora);
  assert.deepEqual([c.id, c.travou], ["convite", true], "convite de 100 horas sem abrir: travou");
  assert.match(c.mensagem, /^Oi, Vivian!/);
  assert.equal(etapaDaConta({ ...base, convite_em: h(5) }, agora).travou, false);
  assert.equal(etapaDaConta({ ...base, link_aberto_em: h(30) }, agora).id, "link");
  assert.equal(etapaDaConta({ ...base, senha_em: h(2) }, agora).id, "senha");
  const parou = etapaDaConta({ ...base, senha_em: h(50), conversa_comecou_em: h(49), ultimo_passo_em: h(48), respondidas: 4 }, agora);
  assert.deepEqual([parou.id, parou.travou], ["conversa", true]);
  assert.match(parou.nome, /4 respondidas/);
  assert.match(etapaDaConta({ ...base, senha_em: h(3), conversa_adiada_em: h(2) }, agora).nome, /para depois/);
  const usando = etapaDaConta({ ...base, senha_em: h(80), conversa_terminou_em: h(79), marcos: { pedido: true } }, agora);
  assert.equal(usando.id, "marcos");
  assert.match(usando.nome, /1 de 5/, "a agenda online é bônus: 5 que valem");
  assert.match(usando.mensagem, /trazer as datas/, "o próximo marco que falta");
});

test("confiante: cumpriu os que valem; quem trabalha só não precisa de equipe", () => {
  const tudo = { pedido: true, reserva: true, contrato: true, equipe: false, dias_de_uso: 3 };
  const so = { ...base, senha_em: h(80), conversa_terminou_em: h(79), marcos: tudo, perfil: { tamanho: "so_eu" } };
  assert.equal(etapaDaConta(so, agora).id, "confiante");
  assert.equal(etapaDaConta({ ...so, perfil: { tamanho: "2_3" } }, agora).id, "marcos", "com equipe, falta convidar");
  assert.deepEqual(marcosDaConta(so).filter(m => m.feito).map(m => m.id), ["pedido", "reserva", "contrato", "dias"]);
});

test("o funil", () => {
  const linhas = [base, { ...base, link_aberto_em: h(3) }, { ...base, senha_em: h(3), conversa_terminou_em: h(2) }];
  assert.deepEqual(funilDoOnboarding(linhas).map(f => f.n), [3, 2, 1, 1, 0]);
});
