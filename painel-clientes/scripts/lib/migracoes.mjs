// As migrações do Painel Renderiza: ler os arquivos, comparar com o que o banco já tem e montar o SQL que
// aplica uma migração e a registra no próprio banco, numa transação só.
// Funções puras (sem rede nem banco), testadas em test/migracoes.test.mjs.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const NOME_DO_ARQUIVO = /^(\d{14})_([a-z0-9_]+)\.sql$/;

// O mesmo registro do `supabase db push`: dá para trocar de caminho sem perder o histórico.
export const TABELA_DE_REGISTRO = "supabase_migrations.schema_migrations";
const CRIAR_REGISTRO = `create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text not null primary key);
alter table supabase_migrations.schema_migrations add column if not exists statements text[];
alter table supabase_migrations.schema_migrations add column if not exists name text;`;

// Duas consultas: o Postgres confere se a tabela existe antes de rodar, então não dá para juntar num `case`.
export const SQL_TEM_REGISTRO = `select to_regclass('${TABELA_DE_REGISTRO}') is not null as existe`;
export const SQL_DO_REGISTRO = `select coalesce(json_agg(json_build_object('versao', version, 'nome', name, 'sql', statements[1]) order by version), '[]'::json) as aplicadas
  from ${TABELA_DE_REGISTRO}`;

export function lerMigracoes(pasta) {
  const arquivos = readdirSync(pasta).filter(a => a.endsWith(".sql")).sort();
  return arquivos.map(arquivo => {
    const m = arquivo.match(NOME_DO_ARQUIVO);
    if (!m) throw new Error(`Nome fora do padrão AAAAMMDDHHMMSS_assunto.sql: ${arquivo}`);
    return { versao: m[1], nome: m[2], arquivo, sql: readFileSync(join(pasta, arquivo), "utf8") };
  });
}

/** Tira comentários, textos entre aspas e corpos de função ($$ … $$), para olhar só os comandos. */
export function soComandos(sql) {
  return sql
    .replace(/\$([A-Za-z_][A-Za-z0-9_]*)?\$[\s\S]*?\$\1\$/g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
}

const PERIGOSOS = [
  [/\bdrop\s+(table|schema|view|materialized\s+view|type|function|policy|trigger|index|extension)\b/i, "drop"],
  [/\balter\s+table\b[^;]*\bdrop\b/i, "alter table … drop"],
  [/\btruncate\b/i, "truncate"],
  [/\bdelete\s+from\b/i, "delete"],
  [/\bupdate\s+[\w."]+\s+set\b/i, "update"],
  [/\bdisable\s+row\s+level\s+security\b/i, "desligar a RLS"],
  [/\bno\s+force\s+row\s+level\s+security\b/i, "afrouxar a RLS"],
];

/** Comandos que apagam dados ou afrouxam a RLS: na produção, só com a Renderiza dizendo "pode" (08, regra 8). */
export function perigosos(sql) {
  const cmd = soComandos(sql);
  return PERIGOSOS.filter(([re]) => re.test(cmd)).map(([, nome]) => nome);
}

/** O que impede a migração de rodar numa transação só (o script aplica tudo numa transação). */
export function problemas(sql) {
  const cmd = soComandos(sql);
  const lista = [];
  if (/(^|;)\s*(begin(\s+(work|transaction))?|commit|rollback|start\s+transaction)\s*(;|$)/i.test(cmd)) lista.push("controle de transação (begin/commit): o script já abre uma transação");
  if (/\bconcurrently\b/i.test(cmd)) lista.push("concurrently não roda dentro de transação");
  if (/\bvacuum\b/i.test(cmd)) lista.push("vacuum não roda dentro de transação");
  if (!cmd.trim().replace(/;/g, "").trim()) lista.push("arquivo sem nenhum comando");
  return lista;
}

/** Texto entre $tag$ que não aparece dentro do próprio SQL. */
function cotar(texto) {
  let tag = "m";
  while (texto.includes("$" + tag + "$")) tag += "m";
  return `$${tag}$${texto}$${tag}$`;
}

/** A migração e o registro dela, para rodar numa transação só (igual no local, no STG e na produção). */
export function sqlDeAplicacao(m) {
  return `${CRIAR_REGISTRO}
-- migração ${m.arquivo}
${m.sql.trim().replace(/;?\s*$/, ";")}
-- registro
insert into ${TABELA_DE_REGISTRO} (version, name, statements) values ('${m.versao}', ${cotar(m.nome)}, array[${cotar(m.sql)}]);`;
}

/**
 * Compara os arquivos com o que o banco já tem.
 * - pendentes: arquivos que o banco não tem, em ordem;
 * - desconhecidas: o banco tem e o repositório não (traga a branch delas antes de seguir; 08, regra 4);
 * - editadas: o banco tem, mas o arquivo mudou depois de aplicado (migração aplicada nunca é editada; regra 7);
 * - foraDeOrdem: pendentes mais antigas que a última aplicada.
 */
export function comparar(locais, aplicadas) {
  const noBanco = new Map(aplicadas.map(a => [a.versao, a]));
  const noRepo = new Set(locais.map(m => m.versao));
  const pendentes = locais.filter(m => !noBanco.has(m.versao));
  const desconhecidas = aplicadas.filter(a => !noRepo.has(a.versao));
  const editadas = locais.filter(m => noBanco.has(m.versao) && noBanco.get(m.versao).sql != null && noBanco.get(m.versao).sql !== m.sql);
  const ultima = aplicadas.map(a => a.versao).sort().at(-1) || "";
  const foraDeOrdem = pendentes.filter(m => m.versao < ultima);
  return { pendentes, desconhecidas, editadas, foraDeOrdem };
}

/** A linha para a tabela "Migrações aplicadas" de docs/painel-clientes/missoes.md. */
export function linhaDoQuadro(m, { missao, branch, stg = "—", producao = "—" }) {
  return `| \`${m.arquivo}\` | ${missao} | \`${branch}\` | ${stg} | ${producao} |`;
}
