// Tela dos filtros do Pipeline: o botão "Filtrar" abre a lista de campos (com busca); escolhido o campo, aparecem
// os valores (com quantos leads há em cada um) ou os períodos. Cada filtro ativo vira um chip na faixa abaixo da
// barra: clicar no operador troca "é" por "não é", clicar nos valores reabre a escolha, o × tira. A lógica é a de
// filtros.js; quem usa passa os leads (já com a busca), o contexto e onde ler e gravar os filtros.

import { h } from "./dom.js";
import { icone } from "./icones.js";
import { CAMPOS, GRUPOS, SEM, PERIODOS, campo, contar, alternarValor, definirPeriodo, alternarOperador, tirar, descrever } from "./filtros.js";

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- o pop-up (um aberto por vez) ---------- */
let aberto = null;
function fecharPop(devolverFoco) {
  if (!aberto) return;
  const { el, gatilho, limpar } = aberto;
  aberto = null;
  limpar();
  el.remove();
  if (gatilho.isConnected) { gatilho.setAttribute("aria-expanded", "false"); if (devolverFoco) gatilho.focus(); }
}
function abrirPop(gatilho) {
  fecharPop();
  const el = h("div", { class: "filtro-pop", role: "dialog", "aria-label": "Filtros" });
  document.body.append(el);
  let ultimo = gatilho.getBoundingClientRect();
  const posicionar = () => {
    if (gatilho.isConnected) ultimo = gatilho.getBoundingClientRect(); // o chip pode ter sido redesenhado: fica onde estava
    const largura = el.offsetWidth, altura = el.offsetHeight;
    const esquerda = Math.max(8, Math.min(ultimo.left, window.innerWidth - largura - 8));
    let topo = ultimo.bottom + 6;
    if (topo + altura > window.innerHeight - 8 && ultimo.top - altura - 6 > 8) topo = ultimo.top - altura - 6;
    el.style.left = esquerda + "px"; el.style.top = Math.max(8, topo) + "px";
  };
  const fora = e => { if (!el.contains(e.target) && !gatilho.contains(e.target)) fecharPop(false); };
  const teclas = e => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fecharPop(true); return; }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const itens = [...el.querySelectorAll(".filtro-item:not([disabled]), .filtro-pop input")];
    const i = itens.indexOf(document.activeElement);
    e.preventDefault();
    (itens[e.key === "ArrowDown" ? i + 1 : i - 1] || itens[e.key === "ArrowDown" ? 0 : itens.length - 1]).focus();
  };
  const rolar = e => { if (!el.contains(e.target)) posicionar(); };
  document.addEventListener("keydown", teclas, true);
  document.addEventListener("scroll", rolar, true);
  window.addEventListener("resize", posicionar);
  setTimeout(() => document.addEventListener("pointerdown", fora, true), 0);
  gatilho.setAttribute("aria-expanded", "true");
  aberto = { el, gatilho, posicionar, limpar: () => {
    document.removeEventListener("keydown", teclas, true);
    document.removeEventListener("scroll", rolar, true);
    window.removeEventListener("resize", posicionar);
    document.removeEventListener("pointerdown", fora, true);
  } };
  return aberto;
}

/**
 * @param {{leads: () => Array, ctx: () => object, ler: () => Array, gravar: (filtros) => void}} o
 * @returns {{botao: HTMLElement, faixa: HTMLElement, atualizar: (visiveis: number, total: number) => void, fechar: () => void}}
 */
