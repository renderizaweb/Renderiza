// Tela Projetos (28/11/2026, pedido do Kaue): o trabalho depois da venda (e qualquer outro trabalho da Renderiza),
// no jeito do Linear. Três vistas:
//   Issues    o quadro Backlog → To-do → In progress → Validation → Done, com filtros de projeto, ciclo e
//             responsável; arrastar muda o status (e a ordem); o ícone do status também muda, sem arrastar.
//   Projetos  a lista (em andamento e concluídos), com o cliente e o progresso; abrir um mostra as issues dele.
//   Ciclos    o atual, o próximo e os que passaram, com o que foi feito e o que ficou (as issues e os pontos).
// Projeto tem cliente (um lead) ou não. Issue e projeto têm documentação em Markdown (markdown.js): a issue com o
// modelo (Contexto, O que fazer, Pronto quando, Registro), a checklist que se marca e o registro que se anota na hora.
// Entre o painel e as sessões, o pacote .md (projetos.js): "Importar issues" e "Copiar para uma sessão" no projeto;
// "Copiar" na issue. Guia: docs/projetos-e-issues.md.
// Tudo passa por dados.js; as contas estão em projetos.js, os ciclos em tags.js.

import * as dados from "./dados.js";
import { h, opcoesDoSelect } from "./dom.js";
import { icone } from "./icones.js";
import { abrirJanela, confirmar, aviso, abrirMenu } from "./ui.js";
import { salvar, criar, falhou } from "./acoes.js";
import { hojeLocal } from "./ritmo.js";
import { RESPONSAVEIS } from "./tarefas.js";
import { nomeDoCiclo, classeDaTag, tagDoCiclo, cicloDoDia } from "./tags.js";
import {
  STATUS, ESTIMATIVAS, SITUACOES_DO_PROJETO, SEM, nomeDoStatus, codigoDaIssue, patchDeStatus, progresso, compararIssues,
  posicaoEntre, posicaoNoFim, filtrarIssues, separarDone, ciclosDaTela, resumoDoCiclo, ciclosParaEscolher, diasParaAcabar,
  ordenarProjetos, projetoAtrasado, issuesPorStatus, novaIssue, nomeDaSituacao, DIAS_DO_DONE,
  issueParaPacote, pacoteDoProjeto, lerPacote, planoDeImportacao,
} from "./projetos.js";
import { markdownParaHtml, alternarTarefa, tarefasDoMarkdown, anotarNoRegistro, MODELO_DA_ISSUE } from "./markdown.js";

const dm = iso => (iso ? String(iso).slice(8, 10) + "/" + String(iso).slice(5, 7) : "");
const diaDoMomento = v => { const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };
const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const porNome = (a, b) => String(a.nome || a.empresa || "").localeCompare(String(b.nome || b.empresa || ""), "pt-BR", { sensitivity: "base", numeric: true });
const nomeDoCliente = id => { const l = id && dados.buscar("leads", id); return l ? l.empresa || "Sem nome" : ""; };
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const faltaBanco = () => dados.tabelaFaltando("projetos") || dados.tabelaFaltando("issues");

