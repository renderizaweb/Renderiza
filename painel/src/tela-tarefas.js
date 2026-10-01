// Tela Tarefas: o que fazer, por dia (atrasadas, hoje, amanhã, próximos 7 dias, mais adiante, sem data).
// Tarefa pode ter cliente ou não, e responsável ou não. Marcar como feita guarda o dia: as feitas
// continuam aparecendo nos detalhes do cliente, como histórico.

import * as dados from "./dados.js";
import { h } from "./dom.js";
import { icone } from "./icones.js";
import { abrirJanela, confirmar, aviso } from "./ui.js";
import { salvar, criar, falhou } from "./acoes.js";
import { hojeLocal, somarDias } from "./ritmo.js";
import {
  RESPONSAVEIS, SEM_RESPONSAVEL, agruparTarefas, passaNoResponsavel, feitasRecentes, sugestoesDeTarefa,
  compararTarefas, diaDaConclusao,
} from "./tarefas.js";
import { abrirNovoCliente } from "./tela-clientes.js";

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const dm = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const diaDaSemana = iso => SEMANA[new Date(iso + "T12:00:00").getDay()];
const hora = t => (t.hora ? String(t.hora).slice(0, 5) : "");
const nomeDoCliente = id => { const l = id && dados.buscar("leads", id); return l ? l.empresa || "Sem nome" : ""; };

/* ---------- janela: nova tarefa ou editar ---------- */

/**
 * Sem `tarefa`: cria (com `leadId` e `titulo` opcionais, para já vir preenchida).
 * Com `tarefa`: edita, marca como feita ou exclui.
 */
export function abrirTarefa({ tarefa = null, leadId = null, titulo: tituloInicial = "", dia: diaInicial } = {}) {
  const editando = !!tarefa;
  const hoje = hojeLocal();
  const titulo = h("input", { type: "text", value: editando ? tarefa.titulo : tituloInicial, autocomplete: "off", maxlength: "200", placeholder: "Ex.: Ligar para a ótica e mandar o vídeo", required: true });
  const dia = h("input", { type: "date", value: editando ? tarefa.dia || "" : diaInicial === undefined ? hoje : diaInicial || "", "aria-label": "Dia" });
  const horario = h("input", { type: "time", value: editando ? hora(tarefa) : "", "aria-label": "Hora" });
  const responsavel = h("select", { class: "select-trigger" },
    h("option", { value: "", text: "Sem responsável" }), RESPONSAVEIS.map(r => h("option", { value: r, text: r })));
  responsavel.value = editando ? tarefa.responsavel || "" : "";

  const cliente = h("select", { class: "select-trigger" });
  const preencherClientes = selecionado => {
    const leads = dados.listar("leads").sort((a, b) => String(a.empresa || "").localeCompare(String(b.empresa || ""), "pt-BR", { sensitivity: "base" }));
    cliente.replaceChildren(h("option", { value: "", text: "Sem cliente" }),
      ...leads.map(l => h("option", { value: l.id, text: l.empresa || "Sem nome" })),
      h("option", { value: "_novo", text: "+ Cadastrar cliente novo…" }));
    cliente.value = selecionado || "";
  };
  let clienteAtual = editando ? tarefa.lead_id : leadId;
  preencherClientes(clienteAtual);
  cliente.addEventListener("change", async () => {
    if (cliente.value !== "_novo") { clienteAtual = cliente.value; return; }
    cliente.value = clienteAtual || "";
    const novo = await abrirNovoCliente();
    if (novo) clienteAtual = novo.id;
    preencherClientes(clienteAtual);
  });

  const atalho = (texto, valor) => h("button", { type: "button", class: "atalho-dia", onclick: () => { dia.value = valor; } }, texto);
  const erro = h("p", { class: "erro-form", hidden: true });
  const botao = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, editando ? "Salvar" : [icone("mais", 16), "Criar tarefa"]);
  const acoes = [botao];
  if (editando) {
    acoes.unshift(h("button", { type: "button", class: "btn btn-ghost-destructive", onclick: async () => {
      if (!(await confirmar({ titulo: "Excluir esta tarefa?", descricao: tarefa.titulo, confirmarTexto: "Excluir", destrutivo: true }))) return;
      try { await dados.excluir("tarefas", tarefa.id); aviso("Tarefa excluída."); fechar(); } catch (e) { falhou(e); }
    } }, icone("lixo", 15), "Excluir"));
  }
  const form = h("form", { class: "dialog-form" },
    h("label", {}, "O que fazer", titulo),
    h("div", { class: "linha-form" },
      h("label", {}, "Dia", dia, h("span", { class: "atalhos-dia" }, atalho("Hoje", hoje), atalho("Amanhã", somarDias(hoje, 1)), atalho("Sem data", ""))),
      h("label", {}, "Hora (opcional)", horario),
      h("label", {}, "Responsável", responsavel)),
    h("label", {}, "Cliente (opcional)", cliente),
    erro,
    h("div", { class: "janela-acoes" + (editando ? " separadas" : "") }, acoes));

  const { fechar } = abrirJanela({ titulo: editando ? "Editar tarefa" : "Nova tarefa", conteudo: form });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const texto = titulo.value.trim();
    if (!texto) { erro.textContent = "Escreva o que fazer."; erro.hidden = false; return; }
    const linha = { titulo: texto, dia: dia.value || null, hora: horario.value || null, responsavel: responsavel.value || null, lead_id: cliente.value && cliente.value !== "_novo" ? cliente.value : null };
    botao.disabled = true;
    try {
      if (editando) await salvar("tarefas", tarefa.id, linha);
      else await criar("tarefas", linha);
      aviso(editando ? "Tarefa salva." : "Tarefa criada" + (linha.dia ? " para " + (linha.dia === hoje ? "hoje" : dm(linha.dia)) : "") + ".");
      fechar();
    } catch (err) { /* aviso já mostrado */ } finally { botao.disabled = false; }
  });
}

