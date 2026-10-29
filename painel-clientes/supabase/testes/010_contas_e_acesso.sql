-- Contas e acesso (migração 20261029110000): quem vê qual conta, a função pode(), teste vencido, módulo
-- desligado, "só pago", a equipe e o dono, convites, cadastro, Admin e suporte. Dados fictícios.

-- Como testes.afirmar_erro, mas confere que o erro é o esperado (um erro qualquer, como um nome errado, não passa).
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

-- ---------- o cenário ----------
create temporary table _u as select
  testes.criar_usuario('marina@villa.teste') as marina,
  testes.criar_usuario('rafael@villa.teste') as rafael,
  testes.criar_usuario('bia@villa.teste') as bia,
  testes.criar_usuario('lia@ciranda.teste') as lia,
  testes.criar_usuario('renata@renderiza.teste') as renata,
  testes.criar_usuario('nova@outro.teste') as nova;
grant select on _u to anon, authenticated;

insert into public.contas (nome, nicho, codigo, situacao, origem) values
  ('Villa Alecrim', 'eventos', 't-villa-alecrim', 'ativa', 'renderiza'),
  ('Estúdio Ciranda', 'fotografia', 't-estudio-ciranda', 'ativa', 'renderiza');
create temporary table _c as select
  (select id from public.contas where codigo = 't-villa-alecrim') as villa,
  (select id from public.contas where codigo = 't-estudio-ciranda') as ciranda;
grant select on _c to anon, authenticated;

insert into public.contas_modulos (conta_id, modulo_id)
  select villa, m from _c, unnest(array['agenda', 'atendimento', 'clientes', 'contratos', 'financeiro']) as m;
insert into public.contas_modulos (conta_id, modulo_id)
  select ciranda, m from _c, unnest(array['agenda', 'clientes']) as m;

insert into public.pessoas (conta_id, usuario_id, nome, dono, acessos) values
  ((select villa from _c), (select marina from _u), 'Marina Teste', true, '{}'),
  ((select villa from _c), (select rafael from _u), 'Rafael Teste', false, '{"agenda": "editar", "atendimento": "editar", "clientes": "editar", "contratos": "editar", "financeiro": null}'),
  ((select villa from _c), (select bia from _u), 'Bia Teste', false, '{"agenda": "ver", "clientes": "ver", "financeiro": "editar"}'),
  ((select ciranda from _c), (select lia from _u), 'Lia Teste', true, '{}');
insert into public.equipe_renderiza (usuario_id, nome) values ((select renata from _u), 'Renata');

-- ---------- sem login ----------
select testes.entrar_como(null);
select pg_temp.erro_com('select count(*) from public.contas', 'permission denied', 'visitante não lê contas');
select pg_temp.erro_com('select count(*) from public.pessoas', 'permission denied', 'visitante não lê pessoas');
select pg_temp.erro_com('select count(*) from public.modulos', 'permission denied', 'visitante não lê o catálogo');
select pg_temp.erro_com('select * from public.minhas_contas()', 'permission denied', 'visitante não chama minhas_contas');
select pg_temp.erro_com($$select public.cadastrar_conta('X', 'eventos')$$, 'permission denied', 'visitante não cadastra conta');
select pg_temp.erro_com($$select public.pode((select villa from _c), 'inicio', 'ver')$$, 'permission denied', 'visitante nem chama as funções de regra');
reset role;

-- ---------- o dono ----------
select testes.entrar_como((select marina from _u));
select testes.afirmar((select count(*) from public.contas) = 1, 'Marina vê só a conta dela');
select testes.afirmar((select count(*) from public.pessoas) = 3, 'Marina vê as 3 pessoas da Villa');
select testes.afirmar((select count(*) from public.modulos) = 7, 'o catálogo tem os 7 módulos');
select testes.afirmar(
  (select modulos from public.minhas_contas()) = array['agenda', 'clientes', 'contratos', 'financeiro', 'atendimento']
  and (select liberada and dono from public.minhas_contas()),
  'minhas_contas: a Villa, liberada, dona, com os 5 módulos na ordem do catálogo');
