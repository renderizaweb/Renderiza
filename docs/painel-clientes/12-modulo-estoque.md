# Módulo Estoque: os produtos do site, atualizados pelo painel

Planejado em 20/11/2026, a partir do pedido do primeiro cliente do nicho automotivo (Ricardo Motors, revenda de
carros premium e blindados em São Paulo). **Ainda não existe no painel real:** há um protótipo funcionando nos
exemplos (abaixo, "Fase 0") e este plano. Nada aqui muda o que já existe sem decisão registrada no `07`.

**24/11/2026: o Ricardo aceitou a proposta.** A construção anda pelo trilho
[`docs/entregas/ricardo-motors.md`](../entregas/ricardo-motors.md), em paradas que várias sessões podem tocar ao
mesmo tempo, todas presas ao **Contrato v1** (abaixo).

## Em uma frase

O **Meu site** cuida do visual do site (textos, fotos, cores, seções); o **Estoque** cuida do que se vende nele:
carros, armações, produtos. O dono adiciona, edita, marca como vendido ou esgotado, e o site mostra na hora.

## Por que um módulo separado do Meu site

- **Muda todo dia, por outra pessoa.** O visual do site muda poucas vezes por ano; o estoque muda toda semana, às
  vezes do pátio, pelo celular, por quem vende (não por quem cuida da marca).
- **Não tem rascunho nem versão.** No Meu site, o rascunho e o "Publicar" protegem o site de um erro; no Estoque,
  cada item já é a unidade: salvou, aparece; vendeu, some. Um item novo pode nascer **oculto** para conferir antes.
- **Tem campos de negócio**, diferentes em cada nicho (marca, ano e km no carro; formato e material na armação),
  que viram filtros e ficha no site. O Meu site edita textos soltos; o Estoque edita registros.
- **Dá números que o dono quer ver por item:** quantas pessoas abriram aquele carro e quantas chamaram no WhatsApp
  por ele (o contador de visitas do site já sabe disso; ver "Indicadores").

## Para quem

| Nicho | Item | Como acaba | O que mais importa | Primeiro cliente |
|---|---|---|---|---|
| **Automotivo** (revenda, consultoria, multimarcas) | um veículo, único | **Vendido** (some do site) ou **Reservado** (aparece com a etiqueta) | foto boa, preço, ano e km, blindagem, procedência | Ricardo Motors |
| **Ótica** | uma armação, óculos de sol, lente | **Esgotado** (quantidade 0) | formato, material, marca, para quem (feminino, masculino, infantil) | as óticas que já têm demo (linha comum do `gerar.py`) |
| **Loja** (genérico, depois) | um produto com variações | esgotado por variação | categoria, tamanho, cor | — |

O que muda de um nicho para outro é **configuração**, nunca cópia de código (04, princípio 7): um arquivo por
nicho com os campos (o "esquema do estoque", abaixo), como já é feito com as palavras em `src/nichos/`.

## O item (os campos)

**Comuns a todos os nichos**

| Campo | Para quê |
|---|---|
| Situação | `disponivel` · `reservado` · `vendido` (ou `esgotado`) · `oculto`. Só disponível e reservado aparecem no site. |
| Destaque | aparece primeiro na vitrine e pode ir para a capa do site |
| Fotos | até 15 por item, na ordem; a primeira é a capa. O painel reduz no navegador (lado maior 1600 px, WebP) antes de enviar: a foto chega boa e leve. |
| Preço | ou "sob consulta"; opcional o preço anterior (para mostrar a baixa) |
| Selos | etiquetas curtas que o nicho sugere ("Blindado", "Abaixo da FIPE", "Lançamento") |
| Descrição | o texto do vendedor |
| Quantidade | só nos nichos de quantidade (ótica, loja); no automotivo é sempre 1 |
| Código interno | opcional, para o dono achar o item (placa, referência) |

