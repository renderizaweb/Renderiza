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
| 2 · O site dele, ligado ao painel | **feita** (o site na `main` do `ricardomotorsdev-hue/ricardomotors`, `93c7127`) | `main` (sessão do plano) | 24/11/2026 |
| 3 · Produção e entrega | 3A, 3B e 3C **feitas** (site no ar em ricardomotorsconsultoria.com.br, ligado ao Meu site e ao Estoque); falta a mensagem de entrega | `main` (sessão do plano) | 26/11/2026 |

**Situação:** `livre` · `em andamento` · `feita` · `travada` (diga por quê no diário). **Pegou uma parada ou uma
tarefa?** No primeiro commit, mude **só a linha dela** aqui: `em andamento` (com a tarefa), a branch e a data. Nunca
pegue o que está `em andamento` em outra sessão sem a Renderiza pedir. 1 e 2 andam ao mesmo tempo, em sessões
diferentes: cada uma mexe só no seu "Mexe em" e as duas seguem o Contrato v1.

**Esperando a Renderiza (Kaue):**

| | O quê | Para |
|---|---|---|
| R1 | **Criado em 24/11:** `ricardomotorsdev-hue/ricardomotors` (vazio), com a Kaue7almeida como colaboradora. A sessão clona, mas o push é recusado: **falta instalar o app do Claude na conta `ricardomotorsdev-hue`** (só nesse repositório). O site já está gerado e commitado no clone local; com o app, é só o push (ou rodar de novo `node demos/ricardo-motors/entrega.mjs <pasta>` numa pasta fora do clone e copiar para dentro: o `virar-site` limpa a pasta de saída, inclusive o `.git`). | 2B |
| R2 | O domínio (**ainda não decidido**; até lá, o site fica no `<projeto>.pages.dev`). **O `ricardomotors.com.br` não é dele** (consulta pública em 24/11): é da RICARDO MOTORS LTDA, CNPJ 59.838.940/0001-05, uma revenda de usados em Rio do Sul/SC (ativa desde 03/2025), com site no ar nesse domínio (Next.js, atrás do Cloudflare, telefone (47) e endereço de Rio do Sul). Registrado em 30/10/2026, vence em 30/10/2027. A marca dele no INPI (processo 942976223, em exame de mérito) não dá o domínio. Caminho (24/11): um `.com.br` novo no **Registro.br, pago pela Renderiza, com o CPF ou CNPJ dele como titular** (o domínio é dele). Sugeridos, livres em 24/11: `rmconsultcar.com.br` (o recomendado: igual ao Instagram) e `ricardomotorssp.com.br`. O termo dele diz "domínio: cliente tem"; isso mudou. | 3C |
| R3 | ~~O "pode" para a produção~~ **Dado em 24/11** ("pode subir tudo para produção") | 3A |

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
| 3B | **A conta dele, ativa e parada.** O estoque: `node demos/ricardo-motors/estoque-inicial.mjs --painel https://painel.renderizaweb.com.br --codigo ricardo-motors` (com `ESTOQUE_LOGIN` e `ESTOQUE_SENHA` de um login que edita na conta; ensaiado no STG em 24/11; `--simular` mostra o que entra). Pelo Admin: "Ricardo Motors", automotivo, ativa, Meu site e Estoque, o WhatsApp e o logo do site, o site `ricardo-motors` (o `pages.dev` e, depois, o domínio). O usuário dele criado pelo convite por link, **sem mandar** (a senha ele cria quando a Renderiza liberar; o link vale 7 dias e o Admin gera outro). Os 15 carros da demo com fotos, dados e preço, pela tela do Estoque com a Renderiza no suporte (ou por um script que entra com o login da Renderiza e passa pela RLS como a tela; nunca a chave secreta). | 3A |
| 3C | **No ar.** O Cloudflare Pages ligado ao repositório dele (o fluxo "legacy Pages", lição de 16/11), no `pages.dev`; o domínio quando a R2 vier. Conferência no ar: com o painel, os carros com preço; com o painel fora (simulado), a versão de reserva; um carro de teste nasce oculto, vai para disponível, aparece em até 1 minuto e é apagado. A mensagem para o Ricardo (o site, o convite e 5 linhas: criar um carro, mudar o preço, vendido, tirar do ar, Meu site), para a Renderiza mandar quando quiser. | 2B, 3B |
| 3D | **Fechar.** "O que aprendemos" no `README`, as fases do `12`, este trilho e o diário. | 3C |

---

