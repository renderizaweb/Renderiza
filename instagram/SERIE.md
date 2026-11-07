# Série "Eu ainda não nasci": uma história em três episódios

Uma minissérie para fotógrafas de gestante e newborn, um episódio por dia às 19h. Quem narra é o bebê da Camila, do
útero ao primeiro ensaio. Diferente de partes que se entendem sozinhas, aqui a história é uma só: cada episódio termina
numa pergunta que só o próximo responde, e cada um começa lembrando o anterior. O visual comum está em `serie.mjs`
(selo, cartão do resumo e o "Siga") e em `celular.mjs` (o celular, o estúdio, a Helena e as fotos dos ensaios).

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
| O meio | A história, com pelo menos uma coisa para aprender desenhada na tela (régua, contador, cronômetro). |
| Gancho do fim | Uma frase que deixa a pergunta aberta ("Só que eu resolvi nascer três semanas antes."). |
| Prévia (uns 6 s, episódios 1 e 2) | "No próximo episódio: ..." com cenas do episódio seguinte, e a voz fecha com "Siga para ver o episódio 2" ou "Siga para ver o final". |
| Depois da voz (episódios 1 e 2) | Só na tela, sem falar: a marca, "Comenta PRÉVIA" e "que a Renderiza monta a prévia do site do seu estúdio". |
| Final (episódio 3) | A história fecha, e a voz fala a moral, a Renderiza e o convite. |

No motor, o fim mudo acontece sozinho quando a narração não tem a frase `moral` (`historia.mjs`; o tempo na tela é
`fimMudo`, padrão 4,2 s). O "Siga" é `serie(R, { siga: { texto } })`, que aparece na frase de id `siga`.

## Para aprender vendo

| Episódio | O que se aprende |
|---|---|
| 1 | A régua da gestação: 40 semanas, 36 feitas, 4 faltando. O caminho até o preço: 14 páginas, o preço na 9, o PDF que não baixa. |
| 2 | A janela do newborn: o contador dos 15 dias, e "janeiro: dia 48, fora da janela". 54% dos brasileiros compram à noite ou de madrugada (CX Trends 2026, Octadesk e Opinion Box). |
| 3 | 14 páginas no episódio 1 contra um toque agora. As 24 horas da pré-reserva até o sinal, e o cronômetro dos quatro minutos. |

## Capa

O selo "EPISÓDIO N · EU AINDA NÃO NASCI" (no 3, "EPISÓDIO 3 · FINAL") e o título grande, sem a marca, com o título a
pelo menos 290 px do topo: o perfil mostra a capa cortada em 3:4, sem os 240 px de cima e de baixo. As três lado a lado
contam o relógio: "Eu ainda não nasci", "Quinze dias", "Faltam dois dias".

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

| Episódio | Arquivo | A história | O que a Renderiza mostra | Fim |
|---|---|---|---|---|
| 1 · A tabela | `reels-nasci1` | Com 36 semanas, o bebê vê a mãe pedir o valor à Helena e receber um PDF de 14 páginas que não baixa. Ele chuta, o celular cai, e ela fecha com outra fotógrafa, mais cara, que mostrava o preço na primeira tela. A Helena acha que foi o preço. Gancho: ele nasce três semanas antes. | O preço na primeira tela (pela outra fotógrafa) | Siga + PRÉVIA na tela |
| 2 · Quinze dias | `reels-nasci2` | Nascido em 14/11, às 4h, o relógio dos 15 dias corre. A outra fotógrafa só tem vaga em janeiro. Às 3h, perfis parados, telefone que não existe, a Helena no vácuo e o alfinete do mapa na casa da mãe dela. No dia 11, a mãe desiste; no 13, acha o newborn mais lindo do Instagram: é da Helena. | O que falta quando não há site | Siga + PRÉVIA na tela |
| 3 · Três da manhã | `reels-nasci3` | Faltando dois dias, a mãe digita "valor?", para e toca no link da bio: é um site. Sábado, 10h, livre, porque um "vou ver com meu marido" não pagou o sinal em 24 horas. Ela marca em quatro minutos. De manhã, a Helena marca o sinal no painel e lê "Camila". A do PDF? Ela tinha trocado o PDF por um site. O bebê vira a primeira foto do newborn no site. | O site com o preço de cada ensaio, a agenda que segura a vaga até o sinal e o painel | Moral, marca e PRÉVIA falados |

A linha do tempo: previsão 05/12, nascimento no sábado 14/11 (37 semanas), dia 13 em 26/11, ensaio no sábado 28/11 às
10h, o último dia da janela. O painel não recebe o Pix: quem marca o sinal é a Helena.
