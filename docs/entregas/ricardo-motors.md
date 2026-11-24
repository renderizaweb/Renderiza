# Trilho da Ricardo Motors: o site dele com Meu site e Estoque

**Cliente:** Ricardo Neves, Ricardo Motors (RM Consult Car, @rm.consultcar), revenda de carros premium e blindados
em São Paulo. Usa o celular e o computador. **Fechou em 24/11/2026:** o site (termo
[`termos/clientes/ricardo-motors.json`](../../termos/clientes/ricardo-motors.json): R$ 399, 5 dias úteis, Cloudflare
Pages) e o Painel Renderiza com **2 módulos, Meu site e Estoque** (R$ 49 por mês, a partir de 30 dias depois da
entrega).

**O que foi prometido (a proposta, `/proposta/ricardo-motors`):**

1. O site dele no ar, igual à demo aprovada (`/demo/ricardo-motors`).
2. No painel, o **Estoque**, como no vídeo: criar um carro (fotos, dados, preço, descrição), mudar, marcar vendido,
   reservar, destacar, tirar do ar e pôr de novo. Salvou, está no site.
3. O **Meu site** para o resto do site (textos, fotos, contato). **O Meu site não mexe no estoque:** o estoque chega
   ao site por outra rota da API.
4. **Sem o painel, o site não mostra preço:** fica a lista do dia da entrega, sem valor, com "confirme a
   disponibilidade pelo WhatsApp". Com o painel respondendo, os carros e os preços vêm de lá.
5. Tudo serve aos próximos clientes: o nicho **automotivo** entra no painel inteiro (cadastro, onboarding, palavras),
   ao lado de eventos e fotografia, e o estoque é por nicho (carros agora, ótica depois).

O desenho do módulo e o **Contrato v1** (a tabela, a API, o site) estão em
[`12-modulo-estoque.md`](../painel-clientes/12-modulo-estoque.md). As paradas do modelo ([`README.md`](README.md), A a
E) estão juntas aqui: a 2 é a A, a B e a C; a 3 é a D e a E. Não é cravado em pedra: se algo não fizer sentido,
proponha o ajuste e registre no diário.

## Onde o trem está

| Parada | Situação | Sessão / branch | Atualizada |
|---|---|---|---|
| 0 · Investigação e contrato | **feita** | `estoque-plano` (na `main`) | 24/11/2026 |
| 1 · O Estoque e o nicho automotivo no painel (STG) | **feita** (1A a 1E; a 1C sem a prévia do site ao lado, que fica para a 2C) | `main` (sessão do plano) | 24/11/2026 |
| 2 · O site dele, ligado ao painel | 2A e 2C **feitas**; 2B **pronta** (o gerador): falta só rodar no repositório dele (**R1**) | `main` (sessão do plano) | 24/11/2026 |
| 3 · Produção e entrega | esperando o **R3** (o "pode") para a 3A e a 3B; a 3C espera o **R1** | | |

**Situação:** `livre` · `em andamento` · `feita` · `travada` (diga por quê no diário). **Pegou uma parada ou uma
tarefa?** No primeiro commit, mude **só a linha dela** aqui: `em andamento` (com a tarefa), a branch e a data. Nunca
pegue o que está `em andamento` em outra sessão sem a Renderiza pedir. 1 e 2 andam ao mesmo tempo, em sessões
diferentes: cada uma mexe só no seu "Mexe em" e as duas seguem o Contrato v1.

**Esperando a Renderiza (Kaue):**

| | O quê | Para |
|---|---|---|
| R1 | Criar o repositório do site (privado), com a conta da Renderiza no GitHub como colaboradora e o app do Claude instalado nele; abrir a sessão com ele selecionado (**com o Kaue, 24/11**) | 2B |
| R2 | O domínio (**ainda não decidido**; até lá, o site fica no `<projeto>.pages.dev`) | 3C |
| R3 | O "pode" para a migração na produção, a função `assistente` (se a 1D mudar) e a conta dele | 3A |

