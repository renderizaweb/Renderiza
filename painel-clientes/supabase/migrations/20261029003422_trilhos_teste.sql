-- Migração de teste da Missão 1, inofensiva: só troca o comentário do schema public. Prova o caminho
-- local → STG → produção e o registro em supabase_migrations.schema_migrations. Não cria, muda nem apaga dado.
comment on schema public is 'Painel Renderiza: a estrutura muda só por migração (painel-clientes/supabase/migrations).';
