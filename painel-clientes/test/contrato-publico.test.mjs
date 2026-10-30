// O aceite do contrato pelo link (Missão 3, bloco E): o código do caminho, o resumo, o que conferir antes de
// mandar, o registro do aceite e o caminho /c/ na Vercel e no servidor local.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { codigoDoCaminho, linhasDoResumo, cabecaDoContrato, validarAceite, textoDoAceite, linkDoComprovante, mensagemDoErro } from "../publico/contrato/logica.js";

const festa = {
  situacao: "enviado", texto: "Contrato.", impressao: "abc",
  negocio: { nome: "Villa Alecrim", nicho: "eventos", whatsapp: "5511900000000", fuso: "America/Sao_Paulo" },
  resumo: { cliente: "Juliana & Pedro", tipo: "Casamento", pacote: "Clássico", inicio: "2026-12-12T22:00:00Z", fim: "2026-12-13T06:00:00Z",
    convidados: 150, adicionais: ["Cabine de fotos", "Mesa de doces"], valor_total: 28900, desconto: 900, sinal: 8670 },
};

test("o código vem só de /c/<código> (16 a 64 letras minúsculas e números)", () => {
  assert.equal(codigoDoCaminho("/c/0123456789abcdef0123"), "0123456789abcdef0123");
  assert.equal(codigoDoCaminho("/c/0123456789abcdef0123/"), "0123456789abcdef0123");
  assert.equal(codigoDoCaminho("/c/curto"), null);
  assert.equal(codigoDoCaminho("/c/ABCDEF0123456789abcd"), null);
  assert.equal(codigoDoCaminho("/c/0123456789abcdef/x"), null);
  assert.equal(codigoDoCaminho("/agenda"), null);
});

test("o resumo: para quem, data e horário no fuso, pacote, convidados, adicionais, valor com desconto e sinal", () => {
  assert.deepEqual(linhasDoResumo(festa), [
    ["Para", "Juliana & Pedro"],
    ["Data", "Sábado, 12 de dezembro"],
    ["Horário", "19h às 3h"],
    ["Tipo de festa", "Casamento"],
    ["Pacote", "Clássico"],
    ["Convidados", "150"],
    ["Adicionais", "Cabine de fotos, Mesa de doces"],
    ["Desconto", "R$ 900"],
    ["Valor total", "R$ 28.000"],
    ["Sinal", "R$ 8.670"],
  ]);
  const ensaio = { negocio: { nome: "Estúdio Ciranda", nicho: "fotografia" }, resumo: { tipo: "Newborn", pacote: "Newborn", valor_total: 900 } };
  assert.deepEqual(linhasDoResumo(ensaio), [["Ensaio", "Newborn"], ["Valor total", "R$ 900"]], "sem data, sem repetir o ensaio, sem sinal");
  assert.deepEqual(cabecaDoContrato(festa), { titulo: "Seu contrato com Villa Alecrim", sub: "Casamento · sábado, 12 de dezembro" });
});

test("antes de mandar: nome completo, contato e o \"li e aceito\"", () => {
  assert.deepEqual(validarAceite({ nome: "Juliana Souza", contato: "(11) 98888-7777", li: true }), {});
  assert.deepEqual(Object.keys(validarAceite({ nome: " J ", contato: "123", li: false })), ["nome", "contato", "li"]);
  assert.deepEqual(Object.keys(validarAceite({ nome: "1234", contato: "juliana@cliente.teste", li: true })), ["nome"], "nome sem letra");
});

test("o registro do aceite, o comprovante pelo WhatsApp e os erros do banco", () => {
  const aceito = { ...festa, situacao: "aceito", aceito_em: "2026-10-30T17:32:00Z", aceito_nome: "Juliana Souza" };
  assert.equal(textoDoAceite(aceito), "Aceito em sexta, 30 de outubro, às 14h32, por Juliana Souza.");
  assert.equal(textoDoAceite(festa), "");
  const link = linkDoComprovante(aceito);
  assert.match(link, /^https:\/\/wa\.me\/5511900000000\?text=/);
  assert.match(decodeURIComponent(link), /Aqui é Juliana\. Aceitei o contrato do espaço Villa Alecrim/);
  assert.equal(linkDoComprovante({ ...aceito, negocio: { ...aceito.negocio, whatsapp: null } }), "", "sem número, sem link");
  assert.match(mensagemDoErro({ erro: "mudou" }), /atualizado/);
  assert.match(mensagemDoErro({ erro: "dados", campo: "contato" }), /WhatsApp ou e-mail/);
  assert.match(mensagemDoErro(null), /internet/);
});

test("/c/<código> abre a página do contrato na Vercel (antes do app) e no servidor local", () => {
  const v = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(v.rewrites[0], { source: "/c/:codigo", destination: "/publico/contrato/index.html" });
  assert.match(readFileSync(new URL("../scripts/servidor.mjs", import.meta.url), "utf8"), /publico", "contrato", "index\.html"/);
  const html = readFileSync(new URL("../publico/contrato/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, "sem script embutido (a CSP bloquearia)");
  assert.match(html, /noindex/);
});