**Decidido com a Renderiza (24/11):** os 15 carros da demo entram como à venda (ele tira do ar o que não tiver); o
WhatsApp é o que já está na demo (o link da bio; se ele trocar, avisa); a conta dele **nasce ativa e parada**: o
usuário criado, a senha ele cria depois pelo link, e até lá a Renderiza entra na conta pelo suporte do Admin para
configurar e validar; o Estoque é um dos 2 módulos; vendido sai do site na hora; reservado aparece com a etiqueta.

## O que já existe (não refazer)

| O quê | Onde | Para quê aqui |
|---|---|---|
| O protótipo do Estoque: lista, chips, busca, ações de um toque, gaveta com fotos (reduzidas no navegador), campos do nicho, preço, selos, prévia | `exemplos/estoque/` (`modulo.js`, `esquemas.js`, `loja-local.js`, `nicho-automotivo.js`, `estoque.css`) | vira o módulo de verdade (1C): troca a loja do navegador pela do banco |
| O painel do Ricardo em protótipo e o vídeo | `demos/ricardo-motors/painel.html`, `gravacoes/ricardo-motors-estoque.mp4` | o que ele viu e aprovou |
| A demo (a proposta aceita), feita à mão, com os 15 carros e as fotos dentro do HTML | `demos/ricardo-motors/index.html`, `ficha.md` | a origem do site (2B); o `doPainel` dela já traduz um item do painel para a vitrine |
| O Meu site inteiro (script no site, API, editor ao vivo, indicadores) | `ferramentas/meu-site/meu-site.js`, `painel-clientes/api/publico/site/`, `src/modulos/meu-site/`, `03` | a 2B só põe as marcações; nada muda nele |
| A imagem pública, o bucket `site-imagens`, o `conta_do_site`, o cache de 20 s | `painel-clientes/api/publico/imagens/`, migrações `…110300`, `…135228` | o Estoque usa os mesmos, sem rota nova de imagem |
| O `virar-site` (fotos para `img/`, `_headers`, `"painel": {"codigo", "api"}`) e a conferência | `scripts/virar-site.mjs`, `scripts/conferir-site.mjs` | ganha a opção `"estoque": true` (2A) |
| O Admin: conta nova (o nicho sai de `src/nichos/`), módulos, site, convite por link, suporte | `painel-clientes/src/admin/` | cria a conta de teste (2C) e a dele (3B) sem código novo |

**O que a investigação achou (24/11):**

- `contas.nicho` e `demos.nicho` só aceitam `eventos` e `fotografia`: a migração da 1A abre `automotivo`.
- `["eventos", "fotografia"]` está escrito à mão em várias telas (`telas/comecar.js`, `telas/acesso.js`,
  `admin/contas/nova.js`, o tema em `app.js`) e no roteiro da IA (`supabase/functions/assistente/logica.js`): a 1B e a
  1D trocam pela lista de `src/nichos/`.
- `exemplos/painel/src` é uma **cópia** de `painel-clientes/src`: mexeu na casca ou nos nichos, rode
  `node ferramentas/exemplos/painel-de-verdade.mjs` e o `test/meu-site-exemplo.test.mjs` (aviso de 18/11).
- A demo leva o rastreio da prospecção e as fotos em base64 (26 MB): o `virar-site` tira as fotos para `img/`, e a
  conferência acusa o rastreio que sobrar.
- O código do Estoque pode ir para a `main` antes da produção: sem a linha `estoque` no catálogo da produção, nenhuma
  conta tem o módulo. Até a 3A, o Admin da produção mostra "Automotivo" na conta nova, mas o banco recusa (esperado).

## O mapa

```
 0 · contrato ✅ ──┬── 1 · Estoque e automotivo no painel (STG) ──┐
                   └── 2 · o site dele (2A já; 2B com o R1) ───────┴── 2C · a ponte no STG ── 3 · produção e entrega
```

## A rapidez e a UX (vale para todas as tarefas)

- **A rota:** uma chamada ao banco (`publico_estoque`, com índice por conta e situação), resposta só com o que o site
  mostra, cache de 20 s na rede servindo a anterior enquanto busca. O site pede a API **no `<head>`**, antes do resto
  carregar, e guarda a resposta na sessão do navegador: trocar de página não pede de novo.
- **As fotos:** duas por envio, feitas no navegador do painel: a grande (1600 px, a página do carro) e a pequena
  (640 px, o card e a capa). O site nunca baixa a grande para mostrar um card. Cache de 1 ano (o nome muda a cada
  envio).
