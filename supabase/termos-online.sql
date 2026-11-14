-- Termos online (14/11/2026): contrato aceito pela internet, por um lead (ex.: o contrato do vereador Mateuzinho
-- Silva em /contrato/vereador-mateuzinho-silva). Mesmo método do aceite de contrato do Painel Renderiza
-- (painel-clientes, publico_aceitar_contrato): a página manda a impressão digital (SHA-256) do texto que a pessoa
-- leu, e ela tem de ser a do termo guardado aqui; o IP e o aparelho vêm do próprio pedido (cabeçalhos), não de quem
-- chama. Rodar à parte, depois do schema.sql (que aponta para cá no fim).
--   termos_online   cada versão de um termo: o texto inteiro, a impressão, se aceita assinatura e se pede código
--   termos_codigos  os códigos de confirmação mandados por e-mail (só o hash; valem 15 minutos, 5 tentativas)
--   termos_aceites  cada assinatura: nome, CPF, e-mail (confirmado ou não), WhatsApp, endereço, plano, IP, aparelho
-- Ninguém de fora lê nada. A página chama situacao_termo_online e aceitar_termo_online (chave pública); o código é
-- criado e mandado pela função de borda termo-codigo (supabase/functions/termo-codigo), que é a única que chama
-- registrar_codigo_termo (chave de serviço). Só o dono do termo lê os registros.

create table if not exists public.termos_online (
  id            text primary key check (id ~ '^[a-z0-9-]{3,80}$'),   -- ex.: vereador-mateuzinho-silva-v1
  dono          uuid not null references auth.users (id) on delete cascade,
  lead_id       text references public.leads (id) on delete set null,
  titulo        text not null,
  texto         text not null,                                        -- o texto como a página calcula a impressão
  impressao     text not null check (impressao ~ '^[0-9a-f]{64}$'),   -- SHA-256 do texto
  aberto        boolean not null default true,                        -- false: não aceita mais assinatura
  exige_codigo  boolean not null default false,                       -- true: só assina com o código do e-mail
  criado_em     timestamptz not null default now()
);

create table if not exists public.termos_codigos (
  id           uuid primary key default gen_random_uuid(),
  termo_id     text not null references public.termos_online (id) on delete cascade,
  email        text not null,
  codigo_hash  text not null check (codigo_hash ~ '^[0-9a-f]{64}$'),  -- SHA-256 de "<termo>:<email>:<código>"
  expira_em    timestamptz not null,
  tentativas   int not null default 0,
  usado_em     timestamptz,
  ip           text not null default '',
  criado_em    timestamptz not null default now()
);
create index if not exists termos_codigos_email_idx on public.termos_codigos (termo_id, email, criado_em desc);
create index if not exists termos_codigos_ip_idx on public.termos_codigos (ip, criado_em desc);

create table if not exists public.termos_aceites (
  id                uuid primary key default gen_random_uuid(),
  termo_id          text not null references public.termos_online (id) on delete restrict,
  dono              uuid not null references auth.users (id) on delete cascade,
  nome              text not null,
  cpf               text not null,
  email             text not null,
  email_confirmado  boolean not null default false,                   -- assinou com o código mandado ao e-mail
  whatsapp          text not null,
  endereco          text not null,
  plano             text not null check (plano in ('essencial', 'gabinete', 'completo')),
  declaracoes       jsonb not null default '{}'::jsonb,
  impressao         text not null,
  ip                text not null default '',
  aparelho          text not null default '',
  criado_em         timestamptz not null default now()
);
create index if not exists termos_aceites_termo_idx on public.termos_aceites (termo_id, criado_em desc);
create index if not exists termos_aceites_ip_idx on public.termos_aceites (ip, criado_em desc);

alter table public.termos_online enable row level security;
alter table public.termos_codigos enable row level security;
alter table public.termos_aceites enable row level security;
revoke all on public.termos_online from anon, authenticated;
revoke all on public.termos_codigos from anon, authenticated;
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
revoke all on function public.cpf_valido(text) from public, anon, authenticated;

-- Para a página: o termo aceita assinatura? pede o código do e-mail?
create or replace function public.situacao_termo_online(p_termo text) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_build_object('aberto', t.aberto, 'exige_codigo', t.exige_codigo)
                   from public.termos_online t where t.id = p_termo), jsonb_build_object('aberto', false, 'exige_codigo', false))
$$;
revoke all on function public.situacao_termo_online(text) from public;
grant execute on function public.situacao_termo_online(text) to anon, authenticated;

