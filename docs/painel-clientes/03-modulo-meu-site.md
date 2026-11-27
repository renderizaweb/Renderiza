# Módulo Meu site: editar o site pelo painel

Pedido de 28/10/2026. O cliente que tem site feito pela Renderiza paga a mensalidade e, pelo painel, atualiza o
site: botões (texto, destino, posição), cores, textos, imagens, galeria, depoimentos, cada seção. Se parar de
pagar e for desconectado, **o site continua de pé, com a versão inicial**. Se quiser ficar com a última versão,
paga um valor adicional pela **versão final**.

## As regras de negócio (não mudam sem decisão registrada no `07`)

1. **O site sempre fica de pé.** Painel fora do ar, conta desconectada, internet lenta, Supabase pausado: o site
   abre com a versão inicial, sem erro na tela e sem buraco.
2. **A versão inicial mora no próprio site.** É a entregue na venda do site (pago uma vez), com textos, fotos e
   cores dentro do HTML. Ela nunca depende do painel.
3. **Editar é serviço da mensalidade.** Enquanto a conta está conectada, o site mostra por cima a última versão
   publicada no painel.
4. **Desconectou, voltou.** Não pagou ou cancelou: a Renderiza desliga a conta (ou o módulo) no painel
   administrativo, à mão, e o site volta sozinho à versão inicial, sem ninguém mexer no site. As versões ficam guardadas pelo prazo dos termos;
   reconectou, a última volta.
5. **Versão final é vendida à parte**: no máximo 3 mensalidades do plano do cliente, entregue em até 10 dias úteis
   depois do pagamento, com a última versão publicada como está; pedida enquanto a conta existe ou até 90 dias depois
   (termos, cláusula 9.4; D37, 30/10/2026). A tela do Meu site avisa essa regra a quem publica. A Renderiza gera o site com o conteúdo final embutido e sem o script
   do Meu site, e entrega no repositório do cliente. Daí em diante o site não depende mais do painel.
6. **Padrão fechado.** Cores, botões, fontes e seções seguem o modelo do site; o cliente escolhe dentro das opções
   que o modelo oferece. Não é um construtor livre de site: é o que protege a qualidade e o "pacote fechado".
7. **Só para site da Renderiza** feito com o modelo preparado (como a agenda online). Os sites já entregues
   precisam ser adaptados antes, e só entram se o cliente quiser.
8. **O site é do cliente e independente** (decisão de 01/10/2026, reforçada em 28/10/2026: domínio, GitHub e Vercel
   no nome dele). A ligação com o painel (Meu site, agenda online) entra só quando o cliente quiser. O site só
   *consulta* a API do painel, que fica no domínio e no banco da Renderiza. É isso que garante o fallback e a regra
   da versão final.

## O que dá para mudar

| O quê | Como | Na primeira versão? |
|---|---|---|
| Textos | títulos, subtítulos, parágrafos, rótulos. Um trecho entre `*asteriscos*` sai na cor de destaque, como os títulos das demos (`Decoração única <em>para a sua festa.</em>`) | sim |
| Botões | rótulo; destino (WhatsApp com mensagem pronta, telefone, rota, link, seção da página); **posição entre as opções da seção** (ex.: abaixo do título, no fim da seção, fixo no rodapé do celular); mostrar ou esconder | sim |
| Imagens | trocar (envio com recorte e compressão), texto alternativo | sim |
| Galeria e carrosséis | incluir, tirar e ordenar fotos | sim |
| Depoimentos | incluir, editar o trecho, ordenar, esconder | sim |
| Seções | mostrar ou esconder | sim |
| Contato | WhatsApp, Instagram, endereço, horário | sim |
| Listas | pacotes, serviços, perguntas frequentes, "o que inclui" | sim |
| Cores | as cores da marca (principal, destaque, fundo), com aviso quando o contraste fica ruim de ler | logo depois |
| Ordem das seções | arrastar para cima e para baixo, entre as seções que o modelo permite mover | logo depois |
| Páginas extras | a página de campanha (ex.: `/natal` das fotógrafas) | depois |

**Não dá para mudar** pelo painel: a estrutura de cada seção, a fonte (talvez uma lista de opções no futuro), o
código, os dados para o Google (endereço oficial, dados estruturados) e o domínio. Isso a Renderiza faz.

## Como funciona por dentro

