# Studio Flaternize

| | |
|---|---|
| Onde | Av. José Gallucci, 186 - Sala 8 - Jundiapeba, Mogi das Cruzes - SP, 08750-600 |
| Instagram | [@studioflaternize](https://www.instagram.com/studioflaternize/) · 3,0 mil seguidores |
| Google | nota 5,0 · 29 avaliações · conferido em 06/11/2026 |
| WhatsApp | (11) 97780-2176 · celular do Perfil da Empresa no Google (+55 11 97780-2176) |
| Horário | Segunda a domingo 10h às 17h |
| Site | não tem: só o Instagram (lote 3, 06/11/2026) |
| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |
| Situação | pronta · 06/11/2026 · `/demo/studio-flaternize` e `/demo/studio-flaternize/natal` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o site fica 100% dela, sem mensalidade); promoção de uma semana, até 13/11/2026 (depois dessa data, o aviso some e fica só o valor): trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |
| Horários de exemplo | 13 livres de 24 (`horarios` no `demo.json`) |

## Direção da demo
- Lote 3 de fotógrafos (nº 7, 79 pontos), escolhida no Drive de 06/11/2026. A página salva no Drive veio sem o HTML (só as fotos): sem bio; os textos vêm dos posts de out 2026 e das avaliações.
- Dona: Flávia (citada nas avaliações). O retrato com a câmera da página salva entra no "quem fotografa" sem dizer que é ela (conferir).
- Personalidade: "Nunca vou oferecer apenas um ensaio simples de fotos... oferecemos EXPERIÊNCIA" e o Natal branco e dourado com o trenzinho de madeira. Na demo: abertura em faixa, Playfair Display, "studio" em Great Vibes, verde-pinheiro e dourado, ✦ entre as especialidades.
- Sem logo em boa resolução: monograma SF e o nome com "studio" cursiva, feitos para a demo.

## O que tem na demo
- Site: abertura (Natal, gestante e infantil), portfólio em 3 abas (Natal, 12; Infantil e bebês, 9; Gestante e feminino, 8), a Flávia, os ensaios, 4 avaliações do Google, o bloco do Natal e o contato.
- Página de Natal "Eterna magia": o Especial de Natal 2026 (cenários Sala e Celeiro), fotos de Natais anteriores, a agenda de exemplo (sábados e domingos, de 14/11 a 29/11, das 10h às 15h30, dentro do horário do Google) e outros ensaios do ano.
- Sem o aviso da Renderiza: o modal foi tirado em 06/11 (nas primeiras visitas, as pessoas saíam da página quando ele abria).

## Fotos
- As fotos da página salva no Drive (até 1440 px) e 3 fotos do Google. Os posts de out 2026 com os cenários Sala e Celeiro são artes com texto, então não entraram.
- Ficaram de fora: as capas de vídeo (9:16), as artes ("Eterna Magia", colagem de aniversário), a silhueta e os ensaios de aniversário adulto.

## Textos e fontes
- Legendas: "ESPECIAL DE NATAL 2026 - ETERNA MAGIA... Nunca vou oferecer apenas um ensaio simples de fotos. Aqui no nosso Studio oferecemos EXPERIÊNCIA, vocês saem querendo mais" (22/10), "Cenário Celeiro" (23/10), "temos poucas vagas" (24/10).
- Avaliações do Google: 4 das 5 visíveis (a de "Janny" ficou de fora: o nome dela no Google é um e-mail).

## Conferir antes de mandar
- O retrato com a câmera pode ser da Flávia (não está confirmado).
- As fotos de Natal são de anos anteriores; as de 2026 só aparecem nas artes.
- Fotos de crianças, bebês e gestantes: todas publicadas por ela como portfólio. Vale ela confirmar se pode usar todas no site.

## Portfólio que vende (09/11/2026)
- A demo virou **portfólio** (docs/nichos/fotografos.md, seção 10): a vitrine (`index`) e uma página de venda por ensaio: `natal` (Natal 2026, a partir de R$ 320), `infantil` (Infantil e bebês, a partir de R$ 300), `gestante` (Gestante e feminino, a partir de R$ 420).
- Mesmo link e mesmo rastreio; cada página aparece na visita com o nome dela. Tom escuro no computador, vitrine em lista.
- Pacotes e valores **de exemplo** (com o selo "você coloca os seus"); títulos e textos das legendas, da bio e das avaliações dela. Tudo no `demo.json` (`portfolio`).
- Gerar de novo: `python3 ferramentas/demo/gerar-portfolio.py demos/studio-flaternize <site.html> <natal.html>`, com o site e o Natal antigos tirados do git (`git show f255db1:demos/studio-flaternize/index.html` e `.../natal.html`).
