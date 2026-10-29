-- O negócio e o dia a dia (migração 20261029110100): isolamento entre contas em todas as tabelas, "só vê" ×
-- "edita", valores só no Financeiro e em Contratos, ligações sempre dentro da conta, a situação do cliente,
-- fechar pedido, juntar clientes e o contrato congelado. Dados fictícios (WhatsApp com DDD 00, que não existe).

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

create function pg_temp.contar(tabela text, conta uuid) returns bigint language plpgsql as $f$
declare n bigint;
begin
  execute format('select count(*) from public.%I where conta_id = %L', tabela, conta) into n;
  return n;
end $f$;

-- Uma linha em cada tabela, para a conta dada.
create function pg_temp.montar(conta uuid, n int) returns void language plpgsql as $f$
declare t uuid; s uuid; a uuid; c uuid; p uuid; r uuid; m uuid; camp uuid;
begin
  insert into public.tipos_reserva (conta_id, nome, cor, checklist) values (conta, 'Casamento', '#d6456b', array['Contrato assinado', 'Degustação do cardápio']) returning id into t;
  insert into public.servicos (conta_id, nome, valor, sinal, convidados_inclusos) values (conta, 'Clássico', 26500, 7950, 100) returning id into s;
  insert into public.adicionais (conta_id, nome, preco) values (conta, 'Mesa de doces', 2400) returning id into a;
  insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) values (conta, 6, '19:00', '02:00', 'À noite');
  insert into public.bloqueios (conta_id, de, ate, motivo) values (conta, current_date + 100, current_date + 101, 'Reforma');
  insert into public.campanhas (conta_id, nome, servico_id, dias, horarios, vagas) values (conta, 'Natal', s, array[current_date + 30], array['09:00'::time], 10) returning id into camp;
  insert into public.clientes (conta_id, nome, whatsapp, email, origem)
    values (conta, 'Juliana ' || n, '(00) 90000-01' || lpad(n::text, 2, '0'), 'Juliana' || n || '@Cliente.teste', 'instagram') returning id into c;
  insert into public.clientes_fichas (cliente_id, conta_id, observacoes) values (c, conta, 'Quer cerimônia no jardim');
  insert into public.pedidos (conta_id, cliente_id, data_desejada, servico_id, tipo_id, convidados, origem, etapa)
    values (conta, c, current_date + 60, s, t, 150, 'instagram', 'visita_marcada') returning id into p;
  insert into public.reservas (conta_id, cliente_id, pedido_id, servico_id, tipo_id, inicio, fim, convidados, situacao)
    values (conta, c, p, s, t, now() + interval '60 days', now() + interval '60 days 8 hours', 150, 'confirmada') returning id into r;
  insert into public.reservas_adicionais (conta_id, reserva_id, adicional_id) values (conta, r, a);
  insert into public.reservas_valores (reserva_id, conta_id, valor_total, sinal) values (r, conta, 28900, 8670);
  insert into public.compromissos (conta_id, tipo, titulo, inicio, cliente_id, reserva_id) values (conta, 'degustacao', 'Degustação', now() + interval '10 days', c, r);
  insert into public.lista_espera (conta_id, campanha_id, cliente_id, preferencia) values (conta, camp, c, 'sábado à tarde');
  insert into public.parcelas (conta_id, cliente_id, reserva_id, descricao, valor, vence_em, forma) values (conta, c, r, 'Entrada', 8670, current_date, 'pix');
  insert into public.modelos_contrato (conta_id, nome, texto) values (conta, 'Padrão', 'Contrato de {cliente} para {data}.') returning id into m;
  insert into public.contratos (conta_id, cliente_id, reserva_id, modelo_id, texto, situacao) values (conta, c, r, m, 'Contrato da Juliana.', 'enviado');
  insert into public.entregas (conta_id, reserva_id, cliente_id, situacao) values (conta, r, c, 'edicao');
end $f$;

-- ---------- o cenário ----------
create temporary table _u as select
  testes.criar_usuario('marina@villa.teste') as marina,
  testes.criar_usuario('rafael@villa.teste') as rafael,
  testes.criar_usuario('bia@villa.teste') as bia,
  testes.criar_usuario('leo@villa.teste') as leo,
  testes.criar_usuario('carla@villa.teste') as carla,
  testes.criar_usuario('lia@ciranda.teste') as lia;
