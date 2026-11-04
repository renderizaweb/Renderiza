// Cliente fechou (docs/fechamento.md): a demo vira site pelo virar-site.mjs e a conferência barra o que é só da demo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { conferirHtml, conferirSite, textoVisivel, relatorio } from "../scripts/conferir-site.mjs";

const SITE = `<!doctype html><html lang="pt-BR"><head><title>Clínica</title>
<link rel="canonical" href="https://clinica.com.br/">
<meta name="description" content="Clínica em Itapevi.">
<meta property="og:image" content="https://clinica.com.br/og.jpg"></head>
<body><img src="/img/capa-1.webp" alt="Capa"><a href="https://wa.me/5511987558202">WhatsApp</a></body></html>`;
const existe = f => f === "img/capa-1.webp";

test("conferência: site limpo passa sem problema nem aviso", () => {
  assert.deepEqual(conferirHtml(SITE, { dominio: "clinica.com.br", existe }), { problemas: [], avisos: [] });
  assert.equal(relatorio({ problemas: [], avisos: [] }), "Conferência: tudo certo.");
});

test("conferência: barra o que é só da demo", () => {
  const casos = [
    ['<script src="/exemplos/visitas.js" data-pagina="demo" data-demo="ms" defer></script>', /rastreio/],
    ['<section class="rz-oferta" id="valor-do-site" data-rz-oferta></section>', /card de valor/],
    ['<a href="https://www.renderizaweb.com.br/demo/ms-odontologia">ver</a>', /link para a demo/],
    ['<meta name="robots" content="noindex,nofollow">', /noindex/],
    ['<div class="equipe-vazio"><span>Espaço reservado para a foto de toda a equipe</span></div>', /Espaço reservado/],
    ['<img src="/img/equipe.webp" alt="Equipe">', /img\/equipe\.webp/],
  ];
  for (const [trecho, esperado] of casos) {
    const { problemas } = conferirHtml(SITE.replace("</body>", trecho + "</body>"), { dominio: "clinica.com.br", existe });
    assert.equal(problemas.length, 1, trecho);
    assert.match(problemas[0], esperado);
  }
  assert.match(conferirHtml(SITE, { dominio: "outro.com.br", existe }).problemas[0], /canonical/);
});

test("conferência: texto provisório só no que aparece (não no CSS, script ou comentário)", () => {
  const html = `<style>.x::after{content:"placeholder"}</style><!-- TODO trocar --><script>const a = "a definir";</script><p>Oi</p>`;
  assert.equal(textoVisivel(html), "Oi");
  assert.equal(textoVisivel('<p>Oi</p><img src="/img/a.webp" alt="Foto a definir">'), "Oi Foto a definir");
  assert.deepEqual(conferirHtml(SITE.replace("</body>", html + "</body>"), { dominio: "clinica.com.br", existe }).problemas, []);  // "para definir" é texto normal, não "a definir"
  assert.deepEqual(conferirHtml(SITE.replace("</body>", "<p>Análise cuidadosa para definir as etapas.</p></body>"), { dominio: "clinica.com.br", existe }).problemas, []);
  assert.equal(conferirHtml(SITE.replace("</body>", "<p>Horário a definir</p></body>"), { dominio: "clinica.com.br", existe }).problemas.length, 1);
});

