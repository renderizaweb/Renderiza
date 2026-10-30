# Missões

O trabalho anda por **6 missões, uma por parada do [trilho](01-trilho.md)**. Uma missão é o que se entrega a uma
sessão do Claude ("sua missão é a Missão 2"). As missões 3, 4 e 5 andam ao mesmo tempo e, para acelerar, podem ser
divididas em mais de uma sessão pelos **blocos** de cada uma. As regras de como as sessões trabalham (e continuam o
trabalho umas das outras) estão em [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md).

## Situação

| Missão | Parada | Quem | Situação | Sessão / branch |
|---|---|---|---|---|
| 1 · Trilhos | 1 | você + 1 sessão | **feita** (29/10/2026): tudo no ar, na `main` e conferido na produção e numa prévia | — |
| 2 · Fundação | 2 | 1 sessão (ou 2: banco e telas) | **feita** (29/10/2026): bloco A (banco) e bloco B (telas base) na `main` e na produção, com a função `convidar` | A e B: `claude/painel-renderiza-setup-ztnrzy` |
| 3 · Módulos | 3 | 1 a 6 sessões (uma por bloco) | **feita** (29/10/2026): os 6 blocos (Atendimento, Agenda, Clientes, Financeiro, Contratos, Início e exportar) **na `main`**; a Renderiza faz a varredura geral (ver "Avisos" sobre o deploy da produção) | A a E: `claude/painel-renderiza-setup-ztnrzy`; F terminado pela `claude/painel-renderiza-roadmap-jfhmpp` |
| 4 · Ponte com o site | 4 | 1 a 3 sessões | **feita** (29/10/2026): A, B e C **na `main`**, banco e função `avisar-pedido` na produção; falta só a chave do Brevo na função (Renderiza) | A, B e C: `claude/painel-renderiza-roadmap-jfhmpp` |
| 5 · Admin e regras | 5 | 1 a 2 sessões | **em andamento**: bloco A (Admin) **feito, na `main`** (30/10; a migração dele na produção espera o "pode", ver "Avisos"); bloco B (Regras) em seguida, na mesma sessão | A e B: `claude/painel-renderiza-setup-ztnrzy` |
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
- **O banco é do bloco A.** O bloco B não cria migração: testa no local com as migrações da branch do bloco A
  (traga a branch) e, se precisar de algo no banco, pede ao bloco A num aviso em "Avisos entre sessões".
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

**Bloco A feito (29/10/2026), no STG e na produção (falta a chave do Brevo na função):** a API pública, as funções do banco da agenda online, a página
`/agenda/` no site do cliente e o aviso por e-mail ao dono (detalhes no [`04`](04-arquitetura.md), "API pública", e
no [`05`](05-dados-e-permissoes.md), "Funções públicas"). No STG, a Villa Alecrim da semente ganhou o site
`villa-alecrim` (domínios `villa-alecrim.teste` e `localhost`), para testar a agenda de verdade.

**Bloco B feito (29/10/2026):** o contrato v1, o script, as marcações e a versão final estão no [`03`](03-modulo-meu-site.md)
(seção "O que o painel entrega" é o que os blocos A e C precisam cumprir). O site de teste já existe (`node
test/site-teste/montar.mjs`).

**Bloco C feito (29/10/2026):** o servidor (as funções `publico_site` e `publico_previa`, a API do site, da prévia e
das imagens) está na `main`, no STG e na produção; o editor no painel está na branch (veja a nota de passagem).
Como funciona: [`03`](03-modulo-meu-site.md), "No painel".

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
Missão 5 · bloco A (Admin) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 30/10 · FEITO, NA MAIN
Referência: 02 (Admin; como a conta nasce e vive), 05 (as tabelas e funções do Admin), 06, 07 (D19).
Plano (nesta ordem): 1. a casca do Admin e minhas_contas com o suporte; 2. Contas; 3. Módulos; 4. Pessoas e
  acessos; 5. Pagamentos; 6. Indicadores; 7. teste de ponta a ponta no STG e documentos.
Feito (partes 1 a 7): src/admin/: casca.js (o menu com as 5 partes; no celular, a barra de baixo; abre sem conta
  escolhida), dados.js (as contas com pessoas, donos, módulos ligados e o último acesso), logica.js (a situação em
  palavras, os grupos, o código público, a mensalidade sugerida, os pagamentos do mês, o aparelho), suporte.js
  (entrar para ajudar: motivo, "só ver" ou "ver e editar", 1 a 8 horas, e abre o painel da conta; exportar a
  pedido: suporte "só ver" com o motivo, o .zip do src/telas/exportar.js e o suporte encerrado; encerrar),
  contas/ (a lista pela situação: para aprovar, ativas, em teste, desligadas, todas; a gaveta: aprovar com ou sem
  prazo, mudar o fim do teste, dar prazo, desligar com confirmação, religar, os módulos da conta, as pessoas e os
  convites com "mandar de novo", os pagamentos, o registro do suporte; criar conta à mão: já ativa, os módulos com
  a mensalidade, o código sugerido pelo nome, o convite do dono pela função convidar), modulos/ (o catálogo, quantas
  contas usam e o "só pago"), pessoas/ (usando agora, as entradas com o aparelho, o suporte com "Encerrar"),
  pagamentos/ (o mês com as setas, quem pagou e quem falta, "Registrar Pix" com o valor do plano), indicadores/
  (só números: admin_indicadores); test/admin.test.mjs (7).
  Banco: migração 20261030120000_minhas_contas_suporte.sql (STG; na produção espera o "pode", ver "Avisos"):
  minhas_contas() traz a conta em suporte; teste supabase/testes/050_admin_suporte.sql.
  Fora do "Mexe em", pequeno: src/app.js (o Admin abre com a casca dele, sem conta), src/telas/contas.js (quem é da
  Renderiza e não é de nenhuma conta vai para o Admin), src/sessao.js (sem pessoa em suporte, não busca), src/telas/
  casca.js (a faixa "Você está ajudando em…" com "Encerrar e voltar ao Admin"), estilo.css seção 23.
Testado no STG (usuário temporário da equipe Renderiza, sem conta; computador e celular 390 px): entrar cai no
  Admin; criar a conta "Adm Espaço da Sessão" (código sugerido, mensalidade R$ 63,99 com 3 módulos, o convite do
  dono: a chamada da função interceptada no teste, para não mandar e-mail a endereço fictício), ligar o
  Atendimento, registrar o Pix (R$ 78,98 sugerido com 4 módulos), dar prazo de 90 dias, desligar e religar; Módulos,
  Pessoas, Pagamentos (1 pagou, 2 faltam) e Indicadores; entrar para ajudar na Villa (a faixa, os 32 clientes
  "só vê", encerrar e voltar ao Admin); exportar a pedido os dados do Estúdio Ciranda (o .zip com as planilhas).
  Testes: 176 do front; 11 arquivos do banco (local e STG). Conta, usuário e registros de teste apagados.
```

```
Missão 3 · bloco F (Início e exportar) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · FEITO, NA MAIN
Referência: 09 (Início: começa por "Para fazer agora": pedidos sem resposta, parcelas vencendo ou atrasadas,
  contratos esperando aceite, o que tem hoje e amanhã, cada item com o botão do próximo passo; os números vêm
  depois, compactos), 02 (Visão geral; exportar), 05 (atividades: "o que a equipe fez", cada um vê só o que pode;
  "exportar tudo" junta tudo num zip, CSV que abre no Excel e no Google Planilhas), o exemplo (Visão geral: saudação
  com o dia, os números de cada módulo, próximas festas, hoje, "O que a equipe fez").
Plano (nesta ordem, cada parte com commit): 1. "Para fazer agora" (só o que a pessoa pode ver, o mais urgente
  primeiro: atrasadas, pedidos novos, vence hoje, contratos esperando, hoje e amanhã), com "Responder", "Recebi",
  "Lembrar" e "Ver"; 2. a saudação e os números compactos de cada módulo que a pessoa vê; 3. as próximas festas ou
  ensaios e "O que a equipe fez" (as atividades em frases: "Rafael mandou o contrato para Isabela"); 4. exportar
  tudo (src/telas/exportar.js): uma planilha CSV por assunto (clientes, pedidos, reservas, compromissos, parcelas,
  contratos, entregas, serviços), num zip feito no navegador, só para o dono (no Início e em Configurações); 5.
  teste de ponta a ponta no STG e documentos.
PARA A SESSÃO DO BLOCO F, SE VOLTAR: o bloco está terminado e na main. Não refaça nada: rode git fetch origin e git
  merge origin/main na sua branch antes de qualquer coisa (os seus commits fc8e5a1 e 3584c03 já estão na main).
Feito: partes 1 a 4 pela sessão do bloco (commits fc8e5a1 e 3584c03; ela parou no limite antes da parte 5); a
  parte 5 pela sessão da Missão 4 (branch claude/painel-renderiza-roadmap-jfhmpp), que juntou e subiu para a main.
Testado: painel npm test 169 passam (inicio e exportar entre eles), raiz 180; de ponta a ponta no STG pelo npm run
  dev, como dono (usuário temporário, apagado): Início com "Para fazer agora", "Próximas festas", "O que a equipe fez"
  e "Seus dados"; "Exportar tudo" baixou painel-villa-alecrim-<data>.zip com 34 arquivos (CSVs, um .txt por contrato,
  LEIA-ME); os 8 módulos abrem com os dados da semente, sem erro de script.
Não testado aqui: "Recebi", "Lembrar" e "Responder" clicando no Início (têm teste da lógica em test/inicio.test.mjs);
  fica para a varredura geral da Renderiza.
Mexe em: src/modulos/inicio/, src/telas/exportar.js. Fora disso, pequeno e com aviso: o botão de exportar em
  Configurações.
