// O layout das telas de acesso: entrar, esqueci a senha, nova senha (e, na Missão 2, cadastro e convite).
// No celular, uma coluna só: a marca no topo, o formulário no meio, o rodapé embaixo. No computador, ao lado do
// formulário, o painel da marca com uma prévia do que a pessoa encontra lá dentro (dados fictícios, decorativa).
// Estilo em src/ui/estilo.css (seção 9); regras em docs/painel-clientes/10-design-system.md.

import { icone } from "../ui/icones.js";

const ETIQUETA_DO_AMBIENTE = { preview: "Teste · STG", development: "Local · STG" };

/** A etiqueta que separa o banco de teste da produção ("" na produção). */
export function etiquetaDoAmbiente(ambiente) {
  if (!ambiente || ambiente === "production") return "";
  return ETIQUETA_DO_AMBIENTE[ambiente] || ambiente;
}

const marca = '<span class="rz-marca"><img src="/favicon.svg" alt="" width="32" height="32"><span>Painel Renderiza</span></span>';

// O que tem lá dentro, em três linhas. Dados fictícios, como os de /exemplos (Villa Alecrim).
const PREVIA = `
  <div class="rz-previa" aria-hidden="true">
    <div class="rz-previa-cabeca">Para fazer agora <span>hoje</span></div>
    <ul>
      <li><span class="rz-previa-icone">${icone("conversa")}</span><span><b>Responder o pedido da Juliana</b><small>Casamento · sáb, 14/03 · 120 convidados</small></span><span class="rz-previa-acao">Novo</span></li>
      <li><span class="rz-previa-icone">${icone("carteira")}</span><span><b>Sinal da Ana Beatriz</b><small>R$ 1.900 · vence hoje</small></span><span class="rz-previa-acao">Receber</span></li>
      <li><span class="rz-previa-icone">${icone("contrato")}</span><span><b>Contrato aceito</b><small>Nexa Tecnologia · confraternização</small></span><span class="rz-previa-acao rz-previa-acao--ok">Pronto</span></li>
    </ul>
  </div>`;

/**
 * Monta a tela. `conteudo` é o HTML do formulário (cabeça + form); `rodape`, o HTML embaixo dele;
 * `voltar`, um link opcional no topo ({ href, texto }).
 */
export function telaDeAcesso({ ambiente, conteudo, rodape = "", voltar = null }) {
  const etiqueta = etiquetaDoAmbiente(ambiente);
  return `
    <div class="rz-acesso">
      <aside class="rz-acesso-painel">
        ${marca}
        <div class="rz-chamada">
          <h2>O dia a dia do seu negócio, <span>num lugar só.</span></h2>
          <p>Agenda, pedidos, contratos e pagamentos, no celular e no computador.</p>
        </div>
        ${PREVIA}
        <p class="rz-acesso-creditos">Feito pela Renderiza · sites e sistemas para negócios</p>
      </aside>
      <main class="rz-acesso-form">
        <div class="rz-acesso-topo">
          ${voltar ? `<a class="rz-acesso-voltar" href="${voltar.href}">${icone("voltar", { tamanho: 18 })}${voltar.texto}</a>` : marca}
          ${etiqueta ? `<span class="rz-etiqueta rz-etiqueta--alerta" title="Banco de teste, com dados fictícios">${etiqueta}</span>` : ""}
        </div>
        <div class="rz-acesso-corpo">${conteudo}</div>
        ${rodape ? `<p class="rz-acesso-pe">${rodape}</p>` : ""}
      </main>
    </div>`;
}

/** Leva o foco ao título da tela, para o leitor de tela anunciar onde a pessoa chegou. */
export function focarTitulo(el) {
  const h1 = el.querySelector("h1");
  if (h1) {
    h1.tabIndex = -1;
    h1.focus({ preventScroll: true });
  }
}
