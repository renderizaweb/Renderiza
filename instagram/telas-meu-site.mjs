// Telas do Reels "Meu site" (reels-meu-site.html), tiradas do Meu site de VERDADE: o editor do Painel Renderiza em
// /exemplos/meu-site-fotografia (a casca e o módulo do painel, com o banco de mentira do exemplo) e o site de exemplo do
// Estúdio Ciranda (fictício) aberto como a cliente final abre. Nada é desenhado: cada imagem é uma captura.
//   computador (1280 × 800, em 2×): ed-1 o editor aberto · ed-2 os Ensaios, com o Newborn aberto · ed-3..ed-6 o preço
//     sendo digitado (o site do lado muda a cada tecla) · ed-7 "Rascunho salvo. Falta publicar." · ed-8 a Capa ·
//     ed-9 a foto nova na capa · ed-10 publicado
//   celular (390 px, em 2×): site-antes.jpg e site-depois.jpg (a página inteira, sem o topo fixo), site-topo.jpg (o topo)
//   posicoes.json: onde ficam, nas capturas, o que o vídeo aproxima (em px de 1280 × 800 e de 390 de largura)
// Uso: node instagram/telas-meu-site.mjs  (rodar de novo quando o painel ou o site de exemplo mudarem)

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { RAIZ, ORIGEM, servirComoRenderiza } from "../ferramentas/exemplos/servir.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const SAIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), "telas-meu-site");
const FOTO_NOVA = path.join(RAIZ, "rascunhos", "exemplos", "ciranda", "nb-pais.jpg"); // pai e mãe com o bebê (Unsplash)
fs.mkdirSync(SAIDA, { recursive: true });
if (!fs.existsSync(FOTO_NOVA)) throw new Error("falta a foto: node ferramentas/exemplos/site-fotografia.mjs baixa as fotos");

const posicoes = {};
const caixa = async loc => { const b = await loc.boundingBox(); return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };

