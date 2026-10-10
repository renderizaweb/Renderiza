# Site público (`/`)

A home da Renderiza, na ordem de uma venda consultiva (veja abaixo): o teste de 5 itens, o que o site resolve,
como funciona, trabalhos, quem somos e contato.
É HTML pronto no build, sem JavaScript para mostrar o conteúdo e com o CSS dentro da página.

| Arquivo | Para quê |
|---|---|
| `config.mjs` | **O que você edita**: WhatsApp, LinkedIn, Instagram, foto, endereço do site e trabalhos |
| `pagina.mjs` | Textos e estrutura da página |
| `estilo.css` | Visual (mobile first) |
| `estatico/` | Vai para a raiz do site: fontes, ícones, `compartilhar.jpg` e, quando houver, `imagens/` |

## A ordem da página (SPIN)

A home segue as etapas da venda consultiva do SPIN (Neil Rackham): primeiro a pessoa reconhece a própria
situação, depois o problema e o que ele custa, e só então vê o site como resposta. Por isso não há lista de
recursos antes do teste.

| Seção | Etapa | O que faz |
|---|---|---|
| `#inicio` | abertura | A frase (`FRASE` em `pagina.mjs`), um pedido concreto e dois sites de clientes no celular (`destaque: true`) |
| `#por-que` | S · situação | O caminho do cliente novo hoje: ouve falar de você, pesquisa, encontra tudo espalhado |
| `#teste` | P e I · problema e implicação | Cinco itens (`TESTE`) para marcar, cada um com o que custa quando falta. O placar funciona sem JavaScript (contador do CSS); com JavaScript, o botão leva o resultado ao WhatsApp |
| `#solucao` | N · necessidade | "O cliente novo encontra tudo sem precisar perguntar.": o que o site mostra, um item para cada item do teste (`NO_SITE`), e ao lado o valor nas palavras do Davi (`valor` do depoimento) |
| `#como-funciona` a `#sobre` | capacidade | Da prévia ao ar, trabalhos, depoimentos, serviços (o site como base, os adicionais Agenda online e Catálogo e o sob medida) e quem somos |
| `#perguntas`, `#contato` | compromisso | As objeções respondidas antes de chamar e o convite: "Quer ver como ficaria o seu?" |

Sem preço (é da conversa), sem promessa de Google ou de vendas e só palavras reais nos depoimentos. Os
testes em `test/site.test.mjs` conferem essa ordem e essas regras. A linha do mês de inauguração
(`INAUGURACAO` em `pagina.mjs`) sai sozinha depois do último dia: no build e, na página já no ar, pelo navegador.

## Completar o que falta

`npm run build` lista no fim o que ainda está vazio no `config.mjs`. Enquanto o WhatsApp estiver vazio,
os botões levam ao bloco de contato (nenhum link quebrado).

- **WhatsApp**: `contato.whatsapp` só com dígitos, com 55 e DDD (ex.: `5511912345678`).
- **LinkedIn**: `contato.linkedin` com o endereço completo do perfil.
- **Foto**: coloque a foto real em `estatico/imagens/` e aponte `pessoa.foto` para `/imagens/<arquivo>`.
  Para reduzir e converter: `node scripts/imagens-do-site.mjs otimizar foto.jpg site/estatico/imagens/kaue.webp`.
- **Trabalhos** (portfólio): cada projeto publicado vira um cartão (print + `resumo`) que abre um pop-up com
  `texto`, `recursos` (cada um com "Ver tela"), o depoimento do cliente (se houver) e `link`. No celular os
  cartões viram carrossel; a partir do tablet, grade de 2 colunas. Prints em `estatico/imagens/projetos/`:
  `<id>-1400.webp` (cartão), `<id>-2400.webp` (pop-up) e `<id>-celular.webp`, tirados em 2x/3x. O campo
  `falta` é só uma anotação e não aparece no site. Com `destaque: true` e `imagemCelular`, o projeto aparece
  no celular da abertura (no máximo dois).
- **Demos de óticas**: só com aprovação da ótica, porque usam fotos de clientes dela. Por enquanto
  nenhuma aparece (`publicar: false`).
- **Domínio**: `endereco` é `https://www.renderizaweb.com.br`. Se mudar nome, frase (`FRASE`) ou domínio,
  rode `node scripts/imagens-do-site.mjs` para refazer a imagem de compartilhamento.

## Ver no computador

`npm run dev` e abra `http://localhost:5173`. Mudou o `config.mjs`, é só recarregar.
