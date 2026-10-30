-- Missão 7, bloco G (D47): o acompanhamento até a confiança. Cada passo do onboarding fica registrado (o link aberto,
-- a conversa de boas-vindas começada, cada pergunta respondida, terminada ou adiada) e o Admin vê, por conta criada
-- pela Renderiza, em que etapa ela está, quem travou e onde, e os marcos da primeira semana: primeiro pedido,
-- primeira reserva, contrato mandado, equipe convidada, agenda online ligada e uso em 3 dias diferentes (pelo
-- histórico do que a equipe fez; os registros de acesso, guardados por obrigação legal, não entram aqui).

create table public.onboarding_eventos (
  id bigint generated always as identity primary key,
  conta_id uuid not null references public.contas (id) on delete cascade,
  evento text not null check (evento in ('link_aberto', 'conversa_comecou', 'pergunta', 'conversa_terminou', 'conversa_adiada')),
  detalhe text check (detalhe ~ '^[a-z_]{2,30}$'),
  criado_em timestamptz not null default now()
);
comment on table public.onboarding_eventos is 'Os passos do onboarding de cada conta (D47): o link aberto (pela tela de boas-vindas), a conversa começada, cada pergunta (o assunto, sem a resposta), terminada ou adiada. Só a Renderiza vê.';
create index onboarding_eventos_conta on public.onboarding_eventos (conta_id, criado_em);

alter table public.onboarding_eventos enable row level security;
create policy "onboarding_eventos: a Renderiza vê" on public.onboarding_eventos for select to authenticated using (public.eh_equipe_renderiza());
-- o dono registra os passos da conversa da própria conta (o link aberto vem pela função pública)
create policy "onboarding_eventos: o dono registra a conversa" on public.onboarding_eventos for insert to authenticated
  with check (public.pode(conta_id, 'configuracoes', 'editar') and evento <> 'link_aberto');
revoke all on public.onboarding_eventos from anon;
grant select, insert on public.onboarding_eventos to authenticated;

-- A tela de boas-vindas (visitante) avisa que o link foi aberto: uma vez a cada 10 minutos por conta, só se o link vale.
create function public.publico_convite_aberto(p_codigo text) returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  v_conta uuid;
begin
  if p_codigo is null or p_codigo !~ '^[a-z0-9]{24,64}$' then return; end if;
  select conta_id into v_conta from public.convites
    where link_codigo = p_codigo and link_usado_em is null and cancelado_em is null and aceito_em is null and expira_em > now();
  if v_conta is null then return; end if;
  if exists (select 1 from public.onboarding_eventos where conta_id = v_conta and evento = 'link_aberto' and criado_em > now() - interval '10 minutes') then return; end if;
  insert into public.onboarding_eventos (conta_id, evento) values (v_conta, 'link_aberto');
end $$;
comment on function public.publico_convite_aberto(text) is 'Boas-vindas (D47): registra que o link do convite foi aberto (no máximo uma vez a cada 10 minutos por conta).';
revoke execute on function public.publico_convite_aberto(text) from public;
grant execute on function public.publico_convite_aberto(text) to anon, authenticated;

-- O Admin: as contas criadas pela Renderiza nos últimos 60 dias, com as etapas e os marcos.
create function public.admin_onboarding() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.eh_equipe_renderiza() then
    raise exception 'Só a equipe Renderiza.' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(linha order by (linha ->> 'criado_em') desc) from (
    select jsonb_build_object(
      'conta_id', c.id, 'nome', c.nome, 'nicho', c.nicho, 'whatsapp', c.whatsapp, 'criado_em', c.criado_em, 'situacao', c.situacao,
      'dono', coalesce((select p.nome from public.pessoas p where p.conta_id = c.id and p.dono and p.ativa order by p.criado_em limit 1),
                       (select v.nome from public.convites v where v.conta_id = c.id and v.dono order by v.criado_em limit 1)),
      'convite_em', (select min(v.criado_em) from public.convites v where v.conta_id = c.id and v.dono),
      'link_aberto_em', (select min(e.criado_em) from public.onboarding_eventos e where e.conta_id = c.id and e.evento = 'link_aberto'),
      'senha_em', (select min(coalesce(v.link_usado_em, v.aceito_em)) from public.convites v where v.conta_id = c.id and v.dono),
      'conversa_comecou_em', (select min(e.criado_em) from public.onboarding_eventos e where e.conta_id = c.id and e.evento = 'conversa_comecou'),
      'respondidas', (select count(distinct e.detalhe) from public.onboarding_eventos e where e.conta_id = c.id and e.evento = 'pergunta'),
      'ultima_pergunta', (select e.detalhe from public.onboarding_eventos e where e.conta_id = c.id and e.evento = 'pergunta' order by e.id desc limit 1),
      'conversa_terminou_em', (select min(e.criado_em) from public.onboarding_eventos e where e.conta_id = c.id and e.evento = 'conversa_terminou'),
      'conversa_adiada_em', (select max(e.criado_em) from public.onboarding_eventos e where e.conta_id = c.id and e.evento = 'conversa_adiada'),
      'ultimo_passo_em', (select max(e.criado_em) from public.onboarding_eventos e where e.conta_id = c.id),
      'perfil', c.ajustes -> 'onboarding' -> 'perfil',
      'marcos', jsonb_build_object(
        'pedido', exists (select 1 from public.pedidos x where x.conta_id = c.id),
        'reserva', exists (select 1 from public.reservas x where x.conta_id = c.id),
        'contrato', exists (select 1 from public.contratos x where x.conta_id = c.id and x.situacao in ('enviado', 'aceito')),
        'equipe', (select count(*) from public.pessoas p where p.conta_id = c.id and p.ativa) > 1
                  or exists (select 1 from public.convites v where v.conta_id = c.id and not v.dono and v.cancelado_em is null),
        'agenda_online', exists (select 1 from public.contas_modulos m where m.conta_id = c.id and m.modulo_id = 'agenda-online' and m.ligado),
        'dias_de_uso', (select count(distinct (a.quando at time zone 'America/Sao_Paulo')::date) from public.atividades a where a.conta_id = c.id and not a.pelo_suporte)
      )
    ) as linha
    from public.contas c
    where c.origem = 'renderiza' and c.criado_em > now() - interval '60 days'
  ) t), '[]'::jsonb);
end $$;
comment on function public.admin_onboarding() is 'Admin · Onboarding (D47): as contas criadas pela Renderiza nos últimos 60 dias, a etapa de cada uma e os marcos da primeira semana. Sem dado dos clientes dos clientes.';
revoke execute on function public.admin_onboarding() from public, anon;
grant execute on function public.admin_onboarding() to authenticated;
