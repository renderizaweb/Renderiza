-- Missão 3 · bloco C (Atendimento): "Fechar" um pedido que já tem reserva (a pré-reserva que a agenda online cria,
-- 4A) passa a valer o que a pessoa escolheu na tela: a reserva fica confirmada (ou continua pré-reserva) e, se
-- vierem, a data e o horário novos. Antes, o fechar_pedido só ligava o pedido à reserva e ela ficava como estava
-- (a pré-reserva vencia em 48 horas e a data voltava a aparecer livre no site). Reserva cancelada ou realizada não
-- muda. Quem pode fechar continua sendo quem edita o Atendimento.

create or replace function public.fechar_pedido(pedido uuid, inicio timestamptz default null, fim timestamptz default null, situacao text default 'pre_reserva')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  p public.pedidos;
  nova uuid;
begin
  select * into p from public.pedidos where id = fechar_pedido.pedido for update;
  if p.id is null or not public.pode(p.conta_id, 'atendimento', 'editar') then
    raise exception 'Pedido não encontrado.' using errcode = '42501';
  end if;
  if fechar_pedido.situacao not in ('pre_reserva', 'confirmada') then
    raise exception 'A reserva nasce como pré-reserva ou confirmada.' using errcode = '22023';
  end if;
  if (fechar_pedido.inicio is null) <> (fechar_pedido.fim is null) then
    raise exception 'Diga a data e o horário da reserva.' using errcode = '22023';
  end if;
  if p.reserva_id is null then
    if fechar_pedido.inicio is null then
      raise exception 'Diga a data e o horário da reserva.' using errcode = '22023';
    end if;
    insert into public.reservas (conta_id, cliente_id, pedido_id, servico_id, tipo_id, inicio, fim, convidados, situacao, responsavel_id)
    values (p.conta_id, p.cliente_id, p.id, p.servico_id, p.tipo_id, fechar_pedido.inicio, fechar_pedido.fim, p.convidados, fechar_pedido.situacao, p.responsavel_id)
    returning id into nova;
  else
    nova := p.reserva_id;
    update public.reservas r
    set inicio = coalesce(fechar_pedido.inicio, r.inicio),
        fim = coalesce(fechar_pedido.fim, r.fim),
        situacao = case when r.situacao = 'pre_reserva' then fechar_pedido.situacao else r.situacao end
    where r.id = nova and r.situacao in ('pre_reserva', 'confirmada');
  end if;
  update public.pedidos set etapa = 'fechado', reserva_id = nova where id = p.id;
  return nova;
end $$;
comment on function public.fechar_pedido(uuid, timestamptz, timestamptz, text) is 'Atendimento: "Fechar" vira reserva (nova, ou a que o pedido já tem: confirma a pré-reserva e ajusta a data). Pede Atendimento (editar).';
