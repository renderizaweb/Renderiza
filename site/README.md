# Site público (`/`)

A home da Renderiza: quem é o Kaue, o que faz, como funciona, trabalhos selecionados e contato.
É HTML pronto no build, sem JavaScript para mostrar o conteúdo e com o CSS dentro da página.

| Arquivo | Para quê |
|---|---|
| `config.mjs` | **O que você edita**: WhatsApp, LinkedIn, Instagram, foto, endereço do site e trabalhos |
| `pagina.mjs` | Textos e estrutura da página |
| `estilo.css` | Visual (mobile first) |
| `estatico/` | Vai para a raiz do site: fontes, ícones, `compartilhar.jpg` e, quando houver, `imagens/` |

## Completar o que falta

`npm run build` lista no fim o que ainda está vazio no `config.mjs`. Enquanto o WhatsApp estiver vazio,
os botões levam ao bloco de contato (nenhum link quebrado).

- **WhatsApp**: `contato.whatsapp` só com dígitos, com 55 e DDD (ex.: `5511912345678`).
- **LinkedIn**: `contato.linkedin` com o endereço completo do perfil.
- **Foto**: coloque a foto real em `estatico/imagens/` e aponte `pessoa.foto` para `/imagens/<arquivo>`.
  Para reduzir e converter: `node scripts/imagens-do-site.mjs otimizar foto.jpg site/estatico/imagens/kaue.webp`.
- **Trabalhos**: cada item tem `selo` (`cliente` ou `demonstracao`), `imagem` (print real), `link` e
  `publicar`. O campo `falta` é só uma anotação e não aparece no site.
- **Demos de óticas**: só com aprovação da ótica, porque usam fotos de clientes dela. Por enquanto
  nenhuma aparece (`publicar: false`).
- **Domínio**: `endereco` é `https://www.renderizaweb.com.br`. Se mudar nome, frase ou domínio, rode
  `node scripts/imagens-do-site.mjs` para refazer a imagem de compartilhamento.

## Ver no computador

`npm run dev` e abra `http://localhost:5173`. Mudou o `config.mjs`, é só recarregar.
