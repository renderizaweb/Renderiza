// Gaveta e folha (09, "Detalhes" e "+ ações rápidas"): um <dialog> do navegador, que já prende o foco, fecha no Esc
// e devolve o foco a quem abriu.
// - gaveta: os detalhes de algo. No computador, sai da direita; no celular, ocupa a tela, com as ações fixas embaixo.
// - folha: uma lista curta de ações ou de lugares. No celular, sobe de baixo; no computador, uma janela pequena.
// Estilo em src/ui/estilo.css (seção 12).

import { icone } from "./icones.js";
import { escapar } from "./formulario.js";

function abrir(tipo, { titulo, subtitulo = "", corpo = "", rodape = "", rotulo, aoFechar, foco = "campo" } = {}) {
  const quemAbriu = document.activeElement;
  const janela = document.createElement("dialog");
  janela.className = `rz-janela rz-janela--${tipo}`;
  janela.setAttribute("aria-label", rotulo || titulo || "");
  janela.innerHTML = `
    <div class="rz-janela-cabeca">
      <div class="rz-janela-titulos">
        ${titulo ? `<h2 class="rz-titulo-2">${escapar(titulo)}</h2>` : ""}
        ${subtitulo ? `<p class="rz-texto-2">${subtitulo}</p>` : ""}
      </div>
      <button class="rz-botao rz-botao--fantasma rz-janela-fechar" type="button" data-fechar aria-label="Fechar">${icone("fechar")}</button>
    </div>
    <div class="rz-janela-corpo">${corpo}</div>
    ${rodape ? `<div class="rz-janela-pe">${rodape}</div>` : ""}`;
  document.body.append(janela);

  let fechada = false;
  const fechar = valor => {
    if (fechada) return;
    fechada = true;
    janela.close();
    janela.remove();
    if (quemAbriu && typeof quemAbriu.focus === "function" && document.contains(quemAbriu)) quemAbriu.focus({ preventScroll: true });
    if (aoFechar) aoFechar(valor);
  };
  janela.addEventListener("cancel", e => { e.preventDefault(); fechar(); });
  janela.addEventListener("click", e => {
    if (e.target === janela || e.target.closest("[data-fechar]")) fechar();
  });
  janela.showModal();
  // foco "campo": o primeiro campo (formulários); "fechar": o botão de fechar (detalhes, para não abrir o teclado)
  const primeiro = foco === "fechar" ? null : janela.querySelector("[autofocus], .rz-janela-corpo input, .rz-janela-corpo select, .rz-janela-corpo textarea");
  (primeiro || janela.querySelector("[data-fechar]")).focus({ preventScroll: true });
  return { el: janela, corpo: janela.querySelector(".rz-janela-corpo"), pe: janela.querySelector(".rz-janela-pe"), fechar };
}

/** Os detalhes de algo (cliente, festa, pessoa da equipe). `rodape`: as ações principais. */
export function abrirGaveta(opcoes) {
  return abrir("gaveta", opcoes);
}

/** Uma lista curta de ações ou lugares (o "+", o "Mais", trocar de conta). */
export function abrirFolha(opcoes) {
  return abrir("folha", opcoes);
}

/** Pergunta antes do que não volta atrás (09: só para isso). Resolve true/false. */
export function confirmar({ titulo, texto, sim = "Sim", nao = "Voltar", perigo = false }) {
  return new Promise(resolver => {
    const j = abrir("folha", {
      titulo,
      corpo: `<p class="rz-texto-2">${texto}</p>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>${escapar(nao)}</button>
        <button class="rz-botao ${perigo ? "rz-botao--perigo" : "rz-botao--primario"}" type="button" data-sim>${escapar(sim)}</button>`,
      aoFechar: v => resolver(v === true),
    });
    j.el.querySelector("[data-sim]").addEventListener("click", () => j.fechar(true));
  });
}
