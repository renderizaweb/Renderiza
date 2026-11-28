-- Testes dos projetos e das issues (supabase/projetos.sql e projetos-carga.sql), num Postgres local: ver
-- supabase/testes/README.md. Cada bloco para com erro na primeira coisa errada. Dois donos (A e B): A tem os leads
-- dos quatro clientes e o termo do vereador assinado em 18/11; B tem um lead só dele.
\set ON_ERROR_STOP on
set client_min_messages = warning;

insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b') on conflict do nothing;
insert into public.leads (id, dono, empresa, link_demo) values
  ('lead-rafaela', '00000000-0000-0000-0000-00000000000a', 'Rafaela Damaceno Fotografia', '/demo/rafaela-damaceno-fotografia'),
  ('lead-bia', '00000000-0000-0000-0000-00000000000a', 'Bia Maida Fotografia', '/demo/bia-maida-fotografia'),
  ('lead-ricardo', '00000000-0000-0000-0000-00000000000a', 'Ricardo Motors', '/demo/ricardo-motors'),
  ('lead-vereador', '00000000-0000-0000-0000-00000000000a', 'Vereador Mateuzinho Silva', '/demo/vereador-mateuzinho-silva'),
  ('lead-otica', '00000000-0000-0000-0000-00000000000a', 'Ótica Exemplo', '/demo/otica-exemplo'),
  ('lead-b', '00000000-0000-0000-0000-00000000000b', 'Ricardo Motors', '/demo/ricardo-motors')
  on conflict do nothing;
-- o termo do vereador como o de produção (de antes dos termos de lead: sem lead_id): um aceite antigo (de teste, 18/11)
-- e o dele, em 28/11; vale o mais recente
insert into public.termos_online (id, dono, titulo, texto, impressao)
  values ('vereador-mateuzinho-silva-v1', '00000000-0000-0000-0000-00000000000a', 'Contrato', 'x', repeat('a', 64)) on conflict do nothing;
insert into public.termos_aceites (termo_id, dono, nome, cpf, email, whatsapp, endereco, plano, impressao, criado_em)
  select 'vereador-mateuzinho-silva-v1', '00000000-0000-0000-0000-00000000000a', n, '000', 'v@exemplo.com', '11', 'Itapevi', 'gabinete', repeat('a', 64), quando::timestamptz
  from (values ('Teste da Renderiza', '2026-11-18 15:00-03'), ('Mateuzinho', '2026-11-28 10:00-03')) v(n, quando)
  where not exists (select 1 from public.termos_aceites);

create or replace function pg_temp.como(p_papel text, p_dono text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_dono, ''), false);
  execute format('set role %I', p_papel);
end $$;

-- a carga, como no SQL Editor (o papel postgres)
\i supabase/projetos-carga.sql

-- 1. Os ciclos: de sexta a quinta até o 8, o 9 de 27 a 29/11, de segunda a domingo do 10 em diante.
do $$ begin
  assert public.renderiza_ciclo_do_dia('2026-08-01') = 1, 'antes do ciclo 1 é 1';
  assert public.renderiza_ciclo_do_dia('2026-10-09') = 2, 'sexta 09/10: ciclo 2';
  assert public.renderiza_ciclo_do_dia('2026-11-26') = 8, 'quinta 26/11: ciclo 8';
  assert public.renderiza_ciclo_do_dia('2026-11-27') = 9, 'sexta 27/11: ciclo 9';
  assert public.renderiza_ciclo_do_dia('2026-11-29') = 9, 'domingo 29/11: ciclo 9';
  assert public.renderiza_ciclo_do_dia('2026-11-30') = 10, 'segunda 30/11: ciclo 10';
  assert public.renderiza_ciclo_do_dia('2026-12-06') = 10, 'domingo 06/12: ciclo 10';
  assert public.renderiza_ciclo_do_dia('2026-12-07') = 11, 'segunda 07/12: ciclo 11';
  assert public.renderiza_ciclo_do_dia('2027-01-01') = 14, '01/01/2027: ciclo 14';
end $$;

-- 2. A carga: os quatro projetos, ligados aos leads certos; as 17 issues em Done, numeradas na ordem.
do $$
declare n int;
begin
  assert (select count(*) from public.projetos) = 4, 'quatro projetos';
  assert (select lead_id from public.projetos where id = 'projeto-rafaela-damaceno') = 'lead-rafaela', 'Rafaela ligada';
  assert (select lead_id from public.projetos where id = 'projeto-bia-maida') = 'lead-bia', 'Bia ligada';
  assert (select lead_id from public.projetos where id = 'projeto-ricardo-motors') = 'lead-ricardo', 'Ricardo ligado (o lead de B não conta)';
  assert (select lead_id from public.projetos where id = 'projeto-vereador-mateuzinho') = 'lead-vereador', 'vereador ligado';
  assert (select count(*) from public.projetos where situacao = 'concluido') = 3, 'três concluídos';
  assert (select situacao from public.projetos where id = 'projeto-vereador-mateuzinho') = 'em_andamento', 'o do vereador em andamento';
  assert (select count(*) from public.issues) = 17, '17 issues';
  assert (select count(*) from public.issues where status = 'done' and feita_em is not null) = 17, 'todas feitas, com o dia';
  assert (select string_agg(numero::text, ',' order by posicao) from public.issues) = '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17', 'números na ordem';
  assert (select array_agg(distinct ciclo order by ciclo) from public.issues where projeto_id = 'projeto-rafaela-damaceno') = array[7], 'Rafaela no 7';
  assert (select array_agg(distinct ciclo order by ciclo) from public.issues where projeto_id = 'projeto-bia-maida') = array[8], 'Bia no 8';
  assert (select array_agg(distinct ciclo order by ciclo) from public.issues where projeto_id = 'projeto-ricardo-motors') = array[9], 'Ricardo no 9';
  assert (select ciclo from public.issues where id = 'issue-vereador-1') = 9, 'proposta (27/11) no ciclo 9, pela data';
  select ciclo into n from public.issues where id = 'issue-vereador-2';
  assert n = 9, 'contrato assinado em 28/11 (o mais recente do banco): ciclo 9, e não ' || n;
  assert (select feita_em from public.issues where id = 'issue-vereador-2') = '2026-11-28 10:00-03', 'a data da assinatura mais recente';
