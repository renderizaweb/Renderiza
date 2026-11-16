-- Agenda online da fotografia (Parada C2 da entrega da Rafaela, migração 20261116013045): publico_horarios e
-- publico_pedido_horario, chamadas pelo visitante (anon), como a API do painel chama. Dados fictícios.

create function pg_temp.erro_com(comando text, trecho text, mensagem text) returns void language plpgsql as $f$
begin
  begin
    execute comando;
  exception when others then
    if position(trecho in sqlerrm) = 0 then
      raise exception 'FALHOU (outro erro): % · esperava "%" · veio: %', mensagem, trecho, sqlerrm;
    end if;
    return;
  end;
  raise exception 'FALHOU (era para dar erro): %', mensagem;
end $f$;

-- ---------- o cenário: um estúdio de fotografia com site, horários de terça e sábado, a campanha de Natal ----------
insert into public.contas (nome, nicho, codigo, situacao, origem) values
  ('Estúdio Teste', 'fotografia', 't-estudio-foto', 'ativa', 'renderiza'),
  ('Casa de Festa Teste', 'eventos', 't-casa-festa-foto', 'ativa', 'renderiza');
create temporary table _c as select
  (select id from public.contas where codigo = 't-estudio-foto') as foto,
  (select id from public.contas where codigo = 't-casa-festa-foto') as festa,
  -- a terça da semana que vem e o sábado depois dela
  (current_date + ((2 - extract(dow from current_date)::int + 7) % 7) + 7) as terca;
alter table _c add column sabado date, add column terca2 date;
update _c set sabado = terca + 4, terca2 = terca + 7;
grant select on _c to anon, authenticated;

insert into public.contas_modulos (conta_id, modulo_id) select foto, 'agenda-online' from _c union all select festa, 'agenda-online' from _c;
insert into public.sites (conta_id, codigo, dominios) select foto, 't-foto', array['estudio.teste'] from _c;
insert into public.sites (conta_id, codigo, dominios) select festa, 't-festa-foto', array['festa.teste'] from _c;
insert into public.servicos (conta_id, nome, duracao_min, valor, ordem) select foto, 'Gestante', 60, 900, 1 from _c;
insert into public.servicos (conta_id, nome, duracao_min, ordem) select foto, 'Família', 90, 2 from _c;
insert into public.servicos (conta_id, nome, duracao_min, ordem) select foto, 'Smash the cake', 60, 3 from _c;
insert into public.servicos (conta_id, nome, na_agenda_online) select foto, 'Só por dentro', false from _c;
insert into public.servicos (conta_id, nome, duracao_min, na_agenda_online) select foto, 'Mini sessão de Natal', 30, false from _c;
insert into public.servicos (conta_id, nome, duracao_min) select festa, 'Ensaio da outra', 60 from _c;
create temporary table _ids as select
  (select id from public.servicos where nome = 'Gestante' and conta_id = (select foto from _c)) as gestante,
  (select id from public.servicos where nome = 'Família' and conta_id = (select foto from _c)) as familia,
  (select id from public.servicos where nome = 'Smash the cake' and conta_id = (select foto from _c)) as smash,
  (select id from public.servicos where nome = 'Só por dentro' and conta_id = (select foto from _c)) as fora,
  (select id from public.servicos where nome = 'Mini sessão de Natal' and conta_id = (select foto from _c)) as natal,
  (select id from public.servicos where nome = 'Ensaio da outra' and conta_id = (select festa from _c)) as da_outra;
grant select on _ids to anon, authenticated;

-- os horários de início do estúdio: terça 09:00, 10:00 e 14:00; sábado 09:00. O smash tem horário próprio: sábado 15:00
insert into public.horarios (conta_id, dia_semana, inicio) select foto, 2, h::time from _c, unnest(array['09:00', '10:00', '14:00']) h;
insert into public.horarios (conta_id, dia_semana, inicio) select foto, 6, '09:00' from _c;
insert into public.horarios (conta_id, servico_id, dia_semana, inicio) select foto, smash, 6, '15:00' from _c, _ids;
insert into public.horarios (conta_id, dia_semana, inicio) select festa, 2, '09:00' from _c;
-- a campanha de Natal: a terça e o sábado, 09:30 e 11:00, 3 vagas
insert into public.campanhas (conta_id, nome, servico_id, dias, horarios, vagas)
  select foto, 'Natal', natal, array[terca, sabado], array['09:30', '11:00']::time[], 3 from _c, _ids;
