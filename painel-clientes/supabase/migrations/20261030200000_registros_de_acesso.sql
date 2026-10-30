-- Missão 5B, revisão dos termos (30/10/2026): os registros de acesso do Marco Civil da Internet (Lei 12.965/2014,
-- art. 15: o provedor de aplicações com fins econômicos guarda os registros de acesso, a data e a hora de uso a partir
-- de um endereço IP, sob sigilo, em ambiente controlado e de segurança, por 6 meses). As entradas do Admin já tinham a
-- data, a hora e o aparelho, mas não o IP, e o log do login do Supabase não fica 6 meses.
-- A tabela é fechada: nem quem entrou nem o visitante leem (RLS sem política); só o dono do banco, para atender uma
-- ordem judicial. Sem chave estrangeira de propósito: apagar a conta ou o login não apaga o registro antes dos 6 meses
-- (LGPD, art. 16, I: guarda para cumprir obrigação legal). Cada entrada apaga os registros com mais de 6 meses.

create table public.registros_de_acesso (
  id bigint generated always as identity primary key,
  usuario_id uuid not null,
  conta_id uuid,
  quando timestamptz not null default now(),
  ip inet
);
comment on table public.registros_de_acesso is 'Marco Civil, art. 15: data, hora e IP de cada entrada no painel, guardados 6 meses, sob sigilo (ninguém lê pela API). Gravada por registrar_entrada.';
create index registros_de_acesso_quando on public.registros_de_acesso (quando);
alter table public.registros_de_acesso enable row level security;
revoke all on public.registros_de_acesso from anon, authenticated;

-- A mesma função de antes, agora com o registro de acesso (o IP vem do cabeçalho da requisição, como no aceite do
-- contrato) e a limpeza dos registros com mais de 6 meses.
create or replace function public.registrar_entrada(conta uuid, aparelho text default null) returns void language plpgsql security definer set search_path = '' as $$
declare
  eu uuid := (select auth.uid());
  pid uuid;
  v_cab json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := btrim(coalesce(nullif(v_cab ->> 'cf-connecting-ip', ''), split_part(coalesce(v_cab ->> 'x-forwarded-for', ''), ',', 1)));
begin
  if eu is null then
    raise exception 'Entre antes.' using errcode = '42501';
  end if;
  select id into pid from public.pessoas where conta_id = registrar_entrada.conta and usuario_id = eu and ativa;
  if pid is null and not public.em_suporte(registrar_entrada.conta) then
    raise exception 'Você não é desta conta.' using errcode = '42501';
  end if;
  if v_ip !~ '^[0-9a-fA-F.:]{3,45}$' then v_ip := null; end if;
  if not exists (
    select 1 from public.entradas e
    where e.usuario_id = eu and e.conta_id = registrar_entrada.conta and e.quando > now() - interval '30 minutes'
  ) then
    insert into public.entradas (usuario_id, conta_id, pessoa_id, aparelho)
    values (eu, registrar_entrada.conta, pid, left(registrar_entrada.aparelho, 300));
    insert into public.registros_de_acesso (usuario_id, conta_id, ip) values (eu, registrar_entrada.conta, v_ip::inet);
    delete from public.registros_de_acesso where quando < now() - interval '6 months';
  end if;
  if pid is not null then
    update public.pessoas set visto_em = now() where id = pid;
  end if;
end $$;
