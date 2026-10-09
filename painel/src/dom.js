// Cria elementos: h("button", { class: "btn", onclick: fn }, "Texto")
export function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "value") el.value = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat(Infinity)) if (f != null && f !== false) el.append(f);
  return el;
}

/** Opções de um <select>: [valor, texto] vira <option>; {grupo, opcoes: [[valor, texto]…]} vira <optgroup>. */
export const opcoesDoSelect = lista => lista.map(x => (Array.isArray(x)
  ? h("option", { value: x[0], text: x[1] })
  : h("optgroup", { label: x.grupo }, x.opcoes.map(([v, t]) => h("option", { value: v, text: t })))));
/** As mesmas opções numa lista só, [valor, texto, grupo?] (para procurar um valor pelo texto). */
export const opcoesPlanas = lista => lista.flatMap(x => (Array.isArray(x) ? [x] : x.opcoes.map(([v, t]) => [v, t, x.grupo])));
