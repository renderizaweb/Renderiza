-- Termos online (14/11/2026): contrato aceito pela internet, por um lead (ex.: o contrato do vereador Mateuzinho
-- Silva em /contrato/vereador-mateuzinho-silva). Mesmo método do aceite de contrato do Painel Renderiza
-- (painel-clientes, publico_aceitar_contrato): a página manda a impressão digital (SHA-256) do texto que a pessoa
-- leu, e ela tem de ser a do termo guardado aqui; o IP e o aparelho vêm do próprio pedido (cabeçalhos), não de quem
-- chama. Rodar à parte, depois do schema.sql (que aponta para cá no fim).
--   termos_online   cada versão de um termo: o texto inteiro, a impressão, se aceita assinatura e se pede código
--   termos_codigos  os códigos de confirmação mandados por e-mail (só o hash; valem 15 minutos, 5 tentativas)
--   termos_aceites  cada assinatura: nome, CPF, e-mail (confirmado ou não), WhatsApp, endereço, plano, IP, aparelho
-- Ninguém de fora lê nada. A página chama situacao_termo_online e aceitar_termo_online (chave pública); o código e o
-- comprovante por e-mail saem pela função de borda termo-codigo (supabase/functions/termo-codigo), a única que chama
-- registrar_codigo_termo e comprovante_termo (chave de serviço). Só o dono do termo lê os registros.
-- O registro de cada termo (a impressão e os dados completos da contratada) vai direto no banco, fora do
-- repositório: ver demos/vereador-mateuzinho-silva/proposta.md. (*) O texto inteiro chega com a primeira assinatura:
-- a página manda o texto que a pessoa leu, e o banco só o guarda se o SHA-256 dele for a impressão registrada.
--
-- Termos de lead (23/11/2026; docs/termos/README.md): o mesmo aceite para qualquer lead do painel de prospecção. O
-- termo nasce no card do lead (seção "Termo de aceite"), a partir do modelo base (painel/src/termos.js) com o que é
-- daquele cliente, e vai ao ar em /termo/<id> (termos/pagina.html), que lê o texto daqui (publico_termo). Muda:
--   - o texto mora no banco desde o começo: a impressão é calculada aqui (gatilho), do texto exato;
--   - o dono cria, edita e abre ou fecha os próprios termos pelo painel; depois da primeira assinatura, o texto, as
--     opções e o tipo de contratante não mudam mais (nova versão = termo novo, ex.: ricardo-motors-v2);
--   - "opcoes": o que a pessoa escolhe ao assinar (ex.: com ou sem o Painel Renderiza). Nulo = os planos do vereador;
--   - "tipo_contratante": pf, pj (CNPJ e razão social obrigatórios) ou pf_ou_pj (quem assina escolhe);
--   - texto com "[[" (pendência do modelo, ex.: [[valor]]) não abre para assinatura.
-- O termo do vereador continua igual (opcoes nulo, pf, o texto chegando com a primeira assinatura).

create table if not exists public.termos_online (
  id            text primary key check (id ~ '^[a-z0-9-]{3,80}$'),   -- ex.: vereador-mateuzinho-silva-v1
  dono          uuid not null references auth.users (id) on delete cascade,
  lead_id       text references public.leads (id) on delete set null,
  titulo        text not null,
  texto         text not null default '',                             -- o texto como a página calcula a impressão (*)
  impressao     text not null check (impressao ~ '^[0-9a-f]{64}$'),   -- SHA-256 do texto
  aberto        boolean not null default true,                        -- false: não aceita mais assinatura
  exige_codigo  boolean not null default false,                       -- true: só assina com o código do e-mail
  contratada    text not null default '',                             -- dados completos da contratada, para o comprovante
  pagina        text not null default '',                             -- endereço da página do termo
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
  plano             text not null check (plano in ('essencial', 'gabinete', 'completo', 'sem-plano')),
  declaracoes       jsonb not null default '{}'::jsonb,
  impressao         text not null,
  ip                text not null default '',
  aparelho          text not null default '',
  comprovante_em    timestamptz,                                      -- quando o comprovante saiu por e-mail
  criado_em         timestamptz not null default now()
);
create index if not exists termos_aceites_termo_idx on public.termos_aceites (termo_id, criado_em desc);
create index if not exists termos_aceites_ip_idx on public.termos_aceites (ip, criado_em desc);

