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
import { ORIGEM, arquivo, servirComoRenderiza } from "../ferramentas/exemplos/servir.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(RAIZ, "exemplos", "site-fotografia");
const lib = (() => { const m = { exports: {} }; new Function("module", fs.readFileSync(path.join(RAIZ, "ferramentas/meu-site/meu-site.js"), "utf8"))(m); return m.exports; })();

let playwright = null;
try { playwright = createRequire(import.meta.url)("playwright"); } catch { /* sem navegador */ }
const comNavegador = { skip: playwright ? false : "sem o Playwright" };

let navegador;
before(async () => { if (playwright) navegador = await playwright.chromium.launch(); });
after(async () => { await navegador?.close(); });

async function abrir(caminho = "/exemplos/meu-site-fotografia") {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
  const erros = [];
  const faltou = await servirComoRenderiza(ctx);
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

test("a página /exemplos/fotografia mostra o Meu site: o card, os Detalhes, o plano e a pergunta", () => {
  const html = fs.readFileSync(path.join(RAIZ, "exemplos", "fotografia.html"), "utf8");
  assert.match(html, /<span class="selo">Vem em todo plano<\/span><h3>Meu site<\/h3>/);
  assert.match(html, /<img src="\/exemplos\/img\/f-t-meu-site\.jpg"/);
  assert.ok(fs.existsSync(path.join(RAIZ, "exemplos", "img", "f-t-meu-site.jpg")) && fs.existsSync(path.join(RAIZ, "exemplos", "img", "f-meu-site.jpg")));
  assert.match(html, /"id": "meu-site"[\s\S]*?"saber": \[[^\]]*não conta entre os 2 módulos e não muda a mensalidade[^\]]*o site continua no ar com a versão que foi entregue/);
  assert.match(html, /"sempre": true/);
  assert.match(html, /O Meu site, para mudar o seu site quando quiser \(não conta entre os 2\)/);
  assert.match(html, /<summary>Depois que o site fica pronto, como eu atualizo\?<\/summary>/);
  const pagina = fs.readFileSync(path.join(RAIZ, "exemplos", "meu-site-fotografia.html"), "utf8");
  // a tabela visitas só aceita exemplos, painel-eventos, agenda-online e demo: conta como o exemplo do painel
  assert.match(pagina, /<script src="visitas\.js" data-pagina="painel-eventos"><\/script>/);
  assert.match(pagina, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(pagina, /fict[íi]cio/i);
});
