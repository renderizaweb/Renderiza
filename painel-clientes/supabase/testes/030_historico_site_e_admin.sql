-- Histórico, Meu site, Admin e arquivos (migrações 20261029110200 e 20261029110300). Dados fictícios.

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
  testes.criar_usuario('leo@villa.teste') as leo,
  testes.criar_usuario('lia@ciranda.teste') as lia,
  testes.criar_usuario('renata@renderiza.teste') as renata;
grant select on _u to anon, authenticated;
insert into public.contas (nome, nicho, codigo, situacao, origem) values
  ('Villa Alecrim', 'eventos', 't-villa-alecrim', 'ativa', 'renderiza'),
  ('Estúdio Ciranda', 'fotografia', 't-estudio-ciranda', 'ativa', 'renderiza');
create temporary table _c as select
  (select id from public.contas where codigo = 't-villa-alecrim') as villa,
  (select id from public.contas where codigo = 't-estudio-ciranda') as ciranda;
grant select on _c to anon, authenticated;
insert into public.contas_modulos (conta_id, modulo_id)
  select conta, m from _c, unnest(array[villa, ciranda]) as conta, unnest(array['agenda', 'atendimento', 'clientes', 'financeiro', 'meu-site']) as m;
insert into public.pessoas (conta_id, usuario_id, nome, dono, acessos) values
  ((select villa from _c), (select marina from _u), 'Marina Teste', true, '{}'),
  ((select villa from _c), (select rafael from _u), 'Rafael Teste', false, '{"agenda": "editar", "atendimento": "editar", "clientes": "editar", "meu-site": "ver"}'),
  ((select villa from _c), (select leo from _u), 'Léo Teste', false, '{"agenda": "editar"}'),
  ((select ciranda from _c), (select lia from _u), 'Lia Teste', true, '{}');
insert into public.equipe_renderiza (usuario_id, nome) values ((select renata from _u), 'Renata');
insert into public.clientes (conta_id, nome) select villa, 'Patrícia Teste' from _c;
delete from public.atividades where conta_id in ((select villa from _c), (select ciranda from _c));  -- o cenário não conta como histórico

-- ---------- o histórico se escreve sozinho ----------
select testes.entrar_como((select rafael from _u));
insert into public.pedidos (conta_id, cliente_id, origem) select villa, (select id from public.clientes where nome = 'Patrícia Teste'), 'instagram' from _c;
update public.pedidos set etapa = 'visita_marcada';
update public.pedidos set etapa = 'visita_marcada';  -- nada muda: nada registra
select pg_temp.erro_com($$insert into public.atividades (conta_id, acao, tabela, modulo) select villa, 'criou', 'falsa', 'inicio' from _c$$, 'row-level security', 'ninguém grava histórico pelo app');
update public.atividades set acao = 'apagou';
reset role;
select testes.afirmar(
  (select count(*) from public.atividades where conta_id = (select villa from _c) and tabela = 'pedidos') = 2
  and (select pessoa_id = (select id from public.pessoas where nome = 'Rafael Teste' and conta_id = (select villa from _c)) and modulo = 'atendimento' and acao = 'criou'
       and cliente_id = (select id from public.clientes where nome = 'Patrícia Teste' and conta_id = (select villa from _c))
       from public.atividades where conta_id = (select villa from _c) and tabela = 'pedidos' and acao = 'criou'),
  'histórico: quem criou o pedido, de qual cliente, em qual módulo; a mudança sem efeito não conta');
select testes.afirmar(
  (select detalhe = '{"etapa": ["novo", "visita_marcada"]}'::jsonb and 'etapa' = any (mudou) from public.atividades where conta_id = (select villa from _c) and tabela = 'pedidos' and acao = 'mudou'),
  'histórico: a mudança de etapa fica registrada');
select testes.afirmar((select count(*) from public.atividades where conta_id = (select villa from _c) and acao = 'apagou') = 0, 'ninguém muda o histórico');

select set_config('request.jwt.claims', '', true);  -- daqui em diante, como o sistema (sem ninguém logado)
insert into public.parcelas (conta_id, cliente_id, descricao, valor, vence_em) select villa, (select id from public.clientes where nome = 'Patrícia Teste'), 'Sinal', 500, current_date from _c;
update public.parcelas set pago_em = current_date;
select testes.afirmar(
  (select detalhe = '{"pago": true}'::jsonb and pessoa_id is null from public.atividades where conta_id = (select villa from _c) and tabela = 'parcelas' and acao = 'mudou'),
  'histórico: "pago", sem o valor; feito pelo sistema (sem pessoa)');
select testes.afirmar(
  not exists (select 1 from public.atividades where conta_id = (select villa from _c) and detalhe::text like '%500%'),
  'o histórico não guarda valores');

