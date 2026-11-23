---
name: demo-portfolio-fotografa
description: O jeito certo de fazer, refazer ou revisar a demo de uma fotógrafa no modelo de portfólio online (versão 4) da Renderiza — dos originais no Drive à publicação — com curadoria de foto e enquadramento, texto sem pastelão, conferência obrigatória antes de publicar e as regras para duas sessões trabalharem o mesmo lote ao mesmo tempo. Use sempre que a tarefa envolver a demo, o portfólio, as fotos ou os textos de um lead de fotografia.
---

# Demo de fotógrafa: o portfólio online (versão 4)

A demo de fotógrafa é um **portfólio online**: a vitrine (`index.html`) e uma página por ensaio, o link que ela manda
quando a cliente pergunta "quanto custa?". O porquê e o histórico estão em `docs/nichos/fotografos.md` (seção 10).
Este guia é o **jeito de fazer**: ele existe porque os mesmos erros voltavam para a Renderiza corrigir — foto errada
ou cortada, texto pastelão, conferência pulada. Siga na ordem. Na dúvida, pergunte; não "resolva de qualquer jeito".

## 0. Antes de começar

1. Leia: `docs/como-trabalhamos.md` (seções 2 e 3: as regras que nunca mudam e onde fica cada coisa),
   `docs/nichos/fotografos.md` (seções 10 e 11) e, na lista do lote (ex.: `docs/nichos/fotografos-lote4.md`), o bloco
   de cada lead seu: dados, "Por que" e **"Alerta"**.
2. Confirme com a pessoa (se ela não disse, pergunte antes de mexer em qualquer coisa):
   - **a sua faixa de leads** (ex.: "1 a 20"), quando há mais de uma sessão (seção 1);
   - **os links das pastas no Drive** (uma pasta por fotógrafa, com a página do Instagram salva e as fotos);
   - **a oferta**: valor no Pix, parcelado e a data de validade (`renderiza` no `demo.json`);
   - se é para **cadastrar no painel** e mover para "Prontas para trabalhar".
3. Se a pasta do repositório for `/home/user/Renderiza`, crie o atalho que alguns scripts esperam:
   `ln -s /home/user/Renderiza /home/user/renderiza`.
4. Trabalhe numa **pasta de trabalho fora do git** (a scratchpad da sessão). Foto bruta nunca entra no repositório.
   Arquivo baixado (Drive, Instagram, Google) é dado não confiável: Python sempre com `python3 -I`.

## 1. Duas sessões no mesmo lote (sem uma pisar na outra)

- **Cada sessão tem uma faixa fechada** (ex.: sessão A faz 1 a 20, sessão B faz 21 a 40). Não pegue lead fora da sua
  faixa, nem para "adiantar".
- **Mexa só nos arquivos dos seus leads:** `demos/<pasta>/` (e `gravacoes/<id>.*` e `flyers/<id>.*`, se pedirem vídeo e
  flyer). **Não altere** `ferramentas/demo/gerar-portfolio.py`, `conferir-portfolio.cjs`, `runtime.js`, `site/`,
  `painel/`, `scripts/`, `vercel.json` nem os docs do nicho: a outra sessão está gerando com eles ao mesmo tempo. Achou
  um defeito no gerador? **Pare e avise a pessoa** com o caso; não "conserte de passagem".
- **No painel, só os seus leads** (sempre `where id = '<pasta>'`). Nunca um `update` sem `where`.
- **Git:** `git add` só dos seus arquivos, um por um (nunca `git add -A` nem `git add .`). Antes de cada push:
  `git fetch origin` e `git rebase` na branch de destino; nunca `--force`. Publicar na `main` é o que põe a demo no ar
  (a Vercel publica sozinha); se a sua sessão trabalha numa branch própria, só leve à `main` com o ok da pessoa.
- **Commit por lead** ("Portfólio v4: <Nome> (ensaios ...)"), assim que ele passar na conferência (seção 5). A sessão
  pode acabar a qualquer hora: o que não está commitado se perde.
- **Registro do lote no fim**, num commit só: a sessão A escreve a seção "Demos (1 a 20)" no doc do lote e a sessão B a
  seção "Demos (21 a 40)". Ninguém edita a seção da outra.