```

```
Missão 3 · bloco E (Contratos) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · FEITO, NA MAIN
Referência: 02 (Contratos: o contrato vai por um link, o cliente final lê e aceita no celular, o painel guarda a
  data, a hora e quem aceitou; termo de aceite digital, sem e-CPF; o texto é do cliente), 05 (modelos_contrato,
  contratos, "aceito não muda", as funções públicas), 04 (/c/<código>), 06 (a prova do aceite), 07 (D14: sem CPF),
  09 (resumo → aceite → dados do Pix; confirmação antes de mandar), os exemplos (Contratos: orçamento, enviado,
  aceito; "esperando o aceite há N dias"; "Lembrar do aceite").
Plano (nesta ordem): 1. a migração do aceite; 2. a página pública /c/<código>; 3. a lista; 4. os modelos e o
  contrato novo; 5. a gaveta e o Pix em Configurações; 6. teste de ponta a ponta no STG e documentos.
Feito (partes 1 a 6):
  Banco: migração 20261029220000_publico_contrato.sql (STG e produção; 05, "Funções públicas"):
  publico_contrato(código) e publico_aceitar_contrato(código, nome, contato, impressão). O IP e o aparelho vêm do
  pedido (cabeçalhos), a impressão digital confere que o texto lido é o aceito, o Pix só sai depois do aceite.
  Teste do banco supabase/testes/043_publico_contrato.sql.
  Página do link: publico/contrato/ (index.html, contrato.js, logica.js, contrato.css): o resumo do que foi
  contratado → o texto com "Li e aceito" (nome completo e WhatsApp ou e-mail) → pronto, com os dados do Pix,
  "Mandar o comprovante" (WhatsApp do negócio) e "Imprimir ou salvar em PDF" (o texto e o registro do aceite com a
  impressão digital). O botão de voltar do celular volta ao resumo. Link que não vale: "Este link não está valendo".
  Painel: src/modulos/contratos/: index.js (chips esperando o aceite, orçamento, sem contrato, aceitos,
  cancelados; o que pede ação abre primeiro; "Mandar", "Lembrar" e "Fazer contrato" na linha; avisos de modelo e
  de Pix; ?contrato=<id>, ?novo=contrato[&reserva=<id>]), contrato.js (contrato novo: "Para quem?", a festa ou
  ensaio, o modelo com os campos trocados e o texto editável; campo sem valor avisa e não deixa mandar; salvar como
  orçamento ou mandar com confirmação; o link com WhatsApp, copiar e compartilhar; a gaveta com o aceite
  registrado, o texto, editar antes do aceite, cancelar e abrir o link), modelos.js (o texto do cliente com os
  campos num toque: {cliente}, {data}, {data_extenso}, {horario}, {tipo}, {pacote}, {convidados}, {adicionais},
  {valor}, {sinal}, {desconto}, {endereco}, {cpf}, {negocio}, {hoje}), logica.js; test/contratos.test.mjs (5) e
  test/contrato-publico.test.mjs (5).
  Fora do "Mexe em", pequeno: a migração e o teste do banco; vercel.json (o rewrite de /c/, antes do app) e
  scripts/servidor.mjs; Configurações (o Pix em contas.ajustes.pix, só o dono); o "+" (src/telas/casca.js) ganhou
  "Mandar contrato" (e test/casca.test.mjs); estilo.css seção 21 e .rz-linhas--com-botao (era
  .rz-linhas--parcelas, agora também em Contratos).
Testado no STG (Villa Alecrim, desktop; Estúdio Ciranda, celular 390 px): "Fazer contrato" da festa da Paula &
  Henrique com o modelo preenchido, salvar como orçamento, mandar (confirmação, link, mensagem), o cliente abrir o
  link no celular, ler e aceitar, e o painel mostrar aceito com nome, contato, data, IP e aparelho; editar um
  enviado; cancelar; campo {sinal} sem valor segura o "mandar"; modelo novo com campos num toque; ?contrato= pela
  ficha do cliente; o Pix em Configurações e na página depois do aceite; quem só vê não tem botões; link errado.
  Testes: 154 do front e 10 arquivos do banco (local e STG). Dados de teste apagados, semente rodada.
```

```
Missão 3 · bloco D (Financeiro) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · FEITO, NA MAIN
Referência: 02 (Financeiro: parcelas e sinal de cada festa ou ensaio, dar baixa, total do mês, a receber,
  atrasados, o que mais vende; é controle, não cobra), 09 (marcar pago com desfazer, atualização otimista;
  WhatsApp para lembrete e cobrança), 05 (parcelas, reservas_valores; "na reserva, Lançar parcelas"), o exemplo de
  eventos (Financeiro: os números do mês, receita mês a mês, próximas parcelas e entradas, o que mais vende).
Plano (nesta ordem): 1. a visão do mês e a lista de parcelas com "Recebi" e desfazer; 2. a gaveta da parcela e o
  lembrete no WhatsApp; 3. a festa no Financeiro (?reserva=<id>) com "Lançar parcelas"; 4. registrar pagamento
  pelo "+" (?novo=pagamento); 5. a receita mês a mês e o que mais vende; 6. teste de ponta a ponta no STG e
  documentos.
Feito (partes 1 a 6): src/modulos/financeiro/: index.js (os números do mês: recebido no mês, falta receber no mês,
  a receber em 30 dias, atrasadas; a lista com chips a receber, atrasadas, recebidas, todas; busca por cliente ou
  descrição; filtro por cliente; "Recebi" na linha; recolhido, "Mês a mês e o que mais vende": barras empilhadas
  recebido e a receber de 5 meses atrás a 2 à frente, com dica ao passar o mouse ou focar e "Ver em tabela", e o
  que mais vende pelo tipo de festa ou ensaio (reservas_valores); ?reserva=<id>, ?parcela=<id>, ?cliente=<id>,
  ?novo=pagamento), parcela.js (a gaveta: vencimento e situação, o lembrete pronto com "Lembrar no WhatsApp" (só
  com número) e "Copiar mensagem", ver a festa, ver o cliente, "Recebi" (forma e data) com desfazer, "Não recebi"
  com desfazer, editar, apagar a que não foi paga com desfazer; o formulário de parcela nova, editar e registrar
  pagamento, com "Para quem?" e a festa), festa.js (a festa no Financeiro: valor total, sinal e desconto em
  reservas_valores, sugeridos pelo pacote ou ensaio de Serviços quando ainda não têm; total, recebido e falta;
  as parcelas dela; "Lançar parcelas": o sinal primeiro e o resto em vezes, mês a mês, com a prévia antes de
  gravar; parcela avulsa), logica.js; test/financeiro.test.mjs (7 testes).
  Regras do "Lançar parcelas" (logica.js, planoDeParcelas): os centavos que sobram vão na última; dia 31 vira o
  último dia do mês; no máximo 48 vezes; sinal maior que o total vira só o sinal.
  Fora do "Mexe em", pequeno: estilo.css (seção 20 e os tokens --rz-grafico-1 e -2, validados pelo guia de
  gráficos; .rz-link agora alinha o ícone com o texto, o que também consertou os links da gaveta da Agenda).
Testado no STG (Villa Alecrim, desktop; Estúdio Ciranda, celular 390 px): números do mês, "Recebi" e desfazer,
  "Não recebi" e desfazer, a festa da Clínica Bem Viver com valores salvos e "Lançar parcelas" (sinal de R$ 5.000
  e 3 de R$ 4.333,33/34), registrar pagamento pelo "+" (Valentina Rocha, R$ 150,50), o lembrete com o link do
  WhatsApp, o mês a mês e o que mais vende; quem só vê o Financeiro não tem nenhum botão de mudar; no celular,
  sem rolagem para o lado. Testes: 144 do front. Dados de teste apagados, semente rodada.
```

```
Missão 3 · bloco A (Clientes) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · FEITO, NA MAIN
Referência: 05 ("O cliente no centro": situação calculada, uma pessoa um cliente, juntar, arquivar, a ficha como
  linha do tempo, só o que a pessoa pode ver), 02 (Clientes / Clientes e entregas: a entrega com o prazo e o link
  da galeria, sem guardar fotos), os exemplos (a lista de clientes; na fotografia, "Clientes e entregas" com o
  prazo de cada entrega).
Plano (nesta ordem, cada parte com commit): 1. a lista (chips pela situação: com reserva, interessados, já
  fizeram, não fecharam, arquivados; busca; a próxima reserva na linha); 2. a ficha (gaveta): contatos com
  WhatsApp, a linha do tempo (pedidos, reservas, compromissos, contratos, parcelas, entregas e o histórico, cada
  um abrindo o seu módulo, só o que a pessoa vê), editar (contato e a ficha completa: observações, endereço);
  ?cliente=<id> e ?novo=cliente; 3. juntar clientes (juntar_clientes) e arquivar com desfazer; 4. fotografia:
  as entregas (escolhendo, em edição, entregue), com o prazo e o link da galeria, e começar a entrega de um
  ensaio feito; 5. teste de ponta a ponta no STG e documentos.
