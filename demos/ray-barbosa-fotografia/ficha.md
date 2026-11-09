# Ray Barbosa Fotografia

| | |
|---|---|
| Onde | Av. Paulo Faccini, 351 - Macedo, Guarulhos - SP, 07130-000 |
| Instagram | [@raybarbosafoto](https://www.instagram.com/raybarbosafoto/) · 10,6 mil seguidores |
| Google | nota 5,0 · 42 avaliações · conferido em 06/11/2026 |
| WhatsApp | (11) 98605-2915 · celular do Perfil da Empresa no Google (+55 11 98605-2915) |
| Horário | Segunda a sexta 10h às 17h; Sábado 10h às 15h30; Domingo Fechado |
| Site | não tem: só o Instagram (lote 3, 06/11/2026) |
| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |
| Situação | pronta · 06/11/2026 · `/demo/ray-barbosa-fotografia` e `/demo/ray-barbosa-fotografia/natal` |
| Oferta na demo | R$ 399 no Pix ou 2x de R$ 199, pagamento único (o site fica 100% dela, sem mensalidade); promoção de uma semana, até 13/11/2026 (depois dessa data, o aviso some e fica só o valor): trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |
| Horários de exemplo | 13 livres de 24 (`horarios` no `demo.json`) |

## Direção da demo
- Lote 3 de fotógrafos (nº 16, 75 pontos), escolhida no Drive de 06/11/2026. A página salva no Drive veio sem o HTML (só as fotos): sem bio; os textos vêm da arte "sobre mim", das legendas de out/nov 2026 e das avaliações.
- Dona: Ray Barbosa (arte "sobre mim": formada em 2013, vive da fotografia desde 2016, primeiro estúdio em 2020). Foto dela: com a câmera, da página salva.
- Personalidade: "minha paixão pela arte de desenhar com a luz", retratos de estúdio com fundo vermelho e preto. Na demo: tema escuro com vermelho, Prata, "fotografia" em Corinthia, abertura em faixa.
- Sem logo em boa resolução: monograma RB e o nome com "fotografia" cursiva, feitos para a demo.

## O que tem na demo
- Site: abertura (Natal 2026, gestante e infantil), portfólio em 3 abas (Gestante, 11; Feminino e aniversário, 8; Infantil e família, 9), a Ray, os ensaios, 4 avaliações do Google, o bloco do Natal e o contato.
- Página de Natal "A minha edição de Natal 2026": o cenário (fotos de 2026 do feed), a agenda de exemplo (6 dias de segunda a sábado, de 14/11 a 05/12, das 10h às 15h, dentro do horário do Google) e outros ensaios do ano.
- Sem o aviso da Renderiza: o modal foi tirado em 06/11 (nas primeiras visitas, as pessoas saíam da página quando ele abria).

## Fotos
- Os posts de Natal de 02 e 05/11/2026 e o de aniversário, as fotos da página salva no Drive (1440 px) e 5 fotos do Google.
- Ficaram de fora: as capas de vídeo (9:16), as artes com texto, e os ensaios com nu ou sensuais (ela tem muitos), para a demo ficar boa de mandar para qualquer pessoa.

## Textos e fontes
- Arte "sobre mim" e legendas: "É com muita alegria que apresento a vocês a minha edição de Natal 2026!... Meu desejo é transformar momentos em família em memórias lindas" (26/10), "O Natal fica ainda mais especial quando estamos pertinho de quem amamos" (02/11), "Entre sorrisos, olhares e abraços..." (05/11), "Seu aniversário merece um momento só seu" (30/10), "entre 26 a 32 semanas" (arte).
- Avaliações do Google: as 5 visíveis sem login; 4 em cada página.

## Conferir antes de mandar
- Ela faz muito ensaio feminino sensual; a demo mostra só os vestidos e retratos.
- A maquiagem dos ensaios de Natal é de uma parceira (@gabrielamacielmakeup nas legendas); a página diz só "com maquiagem".
- Fotos de gestantes, crianças e clientes: todas publicadas por ela como portfólio. Vale ela confirmar se pode usar todas no site.

## Portfólio que vende, versão 3 (09/11/2026)
- Curado foto a foto (docs/nichos/fotografos.md, seção 10, "Regras do portfólio"). Capa da vitrine: `gestante:1`.
- `gestante`: Gestante (fotos gestante:5,0,2,1,6,8,4,7,9); a partir de R$ 450; depoimento: Ludymila Madalena
- `feminino`: Feminino (fotos feminino:3,0,6,4,2,1,5,7); a partir de R$ 400; depoimento: Eliana Cardoso Ramos
- `infantil`: Infantil (fotos infantil:1,2,3,6,4,7,5,8); a partir de R$ 350; depoimento: Rafael Xenofonte
- Pacotes e valores **de exemplo** (com o selo "você coloca os seus"). Tudo no `demo.json` (`portfolio`).
- Gerar de novo: `python3 ferramentas/demo/gerar-portfolio.py demos/ray-barbosa-fotografia <site.html> <natal.html>`, com o site e o Natal antigos tirados do git (`git show f255db1:demos/ray-barbosa-fotografia/index.html` e `.../natal.html`); conferir com `ferramentas/demo/conferir-portfolio.cjs`.
