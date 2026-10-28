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
| Reels "O sobrinho que ia fazer o site" (conversa no WhatsApp, sem voz, trilha pulsante) | `reels-sobrinho.html` | `reels-sobrinho.mp4` (1080 × 1920, 38,7 s) |
| Carrossel "Dicionário do cliente de WhatsApp" | `carrossel-dicionario.html` | `carrossel-dicionario-1.png` … `-10.png` (1080 × 1350) |
| Post "Seu gestor pediu o pixel" | `post-pixel.html` | `post-pixel.png` (1080 × 1350) |
| Reels "Enquanto você atende" (as perguntas que chegam no WhatsApp durante o atendimento, sem voz, trilha pulsante) | `reels-atende.html` | `reels-atende.mp4` (1080 × 1920, 37,5 s) |
| Carrossel "Seu site já existe. Só está espalhado." | `carrossel-espalhado.html` | `carrossel-espalhado-1.png` … `-9.png` (1080 × 1350) |
| Reels "Seu negócio fecha. O site, não." (a Agenda online depois que o negócio fecha, sem voz, trilha pulsante) | `reels-fecha.html` | `reels-fecha.mp4` (1080 × 1920, 40 s) |
| Reels "Quem indica, manda o link" (a indicação no grupo das amigas que para no Instagram, sem voz, trilha pulsante) | `reels-indica.html` | `reels-indica.mp4` (1080 × 1920, 38,1 s) |
| Reels "Elogio bom não fica no privado" (o elogio no WhatsApp que vira avaliação no Google com a mensagem do kit, sem voz, trilha pulsante) | `reels-elogio.html` | `reels-elogio.mp4` (1080 × 1920, 38,4 s) |
| Reels "Preço?" (os "Preço?" nos comentários e o Catálogo com foto, preço e pedido pelo WhatsApp, sem voz, trilha pulsante) | `reels-catalogo.html` | `reels-catalogo.mp4` (1080 × 1920, 38 s) |
| Reels "O site ficou pronto. E agora?" (o kit de divulgação leva o link para a bio, o Google, o status e o WhatsApp, sem voz, trilha pulsante) | `reels-pronto.html` | `reels-pronto.mp4` (1080 × 1920, 38,7 s) |
| Reels narrado "O ciclo de um espaço de eventos" (a sexta-feira da Marina, dona da Villa Alecrim, antes e depois do site, da agenda online e do painel; voz Antonio, neural brasileira da Microsoft (motor "edge" do `narrar.py`), trilha pulsante com as cenas mapeadas em `pulso`) | `reels-ciclo-eventos.html` + `narracao/reels-ciclo-eventos.json` | `reels-ciclo-eventos.mp4` (1080 × 1920, 85,3 s) |
| Reels narrado com história "O homem que sabia todos os horários" (versão 2: por 28 anos a Rua das Acácias funcionou no horário que o Seu Valdir dizia, porque ele inventou todos; quando ele viaja, ninguém sabe o próprio horário, cada loja põe o seu num site e, na volta, ele erra pela primeira vez; a Renderiza só aparece no fim; a rua é um desenho só e a câmera anda por ele; voz Antonio, uma frase por trecho para controlar as pausas) | `reels-valdir.html` + `narracao/reels-valdir.json` | `reels-valdir.mp4` (1080 × 1920, 74,3 s) |
| Reels narrado com história "O caso dos clientes que sumiram" (versão 3 do Reels 1, que substitui o Seu Valdir: os clientes novos da Ótica da Lúcia somem, ela contrata um detetive, e cada pista dele é um problema real de quem não tem site; a virada é o detetive sair de óculos novos da ótica da esquina, que tinha site; alvo: o dono de ótica, consultório ou clínica que só tem Instagram e WhatsApp; cada cena é um desenho próprio com a sua câmera; voz Antonio) | `reels-detetive.html` + `narracao/reels-detetive.json` | `reels-detetive.mp4` (1080 × 1920, 76,9 s) |
| Reels narrado com história "O papagaio da recepção" (Reels 2: a recepcionista de um dentista responde as mesmas perguntas o dia todo; o doutor arruma um papagaio que decora as respostas, mas as perguntas chegam às onze da noite pelo WhatsApp e o papagaio dorme às oito; com o site, quem pergunta de noite acha a resposta na hora; alvo: o dono de consultório, clínica ou ótica cuja recepção vive respondendo as mesmas perguntas; voz Antonio, e o papagaio fala com a Francisca mais aguda, pela "voz", "tom" e "ritmo" de cada frase no json) | `reels-papagaio.html` + `narracao/reels-papagaio.json` | `reels-papagaio.mp4` (1080 × 1920, 84 s) |
| Reels narrado com história "O carro de som" (Reels 3: o dono de uma academia paga o carro de som todo sábado e não sabe quantos vieram; troca pelo Impulsionar do Instagram e o celular dá a mesma resposta, porque o anúncio leva a um perfil sem preço nem horário; com o site, o anúncio leva para planos, horário e WhatsApp, o site conta quem chegou, e ele anuncia de novo só para quem chegou perto, como um carro de som que volta só às casas de janela aberta; alvo: quem já impulsiona post ou anuncia; voz Antonio, e o Tião fala pelo alto-falante com o "efeito": "megafone" da frase no json; o vídeo não diz que a Renderiza faz anúncio nem que não faz) | `reels-carro-de-som.html` + `narracao/reels-carro-de-som.json` | `reels-carro-de-som.mp4` (1080 × 1920, 76 s) |
| Vídeo do exemplo do painel para o Instagram (o de /exemplos em 1080, com "Comenta PAINEL") | `exemplo-sistema-eventos.json` (`node ferramentas/video/gravar.mjs instagram/exemplo-sistema-eventos.json <saida.mp4>`) | 1080 × 1920, 53 s |
| Post "A bio tem 150 caracteres." (a bio de exemplo da Odonto Prado passa do limite e o que sobra fica marcado; o que não cabe na bio cabe num site) | `post-bio.html` | `post-bio.png` (1080 × 1350) |
| Carrossel "O cliente novo, em três números" (54% compram à noite ou de madrugada, CX Trends 2026; 7× para quem responde em 1 hora, HBR 2011; só 4% nunca leem avaliações, BrightLocal 2025; fonte em cada slide) | `carrossel-numeros.html` | `carrossel-numeros-1.png` … `-6.png` (1080 × 1350) |
| Post "Cadê o contrato do dia 14?" (para espaços de eventos: o contrato em cinco lugares e a ficha da festa no painel, com a tela de verdade do exemplo em `painel-ficha.jpg`) | `post-contrato.html` | `post-contrato.png` (1080 × 1350) |
| Carrossel do Perfil da Empresa no Google (70% mais chance de visita com o perfil completo, segundo o Google, e o que preencher, item por item, começando pelo horário de feriado) | `carrossel-google.html` | `carrossel-google-1.png` … `-8.png` (1080 × 1350) |
| Stories da semana de 16 a 23/10 (só a arte; a enquete e a caixinha entram no app) | `stories-semana.html` | `stories-semana-1.png` … `-8.png` (1080 × 1920) |

