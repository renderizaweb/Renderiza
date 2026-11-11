# Vereador Mateuzinho Silva (Itapevi)

Indicação do Dr. Marcos (MS Odontologia). Pesquisa do nicho em `docs/nichos/vereadores.md`.

- **Situação:** demo versão 2 (front novo) pronta em 11/11/2026, em `/demo/vereador-mateuzinho-silva`. A versão 1 é de
  10/11/2026. O que mudou, com a fonte de cada texto, número e foto, está em "Versão 2 (front)", mais abaixo.
- **Painel:** lead `vereador-mateuzinho-silva` criado em 10/11/2026, com o ok do Kaue. Segmento "Política", etapa Prontas
  para trabalhar, código `ek9h`, tag "indicação Dr. Marcos". A demo ficou com o prazo automático de 7 dias
  (`vale_ate` 17/11/2026). O contador conta as visitas, as partes vistas, os cliques (Instagram, mapa e os botões
  `pedido-*`, inclusive "pedido-enviado" quando ele testa o formulário) e os outros aparelhos (repassou).
- **Preço:** nenhum na demo.
- **Proposta e vídeo (11/11/2026):** `proposta.md` traz as duas ofertas (site, ou site com o Portal do Mandato,
  sob medida e fora do Painel Renderiza), os cuidados e o vídeo de proposta para ele e a equipe
  (`gravacoes/vereador-mateuzinho-silva-proposta.mp4`), com a fonte de cada número do vídeo.
- **Gerar de novo:**
  1. `python3 -I ferramentas/demo/fotos-vereador.py demos/vereador-mateuzinho-silva <pasta>`: baixa as fotos pela
     "origem" de cada uma no `demo.json` (Drive do Kaue ou post público). Com `--tudo`, baixa também as 64 fotos do
     Drive e os carrosséis de todos os posts, para escolher outras.
  2. `python3 -I ferramentas/demo/gerar-vereador.py demos/vereador-mateuzinho-silva <pasta>/escolhidas`. O modelo
     fica em `ferramentas/demo/modelos/vereador.html`.
  3. Rede: no ambiente da nuvem com lista de hosts, o download precisa de `drive.google.com`,
     `drive.usercontent.google.com`, `www.instagram.com` e `scontent.cdninstagram.com` (já liberados no ambiente
     "Renderiza e Pastinha"). O `ferramentas/ig-post.py` baixa as fotos pelo nome geral `scontent.cdninstagram.com`,
     porque o servidor regional que o embed indica (`scontent-xxx`) muda a cada consulta.
- **Dados no repositório** (públicos, para não pesquisar de novo):
  - `dados/pedidos.json`: os pedidos por bairro da parte "Rua por rua" (título, bairro e tema escritos à mão; a data,
    a situação e o protocolo vêm de `proposituras.json` na hora de gerar);
  - `dados/proposituras.json`: as 685 proposituras dele no sistema da Câmara, com tipo, número, data, situação,
    assunto e protocolo da Prefeitura;
  - `dados/instagram.json`: 49 posts com legenda e número de fotos.

## Quem é (só fontes públicas)

- **Nome:** Mateuzinho Silva (nos documentos da Câmara: Mateus Andrade da Silva Santos). PL, número 22222 em 2024.
- **Eleição:** primeiro mandato (2025–2028). Teve 3.351 votos em 2024 e foi o 2º mais votado dos 17.
- **Câmara:** foi 3º Secretário da Mesa em 2025 (documento da Câmara). Não confirmei a Mesa de 2026, por isso a demo
  não cita o cargo.
- **Bio do Instagram:** "Jovem + votado da história · 3.351 votos · Gestão Pública · Engajado em causas sociais · Cristão".
  A demo não usa "jovem mais votado da história" nem "formado em Gestão Pública" porque não deu para confirmar.
- **Família e grupo:** o irmão, Thiaguinho Silva (Thiago da Silva Santos), foi presidente da Câmara e é vice-prefeito
  (2025–2028). O grupo político é o do prefeito Teco e do ex-prefeito Igor Soares. A demo não cita, para não misturar
  o mandato com o grupo. Pode entrar se ele quiser.