select testes.afirmar(public.pode((select villa from _c), 'financeiro', 'editar'), 'dono edita o Financeiro');
select testes.afirmar(public.pode((select villa from _c), 'equipe', 'editar'), 'dono edita a Equipe');
select testes.afirmar(public.pode((select villa from _c), 'configuracoes', 'editar'), 'dono edita as Configurações');
select testes.afirmar(not public.pode((select villa from _c), 'meu-site', 'ver'), 'módulo não ligado: nem o dono vê');
select testes.afirmar(not public.pode((select ciranda from _c), 'inicio', 'ver'), 'Marina não entra na Ciranda');
select testes.afirmar(not public.pode((select villa from _c), 'agenda', 'qualquer'), 'nível inválido é não');
-- muda o que é dela, não o que é da Renderiza
update public.contas set nome = 'Villa Alecrim Eventos', whatsapp = '(00) 90000-0001' where id = (select villa from _c);
select testes.afirmar((select whatsapp from public.contas where id = (select villa from _c)) = '00900000001', 'WhatsApp da conta fica só com os números');
select pg_temp.erro_com($$update public.contas set situacao = 'ativa', ativa_ate = '2099-01-01' where nome like 'Villa%'$$, 'Só a Renderiza muda', 'dono não muda a situação nem o prazo');
select pg_temp.erro_com($$update public.contas set codigo = 'outro-codigo' where nome like 'Villa%'$$, 'Só a Renderiza muda', 'dono não muda o código público');
select pg_temp.erro_com($$insert into public.contas_modulos (conta_id, modulo_id) select villa, 'meu-site' from _c$$, 'row-level security', 'dono não liga módulo');
select pg_temp.erro_com($$insert into public.contas (nome, nicho, codigo) values ('Outra', 'eventos', 'outra-conta')$$, 'row-level security', 'dono não cria conta pelo app');
-- equipe: muda os acessos da Bia; não deixa a conta sem dono
update public.pessoas set acessos = '{"agenda": "ver", "clientes": "ver", "financeiro": "editar", "contratos": "ver"}' where nome = 'Bia Teste';
select testes.afirmar((select acessos ->> 'contratos' from public.pessoas where nome = 'Bia Teste') = 'ver', 'dono muda os acessos da equipe');
select pg_temp.erro_com($$update public.pessoas set dono = false where nome = 'Marina Teste'$$, 'pelo menos um dono', 'o último dono não deixa de ser dono');
select pg_temp.erro_com($$update public.pessoas set ativa = false where nome = 'Marina Teste'$$, 'pelo menos um dono', 'o último dono não sai');
delete from public.pessoas where nome = 'Rafael Teste';
reset role;
select testes.afirmar((select count(*) from public.pessoas where nome = 'Rafael Teste') = 1, 'dono não apaga pessoa (tira o acesso com ativa = false)');

-- ---------- quem tem acesso por módulo ----------
select testes.entrar_como((select rafael from _u));
select testes.afirmar(public.pode((select villa from _c), 'agenda', 'editar'), 'Rafael edita a Agenda');
select testes.afirmar(not public.pode((select villa from _c), 'financeiro', 'ver'), 'Rafael não vê o Financeiro (null)');
select testes.afirmar(not public.pode((select villa from _c), 'equipe', 'ver'), 'Rafael não vê a Equipe');
select testes.afirmar(not public.pode((select villa from _c), 'configuracoes', 'ver'), 'Rafael não vê as Configurações');
select testes.afirmar(public.pode((select villa from _c), 'servicos', 'ver'), 'todos veem os Serviços');
select testes.afirmar(not public.pode((select villa from _c), 'servicos', 'editar'), 'editar Serviços pede acesso');
select testes.afirmar(public.pode((select villa from _c), 'inicio', 'ver'), 'todos veem o Início');
select testes.afirmar((select count(*) from public.pessoas) = 3, 'Rafael vê a equipe da conta');
select testes.afirmar((select count(*) from public.convites) = 0, 'Rafael não vê convites');
select pg_temp.erro_com($$insert into public.convites (conta_id, email) select villa, 'x@outro.teste' from _c$$, 'row-level security', 'Rafael não convida');
select pg_temp.erro_com($$update public.pessoas set acessos = '{"financeiro": "editar"}' where nome = 'Rafael Teste'$$, 'Só o dono muda os acessos', 'Rafael não muda os próprios acessos');
select pg_temp.erro_com($$update public.pessoas set dono = true where nome = 'Rafael Teste'$$, 'Só o dono muda os acessos', 'Rafael não se faz dono');
update public.pessoas set cor = '#2f6fe0', preferencias = '{"menu": "curto"}' where nome = 'Rafael Teste';
update public.pessoas set acessos = '{}' where nome = 'Bia Teste';
update public.contas set nome = 'Invadida';
reset role;
select testes.afirmar((select cor from public.pessoas where nome = 'Rafael Teste') = '#2f6fe0', 'Rafael muda a própria cor e as preferências');
select testes.afirmar((select acessos ->> 'financeiro' from public.pessoas where nome = 'Bia Teste') = 'editar', 'Rafael não muda a Bia');
select testes.afirmar((select nome from public.contas where id = (select villa from _c)) = 'Villa Alecrim Eventos', 'Rafael não muda a conta');