grant select on _u to anon, authenticated;

insert into public.contas (nome, nicho, codigo, situacao, origem) values
  ('Villa Alecrim', 'eventos', 'villa-alecrim', 'ativa', 'renderiza'),
  ('Estúdio Ciranda', 'fotografia', 'estudio-ciranda', 'ativa', 'renderiza');
create temporary table _c as select
  (select id from public.contas where codigo = 'villa-alecrim') as villa,
  (select id from public.contas where codigo = 'estudio-ciranda') as ciranda;
grant select on _c to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id)
  select conta, m from _c, unnest(array[villa, ciranda]) as conta, unnest(array['agenda', 'atendimento', 'clientes', 'contratos', 'financeiro']) as m;

insert into public.pessoas (conta_id, usuario_id, nome, dono, acessos) values
  ((select villa from _c), (select marina from _u), 'Marina Alves', true, '{}'),
  ((select villa from _c), (select rafael from _u), 'Rafael Costa', false, '{"agenda": "editar", "atendimento": "editar", "clientes": "editar", "contratos": "editar", "financeiro": null}'),
  ((select villa from _c), (select bia from _u), 'Beatriz Lima', false, '{"agenda": "ver", "clientes": "ver", "financeiro": "editar"}'),
  ((select villa from _c), (select leo from _u), 'Léo Santos', false, '{"agenda": "editar", "clientes": "ver"}'),
  ((select villa from _c), (select carla from _u), 'Carla Dias', false, '{"agenda": "ver"}'),
  ((select ciranda from _c), (select lia from _u), 'Lia Moreno', true, '{}');

select pg_temp.montar((select villa from _c), 1);
select pg_temp.montar((select ciranda from _c), 2);

create temporary table _tabelas (nome text);
insert into _tabelas values ('tipos_reserva'), ('servicos'), ('adicionais'), ('horarios'), ('bloqueios'), ('campanhas'),
  ('clientes'), ('clientes_fichas'), ('pedidos'), ('reservas'), ('reservas_adicionais'), ('reservas_valores'),
  ('reservas_checklist'), ('compromissos'), ('lista_espera'), ('parcelas'), ('modelos_contrato'), ('contratos'), ('entregas');
grant select on _tabelas to anon, authenticated;
create temporary table _ids as select (select id from public.clientes where nome = 'Juliana 1') as juliana_villa,
  (select id from public.clientes where nome = 'Juliana 2') as juliana_ciranda;
grant select on _ids to authenticated;

select testes.afirmar(
  not exists (select 1 from _tabelas, _c where pg_temp.contar(nome, villa) = 0 or pg_temp.contar(nome, ciranda) = 0),
  'o cenário tem linha em todas as tabelas, nas duas contas');

-- ---------- sem login: nada ----------
select testes.entrar_como(null);
do $$
declare t text;
begin
  for t in select nome from _tabelas loop
    perform pg_temp.erro_com(format('select count(*) from public.%I', t), 'permission denied', 'visitante não lê ' || t);
  end loop;
end $$;
reset role;

-- ---------- uma conta nunca vê a outra (em todas as tabelas) ----------
select testes.entrar_como((select lia from _u));
select testes.afirmar(
  (select string_agg(nome, ', ') from _tabelas, _c where pg_temp.contar(nome, villa) > 0) is null,
  'Lia (Ciranda) não vê nada da Villa');
select testes.afirmar(
  (select string_agg(nome, ', ') from _tabelas, _c where pg_temp.contar(nome, ciranda) = 0) is null,
  'Lia vê a Ciranda inteira');
update public.clientes set nome = 'Invadida' where conta_id = (select villa from _c);
update public.parcelas set valor = 1 where conta_id = (select villa from _c);
delete from public.reservas_valores where conta_id = (select villa from _c);
select pg_temp.erro_com($$insert into public.clientes (conta_id, nome) select villa, 'Intrusa' from _c$$, 'row-level security', 'Lia não cria cliente na Villa');
-- ligação de outra conta: a chave composta barra mesmo quem conhece o id
select pg_temp.erro_com($$insert into public.reservas (conta_id, cliente_id, inicio, fim)
  select ciranda, (select juliana_villa from _ids), now(), now() + interval '1 hour' from _c$$, 'foreign key', 'Lia não liga reserva dela a cliente da Villa, nem sabendo o id');
