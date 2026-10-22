// Função da Vercel: registra um passo de quem abriu o link do Painel Renderiza (/exemplos?c=<código do lead>)
// ou a demo de um lead (/demo/<pasta>). O navegador (exemplos/visitas.js) manda { c, p, e, d, v, s, eq, demo }:
// código, página, evento, detalhe, visitante, sessão, se é da equipe e a pasta da demo. Aqui entram o IP, a cidade (cabeçalhos da Vercel) e o aparelho (user-agent), e tudo
// vai para a função registrar_visita do Supabase com a chave PÚBLICA (nunca a secreta). Robôs (a prévia do
// link no WhatsApp, buscadores) não contam. Responde 204 sempre: o contador nunca atrapalha a página.

const ROBO = /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp\/|telegrambot|preview|headless|lighthouse/i;

/** "celular · Android · Chrome", a partir do user-agent. */
export function aparelhoDe(ua = "") {
  const tipo = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? "tablet" : /Mobi|iPhone|iPod|Android/i.test(ua) ? "celular" : "computador";
  const sistema = /iPhone|iPod/i.test(ua) ? "iPhone" : /iPad/i.test(ua) ? "iPad" : /Android/i.test(ua) ? "Android" : /Windows/i.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua) ? "Mac" : /CrOS/i.test(ua) ? "Chromebook" : /Linux/i.test(ua) ? "Linux" : "";
  const navegador = /Instagram/i.test(ua) ? "Instagram" : /FBAN|FBAV|FB_IAB/i.test(ua) ? "Facebook" : /WhatsApp/i.test(ua) ? "WhatsApp"
    : /Edg\//i.test(ua) ? "Edge" : /SamsungBrowser/i.test(ua) ? "Samsung Internet" : /OPR\/|Opera/i.test(ua) ? "Opera"
    : /CriOS|Chrome\//i.test(ua) ? "Chrome" : /FxiOS|Firefox\//i.test(ua) ? "Firefox" : /Safari\//i.test(ua) ? "Safari" : "";
  return [tipo, sistema, navegador].filter(Boolean).join(" · ");
}

const cabecalho = (h, nome) => {
  const v = h && (typeof h.get === "function" ? h.get(nome) : h[nome]);
  return Array.isArray(v) ? v[0] : v || "";
};

/** IP de quem abriu: o primeiro do x-forwarded-for (a Vercel põe o do visitante na frente). */
export function ipDe(h) {
  return (String(cabecalho(h, "x-forwarded-for")).split(",")[0] || cabecalho(h, "x-real-ip") || "").trim().slice(0, 64);
}

/** "São Paulo · SP" (fora do Brasil, com o país), pelos cabeçalhos de localização da Vercel. */
export function localDe(h) {
  let cidade = cabecalho(h, "x-vercel-ip-city");
  try { cidade = decodeURIComponent(cidade); } catch (e) { /* fica como veio */ }
  const estado = cabecalho(h, "x-vercel-ip-country-region"), pais = cabecalho(h, "x-vercel-ip-country");
  return [cidade, estado, pais && pais !== "BR" ? pais : ""].filter(Boolean).join(" · ").slice(0, 80);
}

/**
 * Corpo do navegador ({ c, p, e, d, v, s, eq, demo }) já no formato da função registrar_visita, ou null se não
 * serve. Nas demos das óticas (p "demo") não há código: o lead vem da pasta da demo.
 */
export function paraRegistro(corpo, h) {
  if (!corpo || typeof corpo !== "object" || typeof corpo.e !== "string" || typeof corpo.p !== "string") return null;
  const codigo = String(corpo.c || "").toLowerCase();
  const demo = corpo.p === "demo" ? String(corpo.demo || "").toLowerCase() : "";
  if (corpo.p === "demo" ? !/^[a-z0-9][a-z0-9-]{0,79}$/.test(demo) : !/^[a-z0-9]{3,8}$/.test(codigo)) return null;
  const ua = String(cabecalho(h, "user-agent"));
  if (ROBO.test(ua)) return null;
  const detalhe = corpo.d && typeof corpo.d === "object" && !Array.isArray(corpo.d) ? corpo.d : {};
  return {
    p_codigo: /^[a-z0-9]{3,8}$/.test(codigo) ? codigo : "", p_pagina: corpo.p.slice(0, 40), p_evento: corpo.e.slice(0, 40), p_detalhe: detalhe,
    p_visitante: String(corpo.v || "").slice(0, 24), p_sessao: String(corpo.s || "").slice(0, 24), p_equipe: corpo.eq === true,
    p_ip: ipDe(h), p_local: localDe(h), p_aparelho: aparelhoDe(ua), p_demo: demo,
  };
}

async function lerCorpo(req) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch (e) { return null; } }
    if (Buffer.isBuffer(req.body)) { try { return JSON.parse(req.body.toString("utf8")); } catch (e) { return null; } }
    return req.body;
  }
  let texto = "";
  for await (const parte of req) { texto += parte; if (texto.length > 4000) return null; }
  try { return JSON.parse(texto); } catch (e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  try {
    if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
    const registro = paraRegistro(await lerCorpo(req), req.headers);
    const env = process.env;
    const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
    const chave = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    if (registro && url && chave && !chave.startsWith("sb_secret_")) {
      const cabecalhos = { apikey: chave, "Content-Type": "application/json" };
      if (chave.split(".").length === 3) cabecalhos.Authorization = "Bearer " + chave; // chave antiga (JWT anon)
      await fetch(url.replace(/\/+$/, "") + "/rest/v1/rpc/registrar_visita", {
        method: "POST", headers: cabecalhos, body: JSON.stringify(registro), signal: AbortSignal.timeout(3000),
      }).catch(() => {});
    }
  } catch (e) { /* nunca derruba a página */ }
  res.statusCode = 204;
  res.end();
}
