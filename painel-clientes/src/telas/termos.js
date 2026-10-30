// O aceite dos termos (Missão 5B; 06: "no primeiro acesso, a pessoa aceita a versão vigente dos termos; mudou a
// versão, aceita de novo"). Depois de entrar e antes do painel (ou do Admin), quem ainda não aceitou a versão de
// agora vê esta tela: os links para os termos (/termos) e a política (/privacidade), "Li e aceito" e Continuar. O
// aceite fica em termos_aceites (a pessoa, a versão, quando e o aparelho); vale para todas as contas dela.

import { icone } from "../ui/icones.js";
import { avisoDoFormulario, ocupado } from "../ui/formulario.js";
import { telaDeAcesso, focarTitulo } from "./acesso.js";

/** A versão de agora: a mesma de publico/termos/ e publico/privacidade/ (data-versao). Mudou o texto de verdade, muda aqui. */
export const VERSAO_DOS_TERMOS = "2026-10-31";
const dataDaVersao = v => `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}`;

/** Já aceitou a versão de agora? E alguma antes (para dizer "mudaram")? */
export async function situacaoDoAceite(banco) {
  const linhas = await banco.resultado(banco.tabela("termos_aceites").select("versao").order("aceito_em", { ascending: false }).limit(20));
  return { aceitou: linhas.some(l => l.versao === VERSAO_DOS_TERMOS), antes: linhas.length > 0 };
}

/** A tela do aceite. `aoAceitar()` segue para o painel. */
export function montar(raiz, { banco, ambiente, antes = false, aoAceitar }) {
  raiz.innerHTML = telaDeAcesso({
    ambiente,
    rodape: `Não quer aceitar agora? <button class="rz-link" type="button" data-sair>Sair</button>`,
    conteudo: `
      <div class="rz-acesso-cabeca">
        <span class="rz-icone-grande">${icone("contrato", { tamanho: 24 })}</span>
        <h1 class="rz-titulo-1">${antes ? "Os termos mudaram" : "Antes de começar"}</h1>
        <p class="rz-texto-2">${antes ? `Atualizamos os termos de uso e a política de privacidade do Painel Renderiza em ${dataDaVersao(VERSAO_DOS_TERMOS)}.` : "Leia como o Painel Renderiza funciona e como cuida dos seus dados e dos dados dos seus clientes."}</p>
      </div>
      <form class="rz-pilha" novalidate data-aceite-termos>
        <div role="alert" hidden></div>
        <ul class="rz-lista-acoes">
          <li><a href="/termos" target="_blank" rel="noopener">${icone("contrato")}<span>Termos de uso</span>${icone("seta", { tamanho: 18 })}</a></li>
          <li><a href="/privacidade" target="_blank" rel="noopener">${icone("cadeado")}<span>Política de privacidade</span>${icone("seta", { tamanho: 18 })}</a></li>
        </ul>
        <label class="rz-aceite-termos"><input type="checkbox" name="li"><span>Li e aceito os termos de uso, e li a política de privacidade.</span></label>
        <p class="rz-erro-campo" data-erro hidden></p>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Continuar</button>
      </form>`,
  });
  focarTitulo(raiz);
  const form = raiz.querySelector("[data-aceite-termos]");
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const erro = form.querySelector("[data-erro]");
    if (!form.li.checked) { erro.textContent = "Marque que leu e aceita para continuar."; erro.hidden = false; form.li.focus(); return; }
    erro.hidden = true;
    const botao = form.querySelector("[type=submit]");
    ocupado(botao, true, "Registrando…");
    try {
      const aparelho = typeof navigator !== "undefined" ? String(navigator.userAgent || "").slice(0, 300) : null;
      await banco.resultado(banco.tabela("termos_aceites").upsert({ versao: VERSAO_DOS_TERMOS, aparelho }, { onConflict: "usuario_id,versao", ignoreDuplicates: true }));
      aoAceitar();
    } catch (e) { ocupado(botao, false); avisoDoFormulario(form.querySelector("[role=alert]"), e.message); }
  });
}
