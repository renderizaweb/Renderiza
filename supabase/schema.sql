-- Painel Renderiza — estrutura do banco no Supabase.
-- Rode no SQL Editor do projeto (pode rodar de novo sem perder dados).
--
-- Tabelas:
--   leads           pipeline de vendas (tela Pipeline)
--   interacoes      o que de fato aconteceu com cada ótica: primeiro contato, retorno feito,
--                   resposta recebida, anotação. Datas planejadas NÃO vão aqui (vão em leads.followup_em).
--   tarefas         o que fazer: dia e hora opcionais, cliente opcional, responsável opcional (tela Tarefas)
--   ciclos          período, meta de novas óticas e cadência de retornos (tela Ritmo)
--   conteudos       ideias e publicações (tela Conteúdo)
--   demos           prazo de cada demo (/demo/<pasta>): no ar, fora do ar, vale até. O site consulta antes de abrir
--   arquivo_legado  portfólio, lançamentos, semanas e config do painel antigo, guardados como JSON
--
-- Segurança: cada linha tem um dono (o usuário logado). As políticas de RLS só deixam
-- cada usuário ver e editar as próprias linhas. A chave pública (anon) sozinha não lê nada.

-- ---------- leads ----------
create table if not exists public.leads (
  id              text primary key default gen_random_uuid()::text,
  dono            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  empresa         text not null default '',
  -- Funil (09/10/2026): a_trabalhar, demo_pronta ("Prontas para trabalhar"), as três de "Em andamento"
  -- (primeiro_contato, em_negociacao, sem_resposta) e finalizado. Ver "funil reorganizado" mais abaixo.
  etapa           text not null default 'a_trabalhar'
                  check (etapa in ('a_trabalhar', 'demo_pronta', 'primeiro_contato', 'em_negociacao', 'sem_resposta', 'finalizado')),
  resultado       text check (resultado in ('ganho', 'perda', 'encerrado')),  -- encerrado: não respondeu (nem ganho, nem perda)
  motivo_perda    text,
  valor_fechado   numeric(12, 2) check (valor_fechado >= 0),
  data_fechamento date,
  whatsapp        text not null default '',
  instagram       text not null default '',          -- Instagram ou site
  proxima_acao    text not null default '',          -- o que deve acontecer depois (plano)
  followup_em     date,                              -- quando (plano; não prova que houve contato)
  valor_potencial numeric(12, 2) check (valor_potencial >= 0),
  cidade          text not null default '',
  segmento        text not null default '',
  site_atual      text not null default '',
  link_demo       text not null default '',
  link_gravacao   text not null default '',
  link_flyer      text not null default '',          -- flyer de Stories (PNG): /flyer/<id>.png ou link completo
  mensagem_whatsapp text not null default '',        -- mensagem pronta do 1º contato com a demo (painel: Mandar mensagem pronta)
  tags            text[] not null default '{}',      -- etiquetas livres; "ciclo N" = ciclo em que a conversa começou (C1, C2 no cartão)
  checklist       jsonb not null default '[]'::jsonb, -- passos do card: [{id, texto, feito, feito_em}] (no lugar da próxima ação)
  observacoes     text not null default '',
  historico       jsonb not null default '[]'::jsonb,  -- mudanças: [{em, de, para, resultado?}] e [{em, tipo:'interesse'|'nao_contatar', ...}]
  revisar         boolean not null default false,      -- marcado na migração quando o status antigo era ambíguo
  revisar_motivo  text,
  legado          jsonb,                               -- documento original do painel antigo, intacto
  posicao         double precision,                    -- ordem manual do planilhão ("Minha ordem")
  interesse       text not null default 'nao_avaliado', -- interesse demonstrado pela ótica (não é etapa)
  interesse_motivo text,                               -- por que esse nível (visível e corrigível)
  nao_contatar    boolean not null default false,      -- pediu para não receber mais contato: sai da fila de retornos
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  constraint finalizado_tem_resultado check (etapa <> 'finalizado' or resultado is not null)
);

create index if not exists leads_dono_criado_idx on public.leads (dono, criado_em desc);

