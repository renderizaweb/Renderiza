// Posts do Instagram da Renderiza, prontos para baixar e postar:
//   carrossel → 7 PNGs 1080 × 1350 (carrossel.html) · teste → 1 PNG 1080 × 1350 (teste.html)
//   reels → MP4 1080 × 1920, 30 quadros por segundo, com trilha original (reels.html + ferramentas/video/musica.py)
// Uso: node instagram/gerar.mjs [carrossel|teste|reels ...] [--ensaio] (sem nada: todos) → rascunhos/instagram/saida/
//   --ensaio: no Reels, só 11 quadros soltos (JPG) para conferir antes de gravar.
// As páginas abrem por um servidor local (módulo JS não carrega por file://). As fotos do negócio de exemplo são de
// banco livre (Unsplash, fotos.json) e são baixadas na primeira vez para rascunhos/instagram/fotos/.
// Cores: só nos tokens de instagram/marca.css. Trocou a paleta, é gerar de novo.
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spkiProxy } from "../ferramentas/proxy.mjs";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = resolve(AQUI, "..");
const SAIDA = join(RAIZ, "rascunhos", "instagram", "saida"), FOTOS = join(RAIZ, "rascunhos", "instagram", "fotos");
const FFMPEG = process.env.FFMPEG || "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2";
const FPS = 30;
const pedidos = process.argv.slice(2).filter(a => !a.startsWith("--"));
const ENSAIO = process.argv.includes("--ensaio");
const quais = pedidos.length ? pedidos : ["carrossel", "teste", "reels"];
mkdirSync(SAIDA, { recursive: true }); mkdirSync(FOTOS, { recursive: true });

// fotos do negócio de exemplo
for (const [nome, id] of Object.entries(JSON.parse(readFileSync(join(AQUI, "fotos.json"), "utf8")).fotos)) {
  const arq = join(FOTOS, nome + ".jpg");
  if (existsSync(arq)) continue;
  const r = spawnSync("curl", ["-s", "-m", "60", "-f", "-o", arq, `https://images.unsplash.com/photo-${id}?w=1400&q=82&fm=jpg`]);
  if (r.status !== 0) throw new Error("não baixou a foto " + nome);
}

// servidor local na raiz do repositório
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const servidor = createServer((req, res) => {
  const caminho = resolve(RAIZ, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!caminho.startsWith(RAIZ + sep) || !existsSync(caminho)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TIPOS[extname(caminho)] || "application/octet-stream" });
  res.end(readFileSync(caminho));
});
await new Promise(ok => servidor.listen(0, "127.0.0.1", ok));
const BASE = `http://127.0.0.1:${servidor.address().port}/instagram/`;

const SIMBOLO = readFileSync(join(RAIZ, "site", "estatico", "simbolo.svg"), "utf8");
const PROXY = (process.env.HTTPS_PROXY || "").replace(/^https?:\/\//, "");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", ...(PROXY ? ["--ignore-certificate-errors-spki-list=" + spkiProxy(), "--proxy-server=https=" + PROXY, "--proxy-bypass-list=127.0.0.1"] : [])] });

async function abrir(pagina, largura, altura) {
  const p = await browser.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  p.on("pageerror", e => console.error("  erro na página:", e.message));
  await p.goto(BASE + pagina, { waitUntil: "networkidle" });
  await p.waitForFunction(() => window.pronto === true, null, { timeout: 60000 });
  await p.evaluate(svg => document.querySelectorAll(".simbolo").forEach(s => (s.innerHTML = svg)), SIMBOLO);
  return p;
}

async function imagens(pagina, prefixo) {
  const p = await abrir(pagina, 1080, 1350);
  const slides = await p.$$(".slide");
  const feitos = [];
  for (const [i, s] of slides.entries()) {
    const arq = join(SAIDA, slides.length > 1 ? `${prefixo}-${i + 1}.png` : `${prefixo}.png`);
    await s.screenshot({ path: arq, type: "png" });
    feitos.push(arq);
  }
  await p.close();
  console.log(`${prefixo}: ${feitos.length} imagem(ns) em ${SAIDA}`);
}

const rodar = (cmd, args) => new Promise((ok, falha) => spawn(cmd, args, { stdio: "inherit" }).on("close", c => (c === 0 ? ok() : falha(new Error(cmd + " saiu com " + c)))));

async function reels() {
  const p = await abrir("reels.html", 1080, 1920);
  const { duracao, entrada, fechamento } = await p.evaluate(() => window.preparar());
  if (ENSAIO) { // só alguns quadros, para conferir antes de gravar
    for (const t of [0.6, 2.6, 4.6, 5.6, 7, 9, 11.4, 13.4, 15.6, 17, 19]) {
      await p.evaluate(x => window.quadro(x), t);
      await p.screenshot({ path: join(SAIDA, `reels-ensaio-${String(t).padStart(4, "0")}.jpg`), type: "jpeg", quality: 80 });
    }
    await p.close(); console.log("reels: ensaio em " + SAIDA); return;
  }
  const tmp = join(SAIDA, ".tmp-reels"); mkdirSync(tmp, { recursive: true });
  const video = join(tmp, "video.mp4");
  const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p", video], { stdio: ["pipe", "inherit", "inherit"] });
  const fim = new Promise((ok, falha) => ff.on("close", c => (c === 0 ? ok() : falha(new Error("ffmpeg saiu com " + c)))));
  const total = Math.round(duracao * FPS), inicio = Date.now();
  for (let f = 0; f < total; f++) {
    await p.evaluate(t => window.quadro(t), f / FPS);
    const buf = await p.screenshot({ type: "jpeg", quality: 92, caret: "hide" });
    await new Promise(ok => (ff.stdin.write(buf) ? ok() : ff.stdin.once("drain", ok)));
  }
  ff.stdin.end(); await fim; await p.close();
  const wav = join(tmp, "trilha.wav");
  await rodar("python3", [join(RAIZ, "ferramentas", "video", "musica.py"), wav, String(duracao), "--entrada", String(entrada), "--fechamento", String(fechamento), "--clima", "leve"]);
  const saida = join(SAIDA, "reels.mp4");
  await rodar(FFMPEG, ["-y", "-loglevel", "error", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a", "-t", String(duracao),
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-x264-params", "aq-mode=3", "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", saida]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`reels: ${saida} (${duracao}s, ${Math.round((Date.now() - inicio) / 1000)}s de gravação)`);
}

try {
  if (quais.includes("carrossel")) await imagens("carrossel.html", "carrossel");
  if (quais.includes("teste")) await imagens("teste.html", "teste");
  if (quais.includes("reels")) await reels();
} finally {
  await browser.close();
  servidor.close();
}
