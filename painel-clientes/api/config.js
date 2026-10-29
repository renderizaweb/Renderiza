// Função da Vercel: entrega ao navegador a URL do Supabase e a chave PÚBLICA do Painel Renderiza.
// Na Vercel, SUPABASE_URL e SUPABASE_ANON_KEY: os da produção em Production e os do STG em Preview
// (docs/painel-clientes/04-arquitetura.md). Nada fica no código.
// A chave pública é feita para ir ao navegador: quem protege os dados é a RLS do banco.
// Por segurança, recusa chave secreta e o projeto do Painel de prospecção.

const PROJETO_DA_PROSPECCAO = "gxdwluswpczlfgvzxqvg";

function papelDoJwt(chave) {
  try {
    const payload = chave.split(".")[1];
    return JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")).role || "";
  } catch (e) {
    return "";
  }
}

/** Monta a resposta a partir das variáveis (process.env na Vercel; o servidor local passa as do STG). */
export function configDoAmbiente(env) {
  const supabaseUrl = env.SUPABASE_URL || "";
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) {
    return { status: 500, corpo: { erro: "Faltam SUPABASE_URL e SUPABASE_ANON_KEY no ambiente." } };
  }
  if (supabaseAnonKey.startsWith("sb_secret_") || papelDoJwt(supabaseAnonKey) === "service_role") {
    return { status: 500, corpo: { erro: "A chave configurada é secreta. Use a chave pública (sb_publishable_…)." } };
  }
  if (supabaseUrl.includes(PROJETO_DA_PROSPECCAO)) {
    return { status: 500, corpo: { erro: "Essa URL é do banco do Painel de prospecção, não do Painel Renderiza." } };
  }
  // "production" na Vercel; nos outros casos o painel mostra uma etiqueta para ninguém confundir com a produção.
  return { status: 200, corpo: { supabaseUrl, supabaseAnonKey, ambiente: env.VERCEL_ENV || "" } };
}

export function responder(res, { status, corpo }) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(corpo));
}

export default function handler(req, res) {
  responder(res, configDoAmbiente(process.env));
}