```
node instagram/gerar.mjs                 # todos
node instagram/gerar.mjs carrossel teste # só as imagens
node instagram/gerar.mjs reels --ensaio  # 11 quadros soltos do Reels, para conferir antes de gravar
node instagram/gerar.mjs reels-cliente-perdido          # cada Reels pelo nome do arquivo
```

As legendas para colar no Instagram estão em `legendas.md`.

Reels sem voz com a trilha pulsante: a página devolve `pulso` em `preparar()`, a lista das cenas como se fossem as
frases de uma narração (`{id, cena, ini, fim, impacto?}`; cenas `abre`, `google`, `insta` com o id `nada` onde a batida
corta, `volta`, `meio`, `ese`, `site` no drop, `fim` e `cta`). O `gerar.mjs` passa essas cenas e um áudio mudo para o
`trilha-pulso.py`, que monta a trilha no mesmo tempo da tela. Exemplo: `reels-sobrinho.html`.
O andamento padrão é 124 BPM. Para outro, `preparar()` devolve também `bpm` (o `reels-atende` usa 128 e o
`reels-fecha`, 120), e os cortes da tela seguem a grade desse andamento a partir do drop.
Para a trilha não soar igual de um Reels para o outro, `preparar()` pode devolver `tom`, em semitons a partir de lá
menor (`reels-indica` 126 BPM e +3; `reels-elogio` 122 e -2; `reels-catalogo` 130 e +5; `reels-pronto` 124 e +2).
O limitador da trilha para em -2,5 dB porque o AAC do MP4 sobe o pico real; o vídeo sai perto de -16 LUFS e -1,5 dBTP.

Stories: as páginas que começam com `stories` saem em 1080 × 1920, um PNG por `.slide`. A arte deixa um espaço vazio
embaixo da pergunta para a figurinha (enquete ou caixinha de perguntas), que entra no app na hora de postar.

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
