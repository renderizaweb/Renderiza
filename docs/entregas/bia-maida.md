# Bia Maida: o trilho da entrega (site + Painel Renderiza)

Segundo cliente com **site e painel**: a Bia (Beatriz) Maida, fotógrafa de **eventos, ensaios externos e corporativo** em
São Paulo. O estúdio dela (Vila Paulo Silas) **fecha em dezembro**; no ano que vem ela trabalha no local do cliente e,
para retratos, em estúdios parceiros por hora. O modelo e as lições gerais estão no [README](README.md); o primeiro
trilho, que este copia, é o da [Rafaela](rafaela-damaceno.md). Quem continuar lê primeiro "Onde o trem está" e o diário,
e atualiza os dois no mesmo commit do que fizer.

**Combinado (17/11/2026, pela Renderiza):** o site completo, com o painel completo (todos os módulos, como o da Rafaela).
O painel é opcional: se ela desistir dele, o site continua de pé, perfeito e com a consulta de data pelo WhatsApp.

## Onde o trem está

| | |
|---|---|
| **Parada** | B (ela valida) com A, C e D andando juntas |
| **Feito** | A versão final no ar para ela validar (18/11). **O site no repositório dela** (`biamaidafotografiadev-alt/biamaidafotografia`, `main`, `fa814c7`, 18/11), gerado pelo `virar-site` sem o painel (fica de pé sozinho). **A conta dela no Painel Renderiza, na produção** (18/11): "Bia Maida Fotografia", fotografia, código `bia-maida`, ativa e sem prazo, os 7 módulos, a demo no contexto com os tipos de hoje, a conversa de boas-vindas pendente e o convite do dono por link (usuário `biamaida`). **O Meu site ligado** (18/11): as marcações no modelo (C1), o site cadastrado no painel (`sites`, código `bia-maida`) e o site do repositório dela com o script do painel (`6d157fc`, no ar no Cloudflare Pages). **O "Sua data" ligado à agenda online** (18/11, C2 e C3): por dia e turno (o jeito da agenda agora é escolha da conta, em Configurações), turnos iniciais manhã 8h–12h, tarde 13h–18h e noite 19h–23h, todos os dias; o site dela com a agenda (`6ca9fc1`) |
| **Próxima ação** | (1) Renderiza: o domínio — Custom domains no projeto do Cloudflare, `biamaidafotografia.com.br` e `www.biamaidafotografia.com.br`; no Registro.br, os servidores DNS que o Cloudflare mostrar (DNSSEC desligado antes). (2) Renderiza: no Admin, conta "Bia Maida Fotografia" → **Mandar o link** (vale até 25/11; "Link novo" renova). (3) Renderiza → Bia: confirmar os turnos (dias e horas em que ela fotografa); ela muda em Serviços > Horários, e o site segue. (4) Claude: conferir o domínio no ar e pôr `biamaidafotografia.com.br` em primeiro nos domínios do site no painel |
| **Esperando a Renderiza** | a validação dela por escrito; o domínio no Registro.br (o DNS para o Cloudflare); o pagamento |
| **Última atualização** | 18/11/2026 (o "Sua data" ligado à agenda online, por dia e turno) |

Para ela validar: https://www.renderizaweb.com.br/demo/bia-maida-fotografia (no ar até 20/11/2026 no Painel de
prospecção; se a validação passar disso, estender no card do lead, seção Demo).

## O que já existe (não refazer)

- **O site** é `demos/bia-maida-fotografia/index.html`, **feito à mão** (não sai do `gerar-fotografia.py` como o da
  Rafaela): `python3 -I ferramentas/demo/gerar-fotografia-eventos.py demos/bia-maida-fotografia <pasta das fotos>`, com o
  modelo `ferramentas/demo/modelos/bia-maida-eventos.html` e a chave `eventos` do `demo.json` (textos, fotos, recortes e
  as três galerias, com a descrição de cada foto). Nunca editar o `index.html` à mão. **Não rodar o `gerar-fotografia.py`
  nesta pasta**: ele volta o site para a versão 1.