-- Só a função de borda termo-codigo (chave de serviço): guarda o hash do código que ela vai mandar por e-mail.
-- Só vale o último código pedido. Um por minuto para o mesmo e-mail, até 3 por e-mail e 6 por IP a cada hora.
create or replace function public.registrar_codigo_termo(p_termo text, p_email text, p_hash text, p_ip text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  t public.termos_online;
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_ip text := left(btrim(coalesce(p_ip, '')), 45);
begin
  select * into t from public.termos_online where id = p_termo and aberto and exige_codigo;
  if t.id is null then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  if length(v_email) > 120 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then return jsonb_build_object('ok', false, 'erro', 'email'); end if;
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('ok', false, 'erro', 'dados'); end if;
  if exists (select 1 from public.termos_codigos c where c.termo_id = t.id and c.email = v_email and c.criado_em > now() - interval '1 minute') then
    return jsonb_build_object('ok', false, 'erro', 'espera');
  end if;
  if (select count(*) from public.termos_codigos c where c.email = v_email and c.criado_em > now() - interval '1 hour') >= 3
     or (v_ip <> '' and (select count(*) from public.termos_codigos c where c.ip = v_ip and c.criado_em > now() - interval '1 hour') >= 6) then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;
  update public.termos_codigos set expira_em = now() where termo_id = t.id and email = v_email and usado_em is null and expira_em > now();
  insert into public.termos_codigos (termo_id, email, codigo_hash, expira_em, ip) values (t.id, v_email, p_hash, now() + interval '15 minutes', v_ip);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.registrar_codigo_termo(text, text, text, text) from public, anon, authenticated;
grant execute on function public.registrar_codigo_termo(text, text, text, text) to service_role;

-- Chamada pela página do termo com a chave pública. Grava a assinatura e devolve o protocolo, a data e o IP.
-- Recusa: termo fechado ou inexistente ("fora"), texto diferente do guardado ("mudou"), dado inválido ("dados" +
-- "campo"), código errado ("codigo"), vencido ou não pedido ("codigo_vencido"), errado 5 vezes ("codigo_bloqueado"),
-- mais de 5 assinaturas por hora do mesmo IP ("limite"). Deixa um passo na Atividade do lead
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
  v_codigo text := regexp_replace(coalesce(p_dados ->> 'codigo', ''), '[^0-9]', '', 'g');
  v_decl jsonb := coalesce(p_dados -> 'declaracoes', '{}'::jsonb);
  c public.termos_codigos;
  v_confirmado boolean := false;
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
  if v_plano not in ('essencial', 'gabinete', 'completo') then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'plano'); end if;
  if coalesce((v_decl ->> 'li')::boolean, false) is not true or coalesce((v_decl ->> 'recursos')::boolean, false) is not true
     or coalesce((v_decl ->> 'privacidade')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'declaracoes');
  end if;
  if t.exige_codigo then
    if v_codigo !~ '^[0-9]{6}$' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'codigo'); end if;
    select * into c from public.termos_codigos k
     where k.termo_id = t.id and k.email = v_email and k.usado_em is null and k.expira_em > now()
     order by k.criado_em desc limit 1 for update;
    if c.id is null then return jsonb_build_object('ok', false, 'erro', 'codigo_vencido'); end if;
    if c.tentativas >= 5 then return jsonb_build_object('ok', false, 'erro', 'codigo_bloqueado'); end if;
    if c.codigo_hash <> encode(extensions.digest(t.id || ':' || v_email || ':' || v_codigo, 'sha256'), 'hex') then
      update public.termos_codigos set tentativas = tentativas + 1 where id = c.id;
      return jsonb_build_object('ok', false, 'erro', 'codigo');
    end if;
    update public.termos_codigos set usado_em = now() where id = c.id;
    v_confirmado := true;
  end if;
  insert into public.termos_aceites (termo_id, dono, nome, cpf, email, email_confirmado, whatsapp, endereco, plano, declaracoes, impressao, ip, aparelho)
  values (t.id, t.dono, v_nome, v_cpf, v_email, v_confirmado, v_zap, v_end, v_plano,
          jsonb_build_object('li', true, 'recursos', true, 'privacidade', true), p_impressao, v_ip, v_ua)
  returning id, criado_em into v_id, v_em;
  if t.lead_id is not null then
    select public.renderiza_pasta_da_demo(l.link_demo) into v_pasta from public.leads l where l.id = t.lead_id;
    insert into public.visitas (dono, lead_id, pagina, demo, evento, detalhe, ip)
    values (t.dono, t.lead_id, 'demo', coalesce(v_pasta, ''), 'clicou',
            jsonb_build_object('alvo', 'contrato-assinado', 'parte', 'Assinatura', 'plano', v_plano, 'email_confirmado', v_confirmado), v_ip);
  end if;
  return jsonb_build_object('ok', true, 'protocolo', upper(left(replace(v_id::text, '-', ''), 12)), 'em', v_em, 'ip', v_ip, 'email_confirmado', v_confirmado);
end $$;
revoke all on function public.aceitar_termo_online(text, text, jsonb) from public;
grant execute on function public.aceitar_termo_online(text, text, jsonb) to anon, authenticated;
