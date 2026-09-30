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
    // Foto real, quadrada ou vertical, em site/estatico/imagens/ (ex.: "/imagens/kaue.webp"). PENDENTE.
    foto: "",
    trabalhoAtual: "Warren Investimentos",
    // Desde quando cria soluções digitais para clientes.
    desde: "abril de 2025",
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

  // Trabalhos selecionados. Só aparecem os que têm publicar: true.
  //   selo: "cliente" (projeto de cliente) ou "demonstracao" (demonstração conceitual)
  //   imagem: caminho em site/estatico/imagens/ (print real do trabalho); sem imagem, aparece um cartão só com texto
  //   link: endereço do trabalho no ar, quando existir
  //   falta: o que ainda precisa ser confirmado (só para você; não aparece no site)
  trabalhos: [
    {
      id: "bulens",
      titulo: "Bulens",
      tipo: "Ótica",
      selo: "cliente",
      texto: "Ótica cliente da Renderiza, com projeto fechado.",
      imagem: "",
      link: "",
      publicar: true,
      falta: "Grafia do nome (Bulens ou BlueLens), o que foi entregue, print do trabalho, link se estiver no ar e se a ótica autoriza aparecer aqui.",
    },
    {
      id: "app-rafael",
      titulo: "Aplicativo ligado à academia",
      tipo: "Aplicativo",
      selo: "cliente",
      texto: "Aplicativo que estou desenvolvendo para um cliente, o Rafael.",
      imagem: "",
      link: "",
      publicar: true,
      falta: "Nome do aplicativo, uma frase sobre o que ele faz, uma tela real e se o Rafael autoriza o nome dele aqui.",
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
