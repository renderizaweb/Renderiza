# Contexto para continuar (leia antes de qualquer coisa)

Este arquivo existe para que qualquer sessão nova do Claude continue o trabalho das demos sem perder
nada do que já foi combinado com o Kaue. Leia inteiro, depois o `README.md` e a `ficha.md` da ótica
da vez.

## Quem, o quê e como falar

- A Renderiza faz **demos de site para óticas de bairro** e oferece o site pronto ao dono, com um vídeo
  curto mostrando a demo.
- Responder sempre em **português**, direto e curto.
- **Não inventar nada.** O que não deu para confirmar vira "não confirmei". Citar a fonte.
- Dono da ótica: só pelos dados públicos da empresa (quadro de sócios da Receita). Nada de CPF,
  endereço ou telefone pessoal.
- O andamento comercial (enviada, respondeu, fechou) fica no **painel da Renderiza**, não aqui.

## Como tem que ser uma demo de site

- **Carrossel com muitas imagens reais**: donos, equipe, clientes, crianças, produto, fachada.
  Arte pronta e imagem de IA só em último caso. Muita imagem é o que vende.
- **Rostos**: escolher as fotos em que cada pessoa aparece melhor. É o que agrada o dono.
- **Vídeo vira foto**: usar a capa ou um quadro nítido e bem enquadrado. Vídeo no site só se for leve.
- **Site leve**: nada de efeito demais nem muitos vídeos.
- **História**: contar quando a ótica tem uma (anos de casa, família, trajetória). Se não tem, não
  encher linguiça.
- **Avaliações do Google sempre**, com depoimentos reais (nome + trecho). A nota aparece só se for
  **5,0** (decisão do Kaue, 03/10/2026); com 4,9 ou menos, ficam as estrelas e o número de avaliações.
- **Depoimentos do mesmo tamanho**: texto longo vira um trecho escolhido da avaliação (até ~175
  caracteres, com "…" onde cortou), para os cards não ficarem com altura diferente nem espaço em branco.
- **Nunca cortar rosto**: se o vídeo tem título por cima da cabeça, não usar o quadro (recortar abaixo
  do texto corta a testa).
- **Foto real antes de post recente**: tem ótica que passou a postar só imagem de IA ou montagem (no lote 3:
  Ranulpho, Universe e Niterói Prime em 2026). Aí a demo usa as fotos reais mais antigas do Drive e a ficha
  avisa. Selfie com o letreiro da loja ao contrário é espelhada de volta (Personnalité).
- Arquivo único `index.html` com as fotos dentro, que abre direto no navegador.
- Referência de acabamento: as demos prontas em `demos/otica-catglass`, `demos/oticas-perez` e
  `demos/franco-oticas` (as mais recentes).

## Lote 1 (aprovado pelo Kaue em 29/09/2026): demos prontas

Feitas uma por vez, nesta ordem. A direção específica de cada uma está na `ficha.md` da pasta.

| # | Pasta | Nota da triagem | Resumo do que ele disse |
|---|---|---|---|
| 1 | `otica-sales` | 9,5 | Rostos bonitos, donos como modelos, muita foto real. Muita imagem = sucesso. |
| 2 | `otica-der` | 9 | Uma das melhores: equipe, donos, produto, crianças, tudo recente e nítido. Demo feita com as fotos de 2018 do zip (ver ficha). |
| 3 | `oticas-laodiceia` | 8,5 | Muita arte misturada: garimpar só fotos reais de pessoas e donos. |
| 5 | `amitie-centro-optico` | 8 | Já tem site simples (Google): fazer um bem mais bonito, contando a história. |
| 6 | `atelie-optico-jabaquara` | "muito bom" | Fora da curva, muito estilo: o site tem que ser uma arte em si. Desde 1951. |
| 7 | `otica-lider-guarulhos` | 7 | Casal de donos, clientes, fachada, crianças. Muito vídeo: transformar em foto. |
| 8 | `mogi-otica` | 6 a 7 | Pouca foto real, muita arte de IA. Garimpar. |
| 9 | `otica-interativa` | 6 | O bom está nos vídeos: usar capas ou quadros. |

Descartadas: Embu Ótica (já negociou, não quis), Estância, Suzan, Ótica e Relojoaria Santo Amaro.
Removida: `iadala-otica` (4ª da fila): demo excluída a pedido da cliente em 29/09/2026. Não refazer nem reenviar.

As 9 da fila entraram no painel (Supabase) como **Leads a trabalhar**, com id igual ao nome da pasta
(`otica-sales`…), próxima ação "Criar demo (Nª da fila)" e as observações do Kaue.

## Quando o cliente aprova (demo vira site)

1. Na pasta da demo, criar `site.json` (domínio, nome, cor, dados da empresa para o Google). Modelo:
   `demos/lu-elegante-modas/site.json`.
2. `npm run site -- <pasta>` gera `../sites/<domínio>/`: fotos em arquivos, endereço oficial, prévia para
   WhatsApp, ícone, dados da empresa, robots.txt e sitemap.xml liberando o Google.
3. Tudo fica nas contas do **cliente** (decisão do Kaue, 01/10/2026): Gmail, GitHub, Vercel e domínio no
   Registro.br no CPF/CNPJ dele. A Renderiza só faz o site; nada do cliente fica hospedado ou guardado na
   Renderiza. O Kaue entrega os acessos ao cliente, que pode passar a qualquer dev no futuro.
4. Para eu enviar o site: o cliente cria o repositório vazio, convida o GitHub do Kaue como colaborador
   e instala o app do Claude só nesse repositório (acesso temporário, removido depois). Plano B: o Kaue
   sobe o .zip pela tela do GitHub (Add file > Upload files).
5. Vercel: importar o repositório (preset Other, sem build), adicionar o domínio e criar no Registro.br os
   DNS que a Vercel mostrar. Atenção: a Vercel gratuita (Hobby) proíbe uso comercial, mesmo na conta do
   cliente; se der problema, o mesmo repositório publica no Cloudflare Pages sem mudar nada.

## Fora das óticas

- `lu-elegante-modas` (01/10/2026): loja de roupas com salão da Luciene Eunice, na Vila São Pedro (SBC).
  Pedido direto do Kaue, sem triagem. Mesmo padrão das demos, com história da dona e seção de salão.
  Sem lead no painel até o Kaue pedir.
- `ms-odontologia` (01/10/2026): Clínica MS Odontologia, Dr. Marcos Silva, Itapevi. Cliente de antes do
  painel; a demo já tinha sido aprovada e foi refeita com o ensaio novo e o Oscar Beauty 2026.