end $$;

-- 3. A carga de novo: nada duplica, nada muda.
\i supabase/projetos-carga.sql
do $$ begin
  assert (select count(*) from public.projetos) = 4 and (select count(*) from public.issues) = 17, 'carga idempotente';
end $$;

-- 4. O dono cria, numera, termina e reabre; o projeto concluído guarda o dia.
select pg_temp.como('authenticated', '00000000-0000-0000-0000-00000000000a');
insert into public.issues (id, titulo, projeto_id, estimativa) values ('nova-1', 'Layout da home', 'projeto-vereador-mateuzinho', 3);
do $$
declare r record;
begin
  select * into r from public.issues where id = 'nova-1';
  assert r.numero = 18, 'o próximo número do dono: ' || r.numero;
  assert r.status = 'backlog' and r.feita_em is null and r.ciclo is null, 'nasce no Backlog, sem ciclo';
  update public.issues set status = 'in_progress', ciclo = 10 where id = 'nova-1';
  update public.issues set status = 'done' where id = 'nova-1';
  select * into r from public.issues where id = 'nova-1';
  assert r.feita_em is not null and r.ciclo = 10, 'Done: o dia e o ciclo que já tinha';
  update public.issues set status = 'validation' where id = 'nova-1';
  select * into r from public.issues where id = 'nova-1';
  assert r.feita_em is null, 'saiu do Done: sem o dia';
  insert into public.issues (id, titulo, status) values ('nova-2', 'Feita sem ciclo', 'done');
  select * into r from public.issues where id = 'nova-2';
  assert r.ciclo = public.renderiza_ciclo_do_dia((now() at time zone 'America/Sao_Paulo')::date), 'Done sem ciclo: o ciclo de hoje';
  update public.projetos set situacao = 'concluido' where id = 'projeto-vereador-mateuzinho';
  assert (select concluido_em from public.projetos where id = 'projeto-vereador-mateuzinho') = (now() at time zone 'America/Sao_Paulo')::date, 'concluído: o dia';
  update public.projetos set situacao = 'em_andamento' where id = 'projeto-vereador-mateuzinho';
  assert (select concluido_em from public.projetos where id = 'projeto-vereador-mateuzinho') is null, 'reaberto: sem o dia';
end $$;
-- estimativa fora da escala e título vazio: o banco recusa
do $$ begin
  begin insert into public.issues (titulo, estimativa) values ('x', 4); raise exception 'aceitou estimativa 4'; exception when check_violation then null; end;
  begin insert into public.issues (titulo) values ('  '); raise exception 'aceitou título vazio'; exception when check_violation then null; end;
  begin insert into public.issues (titulo, status) values ('x', 'doing'); raise exception 'aceitou status estranho'; exception when check_violation then null; end;
end $$;
reset role;

-- 5. Isolamento: B não vê nada de A, não liga issue a projeto de A nem projeto a lead de A.
select pg_temp.como('authenticated', '00000000-0000-0000-0000-00000000000b');
do $$ begin
  assert (select count(*) from public.projetos) = 0, 'B não vê os projetos de A';
  assert (select count(*) from public.issues) = 0, 'B não vê as issues de A';
  begin insert into public.issues (titulo, projeto_id) values ('intrusa', 'projeto-ricardo-motors'); raise exception 'B usou projeto de A'; exception when foreign_key_violation then null; end;
  begin insert into public.projetos (nome, lead_id) values ('intruso', 'lead-ricardo'); raise exception 'B usou lead de A'; exception when foreign_key_violation then null; end;
  begin insert into public.issues (dono, titulo) values ('00000000-0000-0000-0000-00000000000a', 'no nome de A'); raise exception 'B gravou como A'; exception when insufficient_privilege then null; end;
  insert into public.issues (id, titulo) values ('b-1', 'A primeira de B');
  assert (select numero from public.issues where id = 'b-1') = 1, 'a numeração é de cada dono';
end $$;
reset role;
select pg_temp.como('anon', null);
do $$ begin
  begin perform 1 from public.issues; raise exception 'anon leu issues'; exception when insufficient_privilege then null; end;
end $$;
reset role;

-- 6. Excluir o cliente deixa o projeto sem cliente; excluir o projeto leva as issues dele.
do $$ begin
  delete from public.leads where id = 'lead-otica';
  insert into public.projetos (id, dono, nome, lead_id) values ('p-otica', '00000000-0000-0000-0000-00000000000a', 'Ótica', 'lead-ricardo');
  insert into public.issues (id, dono, titulo, projeto_id) values ('i-otica', '00000000-0000-0000-0000-00000000000a', 'Algo', 'p-otica');
  delete from public.leads where id = 'lead-ricardo';
  assert (select lead_id from public.projetos where id = 'projeto-ricardo-motors') is null, 'projeto fica, sem cliente';
  assert (select count(*) from public.issues where projeto_id = 'projeto-ricardo-motors') = 5, 'as issues ficam';
  delete from public.projetos where id = 'p-otica';
  assert not exists (select 1 from public.issues where id = 'i-otica'), 'excluir o projeto leva as issues';
end $$;

select 'projetos: tudo certo' as resultado;
