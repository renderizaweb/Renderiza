-- Estoque (migração 20261124190000): o nicho automotivo, a RLS de estoque_itens (dono edita, "só vê" lê, a vizinha
-- nada), o formato das fotos e dos selos, o vendido_em, as fotos no Storage e publico_estoque. Dados fictícios.

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

insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Garagem Teste', 'automotivo', 't-garagem-teste', 'ativa', 'renderiza'),
  ('Outra Garagem', 'automotivo', 't-outra-garagem', 'ativa', 'renderiza');
create temporary table _g as select (select id from public.contas where codigo = 't-garagem-teste') as garagem, (select id from public.contas where codigo = 't-outra-garagem') as outra,
  testes.criar_usuario('dono@garagem.teste') as dono, testes.criar_usuario('vendedor@garagem.teste') as vendedor, testes.criar_usuario('dono@outra-garagem.teste') as vizinho;
grant select on _g to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id) select garagem, 'estoque' from _g union all select outra, 'estoque' from _g;
insert into public.sites (conta_id, codigo, dominios) select garagem, 't-garagem', array['garagem.teste'] from _g;
insert into public.pessoas (conta_id, usuario_id, nome, dono, acessos) select garagem, dono, 'Dono', true, '{}'::jsonb from _g
  union all select garagem, vendedor, 'Vendedor', false, '{"estoque": "ver"}'::jsonb from _g
  union all select outra, vizinho, 'Vizinho', true, '{}'::jsonb from _g;
select testes.afirmar((select nicho from public.contas where codigo = 't-garagem-teste') = 'automotivo', 'o nicho automotivo é aceito');
select testes.afirmar(exists (select 1 from public.modulos where id = 'estoque'), 'o Estoque está no catálogo');

-- o dono cria, muda e marca vendido
select testes.entrar_como((select dono from _g));
insert into public.estoque_itens (conta_id, esquema, situacao, destaque, preco, selos, campos, codigo_interno, fotos)
  select garagem, 'automotivo', 'disponivel', true, 189900, array['Blindado'], '{"marca": "Aurora", "modelo": "Sedã"}', 'ABC1D23',
    jsonb_build_array(jsonb_build_object('arquivo', garagem || '/estoque-aaaaaa11.webp', 'mini', garagem || '/estoque-aaaaaa11-m.webp', 'w', 1600, 'h', 1067)) from _g;
insert into public.estoque_itens (conta_id, esquema, situacao, ordem, preco, campos) select garagem, 'automotivo', 'reservado', 1, null, '{"marca": "Aurora", "modelo": "Hatch"}' from _g;
insert into public.estoque_itens (conta_id, esquema, situacao, campos) select garagem, 'automotivo', 'oculto', '{"marca": "Aurora", "modelo": "Picape"}' from _g;
insert into public.estoque_itens (conta_id, esquema, situacao, campos) select garagem, 'automotivo', 'disponivel', '{"marca": "Aurora", "modelo": "Cupê"}' from _g;
update public.estoque_itens set situacao = 'vendido' where campos ->> 'modelo' = 'Cupê';
select testes.afirmar((select vendido_em is not null from public.estoque_itens where campos ->> 'modelo' = 'Cupê'), 'vendido ganha a data');
update public.estoque_itens set situacao = 'disponivel' where campos ->> 'modelo' = 'Cupê';
select testes.afirmar((select vendido_em is null from public.estoque_itens where campos ->> 'modelo' = 'Cupê'), 'desfazer o vendido tira a data');
update public.estoque_itens set situacao = 'vendido' where campos ->> 'modelo' = 'Cupê';
select testes.afirmar_erro($$insert into public.estoque_itens (conta_id, esquema, fotos) select garagem, 'automotivo', '[{"arquivo": "x.webp", "w": 1, "h": 1}]' from _g$$, 'foto fora do formato é recusada');
select testes.afirmar_erro($$insert into public.estoque_itens (conta_id, esquema, fotos) select garagem, 'automotivo', jsonb_build_array(jsonb_build_object('arquivo', outra || '/estoque-aaaaaa22.webp', 'w', 1, 'h', 1)) from _g$$, 'foto da pasta de outra conta é recusada');
select testes.afirmar_erro($$insert into public.estoque_itens (conta_id, esquema, selos) select garagem, 'automotivo', array['um selo com bem mais de trinta letras aqui'] from _g$$, 'selo longo é recusado');
select testes.afirmar_erro($$insert into public.estoque_itens (conta_id, esquema) select outra, 'automotivo' from _g$$, 'o dono não cria na conta de outro');
insert into storage.objects (bucket_id, name) select 'site-imagens', garagem || '/estoque-aaaaaa11.webp' from _g;
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'site-imagens', garagem || '/topo.webp' from _g$$, 'row-level security', 'sem o Meu site, só envia arquivo estoque-*');
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'site-imagens', outra || '/estoque-bbbbbb11.webp' from _g$$, 'row-level security', 'não envia foto na pasta de outra conta');
reset role;

