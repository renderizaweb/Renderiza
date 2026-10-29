// Convite: é onde o link do e-mail de convite chega (supabase/emails/convite.html). O Supabase abre a sessão pelo
// link; o painel já aceitou o convite ao carregar as contas (public.aceitar_convites). Aqui a pessoa confirma o nome
// e cria a senha, e entra. Link vencido ou já usado: a tela diz isso e mostra o caminho.

import { telaDeAcesso, focarTitulo } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { validarSenhaNova, SENHA_MINIMA } from "../sessao.js";
import { erroDoLink } from "./nova-senha.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado, ligarMostrarSenha, ligarAvisoCapsLock } from "../ui/formulario.js";

export async function montar(el, { sessao, banco, ambiente, navegar }) {
  const problemaNoLink = erroDoLink(location.hash, location.search);
  if (location.hash || location.search) history.replaceState(history.state, "", location.pathname);

  if (problemaNoLink || !sessao.logado()) {
    el.innerHTML = telaDeAcesso({
      ambiente,
      voltar: { href: TELAS.entrar.caminho, texto: "Ir para entrar" },
      conteudo: `
        <div class="rz-acesso-cabeca">
          <span class="rz-icone-grande">${icone("relogio", { tamanho: 24 })}</span>
          <h1 class="rz-titulo-1">Esse convite não vale mais</h1>
          <p class="rz-texto-2">O link do e-mail vale por 1 hora e só uma vez. Peça a quem convidou para mandar de novo (em Equipe e acessos, “Reenviar”).</p>
        </div>
        <div class="rz-acesso-acoes">
          <a class="rz-botao rz-botao--grande rz-botao--bloco" href="${TELAS.entrar.caminho}">Já tenho senha: entrar</a>
        </div>`,
    });
    focarTitulo(el);
    return;
  }

  const usuario = sessao.usuario();
  const contas = sessao.contas();
  // a conta do convite é a da pessoa mais nova: é nela que o painel abre
  const pessoa = await banco.resultado(banco.tabela("pessoas").select("nome, conta_id").eq("usuario_id", usuario.id).order("criado_em", { ascending: false }).limit(1)).then(l => l[0]).catch(() => null);
  const daConta = pessoa && contas.find(c => c.conta_id === pessoa.conta_id);
  if (daConta) sessao.escolherConta(daConta.conta_id);
  const nomeDaConta = daConta ? daConta.nome : "";
  el.innerHTML = telaDeAcesso({
    ambiente,
    conteudo: `
      <div class="rz-acesso-cabeca">
        <span class="rz-icone-grande">${icone("equipe", { tamanho: 24 })}</span>
        <h1 class="rz-titulo-1">${nomeDaConta ? `Boas-vindas à equipe ${escapar(nomeDaConta)}` : "Boas-vindas ao Painel Renderiza"}</h1>
        <p class="rz-texto-2">Falta só criar a sua senha, para entrar pelo celular ou pelo computador com <b>${escapar(usuario.email)}</b>.</p>
      </div>
      <form class="rz-pilha" novalidate>
        <div role="alert" hidden></div>
        ${!daConta && sessao.erroDoConvite() ? `<div class="rz-alerta rz-alerta--aviso" role="status">${icone("alerta", { tamanho: 20 })}<p>Você ainda não entrou na equipe. ${escapar(sessao.erroDoConvite())} Avise quem convidou; a senha que você criar já vale.</p></div>` : ""}
        <input type="email" name="usuario" autocomplete="username" value="${escapar(usuario.email)}" hidden>
        <div class="rz-campo">
          <label class="rz-rotulo" for="convite-nome">Seu nome</label>
          <input id="convite-nome" class="rz-entrada" name="nome" autocomplete="name" enterkeyhint="next" value="${escapar((pessoa && pessoa.nome) || (usuario.user_metadata && usuario.user_metadata.nome) || "")}">
          <p class="rz-erro-campo" hidden></p>
        </div>
        <div class="rz-campo">
          <label class="rz-rotulo" for="convite-senha">Senha</label>
          <div class="rz-com-acao">
            <input id="convite-senha" class="rz-entrada" name="senha" type="password" autocomplete="new-password" enterkeyhint="done">
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
  const { nome, senha } = form;
  const aviso = form.querySelector("[role=alert]");
  const botao = form.querySelector("button[type=submit]");
  const requisito = form.querySelector("[data-requisito=tamanho]");
  ligarMostrarSenha(form.querySelector("[data-mostrar-senha]"), senha);
  ligarAvisoCapsLock(senha, form.querySelector("[data-caps]"));
  senha.addEventListener("input", () => { requisito.dataset.ok = String(senha.value.length >= SENHA_MINIMA); erroNoCampo(senha, ""); });
  nome.addEventListener("input", () => erroNoCampo(nome, ""));
  (nome.value ? senha : nome).focus();

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (botao.disabled) return;
    avisoDoFormulario(aviso, "");
    const problemaNome = nome.value.trim() ? null : "Digite o seu nome.";
    const problemaSenha = validarSenhaNova(senha.value);
    erroNoCampo(nome, problemaNome);
    erroNoCampo(senha, problemaSenha);
    if (problemaNome || problemaSenha) return (problemaNome ? nome : senha).focus();
    ocupado(botao, true, "Salvando…");
    try {
      await sessao.definirSenha(senha.value);
      // o nome vale em todas as contas da pessoa (é a mesma pessoa)
      await banco.resultado(banco.tabela("pessoas").update({ nome: nome.value.trim() }).eq("usuario_id", usuario.id)).catch(() => null);
      await sessao.carregarContas();
      navegar("/", { substituir: true });
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(aviso, e.message);
    }
  });
}