insert into public.campanhas (conta_id, nome, dias, horarios, ativa)
  select foto, 'Páscoa (parada)', array[terca], array['09:30']::time[], false from _c;
insert into public.campanhas (conta_id, nome, dias, horarios) select festa, 'Natal da outra', array[terca], array['09:30']::time[] from _c;
alter table _ids add column campanha uuid, add column parada uuid, add column campanha_outra uuid;
update _ids set campanha = (select id from public.campanhas where nome = 'Natal'), parada = (select id from public.campanhas where nome = 'Páscoa (parada)'),
  campanha_outra = (select id from public.campanhas where nome = 'Natal da outra');
-- terça às 10:00 já tem ensaio confirmado; a terça seguinte está fechada (folga)
insert into public.clientes (conta_id, nome, whatsapp) select foto, 'Joana Teste', '11977776666' from _c;
insert into public.reservas (conta_id, cliente_id, servico_id, inicio, fim, situacao)
  select foto, (select id from public.clientes where nome = 'Joana Teste'), gestante,
         (terca + time '10:00') at time zone 'America/Sao_Paulo', (terca + time '11:00') at time zone 'America/Sao_Paulo', 'confirmada' from _c, _ids;
insert into public.bloqueios (conta_id, de, ate, motivo) select foto, terca2, terca2, 'Folga' from _c;

-- o "livre" de um horário num dia, de uma resposta de publico_horarios
create function pg_temp.livre(r jsonb, dia date, hora text) returns jsonb language sql as $f$
  select h -> 'livre' from jsonb_array_elements(r -> 'dias') d, jsonb_array_elements(d -> 'horarios') h
  where (d ->> 'data')::date = dia and h ->> 'hora' = hora
$f$;
create function pg_temp.horas(r jsonb, dia date) returns jsonb language sql as $f$
  select coalesce(jsonb_agg(h ->> 'hora' order by h ->> 'hora'), '[]') from jsonb_array_elements(r -> 'dias') d, jsonb_array_elements(d -> 'horarios') h
  where (d ->> 'data')::date = dia
$f$;

-- ---------- o visitante vê os horários livres ----------
select testes.entrar_como(null);
create temporary table _h as select public.publico_horarios('t-foto', (select terca from _c), (select terca2 from _c)) as r;
create temporary table _hf as select public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), (select familia from _ids)) as r;
create temporary table _hs as select public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), (select smash from _ids)) as r;
create temporary table _hc as select public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), null, (select campanha from _ids)) as r;
reset role;
select testes.afirmar((select r ->> 'nicho' = 'fotografia' and (r ->> 'separa_horas')::int = 48 and (r ->> 'duracao')::int = 60 from _h), 'horários: nicho, as 48 horas e a duração padrão');
select testes.afirmar(
  (select pg_temp.horas(r, (select terca from _c)) = '["09:00", "10:00", "14:00"]' and pg_temp.horas(r, (select sabado from _c)) = '["09:00"]' from _h)
  and (select count(*) from _h, jsonb_array_elements(r -> 'dias') d where extract(dow from (d ->> 'data')::date) not in (2, 6)) = 0,
  'só os dias e horários do estúdio (o horário próprio do smash não entra no geral)');
select testes.afirmar(
  (select pg_temp.livre(r, (select terca from _c), '09:00') = 'true' and pg_temp.livre(r, (select terca from _c), '10:00') = 'false'
     and pg_temp.livre(r, (select terca from _c), '14:00') = 'true' from _h),
  'terça: 10:00 ocupado pelo ensaio confirmado, o resto livre');
select testes.afirmar((select bool_and(not (h ->> 'livre')::boolean) from _h, jsonb_array_elements(r -> 'dias') d, jsonb_array_elements(d -> 'horarios') h
  where (d ->> 'data')::date = (select terca2 from _c)), 'dia de folga: nenhum horário livre');
