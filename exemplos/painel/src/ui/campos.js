// Campos de formulário no padrão do design system (10, "Campo"): rótulo sempre visível, ajuda e erro embaixo,
// teclado certo (inputmode, autocomplete, enterkeyhint). Devolvem HTML; lerFormulario lê de volta.

import { escapar } from "./formulario.js";

const atributos = obj => Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== false)
  .map(([k, v]) => (v === true ? k : `${k}="${escapar(v)}"`)).join(" ");

function envolver({ id, rotulo, ajuda, opcional }, controle) {
  return `<div class="rz-campo">
      <label class="rz-rotulo" for="${escapar(id)}"><span>${escapar(rotulo)}${opcional ? ' <span class="rz-texto-3">(opcional)</span>' : ""}</span></label>
      ${controle}
      ${ajuda ? `<p class="rz-ajuda">${escapar(ajuda)}</p>` : ""}
      <p class="rz-erro-campo" hidden></p>
    </div>`;
}

/** Campo de texto. `tipo`: text, email, tel, number, date, time…; `teclado`: o inputmode. */
export function campoTexto({ id, nome = id, rotulo, valor = "", tipo = "text", teclado, ajuda, opcional, placeholder, autocompletar = "off", proximo = "next", extra = {} }) {
  return envolver({ id, rotulo, ajuda, opcional }, `<input ${atributos({ id, name: nome, class: "rz-entrada", type: tipo, inputmode: teclado, autocomplete: autocompletar, enterkeyhint: proximo, placeholder, value: valor ?? "", ...extra })}>`);
}

/** Texto longo (observações, "o que inclui": um item por linha). */
export function campoArea({ id, nome = id, rotulo, valor = "", ajuda, opcional, placeholder, linhas = 4 }) {
  return envolver({ id, rotulo, ajuda, opcional }, `<textarea ${atributos({ id, name: nome, class: "rz-entrada", rows: linhas, placeholder })}>${escapar(valor ?? "")}</textarea>`);
}

/** Lista de escolha. `opcoes`: [{ valor, rotulo }]. */
export function campoSelecao({ id, nome = id, rotulo, valor = "", opcoes, ajuda, opcional }) {
  return envolver({ id, rotulo, ajuda, opcional }, `<select ${atributos({ id, name: nome, class: "rz-entrada" })}>
      ${opcoes.map(o => `<option value="${escapar(o.valor)}"${String(o.valor) === String(valor ?? "") ? " selected" : ""}>${escapar(o.rotulo)}</option>`).join("")}
    </select>`);
}

/** Liga/desliga, com a frase do que faz. */
export function interruptor({ nome, rotulo, ajuda = "", marcado = false }) {
  return `<label class="rz-interruptor"><span class="rz-opcao-texto"><b>${escapar(rotulo)}</b>${ajuda ? `<small>${escapar(ajuda)}</small>` : ""}</span>
      <input type="checkbox" role="switch" name="${escapar(nome)}"${marcado ? " checked" : ""}></label>`;
}

/** Botões de escolha única lado a lado ("Sem acesso · Só vê · Edita"). */
export function segmentos({ nome, rotulo, opcoes, valor }) {
  return `<div class="rz-segmentos" role="radiogroup" aria-label="${escapar(rotulo)}">
      ${opcoes.map(o => `<label><input type="radio" name="${escapar(nome)}" value="${escapar(o.valor)}"${String(o.valor) === String(valor) ? " checked" : ""}>${escapar(o.rotulo)}</label>`).join("")}
    </div>`;
}

/** As cores para escolher (pessoas, tipos de festa, ensaios): dados, não estilo da tela. */
export const CORES = ["#2d6a4f", "#2f6fe0", "#b4542f", "#9a6a12", "#7c4ddb", "#d6456b", "#2f6f86", "#8a4a5f", "#58646d"];

export function escolherCor({ nome = "cor", rotulo = "Cor", valor }) {
  const atual = CORES.includes(valor) ? valor : CORES[0];
  return `<fieldset class="rz-campo rz-cores"><legend class="rz-rotulo">${escapar(rotulo)}</legend><div class="rz-cores-lista">
      ${CORES.map(c => `<label style="--cor:${c}"><input type="radio" name="${escapar(nome)}" value="${c}"${c === atual ? " checked" : ""}><span class="rz-oculto">${c}</span></label>`).join("")}
    </div></fieldset>`;
}

/** Os valores do formulário: texto aparado; caixas marcadas viram true/false; vários com o mesmo nome, lista. */
export function lerFormulario(form) {
  const dados = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    if (el.type === "checkbox" && el.getAttribute("role") === "switch") { dados[el.name] = el.checked; continue; }
    if (el.type === "checkbox") { (dados[el.name] ||= []); if (el.checked) dados[el.name].push(el.value); continue; }
    if (el.type === "radio") { if (el.checked) dados[el.name] = el.value; continue; }
    dados[el.name] = typeof el.value === "string" ? el.value.trim() : el.value;
  }
  return dados;
}

/** "um por linha" → lista sem vazios. */
export const linhas = texto => String(texto || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
