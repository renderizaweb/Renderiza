-- O uso do painel (migração 20261119004809): o sinal de um minuto (registrar_uso), no máximo um por minuto por pessoa e
-- conta, sem contar a Renderiza em suporte, e o resumo do Admin (admin_uso), só para a equipe Renderiza. Dados fictícios.

create function pg_temp.erro_com(comando text, trecho text, mensagem text) returns void language plpgsql as $f$
begin
  begin
    execute comando;
  exception when others then
    if position(trecho in sqlerrm) = 0 then
      raise exception 'FALHOU (outro erro): % · esperava "%" · veio: %', mensagem, trecho, sqlerrm;
    end if;
    return;
  end;
  raise exception 'FALHOU (era para dar erro): %', mensagem;
end $f$;

create temporary table _u as select
  testes.criar_usuario('dona@uso.teste') as dona,
  testes.criar_usuario('ajudante@uso.teste') as ajudante,
  testes.criar_usuario('fora@uso.teste') as fora,
  testes.criar_usuario('renderiza@uso.teste') as renderiza;
grant select on _u to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select renderiza, 'Equipe Teste' from _u;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Estúdio do Uso', 'fotografia', 't-estudio-uso', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-estudio-uso') as conta;
grant select on _c to anon, authenticated;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select conta, dona, 'Dona Uso', 'dona@uso.teste', true from _c, _u;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select conta, ajudante, 'Ajudante Uso', 'ajudante@uso.teste', false from _c, _u;
-- um convite que ainda espera (a pessoa não criou a senha)
insert into public.convites (conta_id, email, nome, dono, expira_em) select conta, 'nova@uso.teste', 'Nova Uso', false, now() + interval '7 days' from _c;

-- ---------- o sinal de um minuto ----------
select testes.entrar_como((select dona from _u));
select testes.afirmar(public.registrar_uso((select conta from _c), 'agenda') = true, 'o primeiro sinal conta');
select testes.afirmar(public.registrar_uso((select conta from _c), 'clientes') = false, 'outro sinal em menos de 50 segundos (outra aba) não conta');
select pg_temp.erro_com($$select count(*) from public.uso_diario$$, 'permission denied', 'quem usa não lê a tabela de uso');
reset role;
select testes.afirmar(
  (select minutos = 1 and modulo = 'agenda' and dia = (now() at time zone 'America/Sao_Paulo')::date from public.uso_diario u, _u where u.usuario_id = dona),
  'um minuto na agenda, no dia do fuso da conta');
select testes.afirmar((select visto_em > now() - interval '1 minute' from public.pessoas p, _u where p.usuario_id = dona), 'o sinal atualiza o "visto em" (usando agora)');

-- um minuto depois: soma no mesmo módulo; em outro módulo, linha nova
update public.uso_diario set ultimo = now() - interval '61 seconds';
select testes.entrar_como((select dona from _u));
select testes.afirmar(public.registrar_uso((select conta from _c), 'agenda'), 'um minuto depois, conta de novo');
reset role;
update public.uso_diario set ultimo = now() - interval '61 seconds';
select testes.entrar_como((select dona from _u));
select testes.afirmar(public.registrar_uso((select conta from _c), 'Meu Site!'), 'módulo fora do formato também conta');
reset role;
select testes.afirmar(
  (select string_agg(modulo || ':' || minutos, ',' order by modulo) from public.uso_diario u, _u where u.usuario_id = dona) = 'agenda:2,outro:1',
  'dois minutos na agenda e um em "outro"');
-- de dias passados, para o período do Admin
insert into public.uso_diario (usuario_id, conta_id, pessoa_id, dia, modulo, minutos, ultimo)
  select dona, conta, (select id from public.pessoas where usuario_id = dona), current_date - 3, 'meu-site', 40, now() - interval '3 days' from _u, _c;
insert into public.uso_diario (usuario_id, conta_id, pessoa_id, dia, modulo, minutos, ultimo)
  select dona, conta, (select id from public.pessoas where usuario_id = dona), current_date - 60, 'financeiro', 500, now() - interval '60 days' from _u, _c;
insert into public.entradas (usuario_id, conta_id, pessoa_id, quando) select dona, conta, (select id from public.pessoas where usuario_id = dona), now() - interval '2 days' from _u, _c;
insert into public.entradas (usuario_id, conta_id, pessoa_id, quando) select dona, conta, (select id from public.pessoas where usuario_id = dona), now() - interval '50 days' from _u, _c;

-- quem não é da conta, e a Renderiza em suporte, não contam
select testes.entrar_como((select fora from _u));
select testes.afirmar(public.registrar_uso((select conta from _c), 'agenda') = false, 'quem não é da conta não conta');
reset role;
insert into public.acessos_suporte (conta_id, usuario_id, motivo, nivel, inicio, fim)
  select conta, renderiza, 'Teste do uso', 'ver', now(), now() + interval '1 hour' from _c, _u;
select testes.entrar_como((select renderiza from _u));
select testes.afirmar(public.registrar_uso((select conta from _c), 'agenda') = false, 'a Renderiza em suporte não conta');
reset role;
select testes.afirmar((select count(*) from public.uso_diario u, _u where u.usuario_id in (fora, renderiza)) = 0, 'nada gravado para quem não conta');

-- ---------- o resumo do Admin ----------
select testes.entrar_como((select dona from _u));
select pg_temp.erro_com($$select public.admin_uso(30)$$, 'Só a equipe Renderiza', 'a dona da conta não vê o resumo do Admin');
reset role;
select testes.entrar_como(null);
select pg_temp.erro_com($$select public.admin_uso(30)$$, 'permission denied', 'o visitante não chega ao resumo');
select pg_temp.erro_com($$select public.registrar_uso(null, 'agenda')$$, 'permission denied', 'o visitante não manda sinal');
reset role;
select testes.entrar_como((select renderiza from _u));
create temporary table _r as select public.admin_uso(30) as r;
create temporary table _r7 as select public.admin_uso(1) as r;
reset role;
select testes.afirmar(
  (select p ->> 'minutos' = '43' and p ->> 'entradas' = '1' and p ->> 'dias_com_uso' = '2' and p -> 'modulos' -> 0 ->> 'modulo' = 'meu-site'
     and p ->> 'primeira_entrada' is not null and p ->> 'conta' = 'Estúdio do Uso'
   from _r, jsonb_array_elements(r -> 'pessoas') p where p ->> 'nome' = 'Dona Uso'),
  '30 dias: 43 minutos (40 no Meu site, 3 hoje), 1 entrada, 2 dias com uso; o de 60 dias atrás fica de fora');
select testes.afirmar(
  (select p ->> 'minutos' = '0' and p ->> 'entradas' = '0' and p ->> 'primeira_entrada' is null
   from _r, jsonb_array_elements(r -> 'pessoas') p where p ->> 'nome' = 'Ajudante Uso'),
  'quem nunca entrou aparece, com zero e sem primeira entrada');
select testes.afirmar(
  (select p ->> 'minutos' from _r7, jsonb_array_elements(r -> 'pessoas') p where p ->> 'nome' = 'Dona Uso') = '3',
  'o período de 1 dia só soma hoje');
select testes.afirmar(
  (select c ->> 'nome' = 'Nova Uso' and c ->> 'link_usado_em' is null and c ->> 'mandado_em' is not null
   from _r, jsonb_array_elements(r -> 'convites') c where c ->> 'email' = 'nova@uso.teste'),
  'o convite que espera aparece (a pessoa não criou a senha)');