-- ---------- conteudos ----------
create table if not exists public.conteudos (
  id              text primary key default gen_random_uuid()::text,
  dono            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo          text not null default '',
  canal           text check (canal in ('instagram', 'linkedin', 'portfolio', 'outro')),
  status          text not null default 'ideia' check (status in ('ideia', 'em_producao', 'publicado')),
  data_planejada  date,
  link_publicacao text not null default '',
  texto           text not null default '',   -- texto ou legenda
  gancho          text not null default '',
  cta             text not null default '',   -- chamada para ação
  link_imagem     text not null default '',
  link_video      text not null default '',
  observacoes     text not null default '',
  revisar         boolean not null default false,
  revisar_motivo  text,
  legado          jsonb,
  posicao         double precision,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index if not exists conteudos_dono_criado_idx on public.conteudos (dono, criado_em desc);

-- Colunas acrescentadas depois da primeira versão, para bancos que já existem (idempotente).
alter table public.leads     add column if not exists posicao double precision;
alter table public.conteudos add column if not exists posicao double precision;
alter table public.leads     add column if not exists interesse text not null default 'nao_avaliado';
alter table public.leads     add column if not exists interesse_motivo text;
alter table public.leads     add column if not exists nao_contatar boolean not null default false;
-- Cliente fora do funil: só na tela Clientes (relacionamento), sem aparecer no Pipeline nem no Ritmo.
alter table public.leads     add column if not exists fora_do_funil boolean not null default false;
-- Flyer de Stories (PNG 1080x1920) para retomar o contato: baixa no painel do lead e vai pelo WhatsApp.
alter table public.leads     add column if not exists link_flyer text not null default '';
-- Mensagem pronta do primeiro contato (texto + link da demo): o painel abre o WhatsApp com ela, sem enviar.
alter table public.leads     add column if not exists mensagem_whatsapp text not null default '';
-- Tags (14/10/2026): etiquetas do lead. "ciclo N" diz em que ciclo de prospecção (semanal, sexta a quinta, o
-- ciclo 1 de 02 a 08/10/2026) a conversa começou; entra sozinha pelo gatilho leads_marcar_ciclo, mais abaixo.
alter table public.leads     add column if not exists tags text[] not null default '{}';
-- Checklist do card (14/10/2026), no lugar da próxima ação: [{id, texto, feito, feito_em}]. O painel grava junto
-- em proxima_acao o primeiro item pendente, para o Ritmo, as Tarefas e a IA continuarem lendo a próxima ação.
alter table public.leads     add column if not exists checklist jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_interesse_valido') then
    alter table public.leads add constraint leads_interesse_valido
      check (interesse in ('nao_avaliado', 'interessado', 'perto_de_fechar'));
  end if;
  -- (id, dono) único para as interações apontarem para um lead do mesmo dono.
  if not exists (select 1 from pg_constraint where conname = 'leads_id_dono_key') then
    alter table public.leads add constraint leads_id_dono_key unique (id, dono);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leads_checklist_lista') then
    alter table public.leads add constraint leads_checklist_lista check (jsonb_typeof(checklist) = 'array');
  end if;
end;
$$;

-- ---------- funil reorganizado (09/10/2026) ----------
-- Leads a trabalhar → Prontas para trabalhar → Em andamento (Primeiro contato, Em negociação, Sem resposta)
-- → Finalizado (ganho, perda ou encerrado). Quem ainda está numa etapa antiga muda uma vez só, com uma
-- linha no histórico (origem "reorganizacao"):
--   demo_criada, gravacao_realizada → demo_pronta
--   demo_enviada                    → primeiro_contato
--   follow_up                       → em_negociacao se tem interesse registrado; senão sem_resposta
-- Rodar de novo não muda nenhum lead: depois da primeira vez, não sobra etapa antiga.
do $$
declare
  c record;
begin
  -- Tira as regras de etapa e de resultado (as antigas e as de uma execução anterior) para pôr as de agora.
  for c in select conname from pg_constraint
            where conrelid = 'public.leads'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ~ '\m(etapa|resultado) = ANY'
  loop
    execute format('alter table public.leads drop constraint %I', c.conname);
  end loop;
end;
$$;

update public.leads l set
  etapa = n.etapa,
  historico = l.historico || jsonb_build_array(jsonb_build_object('em', now(), 'de', l.etapa, 'para', n.etapa, 'origem', 'reorganizacao'))
from (
  select id,
         case when etapa in ('demo_criada', 'gravacao_realizada') then 'demo_pronta'
              when etapa = 'demo_enviada' then 'primeiro_contato'
              when interesse in ('interessado', 'perto_de_fechar') then 'em_negociacao'
              else 'sem_resposta' end as etapa
    from public.leads
   where etapa in ('demo_criada', 'gravacao_realizada', 'demo_enviada', 'follow_up')
) n
where l.id = n.id;

alter table public.leads add constraint leads_etapa_check
  check (etapa in ('a_trabalhar', 'demo_pronta', 'primeiro_contato', 'em_negociacao', 'sem_resposta', 'finalizado'));
alter table public.leads add constraint leads_resultado_check
  check (resultado in ('ganho', 'perda', 'encerrado'));

-- ---------- interacoes ----------
-- Só o que de fato aconteceu. O placar da tela Ritmo sai daqui:
--   novas óticas  = primeiro_contato com data exata dentro do período (um por ótica, garantido pelo índice)
--   retornos      = retorno (nova abordagem minha a uma ótica já contatada)
--   resposta      = o que a ótica respondeu (não conta como retorno meu)
--   anotacao      = registro pontual
-- precisao: 'exata' (dia conhecido), 'aproximada' (mês aproximado, guardado no dia 1) ou
-- 'desconhecida' (sem data). Só o primeiro contato recuperado de conversas antigas pode não ser exato,
-- e primeiro contato sem data exata nunca conta como ótica nova.
create table if not exists public.interacoes (
  id            text primary key default gen_random_uuid()::text,
  dono          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lead_id       text not null,
  tipo          text not null check (tipo in ('primeiro_contato', 'retorno', 'resposta', 'anotacao')),
  ocorreu_em    date,
  precisao      text not null default 'exata' check (precisao in ('exata', 'aproximada', 'desconhecida')),
  canal         text check (canal in ('whatsapp', 'telefone', 'instagram', 'email', 'presencial', 'outro')),
  resumo        text not null default '',
  interesse     text check (interesse in ('nao_avaliado', 'interessado', 'perto_de_fechar')), -- avaliação que esta interação justificou
  previsto_para date,            -- retorno: a data de follow-up que ele cumpriu (se havia uma)
  origem        text not null default 'painel' check (origem in ('painel', 'ia', 'importacao')),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint interacoes_lead_do_dono foreign key (lead_id, dono) references public.leads (id, dono) on delete cascade,
  constraint interacoes_data_coerente check ((precisao = 'desconhecida') = (ocorreu_em is null)),
  constraint interacoes_so_primeiro_contato_sem_data_exata check (precisao = 'exata' or tipo = 'primeiro_contato')
);

create unique index if not exists interacoes_um_primeiro_contato on public.interacoes (lead_id) where tipo = 'primeiro_contato';
create index if not exists interacoes_dono_data_idx on public.interacoes (dono, ocorreu_em);
create index if not exists interacoes_lead_idx on public.interacoes (lead_id);

-- Regras que mantêm o placar honesto, valendo para o painel, para a IA e para o SQL Editor.
create or replace function public.interacoes_validar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_pc public.interacoes%rowtype;
begin
  if new.ocorreu_em is not null and new.ocorreu_em > v_hoje then
    raise exception 'A interação está com data de %, que ainda não chegou. Interação é o que já aconteceu; datas planejadas vão em Follow-up.',
      to_char(new.ocorreu_em, 'DD/MM/YYYY');
  end if;
  if new.tipo = 'primeiro_contato' then
    if exists (select 1 from public.interacoes i where i.lead_id = new.lead_id and i.tipo = 'primeiro_contato' and i.id <> new.id) then
      raise exception 'Esta ótica já tem primeiro contato registrado. Uma nova abordagem é um retorno.';
    end if;
    if new.precisao = 'exata' and exists (
      select 1 from public.interacoes i
      where i.lead_id = new.lead_id and i.tipo = 'retorno' and i.id <> new.id and i.ocorreu_em < new.ocorreu_em
    ) then
      raise exception 'Há retorno registrado antes de %; o primeiro contato não pode ser depois dele.', to_char(new.ocorreu_em, 'DD/MM/YYYY');
    end if;
  elsif new.tipo = 'retorno' then
    select * into v_pc from public.interacoes i where i.lead_id = new.lead_id and i.tipo = 'primeiro_contato' and i.id <> new.id;
    if not found then
      raise exception 'Esta ótica ainda não tem primeiro contato registrado. Registre o primeiro contato (ou recupere como já contatada) antes do retorno.';
    end if;
    if v_pc.precisao = 'exata' and new.ocorreu_em < v_pc.ocorreu_em then
      raise exception 'O retorno (%) não pode ser antes do primeiro contato (%).', to_char(new.ocorreu_em, 'DD/MM/YYYY'), to_char(v_pc.ocorreu_em, 'DD/MM/YYYY');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists interacoes_validar on public.interacoes;
create trigger interacoes_validar before insert or update on public.interacoes
  for each row execute function public.interacoes_validar();

-- ---------- tarefas ----------
-- O que fazer. Sem dia = "sem data". Cliente e responsável são opcionais; responsável é só um
-- rótulo para filtrar (Kaue, Milena), o login é o mesmo. feita_em preenchido = feita.
-- Excluir o cliente exclui as tarefas dele.
create table if not exists public.tarefas (
  id            text primary key default gen_random_uuid()::text,
  dono          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo        text not null check (btrim(titulo) <> ''),
  dia           date,
  hora          time,
  lead_id       text,
  responsavel   text,
  feita_em      timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint tarefas_lead_do_dono foreign key (lead_id, dono) references public.leads (id, dono) on delete cascade
);

create index if not exists tarefas_dono_dia_idx on public.tarefas (dono, dia);
create index if not exists tarefas_lead_idx on public.tarefas (lead_id);

-- ---------- ciclos ----------
-- Um ciclo de prospecção: início, fim, meta de novas óticas e a cadência de retornos
-- (hipótese de trabalho, ajustável). Os números vêm da tela Ritmo; nada fica fixo no código.
create table if not exists public.ciclos (
  id                    text primary key default gen_random_uuid()::text,
  dono                  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome                  text not null default '',
  inicio                date not null,
  fim                   date not null,
  meta_novas            integer not null check (meta_novas > 0),
  dias_primeiro_retorno integer not null default 7 check (dias_primeiro_retorno between 1 and 120),
  dias_segundo_retorno  integer not null default 21 check (dias_segundo_retorno between 1 and 365),
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  constraint ciclos_datas check (fim >= inicio),
  constraint ciclos_cadencia check (dias_segundo_retorno > dias_primeiro_retorno)
);

create index if not exists ciclos_dono_inicio_idx on public.ciclos (dono, inicio);

-- ---------- demos ----------
-- Prazo de cada demo: uma linha por pasta em demos/ (id = pasta, link /demo/<id>). O site só abre a
-- demo se no_ar e vale_ate >= hoje (Brasília); senão mostra "demo fora do ar" (middleware.js na Vercel).
-- Demo nova nasce com 7 dias: a linha é criada sozinha quando um lead recebe o link (gatilho mais abaixo).
create table if not exists public.demos (
  id            text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  dono          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  no_ar         boolean not null default true,          -- desligado = fora do ar, com ou sem prazo
  vale_ate      date default ((now() at time zone 'America/Sao_Paulo')::date + 7), -- último dia no ar; vazio = sem prazo
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists demos_dono_idx on public.demos (dono);

-- ---------- arquivo do painel antigo ----------
create table if not exists public.arquivo_legado (
  colecao      text not null,   -- portfolio, lancamentos, semanas, config
  doc_id       text not null,
  dono         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dados        jsonb not null,
  importado_em timestamptz not null default now(),
  primary key (colecao, doc_id)
);

-- ---------- atualizado_em automático ----------
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists leads_atualizado_em on public.leads;
create trigger leads_atualizado_em before update on public.leads
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists conteudos_atualizado_em on public.conteudos;
create trigger conteudos_atualizado_em before update on public.conteudos
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists interacoes_atualizado_em on public.interacoes;
create trigger interacoes_atualizado_em before update on public.interacoes
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists tarefas_atualizado_em on public.tarefas;
create trigger tarefas_atualizado_em before update on public.tarefas
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists ciclos_atualizado_em on public.ciclos;
create trigger ciclos_atualizado_em before update on public.ciclos
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists demos_atualizado_em on public.demos;
create trigger demos_atualizado_em before update on public.demos
  for each row execute function public.tocar_atualizado_em();

-- ---------- acesso ----------
alter table public.leads          enable row level security;
alter table public.conteudos      enable row level security;
alter table public.interacoes     enable row level security;
alter table public.ciclos         enable row level security;
alter table public.tarefas        enable row level security;
alter table public.demos          enable row level security;
alter table public.arquivo_legado enable row level security;

-- O Supabase dá todos os privilégios por padrão; aqui fica só o necessário.
revoke all on public.leads, public.conteudos, public.interacoes, public.ciclos, public.tarefas, public.demos, public.arquivo_legado from anon, authenticated;
grant select, insert, update, delete on public.leads, public.conteudos, public.interacoes, public.ciclos, public.tarefas, public.demos to authenticated;
grant select on public.arquivo_legado to authenticated;

drop policy if exists "leads do dono" on public.leads;
create policy "leads do dono" on public.leads
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

drop policy if exists "conteudos do dono" on public.conteudos;
create policy "conteudos do dono" on public.conteudos
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

drop policy if exists "interacoes do dono" on public.interacoes;
create policy "interacoes do dono" on public.interacoes
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

drop policy if exists "ciclos do dono" on public.ciclos;
create policy "ciclos do dono" on public.ciclos
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

drop policy if exists "tarefas do dono" on public.tarefas;
create policy "tarefas do dono" on public.tarefas
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

drop policy if exists "demos do dono" on public.demos;
create policy "demos do dono" on public.demos
  for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

drop policy if exists "arquivo do dono" on public.arquivo_legado;
create policy "arquivo do dono" on public.arquivo_legado
  for select to authenticated
  using (dono = (select auth.uid()));

-- ---------- prazo das demos ----------
-- Pasta da demo a partir do link do lead: "/demo/otica-sales" ou "https://…/demo/otica-sales/artes-instagram" -> "otica-sales".
create or replace function public.renderiza_pasta_da_demo(link text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(substring(coalesce(link, '') from '/demo/([A-Za-z0-9-]+)'))
$$;

-- O site (middleware.js) pergunta antes de abrir /demo/<pasta>, com a chave pública. Só responde sim ou
-- não, sem mostrar nada da tabela. Pasta sem linha fica no ar.
create or replace function public.demo_liberada(pasta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select d.no_ar and (d.vale_ate is null or d.vale_ate >= (now() at time zone 'America/Sao_Paulo')::date)
       from public.demos d
      where d.id = lower(pasta)),
    true)
$$;
revoke all on function public.demo_liberada(text) from public;
grant execute on function public.demo_liberada(text) to anon, authenticated;

-- Demo nova nasce com 7 dias: quando um lead recebe um link /demo/<pasta> que ainda não tem linha.
create or replace function public.leads_registrar_demo()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  p text := public.renderiza_pasta_da_demo(new.link_demo);
begin
  if p ~ '^[a-z0-9][a-z0-9-]{0,79}$' then
    insert into public.demos (id, dono) values (p, new.dono) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists leads_registrar_demo on public.leads;
create trigger leads_registrar_demo after insert or update of link_demo on public.leads
  for each row execute function public.leads_registrar_demo();

-- ---------- ciclo de cada conversa (tag "ciclo N") ----------
-- Ciclos de prospecção semanais, de sexta a quinta: ciclo 1 de 02 a 08/10/2026, ciclo 2 de 09 a 15/10, e assim
-- por diante; o que veio antes (a lista de agosto) também é ciclo 1. É o mesmo cálculo do painel (painel/src/tags.js).
create or replace function public.renderiza_ciclo_do_dia(d date)
returns int
language sql
immutable
set search_path = ''
as $$
  select greatest(1, ((d - date '2026-10-02') / 7) + 1)
$$;

-- Lead que sai de Leads a trabalhar ou de Prontas para trabalhar (ou já nasce depois delas) e ainda não tem tag de
-- ciclo ganha a do dia (Brasília). Vale para o painel, para a IA (renderiza_aplicar_relato) e para o SQL Editor.
create or replace function public.leads_marcar_ciclo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.etapa not in ('a_trabalhar', 'demo_pronta')
     and (tg_op = 'INSERT' or old.etapa in ('a_trabalhar', 'demo_pronta'))
     and not exists (select 1 from unnest(new.tags) t where t ~* '^ciclo\s+[1-9][0-9]*$') then
    new.tags := new.tags || ('ciclo ' || public.renderiza_ciclo_do_dia((now() at time zone 'America/Sao_Paulo')::date));
  end if;
  return new;
end;
$$;
drop trigger if exists leads_marcar_ciclo on public.leads;
create trigger leads_marcar_ciclo before insert or update of etapa on public.leads
  for each row execute function public.leads_marcar_ciclo();

-- ---------- checklist do card ----------
-- Itens padrão do contato. Iguais a ITENS_PADRAO em painel/src/checklist.js (um teste confere).
create or replace function public.renderiza_checklist_padrao()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '[{"id": "enviar_demo", "texto": "Enviar a demo e o vídeo", "feito": false, "feito_em": null},
           {"id": "cobranca_1", "texto": "1ª cobrança: mandar o flyer de cortesia", "feito": false, "feito_em": null},
           {"id": "cobranca_2", "texto": "2ª cobrança: perguntar se viu a demo", "feito": false, "feito_em": null},
           {"id": "cobranca_3", "texto": "3ª cobrança, a última", "feito": false, "feito_em": null}]'::jsonb
$$;

-- O mesmo que o painel faz ao mudar a etapa (patchAoMudarEtapa), para valer também pela IA e pelo SQL Editor:
-- chegando em Prontas (ou nascendo lá) sem nenhum item padrão, entram os padrão; saindo de antes do contato para
-- Em andamento, "Enviar a demo e o vídeo" fica feito. A próxima ação vira o primeiro item pendente, a menos que
-- a mesma gravação tenha escrito outra.
create or replace function public.leads_ajustar_checklist()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_antes jsonb := new.checklist;
begin
  if not ((tg_op = 'INSERT' and new.etapa = 'demo_pronta')
          or (tg_op = 'UPDATE' and old.etapa in ('a_trabalhar', 'demo_pronta') and new.etapa <> old.etapa
              and new.etapa in ('demo_pronta', 'primeiro_contato', 'em_negociacao', 'sem_resposta'))) then
    return new;
  end if;
  if not exists (select 1 from jsonb_array_elements(new.checklist) e
                  where e->>'id' in ('enviar_demo', 'cobranca_1', 'cobranca_2', 'cobranca_3')) then
    new.checklist := new.checklist || public.renderiza_checklist_padrao();
  end if;
  if new.etapa <> 'demo_pronta' then
    new.checklist := coalesce((select jsonb_agg(case when e->>'id' = 'enviar_demo' and not coalesce((e->>'feito')::boolean, false)
                                                     then e || jsonb_build_object('feito', true, 'feito_em', now()) else e end order by o)
                                 from jsonb_array_elements(new.checklist) with ordinality t(e, o)), '[]'::jsonb);
  end if;
  if new.checklist is distinct from v_antes and (tg_op = 'INSERT' or new.proxima_acao is not distinct from old.proxima_acao) then
    new.proxima_acao := coalesce((select e->>'texto' from jsonb_array_elements(new.checklist) with ordinality t(e, o)
                                   where not coalesce((e->>'feito')::boolean, false) order by o limit 1), '');
  end if;
  return new;
end;
$$;
drop trigger if exists leads_ajustar_checklist on public.leads;
create trigger leads_ajustar_checklist before insert or update of etapa on public.leads
  for each row execute function public.leads_ajustar_checklist();

-- ---------- funções para a atualização pela IA (docs/atualizacao-por-ia.md) ----------
-- Todas rodam com as permissões de quem chama (security invoker): valem as mesmas políticas
-- de RLS do painel, então só enxergam e alteram as linhas do usuário logado.

-- Nome sem acento, minúsculo e sem pontuação: "Óticas Pérez!" -> "oticas perez".
create or replace function public.renderiza_normalizar(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(regexp_replace(
    translate(lower(coalesce(t, '')), 'áàâãäåéèêëíìîïóòôõöúùûüçñý', 'aaaaaaeeeeiiiiooooouuuucny'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

-- Chave para achar a mesma ótica escrita de outro jeito: tira "ótica/óticas/óptica".
-- "Óticas Perez" e "Ótica Perez" viram "perez".
create or replace function public.renderiza_chave_nome(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(nullif(btrim(regexp_replace(regexp_replace(public.renderiza_normalizar(t), '\m(o|op)ticas?\M', ' ', 'g'), '\s+', ' ', 'g')), ''),
                  public.renderiza_normalizar(t))
$$;

-- Busca óticas pelo nome (sem acento), @ do Instagram ou dígitos do WhatsApp.
create or replace function public.renderiza_buscar_leads(termo text)
returns table (
  id text, empresa text, cidade text, etapa text, resultado text, interesse text, nao_contatar boolean,
  whatsapp text, instagram text, proxima_acao text, followup_em date,
  primeiro_contato date, primeiro_contato_precisao text, ultima_interacao date
)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.id, l.empresa, l.cidade, l.etapa, l.resultado, l.interesse, l.nao_contatar,
         l.whatsapp, l.instagram, l.proxima_acao, l.followup_em,
         pc.ocorreu_em, pc.precisao,
         (select max(i.ocorreu_em) from public.interacoes i where i.lead_id = l.id)
  from public.leads l
  left join public.interacoes pc on pc.lead_id = l.id and pc.tipo = 'primeiro_contato'
  where public.renderiza_chave_nome(l.empresa) like '%' || public.renderiza_chave_nome(termo) || '%'
     or public.renderiza_normalizar(l.instagram) like '%' || public.renderiza_normalizar(termo) || '%'
     or (length(regexp_replace(termo, '\D', '', 'g')) >= 8
         and regexp_replace(l.whatsapp, '\D', '', 'g') like '%' || regexp_replace(termo, '\D', '', 'g') || '%')
  order by l.empresa
$$;

-- Próximo retorno pela cadência (só para quem ainda não respondeu):
--   nenhum retorno feito -> primeiro contato + dias_primeiro_retorno (7 por padrão)
--   um retorno feito     -> primeiro contato + dias_segundo_retorno  (21 por padrão)
--   dois ou mais         -> nenhum (fica em espera até haver motivo para retomar)
-- Não sugere nada se a ótica respondeu (vale a data combinada), pediu para não ser contatada,
-- está finalizada ou não tem primeiro contato com data exata.
create or replace function public.renderiza_retorno_sugerido(p_lead text)
returns date
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_lead public.leads%rowtype;
  v_pc public.interacoes%rowtype;
  v_retornos int;
  v_d1 int := 7;
  v_d2 int := 21;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select * into v_lead from public.leads where id = p_lead;
  if not found or v_lead.nao_contatar or v_lead.etapa = 'finalizado' then return null; end if;
  select * into v_pc from public.interacoes where lead_id = p_lead and tipo = 'primeiro_contato';
  if not found or v_pc.precisao <> 'exata' then return null; end if;
  if exists (select 1 from public.interacoes where lead_id = p_lead and tipo = 'resposta') then return null; end if;
  select count(*) into v_retornos from public.interacoes where lead_id = p_lead and tipo = 'retorno';
  select c.dias_primeiro_retorno, c.dias_segundo_retorno into v_d1, v_d2
    from public.ciclos c where c.inicio <= v_hoje order by c.inicio desc limit 1;
  if not found then v_d1 := 7; v_d2 := 21; end if;
  if v_retornos = 0 then return v_pc.ocorreu_em + v_d1; end if;
  if v_retornos = 1 then return v_pc.ocorreu_em + v_d2; end if;
  return null;
end;
$$;

-- Aplica, numa transação só, o que a IA entendeu do relato do dia.
-- plano = {
--   "data": "2026-09-25",                      -- dia padrão das interações (padrão: hoje em São Paulo)
--   "itens": [{
--     "lead": {"id": "..."}                    -- ótica que já existe (achada com renderiza_buscar_leads)
--          ou {"novo": {"empresa": "...", "cidade": "...", "whatsapp": "...", "instagram": "...", "etapa": "..."}},
--     "interacoes": [{"tipo": "primeiro_contato"|"retorno"|"resposta"|"anotacao", "resumo": "...",
--                     "canal": "whatsapp", "ocorreu_em": "AAAA-MM-DD", "precisao": "exata"|"aproximada"|"desconhecida",
--                     "interesse": "interessado"|"perto_de_fechar"}],
--     "atualizar": {"proxima_acao": "...", "followup_em": "AAAA-MM-DD"|"cadencia"|null,
--                   "interesse": "...", "interesse_motivo": "...", "nao_contatar": true|false,
--                   "etapa": "...", "resultado": "...", "valor_fechado": 0, "motivo_perda": "...", "data_fechamento": "..."}
--   }]
-- }
-- etapa: a_trabalhar, demo_pronta, primeiro_contato, em_negociacao, sem_resposta ou finalizado.
-- resultado (com etapa finalizado): ganho, perda ou encerrado.
-- simular = true: faz tudo, devolve o resumo e desfaz (nada fica gravado).
-- Recusa, sem gravar nada: ótica nova com nome igual a outra já cadastrada, segundo primeiro contato,
-- retorno sem primeiro contato, data de interação no futuro, lead de outro usuário.
create or replace function public.renderiza_aplicar_relato(plano jsonb, simular boolean default false)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_data date;
  v_item jsonb;
  v_int jsonb;
  v_upd jsonb;
  v_novo jsonb;
  v_antes public.leads%rowtype;
  v_lead public.leads%rowtype;
  v_empresa text;
  v_parecidos text;
  v_precisao text;
  v_ocorreu date;
  v_previsto date;
  v_follow date;
  v_hist jsonb;
  v_itens jsonb := '[]'::jsonb;
  v_ints jsonb;
  v_alt jsonb;
  v_novo_lead boolean;
  v_campo text;
  v_etapas text[] := array['a_trabalhar', 'demo_pronta', 'primeiro_contato', 'em_negociacao', 'sem_resposta', 'finalizado'];
begin
  if v_dono is null then
    raise exception 'Sem usuário: a IA precisa entrar com a conta do painel (a mesma do login).';
  end if;
  if plano is null or jsonb_typeof(plano -> 'itens') is distinct from 'array' then
    raise exception 'O plano precisa de uma lista "itens".';
  end if;
  v_data := coalesce(nullif(plano ->> 'data', '')::date, v_hoje);

  begin -- bloco próprio: na simulação, tudo o que foi feito aqui dentro é desfeito no fim
    for v_item in select value from jsonb_array_elements(plano -> 'itens') loop
      v_novo_lead := false;
      v_ints := '[]'::jsonb;
      v_alt := '{}'::jsonb;

      -- 1. Qual ótica
      if v_item -> 'lead' ? 'id' then
        select * into v_lead from public.leads where id = v_item -> 'lead' ->> 'id';
        if not found then
          raise exception 'Lead "%" não encontrado (ou é de outro usuário).', v_item -> 'lead' ->> 'id';
        end if;
      elsif v_item -> 'lead' ? 'novo' then
        v_novo := v_item -> 'lead' -> 'novo';
        v_empresa := btrim(coalesce(v_novo ->> 'empresa', ''));
        if v_empresa = '' then raise exception 'Ótica nova sem nome.'; end if;
        select string_agg(format('%s (id %s%s)', l.empresa, l.id, case when l.cidade <> '' then ', ' || l.cidade else '' end), '; ')
          into v_parecidos
          from public.leads l
          where public.renderiza_chave_nome(l.empresa) = public.renderiza_chave_nome(v_empresa);
        if v_parecidos is not null and not coalesce((v_novo ->> 'permitir_nome_repetido')::boolean, false) then
          raise exception 'Já existe ótica com nome igual ou parecido com "%": %. Use o id dela, ou confirme com o usuário que é outra ótica e mande "permitir_nome_repetido": true.',
            v_empresa, v_parecidos;
        end if;
        if not (coalesce(v_novo ->> 'etapa', 'a_trabalhar') = any (v_etapas)) then
          raise exception 'Etapa "%" não existe. Use %.', v_novo ->> 'etapa', array_to_string(v_etapas, ', ');
        end if;
        insert into public.leads (empresa, cidade, whatsapp, instagram, segmento, etapa, posicao)
        values (
          v_empresa,
          coalesce(v_novo ->> 'cidade', ''),
          coalesce(v_novo ->> 'whatsapp', ''),
          coalesce(v_novo ->> 'instagram', ''),
          coalesce(v_novo ->> 'segmento', ''),
          coalesce(v_novo ->> 'etapa', 'a_trabalhar'),
          (select coalesce(max(coalesce(l.posicao, extract(epoch from l.criado_em))), 0) + 1000 from public.leads l)
        )
        returning * into v_lead;
        v_novo_lead := true;
      else
        raise exception 'Cada item precisa de "lead": {"id": ...} ou {"novo": {...}}.';
      end if;
      v_antes := v_lead;

      -- 2. O que aconteceu
      for v_int in select value from jsonb_array_elements(coalesce(v_item -> 'interacoes', '[]'::jsonb)) loop
        v_precisao := coalesce(v_int ->> 'precisao', 'exata');
        v_ocorreu := case when v_precisao = 'desconhecida' then null else coalesce(nullif(v_int ->> 'ocorreu_em', '')::date, v_data) end;
        v_previsto := null;
        if v_int ->> 'tipo' = 'retorno' then
          -- o retorno cumpre o follow-up que estava marcado (se havia)
          v_previsto := coalesce(nullif(v_int ->> 'previsto_para', '')::date, v_lead.followup_em);
        end if;
        insert into public.interacoes (lead_id, tipo, ocorreu_em, precisao, canal, resumo, interesse, previsto_para, origem)
        values (v_lead.id, v_int ->> 'tipo', v_ocorreu, v_precisao, nullif(v_int ->> 'canal', ''),
                coalesce(v_int ->> 'resumo', ''), nullif(v_int ->> 'interesse', ''), v_previsto, 'ia');
        v_ints := v_ints || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
          'tipo', v_int ->> 'tipo', 'ocorreu_em', v_ocorreu, 'precisao', v_precisao,
          'resumo', v_int ->> 'resumo', 'interesse', nullif(v_int ->> 'interesse', ''), 'previsto_para', v_previsto)));
      end loop;

      -- 3. O plano daqui para frente e o que mudou na ótica
      v_upd := coalesce(v_item -> 'atualizar', '{}'::jsonb);
      -- Interação que justificou um nível de interesse atualiza a ótica (se o plano não disser outro nível).
      if not (v_upd ? 'interesse') then
        select e.value into v_int
          from jsonb_array_elements(coalesce(v_item -> 'interacoes', '[]'::jsonb)) with ordinality as e(value, n)
          where nullif(e.value ->> 'interesse', '') is not null
          order by e.n desc limit 1;
        if found then
          v_upd := v_upd || jsonb_build_object('interesse', v_int ->> 'interesse',
                                               'interesse_motivo', coalesce(v_upd ->> 'interesse_motivo', v_int ->> 'resumo'));
        end if;
      end if;
      for v_campo in select jsonb_object_keys(v_upd) loop
        if v_campo not in ('proxima_acao', 'followup_em', 'interesse', 'interesse_motivo', 'nao_contatar',
                           'etapa', 'resultado', 'valor_fechado', 'motivo_perda', 'data_fechamento') then
          raise exception 'Campo "%" não pode ser alterado pelo relato.', v_campo;
        end if;
      end loop;
      -- Etapas e resultados de antes de 09/10/2026 (demo_criada, follow_up…) não existem mais.
      if v_upd ->> 'etapa' is not null and not (v_upd ->> 'etapa' = any (v_etapas)) then
        raise exception 'Etapa "%" não existe. Use %.', v_upd ->> 'etapa', array_to_string(v_etapas, ', ');
      end if;
      if nullif(v_upd ->> 'resultado', '') is not null and v_upd ->> 'resultado' not in ('ganho', 'perda', 'encerrado') then
        raise exception 'Resultado "%" não existe. Use ganho, perda ou encerrado.', v_upd ->> 'resultado';
      end if;
      if v_upd ? 'followup_em' then
        v_follow := case
          when v_upd ->> 'followup_em' = 'cadencia' then public.renderiza_retorno_sugerido(v_lead.id)
          else nullif(v_upd ->> 'followup_em', '')::date end;
      else
        v_follow := v_lead.followup_em;
      end if;
      if coalesce((v_upd ->> 'nao_contatar')::boolean, v_lead.nao_contatar) then v_follow := null; end if;
      v_hist := coalesce(v_lead.historico, '[]'::jsonb);
      if v_upd ? 'interesse' and v_upd ->> 'interesse' is distinct from v_lead.interesse then
        v_hist := v_hist || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
          'em', now(), 'tipo', 'interesse', 'de', v_lead.interesse, 'para', v_upd ->> 'interesse',
          'motivo', v_upd ->> 'interesse_motivo', 'origem', 'ia')));
      end if;
      if v_upd ? 'nao_contatar' and (v_upd ->> 'nao_contatar')::boolean is distinct from v_lead.nao_contatar then
        v_hist := v_hist || jsonb_build_array(jsonb_build_object('em', now(), 'tipo', 'nao_contatar', 'para', (v_upd ->> 'nao_contatar')::boolean, 'origem', 'ia'));
      end if;
      if v_upd ? 'etapa' and v_upd ->> 'etapa' is distinct from v_lead.etapa then
        v_hist := v_hist || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
          'em', now(), 'de', v_lead.etapa, 'para', v_upd ->> 'etapa', 'resultado', v_upd ->> 'resultado', 'origem', 'ia')));
      end if;
      update public.leads l set
        proxima_acao     = case when v_upd ? 'proxima_acao' then coalesce(v_upd ->> 'proxima_acao', '') else l.proxima_acao end,
        followup_em      = v_follow,
        interesse        = coalesce(v_upd ->> 'interesse', l.interesse),
        interesse_motivo = case when v_upd ? 'interesse_motivo' then v_upd ->> 'interesse_motivo' else l.interesse_motivo end,
        nao_contatar     = coalesce((v_upd ->> 'nao_contatar')::boolean, l.nao_contatar),
        etapa            = coalesce(v_upd ->> 'etapa', l.etapa),
        resultado        = case when v_upd ? 'resultado' then v_upd ->> 'resultado' else l.resultado end,
        valor_fechado    = case when v_upd ? 'valor_fechado' then (v_upd ->> 'valor_fechado')::numeric else l.valor_fechado end,
        motivo_perda     = case when v_upd ? 'motivo_perda' then v_upd ->> 'motivo_perda' else l.motivo_perda end,
        data_fechamento  = case when v_upd ? 'data_fechamento' then (v_upd ->> 'data_fechamento')::date else l.data_fechamento end,
        historico        = v_hist
      where l.id = v_lead.id
      returning * into v_lead;

      if not v_novo_lead then
        foreach v_campo in array array['proxima_acao', 'followup_em', 'interesse', 'interesse_motivo', 'nao_contatar', 'etapa', 'resultado', 'valor_fechado', 'motivo_perda', 'data_fechamento'] loop
          if (to_jsonb(v_antes) -> v_campo) is distinct from (to_jsonb(v_lead) -> v_campo) then
            v_alt := v_alt || jsonb_build_object(v_campo, jsonb_build_object('de', to_jsonb(v_antes) -> v_campo, 'para', to_jsonb(v_lead) -> v_campo));
          end if;
        end loop;
      end if;

      v_itens := v_itens || jsonb_build_array(jsonb_build_object(
        'lead_id', v_lead.id, 'empresa', v_lead.empresa, 'otica_nova_no_painel', v_novo_lead,
        'interacoes', v_ints, 'alteracoes', v_alt,
        'agora', jsonb_build_object('etapa', v_lead.etapa, 'interesse', v_lead.interesse, 'proxima_acao', v_lead.proxima_acao,
                                    'followup_em', v_lead.followup_em, 'nao_contatar', v_lead.nao_contatar)));
    end loop;

    if simular then
      raise exception using errcode = 'RZSIM', message = 'simulação: nada foi gravado';
    end if;
  exception when sqlstate 'RZSIM' then
    null; -- desfaz o bloco; o resumo calculado continua em v_itens
  end;

  return jsonb_build_object('simulado', simular, 'data', v_data, 'itens', v_itens);