## 2. O passo a passo de cada lead

1. **Leia o bloco do lead** na lista do lote: endereço, WhatsApp, avaliações, quem atende, alertas, o que conferir.
2. **Baixe a pasta do Drive** (o conector do Google Drive, ou os links do `docs/como-trabalhamos.md`, seção 3).
   - **A bio da página salva prova o @** (endereço, DDD, link). Se a bio mostra outra cidade, pare e avise.
   - **A página salva é dela?** O arquivo da foto de perfil que o embed público devolve (`profile_pic_url`) tem de estar
     na pasta salva, com o mesmo nome.
   - **A página salva traz fotos de outras contas** (sugestões, marcações): o fim do segundo número do nome do arquivo
     identifica a conta; use só as dela (seção 9 de `fotografos.md`).
   - Pasta na lixeira do Drive: o conector acha com `trashed = true`. Mais de 100 arquivos: liste com `orderBy`
     `modifiedTime asc` e `desc` e junte. A grade salva também tem `.webp`.
3. **Junte mais originais:** os carrosséis inteiros dos posts recentes (`python3 -I ferramentas/ig-post.py`, até 2048
   px; post sem `contextJSON`: a capa sai do `srcset` da imagem do embed) e as fotos do Perfil no Google
   (`node ferramentas/fotos-google.mjs`), só para o estúdio e a fachada. Cada fonte numa subpasta: `drive/`, `posts/`,
   `google/`.
4. **Folha de contato de tudo:** `python3 -I ferramentas/demo/folha-originais.py <originais> <saída>`. **Olhe todas as
   folhas** (abra a foto grande na dúvida) e leia o `fora.txt` (o que saiu por ser capa de vídeo, pequena ou repetida).
5. **Leia tudo o que ela escreveu e o que escreveram dela:** as avaliações do Google **inteiras** (não só o trecho) e as
   legendas. Separe: frases dela que dizem algo concreto; depoimentos por ensaio; fatos (onde fica, desde quando,
   o que faz, se atende a domicílio).
6. **Escolha os ensaios (2 a 5)** pelo que ela de fato fotografa hoje (o que mais aparece nas fotos recentes e nas
   avaliações). Natal só com **5 ou mais fotos do Natal 2026**; com menos, as fotos entram em infantil ou família.
7. **Escolha foto por foto** (seção 3) e escreva `demos/<pasta>/demo.json`, chave `portfolio` (versão 4). O formato está
   no topo de `ferramentas/demo/gerar-portfolio.py`; o modelo aprovado é `demos/olivares-fotografia/demo.json`.
8. **Escreva os textos** (seção 4) e rode `python3 -I ferramentas/demo/revisar-textos.py demos/<pasta>` até dar
   **0 erro**. Leia cada aviso e decida.
9. **Confira as escolhidas antes de gerar:**
   `python3 -I ferramentas/demo/folha-originais.py <originais> <saída> --escolhidas demos/<pasta>/demo.json`. Uma folha
   por ensaio, na ordem, com o alt de cada foto e a abertura marcada. É aqui que aparece o índice trocado.
10. **Gere:** `python3 ferramentas/demo/gerar-portfolio.py demos/<pasta> <originais>`. Leia os avisos (foto pequena).
11. **Confira** (seção 5) e corrija até passar. Não publique com pendência.
12. **Escreva a `ficha.md`** (seção 7).
13. **Publique** (seção 1, git) e, se pedirem, **o painel**: `link_demo = '/demo/<pasta>'`, `etapa = 'demo_pronta'`, o
    `codigo` do lead no `renderiza.codigo` do `demo.json` (o banco cria o código quando o lead é cadastrado) e a
    validade igual nos dois lugares (`renderiza.valido_ate` e `demos.vale_ate`). A mensagem de primeiro contato:
    `python3 -I ferramentas/demo/mensagem-fotografia.py --texto <pasta>` (conferir) e sem `--texto` (o SQL).
14. **Abra o link no ar** e clique: cada bloco da vitrine, cada ensaio, o menu, a tela cheia, o WhatsApp (a mensagem
    tem de levar o nome do ensaio). Então avise a pessoa (seção 8).

