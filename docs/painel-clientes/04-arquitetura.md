# Arquitetura: como o painel fica de pé

Supabase (banco, login e arquivos) e Vercel (hospedagem), começando nos planos gratuitos. O que está marcado como
"proposta" depende de uma pergunta do `07`.

## O desenho

```
   Dono e equipe do cliente                          Cliente final
   (celular ou computador)                           (no site do cliente: domínio e Vercel do cliente)
            │                                                   │
            ▼                                                   │  agenda online · Meu site
   painel.renderizaweb.com.br  ◀───── API pública (/api/publico) ┘  (só o mínimo, com cache)
   Vercel: front estático + poucas funções
            │  login + chave pública
            ▼
   Supabase (projeto novo, São Paulo)
   Auth (login, convites) · Postgres com RLS · Storage (logos, imagens do Meu site)
            │
            └──▶ e-mail próprio (SMTP): convite, senha, aviso de pedido novo
```

## Princípios

1. **Separado do painel de prospecção.** Projeto Supabase e projeto Vercel próprios. Dado de cliente não se mistura com
   prospecção, as regras de acesso são outras (muitas contas, não um dono só) e um erro num lado não derruba o outro.
2. **Front estático, regras no banco.** Telas em HTML, CSS e JavaScript; quem decide o que cada pessoa vê é a RLS
   do banco. As funções da Vercel são poucas e finas (a API pública e o que precisar de chave secreta). Assim a
   hospedagem pode trocar (ex.: Cloudflare Pages) sem reescrever nada.
3. **A chave pública não abre nada sem login.** Toda tabela tem RLS. O que o público acessa sem login passa por
   funções pequenas, que devolvem só o mínimo (como `demo_liberada` e `registrar_visita` no painel de prospecção).
4. **O site do cliente nunca depende do painel para ficar de pé** (agenda online e Meu site têm fallback).
5. **Endereço público estável, no domínio da Renderiza.** Sites de clientes não apontam para o endereço do Supabase.
6. **O jeito de trabalhar do repositório:** JavaScript puro em módulos ES, sem bundler (como `painel/`), testes com
   `node --test`, Playwright para os fluxos principais (o Chromium já está no ambiente), migrações SQL versionadas.
7. **Um código para todos os nichos.** O nicho muda palavras, campos e telas opcionais por configuração
   (`nichos/eventos.js`, `nichos/fotografia.js`), nunca por cópia do código.

## Onde fica o código

Uma pasta nova **neste repositório**, com projeto próprio na Vercel apontando para ela:

```
painel-clientes/
  index.html                 a casca (login e o app)
  src/
    app.js  rotas.js  sessao.js
    adaptadores/supabase.js  supabase-js por CDN, versão fixa (como painel/src/adaptadores/supabase.js)
    telas/                   entrar, cadastro, convite, escolher a conta, exportar, aceite dos termos
    nichos/eventos.js  nichos/fotografia.js
    modulos/index.js         o registro de todos os módulos (nasce completo na Missão 1)
    modulos/inicio/  clientes/  agenda/  atendimento/  financeiro/  contratos/  meu-site/
            equipe/  configuracoes/  servicos/
    admin/                   Admin (só a equipe Renderiza): contas/ modulos/ pessoas/ pagamentos/ indicadores/
    ui/                      o design system (10): estilo.css (tokens e componentes), icones.js, formulario.js, fontes/;
                             depois, as peças dos exemplos: menu, abas, gaveta, tabela, calendário, "Para quem?"
  publico/                   páginas sem login: aceite de contrato (/c/<código>), termos (/termos), privacidade
                             (/privacidade)
  api/config.js              entrega a URL e a chave pública ao navegador (Missão 1)
  api/publico/               funções da Vercel da API pública
  supabase/migrations/       a estrutura do banco, em ordem
  supabase/functions/        funções do Supabase (Deno), como o envio do convite; publicar.mjs
  supabase/testes/           testes de RLS e das funções
  supabase/local/            a imitação do Supabase para o banco local de testes
  scripts/                   servidor local (npm run dev), migrações (scripts/migrar.mjs), backup e restauração
                             (scripts/backup.mjs, scripts/restaurar-backup.mjs; o agendamento é o
                             .github/workflows/backup-painel.yml da raiz)
  test/                      testes do front (node --test) e fluxos (Playwright)
  vercel.json  .vercelignore
```

