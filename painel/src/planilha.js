// Planilhão no padrão do Compasso.
// - Cada célula salva ao sair do campo. Enter salva e desce, Shift+Enter sobe, Alt+setas navegam, Esc desfaz.
// - "+" insere uma linha logo abaixo; a alça arrasta a linha (só em "Minha ordem").
// - Colar um bloco copiado de uma planilha preenche várias células de uma vez.
// - Colar várias linhas no campo "Adicionar…" cria vários registros.
// - O valor só fica na tela como salvo depois que o banco confirma; se falhar, volta ao valor do banco.

import { h, opcoesDoSelect, opcoesPlanas } from "./dom.js";
import { icone } from "./icones.js";
import { botaoMenu } from "./ui.js";
import { lerValor, formatarValor } from "./modelo.js";

const EDITAVEIS = new Set(["nome", "texto", "link", "data", "valor", "select"]);

/** Converte datas coladas (31/12/2026, 31/12/26 ou 2026-12-31) para AAAA-MM-DD. */
function lerData(texto) {
  const s = String(texto || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return undefined;
  const ano = m[3].length === 2 ? "20" + m[3] : m[3];
  return ano + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
}
const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * @param {object} o
 * @param {HTMLElement} o.host
 * @param {Array} o.colunas  [{campo, titulo, tipo:"nome"|"texto"|"link"|"data"|"valor"|"select"|"leitura", largura, ocultavel, opcoes(l), classe(l), href(v), exibir(l), placeholder}]
 *                           opcoes(l) devolve [valor, texto] ou grupos {grupo, opcoes: [[valor, texto]…]} (viram <optgroup>).
 * @param {() => object[]} o.linhas         linhas visíveis, já filtradas e ordenadas
 * @param {(id) => object|null} o.buscar
 * @param {() => boolean} o.podeEditar
 * @param {() => boolean} o.manual          true em "Minha ordem": libera arrastar
 * @param {() => Set<string>} o.ocultas      campos ocultos
 * @param {(campo) => void} o.aoOcultar
 * @param {(linha) => Array<{texto, classe?, titulo?, href?, icone?}>} [o.marcas]  etiquetas ao lado do nome
 * @param {(linha) => Array<object>} [o.acoesExtras]  itens a mais no menu … da linha
 * @param {(linha, coluna, valor) => Promise} o.aoEditar
 * @param {(linha) => void} o.aoAbrir
 * @param {(linha) => Promise<object>} o.aoInserirAbaixo
 * @param {(id, alvoId, lado) => Promise} o.aoMover
 * @param {(linha) => void} o.aoExcluir
 * @param {(texto) => Promise<object>} o.aoAdicionar
 * @param {(linhas: string[][]) => Promise} o.aoAdicionarVarios
 * @param {(mudancas: {linha, patch}[]) => Promise} o.aoColar
 * @param {(msg) => void} o.aoErro
 * @param {() => Array<{rotulo, valores, secundaria}>} o.rodape
 * @param {{titulo, texto}} o.vazio
 * @param {string} o.rotuloAdicionar
 * @param {string} o.nomeItem            ex.: "lead"
 */
export function criarPlanilha(o) {
  const trs = new Map();
  let chaveColunas = "";
  let reordenar = false;
  let arrastando = null;

  const container = h("div", { class: "table-container" });
  const tabela = h("table", { class: "planilhao" });
  const thead = h("thead"), tbody = h("tbody"), tfoot = h("tfoot");
  tabela.append(thead, tbody, tfoot);
  container.append(tabela);
  const vazio = h("div", { class: "empty-grid", hidden: true }, icone("tabela", 28), h("strong", { text: o.vazio.titulo }), h("span", { text: o.vazio.texto }));

  // Adicionar ao fim (ou várias linhas coladas de uma vez)
  const inputAdd = h("input", { type: "text", placeholder: o.rotuloAdicionar, "aria-label": o.rotuloAdicionar, maxlength: "120", autocomplete: "off" });
  const botaoAdd = h("button", { type: "submit", class: "btn btn-ghost btn-sm", disabled: true }, "Adicionar ", h("span", { class: "keycap", text: "↵" }));
  const formAdd = h("form", { class: "add-row" }, icone("mais", 18), inputAdd, botaoAdd);
  inputAdd.addEventListener("input", () => { botaoAdd.disabled = !inputAdd.value.trim() || !o.podeEditar(); });
  formAdd.addEventListener("submit", async e => {
    e.preventDefault();
    const texto = inputAdd.value.trim();
    if (!texto || !o.podeEditar()) return;
    inputAdd.disabled = true;
    try {
      const nova = await o.aoAdicionar(texto);
      inputAdd.value = ""; botaoAdd.disabled = true;
      atualizar(); destacar(nova.id);
    } catch (err) { /* aviso já mostrado; o texto continua no campo */ }
    finally { inputAdd.disabled = !o.podeEditar(); if (!inputAdd.disabled) inputAdd.focus(); }
  });
  inputAdd.addEventListener("paste", async e => {
    const texto = e.clipboardData.getData("text");
    if (!/\n/.test(texto.trim())) return;
    e.preventDefault();
    const linhas = texto.replace(/\r/g, "").split("\n").map(l => l.split("\t").map(c => c.trim())).filter(l => l[0]);
    if (linhas.length) { await o.aoAdicionarVarios(linhas); atualizar(); }
  });

  const contagem = h("span");
  const rodapeFolha = h("div", { class: "sheet-foot" },
    h("span", {}, icone("certoDuplo", 15), "Enter salva e desce · Tab avança · Esc desfaz"),
    contagem);

  o.host.append(h("div", { class: "sheet-card" }, container, vazio, formAdd, rodapeFolha));

  const visiveis = () => { const ocultas = o.ocultas(); return o.colunas.filter(c => !ocultas.has(c.campo)); };

  function montarCabecalho(cols) {
    const tr = h("tr");
    cols.forEach(c => {
      const th = h("th", { scope: "col", class: c.tipo === "nome" ? "sticky-name" : "col", "data-col": c.campo });
      th.style.minWidth = c.largura + "px";
      th.append(h("span", { text: c.titulo }));
      if (c.ocultavel) th.append(h("button", { type: "button", class: "hide-col-button", title: "Ocultar coluna", "aria-label": "Ocultar coluna " + c.titulo, onclick: () => o.aoOcultar(c.campo) }, icone("ocultar", 14)));
      tr.append(th);
    });
    tr.append(h("th", { class: "actions-col" }, h("span", { class: "sr-only", text: "Ações" })));
    thead.replaceChildren(tr);
  }

  /* ---------- células ---------- */
  function criarCelula(c, id) {
    const td = h("td", { class: c.tipo === "nome" ? "sticky-name" : c.tipo === "valor" ? "col money" : "col", "data-col": c.campo });
    const linha = () => o.buscar(id);
    let el = null;

    const salvar = async valor => {
      const atual = linha(); if (!atual) return;
      try { await o.aoEditar(atual, c, valor); }
      catch (e) { /* aviso mostrado por quem salvou */ }
      finally { const l = linha(); if (l) preencher(td, l, true); }
    };

    if (c.tipo === "nome" || c.tipo === "texto" || c.tipo === "link" || c.tipo === "valor") {
      el = h("input", { type: "text", class: "inline-text" + (c.tipo === "valor" ? " num" : ""), placeholder: c.placeholder || "", "aria-label": c.titulo, inputmode: c.tipo === "valor" ? "decimal" : null, autocomplete: "off", maxlength: c.tipo === "nome" ? "120" : null });
      el.addEventListener("change", () => {
        const l = linha(); if (!l) return;
        if (c.tipo === "valor") {
          const v = lerValor(el.value);
          if (v === undefined) { o.aoErro("Use só números em " + c.titulo + "."); preencher(td, l, true); return; }
          if (v === (l[c.campo] ?? null)) { preencher(td, l, true); return; }
          return salvar(v);
        }
        const v = el.value.trim();
        if (c.tipo === "nome" && !v) { o.aoErro("O nome não pode ficar vazio."); preencher(td, l, true); return; }
        if (v !== (l[c.campo] || "")) salvar(v);
      });
    } else if (c.tipo === "data") {
      el = h("input", { type: "date", class: "inline-text inline-date", "aria-label": c.titulo });
      el.addEventListener("change", () => { const l = linha(); if (l && (el.value || null) !== (l[c.campo] || null)) salvar(el.value || null); });
    } else if (c.tipo === "select") {
      el = h("select", { class: "cell-select", "aria-label": c.titulo });
      el.addEventListener("change", () => { if (linha()) salvar(el.value || null); });
    } else if (c.tipo === "leitura") {
      el = h("span", { class: "muted-cell" });
    }

    if (c.tipo === "nome") {
      const inserir = h("button", { type: "button", class: "insert-row-button", title: "Inserir linha abaixo", "aria-label": "Inserir linha abaixo", onclick: () => inserirAbaixo(id) }, icone("mais", 14));
      // Alça como <span>: botões não iniciam arrasto em todos os navegadores. Pelo teclado, Alt+↑/↓ move a linha.
      const alca = h("span", { class: "row-drag-handle", role: "button", tabindex: "0", title: "Arrastar para reordenar", "aria-label": "Arrastar para reordenar (Alt+↑ ou Alt+↓ pelo teclado)" }, icone("alca", 15));
      alca.addEventListener("keydown", e => {
        if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
        e.preventDefault();
        if (!o.manual() || !o.podeEditar()) { o.aoErro("Escolha \"Minha ordem\" em Ordenar para mover linhas."); return; }
        const tr = td.parentElement, vizinho = e.key === "ArrowUp" ? tr.previousElementSibling : tr.nextElementSibling;
        if (!vizinho) return;
        Promise.resolve(o.aoMover(id, vizinho.dataset.id, e.key === "ArrowUp" ? "antes" : "depois"))
          .then(() => { atualizar(); requestAnimationFrame(() => { const t = trs.get(id); const a = t && t.querySelector(".row-drag-handle"); if (a) a.focus(); }); })
          .catch(() => { /* aviso já mostrado */ });
      });
      alca.addEventListener("dragstart", e => {
        if (!o.manual() || !o.podeEditar()) { e.preventDefault(); return; }
        arrastando = id;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        td.parentElement.classList.add("row-dragging");
      });
      alca.addEventListener("dragend", () => { arrastando = null; limparAlvo(); const tr = trs.get(id); if (tr) tr.classList.remove("row-dragging"); });
      const marca = h("span", { class: "marcas" });
      const abrir = h("button", { type: "button", class: "open-row-button", title: "Abrir detalhes", "aria-label": "Abrir detalhes", onclick: () => { const l = linha(); if (l) o.aoAbrir(l); } }, icone("painel", 15));
      td.append(inserir, alca, h("div", { class: "row-name-editor" }, el, marca, abrir));
      td._alca = alca; td._marca = marca; td._inserir = inserir;
    } else if (c.tipo === "link") {
      const a = h("a", { class: "ir", target: "_blank", rel: "noopener noreferrer", "aria-label": "Abrir " + c.titulo, title: "Abrir" }, icone("abrirLink", 14));
      td.append(h("div", { class: "link-cell" }, el, a));
      td._link = a;
    } else if (el) td.append(el);

    td._c = c; td._el = el;
    return td;
  }

  function preencher(td, l, forcar) {
    const c = td._c, el = td._el;
    if (!c || !el) return;
    const focado = document.activeElement === el && !forcar;
    const bloqueado = !o.podeEditar();
    const v = l[c.campo];
    if (c.tipo === "nome" || c.tipo === "texto" || c.tipo === "link") { if (!focado) el.value = v || ""; el.disabled = bloqueado; if (c.tipo !== "link") el.title = v || ""; }
    else if (c.tipo === "valor") { if (!focado) el.value = formatarValor(v); el.disabled = bloqueado; }
    else if (c.tipo === "data") { if (!focado) el.value = v || ""; el.classList.toggle("vazia", !el.value); el.disabled = bloqueado; }
    else if (c.tipo === "select") {
      const opcoes = c.opcoes(l);
      const chave = JSON.stringify(opcoes);
      if (el._chave !== chave) { el.replaceChildren(...opcoesDoSelect(opcoes)); el._chave = chave; }
      if (!focado) el.value = v || "";
      el.className = "cell-select " + (c.classe ? c.classe(l) : "");
      el.disabled = bloqueado;
    } else if (c.tipo === "leitura") el.textContent = c.exibir(l);
    if (td._link) { const href = c.href(v); td._link.hidden = !href; if (href) td._link.href = href; }
    if (td._marca) {
      // Etiquetas ao lado do nome (ex.: "revisar", "não contatar"). Clicar abre os detalhes;
      // etiqueta com link (ex.: "demo ↗") abre o link em outra aba.
      const marcas = o.marcas ? o.marcas(l) : [];
      const chave = marcas.map(m => m.texto + (m.href || "") + (m.icone || "")).join("|");
      if (td._marca._chave !== chave) {
        td._marca._chave = chave;
        td._marca.replaceChildren(...marcas.map(m => m.href
          ? h("a", { class: "marca-revisar " + (m.classe || ""), href: m.href, target: "_blank", rel: "noopener noreferrer", title: m.titulo || "" }, m.icone ? icone(m.icone, 12) : null, m.texto)
          : h("button", { type: "button", class: "marca-revisar " + (m.classe || ""), title: m.titulo || "", onclick: () => { const atual = o.buscar(l.id); if (atual) o.aoAbrir(atual); } }, m.icone ? icone(m.icone, 12) : null, m.texto)));
      }
    }
    if (td._alca) { const pode = o.manual() && !bloqueado; td._alca.draggable = pode; td._alca.classList.toggle("disabled", !pode); td._alca.setAttribute("aria-disabled", String(!pode)); td._alca.title = o.manual() ? "Arrastar para reordenar" : "Escolha Minha ordem para arrastar"; }
    if (td._inserir) td._inserir.disabled = bloqueado;
  }

  function criarLinha(l, cols) {
    const tr = h("tr", { "data-id": l.id });
    cols.forEach(c => tr.append(criarCelula(c, l.id)));
    const acoes = botaoMenu(icone("reticencias", 16), () => {
      const atual = o.buscar(l.id);
      return [
        { texto: "Abrir detalhes", icone: "painel", acao: () => atual && o.aoAbrir(atual) },
        ...(o.acoesExtras && atual ? o.acoesExtras(atual) : []),
        { texto: "Inserir linha abaixo", icone: "inserirLinha", acao: () => inserirAbaixo(l.id), desativado: !o.podeEditar() },
        { separador: true },
        { texto: "Excluir " + o.nomeItem, icone: "lixo", destrutivo: true, acao: () => atual && o.aoExcluir(atual), desativado: !o.podeEditar() },
      ];
    }, { classe: "icon-button", rotulo: "Ações", alinhar: "end" });
    tr.append(h("td", { class: "actions-col" }, acoes));
    tr.addEventListener("dragover", e => {
      if (!arrastando || arrastando === l.id) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const r = tr.getBoundingClientRect();
      limparAlvo();
      tr.classList.add(e.clientY < r.top + r.height / 2 ? "row-drop-before" : "row-drop-after");
    });
    tr.addEventListener("drop", async e => {
      if (!arrastando || arrastando === l.id) return;
      e.preventDefault();
      const r = tr.getBoundingClientRect();
      const lado = e.clientY < r.top + r.height / 2 ? "antes" : "depois";
      const id = arrastando;
      arrastando = null; limparAlvo();
      try { await o.aoMover(id, l.id, lado); } catch (err) { /* aviso já mostrado */ }
    });
    return tr;
  }
  const limparAlvo = () => tbody.querySelectorAll(".row-drop-before,.row-drop-after").forEach(tr => tr.classList.remove("row-drop-before", "row-drop-after"));

  async function inserirAbaixo(id) {
    const l = o.buscar(id);
    if (!l || !o.podeEditar()) return;
    try {
      const nova = await o.aoInserirAbaixo(l);
      atualizar();
      requestAnimationFrame(() => { const tr = trs.get(nova.id); const input = tr && tr.querySelector(".sticky-name input"); if (input) { input.focus(); input.select(); } });
    } catch (e) { /* aviso já mostrado */ }
  }

  /* ---------- desenho ---------- */
  function atualizar() {
    const cols = visiveis();
    const chave = cols.map(c => c.campo).join("|");
    if (chave !== chaveColunas) { chaveColunas = chave; trs.forEach(tr => tr.remove()); trs.clear(); montarCabecalho(cols); }
    const lista = o.linhas();
    const ids = new Set(lista.map(l => l.id));
    const ativo = document.activeElement;
    // Só segura a reordenação enquanto uma célula está sendo digitada (não quando o foco está num botão da linha).
    const editando = tbody.contains(ativo) && ativo.matches("input, select");

    trs.forEach((tr, id) => {
      if (ids.has(id)) return;
      // Linha que saiu do filtro enquanto é digitada fica até o fim da edição; linha excluída sai na hora.
      if (editando && tr.contains(ativo) && o.buscar(id)) return;
      if (tr.contains(ativo)) {
        const vizinha = tr.nextElementSibling || tr.previousElementSibling;
        const alvo = vizinha && vizinha.querySelector(".actions-col button");
        requestAnimationFrame(() => (alvo && document.contains(alvo) ? alvo : inputAdd).focus());
      }
      tr.remove(); trs.delete(id);
    });
    lista.forEach(l => {
      let tr = trs.get(l.id);
      if (!tr) { tr = criarLinha(l, cols); trs.set(l.id, tr); if (editando) tbody.append(tr); }
      [...tr.children].forEach(td => preencher(td, l, false));
    });
    const atual = [...tbody.children].map(tr => tr.dataset.id).join("|");
    const desejada = lista.map(l => l.id).join("|");
    if (atual !== desejada) {
      if (editando) reordenar = true;
      else { lista.forEach(l => tbody.append(trs.get(l.id))); reordenar = false; }
    }

    // totais
    const linhasRodape = o.rodape ? o.rodape() : [];
    tfoot.replaceChildren(...linhasRodape.map(r => h("tr", { class: r.secundaria ? "secondary-total" : null },
      ...cols.map(c => c.tipo === "nome"
        ? h("td", { class: "sticky-name", text: r.rotulo })
        : h("td", { class: "total-cell" + (c.tipo === "valor" ? " num" : ""), text: (r.valores && r.valores[c.campo]) || "" })),
      h("td"))));
    tfoot.hidden = !lista.length;

    vazio.hidden = lista.length > 0;
    inputAdd.disabled = !o.podeEditar();
    botaoAdd.disabled = !inputAdd.value.trim() || !o.podeEditar();
    tabela.classList.toggle("ordem-manual", o.manual());
    return lista;
  }

  /* ---------- teclado e colar ---------- */
  function editorEm(tr, i) { const td = tr && tr.children[i]; return td && td.querySelector("input, select"); }
  tbody.addEventListener("focusin", e => { if (e.target.matches("input.inline-text:not(.inline-date)")) requestAnimationFrame(() => { if (document.activeElement === e.target) e.target.select(); }); });
  tbody.addEventListener("keydown", e => {
    const el = e.target;
    if (!el.matches("input, select")) return;
    const td = el.closest("td"), tr = td.parentElement, i = [...tr.children].indexOf(td);
    if (e.key === "Escape" && el.tagName === "INPUT") {
      e.preventDefault(); e.stopPropagation();
      const l = o.buscar(tr.dataset.id); if (l) preencher(td, l, true);
      el.blur();
      return;
    }
    if (e.key === "Enter" && el.tagName === "INPUT") {
      e.preventDefault();
      const alvo = editorEm(e.shiftKey ? tr.previousElementSibling : tr.nextElementSibling, i);
      el.blur();
      if (alvo) alvo.focus();
      return;
    }
    if (e.altKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      let alvo = null;
      if (e.key === "ArrowUp") alvo = editorEm(tr.previousElementSibling, i);
      if (e.key === "ArrowDown") alvo = editorEm(tr.nextElementSibling, i);
      if (e.key === "ArrowLeft") for (let k = i - 1; k >= 0 && !alvo; k--) alvo = editorEm(tr, k);
      if (e.key === "ArrowRight") for (let k = i + 1; k < tr.children.length && !alvo; k++) alvo = editorEm(tr, k);
      if (alvo) { el.dispatchEvent(new Event("change", { bubbles: true })); alvo.focus(); }
    }
  });
  tbody.addEventListener("focusout", () => setTimeout(() => { if (reordenar && !tbody.contains(document.activeElement)) atualizar(); }, 0));

  tbody.addEventListener("paste", async e => {
    const el = e.target;
    if (!el.matches("input.inline-text")) return;
    const texto = e.clipboardData.getData("text");
    if (!/[\t\n]/.test(texto.replace(/\n$/, ""))) return;
    e.preventDefault();
    const cols = visiveis();
    const lista = o.linhas();
    const tr = el.closest("tr"), td = el.closest("td");
    const r0 = lista.findIndex(l => l.id === tr.dataset.id), c0 = [...tr.children].indexOf(td);
    const grade = texto.replace(/\r/g, "").replace(/\n$/, "").split("\n").map(l => l.split("\t"));
    const mudancas = new Map();
    try {
      grade.forEach((valores, dr) => valores.forEach((bruto, dc) => {
        const l = lista[r0 + dr], c = cols[c0 + dc];
        if (!l || !c) throw new Error("A seleção colada passa do fim da tabela. Adicione linhas ou mostre mais colunas.");
        if (!EDITAVEIS.has(c.tipo)) return;
        let v = bruto.trim();
        if (c.tipo === "valor") { v = lerValor(v); if (v === undefined) throw new Error(`"${bruto}" não é um valor válido em ${c.titulo}.`); }
        else if (c.tipo === "data") { v = lerData(v); if (v === undefined) throw new Error(`"${bruto}" não é uma data válida em ${c.titulo}. Use 31/12/2026.`); }
        else if (c.tipo === "select") {
          // Vale o texto ("Sem resposta"), o texto com o grupo ("Em andamento · Sem resposta") ou o id.
          const op = opcoesPlanas(c.opcoes(l)).find(([valor, rotulo, grupo]) => [rotulo, valor, grupo && grupo + " · " + rotulo].some(t => t && semAcento(t) === semAcento(v)));
          if (!op) throw new Error(`"${bruto}" não é uma opção de ${c.titulo}.`);
          v = op[0] || null;
        } else if (c.tipo === "nome" && !v) return;
        if (!mudancas.has(l.id)) mudancas.set(l.id, { linha: l, patch: {} });
        mudancas.get(l.id).patch[c.campo] = v;
      }));
    } catch (err) { o.aoErro(err.message); return; }
    el.blur();
    await o.aoColar([...mudancas.values()]);
  });

  function destacar(id) {
    const tr = trs.get(id);
    if (!tr) return;
    tr.classList.remove("destaque"); void tr.offsetWidth; tr.classList.add("destaque");
    tr.scrollIntoView({ block: "nearest" });
  }

  return {
    atualizar: () => { const lista = atualizar(); contagem.textContent = lista.length === 1 ? "1 " + o.nomeItem : lista.length + " " + o.nomeItem + "s"; return lista; },
    destacar,
    focarAdicionar: () => { inputAdd.focus(); inputAdd.scrollIntoView({ block: "nearest" }); },
  };
}