-- Termos de lead (23/11/2026). Banco de antes: as colunas entram sem mexer no termo do vereador.
alter table public.termos_online alter column dono set default auth.uid();
alter table public.termos_online add column if not exists opcoes jsonb;                    -- nulo: os planos do vereador
alter table public.termos_online add column if not exists tipo_contratante text not null default 'pf';
alter table public.termos_online add column if not exists modelo text not null default '';  -- ex.: "site-v1" (painel/src/termos.js)
alter table public.termos_online add column if not exists campos jsonb not null default '{}'::jsonb; -- o que o painel preencheu
alter table public.termos_online add column if not exists atualizado_em timestamptz not null default now();
alter table public.termos_aceites add column if not exists cnpj text not null default '';
alter table public.termos_aceites add column if not exists empresa text not null default '';     -- razão social
alter table public.termos_aceites add column if not exists opcao_nome text not null default '';  -- o nome da opção, como estava
alter table public.termos_aceites drop constraint if exists termos_aceites_plano_check;          -- era só a lista do vereador
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'termos_online_tipo_contratante_check') then
    alter table public.termos_online add constraint termos_online_tipo_contratante_check check (tipo_contratante in ('pf', 'pj', 'pf_ou_pj'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'termos_online_opcoes_check') then
    alter table public.termos_online add constraint termos_online_opcoes_check check (opcoes is null or jsonb_typeof(opcoes) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'termos_aceites_plano_formato') then
    alter table public.termos_aceites add constraint termos_aceites_plano_formato check (plano ~ '^[a-z0-9-]{0,40}$');
  end if;
end $$;
create index if not exists termos_online_lead_idx on public.termos_online (lead_id, criado_em desc);

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

-- O painel de prospecção cria e edita os termos do dono (seção "Termo de aceite" do lead). A impressão é do gatilho,
-- o dono é quem está logado e o lead tem de ser dele. Termo assinado não sai: as assinaturas seguram (on delete restrict).
grant insert (id, lead_id, titulo, texto, aberto, exige_codigo, pagina, opcoes, tipo_contratante, modelo, campos) on public.termos_online to authenticated;
grant update (titulo, texto, aberto, exige_codigo, opcoes, tipo_contratante, modelo, campos) on public.termos_online to authenticated;
grant delete on public.termos_online to authenticated;
drop policy if exists "termos do dono: criar" on public.termos_online;
create policy "termos do dono: criar" on public.termos_online for insert to authenticated
  with check (dono = (select auth.uid()) and (lead_id is null or exists (select 1 from public.leads l where l.id = lead_id and l.dono = (select auth.uid()))));
drop policy if exists "termos do dono: mudar" on public.termos_online;
create policy "termos do dono: mudar" on public.termos_online for update to authenticated
  using (dono = (select auth.uid())) with check (dono = (select auth.uid()));
drop policy if exists "termos do dono: apagar" on public.termos_online;
create policy "termos do dono: apagar" on public.termos_online for delete to authenticated using (dono = (select auth.uid()));

-- Antes de gravar um termo: a impressão sai do texto exato (SHA-256, em hexadecimal); termo assinado não muda o texto,
-- as opções nem o tipo de contratante; texto com pendência ("[[") não abre; termo novo sem a contratada copia a do
-- último termo do mesmo dono (os dados completos da Renderiza ficam fora do repositório e do painel) e, sem página,
-- ganha o endereço /termo/<id>. O termo do vereador (texto vazio até a primeira assinatura) segue com a impressão dele.
-- Roda com o papel de quem gravou (sem security definer): o painel só alcança os termos e as assinaturas do próprio dono.
create or replace function public.termos_online_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    -- Termo feito à mão com o texto chegando na primeira assinatura (o do vereador): pelo painel, o texto não muda; só
    -- aceitar_termo_online (dona do banco) o preenche. O gatilho roda com o papel de quem chamou, para saber isso.
    if old.texto = '' and new.texto is distinct from old.texto and current_user in ('authenticated', 'anon') then
      raise exception 'Este termo tem página própria: o texto dele não muda pelo painel.' using errcode = 'P0001';
    end if;
    if new.id is distinct from old.id or new.dono is distinct from old.dono or new.lead_id is distinct from old.lead_id then
      raise exception 'O id, o dono e o lead de um termo não mudam. Faça um termo novo.' using errcode = 'P0001';
    end if;
    if (new.texto, new.opcoes, new.tipo_contratante) is distinct from (old.texto, old.opcoes, old.tipo_contratante)
       and old.texto <> '' and exists (select 1 from public.termos_aceites a where a.termo_id = old.id) then
      raise exception 'Este termo já foi assinado: o texto não muda mais. Faça uma nova versão.' using errcode = 'P0001';
    end if;
    if old.texto <> '' and new.texto = '' then raise exception 'O texto do termo não pode ficar vazio.' using errcode = 'P0001'; end if;
  else
    if new.contratada = '' then
      select t.contratada into new.contratada from public.termos_online t
       where t.dono = new.dono and t.contratada <> '' order by t.criado_em desc limit 1;
      new.contratada := coalesce(new.contratada, '');
    end if;
    if new.pagina = '' then new.pagina := 'https://www.renderizaweb.com.br/termo/' || new.id; end if;
  end if;
  if new.texto <> '' and (tg_op = 'INSERT' or new.texto is distinct from old.texto) then
    new.impressao := encode(extensions.digest(new.texto, 'sha256'), 'hex');
  end if;
  if new.aberto and position('[[' in new.texto) > 0 then
    raise exception 'O termo ainda tem pendências (o que está entre [[ ]]). Preencha antes de abrir para assinatura.' using errcode = 'P0001';
  end if;
  if new.opcoes is not null and exists (select 1 from jsonb_array_elements(new.opcoes) o
       where jsonb_typeof(o) <> 'object' or coalesce(o ->> 'id', '') !~ '^[a-z0-9-]{1,40}$' or length(btrim(coalesce(o ->> 'nome', ''))) not between 1 and 120) then
    raise exception 'Cada opção do termo precisa de um id (letras, números e hífen) e de um nome.' using errcode = 'P0001';
  end if;
  new.atualizado_em := now();
  return new;
end $$;
revoke all on function public.termos_online_antes() from public, anon, authenticated;
drop trigger if exists termos_online_antes on public.termos_online;
create trigger termos_online_antes before insert or update on public.termos_online for each row execute function public.termos_online_antes();

-- O painel vê na hora quando alguém assina (tempo real; as políticas acima valem também aqui).
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['termos_online', 'termos_aceites'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

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

-- CNPJ com os dois dígitos verificadores certos (e não 00.000.000/0000-00 e afins).
create or replace function public.cnpj_valido(p text) returns boolean language plpgsql immutable set search_path = '' as $$
declare d int[]; p1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2]; p2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2]; s int; r int; i int;
begin
  if p is null or p !~ '^[0-9]{14}$' or p ~ '^([0-9])\1{13}$' then return false; end if;
  for i in 1..14 loop d[i] := substr(p, i, 1)::int; end loop;
  s := 0; for i in 1..12 loop s := s + d[i] * p1[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  if r <> d[13] then return false; end if;
  s := 0; for i in 1..13 loop s := s + d[i] * p2[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  return r = d[14];
end $$;
revoke all on function public.cnpj_valido(text) from public, anon, authenticated;

-- Para a página /termo/<id> (termos/pagina.html, chave pública): o texto para ler e assinar, a impressão, se está aberto,
-- se pede o código, as opções, o tipo de contratante e a pasta da demo do lead (o contador de visitas). Nada do dono
-- nem os dados completos da contratada. Termo sem texto no banco (o do vereador, que tem página própria): "fora".
create or replace function public.publico_termo(p_termo text) returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce((
    select jsonb_build_object('ok', true, 'id', t.id, 'titulo', t.titulo, 'texto', t.texto, 'impressao', t.impressao,
             'aberto', t.aberto, 'exige_codigo', t.exige_codigo, 'opcoes', coalesce(t.opcoes, '[]'::jsonb),
             'tipo_contratante', t.tipo_contratante, 'atualizado_em', t.atualizado_em,
             'demo', coalesce(public.renderiza_pasta_da_demo(l.link_demo), ''))
      from public.termos_online t left join public.leads l on l.id = t.lead_id
     where t.id = p_termo and t.texto <> ''), jsonb_build_object('ok', false, 'erro', 'fora'))
$$;
revoke all on function public.publico_termo(text) from public;
grant execute on function public.publico_termo(text) to anon, authenticated;

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
-- Termos de lead: "plano" é o id de uma das opções do termo (sem opções, fica vazio); com tipo pj, ou pf_ou_pj com
-- CNPJ preenchido, pede o CNPJ (com os dígitos certos) e a razão social ("empresa"). O CPF é sempre de quem assina.
create or replace function public.aceitar_termo_online(p_termo text, p_impressao text, p_dados jsonb, p_texto text default null)
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
  v_cnpj text := regexp_replace(coalesce(p_dados ->> 'cnpj', ''), '[^0-9]', '', 'g');
  v_empresa text := regexp_replace(btrim(coalesce(p_dados ->> 'empresa', '')), '\s+', ' ', 'g');
  v_opcao_nome text := '';
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
  if t.tipo_contratante = 'pf' then v_cnpj := ''; v_empresa := ''; end if;
  if t.tipo_contratante = 'pj' or v_cnpj <> '' then
    if not public.cnpj_valido(v_cnpj) then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'cnpj'); end if;
    if length(v_empresa) not between 2 and 160 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'empresa'); end if;
  else
    v_empresa := '';
  end if;
  if t.opcoes is null then
    if v_plano not in ('essencial', 'gabinete', 'completo', 'sem-plano') then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'plano'); end if;
  elsif jsonb_array_length(t.opcoes) = 0 then
    v_plano := '';
  else
    select btrim(o ->> 'nome') into v_opcao_nome from jsonb_array_elements(t.opcoes) o where o ->> 'id' = v_plano limit 1;
    if v_opcao_nome is null or v_plano = '' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'plano'); end if;
  end if;
  if coalesce((v_decl ->> 'li')::boolean, false) is not true or coalesce((v_decl ->> 'responsavel')::boolean, false) is not true
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
  if t.texto = '' and p_texto is not null and encode(extensions.digest(p_texto, 'sha256'), 'hex') = t.impressao then
    update public.termos_online set texto = p_texto where id = t.id;
  end if;
  insert into public.termos_aceites (termo_id, dono, nome, cpf, email, email_confirmado, whatsapp, endereco, plano, declaracoes, impressao, ip, aparelho, cnpj, empresa, opcao_nome)
  values (t.id, t.dono, v_nome, v_cpf, v_email, v_confirmado, v_zap, v_end, v_plano,
          jsonb_build_object('li', true, 'responsavel', true, 'privacidade', true), p_impressao, v_ip, v_ua, v_cnpj, v_empresa, coalesce(v_opcao_nome, ''))
  returning id, criado_em into v_id, v_em;
  if t.lead_id is not null then
    select public.renderiza_pasta_da_demo(l.link_demo) into v_pasta from public.leads l where l.id = t.lead_id;
    insert into public.visitas (dono, lead_id, pagina, demo, evento, detalhe, ip)
    values (t.dono, t.lead_id, 'demo', coalesce(v_pasta, ''), 'clicou',
            jsonb_build_object('alvo', 'contrato-assinado', 'parte', 'Assinatura', 'plano', v_plano, 'email_confirmado', v_confirmado, 'termo', t.id), v_ip);
  end if;
  return jsonb_build_object('ok', true, 'protocolo', upper(left(replace(v_id::text, '-', ''), 12)), 'em', v_em, 'ip', v_ip, 'email_confirmado', v_confirmado);
