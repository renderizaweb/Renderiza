-- Missão 7, bloco B (D42): o convite por link, mandado pelo WhatsApp, sem e-mail. A Renderiza (ou o dono) cria o
-- convite com um usuário (ex.: espacojardim) e um código de link; quem recebe abre /boas-vindas/<código>, cria a
-- senha e entra. O e-mail do convite é o endereço interno do usuário (<usuario>@acesso.renderizaweb.com.br, que não
-- recebe e-mail), então o login do Supabase e o aceitar_convites() de sempre funcionam sem mudança.
-- O mesmo link serve para quem já tem o usuário e esqueceu a senha (sem e-mail para recuperar): a Renderiza gera um
-- link novo e a pessoa cria uma senha nova. Quem cria o login ou troca a senha é a função aceitar-convite (servidor,
-- com a chave secreta); o painel não marca o link como usado.

alter table public.convites
  add column usuario text check (usuario ~ '^[a-z0-9][a-z0-9._-]{2,29}$'),
  add column link_codigo text unique check (link_codigo ~ '^[a-z0-9]{24,64}$'),
  add column link_usado_em timestamptz,
  add constraint convites_link_completo check ((usuario is null) = (link_codigo is null)),
  add constraint convites_link_email check (usuario is null or email = usuario || '@acesso.renderizaweb.com.br');
comment on column public.convites.usuario is 'Convite por link (D42): o usuário com que a pessoa entra. O e-mail do convite é <usuario>@acesso.renderizaweb.com.br (interno, não recebe e-mail).';
comment on column public.convites.link_codigo is 'Convite por link: o código de /boas-vindas/<código>. Trocar o código (gerar link novo) libera o link de novo.';
comment on column public.convites.link_usado_em is 'Quando o link foi usado (só a função aceitar-convite marca).';

-- O painel não marca o link como usado; trocar o código libera de novo (o "gerar link novo").
create or replace function public.convites_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  new.email := public.normalizar_email(new.email);
  if tg_op = 'INSERT' and public.pelo_app() then
    new.convidado_por := public.minha_pessoa(new.conta_id);
    new.aceito_em := null;
    new.pessoa_id := null;
    new.link_usado_em := null;
  elsif tg_op = 'UPDATE' and public.pelo_app() then
    if (new.aceito_em, new.pessoa_id) is distinct from (old.aceito_em, old.pessoa_id) then
      raise exception 'O convite é aceito por quem foi convidado, ao entrar.' using errcode = '42501';
    end if;
    new.link_usado_em := case when new.link_codigo is distinct from old.link_codigo then null else old.link_usado_em end;
  end if;
  return new;
end $$;

-- O que a tela de boas-vindas precisa (público, pelo código): o nome do negócio, o nicho, o usuário e se a pessoa já
-- tem esse usuário (aí é "crie uma senha nova"). Link usado, vencido ou cancelado diz o motivo, sem mais nada.
create function public.publico_convite(p_codigo text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  c record;
begin
  if p_codigo is null or p_codigo !~ '^[a-z0-9]{24,64}$' then return null; end if;
  select v.usuario, v.nome, v.link_usado_em, v.aceito_em, v.cancelado_em, v.expira_em, k.nome as negocio, k.nicho, v.email
    into c
    from public.convites v join public.contas k on k.id = v.conta_id
    where v.link_codigo = p_codigo;
  if not found or c.cancelado_em is not null then return null; end if;
  if c.link_usado_em is not null then return jsonb_build_object('valido', false, 'motivo', 'usado', 'usuario', c.usuario); end if;
  if c.expira_em <= now() then return jsonb_build_object('valido', false, 'motivo', 'vencido', 'negocio', c.negocio); end if;
  return jsonb_build_object(
    'valido', true, 'negocio', c.negocio, 'nicho', c.nicho, 'usuario', c.usuario, 'nome', c.nome,
    'ja_tem_acesso', exists (select 1 from auth.users u where lower(u.email) = c.email)
  );
end $$;
comment on function public.publico_convite(text) is 'Convite por link (/boas-vindas/<código>, D42): o negócio, o nicho, o usuário e se ele já existe; ou o motivo de não valer. null = o link não existe.';
revoke execute on function public.publico_convite(text) from public;
grant execute on function public.publico_convite(text) to anon, authenticated;

-- Para o Admin (e o dono) escolherem o usuário: ainda não existe login nem convite pendente com ele.
create function public.usuario_disponivel(p_usuario text) returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Entre antes.' using errcode = '42501';
  end if;
  if p_usuario is null or p_usuario !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then return false; end if;
  return not exists (select 1 from auth.users u where lower(u.email) = p_usuario || '@acesso.renderizaweb.com.br')
     and not exists (select 1 from public.convites v where v.usuario = p_usuario and v.aceito_em is null and v.cancelado_em is null);
end $$;
comment on function public.usuario_disponivel(text) is 'Convite por link: o usuário está livre (sem login e sem convite pendente com ele)?';
revoke execute on function public.usuario_disponivel(text) from public, anon;
grant execute on function public.usuario_disponivel(text) to authenticated, service_role;
