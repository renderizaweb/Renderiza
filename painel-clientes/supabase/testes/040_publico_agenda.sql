-- Agenda online (Missão 4A, migração 20261029135228): publico_disponibilidade e publico_pedido, chamadas pelo
-- visitante (anon), como a API do painel chama. Dados fictícios.

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

-- ---------- o cenário: a Villa (eventos) com site, turnos de sábado e sexta, uma festa e um bloqueio ----------
insert into public.contas (nome, nicho, codigo, situacao, origem) values
  ('Villa Alecrim', 'eventos', 't-villa-agenda', 'ativa', 'renderiza'),
  ('Outra Casa', 'eventos', 't-outra-casa', 'ativa', 'renderiza');
create temporary table _c as select
  (select id from public.contas where codigo = 't-villa-agenda') as villa,
  (select id from public.contas where codigo = 't-outra-casa') as outra,
  -- o sábado da semana que vem, o seguinte e a sexta antes dele
  (current_date + ((6 - extract(dow from current_date)::int + 7) % 7) + 7) as sabado;
alter table _c add column sabado2 date, add column sexta date;
update _c set sabado2 = sabado + 7, sexta = sabado - 1;
grant select on _c to anon, authenticated;

insert into public.contas_modulos (conta_id, modulo_id) select villa, 'agenda-online' from _c union all select outra, 'agenda-online' from _c;
insert into public.sites (conta_id, codigo, dominios) select villa, 't-villa', array['villa.teste'] from _c;
insert into public.sites (conta_id, codigo, dominios) select outra, 't-outra', array['outra.teste'] from _c;
insert into public.tipos_reserva (conta_id, nome, checklist) select villa, 'Casamento', array['Degustação'] from _c;
insert into public.tipos_reserva (conta_id, nome) select outra, 'Casamento da outra' from _c;
insert into public.servicos (conta_id, nome, valor, inclui) select villa, 'Clássico', 25000, array['Salão', 'Buffet'] from _c;
insert into public.servicos (conta_id, nome, na_agenda_online) select villa, 'Só por dentro', false from _c;
insert into public.adicionais (conta_id, nome, preco) select villa, 'DJ', 1500 from _c;
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select villa, 6, '11:00', '17:00', 'De dia' from _c;
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select villa, 6, '19:00', '02:00', 'À noite' from _c;
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select villa, 5, '19:00', '02:00', 'À noite' from _c;
insert into public.clientes (conta_id, nome, whatsapp) select villa, 'Patrícia Teste', '11977776666' from _c;
-- sábado à noite já tem festa confirmada
insert into public.reservas (conta_id, cliente_id, inicio, fim, situacao)
  select villa, (select id from public.clientes where nome = 'Patrícia Teste' and conta_id = (select villa from _c)),
         (sabado + time '19:00') at time zone 'America/Sao_Paulo', (sabado + 1 + time '02:00') at time zone 'America/Sao_Paulo', 'confirmada' from _c;
insert into public.bloqueios (conta_id, de, ate, motivo) select villa, sabado2, sabado2, 'Reforma' from _c;

create temporary table _turnos as select
  (select id from public.horarios where nome = 'De dia' and conta_id = (select villa from _c)) as dia,
  (select id from public.horarios where nome = 'À noite' and dia_semana = 6 and conta_id = (select villa from _c)) as noite,
  (select id from public.horarios where nome = 'À noite' and dia_semana = 5 and conta_id = (select villa from _c)) as sexta_noite;
grant select on _turnos to anon, authenticated;
create temporary table _ids as select
  (select id from public.tipos_reserva where nome = 'Casamento' and conta_id = (select villa from _c)) as tipo,
  (select id from public.tipos_reserva where nome = 'Casamento da outra' and conta_id = (select outra from _c)) as tipo_outra,
  (select id from public.servicos where nome = 'Clássico' and conta_id = (select villa from _c)) as pacote,
  (select id from public.servicos where nome = 'Só por dentro' and conta_id = (select villa from _c)) as pacote_fora,
  (select id from public.adicionais where nome = 'DJ' and conta_id = (select villa from _c)) as dj;
grant select on _ids to anon, authenticated;

