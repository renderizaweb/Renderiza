-- Termos online (14/11/2026): contrato aceito pela internet, por um lead (ex.: o contrato do vereador Mateuzinho
-- Silva em /contrato/vereador-mateuzinho-silva). Mesmo método do aceite de contrato do Painel Renderiza
-- (painel-clientes, publico_aceitar_contrato): a página manda a impressão digital (SHA-256) do texto que a pessoa
-- leu, e ela tem de ser a do termo guardado aqui; o IP e o aparelho vêm do próprio pedido (cabeçalhos), não de quem
-- chama. Rodar à parte, depois do schema.sql (que aponta para cá no fim).
--   termos_online   cada versão de um termo: o texto inteiro, a impressão e se ainda aceita assinatura
--   termos_aceites  cada assinatura: nome, CPF, e-mail, WhatsApp, endereço, plano escolhido, declarações, IP, aparelho
-- Ninguém de fora lê nada: só a função aceitar_termo_online grava (chave pública), e só o dono do termo lê.

create table if not exists public.termos_online (
  id         text primary key check (id ~ '^[a-z0-9-]{3,80}$'),   -- ex.: vereador-mateuzinho-silva-v1
  dono       uuid not null references auth.users (id) on delete cascade,
  lead_id    text references public.leads (id) on delete set null,
  titulo     text not null,
  texto      text not null,                                        -- o texto como a página calcula a impressão
  impressao  text not null check (impressao ~ '^[0-9a-f]{64}$'),   -- SHA-256 do texto
  aberto     boolean not null default true,                        -- false: não aceita mais assinatura
  criado_em  timestamptz not null default now()
);

create table if not exists public.termos_aceites (
  id           uuid primary key default gen_random_uuid(),
  termo_id     text not null references public.termos_online (id) on delete restrict,
  dono         uuid not null references auth.users (id) on delete cascade,
  nome         text not null,
  cpf          text not null,
  email        text not null,
  whatsapp     text not null,
  endereco     text not null,
  plano        text not null check (plano in ('essencial', 'gabinete', 'mandato')),
  declaracoes  jsonb not null default '{}'::jsonb,
  impressao    text not null,
  ip           text not null default '',
  aparelho     text not null default '',
  criado_em    timestamptz not null default now()
);
create index if not exists termos_aceites_termo_idx on public.termos_aceites (termo_id, criado_em desc);
create index if not exists termos_aceites_ip_idx on public.termos_aceites (ip, criado_em desc);

alter table public.termos_online enable row level security;
alter table public.termos_aceites enable row level security;
revoke all on public.termos_online from anon, authenticated;
revoke all on public.termos_aceites from anon, authenticated;
grant select on public.termos_online to authenticated;
grant select on public.termos_aceites to authenticated;
drop policy if exists "termos do dono" on public.termos_online;
create policy "termos do dono" on public.termos_online for select to authenticated using (dono = (select auth.uid()));
drop policy if exists "aceites do dono" on public.termos_aceites;
create policy "aceites do dono" on public.termos_aceites for select to authenticated using (dono = (select auth.uid()));

