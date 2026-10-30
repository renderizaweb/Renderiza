-- Missão 3 · bloco E: o aceite do contrato pelo link (/c/<código>; 02, 05, 06, D14). As duas funções públicas que a
-- página publico/contrato/ chama direto no banco, com a chave pública:
-- - publico_contrato(código): o contrato enviado ou aceito, com o resumo (a festa ou o ensaio, os valores), o negócio
--   e, depois do aceite, os dados do Pix (contas.ajustes.pix). Orçamento, cancelado, código errado, conta não
--   liberada ou Contratos desligado: null. O aceito continua aparecendo (é a prova de quem aceitou).
-- - publico_aceitar_contrato(código, nome, contato, impressão): grava o aceite. O IP e o aparelho vêm do próprio
--   pedido (cabeçalhos), não de quem chama; a impressão digital (o hash do texto que a pessoa leu) tem de ser a do
--   contrato, senão o texto mudou depois que a página abriu. Aceitar de novo não muda nada.
-- As duas devolvem só o contrato daquele código (05: "a não ser o contrato para quem tem o código dele").

-- O contrato do link: enviado (conta liberada e Contratos ligado) ou aceito.
create function public.contrato_do_link(p_codigo text) returns public.contratos language sql stable security definer set search_path = '' as $$
  select ct.*
  from public.contratos ct
  join public.contas c on c.id = ct.conta_id
  where p_codigo ~ '^[a-z0-9]{16,64}$' and ct.codigo = p_codigo
    and (
      ct.situacao = 'aceito'
      or (ct.situacao = 'enviado' and public.conta_liberada(c.id) and exists (
        select 1 from public.contas_modulos cm join public.modulos m on m.id = cm.modulo_id
        where cm.conta_id = c.id and cm.modulo_id = 'contratos' and cm.ligado and (c.situacao <> 'teste' or m.liberado_no_teste)
      ))
    )
$$;
comment on function public.contrato_do_link(text) is 'O contrato pelo código do link: enviado (conta liberada, Contratos ligado) ou aceito. Só para as funções publico_*.';
revoke execute on function public.contrato_do_link(text) from public, anon, authenticated;

create function public.publico_contrato(p_codigo text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  ct public.contratos := public.contrato_do_link(p_codigo);
  c public.contas;
  r public.reservas;
  v public.reservas_valores;
begin
  if ct.id is null then return null; end if;
  select * into c from public.contas where id = ct.conta_id;
  select * into r from public.reservas where id = ct.reserva_id;
  select * into v from public.reservas_valores where reserva_id = ct.reserva_id;
  return jsonb_build_object(
    'situacao', ct.situacao,
    'texto', ct.texto,
    'impressao', ct.hash,
    'enviado_em', ct.enviado_em,
    'aceito_em', ct.aceito_em,
    'aceito_nome', ct.aceito_nome,
    'negocio', jsonb_build_object('nome', c.nome, 'nicho', c.nicho, 'logo', c.logo, 'whatsapp', c.whatsapp, 'fuso', c.fuso),
    'resumo', jsonb_build_object(
      'cliente', (select nome from public.clientes where id = ct.cliente_id),
      'tipo', coalesce((select nome from public.tipos_reserva where id = r.tipo_id), (select nome from public.servicos where id = r.servico_id)),
      'pacote', (select nome from public.servicos where id = r.servico_id),
      'inicio', r.inicio,
      'fim', r.fim,
      'convidados', r.convidados,
      'adicionais', coalesce((select jsonb_agg(a.nome order by a.nome) from public.reservas_adicionais ra join public.adicionais a on a.id = ra.adicional_id where ra.reserva_id = r.id), '[]'::jsonb),
      'valor_total', v.valor_total,
      'desconto', v.desconto,
      'sinal', v.sinal
    ),
    'pix', case when ct.situacao = 'aceito' and nullif(btrim(c.ajustes #>> '{pix,chave}'), '') is not null
      then jsonb_build_object('chave', btrim(c.ajustes #>> '{pix,chave}'), 'nome', nullif(btrim(c.ajustes #>> '{pix,nome}'), ''))
      end
  );
end $$;
comment on function public.publico_contrato(text) is 'Contratos (pública, /c/<código>): o contrato enviado ou aceito, com o resumo e o negócio; o Pix só depois do aceite. null = o link não vale.';

create function public.publico_aceitar_contrato(p_codigo text, p_nome text, p_contato text, p_impressao text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  ct public.contratos := public.contrato_do_link(p_codigo);
  v_nome text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g');
  v_contato text := btrim(coalesce(p_contato, ''));
  v_cab json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := btrim(coalesce(nullif(v_cab ->> 'cf-connecting-ip', ''), split_part(coalesce(v_cab ->> 'x-forwarded-for', ''), ',', 1)));
begin
  if ct.id is null then return jsonb_build_object('ok', false, 'erro', 'fora'); end if;
  if ct.situacao = 'aceito' then return jsonb_build_object('ok', true, 'contrato', public.publico_contrato(p_codigo)); end if;
  if length(v_nome) not between 3 and 120 or v_nome !~ '[[:alpha:]]' then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'nome'); end if;
  if length(v_contato) not between 6 and 120 then return jsonb_build_object('ok', false, 'erro', 'dados', 'campo', 'contato'); end if;
  if p_impressao is distinct from ct.hash then return jsonb_build_object('ok', false, 'erro', 'mudou'); end if;
  if v_ip !~ '^[0-9a-fA-F.:]{3,45}$' then v_ip := null; end if;
  update public.contratos set
    situacao = 'aceito', aceito_em = now(), aceito_nome = v_nome, aceito_contato = v_contato,
    aceito_ip = v_ip::inet, aceito_aparelho = left(v_cab ->> 'user-agent', 300)
  where id = ct.id and situacao = 'enviado';
  return jsonb_build_object('ok', true, 'contrato', public.publico_contrato(p_codigo));
exception when invalid_text_representation then
  -- um IP que o Postgres não entende não impede o aceite
  update public.contratos set
    situacao = 'aceito', aceito_em = now(), aceito_nome = v_nome, aceito_contato = v_contato,
    aceito_aparelho = left(v_cab ->> 'user-agent', 300)
  where id = ct.id and situacao = 'enviado';
  return jsonb_build_object('ok', true, 'contrato', public.publico_contrato(p_codigo));
end $$;
comment on function public.publico_aceitar_contrato(text, text, text, text) is 'Contratos (pública, /c/<código>): grava o aceite (nome, contato, data, hora, IP e aparelho do pedido). erro: fora (o link não vale), dados (campo), mudou (o texto mudou depois que a página abriu).';

revoke execute on function public.publico_contrato(text), public.publico_aceitar_contrato(text, text, text, text) from public;
grant execute on function public.publico_contrato(text), public.publico_aceitar_contrato(text, text, text, text) to anon, authenticated;
