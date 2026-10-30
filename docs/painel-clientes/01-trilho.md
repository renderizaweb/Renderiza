# O trilho do Painel Renderiza

O projeto é um trem: sai da partida (o que já existe), passa por **6 paradas** e chega ao destino. Cada parada é um
**missão** com um **"chegou quando"**: só se sai dela quando o "chegou quando" é verdade. Não tem cronograma por
dia: o trem anda conforme as missões fecham. O que cada missão entrega está em [`missoes.md`](missoes.md), e as
regras para várias sessões trabalharem (em paralelo ou continuando a mesma missão), em
[`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md).

**Destino:** o piloto (um espaço de eventos) usando o Painel Renderiza no dia a dia, com **todos os módulos** num
lote só (nada parcial), a ponte com o site provada num site de teste (e ligada ao site do piloto quando ele existir
e quiser) e a Renderiza acompanhando tudo pelo Admin. Meta da
Renderiza: o piloto começar a usar por volta de **11/11/2026** (2 semanas a partir de 28/10/2026).

## Painel de bordo

| | |
|---|---|
| **Onde o trem está** | Parada 6 · Piloto (a parada 5 chegou em 30/10/2026; as 3 e 4, em 29/10/2026) |
| **Próxima ação** | Missão 6 (Piloto), que começa pela Renderiza ([`missoes.md`](missoes.md)). Da Renderiza, para a Missão 5 valer na produção (o banco já está pronto e o `contato@` é admin): religar o deploy da Vercel, os segredos do backup no GitHub e rodar o backup uma vez, e a revisão dos termos e da política por alguém de LGPD (avisos de 30/10). Da Renderiza: a chave do Brevo na função do aviso de pedido; apagar o `VERCEL_TOKEN` (Vercel e variáveis do ambiente); conferir por que os pushes não geram deploy na Vercel (aviso de 30/10); o ok para a regra no `vercel.json` da raiz; o Turnstile, quando quiser abrir o cadastro (D30); e a varredura geral e o teste do Meu site na produção, depois das próximas missões |
| **Em aberto** | nada: nenhuma pergunta pendente no [`07`](07-decisoes-e-perguntas.md) |
| **Última atualização** | 30/10/2026 |

## O mapa

```
                                                       ┏━━ [3] MÓDULOS DO DIA A DIA ✅ ━┓
 PARTIDA ━━ [1] ORGANIZAÇÃO ━━ [2] FUNDAÇÃO ━━━━━━━━━━━╋━━ [4] PONTE COM O SITE ✅ ━━━━━╋━━ [6] PILOTO 🚂 ━━ 🏁 DESTINO
   ✅        E INFRA ✅         BANCO E CASCA ✅       ┗━━ [5] ADMIN E REGRAS ✅ ━━━━━━━┛
```

- **1 e 2 são em sequência:** são os trilhos e o esqueleto que todo mundo usa.
- **3, 4 e 5 andam em paralelo**, cada uma com várias sessões, porque a parada 2 deixa o banco inteiro e a casca
  prontos.
- **6** junta tudo no piloto.
- **Onde mora o risco do prazo:** o que depende de vocês (criar contas, apontar o domínio) e o Meu site (mexe nos
  geradores de site). Por isso essas partes começam cedo.
- **Legenda:** ✅ feita · 🚂 o trem está aqui · ⬜ não começou. Situação de cada missão: em [`missoes.md`](missoes.md).

---

## Partida: o que já existe ✅

- Página de venda por nicho, com preço, módulos, "Bom saber" e perguntas: `/exemplos` (eventos) e `/exemplos/fotografia`.
- Painéis de exemplo clicáveis (`exemplos/painel-eventos.html`, `exemplos/painel-fotografia.html`), com dados
  fictícios: **são a especificação visual de cada tela**.
- Agendas online de exemplo (`exemplos/agenda-online.html`, `exemplos/agenda-fotografia.html`).
- Preço decidido (21/10/2026).
- Experiência com Supabase + Vercel no painel de prospecção (login, RLS, funções públicas, middleware).
- Geradores de site (`ferramentas/demo/gerar*.py`) e a conversão de demo em site do cliente (`scripts/virar-site.mjs`).

## Parada 1 · Organização e infraestrutura ✅

**Para quê:** deixar os trilhos assentados: o endereço com login no ar e tudo pronto para várias sessões
trabalharem sem se bater.

- `painel.renderizaweb.com.br` apontado para a Vercel.
- Contas criadas pela Renderiza, com o próprio acesso de administrador, seguindo o passo a passo do [`04`](04-arquitetura.md): Supabase (conta nova com dois projetos: produção e STG), Vercel
  (projeto novo na pasta `painel-clientes/`) e serviço de e-mail com remetente no domínio.
- Esqueleto da pasta `painel-clientes/`: casca vazia, rotas e **todos os módulos já registrados** (vazios), para
  ninguém precisar mexer em arquivo comum depois.
- Banco local para testes e a rotina das migrações (como criar, testar e quem aplica no banco real).
- Regras do trabalho em várias sessões e as missões prontas (feito em 28/10/2026).
- Tela de login mínima no ar.

**Chegou quando:** o login funciona no endereço escolhido, o e-mail de confirmação chega, e uma migração de teste
passou pelo STG e pela produção. **Chegou em 29/10/2026** (o que ficou de pé: Missão 1 em [`missoes.md`](missoes.md)).

## Parada 2 · Fundação: banco e casca ✅

**Para quê:** o esqueleto que todos os módulos usam. Depois dela, os módulos andam em paralelo.
**Referência:** [`05-dados-e-permissoes.md`](05-dados-e-permissoes.md), [`09-ux.md`](09-ux.md) e os exemplos.

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
- **Onboarding** (`09`): 5 telas rápidas no cadastro e os "Primeiros passos" no Início, com a importação das datas
  já marcadas.

**Chegou quando:** numa conta de teste, o dono convida uma pessoa e dá a ela só a Agenda (só vê); ela entra pelo
celular, vê só a Agenda e não consegue editar; os testes de isolamento passam.

## Parada 3 · Módulos do dia a dia ✅ (em paralelo)

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

## Parada 4 · Ponte com o site ✅ (em paralelo)

**Para quê:** o site do cliente conversar com o painel, sempre com o site de pé se o painel cair.
**Referência:** [`03-modulo-meu-site.md`](03-modulo-meu-site.md) e [`04`](04-arquitetura.md) (API pública).

- API pública no domínio do painel (o site do cliente nunca fala direto com o Supabase).
- **Agenda online:** dias ou horários livres, pedido que cai no Atendimento (cliente criado ou achado pelo
  WhatsApp), data separada na Agenda, proteção contra robô, aviso por e-mail ao dono e, se o painel não responder, a
  mensagem pronta no WhatsApp.
- **Meu site:** marcações nos geradores, script com fallback, editor no painel, prévia, publicar, histórico, voltar à
  versão inicial, desconectar e gerar a versão final.
- Um site de teste, gerado de uma demo de eventos, ligado ao painel. O piloto ainda não tem site; quando tiver e
  quiser, o mesmo vale para ele (o site é dele e independente).

**Chegou quando:** no site de teste, o pedido cai no painel em segundos; uma edição publicada aparece
no site em até 1 minuto; e, com o painel desligado, o site abre normal com a versão inicial.

**Situação (29/10/2026):** as três provas passaram no STG (Missão 4, blocos A, B e C), e o banco e a função do aviso
estão na produção. Falta: a chave do Brevo na função do aviso e subir a tela do Meu site para a `main` junto com a
Missão 2, bloco B (ver a nota de passagem do bloco C em [`missoes.md`](missoes.md)). Desconectar fica no Admin
(Parada 5).

## Parada 5 · Admin e regras ✅ (em paralelo)

**Para quê:** a Renderiza enxergar e controlar a plataforma, e o painel poder guardar dado de cliente com segurança.
**Referência:** [`02-produto.md`](02-produto.md) (Admin) e [`06`](06-privacidade-e-seguranca.md).

- **Admin:** contas (situação, teste de 7 dias, aprovar, prazo, desligar), ligar e desligar
  módulos, marcar os módulos "só pago" (bloqueados no teste), pessoas e último acesso, pagamentos registrados à mão, indicadores gerais (só números) e entrar numa conta
  para ajudar (sempre registrado).
- **Regras:** termos de uso e política de privacidade (rascunho + revisão), aceite no primeiro acesso, backup
  semanal com um teste de restauração, revisão de segurança.

**Chegou quando:** a Renderiza cria a conta do piloto pelo admin, liga os módulos, registra um pagamento e vê os
números; um backup foi restaurado com sucesso; os termos são aceitos no primeiro acesso.

**Situação (30/10/2026):** as três provas passaram no STG (Missão 5, blocos A e B, na `main`): uma conta criada pelo
Admin, com módulos, Pix e números; um backup do STG restaurado inteiro num banco vazio; os termos aceitos no primeiro
acesso. O banco da produção já tem a Missão 5 inteira, e o `contato@` está na equipe Renderiza de lá. Falta o
que é da Renderiza: o deploy da Vercel voltar a andar (a tela do Admin e a dos termos ainda não estão no ar), os
segredos do backup no GitHub (e rodar uma vez) e a revisão dos termos por alguém de LGPD (ver "Avisos" em
[`missoes.md`](missoes.md)).

## Parada 6 · Piloto no ar 🚂

**Para quê:** o primeiro cliente real usando.

- Conta do piloto montada pelo admin: serviços, festas já marcadas, equipe e acessos.
- Se o site do piloto já existir e ele quiser: agenda online e Meu site ligados.
- Teste de ponta a ponta no celular, seguindo um roteiro.
- Primeira semana acompanhada de perto, com as correções na hora.

**🏁 Destino alcançado quando:** o piloto usa o painel no dia a dia, com todos os módulos, sem precisar de ajuda.

**Situação (30/10/2026):** o piloto é a própria Renderiza, simulando com mais uma pessoa
([`roteiro-do-piloto.md`](roteiro-do-piloto.md)). A parte da sessão anda: o fluxo de ponta a ponta roda sozinho no
STG (`npm run fluxos`: a conta criada pelo Admin, as datas trazidas, as 5 tarefas do `09`, o aceite do contrato, a
equipe "só vê", o Admin), a varredura passa por todas as telas, e a produção é conferida depois de cada deploy, só
leitura (`npm run conferir-producao`). Falta a Renderiza rodar o roteiro e mandar o que travou.

## Depois do destino

Abrir o cadastro para todos, cobrança automática da mensalidade, Google Agenda, Pix integrado no financeiro, aviso
por WhatsApp, app de loja, vários espaços na mesma conta, novos nichos (odonto, lojas com catálogo). Nada disso
aparece na página de venda antes de existir (regra: nada de "em breve").

---

## Diário de bordo

Uma linha por avanço. O mais novo em cima.

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 30/10/2026 | 5 | **Missão 5 no banco da produção** (com o "pode" da Renderiza): as duas migrações aplicadas e conferidas; `contato@renderizaweb.com.br` na equipe Renderiza. O backup no GitHub espera os segredos sem ficar vermelho. A tela segue esperando o deploy da Vercel voltar a andar. | Claude, a pedido da Renderiza |
| 30/10/2026 | 5 | **Missão 5, bloco B (Regras) feito, e com ele a Missão 5**, na `main`: termos de uso e política de privacidade (rascunhos para revisão) em `/termos` e `/privacidade`, o aceite no primeiro acesso, o backup semanal cifrado com o teste de restauração (GitHub Actions) e a revisão de segurança (o visitante só executa as funções públicas). Backup do STG restaurado num banco vazio. Falta, da Renderiza: o "pode" para as migrações, os segredos do backup no GitHub, a revisão dos termos. | Claude, a pedido da Renderiza |
| 30/10/2026 | 5 | **Missão 5, bloco A (Admin) feito**, na `main`: contas (aprovar, prazo, desligar, religar, criar à mão com o convite do dono), módulos e "só pago", pessoas e entradas, pagamentos por Pix, indicadores, entrar para ajudar e exportar a pedido (com registro). Testado no STG. Falta, da Renderiza: quem é admin na produção e o "pode" para a migração. | Claude, a pedido da Renderiza |
| 29/10/2026 | 3 e 4 | **Paradas 3 e 4 chegaram.** O bloco F da Missão 3 (Início e exportar), que parou no limite da sessão dele, foi terminado e subido pela sessão da Missão 4, junto com o editor do Meu site. Tudo na `main`, conferido de ponta a ponta no STG como dono. A semente da Villa ganhou o site de teste e o Meu site. Próxima: a Missão 5. | Claude, com o ok da Renderiza |
| 29/10/2026 | 3 | **Missão 3, bloco A (Clientes) feito**, na `main` (a produção espera o deploy destravar): a lista pela situação, a ficha como linha do tempo, juntar e arquivar, e as entregas das fotos na fotografia. Testado no STG. | Claude, a pedido da Renderiza |
| 29/10/2026 | 3 | **Missão 3, bloco D (Financeiro) feito**, na `main` (a produção espera o deploy destravar): os números do mês, as parcelas com "Recebi" e desfazer, o lembrete no WhatsApp, a festa com "Lançar parcelas", registrar pagamento, o mês a mês e o que mais vende. Testado no STG. | Claude, a pedido da Renderiza |
| 29/10/2026 | 3 | **Missão 3, bloco E (Contratos) feito**, na `main` (a produção espera o deploy destravar; o banco do aceite já está na produção): o contrato sai do modelo com os dados da festa, vai por link, o cliente lê e aceita no celular e o painel guarda quem, quando, IP e aparelho; depois do aceite, os dados do Pix. Testado no STG. | Claude, a pedido da Renderiza |
| 29/10/2026 | 3 | **Missão 3, bloco B (Agenda) feito**, na `main` (a produção espera o deploy destravar): a semana e o mês, o painel do dia, a gaveta da festa com o checklist, reservar com o aviso de conflito de horário, os compromissos, os horários livres da fotografia e o quadro das campanhas com o texto do Stories. Testado no STG. | Claude, a pedido da Renderiza |
| 29/10/2026 | 3 | Missão 3, bloco B (Agenda) começou, na mesma branch. | Claude, a pedido da Renderiza |
| 29/10/2026 | 3 | **Missão 3, bloco C (Atendimento) feito**, na `main` (a produção espera o deploy da Vercel destravar): a lista primeiro, o quadro por etapa no computador (arrastar com desfazer), a gaveta do pedido, anotar em poucos toques, "Fechar" vira reserva (confirmando a pré-reserva da agenda online), a lista de espera da fotografia e o pedido novo em tempo real. Testado no STG. | Claude, a pedido da Renderiza |
| 29/10/2026 | 3 | Missão 3 começou pelo bloco C (Atendimento), na branch `claude/painel-renderiza-setup-ztnrzy`. | Claude, a pedido da Renderiza |
| 29/10/2026 | 2 | Onboarding refeito como um trilho, a pedido da Renderiza (D33): boas-vindas com o roteiro, escolha que segue sozinha com check, a cor do nicho na tela, a pergunta "Você já tem site?" e "Montando o seu painel". Na produção. O `/api/config` passou a dizer o commit no ar (`versao`), depois de um deploy que não entrou sozinho. | Claude, a pedido da Renderiza |
| 29/10/2026 | 2 → 3, 4, 5 | **Parada 2 chegou (Missão 2 feita).** Bloco B (telas base) na `main`: casca, escolher a conta, convite (função do Supabase), cadastro com verificação contra robô (fecha até a Renderiza criar o Turnstile), onboarding de 5 telas, primeiros passos com a importação das datas, Equipe, Configurações e Serviços. O "chegou quando" testado no STG: um dono passou pelo onboarding, convidou uma pessoa só com a Agenda (só vê), ela entrou pelo celular, viu só a Agenda e o banco não a deixou editar; os testes de isolamento passam no local e no STG. A função do convite foi para a produção no mesmo dia, com o ok da Renderiza. | Claude, a pedido da Renderiza |
| 29/10/2026 | 4 | Missão 4 na produção, com o "pode" da Renderiza: as 3 migrações (agenda online, aviso de pedido e Meu site) e a função `avisar-pedido`; conferido só lendo, no banco e na API do endereço oficial. Falta a chave do Brevo na função. | Claude, com o ok da Renderiza |
| 29/10/2026 | 4 | **Missão 4, bloco C (Meu site no painel), pronta:** o servidor (versão publicada, prévia e fotos pela API) na `main` e no STG; o editor (partes do site, fotos, rascunho, prévia, publicar, versões, voltar ao entregue) na branch, em cima da Missão 2B, que ainda não terminou: sobe com ela. Conferido de ponta a ponta no STG: a edição publicada aparece no site de teste. Com isso, as três provas da Parada 4 passaram no STG; falta a produção. | Claude, a pedido da Renderiza |
| 29/10/2026 | 4 | **Missão 4, bloco A (API pública e agenda online), na `main` e no STG:** os dias livres e o pedido com pré-reserva de 48 horas pelo banco, a API na Vercel, a página `/agenda/` no site do cliente (com a cara do site e WhatsApp quando o painel não responde) e o aviso ao dono por e-mail. Conferido de ponta a ponta no STG. Falta o ok para a produção e a chave do Brevo na função. | Claude, a pedido da Renderiza |
| 29/10/2026 | 4 | Missão 4, bloco B, juntado na `main` com o ok da Renderiza. O bloco A (API pública e agenda online) começa na mesma sessão e branch; o C vem depois dele. | Claude, com o ok da Renderiza |
| 29/10/2026 | 4 | **Missão 4, bloco B (Meu site no site), pronta para subir**, em paralelo com a Missão 2 (não depende do banco): contrato v1 fechado no `03`, o script com a versão inicial sempre de pé, as marcações nos geradores de eventos (visual das demos idêntico, pixel a pixel), o `virar-site.mjs` com o código do site, a versão final e um site de teste fictício, com 15 testes. | Claude, a pedido da Renderiza |
| 29/10/2026 | 2 | Missão 2, bloco A (banco), juntado na `main`. O bloco B (telas base) começa na mesma sessão e branch. | Claude, com o ok da Renderiza |
| 29/10/2026 | 2 | Missão 2, bloco A (banco), pronto para subir: o banco inteiro do `05` (34 tabelas com RLS, `pode()`, histórico automático, Storage) em 6 migrações, aplicadas no STG e na produção, com os testes de isolamento passando no local e no STG; a semente (Villa Alecrim e Estúdio Ciranda) no STG. O bloco B (telas) pode começar. | Claude, a pedido da Renderiza |
| 29/10/2026 | 1 → 2 | **Parada 1 fechada (Missão 1 feita).** Cadastro pela API fechado também na produção, com o ok da Renderiza; a Renderiza conferiu o login numa prévia da Vercel (STG), com troca de senha (a prévia pede login na Vercel). O trem segue para a Parada 2: a Missão 2 pode começar. | Renderiza, com o Claude |
| 29/10/2026 | 1 | A Renderiza conferiu na produção: entrar, sair, "Esqueci a senha" e senha nova pelo e-mail em português. O cadastro pela API, que estava aberto a qualquer um, foi fechado no repositório e no STG; a produção espera o ok. | Renderiza, com o Claude |
| 29/10/2026 | 1 | E-mail pelo Brevo: domínio autenticado no DNS (DKIM e DMARC), SMTP nos dois projetos e os 5 e-mails do login em português aplicados no STG e na produção; um e-mail de verdade saiu pelo STG. Junto, a configuração do login pelo repositório foi para a `main`. Falta a Renderiza conferir na produção. | Renderiza, com o Claude |
| 29/10/2026 | 1 | Login (Auth) dos dois projetos configurado pelo repositório (`scripts/auth.mjs`): endereço do painel, endereços de retorno e senha mínima de 8, conferidos lendo de volta e na prática. Os 5 e-mails do login em português ficaram prontos (`supabase/emails/`), mas o Supabase grátis só aceita e-mail próprio com SMTP próprio: entram com o Brevo. Pronto para subir na branch `claude/clever-albattani-u37i0u`. | Claude, a pedido da Renderiza |
| 29/10/2026 | 1 | `painel.renderizaweb.com.br` no ar (CNAME no Registro.br para a Vercel, HTTPS ok). Falta da Missão 1: o Auth pela API e o Brevo. | Renderiza, com o Claude |
| 29/10/2026 | 1 | Vercel no ar em `renderiza-painel-clientes.vercel.app` (as rotas davam 404: `cleanUrls` desligado). Design system (`10`, `src/ui/`) e telas de entrar, esqueci a senha e nova senha refeitas com a cara da Renderiza. Os exemplos seguem com dados fictícios. | Claude, a pedido da Renderiza |
| 29/10/2026 | 1 | Parte do Claude da Missão 1 juntada na `main` (branch `claude/clever-albattani-u37i0u`). Missão 2 liberada. O Auth dos projetos passa a ser feito por uma sessão pela API, depois da Vercel; o Brevo fica para antes do piloto. | Claude, a pedido da Renderiza |
| 29/10/2026 | 1 | Supabase em São Paulo (`sa-east-1`): a Renderiza apagou os projetos dos EUA (produção `wkwyhganenohmupcwthd`, STG `vzrmepxoigoszqtoxtlo`) e criou produção `hxzsiiqhlqxuqkevskwb` e STG `qxcxllhmtodsptxffbhx`, com as variáveis `PAINEL_*` atualizadas. A sessão conferiu as variáveis e os projetos pela API, reaplicou a migração de teste no STG e depois na produção e trocou o `ignoreCommand` do `vercel.json` (compara com o último deploy). Parte da sessão de novo pronta para subir, na branch `claude/clever-albattani-u37i0u`. | Renderiza e Claude |
| 29/10/2026 | 1 | Missão 1, parte da sessão, pronta para subir: `painel-clientes/` com o esqueleto (todos os módulos e o Admin registrados), banco local e `scripts/migrar.mjs`; migração de teste aplicada no STG e na produção; login funcionando no servidor local contra o STG. Os projetos do Supabase estão nos EUA, não em São Paulo (aviso em `missoes.md`). | Claude, a pedido da Renderiza |
| 29/10/2026 | 1 | E-mail `contato@renderizaweb.com.br` no Zoho (MX no Registro.br) e Supabase novo criado com ele: produção `wkwyhganenohmupcwthd` e STG `vzrmepxoigoszqtoxtlo` (nos EUA; apagados e recriados em São Paulo no mesmo dia, ver acima). | Renderiza, com o Claude |
| 28/10/2026 | 1 | O trabalho passou de tarefas para 6 missões, uma por parada (`missoes.md`), com o texto pronto para abrir cada sessão. Acesso das sessões ao Supabase novo pelas variáveis `PAINEL_*` do ambiente. | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Pesquisa de UX: `09-ux.md` (princípios, melhorias em cada tela do exemplo, onboarding de 5 telas, peças comuns, velocidade, referências). Nova tarefa T2.8 (onboarding). | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Supabase do Painel Renderiza numa conta nova, com produção e STG; o projeto de hoje fica só com o Painel de prospecção. Nomes fixados: Painel de prospecção, Painel Renderiza e Admin. | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Rodada 3 respondida: admin, valores de proposta e como subir são operação da Renderiza; cada sessão aplica as próprias migrações com as regras do `08`; o piloto ainda não tem site (a ponte é provada num site de teste). Sem perguntas em aberto. Documentos juntados na `main`. | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Rodada 2 respondida: endereço `painel.renderizaweb.com.br`; a Renderiza cria as contas com o próprio acesso; o site do piloto já existe e é independente; regras do teste de 7 dias. Rodada 3 aberta (4 perguntas e juntar os documentos na `main`). | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Rodada 1 respondida: piloto de eventos, meta de 2 semanas, todos os módulos num lote só, Admin com cadastro e 7 dias grátis, Pix à mão. Trilho refeito em 6 paradas; cliente no centro do banco; regras do trabalho em paralelo e quadro de tarefas criados. `renderiza.com.br` já tem dono (desde 2017). | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Perguntas resumidas numa rodada 1 de 7. Planos do Supabase e da Vercel ficam com a Renderiza. | Claude, a pedido da Renderiza |
| 28/10/2026 | 1 | Documentos do produto escritos em `docs/painel-clientes/`. | Claude, a pedido da Renderiza |