-- CPF com os dois dígitos verificadores certos (e não 111.111.111-11 e afins).
create or replace function public.cpf_valido(p text) returns boolean language plpgsql immutable set search_path = '' as $$
declare d int[]; s int; r int; i int;
begin
  if p is null or p !~ '^[0-9]{11}$' or p ~ '^([0-9])\1{10}$' then return false; end if;
  for i in 1..11 loop d[i] := substr(p, i, 1)::int; end loop;
  s := 0; for i in 1..9 loop s := s + d[i] * (11 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  if r <> d[10] then return false; end if;
  s := 0; for i in 1..10 loop s := s + d[i] * (12 - i); end loop;
  r := (s * 10) % 11; if r = 10 then r := 0; end if;
  return r = d[11];
end $$;

-- Chamada pela página do termo com a chave pública. Grava a assinatura e devolve o protocolo, a data e o IP.
-- Recusa: termo fechado ou inexistente ("fora"), texto diferente do guardado ("mudou"), dado inválido ("dados" +
-- "campo"), mais de 5 assinaturas por hora do mesmo IP ("limite"). Também deixa um passo na Atividade do lead
-- (clicou · contrato-assinado), para o dono ver no painel.
create or replace function public.aceitar_termo_online(p_termo text, p_impressao text, p_dados jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  t public.termos_online;
  v_cab json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := btrim(coalesce(nullif(v_cab ->> 'cf-connecting-ip', ''), split_part(coalesce(v_cab ->> 'x-forwarded-for', ''), ',', 1)));
  v_ua text := left(coalesce(v_cab ->> 'user-agent', ''), 400);
  v_nome text := regexp_replace(btrim(coalesce(p_dados ->> 'nome', '')), '\s+', ' ', 'g');
  v_cpf text := regexp_replace(coalesce(p_dados ->> 'cpf', ''), '[^0-9]', '', 'g');
  v_email text := lower(btrim(coalesce(p_dados ->> 'email', '')));
  v_zap text := regexp_replace(coalesce(p_dados ->> 'whatsapp', ''), '[^0-9]', '', 'g');
  v_end text := regexp_replace(btrim(coalesce(p_dados ->> 'endereco', '')), '\s+', ' ', 'g');
  v_plano text := lower(btrim(coalesce(p_dados ->> 'plano', '')));
  v_decl jsonb := coalesce(p_dados -> 'declaracoes', '{}'::jsonb);
  v_pasta text;
  v_id uuid;
  v_em timestamptz;
begin
  if p_termo is null or p_termo !~ '^[a-z0-9-]{3,80}$' then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  select * into t from public.termos_online where id = p_termo and aberto;
  if t.id is null then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  if p_impressao is distinct from t.impressao then return jsonb_build_object('ok', false, 'erro', 'mudou'); end if;
  if v_ip !~ '^[0-9a-fA-F.:]{3,45}$' then v_ip := ''; end if;
  if v_ip <> '' and (select count(*) from public.termos_aceites a where a.ip = v_ip and a.criado_em > now() - interval '1 hour') >= 5 then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;
  if length(v_nome) not between 5 and 120 or v_nome !~ '[[:alpha:]]+ [[:alpha:]]' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'nome'); end if;
  if not public.cpf_valido(v_cpf) then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'cpf'); end if;
  if length(v_email) > 120 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'email'); end if;
  if length(v_zap) not between 10 and 13 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'whatsapp'); end if;
  if length(v_end) not between 10 and 300 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'endereco'); end if;
  if v_plano not in ('essencial', 'gabinete', 'mandato') then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'plano'); end if;
  if coalesce((v_decl ->> 'li')::boolean, false) is not true or coalesce((v_decl ->> 'recursos')::boolean, false) is not true
     or coalesce((v_decl ->> 'privacidade')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'declaracoes');
  end if;
  insert into public.termos_aceites (termo_id, dono, nome, cpf, email, whatsapp, endereco, plano, declaracoes, impressao, ip, aparelho)
  values (t.id, t.dono, v_nome, v_cpf, v_email, v_zap, v_end, v_plano,
          jsonb_build_object('li', true, 'recursos', true, 'privacidade', true), p_impressao, v_ip, v_ua)
  returning id, criado_em into v_id, v_em;
  if t.lead_id is not null then
    select public.renderiza_pasta_da_demo(l.link_demo) into v_pasta from public.leads l where l.id = t.lead_id;
    insert into public.visitas (dono, lead_id, pagina, demo, evento, detalhe, ip)
    values (t.dono, t.lead_id, 'demo', coalesce(v_pasta, ''), 'clicou', jsonb_build_object('alvo', 'contrato-assinado', 'parte', 'Assinatura', 'plano', v_plano), v_ip);
  end if;
  return jsonb_build_object('ok', true, 'protocolo', upper(left(replace(v_id::text, '-', ''), 12)), 'em', v_em, 'ip', v_ip);
end $$;
revoke all on function public.aceitar_termo_online(text, text, jsonb) from public;
grant execute on function public.aceitar_termo_online(text, text, jsonb) to anon, authenticated;
revoke all on function public.cpf_valido(text) from public, anon, authenticated;
