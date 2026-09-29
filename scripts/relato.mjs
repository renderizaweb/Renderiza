// Atualização dos leads a partir do relato do dia, feita por um assistente de IA.
// Entra no Supabase COMO VOCÊ (e-mail e senha do painel): valem as mesmas regras de RLS do painel,
// então o assistente só enxerga e altera as suas linhas. Nada de chave secreta (service_role).
//
// Variáveis (em .env.local, que não vai para o git, ou no ambiente do assistente):
//   SUPABASE_URL, SUPABASE_ANON_KEY (chave pública), RENDERIZA_EMAIL, RENDERIZA_SENHA
//
// Uso:
//   node scripts/relato.mjs buscar "ótica bela"      óticas parecidas (para não duplicar)
//   node scripts/relato.mjs ver <lead_id>            situação e interações de uma ótica
//   node scripts/relato.mjs simular plano.json       mostra o que mudaria, sem gravar
//   node scripts/relato.mjs aplicar plano.json       grava tudo numa transação e mostra o resumo
//
// O formato do plano e as regras de interpretação estão em docs/atualizacao-por-ia.md.

import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const envLocal = join(RAIZ, ".env.local");
if (existsSync(envLocal)) {
  for (const linha of readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const env = process.env;
const URL_BASE = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const CHAVE = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function sair(msg) { console.error(msg); process.exit(1); }
function papelDoJwt(chave) {
  try { return JSON.parse(Buffer.from(chave.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")).role || ""; } catch (e) { return ""; }
}

const [comando, arg] = process.argv.slice(2);
if (!["buscar", "ver", "simular", "aplicar"].includes(comando)) {
  sair("Uso: node scripts/relato.mjs buscar <termo> | ver <lead_id> | simular <plano.json> | aplicar <plano.json>");
}
if (!URL_BASE || !CHAVE) sair("Falta SUPABASE_URL ou SUPABASE_ANON_KEY (chave pública).");
if (CHAVE.startsWith("sb_secret_") || papelDoJwt(CHAVE) === "service_role") sair("Essa chave é secreta (service_role). Use a chave pública: o acesso vem do login, com RLS.");
if (!env.RENDERIZA_EMAIL || !env.RENDERIZA_SENHA) sair("Falta RENDERIZA_EMAIL ou RENDERIZA_SENHA (o mesmo login do painel).");

async function pedir(caminho, { metodo = "GET", corpo, token } = {}) {
  let r;
  try {
    r = await fetch(URL_BASE + caminho, {
      method: metodo,
      headers: { apikey: CHAVE, "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch (e) { sair("Sem conexão com o Supabase: " + e.message); }
  const texto = await r.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!r.ok) {
    const msg = (dados && (dados.message || dados.error_description || dados.msg || dados.error)) || r.statusText;
    const err = new Error(msg);
    err.status = r.status;
    err.detalhe = dados;
    throw err;
  }
  return dados;
}

async function entrar() {
  try {
    const s = await pedir("/auth/v1/token?grant_type=password", { metodo: "POST", corpo: { email: env.RENDERIZA_EMAIL, password: env.RENDERIZA_SENHA } });
    return s.access_token;
  } catch (e) { sair("Não consegui entrar com o login do painel: " + e.message); }
}

const dm = iso => (iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : "sem data");
const NOMES = { primeiro_contato: "primeiro contato", retorno: "retorno feito", resposta: "resposta", anotacao: "anotação" };
const INTERESSE = { nao_avaliado: "Não avaliado", interessado: "Interessado", perto_de_fechar: "Perto de fechar" };

/** Resumo curto, em português, do que a função devolveu (para o assistente repassar). */
function resumir(r) {
  const linhas = [r.simulado ? "SIMULAÇÃO (nada foi gravado):" : "Gravado:"];
  for (const it of r.itens) {
    const partes = it.interacoes.map(i => `${NOMES[i.tipo]} ${i.precisao === "exata" ? "em " + dm(i.ocorreu_em) : i.precisao === "aproximada" ? "(mês aproximado)" : "(data desconhecida)"}${i.interesse ? " → " + INTERESSE[i.interesse] : ""}`);
    const alt = Object.entries(it.alteracoes || {}).map(([campo, { de, para }]) => {
      if (campo === "followup_em") return `follow-up ${de ? dm(de) : "—"} → ${para ? dm(para) : "sem data"}`;
      if (campo === "interesse") return `interesse ${INTERESSE[de]} → ${INTERESSE[para]}`;
      if (campo === "proxima_acao") return `próxima ação: "${para}"`;
      if (campo === "nao_contatar") return para ? "não contatar mais" : "pode voltar a ser contatada";
      if (campo === "interesse_motivo") return null;
      return `${campo}: ${de ?? "—"} → ${para ?? "—"}`;
    }).filter(Boolean);
    if (it.otica_nova_no_painel) alt.unshift(`follow-up ${it.agora.followup_em ? dm(it.agora.followup_em) : "sem data"}`);
    linhas.push(`- ${it.empresa}${it.otica_nova_no_painel ? " (nova no painel)" : ""}: ${[...partes, ...alt].join("; ") || "sem mudanças"}`);
  }
  const novas = r.itens.flatMap(i => i.interacoes).filter(i => i.tipo === "primeiro_contato" && i.precisao === "exata").length;
  const retornos = r.itens.flatMap(i => i.interacoes).filter(i => i.tipo === "retorno").length;
  linhas.push(`Placar: +${novas} ótica(s) nova(s), +${retornos} retorno(s) feito(s).`);
  return linhas.join("\n");
}

const token = await entrar();
try {
  if (comando === "buscar") {
    if (!arg) sair("Diga o que buscar.");
    const achados = await pedir("/rest/v1/rpc/renderiza_buscar_leads", { metodo: "POST", corpo: { termo: arg }, token });
    if (!achados.length) console.log(`Nenhuma ótica parecida com "${arg}". Pode ser nova.`);
    for (const l of achados) {
      console.log(`${l.id}\t${l.empresa}${l.cidade ? " (" + l.cidade + ")" : ""}\tetapa ${l.etapa}\tinteresse ${l.interesse}` +
        `\t1º contato ${l.primeiro_contato ? dm(l.primeiro_contato) + (l.primeiro_contato_precisao !== "exata" ? " aprox." : "") : l.primeiro_contato_precisao === "desconhecida" ? "data desconhecida" : "nenhum"}` +
        `\tfollow-up ${l.followup_em ? dm(l.followup_em) : "—"}${l.nao_contatar ? "\tNÃO CONTATAR" : ""}`);
    }
    if (achados.length > 1) console.log("Mais de uma ótica: confirme com o usuário qual é antes de gravar.");
  } else if (comando === "ver") {
    if (!arg) sair("Diga o id da ótica.");
    const [lead] = await pedir(`/rest/v1/leads?id=eq.${encodeURIComponent(arg)}&select=id,empresa,cidade,etapa,resultado,interesse,interesse_motivo,nao_contatar,proxima_acao,followup_em`, { token });
    if (!lead) sair("Ótica não encontrada.");
    const ints = await pedir(`/rest/v1/interacoes?lead_id=eq.${encodeURIComponent(arg)}&select=tipo,ocorreu_em,precisao,canal,resumo,interesse,origem&order=ocorreu_em.asc.nullsfirst`, { token });
    console.log(JSON.stringify({ lead, interacoes: ints }, null, 2));
  } else {
    if (!arg || !existsSync(arg)) sair("Diga o arquivo do plano (JSON).");
    const plano = JSON.parse(readFileSync(arg, "utf8"));
    const r = await pedir("/rest/v1/rpc/renderiza_aplicar_relato", { metodo: "POST", corpo: { plano, simular: comando === "simular" }, token });
    console.log(resumir(r));
    if (process.env.RELATO_JSON) console.log(JSON.stringify(r, null, 2));
  }
} catch (e) {
  sair("O banco recusou, nada foi gravado: " + e.message);
}
