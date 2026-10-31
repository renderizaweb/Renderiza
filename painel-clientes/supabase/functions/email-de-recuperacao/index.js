// Função "email-de-recuperacao" (Supabase Edge Function, Deno; Missão 7, D42): o e-mail opcional de quem entra com
// usuário. A lógica mora em logica.js; aqui só o Supabase, o Brevo e o Deno. No ambiente: a chave secreta (o Supabase
// põe) e BREVO_API_KEY (a Renderiza põe em Edge Functions → Secrets). verify_jwt desligado: o "recuperar" é sem login,
// e o resto confere o login sozinho.
// Publicar: node supabase/functions/publicar.mjs stg --so email-de-recuperacao (e producao), STG primeiro.

import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import { atender, DOMINIO_DO_USUARIO } from "./logica.js";

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
const tabela = () => admin.from("emails_de_recuperacao");

const deps = {
  temChave: Boolean(BREVO),
  async usuarioDoToken(token) {
    const { data, error } = await admin.auth.getUser(token);
    if (error) throw error;
    return data.user;
  },
  async linha(usuarioId) {
    const { data, error } = await tabela().select("*").eq("usuario_id", usuarioId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async gravar(usuarioId, campos) {
    const { error } = await tabela().upsert({ usuario_id: usuarioId, ...campos }, { onConflict: "usuario_id" });
    if (error) throw error;
  },
  async apagar(usuarioId) {
    const { error } = await tabela().delete().eq("usuario_id", usuarioId);
    if (error) throw error;
  },
  async loginDoUsuario(usuario) {
    const email = `${usuario}@${DOMINIO_DO_USUARIO}`;
    const { data, error } = await admin.rpc("login_do_email", { p_email: email });
    if (error) throw error;
    return data ? { id: data, email } : null;
  },
  async linhasPeloEmail(email) {
    const { data, error } = await tabela().select("usuario_id, email, ultimo_envio_em").eq("email", email).not("confirmado_em", "is", null).limit(3);
    if (error) throw error;
    return data || [];
  },
  async emailDoLogin(usuarioId) {
    const { data, error } = await admin.auth.admin.getUserById(usuarioId);
    if (error) return null;
    return data.user && data.user.email;
  },
  async linkDeSenhaNova(email, destino) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo: destino } });
    if (error) throw error;
    return data.properties.action_link;
  },
  async enviar({ para, assunto, html, texto }) {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Painel Renderiza", email: "nao-responda@renderizaweb.com.br" },
        replyTo: { email: "contato@renderizaweb.com.br" },
        to: [{ email: para }],
        subject: assunto,
        htmlContent: html,
        textContent: texto,
        tags: ["recuperar-senha"],
      }),
    });
    if (!r.ok) throw new Error(`Brevo ${r.status}`);
  },
};

Deno.serve(async req => {
  const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const r = await atender({ metodo: req.method, origem: req.headers.get("origin") || "", token, corpo }, deps);
  return new Response(r.corpo === null ? null : JSON.stringify(r.corpo), {
    status: r.status,
    headers: { ...r.headers, "Content-Type": "application/json; charset=utf-8" },
  });
});