Feito (partes 1 a 5): src/modulos/clientes/: index.js (lista com chips pela situação do banco: todos, com
  reserva, interessado, já fez, não fechou, arquivados; busca por nome, WhatsApp, e-mail ou Instagram; a próxima
  ou a última reserva na linha; ?cliente=<id>, ?novo=cliente; na fotografia, as abas Clientes e Entregas),
  ficha.js (gaveta: contatos com WhatsApp, anotações e endereço (clientes_fichas), a linha do tempo com pedidos,
  reservas, compromissos, contrato, pagamentos (as parcelas de cada reserva viram um item: "7 de 9 pagas, próxima
  vence…") e entregas, cada item abrindo o seu módulo e só o que a pessoa vê; editar e novo; juntar com outro
  cliente (juntar_clientes, com confirmação); arquivar e tirar do arquivo com desfazer; apagar só quem não tem
  história; "Novo pedido" já com o cliente), entregas.js (fotografia: em andamento pelo prazo, entregues, os
  ensaios feitos sem entrega com "Começar a entrega" (prazo de 30 dias, editável), em que pé está com desfazer,
  "Entregue" pede o link da galeria e oferece o WhatsApp), logica.js; test/clientes.test.mjs (5 testes).
  CPF ficou de fora da tela de propósito (D14: o aceite é sem CPF; só se o contrato do cliente pedir).
  Fora do "Mexe em", pequeno: src/app.js (trocar de tela fecha as gavetas abertas: um link de dentro da gaveta
  deixava ela aberta por cima da tela nova), src/modulos/atendimento/ (?novo=pedido&cliente=<id> pula o "Para
  quem?"), estilo.css seção 19.
Testado no STG (Villa Alecrim e Estúdio Ciranda): lista com 32 clientes por situação, ficha da Juliana & Pedro
  (festa, reunião, pagamentos quitados, contrato aceito, pedido), novo cliente com anotação, juntar dois
  clientes de teste, arquivar e desfazer, apagar (só sem história), "Novo pedido" da ficha abrindo o
  Atendimento já com o cliente, entregas da fotografia (começar, "Entregue" sem link é barrado, com link entra,
  desfazer); quem só vê não tem nenhum botão. Testes: 137 do front. Dados de teste apagados, semente rodada.
```

```
Missão 3 · bloco B (Agenda) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · FEITO, NA MAIN
Referência: os exemplos /exemplos/painel-eventos (Agenda: mês com as festas e o painel do dia; gaveta da festa com
  resumo, checklist e histórico; nova reserva) e /exemplos/painel-fotografia (ensaios por horário, horários livres,
  quadro da campanha com vagas, texto do Stories); 09 (celular: faixa da semana + lista do dia, o mês a um toque,
  legenda e equipe no "Filtrar", tocar num dia vazio oferece "Reservar este dia"); 02 (Agenda da equipe/do estúdio:
  cada pessoa pode ver só o que é dela); 05 (reservas, compromissos, bloqueios, campanhas, reservas_checklist,
  reservas_adicionais; valores ficam fora, com Financeiro e Contratos).
Plano (nesta ordem, cada parte com commit): 1. o calendário: no celular, a faixa da semana e a lista do dia, com o
  mês a um toque; no computador, o mês e o painel do dia; reservas (cor do tipo ou do ensaio; pré-reserva
  tracejada), compromissos, datas fechadas; "Filtrar" (quem cuida, tipo; "só o meu"); 2. a gaveta da reserva
  (resumo, situação: confirmar, realizada, cancelar; checklist com desfazer; WhatsApp) e a do compromisso;
  ?reserva=<id>; 3. reservar data ("+" e ?novo=reserva, tocar num dia vazio) com o conflito de horário, editar a
  reserva, e marcar visita, degustação ou reunião (?novo=visita); 4. fotografia: o dia por horário com os horários
  livres (horarios menos reservas e datas fechadas) e o quadro das campanhas com vagas e o texto do Stories;
  5. teste de ponta a ponta no STG e documentos.
Feito (partes 1 a 5): src/modulos/agenda/: index.js (celular: faixa da semana e a lista do dia, o mês a um
  toque; computador: o mês e o painel do dia; pré-reserva tracejada, datas fechadas, "Dia livre: já aparece na
  agenda online", "Reservar este dia"; "Filtrar" com quem cuida e "Só o meu", o que mostrar (a legenda) e
  canceladas; ?reserva=<id>, ?novo=reserva, ?novo=visita, ?dia=aaaa-mm-dd), reserva.js (gaveta: resumo sem
  valores, adicionais, situação confirmar/realizada/cancelar com desfazer, checklist com marcar, pôr e tirar;
  reservar e editar com "Para quem?", turnos do dia, duração do ensaio, adicionais, e o conflito de horário e a
  data fechada avisando antes de gravar: "Reservar mesmo assim"), compromisso.js (visita, degustação, reunião,
  outro: marcar, editar, desmarcar com desfazer), campanhas.js (fotografia: reservados, com sinal, esperando o
  sinal, lista de espera; o quadro de horários por dia, livre vira "Marcar"; o texto do Stories que muda
  sozinho), logica.js (regras sem tela); test/agenda.test.mjs (8 testes).
  Fora do "Mexe em", pequeno: src/nichos/index.js (doNegocio, o nome do negócio com a preposição certa; o
  Atendimento passou a usar dali) e estilo.css seção 18.
Testado no STG (Villa Alecrim e Estúdio Ciranda da semente): semana e mês no celular, mês no computador, gaveta
  com checklist (marcar e desmarcar), Filtrar, reservar num dia ocupado (avisa "Esse horário já tem: Juliana &
  Pedro (19h às 3h)" e deixa reservar mesmo assim), cancelar com desfazer, marcar e desmarcar visita, o dia da
  fotografia com os horários livres, o dia de campanha com os horários da campanha, o quadro da campanha (24 de
  30) e o Stories; ?reserva= (do Atendimento) abre a festa; ?novo=reserva abre o "Para quem?"; quem só vê não
  tem nenhum botão e o checklist fica travado. Testes: 132 do front. Dados de teste apagados, semente rodada.
Ficou de fora (para os outros blocos): os valores e as parcelas da festa (Financeiro, 3D: o link "Ver os
  pagamentos" leva a /financeiro?reserva=<id>); o histórico da festa (a tabela atividades já grava; quem fizer a
  ficha do cliente, 3A, ou o Início, 3F, mostra); editar as campanhas é em Serviços (já existe).
```

```
Missão 3 · bloco C (Atendimento) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · FEITO, NA MAIN
Referência: o exemplo /exemplos/painel-eventos (Atendimento e a gaveta do pedido), 09 ("Atendimento": a lista
  primeiro, o funil recolhido; no computador, quadro em colunas por etapa, arrastar muda a etapa; desfazer;
  tempo real do pedido novo), 05 (pedidos, compromissos, lista_espera, fechar_pedido), 02 (Atendimento).
Plano (nesta ordem, cada parte com commit): 1. a lista (etapas em chips, busca, "De onde vêm" e o funil
  recolhidos) e, no computador, o quadro por etapa com arrastar (mudar etapa com desfazer); 2. a gaveta do pedido
  (mensagem, data desejada e se está livre, convidados, tipo ou ensaio, quem atende, etapa, Responder no WhatsApp,
  Marcar visita, Perdido); 3. anotar pedido em poucos toques (o "+ Novo pedido" e ?novo=pedido): "Para quem?",
  data, tipo, convidados, origem; 4. "Fechar" vira reserva (fechar_pedido), confirmando a pré-reserva que a agenda
  online já criou; 5. lista de espera (fotografia, por campanha); 6. tempo real: pedido novo aparece sozinho, com
  aviso; 7. teste de ponta a ponta no STG e documentos.
Feito (partes 1 a 7): src/modulos/atendimento/: index.js (lista com chips por etapa, busca, o próximo passo na
  linha: Responder no novo, Fechar no orçamento; "Como vão os pedidos" recolhido; no computador, Lista | Quadro,
  quadro por etapa com arrastar e desfazer; ?novo=pedido e ?pedido=<id>; tempo real), pedido.js (gaveta, mudar
  etapa otimista com desfazer, Responder no WhatsApp leva o novo para "em conversa", Marcar visita = compromisso
  tipo visita, Perdido e Reabrir, Fechar = fechar_pedido com pré-reserva ou confirmada; anotar pedido com "Para
  quem?" primeiro), espera.js (lista de espera da fotografia, por campanha, Chamar no WhatsApp, tirar com
  desfazer), logica.js (regras sem tela); test/atendimento.test.mjs (8 testes).
  Banco: migração 20261029203000_fechar_pedido_confirma.sql (STG e produção; 05): fechar um pedido com
  pré-reserva confirma a reserva que ele já tem. Teste 020 cobre.
  Fora do "Mexe em", pequeno (avisos em "Avisos entre sessões"): adaptador (ouvir, tempo real), app.js (desmontar
  o módulo ao sair), src/ui/gaveta.js (foco "fechar"), estilo.css seção 17; 04 e 10 em dia.
Testado no STG (Villa Alecrim e Estúdio Ciranda da semente): lista no celular, gaveta com "a data está livre",
  quadro no computador, arrastar e desfazer, anotar pedido (cliente novo pelo "Para quem?"), fechar (pré-reserva
  19h-3h), fechar um pedido com pré-reserva como confirmada (sem criar outra), pedido novo entrando pelo banco
  aparece sozinho em ~2 s com aviso, lista de espera da fotografia; quem só vê não tem nenhum botão e o banco não
  deixa mudar etapa nem fechar. Testes: 124 do front, 9 arquivos do banco (local e STG). Dados de teste apagados.
Ficou de fora (para os outros blocos): o número de pedidos novos no menu (badge da casca); "Ver na Agenda" leva a
  /agenda?reserva=<id>, que a Agenda (3B) abre quando existir; a ficha do cliente é do 3A (/clientes?cliente=<id>).
```

```
Missão 2 · bloco B (telas base) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · FEITA, NA MAIN E NA PRODUÇÃO
Plano (nesta ordem, cada parte com commit): 1. palavras por nicho (src/nichos/) e formatos (src/ui/formatos.js);
  2. a casca de verdade: sessão com a conta escolhida (minhas_contas), escolher a conta, menu lateral e barra de
  baixo só com os módulos ligados (trancado sem acesso), aviso de teste e tela de teste vencido, registrar_entrada,
  aceitar_convites; 3. peças comuns em src/ui/ (aviso com desfazer, gaveta, folha do "+", estados, "Para quem?",
  WhatsApp, CSV, paleta Ctrl+K); 4. Equipe e acessos, Configurações, Serviços; 5. o convite (função do servidor e a
  tela /convite); 6. onboarding (/comecar) e cadastro (/cadastro, pronto para a verificação contra robô); 7. primeiros
  passos no Início, com a importação das datas; 8. teste de ponta a ponta no localhost contra o STG.
Feito: 1 (src/nichos/, src/ui/formatos.js, test/formatos.test.mjs). 2, a casca: src/telas/casca.js (menu lateral,
  barra de baixo, "+", busca, aviso de teste, bloqueio), src/telas/contas.js (escolher a conta; sem conta leva a
  /comecar), src/sessao.js (carregarContas com aceitar_convites, conta escolhida guardada no aparelho, podeNaConta,
  carregarPessoa), src/ui/gaveta.js (gaveta, folha, confirmar), src/ui/aviso.js (aviso com desfazer), estilo.css
  seções 10 a 12, ícones novos; app.js e rotas.js com as telas novas e o contexto dos módulos (aviso); adaptador com
  cadastrar, funcao e enviarArquivo (aviso). Visto no Chromium contra o STG (computador e celular).
3, as peças: src/ui/para-quem.js (busca, novo cliente, cartão do cliente), paleta.js (Ctrl+K), estados.js (vazio,
  erro, esqueleto, comEstados), whatsapp.js, csv.js (exportar e ler), filtros.js (chips); estilo.css seção 13;
  test/pecas.test.mjs.
4: src/modulos/equipe/ (lista, convidar, acessos por módulo com desfazer, tirar e devolver o acesso, convites
  esperando com reenviar e cancelar), src/modulos/configuracoes/ (nome, WhatsApp, fuso, logo em WebP no bucket
  logos, o plano para consulta), src/modulos/servicos/ (abas por nicho: pacotes ou ensaios, tipos de festa,
  adicionais, horários, datas fechadas ou folgas, campanhas; só vê fica sem botões), src/ui/campos.js;
  test/modulos-base.test.mjs. Testado no Chromium contra o STG: mudar acesso e desfazer, pacote novo e desativado,
  folga nova, apagada e desfeita; quem só vê não tem "+" nem lápis.
5: supabase/functions/convidar/ (função do Supabase que manda o convite; D28 no 07, 04), publicar.mjs, a tela
  /convite (src/telas/convite.js: nome e senha, entra na conta do convite; link vencido e conta no limite do plano
  dizem o motivo), sessao.erroDoConvite(); test/convite.test.mjs. Função publicada no STG (versão 1); na produção
  ainda não (falta a permissão para publicar). Testado no STG sem mandar e-mail: o link de convite (gerado no
  banco, igual ao do e-mail) aberto no celular leva a /convite, a pessoa cria a senha e entra só com Início, Agenda
  e Mais, sem "+"; a função barra sem login (401), convite de outra conta (404), vencido (409), endereço de fora (400).
6: /comecar (src/telas/comecar.js: nicho, nome e WhatsApp com máscara, módulos na ordem do menu, tipos de festa
  com cor ou ensaios com duração; respostas no aparelho; a conta nasce no fim, D29) e /cadastro (src/telas/cadastro.js
  com o Cloudflare Turnstile; sem a chave, leva ao WhatsApp; D30); api/config.js entrega cadastroAberto; CSP com o
  Turnstile; test/onboarding.test.mjs. 7: src/modulos/inicio/primeiros-passos.js (4 itens que se marcam pelo banco,
  esconder com desfazer, importar datas digitando ou por CSV, D31); test/primeiros-passos.test.mjs.
8, ponta a ponta no localhost contra o STG (Chromium, celular e computador): um usuário novo passou pelo onboarding
  de eventos e outro pelo de fotografia (contas em teste de 7 dias, módulos e ordem do menu, tipos de festa com cor,
  ensaios com duração); o dono importou datas digitando e por CSV (fuso, duração, tipo pelo nome); convidou em
  Equipe uma pessoa só com a Agenda (só vê); ela abriu o link no celular, criou a senha e entrou só com Início,
  Agenda e Mais, sem "+"; com o login dela, o banco não deixa criar, mudar nem apagar festa, nem criar tipo, nem
  ver valores, pedidos, contratos ou outra conta, nem se dar acesso. Testes do banco: local e STG passando (o 010
  olhava todos os convites do STG; corrigido). npm test: 93 passando. O /cadastro aberto foi visto com a chave de
  teste da Cloudflare (sem cadastrar: o STG segue com o cadastro fechado).
O e-mail de verdade não foi testado: o link do convite foi gerado no banco e a chamada da função, interceptada no
  teste da tela (a função em si foi testada à parte no STG). Usuários e contas de teste apagados; semente rodada.
Depois de trazer a main (Missão 4): o logo das Configurações dava 403 (aviso da 4C); resolvido pela migração
  20261029190000_armazenamento_leitura.sql (bloco A, STG e produção) e conferido pela tela no STG.
Função convidar na produção desde 29/10 (com o ok da Renderiza; publicada sozinha com --so convidar, sem
  republicar a avisar-pedido): sem login dá 401, conferido sem mandar e-mail. Falta (da Renderiza): criar o
  Turnstile para abrir o cadastro (D30, 04) e testar um convite com um e-mail de verdade.
Depois de pronta, a pedido da Renderiza (29/10): o onboarding virou um trilho (D33; 09, "Como ficou, um trilho";
  10, "Tema do nicho"): boas-vindas com o roteiro, escolha única que segue sozinha com check e animação, a cor do
  nicho na tela (verde dos eventos, vinho da fotografia, dos exemplos), a pergunta nova "Você já tem site?"
  (contas.ajustes.onboarding.site) e "Montando o seu painel" com um check por parte. Arquivos: src/telas/comecar.js
  (reescrito), src/telas/acesso.js (painelDaMarca, temaDoNicho), estilo.css seções 1 (tokens do nicho) e 16;
  test/onboarding.test.mjs. Testado no STG: eventos no celular e fotografia no computador, do zero ao Início.
  /api/config passou a dizer o commit no ar (versao; 04, Vercel): o push a4f92d1 não chegou à produção em 25
  minutos, o seguinte (aabb9bc) entrou em 1 minuto. Na produção: aabb9bc em diante.
```

```
Missão 2 · bloco A (banco) · branch claude/painel-renderiza-setup-ztnrzy · atualizada em 29/10 · NA MAIN (29/10)
Feito: o banco inteiro do 05, em 6 migrações (painel-clientes/supabase/migrations/), aplicadas no STG e na produção:
  20261029110000_contas_e_acesso: modulos (os 7 da página de venda), contas, pessoas, convites, contas_modulos,
    equipe_renderiza, acessos_suporte, termos_aceites; pode(), pode_algum(), minhas_contas(), cadastrar_conta(),
    aceitar_convites(); travas (último dono, limite de pessoas, o dono não muda situação/prazo/código).
  20261029110100_negocio_e_dia_a_dia: tipos_reserva, servicos, adicionais, horarios, bloqueios, campanhas, clientes,
    clientes_fichas, pedidos, reservas, reservas_adicionais, reservas_valores, reservas_checklist, compromissos,
    lista_espera, parcelas, modelos_contrato, contratos, entregas; chaves compostas com a conta; situacao(cliente),
    fechar_pedido(), juntar_clientes(); contrato com hash e congelado no aceite.
  20261029110200_historico_site_e_admin: atividades (gatilhos, sem valores), sites, sites_versoes, sites_previas,
    entradas, pagamentos, erros_front; registrar_entrada(), admin_indicadores(); pedidos no tempo real.
  20261029110300_armazenamento: buckets logos, site-imagens e privado, com as políticas por pasta da conta.
  20261029112300_regras_sem_visitante: funções de regra fechadas ao visitante (aviso do Supabase no STG).
  20261029112900_apagar_conta_inteira: apagar uma conta inteira sem erro (achado pela semente).
  A semente (supabase/semente/semente.mjs): Villa Alecrim e Estúdio Ciranda lidos de exemplos/dados-*.js, no local e
  no STG (no STG desde 29/10: 2 contas, 6 pessoas, 24 festas, 82 ensaios, 287 parcelas); contato@ é o dono das duas.
  Testes em supabase/testes/ (010, 020, 030, 090) e o script no-stg.mjs, que roda os mesmos testes no STG e desfaz.
  Documentos: 05 (o banco como está, as funções), 07 (D21 a D27), 09 (o onboarding de eventos cria os tipos de festa).
Testado: npm test da pasta (56, com os testes do banco e test/semente.test.mjs); node scripts/migrar.mjs local
  (6 arquivos de teste); os mesmos 6 no STG (node supabase/testes/no-stg.mjs: tudo passa e nada fica); a semente
  duas vezes seguidas no local e uma no STG, conferida entrando como cada pessoa por SQL (o dono vê as duas contas;
  Rafael não vê parcelas mas vê valores pelos Contratos; Léo não vê valores, contratos nem pedidos; Duda não vê a
  Villa); na produção: 34 tabelas, todas com RLS, o visitante sem acesso a nenhuma, nenhuma conta; avisos de
  segurança do Supabase nos dois: só os esperados (abaixo).
Ficou de fora (é de outras missões): as funções públicas publico_* (agenda online e Meu site na Missão 4; aceite do
  contrato na Missão 3, bloco E), o envio do convite (servidor com a chave secreta, bloco B), a validação do JSON do
  Meu site antes de publicar (Missão 4) e quem publica no Meu site (Missão 4 decide).
Decisões no caminho: no 07, D21 a D27. Migração aplicada não se edita: as correções vieram em migrações novas.
Migrações aplicadas (STG / produção): as 6, nos dois, em 29/10. Semente só no STG.
Testes no STG com a semente lá: os testes usam códigos (t-villa-alecrim) e nomes (Marina Teste) próprios e só
  contam o que é deles; as datas comparadas no fuso da conta (passam a qualquer hora). Numa das rodadas do npm test
  da pasta (29/10), 1 teste falhou e não voltou a falhar em 25 rodadas seguidas; a saída se perdeu. Se voltar,
  guarde a saída.
Pedidos do bloco B ao banco (regra nova da main): chegam em "Avisos entre sessões"; quem continuar o bloco A atende
  com migração nova (nunca editando as aplicadas), STG primeiro, nesta mesma branch.
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

```
Missão 4 · bloco B (Meu site no site) · branch claude/painel-renderiza-roadmap-jfhmpp · atualizada em 29/10 · NA MAIN (29/10, com o ok da Renderiza)
Feito: contrato de conteúdo v1 fechado (03, "O formato do conteúdo"); ferramentas/meu-site/meu-site.js (o script que vai
  no site: pede a versão publicada com 1,5 s de espera, guarda 24 h no navegador, prévia por ?rz-previa=, volta à
  inicial no 404; e a biblioteca validar/aplicar/extrair); marcações data-site-* em ferramentas/demo/gerar.py e
  gerar-eventos.py (+ --saida); runtime.js com window.DEMO_RUNTIME; scripts/virar-site.mjs com "painel": { codigo }
  (e aceitando uma pasta); scripts/versao-final.mjs; ferramentas/meu-site/extrair.mjs (conteúdo inicial = mapa do
  site); site de teste test/site-teste/ (Villa Alecrim, fictícia, fotos desenhadas na hora); CONTEXTO.md avisa as
  sessões das demos.
Testado: test/meu-site.test.mjs (15, no npm test da raiz: 175 passam): validação, destaque, destinos, iniciais;
  no Chromium, o site de teste com o painel imitado: fora do ar/500/JSON ruim/404 = inicial sem erro; versão
  publicada (textos, botões, imagens, listas com ícone mantido, seção escondida, avaliações, contato e carrossel
  refeito); texto com HTML entra como texto; imagem de fora e link javascript: recusados; demora de 2,2 s não
  muda a página e fica guardada; 24 h; 404 apaga a guardada; guardada → painel sem sobra; prévia; extrair →
  aplicar não muda nada; versão final sem script, offline, com imagem baixada. Visual das demos: capturas antes e
  depois idênticas pixel a pixel (390 e 1280 px), nos estilos comum e gala e numa variação com grade, foto
  horizontal e estilos de ótica. painel-clientes: 54 passam (não mexi lá).
Ficou de fora (anotado no 03): cores e ordem das seções, posição dos botões, endereço e horário, a mensagem da
  consulta de data, e as marcações nos geradores de fotografia e odonto (quando houver cliente desses nichos).
Próximo passo (blocos A e C): a API pública e as imagens como em 03, "O que o painel entrega"; a montagem guarda o
  extrair.mjs em sites.conteudo_inicial; o editor valida com a mesma validar().
Decisões no caminho: marcações data-site-* (data-rz já é usado pela faixa de preço das demos de fotografia);
  rótulo de botão como texto direto, sem <span> (há CSS de span nos botões e mudava o tamanho da letra); destaque
  só nos títulos; um campo inválido descarta a versão inteira; resposta depois de 1,5 s só vai para o cache;
  avaliações e contato pelo DEMO_CLIENT do runtime (na versão final, gravados no texto do script).
Migrações aplicadas: nenhuma (não mexe no banco).
```

```
Missão 4 · bloco A (API pública e agenda online) · branch claude/painel-renderiza-roadmap-jfhmpp · atualizada em 29/10 · NA MAIN E NA PRODUÇÃO (falta a chave do Brevo)
Feito: migrações 20261029135228_publico_agenda (publico_disponibilidade, publico_pedido, publico_tentativas e ajudantes
  fechados ao visitante) e 20261029141139_aviso_de_pedido (aviso_do_pedido, pedidos_avisos); API na Vercel em
  painel-clientes/api/publico/ (agenda, pedido, saude; _comum.js) servida também pelo npm run dev; vercel.json com a API
  pública fora do no-store; .gitignore da raiz ignorava api/publico/ (exceção posta); função do Supabase
  supabase/functions/avisar-pedido (index.js + logica.js); a página /agenda/ (ferramentas/demo/agenda-online/: modelo
  agenda.html e gerar.mjs) e o virar-site.mjs com "painel": { "agenda": true } (link na seção de consulta; "meuSite":
  false; "api" passou a ser a base da API pública); site de teste com a agenda ligada.
Aplicado: as duas migrações no STG (29/10); avisar-pedido publicada no STG (versão 1, com uma cópia temporária do
  publicar.mjs da 2B, que entra na main com ela); no STG, o site villa-alecrim para a Villa Alecrim da semente.
Testado: supabase/testes 040 e 041 (local e STG); painel-clientes/test publico (11) e avisar-pedido (6); raiz
  test/agenda-online (5, no navegador com a API imitada); de ponta a ponta no STG pelo npm run dev: disponibilidade
  real, pedido gravado com a pré-reserva, turno repetido = ocupada, outro domínio = 403, aviso registrado; a página
  /agenda/ contra o STG no celular e no computador (festa → data → turno → convidados → pacote → contato → pronto) e
  fora do ar (vira WhatsApp). No STG ficaram 3 pedidos de teste na Villa Alecrim ("pode apagar" na mensagem).
Produção (29/10, com o "pode" da Renderiza): as duas migrações pelo migrar.mjs e a avisar-pedido publicada sozinha
  (o publicar.mjs da 2B publica todas as funções, e a convidar é decisão da 2B); conferido só lendo: funções e
  permissões no banco, e a API no endereço oficial (saude 200; site e agenda inexistentes 404).
Falta (depende da Renderiza): a chave de API do Brevo (BREVO_API_KEY) nos segredos das funções dos dois projetos
  (Supabase → Edge Functions → Secrets; nunca pelo chat). Depois, pedir à sessão um pedido de teste no STG para
  conferir o e-mail.
Ficou para depois: a agenda da fotografia (horários e campanhas com vagas, lista de espera): quando houver cliente
  de fotografia com agenda online; hoje a página e a função atendem eventos (turnos por dia).
Decisões no caminho: 07, 29/10 (agenda online). O aviso marca o pedido como avisado mesmo sem a chave do Brevo (não
  reenvia depois).
Migrações aplicadas (STG / produção): 20261029135228_publico_agenda (29/10 / 29/10), 20261029141139_aviso_de_pedido (29/10 / 29/10).
```

```
Missão 4 · bloco C (Meu site no painel) · branch claude/painel-renderiza-roadmap-jfhmpp · atualizada em 29/10 · FEITO, NA MAIN (banco na produção)
Onde está: tudo na main (29/10). O servidor: migração 20261029141746_publico_site, teste 042,
  api/publico/site/[codigo]/ (index e previa), api/publico/imagens/[...caminho].js. O editor: src/modulos/meu-site/
  (index.js, conteudo.js e a cópia meu-site.js) e test/meu-site.test.mjs; o { trocar } no enviarArquivo
  (src/adaptadores/supabase.js). A semente põe na Villa Alecrim o Meu site e o site villa-alecrim (para testar no STG
  e numa prévia: entrar como dono da Villa e abrir Meu site).
Conferido de novo na casca final (depois da 2B e da Missão 3): editar, foto, publicar, a API e o site de teste, e
  voltar ao entregue. A miniatura da foto enviada passou a ser data: (a CSP do painel bloqueia blob:).
Feito: o editor por seção (03, "No painel"): lista na ordem da página com "Não publicado"; gaveta com textos, botões,
  fotos (WebP no aparelho, nome novo a cada envio, endereço do painel), listas e "aparece no site"; contato e
  WhatsApp; salvar no rascunho com desfazer (espera a foto que está subindo); prévia; publicar; versões com "Usar
  esta"; voltar ao site como foi entregue; "só vê" sem botões; avisos de desconectado e versão final.
Testado: painel-clientes npm test 110 passam (8 do meu-site, um confere a cópia da validar()); raiz 180 passam; de
  ponta a ponta no STG pelo npm run dev com um usuário temporário que só tinha "edita" no Meu site (apagado depois):
  12 seções na ordem; título e foto novos → rascunho → publicar → a API devolve a versão nova, a foto sai pelo
  /api/publico/imagens (200, image/webp, cache de 1 ano) e o site de teste (test/site-teste, servido local) mostra
  as duas; prévia com código mostra o rascunho só para quem tem o link; voltar ao entregue + publicar → o site
  volta ao original; "só vê" sem publicar nem editar; celular (390 px) e computador. Nenhum erro de script.
No STG ficou: o conteudo_inicial do site villa-alecrim (do extrair, com "ordem") e 6 versões publicadas de teste
  (a última = o site como foi entregue), sem autor (o usuário temporário foi apagado). Pode apagar.
Produção: publico_site aplicada em 29/10 (com o "pode" da Renderiza); a produção ainda não tem nenhum site cadastrado.
Ficou de fora: miniatura de cada seção na lista (o 03 pedia; as fotos da versão inicial ficam no domínio do site,
  que no começo não existe: entra quando o piloto tiver site); limpar do Storage as fotos que nenhuma versão usa
  (o gratuito tem 1 GB; rever quando houver clientes); mudar a ordem das seções e as cores (03, "Ficam para depois").
Decisões no caminho: 07, 29/10 (Meu site no painel). Salvar com botão, não a cada tecla.
Migrações aplicadas (STG / produção): 20261029141746_publico_site (29/10 / 29/10).
```

## Migrações aplicadas

Uma linha por migração; marque a data em cada banco logo depois de aplicar (regras em `08`: sempre STG primeiro).
Antes de aplicar uma nova, confira esta lista e a do próprio banco.

| Arquivo | Missão | Branch | STG | Produção |
|---|---|---|---|---|
| `20261029003422_trilhos_teste.sql` (teste, só o comentário do schema `public`) | 1 | `claude/missao-1-trilhos-setup-wwahf8`, reaplicada pela `claude/clever-albattani-u37i0u` | 29/10/2026 (`qxcxllhmtodsptxffbhx`, São Paulo) | 29/10/2026 (`hxzsiiqhlqxuqkevskwb`, São Paulo) |
| `20261029110000_contas_e_acesso.sql` (contas, pessoas, convites, módulos, `pode()`) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029110100_negocio_e_dia_a_dia.sql` (serviços e o dia a dia, com o cliente no centro) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029110200_historico_site_e_admin.sql` (histórico, Meu site, Admin, tempo real dos pedidos) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029110300_armazenamento.sql` (buckets e políticas do Storage) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029112300_regras_sem_visitante.sql` (funções de regra fechadas ao visitante; aviso do Supabase) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029112900_apagar_conta_inteira.sql` (apagar uma conta inteira sem erro; achado pela semente) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029135228_publico_agenda.sql` (agenda online: `publico_disponibilidade`, `publico_pedido`, `publico_tentativas`) | 4A | `claude/painel-renderiza-roadmap-jfhmpp` | 29/10/2026 | 29/10/2026 |
| `20261029141139_aviso_de_pedido.sql` (aviso por e-mail de pedido novo: `aviso_do_pedido`, `pedidos_avisos`) | 4A | `claude/painel-renderiza-roadmap-jfhmpp` | 29/10/2026 | 29/10/2026 |
| `20261029141746_publico_site.sql` (Meu site: `publico_site`, `publico_previa`) | 4C | `claude/painel-renderiza-roadmap-jfhmpp` | 29/10/2026 | 29/10/2026 |
| `20261029190000_armazenamento_leitura.sql` (leitura do Storage para quem é da conta: sem ela, trocar e tirar o logo davam 403; aviso da 4C) | 2A | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029203000_fechar_pedido_confirma.sql` (fechar um pedido que já tem reserva confirma a pré-reserva e ajusta a data) | 3C | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261029220000_publico_contrato.sql` (o aceite do contrato pelo link: `publico_contrato` e `publico_aceitar_contrato`) | 3E | `claude/painel-renderiza-setup-ztnrzy` | 29/10/2026 | 29/10/2026 |
| `20261030120000_minhas_contas_suporte.sql` (Admin: minhas_contas traz a conta em que a Renderiza está em suporte) | 5A | `claude/painel-renderiza-setup-ztnrzy` | 30/10/2026 | — (espera o "pode": `drop` de função) |

## Avisos entre sessões

Recado que outra sessão precisa saber (mudou um nome de coluna, travou numa dependência, achou um bug fora da sua
área). O mais novo em cima.

| Data | Missão | Recado |
|---|---|---|
| 30/10/2026 | 5A → Renderiza, todas | **Admin pronto (na `main`).** (1) **Ninguém está na equipe Renderiza na produção** (`equipe_renderiza` vazia), então ninguém abre o Admin lá. Quem a Renderiza quiser como admin entra uma vez no painel e depois, no Supabase da produção (SQL Editor): `insert into public.equipe_renderiza (usuario_id, nome) select id, 'Nome' from auth.users where email = 'e-mail@da.pessoa';`. Quem é da equipe e não é de nenhuma conta cai direto no Admin. (2) **A migração `20261030120000_minhas_contas_suporte.sql` está no STG; na produção, espera o "pode"**: ela faz `drop` e `create` da função `minhas_contas` (nenhum dado é apagado), e o `scripts/migrar.mjs` trava todo `drop` na produção (08, regra 8). Com o "pode": `node scripts/migrar.mjs producao --projeto hxzsiiqhlqxuqkevskwb --pode-destrutivo`. Sem ela, o Admin funciona, menos o "Entrar para ajudar" (a conta não abre). (3) `minhas_contas()` ganhou a coluna `suporte_ate` (05). (4) Fora do `src/admin/`, pequeno: `src/app.js` (rota do Admin sem conta), `src/telas/contas.js`, `src/sessao.js` (`carregarPessoa` sem `pessoa_id`), `src/telas/casca.js` (a faixa do suporte), `estilo.css` seção 23. |
| 30/10/2026 | 4 → 3F, todas | **O bloco F da Missão 3 (Início e exportar) está terminado e na `main`**, junto com a correção do "Pacote" na Agenda: a sessão do bloco parou no limite, e a da Missão 4 testou de ponta a ponta no STG, documentou e subiu. **Missões 3 e 4 feitas; a próxima é a 5.** Quem tiver branch antiga (`claude/painel-renderiza-setup-ztnrzy`), traga a `main` antes de mexer. |
| 30/10/2026 | Vercel → todas | **A produção do painel está no `64c9d8d` por um deploy feito pela API** (conferido: `/api/config` e os arquivos no ar iguais aos da `main`). **Os pushes não estão gerando deploy** desde o `e531d90` (22h36 de 29/10, Brasília), nos dois projetos: a Vercel nem registra o push; conta sem bloqueio, limite e espaço descartados, GitHub ligado. O projeto do painel tem `createDeployments: "disabled"` (o `renderiza`, `enabled`). Enquanto isso: depois de um push na `main`, conferir o `versao` do `/api/config`; se não andar, alguém com token da Vercel cria o deploy da `main` pela API (ou por um Deploy Hook). A Renderiza confere o ícone da Vercel no commit no GitHub e, na Vercel, `renderiza-painel-clientes` → Settings → Git. Produção tem uma conta só, "Espaço de teste" (eventos, em teste), com o Meu site ligado e **nenhum site cadastrado**. |
| 30/10/2026 | Vercel → Renderiza, todas | **Limpeza feita, e a causa real do deploy parado era outra.** (1) `node scripts/limpar-deploys-vercel.mjs renderiza --apagar`: 156 deploys apagados; o projeto `renderiza` ficou com 4 (o que está no ar e os 3 de produção antes dele, todos de 29/10). **A Renderiza já pode apagar o `VERCEL_TOKEN`** (e tirar das variáveis do ambiente); ele não era só do projeto: também lia o `renderiza-painel-clientes`. (2) Mesmo depois, o `/api/config` seguia em `aabb9bc`: os 3 deploys de produção do painel depois dele (`092adfd`, `7321ebe`, `e531d90`) deram **ERROR no passo "ignore"**, não por espaço nem por limite: o `ignoreCommand` saía com 128 (`fatal: bad object aabb9bc…`), porque o clone da Vercel só tem os últimos 10 commits e o `aabb9bc` ficou de fora; na Vercel, só 1 faz o build (outro código falha). Sem correção, não destravaria nunca. (3) **Corrigido** com `|| exit 1` no fim do `ignoreCommand` (`painel-clientes/vercel.json`; teste agora pede 1, não só "diferente de 0"; `04`, Vercel). Chegando na `main`, o próprio push faz o build da produção; conferir o `versao` do `/api/config`. (4) O `ignoreCommand` proposto para o `vercel.json` da raiz (aviso abaixo) precisa do mesmo `|| exit 1`. |
| 29/10/2026 | 4C → Renderiza, próxima sessão | **Vercel sem espaço de deploys** (118 GB de 10 GB no plano grátis): cada deploy do projeto `renderiza` (o site da Renderiza, com demos, flyers e vídeos) tem uns 750 MB e sai a cada push de qualquer branch. (Corrigido em 30/10: o painel parado em `aabb9bc` **não era o espaço**, era o `ignoreCommand` saindo com 128; ver o aviso de 30/10.) **Para limpar de uma vez:** a Renderiza cria um token só do projeto `renderiza`, com validade de 1 dia (vercel.com/account/tokens), e põe como `VERCEL_TOKEN` nas variáveis do ambiente (nunca no chat); uma sessão nova roda `node scripts/limpar-deploys-vercel.mjs renderiza` (só mostra) e, conferido, com `--apagar` (fica o que está no ar, os últimos 3 de produção e o que está montando). Depois: `curl -s https://painel.renderizaweb.com.br/api/config` deve mostrar o último commit da `main`; se não, Redeploy no `renderiza-painel-clientes`. E a Renderiza apaga o token. **Esperando o ok da Renderiza:** um `ignoreCommand` no `vercel.json` da raiz para o site não montar quando só mudam `painel-clientes/`, `docs/painel-clientes/` ou `test/` (testado: nesses casos pula; sem commit anterior, monta), terminando em `|| exit 1` como o do painel. |
| 29/10/2026 | 4C → 2A, todas | **Semente com a ponte da Missão 4:** a Villa Alecrim ganhou o módulo Meu site e o site `villa-alecrim` (domínios `villa-alecrim.teste` e `localhost`, conteúdo inicial em `test/site-teste/conteudo-inicial.json`). Rodar a semente de novo apagava os dois (aconteceu às 21h05 de 29/10). No STG eu só inseri os dois, sem rodar a semente (não apaguei nada). `test/semente.test.mjs`: o teste de "só e-mails fictícios" agora pede algo antes do @ (o `@villa.alecrim.teste` do site de teste é o Instagram, não e-mail). |
| 29/10/2026 | 4C → Renderiza | **O deploy da produção continuava parado às 21h40 (Brasília) de 29/10:** o `/api/config` dizia `aabb9bc` (16h40) e os arquivos no ar (Atendimento, Contratos, Agenda) eram os desse commit, conferidos um a um. As horas do aviso abaixo são UTC (20h40 UTC = 17h40 em Brasília). |
| 29/10/2026 | 3E → 3F, 5, todas | **Contratos pronto (na `main`).** (1) **3F**: "contratos esperando aceite" (09) são os `contratos` com `situacao = 'enviado'` (há quantos dias: `enviado_em`); a tela abre um contrato com **`/contratos?contrato=<id>`** e um novo com **`/contratos?novo=contrato[&reserva=<id>]`**. (2) **5B (revisão de segurança)**: as funções públicas novas são `publico_contrato` e `publico_aceitar_contrato` (05); a página `/c/<código>` chama o banco direto com a chave pública. (3) **Todas**: o Pix da conta fica em `contas.ajustes.pix` (`chave`, `nome`), editado em Configurações (só o dono); o Financeiro pode usar no lembrete. (4) O rewrite de `/c/:codigo` é o **primeiro** do `vercel.json` (antes do app); quem mexer nos rewrites mantém a ordem. (5) `.rz-linhas--parcelas` virou **`.rz-linhas--com-botao`** (10). |
| 29/10/2026 | 3D → 3E, 3F, todas | **Financeiro pronto (na `main`).** (1) **3E**: a festa no Financeiro (`/financeiro?reserva=<id>`) grava o valor total, o sinal e o desconto em `reservas_valores` (quem tem Contratos também edita): o contrato pode ler dali e levar de volta com o mesmo link; as parcelas são lançadas pelo Financeiro ("Lançar parcelas"). (2) **3F**: os números do mês saem de `resumo(parcelas, hoje)` em `src/modulos/financeiro/logica.js` (recebido no mês, falta no mês, a receber em 30 dias, atrasadas); "Registrar pagamento" é `/financeiro?novo=pagamento`, uma parcela é `/financeiro?parcela=<id>`. (3) **Todas**: com a chave estrangeira composta (`conta_id` + `reserva_id`), o banco devolve `reservas_valores` dentro de `reservas` como **lista**, não objeto (pegue o `[0]`). (4) `.rz-link` agora é `inline-flex` (ícone e texto na mesma linha); `--rz-grafico-1` e `-2` são as cores de gráfico (10). |
| 29/10/2026 | 3A → 3D, 3E, 3F, todas | **Clientes pronto (na `main`).** A ficha leva a **`/financeiro?reserva=<id>`** e **`/financeiro?cliente=<id>`** (os pagamentos), **`/contratos?contrato=<id>`** e **`/clientes?aba=entregas&entrega=<id>`**: o Financeiro (3D) e Contratos (3E) abrem o detalhe ao ver esses parâmetros. Clientes abre **`/clientes?cliente=<id>`** e **`?novo=cliente`**; o Atendimento aceita **`?novo=pedido&cliente=<id>`** (pula o "Para quem?"). **`src/app.js` mudou (pequeno):** trocar de tela fecha as gavetas e folhas abertas (antes, um link de dentro da gaveta deixava ela por cima da tela nova). |
| 29/10/2026 | 3B → 3A, 3D, 3F | **Agenda pronta (na `main`).** (1) A gaveta da festa leva a **`/financeiro?reserva=<id>`** ("Ver os pagamentos", só para quem tem Financeiro) e a **`/clientes?cliente=<id>`**: o Financeiro (3D) e Clientes (3A) abrem o detalhe ao ver esses parâmetros. (2) A Agenda abre **`/agenda?reserva=<id>`** e **`/agenda?dia=aaaa-mm-dd`**: use nos links do Início (3F) e da ficha (3A). (3) O nome do negócio com a preposição certa ("do espaço Villa Alecrim", "no Estúdio Ciranda") é `doNegocio(nome, nicho, "do")` de `src/nichos/index.js`: use nas mensagens prontas. (4) Conflito de horário e "horário livre" seguem a regra da agenda online (`seguraHorario` e `horariosLivres` em `src/modulos/agenda/logica.js`); sem acesso ao Atendimento, a Agenda trata toda pré-reserva como segurando a data (não sabe se veio da agenda online). |
| 29/10/2026 | 3C → Renderiza, todas | **Deploy da produção parado desde as 20h40 (UTC):** três pushes na `main` (`a740cea`, `ae4a698`, `b4cee64`) não chegaram; o `/api/config` continua em `aabb9bc`. Às 19h40 um push novo tinha destravado; agora não. Causa provável: o limite do plano grátis da Vercel (100 deploys por dia, somando as prévias de cada branch). Para destravar: na Vercel, projeto `renderiza-painel-clientes`, Deployments, olhar o do último commit da `main` e, se for limite, esperar e clicar em Redeploy. Enquanto isso, a produção não tem o Atendimento, a Agenda, Clientes, o Financeiro e Contratos novos (o banco deles já está lá e é compatível com a tela antiga). Ainda parado no fim do bloco E (`aabb9bc`). |
| 29/10/2026 | 3C → 3A, 3B, 3F, 1 | **Atendimento pronto (na `main`).** Para os outros blocos: (1) **tempo real**: `banco.ouvir(tabela, { filtro, aoMudar })` devolve a função que para; devolva-a no fim do `montar` e o `app.js` chama ao sair (04, "Tempo real"); (2) o Atendimento leva a **`/agenda?reserva=<id>`** ("Ver na Agenda") e a **`/clientes?cliente=<id>`** (o "Ver o cliente"): a Agenda (3B) e Clientes (3A) abrem o detalhe quando virem esses parâmetros; (3) **visita** marcada no Atendimento vira `compromissos` tipo `visita` com `pedido_id` e `cliente_id`: a Agenda mostra; (4) **3F**: o "Anotar o primeiro pedido" dos primeiros passos já funciona (`/atendimento?novo=pedido`); o número de pedidos novos no menu (badge) ficou para quem mexer na casca. Fora do "Mexe em" do 3C, pequeno: `src/adaptadores/supabase.js` (`ouvir`), `src/app.js` (desmontar), `src/ui/gaveta.js` (`foco: "fechar"`), `estilo.css` seção 17. |
| 29/10/2026 | 3C → 3B, 4A | **`fechar_pedido` mudou** (migração `20261029203000`, STG e produção; `05`): se o pedido já tem reserva (a pré-reserva da agenda online), "Fechar" confirma (ou mantém pré-reserva, como a pessoa escolher) e ajusta a data e o horário, sem criar outra reserva. Antes, a pré-reserva ficava como estava e vencia em 48 horas. Reserva cancelada ou realizada não muda. |
| 29/10/2026 | 2B → todas | **Para conferir o deploy da produção:** `curl -s https://painel.renderizaweb.com.br/api/config` mostra `versao` (o commit no ar). Se depois de uns 5 minutos ainda for o commit anterior, o deploy não entrou: um push novo que mude `painel-clientes/` destravou em 29/10 (o `a4f92d1` ficou parado; o `aabb9bc` entrou em 1 minuto). Commit só de documentos não faz deploy (o `ignoreCommand`). |
| 29/10/2026 | 2B → 5 | **Onboarding em trilho (D33):** a resposta "Você já tem site?" fica em `contas.ajustes.onboarding.site` (`tenho`, `instagram` ou `nao`; `null` se não respondeu): bom para o Admin mostrar na conta (é um lead de site para a Renderiza). O tema do nicho é só do onboarding; dentro do painel, a cor da conta continua "depois" (`10`). |
| 29/10/2026 | 2B → todas | **Função `convidar` na produção** (versão 1), com o ok da Renderiza. O `publicar.mjs` ganhou `--so <nome>` para publicar uma função só, sem republicar as outras (a `avisar-pedido` ficou como estava). |
| 29/10/2026 | 2A → 4C, 2B | **Logo e imagens: resolvido no banco** (o aviso da 4C sobre o logo). Era pior: com "upsert", até o primeiro envio do logo dava 403, e "tirar" não funcionava. A migração `20261029190000_armazenamento_leitura.sql` (STG e produção) deixa ler pela API quem é da conta (`logos`) e quem vê o Meu site (`site-imagens`); os buckets já eram públicos. Conferido no STG pela tela Configurações (enviar e trocar) e pela API (apagar). O `{ trocar: false }` do Meu site continua valendo. |
| 29/10/2026 | 2B → 3, 4, 5 | **Telas base na `main`.** Para quem constrói módulo: o contexto (`src/app.js`) traz `conta` (de `minhas_contas`: `dono`, `acessos`, `modulos`, `ajustes`, `liberada`), `nicho` (`src/nichos/`: as palavras), `pessoa`, `pode(módulo, nível)`, `avisar` e `navegar`; as peças estão no [`10`](10-design-system.md) (gaveta, "Para quem?", estados, linhas, chips, campos, CSV). O "+" leva a `/<módulo>?novo=pedido|reserva|visita|pagamento|cliente`: cada módulo abre o formulário quando vê o `?novo=`. **3F:** `src/modulos/inicio/index.js` só monta os primeiros passos no topo (`primeiros-passos.js`, do bloco B); mantenha essa chamada. **4:** o item "copiar o link da agenda online" dos primeiros passos entra quando o link existir (D31). **5:** o Admin convida o dono pela mesma função `convidar` (lê o convite com o login de quem chama; a equipe Renderiza pode). |
| 29/10/2026 | 2B → 1 | **Fora do "Mexe em" do bloco B, pequeno, para o cadastro (D30):** `api/config.js` entrega `cadastroAberto` e `turnstile` quando existe `TURNSTILE_SITE_KEY`; `scripts/servidor.mjs` lê `PAINEL_STG_TURNSTILE_SITE_KEY`; a CSP do `vercel.json` ganhou `challenges.cloudflare.com` (script e frame), com o `test/esqueleto.test.mjs` acompanhando. Para abrir o cadastro: criar o site no Turnstile, a secreta no Auth dos dois projetos, a pública na Vercel e tirar o `disable_signup` (STG primeiro). |
| 29/10/2026 | 2B → 1, 5 | **Convite pronto** (D28 no `07`, `04`): a função do Supabase `convidar` (`painel-clientes/supabase/functions/`, pasta nova) manda o e-mail; publicar com `node supabase/functions/publicar.mjs stg` e `producao --projeto <ref>`. Publicada no STG; **na produção ainda não**. A tela `/convite` recebe o link. Fora do "Mexe em" do bloco B, pequeno e combinado com a Missão 1: `src/adaptadores/supabase.js` ganhou `cadastrar`, `funcao`, `enviarArquivo` e `urlPublica`; `src/app.js` e `src/rotas.js`, as telas novas (`/cadastro`, `/convite`, `/contas`, `/comecar`) e o contexto dos módulos (`conta`, `nicho`, `pessoa`, `pode`, `avisar`). Testes novos em `painel-clientes/test/`. A Missão 5 (Admin) convida o dono pela mesma função. |
| 29/10/2026 | 4 → 2B e todas | **Produção recebeu as 3 migrações da Missão 4** (`…135228_publico_agenda`, `…141139_aviso_de_pedido`, `…141746_publico_site`) e a função `avisar-pedido`, publicada sozinha: a `convidar` (2B) **continua fora da produção**, como estava. Quem rodar `node supabase/functions/publicar.mjs producao` publica as duas: só faça quando a 2B quiser a `convidar` na produção. |
| 29/10/2026 | 4C → 2B | (**Resolvido pela 2A**, migração `20261029190000`.) **O envio do logo (Configurações) deve falhar** com "new row violates row-level security policy": o Storage só deixa **trocar** arquivo (`upsert: true`, o padrão do `enviarArquivo`) com uma política de **leitura** (`select`) no bucket, e `logos` e `site-imagens` só têm as de enviar, trocar e tirar. Conferido no STG com `site-imagens` (mesmas regras): sem trocar passa, trocando dá 403. O Meu site já envia com `{ trocar: false }` (nome novo a cada foto). Para o logo: ou nome novo a cada envio (e tirar o antigo), ou uma migração com a política de leitura da pasta da conta (`pode(conta_da_pasta(name), 'configuracoes', 'ver')`). Não mexi (é da 2B). |
| 29/10/2026 | 4C → 2B | (**Já na `main`**, 29/10.) **O editor do Meu site está na branch `claude/painel-renderiza-roadmap-jfhmpp`, em cima da 2B** (merge até `cbe0c3b`). Dois arquivos da 2B mudaram lá, pequenos: `src/modulos/meu-site/index.js` (era o vazio do esqueleto; agora é o editor) e `src/adaptadores/supabase.js` (`enviarArquivo` ganhou o 5º parâmetro `{ trocar = true }`, sem mudar quem já chama). Quando a 2B for para a `main`, essa branch vai logo depois (nota de passagem do bloco C). |
| 29/10/2026 | 4C → 5 | **Para o Admin:** desconectar o Meu site é mudar `sites.situacao` para `desconectado` (ou `versao_final` depois de entregar a versão final): a API para de responder e o site volta à versão inicial. Ao cadastrar o site de um cliente, gravar em `sites.conteudo_inicial` a saída de `node ferramentas/meu-site/extrair.mjs <index.html>` (com `ordem`, a ordem das seções), senão o editor diz que o conteúdo não foi cadastrado. |
| 29/10/2026 | 4A → 3B, 3C, 2B | **Pedidos da agenda online já chegam no banco** (STG): `pedidos.origem = 'agenda_online'`, etapa `novo`, com `reserva_id` de uma reserva `pre_reserva` (que segura a data por 48 horas no site). O Atendimento e a Agenda mostram como qualquer pedido e reserva; "Fechar" (`fechar_pedido`) usa a reserva que já existe. Para testar: `npm run dev` e a página `/agenda/` do site de teste (`node test/site-teste/montar.mjs --api http://localhost:5180/api/publico/`), ou direto pela API. |
| 29/10/2026 | 4A → 2B | **`supabase/functions/avisar-pedido/`** é a segunda função do Supabase, ao lado da `convidar`: o `publicar.mjs` da 2B publica as duas (já publiquei a `avisar-pedido` no STG com uma cópia dele, sem commit). |
| 29/10/2026 | 4A → 2B e todas | **Migração nova no STG:** `20261029135228_publico_agenda.sql` (agenda online), na `main`. Antes de aplicar a sua, traga a `main` (08, regra 4). A produção ainda não tem: espera o ok da Renderiza. Tabela nova `publico_tentativas` (só para os limites da agenda online, sem dado de pessoa). |
| 29/10/2026 | 4A → 2A/2B | **`node supabase/testes/no-stg.mjs`: o `010_contas_e_acesso.sql` falha no STG** ("more than one row returned by a subquery"): a linha 107 busca `pessoas where nome = 'Rafael Teste'` sem filtrar a conta, e a semente tem outra pessoa com esse nome. No local passa. Sugestão: filtrar pela conta do teste, como os outros. Não mexi (é da 2A). |
| 29/10/2026 | 4B → 2A, 4A, 4C | **Meu site no site pronto** (contrato v1 no `03`). Para o painel cumprir: (1) `GET /api/publico/site/<código>` com o JSON do contrato (o `conteudo` da última publicada + `esquema`, `site`, `versao`, `publicado_em`), `404` para desconectado/versão final, **`Access-Control-Allow-Origin: *`** e `Cache-Control: public, max-age=0, s-maxage=60`; (2) a prévia em `/api/publico/site/<código>/previa?t=<sites_previas.codigo>`, `no-store`; (3) **imagens servidas pelo domínio do painel** (o script recusa outro endereço; ex.: rewrite `/imagens/sites/…` para o Storage `site-imagens`); (4) `sites.conteudo_inicial` = a saída de `node ferramentas/meu-site/extrair.mjs <index.html>`; (5) validar com a mesma `validar()` de `ferramentas/meu-site/meu-site.js`: a Vercel publica só `painel-clientes/`, então o painel guarda uma cópia e um teste confere que é igual. O formato de `sites`, `sites_versoes` e `sites_previas` do bloco A já bate com isso. |
| 29/10/2026 | 4B → demos | **Geradores com as marcações do Meu site** (`data-site-*` em `gerar.py` e `gerar-eventos.py`): o visual não muda (conferido pixel a pixel), mas não apague nem renomeie. O `runtime.js` expõe `window.DEMO_RUNTIME`. Rótulo de botão é texto direto dentro do `<a>`, sem `<span>`. |
| 29/10/2026 | 2A → todas | **O banco inteiro está no STG e na produção** (`05` descreve tudo). Para quem constrói: (1) quem decide o acesso é `pode(conta, módulo, 'ver' ou 'editar')`; a tela só esconde o que o banco já não entrega. (2) **Tabela nova** precisa de RLS e de `revoke all ... from anon`: o teste `supabase/testes/090_regras_gerais.sql` falha se faltar. (3) **Função aberta ao visitante** só com o nome `publico_*` (o mesmo teste confere); as outras com `revoke execute ... from public, anon`. (4) O histórico (`atividades`) é automático nas tabelas do dia a dia; tabela nova que precise dele ganha o gatilho `historico` (ver a migração `20261029110200`). (5) Testes do banco também rodam no STG: `node supabase/testes/no-stg.mjs`. |
| 29/10/2026 | 2A → 2B | **Para as telas:** `minhas_contas()` (escolher a conta e o menu: `liberada = false` é o aviso de teste vencido ou conta desligada; `modulos` são os ligados), `cadastrar_conta(nome, nicho, whatsapp, modulos, meu_nome)` (um teste por pessoa), `aceitar_convites()` (chamar logo depois de entrar), `registrar_entrada(conta, aparelho)` (ao entrar numa conta). Convite = linha em `convites` (só o dono grava) + o e-mail pelo servidor com `data: { nome_da_conta }`. Preferências: `pessoas.preferencias` (de cada um) e `contas.ajustes` (da conta: ordem do menu, primeiros passos escondidos). Onboarding de eventos: "Que festas vocês fazem?" cria `tipos_reserva` (D21, `09`). Equipe e Configurações são só do dono (D22); limite de 5 pessoas ativas no banco. Logo em `logos/<id da conta>/…`. |
| 29/10/2026 | 2A → 3, 4, 5 | **Já no banco para as missões seguintes:** `fechar_pedido()`, `juntar_clientes()` e `situacao(cliente)` (3A, 3C); o aceite do contrato grava `aceito_*` só por uma função `publico_*` (3E); `sites`, `sites_versoes`, `sites_previas`, o bucket `site-imagens` (só WebP, 2 MB) e os pedidos no tempo real (4); `equipe_renderiza` (vazia: a Renderiza cadastra quem entra no Admin, direto no banco), `acessos_suporte`, `pagamentos`, `entradas` e `admin_indicadores()` (5A). |
| 29/10/2026 | 2A | **Semente no STG:** `contato@renderizaweb.com.br` é o dono da Villa Alecrim e do Estúdio Ciranda (entra pelo "Esqueci a senha"); a equipe são usuários fictícios sem senha (`@villa-alecrim.teste`, `@estudio-ciranda.teste`), para a RLS ter quem testar. As datas saem do dia em que a semente rodou: para renovar, `node supabase/semente/semente.mjs stg` (apaga as duas contas de teste e grava de novo). |
| 29/10/2026 | 2A → 5B | **Avisos do Supabase que ficaram** (nos dois projetos): `authenticated_security_definer_function_executable` (as funções que o painel chama: esperado); `auth_leaked_password_protection` (a checagem de senha vazada do Auth está desligada; é configuração do Auth, para a revisão de segurança); e, de desempenho, políticas repetidas por tabela (uma para ver e outra para editar) e chaves sem índice próprio, que só pesam com muito dado. |
| 29/10/2026 | 2A | **Fora do "Mexe em" do bloco A, pequeno:** `painel-clientes/test/semente.test.mjs` (novo) e duas linhas na tabela de comandos de `painel-clientes/README.md`. |
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
