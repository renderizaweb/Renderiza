-- Os primeiros projetos (28/11/2026, pedido do Kaue): rode no SQL Editor depois do supabase/projetos.sql. Pode rodar
-- de novo: os ids são fixos e o que já existe fica como está (nada é duplicado nem sobrescrito).
--
-- Rafaela, Bia e Ricardo: concluídos, cada um com as cinco etapas da entrega (as issues agrupadas, com as ações de
-- cada uma), feitas no ciclo que o Kaue pediu: a Rafaela no ciclo 7 (a semana retrasada), a Bia no 8 (a passada) e
-- o Ricardo no 9 (esta). O vereador Mateuzinho: em andamento, só com a proposta (a do formato novo, de 27/11, feita
-- depois de ele querer fechar) e a assinatura do contrato, feitas (a data da assinatura vem do próprio banco, a mais
-- recente dos termos aceitos dele); as próximas issues o Kaue cria.
-- O cliente de cada projeto é o lead da demo (/demo/<pasta>) ou do nome, só quando acha um só; senão o projeto fica
-- sem cliente e dá para ligar depois, no projeto.

do $$
declare
  v_dono   uuid;
  v_termo  timestamptz;
  v_lead   text;
  p        record;
  i        record;
begin
  -- o dono é quem tem os leads (o login do painel)
  select l.dono into v_dono from public.leads l group by l.dono order by count(*) desc limit 1;
  if v_dono is null then
    raise notice 'Nenhum lead no banco: a carga dos projetos fica para depois.';
    return;
  end if;

  -- ---------- os projetos ----------
  for p in
    select * from (values
      ('projeto-rafaela-damaceno', 'Rafaela Damaceno · Site + Painel', 'rafaela-damaceno-fotografia', '%rafaela%damaceno%',
       'Primeiro cliente com site e painel: o Estúdio Fotográfico de Franco da Rocha (SP). Site no Cloudflare Pages, Meu site e agenda online no Painel Renderiza. Trilho: docs/entregas/rafaela-damaceno.md.',
       'concluido', date '2026-11-14', date '2026-11-17', date '2026-11-17'),
      ('projeto-bia-maida', 'Bia Maida · Site + Painel', 'bia-maida-fotografia', '%bia%maida%',
       'Fotógrafa de eventos, ensaios externos e corporativo (São Paulo). O site completo com o painel completo, como o da Rafaela. Trilho: docs/entregas/bia-maida.md.',
       'concluido', date '2026-11-17', null, date '2026-11-20'),
      ('projeto-ricardo-motors', 'Ricardo Motors · Site + Estoque', 'ricardo-motors', '%ricardo motors%',
       'Revenda de carros premium (São Paulo). O site com o Estoque no Painel Renderiza: o primeiro cliente do módulo Estoque, um modelo novo. Trilho: docs/entregas/ricardo-motors.md.',
       'concluido', date '2026-11-24', null, date '2026-11-27'),
      ('projeto-vereador-mateuzinho', 'Vereador Mateuzinho Silva · Site + portal do gabinete', 'vereador-mateuzinho-silva', '%mateuzinho%',
       'Vereador de Itapevi (PL). O site do mandato e a integração com o portal que o gabinete já usa, em duas entregas: o site no ar em até 10 dias úteis; a integração em até 15 dias úteis depois de liberados os acessos. Proposta e contrato feitos; o desenvolvimento começa agora. Ver demos/vereador-mateuzinho-silva/proposta.md.',
       'em_andamento', date '2026-11-27', null, null)
    ) v(id, nome, pasta, nome_parecido, descricao, situacao, inicio, meta, concluido_em)
  loop
    select min(l.id) into v_lead from public.leads l
      where l.dono = v_dono and (public.renderiza_pasta_da_demo(l.link_demo) = p.pasta or l.empresa ilike p.nome_parecido)
      having count(*) = 1;
    insert into public.projetos (id, dono, nome, lead_id, descricao, situacao, inicio, meta, concluido_em)
    values (p.id, v_dono, p.nome, v_lead, p.descricao, p.situacao, p.inicio, p.meta, p.concluido_em)
    on conflict (id) do nothing;
  end loop;

  -- a assinatura do contrato do vereador, como está no banco (a mais recente; sem ela, a issue fica feita hoje)
  if to_regclass('public.termos_aceites') is not null and to_regclass('public.termos_online') is not null then
    execute $q$
      select max(a.criado_em) from public.termos_aceites a join public.termos_online t on t.id = a.termo_id
      where t.dono = $1 and (t.lead_id = (select lead_id from public.projetos where id = 'projeto-vereador-mateuzinho')
                             or t.id ilike '%mateuzinho%' or t.id ilike '%vereador%')
    $q$ into v_termo using v_dono;
  end if;

  -- ---------- as issues, na ordem (o número curto sai nessa ordem) ----------
  for i in
    select * from (values
      -- Rafaela: ciclo 7 (13 a 19/11)
      (1, 'issue-rafaela-1', 'projeto-rafaela-damaceno', 'Contas e repositório do cliente', E'- Gmail de desenvolvimento do cliente (ou o dela)\n- GitHub dela, com o repositório privado do site\n- Integração com a conta da Renderiza no GitHub (a que o Claude acessa) e o app do Claude no repositório', 7, timestamptz '2026-11-15 12:00-03'),
      (2, 'issue-rafaela-2', 'projeto-rafaela-damaceno', 'A demo vira o site, no repositório dela', E'- O Claude gera o site com o virar-site (npm run site -- <pasta>) e confere\n- Sobe o site no repositório dela (as duas páginas: o site e o Natal)', 7, timestamptz '2026-11-15 18:00-03'),
      (3, 'issue-rafaela-3', 'projeto-rafaela-damaceno', 'Painel Renderiza: conta, módulos e acessos', E'- A conta dela no painel, com os módulos combinados\n- O site ligado ao painel (Meu site)\n- Agenda online: ensaios, horários e a campanha de Natal\n- O acesso dela preparado', 7, timestamptz '2026-11-16 18:00-03'),
      (4, 'issue-rafaela-4', 'projeto-rafaela-damaceno', 'Publicação: Cloudflare Pages e domínio', E'- Cloudflare Pages ligado ao GitHub e ao repositório dela\n- Domínio comprado no Registro.br, no nome dela\n- Registro.br apontado para o Cloudflare Pages', 7, timestamptz '2026-11-16 20:00-03'),
      (5, 'issue-rafaela-5', 'projeto-rafaela-damaceno', 'Conferência no ar e entrega', E'- A página no domínio conferida com o painel (Meu site e agenda)\n- Testes no computador e no celular\n- O acesso do painel entregue a ela', 7, timestamptz '2026-11-17 18:00-03'),
      -- Bia: ciclo 8 (20 a 26/11)
      (6, 'issue-bia-1', 'projeto-bia-maida', 'Contas e repositório do cliente', E'- Gmail de desenvolvimento da cliente (ou o dela)\n- GitHub dela, com o repositório privado do site\n- Integração com a conta da Renderiza no GitHub (a que o Claude acessa) e o app do Claude no repositório', 8, timestamptz '2026-11-20 10:00-03'),
      (7, 'issue-bia-2', 'projeto-bia-maida', 'A demo vira o site, no repositório dela', E'- O Claude gera o site com o virar-site (npm run site -- <pasta>) e confere\n- Sobe o site no repositório dela', 8, timestamptz '2026-11-20 11:00-03'),
      (8, 'issue-bia-3', 'projeto-bia-maida', 'Painel Renderiza: conta, módulos e acessos', E'- A conta dela no painel, com o painel completo\n- O site ligado ao painel (Meu site)\n- Agenda online: o "Sua data", por dia e turno\n- O acesso dela preparado', 8, timestamptz '2026-11-20 12:00-03'),
      (9, 'issue-bia-4', 'projeto-bia-maida', 'Publicação: Cloudflare Pages e domínio', E'- Cloudflare Pages ligado ao GitHub e ao repositório dela\n- Domínio comprado no Registro.br, no nome dela\n- Registro.br apontado para o Cloudflare Pages', 8, timestamptz '2026-11-20 14:00-03'),
      (10, 'issue-bia-5', 'projeto-bia-maida', 'Conferência no ar e entrega', E'- A página no domínio conferida com o painel (Meu site e agenda)\n- Testes no computador e no celular\n- O acesso do painel entregue a ela', 8, timestamptz '2026-11-20 18:00-03'),
      -- Ricardo: ciclo 9 (27 a 29/11)
      (11, 'issue-ricardo-1', 'projeto-ricardo-motors', 'Contas e repositório do cliente', E'- Gmail de desenvolvimento do cliente (ou o dele)\n- GitHub dele, com o repositório privado do site\n- Integração com a conta da Renderiza no GitHub (a que o Claude acessa) e o app do Claude no repositório', 9, timestamptz '2026-11-27 10:00-03'),
      (12, 'issue-ricardo-2', 'projeto-ricardo-motors', 'A demo vira o site, no repositório dele', E'- O Claude gera o site (entrega da Ricardo Motors) e confere\n- Sobe o site no repositório dele', 9, timestamptz '2026-11-27 11:00-03'),
      (13, 'issue-ricardo-3', 'projeto-ricardo-motors', 'Painel Renderiza: conta, módulos e acessos', E'- A conta dele no painel, com o Meu site e o Estoque\n- Estoque: o modelo novo do módulo, com os carros dele\n- O site ligado ao painel (Meu site e Estoque)\n- O acesso dele preparado', 9, timestamptz '2026-11-27 12:00-03'),
      (14, 'issue-ricardo-4', 'projeto-ricardo-motors', 'Publicação: Cloudflare Pages e domínio', E'- Cloudflare Pages ligado ao GitHub e ao repositório dele\n- Domínio comprado no Registro.br, no nome dele\n- Registro.br apontado para o Cloudflare Pages', 9, timestamptz '2026-11-27 14:00-03'),
      (15, 'issue-ricardo-5', 'projeto-ricardo-motors', 'Conferência no ar e entrega', E'- A página no domínio conferida com o painel (Meu site e Estoque)\n- Testes no computador e no celular\n- O acesso do painel entregue a ele', 9, timestamptz '2026-11-27 18:00-03'),
      -- vereador: a proposta (27/11) e o contrato (a data do banco); o ciclo sai da data
      (16, 'issue-vereador-1', 'projeto-vereador-mateuzinho', 'Proposta', E'A proposta no formato novo, feita para ele depois de ele querer fechar: o site do mandato e a integração com o portal que o gabinete já usa, em duas entregas (o site em até 10 dias úteis; a integração em até 15 dias úteis depois dos acessos). Ver demos/vereador-mateuzinho-silva/proposta.md.', null, timestamptz '2026-11-27 12:00-03'),
      (17, 'issue-vereador-2', 'projeto-vereador-mateuzinho', 'Assinatura do termo', E'O contrato aceito online (código no e-mail, impressão do texto e comprovante).', null, v_termo)
    ) v(ordem, id, projeto_id, titulo, descricao, ciclo, feita_em)
    order by ordem
  loop
    if exists (select 1 from public.projetos where id = i.projeto_id and dono = v_dono) then
      insert into public.issues (id, dono, titulo, descricao, projeto_id, status, ciclo, feita_em, posicao)
      values (i.id, v_dono, i.titulo, i.descricao, i.projeto_id, 'done', i.ciclo, i.feita_em, i.ordem * 1000)
      on conflict (id) do nothing;
    end if;
  end loop;
end;
$$;
