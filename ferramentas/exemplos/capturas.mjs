// Imagens da página /exemplos (exemplos/img/): as miniaturas de cada exemplo e as fotos da prévia do link (og:image).
// Saem dos próprios exemplos (exemplos/*.html, dados fictícios da Villa Alecrim), abertos no navegador.
//   node ferramentas/exemplos/capturas.mjs
// O cartaz do vídeo (video.jpg) sai do MP4: o 1º quadro depois da abertura, tirado com o ffmpeg.
import { mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spkiProxy } from "../proxy.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const EX = join(RAIZ, "exemplos"), IMG = join(EX, "img");
mkdirSync(IMG, { recursive: true });
const PROXY = (process.env.HTTPS_PROXY || "").replace(/^https?:\/\//, "");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium",
  args: ["--hide-scrollbars", ...(PROXY ? ["--ignore-certificate-errors-spki-list=" + spkiProxy(), "--proxy-server=https=" + PROXY] : [])] });

async function abrir(arquivo, { largura = 1440, altura = 900, celular = false, escala = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: escala, isMobile: celular, hasTouch: celular, locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
  const p = await ctx.newPage();
  await p.goto("file://" + join(EX, arquivo), { waitUntil: "networkidle" });
  await p.evaluate(async () => { await document.fonts.ready; document.querySelector(".selo-demo")?.remove(); });
  await p.waitForTimeout(400);
  return { p, fechar: () => ctx.close() };
}
const jpg = (p, nome, clip) => p.screenshot({ path: join(IMG, nome), type: "jpeg", quality: 78, ...(clip ? { clip } : {}) });

// painel: visão geral (prévia do link e miniatura), agenda, cliente aberto, financeiro, atendimento, equipe
{
  const { p, fechar } = await abrir("painel-eventos.html#inicio", { largura: 1280, altura: 800 });
  await jpg(p, "painel.jpg", { x: 0, y: 0, width: 1280, height: 672 });
  await jpg(p, "t-painel.jpg");
  for (const v of ["agenda", "financeiro", "atendimento", "equipe", "contratos"]) {
    await p.evaluate(v => { location.hash = v; }, v); await p.waitForTimeout(500);
    await jpg(p, `t-${v}.jpg`);
  }
  await p.evaluate(() => { location.hash = "clientes"; }); await p.waitForTimeout(400);
  await p.click("#clientes tbody tr:nth-child(1)"); await p.waitForTimeout(600);
  await jpg(p, "t-clientes.jpg");
  await fechar();
}
// agenda online: a escolha da data (no computador e no celular)
{
  const { p, fechar } = await abrir("agenda-online.html", { largura: 1280, altura: 800 });
  await p.click('[data-festa="casamento"]'); await p.waitForTimeout(500);
  await p.click("#mes-prox");
  await (await p.$(".d.livre")).click(); await p.waitForTimeout(500);
  await jpg(p, "agenda.jpg", { x: 0, y: 0, width: 1280, height: 672 });
  await jpg(p, "t-agenda-online.jpg");
  await fechar();
}
await browser.close();

// cartaz do vídeo: um quadro do meio do vídeo (o painel no celular, com a legenda)
const MP4 = join(RAIZ, "gravacoes", "exemplo-sistema-eventos.mp4");
if (existsSync(MP4)) {
  const ff = process.env.FFMPEG || "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2";
  spawnSync(ff, ["-y", "-loglevel", "error", "-ss", "5.2", "-i", MP4, "-frames:v", "1", "-q:v", "4", join(IMG, "video.jpg")], { stdio: "inherit" });
}
console.log("imagens em " + IMG);
