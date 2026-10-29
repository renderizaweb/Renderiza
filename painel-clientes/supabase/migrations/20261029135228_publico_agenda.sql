-- Missão 4 · bloco A: a agenda online (o site do cliente mostra os dias livres e pede a pré-reserva).
-- Duas funções públicas, as únicas desta migração que o visitante (anon) chama, sempre pela API do painel
-- (painel-clientes/api/publico/agenda/): publico_disponibilidade e publico_pedido (05, "Funções públicas").
-- Nenhuma devolve nome, telefone ou valor de cliente final.
--
-- Regras (02, Agenda online; 04, API pública):
-- - responde só para site conectado, de conta liberada (ativa ou no teste) e com o módulo Agenda online ligado;
-- - os dias livres saem dos turnos (horarios), menos bloqueios e reservas que seguram a data;
-- - a pré-reserva da agenda online segura a data por 48 horas; depois, se ninguém confirmou, a data volta a
--   aparecer livre no site (a reserva continua no painel, para a equipe decidir);
-- - o pedido acha ou cria o cliente pelo WhatsApp, cria o pedido no Atendimento e a pré-reserva na Agenda;
-- - só aceita os domínios cadastrados no site e tem limites contra robô e repetição.

-- ---------- ajudantes (não ficam abertos ao visitante) ----------

-- A conta do site, quando a agenda online (ou outro módulo do site) pode responder.
create function public.conta_do_site(p_codigo text, p_modulo text) returns uuid language sql stable security definer set search_path = '' as $$
  select s.conta_id
  from public.sites s
  join public.contas c on c.id = s.conta_id
  join public.contas_modulos cm on cm.conta_id = c.id and cm.modulo_id = p_modulo and cm.ligado
  join public.modulos m on m.id = cm.modulo_id
  where s.codigo = p_codigo and s.situacao = 'conectado'
    and public.conta_liberada(c.id)
    and (c.situacao <> 'teste' or m.liberado_no_teste)
$$;
comment on function public.conta_do_site(text, text) is 'A conta do site pelo código, se o site está conectado, a conta liberada e o módulo ligado (agenda online, Meu site). Só para as funções publico_*.';

-- Uma reserva segura a data? Cancelada não; pré-reserva da agenda online, só nas primeiras 48 horas.
create function public.reserva_segura_data(r public.reservas) returns boolean language sql stable security definer set search_path = '' as $$
  select r.situacao in ('pre_reserva', 'confirmada', 'realizada')
    and not (
      r.situacao = 'pre_reserva' and r.criado_em < now() - interval '48 hours'
      and exists (select 1 from public.pedidos p where p.id = r.pedido_id and p.origem = 'agenda_online')
    )
$$;

-- O começo e o fim de um turno num dia, no fuso da conta (fim antes do início = passa da meia-noite).
create function public.turno_no_dia(dia date, inicio time, fim time, fuso text, out comeca timestamptz, out termina timestamptz)
language sql stable set search_path = '' as $$
  select (dia + inicio) at time zone fuso,
         case when fim is null then ((dia + inicio) at time zone fuso) + interval '1 hour'
              when fim <= inicio then ((dia + 1) + fim) at time zone fuso
              else (dia + fim) at time zone fuso end
$$;

create function public.periodo_livre(conta uuid, comeca timestamptz, termina timestamptz) returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.reservas r
    where r.conta_id = conta and r.inicio < termina and r.fim > comeca and public.reserva_segura_data(r)
  )
  and not exists (
    select 1 from public.bloqueios b, public.contas c
    where b.conta_id = conta and c.id = conta
      and (comeca at time zone c.fuso)::date between b.de and b.ate
  )
$$;

revoke execute on function
  public.conta_do_site(text, text),
  public.reserva_segura_data(public.reservas),
  public.periodo_livre(uuid, timestamptz, timestamptz)
from public, anon, authenticated;

