// Função da Vercel: o botão "Reabrir por 1 hora, grátis" da página de demo fora do ar (middleware.js). Chama a
// função reabrir_demo do Supabase com a chave PÚBLICA (nunca a secreta): só reabre demo vencida (não a desligada no
// painel), uma vez por demo, por 1 hora; a partir da segunda vez, só pelo painel. Responde { ok, motivo, ate }.

import { lerCorpo } from "./visita.js";

/** Pasta válida do corpo { pasta }, ou "". */
export const pastaDoPedido = corpo => {
  const p = String((corpo && corpo.pasta) || "").toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(p) ? p : "";
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const responder = (status, corpo) => { res.statusCode = status; res.end(JSON.stringify(corpo)); };
  try {
    if (req.method !== "POST") return responder(405, { ok: false, motivo: "metodo" });
    const pasta = pastaDoPedido(await lerCorpo(req));
    if (!pasta) return responder(400, { ok: false, motivo: "pasta" });
    const env = process.env;
    const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
    const chave = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    if (!url || !chave || chave.startsWith("sb_secret_")) return responder(200, { ok: false, motivo: "sem_banco" });
    const cabecalhos = { apikey: chave, "Content-Type": "application/json" };
    if (chave.split(".").length === 3) cabecalhos.Authorization = "Bearer " + chave; // chave antiga (JWT anon)
    const r = await fetch(url.replace(/\/+$/, "") + "/rest/v1/rpc/reabrir_demo", {
      method: "POST", headers: cabecalhos, body: JSON.stringify({ pasta }), signal: AbortSignal.timeout(4000),
    });
    const v = r.ok ? await r.json() : null;
    return responder(200, v && typeof v === "object" ? { ok: !!v.ok, motivo: String(v.motivo || ""), ...(v.ate ? { ate: v.ate } : {}) } : { ok: false, motivo: "banco" });
  } catch (e) {
    return responder(200, { ok: false, motivo: "erro" });
  }
}
