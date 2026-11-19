// As imagens do Meu site nos exemplos (exemplos/img/), tiradas do editor de verdade (/exemplos/meu-site-fotografia):
// a miniatura do card em /exemplos/fotografia (f-t-meu-site.jpg, 1280 × 800) e a prévia do link (f-meu-site.jpg,
// 1200 × 630). A cena: o preço do Newborn digitado à esquerda e o site do quadro já mostrando, com o rascunho salvo.
//   node ferramentas/exemplos/capturas-meu-site.mjs   (rodar de novo quando o painel ou o site de exemplo mudarem)

import path from "node:path";
import { createRequire } from "node:module";
import { RAIZ, ORIGEM, servirComoRenderiza } from "./servir.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const IMG = path.join(RAIZ, "exemplos", "img");

const navegador = await chromium.launch();
try {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await servirComoRenderiza(ctx, { fontes: true });
  const p = await ctx.newPage();
  await p.goto(ORIGEM + "/exemplos/meu-site-fotografia");
  await p.evaluate(() => document.querySelector(".ex-faixa")?.remove()); // a faixa de exemplo não entra na imagem
  await p.locator("button[data-secao=ensaios]").click();
  await p.locator("li[data-item] summary", { hasText: "Newborn" }).click();
  const preco = p.locator("input[name='l:preco']").nth(1);
  await preco.fill("a partir de R$ 1.190");
  await preco.blur();
  await p.frameLocator("iframe[data-quadro]").locator("#ensaios", { hasText: "a partir de R$ 1.190" }).waitFor();
  await preco.scrollIntoViewIfNeeded();
  await p.getByText("Rascunho salvo. Falta publicar.").waitFor();
  await p.waitForTimeout(1200); // as animações de entrada do site no quadro
  await p.screenshot({ path: path.join(IMG, "f-t-meu-site.jpg"), type: "jpeg", quality: 82 });
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.waitForTimeout(1500); // o quadro recarrega no tamanho novo
  await preco.scrollIntoViewIfNeeded();
  await preco.focus(); // o editor leva o site do quadro até o item que está sendo mudado
  await p.frameLocator("iframe[data-quadro]").locator("#ensaios", { hasText: "a partir de R$ 1.190" }).waitFor();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(IMG, "f-meu-site.jpg"), type: "jpeg", quality: 82 });
  console.log("exemplos/img/f-t-meu-site.jpg e f-meu-site.jpg");
} finally {
  await navegador.close();
}
