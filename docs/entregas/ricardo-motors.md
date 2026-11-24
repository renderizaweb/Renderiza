# Trilho da Ricardo Motors: o site dele com Meu site e Estoque

**Cliente:** Ricardo Neves, Ricardo Motors (RM Consult Car, @rm.consultcar), revenda de carros premium e blindados
em São Paulo. Usa o celular e o computador. **Fechou em 24/11/2026:** o site (termo
[`termos/clientes/ricardo-motors.json`](../../termos/clientes/ricardo-motors.json): R$ 399, 5 dias úteis, Cloudflare
Pages, o domínio é dele) e o Painel Renderiza com **2 módulos, Meu site e Estoque** (R$ 49 por mês, a partir de 30
dias depois da entrega).

**O que foi prometido (a proposta, `/proposta/ricardo-motors`):**

1. O site dele no ar, igual à demo aprovada (`/demo/ricardo-motors`).
2. No painel, o **Estoque**, como no vídeo: criar um carro (fotos, dados, preço, descrição), mudar, marcar vendido,
   reservar, destacar, tirar do ar e pôr de novo. Salvou, está no site.
3. No painel, o **Meu site** para o resto do site (textos, fotos, contato). **O Meu site não mexe no estoque:** o
   estoque chega ao site por outra rota da API.
4. **Sem o painel, o site não mostra preço:** fica a lista do dia da entrega, sem valor, com "confirme a
   disponibilidade pelo WhatsApp". Com o painel respondendo, os carros e os preços vêm de lá.
5. Tudo feito para servir a outros clientes depois (o estoque por nicho: carros agora, ótica depois).

Este trilho segue o modelo de [`README.md`](README.md) (paradas A a E), com o módulo Estoque no meio: a Parada 3 é a
A e a B do modelo; a 4 é a C; a 5 é a D; a 6 é a E. O desenho do módulo e o **Contrato v1** (a tabela, a API, o site)
estão em [`12-modulo-estoque.md`](../painel-clientes/12-modulo-estoque.md). Não é cravado em pedra: se algo não fizer
sentido, proponha o ajuste e registre no diário.

## Onde o trem está

| Parada | Situação | Sessão / branch | Atualizada |
|---|---|---|---|
| 0 · Investigação e contrato | **feita** | `estoque-plano` (na `main`) | 24/11/2026 |
| 1 · Estoque no banco e na API (STG) | livre: pode começar já | | |
| 2 · Estoque no painel | livre: 2A e 2B podem começar já; 2C em diante depois da 1A no STG | | |
| 3 · O site no repositório dele | esperando **R1** (o repositório); 3B e 3C podem começar já, no `renderizaweb/Renderiza` | | |
| 4 · A ponte provada no STG | esperando 1, 2 e 3 | | |
| 5 · A conta dele na produção | esperando 4 e **R3** (o "pode") | | |
| 6 · No ar e entregue | esperando 5 e **R2** (Cloudflare e domínio) | | |

**Situação:** `livre` · `em andamento` · `feita` · `travada` (diga por quê no diário). **Pegou uma parada (ou uma
tarefa)?** No primeiro commit, mude **só a linha dela** nesta tabela: `em andamento`, a branch e a data. Nunca pegue
uma linha `em andamento` de outra sessão sem a Renderiza pedir.

**Esperando a Renderiza (Kaue):**

| | O quê | Para qual parada |
|---|---|---|
| R1 | Criar o repositório do site (privado), com a conta da Renderiza no GitHub como colaboradora e o app do Claude instalado nele; depois abrir a sessão com ele selecionado | 3 |
| R2 | O domínio dele (qual é? está no CPF/CNPJ dele?) e o projeto no Cloudflare Pages ligado ao repositório (a sessão guia, como na Rafaela) | 6 |
| R3 | O "pode" para a migração do Estoque na produção e para criar a conta dele | 5 |
| R4 | Responder as "Perguntas em aberto" (abaixo); nenhuma trava as paradas 1 a 4 | 5 e 6 |

## O que já existe (não refazer)