test("conferência: avisos (sem descrição, sem WhatsApp, foto embutida, prévia em WebP, 'em breve')", () => {
  const html = SITE.replace(/<meta name="description"[^>]*>/, "").replace(/<a href="https:\/\/wa\.me[^<]*<\/a>/, "<p>Em breve, nova unidade</p>")
    .replace("og.jpg", "img/capa-1.webp").replace("</body>", `<div style="background:url(data:image/webp;base64,${"A".repeat(6000)})"></div></body>`);
  const { problemas, avisos } = conferirHtml(html, { dominio: "clinica.com.br", existe });
  assert.deepEqual(problemas, []);
  assert.equal(avisos.length, 5, avisos.join("\n"));
  // ícone em SVG embutido não pesa: sem aviso
  assert.deepEqual(conferirHtml(SITE.replace("</head>", `<link rel="icon" href="data:image/svg+xml,%3Csvg%3E">\n</head>`), { dominio: "clinica.com.br", existe }).avisos, []);
});

/** Demo mínima em uma pasta temporária (index.html + site.json). Foto de mentira: a prévia fica como está. */
function demo({ extra = "", siteJson = {} } = {}) {
  const pasta = mkdtempSync(join(tmpdir(), "fechamento-"));
  mkdirSync(join(pasta, "demo"));
  const foto = Buffer.alloc(40 * 1024, 7).toString("base64");
  writeFileSync(join(pasta, "demo", "index.html"), `<!doctype html><html lang="pt-BR"><head>
  <meta charset="utf-8">
  <title>Clínica Teste</title>
  <meta name="description" content="Clínica de teste.">
  <meta name="robots" content="noindex">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle r='9'/%3E%3C/svg%3E">
</head><body>
  <img src="data:image/png;base64,${Buffer.alloc(200, 1).toString("base64")}" alt="">
  <img src="data:image/png;base64,${foto}" alt="Capa da clínica">
  <a href="https://wa.me/5511900000000">WhatsApp</a>${extra}
</body></html>`);
  writeFileSync(join(pasta, "demo", "site.json"), JSON.stringify({ dominio: "clinica-teste.com.br", nome: "Clínica Teste", ...siteJson }));
  return pasta;
}
const virar = pasta => spawnSync("node", ["scripts/virar-site.mjs", join(pasta, "demo"), join(pasta, "site")], { encoding: "utf8", env: { ...process.env, PATH: process.env.PATH } });

test("virar-site: tira o noindex da demo, fica um ícone só (o da demo, sem favicon no site.json) e a prévia sai da capa", () => {
  const pasta = demo();
  const r = virar(pasta);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Conferência: tudo certo|Sem problemas/);
  const html = readFileSync(join(pasta, "site", "index.html"), "utf8");
  assert.doesNotMatch(html, /noindex/);
  assert.equal(html.match(/rel="icon"/g).length, 1);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg"/);
  assert.match(readFileSync(join(pasta, "site", "favicon.svg"), "utf8"), /<circle r='9'\/>/);
  // a primeira <img> (200 bytes) é ícone: a prévia vem da capa, como og.jpg ou, sem como recortar, a foto da capa
  const og = html.match(/<meta property="og:image" content="https:\/\/clinica-teste\.com\.br\/([^"]+)"/)[1];
  assert.ok(og === "og.jpg" || /^img\/capa-da-clinica-/.test(og), og);
  assert.ok(existsSync(join(pasta, "site", "robots.txt")));
});

test("virar-site: com favicon no site.json, vale o dele; texto provisório sai com código 1 e o motivo", () => {
  const pasta = demo({ extra: "<p>Espaço reservado para a foto da equipe</p>", siteJson: { favicon: { texto: "CT", cor: "#004c47" } } });
  const r = virar(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /✗ Texto provisório na página: "Espaço reservado"/);
  assert.match(readFileSync(join(pasta, "site", "favicon.svg"), "utf8"), />CT<\/text>/);
});

test("virar-site: sem domínio no site.json, para e diz o que falta", () => {
  const pasta = demo({ siteJson: { dominio: "" } });
  const r = virar(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /falta o "dominio"/);
  assert.ok(!existsSync(join(pasta, "site")));
});

test("conferirSite: pasta sem os arquivos do virar-site", () => {
  const pasta = mkdtempSync(join(tmpdir(), "fechamento-vazio-"));
  writeFileSync(join(pasta, "index.html"), SITE);
  const { problemas } = conferirSite(pasta);
  assert.ok(problemas.some(p => /Falta o arquivo robots\.txt/.test(p)));
  assert.ok(problemas.some(p => /img\/capa-1\.webp/.test(p)));
});
