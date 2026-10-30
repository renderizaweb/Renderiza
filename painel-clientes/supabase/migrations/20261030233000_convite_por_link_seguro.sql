-- Missão 7, bloco B (D42): o convite por link não pode virar porta para tomar o acesso de outra pessoa. O link de um
-- usuário que já tem login troca a senha dele (é o "link para senha nova" de quem esqueceu); então só vale quando
-- quem gerou o link pode fazer isso: a Renderiza (Admin), ou o dono de uma conta para alguém que só está na conta dele.
-- O banco recusa o convite com o usuário de outra pessoa, e a função aceitar-convite confere de novo ao aceitar.
-- E um usuário só pode ter um convite pendente por vez (dois links para o mesmo usuário em contas diferentes eram a
-- outra porta).

alter table public.convites add column pela_renderiza boolean not null default false;
comment on column public.convites.pela_renderiza is 'O link foi gerado pela equipe da Renderiza (Admin). Só assim o link pode trocar a senha de um login que está em outra conta.';

create unique index convites_usuario_pendente on public.convites (usuario)
  where usuario is not null and aceito_em is null and cancelado_em is null;

create function public.convite_pode_usar_login(p_conta uuid, p_email text, p_pela_renderiza boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  with login as (select u.id from auth.users u where lower(u.email) = lower(btrim(p_email)))
  select p_pela_renderiza
    or not exists (select 1 from login)
    or (exists (select 1 from public.pessoas p join login l on l.id = p.usuario_id where p.conta_id = p_conta)
        and not exists (select 1 from public.pessoas p join login l on l.id = p.usuario_id where p.conta_id <> p_conta)
        and not exists (select 1 from public.equipe_renderiza r join login l on l.id = r.usuario_id))
$$;
comment on function public.convite_pode_usar_login(uuid, text, boolean) is 'Convite por link: o link pode usar esse login (criar, ou trocar a senha)? Sim se o login não existe, se foi a Renderiza, ou se a pessoa só está nesta conta.';
revoke execute on function public.convite_pode_usar_login(uuid, text, boolean) from public, anon;
grant execute on function public.convite_pode_usar_login(uuid, text, boolean) to authenticated, service_role;

create or replace function public.convites_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  new.email := public.normalizar_email(new.email);
  if tg_op = 'INSERT' and public.pelo_app() then
    new.convidado_por := public.minha_pessoa(new.conta_id);
    new.aceito_em := null;
    new.pessoa_id := null;
    new.link_usado_em := null;
    new.pela_renderiza := public.eh_equipe_renderiza();
  elsif tg_op = 'UPDATE' and public.pelo_app() then
    if (new.aceito_em, new.pessoa_id) is distinct from (old.aceito_em, old.pessoa_id) then
      raise exception 'O convite é aceito por quem foi convidado, ao entrar.' using errcode = '42501';
    end if;
    new.link_usado_em := case when new.link_codigo is distinct from old.link_codigo then null else old.link_usado_em end;
    -- quem gera o link novo responde por ele
    new.pela_renderiza := case when (new.link_codigo, new.usuario) is distinct from (old.link_codigo, old.usuario)
      then public.eh_equipe_renderiza() else old.pela_renderiza end;
  end if;
  if public.pelo_app() and new.usuario is not null
     and (tg_op = 'INSERT' or (new.link_codigo, new.usuario) is distinct from (old.link_codigo, old.usuario))
     and not public.convite_pode_usar_login(new.conta_id, new.email, new.pela_renderiza) then
    raise exception 'Esse usuário já é de outra pessoa. Escolha outro.' using errcode = '23505';
  end if;
  return new;
end $$;
