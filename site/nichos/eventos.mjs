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
    campos: [["Data da festa", "Sábado, 14/03/2027"], ["Tipo de festa", "Casamento"], ["Convidados", "120"]],
    mensagem: ["Olá! Vim pelo site e queria consultar uma data.", "Data: sábado, 14/03/2027", "Festa: casamento", "Convidados: 120"],
  },

  passos: [
    ["A gente monta uma prévia", "Com as fotos do seu Instagram. Ver não custa nada."],
    ["Você ajusta do seu jeito", "Diz o que mudar, e a gente muda."],
    ["O site vai para o ar", "Em até 7 dias úteis, com o endereço do espaço e os acessos no seu nome."],
  ],

  // Pacotes: o Essencial é o preço do CONTEXTO.md; o Completo e o com anúncios são proposta, para o Kaue validar.
  // O com anúncios é caro de propósito: a Renderiza não quer fechar tráfego pago agora (Kaue, 16/10/2026).
  pacotes: [
    {
      id: "essencial",
      nome: "Essencial",
      para: "O site do seu espaço.",
      preco: { valor: "R$ 499", forma: "no Pix", parcela: "ou 2x de R$ 299 · pagamento único" },
      // Mês de inauguração (CONTEXTO.md): o valor aparece com a data e some sozinho depois de 31/10.
      inauguracao: "Mês de inauguração: R$ 399 no Pix ou 2x de R$ 199, até 31/10.",
      inclui: [
        "Fotos do espaço e das festas",
        "Consulta de data direto no seu WhatsApp",
        "Avaliações do Google, endereço e mapa",
        "Textos prontos para a bio e o Google",
      ],
      botao: "Quero o Essencial",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero o pacote Essencial.",
    },
    {
      id: "completo",
      nome: "Completo",
      selo: "Recomendado para eventos",
      para: "O site e mais 2 páginas para as datas fortes do ano.",
      preco: { valor: "R$ 699", forma: "no Pix", parcela: "ou 2x de R$ 399 · pagamento único" },
      inclui: [
        "Tudo do Essencial",
        "2 páginas de datas especiais em 12 meses",
        "Pixel e Google Analytics: você sabe quantos chamaram pelo site",
      ],
      saberMais: {
        resumo: "Como funcionam as páginas de datas",
        texto: [
          "Chegou uma data forte? Você pede pelo WhatsApp, e a gente monta no seu site uma página só para ela, com as fotos certas e o botão de consultar.",
          "São 2 pedidos nos 12 meses depois de fechar. A partir do terceiro, cada página é orçada à parte.",
        ],
        exemplos: ["Réveillon", "Carnaval", "Dia das Mães", "Festa junina", "Agenda 2027"],
      },
      botao: "Quero o Completo",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero o pacote Completo.",
    },
    {
      id: "anuncios",
      nome: "Completo + Anúncios",
      para: "A gente cuida dos seus anúncios no Instagram e no Facebook.",
      preco: { valor: "R$ 1.490", forma: "por mês", parcela: "Mínimo de 3 meses, com o site Completo incluso." },
      inclui: [
        "Tudo do Completo",
        "Criação e gestão dos anúncios",
        "Relatório todo mês",
      ],
      saberMais: {
        resumo: "E o valor dos anúncios?",
        texto: [
          "É pago direto para a Meta, no cartão do espaço, e não passa pela Renderiza. A sugestão é começar com R$ 30 por dia.",
          "Os anúncios usam as fotos e os vídeos do espaço: a gente não faz sessão de fotos.",
        ],
      },
      botao: "Quero saber dos anúncios",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero conversar sobre o pacote Completo + Anúncios.",
    },
  ],
  pacotesNota: "O domínio (seuespaco.com.br) fica no nome do espaço e é pago direto ao Registro.br, uma vez por ano.",

  perguntas: [
    ["Recebi uma prévia do meu espaço. O que é?", "Uma demonstração feita só para você, com as fotos do seu Instagram e as avaliações do Google. O link não aparece no Google e sai do ar sozinho em 7 dias. Para ver, você não paga nada."],
    ["Já tenho Instagram e portal de casamento. Preciso de site?", "O Instagram mostra a festa; o site mostra o lugar, com a consulta de data, num link que é seu para mandar a quem pedir. Dá para manter tudo junto."],
    ["Tem mensalidade?", "No Essencial e no Completo, não: você paga uma vez, no Pix ou em 2x. Só o pacote com anúncios é por mês, porque os anúncios são cuidados todo mês."],
    ["O site fica no meu nome?", "Fica. O endereço, a hospedagem e os acessos são do espaço, não da Renderiza."],
  ],

  convite: {
    h2: ["Quer ver como ficaria", "o seu espaço?"],
    texto: "Mande o nome ou o Instagram do espaço, e a gente monta a prévia. Sem compromisso.",
    botao: "Falar no WhatsApp",
    mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero conversar.",
  },
};
