// A lógica da função "email-de-recuperacao" (Missão 7; D42, o e-mail opcional), sem nada do Deno: testada em
// test/email-de-recuperacao.test.mjs. Quem entra com usuário (o convite por link) não tem e-mail para recuperar a
// senha; aqui ele põe um, confirmado por um código de 6 números (15 minutos, 5 tentativas, um envio por minuto), e o
// "Esqueci a senha" manda o link da senha nova para esse e-mail. O pedido de link sempre responde igual (exista o
// usuário ou não): ninguém descobre por aqui quem tem conta. Os e-mails saem pelo Brevo.

const ORIGENS = [
  /^https:\/\/painel\.renderizaweb\.com\.br$/,
  /^https:\/\/renderiza-painel-clientes(-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];
export const DOMINIO_DO_USUARIO = "acesso.renderizaweb.com.br";
const USUARIO = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const VALIDADE_DO_CODIGO = 15 * 60000;
export const TENTATIVAS = 5;
export const ENTRE_ENVIOS = 60000;

export function cabecalhosCors(origem) {
  return {
    "Access-Control-Allow-Origin": ORIGENS.some(re => re.test(origem || "")) ? origem : "https://painel.renderizaweb.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export const normalizarEmail = e => String(e || "").trim().toLowerCase();
export const emailValido = e => EMAIL.test(e) && e.length <= 254 && !e.endsWith("@" + DOMINIO_DO_USUARIO);

/** Só volta para a tela /nova-senha do próprio painel. */
export function destinoValido(destino) {
  try {
    const u = new URL(String(destino || ""));
    return ORIGENS.some(re => re.test(u.origin)) && u.pathname === "/nova-senha" ? u.origin + u.pathname : null;
  } catch (e) { return null; }
}

/** Um código de 6 números, sorteado. */
export function novoCodigo(aleatorio = n => crypto.getRandomValues(new Uint32Array(n))) {
  return String(aleatorio(1)[0] % 1000000).padStart(6, "0");
}

/** O código cifrado (SHA-256 do usuário com o código): o banco nunca guarda o código. */
export async function cifrar(usuarioId, codigo) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${usuarioId}:${codigo}`));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function emailDoCodigo(codigo) {
  return {
    assunto: `${codigo} é o seu código do Painel Renderiza`,
    texto: `Seu código para confirmar o e-mail no Painel Renderiza: ${codigo}\n\nEle vale por 15 minutos. Se não foi você, é só ignorar.`,
    html: `<p>Seu código para confirmar o e-mail no Painel Renderiza:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${codigo}</p><p>Ele vale por 15 minutos. Se não foi você, é só ignorar.</p>`,
  };
}

export function emailDoLink(link, usuario) {
  const seguro = String(link).replace(/"/g, "%22");
  return {
    assunto: "Crie uma senha nova no Painel Renderiza",
    texto: `Para criar uma senha nova no Painel Renderiza${usuario ? ` (usuário ${usuario})` : ""}, abra o link:\n${link}\n\nSe não foi você, é só ignorar: a senha de agora continua valendo.`,
    html: `<p>Para criar uma senha nova no Painel Renderiza${usuario ? ` (usuário <b>${usuario}</b>)` : ""}, toque no botão:</p><p><a href="${seguro}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#1e2528;color:#fff;text-decoration:none;font-weight:600">Criar a senha nova</a></p><p>Se não foi você, é só ignorar: a senha de agora continua valendo.</p>`,
  };
}

/**
 * Atende o pedido. `corpo.acao`: "pedir" (com login: { email }), "confirmar" (com login: { codigo }), "tirar" (com
 * login) ou "recuperar" (sem login: { usuario } ou { email }, e o destino /nova-senha). `deps`: { temChave,
 * usuarioDoToken(token), linha(usuarioId), gravar(usuarioId, campos), apagar(usuarioId), loginDoUsuario(usuario) →
 * { id, email } | null, linhasPeloEmail(email) → [{ usuario_id, email, ultimo_envio_em }] (só os confirmados), emailDoLogin(usuarioId), linkDeSenhaNova(
 * emailDoLogin, destino), enviar({ para, assunto, texto, html }) }. Devolve { status, corpo, headers }.
 */
export async function atender({ metodo, origem, token, corpo, agora = Date.now() }, deps) {
  const headers = cabecalhosCors(origem);
  const responder = (status, conteudo) => ({ status, corpo: conteudo, headers });
  if (metodo === "OPTIONS") return responder(204, null);
  if (metodo !== "POST") return responder(405, { erro: "Use POST." });
  const acao = corpo && corpo.acao;

  // sem login: o link da senha nova (a resposta é sempre a mesma)
  if (acao === "recuperar") {
    const destino = destinoValido(corpo.destino);
    if (!destino) return responder(400, { erro: "Pedido fora do formato." });
    const mesma = responder(200, { ok: true });
    if (!deps.temChave) return mesma;
    const alvos = []; // { usuarioId, emailDoLogin, para, usuario, envio }
    const usuario = String(corpo.usuario || "").trim().toLowerCase();
    const email = normalizarEmail(corpo.email);
    if (USUARIO.test(usuario)) {
      const login = await deps.loginDoUsuario(usuario);
      const r = login && (await deps.linha(login.id));
      if (r && r.email && r.confirmado_em) alvos.push({ usuarioId: login.id, emailDoLogin: login.email, para: r.email, usuario, envio: r.ultimo_envio_em });
    } else if (EMAIL.test(email)) {
      // o mesmo e-mail pode servir a mais de um usuário (o dono e alguém da equipe): um link para cada, com o nome dele
      for (const r of (await deps.linhasPeloEmail(email)).slice(0, 3)) {
        const doLogin = await deps.emailDoLogin(r.usuario_id);
        if (doLogin) alvos.push({ usuarioId: r.usuario_id, emailDoLogin: doLogin, para: r.email, usuario: doLogin.endsWith("@" + DOMINIO_DO_USUARIO) ? doLogin.split("@")[0] : "", envio: r.ultimo_envio_em });
      }
    }
    for (const alvo of alvos) {
      if (alvo.envio && agora - Date.parse(alvo.envio) < ENTRE_ENVIOS) continue;
      try {
        const link = await deps.linkDeSenhaNova(alvo.emailDoLogin, destino);
        await deps.gravar(alvo.usuarioId, { ultimo_envio_em: new Date(agora).toISOString() });
        await deps.enviar({ para: alvo.para, ...emailDoLink(link, alvo.usuario) });
      } catch (e) { /* a resposta continua a mesma */ }
    }
    return mesma;
  }

  // com login: pôr, confirmar ou tirar o e-mail
  const usuario = token ? await deps.usuarioDoToken(token).catch(() => null) : null;
  if (!usuario) return responder(401, { erro: "Entre de novo." });
  if (acao === "tirar") {
    await deps.apagar(usuario.id);
    return responder(200, { ok: true });
  }
  if (!deps.temChave) return responder(503, { erro: "O envio de e-mail ainda não está ligado. Tente mais tarde." });
  const r = (await deps.linha(usuario.id)) || {};

  if (acao === "pedir") {
    const email = normalizarEmail(corpo.email);
    if (!emailValido(email)) return responder(400, { erro: "Confira o e-mail.", campo: "email" });
    if (r.ultimo_envio_em && agora - Date.parse(r.ultimo_envio_em) < ENTRE_ENVIOS) return responder(429, { erro: "Espere um minuto para pedir outro código." });
    const codigo = novoCodigo();
    await deps.gravar(usuario.id, {
      email_pendente: email, codigo_hash: await cifrar(usuario.id, codigo), codigo_expira_em: new Date(agora + VALIDADE_DO_CODIGO).toISOString(),
      tentativas: 0, ultimo_envio_em: new Date(agora).toISOString(),
    });
    try {
      await deps.enviar({ para: email, ...emailDoCodigo(codigo) });
    } catch (e) {
      return responder(502, { erro: "O e-mail não saiu agora. Tente de novo em instantes." });
    }
    return responder(200, { ok: true });
  }

  if (acao === "confirmar") {
    const codigo = String(corpo.codigo || "").replace(/\D/g, "");
    if (!r.codigo_hash || !r.codigo_expira_em || Date.parse(r.codigo_expira_em) <= agora) return responder(410, { erro: "O código venceu. Peça outro." });
    if ((r.tentativas || 0) >= TENTATIVAS) return responder(429, { erro: "Muitas tentativas. Peça outro código." });
    if (codigo.length !== 6 || (await cifrar(usuario.id, codigo)) !== r.codigo_hash) {
      await deps.gravar(usuario.id, { tentativas: (r.tentativas || 0) + 1 });
      return responder(400, { erro: "Esse código não confere.", campo: "codigo" });
    }
    await deps.gravar(usuario.id, { email: r.email_pendente, confirmado_em: new Date(agora).toISOString(), email_pendente: null, codigo_hash: null, codigo_expira_em: null, tentativas: 0 });
    return responder(200, { ok: true, email: r.email_pendente });
  }

  return responder(400, { erro: "Pedido fora do formato." });
}