- Por que no mesmo repositório: os documentos, os exemplos (que são a especificação das telas) e os geradores de
  site ficam juntos, e as sessões de IA já têm o repositório. A Vercel aceita vários projetos no mesmo repositório,
  cada um com a sua pasta raiz, e pula o build quando a pasta não mudou.
- Quando separar: quando entrar alguém de fora para desenvolver ou o repositório (pesado por causa das demos e
  vídeos) atrapalhar.
- Os exemplos são arquivos únicos de ~90 KB; no painel real eles viram módulos. O visual (CSS) e as funções de
  desenho das telas são reaproveitados.
- Cada missão do painel anda na sua branch; juntar e subir para a `main` é com a Renderiza (as demos continuam com o
  fluxo de sempre). Várias sessões trabalham ao mesmo tempo: regras em
  [`08-trabalho-em-paralelo.md`](08-trabalho-em-paralelo.md).

## Supabase

**Os projetos do Supabase (decidido em 28/10/2026):**

| Projeto | Conta do Supabase | Para quê |
|---|---|---|
| `gxdwluswpczlfgvzxqvg` (o de hoje) | a conta atual da Renderiza | **Painel de prospecção** (`painel/`). Não muda nada e não entra neste projeto. |
| `painel-renderiza-prod` · `hxzsiiqhlqxuqkevskwb` (`https://hxzsiiqhlqxuqkevskwb.supabase.co`) | **conta nova**, criada com `contato@renderizaweb.com.br` | **Produção** do Painel Renderiza: clientes reais. |
| `painel-renderiza-stg` · `qxcxllhmtodsptxffbhx` (`https://qxcxllhmtodsptxffbhx.supabase.co`) | a mesma conta nova | **STG** (homologação): dados fictícios, onde tudo é testado antes de ir para a produção. |

> Conferido pela sessão da Missão 1 em 29/10/2026, pela API do Supabase: os projetos se chamam "Painel Renderiza"
> (produção) e "Painel Renderiza STG", os dois na região São Paulo (`sa-east-1`), com Postgres 17 (o banco local
> dos testes é 16). São os segundos projetos: os primeiros (produção `wkwyhganenohmupcwthd` e STG
> `vzrmepxoigoszqtoxtlo`) tinham nascido nos EUA (`us-east-2` e `us-west-2`) e foram apagados pela Renderiza em
> 29/10/2026, quando só tinham a migração de teste.

- O plano gratuito permite 2 projetos ativos por pessoa dona ou admin, somando todas as organizações dela. Por isso o
  login da conta atual **não** entra como dono ou admin na conta nova (senão os limites se somam).
- O STG pausa sozinho depois de 1 semana sem uso; é só reativar no painel do Supabase.

- Os dois projetos novos no plano gratuito, região **São Paulo (`sa-east-1`)**: perto dos usuários e dos dados no
  Brasil.
- **Auth:** e-mail e senha, com confirmação de e-mail. Dois jeitos de a conta nascer (`02`, "Como a conta nasce e
  vive"): **cadastro sozinho**, que cria a conta em teste de 7 dias (com verificação contra robô, ex.: Cloudflare
  Turnstile), ou **criada pela Renderiza** no Admin, com convite ao dono. O dono convida a equipe.
  Senha mínima de 8 caracteres. Mais adiante: entrar com o Google, verificação em duas etapas.
- **Configuração do login, no repositório** (29/10/2026): nada se muda à mão no painel do Supabase. Os valores
  ficam em `painel-clientes/scripts/lib/auth.mjs`, os e-mails em `painel-clientes/supabase/emails/`, e
  `node scripts/auth.mjs` aplica pela API de gerenciamento (STG primeiro; produção com `--projeto <ref>`) e confere
  lendo de volta. Sem argumento, só compara os dois projetos com o repositório.

  | | Produção | STG |
  |---|---|---|
  | Endereço do painel (*Site URL*) | `https://painel.renderizaweb.com.br` | `http://localhost:5180` |
  | Endereços de retorno | `https://painel.renderizaweb.com.br/**` e `https://renderiza-painel-clientes.vercel.app/**` | `http://localhost:5180/**` e `https://renderiza-painel-clientes-*.vercel.app/**` (as prévias) |
  | Senha mínima | 8 | 8 |
  | Confirmação de e-mail | ligada | ligada |
  | Troca de e-mail | confirmada no endereço atual e no novo | igual |
  | Validade dos links | 1 hora (`mailer_otp_exp`), convite inclusive | igual |
  | Cadastro pela API | fechado (`disable_signup`) até a tela de cadastro com verificação contra robô (`06`) | fechado |

  Aplicado nos dois em 29/10/2026 e conferido lendo de volta e na prática, sem criar usuário: cadastro com senha
  de 7 caracteres volta `weak_password`; um link com endereço de retorno da lista volta para ele; qualquer outro
  (outro domínio, o localhost ou as prévias na produção) cai no endereço do painel. O curinga das prévias aceita
  qualquer projeto da Vercel cujo nome comece com `renderiza-painel-clientes-`; dá para fechar mais com o sufixo
  do time da Vercel no fim do nome, se um dia o STG tiver algo além de dados fictícios.
