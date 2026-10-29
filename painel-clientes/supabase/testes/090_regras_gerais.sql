-- Regras que valem para o banco inteiro, inclusive para as tabelas e funções que as próximas missões criarem
-- (04 e 06): RLS ligada em toda tabela, o visitante (anon) sem acesso direto a nenhuma, e toda função com o
-- search_path fixo. Tabela nova que esquecer uma delas faz este teste falhar.

select testes.afirmar(
  (select string_agg(c.relname, ', ') from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity) is null,
  'toda tabela de public tem RLS ligada');

select testes.afirmar(
  (select string_agg(c.relname, ', ') from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
     and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('anon', c.oid, 'insert')
          or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'))) is null,
  'o visitante (anon) não lê nem grava nenhuma tabela direto: o público passa só por funções');

select testes.afirmar(
  (select string_agg(p.proname, ', ') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) as cfg where cfg like 'search_path=%')
     and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')) is null,
  'toda função nossa em public tem search_path fixo (as de extensões, como o pgcrypto do banco local, não contam)');

select testes.afirmar(
  (select string_agg(p.proname, ', ') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef and p.prorettype <> 'trigger'::regtype
     and has_function_privilege('anon', p.oid, 'execute')
     and p.proname not in ('pode', 'pode_algum', 'edita_algum', 'eh_membro', 'eh_equipe_renderiza', 'conta_liberada', 'em_suporte',
                           'minha_pessoa', 'pessoas_ativas', 'donos_ativos')) is null,
  'as funções security definer que fazem algo pedem login (as de regra só dizem sim ou não)');

-- Nenhuma visão em public roda com os direitos do dono (passaria por cima da RLS).
select testes.afirmar(
  (select string_agg(c.relname, ', ') from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'v'
     and not coalesce((select bool_or(o = 'security_invoker=true' or o = 'security_invoker=on') from unnest(c.reloptions) as o), false)) is null,
  'visões de public só com security_invoker');
