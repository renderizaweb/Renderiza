-- Missão 2 · bloco A: as funções de regra (security definer) não ficam abertas ao visitante (anon).
-- Aviso do Supabase no STG (anon_security_definer_function_executable): pela API, /rest/v1/rpc/<função> deixava
-- quem não entrou perguntar, por exemplo, se uma conta (pelo id) está liberada. O visitante não lê nenhuma tabela
-- (as políticas são "to authenticated") e as funções públicas das próximas missões chamam estas como dono, então
-- tirar o acesso dele não muda nada no painel.

revoke execute on function
  public.conta_liberada(uuid),
  public.donos_ativos(uuid, uuid),
  public.edita_algum(uuid),
  public.eh_equipe_renderiza(),
  public.eh_membro(uuid),
  public.em_suporte(uuid, text),
  public.minha_pessoa(uuid),
  public.pessoas_ativas(uuid, uuid),
  public.pode_algum(uuid, text[], text),
  public.pode(uuid, text, text),
  public.registrar_atividade(),
  public.reservas_checklist_do_tipo()
from public, anon;