-- ---------- o visitante vê os dias livres ----------
select testes.entrar_como(null);
create temporary table _d as select public.publico_disponibilidade('t-villa', (select sexta from _c), (select sabado2 from _c)) as r;
reset role;
select testes.afirmar((select r ->> 'nicho' from _d) = 'eventos' and (select (r ->> 'separa_horas')::int from _d) = 48, 'disponibilidade: nicho e as 48 horas');
select testes.afirmar(
  (select jsonb_agg(d -> 'turnos' -> 0 -> 'livre') from _d, jsonb_array_elements(r -> 'dias') d where (d ->> 'data')::date = (select sabado from _c)) = '[true]'
  and (select jsonb_agg(t -> 'livre' order by t ->> 'inicio') from _d, jsonb_array_elements(r -> 'dias') d, jsonb_array_elements(d -> 'turnos') t
       where (d ->> 'data')::date = (select sabado from _c)) = '[true, false]',
  'sábado: de dia livre, à noite ocupado pela festa confirmada');
select testes.afirmar(
  (select bool_and(not (t ->> 'livre')::boolean) from _d, jsonb_array_elements(r -> 'dias') d, jsonb_array_elements(d -> 'turnos') t
   where (d ->> 'data')::date = (select sabado2 from _c)),
  'dia bloqueado: nenhum turno livre');
select testes.afirmar(
  (select count(*) from _d, jsonb_array_elements(r -> 'dias') d where extract(dow from (d ->> 'data')::date) not in (5, 6)) = 0,
  'só aparecem os dias com turno (sexta e sábado)');
select testes.afirmar(
  (select r -> 'pacotes' from _d) @> '[{"nome": "Clássico", "inclui": ["Salão", "Buffet"]}]'
  and (select jsonb_array_length(r -> 'pacotes') from _d) = 1
  and (select r -> 'tipos' from _d) @> '[{"nome": "Casamento"}]' and (select jsonb_array_length(r -> 'tipos') from _d) = 1
  and (select r::text from _d) not like '%25000%' and (select r::text from _d) not like '%1500%' and (select r::text from _d) not like '%Patrícia%'
  and (select r::text from _d) not like '%977776666%',
  'mostra só os pacotes da agenda online e os tipos da conta, sem preço e sem dado de cliente');
select testes.afirmar(
  (select (r ->> 'de')::date from (select public.publico_disponibilidade('t-villa', current_date - 30, current_date + 400) as r) x) >= current_date - 1
  and (select (r ->> 'ate')::date - (r ->> 'de')::date from (select public.publico_disponibilidade('t-villa', current_date, current_date + 400) as r) x) <= 61,
  'nada antes de hoje e no máximo 62 dias por pedido');

-- ---------- o visitante pede a pré-reserva ----------
select testes.entrar_como(null);
create temporary table _p as select public.publico_pedido('t-villa', jsonb_build_object(
  'nome', '  Camila Teste ', 'whatsapp', '+55 (11) 98888-7777', 'email', 'Camila@Exemplo.Teste',
  'tipo', (select tipo from _ids),
  'pacote', (select pacote from _ids),
  'adicionais', jsonb_build_array((select dj from _ids)),
  'data', (select sabado from _c), 'turno', (select dia from _turnos), 'convidados', 120, 'visita', true,
  'mensagem', 'Cerimônia no jardim'), 'villa.teste', 'end-1') as r;
reset role;
select testes.afirmar((select r ->> 'ok' from _p) = 'true' and (select r ? 'separada_ate' from _p), 'pedido aceito: ok e até quando a data fica separada');
select testes.afirmar(
  (select nome = 'Camila Teste' and whatsapp = '11988887777' and email = 'camila@exemplo.teste' and origem = 'agenda_online'
   from public.clientes where whatsapp = '11988887777' and conta_id = (select villa from _c)),
  'o cliente nasce com o WhatsApp normalizado e a origem agenda online');
