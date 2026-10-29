// A API de gerenciamento do Supabase (api.supabase.com), com o token da conta nova do Painel Renderiza
// (PAINEL_SUPABASE_ACCESS_TOKEN). É por ela que o script aplica as migrações: a senha do banco não fica no ambiente.
// O token nunca é impresso.

const API = "https://api.supabase.com/v1";
export const PROJETO_DA_PROSPECCAO = "gxdwluswpczlfgvzxqvg";

function token() {
  const t = process.env.PAINEL_SUPABASE_ACCESS_TOKEN;
  if (!t) throw new Error("Falta PAINEL_SUPABASE_ACCESS_TOKEN no ambiente (docs/painel-clientes/missoes.md, Missão 1, item 3).");
  return t;
}

async function chamar(caminho, { metodo = "GET", corpo } = {}) {
  let r;
  try {
    r = await fetch(API + caminho, {
      method: metodo,
      headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch (e) {
    throw new Error("Sem conexão com a API do Supabase: " + e.message);
  }
  const texto = await r.text();
  let dados;
  try { dados = JSON.parse(texto); } catch (e) { dados = texto; }
  if (!r.ok) {
    const msg = (dados && dados.message) || texto || r.statusText;
    throw new Error(`Supabase respondeu ${r.status}: ${String(msg).trim()}`);
  }
  return dados;
}

/** O ref do projeto a partir da URL (https://<ref>.supabase.co). */
export function refDaUrl(url) {
  const m = String(url || "").match(/^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/);
  return m ? m[1] : null;
}

export const projeto = ref => chamar(`/projects/${ref}`);

/** Roda SQL no banco do projeto. Várias instruções rodam numa transação só (conferido no STG em 29/10/2026). */
export function consultar(ref, sql, { somenteLeitura = false } = {}) {
  if (ref === PROJETO_DA_PROSPECCAO) throw new Error("Esse é o banco do Painel de prospecção: nunca é tocado.");
  return chamar(`/projects/${ref}/database/query`, { metodo: "POST", corpo: somenteLeitura ? { query: sql, read_only: true } : { query: sql } });
}