select testes.entrar_como((select bia from _u));
select testes.afirmar(public.pode((select villa from _c), 'agenda', 'ver'), 'Bia vê a Agenda');
select testes.afirmar(not public.pode((select villa from _c), 'agenda', 'editar'), 'Bia só vê a Agenda: não edita');
select testes.afirmar(public.pode((select villa from _c), 'financeiro', 'editar'), 'Bia edita o Financeiro');
select testes.afirmar(public.pode_algum((select villa from _c), array['financeiro', 'contratos'], 'ver'), 'pode_algum');
reset role;

select testes.entrar_como((select lia from _u));
select testes.afirmar((select count(*) from public.contas) = 1, 'Lia vê só a Ciranda');
select testes.afirmar((select count(*) from public.pessoas) = 1, 'Lia não vê a equipe da Villa');
select testes.afirmar((select count(*) from public.contas_modulos) = 2, 'Lia vê só os módulos da Ciranda');
update public.pessoas set nome = 'Invadida' where conta_id = (select villa from _c);
reset role;
select testes.afirmar((select count(*) from public.pessoas where nome = 'Invadida') = 0, 'Lia não muda pessoa de outra conta');

-- ---------- módulo desligado, teste vencido, "só pago", prazo ----------
update public.contas_modulos set ligado = false where conta_id = (select villa from _c) and modulo_id = 'agenda';
select testes.entrar_como((select marina from _u));
select testes.afirmar(not public.pode((select villa from _c), 'agenda', 'ver'), 'Agenda desligada: nem o dono vê');
reset role;
select testes.entrar_como((select rafael from _u));
select testes.afirmar(not public.pode((select villa from _c), 'agenda', 'ver'), 'Agenda desligada: Rafael não vê');
select testes.afirmar(public.pode((select villa from _c), 'clientes', 'ver'), 'os outros módulos seguem');
reset role;
update public.contas_modulos set ligado = true where conta_id = (select villa from _c) and modulo_id = 'agenda';

update public.contas set situacao = 'teste', teste_ate = now() - interval '1 day' where id = (select villa from _c);
select testes.entrar_como((select marina from _u));
select testes.afirmar(not public.pode((select villa from _c), 'inicio', 'ver'), 'teste vencido: o banco não entrega nada');
select testes.afirmar((select count(*) from public.contas) = 1, 'teste vencido: a pessoa ainda vê a conta (para o aviso)');
select testes.afirmar((select not liberada from public.minhas_contas()), 'teste vencido: minhas_contas diz liberada = false');
select testes.afirmar((select count(*) from public.pessoas) = 1, 'teste vencido: só a própria pessoa');
reset role;

update public.contas set teste_ate = now() + interval '3 days' where id = (select villa from _c);
update public.modulos set liberado_no_teste = false where id = 'financeiro';
select testes.entrar_como((select marina from _u));
select testes.afirmar(public.pode((select villa from _c), 'agenda', 'editar'), 'no teste: a Agenda funciona');
select testes.afirmar(not public.pode((select villa from _c), 'financeiro', 'ver'), 'no teste: módulo "só pago" fica bloqueado');
select testes.afirmar(not exists (select 1 from public.minhas_contas() as m where 'financeiro' = any (m.modulos)), 'no teste: o "só pago" não aparece no menu');
reset role;
update public.modulos set liberado_no_teste = true where id = 'financeiro';

-- o prazo vale no fuso da conta (São Paulo), não no do servidor
update public.contas set situacao = 'ativa', ativa_ate = (now() at time zone 'America/Sao_Paulo')::date - 1 where id = (select villa from _c);
select testes.entrar_como((select marina from _u));
select testes.afirmar(not public.pode((select villa from _c), 'inicio', 'ver'), 'ativa com prazo vencido: bloqueada');
reset role;
update public.contas set situacao = 'desligada', ativa_ate = null where id = (select villa from _c);
select testes.entrar_como((select marina from _u));
select testes.afirmar(not public.pode((select villa from _c), 'inicio', 'ver'), 'desligada: bloqueada');
reset role;
update public.contas set situacao = 'ativa' where id = (select villa from _c);

