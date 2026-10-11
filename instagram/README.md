# Instagram da Renderiza

Posts prontos para baixar e postar, feitos em HTML e gravados pelo `gerar.mjs`:

| Post | Arquivo fonte | Sai em `rascunhos/instagram/saida/` |
|---|---|---|
| Carrossel "Fizemos o site do seu negócio antes de você pedir" | `carrossel.html` | `carrossel-1.png` … `carrossel-7.png` (1080 × 1350) |
| Imagem "Seu negócio passa nesse teste?" | `teste.html` | `teste.png` (1080 × 1350) |
| Reels "Do link na bio ao site" | `reels.html` | `reels.mp4` (1080 × 1920, 21 s, com trilha original) |
| Reels narrado com voz "O cliente que você perdeu" (SPIN, legenda palavra a palavra, trilha pulsante) | `reels-narrado.html` + `narracao/reels-narrado.json` | `reels-narrado.mp4` (1080 × 1920, 40 s) |
| Reels "Antes de anunciar" com a voz do Kaue clonada (SPIN: post patrocinado, perfil, resultado do anúncio, pixel) | `reels-anuncio.html` + `narracao/reels-anuncio.json` | `reels-anuncio.mp4` (1080 × 1920, 55 s) |
| Reels "O cliente que você perdeu" (SPIN, só texto) | `reels-cliente-perdido.html` | `reels-cliente-perdido.mp4` (1080 × 1920, 39,5 s, trilha sóbria) |

```
node instagram/gerar.mjs                 # todos
node instagram/gerar.mjs carrossel teste # só as imagens
node instagram/gerar.mjs reels --ensaio  # 11 quadros soltos do Reels, para conferir antes de gravar
node instagram/gerar.mjs reels-cliente-perdido          # cada Reels pelo nome do arquivo
```

As legendas para colar no Instagram estão em `legendas.md`.

## Regras (Kaue, 09/10/2026)
- O público é negócio em geral (lojas, clínicas, dentistas, estética), não só ótica. Nunca "de bairro".
- Nenhuma demo nem foto de lead aparece sem autorização do cliente. Os exemplos usam a **Lume Estética**,
  um negócio fictício, sempre com o selo "exemplo", e fotos de banco livres do Unsplash (`fotos.json`;
  a licença do Unsplash libera uso comercial). Avaliações e textos longos ficam como linhas cinza: nada de
  depoimento inventado.
- Sem emoji dentro das imagens (o Chromium daqui não tem a fonte de emoji). Nas legendas, pode.

## Paleta
Toda nos tokens do `:root` em `marca.css`. Hoje é a paleta do logo (grafite e o branco quente do símbolo); o
Kaue acha escura e fechada e vai trocar. Quando tiver as cores novas, é mudar os tokens e gerar de novo.
O site de exemplo (Lume) tem as cores dele, separadas (`.lume` em `marca.css`).

## Reels com voz
O texto fica em `narracao/<nome>.json` (legenda, o que a voz fala, pausas, impactos). `python3 instagram/narrar.py <nome>`
gera a voz com o Piper (voz livre `pt_BR-faber-medium`, roda aqui; `pip install piper-tts`) e os tempos de cada
palavra; a página e a trilha (`ferramentas/video/trilha-pulso.py`) seguem esses tempos. O `gerar.mjs` chama os dois.
Mudou o texto: rodar o `narrar.py` de novo e gravar.

Com a voz de alguém: grave as falas do roteiro de uma vez (pode errar e repetir) e rode
`python3 instagram/encaixar-voz.py reels-narrado <gravacao.m4a>` (`pip install faster-whisper deepfilternet` + torch CPU). Ele trata a voz com `ferramentas/video/limpar-voz.py` (DeepFilterNet 3 tira ruído e vozes de fundo; EQ, de-esser, compressão, -16 LUFS, pico -2 dB),
transcreve, acha cada frase (a primeira boa ou, com `"tomada": "ultima"`, a última gravada), corta e grava a voz e os
tempos no lugar dos do `narrar.py`. A gravação do Kaue (11/10/2026) fica fora do repositório, nos arquivos do projeto.

Voz clonada: com `"motor": "clone"` e `"referencia": "rascunhos/vozes/<arquivo>.wav"` (10 a 15 s de fala limpa, por exemplo
um trecho da voz tratada), o `narrar.py` fala com o Chatterbox multilíngue (licença MIT, roda na CPU, devagar:
cerca de 1 min por frase; `pip install chatterbox-tts`). Cada frase é conferida pelo Whisper e refeita se sair embolada.
O áudio gerado leva uma marca d'água inaudível (Perth) do Chatterbox. A referência fica fora do repositório.
