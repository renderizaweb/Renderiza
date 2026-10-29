-- Missão 2 · bloco A · 4 de 4: os arquivos (Storage do Supabase; 04). Cada arquivo mora na pasta da conta:
-- <bucket>/<id da conta>/<nome>. Imagens públicas (logo e as do Meu site), com tamanho e tipo limitados; o
-- envio passa pela regra da conta (pode). SVG fica de fora: pode levar código.

create function public.conta_da_pasta(caminho text) returns uuid language sql immutable set search_path = '' as $$
  select case when p ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p::uuid end
  from (select split_part(coalesce(caminho, ''), '/', 1) as p) as x
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('logos', 'logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp']),
  ('site-imagens', 'site-imagens', true, 2097152, array['image/webp']),
  ('privado', 'privado', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "logos: o dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.pode(public.conta_da_pasta(name), 'configuracoes', 'editar'));
create policy "logos: o dono troca" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.pode(public.conta_da_pasta(name), 'configuracoes', 'editar'))
  with check (bucket_id = 'logos' and public.pode(public.conta_da_pasta(name), 'configuracoes', 'editar'));
create policy "logos: o dono tira" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.pode(public.conta_da_pasta(name), 'configuracoes', 'editar'));

create policy "site-imagens: Meu site envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-imagens' and public.pode(public.conta_da_pasta(name), 'meu-site', 'editar'));
create policy "site-imagens: Meu site troca" on storage.objects for update to authenticated
  using (bucket_id = 'site-imagens' and public.pode(public.conta_da_pasta(name), 'meu-site', 'editar'))
  with check (bucket_id = 'site-imagens' and public.pode(public.conta_da_pasta(name), 'meu-site', 'editar'));
create policy "site-imagens: Meu site tira" on storage.objects for delete to authenticated
  using (bucket_id = 'site-imagens' and public.pode(public.conta_da_pasta(name), 'meu-site', 'editar'));
-- O bucket "privado" não tem política ainda: ninguém lê nem grava pelo app até uma missão precisar.