| O quê | Onde | Para quê aqui |
|---|---|---|
| O protótipo do Estoque: lista, chips, busca, ações de um toque, gaveta com fotos (reduzidas a 1600 px WebP), campos do nicho, preço, selos, prévia | `exemplos/estoque/` (`modulo.js`, `esquemas.js`, `loja-local.js`, `nicho-automotivo.js`, `estoque.css`) | vira o módulo de verdade (Parada 2): troca a loja do navegador pela do banco |
| O painel do Ricardo em protótipo (a casca de verdade com o Estoque) | `demos/ricardo-motors/painel.html` | a referência do que ele viu e aprovou |
| A demo (a proposta aceita), feita à mão, com os 15 carros e as fotos dentro do HTML | `demos/ricardo-motors/index.html`, `ficha.md` | a origem do site (Parada 3); o `doPainel` dela já traduz um item do painel para a vitrine |
| O vídeo e a proposta | `gravacoes/ricardo-motors-estoque.mp4`, `propostas/ricardo-motors.html` | o que foi prometido |
| O Meu site inteiro (script no site, API, editor ao vivo, indicadores) | `ferramentas/meu-site/meu-site.js`, `painel-clientes/api/publico/site/`, `src/modulos/meu-site/`, `03` | a Parada 3 só põe as marcações; nada muda nele |
| O caminho da imagem pública, o bucket `site-imagens`, o `conta_do_site`, o cache de 20 s | `painel-clientes/api/publico/imagens/`, migrações `…110300`, `…135228` | o Estoque usa os mesmos, sem rota nova de imagem |
| O `virar-site` (fotos para `img/`, `_headers`, `"painel": {"codigo", "api"}`) e a conferência | `scripts/virar-site.mjs`, `scripts/conferir-site.mjs` | ganha a opção `"estoque": true` (3C) |
| O Admin: conta nova (o nicho sai da lista de `src/nichos/`), módulos, site, convite por link, suporte | `painel-clientes/src/admin/` | cria a conta de teste (4A) e a dele (5B) sem código novo |

**O que a investigação achou (24/11) e que muda o plano:**

- `contas.nicho` e `demos.nicho` só aceitam `eventos` e `fotografia` (migrações `…110000` e `…240000`): a migração
  do Estoque abre `automotivo`. Sem isso, a conta dele não nasce.
- O Admin monta a lista de nichos de `src/nichos/` sozinho, mas a lista de demos por nicho em
  `src/admin/contas/nova.js` tem `["eventos", "fotografia"]` escrito à mão (2A).
- `exemplos/painel/src` é uma **cópia** de `painel-clientes/src` (casca, Meu site): mexeu na casca ou nos nichos,
  rode `node ferramentas/exemplos/painel-de-verdade.mjs` e o `test/meu-site-exemplo.test.mjs` (aviso de 18/11).
- A demo leva o rastreio da prospecção (`exemplos/visitas.js`) e as fotos em base64 (26 MB); o `virar-site` tira as
  fotos para `img/`, e a conferência acusa o rastreio que sobrar.
- O código do Estoque pode ir para a `main` antes da produção: sem a linha `estoque` no catálogo da produção,
  nenhuma conta tem o módulo e ninguém o vê. Até a 5A, o Admin da produção mostra "Automotivo" na conta nova, mas o
  banco recusa (esperado).

## O mapa

```
                 ┌── 1 · banco e API no STG ───────────────┐
 0 · contrato ✅ ─┼── 2 · Estoque no painel (2A, 2B já) ────┼── 4 · ponte no STG ── 5 · produção ── 6 · no ar
                 └── 3 · o site dele (3B, 3C já; 3A com R1) ┘        (todos)         (R3 "pode")   (R2 domínio)
```

1, 2 e 3 andam **ao mesmo tempo, em sessões diferentes**: cada uma mexe só nos seus arquivos ("Mexe em") e todas
seguem o Contrato v1. Dentro da 2, a 2C em diante precisa da 1A aplicada no STG.

---

## Parada 0 · Investigação e contrato ✅

**Chegou quando:** o contrato entre banco, painel e site está escrito e cada parada sabe o que pode mexer.

| ID | Quem | O quê | Mexe em |
|---|---|---|---|
| 0A ✅ | Claude | Leu o painel (login, módulos, `pode()`, Meu site, API pública, Storage, Admin) e os trilhos da Rafaela e da Bia | — |
| 0B ✅ | Claude | O **Contrato v1** no `12` e as decisões de 24/11 | `docs/painel-clientes/12-modulo-estoque.md` |
| 0C ✅ | Claude | Este trilho, o aviso em `missoes.md` e a lição no `README` | `docs/entregas/`, `docs/painel-clientes/missoes.md` |

