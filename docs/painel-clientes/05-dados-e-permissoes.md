# Dados e permissões

Proposta do modelo de dados. Os nomes são em português, como no painel interno (`supabase/schema.sql`). A
estrutura final nasce nas migrações da parada 3 em diante; este documento muda junto.

## A ideia central

- **Tudo pertence a uma conta.** Toda tabela tem `conta_id`, e a RLS só deixa ler ou gravar quem é da conta.
- **Acesso por módulo, em três níveis:** sem acesso, **só vê**, **edita**. É o que o exemplo mostra na tela Equipe e
  acessos (`exemplos/dados-villa-alecrim.js`, campo `acesso` de cada pessoa).
- **Módulo não contratado ninguém vê**, nem o dono. Os dados ficam guardados; voltou a contratar, voltam a aparecer.
- **O dono** tem tudo (incluindo Equipe e acessos, Configurações e publicar no Meu site).
- **A equipe Renderiza** entra para suporte só com registro (quem, quando, qual conta, por quê).

### Como a regra fica no banco (exemplo)

```sql
-- pode(conta, módulo, nível): a pessoa logada é da conta, o módulo está contratado e o acesso dela basta.
create policy "financeiro: ver" on public.parcelas
  for select using (public.pode(conta_id, 'financeiro', 'ver'));
create policy "financeiro: editar" on public.parcelas
  for all using (public.pode(conta_id, 'financeiro', 'editar'))
  with check (public.pode(conta_id, 'financeiro', 'editar'));
```

### Dado que aparece em mais de um módulo

Quem tem só a Agenda precisa ver o nome do cliente no compromisso, mas não a ficha nem os valores. Por isso:

- a reserva guarda um **nome curto para a agenda** (ex.: "Casamento · Ana e Pedro"); a ficha completa fica em
  `clientes` (módulo Clientes);
- **valores ficam só no Financeiro** (`parcelas` e o total da reserva numa tabela do financeiro), nunca na linha da
  reserva. Assim "esconder o financeiro de quem cuida da agenda" é garantido pelo banco, não só pela tela.

## As tabelas (proposta)

**Base**

| Tabela | Para quê | Campos principais |
|---|---|---|
| `contas` | o negócio cliente | nome, nicho (`eventos`, `fotografia`…), código público, logo, cores, WhatsApp, fuso, situação (`ativa`, `em_atraso`, `so_leitura`, `cancelada`), criada em |
| `contas_modulos` | o que está contratado | conta, módulo, desde, até |
| `pessoas` | quem entra na conta | conta, usuário (`auth.users`), nome, papel (texto livre: "Comercial"), cor, `dono` (sim/não), acessos (`{ "agenda": "editar", "financeiro": null, … }`), ativa |
| `convites` | convite pendente | conta, e-mail, acessos, quem convidou, expira em |
| `atividades` | "o que a equipe fez" e auditoria | conta, pessoa, ação, o quê (tabela e id), resumo, quando |
| `equipe_renderiza` e `acessos_suporte` | suporte | quem da Renderiza pode entrar; registro de cada entrada |
| `termos_aceites` | aceite dos termos de uso | pessoa, versão, quando |

**Serviços (base dos módulos)**

| Tabela | Eventos | Fotografia | Campos principais |
|---|---|---|---|
| `servicos` | pacotes (Essencial, Clássico…) | tipos de ensaio (gestante, newborn…) | nome, duração, valor, sinal, convidados inclusos, valor por convidado a mais, cor, o que inclui, aparece na agenda online |
| `adicionais` | open bar, DJ, hora extra… | (se precisar) | nome, preço |
| `horarios` | dias que aluga e turnos | dias e horários de cada tipo de ensaio | dia da semana, início, fim, serviço |
| `bloqueios` | datas fechadas | folgas, férias | de, até, motivo |
| `campanhas` | — | mini sessão de Natal, Dia das Mães | nome, serviço, dias, horários, vagas, prazo do sinal, texto para o Stories |

**O dia a dia**

