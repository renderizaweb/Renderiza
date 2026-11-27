-- O uso do painel no Admin (pedido da Renderiza, 19/11/2026: "não sei se as pessoas estão usando; mandei o link, não
-- sei se ela criou a senha, se entrou, se usou"). As entradas (entradas, registrar_entrada) já diziam quem abriu o
-- painel e quando; faltava quanto tempo cada pessoa fica e em que parte.
--
-- Como conta: enquanto a pessoa está com o painel à vista e mexendo (o app, src/uso.js), ele manda um sinal por minuto
-- (registrar_uso) com o módulo aberto; o banco soma um minuto por pessoa, conta, dia e módulo, no máximo um por minuto
-- (duas abas abertas não contam em dobro). A Renderiza em suporte numa conta não conta. Guardado por 400 dias.
-- Só o Admin lê, e já somado (admin_uso): por pessoa, as entradas, os minutos, os dias com uso, as partes mais usadas
-- e, para quem ainda não entrou, o convite (mandado, link aberto ou não).

create table public.uso_diario (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  conta_id uuid not null references public.contas (id) on delete cascade,
  pessoa_id uuid not null,
  dia date not null,
  modulo text not null check (modulo ~ '^[a-z0-9-]{1,40}$'),
  minutos integer not null default 1 check (minutos >= 0),
  ultimo timestamptz not null default now(),
  primary key (usuario_id, conta_id, dia, modulo),
  foreign key (conta_id, pessoa_id) references public.pessoas (conta_id, id) on delete cascade
);
comment on table public.uso_diario is 'Uso do painel: minutos com o painel à vista e em uso, por pessoa, conta, dia (no fuso da conta) e módulo. Gravada só por registrar_uso; lida só pelo Admin (admin_uso). 400 dias.';
create index uso_diario_conta on public.uso_diario (conta_id, dia);
alter table public.uso_diario enable row level security;
revoke all on public.uso_diario from anon, authenticated;

-- O sinal de um minuto de uso. modulo: a parte aberta ("inicio", "agenda", "meu-site"...); fora do formato, "outro".
-- Devolve se contou (false: o último sinal da pessoa nesta conta tem menos de 50 segundos, ou ela não é da conta).
create function public.registrar_uso(conta uuid, modulo text) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := (select auth.uid());
  pid uuid;
  v_dia date;
  v_mod text := case when coalesce(registrar_uso.modulo, '') ~ '^[a-z0-9-]{1,40}$' then registrar_uso.modulo else 'outro' end;
begin
  if eu is null then
    raise exception 'Entre antes.' using errcode = '42501';
  end if;
  select p.id into pid from public.pessoas p where p.conta_id = registrar_uso.conta and p.usuario_id = eu and p.ativa;
  if pid is null then return false; end if; -- a Renderiza em suporte, ou quem não é da conta: não conta
  select (now() at time zone c.fuso)::date into v_dia from public.contas c where c.id = registrar_uso.conta;
  if exists (select 1 from public.uso_diario u where u.usuario_id = eu and u.conta_id = registrar_uso.conta and u.ultimo > now() - interval '50 seconds') then
    return false;
  end if;
  insert into public.uso_diario (usuario_id, conta_id, pessoa_id, dia, modulo)
  values (eu, registrar_uso.conta, pid, v_dia, v_mod)
  on conflict on constraint uso_diario_pkey do update set minutos = public.uso_diario.minutos + 1, ultimo = now(), pessoa_id = excluded.pessoa_id;
  update public.pessoas set visto_em = now() where id = pid;
  if extract(minute from now()) = 0 then delete from public.uso_diario where dia < current_date - 400; end if;
  return true;
end $$;
comment on function public.registrar_uso(uuid, text) is 'Um minuto de uso do painel (o app manda um sinal por minuto com o painel à vista e em uso). No máximo um por minuto por pessoa e conta; a Renderiza em suporte não conta.';

-- O uso por pessoa nos últimos p_dias dias (1 a 400), só para a equipe Renderiza: todas as pessoas ativas das contas,
-- com as entradas (registrar_entrada grava no máximo uma a cada 30 minutos), os minutos, os dias com uso, as partes
-- mais usadas e o último acesso; e os convites que ainda esperam (a pessoa não criou a senha).
create function public.admin_uso(p_dias integer default 30) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_desde timestamptz := now() - make_interval(days => least(greatest(coalesce(p_dias, 30), 1), 400));
begin
  if not public.eh_equipe_renderiza() then
    raise exception 'Só a equipe Renderiza.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'dias', least(greatest(coalesce(p_dias, 30), 1), 400),
    'pessoas', coalesce((
      select jsonb_agg(x order by x.minutos desc, x.entradas desc, x.visto_em desc nulls last, x.nome)
      from (
        select p.id as pessoa_id, p.conta_id, c.nome as conta, p.nome, p.email, p.dono, p.visto_em, p.criado_em,
          (select min(e.quando) from public.entradas e where e.conta_id = p.conta_id and e.usuario_id = p.usuario_id) as primeira_entrada,
          (select count(*) from public.entradas e where e.conta_id = p.conta_id and e.usuario_id = p.usuario_id and e.quando >= v_desde)::integer as entradas,
          coalesce((select sum(u.minutos) from public.uso_diario u where u.pessoa_id = p.id and u.dia >= v_desde::date), 0)::integer as minutos,
          (select count(distinct u.dia) from public.uso_diario u where u.pessoa_id = p.id and u.dia >= v_desde::date)::integer as dias_com_uso,
          coalesce((select jsonb_agg(jsonb_build_object('modulo', m.modulo, 'minutos', m.minutos) order by m.minutos desc)
            from (select u.modulo, sum(u.minutos)::integer as minutos from public.uso_diario u where u.pessoa_id = p.id and u.dia >= v_desde::date
                  group by u.modulo order by 2 desc limit 5) m), '[]') as modulos
        from public.pessoas p join public.contas c on c.id = p.conta_id
        where p.ativa
      ) x), '[]'),
    'convites', coalesce((
      select jsonb_agg(jsonb_build_object('conta_id', v.conta_id, 'conta', c.nome, 'nome', v.nome, 'email', v.email, 'dono', v.dono,
        'mandado_em', v.criado_em, 'expira_em', v.expira_em, 'link_usado_em', v.link_usado_em) order by v.criado_em desc)
      from public.convites v join public.contas c on c.id = v.conta_id
      where v.aceito_em is null and v.cancelado_em is null), '[]')
  );
end $$;
comment on function public.admin_uso(integer) is 'Admin: o uso do painel por pessoa (entradas, minutos, dias com uso, partes mais usadas, último acesso) e os convites esperando. Só a equipe Renderiza.';

revoke execute on function public.registrar_uso(uuid, text), public.admin_uso(integer) from public, anon;
grant execute on function public.registrar_uso(uuid, text), public.admin_uso(integer) to authenticated;