reset role;
select testes.afirmar((select count(*) from public.clientes where nome = 'Invadida') = 0, 'Lia não muda cliente da Villa');
select testes.afirmar((select count(*) from public.parcelas where valor = 1) = 0, 'Lia não muda parcela da Villa');
select testes.afirmar((select count(*) from public.reservas_valores where conta_id = (select villa from _c)) = 1, 'Lia não apaga valores da Villa');

select testes.entrar_como((select marina from _u));
select testes.afirmar(
  (select string_agg(nome, ', ') from _tabelas, _c where pg_temp.contar(nome, ciranda) > 0) is null,
  'Marina (Villa) não vê nada da Ciranda');
select testes.afirmar(
  (select string_agg(nome, ', ') from _tabelas, _c where pg_temp.contar(nome, villa) = 0) is null,
  'Marina (dona) vê a Villa inteira');
select pg_temp.erro_com($$insert into public.reservas (conta_id, cliente_id, inicio, fim)
  select villa, (select juliana_ciranda from _ids), now(), now() + interval '1 hour' from _c$$,
  'foreign key', 'reserva da Villa não aponta para cliente da Ciranda, nem sabendo o id');
reset role;
-- nem o banco (sem RLS) liga uma conta à outra
select pg_temp.erro_com($$insert into public.reservas (conta_id, cliente_id, inicio, fim)
  select villa, (select id from public.clientes where conta_id = (select ciranda from _c)), now(), now() + interval '1 hour' from _c$$,
  'foreign key', 'chave composta: cliente de outra conta');
select pg_temp.erro_com($$insert into public.parcelas (conta_id, cliente_id, reserva_id, descricao, valor, vence_em)
  select villa, (select id from public.clientes where conta_id = (select villa from _c)), (select id from public.reservas where conta_id = (select ciranda from _c)), 'x', 1, current_date from _c$$,
  'foreign key', 'chave composta: reserva de outra conta');

-- ---------- "só vê" × "edita" e os valores escondidos ----------
select testes.entrar_como((select leo from _u));  -- Agenda (edita) e Clientes (só vê)
select testes.afirmar((select count(*) from public.reservas) = 1 and (select count(*) from public.compromissos) = 1, 'Léo vê a agenda');
select testes.afirmar((select count(*) from public.clientes_fichas) = 1, 'Léo vê a ficha (Clientes, só vê)');
select testes.afirmar((select count(*) from public.reservas_valores) = 0, 'Léo não vê os valores da reserva');
select testes.afirmar((select count(*) from public.parcelas) = 0, 'Léo não vê as parcelas');
select testes.afirmar((select count(*) from public.contratos) = 0 and (select count(*) from public.modelos_contrato) = 0, 'Léo não vê os contratos');
select testes.afirmar((select count(*) from public.pedidos) = 0, 'Léo não vê o Atendimento');
select testes.afirmar((select count(*) from public.servicos) = 1, 'Léo vê os serviços');
update public.clientes_fichas set observacoes = 'mudei';
update public.reservas_checklist set feito = true where ordem = 1;
insert into public.bloqueios (conta_id, de, ate, motivo) select villa, current_date + 200, current_date + 200, 'Folga' from _c;
select pg_temp.erro_com($$insert into public.servicos (conta_id, nome) select villa, 'Novo pacote' from _c$$, 'row-level security', 'Léo não cria serviço');
reset role;
select testes.afirmar((select observacoes from public.clientes_fichas where conta_id = (select villa from _c)) = 'Quer cerimônia no jardim', 'Léo só vê a ficha: não muda');
select testes.afirmar(
  (select feito_por = (select id from public.pessoas where nome = 'Léo Santos') and feito_em is not null
   from public.reservas_checklist where conta_id = (select villa from _c) and ordem = 1),
  'checklist: Léo marca e fica registrado quem marcou');
select testes.afirmar((select count(*) from public.bloqueios where motivo = 'Folga') = 1, 'Agenda (edita) fecha uma data');

