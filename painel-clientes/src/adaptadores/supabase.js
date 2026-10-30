// Adaptador do Supabase: login por e-mail e senha e acesso ao banco (PostgREST) com a chave pública.
// Quem decide o que cada pessoa vê é a RLS do banco; daqui só saem erros já traduzidos.
// supabase-js por CDN, versão fixa (a mesma do Painel de prospecção, painel/src/adaptadores/supabase.js).

const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/+esm";

export function ehErroDeRede(e) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const txt = [e && e.name, e && e.message, e && e.details].filter(Boolean).join(" ");
  return /Failed to fetch|NetworkError|fetch failed|Load failed|Network request failed|ERR_|AuthRetryableFetchError|ECONNREFUSED/i.test(txt);
}

export function traduzir(e) {
  if (!e) return "Erro desconhecido.";
  if (ehErroDeRede(e)) return "Sem conexão. Confira a internet e tente de novo.";
  const msg = String(e.message || e);
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(msg)) return "Seu e-mail ainda não foi confirmado. Abra o link que enviamos por e-mail.";
  if (/should be different from the old password/i.test(msg)) return "A senha nova precisa ser diferente da atual.";
  if (/Password should be at least/i.test(msg)) return "A senha precisa ter pelo menos 8 caracteres.";
  if (/weak|pwned|leaked/i.test(msg) && /password/i.test(msg)) return "Essa senha é fácil de adivinhar. Escolha outra.";
  if (/Auth session missing|session_not_found/i.test(msg)) return "O link não vale mais. Peça um novo em \"Esqueci a senha\".";
  if (e.status === 429 || /rate limit|too many requests/i.test(msg)) return "Muitas tentativas seguidas. Espere um pouco e tente de novo.";
  if (e.code === "PGRST116") return "Registro não encontrado. Ele pode ter sido excluído.";
  if (e.code === "42501" || /row-level security/i.test(msg)) return "Você não tem permissão para isso.";
  if (e.code === "P0001") return msg; // regras do banco já respondem em português
  if (e.code === "PGRST301" || /JWT expired/i.test(msg)) return "Sua sessão expirou. Entre de novo.";
  return msg;
}

function erro(e) {
  const err = new Error(traduzir(e));
  err.rede = ehErroDeRede(e);
  err.sessao = !!e && (e.code === "PGRST301" || /JWT expired|invalid JWT/i.test(String(e.message)));
  err.original = e;
  return err;
}

/** `createClient` só é passado nos testes; no navegador vem do CDN. */
export async function criarAdaptadorSupabase({ url, chave, createClient }) {
  if (!createClient) {
    try {
      ({ createClient } = await import(SUPABASE_JS));
    } catch (e) {
      throw Object.assign(new Error("Não consegui carregar o painel. Confira a internet e recarregue a página."), { rede: true });
    }
  }
  const cliente = createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true } });

  const resultado = async consulta => {
    let r;
    try { r = await consulta; } catch (e) { throw erro(e); }
    if (r.error) throw erro(r.error);
    return r.data;
  };

  return {
    async sessao() {
      const { data } = await cliente.auth.getSession();
      return data.session;
    },
    async entrar(email, senha) {
      await resultado(cliente.auth.signInWithPassword({ email, password: senha }));
    },
    async sair() {
      await cliente.auth.signOut();
    },
    async pedirNovaSenha(email, destino) {
      await resultado(cliente.auth.resetPasswordForEmail(email, { redirectTo: destino }));
    },
    async definirSenha(senha) {
      await resultado(cliente.auth.updateUser({ password: senha }));
    },
    /** Cadastro sozinho (Missão 2): o e-mail de confirmação leva a `destino`. `captcha`: o token da verificação contra robô. */
    async cadastrar(email, senha, { destino, captcha, dados } = {}) {
      return resultado(cliente.auth.signUp({ email, password: senha, options: { emailRedirectTo: destino, captchaToken: captcha, data: dados } }));
    },
    aoMudarSessao(fn) {
      const { data } = cliente.auth.onAuthStateChange((_evento, sessao) => fn(sessao));
      return () => data.subscription.unsubscribe();
    },

    /** Para os módulos: `banco.resultado(banco.tabela("clientes").select("*"))` devolve os dados ou um erro traduzido. */
    tabela: nome => cliente.from(nome),
    rpc: (funcao, args) => resultado(cliente.rpc(funcao, args)),
    resultado,
    /**
     * Tempo real (Supabase Realtime; 09: só onde muda o dia a dia, como o pedido novo). Avisa das mudanças numa
     * tabela, com a RLS de quem está logado. `filtro`: ex. "conta_id=eq.<id>". Devolve a função que para de ouvir.
     */
    ouvir(tabela, { filtro, aoMudar }) {
      const canal = cliente.channel(`rz-${tabela}-${Math.random().toString(36).slice(2, 10)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: tabela, ...(filtro ? { filter: filtro } : {}) }, aoMudar)
        .subscribe();
      return () => { cliente.removeChannel(canal); };
    },
    /** Uma função do servidor (Supabase Edge Functions), com o login de quem chama. */
    async funcao(nome, corpo) {
      let r;
      try { r = await cliente.functions.invoke(nome, { body: corpo }); } catch (e) { throw erro(e); }
      if (r.error) {
        // a função responde { erro: "..." } em português; o supabase-js guarda a resposta em error.context
        let mensagem = r.error.message;
        try { const j = await r.error.context.json(); if (j && j.erro) mensagem = j.erro; } catch (e) { /* sem corpo */ }
        throw erro({ ...r.error, message: mensagem, code: "P0001" });
      }
      return r.data;
    },
    /** Envia um arquivo ao Storage (`bucket/caminho`, trocando o que houver) e devolve o endereço público.
     *  `trocar: false` só cria, nunca troca: o Meu site usa, porque cada foto ganha um nome novo e o site guarda a
     *  imagem por 1 ano (trocar o conteúdo de um endereço deixaria a foto velha nos navegadores). */
    async enviarArquivo(bucket, caminho, arquivo, tipo, { trocar = true } = {}) {
      await resultado(cliente.storage.from(bucket).upload(caminho, arquivo, { upsert: trocar, contentType: tipo, cacheControl: "3600" }));
      return cliente.storage.from(bucket).getPublicUrl(caminho).data.publicUrl;
    },
    urlPublica: (bucket, caminho) => cliente.storage.from(bucket).getPublicUrl(caminho).data.publicUrl,
  };
}
