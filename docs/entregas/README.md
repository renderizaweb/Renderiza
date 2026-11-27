# Entregas com site e Painel Renderiza

Quando o cliente fecha **o site e o painel** juntos. A entrega só de site continua em [`docs/fechamento.md`](../fechamento.md);
aqui fica o que muda quando o site conversa com o Painel Renderiza (Meu site, agenda online) e o que fomos aprendendo.
Cada cliente tem o seu trilho nesta pasta: [`rafaela-damaceno.md`](rafaela-damaceno.md) (o primeiro),
[`bia-maida.md`](bia-maida.md) e [`ricardo-motors.md`](ricardo-motors.md) (o primeiro com o módulo Estoque, feito em
paradas que várias sessões tocam ao mesmo tempo).

Isto **não está cravado em pedra**: a Rafaela é a primeira. Cada sessão que andar num trilho anota o que aprendeu em
"O que aprendemos" (abaixo) e ajusta o modelo, para o próximo cliente ser mais fácil.

## Como as duas coisas se encaixam

```
 Site do cliente (repositório e hospedagem DELE)              Painel Renderiza (da Renderiza)
 ┌───────────────────────────────────────────┐        ┌─────────────────────────────────────┐
 │ estático: a VERSÃO INICIAL, a que ele     │  lê    │ Meu site: o que ele mudou e publicou │
 │ aprovou (textos, fotos, cores, agenda     │ ─────▶ │ (textos, fotos, preços, depoimentos)│
 │ pelo WhatsApp), tudo dentro do site       │        │                                     │
 │                                           │  pede  │ Agenda: horários livres, campanhas  │
 │ + o script do Meu site e a agenda, que    │ ─────▶ │ com vagas; o pedido entra no        │
 │   pedem à API pública do painel           │        │ Atendimento e vira pré-reserva      │
 └───────────────────────────────────────────┘        └─────────────────────────────────────┘
```

- **O site é um mundo próprio.** É estático e é o que entregamos, ponto. Fica de pé sozinho, sem o painel.
- **O painel muda por cima.** O que o cliente altera no Meu site fica no banco do painel e chega ao site pela API
  pública (`painel.renderizaweb.com.br/api/publico/…`). O site não tem chave nenhuma: só lê a API pública e manda o
  pedido da agenda.
- **Cancelou, volta.** A Renderiza desconecta o site no Admin, a API passa a responder "não encontrado" e o site mostra
  sozinho a versão inicial (e a agenda volta a ser pelo WhatsApp). Ninguém mexe no site. Quem quiser ficar com a última
  versão compra a versão final (`03`, regra 5).
- O contrato completo: [`docs/painel-clientes/03-modulo-meu-site.md`](../painel-clientes/03-modulo-meu-site.md) (Meu site)
  e [`04-arquitetura.md`](../painel-clientes/04-arquitetura.md), "API pública" (agenda online).

## As paradas de um trilho de entrega (o modelo, a partir da Rafaela)

| | Parada | Chegou quando |
|---|---|---|
| A | **O site no repositório dele** | o site abre na hospedagem dele, igual à demo validada, sem nada da Renderiza |
| B | **Revisão** (conteúdo final, layout, Google, segurança) | o cliente aprovou por escrito a versão final do site |
| C | **A ponte** (o site fala com o painel), provada no STG | edição publicada aparece no site, pedido da agenda cai no painel, painel desligado = versão inicial |
| D | **A conta dele no painel** (produção) | ele entra e vê o site dele no Meu site e a agenda dele montada |
| E | **No ar e entregue** | o site está no domínio dele, ligado ao painel, e ele já mudou algo sozinho |

B pode andar junto com C; D depende de C (e das migrações com o "pode" da Renderiza).

## Quem faz o quê

- **Renderiza (Kaue):** fala com o cliente; cria as contas dele (Gmail de dev, GitHub, hospedagem, domínio no CPF/CNPJ
  dele); cria o login dele no Admin; dá o "pode" para migração e função na produção.
- **Claude:** código (gerador, `virar-site`, API, migrações), testes, sobe o site no repositório do cliente, confere
  no ar e mantém o trilho em dia.
- Senha, código e chave **nunca** passam pelo chat. O acesso do Claude ao repositório do cliente é pelo app do Claude
  no GitHub (não é variável de ambiente): repositório privado na conta do cliente → a conta GitHub da Renderiza como
  colaboradora → app do Claude instalado só nesse repositório → `add_repo` na sessão.