select testes.afirmar(
  (select p.origem = 'agenda_online' and p.etapa = 'novo' and p.convidados = 120 and p.data_desejada = (select sabado from _c)
     and p.hora_desejada = '11:00' and p.reserva_id = r.id and r.situacao = 'pre_reserva' and r.pedido_id = p.id
     and r.inicio = ((select sabado from _c) + time '11:00') at time zone 'America/Sao_Paulo'
     and p.mensagem like 'Pré-reserva pela agenda online: De dia, 120 convidados. Quer: dj. Quer visitar o espaço. “Cerimônia no jardim”'
   from public.pedidos p join public.reservas r on r.id = p.reserva_id where p.id = (select (r ->> 'pedido')::uuid from _p)),
  'vira pedido no Atendimento (novo) com a pré-reserva na Agenda, ligados um ao outro');
select testes.afirmar(
  (select count(*) from public.reservas_adicionais where conta_id = (select villa from _c)) = 1
  and (select count(*) from public.reservas_checklist rc join public.reservas r on r.id = rc.reserva_id where r.situacao = 'pre_reserva' and r.conta_id = (select villa from _c)) = 1,
  'a pré-reserva leva os adicionais e o checklist do tipo de festa');

select testes.entrar_como(null);
select testes.afirmar(
  (select t -> 'livre' from jsonb_array_elements(public.publico_disponibilidade('t-villa', (select sabado from _c), (select sabado from _c)) -> 'dias') d,
     jsonb_array_elements(d -> 'turnos') t where t ->> 'nome' = 'De dia') = 'false',
  'depois do pedido, o sábado de dia aparece ocupado');
select testes.afirmar(
  public.publico_pedido('t-villa', jsonb_build_object('nome', 'Bruno Teste', 'whatsapp', '11955554444', 'data', (select sabado from _c), 'turno', (select dia from _turnos)), 'villa.teste', 'end-2') ->> 'erro' = 'ocupada',
  'o mesmo turno não é pedido duas vezes');
select testes.afirmar(
  public.publico_pedido('t-villa', jsonb_build_object('nome', 'Camila', 'whatsapp', '11988887777', 'data', (select sexta from _c), 'turno', (select sexta_noite from _turnos)), 'www.villa.teste', 'end-1') ->> 'ok' = 'true',
  'a mesma pessoa pede outra data (do www. também)');
reset role;
select testes.afirmar((select count(*) from public.clientes where whatsapp = '11988887777' and conta_id = (select villa from _c)) = 1
  and (select nome from public.clientes where whatsapp = '11988887777' and conta_id = (select villa from _c)) = 'Camila Teste',
  'o mesmo WhatsApp é o mesmo cliente, e o nome que já estava fica');

-- ---------- o que é recusado ----------
select testes.entrar_como(null);
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos)), 'golpe.teste', 'end-3') ->> 'erro' = 'dominio', 'outro domínio: recusado');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Ana', 'whatsapp', '1194444', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos)), 'villa.teste', 'end-3') ->> 'campo' = 'whatsapp', 'WhatsApp curto: recusado');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'A', 'whatsapp', '11944443333', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos)), 'villa.teste', 'end-3') ->> 'campo' = 'nome', 'nome curto: recusado');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select sexta from _c) + 7, 'turno', (select dia from _turnos)), 'villa.teste', 'end-3') ->> 'campo' = 'turno', 'turno de outro dia da semana: recusado');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', current_date - 1, 'turno', (select dia from _turnos)), 'villa.teste', 'end-3') ->> 'campo' = 'data', 'data passada: recusada');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', 'amanhã', 'turno', (select dia from _turnos)), 'villa.teste', 'end-3') ->> 'campo' = 'formato', 'data em outro formato: recusada');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos), 'tipo', (select tipo_outra from _ids)), 'villa.teste', 'end-3') ->> 'campo' = 'tipo', 'tipo de festa de outra conta: recusado');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos), 'pacote', (select pacote_fora from _ids)), 'villa.teste', 'end-3') ->> 'campo' = 'pacote', 'pacote fora da agenda online: recusado');
select testes.afirmar(public.publico_pedido('t-outra', jsonb_build_object('nome', 'Ana', 'whatsapp', '11944443333', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos)), 'outra.teste', 'end-3') ->> 'campo' = 'turno', 'turno de outra conta: recusado');
reset role;
select testes.afirmar((select count(*) from public.pedidos where conta_id in ((select villa from _c), (select outra from _c))) = 2 and (select count(*) from public.clientes where conta_id in ((select villa from _c), (select outra from _c))) = 2, 'nada recusado gravou cliente nem pedido');

