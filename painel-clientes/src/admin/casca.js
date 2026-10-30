// A casca do Admin (Missão 5A): o menu com as partes (src/admin/index.js), sem conta escolhida, porque quem é da
// Renderiza pode não ser de nenhuma conta. No computador, o menu lateral; no celular, a barra de baixo. As peças e
// as classes são as da casca do painel (src/telas/casca.js, estilo.css seção 10).

import { AREAS_ADMIN } from "./index.js";
import { icone } from "../ui/icones.js";
import { escapar } from "../ui/formulario.js";
import { iniciais } from "../ui/formatos.js";

/** Desenha a casca do Admin e devolve o lugar do conteúdo. */
export function montarCascaAdmin(raiz, { rota, sessao, ambiente }) {
  const usuario = sessao.usuario() || {};
  const temConta = sessao.contas().length > 0;
  const etiqueta = ambiente && ambiente !== "production" ? `<span class="rz-etiqueta rz-etiqueta--alerta" title="Banco de teste, com dados fictícios">STG</span>` : "";
  const atual = a => (rota.id === a.id ? ' aria-current="page"' : "");
  raiz.innerHTML = `
    <div class="rz-app rz-app--admin">
      <aside class="rz-lateral" aria-label="Menu do Admin">
        <a class="rz-lateral-conta" href="/admin">
          <span class="rz-conta-sinal" aria-hidden="true">${icone("admin", { tamanho: 18 })}</span>
          <span><b>Admin</b><small>Renderiza</small></span>
        </a>
        <nav class="rz-menu" aria-label="Partes do Admin">
          ${AREAS_ADMIN.map(a => `<a href="/admin/${a.id}" class="rz-menu-item"${atual(a)}>${icone(a.icone)}<span>${escapar(a.nome)}</span></a>`).join("")}
          ${temConta ? `<p class="rz-menu-grupo">Painel</p><a href="/" class="rz-menu-item">${icone("voltar")}<span>Voltar ao painel</span></a>` : ""}
        </nav>
        <div class="rz-lateral-pe">
          <div class="rz-quem">
            <span class="rz-avatar" aria-hidden="true">${escapar(iniciais(usuario.email || "R"))}</span>
            <span class="rz-quem-nome"><b>Equipe Renderiza</b><small>${escapar(usuario.email || "")}</small></span>
            <button class="rz-botao rz-botao--fantasma rz-quem-sair" type="button" data-sair aria-label="Sair">${icone("sair")}</button>
          </div>
        </div>
      </aside>
      <div class="rz-area">
        <header class="rz-topo">
          <a class="rz-topo-conta" href="/admin"><span class="rz-conta-sinal" aria-hidden="true">${icone("admin", { tamanho: 16 })}</span><b>Admin</b></a>
          ${etiqueta}
          ${temConta ? `<a class="rz-botao rz-botao--fantasma rz-admin-voltar" href="/">${icone("voltar", { tamanho: 18 })}<span>Painel</span></a>` : ""}
          <button class="rz-botao rz-botao--fantasma rz-admin-sair" type="button" data-sair aria-label="Sair">${icone("sair")}</button>
        </header>
        <main id="conteudo" class="rz-principal" tabindex="-1"></main>
      </div>
      <nav class="rz-barra" aria-label="Partes do Admin">
        ${AREAS_ADMIN.map(a => `<a href="/admin/${a.id}"${atual(a)}>${icone(a.icone, { tamanho: 22 })}<span>${escapar(a.curto || a.nome)}</span></a>`).join("")}
      </nav>
    </div>`;
  return raiz.querySelector("#conteudo");
}
