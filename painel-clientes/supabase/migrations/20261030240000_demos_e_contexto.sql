-- Missão 7, bloco C (D41, D51): a conta nasce da demo do lead. O catálogo das demos de eventos e de fotografia
-- (gravado por scripts/demos.mjs a partir de demos/<pasta>/demo.json: só o que o painel e a IA usam) e o contexto da
-- conta (a demo de onde veio, o que ela sabia e a conversa com o lead colada pela Renderiza). Os dois são fechados:
-- só a equipe da Renderiza vê pelo painel; a IA do onboarding (bloco D) lê pelo servidor. O dono não vê a conversa.

create table public.demos (
  pasta text primary key check (pasta ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  nicho text not null check (nicho in ('eventos', 'fotografia')),
  nome text not null check (length(btrim(nome)) between 1 and 120),
  dados jsonb not null default '{}' check (jsonb_typeof(dados) = 'object'),
  atualizado_em timestamptz not null default now()
);
comment on table public.demos is 'Catálogo das demos de eventos e fotografia (scripts/demos.mjs): o negócio, o contato, o endereço, as cores, os tipos, o que oferece e as avaliações sem nome. Só a Renderiza vê.';

create table public.contas_contexto (
  conta_id uuid primary key references public.contas (id) on delete cascade,
  demo text references public.demos (pasta) on delete set null,
  dados jsonb not null default '{}' check (jsonb_typeof(dados) = 'object'),
  conversa text check (length(conversa) <= 30000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.contas_contexto is 'De onde a conta veio (Missão 7, D41): a demo, o que ela sabia quando a conta nasceu (dados) e a conversa com o lead colada pela Renderiza. Fechado: a Renderiza e a IA (pelo servidor); o dono não vê.';
create trigger contas_contexto_atualizado before update on public.contas_contexto for each row execute function public.marcar_atualizado();

alter table public.demos enable row level security;
alter table public.contas_contexto enable row level security;
create policy "demos: a Renderiza vê" on public.demos for select to authenticated using (public.eh_equipe_renderiza());
create policy "contas_contexto: a Renderiza" on public.contas_contexto for all to authenticated
  using (public.eh_equipe_renderiza()) with check (public.eh_equipe_renderiza());
revoke all on public.demos, public.contas_contexto from anon;
grant select on public.demos to authenticated;
grant select, insert, update, delete on public.contas_contexto to authenticated;
