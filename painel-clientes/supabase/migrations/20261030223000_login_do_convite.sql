-- Missão 7, bloco B (D42): a função aceitar-convite (servidor) precisa saber se o usuário do convite já tem login
-- (quem esqueceu a senha e recebeu um link novo) para trocar a senha em vez de criar outro. Só o servidor chama.

create function public.login_do_email(p_email text) returns uuid language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1
$$;
comment on function public.login_do_email(text) is 'Convite por link: o login (id) com esse e-mail, se existir. Só a função aceitar-convite (service_role) chama.';
revoke execute on function public.login_do_email(text) from public, anon, authenticated;
grant execute on function public.login_do_email(text) to service_role;
