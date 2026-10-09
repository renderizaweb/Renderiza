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
    anosDeExperiencia: 5,
    trabalhoAtual: "Warren Investimentos",
  },

  // Quem está por trás da Renderiza: os dois cofundadores, lado a lado e com o mesmo destaque.
  // foto: retrato 3:4 (720×960) em site/estatico/imagens/, com o rosto na mesma altura nos dois.
  fundadores: [
    {
      id: "kaue", nome: "Kaue", papel: "Cofundador", area: "Tecnologia e desenvolvimento",
      foto: "/imagens/kaue.webp",
      texto: "Desenvolvedor há 5 anos, com foco em produto. Trabalha em tempo integral na Warren Investimentos e conduz a Renderiza em paralelo. Aqui, cuida da tecnologia: desenvolve os sites e aplicativos, do primeiro esboço até o ar.",
      linkedin: "https://www.linkedin.com/in/kaue-de-almeida-cunha-300188193",
    },
    {
      id: "milena", nome: "Milena", papel: "Cofundadora", area: "Relacionamento e operações",
      foto: "/imagens/milena.webp",
      texto: "Construiu a carreira no RH, perto das pessoas: atendimento, organização e processos mais simples e automatizados. Aqui, cuida do relacionamento com os clientes, do primeiro contato ao pós-venda, organiza os projetos e conduz a estratégia e a comunicação da marca.",
      linkedin: "",
    },
  ],

  contato: {
    // Número do WhatsApp Business com DDI e DDD, só dígitos.
    whatsapp: "5511988697165",
    // Mensagem que já vem escrita quando a pessoa abre a conversa (os botões do teste, do convite final e de
    // aplicativo têm a sua própria, em site/pagina.mjs).
    mensagemWhatsapp: "Oi! Vi o site da Renderiza e quero ver como ficaria o site do meu negócio.",
    // Perfil pessoal (sem os parâmetros de rastreio do link de compartilhar).
    linkedin: "https://www.linkedin.com/in/kaue-de-almeida-cunha-300188193",
    // Instagram da Renderiza: ainda não criado (30/09/2026). Opcional: o site funciona sem.
    instagram: "",
  },

  // Depoimentos. Só aparecem com texto e publicar: true (depois da aprovação de quem falou), na ordem daqui:
  // primeiro quem é do público de hoje (negócios com site), depois os de aplicativo.
  //   trabalho: id do trabalho a que se refere; foto: opcional, em site/estatico/imagens/
  depoimentos: [
    {
      id: "blue-lens", nome: "Davi", papel: "Ótica Blulens", trabalho: "blue-lens", foto: "",
      // Depoimento enviado em 01/10/2026, com autorização para publicar o site e o feedback no portfólio.
      // Na home vai o 2º parágrafo, sem mudar uma palavra (o texto inteiro não cabe no cartão). Íntegra:
      //   "Graças a Deus, estamos muito satisfeitos com o trabalho de vocês e principalmente com o resultado do site da
      //   Ótica Blulens. / Desde o início, percebemos muito cuidado em entender a nossa empresa, nossa identidade e aquilo
      //   que queríamos transmitir aos nossos clientes. O site ficou moderno, profissional, organizado e alinhado com o
      //   posicionamento que estamos buscando para a Blulens. / Também gostamos bastante da experiência durante o
      //   desenvolvimento, principalmente pela atenção aos detalhes, disponibilidade para ouvir nossas sugestões e pela
      //   preocupação em entregar algo realmente personalizado para o nosso negócio. / Sentimos que o site hoje transmite
      //   muito mais confiança e profissionalismo para quem conhece a Ótica Blulens pela internet, além de ser uma
      //   ferramenta importante para nossos clientes encontrarem nossa empresa e conhecerem nossos produtos e serviços. /
      //   Parabéns pelo trabalho e pelo profissionalismo! Com certeza ficamos muito felizes com o resultado e recomendamos
      //   o trabalho de vocês para outros negócios que estejam buscando um site profissional e feito de forma
      //   personalizada. / Podem incluir nosso site e esse feedback no portfólio de vocês. Será um prazer contribuir para
      //   mostrar esse trabalho. / Obrigado pela parceria, Kaue!"
      // valor: o trecho em que o próprio cliente diz o que o site resolveu (4º parágrafo, sem mudar uma palavra).
      //   Vai na seção "E se o cliente já chegasse sabendo de tudo?", a necessidade nas palavras de quem já tem.
      valor: "Sentimos que o site hoje transmite muito mais confiança e profissionalismo para quem conhece a Ótica Blulens pela internet, além de ser uma ferramenta importante para nossos clientes encontrarem nossa empresa e conhecerem nossos produtos e serviços.",
      texto: "Desde o início, percebemos muito cuidado em entender a nossa empresa, nossa identidade e aquilo que queríamos transmitir aos nossos clientes. O site ficou moderno, profissional, organizado e alinhado com o posicionamento que estamos buscando para a Blulens.",
      publicar: true,
    },
    {
      id: "luciene", nome: "Luciene Eunice", papel: "Lú Elegante", trabalho: "lu-elegante-modas", foto: "", publicar: true,
      // Aprovado pela Luciene em 01/10/2026.
      texto: "O Kaue teve muita paciência comigo em cada etapa do site da loja. Explicou tudo com calma, ouviu o que eu queria, e o site ficou melhor do que eu imaginava.",
    },
    {
      id: "raphael", nome: "Raphael", papel: "Criador do Move", trabalho: "move", foto: "", publicar: true,
      // Mensagem do Raphael (30/09/2026), só com a pontuação ajustada.
      texto: "Trabalhar com você até agora está sendo ótimo: é um profissional sempre presente, com muitas ideias que agregam ao projeto, sempre respeitando o prazo e às vezes entregando até antes. A comunicação é simples e direta, o que deixa o cliente super confortável e seguro com o trabalho.",
    },
    {
      id: "milena", nome: "Milena", papel: "Idealizadora do Compasso", trabalho: "compasso", foto: "", publicar: true,
      // Aprovado pela Milena em 01/10/2026.
      texto: "Eu queria um jeito simples de organizar as finanças da casa, e o Kaue transformou essa ideia no Compasso. Hoje a gente vê o mês inteiro num lugar só e planeja os seguintes com tranquilidade. Ele ouviu cada detalhe que eu pedi até ficar do jeito que a gente precisava.",
    },
  ],

  // Trabalhos realizados (portfólio). Só aparecem os que têm publicar: true, na ordem daqui: primeiro os sites
  // (o público de hoje: lojas, clínicas e consultórios), depois os aplicativos.
  //   Cada um vira um cartão (print + resumo) que abre um pop-up com o projeto inteiro.
  //   selo: "cliente" ou "demonstracao" (esta ganha a etiqueta "Demonstração conceitual")
  //   destaque: true = aparece na abertura do site, no celular (os dois primeiros com print de celular)
  //   resumo: uma frase para o cartão; texto: a descrição completa do pop-up
  //   imagem / imagemGrande / imagemCelular: prints em site/estatico/imagens/projetos/ (1400 px, 2400 px e
  //     celular), todos tirados em alta resolução; sem imagem, o cartão mostra só a inicial
  //   link: endereço do trabalho no ar, quando existir
  //   falta: o que ainda precisa ser confirmado (só para você; não aparece no site)
  trabalhos: [
    {
      id: "blue-lens",
      titulo: "Ótica Blulens",
      tipo: "Site · ótica",
      selo: "cliente",
      destaque: true,
      resumo: "Site da ótica da família no Capão Redondo, em São Paulo.",
      texto: "Site da ótica da família no Capão Redondo, em São Paulo: modelos, atendimento, avaliações do Google e WhatsApp.",
      // Prints da página inicial (02/10/2026). A ótica autorizou mostrar o site no portfólio em 01/10/2026.
      imagem: "/imagens/projetos/blulens-1400.webp",
      imagemGrande: "/imagens/projetos/blulens-2400.webp",
      imagemCelular: "/imagens/projetos/blulens-celular.webp",
      alt: "Página inicial do site da Ótica Blulens",
      link: "https://www.oticablulens01.com.br",
      linkTexto: "Visitar o site",
      publicar: true,
      falta: "",
    },
    {
      id: "lu-elegante-modas",
      titulo: "Lú Elegante",
      tipo: "Site · moda e beleza",
      selo: "cliente",
      destaque: true,
      resumo: "Site da loja de roupas e do salão, em São Bernardo do Campo.",
      texto: "Site da loja de roupas e do salão na Vila São Pedro, em São Bernardo do Campo: vitrine de peças, serviços do salão e WhatsApp.",
      // Prints da página inicial (02/10/2026), no ar em luelegantemodas.com.br.
      imagem: "/imagens/projetos/lu-elegante-1400.webp",
      imagemGrande: "/imagens/projetos/lu-elegante-2400.webp",
      imagemCelular: "/imagens/projetos/lu-elegante-celular.webp",
      alt: "Página inicial do site da Lú Elegante",
      link: "https://www.luelegantemodas.com.br",
      linkTexto: "Visitar o site",
      publicar: true,
      falta: "",
    },
    {
      id: "move",
      titulo: "Move",
      tipo: "Aplicativo · treinos e acompanhamento",
      selo: "cliente",
      resumo: "App de treinos para alunos e personal trainers, com recursos de inteligência artificial.",
      texto: "Plataforma para alunos e personal trainers: o personal monta e envia o treino, o aluno executa série por série e os dois acompanham a evolução.",
      // ia: true ganha a etiqueta "IA"; icone: haltere, escanear, camera, mensagem, painel, sino
      // imagem: tela real do app (move-web rodando local com dados de exemplo; nada de usuário real)
      // detalhe: texto do pop-up "Ver tela"; link: onde o botão do pop-up leva
      recursos: [
        {
          titulo: "Diário alimentar", ia: true, icone: "camera",
          texto: "O aluno fotografa ou descreve a refeição e a IA estima as calorias, que ficam registradas no diário.",
          detalhe: "O aluno fotografa o prato ou descreve o que comeu, e a IA separa os alimentos e estima as gramas e as calorias de cada um. Ele revisa, ajusta se precisar, e o diário mostra se o dia está dentro da faixa do plano.",
          imagem: "/imagens/move/diario-alimentar.webp", largura: 540, altura: 1146,
          link: "https://www.movexfit.com.br/#recursos",
        },
        {
          titulo: "MoveScan", ia: true, icone: "escanear",
          texto: "Com duas fotos, a IA estima a composição corporal e mostra a evolução ao longo do tempo.",
          detalhe: "Com duas fotos, de frente e de lado, a IA estima o percentual de gordura, a massa magra e o metabolismo basal, e compara com a análise anterior. É uma estimativa visual, não um exame clínico.",
          imagem: "/imagens/move/movescan.webp", largura: 540, altura: 892,
          link: "https://www.movexfit.com.br/#recursos",
        },
        {
          titulo: "Chat com IA", ia: true, icone: "mensagem",
          texto: "Um assistente que conhece o treino do aluno responde na hora, com o personal na mesma conversa.",
          detalhe: "Uma IA que conhece o treino e o diário do aluno responde dúvidas na hora. O personal participa da mesma conversa e pode configurar como a IA orienta os alunos dele.",
          imagem: "/imagens/move/chat-ia.webp", largura: 540, altura: 1169,
          link: "https://www.movexfit.com.br/#recursos",
        },
        {
          titulo: "Treinos guiados", icone: "haltere",
          texto: "O treino do dia abre pronto e conduz a execução série por série, com carga e descanso.",
          detalhe: "O personal monta o treino e o aluno recebe pronto: exercícios, séries, repetições e descanso. Na execução, o app conduz série por série e registra a carga e as repetições de cada uma.",
          imagem: "/imagens/move/treinos-guiados.webp", largura: 540, altura: 1169,
          link: "https://www.movexfit.com.br/#recursos",
        },
        {
          titulo: "Painel do personal", icone: "painel",
          texto: "O personal monta treinos, convida alunos por link e vê quem treinou e quem precisa de atenção.",
          detalhe: "O personal cria treinos, convida alunos por link e acompanha quem treinou, quando e com que frequência, sem precisar perguntar a cada um.",
          imagem: "/imagens/move/painel-personal.webp", largura: 540, altura: 1169,
          link: "https://www.movexfit.com.br/#para-personal",
        },
        {
          titulo: "Notificações", icone: "sino",
          texto: "Treino novo e mensagem do personal chegam na hora.",
          detalhe: "Treino novo aplicado ou mensagem do personal: o aluno fica sabendo na hora, direto no app, e um toque leva para o lugar certo.",
          imagem: "/imagens/move/notificacoes.webp", largura: 540, altura: 1169,
          link: "https://www.movexfit.com.br/#recursos",
        },
      ],
      credito: "Um produto Move, desenvolvido pela Renderiza.",
      // Prints de movexfit.com.br (02/10/2026). O de celular também aparece na abertura do site.
      imagem: "/imagens/projetos/move-1400.webp",
      imagemGrande: "/imagens/projetos/move-2400.webp",
      imagemCelular: "/imagens/projetos/move-celular.webp",
      legenda: "aplicativo desenvolvido pela Renderiza",
      alt: "Página inicial do Move, com a tela de um treino em execução",
      link: "https://www.movexfit.com.br",
      linkTexto: "Conhecer o Move",
      publicar: true,
      falta: "",
    },
    {
      id: "compasso",
      titulo: "Compasso",
      tipo: "Aplicativo · finanças da família",
      selo: "cliente",
      resumo: "O planejamento financeiro da família num lugar só, do mês atual aos próximos.",
      texto: "O planejamento financeiro da casa num lugar só: o casal vê se o mês fecha no azul, planeja os próximos e sabe por quanto tempo a reserva segura as contas essenciais.",
      // prints: compasso-familiar rodando local com uma família fictícia (Ana e Bruno); sem dados reais
      recursos: [
        {
          titulo: "Visão do mês", icone: "painel",
          texto: "Quanto entra, quanto sai, quanto já foi separado e a sobra projetada do mês.",
          detalhe: "Abre direto no mês atual: receitas previstas e recebidas, despesas pagas e pendentes, dinheiro guardado e a sobra projetada. Cada número leva às contas que o compõem, e o app explica como a sobra foi calculada.",
          imagem: "/imagens/compasso/visao-do-mes.webp", largura: 540, altura: 1094,
        },
        {
          titulo: "Planejamento em grade", icone: "grade",
          texto: "As contas mês a mês, editáveis como numa planilha: clicar, digitar e marcar como pago.",
          detalhe: "Receitas, despesas e reservas ficam lado a lado, mês a mês, como numa planilha: clica, digita e marca como pago. Dá para copiar um mês para o seguinte e detalhar as saídas diversas item por item.",
          imagem: "/imagens/compasso/planejamento.webp", largura: 820, altura: 790, formato: "paisagem",
        },
        {
          titulo: "Proteção da família", icone: "escudo",
          texto: "Quantos meses a reserva de emergência cobre e quanto guardar por mês para chegar à meta.",
          detalhe: "Cada despesa é marcada como essencial, ajustável ou temporária. Com isso o Compasso calcula quantos meses a reserva de emergência cobre, a meta de meses protegidos e o aporte mínimo de cada mês.",
          imagem: "/imagens/compasso/protecao.webp", largura: 540, altura: 841,
        },
        {
          titulo: "Para onde o dinheiro vai", icone: "grafico",
          texto: "O que ainda falta pagar e os gastos agrupados por tag, com um teto para o mês.",
          detalhe: "Lista o que ainda falta pagar no mês e mostra, por tag, para onde vai o orçamento: moradia, mercado, escola. Um teto de gastos mostra quanto da renda já está comprometido.",
          imagem: "/imagens/compasso/onde-vai.webp", largura: 540, altura: 845,
        },
        {
          titulo: "Uma conta para o casal", icone: "pessoas",
          texto: "Cada um entra com o próprio login no mesmo planejamento, sem um apagar a alteração do outro.",
        },
      ],
      credito: "Uma ideia da Milena, desenvolvida pela Renderiza.",
      imagem: "/imagens/projetos/compasso-1400.webp",
      imagemGrande: "/imagens/projetos/compasso-2400.webp",
      imagemCelular: "/imagens/projetos/compasso-celular.webp",
      alt: "Visão do mês do Compasso, com receitas, despesas, dinheiro protegido e a sobra projetada",
      link: "",
      publicar: true,
      falta: "",
    },
    {
      id: "demos-oticas",
      titulo: "Demonstrações para óticas",
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
