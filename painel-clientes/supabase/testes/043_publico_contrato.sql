-- Contratos, o lado público (Missão 3E, migração 20261029220000): publico_contrato e publico_aceitar_contrato,
-- chamadas pelo cliente final (anon) na página /c/<código>. Dados fictícios (WhatsApp com DDD 00, que não existe).

insert into public.contas (nome, nicho, codigo, situacao, origem, ajustes)
  values ('Casa do Contrato', 'eventos', 't-casa-contrato', 'ativa', 'renderiza', '{"pix": {"chave": "contato@casa.teste", "nome": "Casa do Contrato"}}');
create temporary table _c as select (select id from public.contas where codigo = 't-casa-contrato') as casa;
grant select on _c to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id) select casa, 'contratos' from _c;

do $f$
declare conta uuid := (select casa from _c); t uuid; s uuid; a uuid; c uuid; r uuid;
begin
  insert into public.tipos_reserva (conta_id, nome) values (conta, 'Casamento') returning id into t;
  insert into public.servicos (conta_id, nome, valor, sinal) values (conta, 'Clássico', 26500, 7950) returning id into s;
  insert into public.adicionais (conta_id, nome, preco) values (conta, 'Mesa de doces', 2400) returning id into a;
  insert into public.clientes (conta_id, nome, whatsapp) values (conta, 'Juliana Teste', '(00) 90000-0101') returning id into c;
  insert into public.reservas (conta_id, cliente_id, servico_id, tipo_id, inicio, fim, convidados, situacao)
    values (conta, c, s, t, now() + interval '60 days', now() + interval '60 days 8 hours', 150, 'confirmada') returning id into r;
  insert into public.reservas_adicionais (conta_id, reserva_id, adicional_id) values (conta, r, a);
  insert into public.reservas_valores (reserva_id, conta_id, valor_total, sinal) values (r, conta, 28900, 8670);
  insert into public.contratos (conta_id, cliente_id, reserva_id, texto, situacao, codigo) values
    (conta, c, r, 'Contrato da Juliana para o casamento.', 'enviado', 'contratoenviado0001'),
    (conta, c, r, 'Rascunho.', 'orcamento', 'contratorascunho001'),
    (conta, c, r, 'Cancelado.', 'cancelado', 'contratocancelado01');
end $f$;

-- enviado: o texto, a impressão digital, o resumo e o negócio; o Pix ainda não
select testes.entrar_como(null);
create temporary table _r0 as select public.publico_contrato('contratoenviado0001') as r,
  public.publico_contrato('contratorascunho001') as rascunho, public.publico_contrato('contratocancelado01') as cancelado,
  public.publico_contrato('naoexiste0000000000') as errado, public.publico_contrato('X; drop table') as estranho;
reset role;
select testes.afirmar(
  (select r ->> 'situacao' from _r0) = 'enviado' and (select r ->> 'texto' from _r0) = 'Contrato da Juliana para o casamento.'
  and (select r ->> 'impressao' from _r0) = encode(sha256(convert_to('Contrato da Juliana para o casamento.', 'UTF8')), 'hex')
  and (select r -> 'resumo' ->> 'cliente' from _r0) = 'Juliana Teste' and (select r -> 'resumo' ->> 'tipo' from _r0) = 'Casamento'
  and (select r -> 'resumo' ->> 'pacote' from _r0) = 'Clássico' and (select (r -> 'resumo' ->> 'valor_total')::numeric from _r0) = 28900
  and (select (r -> 'resumo' ->> 'sinal')::numeric from _r0) = 8670 and (select (r -> 'resumo' ->> 'convidados')::int from _r0) = 150
  and (select r -> 'resumo' -> 'adicionais' from _r0) = '["Mesa de doces"]'::jsonb
  and (select r -> 'negocio' ->> 'nome' from _r0) = 'Casa do Contrato' and (select r -> 'pix' from _r0) = 'null'::jsonb,
  'enviado: texto, impressão digital, resumo e negócio; sem o Pix antes do aceite');
