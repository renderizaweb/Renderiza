// Planilha financeira sob medida (ferramentas/planilha/): a demo/proposta, a cifra da planilha do cliente e o que vai ao ar.
// A conta da planilha em si se confere no LibreOffice: python3 -I ferramentas/planilha/gerar-planilha.py <config> --conferir
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { arquivosPublicados } from "../scripts/montar-site.mjs";
import { cifrar, codigoNovo, decifrar, normalizar } from "../ferramentas/planilha/gerar-pagina.mjs";

const PASTA = "vivian-piacenti-planilha";

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

test("planilha: a demo vai ao ar com os arquivos para baixar ao lado e as fotos fora da página", () => {
  const lista = new Map(arquivosPublicados().map(([d, o]) => [d.split("\\").join("/"), o]));
  assert.ok(lista.has(`demo/${PASTA}/index.html`));
  for (const f of readdirSync(new URL(`../demos/${PASTA}/`, import.meta.url)).filter(f => /\.(xlsx|bin)$/.test(f)))
    assert.ok(lista.has(`demo/${PASTA}/${f}`), f);
  assert.ok([...lista.keys()].some(d => d.startsWith(`demo/${PASTA}/f/`) && d.endsWith(".webp")), "as imagens saem da página");
  // de outras pastas de demo, nada além do que já ia (só .xlsx/.bin a mais, e só onde existem)
  for (const d of lista.keys()) if (/^demo\/[^/]+\/[^/]+\.(xlsx|bin)$/.test(d)) assert.ok(existsSync(new URL(`../demos/${d.slice(5)}`, import.meta.url)), d);
});

test("planilha: a página da Vivian conta as visitas no lead dela, não indexa, não traz o código e aponta para arquivos que existem", async () => {
  const html = readFileSync(new URL(`../demos/${PASTA}/index.html`, import.meta.url), "utf8");
  assert.match(html, new RegExp(`<script src="/exemplos/visitas\\.js" data-pagina="demo" data-demo="${PASTA}" defer></script>`));
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.renderizaweb\.com\.br\/demo\/vivian-piacenti-fotografia\/capa\.jpg">/);
  for (const [, arquivo] of html.matchAll(new RegExp(`/demo/${PASTA}/([^"?/]+\\.(?:xlsx|bin))`, "g")))
    assert.ok(existsSync(new URL(`../demos/${PASTA}/${arquivo}`, import.meta.url)), arquivo);
  // a cifrada só aparece na página quando existe; o código nunca vai para o repositório
  const cifrada = existsSync(new URL(`../demos/${PASTA}/planilha.bin`, import.meta.url));
  assert.equal(/data-cifrada=/.test(html), cifrada);
  const codigo = new URL(`../rascunhos/planilha/${PASTA}/codigo.txt`, import.meta.url);
  if (existsSync(codigo)) assert.ok(!html.includes(readFileSync(codigo, "utf8").trim()));
  // o contador já está na página: o build não põe outro
  const { comContador } = await import("../scripts/montar-site.mjs");
  assert.equal(comContador(html, PASTA), html);
});