- **Sem pulo na tela:** a vitrine de reserva já tem o tamanho certo; quando a lista do painel chega, troca sem
  piscar, e quem já estava rolando não perde o lugar.
- **No painel:** salvou, fechou; o item aparece na lista na hora (o envio das fotos mostra o andamento); vendido
  com "Desfazer"; tudo funciona com o dedo no celular, no pátio.

---

## Parada 0 · Investigação e contrato ✅

Feita em 24/11: o painel lido (login, módulos, `pode()`, Meu site, API pública, Storage, Admin, nichos), os trilhos
da Rafaela e da Bia, o **Contrato v1** no `12`, este trilho, o aviso em `missoes.md` e as lições no `README`.

## Parada 1 · O Estoque e o nicho automotivo no painel (STG)

**Chegou quando:** no `localhost:5180` contra o STG, o dono da Garagem Aurora (fictícia, automotiva) entra, passa
pelo onboarding com perguntas de revenda, cria um carro com foto, muda o preço, marca vendido (e desfaz), reserva,
destaca, oculta e mostra de novo, no celular e no computador; quem "só vê" não tem os botões; e
`GET /api/publico/estoque/garagem-aurora` mostra cada mudança. `npm test` e `npm run fluxos` verdes; tudo na `main`.

**Mexe em** (dentro de `painel-clientes/`): uma migração nova, um teste do banco, `supabase/semente/` (só a Garagem
Aurora), `api/publico/estoque/`, `src/modulos/estoque/` (nova), `src/nichos/automotivo.js` (novo), as telas que têm os
nichos escritos à mão (`telas/comecar.js`, `telas/acesso.js`, `telas/montar/roteiro.js`, `admin/contas/nova.js`,
`app.js`), `supabase/functions/assistente/logica.js`, os testes novos. **Arquivos comuns, com aviso em `missoes.md`:**
`src/modulos/index.js`, `src/nichos/index.js`, `src/telas/casca.js`. Fora da pasta: o `05` e o `04` (as linhas do
Estoque), "Migrações aplicadas" e `exemplos/painel/src` (só pela `painel-de-verdade.mjs`).

| ID | O quê | Depende de |
|---|---|---|
| 1A | **Banco e rota.** A migração do Contrato v1, item 1 (`estoque_itens`, RLS, `estoque` no catálogo, `automotivo` nos nichos, as políticas do `site-imagens` para `estoque-*`, `publico_estoque`), testada no banco local (RLS e isolamento) e aplicada no STG pelo `scripts/migrar.mjs`, registrada no mesmo push. A rota `api/publico/estoque/[codigo]/index.js` no molde da do site (`tratar()` testável sem rede, CORS, cache, 404), montando a `url` e a `mini` das fotos. A semente da Garagem Aurora (site `garagem-aurora` no `localhost`, Meu site e Estoque, 4 carros: um oculto, um reservado, um vendido). Conferir no STG com `curl`. | — |
| 1B | **O nicho automotivo no painel inteiro.** `src/nichos/automotivo.js` com as mesmas chaves dos outros (as palavras do `exemplos/estoque/nicho-automotivo.js`), registrado; as listas escritas à mão passam a sair de `NICHOS` (cadastro, tela de entrar, tema, Admin); o tema escuro do protótipo (`rz-tema-automotivo`) em tokens. Conferir que Início, Serviços, Equipe e Configurações abrem bem numa conta só com Meu site e Estoque. | — |
| 1C | **A tela do Estoque.** `exemplos/estoque/modulo.js` e `esquemas.js` vão para `src/modulos/estoque/`, com a `loja` de fora; a loja do banco (`loja-banco.js`: `listar`, `salvar`, `mudar`, `remover` com a sessão de quem entrou) e as fotos (grande e pequena, enviadas ao `site-imagens`; tirar a foto apaga os arquivos); o `estoque.css` vira peças `.rz-*` e tokens; "só vê" sem os botões; registro, ícone e a cópia dos exemplos. Testes da lógica sem banco. A prévia do site ao lado (computador) entra se não atrasar: não trava a entrega. | 1A no STG |
| 1D | **O onboarding do automotivo.** O roteiro (`telas/montar/roteiro.js`) e o da IA (`assistente/logica.js`) com perguntas de revenda: quantos carros tem hoje, se anuncia em portal (Webmotors, OLX), se trabalha com blindados, consignação, financiamento e troca, quem mexe no estoque; no fim, o painel montado (os serviços que ele marcou) e o primeiro passo "cadastre o primeiro carro". Sem perguntas de agenda e de festa. | 1B |
| 1E | **O fluxo e a subida.** `test/fluxos/estoque.fluxo.mjs` (Playwright, STG, celular e computador) com o "chegou quando" inteiro; `npm test` e `npm run fluxos` verdes; push na `main`; a linha e o diário. | 1C, 1D |