## Parada 1 · Estoque no banco e na API (STG)

**Chegou quando:** no STG, `GET /api/publico/estoque/garagem-aurora` (no `localhost:5180`) devolve os carros de
teste no formato do contrato; ocultar um faz ele sumir; desligar o módulo dá 404; os testes do banco e da pasta
estão verdes.

**Mexe em** (dentro de `painel-clientes/`): uma migração nova em `supabase/migrations/`, um teste novo em
`supabase/testes/`, `supabase/semente/` (só a revenda fictícia), `api/publico/estoque/`, `test/publico-estoque.test.mjs`
e, se ele não achar a rota sozinho, `scripts/servidor.mjs`. Fora dela: as linhas do Estoque no `05` (tabela) e no
`04` (API pública), e a tabela "Migrações aplicadas" de `missoes.md`.

| ID | Quem | O quê |
|---|---|---|
| 1A | Claude | **A migração** do Contrato v1, item 1: `estoque_itens`, RLS, `modulos` com `estoque`, `automotivo` em `contas.nicho` e `demos.nicho`, as políticas do `site-imagens` para `estoque-*`, `publico_estoque`. Antes, ler o `08` (regras do banco) e conferir como as `publico_*` são liberadas ao visitante (`…150000`). Testar no banco local (RLS e isolamento), aplicar no STG pelo `scripts/migrar.mjs` e registrar em "Migrações aplicadas" no mesmo push. |
| 1B | Claude | **A rota** `api/publico/estoque/[codigo]/index.js`, no molde da `site/[codigo]/index.js` (`tratar()` testável sem rede, CORS, cache de 20 s, 404), montando a `url` das fotos a partir do `arquivo`. Testes sem rede: resposta boa, 404, código inválido, método errado, nada de `codigo_interno`. |
| 1C | Claude | **A semente do STG:** a revenda fictícia "Garagem Aurora" (automotivo; site `garagem-aurora` com o domínio `localhost`; Meu site e Estoque ligados) com 4 carros fictícios (um oculto, um reservado, um vendido) e um usuário dono de teste (a senha fica fora do repositório). Nunca dado real. |
| 1D | Claude | **Conferir no STG** o "chegou quando" e escrever o resultado no diário. |

## Parada 2 · Estoque no painel

**Chegou quando:** no `localhost:5180` contra o STG, o dono da Garagem Aurora cria um carro com foto, muda o preço,
marca vendido (e desfaz), reserva, destaca, oculta e mostra de novo, no celular e no computador; quem "só vê" não tem
os botões; e a rota da 1B mostra cada mudança.

**Mexe em** (dentro de `painel-clientes/`): `src/modulos/estoque/` (pasta nova), `src/nichos/automotivo.js` (novo),
`test/estoque*.test.mjs`, `test/fluxos/estoque.fluxo.mjs` (novo). **Arquivos comuns, uma linha cada, com aviso em
`missoes.md`:** `src/modulos/index.js` (o registro), `src/nichos/index.js`, `src/telas/casca.js` (o ícone e o lugar na
barra), `src/admin/contas/nova.js` (a lista de demos por nicho). Depois de mexer na casca ou nos nichos:
`exemplos/painel/src`, só pela `ferramentas/exemplos/painel-de-verdade.mjs`.

| ID | Quem | O quê | Depende de |
|---|---|---|---|
| 2A | Claude | **O nicho automotivo:** `src/nichos/automotivo.js` com as mesmas chaves dos outros (as palavras do `exemplos/estoque/nicho-automotivo.js`: "negócio", "cliente", o Início sem agenda nem atendimento), registrado no `index.js`; a lista de demos do Admin sem o par de nichos escrito à mão. Conferir que o Início, Serviços, Equipe e Configurações abrem numa conta automotiva só com Meu site e Estoque. | — |
| 2B | Claude | **A tela do módulo:** `exemplos/estoque/modulo.js` e `esquemas.js` vão para `src/modulos/estoque/`, recebendo a `loja` de fora (a interface da `loja-local.js`); o `estoque.css` vira peças `.rz-*` e tokens `--rz-*` (nada de cor ou tamanho solto, `10`); o registro e o ícone. Testes da lógica (esquema, título, selos, `paraOSite`) sem banco. | — |
| 2C | Claude | **A loja do banco** (`src/modulos/estoque/loja-banco.js`): `listar`, `salvar`, `mudar`, `remover` pelo Supabase com a sessão de quem entrou (RLS); as fotos reduzidas no navegador (como o protótipo) e enviadas ao `site-imagens` como `<conta>/estoque-….webp`; tirar uma foto apaga o arquivo. Erros com o aviso do painel, nunca em silêncio. | 1A no STG |
| 2D | Claude | **Quem pode:** "só vê" sem criar, editar nem ações; o Estoque aparece em Equipe e acessos (conferir se aparece sozinho pelo catálogo). | 2C |
| 2E | Claude | **O fluxo** `test/fluxos/estoque.fluxo.mjs` (Playwright, STG, celular e computador): o "chegou quando" inteiro. Roda junto com o `npm run fluxos`. | 2C, 1C |
| 2F | Claude | (opcional, não trava a entrega) **A prévia do site ao lado**, no computador, como o protótipo e o Meu site (Contrato v1, item 3, "Prévia"). | 3C |

