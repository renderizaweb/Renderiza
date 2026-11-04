-- Missão 7, bloco F (D44, D48, D49, D53): "trazer o que tem". A pessoa manda fotos, PDFs, prints, planilhas e
-- documentos; a IA lê (a função assistente) e propõe pacotes, datas, clientes e o modelo de contrato; a pessoa confere e
-- grava pelo próprio login (as regras de cada tabela valem). Aqui:
-- - o bucket privado "importacoes": cada arquivo mora em importacoes/<id da conta>/<lote>/<nome> só enquanto é lido
--   (a função apaga logo depois de ler, D49); os de "pedir à Renderiza" ficam até a Renderiza atender (no máximo
--   7 dias, a função apaga os vencidos). Só o dono (ou a Renderiza no suporte) manda, vê e tira;
-- - pedidos_a_renderiza: "prefiro que a Renderiza monte" (D48), com a pasta dos arquivos e o recado;
-- - importacoes: o que cada gravação trouxe (só os números), para o Admin e os primeiros passos;
-- - admin_onboarding ganha o que a conta trouxe e o pedido à Renderiza que espera.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('importacoes', 'importacoes', false, 52428800, array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword',
    'application/vnd.oasis.opendocument.text', 'application/rtf', 'text/rtf', 'text/plain',
    -- planilhas, contatos e agenda: o painel lê no aparelho; sobem só no "pedir à Renderiza"
    'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet', 'text/vcard', 'text/x-vcard', 'text/calendar'])
on conflict (id) do nothing;

create policy "importacoes: o dono manda" on storage.objects for insert to authenticated
  with check (bucket_id = 'importacoes' and public.pode(public.conta_da_pasta(name), 'configuracoes', 'editar'));
create policy "importacoes: o dono vê" on storage.objects for select to authenticated
  using (bucket_id = 'importacoes' and public.pode(public.conta_da_pasta(name), 'configuracoes', 'editar'));
create policy "importacoes: o dono tira" on storage.objects for delete to authenticated
  using (bucket_id = 'importacoes' and public.pode(public.conta_da_pasta(name), 'configuracoes', 'editar'));

create table public.pedidos_a_renderiza (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  pasta text not null check (pasta ~ '^pedido-[a-z0-9]{8,24}$'),
  arquivos smallint not null check (arquivos between 1 and 200),
  recado text check (length(recado) <= 500),
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atendido_em timestamptz,
  atendido_por uuid references auth.users (id) on delete set null,
  unique (conta_id, pasta)
);
comment on table public.pedidos_a_renderiza is 'Trazer o que tem (Missão 7F, D48): a pessoa prefere que a Renderiza monte. Os arquivos ficam em importacoes/<conta>/<pasta>/ até a Renderiza atender (no máximo 7 dias).';
create index pedidos_a_renderiza_abertos on public.pedidos_a_renderiza (criado_em) where atendido_em is null;

alter table public.pedidos_a_renderiza enable row level security;
create policy "pedidos_a_renderiza: o dono e a Renderiza veem" on public.pedidos_a_renderiza for select to authenticated
  using (public.pode(conta_id, 'configuracoes', 'editar') or public.eh_equipe_renderiza());
create policy "pedidos_a_renderiza: o dono pede" on public.pedidos_a_renderiza for insert to authenticated
  with check (public.pode(conta_id, 'configuracoes', 'editar') and atendido_em is null and atendido_por is null);
create policy "pedidos_a_renderiza: atender" on public.pedidos_a_renderiza for update to authenticated
  using (public.pode(conta_id, 'configuracoes', 'editar') or public.eh_equipe_renderiza())
  with check (public.pode(conta_id, 'configuracoes', 'editar') or public.eh_equipe_renderiza());
revoke all on public.pedidos_a_renderiza from anon;
grant select, insert, update on public.pedidos_a_renderiza to authenticated;

