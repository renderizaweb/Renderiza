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

-- segurança (migração 20261030233000): o link não toma o acesso de outra pessoa
create temporary table _s as select
  testes.criar_usuario('dono2@link-convite.teste') as dono2,
  testes.criar_usuario('outradona@acesso.renderizaweb.com.br') as outra,
  testes.criar_usuario('soaqui@acesso.renderizaweb.com.br') as soaqui;
grant select on _s to anon, authenticated;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Outro Espaço', 'eventos', 't-outro-link', 'ativa', 'renderiza');
create temporary table _c2 as select (select id from public.contas where codigo = 't-outro-link') as conta;
grant select on _c2 to anon, authenticated;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono)
  select _c2.conta, dono2, 'Dono 2', 'dono2@link-convite.teste', true from _c2, _s
  union all select _c2.conta, soaqui, 'Só Aqui', 'soaqui@acesso.renderizaweb.com.br', false from _c2, _s
  union all select _c.conta, outra, 'Outra Dona', 'outradona@acesso.renderizaweb.com.br', true from _c, _s;

select testes.entrar_como((select dono2 from _s));
select pg_temp.erro_com($$insert into public.convites (conta_id, email, usuario, link_codigo) select conta, 'outradona@acesso.renderizaweb.com.br', 'outradona', 'p0o9i8u7y6t5r4e3w2q1a2s3d4f5g6h7' from _c2$$,
  'já é de outra pessoa', 'o dono não gera link para o usuário de quem está em outra conta');
insert into public.convites (conta_id, email, usuario, link_codigo) select conta, 'soaqui@acesso.renderizaweb.com.br', 'soaqui', 'l1k2j3h4g5f6d7s8a9p0o1i2u3y4t5r6' from _c2;
select testes.afirmar((select not pela_renderiza from public.convites where usuario = 'soaqui'), 'o dono gera o link de senha nova de quem só está na conta dele');
insert into public.convites (conta_id, email, usuario, link_codigo) select conta, 'novinho@acesso.renderizaweb.com.br', 'novinho', 'z9x8c7v6b5n4m3l2k1j0h9g8f7d6s5a4' from _c2;
select pg_temp.erro_com($$update public.convites set usuario = 'outradona', email = 'outradona@acesso.renderizaweb.com.br' where usuario = 'novinho'$$,
  'já é de outra pessoa', 'nem trocando o usuário de um convite que já existe');
reset role;
select testes.afirmar(not public.convite_pode_usar_login((select conta from _c2), 'outradona@acesso.renderizaweb.com.br', false), 'a função diz não para o login de outra conta');
select testes.afirmar(public.convite_pode_usar_login((select conta from _c2), 'ninguem@acesso.renderizaweb.com.br', false), 'login que não existe: pode criar');

select testes.entrar_como((select renderiza from _u));
select pg_temp.erro_com($$insert into public.convites (conta_id, email, usuario, link_codigo) select conta, 'novinho@acesso.renderizaweb.com.br', 'novinho', 'r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0' from _c$$,
  'convites_usuario_pendente', 'um usuário, um convite pendente por vez (nem a Renderiza abre o segundo)');
insert into public.convites (conta_id, email, usuario, link_codigo) select conta, 'outradona@acesso.renderizaweb.com.br', 'outradona', 'w2e3r4t5y6u7i8o9p0q1a2s3d4f5g6h7' from _c;
select testes.afirmar((select pela_renderiza from public.convites where usuario = 'outradona'), 'a Renderiza gera o link de senha nova de qualquer um (fica marcado)');
reset role;
select testes.entrar_como(null);
select pg_temp.erro_com($$select public.convite_pode_usar_login(gen_random_uuid(), 'x@acesso.renderizaweb.com.br', true)$$, 'permission denied', 'o visitante não chama a conferência');
reset role;
