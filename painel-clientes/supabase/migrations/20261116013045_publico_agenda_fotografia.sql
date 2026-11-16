-- Agenda online da fotografia (a entrega da Rafaela Damaceno, docs/entregas/rafaela-damaceno.md, Parada C2): os
-- horários livres de um ensaio ou de uma campanha com vagas, e o pedido por horário. As funções de eventos
-- (publico_disponibilidade e publico_pedido, por turno) não mudam. Duas funções públicas novas, chamadas só pela API
-- do painel (api/publico/agenda/): publico_horarios e publico_pedido_horario. Nenhuma devolve nome, telefone ou valor.
--
-- A regra é a da Agenda do painel (src/modulos/agenda/logica.js: horariosLivres, seguraHorario, resumoDaCampanha):
-- - um horário de início está livre se é dos horários do dia da semana (horarios: os do ensaio, se ele tem horários
--   próprios; senão os do estúdio, servico_id null) ou, num dia da campanha, dos horários dela; se ainda não passou; e se nenhuma reserva que segura cruza
--   [início, início + duração do ensaio) nem a data está fechada (periodo_livre, da migração da agenda de eventos);
-- - a campanha tem vagas (vagas, ou dias × horários); as reservas dela que seguram o horário gastam uma vaga cada;
-- - o pedido acha ou cria o cliente pelo WhatsApp, cria o pedido no Atendimento e a pré-reserva na Agenda, que segura
--   o horário por 48 horas (reserva_segura_data); os limites contra robô são os da agenda de eventos.

-- Quantas vagas a campanha ainda tem (só para as funções publico_*).
create function public.campanha_restam(p_conta uuid, p_campanha uuid) returns integer language sql stable security definer set search_path = '' as $$
  select greatest(0, coalesce(c.vagas, cardinality(c.dias) * cardinality(c.horarios))
    - (select count(*) from public.reservas r where r.conta_id = p_conta and r.campanha_id = c.id and public.reserva_segura_data(r))::integer)
  from public.campanhas c where c.id = p_campanha and c.conta_id = p_conta
$$;
revoke execute on function public.campanha_restam(uuid, uuid) from public, anon, authenticated;

-- ---------- publico_horarios ----------

-- Os horários livres de de até ate (no máximo 62 dias por pedido, até uns 15 meses à frente), para um ensaio
-- (p_servico, a duração dele) ou uma campanha (p_campanha: os dias e horários dela, enquanto houver vaga). Sem os dois:
-- os horários do estúdio com a duração padrão (60 min). Também os ensaios da agenda online e as campanhas ativas, com
-- as vagas que restam. Site que não responde (desconectado, conta não liberada, módulo desligado) ou conta que não é de
-- fotografia: null.
create function public.publico_horarios(p_codigo text, p_de date, p_ate date, p_servico uuid default null, p_campanha uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'agenda-online');
  v_fuso text;
  v_nicho text;
  v_hoje date;
  v_de date;
  v_ate date;
  v_duracao integer;
  v_camp public.campanhas;
  v_restam integer := null;
  v_valido boolean := true;
  v_proprio uuid := null;
  v_dias jsonb;