- **Os e-mails do login** (`supabase/emails/`, um arquivo por e-mail, o assunto é o `<title>`): confirmação de
  cadastro, convite, recuperar a senha, troca de e-mail e link de acesso. Em português, no jeito da Renderiza, com
  as cores do design system (`10`), sem imagem nem nada de fora, e com o link escrito embaixo do botão. Prévia no
  navegador, com dados fictícios: `node scripts/auth.mjs previa`. Só entram com SMTP próprio: no plano grátis, o
  Supabase recusa e-mail próprio com o envio padrão ("Email template modification is not available for free tier
  projects using the default email provider"). **Aplicados nos dois projetos em 29/10/2026**, com o Brevo (abaixo,
  em E-mail).
- **Convite com o nome da conta:** o modelo usa `{{ .Data.nome_da_conta }}` (os dados do usuário convidado) quando
  existe ("Villa Alecrim convidou você para o Painel Renderiza"); sem ele, "Você recebeu um convite". Quem envia o
  convite (Missões 2 e 5) manda `data: { nome_da_conta }`. O Supabase escapa o HTML dos valores; no assunto não vai
  variável (lá o escape apareceria como `&amp;`).
- **Envio do convite** (29/10/2026, D28): a tela Equipe grava a linha em `convites` e chama a função do Supabase
  `convidar` (`painel-clientes/supabase/functions/convidar/`, Deno; a lógica em `logica.js`, testada em
  `test/convite.test.mjs`). A função confere o login, lê o convite **com o login de quem chamou** (se a RLS não deixa,
  não manda nada), só aceita voltar para `/convite` do próprio painel e manda: e-mail sem login → o convite do Auth
  (`data: { nome_da_conta, nome }`), que leva a `/convite` para criar a senha; e-mail que já tem login → o link de
  acesso, direto para o painel. Ao entrar, `aceitar_convites()` transforma o convite em pessoa da conta. A chave
  secreta fica no ambiente da função (`SUPABASE_SECRET_KEYS`, posta pelo Supabase); `verify_jwt` desligado porque a
  função confere o login sozinha (`auth.getUser`). Publicar: `node supabase/functions/publicar.mjs stg` e depois
  `producao --projeto <ref>`; sem argumento, lista o que está publicado.
- **Convite por link e acesso sem e-mail** (Missão 7, bloco B; D42): o padrão no Admin (a conta nova) e na Equipe. A
  Renderiza ou o dono escolhe um **usuário** (ex.: `espacojardim`, `rafael.villaalecrim`); o login por baixo é
  `<usuário>@acesso.renderizaweb.com.br`, um endereço interno que não recebe e-mail. O convite ganha um código de 32
  letras e números e vira o link `/boas-vindas/<código>` (`src/telas/boas-vindas.js`), que vale uma vez, por 7 dias,
  e vai pelo WhatsApp com a mensagem pronta (`src/ui/convite-link.js`). A tela lê o convite por
  `publico_convite(código)` (o negócio, o nicho, o usuário; sem e-mail) e manda a senha para a função
  `aceitar-convite` (`supabase/functions/aceitar-convite/`; a lógica em `logica.js`, testada em
  `test/convite-link.test.mjs`; sem login, `verify_jwt` desligado), que marca o link, cria o login (ou troca a senha
  de quem já tem o usuário: o "link para a senha nova") e devolve o e-mail interno; o painel entra em seguida e o
  `aceitar_convites()` de sempre põe a pessoa na conta. **Segurança** (migração `…233000`): o link só troca a senha de
  quem já tem login se foi gerado pela Renderiza (`pela_renderiza`) ou se a pessoa só está na conta de quem gerou
  (`convite_pode_usar_login`, no banco ao gravar e na função ao aceitar); um convite pendente por usuário. Entrar
  aceita "e-mail ou usuário" (`emailDeEntrada` em `src/sessao.js`). O e-mail para recuperar a senha sozinho entra no
  bloco E (até lá, quem esqueceu pede um link novo à Renderiza ou ao dono).
