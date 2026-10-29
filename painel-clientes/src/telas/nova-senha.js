// Nova senha: é onde o link do e-mail de "Esqueci a senha" chega. O Supabase abre a sessão sozinho pelo link
// (o supabase-js lê o endereço ao carregar); aqui a pessoa escolhe a senha nova e já entra no painel.
// Link vencido, já usado ou aberto sem sessão: a tela diz isso e oferece um link novo.

import { telaDeAcesso, focarTitulo } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { validarSenhaNova, SENHA_MINIMA } from "../sessao.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado, ligarMostrarSenha, ligarAvisoCapsLock } from "../ui/formulario.js";

/** Erro que o Supabase põe no endereço quando o link não vale mais (ex.: #error_code=otp_expired). */
export function erroDoLink(hash, busca) {
  const p = new URLSearchParams(String(hash || "").replace(/^#/, ""));
  const q = new URLSearchParams(String(busca || ""));
  return p.get("error_code") || p.get("error") || q.get("error_code") || q.get("error") || "";
}

export async function montar(el, { sessao, ambiente, navegar }) {
  const problemaNoLink = erroDoLink(location.hash, location.search);
  // Os dados do link não ficam no endereço (nem no histórico).
  if (location.hash || location.search) history.replaceState(history.state, "", location.pathname);

  if (problemaNoLink || !sessao.logado()) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      voltar: { href: TELAS.entrar.caminho, texto: "Voltar para entrar" },
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("relogio", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Esse link não vale mais</h1>
          <p class="rz-texto-2">Ele pode ter vencido ou já ter sido usado. Peça um link novo: leva menos de um minuto.</p>
        </div>
        <div class="rz-acesso-acoes">
          <a class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" href="${TELAS.esqueciSenha.caminho}">Pedir um link novo</a>
        </div>`,
    });
    focarTitulo(el);
    return;
  }

  const email = (sessao.usuario() && sessao.usuario().email) || "";
  el.innerHTML = telaDeAcesso({
    ambiente,
    conteudo: `
      <div class="rz-acesso-cabeca">
        <span class="rz-icone-grande">${icone("cadeado", { tamanho: 24 })}</span>
        <h1 class="rz-titulo-1">Crie uma senha nova</h1>
        <p class="rz-texto-2">Para a conta ${email ? `<b>${escapar(email)}</b>` : "do painel"}. Depois de salvar, você já entra.</p>
      </div>
      <form class="rz-pilha" novalidate>
        <div role="alert" hidden></div>
        <input type="email" name="usuario" autocomplete="username" value="${escapar(email)}" hidden>
        <div class="rz-campo">
          <label class="rz-rotulo" for="nova-senha">Senha nova</label>
          <div class="rz-com-acao">
            <input id="nova-senha" class="rz-entrada" name="senha" type="password" autocomplete="new-password" enterkeyhint="done">
            <button class="rz-acao-campo" type="button" data-mostrar-senha aria-label="Mostrar senha" aria-pressed="false">${icone("olho")}</button>
          </div>
          <ul class="rz-requisitos" aria-live="polite"><li data-requisito="tamanho" data-ok="false">Pelo menos ${SENHA_MINIMA} caracteres</li></ul>
          <p class="rz-ajuda" data-caps hidden>${icone("maiusculas", { tamanho: 16 })}O Caps Lock está ligado.</p>
          <p class="rz-erro-campo" hidden></p>
        </div>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Salvar e entrar</button>
      </form>`,
  });

  const form = el.querySelector("form");
  const aviso = form.querySelector("[role=alert]");
  const botao = form.querySelector("button[type=submit]");
  const tamanho = form.querySelector('[data-requisito="tamanho"]');
  ligarMostrarSenha(form.querySelector("[data-mostrar-senha]"), form.senha);
  ligarAvisoCapsLock(form.senha, form.querySelector("[data-caps]"));
  form.senha.addEventListener("input", () => {
    tamanho.dataset.ok = String(form.senha.value.length >= SENHA_MINIMA);
    erroNoCampo(form.senha, "");
  });
  form.senha.focus();

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (botao.disabled) return;
    avisoDoFormulario(aviso, "");
    const problema = validarSenhaNova(form.senha.value);
    erroNoCampo(form.senha, problema);
    if (problema) return form.senha.focus();
    ocupado(botao, true, "Salvando…");
    try {
      await sessao.definirSenha(form.senha.value);
      navegar("/", { substituir: true });
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(aviso, e.message);
    }
  });
}
