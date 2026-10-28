# Dados e permissões

Proposta do modelo de dados. Os nomes são em português, como no painel de prospecção (`supabase/schema.sql`). A
estrutura final nasce nas migrações da parada 2; este documento muda junto (no mesmo commit).

## O cliente no centro

Pedido de 28/10/2026: "Clientes é uma base importante, já que tudo vai se vincular a um cliente." O painel gira em
torno de duas coisas: a **conta** (o negócio: o espaço, o estúdio) e o **cliente** (quem compra do negócio). Nada fica
solto: todo pedido, reserva, compromisso, contrato e parcela aponta para um cliente.

```
CONTA (o espaço / o estúdio)
 ├── pessoas da equipe (com o acesso de cada uma por módulo)
 ├── serviços: pacotes ou tipos de ensaio · adicionais · horários · bloqueios · campanhas
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
   clientes** leva tudo para uma.
3. **Do pedido à reserva sem digitar de novo.** "Fechar" no Atendimento cria a reserva com o cliente, a data, o
   serviço e os convidados do pedido; o pedido guarda o link da reserva.
4. **A reserva é o centro do que foi vendido.** Valores, parcelas, contrato e entrega pendem dela (e, por ela, do
   cliente). Parcela sem reserva é permitida, mas sempre com cliente.
5. **A situação do cliente é calculada, nunca digitada:**
   - `interessado`: tem pedido em aberto e nenhuma reserva;
   - `reservado`: tem reserva futura (pré-reserva ou confirmada);
   - `realizado`: a última reserva já aconteceu;
   - `nao_fechou`: só pedidos perdidos.
6. **Compromissos** (visita, degustação, reunião) ficam na agenda e podem apontar para um cliente e uma reserva, ou
   para nenhum (reunião interna).
7. **Nada some do histórico.** Cancelar uma reserva muda a situação dela. Cliente com reserva, contrato ou parcela
   não se apaga: se arquiva.

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

- **Tudo pertence a uma conta.** Toda tabela tem `conta_id`, e a RLS só deixa ler ou gravar quem é da conta.
- **Acesso por módulo, em três níveis:** sem acesso, **só vê**, **edita** (como o exemplo mostra em Equipe e acessos;
  `exemplos/dados-villa-alecrim.js`, campo `acesso`).
- **Módulo desligado ninguém vê**, nem o dono. Quem liga e desliga é a Renderiza, no Admin. Os dados
  ficam guardados; religou, voltam.
- **O dono** tem tudo, incluindo Equipe e acessos, Configurações e publicar no Meu site.
- **Teste vencido ou conta desligada:** a pessoa entra, mas o banco não entrega nenhum dado da conta (a função `pode`
  responde "não") e o painel mostra o aviso para fechar o plano. Nada é apagado; religou, tudo volta.
- **Teste:** 7 dias contados da criação da conta (`teste_ate`), um prazo só para todos os módulos. Módulo marcado
  como "só pago" (`modulos.liberado_no_teste = false`) fica bloqueado durante o teste.

**O que todos da conta veem (com qualquer módulo):** o básico do cliente (nome e contato), porque o "Para quem?" e a
agenda precisam; os serviços; as reservas e compromissos na agenda (sem valores).

**O que fica atrás do módulo:**
- a **ficha completa** do cliente (observações, checklist, endereço) fica numa tabela à parte (`clientes_fichas`),
  do módulo Clientes;
- os **valores** da reserva ficam em `reservas_valores`, que só quem tem Financeiro ou Contratos lê (o contrato
  precisa do valor). Assim "esconder o financeiro de quem cuida da agenda" é garantido pelo banco, não só pela tela.

```sql
-- pode(conta, módulo, nível): a pessoa logada é da conta, o módulo está ligado e o acesso dela basta.
create policy "financeiro: ver" on public.parcelas
  for select using (public.pode(conta_id, 'financeiro', 'ver'));
create policy "financeiro: editar" on public.parcelas
  for all using (public.pode(conta_id, 'financeiro', 'editar'))
  with check (public.pode(conta_id, 'financeiro', 'editar'));