## Parada 3 · O site no repositório dele

**Chegou quando:** o site, no repositório dele, abre sozinho (sem painel) igual à demo, **sem nenhum preço** e com o
aviso do WhatsApp; com `"api"` apontando para o painel local, mostra o estoque do STG com preço; a conferência do
`virar-site` passa; os prints de antes e depois (celular e computador) batem.

**Mexe em:** o repositório dele (todo); no `renderizaweb/Renderiza`: `demos/ricardo-motors/site.json` (novo),
`ferramentas/estoque/` (novo), `scripts/virar-site.mjs` e `scripts/conferir-site.mjs` (só a opção do estoque), o teste
do `virar-site`. **Não mexe** na demo nem no `painel.html` (a proposta fica como foi aceita).

**Decisão (24/11):** o site nasce da demo **uma vez** (3A). Dali em diante, a fonte do site é o repositório dele (um
site feito à mão, como o da Bia); a demo fica congelada como a proposta. Atualizar o `meu-site.js` ou o `estoque.js`
num site já entregue é trocar o bloco `<script>` dele, que o `virar-site` põe no fim do `<head>` com um atributo que
o identifica (`data-codigo` no Meu site; a 3C dá um próprio ao do estoque).

| ID | Quem | O quê | Depende de |
|---|---|---|---|
| 3A | Claude | **O site no repositório dele:** `site.json` (domínio provisório `<projeto>.pages.dev` até a R2, nome, cor do tema, schema.org `AutoDealer`, `"painel": {"codigo": "ricardo-motors", "estoque": true}`) e o `virar-site` da demo para o repositório (fotos em `img/`). Sai o que é só da demo: o rastreio da prospecção, o ouvinte `rz-estoque=exemplo` (o `estoque.js` faz o papel dele) e qualquer link para `/demo/`. Push na `main` dele. | R1 |
| 3B | Claude | **A versão de reserva** (a pedida): a lista inicial são os carros de hoje **sem preço** ("Consulte"), inclusive na capa ("Em destaque") e na página de cada carro; o aviso "O estoque muda todo dia: confirme a disponibilidade pelo WhatsApp" na vitrine e na página do carro (`data-estoque-aviso`); o WhatsApp de cada carro pergunta se ele ainda está disponível. A vitrine marcada com `data-estoque`. | — (pode ser preparada no `site.json` e num teste antes da 3A) |
| 3C | Claude | **O script do estoque** `ferramentas/estoque/estoque.js` (Contrato v1, item 3), o `window.rzEstoque` no site (a partir do `doPainel` da demo: vitrine, filtros, contagem, capa com os destaques, esconder o aviso) e a opção `"estoque": true` no `virar-site`. A conferência acusa `data-site-*` dentro de `[data-estoque]`. Testes sem rede: resposta boa, 404, demora de mais de 6 s, foto de outro endereço, versão errada. | — |
| 3D | Claude | **O Meu site no que não é estoque:** as marcações `data-site-*` na capa (título e frase), "quem é o Ricardo", serviços e contato (WhatsApp, endereço, Instagram, horário), com o `conteudo_inicial` tirado delas como no `03`. Nunca na vitrine nem na página do carro. | 3A |
| 3E | Claude | **Revisão** (a Parada B do modelo): prints antes e depois no celular e no computador (lição da Bia), textos, links, WhatsApp, 404, velocidade, Google (`robots`, `sitemap`, prévia no WhatsApp). | 3B, 3C, 3D |

## Parada 4 · A ponte provada no STG

