// Boas-vindas: onde o convite por link do WhatsApp chega (/boas-vindas/<código>; Missão 7, bloco B; D42). A pessoa
// vê o nome do negócio, o usuário que a Renderiza criou, e só cria a senha: um campo. A função aceitar-convite cria o
// login (ou troca a senha de quem já tinha o usuário e pediu um link novo); o painel entra em seguida e segue o
// caminho de sempre (os termos, a conta). Link usado, vencido ou que não existe: a tela diz e mostra o caminho.
// O tema e o painel da marca são do nicho do negócio (como no onboarding, D33).

import { telaDeAcesso, focarTitulo } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { validarSenhaNova, SENHA_MINIMA } from "../sessao.js";
import { linkDaRenderiza } from "./renderiza.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado, ligarMostrarSenha, ligarAvisoCapsLock } from "../ui/formulario.js";

/** O código do endereço (/boas-vindas/<código>). */
export const codigoDoEndereco = caminho => String(caminho || "").split("?")[0].split("/").filter(Boolean)[1] || "";

/** O que a tela diz quando o link não serve. `r` é a resposta de publico_convite (null: o link não existe). */
export function telaDoLinkQueNaoVale(r) {
  if (r && r.motivo === "usado") {
    return {
      icone: "cadeado", titulo: "Este link já foi usado",
      texto: `Entre com o usuário <b>${escapar(r.usuario)}</b> e a senha que você criou.`,
      principal: { href: `${TELAS.entrar.caminho}?email=${encodeURIComponent(r.usuario)}`, texto: "Entrar" },
      secundario: { href: linkDaRenderiza(`Oi! Esqueci a senha do Painel Renderiza (usuário ${r.usuario}). Pode me mandar um link novo?`), texto: "Esqueci a senha: pedir um link novo" },
    };
  }
  if (r && r.motivo === "vencido") {
    return {
      icone: "relogio", titulo: "Este link venceu",
      texto: "O link do convite vale por 7 dias. Peça um novo à Renderiza: é rapidinho.",
      principal: { href: linkDaRenderiza(`Oi! O meu link do Painel Renderiza (${r.negocio || "convite"}) venceu. Pode me mandar um novo?`), texto: "Pedir um link novo", whatsapp: true },
    };
  }
  return {
    icone: "alerta", titulo: "Este link não vale",
    texto: "Confira se o link chegou inteiro, ou peça um novo a quem mandou.",
    principal: { href: linkDaRenderiza("Oi! O meu link do Painel Renderiza não abriu. Pode me mandar de novo?"), texto: "Pedir um link novo", whatsapp: true },
  };
}