- **Fé:** congrega na Igreja Pentecostal Renovada em Cristo (post dele) e posta cultos, a Marcha para Jesus e versículos
  (Salmo 33:12, 2 Crônicas 7:14). A demo fala disso uma vez, em "Quem é", com uma frase dele: "A oração é a chave da
  vitória." O pedido do Kaue foi ter fé presente, sem exagero.
- **Cores dele:** roxo e verde-limão (posts com a assinatura "Mateuzinho Silva · Um olhar para a População"). A frase
  dele virou o título da capa.

## O mandato (sistema da Câmara, consulta em 10/11/2026)

- **Fonte:** `itapevi.siscam.com.br`, Vereadores → Mateus Andrade da Silva Santos (AutoriaId 14947): 686 proposituras.
  - 185 indicações: 173 com a situação "Encaminhado à Prefeitura" (172 delas com protocolo PMI) e 181 com protocolo
    PMI no total;
  - 260 requerimentos;
  - 43 projetos de lei: 10 aprovados, 7 vetados, 11 arquivados, os demais em comissões;
  - 51 moções de aplauso e 91 votos de pesar.

  O sistema vai até 11/09/2026.
- **Projetos aprovados usados na demo:**
  - Dia da Mãe Atípica (PL 11/2025);
  - apoio psicológico às mães atípicas (PL 9/2025);
  - inclusão escolar com ABA para crianças com TEA (PL 179/2025);
  - Nossa Praça – Minha Cidade (PL 172/2025);
  - nomes de cinco ruas (PLs 350, 422, 423, 429 e 461/2025).
- **Em andamento na demo:**
  - remédios disponíveis e em falta nas unidades de saúde (PL 160/2026);
  - vagas de emprego (PL 168/2026);
  - "Não Se Cale" (PL 85/2026);
  - tampas de bueiro niveladas (PL 548/2025);
  - fios sem uso nos postes (PL 24/2026).
- **Ficaram de fora:** os projetos vetados ou arquivados (Festa Nordestina, Moeda Verde, vagas de zona azul para pessoas
  com deficiência e outros) e os de pauta ideológica (Dia do Conservadorismo, combate ao comunismo, sanções sobre aborto),
  porque a demo é para o morador comum. Ele decide se entram.
- **Indicações citadas:** 10527, 10379, 10376 e 10295/2026, com bairro e protocolo da Prefeitura. A Indicação nº 10704
  (fresagem) vem do post de 30/10/2026; ela ainda não aparece no sistema.

## Fotos (todas dele, do Instagram)

| Chave | Arquivo | De onde |
|---|---|---|
| capa | 2026-10-20-portas-abertas.jpg | post "Gabinete de portas abertas", 20/10/2026 (DeuXXbAFS-6, foto 1 de 6; o carrossel inteiro está em 2268 × 3024) |
| fresagem | 2026-10-30-fresagem.jpg | capa do vídeo da fresagem (Indicação 10704), 30/10/2026, cortada acima da legenda |
| moradores | 2026-11-05-moradores.jpg | post "Ouvindo as demandas", 05/11/2026 |
| retrato | 2026-10-27-plenario.jpg | carrossel da sessão de 27/10/2026 (DfA_V33o724, foto 4): ele na mesa do plenário, com a placa e o brasão da Câmara |
| fe | 2024-culto-dia-das-maes.jpg | post do culto de Dia das Mães, 2024 |
| b-* | 2024-*.jpg | visitas aos bairros (feira do Parque Suburbano, comércio do Centro, Arena Mirante, Dona Elvira e Jardim Itaparica, Jardim São Carlos, Nova Itapevi) |
| capa-rua, capa-sessao, portas-*, sessao-2, visita-* | 2026-*.jpg | fotos novas da versão 2: a lista completa está em "Versão 2 (front)" |

- **Origem dos arquivos:**
  - os de 2024 vêm da página do Instagram salva no Drive do Kaue (pasta `1Tz1sxvcxMPkpgf2JSp5moGdrIDApXxyu`);
  - os de 2026 vêm do embed público do perfil.
