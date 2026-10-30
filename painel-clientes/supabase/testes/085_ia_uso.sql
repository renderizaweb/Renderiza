-- A IA do onboarding (Missão 7, bloco D; migração 20261030250000; D45, D46): o uso e o teto são só da Renderiza; o dono
-- não vê o gasto nem muda o teto; a função grava pelo servidor. Dados fictícios.

create temporary table _u as select
  testes.criar_usuario('renderiza@ia-uso.teste') as renderiza,
  testes.criar_usuario('dono@ia-uso.teste') as dono;
grant select on _u to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select renderiza, 'Renderiza Teste' from _u;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Espaço da IA', 'eventos', 't-espaco-ia', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-espaco-ia') as conta;
grant select on _c to anon, authenticated;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select conta, dono, 'Dono', 'dono@ia-uso.teste', true from _c, _u;
-- a função (servidor) registra uma chamada
insert into public.ia_uso (conta_id, usuario_id, tarefa, modelo, entrada, saida, custo_usd, resultado)
  select conta, dono, 'proxima_pergunta', 'claude-opus-5-5', 300, 200, 0.0054, 'ok' from _c, _u;
select testes.afirmar_erro($$insert into public.ia_uso (conta_id, tarefa, modelo, resultado) select conta, 'Tarefa Inválida', 'x', 'ok' from _c$$, 'a tarefa tem formato');

select testes.entrar_como((select renderiza from _u));
select testes.afirmar((select sum(custo_usd) from public.ia_uso where conta_id = (select conta from _c)) = 0.0054, 'a Renderiza vê o gasto da conta');
insert into public.ia_contas (conta_id, teto_usd) select conta, 5 from _c;
select testes.afirmar((select teto_usd from public.ia_contas where conta_id = (select conta from _c)) = 5, 'a Renderiza muda o teto');
select testes.afirmar_erro($$insert into public.ia_uso (conta_id, tarefa, modelo, resultado) select conta, 'proxima_pergunta', 'x', 'ok' from _c$$, 'nem a Renderiza grava uso pelo painel (só a função)');
reset role;

select testes.entrar_como((select dono from _u));
select testes.afirmar((select count(*) from public.ia_uso) = 0, 'o dono não vê o gasto');
select testes.afirmar((select count(*) from public.ia_contas) = 0, 'o dono não vê o teto');
update public.ia_contas set teto_usd = 999 where conta_id = (select conta from _c);
reset role;
select testes.afirmar((select teto_usd from public.ia_contas where conta_id = (select conta from _c)) = 5, 'o dono não muda o teto');

select testes.entrar_como(null);
select testes.afirmar_erro($$select count(*) from public.ia_uso$$, 'o visitante não lê o uso');
reset role;
