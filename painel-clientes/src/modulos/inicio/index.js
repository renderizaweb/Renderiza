// Módulo Início: o resto é da Missão 3, bloco F ("Para fazer agora", números de cada módulo, "o que a equipe fez").
// Os primeiros passos (Missão 2) moram em primeiros-passos.js e aparecem no topo, só para o dono.

import { montarPrimeirosPassos } from "./primeiros-passos.js";

export async function montar(el, contexto) {
  el.innerHTML = `<header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Início</h1></div></header>
    <div data-primeiros-passos></div>
    <p class="rz-texto-2">Este módulo ainda está vazio.</p>`;
  try {
    await montarPrimeirosPassos(el.querySelector("[data-primeiros-passos]"), contexto);
  } catch (e) {
    el.querySelector("[data-primeiros-passos]").innerHTML = ""; // os primeiros passos são ajuda: sem eles, o Início segue
  }
}
