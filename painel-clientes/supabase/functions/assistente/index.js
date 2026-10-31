// Função "assistente" (Supabase Edge Function, Deno; Missão 7, bloco D): a IA do onboarding. A lógica mora em
// logica.js; aqui só o Supabase, os SDKs oficiais dos fornecedores e o Deno. A chave fica só no ambiente da função
// (segredos postos pela Renderiza no Supabase): OPENAI_API_KEY (o padrão, D52) ou ANTHROPIC_API_KEY. Com as duas,
// IA_FORNECEDOR escolhe ("openai" ou "anthropic"); sem nenhuma, a função responde "sem IA" e o painel segue o roteiro
// fixo. O modelo vem de IA_MODELO (padrão: gpt-5.4-mini na OpenAI, claude-opus-5-5 na Anthropic).
// Publicar: node supabase/functions/publicar.mjs stg --so assistente (e producao), STG primeiro.

import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import OpenAI from "npm:openai@7.45.1";
import { atender, paraOpenAI, paraAnthropic, MODELOS_PADRAO, TETO_PADRAO } from "./logica.js";

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
/** O fornecedor da IA pela chave que estiver no ambiente (ou por IA_FORNECEDOR, com as duas). */
function iaDoAmbiente() {
  const chaves = { openai: Deno.env.get("OPENAI_API_KEY"), anthropic: Deno.env.get("ANTHROPIC_API_KEY") };
  const pedido = Deno.env.get("IA_FORNECEDOR");
  const fornecedor = chaves[pedido] ? pedido : chaves.openai ? "openai" : chaves.anthropic ? "anthropic" : null;
  if (!fornecedor) return null;
  const modelo = Deno.env.get("IA_MODELO") || MODELOS_PADRAO[fornecedor];
  // o painel desiste em poucos segundos e segue o roteiro fixo; aqui, um limite um pouco maior e uma nova tentativa
  if (fornecedor === "openai") {
    const cliente = new OpenAI({ apiKey: chaves.openai, timeout: 20000, maxRetries: 1 });
    return { fornecedor, modelo, chamar: p => cliente.responses.create(paraOpenAI(p, modelo)) };
  }
  const cliente = new Anthropic({ apiKey: chaves.anthropic, timeout: 20000, maxRetries: 1 });
  return { fornecedor, modelo, chamar: p => cliente.messages.create(paraAnthropic(p, modelo)) };
}

const deps = {
  ia: iaDoAmbiente(),
  async usuarioDoToken(token) {
    const { data, error } = await admin.auth.getUser(token);
    if (error) throw error;
    return data.user;
  },
  async podeUsar(usuarioId, contaId) {
    // as três ao mesmo tempo: a espera é da pessoa; sem ser o dono, o resto é descartado
    const [{ data: pessoa }, { data: conta }, { data: contexto }] = await Promise.all([
      admin.from("pessoas").select("id").eq("conta_id", contaId).eq("usuario_id", usuarioId).eq("ativa", true).eq("dono", true).maybeSingle(),
      admin.from("contas").select("id, nome, nicho").eq("id", contaId).maybeSingle(),
      admin.from("contas_contexto").select("dados, conversa").eq("conta_id", contaId).maybeSingle(),
    ]);
    return pessoa && conta ? { conta, contexto } : null;
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