## O que aprendemos (o mais novo em cima)

| Data | Cliente | Lição |
|---|---|---|
| 24/11/2026 | Ricardo | **Conferir no ar o que o site pede ao painel, um por um (a lista, a foto), não só o teste local:** a rota das imagens públicas dava 404 na Vercel desde o começo (o nome "pega-tudo" `[...x].js` não vale sem Next.js) e ninguém viu, porque o servidor local serve tudo. E para carregar dados numa conta sem pessoas (o convite ainda não aceito): um login temporário dono, a carga pelo próprio painel, e depois apagar o login e a pessoa numa transação (a regra "pelo menos um dono" barra a remoção do último). |
| 24/11/2026 | Ricardo | **Lista que muda todo dia não vai no Meu site:** o estoque de uma revenda vira um módulo com rota própria na API, e a vitrine do site fica fora das marcações do Meu site. A versão de reserva (o site sem o painel) **não mostra o que pode estar errado**: os carros do dia da entrega sem preço, com "confirme pelo WhatsApp". |
| 24/11/2026 | Ricardo | **Trabalho que depende de banco, painel e site ao mesmo tempo: primeiro o contrato, depois as sessões.** A Parada 0 fixa a tabela, a API e o que o site espera (o Contrato v1 no `12`); daí banco, painel e site andam em paralelo, cada sessão no seu "Mexe em", sem uma esperar a outra. |
| 18/11/2026 | Bia | **O que muda de cliente para cliente vira escolha da conta, não do nicho:** a Bia é fotografia, mas trabalha por data (eventos). Em vez de um caminho só para ela, o jeito da agenda virou um ajuste da conta, com o nicho como padrão (nenhuma conta mudou sozinha). Para não quebrar o que existe: comparar as funções da produção com as migrações antes de trocá-las, e rodar as provas de quem já está no ar (a da Rafaela) junto com a nova. |
| 18/11/2026 | Bia | **Lista editável no Meu site tem de ser plana:** o painel troca os filhos diretos da lista (`data-site-item`), então uma galeria agrupada em linhas (`.linha > .foto`) não deixa incluir nem ordenar fotos. A saída foi a galeria virar uma lista simples e as linhas serem montadas no navegador, refeitas quando a lista muda (`MutationObserver`). O mesmo vale para o que o JavaScript copia ou conta (faixa duplicada, "Ver mais fotos", o serviço ativo): ler da lista, não guardar no carregamento. |
| 18/11/2026 | Bia | **Regra de CSS ampla pega os filhos novos:** pôr a legenda como `<span>` dentro do item fez a `.reveal > *` (a entrada animada) deixá-la sempre à vista. Ao mexer na estrutura para o Meu site, comparar com prints de antes e depois (no celular e no computador), não só os testes de uso. |
| 17/11/2026 | Bia | **Pedir as fotos em alta por categoria (uma pasta por aba do site) funciona:** as pastas viram as abas e a curadoria fica com ela. Vieram coisas que a demo não tinha (casamento, batizado): o site passou a falar delas. |
| 17/11/2026 | Bia | **Foto em alta no site:** WebP com o lado maior em 2000 px dá uns 150 KB por foto e fica nítida na tela cheia. Com 84 fotos, o arquivo da demo passa de 18 MB (as fotos vão dentro), mas publicado cada foto é um arquivo e a página abre com uns 115 KB; a tela cheia precisa de `loading="lazy"`, senão baixa a categoria inteira de uma vez. |
| 17/11/2026 | Bia | **Site feito à mão (sem o `gerar-fotografia.py`) não herda o que o painel precisa:** as marcações do Meu site e a ligação da agenda entram no modelo dela (Parada C). E a agenda dela é por data (eventos), não por horário de estúdio. |
| 17/11/2026 | Rafaela | **Arquivo baixado de novo vira `index (1).html`.** No upload pelo GitHub, ele entra ao lado do `index.html` em vez de substituir, e o site continua o antigo. Antes de subir, renomear para o nome exato; depois, conferir no ar o tamanho do `index.html`. |
| 16/11/2026 | Rafaela | **Quem edita o site precisa ver o site.** A primeira tela do Meu site (lista de partes, gaveta, "Salvar no rascunho", prévia em outra aba) confundiu até a Renderiza: não dava para saber a que cada parte se referia nem se a mudança tinha valido. O que resolveu: o site ao lado, mudando a cada tecla; clicar no site para abrir o campo; uma linha dizendo onde cada parte fica. E **mudar o gerador ou o script do site pede subir o site do cliente de novo**: combinar com o cliente quem sobe (a sessão pode não ter escrita no repositório dele). |
| 16/11/2026 | Rafaela | **A prova no STG pede um site de verdade e o painel de verdade, não imitados.** O `virar-site` aceita `"painel": {"api"}` para apontar o site para o painel local (contra o STG); o domínio `localhost` no cadastro do site deixa o pedido passar. Dois cuidados: o STG do Supabase grátis **pausa** sem uso (reativa pela API, uns 4 minutos) e a API **finge que aceitou** pedido feito em menos de 3 segundos (contra robô): no teste, esperar antes de enviar, senão nada é gravado e o teste engana. O dono de teste com login de usuário (`…@acesso.renderizaweb.com.br`) não recebe o e-mail de pedido novo. |
| 16/11/2026 | Rafaela | **Site com agenda própria (fotografia) não usa a página `/agenda/` de eventos.** A agenda da página continua lá como a versão inicial; o `virar-site` só diz onde está o painel (`window.RZ_AGENDA_PAINEL`) e o painel entra por cima. A campanha da página de Natal casa pelo nome: crie a campanha no painel com o mesmo nome do `demo.json` (ou deixe uma só ativa). Mudança que mexe em `painel-clientes/` não vai para a `main` sem o STG: a `main` publica o painel. |
| 16/11/2026 | Rafaela | **O claude.ai fica ligado a uma conta do GitHub por vez.** Para o Claude ter o repositório do cliente e o da Renderiza na mesma sessão: o GitHub conectado é o da Renderiza (Kaue7almeida), ela é colaboradora (Write) no repositório do cliente **e** o app do Claude está instalado na conta do cliente, só nesse repositório. Só o colaborador não basta. Conectar o GitHub do cliente no lugar funciona para ele, mas tira a escrita no repositório da Renderiza até voltar. Token em variável de ambiente não serve: a sessão só grava em repositório ligado pelo app. |
| 16/11/2026 | Rafaela | **Cloudflare Pages, na prática:** em Workers & Pages → Create, o padrão agora é o Workers (pede `npx wrangler deploy` e configuração no repositório). Para site estático, usar "Continue to Pages" no rodapé (o fluxo "legacy"): Connect to Git, preset None, sem build, saída `/`. Sem `404.html`, endereço que não existe abre a página inicial. |
| 16/11/2026 | Rafaela | **Domínio: confira o CPF/CNPJ no Registro.br antes de prometer prazo.** Se o documento tiver um "provedor de serviços" (revenda de hospedagem) como responsável, o registro direto fica bloqueado: ou registra pelo provedor, ou pede a liberação. |
| 16/11/2026 | Rafaela | **Hospedagem: Cloudflare Pages.** O grátis permite uso comercial (o Hobby da Vercel não). Publica como a Vercel (conectar o GitHub, sem build, saída `/`; `natal.html` sai em `/natal`; o `_headers` do `virar-site` vale lá). O domínio pede o DNS no Cloudflare (trocar os servidores no Registro.br). Variáveis e segredos existem, mas só servem a código de servidor (Pages Functions), nunca ao HTML. |
| 15/11/2026 | Rafaela | A sessão precisa nascer no ambiente certo: com as variáveis `PAINEL_*` e a rede aberta (ambiente "Nuvem kaue"). No "Default", o Drive, o Instagram, o Google e até o site da Renderiza ficam bloqueados. |
| 15/11/2026 | Rafaela | A agenda tem que funcionar no celular como o cliente usa: o "voltar" do aparelho volta um passo, e o "Voltar" não pode ficar embaixo do topo fixo do site. Teste com toques no tamanho de celular, não só cliques. |
| 15/11/2026 | Rafaela | O `virar-site` (até aqui) só sabia transformar uma página; fotógrafa tem o site e a página de Natal. |
| 14/11/2026 | Rafaela | A demo de quem fechou vira a proposta final: sem a faixa nem o preço da Renderiza, com a marca e as fotos reais, e só com o que o painel entrega de verdade. |
