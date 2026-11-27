// O kit de divulgação de quem fechou (ferramentas/kit/gerar.mjs, 20/11/2026): vai ao ar em /kit/<pasta>, fora da trava
// das demos, com o contador da demo (data-sub="kit"); cada peça tem o que baixar e o que o contador conta; as artes vão
// ao ar em /flyer/; o vídeo existe em gravacoes/. O caminho de quem abre (os eventos no contador) foi conferido num
// celular de teste ao fazer; aqui fica o que não pode quebrar.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pastaDoCaminho } from "../middleware.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kits = fs.readdirSync(path.join(RAIZ, "demos")).filter(p => fs.existsSync(path.join(RAIZ, "demos", p, "kit.json")));

test("existe pelo menos um kit (o da Rafaela) e a trava das demos não pega /kit/", () => {
  assert.ok(kits.includes("rafaela-damaceno-fotografia"));
  assert.equal(pastaDoCaminho("/kit/rafaela-damaceno-fotografia"), "", "fora de /demo: a demo desligada não derruba o kit");
});

for (const pasta of kits) {
  test(`kit de ${pasta}: a página, as peças, os textos e o contador`, async () => {
    const cfg = JSON.parse(fs.readFileSync(path.join(RAIZ, "demos", pasta, "kit.json"), "utf8"));
    const html = fs.readFileSync(path.join(RAIZ, "demos", pasta, "kit.html"), "utf8");
    assert.ok(fs.existsSync(path.join(RAIZ, "gravacoes", cfg.video)), "o vídeo existe");
    for (const peca of ["stories", "post"]) if (cfg[peca]) assert.ok(fs.existsSync(path.join(RAIZ, "flyers", `${pasta}-kit-${peca}.png`)), `a arte ${peca} existe`);
    for (const alvo of ["kit-baixou-video", "kit-baixou-flyer", "kit-baixou-post", "kit-copiou-link", "kit-ver-site", ...cfg.textos.map(t => "kit-copiou-" + t.id)])
      assert.match(html, new RegExp(`data-rz-alvo="${alvo}"`), alvo);
    for (const t of cfg.textos) assert.ok(html.includes(t.texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")), `o texto ${t.id} está na página`);
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
    const { comContador } = await import("../scripts/montar-site.mjs");
    assert.match(comContador(html, pasta, "kit"), new RegExp(`data-pagina="demo" data-demo="${pasta}" data-sub="kit"`));
  });
}
