-- Trazer o que tem (Missão 7, bloco F; migração 20261104120000): os arquivos ficam na pasta da conta e só o dono (ou a
-- Renderiza no suporte) mexe; o pedido à Renderiza e o registro do que foi trazido. Dados fictícios.

create function pg_temp.erro_com(comando text, trecho text, mensagem text) returns void language plpgsql as $f$
begin
  execute comando;
  raise exception 'esperava erro: %', mensagem;
exception when others then
  if position(trecho in sqlerrm) = 0 then raise exception '% (erro: %)', mensagem, sqlerrm; end if;
end $f$;

create temporary table _u as select
  testes.criar_usuario('renderiza@trazer.teste') as renderiza,
  testes.criar_usuario('dono@trazer.teste') as dono,
  testes.criar_usuario('outro@trazer.teste') as outro,
  testes.criar_usuario('equipe@trazer.teste') as equipe;
grant select on _u to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select renderiza, 'Renderiza Teste' from _u;
insert into public.contas (nome, nicho, codigo, situacao, origem) values
  ('Espaço Trazer', 'eventos', 't-espaco-trazer', 'ativa', 'renderiza'),
  ('Outro Espaço', 'eventos', 't-outro-trazer', 'ativa', 'renderiza');
create temporary table _c as select
  (select id from public.contas where codigo = 't-espaco-trazer') as conta,
  (select id from public.contas where codigo = 't-outro-trazer') as outra;
grant select on _c to anon, authenticated;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select conta, dono, 'Dono', 'dono@trazer.teste', true from _c, _u;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono, acessos) select conta, equipe, 'Equipe', 'equipe@trazer.teste', false, '{"agenda": "editar", "clientes": "editar"}' from _c, _u;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select outra, outro, 'Outro', 'outro@trazer.teste', true from _c, _u;

-- ---------- os arquivos ----------
select testes.entrar_como((select dono from _u));
insert into storage.objects (bucket_id, name) select 'importacoes', conta || '/lote-abc12345/orcamento.pdf' from _c;
select testes.afirmar((select count(*) from storage.objects where bucket_id = 'importacoes') = 1, 'o dono vê o arquivo que mandou');
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'importacoes', outra || '/lote-x/a.pdf' from _c$$, 'row-level security', 'não manda arquivo na pasta de outra conta');
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) values ('importacoes', 'solto.pdf')$$, 'row-level security', 'arquivo fora da pasta de uma conta');
reset role;

select testes.entrar_como((select equipe from _u));
select testes.afirmar((select count(*) from storage.objects where bucket_id = 'importacoes') = 0, 'a equipe não vê os arquivos (só o dono traz)');
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'importacoes', conta || '/lote-y/b.pdf' from _c$$, 'row-level security', 'a equipe não manda arquivo');
reset role;

select testes.entrar_como((select outro from _u));
select testes.afirmar((select count(*) from storage.objects where bucket_id = 'importacoes') = 0, 'outra conta não vê os arquivos');
reset role;

select testes.entrar_como((select dono from _u));
delete from storage.objects where bucket_id = 'importacoes' and name like (select conta || '/%' from _c);
select testes.afirmar((select count(*) from storage.objects where bucket_id = 'importacoes') = 0, 'o dono tira o arquivo');
reset role;

-- ---------- pedir à Renderiza ----------
select testes.entrar_como((select dono from _u));
insert into public.pedidos_a_renderiza (conta_id, pasta, arquivos, recado) select conta, 'pedido-abc12345', 3, 'O orçamento e a agenda.' from _c;
select pg_temp.erro_com($$insert into public.pedidos_a_renderiza (conta_id, pasta, arquivos, atendido_em) select conta, 'pedido-def12345', 1, now() from _c$$, 'row-level security', 'o pedido nasce aberto');
select pg_temp.erro_com($$insert into public.pedidos_a_renderiza (conta_id, pasta, arquivos) select conta, 'pasta errada', 1 from _c$$, 'check', 'a pasta tem formato');
select pg_temp.erro_com($$select public.admin_pedidos_a_renderiza()$$, 'Só a equipe Renderiza', 'o dono não lista os pedidos de todos');
reset role;

select testes.entrar_como((select outro from _u));
select testes.afirmar((select count(*) from public.pedidos_a_renderiza) = 0, 'outra conta não vê o pedido');
select pg_temp.erro_com($$insert into public.pedidos_a_renderiza (conta_id, pasta, arquivos) select conta, 'pedido-xyz12345', 1 from _c$$, 'row-level security', 'não pede pela conta dos outros');
reset role;

select testes.entrar_como((select renderiza from _u));
select testes.afirmar(jsonb_array_length(public.admin_pedidos_a_renderiza()) = 1, 'a Renderiza vê o pedido aberto');
select testes.afirmar((select (r ->> 'arquivos')::int = 3 and r ->> 'recado' = 'O orçamento e a agenda.' from jsonb_array_elements(public.admin_pedidos_a_renderiza()) r), 'com os arquivos e o recado');
update public.pedidos_a_renderiza set atendido_em = now(), atendido_por = (select renderiza from _u) where conta_id = (select conta from _c);
select testes.afirmar(jsonb_array_length(public.admin_pedidos_a_renderiza()) = 0, 'atendido, sai da lista');
reset role;

-- ---------- o que foi trazido ----------
select testes.entrar_como((select dono from _u));
insert into public.importacoes (conta_id, arquivos, pacotes, datas, clientes, modelos) select conta, 4, 3, 12, 20, 1 from _c;
select pg_temp.erro_com($$insert into public.importacoes (conta_id, datas) select outra, 1 from _c$$, 'row-level security', 'não registra na conta dos outros');
reset role;

select testes.entrar_como((select equipe from _u));
select testes.afirmar((select count(*) from public.importacoes) = 0, 'a equipe não vê o registro');
reset role;

select testes.entrar_como((select renderiza from _u));
select testes.afirmar((select (r -> 'trouxe' ->> 'datas')::int = 12 and (r -> 'trouxe' ->> 'pacotes')::int = 3
  from jsonb_array_elements(public.admin_onboarding()) r where r ->> 'conta_id' = (select conta::text from _c)), 'o Admin vê o que a conta trouxe');
select testes.afirmar((select r -> 'trouxe' = 'null'::jsonb or not (r ? 'trouxe') or r -> 'trouxe' is null
  from jsonb_array_elements(public.admin_onboarding()) r where r ->> 'conta_id' = (select outra::text from _c)), 'conta que não trouxe nada: sem "trouxe"');
reset role;

select testes.entrar_como(null);
select pg_temp.erro_com($$select count(*) from public.importacoes$$, 'permission denied', 'visitante não lê o registro');
select pg_temp.erro_com($$select count(*) from public.pedidos_a_renderiza$$, 'permission denied', 'visitante não lê os pedidos');
reset role;
