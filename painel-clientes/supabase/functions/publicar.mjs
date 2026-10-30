// Publica as funções do servidor (supabase/functions/<nome>/) no STG e na produção, pela API de gerenciamento do
// Supabase (PAINEL_SUPABASE_ACCESS_TOKEN), igual ao migrar.mjs: STG primeiro; a produção pede --projeto <ref>.
//
//   node supabase/functions/publicar.mjs              situação: as funções publicadas no STG e na produção (só lê)
//   node supabase/functions/publicar.mjs stg          publica todas no STG
//   node supabase/functions/publicar.mjs producao --projeto <ref da produção>
//   … --so <nome>                                 só uma função (ex.: --so convidar), sem republicar as outras
//
// A chave secreta não passa por aqui: o Supabase a põe no ambiente da função (SUPABASE_SECRET_KEYS).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALVOS, conferirProjeto, exigirConfirmacaoDaProducao } from "../../scripts/lib/projetos.mjs";

const PASTA = fileURLToPath(new URL(".", import.meta.url));
const API = "https://api.supabase.com/v1";

export const FUNCOES = readdirSync(PASTA).filter(n => statSync(join(PASTA, n)).isDirectory()).sort();

function token() {
  const t = process.env.PAINEL_SUPABASE_ACCESS_TOKEN;
  if (!t) throw new Error("Falta PAINEL_SUPABASE_ACCESS_TOKEN no ambiente.");
  return t;
}

async function chamar(caminho, opcoes = {}) {
  const r = await fetch(API + caminho, { ...opcoes, headers: { Authorization: "Bearer " + token(), ...(opcoes.headers || {}) } });
  const texto = await r.text();
  if (!r.ok) throw new Error(`Supabase respondeu ${r.status}: ${texto.slice(0, 300)}`);
  try { return JSON.parse(texto); } catch (e) { return texto; }
}

async function publicar(ref, nome) {
  const pasta = join(PASTA, nome);
  const form = new FormData();
  form.append("metadata", JSON.stringify({ name: nome, entrypoint_path: "index.js", verify_jwt: false }));
  for (const arquivo of readdirSync(pasta).filter(a => a.endsWith(".js")).sort()) {
    form.append("file", new Blob([readFileSync(join(pasta, arquivo))], { type: "application/javascript" }), arquivo);
  }
  return chamar(`/projects/${ref}/functions/deploy?slug=${encodeURIComponent(nome)}`, { method: "POST", body: form });
}

async function principal() {
  const args = process.argv.slice(2);
  const alvo = args.find((a, i) => !a.startsWith("--") && !["--projeto", "--so"].includes(args[i - 1]));
  if (!alvo) {
    for (const a of ["stg", "producao"]) {
      const p = await conferirProjeto(a);
      const lista = await chamar(`/projects/${p.ref}/functions`);
      console.log(`${ALVOS[a].nome}: ${lista.map(f => `${f.slug} (versão ${f.version}, ${f.status})`).join(", ") || "nenhuma função"}`);
    }
    return;
  }
  if (!ALVOS[alvo]) throw new Error("Use stg ou producao --projeto <ref>.");
  const so = args.includes("--so") ? args[args.indexOf("--so") + 1] : null;
  if (so && !FUNCOES.includes(so)) throw new Error(`Não existe a função "${so}" em supabase/functions/.`);
  const funcoes = so ? [so] : FUNCOES;
  const p = await conferirProjeto(alvo);
  if (alvo === "producao") {
    exigirConfirmacaoDaProducao(p, args[args.indexOf("--projeto") + 1]);
    const stg = await conferirProjeto("stg");
    const noStg = new Set((await chamar(`/projects/${stg.ref}/functions`)).map(f => f.slug));
    const faltam = funcoes.filter(f => !noStg.has(f));
    if (faltam.length) throw new Error(`Ainda não publicada no STG: ${faltam.join(", ")}. Sempre STG primeiro.`);
  }
  console.log(`Alvo: ${ALVOS[alvo].nome} · ${p.nome} (${p.ref})`);
  for (const nome of funcoes) {
    const r = await publicar(p.ref, nome);
    console.log(`   ok  ${nome} (versão ${r.version}, ${r.status})`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  principal().catch(e => {
    console.error("Parou: " + e.message);
    process.exit(1);
  });
}