select testes.entrar_como((select leo from _u));
select testes.afirmar((select count(*) from public.atividades where conta_id = (select villa from _c) and tabela in ('pedidos', 'parcelas')) = 0, 'Léo (sem Atendimento e Financeiro) não vê esse histórico');
select testes.afirmar((select count(*) from public.atividades) = 0, 'Léo não vê nada do que não pode ver');
reset role;
select testes.entrar_como((select rafael from _u));
select testes.afirmar((select count(*) from public.atividades where conta_id = (select villa from _c) and tabela = 'parcelas') = 0, 'Rafael (sem Financeiro) não vê o histórico das parcelas');
select testes.afirmar((select count(*) from public.atividades where conta_id = (select villa from _c) and tabela = 'pedidos') = 2, 'Rafael vê o histórico do Atendimento');
reset role;
select testes.entrar_como((select lia from _u));
select testes.afirmar((select count(*) from public.atividades) = 0, 'Lia não vê o histórico da Villa');
reset role;
select testes.entrar_como((select marina from _u));
select testes.afirmar((select count(*) from public.atividades) = 4, 'a dona vê todo o histórico');
reset role;

-- a Renderiza ajudando: fica marcado
select testes.entrar_como((select renata from _u));
insert into public.acessos_suporte (conta_id, motivo, nivel) select villa, 'Corrigir o nome a pedido da Marina', 'editar' from _c;
update public.clientes set nome = 'Patrícia Teste Lima' where nome = 'Patrícia Teste';
reset role;
select testes.afirmar(
  (select pelo_suporte and pessoa_id is null from public.atividades where conta_id = (select villa from _c) and tabela = 'clientes' and acao = 'mudou'),
  'mudança feita pela Renderiza em suporte fica marcada');

-- ---------- Meu site ----------
select testes.entrar_como((select marina from _u));
select pg_temp.erro_com($$insert into public.sites (conta_id, codigo) select villa, 't-villa-alecrim' from _c$$, 'row-level security', 'o dono não cadastra o site (a Renderiza cadastra)');
reset role;
select testes.entrar_como((select renata from _u));
insert into public.sites (conta_id, codigo, dominios) select villa, 't-villa-alecrim', array['villaalecrim.exemplo.teste'] from _c;
reset role;
select testes.entrar_como((select marina from _u));
insert into public.sites_versoes (conta_id, site_id, conteudo) select villa, (select id from public.sites), '{"esquema": 1, "secoes": {}}' from _c;
select testes.afirmar(
  (select numero = 1 and estado = 'rascunho' and pessoa_id = public.minha_pessoa((select villa from _c)) from public.sites_versoes),
  'rascunho: número 1 e quem fez');
select pg_temp.erro_com($$insert into public.sites_versoes (conta_id, site_id, conteudo) select villa, (select id from public.sites), '{}' from _c$$, 'duplicate key', 'um rascunho por site');
update public.sites_versoes set estado = 'publicada';
select testes.afirmar((select publicada_em is not null from public.sites_versoes), 'publicar registra quando');
select pg_temp.erro_com($$update public.sites_versoes set conteudo = '{"mudei": true}'$$, 'Versão publicada não muda', 'publicada não muda');
reset role;
select testes.entrar_como((select rafael from _u));  -- Meu site: só vê
select testes.afirmar((select count(*) from public.sites_versoes) = 1, 'só vê: vê as versões');
insert into public.sites_previas (conta_id, site_id, versao_id) select villa, (select id from public.sites), (select id from public.sites_versoes) from _c;
select testes.afirmar((select count(*) from public.sites_previas) = 1, 'só vê: faz prévia');
select pg_temp.erro_com($$insert into public.sites_versoes (conta_id, site_id, conteudo) select villa, (select id from public.sites), '{}' from _c$$, 'row-level security', 'só vê: não cria versão');
reset role;
select testes.entrar_como((select leo from _u));
select testes.afirmar((select count(*) from public.sites) = 0 and (select count(*) from public.sites_versoes) = 0, 'sem acesso ao Meu site: não vê o site');
reset role;
select testes.entrar_como((select lia from _u));
select testes.afirmar((select count(*) from public.sites) = 0, 'Lia não vê o site da Villa');
reset role;

-- ---------- entradas e "visto em" ----------
select testes.entrar_como((select marina from _u));
select public.registrar_entrada((select villa from _c), 'Chrome no Android');
select public.registrar_entrada((select villa from _c), 'Chrome no Android');
select testes.afirmar((select count(*) from public.entradas) = 1, 'recarregar não vira outra entrada');
select testes.afirmar((select visto_em is not null from public.pessoas where nome = 'Marina Teste'), 'entrar marca o "visto em"');
reset role;
select testes.entrar_como((select lia from _u));
select pg_temp.erro_com($$select public.registrar_entrada((select villa from _c))$$, 'não é desta conta', 'não registra entrada em conta dos outros');
select testes.afirmar((select count(*) from public.entradas) = 0, 'Lia não vê as entradas da Villa');
reset role;

