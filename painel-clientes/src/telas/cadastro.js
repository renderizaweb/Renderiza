// Cadastro (09, onboarding passo 1): nome, e-mail e senha, e só. Abre só com a verificação contra robô (06): o
// Cloudflare Turnstile, quando /api/config entrega a chave pública do site (cadastroAberto). Fechado, a tela leva ao
// WhatsApp da Renderiza. O e-mail de confirmação leva a /comecar, o resto do onboarding (passos 2 a 5).

import { telaDeAcesso, focarTitulo } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { validarEmail, validarSenhaNova, SENHA_MINIMA } from "../sessao.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado, ligarMostrarSenha, ligarAvisoCapsLock } from "../ui/formulario.js";
import { linkDaRenderiza } from "./renderiza.js";

const TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Os erros do cadastro que o adaptador não conhece, em português. */
export function mensagemDoCadastro(e) {
  const original = String((e && e.original && e.original.message) || (e && e.message) || "");
  if (/signups? not allowed|signup is disabled/i.test(original)) return "O cadastro está fechado agora. Fale com a gente pelo WhatsApp.";
  if (/captcha/i.test(original)) return "A verificação contra robô não passou. Tente de novo.";
  return (e && e.message) || "Não deu para cadastrar agora. Tente de novo em alguns minutos.";
}

let carregandoTurnstile = null;
function carregarTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  carregandoTurnstile = carregandoTurnstile || new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TURNSTILE;
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => { carregandoTurnstile = null; reject(new Error("A verificação contra robô não carregou. Confira a internet.")); };
    document.head.appendChild(s);
  });
  return carregandoTurnstile;
}

