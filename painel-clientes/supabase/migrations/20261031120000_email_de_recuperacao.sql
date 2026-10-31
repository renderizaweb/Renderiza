-- Missão 7 (D42, o e-mail opcional): quem entra com usuário (o convite por link) não tem e-mail para recuperar a senha.
-- Agora pode pôr um, confirmado por um código de 6 números que chega nele; com ele, o "Esqueci a senha" manda o link
-- sozinho. Quem grava é só a função email-de-recuperacao (o código vai cifrado; o e-mail e o código mandados pelo
-- Brevo). O painel só pergunta se a pessoa tem um e confirmado (meu_email_de_recuperacao, com o e-mail escondido).
-- E o aviso de pedido novo deixa de mandar para o e-mail interno do usuário (que não recebe nada) e passa a usar o
-- e-mail de recuperação confirmado do dono, quando houver.

create table public.emails_de_recuperacao (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  confirmado_em timestamptz,
  email_pendente text check (email_pendente ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email_pendente) <= 254),
  codigo_hash text check (codigo_hash ~ '^[0-9a-f]{64}$'),
  codigo_expira_em timestamptz,
  tentativas smallint not null default 0 check (tentativas between 0 and 20),
  ultimo_envio_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check ((email is null) = (confirmado_em is null))
);
comment on table public.emails_de_recuperacao is 'O e-mail para recuperar a senha de quem entra com usuário (D42): o confirmado e o que espera o código (cifrado, 15 minutos, 5 tentativas). Só a função email-de-recuperacao lê e grava.';
create trigger emails_de_recuperacao_atualizado before update on public.emails_de_recuperacao for each row execute function public.marcar_atualizado();
alter table public.emails_de_recuperacao enable row level security;
revoke all on public.emails_de_recuperacao from anon, authenticated;

create function public.meu_email_de_recuperacao() returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', case when r.email is null then null
                  else left(split_part(r.email, '@', 1), 1) || '•••@' || split_part(r.email, '@', 2) end,
    'confirmado', r.confirmado_em is not null,
    'esperando_codigo', r.codigo_hash is not null and r.codigo_expira_em > now())
  from public.emails_de_recuperacao r where r.usuario_id = (select auth.uid())
$$;
comment on function public.meu_email_de_recuperacao() is 'O e-mail de recuperação de quem está logado, escondido (a•••@gmail.com), e se está confirmado. null = não tem.';
revoke execute on function public.meu_email_de_recuperacao() from public, anon;
grant execute on function public.meu_email_de_recuperacao() to authenticated;

create or replace function public.aviso_do_pedido(p_pedido uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_conta uuid;
begin
  insert into public.pedidos_avisos (pedido_id, conta_id)
  select p.id, p.conta_id from public.pedidos p
  where p.id = p_pedido and p.origem = 'agenda_online' and p.criado_em > now() - interval '15 minutes'
  on conflict (pedido_id) do nothing
  returning conta_id into v_conta;
  if v_conta is null then return null; end if;

  return (
    select jsonb_build_object(
      'conta', c.nome,
      'nicho', c.nicho,
      -- os donos: o e-mail de cada um, menos o interno de quem entra com usuário (não recebe nada); desses, o de
      -- recuperação confirmado, se tiverem
      'para', coalesce((select jsonb_agg(distinct x.email) from (
          select pe.email from public.pessoas pe
          where pe.conta_id = c.id and pe.dono and pe.ativa and pe.email is not null and pe.email not like '%@acesso.renderizaweb.com.br'
          union
          select er.email from public.pessoas pe join public.emails_de_recuperacao er on er.usuario_id = pe.usuario_id
          where pe.conta_id = c.id and pe.dono and pe.ativa and er.confirmado_em is not null
        ) x), '[]'),
      'cliente', jsonb_build_object('nome', cl.nome, 'whatsapp', cl.whatsapp, 'email', cl.email),
      'data', p.data_desejada,
      'inicio', to_char(r.inicio at time zone c.fuso, 'HH24:MI'),
      'fim', to_char(r.fim at time zone c.fuso, 'HH24:MI'),
      'tipo', t.nome,
      'pacote', s.nome,
      'convidados', p.convidados,
      'mensagem', p.mensagem
    )
    from public.pedidos p
    join public.contas c on c.id = p.conta_id
    join public.clientes cl on cl.id = p.cliente_id
    left join public.reservas r on r.id = p.reserva_id
    left join public.tipos_reserva t on t.id = p.tipo_id
    left join public.servicos s on s.id = p.servico_id
    where p.id = p_pedido
  );
end $$;
