// O nicho de eventos (salão, chácara, espaço de casamento): as palavras e o que muda na tela (05, "Os nomes que
// mudam por nicho"). Os textos dos módulos são os da página de venda (exemplos/index.html, MODULOS).

export default {
  id: "eventos",
  nome: "Espaço de eventos",
  descricao: "Salão, chácara, espaço de festas ou de casamento",
  palavras: {
    conta: "espaço",
    aConta: "o espaço",
    daConta: "do espaço",
    servico: "pacote",
    servicos: "pacotes",
    reserva: "festa",
    reservas: "festas",
    aReserva: "a festa",
    novaReserva: "Reservar data",
    tipo: "tipo de festa",
    tipos: "tipos de festa",
    compromissos: "visitas, degustações e reuniões",
    quando: "data",
  },
  modulos: {
    "agenda-online": { nome: "Agenda online", curto: "O cliente pede a data pelo site" },
    agenda: { nome: "Agenda", nomeLongo: "Agenda da equipe", curto: "Festas, visitas e degustações" },
    clientes: { nome: "Clientes", nomeLongo: "Clientes", curto: "A ficha de cada cliente" },
    contratos: { nome: "Contratos", curto: "O cliente aceita pelo celular" },
    financeiro: { nome: "Financeiro", curto: "O controle do que entra" },
    atendimento: { nome: "Atendimento", curto: "Todos os pedidos num lugar só" },
    "meu-site": { nome: "Meu site", curto: "Atualizar o site pelo painel" },
  },
  temConvidados: true,
  temTiposDeFesta: true,
  temCampanhas: false,
  temEntregas: false,
  // Onboarding, passo 5 (09): vira os tipos de festa, com a cor de cada um na agenda (as do exemplo).
  perguntaDoNicho: "Que festas vocês fazem?",
  sugestoes: [
    { nome: "Casamento", cor: "#d6456b" },
    { nome: "15 anos", cor: "#7c4ddb" },
    { nome: "Aniversário", cor: "#dd7426" },
    { nome: "Infantil", cor: "#b98a00" },
    { nome: "Corporativo", cor: "#2f6fe0" },
  ],
  // Data já marcada que entra pela importação sem horário: uma festa à noite.
  horarioPadrao: { inicio: "19:00", fim: "03:00" },
};
