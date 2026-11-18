# Planilha financeira sob medida (Estúdio Vivian Piacenti, 18/11/2026)

Pedido do Kaue em 18/11/2026: a Vivian (Estúdio Vivian Piacenti, demo `vivian-piacenti-fotografia`) recusou o Painel
Renderiza ("não é útil para ela"), mas perguntou se a gente faz uma **planilha personalizada**. Pesquisa, proposta e o
que já está feito.

## A resposta curta

- **Dá para fazer, e já está feita.** Arquivo do Excel (`.xlsx`) que soma sozinho, mês a mês, com tudo o que ela pediu.
  Gerado por `ferramentas/planilha/gerar-planilha.py` e conferido no LibreOffice: as contas batem, mês a mês, com os
  lançamentos de exemplo.
- **O melhor formato é o `.xlsx` sem macro.** Abre igual no Excel e no Google Planilhas, no computador e no celular (o app
  Excel é grátis no celular). Macro não roda no celular e o Excel bloqueia macro em arquivo baixado da internet.
- **Na Renderiza:** a demo `/demo/vivian-piacenti-planilha` mostra como funciona, baixa a **versão de teste** (com dados
  inventados) e, depois do Pix, libera **a dela** com um código. É uma demo como as outras: com o lead
  `vivian-piacenti-planilha` no painel, ganha a tela Atividade (quem abriu, baixou o teste, digitou o código), o prazo de 7
  dias, "Copiar link da demo", "Copiar mensagem" e a prévia com a foto do estúdio dela no WhatsApp.
- **Valor:** R$ 120, valor único (o que o Kaue sugeriu). Está abaixo do mercado (abaixo); vale porque a base serve para
  outras fotógrafas.

## O que ela pediu (WhatsApp, 18/11/2026)

- "Do Excel, que vai somando sozinho, por mês."
- Uma parte de **gastos fixos pessoais**.
- **Gastos do estúdio por nicho**: aluguel, bexigas, cenários, luz.
- Uma **aba de foto extra**.
- Uma **aba de gastos mensais**: Uber, Shopee, Mercado Livre.
- "Com a opção de escrever o que é cada gasto e cada valor."
- "Preciso de mais linhas pras coisas." "Queria tudo bem específico pra eu entender meus gastos e ganhos."
- "Espaço para aniversários, ensaios."
- Não é de tecnologia: se for complexa, não vai dar certo.

## A planilha de hoje (feita pelo marido) e onde ela falha

Pela foto que ela mandou: Saldo; Receitas em 3 linhas (Ensaios-Estúdio, Externos, Extras); Despesas em linhas fixas
(Cartão de Crédito, Colégio-Isa, Condomínio, Energia, Internet, Gás, Seguro de vida, Convênio Odonto, Celular, Mei, Emily,
Luz Estúdio, Aluguel); e um bloco "Cartão de Crédito" com a compra (dr consulta, R$ 139).

- **O cartão é uma linha de gasto.** A compra some lá dentro (não dá para saber se foi bexiga, consulta ou Shopee), e é
  fácil contar duas vezes (a compra e a fatura).
- **Estúdio e casa misturados** (Luz Estúdio, Aluguel e MEI no meio de Colégio e Condomínio): não dá para saber se o
  estúdio se paga.
- **Receita em 3 linhas:** não mostra qual ensaio rende (aniversário, smash, Natal…).
- **Linhas fixas, sem espaço para escrever o que foi**, e poucas.
- **Só o saldo**, sem resumo do mês.

## Como é a planilha nova

