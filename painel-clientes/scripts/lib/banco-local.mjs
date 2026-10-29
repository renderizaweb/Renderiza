// O banco LOCAL de testes: Postgres 16 do ambiente das sessões (docs/painel-clientes/04-arquitetura.md).
// Cada rodada recria o banco `painel_clientes_teste` do zero, com a imitação do Supabase.
// Em outro computador: PAINEL_LOCAL_PG com o endereço de um Postgres seu (ex.: postgres://eu@localhost/postgres).

import { execFileSync, spawnSync } from "node:child_process";

export const BANCO_DE_TESTE = "painel_clientes_teste";

const ehRoot = typeof process.getuid === "function" && process.getuid() === 0;

/** Como chamar o psql: como o usuário `postgres` do sistema (ambiente das sessões) ou pelo endereço dado. */
function comandoPsql(banco) {
  const base = ["-X", "-q", "-v", "ON_ERROR_STOP=1", "--no-psqlrc"];
  if (process.env.PAINEL_LOCAL_PG) {
    const url = new URL(process.env.PAINEL_LOCAL_PG);
    if (banco) url.pathname = "/" + banco;
    return { cmd: "psql", args: [...base, url.toString()] };
  }
  const alvo = banco ? ["-d", banco] : ["-d", "postgres"];
  return ehRoot ? { cmd: "runuser", args: ["-u", "postgres", "--", "psql", ...base, ...alvo] } : { cmd: "psql", args: [...base, ...alvo] };
}

export function temPsql() {
  return spawnSync("psql", ["--version"]).status === 0;
}

/** Liga o Postgres do ambiente, se estiver desligado (só no ambiente das sessões, como root). */
export function garantirServidor() {
  if (process.env.PAINEL_LOCAL_PG || !ehRoot) return;
  const lista = spawnSync("pg_lsclusters", ["--no-header"], { encoding: "utf8" });
  if (lista.status !== 0) return;
  for (const linha of lista.stdout.trim().split("\n").filter(Boolean)) {
    const [versao, nome, , status] = linha.split(/\s+/);
    if (status !== "online") execFileSync("pg_ctlcluster", [versao, nome, "start"], { stdio: "inherit" });
  }
}

/** Roda SQL (texto) no banco; com `transacao`, tudo numa transação só (como a API do Supabase faz). */
export function rodar(sql, { banco = BANCO_DE_TESTE, mostrar = false, transacao = false } = {}) {
  const { cmd, args } = comandoPsql(banco);
  const r = spawnSync(cmd, [...args, ...(transacao ? ["-1"] : []), "-f", "-"], { input: sql, encoding: "utf8" });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "psql falhou").trim());
  if (mostrar && r.stdout.trim()) console.log(r.stdout.trim());
  return r.stdout;
}

/** Uma consulta que devolve um valor só (ex.: json_agg). */
export function valor(sql, { banco = BANCO_DE_TESTE } = {}) {
  const { cmd, args } = comandoPsql(banco);
  const r = spawnSync(cmd, [...args, "-A", "-t", "-c", sql], { encoding: "utf8" });
  if (r.status !== 0) throw new Error((r.stderr || "psql falhou").trim());
  return r.stdout.trim();
}

export function recriarBanco() {
  rodar(`drop database if exists ${BANCO_DE_TESTE} with (force);\ncreate database ${BANCO_DE_TESTE};`, { banco: null });
}
