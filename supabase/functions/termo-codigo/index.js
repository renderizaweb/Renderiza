// Função "termo-codigo" (Supabase Edge Function, Deno), no projeto do Supabase da prospecção. A lógica mora em
// logica.js; aqui só o Supabase, o Brevo e o Deno. Publicada sem exigir login (verify_jwt false): a página do termo é
// pública, e os limites ficam no banco (registrar_codigo_termo). No ambiente da função: a chave secreta (o Supabase
// põe) e BREVO_API_KEY (a Renderiza põe em Edge Functions → Secrets; nunca no repositório nem no chat).

import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import { atender, cabecalhosCors, ipDe } from "./logica.js";

/** As chaves que o Supabase põe no ambiente da função (as novas, em JSON; senão, as antigas). */
function chave(nova, antiga) {
  try {
    const todas = JSON.parse(Deno.env.get(nova) || "{}");
    if (todas.default) return todas.default;
    const primeira = Object.values(todas)[0];
    if (primeira) return primeira;
  } catch (e) { /* segue para a antiga */ }
  return Deno.env.get(antiga);
}
const admin = createClient(Deno.env.get("SUPABASE_URL"), chave("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
const BREVO = Deno.env.get("BREVO_API_KEY") || "";

const deps = {
  temChave: Boolean(BREVO),
  async registrar({ termo, email, hash, ip }) {
    const { data, error } = await admin.rpc("registrar_codigo_termo", { p_termo: termo, p_email: email, p_hash: hash, p_ip: ip });
    if (error) throw error;
    return data;
  },
  async comprovante({ termo, protocolo }) {
    const { data, error } = await admin.rpc("comprovante_termo", { p_termo: termo, p_protocolo: protocolo });
    if (error) throw error;
    return data;
  },
  async enviar({ para, copia, assunto, html, texto }) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Renderiza", email: "nao-responda@renderizaweb.com.br" },
        replyTo: { email: "contato@renderizaweb.com.br" },
        to: [{ email: para }],
        ...(copia ? { cc: [{ email: copia }] } : {}),
        subject: assunto,
        htmlContent: html,
        textContent: texto,
        tags: [copia ? "termo-comprovante" : "termo-codigo"],
      }),
    });
    if (!r.ok) throw new Error(`Brevo ${r.status}`);
  },
};

Deno.serve(async req => {
  const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const cabecalhos = Object.fromEntries(req.headers);
  const origem = req.headers.get("origin") || "";
  try {
    const r = await atender({ metodo: req.method, origem, ip: ipDe(cabecalhos), corpo }, deps);
    return new Response(r.corpo === null ? null : JSON.stringify(r.corpo), { status: r.status, headers: { ...r.headers, "Content-Type": "application/json; charset=utf-8" } });
  } catch (e) {
    console.error("termo-codigo", e && e.message);
    return new Response(JSON.stringify({ ok: false, erro: "falha" }), { status: 500, headers: { ...cabecalhosCors(origem), "Content-Type": "application/json; charset=utf-8" } });
  }
});
