# Reviver Fotografia

| | |
|---|---|
| Onde | Av. Itapark, 772 - Vila Bocaina, Mauá - SP, 09350-000 |
| Instagram | [@re.viverfotografia](https://www.instagram.com/re.viverfotografia/) · 2,4 mil seguidores |
| Google | nota 5,0 · 31 avaliações · conferido em 13/11/2026 |
| WhatsApp | (11) 94277-6730 · celular do Perfil da Empresa no Google (+55 11 94277-6730) |
| Site | não tem: só o Instagram (lote 3, 06/11/2026) |
| Entregável | **portfólio online, versão 4**: `index.html` (a vitrine) e uma página por ensaio (`natal`, `bebes`, `familia`, `gestante`). Sai de `ferramentas/demo/gerar-portfolio.py demos/reviver-fotografia [<pasta dos originais>]`; textos, fotos e pacotes no `demo.json` (`portfolio`) |
| Situação | no ar · portfólio v4 em 13/11/2026 · `/demo/reviver-fotografia` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o portfólio fica 100% dela, sem mensalidade); promoção de uma semana, até 21/11/2026 (`renderiza.valido_ate` no `demo.json` e `demos.vale_ate` no painel) |

## Direção
- Lote 3 de fotógrafos. Dona: Denise Domingos. Estúdio na Vila Bocaina, em Mauá; tom claro, Lora e Nunito Sans, verde.
- A página de Natal se chama só "Natal": as fotos da sala de Natal são do Natal passado (postadas no começo de 2026); o Natal 2026 só aparece em vídeo ("Nosso 1º cenário já está finalizado", "segundo cenário… agenda de novembro e dezembro oficialmente disponível").
- Na v4 entrou a página Gestante e casal (gestantes e casais em alta, do Google e da grade).

## O que tem
- **Vitrine**: "Fotografias para reviver cada momento.", a tira de 7 fotos, a lista de ensaios com o "a partir de", o filtro por ensaio, 4 avaliações do Google, quem fotografa e o contato.
- **Páginas**: Natal (16 fotos, depoimento de Carol Coutinho); Bebês e crianças (14 fotos, depoimento de Mell Duarte); Família (13 fotos, depoimento de Lorenzo Calado); Gestante e casal (9 fotos, sem depoimento).
- Nenhum texto fala em "site". Pacotes e valores são de exemplo, com o selo na página.

## Fotos (escolhidas uma a uma na folha de contato grande)
- 52 fotos: 43 da grade do Instagram dela salva no Drive do Kaue (pasta na lixeira do Drive), 4 dos carrosséis lidos pelo embed público (DdpJx7OoPT2, DdwE0JOIwJX, DdwE5W_Tle1, DdwEi59oOfF) e 5 do Perfil no Google.
- Tratadas a partir do original, sem ampliar e sem recorte (a página mostra a foto inteira): 1400 px na galeria, 1920 px na abertura, JPEG progressivo, qualidade 82.
- Ficaram de fora: as capas de vídeo do Natal 2026, as fotos repetidas e as em 9:16.

## Textos
- Dela: "Às vezes eu não sei lidar com tanta fofura", "Vem viver essa magia com a gente", "Nosso segundo cenário de Natal finalizado, agenda de novembro e dezembro oficialmente disponível".
- Avaliações (lidas inteiras em 13/11): falam da Denise em geral; Carol Coutinho no Natal, Mell Duarte nos bebês, Lorenzo Calado na família.
- Não são dela: os pacotes e valores (exemplos) e o "quando fazer" de gestante.

## Conferir com ela
- As fotos do Natal são do cenário do ano passado: o de 2026 só está nos vídeos.
- Fotos de bebês, crianças e gestantes: todas publicadas por ela como portfólio. Vale confirmar se podem ficar todas.

## Gerar de novo
- `python3 ferramentas/demo/gerar-portfolio.py demos/reviver-fotografia [<pasta dos originais>]`. Sem os originais, o gerador reaproveita as fotos já tratadas (dá para mudar texto e preço); para trocar foto, baixar de novo (Drive pelo id; posts pelo `ig-post.py`).
- Conferir: `node ferramentas/demo/conferir-portfolio.cjs <pasta> reviver-fotografia` e `node ferramentas/demo/validar.mjs <página> <pasta>`.
