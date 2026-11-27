-- Indicadores do site (migração 20261116040000): publico_visita, chamada pelo visitante (anon) como a API do painel
-- chama, e site_indicadores, para quem vê o Meu site da conta. Dados fictícios.

insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Casa das Visitas', 'fotografia', 't-casa-das-visitas', 'ativa', 'renderiza'),
  ('Outra Casa', 'eventos', 't-outra-casa-v', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-casa-das-visitas') as casa, (select id from public.contas where codigo = 't-outra-casa-v') as outra,
  testes.criar_usuario('dona@casa-das-visitas.teste') as dona, testes.criar_usuario('dona@outra-casa-v.teste') as vizinha;
grant select on _c to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id) select casa, 'meu-site' from _c union all select outra, 'meu-site' from _c;
insert into public.sites (conta_id, codigo, dominios) select casa, 't-visitas', array['visitas.teste', 'www.outro-visitas.teste'] from _c;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select casa, dona, 'Dona', 'dona@casa-das-visitas.teste', true from _c
  union all select outra, vizinha, 'Vizinha', 'dona@outra-casa-v.teste', true from _c;

-- o visitante: conta a página, atualiza a mesma página e recusa o que está fora do formato
select testes.entrar_como(null);
create temporary table _r as select
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0001","p":"/","t":"celular","o":"instagram.com","s":5,"se":{"inicio":5},"c":{}}', 'visitas.teste', 'aparelho-um-0123456789') as primeira,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0001","p":"/","t":"celular","s":40,"se":{"inicio":12,"ensaios":28},"c":{"inicio.botao":2,"whatsapp":1}}', 'visitas.teste', 'aparelho-um-0123456789') as de_novo,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0001","p":"/","t":"celular","s":9,"se":{"inicio":9},"c":{}}', 'visitas.teste', 'aparelho-um-0123456789') as menor,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0001","p":"/","t":"celular","s":999,"se":{},"c":{}}', 'visitas.teste', 'outro-aparelho-0123456') as de_outro_aparelho,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0002","p":"/natal","t":"computador","s":20,"se":{"natal":20,"Parte Ruim":5,"x":"muito"},"c":{"<script>":3,"natal.botao":1}}', 'www.outro-visitas.teste', 'aparelho-um-0123456789') as segunda,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0003","p":"/","t":"tablet","o":"<b>","s":"abc","se":"x"}', 'visitas.teste', 'aparelho-dois-012345678') as torta,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0004","p":"/","t":"celular","s":1}', 'outro-site.teste', 'aparelho-tres-01234567') as outro_dominio,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0004","p":"/","t":"celular","s":1}', null, 'aparelho-tres-01234567') as sem_dominio,
  public.publico_visita('t-visitas', '{"v":"curto","p":"/","t":"celular","s":1}', 'visitas.teste', 'aparelho-tres-01234567') as sorteio_ruim,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0005","p":"javascript:x","t":"celular","s":1}', 'visitas.teste', 'aparelho-tres-01234567') as pagina_ruim,
  public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0006","p":"/","t":"celular","s":1}', 'visitas.teste', null) as sem_aparelho,
  public.publico_visita('t-nao-existe', '{"v":"aaaaaaaaaaaa0007","p":"/","t":"celular","s":1}', 'visitas.teste', 'aparelho-tres-01234567') as sem_site;
reset role;
select testes.afirmar((select primeira and de_novo and menor and segunda and torta from _r), 'conta a página, a mesma página de novo e a que veio torta (o que está fora do formato sai)');
select testes.afirmar((select not (outro_dominio or sem_dominio or sorteio_ruim or pagina_ruim or sem_aparelho or sem_site) from _r), 'não conta: outro domínio, sem domínio, sorteio ou caminho fora do formato, sem aparelho, site que não existe');
select testes.afirmar((select count(*) from public.sites_visitas) = 3, 'três páginas abertas: a mesma página não vira outra linha');
select testes.afirmar((select segundos = 40 and secoes = '{"inicio": 9}'::jsonb and origem = 'instagram.com' and aparelho = 'aparelho-um-0123456789' from public.sites_visitas where visita = 'aaaaaaaaaaaa0001'),
  'a mesma página: vale o maior tempo e o último retrato das partes; outro aparelho não mexe nela');
select testes.afirmar((select secoes = '{"natal": 20}'::jsonb and cliques = '{"natal.botao": 1}'::jsonb and tela = 'computador' and pagina = '/natal' from public.sites_visitas where visita = 'aaaaaaaaaaaa0002'),
  'só entram partes e botões com nome no formato e número: nada de texto livre');
