# Missões

O trabalho anda por **6 missões, uma por parada do [trilho](01-trilho.md)**. Uma missão é o que se entrega a uma
sessão do Claude ("sua missão é a Missão 2"). As missões 3, 4 e 5 andam ao mesmo tempo e, para acelerar, podem ser
divididas em mais de uma sessão pelos **blocos** de cada uma. As regras de como as sessões trabalham (e continuam o
trabalho umas das outras) estão em [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md).

## Situação

| Missão | Parada | Quem | Situação | Sessão / branch |
|---|---|---|---|---|
| 1 · Trilhos | 1 | você + 1 sessão | **feita** (29/10/2026): tudo no ar, na `main` e conferido na produção e numa prévia | — |
| 2 · Fundação | 2 | 1 sessão (ou 2: banco e telas) | **em andamento**: bloco A (banco) desde 29/10; bloco B livre | A: `claude/painel-renderiza-setup-ztnrzy` |
| 3 · Módulos | 3 | 1 a 6 sessões (uma por bloco) | esperando a 2 | |
| 4 · Ponte com o site | 4 | 1 a 3 sessões | esperando a 2 | |
| 5 · Admin e regras | 5 | 1 a 2 sessões | esperando a 2 | |
| 6 · Piloto | 6 | você + 1 sessão | esperando a 3, 4 e 5 | |

**Situação:** `esperando` · `em andamento` · `pronta para subir` (a Renderiza junta na `main`) · `feita` · `travada`
(diga por quê em "Avisos"). Os caminhos de "Mexe em" são dentro de `painel-clientes/`, menos os que começam pela raiz.

**Para colar ao abrir uma sessão:** o texto completo está em [`prompt-de-sessao.md`](prompt-de-sessao.md). A versão curta:

> Leia `docs/painel-clientes/README.md`, o `08-trabalho-em-paralelo.md` e o `missoes.md`. Sua missão é a Missão N
> (bloco X, se houver).

---

## Missão 1 · Trilhos

**Para quê:** os acessos e a base no ar, para as outras missões terem onde trabalhar.

**Feita em 29/10/2026.** O que ficou de pé (detalhes no [`04`](04-arquitetura.md)):

- **E-mail:** `contato@renderizaweb.com.br` no Zoho (recebe; MX no Registro.br) e o Brevo (envia; domínio
  autenticado no DNS e SMTP nos dois projetos do Supabase, remetente `nao-responda@renderizaweb.com.br`).
- **Supabase** (conta nova, São Paulo): produção `hxzsiiqhlqxuqkevskwb` e STG `qxcxllhmtodsptxffbhx` (os primeiros,
  criados nos EUA, foram apagados). As sessões entram pelas variáveis `PAINEL_*` (item 3).
- **Login (Auth) configurado pelo repositório** (`scripts/auth.mjs`, valores em `scripts/lib/auth.mjs`): endereços,
  senha mínima de 8, confirmação de e-mail, os 5 e-mails do login em português (`supabase/emails/`) e o cadastro
  pela API **fechado** até a tela de cadastro com verificação contra robô (Missão 2, bloco B; ver "Avisos").
- **Vercel:** `https://painel.renderizaweb.com.br` (e `renderiza-painel-clientes.vercel.app`) na produção; cada
  branch ganha uma prévia ligada ao STG. **Abrir uma prévia pede login na Vercel**: as sessões não abrem, testam no
  `localhost:5180` contra o STG; quem confere a prévia é a Renderiza.
- **Código na `main`:** o esqueleto (todos os módulos e o Admin registrados, vazios), o banco local e
  `scripts/migrar.mjs`, o design system (`src/ui/`) e as telas de entrar, esqueci a senha e nova senha.
- **Conferido pela Renderiza:** na produção, entrar, sair, "Esqueci a senha" e a senha nova pelo e-mail em
  português; numa prévia (STG), o mesmo com troca de senha. Uma migração de teste passou pelo STG e pela produção.
- **Usuários:** na produção, só o `contato@` (da Renderiza, criado à mão). No STG, o `contato@`, do teste do e-mail;
  os usuários de teste a Missão 2 cria com a semente.

O passo a passo que a Renderiza seguiu (fica para referência):