select testes.afirmar(
  (select pg_temp.livre(r, (select terca from _c), '09:00') = 'false' and pg_temp.livre(r, (select terca from _c), '14:00') = 'true' and (r ->> 'duracao')::int = 90 from _hf),
  'família (90 min): às 09:00 cruzaria o ensaio das 10:00, então não está livre');
select testes.afirmar(
  (select pg_temp.horas(r, (select terca from _c)) = '[]' and pg_temp.horas(r, (select sabado from _c)) = '["15:00"]' from _hs),
  'o smash tem horário próprio: só o dele');
select testes.afirmar(
  (select pg_temp.horas(r, (select terca from _c)) = '["09:30", "11:00"]' and pg_temp.horas(r, (select sabado from _c)) = '["09:30", "11:00"]'
     and jsonb_array_length(r -> 'dias') = 2 and (r ->> 'duracao')::int = 30
     and pg_temp.livre(r, (select terca from _c), '09:30') = 'true' and pg_temp.livre(r, (select terca from _c), '11:00') = 'true' from _hc),
  'campanha: só os dias e horários dela, com a duração do ensaio dela (30 min às 09:30 não cruza as 10:00)');
select testes.afirmar(
  (select r -> 'ensaios' from _h) @> '[{"nome": "Gestante", "duracao": 60}, {"nome": "Família", "duracao": 90}, {"nome": "Smash the cake"}]'
  and (select jsonb_array_length(r -> 'ensaios') from _h) = 3
  and (select jsonb_array_length(r -> 'campanhas') from _h) = 1
  and (select r -> 'campanhas' -> 0 ->> 'nome' = 'Natal' and (r -> 'campanhas' -> 0 ->> 'restam')::int = 3
         and r -> 'campanhas' -> 0 -> 'horarios' = '["09:30", "11:00"]' and jsonb_array_length(r -> 'campanhas' -> 0 -> 'dias') = 2 from _h)
  and (select r::text not like '%900.00%' and r::text not like '%valor%' and r::text not like '%Joana%' and r::text not like '%977776666%' and r::text not like '%Páscoa%' from _h),
  'mostra só os ensaios da agenda online e a campanha ativa com as vagas, sem preço e sem dado de cliente');

select testes.entrar_como(null);
select testes.afirmar(
  public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), (select fora from _ids)) -> 'dias' = '[]'
  and public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), (select da_outra from _ids)) -> 'dias' = '[]'
  and public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), null, (select parada from _ids)) -> 'dias' = '[]'
  and public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), null, (select campanha_outra from _ids)) -> 'dias' = '[]',
  'ensaio fora da agenda online, de outra conta, campanha parada ou de outra conta: nenhum horário');
select testes.afirmar(
  (select (r ->> 'de')::date from (select public.publico_horarios('t-foto', current_date - 30, current_date + 400) as r) x) >= current_date - 1
  and (select (r ->> 'ate')::date - (r ->> 'de')::date from (select public.publico_horarios('t-foto', current_date, current_date + 400) as r) x) <= 61,
  'nada antes de hoje e no máximo 62 dias por pedido');
select testes.afirmar(public.publico_horarios('t-festa-foto', current_date, current_date + 7) is null, 'conta que não é de fotografia: não responde');
reset role;

-- ---------- o visitante pede o horário de um ensaio ----------
select testes.entrar_como(null);
create temporary table _p as select public.publico_pedido_horario('t-foto', jsonb_build_object(
  'nome', '  Lia Teste ', 'whatsapp', '+55 (11) 98888-7777', 'email', 'Lia@Exemplo.Teste',
  'servico', (select gestante from _ids), 'data', (select terca from _c), 'hora', '09:00',
  'mensagem', 'Estou de 30 semanas'), 'estudio.teste', 'end-1') as r;
reset role;
select testes.afirmar((select r ->> 'ok' = 'true' and r ? 'separada_ate' from _p), 'pedido aceito: ok e até quando o horário fica separado');
select testes.afirmar(
  (select nome = 'Lia Teste' and whatsapp = '11988887777' and email = 'lia@exemplo.teste' and origem = 'agenda_online'
   from public.clientes where whatsapp = '11988887777' and conta_id = (select foto from _c)),
  'o cliente nasce com o WhatsApp normalizado e a origem agenda online');
