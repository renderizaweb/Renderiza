# Óticas Laodiceia

| | |
|---|---|
| Onde | Taboão, Diadema (Av. Dom João VI, 987) |
| Instagram | [@oticas_laodiceia](https://www.instagram.com/oticas_laodiceia/) |
| Google | nota 5,0 · 17 avaliações (mostrar a nota) · conferido em 29/09/2026 |
| WhatsApp | (11) 95864-7777 (link da bio do Instagram) |
| Telefone no Google | (11) 98796-4985 |
| Entregável | demo de site (`index.html`) |
| Situação | pronta · 29/09/2026 · fotos refeitas em 02/10/2026 · `/demo/oticas-laodiceia` |

## Direção da demo
- Muita imagem de produto, equipe e donos, misturada com muita arte: garimpar só as fotos reais de pessoas e dos donos.
- Atenção aos rostos.

## Levantado no Google (29/09/2026)
- Endereço: Av. Dom João VI, 987 - Taboão, Diadema - SP, 09940-150. (O plus code do Google cai em
  "Taboão, São Bernardo do Campo": é divisa; na demo ficou Diadema, como no endereço.)
- Horário: segunda a sexta 9h30–18h, sábado 9h–15h, domingo fechado.
- O Google marca a loja como **empresa de empreendedoras**. Sem site cadastrado.
- Temas que se repetem: preço justo, entrega no prazo, ambiente acolhedor ("me senti em casa"),
  conserto na hora do aperto. Uma avaliação cita **Ana** no atendimento.
- 5 depoimentos coletados (Mirela Tenorio, Vitória Gomes, Juliana Andrade, Wagner Gonzales, Josehildo
  Ferreira da Silva). Para recoletar: `ferramentas/avaliacoes-google.mjs` com `"Óticas Laodiceia"
  "-23.671913,-46.6053659" "0x94ce4399ecd17bdb:0x966fa83334f664ac" "/g/11rgx3zg0p"`.

## O que tem na demo
- Capa preta e amarela (cores da marca) com "Cuidando da saúde dos seus olhos." e aviso de aberto/fechado.
- Sobre: fachada da loja, selo "Empresa de empreendedoras", nota e horário.
- Carrossel de 12 armações da vitrine, cartões de grau e sol, teste do formato do rosto.
- Passo a passo do exame ao óculos novo, 5 avaliações reais do Google com a nota 5,0 · 17.
- Instagram, mapa com horário e endereço.
- Fotos: pasta `oticas_laodiceia` do zip de referências (lotes-leads-1, 28/09/2026). O zip pegou
  posts de 2021; fotos com o cartão ou o endereço antigo ficaram de fora.

## Fotos refeitas (02/10/2026)
A primeira versão ficou ruim (Kaue): capa e "Sobre" com selfies de baixa resolução e quadros de vídeo de
uma moça falando, vitrine em recortes de 480 px que cortavam as lentes. Trocado:
- **Capa:** a moça de óculos tartaruga do post de 30/09/2026 (carrossel `Dd6hOrzFo5P`, 1080 px, ensaio
  dentro da loja), recortada abaixo do logo que vinha escrito na foto.
- **Sobre:** a fachada amarela com balões (foto do Google Maps, 960×1280); na polaroide, o balcão da loja.
- **Exame de vista:** armações vermelhas na prateleira com o nome da loja na parede; na polaroide, a mesma
  moça provando a armação (outra foto do carrossel).
- **Instagram:** a vitrine decorada de azul (zip), recortada abaixo do texto "Sexta-feira" e do aviso
  antigo de máscara.
- **Grau / Solar:** armações na bandeja de pérolas com o cartão da loja; óculos de sol com clip-on.
- **Vitrine:** as mesmas peças da loja, agora das fotos de 1080 px e em cartões 4:3 (o formato das fotos
  dela), para nenhuma lente sair cortada.
- Fora: selfies, quadros de vídeo e as artes de IA/banco de imagem que dominam o Instagram recente.
- Fonte para editar: `laodiceia.v2.src.html` (scratchpad), montada com `demo_build.py`.

## Conferir antes de mandar
- **Segunda unidade?** Um post antigo cita Rua Jerivá, 18 (Piraporinha) e o perfil tem destaque
  "Unidades". Não confirmei se ainda existem duas lojas; a demo mostra só a da Av. Dom João VI.
- **Dois números:** WhatsApp da bio (95864-7777) e telefone do Google (98796-4985). A demo usa o da bio
  no WhatsApp e mostra o do Google como telefone. Confirmar qual é o atual.
- Quem é a moça da capa (modelo do ensaio de 30/09/2026 ou alguém da loja?). A demo não cita nome.
