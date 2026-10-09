// Vocabulário do painel: etapas, resultados, canais e status.
// Os ids batem com os valores aceitos pelas colunas no Supabase (supabase/schema.sql).
// Os ids nunca mudam (são o que fica gravado no banco); o nome é só o que aparece na tela.
//
// Funil reorganizado em 09/10/2026 (o supabase/schema.sql migra os dados):
//   Leads a trabalhar → Prontas para trabalhar → Em andamento → Finalizado (ganho, perda ou encerrado).
//   "Em andamento" é uma fase com três etapas: Primeiro contato, Em negociação e Sem resposta.
// Os ids antigos ficam só no histórico (ETAPAS_ANTIGAS dá o nome que tinham na tela).

export const ETAPAS = [
  { id: "a_trabalhar", nome: "Leads a trabalhar", fase: "a_trabalhar" },
  { id: "demo_pronta", nome: "Prontas para trabalhar", fase: "demo_pronta", ajuda: "Demo, vídeo e flyer prontos: falta mandar." },
  { id: "primeiro_contato", nome: "Primeiro contato", fase: "em_andamento", ajuda: "Mandou a demo e espera a primeira resposta." },
  { id: "em_negociacao", nome: "Em negociação", fase: "em_andamento", ajuda: "Respondeu e a conversa está andando." },
  { id: "sem_resposta", nome: "Sem resposta", fase: "em_andamento", ajuda: "Não respondeu, ou parou de responder: caminho do encerramento." },
  { id: "finalizado", nome: "Finalizado", fase: "finalizado" },
];

/** Colunas do kanban e passos da trilha. Cada fase junta uma ou mais etapas (Em andamento junta três). */
export const FASES = [
  { id: "a_trabalhar", nome: "Leads a trabalhar", curto: "A trabalhar" },
  { id: "demo_pronta", nome: "Prontas para trabalhar", curto: "Prontas" },
  { id: "em_andamento", nome: "Em andamento", curto: "Em andamento" },
  { id: "finalizado", nome: "Finalizado", curto: "Finalizado" },
].map(f => ({ ...f, etapas: ETAPAS.filter(e => e.fase === f.id).map(e => e.id) }));

/** Etapas de antes de 09/10/2026, com o nome que tinham na tela. */
export const ETAPAS_ANTIGAS = {
  demo_criada: "Demo criada",
  gravacao_realizada: "Gravação realizada",
  demo_enviada: "Contato iniciado",
  follow_up: "Em conversa",
};

export const RESULTADOS = [
  { id: "ganho", nome: "Ganho" },
  { id: "perda", nome: "Perda" },
  { id: "encerrado", nome: "Encerrado", ajuda: "Não respondeu e o contato foi encerrado: nem ganho, nem perda." },
];

export const CANAIS = [
  { id: "instagram", nome: "Instagram" },
  { id: "linkedin", nome: "LinkedIn" },
  { id: "portfolio", nome: "Portfólio" },
  { id: "outro", nome: "Outro" },
];

export const STATUS_CONTEUDO = [
  { id: "ideia", nome: "Ideia" },
  { id: "em_producao", nome: "Em produção" },
  { id: "publicado", nome: "Publicado" },
];

/** Interesse demonstrado pela ótica. Não é etapa: silêncio continua "Não avaliado". */
export const INTERESSES = [
  { id: "nao_avaliado", nome: "Não avaliado" },
  { id: "interessado", nome: "Interessado" },
  { id: "perto_de_fechar", nome: "Perto de fechar" },
];

/** O que de fato aconteceu com a ótica (tabela `interacoes`). Datas planejadas ficam no Follow-up do lead. */
export const TIPOS_INTERACAO = [
  { id: "primeiro_contato", nome: "Primeiro contato", ajuda: "Primeira abordagem sua. Conta uma vez como ótica nova." },
  { id: "retorno", nome: "Retorno feito", ajuda: "Nova abordagem a quem já foi contatada." },
  { id: "resposta", nome: "Resposta recebida", ajuda: "O que a ótica disse. Não conta como retorno." },
  { id: "anotacao", nome: "Anotação", ajuda: "Registro pontual." },
];

export const CANAIS_CONTATO = [
  { id: "whatsapp", nome: "WhatsApp" },
  { id: "telefone", nome: "Telefone" },
  { id: "instagram", nome: "Instagram" },
  { id: "email", nome: "E-mail" },
  { id: "presencial", nome: "Presencial" },
  { id: "outro", nome: "Outro" },
];

const nomePor = lista => id => (lista.find(x => x.id === id) || {}).nome || "";
/** Nome curto da etapa ("Sem resposta"); id antigo sai com o nome antigo ("Em conversa"). */
export const nomeDaEtapa = id => nomePor(ETAPAS)(id) || ETAPAS_ANTIGAS[id] || "";
export const nomeDoResultado = nomePor(RESULTADOS);
export const nomeDoCanal = nomePor(CANAIS);
export const nomeDoStatus = nomePor(STATUS_CONTEUDO);
export const ordemDaEtapa = id => ETAPAS.findIndex(e => e.id === id);
export const faseDaEtapa = id => (ETAPAS.find(e => e.id === id) || {}).fase || "";
export const ehEmAndamento = id => faseDaEtapa(id) === "em_andamento";
/** "Em andamento · Sem resposta" para as etapas de Em andamento; as outras, só o nome. */
export const nomeCompletoDaEtapa = id => (ehEmAndamento(id) ? "Em andamento · " : "") + nomeDaEtapa(id);

