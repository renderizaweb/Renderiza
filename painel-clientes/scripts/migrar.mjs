// As migrações do Painel Renderiza: testa no local → aplica no STG → aplica na produção.
// Regras em docs/painel-clientes/08-trabalho-em-paralelo.md ("O banco"). Usa as variáveis PAINEL_* do ambiente;
// as do Painel de prospecção (SUPABASE_URL, SUPABASE_ANON_KEY) nunca são lidas.
//
//   node scripts/migrar.mjs                    situação: cada migração no STG e na produção (só lê)
//   node scripts/migrar.mjs local              banco local do zero + todas as migrações + supabase/testes/
//   node scripts/migrar.mjs stg                testa no local e aplica no STG as que faltam, uma de cada vez
//   node scripts/migrar.mjs producao --projeto <ref da produção>
//                                              testa no local e aplica na produção o que já passou pelo STG
// Opções: --simular (mostra o que aplicaria, sem aplicar)
//         --pode-destrutivo (produção: aceita drop/delete/update/afrouxar a RLS; só com a Renderiza dizendo "pode")

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lerMigracoes, comparar, perigosos, problemas, sqlDeAplicacao, SQL_TEM_REGISTRO, SQL_DO_REGISTRO, linhaDoQuadro } from "./lib/migracoes.mjs";
import { consultar } from "./lib/supabase-api.mjs";
import { ALVOS, refDo, conferirProjeto, exigirConfirmacaoDaProducao } from "./lib/projetos.mjs";
import * as local from "./lib/banco-local.mjs";

const PASTA = resolve(fileURLToPath(new URL("..", import.meta.url)));
const MIGRACOES = join(PASTA, "supabase", "migrations");
const TESTES = join(PASTA, "supabase", "testes");
const IMITACAO = join(PASTA, "supabase", "local", "imitacao-supabase.sql");

const args = process.argv.slice(2);
const comando = args.find(a => !a.startsWith("--")) || "situacao";
const opcao = nome => args.includes("--" + nome);
const valorDe = nome => (args.includes("--" + nome) ? args[args.indexOf("--" + nome) + 1] : undefined);

const dia = () => new Date().toLocaleDateString("pt-BR");

// ---------- os dois bancos remotos (ALVOS, refDo e conferirProjeto em lib/projetos.mjs) ----------

async function aplicadasNo(ref) {
  const [{ existe }] = await consultar(ref, SQL_TEM_REGISTRO, { somenteLeitura: true });
  if (!existe) return [];
  const [linha] = await consultar(ref, SQL_DO_REGISTRO, { somenteLeitura: true });
  return linha.aplicadas;
}

// ---------- local ----------

function testarNoLocal() {
  if (!local.temPsql()) throw new Error("Não achei o psql. O banco local precisa do Postgres 16 do ambiente (ou PAINEL_LOCAL_PG).");
  const migracoes = lerMigracoes(MIGRACOES);
  for (const m of migracoes) {
    const p = problemas(m.sql);
    if (p.length) throw new Error(`${m.arquivo}: ${p.join("; ")}.`);
  }
  local.garantirServidor();
  local.recriarBanco();
  local.rodar(readFileSync(IMITACAO, "utf8"), { transacao: true });
  for (const m of migracoes) {
    try {
      local.rodar(sqlDeAplicacao(m), { transacao: true });
    } catch (e) {
      throw new Error(`${m.arquivo} falhou no banco local:\n${e.message}`);
    }
  }
  const testes = existsSync(TESTES) ? readdirSync(TESTES).filter(a => a.endsWith(".sql")).sort() : [];
  for (const t of testes) {
    try {
      local.rodar(`begin;\n${readFileSync(join(TESTES, t), "utf8")}\n;rollback;`);
    } catch (e) {
      throw new Error(`Teste ${t} falhou:\n${e.message}`);
    }
  }
  return { migracoes, testes };
}

// ---------- comandos ----------

async function situacao() {
  const migracoes = lerMigracoes(MIGRACOES);
  const colunas = {};
  for (const alvo of ["stg", "producao"]) {
    const p = await conferirProjeto(alvo);
    const aplicadas = await aplicadasNo(p.ref);
    colunas[alvo] = { p, aplicadas, mapa: new Map(aplicadas.map(a => [a.versao, a])), ...comparar(migracoes, aplicadas) };
    console.log(`${ALVOS[alvo].nome}: ${p.nome} (${p.ref}, ${p.regiao}, ${p.situacao}) · ${aplicadas.length} aplicada(s)`);
  }
  console.log("");
  const marca = (alvo, m) => {
    const c = colunas[alvo];
    if (!c.mapa.has(m.versao)) return "falta";
    return c.editadas.includes(m) ? "EDITADA DEPOIS DE APLICAR" : "aplicada";
  };
  for (const m of migracoes) console.log(`${m.arquivo}\n   STG: ${marca("stg", m)} · produção: ${marca("producao", m)}`);
  if (!migracoes.length) console.log("(nenhuma migração em supabase/migrations/)");
  for (const alvo of ["stg", "producao"]) {
    for (const d of colunas[alvo].desconhecidas) console.log(`\nAtenção: ${ALVOS[alvo].o} tem ${d.versao}_${d.nome}, que não está nesta branch. Traga a branch dela antes de aplicar (08, regra 4).`);
  }
}

