// Os estados de uma tela (09, "Estados"): vazio (diz o que vai aparecer e tem o botão para começar), erro (diz o
// que fazer), carregando (esqueleto só se passar de 1 segundo; antes disso, nada). Estilo: estilo.css, seção 13.

import { icone } from "./icones.js";
import { escapar } from "./formulario.js";

/** Lista vazia que ensina. `acao`: { rotulo, href } ou { rotulo, dado } (vira data-acao="..."). */
export function vazio({ icone: nome = "estrela", titulo, texto = "", acao = null }) {
  const botao = !acao ? "" : acao.href
    ? `<a class="rz-botao rz-botao--primario" href="${escapar(acao.href)}">${escapar(acao.rotulo)}</a>`
    : `<button class="rz-botao rz-botao--primario" type="button" data-acao="${escapar(acao.dado || "")}">${escapar(acao.rotulo)}</button>`;
  return `<div class="rz-vazio">
      <span class="rz-icone-grande">${icone(nome, { tamanho: 24 })}</span>
      <h2 class="rz-titulo-3">${escapar(titulo)}</h2>
      ${texto ? `<p class="rz-texto-2">${escapar(texto)}</p>` : ""}
      ${botao}
    </div>`;
}

/** Algo deu errado: a frase do que fazer e o "Tentar de novo" (data-tentar). */
export function erro(mensagem) {
  return `<div class="rz-alerta rz-alerta--erro rz-estado-erro" role="alert">${icone("alerta", { tamanho: 18 })}
      <span>${escapar(mensagem)}</span><button class="rz-botao rz-botao--pequeno" type="button" data-tentar>Tentar de novo</button></div>`;
}

/** O esqueleto de uma lista enquanto carrega. */
export function esqueleto(linhas = 4) {
  return `<div class="rz-esqueleto" aria-busy="true" aria-label="Carregando">${'<span class="rz-esqueleto-linha"></span>'.repeat(linhas)}</div>`;
}

/**
 * Carrega e desenha com os estados certos: nada no primeiro segundo, depois o esqueleto; erro com "Tentar de novo".
 * `carregar()` devolve os dados; `desenhar(dados)` põe na tela.
 */
export async function comEstados(el, { carregar, desenhar, linhas = 4 }) {
  let timer = setTimeout(() => { el.innerHTML = esqueleto(linhas); }, 1000);
  try {
    const dados = await carregar();
    clearTimeout(timer);
    desenhar(dados);
  } catch (e) {
    clearTimeout(timer);
    el.innerHTML = erro(e.message);
    el.querySelector("[data-tentar]").addEventListener("click", () => comEstados(el, { carregar, desenhar, linhas }));
  }
}
