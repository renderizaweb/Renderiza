// O banco de mentira dos exemplos: imita o pedaço do supabase-js que o Painel Renderiza usa (a sessão, as tabelas, as
// funções e os arquivos), com dados fictícios na memória do navegador. Não fala com servidor nenhum. O painel em cima
// dele é o de verdade (exemplos/painel/src é a cópia de painel-clientes/src, conferida por teste).
// Quem usa: a página /exemplos/meu-site-fotografia (o Meu site de verdade, no navegador de quem testa) e a bancada do
// vídeo do Meu site (instagram/bancada-painel.mjs), que serve o painel inteiro com este banco.
//
// As regras do banco que o Meu site precisa vêm junto, como no Postgres (supabase/migrations, sites_versoes_antes):
// a versão nova ganha o número seguinte e a pessoa de quem entrou; publicar marca a data e a pessoa; versão publicada
// não muda. As outras tabelas são só leitura e escrita simples.
//
// criarCliente({ tabelas, usuario, pessoaId, rpc, aoMudar, aoEnviarArquivo, urlDeArquivo }) devolve o createClient:
//   tabelas: { nome: [linhas] } (o banco); usuario: { id, email } (a sessão); pessoaId: a pessoa de quem entrou;
//   rpc: { nome: (args, tabelas) => dados }; aoMudar(tabela, tabelas): depois de cada gravação (para guardar);
//   aoEnviarArquivo(bucket, caminho, blob): quando o painel envia um arquivo; urlDeArquivo(bucket, caminho).

const agora = () => new Date().toISOString();
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => (Math.random() * 16 | 0).toString(16)));
const copiar = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const erro = (message, code = "P0001") => ({ data: null, error: { message, code } });

class Consulta {
  constructor(banco, tabela) {
    Object.assign(this, { banco, tabela, filtros: [], ordens: [], limite: null, inicio: 0, um: null, op: "select", valores: null, opcoes: {}, devolver: true });
  }
  select(_colunas, opcoes = {}) { if (this.op === "select") this.opcoes = opcoes; else this.devolver = true; return this; }
  insert(v) { this.op = "insert"; this.valores = Array.isArray(v) ? v : [v]; this.devolver = false; return this; }
  upsert(v, opcoes = {}) { this.op = "upsert"; this.valores = Array.isArray(v) ? v : [v]; this.opcoes = opcoes; this.devolver = false; return this; }
  update(v) { this.op = "update"; this.valores = v; this.devolver = false; return this; }
  delete() { this.op = "delete"; this.devolver = false; return this; }
  filtro(fn) { this.filtros.push(fn); return this; }
  eq(c, v) { return this.filtro(l => l[c] === v); }
  neq(c, v) { return this.filtro(l => l[c] !== v); }
  in(c, lista) { return this.filtro(l => lista.includes(l[c])); }
  gt(c, v) { return this.filtro(l => l[c] > v); }
  gte(c, v) { return this.filtro(l => l[c] >= v); }
  lt(c, v) { return this.filtro(l => l[c] < v); }
  lte(c, v) { return this.filtro(l => l[c] <= v); }
  is(c, v) { return this.filtro(l => (l[c] ?? null) === v); }
  not(c, op, v) { return op === "is" ? this.filtro(l => (l[c] ?? null) !== v) : this; }
  ilike(c, padrao) { const re = new RegExp("^" + String(padrao).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$", "i"); return this.filtro(l => re.test(String(l[c] ?? ""))); }
  or() { return this; }
  order(c, { ascending = true } = {}) { this.ordens.push([c, ascending]); return this; }
  limit(n) { this.limite = n; return this; }
  range(a, b) { this.inicio = a; this.limite = b - a + 1; return this; }
  single() { this.um = "single"; return this; }
  maybeSingle() { this.um = "maybe"; return this; }
  then(ok, falhou) { return Promise.resolve().then(() => this.executar()).then(ok, falhou); }

  executar() {
    const b = this.banco, linhas = b.tabelas[this.tabela] || (b.tabelas[this.tabela] = []);
    const casa = l => this.filtros.every(f => f(l));
    let saida;
    if (this.op === "select") {
      saida = linhas.filter(casa);
      for (const [c, asc] of [...this.ordens].reverse()) saida.sort((x, y) => (x[c] === y[c] ? 0 : (x[c] ?? "") < (y[c] ?? "") ? -1 : 1) * (asc ? 1 : -1));
      const total = saida.length;
      saida = saida.slice(this.inicio, this.limite == null ? undefined : this.inicio + this.limite);
      if (this.opcoes.head) return { data: null, error: null, count: total };
      return this.fim(copiar(saida), total);
    }
    try {
      if (this.op === "insert" || this.op === "upsert") {
        saida = this.valores.map(v => {
          const chaves = (this.opcoes.onConflict || "").split(",").filter(Boolean);
          const antiga = chaves.length ? linhas.find(l => chaves.every(k => l[k] === v[k])) : null;
          if (antiga) { if (!this.opcoes.ignoreDuplicates) Object.assign(antiga, v); return antiga; }
          const nova = { id: novoId(), criado_em: agora(), ...v };
          b.antesDeGravar(this.tabela, nova, null);
          linhas.push(nova);
          return nova;
        });
      } else if (this.op === "update") {
        saida = linhas.filter(casa);
        for (const l of saida) {
          const nova = { ...l, ...this.valores, atualizado_em: agora() };
          b.antesDeGravar(this.tabela, nova, l);
          Object.assign(l, nova);
        }
      } else {
        saida = linhas.filter(casa);
        b.tabelas[this.tabela] = linhas.filter(l => !casa(l));
      }
    } catch (e) {
      return erro(e.message, e.code || "42501");
    }
    b.aoMudar(this.tabela, b.tabelas);
    return this.devolver ? this.fim(copiar(saida)) : { data: null, error: null };
  }
  fim(lista, total) {
    if (this.um === "single") return lista.length === 1 ? { data: lista[0], error: null } : erro("JSON object requested, multiple (or no) rows returned", "PGRST116");
    if (this.um === "maybe") return { data: lista[0] || null, error: null };
    return { data: lista, error: null, count: total };
  }
}

/** As regras do banco (os gatilhos) que o painel espera. */
function regras(banco, tabela, nova, antiga) {
  if (tabela === "sites_versoes") {
    if (!antiga) {
      nova.estado = nova.estado || "rascunho";
      if (nova.numero == null) nova.numero = Math.max(0, ...(banco.tabelas.sites_versoes || []).filter(v => v.site_id === nova.site_id).map(v => v.numero)) + 1;
      nova.pessoa_id = banco.pessoaId;
    } else {
      if (antiga.estado !== "rascunho" && JSON.stringify(nova.conteudo) !== JSON.stringify(antiga.conteudo)) throw Object.assign(new Error("Versão publicada não muda: publique uma nova."), { code: "42501" });
      if (nova.estado === "rascunho" && antiga.estado !== "rascunho") throw Object.assign(new Error("Versão publicada não volta a ser rascunho."), { code: "42501" });
    }
    if (nova.estado === "publicada" && !nova.publicada_em) { nova.publicada_em = agora(); nova.pessoa_id = banco.pessoaId; }
  }
  if (tabela === "sites_previas" && !antiga) nova.codigo = nova.codigo || Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.random() * 36 | 0]).join("");
  if (tabela === "termos_aceites" && !antiga) { nova.usuario_id = banco.usuario.id; nova.aceito_em = agora(); }
}

