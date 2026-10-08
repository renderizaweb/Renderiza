// Mensagens prontas de WhatsApp para o primeiro contato com a demo, em etapas, para soar como conversa e
// não como spam: 1) abrir a conversa (sem link, com uma pergunta); 2) depois que responderem, a prévia
// (com o link); 3) sem resposta em 1 ou 2 dias, retomar uma vez (com o link). Ficam juntas em
// leads.mensagem_whatsapp, separadas por uma linha "---". Aqui ficam o modelo, o link que abre a conversa
// com o texto (não envia) e a regra de renovar a demo quando o link vai ser mandado.
import { reabilitar } from "./demos.js";

/** Quem assina a mensagem. */
export const REMETENTE = "Milena";
const SITE = "https://www.renderizaweb.com.br";

/** As etapas, na ordem em que são guardadas. A primeira não leva link. */
export const ETAPAS_MENSAGEM = [
  { id: "abrir", nome: "1 · Abrir a conversa", quando: "Primeira mensagem, sem link: uma pergunta para a pessoa responder.", link: false },
  { id: "previa", nome: "2 · Mandar a prévia", quando: "Depois que responderem: quem é, o detalhe da loja e o link da prévia.", link: true },
  { id: "retomar", nome: "Sem resposta? Retomar", quando: "Se não responderem em 1 ou 2 dias, uma vez só, com o link.", link: true },
];
const SEPARADOR = "\n\n---\n\n";

/** Texto guardado → { abrir, previa, retomar }. Um texto só (sem "---") é a prévia. */
export function separarMensagens(texto) {
  const partes = String(texto || "").split(/\n[ \t]*-{3,}[ \t]*\n/).map(p => p.trim());
  if (partes.length === 1) return { abrir: "", previa: partes[0], retomar: "" };
  return Object.fromEntries(ETAPAS_MENSAGEM.map((e, i) => [e.id, partes[i] || ""]));
}
/** { abrir, previa, retomar } → texto guardado. */
export function juntarMensagens(m) {
  const partes = ETAPAS_MENSAGEM.map(e => String(m[e.id] || "").trim());
  return partes.some(Boolean) ? partes.join(SEPARADOR) : "";
}

/** Link completo da demo, para ir na mensagem: "/demo/x" e "renderizaweb.com.br/demo/x" viram https://www…/demo/x. */
export function linkCompletoDaDemo(link) {
  const s = String(link || "").trim();
  if (!s) return "";
  if (s.startsWith("/")) return SITE + s;
  const semProtocolo = s.replace(/^https?:\/\//i, "");
  return /^(www\.)?renderizaweb\.com\.br\//i.test(semProtocolo) ? SITE + semProtocolo.replace(/^(www\.)?renderizaweb\.com\.br/i, "") : (/^https?:\/\//i.test(s) ? s : "https://" + s);
}

const ehSaude = segmento => /odonto|dent|cl[ií]nica|consult[oó]rio|sa[uú]de/i.test(String(segmento || ""));

/**
 * O modelo, nas três etapas. `detalhe` é o que se viu de verdade na ficha, sem preposição
 * ("a foto de vocês na porta da loja e as 268 avaliações 5 estrelas"): entra como "gostei muito de ver …"
 * na prévia e "com …" na retomada. Regras que evitam cara de golpe: um link só, o da demo (a prévia do
 * WhatsApp mostra a foto da loja); nada de "clique aqui", urgência, preço ou promoção.
 */
export function mensagensPadrao({ empresa, link_demo, segmento }, { remetente = REMETENTE, detalhe = "as fotos e as avaliações de vocês" } = {}) {
  const nome = String(empresa || "").trim() || "loja";
  const link = linkCompletoDaDemo(link_demo);
  const publico = ehSaude(segmento) ? "clínicas e consultórios" : "óticas de bairro";
  return {
    abrir: `Oi, tudo bem? É da ${nome}? Com quem eu falo?`,
    previa: [
      `Prazer! Aqui é a ${remetente}, da Renderiza. A gente cria sites para ${publico}.`,
      `Eu vi o Instagram de vocês e gostei muito de ver ${detalhe}. Aí montei uma prévia de como ficaria o site da ${nome}, para vocês verem:`,
      link,
      "Não precisa decidir nada, é só uma ideia. Queria muito saber a sua opinião!",
    ].join("\n"),
    retomar: [
      `Oi! Aqui é a ${remetente}, da Renderiza. Acho que minha mensagem chegou numa hora corrida 🙂`,
      `Montei uma prévia de site para a ${nome}, com ${detalhe}. Deixo aqui para vocês verem quando der:`,
      link,
      "Se não for com você, me diz com quem eu posso falar?",
    ].join("\n"),
  };
}

/** Link que abre a conversa no WhatsApp com o texto pronto (não envia: a pessoa confere e aperta enviar). */
export function linkWhatsappComTexto(numero, texto) {
  const d = String(numero || "").replace(/\D/g, "");
  if (d.length < 10 || !String(texto || "").trim()) return "";
  return "https://wa.me/" + (d.length <= 11 ? "55" + d : d) + "?text=" + encodeURIComponent(String(texto).trim());
}

/**
 * Patch para a demo ficar no ar 7 dias a partir do envio, ou null se ela já fica (ou não tem prazo).
 * O prazo conta da criação; quem recebe a mensagem dias depois teria menos tempo para ver.
 */
export function renovarParaEnvio(demo, hoje) {
  if (!demo) return null;
  const p = reabilitar(hoje);
  const fica = !demo.vale_ate || demo.vale_ate >= p.vale_ate; // sem prazo, ou o prazo já vai além dos 7 dias
  if (demo.no_ar && fica) return null;
  return { no_ar: true, vale_ate: fica ? demo.vale_ate || null : p.vale_ate };
}