```
  Site do cliente (domínio e Vercel do cliente)               Painel Renderiza
 ┌──────────────────────────────────────────┐        ┌─────────────────────────────────┐
 │ HTML completo com a VERSÃO INICIAL       │  1. pede a versão publicada             │
 │ (textos, fotos e cores dentro do site)   │ ─────────────────▶ painel.renderizaweb… │
 │                                          │        │  /api/publico/site/<código>     │
 │ + script do Meu site (pequeno, embutido) │ ◀───────────────── (cache de 1 s)         │
 │                                          │  2. JSON com o que mudou                │
 │ 3. aplica por cima do que mudou          │        │                                 │
 │    deu erro, demorou ou 404?             │        │  Supabase: versões (banco)      │
 │    → não faz nada: fica a inicial        │        │            imagens (Storage)    │
 └──────────────────────────────────────────┘        └─────────────────────────────────┘
```

**Feito em 29/10/2026 (Missão 4, bloco B):** o script, as marcações nos geradores de eventos (e na base comum das
óticas), o `virar-site.mjs` com o código do site e a versão final. Os arquivos estão em `ferramentas/meu-site/`
(o script e a biblioteca), `scripts/virar-site.mjs` e `scripts/versao-final.mjs`. O site de teste fica em
`test/site-teste/`, com dados fictícios, e os testes em `test/meu-site.test.mjs`.

1. **O gerador marca o que é editável** (`ferramentas/demo/gerar.py` e `gerar-eventos.py`), com marcações
   `data-site-*` (abaixo, em "O que cada site deixa editar"). Elas não mudam nada no visual: conferido pixel a pixel,
   no celular e no computador, nos estilos comum e "gala". O nome é `data-site` porque as demos de fotografia já
   usam `data-rz` para a faixa de preço da Renderiza.
2. **O script vai no fim do `<head>`** do site do cliente, embutido pelo `virar-site.mjs` quando o `site.json` tem
   `"painel": { "codigo": "<código do site>" }`. Ele pede a versão publicada num endereço **da Renderiza** (nunca
   direto o do Supabase), `https://painel.renderizaweb.com.br/api/publico/site/<código>`.
3. **Veio a resposta (a qualquer momento; até 17/11/2026 era só em até 1,5 s, e quem publicava não via a mudança):** aplica só o que está nela, por cima da versão inicial. Texto entra como texto
   (nunca como HTML), links só dos tipos permitidos, imagens só do endereço do painel. Um campo inválido descarta a
   versão inteira. **Erro, demora ou resposta inválida: não faz nada. "Não encontrado": volta à inicial** e esquece
   a guardada.
4. **Guardada no navegador por 24 horas:** a última versão aparece logo nas visitas seguintes. Se a do painel for diferente
   da guardada, a página volta à inicial e aplica a nova, sem sobrar nada da guardada.
5. **Cache na rede de 1 segundo, como o Estoque** (26/11/2026; antes 20 + 10 s e, até 17/11, 60 + 300) (no endereço do painel): o script pede a versão sempre que o site abre e de novo quando a pessoa volta à aba (no máximo a cada 3 s), então
   uma publicação aparece na próxima vez que o site é aberto ou olhado; a rede ainda junta as visitas do mesmo segundo.
6. **Piscar na primeira visita:** o site abre com a versão inicial e troca pela publicada assim que a página termina
   de carregar. Nas visitas seguintes, a versão guardada entra no mesmo momento. **Validar no piloto**, no celular
   com internet lenta.
7. **Prévia:** `https://<site>/?rz-previa=<código da prévia>` pede `/api/publico/site/<código>/previa?t=<código da
   prévia>`, sem cache e sem guardar nada, e mostra no canto o aviso "Prévia do rascunho".

### Por que não "republicar o site" a cada edição

A outra forma seria, a cada publicação, gerar o site de novo com o conteúdo novo embutido (sem piscar e melhor
para o Google). Não é o padrão porque o site está na conta do cliente: a última versão ficaria gravada nas
publicações dele, e bastaria voltar uma publicação antiga na Vercel para ficar com a versão final sem pagar; e a
Renderiza precisaria de acesso permanente para publicar no projeto do cliente. A consulta ao painel mantém as
regras 3, 4 e 5 simples. Se o piscar incomodar de verdade, dá para reabrir essa discussão (registrar no `07`).

## O formato do conteúdo (contrato v1)

Fechado em 29/10/2026 (Missão 4, bloco B). É o que o painel guarda, o que a API entrega e o que o script aplica. O
site aplica o que entende e ignora o resto: o formato pode crescer sem quebrar sites antigos (`esquema` diz a
versão). A regra que vale é a de `validar()` em `ferramentas/meu-site/meu-site.js`, a mesma no site e no painel.

