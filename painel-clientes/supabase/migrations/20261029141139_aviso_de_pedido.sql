-- Missão 4 · bloco A: o aviso por e-mail de pedido novo da agenda online (D15: "por e-mail e no menu do painel").
-- Quem manda o e-mail é a função do Supabase avisar-pedido (supabase/functions/avisar-pedido/), com a chave secreta
-- no ambiente dela. Esta função do banco dá o que ela precisa, uma vez só por pedido: só pedido da agenda online,
-- criado há menos de 15 minutos e ainda não avisado. Assim ninguém faz o painel mandar o mesmo e-mail de novo.

create table public.pedidos_avisos (
  pedido_id uuid primary key references public.pedidos (id) on delete cascade,
  conta_id uuid not null references public.contas (id) on delete cascade,
  avisado_em timestamptz not null default now()
);
comment on table public.pedidos_avisos is 'Pedidos da agenda online já avisados por e-mail ao dono (um aviso por pedido). Só a função aviso_do_pedido grava.';
alter table public.pedidos_avisos enable row level security;
revoke all on public.pedidos_avisos from anon, authenticated;

-- Marca o pedido como avisado e devolve o que vai no e-mail: para quem (os donos ativos com e-mail), a conta, o
-- cliente, a data e o resto do pedido. null: não é da agenda online, passou de 15 minutos ou já foi avisado.
create function public.aviso_do_pedido(p_pedido uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_conta uuid;
begin
  insert into public.pedidos_avisos (pedido_id, conta_id)
  select p.id, p.conta_id from public.pedidos p
  where p.id = p_pedido and p.origem = 'agenda_online' and p.criado_em > now() - interval '15 minutes'
  on conflict (pedido_id) do nothing
  returning conta_id into v_conta;
  if v_conta is null then return null; end if;

  return (
    select jsonb_build_object(
      'conta', c.nome,
      'nicho', c.nicho,
      'para', coalesce((select jsonb_agg(distinct pe.email) from public.pessoas pe where pe.conta_id = c.id and pe.dono and pe.ativa and pe.email is not null), '[]'),
      'cliente', jsonb_build_object('nome', cl.nome, 'whatsapp', cl.whatsapp, 'email', cl.email),
      'data', p.data_desejada,
      'inicio', to_char(r.inicio at time zone c.fuso, 'HH24:MI'),
      'fim', to_char(r.fim at time zone c.fuso, 'HH24:MI'),
      'tipo', t.nome,
      'pacote', s.nome,
      'convidados', p.convidados,
      'mensagem', p.mensagem
    )
    from public.pedidos p
    join public.contas c on c.id = p.conta_id
    join public.clientes cl on cl.id = p.cliente_id
    left join public.reservas r on r.id = p.reserva_id
    left join public.tipos_reserva t on t.id = p.tipo_id
    left join public.servicos s on s.id = p.servico_id
    where p.id = p_pedido
  );
end $$;
comment on function public.aviso_do_pedido(uuid) is 'Para a função avisar-pedido (chave secreta): o que vai no e-mail de pedido novo da agenda online, uma vez só por pedido.';

revoke execute on function public.aviso_do_pedido(uuid) from public, anon, authenticated;
grant execute on function public.aviso_do_pedido(uuid) to service_role;
