# Série "Eu ainda não nasci": uma história em três episódios, contada por vários lados

Uma minissérie para fotógrafas de gestante e newborn, um episódio por dia às 19h, com uns dois minutos cada. A mesma
história passa por vários pontos de vista: o bebê da Camila (o narrador principal), a Helena do outro lado da cidade, o
Louro (o papagaio da mãe da Helena, que aprendeu três frases na voz dela quando o estúdio funcionava na sala da mãe, em
2019), a Camila, o pai (Rafa) e a mãe da Helena (Dona Lurdes). O visual comum está em `serie.mjs` (selo, cartão do
resumo e o "Siga"), `celular.mjs` (o celular, o estúdio, a Helena, as fotos dos ensaios) e `casa.mjs` (o Louro, o pai, a
mãe da Helena, a casa dela, os capítulos e os balões).

## O mistério

A pergunta da série, feita no fim do episódio 1: alguém leu as catorze páginas do PDF naquela noite. Quem? A resposta, no
fim do 3: o pai, que "sempre dorme na parte importante". Ele leu o PDF que a Camila encaminhou ("baixa no seu?"), achou
na página 14 o endereço velho, foi até lá com o bebê e deixou um bilhete para a Helena ("Eu li as catorze. É você que ela
quer. Põe o preço na primeira."). O bilhete fez a Helena trocar o PDF por um site. E a Camila sabia: "A parede fica azul."

As pistas, para rever: a parede azul atrás do pai "dormindo" e os tiques azuis do "baixa no seu?" (ep. 1); a janela azul
na cidade (ep. 1); "sabia o endereço de cor", o bilhete no bolso e a resposta sem som ao Louro (ep. 2); o nome borrado
de quatro letras no "enviou uma publicação" (ep. 2).

O "vou ver com meu marido" saiu da série (passava a ideia de que a mulher não decide sozinha). No lugar, o Louro repete
"Eu seguro pra você!", a frase de quem segura horário sem prazo, que a regra das 24 horas resolve. A Camila decide e paga
sozinha, em quatro minutos.

Substitui a série "O celular da fotógrafa": a parte 1 (`reels-pdf`) virou o episódio 1, e o que as partes 2 e 3
(`reels-comprovante` e `reels-marido`) ensinavam, o sinal marcado no painel e as 24 horas da vaga, está no episódio 3.
Essas duas não devem ser postadas; os arquivos ficam só como referência.

## Por que assim (pesquisa de 07/11/2026)

- O Instagram mostra o vídeo primeiro para quem não segue a conta. O Adam Mosseri, chefe do Instagram, disse em
  janeiro de 2025 que os sinais que mais pesam são o tempo assistido, as curtidas por alcance e os envios por alcance
  (os envios pesam um pouco mais para quem ainda não segue). Por isso cada episódio precisa prender sozinha nos três
  primeiros segundos e ter uma cena que dá vontade de mandar para alguém.
- Desde agosto de 2025, o Instagram deixa vincular um Reels a outro: aparece um botão no canto do vídeo (por exemplo,
  "Ver parte 2"), com título de até 15 caracteres. Cada Reels leva um vínculo só. Ele se coloca na hora de postar ou
  depois, pelo menu de três pontos do Reels.
- A Meta testa desde junho de 2026 uma aba "Séries" no perfil, só para alguns criadores. Quando chegar para a conta,
  os episódios entram lá.
- Séries curtas com episódios que se referem uns aos outros (e as "microdramas" de 1 a 3 minutos) são o formato que o
  Instagram está procurando em 2026.

## Na tela

| Momento | O que aparece |
|---|---|
| 0 a 3 s | O gancho do episódio, novo. No topo, o selo "EPISÓDIO N · Eu ainda não nasci". |
| 3 a 10 s (do episódio 2 em diante) | O resumo: "No episódio 1, ..." e o cartão do episódio anterior. Nunca antes do gancho. |
| Capítulos | Cada troca de quem conta abre com uma faixa no meio da tela ("23h51 · A FOTÓGRAFA") e um whoosh, e fica uma etiqueta pequena no canto. Um capítulo a cada 20 ou 30 s segura o meio do vídeo. |
| Falas | Os personagens falam com voz própria, em balões com o nome (a legenda dessas frases fica de fora: `soBalao`). |
| Gancho do fim | Uma frase que deixa a pergunta aberta ("Só que eu resolvi nascer três semanas antes."). |
| Prévia (episódios 1 e 2) | "No próximo episódio: ..." com cenas do episódio seguinte, e a voz fecha com "Siga para ver o episódio 2" ou "Siga para ver o final". Depois da voz, só na tela: "Comenta PRÉVIA". |
| Final (episódio 3) | Moral, marca e a prévia explicada falando (montada com as fotos do Instagram; ver não custa nada). Depois, um piii (a tela apaga como TV velha) e o pós-créditos em cinza, onze meses depois, com a temporada 2 e "Comenta CONTINUAÇÃO" (a cor volta no cartão). |

No motor, o fim mudo acontece sozinho quando a narração não tem a frase `moral` (`historia.mjs`; o tempo na tela é
`fimMudo`, padrão 4,2 s). O "Siga" é `serie(R, { siga: { texto } })`, que aparece na frase de id `siga`. O pós-créditos é a
cena `pos` depois do `cta`, com a seção `pos` da trilha (o pulso do convite para antes do piii).

## Vozes

| Quem | Voz (edge) |
|---|---|
| O bebê (narrador) | pt-BR-AntonioNeural, +12% |
| A Helena | pt-BR-ThalitaMultilingualNeural |
| O Louro | a voz da Helena (Thalita, +30 Hz) com o efeito "papagaio" (mais aguda, fina e com trinado); frases curtas, que o Whisper e as pessoas entendem ("Te mando a tabela!", "Eu seguro pra você!") |
| O pai | en-US-BrianMultilingualNeural, falando português |
| A mãe da Helena e a Camila | pt-BR-FranciscaNeural, em tons diferentes; o áudio de WhatsApp leva o efeito "zap" |

## Para aprender vendo

| Episódio | O que se aprende |
|---|---|
| 1 | A régua da gestação: 40 semanas, 36 feitas, 4 faltando. 54% dos brasileiros compram à noite ou de madrugada (CX Trends 2026, Octadesk e Opinion Box). O caminho até o preço: 14 páginas, o preço na última, o PDF que para em 9%. A conta do mês da Helena: 31 pediram o valor, 4 fecharam. O horário preso sem prazo ("segurado há 14 dias"). |
| 2 | A janela do newborn: o contador dos 15 dias, e "janeiro: dia 48, fora da janela". O endereço velho no mapa (quem procura conclui que a fotógrafa fechou). "Virou a página. As catorze.": as 14 páginas voam, de 14 a 0. |
| 3 | 14 páginas no episódio 1 contra um toque agora. As 24 horas até o sinal (a vaga segurada por outra pessoa volta), o cronômetro dos quatro minutos e "faltou sinal" contra "ela deu o sinal". |

## Capa

O selo "EPISÓDIO N · EU AINDA NÃO NASCI" (no 3, "EPISÓDIO 3 · FINAL") e o título grande, sem a marca, com o título a
pelo menos 290 px do topo: o perfil mostra a capa cortada em 3:4, sem os 240 px de cima e de baixo. As três lado a lado
contam a série: o útero ("Eu ainda não nasci"), o Louro atendendo a porta ("Quinze dias") e as três janelas acesas às 03:00 ("Três da manhã").

## Ao postar

1. Legenda: a primeira linha diz o episódio e onde está o começo ("Episódio 2 de Eu ainda não nasci. O episódio 1 está
   fixado no perfil."), com o aviso de ficção. Depois, a lição, o convite e o comentário para fixar, como no guia.
2. Vincular: quando o episódio novo sai, o anterior passa a apontar para ele ("Ver episódio 2", "Ver o final"). O
   episódio 3 aponta de volta para o 1 ("Ver episódio 1"), para quem chega pelo final.
3. O episódio 1 fica fixado no perfil enquanto a série dura; no fim, os três ficam fixados.
4. Story 10 minutos depois: "Episódio N no ar." Story das 20h: enquete sobre a dor do episódio.

## O que acompanhar

Em cada episódio: tempo médio assistido, taxa de pular, envios, seguidores ganhos e visitas ao perfil. Do 1 para o 2,
o que importa é quantos seguiram: é o que diz se a prévia e o "Siga" funcionaram. Se a taxa de pular subir no 2, o
resumo está pesando e deve encurtar.

## Os episódios

| Episódio | Arquivo | Quem conta | O que a Renderiza mostra | Fim |
|---|---|---|---|---|
| 1 · A tabela | `reels-nasci1` | O bebê (36 semanas), a mãe às 23h48 (o "valor?", o PDF de 14 páginas com o preço na última, o chute, o "baixa no seu?" para o pai), a fotógrafa às 23h51 (31 pediram, 4 fecharam; "Conseguiu ver a tabela?") e o papagaio desde 2019 ("Te mando a tabela!", "Conseguiu ver a tabela?", "Eu seguro pra você!"). A cidade à meia-noite: "Quem leu as catorze páginas?" Ele nasce três semanas antes. | O preço na primeira tela (pela outra fotógrafa) | Siga + PRÉVIA na tela |
| 2 · Quinze dias | `reels-nasci2` | O bebê e a mãe (a janela de 15 dias; "só em janeiro"; ela conclui que a Helena fechou), o pai no dia 10 (sabia o endereço de cor; o Louro na janela; a Dona Lurdes abre a porta; ele deixa um bilhete), a mãe da Helena (o áudio) e a fotógrafa (lê o bilhete, vira a página: as 14 voam; troca o PDF por um site). Dia 13, chega o post da Helena de alguém com o nome borrado. | O site com o preço de cada ensaio | Siga + PRÉVIA na tela |
| 3 · Três da manhã | `reels-nasci3` | A mãe às 03h00 (o site, a vaga que voltou pelas 24 horas, 4 minutos, "ela deu o sinal"; "Amor, tá acordado?" "Não."), a fotógrafa às 08h20 (o sinal no painel; "Camila. A do PDF?") e o ensaio (o bilhete lido; os flashes das pistas; "A parede fica azul."). Pós-créditos: "Tá no site!", temporada 2, "Agora são vinte e quatro horas, Louro." | O site com o preço de cada ensaio, a agenda que segura a vaga até o sinal e o painel | Moral, marca, PRÉVIA falados; CONTINUAÇÃO no pós-créditos |

A linha do tempo: previsão 05/12, nascimento no sábado 14/11 (37 semanas), o pai na casa velha no dia 10 (24/11), dia 13
em 26/11 às 3h, ensaio no sábado 28/11 às 10h, o último dia da janela. O painel não recebe o Pix: quem marca o sinal é a
Helena.

## Temporada 2

O pós-créditos anuncia "meu primeiro aniversário" (o ensaio de um ano) e que, "de novo, alguém não está dormindo". Os
comentários "CONTINUAÇÃO" dizem se vale fazer.
