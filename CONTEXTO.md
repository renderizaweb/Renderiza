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
  **4,8 ou mais**; abaixo disso, só os depoimentos.
- Arquivo único `index.html` com as fotos dentro, que abre direto no navegador.
- Referência de acabamento: as demos prontas em `demos/otica-catglass`, `demos/oticas-perez` e
  `demos/franco-oticas` (as mais recentes).

## Fila atual (aprovada pelo Kaue em 29/09/2026)

Uma por vez, nesta ordem. A direção específica de cada uma está na `ficha.md` da pasta.

| # | Pasta | Nota da triagem | Resumo do que ele disse |
|---|---|---|---|
| 1 | `otica-sales` | 9,5 | Rostos bonitos, donos como modelos, muita foto real. Muita imagem = sucesso. |
| 2 | `otica-der` | 9 | Uma das melhores: equipe, donos, produto, crianças, tudo recente e nítido. |
| 3 | `oticas-laodiceia` | 8,5 | Muita arte misturada: garimpar só fotos reais de pessoas e donos. |
| 4 | `iadala-otica` | 8 | Site deles caiu (resolver o problema). A senhora é vaidosa: dar destaque. Não pesar. |
| 5 | `amitie-centro-optico` | 8 | Já tem site simples (Google): fazer um bem mais bonito, contando a história. |
| 6 | `atelie-optico-jabaquara` | "muito bom" | Fora da curva, muito estilo: o site tem que ser uma arte em si. Desde 1951. |
| 7 | `otica-lider-guarulhos` | 7 | Casal de donos, clientes, fachada, crianças. Muito vídeo: transformar em foto. |
| 8 | `mogi-otica` | 6 a 7 | Pouca foto real, muita arte de IA. Garimpar. |
| 9 | `otica-interativa` | 6 | O bom está nos vídeos: usar capas ou quadros. |

Descartadas: Embu Ótica (já negociou, não quis), Estância, Suzan, Ótica e Relojoaria Santo Amaro.

As 9 já estão no painel (Supabase) como **Leads a trabalhar**, com id igual ao nome da pasta
(`otica-sales`…), próxima ação "Criar demo (Nª da fila)" e as observações do Kaue.

## Quando uma demo fica pronta

1. `demos/<pasta>/index.html` na `main` deste repositório: a Vercel publica em `/demo/<pasta>`.
2. No painel (Supabase), no lead da ótica: `link_demo = '/demo/<pasta>'` (caminho relativo, sem o
   domínio), etapa `demo_criada` e próxima ação atualizada. O painel mostra a etiqueta "demo ↗" na
   tabela e no kanban, e o botão "Copiar link da demo para enviar" nos detalhes monta o link completo.
3. Atualizar a `ficha.md` (situação `pronta · data`) e a tabela do `README.md`.

## Material de cada ótica

- O Kaue separou fotos e referências de cada ótica e sobe como zip em `referencias-demos/` do
  repositório `garimpo-brasuca` (branch `claude/optica-demo-personalizada-ssalu4`), um zip por ótica
  com o nome da pasta (`otica-sales.zip`…). Esse material bruto não vai para o repositório da Renderiza.
- **Avaliações do Google: o Claude pega sozinho** na hora de fazer a demo.
- O Instagram bloqueia leitura automática a partir da nuvem (429 / pede login). Por isso as fotos vêm
  do zip do Kaue.

## Como pegar dados do Google Maps daqui

- `ferramentas/achar-lugar.mjs` (id do lugar) e `ferramentas/avaliacoes-google.mjs` (endereço, telefone,
  horário e depoimentos): o caminho usado a partir da Ótica Sales.
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

## Repositório e site

- **Oficial: `renderizaweb/renderiza`, branch `main`.** Painel e demos no mesmo repositório e no mesmo
  site da Vercel: `/` é o painel (login, só o Kaue), `/demo/<ótica>` é a demo pública. As demos novas
  são feitas e enviadas aqui.
- **Painel** (`painel/`, detalhes em `painel/README.md`): Ritmo, Pipeline e Conteúdo, com Supabase.
  Situação em 29/09/2026:
  - Supabase ligado: projeto `gxdwluswpczlfgvzxqvg` (`https://gxdwluswpczlfgvzxqvg.supabase.co`),
    `schema.sql` rodado, usuário do Kaue criado, novos cadastros desligados.
  - Vercel com `SUPABASE_URL` e `SUPABASE_ANON_KEY` (chave pública `sb_publishable_…`): o login
    funciona no endereço principal.
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
- As pastas `renderiza-demos/` e `painel-renderiza/` do `kaue7almeida/garimpo-brasuca` foram cópias
  provisórias e pararam de ser atualizadas.
- Os zips de referência (fotos brutas) continuam em `referencias-demos/` do garimpo-brasuca, branch
  `claude/optica-demo-personalizada-ssalu4`: material bruto não entra neste repositório.
