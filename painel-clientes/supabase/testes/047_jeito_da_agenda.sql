-- O jeito da agenda online como escolha da conta (migração 20261118200000): contas.ajustes.agenda.modo, 'horario' ou
-- 'turno'; sem escolha, o do nicho. Cada par de funções públicas só responde no jeito dele. Dados fictícios.

-- ---------- o cenário: uma fotógrafa de eventos (por turno), um estúdio (sem escolha) e uma casa de festa ----------
insert into public.contas (nome, nicho, codigo, situacao, origem, ajustes) values
  ('Fotógrafa de Eventos Teste', 'fotografia', 't-jeito-eventos', 'ativa', 'renderiza', '{"agenda": {"modo": "turno"}}'),
  ('Estúdio do Jeito Teste', 'fotografia', 't-jeito-estudio', 'ativa', 'renderiza', '{}'),
  ('Casa do Jeito Teste', 'eventos', 't-jeito-casa', 'ativa', 'renderiza', '{"agenda": {"modo": "qualquer"}}');
create temporary table _c as select
  (select id from public.contas where codigo = 't-jeito-eventos') as bia,
  (select id from public.contas where codigo = 't-jeito-estudio') as estudio,
  (select id from public.contas where codigo = 't-jeito-casa') as casa,
  -- o sábado da semana que vem
  (current_date + ((6 - extract(dow from current_date)::int + 7) % 7) + 7) as sabado;
grant select on _c to anon, authenticated;

insert into public.contas_modulos (conta_id, modulo_id) select x, 'agenda-online' from _c, unnest(array[bia, estudio, casa]) x;
insert into public.sites (conta_id, codigo, dominios) select bia, 't-jeito-bia', array['bia.teste'] from _c;
insert into public.sites (conta_id, codigo, dominios) select estudio, 't-jeito-est', array['estudio-jeito.teste'] from _c;
insert into public.sites (conta_id, codigo, dominios) select casa, 't-jeito-casa', array['casa-jeito.teste'] from _c;
insert into public.servicos (conta_id, nome, ordem) select bia, 'Aniversário', 1 from _c;
insert into public.servicos (conta_id, nome, ordem) select bia, 'Chá de bebê', 2 from _c;
insert into public.servicos (conta_id, nome, duracao_min) select estudio, 'Gestante', 60 from _c;
create temporary table _ids as select
  (select id from public.servicos where nome = 'Aniversário' and conta_id = (select bia from _c)) as aniversario;
grant select on _ids to anon, authenticated;
-- a fotógrafa: sábado de manhã e à tarde; o estúdio: sábado 09:00; a casa: sábado à noite
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select bia, 6, '08:00', '12:00', 'Manhã' from _c;
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select bia, 6, '13:00', '18:00', 'Tarde' from _c;
insert into public.horarios (conta_id, dia_semana, inicio) select estudio, 6, '09:00' from _c;
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select casa, 6, '19:00', '02:00', 'À noite' from _c;
create temporary table _t as select
  (select id from public.horarios where nome = 'Manhã' and conta_id = (select bia from _c)) as manha,
  (select id from public.horarios where nome = 'Tarde' and conta_id = (select bia from _c)) as tarde;
grant select on _t to anon, authenticated;

-- o "livre" de um turno num dia, de uma resposta de publico_disponibilidade
create function pg_temp.turno_livre(r jsonb, dia date, nome text) returns jsonb language sql as $f$
  select t -> 'livre' from jsonb_array_elements(r -> 'dias') d, jsonb_array_elements(d -> 'turnos') t
  where (d ->> 'data')::date = dia and t ->> 'nome' = nome
$f$;

-- ---------- a regra: a escolha da conta, senão o nicho ----------
select testes.afirmar(public.modo_da_agenda((select bia from _c)) = 'turno', 'fotografia com a escolha "turno": por turno');
select testes.afirmar(public.modo_da_agenda((select estudio from _c)) = 'horario', 'fotografia sem escolha: por horário, como sempre');
select testes.afirmar(public.modo_da_agenda((select casa from _c)) = 'turno', 'eventos com um valor que não existe: o do nicho (turno)');

-- ---------- a fotógrafa de eventos: dia e turno ----------
select testes.entrar_como(null);
create temporary table _d as select public.publico_disponibilidade('t-jeito-bia', (select sabado from _c), (select sabado from _c)) as r;
reset role;
select testes.afirmar((select r ->> 'modo' = 'turno' and r ->> 'nicho' = 'fotografia' from _d), 'por turno: a resposta diz o jeito e o nicho');
select testes.afirmar((select pg_temp.turno_livre(r, (select sabado from _c), 'Manhã') = 'true' and pg_temp.turno_livre(r, (select sabado from _c), 'Tarde') = 'true' from _d),
  'sábado: manhã e tarde livres');