```

## As tabelas

**Conta e acesso**

| Tabela | Para quê | Campos principais |
|---|---|---|
| `contas` | o negócio cliente | nome, nicho (`eventos`, `fotografia`), código público, logo, cores, WhatsApp, fuso, situação (`teste`, `ativa`, `desligada`, `cancelada`), teste até, ativa até (opcional), origem (`cadastro` ou `renderiza`) |
| `modulos` | o catálogo de módulos (o mesmo para todas as contas) | id, nome, preço, liberado no teste (sim/não; a Renderiza muda no admin) |
| `contas_modulos` | o que está ligado em cada conta | conta, módulo, ligado, desde, quem ligou (no cadastro, os que a pessoa escolheu) |
| `pessoas` | quem entra na conta | conta, usuário (`auth.users`), nome, papel ("Comercial"), cor, dono (sim/não), acessos (`{ "agenda": "editar", "financeiro": null, … }`), ativa, visto em |
| `convites` | convite pendente | conta, e-mail, acessos, quem convidou, expira em |
| `atividades` | histórico ("o que a equipe fez") | conta, pessoa, ação, tabela e id, cliente, resumo, quando |
| `termos_aceites` | aceite dos termos de uso | pessoa, versão, quando |

**O negócio**

| Tabela | Eventos | Fotografia | Campos principais |
|---|---|---|---|
| `servicos` | pacotes (Essencial, Clássico…) | tipos de ensaio | nome, duração, valor, sinal, convidados inclusos, valor por convidado a mais, cor, o que inclui, aparece na agenda online |
| `adicionais` | open bar, DJ, hora extra… | (se precisar) | nome, preço |
| `horarios` | dias e turnos que aluga | dias e horários de cada ensaio | dia da semana, início, fim, serviço |
| `bloqueios` | datas fechadas | folgas, férias | de, até, motivo |
| `campanhas` | — | mini sessão de Natal | nome, serviço, dias, horários, vagas, prazo do sinal, texto para o Stories |

**O dia a dia** (todas com `cliente_id`, menos as marcadas)

| Tabela | Módulo | Campos principais |
|---|---|---|
| `clientes` | base | nome, WhatsApp (normalizado, único na conta), e-mail, Instagram, origem, arquivado |
| `clientes_fichas` | Clientes | cliente, observações, checklist, endereço (CPF só se o contrato do cliente pedir) |
| `pedidos` | Atendimento | cliente, data ou horário desejado, serviço, convidados, origem (`agenda_online`, `whatsapp`, `instagram`, `google`, `indicacao`), etapa (`novo`, `visita_marcada`, `orcamento_enviado`, `aguardando_sinal`, `fechado`, `perdido`), responsável, reserva gerada |
| `reservas` | Agenda | cliente, pedido de origem, serviço, início, fim, convidados, situação (`pre_reserva`, `confirmada`, `realizada`, `cancelada`), responsável, campanha |
| `reservas_adicionais` | Agenda | reserva, adicional, quantidade |
| `reservas_valores` | Financeiro e Contratos | reserva, valor total, sinal, desconto |
| `compromissos` | Agenda | tipo (`visita`, `degustacao`, `reuniao`, `outro`), início, fim, cliente e reserva (opcionais), responsável |
| `lista_espera` | Atendimento (fotografia) | campanha, cliente, posição |
| `parcelas` | Financeiro | cliente, reserva (opcional), descrição (sinal, 2ª parcela…), valor, vence em, pago em, forma |
| `modelos_contrato` | Contratos (sem cliente) | nome, texto com campos (`{cliente}`, `{data}`, `{pacote}`, `{valor}`) |
| `contratos` | Contratos | reserva, cliente, modelo, **texto final congelado** e a impressão digital dele (hash), situação (`orcamento`, `enviado`, `aceito`, `cancelado`), código público, enviado em, aceito em, nome de quem aceitou, IP, aparelho |
| `entregas` | Clientes e entregas (fotografia) | reserva, situação (`escolhendo`, `edicao`, `entregue`), prazo, link da galeria |

**Meu site** (sem cliente)

| Tabela | Para quê | Campos principais |
|---|---|---|
| `sites` | o site da conta | conta, domínio(s), código público, situação (`conectado`, `desconectado`, `versao_final`), esquema, conteúdo inicial |
| `sites_versoes` | rascunho e publicadas | site, número, conteúdo (JSON do `03`), estado (`rascunho`, `publicada`, `arquivada`), quem, quando |
| `sites_previas` | links de prévia | site, versão, código, expira em |
| Storage `site-imagens/<conta>/…` | imagens enviadas | WebP, com limite por conta |

**Admin (só a equipe Renderiza)**

| Tabela ou visão | Para quê |
|---|---|
| `equipe_renderiza` | quem entra no Admin |
| `entradas` | cada login: pessoa, conta, quando, aparelho (para "quem loga, quem está acessando") |
| `pagamentos` | o Pix de cada mês, registrado à mão: conta, mês de referência, valor, pago em, observação, quem registrou |
| `acessos_suporte` | cada vez que a Renderiza entrou numa conta para ajudar: quem, quando, por quê |
| visões de indicadores | contas por situação, cadastros por semana, pessoas ativas em 7 e 30 dias, uso por módulo (registros criados), pedidos que vieram dos sites. **Só números:** nada de nome ou contato de cliente final |
| `erros_front` | erros das telas, sem dado pessoal |

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

## Exportação e apagamento

- Cada módulo exporta CSV (abre no Excel e no Google Planilhas); "exportar tudo" junta tudo num zip.
- Conta cancelada: os dados ficam guardados por 90 dias (padrão; ver `07`) e depois são apagados, com as imagens.

## De onde vêm os dados de teste

`exemplos/dados-villa-alecrim.js` e `exemplos/dados-estudio-ciranda.js` já têm equipe, tipos, pacotes, adicionais,
situações e um mês de movimento. Eles viram a **semente** das contas de teste no banco local (tarefa T2.3).
