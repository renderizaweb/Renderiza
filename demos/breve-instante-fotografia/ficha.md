# Breve Instante Fotografia

| | |
|---|---|
| Onde | Av. José André de Moraes - Jardim Monte Alegre, Taboão da Serra - SP, 06755-260 (o Google não mostra o número) |
| Instagram | [@breveinstantefotografia](https://www.instagram.com/breveinstantefotografia/) ("Amanda \| Fotógrafa de Pessoas") · 1,5 mil seguidores (1.491 em 22/11/2026), 187 posts, último post em 19/11/2026 |
| Google | "Breve Instante Fotografia", fotógrafo · nota 5,0 · 25 avaliações · conferido em 23/11/2026 |
| WhatsApp | (11) 95421-9141 · celular do Perfil da Empresa no Google |
| Site | não tem: o Google aponta o Instagram; a página dela na Alboom (breveinstantefotografia.alboompro.com) foi começada e ficou com o modelo de exemplo |
| Entregável | **portfólio online, versão 4** (23/11/2026): `index.html` (a vitrine) e uma página por ensaio (`familia`, `irmaos`, `mae-e-filhos`, `eventos`). Sai de `ferramentas/demo/gerar-portfolio.py demos/breve-instante-fotografia <pasta dos originais>`; textos, fotos e pacotes no `demo.json` (`portfolio`) |
| Oferta na demo | R$ 399 no Pix ou parcelado no crédito, pagamento único (o portfólio fica 100% dela, sem mensalidade); promoção de uma semana, até 30/11/2026 (`renderiza.valido_ate` no `demo.json` e `demos.vale_ate` no painel) |
| Painel | lead `breve-instante-fotografia` (código `tcxk`) |

## Direção
- Lote 4 de fotógrafos (nº 3 de 40, 90 pontos). Dona: Amanda, sozinha ("Sou a Amanda, fotógrafa de famílias e eventos em São Paulo", na bio; as 5 avaliações citam a Amanda).
- Personalidade: o estúdio de fundo terracota dos ensaios de novembro de 2026, registros leves e espontâneos, as artes dela em bege e marrom. Na página: fundo creme, Lora nos títulos, Mulish no texto, "fotografia" em Sacramento, marrom terracota nos botões. Ícone da aba: monograma BI.
- Ensaios pelo que ela posta agora (família, gerações, irmãos, mãe e filho) e pelo que as avaliações contam (casamento, festa de 5 anos, bodas de 50 anos): família, irmãos, mãe e filhos e eventos. Três gerações entraram na família (só 3 fotos). Sem página de gestante (as de 2020 eram poucas e mais fracas, e ela não se apresenta como fotógrafa de gestante) e sem Natal (não divulgou).

## Fotos (41 escolhidas de 122 originais sem repetição, uma a uma, na folha de contato grande)
- **Fontes**: (1) os carrosséis completos dos 6 posts de 05 a 19/11/2026 pelo embed público (`ferramentas/ig-post.py`): as sessões de família, as três gerações, os irmãos, mãe e filho e o post de apresentação; (2) a grade salva no Drive ("lote 22 do 11"), que é de 2019 e 2020, e os carrosséis desses posts: só para os eventos (festas, 15 anos, batizado).
- **De quem são**: a página salva é a dela (og:url, bio e nome); as fotos vêm dos posts da grade e dos carrosséis dela.
- **Quem fotografa**: as duas fotos da Amanda vêm das artes do post de apresentação (09/11/2026), recortadas sem o texto (`box` no `demo.json`): ela sentada com a câmera e ela rindo. A segunda é pequena (430 px de largura) e só aparece no quadro menor.
- **Por ensaio** (a ordem está no `demo.json`): família 12, irmãos 9, mãe e filhos 9, eventos 9.
- **Ficaram de fora**: as artes com texto (o post de apresentação inteiro, o "Sorteio"), as fotos com borda branca da grade de 2019, a gestante de sutiã, o bolo com o nome no topo e as fotos de 2020 mais fracas.
- **Tratamento**: do original, sem ampliar e sem recorte (fora as duas da Amanda); 1400 px no lado maior (1920 na abertura de cada ensaio), JPEG progressivo, qualidade 82.

## Textos
- Dela: "Acredito que as melhores lembranças estão nos pequenos instantes" e "Amo registrar conexões, abraços sinceros e momentos que não precisam de poses perfeitas" (as artes de apresentação); "As melhores fotografias nem sempre são as mais perfeitas… Porque a beleza de uma família está em ser exatamente quem ela é"; "o amor entre irmãos… como é bonito poder guardar essa cumplicidade em fotografias"; "Nem sempre é preciso olhar para a câmera para criar uma fotografia especial"; "Tem colo que é abrigo"; "tudo aquilo que merece virar lembrança"; a apresentação ("Sou a fotógrafa por trás da Breve Instante… intercâmbio na Irlanda… registros leves, espontâneos e cheios de significado") e a bio ("Desde 2019 eternizando instantes").
- Avaliações do Google (as 5 que o Google mostra sem login, lidas inteiras em 23/11; vírgulas e acentos acertados): Gislene Mota fala da família (página de família); Patriciah Braga, da festa de 5 anos (eventos); Thais Sales, do ensaio em geral (irmãos); silvana santos (bodas de 50 anos) e Talita Vieira (casamento) ficam na vitrine. Mãe e filhos ficou sem depoimento (nenhuma fala dele).
- **Não são dela** (mostrar na validação): os pacotes e os valores, que são EXEMPLOS e levam o selo "Pacotes e valores de exemplo: você coloca os seus".

## Conferir com ela
- O endereço do Google não tem número: confirmar onde é o estúdio dos ensaios de 2026.
- As fotos de eventos são de 2020 (o que havia de eventos na grade salva): se ela tiver casamentos ou festas recentes, vale trocar.
- Fotos de clientes (famílias, crianças, festas): todas publicadas por ela como portfólio. Vale confirmar se podem ficar todas.

## Gerar de novo
- `python3 ferramentas/demo/gerar-portfolio.py demos/breve-instante-fotografia [<pasta dos originais>]`. Sem os originais, o gerador reaproveita as fotos já tratadas das páginas (dá para mudar texto e preço); para trocar foto, baixar de novo (posts pelo `ig-post.py`).
- Conferir: `node ferramentas/demo/conferir-portfolio.cjs <pasta de capturas> breve-instante-fotografia` (passou sem problema em 23/11/2026, nas larguras 390, 1280 e 1440).
