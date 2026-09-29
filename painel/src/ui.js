// Componentes no estilo do Compasso (shadcn): menu suspenso, janela, confirmação e avisos.
import { h } from "./dom.js";
import { icone } from "./icones.js";

/* ---------- menu suspenso ---------- */
let menuAberto = null;

/**
 * Abre um menu abaixo do gatilho.
 * itens: {rotulo}, {separador:true}, {texto, icone, acao, destrutivo, desativado},
 *        {texto, marcado, tipo:"radio"|"check", acao}  (check mantém o menu aberto)
 */
export function abrirMenu(gatilho, itens, { alinhar = "start", classe = "" } = {}) {
  fecharMenu();
  const conteudo = h("div", { class: "menu-conteudo " + classe, role: "menu" });
  const focaveis = [];
  itens.forEach(item => {
    if (item.separador) return conteudo.append(h("div", { class: "menu-separador", role: "separator" }));
    if (item.rotulo) return conteudo.append(h("div", { class: "menu-rotulo", text: item.rotulo }));
    const tipo = item.tipo || "item";
    const el = h("button", {
      type: "button", class: "menu-item" + (item.destrutivo ? " destrutivo" : "") + (tipo !== "item" ? " com-marca" : ""),
      role: tipo === "radio" ? "menuitemradio" : tipo === "check" ? "menuitemcheckbox" : "menuitem",
      "aria-checked": tipo === "item" ? null : String(!!item.marcado), disabled: item.desativado || null,
    });
    if (tipo === "radio") el.append(h("span", { class: "menu-marca" }, item.marcado ? h("span", { class: "menu-bolinha" }) : null));
    if (tipo === "check") el.append(h("span", { class: "menu-marca" }, item.marcado ? icone("certo", 14) : null));
    if (item.icone) el.append(icone(item.icone, 16));
    el.append(h("span", { text: item.texto }));
    el.addEventListener("click", () => {
      if (tipo === "check") {
        item.marcado = !item.marcado;
        el.setAttribute("aria-checked", String(item.marcado));
        el.firstChild.replaceChildren(...(item.marcado ? [icone("certo", 14)] : []));
        item.acao && item.acao(item.marcado);
        return;
      }
      fecharMenu(true);
      item.acao && item.acao();
    });
    focaveis.push(el);
    conteudo.append(el);
  });
  document.body.append(conteudo);
  const posicionar = () => {
    const r = gatilho.getBoundingClientRect();
    const largura = conteudo.offsetWidth, altura = conteudo.offsetHeight;
    let esquerda = alinhar === "end" ? r.right - largura : r.left;
    esquerda = Math.max(8, Math.min(esquerda, window.innerWidth - largura - 8));
    let topo = r.bottom + 4;
    if (topo + altura > window.innerHeight - 8 && r.top - altura - 4 > 8) topo = r.top - altura - 4;
    conteudo.style.left = esquerda + "px";
    conteudo.style.top = topo + "px";
  };
  posicionar();
  gatilho.setAttribute("aria-expanded", "true");
  gatilho.dataset.state = "open";

  const aoTeclar = e => {
    const i = focaveis.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fecharMenu(true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); (focaveis[i + 1] || focaveis[0]).focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (focaveis[i - 1] || focaveis[focaveis.length - 1]).focus(); }
    else if (e.key === "Tab") fecharMenu(false);
  };
  const aoClicarFora = e => { if (!conteudo.contains(e.target) && !gatilho.contains(e.target)) fecharMenu(false); };
  // Se a tabela ou a página rolar, o menu acompanha o botão (como no Compasso).
  let quadro = 0;
  const aoRolar = e => {
    if (conteudo.contains(e.target) || quadro) return;
    quadro = requestAnimationFrame(() => { quadro = 0; if (!document.contains(gatilho)) fecharMenu(false); else posicionar(); });
  };
  document.addEventListener("keydown", aoTeclar, true);
  document.addEventListener("scroll", aoRolar, true);
  window.addEventListener("resize", aoRolar);
  setTimeout(() => document.addEventListener("pointerdown", aoClicarFora, true), 0);
  menuAberto = { conteudo, gatilho, aoTeclar, aoClicarFora, aoRolar };
  const marcado = focaveis.find(f => f.getAttribute("aria-checked") === "true") || focaveis[0];
  if (marcado) marcado.focus();
}

export function fecharMenu(devolverFoco) {
  if (!menuAberto) return;
  const { conteudo, gatilho, aoTeclar, aoClicarFora, aoRolar } = menuAberto;
  menuAberto = null;
  document.removeEventListener("keydown", aoTeclar, true);
  document.removeEventListener("scroll", aoRolar, true);
  window.removeEventListener("resize", aoRolar);
  document.removeEventListener("pointerdown", aoClicarFora, true);
  conteudo.remove();
  gatilho.setAttribute("aria-expanded", "false");
  delete gatilho.dataset.state;
  if (devolverFoco && document.contains(gatilho)) gatilho.focus();
}

