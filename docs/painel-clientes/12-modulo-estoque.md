# Módulo Estoque: os produtos do site, atualizados pelo painel

Planejado em 20/11/2026, a partir do pedido do primeiro cliente do nicho automotivo (Ricardo Motors, revenda de
carros premium e blindados em São Paulo). **Ainda não existe no painel real:** há um protótipo funcionando nos
exemplos (abaixo, "Fase 0") e este plano. Nada aqui muda o que já existe sem decisão registrada no `07`.

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
 (o que estava no dia da entrega)     ◀─2. JSON──   (cache de 20 s; só disponível e reservado)
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
  refaz filtros e contagens. Desligado do painel, o site continua com a lista do dia da entrega, como no Meu site.
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

## Fases

| Fase | O que entra | Onde |
|---|---|---|
| **0 · Protótipo** (feita, 20/11/2026: o painel do Ricardo em `/demo/ricardo-motors/painel` e o vídeo em `/gravacao/ricardo-motors-estoque.mp4`) | a tela do módulo com o painel de verdade (casca, estilo, gaveta, campos) sobre dados guardados no navegador; o esquema automotivo e o de ótica; o site do Ricardo ouvindo o protótipo ao vivo; o vídeo para o Ricardo | `exemplos/estoque/` (o módulo, sem dados de cliente) e `demos/ricardo-motors/painel.html` (o painel dele, dentro da demo) |
| **1 · Banco e API** | migração `estoque_itens` e o Storage, RLS, a função da API pública, testes de permissão; o módulo vai para `painel-clientes/src/modulos/estoque/` e entra no registro (com aviso no `missoes.md`) | STG, depois produção com o "pode" |
| **2 · Piloto automotivo** | o site do Ricardo ligado ao painel (código do site, script do estoque), o estoque dele cadastrado por nós no começo | o domínio dele |
| **3 · Ótica e indicadores** | o esquema de ótica ligado à vitrine de armações do `gerar.py`; a aba Indicadores por item; importar de planilha (CSV, já há `ui/csv.js`) | — |
| **Depois** | importar da Webmotors ou de integradores (XML), variações (loja), mais de um site por conta | só com decisão no `07` |

## Decidido e em aberto

- **Decidido (20/11):** Estoque é um módulo à parte do Meu site; sem rascunho por item (o "oculto" faz esse papel);
  os campos são por nicho, por configuração; o desenho do site é o do Meu site (inicial embutido + painel por cima).
- **Em aberto (para o Kaue):**
  1. Preço: conta como um dos 2 módulos do plano ou é um extra? Limite de itens e de fotos por plano?
  2. Vendido some na hora ou fica uns dias com a etiqueta "Vendido" (prova social, como as revendas fazem)?
  3. Reservado aparece no site com a etiqueta, ou some?
  4. Quem cadastra o estoque inicial: a Renderiza (no onboarding) ou o próprio cliente?
  5. Nome no menu por nicho: "Estoque" em todos, ou "Vitrine" na ótica?
