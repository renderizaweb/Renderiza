-- Missão 2 · bloco A · 1 de 4: as contas e quem entra nelas.
-- O modelo está em docs/painel-clientes/05-dados-e-permissoes.md. Toda tabela tem RLS; quem decide o que cada
-- pessoa vê é public.pode(conta, módulo, nível). Funções security definer sempre com search_path vazio (04).
-- Os papéis da API (anon, authenticated) não têm acesso direto a nada além do que as políticas deixam; anon não
-- lê nenhuma tabela (o público só passa por funções pequenas, nas Missões 3 e 4).

-- ---------- ajudantes gerais ----------

create function public.marcar_atualizado() returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

-- Só os números, com DDD (05, regra 2). Tira o 55 do Brasil quando vem junto.
create function public.normalizar_whatsapp(numero text) returns text language sql immutable set search_path = '' as $$
  select case
    when d = '' then null
    when length(d) in (12, 13) and left(d, 2) = '55' then substr(d, 3)
    else d
  end
  from (select regexp_replace(coalesce(numero, ''), '\D', '', 'g') as d) as x
$$;

-- E-mail sempre minúsculo e sem espaço nas pontas; vazio vira null.
create function public.normalizar_email(email text) returns text language sql immutable set search_path = '' as $$
  select nullif(lower(btrim(coalesce(email, ''))), '')
$$;

-- Acessos de uma pessoa por módulo: { "agenda": "editar", "financeiro": "ver", "contratos": null }.
create function public.acessos_validos(acessos jsonb) returns boolean language sql immutable set search_path = '' as $$
  select jsonb_typeof(acessos) = 'object'
    and not exists (
      select 1 from jsonb_each(acessos) as e
      where e.value not in ('"ver"'::jsonb, '"editar"'::jsonb, 'null'::jsonb)
    )
$$;

-- Os módulos da base vêm em toda conta e não contam no plano (02, "As partes do painel"; src/modulos/index.js).
create function public.modulo_base(modulo text) returns boolean language sql immutable set search_path = '' as $$
  select modulo in ('inicio', 'servicos', 'equipe', 'configuracoes')
$$;

-- Verdadeiro quando quem executa é o app (a API do Supabase), e não uma migração, a semente ou uma função nossa.
create function public.pelo_app() returns boolean language sql stable set search_path = '' as $$
  select current_user in ('anon', 'authenticated')
$$;

-- ---------- o catálogo de módulos (o mesmo para todas as contas) ----------

create table public.modulos (
  id text primary key check (id ~ '^[a-z][a-z-]*[a-z]$'),
  nome text not null check (length(btrim(nome)) between 1 and 60),
  preco numeric(10, 2) not null check (preco >= 0),
  liberado_no_teste boolean not null default true,
  ordem smallint not null default 0
);
comment on table public.modulos is 'O catálogo de módulos que o cliente escolhe e paga (02). Os da base (Início, Serviços, Equipe, Configurações) não entram aqui. liberado_no_teste = false é o "só pago".';

-- Os 7 da página de venda (exemplos/index.html, MODULOS), no mesmo preço (PRECO.extra). Os nomes por nicho
-- ("Agenda da equipe", "Clientes e entregas") ficam em src/nichos/.
insert into public.modulos (id, nome, preco, ordem) values
  ('agenda-online', 'Agenda online', 14.99, 1),
  ('agenda', 'Agenda', 14.99, 2),
  ('clientes', 'Clientes', 14.99, 3),
  ('contratos', 'Contratos', 14.99, 4),
  ('financeiro', 'Financeiro', 14.99, 5),
  ('atendimento', 'Atendimento', 14.99, 6),
  ('meu-site', 'Meu site', 14.99, 7);

-- ---------- contas ----------

