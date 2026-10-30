// Esqueci a senha: a pessoa digita o e-mail e recebe um link para criar uma senha nova (tela /nova-senha).
// A resposta é sempre a mesma, exista a conta ou não: ninguém descobre por aqui quem tem conta.
// O e-mail sai pelo Supabase; até o Brevo entrar (Missão 1, item 4), só chega para quem é da conta do Supabase.
// Quem entra com usuário (o convite por link, D42) não tem e-mail para receber: pede um link novo à Renderiza.

import { telaDeAcesso, focarTitulo } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { validarEmail } from "../sessao.js";
import { linkDaRenderiza } from "./renderiza.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../ui/formulario.js";

const ESPERA_PARA_REENVIAR = 60; // segundos

export async function montar(el, { sessao, ambiente }) {
  const emailInicial = new URLSearchParams(location.search).get("email") || "";
  const voltar = { href: TELAS.entrar.caminho, texto: "Voltar para entrar" };
  const linkDeVolta = () => location.origin + TELAS.novaSenha.caminho;

  // quem entra com usuário: o link novo vem da Renderiza, pelo WhatsApp
  function semEmail(usuario) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      voltar,
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("cadeado", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Esqueceu a senha?</h1>
          <p class="rz-texto-2">Quem entra com usuário recebe um link novo da Renderiza, pelo WhatsApp, para criar uma senha nova.</p>
        </div>
        <div class="rz-acesso-acoes">
          <a class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" href="${linkDaRenderiza(`Oi! Esqueci a senha do Painel Renderiza (usuário ${usuario}). Pode me mandar um link novo?`)}" target="_blank" rel="noopener">${icone("whatsapp")}Pedir um link novo</a>
        </div>`,
    });
    focarTitulo(el);
  }

  function pedir() {
    if (emailInicial && !emailInicial.includes("@")) return semEmail(emailInicial.trim().toLowerCase());
    el.innerHTML = telaDeAcesso({
      ambiente,
      voltar,
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("cadeado", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Esqueceu a senha?</h1>
          <p class="rz-texto-2">Sem problema. Digite o e-mail da sua conta e a gente manda um link para você criar uma senha nova.</p>
        </div>
        <form class="rz-pilha" novalidate>
          <div role="alert" hidden></div>
          <div class="rz-campo">
            <label class="rz-rotulo" for="esqueci-email">E-mail</label>
            <input id="esqueci-email" class="rz-entrada" name="email" type="email" autocomplete="username" inputmode="email"
              autocapitalize="none" spellcheck="false" enterkeyhint="send" placeholder="voce@seunegocio.com.br" value="${escapar(emailInicial)}">
            <p class="rz-erro-campo" hidden></p>
          </div>
          <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Enviar o link</button>
        </form>`,
    });
    const form = el.querySelector("form");
    const aviso = form.querySelector("[role=alert]");
    const botao = form.querySelector("button[type=submit]");
    form.email.addEventListener("input", () => erroNoCampo(form.email, ""));
    form.email.focus();

    form.addEventListener("submit", async evento => {
      evento.preventDefault();
      if (botao.disabled) return;
      avisoDoFormulario(aviso, "");
      const problema = validarEmail(form.email.value);
      erroNoCampo(form.email, problema);
      if (problema) return form.email.focus();
      ocupado(botao, true, "Enviando…");
      try {
        await sessao.pedirNovaSenha(form.email.value, linkDeVolta());
        enviado(form.email.value.trim());
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(aviso, e.message);
      }
    });
  }

  function enviado(email) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      voltar,
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("carta", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Confira o seu e-mail</h1>
          <p class="rz-texto-2">Se existir uma conta com <b>${escapar(email)}</b>, o link para criar a senha nova chega em alguns minutos.
            Olhe também a caixa de spam.</p>
        </div>
        <div role="status" hidden></div>
        <div class="rz-acesso-acoes">
          <a class="rz-botao rz-botao--escuro rz-botao--grande rz-botao--bloco" href="${TELAS.entrar.caminho}?email=${encodeURIComponent(email)}">Voltar para entrar</a>
          <button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-reenviar disabled>Reenviar em ${ESPERA_PARA_REENVIAR} s</button>
        </div>`,
    });
    focarTitulo(el);
    const reenviar = el.querySelector("[data-reenviar]");
    const status = el.querySelector("[role=status]");
    let restante = ESPERA_PARA_REENVIAR;
    const relogio = setInterval(() => {
      if (!reenviar.isConnected) return clearInterval(relogio);
      restante -= 1;
      if (restante > 0) {
        reenviar.textContent = `Reenviar em ${restante} s`;
      } else {
        clearInterval(relogio);
        reenviar.textContent = "Reenviar o link";
        reenviar.disabled = false;
      }
    }, 1000);
    reenviar.addEventListener("click", async () => {
      ocupado(reenviar, true, "Reenviando…");
      try {
        await sessao.pedirNovaSenha(email, linkDeVolta());
        ocupado(reenviar, false);
        reenviar.disabled = true;
        reenviar.textContent = "Link reenviado";
        avisoDoFormulario(status, "Pronto, mandamos de novo. Pode levar alguns minutos.", "sucesso");
      } catch (e) {
        ocupado(reenviar, false);
        avisoDoFormulario(status, e.message);
      }
    });
  }

  pedir();
}
