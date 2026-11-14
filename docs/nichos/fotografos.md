# Fotógrafos: família, gestante, newborn e infantil (rascunho de `docs/nichos/fotografos.md`)

Rascunho para virar o arquivo do nicho. Base: a medição de 21 e 22/10/2026 (`medicao.md`) e o lote 1 de prospecção (22/10/2026,
`lote1.md`). Nada foi cadastrado no painel.

## Resumo
- **Quem buscamos:** fotógrafa(o) de **família, gestante, newborn e infantil** (smash the cake, acompanhamento do bebê,
  aniversário em estúdio), que atende o próprio WhatsApp e decide. Ela é a marca: nome e rosto no Instagram.
- **Por quê agora:** em outubro o Natal já está à venda. No lote 1, **15 das 20 já anunciam o ensaio de Natal 2026**, vendido
  por horário, lote e vaga ("agenda aberta", "3º lote", "pré-venda 22/10", "lista VIP", "vagas limitadas"), e fechado no
  WhatsApp ou no direct. É o gancho da demo (página da campanha de Natal com horários e vagas).
- **Onde há espaço:** metade dos estabelecidos não tem site próprio funcionando; 7% têm site morto (Alboom congelado, domínio
  vencido, Wix desconectado), que é a prioridade máxima.

## 1. A régua (lote 1)
- **Google Maps:** Grande SP, nota **4,7+**, **15 a 150 avaliações**, **celular** no Google, aberto.
- **Site:** nenhum, Instagram ou Linktree no lugar, ou **morto**. Site próprio funcionando fica fora (inclusive o que só
  aparece testando domínios).
- **Instagram:** **1 mil a 30 mil seguidores** e **post nos últimos 30 dias** (desde 22/09 neste lote).
- **Fora:** casamento de alto padrão, corporativo/marca pessoal como foco, cobertura de eventos e festa infantil, 3x4,
  impressão, lojas, escolas, cabines, aluguel de estúdio, drone, redes, e estúdio com equipe e atendente (300+ avaliações,
  "a atendente", "consulte nossa equipe").
- **Bônus:** Natal 2026 anunciado (ou feito antes), mini sessão, estúdio próprio ou cenários, dona com nome e rosto.