const navegador = await chromium.launch();
try {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await servirComoRenderiza(ctx, { fontes: true });
  const p = await ctx.newPage();
  const tirar = async nome => { await p.waitForTimeout(500); await p.screenshot({ path: path.join(SAIDA, nome + ".jpg"), type: "jpeg", quality: 80 }); };
  const quadro = p.frameLocator("iframe[data-quadro]");

  // o site como foi entregue, no celular (antes de qualquer mudança)
  const site = await ctx.newPage();
  await site.setViewportSize({ width: 390, height: 844 });
  async function tirarSite(nome) {
    await site.goto(ORIGEM + "/exemplos/site-fotografia/");
    await site.evaluate(async () => {
      document.getElementById("rz-exemplo-selo")?.remove();
      // as entradas animadas (.reveal) já aparecidas: a página inteira sai numa imagem só
      const st = document.createElement("style"); st.textContent = ".js .reveal,.reveal{opacity:1!important;transform:none!important;transition:none!important}"; document.head.append(st);
      for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
      scrollTo(0, 0);
    });
    await site.waitForTimeout(1200);
    if (nome === "site-antes") await site.locator(".site-header").screenshot({ path: path.join(SAIDA, "site-topo.jpg"), type: "jpeg", quality: 85 });
    const topo = await site.evaluate(() => { const h = document.querySelector(".site-header"); const a = h.offsetHeight; h.style.visibility = "hidden"; document.querySelectorAll(".flutuante").forEach(e => { e.style.visibility = "hidden"; }); return a; });
    await site.screenshot({ path: path.join(SAIDA, nome + ".jpg"), type: "jpeg", quality: 80, fullPage: true });
    posicoes[nome] = { topo, altura: await site.evaluate(() => document.documentElement.scrollHeight), ensaios: await site.evaluate(() => Math.round(document.querySelector("#ensaios").getBoundingClientRect().top + scrollY)),
      newborn: await site.evaluate(() => { const e = [...document.querySelectorAll("#ensaios [data-site-item]")][1]; return e ? Math.round(e.getBoundingClientRect().top + scrollY) : 0; }) };
  }
  await tirarSite("site-antes");

  // o editor
  await p.goto(ORIGEM + "/exemplos/meu-site-fotografia");
  await p.evaluate(() => document.querySelector(".ex-faixa")?.remove());
  await p.locator("button[data-secao=ensaios]").waitFor();
  await p.waitForTimeout(1500);
  await tirar("ed-1");
  posicoes["ed-1"] = { partes: await caixa(p.locator(".rz-ms-partes, ol, ul").filter({ has: p.locator("button[data-secao]") }).first()), quadro: await caixa(p.locator("iframe[data-quadro]")) };

  await p.locator("button[data-secao=ensaios]").click();
  await p.locator("li[data-item] summary", { hasText: "Newborn" }).click();
  const preco = p.locator("input[name='l:preco']").nth(1);
  await preco.scrollIntoViewIfNeeded();
  await preco.focus(); // o site do quadro vai até o Newborn
  await p.waitForTimeout(1200);
  await tirar("ed-2");
  posicoes["ed-2"] = { newborn: await caixa(p.locator("li[data-item] summary", { hasText: "Newborn" })), preco: await caixa(preco), quadro: await caixa(p.locator("iframe[data-quadro]")) };

  const etapas = ["a partir", "a partir de R$", "a partir de R$ 1.1", "a partir de R$ 1.190"];
  for (const [i, texto] of etapas.entries()) {
    await preco.fill(texto);
    await quadro.locator("#ensaios", { hasText: texto }).waitFor();
    await p.waitForTimeout(250);
    await tirar("ed-" + (3 + i));
  }
  posicoes.precoNoSite = await (async () => {
    const f = await p.locator("iframe[data-quadro]").boundingBox();
    const b = await quadro.locator("#ensaios [data-site-item]").nth(1).locator(":text('a partir de R$ 1.190')").boundingBox();
    return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), quadro: f && Math.round(f.x) };
  })();
  await preco.blur();
  await p.getByText("Rascunho salvo. Falta publicar.").waitFor();
  await tirar("ed-7");
  posicoes["ed-7"] = { situacao: await caixa(p.getByText("Rascunho salvo. Falta publicar.")), publicar: await caixa(p.locator("[data-publicar]")) };

  // a foto da capa
  await p.locator("text=Todas as partes").click();
  await p.locator("button[data-secao=inicio]").click();
  const foto = p.locator("[data-imagem]").first();
  await foto.scrollIntoViewIfNeeded();
  await p.waitForTimeout(1000);
  await tirar("ed-8");
  posicoes["ed-8"] = { foto: await caixa(foto), quadro: await caixa(p.locator("iframe[data-quadro]")) };
  await foto.locator("input[type=file]").setInputFiles(FOTO_NOVA);
  await quadro.locator("img[src*='/api/publico/imagens/']").first().waitFor();
  await p.waitForTimeout(1500);
  await tirar("ed-9");
  posicoes["ed-9"] = { foto: await caixa(foto), quadro: await caixa(p.locator("iframe[data-quadro]")) };

  // publicar
  await p.locator("[data-publicar]").click();
  await p.getByText("Publicado. Aparece no site em até 1 minuto.").waitFor();
  await p.getByText(/No ar: versão 1/).waitFor();
  await tirar("ed-10");
  posicoes["ed-10"] = { aviso: await caixa(p.getByText("Publicado. Aparece no site em até 1 minuto.")), situacao: await caixa(p.getByText(/No ar: versão 1/)) };

  // o site depois, como a cliente final vê
  await tirarSite("site-depois");
  fs.writeFileSync(path.join(SAIDA, "posicoes.json"), JSON.stringify(posicoes, null, 1));
  console.log(`${fs.readdirSync(SAIDA).length} arquivos em instagram/telas-meu-site/`);
} finally {
  await navegador.close();
}
