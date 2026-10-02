# Lú Elegante (moda e beleza)

Fora da fila das óticas: loja de roupas com salão, pedido do Kaue em 01/10/2026.

| | |
|---|---|
| Onde | Vila São Pedro, São Bernardo do Campo (2 lojas) |
| Instagram | [@luelegantemodas](https://www.instagram.com/luelegantemodas/) (370 seguidores, 60 posts, último post em 24/09/2025) · antigo: [@lmmodasebeleza](https://www.instagram.com/lmmodasebeleza/) ("Luciene Eunice", último post em 2023) |
| Google | ficha "LM Modas e Beleza", nota 5,0 (3 avaliações) · Rua João XXIII, 10 · conferido em 01/10/2026 |
| WhatsApp | (11) 95273-9113 (confirmado pelo Kaue em 01/10/2026 como o que funciona; é o do Google e da plaquinha do salão) |
| Entregável | demo de site (`index.html`) |
| Situação | **aprovada pela cliente** (01/10/2026) · vira o site `luelegantemodas.com.br` |

## Direção da demo (do Kaue)
- A dona é a Luciene Eunice (a "Lú"). Ela quer contar a história dela: trabalha com beleza desde 2012
  (cabeleireira, representante de marcas de produtos profissionais para salão) e tem a loja de roupas há
  5 anos. Texto bonito, sem melação.
- Duas lojas; numa delas o salão funciona junto com a loja. O site tem que mostrar essa mistura de moda e
  salão.
- Periferia, coisa simples: não pode parecer boutique, mas também não de qualquer jeito.
- Galeria com as fotos que ele mandou, como nas óticas. O HTML que ele tinha feito serviu só de
  referência (endereços, vídeos e fotos da loja).

## Levantado (01/10/2026)
- Google: "LM Modas e Beleza", Rua João XXIII, 10 - Vila São Pedro, São Bernardo do Campo - SP, 09784-410
  (o HTML de referência dizia nº 16; a fachada mostra o 10). Categoria loja de moda feminina / salão de
  beleza. Atributo "Se identifica como uma empresa de empreendedoras". Horário: só apareceu quinta,
  9h30–19h. As 3 avaliações não abriram sem login.
- Fachada (foto do Google): "LM Moda e Beleza · Corte, Selagem, Botox, Cauterização, Corte Bordado,
  Química em Geral, Designer de Sobrancelhas, Alongamento de Unhas". Placa do salão: hidratação, escova,
  progressiva, selagem, alinhamento térmico, reconstrução, manicure, pedicure. A faixa traz outro número,
  9.5974-2520, que não usei.
- Segunda loja: Av. Dom Pedro de Alcântara, 396, Vila São Pedro (Kaue, 01/10/2026, com foto da fachada). A
  faixa diz "Elegante Modas e B…", WhatsApp 95273-9113 e 95234-4608, @luelegantemodas e "Aceitamos todos
  os cartões de créditos e débitos". Usei só o 95273-9113.
- Numeração: as artes dizem "38 ao 44" e um post diz "veste GG G1 G2". No site ficou "peças até o G2".

## O que tem na demo
- Rosa, magenta e preto (fachada e artes da loja), logo "Lú" em letra cursiva, títulos em Playfair
  Display, texto em Montserrat. "Você sempre linda" é o bordão das artes da loja.
- Capa "Roupa nova e cabelo feito, no mesmo lugar", com look, foto do cabelo feito no salão e a fachada.
- Vitrine com 16 looks (fotos de catálogo que o Kaue mandou e do HTML dele; o texto das artes foi
  recortado/apagado). "Na loja" com 5 fotos reais (manequins, araras; tiradas dos vídeos e do Instagram).
- Salão: serviços tirados da fachada e da placa, botão "Agendar horário".
- História: foto da Luciene, 2012 → 5 anos de loja → hoje 2 lojas, uma com salão.
- Lojas: João XXIII, 10 (loja e salão, nota 5,0, fachada, mapa) e Dom Pedro de Alcântara, 396 (foto da
  entrada, cartões, como chegar).
- Sem depoimentos (não deu para ler as 3 avaliações) e sem aviso de aberto/fechado.

## Conferir antes de mandar
- **Nome:** Instagram e artes dizem "Lú Elegante"; fachada e Google dizem "LM Moda(s) e Beleza". O site
  usa "Lú Elegante". Confirmar com a Luciene.
- Horário das duas lojas e do salão.
- Texto das 3 avaliações do Google (um print basta) para entrar como depoimentos.
- Os vídeos da loja (HTML de referência) ficaram fora para o site continuar leve; dá para colocar um se
  ela quiser.

## Site de verdade (aprovado em 01/10/2026)
- Tudo nas contas da cliente: Gmail dela, GitHub dela (repositório próprio), Vercel dela e domínio
  `luelegantemodas.com.br` no Registro.br. Nada fica na Renderiza.
- Pacote gerado com `npm run site -- lu-elegante-modas` (fotos em arquivos, endereço oficial, prévia para
  WhatsApp, dados das duas lojas para o Google, robots e sitemap liberando o Google).
- Repositório: github.com/marciodonisetedacunha/luelegantemodas (conta criada no nome do Márcio). Site
  enviado para a `main` em 01/10/2026 (commit 777cf1b). Kaue7almeida entrou como colaborador temporário.
- Falta: importar na Vercel (preset Other, sem build), domínio no Registro.br com os DNS da Vercel, tirar o
  acesso temporário e fazer a demo `/demo/lu-elegante-modas` redirecionar para o domínio.
