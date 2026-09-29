// Servidor local igual à Vercel: painel em /, demos em /demo/<ótica> e a função /api/config.
// Serve direto dos arquivos de origem (a mesma lista do build), então é só recarregar a página.
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

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };
const { default: config } = await import("../api/config.js");

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (caminho === "/api/config") return config(req, res);
  // Mesmas URLs da Vercel com cleanUrls: /demo/x abre demo/x/index.html; /demo/x/artes-instagram abre o .html.
  const rel = caminho.replace(/^\/+|\/+$/g, "");
  const candidatos = rel === "" ? ["index.html"] : [rel, rel + ".html", rel + "/index.html"];
  const publicados = new Map(arquivosPublicados().map(([destino, origem]) => [destino.split("\\").join("/"), origem]));
  const origem = candidatos.map(c => publicados.get(c)).find(Boolean);
  if (!origem) { res.statusCode = 404; return res.end("Não encontrado"); }
  res.setHeader("Content-Type", TIPOS[extname(origem)] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.end(await readFile(origem));
}).listen(PORTA, () => console.log(`Renderiza em http://localhost:${PORTA}  (painel em /, demos em /demo/<ótica>)`));
