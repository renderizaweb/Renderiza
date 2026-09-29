// Adaptador Supabase: leitura, criação, edição e exclusão via supabase-js (PostgREST),
// login por e-mail e senha, e tempo real opcional.
// Tudo que volta daqui já foi confirmado pelo banco.

const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/+esm";

export function ehErroDeRede(e) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const txt = [e && e.name, e && e.message, e && e.details].filter(Boolean).join(" ");
  return /Failed to fetch|NetworkError|fetch failed|Load failed|Network request failed|ERR_|AuthRetryableFetchError|ECONNREFUSED/i.test(txt);
}

function traduzir(e) {
  if (!e) return "Erro desconhecido.";
  if (ehErroDeRede(e)) return "Sem conexão com o banco.";
  const msg = String(e.message || e);
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(msg)) return "E-mail ainda não confirmado no Supabase.";
  if (e.code === "PGRST116") return "Registro não encontrado. Ele pode ter sido excluído.";
  if (e.code === "42501" || /row-level security/i.test(msg)) return "Sem permissão para alterar este registro.";
  if (e.code === "23505" && /interacoes_um_primeiro_contato/.test(msg)) return "Esta ótica já tem primeiro contato registrado. Uma nova abordagem é um retorno.";
  if (e.code === "23514") return "Valor não aceito pelo banco (" + msg + ").";
  if (e.code === "P0001") return msg; // regras do banco (interacoes_validar) já vêm em português
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

export async function criarAdaptadorSupabase({ url, chave }) {
  let createClient;
  try {
    ({ createClient } = await import(SUPABASE_JS));
  } catch (e) {
    throw Object.assign(new Error("Não consegui carregar o cliente do Supabase. Verifique a internet."), { rede: true });
  }
  const cliente = createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true } });
  const canais = [];

  const resultado = async consulta => {
    let r;
    try { r = await consulta; } catch (e) { throw erro(e); }
    if (r.error) throw erro(r.error);
    return r.data;
  };

  return {
    nome: "Supabase",
    precisaLogin: true,
    excluiEmCascata: true,

    async sessao() {
      const { data } = await cliente.auth.getSession();
      return data.session;
    },
    async entrar(email, senha) {
      const { error } = await cliente.auth.signInWithPassword({ email, password: senha });
      if (error) throw erro(error);
    },
    async sair() {
      canais.splice(0).forEach(c => cliente.removeChannel(c));
      await cliente.auth.signOut();
    },
    aoMudarSessao(fn) {
      cliente.auth.onAuthStateChange((_evento, sessao) => fn(sessao));
    },

    listar: tabela => resultado(cliente.from(tabela).select("*").order("criado_em", { ascending: false })),
    inserir: (tabela, linha) => resultado(cliente.from(tabela).insert(linha).select().single()),
    atualizar: (tabela, id, mudancas) => resultado(cliente.from(tabela).update(mudancas).eq("id", id).select().single()),
    excluir: async (tabela, id) => { await resultado(cliente.from(tabela).delete().eq("id", id)); },
    verificar: () => resultado(cliente.from("leads").select("id").limit(1)),

    /** Tempo real: avisa quando outra aba ou aparelho muda algo. Opcional; se falhar, o painel segue normal. */
    assinar(tabela, aoMudar) {
      try {
        const canal = cliente
          .channel("rz-" + tabela)
          .on("postgres_changes", { event: "*", schema: "public", table: tabela }, p => aoMudar(p.eventType, p.new, p.old))
          .subscribe();
        canais.push(canal);
      } catch (e) { /* sem tempo real: segue funcionando com recarga manual */ }
    },
  };
}