| Aba | Para quê | Como ela usa |
|---|---|---|
| **Início** | O mês em números grandes: entrou, saiu, sobrou ("ficou no azul/vermelho"); de onde veio e para onde foi; o estúdio deu; o ensaio que mais rendeu; o maior gasto; quanto foi no crédito; a rosquinha | Troca o mês na setinha |
| **Resumo do ano** | Os 12 meses lado a lado, cada tipo de ensaio e de gasto, o que sobrou, a sobra acumulada e o gráfico | Só olha (sozinho) |
| **Ensaios** | Aniversários e ensaios | Data, cliente, tipo (setinha), valor, observação |
| **Fotos extras** | A aba que ela pediu | Data, cliente, quantas fotos, valor |
| **Estúdio** | Aluguel, luz, bexigas, cenários, figurinos, bolo do smash, MEI… (14 tipos) | Data, o que foi, tipo, valor, como pagou |
| **Fixos pessoais** | Como a planilha de hoje: a conta numa linha, os meses lado a lado, o dia em que vence (30 contas) | Escreve o valor no mês |
| **Gastos do mês** | Uber, Shopee, Mercado Livre, mercado, iFood, farmácia… (10 tipos) | Data, o que foi, tipo, valor, como pagou |
| **Categorias** | As opções das setinhas, com espaço em branco para criar outras (aparecem sozinhas no Resumo) | Só se quiser mudar |

Decisões e o porquê:

- **Uma linha por coisa** (data, o que foi, tipo, valor) em vez da grade de meses: é o "escrever o que é cada gasto e cada
  valor" dela, cabe quantas linhas precisar (2.000 por aba) e o Resumo separa por tipo e por mês sozinho. Só os **fixos
  pessoais** ficaram na grade, porque é como ela já faz e a conta é a mesma todo mês.
- **O cartão é um jeito de pagar**: cada compra vai no tipo dela e "Como pagou: Crédito". O Início e o Resumo mostram
  quanto foi no crédito, para conferir com a fatura, sem contar nada duas vezes. Os itens de estúdio da planilha antiga
  (Luz Estúdio, Aluguel, MEI) passam para a aba Estúdio.
- **Nada some calado:** sem data, a célula fica vermelha; data de outro ano, laranja; o Início avisa quantos lançamentos
  ficaram fora das contas. Lançamento sem tipo entra em "sem tipo escolhido" (no total, nunca perdido).
- **Ela não quebra sem querer:** Início, Resumo, Fixos (as somas) e Categorias estão protegidos **sem senha** (só as
  células de escrever ficam livres). Para mexer: Revisão › Desproteger planilha.
- **Só fórmulas comuns** (SOMASES, CONT.SES, ÍNDICE, CORRESP, SE), sem macro, sem tabela dinâmica, sem fórmula de Excel 365:
  funciona no Excel antigo, no Google Planilhas e no LibreOffice.
- **Com a cara dela:** o rosa queimado e o nome do estúdio, como na demo.
- **Versão de teste** (`…-TESTE.xlsx`): dados inventados de setembro a novembro (outubro no vermelho por causa do cenário de
  Natal, novembro com a campanha), a faixa amarela "versão de teste" e 60 linhas por aba. **A dela**: limpa, 2.000 linhas.
- **Tipos de ensaio** tirados da bio dela (Bebês, Acompanhamento mensal, Gestantes, Feminino, Aniversários) e da campanha de
  Natal; Smash the cake, Família, Páscoa/Dia das Mães e Ensaio externo são sugestões. Confirmar com ela.
- **Uma planilha por ano** (os fixos são uma grade de janeiro a dezembro). Em janeiro, a de 2027 sai do mesmo script
  (`--ano 2027 --mes 1`).

## Como ela testa antes de pagar (o que pesquisei)

| Jeito | Para ela | Para nós | Veredito |
|---|---|---|---|
| **Baixar o arquivo de teste** (na demo/proposta) | Toca, abre no Excel ou no Planilhas, mexe à vontade | Nada a mais | **Feito.** É o arquivo de verdade |
| Google Planilhas por link | Abre sem baixar, mas pede conta do Google | Subir no Drive do Kaue, converter, compartilhar | Opcional: o link vai em `"online"` no `planilha.json` |
| Excel na web embutido (OneDrive, "deixar digitar") | Digita no navegador, nada fica salvo | Conta Microsoft; há relatos de quadro em branco | Opcional, mesmo campo `"online"`; testar antes |
| Refazer a planilha como página web | Funciona no navegador | Muito trabalho, e o que ela testa não é o arquivo que leva (e é o que o Painel já faz) | Não recomendo |

