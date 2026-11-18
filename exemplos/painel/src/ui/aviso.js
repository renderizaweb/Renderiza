// O aviso embaixo da tela (09, "Desfazer"): diz o que aconteceu e, quando dá, oferece "Desfazer" por 7 segundos,
// em vez de perguntar "tem certeza?" antes. Um aviso por vez; o novo troca o anterior. Lido pelo leitor de tela.
// Estilo em src/ui/estilo.css (seção 12).

import { icone } from "./icones.js";
import { escapar } from "./formulario.js";

let atual = null;

function regiao() {
  let r = document.querySelector(".rz-avisos");
  if (!r) {
    r = document.createElement("div");
    r.className = "rz-avisos";
    r.setAttribute("aria-live", "polite");
    document.body.append(r);
  }
  return r;
}

/**
 * Mostra o aviso. `desfazer`: função chamada se a pessoa tocar em "Desfazer". `tipo`: "sucesso" ou "erro".
 * Devolve uma função que fecha o aviso.
 */
export function avisar(texto, { tipo = "sucesso", desfazer = null, duracao = desfazer ? 7000 : 4000 } = {}) {
  if (atual) atual();
  const el = document.createElement("div");
  el.className = `rz-aviso rz-aviso--${tipo}`;
  el.innerHTML = `${icone(tipo === "erro" ? "alerta" : "okCirculo", { tamanho: 20 })}<span>${escapar(texto)}</span>
    ${desfazer ? `<button class="rz-aviso-acao" type="button">${icone("desfazer", { tamanho: 16 })}Desfazer</button>` : ""}`;
  regiao().append(el);
  let timer = setTimeout(fechar, duracao);
  function fechar() {
    clearTimeout(timer);
    el.remove();
    if (atual === fechar) atual = null;
  }
  if (desfazer) {
    el.querySelector("button").addEventListener("click", () => { fechar(); desfazer(); });
    // quem está lendo ou com o mouse em cima não perde o "Desfazer"
    el.addEventListener("pointerenter", () => clearTimeout(timer));
    el.addEventListener("pointerleave", () => { timer = setTimeout(fechar, 3000); });
  }
  atual = fechar;
  return fechar;
}