select testes.afirmar((select tela = 'celular' and origem is null and segundos = 0 and secoes = '{}'::jsonb from public.sites_visitas where visita = 'aaaaaaaaaaaa0003'), 'o que veio torto vira o padrão');

-- limite por aparelho no dia e site que deixou de responder
insert into public.sites_visitas (conta_id, site_id, visita, dia, aparelho, pagina, tela)
  select casa, (select id from public.sites where codigo = 't-visitas'), 'lote' || lpad(n::text, 12, '0'), (now() at time zone 'America/Sao_Paulo')::date, 'aparelho-cheio-0123456', '/', 'celular'
  from _c, generate_series(1, 200) n;
select testes.entrar_como(null);
create temporary table _l as select public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0010","p":"/","t":"celular","s":1}', 'visitas.teste', 'aparelho-cheio-0123456') as cheio,
  public.publico_visita('t-visitas', '{"v":"lote000000000007","p":"/","t":"celular","s":33}', 'visitas.teste', 'aparelho-cheio-0123456') as a_que_ja_existe;
reset role;
select testes.afirmar((select not cheio and a_que_ja_existe from _l), 'mais de 200 páginas do mesmo aparelho no dia não contam; a que já existe continua atualizando');
delete from public.sites_visitas where aparelho = 'aparelho-cheio-0123456';
update public.sites set situacao = 'desconectado' where codigo = 't-visitas';
select testes.entrar_como(null);
select testes.afirmar(not public.publico_visita('t-visitas', '{"v":"aaaaaaaaaaaa0011","p":"/","t":"celular","s":1}', 'visitas.teste', 'aparelho-um-0123456789'), 'site desconectado não conta');
select testes.afirmar_erro($$select * from public.sites_visitas$$, 'o visitante não lê a tabela');
select testes.afirmar_erro($$select public.site_indicadores((select casa from _c))$$, 'o visitante não chama os indicadores');
reset role;
update public.sites set situacao = 'conectado' where codigo = 't-visitas';
-- uma visita de ontem, do mesmo aparelho (que ontem tinha outro valor: aqui o mesmo, para ver que conta por dia)
insert into public.sites_visitas (conta_id, site_id, visita, dia, aparelho, pagina, tela, segundos)
  select casa, (select id from public.sites where codigo = 't-visitas'), 'ontem00000000001', (now() at time zone 'America/Sao_Paulo')::date - 1, 'aparelho-um-0123456789', '/', 'celular', 10 from _c;

-- a dona vê o resumo; a vizinha, nada; ninguém lê a tabela direto
select testes.entrar_como((select dona from _c));
create temporary table _i as select public.site_indicadores((select casa from _c), 7) as r;
select testes.afirmar_erro($$select * from public.sites_visitas$$, 'quem está logado também não lê a tabela: só o resumo');
reset role;
select testes.afirmar((select (r ->> 'visitas')::int = 4 and (r ->> 'aparelhos')::int = 3 and (r ->> 'segundos')::int = 18 from _i), 'visitas, aparelhos (por dia) e o tempo médio');
select testes.afirmar((select jsonb_array_length(r -> 'por_dia') = 7 and (r -> 'por_dia' -> 6 ->> 'visitas')::int = 3 and (r -> 'por_dia' -> 5 ->> 'visitas')::int = 1 and (r -> 'por_dia' -> 0 ->> 'visitas')::int = 0 from _i), 'dia a dia, com os dias sem visita');
select testes.afirmar((select r -> 'secoes' = '[{"secao": "natal", "visitas": 1, "segundos": 20}, {"secao": "inicio", "visitas": 1, "segundos": 9}]'::jsonb from _i), 'as partes: em quantas visitas apareceram e por quanto tempo');
select testes.afirmar((select r -> 'cliques' = '[{"nome": "natal.botao", "cliques": 1, "visitas": 1}]'::jsonb from _i), 'os botões clicados');
select testes.afirmar((select r -> 'origens' = '[{"origem": "", "visitas": 3}, {"origem": "instagram.com", "visitas": 1}]'::jsonb and r -> 'telas' = '{"celular": 3, "computador": 1}'::jsonb
  and r -> 'paginas' = '[{"pagina": "/", "visitas": 3}, {"pagina": "/natal", "visitas": 1}]'::jsonb from _i), 'de onde vieram, celular ou computador e as páginas');
select testes.entrar_como((select vizinha from _c));
select testes.afirmar(public.site_indicadores((select casa from _c)) is null, 'quem é de outra conta não vê os indicadores desta');
select testes.afirmar((public.site_indicadores((select outra from _c)) ->> 'visitas')::int = 0, 'e os da própria conta vêm vazios, sem erro');
reset role;
