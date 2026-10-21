# Renderiza

> Sessão nova do Claude: leia primeiro o [`CONTEXTO.md`](CONTEXTO.md).

Um site só, publicado na Vercel:

| Endereço | O que abre | Quem vê |
|---|---|---|
| `/` | Site público da Renderiza, na ordem de uma venda consultiva (SPIN): o teste de 5 itens, o que o site resolve, como funciona, trabalhos, serviços, quem somos e contato | todo mundo (é o único endereço que o Google pode indexar) |
| `/login` | Login do painel | só você |
| `/painel` | Painel da Renderiza (Ritmo, Pipeline, Conteúdo). Sem sessão, manda para `/login` | só você |
| `/demo/<ótica>` | Demo do site da ótica (ex.: `/demo/otica-catglass`), no ar por 7 dias | quem tiver o link, no prazo |
| `/demo/<ótica>/artes-instagram` | Kit de artes, quando o entregável é esse | quem tiver o link |
| `/flyer/<lead>.png` | Flyer de Stories (1080 × 1920) que vai de cortesia para a ótica; o painel baixa | quem tiver o link |
| `/gravacao/<lead>.mp4` | Vídeo de apresentação da demo (MP4 vertical, ~30 s) para mandar no WhatsApp; o painel baixa | quem tiver o link |
| `/exemplos` | Exemplos de sistema para mandar ao cliente (dados fictícios): painel de gestão e agenda online de um espaço de eventos, com vídeo | quem tiver o link |

- `site/`: o site público. Contatos, foto e trabalhos ficam em [`site/config.mjs`](site/config.mjs);
  como editar: [`site/README.md`](site/README.md).
- `painel/`: o painel. Como funciona e como ligar o Supabase e a Vercel: [`painel/README.md`](painel/README.md).
- `demos/`: uma pasta por ótica (regras abaixo).
- Só vai para o ar o que `scripts/montar-site.mjs` põe em `publico/`: a home (montada a partir de
  `site/`), os arquivos de `site/estatico/`, o painel e os `.html` das demos. Fichas, contexto,
  ferramentas, banco e scripts nunca são publicados.
- Painel, login, demos e `/api` pedem ao Google para não indexar (`vercel.json`). A home não lista as demos.
- `middleware.js` roda na Vercel antes de cada `/demo/...`: demo vencida ou desligada no painel mostra
  "Esta demonstração saiu do ar" (ver "Prazo da demo" abaixo).
- Endereço antigo do painel com aba (`/#pipeline`) leva sozinho para `/painel#pipeline`.
- Rodar no computador: `npm run dev` (site em `http://localhost:5173`, painel em `/painel`, demos em `/demo/<ótica>`).

# Demos

Uma pasta por ótica em `demos/`. Cada pasta é independente: criar ou mexer em uma não afeta as outras.

## Regras

1. **Nome da pasta = código da demo.** É o nome da ótica, em minúsculas e com hífen: `demos/franco-oticas`.
2. **Dentro da pasta, só o que está pronto para mostrar:**
   - `index.html`: a demo do site. Arquivo único, com as fotos dentro, que abre direto no navegador.
   - `artes-instagram.html`: quando o entregável é um kit de artes.
   - `ficha.md`: onde fica, links, situação e o que conferir antes de mandar.
3. **Rascunho não entra.** Pesquisa, fotos brutas e versões intermediárias ficam em `rascunhos/`, que o
   git ignora, ou fora do repositório.
4. **Situação da demo** (na ficha): `na fila`, `em produção` ou `pronta`. O andamento comercial (enviada,
   respondeu, fechou) fica no painel da Renderiza, não aqui.
5. **Demo nova:** crie a pasta e copie `modelo/ficha.md` para ela.

## Como é uma demo de site

- **Carrossel com muitas imagens reais**: donos, equipe, clientes, crianças, produto e fachada. Arte pronta e
  imagem de IA só em último caso.
- **Rostos**: escolher as fotos em que cada pessoa aparece melhor. É o que agrada o dono.
- **Vídeo vira foto**: usar a capa ou um quadro nítido e bem enquadrado. Vídeo no site só se for leve.
- **Site leve**: nada de efeito demais.
- **História**: contar quando a ótica tem uma. Quando não tem, não inventar enchimento.
- **Avaliações do Google sempre**, com depoimentos reais. A nota aparece só se for 4,8 ou mais; abaixo
  disso, só os depoimentos.

