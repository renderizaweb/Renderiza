-- Missão 2 · bloco A · 3 de 4: o histórico ("o que a equipe fez"), o Meu site e o Admin (05).
-- O histórico é gravado pelo próprio banco (gatilhos): nenhuma tela precisa lembrar de registrar, e ninguém
-- grava histórico falso. Ele guarda o que mudou (nomes das colunas e as mudanças de etapa e situação), nunca valores.

-- ---------- histórico ----------

create table public.atividades (
  id bigint generated always as identity primary key,
  conta_id uuid not null references public.contas (id) on delete cascade,
  pessoa_id uuid,
  pelo_suporte boolean not null default false,
  acao text not null check (acao in ('criou', 'mudou', 'apagou')),
  tabela text not null,
  registro_id uuid,
  cliente_id uuid,
  reserva_id uuid,
  modulo text not null,
  mudou text[] not null default '{}',
  detalhe jsonb not null default '{}',
  quando timestamptz not null default now(),
  foreign key (conta_id, pessoa_id) references public.pessoas (conta_id, id) on delete set null (pessoa_id)
);
comment on table public.atividades is 'O que a equipe fez (Início) e a linha do tempo do cliente. Gravada pelos gatilhos; cada pessoa vê só as do que ela pode ver (modulo). pessoa_id null = o sistema, a agenda online ou a semente; pelo_suporte = a Renderiza, ajudando. mudou: as colunas que mudaram; detalhe: {"etapa": [antes, depois]}, {"situacao": [...]}, {"pago": true}.';
create index on public.atividades (conta_id, quando desc);
create index on public.atividades (cliente_id, quando desc);

create function public.registrar_atividade() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  linha jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  antes jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  conta uuid := (linha ->> 'conta_id')::uuid;
  colunas text[] := '{}';
  detalhe jsonb := '{}';
  cliente uuid;
  reserva uuid;
  eu uuid := (select auth.uid());
  pessoa uuid;
  k text;
begin
  -- a conta inteira sendo apagada: o histórico vai junto, não há o que registrar
  if tg_op = 'DELETE' and not exists (select 1 from public.contas where id = conta) then
    return null;
  end if;
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(c order by c), '{}') into colunas
    from jsonb_object_keys(linha) as c
    where c <> 'atualizado_em' and linha -> c is distinct from antes -> c;
    if cardinality(colunas) = 0 then
      return null;
    end if;
    foreach k in array array['etapa', 'situacao', 'feito'] loop
      if k = any (colunas) then
        detalhe := detalhe || jsonb_build_object(k, jsonb_build_array(antes -> k, linha -> k));
      end if;
    end loop;
    if 'pago_em' = any (colunas) then
      detalhe := detalhe || jsonb_build_object('pago', linha ->> 'pago_em' is not null);
    end if;
    if 'arquivado_em' = any (colunas) then
      detalhe := detalhe || jsonb_build_object('arquivado', linha ->> 'arquivado_em' is not null);
    end if;
  end if;

  reserva := coalesce((linha ->> 'reserva_id')::uuid, case when tg_table_name = 'reservas' then (linha ->> 'id')::uuid end);
  cliente := case when tg_table_name = 'clientes' then (linha ->> 'id')::uuid else (linha ->> 'cliente_id')::uuid end;
  if cliente is null and reserva is not null then
    select r.cliente_id into cliente from public.reservas r where r.id = reserva;
  end if;
  if eu is not null then
    select p.id into pessoa from public.pessoas p where p.conta_id = conta and p.usuario_id = eu;
  end if;

  insert into public.atividades (conta_id, pessoa_id, pelo_suporte, acao, tabela, registro_id, cliente_id, reserva_id, modulo, mudou, detalhe)
  values (
    conta, pessoa, pessoa is null and eu is not null and public.eh_equipe_renderiza(),
    case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'mudou' else 'apagou' end,
    tg_table_name, coalesce(linha ->> 'id', linha ->> 'reserva_id', linha ->> 'cliente_id')::uuid,
    cliente, reserva, tg_argv[0], colunas, detalhe
  );
  return null;
end $$;

