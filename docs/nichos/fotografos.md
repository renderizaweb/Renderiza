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

**Pendências do lote 2:**
1. ~~Escolher as 20~~ As 9 primeiras viraram demo (acima); faltam as outras 11 da lista, se o Kaue quiser.
2. Duplas e casais (Sabrina e Tati, Arantes, Guilherme Nascimento) seguem entrando, como no lote 1. Confirmar.
3. Os valores e o prazo (`vale_ate`) das demos do lote 2.