- **As fotos brutas** ficam fora do repositório: o Drive dela (pasta compartilhada com a Renderiza em 13/11, subpastas
  `eventos`, `ensaios externos` e `corporativo`). Para gerar de novo, baixe e dê o nome `<e|x|c>-<número do IMG>.jpg`
  (ex.: `IMG_9999-1 (553).jpg` em eventos = `e-9999-553.jpg`), junte `perfil.webp`, `simbolo.webp` e `favicon.png`
  (tirados do `index.html` de `9d6bbf8`) e rode o gerador. A `ficha.md` diz quais ficaram de fora e por quê.
- **"Sua data"** é a agenda do site hoje: a pessoa escolhe o tipo (aniversário, chá de bebê, casamento, batizado, evento
  de empresa, ensaio externo, corporativo, outro), o dia e o lugar, e o WhatsApp dela abre com a mensagem pronta. Não
  depende de nada: é a versão inicial que fica de pé sem o painel.
- **No painel:** o Meu site (editor ao vivo, indicadores), a API pública, a agenda online de fotografia (horários de
  início por ensaio, campanhas com vagas) e a de eventos (por dia e turno), tudo na produção desde a Rafaela.

## As paradas (o modelo do README, com o que é dela)

### A · O site no repositório dela
**Chegou quando:** o site abre na hospedagem dela, igual à versão validada, sem nada da Renderiza.

| | Quem | O quê |
|---|---|---|
| A1 ✅ | Renderiza | GitHub dela (`biamaidafotografiadev-alt`), repositório **privado** `biamaidafotografiadev-alt/biamaidafotografia` (vazio em 18/11), a Kaue7almeida como colaboradora com escrita (conferido em 18/11 por um envio de ensaio, sem gravar nada; o Renderiza e o dela na mesma sessão, com o GitHub do claude.ai na Kaue7almeida) |
| A2 ✅ | Claude | `demos/bia-maida-fotografia/site.json` (domínio `biamaidafotografia.com.br`, nome, cor `#1f5470`, o ícone do monograma, a prévia do link centrada na bebê e no pai, dados para o Google: fotógrafa em São Paulo, sem endereço de estúdio, nota 5,0 com 116 avaliações). Sem `"painel"` por enquanto: ele entra na Parada C |
| A3 ✅ | Claude | Gerado (`npm run site -- bia-maida-fotografia`: 116 KB de página, 104 fotos em `img/`, 14 MB no total), conferência "tudo certo" (depois de corrigir o falso "todo" da conferência), o teste de uso inteiro no site gerado, servido como o Cloudflare serve. Subiu para a `main` dela em 18/11 (`fa814c7`) |
| A4 ✅ | Renderiza | **Cloudflare Pages** na conta dela: projeto `biamaidafotografia`, ligado ao repositório, publicação automática a cada envio na `main`. No ar em https://biamaidafotografia.pages.dev (18/11) |
| A5 ✅ | Claude | Conferido no ar em 18/11: o teste de uso inteiro (computador e celular), as fotos com cache de um ano, os cabeçalhos (`nosniff`, `Referrer-Policy`, `X-Frame-Options`), a prévia do link, `robots.txt` e `sitemap.xml`. Endereço que não existe abre a página inicial (o Cloudflare faz isso sem `404.html`; pendente desde a Rafaela, sem pressa) |

O site tem **84 fotos em alta** (18 MB com elas dentro do arquivo): o `virar-site` tira as fotos para `img/` e a página
fica leve; conferir que o Cloudflare serve as fotos com cache longo (`_headers`).

### B · Revisão
**Chegou quando:** ela aprovou por escrito ("pode publicar") a versão final.

- B1 (Renderiza → Bia): o link e as perguntas de "Conferir com ela", numa mensagem só.
- B2 (Claude): aplicar no `demo.json`/modelo e gerar de novo (a demo e o site mudam juntos).
- B3 (Claude): revisão de layout, acessibilidade, velocidade e Google (título, descrição, dados da empresa, sitemap,
  prévia do link). Feito em 17/11 para a demo; repetir no site gerado.
- B4 (Claude): segurança do site (estático, nenhuma chave, cabeçalhos, nada de dado pessoal dela no repositório).

### C · A ponte (o site fala com o painel), provada no STG
**Chegou quando:** num site de teste dela ligado ao STG, uma edição publicada no Meu site aparece no site; um pedido
feito no site cai no Atendimento; com o painel desligado, o site abre na versão validada e "Sua data" volta ao WhatsApp.

