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
5. **Versão final é vendida à parte** (valor combinado na proposta de cada cliente, fora do painel). A Renderiza gera o site com o conteúdo final embutido e sem o script
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
 │ + script do Meu site (pequeno, embutido) │ ◀───────────────── (cache de ~60 s)     │
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
3. **Veio a resposta em até 1,5 s:** aplica só o que está nela, por cima da versão inicial. Texto entra como texto
   (nunca como HTML), links só dos tipos permitidos, imagens só do endereço do painel. Um campo inválido descarta a
   versão inteira. **Erro, demora ou resposta inválida: não faz nada. "Não encontrado": volta à inicial** e esquece
   a guardada.
4. **Guardada no navegador por 24 horas:** a última versão aparece logo nas visitas seguintes. A resposta que chega
   depois de 1,5 s não muda a página aberta, mas fica guardada para a próxima visita. Se a do painel for diferente
   da guardada, a página volta à inicial e aplica a nova, sem sobrar nada da guardada.
5. **Cache na rede de uns 60 segundos** (no endereço do painel): a maioria das visitas nem chega ao banco, e uma
   publicação aparece em até 1 minuto.
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
- **Reservado:** `cores` e `ordem` (logo depois, ver "O que dá para mudar"): o script de hoje ignora.

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

Ficam para depois:
- **cores e ordem das seções:** a base das demos deriva as cores de duas, então trocar pede mexer no gerador;
- **posição dos botões;**
- **endereço e horário**, que mexem nos dados para o Google;
- **a mensagem pronta da consulta de data;**
- **as marcações nos geradores de fotografia e odonto:** entram quando o primeiro cliente desses nichos quiser o
  Meu site, com o mesmo padrão.

### O que o painel entrega (blocos A e C da Missão 4)

| | |
|---|---|
| `GET /api/publico/site/<código>` | `200` com o JSON acima (o `conteudo` da última versão publicada, mais `esquema`, `site` = o código, `versao` = o número e `publicado_em`); `404` se o site não existe, está `desconectado` ou em `versao_final`. Cabeçalhos: `Access-Control-Allow-Origin: *` (o site do cliente está em outro domínio) e `Cache-Control: public, max-age=0, s-maxage=60` |
| `GET /api/publico/site/<código>/previa?t=<código da prévia>` | o rascunho, no mesmo formato, enquanto a prévia não expira (`sites_previas`); `404` depois. `Cache-Control: no-store` e o mesmo CORS |
| Imagens | servidas em `https://painel.renderizaweb.com.br/…` (ex.: `/imagens/sites/<código>/<arquivo>`, apontando para o Storage público `site-imagens`): o script recusa imagem de outro endereço |
| Validação | antes de publicar, a mesma `validar()` (o arquivo é um só; o painel usa uma cópia conferida por teste, porque a Vercel publica só a pasta `painel-clientes/`) |

## No painel (o que o cliente vê)

- **Meu site** no menu: a lista das seções do site, cada uma com a miniatura e "editar".
- Editar uma seção abre um formulário simples com os campos daquela seção. O rascunho é salvo sozinho.
- **Ver no meu site:** abre o site de verdade em modo prévia (um link com código que expira) mostrando o rascunho.
- **Publicar:** vira a versão no ar em até 1 minuto. Cada publicação fica no histórico, com quem publicou.
- **Histórico:** voltar para qualquer versão publicada, ou **voltar para a versão inicial**.
- Acesso como os outros módulos: "só vê" olha e faz prévia; "edita" pode publicar (ou: só o dono publica; decidir
  na Missão 4).

## Situações do site

| Situação | Quando | O que o endereço público responde | O que o site mostra |
|---|---|---|---|
| `conectado` | mensalidade em dia | a última versão publicada | a versão publicada (ou a inicial, se nunca publicou) |
| `desconectado` | a Renderiza desligou a conta ou o módulo (não pagou, cancelou) | "não encontrado" | a versão inicial |
| `versao_final` | o cliente comprou a versão final | "não encontrado" (o site novo já tem o conteúdo e não tem mais o script) | a versão final, embutida |

## Segurança

- Público só o que está publicado; rascunho só com o código de prévia, que expira.
- Texto entra como texto: nenhum campo vira HTML no site (só a marcação `*destaque*`), então ninguém quebra o site
  nem injeta código.
- Links permitidos: `https://`, WhatsApp (`wa.me`), telefone, e-mail, mapas e âncoras da própria página.
- Imagens: só tipos de imagem, tamanho máximo no envio, convertidas para WebP e redimensionadas; limite de espaço por
  conta (o gratuito do Supabase tem 1 GB de arquivos no total).
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

- Preço: módulo como os outros (R$ 14,99, ou um dos 2 do plano). Decidido em 28/10/2026.
- Desconexão: manual, pelo Admin. Decidido em 28/10/2026.
- Valor da versão final: combinado na proposta de cada cliente, fora do painel. Decidido em 28/10/2026.