**Chegou quando:** o teste da 4B passa inteiro e a Renderiza testou pela prévia e disse "ok".

**Mexe em:** `painel-clientes/test/fluxos/ponte-estoque.fluxo.mjs` (novo); o STG (conta de teste); o diário.

| ID | Quem | O quê | Depende de |
|---|---|---|---|
| 4A | Claude | **A conta de teste no STG** pelo Admin: "Ricardo Motors (teste)", automotivo, Meu site e Estoque, site `ricardo-motors` com o domínio `localhost`, 3 carros de teste. | 1, 2C |
| 4B | Claude | **O fluxo inteiro, num teste só** (Playwright; o site do repositório dele com `"api"` no painel local): o site abre sem preço → o painel cria um carro → em até 30 s ele está no site, com preço → vendido some → oculto some → reservado aparece com a etiqueta → o Meu site muda o título da capa e não oferece nada da vitrine → desligar o Estoque no Admin → o site volta à versão de reserva, sem preço. No celular e no computador. | 4A, 3C, 3D |
| 4C | Renderiza + Claude | **A Renderiza testa** pela prévia da Vercel (branch `stg-ricardo`, a partir da `main`, como a `stg-rafaela`), com um convite por link na conta de teste. O que ela pedir vira tarefa aqui. | 4B |

## Parada 5 · A conta dele na produção

**Chegou quando:** na produção, a conta dele tem o estoque de hoje e `GET /api/publico/estoque/ricardo-motors`
responde com ele.

**Mexe em:** a produção (com o "pode"), a tabela "Migrações aplicadas" de `missoes.md`, o diário.

| ID | Quem | O quê | Depende de |
|---|---|---|---|
| 5A | Claude | **A migração da 1A na produção** (`scripts/migrar.mjs`, com `--projeto`), conferida e registrada. Depois do deploy: `npm run conferir-producao` e o `versao` de `/api/config`. | 4, R3 |
| 5B | Claude | **A conta dele** pelo Admin: "Ricardo Motors", automotivo, Meu site e Estoque, o WhatsApp e o logo do site, o prazo como a Renderiza disser (o termo: o painel começa 30 dias depois da entrega), o site `ricardo-motors` com os domínios (o `pages.dev` e o dele). | 5A |
| 5C | Claude | **O estoque de hoje:** os carros da demo (os anúncios dele), com fotos, preço e dados, conferidos com o que ele mandar (R4). Pelo próprio painel, com a Renderiza em suporte na conta dele; se forem muitos, um script que entra com o login da Renderiza e passa pela RLS como a tela (nunca a chave secreta). | 5B |
| 5D | Claude | **O convite por link** (usuário do Ricardo) e a mensagem pronta para o WhatsApp, para a Renderiza mandar. | 5B |

## Parada 6 · No ar e entregue

**Chegou quando:** o site está no domínio dele, ligado ao painel, e o Ricardo já mudou um preço sozinho e viu no
site.

| ID | Quem | O quê | Depende de |
|---|---|---|---|
| 6A | Renderiza + Claude | **Cloudflare Pages** ligado ao repositório dele (o fluxo "legacy Pages", lição de 16/11) e o domínio dele com o DNS. | 3E, R2 |
| 6B | Claude | **Conferência no ar:** o fluxo da 4B contra a produção (no site no ar): com o painel, o estoque dele com preço; simulando o painel fora, a versão de reserva sem preço; um carro de teste nasce oculto, vai para disponível, aparece em até 1 minuto e é apagado (com o "pode"). | 6A, 5C |
| 6C | Claude | **Entregar:** a mensagem para a Renderiza mandar, com o link do site, o link do convite e um guia de 5 linhas (criar um carro, mudar o preço, vendido, tirar do ar, Meu site). | 6B |
| 6D | Claude | **Fechar:** "O que aprendemos" no `README`, as fases do `12`, este trilho e o diário. | 6C |

---

## Perguntas em aberto (para a Renderiza; não travam as paradas 1 a 4)

1. **O domínio:** o termo diz que é dele, mas não diz qual. Está no CPF ou CNPJ dele no Registro.br (lição de 16/11)?
2. **O estoque de hoje:** os 15 carros da demo (de 17/11) ainda estão à venda? Ele manda a lista atual com os preços,
   ou cadastramos os da demo e ele ajusta no painel?
