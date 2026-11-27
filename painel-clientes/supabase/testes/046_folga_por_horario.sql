-- Fechar só um horário (migração 20261117120000): o periodo_livre respeita o pedaço fechado; sem horário, o dia todo.
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Estúdio da Folga', 'fotografia', 't-estudio-folga', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-estudio-folga') as id;
insert into public.bloqueios (conta_id, de, ate, inicio, fim, motivo) select id, '2030-03-05', '2030-03-05', '10:00', '11:00', 'Médico' from _c;
insert into public.bloqueios (conta_id, de, ate) select id, '2030-03-06', '2030-03-06' from _c;
select testes.afirmar(not public.periodo_livre((select id from _c), '2030-03-05 10:00-03', '2030-03-05 11:00-03'), 'o horário fechado não está livre');
select testes.afirmar(not public.periodo_livre((select id from _c), '2030-03-05 09:30-03', '2030-03-05 10:30-03'), 'o que cruza o horário fechado também não');
select testes.afirmar(public.periodo_livre((select id from _c), '2030-03-05 11:00-03', '2030-03-05 12:00-03'), 'o horário seguinte segue livre');
select testes.afirmar(public.periodo_livre((select id from _c), '2030-03-05 09:00-03', '2030-03-05 10:00-03'), 'e o de antes também');
select testes.afirmar(not public.periodo_livre((select id from _c), '2030-03-06 15:00-03', '2030-03-06 16:00-03'), 'sem horário: o dia inteiro fechado, como antes');
select testes.afirmar_erro($$insert into public.bloqueios (conta_id, de, ate, inicio) select id, '2030-03-07', '2030-03-07', '10:00' from _c$$, 'início sem fim não entra');
select testes.afirmar_erro($$insert into public.bloqueios (conta_id, de, ate, inicio, fim) select id, '2030-03-07', '2030-03-07', '11:00', '10:00' from _c$$, 'fim antes do início não entra');
