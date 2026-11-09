# Lus Fotografia

| | |
|---|---|
| Onde | R. David Ben Gurion, 72 - Jardim Monte Kemel, São Paulo - SP, 05634-000 |
| Instagram | [@lusfotografia](https://www.instagram.com/lusfotografia/) · 4,6 mil seguidores |
| Google | nota 5,0 · 48 avaliações · conferido em 06/11/2026 |
| WhatsApp | (11) 91634-1606 · celular do Perfil da Empresa no Google (+55 11 91634-1606) |
| Horário | Segunda a domingo Fechado |
| Site | só a galeria Pixieset (lusfotografia.pixieset.com, respondeu 403) (lote 3, 06/11/2026) |
| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |
| Situação | pronta · 06/11/2026 · `/demo/lus-fotografia` e `/demo/lus-fotografia/natal` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o site fica 100% dela, sem mensalidade); promoção de uma semana, até 13/11/2026 (depois dessa data, o aviso some e fica só o valor): trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |
| Horários de exemplo | 13 livres de 24 (`horarios` no `demo.json`) |

## Direção da demo
- Lote 3 de fotógrafos (nº 11, 76 pontos), escolhida no Drive de 06/11/2026. Bio: "🎄 NATAL DE LUS 2026 • 01/11 à 20/12 · Especialistas em festas infantis | São Paulo".
- Donos: a Lu (Luciana) e o Lucas (avaliações). Foto: a do perfil do Instagram (a Lu junto à árvore de Natal).
- Personalidade: os posts de texto sobre o valor da fotografia ("A fotografia não é para hoje. É para quando não der mais pra repetir", "Criança agitada não é problema. É matéria-prima"). Na demo: abertura em faixa, Newsreader, "fotografia" em Mea Culpa, pêssego e terracota, ✳ entre as especialidades (o asterisco das artes dela).
- Sem logo em boa resolução: monograma LF e o nome com "fotografia" cursiva, feitos para a demo.

## O que tem na demo
- Site: abertura (Natal 2026, 1 ano e gestante), portfólio em 3 abas (Festas e 1 ano, 10; Família e gestante, 11; Bebês, 8), a Lu e o Lucas, os ensaios, 4 avaliações do Google, o bloco do Natal e o contato.
- Página de Natal "A cada Natal, vemos nossos filhos crescerem": o Natal de Lus 2026 (01/11 a 20/12), a agenda de exemplo (sábados de 14/11 a 19/12, das 9h às 15h30) e outros ensaios do ano.
- Sem o aviso da Renderiza: o modal foi tirado em 06/11 (nas primeiras visitas, as pessoas saíam da página quando ele abria).

## Fotos
- O post do Natal de Lus 2026 (03/11), a página do Instagram salva no Drive (até 1440 px), 1 foto do Google e a foto do perfil.
- Ficaram de fora: as capas de vídeo (9:16), os posts só de texto e a arte "A fotógrafa", as fotos de festa adulta e de casamento.

## Textos e fontes
- Bio e legendas: "Natal de Lus 2026 oficialmente ABERTO!... A cada Natal, vemos nossos filhos crescerem..." (03/11), "Tem momentos que a câmera guarda..." (09/10), "Criança agitada não é problema. É matéria-prima." (14/10), "A fotografia não é para hoje..." (arte).
- Avaliações do Google: as 5 visíveis sem login; 4 em cada página.

## Conferir antes de mandar
- É uma equipe (a Lu e o Lucas); a demo cumprimenta a Lu.
- O Google diz "Atendimento 24 horas"; a agenda é exemplo.
- Fotos de crianças, bebês e famílias: todas publicadas por eles como portfólio. Vale eles confirmarem se podem usar todas no site.

## Portfólio que vende, versão 3 (09/11/2026)
- Curado foto a foto (docs/nichos/fotografos.md, seção 10, "Regras do portfólio"). Capa da vitrine: `familia:4`.
- `festas`: Festas e 1 ano (fotos festas:0,3,1,6,4,2,7,9,8); a partir de R$ 900; depoimento: Danielle Carmo
- `gestante`: Gestante (fotos familia:2,4,0,1,10); a partir de R$ 450; depoimento: Fernanda Araujo
- `familia`: Família (fotos familia:7,8,5,6,3, pn:0, familia:9); a partir de R$ 450; depoimento: Gabih Marchioro Akerley
- `bebes`: Newborn e bebês (fotos bebes:1,2,0,3,6,4,5,7); a partir de R$ 450; depoimento: Beatriz Paula
- Pacotes e valores **de exemplo** (com o selo "você coloca os seus"). Tudo no `demo.json` (`portfolio`).
- Gerar de novo: `python3 ferramentas/demo/gerar-portfolio.py demos/lus-fotografia <site.html> <natal.html>`, com o site e o Natal antigos tirados do git (`git show f255db1:demos/lus-fotografia/index.html` e `.../natal.html`); conferir com `ferramentas/demo/conferir-portfolio.cjs`.