/* ---------- uma linha de tarefa ---------- */

async function alternarFeita(t) {
  try {
    await salvar("tarefas", t.id, { feita_em: t.feita_em ? null : new Date().toISOString() });
    aviso(t.feita_em ? "Tarefa reaberta." : "Feita.");
  } catch (e) { /* aviso já mostrado */ }
}

/**
 * @param t tarefa
 * @param {{abrirLead?: (id) => void, comDia?: boolean, comCliente?: boolean}} opcoes
 */
export function itemDeTarefa(t, { abrirLead, comDia = false, comCliente = true } = {}) {
  const hoje = hojeLocal();
  const feita = !!t.feita_em;
  const meta = [];
  if (feita) meta.push(h("span", { text: "feita em " + dm(diaDaConclusao(t)) }));
  else if (comDia && t.dia) meta.push(h("span", { class: t.dia < hoje ? "atrasada" : "", text: diaDaSemana(t.dia) + ", " + dm(t.dia) }));
  if (!feita && hora(t)) meta.push(h("span", { text: hora(t) }));
  const nome = comCliente && nomeDoCliente(t.lead_id);
  if (nome) meta.push(abrirLead
    ? h("button", { type: "button", class: "tarefa-cliente", onclick: e => { e.stopPropagation(); abrirLead(t.lead_id); } }, nome)
    : h("span", { text: nome }));
  if (t.responsavel) meta.push(h("span", { class: "chip-resp", "data-pessoa": t.responsavel, text: t.responsavel }));
  const check = h("button", { type: "button", class: "tarefa-check", role: "checkbox", "aria-checked": String(feita), "aria-label": (feita ? "Reabrir: " : "Marcar como feita: ") + t.titulo,
    disabled: !dados.podeEditar() || null, onclick: () => alternarFeita(t) }, feita ? icone("certo", 14) : null);
  return h("li", { class: "tarefa" + (feita ? " feita" : "") },
    check,
    h("div", { class: "tarefa-corpo", role: "button", tabindex: "0", title: "Editar",
      onclick: () => abrirTarefa({ tarefa: t }), onkeydown: e => { if (e.key === "Enter" && e.target === e.currentTarget) abrirTarefa({ tarefa: t }); } },
      h("span", { class: "tarefa-titulo", text: t.titulo }),
      meta.length ? h("span", { class: "tarefa-meta" }, meta) : null));
}

/* ---------- tarefas dentro dos detalhes do cliente ---------- */

/** Em aberto primeiro (por dia); depois as feitas, da mais recente para a mais antiga. */
export function tarefasDoCliente(leadId) {
  const el = h("div", { class: "tarefas-do-cliente" });
  function atualizar() {
    const todas = dados.listar("tarefas").filter(t => t.lead_id === leadId);
    const abertas = todas.filter(t => !t.feita_em).sort(compararTarefas);
    const feitas = todas.filter(t => t.feita_em).sort((a, b) => String(b.feita_em).localeCompare(String(a.feita_em)));
    el.replaceChildren(...[
      abertas.length ? h("ul", { class: "lista-tarefas compacta" }, abertas.map(t => itemDeTarefa(t, { comDia: true, comCliente: false }))) : h("p", { class: "muted", text: "Nenhuma tarefa em aberto." }),
      feitas.length ? h("details", { class: "feitas-cliente" }, h("summary", { text: `Feitas (${feitas.length})` }),
        h("ul", { class: "lista-tarefas compacta" }, feitas.map(t => itemDeTarefa(t, { comCliente: false })))) : null,
    ].filter(Boolean));
  }
  return { el, atualizar };
}

