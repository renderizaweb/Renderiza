// Admin · Onboarding (Missão 7, bloco G; D47), sem tela: testado em test/admin-onboarding.test.mjs. Pela linha de
// admin_onboarding(): em que etapa a conta está, se travou (parada há tempo demais na mesma etapa), os marcos da
// primeira semana e a mensagem pronta de WhatsApp para destravar, no jeito da Renderiza.

const HORA = 3600000;
/** Quanto tempo parada numa etapa conta como "travou". */
export const TRAVOU_DEPOIS = { convite: 48 * HORA, link: 24 * HORA, senha: 24 * HORA, conversa: 24 * HORA, marcos: 72 * HORA };

export const MARCOS = [
  { id: "pedido", nome: "1º pedido" },
  { id: "reserva", nome: "1ª reserva" },
  { id: "contrato", nome: "Contrato mandado" },
  { id: "equipe", nome: "Equipe convidada" },
  { id: "agenda_online", nome: "Agenda online" },
  { id: "dias", nome: "3 dias de uso" },
];

/** Os marcos da conta: { id, nome, feito, conta } (conta: se vale para esta conta; "só eu" não precisa de equipe). */
export function marcosDaConta(l) {
  const m = l.marcos || {};
  const soEu = l.perfil && l.perfil.tamanho === "so_eu";
  return MARCOS.map(x => ({
    ...x,
    feito: x.id === "dias" ? (m.dias_de_uso || 0) >= 3 : !!m[x.id],
    conta: !(x.id === "equipe" && soEu) && x.id !== "agenda_online", // a agenda online é bônus: nem todo negócio tem site
  }));
}

const primeiro = nome => String(nome || "").trim().split(/\s+/)[0];

/**
 * A etapa da conta: { id, nome, desde, travou, mensagem }. Etapas, na ordem: convite (mandado, link não aberto), link
 * (aberto, sem senha), senha (criada, sem conversa), conversa (começada ou adiada, sem terminar), marcos (usando),
 * confiante (cumpriu os marcos que valem para ela).
 */
export function etapaDaConta(l, agora = Date.now()) {
  const t = v => (v ? Date.parse(v) : null);
  const oi = l.dono ? `Oi, ${primeiro(l.dono)}!` : "Oi!";
  const marcos = marcosDaConta(l);
  const valem = marcos.filter(m => m.conta);
  const feitos = valem.filter(m => m.feito).length;
  let e;
  if (!t(l.senha_em) && !t(l.link_aberto_em)) {
    e = { id: "convite", nome: "Convite mandado", desde: t(l.convite_em) || t(l.criado_em),
      mensagem: `${oi} Conseguiu abrir o link do Painel Renderiza? Se não chegou ou venceu, me avisa que eu mando outro.` };
  } else if (!t(l.senha_em)) {
    e = { id: "link", nome: "Abriu o link, sem criar a senha", desde: t(l.link_aberto_em),
      mensagem: `${oi} Vi que você abriu o link do painel ${l.nome ? `do ${l.nome}` : ""}. Ficou alguma dúvida para criar a senha? É só um campo.`.replace(/\s+\./, ".") };
  } else if (!t(l.conversa_comecou_em) && !t(l.conversa_terminou_em) && !t(l.conversa_adiada_em)) {
    e = { id: "senha", nome: "Criou a senha", desde: t(l.senha_em),
      mensagem: `${oi} O painel ${l.nome ? `do ${l.nome} ` : ""}já está esperando por você. Quando puder, entra lá: são uns 2 minutinhos para ele ficar com a cara de vocês.` };
  } else if (!t(l.conversa_terminou_em)) {
    const adiada = !!t(l.conversa_adiada_em);
    e = { id: "conversa", nome: adiada ? "Deixou a conversa para depois" : `Parou na conversa (${l.respondidas || 0} respondidas)`,
      desde: Math.max(t(l.ultimo_passo_em) || 0, t(l.conversa_adiada_em) || 0, t(l.conversa_comecou_em) || 0),
      mensagem: `${oi} Faltam só umas perguntas de um toque para o painel ficar pronto. Quer que eu te ajude por aqui?` };
  } else if (feitos < valem.length) {
    e = { id: "marcos", nome: `Usando: ${feitos} de ${valem.length} marcos`, desde: t(l.conversa_terminou_em),
      mensagem: `${oi} Como está sendo o painel? Se quiser, te ajudo a ${!marcos.find(m => m.id === "pedido").feito ? "anotar o primeiro pedido" : !marcos.find(m => m.id === "reserva").feito ? "trazer as datas que já estão marcadas" : "mandar o primeiro contrato pelo painel"}. É rapidinho.` };
  } else {
    e = { id: "confiante", nome: "Confiante", desde: null, mensagem: "" };
  }
  e.travou = !!(e.desde && TRAVOU_DEPOIS[e.id] && agora - e.desde > TRAVOU_DEPOIS[e.id]);
  e.marcos = marcos;
  return e;
}

/** O funil: quantas contas passaram de cada etapa (convidadas, abriram o link, criaram a senha, fizeram a conversa, confiantes). */
export function funilDoOnboarding(linhas) {
  const n = f => linhas.filter(f).length;
  return [
    { id: "convidadas", nome: "Convidadas", n: linhas.length },
    { id: "abriram", nome: "Abriram o link", n: n(l => l.link_aberto_em || l.senha_em) },
    { id: "senha", nome: "Criaram a senha", n: n(l => l.senha_em) },
    { id: "conversa", nome: "Fizeram a conversa", n: n(l => l.conversa_terminou_em) },
    { id: "confiantes", nome: "Confiantes", n: n(l => etapaDaConta(l).id === "confiante") },
  ];
}
