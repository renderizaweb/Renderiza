# O trilho do Painel Renderiza

O projeto é um trem: sai da partida (o que já existe), passa por **6 paradas** e chega ao destino. Cada parada é um
grupo de tarefas com um **"chegou quando"**: só se sai dela quando o "chegou quando" é verdade. Não tem cronograma por
dia: o trem anda conforme as paradas fecham. As tarefas de cada parada estão no [quadro de tarefas](tarefas.md), e
as regras para várias sessões trabalharem ao mesmo tempo, em [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md).

**Destino:** o piloto (um espaço de eventos) usando o Painel Renderiza no dia a dia, com **todos os módulos** num
lote só (nada parcial), o site dele conectado e a Renderiza acompanhando tudo pelo painel administrativo. Meta da
Renderiza: o piloto começar a usar por volta de **11/11/2026** (2 semanas a partir de 28/10/2026).

## Painel de bordo

| | |
|---|---|
| **Onde o trem está** | Parada 1 · Organização e infraestrutura |
| **Próxima ação** | A Renderiza cria o Supabase, a Vercel e o e-mail (T1.2 a T1.4) e aponta `painel.renderizaweb.com.br` (T1.1); as sessões começam T1.5 e T1.6 |
| **Em aberto** | rodada 3 do [`07`](07-decisoes-e-perguntas.md) (admin, versão final, quem junta o trabalho, qual é o site do piloto); nada disso trava a parada 1 |
| **Última atualização** | 28/10/2026 |

## O mapa

```
                                                       ┏━━ [3] MÓDULOS DO DIA A DIA ━━━━┓
 PARTIDA ━━ [1] ORGANIZAÇÃO ━━ [2] FUNDAÇÃO ━━━━━━━━━━━╋━━ [4] PONTE COM O SITE ━━━━━━━━╋━━ [6] PILOTO ━━ 🏁 DESTINO
   ✅        E INFRA 🚂         BANCO E CASCA          ┗━━ [5] ADMIN E REGRAS ━━━━━━━━━━┛
```

- **1 e 2 são em sequência:** são os trilhos e o esqueleto que todo mundo usa.
- **3, 4 e 5 andam em paralelo**, cada uma com várias sessões, porque a parada 2 deixa o banco inteiro e a casca
  prontos.
- **6** junta tudo no piloto.
- **Onde mora o risco do prazo:** o que depende de vocês (criar contas, apontar o domínio) e o Meu site (mexe nos
  geradores de site). Por isso essas tarefas começam cedo.
- **Legenda:** ✅ feita · 🚂 o trem está aqui · ⬜ não começou. Situação de cada tarefa: no [quadro](tarefas.md).

---

## Partida: o que já existe ✅

- Página de venda por nicho, com preço, módulos, "Bom saber" e perguntas: `/exemplos` (eventos) e `/exemplos/fotografia`.
- Painéis de exemplo clicáveis (`exemplos/painel-eventos.html`, `exemplos/painel-fotografia.html`), com dados
  fictícios: **são a especificação visual de cada tela**.
- Agendas online de exemplo (`exemplos/agenda-online.html`, `exemplos/agenda-fotografia.html`).
- Preço decidido (21/10/2026).
- Experiência com Supabase + Vercel no painel interno (login, RLS, funções públicas, middleware).
- Geradores de site (`ferramentas/demo/gerar*.py`) e a conversão de demo em site do cliente (`scripts/virar-site.mjs`).

## Parada 1 · Organização e infraestrutura 🚂

**Para quê:** deixar os trilhos assentados: o endereço com login no ar e tudo pronto para várias sessões
trabalharem sem se bater.

- `painel.renderizaweb.com.br` apontado para a Vercel.
- Contas criadas pela Renderiza, com o próprio acesso de administrador, seguindo o passo a passo do [`04`](04-arquitetura.md): Supabase (projeto novo), Vercel
  (projeto novo na pasta `painel-clientes/`) e serviço de e-mail com remetente no domínio.
- Esqueleto da pasta `painel-clientes/`: casca vazia, rotas e **todos os módulos já registrados** (vazios), para
  ninguém precisar mexer em arquivo comum depois.
- Banco local para testes e a rotina das migrações (como criar, testar e quem aplica no banco real).
- Regras do trabalho em paralelo e quadro de tarefas prontos (feito em 28/10/2026).
- Tela de login mínima no ar.

**Chegou quando:** o login funciona no endereço escolhido, o e-mail de confirmação chega, e qualquer sessão consegue
pegar uma tarefa do quadro e trabalhar no seu pedaço.

## Parada 2 · Fundação: banco e casca ⬜

**Para quê:** o esqueleto que todos os módulos usam. Depois dela, os módulos andam em paralelo.
**Referência:** [`05-dados-e-permissoes.md`](05-dados-e-permissoes.md) e os exemplos.

- **O banco inteiro de uma vez:** todas as tabelas do `05`, com o cliente no centro, a RLS e os testes de
  isolamento (uma conta nunca vê a outra; "só vê" não edita; módulo desligado não aparece).
- Dados de teste (Villa Alecrim e Estúdio Ciranda) no banco local.
- **A casca:** login, cadastro com 7 dias grátis (escolhe os módulos; teste vencido entra, mas com os dados
  bloqueados e o aviso para assinar), convite da equipe, esqueci a senha, escolher a conta, menu com os
  módulos ligados (trancado para quem não tem acesso).
- **As peças comuns**, tiradas dos exemplos: layout, gaveta de detalhes, tabela, calendário, avisos e o **"Para
  quem?"** (escolher ou criar o cliente), usado em todos os módulos.
