// O e-mail para recuperar a senha (Missão 7; D42, o e-mail opcional): a gaveta de quem entra com usuário (o convite
// por link). Em dois passos: o e-mail (chega um código de 6 números) e o código. Quem grava é a função do servidor
// "email-de-recuperacao"; o painel só pergunta como está (meu_email_de_recuperacao, com o e-mail escondido).
// Abre pelo menu (Mais) e pelos primeiros passos do Início.

import { abrirGaveta } from "./gaveta.js";
import { icone } from "./icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "./formulario.js";
import { campoTexto } from "./campos.js";

/** Abre a gaveta. `aoMudar`: chamado quando o e-mail é confirmado ou tirado. */
export async function abrirEmailDeRecuperacao({ banco, avisar, aoMudar = () => {} }) {
  const atual = await banco.rpc("meu_email_de_recuperacao").catch(() => null);
  const g = abrirGaveta({
    titulo: "E-mail para recuperar a senha",
    subtitulo: "Você entra com o seu usuário. Com um e-mail confirmado, se esquecer a senha, o link chega nele na hora.",
    corpo: `<div class="rz-pilha" data-corpo></div>`,
  });
  const corpo = g.corpo.querySelector("[data-corpo]");
  let email = "";

  function passoEmail() {
    corpo.innerHTML = `
      ${atual && atual.confirmado ? `<p class="rz-alerta rz-alerta--sucesso">${icone("ok", { tamanho: 18 })}<span>Confirmado: <b>${escapar(atual.email)}</b>. Para trocar, ponha o novo abaixo.</span></p>` : ""}
      <form class="rz-pilha" novalidate data-email>
        <div role="alert" hidden></div>
        ${campoTexto({ id: "rec-email", nome: "email", rotulo: atual && atual.confirmado ? "E-mail novo" : "Seu e-mail", tipo: "email", teclado: "email", autocompletar: "email", placeholder: "voce@gmail.com", extra: { autocapitalize: "none", spellcheck: "false", maxlength: 254 } })}
        <button class="rz-botao rz-botao--primario rz-botao--bloco" type="submit">Mandar o código</button>
        ${atual && atual.confirmado ? `<button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-tirar>Tirar o e-mail</button>` : ""}
      </form>`;
    const form = corpo.querySelector("form");
    form.email.focus();
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const botao = form.querySelector("[type=submit]");
      const valor = form.email.value.trim();
      erroNoCampo(form.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor) ? "" : "Confira o e-mail.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor)) return form.email.focus();
      ocupado(botao, true, "Mandando…");
      try {
        await banco.funcao("email-de-recuperacao", { acao: "pedir", email: valor });
        email = valor.toLowerCase();
        passoCodigo();
      } catch (er) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), er.message);
      }
    });
    form.querySelector("[data-tirar]")?.addEventListener("click", async e => {
      ocupado(e.currentTarget, true, "Tirando…");
      try {
        await banco.funcao("email-de-recuperacao", { acao: "tirar" });
        g.fechar();
        avisar("E-mail tirado. Se esquecer a senha, peça um link novo a quem te convidou.");
        aoMudar();
      } catch (er) { avisar(er.message, { tipo: "erro" }); }
    });
  }

  function passoCodigo() {
    corpo.innerHTML = `
      <p class="rz-texto-2">Mandamos um código de 6 números para <b>${escapar(email)}</b>. Olhe também a caixa de spam.</p>
      <form class="rz-pilha" novalidate data-codigo>
        <div role="alert" hidden></div>
        ${campoTexto({ id: "rec-codigo", nome: "codigo", rotulo: "Código", teclado: "numeric", autocompletar: "one-time-code", placeholder: "000000", extra: { maxlength: 7 } })}
        <button class="rz-botao rz-botao--primario rz-botao--bloco" type="submit">Confirmar</button>
        <button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-voltar>Usar outro e-mail</button>
      </form>`;
    const form = corpo.querySelector("form");
    form.codigo.focus();
    form.querySelector("[data-voltar]").addEventListener("click", passoEmail);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const botao = form.querySelector("[type=submit]");
      ocupado(botao, true, "Confirmando…");
      try {
        await banco.funcao("email-de-recuperacao", { acao: "confirmar", codigo: form.codigo.value });
        g.fechar();
        avisar(`Pronto: se esquecer a senha, o link chega em ${email}.`);
        aoMudar();
      } catch (er) {
        ocupado(botao, false);
        erroNoCampo(form.codigo, er.message);
        form.codigo.focus();
      }
    });
  }

  passoEmail();
  return g;
}