select testes.afirmar(
  (select p.origem = 'agenda_online' and p.etapa = 'novo' and p.data_desejada = (select terca from _c) and p.hora_desejada = '09:00'
     and p.servico_id = (select gestante from _ids) and p.reserva_id = r.id and r.pedido_id = p.id and r.situacao = 'pre_reserva'
     and r.servico_id = (select gestante from _ids) and r.campanha_id is null
     and r.inicio = ((select terca from _c) + time '09:00') at time zone 'America/Sao_Paulo' and r.fim = r.inicio + interval '60 minutes'
     and p.mensagem = 'Pré-reserva pela agenda online: Gestante, às 09:00. “Estou de 30 semanas”'
   from public.pedidos p join public.reservas r on r.id = p.reserva_id where p.id = (select (r ->> 'pedido')::uuid from _p)),
  'vira pedido no Atendimento (novo) com a pré-reserva do ensaio na Agenda, ligados um ao outro');
select testes.afirmar(
  (select a ->> 'pacote' = 'Gestante' and a ->> 'inicio' = '09:00' and a ->> 'fim' = '10:00'
   from public.aviso_do_pedido((select (r ->> 'pedido')::uuid from _p)) a),
  'o aviso do pedido leva o tipo de ensaio e o horário');

select testes.entrar_como(null);
select testes.afirmar(pg_temp.livre(public.publico_horarios('t-foto', (select terca from _c), (select terca from _c)), (select terca from _c), '09:00') = 'false',
  'depois do pedido, terça às 09:00 aparece ocupado');
select testes.afirmar(
  public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Bia Teste', 'whatsapp', '11955554444', 'servico', (select gestante from _ids), 'data', (select terca from _c), 'hora', '09:00'), 'estudio.teste', 'end-2') ->> 'erro' = 'ocupada',
  'o mesmo horário não é pedido duas vezes');
select testes.afirmar(
  pg_temp.livre(public.publico_horarios('t-foto', (select terca from _c), (select terca from _c), null, (select campanha from _ids)), (select terca from _c), '09:30') = 'false'
  and public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Bia Teste', 'whatsapp', '11955554444', 'campanha', (select campanha from _ids), 'data', (select terca from _c), 'hora', '09:30'), 'estudio.teste', 'end-2') ->> 'erro' = 'ocupada',
  'a campanha às 09:30 cruzaria o ensaio das 09:00: ocupada');

-- ---------- e o horário da campanha ----------
create temporary table _pc as select public.publico_pedido_horario('t-foto', jsonb_build_object(
  'nome', 'Bia Teste', 'whatsapp', '11955554444', 'campanha', (select campanha from _ids), 'data', (select sabado from _c), 'hora', '09:30'),
  'www.estudio.teste', 'end-2') as r;
reset role;
select testes.afirmar(
  (select x.r ->> 'ok' = 'true' from _pc x)
  and (select p.servico_id = (select natal from _ids) and r.campanha_id = (select campanha from _ids) and r.servico_id = (select natal from _ids)
         and r.fim = r.inicio + interval '30 minutes' and p.mensagem = 'Pré-reserva pela agenda online: Natal, às 09:30.'
       from public.pedidos p join public.reservas r on r.id = p.reserva_id where p.id = (select (r ->> 'pedido')::uuid from _pc)),
  'campanha (do www. também): a pré-reserva leva a campanha e o ensaio dela, com a duração dele');
select testes.entrar_como(null);
select testes.afirmar(
  (select (c ->> 'restam')::int from jsonb_array_elements(public.publico_horarios('t-foto', current_date, current_date + 30) -> 'campanhas') c) = 2,
  'a campanha agora tem 2 vagas');
select testes.afirmar(
  public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Cris Teste', 'whatsapp', '11966665555', 'campanha', (select campanha from _ids), 'data', (select sabado from _c), 'hora', '09:30'), 'estudio.teste', 'end-3') ->> 'erro' = 'ocupada',
  'o mesmo horário da campanha não é pedido duas vezes');
