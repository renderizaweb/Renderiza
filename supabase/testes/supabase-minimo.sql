-- O mínimo do Supabase para rodar os testes dos termos num Postgres local (sem o Supabase): os papéis, o auth.uid()
-- lido do "request.jwt.claim.sub", o pgcrypto no esquema extensions e as tabelas do schema.sql que os termos usam
-- (leads, visitas e a função da pasta da demo, como em produção). Ver supabase/testes/README.md.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth, extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create table if not exists public.leads (
  id         text primary key,
  dono       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  empresa    text not null default '',
  link_demo  text not null default ''
);
create or replace function public.renderiza_pasta_da_demo(link text) returns text language sql immutable set search_path = '' as $$
  select lower(substring(coalesce(link, '') from '/demo/([A-Za-z0-9-]+)'))
$$;
create table if not exists public.visitas (
  id         bigint generated always as identity primary key,
  dono       uuid not null references auth.users (id) on delete cascade,
  lead_id    text not null references public.leads (id) on delete cascade,
  pagina     text not null,
  demo       text not null default '',
  evento     text not null,
  detalhe    jsonb not null default '{}'::jsonb,
  ip         text not null default '',
  criado_em  timestamptz not null default now()
);
grant select on public.leads to authenticated;
-- Como no Supabase: a chave de serviço pode tudo nas tabelas (as que vierem depois também).
alter default privileges in schema public grant all on tables to service_role;
grant all on all tables in schema public to service_role;
