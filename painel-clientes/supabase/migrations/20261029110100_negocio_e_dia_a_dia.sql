-- Missão 2 · bloco A · 2 de 4: o negócio (serviços, horários, campanhas) e o dia a dia, com o cliente no centro.
-- Modelo e regras em docs/painel-clientes/05-dados-e-permissoes.md. Tudo tem conta_id; as ligações entre tabelas
-- usam a conta junto (chave estrangeira composta), então nada de uma conta aponta para outra, nem por engano.
-- Valores ficam fora das tabelas que todos veem: reservas_valores (Financeiro e Contratos) e parcelas (Financeiro).

-- ---------- o negócio ----------

-- Tipos de festa (eventos): casamento, 15 anos... Dão a cor na agenda e o checklist padrão de cada festa.
-- Na fotografia, o tipo de ensaio é o próprio serviço.
create table public.tipos_reserva (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 60),
  cor text check (cor ~ '^#[0-9a-fA-F]{6}$'),
  checklist text[] not null default '{}' check (cardinality(checklist) <= 30),
  ordem smallint not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id)
);
comment on table public.tipos_reserva is 'Tipos de festa (eventos): nome, cor na agenda e o checklist que cada festa nova ganha. No onboarding de eventos, "Que festas vocês fazem?" (09) cria estes tipos.';

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 80),
  descricao text check (length(descricao) <= 500),
  duracao_min integer check (duracao_min between 5 and 1440),
  valor numeric(12, 2) check (valor >= 0),
  sinal numeric(12, 2) check (sinal >= 0 and (valor is null or sinal <= valor)),
  convidados_inclusos integer check (convidados_inclusos >= 0),
  valor_convidado_extra numeric(12, 2) check (valor_convidado_extra >= 0),
  cor text check (cor ~ '^#[0-9a-fA-F]{6}$'),
  inclui text[] not null default '{}' check (cardinality(inclui) <= 30),
  entrega text check (length(entrega) <= 200),
  na_agenda_online boolean not null default true,
  ativo boolean not null default true,
  ordem smallint not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id)
);
comment on table public.servicos is 'Pacotes (eventos) ou tipos de ensaio (fotografia). valor em branco = a preencher (onboarding). entrega: o que a fotografia entrega ("10 fotos editadas").';

create table public.adicionais (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 80),
  preco numeric(12, 2) check (preco >= 0),
  ativo boolean not null default true,
  ordem smallint not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id)
);
comment on table public.adicionais is 'Adicionais vendidos com a reserva (open bar, DJ, hora extra...).';

create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  servico_id uuid,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  inicio time not null,
  fim time,
  nome text check (length(btrim(nome)) between 1 and 40),
  criado_em timestamptz not null default now(),
  foreign key (conta_id, servico_id) references public.servicos (conta_id, id) on delete cascade
);
comment on table public.horarios is 'Quando a conta atende. Eventos: turnos que aluga (nome "De dia", 11:00 a 17:00; "À noite", 19:00 a 02:00, fim antes do início = passa da meia-noite). Fotografia: horários de início de cada ensaio (a duração vem do serviço). servico_id null = vale para todos os serviços sem horário próprio. dia_semana: 0 = domingo.';

create table public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  de date not null,
  ate date not null,
  motivo text check (length(motivo) <= 200),
  criado_em timestamptz not null default now(),
  check (ate >= de)
);
comment on table public.bloqueios is 'Datas fechadas (eventos) ou folgas e férias (fotografia), de/até inclusive.';

create table public.campanhas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 80),
  servico_id uuid,
  dias date[] not null default '{}' check (cardinality(dias) <= 60),
  horarios time[] not null default '{}' check (cardinality(horarios) <= 48),
  vagas integer check (vagas > 0),
  prazo_sinal_horas integer check (prazo_sinal_horas between 1 and 720),
  texto_stories text check (length(texto_stories) <= 1000),
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id),
  foreign key (conta_id, servico_id) references public.servicos (conta_id, id) on delete set null (servico_id)
);
comment on table public.campanhas is 'Mini sessões com vagas (fotografia: Natal). vagas null = dias × horários. prazo_sinal_horas: quanto tempo o horário fica separado esperando o sinal.';