-- limites: 5 pedidos por hora do mesmo endereço; 3 por dia do mesmo WhatsApp
insert into public.publico_tentativas (conta_id, endereco) select villa, 'end-robo' from _c, generate_series(1, 5);
select testes.entrar_como(null);
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Robô', 'whatsapp', '11933332222', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos)), 'villa.teste', 'end-robo') ->> 'erro' = 'limite', 'o mesmo endereço não passa de 5 por hora');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Camila', 'whatsapp', '11988887777', 'data', (select sexta from _c) + 7, 'turno', (select sexta_noite from _turnos)), 'villa.teste', 'end-4') ->> 'ok' = 'true', 'terceiro pedido do mesmo WhatsApp no dia: ainda passa');
select testes.afirmar(public.publico_pedido('t-villa', jsonb_build_object('nome', 'Camila', 'whatsapp', '11988887777', 'data', (select sexta from _c) + 14, 'turno', (select sexta_noite from _turnos)), 'villa.teste', 'end-5') ->> 'erro' = 'limite', 'o quarto do mesmo WhatsApp no dia: limite');
reset role;

-- a pré-reserva da agenda online segura a data por 48 horas
update public.reservas set criado_em = now() - interval '49 hours' where pedido_id = (select (r ->> 'pedido')::uuid from _p);
select testes.entrar_como(null);
select testes.afirmar(
  (select t -> 'livre' from jsonb_array_elements(public.publico_disponibilidade('t-villa', (select sabado from _c), (select sabado from _c)) -> 'dias') d,
     jsonb_array_elements(d -> 'turnos') t where t ->> 'nome' = 'De dia') = 'true',
  'depois de 48 horas sem confirmar, a data volta a aparecer livre no site');
reset role;
update public.reservas set criado_em = now() - interval '49 hours', situacao = 'confirmada' where pedido_id = (select (r ->> 'pedido')::uuid from _p);
select testes.entrar_como(null);
select testes.afirmar(
  (select t -> 'livre' from jsonb_array_elements(public.publico_disponibilidade('t-villa', (select sabado from _c), (select sabado from _c)) -> 'dias') d,
     jsonb_array_elements(d -> 'turnos') t where t ->> 'nome' = 'De dia') = 'false',
  'confirmada pela equipe, segura a data para sempre');
reset role;

-- ---------- quando o site não responde ----------
update public.contas_modulos set ligado = false where conta_id = (select outra from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_disponibilidade('t-outra', current_date, current_date + 7) is null, 'módulo desligado: não responde');
select testes.afirmar(public.publico_pedido('t-outra', '{}', 'outra.teste', 'x') ->> 'erro' = 'fora', 'módulo desligado: pedido fora');
select testes.afirmar(public.publico_disponibilidade('nao-existe', current_date, current_date + 7) is null, 'código que não existe: não responde');
reset role;
update public.sites set situacao = 'desconectado' where conta_id = (select villa from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_disponibilidade('t-villa', current_date, current_date + 7) is null, 'site desconectado: não responde');
reset role;
update public.sites set situacao = 'conectado' where conta_id = (select villa from _c);
update public.contas set situacao = 'desligada' where id = (select villa from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_disponibilidade('t-villa', current_date, current_date + 7) is null, 'conta desligada: não responde');
reset role;
update public.contas set situacao = 'teste', teste_ate = now() + interval '3 days' where id = (select villa from _c);
select testes.entrar_como(null);
select testes.afirmar(public.publico_disponibilidade('t-villa', current_date, current_date + 7) is not null, 'conta no teste: responde');

-- ---------- o visitante não chega aos ajudantes nem às tentativas ----------
select pg_temp.erro_com($$select public.conta_do_site('t-villa', 'agenda-online')$$, 'permission denied', 'conta_do_site fechada ao visitante');
select pg_temp.erro_com($$select public.periodo_livre(null, now(), now())$$, 'permission denied', 'periodo_livre fechada ao visitante');
select pg_temp.erro_com($$select count(*) from public.publico_tentativas$$, 'permission denied', 'o visitante não lê as tentativas');
reset role;
