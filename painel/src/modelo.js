// Vocabulário do painel: etapas, resultados, canais e status.
// Os ids batem com os valores aceitos pelas colunas no Supabase (supabase/schema.sql).

export const ETAPAS = [
  { id: "a_trabalhar", nome: "Leads a trabalhar" },
  { id: "demo_criada", nome: "Demo criada" },
  { id: "gravacao_realizada", nome: "Gravação realizada" },
  { id: "demo_enviada", nome: "Demo enviada" },
  { id: "follow_up", nome: "Follow-up" },
  { id: "finalizado", nome: "Finalizado" },
];

export const RESULTADOS = [
  { id: "ganho", nome: "Ganho" },
  { id: "perda", nome: "Perda" },
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
export const nomeDaEtapa = nomePor(ETAPAS);
export const nomeDoResultado = nomePor(RESULTADOS);
export const nomeDoCanal = nomePor(CANAIS);
export const nomeDoStatus = nomePor(STATUS_CONTEUDO);
export const ordemDaEtapa = id => ETAPAS.findIndex(e => e.id === id);
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

/** "Finalizado · Ganho" quando houver resultado; senão o nome da etapa. */
export function rotuloEtapa(lead) {
  if (lead.etapa === "finalizado" && lead.resultado) return "Finalizado · " + nomeDoResultado(lead.resultado);
  return nomeDaEtapa(lead.etapa) || lead.etapa || "";
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
  const para = h.para === "finalizado" && h.resultado ? "Finalizado · " + nomeDoResultado(h.resultado) : nomeDaEtapa(h.para);
  return (h.de ? nomeDaEtapa(h.de) + " → " : "") + para;
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
