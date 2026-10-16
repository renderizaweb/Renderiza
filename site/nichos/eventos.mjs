// "Como funciona" para espaços de eventos (salões, chácaras, espaços de casamento): /como-funciona/eventos.
// É a página que o Kaue manda para o lead que ainda está na dúvida: o que o site faz, como funciona, os pacotes
// com preço e as perguntas de sempre (pedido de 16/10/2026). Os textos ficam aqui; a estrutura é de
// site/como-funciona.mjs, que serve a qualquer nicho (óticas depois: site/nichos/oticas.mjs).
// Regras: preço só o combinado; nada de "mais vendido" enquanto não houver venda que prove; nada de promessa de
// resultado ("mais clientes", "garantido"), superlativo ou "de bairro". Nenhuma demo nem foto de lead aparece aqui
// sem autorização do cliente: a ilustração do topo é desenhada, sem foto.

export default {
  id: "eventos",
  titulo: "Como funciona o site para espaços de eventos · Renderiza",
  descricao: "O site do seu espaço de eventos: as fotos do espaço e das festas, a opinião de quem fez a festa e a consulta de data que chega pronta no seu WhatsApp. Pacotes, prazo e pagamento.",

  abertura: {
    aviso: "Para salões, chácaras e espaços de eventos",
    h1: ["Mostre o espaço inteiro.", "Receba a data já escrita."],
    lide: "Quem procura um lugar para a festa quer ver tudo antes de chamar. O site junta as fotos do espaço, as festas que já aconteceram e a opinião de quem fez, e manda para o seu WhatsApp a consulta com o dia, o tipo de festa e o número de convidados.",
    fatos: ["Pronto em até 7 dias úteis", "Sem mensalidade", "No nome do seu espaço"],
  },

  // A ilustração do topo: a consulta de data no celular e a mensagem que chega no WhatsApp do espaço.
  ilustracao: {
    espaco: "Seu Espaço",
    campos: [["Data da festa", "Sábado, 14/03/2027"], ["Tipo de festa", "Casamento"], ["Convidados", "120"]],
    mensagem: ["Olá! Vim pelo site e queria consultar uma data.", "Data: sábado, 14/03/2027", "Festa: casamento", "Convidados: 120"],
  },

  // Hoje e com o site: a mesma conversa de todo dia, antes e depois.
  antesDepois: {
    sobretitulo: "O que muda",
    h2: ["A conversa com o cliente", "começa um passo à frente."],
    linhas: [
      ["Pedem foto, e você manda uma por uma.", "Você manda um link, e a pessoa vê o espaço inteiro."],
      ["A data vem picada, em várias mensagens.", "A consulta chega com o dia, a festa e os convidados."],
      ["Quem não conhece o espaço não sabe se pode confiar.", "As avaliações do Google estão logo na página."],
      ["O Instagram mostra a festa, mas não o lugar.", "Salão, área externa e estrutura, tudo organizado."],
    ],
  },

  // O que vai no site de um espaço de eventos.
  recursos: [
    { icone: "camera", titulo: "O espaço inteiro", texto: "Salão, área externa, estrutura e os cantos para foto, com as suas fotos reais." },
    { icone: "brilho", titulo: "Festas reais", texto: "Casamentos, 15 anos e aniversários que já aconteceram aí." },
    { icone: "aspas", titulo: "A opinião de quem fez", texto: "As avaliações do Google na página, para quem está decidindo." },
    { icone: "whatsapp", titulo: "Consultar uma data", texto: "O cliente escolhe o dia, a festa e os convidados. A mensagem chega pronta." },
  ],

  passos: [
    ["A gente monta uma prévia", "Com as fotos do seu Instagram e as avaliações do Google. Ver não custa nada."],
    ["Você vê no celular", "Um vídeo curto e o link, só seus. Dá para mostrar a quem decide junto com você."],
    ["Escolhe o pacote", "No Pix ou em 2x. Antes de ir para o ar, você pede os ajustes de texto e foto."],
    ["Fica pronto em até 7 dias úteis", "Contados do pagamento, com o endereço do seu espaço, como seuespaco.com.br."],
    ["Os acessos são seus", "Domínio e hospedagem no nome do espaço. Sem mensalidade e sem fidelidade."],
  ],

  // Pacotes: o Site é a base (preço do CONTEXTO.md); os outros dois são proposta de 16/10/2026, para o Kaue validar.
  pacotes: [
    {
      id: "site",
      nome: "Site",
      para: "Para ter o espaço inteiro num link só.",
      preco: { valor: "R$ 499", forma: "no Pix", parcela: "ou 2x de R$ 299" },
      inclui: [
        "Site completo com as suas fotos: o espaço, as festas e a estrutura",
        "Consultar uma data: a mensagem chega pronta no seu WhatsApp",
        "Avaliações do Google, endereço, mapa e horário",
        "Kit de divulgação: textos para a bio, o Google e o pedido de avaliação",
        "No nome do seu espaço, sem mensalidade",
      ],
      botao: "Quero o Site",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero o pacote Site.",
    },
    {
      id: "campanhas",
      nome: "Site + campanhas",
      selo: "Recomendado para eventos",
      para: "Para quem vende data o ano inteiro.",
      preco: { valor: "R$ 899", forma: "no Pix", parcela: "ou 2x de R$ 549" },
      inclui: [
        "Tudo do Site",
        "Pixel da Meta e Google Analytics cadastrados: você vê quantos chamaram pelo site",
        "2 páginas de campanha nos primeiros 12 meses",
      ],
      saberMais: {
        resumo: "Como funcionam as páginas de campanha",
        texto: [
          "Chegou uma data forte? Um Réveillon, o Carnaval, o Dia das Mães ou a agenda de 2027 abrindo: você pede pelo WhatsApp, e a gente monta uma página só para aquela campanha, com as fotos certas, as datas e o botão de consultar.",
          "Você tem 2 pedidos como esse nos 12 meses depois de fechar. A partir do terceiro, cada página é orçada à parte.",
        ],
        exemplos: ["Réveillon", "Carnaval", "Dia das Mães", "Festa junina", "Agenda 2027 aberta"],
      },
      botao: "Quero o Site + campanhas",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero o pacote Site + campanhas.",
    },
    {
      id: "anuncios",
      nome: "Site + anúncios",
      para: "Para quem quer anunciar no Instagram e no Facebook.",
      preco: { valor: "R$ 1.490", forma: "por mês", parcela: "mais o Site + campanhas (R$ 899) e o valor dos anúncios" },
      inclui: [
        "Tudo do Site + campanhas",
        "Criação e gestão dos anúncios no Instagram e no Facebook",
        "Relatório todo mês: quanto foi investido e quantos chamaram",
        "Mínimo de 3 meses",
      ],
      saberMais: {
        resumo: "Como funciona o investimento nos anúncios",
        texto: [
          "O valor dos anúncios é pago direto para a Meta (dona do Instagram e do Facebook), no cartão do espaço. Ele não passa pela Renderiza: você vê cada centavo na sua conta.",
          "A gente sugere começar com R$ 30 por dia, cerca de R$ 900 por mês, e ajustar depois de ver os números. Os R$ 1.490 por mês são a criação e a gestão dos anúncios.",
          "Os anúncios usam as fotos e os vídeos que o espaço já tem ou manda: a gente não faz sessão de fotos.",
        ],
      },
      botao: "Quero saber dos anúncios",
      mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero conversar sobre o pacote Site + anúncios.",
    },
  ],
  pacotesNota: "Os pacotes Site e Site + campanhas são valor único, sem mensalidade. O domínio e a hospedagem ficam no nome do espaço e podem ter custos próprios.",

  perguntas: [
    ["Recebi uma prévia do site do meu espaço. O que é?", "Uma demonstração feita só para você, com o que o espaço já mostra em público: as fotos do Instagram e as avaliações do Google. O link não aparece no Google e sai do ar sozinho em 7 dias; se preferir, a gente tira antes. Para ver, você não passa nenhum dado nem paga nada."],
    ["Já tenho Instagram. Preciso de um site?", "O Instagram mostra a festa e continua importante. O site mostra o lugar: o espaço inteiro, a estrutura, as avaliações e a consulta de data, num link que vai na bio, no Google e no WhatsApp. E ainda leva para o seu Instagram."],
    ["Estou no casamentos.com.br. Vale a pena ter o site?", "Dá para manter os dois. No portal, o cliente pede orçamento por lá; no site, ele fala direto com você, e o link é seu para mandar a quem pedir."],
    ["Quanto tempo leva para ficar pronto?", "Até 7 dias úteis depois do pagamento. A prévia já está quase toda pronta: o que falta são os seus ajustes e o endereço no nome do espaço."],
    ["Tem mensalidade?", "Nos pacotes Site e Site + campanhas, não: é um valor único, no Pix ou em 2x. Só o pacote com anúncios tem valor por mês, porque os anúncios são cuidados todo mês."],
    ["O site fica no meu nome?", "Fica. O endereço, a hospedagem e os acessos são do espaço, não da Renderiza. Se um dia quiser que outra pessoa cuide do site, é só passar os acessos."],
    ["Vocês fazem tráfego pago?", "Fazemos, no pacote Site + anúncios: a gente cria e cuida dos anúncios no Instagram e no Facebook, e o valor investido é pago direto para a Meta, no cartão do espaço. Se você já tem quem cuide dos anúncios, o pacote Site + campanhas sai com o Pixel e o Google Analytics cadastrados para essa pessoa usar."],
    ["Quem decide é outra pessoa. E agora?", "Encaminhe o vídeo e o link da prévia: abrem em qualquer celular. Se preferir, conte o nome e o melhor horário dessa pessoa, e a gente fala direto com ela."],
  ],

  convite: {
    h2: ["Quer ver como ficaria", "o seu espaço?"],
    texto: "Mande o nome ou o Instagram do espaço. A gente monta a prévia e te mostra no celular, sem compromisso. Já recebeu a sua? É só responder na mesma conversa.",
    botao: "Falar no WhatsApp",
    mensagem: "Oi! Vi como funciona o site para espaços de eventos e quero conversar.",
  },
};
