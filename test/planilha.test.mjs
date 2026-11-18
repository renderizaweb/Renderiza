// Planilha financeira sob medida (ferramentas/planilha/): a página da proposta, a cifra da planilha dela e o que vai ao ar.
// A conta da planilha em si se confere no LibreOffice: python3 -I ferramentas/planilha/gerar-planilha.py <config> --conferir
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { arquivosPublicados } from "../scripts/montar-site.mjs";
import { cifrar, codigoNovo, decifrar, normalizar } from "../ferramentas/planilha/gerar-pagina.mjs";

test("planilha: a cifra volta igual com o código, com ou sem tracinho e em minúsculas", async () => {
  const dados = Buffer.from("PK\u0003\u0004 planilha de mentira");
  const codigo = codigoNovo();
  assert.match(codigo, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  const pacote = await cifrar(dados, codigo, 1000);
  assert.equal(pacote.toString("ascii", 0, 4), "RZP1");
  assert.ok(!pacote.includes(dados), "o arquivo não pode aparecer em claro");
  assert.ok((await decifrar(pacote, codigo.toLowerCase().replace("-", " "))).equals(dados));
  await assert.rejects(decifrar(pacote, "ABCD-2345"));
  assert.equal(normalizar(" ab-cd 23 45 "), "ABCD2345");
});

test("planilha: as propostas vão ao ar com os arquivos ao lado, só os tipos permitidos", () => {
  const destinos = arquivosPublicados().map(([d]) => d.split("\\").join("/")).filter(d => d.startsWith("proposta/"));
  for (const pasta of readdirSync(new URL("../propostas/", import.meta.url), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name)) {
    const daPasta = destinos.filter(d => d.startsWith(`proposta/${pasta}/`));
    assert.ok(daPasta.length > 0, pasta);
    for (const d of daPasta) assert.match(d, /\.(webp|jpg|png|svg|xlsx|bin)$/, d);
  }
});

test("planilha: a página da Vivian conta as visitas, não indexa, não traz o código e aponta para arquivos que existem", () => {
  const pasta = "vivian-piacenti-fotografia";
  const html = readFileSync(new URL(`../propostas/${pasta}.html`, import.meta.url), "utf8");
  assert.match(html, new RegExp(`<script src="/exemplos/visitas\\.js" data-pagina="demo" data-demo="${pasta}" data-sub="planilha" defer></script>`));
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  for (const [, arquivo] of html.matchAll(new RegExp(`/proposta/${pasta}/([^"?]+)`, "g")))
    assert.ok(existsSync(new URL(`../propostas/${pasta}/${arquivo}`, import.meta.url)), arquivo);
  // a cifrada só aparece na página quando existe; o código nunca vai para o repositório
  const cifrada = existsSync(new URL(`../propostas/${pasta}/planilha.bin`, import.meta.url));
  assert.equal(/data-cifrada=/.test(html), cifrada);
  const codigo = new URL(`../rascunhos/planilha/codigo-${pasta}.txt`, import.meta.url);
  if (existsSync(codigo)) assert.ok(!html.includes(readFileSync(codigo, "utf8").trim()));
});