1. Um e-mail só para tudo: `contato@renderizaweb.com.br`, numa caixa grátis do **Zoho Mail** (plano Forever Free).
   É o e-mail que os clientes recebem e o dono das contas abaixo. Os registros que o Zoho pedir vão no DNS do
   `renderizaweb.com.br`. O registro que começa com `v=spf1` só pode existir uma vez no domínio: o do Zoho e o do
   serviço de envio (item 4) ficam juntos numa linha só.
2. Supabase: conta nova com esse e-mail e os dois projetos, `painel-renderiza-prod` e `painel-renderiza-stg` (região
   São Paulo). Não entrar nessa conta como dono ou admin com o login de hoje.
3. Dar às sessões o acesso ao Supabase novo: nas configurações do ambiente do Claude (menu do ambiente na barra de
   título da sessão → Editar), criar as variáveis abaixo. Nunca colar chave ou senha no chat. As variáveis de hoje
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) continuam sendo do Painel de prospecção.

   | Variável | O que é |
   |---|---|
   | `PAINEL_SUPABASE_ACCESS_TOKEN` | token de acesso da conta nova do Supabase (*Account → Access Tokens*): é o que deixa a sessão aplicar migrações no STG e na produção |
   | `PAINEL_STG_SUPABASE_URL` e `PAINEL_STG_SUPABASE_ANON_KEY` | endereço e chave **pública** do STG |
   | `PAINEL_PROD_SUPABASE_URL` e `PAINEL_PROD_SUPABASE_ANON_KEY` | endereço e chave **pública** da produção |

4. Envio automático do painel pelo **Brevo** (plano grátis, conta criada com `contato@renderizaweb.com.br`):
   adicionar o domínio `renderizaweb.com.br` no Brevo, pôr no DNS os registros que ele mostrar e copiar os dados de
   SMTP para os dois projetos do Supabase (*Authentication → SMTP*), com remetente
   `nao-responda@renderizaweb.com.br`, nome "Painel Renderiza" e respostas para `contato@`. **Feito em 29/10/2026**
   (no STG, o nome é "Painel Renderiza (Teste)"); o que ficou configurado está no `04`, em E-mail.
5. Depois que a sessão criar a pasta: projeto novo na Vercel (pasta `painel-clientes`, chaves da produção em
   *Production* e do STG em *Preview*) e o `painel.renderizaweb.com.br` apontado para ela.

**Parte do Claude** (1 sessão; pode começar já, sem esperar a sua parte):

- A pasta `painel-clientes/` com o esqueleto: casca vazia, rotas, **todos os módulos e o Admin já registrados
  (vazios)**, adaptador do Supabase, `vercel.json`, testes rodando.
- Banco local para os testes (Postgres 16 do ambiente) e o script das migrações: testa no local → aplica no STG →
  aplica na produção, lendo as variáveis acima.
- Tela de login mínima.

**Mexe em:** `index.html`, `src/app.js`, `src/rotas.js`, `src/modulos/index.js`, `src/admin/index.js`,
`src/adaptadores/`, `src/sessao.js`, `src/telas/entrar.js`, `supabase/`, `scripts/`, `test/`, `vercel.json`.

**Pronta quando:** o login funciona em `painel.renderizaweb.com.br` (produção) e numa prévia da Vercel (STG); o
e-mail de confirmação chega; uma migração de teste passou pelo STG e pela produção.

## Missão 2 · Fundação

**Para quê:** o banco inteiro e as telas base. Depois dela, as missões 3, 4 e 5 andam em paralelo.
**Referência:** [`05`](05-dados-e-permissoes.md), [`09`](09-ux.md) e os exemplos.

**Bloco A · Banco**
- Todas as tabelas do `05` de uma vez, com o cliente no centro; a RLS (cada conta isolada, "só vê" e "edita",
  módulo desligado, teste vencido) e os testes de isolamento.
- A semente de teste (Villa Alecrim e Estúdio Ciranda, dos arquivos de `exemplos/`) no local e no STG, nunca na
  produção.
- **Mexe em:** `supabase/migrations/`, `supabase/testes/`, `supabase/semente/`.

**Bloco B · Telas base**
- **Já feito (29/10/2026):** o design system (`src/ui/`, ver [`10`](10-design-system.md)) e as telas de entrar,
  esqueci a senha e nova senha. O bloco B usa e amplia esse padrão (não começa outro).