end $$;
revoke all on function public.aceitar_termo_online(text, text, jsonb, text) from public;
grant execute on function public.aceitar_termo_online(text, text, jsonb, text) to anon, authenticated;

-- Só a função de borda termo-codigo (chave de serviço), logo depois da assinatura: devolve os dados do comprovante de
-- uma assinatura feita há menos de 30 minutos, uma vez só (marca comprovante_em). O protocolo são os 12 primeiros
-- caracteres do id; o CPF volta mascarado. Termos de lead: também o nome da opção escolhida, o CNPJ e a razão social.
-- E o texto inteiro do termo (24/11/2026): o e-mail do comprovante leva o termo assinado, como registro.
create or replace function public.comprovante_termo(p_termo text, p_protocolo text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.termos_aceites; t public.termos_online;
begin
  if p_protocolo is null or p_protocolo !~ '^[0-9A-F]{12}$' then return jsonb_build_object('ok', false, 'erro', 'formato'); end if;
  select * into a from public.termos_aceites k
   where k.termo_id = p_termo and upper(left(replace(k.id::text, '-', ''), 12)) = p_protocolo
     and k.criado_em > now() - interval '30 minutes' and k.comprovante_em is null
   for update;
  if a.id is null then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  select * into t from public.termos_online where id = a.termo_id;
  update public.termos_aceites set comprovante_em = now() where id = a.id;
  return jsonb_build_object('ok', true, 'protocolo', p_protocolo, 'titulo', t.titulo, 'pagina', t.pagina, 'contratada', t.contratada,
    'nome', a.nome, 'email', a.email, 'email_confirmado', a.email_confirmado,
    'cpf', '***.' || substr(a.cpf, 4, 3) || '.' || substr(a.cpf, 7, 3) || '-**', 'plano', a.plano,
    'plano_nome', a.opcao_nome, 'cnpj', a.cnpj, 'empresa', a.empresa,
    'em', a.criado_em, 'ip', a.ip, 'impressao', a.impressao, 'texto', t.texto);
end $$;
revoke all on function public.comprovante_termo(text, text) from public, anon, authenticated;
grant execute on function public.comprovante_termo(text, text) to service_role;
