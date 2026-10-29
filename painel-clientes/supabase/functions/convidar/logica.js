// A lógica da função "convidar" (Supabase Edge Function), sem nada do Deno: testada em test/convite.test.mjs.
// O dono grava o convite (tabela convites, com a RLS dele) e chama esta função, que manda o e-mail:
// - e-mail que ainda não tem login: o convite do Supabase Auth (o modelo supabase/emails/convite.html, com o nome da
//   conta), que leva a /convite para criar a senha;
// - e-mail que já tem login (alguém de outra conta): o link de acesso, que leva direto ao painel; ao entrar, o
//   painel aceita o convite (public.aceitar_convites).
// Quem pode convidar é o banco que diz: a função lê o convite com o login de quem chamou; se a RLS não deixa, não
// manda nada. A chave secreta fica no ambiente da função (nunca no navegador nem no repositório).

const ORIGENS = [
  /^https:\/\/painel\.renderizaweb\.com\.br$/,
  /^https:\/\/renderiza-painel-clientes(-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost:5180$/,
];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Só endereços do próprio painel (a mesma lista do Auth: scripts/lib/auth.mjs), na tela /convite. */
export function destinoPermitido(destino) {
  try {
    const u = new URL(destino);
    return ORIGENS.some(re => re.test(u.origin)) && u.pathname === "/convite";
  } catch (e) {
    return false;
  }
}

export function cabecalhosCors(origem) {
  return {
    "Access-Control-Allow-Origin": ORIGENS.some(re => re.test(origem || "")) ? origem : "https://painel.renderizaweb.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

/** Erro do Auth em português (o resto vira uma frase genérica, sem detalhe técnico para quem usa). */
export function traduzirErro(e) {
  const msg = String((e && e.message) || e || "");
  if ((e && e.status === 429) || /rate limit|too many|security purposes/i.test(msg)) return "Muitos e-mails em pouco tempo. Espere alguns minutos e tente de novo.";
  if (/invalid.*email|email.*invalid/i.test(msg)) return "Esse e-mail não parece certo. Confira.";
  return "O e-mail não saiu agora. Tente de novo em alguns minutos.";
}

/**
 * Atende o pedido. `deps`: { usuario(token), convite(token, id), convidar(email, dados, destino), mandarAcesso(email, destino) }.
 * Devolve { status, corpo, headers }.
 */
export async function atender({ metodo, origem, token, corpo, agora = Date.now() }, deps) {
  const headers = cabecalhosCors(origem);
  const responder = (status, conteudo) => ({ status, corpo: conteudo, headers });
  if (metodo === "OPTIONS") return responder(204, null);
  if (metodo !== "POST") return responder(405, { erro: "Use POST." });
  if (!token) return responder(401, { erro: "Entre de novo no painel." });
  const usuario = await deps.usuario(token);
  if (!usuario) return responder(401, { erro: "Sua sessão expirou. Entre de novo." });

  const id = corpo && corpo.convite;
  const destino = corpo && corpo.destino;
  if (!UUID.test(String(id || ""))) return responder(400, { erro: "Convite inválido." });
  if (!destinoPermitido(destino)) return responder(400, { erro: "Endereço de volta não permitido." });

  const convite = await deps.convite(token, id);
  if (!convite) return responder(404, { erro: "Convite não encontrado (ou você não pode convidar nesta conta)." });
  if (convite.aceito_em) return responder(409, { erro: "Esse convite já foi aceito." });
  if (convite.cancelado_em) return responder(409, { erro: "Esse convite foi cancelado." });
  if (Date.parse(convite.expira_em) <= agora) return responder(409, { erro: "Esse convite venceu. Use “Reenviar”." });

  try {
    const { jaExiste } = await deps.convidar(convite.email, { nome_da_conta: convite.nome_da_conta, nome: convite.nome || undefined }, destino);
    if (!jaExiste) return responder(200, { enviado: "convite" });
    // já tem login: o link de acesso leva direto ao painel, que aceita o convite ao entrar
    await deps.mandarAcesso(convite.email, new URL("/", destino).toString());
    return responder(200, { enviado: "acesso" });
  } catch (e) {
    return responder(502, { erro: traduzirErro(e) });
  }
}