## Parada 2 · O site dele, ligado ao painel

**Chegou quando:** o site está no repositório dele; sem o painel, abre igual à demo, **sem nenhum preço** e com o
aviso do WhatsApp; ligado à conta de teste do STG, o teste da 2C passa inteiro; os prints de antes e depois
(celular e computador) batem.

**Mexe em:** o repositório dele (todo); no `renderizaweb/Renderiza`: `demos/ricardo-motors/site.json` (novo),
`ferramentas/estoque/` (novo), `scripts/virar-site.mjs` e `scripts/conferir-site.mjs` (só a opção do estoque), os
testes deles, `painel-clientes/test/fluxos/ponte-estoque.fluxo.mjs` (novo). **Não mexe** na demo nem no `painel.html`.

**Decisão (24/11):** o site nasce da demo **uma vez** (2B). Dali em diante, a fonte do site é o repositório dele (um
site feito à mão, como o da Bia); a demo fica congelada como a proposta. Atualizar o `meu-site.js` ou o `estoque.js`
num site entregue é trocar o bloco `<script>` dele, que o `virar-site` põe no fim do `<head>` com um atributo que o
identifica (`data-codigo` no Meu site; a 2A dá um próprio ao do estoque).

| ID | O quê | Depende de |
|---|---|---|
| 2A | **O script do estoque.** `ferramentas/estoque/estoque.js` (Contrato v1, item 3: pede no `<head>`, espera até 6 s, confere, guarda 60 s na sessão, chama `window.rzEstoque`), a opção `"estoque": true` no `virar-site` e a conferência acusando `data-site-*` dentro de `[data-estoque]`. Testes sem rede: resposta boa, 404, demora, foto de outro endereço, versão errada. | — |
| 2B | **O site no repositório dele.** Feito o gerador (`demos/ricardo-motors/entrega.mjs`, 24/11): com o repositório, é rodar `node demos/ricardo-motors/entrega.mjs <checkout dele>`, conferir e dar push. O que ele faz: `site.json` (o `pages.dev` até a R2, nome, cor, schema.org `AutoDealer`, `"painel": {"codigo": "ricardo-motors", "estoque": true}`) e o `virar-site` da demo para o repositório (fotos em `img/`, sem o rastreio da prospecção, sem o ouvinte de exemplo, sem link para `/demo/`). Nele: a **versão de reserva** (os 15 carros sem preço também na capa e na página do carro; o aviso "O estoque muda todo dia: confirme a disponibilidade pelo WhatsApp"; a vitrine com `data-estoque`); o `window.rzEstoque` a partir do `doPainel` da demo (vitrine, filtros, contagem, capa com os destaques, a foto pequena no card); as marcações do **Meu site** fora da vitrine (capa, quem é o Ricardo, serviços, contato). Push na `main` dele. | R1 (dá para preparar antes numa pasta de saída) |
| 2C | **A ponte no STG e a revisão.** Pelo Admin do STG, a conta "Ricardo Motors (teste)" (automotivo, Meu site e Estoque, site `ricardo-motors` no `localhost`). `ponte-estoque.fluxo.mjs`, num teste só, no celular e no computador: o site abre sem preço → o painel cria um carro → em até 30 s ele está no site, com preço → vendido some → oculto some → reservado aparece com a etiqueta → o Meu site muda a capa e não oferece nada da vitrine → o Estoque desligado no Admin → o site volta sem preço. Prints antes e depois, textos, links, WhatsApp, 404, Google, velocidade (a primeira tela no 4G). A Renderiza testa pela prévia (branch `stg-ricardo`, como a `stg-rafaela`). | 1A, 1C, 2A, 2B |

