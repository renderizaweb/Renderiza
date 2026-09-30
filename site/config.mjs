// Dados do site público (a home em /). Tudo o que muda com frequência fica aqui.
// Campo vazio ("") = PENDENTE: o site esconde o que depende dele e o build avisa no terminal.
// Não preencha nada que não esteja confirmado.

export default {
  // Endereço público do site, sem barra no fim. Usado no link canônico e na imagem de compartilhamento
  // (o WhatsApp só mostra a prévia com endereço completo). renderizaweb.com.br redireciona para o www.
  endereco: "https://www.renderizaweb.com.br",

  pessoa: {
    nome: "Kaue",
    nomeCompleto: "Kaue de Almeida Cunha",
    // Foto real em site/estatico/imagens/ (a grande no "Quem faz", o recorte do rosto na abertura).
    foto: "/imagens/kaue.webp",
    avatar: "/imagens/kaue-avatar.webp",
    anosDeExperiencia: 5,
    trabalhoAtual: "Warren Investimentos",
    // Trajetória curta no "Quem faz": o que dá confiança, sem virar currículo.
    trajetoria: [
      {
        rotulo: "Hoje",
        texto: "Na Warren Investimentos, desenvolvo uma plataforma para assessores de investimento, com boletagem de aplicações e resgates, integrações complexas, CRM e gestão de leads.",
      },
      {
        rotulo: "Renderiza",
        texto: "Projeto próprio e independente: sites para negócios locais e aplicativos sob medida, como o Move.",
      },
    ],
  },

  contato: {
    // Número do WhatsApp Business com DDI e DDD, só dígitos.
    whatsapp: "5511988697165",
    // Mensagem que já vem escrita quando a pessoa abre a conversa.
    mensagemWhatsapp: "Oi, Kaue! Vi o site da Renderiza e quero conversar sobre um projeto.",
    // Perfil pessoal (sem os parâmetros de rastreio do link de compartilhar).
    linkedin: "https://www.linkedin.com/in/kaue-de-almeida-cunha-300188193",
    // Instagram da Renderiza: ainda não criado (30/09/2026). Opcional: o site funciona sem.
    instagram: "",
  },

  // Trabalhos realizados. Só aparecem os que têm publicar: true.
  //   selo: "cliente" ou "demonstracao" (esta ganha a etiqueta "Demonstração conceitual")
  //   destaque: true = cartão grande com print, recursos e crédito
  //   imagem: caminho em site/estatico/imagens/ (print real do trabalho); sem imagem, aparece um cartão só com texto
  //   link: endereço do trabalho no ar, quando existir
  //   falta: o que ainda precisa ser confirmado (só para você; não aparece no site)
  trabalhos: [
    {
      id: "move",
      titulo: "Move",
      tipo: "Aplicativo · treinos e acompanhamento",
      selo: "cliente",
      // destaque: cartão grande, com print e lista de recursos
      destaque: true,
      texto: "Plataforma para alunos e personal trainers: o personal monta e envia o treino, o aluno executa série por série e os dois acompanham a evolução.",
      recursos: [
        { titulo: "Treinos guiados", texto: "Execução série por série, com carga e descanso." },
        { titulo: "MoveScan", texto: "Composição corporal estimada a partir de duas fotos." },
        { titulo: "Chat com IA", texto: "Tira dúvidas na hora, com o contexto dos treinos do aluno." },
        { titulo: "Diário alimentar", texto: "Refeições registradas, com contagem de calorias." },
        { titulo: "Painel do personal", texto: "Cria treinos, convida alunos e acompanha a frequência." },
        { titulo: "Notificações", texto: "Aviso de treino novo e de mensagem do personal." },
      ],
      credito: "Um produto Move, desenvolvido pela Renderiza.",
      imagem: "/imagens/move.webp",
      alt: "Página inicial do Move, com a tela de um treino em execução",
      link: "https://www.movexfit.com.br",
      linkTexto: "Conhecer o Move",
      publicar: true,
      falta: "",
    },
    {
      id: "blue-lens",
      titulo: "Ótica Blue Lens",
      tipo: "Site · ótica",
      selo: "cliente",
      texto: "Site da ótica, desenvolvido pela Renderiza.",
      imagem: "",
      // Kaue lembrava de oticasbluelens01.com.br, mas esse domínio não existe (30/09/2026).
      link: "",
      publicar: true,
      falta: "Endereço do site no ar e um print; o que o site tem para descrever melhor.",
    },
    {
      id: "demos-oticas",
      titulo: "Demonstrações para óticas de bairro",
      tipo: "Sites",
      selo: "demonstracao",
      texto: "Sites de exemplo que preparo para óticas da Grande São Paulo, com fotos reais da loja, avaliações do Google, WhatsApp e mapa. Cada ótica recebe o próprio link, que não fica aberto ao público.",
      imagem: "",
      link: "",
      // Kaue, 30/09/2026: nenhuma demo na home até ter aprovação de cliente.
      publicar: false,
      falta: "Aprovação de uma ótica para mostrar a demo dela.",
    },
    // Demos marcadas como "redesign conceitual" no portfólio do painel, ainda com "pode publicar: não".
    // Usam fotos de clientes das óticas: só publicar com aprovação de cada ótica (nenhuma aprovou ainda).
    {
      id: "otica-catglass",
      titulo: "Ótica CatGlass",
      tipo: "Site · Taboão da Serra",
      selo: "demonstracao",
      texto: "Redesign conceitual do site da ótica.",
      imagem: "",
      link: "/demo/otica-catglass",
      publicar: false,
      falta: "Autorização da ótica e print da demo.",
    },
    {
      id: "oticas-perez",
      titulo: "Óticas Perez",
      tipo: "Site · Mauá",
      selo: "demonstracao",
      texto: "Redesign conceitual do site da ótica.",
      imagem: "",
      link: "/demo/oticas-perez",
      publicar: false,
      falta: "Autorização da ótica e print da demo.",
    },
    {
      id: "franco-oticas",
      titulo: "Franco Óticas",
      tipo: "Site · Franco da Rocha",
      selo: "demonstracao",
      texto: "Redesign conceitual do site da ótica.",
      imagem: "",
      link: "/demo/franco-oticas",
      publicar: false,
      falta: "Autorização da ótica e print da demo.",
    },
  ],
};