begin
  if v_conta is null then return null; end if;
  select c.fuso, c.nicho into v_fuso, v_nicho from public.contas c where c.id = v_conta;
  if v_nicho is distinct from 'fotografia' then return null; end if;
  v_hoje := (now() at time zone v_fuso)::date;
  v_de := greatest(coalesce(p_de, v_hoje), v_hoje);
  v_ate := least(coalesce(p_ate, v_de + 31), v_de + 61, v_hoje + 460);

  if p_campanha is not null then
    select * into v_camp from public.campanhas c where c.id = p_campanha and c.conta_id = v_conta and c.ativa;
    if v_camp.id is null then v_valido := false;
    else
      v_restam := public.campanha_restam(v_conta, v_camp.id);
      select s.duracao_min into v_duracao from public.servicos s where s.id = v_camp.servico_id and s.conta_id = v_conta;
    end if;
  elsif p_servico is not null then
    select s.duracao_min into v_duracao from public.servicos s where s.id = p_servico and s.conta_id = v_conta and s.ativo and s.na_agenda_online;
    if not found then v_valido := false; end if;
    -- o ensaio com horários próprios usa só os dele; sem, os do estúdio (servico_id null)
    if exists (select 1 from public.horarios h where h.conta_id = v_conta and h.servico_id = p_servico) then v_proprio := p_servico; end if;
  end if;
  v_duracao := coalesce(v_duracao, 60);

  if not v_valido then
    v_dias := '[]';
  elsif v_camp.id is not null then
    -- os dias da campanha (no intervalo), com os horários dela; sem vaga, nenhum livre
    select coalesce(jsonb_agg(jsonb_build_object('data', x.dia, 'horarios', x.horas) order by x.dia), '[]') into v_dias
    from (
      select d.dia, jsonb_agg(jsonb_build_object('hora', to_char(h.hora, 'HH24:MI'),
        'livre', v_restam > 0 and ((d.dia + h.hora) at time zone v_fuso) > now()
          and public.periodo_livre(v_conta, (d.dia + h.hora) at time zone v_fuso, ((d.dia + h.hora) at time zone v_fuso) + make_interval(mins => v_duracao))
      ) order by h.hora) as horas
      from (select distinct unnest(v_camp.dias) as dia) d
      cross join (select distinct unnest(v_camp.horarios) as hora) h
      where d.dia between v_de and v_ate
      group by d.dia
    ) x;
  else
    -- os horários de início do estúdio em cada dia da semana (sem serviço próprio, ou os do ensaio escolhido)
    select coalesce(jsonb_agg(jsonb_build_object('data', x.dia, 'horarios', x.horas) order by x.dia), '[]') into v_dias
    from (
      select g.dia::date as dia, jsonb_agg(jsonb_build_object('hora', to_char(h.inicio, 'HH24:MI'),
        'livre', ((g.dia::date + h.inicio) at time zone v_fuso) > now()
          and public.periodo_livre(v_conta, (g.dia::date + h.inicio) at time zone v_fuso, ((g.dia::date + h.inicio) at time zone v_fuso) + make_interval(mins => v_duracao))
      ) order by h.inicio) as horas
      from generate_series(v_de, v_ate, interval '1 day') as g(dia)
      join (select distinct dia_semana, inicio from public.horarios
            where conta_id = v_conta and servico_id is not distinct from v_proprio) h
        on h.dia_semana = extract(dow from g.dia)
      group by g.dia
    ) x;
  end if;

  return jsonb_build_object(
    'esquema', 1,
    'nicho', v_nicho,
    'hoje', v_hoje,
    'de', v_de,
    'ate', v_ate,
    'separa_horas', 48,
    'duracao', v_duracao,
    'ensaios', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'nome', s.nome, 'descricao', s.descricao, 'duracao', coalesce(s.duracao_min, 60)) order by s.ordem, s.nome)
      from public.servicos s where s.conta_id = v_conta and s.ativo and s.na_agenda_online), '[]'),
    'campanhas', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'nome', c.nome, 'servico', c.servico_id,
        'dias', (select jsonb_agg(d order by d) from (select distinct unnest(c.dias) as d) dd where d >= v_hoje),
        'horarios', (select jsonb_agg(to_char(h, 'HH24:MI') order by h) from (select distinct unnest(c.horarios) as h) hh),
        'restam', public.campanha_restam(v_conta, c.id)) order by c.nome)
      from public.campanhas c where c.conta_id = v_conta and c.ativa and exists (select 1 from unnest(c.dias) as d where d >= v_hoje)), '[]'),
    'dias', v_dias
  );
