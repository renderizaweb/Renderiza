-- A agenda do site com chave da dona (migração 20261120190000): contas.ajustes.agenda.site = false desliga as funções
-- públicas da agenda (o site volta ao WhatsApp); sem o valor, ligada. O Meu site não muda. Dados fictícios.

insert into public.contas (nome, nicho, codigo, situacao, origem, ajustes) values
  ('Fotógrafa Nova Teste', 'fotografia', 't-chave-nova', 'ativa', 'renderiza', '{"agenda": {"modo": "turno", "site": false}}'),
  ('Estúdio Antigo Teste', 'fotografia', 't-chave-antigo', 'ativa', 'renderiza', '{}');
create temporary table _c as select
  (select id from public.contas where codigo = 't-chave-nova') as nova,
  (select id from public.contas where codigo = 't-chave-antigo') as antigo,
  (current_date + ((6 - extract(dow from current_date)::int + 7) % 7) + 7) as sabado;
grant select on _c to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id) select x, m from _c, unnest(array[nova, antigo]) x, unnest(array['agenda-online', 'meu-site']) m;
insert into public.sites (conta_id, codigo, dominios) select nova, 't-chave-nova', array['nova.teste'] from _c;
insert into public.sites (conta_id, codigo, dominios) select antigo, 't-chave-antigo', array['antigo.teste'] from _c;
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select nova, 6, '08:00', '12:00', 'Manhã' from _c;
insert into public.horarios (conta_id, dia_semana, inicio) select antigo, 6, '09:00' from _c;
create temporary table _t as select (select id from public.horarios where conta_id = (select nova from _c)) as manha;
grant select on _t to anon, authenticated;

-- ---------- desligada no site ----------
select testes.entrar_como(null);
select testes.afirmar(public.publico_disponibilidade('t-chave-nova', current_date, current_date + 14) is null, 'desligada: a disponibilidade não responde');
select testes.afirmar(public.publico_pedido('t-chave-nova', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select sabado from _c), 'turno', (select manha from _t)), 'nova.teste', 'c1') ->> 'erro' = 'fora',
  'desligada: o pedido fica fora');
select testes.afirmar(public.publico_site('t-chave-nova') is not null, 'desligada: o Meu site segue respondendo');
reset role;
select testes.afirmar((select count(*) from public.pedidos where conta_id = (select nova from _c)) = 0, 'nenhum pedido gravado');

-- ---------- sem o valor: ligada, como sempre ----------
select testes.entrar_como(null);
select testes.afirmar(public.publico_horarios('t-chave-antigo', (select sabado from _c), (select sabado from _c)) ->> 'modo' = 'horario', 'sem o valor: ligada (a conta antiga não muda)');
reset role;

-- ---------- a dona liga ----------
update public.contas set ajustes = jsonb_set(ajustes, '{agenda,site}', 'true') where id = (select nova from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_disponibilidade('t-chave-nova', (select sabado from _c), (select sabado from _c)) ->> 'modo' = 'turno', 'ligada: responde');
select testes.afirmar((public.publico_pedido('t-chave-nova', jsonb_build_object('nome', 'Ana Teste', 'whatsapp', '11944443333', 'data', (select sabado from _c), 'turno', (select manha from _t)), 'nova.teste', 'c2') ->> 'ok')::boolean,
  'ligada: o pedido entra');
reset role;
