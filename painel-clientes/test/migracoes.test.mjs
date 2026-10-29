import { test } from "node:test";
import assert from "node:assert/strict";
import { comparar, perigosos, problemas, soComandos, sqlDeAplicacao, lerMigracoes, NOME_DO_ARQUIVO } from "../scripts/lib/migracoes.mjs";
import { refDaUrl, consultar } from "../scripts/lib/supabase-api.mjs";

const m = (versao, sql = "select 1;") => ({ versao, nome: "x", arquivo: versao + "_x.sql", sql });

test("as migrações do repositório seguem o padrão do nome e rodam numa transação", () => {
  const lista = lerMigracoes(new URL("../supabase/migrations/", import.meta.url).pathname);
  assert.ok(lista.length >= 1);
  for (const mig of lista) {
    assert.match(mig.arquivo, NOME_DO_ARQUIVO);
    assert.deepEqual(problemas(mig.sql), [], mig.arquivo);
  }
});

test("comparar: pendentes, desconhecidas, editadas e fora de ordem", () => {
  const locais = [m("20261029000001"), m("20261029000002", "select 2;"), m("20261029000003")];
  const aplicadas = [{ versao: "20261029000002", sql: "select 2;" }, { versao: "20261029000009", sql: "x" }];
  const r = comparar(locais, aplicadas);
  assert.deepEqual(r.pendentes.map(x => x.versao), ["20261029000001", "20261029000003"]);
  assert.deepEqual(r.desconhecidas.map(x => x.versao), ["20261029000009"]);
  assert.deepEqual(r.foraDeOrdem.map(x => x.versao), ["20261029000001", "20261029000003"]);
  assert.deepEqual(r.editadas, []);
  assert.deepEqual(comparar([m("20261029000002", "select 22;")], aplicadas.slice(0, 1)).editadas.map(x => x.versao), ["20261029000002"]);
  assert.deepEqual(comparar(locais, []).pendentes.length, 3);
});

test("perigosos: acha o que apaga dado ou afrouxa a RLS, mas não dentro de função ou comentário", () => {
  assert.deepEqual(perigosos("create table a (id int);"), []);
  assert.deepEqual(perigosos("drop table a;"), ["drop"]);
  assert.deepEqual(perigosos("alter table a drop column b;"), ["alter table … drop"]);
  assert.deepEqual(perigosos("delete from a;"), ["delete"]);
  assert.deepEqual(perigosos("update public.a set b = 1;"), ["update"]);
  assert.deepEqual(perigosos("truncate a;"), ["truncate"]);
  assert.deepEqual(perigosos("alter table a disable row level security;"), ["desligar a RLS"]);
  assert.deepEqual(perigosos("drop policy \"x\" on a;"), ["drop"]);
  const funcao = "create function f() returns void language sql as $$ delete from a where id = 1; update a set b = 2; $$;\n-- drop table a\ncomment on table a is 'não apague: delete from a';";
  assert.deepEqual(perigosos(funcao), []);
  assert.deepEqual(perigosos("create function f() returns int language plpgsql as $corpo$ begin return 1; end $corpo$; drop table b;"), ["drop"]);
});

test("problemas: recusa controle de transação e o que não roda em transação", () => {
  assert.equal(problemas("begin; create table a(); commit;").length, 1);
  assert.equal(problemas("create index concurrently i on a(b);").length, 1);
  assert.equal(problemas("-- só comentário\n").length, 1);
  assert.deepEqual(problemas("do $$ begin perform 1; end $$; select case when true then 1 end;"), []);
});

test("soComandos tira textos e corpos de função", () => {
  assert.doesNotMatch(soComandos("select 'drop table x'; $$ drop table y $$"), /drop/);
});

test("sqlDeAplicacao: a migração e o registro, com o texto guardado tal como está no arquivo", () => {
  const mig = m("20261029000001", "comment on schema public is 'a $m$ b';\n");
  const sql = sqlDeAplicacao(mig);
  assert.match(sql, /create table if not exists supabase_migrations\.schema_migrations/);
  assert.match(sql, /comment on schema public is 'a \$m\$ b';/);
  assert.match(sql, /insert into supabase_migrations\.schema_migrations \(version, name, statements\) values \('20261029000001', \$m\$x\$m\$, array\[\$mm\$comment on schema public is 'a \$m\$ b';\n\$mm\$\]\);/);
});

test("refDaUrl e a trava do Painel de prospecção", () => {
  assert.equal(refDaUrl("https://abcdefghijklmnopqrst.supabase.co"), "abcdefghijklmnopqrst");
  assert.equal(refDaUrl("https://abcdefghijklmnopqrst.supabase.co/"), "abcdefghijklmnopqrst");
  assert.equal(refDaUrl("http://abcdefghijklmnopqrst.supabase.co"), null);
  assert.equal(refDaUrl(""), null);
  assert.throws(() => consultar("gxdwluswpczlfgvzxqvg", "select 1"), /prospecção/);
});