end;
$$;

revoke all on function public.renderiza_buscar_leads(text) from public, anon;
revoke all on function public.renderiza_retorno_sugerido(text) from public, anon;
revoke all on function public.renderiza_aplicar_relato(jsonb, boolean) from public, anon;
grant execute on function public.renderiza_buscar_leads(text) to authenticated;
grant execute on function public.renderiza_retorno_sugerido(text) to authenticated;
grant execute on function public.renderiza_aplicar_relato(jsonb, boolean) to authenticated;

-- ---------- link do Painel Renderiza por lead e as visitas (22/10/2026) ----------
-- Cada lead tem um código curto (4 letras e números, sem os que confundem: 0/o, 1/l/i). O link que vai no
-- WhatsApp é /exemplos?c=<codigo>: a página conta quem abriu e o que fez, e o painel mostra no lead.
create or replace function public.renderiza_novo_codigo()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  letras constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  c text;
begin
  loop
    c := '';
    for i in 1..4 loop
      c := c || substr(letras, 1 + floor(random() * length(letras))::int, 1);
    end loop;
    exit when not exists (select 1 from public.leads l where l.codigo = c);
  end loop;
  return c;
end;
$$;

alter table public.leads add column if not exists codigo text;
alter table public.leads alter column codigo set default public.renderiza_novo_codigo();
update public.leads set codigo = public.renderiza_novo_codigo() where codigo is null;
create unique index if not exists leads_codigo_idx on public.leads (codigo);