## Lote 2 (aprovado pelo Kaue em 29/09/2026): demos prontas (Dutra parada)

Saiu da varredura de 29/09/2026 (ver "Busca de novas óticas"). O Kaue vai mandar as fotos de cada uma
num lote de imagens no Drive, como no lote 1. Direção e alertas na `ficha.md` de cada pasta.

| # | Pasta | O que o Kaue disse |
|---|---|---|
| 1 | `otica-nina` | Aprovada, bom potencial. Muitas fotos e modelos da própria Nina que dá para usar, e as avaliações do Google para aproveitar. Aproveitar bem as imagens do Instagram, que o Kaue vai mandar no lote de imagens (Drive). |
| 2 | `boutique-dos-oculos` | Uma das óticas mais incríveis em fotos reais: nada de propaganda de marca, só clientes reais usando os óculos, felizes, dezenas e dezenas. O Instagram é uma galeria de clientes. A demo tem que ser espetacular, fora da curva, pensada como uma galeria de imagens, sem pensar duas vezes. Somar avaliações e a história. |
| 3 | `otica-haramaki` | Bom potencial, mas complexo: muito vídeo e pouca imagem (há algumas fotos de modelos para reaproveitar). Vai exigir expertise para aproveitar os vídeos. O dono parece ser o rapaz que está sempre nos vídeos; dá para trocar uma boa ideia. Grande possibilidade de fechamento; nota boa. |
| 4 | `nova-otica-bonsucesso` | Muito boa. O casal de donos posa bastante com os óculos; a loja é bonita e bem fotografada. Dá para fazer uma boa demo. Aprovada. |
| 5 | `otica-vitoria-mairipora` | Aprovada na triagem. |
| 6 | `otica-martinez-ramos` | Aprovada na triagem. |
| 7 | `otica-wagner` | Potencial bem bom; a paleta de cores é bonita, dá para fazer um site bem bacana. Cuidado: existe outro Instagram, @oticawagner, de outra cidade. Não confundir. |
| 8 | `otica-dutra` | Aprovada na triagem. |
| 9 | `otica-italo-setti` | Aprovada na triagem. |
| 10 | `cupece-oticas` | Aprovada na triagem. |
| 11 | `otica-perfil` | Aprovada na triagem. |
| 12 | `otica-pocopetz` | Aprovada na triagem. |
| 13 | `oticas-rvn` | Aprovada na triagem. |
| 14 | `otica-studio7` | Aprovada na triagem. |
| 15 | `lez-otica` | Aprovada na triagem. |

As 15 estão no painel com id igual ao nome da pasta e as observações do Kaue: 14 em **Demo criada** e a
Dutra em **A trabalhar** (parada: o @oticadutra é de outra Dutra, em Manaus, e falta foto da loja real).
Ficaram para uma próxima leva (boas, com
ressalva): Evangélica, Yannis, Nomura, Vizzuti, Zóio, Judá, Alianza, Millennium Express, Spaziani,
Dr. Ótica, Pontes, Ojota e Majestic. Recusadas na triagem: Studio do Óculos, Gold Vision, Renova,
Ricoo, Queirooz, Imagem Ótica, MedÓtica e De Óculos.

## Lote 3 (escolhido pelo Kaue em 05/10/2026): demos prontas

Saiu da varredura de 05/10/2026 (ver "Busca de novas óticas"). O Kaue escolheu as 10 primeiras da lista e
mandou uma extra (Ponto Xys); as fotos vieram do Drive (pasta `1-1bK1Vdv56SryYloT_MRJXTI1XYsXBZu`, a página
do Instagram salva de cada uma). Ele ainda vai mandar as próximas do lote. Direção, fontes do WhatsApp e
alertas na `ficha.md` de cada pasta.

| # | Pasta | Onde | Destaque |
|---|---|---|---|
| 1 | `otica-machado` | Jardim Satélite, São José dos Campos | A Amanda, consultora de imagem óptica desde 2016; 89,7 mil seguidores. |
| 2 | `optica-cris-masson` | Centro, Ribeirão Preto | 5,0 com 1.397 avaliações; jardim, café e brinquedoteca. |
| 3 | `optica-universe` | Sítio Pinheirinho, São Paulo | Coleção própria de óculos de sol (Série Constelações). |
| 4 | `otica-flash` | Centro, Nova Iguaçu (RJ) | Casal de donos; óculos prontos em até 40 min. |
| 5 | `otica-ranulpho` | Campo Grande, Rio de Janeiro | Desde 1978, 45 mil óculos; horário com pausa do almoço. |
| 6 | `otica-six` | Centro, Peruíbe | Mais de 18 anos, consertos, crianças. |
| 7 | `otica-plus-optical` | Higienópolis, São Paulo | Adulto, teen e kids, espaço kids; tem outra loja nos Jardins. |
| 8 | `otica-niteroi-prime` | Icaraí, Niterói (RJ) | Consultoria de imagem gratuita (visagismo e coloração pessoal). |
| 9 | `freitas-otica` | Méier, Rio de Janeiro | 40 anos no Méier, loja reformada em 2025. |
| 10 | `otica-personnalite` | Jardim Aeroporto, Bauru | Grifes de luxo, envio para todo o Brasil. |
| extra | `otica-ponto-xys` | Centro, Peruíbe | Extra do Kaue. É colega da Six, mas **as duas demos não têm nenhuma relação**. |

As 11 estão no painel em **Demo criada**, com id igual ao nome da pasta e próxima ação "Enviar a demo pelo
WhatsApp".

## Quando uma demo fica pronta

1. `demos/<pasta>/index.html` na `main` deste repositório: a Vercel publica em `/demo/<pasta>`.
2. No painel (Supabase), no lead da ótica: `link_demo = '/demo/<pasta>'` (caminho relativo, sem o
   domínio), etapa `demo_criada` e próxima ação atualizada. O painel mostra a etiqueta "demo ↗" na
   tabela e no kanban, e o botão "Copiar link da demo para enviar" nos detalhes monta o link completo.
   Ao gravar o `link_demo`, o banco cria sozinho o prazo da demo: **7 dias no ar** (tabela `demos`,
   `vale_ate = hoje + 7`). Demo sem lead: `insert into public.demos (id, dono) values ('<pasta>', '<uuid do Kaue>')`.
3. Atualizar a `ficha.md` (situação `pronta · data`) e a tabela do `README.md`.
4. **Flyer de Stories junto com a demo** (pedido do Kaue em 06/10/2026, vale para toda demo nova): ver abaixo.
5. **Mensagem pronta de WhatsApp** (pedido do Kaue em 08/10/2026, vale para toda demo nova): ver abaixo.

