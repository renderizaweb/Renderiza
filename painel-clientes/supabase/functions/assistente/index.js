// Função "assistente" (Supabase Edge Function, Deno; Missão 7, bloco D): a IA do onboarding. A lógica mora em
// logica.js; aqui só o Supabase, o SDK da Anthropic e o Deno. A chave da Anthropic fica só no ambiente da função
// (segredo ANTHROPIC_API_KEY, posto pela Renderiza no Supabase); sem ela, a função responde "sem IA" e o painel segue o
// roteiro fixo. O modelo vem de IA_MODELO (padrão: claude-opus-5-5).
// Publicar: node supabase/functions/publicar.mjs stg --so assistente (e producao), STG primeiro.

import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import { atender, MODELO_PADRAO, TETO_PADRAO } from "./logica.js";

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
const CHAVE_DA_IA = Deno.env.get("ANTHROPIC_API_KEY");
const MODELO = Deno.env.get("IA_MODELO") || MODELO_PADRAO;
// o painel desiste em poucos segundos e segue o roteiro fixo; aqui, um limite um pouco maior e uma nova tentativa
const claude = CHAVE_DA_IA ? new Anthropic({ apiKey: CHAVE_DA_IA, timeout: 20000, maxRetries: 1 }) : null;

const deps = {
  temChave: !!claude,
  async usuarioDoToken(token) {
    const { data, error } = await admin.auth.getUser(token);
    if (error) throw error;
    return data.user;
  },
  async podeUsar(usuarioId, contaId) {
    const { data: pessoa } = await admin.from("pessoas").select("id").eq("conta_id", contaId).eq("usuario_id", usuarioId).eq("ativa", true).eq("dono", true).maybeSingle();
    if (!pessoa) return null;
    const [{ data: conta }, { data: contexto }] = await Promise.all([
      admin.from("contas").select("id, nome, nicho").eq("id", contaId).single(),
      admin.from("contas_contexto").select("dados, conversa").eq("conta_id", contaId).maybeSingle(),
    ]);
    return conta ? { conta, contexto, modelo: MODELO } : null;
  },
  async gasto(contaId) {
    const desde = new Date(Date.now() - 3600000).toISOString();
    const [{ data: uso }, { data: teto }, { count }] = await Promise.all([
      admin.from("ia_uso").select("custo_usd").eq("conta_id", contaId),
      admin.from("ia_contas").select("teto_usd").eq("conta_id", contaId).maybeSingle(),
      admin.from("ia_uso").select("id", { count: "exact", head: true }).eq("conta_id", contaId).gte("criado_em", desde),
    ]);
    return { usd: (uso || []).reduce((s, x) => s + Number(x.custo_usd || 0), 0), teto: teto ? Number(teto.teto_usd) : TETO_PADRAO, naHora: count || 0 };
  },
  claude: pedido => claude.messages.create(pedido),
  async registrar(uso) {
    const { error } = await admin.from("ia_uso").insert(uso);
    if (error) throw error;
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