-- quem "só vê" lê e não mexe; a vizinha não vê nada
select testes.entrar_como((select vendedor from _g));
select testes.afirmar((select count(*) from public.estoque_itens) = 4, 'o "só vê" lê o estoque da conta');
update public.estoque_itens set preco = 1 where campos ->> 'modelo' = 'Sedã';
select testes.afirmar_erro($$insert into public.estoque_itens (conta_id, esquema) select garagem, 'automotivo' from _g$$, 'o "só vê" não cria');
reset role;
select testes.afirmar((select preco = 189900 from public.estoque_itens where campos ->> 'modelo' = 'Sedã'), 'o "só vê" não muda o preço');
select testes.entrar_como((select vizinho from _g));
select testes.afirmar((select count(*) from public.estoque_itens) = 0, 'a vizinha não vê o estoque da outra conta');
delete from public.estoque_itens;
reset role;
select testes.afirmar((select count(*) from public.estoque_itens) = 4, 'a vizinha não apaga nada');

-- o visitante: só pela função, só disponível e reservado, sem o código interno
select testes.entrar_como(null);
select testes.afirmar_erro($$select * from public.estoque_itens$$, 'o visitante não lê a tabela');
create temporary table _p as select public.publico_estoque('t-garagem') as r, public.publico_estoque('t-nao-existe') as nada;
reset role;
select testes.afirmar((select (r ->> 'versao') = '1' and r ->> 'esquema' = 'automotivo' and jsonb_array_length(r -> 'itens') = 2 from _p), 'o site recebe só o disponível e o reservado');
select testes.afirmar((select r -> 'itens' -> 0 -> 'campos' ->> 'modelo' = 'Sedã' and r -> 'itens' -> 1 ->> 'situacao' = 'reservado' from _p), 'o destaque vem primeiro');
select testes.afirmar((select position('ABC1D23' in r::text) = 0 and not (r -> 'itens' -> 0 ? 'codigo_interno') from _p), 'o código interno nunca sai');
select testes.afirmar((select r -> 'itens' -> 0 -> 'fotos' -> 0 ->> 'mini' like '%-m.webp' and r -> 'itens' -> 1 -> 'preco' = 'null'::jsonb from _p), 'as fotos vão com a pequena; sem preço vai vazio (sob consulta)');
select testes.afirmar((select nada is null from _p), 'site que não existe: nada');
update public.contas_modulos set ligado = false where conta_id = (select garagem from _g) and modulo_id = 'estoque';
select testes.entrar_como(null);
select testes.afirmar(public.publico_estoque('t-garagem') is null, 'Estoque desligado: o site fica com a versão de reserva');
reset role;
update public.contas_modulos set ligado = true where conta_id = (select garagem from _g) and modulo_id = 'estoque';
update public.sites set situacao = 'desconectado' where codigo = 't-garagem';
select testes.entrar_como(null);
select testes.afirmar(public.publico_estoque('t-garagem') is null, 'site desconectado: nada');
reset role;