export function criarFiltros(o) {
  const contador = h("span", { class: "filtro-contador", hidden: true });
  const botao = h("button", { type: "button", class: "btn btn-outline botao-filtrar", "aria-haspopup": "dialog", "aria-expanded": "false" },
    icone("filtro", 16), h("span", { text: "Filtrar" }), contador);
  const chips = h("div", { class: "filtro-chips" });
  const conta = h("span", { class: "filtro-total" });
  const limparTudo = h("button", { type: "button", class: "text-link filtro-limpar", onclick: () => { fecharPop(); o.gravar([]); } }, "Limpar filtros");
  const faixa = h("div", { class: "faixa-filtros", hidden: true }, chips, limparTudo, conta);
  let chave = "";

  const filtroDe = id => o.ler().find(f => f.campo === id) || null;
  const opcoesDe = c => (c.tipo === "lista" ? c.opcoes(o.leads(), o.ctx()) : []);

  botao.addEventListener("click", e => {
    e.stopPropagation();
    if (aberto && aberto.gatilho === botao) { fecharPop(true); return; }
    telaCampos(abrirPop(botao));
  });

  /* ---------- 1. qual campo ---------- */
  function telaCampos(pop, consulta = "") {
    const busca = h("input", { type: "text", class: "filtro-busca", placeholder: "Filtrar por…", "aria-label": "Procurar campo ou valor", value: consulta, autocomplete: "off" });
    const lista = h("div", { class: "filtro-lista", role: "menu" });
    const desenhar = () => {
      const q = semAcento(busca.value.trim());
      const itens = [];
      for (const g of GRUPOS) {
        const campos = CAMPOS.filter(c => c.grupo === g && (!q || semAcento(c.nome).includes(q)));
        if (!campos.length) continue;
        itens.push(h("div", { class: "filtro-rotulo", text: g }));
        for (const c of campos) {
          const f = filtroDe(c.id);
          itens.push(h("button", { type: "button", class: "filtro-item filtro-campo", role: "menuitem", onclick: () => abrirCampo(pop, c) },
            icone(c.icone, 15), h("span", { class: "filtro-nome", text: c.nome }),
            f ? h("span", { class: "filtro-ativo", text: c.tipo === "lista" ? String(f.valores.length) : "✓" }) : null,
            h("span", { class: "filtro-seta" }, icone("direita", 14))));
        }
      }
      // Escrevendo, aparecem também os valores que batem (ex.: "mauá" → Cidade: Mauá), para ligar direto.
      if (q.length >= 2) {
        const achados = [];
        for (const c of CAMPOS.filter(x => x.tipo === "lista")) {
          for (const op of opcoesDe(c)) if (op.valor !== SEM && semAcento(op.nome + " " + (op.curto || "")).includes(q)) achados.push([c, op]);
        }
        if (achados.length) itens.push(h("div", { class: "filtro-rotulo", text: "Valores" }), ...achados.slice(0, 8).map(([c, op]) => {
          const ligado = !!(filtroDe(c.id) && filtroDe(c.id).valores.includes(op.valor));
          return h("button", { type: "button", class: "filtro-item", role: "menuitem", onclick: () => { if (!ligado) o.gravar(alternarValor(o.ler(), c.id, op.valor)); fecharPop(true); } },
            icone(c.icone, 15), h("span", { class: "filtro-nome" }, h("span", { class: "filtro-de", text: c.nome + ": " }), op.nome), ligado ? icone("certo", 14) : null);
        }));
      }
      lista.replaceChildren(...(itens.length ? itens : [h("p", { class: "filtro-vazio", text: "Nada encontrado." })]));
    };
    busca.addEventListener("input", desenhar);
    busca.addEventListener("keydown", e => { if (e.key === "Enter") { const p = lista.querySelector(".filtro-item"); if (p) { e.preventDefault(); p.click(); } } });
    desenhar();
    pop.el.replaceChildren(busca, lista);
    pop.posicionar();
    busca.focus();
  }
  const abrirCampo = (pop, c, { voltar = true } = {}) => (c.tipo === "lista" ? telaLista(pop, c, voltar) : telaData(pop, c, voltar));
  const cabeca = (pop, c, voltar) => h("div", { class: "filtro-cabeca" },
    voltar ? h("button", { type: "button", class: "filtro-voltar", "aria-label": "Voltar aos campos", title: "Voltar", onclick: () => telaCampos(pop) }, icone("esquerda", 15)) : icone(c.icone, 15),
    h("strong", { text: c.nome }));

  /* ---------- 2a. valores de uma lista ---------- */
  function telaLista(pop, c, voltar) {
    const opcoes = opcoesDe(c);
    const contagem = contar(o.leads(), o.ler(), c, o.ctx());
    const busca = (c.busca || opcoes.length > 8) ? h("input", { type: "text", class: "filtro-busca", placeholder: "Procurar…", "aria-label": "Procurar " + c.nome, autocomplete: "off" }) : null;
    const lista = h("div", { class: "filtro-lista", role: "menu" });
    const linhas = opcoes.map(op => {
      const marca = h("span", { class: "filtro-marca" });
      const item = h("button", { type: "button", class: "filtro-item filtro-opcao", role: "menuitemcheckbox", "aria-checked": "false", title: op.dica || null },
        marca,
        op.classe && op.curto ? h("span", { class: "filtro-selo " + op.classe, text: op.curto }) : null,
        h("span", { class: "filtro-nome", text: op.nome }),
        h("span", { class: "filtro-conta" + ((contagem.get(op.valor) || 0) ? "" : " zero"), text: String(contagem.get(op.valor) || 0) }));
      const marcar = () => {
        const ligado = !!(filtroDe(c.id) && filtroDe(c.id).valores.includes(op.valor));
        item.setAttribute("aria-checked", String(ligado));
        marca.replaceChildren(...(ligado ? [icone("certo", 13)] : []));
      };
      item.addEventListener("click", () => { o.gravar(alternarValor(o.ler(), c.id, op.valor)); marcar(); rodape(); });
      marcar();
      return { item, texto: semAcento(op.nome + " " + (op.curto || "")) };
    });
    const pe = h("div", { class: "filtro-pe" });
    const rodape = () => {
      const f = filtroDe(c.id);
      pe.replaceChildren(...(f ? [
        h("button", { type: "button", class: "text-link", onclick: () => { o.gravar(alternarOperador(o.ler(), c.id)); rodape(); } }, f.op === "nao" ? "Trocar para “é”" : "Trocar para “não é”"),
        h("button", { type: "button", class: "text-link", onclick: () => { o.gravar(tirar(o.ler(), c.id)); fecharPop(true); } }, "Tirar filtro"),
      ] : []));
      pe.hidden = !f;
    };
    const desenhar = () => {
      const q = busca ? semAcento(busca.value.trim()) : "";
      const vis = linhas.filter(x => !q || x.texto.includes(q));
      lista.replaceChildren(...(vis.length ? vis.map(x => x.item) : [h("p", { class: "filtro-vazio", text: "Nada encontrado." })]));
    };
    if (busca) busca.addEventListener("input", desenhar);
    desenhar(); rodape();
    pop.el.replaceChildren(cabeca(pop, c, voltar), ...(busca ? [busca] : []), lista, pe);
    pop.posicionar();
    (busca || lista.querySelector(".filtro-item"))?.focus();
  }

  /* ---------- 2b. período de uma data ---------- */
  function telaData(pop, c, voltar) {
    const f = filtroDe(c.id);
    const contagem = contar(o.leads(), o.ler(), c, o.ctx());
    const de = h("input", { type: "date", value: (f && f.de) || "", "aria-label": "De" });
    const ate = h("input", { type: "date", value: (f && f.ate) || "", "aria-label": "Até" });
    const aplicarIntervalo = h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => {
      if (!de.value && !ate.value) { de.focus(); return; }
      const [a, b] = de.value && ate.value && de.value > ate.value ? [ate.value, de.value] : [de.value || null, ate.value || null];
      o.gravar(definirPeriodo(o.ler(), c.id, "intervalo", a, b)); fecharPop(true);
    } }, "Aplicar");
    const intervalo = h("div", { class: "filtro-intervalo", hidden: !(f && f.periodo === "intervalo") },
      h("label", {}, "De", de), h("label", {}, "Até", ate), aplicarIntervalo);
    const lista = h("div", { class: "filtro-lista", role: "menu" }, ...c.periodos.map(p => {
      const ligado = !!f && f.periodo === p;
      const n = contagem.get(p);
      return h("button", { type: "button", class: "filtro-item filtro-opcao", role: "menuitemradio", "aria-checked": String(ligado), onclick: () => {
        if (p === "intervalo") { intervalo.hidden = false; pop.posicionar(); de.focus(); return; }
        o.gravar(definirPeriodo(o.ler(), c.id, p)); fecharPop(true);
      } }, h("span", { class: "filtro-marca" }, ligado ? h("span", { class: "filtro-bolinha" }) : null), h("span", { class: "filtro-nome", text: PERIODOS[p] }),
        n == null ? null : h("span", { class: "filtro-conta" + (n ? "" : " zero"), text: String(n) }));
    }));
    const pe = h("div", { class: "filtro-pe", hidden: !f }, h("button", { type: "button", class: "text-link", onclick: () => { o.gravar(tirar(o.ler(), c.id)); fecharPop(true); } }, "Tirar filtro"));
    pop.el.replaceChildren(cabeca(pop, c, voltar), lista, intervalo, pe);
    pop.posicionar();
    lista.querySelector(".filtro-item")?.focus();
  }

  /* ---------- a faixa com os chips ---------- */
  function desenharChips(filtros) {
    chips.replaceChildren(...filtros.map(f => {
      const c = campo(f.campo);
      const d = descrever(f, opcoesDe(c));
      const valores = h("button", { type: "button", class: "fc-valores", "aria-haspopup": "dialog", "aria-expanded": "false", title: "Mudar " + c.nome.toLowerCase(), text: d.valores });
      valores.addEventListener("click", e => { e.stopPropagation(); if (aberto && aberto.gatilho === valores) { fecharPop(true); return; } abrirCampo(abrirPop(valores), c, { voltar: false }); });
      return h("div", { class: "filtro-chip" + (f.op === "nao" ? " negado" : "") },
        h("span", { class: "fc-campo" }, icone(c.icone, 13), c.nome),
        d.operador ? h("button", { type: "button", class: "fc-op", title: "Trocar entre “é” e “não é”", onclick: () => o.gravar(alternarOperador(o.ler(), c.id)), text: d.operador }) : null,
        valores,
        h("button", { type: "button", class: "fc-tirar", "aria-label": "Tirar o filtro " + c.nome, title: "Tirar", onclick: () => o.gravar(tirar(o.ler(), c.id)) }, icone("fechar", 13)));
    }));
  }

  return {
    botao, faixa,
    fechar: () => fecharPop(false),
    /** Redesenha os chips (só se os filtros mudaram) e a contagem. */
    atualizar(visiveis, total) {
      const filtros = o.ler();
      const nova = JSON.stringify(filtros);
      if (nova !== chave) { chave = nova; desenharChips(filtros); }
      faixa.hidden = !filtros.length;
      contador.hidden = !filtros.length;
      contador.textContent = String(filtros.length);
      botao.classList.toggle("com-filtro", filtros.length > 0);
      conta.textContent = `${visiveis} de ${total} ${total === 1 ? "lead" : "leads"}`;
      if (aberto && aberto.el.isConnected) aberto.posicionar();
    },
  };
}
