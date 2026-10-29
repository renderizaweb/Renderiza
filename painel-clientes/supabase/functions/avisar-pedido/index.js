// Função "avisar-pedido" (Supabase Edge Function, Deno). A lógica mora em logica.js; aqui só o Supabase, o Brevo e o
// Deno. Publicar: node supabase/functions/publicar.mjs stg (e producao --projeto <ref>), STG primeiro.
// No ambiente da função: a chave secreta (o Supabase põe) e BREVO_API_KEY (a Renderiza põe em Edge Functions →
// Secrets, nos dois projetos; nunca no repositório nem no chat).

import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import { ambienteDe, atender } from "./logica.js";

const URL_DO_PROJETO = Deno.env.get("SUPABASE_URL");

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
const admin = createClient(URL_DO_PROJETO, chave("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
const BREVO = Deno.env.get("BREVO_API_KEY") || "";

const deps = {
  ambiente: ambienteDe(URL_DO_PROJETO),
  temChave: Boolean(BREVO),
  async aviso(pedido) {
    const { data, error } = await admin.rpc("aviso_do_pedido", { p_pedido: pedido });
    if (error) throw error;
    return data;
  },
  async enviar({ para, assunto, html, texto }) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Painel Renderiza", email: "nao-responda@renderizaweb.com.br" },
        replyTo: { email: "contato@renderizaweb.com.br" },
        to: para.map(email => ({ email })),
        subject: assunto,
        htmlContent: html,
        textContent: texto,
        tags: ["pedido-agenda-online"],
      }),
    });
    if (!r.ok) throw new Error(`Brevo ${r.status}`);
  },
};

Deno.serve(async req => {
  const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  try {
    const r = await atender({ metodo: req.method, corpo }, deps);
    return new Response(r.corpo === null ? null : JSON.stringify(r.corpo), { status: r.status, headers: { ...r.headers, "Content-Type": "application/json; charset=utf-8" } });
  } catch (e) {
    return new Response(JSON.stringify({ enviado: false }), { status: 502, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }
});