end $$;
comment on function public.publico_horarios(text, date, date, uuid, uuid) is 'Agenda online da fotografia (pública): os horários livres de um ensaio ou de uma campanha (com as vagas que restam), os ensaios da agenda online e as campanhas ativas, sem preço nem dado de cliente final. null = o site não responde ou a conta não é de fotografia.';

-- ---------- publico_pedido_horario ----------

-- O pedido da agenda online da fotografia. dados: { nome, whatsapp, email?, servico? (o ensaio), campanha?, data,
-- hora ("HH:MM"), mensagem? }. p_dominio: de onde veio (o Origin, pela API); p_endereco: o endereço do visitante já
-- embaralhado pela API. Devolve { ok: true, pedido, separada_ate } ou { ok: false, erro } com erro = fora, dominio,
-- dados (e campo), ocupada ou limite (os mesmos da agenda de eventos).
create function public.publico_pedido_horario(p_codigo text, p_dados jsonb, p_dominio text default null, p_endereco text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'agenda-online');
  v_site public.sites;
  v_fuso text;
  v_nicho text;
  v_hoje date;
  v_nome text := btrim(coalesce(p_dados ->> 'nome', ''));
  v_zap text := public.normalizar_whatsapp(p_dados ->> 'whatsapp');
  v_email text := public.normalizar_email(p_dados ->> 'email');
  v_msg text := btrim(coalesce(p_dados ->> 'mensagem', ''));
  v_dia date;
  v_hora time;
  v_servico uuid;
  v_campanha uuid;
  v_camp public.campanhas;
  v_ensaio public.servicos;
  v_duracao integer;
  v_comeca timestamptz;
  v_termina timestamptz;
  v_endereco text := left(coalesce(nullif(btrim(p_endereco), ''), 'sem-endereco'), 128);
  v_cliente uuid;
  v_pedido uuid;
  v_reserva uuid;
  v_texto text;