-- ---------- clientes: a base de tudo ----------

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 120),
  whatsapp text check (whatsapp ~ '^\d{10,15}$'),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  instagram text check (instagram ~ '^[a-z0-9._]{1,30}$'),
  origem text check (origem in ('agenda_online', 'whatsapp', 'instagram', 'google', 'indicacao', 'outro')),
  arquivado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id),
  unique (conta_id, whatsapp)
);
comment on table public.clientes is 'Quem compra do negócio (05, "O cliente no centro"). Todo mundo que chega vira cliente; o WhatsApp (só números, com DDD) é único na conta. O básico (nome e contato) todos da conta veem; a ficha completa fica em clientes_fichas. A situação é calculada: public.situacao(cliente).';
create index on public.clientes (conta_id, email);
create index on public.clientes (conta_id, nome);

create table public.clientes_fichas (
  cliente_id uuid primary key,
  conta_id uuid not null,
  observacoes text check (length(observacoes) <= 5000),
  endereco text check (length(endereco) <= 300),
  cpf text check (cpf ~ '^\d{11}$'),
  atualizado_em timestamptz not null default now(),
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id) on delete cascade
);
comment on table public.clientes_fichas is 'A ficha completa do cliente (módulo Clientes). CPF só se o contrato do cliente pedir (06).';

-- ---------- pedidos, reservas e o que pende delas ----------

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  cliente_id uuid not null,
  data_desejada date,
  hora_desejada time,
  servico_id uuid,
  tipo_id uuid,
  convidados integer check (convidados between 1 and 10000),
  mensagem text check (length(mensagem) <= 2000),
  origem text not null default 'whatsapp' check (origem in ('agenda_online', 'whatsapp', 'instagram', 'google', 'indicacao', 'outro')),
  etapa text not null default 'novo' check (etapa in ('novo', 'em_conversa', 'visita_marcada', 'orcamento_enviado', 'aguardando_sinal', 'fechado', 'perdido')),
  responsavel_id uuid,
  reserva_id uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id),
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id),
  foreign key (conta_id, servico_id) references public.servicos (conta_id, id) on delete set null (servico_id),
  foreign key (conta_id, tipo_id) references public.tipos_reserva (conta_id, id) on delete set null (tipo_id),
  foreign key (conta_id, responsavel_id) references public.pessoas (conta_id, id) on delete set null (responsavel_id)
);
comment on table public.pedidos is 'Atendimento: todo pedido de orçamento. "Fechar" vira reserva (public.fechar_pedido) e o pedido guarda o link (reserva_id).';
create index on public.pedidos (conta_id, etapa, criado_em desc);
create index on public.pedidos (cliente_id);

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  cliente_id uuid not null,
  pedido_id uuid,
  servico_id uuid,
  tipo_id uuid,
  campanha_id uuid,
  titulo text check (length(btrim(titulo)) between 1 and 120),
  inicio timestamptz not null,
  fim timestamptz not null,
  convidados integer check (convidados between 1 and 10000),
  situacao text not null default 'pre_reserva' check (situacao in ('pre_reserva', 'confirmada', 'realizada', 'cancelada')),
  responsavel_id uuid,
  producao_id uuid,
  observacoes text check (length(observacoes) <= 2000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (fim > inicio and fim <= inicio + interval '3 days'),
  unique (conta_id, id),
  unique (conta_id, id, cliente_id),
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id),
  foreign key (conta_id, pedido_id) references public.pedidos (conta_id, id) on delete set null (pedido_id),
  foreign key (conta_id, servico_id) references public.servicos (conta_id, id) on delete set null (servico_id),
  foreign key (conta_id, tipo_id) references public.tipos_reserva (conta_id, id) on delete set null (tipo_id),
  foreign key (conta_id, campanha_id) references public.campanhas (conta_id, id) on delete set null (campanha_id),
  foreign key (conta_id, responsavel_id) references public.pessoas (conta_id, id) on delete set null (responsavel_id),
  foreign key (conta_id, producao_id) references public.pessoas (conta_id, id) on delete set null (producao_id)
);
comment on table public.reservas is 'A festa ou o ensaio: o centro do que foi vendido (05, regra 4). Todos da conta veem (sem valores). titulo: o nome da festa quando não é o do cliente ("50 anos da Sônia"). producao_id: quem cuida no dia (eventos).';
create index on public.reservas (conta_id, inicio);
create index on public.reservas (cliente_id);

alter table public.pedidos
  add foreign key (conta_id, reserva_id) references public.reservas (conta_id, id) on delete set null (reserva_id);

create table public.reservas_adicionais (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null,
  reserva_id uuid not null,
  adicional_id uuid not null,
  quantidade integer not null default 1 check (quantidade between 1 and 1000),
  unique (reserva_id, adicional_id),
  foreign key (conta_id, reserva_id) references public.reservas (conta_id, id) on delete cascade,
  foreign key (conta_id, adicional_id) references public.adicionais (conta_id, id)
);
comment on table public.reservas_adicionais is 'Os adicionais de cada reserva (sem preço: o valor fica em reservas_valores).';

