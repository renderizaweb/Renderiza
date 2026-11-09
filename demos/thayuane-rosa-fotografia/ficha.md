# Thayuane Rosa Fotografia

| | |
|---|---|
| Onde | R. Mutu-Poranga, 115 - Jardim Piratininga, São Paulo - SP, 03716-140 |
| Instagram | [@thayuanerosafotografia](https://www.instagram.com/thayuanerosafotografia/) · 1,6 mil seguidores |
| Google | nota 5,0 · 34 avaliações · conferido em 06/11/2026 |
| WhatsApp | (11) 97075-8127 · celular do Perfil da Empresa no Google (+55 11 97075-8127) |
| Horário | Segunda a sábado 9h às 19h; Domingo Fechado |
| Site | não tem: só o Instagram (lote 3, 06/11/2026) |
| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |
| Situação | pronta · 06/11/2026 · `/demo/thayuane-rosa-fotografia` e `/demo/thayuane-rosa-fotografia/natal` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o site fica 100% dela, sem mensalidade); promoção de uma semana, até 13/11/2026 (depois dessa data, o aviso some e fica só o valor): trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |
| Horários de exemplo | 13 livres de 24 (`horarios` no `demo.json`) |

## Direção da demo
- Lote 3 de fotógrafos (nº 13, 75 pontos), escolhida no Drive de 06/11/2026. A página salva no Drive veio sem o HTML (só as fotos): sem bio; os textos vêm dos posts de out 2026 ("Prazer, eu sou a Thay") e das avaliações.
- Dona: Thayuane Rosa, a Thay. Foto dela: o retrato de cabelo ruivo (o mesmo da arte "Prazer, sou a Thay").
- Personalidade: o marrom 🤎 que ela usa e o "Entre nós, o Natal" com "muuuita sofisticação". Na demo: abertura em arcos, Cormorant, "fotografia" em Pinyon Script, chocolate e rosado, ◆ entre as especialidades; o título do portfólio é a frase dela ("guardar fases, reencontrar sentimentos").
- Sem logo em boa resolução: monograma TR e o nome com "fotografia" cursiva, feitos para a demo.

## O que tem na demo
- Site: abertura (gestante, newborn e Natal), portfólio em 4 abas (Gestante, 8; Newborn, 7; Infantil e família, 9; Natal, 5), a Thay, os ensaios, 4 avaliações do Google, o bloco do Natal e o contato.
- Página de Natal "Entre nós, o Natal": o especial (09/11 a 12/12), fotos de Natais anteriores, a agenda de exemplo (6 dias de segunda a sábado, de 14/11 a 12/12, das 9h às 16h, dentro do horário do Google) e outros ensaios do ano.
- Sem o aviso da Renderiza: o modal foi tirado em 06/11 (nas primeiras visitas, as pessoas saíam da página quando ele abria).

## Fotos
- As fotos da página salva no Drive (1440 px) e 1 foto do Google. Os posts de out 2026 são vídeos e artes, então não entraram.
- Ficaram de fora: as capas de vídeo (9:16), as artes ("Natal 2026", "Prazer, sou a Thay"), os ensaios com nu, os closes de detalhe e as fotos de casamento e de moto do Google.

## Textos e fontes
- Legendas: "Prazer, eu sou a Thay... Por trás da câmera, existe uma mulher que ama ouvir histórias..." e "É sobre guardar fases, reencontrar sentimentos" (27/10), "fotografar nunca foi só sobre fazer fotos" (13/10), "Mais do que fotos bonitas, quero que esse Natal seja uma oportunidade de reunir quem vocês amam... os filhos crescem, as famílias mudam" (12/10).
- Avaliações do Google: as 5 visíveis sem login; 4 em cada página.

## Conferir antes de mandar
- As fotos de Natal são de anos anteriores; o cenário de 2026 só aparece em arte e vídeo.
- Uma avaliação cita "ela e a assistente".
- Fotos de bebês, crianças e gestantes: todas publicadas por ela como portfólio. Vale ela confirmar se pode usar todas no site.

## Portfólio que vende, versão 3 (09/11/2026)
- Curado foto a foto (docs/nichos/fotografos.md, seção 10, "Regras do portfólio"). Capa da vitrine: `gestante:2`.
- `natal`: Natal 2026 (fotos pn:0, natal:1,2,3,4, familia:4); a partir de R$ 320; depoimento: nenhum (nenhum fala deste ensaio)
- `gestante`: Gestante (fotos gestante:1,0,2,3,6,4,5); a partir de R$ 420; depoimento: Isabela Ferraz
- `newborn`: Newborn (fotos newborn:0,1,2,4,6,5,3); a partir de R$ 480; depoimento: nenhum (nenhum fala deste ensaio)
- `familia`: Infantil e família (fotos familia:1,5,0,6,2,7,3,8); a partir de R$ 320; depoimento: Rebecca Requena
- Pacotes e valores **de exemplo** (com o selo "você coloca os seus"). Tudo no `demo.json` (`portfolio`).
- Gerar de novo: `python3 ferramentas/demo/gerar-portfolio.py demos/thayuane-rosa-fotografia <site.html> <natal.html>`, com o site e o Natal antigos tirados do git (`git show f255db1:demos/thayuane-rosa-fotografia/index.html` e `.../natal.html`); conferir com `ferramentas/demo/conferir-portfolio.cjs`.
