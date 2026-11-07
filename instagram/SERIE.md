# Série "Eu ainda não nasci": uma história em três episódios, contada por vários lados

Uma minissérie para fotógrafas de gestante e newborn, um episódio por dia às 19h, com uns dois minutos cada. Como nos
filmes em que cada personagem tem a sua parte e no fim tudo se junta, a mesma história passa por vários pontos de vista:
o bebê da Camila (o narrador principal), a Helena do outro lado da cidade, o Louro (o papagaio da mãe da Helena, que
aprendeu as frases da filha quando o estúdio funcionava na sala da mãe, em 2019, e ainda atende a porta do endereço
velho do mapa), o pai do bebê e a mãe da Helena. O fio: a família que a Helena perdeu é a que fez ela mudar, e a mudança
trouxe a família de volta. Cada episódio termina numa pergunta que só o próximo responde, e cada um começa lembrando o
anterior. O visual comum está em `serie.mjs` (selo, cartão do resumo e o "Siga"), `celular.mjs` (o celular, o estúdio,
a Helena, as fotos dos ensaios) e `casa.mjs` (o Louro, o pai, a mãe da Helena, a casa dela, os capítulos e os balões).

O papagaio repete três frases que ouvia no telefone: "Qual o valor? Valor?", "Conseguiu ver a tabela?" e "Vou pensar e
te aviso!" (a frase de quem segura horário e some, que a regra das 24 horas resolve). O "vou ver com meu marido" saiu da
série: passava a ideia de que a mulher não decide sozinha.

## Como escrever a narração

A voz lê, não interpreta: cada vírgula vira pausa e frase longa vira leitura. Por isso, frases curtas e faladas, uma ideia
por frase, quase sem vírgula, sem enumeração e sem "ela/ele" repetido. A animação mostra os toques no celular; a voz conta
só o que importa e deixa a piada para as falas dos personagens. Uma versão com mistério pesado, flashes e bilhete lido
(novembro de 2026) ficou longa e confusa e foi descartada: menos é mais.

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
| O Louro | a voz da Helena (Thalita, +30 Hz) com o efeito "papagaio" (mais aguda, fina e com trinado); as falas dele se repetem ("Qual o valor? Valor?"), porque assim o Whisper e as pessoas entendem |
| O pai | en-US-BrianMultilingualNeural, falando português |
| A mãe da Helena e a Camila | pt-BR-FranciscaNeural, em tons diferentes; o áudio de WhatsApp leva o efeito "zap" |

## Para aprender vendo

| Episódio | O que se aprende |
|---|---|
| 1 | A régua da gestação: 40 semanas, 36 feitas, 4 faltando. O caminho até o preço: 14 páginas, o preço na 9, o PDF que não baixa. A conta do mês da Helena: 31 pediram o valor, 4 fecharam. |
| 2 | A janela do newborn: o contador dos 15 dias, e "janeiro: dia 48, fora da janela". 54% dos brasileiros compram à noite ou de madrugada (CX Trends 2026, Octadesk e Opinion Box). O endereço velho no mapa. "Virou a página. As catorze.": as 14 páginas voam, de 14 a 0. |
| 3 | 14 páginas no episódio 1 contra um toque agora. As 24 horas da pré-reserva até o sinal, o cronômetro dos quatro minutos e "caiu o celular" contra "caiu o Pix". |

## Capa

O selo "EPISÓDIO N · EU AINDA NÃO NASCI" (no 3, "EPISÓDIO 3 · FINAL") e o título grande, sem a marca, com o título a
pelo menos 290 px do topo: o perfil mostra a capa cortada em 3:4, sem os 240 px de cima e de baixo. As três lado a lado
contam a série: o útero ("Eu ainda não nasci"), o Louro atendendo a porta ("Quinze dias") e as duas janelas acesas às 03:00, e a da fotógrafa apagada ("Três da manhã").

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
| 1 · A tabela | `reels-nasci1` | O bebê (36 semanas; o pai dorme na parte importante; o PDF de 14 páginas; o chute), a fotógrafa às 23h51 (31 pediram o valor, 4 fecharam; "Conseguiu ver a tabela?"; Visualizado) e o papagaio desde 2019 (as três frases; o endereço no mapa que não mudou). Gancho: ele nasce três semanas antes. | O preço na primeira tela (pela outra fotógrafa) | Siga + PRÉVIA na tela |
| 2 · Quinze dias | `reels-nasci2` | O bebê (a janela de 15 dias, janeiro fora dela, as buscas às 3h, o alfinete), o pai no dia 10 (toca a campainha da casa velha e o Louro atende), a mãe da Helena (o áudio para a filha) e a fotógrafa (vira a página: as 14 voam; troca o PDF por um site e arruma o mapa). No dia 13 chega, de alguém com o nome borrado, o newborn da Helena. | O site com o preço de cada ensaio e o endereço certo | Siga + PRÉVIA na tela |
| 3 · Três da manhã | `reels-nasci3` | O pai às 02h58 (era dele o nome borrado), a mãe às 03h00 (o site, o sábado preso num "vou pensar" e livre pelas 24 horas, quatro minutos, "Dessa vez, caiu o Pix", "Amor... marquei." "Eu sei."), a fotógrafa às 03h04 (dorme: alguém marcou sem ela responder) e às 08h20 (o sinal no painel; "A do PDF?"), e todos no ensaio de sábado (a mãe da Helena reconhece o pai; o Louro: "Conseguiu ver a tabela?"). Pós-créditos: "Tá no site!" e a temporada 2. | O site com o preço de cada ensaio, a agenda que segura a vaga até o sinal e o painel | Moral, marca, PRÉVIA falados; CONTINUAÇÃO no pós-créditos |

A linha do tempo: previsão 05/12, nascimento no sábado 14/11 (37 semanas), o pai na casa velha no dia 10 (24/11), dia 13
em 26/11 às 3h, ensaio no sábado 28/11 às 10h, o último dia da janela. O painel não recebe o Pix: quem marca o sinal é a
Helena.

## Temporada 2

O pós-créditos pergunta quem conta a próxima, o bebê ou o Louro, e anuncia "Eu ainda não andei" (o ensaio de um ano).
Os comentários "CONTINUAÇÃO" e a enquete do story dizem se vale fazer.