**Automotivo** (o protótipo usa exatamente estes): marca, modelo, versão, ano de fabricação e do modelo, km, câmbio,
combustível, carroceria, cor, final da placa, blindado (e o nível), único dono, IPVA pago, licenciado, aceita troca,
revisões na concessionária, garantia de fábrica, opcionais (lista de marcar) e o link do anúncio na Webmotors
(opcional, para quem também anuncia lá). O título sai sozinho ("Porsche Cayenne"), a linha de versão também.

**Ótica:** tipo (armação, óculos de sol, lente de contato, acessório), marca, modelo ou referência, para quem
(feminino, masculino, unissex, infantil), formato (redondo, quadrado, gatinho, aviador, retangular, hexagonal),
material (acetato, metal, titânio, misto), cor, medidas (aro-ponte-haste), lente polarizada (sol).

Os filtros do site saem do esquema: cada campo marcado como `filtro` vira um chip ("Blindados", "SUVs",
"Até R$ 250 mil"; "Feminino", "Redondo").

## Como funciona por dentro (o mesmo desenho do Meu site, 03)

```
 Site do cliente                                        Painel Renderiza
 HTML com o ESTOQUE INICIAL embutido  ──1. pede──▶  /api/publico/estoque/<código do site>
 (o que estava no dia da entrega)     ◀─2. JSON──   (cache de 1 s; só disponível e reservado)
 3. troca a vitrine pela lista do painel            Supabase: estoque_itens (banco), fotos (Storage)
    erro, demora ou resposta inválida? fica a inicial
```

- **Banco (Supabase do painel):** `estoque_itens` (conta, site, nicho, situação, destaque, ordem, preço, quantidade,
  `campos` jsonb validado pelo esquema do nicho, selos, descrição, fotos com largura e altura, quem criou e quem
  mexeu por último, `vendido_em`). Fotos no Storage, num caminho por conta. **RLS** como nos outros módulos: só a
  equipe da conta, com o acesso "só vê" ou "edita" no Estoque (05).
- **API pública:** `GET /api/publico/estoque/<código>` devolve só o que o site mostra (nunca código interno, quem
  mexeu, itens ocultos ou vendidos). Mesmas regras de cache, tamanho e endereço de imagem do Meu site.
- **No site:** a vitrine do site já existe (é a da demo); o script do estoque troca a lista inicial pela do painel e
  refaz filtros e contagens. Desligado do painel, o site fica com a versão de reserva: a lista do dia da entrega, sem preço (Contrato v1, item 3).
- **Indicadores:** o contador de visitas do site já registra "Ver BMW 530e" (o carro aberto) e o WhatsApp de cada
  página de carro. A aba Indicadores do Estoque mostra os itens mais vistos e os que mais geraram conversa, por
  período. É o argumento de venda para o dono: "este carro foi aberto 48 vezes e ninguém chamou; o preço?".

## No painel (o que o dono vê)

- **Lista** com foto, título, ano e km (ou o resumo do nicho), preço e a situação; chips Disponíveis · Reservados ·
  Vendidos · Ocultos, com a contagem; busca. No celular, uma linha por item; no computador, a lista e o site ao lado
  (a mesma prévia ao vivo do Meu site, Celular e Computador).
- **Ações de um toque** em cada item: Vendido, Reservar, Destacar, Ocultar. "Vendido" pede confirmação e tem
  desfazer (o aviso com "Desfazer" do painel).
- **Adicionar e editar** numa gaveta: fotos primeiro (tirar do celular no pátio), depois os campos do nicho, preço,
  selos, descrição e "Mostrar no site". Os campos de escolha trazem as opções do nicho; marca e modelo sugerem os
  já usados na conta.
- **Ordem:** destaque primeiro, depois os mais novos; o dono pode arrastar para mudar.
- **Quem pode:** o dono dá "edita" a quem vende e "só vê" a quem só consulta (Equipe e acessos).

### Trazer do anúncio da WebMotors (26/11/2026)