Fontes: [Microsoft, incorporar pasta de trabalho do OneDrive](https://support.microsoft.com/en-gb/excel/share-it-embed-an-excel-workbook-on-your-web-page-or-blog-from-onedrive),
[relato de quadro em branco](https://techcommunity.microsoft.com/discussions/onedriveforbusiness/onedrive-no-longer-creating-functional-iframe-sharing-links/4549101/replies/4550294),
[digitação não salva](https://learn.microsoft.com/en-us/answers/questions/5112085/embed-excel-file-using-onedrive).

## A demo (`/demo/vivian-piacenti-planilha`)

- Gerada por `ferramentas/planilha/gerar-pagina.mjs` a partir do `demos/vivian-piacenti-planilha/planilha.json` (textos em
  `"pagina"`). Como toda demo, é um `index.html` com as imagens dentro, e o build as separa em `/demo/<pasta>/f/` (no ar, a
  página tem 20 KB; as imagens, WebP com um recorte para celular, carregam quando aparecem). Os arquivos para baixar ficam
  ao lado, na pasta da demo: o build passou a publicar `.xlsx` e `.bin` de uma pasta de demo em `/demo/<pasta>/<arquivo>`
  (`scripts/montar-site.mjs`; a trava das demos não segura arquivo, só a página).
- A prévia do link no WhatsApp usa a foto do topo da demo do site dela (`"demo_do_site"`: `/demo/vivian-piacenti-fotografia/capa.jpg`).
- Partes: capa com o Início; "Você pediu. Está aqui." (as frases dela, uma a uma, com onde está cada coisa); como funciona
  (Ensaios, Resumo, gráfico); o cartão de crédito; teste (baixar); investimento (R$ 120, valor único; sem `"valor"`, o bloco
  some); "Já recebeu o código?"; rodapé com o WhatsApp da Renderiza.
- **O código:** a planilha dela vai cifrada (`planilha.bin`, AES-GCM com chave tirada do código por PBKDF2, 600 mil voltas).
  A página decifra no navegador de quem digita o código certo: sem servidor, sem banco. O código (8 letras e números, sem
  0/O e 1/I/L) aceita minúsculas e com ou sem tracinho. **Nunca vai para o git**: fica em
  `rascunhos/planilha/<pasta>/codigo.txt` e vai para ela pelo WhatsApp. Sem a cifrada, a página responde "a sua ainda está
  sendo preparada". O contador registra "baixar-teste", "liberar-planilha", "baixou a dela" e "código errado".
- Testado com o navegador (celular Pixel 7 e computador): a página não passa da largura do celular; o teste baixa idêntico
  ao original; código vazio, errado e certo dão o aviso certo; com o código certo, a planilha dela baixa idêntica byte a byte.
- **Títulos em itálico:** na Cormorant Garamond reta, o navegador põe o acento de "mês", "Você", "Está" fora do lugar. A
  itálica sai certa. **A demo dela tem o mesmo defeito** no título "Quem está atrás da câmera" (o "está"): vale olhar num
  celular de verdade e, se aparecer, corrigir nas demos de fotógrafa que usam essa fonte.

## Valor

- Referências de mercado para planilha sob medida com fórmulas e painel: **R$ 300 a R$ 1.000**
  ([FreelaSemCrise](https://www.freelasemcrise.com.br/quanto-cobrar/automacao-planilhas)); há fotógrafa pedindo exatamente
  isso no Workana ([vaga](https://www.workana.com/job/criacao-de-planilha-inteligente-e-automatizada-para-gestao-completa-de-estudios-de-fotografia)).
  Não achei planilha pronta para fotógrafa brasileira que cubra ensaios e estúdio.
- **R$ 120 está abaixo do mercado**, mas faz sentido: já foi falado com ela, abre a relação (ela recusou o painel) e o custo
  de fazer para outra fotógrafa é trocar o `planilha.json` (nome, cores, categorias) e gerar de novo.
- Na página está "R$ 120, valor único" e o que vem junto (`"o_que_vem"` no `planilha.json`). **Conferir com o Kaue antes de
  mandar**, principalmente "os ajustes que faltarem depois do teste, antes da entrega".

## Passo a passo

1. **Antes de mandar o link:** abrir a versão de teste no Excel e no Google Planilhas (aqui só deu para conferir no
   LibreOffice) e a página num celular de verdade. Pontos de atenção: as setinhas, a proteção das abas e os links "→ aba"
   do Início no Google Planilhas; a data em português (com o Excel em inglês, "05/11" vira 11 de maio).
2. **Publicar:** a demo vai ao ar quando o branch chegar na `main` (a Vercel publica sozinha).
3. **O lead no painel:** `vivian-piacenti-planilha`, separado do lead do site (`vivian-piacenti-fotografia`, que não muda).
   O insert está pronto em `rascunhos/planilha/vivian-piacenti-planilha/lead.sql` (fora do git: tem a conversa): Prontas
   para trabalhar, `link_demo = /demo/vivian-piacenti-planilha`, R$ 120 em valor potencial, tag `planilha`, interesse
   "Interessado" (ela pediu a planilha), o bloco `[WhatsApp · …]` nas Observações, a mensagem abaixo no "Copiar mensagem" e
   um checklist próprio (mandar o link, perguntar do teste, gerar a dela, entregar e deixar sem prazo). O banco cria sozinho
   o prazo de 7 dias; ao mandar o link, use "7 dias a partir de hoje". Atenção: quando o card for para Em andamento, o painel
   registra um primeiro contato, que entra no placar do ciclo como contato novo.
4. **Mandar para ela** (sugestão, um link só; é a mesma do "Copiar mensagem" do card):
   > Oi, Vivian! Fiz a sua planilha do jeito que você pediu: ensaios e aniversários, fotos extras, os gastos do estúdio por
   > tipo (aluguel, bexigas, cenários, luz…), os fixos da casa e os gastos do mês (Uber, Shopee, Mercado Livre). Ela soma
   > tudo sozinha, mês a mês. Montei uma página para você ver como funciona e baixar a versão de teste, com dados de exemplo
   > para mexer à vontade: https://www.renderizaweb.com.br/demo/vivian-piacenti-planilha
   > Se gostar, a sua sai por R$ 120, valor único, já com as suas contas. O que faltar, me fala que eu acrescento.
5. **Ela aprovou e pagou:** pedir os nomes como ela usa (as contas fixas, por exemplo "Colégio da Isa"; a Emily é da casa
   ou do estúdio?; os tipos de ensaio que ela vende de verdade). Pôr no `planilha.json` e gerar:
   ```
   python3 -I ferramentas/planilha/gerar-planilha.py demos/vivian-piacenti-planilha/planilha.json --conferir --imagens
   node ferramentas/planilha/gerar-pagina.mjs vivian-piacenti-planilha --codigo
   ```
   O segundo comando mostra o código. Commit da `planilha.bin` e da página, publicar, deixar a demo **no ar sem prazo** no
   painel, mandar **o arquivo** (`rascunhos/planilha/vivian-piacenti-planilha/Planilha-Estudio-Vivian-Piacenti.xlsx`) e
   **o código** pelo WhatsApp, e fechar o card como ganho (R$ 120). Nomes pessoais ficam só no
   `planilha.json` (nomes de conta, nunca valores) e na cifrada.
6. **Janeiro:** a de 2027 (`--ano 2027 --mes 1`), se combinado.

## Para depois (sem decidir)

- Ela recusou o painel, mas pediu exatamente controle financeiro: o problema existe; o formato que ela quer é **um arquivo
  dela, sem mensalidade e sem login**. Pode virar um produto de entrada para as fotógrafas (a mesma base, com o nome e as
  cores de cada uma), antes do site ou do painel.
- O que ela pediu ajuda a pensar o módulo Financeiro do Painel Renderiza: tipos de ensaio, fotos extras, estúdio × casa e o
  cartão como forma de pagamento.
