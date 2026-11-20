// O nicho automotivo (revenda, consultoria, multimarcas) para o painel: as mesmas chaves de src/nichos/fotografia.js.
// Protótipo (Fase 0, 12-modulo-estoque.md): na Fase 1 vira painel-clientes/src/nichos/automotivo.js.

export default {
  id: "automotivo",
  nome: "Automotivo",
  descricao: "Revenda, consultoria automotiva e multimarcas",
  palavras: {
    conta: "negócio", aConta: "o negócio", daConta: "do negócio",
    servico: "serviço", servicos: "serviços",
    reserva: "visita", reservas: "visitas", aReserva: "a visita", novaReserva: "Marcar visita",
    tipo: "serviço", tipos: "serviços", compromissos: "visitas", quando: "horário",
  },
  modulos: {
    estoque: { nome: "Estoque", curto: "Os carros do site, atualizados por você" },
    "meu-site": { nome: "Meu site", curto: "O visual do site: textos, fotos e cores" },
    atendimento: { nome: "Atendimento", curto: "Quem chamou e por qual carro" },
    clientes: { nome: "Clientes", curto: "A ficha de quem comprou" },
    agenda: { nome: "Agenda", nomeLongo: "Agenda da loja", curto: "Visitas e entregas" },
    contratos: { nome: "Contratos", curto: "Aceite pelo celular" },
    financeiro: { nome: "Financeiro", curto: "Sinal, parcelas e atrasos" },
  },
  temConvidados: false, temTiposDeFesta: false, temCampanhas: false, temEntregas: false,
  perguntaDoNicho: "Que serviços você oferece além da venda?",
  sugestoes: [], horarioPadrao: { inicio: "09:00", duracao: 60 }, agendaPadrao: "horario",
};