/* ---------- a tela ---------- */

const estado = { responsavel: "" };
try { const s = localStorage.getItem("renderiza:tarefas"); if (s === SEM_RESPONSAVEL || RESPONSAVEIS.includes(s)) estado.responsavel = s; } catch (e) { /* opcional */ }

/**
 * @param {{host: HTMLElement, abrirLead: (id) => void}} ctx
 */
export function criarTelaTarefas(ctx) {
  const abertos = { feitas: false, sugestoes: false };

  function filtros(todas) {
    const itens = [["", "Todos"], ...RESPONSAVEIS.map(r => [r, r]), [SEM_RESPONSAVEL, "Sem responsável"]];
    const escolher = v => { estado.responsavel = v; try { localStorage.setItem("renderiza:tarefas", v); } catch (e) { /* opcional */ } render(); };
    return h("div", { class: "tabs-list rolavel", role: "tablist", "aria-label": "Responsável" }, itens.map(([v, texto]) => {
      const n = todas.filter(t => !t.feita_em && passaNoResponsavel(t, v)).length;
      return h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(estado.responsavel === v), "data-state": estado.responsavel === v ? "active" : "inactive", onclick: () => escolher(v) },
        texto, h("span", { class: "contagem", text: String(n) }));
    }));
  }

  function grupo(g) {
    const comDia = !["hoje", "amanha", "sem_data"].includes(g.id);
    return h("section", { class: "grupo-tarefas grupo-" + g.id, "aria-label": g.nome },
      h("h2", { class: "grupo-titulo" }, g.nome, h("span", { text: String(g.tarefas.length) })),
      h("ul", { class: "lista-tarefas" }, g.tarefas.map(t => itemDeTarefa(t, { abrirLead: ctx.abrirLead, comDia }))));
  }

  function dobra(chave, titulo, conteudo) {
    const d = h("details", { class: "dobra-tarefas" }, h("summary", {}, titulo), conteudo);
    d.open = abertos[chave];
    d.addEventListener("toggle", () => { abertos[chave] = d.open; });
    return d;
  }

  function sugestoes() {
    const lista = sugestoesDeTarefa(dados.listar("leads"), dados.listar("tarefas"));
    if (!lista.length) return null;
    return dobra("sugestoes", `Próximas ações anotadas nos clientes (${lista.length})`, [
      h("p", { class: "nota-dobra", text: "Estão no campo \"Próxima ação\" de cada cliente e ainda não viraram tarefa. Crie só as que fizerem sentido." }),
      h("ul", { class: "lista-sugestoes" }, lista.map(l => h("li", {},
        h("button", { type: "button", class: "sugestao-cliente", onclick: () => ctx.abrirLead(l.id), text: l.empresa || "Sem nome" }),
        h("span", { class: "sugestao-texto", text: l.proxima_acao + (l.followup_em ? " · " + dm(l.followup_em) : "") }),
        h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !dados.podeEditar() || null,
          onclick: () => abrirTarefa({ leadId: l.id, titulo: l.proxima_acao.trim(), dia: l.followup_em && l.followup_em >= hojeLocal() ? l.followup_em : undefined }) }, icone("mais", 14), "Criar tarefa")))),
    ]);
  }

  function render() {
    const hoje = hojeLocal();
    const todas = dados.listar("tarefas");
    const visiveis = todas.filter(t => passaNoResponsavel(t, estado.responsavel));
    const grupos = agruparTarefas(visiveis, hoje);
    const temHoje = grupos.some(g => g.id === "hoje" || g.id === "atrasadas");
    const feitas = feitasRecentes(visiveis, hoje);
    const nova = h("button", { type: "button", class: "btn btn-primary", disabled: !dados.podeEditar() || null, onclick: () => abrirTarefa() }, icone("mais", 16), "Nova tarefa");
    ctx.host.replaceChildren(...[
      h("div", { class: "sheet-toolbar" }, filtros(todas), h("div", { class: "sheet-actions" }, nova)),
      temHoje ? null : h("div", { class: "vazio-lista" }, h("strong", { text: "Nada para hoje." }),
        h("p", { text: grupos.length ? "As próximas tarefas estão logo abaixo." : "Crie a primeira pelo botão Nova tarefa. Pode ser com cliente ou sem." })),
      grupos.map(grupo),
      feitas.length ? dobra("feitas", `Feitas nos últimos 7 dias (${feitas.length})`, h("ul", { class: "lista-tarefas" }, feitas.map(t => itemDeTarefa(t, { abrirLead: ctx.abrirLead })))) : null,
      sugestoes(),
    ].flat().filter(Boolean));
  }

  return { render };
}
