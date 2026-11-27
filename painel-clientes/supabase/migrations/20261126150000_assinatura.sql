-- A assinatura do painel (26/11/2026; docs/painel-clientes/13-assinatura.md): o que foi combinado com cada conta
-- (o valor, o dia do vencimento e a primeira mensalidade), que só a Renderiza muda no Admin, e o que o dono vê em
-- "Assinatura": o combinado e os pagamentos que a Renderiza registrou (sem a observação, que é interna). A mensalidade
-- continua por Pix, por fora, registrada à mão (02); nada aqui cobra.

create table public.assinaturas (
  conta_id uuid primary key references public.contas(id) on delete cascade,
  valor numeric(10, 2) check (valor is null or (valor >= 0 and valor <= 100000)), -- null: o do plano (R$ 49 com 2 módulos; 02)
  dia smallint check (dia is null or dia between 1 and 28),                        -- null: o dia da primeira mensalidade
  inicio date,                                                                     -- a primeira mensalidade; null: a combinar
  atualizado_em timestamptz not null default now()
);
comment on table public.assinaturas is 'O combinado da mensalidade de cada conta (13): valor (null = o do plano), dia do vencimento e a primeira mensalidade. Só a Renderiza muda; o dono lê por minha_assinatura.';
create trigger assinaturas_atualizado before update on public.assinaturas for each row execute function public.marcar_atualizado();

alter table public.assinaturas enable row level security;
create policy "assinaturas: a Renderiza" on public.assinaturas for all to authenticated
  using (public.eh_equipe_renderiza()) with check (public.eh_equipe_renderiza());
revoke all on public.assinaturas from anon;

-- O que o dono vê (e a Renderiza no suporte): o combinado e os pagamentos, sem a observação. Vale também com a conta
-- desligada (é quando mais precisa saber o que falta), por isso não passa por pode(), que exige a conta ativa.
create function public.minha_assinatura(p_conta uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'valor', a.valor,
    'dia', a.dia,
    'inicio', a.inicio,
    'pagamentos', coalesce((
      select jsonb_agg(jsonb_build_object('mes', p.mes, 'valor', p.valor, 'pago_em', p.pago_em) order by p.mes desc, p.pago_em desc)
      from public.pagamentos p where p.conta_id = p_conta), '[]'::jsonb)
  )
  from (select 1) as um
  left join public.assinaturas a on a.conta_id = p_conta
  where public.eh_equipe_renderiza()
     or public.em_suporte(p_conta, 'ver')
     or exists (select 1 from public.pessoas p where p.conta_id = p_conta and p.usuario_id = (select auth.uid()) and p.ativa and p.dono)
$$;
comment on function public.minha_assinatura(uuid) is 'A tela Assinatura (13): o combinado da mensalidade e os pagamentos registrados (mês, valor, quando entrou). Só o dono, o suporte e a Renderiza.';
revoke execute on function public.minha_assinatura(uuid) from public, anon;
grant execute on function public.minha_assinatura(uuid) to authenticated;
