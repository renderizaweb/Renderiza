// Tela Clientes: todos os registros, no funil ou fora dele, separados pela situação
// (em venda, ganhos/pós-venda, perdas, fora do funil). Clicar abre os detalhes, com o histórico.
// Também o cadastro rápido de cliente, usado aqui e na janela de tarefa.

import * as dados from "./dados.js";
import { h } from "./dom.js";
import { icone } from "./icones.js";
import { abrirJanela, aviso } from "./ui.js";
import { criar } from "./acoes.js";
import { novoLead, rotuloEtapa, nomeDoResultado } from "./modelo.js";
import { chaveDoNome } from "./ritmo.js";
import { SITUACOES, situacaoDoCliente, proximaTarefa } from "./tarefas.js";

const dm = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const comparar = (a, b) => String(a.empresa || "").localeCompare(String(b.empresa || ""), "pt-BR", { sensitivity: "base", numeric: true });
const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const nomeDaSituacao = l => {
  const s = situacaoDoCliente(l);
  return s === "em_venda" ? rotuloEtapa(l) : s === "fora" ? "Fora do funil" : nomeDoResultado(s);
};

const ONDE = [
  ["fora", "Fora do funil", "Só na lista de clientes, para relacionamento. Não entra no Pipeline."],
  ["funil", "No funil", "Entra no Pipeline em \"Leads a trabalhar\"."],
  ["ganho", "Já é cliente", "Entra como ganho, para o pós-venda."],
];

/** Cadastro rápido. Resolve com o cliente criado, ou null se fechar sem salvar. */
export function abrirNovoCliente({ nome: nomeInicial = "" } = {}) {
  return new Promise(resolve => {
    let criado = null;
    const nome = h("input", { type: "text", value: nomeInicial, autocomplete: "off", maxlength: "120", placeholder: "Ex.: Ótica Bela Vista", required: true });
    const whatsapp = h("input", { type: "tel", autocomplete: "off", placeholder: "(11) 9…" });
    const opcoes = ONDE.map(([valor, titulo, ajuda], i) => h("label", { class: "tipo-opcao" },
      h("input", { type: "radio", name: "onde", value: valor, checked: i === 0 || null }),
      h("span", {}, h("strong", { text: titulo }), h("small", { text: ajuda }))));
    const erro = h("p", { class: "erro-form", hidden: true });
    const botao = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, icone("mais", 16), "Cadastrar cliente");
    const form = h("form", { class: "dialog-form" },
      h("label", {}, "Nome", nome),
      h("label", {}, "WhatsApp (opcional)", whatsapp),
      h("div", { class: "tipo-opcoes tres", role: "radiogroup", "aria-label": "Onde fica" }, opcoes),
      erro, botao);
    const { fechar } = abrirJanela({ titulo: "Novo cliente", descricao: "O resto (Instagram, cidade, observações) dá para preencher depois, nos detalhes.", conteudo: form, aoFechar: () => resolve(criado) });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const empresa = nome.value.trim();
      if (!empresa) { erro.textContent = "Escreva o nome."; erro.hidden = false; return; }
      const igual = dados.listar("leads").find(l => chaveDoNome(l.empresa) === chaveDoNome(empresa));
      if (igual) { erro.textContent = `Já existe "${igual.empresa}" (${nomeDaSituacao(igual)}). Procure na lista de clientes.`; erro.hidden = false; return; }
      erro.hidden = true;
      const onde = form.querySelector("input[name=onde]:checked").value;
      const posicao = Math.max(0, ...dados.listar("leads").map(l => (typeof l.posicao === "number" ? l.posicao : Date.parse(l.criado_em) / 1000 || 0))) + 1000;
      const linha = { ...novoLead(empresa), whatsapp: whatsapp.value.trim(), posicao };
      if (onde === "fora") linha.fora_do_funil = true;
      if (onde === "ganho") Object.assign(linha, { etapa: "finalizado", resultado: "ganho" });
      botao.disabled = true;
      try {
        criado = await criar("leads", linha);
        aviso(empresa + " cadastrado.");
        fechar();
      } catch (err) { /* aviso já mostrado */ } finally { botao.disabled = false; }
    });
  });
}

