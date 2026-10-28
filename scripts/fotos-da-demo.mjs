// Fotos fora da página da demo (28/10/2026, pedido do Kaue: demo mais leve no celular, sem piorar as imagens).
// As demos guardam as fotos dentro do HTML (data:image/…;base64), o que deixa a página com 1,5 a 4 MB: no 4G, dentro
// do WhatsApp, ela demora para abrir, e as fotos lá de baixo baixam antes da capa aparecer. Na publicação, cada foto
// vira um arquivo em /demo/<pasta>/f/<hash>.<ext> com os MESMOS bytes (nada é recomprimido) e a página aponta para
// ele: a página abre com uns 70 KB e as fotos com loading="lazy" (as demos já marcam) só baixam perto da tela.
// O arquivo da demo não muda (o vídeo, as capturas e o flyer continuam lendo as fotos de dentro dele).

import { createHash } from "node:crypto";

/** Fotos menores que isto (ícones, texturas) ficam dentro da página: não vale um pedido a mais. */
export const TAMANHO_MINIMO = 4096;
const FOTO = /data:image\/(jpeg|png|webp|gif|avif);base64,([A-Za-z0-9+/=]+)/g;

/**
 * Troca as fotos embutidas por links para /demo/<pasta>/f/<hash>.<ext>.
 * Devolve { html, fotos } com fotos = Map(nome → { tipo, base64 }); a mesma foto repetida vira um arquivo só.
 */
export function separarFotos(html, pasta) {
  const fotos = new Map();
  const saida = String(html).replace(FOTO, (todo, tipo, b64) => {
    if (Math.floor(b64.length * 3 / 4) < TAMANHO_MINIMO) return todo;
    const ext = tipo === "jpeg" ? "jpg" : tipo;
    const nome = createHash("sha1").update(b64).digest("hex").slice(0, 16) + "." + ext;
    if (!fotos.has(nome)) fotos.set(nome, { tipo: ext, base64: b64 });
    return `/demo/${pasta}/f/${nome}`;
  });
  return { html: saida, fotos };
}