- **Fora da demo:** material de campanha ("Agora é Mateuzinho", convenção, número), o vídeo de Flávio Bolsonaro e
  Tarcísio (marcado "propaganda eleitoral") e as artes com texto.

## O que a demo tem (versão 2)

1. **Capa:** "Um olhar para a população.", com três fotos que passam sozinhas (gabinete, rua e sessão), os votos e
   as indicações.
2. **O mandato em números:** os quatro números oficiais com contador, as indicações já encaminhadas à Prefeitura, a
   fonte e a data da consulta.
3. **Nas ruas:** a fresagem da Indicação 10704, a visita do WhatsApp e o gabinete de portas abertas.
4. **Rua por rua:** as indicações reunidas em 113 pedidos, com busca por rua e filtro por bairro. Cada cartão tem o
   número, a data, a situação e o protocolo da Prefeitura.
5. **Pedido do bairro:**
   - o formulário (tipo, bairro, rua, descrição, foto, nome, WhatsApp e aceite da LGPD) gera um número e uma linha do
     tempo;
   - o "acompanhe" mostra a Indicação 10379/2026 de verdade;
   - na demo nada é enviado: o aviso está na página.
6. **Projetos:** os aprovados e os em andamento.
7. **Linha do tempo:** de 2024 a novembro de 2026, com duas fotos da sessão de 27/10/2026.
8. **Pelos bairros:** as fotos das visitas (2026 e 2024).
9. **Quem é:** o primeiro mandato, os valores (ouvir, cuidar, prestar contas) e a fé.
10. **Gabinete de portas abertas:** terças, depois da sessão, com as fotos dos moradores recebidos, o mapa da Câmara
    e o Instagram.

Nada pede voto nem mostra o número de urna (Lei 9.504, art. 36-A).

## Versão 2 (front), 11/11/2026

Pedido do Kaue: conceito mais inovador sem perder a comunidade, arte ou animação bonita sem exagero, abertura nova
no celular, mais conteúdo em carrosséis laterais e a fé presente como estava. Só o front mudou: o lead, o código
`ek9h` e o prazo da demo não foram tocados.

### O que mudou

- **Conceito "Rua por rua":** o site mostra o mandato como um mapa de pedidos. A parte nova "Rua por rua" tem busca
  ("Procure a sua rua ou o seu bairro"), filtro por bairro e um carrossel de cartões, cada um com o número da
  indicação, a data, a situação e o protocolo da Prefeitura. Busca sem resultado leva ao "Pedido do bairro".
- **Abertura no celular:** a foto ocupa a tela e o título entra por cima, embaixo, com o botão do pedido já na primeira
  tela. São três fotos reais que passam como stories (barrinhas no alto, aproximação lenta). No computador, o texto
  fica à esquerda e as fotos num cartão, com um aro tracejado girando devagar. A foto nunca é cortada na largura no
  celular (os rostos ficam inteiros); em celular baixo a capa esconde o segundo botão e o selo dos votos.
- **Arte e animação** (CSS e JS puros, sem biblioteca; tudo para com `prefers-reduced-motion`):
  - o painel "O mandato em números" tem um desenho de ruas que se traça sozinho, pontos que acendem e duas luzes que
    andam pelas avenidas (é um desenho, não o mapa de Itapevi);
  - os números contam até o valor oficial e a barra "173 das 185" enche;
  - uma faixa com os nomes dos bairros das indicações passa devagar antes do "Rua por rua";
  - as partes aparecem ao rolar (mesma convenção das outras demos: `.reveal` e `.is-visible`).
- **Carrosséis laterais** no lugar das pilhas: nas ruas, pedidos por bairro, passos do pedido, projetos, linha do
  tempo, fotos dos bairros, valores e galeria do gabinete. Cada um tem uma barrinha de posição; no computador, setas.
- **Conteúdo novo:** "Rua por rua", "Linha do tempo", a galeria do gabinete de portas abertas (um morador ou uma
  dupla por foto), duas fotos da sessão e três fotos novas da visita de 05/11/2026.
