// A sessão de quem está usando o painel: entrar, sair e avisar a casca quando muda.
// Nasce na Missão 1 só com o login; a Missão 2 acrescenta a conta escolhida e os acessos por módulo.

export function validarEntrada(email, senha) {
  const e = String(email || "").trim();
  if (!e) return "Digite o seu e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Esse e-mail não parece certo. Confira.";
  if (!senha) return "Digite a sua senha.";
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
    aoMudar(fn) {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
  };
}