## 2. Como foi a varredura (o que funcionou)
1. **Buscas de especialidade no Maps** (`lista.mjs`, 6 filas): "fotógrafa newborn em …", "ensaio gestante em …", "fotógrafo de
   família em …", "estúdio fotográfico infantil em …", "smash the cake em …". 41 buscas trouxeram 1.406 lugares novos e 868
   fotógrafos novos na Grande SP; a maioria das listas chega ao fim com 60 a 120 resultados (algumas, como "newborn em
   Moema", com 8 a 16).
2. **Filtro e detalhes** (`novos.py`, `det2.mjs`): categoria do card (Fotógrafo, Estúdio fotográfico/de fotografia, Serviço de
   fotografia) e exclusões pelo nome; detalhes (site, telefone, endereço, avaliações visíveis) de quem está na régua.
3. **Site** (`checa_site.py`): curl + DNS do Google + leitura do HTML. Mortos típicos: Alboom "congelado" (403), Alboom
   desligado (o domínio aponta para a Alboom, que responde 409 e não tem certificado), página 404 da 46graus, Wix
   "ConnectYourDomain", domínio que não existe e DNS quebrado (SERVFAIL).
4. **Domínios óbvios** (`dominios.py`): 16 a 24 variações por finalista (nome, nome+fotografia/fotografa/foto/photography,
   o @; .com.br e .com) no DNS, abrindo as que respondem e conferindo telefone, @ e cidade na página (`confere_dom.py`).
5. **Instagram**: o @ vem do Google (link ou rede), do site, da amostra de ontem ou da **busca na web** (DuckDuckGo,
   "<nome> <cidade> instagram", `busca_ig.py`, 4 a 6 s entre buscas). O **embed público** (`ig_ler.py`) dá seguidores, posts,
   foto do perfil e os 6 últimos posts com data, legenda e local marcado.
6. **Bio pela busca** (`bio_ddg.py`): o embed não traz a bio, mas o trecho do resultado "instagram <@>" traz ("📍 São Caetano do
   Sul", "Estúdio em Pirituba", WhatsApp, "agenda de Natal aberta"). Foi a melhor prova da cidade.
7. **Folha de fotos** (`folhas.py`, 5 perfis por folha, com a foto do perfil ampliada): olhar todas e dar nota de 0 a 5.
8. **Ranking** (`pontua.py`) com fórmula aberta (em `lote1.md`) e **dona nas avaliações** (`dona.py`: "a Ana", "a Su", "a Ro").

## 3. Funil do lote 1 (22/10/2026)
66 buscas no Maps → 3.607 lugares → cerca de 2.160 fotógrafos na Grande SP → **334 no perfil** (régua do Google, celular, sem
site funcionando, fora das exclusões pelo nome) → 288 com Instagram lido → 182 no corte (1 mil a 30 mil e post em 30 dias) →
153 com o @ conferido → **105 olhados na folha** → **20 + 5 de reserva**. Das 20: 4 com site morto, 2 com link na bio, 8 com
o Instagram no lugar do site e 6 sem link; 15 anunciam Natal 2026; de 1,6 mil a 29 mil seguidores (mediana de 6,4 mil).

## 4. O que o lote ensinou
- **"Sem site no Google" engana de novo:** 7 tinham site próprio funcionando, achado só testando domínios (Lu Schoti, Maria
  Fernanda, Eternize, Jhonatan Santos, Wellington Noronha, Delicada Adélia Marinho) ou um site novo enquanto o Google aponta o
  antigo, morto (Lari Ferreira). E domínio com o mesmo nome costuma ser de outra pessoa (arquiteta, contadora de histórias do
  Paraná, fotógrafa de Americana): sempre conferir telefone, @ ou cidade na página.
- **Nome parecido engana:** dois "Estúdio Delicada" diferentes na mesma cidade; a exclusão tem que ser pelo id do lugar, nunca
  pelo começo do nome.
- **O @ achado pela busca errou 3 de 39** na 2ª folha (estúdio de unhas, salão de cabelo e um fotógrafo de Natal-RN, que
  apareceu porque "Natal" é palavra-chave do nicho). A folha pega na hora.
- **O Google fica desatualizado:** endereço e celular antigos (Katia Rodrigues mudou para Guarulhos), celular com DDD de outro
  estado (Cris Ribeiro, DDD 41). Na lista vão os dois números, com a fonte.
- **Instagram pelo curl:** com user-agent de navegador o Instagram devolve a página de login; sem user-agent o embed funciona.
  Cerca de 3,7 s por perfil e nenhum bloqueio em ~315 leituras.
- **O Internet Archive (Wayback) bloqueia daqui** (erro 429): não serve para achar o @ do site morto.
- **Outubro é cheio de arte de Natal:** muitos feeds têm metade dos posts em arte com texto (cronograma, "agenda aberta"). A
  nota de fotos cai, mas o sinal de Natal sobe; para a demo, as fotos virão da página salva pelo Kaue (mais posts).
- **Festa infantil parece infantil:** perfis de cobertura de festa (Click Bambini, Thalita Silva) só aparecem como "fora" na
  folha. E bio que lista "eventos", "marca pessoal", "pré-wedding" ou "15 anos" perde pontos de especialidade.
- **Dona com rosto é comum:** a maioria usa a própria foto com a câmera no perfil; perfil com logo (Clau Duarte, Nina Queen,
  Dani Izidoro, Star Photo) perde pontos. Duplas e casais são frequentes ("as meninas", "o casal", "vocês"): marcar no alerta.
- **Avaliação que cita equipe ou atendimento depois do ensaio** ("consulte nossa equipe", "o atendimento após o ensaio é
  péssimo") é sinal de estúdio com estrutura: fora.

## 5. Cuidados para a demo e a abordagem
- Bebê e criança: só fotos que a própria fotógrafa publicou; nada de foto de cliente de repost.
- Preço: a decisão nova é mostrar o preço na demo de fotógrafo, com prazo real (`vale_ate`), sem contagem falsa.
- Conferir no navegador, antes de mandar, o site morto e o link da bio de quem diz "agende no link" (pode ser agenda online).
- Quem atende: em duplas e casais, confirmar o nome de quem pega o WhatsApp.

## 6. Pendências (para o Kaue decidir)
1. A régua: 15 a 150 avaliações, nota 4,7+, 1 mil a 30 mil seguidores, post em 30 dias. Manter?
2. Duplas e casais (Vitória Mazo, Aizza Cardoso, Anny, Elôo e Jeff): entram como "dona"?
3. Os valores para as demos (preço na demo) e a data de validade de cada uma.
4. Quantas demos no 1º lote e a ordem (sugestão: começar pelos 4 sites mortos e pelas que já vendem Natal por horário).
5. ~~Próximo lote: 54 passaram no corte e não foram olhados na folha (lista em `lote1/dados/nao_olhados.json` na pasta da
   sessão)~~ A pasta da sessão do lote 1 se perdeu; o lote 2 refez a varredura do zero (seção 7).

## 7. Lote 2 (05/11/2026)

O lote 1 foi para o ar (20 demos de 28/10) e teve bom resultado; o lote 2 replica o mesmo perfil. A lista completa, com a
pontuação, está em **`docs/nichos/fotografos-lote2.md`** (no repositório, para não se perder com a sessão). Os scripts do
nicho estão em `ferramentas/prospeccao/fotografos/`. Nada foi cadastrado no painel.

**A régua não mudou** (seção 1). Fora: as 20 do lote 1 (pelo id do lugar e pelo @) e quem o lote 1 já tinha descartado por
site próprio.

**Funil:** 166 buscas no Maps (5 termos girando por 52 bairros da capital e 28 cidades, com prioridade às zonas norte e leste
e às cidades que faltaram) → 4.380 lugares → 2.294 fotógrafos (pela categoria) → **803 na régua do Google** (nota 4,7+, 15 a
150 avaliações, fora as exclusões pelo nome) → 439 sem site próprio funcionando → 331 com Instagram achado e lido → **181 no
corte** (1 a 30 mil seguidores, post em 30 dias) → **181 olhados na folha** → 57 com nota 4+ e @ certo → avaliações, domínios
(com e sem www) e cidade conferidos → **20 + 5 de reserva**.

**As 20:** 4 com site morto (Fluup, Thamy Lima, Amanda Azevedo e Thamirys Costa, esta achada testando domínios: Alboom
desligado, como a Ana Carolina), 9 com o Instagram no lugar do site, 6 sem link e 1 só com Facebook; 18 vendendo Natal 2026
nos últimos posts e 2 só mostrando; todas com celular no Google e post desde 23/10; de 1,9 mil a 25,4 mil seguidores (mediana
de 6,5 mil); 2 reservas do lote 1 entraram (Gabi Nascimento e Rosangela Rocha).

**Descartes dos 181 olhados:** 21 fora do nicho (marca pessoal, moda, esporte, show), 19 com @ errado ou não confirmado, 17
de casamento, 15 anos ou eventos, 9 de cobertura de festa infantil, 3 já do lote 1 (Katia Rodrigues numa 2ª ficha em Guarulhos,
Maria Fernanda e o Jooh, que é o Jonathan Santos), 1 com site próprio (Francielly Fragnan), 1 só arte, 1 aluguel de estúdio, 1
curso; 51 com fotos medianas (nota 3,5 ou menos).

**O que o lote 2 ensinou:**
- **A busca na web não funciona mais daqui:** o DuckDuckGo pede captcha, o Google bloqueia e o Bing devolve lixo. O @ veio do
  Google (link no perfil, site ou Linktree) ou de variações do nome testadas no embed (`ig_foto.py`, até ~20 por lugar). Sem a
  bio, a cidade se prova pelo local marcado nos posts, pelo 📍, pelo telefone do Google nas legendas ou por um site com o @.
- **O @ por variação do nome errou em 19 dos olhados:** Americana (o @annyfotografia, reserva do lote 1, é de lá), Rio das
  Ostras, Uberaba, Colômbia, México, Indonésia, Espanha, perfis pessoais. Os domínios ajudam: annyfotografia.com.br e
  danilimafotografia.com.br diziam a cidade.
- **Testar o www:** franciellyfragnan.com dá 403, mas www.franciellyfragnan.com é o site dela funcionando. E domínio sem
  endereço na raiz pode ter o www (o teste agora cobre os dois).
- **Alboom desligado também aparece só testando domínios:** thamiryscosta.com.br → www → website.alboompro.com → 409.
- **"Equipe" nas avaliações pesa:** "ela e toda sua equipe", "as meninas", "a Mari e a Isa". Entrou na pontuação (−5) e no
  alerta, em linha com a lição do lote 1 sobre estúdio com estrutura.
- **Novembro é o auge do Natal:** 18 das 20 já vendem (temporadas de 24/10 a 20/12, lotes, "restam poucas vagas", "faltam 8
  sábados"). Para a demo, o prazo é curto: quem recebe depois de ~20/11 já está com a agenda cheia.
- **Uma avaliação negativa entre muitas boas** (Solange, Mariana Lima, Juliana Figueiredo) vai só no alerta.

**Demos do lote 2 (05/11/2026): as 9 primeiras.** O Kaue escolheu as 9 primeiras da lista e mandou as páginas
do Instagram no Drive (pasta "lote 2", uma por fotógrafa). As 9 entraram no painel em Leads a trabalhar e ganharam a
demo no formato do lote 1 (`ferramentas/demo/gerar-fotografia.py`: o site + a página de Natal, com o preço e o prazo
na faixa da Renderiza): Fluup, Je Criativa, Gabi Nascimento, Solange David, Elise Vitor, Rosangela Rocha, Fernanda
Oliveira, Thamy Lima e Heloisa Barbosa. Oferta igual à do lote 1 (R$ 399 no Pix ou 2x de R$ 199).
- **Prazo do valor (pedido de 05/11/2026):** a faixa mostra o aviso "Valor válido somente até <data>" (nestas 9, 10/11/2026;
  nas próximas, a data da demo + 7 dias: é o padrão do gerador quando `renderiza.valido_ate` falta). Depois do último dia
  (horário de Brasília), o aviso e a data somem sozinhos e fica só o valor. A demo continua com o `vale_ate` dela no
  painel (estas 9 saem do ar em 12/11). Enquanto o aviso aparece, o computador esconde o "Tudo incluso:" da faixa para
  caber numa linha; no celular, o aviso fica numa linha só dele. O que cada uma tem e o que conferir está na `ficha.md` da pasta.
- **Oferta mais clara e o aviso da Renderiza (pedido de 06/11/2026, a partir do lote 3):** a faixa diz "pagamento único" ao
  lado do valor e "Promoção de 1 semana: até <data>"; o "Ver condição" e o card explicam que é um pagamento único, que o site
  fica 100% da pessoa, sem mensalidade, e que a promoção vale uma semana. Com `renderiza.aviso` no `demo.json`, a demo
  ganha o aviso da Renderiza: um recado curto que abre uma vez depois de 40 s e 25% da página, com a data em que a demo
  sai do ar, o valor e os opcionais (agenda online e painel), e que fecha no botão, no X, tocando fora ou no Esc. Serve
  para medir: quem viu, como fechou, quanto tempo ficou aberto e se foi para o WhatsApp ou para o painel de exemplo
  (README, "Aviso da Renderiza"). As demos antigas só mudam se forem geradas de novo.
  **Tirado no mesmo dia:** nas primeiras visitas de clientes, o aviso abria aos 40 s e a pessoa saía em seguida (fechou no
  X e saiu, ou saiu com ele aberto), quando antes as visitas duravam 1 a 3 min. As 25 do lote 3 foram geradas de novo sem
  ele. Lição: nada que cubra a página enquanto a pessoa ainda está olhando as fotos.
- **Como foram montadas:** a bio da página salva confirmou o @ das 9; fotos da página salva (posts antigos, até 1440
  px) + os carrosséis dos posts de out/nov 2026 (`ferramentas/ig-post.py`, até 2048 px) + as fotos do Google; avaliações
  do Google (só as de 5 estrelas, trecho de até ~175 caracteres). Os scripts de cada uma ficaram na pasta da sessão.
- **O que é novo:** `ferramentas/demo/marca-fotografia.py` faz o monograma e o logo em letra cursiva (como os do
  lote 1, "feitos para a demo") a partir das fontes do Google Fonts; o gerador ganhou `contato.rotulo` (para quem
  atende a domicílio, como a Thamy Lima, o rótulo do endereço vira "Atendimento").
- **Lições:** (1) as abas do portfólio têm que ter a mesma altura (a altura segue a aba mais alta: com 4 colunas no
  computador, conte em pé = 1 e deitada = 2 e feche cada aba no mesmo total, ex.: 16); senão sobra um vão branco
  embaixo da aba ativa. (2) Post com várias fotos lado a lado (mosaico) pode render fotos boas recortando os
  quadrantes (Gabi). (3) Reel com texto por cima: a capa ou um recorte fora do texto (Solange, Heloisa); o vídeo
  inteiro nem sempre baixa sem login. (4) Com 3 avaliações, o carrossel não anda no computador (o validador falha):
  são precisas pelo menos 4. (5) Nome comprido na faixa da Renderiza quebra a linha no computador: um ajuste fino no
  `estilo.css` resolve. (6) Avaliação de alguém com o mesmo sobrenome da dona ou de outra fotógrafa do lote fica de
  fora (Joyce Custodio, Giovanna Barbosa, Jessica Custodio na Elise).

**Demos do lote 2 (05/11/2026): as outras 16.** O Kaue pôs no Drive as 11 que faltavam do top 20 e as 5 reservas
(16 pastas). As 16 viraram demo, no mesmo formato e com a mesma oferta, uma por vez: cada uma entrou no painel em
Leads a trabalhar, ganhou o site + a página de Natal e foi para Prontas para trabalhar assim que ficou no ar. São:
Amanda Azevedo, Mariana Lima, Janaina Bertunes, Marilia Zanoni, Bia Maida, Talita Voros, Thamirys Costa, Sabrina
Matos, Arantes, Guilherme Nascimento e Michele Rabetti (top 20), e Layane Santos, Juliana Figueiredo, Andressa
Pratez, Leila Bomfim e Faro (reservas). O aviso de prazo vai até 12/11/2026, igual ao `vale_ate` do painel. A `ficha.md`
de cada pasta diz o que conferir antes de mandar.
- **Lições:** (1) Para não sobrar vão embaixo das abas, o total de colunas de cada aba (em pé = 1, deitada = 2) tem que
  ser múltiplo de 4, não só igual entre as abas: com 10, a última linha fica pela metade (a Juliana ficou com 8).
  (2) Muitos posts recentes não abrem pelo `ig-post.py` (o embed vem sem o contextJSON); a capa sai do `srcset` da
  imagem do embed, em até 1600 px. (3) Quando o Natal 2026 só existe em vídeo, quadros do vídeo (720 px) sem legenda
  escrita dão o cenário (Amanda, Marília, Thamirys, Sabrina, Arantes, Faro). Vídeo que é sequência de fotos com faixa
  preta: recortar a faixa (Leila). (4) Só entram avaliações de 5 estrelas. A Michele tem só 3 visíveis: o carrossel fica
  numa página e o validador marca "carrosséis com pontos". Os controles foram escondidos por `estilo.css`, e essa
  falha foi aceita. (5) Fotógrafo homem (Guilherme): `quem_a`/`quem_da` "o Guilherme"/"do Guilherme", o texto
  "Horários de exemplo: o Guilherme define os dele" e "(fotógrafo)" no README. (6) Dois WhatsApps (Andressa: Google
  94545-8454, bio 96446-0083): os botões da demo usam o `wa.me` da bio; o painel tem o do Google e a nota. (7) Quando o
  Google lista como "Serviço de fotografia" ou "Fotógrafo", sem estúdio (Layane, Leila), o contato mostra "Endereço" e
  o texto não fala em estúdio. (8) Lugar incerto (Faro: SP e Maringá-PR na bio; Juliana: "nosso Natal ganhou um novo
  endereço"): a página de Natal pede o local pelo WhatsApp e o alerta vai no painel.

**Pendências do lote 2:**
1. ~~Escolher as 20~~ As 25 (20 + 5 reservas) viraram demo (acima).
2. Duplas e casais (Sabrina e Tati, Arantes, Guilherme Nascimento) seguem entrando, como no lote 1. Confirmar.
3. Os valores e o prazo (`vale_ate`) das demos do lote 2.

## 8. Lote 3 (06/11/2026)

A lista está em `docs/nichos/fotografos-lote3.md` (20 + 5 reservas, com o link do Instagram de cada uma). Saiu da fila
"Para o lote 3" do lote 2, relida em 06/11: os 6 últimos posts, as avaliações do Google das 58 da fila, os domínios
óbvios, o WhatsApp, a cidade e quem atende. Mesma régua; "post na semana" conta desde 30/10.
- **O que a releitura mudou:** quem abriu o Natal nos últimos dias subiu (Rafaela Damaceno, Lus, Thays); o nome da dona
  nas avaliações, conferido a olho, somou para 5 delas; equipe ou casal nas avaliações tirou 5 de mais 4 (Lus, Roberta,
  Estúdio4S, Vitória Lopes). A Cris Ribeiro saiu (sem Natal, parada desde 19/10, telefone com DDD 41).
- **Alertas que pesam na abordagem:** Camila Photografia tem uma avaliação acusando "retenção de fotos pagas"; Amanda
  Soares tem dois celulares diferentes (Google e um post); Thays Adrianny não mostra o número no Google.
- Duplas e casais (Olivares, Lus, JB Four, Carlota Joaquina, Roberta Ale) seguem entrando, como nos lotes 1 e 2.
- **Demos do lote 3 (06/11/2026): as 25.** As 25 entraram no painel em Leads a trabalhar (com Google, avaliações,
  WhatsApp, Natal, dona e alertas nas observações) e ganharam a demo, uma por vez, na ordem do ranking; cada uma foi
  para Prontas para trabalhar ao publicar. Todas com a oferta nova (pagamento único, sem
  mensalidade, promoção de 1 semana, até o `vale_ate` do painel; o aviso da Renderiza saiu no mesmo dia) e o portfólio em abas (2 a 4 por demo; nada de abas
  em letra cursiva, que não pareciam filtro). Cada uma com um toque dela: livro de histórias (Rafaela), luz de fim de
  tarde (Lislley), "o começo de cada família" (Aimee), luz e sombra em tema escuro (Mandaluz e Ray Barbosa), cenário
  por mês (Tata's, Mayara, Lenita), e assim por diante; o que entrou e o que conferir está na `ficha.md` de cada pasta.
- **O que o lote 3 ensinou:**
  - **21 das 25 páginas do Drive vieram sem o `Instagram.html`** (só a pasta das fotos): sem bio e sem as legendas
    antigas. As fotos bastam; os textos vêm dos posts recentes, das artes delas e das avaliações (citação de cliente
    sempre com o nome de quem escreveu).
  - **Sem capa de vídeo:** a folha de escolha já tira tudo que é 9:16 (inclusive foto do Google em 9:16) e o que tem
    menos de 900 px; a revisão de rostos pega o resto. Foto com moldura branca embutida (Camila) leva `box`.
  - **A data da oferta segue o dia de Brasília:** o painel grava o `vale_ate` como o dia de Brasília + 7. Perto da
    meia-noite, a demo gerada num dia e publicada no outro ficava com data diferente; agora a publicação acerta o
    `vale_ate` do painel para a data da demo quando elas não batem.
  - **Sem Natal divulgado** (Erika Stojan, Mayara Teixeira, Lenita Sevela, Roberta Ale, Silvia Olarindo): a página de
    Natal sai como sugestão, com texto que não promete cenário; a ficha manda perguntar.
  - **WhatsApp escondido no Google** (Thays Adrianny): o link `wa.me/message/...` do Perfil abre a conta com o número
    na página pública do WhatsApp; o número foi para a demo e para o lead.

## 9. Pedido pelo Instagram: Paulo Braga (08/11/2026)

- **Quem:** @paulobraga_fotografo (Paulo H. Lacerda Braga, P'click Fotografia; nas artes, "Paulo Braga"), fotógrafo e
  videomaker em Petrolina/PE, especialista em casamentos. Pediu uma demo pelo Instagram da Renderiza. Entrou no painel
  como `paulo-braga-fotografo` e a demo saiu no mesmo dia (`/demo/paulo-braga-fotografo` e `/natal`).
- **Sem Google:** sem Perfil da Empresa, sem avaliações e sem endereço. O gerador agora aceita isso: sem `google` no
  `demo.json` e com `avaliacoes: []`, some a seção de depoimentos (e o item do menu), o mapa e a rota vão pela cidade, e
  `prova` (ex.: `["+310", "ensaios, entre externos e em estúdio"]`) troca a nota do Google na abertura, sem estrelas.
- **A página salva pode trazer fotos de outras contas:** as 39 fotos de paisagem do `Instagram_files` não eram dele (o
  segundo número do nome do arquivo termina com o id da conta; as dele terminam em `637837`, as paisagens cada uma num
  final diferente). A demo usou só os carrosséis completos dos posts dele, lidos pelo embed público (`ferramentas/ig-post.py`):
  136 fotos de casamentos, making of e pré-weddings. Conferir esse final antes de usar fotos de uma página salva.

## 10. Portfólio online, não "site" (09/11/2026, pedido do Kaue)

**Por quê:** as fotógrafas respondem que "site não funciona para o nicho", que "o Instagram basta" e que "já tive site e
não funcionou". Elas têm razão num ponto: a cliente delas não vem do Google, vem do Instagram e da indicação. Um site
fica esperando visita. O que elas fazem todo dia é outra coisa: a cliente pergunta "quanto custa?" no direct ou no
WhatsApp, e elas mandam um **PDF de valores**, prints dos destaques ou um texto copiado.

**A proposta:** o **portfólio online**, o link que ela manda nessa hora e põe na bio. Tem as galerias por ensaio, o
que é cada ensaio e o valor, a promoção do momento (Natal) e o botão do WhatsApp já com o ensaio escrito. Não
concorre com o Instagram: organiza o que o feed mistura e substitui o PDF.

**O que serviu de referência:**
- **Plataformas de portfólio para fotógrafo** (Pixieset, Format, Adobe Portfolio e, no Brasil, Alboom): a capa é uma
  grade de galerias, cada galeria tem a própria página e há uma página de valores ("Investment" lá fora).
- **O guia de valores em PDF** (o "pricing guide" ou "welcome guide", muito vendido como modelo do Canva): é o que
  elas já mandam. O portfólio faz o mesmo papel, abre num toque no WhatsApp e não fica desatualizado.
- **Catálogo do WhatsApp Business e link da bio** (tipo Linktree): mostram que ela já aceita mandar um link com
  produto e preço. O portfólio junta os dois, com a cara dela.

**Como é a demo (versão 2, 09/11, depois do retorno do Kaue: a primeira estava "fofa, não vendível", com os
quadros voltando para a mesma página, datas inventadas e o "1, 2, 3" ocupando a tela):**
`ferramentas/demo/gerar-portfolio.py` transforma a demo de site (gerar-fotografia.py) num portfólio que vende, com o
mesmo visual, a mesma faixa da Renderiza e o mesmo rastreio (cada página conta para o mesmo lead, com o nome dela):
- `index` (a vitrine): foto grande com a promessa ("Ensaios de gestante, newborn e família em Suzano") e a nota do
  Google; cada ensaio num cartão com foto, frase e **"a partir de R$"**; depois as avaliações, quem fotografa e o contato.
- **uma página de venda por ensaio** (`gestante`, `newborn`, `familia`, `natal`), no formato das páginas de campanha e
  dos guias de valores que funcionam no mercado: foto grande com a promessa, a prova e "Quero o meu ensaio"; as fotos
  num carrossel; o depoimento de quem fez aquele ensaio; o **"quando fazer"** (a urgência honesta: gestante entre a
  28ª e a 34ª semana, newborn nos primeiros 15 dias); **3 pacotes com o do meio em destaque** ("Mais escolhido", que
  aparece primeiro no celular); o que mais ela vende (o acompanhamento do 1º ano); e uma **barra fixa no celular**
  com o preço "a partir de" e o botão do WhatsApp, que já vai com o ensaio e o pacote escritos.
- O Natal virou uma dessas páginas (sem a agenda de horários inventados).
- **Valores:** ela não publica preço. A demo usa **pacotes e valores de exemplo** (decisão do Kaue, 09/11), com o selo
  "Pacotes e valores de exemplo: você coloca os seus" (some no vídeo, `?video=1`). Ficam no `demo.json`
  (`portfolio.ensaios[].pacotes`), junto com os títulos (das legendas dela) e os selos (só fatos).
- Na faixa da Renderiza: "o portfólio completo (5 páginas)" e a dica "perguntaram quanto custa o newborn? Mande o link
  da página do newborn".

**Aplicado às 21 prontas para trabalhar (09/11/2026, pedido do Kaue):** as 20 fotógrafas em "demo pronta" e "a
trabalhar", mais a Olivares. Cada uma com a personalidade dela: os títulos saem das legendas e da bio dela (ex.: "Criança
agitada não é problema. É matéria-prima", da Lus; "Quem aí também é apaixonado por produções lúdicas?", da Lenita), as
páginas seguem os ensaios que ela faz (corporativo da Camila, newborn a domicílio da Roberta, intrauterino e parto da
Faro, feminino da Ray), o "quando fazer" usa o dela quando ela publicou (26 a 32 semanas da Ray, até 10 dias da Faro,
13 a 25 dias da Roberta, as datas do Natal da Lus e da Thay) e o layout varia: tom claro ou escuro na capa do
computador e a vitrine em lista ou em grade (grade para os estúdios de cenário temático e colorido). As fotos de cada
página foram escolhidas uma a uma (folha de contato): capa em pé, sem capa de vídeo, sem arte nem foto repetida. Quem não
tem foto do Natal 2026 ficou sem página de Natal (Amanda, Faro, Lenita, Mayara, Roberta e Silvia). O texto e as fotos de
cada uma ficam no `demo.json` (`portfolio`, com `fotos: ["galeria:0-3", "pn:1"]`, `pn` = as fotos da página de Natal
antiga) e a ficha diz como gerar de novo.

**Revisão final (09/11/2026):** todas as páginas testadas no ar, no celular e no computador (links, WhatsApp, menu,
lightbox, barra fixa e quanto de cada foto aparece). Corrigido: o logo e os links entre ensaios nas páginas de ensaio
(o runtime antigo calculava a raiz da demo tirando só "/natal" do endereço; agora é sempre `/demo/<pasta>`). E as fotos
deixaram de cortar: o carrossel mostra cada foto inteira na proporção dela (altura fixa, como os portfólios
profissionais), a capa deitada aparece inteira (no celular, a foto em cima e o texto embaixo), os cartões usam a
primeira foto em pé do ensaio, e a vitrine em lista virou duas colunas no computador. Novidades: setas nos carrosséis
para quem usa mouse, o "a partir de R$" na capa de cada ensaio e, no celular, a vitrine em cartões grandes com o texto
sobre a foto.

**Versão 3 (09/11/2026), depois do retorno sobre a Mandaluz** ("cortado no PC, moça não grávida na área de
gestantes, depoimento de gestante nos retratos, capa feia, poluída, fotos gigantescas"). O modelo foi refeito (capa
sem chips, foto inteira ao lado do texto no computador e em cima do texto no celular, vitrine em blocos, mosaico de
fotos inteiras, sem selos nem faixa preta) e as 21 foram curadas de novo, foto a foto.

**Regras do portfólio (para não repetir):**
1. **Uma página, um tipo de ensaio, só com fotos dele.** Gestante só com a barriga aparecendo. Página mista só quando
   o nome diz (ex.: "Gestante e newborn", com o pacote dos dois juntos).
2. **Curadoria na folha de contato grande** (`ferramentas/demo/folha-de-contato.py`, miniatura de 200 px ou mais),
   nunca na miniatura pequena. De 5 a 9 fotos por página (a capa e pelo menos 4 no mosaico). Sem foto repetida (a
   página de Natal antiga repete fotos do site em outro tamanho: usar a maior), sem capa de vídeo, arte, silhueta ou
   foto em que não dá para ver o que é.
3. **Natal só com 5 fotos ou mais do Natal 2026.** Menos que isso, elas entram em infantil ou família.
4. **Depoimento: ler o texto inteiro.** Ele fala daquele ensaio ou da fotógrafa em geral; nunca de outro tipo de
   ensaio. Sem depoimento que sirva, a página fica sem.
5. **A capa da vitrine é a foto mais bonita** e com a cara do estúdio; a de cada página, a melhor daquele ensaio.
6. **Layout sem sobreposição e sem foto gigante.** Cada foto num quadro da proporção dela (`--a`); a faixa branca de
   foto posta num quadrado é aparada pelo gerador. Nunca `aspect-ratio` com `align-self: stretch` (a foto invade a
   coluna do lado).
7. **Texto só com o que é dela** (legendas, bio, avaliações) e fatos; "quando fazer" só em gestante, newborn, mês a
   mês, smash e Natal.
8. **Conferir antes de publicar:** `ferramentas/demo/conferir-portfolio.cjs` (texto sobre foto, texto estourando,
   foto ampliada, rolagem lateral, nas larguras 390, 1280 e 1440) e OLHAR a vitrine, as capas e os mosaicos de todas
   as páginas; depois do deploy, os links no ar (cada bloco e cada menu abre a página certa).

**Primeira demo:** Estúdio Olivares (`/demo/olivares-fotografia`), escolhida entre as 21 que ainda não foram
trabalhadas por ter mais material: 29 fotos em 3 galerias, mais o Natal, 5,0 com 49 avaliações e 9,4 mil seguidores.

**Versão 4, fase 1 (13/11/2026): a Olivares refeita do zero, esperando a aprovação do Kaue.** As versões 1 a 3 tiravam as
fotos de dentro da página antiga (já cortadas e comprimidas) e ficaram feias. O `gerar-portfolio.py` foi reescrito: lê os
ORIGINAIS de uma pasta (a grade dela salva no Drive, os carrosséis do embed público e o Google), nunca amplia nem corta
(a página mostra a foto inteira, em linhas justificadas), grava 1400 px na galeria e 1920 px na abertura (JPEG
progressivo, qualidade 82) e, sem os originais, reaproveita as fotos que ele mesmo já tratou. Desenho novo: vitrine com
a frase dela, tira de fotos, lista de ensaios com o "a partir de" e filtro por ensaio; uma página por ensaio. A faixa, a
oferta e o rastreio continuam os mesmos e nenhum texto fala em "site". A conferência (`conferir-portfolio.cjs`) também foi
reescrita: rola a página, clica nas abas, na tela cheia, na faixa e na pílula e acusa foto cortada, ampliada e a palavra
"site". Só a Olivares está nesse modelo; os outros 19 leads seguem na versão 3 até a aprovação. O que este lead ensinou:
- **As pastas dos lotes de fotógrafas estão na lixeira do Drive do Kaue.** O conector acha com `trashed = true` (lote 3:
  "lotes-leads-12-05-11-26"); a listagem pública da pasta vem vazia, mas o download de cada arquivo pelo id funciona.
- **Como provar que a página salva é o perfil dela:** o arquivo da foto de perfil que o embed público devolve
  (`profile_pic_url`) está dentro da pasta salva, com o mesmo nome. O final do segundo número (seção 9) só é constante
  em quem posta sempre do mesmo jeito: na Olivares vale nos posts de out/nov 2026 e não nos antigos da grade.
- **Ler a avaliação inteira antes de pôr numa página:** na versão 3, o depoimento da página de família falava de gestação.
- **Peso no repositório:** com as fotos em tamanho de portfólio, a pasta da Olivares tem 26 MB de HTML (antes, 3 MB).
  No ar a página continua leve (as fotos saem da página no build). Decidir antes de aplicar aos outros 19.

**Versão 4, fase 2 (14/11/2026): aprovada pelo Kaue na Olivares e aplicada aos 20 leads.** Todos os portfólios de
fotógrafa estão no modelo v4, publicados, com a promoção até 21/11 (`renderiza.valido_ate` e `demos.vale_ate`):
Olivares, Mandaluz, Lus, Silvia Olarindo, Amanda Soares, Lenita Sevela, Mayara Teixeira, Pamela Demezio, Reviver,
Studio Flaternize, Thays Adrianny, Vanessa Luciana, Drika Freitas, Roberta Ale, Camila, Carlota Joaquina, Tata's Photo
Art, Ray Barbosa (tema escuro), Mariana Lima e Thayuane Rosa. **Fotógrafa nova já nasce neste formato.**

**Como fazer um portfólio v4 (o passo a passo que funcionou):**
1. **Originais**, cada fonte numa pasta própria fora do git (Python sempre com `-I`): a grade salva no Drive (baixar
   cada arquivo pelo id), os carrosséis pelo embed público (`ferramentas/ig-post.py`) e as fotos do Perfil no Google
   (`ferramentas/fotos-google.mjs`). Fotos brutas nunca vão para o git.
2. **Folha de contato grande** (320 px, 6 colunas) de TUDO, sem as 9:16 (capa de vídeo) e as menores que 600 px, sem
   repetidas (a mesma foto em dois tamanhos fica a maior). Ler as avaliações inteiras e as legendas.
3. **Escolher foto por foto** e escrever o `demo.json` (`portfolio`, versão 4; o formato está no topo do
   `gerar-portfolio.py`): a ordem das fotos é a ordem da página, `capa` diz quantas abrem a página e `vitrine` quais
   entram no filtro da vitrine. A primeira foto do primeiro ensaio é a abertura da vitrine: **em pé**, senão no celular
   ela fica enorme e cortada pelo quadro (Tata's).
4. `python3 ferramentas/demo/gerar-portfolio.py demos/<pasta> <pasta dos originais>`.
5. `node ferramentas/demo/conferir-portfolio.cjs <saída> <pasta>` (390, 1280 e 1440; cliques, foto cortada ou ampliada,
   texto estourando, "site") e **olhar** as páginas inteiras e a primeira tela de cada uma.
6. **Conferir a folha das escolhidas** (cada foto com o alt dela, na ordem): foi assim que apareceram índices trocados
   (fotos de mês a mês na página de Natal da Mayara, um print de WhatsApp na da Thays, legendas trocadas na Flaternize).
7. Ficha (`ficha.md`), commit, merge da `origin/main`, push do branch e da `main`, e o prazo no painel.

**Regras novas (somam às de cima):**
- **Pastas do Drive na lixeira:** o conector ignora o `pageToken`; para pastas com mais de 100 arquivos, listar com
  `orderBy` `modifiedTime asc` e `desc` e juntar. A grade salva também tem `.webp` (não só `.jpg`).
- **Post sem `contextJSON` no embed:** a capa sai do `srcset` da `EmbeddedMediaImage` (Silvia, Amanda).
- **Fora sempre:** nu, nu implícito, lingerie, sutiã ou body transparente (mesmo em gestante; Ray e Thayuane), artes
  com texto, prints, mosaicos e colagens com borda branca (Camila), fotos com @ grande, capas de vídeo, detalhes que
  não se entendem (boca, pés) e fotos de outras contas.
- **Natal:** a página abre com o cenário de 2026 (os posts de novembro) e pode seguir com Natais anteriores. Com
  menos de 5 fotos de Natal, vira "Natal e família" (Tata's).
- **Sem foto pública da fotógrafa**, o "quem fotografa" mostra o estúdio ou um cenário dela (Carlota, Tata's) e a
  ficha pede para confirmar.
- **"Quando fazer" só com o que ela publicou** (26 a 32 semanas da Ray, 13 a 25 dias da Roberta, vagas do Natal da
  Thay); sem isso, a página não tem esse bloco.
- **Ensaio a domicílio** (Roberta): `onde` no ensaio ou no `portfolio` e `contato.rota: false` (sem "Como chegar").
- **Tema escuro** sai sozinho quando o fundo do estúdio é escuro (Ray).
- **Peso:** os 20 portfólios somam cerca de 440 MB de HTML no repositório (as fotos ficam dentro do HTML; no ar saem
  para `/demo/<pasta>/f/`). Se o repositório pesar, a saída é guardar só as fotos tratadas fora do HTML.