/** Botão que abre um menu (aria certo e clique/Enter). `itens` é função para refletir o estado atual. */
export function botaoMenu(conteudoBotao, itens, opcoes = {}) {
  const b = h("button", { type: "button", class: opcoes.classe || "btn btn-outline", "aria-haspopup": "menu", "aria-expanded": "false", "aria-label": opcoes.rotulo || null, title: opcoes.titulo || null }, conteudoBotao);
  b.addEventListener("click", e => {
    e.stopPropagation();
    if (menuAberto && menuAberto.gatilho === b) fecharMenu(true);
    else abrirMenu(b, itens(), opcoes);
  });
  return b;
}

/* ---------- janelas ---------- */
const pilha = [];

/** Abre uma janela no estilo do Compasso. Retorna { fechar, corpo }. */
export function abrirJanela({ titulo, descricao, conteudo = [], larga = false, aoFechar }) {
  const voltar = document.activeElement;
  const fundo = h("div", { class: "janela-fundo" });
  const tituloId = "janela-" + Math.random().toString(36).slice(2);
  const caixa = h("div", { class: "app-dialog" + (larga ? " wide-dialog" : ""), role: "dialog", "aria-modal": "true", "aria-labelledby": tituloId },
    h("button", { type: "button", class: "janela-fechar", "aria-label": "Fechar", onclick: () => fechar() }, icone("fechar", 16)),
    h("div", { class: "janela-cabeca" }, h("h2", { id: tituloId, text: titulo }), descricao ? h("p", { text: descricao }) : null),
    ...[].concat(conteudo));
  fundo.append(caixa);
  document.body.append(fundo);
  document.body.classList.add("travado");
  let fechada = false;
  function fechar(valor) {
    if (fechada) return;
    fechada = true;
    fundo.remove();
    pilha.splice(pilha.indexOf(registro), 1);
    if (!pilha.length && !document.querySelector(".painel:not([hidden])")) document.body.classList.remove("travado");
    if (voltar && document.contains(voltar)) voltar.focus();
    aoFechar && aoFechar(valor);
  }
  const registro = { fechar };
  pilha.push(registro);
  fundo.addEventListener("pointerdown", e => { if (e.target === fundo) fechar(); });
  setTimeout(() => { const f = caixa.querySelector("[autofocus], input:not([type=radio]):not([type=hidden]), textarea, select, .app-dialog button:not(.janela-fechar)"); (f || caixa).focus(); }, 0);
  return { fechar, caixa };
}

export const janelaAberta = () => pilha.length > 0;
export function fecharJanelaDoTopo() { const j = pilha[pilha.length - 1]; if (j) j.fechar(); return !!j; }

/** Confirmação (AlertDialog). Resolve true/false. */
export function confirmar({ titulo, descricao, confirmarTexto = "Confirmar", destrutivo = false }) {
  return new Promise(resolve => {
    let resposta = false;
    const botaoOk = h("button", { type: "button", class: "btn " + (destrutivo ? "btn-destructive" : "btn-primary"), text: confirmarTexto });
    const { fechar } = abrirJanela({
      titulo, descricao,
      conteudo: h("div", { class: "janela-acoes" }, h("button", { type: "button", class: "btn btn-outline", text: "Cancelar", onclick: () => fechar() }), botaoOk),
      aoFechar: () => resolve(resposta),
    });
    botaoOk.addEventListener("click", () => { resposta = true; fechar(); });
    setTimeout(() => botaoOk.focus(), 0);
  });
}

/* ---------- avisos (sonner) ---------- */
let pilhaDeAvisos = null;
export function aviso(texto, tipo = "sucesso") {
  if (!pilhaDeAvisos) { pilhaDeAvisos = h("section", { class: "avisos", "aria-live": "polite", "aria-label": "Avisos" }); document.body.append(pilhaDeAvisos); }
  const el = h("div", { class: "aviso-item " + tipo, role: tipo === "erro" ? "alert" : "status" },
    icone(tipo === "erro" ? "alerta" : "certo", 16), h("span", { text: texto }));
  pilhaDeAvisos.append(el);
  while (pilhaDeAvisos.children.length > 3) pilhaDeAvisos.firstChild.remove();
  setTimeout(() => { el.classList.add("saindo"); setTimeout(() => el.remove(), 200); }, tipo === "erro" ? 6000 : 3200);
}
