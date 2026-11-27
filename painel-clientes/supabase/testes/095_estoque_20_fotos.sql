-- Estoque: até 20 fotos por item (migração 20261126170000; era 15). 20 entram; 21 não. Dados fictícios.

insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Garagem Vinte', 'automotivo', 't-garagem-vinte', 'ativa', 'renderiza');
create temporary table _v as select (select id from public.contas where codigo = 't-garagem-vinte') as conta, testes.criar_usuario('dono@garagem-vinte.teste') as dono;
grant select on _v to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id) select conta, 'estoque' from _v;
insert into public.pessoas (conta_id, usuario_id, nome, dono, acessos) select conta, dono, 'Dono', true, '{}'::jsonb from _v;

create function pg_temp.fotos(conta uuid, n int) returns jsonb language sql as $f$
  select jsonb_agg(jsonb_build_object('arquivo', conta || '/estoque-vinte' || lpad(k::text, 3, '0') || '.webp', 'mini', conta || '/estoque-vinte' || lpad(k::text, 3, '0') || '-m.webp', 'w', 1600, 'h', 1067))
  from generate_series(1, n) k
$f$;

select testes.entrar_como((select dono from _v));
insert into public.estoque_itens (conta_id, esquema, situacao, campos, fotos) select conta, 'automotivo', 'disponivel', '{"marca": "Vinte", "modelo": "Fotos"}', pg_temp.fotos(conta, 20) from _v;
select testes.afirmar((select jsonb_array_length(fotos) from public.estoque_itens where campos ->> 'modelo' = 'Fotos') = 20, 'um carro com 20 fotos entra');
select testes.afirmar_erro($$insert into public.estoque_itens (conta_id, esquema, fotos) select conta, 'automotivo', pg_temp.fotos(conta, 21) from _v$$, 'com 21 fotos, não');