create table public.reservas_valores (
  reserva_id uuid primary key,
  conta_id uuid not null,
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  sinal numeric(12, 2) check (sinal >= 0),
  desconto numeric(12, 2) check (desconto >= 0),
  atualizado_em timestamptz not null default now(),
  foreign key (conta_id, reserva_id) references public.reservas (conta_id, id) on delete cascade
);
comment on table public.reservas_valores is 'Os valores da reserva. Só quem tem Financeiro ou Contratos lê (D8: esconder o financeiro de quem cuida da agenda é garantido pelo banco).';

create table public.reservas_checklist (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null,
  reserva_id uuid not null,
  texto text not null check (length(btrim(texto)) between 1 and 200),
  feito boolean not null default false,
  feito_em timestamptz,
  feito_por uuid,
  ordem smallint not null default 0,
  foreign key (conta_id, reserva_id) references public.reservas (conta_id, id) on delete cascade,
  foreign key (conta_id, feito_por) references public.pessoas (conta_id, id) on delete set null (feito_por)
);
comment on table public.reservas_checklist is 'O checklist da festa (exemplo: aba Checklist da festa; 02: "checklist da festa" na ficha). Nasce do tipo da reserva. Agenda e Clientes veem.';
create index on public.reservas_checklist (reserva_id, ordem);

create table public.compromissos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  tipo text not null check (tipo in ('visita', 'degustacao', 'reuniao', 'outro')),
  titulo text check (length(btrim(titulo)) between 1 and 120),
  inicio timestamptz not null,
  fim timestamptz check (fim > inicio),
  cliente_id uuid,
  reserva_id uuid,
  pedido_id uuid,
  responsavel_id uuid,
  observacoes text check (length(observacoes) <= 2000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id) on delete set null (cliente_id),
  foreign key (conta_id, reserva_id) references public.reservas (conta_id, id) on delete set null (reserva_id),
  foreign key (conta_id, pedido_id) references public.pedidos (conta_id, id) on delete set null (pedido_id),
  foreign key (conta_id, responsavel_id) references public.pessoas (conta_id, id) on delete set null (responsavel_id)
);
comment on table public.compromissos is 'Visita, degustação, reunião: na agenda, apontando (ou não) para um cliente, uma reserva ou o pedido que a marcou.';
create index on public.compromissos (conta_id, inicio);
create index on public.compromissos (cliente_id);

create table public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  campanha_id uuid,
  cliente_id uuid not null,
  posicao integer not null default 0,
  preferencia text check (length(preferencia) <= 200),
  origem text check (origem in ('agenda_online', 'whatsapp', 'instagram', 'google', 'indicacao', 'outro')),
  criado_em timestamptz not null default now(),
  foreign key (conta_id, campanha_id) references public.campanhas (conta_id, id) on delete cascade,
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id)
);
comment on table public.lista_espera is 'Quem não conseguiu horário (fotografia), por campanha ou geral. preferencia: o que a pessoa quer ("sábado à tarde").';

create table public.parcelas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  cliente_id uuid not null,
  reserva_id uuid,
  descricao text not null check (length(btrim(descricao)) between 1 and 80),
  valor numeric(12, 2) not null check (valor > 0),
  vence_em date not null,
  pago_em date,
  forma text check (forma in ('pix', 'boleto', 'cartao', 'dinheiro', 'transferencia', 'outro')),
  observacao text check (length(observacao) <= 300),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id),
  foreign key (conta_id, reserva_id, cliente_id) references public.reservas (conta_id, id, cliente_id) on update cascade
);
comment on table public.parcelas is 'Financeiro: parcelas e sinal. Sempre de um cliente; da reserva quando houver (e do mesmo cliente dela). Pago = pago_em preenchido.';
create index on public.parcelas (conta_id, vence_em);
create index on public.parcelas (cliente_id);
create index on public.parcelas (reserva_id);

create table public.modelos_contrato (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 80),
  texto text not null check (length(texto) between 1 and 50000),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (conta_id, id)
);
comment on table public.modelos_contrato is 'Modelos de contrato com campos ({cliente}, {data}, {pacote}, {valor}). O texto é do cliente da Renderiza (02).';