-- O argumento é o módulo que dá direito de ver a atividade ('inicio' = todos da conta).
create trigger historico after insert or update or delete on public.clientes for each row execute function public.registrar_atividade('inicio');
create trigger historico after insert or update or delete on public.clientes_fichas for each row execute function public.registrar_atividade('clientes');
create trigger historico after insert or update or delete on public.pedidos for each row execute function public.registrar_atividade('atendimento');
create trigger historico after insert or update or delete on public.reservas for each row execute function public.registrar_atividade('inicio');
create trigger historico after insert or update or delete on public.reservas_valores for each row execute function public.registrar_atividade('financeiro');
create trigger historico after update on public.reservas_checklist for each row execute function public.registrar_atividade('agenda');
create trigger historico after insert or update or delete on public.compromissos for each row execute function public.registrar_atividade('inicio');
create trigger historico after insert or update or delete on public.lista_espera for each row execute function public.registrar_atividade('agenda');
create trigger historico after insert or update or delete on public.parcelas for each row execute function public.registrar_atividade('financeiro');
create trigger historico after insert or update or delete on public.contratos for each row execute function public.registrar_atividade('contratos');
create trigger historico after insert or update or delete on public.entregas for each row execute function public.registrar_atividade('clientes');

-- ---------- Meu site (03) ----------

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null unique references public.contas (id) on delete cascade,
  codigo text not null unique check (codigo ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  dominios text[] not null default '{}' check (cardinality(dominios) <= 10),
  situacao text not null default 'conectado' check (situacao in ('conectado', 'desconectado', 'versao_final')),
  esquema smallint not null default 1 check (esquema >= 1),
  conteudo_inicial jsonb not null default '{}' check (jsonb_typeof(conteudo_inicial) = 'object' and octet_length(conteudo_inicial::text) <= 500000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id)
);
comment on table public.sites is 'O site da conta (Meu site e agenda online). codigo: o do script no site (nunca o id). Cadastrado e desconectado pela Renderiza; a conta vê com o módulo Meu site.';

create table public.sites_versoes (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null,
  site_id uuid not null,
  numero integer not null check (numero >= 1),
  conteudo jsonb not null check (jsonb_typeof(conteudo) = 'object' and octet_length(conteudo::text) <= 500000),
  estado text not null default 'rascunho' check (estado in ('rascunho', 'publicada', 'arquivada')),
  pessoa_id uuid,
  publicada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (site_id, numero),
  unique (conta_id, id),
  foreign key (conta_id, site_id) references public.sites (conta_id, id) on delete cascade,
  foreign key (conta_id, pessoa_id) references public.pessoas (conta_id, id) on delete set null (pessoa_id)
);
comment on table public.sites_versoes is 'Rascunho (um por site) e versões publicadas, no formato do 03 (contrato v1). Publicada não muda de conteúdo; a do ar é a publicada mais recente.';
create unique index sites_versoes_um_rascunho on public.sites_versoes (site_id) where estado = 'rascunho';

create table public.sites_previas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null,
  site_id uuid not null,
  versao_id uuid not null,
  codigo text not null unique default replace(gen_random_uuid()::text, '-', '') check (codigo ~ '^[a-z0-9]{16,64}$'),
  expira_em timestamptz not null default now() + interval '1 day',
  criado_em timestamptz not null default now(),
  check (expira_em <= criado_em + interval '7 days'),
  foreign key (conta_id, site_id) references public.sites (conta_id, id) on delete cascade,
  foreign key (conta_id, versao_id) references public.sites_versoes (conta_id, id) on delete cascade
);
comment on table public.sites_previas is 'Links de prévia do rascunho no site de verdade (03): código que expira.';

create function public.sites_versoes_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.numero is null then
      select coalesce(max(numero), 0) + 1 into new.numero from public.sites_versoes where site_id = new.site_id;
    end if;
    if public.pelo_app() then new.pessoa_id := public.minha_pessoa(new.conta_id); end if;
  else
    if old.estado <> 'rascunho' and (new.conteudo, new.numero, new.site_id) is distinct from (old.conteudo, old.numero, old.site_id) then
      raise exception 'Versão publicada não muda: publique uma nova.' using errcode = '42501';
    end if;
    if new.estado = 'rascunho' and old.estado <> 'rascunho' then
      raise exception 'Versão publicada não volta a ser rascunho.' using errcode = '42501';
    end if;
  end if;
  if new.estado = 'publicada' and new.publicada_em is null then
    new.publicada_em := now();
    if public.pelo_app() then new.pessoa_id := public.minha_pessoa(new.conta_id); end if;
  end if;
  return new;