- **Fé:** igual à versão 1, uma vez só, em "Quem é", com a frase dele.
- **Saiu:** a lista "Indicações mais recentes" (as quatro estão nos cartões do "Rua por rua").
- **Técnico:**
  - partes e menu: `inicio`, `mandato`, `ruas`, `bairros` (agora é o "Rua por rua"), `pedido`, `projetos`, `linha`,
    `visitas` (as fotos, que na versão 1 eram `bairros`), `quem` e `gabinete`. Todas têm `aria-label` e título. Na
    tela Atividade os nomes ficam: Capa, Mandato, Nas ruas, Rua por rua, Pedido do bairro, Projetos, Linha do tempo,
    Pelos bairros, Quem é, Gabinete e Rodapé;
  - `data-rz-alvo`: `pedido-topo`, `pedido-capa`, `pedido-barra` e `pedido-enviado`, como antes. Os filtros e as setas
    são botões com nome, então também aparecem nos cliques;
  - o topo é `position: sticky` e a capa sobe por baixo dele: se a demo ganhar a faixa da oferta, ela fica acima;
  - `gerar-vereador.py` ganhou `{{dim:chave}}` (largura e altura da foto), `{{n:chave}}` (números contados em
    `proposituras.json`) e `{{json:pedidos}}`. Ele para com erro se alguma das 185 indicações não estiver em um pedido
    nem na lista "fora" de `pedidos.json`;
  - peso: a página montada tem 100 KB e as 21 fotos somam 1,5 MB (total de 1,6 MB). Só a primeira foto da capa
    carrega na abertura; as outras duas entram depois e o resto é `loading="lazy"`.

### Textos e números novos, com a fonte

Os números agora saem do gerador (`{{n:…}}`), contados em `dados/proposituras.json`.

