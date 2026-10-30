// Função "aceitar-convite" (Supabase Edge Function, Deno; Missão 7, bloco B). A lógica mora em logica.js; aqui só o
// Supabase e o Deno. Publicar: node supabase/functions/publicar.mjs stg --so aceitar-convite (e producao), STG primeiro.

import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import { atender } from "./logica.js";

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
const SECRETA = chave("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(URL_DO_PROJETO, SECRETA, { auth: { persistSession: false, autoRefreshToken: false } });

const deps = {
  async convite(codigo) {
    const { data, error } = await admin.from("convites")
      .select("id, conta_id, email, usuario, nome, pela_renderiza, link_usado_em, aceito_em, cancelado_em, expira_em").eq("link_codigo", codigo).maybeSingle();
    if (error) throw error;
    return data;
  },
  async loginDoEmail(email) {
    const { data, error } = await admin.rpc("login_do_email", { p_email: email });
    if (error) throw error;
    return data;
  },
  async podeUsarLogin(c) {
    const { data, error } = await admin.rpc("convite_pode_usar_login", { p_conta: c.conta_id, p_email: c.email, p_pela_renderiza: !!c.pela_renderiza });
    if (error) throw error;
    return data === true;
  },
  async criarLogin(email, senha, nome) {
    const { error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } });
    if (error) throw error;
  },
  async trocarSenha(id, senha) {
    const { error } = await admin.auth.admin.updateUserById(id, { password: senha });
    if (error) throw error;
  },
  async marcarUsado(id) {
    const { data, error } = await admin.from("convites").update({ link_usado_em: new Date().toISOString() }).eq("id", id).is("link_usado_em", null).select("id");
    if (error) throw error;
    return data.length === 1;
  },
  async desmarcar(id) {
    const { error } = await admin.from("convites").update({ link_usado_em: null }).eq("id", id);
    if (error) throw error;
  },
};

Deno.serve(async req => {
  const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const r = await atender({ metodo: req.method, origem: req.headers.get("origin") || "", corpo }, deps);
  return new Response(r.corpo === null ? null : JSON.stringify(r.corpo), {
    status: r.status,
    headers: { ...r.headers, "Content-Type": "application/json; charset=utf-8" },
  });
});