begin
  if v_conta is null then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  select c.fuso, c.nicho into v_fuso, v_nicho from public.contas c where c.id = v_conta;
  if v_nicho is distinct from 'fotografia' then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  select * into v_site from public.sites where conta_id = v_conta;
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
  if coalesce(p_dados ->> 'hora', '') !~ '^\d{2}:\d{2}$' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'hora'); end if;
  begin
    v_dia := (p_dados ->> 'data')::date;
    v_hora := (p_dados ->> 'hora')::time;
    v_servico := nullif(p_dados ->> 'servico', '')::uuid;
    v_campanha := nullif(p_dados ->> 'campanha', '')::uuid;
  exception when others then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'formato');
  end;
  if v_dia is null or v_dia < v_hoje or v_dia > v_hoje + 460 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'data'); end if;

  if v_campanha is not null then
    select * into v_camp from public.campanhas c where c.id = v_campanha and c.conta_id = v_conta and c.ativa;
    if v_camp.id is null then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'campanha'); end if;
    if not (v_dia = any (v_camp.dias)) then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'data'); end if;
    if not (v_hora = any (v_camp.horarios)) then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'hora'); end if;
    v_servico := coalesce(v_camp.servico_id, v_servico);
  end if;
  if v_servico is not null then
    select * into v_ensaio from public.servicos s where s.id = v_servico and s.conta_id = v_conta and s.ativo
      and (s.na_agenda_online or s.id = v_camp.servico_id);
    if v_ensaio.id is null then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'servico'); end if;
  end if;
  if v_camp.id is null and not exists (
    select 1 from public.horarios h where h.conta_id = v_conta and h.dia_semana = extract(dow from v_dia) and h.inicio = v_hora
      and h.servico_id is not distinct from (
        case when exists (select 1 from public.horarios x where x.conta_id = v_conta and x.servico_id = v_servico) then v_servico end)) then
    return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'hora');
  end if;
  v_duracao := coalesce(v_ensaio.duracao_min, 60);

  -- limites: por endereço (5 por hora), pelo mesmo WhatsApp (3 por dia) e da conta toda (20 por hora)
  delete from public.publico_tentativas where criado_em < now() - interval '1 day';
  if (select count(*) from public.publico_tentativas where conta_id = v_conta and endereco = v_endereco and criado_em > now() - interval '1 hour') >= 5
     or (select count(*) from public.pedidos p join public.clientes c on c.id = p.cliente_id
         where p.conta_id = v_conta and p.origem = 'agenda_online' and c.whatsapp = v_zap and p.criado_em > now() - interval '1 day') >= 3
     or (select count(*) from public.pedidos where conta_id = v_conta and origem = 'agenda_online' and criado_em > now() - interval '1 hour') >= 20 then
    return jsonb_build_object('ok', false, 'erro', 'limite');
  end if;

  -- o horário: uma pessoa por vez em cada dia da conta (e em cada campanha, pelas vagas)
  perform pg_advisory_xact_lock(hashtextextended(v_conta::text || v_dia::text, 0));
  if v_camp.id is not null then
    perform pg_advisory_xact_lock(hashtextextended(v_conta::text || v_camp.id::text, 0));
    if public.campanha_restam(v_conta, v_camp.id) <= 0 then return jsonb_build_object('ok', false, 'erro', 'ocupada'); end if;
  end if;
  v_comeca := (v_dia + v_hora) at time zone v_fuso;
  v_termina := v_comeca + make_interval(mins => v_duracao);
  if v_comeca <= now() or not public.periodo_livre(v_conta, v_comeca, v_termina) then
    return jsonb_build_object('ok', false, 'erro', 'ocupada');
  end if;

  -- o cliente (pelo WhatsApp: se já existe, é o mesmo; o nome que está no painel fica)
  insert into public.clientes (conta_id, nome, whatsapp, email, origem)
  values (v_conta, v_nome, v_zap, v_email, 'agenda_online')
  on conflict (conta_id, whatsapp) do update set email = coalesce(public.clientes.email, excluded.email)
  returning id into v_cliente;

  v_texto := 'Pré-reserva pela agenda online: ' || coalesce(v_camp.nome, v_ensaio.nome, 'ensaio') || ', às ' || to_char(v_hora, 'HH24:MI') || '.'
    || case when v_msg <> '' then ' “' || v_msg || '”' else '' end;

  insert into public.pedidos (conta_id, cliente_id, data_desejada, hora_desejada, servico_id, mensagem, origem)
  values (v_conta, v_cliente, v_dia, v_hora, v_ensaio.id, left(v_texto, 2000), 'agenda_online')
  returning id into v_pedido;
  insert into public.reservas (conta_id, cliente_id, pedido_id, servico_id, campanha_id, inicio, fim, situacao)
  values (v_conta, v_cliente, v_pedido, v_ensaio.id, v_camp.id, v_comeca, v_termina, 'pre_reserva')
  returning id into v_reserva;
  update public.pedidos set reserva_id = v_reserva where id = v_pedido;
  insert into public.publico_tentativas (conta_id, endereco) values (v_conta, v_endereco);

  return jsonb_build_object('ok', true, 'pedido', v_pedido, 'separada_ate', now() + interval '48 hours');
end $$;
comment on function public.publico_pedido_horario(text, jsonb, text, text) is 'Agenda online da fotografia (pública): o pedido por horário (ensaio ou campanha) com a pré-reserva de 48 horas. Acha ou cria o cliente pelo WhatsApp. Devolve só ok, o id do pedido (para o aviso) e até quando o horário fica separado.';

revoke execute on function public.publico_horarios(text, date, date, uuid, uuid), public.publico_pedido_horario(text, jsonb, text, text) from public;
grant execute on function public.publico_horarios(text, date, date, uuid, uuid), public.publico_pedido_horario(text, jsonb, text, text) to anon, authenticated;
