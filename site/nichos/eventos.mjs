// "Como funciona" para espaços de eventos (salões, chácaras, espaços de casamento): /como-funciona/eventos.
// É o link que o Kaue manda quando o lead pergunta "como funciona?" ou "quanto custa?": tem que dar para entender
// tudo em uma passada de olho (pedidos de 16/10/2026: página de venda curta, resumida). Os textos ficam aqui; a
// estrutura é de site/como-funciona.mjs, que serve a qualquer nicho (óticas depois: site/nichos/oticas.mjs).
// Regras: preço só o combinado; nada de "mais vendido" enquanto não houver venda que prove; nada de promessa de
// resultado ("mais clientes", "garantido"), superlativo ou "de bairro". Nenhuma demo nem foto de lead aparece aqui
// sem autorização do cliente: a ilustração do topo é desenhada, sem foto.

export default {
  id: "eventos",
  titulo: "Como funciona o site para espaços de eventos · Renderiza",
  descricao: "O site do seu espaço de eventos: as fotos, as avaliações e a consulta de data que chega pronta no seu WhatsApp. Como funciona, pacotes e preços.",

  abertura: {
    aviso: "Para salões, chácaras e espaços de eventos",
    h1: ["Mostre o espaço inteiro.", "Receba a data já escrita."],
    lide: "Um site com as fotos do espaço, as avaliações do Google e a consulta de data que chega pronta no seu WhatsApp.",
    fatos: ["Pronto em até 7 dias úteis", "Site sem mensalidade", "Os acessos são seus"],
  },

  // A ilustração do topo: a consulta de data no celular e a mensagem que chega no WhatsApp do espaço.
  ilustracao: {
    espaco: "Seu Espaço",
    campos: [["Data da festa", "Sábado, 13/03/2027"], ["Tipo de festa", "Casamento"], ["Convidados", "120"]],
    mensagem: ["Olá! Vim pelo site e queria consultar uma data.", "Data: sábado, 13/03/2027", "Festa: casamento", "Convidados: 120"],
  },

  // O "sol": tudo o que o espaço tem na internet indo para o site, no centro (pedido do Kaue, 16/10/2026).
  // Cada ponta é [ícone, nome]; os ícones das redes vêm de site/marcas.mjs.
  sol: {
    sobretitulo: "Tudo num lugar só",
    h2: ["Tudo o que o espaço tem,", "num link só."],
    lide: "As redes, o WhatsApp, as avaliações do Google e as fotos reais do espaço, juntos no site.",
    endereco: "seuespaco.com.br",
    pontas: [
      ["instagram", "Instagram"], ["fotos", "Fotos reais"], ["facebook", "Facebook"], ["google", "Avaliações"],
      ["tiktok", "TikTok"], ["aspas", "Depoimentos"], ["whatsapp", "WhatsApp"], ["mapa", "Localização"],
    ],
  },

  passos: [
    ["A gente monta uma prévia", "Com as fotos do seu Instagram. Ver não custa nada."],
    ["Você pede os ajustes", "No texto e nas fotos, antes de decidir."],
    ["O site vai para o ar", "Você paga e, em até 7 dias úteis, o site entra no ar com o endereço do espaço."],
  ],

  // Pacotes: o Essencial é o preço do CONTEXTO.md; o Completo e o com anúncios são proposta, para o Kaue validar.
  // O com anúncios é caro de propósito: a Renderiza não quer fechar tráfego pago agora (Kaue, 16/10/2026).
  pacotes: [
    {
      id: "essencial",
      nome: "Essencial",
      para: "O site do seu espaço.",
      preco: { valor: "R$ 499", forma: "no Pix", parcela: "ou 2x de R$ 299 · sem mensalidade" },
      // Mês de inauguração (CONTEXTO.md): até 31/10 o preço grande é este; depois some sozinho e volta o de cima.
      inauguracao: { valor: "R$ 399", forma: "no Pix", parcela: "ou 2x de R$ 199 · sem mensalidade", nota: "Mês de inauguração, até 31/10. Depois, R$ 499." },
      inclui: [
        "Fotos do espaço e das festas",
        "Consulta de data direto no seu WhatsApp",
        "Avaliações do Google, endereço e mapa",
        "Textos prontos para o Instagram e o Google",
      ],
      botao: "Quero o Essencial",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero o pacote Essencial.",
    },
    {
      id: "completo",
      nome: "Completo",
      selo: "Recomendado para eventos",
      para: "Para quem vende data o ano inteiro.",
      preco: { valor: "R$ 699", forma: "no Pix", parcela: "ou 2x de R$ 399 · sem mensalidade" },
      inclui: [
        "Tudo do Essencial",
        "2 páginas extras em 12 meses, para datas como Réveillon e festa junina",
        "Você vê quantos clicaram no WhatsApp (Pixel e Google Analytics)",
      ],
      saberMais: {
        resumo: "Como funcionam as páginas extras",
        texto: [
          "Chegou uma data especial? Você pede pelo WhatsApp e a gente monta no seu site uma página só para ela, com as fotos e o botão de consultar. São 2 pedidos nos 12 meses depois de fechar; a partir do 3º, cada página é orçada à parte.",
        ],
        exemplos: ["Réveillon", "Carnaval", "Dia das Mães", "Festa junina", "Agenda 2027"],
      },
      botao: "Quero o Completo",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero o pacote Completo.",
    },
    {
      id: "anuncios",
      nome: "Completo + Anúncios",
      para: "A gente cria e cuida dos seus anúncios no Instagram e no Facebook.",
      // Um valor por mês, o site dentro, e o valor dos anúncios à parte, pago à Meta no cartão do espaço.
      preco: { valor: "R$ 1.490", forma: "por mês", parcela: "Mínimo de 3 meses. Mais o valor dos anúncios, pago direto à Meta (sugestão: a partir de R$ 30 por dia)." },
      inclui: [
        "O site Completo, já incluso e no seu nome",
        "Anúncios com as fotos e os vídeos que você já tem",
        "Relatório todo mês",
      ],
      botao: "Quero saber dos anúncios",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero conversar sobre o pacote Completo + Anúncios.",
    },
  ],
  // Valor do Registro.br para .com.br conferido em 16/10/2026 (registro.br/dominio).
  pacotesNota: "O endereço (seuespaco.com.br) é registrado no nome do espaço, direto no Registro.br: R$ 40 por ano.",

  perguntas: [
    ["Recebi uma prévia do meu espaço. O que é?", "Uma demonstração feita só para você, com as fotos do seu Instagram e as avaliações do Google. O link não aparece no Google e tem prazo para sair do ar. Para ver, você não paga nada."],
    ["Já tenho Instagram e portal de casamento. Preciso de site?", "O Instagram mostra a festa; o site mostra o lugar, com a consulta de data, num link que é seu para mandar a quem pedir. Dá para manter tudo junto."],
    ["Tem mensalidade?", "No Essencial e no Completo, não: é um valor único, no Pix ou em 2x. Só o pacote com anúncios é por mês, porque os anúncios são cuidados todo mês."],
    ["O site fica no meu nome?", "Fica. O endereço, a hospedagem e os acessos são do espaço, não da Renderiza."],
  ],

  convite: {
    h2: ["Quer ver como ficaria", "o seu espaço?"],
    texto: "Mande o nome ou o Instagram do espaço, e a gente monta a prévia. Sem compromisso.",
    botao: "Falar no WhatsApp",
    mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero conversar.",
  },
};
