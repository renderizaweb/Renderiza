-- Marco Civil da Internet, art. 15 (migração 20261030200000): cada entrada no painel grava a data, a hora e o IP em
-- registros_de_acesso; ninguém lê pela API (nem quem entrou); os registros com mais de 6 meses saem. Dados fictícios.

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

create temporary table _u as select testes.criar_usuario('dona@registro-acesso.teste') as dona;
grant select on _u to anon, authenticated;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Casa do Registro', 'eventos', 't-casa-registro', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-casa-registro') as casa;
grant select on _c to anon, authenticated;
insert into public.pessoas (conta_id, usuario_id, nome, dono) select casa, dona, 'Dona Registro', true from _c, _u;
-- um registro antigo, de 7 meses atrás
insert into public.registros_de_acesso (usuario_id, conta_id, quando, ip) select dona, casa, now() - interval '7 months', '198.51.100.7' from _u, _c;

select testes.entrar_como((select dona from _u));
select set_config('request.headers', '{"x-forwarded-for": "203.0.113.9, 10.0.0.1", "user-agent": "Teste"}', false);
select public.registrar_entrada((select casa from _c), 'Teste');
select pg_temp.erro_com($$select count(*) from public.registros_de_acesso$$, 'permission denied', 'quem entrou não lê os registros de acesso');
reset role;
select testes.entrar_como(null);
select pg_temp.erro_com($$select count(*) from public.registros_de_acesso$$, 'permission denied', 'o visitante não lê os registros de acesso');
reset role;
select set_config('request.headers', '', false);

select testes.afirmar(
  (select count(*) from public.registros_de_acesso r, _u, _c where r.usuario_id = dona and r.conta_id = casa and r.ip = '203.0.113.9'::inet and r.quando > now() - interval '1 minute') = 1,
  'a entrada gravou a data, a hora e o IP (o primeiro do x-forwarded-for)');
select testes.afirmar((select count(*) from public.registros_de_acesso where ip = '198.51.100.7'::inet) = 0, 'o registro de mais de 6 meses saiu');
select testes.afirmar((select count(*) from public.entradas e, _c where e.conta_id = casa) = 1, 'a entrada do Admin continua como antes');
