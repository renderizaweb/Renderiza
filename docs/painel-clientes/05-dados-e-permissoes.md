# Dados e permissões

O modelo de dados do Painel Renderiza. Os nomes são em português, como no painel de prospecção (`supabase/schema.sql`).
**Desde 29/10/2026 está no banco** (Missão 2, bloco A), no STG e na produção, pelas migrações de
`painel-clientes/supabase/migrations/` (`20261029110000` a `20261029112900`); os testes de isolamento ficam em
`painel-clientes/supabase/testes/`. Mudou o banco, muda este documento no mesmo commit.

## O cliente no centro

Pedido de 28/10/2026: "Clientes é uma base importante, já que tudo vai se vincular a um cliente." O painel gira em
torno de duas coisas: a **conta** (o negócio: o espaço, o estúdio) e o **cliente** (quem compra do negócio). Nada fica
solto: todo pedido, reserva, compromisso, contrato e parcela aponta para um cliente.

```
CONTA (o espaço / o estúdio)
 ├── pessoas da equipe (com o acesso de cada uma por módulo)
 ├── serviços: pacotes ou tipos de ensaio · tipos de festa · adicionais · horários · bloqueios · campanhas
 └── CLIENTES ◀──────────────────────────── tudo se liga a um cliente
       ├── pedidos (Atendimento) ──── "fechou" vira ───▶ RESERVA (a festa, o ensaio)
       │                                                  ├── serviço e adicionais
       ├── compromissos (visita, degustação, reunião)     ├── valores (total, sinal)
       │     └── podem apontar para uma reserva           ├── parcelas (Financeiro)
       │                                                  ├── contrato (Contratos)
       │                                                  └── entrega (só fotografia)
       └── histórico: tudo o que aconteceu com ele, em ordem
```

### As regras que amarram tudo

1. **Todo mundo que chega vira cliente na hora.** Pedido da agenda online, mensagem do WhatsApp anotada no
   Atendimento, alguém cadastrado direto: entra em `clientes`. Não existe "lead" separado; o que muda é a situação.
2. **Uma pessoa, um cliente.** O WhatsApp (só os números, com DDD) identifica a pessoa: se já existe, o pedido novo
   se liga ao cliente que já existe. Sem WhatsApp, o e-mail. Se duas fichas forem da mesma pessoa, **juntar
   clientes** leva tudo para uma. No banco: o WhatsApp é único na conta e o banco o normaliza sozinho (tira tudo que
   não é número e o 55 do Brasil); juntar é `juntar_clientes(fica, sai)`.
3. **Do pedido à reserva sem digitar de novo.** "Fechar" no Atendimento cria a reserva com o cliente, a data, o
   serviço e os convidados do pedido; o pedido guarda o link da reserva. No banco: `fechar_pedido(pedido, inicio,
   fim, situacao)`; se o pedido já tinha a data separada (a pré-reserva da agenda online), fecha usando essa
   reserva: confirma (ou mantém a pré-reserva) e ajusta a data, sem criar outra.
4. **A reserva é o centro do que foi vendido.** Valores, parcelas, contrato e entrega pendem dela (e, por ela, do
   cliente). Parcela sem reserva é permitida, mas sempre com cliente.
5. **A situação do cliente é calculada, nunca digitada:**
   - `interessado`: tem pedido em aberto e nenhuma reserva;
   - `reservado`: tem reserva futura (pré-reserva ou confirmada);
   - `realizado`: a última reserva já aconteceu;
   - `nao_fechou`: só pedidos perdidos.

   No banco: `situacao(cliente)`, um campo calculado (na API, `select=*,situacao` em `clientes`). Sem nada ainda, null.
6. **Compromissos** (visita, degustação, reunião) ficam na agenda e podem apontar para um cliente e uma reserva, ou
   para nenhum (reunião interna).
