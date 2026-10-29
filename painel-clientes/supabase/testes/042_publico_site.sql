-- Meu site, o lado público (Missão 4C, migração 20261029141746): publico_site e publico_previa, chamadas pelo
-- visitante (anon), como a API do painel chama. Dados fictícios.

insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Casa do Site', 'eventos', 't-casa-do-site', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-casa-do-site') as casa;
grant select on _c to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id) select casa, 'meu-site' from _c;
insert into public.sites (conta_id, codigo, dominios) select casa, 't-site', array['site.teste'] from _c;
create temporary table _s as select (select id from public.sites where codigo = 't-site') as site;
grant select on _s to anon, authenticated;

-- nunca publicou: o conteúdo vazio (a versão inicial)
select testes.entrar_como(null);
create temporary table _r0 as select public.publico_site('t-site') as r;
reset role;
select testes.afirmar(
  (select r from _r0) = '{"esquema": 1, "site": "t-site", "versao": 0, "publicado_em": null, "secoes": {}}'::jsonb,
  'sem versão publicada: a inicial (secoes vazio, versao 0)');

-- um rascunho não sai; publicado, sai no formato do contrato
insert into public.sites_versoes (conta_id, site_id, conteudo)
  select casa, (select site from _s), '{"esquema": 1, "secoes": {"inicio": {"textos": {"titulo": "Publicado *agora.*"}}}, "contato": {"whatsapp": "5511900000000"}}' from _c;
select testes.entrar_como(null);
select testes.afirmar((public.publico_site('t-site') ->> 'versao')::int = 0, 'rascunho não aparece no site');
reset role;
update public.sites_versoes set estado = 'publicada' where site_id = (select site from _s);
insert into public.sites_versoes (conta_id, site_id, conteudo)
  select casa, (select site from _s), '{"esquema": 1, "site": "outro", "versao": 99, "secoes": {"inicio": {"textos": {"titulo": "Rascunho"}}}}' from _c;
insert into public.sites_previas (conta_id, site_id, versao_id, codigo)
  select casa, (select site from _s), (select id from public.sites_versoes where site_id = (select site from _s) and estado = 'rascunho'), 'previa0123456789abcd' from _c;
insert into public.sites_previas (conta_id, site_id, versao_id, codigo, criado_em, expira_em)
  select casa, (select site from _s), (select id from public.sites_versoes where site_id = (select site from _s) and estado = 'rascunho'), 'previavencida0123456', now() - interval '3 days', now() - interval '1 day' from _c;

select testes.entrar_como(null);
create temporary table _r1 as select public.publico_site('t-site') as r, public.publico_previa('t-site', 'previa0123456789abcd') as p,
  public.publico_previa('t-site', 'previavencida0123456') as vencida, public.publico_previa('t-site', 'naoexiste0123456789') as errada,
  public.publico_previa('t-site', 'X; drop') as estranha;
reset role;
select testes.afirmar(
  (select r -> 'secoes' -> 'inicio' -> 'textos' ->> 'titulo' from _r1) = 'Publicado *agora.*'
  and (select (r ->> 'versao')::int from _r1) = 1 and (select r ->> 'site' from _r1) = 't-site'
  and (select (r ->> 'esquema')::int from _r1) = 1 and (select r ->> 'publicado_em' from _r1) is not null
  and (select r -> 'contato' ->> 'whatsapp' from _r1) = '5511900000000',
  'publicada: o conteúdo, com esquema, site, versão e quando');
select testes.afirmar(
  (select p -> 'secoes' -> 'inicio' -> 'textos' ->> 'titulo' from _r1) = 'Rascunho'
  and (select p ->> 'site' from _r1) = 't-site' and (select (p ->> 'versao')::int from _r1) = 2,
  'prévia: o rascunho, com o site e a versão certos (o que vier dentro do conteúdo não manda)');
select testes.afirmar((select vencida is null and errada is null and estranha is null from _r1), 'prévia vencida, errada ou estranha: nada');

-- site que não responde
update public.contas_modulos set ligado = false where conta_id = (select casa from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_site('t-site') is null and public.publico_previa('t-site', 'previa0123456789abcd') is null, 'Meu site desligado: não responde (o site volta à inicial)');
reset role;
update public.contas_modulos set ligado = true where conta_id = (select casa from _c);
update public.sites set situacao = 'versao_final' where id = (select site from _s);
select testes.entrar_como(null);
select testes.afirmar(public.publico_site('t-site') is null, 'versão final: não responde');
reset role;
update public.sites set situacao = 'desconectado' where id = (select site from _s);
select testes.entrar_como(null);
select testes.afirmar(public.publico_site('t-site') is null, 'desconectado: não responde');
select testes.afirmar(public.publico_site('nao-existe') is null, 'código que não existe: nada');
reset role;
