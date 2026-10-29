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
    telas/                   entrar, cadastro, convite, escolher a conta, exportar
    nichos/eventos.js  nichos/fotografia.js
    modulos/index.js         o registro de todos os módulos (nasce completo na Missão 1)
    modulos/inicio/  clientes/  agenda/  atendimento/  financeiro/  contratos/  meu-site/
            equipe/  configuracoes/  servicos/
    admin/                   Admin (só a equipe Renderiza): contas/ modulos/ pessoas/ pagamentos/ indicadores/
    ui/                      peças dos exemplos: menu, abas, gaveta, tabela, calendário, avisos, "Para quem?"
  publico/                   páginas sem login: aceite de contrato (/c/<código>), prévia
  api/config.js              entrega a URL e a chave pública ao navegador (Missão 1)
  api/publico/               funções da Vercel da API pública
  supabase/migrations/       a estrutura do banco, em ordem
  supabase/testes/           testes de RLS e das funções
  supabase/local/            a imitação do Supabase para o banco local de testes
  scripts/                   servidor local (npm run dev) e migrações (scripts/migrar.mjs)
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
| `painel-renderiza-prod` · `wkwyhganenohmupcwthd` (`https://wkwyhganenohmupcwthd.supabase.co`) | **conta nova**, criada com `contato@renderizaweb.com.br` | **Produção** do Painel Renderiza: clientes reais. |
| `painel-renderiza-stg` · `vzrmepxoigoszqtoxtlo` (`https://vzrmepxoigoszqtoxtlo.supabase.co`) | a mesma conta nova | **STG** (homologação): dados fictícios, onde tudo é testado antes de ir para a produção. |

> Conferido pela sessão da Missão 1 em 29/10/2026, pela API do Supabase: os projetos se chamam "Painel Renderiza"
> (produção, região `us-east-2`) e "Painel Renderiza STG" (região `us-west-2`), com Postgres 17. A região não é a
> de São Paulo prevista abaixo; aviso em `missoes.md`.

- O plano gratuito permite 2 projetos ativos por pessoa dona ou admin, somando todas as organizações dela. Por isso o
  login da conta atual **não** entra como dono ou admin na conta nova (senão os limites se somam).
- O STG pausa sozinho depois de 1 semana sem uso; é só reativar no painel do Supabase.

- Os dois projetos novos no plano gratuito, região **São Paulo (`sa-east-1`)**: perto dos usuários e dos dados no
  Brasil.
- **Auth:** e-mail e senha, com confirmação de e-mail. Dois jeitos de a conta nascer (`02`, "Como a conta nasce e
  vive"): **cadastro sozinho**, que cria a conta em teste de 7 dias (com verificação contra robô, ex.: Cloudflare
  Turnstile), ou **criada pela Renderiza** no Admin, com convite ao dono. O dono convida a equipe.
  Senha mínima de 8 caracteres. Mais adiante: entrar com o Google, verificação em duas etapas.
- **Admin:** mesma aplicação, área `/admin`, só para quem está em `equipe_renderiza`. As regras do
  banco deixam essa equipe ver as contas, as pessoas, os pagamentos e os números, mas **não** os dados dos clientes
  finais; para isso, só "entrar na conta para ajudar", que fica registrado.
- **Banco:** tabelas em `public`, todas com RLS; funções `security definer` sempre com `search_path` fixo; nada de
  mudar estrutura pelo painel do Supabase: só por migração no repositório.
- **Storage:** `logos` (público), `site-imagens` (público, imagens do Meu site, comprimidas), `privado` (o que não
  pode ser público, ex.: PDF de contrato aceito, se um dia for guardado).
- **Tempo real:** para o Atendimento (pedido novo aparece na hora) e, se valer, o "online agora" da Equipe. O
  gratuito permite 200 conexões ao mesmo tempo.
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
  `.vercelignore` deixa `supabase/`, `scripts/` e `test/` fora do que é publicado.
- **Variáveis:** `SUPABASE_URL` e `SUPABASE_ANON_KEY` (a pública, como no `api/config.js` de hoje, que se recusa a
  entregar a secreta). A chave secreta só entra se uma função do servidor precisar, nunca no front.
- **Cabeçalhos:** o painel fora do Google (`noindex`), sem abrir dentro de outro site (`X-Frame-Options: DENY`),
  política de conteúdo (CSP) restringindo de onde vêm scripts.
- **Plano:** a escolha e a hora de subir de plano ficam com a Renderiza (28/10/2026). O front é estático para poder
  trocar de hospedagem sem reescrever, se um dia fizer sentido.

## Passo a passo das contas (para vocês, parada 1)

Quem faz é a Renderiza, com o próprio acesso de administrador (decidido em 28/10/2026); a IA não cria conta nem vê
senha. Os nomes dos menus podem mudar; na dúvida, a sessão da
vez guia na tela.

1. **Supabase** (Missão 1): com o e-mail novo do Painel Renderiza, criar a conta e os dois projetos,
   `painel-renderiza-prod` e `painel-renderiza-stg` (região South America · São Paulo; senhas dos bancos num
   gerenciador de senhas). Em cada um, em *Authentication*: ligar a confirmação de e-mail e cadastrar o endereço do
   painel como *Site URL* e nos endereços de retorno (na produção, `painel.renderizaweb.com.br`; no STG, os endereços
   de prévia da Vercel). Copiar a URL e a chave **pública** (`sb_publishable_…`) de cada um para a Vercel. As chaves
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

- Serviço de e-mail transacional com plano gratuito (ex.: Resend ou Brevo; conferir limites ao contratar), ligado
  ao Supabase Auth como SMTP próprio e usado pelas funções para o aviso de pedido novo.
- Remetente no domínio, ex.: `nao-responda@renderizaweb.com.br`, com o nome "Painel Renderiza". Respostas para o
  e-mail de atendimento da Renderiza.
- Modelos em português, curtos, com o nome da conta ("A Villa Alecrim convidou você para o Painel Renderiza").

## API pública (o que os sites dos clientes chamam)

| Método | Caminho (proposta) | Quem chama | O que faz |
|---|---|---|---|
| GET | `/api/publico/agenda/<código>?de=…&ate=…` | agenda online | dias ou horários livres e vagas de campanha; nada de nomes |
| POST | `/api/publico/agenda/<código>/pedido` | agenda online | cria o pedido no Atendimento e separa a data ou o horário |
| GET | `/api/publico/site/<código>` | script do Meu site | a versão publicada (cache de ~60 s); "não encontrado" se desconectado |
| GET | `/api/publico/site/<código>/previa?t=…` | prévia do Meu site | o rascunho, sem cache, com código que expira |
| GET e POST | `/c/<código-do-contrato>` | cliente final | ler e aceitar o contrato |
| GET | `/api/publico/saude` | aviso automático | responde se o painel e o banco estão de pé |

- `<código>` é o código público do site da conta (curto, pode ser trocado), nunca o id interno.
- Os GET podem ser chamados de qualquer lugar; o POST do pedido só aceita os domínios cadastrados no site da
  conta e tem limite por endereço e campo-isca contra robô.
- Por dentro, as funções chamam funções do banco com a chave pública (`publico_disponibilidade`,
  `publico_pedido`, `publico_site`), que fazem as checagens e devolvem só o necessário.

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