create table public.contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(btrim(nome)) between 1 and 120),
  nicho text not null check (nicho in ('eventos', 'fotografia')),
  codigo text not null unique check (codigo ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  logo text check (length(logo) <= 300),
  cores jsonb not null default '{}' check (jsonb_typeof(cores) = 'object'),
  whatsapp text check (whatsapp ~ '^\d{10,15}$'),
  fuso text not null default 'America/Sao_Paulo' check (fuso ~ '^[A-Za-z_]+(/[A-Za-z_+-]+)*$'),
  situacao text not null default 'teste' check (situacao in ('teste', 'ativa', 'desligada', 'cancelada')),
  teste_ate timestamptz not null default now() + interval '7 days',
  ativa_ate date,
  origem text not null default 'cadastro' check (origem in ('cadastro', 'renderiza')),
  limite_pessoas smallint not null default 5 check (limite_pessoas between 1 and 100),
  ajustes jsonb not null default '{}' check (jsonb_typeof(ajustes) = 'object'),
  cancelada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
comment on table public.contas is 'O negócio cliente (o espaço, o estúdio). Tudo no banco pertence a uma conta. teste_ate: 7 dias da criação, um prazo só (02). ajustes: preferências da conta que o painel guarda (ordem do menu, primeiros passos escondidos).';
comment on column public.contas.codigo is 'Código público (curto, pode ser trocado pela Renderiza). Nunca o id interno nos endereços públicos (04).';
comment on column public.contas.limite_pessoas is 'Pessoas ativas que a conta pode ter: 5 no plano (02).';

-- ---------- quem entra ----------

create table public.pessoas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  usuario_id uuid references auth.users (id) on delete set null,
  nome text not null check (length(btrim(nome)) between 1 and 120),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  papel text check (length(papel) <= 60),
  cor text check (cor ~ '^#[0-9a-fA-F]{6}$'),
  dono boolean not null default false,
  acessos jsonb not null default '{}' check (public.acessos_validos(acessos)),
  ativa boolean not null default true,
  visto_em timestamptz,
  preferencias jsonb not null default '{}' check (jsonb_typeof(preferencias) = 'object'),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id),
  unique (conta_id, usuario_id)
);
comment on table public.pessoas is 'Quem entra numa conta. O dono tem tudo; os outros têm acessos por módulo ("ver" = só vê, "editar" = edita, ausente ou null = sem acesso). Tirar o acesso de alguém é ativa = false.';
create index on public.pessoas (usuario_id);

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nome text check (length(btrim(nome)) between 1 and 120),
  papel text check (length(papel) <= 60),
  cor text check (cor ~ '^#[0-9a-fA-F]{6}$'),
  dono boolean not null default false,
  acessos jsonb not null default '{}' check (public.acessos_validos(acessos)),
  convidado_por uuid,
  expira_em timestamptz not null default now() + interval '7 days',
  aceito_em timestamptz,
  pessoa_id uuid,
  cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  foreign key (conta_id, convidado_por) references public.pessoas (conta_id, id) on delete set null (convidado_por),
  foreign key (conta_id, pessoa_id) references public.pessoas (conta_id, id) on delete set null (pessoa_id)
);
comment on table public.convites is 'Convite pendente para entrar na conta. Vira pessoa quando o convidado entra e chama aceitar_convites(). O e-mail do convite sai de uma função do servidor (Missão 2, bloco B).';
create unique index convites_um_pendente on public.convites (conta_id, email) where aceito_em is null and cancelado_em is null;

create table public.contas_modulos (
  conta_id uuid not null references public.contas (id) on delete cascade,
  modulo_id text not null references public.modulos (id),
  ligado boolean not null default true,
  desde timestamptz not null default now(),
  ligado_por uuid references auth.users (id) on delete set null,
  atualizado_em timestamptz not null default now(),
  primary key (conta_id, modulo_id)
);
comment on table public.contas_modulos is 'O que está ligado em cada conta. Quem liga e desliga é a Renderiza (Admin); no cadastro, os módulos que a pessoa escolheu. Desligado ninguém vê, nem o dono; os dados ficam.';

create table public.equipe_renderiza (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 120),
  criado_em timestamptz not null default now()
);
comment on table public.equipe_renderiza is 'Quem entra no Admin. Cadastrada pela Renderiza direto no banco (sem tela). Vê contas, pessoas, pagamentos e números, mas não os dados dos clientes finais (só com acessos_suporte).';