| | O quê |
|---|---|
| C1 ✅ | **Meu site no modelo dela** (18/11; o mapa está no `03`, "O que cada site deixa editar"; o portfólio virou uma lista simples de fotos, montada em linhas no navegador, para dar para incluir, tirar e ordenar fotos): as marcações `data-site-*` no `bia-maida-eventos.html` (textos, botões, as fotos da abertura, do "quem fotografa", do respiro e do contato, as três galerias, os serviços, os depoimentos, o contato, mostrar/esconder). Igual pixel a pixel com e sem as marcações; conferir com `ferramentas/meu-site/extrair.mjs` e registrar no `03` ("O que cada site deixa editar"). A Rafaela é o exemplo (`gerar-fotografia.py` com `"meu_site": true`) |
| C2 ✅ | **Feito em 18/11** (a Renderiza: "dia e turno, mas configurável… cuidado para uma solução não quebrar outra"): o jeito da agenda online virou escolha da conta (migração `20261118200000_jeito_da_agenda`; `05`, "Funções públicas"), a dela por dia e turno; provado no STG (`test/bia-stg/prova.mjs`, 5/5) e a Rafaela igual (`test/rafaela-stg/prova.mjs`, 7/7). O que era a proposta: **"Sua data" com o painel (decidir antes):** ela trabalha **por data** (eventos), não por horário de estúdio. Proposta: a conta dela no nicho fotografia; "Sua data" pergunta ao painel se o dia escolhido está livre (a agenda online de **eventos** já responde dia e turno) e manda o pedido para o Atendimento, com o tipo e o lugar; sem painel, o WhatsApp de hoje. Ver no `04` ("API pública") qual função serve a uma conta de fotografia sem horários de início; se precisar de função nova, migração pelo `scripts/migrar.mjs`, STG antes, com aviso em `missoes.md` |
| C3 ✅ | **`virar-site` com o painel:** ✅ a agenda (18/11: `"agenda": true`; o virar-site reconhece a página que já lê o `RZ_AGENDA_PAINEL` e não cria `/agenda/`); ✅ o Meu site (18/11: `"painel": {"codigo": "bia-maida"}` no `site.json`; o script no `<head>` e o `frame-ancestors` do painel no `_headers`). Falta, com a C2: `"agenda": true` no `site.json`, embutindo o script do Meu site e ligando "Sua data" ao painel (não a página `/agenda/` de eventos) |
| C4 | **Prova no STG:** conta de teste dela, o site gerado apontando para o STG, o caminho inteiro com o Playwright (publicar, pedir, desligar), como em `test/rafaela-stg/` |

### D · A conta dela no painel (produção)
**Chegou quando:** ela entra, vê o site dela no Meu site e a agenda montada.

- D1 ✅ (Claude, 18/11, a pedido da Renderiza): a conta na produção, no mesmo formato do "Criar conta" do Admin
  (`src/admin/contas/nova.js`): "Bia Maida Fotografia", fotografia, código `bia-maida`, WhatsApp, cor `#1f5470`, ativa e
  sem prazo, origem Renderiza, **os 7 módulos** (agenda online, agenda, clientes, contratos, financeiro, atendimento,
  Meu site; como a Rafaela), a conversa de boas-vindas pendente (`ajustes.onboarding.pendente`), o contexto com a demo
  (`contas_contexto`; os dados do catálogo eram da versão 1, com estúdio e Natal: foram com os de hoje, sem endereço,
  com os tipos Aniversário, Chá de bebê, Casamento, Batizado, Evento de empresa, Ensaio externo e Corporativo, os
  mesmos do "Sua data") e o **convite do dono por link** (usuário `biamaida`, `pela_renderiza`; o código foi sorteado
  no banco e não passou pelo chat). **Falta a Renderiza mandar o link:** Admin → a conta → "Mandar o link".
- **Serviços não foram criados à mão** (a Rafaela teve, porque a agenda do site dela precisava): a conversa de boas-vindas
  cria os serviços a partir dos tipos que ela confirma (já vêm marcados do contexto), com a duração do nicho; preço e
  duração ela ajusta em Serviços. Sem horários fixos: ela trabalha por data (ver C2).
