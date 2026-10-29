// O que as funções públicas (as que os sites dos clientes chamam) têm em comum: CORS, a resposta e a chamada ao banco.
// O arquivo começa com "_": a Vercel não o publica como função. Cada função exporta tratar(...), que recebe só dados
// (testável sem rede) e devolve { status, corpo, cabecalhos }; o default adapta ao (req, res) da Vercel e do
// scripts/servidor.mjs. O banco é chamado com a chave PÚBLICA: quem decide o que sai são as funções publico_* (05).

import { createHash } from "node:crypto";
import { configDoAmbiente } from "../config.js";

export const CODIGO = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/; // o de sites.codigo
const LIMITE_CORPO = 8192;

/** CORS aberto: o site do cliente está em outro domínio e não manda login; quem filtra o domínio é o banco. */
export function cors(metodos) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": metodos + ", OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export const resposta = (status, corpo, cabecalhos = {}) => ({ status, corpo, cabecalhos });

/** O endereço do Supabase e a chave pública, conferidos como no /api/config (nunca a chave secreta). */
export function ambiente(env) {
  const c = configDoAmbiente(env);
  if (c.status !== 200) throw new Error(c.corpo.erro);
  return { url: c.corpo.supabaseUrl.replace(/\/+$/, ""), chave: c.corpo.supabaseAnonKey };
}

/** Chama uma função do banco pela API do Supabase, como visitante (anon). */
export async function rpc(env, funcao, args, buscar = fetch) {
  const { url, chave } = ambiente(env);
  const r = await buscar(`${url}/rest/v1/rpc/${funcao}`, {
    method: "POST",
    headers: { apikey: chave, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`banco respondeu ${r.status}`);
  return r.json();
}

/** O endereço do visitante, embaralhado (por site e por dia): o banco só conta, ninguém sabe de onde veio. */
export function enderecoEmbaralhado(ip, codigo, agora = new Date()) {
  const dia = agora.toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip || "?"}|${codigo}|${dia}`).digest("hex").slice(0, 32);
}

/** O domínio de quem chamou, pelo cabeçalho Origin (o navegador põe; sem ele, nenhum domínio confere). */
export function dominioDe(origem) {
  try { return new URL(origem).hostname.toLowerCase(); } catch { return "sem-origem"; }
}

async function lerCorpo(req) {
  if (req.body !== undefined && typeof req.body !== "string" && !Buffer.isBuffer(req.body)) return req.body; // a Vercel já leu
  let texto = typeof req.body === "string" ? req.body : Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (req.body === undefined) {
    for await (const pedaco of req) {
      texto += pedaco;
      if (texto.length > LIMITE_CORPO) throw new Error("grande");
    }
  }
  if (texto.length > LIMITE_CORPO) throw new Error("grande");
  return texto ? JSON.parse(texto) : {};
}

/**
 * Adapta tratar({ metodo, caminho, busca, corpo, origem, ip, env }) ao (req, res) da Vercel e do servidor local. O
 * servidor local passa o env do banco escolhido (no ambiente das sessões, o SUPABASE_URL de process.env é o do Painel
 * de prospecção, que o ambiente() recusa).
 */
export function adaptar(tratar) {
  return async function handler(req, res, env = process.env) {
    const u = new URL(req.url, "http://local");
    let corpo = null;
    if (req.method === "POST") {
      try { corpo = await lerCorpo(req); } catch { corpo = Symbol.for("invalido"); }
    }
    let r;
    try {
      r = await tratar({
        metodo: req.method,
        caminho: u.pathname,
        busca: u.searchParams,
        corpo,
        origem: req.headers.origin || "",
        ip: String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim(),
        env,
      });
    } catch (e) {
      r = resposta(502, { erro: "indisponivel" }, { "Cache-Control": "no-store" });
    }
    res.statusCode = r.status;
    for (const [k, v] of Object.entries(r.cabecalhos)) res.setHeader(k, v);
    if (r.corpo === null) return res.end();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(r.corpo));
  };
}
