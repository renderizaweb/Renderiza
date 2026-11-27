// O nicho automotivo (revenda, consultoria automotiva, multimarcas; 24/11/2026, o primeiro cliente é a Ricardo
// Motors): as palavras e o que muda na tela, com as mesmas chaves de eventos.js e fotografia.js. O coração dele é o
// Estoque (src/modulos/estoque/, 12-modulo-estoque.md); a agenda, quando entrar, é de visitas à loja.

export default {
  id: "automotivo",
  nome: "Automotivo",
  descricao: "Revenda, consultoria automotiva e multimarcas",
  palavras: {
    conta: "loja",
    aConta: "a loja",
    daConta: "da loja",
    servico: "serviço",
    servicos: "serviços",
    reserva: "visita",
    reservas: "visitas",
    aReserva: "a visita",
    novaReserva: "Marcar visita",
    tipo: "serviço",
    tipos: "serviços",
    compromissos: "visitas",
    quando: "horário",
    novoItem: "Novo carro", // o "+" do topo e o botão do Estoque
  },
  modulos: {
    estoque: { nome: "Estoque", curto: "Os carros do site, atualizados por você" },
    "meu-site": { nome: "Meu site", curto: "Textos, fotos e contato do site" },
    atendimento: { nome: "Atendimento", curto: "Quem chamou e por qual carro" },
    clientes: { nome: "Clientes", curto: "A ficha de quem comprou" },
    agenda: { nome: "Agenda", nomeLongo: "Agenda da loja", curto: "Visitas e entregas de carro" },
    "agenda-online": { nome: "Agenda online", curto: "O cliente marca a visita pelo site" },
    contratos: { nome: "Contratos", curto: "Aceite pelo celular" },
    financeiro: { nome: "Financeiro", curto: "Sinal, parcelas e atrasos" },
  },
  temConvidados: false,
  temTiposDeFesta: false,
  temCampanhas: false,
  temEntregas: false,
  servicoSimples: true, // Serviços só com o nome e a descrição (sem valor, duração, horários nem datas)
  // Onboarding: vira os serviços da loja (o que ela faz além de vender), sem preço; o site mostra os que ela marcar.
  perguntaDoNicho: "O que a loja faz além de vender?",
  sugestoes: [
    { nome: "Consignação", duracao: 60, cor: "#87672b" },
    { nome: "Financiamento", duracao: 60, cor: "#2f6f86" },
    { nome: "Aceita troca", duracao: 60, cor: "#2f7d55" },
    { nome: "Busca do carro sob encomenda", duracao: 60, cor: "#8a4fb5" },
    { nome: "Blindados", duracao: 60, cor: "#4a4a52" },
  ],
  horarioPadrao: { inicio: "09:00", duracao: 60 },
  agendaPadrao: "horario",
  // o Início e a barra começam pelo Estoque (é o que a loja mexe todo dia)
  moduloPrincipal: "estoque",
  estoque: { itens: "carros" },
};