| Onde | Texto ou número | Fonte |
|---|---|---|
| Capa | legendas das fotos: "Gabinete de portas abertas · Toda terça, depois da sessão na Câmara"; "Na rua, com os moradores · Visita de 5 de novembro de 2026"; "Sessão na Câmara · 27 de outubro de 2026"; e "Na foto: …" com a data | `instagram.json`: posts DeuXXbAFS-6 (20/10/2026), DfX7haJo7it (05/11/2026) e DfA_V33o724 (27/10/2026), campos `data` e `legenda` |
| Números | "173 das 185 indicações já foram encaminhadas à Prefeitura." | `proposituras.json`: tipo "Indicação" (185) com situação "Encaminhado à Prefeitura" (173) |
| Números | 185, 260, 43 (10 aprovados) e 51 | os mesmos da versão 1, agora contados pelo gerador: tipos "Indicação", "Requerimento", "Projeto de Lei" (situação "Aprovado") e "Aplauso" |
| Nas ruas | "Terça é dia de porta aberta": "Depois da sessão, como em todas as terças-feiras, o gabinete abre as portas para ouvir quem tem uma demanda do bairro." Etiqueta "Toda terça" | `instagram.json`, post DeuXXbAFS-6, `legenda` ("Hoje, após a sessão, como acontece todas as terças-feiras, abriremos as portas do nosso gabinete para atender a população…") |
| Faixa | os nomes dos bairros | `dados/pedidos.json`, campo `b` (ver "Rua por rua", abaixo) |
| Rua por rua | título de cada cartão | `dados/pedidos.json`, campo `t`: resumo do campo `assunto` das indicações do cartão |
| Rua por rua | bairro e tema de cada cartão | `dados/pedidos.json`, campos `b` e `c` (lidos do `assunto`) |
| Rua por rua | número, data, situação e protocolo PMI | `proposituras.json`: `num`, `data`, `situação` e `protocolo prefeitura`. "Na Prefeitura" = "Encaminhado à Prefeitura"; "Tramitando na Câmara" = "Tramitando" |
| Rua por rua | "Também na Indicação …" | as outras indicações do mesmo pedido (campo `n` de `pedidos.json`) |
| Rua por rua | os números ao lado de cada bairro e "Os 12 pedidos mais recentes" | contados na página a partir de `pedidos.json` (tabela abaixo) |
| Linha do tempo | "2024 · Eleito com 3.351 votos · O 2º vereador mais votado de Itapevi." | esta ficha, "Quem é" |
| Linha do tempo | "27 de janeiro de 2025 · As primeiras proposituras · Entre elas, os projetos do Dia da Mãe Atípica e do apoio psicológico às mães atípicas, hoje aprovados." | `proposituras.json`: a data mais antiga de todas é 27/01/2025; PL 11/2025 e PL 9/2025 têm `data` 27/01/2025 e situação "Aprovado" |
| Linha do tempo | "Abril de 2025 · Inclusão e praças · Apresenta os projetos da inclusão escolar com ABA e do Nossa Praça – Minha Cidade, hoje aprovados." | `proposituras.json`: PL 179/2025 (09/04/2025) e PL 172/2025 (04/04/2025), situação "Aprovado" |
| Linha do tempo | "2025 · O primeiro ano · 68 indicações, 117 requerimentos e 29 projetos de lei. Na Mesa da Câmara, foi 3º Secretário." | `proposituras.json`, contagem por tipo com `data` em 2025; o cargo de 2025 vem desta ficha ("Quem é") |
| Linha do tempo | "Janeiro de 2026 · 73 indicações em um mês · 61 delas reapresentam pedidos feitos em 2025." | `proposituras.json`: 73 indicações com `data` em 01/2026; 61 delas estão, em `pedidos.json`, no mesmo pedido de uma indicação de 2025 |
| Linha do tempo | "Maio de 2026 · Saúde e emprego · Apresenta os projetos da lista de remédios disponíveis e em falta nas unidades de saúde e da divulgação de vagas de emprego." | `proposituras.json`: PL 160/2026 (25/05/2026) e PL 168/2026 (28/05/2026) |
| Linha do tempo | "27 de outubro de 2026 · Sessão com homenagens · A Câmara recebe e homenageia pessoas que fazem trabalho social na cidade." e a legenda das duas fotos | `instagram.json`, post DfA_V33o724, `legenda`; a foto mostra a moção de aplauso |
| Linha do tempo | "30 de outubro de 2026 · Pedido atendido · Começa a fresagem pedida na Indicação nº 10704, o primeiro passo para o asfalto novo." | `instagram.json`, post DfGvfIWOc99, `legenda` |
| Linha do tempo | "5 de novembro de 2026 · O trabalho segue · Visita a moradores que chamaram o gabinete pelo WhatsApp para mostrar os problemas do bairro." | `instagram.json`, post DfX7haJo7it, `legenda` |
| Pelos bairros | "Visita a pedido dos moradores", "Conversa com moradores" e "Ouvindo as demandas", com "5 de novembro de 2026" | `instagram.json`, post DfX7haJo7it, `legenda` e `data` |
| Pelos bairros | "· 2024" nas legendas das fotos antigas | esta ficha, "Fotos": são da página de 2024 salva no Drive |
| Gabinete | "Moradores recebidos no gabinete em 20 de outubro de 2026." | `instagram.json`, post DeuXXbAFS-6, `data` e `legenda` |

Textos só de interface, sem fato novo: "Rua por rua", "Procure a sua rua ou o seu bairro.", "As indicações do mandato,
reunidas por pedido…", "Mais recentes", "A sua rua ainda não está aqui? Ela pode ser a próxima: mande o pedido para o
gabinete.", "Linha do tempo", "O mandato, passo a passo." e a nota "Situação no sistema da Câmara Municipal de Itapevi,
consultado em 10/11/2026. Quando o mesmo pedido foi apresentado mais de uma vez, as indicações aparecem juntas."

### Rua por rua: como os pedidos foram montados

- **De 185 indicações para 113 pedidos:** muitas indicações de janeiro de 2026 repetem o texto de uma de 2025, e
  algumas ruas têm uma indicação para a Secretaria e outra para a Sabesp. Indicações do mesmo pedido ficam no mesmo
  cartão: ele mostra a mais nova e cita as outras.
