# Estúdio Mandaluz Fotografia

| | |
|---|---|
| Onde | Av. Pref. Ângelo Celeguim, 4146 - Portal das Alamedas, Franco da Rocha - SP, 07809-000 |
| Instagram | [@mandaluzfotografia](https://www.instagram.com/mandaluzfotografia/) · 4,5 mil seguidores |
| Google | nota 5,0 · 31 avaliações · conferido em 13/11/2026 |
| WhatsApp | (11) 99967-1196 · celular do Perfil da Empresa no Google (+55 11 99967-1196), o mesmo das legendas ("Natal Mandaluz 2026 / (11) 99967-1196") |
| Site | não tem: só o Instagram (lote 3, 06/11/2026) |
| Entregável | **portfólio online, versão 4**: `index.html` (a vitrine) e uma página por ensaio (`gestante`, `newborn`, `retratos`, `natal`). Sai de `ferramentas/demo/gerar-portfolio.py demos/mandaluz-fotografia [<pasta dos originais>]`; textos, fotos e pacotes no `demo.json` (`portfolio`) |
| Situação | no ar · portfólio v4 em 13/11/2026 · `/demo/mandaluz-fotografia` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o portfólio fica 100% dela, sem mensalidade); promoção de uma semana, até 20/11/2026 (`renderiza.valido_ate` no `demo.json` e `demos.vale_ate` no painel) |

## Direção
- Lote 3 de fotógrafos (nº 4). Dona: Milena ("a Mi"). Estúdio de luz desenhada, fundo claro e escuro: o portfólio usa o tema escuro, Bodoni Moda e Jost, e o dourado da demo.
- Na v4 entraram duas páginas novas, porque agora há material: Newborn (o carrossel de 2 meses atrás) e Natal 2026 (o Ateliê de Panetones e a sala de Natal, com 3 famílias de clientes).

## O que tem
- **Vitrine**: "A fotografia guarda o que o tempo não consegue levar.", a tira de 7 fotos, a lista de ensaios com o "a partir de", o filtro por ensaio, 4 avaliações do Google, quem fotografa e o contato.
- **Páginas**: Gestante (16 fotos, depoimento de Cristy Leite); Newborn (10 fotos, sem depoimento); Retratos (10 fotos, depoimento de Vitória Nascimento Vieira); Natal 2026 (14 fotos, sem depoimento).
- Nenhum texto fala em "site". Pacotes e valores são de exemplo, com o selo na página.

## Fotos (escolhidas uma a uma na folha de contato grande)
- 50 fotos: 17 da grade do Instagram dela salva no Drive do Kaue (pasta na lixeira do Drive), 29 dos carrosséis lidos pelo embed público (De-rnZVEcDC, De9nHpLkdhq, DfIfX02me1N, DfXCxXSlj8u, DfalBrDGZqL, DfnlC5GmEfJ) e 4 do Perfil no Google.
- Tratadas a partir do original, sem ampliar e sem recorte (a página mostra a foto inteira): 1400 px na galeria, 1920 px na abertura, JPEG progressivo, qualidade 82.
- Ficaram de fora: o carrossel "Minha família, minha base" (é a família da própria fotógrafa, um post pessoal), as artes do "Cenário Ano Novo" (com texto), a foto com o selo de prêmio, a silhueta, os nus, o vídeo e as fotos em 9:16.

## Textos
- Dela: "A fotografia guarda tudo aquilo que o tempo não consegue levar", "A gestação é feita de pequenos momentos que lá na frente vão deixar saudade", "Quanto amor cabe numa fotografia?", "Que nunca nos faltem motivos para reunir a família…", "Natal Mandaluz 2026".
- Avaliações (lidas inteiras em 13/11): Cristy Leite (gestante) na página de gestante; Vitória Nascimento Vieira ("já fiz 5 ensaios") nos retratos; Newborn e Natal sem depoimento (nenhuma avaliação fala deles). A de Juliana Fernandes ficou de fora: cita a equipe.
- Não são dela: os pacotes e valores (exemplos) e o "quando fazer" de gestante e newborn (orientação comum do mercado).

## Conferir com ela
- A foto de "quem fotografa" é de um ensaio dela (não há foto da Milena em boa resolução).
- O newborn vem de um carrossel com legenda na voz da família ("Há dois meses, nossa família ficou ainda mais completa"): confirmar que é de cliente.
- Fotos de bebês, crianças e gestantes: todas publicadas por ela como portfólio. Vale confirmar se podem ficar todas.

## Gerar de novo
- `python3 ferramentas/demo/gerar-portfolio.py demos/mandaluz-fotografia [<pasta dos originais>]`. Sem os originais, o gerador reaproveita as fotos já tratadas (dá para mudar texto e preço); para trocar foto, baixar de novo (Drive pelo id; posts pelo `ig-post.py`).
- Conferir: `node ferramentas/demo/conferir-portfolio.cjs <pasta> mandaluz-fotografia` e `node ferramentas/demo/validar.mjs <página> <pasta>`.
