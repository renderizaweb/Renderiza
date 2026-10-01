// Camada de dados do painel. A interface só conversa com este módulo.
//
// - Escolhe o banco: dentro do Claude usa o banco do artifact; fora dele lê /api/config
//   (variáveis de ambiente da Vercel) e conecta no Supabase.
// - Nada aparece como salvo antes de o banco confirmar. Se a gravação falhar, o valor
//   volta ao que está no banco e a interface é avisada.
// - Sem conexão, a edição fica bloqueada até o banco responder de novo.

import { criarAdaptadorClaude } from "./adaptadores/claude.js";

export const TABELAS = ["leads", "conteudos", "interacoes", "ciclos", "tarefas"];

const linhas = Object.fromEntries(TABELAS.map(t => [t, new Map()]));
const ouvintes = new Set();
const filas = new Map();
let adaptador = null;
let pendentes = 0;
let verificador = null;

/** estado: "conectando" | "login" | "online" | "offline" | "sem_config" */
const conexao = { estado: "conectando", fonte: "", detalhe: "" };

function avisar(motivo) { ouvintes.forEach(fn => fn(motivo)); }
export const aoMudar = fn => ouvintes.add(fn);
export const estadoDaConexao = () => ({ ...conexao, salvando: pendentes > 0 });
export const podeEditar = () => conexao.estado === "online";
export const fonte = () => adaptador;

export function listar(tabela) { return [...linhas[tabela].values()]; }
export function buscar(tabela, id) { return linhas[tabela].get(id) || null; }

function mudarConexao(estado, detalhe = "") {
  conexao.estado = estado;
  conexao.detalhe = detalhe;
  if (estado === "offline") iniciarVerificacao(); else pararVerificacao();
  avisar("conexao");
}

async function lerConfig() {
  try {
    const r = await fetch("/api/config", { cache: "no-store" });
    if (!r.ok) return null;
    const c = await r.json();
    return c && c.supabaseUrl && c.supabaseAnonKey ? c : null;
  } catch (e) { return null; }
}

/** Descobre o banco disponível. Retorna o estado inicial da conexão. */
export async function iniciar() {
  if (typeof window !== "undefined" && window.claude && typeof window.claude.use === "function") {
    const db = await window.claude.use("db").catch(() => null);
    if (db) {
      adaptador = criarAdaptadorClaude(db);
      conexao.fonte = adaptador.nome;
      await carregar();
      return conexao.estado;
    }
  }
  const config = await lerConfig();
  if (!config) { mudarConexao("sem_config"); return conexao.estado; }
  try {
    const { criarAdaptadorSupabase } = await import("./adaptadores/supabase.js");
    adaptador = await criarAdaptadorSupabase({ url: config.supabaseUrl, chave: config.supabaseAnonKey });
  } catch (e) {
    mudarConexao("offline", e.message);
    return conexao.estado;
  }
  conexao.fonte = adaptador.nome;
  adaptador.aoMudarSessao(sessao => {
    if (!sessao && conexao.estado !== "login") { limpar(); mudarConexao("login"); }
  });
  const sessao = await adaptador.sessao().catch(() => null);
  if (!sessao) { mudarConexao("login"); return conexao.estado; }
  await carregar();
  return conexao.estado;
}

export async function entrar(email, senha) {
  await adaptador.entrar(email, senha);
  await carregar();
}

export async function sair() {
  if (adaptador && adaptador.sair) await adaptador.sair();
  limpar();
  mudarConexao("login");
}

function limpar() { TABELAS.forEach(t => linhas[t].clear()); avisar("dados"); }

let assinado = false;
export async function carregar() {
  try {
    const listas = await Promise.all(TABELAS.map(t => adaptador.listar(t)));
    TABELAS.forEach((t, i) => { linhas[t] = new Map(listas[i].map(l => [l.id, l])); });
    mudarConexao("online");
    avisar("dados");
    if (!assinado) {
      assinado = true;
      TABELAS.forEach(t => adaptador.assinar(t, (tipo, nova, antiga) => receberMudanca(t, tipo, nova, antiga)));
    }
  } catch (e) {
    if (e.sessao) { limpar(); mudarConexao("login"); return; }
    mudarConexao("offline", e.message);
  }
}