7. **Nada some do histórico.** Cancelar uma reserva muda a situação dela. Cliente com reserva, contrato ou parcela
   não se apaga: se arquiva (`arquivado_em`). O histórico (`atividades`) é gravado pelo próprio banco, por gatilho:
   quem fez, o quê, de qual cliente; guarda o nome das colunas que mudaram e as mudanças de etapa e situação, nunca
   valores.

### Como isso aparece na tela

- **"Para quem?" em tudo.** Criar pedido, reserva, compromisso, contrato ou parcela começa pelo mesmo campo: busca
  por nome ou WhatsApp, com "+ novo cliente" ali mesmo (nome e WhatsApp; o resto depois). Uma peça só, usada em
  todos os módulos.
- **O nome do cliente é sempre clicável:** abre a ficha (módulo Clientes) ou, para quem não tem esse módulo, um
  cartão com nome e contato.
- **A ficha é a linha do tempo do cliente:** pedidos, reservas, compromissos, contratos, parcelas e entregas, em
  ordem, cada item abrindo o seu módulo. Só aparece o que a pessoa pode ver.
- **O próximo passo está sempre à mão:** no pedido, "Marcar visita" e "Fechar reserva"; na reserva, "Enviar
  contrato" e "Lançar parcelas"; na parcela, "Recebi".
- **Os mesmos nomes e cores em todo lugar** para a situação do cliente e as etapas do pedido e da reserva.

## Permissões

- **Tudo pertence a uma conta.** Toda tabela tem `conta_id`, e a RLS só deixa ler ou gravar quem é da conta. As
  ligações entre tabelas levam a conta junto (chave estrangeira composta, `(conta_id, cliente_id)`), então nada de
  uma conta aponta para outra, nem por engano e nem sabendo o id.
- **Acesso por módulo, em três níveis:** sem acesso, **só vê** (`"ver"`), **edita** (`"editar"`), em
  `pessoas.acessos` (`{ "agenda": "editar", "financeiro": null }`), como o exemplo mostra em Equipe e acessos.
- **Módulo desligado ninguém vê**, nem o dono. Quem liga e desliga é a Renderiza, no Admin. Os dados
  ficam guardados; religou, voltam.
- **O dono** tem tudo, incluindo Equipe e acessos, Configurações e publicar no Meu site. **Equipe e Configurações são
  só do dono**; Início e Serviços todos veem; editar Serviços pede acesso "editar" a eles (ou ser dono). A conta
  nunca fica sem dono, e tem no máximo `contas.limite_pessoas` pessoas ativas (5 no plano).
- **Teste vencido ou conta desligada:** a pessoa entra, mas o banco não entrega nenhum dado da conta (a função `pode`
  responde "não") e o painel mostra o aviso para fechar o plano. Nada é apagado; religou, tudo volta. Ativa com prazo
  (`ativa_ate`) vencido vale o mesmo.
- **Teste:** 7 dias contados da criação da conta (`teste_ate`), um prazo só para todos os módulos. Módulo marcado
  como "só pago" (`modulos.liberado_no_teste = false`) fica bloqueado durante o teste.
- **O visitante (sem login) não lê nenhuma tabela**: o que é público passa por funções pequenas (abaixo).
- **A Renderiza** (`equipe_renderiza`) vê contas, pessoas, módulos, entradas e pagamentos, e liga e desliga módulos,
  mas `pode()` responde "não" para os dados das contas. Para ajudar, registra a entrada em `acessos_suporte` (quem,
  por quê, nível "ver" ou "editar", até 8 horas); enquanto vale, ela vê (ou edita) a conta, o dono vê o registro e o
  histórico marca o que ela fez (`pelo_suporte`).

**O que todos da conta veem (com qualquer módulo):** o básico do cliente (nome e contato), porque o "Para quem?" e a
agenda precisam; os serviços, tipos de festa, adicionais, horários, bloqueios e campanhas; as reservas e
compromissos na agenda (sem valores); a equipe.