create table public.importacoes (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  arquivos smallint not null default 0 check (arquivos between 0 and 500),
  pacotes smallint not null default 0 check (pacotes between 0 and 500),
  adicionais smallint not null default 0 check (adicionais between 0 and 500),
  datas integer not null default 0 check (datas between 0 and 5000),
  clientes integer not null default 0 check (clientes between 0 and 20000),
  modelos smallint not null default 0 check (modelos between 0 and 50),
  pela_renderiza boolean not null default false,
  desfeita_em timestamptz,
  criado_por uuid default auth.uid() references auth.users (id) on delete set null,
  criado_em timestamptz not null default now()
);
comment on table public.importacoes is 'Trazer o que tem (Missão 7F): o que cada gravação trouxe, só as contagens (o dado em si vai para as tabelas de sempre). desfeita_em: a pessoa tocou em "Desfazer".';
create index importacoes_conta on public.importacoes (conta_id, criado_em);

alter table public.importacoes enable row level security;
create policy "importacoes: o dono e a Renderiza veem" on public.importacoes for select to authenticated
  using (public.pode(conta_id, 'configuracoes', 'editar') or public.eh_equipe_renderiza());
create policy "importacoes: quem trouxe registra" on public.importacoes for insert to authenticated
  with check (public.pode(conta_id, 'configuracoes', 'editar') and desfeita_em is null);
create policy "importacoes: desfazer" on public.importacoes for update to authenticated
  using (public.pode(conta_id, 'configuracoes', 'editar')) with check (public.pode(conta_id, 'configuracoes', 'editar'));
revoke all on public.importacoes from anon;
grant select, insert, update on public.importacoes to authenticated;

-- O Admin · Onboarding: igual ao de 20261030270000, mais o que a conta trouxe e o pedido à Renderiza que espera.
create or replace function public.admin_onboarding() returns jsonb language plpgsql stable security definer set search_path = '' as $$
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
      'ultimo_passo_em', greatest(
        (select max(e.criado_em) from public.onboarding_eventos e where e.conta_id = c.id),
        (select max(i.criado_em) from public.importacoes i where i.conta_id = c.id)),
      'perfil', c.ajustes -> 'onboarding' -> 'perfil',
      'trouxe', (select jsonb_build_object('em', max(i.criado_em), 'arquivos', sum(i.arquivos), 'pacotes', sum(i.pacotes) + sum(i.adicionais),
                  'datas', sum(i.datas), 'clientes', sum(i.clientes), 'modelos', sum(i.modelos))
                 from public.importacoes i where i.conta_id = c.id and i.desfeita_em is null having count(*) > 0),
      'pedido_renderiza', (select jsonb_build_object('em', r.criado_em, 'arquivos', r.arquivos, 'recado', r.recado)
                 from public.pedidos_a_renderiza r where r.conta_id = c.id and r.atendido_em is null order by r.criado_em desc limit 1),
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
comment on function public.admin_onboarding() is 'Admin · Onboarding (D47): as contas criadas pela Renderiza nos últimos 60 dias, a etapa de cada uma, os marcos da primeira semana, o que trouxe (Missão 7F) e o pedido à Renderiza que espera. Sem dado dos clientes.';

-- Os pedidos à Renderiza abertos, de todas as contas (o Admin mostra no topo do Onboarding).
create function public.admin_pedidos_a_renderiza() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.eh_equipe_renderiza() then
    raise exception 'Só a equipe Renderiza.' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'conta_id', r.conta_id, 'conta', c.nome, 'nicho', c.nicho,
      'whatsapp', c.whatsapp, 'arquivos', r.arquivos, 'recado', r.recado, 'criado_em', r.criado_em) order by r.criado_em)
    from public.pedidos_a_renderiza r join public.contas c on c.id = r.conta_id
    where r.atendido_em is null and r.criado_em > now() - interval '7 days'), '[]'::jsonb);
end $$;
comment on function public.admin_pedidos_a_renderiza() is 'Admin (Missão 7F, D48): os pedidos "a Renderiza monta" abertos nos últimos 7 dias, com a conta e o recado.';
revoke execute on function public.admin_pedidos_a_renderiza() from public, anon;
grant execute on function public.admin_pedidos_a_renderiza() to authenticated;
