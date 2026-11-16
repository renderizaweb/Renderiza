-- Indicadores do site (Meu site; pedido da Renderiza em 16/11/2026, com o primeiro site real, o da Rafaela): quantas
-- visitas o site teve, de quantos aparelhos, quanto tempo, que partes foram vistas e que botões foram clicados.
-- Sem cookie e sem dado de pessoa: o site manda, por página aberta, um sorteio que só vale naquela página (visita), o
-- caminho, se é celular ou computador, o site de onde veio, os segundos em cada parte e os cliques nos botões. A API
-- do painel (api/publico/site/<código>/visita) junta o "aparelho": o endereço e o navegador embaralhados com o site
-- e o dia. O mesmo aparelho tem outro valor no dia seguinte, então ninguém é seguido de um dia para o outro, e nem o
-- endereço nem o navegador ficam guardados. Guardado por 13 meses.

create table public.sites_visitas (
  id bigint generated always as identity primary key,
  conta_id uuid not null,
  site_id uuid not null,
  visita text not null check (visita ~ '^[a-z0-9]{12,32}$'),
  dia date not null,
  aparelho text not null check (length(aparelho) between 16 and 64),
  pagina text not null check (length(pagina) between 1 and 120),
  tela text not null check (tela in ('celular', 'computador')),
  origem text check (length(origem) between 1 and 80),
  segundos integer not null default 0 check (segundos between 0 and 14400),
  secoes jsonb not null default '{}' check (jsonb_typeof(secoes) = 'object'),
  cliques jsonb not null default '{}' check (jsonb_typeof(cliques) = 'object'),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (site_id, visita),
  foreign key (conta_id, site_id) references public.sites (conta_id, id) on delete cascade
);
comment on table public.sites_visitas is 'Uma linha por página aberta no site do cliente (indicadores do Meu site). Sem dado de pessoa: visita = sorteio da página; aparelho = endereço e navegador embaralhados com o site e o dia (muda a cada dia). Só as funções publico_visita (grava) e site_indicadores (resume) leem e gravam. Guardado por 13 meses.';
create index sites_visitas_conta_dia on public.sites_visitas (conta_id, dia);
create index sites_visitas_aparelho on public.sites_visitas (site_id, dia, aparelho);
alter table public.sites_visitas enable row level security;
revoke all on public.sites_visitas from anon, authenticated;

-- ---------- publico_visita ----------

-- Conta (ou atualiza) uma página aberta. p_dados: { v (o sorteio da página), p (o caminho), t ("celular" ou
-- "computador"), o? (o site de onde veio), s (segundos com a página à vista), se? ({ parte: segundos }),
-- c? ({ botão: cliques }) }. p_dominio: de onde veio (o Origin, pela API); p_aparelho: já embaralhado pela API.
-- A mesma página manda de novo enquanto fica aberta: vale o maior tempo. Devolve true se contou. Não conta: site que
-- não responde (desconectado, conta não liberada, Meu site desligado), outro domínio, dado fora do formato, mais de
-- 200 páginas do mesmo aparelho ou 20.000 do site no dia.
create function public.publico_visita(p_codigo text, p_dados jsonb, p_dominio text default null, p_aparelho text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'meu-site');
  v_site public.sites;
  v_dia date;
  v_visita text := p_dados ->> 'v';
  v_pagina text := coalesce(p_dados ->> 'p', '/');
  v_origem text := nullif(lower(coalesce(p_dados ->> 'o', '')), '');
  v_segundos integer := 0;
  v_secoes jsonb;
  v_cliques jsonb;
begin
  if v_conta is null or p_aparelho is null or length(p_aparelho) not between 16 and 64 then return false; end if;
  if v_visita is null or v_visita !~ '^[a-z0-9]{12,32}$' or v_pagina !~ '^/[A-Za-z0-9._~/-]{0,119}$' then return false; end if;
  select * into v_site from public.sites s where s.conta_id = v_conta and s.codigo = p_codigo;
  if p_dominio is null or not (lower(regexp_replace(p_dominio, '^www\.', '')) in (
    select lower(regexp_replace(d, '^www\.', '')) from unnest(v_site.dominios) as d)) then
    return false;
  end if;
  if v_origem is not null and v_origem !~ '^[a-z0-9][a-z0-9.-]{0,79}$' then v_origem := null; end if;
  if (p_dados ->> 's') ~ '^\d{1,6}$' then v_segundos := least((p_dados ->> 's')::integer, 14400); end if;
  select coalesce(jsonb_object_agg(x.k, least(x.v::integer, 14400)), '{}') into v_secoes
    from (select e.key as k, e.value as v
          from jsonb_each_text(case when jsonb_typeof(p_dados -> 'se') = 'object' then p_dados -> 'se' else '{}'::jsonb end) e
          where e.key ~ '^[a-z0-9][a-z0-9-]{0,40}$' and e.value ~ '^\d{1,6}$' limit 40) x;
  select coalesce(jsonb_object_agg(x.k, least(x.v::integer, 500)), '{}') into v_cliques
    from (select e.key as k, e.value as v
          from jsonb_each_text(case when jsonb_typeof(p_dados -> 'c') = 'object' then p_dados -> 'c' else '{}'::jsonb end) e
          where e.key ~ '^[a-z0-9][a-z0-9.-]{0,60}$' and e.value ~ '^\d{1,6}$' limit 40) x;
  select (now() at time zone c.fuso)::date into v_dia from public.contas c where c.id = v_conta;

  if not exists (select 1 from public.sites_visitas s where s.site_id = v_site.id and s.visita = v_visita) then
    if (select count(*) from public.sites_visitas s where s.site_id = v_site.id and s.dia = v_dia and s.aparelho = p_aparelho) >= 200
       or (select count(*) from public.sites_visitas s where s.site_id = v_site.id and s.dia = v_dia) >= 20000 then
      return false;
    end if;
    if random() < 0.02 then delete from public.sites_visitas s where s.site_id = v_site.id and s.dia < v_dia - 400; end if;
  end if;

  insert into public.sites_visitas as s (conta_id, site_id, visita, dia, aparelho, pagina, tela, origem, segundos, secoes, cliques)
  values (v_conta, v_site.id, v_visita, v_dia, p_aparelho, v_pagina,
    case when p_dados ->> 't' = 'computador' then 'computador' else 'celular' end, v_origem, v_segundos, v_secoes, v_cliques)
  on conflict (site_id, visita) do update
    set segundos = greatest(s.segundos, excluded.segundos), secoes = excluded.secoes, cliques = excluded.cliques, atualizado_em = now()
    where s.aparelho = excluded.aparelho and s.criado_em > now() - interval '12 hours';
  return true;
