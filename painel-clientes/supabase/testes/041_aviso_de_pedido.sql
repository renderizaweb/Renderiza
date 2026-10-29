-- O aviso por e-mail de pedido novo da agenda online (migração 20261029141139): aviso_do_pedido, só para a chave
-- secreta (a função do Supabase avisar-pedido), uma vez só por pedido. Dados fictícios.

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

create temporary table _u as select testes.criar_usuario('dona@aviso.teste') as dona;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Casa do Aviso', 'eventos', 't-casa-do-aviso', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-casa-do-aviso') as casa,
  (current_date + ((6 - extract(dow from current_date)::int + 7) % 7) + 7) as sabado;
grant select on _c, _u to anon, authenticated, service_role;
insert into public.contas_modulos (conta_id, modulo_id) select casa, 'agenda-online' from _c;
insert into public.sites (conta_id, codigo, dominios) select casa, 't-aviso', array['aviso.teste'] from _c;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select casa, (select dona from _u), 'Dona Teste', 'dona@aviso.teste', true from _c;
insert into public.pessoas (conta_id, nome, email, dono) select casa, 'Equipe Teste', 'equipe@aviso.teste', false from _c;
insert into public.tipos_reserva (conta_id, nome) select casa, 'Casamento' from _c;
insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select casa, 6, '19:00', '02:00', 'À noite' from _c;
create temporary table _ids as select
  (select id from public.horarios where conta_id = (select casa from _c)) as turno,
  (select id from public.tipos_reserva where conta_id = (select casa from _c)) as tipo;
grant select on _ids to anon, authenticated, service_role;

select testes.entrar_como(null);
create temporary table _p as select public.publico_pedido('t-aviso', jsonb_build_object('nome', 'Camila Teste', 'whatsapp', '11988887777',
  'data', (select sabado from _c), 'turno', (select turno from _ids), 'tipo', (select tipo from _ids), 'convidados', 80), 'aviso.teste', 'e-1') as r;
grant select on _p to anon, authenticated, service_role;
select pg_temp.erro_com($$select public.aviso_do_pedido((select (r ->> 'pedido')::uuid from _p))$$, 'permission denied', 'o visitante não pede o aviso');
reset role;

select set_config('role', 'service_role', true);
create temporary table _a as select public.aviso_do_pedido((select (r ->> 'pedido')::uuid from _p)) as a;
create temporary table _b as select public.aviso_do_pedido((select (r ->> 'pedido')::uuid from _p)) as a;
reset role;
select testes.afirmar(
  (select a ->> 'conta' from _a) = 'Casa do Aviso'
  and (select a -> 'para' from _a) = '["dona@aviso.teste"]'
  and (select a -> 'cliente' ->> 'nome' from _a) = 'Camila Teste' and (select a -> 'cliente' ->> 'whatsapp' from _a) = '11988887777'
  and (select a ->> 'tipo' from _a) = 'Casamento' and (select (a ->> 'convidados')::int from _a) = 80
  and (select a ->> 'inicio' from _a) = '19:00' and (select a ->> 'fim' from _a) = '02:00'
  and (select (a ->> 'data')::date from _a) = (select sabado from _c),
  'o aviso: para os donos ativos com e-mail, com o cliente, a data, o turno e o pedido');
select testes.afirmar((select a from _b) is null, 'o mesmo pedido não avisa duas vezes');

-- pedido que não é da agenda online, ou antigo: sem aviso
insert into public.clientes (conta_id, nome, whatsapp) select casa, 'Bruno Teste', '11977776666' from _c;
insert into public.pedidos (conta_id, cliente_id, origem) select casa, (select id from public.clientes where whatsapp = '11977776666' and conta_id = (select casa from _c)), 'whatsapp' from _c;
update public.pedidos set criado_em = now() - interval '20 minutes' where conta_id = (select casa from _c) and origem = 'whatsapp';
create temporary table _outros as select id, origem from public.pedidos where conta_id = (select casa from _c) and origem = 'whatsapp';
grant select on _outros to service_role;
select set_config('role', 'service_role', true);
create temporary table _c2 as select public.aviso_do_pedido((select id from _outros)) as zap, public.aviso_do_pedido(gen_random_uuid()) as nada;
reset role;
select testes.afirmar((select zap from _c2) is null, 'pedido do WhatsApp (anotado pela equipe) não avisa');
select testes.afirmar((select nada from _c2) is null, 'pedido que não existe: nada');
select testes.afirmar((select count(*) from public.pedidos_avisos where conta_id = (select casa from _c)) = 1, 'um aviso registrado');