| Tabela | Módulo | Campos principais |
|---|---|---|
| `clientes` | Clientes | nome, WhatsApp, e-mail, Instagram, origem, observações (CPF só se P21 decidir) |
| `reservas` | Agenda | cliente, serviço, tipo (festa, ensaio, visita, degustação, reunião), início, fim, convidados, situação (`pre_reserva`, `confirmada`, `realizada`, `cancelada`), responsável, campanha, nome curto para a agenda, checklist |
| `reservas_adicionais` | Agenda | reserva, adicional, quantidade |
| `entregas` | Clientes e entregas (fotografia) | reserva, situação (`escolhendo`, `edicao`, `entregue`), prazo, link da galeria |
| `pedidos` | Atendimento | nome e contato de quem pediu, data ou horário desejado, serviço, convidados, origem (`agenda_online`, `whatsapp`, `instagram`, `google`, `indicacao`), etapa (`novo`, `visita_marcada`, `orcamento_enviado`, `aguardando_sinal`, `ganho`, `perdido`), responsável, reserva e cliente gerados |
| `lista_espera` | Atendimento (fotografia) | campanha, nome, contato, posição |
| `parcelas` | Financeiro | reserva, cliente, descrição (sinal, 2ª parcela…), valor, vence em, pago em, forma (Pix, cartão, boleto, dinheiro) |
| `modelos_contrato` | Contratos | nome, texto com campos (`{cliente}`, `{data}`, `{pacote}`, `{valor}`) |
| `contratos` | Contratos | reserva, cliente, modelo, **texto final congelado** e a impressão digital dele (hash), situação (`orcamento`, `enviado`, `aceito`, `cancelado`), código público, enviado em, aceito em, nome de quem aceitou, IP, aparelho |

**Meu site**

| Tabela | Para quê | Campos principais |
|---|---|---|
| `sites` | o site da conta | conta, domínio(s), código público, situação (`conectado`, `desconectado`, `versao_final`), esquema, conteúdo inicial |
| `sites_versoes` | rascunho e publicadas | site, número, conteúdo (JSON do `03`), estado (`rascunho`, `publicada`, `arquivada`), quem, quando |
| `sites_previas` | links de prévia | site, versão, código, expira em |
| Storage `site-imagens/<conta>/…` | imagens enviadas | WebP, com limite por conta |

**Bastidor da Renderiza** (só a equipe Renderiza vê): `cobrancas` (conta, mês, valor, módulos cobrados, situação,
pago em) e `erros_front`. A cobrança pode ficar aqui ou no painel interno (P18).

## Os nomes que mudam por nicho

| No banco | Eventos | Fotografia |
|---|---|---|
| conta | o espaço | o estúdio |
| serviço | pacote | tipo de ensaio |
| reserva | festa (e visita, degustação, reunião) | ensaio |
| convidados | sim | não |
| campanha | não | sim (mini sessões com vagas) |
| entrega | não | sim |
| sinal | parcela de entrada | sinal pelo Pix, que segura o horário |

## Funções públicas (sem login)

Só estas, cada uma devolvendo o mínimo: `publico_disponibilidade(código, de, até)`, `publico_pedido(código, dados)`,
`publico_site(código)`, `publico_previa(código, token)`, `publico_contrato(código)` e
`publico_aceitar_contrato(código, nome, …)`. Nenhuma devolve nome, telefone ou valor de cliente final, a não ser o
contrato para quem tem o código dele.

## Exportação e apagamento

- Cada módulo exporta CSV (abre no Excel e no Google Planilhas): clientes, reservas, pedidos, parcelas e contratos.
- "Exportar tudo" junta todos num arquivo só (zip).
- Conta cancelada: os dados ficam guardados pelo prazo dos termos (P19) e depois são apagados, incluindo as imagens.

## De onde vêm os dados de exemplo

Os arquivos `exemplos/dados-villa-alecrim.js` e `exemplos/dados-estudio-ciranda.js` já têm equipe, tipos, pacotes,
adicionais, situações e um mês inteiro de movimento. Eles viram a **semente** (seed) das contas de teste no banco
local e, mais adiante, de uma conta de demonstração no painel real.