```json
{
  "esquema": 1,
  "site": "villa-alecrim",
  "versao": 7,
  "publicado_em": "2026-11-20T14:03:00-03:00",
  "secoes": {
    "inicio": {
      "textos": { "titulo": "Casamentos e 15 anos *no meio do verde.*", "texto": "…" },
      "botoes": { "botao": { "rotulo": "Consultar uma data", "acao": "whatsapp", "mensagem": "Olá! Vim pelo site…" } },
      "imagens": { "foto": { "src": "https://painel.renderizaweb.com.br/imagens/sites/villa-alecrim/topo-1a2b3c.webp", "alt": "Salão montado para casamento" } }
    },
    "espaco": { "listas": { "fotos": [{ "de": 2 }, { "de": 0, "imagens": { "foto": { "alt": "Salão principal" } } }] } },
    "depoimentos": { "listas": { "avaliacoes": [{ "textos": { "nome": "Ana", "texto": "…", "tag": "Casamento" } }] } },
    "festas": { "visivel": false }
  },
  "contato": { "whatsapp": "5511900000000", "mensagem": "Olá! Vim pelo site da Villa Alecrim.", "instagram": "villa.alecrim", "telefone": "5511900000000" }
}
```

- **Por cima da inicial:** seção, campo ou item que não aparece no JSON fica como está no HTML. Conteúdo vazio
  (`"secoes": {}`) é a versão inicial.
- **Seção** (`secoes.<seção>`): `visivel` (`false` esconde a seção e os links do menu que levam a ela; o `inicio`
  não some), `textos`, `botoes`, `imagens` e `listas`, cada um por nome de campo. Os nomes têm letras minúsculas,
  números e hífen.
- **Texto:** até 600 caracteres. `*trecho*` sai em destaque só nos títulos; nos outros, os asteriscos saem.
  Texto vazio esconde o elemento.
- **Botão:** `rotulo` (até 60), `visivel` e `acao`, com `destino` e `mensagem` quando precisa:
  - `whatsapp` usa o número do contato e `mensagem` (ou a do contato);
  - `telefone` usa `destino` com 55 e DDD, ou o telefone do contato;
  - `link` aceita só `https://`;
  - `secao` aponta para o id de uma seção da página;
  - `rota` usa um endereço e vira um link do Google Maps;
  - `instagram` usa um usuário, ou o do contato;
  - `email` usa um endereço.
  Destino inválido descarta a versão. O ícone e a seta do botão não mudam.
- **Imagem:** `src` e `alt` (até 200). O site só aceita `src` do mesmo endereço da API, `painel.renderizaweb.com.br`.
  Caminhos do próprio site (`/img/…`, os da versão inicial) passam na validação, mas não mudam nada.
- **Lista** (até 60 itens): cada item nasce de um item da versão inicial, `de` (a posição, começando em 0; sem `de`,
  o primeiro). Ele mantém o que não é editável, como o ícone de cada item da estrutura. Os campos ficam em `textos`
  e `imagens`, e `"visivel": false` tira o item. A ordem do JSON é a ordem na página.
- **Avaliações** (`depoimentos.avaliacoes`): itens com `textos.nome`, `textos.texto` e `textos.tag`; as iniciais
  saem do nome.
- **Contato:** `whatsapp` e `telefone` (só números, com 55 e DDD), `mensagem` (a do WhatsApp, até 500) e
  `instagram` (o usuário). Ele troca todos os botões de WhatsApp e Instagram da página, e o número escrito em
  "Como chegar".
- **Reservado:** `cores` e `ordem` (logo depois, ver "O que dá para mudar"): o script de hoje ignora. O conteúdo
  inicial já traz `ordem` (a lista das seções na ordem da página), porque o banco guarda as chaves do JSON em outra
  ordem; o editor do painel lista as seções por ela.

### O que cada site deixa editar

O mapa de um site é o próprio conteúdo inicial dele: `node ferramentas/meu-site/extrair.mjs <index.html>` devolve,
no formato acima, todos os campos marcados com o valor que está no ar (é o `conteudo_inicial` da tabela `sites`, com
que o editor abre). Nos sites de eventos, hoje:

| Seção | Textos | Botões | Imagens | Listas |
|---|---|---|---|---|
| `cabecalho` (topo e menu) | `aviso` (a faixa de cima) | `botao` | | |
| `inicio` | `eyebrow`, `titulo`, `texto`, `selo` | `botao`, `link` | `foto` | |
| `sobre` | `eyebrow`, `titulo`, `legenda` | | `foto`, `foto2` | `paragrafos` (`texto`), `numeros` (`valor`, `texto`) |
| uma por galeria (ex.: `espaco`, `festas`) | `eyebrow`, `titulo`, `texto` | | | `fotos` (`foto`, `legenda` onde houver) |
| `estrutura` | `eyebrow`, `titulo`, `texto` | | | `itens` (`texto`) |
| `atendimento` | `eyebrow`, `titulo`, `legenda` | `botao` | `foto`, `foto2` | `passos` (`texto`) |
| `depoimentos` | `eyebrow`, `titulo` | | | `avaliacoes` (`nome`, `texto`, `tag`) |
| `consulta` | `eyebrow`, `titulo`, `texto`, `botao` | | | `tipos` (`texto`) |
| `instagram` | `eyebrow`, `titulo`, `texto` | `botao`, `chip`, `link` | `foto` | |
| `visite` | `titulo` | `botao` | | |
| `rodape` | `slogan` | | | |

Nos sites de **fotografia** (`gerar-fotografia.py` com `"meu_site": true` no `demo.json`; sem a opção, a página sai
idêntica), desde 16/11/2026, na página inicial (a de Natal fica para depois). O primeiro é o da Rafaela Damaceno
(`docs/entregas/rafaela-damaceno.md`):

| Seção | Textos | Botões | Imagens | Listas |
|---|---|---|---|---|
| `cabecalho` | | `botao` | | |
| `inicio` | `eyebrow`, `frase`, `texto`, `rotulo`, `rotulo2`, `rotulo3` | `botao`, `link` | `foto`, `foto2`, `foto3` | |
| `portfolio` | `eyebrow`, `titulo`, `texto`, `nota` | | | uma por galeria, com o id dela (ex.: `infantil`): `foto` |
| `sobre` | `eyebrow`, `titulo`, `texto`, `citacao`, `autor` | | `foto`, `foto2` | `paragrafos` (`texto`), `numeros` (`valor`, `texto`) |
| `ensaios` | `eyebrow`, `titulo`, `texto` | | | `itens` (`nome`, `sub`, `texto`, `preco`: começa vazio e vazio não aparece) |
| `depoimentos` | `eyebrow`, `titulo` | | | `avaliacoes` (`nome`, `texto`, `tag`) |
| `natal` (o bloco da campanha) | `eyebrow`, `titulo`, `texto`, `legenda` | `botao` | `foto` | |
| `agendar` | `eyebrow`, `titulo`, `texto` | | | |
| `contato` | `eyebrow`, `titulo`, `texto`, `telefone` | `botao` | | |
| `rodape` | `slogan` | | | |

Na tela cheia das galerias, o toque é lido na galeria (não em cada foto), para valer também nas fotos que o painel troca.

No site de **fotógrafa de eventos** feito à mão (`gerar-fotografia-eventos.py` + `modelos/bia-maida-eventos.html`;
o da Bia Maida, `docs/entregas/bia-maida.md`, desde 18/11/2026), as marcações vêm sempre no modelo:

| Seção | Textos | Botões | Imagens | Listas |
|---|---|---|---|---|
| `cabecalho` | | `botao` | | |
| `inicio` | `eyebrow`, `frase`, `texto`, `prova`, `rotulo`, `rotulo2`, `rotulo3` | `botao`, `link` | `foto`, `foto2`, `foto3` | |
| `faixa` (a faixa que rola) | | | | `itens` (`texto`) |
| `portfolio` | `eyebrow`, `titulo`, `texto`, `nota` | | | uma por aba (`eventos`, `externos`, `corporativo`): `foto`, `legenda` |
| `respiro` (a foto larga) | `eyebrow`, `titulo` | | `foto` | |
| `sobre` | `eyebrow`, `titulo`, `texto`, `texto2`, `citacao`, `autor` | | `foto` | `numeros` (`valor`, `texto`) |
| `servicos` | `eyebrow`, `titulo`, `texto`, `dica` | | | `itens` (`nome`, `sub`, `texto`, `foto`) |
| `depoimentos` | `eyebrow`, `titulo`, `total` | | | `avaliacoes` (`nome`, `texto`, `tag`) |
| `data` ("Sua data") | `eyebrow`, `titulo`, `texto` | | | `passos` (`titulo`, `texto`) |
| `contato` | `eyebrow`, `titulo`, `texto`, `telefone`, `instagram`, `google`, `onde` | `botao` | `foto` | |
| `rodape` | `slogan` | | | |