reset role;

-- ---------- o que é recusado ----------
create temporary table _ped(campo text, dados jsonb, dominio text);
insert into _ped values
  ('dominio', '{"nome": "Ana", "whatsapp": "11944443333", "hora": "14:00"}', 'golpe.teste'),
  ('whatsapp', '{"nome": "Ana", "whatsapp": "1194444", "hora": "14:00"}', 'estudio.teste'),
  ('nome', '{"nome": "A", "whatsapp": "11944443333", "hora": "14:00"}', 'estudio.teste'),
  ('email', '{"nome": "Ana", "whatsapp": "11944443333", "email": "ana@", "hora": "14:00"}', 'estudio.teste'),
  ('hora', '{"nome": "Ana", "whatsapp": "11944443333", "hora": "11:00"}', 'estudio.teste'),
  ('hora', '{"nome": "Ana", "whatsapp": "11944443333", "hora": "9h"}', 'estudio.teste'),
  ('formato', '{"nome": "Ana", "whatsapp": "11944443333", "hora": "14:00", "servico": "nao-e-id"}', 'estudio.teste');
update _ped set dados = dados || jsonb_build_object('data', (select terca from _c));
insert into _ped select 'data', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '14:00', 'data', (now() at time zone 'America/Sao_Paulo')::date - 1), 'estudio.teste';
insert into _ped select 'formato', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '14:00', 'data', 'amanhã'), 'estudio.teste';
insert into _ped select 'servico', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '14:00', 'data', terca, 'servico', fora) from _c, _ids;
insert into _ped select 'servico', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '14:00', 'data', terca, 'servico', da_outra) from _c, _ids;
insert into _ped select 'hora', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '09:00', 'data', sabado, 'servico', smash) from _c, _ids;
insert into _ped select 'hora', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '14:00', 'data', terca, 'campanha', campanha) from _c, _ids;
insert into _ped select 'data', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '09:30', 'data', terca2, 'campanha', campanha) from _c, _ids;
insert into _ped select 'campanha', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '09:30', 'data', terca, 'campanha', parada) from _c, _ids;
insert into _ped select 'campanha', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'hora', '09:30', 'data', terca, 'campanha', campanha_outra) from _c, _ids;
grant select on _ped to anon, authenticated;
select testes.entrar_como(null);
create temporary table _rec as select p.campo as esperado, p.dados, public.publico_pedido_horario('t-foto', p.dados, p.dominio, 'end-4') as r from _ped p;
select testes.afirmar(public.publico_pedido_horario('t-festa-foto', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select terca from _c), 'hora', '09:00'), 'festa.teste', 'end-4') ->> 'erro' = 'fora',
  'conta que não é de fotografia: pedido fora');
reset role;
do $$ declare x record; begin
  for x in select * from _rec where coalesce(r ->> 'campo', r ->> 'erro') is distinct from esperado loop
    raise exception 'FALHOU: esperava recusa por "%" · dados % · veio %', x.esperado, x.dados, x.r;
  end loop;
end $$;
select testes.afirmar((select count(*) from _rec) = 16, 'as 16 recusas: domínio, dados, hora fora do estúdio ou da campanha, ensaio e campanha de fora');
select testes.afirmar((select count(*) from public.pedidos where conta_id in ((select foto from _c), (select festa from _c))) = 2
  and (select count(*) from public.clientes where conta_id in ((select foto from _c), (select festa from _c))) = 3,
  'nada recusado gravou cliente nem pedido');

-- ---------- as vagas acabam ----------
update public.campanhas set vagas = 1 where id = (select campanha from _ids);
select testes.entrar_como(null);
select testes.afirmar(
  (select bool_and(not (h ->> 'livre')::boolean) from jsonb_array_elements(public.publico_horarios('t-foto', (select terca from _c), (select sabado from _c), null, (select campanha from _ids)) -> 'dias') d,
     jsonb_array_elements(d -> 'horarios') h)
  and (select (c ->> 'restam')::int from jsonb_array_elements(public.publico_horarios('t-foto', current_date, current_date + 30) -> 'campanhas') c) = 0,
  'sem vaga: nenhum horário da campanha livre');
