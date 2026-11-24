-- Módulo Estoque e o nicho automotivo (docs/painel-clientes/12-modulo-estoque.md, "Contrato v1"; trilho
-- docs/entregas/ricardo-motors.md, 1A). O primeiro cliente é uma revenda de carros (Ricardo Motors).
-- - estoque_itens: o que a conta vende no site (um carro; depois, uma armação). Os campos do nicho ficam em `campos`
--   (o painel valida pelo esquema do nicho, src/modulos/estoque/esquemas.js); o banco confere formato e tamanho.
-- - o catálogo ganha o módulo `estoque` e os nichos aceitam `automotivo`. O único "drop" desta migração é o da regra
--   de nicho, trocada por uma mais larga (nenhum dado muda).
-- - fotos no bucket público site-imagens (o mesmo do Meu site e da rota /api/publico/imagens), com o nome
--   <conta>/estoque-<sorteio>.webp e a pequena <conta>/estoque-<sorteio>-m.webp; quem edita o Estoque envia e tira.
-- - publico_estoque(código do site): o que o site mostra (só disponível e reservado), pela API pública.

-- ---------- o nicho automotivo e o módulo ----------

alter table public.contas drop constraint contas_nicho_check,
  add constraint contas_nicho_check check (nicho in ('eventos', 'fotografia', 'automotivo'));
alter table public.demos drop constraint demos_nicho_check,
  add constraint demos_nicho_check check (nicho in ('eventos', 'fotografia', 'automotivo'));

insert into public.modulos (id, nome, preco, ordem) values ('estoque', 'Estoque', 14.99, 8) on conflict (id) do nothing;

-- ---------- estoque_itens ----------

create table public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  esquema text not null check (esquema ~ '^[a-z][a-z-]{1,30}$'),
  situacao text not null default 'disponivel' check (situacao in ('disponivel', 'reservado', 'vendido', 'oculto')),
  destaque boolean not null default false,
  ordem integer not null default 0 check (ordem between -100000 and 100000),
  preco numeric(12, 2) check (preco >= 0),
  preco_antes numeric(12, 2) check (preco_antes >= 0),
  quantidade integer not null default 1 check (quantidade between 0 and 100000),
  campos jsonb not null default '{}' check (jsonb_typeof(campos) = 'object' and octet_length(campos::text) <= 20000),
  selos text[] not null default '{}' check (cardinality(selos) <= 8),
  descricao text not null default '' check (length(descricao) <= 4000),
  fotos jsonb not null default '[]' check (jsonb_typeof(fotos) = 'array' and jsonb_array_length(fotos) <= 15),
  codigo_interno text check (length(codigo_interno) <= 40),
  vendido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id)
);
comment on table public.estoque_itens is 'O Estoque (12): o que a conta vende no site. campos: os do nicho (esquema). fotos: [{arquivo, mini, w, h}] no bucket site-imagens; a primeira é a capa. Só disponível e reservado saem na API pública (publico_estoque); codigo_interno nunca sai.';
create index estoque_itens_conta_situacao on public.estoque_itens (conta_id, situacao);

-- O que a regra de coluna não alcança: cada selo e cada foto no formato, a foto da própria conta, o vendido_em.
create function public.estoque_itens_antes() returns trigger language plpgsql set search_path = '' as $$
declare
  f jsonb;
  pasta text := new.conta_id::text || '/estoque-';
begin
  if exists (select 1 from unnest(new.selos) s where length(btrim(s)) not between 1 and 30) then
    raise exception 'Selo vazio ou com mais de 30 letras.' using errcode = '23514';
  end if;
  for f in select * from jsonb_array_elements(new.fotos) loop
    if jsonb_typeof(f) <> 'object'
       or not (f ->> 'arquivo') ~ '^[0-9a-f-]{36}/estoque-[A-Za-z0-9_-]{6,80}\.webp$'
       or left(f ->> 'arquivo', length(pasta)) <> pasta
       or (f ? 'mini' and not ((f ->> 'mini') ~ '^[0-9a-f-]{36}/estoque-[A-Za-z0-9_-]{6,80}\.webp$' and left(f ->> 'mini', length(pasta)) = pasta))
       or not coalesce((f ->> 'w') ~ '^\d{1,5}$' and (f ->> 'h') ~ '^\d{1,5}$', false) then
      raise exception 'Foto fora do formato do Estoque.' using errcode = '23514';
    end if;
  end loop;
  if new.situacao = 'vendido' and (tg_op = 'INSERT' or old.situacao <> 'vendido') then
    new.vendido_em := now();
  elsif new.situacao <> 'vendido' then
    new.vendido_em := null;
  end if;
  return new;