## Mensagem pronta de WhatsApp (1º contato com a demo, em etapas)

Para óticas (ou lojas, clínicas) de menor potencial, o primeiro contato sai com poucos cliques. Pedido do
Kaue em 08/10/2026, refeito no mesmo dia: **não pode ter cara de golpe nem de spam**. Mensagem que chega
de número desconhecido já com link ("acesse aqui") é o formato do golpe e é a que é ignorada. Então:

**A conversa em etapas** (`leads.mensagem_whatsapp`, as etapas separadas por uma linha `---`; no painel,
uma caixa e um botão para cada uma, e os dois primeiros botões também no topo do card):
1. **Abrir a conversa**, sem link: "Oi, tudo bem? É da Ótica X? Com quem eu falo?". Uma pergunta que se
   responde com uma palavra; quase todo mundo responde.
2. **Mandar a prévia**, só depois que responderem: quem é a Milena, o que a Renderiza faz, o detalhe real
   da loja ("gostei muito de ver…") e o link da prévia. Sem pressão: "não precisa decidir nada".
3. **Retomar**, uma vez só, se não responderem em 1 ou 2 dias: a prévia com o link e "se não for com você,
   me diz com quem eu posso falar?". Sem resposta depois disso, para.

Os botões só abrem a conversa no WhatsApp com o texto: a pessoa confere e aperta enviar. Duas mensagens
seguidas com um clique não dá sem automação (extensão ou robô no WhatsApp Web), e automação é o que mais
bloqueia número; nem é o caso: a 2ª etapa existe para esperar a resposta. Ao abrir a prévia ou a retomada,
a demo fica no ar 7 dias a partir dali.

**A prévia do link** (`scripts/montar-site.mjs`): toda demo sai com as meta `og:` (título e descrição da
demo) e a foto do topo em `/demo/<pasta>/capa.jpg`. O link chega no WhatsApp com a foto e o nome da própria
loja, o que nenhum golpe tem. Demo com fotos só em WebP fica sem a foto na prévia.

**Regras do texto** (`painel/src/mensagem.js`, `mensagensPadrao`; o `detalhe` é um trecho sem preposição,
ex.: "a foto de vocês na porta da loja e as 268 avaliações 5 estrelas no Google"):
- Um link só, o da demo, e só a partir da 2ª etapa. Nada de "clique aqui", "acesse", urgência, preço,
  promoção ou encurtador de link.
- O detalhe sai da ficha e do que a demo mostra. Nome de pessoa só quando a ficha confirma quem é (ex.:
  "Falo com a Nina, da Ótica Nina?").
- Para gravar: `update public.leads set mensagem_whatsapp = $msg$<abrir>`, linha `---`, `<prévia>`,
  linha `---`, `<retomar>$msg$ where id = '<id>'` (o texto sai de
  `juntarMensagens(mensagensPadrao(lead, { detalhe }))`).

**Para não virar spam** (o que mais pesa no bloqueio do número e em ser ignorado):
- Mandar do número da Milena, com WhatsApp Business: foto/logo, nome "Milena · Renderiza", descrição e o
  site. Quem recebe toca no nome para conferir; o perfil tem que confirmar a mensagem.
- Poucos por dia (10 a 20), espaçados, em dia útil e horário de loja aberta.
- Responder rápido quando responderem; quem tem vídeo de apresentação pode receber o vídeo na 2ª etapa
  (o vídeo da própria loja convence mais que o link).
- Sem WhatsApp no lead, os botões não aparecem. Número fixo só funciona se for WhatsApp Business.

## Prazo das demos (7 dias)

Pedido do Kaue em 06/10/2026: demo não fica no ar para sempre. Cada uma vale **7 dias a partir da
criação** e depois sai do ar sozinha; para reabilitar, é no card do lead.

- **Como funciona:** `middleware.js` (Routing Middleware da Vercel) roda antes de cada `/demo/<pasta>` e
  pergunta ao Supabase `demo_liberada(pasta)` com a chave pública. No ar = `no_ar` ligado e `vale_ate`
  (último dia, horário de Brasília) de hoje em diante, ou sem prazo. Fora disso, responde 410 com a
  página "Esta demonstração saiu do ar" e um botão para a ótica pedir de novo pelo WhatsApp da Renderiza
  (é uma deixa para retomar a conversa). Na dúvida (banco fora, sem configuração, pasta sem linha), a
  demo **abre**: erro nunca derruba demo.
- **No painel:** etiqueta "Demo no ar até …" no topo do card do lead (clicando, vai para os controles) e
  seção **Demo**, logo abaixo de Andamento: situação, chave **No ar**, **Vale até**, **Reabilitar por 7 dias**
  (ou **7 dias a partir de hoje**) e **No ar sem prazo**. Etiqueta "demo expirada" / "demo fora do ar" na
  tabela e no kanban. Antes de mandar um link de novo, conferir que a demo está no ar.
- **Demo nova:** nasce com 7 dias pelo gatilho do `link_demo` (passo 2 acima). Para dar mais tempo a quem
  está em conversa, reabilitar no card.
- **As que já existiam em 06/10/2026 (as 42 publicadas):** todas com `vale_ate = 13/10/2026`. Quatro não
  têm lead com link (lu-elegante-modas, otica-smart, otica-vip-lapa, oticas-f-dias): o prazo delas só muda
  pelo banco (`update public.demos set vale_ate = ... where id = '<pasta>'`) ou pondo o link num lead. A
  `otica-dutra` não tem página publicada (parada); ganha o prazo quando entrar no lead.
- **O flyer não tem prazo** (`/flyer/<id>.png` é presente para a ótica guardar).

## Vídeo de apresentação da demo (MP4 ~30 s): o padrão