- **A IA do onboarding** (Missão 7, bloco D; D45, D46, D49): a função `assistente` (`supabase/functions/assistente/`;
  a lógica em `logica.js`, testada em `test/assistente.test.mjs`) é o único lugar que fala com o Claude, pelo SDK
  oficial (`npm:@anthropic-ai/sdk`), com a chave só no ambiente dela (segredo `ANTHROPIC_API_KEY`; modelo em
  `IA_MODELO`, padrão `claude-opus-5-5`). O painel chama com o login do dono e uma **tarefa** (hoje,
  `proxima_pergunta`); a função confere o login, o teto da conta (`ia_contas`, padrão US$ 3) e o limite por hora,
  manda o roteiro e o contexto da conta (`contas_contexto`) em cache e pede a saída em JSON pelo esquema da tarefa
  (`output_config.format`), confere a resposta contra o roteiro e registra os tokens e o custo em `ia_uso` (sem o
  conteúdo). A IA só propõe: nada é gravado pela função. Sem chave, no teto, com demora ou resposta fora do formato,
  responde `{ ok: false, fallback: true, motivo }` e o painel segue o roteiro fixo.
- **Admin:** mesma aplicação, área `/admin`, só para quem está em `equipe_renderiza`. As regras do
  banco deixam essa equipe ver as contas, as pessoas, os pagamentos e os números, mas **não** os dados dos clientes
  finais; para isso, só "entrar na conta para ajudar", que fica registrado.
- **Banco:** tabelas em `public`, todas com RLS; funções `security definer` sempre com `search_path` fixo; nada de
  mudar estrutura pelo painel do Supabase: só por migração no repositório.
- **Storage:** `logos` (público), `site-imagens` (público, imagens do Meu site, comprimidas), `privado` (o que não
  pode ser público, ex.: PDF de contrato aceito, se um dia for guardado).
- **Tempo real:** para o Atendimento (pedido novo aparece na hora) e, se valer, o "online agora" da Equipe. O
  gratuito permite 200 conexões ao mesmo tempo.
  **Como usar (29/10/2026, Missão 3C):** `banco.ouvir("pedidos", { filtro: "conta_id=eq.<id>", aoMudar })` no
  adaptador (Supabase Realtime, com a RLS de quem está logado) devolve a função que para; o módulo devolve essa
  função no fim do `montar(el, contexto)` e o `app.js` a chama quando a pessoa sai do módulo. A tabela precisa
  estar na publicação `supabase_realtime` (hoje só `pedidos`).
- **Ambientes:** os testes automáticos rodam num banco local (Postgres 16 do ambiente das sessões; ver
  `docs/atualizacao-por-ia.md`); depois, toda migração vai primeiro para o **STG** e só então para a **produção**
  (regras em `08`). Dados fictícios (Villa Alecrim, Estúdio Ciranda) só no local e no STG.
- **Pausa por falta de uso:** projeto gratuito pausa depois de 1 semana sem atividade. Antes de ter clientes, um
  aviso automático (GitHub Actions) que chama `/api/publico/saude` a cada poucos dias mantém o projeto acordado e
  serve de alarme. Os sites conectados não sofrem com a pausa (fallback), mas o painel sim.

## Vercel

- **Projeto novo** apontando para `painel-clientes/`, sem framework, sem passo de build (ou um mínimo, se precisar).
- "Pular build quando a pasta não mudou" ligado: a `main` recebe muitos commits de demos e o Hobby tem 100 deploys
  por dia. Já vem no `painel-clientes/vercel.json` (`ignoreCommand`), junto com os cabeçalhos abaixo; o
  `.vercelignore` deixa `supabase/`, `scripts/` e `test/` fora do que é publicado. O `cleanUrls` fica **desligado**: ligado, a Vercel
  ignora o rewrite para o `index.html` e as rotas do app (`/entrar`, `/agenda`) dão 404 quando abertas direto
  (conferido no primeiro deploy, 29/10/2026).
