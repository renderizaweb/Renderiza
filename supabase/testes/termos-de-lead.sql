-- Testes dos termos de lead (supabase/termos-online.sql), num Postgres local: ver supabase/testes/README.md.
-- Cada bloco para com erro na primeira coisa errada. Usa dois donos (A e B), o lead da Ricardo Motors de A e, se
-- existir, o termo do vereador (o banco de antes, com o texto chegando na primeira assinatura).
\set ON_ERROR_STOP on
set client_min_messages = warning;

insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b') on conflict do nothing;
insert into public.leads (id, dono, empresa, link_demo) values
  ('lead-rm', '00000000-0000-0000-0000-00000000000a', 'Ricardo Motors', '/demo/ricardo-motors'),
  ('lead-b', '00000000-0000-0000-0000-00000000000b', 'Outro', '/demo/outro')
  on conflict do nothing;

create or replace function pg_temp.como(p_papel text, p_dono text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_dono, ''), false);
  perform set_config('request.headers', '{"x-forwarded-for": "200.1.2.3", "user-agent": "teste"}', false);
  execute format('set role %I', p_papel);
end $$;

-- 1. O dono cria o termo do lead dele: impressão do texto exato, página /termo/<id> e a contratada copiada.
select pg_temp.como('authenticated', '00000000-0000-0000-0000-00000000000a');
insert into public.termos_online (id, lead_id, titulo, texto, aberto, exige_codigo, opcoes, tipo_contratante, modelo, campos)
values ('ricardo-motors-v1', 'lead-rm', 'Termo · Site da Ricardo Motors', E'# 1. Teste\nValor: [[valor]]', false, false,
        '[{"id": "painel", "nome": "Com o Painel Renderiza"}, {"id": "so-site", "nome": "Só o site"}]', 'pf_ou_pj', 'site-v1', '{"valor": ""}');
do $$
declare t record;
begin
  select * into t from public.termos_online where id = 'ricardo-motors-v1';
  assert t.impressao = encode(extensions.digest(E'# 1. Teste\nValor: [[valor]]', 'sha256'), 'hex'), 'impressão do texto';
  assert t.pagina = 'https://www.renderizaweb.com.br/termo/ricardo-motors-v1', 'página padrão';
  assert t.dono = '00000000-0000-0000-0000-00000000000a', 'dono é quem está logado';
  if exists (select 1 from public.termos_online where id = 'vereador-mateuzinho-silva-v1') then
    assert t.contratada = 'Kaue (dados completos de teste)', 'contratada copiada do termo anterior';
  end if;
end $$;

-- 2. Com pendência ([[ ]]) não abre; preenchido, abre. Mudar o texto muda a impressão.
do $$
begin
  begin
    update public.termos_online set aberto = true where id = 'ricardo-motors-v1';
    raise exception 'devia recusar abrir com pendência';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%pendências%' then raise; end if;
  end;
end $$;
update public.termos_online set texto = E'# 1. Teste\nValor: R$ 1.000,00', aberto = true where id = 'ricardo-motors-v1';
do $$ begin
  assert (select impressao from public.termos_online where id = 'ricardo-motors-v1') = encode(extensions.digest(E'# 1. Teste\nValor: R$ 1.000,00', 'sha256'), 'hex'), 'impressão nova';
end $$;

-- 3. Outro dono não vê, não muda e não cria termo no lead de A.
reset role;
select pg_temp.como('authenticated', '00000000-0000-0000-0000-00000000000b');
do $$
declare n int;
begin
  assert not exists (select 1 from public.termos_online where id = 'ricardo-motors-v1'), 'B não vê o termo de A';
  update public.termos_online set titulo = 'x' where id = 'ricardo-motors-v1';
  get diagnostics n = row_count;
  assert n = 0, 'B não muda o termo de A';
  begin
    insert into public.termos_online (id, lead_id, titulo, texto) values ('invasor-v1', 'lead-rm', 'x', 'y');
    raise exception 'devia recusar termo no lead de outro dono';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- 4. A página (chave pública) lê o texto, sem o dono nem a contratada; o termo do vereador (sem texto) fica de fora.
select pg_temp.como('anon', null);
do $$
declare r jsonb := public.publico_termo('ricardo-motors-v1');
begin
  assert (r ->> 'ok')::boolean and r ->> 'texto' = E'# 1. Teste\nValor: R$ 1.000,00', 'texto para a página';
  assert r ->> 'demo' = 'ricardo-motors' and r ->> 'tipo_contratante' = 'pf_ou_pj' and jsonb_array_length(r -> 'opcoes') = 2, 'demo, tipo e opções';
  assert not (r ? 'contratada') and not (r ? 'dono'), 'nada do dono nem da contratada';
  assert not (public.publico_termo('nao-existe') ->> 'ok')::boolean, 'termo que não existe';
  assert not (public.publico_termo('vereador-mateuzinho-silva-v1') ->> 'ok')::boolean, 'o do vereador tem página própria';