- D2 (Claude): ✅ o logo (`https://biamaidafotografia.pages.dev/favicon.png`, 18/11, como a Rafaela; trocar quando ela mandar o logo dela); conferir depois do
  primeiro acesso dela que os serviços nasceram certos.
- D3 ✅ (Claude, 18/11, a pedido da Renderiza: "configure o que fala, meu site"): o site cadastrado em `sites` (código
  `bia-maida`, `conectado`, domínios `biamaidafotografia.pages.dev`, `biamaidafotografia.com.br` e
  `www.biamaidafotografia.com.br`, `conteudo_inicial` do `extrair.mjs` com as 11 seções). O editor abre o primeiro
  domínio: quando o `.com.br` estiver no ar, pô-lo em primeiro. Nada publicado na produção (publicar muda o site dela
  no ar): a edição foi provada com a biblioteca, no navegador. Falta, com a C2: o que "Sua data" pedir.

### E · No ar e entregue
- E1 (Renderiza): o domínio **no CPF ou CNPJ dela**. Livres em 17/11 (RDAP): `biamaidafotografia.com.br`
  (recomendado: igual ao Instagram), `biamaida.com.br`, `biamaidafoto.com.br`, `biamaida.com`, `biamaidafotografia.com`.
  Antes de prometer prazo, conferir no Registro.br se o CPF dela tem um "provedor de serviços" (a lição da Rafaela).
  O DNS vai para o Cloudflare.
- E2 (Claude): `site.json` com o domínio e o `"painel"`, gerar, conferir, subir; os domínios no cadastro do site.
- E3 (Claude e Renderiza): o teste de ponta a ponta na produção (ela muda um texto e publica; um pedido de teste,
  apagado depois com o "pode"; desconectar e reconectar no Admin).
- E4 (Renderiza): o link no Perfil da Empresa no Google e na bio do Instagram, o Search Console com o `sitemap.xml`, os
  acessos com ela (fora do chat), o pagamento. Fechar a ficha (seção "Entrega", modelo no `fechamento.md`).

## Conferir com ela (a mensagem da validação)

1. **Validou?** O que mudar (texto, foto, ordem).
2. **Foto dela:** o "Quem fotografa" usa a do perfil do Instagram, no cenário de Natal do estúdio (760 px). Uma foto
   atual, em alta, fica muito melhor.
3. **Logo:** ela tem o arquivo? O site usa o monograma "BM" feito para a demo.
4. **Autorização de imagem** dos clientes que aparecem (crianças, noivos, a equipe da clínica, o médico com o nome no
   uniforme, a nutricionista): ela tem? Ela mandou as fotos para o site, mas vale ela confirmar.
5. **Textos que são nossos:** "Celebrações · Casamentos e batizados", "Eventos de empresa · Com a equipe e as
   famílias" (o dia das famílias no escritório é dedução pelas fotos), "Marca pessoal", a abertura e "Sua data". As
   palavras dela, do Instagram: a frase da abertura, a citação da criança, "Antes de conhecer o rostinho…" e "Você é o
   principal rosto do seu negócio…".
6. **Até onde ela vai:** o site diz "São Paulo" e "vai até você"; Grande SP também?
7. **Perfil da Empresa no Google:** ainda mostra o endereço do estúdio e terça a quinta das 10h às 16h. Com o estúdio
   fechando, vale virar "atende na região" e mudar o horário (o site manda para as avaliações de lá).
8. **Duas fotos de fora:** a cópia repetida da aplicação com a agulha (`IMG_7943 duplicado(s)`) e um dos dois retratos
   quase iguais do rapaz de camiseta (`IMG_8036`). Voltam se ela quiser.

## Perguntas em aberto (para a Renderiza; não travam o que não depende delas)

1. ~~"Sua data" com o painel~~: por dia e turno (Renderiza, 18/11). Falta ela confirmar os turnos e os dias (pus manhã, tarde e noite, todos os dias) e ligar "Mostrar a agenda no site" em Configurações: até lá, o site fica no WhatsApp.
2. O valor do site e da mensalidade do painel, e quando ela paga (antes do domínio ou na entrega).
3. Os módulos: "todos" (como a Rafaela) confirmado em 17/11.