- **Como o `ignoreCommand` decide** (29/10/2026):
  `[ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- ./ || exit 1`. Compara
  o commit do último deploy da branch (`VERCEL_GIT_PREVIOUS_SHA`) com o atual, só dentro de `painel-clientes/`. Na
  Vercel, sair com 0 pula o deploy, com 1 faz o build e **com qualquer outro código o deploy falha** (ERROR no passo
  "ignore"): nada mudou na pasta → 0, pula; mudou, sem SHA anterior (primeiro deploy da branch) ou com erro do git
  → 1, o build acontece. O `|| exit 1` é o que transforma o erro do git em 1. Antes comparava só `HEAD^` com `HEAD`
  e pulava o deploy quando o último commit mexia só em documentos, mesmo que um commit anterior do mesmo push tivesse
  mudado o painel. Os casos estão em `painel-clientes/test/esqueleto.test.mjs`.
- **As branches das sessões não fazem deploy do painel** (`"git": { "deploymentEnabled": { "claude/*": false } }`,
  30/10/2026): cada commit fazia 4 builds (painel e site, na branch e na `main`) e o plano grátis bateu o limite de
  builds (`build-rate-limit`), deixando um deploy de produção sem sair. As sessões testam no `localhost` contra o
  STG; só a `main` publica.
- **O clone da Vercel é raso** (só os últimos 10 commits; conferido em 30/10/2026). Sem o `|| exit 1`, bastaram 11
  commits na `main` depois do último deploy bom (`aabb9bc`, 29/10) para o SHA anterior sair do clone: o `git diff`
  saía com 128 ("bad object") e todo deploy de produção falhava no passo "ignore", sem nunca andar (o SHA anterior
  continua sendo o do último deploy bom).
- **Qual commit está no ar** (29/10/2026): `GET /api/config` devolve `versao` (os 7 primeiros caracteres do
  `VERCEL_GIT_COMMIT_SHA`). Dá para conferir de qualquer lugar, sem entrar na Vercel:
  `curl -s https://painel.renderizaweb.com.br/api/config` e olhar o `versao`. Em 29/10, um push na `main` (o
  `a4f92d1`) não chegou à produção em 25 minutos, sem motivo visível daqui; o push seguinte entrou em 1 minuto.
- **Prévias pedem login na Vercel** (a proteção padrão das prévias; conferido em 29/10/2026): só quem é do time da
  Vercel abre. As sessões não abrem prévias: testam no `localhost:5180` contra o STG, e a Renderiza confere a prévia.
- **Variáveis:** `SUPABASE_URL` e `SUPABASE_ANON_KEY` (a pública, como no `api/config.js` de hoje, que se recusa a
  entregar a secreta). A chave secreta só entra se uma função do servidor precisar, nunca no front.
- **Cadastro (D30):** quando a Renderiza criar o site no Cloudflare Turnstile, a chave **pública** vai na Vercel como
  `TURNSTILE_SITE_KEY` (o `/api/config` entrega `cadastroAberto` e a chave; no local, `PAINEL_STG_TURNSTILE_SITE_KEY`)
  e a **secreta** no Auth do Supabase (Attack Protection → Turnstile), nos dois projetos; aí o `disable_signup` sai
  de `scripts/lib/auth.mjs` (STG primeiro). A CSP já deixa o script e o frame de `challenges.cloudflare.com`. Testado
  no local com a chave de teste da Cloudflare (`1x00000000000000000000AA`, que sempre passa).
- **Cabeçalhos:** o painel fora do Google (`noindex`), sem abrir dentro de outro site (`X-Frame-Options: DENY`),
  política de conteúdo (CSP) restringindo de onde vêm scripts. Conferidos na produção na revisão de segurança
  (30/10/2026, `06`).
- **Rewrites, nesta ordem** (`vercel.json`; o `scripts/servidor.mjs` imita): `/c/:codigo` (o contrato),
  `/termos` e `/privacidade` (os documentos, Missão 5B), e por último o app (`index.html`). Quem acrescentar um
  rewrite põe antes do app.
- **Plano:** a escolha e a hora de subir de plano ficam com a Renderiza (28/10/2026). O front é estático para poder
  trocar de hospedagem sem reescrever, se um dia fizer sentido.

