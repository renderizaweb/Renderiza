// A lógica da função "aceitar-convite" (Supabase Edge Function; Missão 7, bloco B; D42), sem nada do Deno: testada
// em test/convite-link.test.mjs. Quem abre /boas-vindas/<código> cria a senha aqui: a função confere o convite pelo
// código (não usado, não vencido, não cancelado), cria o login com o e-mail interno do usuário e a senha (ou troca a
// senha, se o usuário já existe: o link novo de quem esqueceu) e marca o link como usado. O painel entra em seguida
// com o usuário e a senha, e o aceitar_convites() de sempre põe a pessoa na conta. Não precisa de login para chamar.

const ORIGENS = [
  /^https:\/\/painel\.renderizaweb\.com\.br$/,
  /^https:\/\/renderiza-painel-clientes(-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];
const CODIGO = /^[a-z0-9]{24,64}$/;

export function cabecalhosCors(origem) {
  return {
    "Access-Control-Allow-Origin": ORIGENS.some(re => re.test(origem || "")) ? origem : "https://painel.renderizaweb.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

/** A senha que o login aceita (scripts/lib/auth.mjs: no mínimo 8). */
export function senhaValida(senha) {
  const s = String(senha || "");
  if (s.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (s.length > 72) return "A senha pode ter no máximo 72 caracteres.";
  return "";
}

/** Erro do Auth em português, sem detalhe técnico. */
export function traduzirErro(e) {
  const msg = String((e && e.message) || e || "");
  if (/password|senha/i.test(msg) && /weak|short|least|characters/i.test(msg)) return "Essa senha é fraca. Use pelo menos 8 caracteres, misturando letras e números.";
  if ((e && e.status === 429) || /rate limit|too many/i.test(msg)) return "Muitas tentativas. Espere um minuto e tente de novo.";
  return "Não deu para criar o acesso agora. Tente de novo em instantes.";
}

/**
 * Atende o pedido. `deps`: { convite(codigo), loginDoEmail(email), podeUsarLogin(convite), criarLogin(email, senha,
 * nome), trocarSenha(id, senha), marcarUsado(idDoConvite) → true se marcou agora, desmarcar(idDoConvite) }. Devolve
 * { status, corpo, headers }; no sucesso, o e-mail interno para o painel entrar.
 * O link é marcado antes de mexer no login (dois toques ao mesmo tempo não usam o mesmo link duas vezes) e desmarcado
 * se o login falhar. Trocar a senha de quem já tem login só vale se o convite pode (migração 20261030233000: a
 * Renderiza, ou o dono para quem só está na conta dele).
 */
export async function atender({ metodo, origem, corpo, agora = Date.now() }, deps) {
  const headers = cabecalhosCors(origem);
  const responder = (status, conteudo) => ({ status, corpo: conteudo, headers });
  if (metodo === "OPTIONS") return responder(204, null);
  if (metodo !== "POST") return responder(405, { erro: "Use POST." });

  const codigo = String((corpo && corpo.codigo) || "");
  const senha = (corpo && corpo.senha) || "";
  if (!CODIGO.test(codigo)) return responder(404, { erro: "Este link não vale. Peça um novo a quem mandou." });
  const problema = senhaValida(senha);
  if (problema) return responder(400, { erro: problema, campo: "senha" });

  const convite = await deps.convite(codigo);
  const usado = () => responder(409, { erro: `Este link já foi usado. Entre com o usuário ${convite.usuario} e a sua senha.`, motivo: "usado" });
  if (!convite || convite.cancelado_em) return responder(404, { erro: "Este link não vale. Peça um novo a quem mandou." });
  if (convite.link_usado_em) return usado();
  if (Date.parse(convite.expira_em) <= agora) return responder(410, { erro: "Este link venceu. Peça um novo a quem mandou.", motivo: "vencido" });

  let marcou = false;
  try {
    const id = await deps.loginDoEmail(convite.email);
    if (id && !(await deps.podeUsarLogin(convite))) {
      return responder(403, { erro: "Este link não pode trocar a senha desse usuário. Peça um link novo à Renderiza.", motivo: "outra_pessoa" });
    }
    marcou = await deps.marcarUsado(convite.id);
    if (!marcou) return usado();
    if (id) await deps.trocarSenha(id, senha);
    else await deps.criarLogin(convite.email, senha, convite.nome || convite.usuario);
    return responder(200, { email: convite.email, usuario: convite.usuario, novo: !id });
  } catch (e) {
    if (marcou) await deps.desmarcar(convite.id).catch(() => {});
    return responder(502, { erro: traduzirErro(e) });
  }
}