create table public.acessos_suporte (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references auth.users (id),
  motivo text not null check (length(btrim(motivo)) between 3 and 300),
  nivel text not null default 'ver' check (nivel in ('ver', 'editar')),
  inicio timestamptz not null default now(),
  fim timestamptz not null default now() + interval '2 hours',
  check (fim > inicio)
);
comment on table public.acessos_suporte is 'Cada vez que a Renderiza entrou numa conta para ajudar: quem, quando, por quê (06). Enquanto vale (inicio..fim), pode() deixa ver (ou editar) a conta toda. O dono vê os registros da conta dele.';
create index on public.acessos_suporte (usuario_id, conta_id, fim);

create table public.termos_aceites (
  id bigint generated always as identity primary key,
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  versao text not null check (versao ~ '^[0-9A-Za-z._-]{1,20}$'),
  aceito_em timestamptz not null default now(),
  aparelho text check (length(aparelho) <= 300),
  unique (usuario_id, versao)
);
comment on table public.termos_aceites is 'Aceite dos termos de uso, por login (vale para todas as contas da pessoa). Mudou a versão, aceita de novo (06).';

-- ---------- quem pode o quê ----------

create function public.eh_equipe_renderiza() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.equipe_renderiza where usuario_id = (select auth.uid()))
$$;

-- É da conta (pessoa ativa), esteja a conta liberada ou não: serve para mostrar o aviso de teste vencido.
create function public.eh_membro(conta uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pessoas
    where conta_id = conta and usuario_id = (select auth.uid()) and ativa
  )
$$;

-- Ativa (e dentro do prazo, se tiver) ou em teste dentro dos 7 dias. Fora disso, o banco não entrega dado (05).
create function public.conta_liberada(conta uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.contas c
    where c.id = conta and (
      (c.situacao = 'ativa' and (c.ativa_ate is null or c.ativa_ate >= (now() at time zone c.fuso)::date))
      or (c.situacao = 'teste' and c.teste_ate > now())
    )
  )
$$;

-- A Renderiza está dentro da conta para ajudar, com registro em acessos_suporte.
create function public.em_suporte(conta uuid, nivel text default 'ver') returns boolean language sql stable security definer set search_path = '' as $$
  select public.eh_equipe_renderiza() and exists (
    select 1 from public.acessos_suporte s
    where s.conta_id = em_suporte.conta and s.usuario_id = (select auth.uid())
      and now() >= s.inicio and now() < s.fim
      and (em_suporte.nivel = 'ver' or s.nivel = 'editar')
  )
$$;

-- pode(conta, módulo, nível): a pessoa logada é da conta, a conta está liberada, o módulo está ligado (no teste,
-- também liberado no teste) e o acesso dela basta. Módulos da base: Início e Serviços todos veem; Equipe e
-- Configurações só o dono; editar Serviços pede acesso "editar" a eles (ou ser dono).
create function public.pode(conta uuid, modulo text, nivel text default 'ver') returns boolean language sql stable security definer set search_path = '' as $$
  select pode.nivel in ('ver', 'editar') and (
    public.em_suporte(pode.conta, pode.nivel)
    or exists (
      select 1
      from public.pessoas p
      join public.contas c on c.id = p.conta_id
      where p.conta_id = pode.conta and p.usuario_id = (select auth.uid()) and p.ativa
        and (
          (c.situacao = 'ativa' and (c.ativa_ate is null or c.ativa_ate >= (now() at time zone c.fuso)::date))
          or (c.situacao = 'teste' and c.teste_ate > now())
        )
        and (
          public.modulo_base(pode.modulo)
          or exists (
            select 1 from public.contas_modulos cm
            join public.modulos m on m.id = cm.modulo_id
            where cm.conta_id = pode.conta and cm.modulo_id = pode.modulo and cm.ligado
              and (c.situacao <> 'teste' or m.liberado_no_teste)
          )
        )
        and (
          p.dono
          or (pode.modulo in ('inicio', 'servicos') and pode.nivel = 'ver')
          or (
            pode.modulo not in ('equipe', 'configuracoes')
            and (p.acessos ->> pode.modulo = 'editar' or (pode.nivel = 'ver' and p.acessos ->> pode.modulo = 'ver'))
          )
        )
    )
  )
$$;
comment on function public.pode(uuid, text, text) is 'A regra de acesso do painel (05). Usada em todas as políticas de RLS.';

