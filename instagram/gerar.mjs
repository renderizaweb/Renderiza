// Posts do Instagram da Renderiza, prontos para baixar e postar:
//   carrossel → 7 PNGs 1080 × 1350 (carrossel.html) · teste → 1 PNG 1080 × 1350 (teste.html)
//   reels, reels-cliente-perdido, reels-narrado (com voz: narrar.py) → MP4 1080 × 1920, 30 quadros por segundo, com trilha original (reels.html + ferramentas/video/musica.py)
//   stories-* → PNGs 1080 × 1920, um por .slide (a arte dos stories; enquete e caixa de pergunta entram no app)
// Uso: node instagram/gerar.mjs [carrossel|teste|reels ...] [--ensaio] (sem nada: todos) → rascunhos/instagram/saida/
//   Qualquer outro nome é uma página de imagens (<nome>.html, uma .slide por imagem) ou, se começar com "reels", um Reels.
//   --ensaio: no Reels, só 11 quadros soltos (JPG) para conferir antes de gravar.
// As páginas abrem por um servidor local (módulo JS não carrega por file://). As fotos do negócio de exemplo são de
// banco livre (Unsplash, fotos.json) e são baixadas na primeira vez para rascunhos/instagram/fotos/.
// Cores: só nos tokens de instagram/marca.css. Trocou a paleta, é gerar de novo.
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
// cada Reels é um <nome>.html com window.preparar() e window.quadro(t) e sai em <nome>.mp4
const REELS = ["reels", "reels-cliente-perdido", "reels-narrado", "reels-anuncio", "reels-sobrinho", "reels-atende", "reels-fecha", "reels-indica", "reels-elogio", "reels-catalogo", "reels-pronto"];
const IMAGENS = ["carrossel", "teste", "carrossel-dicionario", "post-pixel", "carrossel-espalhado", "stories-semana"];
const quais = pedidos.length ? pedidos : [...IMAGENS, ...REELS];
mkdirSync(SAIDA, { recursive: true }); mkdirSync(FOTOS, { recursive: true });

// fotos do negócio de exemplo
for (const [nome, id] of Object.entries(JSON.parse(readFileSync(join(AQUI, "fotos.json"), "utf8")).fotos)) {
  const arq = join(FOTOS, nome + ".jpg");
  if (existsSync(arq)) continue;
  const r = spawnSync("curl", ["-s", "-m", "60", "-f", "-o", arq, `https://images.unsplash.com/photo-${id}?w=1400&q=82&fm=jpg`]);
  if (r.status !== 0) throw new Error("não baixou a foto " + nome);
}

// servidor local na raiz do repositório
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };
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
  const p = await abrir(pagina, 1080, prefixo.startsWith("stories") ? 1920 : 1350); // story: 9:16; feed: 4:5
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

async function reels(nome) {
  const p = await abrir(nome + ".html", 1080, 1920);
  const { duracao, entrada, fechamento, clima = "leve", narracao, pulso, bpm, tom, ensaio = [0.6, 2.6, 4.6, 5.6, 7, 9, 11.4, 13.4, 15.6, 17, 19] } = await p.evaluate(() => window.preparar());
  if (ENSAIO) { // só alguns quadros, para conferir antes de gravar
    for (const t of ensaio) {
      await p.evaluate(x => window.quadro(x), t);
      await p.screenshot({ path: join(SAIDA, `${nome}-ensaio-${t.toFixed(2).padStart(5, "0")}.jpg`), type: "jpeg", quality: 80 });
    }
    await p.close(); console.log(`${nome}: ensaio em ${SAIDA}`); return;
  }
  const tmp = join(SAIDA, ".tmp-" + nome); mkdirSync(tmp, { recursive: true });
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
  if (narracao) { // Reels com voz: a voz (instagram/narrar.py) e a trilha pulsante que abaixa quando ela fala
    const voz = join(RAIZ, "rascunhos", "instagram", narracao + "-voz.wav");
    if (!existsSync(voz)) await rodar("python3", [join(AQUI, "narrar.py"), narracao]);
    await rodar("python3", [join(RAIZ, "ferramentas", "video", "trilha-pulso.py"), join(AQUI, "narracao", narracao + ".tempos.json"), voz, wav, String(duracao)]);
  } else if (pulso) { // Reels sem voz com a trilha pulsante: "pulso" traz as cenas como as frases de uma narração
    const tempos = join(tmp, "cenas.json"), mudo = join(tmp, "mudo.wav");
    writeFileSync(tempos, JSON.stringify({ duracao, frases: pulso }));
    await rodar(FFMPEG, ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(duracao), "-c:a", "pcm_s16le", mudo]);
    await rodar("python3", [join(RAIZ, "ferramentas", "video", "trilha-pulso.py"), tempos, mudo, wav, String(duracao), ...(bpm ? ["--bpm", String(bpm)] : []), ...(tom ? ["--tom", String(tom)] : [])]);
  } else await rodar("python3", [join(RAIZ, "ferramentas", "video", "musica.py"), wav, String(duracao), "--entrada", String(entrada), "--fechamento", String(fechamento), "--clima", clima]);
  const saida = join(SAIDA, nome + ".mp4");
  await rodar(FFMPEG, ["-y", "-loglevel", "error", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a", "-t", String(duracao),
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-x264-params", "aq-mode=3", "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", saida]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(`${nome}: ${saida} (${duracao}s, ${Math.round((Date.now() - inicio) / 1000)}s de gravação)`);
}

try {
  for (const nome of quais) {
    if (nome.startsWith("reels")) await reels(nome);
    else await imagens(nome + ".html", nome);
  }
} finally {
  await browser.close();
  servidor.close();
}
