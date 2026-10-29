-- A migração de teste da Missão 1 foi aplicada e registrada.
select testes.afirmar(
  obj_description('public'::regnamespace) = 'Painel Renderiza: a estrutura muda só por migração (painel-clientes/supabase/migrations).',
  'comentário do schema public');
select testes.afirmar(
  exists (select from supabase_migrations.schema_migrations where version = '20261029003422' and name = 'trilhos_teste'),
  'migração registrada em supabase_migrations.schema_migrations');
