-- Missão 2 · bloco A (a pedido do bloco B e da 4C): o Storage só troca (envio com "upsert") e só apaga o arquivo
-- que a pessoa também pode LER pela API. Sem política de leitura, o logo das Configurações dava 403 já no primeiro
-- envio (conferido no STG) e "tirar" não funcionava. Os buckets logos e site-imagens já são públicos (o link abre
-- sem login): ler pela API, só quem é da conta, não abre nada novo. O bucket privado continua sem política.

create policy "logos: quem é da conta lê" on storage.objects for select to authenticated
  using (bucket_id = 'logos' and public.pode(public.conta_da_pasta(name), 'inicio', 'ver'));
create policy "site-imagens: quem vê o Meu site lê" on storage.objects for select to authenticated
  using (bucket_id = 'site-imagens' and public.pode(public.conta_da_pasta(name), 'meu-site', 'ver'));
