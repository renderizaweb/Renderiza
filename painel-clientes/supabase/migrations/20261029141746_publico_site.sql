-- Missão 4 · bloco C: o Meu site do lado do painel. As duas funções públicas que o script do site do cliente chama
-- pela API (painel-clientes/api/publico/site/), no formato do contrato v1 (docs/painel-clientes/03-modulo-meu-site.md,
-- "O que o painel entrega"):
-- - publico_site(código): a última versão publicada. Site desconectado, em versão final, conta não liberada ou módulo
--   Meu site desligado: null (a API responde 404 e o site volta à versão inicial). Nunca publicou: o conteúdo vazio
--   (a versão inicial).
-- - publico_previa(código, código da prévia): o rascunho da prévia, enquanto ela não expira.

create function public.versao_no_contrato(p_codigo text, v public.sites_versoes) returns jsonb language sql stable set search_path = '' as $$
  select coalesce(v.conteudo, '{}'::jsonb) - 'esquema' - 'site' - 'versao' - 'publicado_em'
    || jsonb_build_object('esquema', 1, 'site', p_codigo, 'versao', coalesce(v.numero, 0), 'publicado_em', v.publicada_em)
    || case when coalesce(v.conteudo, '{}'::jsonb) ? 'secoes' then '{}'::jsonb else '{"secoes": {}}'::jsonb end
$$;
comment on function public.versao_no_contrato(text, public.sites_versoes) is 'Uma versão do site no formato do contrato v1 (03): o conteúdo, com esquema, site (o código), versao (o número) e publicado_em por cima.';
revoke execute on function public.versao_no_contrato(text, public.sites_versoes) from public, anon, authenticated;

create function public.publico_site(p_codigo text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'meu-site');
  v public.sites_versoes;
begin
  if v_conta is null then return null; end if;
  select sv.* into v from public.sites_versoes sv join public.sites s on s.id = sv.site_id
  where s.codigo = p_codigo and sv.estado = 'publicada'
  order by sv.numero desc limit 1;
  return public.versao_no_contrato(p_codigo, v);
end $$;
comment on function public.publico_site(text) is 'Meu site (pública): a última versão publicada, no contrato v1. null = o site não responde (volta à versão inicial).';

create function public.publico_previa(p_codigo text, p_previa text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_conta uuid := public.conta_do_site(p_codigo, 'meu-site');
  v public.sites_versoes;
begin
  if v_conta is null or p_previa !~ '^[a-z0-9]{16,64}$' then return null; end if;
  select sv.* into v
  from public.sites_previas p
  join public.sites s on s.id = p.site_id
  join public.sites_versoes sv on sv.id = p.versao_id
  where s.codigo = p_codigo and p.codigo = p_previa and p.expira_em > now();
  if v.id is null then return null; end if;
  return public.versao_no_contrato(p_codigo, v);
end $$;
comment on function public.publico_previa(text, text) is 'Meu site (pública): o conteúdo da versão da prévia (o rascunho), enquanto o código da prévia não expira.';

revoke execute on function public.publico_site(text), public.publico_previa(text, text) from public;
grant execute on function public.publico_site(text), public.publico_previa(text, text) to anon, authenticated;