end $$;
create trigger sites_versoes_antes before insert or update on public.sites_versoes for each row execute function public.sites_versoes_antes();
create trigger sites_atualizado before update on public.sites for each row execute function public.marcar_atualizado();
create trigger sites_versoes_atualizado before update on public.sites_versoes for each row execute function public.marcar_atualizado();

-- ---------- Admin (só a equipe Renderiza) ----------

create table public.entradas (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  conta_id uuid not null references public.contas (id) on delete cascade,
  pessoa_id uuid,
  quando timestamptz not null default now(),
  aparelho text check (length(aparelho) <= 300),
  foreign key (conta_id, pessoa_id) references public.pessoas (conta_id, id) on delete set null (pessoa_id)
);
comment on table public.entradas is 'Cada entrada numa conta (registrar_entrada): quem, em qual conta, quando, de que aparelho. Para o Admin ("quem loga, quem está usando") e para a própria pessoa.';
create index on public.entradas (conta_id, quando desc);
create index on public.entradas (usuario_id, quando desc);

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  valor numeric(10, 2) not null check (valor > 0),
  pago_em date not null default current_date,
  observacao text check (length(observacao) <= 300),
  registrado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em timestamptz not null default now()
);
comment on table public.pagamentos is 'A mensalidade por Pix, registrada à mão no Admin (02). mes: o primeiro dia do mês de referência.';
create index on public.pagamentos (conta_id, mes);

create table public.erros_front (
  id bigint generated always as identity primary key,
  quando timestamptz not null default now(),
  mensagem text not null check (length(mensagem) between 1 and 500),
  pagina text check (length(pagina) <= 200),
  aparelho text check (length(aparelho) <= 300),
  versao text check (length(versao) <= 40)
);
comment on table public.erros_front is 'Erros das telas, sem dado pessoal (nada de nome, telefone ou e-mail na mensagem; 06). Qualquer pessoa logada grava; só a Renderiza lê.';
create index on public.erros_front (quando desc);

-- Ao entrar numa conta (ou voltar a ela): registra a entrada e o "visto em". Uma entrada a cada 30 minutos no
-- máximo por pessoa e conta, para recarregar a página não encher a tabela; o "visto em" muda sempre.
create function public.registrar_entrada(conta uuid, aparelho text default null) returns void language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := (select auth.uid());
  pid uuid;
begin
  if eu is null then
    raise exception 'Entre antes.' using errcode = '42501';
  end if;
  select id into pid from public.pessoas where conta_id = registrar_entrada.conta and usuario_id = eu and ativa;
  if pid is null and not public.em_suporte(registrar_entrada.conta) then
    raise exception 'Você não é desta conta.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.entradas e
    where e.usuario_id = eu and e.conta_id = registrar_entrada.conta and e.quando > now() - interval '30 minutes'
  ) then
    insert into public.entradas (usuario_id, conta_id, pessoa_id, aparelho)
    values (eu, registrar_entrada.conta, pid, left(registrar_entrada.aparelho, 300));
  end if;
  if pid is not null then
    update public.pessoas set visto_em = now() where id = pid;
  end if;
end $$;

