// Imagens do site público, geradas com o Chromium do Playwright (nada de serviço externo).
//
//   node scripts/imagens-do-site.mjs
//     → site/estatico/compartilhar.jpg (prévia no WhatsApp/LinkedIn, 1200×630, com a frase da abertura),
//       favicon-32.png e apple-touch-icon.png. Rodar de novo se mudar nome ou frase (FRASE em site/pagina.mjs).
//
//   node scripts/imagens-do-site.mjs otimizar <foto.jpg> <site/estatico/imagens/nome.webp> [largura]
//     → reduz e converte uma foto real para WebP (padrão: 960 px de largura), para a foto do Kaue
//       ou os prints dos trabalhos.

import { readFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ESTATICO = join(RAIZ, "site", "estatico");

async function abrirNavegador() {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch { ({ chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs")); }
  const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH ? "/opt/pw-browsers/chromium" : undefined;
  return chromium.launch({ executablePath, args: ["--no-sandbox"] });
}

const fonte = nome => "data:font/woff2;base64," + readFileSync(join(ESTATICO, "fontes", nome)).toString("base64");
// Símbolo da Renderiza (site/estatico/simbolo.svg) e as cores do logo.
const SIMBOLO = readFileSync(join(ESTATICO, "simbolo.svg"), "utf8");
const simbolo = (tam, cor) => SIMBOLO.replace("<svg ", `<svg width="${tam}" height="${tam}" style="color:${cor}" `);
const GRAFITE = "#1e2528", GELO = "#f1eee9";

async function gerarImagens() {
  const { default: config } = await import("../site/config.mjs");
  const { FRASE } = await import("../site/pagina.mjs");
  const css = `
    @font-face{font-family:Geist;font-weight:100 900;src:url(${fonte("geist.woff2")})}
    *{margin:0;box-sizing:border-box}
    body{width:1200px;height:630px;overflow:hidden;background:${GRAFITE};color:${GELO};font-family:Geist}
    .quadro{position:relative;height:100%;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
    .marca{display:flex;align-items:center;gap:16px;font-weight:600;font-size:40px;letter-spacing:-1.6px}
    h1{font-weight:600;font-size:84px;line-height:1.02;letter-spacing:-3.6px;max-width:1000px}
    h1 em{font-style:normal;color:#8d9598}
    .pe{display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#b9bfc1}
    .pe strong{color:${GELO};font-weight:600}`;
  const og = `<style>${css}</style><div class="quadro">
    <div class="marca">${simbolo(56, GELO)}<b>renderiza</b></div>
    <h1>${FRASE.inicio}<br><em>${FRASE.destaque}</em></h1>
    <div class="pe"><span><strong>Sites para lojas, clínicas e consultórios</strong></span><span>${new URL(config.endereco).hostname.replace(/^www\./, "")}</span></div>
  </div>`;
  const icone = (tam, escala = 0.72) => `<style>*{margin:0}body{width:${tam}px;height:${tam}px;overflow:hidden;background:${GRAFITE};display:grid;place-items:center}</style>
    ${simbolo(Math.round(tam * escala), GELO)}`;

  const navegador = await abrirNavegador();
  const foto = async (html, largura, altura, arquivo, tipo = "png") => {
    const pagina = await navegador.newPage({ viewport: { width: largura, height: altura } });
    await pagina.setContent(html, { waitUntil: "load" });
    await pagina.evaluate(() => document.fonts.ready);
    writeFileSync(join(ESTATICO, arquivo), await pagina.screenshot(tipo === "jpeg" ? { type: "jpeg", quality: 86 } : { type: "png" }));
    await pagina.close();
    console.log("ok  site/estatico/" + arquivo);
  };
  await foto(og, 1200, 630, "compartilhar.jpg", "jpeg");
  await foto(icone(180), 180, 180, "apple-touch-icon.png");
  await foto(icone(32, 0.84), 32, 32, "favicon-32.png");
  await navegador.close();
}

async function otimizar(entrada, saida, largura = 960) {
  if (!entrada || !saida || extname(saida) !== ".webp") throw new Error("Uso: otimizar <foto> <saida.webp> [largura]");
  const tipo = { ".jpg": "jpeg", ".jpeg": "jpeg", ".png": "png", ".webp": "webp" }[extname(entrada).toLowerCase()];
  if (!tipo) throw new Error("Formato não suportado: use JPG, PNG ou WebP.");
  const dados = "data:image/" + tipo + ";base64," + readFileSync(entrada).toString("base64");
  const navegador = await abrirNavegador();
  const pagina = await navegador.newPage();
  const base64 = await pagina.evaluate(async ({ dados, largura }) => {
    const img = new Image();
    img.src = dados;
    await img.decode();
    const escala = Math.min(1, largura / img.naturalWidth);
    const tela = document.createElement("canvas");
    tela.width = Math.round(img.naturalWidth * escala);
    tela.height = Math.round(img.naturalHeight * escala);
    tela.getContext("2d").drawImage(img, 0, 0, tela.width, tela.height);
    return tela.toDataURL("image/webp", 0.82).split(",")[1];
  }, { dados, largura: Number(largura) });
  await navegador.close();
  writeFileSync(saida, Buffer.from(base64, "base64"));
  console.log(`ok  ${saida} (${Math.round(Buffer.byteLength(base64, "base64") / 1024)} KB)`);
}

const [, , comando, ...args] = process.argv;
if (comando === "otimizar") await otimizar(...args);
else await gerarImagens();