**O que fica atrás do módulo:**
- a **ficha completa** do cliente (observações, endereço, CPF) fica numa tabela à parte (`clientes_fichas`), do
  módulo Clientes; as entregas também;
- os **valores** da reserva ficam em `reservas_valores`, que só quem tem Financeiro ou Contratos lê (o contrato
  precisa do valor), e as parcelas, só Financeiro. Assim "esconder o financeiro de quem cuida da agenda" é garantido
  pelo banco, não só pela tela;
- o **checklist da festa** (`reservas_checklist`): Agenda ou Clientes;
- pedidos: Atendimento; lista de espera: Agenda ou Atendimento; contratos e modelos: Contratos; Meu site: Meu site.

**Quem grava:** criar e corrigir cliente, quem edita qualquer módulo (o "Para quem?" com "+ novo cliente" está em
todos); apagar cliente, só Clientes. Criar reserva, Agenda ou Atendimento (o "fechar"); mudar e apagar reserva, só
Agenda. Compromissos, Agenda ou Atendimento ("Marcar visita"). Bloqueios e campanhas, Serviços ou Agenda. O resto, o
próprio módulo com "editar".

```sql
-- pode(conta, módulo, nível): a pessoa logada é da conta, a conta está liberada, o módulo está ligado (no teste,
-- também liberado no teste) e o acesso dela basta. Usada em todas as políticas.
create policy "parcelas: Financeiro vê" on public.parcelas
  for select to authenticated using (public.pode(conta_id, 'financeiro', 'ver'));
create policy "parcelas: Financeiro edita" on public.parcelas
  for all to authenticated using (public.pode(conta_id, 'financeiro', 'editar'))
  with check (public.pode(conta_id, 'financeiro', 'editar'));
```

## As tabelas

Como estão no banco (29/10/2026). Toda tabela tem `id`, `conta_id` e as datas de criação e mudança, que não
aparecem abaixo. O comentário de cada tabela no banco (`comment on table`) diz o mesmo, em uma linha.

**Conta e acesso**

| Tabela | Para quê | Campos principais |
|---|---|---|
| `contas` | o negócio cliente | nome, nicho (`eventos`, `fotografia`), código público (`codigo`, curto; a Renderiza troca), logo (caminho no Storage), cores, WhatsApp, fuso, situação (`teste`, `ativa`, `desligada`, `cancelada`), teste até (7 dias da criação), ativa até (opcional), origem (`cadastro` ou `renderiza`), limite de pessoas (5), ajustes (o que o painel guarda da conta: ordem do menu, primeiros passos escondidos). O dono muda nome, logo, cores, WhatsApp, fuso e ajustes; o resto é da Renderiza |
| `modulos` | o catálogo de módulos (o mesmo para todas as contas) | id (`agenda-online`, `agenda`, `clientes`, `contratos`, `financeiro`, `atendimento`, `meu-site`), nome, preço, liberado no teste (a Renderiza muda no Admin), ordem. Os da base (Início, Serviços, Equipe, Configurações) não entram aqui |
| `contas_modulos` | o que está ligado em cada conta | conta, módulo, ligado, desde, quem ligou (no cadastro, os que a pessoa escolheu) |
| `pessoas` | quem entra na conta | conta, usuário (`auth.users`), nome, e-mail, papel ("Comercial"), cor, dono (sim/não), acessos (`{ "agenda": "editar", "financeiro": null, … }`), ativa (tirar o acesso = `false`), visto em, preferências (de cada pessoa) |
| `convites` | convite pendente | conta, e-mail, nome, papel, cor, dono (sim/não), acessos, quem convidou, expira em (7 dias), aceito em, cancelado em. Vira pessoa quando o convidado entra e chama `aceitar_convites()` |
| `termos_aceites` | aceite dos termos de uso | usuário (o login: vale para todas as contas dele), versão, quando, aparelho. A versão é a data dos documentos (`VERSAO_DOS_TERMOS` em `src/telas/termos.js`, a mesma do `data-versao` de `/termos` e `/privacidade`): versão nova, o painel pede o aceite de novo (Missão 5B, D35). Cada um grava e lê só o próprio aceite |
| `atividades` | histórico ("o que a equipe fez" e a linha do tempo do cliente) | pessoa (ou o sistema), pelo suporte, ação (`criou`, `mudou`, `apagou`), tabela e id, cliente, reserva, módulo (quem vê), colunas que mudaram, detalhe (`{"etapa": [antes, depois]}`, `{"pago": true}`), quando. Gravada só pelos gatilhos, sem valores |