-- Quem pediu pela agenda online: o endereço (já embaralhado pela API) e quando, só para os limites; guardado por 1 dia.
create table public.publico_tentativas (
  id bigint generated always as identity primary key,
  conta_id uuid not null references public.contas (id) on delete cascade,
  endereco text not null check (length(endereco) between 1 and 128),
  criado_em timestamptz not null default now()
);
comment on table public.publico_tentativas is 'Pedidos da agenda online por endereço (embaralhado), para o limite contra robô. Sem dado de pessoa; apagado depois de 1 dia. Só as funções publico_* leem e gravam.';
create index publico_tentativas_conta on public.publico_tentativas (conta_id, endereco, criado_em);
alter table public.publico_tentativas enable row level security;
revoke all on public.publico_tentativas from anon, authenticated;

-- ---------- publico_disponibilidade ----------

-- Os dias com turno de de até ate (no máximo 62 dias por pedido, até uns 15 meses à frente), cada turno com
-- "livre". Também os tipos de festa, os pacotes e os adicionais que a agenda online mostra (sem preço).
-- Site que não responde (desconectado, conta não liberada, módulo desligado): null.
create function public.publico_disponibilidade(p_codigo text, p_de date, p_ate date) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'agenda-online');
  v_fuso text;
  v_nicho text;
  v_hoje date;
  v_de date;
  v_ate date;
begin
  if v_conta is null then return null; end if;
  select c.fuso, c.nicho into v_fuso, v_nicho from public.contas c where c.id = v_conta;
  v_hoje := (now() at time zone v_fuso)::date;
  v_de := greatest(coalesce(p_de, v_hoje), v_hoje);
  v_ate := least(coalesce(p_ate, v_de + 31), v_de + 61, v_hoje + 460);
  return jsonb_build_object(
    'esquema', 1,
    'nicho', v_nicho,
    'hoje', v_hoje,
    'de', v_de,
    'ate', v_ate,
    'separa_horas', 48,
    'tipos', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'nome', t.nome) order by t.ordem, t.nome)
      from public.tipos_reserva t where t.conta_id = v_conta and t.ativo), '[]'),
    'pacotes', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'nome', s.nome, 'descricao', s.descricao, 'inclui', to_jsonb(s.inclui),
        'convidados', s.convidados_inclusos) order by s.ordem, s.nome)
      from public.servicos s where s.conta_id = v_conta and s.ativo and s.na_agenda_online), '[]'),
    'adicionais', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'nome', a.nome) order by a.ordem, a.nome)
      from public.adicionais a where a.conta_id = v_conta and a.ativo), '[]'),
    'dias', coalesce((
      select jsonb_agg(jsonb_build_object('data', d.dia, 'turnos', d.turnos) order by d.dia)
      from (
        select dia::date as dia,
          jsonb_agg(jsonb_build_object(
            'id', h.id, 'nome', h.nome, 'inicio', to_char(h.inicio, 'HH24:MI'), 'fim', to_char(h.fim, 'HH24:MI'),
            'pacote', h.servico_id,
            'livre', t.comeca > now() and public.periodo_livre(v_conta, t.comeca, t.termina)
          ) order by h.inicio) as turnos
        from generate_series(v_de, v_ate, interval '1 day') as dia
        join public.horarios h on h.conta_id = v_conta and h.dia_semana = extract(dow from dia)
        cross join lateral public.turno_no_dia(dia::date, h.inicio, h.fim, v_fuso) as t
        group by dia
      ) d), '[]')
  );
end $$;
comment on function public.publico_disponibilidade(text, date, date) is 'Agenda online (pública): os dias com turno e se cada um está livre, mais tipos, pacotes e adicionais, sem preço nem dado de cliente final. null = o site não responde.';

-- ---------- publico_pedido ----------