## Passo a passo das contas (para vocês, parada 1)

Quem faz é a Renderiza, com o próprio acesso de administrador (decidido em 28/10/2026); a IA não cria conta nem vê
senha. Os nomes dos menus podem mudar; na dúvida, a sessão da
vez guia na tela.

1. **Supabase** (Missão 1): com o e-mail novo do Painel Renderiza, criar a conta e os dois projetos,
   `painel-renderiza-prod` e `painel-renderiza-stg` (região South America · São Paulo; senhas dos bancos num
   gerenciador de senhas). O login (*Authentication*: endereço do painel, endereços de retorno, senha mínima e
   e-mails) não é feito à mão: vem do repositório, por `scripts/auth.mjs` (acima, em Supabase). Copiar a URL e a chave **pública** (`sb_publishable_…`) de cada um para a Vercel. As chaves
   secretas não saem do Supabase.
2. **Vercel** (Missão 1): *Add New → Project*, importar o repositório `renderizaweb/Renderiza`, *Root Directory* =
   `painel-clientes`, framework *Other*. Em *Environment Variables*: `SUPABASE_URL` e `SUPABASE_ANON_KEY` duas vezes,
   com os valores da **produção** marcados para *Production* e os do **STG** marcados para *Preview*. Assim o
   endereço oficial usa a produção e toda prévia de branch usa o STG. Em *Domains*: `painel.renderizaweb.com.br`; a
   Vercel mostra o registro de DNS para criar.
3. **DNS** (Missão 1): no Registro.br (ou onde o domínio estiver), criar o registro que a Vercel pediu e os do e-mail.
4. **E-mail** (Missão 1): criar a conta no serviço de e-mail, adicionar o domínio, criar no DNS os registros que ele
   mostrar (SPF, DKIM, DMARC) e colocar os dados de SMTP no Supabase (*Authentication → SMTP*).
5. **Acesso das sessões ao Supabase novo:** nas configurações do ambiente do Claude (menu do ambiente na barra de
   título da sessão → Editar), criar `PAINEL_SUPABASE_ACCESS_TOKEN` (token de acesso da conta nova, *Account → Access
   Tokens*), `PAINEL_STG_SUPABASE_URL`, `PAINEL_STG_SUPABASE_ANON_KEY`, `PAINEL_PROD_SUPABASE_URL` e
   `PAINEL_PROD_SUPABASE_ANON_KEY`. Uma sessão nova já enxerga. As variáveis de hoje (`SUPABASE_URL`,
   `SUPABASE_ANON_KEY`) continuam sendo do Painel de prospecção. O conector do Supabase entra numa conta só; por isso,
   para a conta nova, as variáveis. Nunca colar chave ou senha no chat.

## Endereço e domínio

**Decidido em 28/10/2026: `painel.renderizaweb.com.br`.** O `renderizaweb.com.br` já é da Renderiza: é só criar o
subdomínio no DNS, apontando para a Vercel, sem custo. O mesmo DNS recebe os registros do e-mail (SPF, DKIM, DMARC).

O domínio do painel é da Renderiza; o site de cada cliente fica no domínio e nas contas dele e só consome a API do
painel. (Conferido no Registro.br em 28/10/2026: `renderiza.com.br` é de outra pessoa desde 2017; `renderiza.com` e
`renderiza.app` também têm dono.)

## E-mail

- Dois serviços, um domínio: o **Zoho Mail** recebe (`contato@renderizaweb.com.br`, MX no Registro.br) e o
  **Brevo** envia o que o painel manda (plano grátis, conta do `contato@`). Configurado em 29/10/2026.
- **Brevo ligado ao Supabase Auth** como SMTP próprio nos dois projetos: `smtp-relay.brevo.com`, porta 587, com o
  login e a chave SMTP do Brevo (só no Supabase e no Brevo; nunca no repositório nem no chat). Remetente
  `nao-responda@renderizaweb.com.br`, com o nome "Painel Renderiza" (no STG, "Painel Renderiza (Teste)"). As funções
  usam o mesmo Brevo para o aviso de pedido novo.
