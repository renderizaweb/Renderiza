-- Fechar só um horário (a Agenda da fotografia, 17/11/2026, pedido da Renderiza): a folga (bloqueios) ganha início e
-- fim opcionais. Sem horário, fecha o dia inteiro (como sempre); com horário, fecha só aquele pedaço de cada dia entre
-- de e ate. O periodo_livre (que a agenda online e o site usam) passa a respeitar o pedaço fechado.

alter table public.bloqueios
  add column inicio time,
  add column fim time,
  add constraint bloqueios_horario check ((inicio is null) = (fim is null) and (inicio is null or fim > inicio));
comment on column public.bloqueios.inicio is 'Com fim: fecha só esse pedaço de cada dia (um horário). Sem: o dia inteiro.';

create or replace function public.periodo_livre(conta uuid, comeca timestamptz, termina timestamptz) returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.reservas r
    where r.conta_id = conta and r.inicio < termina and r.fim > comeca and public.reserva_segura_data(r)
  )
  and not exists (
    select 1 from public.bloqueios b, public.contas c
    where b.conta_id = conta and c.id = conta
      and (comeca at time zone c.fuso)::date between b.de and b.ate
      and (b.inicio is null or ((comeca at time zone c.fuso)::time < b.fim and (termina at time zone c.fuso)::time > b.inicio))
  )
$$;
