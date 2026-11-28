// A documentação das issues (painel/src/markdown.js): o Markdown de trabalho vira HTML seguro; a checklist marca e
// conta; o registro anota no lugar certo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { markdownParaHtml, emLinha, alternarTarefa, tarefasDoMarkdown, anotarNoRegistro, MODELO_DA_ISSUE } from "../painel/src/markdown.js";

test("títulos, parágrafos (as linhas quebradas viram uma só), listas, código, citação, linha e tabela", () => {
  const md = [
    "## Contexto", "O vereador fechou em 27/11.", "O site vai para a Vercel.", "",
    "- um", "- dois", "  - dois e meio", "1. primeiro", "",
    "```js", "const a = '<b>' && 1;", "```", "",
    "> citação", "", "---", "",
    "| Campo | Valor |", "|---|---|", "| a | `b` |",
  ].join("\n");
  const html = markdownParaHtml(md);
  assert.match(html, /<h3>Contexto<\/h3>/);
  assert.match(html, /<p>O vereador fechou em 27\/11\. O site vai para a Vercel\.<\/p>/);
  assert.match(html, /<ul><li>um<\/li><li>dois<ul><li>dois e meio<\/li><\/ul><\/li><\/ul>/);
  assert.match(html, /<ol><li>primeiro<\/li><\/ol>/);
  assert.match(html, /<pre><code>const a = &#39;&lt;b&gt;&#39; &amp;&amp; 1;<\/code><\/pre>/);
  assert.match(html, /<blockquote><p>citação<\/p><\/blockquote>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<table><thead><tr><th>Campo<\/th><th>Valor<\/th><\/tr><\/thead><tbody><tr><td>a<\/td><td><code>b<\/code><\/td><\/tr><\/tbody><\/table>/);
});

test("em linha: negrito, itálico, riscado, código, links e endereços soltos; snake_case fica como está", () => {
  assert.equal(emLinha("**forte** e *leve* e ~~fora~~"), "<strong>forte</strong> e <em>leve</em> e <del>fora</del>");
  assert.equal(emLinha("o `npm run site -- <pasta>`"), "o <code>npm run site -- &lt;pasta&gt;</code>");
  assert.equal(emLinha("veja [o guia](/docs/x.md)"), 'veja <a href="/docs/x.md" target="_blank" rel="noopener noreferrer">o guia</a>');
  assert.equal(emLinha("em https://exemplo.com/a?b=1&c=2."), 'em <a href="https://exemplo.com/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">https://exemplo.com/a?b=1&amp;c=2</a>.');
  assert.equal(emLinha("arquivo_de_teste e 2*3*4"), "arquivo_de_teste e 2*3*4");
});

test("seguro: HTML colado, javascript: e aspas não viram nada", () => {
  const html = markdownParaHtml('<script>alert(1)</script>\n<img src=x onerror="alert(1)">\n[clique](javascript:alert(1))\n[x](https://a.com/"onmouseover="alert(1))');
  assert.doesNotMatch(html, /<script|<img|href="javascript/i);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /href="[^"]*"onmouseover/);
  assert.match(markdownParaHtml("[clique](javascript:alert(1))"), /\[clique\]\(javascript:alert\(1\)\)/, "o link proibido fica como texto");
  assert.doesNotMatch(markdownParaHtml("## <b>oi</b>"), /<b>/);
});

test("checklist: as caixas saem com a linha; marcar e desmarcar mexem só naquela linha; código não conta", () => {
  const md = ["## O que fazer", "- [ ] Layout", "- [x] Domínio", "", "```", "- [ ] isto é código", "```", "> - [ ] na citação"].join("\n");
  const html = markdownParaHtml(md);
  assert.match(html, /<li class="md-tarefa"><input type="checkbox" data-linha="1"><span>Layout<\/span><\/li>/);
  assert.match(html, /<li class="md-tarefa feita"><input type="checkbox" data-linha="2" checked><span>Domínio<\/span><\/li>/);
  assert.match(html, /data-linha="7"/, "a da citação aponta para a linha certa do texto");
  assert.deepEqual(tarefasDoMarkdown(md), { total: 3, feitas: 1 });
  const marcada = alternarTarefa(md, 1);
  assert.equal(marcada.split("\n")[1], "- [x] Layout");
  assert.equal(alternarTarefa(marcada, 1).split("\n")[1], "- [ ] Layout");
  assert.equal(alternarTarefa(md, 5), md, "dentro do código, nada muda");
  assert.equal(alternarTarefa(md, 0), md, "linha que não é item, nada muda");
  assert.equal(alternarTarefa(md, 7).split("\n")[7], "> - [x] na citação");
});

test("registro: a linha nova entra no fim da seção (antes da próxima); sem a seção, ela é criada", () => {
  const md = "## O que fazer\n- [ ] a\n\n## Registro\n- 27/11 · começou\n\n## Depois\ntexto";
  assert.equal(anotarNoRegistro(md, "  layout   aprovado ", "2026-11-30"), "## O que fazer\n- [ ] a\n\n## Registro\n- 27/11 · começou\n- 30/11 · layout aprovado\n\n## Depois\ntexto");
  assert.equal(anotarNoRegistro("Só texto.", "feito", "2026-12-01"), "Só texto.\n\n## Registro\n- 01/12 · feito");
  assert.equal(anotarNoRegistro("", "primeira", "2026-12-01"), "## Registro\n- 01/12 · primeira");
  assert.equal(anotarNoRegistro("x", "   ", "2026-12-01"), "x");
  const doModelo = anotarNoRegistro(MODELO_DA_ISSUE, "comecei", "2026-11-30");
  assert.match(doModelo, /## Registro\n- 30\/11 · comecei/);
});

test("o modelo da issue: contexto, o que fazer (checklist), pronto quando e registro", () => {
  const html = markdownParaHtml(MODELO_DA_ISSUE);
  for (const t of ["Contexto", "O que fazer", "Pronto quando", "Registro"]) assert.match(html, new RegExp(`<h3>${t}</h3>`));
  assert.deepEqual(tarefasDoMarkdown(MODELO_DA_ISSUE), { total: 2, feitas: 0 });
});