- **DNS do Brevo** (Registro.br): `TXT brevo-code:…` na raiz (prova que o domínio é nosso), os CNAME
  `brevo1._domainkey` e `brevo2._domainkey` (DKIM, a assinatura) e `TXT _dmarc` com `v=DMARC1; p=none;
  rua=mailto:rua@dmarc.brevo.com`. O SPF segue só com o Zoho (`v=spf1 include:zohomail.com ~all`): o Brevo autentica
  pelo DKIM e não precisa entrar nele. Sem subdomínio de marca para os links (opcional, ficou de fora).
- **Cuidados com o Brevo:**
  - **Trava de IPs desligada para as chaves SMTP** (*Segurança → IPs autorizados*). Ela vem ligada e recusa o
    Supabase ("5.7.1 Unauthorized IP address"), que envia de IPs que mudam. Para as chaves de API, segue como está.
  - **A chave SMTP ("Painel Renderiza") vence em 28/10/2027** e também depois de 90 dias sem uso. Trocar antes:
    gerar outra no Brevo e colar nos dois projetos (*Authentication → Emails → SMTP Settings*). Se os e-mails
    pararem de chegar, é a primeira coisa a olhar.
  - **Limites:** o Brevo grátis manda 300 e-mails por dia na conta toda (STG e produção juntos), e o Supabase, 30 por
    hora por projeto. Bastam para o piloto; com mais clientes, rever.
- O Supabase não deixa escolher o endereço de resposta: quem responder a um e-mail do painel escreve para
  `nao-responda@`, que só chega a alguém se for um alias do `contato@` no Zoho.
- Modelos em português, curtos, com o nome da conta ("Villa Alecrim convidou você para o Painel Renderiza"): os do
  login estão em `painel-clientes/supabase/emails/` e só entram nos projetos com o SMTP próprio (ver Supabase,
  acima).

## API pública (o que os sites dos clientes chamam)

| Método | Caminho | Quem chama | O que faz |
|---|---|---|---|
| GET | `/api/publico/agenda/<código>?de=…&ate=…` (feito, 29/10/2026) | agenda online | os dias com turno e se cada um está livre (até 62 dias por pedido, uns 15 meses à frente), mais tipos de festa, pacotes e adicionais, sem preço e sem nome; `404` se o site não responde |
| POST | `/api/publico/agenda/<código>/pedido` (feito) | agenda online | o pedido no Atendimento e a pré-reserva na Agenda (a data fica separada por 48 horas); `201`, ou `409` (data pega), `422` (dado, com o campo), `429` (limite), `403` (outro domínio), `404` |
| GET | `/api/publico/site/<código>` (feito, 29/10/2026) | script do Meu site | a versão publicada (cache de ~60 s); "não encontrado" se desconectado, versão final, conta não liberada ou módulo desligado |
| GET | `/api/publico/site/<código>/previa?t=…` (feito) | prévia do Meu site | o rascunho, sem cache, com código que expira |
| GET | `/api/publico/imagens/<id da conta>/<arquivo>.webp` (feito) | site do cliente | a foto enviada pelo Meu site, do Storage público `site-imagens` (cache de 1 ano: cada envio ganha nome novo) |
| GET e POST | `/c/<código-do-contrato>` (feito, 29/10/2026) | cliente final | ler e aceitar o contrato: a página `publico/contrato/` (o primeiro rewrite do `vercel.json`; no servidor local também) fala direto com o banco pela chave pública (`publico_contrato` e `publico_aceitar_contrato`, `05`); sem API da Vercel no meio |
| GET | `/api/publico/saude` (feito) | aviso automático | responde se o painel e o banco estão de pé (`200` ou `503`) |

- `<código>` é o código do site da conta (`sites.codigo`, curto, pode ser trocado), nunca o id interno.
- **Como está feita (29/10/2026, Missão 4A):** funções da Vercel em `painel-clientes/api/publico/` (o que é comum em
  `_comum.js`: o "_" faz a Vercel não publicar como função), testadas em `test/publico.test.mjs`; o servidor local
  (`npm run dev`) serve as mesmas. Chamam o banco com a **chave pública** (`apikey`, sem login), conferida como no
  `/api/config`: quem decide o que sai são as funções `publico_*` do banco (`05`). CORS aberto
  (`Access-Control-Allow-Origin: *`, sem login), e o `vercel.json` deixa `/api/publico/` fora do `no-store`: a agenda
  tem cache de 20 s na rede (o pedido confere a data de novo).
