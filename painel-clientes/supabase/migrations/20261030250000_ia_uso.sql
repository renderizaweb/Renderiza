-- Missão 7, bloco D (D45, D46): a IA do onboarding mora numa função do servidor (supabase/functions/assistente), com a
-- chave só no ambiente dela. Aqui, o que ela registra e o que a limita: cada chamada (a tarefa, o modelo, os tokens e
-- o custo em dólar) e o teto por conta (começa em US$ 3; a Renderiza muda no Admin). Só a Renderiza vê; a função grava
-- pelo servidor. O dono não vê nem muda o teto.

create table public.ia_contas (
  conta_id uuid primary key references public.contas (id) on delete cascade,
  teto_usd numeric(7, 2) not null default 3 check (teto_usd >= 0 and teto_usd <= 1000),
  atualizado_em timestamptz not null default now()
);
comment on table public.ia_contas is 'O teto de gasto com IA por conta (D46). Sem linha, vale o padrão de US$ 3. Só a Renderiza.';
create trigger ia_contas_atualizado before update on public.ia_contas for each row execute function public.marcar_atualizado();

create table public.ia_uso (
  id bigint generated always as identity primary key,
  conta_id uuid not null references public.contas (id) on delete cascade,
  usuario_id uuid,
  tarefa text not null check (tarefa ~ '^[a-z_]{3,40}$'),
  modelo text not null check (length(modelo) <= 60),
  entrada integer not null default 0 check (entrada >= 0),
  saida integer not null default 0 check (saida >= 0),
  cache_lido integer not null default 0 check (cache_lido >= 0),
  cache_escrito integer not null default 0 check (cache_escrito >= 0),
  custo_usd numeric(10, 6) not null default 0 check (custo_usd >= 0),
  resultado text not null check (resultado in ('ok', 'invalido', 'recusou', 'falhou')),
  criado_em timestamptz not null default now()
);
comment on table public.ia_uso is 'Cada chamada à IA (D45): a tarefa, o modelo, os tokens, o custo em dólar e como terminou. Sem o conteúdo da conversa. Só a Renderiza vê.';
create index ia_uso_conta on public.ia_uso (conta_id, criado_em desc);

alter table public.ia_contas enable row level security;
alter table public.ia_uso enable row level security;
create policy "ia_contas: a Renderiza" on public.ia_contas for all to authenticated
  using (public.eh_equipe_renderiza()) with check (public.eh_equipe_renderiza());
create policy "ia_uso: a Renderiza vê" on public.ia_uso for select to authenticated using (public.eh_equipe_renderiza());
revoke all on public.ia_contas, public.ia_uso from anon;
grant select, insert, update on public.ia_contas to authenticated;
grant select on public.ia_uso to authenticated;