/**
 * Etapa no funil de 09/10/2026 para um id antigo (o mesmo mapeamento do supabase/schema.sql):
 * Demo criada e Gravação realizada → Prontas para trabalhar; Contato iniciado → Primeiro contato;
 * Em conversa → Em negociação se a ótica tem interesse registrado, senão Sem resposta.
 */
export function etapaAtual(etapa, interesse) {
  if (etapa === "demo_criada" || etapa === "gravacao_realizada") return "demo_pronta";
  if (etapa === "demo_enviada") return "primeiro_contato";
  if (etapa === "follow_up") return interesse === "interessado" || interesse === "perto_de_fechar" ? "em_negociacao" : "sem_resposta";
  return etapa;
}
/**
 * Opções para escolher a etapa, com as de Em andamento num grupo: [[id, nome] | {grupo, opcoes}].
 * `finalizado`: o texto da opção Finalizado (ex.: "Finalizado · Ganho"), ou false para deixá-la de fora.
 */
export function opcoesDeEtapa({ finalizado = "Finalizado" } = {}) {
  return FASES.filter(f => f.id !== "finalizado" || finalizado !== false).map(f => (f.etapas.length > 1
    ? { grupo: f.nome, opcoes: f.etapas.map(id => [id, nomeDaEtapa(id)]) }
    : [f.etapas[0], f.id === "finalizado" ? finalizado : f.nome]));
}

/** Lead lido com etapa antiga (banco ainda não migrado, ou o banco do Claude) aparece já na etapa nova. */
export function comEtapaAtual(lead) {
  const etapa = etapaAtual(lead.etapa, lead.interesse);
  return etapa === lead.etapa ? lead : { ...lead, etapa };
}
export const nomeDoInteresse = id => nomePor(INTERESSES)(id || "nao_avaliado");
export const nomeDoTipo = nomePor(TIPOS_INTERACAO);
export const nomeDoCanalDeContato = nomePor(CANAIS_CONTATO);
export const pesoDoInteresse = id => Math.max(0, INTERESSES.findIndex(x => x.id === (id || "nao_avaliado")));

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/** Data de uma interação como ela é conhecida: "25/09/2026", "set/2026 (aprox.)" ou "data desconhecida". */
export function dataDaInteracao(i) {
  const precisao = i.precisao || "exata";
  if (precisao === "desconhecida" || !i.ocorreu_em) return "data desconhecida";
  const [a, m, d] = i.ocorreu_em.split("-");
  if (precisao === "aproximada") return MESES[Number(m) - 1] + "/" + a + " (aprox.)";
  return d + "/" + m + "/" + a;
}

/** "Finalizado · Ganho" quando houver resultado, "Em andamento · Sem resposta" nas etapas do meio; senão o nome da etapa. */
export function rotuloEtapa(lead) {
  if (lead.etapa === "finalizado" && lead.resultado) return "Finalizado · " + nomeDoResultado(lead.resultado);
  return nomeCompletoDaEtapa(lead.etapa) || lead.etapa || "";
}

export function novoLead(empresa) {
  return {
    empresa: empresa.trim(),
    etapa: "a_trabalhar",
    whatsapp: "",
    instagram: "",
    proxima_acao: "",
    followup_em: null,
    valor_potencial: null,
    cidade: "",
    segmento: "",
    site_atual: "",
    link_demo: "",
    link_gravacao: "",
    link_flyer: "",
    observacoes: "",
    historico: [],
    revisar: false,
    interesse: "nao_avaliado",
    interesse_motivo: null,
    nao_contatar: false,
  };
}

export function novoConteudo(titulo) {
  return {
    titulo: titulo.trim(),
    canal: null,
    status: "ideia",
    data_planejada: null,
    link_publicacao: "",
    texto: "",
    gancho: "",
    cta: "",
    link_imagem: "",
    link_video: "",
    observacoes: "",
    revisar: false,
  };
}

/** Uma linha de histórico: só data, etapa anterior e etapa nova. */
export function linhaDeHistorico(de, para, resultado) {
  const linha = { em: new Date().toISOString(), de, para };
  if (resultado) linha.resultado = resultado;
  return linha;
}

export function textoDoHistorico(h) {
  if (h.texto) return "Painel antigo: " + h.texto;
  if (h.tipo === "interesse") return "Interesse: " + nomeDoInteresse(h.de) + " → " + nomeDoInteresse(h.para) + (h.origem === "ia" ? " (pela IA)" : "");
  if (h.tipo === "nao_contatar") return h.para ? "Marcada para não receber mais contato" : "Voltou a poder ser contatada";
  const nota = h.origem === "reorganizacao" ? " (etapas reorganizadas)" : h.origem === "ia" ? " (pela IA)" : "";
  // Dentro de Em andamento: "Em andamento: Primeiro contato → Em negociação".
  if (h.de && ehEmAndamento(h.de) && ehEmAndamento(h.para)) return "Em andamento: " + nomeDaEtapa(h.de) + " → " + nomeDaEtapa(h.para) + nota;
  const para = h.para === "finalizado" && h.resultado ? "Finalizado · " + nomeDoResultado(h.resultado) : nomeCompletoDaEtapa(h.para);
  return (h.de ? nomeCompletoDaEtapa(h.de) + " → " : "") + para + nota;
}

/** Converte "1.500,50", "R$ 2000" ou "2500.5" em número. null = vazio, undefined = inválido. */
export function lerValor(texto) {
  const s = String(texto == null ? "" : texto).trim();
  if (!s) return null;
  const limpo = s.replace(/[^\d,.-]/g, "");
  if (!/\d/.test(limpo)) return undefined;
  const n = Number(limpo.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
}

export function formatarValor(n) {
  if (n == null || n === "") return "";
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export const ehData = v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
