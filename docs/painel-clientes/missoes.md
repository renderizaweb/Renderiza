# Missões

O trabalho anda por **6 missões, uma por parada do [trilho](01-trilho.md)**. Uma missão é o que se entrega a uma
sessão do Claude ("sua missão é a Missão 2"). As missões 3, 4 e 5 andam ao mesmo tempo e, para acelerar, podem ser
divididas em mais de uma sessão pelos **blocos** de cada uma. As regras de como as sessões trabalham (e continuam o
trabalho umas das outras) estão em [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md).

## Situação

| Missão | Parada | Quem | Situação | Sessão / branch |
|---|---|---|---|---|
| 1 · Trilhos | 1 | você + 1 sessão | **em andamento** (sua parte: Auth, Brevo e Vercel); parte do Claude **pronta para subir** | `claude/missao-1-trilhos-setup-wwahf8` |
| 2 · Fundação | 2 | 1 sessão (ou 2: banco e telas) | esperando a 1 | |
| 3 · Módulos | 3 | 1 a 6 sessões (uma por bloco) | esperando a 2 | |
| 4 · Ponte com o site | 4 | 1 a 3 sessões | esperando a 2 | |
| 5 · Admin e regras | 5 | 1 a 2 sessões | esperando a 2 | |
| 6 · Piloto | 6 | você + 1 sessão | esperando a 3, 4 e 5 | |

**Situação:** `esperando` · `em andamento` · `pronta para subir` (a Renderiza junta na `main`) · `feita` · `travada`
(diga por quê em "Avisos"). Os caminhos de "Mexe em" são dentro de `painel-clientes/`, menos os que começam pela raiz.

**Para colar ao abrir uma sessão:**

> Leia `docs/painel-clientes/README.md`, o `08-trabalho-em-paralelo.md` e o `missoes.md`. Sua missão é a Missão N
> (bloco X, se houver).

---

## Missão 1 · Trilhos

**Para quê:** os acessos e a base no ar, para as outras missões terem onde trabalhar.

**Sua parte** (fora do repositório; passo a passo no [`04`](04-arquitetura.md)). Feito em 28 e 29/10/2026: o
`contato@renderizaweb.com.br` no Zoho (com os MX no Registro.br) e os dois projetos do Supabase, produção
(`wkwyhganenohmupcwthd`) e STG (`vzrmepxoigoszqtoxtlo`); as variáveis do item 3 (conferidas pela sessão em 29/10).
Falta: o Auth dos dois projetos (*Authentication*: endereço do painel, senha mínima de 8; ver o `04`), o envio
(item 4) e a Vercel (item 5).

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
   `nao-responda@renderizaweb.com.br`, nome "Painel Renderiza" e respostas para `contato@`.
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
- A casca: entrar, cadastro com 7 dias grátis, convite da equipe, esqueci a senha, escolher a conta, menu com os
  módulos ligados (trancado sem acesso), aviso de teste vencido.
- As peças comuns do `09`: barra de baixo e menu lateral, "+" ações rápidas, **"Para quem?"**, detalhes, filtros,
  desfazer, WhatsApp num toque, estados (vazio, erro, carregando), formulários, Ctrl+K, exportar CSV; as palavras
  por nicho.
- O onboarding do `09` (5 telas) e os "Primeiros passos" no Início, com a importação das datas já marcadas.
- Equipe e acessos, Configurações do negócio e Serviços (pacotes ou ensaios, adicionais, horários, bloqueios,
  campanhas).
- **Mexe em:** `src/sessao.js`, `src/telas/`, `src/ui/`, `src/nichos/`, `estilo.css`, `src/modulos/equipe/`,
  `src/modulos/configuracoes/`, `src/modulos/servicos/`, `src/modulos/inicio/primeiros-passos.js`.

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
Missão 1 · parte do Claude · branch claude/missao-1-trilhos-setup-wwahf8 · atualizada em 29/10 · PRONTA PARA SUBIR
Feito: variáveis PAINEL_* conferidas (as 5 presentes; URLs batem com os projetos). painel-clientes/ com o
  esqueleto: casca, rotas, 10 módulos e 5 partes do Admin registrados e vazios, adaptador do Supabase,
  api/config.js, vercel.json (sem build, noindex, DENY, CSP, pula o build se a pasta não mudou), README.
  Banco local (imitação do Supabase no Postgres 16 + ajudantes de teste) e scripts/migrar.mjs
  (local → STG → produção pela API de gerenciamento). Migração de teste aplicada no STG e na produção.
  Tela de login funcionando no servidor local contra o STG.
