// A documentação das issues e dos projetos (tela Projetos) é Markdown: o pedaço que uma documentação de trabalho usa
// (títulos, parágrafos, listas, checklist "- [ ]", código, links, citações, tabelas e linhas) vira HTML seguro. Tudo é
// escapado antes; só as marcas daqui viram HTML (nada de HTML colado, nada de link javascript:). Sem dependência.
// Mais: marcar um item da checklist, contar a checklist, anotar no "Registro" e o modelo da issue.
// Testado em test/markdown.test.mjs.

const ESCAPAR = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapar = s => String(s ?? "").replace(/[&<>"']/g, c => ESCAPAR[c]);
const linhasDe = md => String(md ?? "").replace(/\r\n?/g, "\n").split("\n");

/** Só vira link: http(s), mailto, um caminho deste site (/…) ou uma âncora (#…). */
function hrefSeguro(url) {
  const u = String(url || "").trim();
  return /^(https?:\/\/|mailto:)/i.test(u) || /^\/(?!\/)/.test(u) || /^#/.test(u) ? u : null;
}
const link = (href, textoHtml) => `<a href="${escapar(href)}" target="_blank" rel="noopener noreferrer">${textoHtml}</a>`;
/** Negrito, itálico e riscado, sobre texto já escapado. */
const enfeitar = s => s
  .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[^\w*])\*(?=[^\s*])([^*]*?[^\s*])\*(?![\w*])/g, "$1<em>$2</em>")
  .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>");

/** Uma linha de texto (crua) em HTML: código em linha, links, endereços soltos, negrito, itálico, riscado. */
export function emLinha(texto) {
  const guardados = [];
  const guardar = html => `\u0000${guardados.push(html) - 1}\u0000`;
  let s = String(texto ?? "").replace(/\u0000/g, "");
  s = s.replace(/`([^`]+)`/g, (_, c) => guardar(`<code>${escapar(c)}</code>`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => { const h = hrefSeguro(u); return h ? guardar(link(h, enfeitar(escapar(t)))) : m; });
  s = s.replace(/\bhttps?:\/\/[^\s<>()\u0000]*[^\s<>().,;:!?'"\u0000]/g, u => guardar(link(u, escapar(u))));
  return enfeitar(escapar(s)).replace(/\u0000(\d+)\u0000/g, (_, i) => guardados[Number(i)]);
}

const RE_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const RE_TAREFA = /^\[( |x|X)\]\s+(.*)$/;
const RE_CERCA = /^\s*(```|~~~)/;
const ehTabela = (l, prox) => /\|/.test(l) && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(prox || "");
const comecaBloco = (l, prox) => RE_CERCA.test(l) || /^#{1,6}\s/.test(l) || /^\s*>/.test(l) || RE_ITEM.test(l) || ehHr(l) || ehTabela(l, prox);
const ehHr = l => /^\s*([-*_])(\s*\1){2,}\s*$/.test(l);

/** As linhas de uma lista (itens, continuações indentadas e linhas em branco entre itens). */
function lerLista(linhas, i) {
  const itens = [];
  while (i < linhas.length) {
    const l = linhas[i];
    const m = l.match(RE_ITEM);
    if (m) { itens.push({ indent: m[1].replace(/\t/g, "    ").length, ordenada: /\d/.test(m[2]), texto: m[3], linha: i }); i++; continue; }
    if (!l.trim()) {
      let j = i + 1;
      while (j < linhas.length && !linhas[j].trim()) j++;
      if (j < linhas.length && RE_ITEM.test(linhas[j])) { i = j; continue; }
      break;
    }
    if (/^\s{2,}\S/.test(l) && itens.length && !RE_CERCA.test(l)) { itens[itens.length - 1].texto += " " + l.trim(); i++; continue; }
    break;
  }
  return { itens, fim: i };
}
function htmlDaLista(itens, k, indent, deslocamento) {
  const ordenada = itens[k].ordenada, tipo = ordenada ? "ol" : "ul";
  let html = `<${tipo}>`;
  // no mesmo nível, trocar de tipo (de "-" para "1.") começa outra lista
  while (k < itens.length && itens[k].indent >= indent && !(itens[k].indent <= indent && itens[k].ordenada !== ordenada && html !== `<${tipo}>`)) {
    const it = itens[k++];
    const t = it.texto.match(RE_TAREFA);
    let conteudo, classe = "";
    if (t) {
      const feita = t[1] !== " ";
      classe = ` class="md-tarefa${feita ? " feita" : ""}"`;
      conteudo = `<input type="checkbox" data-linha="${it.linha + deslocamento}"${feita ? " checked" : ""}><span>${emLinha(t[2])}</span>`;
    } else conteudo = emLinha(it.texto);
    while (k < itens.length && itens[k].indent > it.indent) {
      const dentro = htmlDaLista(itens, k, itens[k].indent, deslocamento);
      conteudo += dentro.html;
      k = dentro.k;
    }
    html += `<li${classe}>${conteudo}</li>`;
  }
  return { html: html + `</${tipo}>`, k };
}

/**
 * Markdown em HTML seguro. As caixas da checklist saem com data-linha (a linha no texto), para a tela marcar com
 * alternarTarefa. `deslocamento`: para as citações, que são lidas à parte.
 */
