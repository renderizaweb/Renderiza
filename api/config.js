// Função da Vercel: entrega ao navegador a URL do Supabase e a chave PÚBLICA (anon/publishable).
// Os valores vêm das variáveis de ambiente do projeto na Vercel; nada fica no código.
// A chave pública é feita para ir ao navegador: quem protege os dados são as políticas de RLS.
// Por segurança, esta função se recusa a entregar uma chave secreta (service_role / sb_secret_).

function papelDoJwt(chave) {
  try {
    const payload = chave.split(".")[1];
    return JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")).role || "";
  } catch (e) {
    return "";
  }
}

export default function handler(req, res) {
  const env = process.env;
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey =
    env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (supabaseAnonKey.startsWith("sb_secret_") || papelDoJwt(supabaseAnonKey) === "service_role") {
    res.statusCode = 500;
    res.end(JSON.stringify({ erro: "A chave configurada é secreta (service_role). Use a chave pública anon/publishable." }));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify({ supabaseUrl, supabaseAnonKey }));
}