// Mudança vinda de outra aba/aparelho (ou eco da própria gravação, já confirmada).
function receberMudanca(tabela, tipo, nova, antiga) {
  if (tipo === "DELETE") { const id = antiga && antiga.id; if (id && linhas[tabela].delete(id)) avisar("dados"); return; }
  if (!nova || !nova.id || filas.has(tabela + "/" + nova.id)) return; // gravação local em andamento manda
  const atual = linhas[tabela].get(nova.id);
  if (atual && String(atual.atualizado_em) > String(nova.atualizado_em)) return;
  linhas[tabela].set(nova.id, nova);
  avisar("dados");
}

function naFila(chave, fn) {
  const anterior = filas.get(chave) || Promise.resolve();
  const p = anterior.catch(() => {}).then(fn);
  filas.set(chave, p);
  p.catch(() => {}).finally(() => { if (filas.get(chave) === p) filas.delete(chave); });
  return p;
}

async function gravar(fn) {
  if (!podeEditar()) throw Object.assign(new Error("Sem conexão com o banco. Nada foi salvo."), { rede: true });
  pendentes++;
  avisar("salvando");
  try {
    return await fn();
  } catch (e) {
    if (e.rede) mudarConexao("offline", e.message);
    else if (e.sessao) { limpar(); mudarConexao("login"); }
    throw e;
  } finally {
    pendentes--;
    avisar("salvando");
  }
}

/** Atualiza campos de um registro. Só altera o estado local depois da confirmação do banco. */
export function salvar(tabela, id, mudancas) {
  return naFila(tabela + "/" + id, () => gravar(async () => {
    const linha = await adaptador.atualizar(tabela, id, mudancas);
    linhas[tabela].set(id, linha);
    avisar("dados");
    return linha;
  }));
}

export function criar(tabela, dados) {
  return gravar(async () => {
    const linha = await adaptador.inserir(tabela, dados);
    linhas[tabela].set(linha.id, linha);
    avisar("dados");
    return linha;
  });
}

export function excluir(tabela, id) {
  return naFila(tabela + "/" + id, () => gravar(async () => {
    const daOtica = tabela === "leads" ? listar("interacoes").filter(i => i.lead_id === id) : [];
    const tarefas = tabela === "leads" ? listar("tarefas").filter(t => t.lead_id === id) : [];
    // No Supabase as interações e as tarefas do cliente saem junto (on delete cascade). No banco do Claude, saem antes.
    if (!adaptador.excluiEmCascata) {
      for (const i of daOtica) { await adaptador.excluir("interacoes", i.id); linhas.interacoes.delete(i.id); }
      for (const t of tarefas) { await adaptador.excluir("tarefas", t.id); linhas.tarefas.delete(t.id); }
    }
    await adaptador.excluir(tabela, id);
    linhas[tabela].delete(id);
    daOtica.forEach(i => linhas.interacoes.delete(i.id));
    tarefas.forEach(t => linhas.tarefas.delete(t.id));
    avisar("dados");
  }));
}

/** Tenta falar com o banco de novo; se responder, recarrega tudo. */
export async function reconectar() {
  if (!adaptador) { await iniciar(); return; }
  try {
    await adaptador.verificar();
    await carregar();
  } catch (e) {
    if (e.sessao) { limpar(); mudarConexao("login"); return; }
    mudarConexao("offline", e.message);
  }
}

function iniciarVerificacao() {
  if (verificador || !adaptador) return;
  verificador = setInterval(reconectar, 15000);
}
function pararVerificacao() { clearInterval(verificador); verificador = null; }

if (typeof window !== "undefined") {
  window.addEventListener("offline", () => { if (conexao.estado === "online") mudarConexao("offline", "Sem internet."); });
  window.addEventListener("online", () => { if (conexao.estado === "offline") reconectar(); });
}