## Parada 3 · Produção e entrega

**Chegou quando:** o site está no ar ligado à conta dele na produção, com os 15 carros e os preços; a Renderiza
entrou pelo suporte, conferiu e tem a mensagem pronta para mandar ao Ricardo, com o link do site e o do convite.

**Mexe em:** a produção (com o "pode"), "Migrações aplicadas", o diário, o "O que aprendemos" e o `12`.

| ID | O quê | Depende de |
|---|---|---|
| 3A | **Produção.** A migração da 1A (`scripts/migrar.mjs` com `--projeto`) e, se a 1D mudou, a função `assistente`; conferidas e registradas. Depois do deploy: `npm run conferir-producao` e o `versao` de `/api/config`. | 1, 2C, R3 |
| 3B | **A conta dele, ativa e parada.** Pelo Admin: "Ricardo Motors", automotivo, ativa, Meu site e Estoque, o WhatsApp e o logo do site, o site `ricardo-motors` (o `pages.dev` e, depois, o domínio). O usuário dele criado pelo convite por link, **sem mandar** (a senha ele cria quando a Renderiza liberar; o link vale 7 dias e o Admin gera outro). Os 15 carros da demo com fotos, dados e preço, pela tela do Estoque com a Renderiza no suporte (ou por um script que entra com o login da Renderiza e passa pela RLS como a tela; nunca a chave secreta). | 3A |
| 3C | **No ar.** O Cloudflare Pages ligado ao repositório dele (o fluxo "legacy Pages", lição de 16/11), no `pages.dev`; o domínio quando a R2 vier. Conferência no ar: com o painel, os carros com preço; com o painel fora (simulado), a versão de reserva; um carro de teste nasce oculto, vai para disponível, aparece em até 1 minuto e é apagado. A mensagem para o Ricardo (o site, o convite e 5 linhas: criar um carro, mudar o preço, vendido, tirar do ar, Meu site), para a Renderiza mandar quando quiser. | 2B, 3B |
| 3D | **Fechar.** "O que aprendemos" no `README`, as fases do `12`, este trilho e o diário. | 3C |

---