export async function montar(el, { sessao, banco, ambiente, config, navegar }) {
  if (sessao.logado()) return navegar(TELAS.comecar.caminho, { substituir: true });

  if (!config || !config.cadastroAberto) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      voltar: { href: TELAS.entrar.caminho, texto: "Já tenho conta: entrar" },
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("whatsapp", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Teste 7 dias grátis</h1>
          <p class="rz-texto-2">Por enquanto, a gente abre a sua conta pelo WhatsApp: conte o seu negócio e o painel já vem com os módulos que você quer testar.</p>
        </div>
        <div class="rz-acesso-acoes">
          <a class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" href="${linkDaRenderiza("Oi! Quero testar o Painel Renderiza por 7 dias.")}" target="_blank" rel="noopener">${icone("whatsapp")}Falar com a gente</a>
        </div>`,
    });
    focarTitulo(el);
    return;
  }

  el.innerHTML = telaDeAcesso({
    ambiente,
    rodape: `Já usa o Painel Renderiza? <a href="${TELAS.entrar.caminho}">Entrar</a>`,
    conteudo: `
      <div class="rz-acesso-cabeca">
        <h1 class="rz-titulo-1">Teste 7 dias grátis</h1>
        <p class="rz-texto-2">Sem cartão. Em uns 2 minutos o painel fica com a cara do seu negócio.</p>
      </div>
      <form class="rz-pilha" novalidate>
        <div role="alert" hidden></div>
        <div class="rz-campo">
          <label class="rz-rotulo" for="cadastro-nome">Seu nome</label>
          <input id="cadastro-nome" class="rz-entrada" name="nome" autocomplete="name" enterkeyhint="next" maxlength="120">
          <p class="rz-erro-campo" hidden></p>
        </div>
        <div class="rz-campo">
          <label class="rz-rotulo" for="cadastro-email">E-mail</label>
          <input id="cadastro-email" class="rz-entrada" name="email" type="email" autocomplete="username" inputmode="email"
            autocapitalize="none" spellcheck="false" enterkeyhint="next" placeholder="voce@seunegocio.com.br">
          <p class="rz-erro-campo" hidden></p>
        </div>
        <div class="rz-campo">
          <label class="rz-rotulo" for="cadastro-senha">Senha</label>
          <div class="rz-com-acao">
            <input id="cadastro-senha" class="rz-entrada" name="senha" type="password" autocomplete="new-password" enterkeyhint="done">
            <button class="rz-acao-campo" type="button" data-mostrar-senha aria-label="Mostrar senha" aria-pressed="false">${icone("olho")}</button>
          </div>
          <ul class="rz-requisitos" aria-live="polite"><li data-requisito="tamanho" data-ok="false">Pelo menos ${SENHA_MINIMA} caracteres</li></ul>
          <p class="rz-ajuda" data-caps hidden>${icone("maiusculas", { tamanho: 16 })}O Caps Lock está ligado.</p>
          <p class="rz-erro-campo" hidden></p>
        </div>
        <div class="rz-robo" data-robo></div>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Criar minha conta</button>
      </form>`,
  });

  const form = el.querySelector("form");
  const { nome, email, senha } = form;
  const aviso = form.querySelector("[role=alert]");
  const botao = form.querySelector("button[type=submit]");
  const requisito = form.querySelector("[data-requisito=tamanho]");
  ligarMostrarSenha(form.querySelector("[data-mostrar-senha]"), senha);
  ligarAvisoCapsLock(senha, form.querySelector("[data-caps]"));
  senha.addEventListener("input", () => { requisito.dataset.ok = String(senha.value.length >= SENHA_MINIMA); erroNoCampo(senha, ""); });
  nome.addEventListener("input", () => erroNoCampo(nome, ""));
  email.addEventListener("input", () => erroNoCampo(email, ""));
  nome.focus();

  let token = "";
  let widget = null;
  carregarTurnstile().then(turnstile => {
    if (!form.isConnected) return;
    widget = turnstile.render(form.querySelector("[data-robo]"), {
      sitekey: config.turnstile,
      language: "pt-br",
      theme: "light",
      callback: t => { token = t; avisoDoFormulario(aviso, ""); },
      "expired-callback": () => { token = ""; },
      "error-callback": () => { token = ""; },
    });
  }).catch(e => avisoDoFormulario(aviso, e.message));

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (botao.disabled) return;
    avisoDoFormulario(aviso, "");
    const problemas = [
      [nome, nome.value.trim() ? null : "Digite o seu nome."],
      [email, validarEmail(email.value)],
      [senha, senha.value ? validarSenhaNova(senha.value) : "Crie uma senha."],
    ];
    for (const [campo, problema] of problemas) erroNoCampo(campo, problema);
    const primeiro = problemas.find(([, p]) => p);
    if (primeiro) return primeiro[0].focus();
    if (!token) return avisoDoFormulario(aviso, "Falta a verificação contra robô, logo acima do botão.");

    ocupado(botao, true, "Criando…");
    try {
      const r = await banco.cadastrar(email.value.trim(), senha.value, {
        destino: location.origin + TELAS.comecar.caminho,
        captcha: token,
        dados: { nome: nome.value.trim() },
      });
      // com a confirmação de e-mail ligada (04), não vem sessão: a pessoa abre o link do e-mail
      if (r && r.session) return navegar(TELAS.comecar.caminho, { substituir: true });
      mostrarConfira(email.value.trim());
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(aviso, mensagemDoCadastro(e));
      token = "";
      if (widget !== null && window.turnstile) window.turnstile.reset(widget);
    }
  });

  function mostrarConfira(endereco) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      voltar: { href: TELAS.entrar.caminho, texto: "Ir para entrar" },
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("carta", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Confira o seu e-mail</h1>
          <p class="rz-texto-2">Mandamos um link para <b>${escapar(endereco)}</b>. Abra o link para confirmar o e-mail e montar o painel. Ele vale por 1 hora.</p>
        </div>
        <p class="rz-texto-3">Não chegou em alguns minutos? Olhe no spam ou fale com a gente pelo <a href="${linkDaRenderiza("Oi! Fiz o cadastro no Painel Renderiza e o e-mail não chegou.")}" target="_blank" rel="noopener">WhatsApp</a>.</p>`,
    });
    focarTitulo(el);
  }
}
