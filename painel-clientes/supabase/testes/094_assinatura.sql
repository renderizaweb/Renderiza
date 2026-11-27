-- A assinatura (migração 20261126150000; 13-assinatura.md): só a Renderiza grava o combinado; o dono lê o combinado e
-- os pagamentos por minha_assinatura (sem a observação), até com a conta desligada; a equipe e a vizinha, nada.
-- Dados fictícios.

insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Loja Assinante', 'automotivo', 't-loja-assinante', 'ativa', 'renderiza'),
  ('Loja Vizinha', 'automotivo', 't-loja-vizinha', 'ativa', 'renderiza');
create temporary table _a as select (select id from public.contas where codigo = 't-loja-assinante') as conta, (select id from public.contas where codigo = 't-loja-vizinha') as vizinha,
  testes.criar_usuario('renderiza@assinatura.teste') as renderiza, testes.criar_usuario('dono@assinatura.teste') as dono,
  testes.criar_usuario('vendedor@assinatura.teste') as vendedor, testes.criar_usuario('dono@vizinha.teste') as outro;
grant select on _a to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select renderiza, 'Renderiza Teste' from _a;
insert into public.pessoas (conta_id, usuario_id, nome, dono, acessos) select conta, dono, 'Dono', true, '{}'::jsonb from _a
  union all select conta, vendedor, 'Vendedor', false, '{"configuracoes": "editar"}'::jsonb from _a
  union all select vizinha, outro, 'Vizinho', true, '{}'::jsonb from _a;

-- a Renderiza combina e registra
select testes.entrar_como((select renderiza from _a));
insert into public.assinaturas (conta_id, dia, inicio) select conta, 26, '2026-12-26' from _a;
insert into public.pagamentos (conta_id, mes, valor, pago_em, observacao) select conta, '2026-12-01', 49, '2026-12-26', 'nota interna' from _a;
select testes.afirmar((select (minha_assinatura(conta) ->> 'dia')::int from _a) = 26, 'a Renderiza lê o combinado');

-- o dono lê o combinado e os pagamentos, sem a observação, e não muda nada
select testes.entrar_como((select dono from _a));
select testes.afirmar((select minha_assinatura(conta) ->> 'inicio' from _a) = '2026-12-26', 'o dono lê a primeira mensalidade');
select testes.afirmar((select jsonb_array_length(minha_assinatura(conta) -> 'pagamentos') from _a) = 1, 'o dono lê os pagamentos');
select testes.afirmar((select (minha_assinatura(conta) -> 'pagamentos' -> 0) ? 'observacao' from _a) = false, 'a observação da Renderiza não vai para o dono');
select testes.afirmar((select (minha_assinatura(conta) -> 'pagamentos' -> 0 ->> 'valor')::numeric from _a) = 49, 'o valor do pagamento');
select testes.afirmar((select count(*) from public.assinaturas) = 0, 'o dono não lê a tabela direto');
update public.assinaturas set dia = 1;
select testes.entrar_como((select renderiza from _a));
select testes.afirmar((select dia from public.assinaturas where conta_id = (select conta from _a)) = 26, 'o dono não muda o combinado');

-- conta desligada: o dono continua vendo o que falta
update public.contas set situacao = 'desligada' where id = (select conta from _a);
select testes.entrar_como((select dono from _a));
select testes.afirmar((select minha_assinatura(conta) is not null from _a), 'com a conta desligada, o dono ainda vê a assinatura');

-- a equipe (mesmo com Configurações) e a vizinha não veem; sem combinado, o dono vê os campos vazios
select testes.entrar_como((select vendedor from _a));
select testes.afirmar((select minha_assinatura(conta) is null from _a), 'quem não é dono não vê a assinatura');
select testes.entrar_como((select outro from _a));
select testes.afirmar((select minha_assinatura(conta) is null from _a), 'a vizinha não vê a assinatura de outra conta');
select testes.afirmar((select minha_assinatura(vizinha) ->> 'inicio' from _a) is null and (select jsonb_array_length(minha_assinatura(vizinha) -> 'pagamentos') from _a) = 0, 'sem combinado: vazio');
select testes.entrar_como(null);
select testes.afirmar_erro($$select public.minha_assinatura((select conta from _a))$$, 'o visitante não chama');