end $$;

-- 5. Assinatura: opção fora da lista, CNPJ errado e razão social faltando são recusados; como pessoa física e como
-- empresa, assina. O passo vai para a Atividade do lead, com o termo.
do $$
declare
  imp text := encode(extensions.digest(E'# 1. Teste\nValor: R$ 1.000,00', 'sha256'), 'hex');
  base jsonb := '{"nome": "Ricardo Neves", "cpf": "529.982.247-25", "email": "ricardo@exemplo.com", "whatsapp": "(11) 94788-2373",
                  "endereco": "Rua das Flores, 100, São Paulo/SP", "plano": "painel",
                  "declaracoes": {"li": true, "responsavel": true, "privacidade": true}}';
  r jsonb;
begin
  r := public.aceitar_termo_online('ricardo-motors-v1', imp, base || '{"plano": "gabinete"}');
  assert r ->> 'campo' = 'plano', 'opção fora da lista: ' || r::text;
  r := public.aceitar_termo_online('ricardo-motors-v1', imp, base || '{"cnpj": "11.222.333/0001-82", "empresa": "RM Consult Car Ltda"}');
  assert r ->> 'campo' = 'cnpj', 'CNPJ errado: ' || r::text;
  r := public.aceitar_termo_online('ricardo-motors-v1', imp, base || '{"cnpj": "11.222.333/0001-81", "empresa": " "}');
  assert r ->> 'campo' = 'empresa', 'sem razão social: ' || r::text;
  r := public.aceitar_termo_online('ricardo-motors-v1', 'a' || substr(imp, 2), base);
  assert r ->> 'erro' = 'mudou', 'impressão diferente: ' || r::text;
  r := public.aceitar_termo_online('ricardo-motors-v1', imp, base);
  assert (r ->> 'ok')::boolean, 'pessoa física: ' || r::text;
  r := public.aceitar_termo_online('ricardo-motors-v1', imp, base || '{"plano": "so-site", "cnpj": "11.222.333/0001-81", "empresa": "  RM   Consult Car Ltda "}');
  assert (r ->> 'ok')::boolean and r ->> 'ip' = '200.1.2.3', 'empresa: ' || r::text;
end $$;
reset role;
do $$
declare a record;
begin
  select * into a from public.termos_aceites where termo_id = 'ricardo-motors-v1' and cnpj <> '';
  assert a.cnpj = '11222333000181' and a.empresa = 'RM Consult Car Ltda' and a.plano = 'so-site' and a.opcao_nome = 'Só o site', 'aceite da empresa';
  select * into a from public.termos_aceites where termo_id = 'ricardo-motors-v1' and cnpj = '';
  assert a.empresa = '' and a.plano = 'painel' and a.opcao_nome = 'Com o Painel Renderiza' and a.cpf = '52998224725', 'aceite da pessoa física';
  assert (select count(*) from public.visitas where lead_id = 'lead-rm' and detalhe ->> 'alvo' = 'contrato-assinado' and detalhe ->> 'termo' = 'ricardo-motors-v1' and demo = 'ricardo-motors') = 2, 'Atividade do lead';
end $$;

-- 6. O comprovante (só a função de borda) traz a opção, o CNPJ e a razão social.
set role service_role;
do $$
declare p text; r jsonb;
begin
  select upper(left(replace(id::text, '-', ''), 12)) into p from public.termos_aceites where termo_id = 'ricardo-motors-v1' and cnpj <> '';
  r := public.comprovante_termo('ricardo-motors-v1', p);
  assert (r ->> 'ok')::boolean and r ->> 'plano_nome' = 'Só o site' and r ->> 'cnpj' = '11222333000181' and r ->> 'empresa' = 'RM Consult Car Ltda', 'comprovante: ' || r::text;
  assert r ->> 'pagina' = 'https://www.renderizaweb.com.br/termo/ricardo-motors-v1', 'endereço do texto no comprovante';
  assert r ->> 'texto' = E'# 1. Teste\nValor: R$ 1.000,00', 'o comprovante leva o texto inteiro';
  assert not (public.comprovante_termo('ricardo-motors-v1', p) ->> 'ok')::boolean, 'o comprovante sai uma vez só';
end $$;
reset role;

