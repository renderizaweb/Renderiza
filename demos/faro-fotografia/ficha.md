# Estúdio Faro Fotografia

| | |
|---|---|
| Onde | R. João Manoel de Matos, 40 - Parque Res. Oratorio, São Paulo - SP, 03266-140 |
| Instagram | [@farofotografia](https://www.instagram.com/farofotografia/) · 11,4 mil seguidores |
| Google | nota 4,9 · 45 avaliações · conferido em 05/11/2026 |
| WhatsApp | (11) 91167-1432 · celular do Perfil da Empresa no Google (+55 11 91167-1432) |
| Horário | Segunda a sexta 9h às 18h; Sábado 9h às 16h; Domingo Fechado |
| Site | não tem: o Google não mostra site; os domínios "faro" são de outras empresas (lote 2, 05/11/2026) |
| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |
| Situação | pronta · 05/11/2026 · `/demo/faro-fotografia` e `/demo/faro-fotografia/natal` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199 (condição de lançamento), válida até 12/11/2026 (depois dessa data, o aviso some e fica só o valor): trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |
| Horários de exemplo | 13 livres de 24 (`horarios` no `demo.json`) |

## Direção da demo
- Lote 2 de fotógrafos, reserva (nº 25, 77 pontos), escolhida no Drive de 05/11/2026. Bio: "Maternidade & Família · Fotografia sensível para eternizar o início de uma história · Gestante • Parto • Newborn • Família · São Paulo – SP | Maringá – PR".
- Dona: Fabi (avaliações), com equipe e maquiadora. Foto: a do perfil do Instagram (mulher de franja, a mesma do vlog de 23/09).
- Cores: o rosa-antigo dos cenários de flores (#9b4f5b no destaque); Prata, Lato e "fotografia" em Parisienne; abertura em arco. Sem logo em boa resolução: monograma EF e "Estúdio Faro" com "fotografia" cursiva, feitos para a demo.

## O que tem na demo
- Site: abertura (gestante, família e Natal 2026), portfólio em 3 abas (Gestante, 10; Newborn, 6; Família, 6), a Fabi, os ensaios, 4 avaliações do Google, o bloco do Natal e o contato.
- Página de Natal "Natal Encantado": o ensaio, o cenário (3 quadros do vídeo de 28/10), a agenda de exemplo (6 dias de 14/11 a 05/12, das 9h às 15h, dentro do horário do Google) e outros ensaios do ano.

## Fotos
- O post de família de 24/10 (10 fotos, 4096 px), 5 quadros do vídeo do Natal Encantado de 28/10 (720 px, sem o texto), a página do Instagram salva no Drive (2021-2022, até 1440 px), 2 fotos do Google e a foto do perfil.
- Ficaram de fora: a capa do vídeo de Natal (com texto), a capa do vlog, as gestantes de lingerie ou de tecido muito expostas, as fotos de parto na maternidade e as fotos antigas pequenas ou borradas.

## Textos e fontes
- Bio e legendas: "Natal Encantado 2026... Neste ano, preparamos um cenário cheio de encanto, luzes e detalhes especiais... Mais do que fotografias, memórias!" (28/10), "A vida passa, a família cresce e as fotografias ficam" (24/10), o newborn "preferencialmente até os 10 dias" (18/09), o ensaio intrauterino (16/09).
- Avaliações do Google: das 5 visíveis sem login, 4 de 5 estrelas, nas duas páginas.

## Conferir antes de mandar
- A bio diz "São Paulo – SP | Maringá – PR": confirmar onde ela atende hoje e onde acontece o Natal Encantado (a página pede o local pelo WhatsApp). O Google mostra o endereço no Parque Residencial Oratório, em São Paulo.
- O cenário de Natal 2026 só aparece no vídeo (720 px); o fundo da rua parece ser um painel impresso.
- Último post em 28/10: perfil menos ativo que as outras.
- Horários: a agenda é exemplo, dentro do horário do Google (seg a sex 9h-18h, sáb 9h-16h).
- Fotos de gestantes, bebês e famílias: todas publicadas pelo estúdio como portfólio. Vale confirmar se pode usar todas no site.

## Portfólio que vende (09/11/2026)
- A demo virou **portfólio** (docs/nichos/fotografos.md, seção 10): a vitrine (`index`) e uma página de venda por ensaio: `gestante` (Gestante, a partir de R$ 550), `newborn` (Newborn, a partir de R$ 650), `familia` (Família, a partir de R$ 450). Sem página de Natal: não há foto do Natal 2026 dela (a página antiga com horários de exemplo saiu do ar). Quando ela postar o cenário, dá para acrescentar.
- Mesmo link e mesmo rastreio; cada página aparece na visita com o nome dela. Tom escuro no computador, vitrine em lista.
- Pacotes e valores **de exemplo** (com o selo "você coloca os seus"); títulos e textos das legendas, da bio e das avaliações dela. Tudo no `demo.json` (`portfolio`).
- Gerar de novo: `python3 ferramentas/demo/gerar-portfolio.py demos/faro-fotografia <site.html> <natal.html>`, com o site e o Natal antigos tirados do git (`git show f255db1:demos/faro-fotografia/index.html` e `.../natal.html`).