Pedido da Renderiza: não digitar de novo o carro que já está anunciado. A WebMotors **recusa leitura automática** da
página (proteção anti-robô, 403) e **não se contorna** (termos de uso, risco de bloquear o próprio anunciante, quebra
a cada mudança deles). O caminho é o navegador da própria pessoa:

- **Onde:** no topo de "Adicionar carro", **só no computador** (`(min-width: 900px) and (pointer: fine)`), só no carro
  novo e só no nicho automotivo: "Já anunciou este carro na WebMotors? · Trazer do anúncio".
- **Como:** o passo a passo animado (1. abra o anúncio; 2. copie a página toda, Ctrl+A e Ctrl+C; 3. cole aqui, Ctrl+V;
  no Mac, ⌘), parado para quem pede menos movimento, e a área de colar. Colou, os campos se preenchem e piscam, a área
  fecha, sai o resumo ("Pronto: 20 campos vieram do anúncio · Porsche Cayenne 2023/2024 · 21.500 km · R$ 689.900") e
  "Adicionar fotos" chama atenção. Texto que não é anúncio: o aviso, e nada muda.
- **O que vem** (`src/modulos/estoque/webmotors.js`, sem IA e sem rede): marca, modelo e versão (as linhas antes da
  ficha; a grafia que a conta já usa vale), os anos, km, câmbio, carroceria, combustível, final da placa, cor, os sete
  sim/não, o preço do "Valor anunciado" (nunca a FIPE, a média ou os anúncios parecidos da mesma página), a descrição
  ("Sobre este carro") e os itens: os que têm caixa viram opcionais, os outros vão para o fim da descrição
  ("Itens: …"). **As fotos não vêm.** O link sozinho dá marca, modelo, versão e anos (estão no endereço).
- **Testes:** `test/webmotors.test.mjs` (um anúncio fictício na ordem da página, `test/fixtures/anuncio-webmotors.txt`)
  e `test/fluxos/webmotors.fluxo.mjs` (no STG: copiar, Ctrl+V, conferir os campos, salvar; o aviso; o celular sem o
  cartão). Conferido também com dois anúncios de verdade da Ricardo Motors salvos pela Renderiza (fora do repositório).

## Contrato v1 (fixado em 24/11/2026)

É o que deixa o banco, o painel e o site serem feitos **ao mesmo tempo, por sessões diferentes**, sem uma esperar a
outra (o trilho da entrega: [`docs/entregas/ricardo-motors.md`](../entregas/ricardo-motors.md)). Quem precisar
mudar algo aqui muda este documento no mesmo commit e deixa um aviso em `missoes.md` (08).

**1. Banco** (uma migração, `AAAAMMDDHHMMSS_estoque.sql`)

| Coluna | Tipo e regra |
|---|---|
| `id` | `uuid` primary key |
| `conta_id` | `uuid` not null, da `contas` (apagar a conta apaga os itens) |
| `esquema` | `text` not null: o do nicho da conta (`automotivo`); o painel valida os `campos` por ele |
| `situacao` | `disponivel` (padrão) · `reservado` · `vendido` · `oculto` |
| `destaque` | `boolean`, padrão `false` |
| `ordem` | `integer`, padrão 0 (menor primeiro, depois do destaque) |
| `preco`, `preco_antes` | `numeric(12,2)`, ≥ 0; `preco` vazio = "Sob consulta"; `preco_antes` é opcional (a baixa) |
| `quantidade` | `integer` ≥ 0, padrão 1 (no automotivo, sempre 1) |
| `campos` | `jsonb` objeto, até 20 KB (os campos do nicho: marca, modelo, ano…) |
| `selos` | `text[]`, até 8, cada um com até 30 letras |
| `descricao` | `text`, até 4000 letras, padrão vazio |
| `fotos` | `jsonb` lista de até 15 `{ "arquivo": "<conta>/estoque-<aleatório>.webp", "mini": "<conta>/estoque-<aleatório>-m.webp", "w": 1600, "h": 1067 }`; a primeira é a capa. O painel faz as duas no navegador: a grande (lado maior 1600 px) e a pequena (640 px, para o card) |
| `codigo_interno` | `text` opcional, até 40 (placa, referência); **nunca sai na API** |
| `vendido_em` | o banco põe quando vira `vendido` e tira quando sai |
| `criado_em`, `atualizado_em` | como nas outras tabelas (`05`); o histórico de quem mexeu fica para depois |

