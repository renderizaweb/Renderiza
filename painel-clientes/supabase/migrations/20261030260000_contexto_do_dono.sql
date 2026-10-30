-- Missão 7, bloco E (D43, D44): na conversa de boas-vindas, o dono confirma num toque o que a demo já sabe (o
-- WhatsApp, a região, os tipos de festa ou de ensaio). O contexto da conta é fechado (só a Renderiza), então o dono lê
-- por esta função só os dados da demo, nunca a conversa colada.

create function public.contexto_da_minha_conta(p_conta uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select x.dados from public.contas_contexto x
  where x.conta_id = p_conta and public.pode(p_conta, 'configuracoes', 'editar')
$$;
comment on function public.contexto_da_minha_conta(uuid) is 'Para a conversa de boas-vindas: o que a demo sabia da conta (sem a conversa colada). Só quem muda as Configurações (o dono).';
revoke execute on function public.contexto_da_minha_conta(uuid) from public, anon;
grant execute on function public.contexto_da_minha_conta(uuid) to authenticated;