select testes.afirmar((select rascunho is null and cancelado is null and errado is null and estranho is null from _r0),
  'orçamento, cancelado, código errado ou estranho: nada');

-- aceitar: dados conferidos, o texto que a pessoa leu tem de ser o do contrato
select set_config('request.headers', '{"x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "Teste/1.0 (celular)"}', true);
select testes.entrar_como(null);
create temporary table _r1 as select
  public.publico_aceitar_contrato('contratoenviado0001', ' J ', 'juliana@cliente.teste', (select r ->> 'impressao' from _r0)) as nome_curto,
  public.publico_aceitar_contrato('contratoenviado0001', 'Juliana Teste', '123', (select r ->> 'impressao' from _r0)) as contato_curto,
  public.publico_aceitar_contrato('contratoenviado0001', 'Juliana Teste', 'juliana@cliente.teste', 'outra') as mudou,
  public.publico_aceitar_contrato('contratorascunho001', 'Juliana Teste', 'juliana@cliente.teste', 'x') as rascunho;
reset role;
select testes.afirmar(
  (select nome_curto ->> 'campo' from _r1) = 'nome' and (select contato_curto ->> 'campo' from _r1) = 'contato'
  and (select mudou ->> 'erro' from _r1) = 'mudou' and (select rascunho ->> 'erro' from _r1) = 'fora',
  'aceite recusado: nome, contato, texto que mudou, link que não vale');
select testes.afirmar((select situacao from public.contratos where codigo = 'contratoenviado0001') = 'enviado', 'nada gravado nas recusas');

select testes.entrar_como(null);
create temporary table _r2 as select public.publico_aceitar_contrato('contratoenviado0001', '  Juliana   Teste ', '(00) 90000-0101', (select r ->> 'impressao' from _r0)) as r;
reset role;
select testes.afirmar(
  (select (r ->> 'ok')::boolean from _r2) and (select r -> 'contrato' ->> 'situacao' from _r2) = 'aceito'
  and (select r -> 'contrato' -> 'pix' ->> 'chave' from _r2) = 'contato@casa.teste',
  'aceito: devolve o contrato com o Pix');
select testes.afirmar(
  (select aceito_nome = 'Juliana Teste' and aceito_contato = '(00) 90000-0101' and aceito_ip = '203.0.113.7'::inet
     and aceito_aparelho = 'Teste/1.0 (celular)' and aceito_em > now() - interval '1 minute'
   from public.contratos where codigo = 'contratoenviado0001'),
  'o registro do aceite: nome, contato, IP e aparelho do pedido, data e hora');

-- aceitar de novo não muda nada; o aceito continua no link mesmo com Contratos desligado
select testes.entrar_como(null);
select public.publico_aceitar_contrato('contratoenviado0001', 'Outra Pessoa', 'outra@cliente.teste', 'x');
reset role;
select testes.afirmar((select aceito_nome from public.contratos where codigo = 'contratoenviado0001') = 'Juliana Teste', 'aceitar de novo não troca quem aceitou');
update public.contas_modulos set ligado = false where conta_id = (select casa from _c);
insert into public.contratos (conta_id, cliente_id, texto, situacao, codigo)
  select casa, (select id from public.clientes where conta_id = casa), 'Outro enviado.', 'enviado', 'contratoenviado0002' from _c;
select testes.entrar_como(null);
select testes.afirmar(public.publico_contrato('contratoenviado0001') ->> 'situacao' = 'aceito', 'aceito: o link continua mostrando (é a prova)');
select testes.afirmar(public.publico_contrato('contratoenviado0002') is null
  and public.publico_aceitar_contrato('contratoenviado0002', 'Juliana Teste', 'juliana@cliente.teste', 'x') ->> 'erro' = 'fora',
  'Contratos desligado: o enviado não abre nem aceita');
reset role;

-- o visitante não lê a tabela nem chama o ajudante
select testes.entrar_como(null);
select testes.afirmar_erro($$select count(*) from public.contratos$$, 'visitante não lê contratos');
select testes.afirmar_erro($$select public.contrato_do_link('contratoenviado0001')$$, 'visitante não chama contrato_do_link');
reset role;
