// Formatos (src/ui/formatos.js) e palavras por nicho (src/nichos/).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as f from "../src/ui/formatos.js";
import { nicho, nomeDoModulo, NICHOS } from "../src/nichos/index.js";

test("datas e horas no fuso da conta, não no do aparelho", () => {
  const t = new Date("2026-10-31T22:30:00Z"); // 19h30 em São Paulo
  assert.equal(f.dataCurta(t), "sáb, 31/10");
  assert.equal(f.dataLonga(t), "sábado, 31 de outubro");
  assert.equal(f.dataNumerica(t), "31/10/2026");
  assert.equal(f.hora(t), "19h30");
  assert.equal(f.hora(new Date("2026-10-31T22:00:00Z")), "19h");
  assert.equal(f.dia(new Date("2026-11-01T02:00:00Z")), "2026-10-31", "23h em São Paulo ainda é dia 31");
  assert.equal(f.dia(new Date("2026-11-01T02:00:00Z"), "UTC"), "2026-11-01");
  assert.equal(f.instanteNoFuso("2026-10-31", "19:30").toISOString(), "2026-10-31T22:30:00.000Z");
  assert.equal(f.instanteNoFuso("2026-07-10", "08:00", "America/Manaus").toISOString(), "2026-07-10T12:00:00.000Z");
  assert.equal(f.somarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(f.horaDoTexto("09:00"), "9h");
  assert.equal(f.horaDoTexto("19:30"), "19h30");
});

test("quanto falta e quanto faz", () => {
  const agora = Date.parse("2026-10-29T15:00:00Z");
  assert.equal(f.haQuanto(agora - 5 * 60000, agora), "há 5 min");
  assert.equal(f.haQuanto(agora - 3 * 3600e3, agora), "há 3 h");
  assert.equal(f.haQuanto(agora - 26 * 3600e3, agora), "ontem");
  assert.equal(f.emQuanto("2026-10-29T23:00:00Z", undefined, agora), "hoje");
  assert.equal(f.emQuanto("2026-10-30T15:00:00Z", undefined, agora), "amanhã");
  assert.equal(f.emQuanto("2026-11-02T15:00:00Z", undefined, agora), "em 4 dias");
});

test("valores", () => {
  assert.equal(f.moeda(1900), "R$ 1.900");
  assert.equal(f.moeda(14.99), "R$ 14,99");
  assert.equal(f.moeda(26500, { centavos: true }), "R$ 26.500,00");
  assert.equal(f.moeda(null), "");
  assert.equal(f.lerValor("1.900"), 1900);
  assert.equal(f.lerValor("R$ 1.900,50"), 1900.5);
  assert.equal(f.lerValor("14,99"), 14.99);
  assert.equal(f.lerValor("750"), 750);
  assert.equal(f.lerValor("abc"), null);
  assert.equal(f.lerValor("-5"), null);
});

test("WhatsApp: igual ao banco", () => {
  assert.equal(f.normalizarWhatsapp("+55 (11) 98888-7777"), "11988887777");
  assert.equal(f.normalizarWhatsapp("(55) 99999-1234"), "55999991234", "DDD 55 (RS) não perde o 55");
  assert.equal(f.normalizarWhatsapp(""), null);
  assert.equal(f.telefone("11988887777"), "(11) 98888-7777");
  assert.equal(f.telefone("1133334444"), "(11) 3333-4444");
  assert.ok(f.whatsappValido("(11) 98888-7777"));
  assert.ok(!f.whatsappValido("9888"));
  assert.equal(f.linkWhatsapp("(11) 98888-7777", "Oi, tudo bem?"), "https://wa.me/5511988887777?text=Oi%2C%20tudo%20bem%3F");
});

test("iniciais", () => {
  assert.equal(f.iniciais("Juliana & Pedro"), "JP");
  assert.equal(f.iniciais("Theo, 5 anos"), "TA");
  assert.equal(f.iniciais("Maria da Silva"), "MS");
  assert.equal(f.iniciais(""), "?");
});

test("palavras por nicho", () => {
  assert.equal(nicho("eventos").palavras.reserva, "festa");
  assert.equal(nicho("fotografia").palavras.reserva, "ensaio");
  assert.equal(nicho("nao-existe").id, "eventos");
  assert.equal(nomeDoModulo("fotografia", "clientes", "Clientes"), "Clientes e entregas");
  assert.equal(nomeDoModulo("eventos", "inicio", "Início"), "Início");
  // os dois nichos têm as mesmas chaves (um nicho novo é só mais um arquivo)
  const chaves = o => Object.keys(o).sort().join(",");
  assert.equal(chaves(NICHOS.eventos), chaves(NICHOS.fotografia));
  assert.equal(chaves(NICHOS.eventos.palavras), chaves(NICHOS.fotografia.palavras));
  assert.equal(chaves(NICHOS.eventos.modulos), chaves(NICHOS.fotografia.modulos));
});
