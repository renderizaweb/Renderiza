// Filtros (09): chips com os mais usados, um escolhido por vez; o resto fica num "Filtrar" do próprio módulo.
// Estilo: estilo.css, seção 13.

import { escapar } from "./formulario.js";

/** Os chips. `opcoes`: [{ valor, rotulo, quantos? }]; `ativo`: o valor escolhido. */
export function chips({ rotulo, opcoes, ativo }) {
  return `<div class="rz-chips" role="group" aria-label="${escapar(rotulo)}">
      ${opcoes.map(o => `<button type="button" class="rz-chip" data-chip="${escapar(o.valor)}" aria-pressed="${o.valor === ativo}">${escapar(o.rotulo)}${o.quantos != null ? ` <span class="rz-chip-n">${o.quantos}</span>` : ""}</button>`).join("")}
    </div>`;
}

/** Liga os chips dentro de `el`: marca o tocado e chama `aoMudar(valor)`. */
export function ligarChips(el, aoMudar) {
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-chip]");
    if (!b || !el.contains(b)) return;
    b.parentElement.querySelectorAll("[data-chip]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    aoMudar(b.dataset.chip);
  });
}
