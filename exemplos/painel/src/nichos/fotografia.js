// O nicho de fotografia (família, gestante, newborn, infantil): as palavras e o que muda na tela (05, "Os nomes
// que mudam por nicho"). Os textos dos módulos são os da página de venda (exemplos/fotografia.html, MODULOS).

export default {
  id: "fotografia",
  nome: "Fotografia",
  descricao: "Estúdio ou fotógrafa de família, gestante, newborn e infantil",
  palavras: {
    conta: "estúdio",
    aConta: "o estúdio",
    daConta: "do estúdio",
    servico: "tipo de ensaio",
    servicos: "tipos de ensaio",
    reserva: "ensaio",
    reservas: "ensaios",
    aReserva: "o ensaio",
    novaReserva: "Marcar ensaio",
    tipo: "tipo de ensaio",
    tipos: "tipos de ensaio",
    compromissos: "reuniões",
    quando: "horário",
  },
  modulos: {
    "agenda-online": { nome: "Agenda online", curto: "A cliente escolhe o horário" },
    agenda: { nome: "Agenda", nomeLongo: "Agenda do estúdio", curto: "Ensaios por horário e campanhas" },
    clientes: { nome: "Clientes e entregas", nomeLongo: "Clientes e entregas", curto: "A ficha e o prazo das fotos" },
    contratos: { nome: "Contratos", curto: "A cliente aceita pelo celular" },
    financeiro: { nome: "Financeiro", curto: "Sinal, restante e atrasos" },
    atendimento: { nome: "Atendimento", curto: "Todos os pedidos num lugar só" },
    "meu-site": { nome: "Meu site", curto: "Atualizar o site pelo painel" },
  },
  temConvidados: false,
  temTiposDeFesta: false,
  temCampanhas: true,
  temEntregas: true,
  // Onboarding, passo 5 (09): vira os tipos de ensaio (serviços), com a duração; os valores ficam para depois.
  perguntaDoNicho: "Quais ensaios você faz?",
  sugestoes: [
    { nome: "Ensaio gestante", duracao: 90, cor: "#8a4fb5" },
    { nome: "Newborn", duracao: 180, cor: "#c26a2a" },
    { nome: "Ensaio de família", duracao: 60, cor: "#2f7d55" },
    { nome: "Smash the cake", duracao: 60, cor: "#c0477a" },
    { nome: "Acompanhamento do bebê", duracao: 45, cor: "#2f6f86" },
  ],
  horarioPadrao: { inicio: "09:00", duracao: 60 },
};
