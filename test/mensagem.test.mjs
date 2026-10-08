// Mensagem pronta de WhatsApp: modelo, link com o texto e renovação da demo no envio.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mensagensPadrao, separarMensagens, juntarMensagens, linkCompletoDaDemo, linkWhatsappComTexto, renovarParaEnvio, REMETENTE } from "../painel/src/mensagem.js";

test("o link da demo sai completo, sempre com www", () => {
  assert.equal(linkCompletoDaDemo("/demo/otica-flash"), "https://www.renderizaweb.com.br/demo/otica-flash");
  assert.equal(linkCompletoDaDemo("renderizaweb.com.br/demo/otica-nina"), "https://www.renderizaweb.com.br/demo/otica-nina");
  assert.equal(linkCompletoDaDemo("https://www.renderizaweb.com.br/demo/x"), "https://www.renderizaweb.com.br/demo/x");
  assert.equal(linkCompletoDaDemo("https://exemplo.com/a"), "https://exemplo.com/a");
  assert.equal(linkCompletoDaDemo(""), "");
});

test("o modelo vem em etapas: abrir sem link, prévia e retomada com um link só", () => {
  const m = mensagensPadrao({ empresa: "Ótica Flash", link_demo: "/demo/otica-flash", segmento: "Ótica" }, { detalhe: "a foto de vocês na porta da loja" });
  assert.equal(m.abrir, "Oi, tudo bem? É da Ótica Flash? Com quem eu falo?");
  for (const k of ["previa", "retomar"]) {
    assert.equal((m[k].match(/https?:\/\//g) || []).length, 1, k);
    assert.match(m[k], /\nhttps:\/\/www\.renderizaweb\.com\.br\/demo\/otica-flash\n/);
    assert.match(m[k], new RegExp(`Aqui é a ${REMETENTE}, da Renderiza`));
    assert.doesNotMatch(m[k], /clique|acesse|aproveite|promo|R\$|grátis|últimos dias/i);
  }
  assert.match(m.previa, /sites para óticas de bairro/);
  assert.match(m.previa, /gostei muito de ver a foto de vocês na porta da loja\./);
  assert.match(m.retomar, /para a Ótica Flash, com a foto de vocês na porta da loja\./);
  assert.match(mensagensPadrao({ empresa: "Sauddá", link_demo: "/demo/s", segmento: "Odontologia" }).previa, /clínicas e consultórios/);
});

test("as etapas vão juntas num campo só, separadas por ---", () => {
  const m = { abrir: "Oi?", previa: "Prazer!\nlink", retomar: "Oi de novo" };
  const t = juntarMensagens(m);
  assert.equal(t, "Oi?\n\n---\n\nPrazer!\nlink\n\n---\n\nOi de novo");
  assert.deepEqual(separarMensagens(t), m);
  assert.deepEqual(separarMensagens("Texto antigo, sem etapas"), { abrir: "", previa: "Texto antigo, sem etapas", retomar: "" });
  assert.deepEqual(separarMensagens("a\n---\nb"), { abrir: "a", previa: "b", retomar: "" });
  assert.equal(juntarMensagens({ abrir: "", previa: "", retomar: "" }), "");
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
