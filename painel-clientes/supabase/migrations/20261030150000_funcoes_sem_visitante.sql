-- Missão 5 · bloco B (revisão de segurança, 06): o visitante (anon) só executa as funções públicas (publico_*).
-- A Missão 2 já tinha tirado dele as funções de regra (security definer); sobravam as auxiliares, que rodam com os
-- direitos de quem chama (normalizar e-mail e WhatsApp, conferir acessos, a pasta da conta no Storage, o turno do dia)
-- e as de gatilho. Nenhuma dá nada ao visitante (ele não lê tabela nenhuma), mas pela API, /rest/v1/rpc/<função>,
-- ele podia chamá-las. As funções públicas chamam estas como dono, e os gatilhos não conferem quem executa, então nada
-- muda no painel nem nas páginas públicas. Quem entrou (authenticated) e o servidor (service_role) continuam como
-- estavam. Daqui para a frente, função nova aberta ao visitante faz o teste 090 falhar.

revoke execute on function
  public.acessos_suporte_antes(),
  public.acessos_validos(jsonb),
  public.clientes_antes(),
  public.conta_da_pasta(text),
  public.contas_antes(),
  public.contas_modulos_antes(),
  public.contratos_antes(),
  public.convites_antes(),
  public.entregas_antes(),
  public.marcar_atualizado(),
  public.modulo_base(text),
  public.normalizar_email(text),
  public.normalizar_whatsapp(text),
  public.pelo_app(),
  public.pessoas_antes(),
  public.reservas_checklist_antes(),
  public.sites_versoes_antes(),
  public.turno_no_dia(date, time, time, text)
from public, anon;

grant execute on function
  public.acessos_suporte_antes(),
  public.acessos_validos(jsonb),
  public.clientes_antes(),
  public.conta_da_pasta(text),
  public.contas_antes(),
  public.contas_modulos_antes(),
  public.contratos_antes(),
  public.convites_antes(),
  public.entregas_antes(),
  public.marcar_atualizado(),
  public.modulo_base(text),
  public.normalizar_email(text),
  public.normalizar_whatsapp(text),
  public.pelo_app(),
  public.pessoas_antes(),
  public.reservas_checklist_antes(),
  public.sites_versoes_antes(),
  public.turno_no_dia(date, time, time, text)
to authenticated, service_role;
