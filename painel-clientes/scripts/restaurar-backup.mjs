// O teste de restauração do backup (Missão 5B; 06: "backup que nunca foi restaurado não conta"). Decifra o arquivo,
// monta um banco vazio no Postgres local com a imitação do Supabase e todas as migrações do repositório, põe os dados
// do backup e confere, tabela por tabela, que as contagens batem (e as imagens, pelo sha256). Nunca imprime dado.
//
//   node scripts/restaurar-backup.mjs <arquivo.rzbk>                 restaura no banco local de teste e confere
//   node scripts/restaurar-backup.mjs <arquivo.rzbk> --sql <saida>   só escreve o SQL de restauração (para um banco
//                                                                     novo do Supabase, depois das migrações)
//
// Precisa de BACKUP_SENHA (e do Postgres local, ou PAINEL_LOCAL_PG).

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { decifrar, senhaDoAmbiente, sqlDeRestauracao, sqlDasSequencias, resumo } from "./lib/backup.mjs";
import { lerMigracoes, sqlDeAplicacao } from "./lib/migracoes.mjs";
import * as local from "./lib/banco-local.mjs";

const PASTA = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const arquivo = args[0];
const opcao = nome => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
if (!arquivo) throw new Error("Use: node scripts/restaurar-backup.mjs <arquivo.rzbk> [--sql <saida.sql>]");

const backup = JSON.parse(decifrar(readFileSync(arquivo), senhaDoAmbiente()));
console.log(`Backup de ${backup.criado_em} (projeto ${backup.projeto}): ${resumo(backup)}`);

// as imagens chegaram inteiras?
for (const i of backup.imagens) {
  if (createHash("sha256").update(Buffer.from(i.base64, "base64")).digest("hex") !== i.sha256) throw new Error(`Imagem corrompida: ${i.bucket}/${i.nome}`);
}

const migracoes = lerMigracoes(join(PASTA, "supabase", "migrations"));
const doRepositorio = new Set(migracoes.map(m => m.versao));
const faltam = backup.migracoes.filter(v => !doRepositorio.has(v));
if (faltam.length) throw new Error(`O backup tem migrações que este repositório não tem: ${faltam.join(", ")}. Traga a main antes.`);

if (opcao("--sql")) {
  writeFileSync(opcao("--sql"), sqlDeRestauracao(backup) + "\n");
  console.log(`SQL escrito em ${opcao("--sql")}. Num projeto novo do Supabase: aplique as migrações (scripts/migrar.mjs) e rode o SQL; as imagens voltam pelo Storage (estão no backup, em base64).`);
  process.exit(0);
}

if (!local.temPsql()) throw new Error("Não achei o psql (o Postgres local, ou PAINEL_LOCAL_PG).");
local.garantirServidor();
local.recriarBanco();
local.rodar(readFileSync(join(PASTA, "supabase", "local", "imitacao-supabase.sql"), "utf8"), { transacao: true });
for (const m of migracoes) local.rodar(sqlDeAplicacao(m), { transacao: true });
console.log(`Banco local montado do zero com ${migracoes.length} migrações.`);

const existentes = new Set(JSON.parse(local.valor(`select coalesce(json_agg(n.nspname || '.' || c.relname), '[]') from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'r' and n.nspname in ('public', 'auth', 'storage')`)));
const colunas = n => JSON.parse(local.valor(`select coalesce(json_agg(attname order by attnum), '[]') from pg_attribute where attrelid = '${n.split(".").map(x => `"${x}"`).join(".")}'::regclass and attnum > 0 and not attisdropped and attgenerated = ''`));
const puladas = Object.keys(backup.tabelas).filter(n => !existentes.has(n));
local.rodar(sqlDeRestauracao(backup, { existe: n => existentes.has(n), colunas }), { transacao: true });
const identidades = JSON.parse(local.valor(`select coalesce(json_agg(json_build_object('tabela', table_schema || '.' || table_name, 'coluna', column_name)), '[]') from information_schema.columns where table_schema = 'public' and identity_generation is not null`));
if (identidades.length) local.rodar(sqlDasSequencias(identidades), { transacao: true });

let erros = 0;
for (const [n, esperado] of Object.entries(backup.contagens)) {
  if (!existentes.has(n)) continue;
  const veio = Number(local.valor(`select count(*) from ${n.split(".").map(x => `"${x}"`).join(".")}`));
  if (veio !== esperado) { erros++; console.log(`  diferente  ${n}: backup ${esperado}, restaurado ${veio}`); }
}
const total = Object.entries(backup.contagens).filter(([n]) => existentes.has(n)).reduce((t, [, x]) => t + x, 0);
if (puladas.length) console.log(`Ficaram de fora (o banco local não tem): ${puladas.join(", ")}. Num projeto do Supabase elas existem.`);
if (erros) { console.log(`FALHOU: ${erros} tabela(s) com contagem diferente.`); process.exit(1); }
console.log(`Restaurado e conferido: ${total} linhas em ${Object.keys(backup.contagens).length - puladas.length} tabelas batem com o backup; ${backup.imagens.length} imagens íntegras.`);