select testes.entrar_como((select carla from _u));  -- Agenda, só vê
select testes.afirmar((select count(*) from public.reservas) = 1, 'Carla vê a agenda');
update public.reservas set convidados = 1;
update public.compromissos set titulo = 'mudei';
select pg_temp.erro_com($$insert into public.reservas (conta_id, cliente_id, inicio, fim)
  select villa, (select id from public.clientes limit 1), now(), now() + interval '1 hour' from _c$$, 'row-level security', 'Carla (só vê) não reserva');
select pg_temp.erro_com($$insert into public.clientes (conta_id, nome) select villa, 'Nova' from _c$$, 'row-level security', 'Carla (só vê) não cria cliente');
reset role;
select testes.afirmar((select convidados from public.reservas where conta_id = (select villa from _c)) = 150, 'Carla só vê: não muda a reserva');
select testes.afirmar((select titulo from public.compromissos where conta_id = (select villa from _c)) = 'Degustação', 'Carla só vê: não muda o compromisso');

select testes.entrar_como((select bia from _u));  -- Financeiro (edita), Agenda e Clientes (só vê)
select testes.afirmar((select count(*) from public.parcelas) = 1 and (select count(*) from public.reservas_valores) = 1, 'Bia vê as parcelas e os valores');
update public.parcelas set pago_em = current_date;
insert into public.clientes (conta_id, nome, whatsapp) select villa, 'Pagadora', '00 90000 0199' from _c;
reset role;
select testes.afirmar((select pago_em from public.parcelas where conta_id = (select villa from _c)) = current_date, 'Bia dá baixa na parcela');
select testes.afirmar((select whatsapp from public.clientes where nome = 'Pagadora') = '00900000199', 'quem edita o Financeiro cria cliente (o "Para quem?")');

select testes.entrar_como((select rafael from _u));  -- tudo menos Financeiro
select testes.afirmar((select count(*) from public.parcelas) = 0, 'Rafael (sem Financeiro) não vê as parcelas');
select testes.afirmar((select count(*) from public.reservas_valores) = 1, 'Rafael vê os valores pelos Contratos');
select testes.afirmar((select count(*) from public.contratos) = 1, 'Rafael vê os contratos');
reset role;

-- módulo desligado: os dados ficam, ninguém vê
update public.contas_modulos set ligado = false where conta_id = (select villa from _c) and modulo_id = 'financeiro';
select testes.entrar_como((select bia from _u));
select testes.afirmar((select count(*) from public.parcelas) = 0, 'Financeiro desligado: Bia não vê as parcelas');
reset role;
select testes.entrar_como((select marina from _u));
select testes.afirmar((select count(*) from public.parcelas) = 0, 'Financeiro desligado: nem o dono');
reset role;
update public.contas_modulos set ligado = true where conta_id = (select villa from _c) and modulo_id = 'financeiro';
select testes.afirmar((select count(*) from public.parcelas where conta_id = (select villa from _c)) = 1, 'os dados continuam lá');

-- teste vencido: nada do dia a dia
update public.contas set situacao = 'teste', teste_ate = now() - interval '1 hour' where id = (select villa from _c);
select testes.entrar_como((select marina from _u));
select testes.afirmar(
  (select string_agg(nome, ', ') from _tabelas, _c where pg_temp.contar(nome, villa) > 0) is null,
  'teste vencido: o banco não entrega nenhum dado da conta');
reset role;
update public.contas set situacao = 'ativa' where id = (select villa from _c);

-- ---------- uma pessoa, um cliente ----------
select pg_temp.erro_com($$insert into public.clientes (conta_id, nome, whatsapp) select villa, 'Outra Juliana', '+55 (00) 90000-0101' from _c$$,
  'duplicate key', 'o mesmo WhatsApp não vira dois clientes na conta');
insert into public.clientes (conta_id, nome, whatsapp, instagram) select ciranda, 'Juliana na Ciranda', '+55 00 90000-0101', '@Juliana.Fotos' from _c;
select testes.afirmar(
  (select whatsapp = '00900000101' and instagram = 'juliana.fotos' from public.clientes where nome = 'Juliana na Ciranda'),
  'o mesmo WhatsApp em outra conta pode; WhatsApp e Instagram normalizados');
select testes.afirmar((select email from public.clientes where nome = 'Juliana 1') = 'juliana1@cliente.teste', 'e-mail do cliente em minúsculas');