/* ---------- ícone do status (como o do Linear: tracejado, vazio, meio, três quartos, feito) ---------- */
const CORES_DO_STATUS = { backlog: "#94a19b", todo: "#6f7d77", in_progress: "#c98d06", validation: "#4566c9", done: "#24775c" };
export function iconeDoStatus(id, tamanho = 15) {
  const cor = CORES_DO_STATUS[id] || CORES_DO_STATUS.backlog;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 14 14");
  svg.setAttribute("width", tamanho);
  svg.setAttribute("height", tamanho);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "icone-status status-" + id);
  const anel = `<circle cx="7" cy="7" r="5.6" fill="none" stroke="${cor}" stroke-width="1.6"`;
  svg.innerHTML = id === "done"
    ? `<circle cx="7" cy="7" r="6.4" fill="${cor}"/><path d="M4.3 7.2l1.8 1.8 3.6-3.7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
    : id === "backlog" ? anel + ` stroke-dasharray="2.1 1.9"/>`
    : id === "in_progress" ? anel + `/><path d="M7 3.6A3.4 3.4 0 0 1 7 10.4Z" fill="${cor}"/>`
    : id === "validation" ? anel + `/><path d="M7 7V3.6A3.4 3.4 0 1 1 3.6 7Z" fill="${cor}"/>`
    : anel + "/>";
  return svg;
}

/* ---------- gravações ---------- */
async function mudarStatus(issue, para, extra = {}) {
  const patch = { ...patchDeStatus(issue, para, hojeLocal()), ...extra };
  if (!Object.keys(patch).length) return;
  try {
    await salvar("issues", issue.id, patch);
    if (patch.status) aviso(`${codigoDaIssue(issue) || "Issue"} em ${nomeDoStatus(para)}.`);
  } catch (e) { /* aviso já mostrado */ }
}

/** O ícone do status vira um botão: o menu troca o status sem abrir a issue (bom no celular, onde não dá para arrastar). */
function botaoDeStatus(issue) {
  return h("button", { type: "button", class: "status-btn", title: nomeDoStatus(issue.status) + " · mudar o status",
    "aria-label": `Status: ${nomeDoStatus(issue.status)}. Mudar`, disabled: !dados.podeEditar() || null,
    onclick: e => {
      e.stopPropagation();
      abrirMenu(e.currentTarget, [{ rotulo: "Status" }, ...STATUS.map(s => ({ texto: s.nome, tipo: "radio", marcado: s.id === issue.status, acao: () => mudarStatus(issue, s.id) }))]);
    } }, iconeDoStatus(issue.status));
}

const chipDoCiclo = n => (n ? h("span", { class: "chip-tag " + classeDaTag(tagDoCiclo(n)), title: nomeDoCiclo(n), text: "C" + n }) : null);
const chipDePontos = i => (i.estimativa ? h("span", { class: "issue-pontos", title: plural(i.estimativa, "ponto", "pontos") + " (estimativa)", text: String(i.estimativa) }) : null);
const chipDoResponsavel = i => (i.responsavel ? h("span", { class: "chip-resp", "data-pessoa": i.responsavel, text: i.responsavel }) : null);
/** A checklist da documentação: "2/5" (verde quando completa). */
function chipDaChecklist(i) {
  const t = tarefasDoMarkdown(i.descricao);
  return t.total ? h("span", { class: "chip-checklist" + (t.feitas === t.total ? " completa" : ""), title: `Checklist: ${t.feitas} de ${t.total} feitas` }, icone("tarefas", 12), `${t.feitas}/${t.total}`) : null;
}
function chipDoProjeto(id) {
  const p = id && dados.buscar("projetos", id);
  return p ? h("span", { class: "chip-projeto", title: "Projeto: " + p.nome, text: p.nome }) : null;
}

/** Um elemento com o Markdown já formatado (o HTML sai seguro de markdown.js); a checklist aqui só se lê. */
function markdownNoElemento(md, classe = "md") {
  const el = h("div", { class: classe });
  el.innerHTML = markdownParaHtml(md);
  el.querySelectorAll("input[type=checkbox]").forEach(c => { c.disabled = true; });
  return el;
}

/* ---------- copiar (para levar a uma sessão) ---------- */
async function copiar(texto, mensagem) {
  try {
    await navigator.clipboard.writeText(texto);
    aviso(mensagem);
  } catch (e) {
    // o navegador não deixou: a janela mostra o texto, já selecionado
    const area = h("textarea", { class: "doc-editor", rows: "16", readonly: true, "aria-label": "Texto para copiar" });
    area.value = texto;
    abrirJanela({ titulo: "Copie o texto", descricao: "O navegador não deixou copiar sozinho: está tudo selecionado, é só Ctrl+C (ou Cmd+C).", conteudo: area, larga: true });
    setTimeout(() => { area.focus(); area.select(); }, 30);
  }
}

/* ---------- a documentação (Markdown): ler, editar, marcar a checklist e anotar no registro ---------- */

/**
 * O bloco da documentação de uma issue. Lê (o Markdown formatado, a checklist clicável e o "Anotar no registro") e
 * edita (o texto, o modelo, abrir um .md). `aoMudarJa(md)` grava na hora o que se marca e o que se anota (na issue
 * que já existe); na nova, fica tudo para o Criar.
 */
function blocoDaDocumentacao({ md = "", aoMudarJa = null, aoEnviar }) {
  let texto = String(md || "");
  let modo = texto.trim() ? "ler" : "editar";
  const editor = h("textarea", { class: "doc-editor", rows: "14", spellcheck: "true", "aria-label": "Documentação (Markdown)",
    placeholder: "Markdown: ## títulos, - [ ] checklist, `código`, [link](https://…). Ou comece pelo modelo." });
  editor.addEventListener("input", () => { texto = editor.value; contar(); });
  editor.addEventListener("keydown", e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); aoEnviar(); } });
  const leitura = h("div", { class: "md doc-leitura" });
  const contador = h("span", { class: "doc-contador" });
  const arquivo = h("input", { type: "file", accept: ".md,.markdown,.txt,text/markdown,text/plain", hidden: true });
  arquivo.addEventListener("change", async () => {
    const f = arquivo.files && arquivo.files[0];
    arquivo.value = "";
    if (!f) return;
    const lido = await f.text();
    if (texto.trim() && !(await confirmar({ titulo: "Trocar a documentação?", descricao: `O que está escrito sai e entra o ${f.name}.`, confirmarTexto: "Trocar" }))) return;
    texto = lido.replace(/\r\n?/g, "\n");
    modo = "editar";
    desenhar();
  });
  const registro = h("input", { type: "text", class: "doc-registro-campo", maxlength: "500", "aria-label": "Anotar no registro",
    placeholder: "Anotar no registro: o que foi feito, decisão, onde parou… (Enter)" });
  registro.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!registro.value.trim()) return;
    texto = anotarNoRegistro(texto, registro.value, hojeLocal());
    registro.value = "";
    desenhar();
    if (aoMudarJa) aoMudarJa(texto);
  });
  leitura.addEventListener("change", e => {
    const caixa = e.target.closest("input[type=checkbox][data-linha]");
    if (!caixa) return;
    texto = alternarTarefa(texto, Number(caixa.dataset.linha));
    desenhar();
    if (aoMudarJa) aoMudarJa(texto);
  });
  const botaoModo = (id, nome) => h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(modo === id), "data-state": modo === id ? "active" : "inactive",
    onclick: () => { if (modo === "editar") texto = editor.value; modo = id; desenhar(); if (id === "editar") editor.focus(); } }, nome);
  const barra = h("div", { class: "doc-barra" });
  const corpo = h("div", { class: "doc-corpo" });
  function contar() {
    const t = tarefasDoMarkdown(texto);
    contador.replaceChildren(...(t.total ? [icone("tarefas", 13), `${t.feitas}/${t.total}`] : []));
    contador.title = t.total ? `Checklist: ${t.feitas} de ${t.total} feitas` : "";
  }
  function desenhar() {
    const podeMexer = dados.podeEditar();
    barra.replaceChildren(
      h("span", { class: "doc-titulo" }, "Documentação", contador),
      h("div", { class: "doc-acoes" },
        modo === "editar" && !texto.trim() ? h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => { texto = MODELO_DA_ISSUE; desenhar(); editor.focus(); } }, icone("lista", 14), "Usar o modelo") : null,
        modo === "editar" ? h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => arquivo.click() }, icone("documento", 14), "Abrir .md") : null,
        h("div", { class: "tabs-list doc-modos", role: "tablist", "aria-label": "Ler ou editar" }, botaoModo("ler", "Ler"), botaoModo("editar", "Editar"))));
    if (modo === "editar") {
      editor.value = texto;
      corpo.replaceChildren(editor, h("p", { class: "dica-campo", text: "Markdown: ## título, - [ ] item da checklist, **negrito**, `código`, [texto](https://…). Ctrl+Enter salva." }));
      requestAnimationFrame(() => { editor.style.height = "auto"; editor.style.height = Math.max(editor.scrollHeight + 2, 260) + "px"; });
    } else {
      leitura.innerHTML = texto.trim() ? markdownParaHtml(texto) : "";
      leitura.querySelectorAll("input[type=checkbox]").forEach(c => { c.disabled = !podeMexer; c.setAttribute("aria-label", "Marcar como feito"); });
      corpo.replaceChildren(texto.trim() ? leitura : h("p", { class: "doc-vazia", text: "Sem documentação ainda. Em Editar, escreva ou use o modelo (Contexto, O que fazer, Pronto quando, Registro)." }),
        h("div", { class: "doc-registro" }, icone("nota", 15), registro));
      registro.disabled = !podeMexer;
    }
    contar();
  }
  desenhar();
  return { el: h("section", { class: "doc-bloco", "aria-label": "Documentação" }, barra, corpo, arquivo), valor: () => (modo === "editar" ? editor.value : texto) };
}

/* ---------- janela da issue: nova ou editar ---------- */

/** Sem `issue`: cria (com projeto, status e ciclo já escolhidos, se vierem). Com `issue`: edita ou exclui. */
export function abrirIssue({ issue = null, projetoId = null, status = "backlog", ciclo = null } = {}) {
  const editando = !!issue;
  const hoje = hojeLocal(), atual = cicloDoDia(hoje);
  const titulo = h("textarea", { class: "issue-titulo-campo", rows: "1", maxlength: "500", placeholder: "Título da issue (ex.: Layout da página inicial)", required: true, "aria-label": "Título" });
  titulo.value = editando ? issue.titulo : "";
  const crescer = () => { titulo.style.height = "auto"; titulo.style.height = titulo.scrollHeight + 2 + "px"; };
  titulo.addEventListener("input", crescer);
  titulo.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); form.requestSubmit(); } });

  const selStatus = h("select", { class: "select-trigger" }, opcoesDoSelect(STATUS.map(s => [s.id, s.nome])));
  selStatus.value = editando ? issue.status : status;
  const selEstimativa = h("select", { class: "select-trigger" }, opcoesDoSelect([["", "Sem estimativa"], ...ESTIMATIVAS.map(n => [String(n), plural(n, "ponto", "pontos")])]));
  selEstimativa.value = editando && issue.estimativa ? String(issue.estimativa) : "";
  const selResponsavel = h("select", { class: "select-trigger" }, opcoesDoSelect([["", "Sem responsável"], ...RESPONSAVEIS.map(r => [r, r])]));
  selResponsavel.value = editando ? issue.responsavel || "" : "";

  const projetos = dados.listar("projetos");
  const andando = projetos.filter(p => p.situacao !== "concluido").sort(porNome), prontos = projetos.filter(p => p.situacao === "concluido").sort(porNome);
  const selProjeto = h("select", { class: "select-trigger" }, opcoesDoSelect([["", "Sem projeto"],
    ...(andando.length ? [{ grupo: "Em andamento", opcoes: andando.map(p => [p.id, p.nome]) }] : []),
    ...(prontos.length ? [{ grupo: "Concluídos", opcoes: prontos.map(p => [p.id, p.nome]) }] : [])]));
  selProjeto.value = editando ? issue.projeto_id || "" : projetoId || "";

  const cicloAtual = editando ? issue.ciclo : ciclo;
  const selCiclo = h("select", { class: "select-trigger" }, opcoesDoSelect([["", "Sem ciclo"],
    ...ciclosParaEscolher(hoje, cicloAtual).map(n => [String(n), `C${n} · ` + nomeDoCiclo(n).replace(/^Ciclo \d+ · /, "") + (n === atual ? " (atual)" : n === atual + 1 ? " (próximo)" : "")])]));
  selCiclo.value = cicloAtual ? String(cicloAtual) : "";

  // A checklist e o registro gravam na hora (na issue que já existe): ninguém perde o que marcou ao fechar a janela.
  const gravarDoc = editando ? async md => { try { await salvar("issues", issue.id, { descricao: md }); } catch (e) { /* aviso já mostrado */ } } : null;
  const doc = blocoDaDocumentacao({ md: editando ? issue.descricao || "" : "", aoMudarJa: gravarDoc, aoEnviar: () => form.requestSubmit() });

  const erro = h("p", { class: "erro-form", hidden: true });
  const botao = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, editando ? "Salvar" : [icone("mais", 16), "Criar issue"]);
  const acoes = [botao];
  if (editando) {
    acoes.unshift(h("div", { class: "acoes-esquerda" },
      h("button", { type: "button", class: "btn btn-ghost-destructive", onclick: async () => {
        if (!(await confirmar({ titulo: `Excluir a issue ${codigoDaIssue(issue)}?`, descricao: issue.titulo, confirmarTexto: "Excluir", destrutivo: true }))) return;
        try { await dados.excluir("issues", issue.id); aviso("Issue excluída."); fechar(); } catch (e) { falhou(e); }
      } }, icone("lixo", 15), "Excluir"),
      h("button", { type: "button", class: "btn btn-ghost", title: "Copia a issue no formato do pacote (.md), para colar numa sessão", onclick: () => {
        const atualizada = { ...issue, titulo: titulo.value.trim() || issue.titulo, descricao: doc.valor(), status: selStatus.value, estimativa: selEstimativa.value ? Number(selEstimativa.value) : null,
          ciclo: selCiclo.value ? Number(selCiclo.value) : null, responsavel: selResponsavel.value || null };
        copiar(issueParaPacote(atualizada), `${codigoDaIssue(issue)} copiada: é só colar na sessão.`);
      } }, icone("copiar", 15), "Copiar")));
  }
  const lado = h("div", { class: "issue-lado" },
    h("label", {}, "Status", selStatus), h("label", {}, "Estimativa", selEstimativa), h("label", {}, "Responsável", selResponsavel),
    h("label", {}, "Projeto", selProjeto), h("label", {}, "Ciclo", selCiclo),
    editando && issue.status === "done" && issue.feita_em ? h("p", { class: "dica-campo", text: "Feita em " + diaDoMomento(issue.feita_em) + "." }) : null);
  const form = h("form", { class: "dialog-form form-issue" },
    h("div", { class: "issue-layout" }, h("div", { class: "issue-principal" }, titulo, doc.el), lado),
    erro,
    h("div", { class: "janela-acoes" + (editando ? " separadas" : "") }, acoes));

  const { fechar, caixa } = abrirJanela({ titulo: editando ? `Issue ${codigoDaIssue(issue)}` : "Nova issue", conteudo: form, larga: true });
  caixa.classList.add("doc-dialog");
  requestAnimationFrame(crescer);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const texto = titulo.value.replace(/\s+/g, " ").trim();
    if (!texto) { erro.textContent = "Escreva o título da issue."; erro.hidden = false; titulo.focus(); return; }
    const escolhido = { titulo: texto, descricao: doc.valor().replace(/\s+$/, ""), projeto_id: selProjeto.value || null, estimativa: selEstimativa.value ? Number(selEstimativa.value) : null,
      ciclo: selCiclo.value ? Number(selCiclo.value) : null, responsavel: selResponsavel.value || null };
    botao.disabled = true;
    try {
      if (editando) {
        const patch = { ...escolhido, ...patchDeStatus({ ...issue, ciclo: escolhido.ciclo }, selStatus.value, hoje) };
        if (patch.status) patch.posicao = posicaoNoFim(dados.listar("issues").filter(i => i.status === patch.status && i.id !== issue.id));
        await salvar("issues", issue.id, patch);
        aviso(`${codigoDaIssue(issue)} salva.`);
      } else {
        const nova = await criar("issues", novaIssue({ ...escolhido, status: selStatus.value }, dados.listar("issues"), hoje));
        aviso(`${codigoDaIssue(nova) || "Issue"} criada em ${nomeDoStatus(nova.status)}.`);
      }
      fechar();
    } catch (err) { /* aviso já mostrado */ } finally { botao.disabled = false; }
  });
}

/* ---------- importar issues (o pacote .md) num projeto ---------- */

const NOMES_DOS_CAMPOS = { titulo: "título", descricao: "documentação", status: "status", estimativa: "estimativa", ciclo: "ciclo", responsavel: "responsável" };

/** Cola (ou abre) o .md das issues, mostra o que vai acontecer e importa: cria as novas e atualiza as que já existem. */
export function abrirImportacao(projeto) {
  const hoje = hojeLocal();
  const area = h("textarea", { class: "doc-editor importar-area", rows: "12", spellcheck: "false", "aria-label": "O .md das issues",
    placeholder: "Cole aqui o .md das issues. Cada uma começa com \"# Título\":\n\n# Layout da página inicial\nstatus: todo\nestimativa: 3\nciclo: 10\nresponsavel: Kaue\n\n## Contexto\n…\n\n## O que fazer\n- [ ] …" });
  const arquivo = h("input", { type: "file", accept: ".md,.markdown,.txt,text/markdown,text/plain", hidden: true });
  const previa = h("div", { class: "importar-previa", "aria-live": "polite" });
  const botao = h("button", { type: "submit", class: "btn btn-primary btn-lg", disabled: true }, "Importar");
  let plano = { criar: [], atualizar: [], avisos: [] };
  const linhaDaPrevia = (rotulo, i, mudou) => h("li", { class: "issue-linha" },
    iconeDoStatus(i.status || "backlog", 14),
    h("span", { class: "importar-rotulo" + (rotulo === "Nova" ? " nova" : ""), text: rotulo }),
    h("span", { class: "issue-linha-titulo", text: i.titulo }),
    h("span", { class: "issue-linha-meta" },
      mudou ? h("span", { class: "issue-feita", text: "muda: " + mudou.map(c => NOMES_DOS_CAMPOS[c]).filter(Boolean).join(", ") }) : null,
      chipDaChecklist(i), chipDePontos(i), chipDoCiclo(i.ciclo), chipDoResponsavel(i)));
  function atualizar() {
    const { issues, avisos } = lerPacote(area.value, hoje);
    plano = planoDeImportacao(issues, dados.listar("issues"), projeto.id, hoje);
    const todos = [...avisos, ...plano.avisos];
    const n = plano.criar.length + plano.atualizar.length;
    botao.disabled = !n || !dados.podeEditar();
    botao.textContent = n ? "Importar " + plural(n, "issue", "issues") : "Importar";
    previa.replaceChildren(...[
      area.value.trim() && !issues.length ? h("p", { class: "muted", text: "Nenhuma issue achada: cada uma começa com uma linha \"# Título\"." }) : null,
      n ? h("p", { class: "importar-resumo", text: [plano.criar.length ? plural(plano.criar.length, "nova", "novas") : null, plano.atualizar.length ? plural(plano.atualizar.length, "atualizada", "atualizadas") : null].filter(Boolean).join(" · ") }) : null,
      n ? h("ul", { class: "lista-issues compacta importar-lista" },
        plano.criar.map(c => linhaDaPrevia("Nova", c)),
        plano.atualizar.map(u => linhaDaPrevia(codigoDaIssue(u.issue), { ...u.issue, ...u.patch }, Object.keys(u.patch)))) : null,
      issues.length && !n && !todos.length ? h("p", { class: "muted", text: "Nada muda: o projeto já está igual a este arquivo." }) : null,
      todos.length ? h("div", { class: "importar-avisos" }, h("strong", { text: "Atenção" }), h("ul", {}, todos.map(a => h("li", { text: a })))) : null,
    ].filter(Boolean));
  }
  let espera = null;
  area.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(atualizar, 200); });
  arquivo.addEventListener("change", async () => {
    const f = arquivo.files && arquivo.files[0];
    arquivo.value = "";
    if (!f) return;
    area.value = (await f.text()).replace(/\r\n?/g, "\n");
    atualizar();
  });
  const form = h("form", { class: "dialog-form" },
    h("div", { class: "importar-topo" },
      h("p", { class: "muted", text: "O formato está em docs/projetos-e-issues.md. Com \"numero\" (ou o mesmo título), a issue que já existe é atualizada: importar de novo não duplica." }),
      h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => arquivo.click() }, icone("documento", 14), "Abrir arquivo .md")),
    area, arquivo, previa,
    h("div", { class: "janela-acoes" }, botao));
  const { fechar, caixa } = abrirJanela({ titulo: "Importar issues", descricao: "No projeto " + projeto.nome + ".", conteudo: form, larga: true });
  caixa.classList.add("doc-dialog");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    atualizar();
    const total = plano.criar.length + plano.atualizar.length;
    if (!total) return;
    area.disabled = botao.disabled = true;
    let feitas = 0;
    try {
      for (const c of plano.criar) {
        botao.textContent = `Importando ${feitas + 1} de ${total}…`;
        await criar("issues", novaIssue(c, dados.listar("issues"), hoje));
        feitas++;
      }
      for (const u of plano.atualizar) {
        botao.textContent = `Importando ${feitas + 1} de ${total}…`;
        await salvar("issues", u.issue.id, u.patch);
        feitas++;
      }
      aviso(`${plural(total, "issue importada", "issues importadas")} em ${projeto.nome}.`);
      fechar();
    } catch (err) {
      previa.prepend(h("p", { class: "erro-form", text: `Parou em ${feitas} de ${total}: o resto não entrou. Importe de novo: o que já entrou não duplica.` }));
      area.disabled = false;
      atualizar();
    }
  });
  setTimeout(() => area.focus(), 30);
}

/* ---------- janela do projeto: novo ou editar ---------- */

/** Sem `projeto`: cria (com o cliente já escolhido, se vier). Com `projeto`: edita ou exclui. Devolve o criado. */
export function abrirProjeto({ projeto = null, leadId = null, aoCriar } = {}) {
  const editando = !!projeto;
  const hoje = hojeLocal();
  const lead = !editando && leadId ? dados.buscar("leads", leadId) : null;
  const nome = h("input", { type: "text", maxlength: "120", placeholder: "Ex.: Vereador Mateuzinho · Site do mandato", required: true });
  nome.value = editando ? projeto.nome : lead ? (lead.empresa || "") + " · " : "";
  const leads = dados.listar("leads").sort(porNome);
  const cliente = h("select", { class: "select-trigger" }, opcoesDoSelect([["", "Sem cliente"], ...leads.map(l => [l.id, l.empresa || "Sem nome"])]));
  cliente.value = editando ? projeto.lead_id || "" : leadId || "";
  const descricao = h("textarea", { class: "doc-editor", rows: "8", maxlength: "50000", placeholder: "Markdown (opcional): o que foi combinado, o escopo, as entregas, links e onde está o trilho. ## títulos, - listas, [link](https://…)" });
  descricao.value = editando ? projeto.descricao || "" : "";
  const crescer = () => { descricao.style.height = "auto"; descricao.style.height = descricao.scrollHeight + 2 + "px"; };
  descricao.addEventListener("input", crescer);
  const inicio = h("input", { type: "date", value: editando ? projeto.inicio || "" : hoje, "aria-label": "Início" });
  const meta = h("input", { type: "date", value: editando ? projeto.meta || "" : "", "aria-label": "Meta" });
  const situacao = h("select", { class: "select-trigger" }, opcoesDoSelect(SITUACOES_DO_PROJETO.map(s => [s.id, s.nome])));
  situacao.value = editando ? projeto.situacao : "em_andamento";

  const erro = h("p", { class: "erro-form", hidden: true });
  const botao = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, editando ? "Salvar" : [icone("mais", 16), "Criar projeto"]);
  const acoes = [botao];
  if (editando) {
    acoes.unshift(h("button", { type: "button", class: "btn btn-ghost-destructive", onclick: async () => {
      const n = dados.listar("issues").filter(i => i.projeto_id === projeto.id).length;
      if (!(await confirmar({ titulo: "Excluir este projeto?", descricao: projeto.nome + (n ? ` · ${plural(n, "issue sai", "issues saem")} junto.` : ""), confirmarTexto: "Excluir", destrutivo: true }))) return;
      try { await dados.excluir("projetos", projeto.id); aviso("Projeto excluído."); fechar(); } catch (e) { falhou(e); }
    } }, icone("lixo", 15), "Excluir"));
  }
  const form = h("form", { class: "dialog-form" },
    h("label", {}, "Nome do projeto", nome),
    h("label", {}, "Cliente (opcional)", cliente),
    h("label", {}, "Documentação do projeto", descricao),
    h("div", { class: "linha-form" }, h("label", {}, "Início", inicio), h("label", {}, "Meta (opcional)", meta), h("label", {}, "Situação", situacao)),
    erro,
    h("div", { class: "janela-acoes" + (editando ? " separadas" : "") }, acoes));
  const { fechar } = abrirJanela({ titulo: editando ? "Editar projeto" : "Novo projeto", descricao: editando ? null : "Um cliente pode ter vários projetos: a fase 1, a fase 2…", conteudo: form, larga: true });
  requestAnimationFrame(crescer);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const texto = nome.value.trim().replace(/\s*·\s*$/, "");
    if (!texto) { erro.textContent = "Dê um nome ao projeto."; erro.hidden = false; return; }
    if (meta.value && inicio.value && meta.value < inicio.value) { erro.textContent = "A meta é antes do início."; erro.hidden = false; return; }
    const linha = { nome: texto, lead_id: cliente.value || null, descricao: descricao.value.trim(), inicio: inicio.value || null, meta: meta.value || null, situacao: situacao.value };
    botao.disabled = true;
    try {
      if (editando) { await salvar("projetos", projeto.id, linha); aviso("Projeto salvo."); fechar(); }
      else { const novo = await criar("projetos", linha); aviso("Projeto criado."); fechar(); aoCriar && aoCriar(novo); }
    } catch (err) { /* aviso já mostrado */ } finally { botao.disabled = false; }
  });
}

/* ---------- pedaços ---------- */

function barraDeProgresso(p, { pontos = true } = {}) {
  const pct = Math.round(p.fracao * 100);
  const texto = p.total ? `${p.feitas} de ${plural(p.total, "issue", "issues")}` + (pontos && p.pontos ? ` · ${p.pontosFeitos} de ${plural(p.pontos, "ponto", "pontos")}` : "") : "Nenhuma issue ainda";
  return h("div", { class: "progresso-bloco" },
    h("div", { class: "progresso", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct), "aria-label": "Progresso" }, h("span", { style: `width:${pct}%` })),
    h("span", { class: "progresso-texto" }, h("b", { text: pct + "%" }), " · " + texto));
}

function seloDaSituacao(p) {
  return h("span", { class: "selo-situacao " + (p.situacao === "concluido" ? "concluido" : "andando"), text: nomeDaSituacao(p.situacao) });
}

/** Uma linha de issue (nas listas do projeto e dos ciclos). */
function linhaDaIssue(i, { comProjeto = false } = {}) {
  const feita = i.status === "done";
  return h("li", { class: "issue-linha" + (feita ? " feita" : "") },
    botaoDeStatus(i),
    h("button", { type: "button", class: "issue-linha-corpo", title: "Abrir a issue", onclick: () => abrirIssue({ issue: i }) },
      h("span", { class: "issue-codigo", text: codigoDaIssue(i) }),
      h("span", { class: "issue-linha-titulo", text: i.titulo }),
      h("span", { class: "issue-linha-meta" },
        comProjeto ? chipDoProjeto(i.projeto_id) : null,
        feita && i.feita_em ? h("span", { class: "issue-feita", text: diaDoMomento(i.feita_em) }) : null,
        chipDaChecklist(i), chipDePontos(i), chipDoCiclo(i.ciclo), chipDoResponsavel(i))));
}

function listaPorStatus(issues, opcoes) {
  return issuesPorStatus(issues).map(g => h("section", { class: "grupo-issues", "aria-label": g.nome },
    h("h3", { class: "grupo-titulo" }, iconeDoStatus(g.id, 13), g.nome, h("span", { text: String(g.issues.length) })),
    h("ul", { class: "lista-issues" }, g.issues.map(i => linhaDaIssue(i, opcoes)))));
}

/* ---------- projetos do cliente (nos detalhes do lead) ---------- */

/** Os projetos de um cliente, com o progresso; clicar leva à tela Projetos, no projeto. */
export function projetosDoCliente(leadId, { abrirNaTela }) {
  const el = h("div", { class: "projetos-do-cliente" });
  function atualizar() {
    if (faltaBanco()) { el.replaceChildren(h("p", { class: "muted", text: "Falta criar as tabelas de projetos no banco (supabase/projetos.sql)." })); return; }
    const issues = dados.listar("issues");
    const lista = ordenarProjetos(dados.listar("projetos").filter(p => p.lead_id === leadId));
    el.replaceChildren(lista.length
      ? h("ul", { class: "lista-issues compacta" }, lista.map(p => {
        const pr = progresso(issues.filter(i => i.projeto_id === p.id));
        return h("li", { class: "issue-linha" },
          h("button", { type: "button", class: "issue-linha-corpo", title: "Abrir o projeto", onclick: () => abrirNaTela(p.id) },
            h("span", { class: "issue-linha-titulo", text: p.nome }),
            h("span", { class: "issue-linha-meta" }, h("span", { class: "progresso-texto", text: pr.total ? `${pr.feitas}/${pr.total}` : "sem issues" }), seloDaSituacao(p))));
      }))
      : h("p", { class: "muted", text: "Nenhum projeto ainda. Fechou? Crie o projeto da entrega." }));
  }
  return { el, atualizar };
}

/* ---------- a tela ---------- */

const estado = { vista: "issues", projeto: "", ciclo: "", responsavel: "", aberto: null, antigas: false };
try {
  const s = JSON.parse(localStorage.getItem("renderiza:projetos") || "{}");
  if (["issues", "projetos", "ciclos"].includes(s.vista)) estado.vista = s.vista;
  for (const k of ["projeto", "ciclo", "responsavel"]) if (typeof s[k] === "string") estado[k] = s[k];
} catch (e) { /* opcional */ }
function guardar() {
  try { localStorage.setItem("renderiza:projetos", JSON.stringify({ vista: estado.vista, projeto: estado.projeto, ciclo: estado.ciclo, responsavel: estado.responsavel })); } catch (e) { /* opcional */ }
}

/**
 * @param {{host: HTMLElement, abrirLead: (id) => void, busca: () => string}} ctx
 */
export function criarTelaProjetos(ctx) {
  // Barra fixa: o painel põe o campo de busca em buscaSlot; abas, ações e o corpo são redesenhados.
  const abasSlot = h("div", { class: "abas-slot" }), buscaSlot = h("div", { class: "busca-slot" }), acoesSlot = h("div", { class: "sheet-actions" });
  const corpo = h("div", { class: "projetos-corpo" });
  ctx.host.replaceChildren(h("div", { class: "sheet-toolbar" }, h("div", { class: "barra-esquerda" }, abasSlot, buscaSlot), acoesSlot), corpo);
  let arrastando = null;

  const ir = vista => { estado.vista = vista; estado.aberto = null; guardar(); render(); window.scrollTo(0, 0); };
  const abrirNoProjeto = id => { estado.vista = "projetos"; estado.aberto = id; guardar(); render(); window.scrollTo(0, 0); };

  function abas(issues, projetos) {
    const itens = [
      ["issues", "Issues", issues.filter(i => i.status !== "done").length],
      ["projetos", "Projetos", projetos.filter(p => p.situacao !== "concluido").length],
      ["ciclos", "Ciclos", null],
    ];
    return h("div", { class: "tabs-list", role: "tablist", "aria-label": "Vista" }, itens.map(([id, nome, n]) => {
      const ativa = estado.vista === id;
      return h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(ativa), "data-state": ativa ? "active" : "inactive", onclick: () => ir(id) },
        nome, n === null ? null : h("span", { class: "contagem", text: String(n) }));
    }));
  }

  /** O que a issue nova já traz dos filtros (projeto e ciclo escolhidos). */
  function padraoDaIssue(extra = {}) {
    const atual = cicloDoDia(hojeLocal());
    const ciclo = estado.ciclo === "atual" ? atual : estado.ciclo === "proximo" ? atual + 1 : /^\d+$/.test(estado.ciclo) ? Number(estado.ciclo) : null;
    return { projetoId: estado.projeto && estado.projeto !== SEM ? estado.projeto : null, ciclo, ...extra };
  }

  function acoes() {
    const editavel = dados.podeEditar() && !faltaBanco();
    const noProjeto = estado.vista === "projetos" && estado.aberto;
    return [
      h("button", { type: "button", class: "btn btn-outline", disabled: !editavel || null, onclick: () => abrirProjeto({ aoCriar: p => abrirNoProjeto(p.id) }) }, icone("camadas", 16), "Novo projeto"),
      h("button", { type: "button", class: "btn btn-primary", disabled: !editavel || null, onclick: () => abrirIssue(noProjeto ? { projetoId: estado.aberto } : padraoDaIssue()) }, icone("mais", 16), "Nova issue"),
    ];
  }

  /* ----- Issues: filtros e quadro ----- */
  function filtros(projetos, issues) {
    const mudar = (campo, valor) => { estado[campo] = valor; estado.antigas = false; guardar(); render(); };
    const andando = projetos.filter(p => p.situacao !== "concluido").sort(porNome), prontos = projetos.filter(p => p.situacao === "concluido").sort(porNome);
    const selProjeto = h("select", { class: "select-trigger", "aria-label": "Projeto", onchange: e => mudar("projeto", e.target.value) }, opcoesDoSelect([["", "Todos os projetos"], [SEM, "Sem projeto"],
      ...(andando.length ? [{ grupo: "Em andamento", opcoes: andando.map(p => [p.id, p.nome]) }] : []),
      ...(prontos.length ? [{ grupo: "Concluídos", opcoes: prontos.map(p => [p.id, p.nome]) }] : [])]));
    if (estado.projeto && estado.projeto !== SEM && !dados.buscar("projetos", estado.projeto)) estado.projeto = "";
    selProjeto.value = estado.projeto;
    const atual = cicloDoDia(hojeLocal());
    const outros = [...new Set(issues.map(i => Number(i.ciclo)).filter(n => n > 0 && n !== atual && n !== atual + 1))].sort((a, b) => b - a);
    const selCiclo = h("select", { class: "select-trigger", "aria-label": "Ciclo", onchange: e => mudar("ciclo", e.target.value) }, opcoesDoSelect([["", "Todos os ciclos"],
      ["atual", `Ciclo atual · C${atual}`], ["proximo", `Próximo · C${atual + 1}`], [SEM, "Sem ciclo"],
      ...(outros.length ? [{ grupo: "Outros ciclos", opcoes: outros.map(n => [String(n), nomeDoCiclo(n)]) }] : [])]));
    if (/^\d+$/.test(estado.ciclo) && !outros.includes(Number(estado.ciclo))) estado.ciclo = "";
    selCiclo.value = estado.ciclo;
    const selResp = h("select", { class: "select-trigger", "aria-label": "Responsável", onchange: e => mudar("responsavel", e.target.value) },
      opcoesDoSelect([["", "Todos os responsáveis"], ...RESPONSAVEIS.map(r => [r, r]), [SEM, "Sem responsável"]]));
    selResp.value = estado.responsavel;
    const algum = estado.projeto || estado.ciclo || estado.responsavel;
    return h("div", { class: "filtros-projetos" }, selProjeto, selCiclo, selResp,
      algum ? h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => { estado.projeto = estado.ciclo = estado.responsavel = ""; guardar(); render(); } }, icone("fechar", 14), "Limpar") : null);
  }

  function cartaoDaIssue(i, editavel) {
    const abrir = () => abrirIssue({ issue: i });
    const cartao = h("div", { class: "kanban-card issue-card", role: "button", tabindex: "0", draggable: editavel ? "true" : null, "data-id": i.id,
      onclick: abrir, onkeydown: e => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); abrir(); } } },
      h("div", { class: "issue-topo" }, botaoDeStatus(i), h("span", { class: "issue-codigo", text: codigoDaIssue(i) }), chipDePontos(i)),
      h("strong", { class: "issue-titulo", text: i.titulo }),
      h("div", { class: "issue-chips" }, estado.projeto && estado.projeto !== SEM ? null : chipDoProjeto(i.projeto_id), chipDaChecklist(i), chipDoCiclo(i.ciclo), chipDoResponsavel(i),
        i.status === "done" && i.feita_em ? h("span", { class: "issue-feita", text: diaDoMomento(i.feita_em) }) : null));
    cartao.addEventListener("dragstart", e => { arrastando = i.id; e.dataTransfer.setData("text/plain", i.id); e.dataTransfer.effectAllowed = "move"; requestAnimationFrame(() => cartao.classList.add("arrastando")); });
    cartao.addEventListener("dragend", () => { arrastando = null; cartao.classList.remove("arrastando"); });
    return cartao;
  }

  /** Soltar numa coluna: muda o status e, fora do Done, fica onde soltou (antes do cartão de baixo). */
  async function soltar(e, statusId, visiveis) {
    const issue = dados.buscar("issues", e.dataTransfer.getData("text/plain") || arrastando);
    if (!issue) return;
    const alvo = e.target.closest(".issue-card");
    const lista = visiveis.filter(i => i.id !== issue.id);
    let posicao;
    if (statusId !== "done") {
      let k = lista.length;
      if (alvo && alvo.dataset.id !== issue.id) {
        const r = alvo.getBoundingClientRect();
        k = lista.findIndex(i => i.id === alvo.dataset.id) + (e.clientY > r.top + r.height / 2 ? 1 : 0);
      }
      posicao = posicaoEntre(lista[k - 1], lista[k]);
    }
    if (statusId === issue.status && (posicao === undefined || posicao === issue.posicao)) return;
    await mudarStatus(issue, statusId, posicao === undefined ? {} : { posicao });
  }

  function quadro(issues) {
    const hoje = hojeLocal(), editavel = dados.podeEditar();
    const cortarDone = !estado.ciclo && !estado.projeto;
    return h("div", { class: "kanban kanban-issues", role: "group", "aria-label": "Quadro de issues" }, STATUS.map(s => {
      let lista = issues.filter(i => i.status === s.id).sort(compararIssues);
      let antigas = [];
      if (s.id === "done" && cortarDone) ({ recentes: lista, antigas } = separarDone(lista, hoje));
      const visiveis = s.id === "done" && estado.antigas ? [...lista, ...antigas] : lista;
      const pontos = visiveis.reduce((t, i) => t + (Number(i.estimativa) || 0), 0);
      const coluna = h("section", { class: "kanban-col coluna-" + s.id, "data-status": s.id, "aria-label": s.nome },
        h("header", { title: s.dica },
          h("span", { class: "coluna-nome" }, iconeDoStatus(s.id, 14), s.nome),
          h("span", { class: "coluna-direita" },
            pontos ? h("small", { class: "coluna-pontos", title: "Pontos (estimativa)", text: pontos + (pontos === 1 ? " pt" : " pts") }) : null,
            h("small", { text: String(visiveis.length) }),
            h("button", { type: "button", class: "col-acao", title: "Nova issue em " + s.nome, "aria-label": "Nova issue em " + s.nome, disabled: !editavel || faltaBanco() || null,
              onclick: () => abrirIssue(padraoDaIssue({ status: s.id })) }, icone("mais", 14)))),
        h("div", { class: "kanban-cards" },
          visiveis.length ? visiveis.map(i => cartaoDaIssue(i, editavel)) : h("p", { class: "coluna-vazia", text: s.id === "done" && antigas.length ? "Nada feito nos últimos " + DIAS_DO_DONE + " dias." : "Nada aqui." }),
          antigas.length ? h("button", { type: "button", class: "kanban-ver text-link", onclick: () => { estado.antigas = !estado.antigas; render(); } },
            estado.antigas ? "Esconder as mais antigas" : `Ver as ${plural(antigas.length, "mais antiga", "mais antigas")}`) : null));
      coluna.addEventListener("dragover", e => { if (arrastando) { e.preventDefault(); coluna.classList.add("alvo"); } });
      coluna.addEventListener("dragleave", e => { if (!coluna.contains(e.relatedTarget)) coluna.classList.remove("alvo"); });
      coluna.addEventListener("drop", e => { e.preventDefault(); coluna.classList.remove("alvo"); soltar(e, s.id, visiveis); });
      return coluna;
    }));
  }

  function vistaDeIssues(issues, projetos) {
    const visiveis = filtrarIssues(issues, { projeto: estado.projeto, ciclo: estado.ciclo, responsavel: estado.responsavel, busca: ctx.busca() }, { hoje: hojeLocal(), projetos });
    return [
      filtros(projetos, issues),
      issues.length ? null : h("div", { class: "vazio-lista" }, h("strong", { text: "Nenhuma issue ainda." }),
        h("p", { text: "Issue é um pedaço do trabalho: \"Layout da home\", \"Domínio no Registro.br\". Crie pela Nova issue ou pelo + de cada coluna. Com projeto ou sem." })),
      quadro(visiveis),
    ];
  }

  /* ----- Projetos: lista e detalhe ----- */
  function cartaoDoProjeto(p, daProjeto, hoje) {
    const abrir = () => abrirNoProjeto(p.id);
    const cliente = nomeDoCliente(p.lead_id);
    const datas = [];
    if (p.inicio) datas.push(h("span", { text: "Início " + dm(p.inicio) }));
    if (p.situacao === "concluido") { if (p.concluido_em) datas.push(h("span", { text: "Concluído em " + dm(p.concluido_em) })); }
    else if (p.meta) datas.push(h("span", { class: projetoAtrasado(p, hoje) ? "atrasada" : "", text: (projetoAtrasado(p, hoje) ? "Meta vencida: " : "Meta ") + dm(p.meta) }));
    const abertas = daProjeto.filter(i => i.status !== "done").length;
    if (p.situacao !== "concluido") datas.push(h("span", { text: abertas ? plural(abertas, "issue aberta", "issues abertas") : "Nenhuma issue aberta" }));
    return h("article", { class: "projeto-card", role: "button", tabindex: "0", onclick: abrir, onkeydown: e => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); abrir(); } } },
      h("div", { class: "projeto-card-topo" }, h("strong", { text: p.nome }), seloDaSituacao(p)),
      cliente ? h("button", { type: "button", class: "tarefa-cliente", title: "Abrir o cliente", onclick: e => { e.stopPropagation(); ctx.abrirLead(p.lead_id); } }, icone("pessoa", 13), cliente)
        : h("span", { class: "muted", text: "Sem cliente" }),
      barraDeProgresso(progresso(daProjeto)),
      datas.length ? h("div", { class: "projeto-meta" }, datas) : null);
  }

  function vistaDeProjetos(projetos, issues) {
    const hoje = hojeLocal();
    const termos = semAcento(ctx.busca()).split(/\s+/).filter(Boolean);
    const lista = ordenarProjetos(projetos).filter(p => !termos.length || termos.every(t => semAcento(p.nome + " " + nomeDoCliente(p.lead_id) + " " + p.descricao).includes(t)));
    const grupo = (titulo, ps) => (ps.length ? h("section", { class: "grupo-projetos", "aria-label": titulo },
      h("h2", { class: "grupo-titulo" }, titulo, h("span", { text: String(ps.length) })),
      h("div", { class: "projetos-grade" }, ps.map(p => cartaoDoProjeto(p, issues.filter(i => i.projeto_id === p.id), hoje)))) : null);
    if (!projetos.length) return h("div", { class: "vazio-lista" }, h("strong", { text: "Nenhum projeto ainda." }),
      h("p", { text: "Fechou com um cliente? Crie o projeto da entrega e quebre o trabalho em issues. Projeto também pode ser sem cliente (uma melhoria do painel, por exemplo)." }));
    if (!lista.length) return h("div", { class: "vazio-lista" }, h("strong", { text: "Nenhum projeto com essa busca." }));
    return [grupo("Em andamento", lista.filter(p => p.situacao !== "concluido")), grupo("Concluídos", lista.filter(p => p.situacao === "concluido"))];
  }

  function detalheDoProjeto(p, issues) {
    const hoje = hojeLocal();
    const daProjeto = issues.filter(i => i.projeto_id === p.id);
    const cliente = nomeDoCliente(p.lead_id);
    const editavel = dados.podeEditar();
    const concluido = p.situacao === "concluido";
    const abertas = daProjeto.filter(i => i.status !== "done").length;
    const alternar = async () => {
      if (!concluido && abertas && !(await confirmar({ titulo: "Concluir com issues abertas?", descricao: `${plural(abertas, "issue ainda não está", "issues ainda não estão")} em Done. Elas continuam no quadro.`, confirmarTexto: "Concluir" }))) return;
      try { await salvar("projetos", p.id, { situacao: concluido ? "em_andamento" : "concluido", concluido_em: concluido ? null : hoje }); aviso(concluido ? "Projeto reaberto." : "Projeto concluído."); } catch (e) { /* aviso já mostrado */ }
    };
    const datas = [
      p.inicio ? "Início " + dm(p.inicio) : null,
      p.meta ? (projetoAtrasado(p, hoje) ? "Meta vencida: " : "Meta ") + dm(p.meta) : null,
      concluido && p.concluido_em ? "Concluído em " + dm(p.concluido_em) : null,
    ].filter(Boolean);
    return [
      h("button", { type: "button", class: "text-link voltar-projetos", onclick: () => { estado.aberto = null; render(); } }, icone("esquerda", 15), "Projetos"),
      h("section", { class: "projeto-cabeca" },
        h("div", { class: "projeto-card-topo" },
          h("div", { class: "projeto-titulos" }, h("h2", { text: p.nome }),
            cliente ? h("button", { type: "button", class: "tarefa-cliente", title: "Abrir o cliente", onclick: () => ctx.abrirLead(p.lead_id) }, icone("pessoa", 13), cliente) : h("span", { class: "muted", text: "Sem cliente" })),
          seloDaSituacao(p)),
        datas.length ? h("div", { class: "projeto-meta" }, datas.map(t => h("span", { class: /vencida/.test(t) ? "atrasada" : "", text: t }))) : null,
        p.descricao ? markdownNoElemento(p.descricao, "md projeto-descricao") : null,
        barraDeProgresso(progresso(daProjeto)),
        h("div", { class: "projeto-acoes" },
          h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !editavel || null, onclick: () => abrirProjeto({ projeto: p }) }, icone("editar", 14), "Editar projeto"),
          h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !editavel || null, onclick: alternar }, icone(concluido ? "recuperar" : "certo", 14), concluido ? "Reabrir" : "Concluir projeto"),
          h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !editavel || null, title: "Cola (ou abre) o .md das issues: cria as novas e atualiza as que já existem",
            onclick: () => abrirImportacao(p) }, icone("baixar", 14), "Importar issues"),
          h("button", { type: "button", class: "btn btn-outline btn-sm", title: "Copia o projeto e todas as issues (com a documentação) em .md, para colar numa sessão",
            onclick: () => copiar(pacoteDoProjeto(p, daProjeto, { cliente, hoje }), "Projeto copiado: é só colar na sessão.") }, icone("copiar", 14), "Copiar para uma sessão"))),
      daProjeto.length ? listaPorStatus(daProjeto) : h("div", { class: "vazio-lista" }, h("strong", { text: "Nenhuma issue neste projeto." }),
        h("p", { text: "Quebre o trabalho em etapas, cada uma com as ações dela. Crie pela Nova issue." })),
    ];
  }

  /* ----- Ciclos ----- */
  // O atual mostra o que já foi feito e o que está em aberto; o próximo e os de depois, o que está planejado.
  function cartaoDoCiclo(issues, n, rotulo, { atual = false } = {}) {
    const hoje = hojeLocal();
    const r = resumoDoCiclo(issues, n);
    const pct = r.total ? Math.round(r.fracao * 100) : 0;
    const numeros = atual
      ? [[r.feitas, `de ${plural(r.total, "issue feita", "issues feitas")}`], r.pontos ? [r.pontosFeitos, `de ${plural(r.pontos, "ponto", "pontos")}`] : null, r.ficaram ? [r.ficaram, "em aberto"] : null]
      : [[r.total, r.total === 1 ? "issue planejada" : "issues planejadas"], r.pontos ? [r.pontos, r.pontos === 1 ? "ponto" : "pontos"] : null, r.feitas ? [r.feitas, r.feitas === 1 ? "já feita" : "já feitas"] : null];
    return h("section", { class: "ciclo-card" + (atual ? " atual" : ""), "aria-label": nomeDoCiclo(n) },
      h("div", { class: "ciclo-cabeca" },
        chipDoCiclo(n),
        h("h2", { text: nomeDoCiclo(n).replace(/^Ciclo \d+ · /, "") }),
        h("span", { class: "selo-situacao " + (atual ? "andando" : "concluido"), text: rotulo }),
        atual ? h("span", { class: "muted", text: diasParaAcabar(n, hoje) === 1 ? "último dia" : `faltam ${diasParaAcabar(n, hoje)} dias` }) : null,
        h("button", { type: "button", class: "btn btn-ghost btn-sm ciclo-nova", disabled: !dados.podeEditar() || faltaBanco() || null,
          onclick: () => abrirIssue({ ciclo: n, status: "todo" }) }, icone("mais", 14), "Issue neste ciclo")),
      r.total ? h("div", { class: "ciclo-numeros" }, numeros.filter(Boolean).map(([b, texto]) => h("span", {}, h("b", { text: String(b) }), texto))) : null,
      r.total && atual ? h("div", { class: "progresso", role: "progressbar", "aria-valuenow": String(pct), "aria-valuemin": "0", "aria-valuemax": "100", "aria-label": "Feito no ciclo" }, h("span", { style: `width:${pct}%` })) : null,
      r.total ? listaPorStatus(r.issues, { comProjeto: true })
        : h("p", { class: "muted", text: atual ? "Nenhuma issue neste ciclo. Na issue, escolha o ciclo (ou crie por aqui)." : "Nada planejado ainda. Na issue, escolha este ciclo." }));
  }

  function vistaDosCiclos(issues) {
    const hoje = hojeLocal();
    const c = ciclosDaTela(issues, hoje);
    const passados = c.passados.map(n => {
      const r = resumoDoCiclo(issues, n);
      const d = h("details", { class: "ciclo-passado" },
        h("summary", {}, chipDoCiclo(n), h("span", { class: "ciclo-passado-nome", text: nomeDoCiclo(n).replace(/^Ciclo \d+ · /, "") }),
          h("span", { class: "ciclo-passado-numeros" },
            h("span", { text: plural(r.feitas, "feita", "feitas") }),
            r.pontos ? h("span", { text: plural(r.pontosFeitos, "ponto", "pontos") }) : null,
            r.ficaram ? h("span", { class: "ficaram", text: r.ficaram + (r.ficaram === 1 ? " ficou" : " ficaram") }) : null)),
        h("div", { class: "ciclo-passado-corpo" }, listaPorStatus(r.issues, { comProjeto: true })));
      return d;
    });
    return [
      cartaoDoCiclo(issues, c.atual, "Atual", { atual: true }),
      cartaoDoCiclo(issues, c.proximo, "Próximo"),
      ...c.adiante.map(n => cartaoDoCiclo(issues, n, "Mais adiante")),
      passados.length ? h("section", { class: "ciclos-passados", "aria-label": "Ciclos que passaram" },
        h("h2", { class: "grupo-titulo" }, "Ciclos que passaram", h("span", { text: String(passados.length) })), passados) : null,
      h("p", { class: "nota-ciclos", text: "Ciclos semanais, de segunda a domingo (desde 30/11/2026; o ciclo 9 foi a passagem, de 27 a 29/11). São os mesmos da prospecção. Issue que vai para Done sem ciclo entra no ciclo do dia." }),
    ];
  }

  function render() {
    const projetos = dados.listar("projetos"), issues = dados.listar("issues");
    if (estado.aberto && !dados.buscar("projetos", estado.aberto)) estado.aberto = null;
    abasSlot.replaceChildren(abas(issues, projetos));
    acoesSlot.replaceChildren(...acoes());
    if (faltaBanco()) {
      corpo.replaceChildren(h("div", { class: "vazio-lista" }, h("strong", { text: "Falta criar as tabelas de projetos no banco." }),
        h("p", { text: "No Supabase da prospecção, SQL Editor: rode supabase/projetos.sql e depois supabase/projetos-carga.sql (os primeiros projetos). Depois, recarregue o painel." })));
      return;
    }
    const conteudo = estado.vista === "ciclos" ? vistaDosCiclos(issues)
      : estado.vista === "projetos" ? (estado.aberto ? detalheDoProjeto(dados.buscar("projetos", estado.aberto), issues) : vistaDeProjetos(projetos, issues))
        : vistaDeIssues(issues, projetos);
    corpo.replaceChildren(...[conteudo].flat(Infinity).filter(Boolean));
  }

  return { render, buscaSlot, abrirProjeto: abrirNoProjeto, mostraBusca: () => !(estado.vista === "ciclos" || (estado.vista === "projetos" && estado.aberto)) };
}