create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  cliente_id uuid not null,
  reserva_id uuid,
  modelo_id uuid,
  texto text not null check (length(texto) between 1 and 100000),
  hash text not null,
  situacao text not null default 'orcamento' check (situacao in ('orcamento', 'enviado', 'aceito', 'cancelado')),
  codigo text not null unique default replace(gen_random_uuid()::text, '-', '') check (codigo ~ '^[a-z0-9]{16,64}$'),
  enviado_em timestamptz,
  aceito_em timestamptz,
  aceito_nome text check (length(btrim(aceito_nome)) between 1 and 120),
  aceito_contato text check (length(aceito_contato) <= 120),
  aceito_ip inet,
  aceito_aparelho text check (length(aceito_aparelho) <= 300),
  cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (situacao <> 'aceito' or (aceito_em is not null and aceito_nome is not null)),
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id),
  foreign key (conta_id, reserva_id, cliente_id) references public.reservas (conta_id, id, cliente_id) on update cascade,
  foreign key (conta_id, modelo_id) references public.modelos_contrato (conta_id, id) on delete set null (modelo_id)
);
comment on table public.contratos is 'O contrato de uma reserva: texto final congelado, a impressão digital dele (hash sha256) e o registro do aceite (nome, contato, data, hora, IP, aparelho; D14). codigo: o do link de aceite (/c/<código>). Aceito não muda; o aceite só é gravado pela função pública (Missão 3, bloco E).';
create index on public.contratos (conta_id, situacao);
create index on public.contratos (cliente_id);

create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas (id) on delete cascade,
  reserva_id uuid not null unique,
  cliente_id uuid not null,
  situacao text not null default 'escolhendo' check (situacao in ('escolhendo', 'edicao', 'entregue')),
  prazo date,
  link_galeria text check (link_galeria ~ '^https://[^\s]+$' and length(link_galeria) <= 500),
  entregue_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (conta_id, cliente_id) references public.clientes (conta_id, id),
  foreign key (conta_id, reserva_id, cliente_id) references public.reservas (conta_id, id, cliente_id) on update cascade on delete cascade
);
comment on table public.entregas is 'Fotografia: a entrega das fotos de um ensaio. O painel guarda só o link da galeria, nunca as fotos (07).';

-- ---------- gatilhos ----------

create function public.clientes_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  new.nome := btrim(new.nome);
  new.whatsapp := public.normalizar_whatsapp(new.whatsapp);
  new.email := public.normalizar_email(new.email);
  new.instagram := nullif(lower(regexp_replace(btrim(coalesce(new.instagram, '')), '^(https?://(www\.)?instagram\.com/|@)', '')), '');
  new.instagram := nullif(btrim(new.instagram, '/'), '');
  return new;
end $$;
create trigger clientes_antes before insert or update on public.clientes for each row execute function public.clientes_antes();

-- Cada reserva nova ganha o checklist do tipo dela.
create function public.reservas_checklist_do_tipo() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.tipo_id is not null then
    insert into public.reservas_checklist (conta_id, reserva_id, texto, ordem)
    select new.conta_id, new.id, x.item, x.n::smallint
    from public.tipos_reserva t, unnest(t.checklist) with ordinality as x (item, n)
    where t.id = new.tipo_id and t.conta_id = new.conta_id;
  end if;
  return null;
end $$;
create trigger reservas_checklist_do_tipo after insert on public.reservas for each row execute function public.reservas_checklist_do_tipo();

create function public.reservas_checklist_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if (tg_op = 'INSERT' and new.feito) or (tg_op = 'UPDATE' and new.feito is distinct from old.feito) then
    if new.feito then
      new.feito_em := now();
      new.feito_por := public.minha_pessoa(new.conta_id);
    else
      new.feito_em := null;
      new.feito_por := null;
    end if;
  end if;
  return new;
end $$;
create trigger reservas_checklist_antes before insert or update on public.reservas_checklist for each row execute function public.reservas_checklist_antes();

