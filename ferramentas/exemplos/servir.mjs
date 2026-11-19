// Serve o repositório num navegador do Playwright como se fosse https://www.renderizaweb.com.br (o que o
// scripts/montar-site.mjs publica: /exemplos, /fontes e /favicon.svg, com o cleanUrls e o rewrite das miniaturas do
// vercel.json), sem servidor nenhum: pelas rotas do contexto. Usado pelo teste do Meu site de exemplo
// (test/meu-site-exemplo.test.mjs) e pelas capturas dele (ferramentas/exemplos/capturas-meu-site.mjs).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ORIGEM = "https://www.renderizaweb.com.br";
const TIPO = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp" };

/** O arquivo do repositório que a Renderiza serve num caminho. */
export function arquivo(caminho) {
  const p = caminho.replace(/^\/exemplos\/site-fotografia\/exemplos\/site-fotografia\//, "/exemplos/site-fotografia/");
  if (p.startsWith("/fontes/") || p === "/favicon.svg") return path.join(RAIZ, "site", "estatico", p);
  let f = path.join(RAIZ, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
  return f;
}

/** Liga as rotas no contexto. `fontes`: deixa as fontes do Google passarem (capturas); sem, devolve vazio (testes). */
export async function servirComoRenderiza(ctx, { fontes = false } = {}) {
  const faltou = [];
  await ctx.route("**/*", rota => {
    const u = new URL(rota.request().url());
    if (u.origin === ORIGEM) {
      if (u.pathname.startsWith("/api/visita")) return rota.fulfill({ status: 204, body: "" });
      const f = arquivo(u.pathname);
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { faltou.push(u.pathname); return rota.fulfill({ status: 404, body: "" }); }
      return rota.fulfill({ status: 200, contentType: TIPO[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
    }
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return fontes ? rota.continue() : rota.fulfill({ status: 200, contentType: "text/css", body: "" });
    return rota.abort();
  });
  return faltou;
}