**O negócio**

| Tabela | Eventos | Fotografia | Campos principais |
|---|---|---|---|
| `tipos_reserva` | tipos de festa (casamento, 15 anos…) | (o tipo de ensaio é o serviço) | nome, cor na agenda, checklist padrão (cada festa nova ganha), ordem. No onboarding de eventos, "Que festas vocês fazem?" (`09`) cria os tipos |
| `servicos` | pacotes (Essencial, Clássico…) | tipos de ensaio | nome, descrição, duração, valor (vazio = a preencher), sinal, convidados inclusos, valor por convidado a mais, cor, o que inclui, o que entrega ("10 fotos editadas"), aparece na agenda online |
| `adicionais` | open bar, DJ, hora extra… | (se precisar) | nome, preço |
| `horarios` | turnos que aluga ("De dia" 11h–17h, "À noite" 19h–2h) | horários de início de cada ensaio | dia da semana (0 = domingo), início, fim (antes do início = passa da meia-noite), nome do turno, serviço (vazio = todos sem horário próprio) |
| `bloqueios` | datas fechadas | folgas, férias | de, até, motivo |
| `campanhas` | — | mini sessão de Natal | nome, serviço, dias, horários, vagas (vazio = dias × horários), prazo do sinal (horas), texto para o Stories |

**O dia a dia** (todas com `cliente_id`, menos as marcadas)

| Tabela | Módulo | Campos principais |
|---|---|---|
| `clientes` | base | nome, WhatsApp (normalizado, único na conta), e-mail, Instagram (sem @), origem, arquivado em |
| `clientes_fichas` | Clientes | cliente, observações, endereço, CPF (só se o contrato do cliente pedir) |
| `pedidos` | Atendimento | cliente, data e hora desejadas, serviço, tipo, convidados, mensagem, origem (`agenda_online`, `whatsapp`, `instagram`, `google`, `indicacao`, `outro`), etapa (`novo`, `em_conversa`, `visita_marcada`, `orcamento_enviado`, `aguardando_sinal`, `fechado`, `perdido`), responsável, reserva gerada |
| `reservas` | Agenda (todos veem) | cliente, pedido de origem, serviço, tipo, campanha, título (o nome da festa, quando não é o do cliente), início, fim, convidados, situação (`pre_reserva`, `confirmada`, `realizada`, `cancelada`), responsável, produção no dia, observações |
| `reservas_adicionais` | Agenda (sem cliente) | reserva, adicional, quantidade (sem preço) |
| `reservas_valores` | Financeiro e Contratos (sem cliente) | reserva, valor total, sinal, desconto |
| `reservas_checklist` | Agenda e Clientes (sem cliente) | reserva, texto, feito, feito em, feito por, ordem. O checklist é da festa (no exemplo, a aba Checklist da festa; no `02`, "checklist da festa" na ficha) |
| `compromissos` | Agenda | tipo (`visita`, `degustacao`, `reuniao`, `outro`), título, início, fim (opcional), cliente, reserva e pedido (opcionais), responsável, observações |
| `lista_espera` | Agenda e Atendimento (fotografia) | campanha (opcional), cliente, posição, preferência ("sábado à tarde"), origem |
| `parcelas` | Financeiro | cliente, reserva (opcional, e do mesmo cliente), descrição (sinal, 2ª parcela…), valor, vence em, pago em, forma (`pix`, `boleto`, `cartao`, `dinheiro`, `transferencia`, `outro`), observação |
| `modelos_contrato` | Contratos (sem cliente) | nome, texto com campos (`{cliente}`, `{data}`, `{pacote}`, `{valor}`) |
| `contratos` | Contratos | reserva, cliente, modelo, **texto final congelado** e a impressão digital dele (hash sha256, recalculado pelo banco), situação (`orcamento`, `enviado`, `aceito`, `cancelado`), código público (do link de aceite), enviado em, aceito em, nome e contato de quem aceitou, IP, aparelho. Aceito não muda (só cancela); o aceite só é gravado pela função pública |
| `entregas` | Clientes e entregas (fotografia) | reserva, situação (`escolhendo`, `edicao`, `entregue`), prazo, link da galeria (só `https://`), entregue em |

