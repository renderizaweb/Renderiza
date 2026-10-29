// Entrar: e-mail e senha, e nada além do necessário (09-ux.md, onboarding passo 1; 10-design-system.md).
// - erros no próprio campo, ditos em português; o erro do servidor vai no aviso do formulário;
// - mostrar a senha, aviso de Caps Lock, botão que diz "Entrando…" e não aceita dois toques;
// - "Esqueci a senha" leva o e-mail já digitado; quem ainda não usa encontra o caminho no rodapé.

import { telaDeAcesso } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { validarEmail } from "../sessao.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado, ligarMostrarSenha, ligarAvisoCapsLock } from "../ui/formulario.js";

const WHATSAPP = "https://wa.me/5511988697165?text=" + encodeURIComponent("Oi! Quero conhecer o Painel Renderiza.");

function rodape() {
  if (TELAS.cadastro) return `Ainda não usa o Painel Renderiza? <a href="${TELAS.cadastro.caminho}">Teste 7 dias grátis</a>`;
  return `Ainda não usa o Painel Renderiza? <a href="${WHATSAPP}" target="_blank" rel="noopener">Fale com a gente</a>`;
}

export async function montar(el, { sessao, aoEntrar, ambiente }) {
  const emailInicial = new URLSearchParams(location.search).get("email") || "";
  el.innerHTML = telaDeAcesso({
    ambiente,
    rodape: rodape(),
    conteudo: `
      <div class="rz-acesso-cabeca">
        <h1 class="rz-titulo-1">Entrar</h1>
        <p class="rz-texto-2">Que bom te ver por aqui. Entre para ver o que tem para hoje.</p>
      </div>
      <form class="rz-pilha" novalidate>
        <div role="alert" hidden></div>
        <div class="rz-campo">
          <label class="rz-rotulo" for="entrar-email">E-mail</label>
          <input id="entrar-email" class="rz-entrada" name="email" type="email" autocomplete="username" inputmode="email"
            autocapitalize="none" spellcheck="false" enterkeyhint="next" placeholder="voce@seunegocio.com.br" value="${escapar(emailInicial)}">
          <p class="rz-erro-campo" hidden></p>
        </div>
        <div class="rz-campo">
          <div class="rz-rotulo"><label for="entrar-senha">Senha</label><a href="${TELAS.esqueciSenha.caminho}" data-esqueci>Esqueci a senha</a></div>
          <div class="rz-com-acao">
            <input id="entrar-senha" class="rz-entrada" name="senha" type="password" autocomplete="current-password" enterkeyhint="go">
            <button class="rz-acao-campo" type="button" data-mostrar-senha aria-label="Mostrar senha" aria-pressed="false">${icone("olho")}</button>
          </div>
          <p class="rz-ajuda" data-caps hidden>${icone("maiusculas", { tamanho: 16 })}O Caps Lock está ligado.</p>
          <p class="rz-erro-campo" hidden></p>
        </div>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Entrar</button>
      </form>`,
  });

  const form = el.querySelector("form");
  const { email, senha } = form;
  const aviso = form.querySelector("[role=alert]");
  const botao = form.querySelector("button[type=submit]");
  const esqueci = form.querySelector("[data-esqueci]");
  ligarMostrarSenha(form.querySelector("[data-mostrar-senha]"), senha);
  ligarAvisoCapsLock(senha, form.querySelector("[data-caps]"));

  // O link de "Esqueci a senha" leva o e-mail que já foi digitado.
  const atualizarEsqueci = () => {
    const e = email.value.trim();
    esqueci.href = TELAS.esqueciSenha.caminho + (e ? "?email=" + encodeURIComponent(e) : "");
  };
  email.addEventListener("input", () => { atualizarEsqueci(); erroNoCampo(email, ""); });
  senha.addEventListener("input", () => erroNoCampo(senha, ""));
  atualizarEsqueci();
  (emailInicial ? senha : email).focus();

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (botao.disabled) return;
    avisoDoFormulario(aviso, "");
    const problemaEmail = validarEmail(email.value);
    const problemaSenha = senha.value ? null : "Digite a sua senha.";
    erroNoCampo(email, problemaEmail);
    erroNoCampo(senha, problemaSenha);
    if (problemaEmail || problemaSenha) {
      (problemaEmail ? email : senha).focus();
      return;
    }
    ocupado(botao, true, "Entrando…");
    try {
      await sessao.entrar(email.value, senha.value);
      aoEntrar();
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(aviso, e.message);
      senha.select();
      senha.focus();
    }
  });
}
