// Os testes do banco no Postgres local: imitação do Supabase + todas as migrações do zero + supabase/testes/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { temPsql } from "../scripts/lib/banco-local.mjs";

test("banco local: migrações do zero e testes de supabase/testes/", { skip: !temPsql() && "sem psql neste computador" }, () => {
  const r = spawnSync(process.execPath, [new URL("../scripts/migrar.mjs", import.meta.url).pathname, "local"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /testes? passaram|teste\(s\) passaram/);
});