- A casca: cadastro com 7 dias grátis, convite da equipe, escolher a conta, menu com os módulos ligados (trancado
  sem acesso), aviso de teste vencido, todos com o layout `src/telas/acesso.js` quando forem telas de acesso.
- As peças comuns do `09`: barra de baixo e menu lateral, "+" ações rápidas, **"Para quem?"**, detalhes, filtros,
  desfazer, WhatsApp num toque, estados (vazio, erro, carregando), formulários, Ctrl+K, exportar CSV; as palavras
  por nicho.
- O onboarding do `09` (5 telas) e os "Primeiros passos" no Início, com a importação das datas já marcadas.
- Equipe e acessos, Configurações do negócio e Serviços (pacotes ou ensaios, adicionais, horários, bloqueios,
  campanhas).
- **Cadastro e convite** dependem do servidor e de chaves que a Renderiza põe (ver "Avisos", 29/10): o cadastro
  está fechado pela API até existir a verificação contra robô.
- **Mexe em:** `src/sessao.js`, `src/telas/`, `src/ui/` (inclusive `src/ui/estilo.css`), `src/nichos/`, `src/modulos/equipe/`,
  `src/modulos/configuracoes/`, `src/modulos/servicos/`, `src/modulos/inicio/primeiros-passos.js`; em
  `scripts/lib/auth.mjs` e `supabase/emails/`, só o que o cadastro e o convite pedirem (aplicando com
  `scripts/auth.mjs`, STG primeiro); a função do servidor do convite, onde a sessão decidir (registrado no `07`).

**Pronta quando:** numa conta de teste no STG, o dono passa pelo onboarding, convida uma pessoa só com a Agenda (só
vê), e ela entra pelo celular, vê só a Agenda e não consegue editar; os testes de isolamento passam.

## Missão 3 · Módulos

**Para quê:** cada módulo fazendo de verdade o que o exemplo mostra, amarrado ao cliente e com as melhorias do `09`.
Uma sessão faz tudo ou cada bloco vai para uma sessão.

| Bloco | O que entrega | Mexe em |
|---|---|---|
| A · Clientes | lista com a situação, ficha como linha do tempo, juntar clientes, arquivar; entregas na fotografia | `src/modulos/clientes/` |
| B · Agenda | reservas e compromissos, semana + lista no celular, mês, por horário na fotografia, conflito de horário, campanhas com vagas | `src/modulos/agenda/` |
| C · Atendimento | lista primeiro, etapas, quadro em colunas no computador, anotar pedido em poucos toques, "fechar" vira reserva, lista de espera | `src/modulos/atendimento/` |
| D · Financeiro | parcelas, sinal, dar baixa (com desfazer), a receber, atrasados, total do mês | `src/modulos/financeiro/` |
| E · Contratos | modelos com campos, link de aceite (resumo → aceite → dados do Pix), registro do aceite, versão para imprimir | `src/modulos/contratos/`, `publico/contrato/` |
| F · Início e exportar | "Para fazer agora", números de cada módulo, "o que a equipe fez", exportar tudo (zip) | `src/modulos/inicio/`, `src/telas/exportar.js` |

**Pronta quando:** no STG, uma festa vai do pedido ao contrato aceito e às parcelas pagas sem digitar nada duas
vezes, e cada módulo faz o que o exemplo mostra.

## Missão 4 · Ponte com o site

**Para quê:** o site do cliente conversar com o painel, sempre de pé se o painel cair.
**Referência:** [`03`](03-modulo-meu-site.md) e [`04`](04-arquitetura.md) (API pública).

| Bloco | O que entrega | Mexe em |
|---|---|---|
| A · API e agenda online | API pública (código do site, saúde, limites, antirrobô), disponibilidade, pedido que acha ou cria o cliente, aviso por e-mail, fallback para o WhatsApp, a peça da agenda nos geradores | `api/publico/`, raiz `ferramentas/demo/agenda-online/` |
| B · Meu site no site | contrato de conteúdo v1, marcações `data-rz` nos geradores, script com fallback, `virar-site.mjs` com o código da conta, versão final | raiz `ferramentas/demo/gerar*.py`, raiz `ferramentas/meu-site/`, raiz `scripts/virar-site.mjs`, raiz `scripts/versao-final.mjs` |
| C · Meu site no painel | editor por seção, imagens, rascunho, prévia, publicar, histórico, voltar à versão inicial, desconectar | `src/modulos/meu-site/`, `api/publico/site/` |