/** A versão publicada no formato que o site recebe da API (public.versao_no_contrato). */
export function versaoNoContrato(codigo, v) {
  const { esquema, site, versao, publicado_em, ...resto } = v.conteudo || {};
  return { ...resto, esquema: 1, site: codigo, versao: v.numero || 0, publicado_em: v.publicada_em };
}

/** A última versão publicada de um site (ou null): o que publico_site devolve. */
export function publicada(tabelas, siteId) {
  return (tabelas.sites_versoes || []).filter(v => v.site_id === siteId && v.estado === "publicada").sort((a, b) => b.numero - a.numero)[0] || null;
}

export function criarCliente({ tabelas, usuario, pessoaId, rpc = {}, aoMudar = () => {}, aoEnviarArquivo = async () => {}, urlDeArquivo = (bucket, caminho) => `/${bucket}/${caminho}` }) {
  const banco = { tabelas, usuario, pessoaId, aoMudar, antesDeGravar: (t, n, a) => regras(banco, t, n, a) };
  const sessao = { access_token: "exemplo", token_type: "bearer", user: usuario };
  const cliente = {
    auth: {
      getSession: async () => ({ data: { session: sessao }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { session: sessao }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: async () => ({ data: { user: usuario }, error: null }),
      signUp: async () => erro("No exemplo não dá para criar conta."),
    },
    from: nome => new Consulta(banco, nome),
    rpc: async (nome, args) => {
      if (!rpc[nome]) return { data: null, error: null };
      try { return { data: copiar(await rpc[nome](args || {}, tabelas)), error: null }; } catch (e) { return erro(e.message); }
    },
    channel: () => { const c = { on: () => c, subscribe: () => c }; return c; },
    removeChannel: () => {},
    functions: { invoke: async () => ({ data: null, error: { message: "No exemplo, esta parte não funciona.", context: { json: async () => ({ erro: "No exemplo, esta parte não funciona." }) } } }) },
    storage: {
      from: bucket => ({
        upload: async (caminho, arquivo) => { await aoEnviarArquivo(bucket, caminho, arquivo); return { data: { path: caminho }, error: null }; },
        getPublicUrl: caminho => ({ data: { publicUrl: urlDeArquivo(bucket, caminho) } }),
        list: async () => ({ data: [], error: null }),
        download: async () => erro("No exemplo, os arquivos não ficam guardados."),
        remove: async () => ({ data: [], error: null }),
      }),
    },
  };
  return () => cliente;
}