select testes.afirmar(
  public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Cris Teste', 'whatsapp', '11966665555', 'campanha', (select campanha from _ids), 'data', (select sabado from _c), 'hora', '11:00'), 'estudio.teste', 'end-5') ->> 'erro' = 'ocupada',
  'sem vaga: o pedido da campanha é recusado');
reset role;
update public.campanhas set vagas = 3 where id = (select campanha from _ids);

-- ---------- limites: 5 por hora do mesmo endereço; 3 por dia do mesmo WhatsApp ----------
insert into public.publico_tentativas (conta_id, endereco) select foto, 'end-robo' from _c, generate_series(1, 5);
select testes.entrar_como(null);
select testes.afirmar(public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Robô', 'whatsapp', '11933332222', 'data', (select terca from _c), 'hora', '14:00'), 'estudio.teste', 'end-robo') ->> 'erro' = 'limite', 'o mesmo endereço não passa de 5 por hora');
select testes.afirmar(public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Lia', 'whatsapp', '11988887777', 'data', (select terca from _c), 'hora', '14:00'), 'estudio.teste', 'end-6') ->> 'ok' = 'true', 'segundo pedido do mesmo WhatsApp: passa');
select testes.afirmar(public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Lia', 'whatsapp', '11988887777', 'servico', (select smash from _ids), 'data', (select sabado from _c), 'hora', '15:00'), 'estudio.teste', 'end-7') ->> 'ok' = 'true', 'terceiro do mesmo WhatsApp no dia: ainda passa');
select testes.afirmar(public.publico_pedido_horario('t-foto', jsonb_build_object('nome', 'Lia', 'whatsapp', '11988887777', 'campanha', (select campanha from _ids), 'data', (select sabado from _c), 'hora', '11:00'), 'estudio.teste', 'end-8') ->> 'erro' = 'limite', 'o quarto do mesmo WhatsApp no dia: limite');
reset role;
select testes.afirmar((select count(*) from public.clientes where whatsapp = '11988887777' and conta_id = (select foto from _c)) = 1
  and (select nome from public.clientes where whatsapp = '11988887777' and conta_id = (select foto from _c)) = 'Lia Teste',
  'o mesmo WhatsApp é o mesmo cliente, e o nome que já estava fica');

-- ---------- a pré-reserva segura o horário por 48 horas ----------
update public.reservas set criado_em = now() - interval '49 hours' where pedido_id = (select (r ->> 'pedido')::uuid from _p);
select testes.entrar_como(null);
select testes.afirmar(pg_temp.livre(public.publico_horarios('t-foto', (select terca from _c), (select terca from _c)), (select terca from _c), '09:00') = 'true',
  'depois de 48 horas sem confirmar, o horário volta a aparecer livre no site');
reset role;
update public.reservas set situacao = 'confirmada' where pedido_id = (select (r ->> 'pedido')::uuid from _p);
select testes.entrar_como(null);
select testes.afirmar(pg_temp.livre(public.publico_horarios('t-foto', (select terca from _c), (select terca from _c)), (select terca from _c), '09:00') = 'false',
  'confirmado pela fotógrafa, segura o horário para sempre');
reset role;

-- ---------- quando o site não responde ----------
update public.sites set situacao = 'desconectado' where conta_id = (select foto from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_horarios('t-foto', current_date, current_date + 7) is null, 'site desconectado: não responde');
select testes.afirmar(public.publico_pedido_horario('t-foto', '{}', 'estudio.teste', 'x') ->> 'erro' = 'fora', 'site desconectado: pedido fora');
reset role;
update public.sites set situacao = 'conectado' where conta_id = (select foto from _c);
update public.contas_modulos set ligado = false where conta_id = (select foto from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_horarios('t-foto', current_date, current_date + 7) is null, 'módulo desligado: não responde');

-- ---------- o visitante não chega ao ajudante ----------
select pg_temp.erro_com($$select public.campanha_restam(null, null)$$, 'permission denied', 'campanha_restam fechada ao visitante');
reset role;