-- O pedido da agenda online. dados: { nome, whatsapp, email?, tipo?, pacote?, adicionais?: [ids], data, turno,
-- convidados?, visita?: bool, mensagem? }. p_dominio: de onde veio (o Origin, pela API); p_endereco: o endereço do
-- visitante já embaralhado pela API (sem ele, todos caem no mesmo limite).
-- Devolve { ok: true, pedido, separada_ate } ou { ok: false, erro } com erro = fora (o site não responde),
-- dominio, dados (e campo), ocupada ou limite.
create function public.publico_pedido(p_codigo text, p_dados jsonb, p_dominio text default null, p_endereco text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'agenda-online');
  v_site public.sites;
  v_fuso text;
  v_hoje date;
  v_nome text := btrim(coalesce(p_dados ->> 'nome', ''));
  v_zap text := public.normalizar_whatsapp(p_dados ->> 'whatsapp');
  v_email text := public.normalizar_email(p_dados ->> 'email');
  v_dia date;
  v_turno public.horarios;
  v_comeca timestamptz;
  v_termina timestamptz;
  v_tipo uuid;
  v_pacote uuid;
  v_adicionais uuid[] := '{}';
  v_conv integer;
  v_msg text := btrim(coalesce(p_dados ->> 'mensagem', ''));
  v_visita boolean;
  v_endereco text := left(coalesce(nullif(btrim(p_endereco), ''), 'sem-endereco'), 128);
  v_cliente uuid;
  v_pedido uuid;
  v_reserva uuid;
  v_texto text;
