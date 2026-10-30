-- A conta nasce da demo (Missão 7, bloco C; migração 20261030240000; D41, D51): o catálogo das demos e o contexto
-- da conta são só da Renderiza (o dono não vê a conversa colada nem a demo; o visitante, nada). Dados fictícios.

create temporary table _u as select
  testes.criar_usuario('renderiza@demos.teste') as renderiza,
  testes.criar_usuario('dono@demos.teste') as dono;
grant select on _u to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select renderiza, 'Renderiza Teste' from _u;
insert into public.demos (pasta, nicho, nome, dados) values ('espaco-teste-demo', 'eventos', 'Espaço Teste', '{"whatsapp":"11999990000","tipos":["Casamento"]}');
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Espaço Teste', 'eventos', 't-espaco-demo', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-espaco-demo') as conta;
grant select on _c to anon, authenticated;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select conta, dono, 'Dono', 'dono@demos.teste', true from _c, _u;

-- a Renderiza vê o catálogo e guarda o contexto da conta
select testes.entrar_como((select renderiza from _u));
select testes.afirmar((select count(*) from public.demos where pasta = 'espaco-teste-demo') = 1, 'a Renderiza vê o catálogo das demos');
insert into public.contas_contexto (conta_id, demo, dados, conversa) select conta, 'espaco-teste-demo', '{"tipos":["Casamento"]}', 'Lead: queria ver como fica a agenda.' from _c;
select testes.afirmar((select conversa like 'Lead:%' from public.contas_contexto where conta_id = (select conta from _c)), 'a Renderiza guarda a conversa colada');
select testes.afirmar_erro($$insert into public.demos (pasta, nicho, nome) values ('outra-demo', 'eventos', 'Outra')$$, 'o catálogo só muda pelo script (servidor)');
reset role;

-- o dono não vê nada disso
select testes.entrar_como((select dono from _u));
select testes.afirmar((select count(*) from public.demos) = 0, 'o dono não vê o catálogo');
select testes.afirmar((select count(*) from public.contas_contexto) = 0, 'o dono não vê o contexto (nem a conversa)');
update public.contas_contexto set conversa = 'mudei' where conta_id = (select conta from _c);
reset role;
select testes.afirmar((select conversa like 'Lead:%' from public.contas_contexto where conta_id = (select conta from _c)), 'o dono não muda o contexto');

-- o visitante, nada
select testes.entrar_como(null);
select testes.afirmar_erro($$select count(*) from public.demos$$, 'o visitante não lê o catálogo');
select testes.afirmar_erro($$select count(*) from public.contas_contexto$$, 'o visitante não lê o contexto');
reset role;

-- apagar a demo do catálogo não apaga o contexto da conta
delete from public.demos where pasta = 'espaco-teste-demo';
select testes.afirmar((select demo is null and dados ? 'tipos' from public.contas_contexto where conta_id = (select conta from _c)), 'sem a demo, o contexto fica com o que ela sabia');

-- a conversa de boas-vindas (migração 20261030260000): o dono lê o que a demo sabia, nunca a conversa
insert into public.contas_contexto (conta_id, dados, conversa) select conta, '{"tipos":["Casamento"],"whatsapp":"11999990000"}', 'Lead: segredo da conversa.' from _c
  on conflict (conta_id) do update set dados = excluded.dados, conversa = excluded.conversa;
select testes.entrar_como((select dono from _u));
select testes.afirmar((select public.contexto_da_minha_conta((select conta from _c)) ->> 'whatsapp') = '11999990000', 'o dono lê o que a demo sabia');
select testes.afirmar(position('segredo' in coalesce(public.contexto_da_minha_conta((select conta from _c))::text, '')) = 0, 'e não a conversa colada');
reset role;
select testes.entrar_como((select renderiza from _u));
select testes.afirmar(public.contexto_da_minha_conta(gen_random_uuid()) is null, 'de conta que não é dele: nada');
reset role;