**Meu site** (sem cliente)

| Tabela | Para quê | Campos principais |
|---|---|---|
| `sites` | o site da conta (um por conta) | conta, domínio(s), código público, situação (`conectado`, `desconectado`, `versao_final`), esquema, conteúdo inicial. Cadastrado e desconectado pela Renderiza |
| `sites_versoes` | rascunho (um por site) e publicadas | site, número (sozinho), conteúdo (JSON do `03`), estado (`rascunho`, `publicada`, `arquivada`), quem, publicada em. Publicada não muda |
| `sites_previas` | links de prévia | site, versão, código, expira em (1 dia; no máximo 7) |
| Storage | arquivos, sempre em `<bucket>/<id da conta>/…` | `logos` (público, PNG, JPEG ou WebP até 1 MB; o dono envia), `site-imagens` (público, WebP até 2 MB; quem edita o Meu site envia), `privado` (fechado, sem uso ainda) |

**Admin (só a equipe Renderiza)**

| Tabela ou função | Para quê |
|---|---|
| `equipe_renderiza` | quem entra no Admin (a Renderiza cadastra direto no banco) |
| `entradas` | cada entrada numa conta (`registrar_entrada`): quem, conta, quando, aparelho (para "quem loga, quem está acessando"); no máximo uma a cada 30 minutos por pessoa e conta |
| `pagamentos` | o Pix de cada mês, registrado à mão: conta, mês de referência (dia 1), valor, pago em, observação, quem registrou |
| `acessos_suporte` | cada vez que a Renderiza entrou numa conta para ajudar: quem, por quê, nível, de quando até quando |
| `admin_indicadores()` | contas por situação e por nicho, cadastros por semana, pessoas ativas em 7 e 30 dias, uso por módulo (registros criados em 30 dias), módulos ligados, pedidos que vieram dos sites. **Só números:** nada de nome ou contato de cliente final |
| `erros_front` | erros das telas, sem dado pessoal (quem está logado grava; só a Renderiza lê) |

## As funções que o painel chama

Todas pedem login e conferem a conta e o acesso por dentro.

| Função | Quem usa | O que faz |
|---|---|---|
| `minhas_contas()` | casca (escolher a conta, menu) | as contas da pessoa: nome, nicho, situação, liberada (ou o aviso), acessos dela e os módulos ligados. Para a equipe Renderiza, também a conta em que está em suporte registrado (`suporte_ate`: até quando; `pessoa_id` nulo; liberada; os acessos no nível do suporte, "editar" vale como dono), para "entrar para ajudar" abrir o painel da conta (30/10, Missão 5A, migração `…120000`) |
| `cadastrar_conta(nome, nicho, whatsapp, modulos, meu_nome)` | cadastro com 7 dias grátis | cria a conta em teste, a pessoa como dona e os módulos escolhidos; o teste é um só (quem já é dono de uma conta do cadastro não cria outra); pede o e-mail confirmado |
| `aceitar_convites()` | logo depois de entrar | os convites válidos do e-mail logado viram pessoa da conta |
| `registrar_entrada(conta, aparelho)` | ao entrar numa conta | a entrada (Admin) e o "visto em" |
| `fechar_pedido(pedido, inicio, fim, situacao)` | Atendimento | o pedido vira reserva (regra 3); se já tem reserva (a pré-reserva da agenda online), confirma ou mantém a pré-reserva e ajusta a data, sem criar outra (29/10, Missão 3C) |
| `juntar_clientes(fica, sai)` | Clientes | leva tudo de uma ficha para a outra (regra 2) |
| `situacao(cliente)` | todos | a situação calculada (regra 5) |
| `admin_indicadores()` | Admin | os números |
| `pode(conta, módulo, nível)` | as políticas (e o painel, se quiser perguntar) | a regra de acesso |