-- ---------- a situação do cliente ----------
insert into public.clientes (conta_id, nome) select villa, n from _c, unnest(array['Só pediu', 'Perdeu', 'Já fez', 'Sem nada']) as n;
insert into public.pedidos (conta_id, cliente_id, etapa) select villa, (select id from public.clientes where nome = 'Só pediu'), 'novo' from _c;
insert into public.pedidos (conta_id, cliente_id, etapa) select villa, (select id from public.clientes where nome = 'Perdeu'), 'perdido' from _c;
insert into public.reservas (conta_id, cliente_id, inicio, fim, situacao)
  select villa, (select id from public.clientes where nome = 'Já fez'), now() - interval '30 days', now() - interval '29 days 20 hours', 'realizada' from _c;
select testes.entrar_como((select carla from _u));
select testes.afirmar(
  (select jsonb_object_agg(c.nome, public.situacao(c)) from public.clientes c where c.nome in ('Juliana 1', 'Só pediu', 'Perdeu', 'Já fez', 'Sem nada'))
  = '{"Juliana 1": "reservado", "Só pediu": "interessado", "Perdeu": "nao_fechou", "Já fez": "realizado", "Sem nada": null}'::jsonb,
  'situação calculada: reservado, interessado, não fechou, realizado; e nada para quem não tem nada');
reset role;
select testes.entrar_como((select lia from _u));
select testes.afirmar(
  (select public.situacao(c) from public.clientes c where c.nome = 'Juliana 1') is null,
  'situação de cliente de outra conta: nada');
reset role;

-- ---------- fechar o pedido vira reserva sem digitar de novo ----------
insert into public.pedidos (conta_id, cliente_id, servico_id, tipo_id, convidados, etapa)
  select villa, (select id from public.clientes where nome = 'Só pediu'), (select id from public.servicos where conta_id = villa),
         (select id from public.tipos_reserva where conta_id = villa), 120, 'orcamento_enviado' from _c;
create temporary table _ped as select id from public.pedidos where etapa = 'orcamento_enviado';
grant select on _ped to authenticated;
select testes.entrar_como((select leo from _u));
select pg_temp.erro_com($$select public.fechar_pedido((select id from _ped), now() + interval '90 days', now() + interval '90 days 6 hours')$$,
  'Pedido não encontrado', 'Léo (sem Atendimento) não fecha pedido');
reset role;
select testes.entrar_como((select rafael from _u));
create temporary table _res as select public.fechar_pedido((select id from _ped), now() + interval '90 days', now() + interval '90 days 6 hours') as id;
reset role;
select testes.afirmar(
  (select r.cliente_id = p.cliente_id and r.servico_id = p.servico_id and r.tipo_id = p.tipo_id and r.convidados = 120
      and r.pedido_id = p.id and r.situacao = 'pre_reserva' and p.etapa = 'fechado' and p.reserva_id = r.id
   from public.reservas r join public.pedidos p on p.id = (select id from _ped) where r.id = (select id from _res)),
  'fechar: a reserva nasce com o cliente, o serviço, o tipo e os convidados; o pedido guarda o link');
select testes.afirmar((select count(*) from public.reservas_checklist where reserva_id = (select id from _res)) = 2, 'a reserva nova ganha o checklist do tipo');

-- ---------- o contrato congelado ----------
select testes.afirmar(
  (select hash = encode(sha256(convert_to(texto, 'UTF8')), 'hex') from public.contratos where conta_id = (select villa from _c)),
  'o contrato guarda o hash do texto');
select testes.entrar_como((select rafael from _u));
select pg_temp.erro_com($$update public.contratos set situacao = 'aceito', aceito_em = now(), aceito_nome = 'Eu mesmo'$$, 'O aceite é registrado pelo link', 'o painel não grava aceite');
update public.contratos set texto = 'Contrato da Juliana, com a cláusula nova.';
reset role;
select testes.afirmar(
  (select hash = encode(sha256(convert_to('Contrato da Juliana, com a cláusula nova.', 'UTF8')), 'hex') from public.contratos where conta_id = (select villa from _c)),
  'antes do aceite o texto muda e o hash acompanha');