3. **A conta:** entra em teste até o painel começar a contar (30 dias depois da entrega) ou já ativa?
4. **Os acessos:** só ele, ou alguém da loja também mexe no estoque (o "edita" e o "só vê" de Equipe)?
5. **O número do WhatsApp dele:** a demo usa o link da bio (`wa.me/message/…`), que abre sem a mensagem pronta. Com o
   número, cada botão já leva o carro na mensagem ("Ainda está disponível o …?"), o que a 3B pede.

## Diário de bordo (o mais novo em cima)

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 24/11/2026 | 0 | Proposta aceita. Investigação do painel (módulos, `pode()`, Meu site, API pública, Storage, Admin, nichos) e das entregas da Rafaela e da Bia; o **Contrato v1** no `12` (tabela, API, site, painel) e as decisões do dia (o Estoque é um dos 2 módulos; sem preço na versão de reserva; vendido sai; reservado aparece; a Renderiza cadastra o estoque de hoje). Trilho escrito, com 1, 2 e 3 em paralelo. | Claude, a pedido da Renderiza |

**Duas sessões escrevendo aqui ao mesmo tempo:** cada uma muda só a linha dela em "Onde o trem está" e põe a linha
dela no topo do diário. No `git rebase`, um conflito neste arquivo é manter as duas linhas.

## Para colar ao abrir a próxima sessão

Abrir no ambiente **"Nuvem kaue"** (variáveis `PAINEL_*` e a rede aberta), com o `renderizaweb/Renderiza` e, para
a Parada 3 em diante, o repositório do site dele selecionados (o GitHub conectado é o da Renderiza, colaboradora nele,
e o app do Claude instalado nele).

> Você vai continuar a entrega da Ricardo Motors: o módulo Estoque no Painel Renderiza e o site dele, no repositório
> dele, ligado ao painel (Meu site e Estoque). Sua parte: **Parada N** (ou a tarefa NX). Responda sempre em
> português, direto e curto, e não invente nada.
>
> Antes de tudo: `git fetch origin` e parta da `main`. Leia, nesta ordem: `docs/entregas/ricardo-motors.md` (o
> trilho: onde o trem está, a sua parada, o que ela mexe, o diário), `docs/painel-clientes/12-modulo-estoque.md` (o
> **Contrato v1**), `docs/entregas/README.md`, `docs/painel-clientes/README.md`, `08-trabalho-em-paralelo.md`,
> `missoes.md` (os "Avisos entre sessões" e as "Migrações aplicadas") e os documentos que a sua parada citar (`03`,
> `04`, `05`, `09`, `10`).
>
> Se a sua parada estiver `em andamento` em outra sessão, pare e me avise. Se eu não disse a parada, proponha uma
> `livre` que não dependa de nada pendente e espere o meu ok. No primeiro commit, marque a sua linha em "Onde o trem
> está".
>
> Regras:
> - Mexa só no "Mexe em" da sua parada. Arquivo comum (registro de módulos, nichos, casca) só com aviso em
>   `missoes.md`. Mudou o contrato? Mude o `12` no mesmo commit e avise.
> - A cada pedaço que funciona: commit pequeno ("Estoque · 1A: …"), a sua linha e o diário em dia, push. A sessão pode
>   acabar a qualquer hora: outra tem que continuar só com o que está no repositório.
> - Banco: variáveis `PAINEL_*` (nunca mostre os valores); nunca toque no banco do Painel de prospecção. Migração pelo
>   `scripts/migrar.mjs`, sempre STG antes da produção, registrada em `missoes.md`. Produção e qualquer coisa
>   destrutiva só com o "pode" da Renderiza. Nunca a chave secreta do Supabase.
> - Dado só fictício no STG e nos testes (a Garagem Aurora); o do Ricardo só na conta dele, na produção.
> - Nunca: chave ou senha no código ou no chat, foto bruta no git, identificador de modelo de IA nos commits.
> - Pode subir para a `main` do `renderizaweb/Renderiza` (autorizado), testado antes, sem PR. Antes de cada push:
>   `git fetch origin main` e `git rebase origin/main`; `git add` só dos seus arquivos (nunca `git add -A`). Antes de
>   subir algo do painel: `npm test` e `npm run fluxos` na pasta `painel-clientes` (STG).
> - Não pergunte o que é operação da Renderiza; pergunte só o que travar o trabalho.
>
> No fim, responda curto: o que fez, o que testou, os links e o que a Renderiza precisa fazer.
