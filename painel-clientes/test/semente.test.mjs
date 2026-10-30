// A semente de teste (supabase/semente/semente.mjs): sai dos exemplos e grava no banco local sem erro, duas vezes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { temPsql } from "../scripts/lib/banco-local.mjs";
import { gerarSql, uid, CONTAS } from "../supabase/semente/semente.mjs";

test("semente: ids fixos (rodar de novo substitui) e nada de produção", () => {
  assert.equal(uid("conta:villa-alecrim"), CONTAS.villa);
  assert.match(CONTAS.villa, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  const { sql, resumo } = gerarSql();
  assert.ok(resumo.villa.festas > 0 && resumo.ciranda.ensaios > 0);
  assert.match(sql, /^delete from public\.contas where id in/m, "começa apagando as duas contas de teste");
  // e-mail = algo@domínio (o "@villa.alecrim.teste" do site de teste é o Instagram, sem nada antes do @)
  assert.doesNotMatch(sql, /[a-z0-9._%+-]@(?!villa-alecrim\.teste|estudio-ciranda\.teste)[a-z0-9.-]+\.[a-z]+/i, "só e-mails fictícios sem o dono do STG");
  const r = spawnSync(process.execPath, [new URL("../supabase/semente/semente.mjs", import.meta.url).pathname, "producao"], { encoding: "utf8" });
  assert.notEqual(r.status, 0, "não existe semente para a produção");
});

test("semente no banco local: grava duas vezes e confere", { skip: !temPsql() && "sem psql neste computador" }, () => {
  const r = spawnSync(process.execPath, [new URL("../supabase/semente/semente.mjs", import.meta.url).pathname, "local"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const conferencia = JSON.parse(r.stdout.split("Banco local (painel_clientes_semente): ")[1]);
  const exemplos = JSON.parse(r.stdout.match(/Exemplos: (.*)/)[1]);
  assert.equal(conferencia.contas, 2);
  assert.equal(conferencia.pessoas, 6);
  assert.equal(conferencia.festas, exemplos.villa.festas);
  assert.equal(conferencia.ensaios, exemplos.ciranda.ensaios);
  assert.equal(conferencia.parcelas, exemplos.villa.parcelas + exemplos.ciranda.parcelas);
  assert.equal(conferencia.atividades, 0, "a semente não deixa histórico");
});