-- o aceite (como a função pública da Missão 3 vai gravar)
update public.contratos set situacao = 'aceito', aceito_em = now(), aceito_nome = 'Juliana', aceito_ip = '192.0.2.1' where conta_id = (select villa from _c);
select testes.entrar_como((select rafael from _u));
select pg_temp.erro_com($$update public.contratos set texto = 'outro texto'$$, 'Contrato aceito não muda', 'aceito: o texto não muda');
select pg_temp.erro_com($$update public.contratos set situacao = 'enviado'$$, 'Contrato aceito não muda', 'aceito: não volta para enviado');
update public.contratos set situacao = 'cancelado';
reset role;
select testes.afirmar((select situacao = 'cancelado' and cancelado_em is not null from public.contratos where conta_id = (select villa from _c)), 'aceito pode ser cancelado');

-- ---------- juntar clientes ----------
insert into public.clientes (conta_id, nome, email, instagram) select villa, 'Juliana Souza', 'ju@cliente.teste', 'juju.souza' from _c;
insert into public.reservas (conta_id, cliente_id, inicio, fim)
  select villa, (select id from public.clientes where nome = 'Juliana Souza'), now() + interval '120 days', now() + interval '120 days 5 hours' from _c;
insert into public.parcelas (conta_id, cliente_id, reserva_id, descricao, valor, vence_em)
  select r.conta_id, r.cliente_id, r.id, 'Sinal', 500, current_date from public.reservas r join public.clientes c on c.id = r.cliente_id where c.nome = 'Juliana Souza';
insert into public.clientes_fichas (cliente_id, conta_id, observacoes, endereco)
  select id, conta_id, 'Prefere falar à noite', 'Rua das Flores, 10' from public.clientes where nome = 'Juliana Souza';
create temporary table _jun as select (select id from public.clientes where nome = 'Juliana 1') as fica, (select id from public.clientes where nome = 'Juliana Souza') as sai;
grant select on _jun to authenticated;
select testes.entrar_como((select bia from _u));
select pg_temp.erro_com($$select public.juntar_clientes((select fica from _jun), (select sai from _jun))$$, 'Escolha dois clientes', 'Bia (Clientes, só vê) não junta');
reset role;
select testes.entrar_como((select marina from _u));
select testes.afirmar(public.juntar_clientes((select fica from _jun), (select sai from _jun)) = (select fica from _jun), 'Marina junta as duas fichas');
reset role;
select testes.afirmar((select count(*) from public.clientes where id = (select sai from _jun)) = 0, 'a ficha repetida some');
select testes.afirmar(
  (select count(*) from public.reservas where cliente_id = (select fica from _jun)) = 2
  and (select count(*) from public.parcelas where cliente_id = (select fica from _jun)) = 2
  and (select count(*) from public.parcelas where cliente_id = (select sai from _jun)) = 0,
  'as reservas e as parcelas vão para a que fica');
select testes.afirmar(
  (select email = 'juliana1@cliente.teste' and instagram = 'juju.souza' and whatsapp = '00900000101' from public.clientes where id = (select fica from _jun))
  and (select observacoes like 'Quer cerimônia no jardim%Prefere falar à noite' and endereco = 'Rua das Flores, 10' from public.clientes_fichas where cliente_id = (select fica from _jun)),
  'fica o que a que fica já tinha; o que faltava (Instagram, endereço, observações) vem junto');

-- ---------- nada some do histórico ----------
select testes.entrar_como((select marina from _u));
select pg_temp.erro_com($$delete from public.clientes where nome = 'Juliana 1'$$, 'foreign key', 'cliente com reserva não se apaga (arquiva)');
update public.clientes set arquivado_em = now() where nome = 'Juliana 1';
reset role;
select testes.afirmar((select arquivado_em is not null from public.clientes where nome = 'Juliana 1'), 'arquivar');

-- ---------- entregas ----------
update public.entregas set situacao = 'entregue', link_galeria = 'https://galeria.exemplo.teste/juliana' where conta_id = (select ciranda from _c);
select testes.afirmar((select entregue_em = current_date from public.entregas where conta_id = (select ciranda from _c)), 'entregue: a data fica registrada');
select pg_temp.erro_com($$update public.entregas set link_galeria = 'javascript:alert(1)'$$, 'entregas_link_galeria_check', 'o link da galeria é só https');
