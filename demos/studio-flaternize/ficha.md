# Studio Flaternize

| | |
|---|---|
| Onde | Av. José Gallucci, 186 - Sala 8 - Jundiapeba, Mogi das Cruzes - SP, 08750-600 |
| Instagram | [@studioflaternize](https://www.instagram.com/studioflaternize/) · 3,0 mil seguidores |
| Google | nota 5,0 · 29 avaliações · conferido em 13/11/2026 |
| WhatsApp | (11) 97780-2176 · celular do Perfil da Empresa no Google (+55 11 97780-2176) |
| Site | não tem: só o Instagram (lote 3, 06/11/2026) |
| Entregável | **portfólio online, versão 4**: `index.html` (a vitrine) e uma página por ensaio (`natal`, `infantil`, `gestante`, `familia`, `retratos`). Sai de `ferramentas/demo/gerar-portfolio.py demos/studio-flaternize [<pasta dos originais>]`; textos, fotos e pacotes no `demo.json` (`portfolio`) |
| Situação | no ar · portfólio v4 em 13/11/2026 · `/demo/studio-flaternize` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o portfólio fica 100% dela, sem mensalidade); promoção de uma semana, até 21/11/2026 (`renderiza.valido_ate` no `demo.json` e `demos.vale_ate` no painel) |

## Direção
- Lote 3 de fotógrafos. Dona: Flávia. Studio em Jundiapeba, Mogi das Cruzes; tom claro, Playfair Display e Manrope, verde-escuro.
- Natal 2026 "Eterna Magia" com os dois cenários (Sala de Natal e Celeiro de Natal) dos posts de novembro, em alta. Entraram as páginas Família e Feminino e corporativo (as avaliações citam o ensaio corporativo).

## O que tem
- **Vitrine**: "Mais que um ensaio: uma experiência.", a tira de 7 fotos, a lista de ensaios com o "a partir de", o filtro por ensaio, 4 avaliações do Google, quem fotografa e o contato.
- **Páginas**: Natal 2026 (16 fotos, depoimento de Jonathas Santos); Infantil e bebês (14 fotos, depoimento de Thaina Vieira); Gestante (8 fotos, depoimento de Lígia Pinheiro Martins); Família (13 fotos, depoimento de Janny); Feminino e corporativo (8 fotos, sem depoimento).
- Nenhum texto fala em "site". Pacotes e valores são de exemplo, com o selo na página.

## Fotos (escolhidas uma a uma na folha de contato grande)
- 59 fotos: 38 da grade do Instagram dela salva no Drive do Kaue (pasta na lixeira do Drive), 16 dos carrosséis lidos pelo embed público (DfYaQW4AHdK, Dfe84DgnN4v, Dfmn9GanOtb) e 5 do Perfil no Google.
- Tratadas a partir do original, sem ampliar e sem recorte (a página mostra a foto inteira): 1400 px na galeria, 1920 px na abertura, JPEG progressivo, qualidade 82.
- Ficaram de fora: o mosaico do aniversário de 3 anos, as fotos repetidas, a foto de costas da bebê e as capas de vídeo.

## Textos
- Dela: "Eterna Magia", "A época mais linda do ano sempre vai ser o Natal", "Jade e João na nossa Sala de Natal", "Celeiro de Natal" e a frase do studio "Aqui no nosso Studio oferecemos experiência, vocês saem querendo mais" (da v3).
- Avaliações (lidas inteiras em 13/11): Jonathas Santos no Natal, Thaina Vieira no infantil, Lígia Pinheiro Martins (do positivo aos 2 anos) no gestante e Janny na família; Retratos sem depoimento.
- Não são dela: os pacotes e valores (exemplos), inclusive os de Família e Retratos, e o "quando fazer" de gestante.

## Conferir com ela
- A foto de "quem fotografa" é um retrato com a câmera no studio (da v3): confirmar se é a Flávia.
- Fotos de bebês, crianças e gestantes: todas publicadas por ela como portfólio. Vale confirmar se podem ficar todas.

## Gerar de novo
- `python3 ferramentas/demo/gerar-portfolio.py demos/studio-flaternize [<pasta dos originais>]`. Sem os originais, o gerador reaproveita as fotos já tratadas (dá para mudar texto e preço); para trocar foto, baixar de novo (Drive pelo id; posts pelo `ig-post.py`).
- Conferir: `node ferramentas/demo/conferir-portfolio.cjs <pasta> studio-flaternize` e `node ferramentas/demo/validar.mjs <página> <pasta>`.