## Os nomes que mudam por nicho

| No banco | Eventos | Fotografia |
|---|---|---|
| conta | o espaço | o estúdio |
| serviço | pacote | tipo de ensaio |
| reserva | festa | ensaio |
| compromisso | visita, degustação, reunião | reunião (raro) |
| convidados | sim | não |
| campanha | não | sim (mini sessões com vagas) |
| entrega | não | sim |
| sinal | parcela de entrada | sinal pelo Pix, que segura o horário |

## Funções públicas (sem login)

Só estas, cada uma devolvendo o mínimo: `publico_disponibilidade(código, de, até)`, `publico_pedido(código, dados)`
(acha ou cria o cliente pelo WhatsApp e cria o pedido), `publico_site(código)`, `publico_previa(código, token)`,
`publico_contrato(código)` e `publico_aceitar_contrato(código, nome, …)`. Nenhuma devolve nome, telefone ou valor
de cliente final, a não ser o contrato para quem tem o código dele.

Cada uma nasce na missão que a usa (agenda online e Meu site na Missão 4; o aceite do contrato na Missão 3, bloco
E), numa migração pequena, com o nome começando por `publico_` (o teste `supabase/testes/090_regras_gerais.sql` só
deixa essas abertas ao visitante). Desde a revisão de segurança (Missão 5B, migração `…150000_funcoes_sem_visitante`)
vale para **toda** função de `public`, inclusive as auxiliares e as de gatilho: função nova leva
`revoke execute … from public, anon` (e `grant … to authenticated` se o painel chama), senão o `090` falha.

**Já no banco (29/10/2026, Missão 4A, migrações `…135228_publico_agenda` e `…141139_aviso_de_pedido`):**
- `publico_disponibilidade(código, de, até)`: os dias com turno (`horarios` do dia da semana) e se cada turno está
  livre, mais tipos, pacotes da agenda online e adicionais, sem preço. Livre = sem bloqueio no dia e sem reserva que
  segure o período. **Seguram a data:** reserva confirmada ou realizada; pré-reserva feita pela equipe; e a
  pré-reserva da agenda online **só nas primeiras 48 horas** (depois, sem confirmação, a data volta a aparecer livre no
  site; a reserva continua no painel para a equipe decidir). Turno que passa da meia-noite (fim antes do início) vai
  até o dia seguinte; sem fim, 1 hora.
- `publico_pedido(código, dados, domínio, endereço)`: acha ou cria o cliente pelo WhatsApp (o nome que já estava no
  painel fica; o e-mail entra se não havia), cria o pedido (`origem = agenda_online`, etapa `novo`, a mensagem com o
  turno, os convidados, os adicionais, "quer visitar" e o recado) e a pré-reserva ligada a ele (com os adicionais e o
  checklist do tipo). Confere o domínio, os dados e os limites (ver `04`) e trava o dia da conta enquanto grava, para
  dois pedidos não levarem o mesmo turno.
- Só respondem quando o site está **conectado**, a conta **liberada** e o módulo **Agenda online ligado** (no teste,
  liberado no teste); senão, nada (`404` na API).
