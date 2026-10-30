-- Missão 5 · bloco A (Admin): "entrar na conta para ajudar" (02, 05, 06). minhas_contas() passa a trazer também a
-- conta em que a pessoa da Renderiza está em suporte (acessos_suporte valendo), para o painel abrir a conta como ela
-- é. Nessa linha: pessoa_id nulo; liberada = true (o suporte vê até a conta desligada ou com o teste vencido, para
-- exportar os dados de quem sai: D19); os módulos ligados da conta; os acessos no nível do suporte ("ver" ou
-- "editar"; "editar" vale como dono, para ajudar a configurar); e suporte_ate, quando o suporte acaba.
-- Quem decide o que ela vê continua sendo o banco: pode() já aceita o suporte registrado (em_suporte).
-- A função não guarda dado: trocar as colunas pede drop e create.

drop function public.minhas_contas();

create function public.minhas_contas() returns table (
  conta_id uuid, nome text, nicho text, codigo text, logo text, cores jsonb, situacao text, teste_ate timestamptz,
  ativa_ate date, liberada boolean, ajustes jsonb, pessoa_id uuid, dono boolean, acessos jsonb, modulos text[],
  suporte_ate timestamptz
) language sql stable security definer set search_path = '' as $$
  select c.id, c.nome, c.nicho, c.codigo, c.logo, c.cores, c.situacao, c.teste_ate, c.ativa_ate,
    public.conta_liberada(c.id), c.ajustes, p.id, p.dono, p.acessos,
    array(
      select cm.modulo_id from public.contas_modulos cm
      join public.modulos m on m.id = cm.modulo_id
      where cm.conta_id = c.id and cm.ligado and (c.situacao <> 'teste' or m.liberado_no_teste)
      order by m.ordem
    ),
    null::timestamptz
  from public.pessoas p
  join public.contas c on c.id = p.conta_id
  where p.usuario_id = (select auth.uid()) and p.ativa
  union all
  select c.id, c.nome, c.nicho, c.codigo, c.logo, c.cores, c.situacao, c.teste_ate, c.ativa_ate,
    true, c.ajustes, null::uuid, s.nivel = 'editar',
    coalesce((select jsonb_object_agg(cm.modulo_id, s.nivel) from public.contas_modulos cm where cm.conta_id = c.id and cm.ligado), '{}'),
    array(
      select cm.modulo_id from public.contas_modulos cm
      join public.modulos m on m.id = cm.modulo_id
      where cm.conta_id = c.id and cm.ligado
      order by m.ordem
    ),
    s.fim
  from (
    select distinct on (a.conta_id) a.conta_id, a.nivel, a.fim
    from public.acessos_suporte a
    where a.usuario_id = (select auth.uid()) and now() >= a.inicio and now() < a.fim
    order by a.conta_id, (a.nivel = 'editar') desc, a.fim desc
  ) as s
  join public.contas c on c.id = s.conta_id
  where public.eh_equipe_renderiza()
    and not exists (select 1 from public.pessoas p where p.conta_id = c.id and p.usuario_id = (select auth.uid()) and p.ativa)
  order by 2
$$;
comment on function public.minhas_contas() is 'As contas da pessoa logada, com os acessos dela e os módulos ligados (modulos). liberada = false: teste vencido, conta desligada ou fora do prazo. Para a Renderiza, também a conta em que está em suporte (suporte_ate: até quando; pessoa_id nulo).';

revoke execute on function public.minhas_contas() from public, anon;
grant execute on function public.minhas_contas() to authenticated;