## Link da demo

A pasta vira o link: `demos/otica-sales/index.html` fica em `https://<site>/demo/otica-sales`. Toda vez
que uma demo chega na `main`, a Vercel publica sozinha. No painel, o campo **Link da demo** do lead
recebe só o caminho (`/demo/otica-sales`): aparece a etiqueta "demo ↗" na tabela e no kanban, e o
botão "Copiar link da demo para enviar" monta o link completo para mandar à ótica. Sem internet, dá para baixar o `.html` e abrir
direto no navegador.

## Prazo da demo

Toda demo fica no ar por **7 dias** e sai sozinha depois. Quem abrir o link fora do prazo vê o aviso
"Esta demonstração saiu do ar", com um botão para pedir de novo pelo WhatsApp da Renderiza. O prazo fica
na tabela `demos` do Supabase (uma linha por pasta, criada sozinha quando o lead recebe o link da demo) e
se muda no painel, na seção **Demo** do lead: ligar e desligar, escolher o último dia, reabilitar por mais
7 dias ou deixar sem prazo. Se o banco não responder, a demo abre (nunca cai por erro). Regras:
[`CONTEXTO.md`](CONTEXTO.md).

## Vídeo de apresentação

Um MP4 vertical (720 × 1280, ~30 s, ~4 MB) da demo rodando no celular: abertura com a marca da ótica, o site
rolando com legendas e toques (carrossel, botões) e fechamento ("Gostou? É só responder esta mensagem").
Roteiro automático a partir da demo (`node ferramentas/video/roteiro.mjs <pasta>`), ensaio em segundos
(`gravar.mjs … --ensaio`) e gravação em ~3 min (`node ferramentas/video/gravar.mjs gravacoes/<id>.json`).
Fica em `gravacoes/<id-do-lead>.mp4`; vai ao ar em `/gravacao/<id>.mp4` e o lead recebe
`link_gravacao = '/gravacao/<id>.mp4'`. Versão caprichada com `--show`, e o jeito com `--clima=sobrio`,
`descolado` ou `grife` (montagem, rolagem e trilha). Padrão, regras e música: [`CONTEXTO.md`](CONTEXTO.md).
No painel, a seção **Demo** mostra **Assistir** e **Baixar MP4**, e o cabeçalho ganha **Baixar vídeo**.

## Exemplos de sistema (`/exemplos`)

Para quando o cliente pergunta "o que mais vocês fazem?": exemplos de sistema com dados fictícios, que não
saem do ar. Ficam em `exemplos/` (cada arquivo vai ao ar do jeito que está) e são de um espaço de eventos
inventado, a **Villa Alecrim**:

| Endereço | O que é |
|---|---|
| `/exemplos` | A página para mandar: o vídeo, um cartão por parte do sistema e o caminho do pedido até a festa |
| `/exemplos/painel-eventos` | O painel do espaço: visão geral, agenda da equipe, clientes, contratos, financeiro, atendimento e equipe com acessos (`#agenda`, `#financeiro`… abrem direto na parte) |
| `/exemplos/agenda-online` | O que o cliente do espaço usa: escolhe a festa, a data livre, convidados e pacote, e pede a pré-reserva |
| `/gravacao/exemplo-sistema-eventos.mp4` | O vídeo no formato Reels (`gravacoes/exemplo-sistema-eventos.json`, abertura `"estilo": "sistema"`) |

- Os dados ficam em `exemplos/dados-villa-alecrim.js` e saem da data de hoje: a agenda e o financeiro estão
  sempre no mês atual. O painel e a agenda online leem do mesmo arquivo, então as datas livres batem.
- O pedido feito na agenda online fica no navegador de quem testou e aparece no painel (Atendimento e Agenda).
- Sem preço na agenda online (como nas demos); no painel, os valores são do espaço fictício.
- `painel-eventos.html?video=1` põe todas as partes uma embaixo da outra, para o gravador rolar.
- Imagens dos cartões e da prévia do link: `node ferramentas/exemplos/capturas.mjs` (depois de mudar os exemplos
  ou regravar o vídeo).

## Flyer de Stories

Toda demo ganha um flyer de Stories: a cortesia que retoma o contato depois do vácuo. Fica em
`flyers/<id-do-lead>.png` (feito pelo `ferramentas/flyer/gerar.mjs` a partir do `flyers/<id>.json`), vai ao
ar em `/flyer/<id>.png` e o lead recebe `link_flyer = '/flyer/<id>.png'`. No painel, a seção **Flyer para
Stories** do lead mostra a prévia e baixa o PNG. Regras e passo a passo: [`CONTEXTO.md`](CONTEXTO.md).