- Tabelas de apoio, sem dado de pessoa e fechadas ao app (só as funções gravam): `publico_tentativas` (o endereço
  embaralhado de quem pediu, para o limite; apagado depois de 1 dia) e `pedidos_avisos` (pedido já avisado por e-mail).
- `aviso_do_pedido(pedido)`: só a chave secreta (a função `avisar-pedido`); ver `04`.

**Já no banco (29/10/2026, Missão 3E, migração `…220000_publico_contrato`, STG e produção):**
- `publico_contrato(código)`: o contrato **enviado** (conta liberada e Contratos ligado) ou **aceito** (este
  continua aparecendo mesmo com o módulo desligado: é a prova). Devolve o texto, a impressão digital (`impressao`,
  o hash), a situação, quem aceitou e quando, o negócio (nome, nicho, logo, WhatsApp, fuso), o resumo (cliente,
  tipo, pacote, início e fim, convidados, adicionais, valor total, desconto, sinal) e, **só depois do aceite**, o
  Pix (`contas.ajustes.pix`: `chave` e `nome`, que o dono põe em Configurações). Orçamento, cancelado ou código
  errado: `null`.
- `publico_aceitar_contrato(código, nome, contato, impressão)`: grava o aceite (situação `aceito`, data e hora,
  nome, contato). **O IP e o aparelho vêm do próprio pedido** (`cf-connecting-ip` ou o primeiro do
  `x-forwarded-for`, e o `user-agent`), não de quem chama. A impressão tem de ser a do texto atual (`erro: mudou`
  se o texto mudou depois que a página abriu). Devolve `{ ok, contrato }` ou `{ ok: false, erro: fora | dados
  (campo) | mudou }`. Aceitar de novo não troca quem aceitou.

**Já no banco (29/10/2026, Missão 4C, migração `…141746_publico_site`, no STG):**
- `publico_site(código)`: a última versão publicada no formato do contrato v1 (`03`), com `esquema`, `site`, `versao`
  e `publicado_em` por cima do que veio no conteúdo; nunca publicou = conteúdo vazio, versão 0 (o site fica na
  inicial).
- `publico_previa(código, código da prévia)`: o rascunho da prévia, enquanto `sites_previas.expira_em` não passou.
- As duas só respondem com o site **conectado**, a conta **liberada** e o módulo **Meu site ligado**; senão, nada
  (`404` na API, e o site volta à versão inicial).
- O painel grava direto, pela RLS de quem tem "edita" no Meu site: o rascunho (`sites_versoes`, um por site), a
  publicação (o rascunho vira `publicada`, com número, data e quem) e a prévia (`sites_previas`). As fotos vão para
  `site-imagens/<id da conta>/` sem trocar arquivo (não há política de leitura nos buckets públicos, e o Storage só
  troca com ela).

## Exportação e apagamento

- Cada módulo exporta CSV (abre no Excel e no Google Planilhas); "exportar tudo" junta tudo num zip.
- Conta cancelada: os dados ficam guardados por 90 dias (padrão; ver `07`) e depois são apagados, com as imagens.

## De onde vêm os dados de teste

`exemplos/dados-villa-alecrim.js` e `exemplos/dados-estudio-ciranda.js` já têm equipe, tipos, pacotes, adicionais,
situações e um mês de movimento. Eles são a **semente** das contas de teste: `painel-clientes/supabase/semente/semente.mjs`
lê os dois arquivos (sem mexer neles) e grava a Villa Alecrim e o Estúdio Ciranda no banco local
(`node supabase/semente/semente.mjs local`) e no STG (`… stg`), com as datas a partir do dia em que roda. Rodar de
novo apaga as duas contas de teste e grava de novo. Nunca na produção. No STG, o `contato@renderizaweb.com.br` é o
dono das duas; a equipe são usuários fictícios (`@villa-alecrim.teste`, `@estudio-ciranda.teste`), sem senha.