const estado = { filtro: "" };
try { const s = localStorage.getItem("renderiza:clientes"); if (s === "" || SITUACOES.some(([id]) => id === s)) estado.filtro = s || ""; } catch (e) { /* opcional */ }

/**
 * @param {{host: HTMLElement, abrirLead: (id) => void, busca: () => string}} ctx
 */
export function criarTelaClientes(ctx) {
  // Barra fixa: o painel põe o campo de busca em buscaSlot (ao lado dos filtros); só filtros, ações e lista são redesenhados.
  const abasSlot = h("div"), buscaSlot = h("div", { class: "busca-slot" }), acoesSlot = h("div", { class: "sheet-actions" }), listaSlot = h("div");
  const barra = h("div", { class: "sheet-toolbar" }, h("div", { class: "barra-esquerda" }, abasSlot, buscaSlot), acoesSlot);
  function linha(l, tarefas) {
    const s = situacaoDoCliente(l);
    const prox = proximaTarefa(tarefas, l.id);
    const local = [l.cidade, l.segmento].map(x => String(x || "").trim()).filter(Boolean).join(" · ");
    return h("li", {},
      h("button", { type: "button", class: "cliente-linha", onclick: () => ctx.abrirLead(l.id) },
        h("span", { class: "cliente-nome" }, h("strong", { text: l.empresa || "Sem nome" }), local ? h("small", { text: local }) : null),
        h("span", { class: "situacao " + s, text: nomeDaSituacao(l) }),
        h("span", { class: "cliente-proxima" + (prox ? "" : " vazia") },
          prox ? [icone("calendario", 13), h("span", { text: (prox.dia ? dm(prox.dia) + " · " : "") + prox.titulo })] : "Sem tarefa")));
  }

  function render() {
    const leads = dados.listar("leads"), tarefas = dados.listar("tarefas");
    const contagem = Object.fromEntries(SITUACOES.map(([id]) => [id, 0]));
    leads.forEach(l => contagem[situacaoDoCliente(l)]++);
    const q = semAcento(ctx.busca().trim());
    const lista = leads
      .filter(l => !estado.filtro || situacaoDoCliente(l) === estado.filtro)
      .filter(l => !q || [l.empresa, l.whatsapp, l.instagram, l.cidade].some(v => v && semAcento(v).includes(q)))
      .sort(comparar);
    const escolher = v => { estado.filtro = v; try { localStorage.setItem("renderiza:clientes", v); } catch (e) { /* opcional */ } render(); };
    const filtros = h("div", { class: "tabs-list rolavel", role: "tablist", "aria-label": "Situação" },
      [["", "Todos", leads.length], ...SITUACOES.map(([id, nome]) => [id, nome, contagem[id]])].map(([v, texto, n]) =>
        h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(estado.filtro === v), "data-state": estado.filtro === v ? "active" : "inactive", onclick: () => escolher(v) },
          texto, h("span", { class: "contagem", text: String(n) }))));
    const novo = h("button", { type: "button", class: "btn btn-primary", disabled: !dados.podeEditar() || null,
      onclick: async () => { const c = await abrirNovoCliente({ nome: ctx.busca().trim() }); if (c) ctx.abrirLead(c.id); } }, icone("mais", 16), "Novo cliente");
    const vazio = h("div", { class: "vazio-lista" },
      h("strong", { text: q ? "Nenhum cliente com esse nome." : leads.length ? "Nenhum cliente nesta situação." : "Nenhum cliente ainda." }),
      h("p", { text: "Cadastre pelo botão Novo cliente: dentro do funil ou fora dele." }));
    abasSlot.replaceChildren(filtros);
    acoesSlot.replaceChildren(novo);
    listaSlot.replaceChildren(lista.length ? h("ul", { class: "lista-clientes" }, lista.map(l => linha(l, tarefas))) : vazio);
    if (ctx.host.firstChild !== barra) ctx.host.replaceChildren(barra, listaSlot);
  }

  return { render, buscaSlot };
}