begin
  if v_conta is null then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  select * into v_site from public.sites where conta_id = v_conta;
  select c.fuso into v_fuso from public.contas c where c.id = v_conta;
  v_hoje := (now() at time zone v_fuso)::date;

  -- de onde veio: só os domínios do site (com ou sem www.)
  if p_dominio is not null and not (lower(regexp_replace(p_dominio, '^www\.', '')) in (
    select lower(regexp_replace(d, '^www\.', '')) from unnest(v_site.dominios) as d)) then
    return jsonb_build_object('ok', false, 'erro', 'dominio');
  end if;

  -- os dados
  if jsonb_typeof(p_dados) is distinct from 'object' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'dados'); end if;
  if length(v_nome) not between 2 and 120 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'nome'); end if;
  if v_zap is null or v_zap !~ '^\d{10,11}$' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'whatsapp'); end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'email'); end if;
  if length(v_msg) > 600 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'mensagem'); end if;
  begin
    v_dia := (p_dados ->> 'data')::date;
    v_tipo := nullif(p_dados ->> 'tipo', '')::uuid;
    v_pacote := nullif(p_dados ->> 'pacote', '')::uuid;
    v_conv := nullif(p_dados ->> 'convidados', '')::integer;
    v_visita := coalesce((p_dados ->> 'visita')::boolean, false);
    select coalesce(array_agg(x::uuid), '{}') into v_adicionais from jsonb_array_elements_text(coalesce(p_dados -> 'adicionais', '[]')) as x;
    select * into v_turno from public.horarios h where h.id = (p_dados ->> 'turno')::uuid and h.conta_id = v_conta;
  exception when others then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'formato');
  end;
  if v_dia is null or v_dia < v_hoje or v_dia > v_hoje + 460 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'data'); end if;
  if v_turno.id is null or v_turno.dia_semana <> extract(dow from v_dia) then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'turno'); end if;
  if v_conv is not null and v_conv not between 1 and 10000 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'convidados'); end if;
  if v_tipo is not null and not exists (select 1 from public.tipos_reserva where id = v_tipo and conta_id = v_conta and ativo) then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'tipo');
  end if;
  if v_pacote is not null and not exists (select 1 from public.servicos where id = v_pacote and conta_id = v_conta and ativo and na_agenda_online) then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'pacote');
  end if;
  if cardinality(v_adicionais) > 20 or (select count(*) from public.adicionais where conta_id = v_conta and ativo and id = any (v_adicionais)) <> cardinality(v_adicionais) then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'adicionais');
  end if;

  -- limites: por endereço (5 por hora), pelo mesmo WhatsApp (3 por dia) e da conta toda (20 por hora)
  delete from public.publico_tentativas where criado_em < now() - interval '1 day';
  if (select count(*) from public.publico_tentativas where conta_id = v_conta and endereco = v_endereco and criado_em > now() - interval '1 hour') >= 5
     or (select count(*) from public.pedidos p join public.clientes c on c.id = p.cliente_id
         where p.conta_id = v_conta and p.origem = 'agenda_online' and c.whatsapp = v_zap and p.criado_em > now() - interval '1 day') >= 3
     or (select count(*) from public.pedidos where conta_id = v_conta and origem = 'agenda_online' and criado_em > now() - interval '1 hour') >= 20 then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;

  -- a data: uma pessoa por vez em cada dia da conta, para dois pedidos não levarem o mesmo turno
  perform pg_advisory_xact_lock(hashtextextended(v_conta::text || v_dia::text, 0));
  select t.comeca, t.termina into v_comeca, v_termina from public.turno_no_dia(v_dia, v_turno.inicio, v_turno.fim, v_fuso) t;
  if v_comeca <= now() or not public.periodo_livre(v_conta, v_comeca, v_termina) then
    return jsonb_build_object('ok', false, 'erro', 'ocupada');
  end if;

  -- o cliente (pelo WhatsApp: se já existe, é o mesmo; o nome que está no painel fica)
  insert into public.clientes (conta_id, nome, whatsapp, email, origem)
  values (v_conta, v_nome, v_zap, v_email, 'agenda_online')
  on conflict (conta_id, whatsapp) do update set email = coalesce(public.clientes.email, excluded.email)
  returning id into v_cliente;

  v_texto := 'Pré-reserva pela agenda online: ' || coalesce(v_turno.nome, to_char(v_turno.inicio, 'HH24:MI'))
    || coalesce(', ' || v_conv || ' convidados', '') || '.'
    || case when cardinality(v_adicionais) > 0 then ' Quer: ' || (select string_agg(lower(nome), ', ' order by ordem, nome) from public.adicionais where id = any (v_adicionais)) || '.' else '' end
    || case when v_visita then ' Quer visitar o espaço.' else '' end
    || case when v_msg <> '' then ' “' || v_msg || '”' else '' end;

  insert into public.pedidos (conta_id, cliente_id, data_desejada, hora_desejada, servico_id, tipo_id, convidados, mensagem, origem)
  values (v_conta, v_cliente, v_dia, v_turno.inicio, v_pacote, v_tipo, v_conv, left(v_texto, 2000), 'agenda_online')
  returning id into v_pedido;
  insert into public.reservas (conta_id, cliente_id, pedido_id, servico_id, tipo_id, inicio, fim, convidados, situacao)
  values (v_conta, v_cliente, v_pedido, v_pacote, v_tipo, v_comeca, v_termina, v_conv, 'pre_reserva')
  returning id into v_reserva;
  insert into public.reservas_adicionais (conta_id, reserva_id, adicional_id)
  select v_conta, v_reserva, a from unnest(v_adicionais) as a;
  update public.pedidos set reserva_id = v_reserva where id = v_pedido;
  insert into public.publico_tentativas (conta_id, endereco) values (v_conta, v_endereco);

  return jsonb_build_object('ok', true, 'pedido', v_pedido, 'separada_ate', now() + interval '48 hours');
end $$;
comment on function public.publico_pedido(text, jsonb, text, text) is 'Agenda online (pública): o pedido com a pré-reserva de 48 horas. Acha ou cria o cliente pelo WhatsApp. Devolve só ok, o id do pedido (para o aviso) e até quando a data fica separada.';

revoke execute on function public.publico_disponibilidade(text, date, date), public.publico_pedido(text, jsonb, text, text) from public;
grant execute on function public.publico_disponibilidade(text, date, date), public.publico_pedido(text, jsonb, text, text) to anon, authenticated;