Pedido do Kaue em 07/10/2026: um vídeo curto da demo para mandar à ótica no WhatsApp, como apresentação.
O primeiro foi o da **Ótica Machado** (`gravacoes/otica-machado.mp4`, 31 s; o Kaue aprovou: "ficou muito
bom"). Depois ele pediu um **modelo leve**, como a linha das demos. É este:

**Passo a passo (uns 3 minutos por ótica, demo da linha comum):**
1. `node ferramentas/video/roteiro.mjs <pasta-da-demo> [id-do-lead]` → `gravacoes/<id>.json`. Sai da própria
   demo: cores, fontes, nome, bairro, hora com a loja aberta e as cenas que ela tem.
2. Revisar o JSON: dá para pôr o nome do dono na legenda da história ("A história da loja e da Amanda") e
   trocar o texto das cartelas. O resto já vem pronto.
3. `node ferramentas/video/gravar.mjs gravacoes/<id>.json --ensaio` (~10 s): um quadro por parada, com a
   legenda, e as cartelas, em `gravacoes/<id>-ensaio/` (não commitar). Olhar se nada ficou coberto.
4. `node ferramentas/video/gravar.mjs gravacoes/<id>.json` → `gravacoes/<id>.mp4`. Conferir 8 a 10 quadros
   (`ffmpeg -ss <t> -i … -frames:v 1`).
5. Na `main`, vai ao ar em `/gravacao/<id>.mp4`; no lead, `link_gravacao = '/gravacao/<id>.mp4'`. O painel
   mostra **Assistir** / **Baixar MP4** na seção Demo e **Baixar vídeo** no cabeçalho do card.
Demo feita à mão (sem `demo.json`): escrever o roteiro copiando `gravacoes/otica-machado.json`.

**Versão "show" (~45 s, para lead com bom potencial):** `roteiro.mjs <pasta> [id] --show`. Abertura em
montagem: 4 fotos com gente em tela cheia, trocando com movimento lento, o nome em duas linhas (a última
palavra grande, em destaque) e a frase da ótica; mais paradas (os dois carrosséis, o atendimento, o
Instagram); fechamento com o site inteiro rolando dentro de um celular. A música põe uma nota em cada troca
de foto. A primeira foi a da **Pocopetz** (`gravacoes/otica-pocopetz.json`, 44,8 s, 5,9 MB, 07/10/2026):
no ensaio, trocar foto que corte rosto ou deixe mancha no canto (`abertura.fotos` e `pos_fotos`) e fugir de
foto marcada como duvidosa na ficha (ex.: possível campanha de marca).

**Clima (08/10/2026):** o Kaue pediu pegadas diferentes por ótica. `roteiro.mjs … --show --clima=<x>` grava
`"clima"` no roteiro, e ele muda a montagem, a rolagem e a trilha juntas:
- `leve` (padrão): o de sempre, ~96 bpm, nome em itálico na cor da marca.
- `sobrio`: confiança e seriedade, para ótica com poucas fotos (**Bonsucesso**). Fusões lentas, nome reto e
  pesado, frase reta, rolagem mais calma, paradas 15% mais longas; trilha ~80 bpm, piano em semínimas, pulso
  discreto, sem caixa.
- `descolado`: cortes rápidos (até 6 fotos), nome em caixa alta numa faixa na cor da marca, rolagem ágil,
  paradas 12% mais curtas; trilha ~118 bpm com bumbo em todo tempo e chocalho em semicolcheias (**Universe**).
- `grife`: fusões longas e movimento quase parado, "ÓTICA" pequeno e espaçado sobre o nome fino, frase em
  itálico clara, rolagem lenta, paradas 25% mais longas; trilha ~72 bpm, acordes de jazz (ii–V–I com nonas),
  quase sem bateria e mais reverb (**Personnalité**).
Nome comprido na montagem quebra em duas linhas equilibradas e só então encolhe ("Boutique / dos Óculos").

**O que faz o vídeo ficar bom (revisão do da Machado):**
- **É o site de verdade, no celular**, sem maquete: a ótica se reconhece. Gravado quadro a quadro com o
  relógio da página parado, então rola liso mesmo com a máquina lenta, e as animações de entrada da
  demo aparecem como no celular.
- **Roteiro curto e com ritmo:** abertura de 3 s, 7 paradas de 1,5 a 3 s com rolagem suave de ~1 s entre
  elas, fechamento de 3,5 s; 30 s no total.
- **Uma legenda curta por parada**, dizendo a função ("Vitrine com fotos reais", "Avaliações reais do
  Google", "WhatsApp e rota a um toque"). O gravador procura sozinho a parada em que a legenda não cobre
  título nem texto (descontando a animação de entrada, que desce os blocos 22 px).
- **O "dedo" mostra que dá para mexer:** passa o carrossel, toca no seletor de rosto (a resposta muda na
  tela) e no botão do WhatsApp.
- **Abertura com a cara da ótica** (foto do topo da demo, cores e fonte dela) e **fechamento que puxa a
  conversa**: "Seu site novo já está pronto." e "Gostou? É só responder esta mensagem."
- **"Aberto agora" certo:** a hora do roteiro é de loja aberta (sai do horário da demo).
- **Primeiro quadro bonito:** foto e nome já aparecem no quadro 0, porque ele vira a miniatura no WhatsApp.
- **Leve:** grava em 1080 e entrega em 720 × 1280 (~4 MB com música; o WhatsApp reduz para isso de todo
  jeito). `"resolucao": 1080` para Instagram (~6 MB). Áudio sempre presente (trilha ou faixa muda), senão
  o WhatsApp pode tratar como GIF.

**Música (aprovada; vai em todos desde 08/10/2026):** `"musica": "auto"` gera uma trilha original com
`ferramentas/video/musica.py` (sintetizada aqui, sem direito de terceiros): piano elétrico em arpejo, pad,
baixo e bateria leve, em dó maior, ~97 bpm; o groove entra com o site e o acorde final cai no fechamento.
`"musica": "caminho/arquivo.mp3"` usa uma faixa escolhida (com entrada e saída suaves); sem o campo, faixa
muda. O roteiro gerado já vem com `"auto"`; `"clima"` muda o jeito da trilha (acima).

**No ar (08/10/2026):** a pedido do Kaue ("pode incluir direto no painel de cada um"), com `link_gravacao`:
- show: Studio 7, Boutique dos Óculos, Bonsucesso (sóbrio), Universe (descolado), Personnalité (grife) e
  Laodicéia (roteiro à mão, demo antiga);
- padrão com música: Machado (troca o antigo, sem música), Ponto Xys, Plus Optical e Six.
Depois, também a pedido dele ("para ficar registrado"), os que só tinham ido pelo chat: Pocopetz, Wagner,
Lez e Haramaki (show, como foram mandados) e Cris Masson (padrão, regravado no modelo atual). A demo da
Wagner ainda tem fotos com texto e preço no carrossel; o vídeo não mostra nenhuma.

**Ensaio x vídeo:** no ensaio a página pula direto para a parada, e às vezes um bloco ainda aparece apagado
(a animação de entrada não começou). No vídeo a rolagem é contínua e ele aparece; na dúvida, conferir o
quadro do vídeo. Botão de seção logo abaixo de um título comprido (atendimento) fica embaixo da legenda:
nessa cena, `"legenda_no_topo": true` com `"ajuste": -70`.

**Regras:** só o que a demo mostra (sem preço, sem promessa, sem dado novo); legendas de função, sem
adjetivo vazio; nada de rosto cortado na parada (conferir no ensaio).

## Flyer de Stories (cortesia para retomar o contato)

**Para que serve:** o Kaue manda a demo e quase sempre recebe vácuo. No dia seguinte, ou alguns dias
depois, ele retoma com o flyer: "Oi, esqueci de te mandar esta cortesia... E aí, conseguiu olhar a
demo?". A arte é um presente pronto para os Stories da ótica, pensado para **atrair cliente da ótica**: o
dono tem que ver e gostar. A gentileza puxa a resposta.

- **Como é:** PNG 1080 × 1920 feito pelo `ferramentas/flyer/gerar.mjs` a partir de `flyers/<id-do-lead>.json`
  (nome da ótica, bairro, fonte e cores da demo, uma foto em arco, selo do Google, título e texto da demo,
  botão do WhatsApp, endereço e Instagram). **Uma foto só:** nada de foto menor de complemento (polaroid);
  o Kaue achou que pesava, menos é mais. Nada importante nos 200 px de cima nem nos 170 de baixo (o
  Instagram cobre).
- **Regras:** os mesmos dados conferidos da demo; foto real, de gente sorrindo (cliente, família,
  criança, equipe) antes de produto; a nota só aparece se for 5,0 (abaixo disso, estrelas e total); o
  WhatsApp é o que a ótica divulga para cliente (fachada, bio, Google), não o número pessoal do dono;
  dentista leva nome e CRO do responsável. O gerador avisa quando o texto encosta no botão ou o rodapé
  estoura: encurtar.
- **Quem recebe:** os leads com demo em Contato iniciado e Em conversa (todos têm flyer desde 08/10/2026).
  Os leads antigos sem demo, cadastrados em 02/10 e parados em Em conversa, não entram: não seguiram o
  contato.
- **Passo a passo:** `python3 ferramentas/flyer/extrair.py <pasta-da-demo>` tira as fotos da demo para
  `rascunhos/flyer/fotos/<pasta>/` (com `folha.jpg` para escolher); escrever `flyers/<id>.json` (modelo:
  qualquer um da pasta); `node ferramentas/flyer/gerar.mjs flyers/<id>.json` grava `flyers/<id>.png`;
  conferir a imagem; na `main`, a Vercel publica em `/flyer/<id>.png`; no lead, `link_flyer = '/flyer/<id>.png'`.
  O caminho das fotos no JSON é o da sessão que fez o flyer: para refazer, extrair de novo e apontar.
- **No painel:** detalhes do lead → seção **Flyer para Stories** (prévia, "Baixar PNG" e "Copiar
  mensagem"), e o botão rosa "Baixar flyer" nas ações rápidas. Só o PNG vai ao ar (o JSON não).
- **Feitos em 06/10/2026 (9):** os 8 de **Em conversa** (CatGlass, MS Odontologia, Embu Ótica, Franco,
  D&R, Interativa, Líder, Perez) e o Ateliê Óptico Jabaquara (**Contato iniciado**). A Embu não tem
  demo: fotos do Google e do Instagram, e no flyer vai o WhatsApp da fachada, (11) 97544-0148 (o da
  lista do Kaue, (11) 93911-3099, é outro).

## Material de cada ótica

- O Kaue separou fotos e referências de cada ótica e sobe como zip na pasta `referencias/` do ramo
  **`referencias`** deste repositório (ramo separado, sem histórico em comum com a `main` e não
  publicado na Vercel), um zip por ótica com o nome da pasta (`otica-sales.zip`…). Para ler:
  `git fetch origin referencias` e `git show origin/referencias:referencias/<arquivo>` (ou um
  `git worktree` do ramo). Foto bruta **nunca** entra na `main`: na demo vão só as escolhidas, dentro do
  `index.html`. (Antes, o lugar era `referencias-demos/` no `garimpo-brasuca`; confira lá também.)
- Lote atual: `lotes-leads-1 - 28.09.26.zip` no Google Drive do Kaue (link compartilhado no chat, id
  `1e7NrO_LcfQpwqFBb1aHOVngsGQCkSZ65`). Baixar com
  `curl -sSL "https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t"`.
  Cada pasta é uma página do Instagram salva: pegou só a janela de posts que estava carregada, às
  vezes antiga (Sales 2024, Amitié 2026, Ateliê 2023, Interativa 2020–23, Líder 2020–21,
  Laodiceia 2021, Mogi 2019, D&R 2018). Conferir a data antes de usar uma foto.
- **Avaliações do Google: o Claude pega sozinho** na hora de fazer a demo.
- **Fotos sem o zip (desde 02/10/2026, testado na Ótica Nina):** o Instagram bloqueia o perfil e a API
  sem login, mas dá para pegar sozinho:
  1. `ferramentas/igembed.py <@>`: os 6 posts mais recentes (embed público).
  2. `ferramentas/ig-post.py <shortcode> <pasta>`: cada post em tamanho cheio, com todas as fotos do
     carrossel e o vídeo (mp4). Vídeo vira foto: tirar quadros com o ffmpeg (`imageio-ffmpeg`).
  3. `ferramentas/fb-fotos.mjs <pagina> <pasta>`: a página da ótica no Facebook costuma replicar os posts
     do Instagram; a grade abre sem login e as fotos saem em 1024 px (a Nina deu 147).
  4. Fotos da ficha do Google (fachada) quando faltar.
  O zip do Kaue continua valendo quando a ótica não tem Facebook ou tem poucos posts.

## Como pegar dados do Google Maps daqui

- `ferramentas/achar-lugar.mjs` (id do lugar) e `ferramentas/avaliacoes-google.mjs` (endereço, telefone,
  horário e depoimentos): o caminho usado a partir da Ótica Sales.
- A ficha às vezes abre com uma foto só ou só com o horário de hoje: rodar de novo `fotos-google.mjs` e
  `horario-google.mjs` (no lote 3, a segunda tentativa trouxe 16 fotos da Cris Masson e a semana inteira de
  4 óticas). Horário com pausa para o almoço sai com as duas faixas ("9h às 13h e 14h às 18h").
- `ferramentas/maps-mob.mjs`: busca no Google Maps em modo celular e devolve nome, nota e nº de
  avaliações. Uso: `node maps-mob.mjs saida.json "Nome da ótica cidade"`. No modo desktop o painel
  não carrega sem tela; no modo celular funciona.
- Depoimentos: abrir a página do lugar no Maps (URL com o id do lugar e `!9m1!1b1`, que abre a aba de
  avaliações) com Playwright, clicar em "Mais" para expandir e ler os elementos `[data-review-id]`.
  Ordenar por "Mais recentes" e "Maior nota" para ter variedade.
- Playwright: Chromium em `/opt/pw-browsers/chromium`, com o proxy do ambiente
  (`proxy: { server: process.env.HTTPS_PROXY }`).

## Busca de novas óticas (quando pedir)

Critérios: independente e pequena (nada de rede ou franquia); o dono aparece no Instagram com fotos
reais; **sem site próprio** (site quebrado é ótimo sinal); atende no WhatsApp; ativa (postou nos
últimos 30 dias, no máximo 3 meses); Google com nota 4,0 ou mais e pelo menos 8 avaliações.
Entregar lista numerada com: nome, @ com link, bairro/cidade, por que parece boa, seguidores, último
post, dono aparece, site, WhatsApp, nota/avaliações, alerta. No fim, uma linha com os descartes.

Como foi feita a do lote 2 (ferramentas em `ferramentas/`):
1. `maps-lista.mjs`: lista do Google Maps por bairro ("ótica em Tatuapé São Paulo"), 20 por busca.
   Foram 112 bairros e cidades da Grande SP, 1.785 óticas diferentes.
2. Filtro: fora redes, franquias e nomes com 3+ unidades; nota 4,7+; 20 a 1.200 avaliações.
3. `maps-lugar.mjs`: site, telefone, endereço e redes de cada lugar. Fora quem tem site funcionando.
4. `igembed.py`: lê o embed público do perfil (`/<usuario>/embed/`): seguidores, posts e os 6
   últimos posts com data, legenda e foto. É o único jeito de ler o Instagram daqui sem login.
   `achar-ig.py` tenta variações do nome quando o Google não aponta o @.
5. Fora sem post em 90 dias e com menos de 800 seguidores; folha com os 6 posts de cada uma para
   olhar se o dono aparece e se as fotos são reais.
6. **Confirmar a cidade de todo @ achado pelo nome** (legenda com a rua ou busca na web): no lote 2,
   vários eram de outra cidade (Soberana = Itajaí, Tradição = BH, Nostra = Argentina).

Lote 3 (05/10/2026): mesma linha, com os scripts versionados em `ferramentas/prospeccao/` (passo a passo e o que
ajustar para outro nicho no README de lá). Régua mais alta: nota 4,8+, 40+ avaliações, Instagram com post em 45 dias e
1.000+ seguidores. 22 + 7 de reserva (lista no chat de 05/10/2026): o Kaue escolheu as 10 primeiras e uma
extra (seção "Lote 3") e ainda vai mandar as próximas.

## Dentistas

Segundo nicho, depois das óticas. Antes da busca, o painel já tinha a Clínica MS Odontologia (Itapevi, demo
`/demo/ms-odontologia`, que é a referência) e a Clínica Macena (Ferraz de Vasconcelos).

**Critérios:**
- Clínica ou consultório independente: nada de OdontoCompany, Sorridents, Oral Sin, Odonto Excellence,
  AmorSaúde, Dr. Consulta, nome com 3+ unidades ou clínica popular/de convênio.
- Google com nota 4,8+ e 40+ avaliações.
- Sem site, ou com site quebrado, no Canva, link na bio ou página gratuita do Google (marcar qual). Site bom
  de agência fica de fora.
- Instagram com post nos últimos 45 dias e 1.000+ seguidores (vale o da clínica ou o pessoal do dentista),
  com o dentista aparecendo em fotos reais.

**Regra do Kaue para todo dentista (08/10/2026):** fotos bonitas, nada chocante nem feio (cuidado com os
exemplos de tratamento); o site tem que ficar bonito; a clínica tem que ser apresentável, senão nem entra.
Diferente das óticas: **capa de vídeo como foto não fica legal**. Perfil com muito vídeo pede escolha
cuidadosa das imagens.

**Regras do CFO na demo** (Código de Ética Odontológica, arts. 43 e 44; Resolução CFO-196/2019):
- Nome e número do CRO do dentista visíveis (clínica: também o responsável técnico).
- Nada de preço, promoção, "avaliação gratuita", "o melhor" ou outro superlativo.
- Antes e depois só de casos do próprio dentista, com autorização do paciente.
- Depoimento sem identificar o paciente para autopromoção (usar só o primeiro nome). Não confirmei como o
  CRO-SP vê avaliação do Google dentro do site.

**Como foi a busca (odonto lote 1, 05/10/2026):** 350 buscas no Google Maps, só na Grande SP ("dentista em" e
"clínica odontológica em" por bairro e cidade; nas melhores regiões também "implante dentário", "lente de
contato dental" e "harmonização orofacial em"). Mesmos passos de `ferramentas/prospeccao/`, com os scripts
adaptados ao nicho na pasta da sessão (não versionados). Funil: 3.963 lugares → 1.559 no filtro → 833 sem
site ou com site fraco → 234 com Instagram ativo e 1.000+ → 22 escolhidas + 13 de reserva. Interior e
litoral não foram buscados. O que aprendi:
- "Sem site no Google" engana: das 50 conferidas a fundo, 16 tinham site fora do Google (agência, SEO,
  feito com IA). Sempre buscar na web e testar os domínios óbvios no DNS.
- @ achado pelo nome erra muito: 32 das 234 eram de outra cidade ou país, de rede ou de fora do nicho.
  Confirmar pela cidade nas legendas ou pelo CRO.
- O proxy daqui dá erro (405/502) em sites que estão no ar: conferir antes de chamar de quebrado.

**Odonto lote 1 (aprovado pelo Kaue em 08/10/2026):** 9 leads no painel, em **A trabalhar**, segmento
"Odontologia", próxima ação "Criar demo (odonto lote 1 · Nª)", com N igual ao número na lista de 05/10.
Todas têm demo, vídeo e flyer desde 09/10/2026 (abaixo). Dados, observações do Kaue e alertas ficam nas observações de cada lead.

| # | Clínica | Onde | Observação do Kaue |
|---|---|---|---|
| 2 | Clínica ACS Odonto Center (@dentista.adrianacsiqueira) | Cidade Mãe do Céu (Tatuapé), São Paulo | Muito vídeo: cuidado com capas de vídeo e com exemplos chocantes e feios. |
| 3 | Consultório Dra. Natiele Silva (@dra.natielesilva_) | Vila Matilde, São Paulo | Aprovada. |
| 6 | Odonto Mile (@odontomile) | Centro, Itapecerica da Serra | Descolada, jovial, fotos boas. |
| 7 | Dra. Karoline Stefani (@dra.karolstefani) | Vila Perus, São Paulo | Cuidado na escolha e na preparação das imagens. |
| 11 | Dra. Fernanda Ornelas (@dra.fernandaornelas) | Jabaquara, São Paulo | Aprovada. |
| 12 | Odontoelis (@odontoelisoficial) | Guaianases, São Paulo | Aprovada. |
| 13 | Dr. Ítalo Totti (@dr.italototti) | Socorro, Mogi das Cruzes | Tem potencial, mas muito vídeo: escolher bem as imagens. |
| 14 | Sauddá Odontologia (@sauddaodontologia) | Centro, Biritiba Mirim | Aprovada. |
| 16 | Clínica Dra. Michele Renteiro (@dra.michelerenteiro) | Centro, Franco da Rocha | Aprovada. |

Recusadas pelo Kaue: Dra. Thais Nogueira, Instituto Camila Ferreira, Lumidents, Lexus, AH Odontologia, Dra. Flora
França, Dra. Gabriela Guinger, Mantelato, Bellatrix, Clínica Coutinho, Roberto Pires, Clínica Passioli e Sanches.
As 13 da reserva não foram usadas.

**Demos de dentista (08/10/2026):** o Kaue pediu as 3 com mais potencial, inspiradas na da MS, com vídeo. Fotos do
Drive dele (pasta `1U2xEPcdRcmEzzDcjIIdnDu2FEzPQ5XVF`, uma subpasta por clínica aprovada, com a página do Instagram
salva; lista em `https://drive.google.com/embeddedfolderview?id=<id>`, download por
`drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`). Olhando as 9 pastas, ficaram **Dra. Natiele
Silva** (`consultorio-dra-natiele-silva`), **Sauddá** (`saudda-odontologia`) e **Dr. Ítalo Totti** (`dr-italo-totti`);
a Odonto Mile ficou como 4ª (no Drive, as fotos são do endereço antigo). As outras têm quase só boca de perto, arte
pronta ou capa de vídeo.
- **Linha comum de dentista:** `ferramentas/demo/gerar-odonto.py demos/<pasta>/demo.json`, no desenho da MS (capa
  com o dentista em arco, faixa, "Quem cuida do seu sorriso" com CRO e tira de fotos, carrossel de atendimento,
  experiência, carrossel de sorrisos ou de crianças, tratamentos, a clínica, avaliações do Google e contato com
  mapa). Cores, fontes e seções vêm do `demo.json`; usa as funções do `gerar.py` (fotos, avaliações, horário).
  Validar com `ferramentas/demo/validar.mjs` (o script importa de `/home/user/renderiza`: em sessão com a pasta
  `Renderiza`, criar o atalho `ln -s /home/user/Renderiza /home/user/renderiza`).
- **Fotos de dentista:** pessoas sorrindo (dentista, equipe, pacientes) antes de tudo; sorriso de perto só os
  bonitos (sem afastador, sangue, broca nem procedimento); nada de quadro de vídeo com a pessoa falando; artes com
  texto só recortadas. Foto do Drive sem data: usar pelas pessoas, e o consultório só das fotos recentes.
- **Vídeo:** roteiro escrito à mão (`gravacoes/<id>.json`, seletores da linha de dentista: `.hero-media`,
  `.hero-proof`, `.doutor-foto`, `#atendimento-track`, `#sorrisos-track` ou `#pequenos-track`, `#tratamentos h2`,
  `.space-photos`, `#reviews-track`, `#contato .button-light`), versão show. Climas: Natiele leve, Sauddá grife,
  Dr. Ítalo sóbrio. Na montagem, só fotos do próprio dentista ou da clínica (o nome aparece por cima). O gravador
  precisa de `numpy` e `imageio-ffmpeg` (`pip install numpy imageio-ffmpeg`).
- **Pendências:** CRO do Dr. Ítalo não confirmado (a demo e o flyer não mostram); horário dele só de quarta; na
  Sauddá, confirmar a segunda-feira (o Google mostrou horário de feriado). Detalhes na ficha de cada demo.

**Demos de dentista, 2ª leva (09/10/2026):** o Kaue pediu as 6 que restavam em A trabalhar, no mesmo padrão, com
fotos do Drive (sem confundir as clínicas), avaliações excelentes e fotos bonitas, valorizando o jeito de cada um
"sem ser emocionado demais". Ficaram **ACS Odonto Center** (`clinica-acs-odonto-center`), **Odonto Mile**
(`odonto-mile`), **Dra. Karoline Stefani** (`dra-karoline-stefani`), **Dra. Fernanda Ornelas**
(`dra-fernanda-ornelas`), **Odontoelis** (`odontoelis`) e **Dra. Michele Renteiro** (`clinica-dra-michele-renteiro`),
todas com vídeo e flyer. Climas do vídeo: ACS sóbrio, Odonto Mile descolado, Fernanda grife, as outras leve.
- **Na linha de sempre** (`gerar-odonto.py`): a seção do dentista pode virar a da equipe (`"id": "equipe"`;
  Odonto Mile, sem dentista "cara da marca", cita a RT com o CRO); `box` recorta artes e prints; logo pode ser foto
  recortada. No `c` das fotos, `[0.5, 0.0]` guarda o topo (é quanto do excesso sai, não o centro). A capa sai com a
  classe `hero-photo`, que o `montar-site.mjs` usa para a foto da prévia do link (sem ela, ia a primeira foto da
  página: na Dra. Karoline, o logo). As 3 demos de 08/10 ficaram como estavam (já enviadas).
- **Fotos:** só da clínica certa e do endereço atual (Odonto Mile e Fernanda têm fotos de endereço antigo no Drive;
  o consultório delas veio do Google). Quando há outra dentista sem nome confirmado (Odontoelis) ou dúvida se é a
  mesma pessoa (ACS), a demo não usa a foto como a doutora.
- **Flyer de dentista:** uma foto só (a do dentista ou de paciente sorrindo), nome e CRO no alto; a nota só aparece
  quando é 5,0 (a Odontoelis, com 4,9, mostra só as estrelas).
- **Pendências:** ACS (conferir se é a Dra. Adriana nas fotos), Odonto Mile (RT mudou da Dra. Ketliny para a Dra.
  Myllena; unidade de Embu sem endereço), Michele (legendas antigas com outro endereço), crianças na Odonto Mile e na
  Odontoelis (autorização dos pais). Detalhes na ficha de cada demo.

**Dra. Milena Ferreira (09/10/2026):** pedido direto do Kaue, fora do lote. No painel (lead `dra-milena-ferreira`),
em Gravação realizada. Harmonização orofacial na Granja Viana (Cotia), clínica própria inaugurada em setembro de 2026.
Mesma linha de dentista, com carrossel de resultados de rosto (só o "depois", sem agulha, seringa, marca de produto
nem rosto pintado) no lugar dos sorrisos; vídeo "grife". Não estava no Google com o nome do Instagram: achei pela
marcação de local do post da inauguração ("Granja Viana") e a busca "Dra Milena Ferreira Granja Viana". A ID do
lugar para o link "avaliar" sai do fid (`ChIJ` + base64 de `0a 12 09 <fid1 LE> 11 <fid2 LE>`).

## Repositório e site

- **Oficial: `renderizaweb/renderiza`, branch `main`.** Site público, painel e demos no mesmo
  repositório e no mesmo site da Vercel, no domínio **`https://www.renderizaweb.com.br`** (o
  `renderizaweb.com.br` redireciona para o www; `renderiza-five.vercel.app` também abre; `renderiza.com`
  **não** é da Renderiza): `/` é o site público (`site/`, dados em `site/config.mjs`), `/painel` é o
  painel com login em `/login` (só o Kaue), `/demo/<ótica>` é a demo por link. As demos novas são feitas
  e enviadas aqui. A home **não** lista demos; um trabalho só aparece nela com `publicar: true` no
  `site/config.mjs`, e demo de ótica só com aprovação da ótica (fotos de clientes; em 30/09/2026 nenhuma aprovou, então
  nenhuma demo aparece).
  Depoimentos: `site/config.mjs` → `depoimentos`, só aparecem com texto e `publicar: true`. Regra: só
  palavras reais de quem falou (ajuste leve de pontuação, nunca texto inventado). Publicados: Raphael (Move),
  Davi (Ótica Blulens: autorizou site e depoimento em 01/10/2026; na home vai um parágrafo, íntegra no
  config), Milena (Compasso) e Luciene Eunice (Lú Elegante), sem citar parentesco (decisão do Kaue, 01/10/2026).
  Trabalhos na home: **Move** (movexfit.com.br, app do cliente Rafael, em destaque com os recursos
  feitos pela Renderiza; cada recurso tem "Ver tela" com print real do app, gerado com dados de
  exemplo por `ferramentas/prints-move/`) **Compasso** (finanças da família, ideia da Milena; prints com família
  fictícia por `ferramentas/prints-compasso/`), **Ótica Blulens** (oticablulens01.com.br; escreve-se
  "Blulens", sem "e") e **Lú Elegante** (luelegantemodas.com.br). Texto do "Quem faz":
  5 anos de desenvolvimento com foco em produto; Warren citada numa frase (tempo integral) e a
  Renderiza como projeto paralelo e independente. Sem data de início nem detalhes do trabalho na Warren.
- **Identidade visual (02/10/2026):** logo real em `site/marca/logo-original.webp`, vetorizado em
  `site/estatico/simbolo.svg` (usado no topo, rodapé, favicon, ícone do iPhone e imagem de compartilhamento).
  Paleta do logo e nada além: grafite `#1e2528`, branco e o branco quente do símbolo `#f1eee9`. Sem verde,
  sem brilhos nem sombras decorativas. Tokens em `site/estilo.css` (`:root`). O painel ainda usa o visual antigo.
  Fonte: **Geist** (OFL, auto-hospedada em `site/estatico/fontes/`), no lugar da Inter + Instrument Serif;
  títulos em duas cores (grafite + cinza) no lugar do itálico. Portfólio em cartões com print em alta
  (2x) que abrem o pop-up do projeto (02/10/2026).
- **Quem está por trás (02/10/2026):** Kaue e Milena como cofundadores, com o mesmo destaque
  (`fundadores` em `site/config.mjs`). Kaue: tecnologia e desenvolvimento. Milena: relacionamento e operações
  (carreira em RH, sem citar empregador, cargo ou resultados). Em aberto: tirar o depoimento da Milena, o
  Compasso como projeto dos fundadores, sobrenome/LinkedIn dela e passar o resto do site para "nós".
- **Painel** (`painel/`, detalhes em `painel/README.md`): Pipeline, Tarefas, Clientes, Ritmo e Conteúdo,
  com Supabase. Abre no Pipeline (pedido do Kaue em 08/10/2026: é a casa do painel). Tarefa tem dia, hora, cliente e responsável (Kaue ou Milena), todos
  opcionais menos o texto. Cliente pode ficar fora do funil (só relacionamento).
  Situação em 29/09/2026:
  - Supabase ligado: projeto `gxdwluswpczlfgvzxqvg` (`https://gxdwluswpczlfgvzxqvg.supabase.co`),
    `schema.sql` rodado, usuário do Kaue criado, novos cadastros desligados.
  - Vercel com `SUPABASE_URL` e `SUPABASE_ANON_KEY` (chave pública `sb_publishable_…`): o login
    funciona em `/login` (até 30/09/2026 ficava no endereço principal).
  - Ambiente do Claude com `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RENDERIZA_EMAIL` e
    `RENDERIZA_SENHA`, para o Claude gravar pelo `scripts/relato.mjs` (fluxo em
    `docs/atualizacao-por-ia.md`). Nunca pedir senha ou chave pelo chat; nunca usar a chave secreta.
  - Dados do painel antigo **importados em 29/09/2026** (3 leads, 4 conteúdos, portfólio e guia no
    `arquivo_legado`). A partir daí o painel oficial é o da Vercel; o artifact do Claude ficou só como
    histórico.
  - O Kaue conectou o **conector do Supabase** (MCP) ao Claude: ele entra como administrador e pula o
    RLS. Para gravar dados, usar a função `renderiza_aplicar_relato` com a identidade do Kaue
    (`set_config('request.jwt.claims', …)`, ver `docs/atualizacao-por-ia.md`), simulando antes de
    aplicar. Nunca mudar a estrutura do banco sem pedir.
- Painel antigo (artifact do Claude, só histórico): https://claude.ai/artifact/6zFaGzyeMNADQMBVhpKu5b.
  Prévia com dados fictícios: https://claude.ai/artifact/AMkVgpUfmFf1LkCEN7KunK.
- **`kaue7almeida/garimpo-brasuca` é outro projeto, sem relação com a Renderiza: não trabalhar nele.**
  Só por histórico: as pastas `renderiza-demos/` e `painel-renderiza/` de lá foram cópias provisórias e
  pararam de ser atualizadas.
- Os zips de referência (fotos brutas) continuam em `referencias-demos/` do garimpo-brasuca, branch
  `claude/optica-demo-personalizada-ssalu4`: material bruto não entra neste repositório.
