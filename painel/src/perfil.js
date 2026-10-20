// Perfil de cada lead para a tela Indicadores: tamanho no Instagram e no Google, região, tipo de WhatsApp, site
// atual e quem atendeu a conversa. Sem tela (com testes em test/perfil.test.mjs).
//
// Não há coluna para esses dados: eles saem do que já está no card.
// - Seguidores, nota e avaliações: das Observações escritas na triagem ("Instagram: 3,6 mil seguidores",
//   "Google: 4,9 · 228 avaliações", "Nota 5,0 com 90 avaliações"). Vale o primeiro número encontrado.
// - Região e WhatsApp: do DDD e do número do campo WhatsApp (e da cidade, para a capital).
// - Site atual: do campo Site atual ("não tem…", endereço, "fora do ar").
// - Quem atendeu: da linha "Quem atendeu:" das Observações, que começa com dono, equipe, robô, ninguém ou
//   não identificado (o bloco "[WhatsApp · …]" gravado a partir das conversas).

const RE_SEGUIDORES = /(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(mil\s+)?seguidores/i;
const RE_GOOGLE = /(?:google:?|nota)\s*([0-5],\d)\s*(?:·|com)\s*(\d{1,3}(?:\.\d{3})+|\d+)\s*avalia/i;
const RE_ATENDEU = /^Quem atendeu:\s*(dono|equipe|rob[oô]|ningu[eé]m|n[aã]o identificado)/im;

const numero = t => Number(String(t).replace(/\./g, "").replace(",", "."));

/** Seguidores no Instagram, ou null. "3,6 mil" vira 3600; "1.065" vira 1065. */
export function seguidoresDe(texto) {
  const m = RE_SEGUIDORES.exec(String(texto || ""));
  if (!m) return null;
  return Math.round(numero(m[1]) * (m[2] ? 1000 : 1));
}

/** {nota, avaliacoes} do Google, ou null. */
export function googleDe(texto) {
  const m = RE_GOOGLE.exec(String(texto || ""));
  return m ? { nota: numero(m[1]), avaliacoes: numero(m[2]) } : null;
}

/** "dono" | "equipe" | "robo" | "ninguem" | "nao_identificado" | null (conversa ainda não lida). */
export function atendeuDe(texto) {
  const m = RE_ATENDEU.exec(String(texto || ""));
  if (!m) return null;
  const t = m[1].toLowerCase();
  return t.startsWith("rob") ? "robo" : t.startsWith("ningu") ? "ninguem" : t.startsWith("n") ? "nao_identificado" : t;
}

/** {ddd, tipo: "celular"|"fixo"} do campo WhatsApp, ou null. */
export function telefoneDe(whatsapp) {
  let d = String(whatsapp || "").replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  const numeroLocal = d.slice(2);
  return { ddd: d.slice(0, 2), tipo: numeroLocal.length === 9 && numeroLocal[0] === "9" ? "celular" : "fixo" };
}

/** Cidade do campo Cidade ("Bairro · Cidade"; o que estiver entre parênteses sai). */
export const cidadeDe = campo => String(campo || "").split("·").pop().replace(/\(.*?\)/g, "").trim();

/** "capital" | "grande_sp" | "interior_sp" | "outros_estados" | null. */
export function regiaoDe(lead) {
  const cidade = cidadeDe(lead.cidade).toLocaleLowerCase("pt-BR");
  if (cidade === "são paulo") return "capital";
  const tel = telefoneDe(lead.whatsapp);
  if (!tel) return null;
  const ddd = Number(tel.ddd);
  if (ddd === 11) return "grande_sp";
  if (ddd >= 12 && ddd <= 19) return "interior_sp";
  return "outros_estados";
}

/** "sem_site" | "fora_do_ar" | "tem_site" | null, do campo Site atual. */
export function siteDe(texto) {
  const t = String(texto || "").trim();
  if (!t) return null;
  if (/^n[aã]o tem/i.test(t)) return "sem_site";
  if (/fora do ar|quebrad|\berro\b|404|vencid|n[aã]o abre/i.test(t)) return "fora_do_ar";
  return "tem_site";
}

/** Tudo o que os cortes usam, de um lead. */
export function perfilDoLead(lead) {
  const obs = lead.observacoes || "";
  const google = googleDe(obs);
  const tel = telefoneDe(lead.whatsapp);
  return {
    seguidores: seguidoresDe(obs),
    nota: google ? google.nota : null,
    avaliacoes: google ? google.avaliacoes : null,
    regiao: regiaoDe(lead),
    whatsapp: tel ? tel.tipo : null,
    site: siteDe(lead.site_atual),
    atendeu: atendeuDe(obs),
  };
}

// Os cortes da tela. Cada faixa diz se um perfil cai nela; o lead sem o dado fica em "sem dado". semPessoa: nenhuma
// pessoa respondeu, então a faixa não entra na comparação de interesse (seria zero por definição).
const faixa = (id, nome, cabe, extra = {}) => ({ id, nome, cabe, ...extra });
const entre = (campo, min, max) => p => p[campo] !== null && p[campo] >= min && p[campo] <= max;
const igual = (campo, valor) => p => p[campo] === valor;

export const CORTES = [
  { id: "seguidores", nome: "Seguidores no Instagram", fonte: "Observações da triagem", faixas: [
    faixa("ate1", "Até 1 mil", entre("seguidores", 0, 1000)),
    faixa("1a3", "1 a 3 mil", entre("seguidores", 1001, 3000)),
    faixa("3a10", "3 a 10 mil", entre("seguidores", 3001, 10000)),
    faixa("10mais", "Mais de 10 mil", entre("seguidores", 10001, Infinity)),
  ] },
  { id: "avaliacoes", nome: "Avaliações no Google", fonte: "Observações da triagem", faixas: [
    faixa("ate50", "Até 50", entre("avaliacoes", 0, 50)),
    faixa("51a100", "51 a 100", entre("avaliacoes", 51, 100)),
    faixa("101a300", "101 a 300", entre("avaliacoes", 101, 300)),
    faixa("300mais", "Mais de 300", entre("avaliacoes", 301, Infinity)),
  ] },
  { id: "nota", nome: "Nota no Google", fonte: "Observações da triagem", faixas: [
    faixa("5", "5,0", igual("nota", 5)),
    faixa("49", "4,9", igual("nota", 4.9)),
    faixa("48menos", "4,8 ou menos", entre("nota", 0, 4.8)),
  ] },
  { id: "regiao", nome: "Região", fonte: "DDD do WhatsApp e cidade", faixas: [
    faixa("capital", "Capital (São Paulo)", igual("regiao", "capital")),
    faixa("grande_sp", "Grande SP (DDD 11)", igual("regiao", "grande_sp")),
    faixa("interior_sp", "Interior e litoral de SP", igual("regiao", "interior_sp")),
    faixa("outros_estados", "Outros estados", igual("regiao", "outros_estados")),
  ] },
  { id: "atendeu", nome: "Quem atendeu o WhatsApp", fonte: "linha \"Quem atendeu\" das Observações", faixas: [
    faixa("dono", "Dono ou responsável", igual("atendeu", "dono")),
    faixa("equipe", "Funcionário (atendente, marketing)", igual("atendeu", "equipe")),
    faixa("nao_identificado", "Respondeu, sem saber quem", igual("atendeu", "nao_identificado")),
    faixa("robo", "Só mensagem automática", igual("atendeu", "robo"), { semPessoa: true }),
    faixa("ninguem", "Ninguém respondeu", igual("atendeu", "ninguem"), { semPessoa: true }),
  ] },
  { id: "whatsapp", nome: "Número do WhatsApp", fonte: "campo WhatsApp", faixas: [
    faixa("celular", "Celular", igual("whatsapp", "celular")),
    faixa("fixo", "Fixo da loja", igual("whatsapp", "fixo")),
  ] },
  { id: "site", nome: "Site atual", fonte: "campo Site atual", faixas: [
    faixa("sem_site", "Não tem site", igual("site", "sem_site")),
    faixa("fora_do_ar", "Site fora do ar ou quebrado", igual("site", "fora_do_ar")),
    faixa("tem_site", "Tem site", igual("site", "tem_site")),
  ] },
];