Tudo provado num **site de teste** gerado de uma demo de eventos (`test/site-teste/`); quando o site do piloto
existir e ele quiser, o mesmo vale para ele.

**Pronta quando:** no site de teste, o pedido cai no painel em segundos, uma edição publicada aparece em até 1
minuto, e com o painel desligado o site abre normal com a versão inicial.

## Missão 5 · Admin e regras

**Para quê:** a Renderiza enxergar e controlar a plataforma, com segurança.
**Referência:** [`02`](02-produto.md) (Admin) e [`06`](06-privacidade-e-seguranca.md).

| Bloco | O que entrega | Mexe em |
|---|---|---|
| A · Admin | contas (situação, teste, aprovar, prazo, desligar, criar à mão), módulos (ligar, desligar, "só pago"), pessoas e entradas, pagamentos por Pix, indicadores (só números), entrar na conta para ajudar e exportar a pedido (com registro) | `src/admin/` |
| B · Regras | termos de uso e política de privacidade (rascunho para revisão) e o aceite no primeiro acesso; backup semanal da produção com um teste de restauração; revisão de segurança (RLS, funções públicas, chaves, cabeçalhos, uploads) | `publico/termos/`, `publico/privacidade/`, raiz `.github/workflows/backup-painel.yml` |

**Pronta quando:** a Renderiza cria a conta do piloto pelo Admin, liga os módulos, registra um pagamento e vê os
números; um backup foi restaurado com sucesso; os termos são aceitos no primeiro acesso.

## Missão 6 · Piloto

**Para quê:** o primeiro cliente real usando.

- Você: combinar com o piloto e montar a conta dele pelo Admin (serviços, festas já marcadas, equipe).
- Sessão: roteiro de teste de ponta a ponta (Playwright e no celular), o teste das 5 tarefas do `09` com 3 pessoas e
  as correções; acompanhar a primeira semana e registrar os ajustes no diário de bordo.
- **Mexe em:** `test/fluxos/` e o que as correções pedirem (avisar no quadro).

**🏁 Destino:** o piloto usa o painel no dia a dia, com todos os módulos, sem precisar de ajuda.

---

## Notas de passagem

Uma por missão (ou bloco) em andamento, para outra sessão continuar sem refazer nada. Atualize junto com os commits;
apague quando ficar `feita`.

```
Missão N · bloco X · branch claude/xxxx · atualizada em dd/mm hh:mm
Feito: …
Falta: …
Próximo passo: …
Decisões no caminho: …
Migrações aplicadas (STG / produção): …
```

```
Missão 2 · bloco A (banco) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · EM ANDAMENTO
Feito (no repositório, testado no banco local): 4 migrações em painel-clientes/supabase/migrations/
  20261029110000_contas_e_acesso (modulos, contas, pessoas, convites, contas_modulos, equipe_renderiza,
    acessos_suporte, termos_aceites; pode(), pode_algum(), minhas_contas(), cadastrar_conta(), aceitar_convites())
  20261029110100_negocio_e_dia_a_dia (tipos_reserva, servicos, adicionais, horarios, bloqueios, campanhas, clientes,
    clientes_fichas, pedidos, reservas, reservas_adicionais, reservas_valores, reservas_checklist, compromissos,
    lista_espera, parcelas, modelos_contrato, contratos, entregas; situacao(cliente), fechar_pedido(), juntar_clientes())
  20261029110200_historico_site_e_admin (atividades por gatilho, sites, sites_versoes, sites_previas, entradas,
    pagamentos, erros_front; registrar_entrada(), admin_indicadores(); pedidos no tempo real)
  20261029110300_armazenamento (buckets logos, site-imagens, privado e as políticas)
  Testes em supabase/testes/010, 020, 030 e 090 (isolamento em todas as tabelas, só vê × edita, valores escondidos,
  teste vencido, módulo desligado, "só pago", suporte, convite, cadastro, histórico, Meu site, Admin, arquivos e as
  regras gerais: RLS em tudo, anon sem tabela, search_path fixo).
Falta: a semente no STG (no local já roda: node supabase/semente/semente.mjs local); produção; atualizar o 05.
Próximo passo: node supabase/semente/semente.mjs stg.
Decisões no caminho: ver "Avisos" (bloco A) quando a parte estiver pronta.
Migrações aplicadas (STG / produção): as 6 no STG em 29/10 (testes do banco passam lá: node supabase/testes/no-stg.mjs); produção ainda não.
```