create function public.pode_algum(conta uuid, modulos text[], nivel text default 'ver') returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from unnest(pode_algum.modulos) as m where public.pode(pode_algum.conta, m, pode_algum.nivel))
$$;

-- Edita algum dos módulos que criam cliente (o "Para quem?" com "+ novo cliente" está em todos; 05).
create function public.edita_algum(conta uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select public.pode_algum(conta, array['agenda', 'atendimento', 'clientes', 'contratos', 'financeiro'], 'editar')
$$;

-- A pessoa logada nesta conta (para registrar quem fez).
create function public.minha_pessoa(conta uuid) returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.pessoas where conta_id = conta and usuario_id = (select auth.uid())
$$;

-- Para as travas da equipe (sem depender do que a RLS deixa ver).
create function public.pessoas_ativas(conta uuid, fora uuid default null) returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.pessoas where conta_id = conta and ativa and id is distinct from fora
$$;
create function public.donos_ativos(conta uuid, fora uuid default null) returns integer language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.pessoas where conta_id = conta and ativa and dono and id is distinct from fora
$$;

-- ---------- travas (gatilhos) ----------

create function public.contas_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  new.whatsapp := public.normalizar_whatsapp(new.whatsapp);
  if tg_op = 'UPDATE' and public.pelo_app() and not public.eh_equipe_renderiza() then
    -- O dono muda nome, logo, cores, WhatsApp, fuso e ajustes. Situação, prazos, código e plano são da Renderiza.
    if (new.id, new.codigo, new.situacao, new.teste_ate, new.ativa_ate, new.origem, new.limite_pessoas, new.cancelada_em, new.criado_em, new.nicho)
       is distinct from
       (old.id, old.codigo, old.situacao, old.teste_ate, old.ativa_ate, old.origem, old.limite_pessoas, old.cancelada_em, old.criado_em, old.nicho) then
      raise exception 'Só a Renderiza muda a situação, os prazos, o nicho, o código e o plano da conta.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger contas_antes before insert or update on public.contas for each row execute function public.contas_antes();
create trigger contas_atualizado before update on public.contas for each row execute function public.marcar_atualizado();

create function public.pessoas_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    -- Sem a conta (apagada junto), não há o que proteger.
    if old.dono and old.ativa and exists (select 1 from public.contas where id = old.conta_id)
       and public.donos_ativos(old.conta_id, old.id) = 0 then
      raise exception 'A conta precisa de pelo menos um dono.' using errcode = 'P0001';
    end if;
    return old;
  end if;

  new.email := public.normalizar_email(new.email);
  if tg_op = 'UPDATE' then
    -- (o login some sozinho, com null, quando o usuário é apagado no Auth)
    if new.conta_id <> old.conta_id
       or (old.usuario_id is not null and new.usuario_id is not null and new.usuario_id <> old.usuario_id) then
      raise exception 'Não dá para mudar a conta ou o login de uma pessoa.' using errcode = '42501';
    end if;
    if public.pelo_app() and not public.eh_equipe_renderiza() and not public.pode(old.conta_id, 'equipe', 'editar')
       and (new.dono, new.acessos, new.ativa, new.papel, new.usuario_id) is distinct from (old.dono, old.acessos, old.ativa, old.papel, old.usuario_id) then
      raise exception 'Só o dono muda os acessos da equipe.' using errcode = '42501';
    end if;
    if old.dono and old.ativa and not (new.dono and new.ativa) and public.donos_ativos(old.conta_id, old.id) = 0 then
      raise exception 'A conta precisa de pelo menos um dono.' using errcode = 'P0001';
    end if;
  end if;

  if new.ativa and (tg_op = 'INSERT' or not old.ativa)
     and public.pessoas_ativas(new.conta_id, new.id) >= (select limite_pessoas from public.contas where id = new.conta_id) then
    raise exception 'A conta já tem o máximo de pessoas do plano.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger pessoas_antes before insert or update or delete on public.pessoas for each row execute function public.pessoas_antes();
create trigger pessoas_atualizado before update on public.pessoas for each row execute function public.marcar_atualizado();

create function public.convites_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  new.email := public.normalizar_email(new.email);
  if tg_op = 'INSERT' and public.pelo_app() then
    new.convidado_por := public.minha_pessoa(new.conta_id);
    new.aceito_em := null;
    new.pessoa_id := null;
  elsif tg_op = 'UPDATE' and public.pelo_app() and (new.aceito_em, new.pessoa_id) is distinct from (old.aceito_em, old.pessoa_id) then
    raise exception 'O convite é aceito por quem foi convidado, ao entrar.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger convites_antes before insert or update on public.convites for each row execute function public.convites_antes();

create function public.contas_modulos_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.ligado is distinct from old.ligado then
    new.desde := now();
    if public.pelo_app() then new.ligado_por := (select auth.uid()); end if;
  end if;
  return new;
end $$;
create trigger contas_modulos_antes before insert or update on public.contas_modulos for each row execute function public.contas_modulos_antes();
create trigger contas_modulos_atualizado before update on public.contas_modulos for each row execute function public.marcar_atualizado();

-- Entrar para ajudar: começa agora, dura no máximo 8 horas e só pode ser encurtado.
create function public.acessos_suporte_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if public.pelo_app() then
    if tg_op = 'INSERT' then
      new.inicio := now();
      new.usuario_id := (select auth.uid());
      if new.fim > now() + interval '8 hours' then
        raise exception 'O acesso de suporte dura no máximo 8 horas.' using errcode = 'P0001';
      end if;
    elsif (new.conta_id, new.usuario_id, new.motivo, new.nivel, new.inicio) is distinct from (old.conta_id, old.usuario_id, old.motivo, old.nivel, old.inicio)
          or new.fim > old.fim then
      raise exception 'O registro de suporte não muda: só dá para encerrar antes.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger acessos_suporte_antes before insert or update on public.acessos_suporte for each row execute function public.acessos_suporte_antes();

-- ---------- funções que o painel chama ----------

-- As contas de quem está logado, para escolher a conta e montar o menu (Missão 2, bloco B). Volta também as que
-- estão em teste vencido ou desligadas (liberada = false), para o painel mostrar o aviso.
create function public.minhas_contas() returns table (
  conta_id uuid, nome text, nicho text, codigo text, logo text, cores jsonb, situacao text, teste_ate timestamptz,
  ativa_ate date, liberada boolean, ajustes jsonb, pessoa_id uuid, dono boolean, acessos jsonb, modulos text[]
) language sql stable security definer set search_path = '' as $$
  select c.id, c.nome, c.nicho, c.codigo, c.logo, c.cores, c.situacao, c.teste_ate, c.ativa_ate,
    public.conta_liberada(c.id), c.ajustes, p.id, p.dono, p.acessos,
    array(
      select cm.modulo_id from public.contas_modulos cm
      join public.modulos m on m.id = cm.modulo_id
      where cm.conta_id = c.id and cm.ligado and (c.situacao <> 'teste' or m.liberado_no_teste)
      order by m.ordem
    )
  from public.pessoas p
  join public.contas c on c.id = p.conta_id
  where p.usuario_id = (select auth.uid()) and p.ativa
  order by c.nome
$$;
comment on function public.minhas_contas() is 'As contas da pessoa logada, com os acessos dela e os módulos ligados (modulos). liberada = false: teste vencido, conta desligada ou fora do prazo.';

-- Cadastro sozinho (02): cria a conta em teste de 7 dias, a pessoa como dona e os módulos escolhidos. O teste é
-- um só: quem já é dono de uma conta criada pelo cadastro não cria outra. Precisa do e-mail confirmado.
create function public.cadastrar_conta(nome text, nicho text, whatsapp text default null, modulos text[] default '{}', meu_nome text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := (select auth.uid());
  meu_email text;
  meus_dados jsonb;
  base text;
  codigo_novo text;
  nova uuid;
begin
  if eu is null then
    raise exception 'Entre antes de criar a conta.' using errcode = '42501';
  end if;
  select u.email, u.raw_user_meta_data into meu_email, meus_dados from auth.users u where u.id = eu and u.email_confirmed_at is not null;
  if meu_email is null then
    raise exception 'Confirme o seu e-mail antes de criar a conta.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.pessoas p join public.contas c on c.id = p.conta_id
    where p.usuario_id = eu and p.dono and c.origem = 'cadastro'
  ) then
    raise exception 'Você já tem uma conta criada pelo cadastro: o teste de 7 dias é um só.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from unnest(coalesce(cadastrar_conta.modulos, '{}')) as m
    where m not in (select id from public.modulos where liberado_no_teste)
  ) then
    raise exception 'Algum módulo escolhido não existe ou não entra no teste.' using errcode = '22023';
  end if;

  -- código público: o nome sem acento, com hífens, e um final aleatório (04: curto, pode ser trocado depois).
  base := regexp_replace(translate(lower(btrim(cadastrar_conta.nome)), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+', '-', 'g');
  base := left(btrim(base, '-'), 30);
  if length(base) < 2 then base := 'conta'; end if;
  loop
    codigo_novo := btrim(base, '-') || '-' || substr(md5(random()::text), 1, 4);
    exit when not exists (select 1 from public.contas where codigo = codigo_novo);
  end loop;

  insert into public.contas (nome, nicho, codigo, whatsapp, situacao, origem)
  values (btrim(cadastrar_conta.nome), cadastrar_conta.nicho, codigo_novo, cadastrar_conta.whatsapp, 'teste', 'cadastro')
  returning id into nova;

  insert into public.pessoas (conta_id, usuario_id, nome, email, dono)
  values (nova, eu, coalesce(nullif(btrim(meu_nome), ''), nullif(btrim(meus_dados ->> 'nome'), ''), split_part(meu_email, '@', 1)), meu_email, true);

  insert into public.contas_modulos (conta_id, modulo_id, ligado, ligado_por)
  select distinct nova, m, true, eu from unnest(coalesce(cadastrar_conta.modulos, '{}')) as m;

  return nova;
end $$;
comment on function public.cadastrar_conta(text, text, text, text[], text) is 'Cadastro sozinho com 7 dias grátis (02). Volta o id da conta nova.';

-- Quem foi convidado e entrou: vira pessoa de cada conta que convidou o e-mail dele (convite válido). Chamar
-- logo depois de entrar. Volta quantas contas novas a pessoa ganhou.
create function public.aceitar_convites() returns integer language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := (select auth.uid());
  meu_email text;
  c record;
  pid uuid;
  novas integer := 0;
begin
  if eu is null then
    raise exception 'Entre antes de aceitar o convite.' using errcode = '42501';
  end if;
  select public.normalizar_email(u.email) into meu_email from auth.users u where u.id = eu and u.email_confirmed_at is not null;
  if meu_email is null then
    return 0;
  end if;
  for c in
    select * from public.convites v
    where v.email = meu_email and v.aceito_em is null and v.cancelado_em is null and v.expira_em > now()
    order by v.criado_em
    for update
  loop
    select id into pid from public.pessoas where conta_id = c.conta_id and usuario_id = eu;
    if pid is null then
      insert into public.pessoas (conta_id, usuario_id, nome, email, papel, cor, dono, acessos)
      values (c.conta_id, eu, coalesce(c.nome, split_part(meu_email, '@', 1)), meu_email, c.papel, c.cor, c.dono, c.acessos)
      returning id into pid;
      novas := novas + 1;
    else
      -- já foi da conta (o acesso tinha sido tirado): volta com os acessos do convite novo
      update public.pessoas
      set ativa = true, acessos = c.acessos, dono = (dono or c.dono), papel = coalesce(c.papel, papel)
      where id = pid;
    end if;
    update public.convites set aceito_em = now(), pessoa_id = pid where id = c.id;
  end loop;
  return novas;
end $$;
comment on function public.aceitar_convites() is 'Transforma os convites válidos do e-mail logado em pessoas da conta. Volta quantas contas novas.';

-- ---------- RLS ----------

alter table public.modulos enable row level security;
alter table public.contas enable row level security;
alter table public.pessoas enable row level security;
alter table public.convites enable row level security;
alter table public.contas_modulos enable row level security;
alter table public.equipe_renderiza enable row level security;
alter table public.acessos_suporte enable row level security;
alter table public.termos_aceites enable row level security;

create policy "modulos: quem entra vê" on public.modulos for select to authenticated using (true);
create policy "modulos: a Renderiza muda" on public.modulos for update to authenticated
  using (public.eh_equipe_renderiza()) with check (public.eh_equipe_renderiza());

create policy "contas: quem é da conta vê" on public.contas for select to authenticated
  using (public.eh_membro(id) or public.eh_equipe_renderiza() or public.em_suporte(id));
create policy "contas: a Renderiza cria" on public.contas for insert to authenticated
  with check (public.eh_equipe_renderiza());
create policy "contas: o dono e a Renderiza mudam" on public.contas for update to authenticated
  using (public.pode(id, 'configuracoes', 'editar') or public.eh_equipe_renderiza())
  with check (public.pode(id, 'configuracoes', 'editar') or public.eh_equipe_renderiza());

create policy "pessoas: a própria, a equipe da conta e a Renderiza veem" on public.pessoas for select to authenticated
  using (usuario_id = (select auth.uid()) or public.pode(conta_id, 'inicio', 'ver') or public.eh_equipe_renderiza());
create policy "pessoas: a Renderiza cria" on public.pessoas for insert to authenticated
  with check (public.eh_equipe_renderiza());
create policy "pessoas: a própria, o dono e a Renderiza mudam" on public.pessoas for update to authenticated
  using (usuario_id = (select auth.uid()) or public.pode(conta_id, 'equipe', 'editar') or public.eh_equipe_renderiza())
  with check (usuario_id = (select auth.uid()) or public.pode(conta_id, 'equipe', 'editar') or public.eh_equipe_renderiza());
create policy "pessoas: a Renderiza apaga" on public.pessoas for delete to authenticated
  using (public.eh_equipe_renderiza());

create policy "convites: o dono e a Renderiza" on public.convites for all to authenticated
  using (public.pode(conta_id, 'equipe', 'editar') or public.eh_equipe_renderiza())
  with check (public.pode(conta_id, 'equipe', 'editar') or public.eh_equipe_renderiza());

create policy "contas_modulos: quem é da conta vê" on public.contas_modulos for select to authenticated
  using (public.eh_membro(conta_id) or public.eh_equipe_renderiza() or public.em_suporte(conta_id));
create policy "contas_modulos: a Renderiza liga e desliga" on public.contas_modulos for all to authenticated
  using (public.eh_equipe_renderiza()) with check (public.eh_equipe_renderiza());

create policy "equipe_renderiza: a própria equipe vê" on public.equipe_renderiza for select to authenticated
  using (usuario_id = (select auth.uid()) or public.eh_equipe_renderiza());

create policy "acessos_suporte: a Renderiza e o dono veem" on public.acessos_suporte for select to authenticated
  using (public.eh_equipe_renderiza() or public.pode(conta_id, 'equipe', 'ver'));
create policy "acessos_suporte: a Renderiza registra" on public.acessos_suporte for insert to authenticated
  with check (public.eh_equipe_renderiza() and usuario_id = (select auth.uid()));
create policy "acessos_suporte: a Renderiza encerra o dela" on public.acessos_suporte for update to authenticated
  using (public.eh_equipe_renderiza() and usuario_id = (select auth.uid()))
  with check (public.eh_equipe_renderiza() and usuario_id = (select auth.uid()));

create policy "termos_aceites: os próprios" on public.termos_aceites for select to authenticated
  using (usuario_id = (select auth.uid()) or public.eh_equipe_renderiza());
create policy "termos_aceites: aceitar" on public.termos_aceites for insert to authenticated
  with check (usuario_id = (select auth.uid()));

-- ---------- permissões dos papéis da API ----------
-- O Supabase dá tudo a anon e authenticated em cada tabela nova; aqui fica só o que a RLS precisa.

revoke all on public.modulos, public.contas, public.pessoas, public.convites, public.contas_modulos,
  public.equipe_renderiza, public.acessos_suporte, public.termos_aceites from anon, authenticated;
grant select, insert, update, delete on public.modulos, public.contas, public.pessoas, public.convites,
  public.contas_modulos, public.equipe_renderiza, public.acessos_suporte, public.termos_aceites to authenticated;

revoke execute on function public.cadastrar_conta(text, text, text, text[], text), public.aceitar_convites(),
  public.minhas_contas() from public, anon;
grant execute on function public.cadastrar_conta(text, text, text, text[], text), public.aceitar_convites(),
  public.minhas_contas() to authenticated;
