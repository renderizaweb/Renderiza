-- O e-mail para recuperar a senha (migração 20261031120000; D42): só a função grava; o painel vê o próprio, escondido;
-- e o aviso de pedido novo não vai para o e-mail interno do usuário, e sim para o de recuperação confirmado.
-- Dados fictícios.

create temporary table _u as select
  testes.criar_usuario('donolink@acesso.renderizaweb.com.br') as dono,
  testes.criar_usuario('outra@recupera.teste') as outra;
grant select on _u to anon, authenticated;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Espaço Recupera', 'eventos', 't-recupera', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-recupera') as conta;
grant select on _c to anon, authenticated;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select conta, dono, 'Dono do Link', 'donolink@acesso.renderizaweb.com.br', true from _c, _u;
-- a função (servidor) confirmou o e-mail do dono
insert into public.emails_de_recuperacao (usuario_id, email, confirmado_em) select dono, 'dono.link@gmail.teste', now() from _u;
select testes.afirmar_erro($$insert into public.emails_de_recuperacao (usuario_id, email) select outra, 'sem@confirmar.teste' from _u$$, 'e-mail só com a confirmação');

select testes.entrar_como((select dono from _u));
select testes.afirmar((select public.meu_email_de_recuperacao() ->> 'email') = 'd•••@gmail.teste', 'o dono vê o próprio, escondido');
select testes.afirmar((select (public.meu_email_de_recuperacao() ->> 'confirmado')::boolean), 'e que está confirmado');
select testes.afirmar_erro($$select count(*) from public.emails_de_recuperacao$$, 'ninguém lê a tabela pelo painel');
reset role;
select testes.entrar_como((select outra from _u));
select testes.afirmar(public.meu_email_de_recuperacao() is null, 'quem não tem: nada');
reset role;
select testes.entrar_como(null);
select testes.afirmar_erro($$select public.meu_email_de_recuperacao()$$, 'o visitante não pergunta');
reset role;

-- o aviso de pedido novo: o de recuperação, não o interno
insert into public.clientes (conta_id, nome, whatsapp) select conta, 'Cliente Teste', '11900000888' from _c;
insert into public.pedidos (conta_id, cliente_id, origem, etapa) select c.conta, cl.id, 'agenda_online', 'novo' from _c c join public.clientes cl on cl.conta_id = c.conta;
select testes.afirmar(
  (select public.aviso_do_pedido((select id from public.pedidos where conta_id = (select conta from _c))) -> 'para') = '["dono.link@gmail.teste"]'::jsonb,
  'o aviso vai para o e-mail de recuperação, nunca para o interno');
