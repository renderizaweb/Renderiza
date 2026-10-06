# Renderiza

> Sessão nova do Claude: leia primeiro o [`CONTEXTO.md`](CONTEXTO.md).

Um site só, publicado na Vercel:

| Endereço | O que abre | Quem vê |
|---|---|---|
| `/` | Site público da Renderiza: quem é o Kaue, o que faz, trabalhos e contato | todo mundo (é o único endereço que o Google pode indexar) |
| `/login` | Login do painel | só você |
| `/painel` | Painel da Renderiza (Ritmo, Pipeline, Conteúdo). Sem sessão, manda para `/login` | só você |
| `/demo/<ótica>` | Demo do site da ótica (ex.: `/demo/otica-catglass`) | quem tiver o link |
| `/demo/<ótica>/artes-instagram` | Kit de artes, quando o entregável é esse | quem tiver o link |
| `/flyer/<lead>.png` | Flyer de Stories (1080 × 1920) que vai de cortesia para a ótica; o painel baixa | quem tiver o link |

- `site/`: o site público. Contatos, foto e trabalhos ficam em [`site/config.mjs`](site/config.mjs);
  como editar: [`site/README.md`](site/README.md).
- `painel/`: o painel. Como funciona e como ligar o Supabase e a Vercel: [`painel/README.md`](painel/README.md).
- `demos/`: uma pasta por ótica (regras abaixo).
- Só vai para o ar o que `scripts/montar-site.mjs` põe em `publico/`: a home (montada a partir de
  `site/`), os arquivos de `site/estatico/`, o painel e os `.html` das demos. Fichas, contexto,
  ferramentas, banco e scripts nunca são publicados.
- Painel, login, demos e `/api` pedem ao Google para não indexar (`vercel.json`). A home não lista as demos.
- Endereço antigo do painel com aba (`/#pipeline`) leva sozinho para `/painel#pipeline`.
- Rodar no computador: `npm run dev` (site em `http://localhost:5173`, painel em `/painel`, demos em `/demo/<ótica>`).

# Demos

Uma pasta por ótica em `demos/`. Cada pasta é independente: criar ou mexer em uma não afeta as outras.

## Regras

1. **Nome da pasta = código da demo.** É o nome da ótica, em minúsculas e com hífen: `demos/franco-oticas`.
2. **Dentro da pasta, só o que está pronto para mostrar:**
   - `index.html`: a demo do site. Arquivo único, com as fotos dentro, que abre direto no navegador.
   - `artes-instagram.html`: quando o entregável é um kit de artes.
   - `ficha.md`: onde fica, links, situação e o que conferir antes de mandar.
3. **Rascunho não entra.** Pesquisa, fotos brutas e versões intermediárias ficam em `rascunhos/`, que o
   git ignora, ou fora do repositório.
4. **Situação da demo** (na ficha): `na fila`, `em produção` ou `pronta`. O andamento comercial (enviada,
   respondeu, fechou) fica no painel da Renderiza, não aqui.
5. **Demo nova:** crie a pasta e copie `modelo/ficha.md` para ela.

## Como é uma demo de site

- **Carrossel com muitas imagens reais**: donos, equipe, clientes, crianças, produto e fachada. Arte pronta e
  imagem de IA só em último caso.
- **Rostos**: escolher as fotos em que cada pessoa aparece melhor. É o que agrada o dono.
- **Vídeo vira foto**: usar a capa ou um quadro nítido e bem enquadrado. Vídeo no site só se for leve.
- **Site leve**: nada de efeito demais.
- **História**: contar quando a ótica tem uma. Quando não tem, não inventar enchimento.
- **Avaliações do Google sempre**, com depoimentos reais. A nota aparece só se for 4,8 ou mais; abaixo
  disso, só os depoimentos.

## Link da demo

