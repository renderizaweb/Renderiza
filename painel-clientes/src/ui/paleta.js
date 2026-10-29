// A paleta (Ctrl+K, "/" ou a lupa; 09): o lugar único para achar e fazer. Acha cliente (nome ou WhatsApp), lugar
// do painel e ação rápida ("registrar pagamento"), com os clientes abertos por último primeiro. Setas e Enter.

import { abrirFolha } from "./gaveta.js";
import { icone } from "./icones.js";
import { escapar } from "./formulario.js";
import { telefone } from "./formatos.js";
import { buscarClientes, abrirCliente } from "./para-quem.js";

const tirarAcento = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Outras palavras que levam ao mesmo lugar ou ação.
const SINONIMOS = {
  atendimento: "pedidos orcamento orçamentos leads", agenda: "festas datas ensaios calendario visitas", clientes: "fichas pessoas entregas",
  financeiro: "pagamentos parcelas dinheiro receber sinal", contratos: "aceite assinatura", servicos: "pacotes ensaios precos preços adicionais horarios",
  equipe: "pessoas acessos convidar", configuracoes: "negocio logo whatsapp", "novo-pagamento": "recebi baixa pago", "novo-pedido": "orcamento anotar",
};

/** Os itens fixos (lugares e ações) que batem com o texto. Função pura, testada em test/pecas.test.mjs. */
export function filtrarItens(itens, texto) {
  const t = tirarAcento(texto).trim();
  if (!t) return itens;
  const palavras = t.split(/\s+/);
  return itens.filter(i => {
    const alvo = tirarAcento(`${i.rotulo} ${SINONIMOS[i.id] || ""}`);
    return palavras.every(p => alvo.includes(p));
  });
}

const CHAVE_RECENTES = conta => "painel-renderiza:recentes:" + conta;
function lerRecentes(conta) {
  try { return JSON.parse(localStorage.getItem(CHAVE_RECENTES(conta)) || "[]"); } catch (e) { return []; }
}
function guardarRecente(conta, c) {
  try {
    const lista = [{ id: c.id, nome: c.nome, whatsapp: c.whatsapp, email: c.email, instagram: c.instagram }, ...lerRecentes(conta).filter(x => x.id !== c.id)].slice(0, 5);
    localStorage.setItem(CHAVE_RECENTES(conta), JSON.stringify(lista));
  } catch (e) { /* sem armazenamento */ }
}

export async function abrirPaleta({ sessao, banco, navegar }) {
  const conta = sessao.conta();
  if (!conta || !conta.liberada) return;
  const [{ itensDoMenu, acoesRapidas }] = await Promise.all([import("../telas/casca.js")]);
  const pode = (m, n) => sessao.pode(m, n);
  const fixos = [
    ...acoesRapidas(conta, pode).filter(a => a.caminho).map(a => ({ id: a.id, rotulo: a.rotulo, icone: a.icone, caminho: a.caminho, grupo: "Fazer" })),
    ...itensDoMenu(conta).filter(i => i.estado === "livre").map(i => ({ id: i.id, rotulo: i.nome, icone: i.icone, caminho: i.caminho, grupo: "Ir para" })),
  ];
  let clientes = [];
  const folha = abrirFolha({
    rotulo: "Buscar",
    corpo: `<div class="rz-paleta-busca">${icone("buscar")}<input class="rz-entrada" type="search" placeholder="Cliente, lugar ou o que fazer" aria-label="Buscar" autocomplete="off" autofocus></div>
      <div data-lista aria-live="polite"></div>`,
  });
  folha.el.classList.add("rz-janela--paleta");
  const entrada = folha.corpo.querySelector("input");
  const lista = folha.corpo.querySelector("[data-lista]");

  const grupo = (titulo, itens) => !itens.length ? "" : `<p class="rz-texto-3">${escapar(titulo)}</p><ul class="rz-lista-acoes">${itens.join("")}</ul>`;
  const desenhar = () => {
    const texto = entrada.value;
    const achados = filtrarItens(fixos, texto);
    const recentes = !texto.trim() ? lerRecentes(conta.conta_id) : [];
    const doCliente = c => `<li><button type="button" data-cliente="${escapar(c.id)}">${icone("clientes")}<span>${escapar(c.nome)}${c.whatsapp ? ` <small class="rz-texto-3">${escapar(telefone(c.whatsapp))}</small>` : ""}</span></button></li>`;
    lista.innerHTML = grupo("Clientes abertos por último", recentes.map(doCliente))
      + grupo("Clientes", clientes.map(doCliente))
      + grupo("Fazer", achados.filter(i => i.grupo === "Fazer").map(i => `<li><button type="button" data-ir="${escapar(i.caminho)}">${icone(i.icone)}<span>${escapar(i.rotulo)}</span></button></li>`))
      + grupo("Ir para", achados.filter(i => i.grupo === "Ir para").map(i => `<li><button type="button" data-ir="${escapar(i.caminho)}">${icone(i.icone)}<span>${escapar(i.rotulo)}</span></button></li>`))
      || `<p class="rz-texto-2">Nada com “${escapar(texto)}”.</p>`;
  };

  let vez = 0, espera = null;
  entrada.addEventListener("input", () => {
    desenhar();
    clearTimeout(espera);
    espera = setTimeout(async () => {
      const minha = ++vez;
      const texto = entrada.value.trim();
      if (texto.length < 2 || !banco) { clientes = []; return desenhar(); }
      try {
        const r = await buscarClientes(banco, conta, texto, 6);
        if (minha === vez) { clientes = r; desenhar(); }
      } catch (e) { /* a busca de clientes falhou: ficam os lugares e as ações */ }
    }, 200);
  });
  // Setas andam pelos resultados; Enter escolhe o primeiro.
  folha.el.addEventListener("keydown", e => {
    const botoes = [...lista.querySelectorAll("button")];
    const i = botoes.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (botoes[i + 1] || botoes[0])?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (i <= 0) entrada.focus(); else botoes[i - 1].focus(); }
    else if (e.key === "Enter" && document.activeElement === entrada) { e.preventDefault(); botoes[0]?.click(); }
  });
  lista.addEventListener("click", e => {
    const ir = e.target.closest("[data-ir]");
    if (ir) { folha.fechar(); navegar(ir.dataset.ir); return; }
    const b = e.target.closest("[data-cliente]");
    if (!b) return;
    const c = clientes.find(x => x.id === b.dataset.cliente) || lerRecentes(conta.conta_id).find(x => x.id === b.dataset.cliente);
    folha.fechar();
    if (!c) return;
    guardarRecente(conta.conta_id, c);
    abrirCliente({ cliente: c, pode, navegar });
  });
  desenhar();
}
