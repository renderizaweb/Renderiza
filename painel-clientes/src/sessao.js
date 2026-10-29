// A sessão de quem está usando o painel: entrar, sair e avisar a casca quando muda.
// Nasce na Missão 1 só com o login; a Missão 2 acrescenta a conta escolhida e os acessos por módulo.

/** Tamanho mínimo da senha: o mesmo do Auth dos dois projetos do Supabase (Missão 1). */
export const SENHA_MINIMA = 8;

export function validarEmail(email) {
  const e = String(email || "").trim();
  if (!e) return "Digite o seu e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Esse e-mail não parece certo. Confira.";
  return null;
}

export function validarEntrada(email, senha) {
  const problema = validarEmail(email);
  if (problema) return problema;
  if (!senha) return "Digite a sua senha.";
  return null;
}

export function validarSenhaNova(senha) {
  if (!senha) return "Digite a senha nova.";
  if (String(senha).length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  return null;
}

export function criarSessao(adaptador) {
  let atual = null;
  const ouvintes = new Set();

  return {
    async iniciar() {
      atual = await adaptador.sessao();
      adaptador.aoMudarSessao(s => {
        const mudouQuem = (atual && atual.user && atual.user.id) !== (s && s.user && s.user.id);
        atual = s;
        // Renovação do token não muda quem está logado: a tela não precisa redesenhar.
        if (mudouQuem) ouvintes.forEach(fn => fn(s));
      });
      return atual;
    },
    logado: () => !!(atual && atual.user),
    usuario: () => (atual && atual.user) || null,
    async entrar(email, senha) {
      const problema = validarEntrada(email, senha);
      if (problema) throw new Error(problema);
      await adaptador.entrar(String(email).trim(), senha);
      atual = await adaptador.sessao();
      return atual;
    },
    async sair() {
      await adaptador.sair();
      atual = null;
    },
    /** Manda o e-mail com o link para criar uma senha nova; `destino` é o endereço da tela /nova-senha. */
    async pedirNovaSenha(email, destino) {
      const problema = validarEmail(email);
      if (problema) throw new Error(problema);
      await adaptador.pedirNovaSenha(String(email).trim(), destino);
    },
    /** Troca a senha de quem está logado (inclusive pela sessão que o link do e-mail abriu). */
    async definirSenha(senha) {
      const problema = validarSenhaNova(senha);
      if (problema) throw new Error(problema);
      await adaptador.definirSenha(senha);
      atual = await adaptador.sessao();
      return atual;
    },
    aoMudar(fn) {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
  };
}