async function testarLocal() {
  const { migracoes, testes } = testarNoLocal();
  console.log(`Banco local: ${migracoes.length} migração(ões) aplicada(s) do zero e ${testes.length} arquivo(s) de teste passaram.`);
  for (const t of testes) console.log("  ok  " + t);
}

async function aplicar(alvo) {
  const simular = opcao("simular");
  const p = await conferirProjeto(alvo);
  if (alvo === "producao") exigirConfirmacaoDaProducao(p, valorDe("projeto"));
  console.log(`Alvo: ${ALVOS[alvo].nome} · ${p.nome} (${p.ref}, ${p.regiao}, ${p.situacao})`);

  const { migracoes, testes } = testarNoLocal();
  console.log(`1. Banco local: ${migracoes.length} migração(ões) e ${testes.length} teste(s) passaram.`);

  const aplicadas = await aplicadasNo(p.ref);
  const { pendentes, desconhecidas, editadas, foraDeOrdem } = comparar(migracoes, aplicadas);
  if (desconhecidas.length) throw new Error(`${ALVOS[alvo].o[0].toUpperCase() + ALVOS[alvo].o.slice(1)} tem migração que esta branch não tem: ${desconhecidas.map(d => d.versao + "_" + d.nome).join(", ")}. Traga a branch dela antes de seguir (08, regra 4).`);
  if (editadas.length) throw new Error(`Migração editada depois de aplicada ${ALVOS[alvo].no}: ${editadas.map(m => m.arquivo).join(", ")}. Aplicada nunca se edita: crie uma nova (08, regra 7).`);
  if (foraDeOrdem.length) throw new Error(`Migração mais antiga que a última aplicada ${ALVOS[alvo].no}: ${foraDeOrdem.map(m => m.arquivo).join(", ")}. Renomeie com a data e hora de agora antes de aplicar.`);
  if (!pendentes.length) {
    console.log(`2. Nada a aplicar: ${ALVOS[alvo].o} já tem todas as ${aplicadas.length} migração(ões).`);
    return;
  }

  if (alvo === "producao") {
    const noStg = comparar(migracoes, await aplicadasNo(refDo("stg")));
    const semStg = pendentes.filter(m => noStg.pendentes.includes(m));
    if (semStg.length) throw new Error(`Ainda não passou pelo STG: ${semStg.map(m => m.arquivo).join(", ")}. Sempre STG primeiro (08, regra 3).`);
    if (noStg.editadas.length) throw new Error(`O arquivo mudou depois de aplicado no STG: ${noStg.editadas.map(m => m.arquivo).join(", ")}.`);
    const arriscadas = pendentes.map(m => [m, perigosos(m.sql)]).filter(([, l]) => l.length);
    if (arriscadas.length && !opcao("pode-destrutivo")) {
      throw new Error(`Comando destrutivo na produção (${arriscadas.map(([m, l]) => `${m.arquivo}: ${l.join(", ")}`).join("; ")}). Só com a Renderiza dizendo "pode" (08, regra 8); aí rode de novo com --pode-destrutivo.`);
    }
  }

  console.log(`2. A aplicar ${ALVOS[alvo].no}, em ordem: ${pendentes.map(m => m.arquivo).join(", ")}`);
  if (simular) {
    console.log("   (--simular: nada foi aplicado)");
    return;
  }
  for (const m of pendentes) {
    try {
      await consultar(p.ref, sqlDeAplicacao(m));
    } catch (e) {
      throw new Error(`${m.arquivo} falhou ${ALVOS[alvo].no} e nada dela ficou gravado (transação):\n${e.message}`);
    }
    const depois = await aplicadasNo(p.ref);
    if (!depois.some(a => a.versao === m.versao && a.sql === m.sql)) throw new Error(`${m.arquivo}: aplicada, mas o registro não confere ${ALVOS[alvo].no}. Pare e confira.`);
    console.log(`   ok  ${m.arquivo} (registrada em supabase_migrations.schema_migrations)`);
  }
  console.log(`\n3. Agora (08, regra 6): push da branch e, em "Migrações aplicadas" de docs/painel-clientes/missoes.md, a data ${dia()} na coluna ${alvo === "stg" ? "STG" : "Produção"}:`);
  for (const m of pendentes) console.log("   " + linhaDoQuadro(m, { missao: "N", branch: "claude/…", [alvo]: dia() }));
}

const COMANDOS = { situacao, local: testarLocal, stg: () => aplicar("stg"), producao: () => aplicar("producao") };

if (!COMANDOS[comando]) {
  console.error(`Comando desconhecido: ${comando}. Use: situacao, local, stg ou producao --projeto <ref>.`);
  process.exit(1);
}
try {
  await COMANDOS[comando]();
} catch (e) {
  console.error("\nParou: " + e.message);
  process.exit(1);
}