-- O contrato: hash do texto sempre recalculado; aceito não muda (só cancela); o aceite vem do link do cliente.
create function public.contratos_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.situacao = 'aceito' then
    if new.situacao not in ('aceito', 'cancelado')
       -- (o cliente pode mudar: juntar clientes leva o contrato para a ficha que fica)
       or (new.texto, new.reserva_id, new.codigo, new.aceito_em, new.aceito_nome, new.aceito_contato, new.aceito_ip, new.aceito_aparelho)
          is distinct from
          (old.texto, old.reserva_id, old.codigo, old.aceito_em, old.aceito_nome, old.aceito_contato, old.aceito_ip, old.aceito_aparelho) then
      raise exception 'Contrato aceito não muda: só pode ser cancelado.' using errcode = '42501';
    end if;
  end if;
  if public.pelo_app() and (
       (tg_op = 'INSERT' and (new.aceito_em is not null or new.aceito_nome is not null or new.aceito_contato is not null or new.aceito_ip is not null or new.aceito_aparelho is not null))
       or (tg_op = 'UPDATE' and (new.aceito_em, new.aceito_nome, new.aceito_contato, new.aceito_ip, new.aceito_aparelho)
                                is distinct from (old.aceito_em, old.aceito_nome, old.aceito_contato, old.aceito_ip, old.aceito_aparelho))
     ) then
    raise exception 'O aceite é registrado pelo link do contrato, por quem aceita.' using errcode = '42501';
  end if;
  new.hash := encode(sha256(convert_to(new.texto, 'UTF8')), 'hex');
  if new.situacao = 'enviado' and new.enviado_em is null then new.enviado_em := now(); end if;
  if new.situacao = 'cancelado' and new.cancelado_em is null then new.cancelado_em := now(); end if;
  return new;
end $$;
create trigger contratos_antes before insert or update on public.contratos for each row execute function public.contratos_antes();

create function public.entregas_antes() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.situacao = 'entregue' and new.entregue_em is null then
    new.entregue_em := (now() at time zone coalesce((select fuso from public.contas where id = new.conta_id), 'America/Sao_Paulo'))::date;
  end if;
  return new;
end $$;
create trigger entregas_antes before insert or update on public.entregas for each row execute function public.entregas_antes();

create trigger tipos_reserva_atualizado before update on public.tipos_reserva for each row execute function public.marcar_atualizado();
create trigger servicos_atualizado before update on public.servicos for each row execute function public.marcar_atualizado();
create trigger adicionais_atualizado before update on public.adicionais for each row execute function public.marcar_atualizado();
create trigger campanhas_atualizado before update on public.campanhas for each row execute function public.marcar_atualizado();
create trigger clientes_atualizado before update on public.clientes for each row execute function public.marcar_atualizado();
create trigger clientes_fichas_atualizado before update on public.clientes_fichas for each row execute function public.marcar_atualizado();
create trigger pedidos_atualizado before update on public.pedidos for each row execute function public.marcar_atualizado();
create trigger reservas_atualizado before update on public.reservas for each row execute function public.marcar_atualizado();
create trigger reservas_valores_atualizado before update on public.reservas_valores for each row execute function public.marcar_atualizado();
create trigger compromissos_atualizado before update on public.compromissos for each row execute function public.marcar_atualizado();
create trigger parcelas_atualizado before update on public.parcelas for each row execute function public.marcar_atualizado();
create trigger modelos_contrato_atualizado before update on public.modelos_contrato for each row execute function public.marcar_atualizado();
create trigger contratos_atualizado before update on public.contratos for each row execute function public.marcar_atualizado();
create trigger entregas_atualizado before update on public.entregas for each row execute function public.marcar_atualizado();

-- ---------- funções ----------

-- A situação do cliente, calculada (05, regra 5). Campo calculado: select=*,situacao na API.
create function public.situacao(cliente public.clientes) returns text language sql stable security definer set search_path = '' as $$
  select case
    when not public.pode(cliente.conta_id, 'inicio', 'ver') then null
    when exists (
      select 1 from public.reservas r
      where r.conta_id = cliente.conta_id and r.cliente_id = cliente.id
        and r.situacao in ('pre_reserva', 'confirmada') and r.fim >= now()
    ) then 'reservado'
    when exists (
      select 1 from public.reservas r
      where r.conta_id = cliente.conta_id and r.cliente_id = cliente.id
        and (r.situacao = 'realizada' or (r.situacao = 'confirmada' and r.fim < now()))
    ) then 'realizado'
    when exists (
      select 1 from public.pedidos p
      where p.conta_id = cliente.conta_id and p.cliente_id = cliente.id and p.etapa not in ('fechado', 'perdido')
    ) then 'interessado'
    when exists (
      select 1 from public.pedidos p where p.conta_id = cliente.conta_id and p.cliente_id = cliente.id and p.etapa = 'perdido'
    ) and not exists (
      select 1 from public.pedidos p where p.conta_id = cliente.conta_id and p.cliente_id = cliente.id and p.etapa <> 'perdido'
    ) then 'nao_fechou'
  end
$$;
comment on function public.situacao(public.clientes) is 'interessado (pedido em aberto, sem reserva), reservado (reserva futura), realizado (a última já aconteceu), nao_fechou (só pedidos perdidos) ou null (sem nada ainda).';