O portfólio é uma lista simples de fotos (cada uma um `button.g-item` filho direto da `.galeria`) e as linhas de
altura parecida são montadas no navegador, na ordem da lista: é o que deixa incluir, tirar e ordenar fotos (o
`porLista` troca os filhos diretos da lista, então uma lista agrupada em linhas quebraria). A página refaz as linhas,
a conta do "Ver mais fotos", a faixa duplicada e a foto do serviço ativo quando o painel muda a lista
(`MutationObserver`). Provado com uma edição pesada e a volta ao original, no computador e no celular.

Ficam para depois:
- **cores e ordem das seções:** a base das demos deriva as cores de duas, então trocar pede mexer no gerador;
- **posição dos botões;**
- **endereço e horário**, que mexem nos dados para o Google;
- **a mensagem pronta da consulta de data;**
- **as marcações no gerador de odonto** (quando o primeiro cliente quiser o Meu site) e **a página de Natal** das
  fotógrafas.

### O que o painel entrega (blocos A e C da Missão 4)

| | |
|---|---|
| `GET /api/publico/site/<código>` | `200` com o JSON acima (o `conteudo` da última versão publicada, mais `esquema`, `site` = o código, `versao` = o número e `publicado_em`); `404` se o site não existe, está `desconectado` ou em `versao_final`. Cabeçalhos: `Access-Control-Allow-Origin: *` (o site do cliente está em outro domínio) e `Cache-Control: public, max-age=0, s-maxage=60` |
| `GET /api/publico/site/<código>/previa?t=<código da prévia>` | o rascunho, no mesmo formato, enquanto a prévia não expira (`sites_previas`); `404` depois. `Cache-Control: no-store` e o mesmo CORS |
| Imagens | servidas em `https://painel.renderizaweb.com.br/api/publico/imagens/<id da conta>/<arquivo>.webp` (o Storage público `site-imagens`, cache de 1 ano; cada foto enviada ganha um nome novo): o script recusa imagem de outro endereço |
| Validação | antes de publicar, a mesma `validar()` (o arquivo é um só; o painel usa uma cópia conferida por teste, porque a Vercel publica só a pasta `painel-clientes/`) |

## No painel (o que o cliente vê)

Feito em 29/10/2026 (Missão 4C), em `painel-clientes/src/modulos/meu-site/` (as regras sem tela em `conteudo.js`,
testadas em `test/meu-site.test.mjs`); na `main` desde 29/10/2026. No STG, a Villa Alecrim da semente tem o Meu
site ligado e o site de teste `villa-alecrim` cadastrado.

- **Meu site** no menu é um **editor ao vivo** (refeito em 16/11/2026, com o primeiro site real, o da Rafaela; a
  tela de antes, com gaveta e "Salvar no rascunho", confundia quem editava e a prévia não acompanhava): à esquerda, as
  partes do site na ordem da página (o nome, **onde fica no site** em uma linha, "Alterada" no que mudou, "Escondida")
  e "WhatsApp e redes"; à direita, **o site de verdade num quadro** (`https://<1º domínio>/?rz-editor=1`), no tamanho
  de um celular ou de um computador. No celular, a lista ocupa a tela e "Ver o site" abre o quadro por cima.
