-- Convite por link (Missão 7, bloco B; migração 20261030220000; D42): o convite com usuário e código, a tela pública
-- de boas-vindas (publico_convite), o painel sem poder marcar o link como usado, o link novo e o usuário livre.
-- Dados fictícios.

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

create temporary table _u as select
  testes.criar_usuario('renderiza@link-convite.teste') as renderiza,
  testes.criar_usuario('jatenho@acesso.renderizaweb.com.br') as ja;
grant select on _u to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select renderiza, 'Renderiza Teste' from _u;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Espaço do Link', 'eventos', 't-espaco-link', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-espaco-link') as conta;
grant select on _c to anon, authenticated;

-- a Renderiza cria o convite por link
select testes.entrar_como((select renderiza from _u));
insert into public.convites (conta_id, email, nome, dono, usuario, link_codigo)
  select conta, 'espacolink@acesso.renderizaweb.com.br', 'Dona do Link', true, 'espacolink', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' from _c;
select pg_temp.erro_com($$insert into public.convites (conta_id, email, usuario, link_codigo) select conta, 'outro@exemplo.teste', 'outro', 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' from _c$$,
  'convites_link_email', 'o e-mail do convite por link é o interno do usuário');
select pg_temp.erro_com($$insert into public.convites (conta_id, email, usuario) select conta, 'semlink@acesso.renderizaweb.com.br', 'semlink' from _c$$,
  'convites_link_completo', 'usuário e código andam juntos');
select testes.afirmar(not public.usuario_disponivel('espacolink'), 'usuário com convite pendente não está livre');
select testes.afirmar(not public.usuario_disponivel('jatenho'), 'usuário que já tem login não está livre');
select testes.afirmar(public.usuario_disponivel('livre123'), 'usuário novo está livre');
select testes.afirmar(not public.usuario_disponivel('Com Espaço'), 'usuário fora do formato não serve');
-- o painel não marca o link como usado
update public.convites set link_usado_em = now() where usuario = 'espacolink';
select testes.afirmar((select link_usado_em is null from public.convites where usuario = 'espacolink'), 'o painel não marca o link como usado');
reset role;

-- a tela de boas-vindas (visitante)
select testes.entrar_como(null);
select testes.afirmar(
  (select (r ->> 'valido')::boolean and r ->> 'negocio' = 'Espaço do Link' and r ->> 'nicho' = 'eventos' and r ->> 'usuario' = 'espacolink'
     and not (r ->> 'ja_tem_acesso')::boolean and not r ? 'email' from public.publico_convite('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6') as r),
  'o link válido mostra o negócio, o nicho e o usuário (sem e-mail)');
select testes.afirmar(public.publico_convite('naoexiste000000000000000000000000') is null, 'código que não existe: nada');
select testes.afirmar(public.publico_convite('curto') is null, 'código fora do formato: nada');
select pg_temp.erro_com($$select public.usuario_disponivel('qualquer')$$, 'permission denied', 'o visitante não consulta usuários');
reset role;

-- usado (a função do servidor marca), vencido, cancelado
update public.convites set link_usado_em = now() where usuario = 'espacolink';
select testes.entrar_como(null);
select testes.afirmar((select r ->> 'motivo' = 'usado' and r ->> 'usuario' = 'espacolink' from public.publico_convite('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6') as r), 'link usado: diz que foi usado e o usuário');
reset role;
-- link novo (a Renderiza troca o código): libera de novo
select testes.entrar_como((select renderiza from _u));
update public.convites set link_codigo = 'q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6', expira_em = now() + interval '7 days' where usuario = 'espacolink';
reset role;
select testes.afirmar((select link_usado_em is null from public.convites where usuario = 'espacolink'), 'o link novo libera de novo');
select testes.afirmar(public.publico_convite('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6') is null, 'o link antigo deixa de valer');
update public.convites set expira_em = now() - interval '1 minute' where usuario = 'espacolink';
select testes.afirmar((select r ->> 'motivo' = 'vencido' from public.publico_convite('q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6') as r), 'link vencido: diz que venceu');
update public.convites set cancelado_em = now() where usuario = 'espacolink';
select testes.afirmar(public.publico_convite('q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6') is null, 'convite cancelado: nada');

-- quem já tem o usuário (esqueceu a senha): "ja_tem_acesso"
insert into public.convites (conta_id, email, usuario, link_codigo) select conta, 'jatenho@acesso.renderizaweb.com.br', 'jatenho', 'm1n2b3v4c5x6z7l8k9j0h1g2f3d4s5a6' from _c;
select testes.afirmar((select (r ->> 'ja_tem_acesso')::boolean from public.publico_convite('m1n2b3v4c5x6z7l8k9j0h1g2f3d4s5a6') as r), 'quem já tem o usuário vê "crie uma senha nova"');
