// A sessão de quem está usando o painel: entrar, sair, a conta escolhida e o que a pessoa pode em cada módulo.
// Missão 1: o login. Missão 2 (bloco B): as contas (public.minhas_contas), aceitar os convites ao entrar, a conta
// escolhida (guardada no aparelho) e podeNaConta, o espelho na tela da regra do banco (public.pode): a tela só
// esconde o que o banco já não entregaria.

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

/** Os módulos da base: vêm em toda conta e não contam no plano (02; src/modulos/index.js). */
export const MODULOS_BASE = ["inicio", "servicos", "equipe", "configuracoes"];

/**
 * O que a pessoa pode num módulo, pela linha de minhas_contas() (a mesma regra de public.pode no banco).
 * `conta.modulos` já vem só com os ligados (e, no teste, os liberados no teste).
 */
export function podeNaConta(conta, modulo, nivel = "ver") {
  if (!conta || !conta.liberada || !["ver", "editar"].includes(nivel)) return false;
  const acesso = (conta.acessos || {})[modulo];
  if (MODULOS_BASE.includes(modulo)) {
    if (conta.dono) return true;
    if (modulo === "equipe" || modulo === "configuracoes") return false;
    return nivel === "ver" || acesso === "editar";
  }
  if (!(conta.modulos || []).includes(modulo)) return false;
  return !!conta.dono || acesso === "editar" || (nivel === "ver" && acesso === "ver");
}

/** Como está o módulo para a pessoa: "livre" (pode ver), "trancado" (ligado, sem acesso) ou "fora" (não ligado). */
export function estadoDoModulo(conta, modulo) {
  if (podeNaConta(conta, modulo, "ver")) return "livre";
  if (MODULOS_BASE.includes(modulo) || (conta && (conta.modulos || []).includes(modulo))) return "trancado";
  return "fora";
}

/** Dias que faltam do teste (arredondado para cima), ou null se a conta não está em teste. */
export function diasDeTeste(conta, agora = Date.now()) {
  if (!conta || conta.situacao !== "teste" || !conta.teste_ate) return null;
  return Math.max(0, Math.ceil((Date.parse(conta.teste_ate) - agora) / 864e5));
}

/** A conta que abre: a guardada (se a pessoa ainda é dela) ou a única que ela tem. */
export function contaQueAbre(contas, guardada) {
  if (guardada && contas.some(c => c.conta_id === guardada)) return guardada;
  return contas.length === 1 ? contas[0].conta_id : null;
}

function armazenamentoDoNavegador() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    return { ler: k => ls.getItem(k), gravar: (k, v) => (v == null ? ls.removeItem(k) : ls.setItem(k, v)) };
  } catch (e) {
    return null;
  }
}

export function criarSessao(adaptador, { armazenamento = armazenamentoDoNavegador() } = {}) {
  let atual = null;
  let contas = null; // null = ainda não carregou
  let escolhida = null;
  let equipeRenderiza = false;
  let erroAoAceitar = "";
  let pessoa = null; // a linha de public.pessoas da pessoa na conta escolhida (nome, cor, papel)
  let carregando = null;
  const ouvintes = new Set();
  const chaveDaConta = () => "painel-renderiza:conta:" + ((atual && atual.user && atual.user.id) || "");
  const ler = k => { try { return armazenamento ? armazenamento.ler(k) : null; } catch (e) { return null; } };
  const gravar = (k, v) => { try { if (armazenamento) armazenamento.gravar(k, v); } catch (e) { /* aparelho sem armazenamento */ } };
  const esquecerContas = () => { contas = null; escolhida = null; equipeRenderiza = false; pessoa = null; };

  return {
    async iniciar() {
      atual = await adaptador.sessao();
      adaptador.aoMudarSessao(s => {
        const mudouQuem = (atual && atual.user && atual.user.id) !== (s && s.user && s.user.id);
        atual = s;
        if (mudouQuem) esquecerContas();
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
      esquecerContas();
    },

    /**
     * Carrega as contas de quem entrou. Antes, aceita os convites do e-mail dele (quem foi convidado entra direto
     * na conta nova). Devolve a lista de minhas_contas().
     */
    carregarContas() {
      // a casca e o "entrou" podem pedir ao mesmo tempo: uma carga só
      if (!carregando) carregando = this._carregarContas().finally(() => { carregando = null; });
      return carregando;
    },
    async _carregarContas() {
      if (!this.logado()) { esquecerContas(); return []; }
      erroAoAceitar = "";
      try { await adaptador.rpc("aceitar_convites"); } catch (e) { if (e.rede) throw e; erroAoAceitar = e.message; /* a tela /convite mostra; segue */ }
      contas = (await adaptador.rpc("minhas_contas")) || [];
      try {
        const linhas = await adaptador.resultado(adaptador.tabela("equipe_renderiza").select("usuario_id").limit(1));
        equipeRenderiza = Array.isArray(linhas) && linhas.length > 0;
      } catch (e) {
        equipeRenderiza = false;
      }
      escolhida = contaQueAbre(contas, ler(chaveDaConta()));
      return contas;
    },
    contasCarregadas: () => contas !== null,
    /** Por que o convite não virou acesso (ex.: a conta chegou ao limite do plano); vazio se deu certo. */
    erroDoConvite: () => erroAoAceitar,
    contas: () => contas || [],
    conta: () => (contas || []).find(c => c.conta_id === escolhida) || null,
    eEquipeRenderiza: () => equipeRenderiza,
    pessoa: () => pessoa,
    /** Nome, cor e papel da pessoa na conta escolhida (para o avatar e o "visto em"). */
    async carregarPessoa() {
      const c = this.conta();
      if (!c || !c.pessoa_id) { pessoa = null; return null; } // sem pessoa: a Renderiza em suporte (Missão 5A)
      if (pessoa && pessoa.id === c.pessoa_id) return pessoa;
      try {
        pessoa = await adaptador.resultado(adaptador.tabela("pessoas").select("id, nome, cor, papel, email, preferencias").eq("id", c.pessoa_id).maybeSingle());
      } catch (e) {
        pessoa = null;
      }
      return pessoa;
    },
    escolherConta(id) {
      if (!(contas || []).some(c => c.conta_id === id)) throw new Error("Essa conta não está entre as suas.");
      if (id !== escolhida) pessoa = null;
      escolhida = id;
      gravar(chaveDaConta(), id);
      this.registrarEntrada();
    },
    /** Registra a entrada na conta (Admin e "visto em"). Falhar aqui nunca atrapalha quem está usando. */
    async registrarEntrada() {
      if (!escolhida) return;
      const aparelho = typeof navigator !== "undefined" ? String(navigator.userAgent || "").slice(0, 300) : null;
      try { await adaptador.rpc("registrar_entrada", { conta: escolhida, aparelho }); } catch (e) { /* segue */ }
    },
    /** O que a pessoa pode na conta escolhida (só para a tela; quem garante é o banco). */
    pode(modulo, nivel = "ver") {
      return podeNaConta(this.conta(), modulo, nivel);
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
