-- Missão 2 · bloco A: apagar uma conta inteira funciona (conta cancelada depois dos 90 dias; a semente de teste).
-- Dois tropeços, achados pela semente no banco local, antes de qualquer conta real:
-- 1. reservas_adicionais aponta para adicionais e para reservas; ao apagar a conta, o banco conferia a ligação com
--    o adicional antes de apagar a reserva (e com ela os adicionais vendidos). A conferência passa para o fim da
--    transação: apagar um adicional que ainda está numa reserva continua dando erro.
-- 2. O histórico tentava registrar as mudanças que o próprio apagamento faz (responsável virando null) numa conta
--    que já não existe. Agora, sem a conta, não registra nada.

alter table public.reservas_adicionais alter constraint reservas_adicionais_conta_id_adicional_id_fkey deferrable initially deferred;

create or replace function public.registrar_atividade() returns trigger language plpgsql security definer set search_path = '' as $$
declare
  linha jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  antes jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  conta uuid := (linha ->> 'conta_id')::uuid;
  colunas text[] := '{}';
  detalhe jsonb := '{}';
  cliente uuid;
  reserva uuid;
  eu uuid := (select auth.uid());
  pessoa uuid;
  k text;
begin
  -- a conta inteira sendo apagada (e, junto, os responsáveis virando null): não há o que registrar
  if not exists (select 1 from public.contas where id = conta) then
    return null;
  end if;
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(c order by c), '{}') into colunas
    from jsonb_object_keys(linha) as c
    where c <> 'atualizado_em' and linha -> c is distinct from antes -> c;
    if cardinality(colunas) = 0 then
      return null;
    end if;
    foreach k in array array['etapa', 'situacao', 'feito'] loop
      if k = any (colunas) then
        detalhe := detalhe || jsonb_build_object(k, jsonb_build_array(antes -> k, linha -> k));
      end if;
    end loop;
    if 'pago_em' = any (colunas) then
      detalhe := detalhe || jsonb_build_object('pago', linha ->> 'pago_em' is not null);
    end if;
    if 'arquivado_em' = any (colunas) then
      detalhe := detalhe || jsonb_build_object('arquivado', linha ->> 'arquivado_em' is not null);
    end if;
  end if;

  reserva := coalesce((linha ->> 'reserva_id')::uuid, case when tg_table_name = 'reservas' then (linha ->> 'id')::uuid end);
  cliente := case when tg_table_name = 'clientes' then (linha ->> 'id')::uuid else (linha ->> 'cliente_id')::uuid end;
  if cliente is null and reserva is not null then
    select r.cliente_id into cliente from public.reservas r where r.id = reserva;
  end if;
  if eu is not null then
    select p.id into pessoa from public.pessoas p where p.conta_id = conta and p.usuario_id = eu;
  end if;

  insert into public.atividades (conta_id, pessoa_id, pelo_suporte, acao, tabela, registro_id, cliente_id, reserva_id, modulo, mudou, detalhe)
  values (
    conta, pessoa, pessoa is null and eu is not null and public.eh_equipe_renderiza(),
    case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'mudou' else 'apagou' end,
    tg_table_name, coalesce(linha ->> 'id', linha ->> 'reserva_id', linha ->> 'cliente_id')::uuid,
    cliente, reserva, tg_argv[0], colunas, detalhe
  );
  return null;
end $$;