- **179 indicações estão nos cartões e 6 ficaram de fora** (lista "fora" de `pedidos.json`):
  - 1049/2025: pede que as guardas municipais também sejam chamadas de polícias municipais. Fica de fora por cautela,
    como os projetos de pauta ideológica; o Kaue ou o vereador decidem se entra;
  - 1422/2025, 56/2025, 53/2025, 45/2025 e 41/2025: o campo `assunto` está cortado no sistema e não diz o que pedem.
- **Bairros conferidos à mão** (um por um, no texto de cada indicação) e depois por script (o nome da rua e o bairro
  do cartão têm de estar no `assunto`). As grafias que foram unidas estão em "grafias", em `pedidos.json`:
  - Jardim Sorocabano = "Jardim Sorocabano", "Jardim Sorocabana", "Bairro Sorocabano" e "Sorocabano";
  - Jardim Rainha = "Jardim Rainha", "Jardim da Rainha" e "Bairro Rainha" (a Rua dos Xavantes aparece nas duas
    primeiras);
  - Vila Dr. Cardoso = "Vila Dr. Cardoso", "Vila Doutor Cardoso" e "bairro Cardoso" (a UBS);
  - Monte Serrat = "Chácaras Monte Serrat", "Monte Serrat" e "loteamento Monte Serrat";
  - Cohab = "COHAB", "Parque da Cohab, Conj. Hab. - St. D" e "Conjunto Habitacional Setor A";
  - Centro = "Centro", "região central" e "centro deste município";
  - Chácara Lagoinha = "Chácara Lagoinha" e "Bairro Lagoinha" (a mesma Rua dos Tambores);
  - Parque Suburbano = "Suburbano" (a feira); Parque Miraflores = "Parque Mira Flores"; Vila dos Mineiros = "Vila dos
    Mineiro"; Vila São João = "Vila São Joao"; Jardim Vitápolis = "Jardim Vitapolis";
  - "Santa Rita" ficou separado de Jardim Santa Rita e de Vila Santa Rita: o texto da 94/2026 diz só "bairro Santa
    Rita". Chácara Vitápolis e Jardim Vitápolis também ficaram separados, como estão no texto.
- **Dois grupos sem bairro:** "Toda a cidade" (pedidos para o município inteiro) e "Outros locais" (têm endereço, mas
  o texto não diz o bairro: rodovia, estrada, córrego, estação e parque).
- **Três pedidos valem para mais de um bairro** e aparecem em cada um: 4792/2026 (Jardim Portela, Jardim São Carlos e
  Jardim Sorocabano), 7613/2026 (Centro e Cohab) e 111/2026 com 950/2025 (Jardim Sorocabano e Jardim São Carlos).
- **Grafias corrigidas no título:** "Rua Arlindo Venturi" (a 4717/2026 escreve "Alindo"), "Estrada do Sapiantã" (a
  95/2026 e a 49/2025 escrevem "Sapiatã") e "Unidade de Saúde da Família (USF)" (o texto diz só "USF").
- **Pedidos por bairro** (o número que aparece em cada filtro):

  | Pedidos | Bairros |
  |---|---|
  | 19 | Toda a cidade |
  | 10 | Jardim Portela |
  | 9 | Jardim São Carlos |
  | 8 | Centro, Vila Santa Rita |
  | 7 | Outros locais |
  | 5 | Jardim Sorocabano, Monte Serrat |
  | 4 | Jardim Briquet |
  | 3 | Amador Bueno, Cohab, Jardim Rainha, Jardim Santa Rita, Jardim Santo Antônio, Vila Dr. Cardoso |
  | 2 | Ambuitá, Chácara Lagoinha, Jardim Itacolomi, Jardim Julieta, Parque Boa Esperança, Parque Miraflores |
  | 1 | Chácara Vitápolis, Chácaras Selva, Cidade da Saúde, Itaqui, Jardim Hokkaido, Jardim Vitápolis, Parque Suburbano, Santa Rita, Vila Belmira, Vila dos Mineiros, Vila São Francisco, Vila São João |

  A soma dá 117 porque três pedidos estão em mais de um bairro (113 pedidos no total). A página não mostra o total de
  bairros, de propósito: nomes parecidos podem ser o mesmo lugar.