- **Índice** por `(conta_id, situacao)`: a função pública lê só disponível e reservado da conta.
- **RLS:** ver com `pode(conta, 'estoque', 'ver')`; criar, mudar e apagar com `pode(conta, 'estoque', 'editar')`.
  Teste de isolamento (uma conta não vê nem muda o item da outra), como em toda tabela nova.
- **Catálogo:** `modulos` ganha `('estoque', 'Estoque', 14.99, 8)`. O Admin liga e desliga como os outros.
- **Nicho:** `contas.nicho` e `demos.nicho` passam a aceitar `automotivo`.
- **Fotos:** no bucket público `site-imagens` que já existe (só WebP, até 2 MB), com o nome
  `<conta>/estoque-….webp`. Políticas novas: quem edita o Estoque envia, troca e tira só arquivos `estoque-*` da
  própria conta. A rota `/api/publico/imagens/…` já serve esses arquivos, sem mudança.
- **Função `publico_estoque(p_codigo)`** (`security definer`, liberada ao visitante como as outras `publico_*`):
  usa `conta_do_site(p_codigo, 'estoque')` e devolve `null` quando o site não responde (desconectado, conta não
  liberada, módulo desligado).

**2. API pública:** `GET /api/publico/estoque/<código do site>`, com **1 s** de cache na rede (25/11/2026: o estoque
tem de aparecer na hora; o 1 s só junta as visitas do mesmo segundo) e `404 {"erro":"fora"}` quando a função devolve
`null`.

```json
{ "versao": 1, "esquema": "automotivo", "atualizado_em": "2026-11-24T18:00:00Z",
  "itens": [ { "id": "…", "situacao": "disponivel", "destaque": true, "preco": 689900, "preco_antes": null,
               "quantidade": 1, "selos": ["Blindado"], "descricao": "…",
               "campos": { "marca": "Porsche", "modelo": "Cayenne", "ano_fab": 2019, "km": 21000 },
               "fotos": [ { "url": "/api/publico/imagens/<conta>/estoque-….webp",
                            "mini": "/api/publico/imagens/<conta>/estoque-…-m.webp",
                            "w": 1600, "h": 1067 } ] } ] }
```

Só `disponivel` e `reservado`, na ordem destaque, `ordem` e mais novo; até 300 itens. Nunca: `codigo_interno`,
quem mexeu, itens ocultos ou vendidos. A função devolve o `arquivo` e a `mini`; a rota devolve as duas como **caminho da própria API**
(`/api/publico/imagens/…`; sem a pequena, a `mini` é a grande), e o script do site completa com o endereço que chamou:
o local, o STG e a produção funcionam igual, e o site só mostra foto da API.

**3. No site**

- A vitrine é uma seção marcada com `data-estoque`. **Nada dentro dela tem `data-site-*`:** o Meu site não mexe no
  estoque (a conferência do site acusa). O resto do site (capa, sobre, serviços, contato) segue no Meu site.
- **A versão de reserva** (a que está no HTML): os itens do dia da entrega **sem preço** ("Consulte") e o aviso
  "O estoque muda todo dia: confirme a disponibilidade pelo WhatsApp" (`data-estoque-aviso`). Sem o painel, o site
  nunca mostra um preço que pode estar errado.
