# Drika Freitas Fotógrafa

| | |
|---|---|
| Onde | Travessa João Jantin, 21 - Casa Verde Alta, São Paulo - SP, 02544-020 |
| Instagram | [@drikafreitasfotografa](https://www.instagram.com/drikafreitasfotografa/) · 6,4 mil seguidores |
| Google | nota 5,0 · 36 avaliações · conferido em 06/11/2026 |
| WhatsApp | (11) 93444-2987 · celular do Perfil da Empresa no Google (+55 11 93444-2987), o mesmo das legendas ("11934442987") |
| Horário | Segunda a sábado 9h às 17h; Domingo Fechado |
| Site | não tem (lote 3, 06/11/2026) |
| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |
| Situação | pronta · 06/11/2026 · `/demo/drika-freitas-fotografia` e `/demo/drika-freitas-fotografia/natal` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o site fica 100% dela, sem mensalidade); promoção de uma semana, até 13/11/2026 (depois dessa data, o aviso some e fica só o valor): trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |
| Horários de exemplo | 13 livres de 24 (`horarios` no `demo.json`) |

## Direção da demo
- Lote 3 de fotógrafos (nº 20, 72 pontos), escolhida no Drive de 06/11/2026. Bio: "Ensaio Fotográfico Interno e Externo · Gestante · Corporativo · Infantil (Newborn, Mesversário, Smash) · Familiar · Pre-wedding · coberturas de festas".
- Dona: Drika (Adriana Freitas, nas avaliações). Foto dela: a do perfil do Instagram, com a câmera.
- Personalidade: um tema para cada data do ano (Natal, Ano Novo, Páscoa, aniversários) e a cozinha de Natal com as crianças de confeiteiras. Na demo: abertura em filme, EB Garamond, "fotógrafa" em Sacramento, vermelho de Natal e ❄ entre as especialidades.
- Sem logo em boa resolução: monograma DF e o nome com "fotógrafa" cursiva, feitos para a demo.

## O que tem na demo
- Site: abertura (Natal, newborn e família), portfólio em 3 abas (Natal, 12; Bebês e aniversários, 12; Família e gestante, 8), a Drika, os ensaios, 4 avaliações do Google, o bloco do Natal e o contato.
- Página de Natal "O Natal mais encantador chegou ao estúdio!": cenários de Natais anteriores (a sala do relógio e a cozinha), a agenda de exemplo (6 dias de segunda a sábado, de 14/11 a 05/12, das 9h às 15h30, dentro do horário do Google) e outros ensaios do ano.
- Sem o aviso da Renderiza: o modal foi tirado em 06/11 (nas primeiras visitas, as pessoas saíam da página quando ele abria).

## Fotos
- A página do Instagram salva no Drive (1080 px, quase todas quadradas), 2 posts gestantes de nov 2026 e 4 fotos do Google, mais a foto do perfil.
- Ficaram de fora: as capas de vídeo (9:16), as fotos de festa adulta e corporativo, o Ano Novo com os números do ano e as fotos com logo de outra empresa.

## Textos e fontes
- Bio e legendas: "O NATAL MAIS ENCANTADOR CHEGOU AO ESTÚDIO FOTOS DRIKA FREITAS!... O Natal é tempo de amor, união, magia..." e "Cenários lindos e exclusivos" (30/10), "Realizo o acompanhamento mês a mês do seu bebe até 1 ano", "Não deixe de registrar este momento lindo".
- Avaliações do Google: as 5 visíveis sem login; 4 em cada página.

## Conferir antes de mandar
- As fotos de Natal são de anos anteriores (os cenários de 2026 ainda não aparecem em foto).
- Quase todas as fotos da página são quadradas e em 1080 px: ficam bem, mas não tão nítidas quanto as das outras demos.
- Fotos de bebês, crianças e famílias: todas publicadas por ela como portfólio. Vale ela confirmar se pode usar todas no site.

## Portfólio que vende, versão 3 (09/11/2026)
- Curado foto a foto (docs/nichos/fotografos.md, seção 10, "Regras do portfólio"). Capa da vitrine: `natal:0`.
- `natal`: Natal 2026 (fotos pn:0, natal:0,7,4,9,11,2,10,8); a partir de R$ 300; depoimento: Silvana Messias
- `mesames`: Mês a mês (fotos bebes:4,5,6,2,0,1,3); a partir de R$ 200; depoimento: Danielle Teixeira
- `infantil`: Infantil e aniversários (fotos bebes:9,8,7,11,10); a partir de R$ 300; depoimento: Debora Barboza Pital
- `familia`: Família (fotos familia:0,2,4,1,3); a partir de R$ 320; depoimento: RITA DE CASSIA XAVIER DE LIMA BARROSO
- Pacotes e valores **de exemplo** (com o selo "você coloca os seus"). Tudo no `demo.json` (`portfolio`).
- Gerar de novo: `python3 ferramentas/demo/gerar-portfolio.py demos/drika-freitas-fotografia <site.html> <natal.html>`, com o site e o Natal antigos tirados do git (`git show f255db1:demos/drika-freitas-fotografia/index.html` e `.../natal.html`); conferir com `ferramentas/demo/conferir-portfolio.cjs`.