-- Um registro por passo de quem abriu o link: abriu a página, chegou nos preços, viu os detalhes de um módulo,
-- abriu o exemplo, clicou no WhatsApp, rolou até o fim, quanto tempo ficou. Só entra pela função
-- registrar_visita (a página não grava direto); o dono do lead só lê e apaga.
-- As demos das óticas (/demo/<pasta>) também contam: pagina 'demo', a pasta em demo e o lead achado pelo link_demo.
create table if not exists public.visitas (
  id         bigint generated always as identity primary key,
  dono       uuid not null references auth.users (id) on delete cascade,
  lead_id    text not null references public.leads (id) on delete cascade,
  pagina     text not null check (pagina in ('exemplos', 'painel-eventos', 'agenda-online', 'demo')),
  demo       text not null default '',          -- pasta da demo (só quando pagina = 'demo')
  evento     text not null check (evento in ('abriu', 'viu_precos', 'viu_detalhes', 'abriu_exemplo', 'clicou_whatsapp', 'mudou_tela', 'pediu_reserva', 'rolou_fim', 'tempo')),
  detalhe    jsonb not null default '{}'::jsonb check (jsonb_typeof(detalhe) = 'object'),
  visitante  text not null default '',          -- número aleatório guardado no navegador (o mesmo aparelho)
  sessao     text not null default '',          -- uma abertura da página
  equipe     boolean not null default false,    -- navegador que já abriu o painel da Renderiza: fomos nós
  ip         text not null default '',
  local      text not null default '',          -- cidade e estado pelo IP (cabeçalhos da Vercel)
  aparelho   text not null default '',          -- "celular · Android · Chrome"
  criado_em  timestamptz not null default now()
);
-- Banco criado antes das demos contarem (22/10/2026): a coluna da pasta e a página nova.
alter table public.visitas add column if not exists demo text not null default '';
alter table public.visitas drop constraint if exists visitas_pagina_check;
alter table public.visitas add constraint visitas_pagina_check
  check (pagina = any (array['exemplos', 'painel-eventos', 'agenda-online', 'demo']));
