-- Fotos do Estoque em JPEG quando o aparelho não gera WebP (28/11/2026). No iPhone, o Safari (e todo navegador do iPhone,
-- que usa o mesmo motor) não converte para WebP: o painel recusava a foto. Agora ele tenta WebP e, sem, usa JPEG.
-- Só alarga as regras: o Storage "site-imagens" aceita também image/jpeg e a foto do Estoque pode terminar em .jpg.
-- Nada que já existe muda. O painel (estoque/loja.js) e as rotas públicas (estoque e imagens) acompanham.

update storage.buckets set allowed_mime_types = array['image/webp', 'image/jpeg'] where id = 'site-imagens';

create or replace function public.estoque_itens_antes() returns trigger language plpgsql set search_path = '' as $$
declare
  f jsonb;
  pasta text := new.conta_id::text || '/estoque-';
begin
  if exists (select 1 from unnest(new.selos) s where length(btrim(s)) not between 1 and 30) then
    raise exception 'Selo vazio ou com mais de 30 letras.' using errcode = '23514';
  end if;
  for f in select * from jsonb_array_elements(new.fotos) loop
    if jsonb_typeof(f) <> 'object'
       or not (f ->> 'arquivo') ~ '^[0-9a-f-]{36}/estoque-[A-Za-z0-9_-]{6,80}\.(webp|jpg)$'
       or left(f ->> 'arquivo', length(pasta)) <> pasta
       or (f ? 'mini' and not ((f ->> 'mini') ~ '^[0-9a-f-]{36}/estoque-[A-Za-z0-9_-]{6,80}\.(webp|jpg)$' and left(f ->> 'mini', length(pasta)) = pasta))
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