- **O script** `ferramentas/estoque/estoque.js` entra pelo `virar-site` com `"painel": { "codigo", "estoque": true }`.
  Ele mostra na hora a lista que a sessão do navegador já tinha e pede **sempre** a da API (espera até 6 s; de novo
  quando a pessoa volta à aba ou à janela, no mínimo a cada 3 s), confere a resposta (versão 1, lista, foto só do
  endereço da API) e, só se mudou, chama `window.rzEstoque(itens, { esquema, atualizado_em })`, que o site define: refaz a
  vitrine, os filtros, a contagem e a capa com os destaques, e esconde o aviso. Erro, demora ou resposta inválida: o
  script não chama nada e o site fica com a versão de reserva. Se uma lista já foi mostrada (da sessão) e o painel
  responde 404, o script chama `window.rzEstoque(null)`: o site volta à reserva. O bloco no `<head>` é
  `<script data-estoque="<código>">` (com `data-api` só em teste).
- **Prévia no painel** (feita em 25/11/2026: o site ao lado no computador e "Ver o site" no celular, na tela do
  Estoque, quando a conta tem o site cadastrado): com `?rz-estoque=previa`, dentro de um quadro do painel, o script aceita
  `{ tipo: "rz-estoque", itens }` por `postMessage`, só da origem da API, e responde `rz-estoque-pronto` (como o
  protótipo).

**4. No painel:** o módulo mora em `src/modulos/estoque/` (o `exemplos/estoque/modulo.js`, com a loja do navegador
trocada pela do banco; a mesma interface: `listar`, `salvar`, `mudar`, `remover`), os esquemas em
`src/modulos/estoque/esquemas.js` (os do protótipo) e as palavras do nicho em `src/nichos/automotivo.js`.

## Fases

| Fase | O que entra | Onde |
|---|---|---|
| **0 · Protótipo** (feita, 20/11/2026: o painel do Ricardo em `/demo/ricardo-motors/painel` e o vídeo em `/gravacao/ricardo-motors-estoque.mp4`) | a tela do módulo com o painel de verdade (casca, estilo, gaveta, campos) sobre dados guardados no navegador; o esquema automotivo e o de ótica; o site do Ricardo ouvindo o protótipo ao vivo; o vídeo para o Ricardo | `exemplos/estoque/` (o módulo, sem dados de cliente) e `demos/ricardo-motors/painel.html` (o painel dele, dentro da demo) |
| **1 · Banco, API e módulo** (feita no STG em 24/11, na `main`; a produção na Parada 3: a Parada 1 do [trilho do Ricardo](../entregas/ricardo-motors.md), com o nicho automotivo no painel inteiro e o onboarding dele) | o contrato v1 acima: migração, RLS, Storage, `publico_estoque`, a rota, o módulo em `src/modulos/estoque/` e o nicho automotivo | STG, depois produção com o "pode" |
| **2 · Piloto automotivo** (paradas 2 e 3 do trilho) | o site do Ricardo no repositório dele, com a versão de reserva sem preço e o script do estoque; a conta dele com Meu site e Estoque; o estoque de hoje cadastrado por nós | o domínio dele |
| **3 · Ótica e indicadores** | o esquema de ótica ligado à vitrine de armações do `gerar.py`; a aba Indicadores por item; importar de planilha (CSV, já há `ui/csv.js`) | — |
| **Depois** | importar da Webmotors ou de integradores (XML), variações (loja), mais de um site por conta | só com decisão no `07` |

## Decidido e em aberto

- **Decidido (20/11):** Estoque é um módulo à parte do Meu site; sem rascunho por item (o "oculto" faz esse papel);
  os campos são por nicho, por configuração; o desenho do site é o do Meu site (inicial embutido + painel por cima).
- **Decidido (24/11, com a proposta aceita pelo Ricardo):** o Estoque é **um dos 2 módulos** do plano de R$ 49 (o
  termo dele: "Meu site e Estoque"); a versão de reserva do site **não mostra preço**; **vendido sai do site** na
  hora; **reservado aparece** com a etiqueta; **a Renderiza cadastra o estoque inicial** (os carros da demo,
  conferidos com ele); o nome no menu é "Estoque"; até 300 itens e 15 fotos por item.
- **Em aberto:** "Vitrine" em vez de "Estoque" na ótica; o vendido ficar uns dias com a etiqueta (prova social),
  se algum cliente pedir.
