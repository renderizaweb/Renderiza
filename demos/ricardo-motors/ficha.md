# Ricardo Motors (@rm.consultcar): ficha da demo

- **Lead:** Ricardo Motors | RM Consult Car, indicação da Taise (Tata's Photo Art). Nicho: Automotivo.
- **Direção (v2, 17/11/2026):** loja enxuta no padrão dos portais de carro (Webmotors, Porsche Finder): topo preto
  com um carro em destaque, estoque logo abaixo com foto deslizável em cada card, página de cada carro com caixa de
  preço e WhatsApp com o carro na mensagem. Sem a faixa da Renderiza no topo (a demo vai direto pelo WhatsApp).
- **v3 (17/11/2026):** capa nova (texto curto à esquerda e vitrine de 4 carros com foto grande à direita; no
  celular, foto limpa no topo e texto abaixo), fotos dos cards deslizam com o dedo, serviços em faixa deslizante no
  celular e foto do Ricardo recortada nele e no logo RM.
- **Fotos:** originais do servidor da Webmotors no tamanho em que foram enviadas (sem ampliar), até 8 por carro.
  10 carros com galeria (anúncio salvo); 328i, Haval H9, X2, X1 e X3 só com a foto de capa.
- **Fontes:** anúncios da Webmotors salvos (Drive), página da loja (15 carros, 17/11/2026), Instagram (foto do
  Ricardo, depoimento de cliente de 2020). 8 carros marcados como blindados nos próprios anúncios.
- **Indicadores:** cada carro aberto conta como clique ("Ver BMW 530e", em Estoque), filtros também; a página do
  carro é uma parte própria ("Página do carro"), com tempo e cliques. Testado com o `exemplos/visitas.js`.
- **Página feita à mão** (não pelo gerador); passa no `validar.mjs`.

- **Painel de exemplo do Estoque (20/11/2026):** `/demo/ricardo-motors/painel` (`painel.html`): a casca do Painel
  Renderiza com o módulo Estoque em protótipo (`exemplos/estoque`, docs/painel-clientes/12-modulo-estoque.md) e os 15
  carros dele; o site ao lado recebe a lista na hora (`?rz-estoque=exemplo`, só dentro do painel). O que ele mudar fica
  no navegador dele. Sai do ar junto com a demo.
- **Vídeo do Estoque:** `/gravacao/ricardo-motors-estoque.mp4` (38 s, sem voz, trilha pulsante original; `instagram/reels-estoque.html`
  com as capturas de `instagram/telas-estoque.mjs`). O Porsche 911 que entra no estoque no vídeo é um exemplo.

- **Proposta do Estoque (20/11/2026):** `/proposta/ricardo-motors` (`propostas/ricardo-motors.html`, não sai do ar com a
  demo): o vídeo, o site pronto e as duas formas de manter o estoque (por fora: Vercel Pro US$ 20 + Supabase Pro US$ 25,
  ≈ R$ 250/mês; ou o Painel Renderiza, R$ 49/mês, com o Meu site e o Estoque). Nas Atividades: "Abriu a proposta
  comercial", o play, a metade e o fim do vídeo, "viu o card com o valor", o tempo em cada parte e o WhatsApp.

## Conferir antes de mandar
- **WhatsApp:** os botões usam o link da bio (`wa.me/message/G5X6UUN627ARL1`), que abre sem a mensagem pronta.
  Com o número dele, preencher `WA_NUM` no script e cada botão sai com o carro na mensagem.
- **Estoque é de 17/11/2026:** carro vendido depois disso ainda aparece.