### Fotos novas (todas do Instagram dele, pelo embed público)

| Chave | Origem | Onde aparece |
|---|---|---|
| capa-rua | DfX7haJo7it, foto 3 de 6 (05/11/2026): ele e um morador na rua | capa (2ª foto) |
| capa-sessao | DfA_V33o724, foto 1 de 4 (27/10/2026): ele com duas homenageadas e a moção de aplauso | capa (3ª foto) e linha do tempo |
| sessao-2 | DfA_V33o724, foto 2 de 4: ele com convidados, em frente às bandeiras | linha do tempo |
| portas-1 | DeuXXbAFS-6, foto 2 de 6 (20/10/2026): ele com duas moradoras | nas ruas (3ª história) e galeria do gabinete |
| portas-3, portas-4 e portas-5 | DeuXXbAFS-6, fotos 4, 5 e 6 de 6: um morador ou uma moradora por foto | galeria do gabinete |
| visita-3, visita-4 e visita-5 | DfX7haJo7it, fotos 4, 5 e 6 de 6 | pelos bairros |

- A foto da capa (DeuXXbAFS-6, foto 1) aparece também no fim da galeria do gabinete: é o mesmo arquivo, não pesa
  mais.
- **Ficou de fora** a foto 3 de 6 do DeuXXbAFS-6: ele e o morador fazem um gesto com a mão que parece o "M" da hashtag
  "#fazoM", usada também na campanha de 2024. Não é material de campanha, mas preferi não arriscar.
- Não entrou nenhuma foto nova de 2024.
- Nenhuma foto tem rosto cortado: a capa do celular mostra a foto inteira na largura, a tira "Pelos bairros" e as
  fotos da sessão não têm corte, e os cartões cortam só em cima e embaixo, longe dos rostos.
- As fotos da visita de 05/11/2026 têm 747 px de largura no Instagram (só a foto 5 é maior): na capa, a segunda foto
  fica um pouco menos nítida que a primeira.

### Como foi conferido

- Playwright a 390 e a 1280 de largura (e também a 320, a 360, com o celular deitado e em tablet): sem rolagem lateral,
  nada fora da tela, sem erro de JS, todas as imagens carregam, a capa troca de foto, o menu do celular abre e fecha, o
  filtro por bairro e a busca sem acento funcionam, o formulário recusa sem o aceite e mostra o número com o aceite.
- A página montada (`node scripts/montar-site.mjs`) foi aberta com o contador dentro: `data-demo` certo, as fotos
  saem de `/f/` e as partes aparecem com os nomes acima.
- `npm test`: 202 testes, todos passam.
- Nas capturas usei as mesmas fontes instaladas no ambiente (Plus Jakarta Sans e Bricolage Grotesque), porque a rede
  de lá não alcança o Google Fonts. O endereço da fonte nova no Google Fonts foi conferido à parte: responde com os
  pesos 600, 700 e 800. Se ela não carregar, os títulos caem para a Plus Jakarta Sans, como na versão 1.
- **Falta conferir o link no ar.** A rede do ambiente não alcança `www.renderizaweb.com.br` e a liberação desse
  endereço foi recusada, então a página publicada não foi aberta nesta sessão. O commit está na `main` e a montagem
  passou aqui com o mesmo comando da Vercel. Quem revalidar: abrir o link no celular e ver a capa trocando de foto, o
  "Rua por rua" e o formulário.

## A confirmar com ele

- **Contato:** o WhatsApp oficial do gabinete (a demo usa o pedido pelo site e o Instagram) e o endereço do gabinete.
- **História:** a formação, onde cresceu e como quer ser apresentado.
- **Bandeiras e conteúdo:** as bandeiras que quer destacar e se os projetos de pauta conservadora entram.
- **Igreja:** se quer citar a igreja pelo nome.
- **Fotos:** fotos originais em alta, principalmente um retrato dele sozinho (o Kaue citou uma do gabinete postada em 10/11,
  que ainda não aparecia no embed público).
