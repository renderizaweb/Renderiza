// O texto de um termo de aceite (supabase/termos-online.sql, termos de lead): o mesmo leitor no painel (a prévia, na
// seção "Termo de aceite" do lead) e na página /termo/<id> (termos/pagina.html), para a pessoa ler exatamente o texto
// que o banco guarda e cuja impressão (SHA-256) ela assina. Marcação leve, uma coisa por linha:
//   # 1. As partes        título de cláusula        ## Domínio         subtítulo
//   1. texto              item numerado             - texto            item de lista
//   linha em branco       separa os parágrafos      **negrito**        destaque no meio da linha
//   [[valor]]             pendência do modelo: o termo não abre para assinar enquanto tiver uma (o banco confere)
// Sem HTML: o desenho cria os elementos com textContent, então nada do texto vira código na página.

/** Os blocos do texto: { tipo: "titulo" | "subtitulo" | "paragrafo" | "lista" | "numerada", texto?, itens?, inicio? }. */
export function blocosDoTexto(texto) {
  const blocos = [];
  let paragrafo = [];
  const fecharParagrafo = () => { if (paragrafo.length) { blocos.push({ tipo: "paragrafo", texto: paragrafo.join(" ") }); paragrafo = []; } };
  for (const bruta of String(texto || "").replace(/\r\n?/g, "\n").split("\n")) {
    const linha = bruta.trim();
    let m;
    if (!linha) { fecharParagrafo(); continue; }
    if ((m = /^##\s+(.+)$/.exec(linha))) { fecharParagrafo(); blocos.push({ tipo: "subtitulo", texto: m[1] }); continue; }
    if ((m = /^#\s+(.+)$/.exec(linha))) { fecharParagrafo(); blocos.push({ tipo: "titulo", texto: m[1] }); continue; }
    const item = /^-\s+(.+)$/.exec(linha);
    const numerado = /^(\d{1,3})\.\s+(.+)$/.exec(linha);
    if (item || numerado) {
      fecharParagrafo();
      const tipo = item ? "lista" : "numerada";
      const ultimo = blocos[blocos.length - 1];
      if (ultimo && ultimo.tipo === tipo) ultimo.itens.push(item ? item[1] : numerado[2]);
      else blocos.push({ tipo, itens: [item ? item[1] : numerado[2]], ...(numerado ? { inicio: Number(numerado[1]) } : {}) });
      continue;
    }
    paragrafo.push(linha);
  }
  fecharParagrafo();
  return blocos;
}

/** Os pedaços de uma linha: [{ texto, negrito?, pendente? }]. "**x**" é negrito; "[[x]]" é pendência. */
export function pedacosDaLinha(linha) {
  const pedacos = [];
  const re = /\*\*(.+?)\*\*|\[\[(.+?)\]\]/g;
  let fim = 0, m;
  const s = String(linha || "");
  while ((m = re.exec(s))) {
    if (m.index > fim) pedacos.push({ texto: s.slice(fim, m.index) });
    pedacos.push(m[1] !== undefined ? { texto: m[1], negrito: true } : { texto: m[2], pendente: true });
    fim = re.lastIndex;
  }
  if (fim < s.length) pedacos.push({ texto: s.slice(fim) });
  return pedacos;
}

/** O que ainda falta no texto (cada [[…]], sem repetir, na ordem em que aparece). */
export function pendencias(texto) {
  const vistas = [];
  for (const m of String(texto || "").matchAll(/\[\[(.+?)\]\]/g)) if (!vistas.includes(m[1].trim())) vistas.push(m[1].trim());
  // "[[" sem fechar também segura a assinatura no banco: aparece como pendência.
  if (!vistas.length && String(texto || "").includes("[[")) vistas.push("marcação [[ sem fechar");
  return vistas;
}

/** Âncora de uma cláusula ("1. As partes" → "c1"), para o índice da página. */
export const ancoraDoTitulo = titulo => { const m = /^(\d{1,3})\./.exec(String(titulo || "").trim()); return m ? "c" + m[1] : ""; };

/**
 * Desenha o texto dentro de `alvo` (um elemento), com o `document` da página. Títulos viram h3 (com a âncora c<N>),
 * subtítulos h4, listas ul/ol, parágrafos p; negrito em <b> e pendência em <mark class="pendente">.
 */
export function desenharTexto(doc, alvo, texto) {
  const linha = (el, s) => {
    for (const p of pedacosDaLinha(s)) {
      if (p.negrito) el.appendChild(doc.createElement("b")).textContent = p.texto;
      else if (p.pendente) { const m = el.appendChild(doc.createElement("mark")); m.className = "pendente"; m.textContent = "[[" + p.texto + "]]"; }
      else el.appendChild(doc.createTextNode(p.texto));
    }
    return el;
  };
  alvo.replaceChildren();
  for (const b of blocosDoTexto(texto)) {
    if (b.tipo === "titulo") { const h = linha(doc.createElement("h3"), b.texto); const a = ancoraDoTitulo(b.texto); if (a) h.id = a; alvo.appendChild(h); }
    else if (b.tipo === "subtitulo") alvo.appendChild(linha(doc.createElement("h4"), b.texto));
    else if (b.tipo === "paragrafo") alvo.appendChild(linha(doc.createElement("p"), b.texto));
    else {
      const lista = doc.createElement(b.tipo === "lista" ? "ul" : "ol");
      if (b.inicio && b.inicio !== 1) lista.start = b.inicio;
      for (const i of b.itens) lista.appendChild(linha(doc.createElement("li"), i));
      alvo.appendChild(lista);
    }
  }
  return alvo;
}

/** A impressão digital do texto: SHA-256 em hexadecimal, a mesma que o banco calcula (gatilho termos_online_antes). */
export async function impressaoDoTexto(texto, sutil = globalThis.crypto && globalThis.crypto.subtle) {
  const bytes = await sutil.digest("SHA-256", new TextEncoder().encode(String(texto)));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