- **Contra robô e repetição:** no pedido, o campo-isca (`website`) e o tempo mínimo (3 s desde que a agenda abriu)
  fingem que deu certo, sem gravar. O banco só aceita os domínios do site (`sites.dominios`, com ou sem `www.`, pelo
  `Origin`) e limita 5 pedidos por hora do mesmo endereço (embaralhado por site e por dia: o endereço não é
  guardado), 3 por dia do mesmo WhatsApp e 20 por hora na conta.
- **Aviso ao dono por e-mail** (D15): depois de gravar, a API chama a função do Supabase `avisar-pedido`
  (`painel-clientes/supabase/functions/avisar-pedido/`, Deno; a lógica em `logica.js`, testada em
  `test/avisar-pedido.test.mjs`). Ela pega no banco o que vai no e-mail (`aviso_do_pedido`, só com a chave secreta:
  uma vez só por pedido, só da agenda online, nos primeiros 15 minutos) e manda aos donos da conta pelo Brevo, no
  jeito dos e-mails do login ("[STG]" no assunto quando vem do STG). Precisa de **`BREVO_API_KEY`** no ambiente da
  função (Supabase → Edge Functions → Secrets, nos dois projetos; uma chave de API do Brevo, não a SMTP); sem ela,
  não manda nada e o pedido segue no painel. Publicar: `node supabase/functions/publicar.mjs stg` e depois a produção.
- **A agenda online no site do cliente:** a página `/agenda/` (`ferramentas/demo/agenda-online/`, o desenho do
  exemplo aprovado), gerada pelo `scripts/virar-site.mjs` com `"painel": { "codigo", "agenda": true }` no
  `site.json`, com as cores, as fontes, a marca e o WhatsApp do próprio site, e um link na seção "Consulte a sua
  data". Painel fora do ar, site desligado, limite ou falha no envio: a página vira um botão de WhatsApp com a data
  escrita. Hoje para eventos (turnos por dia); a fotografia (horários e campanhas com vagas) vem quando houver
  cliente de fotografia com agenda online.

## Acompanhamento

- Logs da Vercel (1 hora no Hobby) e do Supabase.
- Erros do front registrados numa tabela simples, sem dado pessoal, para ver o que quebra no celular dos clientes.
- O aviso automático de saúde (acima) manda e-mail para a Renderiza quando algo não responde.

## Testes

- **Banco:** para cada tabela nova, um teste de isolamento (conta A × conta B, "só vê" × "edita", sem login).
  Nenhuma migração sobe sem ele.
- **Regras:** disponibilidade, conflito de horário, vagas de campanha, totais do financeiro, montagem do contrato,
  aplicação do Meu site (`node --test`).
- **Fluxos (Playwright):** convite e primeiro acesso, pedido pela agenda online até o Atendimento, publicar no Meu
  site e ver no site de teste, site com o painel desligado.
- **Fluxos de ponta a ponta no STG (Missão 6, `test/fluxos/`, `npm run fluxos`):** o painel de verdade num Chromium,
  servido numa porta própria contra o STG, com logins e conta temporários (`@fluxo-<marca>.teste`, `t-fluxo-<marca>`)
  que o próprio fluxo cria e apaga (as sobras de uma execução interrompida saem na seguinte, depois de 2 horas).
  `piloto.fluxo.mjs`: o caminho do piloto (Admin cria a conta → o dono entra e arruma o básico → traz as datas → as 5
  tarefas do `09` contando os toques → a cliente aceita pelo link → a equipe "só vê" → o Admin). `varredura.fluxo.mjs`:
  todas as telas com os dados da semente, dono, "edita" e "só vê", celular e computador, e o Admin. Quando um passo
  falha, o print e os campos da tela vão para uma pasta temporária (o caminho sai no erro). Sem as variáveis
  `PAINEL_*` ou o Playwright, pulam. Não rodam no `npm test` (são lentos: uns 3 e 10 minutos).
- **Produção depois do deploy (`npm run conferir-producao`), só leitura:** o commit no ar é a `main`, os cabeçalhos,
  a API pública e as páginas sem login abrindo sem erro no celular.
- **Backup (Missão 5B):** `test/backup.test.mjs` (cifrar e decifrar, senha errada, ler o banco em lotes, as
  imagens, o SQL da restauração, o workflow); toda semana o GitHub Actions restaura o backup da produção num Postgres vazio e confere as
  contagens (`06`, "Backup").
