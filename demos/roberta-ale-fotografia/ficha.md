# Roberta Ale Fotografia

| | |
|---|---|
| Onde | Av. Maria Luiza Americano, 1766 - Sl 5 - Jardim Nossa Sra. do Carmo, São Paulo - SP, 08275-001 |
| Instagram | [@robertaale_fotografia](https://www.instagram.com/robertaale_fotografia/) · 6,3 mil seguidores |
| Google | nota 4,9 · 30 avaliações · conferido em 06/11/2026 |
| WhatsApp | (11) 96779-8569 · celular do Perfil da Empresa no Google (+55 11 96779-8569), o mesmo das legendas ("Agendamento no WhatsApp 11 96779-8569") |
| Horário | Segunda a sábado 9h às 17h; Domingo Fechado |
| Site | não tem (lote 3, 06/11/2026) |
| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |
| Situação | pronta · 06/11/2026 · `/demo/roberta-ale-fotografia` e `/demo/roberta-ale-fotografia/natal` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o site fica 100% dela, sem mensalidade); promoção de uma semana, até 13/11/2026 (depois dessa data, o aviso some e fica só o valor): trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |
| Horários de exemplo | 13 livres de 24 (`horarios` no `demo.json`) |

## Direção da demo
- Lote 3 de fotógrafos (nº 24, reserva 4, 70 pontos), escolhida no Drive de 06/11/2026. A página salva no Drive veio sem o HTML (só as fotos): sem bio; as legendas são curtas ("ENSAIO NEWBORN - Maite - 13 dias · Newborn à domicílio"), então os textos vêm das fotos e das avaliações (com o nome de quem escreveu).
- Donos: a Roberta e o marido, Edson (avaliações). Foto: a da fotógrafa com a câmera (página salva).
- Personalidade: newborn a domicílio, o casal que leva o estúdio até a casa da família; mantas lilás e azuis. Na demo: abertura em arcos, Cormorant Garamond, "fotografia" em Allura, lavanda e azul-bebê, ♡ entre as especialidades.
- Sem logo em boa resolução: monograma RA e o nome com "fotografia" cursiva, feitos para a demo.

## O que tem na demo
- Site: abertura (newborn, família e gestante), portfólio em 3 abas (Newborn, 12; Família com o bebê, 11; Gestante e 1 ano, 7), a Roberta e o Edson, os ensaios, 4 avaliações do Google, o bloco do Natal e o contato (com "Atendimento": o ensaio é na casa da família).
- Página de Natal "O primeiro Natal do bebê": ela não divulgou Natal; os textos falam do newborn em casa no clima de Natal, sem prometer cenário; agenda de exemplo.
- Sem o aviso da Renderiza: o modal foi tirado em 06/11 (nas primeiras visitas, as pessoas saíam da página quando ele abria).

## Fotos
- As fotos da página salva no Drive (1440 px) e 2 fotos do Google. Os posts de nov 2026 são capas de vídeo, então não entraram.
- Ficaram de fora: as capas de vídeo (9:16) e os closes de detalhe muito fechados.

## Textos e fontes
- Legendas: "ENSAIO NEWBORN - Maite - 13 dias · Newborn à domicílio · Agendamento no WhatsApp 11 96779-8569" (01 a 03/11). As citações vêm das avaliações do Google, com o nome de quem escreveu.
- Avaliações do Google: as 4 de 5 estrelas visíveis sem login, nas duas páginas.

## Conferir antes de mandar
- **Ela não divulgou campanha de Natal**: a página de Natal é sugestão (vale perguntar).
- É um casal (a Roberta e o Edson); a demo cumprimenta a Roberta.
- Atende a domicílio: o endereço do Google é só referência (dito no contato).
- Fotos de recém-nascidos e famílias: todas publicadas por ela como portfólio. Vale ela confirmar se pode usar todas no site.

## Portfólio que vende (09/11/2026)
- A demo virou **portfólio** (docs/nichos/fotografos.md, seção 10): a vitrine (`index`) e uma página de venda por ensaio: `newborn` (Newborn a domicílio, a partir de R$ 550), `familia` (Família com o bebê, a partir de R$ 450), `gestante` (Gestante e 1 ano, a partir de R$ 400). Sem página de Natal: não há foto do Natal 2026 dela (a página antiga com horários de exemplo saiu do ar). Quando ela postar o cenário, dá para acrescentar.
- Mesmo link e mesmo rastreio; cada página aparece na visita com o nome dela. Tom claro no computador, vitrine em lista.
- Pacotes e valores **de exemplo** (com o selo "você coloca os seus"); títulos e textos das legendas, da bio e das avaliações dela. Tudo no `demo.json` (`portfolio`).
- Gerar de novo: `python3 ferramentas/demo/gerar-portfolio.py demos/roberta-ale-fotografia <site.html> <natal.html>`, com o site e o Natal antigos tirados do git (`git show f255db1:demos/roberta-ale-fotografia/index.html` e `.../natal.html`).
