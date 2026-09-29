# Demos da Renderiza

> Sessão nova do Claude: leia primeiro o [`CONTEXTO.md`](CONTEXTO.md).

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

## Link online (Vercel)

A Vercel publica **só os arquivos `.html` das demos** (configurado em `vercel.json`). Fichas, contexto e
ferramentas ficam fora do ar. Cada demo ganha um link com o nome da pasta:

- site: `https://<projeto>.vercel.app/otica-sales`
- kit de artes: `https://<projeto>.vercel.app/oticas-f-dias/artes-instagram`

A página inicial não lista nada, para ninguém ver as demos de outras óticas, e os links pedem ao Google
para não indexar. Toda vez que uma demo nova chega na `main`, a Vercel publica sozinha.

Sem internet, dá para baixar o `.html` e abrir direto no navegador.

## Demos

| Ótica | Onde | Entregável | Situação |
|---|---|---|---|
| [Ótica Sales](demos/otica-sales) | São Caetano do Sul | site | na fila · 1ª |
| [Ótica D&R](demos/otica-der) | São Bernardo do Campo | site | na fila · 2ª |
| [Óticas Laodiceia](demos/oticas-laodiceia) | Diadema | site | na fila · 3ª |
| [Iadala Ótica e Visagismo](demos/iadala-otica) | São Caetano do Sul | site | na fila · 4ª |
| [Amitié Centro Óptico](demos/amitie-centro-optico) | Mogi das Cruzes | site | na fila · 5ª |
| [Ateliê Óptico Jabaquara](demos/atelie-optico-jabaquara) | Jabaquara, São Paulo | site | na fila · 6ª |
| [Ótica Líder](demos/otica-lider-guarulhos) | Guarulhos | site | na fila · 7ª |
| [Mogi Ótica](demos/mogi-otica) | Mogi das Cruzes | site | na fila · 8ª |
| [Ótica Interativa](demos/otica-interativa) | Vila Maria, São Paulo | site | na fila · 9ª |
| [Ótica CatGlass](demos/otica-catglass) | Taboão da Serra | site | pronta · 24/09/2026 |
| [Óticas Perez](demos/oticas-perez) | Mauá | site | pronta · 24/09/2026 |
| [Franco Óticas](demos/franco-oticas) | Franco da Rocha | site | pronta · 24/09/2026 |
| [Ótica Smart](demos/otica-smart) | Pompéia, São Paulo | site | pronta · 24/07/2026 |
| [Ótica Vip Lapa](demos/otica-vip-lapa) | Lapa, São Paulo | site | pronta · 24/07/2026 |
| [Óticas F. Dias](demos/oticas-f-dias) | Ferrazópolis, São Bernardo do Campo | artes para Instagram | pronta · 06/08/2026 |
| [Óticas Supreme](demos/oticas-supreme) | Capão Redondo, São Paulo | artes para Instagram | pronta · 06/08/2026 |