export function markdownParaHtml(md, deslocamento = 0) {
  const linhas = linhasDe(md);
  const out = [];
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i];
    if (RE_CERCA.test(l)) {
      const marca = l.trim().slice(0, 3);
      const corpo = [];
      i++;
      while (i < linhas.length && linhas[i].trim().slice(0, 3) !== marca) corpo.push(linhas[i++]);
      i++;
      out.push(`<pre><code>${escapar(corpo.join("\n"))}</code></pre>`);
      continue;
    }
    if (!l.trim()) { i++; continue; }
    const titulo = l.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (titulo) { const n = Math.min(titulo[1].length + 1, 6); out.push(`<h${n}>${emLinha(titulo[2])}</h${n}>`); i++; continue; }
    if (ehHr(l)) { out.push("<hr>"); i++; continue; }
    if (/^\s*>/.test(l)) {
      const inicio = i, corpo = [];
      while (i < linhas.length && /^\s*>/.test(linhas[i])) corpo.push(linhas[i++].replace(/^\s*>\s?/, ""));
      out.push(`<blockquote>${markdownParaHtml(corpo.join("\n"), deslocamento + inicio)}</blockquote>`);
      continue;
    }
    if (ehTabela(l, linhas[i + 1])) {
      const celulas = s => s.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
      const cabeca = celulas(l);
      const corpo = [];
      i += 2;
      while (i < linhas.length && linhas[i].trim() && /\|/.test(linhas[i])) corpo.push(celulas(linhas[i++]));
      out.push(`<div class="md-tabela"><table><thead><tr>${cabeca.map(c => `<th>${emLinha(c)}</th>`).join("")}</tr></thead><tbody>`
        + corpo.map(r => `<tr>${cabeca.map((_, k) => `<td>${emLinha(r[k] || "")}</td>`).join("")}</tr>`).join("") + "</tbody></table></div>");
      continue;
    }
    if (RE_ITEM.test(l)) {
      const { itens, fim } = lerLista(linhas, i);
      for (let k = 0; k < itens.length;) { const lista = htmlDaLista(itens, k, itens[k].indent, deslocamento); out.push(lista.html); k = lista.k; }
      i = fim;
      continue;
    }
    const paragrafo = [];
    while (i < linhas.length && linhas[i].trim() && (!paragrafo.length || !comecaBloco(linhas[i], linhas[i + 1]))) paragrafo.push(linhas[i++].trim());
    out.push(`<p>${emLinha(paragrafo.join(" "))}</p>`);
  }
  return out.join("\n");
}

/** As linhas que estão dentro de blocos de código (para não contar nem mexer nelas). */
function dentroDeCodigo(linhas) {
  const dentro = new Set();
  let marca = null;
  linhas.forEach((l, k) => {
    if (RE_CERCA.test(l)) { const m = l.trim().slice(0, 3); if (!marca) { marca = m; dentro.add(k); return; } if (m === marca) { marca = null; dentro.add(k); return; } }
    if (marca) dentro.add(k);
  });
  return dentro;
}
const RE_LINHA_TAREFA = /^(\s*(?:>\s?)*\s*(?:[-*+]|\d+[.)])\s+\[)( |x|X)(\])/;

/** Marca ou desmarca o item da checklist da linha `linha` (a de data-linha). Linha que não é item: nada muda. */
export function alternarTarefa(md, linha) {
  const linhas = linhasDe(md);
  if (!RE_LINHA_TAREFA.test(linhas[linha] || "") || dentroDeCodigo(linhas).has(linha)) return String(md ?? "");
  linhas[linha] = linhas[linha].replace(RE_LINHA_TAREFA, (_, a, m, b) => a + (m === " " ? "x" : " ") + b);
  return linhas.join("\n");
}

/** A checklist da documentação: quantos itens e quantos marcados (fora dos blocos de código). */
export function tarefasDoMarkdown(md) {
  const linhas = linhasDe(md), codigo = dentroDeCodigo(linhas);
  let total = 0, feitas = 0;
  linhas.forEach((l, k) => { const m = !codigo.has(k) && l.match(RE_LINHA_TAREFA); if (m) { total++; if (m[2] !== " ") feitas++; } });
  return { total, feitas };
}

/**
 * Uma linha nova no "Registro" (o diário da issue: o que foi feito, decisões, onde parou): "- 28/11 · texto", no fim
 * da seção. Sem a seção, ela é criada no fim. `dia` = "AAAA-MM-DD".
 */
export function anotarNoRegistro(md, texto, dia) {
  const t = String(texto || "").replace(/\s+/g, " ").trim();
  if (!t) return String(md ?? "");
  const nova = `- ${dia.slice(8, 10)}/${dia.slice(5, 7)} · ${t}`;
  const linhas = linhasDe(md), codigo = dentroDeCodigo(linhas);
  const k = linhas.findIndex((l, n) => !codigo.has(n) && /^#{1,6}\s+registro\b/i.test(l.trim()));
  if (k < 0) {
    const base = String(md ?? "").replace(/\s+$/, "");
    return (base ? base + "\n\n" : "") + "## Registro\n" + nova;
  }
  const nivel = linhas[k].trim().match(/^#+/)[0].length;
  let fim = linhas.length;
  for (let n = k + 1; n < linhas.length; n++) {
    const h = !codigo.has(n) && linhas[n].trim().match(/^(#{1,6})\s/);
    if (h && h[1].length <= nivel) { fim = n; break; }
  }
  let onde = fim;
  while (onde > k + 1 && !linhas[onde - 1].trim()) onde--;
  linhas.splice(onde, 0, nova);
  return linhas.join("\n");
}

/** O modelo da documentação de uma issue (o mesmo do guia, docs/projetos-e-issues.md). */
export const MODELO_DA_ISSUE = [
  "## Contexto",
  "Por que esta issue existe e o que já se sabe (links, arquivos do repositório, decisões).",
  "",
  "## O que fazer",
  "- [ ] Primeira ação",
  "- [ ] Segunda ação",
  "",
  "## Pronto quando",
  "- O que dá para conferir para dizer que acabou",
  "",
  "## Registro",
  "",
].join("\n");
