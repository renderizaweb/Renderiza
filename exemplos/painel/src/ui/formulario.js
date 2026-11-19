// Peças de formulário do design system (10-design-system.md): erro no campo, aviso do formulário, botão ocupado,
// mostrar a senha e o aviso de Caps Lock. Trabalham sobre o HTML com as classes .rz-* (src/ui/estilo.css).

import { icone } from "./icones.js";

/** Texto seguro para pôr dentro de HTML. */
export function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/**
 * Mostra o erro embaixo do campo (o <p class="rz-erro-campo"> logo depois dele, ou do .rz-com-acao) e liga o campo a
 * ele pelo aria-describedby. Sem mensagem, limpa.
 */
export function erroNoCampo(entrada, mensagem) {
  const campo = entrada.closest(".rz-campo");
  const alvo = campo && campo.querySelector(".rz-erro-campo");
  if (!alvo) return;
  if (!alvo.id) alvo.id = (entrada.id || entrada.name) + "-erro";
  if (mensagem) {
    alvo.innerHTML = icone("alerta", { tamanho: 16 }) + `<span>${escapar(mensagem)}</span>`;
    alvo.hidden = false;
    entrada.setAttribute("aria-invalid", "true");
    entrada.setAttribute("aria-describedby", alvo.id);
  } else {
    alvo.hidden = true;
    alvo.textContent = "";
    entrada.removeAttribute("aria-invalid");
    entrada.removeAttribute("aria-describedby");
  }
}

/** O aviso do formulário inteiro (.rz-alerta com role="alert"). Sem mensagem, esconde. */
export function avisoDoFormulario(alerta, mensagem, tipo = "erro") {
  if (!mensagem) {
    alerta.hidden = true;
    alerta.textContent = "";
    return;
  }
  alerta.className = `rz-alerta rz-alerta--${tipo}`;
  alerta.innerHTML = icone(tipo === "sucesso" ? "okCirculo" : "alerta", { tamanho: 18 }) + `<span>${escapar(mensagem)}</span>`;
  alerta.hidden = false;
}

/** Liga ou desliga o estado "ocupado" do botão, trocando o texto (ex.: "Entrando…"). */
export function ocupado(botao, sim, textoOcupado) {
  if (sim) {
    botao.dataset.texto = botao.textContent;
    botao.textContent = textoOcupado || botao.textContent;
    botao.setAttribute("aria-busy", "true");
    botao.disabled = true;
  } else {
    botao.textContent = botao.dataset.texto || botao.textContent;
    botao.removeAttribute("aria-busy");
    botao.disabled = false;
  }
}

/** O botão de olho dentro do campo de senha: mostra e esconde, e diz isso para o leitor de tela. */
export function ligarMostrarSenha(botao, entrada) {
  botao.addEventListener("click", () => {
    const mostrar = entrada.type === "password";
    entrada.type = mostrar ? "text" : "password";
    botao.setAttribute("aria-pressed", String(mostrar));
    botao.setAttribute("aria-label", mostrar ? "Esconder senha" : "Mostrar senha");
    botao.innerHTML = icone(mostrar ? "olhoFechado" : "olho");
    entrada.focus({ preventScroll: true });
  });
}

/** Avisa quando o Caps Lock está ligado enquanto a pessoa digita a senha. */
export function ligarAvisoCapsLock(entrada, aviso) {
  const conferir = evento => {
    if (typeof evento.getModifierState === "function") aviso.hidden = !evento.getModifierState("CapsLock");
  };
  entrada.addEventListener("keydown", conferir);
  entrada.addEventListener("keyup", conferir);
  entrada.addEventListener("blur", () => { aviso.hidden = true; });
}