export async function montar(el, { sessao, banco, ambiente, navegar }) {
  const codigo = codigoDoEndereco(location.pathname);
  let convite;
  try {
    convite = await banco.rpc("publico_convite", { p_codigo: codigo });
  } catch (e) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("alerta", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Não deu para abrir o convite</h1>
          <p class="rz-texto-2">Confira a internet e tente de novo.</p>
        </div>
        <div class="rz-acesso-acoes"><button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="button" data-tentar>Tentar de novo</button></div>`,
    });
    el.querySelector("[data-tentar]").addEventListener("click", () => montar(el, { sessao, banco, ambiente, navegar }));
    focarTitulo(el);
    return;
  }

  if (!convite || !convite.valido) {
    const t = telaDoLinkQueNaoVale(convite);
    el.innerHTML = telaDeAcesso({
      ambiente,
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone(t.icone, { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">${t.titulo}</h1>
          <p class="rz-texto-2">${t.texto}</p>
        </div>
        <div class="rz-acesso-acoes">
          <a class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" href="${t.principal.href}"${t.principal.whatsapp ? ' target="_blank" rel="noopener"' : ""}>${t.principal.whatsapp ? icone("whatsapp") : ""}${t.principal.texto}</a>
          ${t.secundario ? `<a class="rz-botao rz-botao--grande rz-botao--bloco" href="${t.secundario.href}" target="_blank" rel="noopener">${t.secundario.texto}</a>` : ""}
        </div>`,
    });
    focarTitulo(el);
    return;
  }

  const de_novo = !!convite.ja_tem_acesso;
  el.innerHTML = telaDeAcesso({
    ambiente,
    nicho: convite.nicho,
    rodape: `Já tem a senha? <a href="${TELAS.entrar.caminho}?email=${encodeURIComponent(convite.usuario)}">Entrar</a>`,
    conteudo: `
      <div class="rz-acesso-cabeca">
        <span class="rz-icone-grande">${icone("estrela", { tamanho: 24 })}</span>
        <h1 class="rz-titulo-1">${de_novo ? "Olá de novo" : "Olá"}, ${escapar(convite.negocio)}!</h1>
        <p class="rz-texto-2">${de_novo ? "Crie uma senha nova para entrar no seu painel." : "Você recebeu um convite para o Painel Renderiza. Crie uma senha e a gente já começa a montar o seu painel."}</p>
      </div>
      <form class="rz-pilha" novalidate data-boas-vindas>
        <div role="alert" hidden></div>
        <p class="rz-usuario-do-convite"><span class="rz-texto-3">Seu usuário</span><b>${escapar(convite.usuario)}</b></p>
        <input type="text" name="usuario" autocomplete="username" value="${escapar(convite.usuario)}" hidden>
        <div class="rz-campo">
          <label class="rz-rotulo" for="bv-senha">${de_novo ? "Senha nova" : "Crie a sua senha"}</label>
          <div class="rz-com-acao">
            <input id="bv-senha" class="rz-entrada" name="senha" type="password" autocomplete="new-password" enterkeyhint="go">
            <button class="rz-acao-campo" type="button" data-mostrar-senha aria-label="Mostrar senha" aria-pressed="false">${icone("olho")}</button>
          </div>
          <ul class="rz-requisitos" aria-live="polite"><li data-requisito="tamanho" data-ok="false">Pelo menos ${SENHA_MINIMA} caracteres</li></ul>
          <p class="rz-ajuda" data-caps hidden>${icone("maiusculas", { tamanho: 16 })}O Caps Lock está ligado.</p>
          <p class="rz-erro-campo" hidden></p>
        </div>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">${de_novo ? "Salvar e entrar" : "Criar a senha e entrar"}</button>
        <p class="rz-texto-3">Depois você entra com o usuário <b>${escapar(convite.usuario)}</b> e essa senha, no celular ou no computador.</p>
      </form>`,
  });
  focarTitulo(el);

  const form = el.querySelector("form");
  const { senha } = form;
  const aviso = form.querySelector("[role=alert]");
  const botao = form.querySelector("button[type=submit]");
  const requisito = form.querySelector("[data-requisito=tamanho]");
  ligarMostrarSenha(form.querySelector("[data-mostrar-senha]"), senha);
  ligarAvisoCapsLock(senha, form.querySelector("[data-caps]"));
  senha.addEventListener("input", () => { requisito.dataset.ok = String(senha.value.length >= SENHA_MINIMA); erroNoCampo(senha, ""); });
  senha.focus();

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (botao.disabled) return;
    avisoDoFormulario(aviso, "");
    const problema = senha.value ? validarSenhaNova(senha.value) : "Crie uma senha.";
    erroNoCampo(senha, problema);
    if (problema) return senha.focus();
    ocupado(botao, true, "Preparando o seu painel…");
    try {
      const r = await banco.funcao("aceitar-convite", { codigo, senha: senha.value });
      if (sessao.logado()) await sessao.sair(); // outra pessoa entrada neste aparelho
      await sessao.entrar(r.email, senha.value);
      await sessao.carregarContas();
      navegar("/", { substituir: true });
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(aviso, e.message);
    }
  });
}
