# Nina Oliveira Photography

| | |
|---|---|
| Onde | Av. Mário Lopes Leão, 516 - Sl 04 - Santo Amaro, São Paulo - SP, 04754-010 (estúdio dela; zona sul) |
| Instagram | [@ninaoliveiraphoto](https://www.instagram.com/ninaoliveiraphoto/) ("Nina Oliveira \| Gestante & Newborn.") · 2,3 mil seguidores (2.281 em 22/11/2026), 286 posts, último post em 16/11/2026 |
| Google | "Nina Oliveira Photography", estúdio fotográfico · nota 5,0 · 38 avaliações · todos os dias das 9h às 17h · conferido em 23/11/2026 |
| WhatsApp | (11) 96690-4867 · celular do Perfil da Empresa no Google e da página da Alboom |
| Site | não tem: o Google aponta a página grátis dela na Alboom (ninaphoto.alboompro.com, "Estúdio Nina Oliveira Photography", com o @ e o WhatsApp); ninaoliveira.com.br é de outra Nina (perfumes) |
| Entregável | **portfólio online, versão 4** (23/11/2026): `index.html` (a vitrine) e uma página por ensaio (`newborn`, `gestante`, `bebes`, `familia`, `natal`). Sai de `ferramentas/demo/gerar-portfolio.py demos/nina-oliveira-photography <pasta dos originais>`; textos, fotos e pacotes no `demo.json` (`portfolio`) |
| Oferta na demo | R$ 399 no Pix ou parcelado no crédito, pagamento único (o portfólio fica 100% dela, sem mensalidade); promoção de uma semana, até 30/11/2026 (`renderiza.valido_ate` no `demo.json` e `demos.vale_ate` no painel) |
| Painel | lead `nina-oliveira-photography` (código `s5vj`) |

## Direção
- Lote 4 de fotógrafos (nº 2 de 40, 90 pontos). Dona: Aline Oliveira, a Nina (assim ela se apresenta na Alboom), sozinha, estúdio próprio em Santo Amaro.
- Personalidade: estúdio de madeira clara, macramê e luz branca; "Gestante & Newborn" no nome do perfil. Na página: fundo quase branco, Marcellus nos títulos, Nunito Sans no texto, "photography" em Allura (a marca dela é em inglês), caramelo nos botões. Ícone da aba: monograma NO.
- Ordem dos ensaios pelo que ela vende: newborn, gestante, bebês e crianças (a sessão de acompanhamento do bebê e os aniversários), família e, por último, o Natal.
- **Natal só como página extra, no fim**: ela vende o "Especial de Natal 2026 · últimos horários disponíveis" (21/10 a 03/11) e tem mais de 20 fotos do cenário de 2026; pela decisão do Kaue, o Natal não abre a vitrine (fora da tira e do título) e entra como o último ensaio.

## Fotos (52 escolhidas de 219 originais sem repetição, uma a uma, na folha de contato grande)
- **Fontes**: (1) os carrosséis completos dos posts de 21/10 a 16/11/2026 pelo embed público (`ferramentas/ig-post.py`): o primeiro aninho do Rafa e o Natal 2026; (2) a grade salva no Drive ("lote 22 do 11", posts de 2022 e 2023); (3) as galerias da página dela na Alboom (o newborn do Romeo e três ensaios de gestante); (4) o Perfil no Google.
- **De quem são**: a página salva é a dela (og:url, bio e nome); a Alboom tem o @ e o WhatsApp dela.
- **Por ensaio** (a ordem está no `demo.json`): newborn 13, gestante 8, bebês e crianças 9, família 8, Natal 2026 12. Quem fotografa: duas cenas do estúdio (não há foto pública confirmada dela).
- **Ficaram de fora**: as gestantes de lingerie, sutiã, body de tule ou renda transparente e as só com o tecido amarrado (a maior parte das galerias de gestante da Alboom e alguns posts: fora sempre), a arte "Especial de Natal" e o print de depoimento (texto), a plaquinha com texto no newborn, os detalhes de pé e mão e as repetidas.
- **Tratamento**: do original, sem ampliar e sem recorte; 1400 px no lado maior (1920 na abertura de cada ensaio), JPEG progressivo, qualidade 82.

## Textos
- Dela: "Fotografia é história, é documentação de vida, é amor!" (bio, o título da vitrine); a apresentação da Alboom ("Olá, meu nome é Aline Oliveira, mas podem me chamar de Nina. Sou formada, especializada… da gestante com sua doce espera e recém-nascidos… Lidar com o amor que acaba de nascer, me encanta e me leva além… Aqui tem amor!"); "O ensaio de uma gestante é uma pausa no tempo"; "Estar com seu bebê nos braços é reconhecer toda a sua força de mãe"; "Feliz primeira volta ao sol"; "A magia do Natal"; "A infância passa depressa, mas o que a gente guarda com amor, permanece!"; "Especial de Natal 2026 · últimos horários disponíveis".
- Avaliações do Google (as 5 que o Google mostra sem login, lidas inteiras em 23/11): Gabriela Fernandes fala do newborn; Juliana Santos, da família e das crianças; Thaís Gonçalves, do ensaio da filha (bebês e crianças); Darla Farias e Ingrid Gross, do trabalho em geral (gestante e Natal).
- Sem "quando fazer" no newborn e na gestante: ela não publicou as semanas nem os dias.
- **Não são dela** (mostrar na validação): os pacotes e os valores, que são EXEMPLOS e levam o selo "Pacotes e valores de exemplo: você coloca os seus".

## Conferir com ela
- Fotos de clientes (bebês, crianças, gestantes, famílias): todas publicadas por ela como portfólio. Vale confirmar se podem ficar todas.
- Não há foto pública confirmada dela: o "quem fotografa" mostra o estúdio. Se ela mandar uma foto, entra no lugar.
- Posta menos que as outras (6 posts em 31 dias).

## Gerar de novo
- `python3 ferramentas/demo/gerar-portfolio.py demos/nina-oliveira-photography [<pasta dos originais>]`. Sem os originais, o gerador reaproveita as fotos já tratadas das páginas (dá para mudar texto e preço); para trocar foto, baixar de novo (posts pelo `ig-post.py`, galerias pela página da Alboom).
- Conferir: `node ferramentas/demo/conferir-portfolio.cjs <pasta de capturas> nina-oliveira-photography` (passou sem problema em 23/11/2026, nas larguras 390, 1280 e 1440).
