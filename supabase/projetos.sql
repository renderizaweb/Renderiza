-- Projetos e issues do painel de prospecção (28/11/2026, pedido do Kaue): a tela Projetos, no jeito do Linear.
-- O Pipeline é a venda; o trabalho depois dela (e qualquer outro trabalho da Renderiza) mora aqui:
--   projetos  começo, meta e fim; com cliente (um lead) ou sem. Um cliente pode ter vários (fase 1, fase 2…).
--   issues    o trabalho de verdade: Backlog, To-do, In progress, Validation e Done, com estimativa opcional
--             (1, 2, 3, 5, 8), ciclo e responsável. O número curto (#12) é por dono e o banco põe sozinho.
-- Ciclos semanais, de segunda a domingo desde 30/11/2026, os mesmos da prospecção (painel/src/tags.js): o ciclo 9
-- foi a passagem (27 a 29/11) e o 10 começa em 30/11. Issue que vai para Done sem ciclo ganha o do dia.
-- Ver painel/README.md, "Projetos".
--
-- Rode no SQL Editor do projeto da prospecção, depois do schema.sql. Pode rodar de novo sem perder dados: só
-- acrescenta (duas tabelas, as regras e o tempo real) e troca a função dos ciclos pela de segunda a domingo.
-- A carga dos primeiros projetos (Rafaela, Bia, Ricardo e o vereador) está em supabase/projetos-carga.sql.

-- ---------- ciclos: de segunda a domingo desde 30/11/2026 (o mesmo cálculo do schema.sql) ----------
create or replace function public.renderiza_ciclo_do_dia(d date)
returns int
language sql
immutable
set search_path = ''
as $$
  select case when d >= date '2026-11-30' then 10 + ((d - date '2026-11-30') / 7)
              else greatest(1, ((d - date '2026-10-02') / 7) + 1) end
$$;

-- ---------- projetos ----------
-- Excluir o cliente não apaga o projeto: ele só fica sem cliente. Excluir o projeto apaga as issues dele.
create table if not exists public.projetos (
  id            text primary key default gen_random_uuid()::text,
  dono          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome          text not null check (btrim(nome) <> ''),
  lead_id       text,
  descricao     text not null default '',
  situacao      text not null default 'em_andamento' check (situacao in ('em_andamento', 'concluido')),
  inicio        date,
  meta          date,
  concluido_em  date,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint projetos_id_dono_key unique (id, dono),
  constraint projetos_lead_do_dono foreign key (lead_id, dono) references public.leads (id, dono) on delete set null (lead_id)
);
create index if not exists projetos_dono_idx on public.projetos (dono, situacao);
create index if not exists projetos_lead_idx on public.projetos (lead_id);

-- ---------- issues ----------
create table if not exists public.issues (
  id            text primary key default gen_random_uuid()::text,
  dono          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  numero        integer check (numero > 0),
  titulo        text not null check (btrim(titulo) <> ''),
  descricao     text not null default '',
  projeto_id    text,
  status        text not null default 'backlog' check (status in ('backlog', 'todo', 'in_progress', 'validation', 'done')),
  estimativa    integer check (estimativa in (1, 2, 3, 5, 8)),
  ciclo         integer check (ciclo > 0),
  responsavel   text,
  posicao       double precision,
  feita_em      timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint issues_numero_do_dono unique (dono, numero),
  constraint issues_projeto_do_dono foreign key (projeto_id, dono) references public.projetos (id, dono) on delete cascade
);
create index if not exists issues_dono_status_idx on public.issues (dono, status);
create index if not exists issues_projeto_idx on public.issues (projeto_id);
create index if not exists issues_ciclo_idx on public.issues (dono, ciclo);

-- O número curto (o próximo do dono), e o Done: feita_em só em Done (posto na hora, se não vier) e, sem ciclo, o
-- ciclo do dia em que ficou pronta (Brasília). Vale para o painel, para a IA e para o SQL Editor.
create or replace function public.issues_preparar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.numero is null then
    select coalesce(max(i.numero), 0) + 1 into new.numero from public.issues i where i.dono = new.dono;
  end if;
  if new.status = 'done' then
    if new.feita_em is null then new.feita_em := now(); end if;
    if new.ciclo is null then
      new.ciclo := public.renderiza_ciclo_do_dia((new.feita_em at time zone 'America/Sao_Paulo')::date);
    end if;
  else
    new.feita_em := null;
  end if;
  return new;
end;
$$;
drop trigger if exists issues_preparar on public.issues;
create trigger issues_preparar before insert or update on public.issues
  for each row execute function public.issues_preparar();

-- Projeto concluído guarda o dia (Brasília), se não vier; reaberto, perde.
create or replace function public.projetos_preparar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.situacao = 'concluido' then
    if new.concluido_em is null then new.concluido_em := (now() at time zone 'America/Sao_Paulo')::date; end if;
  else
    new.concluido_em := null;
  end if;
  return new;
end;
$$;
drop trigger if exists projetos_preparar on public.projetos;
create trigger projetos_preparar before insert or update on public.projetos
  for each row execute function public.projetos_preparar();

drop trigger if exists projetos_atualizado_em on public.projetos;
create trigger projetos_atualizado_em before update on public.projetos
  for each row execute function public.tocar_atualizado_em();
drop trigger if exists issues_atualizado_em on public.issues;
create trigger issues_atualizado_em before update on public.issues
  for each row execute function public.tocar_atualizado_em();

-- ---------- acesso: cada um vê e mexe só no que é seu (como as outras tabelas) ----------
alter table public.projetos enable row level security;
alter table public.issues   enable row level security;
revoke all on public.projetos, public.issues from anon, authenticated;
grant select, insert, update, delete on public.projetos, public.issues to authenticated;

drop policy if exists "projetos do dono" on public.projetos;
create policy "projetos do dono" on public.projetos
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

drop policy if exists "issues do dono" on public.issues;
create policy "issues do dono" on public.issues
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

-- ---------- tempo real (opcional): o painel aberto em outro aparelho recebe as mudanças ----------
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['projetos', 'issues'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end;
$$;
