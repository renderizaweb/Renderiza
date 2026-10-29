// Função "convidar" (Supabase Edge Function, Deno). A lógica mora em logica.js; aqui só o Supabase e o Deno.
// Publicar: node supabase/functions/publicar.mjs stg (e producao --projeto <ref>), STG primeiro.

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
const PUBLICA = chave("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
const SECRETA = chave("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
const sem = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL_DO_PROJETO, SECRETA, sem);

const deps = {
  async usuario(token) {
    const { data, error } = await admin.auth.getUser(token);
    return error ? null : data.user;
  },
  // Com o login de quem chamou: a RLS de convites só deixa o dono (e a Renderiza) ler.
  async convite(token, id) {
    const comoQuemChamou = createClient(URL_DO_PROJETO, PUBLICA, { ...sem, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data, error } = await comoQuemChamou.from("convites")
      .select("id, email, nome, aceito_em, cancelado_em, expira_em, contas(nome)").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return { ...data, nome_da_conta: data.contas && data.contas.nome };
  },
  async convidar(email, dados, destino) {
    const { error } = await admin.auth.admin.inviteUserByEmail(email, { data: dados, redirectTo: destino });
    if (!error) return { jaExiste: false };
    if (error.code === "email_exists" || /already been registered|already exists/i.test(error.message)) return { jaExiste: true };
    throw error;
  },
  async mandarAcesso(email, destino) {
    const publico = createClient(URL_DO_PROJETO, PUBLICA, sem);
    const { error } = await publico.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: destino } });
    if (error) throw error;
  },
};

Deno.serve(async req => {
  const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const r = await atender({
    metodo: req.method,
    origem: req.headers.get("origin") || "",
    token: (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""),
    corpo,
  }, deps);
  return new Response(r.corpo === null ? null : JSON.stringify(r.corpo), {
    status: r.status,
    headers: { ...r.headers, "Content-Type": "application/json; charset=utf-8" },
  });
});
