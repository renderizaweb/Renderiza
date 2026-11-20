-- A agenda do site com chave da dona (20/11/2026, pedido da Renderiza, entrega da Bia Maida: "quando a cliente entrar
-- pela primeira vez, deixar o site com a agenda sem conexão… livre para consultar pelo WhatsApp"; os horários que a
-- conta tem ainda não são os de verdade dela). contas.ajustes.agenda.site = false desliga a agenda online no site: as
-- funções publico_* da agenda não respondem e o site volta ao WhatsApp, como sem o painel. Sem o valor (ou true),
-- ligada, como sempre: nenhuma conta muda com esta migração. O Admin cria as contas novas com false; a dona liga em
-- Configurações ("Mostrar a agenda no site") quando conferir os horários.
-- Só conta_do_site muda (é por ela que as quatro funções da agenda descobrem a conta); para os outros módulos (o Meu
-- site, as visitas) ela segue igual. A de antes é a de 20261029135228_publico_agenda.sql, igual no STG e na produção.

create or replace function public.conta_do_site(p_codigo text, p_modulo text) returns uuid language sql stable security definer set search_path = '' as $$
  select s.conta_id
  from public.sites s
  join public.contas c on c.id = s.conta_id
  join public.contas_modulos cm on cm.conta_id = c.id and cm.modulo_id = p_modulo and cm.ligado
  join public.modulos m on m.id = cm.modulo_id
  where s.codigo = p_codigo and s.situacao = 'conectado'
    and public.conta_liberada(c.id)
    and (c.situacao <> 'teste' or m.liberado_no_teste)
    and (p_modulo <> 'agenda-online' or (c.ajustes -> 'agenda' -> 'site') is distinct from 'false'::jsonb)
$$;
comment on function public.conta_do_site(text, text) is 'A conta do site pelo código, se o site está conectado, a conta liberada e o módulo ligado (agenda online, Meu site). A agenda online também precisa da agenda ligada no site (contas.ajustes.agenda.site diferente de false). Só para as funções publico_*.';
