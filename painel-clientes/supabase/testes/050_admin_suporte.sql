-- Admin (Missão 5A, migração 20261030120000): minhas_contas() traz a conta em que a Renderiza está em suporte
-- (para "entrar para ajudar" abrir o painel da conta), só enquanto o suporte vale e só para a equipe Renderiza.
-- Dados fictícios.

create temporary table _u as select
  testes.criar_usuario('dona@casa-admin.teste') as dona,
  testes.criar_usuario('suporte@renderiza-admin.teste') as suporte,
  testes.criar_usuario('outra@renderiza-admin.teste') as outra;
grant select on _u to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select suporte, 'Suporte Teste' from _u;
insert into public.equipe_renderiza (usuario_id, nome) select outra, 'Outra Teste' from _u;

insert into public.contas (nome, nicho, codigo, situacao, origem) values
  ('Casa do Admin', 'eventos', 't-casa-admin', 'desligada', 'renderiza'),
  ('Estúdio do Admin', 'fotografia', 't-estudio-admin', 'ativa', 'renderiza');
create temporary table _c as select
  (select id from public.contas where codigo = 't-casa-admin') as casa,
  (select id from public.contas where codigo = 't-estudio-admin') as estudio;
grant select on _c to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id) select casa, m from _c, unnest(array['agenda', 'financeiro']) as m;
insert into public.pessoas (conta_id, usuario_id, nome, dono) select casa, dona, 'Dona Teste', true from _c, _u;
insert into public.pessoas (conta_id, usuario_id, nome, dono) select estudio, outra, 'Outra Teste', true from _c, _u;

-- sem suporte: a Renderiza não tem a conta na lista
select testes.entrar_como((select suporte from _u));
select testes.afirmar((select count(*) from public.minhas_contas()) = 0, 'sem suporte: nenhuma conta na lista');
insert into public.acessos_suporte (conta_id, motivo, nivel, fim) select casa, 'Exportar os dados a pedido da dona', 'ver', now() + interval '1 hour' from _c;
create temporary table _m as select * from public.minhas_contas();
reset role;
select testes.afirmar(
  (select count(*) from _m) = 1
  and (select conta_id from _m) = (select casa from _c)
  and (select liberada from _m) and not (select dono from _m) and (select pessoa_id from _m) is null
  and (select modulos from _m) = array['agenda', 'financeiro']
  and (select acessos from _m) = '{"agenda": "ver", "financeiro": "ver"}'::jsonb
  and (select suporte_ate from _m) > now(),
  'em suporte "ver": a conta (mesmo desligada) com os módulos ligados, só vê, até quando');
select testes.entrar_como((select suporte from _u));
select testes.afirmar(public.pode((select casa from _c), 'financeiro', 'ver') and not public.pode((select casa from _c), 'financeiro', 'editar'), 'o banco deixa ver e não editar');
reset role;
-- o suporte acabou (no teste tudo roda numa transação só, com o mesmo now(): o banco mesmo põe no passado)
update public.acessos_suporte set inicio = now() - interval '2 hours', fim = now() - interval '1 hour' where conta_id = (select casa from _c);
select testes.entrar_como((select suporte from _u));
select testes.afirmar((select count(*) from public.minhas_contas()) = 0, 'suporte acabou: a conta sai da lista');
select testes.afirmar(not public.pode((select casa from _c), 'financeiro', 'ver'), 'suporte acabou: o banco não deixa ver');
reset role;

-- quem é da conta não ganha linha de suporte em dobro; a dona não vê suporte de ninguém na lista dela
select testes.entrar_como((select outra from _u));
insert into public.acessos_suporte (conta_id, motivo, nivel) select estudio, 'Ajudar a configurar', 'editar' from _c;
select testes.afirmar((select count(*) from public.minhas_contas()) = 1 and (select suporte_ate is null and dono from public.minhas_contas()), 'já é da conta: uma linha só, a dela');
reset role;
select testes.entrar_como((select dona from _u));
select testes.afirmar((select count(*) from public.minhas_contas()) = 1 and (select suporte_ate is null from public.minhas_contas()), 'a dona: só a conta dela, sem suporte');
reset role;