-- "Fechar" no Atendimento (05, regra 3): cria a reserva com o cliente, o serviço, o tipo e os convidados do pedido,
-- e o pedido guarda o link. Se o pedido já tinha a data separada (reserva), só fecha. Volta o id da reserva.
create function public.fechar_pedido(pedido uuid, inicio timestamptz default null, fim timestamptz default null, situacao text default 'pre_reserva')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  p public.pedidos;
  nova uuid;
begin
  select * into p from public.pedidos where id = fechar_pedido.pedido for update;
  if p.id is null or not public.pode(p.conta_id, 'atendimento', 'editar') then
    raise exception 'Pedido não encontrado.' using errcode = '42501';
  end if;
  if p.reserva_id is null then
    if fechar_pedido.inicio is null or fechar_pedido.fim is null then
      raise exception 'Diga a data e o horário da reserva.' using errcode = '22023';
    end if;
    if fechar_pedido.situacao not in ('pre_reserva', 'confirmada') then
      raise exception 'A reserva nasce como pré-reserva ou confirmada.' using errcode = '22023';
    end if;
    insert into public.reservas (conta_id, cliente_id, pedido_id, servico_id, tipo_id, inicio, fim, convidados, situacao, responsavel_id)
    values (p.conta_id, p.cliente_id, p.id, p.servico_id, p.tipo_id, fechar_pedido.inicio, fechar_pedido.fim, p.convidados, fechar_pedido.situacao, p.responsavel_id)
    returning id into nova;
  else
    nova := p.reserva_id;
  end if;
  update public.pedidos set etapa = 'fechado', reserva_id = nova where id = p.id;
  return nova;
end $$;