## Diário de bordo (o mais novo em cima)

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 20/11/2026 | D | **A agenda do site desligada até ela conferir os horários** (a Renderiza: "a gente não tem a agenda real dela ainda"). Ela ainda não tinha entrado no painel (convite não aceito) e nenhum pedido tinha chegado pelo site. Primeiro, o módulo Agenda online desligado (o site voltou ao WhatsApp na hora); depois, o recurso de verdade: a chave **"Mostrar a agenda no site"** em Configurações (`contas.ajustes.agenda.site`; migração `20261120190000_agenda_no_site`, local, STG e produção). A conta criada pelo Admin nasce com ela desligada, e o Início mostra o passo "Mostrar a sua agenda no site". Na conta dela: a chave desligada e o módulo religado; o site segue no WhatsApp até ela ligar. Provas: a dela no STG (6/6, com a chave). A da Rafaela falhou em 3 testes da agenda por causa do calendário (a prova de 16/11 conta os 10 dias da campanha de Natal, e 19/11 já passou; e marca um horário de hoje esperando outros no mesmo dia); as funções da conta dela não mudaram. | Claude, a pedido da Renderiza |
| 20/11/2026 | E | **O kit de divulgação** (passo 9b do `docs/fechamento.md`, a pedido da Renderiza, como o da Rafaela): o vídeo do site no ar (`gravacoes/bia-maida-site.json`, 30,7 s, 1080 × 1920, assinatura @biamaidafotografia), o flyer de Stories, a arte do feed e os textos (legenda, bio, Status, pedido de avaliação no Google), na página **`/kit/bia-maida-fotografia`** com o contador (o card do lead mostra quando ela abre, vê, dá play, assiste até o fim, baixa e copia). O `kit/gerar.mjs` passou a achar a foto pelo `alt` (a demo dela não tem `data-k`). O domínio `biamaidafotografia.com.br` no ar (o `www` ainda não); no painel, o `.com.br` em primeiro nos domínios do site. | Claude, a pedido da Renderiza |
| 19/11/2026 | D | **A conta pronta para ela entrar** (produção, a pedido da Renderiza): os 7 tipos de evento em Serviços (os do "Sua data" e do contexto, com a descrição curta do site e uma cor; assim a conversa de boas-vindas não oferece newborn e afins, e os pedidos do site chegam com o tipo e a cor na Agenda) e a conversa de boas-vindas **pendente de novo** (estava "adiada" pelo teste da Renderiza em suporte, 18/11; o evento do teste apagado, como na Rafaela). Ela ainda não aceitou o convite (vale até 25/11). Falta dela: preço e sinal de cada tipo, prazo de entrega, chave Pix, adicionais, modelo de contrato e os turnos de verdade. | Claude, a pedido da Renderiza |
| 18/11/2026 | C, D | **O "Sua data" ligado à agenda online, por dia e turno**, a pedido da Renderiza ("dia e turno, mas tem que ser configurável… pode subir para prd"). O jeito da agenda virou escolha da conta (Configurações: por horário ou por dia e turno; sem escolha, o do nicho, então nenhuma conta mudou): migração `20261118200000_jeito_da_agenda` (local, STG e produção), o painel seguindo o jeito (Serviços > Horários, a Agenda do dia com cada turno, a reserva) e o site dela: os turnos livres do dia, nome e WhatsApp, pré-reserva de 48 horas; painel fora, desligado ou sem turno: o WhatsApp de antes. Provas no STG: a dela (5/5), a da Rafaela (7/7, igual) e os fluxos do painel (18/18). Na produção: a conta por turno, 21 turnos iniciais, o conteúdo inicial do Meu site com os textos novos do "Sua data"; conferido no ar sem mandar pedido (o dela e o da Rafaela). | Claude, a pedido da Renderiza |
| 18/11/2026 | C, D | **O Meu site ligado**, a pedido da Renderiza ("configure o que fala, meu site"): as marcações no modelo (116, nas 11 seções; o portfólio virou uma lista simples de fotos, com as linhas montadas no navegador, e a página refaz linhas, "Ver mais fotos", faixa e serviço ativo quando o painel muda uma lista); igual pixel a pixel ao de antes no celular e com 0,1 px de diferença no computador. Provado com uma edição pesada (fotos incluídas, tiradas e reordenadas, serviço novo, seção escondida, WhatsApp trocado) e a volta ao original, no computador e no celular. O site cadastrado no painel (produção) e o site dela com o script (`6d157fc`): no ar, a API responde e não há erro no console. A conta conferida lado a lado com a da Rafaela (os mesmos 7 módulos, o site conectado). "Sua data" segue no WhatsApp até a C2. | Claude, a pedido da Renderiza |
| 18/11/2026 | A | **No ar no Cloudflare Pages:** https://biamaidafotografia.pages.dev (a Renderiza ligou o repositório; publica a cada envio na `main` dela). Conferido no ar (teste de uso, cache das fotos, cabeçalhos, prévia, robots e sitemap). O logo da conta no painel aponta para o ícone do site. Falta o domínio. | Claude, a pedido da Renderiza |
| 18/11/2026 | D | **A conta dela no Painel Renderiza (produção)**, a pedido da Renderiza ("configurar todo o painel… igual à Rafaela"): conta, os 7 módulos, o contexto da demo com os dados de hoje, a conversa de boas-vindas pendente e o convite por link (`biamaida`, até 25/11). Lido antes, só leitura, o que a conta da Rafaela tem na produção (o modelo). Sem serviços nem horários à mão (vêm da conversa) e sem o site cadastrado (espera as marcações do Meu site, C1). | Claude, a pedido da Renderiza |
| 18/11/2026 | A | **O site subiu para o repositório dela** (`main`, `fa814c7`), gerado pelo `virar-site` com o `site.json` novo (domínio `biamaidafotografia.com.br`). A conferência travava num falso "todo" ("todo mundo"): `TODO`/`FIXME` agora só contam em maiúsculas (com teste). Testado no site gerado, servido localmente: o teste de uso inteiro passou. | Claude, a pedido da Renderiza |
| 18/11/2026 | A | **O repositório dela ligado à sessão:** `biamaidafotografiadev-alt/biamaidafotografia`, privado e vazio; a escrita conferida pela Kaue7almeida com um envio de ensaio (`--dry-run`, nada gravado). Falta o `site.json` com o domínio e subir o site gerado. | Claude, a pedido da Renderiza |
| 18/11/2026 | B | **No ar para ela validar** (`378806f` na `main`; a Vercel publicou em uns 2 minutos). Conferido no endereço de verdade: o teste de uso inteiro no computador e no celular, a prévia do link (`capa.jpg`, a foto da abertura) e os links (só o WhatsApp, o Google e o Instagram dela). O envio tinha travado em 17/11: o claude.ai estava ligado ao GitHub de dev da Rafaela (a lição de 16/11 no README); resolvido trocando a conta logada no github.com antes de reconectar. A demo segue no ar até 20/11 no Painel de prospecção. | Claude, a pedido da Renderiza |
| 17/11/2026 | B | **A demo virou o site dela, para a validação.** Fora tudo da Renderiza (faixa, preço, pílula, folha, `window.RZ`). As 86 fotos em alta do Drive (eventos 35, ensaios externos 20, corporativo 31): 84 no site, WebP com o lado maior em 2000 px, as três abas iguais às pastas dela, o portfólio montado pelo gerador (linhas de altura parecida, foto inteira, "Ver mais fotos" depois de duas linhas, legenda de cada foto na tela cheia, que só baixa a foto quando chega perto). Casamento, batizado e confraternização entraram (vieram nas fotos dela): serviço "Celebrações", e "Casamento", "Batizado" e "Corporativo" no "Sua data". Os cosméticos saíram (não vieram). Testado: uso de verdade no computador e no celular (39 conferências), sem JavaScript, movimento reduzido, larguras de 320 a 1920, a página publicada no servidor local (116 KB, 105 imagens à parte, prévia do link) e os 222 testes do repositório. | Claude, a pedido da Renderiza |
| 17/11/2026 | — | **A Bia fechou** (site + painel completo). Trilho aberto. | Renderiza |
| 12/11/2026 | demo | Versão 2 (eventos), ajustes pela mensagem dela (estúdio fecha em dezembro; eventos, ensaios externos e corporativo) e do Kaue ("Serviços", "Ver mais fotos"). | Claude |
