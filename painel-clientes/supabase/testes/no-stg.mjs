// Roda os testes do banco (supabase/testes/*.sql) no STG de verdade, depois de aplicar as migrações lá
// (08: "aplicou no STG, confira que funciona lá"). Cada arquivo vai numa chamada só da API de gerenciamento, que
// roda numa transação; no fim um erro de propósito ("TESTES_OK") desfaz tudo: nenhum usuário, conta ou arquivo de
// teste fica no STG. Só no STG: nunca na produção.
//
//   node supabase/testes/no-stg.mjs

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { consultar } from "../../scripts/lib/supabase-api.mjs";
import { conferirProjeto } from "../../scripts/lib/projetos.mjs";

const PASTA = fileURLToPath(new URL(".", import.meta.url));

// Os mesmos ajudantes de supabase/local/imitacao-supabase.sql, para o Supabase de verdade (lá o auth.users não
// gera o id sozinho). Vivem só dentro da transação desfeita.
const AJUDANTES = `
create schema testes;
create function testes.criar_usuario(email text) returns uuid language sql as $f$
  insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', email, now(), '{}', '{}', now(), now())
  returning id
$f$;
create function testes.entrar_como(usuario uuid) returns void language plpgsql as $f$
begin
  if usuario is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', usuario, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
  end if;
end $f$;
create function testes.afirmar(condicao boolean, mensagem text) returns void language plpgsql as $f$
begin
  if condicao is distinct from true then raise exception 'FALHOU: %', mensagem; end if;
end $f$;
create function testes.afirmar_erro(comando text, mensagem text) returns void language plpgsql as $f$
begin
  begin
    execute comando;
  exception when others then
    return;
  end;
  raise exception 'FALHOU (era para dar erro): %', mensagem;
end $f$;
grant usage on schema testes to anon, authenticated;
grant execute on all functions in schema testes to anon, authenticated;
`;

const FIM = `\n;reset role;\ndo $f$ begin raise exception 'TESTES_OK'; end $f$;`;

const p = await conferirProjeto("stg");
console.log(`STG: ${p.nome} (${p.ref}) · cada teste numa transação desfeita no fim`);
const arquivos = readdirSync(PASTA).filter(a => a.endsWith(".sql")).sort();
let falhas = 0;
for (const a of arquivos) {
  const sql = AJUDANTES + readFileSync(join(PASTA, a), "utf8") + FIM;
  try {
    await consultar(p.ref, sql);
    console.log(`  ??  ${a}: terminou sem o erro final (não devia acontecer; confira o STG)`);
    falhas++;
  } catch (e) {
    if (e.message.includes("TESTES_OK")) {
      console.log(`  ok  ${a}`);
    } else {
      console.log(`  FALHOU  ${a}\n${e.message}\n`);
      falhas++;
    }
  }
}
if (falhas) process.exit(1);
console.log(`Todos os ${arquivos.length} arquivos de teste passaram no STG (e nada ficou gravado).`);
