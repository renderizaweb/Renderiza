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

// O que tem lá dentro, em três linhas. Dados fictícios, como os de /exemplos (Villa Alecrim e Estúdio Ciranda).
// No onboarding, a prévia e a frase mudam com o nicho que a pessoa escolhe (painelDaMarca).
const PREVIAS = {
  eventos: [
    ["conversa", "Responder o pedido da Juliana", "Casamento · sáb, 14/03 · 120 convidados", "Novo"],
    ["carteira", "Sinal da Ana Beatriz", "R$ 1.900 · vence hoje", "Receber"],
    ["contrato", "Contrato aceito", "Nexa Tecnologia · confraternização", "Pronto"],
  ],
  fotografia: [
    ["conversa", "Responder o pedido da Carol", "Newborn · ter, 17/03 · 9h", "Novo"],
    ["carteira", "Sinal da Mariana", "R$ 250 · ensaio gestante · vence hoje", "Receber"],
    ["imagem", "Fotos entregues", "Ensaio de família · Souza", "Pronto"],
  ],
};
const CHAMADAS = {
  eventos: ["As festas do seu espaço,", "num lugar só.", "Datas, visitas, pedidos, contratos e pagamentos, no celular e no computador."],
  fotografia: ["Os ensaios do seu estúdio,", "num lugar só.", "Agenda, pedidos, contratos, sinais e entregas, no celular e no computador."],
  "": ["O dia a dia do seu negócio,", "num lugar só.", "Agenda, pedidos, contratos e pagamentos, no celular e no computador."],
};

/** O conteúdo do painel da marca (só no computador): a frase e a prévia, do nicho quando já se sabe. */
export function painelDaMarca(nicho = "") {
  const [antes, destaque, texto] = CHAMADAS[nicho] || CHAMADAS[""];
  const linhas = PREVIAS[nicho] || PREVIAS.eventos;
  return `
    <div class="rz-chamada">
      <h2>${antes} <span>${destaque}</span></h2>
      <p>${texto}</p>
    </div>
    <div class="rz-previa" aria-hidden="true">
      <div class="rz-previa-cabeca">Para fazer agora <span>hoje</span></div>
      <ul>${linhas.map(([ic, titulo, sub, acao], i) => `<li><span class="rz-previa-icone">${icone(ic)}</span><span><b>${titulo}</b><small>${sub}</small></span><span class="rz-previa-acao${i === 2 ? " rz-previa-acao--ok" : ""}">${acao}</span></li>`).join("")}</ul>
    </div>`;
}

/** A classe do tema do nicho (cor de destaque e do painel da marca; 10, "Tema do nicho"). */
export const temaDoNicho = nicho => (["eventos", "fotografia"].includes(nicho) ? `rz-tema-${nicho}` : "");

/**
 * Monta a tela. `conteudo` é o HTML do formulário (cabeça + form); `rodape`, o HTML embaixo dele;
 * `voltar`, um link opcional no topo ({ href, texto }); `nicho`, o tema e o painel da marca do nicho.
 */
export function telaDeAcesso({ ambiente, conteudo, rodape = "", voltar = null, nicho = "" }) {
  const etiqueta = etiquetaDoAmbiente(ambiente);
  const tema = temaDoNicho(nicho);
  return `
    <div class="rz-acesso${tema ? " " + tema : ""}">
      <aside class="rz-acesso-painel">
        ${marca}
        <div class="rz-painel-da-marca" data-painel-da-marca>${painelDaMarca(nicho)}</div>
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
