// Mensagem pronta de WhatsApp: modelo, link com o texto e renovação da demo no envio.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mensagemPadrao, linkCompletoDaDemo, linkWhatsappComTexto, renovarParaEnvio, REMETENTE } from "../painel/src/mensagem.js";

test("o link da demo sai completo, sempre com www", () => {
  assert.equal(linkCompletoDaDemo("/demo/otica-flash"), "https://www.renderizaweb.com.br/demo/otica-flash");
  assert.equal(linkCompletoDaDemo("renderizaweb.com.br/demo/otica-nina"), "https://www.renderizaweb.com.br/demo/otica-nina");
  assert.equal(linkCompletoDaDemo("https://www.renderizaweb.com.br/demo/x"), "https://www.renderizaweb.com.br/demo/x");
  assert.equal(linkCompletoDaDemo("https://exemplo.com/a"), "https://exemplo.com/a");
  assert.equal(linkCompletoDaDemo(""), "");
});

test("o modelo assina, traz um link só (o da demo) e a linha do site da loja", () => {
  const m = mensagemPadrao({ empresa: "Ótica Flash", link_demo: "/demo/otica-flash" });
  assert.match(m, new RegExp(`^Oi, tudo bem\\? Aqui é a ${REMETENTE}, da Renderiza\\.`));
  assert.equal((m.match(/https?:\/\//g) || []).length, 1);
  assert.match(m, /\nhttps:\/\/www\.renderizaweb\.com\.br\/demo\/otica-flash\n/);
  assert.match(m, /É o site da Ótica Flash, com as fotos e as avaliações de vocês\./);
  assert.match(mensagemPadrao({ empresa: "X", link_demo: "/demo/x" }, { detalhe: "desde 1978" }), /É o site da X, desde 1978\./);
});

test("o link do WhatsApp abre a conversa com o texto, sem enviar", () => {
  assert.equal(linkWhatsappComTexto("(21) 97222-9344", "Oi\nlink: a&b"), "https://wa.me/5521972229344?text=Oi%0Alink%3A%20a%26b");
  assert.equal(linkWhatsappComTexto("+55 11 95086-9345", "Oi"), "https://wa.me/5511950869345?text=Oi");
  assert.equal(linkWhatsappComTexto("", "Oi"), "");
  assert.equal(linkWhatsappComTexto("(11) 99999-9999", "  "), "");
});

test("no envio, a demo fica no ar 7 dias a partir de hoje (se já não ficar)", () => {
  const hoje = "2026-10-08";
  assert.deepEqual(renovarParaEnvio({ no_ar: true, vale_ate: "2026-10-13" }, hoje), { no_ar: true, vale_ate: "2026-10-15" });
  assert.deepEqual(renovarParaEnvio({ no_ar: false, vale_ate: "2026-10-30" }, hoje), { no_ar: true, vale_ate: "2026-10-30" });
  assert.deepEqual(renovarParaEnvio({ no_ar: false, vale_ate: "2026-10-01" }, hoje), { no_ar: true, vale_ate: "2026-10-15" });
  assert.deepEqual(renovarParaEnvio({ no_ar: false, vale_ate: null }, hoje), { no_ar: true, vale_ate: null });
  assert.equal(renovarParaEnvio({ no_ar: true, vale_ate: "2026-10-20" }, hoje), null);
  assert.equal(renovarParaEnvio({ no_ar: true, vale_ate: null }, hoje), null);
  assert.equal(renovarParaEnvio(null, hoje), null);
});