- **O que se muda aparece na hora no quadro** (o painel manda o rascunho inteiro ao site a cada tecla; ver "O editor
  ao vivo, por dentro") e **grava sozinho no rascunho** pouco depois (a situação diz "Salvando…", "Rascunho salvo.
  Falta publicar." ou "Confira: …" com o que a `validar()` do site recusou). Não existe mais "Salvar no rascunho".
- **Clicar numa parte do site abre o campo dela** no painel (o texto, o botão, a foto, o item da lista), com o cursor
  nele; parar o mouse numa parte da lista, ou entrar num campo, rola o site até ela e destaca.
- Cada parte mostra os campos em grupos: **Textos** (o destaque entre asteriscos), **Fotos** ("Trocar a foto":
  reduzida para até 1600 px e convertida para WebP no próprio aparelho, até 2 MB; a orientação diz o formato em que a
  foto aparece na página e a largura boa, pela medida que o site manda; "Voltar à foto original"; a descrição),
  **Botões** (o que está escrito, o que acontece ao clicar e só o campo que a ação pede: o link, a parte da página
  numa lista, a mensagem do WhatsApp) e as **listas** (cada item recolhido com o nome dele; abrir, mudar, subir,
  descer, tirar e "Adicionar <item>", que nasce do primeiro) e "Esta parte aparece no site" (a capa não some).
- **Descartar mudanças** (com confirmação) deixa o rascunho igual ao que está no ar.
- **Site sem a ponte** (gerado antes de 16/11/2026, ou que não deixa o painel pôr ele num quadro): depois de 7
  segundos sem resposta, o painel oferece "Ver o rascunho no site", que cria um código de prévia e abre o site com
  `?rz-previa=` em outra aba (a faixa "Prévia do rascunho"); editar e publicar funcionam igual.
- **Publicar:** o rascunho vira a versão no ar (o site vê na próxima vez que é aberto). Cada publicação fica em "Versões
  publicadas", com quem publicou.
- **Usar esta** (numa versão antiga) e **Voltar ao site como foi entregue** levam aquilo para o rascunho; publicar
  é que vale.
- **Acesso:** quem tem "edita" no Meu site (o dono ou quem ele deixar) muda, faz prévia e publica; quem tem "só vê"
  olha a lista e as versões, sem botões (decidido em 29/10/2026, `07`).
- **Desconectar** é da Renderiza, pelo Admin (Missão 5): muda `sites.situacao`; o painel avisa que o site está
  desconectado ou com a versão final, e a API passa a responder "não encontrado".
- **Na montagem do site**, a Renderiza grava em `sites.conteudo_inicial` a saída do `extrair.mjs` (é o mapa do que
  dá para editar); sem ele, a tela diz que o conteúdo ainda não foi cadastrado.

### Ligar um site a uma conta (hoje, até o Admin da Missão 5 ter a tela)

Uma sessão faz, nesta ordem:
1. **O site sai do gerador atual.** As demos geradas antes de 29/10/2026 não têm as marcações `data-site-*`: gere de
   novo a partir do `demo.json`, sem mexer na demo (`python3 ferramentas/demo/gerar-eventos.py demos/<pasta>/demo.json
   --saida <pasta-nova>/index.html`; óticas: `gerar.py`). Fotografia e odonto ainda não têm marcações.
2. **O site com o script:** no `site.json`, `"painel": { "codigo": "<código>" }` (e `"agenda": true` para a agenda
   online); `npm run site -- <pasta>`. O código é o do site no painel; pode ser o da conta (`contas.codigo`).
3. **O site no ar** (Vercel do cliente, como sempre; para teste, um `….vercel.app`).
4. **O cadastro no banco** (na produção, só com o "pode" da Renderiza): uma linha em `sites` com `conta_id`,
   `codigo`, `dominios` (os endereços do site, sem `https://`) e `conteudo_inicial` = a saída de `node
   ferramentas/meu-site/extrair.mjs <pasta-do-site>/index.html`; e o módulo `meu-site` ligado em `contas_modulos`.
5. **Conferir:** `GET /api/publico/site/<código>` responde (versão 0 até a primeira publicação), e o Meu site da conta
   lista as partes do site.

Em 30/10/2026 a produção tem uma conta só, "Espaço de teste" (código `espaco-de-teste-7882`, dono
`contato@renderizaweb.com.br`), com o Meu site ligado e sem site: a Renderiza deixou o teste do Meu site na produção
para depois das próximas missões.

## Nos exemplos: o Meu site de verdade com um estúdio fictício (18/11/2026)

`/exemplos/meu-site-fotografia` (link em `/exemplos/fotografia`) abre **este módulo de verdade**, com a casca, para quem
ainda não é cliente testar: o código é uma cópia de `painel-clientes/src` em `exemplos/painel/src` (só o que a casca e o
Meu site importam), o banco é de mentira, no navegador (`exemplos/painel/banco-de-exemplo.js`, com as regras de
`sites_versoes`), e o site é o site de exemplo do Estúdio Ciranda (`/exemplos/site-fotografia`, com as marcações do
gerador de fotografia). O que a pessoa muda e publica fica no navegador dela (o site do exemplo lê de lá; a foto enviada
sai por um service worker). **Quem mudar um arquivo copiado roda `node ferramentas/exemplos/painel-de-verdade.mjs`**
(aviso de 18/11 em `missoes.md`); o `test/meu-site-exemplo.test.mjs` confere a cópia e o caminho inteiro.

## Indicadores: as visitas do site (16/11/2026)

A aba **Indicadores** do Meu site mostra, dos últimos 7, 30 ou 90 dias: as **visitas** (cada página aberta), os
**aparelhos**, o **tempo médio** com a página à vista, o gráfico dia a dia, **as partes mais vistas** (em quantas
visitas a parte ficou no meio da tela e por quanto tempo), **os botões mais clicados** (com a parte e o que está
escrito no botão hoje; o WhatsApp flutuante e os links de WhatsApp contam juntos), **de onde vieram** (o site
anterior: Instagram, Google…; sem site anterior é "Direto") e celular ou computador. Quem vê o Meu site vê os
indicadores.

**Sem cookie e sem identificar ninguém** (decisão da Renderiza: um contador simples, não quem é quem):

- O script do site (`contarVisitas`, no `meu-site.js`) manda por página aberta: um sorteio que só vale naquela página
  (não fica guardado em lugar nenhum do navegador), o caminho, celular ou computador, o site de onde veio, os segundos
  em cada parte e os cliques nos botões. Manda 2 segundos depois de abrir, a cada 30 segundos se mudou e quando a
  página some (`navigator.sendBeacon`). Não conta: robô (`navigator.webdriver`, ou o navegador que a API reconhece
  como robô), a prévia (`?rz-previa=`), o editor do painel e o site com `"painel": { "visitas": false }` no
  `site.json` (o script sai com `data-sem-visitas`).
- A API (`POST /api/publico/site/<código>/visita`, sempre 204) junta o **aparelho**: o endereço e o navegador
  embaralhados com o site e o dia de São Paulo. O endereço e o navegador não ficam guardados, e no dia seguinte o
  mesmo aparelho tem outro valor: dá para contar aparelhos por dia, não dá para seguir ninguém. Por isso "Aparelhos"
  soma os de cada dia (o mesmo celular em dois dias conta duas vezes).
- O banco (`publico_visita`) só aceita do domínio do site, nomes de parte e de botão no formato do contrato e
  números; limites de 200 páginas por aparelho e 20.000 por site no dia; guarda por 13 meses (`sites_visitas`).
  O painel lê só o resumo (`site_indicadores`); ninguém lê a tabela direto.
- **O que falta decidir com cada cliente:** uma linha no rodapé do site dizendo que as visitas são contadas de forma
  anônima, sem cookies (boa prática da LGPD, mesmo sem dado pessoal). O gerador ainda não põe.

### Com o Estoque: os itens mais vistos (26/11/2026)

Quem tem o Estoque vê, logo depois do gráfico, **"Carros mais vistos"** (o nome vem do esquema do nicho): quantas vezes
cada item foi aberto no site e quantos cliques no WhatsApp saíram da página dele (ou do botão do card), do mais visto
ao menos; os que já saíram do Estoque ficam somados numa linha à parte. **Sem mudar o banco:** o site conta com o
`rzContar` do `meu-site.js` ("ver.<id>" a cada item aberto, uma vez por abertura) e o `data-rz-clique` dos botões
("zap.<id>" junto com o clique de WhatsApp de sempre), nos cliques que `publico_visita` já guardava (nomes de até 60
letras, até 40 por visita). "Cliques em botões" e "Os botões mais clicados" não contam esses. Sem item aberto no
período: "Quando alguém abrir um carro no site, ele aparece aqui, com os cliques no WhatsApp." (as visitas de antes
de 26/11 não têm o item; a tela não fala disso). Os nomes também ficaram legíveis: "Estoque (a vitrine)", "Página de um
carro" e "Pelo painel (você ou a equipe)" para quem abre o site pelo painel. Fluxo: `test/fluxos/indicadores-estoque.fluxo.mjs`.

## Situações do site

| Situação | Quando | O que o endereço público responde | O que o site mostra |
|---|---|---|---|
| `conectado` | mensalidade em dia | a última versão publicada | a versão publicada (ou a inicial, se nunca publicou) |
| `desconectado` | a Renderiza desligou a conta ou o módulo (não pagou, cancelou) | "não encontrado" | a versão inicial |
| `versao_final` | o cliente comprou a versão final | "não encontrado" (o site novo já tem o conteúdo e não tem mais o script) | a versão final, embutida |

### O editor ao vivo, por dentro (16/11/2026)

O script do site (`ferramentas/meu-site/meu-site.js`) entra no **modo editor** só quando a página está dentro de um
quadro **e** tem `?rz-editor=1`. Nele não pede a versão publicada nem usa a guardada no navegador; conversa com o
painel por `postMessage`, aceitando mensagem **só da origem da API** (`data-api`, a do painel) e mandando só para ela:

| De | Mensagem (`rz: "meu-site"`) | O que faz |
|---|---|---|
| painel | `{ tipo: "conteudo", conteudo }` | aplica o rascunho por cima da versão inicial (a mesma `validar()`; inválido = fica como está; sem conteúdo = a inicial) |
| painel | `{ tipo: "foco", secao, grupo?, campo?, indice? }` | rola até a parte (ou o campo, ou o item da lista) e destaca por 2 segundos |
| site | `{ tipo: "pronto" \| "medidas", imagens, ancoras }` | o tamanho de cada foto na página (`"<seção>.<campo>"` e `"<seção>.<lista>.<campo>"` → `[largura, altura]`) e as partes com âncora (`{ id, secao }`) |
| site | `{ tipo: "clique", secao, grupo, campo, indice?, subcampo? }` | a pessoa clicou numa parte marcada (o clique não segue o link; no editor ninguém sai da página) |

`grupo` é `textos`, `botoes`, `imagens` ou `listas`. Nada é gravado pelo site: o rascunho só existe no quadro de quem
edita. Para o painel poder pôr o site num quadro, o `virar-site.mjs` troca, **nos sites com `"painel"`**, o
`X-Frame-Options: SAMEORIGIN` por `Content-Security-Policy: frame-ancestors 'self' <origem do painel>` (`_headers` e
`vercel.json`); os sites sem painel continuam como eram. No painel, a CSP ganhou `frame-src https:` (e
`http://localhost:*` para os testes), e o quadro vai com `sandbox` sem `allow-top-navigation` (o site não tira o
painel do lugar). **Site já entregue precisa ser gerado e subido de novo** para ganhar a ponte e o cabeçalho.

## Segurança

- Público só o que está publicado; rascunho só com o código de prévia, que expira.
- Texto entra como texto: nenhum campo vira HTML no site (só a marcação `*destaque*`), então ninguém quebra o site
  nem injeta código.
- Links permitidos: `https://`, WhatsApp (`wa.me`), telefone, e-mail, mapas e âncoras da própria página.
- Imagens: só tipos de imagem, tamanho máximo no envio, convertidas para WebP e redimensionadas; limite de espaço por
  conta (o gratuito do Supabase tem 1 GB de arquivos no total).
- O editor ao vivo não abre nada novo para fora: o rascunho só chega ao quadro de quem está logado no painel, o site
  só aceita mensagem da origem do painel e só o painel pode pôr o site num quadro.
- O cliente garante nos termos que tem autorização para as fotos e os depoimentos que publicar (`06`).

## O que mudou no que já existe (29/10/2026)

- `ferramentas/demo/gerar.py` e `gerar-eventos.py` emitem as marcações `data-site-*`, sem mudar o visual. O
  `runtime.js` das demos expõe `window.DEMO_RUNTIME` (`links`, `avaliacoes`, `carrosseis`), para o script refazer o
  que depende do conteúdo. A fotografia e a odonto ficam para depois (acima).
- `scripts/virar-site.mjs`: com `"painel": { "codigo": "…" }` no `site.json`, embute o script do Meu site
  (`data-codigo`); sem esse campo, o site sai como antes. O README do site explica o script.
- **Versão final:** `node scripts/versao-final.mjs <pasta-do-site> <conteudo.json>`. Ela:
  - baixa as imagens publicadas para `img/`;
  - embute o conteúdo no HTML, inclusive o contato e as avaliações;
  - tira o script e as marcações.

  O site que sai não pede nada ao painel.
- As demos (`/demo/<pasta>`) não levam o script, e os `/exemplos` não mudam.

## Decidido e em aberto

- Preço: **vem em todo plano**, do mais barato ao mais caro, sem contar entre os 2 módulos do plano (decidido em 14/11/2026; antes, de 28/10, era um módulo como os outros, R$ 14,99).
- Desconexão: manual, pelo Admin. Decidido em 28/10/2026.
- Valor da versão final: no máximo 3 mensalidades do plano do cliente, entrega em até 10 dias úteis (termos, 9.4).
  Decidido em 30/10/2026 (antes, "combinado na proposta", de 28/10/2026).
