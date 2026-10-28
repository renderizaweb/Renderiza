// Oferta com prazo dentro das demos de eventos (site/ofertas.mjs, site/oferta-na-demo.mjs).   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { OFERTAS, ofertaDaDemo } from "../site/ofertas.mjs";
import { comOferta } from "../site/oferta-na-demo.mjs";
import { arquivosPublicados } from "../scripts/montar-site.mjs";
import eventos from "../site/nichos/eventos.mjs";
import { existsSync } from "node:fs";

const essencial = eventos.pacotes.find(p => p.id === "essencial");

test("a oferta usa os valores da página de eventos e vale para as 16 demos até 31/10", () => {
  const [o] = OFERTAS;
  assert.equal(o.ate, "2026-10-31");
  assert.equal(o.pastas.length, 16);
  for (const p of o.pastas) assert.ok(existsSync(new URL(`../demos/${p}/index.html`, import.meta.url)), "demo existe: " + p);
  assert.equal(o.valor, essencial.inauguracao.valor);
  assert.equal(o.parcela, essencial.inauguracao.parcela);
  assert.equal(o.depois, essencial.preco.valor);
  assert.equal(ofertaDaDemo("buffet-stallieri"), o);
  assert.equal(ofertaDaDemo("otica-nina"), null);
});

test("a faixa vai logo depois do <body>, o card no fim do <main>, e tudo só uma vez", () => {
  const html = "<html><head><title>x</title></head><body class='a'><header>h</header><main><section id='s'>c</section></main><footer class=\"site-footer\">f</footer></body></html>";
  const [o] = OFERTAS;
  const com = comOferta(html, o);
  assert.match(com, /<body class='a'><a class="rz-faixa" href="#valor-do-site" data-rz-oferta data-rz-alvo="faixa">/);
  assert.match(com, /<\/section>\s*<section class="rz-oferta" id="valor-do-site" aria-label="Valor do site" data-rz-oferta data-rz-precos>/);
  assert.match(com, /<\/script><\/main><footer/);
  assert.match(com, /R\$ 399/); assert.match(com, /2x de R\$ 199/); assert.match(com, /Até 31\/10/); assert.match(com, /Depois de 31\/10, R\$ 499/);
  assert.match(com, /data-rz-faltam/);
  assert.match(com, /e\.remove\(\)/, "depois do prazo a faixa e o card saem");
  assert.equal(comOferta(com, o), com, "não põe duas vezes");
  assert.equal(comOferta(html, null), html);
  assert.equal(comOferta("<p>sem head</p>", o), "<p>sem head</p>");
});

test("build: as demos da oferta saem com o card e o contador; as outras, só com o contador", async () => {
  const lista = new Map(arquivosPublicados().map(([d, o]) => [d.split("\\").join("/"), o]));
  const html = await lista.get("demo/buffet-stallieri/index.html")();
  assert.match(html, /id="valor-do-site"/);
  assert.match(html, /data-pagina="demo" data-demo="buffet-stallieri"/);
  const outra = await lista.get("demo/otica-nina/index.html")();
  assert.doesNotMatch(outra, /valor-do-site/);
  assert.match(outra, /data-pagina="demo"/);
});

test("fotos fora da página: os mesmos bytes num arquivo por foto; ícones pequenos ficam dentro", async () => {
  const { separarFotos, TAMANHO_MINIMO } = await import("../scripts/fotos-da-demo.mjs");
  const grande = Buffer.alloc(TAMANHO_MINIMO + 10, 7).toString("base64"), pequena = Buffer.alloc(100, 1).toString("base64");
  const html = `<img src="data:image/jpeg;base64,${grande}"><div style="background:url('data:image/png;base64,${pequena}')"></div><script>const f = ["data:image/jpeg;base64,${grande}"]</script>`;
  const { html: saida, fotos } = separarFotos(html, "casa-rabello");
  assert.equal(fotos.size, 1, "a mesma foto repetida vira um arquivo só");
  const [[nome, foto]] = [...fotos];
  assert.match(nome, /^[0-9a-f]{16}\.jpg$/);
  assert.equal(foto.base64, grande, "os bytes não mudam");
  assert.equal((saida.match(new RegExp(`/demo/casa-rabello/f/${nome}`, "g")) || []).length, 2, "no <img> e no script");
  assert.match(saida, /data:image\/png;base64,/, "a pequena fica dentro");
});

test("build: a demo sai leve, com as fotos em /demo/<pasta>/f/, e a trava não consulta o banco para foto", async () => {
  const { ehArquivo } = await import("../middleware.js");
  const lista = new Map(arquivosPublicados().map(([d, o]) => [d.split("\\").join("/"), o]));
  const html = await lista.get("demo/casa-rabello/index.html")();
  assert.ok(html.length < 300000, "a página da demo fica com menos de 300 KB: " + html.length);
  const links = [...new Set(html.match(/\/demo\/casa-rabello\/f\/[0-9a-f]{16}\.(?:jpg|png|webp|gif)/g) || [])];
  assert.ok(links.length >= 10);
  for (const l of links) assert.ok(lista.has(l.slice(1)), "foto publicada: " + l);
  assert.equal(ehArquivo("/demo/casa-rabello/f/abc.jpg"), true);
  assert.equal(ehArquivo("/demo/casa-rabello/capa.jpg"), true);
  assert.equal(ehArquivo("/demo/casa-rabello"), false);
  assert.equal(ehArquivo("/demo/ana-carolina-fotografia/natal.html"), false);
  assert.equal(ehArquivo("/demo/ana-carolina-fotografia/natal"), false);
});