## Lista

| Ótica | Onde | Entregável | Situação |
|---|---|---|---|
| [Ótica Sales](demos/otica-sales) | São Caetano do Sul | site | pronta · 29/09/2026 |
| [Ótica D&R](demos/otica-der) | São Bernardo do Campo | site | pronta · 29/09/2026 (fotos de 2018) |
| [Óticas Laodiceia](demos/oticas-laodiceia) | Diadema | site | pronta · 29/09/2026 |
| [Amitié Centro Óptico](demos/amitie-centro-optico) | Mogi das Cruzes | site | pronta · 29/09/2026 |
| [Ateliê Óptico Jabaquara](demos/atelie-optico-jabaquara) | Praça da Árvore, São Paulo | site | pronta · 29/09/2026 |
| [Ótica Líder](demos/otica-lider-guarulhos) | Guarulhos | site | pronta · 29/09/2026 |
| [Mogi Ótica](demos/mogi-otica) | Mogi das Cruzes | site | pronta · 29/09/2026 |
| [Ótica Interativa](demos/otica-interativa) | Vila Maria, São Paulo | site | pronta · 29/09/2026 |
| [Lú Elegante (moda e beleza, fora das óticas)](demos/lu-elegante-modas) | Vila São Pedro, São Bernardo do Campo | site | pronta · 01/10/2026 |
| [Clínica MS Odontologia (fora das óticas)](demos/ms-odontologia) | São Carlos, Itapevi | site | pronta · 01/10/2026 (versão 2, fotos novas) |
| [Ótica Nina](demos/otica-nina) | Vila Nova Mazzei, São Paulo | site | versão final · 15/10/2026 (fotos ampliadas, vídeo Reels) · 1ª versão 02/10/2026 (lote 2 · 1ª) |
| [Ótica Boutique dos Óculos](demos/boutique-dos-oculos) | Aclimação, São Paulo | site | pronta · 02/10/2026 (lote 2 · 2ª) |
| [Ótica Haramaki](demos/otica-haramaki) | Vila Perus, São Paulo | site | pronta · 02/10/2026 (lote 2 · 3ª) |
| [Nova Ótica Bonsucesso](demos/nova-otica-bonsucesso) | Cidade Nova Bonsucesso, Guarulhos | site | pronta · 02/10/2026 (lote 2 · 4ª) |
| [Ótica Vitória Mairiporã](demos/otica-vitoria-mairipora) | Centro, Mairiporã | site | pronta · 02/10/2026 (lote 2 · 5ª) |
| [Ótica Martinez Ramos](demos/otica-martinez-ramos) | Planalto Paulista, São Paulo | site | pronta · 02/10/2026 (lote 2 · 6ª) |
| [Ótica Wagner](demos/otica-wagner) | Centro, Poá | site | pronta · 02/10/2026 (lote 2 · 7ª) |
| [Ótica e Relojoaria Dutra](demos/otica-dutra) | Cidade Dutra, São Paulo | site | parada · lote 2 · 8ª (o Instagram do lote é de outra Dutra, em Manaus; a loja real só tem 1 foto no Google) |
| [Ótica Ítalo Setti](demos/otica-italo-setti) | Baeta Neves, São Bernardo do Campo | site | pronta · 02/10/2026 (lote 2 · 9ª) |
| [Cupecê Óticas](demos/cupece-oticas) | Jardim Prudência, São Paulo | site | pronta · 02/10/2026 (lote 2 · 10ª) |
| [Ótica Perfil](demos/otica-perfil) | Tingidor, Embu das Artes | site | pronta · 02/10/2026 (lote 2 · 11ª) |
| [Ótica Pocopetz](demos/otica-pocopetz) | Centro, Mairiporã | site | pronta · 02/10/2026 (lote 2 · 12ª) |
| [Óticas RVN](demos/oticas-rvn) | Perus, São Paulo | site | pronta · 03/10/2026 (lote 2 · 13ª) |
| [Ótica Studio7](demos/otica-studio7) | Centro, Mauá | site | pronta · 03/10/2026 (lote 2 · 14ª) |
| [Lez Ótica](demos/lez-otica) | Jardim Albertina, Guarulhos | site | pronta · 03/10/2026 (lote 2 · 15ª) |
| [Ótica Machado](demos/otica-machado) | Jardim Satélite, São José dos Campos | site | pronta · 05/10/2026 (lote 3 · 1ª) |
| [Óptica Cris Masson](demos/optica-cris-masson) | Centro, Ribeirão Preto | site | pronta · 06/10/2026 (lote 3 · 2ª) |
| [Óptica Universe](demos/optica-universe) | Sítio Pinheirinho, São Paulo | site | pronta · 06/10/2026 (lote 3 · 3ª) |
| [Ótica Flash](demos/otica-flash) | Centro, Nova Iguaçu (RJ) | site | pronta · 06/10/2026 (lote 3 · 4ª) |
| [Ótica Ranulpho](demos/otica-ranulpho) | Campo Grande, Rio de Janeiro | site | pronta · 06/10/2026 (lote 3 · 5ª) |
| [Ótica Six](demos/otica-six) | Centro, Peruíbe | site | pronta · 06/10/2026 (lote 3 · 6ª) |
| [Ótica Plus Optical](demos/otica-plus-optical) | Higienópolis, São Paulo | site | pronta · 06/10/2026 (lote 3 · 7ª) |
| [Ótica Niterói Prime](demos/otica-niteroi-prime) | Icaraí, Niterói (RJ) | site | pronta · 06/10/2026 (lote 3 · 8ª) |
| [Freitas Ótica](demos/freitas-otica) | Méier, Rio de Janeiro | site | pronta · 06/10/2026 (lote 3 · 9ª) |
| [Ótica Personnalité](demos/otica-personnalite) | Jardim Aeroporto, Bauru | site | pronta · 06/10/2026 (lote 3 · 10ª) |
| [Ótica Ponto Xys](demos/otica-ponto-xys) | Centro, Peruíbe | site | pronta · 06/10/2026 (lote 3 · extra, escolhida pelo Kaue) |
| [Consultório Dra. Natiele Silva (dentista)](demos/consultorio-dra-natiele-silva) | Vila Matilde, São Paulo | site | pronta · 08/10/2026 (odonto lote 1 · 3ª) |
| [Sauddá Odontologia (dentista)](demos/saudda-odontologia) | Centro, Biritiba Mirim | site | pronta · 08/10/2026 (odonto lote 1 · 14ª) |
| [Dr. Ítalo Totti · Totti Odontologia (dentista)](demos/dr-italo-totti) | Socorro, Mogi das Cruzes | site | pronta · 08/10/2026 (odonto lote 1 · 13ª) |
| [Clínica ACS Odonto Center (dentista)](demos/clinica-acs-odonto-center) | Cidade Mãe do Céu (Tatuapé), São Paulo | site | pronta · 09/10/2026 (odonto lote 1 · 2ª) |
| [Odonto Mile (dentista)](demos/odonto-mile) | Centro, Itapecerica da Serra | site | pronta · 09/10/2026 (odonto lote 1 · 6ª) |
| [Dra. Karoline Stefani (dentista)](demos/dra-karoline-stefani) | Vila Perus, São Paulo | site | pronta · 09/10/2026 (odonto lote 1 · 7ª) |
| [Dra. Fernanda Ornelas (dentista)](demos/dra-fernanda-ornelas) | Jabaquara, São Paulo | site | pronta · 09/10/2026 (odonto lote 1 · 11ª) |
| [Odontoelis (dentista)](demos/odontoelis) | Guaianases, São Paulo | site | pronta · 09/10/2026 (odonto lote 1 · 12ª) |
| [Clínica Dra. Michele Renteiro (dentista)](demos/clinica-dra-michele-renteiro) | Centro, Franco da Rocha | site | pronta · 09/10/2026 (odonto lote 1 · 16ª) |
| [Dra. Milena Ferreira (dentista, harmonização)](demos/dra-milena-ferreira) | Granja Viana, Cotia | site | pronta · 09/10/2026 (pedido do Kaue, fora do lote) |
| [Clínica Macena Odontologia (dentista)](demos/macena-odontologia) | Vila Romanópolis, Ferraz de Vasconcelos | site | pronta · 14/10/2026 (pedido do Kaue, fora do lote) |
| [Ótica L'oren](demos/otica-loren) | Jardim São Paulo, São Paulo | site | pronta · 13/10/2026 (lote 6 · 1ª, vídeo no formato do Reels) |
| [Óticas Manuella](demos/oticas-manuella) | Parque São Domingos, São Paulo | site | pronta · 13/10/2026 (lote 6 · 2ª, vídeo no formato do Reels) |
| [Ótica Dom Outlet](demos/otica-dom-outlet) | Matriz, Mauá | site | pronta · 13/10/2026 (lote 6 · 3ª, vídeo no formato do Reels) |
| [Ótica Miríades](demos/otica-miriades) | Lavras, Guarulhos | site | pronta · 13/10/2026 (lote 6 · 4ª, vídeo no formato do Reels) |
| [Óticas Gaffa](demos/oticas-gaffa) | Bangú, Santo André | site | pronta · 13/10/2026 (lote 6 · 5ª, vídeo no formato do Reels) |
| [Óticas Inovisão Lapa](demos/oticas-inovisao-lapa) | Lapa, São Paulo | site | pronta · 13/10/2026 (lote 6 · 6ª, vídeo no formato do Reels) |
| [Ótica Latinos](demos/optica-latinos) | Jardim Santa Teresinha, São Paulo | site | pronta · 13/10/2026 (lote 6 · 7ª, vídeo no formato do Reels) |
| [Óticas Lumiare](demos/oticas-lumiare) | Matriz, Mauá | site | pronta · 13/10/2026 (lote 6 · 8ª, vídeo no formato do Reels) |
| [Ótica Indira](demos/otica-indira) | Jardim Popular, São Paulo | site | pronta · 13/10/2026 (lote 6 · 9ª, vídeo no formato do Reels) |
| [Ótica Beauty Eyes](demos/otica-beauty-eyes) | Santa Paula, São Caetano do Sul | site | pronta · 13/10/2026 (lote 6 · 10ª, vídeo no formato do Reels) |
| [Óticas Atlanta](demos/oticas-atlanta) | Vila Valparaíso, Santo André | site | pronta · 13/10/2026 (lote 6 · 11ª, vídeo no formato do Reels) |
| [Óticas Bunny](demos/oticas-bunny) | Centro Empresarial (Jardim São Luís), São Paulo | site | pronta · 13/10/2026 (lote 6 · 12ª, vídeo no formato do Reels) |
| [Óticas Gaiotto](demos/oticas-gaiotto) | Jardim Munhoz Júnior, Osasco | site | pronta · 13/10/2026 (lote 6 · 13ª, vídeo no formato do Reels) |
| [Ótica CatGlass](demos/otica-catglass) | Taboão da Serra | site | pronta · 24/09/2026 |
| [Óticas Perez](demos/oticas-perez) | Mauá | site | pronta · 24/09/2026 |
| [Franco Óticas](demos/franco-oticas) | Franco da Rocha | site | pronta · 24/09/2026 |
| [Ótica Smart](demos/otica-smart) | Pompéia, São Paulo | site | pronta · 24/07/2026 |
| [Ótica Vip Lapa](demos/otica-vip-lapa) | Lapa, São Paulo | site | pronta · 24/07/2026 |
| [Óticas F. Dias](demos/oticas-f-dias) | Ferrazópolis, São Bernardo do Campo | artes para Instagram | pronta · 06/08/2026 |
| [Óticas Supreme](demos/oticas-supreme) | Capão Redondo, São Paulo | artes para Instagram | pronta · 06/08/2026 |
| [Espaço Valladares (eventos)](demos/espaco-valladares) | Freguesia do Ó, São Paulo | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Casa Rabello (eventos)](demos/casa-rabello) | Jardim Novo Carrão, São Paulo | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Chácara BM (eventos)](demos/chacara-bm) | Rio Grande da Serra | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Chácara da Villa (eventos)](demos/chacara-da-villa) | Vila Balneária, São Bernardo do Campo | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Chácara De Boa na Lagoa (eventos)](demos/chacara-de-boa-na-lagoa) | Batistini, São Bernardo do Campo | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Espaço Mary Carvalho (eventos)](demos/espaco-mary-carvalho) | Vila Aparecida, Suzano | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Espaço Thamara D'Valu (eventos)](demos/espaco-thamara-d-valu) | Olaria, Itapecerica da Serra | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Espaço Lira (eventos)](demos/espaco-lira) | Campo Limpo, São Paulo | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Estância Paraíso (eventos)](demos/estancia-paraiso) | Chácara Cuiabá, Itaquaquecetuba | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Jardim Danfesti (eventos)](demos/jardim-danfesti) | Jardim Itapemirim, São Paulo | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Mansão Mikonos (eventos)](demos/mansao-mikonos) | Parque Cruzeiro do Sul, São Paulo | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Recanto Pagliosa (eventos)](demos/recanto-pagliosa) | Vista Alegre, Arujá | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Buffet Terraço Nuevo (eventos)](demos/buffet-terraco-nuevo) | Centro, Diadema | site | pronta · 14/10/2026 (eventos lote 1, vídeo no formato do Reels) |
| [Buffet Che Belle Giardino (eventos)](demos/che-belle-giardino) | Parque Paulistano, São Paulo | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Spazio Maia Buffet (eventos)](demos/spazio-maia-buffet) | Tatuapé, São Paulo | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Ferreira K Eventos (eventos)](demos/ferreira-k-eventos) | Olaria, Itapecerica da Serra | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Buffet Stallieri (eventos)](demos/buffet-stallieri) | Cidade Jardim Cumbica, Guarulhos | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Victor's Festas e Eventos (eventos)](demos/victors-buffet) | Santa Paula, São Caetano do Sul | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Alto da Serra Eventos (eventos)](demos/alto-da-serra-eventos) | Riacho Grande, São Bernardo do Campo | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [MFK Buffet de Eventos (eventos, buffet que vai até a festa)](demos/mfk-buffet-de-eventos) | Jardim Odorico, Mairiporã | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Espaço La Ro (eventos)](demos/espaco-la-ro) | Pirituba, São Paulo | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Mansão dos Lima Buffet (eventos)](demos/mansao-dos-lima-buffet) | Jardim Tranquilidade, Guarulhos | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Estação 840 (eventos)](demos/estacao-840) | Centro, Osasco | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Chácara Lasareff (eventos)](demos/chacara-lasareff) | Vila Lídia, Rio Grande da Serra | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Sítio Francilene (eventos)](demos/sitio-francilene) | Parque São Martinho, Mogi das Cruzes | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Chácara Luz da Natureza (eventos)](demos/chacara-luz-da-natureza) | Parque Mirante de Parnaíba, Santana de Parnaíba | site | pronta · 15/10/2026 (eventos lote 2, vídeo no formato do Reels) |
| [Espaço Canto da Terra (eventos)](demos/espaco-canto-da-terra) | Santana, Pindamonhangaba | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Casa Samanta Fonseca (eventos)](demos/casa-samanta-fonseca) | Parque São Martinho, Mogi das Cruzes | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Espaço Prime Eventos (eventos)](demos/espaco-prime-eventos) | Chácaras Recreio Alvorada, Hortolândia | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Villa La Feria (eventos)](demos/villa-la-feria) | Rod. Raposo Tavares, Sorocaba | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Espaço 41 (eventos)](demos/espaco-41) | Jardim Emília, Sorocaba | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Chácara Perracine (eventos)](demos/chacara-perracine) | Vila Perracini, Poá | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Casa Le Charme (eventos)](demos/casa-le-charme) | Jardim Europa, Itapecerica da Serra | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Espaço Banquett (eventos)](demos/espaco-banquett) | Ponte Grande, Mogi das Cruzes | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Espaço Mirante Biritiba (eventos)](demos/espaco-mirante-biritiba) | Jardim dos Eucaliptos, Biritiba Mirim | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [O Poço Encantado (eventos)](demos/o-poco-encantado) | Jardim Santo Amaro, São Paulo | site | pronta · 16/10/2026 (eventos lote 3, vídeo no formato do Reels) |
| [Chácara Ouro Verde (eventos e hospedagem)](demos/chacara-ouro-verde) | Soares, Juquitiba | site | pronta · 16/10/2026 (eventos lote 3, vídeo no formato do Reels) |
| [Espaço Reserva da Ilha (eventos)](demos/espaco-reserva-da-ilha) | Fazenda da Ilha, Embu-Guaçu | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
| [Espaço Império Eventos (eventos)](demos/espaco-imperio-eventos) | Vossoroca, Votorantim | site | pronta · 16/10/2026 (eventos lote 3, vídeo no formato do Reels) |
| [Mansão Jaraguá (eventos)](demos/mansao-jaragua) | Vila Clarice, São Paulo | site | pronta · 16/10/2026 (eventos lote 3, estilo gala, vídeo no formato do Reels) |
