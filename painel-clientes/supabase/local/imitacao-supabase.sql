-- Imitação do Supabase para o banco LOCAL de testes (Postgres 16 do ambiente das sessões).
-- Roda só no local, antes das migrações. Nunca vai para o STG nem para a produção (lá isso já existe de verdade).
-- Imita o que as migrações e os testes de RLS precisam: os papéis (anon, authenticated, service_role), o
-- auth.users e o auth.uid(), as permissões padrão do schema public, o básico do Storage e a publicação do
-- tempo real. Diferença conhecida: o Supabase roda Postgres 17 e as migrações lá rodam como `postgres` sem ser
-- superusuário; aqui roda como superusuário.

-- Papéis (valem para o servidor inteiro; criados uma vez só)
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

create extension if not exists pgcrypto;

-- Auth
create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  aud text default 'authenticated',
  role text default 'authenticated',
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Como no Supabase: o PostgREST põe o JWT em request.jwt.claims e as funções leem dali.
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'role', '')
$$;
create or replace function auth.email() returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'email', '')
$$;

-- Permissões padrão do schema public, como no Supabase: os papéis da API recebem acesso a tudo que for criado,
-- e quem barra é a RLS. Por isso toda tabela nova precisa de RLS ligada.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Storage (o básico para políticas de bucket)
create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;
create table if not exists storage.buckets (
  id text primary key,
  name text not null unique,
  owner uuid,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now()
);
alter table storage.objects enable row level security;
alter table storage.buckets enable row level security;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;
create or replace function storage.filename(name text) returns text language sql immutable as $$
  select (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)]
$$;

-- Tempo real
do $$
begin
  if not exists (select from pg_publication where pubname = 'supabase_realtime') then create publication supabase_realtime; end if;
end $$;

-- Ajudantes dos testes (supabase/testes/). Só existem no local.
create schema if not exists testes;
grant usage on schema testes to anon, authenticated, service_role;

-- Cria uma pessoa no auth.users e devolve o id.
create or replace function testes.criar_usuario(email text) returns uuid language sql as $$
  insert into auth.users (email, email_confirmed_at) values (email, now()) returning id
$$;

-- Passa a agir como essa pessoa logada (ou como visitante sem login, com null), até o fim da transação.
-- Uso: select testes.entrar_como(:'ana');  ...  reset role;
create or replace function testes.entrar_como(usuario uuid) returns void language plpgsql as $$
begin
  if usuario is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
  else
    perform set_config('request.jwt.claims', json_build_object('sub', usuario, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
  end if;
end $$;

create or replace function testes.afirmar(condicao boolean, mensagem text) returns void language plpgsql as $$
begin
  if condicao is distinct from true then raise exception 'FALHOU: %', mensagem; end if;
end $$;

-- Confere que o comando dá erro (ex.: a RLS barrando uma gravação).
create or replace function testes.afirmar_erro(comando text, mensagem text) returns void language plpgsql as $$
begin
  begin
    execute comando;
  exception when others then
    return;
  end;
  raise exception 'FALHOU (era para dar erro): %', mensagem;
end $$;

grant execute on all functions in schema testes to anon, authenticated, service_role;