-- Juntar clientes (05, regra 2): leva tudo de "sai" para "fica" e apaga "sai". Precisa de Clientes (editar).
create function public.juntar_clientes(fica uuid, sai uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  a public.clientes;
  b public.clientes;
  fa public.clientes_fichas;
  fb public.clientes_fichas;
begin
  select * into a from public.clientes where id = juntar_clientes.fica for update;
  select * into b from public.clientes where id = juntar_clientes.sai for update;
  if a.id is null or b.id is null or a.conta_id <> b.conta_id or a.id = b.id or not public.pode(a.conta_id, 'clientes', 'editar') then
    raise exception 'Escolha dois clientes diferentes da mesma conta.' using errcode = '42501';
  end if;

  -- as reservas levam junto (on update cascade) as parcelas, os contratos e as entregas delas
  update public.reservas set cliente_id = a.id where cliente_id = b.id;
  update public.pedidos set cliente_id = a.id where cliente_id = b.id;
  update public.compromissos set cliente_id = a.id where cliente_id = b.id;
  update public.lista_espera set cliente_id = a.id where cliente_id = b.id;
  update public.parcelas set cliente_id = a.id where cliente_id = b.id;
  update public.contratos set cliente_id = a.id where cliente_id = b.id;
  update public.entregas set cliente_id = a.id where cliente_id = b.id;

  select * into fa from public.clientes_fichas where cliente_id = a.id;
  select * into fb from public.clientes_fichas where cliente_id = b.id;
  if fb.cliente_id is not null then
    if fa.cliente_id is null then
      insert into public.clientes_fichas (cliente_id, conta_id, observacoes, endereco, cpf) values (a.id, a.conta_id, fb.observacoes, fb.endereco, fb.cpf);
    else
      update public.clientes_fichas
      set observacoes = nullif(concat_ws(e'\n\n', fa.observacoes, fb.observacoes), ''),
          endereco = coalesce(fa.endereco, fb.endereco),
          cpf = coalesce(fa.cpf, fb.cpf)
      where cliente_id = a.id;
    end if;
  end if;

  -- o que faltava em "fica" vem de "sai" (o WhatsApp é único: sai antes de entrar)
  update public.clientes set whatsapp = null where id = b.id;
  update public.clientes
  set whatsapp = coalesce(a.whatsapp, b.whatsapp), email = coalesce(a.email, b.email),
      instagram = coalesce(a.instagram, b.instagram), origem = coalesce(a.origem, b.origem),
      criado_em = least(a.criado_em, b.criado_em)
  where id = a.id;
  delete from public.clientes where id = b.id;
  -- o histórico (public.atividades, migração 3) passa a contar a história na ficha que fica
  update public.atividades set cliente_id = a.id where conta_id = a.conta_id and cliente_id = b.id;
  return a.id;
end $$;

-- ---------- RLS ----------

alter table public.tipos_reserva enable row level security;
alter table public.servicos enable row level security;
alter table public.adicionais enable row level security;
alter table public.horarios enable row level security;
alter table public.bloqueios enable row level security;
alter table public.campanhas enable row level security;
alter table public.clientes enable row level security;
alter table public.clientes_fichas enable row level security;
alter table public.pedidos enable row level security;
alter table public.reservas enable row level security;
alter table public.reservas_adicionais enable row level security;
alter table public.reservas_valores enable row level security;
alter table public.reservas_checklist enable row level security;
alter table public.compromissos enable row level security;
alter table public.lista_espera enable row level security;
alter table public.parcelas enable row level security;
alter table public.modelos_contrato enable row level security;
alter table public.contratos enable row level security;
alter table public.entregas enable row level security;

-- O negócio: todos da conta veem (o "Para quem?", a agenda e os formulários precisam); quem edita Serviços muda.
create policy "tipos_reserva: a conta vê" on public.tipos_reserva for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "tipos_reserva: Serviços edita" on public.tipos_reserva for all to authenticated
  using (public.pode(conta_id, 'servicos', 'editar')) with check (public.pode(conta_id, 'servicos', 'editar'));
create policy "servicos: a conta vê" on public.servicos for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "servicos: Serviços edita" on public.servicos for all to authenticated
  using (public.pode(conta_id, 'servicos', 'editar')) with check (public.pode(conta_id, 'servicos', 'editar'));
create policy "adicionais: a conta vê" on public.adicionais for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "adicionais: Serviços edita" on public.adicionais for all to authenticated
  using (public.pode(conta_id, 'servicos', 'editar')) with check (public.pode(conta_id, 'servicos', 'editar'));
create policy "horarios: a conta vê" on public.horarios for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "horarios: Serviços edita" on public.horarios for all to authenticated
  using (public.pode(conta_id, 'servicos', 'editar')) with check (public.pode(conta_id, 'servicos', 'editar'));
create policy "bloqueios: a conta vê" on public.bloqueios for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "bloqueios: Serviços ou Agenda edita" on public.bloqueios for all to authenticated
  using (public.pode_algum(conta_id, array['servicos', 'agenda'], 'editar')) with check (public.pode_algum(conta_id, array['servicos', 'agenda'], 'editar'));
create policy "campanhas: a conta vê" on public.campanhas for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "campanhas: Serviços ou Agenda edita" on public.campanhas for all to authenticated
  using (public.pode_algum(conta_id, array['servicos', 'agenda'], 'editar')) with check (public.pode_algum(conta_id, array['servicos', 'agenda'], 'editar'));

-- Clientes: o básico todos da conta veem; quem edita qualquer módulo cria e corrige (o "Para quem?"); só Clientes apaga.
create policy "clientes: a conta vê o básico" on public.clientes for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "clientes: quem edita algum módulo cria" on public.clientes for insert to authenticated with check (public.edita_algum(conta_id));
create policy "clientes: quem edita algum módulo corrige" on public.clientes for update to authenticated
  using (public.edita_algum(conta_id)) with check (public.edita_algum(conta_id));
create policy "clientes: Clientes apaga" on public.clientes for delete to authenticated using (public.pode(conta_id, 'clientes', 'editar'));
create policy "clientes_fichas: Clientes vê" on public.clientes_fichas for select to authenticated using (public.pode(conta_id, 'clientes', 'ver'));
create policy "clientes_fichas: Clientes edita" on public.clientes_fichas for all to authenticated
  using (public.pode(conta_id, 'clientes', 'editar')) with check (public.pode(conta_id, 'clientes', 'editar'));

create policy "pedidos: Atendimento vê" on public.pedidos for select to authenticated using (public.pode(conta_id, 'atendimento', 'ver'));
create policy "pedidos: Atendimento edita" on public.pedidos for all to authenticated
  using (public.pode(conta_id, 'atendimento', 'editar')) with check (public.pode(conta_id, 'atendimento', 'editar'));

-- Reservas: a agenda todos veem (sem valores); cria quem edita a Agenda ou o Atendimento; muda e apaga a Agenda.
create policy "reservas: a conta vê" on public.reservas for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "reservas: Agenda ou Atendimento cria" on public.reservas for insert to authenticated
  with check (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'editar'));
create policy "reservas: Agenda muda" on public.reservas for update to authenticated
  using (public.pode(conta_id, 'agenda', 'editar')) with check (public.pode(conta_id, 'agenda', 'editar'));