-- ---------- limite de pessoas ----------
update public.contas set limite_pessoas = 3 where id = (select villa from _c);
select pg_temp.erro_com($$insert into public.pessoas (conta_id, nome) select villa, 'Quarta pessoa' from _c$$, 'máximo de pessoas', 'limite de pessoas do plano');
update public.contas set limite_pessoas = 5 where id = (select villa from _c);

-- ---------- convite ----------
select testes.entrar_como((select marina from _u));
insert into public.convites (conta_id, email, nome, acessos) select villa, '  Nova@Outro.TESTE ', 'Nova', '{"agenda": "ver"}' from _c;
select testes.afirmar((select email from public.convites) = 'nova@outro.teste', 'e-mail do convite em minúsculas');
select testes.afirmar((select convidado_por from public.convites) = public.minha_pessoa((select villa from _c)), 'convite registra quem convidou');
select pg_temp.erro_com($$update public.convites set aceito_em = now()$$, 'O convite é aceito', 'dono não marca o convite como aceito');
reset role;

select testes.entrar_como((select lia from _u));
select testes.afirmar(public.aceitar_convites() = 0, 'convite de outro e-mail não vale para a Lia');
reset role;

select testes.entrar_como((select nova from _u));
select testes.afirmar((select count(*) from public.minhas_contas()) = 0, 'antes de aceitar, nenhuma conta');
select testes.afirmar(public.aceitar_convites() = 1, 'aceitar_convites: entra na Villa');
select testes.afirmar(public.aceitar_convites() = 0, 'aceitar de novo não duplica');
select testes.afirmar(public.pode((select villa from _c), 'agenda', 'ver') and not public.pode((select villa from _c), 'agenda', 'editar'), 'convidada só vê a Agenda');
select testes.afirmar(not public.pode((select villa from _c), 'clientes', 'ver'), 'convidada não vê Clientes');
select testes.afirmar((select nome from public.pessoas where usuario_id = (select nova from _u)) = 'Nova', 'a pessoa nasce com o nome do convite');
reset role;
select testes.afirmar((select aceito_em is not null and pessoa_id is not null from public.convites), 'convite marcado como aceito');

-- convite vencido não vale
insert into public.convites (conta_id, email, expira_em) select ciranda, 'nova@outro.teste', now() - interval '1 minute' from _c;
select testes.entrar_como((select nova from _u));
select testes.afirmar(public.aceitar_convites() = 0 and not public.pode((select ciranda from _c), 'inicio', 'ver'), 'convite vencido não vale');
reset role;

-- ---------- cadastro sozinho ----------
select testes.entrar_como((select nova from _u));
create temporary table _nova as select public.cadastrar_conta('  Buffet Ipê Amarelo ', 'eventos', '(00) 90000-0002', array['agenda', 'financeiro']) as id;
select testes.afirmar(
  (select situacao = 'teste' and origem = 'cadastro' and codigo like 'buffet-ipe-amarelo-%' and whatsapp = '00900000002'
     and teste_ate between now() + interval '6 days 23 hours' and now() + interval '7 days 1 hour'
   from public.contas where id = (select id from _nova)),
  'cadastro: conta em teste de 7 dias, código sem acento, WhatsApp com números');
select testes.afirmar((select dono from public.minhas_contas() where conta_id = (select id from _nova)), 'cadastro: quem cadastrou é o dono');
select testes.afirmar((select modulos from public.minhas_contas() where conta_id = (select id from _nova)) = array['agenda', 'financeiro'], 'cadastro: os módulos escolhidos');
select testes.afirmar(public.pode((select id from _nova), 'financeiro', 'editar'), 'cadastro: já usa o teste');
select pg_temp.erro_com($$select public.cadastrar_conta('Segunda', 'eventos')$$, 'o teste de 7 dias é um só', 'o teste é um só');
reset role;
select testes.entrar_como((select lia from _u));
select pg_temp.erro_com($$select public.cadastrar_conta('Estúdio Novo', 'fotografia', null, array['nao-existe'])$$, 'não existe ou não entra no teste', 'módulo que não existe');
select pg_temp.erro_com($$select public.cadastrar_conta('Estúdio Novo', 'odonto')$$, 'contas_nicho_check', 'nicho que não existe');
reset role;
update auth.users set email_confirmed_at = null where id = (select lia from _u);
select testes.entrar_como((select lia from _u));
select pg_temp.erro_com($$select public.cadastrar_conta('Estúdio Novo', 'fotografia')$$, 'Confirme o seu e-mail', 'cadastro pede o e-mail confirmado');
reset role;