end $$;
comment on function public.publico_visita(text, jsonb, text, text) is 'Conta uma página aberta no site (indicadores do Meu site). Só a API do painel chama; nenhum dado de pessoa.';

-- ---------- site_indicadores ----------

-- O resumo dos últimos p_dias (1 a 365; padrão 30) para quem vê o Meu site da conta: visitas (páginas abertas),
-- aparelhos (por dia: o mesmo aparelho em dois dias conta duas vezes), o tempo médio, dia a dia, as partes (em
-- quantas visitas apareceram e por quantos segundos), os botões clicados, de onde vieram, celular ou computador e as
-- páginas. Quem não vê o Meu site: null.
create function public.site_indicadores(p_conta uuid, p_dias integer default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_ate date;
  v_de date;
begin
  if not public.pode(p_conta, 'meu-site', 'ver') then return null; end if;
  select (now() at time zone c.fuso)::date into v_ate from public.contas c where c.id = p_conta;
  v_de := v_ate - (least(greatest(coalesce(p_dias, 30), 1), 365) - 1);
  return (
    with v as (select * from public.sites_visitas s where s.conta_id = p_conta and s.dia between v_de and v_ate)
    select jsonb_build_object(
      'de', v_de, 'ate', v_ate,
      'visitas', (select count(*) from v),
      'aparelhos', (select count(distinct (v.dia, v.aparelho)) from v),
      'segundos', (select coalesce(round(avg(v.segundos)), 0) from v),
      'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('dia', d::date, 'visitas', coalesce(x.n, 0), 'aparelhos', coalesce(x.a, 0)) order by d), '[]'::jsonb)
        from generate_series(v_de::timestamp, v_ate::timestamp, interval '1 day') d
        left join (select v.dia, count(*) as n, count(distinct v.aparelho) as a from v group by v.dia) x on x.dia = d::date),
      'secoes', (select coalesce(jsonb_agg(jsonb_build_object('secao', y.k, 'visitas', y.n, 'segundos', y.s) order by y.n desc, y.s desc, y.k), '[]'::jsonb)
        from (select e.key as k, count(*) as n, sum(e.value::integer) as s from v, jsonb_each_text(v.secoes) e group by e.key) y),
      'cliques', (select coalesce(jsonb_agg(jsonb_build_object('nome', y.k, 'cliques', y.n, 'visitas', y.vs) order by y.n desc, y.k), '[]'::jsonb)
        from (select e.key as k, sum(e.value::integer) as n, count(*) as vs from v, jsonb_each_text(v.cliques) e group by e.key) y),
      'origens', (select coalesce(jsonb_agg(jsonb_build_object('origem', y.o, 'visitas', y.n) order by y.n desc, y.o), '[]'::jsonb)
        from (select coalesce(v.origem, '') as o, count(*) as n from v group by 1 order by 2 desc limit 12) y),
      'telas', (select jsonb_build_object('celular', count(*) filter (where v.tela = 'celular'), 'computador', count(*) filter (where v.tela = 'computador')) from v),
      'paginas', (select coalesce(jsonb_agg(jsonb_build_object('pagina', y.p, 'visitas', y.n) order by y.n desc, y.p), '[]'::jsonb)
        from (select v.pagina as p, count(*) as n from v group by 1 order by 2 desc limit 12) y)
    )
  );
end $$;
comment on function public.site_indicadores(uuid, integer) is 'Os indicadores do site (visitas, aparelhos, tempo, partes vistas, botões clicados) para quem vê o Meu site da conta.';

revoke execute on function public.publico_visita(text, jsonb, text, text), public.site_indicadores(uuid, integer) from public, anon, authenticated;
grant execute on function public.publico_visita(text, jsonb, text, text) to anon, authenticated;
grant execute on function public.site_indicadores(uuid, integer) to authenticated;
