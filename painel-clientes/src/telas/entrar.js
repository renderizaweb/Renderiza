// Tela de login mínima (Missão 1): e-mail e senha, só isso (09-ux.md, onboarding, passo 1).
// Cadastro, convite e "esqueci a senha" chegam com a Missão 2.

const ETIQUETA_DO_AMBIENTE = { preview: "STG", development: "local · STG" };

export async function montar(el, { sessao, aoEntrar, ambiente }) {
  const etiqueta = ETIQUETA_DO_AMBIENTE[ambiente] || (ambiente && ambiente !== "production" ? ambiente : "");
  el.innerHTML = `
    <main class="entrar">
      <form class="entrar-cartao" novalidate>
        <div class="entrar-marca">
          <img src="/favicon.svg" alt="" width="40" height="40">
          <span>Painel Renderiza</span>
          ${etiqueta ? `<span class="etiqueta-ambiente" title="Banco de teste, com dados fictícios">${etiqueta}</span>` : ""}
        </div>
        <h1 class="titulo">Entrar</h1>
        <label class="campo">
          <span>E-mail</span>
          <input name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" required>
        </label>
        <label class="campo">
          <span>Senha</span>
          <input name="senha" type="password" autocomplete="current-password" required>
        </label>
        <p class="entrar-erro" role="alert" aria-live="assertive" hidden></p>
        <button class="botao botao-primario" type="submit">Entrar</button>
      </form>
    </main>`;

  const form = el.querySelector("form");
  const erro = el.querySelector(".entrar-erro");
  const botao = form.querySelector("button");
  form.email.focus();

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    erro.hidden = true;
    botao.disabled = true;
    botao.textContent = "Entrando…";
    try {
      await sessao.entrar(form.email.value, form.senha.value);
      aoEntrar();
    } catch (e) {
      erro.textContent = e.message;
      erro.hidden = false;
      botao.disabled = false;
      botao.textContent = "Entrar";
      (form.email.value.trim() ? form.senha : form.email).focus();
    }
  });
}