create index if not exists visitas_lead_idx on public.visitas (lead_id, criado_em desc);
create index if not exists visitas_dono_idx on public.visitas (dono, criado_em desc);
alter table public.visitas enable row level security;
revoke all on public.visitas from anon, authenticated;
grant select, delete on public.visitas to authenticated;
drop policy if exists "visitas do dono" on public.visitas;
create policy "visitas do dono" on public.visitas
  for select to authenticated
  using (dono = (select auth.uid()));
drop policy if exists "visitas do dono: apagar" on public.visitas;
create policy "visitas do dono: apagar" on public.visitas
  for delete to authenticated
  using (dono = (select auth.uid()));

-- Chamada pelo site (api/visita.js) com a chave pública. Código que não existe, evento estranho ou mais de
-- 60 passos por hora do mesmo navegador: não grava. Abriu, chegou nos preços e rolou até o fim contam uma
-- vez por abertura da página; o tempo na página fica com o maior valor. Na demo, o lead vem da pasta
-- (link_demo do lead), não do código.
-- A versão sem p_demo deixaria a chamada ambígua: sai. (No banco de produção ela ficou renomeada para
-- registrar_visita_antiga, sem acesso público, porque o DROP pelo conector não terminava.)
drop function if exists public.registrar_visita(text, text, text, jsonb, text, text, boolean, text, text, text);
drop function if exists public.registrar_visita_antiga(text, text, text, jsonb, text, text, boolean, text, text, text);
create or replace function public.registrar_visita(
  p_codigo text, p_pagina text, p_evento text, p_detalhe jsonb default '{}'::jsonb,
  p_visitante text default '', p_sessao text default '', p_equipe boolean default false,
  p_ip text default '', p_local text default '', p_aparelho text default '', p_demo text default '')
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_lead_id text;
  v_dono uuid;
  v_demo text := lower(coalesce(p_demo, ''));
  v_detalhe jsonb := case when jsonb_typeof(p_detalhe) = 'object' and length(p_detalhe::text) <= 1000 then p_detalhe else '{}'::jsonb end;
  v_visitante text := left(coalesce(p_visitante, ''), 24);
  v_sessao text := left(coalesce(p_sessao, ''), 24);