```
Missão 1 · parte do Claude (Auth) · branch claude/clever-albattani-u37i0u (recomeçada da main) · atualizada em 29/10 · NA MAIN
Antes (já na main): esqueleto, banco local, scripts/migrar.mjs, migração de teste no STG e na produção, design system
  e telas de acesso.
Feito: o login (Auth) dos dois projetos no repositório e aplicado pela API de gerenciamento.
  scripts/auth.mjs (situação, stg, producao --projeto <ref>, previa) com a configuração em scripts/lib/auth.mjs:
  site_url (produção https://painel.renderizaweb.com.br; STG http://localhost:5180), endereços de retorno (produção
  só o painel e renderiza-painel-clientes.vercel.app; STG localhost:5180 e renderiza-painel-clientes-*.vercel.app),
  senha mínima 8, confirmação de e-mail ligada, troca de e-mail confirmada nos dois endereços, links valendo 1 hora.
  Os 5 e-mails em supabase/emails/ (confirmação, convite, recuperar a senha, troca de e-mail, link de acesso), em
  português, com as cores dos tokens --rz-*. A conferência dos projetos saiu do migrar.mjs para scripts/lib/projetos.mjs.
Aplicado: STG e produção em 29/10, conferidos lendo de volta (iguais ao repositório, menos os e-mails).
Testado: npm test da pasta (53, com test/auth.test.mjs: endereços exatos, curingas, senha 8 = SENHA_MINIMA, os 5
  e-mails com assunto, variáveis que existem, nada externo, só cores dos tokens, o mesmo layout nos 5, "1 hora" =
  mailer_otp_exp, prévia escapando HTML) e da raiz (160); e-mails vistos no Chromium (390 e 1100 px); nos dois projetos,
  sem criar usuário: senha de 7 volta weak_password; /auth/v1/verify com link falso volta para o endereço de retorno
  da lista e manda qualquer outro para o site_url; as travas do script (produção sem --projeto e antes do STG).
E-mails (29/10, depois do Brevo, pela sessão claude/painel-renderiza-roadmap-jfhmpp): node scripts/auth.mjs stg e
  depois producao --projeto hxzsiiqhlqxuqkevskwb; os dois iguais ao repositório, lendo de volta. Um cadastro do
  contato@ no STG mandou o e-mail de confirmação pelo Brevo (o primeiro envio falhou com "5.7.1 Unauthorized IP
  address": a trava de IPs do Brevo, desligada para as chaves SMTP; ver 04).
Conferido pela Renderiza em 29/10: na produção (entrar, sair, esqueci a senha, senha nova pelo e-mail) e numa
  prévia da Vercel (STG), com troca de senha.
Cadastro pela API fechado (disable_signup) em 29/10: no STG e, com o ok da Renderiza, na produção; nos dois, cadastro
  volta signup_disabled e "Esqueci a senha" segue respondendo. node scripts/auth.mjs: os dois iguais ao repositório.
MISSÃO 1 FEITA.
Decisões no caminho: assunto sem variável (o Supabase passa o assunto pelo html/template e escaparia & como &amp;);
  convite com {{ .Data.nome_da_conta }} quando vier (aviso para a Missão 2); sem imagem nos e-mails (muitos
  programas bloqueiam e o SVG da marca não abre no Gmail): a marca vai escrita.
Migrações aplicadas: nenhuma nova (o Auth não é migração; fica no script).
```

## Migrações aplicadas

Uma linha por migração; marque a data em cada banco logo depois de aplicar (regras em `08`: sempre STG primeiro).
Antes de aplicar uma nova, confira esta lista e a do próprio banco.

