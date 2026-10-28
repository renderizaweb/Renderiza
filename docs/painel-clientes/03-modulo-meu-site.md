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

1. **O gerador marca o que é editável.** Os geradores (`ferramentas/demo/gerar*.py`) passam a pôr no HTML
   marcações como `data-rz="topo.titulo"`, `data-rz-botao="topo.botao1"`, `data-rz-img="sobre.foto"`,
   `data-rz-lista="depoimentos"` e `data-rz-secao="galeria"`, e as cores viram variáveis de CSS
   (`--rz-principal`, `--rz-destaque`). Uma demo sem marcação continua funcionando igual.
2. **O script pede a versão publicada** ao abrir a página, num endereço **da Renderiza** (nunca direto o do
   Supabase, para poder trocar o que está atrás sem mexer em nenhum site), com tempo-limite curto (proposta: 1,5 s).
3. **Veio a resposta:** aplica só o que está nela. Texto entra como texto (nunca como HTML), links só dos tipos
   permitidos, imagens só do endereço de imagens do painel, cores só em formato de cor. **Qualquer erro, demora
   ou "não encontrado": não faz nada.**
4. **Cache:** a resposta fica em cache na rede por uns 60 segundos. A maioria das visitas nem chega ao banco (bom
   para o plano gratuito), e uma publicação aparece em até 1 minuto.
5. **Piscar na primeira visita:** o site abre com a versão inicial e troca pela publicada em uma fração de
   segundo. Para diminuir: o script fica no começo da página e aplica as cores primeiro; e a última versão pode
   ficar guardada no navegador por até 24 horas, para aplicar na hora nas visitas seguintes (depois de uma
   desconexão, no máximo 24 horas de atraso). **Validar na parada 4**, olhando no celular com internet lenta.

### Por que não "republicar o site" a cada edição

A outra forma seria, a cada publicação, gerar o site de novo com o conteúdo novo embutido (sem piscar e melhor
para o Google). Não é o padrão porque o site está na conta do cliente: a última versão ficaria gravada nas
publicações dele, e bastaria voltar uma publicação antiga na Vercel para ficar com a versão final sem pagar; e a
Renderiza precisaria de acesso permanente para publicar no projeto do cliente. A consulta ao painel mantém as
regras 3, 4 e 5 simples. Se o piscar incomodar de verdade, dá para reabrir essa discussão (registrar no `07`).

## O formato do conteúdo (contrato v1, proposta)

O painel guarda e o site recebe um JSON. O site aplica o que entende e ignora o resto, então o formato pode
crescer sem quebrar sites antigos (`esquema` diz a versão).

```json
{
  "esquema": 1,
  "site": "villa-alecrim",
  "versao": 7,
  "publicado_em": "2026-11-20T14:03:00-03:00",
  "cores": { "principal": "#2d6a4f", "destaque": "#b4542f" },
  "ordem": ["topo", "sobre", "galeria", "pacotes", "depoimentos", "contato"],
  "secoes": {
    "topo": {
      "visivel": true,
      "textos": { "titulo": "Casamentos e 15 anos *no meio do verde.*", "subtitulo": "…" },
      "botoes": { "botao1": { "rotulo": "Consultar uma data", "acao": "whatsapp", "mensagem": "Olá! Vim pelo site…", "posicao": "abaixo-do-titulo" } },
      "imagens": { "fundo": { "src": "https://…/sites/villa-alecrim/topo-1a2b3c.webp", "alt": "Salão montado para casamento" } }
    },
    "depoimentos": {
      "visivel": true,
      "itens": [{ "nome": "Ana", "texto": "…" }]
    },
    "galeria": { "visivel": false }
  }
}
```

- Seção ou campo que não aparece no JSON fica como na versão inicial.
- O conteúdo inicial de cada site é cadastrado no painel na montagem, a partir do próprio site entregue (o HTML é
  a fonte da verdade; o `demo.json` ajuda, mas aponta para fotos de pastas de trabalho que não estão no
  repositório). Assim o editor abre mostrando exatamente o que está no ar.
- O banco valida o JSON antes de publicar (tamanhos, tipos, links permitidos).

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

## O que muda no que já existe

- `ferramentas/demo/gerar.py`, `gerar-eventos.py`, `gerar-fotografia.py`, `gerar-odonto.py`: emitir as marcações
  `data-rz` e as variáveis de cor. Sem mudar o visual das demos.
- `scripts/virar-site.mjs`: quando o `site.json` tiver `"painel": { "codigo": "…" }`, embutir o script do Meu site
  (e da agenda online) com o código da conta. Sem esse campo, o site sai como hoje.
- Uma rotina para gerar a **versão final**: pega a versão inicial + a última publicada, embute tudo e tira o script.
- As demos (`/demo/<pasta>`) não levam o script.

## Decidido e em aberto

- Preço: módulo como os outros (R$ 14,99, ou um dos 2 do plano). Decidido em 28/10/2026.
- Desconexão: manual, pelo Admin. Decidido em 28/10/2026.
- Valor da versão final: combinado na proposta de cada cliente, fora do painel. Decidido em 28/10/2026.
