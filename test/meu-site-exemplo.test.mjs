// O Meu site de exemplo (/exemplos/meu-site-fotografia): o painel de verdade (a cópia em exemplos/painel/src) sobre o
// banco de mentira, editando o site de exemplo do Estúdio Ciranda (/exemplos/site-fotografia). Aqui: a cópia do
// painel em dia, o site de exemplo inteiro (caminhos, noindex, selo, conteúdo inicial válido) e, num Chromium com o
// repositório servido como www.renderizaweb.com.br, o caminho de quem testa: pôr o preço de um ensaio, publicar, o
// site mostrar; trocar a foto da capa; e o menu do resto do painel avisando em vez de sair da página.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { diferencas } from "../ferramentas/exemplos/painel-de-verdade.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(RAIZ, "exemplos", "site-fotografia");
const ORIGEM = "https://www.renderizaweb.com.br";
const lib = (() => { const m = { exports: {} }; new Function("module", fs.readFileSync(path.join(RAIZ, "ferramentas/meu-site/meu-site.js"), "utf8"))(m); return m.exports; })();

let playwright = null;
try { playwright = createRequire(import.meta.url)("playwright"); } catch { /* sem navegador */ }
const comNavegador = { skip: playwright ? false : "sem o Playwright" };

const TIPO = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp" };
/** O arquivo que a Renderiza serve num caminho (como o montar-site.mjs e o vercel.json: cleanUrls e o rewrite das miniaturas). */
function arquivo(caminho) {
  const p = caminho.replace(/^\/exemplos\/site-fotografia\/exemplos\/site-fotografia\//, "/exemplos/site-fotografia/");
  if (p.startsWith("/fontes/") || p === "/favicon.svg") return path.join(RAIZ, "site", "estatico", p);
  let f = path.join(RAIZ, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
  return f;
}

let navegador;
before(async () => { if (playwright) navegador = await playwright.chromium.launch(); });
after(async () => { await navegador?.close(); });

async function abrir(caminho = "/exemplos/meu-site-fotografia") {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
  const erros = [], faltou = [];
  await ctx.route("**/*", rota => {
    const u = new URL(rota.request().url());
    if (u.origin === ORIGEM) {
      if (u.pathname.startsWith("/api/visita")) return rota.fulfill({ status: 204, body: "" });
      const f = arquivo(u.pathname);
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { faltou.push(u.pathname); return rota.fulfill({ status: 404, body: "" }); }
      return rota.fulfill({ status: 200, contentType: TIPO[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
    }
    if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return rota.fulfill({ status: 200, contentType: "text/css", body: "" });
    return rota.abort();
  });
  const pagina = await ctx.newPage();
  pagina.on("pageerror", e => erros.push(e.message));
  ctx.on("page", p => p.on("pageerror", e => erros.push(e.message)));
  await pagina.goto(ORIGEM + caminho);
  return { ctx, pagina, erros, faltou };
}

test("a cópia do painel nos exemplos está igual ao painel (senão: node ferramentas/exemplos/painel-de-verdade.mjs)", () => {
  assert.deepEqual(diferencas(), []);
});

test("o site de exemplo: tudo dentro de /exemplos/site-fotografia, noindex, selo e o Meu site do exemplo", () => {
  for (const p of ["index.html", "natal.html"]) {
    const html = fs.readFileSync(path.join(SITE, p), "utf8");
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/, p);
    assert.match(html, /id="rz-exemplo-selo"/, p);
    assert.ok(!/https:\/\/estudiociranda\.exemplo/.test(html), p + ": nada do domínio de mentira");
    for (const [, u] of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)) {
      if (u.startsWith("//")) continue;
      assert.ok(u.startsWith("/exemplos/"), `${p}: ${u} fora de /exemplos`);
      assert.ok(fs.existsSync(arquivo(u)), `${p}: ${u} não existe`);
    }
  }
  const index = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
  assert.match(index, /<script data-sem-visitas data-codigo="estudio-ciranda" data-api="https:\/\/www\.renderizaweb\.com\.br\/exemplos\/site-fotografia\/painel\/site\/">/);
});

test("o conteúdo inicial do exemplo é válido e é o do site como está", async () => {
  const { default: conteudo } = await import("../exemplos/site-fotografia/conteudo-inicial.js");
  assert.deepEqual(lib.validar(conteudo), []);
  const { extrair } = await import("../ferramentas/meu-site/extrair.mjs");
  assert.deepEqual(await extrair(fs.readFileSync(path.join(SITE, "index.html"), "utf8")), conteudo, "site mudou: rode node ferramentas/exemplos/site-fotografia.mjs");
  assert.ok(conteudo.secoes.ensaios.listas.itens.every(i => i.textos.preco === ""), "os preços começam vazios");
});

test("no exemplo, a pessoa põe o preço, publica e o site mostra; a foto trocada aparece; o resto do painel só avisa", comNavegador, async () => {
  const { ctx, pagina: p, erros, faltou } = await abrir();
  try {
    await p.locator("button[data-secao=ensaios]").click();
    await p.locator("li[data-item] summary", { hasText: "Newborn" }).click(); // o item abre como na tela de verdade
    const preco = p.locator("input[name='l:preco']").nth(1);
    await preco.fill("a partir de R$ 1.190");
    await preco.blur();
    // o quadro (o site de verdade, com o rascunho) mostra o preço do Newborn
    const quadro = p.frameLocator("iframe[data-quadro]");
    await assert.doesNotReject(quadro.locator("#ensaios", { hasText: "a partir de R$ 1.190" }).waitFor({ timeout: 5000 }));
    await p.locator("[data-publicar]").click();
    await p.locator("text=Publicado. Aparece no site em até 1 minuto.").waitFor();
    await p.getByText(/No ar: versão 1/).waitFor();

    // o site aberto em outra aba (como a cliente final vê) já está com o preço
    const site = await ctx.newPage();
    await site.goto(ORIGEM + "/exemplos/site-fotografia/");
    await site.locator("#ensaios", { hasText: "a partir de R$ 1.190" }).waitFor({ timeout: 5000 });

    // trocar a foto da capa: a foto enviada fica no navegador e o site publicado mostra
    await p.locator("text=Todas as partes").click();
    await p.locator("button[data-secao=inicio]").click();
    const foto = fs.readdirSync(path.join(SITE, "img")).find(f => f.startsWith("menino-olhando"));
    await p.locator("[data-imagem] input[type=file]").first().setInputFiles(path.join(SITE, "img", foto));
    await quadro.locator("img[src*='/api/publico/imagens/']").first().waitFor({ timeout: 8000 });
    await p.locator("[data-publicar]").click();
    await p.getByText(/No ar: versão 2/).waitFor();
    await site.reload();
    const img = site.locator("img[src*='/api/publico/imagens/']").first();
    await img.waitFor({ timeout: 8000 });
    assert.ok(await img.evaluate(i => i.complete && i.naturalWidth > 0), "a foto nova carrega no site");

    // o menu do resto do painel avisa e fica na página
    await p.locator(".rz-lateral a[href='/agenda']").click();
    await p.getByText("No exemplo, só o Meu site abre aqui.").waitFor();
    assert.equal(new URL(p.url()).pathname, "/exemplos/meu-site-fotografia");
    assert.deepEqual(erros, []);
    assert.deepEqual(faltou.filter(f => !f.startsWith("/api/publico/imagens/")), []);
  } finally { await ctx.close(); }
});