| Arquivo | Missão | Branch | STG | Produção |
|---|---|---|---|---|
| `20261029003422_trilhos_teste.sql` (teste, só o comentário do schema `public`) | 1 | `claude/missao-1-trilhos-setup-wwahf8`, reaplicada pela `claude/clever-albattani-u37i0u` | 29/10/2026 (`qxcxllhmtodsptxffbhx`, São Paulo) | 29/10/2026 (`hxzsiiqhlqxuqkevskwb`, São Paulo) |
| `20261029110000_contas_e_acesso.sql` (contas, pessoas, convites, módulos, `pode()`) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | — |
| `20261029110100_negocio_e_dia_a_dia.sql` (serviços e o dia a dia, com o cliente no centro) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | — |
| `20261029110200_historico_site_e_admin.sql` (histórico, Meu site, Admin, tempo real dos pedidos) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | — |
| `20261029110300_armazenamento.sql` (buckets e políticas do Storage) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | — |
| `20261029112300_regras_sem_visitante.sql` (funções de regra fechadas ao visitante; aviso do Supabase) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | — |
| `20261029112900_apagar_conta_inteira.sql` (apagar uma conta inteira sem erro; achado pela semente) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | — |

## Avisos entre sessões

Recado que outra sessão precisa saber (mudou um nome de coluna, travou numa dependência, achou um bug fora da sua
área). O mais novo em cima.