## Diário de bordo (o mais novo em cima)

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 27/11/2026 | 3 | **O quadro do vendedor saiu dos opcionais.** O Ricardo mandou um vídeo editando o BMW 330e: entre os opcionais, "Sobre o vendedor", "Ricardo Motors", "São Paulo, SP", "Loja fechada - Abre quarta às 9h00", "(11)", "9478" (o quadro do vendedor da página da WebMotors, que a carga inicial de 24/11 copiou junto com os itens). O 330e ele mesmo limpou; os outros 7 (Hilux SW4, Macan, Q7, 320i, Pajero Sport, Range Rover Evoque, Classic) foram limpos na produção, só esses 6 textos, com o "pode" da Renderiza, e a demo de origem também (a reserva do site). Para não voltar: uma regra só (`esquemas.js`, `limparOpcionais`) na colagem do anúncio, na tela do carro (não vira caixa e sai ao salvar) e nas cargas por script. Ver [`12`](../painel-clientes/12-modulo-estoque.md), "O quadro do vendedor nunca é item". | Claude, com o "pode" da Renderiza |
| 27/11/2026 | 3 | **Os carros mais vistos nos Indicadores.** Meu site · Indicadores ganhou "Carros mais vistos" (aberturas e cliques no WhatsApp de cada carro) e nomes legíveis ("Estoque (a vitrine)", "Página de um carro", "Pelo painel"); o site dele conta "ver.<id>" e "zap.<id>" sem mudar o banco. As 33 visitas de 26-27/11 não têm o carro: o quadro mostra só o que vier daqui em diante, sem dizer que começou agora. Ontem: o limite de fotos subiu para 20 (migração `20261126170000`, com o "pode"). | sessão do plano |
| 26/11/2026 | 3 | **Revisão antes de mandar o acesso.** Site no ar (computador e celular): sem erro de script, sem pedido falhando, sem foto quebrada, 15 carros com foto, as 15 páginas de carro abrindo com o WhatsApp certo (número da bio + o link do carro), Instagram, título, descrição, prévia (og), canônico, ícone, robots, sitemap e os dados de AutoDealer; sem rolar para o lado no celular. **Achado e corrigido:** a primeira visita baixava 20 MB no computador e 14 MB no celular (as fotos da reserva e depois as do painel, e as fotos deslizáveis dos cards); agora 2,0 MB e 1,6 MB, o maior elemento em 0,8 a 1,2 s (ver o commit do site leve). Painel: onboarding esperando o dono, sem eventos nem IA de teste, assinatura em 27/12, convite até 01/12, nenhuma versão do Meu site publicada, nenhum destaque marcado. Para decidir com a Renderiza: o Porsche 718 de teste (oculto, sem foto) e as 31 visitas de teste nos indicadores. Para o Ricardo: 5 carros com uma foto só e sem descrição (X2, 328i, X1, Haval H9, X3). | sessão do plano |
| 26/11/2026 | 3 | **Atualizar pelo anúncio e a trava de foto.** Num carro que já existe, "Atualizar pelo anúncio" troca o que está no painel pelo que está na WebMotors e mostra o que mudou ("Preço: R$ 689.900 → R$ 659.900"); anúncio de outro carro pede confirmação. Sem foto, o carro não vai ao site (o painel não salva disponível sem foto, as ações da lista pedem a foto, e a API não manda carro sem foto): o Porsche 718 de teste da Renderiza, sem foto, ficou oculto. | sessão do plano |
| 26/11/2026 | 3 | **Trazer do anúncio da WebMotors no "Adicionar carro" (computador).** Ele abre o anúncio, copia a página toda (Ctrl+A, Ctrl+C) e cola no painel: marca, modelo, versão, anos, km, câmbio, carroceria, combustível, final da placa, cor, os sim/não, preço, opcionais e descrição se preenchem (sem IA, sem acessar a WebMotors daqui); as fotos ele põe. Conferido com os anúncios dele do BMW 330e e do Macan (tudo certo, inclusive o preço sem confundir com a FIPE). Ver [`12`](../painel-clientes/12-modulo-estoque.md), "Trazer do anúncio". | sessão do plano |
| 26/11/2026 | 3 | **A Assinatura no painel (pedido da Renderiza; [`13`](../painel-clientes/13-assinatura.md)).** O dono vê o plano, a próxima mensalidade, o extrato e como funciona; a Renderiza combina o dia no Admin (conta · Pagamentos · "Combinar o dia") e registra o Pix como antes. Migração `20261126150000_assinatura` no STG e na produção (com o "pode" da Renderiza). O Ricardo: a primeira mensalidade em **27/12/2026** (o "30 dias depois da entrega" do termo, data dada pela Renderiza), todo dia 27, R$ 49 (o do plano). | sessão do plano |
| 26/11/2026 | 3 | **A conta dele de volta ao começo, com o que já sabemos.** O teste da conversa de boas-vindas feito pela Renderiza no suporte foi desfeito na produção (`ajustes` = `{"onboarding":{"pendente":true}}`, sem a ordem do menu nem o perfil; os 2 eventos de onboarding e os 2 usos de IA do teste apagados) e a conta ganhou o contexto (`contas_contexto`: WhatsApp, São Paulo, @rm.consultcar, o Ricardo, a descrição, os 4 serviços do site, o "sobre" e um resumo do que foi fechado, que só a Renderiza e a IA veem). Nome, WhatsApp (11947882373) e logo (o símbolo dele) conferidos. **Para não acontecer de novo:** a Renderiza no suporte não cai mais na conversa; o Início do suporte oferece "Ver a conversa", e nela nada é gravado (nem respostas, nem eventos, nem "Fazer depois"). A conversa da loja sem Atendimento também deixou de listar "Seus ensaios" na abertura. | sessão do plano |
| 26/11/2026 | 3 | **Ajustes depois da primeira olhada da Renderiza (pelo suporte).** (1) **Meu site na hora, como o Estoque:** a rota do site com 1 s de cache na rede (era 20 + 10 s) e o `meu-site.js` pede de novo ao voltar à aba (as três cópias; vale para os sites gerados daqui em diante). (2) **Título colado** ("Carros premiume blindados."): o `extrair` juntava o `<br>` sem espaço (agora `<br>` é espaço) e o título do site virou um span só, editável, com o ponto dourado fora (some se o texto já terminar em pontuação); o conteúdo inicial na produção corrigido para "Carros premium e blindados" (nada tinha sido publicado). (3) **Serviços:** na loja só o Atendimento usa a lista; sem ele no plano, o menu não mostra e o onboarding não pergunta; serviço simples ganhou Apagar; o "Venda de imoveis" de teste apagado da conta dele. (4) **Mensagem do carro:** o carro em negrito, o preço e o link da página dele (`/#carro-<id>`, que agora abre mesmo com a lista do painel chegando depois); agendar, troca e mais fotos com o link também. (5) **Logo:** o favicon "RM" em círculo era gerado; agora é o símbolo dourado do logo dele, vetorizado do logo do topo (`demos/ricardo-motors/favicon.svg`), no site e no painel (o logo da conta aponta para o favicon). (6) **WebMotors:** a página do anúncio recusa leitura por servidor (PerimeterX, 403); proposta: o link dá marca, modelo, versão e anos, e o texto do anúncio colado a IA lê; espera o sim. | sessão do plano |
| 26/11/2026 | 3 | **O site ligado ao Meu site e ao Estoque, conferido no ar.** O "WhatsApp e redes" do Meu site não mudava nada no site dele (os links eram do script da página): agora o site tem o `DEMO_RUNTIME.links()` que o `meu-site.js` chama, e o número, a mensagem geral (só nos botões gerais, `data-wa-geral`) e o Instagram publicados valem no site todo, inclusive na vitrine e na página do carro. O número é o do link da bio (`wa.me/message/G5X6UUN627ARL1` leva ao 5511947882373, "Ricardo Motors"): cada botão abre a conversa com a mensagem dele (o carro, a visita, o serviço; serviço novo ou renomeado leva o nome dele); os links já saem prontos no HTML. Conteúdo inicial na produção ajustado (só esta linha de `sites`): contato com o WhatsApp e o Instagram, os dois botões com "Abrir o WhatsApp" e a mensagem deles. **Se o conteúdo inicial for extraído de novo, repetir esse ajuste** (o `extrair` não lê a mensagem de botão com `data-whatsapp`). A prévia do Estoque (`?rz-estoque=previa`) deixou de contar visita (as três cópias do `meu-site.js`; vale para os sites gerados daqui em diante). Miniaturas da página do carro com a foto pequena. Provado no domínio de verdade (Playwright, painel imitado só na origem): sem nada publicado, com um conteúdo publicado (outro número, mensagem, Instagram, serviço novo e renomeado), a prévia do Estoque no quadro do painel (frame-ancestors) e o editor do Meu site (pronto, rascunho, volta). | sessão do plano |
| 25/11/2026 | 3 | **Termo assinado e domínio comprado.** O Ricardo assinou o `ricardo-motors-v1` em 25/11, 12h07, como empresa (RICARDO MOTORS CONSULTORIA LTDA, CNPJ no termo); marcou "Só o site" por engano: ele usa o painel (Meu site e Estoque), como combinado com a Renderiza. Domínio registrado pela Renderiza: **ricardomotorsconsultoria.com.br** (25/11). O site no repositório dele já usa o domínio (endereço oficial, prévia, sitemap: `a3910b6`), e a conta no painel tem os domínios `ricardomotorsconsultoria.com.br`, `www.` e `ricardo-motors.pages.dev`. Falta: o Cloudflare Pages com o domínio (os servidores DNS do Cloudflare no Registro.br). | Claude |
| 25/11/2026 | 1 e 2 | **Estoque na hora e o site ao lado** (pedido da Renderiza: "não pode demorar 2 ou 5 minutos"). A rota do estoque passou de 20 s (+10 s) de cache para **1 s**; o site mostra a lista da sessão na hora, pede **sempre** a do painel e de novo ao voltar à aba (antes guardava 60 s). Medido na produção: a mudança aparece na primeira consulta depois de gravada. Na tela do Estoque, **o site ao lado** (computador, Celular/Computador) e **"Ver o site"** (celular), como no vídeo: muda a cada salvamento, por mensagem, sem esperar a rede (0,6 s no teste da ponte). O site dele regenerado (`46ecb1f`). E o "Quem cuida" refeito, com a foto dele principal e a com o pai sobreposta (aprovado pelo Ricardo). | Claude |
| 24/11/2026 | 2 | **2B feita: o site na `main` do repositório dele** (`ricardomotorsdev-hue/ricardomotors`, `93c7127`, 99 arquivos), gerado pelo `entrega.mjs`. O GitHub do claude.ai voltou para a Kaue7almeida e o app do Claude foi instalado na conta dele (a lição da Rafaela, de novo). | Claude |
| 24/11/2026 | 3 | **3A e 3B feitas na produção, com o "pode" da Renderiza.** Migração `20261124190000_estoque` aplicada (`migrar.mjs producao --pode-destrutivo`, só pelo "drop" da regra de nicho) e a função `assistente` publicada (versão 8). **A conta "Ricardo Motors"** (id `74569447…`): automotivo, ativa, sem prazo, Meu site e Estoque, o site `ricardo-motors` (domínio `ricardo-motors.pages.dev`, conteúdo inicial do `extrair.mjs` do site de entrega: capa, serviços, sobre, contato), o **convite por link do usuário `ricardomotors`** (Ricardo Neves, dono, pela Renderiza; **não mandado**; vence em 01/12, e o Admin gera outro), a conversa de boas-vindas ligada para o primeiro acesso dele. **Os 15 carros** (85 fotos, os 4 da capa em destaque) pelo `estoque-inicial.mjs`, com um login temporário dono só durante a carga (119 s); depois o login e a pessoa apagados (a regra "pelo menos um dono" desligada só nessa remoção, numa transação), e o registro de uso dele também. A conta fica sem pessoas até o Ricardo aceitar o convite; a Renderiza entra pelo suporte do Admin. **Achado e corrigido:** a rota `/api/publico/imagens/…` dava 404 na Vercel desde sempre (o arquivo "pega-tudo" `[...caminho].js` não vale fora do Next.js): virou `imagens/[conta]/[arquivo].js`; as fotos do Estoque e as do Meu site das outras contas voltaram (200). Conferido: a rota do estoque na produção devolve os 15 (cache da Vercel: HIT), a foto pequena abre (68 KB), `conferir-producao` verde. | Claude, com o "pode" da Renderiza |
| 24/11/2026 | 3 | **3B preparada e ensaiada no STG:** `demos/ricardo-motors/estoque-inicial.mjs` cadastra os 15 carros da demo (85 fotos, os 4 da capa em destaque, a ordem da demo) pelo próprio painel: entra com um login e usa o código do módulo no navegador (fotos reduzidas no aparelho, a RLS decide). Ensaio numa conta de teste do STG, criada e apagada: 15 carros em 113 s; a rota devolve os 15 (35 KB); foto do card 68 KB, da galeria 237 KB. Na produção, com o "pode": um login temporário dono da conta dele, o script, e o login apagado (ou a Renderiza no suporte, com `ESTOQUE_LOGIN` e `ESTOQUE_SENHA` no ambiente). A produção está no ar com o painel novo (`0c2bff7`) e o `conferir-producao` verde. | Claude |
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