A pasta vira o link: `demos/otica-sales/index.html` fica em `https://<site>/demo/otica-sales`. Toda vez
que uma demo chega na `main`, a Vercel publica sozinha. No painel, o campo **Link da demo** do lead
recebe só o caminho (`/demo/otica-sales`): aparece a etiqueta "demo ↗" na tabela e no kanban, e o
botão "Copiar link da demo para enviar" monta o link completo para mandar à ótica. Sem internet, dá para baixar o `.html` e abrir
direto no navegador.

## Flyer de Stories

Toda demo ganha um flyer de Stories: a cortesia que retoma o contato depois do vácuo. Fica em
`flyers/<id-do-lead>.png` (feito pelo `ferramentas/flyer/gerar.mjs` a partir do `flyers/<id>.json`), vai ao
ar em `/flyer/<id>.png` e o lead recebe `link_flyer = '/flyer/<id>.png'`. No painel, a seção **Flyer para
Stories** do lead mostra a prévia e baixa o PNG. Regras e passo a passo: [`CONTEXTO.md`](CONTEXTO.md).

## Lista

| Ótica | Onde | Entregável | Situação |
|---|---|---|---|
| [Ótica Sales](demos/otica-sales) | São Caetano do Sul | site | pronta · 29/09/2026 |
| [Ótica D&R](demos/otica-der) | São Bernardo do Campo | site | pronta · 29/09/2026 (fotos de 2018) |
| [Óticas Laodiceia](demos/oticas-laodiceia) | Diadema | site | pronta · 29/09/2026 |
| [Amitié Centro Óptico](demos/amitie-centro-optico) | Mogi das Cruzes | site | pronta · 29/09/2026 |
| [Ateliê Óptico Jabaquara](demos/atelie-optico-jabaquara) | Praça da Árvore, São Paulo | site | pronta · 29/09/2026 |
| [Ótica Líder](demos/otica-lider-guarulhos) | Guarulhos | site | pronta · 29/09/2026 |
| [Mogi Ótica](demos/mogi-otica) | Mogi das Cruzes | site | pronta · 29/09/2026 |
| [Ótica Interativa](demos/otica-interativa) | Vila Maria, São Paulo | site | pronta · 29/09/2026 |
| [Lú Elegante (moda e beleza, fora das óticas)](demos/lu-elegante-modas) | Vila São Pedro, São Bernardo do Campo | site | pronta · 01/10/2026 |
| [Clínica MS Odontologia (fora das óticas)](demos/ms-odontologia) | São Carlos, Itapevi | site | pronta · 01/10/2026 (versão 2, fotos novas) |
| [Ótica Nina](demos/otica-nina) | Vila Nova Mazzei, São Paulo | site | pronta · 02/10/2026 (lote 2 · 1ª) |
| [Ótica Boutique dos Óculos](demos/boutique-dos-oculos) | Aclimação, São Paulo | site | pronta · 02/10/2026 (lote 2 · 2ª) |
| [Ótica Haramaki](demos/otica-haramaki) | Vila Perus, São Paulo | site | pronta · 02/10/2026 (lote 2 · 3ª) |
| [Nova Ótica Bonsucesso](demos/nova-otica-bonsucesso) | Cidade Nova Bonsucesso, Guarulhos | site | pronta · 02/10/2026 (lote 2 · 4ª) |
| [Ótica Vitória Mairiporã](demos/otica-vitoria-mairipora) | Centro, Mairiporã | site | pronta · 02/10/2026 (lote 2 · 5ª) |
| [Ótica Martinez Ramos](demos/otica-martinez-ramos) | Planalto Paulista, São Paulo | site | pronta · 02/10/2026 (lote 2 · 6ª) |
| [Ótica Wagner](demos/otica-wagner) | Centro, Poá | site | pronta · 02/10/2026 (lote 2 · 7ª) |
| [Ótica e Relojoaria Dutra](demos/otica-dutra) | Cidade Dutra, São Paulo | site | parada · lote 2 · 8ª (o Instagram do lote é de outra Dutra, em Manaus; a loja real só tem 1 foto no Google) |
| [Ótica Ítalo Setti](demos/otica-italo-setti) | Baeta Neves, São Bernardo do Campo | site | pronta · 02/10/2026 (lote 2 · 9ª) |
| [Cupecê Óticas](demos/cupece-oticas) | Jardim Prudência, São Paulo | site | pronta · 02/10/2026 (lote 2 · 10ª) |
| [Ótica Perfil](demos/otica-perfil) | Tingidor, Embu das Artes | site | pronta · 02/10/2026 (lote 2 · 11ª) |
| [Ótica Pocopetz](demos/otica-pocopetz) | Centro, Mairiporã | site | pronta · 02/10/2026 (lote 2 · 12ª) |
| [Óticas RVN](demos/oticas-rvn) | Perus, São Paulo | site | pronta · 03/10/2026 (lote 2 · 13ª) |
| [Ótica Studio7](demos/otica-studio7) | Centro, Mauá | site | pronta · 03/10/2026 (lote 2 · 14ª) |
| [Lez Ótica](demos/lez-otica) | Jardim Albertina, Guarulhos | site | pronta · 03/10/2026 (lote 2 · 15ª) |
| [Ótica Machado](demos/otica-machado) | Jardim Satélite, São José dos Campos | site | pronta · 05/10/2026 (lote 3 · 1ª) |
| [Óptica Cris Masson](demos/optica-cris-masson) | Centro, Ribeirão Preto | site | pronta · 06/10/2026 (lote 3 · 2ª) |
| [Óptica Universe](demos/optica-universe) | Sítio Pinheirinho, São Paulo | site | pronta · 06/10/2026 (lote 3 · 3ª) |
| [Ótica Flash](demos/otica-flash) | Centro, Nova Iguaçu (RJ) | site | pronta · 06/10/2026 (lote 3 · 4ª) |
| [Ótica Ranulpho](demos/otica-ranulpho) | Campo Grande, Rio de Janeiro | site | pronta · 06/10/2026 (lote 3 · 5ª) |
| [Ótica Six](demos/otica-six) | Centro, Peruíbe | site | pronta · 06/10/2026 (lote 3 · 6ª) |
| [Ótica Plus Optical](demos/otica-plus-optical) | Higienópolis, São Paulo | site | pronta · 06/10/2026 (lote 3 · 7ª) |
| [Ótica Niterói Prime](demos/otica-niteroi-prime) | Icaraí, Niterói (RJ) | site | pronta · 06/10/2026 (lote 3 · 8ª) |
| [Freitas Ótica](demos/freitas-otica) | Méier, Rio de Janeiro | site | pronta · 06/10/2026 (lote 3 · 9ª) |
| [Ótica Personnalité](demos/otica-personnalite) | Jardim Aeroporto, Bauru | site | pronta · 06/10/2026 (lote 3 · 10ª) |
| [Ótica Ponto Xys](demos/otica-ponto-xys) | Centro, Peruíbe | site | pronta · 06/10/2026 (lote 3 · extra, escolhida pelo Kaue) |
| [Ótica CatGlass](demos/otica-catglass) | Taboão da Serra | site | pronta · 24/09/2026 |
| [Óticas Perez](demos/oticas-perez) | Mauá | site | pronta · 24/09/2026 |
| [Franco Óticas](demos/franco-oticas) | Franco da Rocha | site | pronta · 24/09/2026 |
| [Ótica Smart](demos/otica-smart) | Pompéia, São Paulo | site | pronta · 24/07/2026 |
| [Ótica Vip Lapa](demos/otica-vip-lapa) | Lapa, São Paulo | site | pronta · 24/07/2026 |
| [Óticas F. Dias](demos/oticas-f-dias) | Ferrazópolis, São Bernardo do Campo | artes para Instagram | pronta · 06/08/2026 |
| [Óticas Supreme](demos/oticas-supreme) | Capão Redondo, São Paulo | artes para Instagram | pronta · 06/08/2026 |
