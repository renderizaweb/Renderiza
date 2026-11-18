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
| **Parada** | B · Revisão: a versão final está no ar para ela validar |
| **Feito** | A demo virou o site dela (17/11): sem nada da Renderiza (faixa, preço, pílula, folha), com as **86 fotos em alta** que ela mandou no Drive em 13/11 (84 no site), três categorias iguais às pastas dela, serviços e "Sua data" com os tipos de evento das fotos. Testado no computador e no celular |
| **Próxima ação** | (1) A Renderiza manda o link para ela validar (abaixo) e as perguntas de "Conferir com ela". (2) Enquanto isso: GitHub e Cloudflare dela (A1, A5), o domínio (E1) e a conta no Admin (D1) |
| **Esperando a Renderiza** | a validação por escrito; o domínio; o repositório dela; o pagamento |
| **Última atualização** | 18/11/2026 (no ar para validar) |

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
| A2 | Claude | `demos/bia-maida-fotografia/site.json` (domínio, nome, cor `#1f5470`, ícone do monograma, dados para o Google: fotógrafa, São Paulo, sem endereço de estúdio) |
| A3 | Claude | Gerar (`npm run site -- bia-maida-fotografia`), conferir (`scripts/conferir-site.mjs`), olhar no celular e no computador, subir para o repositório dela |
| A4 | Renderiza | **Cloudflare Pages** na conta dela (fluxo "legacy Pages": Connect to Git, preset None, sem build, saída `/`). Mandar o endereço `….pages.dev` |
| A5 | Claude | Conferir no ar: fotos, tela cheia, "Sua data", WhatsApp, prévia do link, cabeçalhos; a página "não encontrada" (pendente desde a Rafaela) |

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
| C1 | **Meu site no modelo dela:** as marcações `data-site-*` no `bia-maida-eventos.html` (textos, botões, as fotos da abertura, do "quem fotografa", do respiro e do contato, as três galerias, os serviços, os depoimentos, o contato, mostrar/esconder). Igual pixel a pixel com e sem as marcações; conferir com `ferramentas/meu-site/extrair.mjs` e registrar no `03` ("O que cada site deixa editar"). A Rafaela é o exemplo (`gerar-fotografia.py` com `"meu_site": true`) |
| C2 | **"Sua data" com o painel (decidir antes):** ela trabalha **por data** (eventos), não por horário de estúdio. Proposta: a conta dela no nicho fotografia; "Sua data" pergunta ao painel se o dia escolhido está livre (a agenda online de **eventos** já responde dia e turno) e manda o pedido para o Atendimento, com o tipo e o lugar; sem painel, o WhatsApp de hoje. Ver no `04` ("API pública") qual função serve a uma conta de fotografia sem horários de início; se precisar de função nova, migração pelo `scripts/migrar.mjs`, STG antes, com aviso em `missoes.md` |
| C3 | **`virar-site` com o painel:** `"painel": {"codigo", "agenda": true}` no `site.json`, embutindo o script do Meu site e ligando "Sua data" ao painel (não a página `/agenda/` de eventos) |
| C4 | **Prova no STG:** conta de teste dela, o site gerado apontando para o STG, o caminho inteiro com o Playwright (publicar, pedir, desligar), como em `test/rafaela-stg/` |

### D · A conta dela no painel (produção)
**Chegou quando:** ela entra, vê o site dela no Meu site e a agenda montada.

- D1 (Renderiza): a conta no Admin (fotografia), **todos os módulos** (como a Rafaela), o convite pelo WhatsApp.
- D2 (Claude, com a Renderiza): os tipos de evento e de ensaio em Serviços, a agenda (dias de trabalho, folgas), o
  logo, o WhatsApp; a demo ligada à conta (`contas_contexto`) e a conversa de boas-vindas pendente (como a Rafaela).
- D3 (Claude, com o "pode"): o que a Parada C pedir na produção; o site cadastrado em `sites` (código, domínios,
  `conteudo_inicial` do `extrair.mjs`).

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

1. "Sua data" com o painel: por dia (proposta da C2) ou por dia e turno? Ela quer os pedidos no Atendimento?
2. O valor do site e da mensalidade do painel, e quando ela paga (antes do domínio ou na entrega).
3. Os módulos: "todos" (como a Rafaela) confirmado em 17/11.

## Diário de bordo (o mais novo em cima)

| Data | Parada | O que aconteceu | Quem |
|---|---|---|---|
| 18/11/2026 | A | **O repositório dela ligado à sessão:** `biamaidafotografiadev-alt/biamaidafotografia`, privado e vazio; a escrita conferida pela Kaue7almeida com um envio de ensaio (`--dry-run`, nada gravado). Falta o `site.json` com o domínio e subir o site gerado. | Claude, a pedido da Renderiza |
| 18/11/2026 | B | **No ar para ela validar** (`378806f` na `main`; a Vercel publicou em uns 2 minutos). Conferido no endereço de verdade: o teste de uso inteiro no computador e no celular, a prévia do link (`capa.jpg`, a foto da abertura) e os links (só o WhatsApp, o Google e o Instagram dela). O envio tinha travado em 17/11: o claude.ai estava ligado ao GitHub de dev da Rafaela (a lição de 16/11 no README); resolvido trocando a conta logada no github.com antes de reconectar. A demo segue no ar até 20/11 no Painel de prospecção. | Claude, a pedido da Renderiza |
| 17/11/2026 | B | **A demo virou o site dela, para a validação.** Fora tudo da Renderiza (faixa, preço, pílula, folha, `window.RZ`). As 86 fotos em alta do Drive (eventos 35, ensaios externos 20, corporativo 31): 84 no site, WebP com o lado maior em 2000 px, as três abas iguais às pastas dela, o portfólio montado pelo gerador (linhas de altura parecida, foto inteira, "Ver mais fotos" depois de duas linhas, legenda de cada foto na tela cheia, que só baixa a foto quando chega perto). Casamento, batizado e confraternização entraram (vieram nas fotos dela): serviço "Celebrações", e "Casamento", "Batizado" e "Corporativo" no "Sua data". Os cosméticos saíram (não vieram). Testado: uso de verdade no computador e no celular (39 conferências), sem JavaScript, movimento reduzido, larguras de 320 a 1920, a página publicada no servidor local (116 KB, 105 imagens à parte, prévia do link) e os 222 testes do repositório. | Claude, a pedido da Renderiza |
| 17/11/2026 | — | **A Bia fechou** (site + painel completo). Trilho aberto. | Renderiza |
| 12/11/2026 | demo | Versão 2 (eventos), ajustes pela mensagem dela (estúdio fecha em dezembro; eventos, ensaios externos e corporativo) e do Kaue ("Serviços", "Ver mais fotos"). | Claude |