## Diário de bordo (o mais novo em cima)

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 24/11/2026 | 2 | **2C feita: a ponte provada no STG.** `painel-clientes/test/fluxos/ponte-estoque.fluxo.mjs` gera o site de entrega de verdade (`entrega.mjs`, com o código de uma conta de teste e a API do painel local), serve como a hospedagem e passa inteiro (6 passos, celular e computador): painel vazio, nenhum preço; carro criado no painel aparece no site com o preço, a foto pequena no card e a grande na galeria, e a capa com ele; reservado com a etiqueta; vendido sai; o Meu site muda a capa e não mexe na vitrine; o Estoque desligado devolve a reserva, sem preço e com o aviso. A prévia pela Vercel ficou de fora: a Renderiza valida na produção, entrando na conta dele pelo suporte (3B). | Claude |
| 24/11/2026 | 2 | **2B preparada: `node demos/ricardo-motors/entrega.mjs <pasta do repositório dele>`** gera o site de entrega da demo (que fica como está): a reserva sem nenhum preço (os 15 carros "Sob consulta", na capa, no card e na página do carro; o filtro "Até R$ 250 mil" e as ordens por preço só com o painel), o aviso do WhatsApp (some com o painel), `window.rzEstoque` (vitrine, filtros, contagens e a capa com os destaques do painel; card com a foto pequena), a vitrine com `data-estoque`, o Meu site na capa, nos serviços (lista de 4), no "quem é o Ricardo" (com a foto) e no contato (o `extrair.mjs` acha as 4 partes); as 88 fotos dos carros viram arquivos em `img/c/` (a página cai de 26 MB para 109 KB). Conferido no navegador nos dois modos (reserva e painel imitado) e no teste da raiz. O `site.json` usa `ricardo-motors.pages.dev` até o domínio. Falta: o repositório (R1) e a 2C. | Claude |
| 24/11/2026 | 2 | **2A feita.** `ferramentas/estoque/estoque.js` (pede no `<head>`, 6 s, confere o contrato, guarda 60 s na sessão, entrega a `window.rzEstoque`; 404 depois de uma lista mostrada chama `rzEstoque(null)`; a prévia por `postMessage` só da origem da API); `"painel": {"estoque": true}` no `virar-site`; a conferência acusa `data-site-*` dentro de `[data-estoque]`. `test/estoque-site.test.mjs` (4 testes, sem rede). Os testes da raiz que falham aqui são os mesmos da `main` limpa (as demos fora do checkout parcial deste ambiente). | Claude |
| 24/11/2026 | 1 | **Parada 1 feita (1B a 1E).** O nicho automotivo no painel inteiro (`src/nichos/automotivo.js`: "loja", o tema grafite e dourado, o ícone; cadastro, tela de entrar, Admin e tema saem da lista de nichos; Serviços só com nome e descrição; o Início com o resumo do Estoque e "Pôr os carros no estoque"). O módulo `src/modulos/estoque/` (a tela do protótipo sobre o banco: fotos em duas medidas, 1600 e 640 px, enviadas ao subir; vendido com Desfazer; excluir com confirmação apaga as fotos; "só vê" travado; `?novo=item` e o "+" do topo). O onboarding da loja (perguntas de revenda, o Estoque primeiro no menu, os serviços marcados; a função `assistente` no STG, versão 16). O fluxo `test/fluxos/estoque.fluxo.mjs` (10 passos, verde no STG) e 256 testes verdes. Falta da 1C: a prévia do site ao lado (entra na 2C, com o site dele). | Claude |
| 24/11/2026 | 1 | **1A feita.** Migração `20261124190000_estoque` no STG (local verde, com o teste `093`: RLS, isolamento, fotos, vendido, a função pública); a rota `GET /api/publico/estoque/<código>` com testes sem rede; a semente `garagem-aurora.mjs stg` (5 carros; o site recebe 3, na ordem). Medido daqui ao STG: ~200 ms por pedido sem cache. As funções do painel passam a rodar em São Paulo (`gru1`), ao lado do banco. | Claude |
| 24/11/2026 | 1 | Trilho enxugado para 3 paradas (a pedido), com o onboarding do automotivo (1D) e as respostas da Renderiza (os 15 carros à venda, o WhatsApp da demo, a conta ativa e parada, o domínio depois). Começa a 1A. | Claude |
| 24/11/2026 | 0 | Proposta aceita. Investigação do painel e das entregas da Rafaela e da Bia; o **Contrato v1** no `12`; trilho escrito. | Claude, a pedido da Renderiza |

**Duas sessões escrevendo aqui ao mesmo tempo:** cada uma muda só a linha dela em "Onde o trem está" e põe a linha
dela no topo do diário. No `git rebase`, um conflito neste arquivo é manter as duas linhas.

## Para colar ao abrir a próxima sessão

Abrir no ambiente **"Nuvem kaue"** (variáveis `PAINEL_*` e a rede aberta), com o `renderizaweb/Renderiza` e, para a
2B em diante, o repositório do site dele selecionados (o GitHub conectado é o da Renderiza, colaboradora nele, e o
app do Claude instalado nele).

> Você vai continuar a entrega da Ricardo Motors: o módulo Estoque e o nicho automotivo no Painel Renderiza e o site
> dele, no repositório dele, ligado ao painel (Meu site e Estoque). Sua parte: **a tarefa NX** (ou a Parada N).
> Responda sempre em português, direto e curto, e não invente nada.
>
> Antes de tudo: `git fetch origin` e parta da `main`. Leia, nesta ordem: `docs/entregas/ricardo-motors.md` (onde o
> trem está, a rapidez e a UX, a sua parada, o que ela mexe, o diário), `docs/painel-clientes/12-modulo-estoque.md`
> (o **Contrato v1**), `docs/entregas/README.md`, `docs/painel-clientes/README.md`, `08-trabalho-em-paralelo.md`,
> `missoes.md` (os "Avisos entre sessões" e as "Migrações aplicadas") e os documentos que a sua parte citar (`03`,
> `04`, `05`, `09`, `10`, `11`).
>
> Se a sua parte estiver `em andamento` em outra sessão, pare e me avise. Se eu não disse a parte, proponha uma
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
