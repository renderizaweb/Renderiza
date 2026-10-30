-- O acompanhamento até a confiança (Missão 7, bloco G; migração 20261030270000; D47): o link aberto pela função
-- pública (uma vez a cada 10 minutos), os passos da conversa registrados pelo dono, e o Admin com as etapas e os marcos.
-- Dados fictícios.

create temporary table _u as select
  testes.criar_usuario('renderiza@acompanha.teste') as renderiza,
  testes.criar_usuario('dono@acompanha.teste') as dono,
  testes.criar_usuario('equipe@acompanha.teste') as equipe;
grant select on _u to anon, authenticated;
insert into public.equipe_renderiza (usuario_id, nome) select renderiza, 'Renderiza Teste' from _u;
insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Espaço Acompanhado', 'eventos', 't-acompanhado', 'ativa', 'renderiza');
create temporary table _c as select (select id from public.contas where codigo = 't-acompanhado') as conta;
grant select on _c to anon, authenticated;
insert into public.convites (conta_id, email, nome, dono, usuario, link_codigo) select conta, 'acompanhado@acesso.renderizaweb.com.br', 'Dona Acompanhada', true, 'acompanhado', 'k1j2h3g4f5d6s7a8p9o0i1u2y3t4r5e6' from _c;

-- o visitante abre o link: registra uma vez (de novo em seguida, não)
select testes.entrar_como(null);
select public.publico_convite_aberto('k1j2h3g4f5d6s7a8p9o0i1u2y3t4r5e6');
select public.publico_convite_aberto('k1j2h3g4f5d6s7a8p9o0i1u2y3t4r5e6');
select public.publico_convite_aberto('naoexiste000000000000000000000000');
reset role;
select testes.afirmar((select count(*) from public.onboarding_eventos where conta_id = (select conta from _c) and evento = 'link_aberto') = 1, 'o link aberto conta uma vez');

-- o dono entra e registra a conversa; alguém da equipe não registra
insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select conta, dono, 'Dona Acompanhada', 'dono@acompanha.teste', true from _c, _u;
insert into public.pessoas (conta_id, usuario_id, nome, email, dono, acessos) select conta, equipe, 'Equipe', 'equipe@acompanha.teste', false, '{"agenda":"ver"}' from _c, _u;
select testes.entrar_como((select dono from _u));
insert into public.onboarding_eventos (conta_id, evento) select conta, 'conversa_comecou' from _c;
insert into public.onboarding_eventos (conta_id, evento, detalhe) select conta, 'pergunta', 'objetivo' from _c;
insert into public.onboarding_eventos (conta_id, evento, detalhe) select conta, 'pergunta', 'tamanho' from _c;
select testes.afirmar_erro($$insert into public.onboarding_eventos (conta_id, evento) select conta, 'link_aberto' from _c$$, 'o link aberto só vem pela função pública');
select testes.afirmar((select count(*) from public.onboarding_eventos) = 0, 'o dono não lê os eventos');
reset role;
select testes.entrar_como((select equipe from _u));
select testes.afirmar_erro($$insert into public.onboarding_eventos (conta_id, evento) select conta, 'conversa_comecou' from _c$$, 'quem não é dono não registra');
reset role;

-- o Admin vê a etapa e os marcos
select testes.entrar_como((select renderiza from _u));
create temporary table _a as select x from jsonb_array_elements(public.admin_onboarding()) x where x ->> 'nome' = 'Espaço Acompanhado';
select testes.afirmar((select (x ->> 'respondidas')::int = 2 and x ->> 'ultima_pergunta' = 'tamanho' and x ->> 'link_aberto_em' is not null and x ->> 'dono' = 'Dona Acompanhada' from _a), 'as etapas da conversa');
select testes.afirmar((select (x -> 'marcos' ->> 'equipe')::boolean and not (x -> 'marcos' ->> 'pedido')::boolean and (x -> 'marcos' ->> 'dias_de_uso')::int >= 0 from _a), 'os marcos da primeira semana');
reset role;
select testes.entrar_como((select dono from _u));
select testes.afirmar_erro($$select public.admin_onboarding()$$, 'o dono não vê o Admin');
reset role;