-- 7. Assinado: o texto e as opções não mudam e o termo não sai; fechar e abrir continua valendo.
select pg_temp.como('authenticated', '00000000-0000-0000-0000-00000000000a');
do $$
begin
  begin
    update public.termos_online set texto = 'outro' where id = 'ricardo-motors-v1';
    raise exception 'devia recusar mudar o texto assinado';
  exception when sqlstate 'P0001' then if sqlerrm not like '%assinado%' then raise; end if;
  end;
  begin
    update public.termos_online set opcoes = '[]' where id = 'ricardo-motors-v1';
    raise exception 'devia recusar mudar as opções do termo assinado';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    delete from public.termos_online where id = 'ricardo-motors-v1';
    raise exception 'devia recusar apagar o termo assinado';
  exception when foreign_key_violation then null;
  end;
  update public.termos_online set aberto = false where id = 'ricardo-motors-v1';
  assert not (select aberto from public.termos_online where id = 'ricardo-motors-v1'), 'fechar';
end $$;
-- Sem opções e só pessoa física: o plano fica vazio e o CNPJ é ignorado. Termo sem assinatura sai.
insert into public.termos_online (id, lead_id, titulo, texto, aberto, opcoes) values ('ricardo-motors-v2', 'lead-rm', 'v2', 'Texto da v2', true, '[]');
reset role;
select pg_temp.como('anon', null);
do $$
declare r jsonb;
begin
  r := public.aceitar_termo_online('ricardo-motors-v2', encode(extensions.digest('Texto da v2', 'sha256'), 'hex'),
    '{"nome": "Ana Souza", "cpf": "52998224725", "email": "ana@exemplo.com", "whatsapp": "11999998888", "endereco": "Rua A, 10, Cotia/SP",
      "plano": "qualquer", "cnpj": "11222333000181", "empresa": "X", "declaracoes": {"li": true, "responsavel": true, "privacidade": true}}');
  assert (r ->> 'ok')::boolean, 'sem opções: ' || r::text;
end $$;
reset role;
do $$ begin
  assert (select plano = '' and cnpj = '' and empresa = '' from public.termos_aceites where termo_id = 'ricardo-motors-v2'), 'pf sem opções';
end $$;
select pg_temp.como('authenticated', '00000000-0000-0000-0000-00000000000a');
insert into public.termos_online (id, lead_id, titulo, texto) values ('rascunho-v1', 'lead-rm', 'r', 'rascunho');
delete from public.termos_online where id = 'rascunho-v1';
do $$ begin assert not exists (select 1 from public.termos_online where id = 'rascunho-v1'), 'termo sem assinatura sai'; end $$;
reset role;

-- 7b. O termo do vereador (feito à mão, texto vazio) não muda o texto pelo painel.
select pg_temp.como('authenticated', '00000000-0000-0000-0000-00000000000a');
do $$ begin
  if not exists (select 1 from public.termos_online where id = 'vereador-mateuzinho-silva-v1') then return; end if;
  begin
    update public.termos_online set texto = 'outro texto' where id = 'vereador-mateuzinho-silva-v1';
    raise exception 'devia recusar mudar o texto do termo feito à mão';
  exception when sqlstate 'P0001' then if sqlerrm not like '%página própria%' then raise; end if;
  end;
  update public.termos_online set exige_codigo = true where id = 'vereador-mateuzinho-silva-v1';
end $$;
reset role;

-- 8. O termo do vereador (banco de antes) continua: o texto chega com a primeira assinatura e os planos antigos valem.
do $$
declare r jsonb; t text := 'Contrato do vereador, texto de teste';
begin
  if not exists (select 1 from public.termos_online where id = 'vereador-mateuzinho-silva-v1') then return; end if;
  update public.termos_online set exige_codigo = false where id = 'vereador-mateuzinho-silva-v1';
  r := public.aceitar_termo_online('vereador-mateuzinho-silva-v1', encode(extensions.digest(t, 'sha256'), 'hex'),
    '{"nome": "Mateus Santos", "cpf": "52998224725", "email": "m@exemplo.com", "whatsapp": "11999998888", "endereco": "Rua B, 20, Itapevi/SP",
      "plano": "sem-plano", "declaracoes": {"li": true, "responsavel": true, "privacidade": true}}', t);
  assert (r ->> 'ok')::boolean, 'vereador: ' || r::text;
  assert (select texto = t and impressao = encode(extensions.digest(t, 'sha256'), 'hex') from public.termos_online where id = 'vereador-mateuzinho-silva-v1'), 'texto do vereador guardado';
  r := public.aceitar_termo_online('vereador-mateuzinho-silva-v1', encode(extensions.digest(t, 'sha256'), 'hex'),
    '{"nome": "Mateus Santos", "cpf": "52998224725", "email": "m@exemplo.com", "whatsapp": "11999998888", "endereco": "Rua B, 20, Itapevi/SP",
      "plano": "painel", "declaracoes": {"li": true, "responsavel": true, "privacidade": true}}', t);
  assert r ->> 'campo' = 'plano', 'vereador só com os planos dele: ' || r::text;
end $$;

select 'termos de lead: tudo certo' as resultado;