-- ---------- Admin (equipe Renderiza) ----------
select testes.entrar_como((select renata from _u));
select testes.afirmar((select count(*) from public.contas where id in ((select villa from _c), (select ciranda from _c), (select id from _nova))) = 3, 'Renderiza vê todas as contas');
select testes.afirmar((select count(*) from public.pessoas) >= 6, 'Renderiza vê as pessoas');
select testes.afirmar((select count(*) from public.equipe_renderiza) >= 1, 'Renderiza vê a própria equipe');
select testes.afirmar(not public.pode((select villa from _c), 'clientes', 'ver'), 'Renderiza não vê os dados da conta sem suporte');
update public.contas set situacao = 'ativa', ativa_ate = current_date + 30 where id = (select id from _nova);
select testes.afirmar((select situacao from public.contas where id = (select id from _nova)) = 'ativa', 'Renderiza aprova a conta');
insert into public.contas_modulos (conta_id, modulo_id) select villa, 'meu-site' from _c;
update public.modulos set liberado_no_teste = false where id = 'meu-site';
select testes.afirmar((select not liberado_no_teste from public.modulos where id = 'meu-site'), 'Renderiza marca o "só pago"');
-- entrar na conta para ajudar
insert into public.acessos_suporte (conta_id, motivo) select villa, 'Ajudar a importar as datas' from _c;
select testes.afirmar(public.pode((select villa from _c), 'clientes', 'ver'), 'em suporte: vê a conta');
select testes.afirmar(not public.pode((select villa from _c), 'clientes', 'editar'), 'suporte "ver" não edita');
select testes.afirmar(not public.pode((select ciranda from _c), 'clientes', 'ver'), 'suporte vale só para a conta registrada');
select pg_temp.erro_com($$update public.acessos_suporte set fim = fim + interval '1 hour'$$, 'O registro de suporte não muda', 'suporte não se estende');
select pg_temp.erro_com($$update public.acessos_suporte set motivo = 'outro'$$, 'O registro de suporte não muda', 'o registro do suporte não muda');
update public.acessos_suporte set fim = now() + interval '1 minute';
select pg_temp.erro_com($$insert into public.acessos_suporte (conta_id, motivo, fim) select ciranda, 'Muito tempo', now() + interval '1 day' from _c$$, 'no máximo 8 horas', 'suporte dura no máximo 8 horas');
reset role;

select testes.entrar_como((select marina from _u));
select testes.afirmar((select count(*) from public.acessos_suporte) = 1, 'o dono vê que a Renderiza entrou');
select testes.afirmar((select count(*) from public.equipe_renderiza) = 0, 'o dono não vê a equipe Renderiza');
select pg_temp.erro_com($$insert into public.acessos_suporte (conta_id, motivo) select villa, 'Eu mesma' from _c$$, 'row-level security', 'quem não é da Renderiza não registra suporte');
update public.modulos set preco = 0;
reset role;
select testes.afirmar((select count(*) from public.modulos where preco = 0) = 0, 'só a Renderiza muda o catálogo');

select testes.entrar_como((select rafael from _u));
select testes.afirmar((select count(*) from public.acessos_suporte) = 0, 'quem não é dono não vê os registros de suporte');
reset role;

-- ---------- termos ----------
select testes.entrar_como((select marina from _u));
insert into public.termos_aceites (versao, aparelho) values ('2026-11', 'teste');
select pg_temp.erro_com($$insert into public.termos_aceites (usuario_id, versao) select rafael, '2026-11' from _u$$, 'row-level security', 'não aceita em nome de outro');
select pg_temp.erro_com($$insert into public.termos_aceites (versao) values ('2026-11')$$, 'duplicate key', 'a mesma versão uma vez só');
reset role;
select testes.entrar_como((select rafael from _u));
select testes.afirmar((select count(*) from public.termos_aceites) = 0, 'aceites são de cada um');
reset role;

-- ---------- apagar a conta leva tudo junto (só pelo banco) ----------
select pg_temp.erro_com($$delete from public.pessoas where nome = 'Lia Teste'$$, 'pelo menos um dono', 'nem o banco apaga o último dono de uma conta que existe');
delete from public.contas where id = (select ciranda from _c);
select testes.afirmar((select count(*) from public.pessoas where conta_id = (select ciranda from _c)) = 0, 'apagar a conta apaga as pessoas dela');