begin
  if p_pagina not in ('exemplos', 'painel-eventos', 'agenda-online', 'demo')
     or p_evento not in ('abriu', 'viu_precos', 'viu_detalhes', 'abriu_exemplo', 'clicou_whatsapp', 'mudou_tela', 'pediu_reserva', 'rolou_fim', 'tempo') then
    return false;
  end if;
  if p_pagina = 'demo' then
    if v_demo !~ '^[a-z0-9][a-z0-9-]{0,79}$' then return false; end if;
    select l.id, l.dono into v_lead_id, v_dono from public.leads l
     where public.renderiza_pasta_da_demo(l.link_demo) = v_demo
     order by l.atualizado_em desc limit 1;
  else
    if coalesce(p_codigo, '') !~ '^[a-z0-9]{3,8}$' then return false; end if;
    select l.id, l.dono into v_lead_id, v_dono from public.leads l where l.codigo = p_codigo;
    v_demo := '';
  end if;
  if v_lead_id is null then return false; end if;
  if (select count(*) from public.visitas v
       where v.lead_id = v_lead_id and v.visitante = v_visitante and v.criado_em > now() - interval '1 hour') >= 60 then
    return false;
  end if;
  if v_sessao <> '' and p_evento in ('abriu', 'viu_precos', 'rolou_fim', 'tempo') and exists (
       select 1 from public.visitas v where v.lead_id = v_lead_id and v.sessao = v_sessao and v.pagina = p_pagina and v.evento = p_evento) then
    if p_evento = 'tempo' then
      update public.visitas v set detalhe = v_detalhe
       where v.lead_id = v_lead_id and v.sessao = v_sessao and v.pagina = p_pagina and v.evento = 'tempo'
         and coalesce((v.detalhe->>'s')::numeric, 0) < coalesce((v_detalhe->>'s')::numeric, 0);
      return true;
    end if;
    return false;
  end if;
  insert into public.visitas (dono, lead_id, pagina, demo, evento, detalhe, visitante, sessao, equipe, ip, local, aparelho)
  values (v_dono, v_lead_id, p_pagina, v_demo, p_evento, v_detalhe, v_visitante, v_sessao, coalesce(p_equipe, false),
          left(coalesce(p_ip, ''), 64), left(coalesce(p_local, ''), 80), left(coalesce(p_aparelho, ''), 80));
  return true;
end;
$$;
revoke all on function public.registrar_visita(text, text, text, jsonb, text, text, boolean, text, text, text, text) from public;
grant execute on function public.registrar_visita(text, text, text, jsonb, text, text, boolean, text, text, text, text) to anon, authenticated;

-- ---------- tempo real (opcional) ----------
-- Faz o painel aberto em outro aparelho receber as mudanças sem recarregar.
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['leads', 'conteudos', 'interacoes', 'ciclos', 'tarefas', 'demos', 'visitas'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end;
$$;