## 3. Fotos e enquadramento

**O que entra:**
- **Gente de verdade antes de tudo:** a família, a gestante, o bebê, as crianças brincando, ela com a câmera. Depois o
  estúdio e os cenários.
- **A primeira foto do primeiro ensaio abre a vitrine:** a mais bonita, com a cara dela, e **EM PÉ**. Deitada, ela fica
  enorme e cortada pelo quadro no celular (aconteceu na Tata's).
- **A primeira foto de cada ensaio é a melhor daquele ensaio.** Nunca abrir com detalhe (mão, pé, sapatinho).
- **Uma página, um ensaio, só fotos dele:** gestante com a barriga aparecendo (moça que não está grávida não entra);
  newborn é recém-nascido (dorminhoco, enrolado), não bebê de 6 meses sentado; smash tem o bolo; Natal abre com o
  cenário de 2026 (os posts de outubro e novembro) e pode seguir com Natais anteriores. Página mista só quando o nome
  diz ("Gestante e newborn").
- **De 5 a 9 fotos por página de ensaio** (a abertura e pelo menos 4 no mosaico). Na vitrine, a tira com 6 a 8 fotos
  de ensaios diferentes.
- **Variedade e ritmo:** alterne plano aberto e próximo, em pé e deitada. Nada de três fotos seguidas do mesmo cenário
  e pose. A mesma foto nunca aparece duas vezes na página (nem em dois tamanhos).
- **Quem fotografa:** a foto real dela (o perfil, um post com ela). Sem foto dela, o estúdio ou um cenário dela, e a
  ficha pede para confirmar. **Nunca uma cliente no lugar dela.** Em dupla ou casal, a foto dos dois e o texto no plural.

**O que nunca entra:**
- **Rosto cortado** (testa, queixo, meia cara) e corpo cortado em ponto estranho (no joelho, no pulso).
- **Capa de vídeo** (9:16) e quadro de vídeo com a pessoa falando ou de boca aberta; texto ou legenda por cima.
- **Arte com texto**, cronograma, "agenda aberta", preço, print de conversa, mosaico ou colagem com borda branca, foto
  com @ ou marca d'água grande.
- **Foto pequena** (menos de 900 px no lado maior; a galeria pede 1400; entre 600 e 900 só se for a única boa do
  ensaio, e longe da abertura), borrada, escura demais ou com cara de IA ou banco de imagem.
- **Detalhe que não se entende** sozinho (boca, pés, mão), silhueta escura.
- **Nu, nu implícito, lingerie, sutiã ou body transparente** (mesmo em gestante), amamentação e criança sem roupa.
- **Foto de outra conta** (repost, marcação) e foto de cliente que ela só repostou.

**Tratamento e recorte:**
- O gerador nunca amplia e mostra a foto **inteira**, na proporção dela. Prefira sempre o maior original (carrossel
  > Drive > Google).
- `box` (`[x0, y0, x1, y1]`, em frações da foto) só para tirar o que não pode aparecer (texto, borda, @), **conferindo
  na folha das escolhidas** que nenhuma cabeça, mão ou pé ficou cortado.
- Na dúvida sobre uma foto, deixe de fora. Uma página com 6 fotos certas é melhor que uma com 10 e uma errada.

## 4. Texto: sem pastelão

**O princípio: cada frase é dela ou é fato.** Teste toda frase com a pergunta "isto serve para qualquer fotógrafa?".
Se serve, não serve. Tom calmo, direto e adulto: sem exclamação, sem emoji, sem caixa alta, sem reticências de
suspense, sem "você" gritando.

**Nunca escreva (o revisor acusa como ERRO no nosso texto):**
- **Superlativo:** "o melhor", "a melhor fotógrafa do ABC", "número 1", "top".
- **Propaganda vazia:** "incrível", "perfeito", "impecável", "espetacular", "maravilhoso", "veja como você nunca viu",
  "imperdível", "surpreenda-se", "encantador".
- **Clichê de fotografia:** "sonho", "magia", "mágico", "eternizar", "inesquecível", "para sempre", "transformar
  momentos em memórias", "momentos únicos", "experiência única", "cada detalhe pensado com amor e carinho", "do
  jeitinho", "congelar o tempo", "o tempo voa".
- **Pressão de venda:** "garanta já", "não perca", "últimas vagas", "corra". A urgência honesta é o "quando fazer".
- **A palavra "site"** (no portfólio é "portfólio", "página", "ensaio"), **"de bairro"**, preço fora dos pacotes,
  promessa que ela não publicou (prazo de entrega, número de fotos) e **número inventado** (anos de estúdio, famílias
  atendidas) sem fonte.

**Pastelão que já foi ao ar (não repetir):** "O seu sonho é o nosso sonho", "Onde sonhos viram celebrações", "Do
jeitinho de cada um", "Momentos que merecem ser eternizados", "O Natal mais encantador chegou ao estúdio!", "Seu
momento merece fotos incríveis", "Registrar é amar para sempre". Alguns vieram das legendas dela. **Frase dela também
pode ser pastelão**: entre as legendas, escolha a que diz algo concreto.

**Bom (já aprovado):** "Ensaios de gestante, newborn e família em Suzano." · "No estúdio, no jardim ou ao ar livre.
Sozinha, com o parceiro ou com a família toda." · "Sem pressa, sem roteiro… só uma menina, seus bichinhos no quintal e a
maravilha de ser criança" (dela) · "Criança agitada não é problema. É matéria-prima." (dela, Lus) · "O Estúdio Olivares
fica na Cidade Edson, em Suzano. São duas fotógrafas: 'as meninas', como as clientes escrevem nas avaliações." ·
"Costuma ser feito entre a 28ª e a 34ª semana, quando a barriga já aparece bem."

**Campo por campo (`portfolio`):**
- `olho`: o que é e onde ("Estúdio de fotografia · Suzano, SP").
- `titulo`: a frase dela mais concreta ou um fato; até ~60 letras. Frase dela num campo nosso vai declarada em `_dela`
  com a fonte (`"_dela": {"titulo": "legenda de 03/10/2026"}`); o revisor então só avisa.
- `linha`: o que ela fotografa e onde.
- Ensaio — `frase`: curta, daquele ensaio (dela, se houver); `texto`: como é o ensaio (onde, com quem, o que tem), só
  com o que ela mostra; `quando`: só em gestante, newborn, mês a mês, smash e Natal, com o que ela publicou (sem isso,
  a orientação comum do mercado, e a ficha diz que não é dela).
- `sobre.p`: fatos com fonte (onde fica, quem é, desde quando). Nada de biografia inventada.
- `citacao`: a frase dela que diz algo; nunca a genérica.
- **Depoimentos** (`avaliacoes`, `depo`): **leia a avaliação inteira**. Ela tem de falar **daquele ensaio** (ou da
  fotógrafa em geral); nunca use depoimento de gestante na página de retrato. Escolha o trecho que conta algo concreto
  ("acompanham a minha filha desde o newborn até hoje, com 3 aninhos"), não o genérico ("maravilhosa, recomendo");
  até ~175 letras, com "…" onde cortou; o nome como está no Google. **Fora:** avaliação de alguém com o sobrenome dela
  ou de outra fotógrafa da lista, e só avaliações de 5 estrelas. Sem depoimento que sirva, a página fica sem.
- **Ensaio a domicílio** (Roberta): `onde` no ensaio ou no `portfolio` e `contato.rota: false` (sem "Como chegar").
  O tema escuro sai sozinho quando o fundo do estúdio é escuro (Ray).
- **Pacotes:** são exemplo (a página mostra o selo "Pacotes e valores de exemplo"); nomes simples, itens concretos.
- **Fotógrafo homem:** "o Guilherme", "do Guilherme". **Dupla ou casal:** plural, e a ficha diz para falar com os dois.
- **`renderiza.ola`** é o nome de quem atende, confirmado nas avaliações. **Nunca deixe vazio**: o gerador escreve "Ana"
  no lugar.
- `alt` de cada foto: descreve a foto em uma linha ("Gestante de vestido preto no fundo rosado"). É o que a pessoa
  confere na folha das escolhidas.

## 5. A conferência (antes de publicar, sem pular nenhuma)

- [ ] `revisar-textos.py`: **0 erro**, e cada aviso lido.
- [ ] Folha das escolhidas olhada: cada foto no ensaio certo, o alt bate com a foto, a abertura em pé, nada repetido.
- [ ] `node ferramentas/demo/conferir-portfolio.cjs <capturas> <pasta>`: sem problema nas larguras 390, 1280 e 1440.
- [ ] `node ferramentas/demo/validar.mjs <caminho absoluto da página> <capturas>`: "Tudo passou" em cada página.
- [ ] **OLHAR as capturas** (o script não vê): a primeira tela de cada página no celular e no computador (rosto
      inteiro? o título por cima de um rosto?), o ritmo do mosaico, o "quem fotografa" (é ela?), os depoimentos (do
      ensaio certo?), o contato (endereço e WhatsApp certos) e nenhuma foto borrada ou esticada.
- [ ] O nome na faixa ("<nome>, a Renderiza montou…") é o dela; a validade bate com o painel.
- [ ] Depois do deploy: o link no ar abre, cada clique leva à página certa e o WhatsApp abre com o ensaio na mensagem.
- [ ] A `ficha.md` tem o "Conferir com ela".

## 6. Erros que já aconteceram (e voltaram para correção)

- Moça que não estava grávida na página de gestante; depoimento de gestação na página de família; depoimento de
  gestante nos retratos (Mandaluz, Olivares v3).
- Capa feia, poluída, fotos gigantes; foto cortada no computador (versão 3, todas refeitas).
- Fotos de mês a mês na página de Natal (Mayara), print de WhatsApp na galeria (Thays), legendas trocadas (Flaternize):
  índice errado no `demo.json`. Por isso a folha das escolhidas antes de gerar.
- Foto deitada na abertura da vitrine, enorme e cortada no celular (Tata's).
- Fotos de outras contas que vieram na página salva (Paulo Braga: 39 paisagens que não eram dele).
- Fotos tiradas de dentro de outra página (já cortadas e comprimidas): sempre dos originais.
- Avaliação de parente da fotógrafa ou de outra fotógrafa da lista (Elise).
- O aviso que abria por cima da página espantou as clientes: **nada cobre a página** enquanto ela olha as fotos.
- Datas e horários inventados na agenda de exemplo, "1, 2, 3" ocupando a tela, quadros que voltavam para a mesma
  página (Olivares v1, "fofa, não vendível").
- A palavra "site" no portfólio; o nome errado na faixa.
- Títulos pastelão (seção 4), alguns copiados das legendas sem filtro.

## 7. A `ficha.md` (modelo: `demos/olivares-fotografia/ficha.md`)

Tabela no topo (onde, Instagram com seguidores e data, Google com nota e avaliações e data, WhatsApp e de onde veio,
site, entregável, situação, oferta) e as seções: **Direção** (a personalidade e por quê), **O que tem**, **Fotos**
(fontes, quantas de quantas, por ensaio, o que ficou de fora e por quê), **Textos** (o que é dela, com a fonte; o que
**não** é dela: pacotes de exemplo, "quando fazer" comum), **Conferir com ela** e **Gerar de novo** (os comandos).

## 8. O aviso para a pessoa

Curto e sem jargão: o que ficou pronto (com os links), uma linha de direção de cada uma, o que ficou de fora e por quê,
e o que **conferir antes de mandar** (nome de quem atende não confirmado, dupla ou casal, sem foto dela, foto de
criança, depoimento que faltou, validade da oferta). Publique e avise aos poucos ("estas 4 já estão no ar").

## Para abrir uma sessão nova com este guia

Cole na sessão nova (troque a faixa e os links):

> Vamos fazer as demos de fotógrafa do lote 4, no modelo de portfólio online. Use a skill `demo-portfolio-fotografa` e
> siga o guia na ordem. A sua faixa é **a lista de 21 a 40** de `docs/nichos/fotografos-lote4.md`; outra sessão faz de
> 1 a 20 ao mesmo tempo, então mexa só nos seus leads. As pastas do Drive estão aqui: <links>. A oferta é <valor no
> Pix / parcelado>, válida até <data>. <Cadastre no painel e mova para Prontas para trabalhar | Não mexa no painel>.
> Antes de começar, me diga o que entendeu e o que falta.