-- Os números do Admin (02, "Indicadores"). Só contagens: nada de nome ou contato de cliente final.
create function public.admin_indicadores() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.eh_equipe_renderiza() then
    raise exception 'Só a equipe Renderiza.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'contas_por_situacao', (select coalesce(jsonb_object_agg(situacao, n), '{}') from (select situacao, count(*) as n from public.contas group by situacao) as x),
    'contas_por_nicho', (select coalesce(jsonb_object_agg(nicho, n), '{}') from (select nicho, count(*) as n from public.contas group by nicho) as x),
    'cadastros_por_semana', (
      select coalesce(jsonb_agg(jsonb_build_object('semana', semana, 'contas', n) order by semana), '[]')
      from (
        select date_trunc('week', criado_em)::date as semana, count(*) as n from public.contas
        where origem = 'cadastro' and criado_em > now() - interval '12 weeks' group by 1
      ) as x
    ),
    'pessoas_ativas_7_dias', (select count(distinct usuario_id) from public.entradas where quando > now() - interval '7 days'),
    'pessoas_ativas_30_dias', (select count(distinct usuario_id) from public.entradas where quando > now() - interval '30 days'),
    'uso_por_modulo_30_dias', (
      select coalesce(jsonb_object_agg(modulo, n), '{}')
      from (select modulo, count(*) as n from public.atividades where acao = 'criou' and quando > now() - interval '30 days' group by modulo) as x
    ),
    'modulos_ligados', (
      select coalesce(jsonb_object_agg(modulo_id, n), '{}')
      from (select modulo_id, count(*) as n from public.contas_modulos where ligado group by modulo_id) as x
    ),
    'pedidos_dos_sites_30_dias', (select count(*) from public.pedidos where origem = 'agenda_online' and criado_em > now() - interval '30 days')
  );
end $$;
comment on function public.admin_indicadores() is 'Os indicadores do Admin, só números (02, 06).';

-- ---------- RLS ----------

alter table public.atividades enable row level security;
alter table public.sites enable row level security;
alter table public.sites_versoes enable row level security;
alter table public.sites_previas enable row level security;
alter table public.entradas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.erros_front enable row level security;

create policy "atividades: vê quem vê o módulo" on public.atividades for select to authenticated using (public.pode(conta_id, modulo, 'ver'));

create policy "sites: Meu site vê" on public.sites for select to authenticated
  using (public.pode(conta_id, 'meu-site', 'ver') or public.eh_equipe_renderiza());
create policy "sites: a Renderiza cadastra e desconecta" on public.sites for all to authenticated
  using (public.eh_equipe_renderiza()) with check (public.eh_equipe_renderiza());
create policy "sites_versoes: Meu site vê" on public.sites_versoes for select to authenticated using (public.pode(conta_id, 'meu-site', 'ver'));
create policy "sites_versoes: Meu site cria" on public.sites_versoes for insert to authenticated with check (public.pode(conta_id, 'meu-site', 'editar'));
create policy "sites_versoes: Meu site muda" on public.sites_versoes for update to authenticated
  using (public.pode(conta_id, 'meu-site', 'editar')) with check (public.pode(conta_id, 'meu-site', 'editar'));
create policy "sites_previas: Meu site vê" on public.sites_previas for select to authenticated using (public.pode(conta_id, 'meu-site', 'ver'));
create policy "sites_previas: Meu site (até só vê) faz prévia" on public.sites_previas for insert to authenticated with check (public.pode(conta_id, 'meu-site', 'ver'));
create policy "sites_previas: Meu site apaga" on public.sites_previas for delete to authenticated using (public.pode(conta_id, 'meu-site', 'editar'));

create policy "entradas: a Renderiza e a própria pessoa veem" on public.entradas for select to authenticated
  using (public.eh_equipe_renderiza() or usuario_id = (select auth.uid()));
create policy "pagamentos: a Renderiza" on public.pagamentos for all to authenticated
  using (public.eh_equipe_renderiza()) with check (public.eh_equipe_renderiza());
create policy "erros_front: quem está logado grava" on public.erros_front for insert to authenticated with check (true);
create policy "erros_front: a Renderiza lê" on public.erros_front for select to authenticated using (public.eh_equipe_renderiza());

-- ---------- permissões dos papéis da API ----------

revoke all on public.atividades, public.sites, public.sites_versoes, public.sites_previas, public.entradas,
  public.pagamentos, public.erros_front from anon, authenticated;
grant select, insert, update, delete on public.atividades, public.sites, public.sites_versoes, public.sites_previas,
  public.entradas, public.pagamentos, public.erros_front to authenticated;

revoke execute on function public.registrar_entrada(uuid, text), public.admin_indicadores() from public, anon;
grant execute on function public.registrar_entrada(uuid, text), public.admin_indicadores() to authenticated;

-- ---------- tempo real ----------
-- Pedido novo aparece na hora no Atendimento (04). O tempo real respeita a RLS.
alter publication supabase_realtime add table public.pedidos;