create policy "reservas: Agenda apaga" on public.reservas for delete to authenticated using (public.pode(conta_id, 'agenda', 'editar'));
create policy "reservas_adicionais: a conta vê" on public.reservas_adicionais for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "reservas_adicionais: Agenda ou Atendimento edita" on public.reservas_adicionais for all to authenticated
  using (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'editar')) with check (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'editar'));
create policy "reservas_valores: Financeiro ou Contratos vê" on public.reservas_valores for select to authenticated
  using (public.pode_algum(conta_id, array['financeiro', 'contratos'], 'ver'));
create policy "reservas_valores: Financeiro ou Contratos edita" on public.reservas_valores for all to authenticated
  using (public.pode_algum(conta_id, array['financeiro', 'contratos'], 'editar')) with check (public.pode_algum(conta_id, array['financeiro', 'contratos'], 'editar'));
create policy "reservas_checklist: Agenda ou Clientes vê" on public.reservas_checklist for select to authenticated
  using (public.pode_algum(conta_id, array['agenda', 'clientes'], 'ver'));
create policy "reservas_checklist: Agenda ou Clientes edita" on public.reservas_checklist for all to authenticated
  using (public.pode_algum(conta_id, array['agenda', 'clientes'], 'editar')) with check (public.pode_algum(conta_id, array['agenda', 'clientes'], 'editar'));

create policy "compromissos: a conta vê" on public.compromissos for select to authenticated using (public.pode(conta_id, 'inicio', 'ver'));
create policy "compromissos: Agenda ou Atendimento edita" on public.compromissos for all to authenticated
  using (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'editar')) with check (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'editar'));
create policy "lista_espera: Agenda ou Atendimento vê" on public.lista_espera for select to authenticated
  using (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'ver'));
create policy "lista_espera: Agenda ou Atendimento edita" on public.lista_espera for all to authenticated
  using (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'editar')) with check (public.pode_algum(conta_id, array['agenda', 'atendimento'], 'editar'));

create policy "parcelas: Financeiro vê" on public.parcelas for select to authenticated using (public.pode(conta_id, 'financeiro', 'ver'));
create policy "parcelas: Financeiro edita" on public.parcelas for all to authenticated
  using (public.pode(conta_id, 'financeiro', 'editar')) with check (public.pode(conta_id, 'financeiro', 'editar'));

create policy "modelos_contrato: Contratos vê" on public.modelos_contrato for select to authenticated using (public.pode(conta_id, 'contratos', 'ver'));
create policy "modelos_contrato: Contratos edita" on public.modelos_contrato for all to authenticated
  using (public.pode(conta_id, 'contratos', 'editar')) with check (public.pode(conta_id, 'contratos', 'editar'));
create policy "contratos: Contratos vê" on public.contratos for select to authenticated using (public.pode(conta_id, 'contratos', 'ver'));
create policy "contratos: Contratos edita" on public.contratos for all to authenticated
  using (public.pode(conta_id, 'contratos', 'editar')) with check (public.pode(conta_id, 'contratos', 'editar'));

create policy "entregas: Clientes vê" on public.entregas for select to authenticated using (public.pode(conta_id, 'clientes', 'ver'));
create policy "entregas: Clientes edita" on public.entregas for all to authenticated
  using (public.pode(conta_id, 'clientes', 'editar')) with check (public.pode(conta_id, 'clientes', 'editar'));

-- ---------- permissões dos papéis da API ----------

revoke all on public.tipos_reserva, public.servicos, public.adicionais, public.horarios, public.bloqueios,
  public.campanhas, public.clientes, public.clientes_fichas, public.pedidos, public.reservas,
  public.reservas_adicionais, public.reservas_valores, public.reservas_checklist, public.compromissos,
  public.lista_espera, public.parcelas, public.modelos_contrato, public.contratos, public.entregas
  from anon, authenticated;
grant select, insert, update, delete on public.tipos_reserva, public.servicos, public.adicionais, public.horarios,
  public.bloqueios, public.campanhas, public.clientes, public.clientes_fichas, public.pedidos, public.reservas,
  public.reservas_adicionais, public.reservas_valores, public.reservas_checklist, public.compromissos,
  public.lista_espera, public.parcelas, public.modelos_contrato, public.contratos, public.entregas
  to authenticated;

revoke execute on function public.situacao(public.clientes), public.fechar_pedido(uuid, timestamptz, timestamptz, text),
  public.juntar_clientes(uuid, uuid) from public, anon;
grant execute on function public.situacao(public.clientes), public.fechar_pedido(uuid, timestamptz, timestamptz, text),
  public.juntar_clientes(uuid, uuid) to authenticated;
