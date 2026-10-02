# Prints do portfólio (site/estatico/imagens/projetos/)

Cada projeto tem três arquivos: `<id>-1400.webp` (cartão), `<id>-2400.webp` (pop-up) e `<id>-celular.webp`.

1. Sites no ar (Move, Blulens, Lú Elegante), aqui nesta pasta:
   `node capturar.mjs move https://www.movexfit.com.br/ desk` e `... cel`
   (desktop 1440×900 em 2x; celular 390×844 em 3x). Cada arquivo do site é baixado com curl,
   porque o proxy do ambiente na nuvem às vezes corta a conexão do navegador.
2. Compasso: com a família fictícia, pelo `../prints-compasso/` (README de lá), em 1440×900 com
   deviceScaleFactor 2 e a fonte Inter injetada (o app pede Inter mas não carrega o arquivo).
   Salve como `compasso-desk.png` e `compasso-cel.png` nesta pasta.
3. `node webp.mjs` gera os 12 WebP em `site/estatico/imagens/projetos/`.

Os PNGs intermediários não vão para o repositório.