- Equipe e acessos, Configurações do negócio e Serviços (pacotes ou ensaios, horários, bloqueios).
- As palavras mudam pelo nicho (espaço/festa; estúdio/ensaio).

**Chegou quando:** numa conta de teste, o dono convida uma pessoa e dá a ela só a Agenda (só vê); ela entra pelo
celular, vê só a Agenda e não consegue editar; os testes de isolamento passam.

## Parada 3 · Módulos do dia a dia ⬜ (em paralelo)

**Para quê:** cada módulo fazendo de verdade o que o exemplo mostra, amarrado ao cliente.
**Referência:** [`02-produto.md`](02-produto.md), [`05`](05-dados-e-permissoes.md) e os exemplos.

- **Clientes** (a ficha como linha do tempo; na fotografia, as entregas).
- **Agenda** (reservas e compromissos; por data nos eventos, por horário na fotografia; campanhas com vagas).
- **Atendimento** (pedidos, etapas, "fechar" vira reserva, lista de espera).
- **Financeiro** (parcelas, sinal, dar baixa, a receber, atrasados).
- **Contratos** (modelo, link de aceite para o cliente final, registro do aceite).
- **Visão geral** (os números de cada módulo ligado).
- Em todos: exportar planilha, histórico, respeitar "só vê" e "edita".

**Chegou quando:** cada módulo faz, no painel real, tudo o que o exemplo mostra, e uma festa percorre o caminho
inteiro (pedido → cliente → reserva → contrato aceito → parcelas pagas) sem digitar nada duas vezes.

## Parada 4 · Ponte com o site ⬜ (em paralelo)

**Para quê:** o site do cliente conversar com o painel, sempre com o site de pé se o painel cair.
**Referência:** [`03-modulo-meu-site.md`](03-modulo-meu-site.md) e [`04`](04-arquitetura.md) (API pública).

- API pública no domínio do painel (o site do cliente nunca fala direto com o Supabase).
- **Agenda online:** dias ou horários livres, pedido que cai no Atendimento (cliente criado ou achado pelo
  WhatsApp), data separada na Agenda, proteção contra robô, aviso por e-mail ao dono e, se o painel não responder, a
  mensagem pronta no WhatsApp.
- **Meu site:** marcações nos geradores, script com fallback, editor no painel, prévia, publicar, histórico, voltar à
  versão inicial, desconectar e gerar a versão final.
- O site do piloto conectado (o site é dele e independente; a ligação entra quando ele quiser).

**Chegou quando:** no site de teste e no do piloto, o pedido cai no painel em segundos; uma edição publicada aparece
no site em até 1 minuto; e, com o painel desligado, o site abre normal com a versão inicial.

## Parada 5 · Painel administrativo e regras ⬜ (em paralelo)

**Para quê:** a Renderiza enxergar e controlar a plataforma, e o painel poder guardar dado de cliente com segurança.
**Referência:** [`02-produto.md`](02-produto.md) (painel administrativo) e [`06`](06-privacidade-e-seguranca.md).

- **Painel administrativo:** contas (situação, teste de 7 dias, aprovar, prazo, desligar), ligar e desligar
  módulos, marcar os módulos "só pago" (bloqueados no teste), pessoas e último acesso, pagamentos registrados à mão, indicadores gerais (só números) e entrar numa conta
  para ajudar (sempre registrado).
- **Regras:** termos de uso e política de privacidade (rascunho + revisão), aceite no primeiro acesso, backup
  semanal com um teste de restauração, revisão de segurança.

**Chegou quando:** a Renderiza cria a conta do piloto pelo admin, liga os módulos, registra um pagamento e vê os
números; um backup foi restaurado com sucesso; os termos são aceitos no primeiro acesso.

## Parada 6 · Piloto no ar ⬜

**Para quê:** o primeiro cliente real usando.

- Conta do piloto montada pelo admin: serviços, festas já marcadas, equipe e acessos.
- Site do piloto conectado (agenda online e Meu site).
- Teste de ponta a ponta no celular, seguindo um roteiro.
- Primeira semana acompanhada de perto, com as correções na hora.

**🏁 Destino alcançado quando:** o piloto usa o painel no dia a dia, com todos os módulos, sem precisar de ajuda.

## Depois do destino

Abrir o cadastro para todos, cobrança automática da mensalidade, Google Agenda, Pix integrado no financeiro, aviso
por WhatsApp, app de loja, vários espaços na mesma conta, novos nichos (odonto, lojas com catálogo). Nada disso
aparece na página de venda antes de existir (regra: nada de "em breve").

---

## Diário de bordo

Uma linha por avanço. O mais novo em cima.

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 28/10/2026 | 1 | Rodada 2 respondida: endereço `painel.renderizaweb.com.br`; a Renderiza cria as contas com o próprio acesso; o site do piloto já existe e é independente; regras do teste de 7 dias. Rodada 3 aberta (4 perguntas e juntar os documentos na `main`). | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Rodada 1 respondida: piloto de eventos, meta de 2 semanas, todos os módulos num lote só, painel administrativo com cadastro e 7 dias grátis, Pix à mão. Trilho refeito em 6 paradas; cliente no centro do banco; regras do trabalho em paralelo e quadro de tarefas criados. `renderiza.com.br` já tem dono (desde 2017). | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Perguntas resumidas numa rodada 1 de 7. Planos do Supabase e da Vercel ficam com a Renderiza. | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Documentos do produto escritos em `docs/painel-clientes/`. | Claude, a pedido da Renderiza |
