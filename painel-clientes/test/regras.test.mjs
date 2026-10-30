// Regras (Missão 5B): os termos e a política no ar (/termos e /privacidade, antes do app), a mesma versão nas
// páginas e na tela do aceite, os números iguais aos da página de venda, e as páginas sem script embutido.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VERSAO_DOS_TERMOS } from "../src/telas/termos.js";

const ler = c => readFileSync(new URL(c, import.meta.url), "utf8");
const termos = ler("../publico/termos/index.html");
const privacidade = ler("../publico/privacidade/index.html");

test("/termos e /privacidade abrem as páginas, antes do app, na Vercel e no servidor local", () => {
  const v = JSON.parse(ler("../vercel.json"));
  const i = d => v.rewrites.findIndex(r => r.destination === d);
  assert.ok(i("/publico/termos/index.html") >= 0 && i("/publico/privacidade/index.html") >= 0);
  assert.ok(i("/publico/termos/index.html") < i("/index.html") && i("/publico/privacidade/index.html") < i("/index.html"), "antes da regra do app");
  assert.match(ler("../scripts/servidor.mjs"), /caminho === "\/termos" \|\| caminho === "\/privacidade"/);
});

test("a mesma versão nas duas páginas e na tela do aceite", () => {
  assert.match(VERSAO_DOS_TERMOS, /^\d{4}-\d{2}-\d{2}$/);
  for (const html of [termos, privacidade]) {
    assert.equal(/data-versao="([^"]+)"/.exec(html)[1], VERSAO_DOS_TERMOS);
    const [a, m, d] = VERSAO_DOS_TERMOS.split("-");
    assert.ok(html.includes(`Versão de ${d}/${m}/${a}`), "a data escrita bate com a versão");
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, "sem script embutido (a CSP bloquearia)");
    assert.match(html, /noindex/);
    assert.doesNotMatch(html, /Rascunho em revisão|rz-doc-revisar/, "validados pela Renderiza em 30/10/2026: nada a preencher, sem etiqueta de rascunho");
  }
});

test("os termos dizem o que a página de venda e os documentos já prometem", () => {
  const venda = ler("../../exemplos/index.html");
  const [, base, inclusos, extra, acessos] = /const PRECO = \{ base: (\d+), inclusos: (\d+), extra: ([\d.]+), acessos: (\d+) \}/.exec(venda);
  assert.ok(termos.includes(`R$ ${base} por mês`) && termos.includes(`com ${inclusos} módulos`) && termos.includes(`R$ ${extra.replace(".", ",")} por mês`) && termos.includes(`até ${acessos} pessoas`));
  for (const frase of ["7 dias de graça", "90 dias", "no máximo 8 horas", "operadora", "controlador", "versão inicial", "não escreve nem revisa contrato", "Exportar tudo",
    "o site volta sozinho a mostrar a versão inicial", "cobrada à parte", "não fazem parte do site entregue", "art. 39", "art. 421-A", "art. 63"]) {
    assert.ok(termos.includes(frase), `os termos falam de: ${frase}`);
  }
  for (const frase of ["Supabase", "Vercel", "Brevo", "GitHub", "1 dia", "90 dias", "ANPD", "primeiro nome", "6 meses", "art. 7º, V", "art. 18", "art. 33"]) {
    assert.ok(privacidade.includes(frase), `a política fala de: ${frase}`);
  }
});

test("a tela do aceite leva aos dois documentos e grava a versão", () => {
  const tela = ler("../src/telas/termos.js");
  assert.match(tela, /href="\/termos"/);
  assert.match(tela, /href="\/privacidade"/);
  assert.match(tela, /termos_aceites/);
  assert.match(tela, /Li e aceito os termos de uso, e li a política de privacidade/, "a política informa: não pede consentimento");
  assert.match(ler("../src/app.js"), /situacaoDoAceite/);
});
