// Servidor local igual à Vercel: site público em /, painel em /painel (login em /login),
// demos em /demo/<ótica> (com a mesma trava de prazo do middleware.js) e a função /api/config.
// Serve direto dos arquivos de origem (a mesma lista do build; a home é montada na hora),
// então é só recarregar a página.
// Lê as variáveis de .env.local.
//   npm run dev   →   http://localhost:5173

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { arquivosPublicados } from "./montar-site.mjs";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORTA = Number(process.env.PORT) || 5173;

const envLocal = join(RAIZ, ".env.local");
if (existsSync(envLocal)) {
  for (const linha of readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".mp4": "video/mp4" };
// Mesmas regras do vercel.json: só o site público pode aparecer no Google.
const PRIVADO = /^\/(demo|painel|login|api|flyer|gravacao)(\/|$)/;
const { default: config } = await import("../api/config.js");
const { default: travaDasDemos } = await import("../middleware.js");

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (PRIVADO.test(caminho)) res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (/^\/(painel|login)\/?$/.test(caminho)) res.setHeader("X-Frame-Options", "DENY");
  if (caminho === "/api/config") return config(req, res);
  if (caminho.startsWith("/demo/")) {
    const fora = await travaDasDemos(new Request("http://localhost" + req.url, { method: req.method }));
    if (fora) { res.statusCode = fora.status; fora.headers.forEach((v, k) => res.setHeader(k, v)); return res.end(await fora.text()); }
  }
  // Mesmas URLs da Vercel com cleanUrls: /painel abre painel/index.html; /demo/x/artes-instagram abre o .html.
  const rel = caminho.replace(/^\/+|\/+$/g, "");
  const candidatos = rel === "" ? ["index.html"] : [rel, rel + ".html", rel + "/index.html"];
  const publicados = new Map(arquivosPublicados().map(([destino, origem]) => [destino.split("\\").join("/"), origem]));
  const origem = candidatos.map(c => publicados.get(c)).find(Boolean);
  if (!origem) { res.statusCode = 404; return res.end("Não encontrado"); }
  const gerado = typeof origem === "function";
  // Gerado na hora: a home e as demos (HTML) e a capa da demo (imagem); a função diz o tipo em .tipo.
  res.setHeader("Content-Type", gerado ? TIPOS[origem.tipo || ".html"] : TIPOS[extname(origem)] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.end(gerado ? await origem() : await readFile(origem));
}).listen(PORTA, () => console.log(`Renderiza em http://localhost:${PORTA}  (site em /, painel em /painel, login em /login, demos em /demo/<ótica>)`));
