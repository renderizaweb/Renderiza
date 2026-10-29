// Exportar planilha (05, "Exportação"): CSV que abre certo no Excel em português (separador ";" e marca UTF-8) e no
// Google Planilhas. Ler CSV: para trazer as datas já marcadas (onboarding) de uma planilha. Funções puras, testadas
// em test/pecas.test.mjs (menos baixarCsv, que usa o navegador).

const BOM = "﻿";

function celula(valor) {
  if (valor === null || valor === undefined) return "";
  const t = String(valor);
  // fórmula no começo vira texto (ninguém abre a planilha e roda uma fórmula que veio de um campo)
  const seguro = /^[=+\-@\t\r]/.test(t) ? "'" + t : t;
  return /[;"\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/** `colunas`: [{ titulo, valor: linha => ... }]. */
export function paraCsv(linhas, colunas) {
  const cabeca = colunas.map(c => celula(c.titulo)).join(";");
  const corpo = linhas.map(l => colunas.map(c => celula(c.valor(l))).join(";"));
  return BOM + [cabeca, ...corpo].join("\r\n") + "\r\n";
}

/** Baixa o arquivo no aparelho. */
export function baixarCsv(nome, linhas, colunas) {
  const blob = new Blob([paraCsv(linhas, colunas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: nome.endsWith(".csv") ? nome : nome + ".csv" });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lê um CSV (separador ";", "," ou tab, com aspas) em linhas de células. */
export function lerCsv(texto) {
  const t = String(texto || "").replace(/^﻿/, "");
  const primeira = t.split(/\r?\n/)[0] || "";
  const sep = [";", "\t", ","].map(s => [s, primeira.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const linhas = [];
  let linha = [], atual = "", aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { atual += '"'; i++; }
      else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(atual); atual = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      linha.push(atual); atual = "";
      if (linha.some(x => x.trim())) linhas.push(linha);
      linha = [];
    } else atual += c;
  }
  linha.push(atual);
  if (linha.some(x => x.trim())) linhas.push(linha);
  return linhas.map(l => l.map(x => x.trim()));
}