-- ---------- Admin ----------
select testes.entrar_como((select renata from _u));
insert into public.pagamentos (conta_id, mes, valor) select villa, date_trunc('month', current_date)::date, 63.99 from _c;
select testes.afirmar((select count(*) from public.entradas where conta_id = (select villa from _c)) = 1 and (select count(*) from public.pagamentos where conta_id = (select villa from _c)) = 1, 'a Renderiza vê entradas e pagamentos');
select testes.afirmar(
  (select (i -> 'contas_por_situacao' ->> 'ativa')::int >= 2 and (i ->> 'pessoas_ativas_7_dias')::int >= 1 and i ? 'uso_por_modulo_30_dias' from public.admin_indicadores() as i),
  'indicadores: só números');
select pg_temp.erro_com($$insert into public.pagamentos (conta_id, mes, valor) select villa, date_trunc('month', current_date)::date + 1, 10 from _c$$, 'pagamentos_mes_check', 'o mês do pagamento é o dia 1');
reset role;
select testes.entrar_como((select marina from _u));
select testes.afirmar((select count(*) from public.pagamentos) = 0, 'o dono não vê os pagamentos no painel');
select pg_temp.erro_com($$select public.admin_indicadores()$$, 'Só a equipe Renderiza', 'indicadores só para a Renderiza');
select pg_temp.erro_com($$insert into public.pagamentos (conta_id, mes, valor) select villa, date_trunc('month', current_date)::date, 1 from _c$$, 'row-level security', 'o dono não registra pagamento');
insert into public.erros_front (mensagem, pagina) values ('TypeError: x is undefined', '/agenda');
select testes.afirmar((select count(*) from public.erros_front) = 0, 'quem grava o erro não lê os erros');
reset role;
select testes.entrar_como(null);
select pg_temp.erro_com($$insert into public.erros_front (mensagem) values ('robô')$$, 'permission denied', 'visitante não grava erro');
reset role;
select testes.entrar_como((select renata from _u));
select testes.afirmar((select count(*) from public.erros_front where mensagem = 'TypeError: x is undefined') >= 1, 'a Renderiza lê os erros');
reset role;

-- ---------- arquivos ----------
select testes.entrar_como((select marina from _u));
insert into storage.objects (bucket_id, name) select 'logos', villa || '/logo.webp' from _c;
insert into storage.objects (bucket_id, name) select 'site-imagens', villa || '/topo-1.webp' from _c;
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'logos', ciranda || '/logo.webp' from _c$$, 'row-level security', 'não envia arquivo na pasta de outra conta');
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) values ('logos', 'solto.webp')$$, 'row-level security', 'arquivo fora da pasta de uma conta');
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'privado', villa || '/contrato.pdf' from _c$$, 'row-level security', 'o bucket privado não aceita nada pelo app');
-- trocar e tirar pela API pedem ler o arquivo (o logo das Configurações vai com "upsert")
with trocado as (update storage.objects set metadata = '{"trocado": true}' where bucket_id = 'logos' and name = (select villa || '/logo.webp' from _c) returning 1)
select testes.afirmar(count(*) = 1, 'o dono troca o próprio logo (lê, então troca)') from trocado;
reset role;
select testes.entrar_como((select lia from _u));
select testes.afirmar((select count(*) from storage.objects where name like (select villa || '/%' from _c)) = 0, 'outra conta não lê os arquivos da Villa pela API');
reset role;
select testes.entrar_como((select rafael from _u));
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'logos', villa || '/outro.webp' from _c$$, 'row-level security', 'só o dono troca o logo');
select pg_temp.erro_com($$insert into storage.objects (bucket_id, name) select 'site-imagens', villa || '/x.webp' from _c$$, 'row-level security', 'Meu site (só vê) não envia imagem');
select testes.afirmar((select count(*) from storage.objects where bucket_id in ('logos', 'site-imagens')) = 2, 'quem é da conta lê o logo; quem vê o Meu site, as imagens');
with trocado as (update storage.objects set metadata = '{}' where bucket_id = 'logos' returning 1)
select testes.afirmar(count(*) = 0, 'quem não é dono não troca o logo') from trocado;
reset role;
select testes.afirmar(
  (select public and file_size_limit = 2097152 and allowed_mime_types = array['image/webp'] from storage.buckets where id = 'site-imagens')
  and (select not public from storage.buckets where id = 'privado'),
  'buckets: imagens do site públicas, só WebP, até 2 MB; privado fechado');

-- ---------- tempo real ----------
select testes.afirmar(
  exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pedidos'),
  'pedidos no tempo real');

-- ---------- apagar a conta leva o histórico junto ----------
delete from public.contas where id = (select villa from _c);
select testes.afirmar((select count(*) from public.atividades where conta_id = (select villa from _c)) = 0, 'conta apagada: histórico junto, sem erro');