| Data | Missão | Recado |
|---|---|---|
| 29/10/2026 | 1 · 2 | **Missão 1 feita; a Missão 2 pode começar.** Três coisas que a Missão 2 vai encontrar: (1) **prévias da Vercel pedem login na Vercel**: a sessão não abre prévia; testa no `localhost:5180` contra o STG (`npm run dev` na pasta `painel-clientes/`) e pede à Renderiza para conferir a prévia. (2) **Convidar** (`auth.admin.inviteUserByEmail`) só funciona com a chave secreta do Supabase, que nunca vai ao front (`04`): o convite sai de uma função do servidor; a sessão escolhe o caminho, registra no `07` e pede à Renderiza para pôr a chave onde for preciso (nunca pelo chat). (3) **Abrir o cadastro** pede a verificação contra robô (ex.: Cloudflare Turnstile): a chave do site é pública e vai no front; a secreta, a Renderiza põe no Supabase; só então `disable_signup: false`, STG primeiro. |
| 29/10/2026 | 1 · 2B | **Cadastro fechado** pela API (`disable_signup` em `scripts/lib/auth.mjs`), no STG e na produção desde 29/10. O `06` só aceita cadastro aberto com verificação contra robô, e o cadastro estava aberto a qualquer um com a chave pública (que vai para o navegador), mandando e-mail do nosso domínio para qualquer endereço. Convite, "Esqueci a senha" e usuário criado pela Renderiza seguem funcionando. Quem fizer a tela de cadastro com 7 dias grátis (Missão 2, bloco B) liga a verificação contra robô no Auth (ex.: Cloudflare Turnstile) no mesmo arquivo e abre o cadastro, STG primeiro. |
| 29/10/2026 | 1 | **E-mail pelo Brevo nos dois projetos** e os e-mails do login em português aplicados (`scripts/auth.mjs`). Limites: o Supabase manda até 30 e-mails por hora por projeto (`rate_limit_email_sent`) e o Brevo grátis, 300 por dia na conta toda (STG e produção juntos): nada de laço que dispare e-mail em teste. No STG ficou o usuário `contato@renderizaweb.com.br`, confirmado e com senha aleatória (foi o teste do envio; para entrar, "Esqueci a senha"); a semente da Missão 2 pode apagar ou reaproveitar. Detalhes no `04` (E-mail). |
| 29/10/2026 | 1 | **Auth configurado pelo repositório** nos dois projetos (`scripts/auth.mjs`, valores no `04`): site_url, endereços de retorno (produção: só o painel e `renderiza-painel-clientes.vercel.app`; STG: `localhost:5180` e as prévias) e senha mínima de 8. Nada de mudar o Auth à mão no painel do Supabase: mude `scripts/lib/auth.mjs` e rode o script (STG primeiro). Os e-mails do login (`supabase/emails/`) também vêm do repositório: mudou um, rode o script de novo (só funciona com o SMTP próprio, já ligado). |
| 29/10/2026 | 1 · 2 | **Convite:** o e-mail usa `{{ .Data.nome_da_conta }}` quando existe ("Villa Alecrim convidou você…"). Ao convidar, mande `data: { nome_da_conta }`. O link do convite vale 1 hora (`mailer_otp_exp`, o mesmo de todos os links); se a tela de convite precisar de mais, mude no `scripts/lib/auth.mjs` e nos textos dos e-mails. |
| 29/10/2026 | 1 | **Domínio no ar:** `painel.renderizaweb.com.br` aponta para a Vercel (CNAME no Registro.br) e responde em HTTPS com a produção. Use esse endereço na configuração do Auth. |
| 29/10/2026 | 1 · 2B | **Design system e telas de acesso prontos** (na `main`): `src/ui/estilo.css` (tokens `--rz-*` e componentes `.rz-*`), `src/ui/icones.js`, `src/ui/formulario.js`, a fonte Geist em `src/ui/fontes/`, e as telas `/entrar`, `/esqueci-a-senha` e `/nova-senha` com o layout `src/telas/acesso.js`. O estilo saiu do `index.html`. Regras: [`10`](10-design-system.md). O bloco B da Missão 2 constrói em cima disso. |
| 29/10/2026 | 1 | **Vercel no ar** (`renderiza-painel-clientes.vercel.app`, produção). No primeiro deploy, abrir `/entrar` direto dava 404: com `cleanUrls` ligado a Vercel ignora o rewrite para `/index.html`. Corrigido com `cleanUrls: false` (teste no `esqueleto.test.mjs`). |
| 29/10/2026 | 1 | **Supabase em São Paulo:** a Renderiza apagou os dois projetos dos EUA (produção `wkwyhganenohmupcwthd`, `us-east-2`; STG `vzrmepxoigoszqtoxtlo`, `us-west-2`) e criou dois em São Paulo (`sa-east-1`): produção `hxzsiiqhlqxuqkevskwb` e STG `qxcxllhmtodsptxffbhx`, com as variáveis `PAINEL_*` atualizadas (o token é o mesmo). A migração de teste foi reaplicada nos dois. Rodam Postgres 17 (o banco local é 16). O Auth dos dois está no padrão: *Site URL* `http://localhost:3000`, senha mínima 6, sem SMTP próprio. |
| 29/10/2026 | 1 | **`vercel.json`:** o `ignoreCommand` agora compara o último deploy da branch (`VERCEL_GIT_PREVIOUS_SHA`) com o commit atual, não só `HEAD^` com `HEAD`; sem SHA anterior ou com erro do git, faz o build (`04`, Vercel). |
| 29/10/2026 | 1 | **Esqueleto:** cada módulo e cada parte do Admin já tem `index.js` vazio na sua pasta, com `montar(el, contexto)`: quem constrói substitui. O Admin tem também a parte `modulos/` (do `02`). A rota `/admin` ainda não tem trava (as partes não leem nada); a trava vem com `equipe_renderiza` e a RLS (Missões 2 e 5). |
| 29/10/2026 | 1 | **`.gitignore` da raiz** ignorava toda pasta `publico/`, inclusive a futura `painel-clientes/publico/` (contrato, termos). Corrigido com `!painel-clientes/publico/`. |
| 29/10/2026 | 1 | **STG:** o usuário de teste `trilhos-m1@example.com` era do STG dos EUA, apagado; o STG novo não tem usuário. Para testar o login, crie um em *Authentication → Users* do STG (a senha não fica no repositório). |
| 28/10/2026 | — | O trabalho passou de tarefas para 6 missões, uma por parada (este arquivo). Acesso das sessões ao Supabase novo pelas variáveis `PAINEL_*` (Missão 1). |
| 28/10/2026 | — | UX: [`09-ux.md`](09-ux.md) é a referência das telas junto com os exemplos. |
| 28/10/2026 | — | Supabase: conta nova com `painel-renderiza-prod` e `painel-renderiza-stg`; migração sempre no STG antes da produção. O projeto de hoje é do Painel de prospecção e não se toca. |
| 28/10/2026 | — | Cada sessão aplica as próprias migrações, com as regras do `08`; juntar e subir para a `main` é com a Renderiza. O piloto ainda não tem site: a Missão 4 prova a ponte num site de teste. |
