-- A imitação do Supabase no banco local funciona como o de verdade: login pelo JWT, papéis e RLS.
-- Cada arquivo de teste roda numa transação desfeita no fim (scripts/migrar.mjs local).

create temporary table _ids as select testes.criar_usuario('ana@villa-alecrim.teste') as ana, testes.criar_usuario('rui@estudio-ciranda.teste') as rui;
grant select on _ids to anon, authenticated;

-- Uma tabela de teste com RLS: cada um só vê a própria linha.
create table public._teste_rls (dono uuid primary key, texto text);
alter table public._teste_rls enable row level security;
create policy "só o dono" on public._teste_rls for all using (dono = auth.uid()) with check (dono = auth.uid());
insert into public._teste_rls select ana, 'da Ana' from _ids union all select rui, 'do Rui' from _ids;

-- Sem login: não vê nada.
select testes.entrar_como(null);
select testes.afirmar(auth.uid() is null, 'visitante não tem uid');
select testes.afirmar(current_user = 'anon', 'visitante é anon');
select testes.afirmar((select count(*) from public._teste_rls) = 0, 'visitante não vê nada');
reset role;

-- A Ana logada: vê só a dela e não grava em nome do Rui.
select testes.entrar_como((select ana from _ids));
select testes.afirmar(current_user = 'authenticated', 'logada é authenticated');
select testes.afirmar(auth.uid() = (select ana from _ids), 'auth.uid() é a Ana');
select testes.afirmar((select array_agg(texto) from public._teste_rls) = array['da Ana'], 'Ana vê só a dela');
select testes.afirmar_erro(format('insert into public._teste_rls values (%L, %L)', gen_random_uuid(), 'invasão'), 'Ana não grava linha de outro dono');
reset role;

select testes.afirmar(current_user <> 'authenticated', 'reset role volta ao dono do teste');
