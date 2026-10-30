// Servidor local do Painel Renderiza, igual à Vercel: os mesmos cabeçalhos do vercel.json, /api/config, a API
// pública (api/publico/) e o index.html para qualquer rota do app. Serve direto dos arquivos: é só recarregar a página.
//   npm run dev                       →  http://localhost:5180, contra o banco STG
//   npm run dev -- --banco producao   →  contra a produção (só para conferir; os testes são no STG)
// Lê PAINEL_STG_* ou PAINEL_PROD_* do ambiente (ou de painel-clientes/.env.local). Nunca o SUPABASE_URL da
// raiz, que é do Painel de prospecção.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { configDoAmbiente, responder } from "../api/config.js";
import agendaPublica from "../api/publico/agenda/[codigo]/index.js";
import pedidoPublico from "../api/publico/agenda/[codigo]/pedido.js";
import saudePublica from "../api/publico/saude.js";
import sitePublico from "../api/publico/site/[codigo]/index.js";
import previaPublica from "../api/publico/site/[codigo]/previa.js";
import imagemPublica from "../api/publico/imagens/[...caminho].js";

const PASTA = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORTA = Number(process.env.PORT) || 5180;
const banco = process.argv.includes("--banco") ? process.argv[process.argv.indexOf("--banco") + 1] : "stg";
if (!["stg", "producao"].includes(banco)) {
  console.error('Use --banco stg ou --banco producao.');
  process.exit(1);
}

const envLocal = join(PASTA, ".env.local");
if (existsSync(envLocal)) {
  for (const linha of readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const prefixo = banco === "stg" ? "PAINEL_STG" : "PAINEL_PROD";
const envDoPainel = {
  SUPABASE_URL: process.env[prefixo + "_SUPABASE_URL"],
  SUPABASE_ANON_KEY: process.env[prefixo + "_SUPABASE_ANON_KEY"],
  TURNSTILE_SITE_KEY: process.env[prefixo + "_TURNSTILE_SITE_KEY"], // a pública; só quando o cadastro abrir
  VERCEL_ENV: banco === "stg" ? "development" : "local · produção",
};

// Os cabeçalhos vêm do vercel.json, para o local nunca divergir da Vercel.
const vercel = JSON.parse(readFileSync(join(PASTA, "vercel.json"), "utf8"));
const regras = vercel.headers.map(h => ({ re: new RegExp("^" + h.source.replace(/\(\.\*\)/g, ".*") + "$"), headers: h.headers }));

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };
// O que a Vercel publica (o resto está no .vercelignore).
const PUBLICAVEL = /^\/(src|publico)\/|^\/favicon\.svg$/;
const ROTA_DO_APP = /^\/(?!api\/|src\/|publico\/)/; // mesma regra do rewrite do vercel.json

createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
  for (const r of regras) if (r.re.test(caminho)) r.headers.forEach(h => res.setHeader(h.key, h.value));
  if (caminho === "/api/config") return responder(res, configDoAmbiente(envDoPainel));
  // a API pública, como na Vercel (cada arquivo de api/publico/ é uma função)
  if (caminho === "/api/publico/saude") return saudePublica(req, res, envDoPainel);
  if (/^\/api\/publico\/agenda\/[^/]+\/pedido\/?$/.test(caminho)) return pedidoPublico(req, res, envDoPainel);
  if (/^\/api\/publico\/agenda\/[^/]+\/?$/.test(caminho)) return agendaPublica(req, res, envDoPainel);
  if (/^\/api\/publico\/site\/[^/]+\/previa\/?$/.test(caminho)) return previaPublica(req, res, envDoPainel);
  if (/^\/api\/publico\/site\/[^/]+\/?$/.test(caminho)) return sitePublico(req, res, envDoPainel);
  if (caminho.startsWith("/api/publico/imagens/")) return imagemPublica(req, res, envDoPainel);

  let arquivo = null;
  if (/^\/c\/[^/]+\/?$/.test(caminho)) {
    arquivo = join(PASTA, "publico", "contrato", "index.html"); // o aceite do contrato (o primeiro rewrite do vercel.json)
  } else if (caminho === "/termos" || caminho === "/privacidade") {
    arquivo = join(PASTA, "publico", caminho.slice(1), "index.html"); // os documentos (os rewrites seguintes do vercel.json)
  } else if (PUBLICAVEL.test(caminho)) {
    const alvo = resolve(PASTA, "." + caminho);
    if (alvo.startsWith(PASTA + sep) && existsSync(alvo)) arquivo = alvo;
  } else if (ROTA_DO_APP.test(caminho)) {
    arquivo = join(PASTA, "index.html");
  }
  if (!arquivo) { res.statusCode = 404; return res.end("Não encontrado"); }
  res.setHeader("Content-Type", TIPOS[extname(arquivo)] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  res.end(await readFile(arquivo));
}).listen(PORTA, () => {
  const ok = envDoPainel.SUPABASE_URL && envDoPainel.SUPABASE_ANON_KEY;
  console.log(`Painel Renderiza em http://localhost:${PORTA}  (banco: ${banco === "stg" ? "STG" : "PRODUÇÃO"})`);
  if (!ok) console.log(`Atenção: faltam ${prefixo}_SUPABASE_URL e ${prefixo}_SUPABASE_ANON_KEY no ambiente.`);
});