select testes.afirmar((select r -> 'pacotes' @> '[{"nome": "Aniversário"}, {"nome": "Chá de bebê"}]' from _d), 'os tipos de trabalho dela vêm como pacotes');

select testes.entrar_como(null);
select testes.afirmar(public.publico_horarios('t-jeito-bia', current_date, current_date + 14) is null, 'por turno: as funções de horário não respondem');
select testes.afirmar(public.publico_pedido_horario('t-jeito-bia', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select sabado from _c), 'hora', '08:00'), 'bia.teste', 'e1') ->> 'erro' = 'fora',
  'por turno: o pedido por horário fica fora');
create temporary table _p as select public.publico_pedido('t-jeito-bia', jsonb_build_object('nome', 'Carla Teste', 'whatsapp', '(11) 95555-4444',
  'data', (select sabado from _c), 'turno', (select manha from _t), 'pacote', (select aniversario from _ids), 'mensagem', 'Em Moema.'), 'bia.teste', 'e2') as r;
select testes.afirmar((select (r ->> 'ok')::boolean from _p), 'o pedido da manhã entra');
select testes.afirmar(public.publico_pedido('t-jeito-bia', jsonb_build_object('nome', 'Duda Teste', 'whatsapp', '11933332222',
  'data', (select sabado from _c), 'turno', (select manha from _t)), 'bia.teste', 'e3') ->> 'erro' = 'ocupada', 'a mesma manhã: ocupada');
select testes.afirmar((public.publico_pedido('t-jeito-bia', jsonb_build_object('nome', 'Duda Teste', 'whatsapp', '11933332222',
  'data', (select sabado from _c), 'turno', (select tarde from _t)), 'bia.teste', 'e3') ->> 'ok')::boolean, 'a tarde do mesmo dia segue livre');
reset role;
select testes.afirmar((select r.situacao = 'pre_reserva' and r.servico_id = (select aniversario from _ids)
    and (r.inicio at time zone 'America/Sao_Paulo')::time = '08:00' and (r.fim at time zone 'America/Sao_Paulo')::time = '12:00'
    and p.origem = 'agenda_online' and p.mensagem like '%Manhã%' and p.mensagem like '%Em Moema.%'
  from public.pedidos p join public.reservas r on r.id = p.reserva_id where p.id = (select (r ->> 'pedido')::uuid from _p)),
  'vira pré-reserva da manhã (8h às 12h), com o tipo de trabalho e a mensagem, e pedido no Atendimento');
select testes.entrar_como(null);
select testes.afirmar((select pg_temp.turno_livre(public.publico_disponibilidade('t-jeito-bia', (select sabado from _c), (select sabado from _c)), (select sabado from _c), 'Manhã')) = 'false',
  'depois do pedido, a manhã aparece ocupada');
reset role;

-- ---------- o estúdio sem escolha: por horário, como era ----------
select testes.entrar_como(null);
select testes.afirmar((select r ->> 'modo' = 'horario' and jsonb_array_length(r -> 'dias') = 1 from (select public.publico_horarios('t-jeito-est', (select sabado from _c), (select sabado from _c)) as r) x),
  'sem escolha: por horário, com o jeito na resposta');
select testes.afirmar(public.publico_disponibilidade('t-jeito-est', current_date, current_date + 14) is null, 'por horário: a disponibilidade por turno não responde');
select testes.afirmar(public.publico_pedido('t-jeito-est', '{}', 'estudio-jeito.teste', 'e4') ->> 'erro' = 'fora', 'por horário: o pedido por turno fica fora');
reset role;

-- ---------- a casa de festa: por turno; escolhendo horário, passa a responder por horário ----------
select testes.entrar_como(null);
select testes.afirmar((select r ->> 'modo' from (select public.publico_disponibilidade('t-jeito-casa', (select sabado from _c), (select sabado from _c)) as r) x) = 'turno', 'eventos: por turno');
reset role;
update public.contas set ajustes = '{"agenda": {"modo": "horario"}}' where id = (select casa from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_disponibilidade('t-jeito-casa', current_date, current_date + 14) is null
  and public.publico_horarios('t-jeito-casa', (select sabado from _c), (select sabado from _c)) ->> 'modo' = 'horario', 'a escolha troca o jeito, nas duas pontas');
reset role;

-- ---------- o visitante não chega à regra ----------
select testes.entrar_como(null);
select testes.afirmar_erro($$select public.modo_da_agenda(null)$$, 'modo_da_agenda fechada ao visitante');
reset role;
