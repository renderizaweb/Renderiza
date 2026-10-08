// Mensagem pronta de WhatsApp para o primeiro contato com a demo. O texto de cada lead fica em
// leads.mensagem_whatsapp (escrito na criação da demo, com um detalhe da ficha); aqui ficam o modelo,
// o link que abre a conversa com o texto e a regra de renovar a demo quando ela vai ser mandada.
import { reabilitar } from "./demos.js";

/** Quem assina a mensagem. */
export const REMETENTE = "Milena";
const SITE = "https://www.renderizaweb.com.br";

/** Link completo da demo, para ir na mensagem: "/demo/x" e "renderizaweb.com.br/demo/x" viram https://www…/demo/x. */
export function linkCompletoDaDemo(link) {
  const s = String(link || "").trim();
  if (!s) return "";
  if (s.startsWith("/")) return SITE + s;
  const semProtocolo = s.replace(/^https?:\/\//i, "");
  return /^(www\.)?renderizaweb\.com\.br\//i.test(semProtocolo) ? SITE + semProtocolo.replace(/^(www\.)?renderizaweb\.com\.br/i, "") : (/^https?:\/\//i.test(s) ? s : "https://" + s);
}

/**
 * Modelo da mensagem. O único link é o da demo: o WhatsApp mostra a prévia do primeiro link do texto,
 * e um segundo link (o site da Renderiza) roubaria a prévia. A linha do "É o site da…" é a que se
 * personaliza por lead (um detalhe real da ficha).
 */
export function mensagemPadrao({ empresa, link_demo }, { remetente = REMETENTE, detalhe = "com as fotos e as avaliações de vocês" } = {}) {
  const nome = String(empresa || "").trim() || "loja";
  return [
    `Oi, tudo bem? Aqui é a ${remetente}, da Renderiza.`,
    "Estou entrando em contato porque olhei o Instagram de vocês, vi um grande potencial e criei uma prévia de site para apresentar uma ideia. O link está aqui:",
    linkCompletoDaDemo(link_demo),
    "",
    `É o site da ${nome}, ${detalhe}.`,
    "Dá uma olhada com calma e me conta o que achou?",
  ].join("\n");
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