Testado: npm test (31 testes: rotas, sessão, config, esqueleto, migrações e o banco local com RLS); migrar.mjs
  local/stg/producao, as travas (produção sem STG recusada; reaplicar não faz nada) e a situação dos dois bancos;
  login no Chromium (computador e celular): sem login vai ao /entrar e volta para onde ia, senha errada, entrar,
  recarregar, menu, voltar do navegador, Admin, página não encontrada e sair.
Ficou de fora (depende da Renderiza): Vercel, e-mail (Brevo) e o Auth dos projetos; por isso o login ainda não foi
  testado em painel.renderizaweb.com.br nem numa prévia, e o e-mail de confirmação não foi testado.
Próximo passo (quando a Vercel existir): abrir a prévia da branch e entrar com um usuário do STG; conferir que
  /src/... e /api/config respondem e que supabase/ e scripts/ não são publicados (.vercelignore).
Decisões no caminho: migração aplicada pela API de gerenciamento (POST /v1/projects/<ref>/database/query), que
  roda tudo numa transação só (conferido no STG), com registro em supabase_migrations.schema_migrations;
  endereços sem # (a Vercel devolve o index.html); módulo = src/modulos/<id>/index.js com montar(el, contexto);
  Admin com 5 partes (as do 02, incluindo Módulos); usuário de teste no STG: trilhos-m1@example.com.
Migrações aplicadas (STG / produção): 20261029003422_trilhos_teste (29/10 / 29/10).
```

## Migrações aplicadas

Uma linha por migração; marque a data em cada banco logo depois de aplicar (regras em `08`: sempre STG primeiro).
Antes de aplicar uma nova, confira esta lista e a do próprio banco.

| Arquivo | Missão | Branch | STG | Produção |
|---|---|---|---|---|
| `20261029003422_trilhos_teste.sql` (teste, só o comentário do schema `public`) | 1 | `claude/missao-1-trilhos-setup-wwahf8` | 29/10/2026 | 29/10/2026 |

## Avisos entre sessões

Recado que outra sessão precisa saber (mudou um nome de coluna, travou numa dependência, achou um bug fora da sua
área). O mais novo em cima.

| Data | Missão | Recado |
|---|---|---|
| 29/10/2026 | 1 | **Supabase:** os dois projetos estão em regiões dos EUA (STG `us-west-2`, produção `us-east-2`), não em São Paulo como o `04` previa; e rodam Postgres 17 (o banco local é 16). Decidir com a Renderiza se recria antes de ter dados (hoje só a migração de teste). O Auth dos dois está no padrão: *Site URL* `http://localhost:3000`, senha mínima 6, sem SMTP próprio. |
| 29/10/2026 | 1 | **Esqueleto:** cada módulo e cada parte do Admin já tem `index.js` vazio na sua pasta, com `montar(el, contexto)`: quem constrói substitui. O Admin tem também a parte `modulos/` (do `02`). A rota `/admin` ainda não tem trava (as partes não leem nada); a trava vem com `equipe_renderiza` e a RLS (Missões 2 e 5). |
| 29/10/2026 | 1 | **`.gitignore` da raiz** ignorava toda pasta `publico/`, inclusive a futura `painel-clientes/publico/` (contrato, termos). Corrigido com `!painel-clientes/publico/`. |
| 29/10/2026 | 1 | **STG:** usuário de teste `trilhos-m1@example.com` (confirmado, sem conta nem dados), criado para testar o login. A senha não fica no repositório; para outro teste, crie um usuário em *Authentication → Users* do STG. |
| 28/10/2026 | — | O trabalho passou de tarefas para 6 missões, uma por parada (este arquivo). Acesso das sessões ao Supabase novo pelas variáveis `PAINEL_*` (Missão 1). |
| 28/10/2026 | — | UX: [`09-ux.md`](09-ux.md) é a referência das telas junto com os exemplos. |
| 28/10/2026 | — | Supabase: conta nova com `painel-renderiza-prod` e `painel-renderiza-stg`; migração sempre no STG antes da produção. O projeto de hoje é do Painel de prospecção e não se toca. |
| 28/10/2026 | — | Cada sessão aplica as próprias migrações, com as regras do `08`; juntar e subir para a `main` é com a Renderiza. O piloto ainda não tem site: a Missão 4 prova a ponte num site de teste. |