end $$;
create trigger estoque_itens_antes before insert or update on public.estoque_itens for each row execute function public.estoque_itens_antes();
create trigger estoque_itens_atualizado before update on public.estoque_itens for each row execute function public.marcar_atualizado();

alter table public.estoque_itens enable row level security;
create policy "estoque_itens: quem vê o Estoque" on public.estoque_itens for select to authenticated
  using (public.pode(conta_id, 'estoque', 'ver'));
create policy "estoque_itens: quem edita cria" on public.estoque_itens for insert to authenticated
  with check (public.pode(conta_id, 'estoque', 'editar'));
create policy "estoque_itens: quem edita muda" on public.estoque_itens for update to authenticated
  using (public.pode(conta_id, 'estoque', 'editar')) with check (public.pode(conta_id, 'estoque', 'editar'));
create policy "estoque_itens: quem edita apaga" on public.estoque_itens for delete to authenticated
  using (public.pode(conta_id, 'estoque', 'editar'));
revoke all on public.estoque_itens from anon;
grant select, insert, update, delete on public.estoque_itens to authenticated;

-- ---------- as fotos (bucket site-imagens) ----------

create policy "site-imagens: Estoque envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-imagens' and storage.filename(name) like 'estoque-%'
    and public.pode(public.conta_da_pasta(name), 'estoque', 'editar'));
create policy "site-imagens: Estoque troca" on storage.objects for update to authenticated
  using (bucket_id = 'site-imagens' and storage.filename(name) like 'estoque-%' and public.pode(public.conta_da_pasta(name), 'estoque', 'editar'))
  with check (bucket_id = 'site-imagens' and storage.filename(name) like 'estoque-%' and public.pode(public.conta_da_pasta(name), 'estoque', 'editar'));
create policy "site-imagens: Estoque tira" on storage.objects for delete to authenticated
  using (bucket_id = 'site-imagens' and storage.filename(name) like 'estoque-%' and public.pode(public.conta_da_pasta(name), 'estoque', 'editar'));
create policy "site-imagens: quem vê o Estoque lê" on storage.objects for select to authenticated
  using (bucket_id = 'site-imagens' and storage.filename(name) like 'estoque-%' and public.pode(public.conta_da_pasta(name), 'estoque', 'ver'));

-- ---------- publico_estoque ----------

-- O que o site mostra (Contrato v1, item 2): só disponível e reservado, destaque primeiro, depois a ordem e o mais
-- novo; até 300. Nunca o código interno, o vendido nem o oculto. null quando o site não responde (desconectado, conta
-- não liberada, módulo desligado): a API devolve 404 e o site fica com a versão de reserva (sem preço).
create function public.publico_estoque(p_codigo text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'estoque');
begin
  if v_conta is null then return null; end if;
  return (
    select jsonb_build_object(
      'versao', 1,
      'esquema', (select c.nicho from public.contas c where c.id = v_conta),
      'atualizado_em', max(i.atualizado_em),
      'itens', coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'situacao', i.situacao, 'destaque', i.destaque, 'preco', i.preco, 'preco_antes', i.preco_antes,
        'quantidade', i.quantidade, 'selos', to_jsonb(i.selos), 'descricao', i.descricao, 'campos', i.campos, 'fotos', i.fotos
      ) order by i.destaque desc, i.ordem, i.criado_em desc), '[]'::jsonb))
    from (
      select * from public.estoque_itens e
      where e.conta_id = v_conta and e.situacao in ('disponivel', 'reservado')
      order by e.destaque desc, e.ordem, e.criado_em desc
      limit 300
    ) i
  );
end $$;
comment on function public.publico_estoque(text) is 'O estoque que o site mostra (12, Contrato v1): só disponível e reservado. Só a API do painel chama.';

revoke execute on function public.estoque_itens_antes(), public.publico_estoque(text) from public, anon;
grant execute on function public.estoque_itens_antes() to authenticated, service_role;
grant execute on function public.publico_estoque(text) to anon, authenticated;
