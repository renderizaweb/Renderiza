// Interface do Painel Renderiza no padrão do Compasso: Ritmo (placar do processo), Pipeline
// (planilhão ou kanban) e Conteúdo. Toda leitura e gravação passa por dados.js.

import * as dados from "./dados.js";
import { criarPlanilha } from "./planilha.js";
import { h } from "./dom.js";
import { icone } from "./icones.js";
import { botaoMenu, abrirJanela, confirmar, aviso, janelaAberta, fecharJanelaDoTopo } from "./ui.js";
import {
  ETAPAS, RESULTADOS, CANAIS, STATUS_CONTEUDO, INTERESSES,
  rotuloEtapa, ordemDaEtapa, novoLead, novoConteudo, nomeDoInteresse,
  linhaDeHistorico, lerValor, formatarValor,
} from "./modelo.js";
import { salvar, criar, falhou, patchDeInteresse, patchDeNaoContatar } from "./acoes.js";
import { hojeLocal, indexar, retornoPendente, retornoSugerido, ultimaInteracao, semanaDe, cicloVigente } from "./ritmo.js";
import { abrirRegistro, criarLinhaDoTempo } from "./interacoes-ui.js";
import { criarTelaRitmo } from "./tela-ritmo.js";

const $ = s => document.querySelector(s);

/* ---------- preferências da tela (só neste navegador) ---------- */
const ui = {
  aba: "pipeline", visao: "tabela", busca: { leads: "", conteudos: "" }, etapa: "", statusConteudo: "",
  // "Atualizado" e "Interesse" começam ocultas (voltam pelo menu Colunas). O interesse fica nos detalhes da ótica.
  ordem: { leads: "manual", conteudos: "manual" }, ocultas: { leads: new Set(["atualizado_em", "interesse"]), conteudos: new Set() },
};
const ABAS = ["ritmo", "pipeline", "conteudo"];
const VERSAO_COLUNAS = 2; // 2: entraram "Última interação" (visível) e "Interesse" (oculta)
try {
  const p = JSON.parse(localStorage.getItem("renderiza:planilhao") || "{}");
  if (ABAS.includes(p.aba)) ui.aba = p.aba;
  if (p.visao === "kanban") ui.visao = "kanban";
  if (p.ordem) Object.assign(ui.ordem, p.ordem);
  if (p.ocultas) {
    ui.ocultas.leads = new Set(p.ocultas.leads || []);
    ui.ocultas.conteudos = new Set(p.ocultas.conteudos || []);
    if ((p.versaoColunas || 1) < 2) ui.ocultas.leads.add("interesse");
  }
} catch (e) { /* sem armazenamento local: usa o padrão */ }
if (ABAS.includes(location.hash.slice(1))) ui.aba = location.hash.slice(1);
function guardar() {
  try { localStorage.setItem("renderiza:planilhao", JSON.stringify({ aba: ui.aba, visao: ui.visao, ordem: ui.ordem, versaoColunas: VERSAO_COLUNAS, ocultas: { leads: [...ui.ocultas.leads], conteudos: [...ui.ocultas.conteudos] } })); } catch (e) { /* opcional */ }
}

/* ---------- interações por ótica (recalculado a cada desenho) ---------- */
let porLead = new Map();
const daOtica = id => porLead.get(id) || [];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
function textoUltimaInteracao(l) {
  const u = ultimaInteracao(daOtica(l.id));
  if (!u) return "";
  if ((u.precisao || "exata") !== "exata") return (u.ocorreu_em ? MESES_CURTOS[Number(u.ocorreu_em.slice(5, 7)) - 1] + "/" + u.ocorreu_em.slice(2, 4) : "sem data") + " · já contatada";
  return u.ocorreu_em.slice(8, 10) + "/" + u.ocorreu_em.slice(5, 7) + " · " + ({ primeiro_contato: "1º contato", retorno: "Retorno", resposta: "Resposta", anotacao: "Anotação" })[u.tipo];
}

/* ---------- formatação ---------- */
const mesmoDia = (a, b) => a.toDateString() === b.toDateString();
function quando(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const hoje = new Date(), ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (mesmoDia(d, hoje)) return "hoje, " + hora;
  if (mesmoDia(d, ontem)) return "ontem, " + hora;
  return d.toLocaleDateString("pt-BR", d.getFullYear() === hoje.getFullYear() ? { day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" });
}
const dataHora = iso => { const d = new Date(iso); return iso && !Number.isNaN(d.getTime()) ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"; };
const diaMes = v => (v ? v.slice(8, 10) + "/" + v.slice(5, 7) : "");
const diaCompleto = v => (!v ? "" : v.length === 10 ? diaMes(v) + "/" + v.slice(0, 4) : new Date(v).toLocaleDateString("pt-BR"));
const hojeIso = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const dinheiro = n => "R$ " + Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const waHref = v => { const d = String(v || "").replace(/\D/g, ""); return d.length >= 10 ? "https://wa.me/" + (d.length <= 11 ? "55" + d : d) : ""; };
function urlHref(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (/^@[\w.]+$/.test(s)) return "https://www.instagram.com/" + s.slice(1) + "/";
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) return "https://" + s;
  return "";
}
const comparar = (a, b) => String(a || "").localeCompare(String(b || ""), "pt-BR", { sensitivity: "base", numeric: true });
const vaziosNoFim = (a, b, fn) => (!a && !b ? 0 : !a ? 1 : !b ? -1 : fn(a, b));

/* ---------- ordem manual ---------- */
// Linhas sem posição (as antigas) ficam na ordem de criação; novas vão para o fim.
const posicao = l => (typeof l.posicao === "number" ? l.posicao : Date.parse(l.criado_em) / 1000 || 0);
const porPosicao = (a, b) => posicao(a) - posicao(b);
const proximaPosicao = tabela => Math.max(0, ...dados.listar(tabela).map(posicao)) + 1000;
function posicaoAbaixo(tabela, linha) {
  const lista = dados.listar(tabela).sort(porPosicao);
  const prox = lista[lista.findIndex(l => l.id === linha.id) + 1];
  return prox ? (posicao(linha) + posicao(prox)) / 2 : posicao(linha) + 1000;
}
async function mover(tabela, id, alvoId, lado) {
  const lista = dados.listar(tabela).sort(porPosicao).filter(l => l.id !== id);
  const i = lista.findIndex(l => l.id === alvoId);
  const antes = lado === "antes" ? lista[i - 1] : lista[i], depois = lado === "antes" ? lista[i] : lista[i + 1];
  const p = antes && depois ? (posicao(antes) + posicao(depois)) / 2 : antes ? posicao(antes) + 1000 : posicao(depois) - 1000;
  await salvar(tabela, id, { posicao: p });
  aviso("Linha reordenada.");
}
function nomeLivre(tabela, prefixo, campo) {
  const usados = new Set(dados.listar(tabela).map(l => String(l[campo] || "").toLocaleLowerCase("pt-BR")));
  let n = 1, nome;
  do { nome = prefixo + " " + String(n).padStart(2, "0"); n++; } while (usados.has(nome.toLocaleLowerCase("pt-BR")));
  return nome;
}

/* ---------- gravação ---------- */
/** Troca a etapa. Finalizado pede o resultado antes; cancelar não muda nada. */
async function mudarEtapa(lead, nova) {
  if (!nova || nova === lead.etapa) return false;
  const historico = Array.isArray(lead.historico) ? lead.historico : [];
  if (nova === "finalizado") {
    const fim = await pedirFinalizacao(lead);
    if (!fim) return false;
    await salvar("leads", lead.id, { etapa: "finalizado", ...fim, historico: [...historico, linhaDeHistorico(lead.etapa, "finalizado", fim.resultado)] });
    aviso(lead.empresa + ": finalizado como " + (fim.resultado === "ganho" ? "ganho." : "perda."));
    return true;
  }
  await salvar("leads", lead.id, { etapa: nova, historico: [...historico, linhaDeHistorico(lead.etapa, nova)] });
  return true;
}

async function excluir(tabela, linha) {
  const ehLead = tabela === "leads";
  const nome = ehLead ? linha.empresa : linha.titulo;
  const ok = await confirmar({
    titulo: `Excluir ${nome || (ehLead ? "este lead" : "este conteúdo")}?`,
    descricao: ehLead ? "O lead e todo o histórico dele serão excluídos. Não dá para desfazer." : "O conteúdo e os textos dele serão excluídos. Não dá para desfazer.",
    confirmarTexto: ehLead ? "Excluir lead" : "Excluir conteúdo", destrutivo: true,
  });
  if (!ok) return;
  try { await dados.excluir(tabela, linha.id); fecharPainel(); aviso(ehLead ? "Lead excluído." : "Conteúdo excluído."); } catch (e) { falhou(e); }
}

/** Cola de várias células: grava linha por linha e conta o que foi salvo. */
async function colar(tabela, mudancas) {
  let feitas = 0;
  for (const { linha, patch } of mudancas) {
    const final = { ...patch };
    if (tabela === "leads" && "interesse" in final) {
      // Interesse colado também fica no histórico, como quando se muda pelo select.
      const { interesse, ...resto } = final;
      Object.keys(final).forEach(k => delete final[k]);
      Object.assign(final, resto, patchDeInteresse(linha, interesse || "nao_avaliado"));
    }
    if (tabela === "leads" && "etapa" in final) {
      if (final.etapa === "finalizado" && linha.etapa !== "finalizado") { aviso(`${linha.empresa}: para finalizar, troque a etapa na linha (pede ganho ou perda).`, "erro"); delete final.etapa; }
      else if (final.etapa !== linha.etapa) final.historico = [...(final.historico || linha.historico || []), linhaDeHistorico(linha.etapa, final.etapa)];
      else delete final.etapa;
    }
    if (!Object.keys(final).length) continue;
    try { await salvar(tabela, linha.id, final); feitas += Object.keys(patch).length; } catch (e) { break; }
  }
  if (feitas) aviso(`${feitas} ${feitas === 1 ? "célula atualizada" : "células atualizadas"}.`);
}

/** Várias linhas coladas no campo "Adicionar…". Confirma antes de criar. */
async function adicionarVarios(tabela, linhas) {
  const ehLead = tabela === "leads";
  const campos = ehLead ? ["empresa", "whatsapp", "instagram", "proxima_acao"] : ["titulo"];
  const ok = await confirmar({
    titulo: `Adicionar ${linhas.length} ${ehLead ? (linhas.length === 1 ? "lead" : "leads") : (linhas.length === 1 ? "conteúdo" : "conteúdos")}?`,
    descricao: (ehLead ? "Colunas usadas, nesta ordem: Empresa, WhatsApp, Instagram ou site, Próxima ação. " : "Uma linha para cada título. ") + "Primeiros: " + linhas.slice(0, 4).map(l => l[0]).join(", ") + (linhas.length > 4 ? "…" : "."),
    confirmarTexto: "Adicionar",
  });
  if (!ok) return;
  let base = proximaPosicao(tabela), feitas = 0;
  for (const valores of linhas) {
    const linha = ehLead ? novoLead(valores[0]) : novoConteudo(valores[0]);
    campos.slice(1).forEach((c, i) => { if (valores[i + 1]) linha[c] = valores[i + 1]; });
    linha.posicao = base; base += 1000;
    try { await criar(tabela, linha); feitas++; } catch (e) { break; }
  }
  if (feitas) aviso(`${feitas} ${ehLead ? (feitas === 1 ? "lead adicionado" : "leads adicionados") : (feitas === 1 ? "conteúdo adicionado" : "conteúdos adicionados")}.`);
}

/* ---------- ordenações ---------- */
const ORDENS = {
  leads: [
    ["manual", "Minha ordem", porPosicao],
    ["empresa", "Empresa de A a Z", (a, b) => comparar(a.empresa, b.empresa)],
    ["etapa", "Etapa do funil", (a, b) => ordemDaEtapa(a.etapa) - ordemDaEtapa(b.etapa) || porPosicao(a, b)],
    ["followup", "Follow-up mais próximo", (a, b) => vaziosNoFim(a.followup_em, b.followup_em, comparar) || porPosicao(a, b)],
    ["recentes", "Atualizados recentemente", (a, b) => comparar(b.atualizado_em, a.atualizado_em)],
    ["valor", "Maior valor potencial", (a, b) => (b.valor_potencial ?? -1) - (a.valor_potencial ?? -1) || porPosicao(a, b)],
  ],
  conteudos: [
    ["manual", "Minha ordem", porPosicao],
    ["titulo", "Título de A a Z", (a, b) => comparar(a.titulo, b.titulo)],
    ["status", "Status", (a, b) => STATUS_CONTEUDO.findIndex(s => s.id === a.status) - STATUS_CONTEUDO.findIndex(s => s.id === b.status) || porPosicao(a, b)],
    ["data", "Data planejada mais próxima", (a, b) => vaziosNoFim(a.data_planejada, b.data_planejada, comparar) || porPosicao(a, b)],
    ["recentes", "Atualizados recentemente", (a, b) => comparar(b.atualizado_em, a.atualizado_em)],
  ],
};
const ordenacao = tabela => (ORDENS[tabela].find(o => o[0] === ui.ordem[tabela]) || ORDENS[tabela][0]);

function leadsVisiveis({ comEtapa = true } = {}) {
  const q = ui.busca.leads.trim().toLowerCase();
  return dados.listar("leads").filter(l => {
    if (comEtapa && ui.etapa && !passaNoFiltro(l)) return false;
    return !q || [l.empresa, l.whatsapp, l.instagram, l.proxima_acao, l.cidade, l.segmento, l.observacoes].some(v => v && String(v).toLowerCase().includes(q));
  }).sort(ordenacao("leads")[2]);
}
function passaNoFiltro(l) {
  if (ui.etapa === "revisar") return !!l.revisar;
  if (ui.etapa.startsWith("retornos")) {
    const data = retornoPendente(l, daOtica(l.id));
    if (!data) return false;
    const hoje = hojeLocal();
    if (ui.etapa === "retornos_atrasados") return data < hoje;
    if (ui.etapa === "retornos_semana") return data >= hoje && data <= semanaDe(hoje).fim;
    return true;
  }
  return l.etapa === ui.etapa;
}
function conteudosVisiveis() {
  const q = ui.busca.conteudos.trim().toLowerCase();
  return dados.listar("conteudos").filter(c => (!ui.statusConteudo || c.status === ui.statusConteudo) && (!q || [c.titulo, c.texto, c.gancho, c.observacoes].some(v => v && v.toLowerCase().includes(q)))).sort(ordenacao("conteudos")[2]);
}

/* ---------- planilhas ---------- */
const COLUNAS_LEADS = [
  { campo: "empresa", titulo: "Empresa", tipo: "nome", largura: 230 },
  { campo: "etapa", titulo: "Etapa", tipo: "select", largura: 194, ocultavel: false,
    opcoes: l => ETAPAS.map(e => [e.id, e.id === "finalizado" && l.etapa === "finalizado" ? rotuloEtapa(l) : e.nome]),
    classe: l => (l.etapa === "finalizado" ? l.resultado || "" : "") },
  { campo: "whatsapp", titulo: "WhatsApp", tipo: "link", largura: 186, ocultavel: true, placeholder: "(11) 9…", href: waHref },
  { campo: "instagram", titulo: "Instagram ou site", tipo: "link", largura: 160, ocultavel: true, placeholder: "@perfil ou site", href: urlHref },
  { campo: "proxima_acao", titulo: "Próxima ação", tipo: "texto", largura: 190, ocultavel: true, placeholder: "—" },
  { campo: "followup_em", titulo: "Follow-up", tipo: "data", largura: 138, ocultavel: true },
  // O que de fato aconteceu por último (vem das interações; o Follow-up ao lado é só plano).
  { campo: "ultima_interacao", titulo: "Última interação", tipo: "leitura", largura: 150, ocultavel: true, exibir: textoUltimaInteracao },
  { campo: "interesse", titulo: "Interesse", tipo: "select", largura: 160, ocultavel: true,
    opcoes: () => INTERESSES.map(x => [x.id, x.nome]), classe: l => "interesse-" + (l.interesse || "nao_avaliado") },
  { campo: "valor_potencial", titulo: "Valor potencial", tipo: "valor", largura: 128, ocultavel: true, placeholder: "—" },
  { campo: "atualizado_em", titulo: "Atualizado", tipo: "leitura", largura: 112, ocultavel: true, exibir: l => quando(l.atualizado_em) },
];

const planilhaLeads = criarPlanilha({
  host: $("#grade-leads"),
  colunas: COLUNAS_LEADS,
  linhas: () => leadsVisiveis(),
  buscar: id => dados.buscar("leads", id),
  podeEditar: dados.podeEditar,
  manual: () => ui.ordem.leads === "manual",
  ocultas: () => ui.ocultas.leads,
  aoOcultar: campo => { ui.ocultas.leads.add(campo); guardar(); render(); },
  marcas: l => [
    l.revisar ? { texto: "revisar", titulo: "Veio do painel antigo e precisa de revisão" } : null,
    l.nao_contatar ? { texto: "não contatar", classe: "marca-parar", titulo: "Pediu para não receber mais contato" } : null,
  ].filter(Boolean),
  acoesExtras: l => [{ texto: "Registrar interação…", icone: "conversa", acao: () => abrirRegistro(l.id), desativado: !dados.podeEditar() }],
  aoEditar: (lead, c, valor) => (c.campo === "etapa" ? mudarEtapa(lead, valor)
    : c.campo === "interesse" ? salvar("leads", lead.id, patchDeInteresse(lead, valor || "nao_avaliado"))
    : salvar("leads", lead.id, { [c.campo]: valor })),
  aoAbrir: l => abrirPainel("leads", l.id),
  aoInserirAbaixo: async l => { const nova = novoLead(nomeLivre("leads", "Novo lead", "empresa")); nova.posicao = posicaoAbaixo("leads", l); const r = await criar("leads", nova); aviso(ui.ordem.leads === "manual" ? `${r.empresa} criado logo abaixo.` : `${r.empresa} criado e posicionado pela ordenação atual.`); return r; },
  aoMover: (id, alvo, lado) => mover("leads", id, alvo, lado),
  aoExcluir: l => excluir("leads", l),
  aoAdicionar: async texto => { const nova = novoLead(texto); nova.posicao = proximaPosicao("leads"); return criar("leads", nova); },
  aoAdicionarVarios: linhas => adicionarVarios("leads", linhas),
  aoColar: mudancas => colar("leads", mudancas),
  aoErro: msg => aviso(msg, "erro"),
  rodape: () => {
    const lista = leadsVisiveis();
    const abertos = lista.filter(l => l.etapa !== "finalizado"), ganhos = lista.filter(l => l.etapa === "finalizado" && l.resultado === "ganho");
    const soma = (ls, campo) => ls.reduce((s, l) => s + (Number(l[campo]) || 0), 0);
    return [
      { rotulo: `Em aberto · ${abertos.length} ${abertos.length === 1 ? "lead" : "leads"}`, valores: { valor_potencial: dinheiro(soma(abertos, "valor_potencial")) } },
      { rotulo: `Fechados · ${ganhos.length} ${ganhos.length === 1 ? "ganho" : "ganhos"}`, valores: { valor_potencial: dinheiro(soma(ganhos, "valor_fechado")) }, secundaria: true },
    ];
  },
  vazio: { titulo: "Uma linha para cada empresa.", texto: "Adicione a primeira abaixo, ou cole uma lista de nomes." },
  rotuloAdicionar: "Adicionar lead…",
  nomeItem: "lead",
});

const COLUNAS_CONTEUDOS = [
  { campo: "titulo", titulo: "Título ou ideia", tipo: "nome", largura: 340 },
  { campo: "canal", titulo: "Canal", tipo: "select", largura: 150, ocultavel: true, opcoes: () => [["", "—"], ...CANAIS.map(c => [c.id, c.nome])] },
  { campo: "status", titulo: "Status", tipo: "select", largura: 150, ocultavel: false, opcoes: () => STATUS_CONTEUDO.map(s => [s.id, s.nome]), classe: c => (c.status === "publicado" ? "ganho" : "") },
  { campo: "data_planejada", titulo: "Data planejada", tipo: "data", largura: 150, ocultavel: true },
  { campo: "link_publicacao", titulo: "Link da publicação", tipo: "link", largura: 240, ocultavel: true, placeholder: "https://…", href: urlHref },
];

const planilhaConteudos = criarPlanilha({
  host: $("#grade-conteudos"),
  colunas: COLUNAS_CONTEUDOS,
  linhas: conteudosVisiveis,
  buscar: id => dados.buscar("conteudos", id),
  podeEditar: dados.podeEditar,
  manual: () => ui.ordem.conteudos === "manual",
  ocultas: () => ui.ocultas.conteudos,
  aoOcultar: campo => { ui.ocultas.conteudos.add(campo); guardar(); render(); },
  marcas: c => (c.revisar ? [{ texto: "revisar", titulo: "Veio do painel antigo e precisa de revisão" }] : []),
  aoEditar: (c, col, valor) => salvar("conteudos", c.id, { [col.campo]: col.tipo === "select" ? valor || null : valor }),
  aoAbrir: c => abrirPainel("conteudos", c.id),
  aoInserirAbaixo: async c => { const nova = novoConteudo(nomeLivre("conteudos", "Nova ideia", "titulo")); nova.posicao = posicaoAbaixo("conteudos", c); const r = await criar("conteudos", nova); aviso(`${r.titulo} criada logo abaixo.`); return r; },
  aoMover: (id, alvo, lado) => mover("conteudos", id, alvo, lado),
  aoExcluir: c => excluir("conteudos", c),
  aoAdicionar: async texto => { const nova = novoConteudo(texto); nova.posicao = proximaPosicao("conteudos"); return criar("conteudos", nova); },
  aoAdicionarVarios: linhas => adicionarVarios("conteudos", linhas),
  aoColar: mudancas => colar("conteudos", mudancas),
  aoErro: msg => aviso(msg, "erro"),
  rodape: () => {
    const lista = conteudosVisiveis();
    const conta = id => lista.filter(c => c.status === id).length;
    return [{ rotulo: `${lista.length} ${lista.length === 1 ? "conteúdo" : "conteúdos"}`, valores: {} },
      { rotulo: `${conta("ideia")} ideias · ${conta("em_producao")} em produção · ${conta("publicado")} publicados`, valores: {}, secundaria: true }];
  },
  vazio: { titulo: "Uma linha para cada ideia.", texto: "Guarde a primeira abaixo. Não precisa de data." },
  rotuloAdicionar: "Adicionar ideia…",
  nomeItem: "conteúdo",
});

/* ---------- barra de ferramentas ---------- */
function abas(itens, atual, aoEscolher, rotulo) {
  return h("div", { class: "tabs-list", role: "tablist", "aria-label": rotulo }, ...itens.map(([valor, texto, ic]) =>
    h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(atual === valor), "data-state": atual === valor ? "active" : "inactive", onclick: () => aoEscolher(valor) }, ic ? icone(ic, 15) : null, texto)));
}

function botaoOrdenar(tabela) {
  const atual = ordenacao(tabela);
  return botaoMenu([icone("ordenar", 16), h("span", { text: atual[0] === "manual" ? "Ordenar" : atual[1] })],
    () => [{ rotulo: "Ordenar linhas" }, ...ORDENS[tabela].map(([id, texto]) => ({ tipo: "radio", texto, marcado: ui.ordem[tabela] === id, acao: () => { ui.ordem[tabela] = id; guardar(); render(); } }))],
    { alinhar: "end" });
}

function botaoColunas(tabela, colunas) {
  const ocultas = ui.ocultas[tabela];
  const ocultaveis = colunas.filter(c => c.ocultavel);
  const qtd = ocultaveis.filter(c => ocultas.has(c.campo)).length;
  return botaoMenu([icone("colunas", 16), h("span", { text: "Colunas" }), qtd ? h("span", { class: "hidden-column-count", text: String(qtd) }) : null],
    () => [{ rotulo: "Exibir no Planilhão" },
      ...ocultaveis.map(c => ({ tipo: "check", texto: c.titulo, marcado: !ocultas.has(c.campo), acao: marcado => { if (marcado) ocultas.delete(c.campo); else ocultas.add(c.campo); guardar(); render(); } })),
      ...(qtd ? [{ separador: true }, { texto: "Mostrar todas", icone: "mostrar", acao: () => { ocultas.clear(); guardar(); render(); } }] : [])],
    { alinhar: "end", classe: "btn btn-outline" });
}

function seletorEtapa() {
  const temRevisar = dados.listar("leads").some(l => l.revisar);
  if (ui.etapa === "revisar" && !temRevisar) ui.etapa = "";
  const sel = h("select", { class: "select-trigger", "aria-label": "Filtrar por etapa" },
    h("option", { value: "", text: "Todas as etapas" }),
    h("optgroup", { label: "Etapa" }, ...ETAPAS.map(e => h("option", { value: e.id, text: e.nome }))),
    h("optgroup", { label: "Retornos previstos" },
      h("option", { value: "retornos_atrasados", text: "Retornos atrasados" }),
      h("option", { value: "retornos_semana", text: "Retornos desta semana" }),
      h("option", { value: "retornos", text: "Todos os retornos pendentes" })),
    temRevisar ? h("option", { value: "revisar", text: "Marcados para revisar" }) : null);
  sel.value = ui.etapa;
  sel.addEventListener("change", () => { ui.etapa = sel.value; render(); });
  return sel;
}

function renderBarraPipeline() {
  const esquerda = abas([["tabela", "Tabela", "tabela"], ["kanban", "Kanban", "kanban"]], ui.visao, v => { ui.visao = v; guardar(); render(); }, "Visualização");
  const direita = ui.visao === "tabela"
    ? h("div", { class: "sheet-actions" }, seletorEtapa(), botaoOrdenar("leads"), botaoColunas("leads", COLUNAS_LEADS))
    : h("div", { class: "sheet-actions" }, h("span", { class: "muted", text: "Arraste os cartões entre as etapas." }));
  $("#barra-pipeline").replaceChildren(esquerda, direita);
}

function renderBarraConteudo() {
  const esquerda = abas([["", "Todos"], ...STATUS_CONTEUDO.map(s => [s.id, s.id === "ideia" ? "Ideias" : s.id === "publicado" ? "Publicados" : s.nome])], ui.statusConteudo, v => { ui.statusConteudo = v; render(); }, "Filtrar por status");
  $("#barra-conteudo").replaceChildren(esquerda, h("div", { class: "sheet-actions" }, botaoOrdenar("conteudos"), botaoColunas("conteudos", COLUNAS_CONTEUDOS)));
}

/* ---------- kanban (mesmos dados da tabela) ---------- */
let arrastandoCartao = null;
const inputKanban = h("input", { type: "text", placeholder: "Adicionar lead…", "aria-label": "Adicionar lead", autocomplete: "off", maxlength: "120" });
inputKanban.addEventListener("keydown", async e => {
  if (e.key !== "Enter" || !inputKanban.value.trim() || inputKanban.disabled) return;
  inputKanban.disabled = true;
  try { const nova = novoLead(inputKanban.value); nova.posicao = proximaPosicao("leads"); await criar("leads", nova); inputKanban.value = ""; } catch (err) { /* aviso já mostrado */ }
  finally { inputKanban.disabled = !dados.podeEditar(); inputKanban.focus(); }
});

function renderKanban() {
  const leads = leadsVisiveis({ comEtapa: false });
  const editavel = dados.podeEditar();
  inputKanban.disabled = !editavel;
  $("#kanban").replaceChildren(...ETAPAS.map((etapa, i) => {
    const itens = leads.filter(l => l.etapa === etapa.id);
    const cartoes = h("div", { class: "kanban-cards" }, ...itens.map(l => {
      const detalhe = [l.proxima_acao, diaMes(l.followup_em)].filter(Boolean).join(" · ");
      const cartao = h("div", { class: "kanban-card", role: "button", tabindex: "0", draggable: editavel ? "true" : null,
        onclick: () => abrirPainel("leads", l.id), onkeydown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirPainel("leads", l.id); } } },
        h("strong", { text: l.empresa || "Sem nome" }),
        detalhe ? h("small", { text: detalhe }) : null,
        h("span", { class: "kanban-chips" },
          l.etapa === "finalizado" && l.resultado ? h("span", { class: "resultado-chip " + l.resultado, text: l.resultado === "ganho" ? "Ganho" : "Perda" }) : null,
          l.interesse && l.interesse !== "nao_avaliado" ? h("span", { class: "chip-interesse " + l.interesse, text: nomeDoInteresse(l.interesse) }) : null,
          l.nao_contatar ? h("span", { class: "chip-parar", text: "não contatar" }) : null));
      cartao.addEventListener("dragstart", e => { arrastandoCartao = l.id; cartao.classList.add("arrastando"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.id); });
      cartao.addEventListener("dragend", () => { arrastandoCartao = null; cartao.classList.remove("arrastando"); });
      return cartao;
    }));
    const coluna = h("section", { class: "kanban-col", "data-etapa": etapa.id, "aria-label": etapa.nome },
      h("header", {}, h("span", { text: etapa.nome }), h("small", { text: String(itens.length) })),
      i === 0 ? h("div", { class: "kanban-add" }, icone("mais", 15), inputKanban) : null,
      cartoes);
    coluna.addEventListener("dragover", e => { if (arrastandoCartao) { e.preventDefault(); coluna.classList.add("alvo"); } });
    coluna.addEventListener("dragleave", () => coluna.classList.remove("alvo"));
    coluna.addEventListener("drop", async e => {
      e.preventDefault(); coluna.classList.remove("alvo");
      const lead = dados.buscar("leads", e.dataTransfer.getData("text/plain") || arrastandoCartao);
      if (lead) { try { await mudarEtapa(lead, etapa.id); } catch (err) { /* aviso já mostrado */ } }
    });
    return coluna;
  }));
}

/* ---------- painel lateral ---------- */
const painel = { tabela: null, id: null, vinculos: [] };
const vincular = fn => painel.vinculos.push(fn);

function abrirPainel(tabela, id, { registrar = false } = {}) {
  if (!dados.buscar(tabela, id)) return;
  painel.tabela = tabela; painel.id = id; painel.vinculos = [];
  $("#painel-tipo").textContent = tabela === "leads" ? "LEAD" : "CONTEÚDO";
  const corpo = $("#painel-corpo");
  corpo.replaceChildren(...(tabela === "leads" ? corpoDoLead(id) : corpoDoConteudo(id)));
  corpo.scrollTop = 0;
  $("#painel").hidden = false; $("#painel-fundo").hidden = false;
  document.body.classList.add("travado");
  atualizarPainel();
  $("#fechar-painel").focus();
  if (registrar && tabela === "leads") abrirRegistro(id);
}
function fecharPainel() {
  if (!painel.tabela) return;
  painel.tabela = null; painel.vinculos = [];
  $("#painel").hidden = true; $("#painel-fundo").hidden = true;
  if (!janelaAberta()) document.body.classList.remove("travado");
}
function atualizarPainel() {
  if (!painel.tabela) return;
  const linha = dados.buscar(painel.tabela, painel.id);
  if (!linha) { fecharPainel(); return; }
  painel.vinculos.forEach(fn => fn(linha));
}
$("#fechar-painel").addEventListener("click", fecharPainel);
$("#painel-fundo").addEventListener("click", fecharPainel);

/** Campo do painel: salva ao sair; se falhar, volta ao valor do banco. */
function campo(tabela, id, { campo: nome, rotulo, tipo = "texto", opcoes, largo, duplo, placeholder, href, linhas: nLinhas, classe }) {
  let el;
  if (tipo === "area") el = h("textarea", { rows: String(nLinhas || 4), placeholder: placeholder || "" });
  else if (tipo === "select") el = h("select", {}, ...opcoes.map(([v, t]) => h("option", { value: v, text: t })));
  else el = h("input", { type: tipo === "data" ? "date" : "text", placeholder: placeholder || "", inputmode: tipo === "valor" ? "decimal" : null, autocomplete: "off" });
  if (classe) el.className = classe;
  const mostrar = (linha, forcar) => {
    if (document.activeElement === el && !forcar) return;
    const v = linha[nome];
    el.value = tipo === "valor" ? formatarValor(v) : v == null ? "" : v;
  };
  el.addEventListener("change", async () => {
    const linha = dados.buscar(tabela, id); if (!linha) return;
    let valor;
    if (tipo === "valor") { valor = lerValor(el.value); if (valor === undefined) { aviso("Use só números em " + rotulo + ".", "erro"); mostrar(linha, true); return; } }
    else if (tipo === "data" || tipo === "select") valor = el.value || null;
    else valor = tipo === "area" ? el.value : el.value.trim();
    if ((valor ?? "") === (linha[nome] ?? "")) { mostrar(linha, true); return; }
    try { await salvar(tabela, id, { [nome]: valor }); } catch (e) { /* aviso já mostrado */ }
    const atual = dados.buscar(tabela, id); if (atual) mostrar(atual, true);
  });
  if (tipo !== "area") el.addEventListener("keydown", e => { if (e.key === "Enter" && el.tagName === "INPUT") { e.preventDefault(); el.blur(); } });
  vincular(linha => { mostrar(linha, false); el.disabled = !dados.podeEditar(); });
  let controle = el;
  if (href) {
    const a = h("a", { class: "ir", target: "_blank", rel: "noopener noreferrer", "aria-label": "Abrir " + rotulo, title: "Abrir" }, icone("abrirLink", 14));
    vincular(linha => { const u = href(linha[nome]); a.hidden = !u; if (u) a.href = u; });
    controle = h("div", { class: "campo-link" }, el, a);
  }
  if (!rotulo) el.setAttribute("aria-label", nome === "observacoes" ? "Observações" : nome);
  return h("label", { class: "campo" + (largo ? " largo" : "") + (duplo ? " duplo" : "") }, rotulo ? h("span", { text: rotulo }) : null, controle);
}
const secao = (titulo, ...filhos) => h("section", { class: "painel-secao" }, titulo ? h("h3", { class: "section-eyebrow", text: titulo }) : null, ...filhos);
const grade = (...filhos) => h("div", { class: "campos" }, ...filhos);

function caixaRevisar(tabela, id) {
  const motivo = h("span");
  const caixa = h("div", { class: "grid-notice revisar-notice" }, motivo,
    h("button", { class: "text-link", type: "button", onclick: async () => { try { await dados.salvar(tabela, id, { revisar: false }); aviso("Marcado como revisado."); } catch (e) { falhou(e); } } }, "Marcar como revisado", icone("certo", 14)));
  vincular(l => { caixa.hidden = !l.revisar; motivo.textContent = l.revisar_motivo || "Registro vindo do painel antigo. Confira os dados."; });
  return caixa;
}
function rodapePainel(tabela, id) {
  const datas = h("div", { class: "painel-datas" });
  vincular(l => datas.replaceChildren(h("span", { text: "Criado em " + dataHora(l.criado_em) }), h("span", { text: "Atualizado em " + dataHora(l.atualizado_em) })));
  const excluirBtn = h("button", { class: "btn btn-ghost-destructive btn-sm", type: "button", onclick: () => { const l = dados.buscar(tabela, id); if (l) excluir(tabela, l); } }, icone("lixo", 15), tabela === "leads" ? "Excluir lead" : "Excluir conteúdo");
  vincular(() => { excluirBtn.disabled = !dados.podeEditar(); });
  return h("div", { class: "painel-pe" }, datas, excluirBtn);
}

function corpoDoLead(id) {
  const titulo = campo("leads", id, { campo: "empresa", classe: "titulo-painel" });
  titulo.querySelector("input").setAttribute("aria-label", "Empresa");

  // Etapa (funil) e interesse (o que a ótica demonstrou) são coisas separadas: um não muda o outro.
  const etapa = h("select", { class: "select-trigger largo", "aria-label": "Etapa" }, ...ETAPAS.map(e => h("option", { value: e.id, text: e.nome })));
  etapa.addEventListener("change", async () => {
    const lead = dados.buscar("leads", id);
    try { if (lead) await mudarEtapa(lead, etapa.value); } catch (e) { /* aviso já mostrado */ }
    const atual = dados.buscar("leads", id); if (atual) etapa.value = atual.etapa;
  });
  vincular(l => {
    if (document.activeElement !== etapa) etapa.value = l.etapa;
    etapa.options[ETAPAS.length - 1].textContent = l.etapa === "finalizado" ? rotuloEtapa(l) : "Finalizado";
    etapa.className = "select-trigger largo " + (l.etapa === "finalizado" ? l.resultado || "" : "");
    etapa.disabled = !dados.podeEditar();
  });
  const interesse = h("select", { class: "select-trigger largo", "aria-label": "Interesse" }, ...INTERESSES.map(x => h("option", { value: x.id, text: x.nome })));
  interesse.addEventListener("change", async () => {
    const lead = dados.buscar("leads", id);
    try { if (lead) await salvar("leads", id, patchDeInteresse(lead, interesse.value)); } catch (e) { /* aviso já mostrado */ }
    const atual = dados.buscar("leads", id); if (atual) interesse.value = atual.interesse || "nao_avaliado";
  });
  vincular(l => {
    if (document.activeElement !== interesse) interesse.value = l.interesse || "nao_avaliado";
    interesse.className = "select-trigger largo interesse-" + (l.interesse || "nao_avaliado");
    interesse.disabled = !dados.podeEditar();
  });
  const motivoInteresse = campo("leads", id, { campo: "interesse_motivo", rotulo: "Por que esse nível de interesse", largo: true, placeholder: "Ex.: pediu o vídeo e perguntou o preço" });
  vincular(l => { motivoInteresse.hidden = (l.interesse || "nao_avaliado") === "nao_avaliado" && !l.interesse_motivo; });

  // Plano (o que deve acontecer depois). Não é interação: não conta no placar.
  const cadencia = h("p", { class: "dica-cadencia", hidden: true });
  vincular(l => {
    const ciclo = cicloVigente(dados.listar("ciclos"), hojeLocal());
    const sug = retornoSugerido(l, daOtica(id), ciclo);
    const mostrar = sug && sug.data !== l.followup_em && dados.podeEditar();
    cadencia.hidden = !mostrar;
    if (mostrar) cadencia.replaceChildren(icone("calendario", 14),
      h("span", { text: `Cadência sugere ${diaCompleto(sug.data)} (${sug.texto}).` }),
      h("button", { type: "button", class: "text-link", onclick: async () => { try { await salvar("leads", id, { followup_em: sug.data }); } catch (e) { /* aviso já mostrado */ } } }, "Usar esta data"));
  });
  const naoContatar = h("input", { type: "checkbox" });
  naoContatar.addEventListener("change", async () => {
    const lead = dados.buscar("leads", id);
    try { if (lead) await salvar("leads", id, patchDeNaoContatar(lead, naoContatar.checked)); } catch (e) { /* aviso já mostrado */ }
    const atual = dados.buscar("leads", id); if (atual) naoContatar.checked = !!atual.nao_contatar;
  });
  vincular(l => { naoContatar.checked = !!l.nao_contatar; naoContatar.disabled = !dados.podeEditar(); });

  const motivo = campo("leads", id, { campo: "motivo_perda", rotulo: "Motivo da perda", largo: true, placeholder: "Opcional" });
  const fechamento = secao("Fechamento", grade(
    campo("leads", id, { campo: "resultado", rotulo: "Resultado", tipo: "select", opcoes: RESULTADOS.map(r => [r.id, r.nome]) }),
    campo("leads", id, { campo: "data_fechamento", rotulo: "Data do fechamento", tipo: "data" }),
    campo("leads", id, { campo: "valor_fechado", rotulo: "Valor fechado", tipo: "valor", placeholder: "R$" }),
    motivo));
  vincular(l => { fechamento.hidden = l.etapa !== "finalizado"; motivo.hidden = l.resultado !== "perda"; });

  // O que aconteceu: interações registradas + mudanças de etapa e de interesse.
  const linhaDoTempo = criarLinhaDoTempo(id);
  vincular(l => linhaDoTempo.atualizar(l));
  const registrar = h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => abrirRegistro(id) }, icone("conversa", 15), "Registrar interação");
  vincular(() => { registrar.disabled = !dados.podeEditar(); });

  return [
    titulo,
    caixaRevisar("leads", id),
    grade(
      h("div", { class: "campo" }, h("span", { text: "Etapa" }), etapa),
      h("div", { class: "campo" }, h("span", { text: "Interesse" }), interesse),
      campo("leads", id, { campo: "followup_em", rotulo: "Follow-up (plano)", tipo: "data" }),
      campo("leads", id, { campo: "proxima_acao", rotulo: "Próxima ação", duplo: true, placeholder: "O que fazer no próximo contato" }),
      campo("leads", id, { campo: "valor_potencial", rotulo: "Valor potencial", tipo: "valor", placeholder: "R$" }),
      motivoInteresse),
    cadencia,
    h("label", { class: "check-painel" }, naoContatar, h("span", {}, h("strong", { text: "Não contatar mais." }), " A ótica pediu para não receber contato: sai da fila de retornos.")),
    fechamento,
    h("section", { class: "painel-secao secao-interacoes" },
      h("div", { class: "secao-topo" }, h("h3", { class: "section-eyebrow", text: "Interações" }), registrar),
      linhaDoTempo.el),
    secao("Contato", grade(
      campo("leads", id, { campo: "whatsapp", rotulo: "WhatsApp", href: waHref, placeholder: "(11) 9…" }),
      campo("leads", id, { campo: "instagram", rotulo: "Instagram ou site", href: urlHref, placeholder: "@perfil" }),
      campo("leads", id, { campo: "site_atual", rotulo: "Site atual", href: urlHref, placeholder: "https://…" }),
      campo("leads", id, { campo: "cidade", rotulo: "Cidade", duplo: true }),
      campo("leads", id, { campo: "segmento", rotulo: "Segmento", placeholder: "Ex.: Ótica" }))),
    secao("Demo", h("div", { class: "campos campos-2" },
      campo("leads", id, { campo: "link_demo", rotulo: "Link da demo", href: urlHref, placeholder: "https://…" }),
      campo("leads", id, { campo: "link_gravacao", rotulo: "Link da gravação", href: urlHref, placeholder: "https://…" }))),
    secao("Observações", campo("leads", id, { campo: "observacoes", tipo: "area", linhas: 4, placeholder: "Livre, para quando quiser anotar algo." })),
    rodapePainel("leads", id),
  ];
}

function corpoDoConteudo(id) {
  const titulo = campo("conteudos", id, { campo: "titulo", classe: "titulo-painel" });
  titulo.querySelector("input").setAttribute("aria-label", "Título ou ideia");
  return [
    titulo,
    caixaRevisar("conteudos", id),
    grade(
      campo("conteudos", id, { campo: "canal", rotulo: "Canal", tipo: "select", opcoes: [["", "—"], ...CANAIS.map(c => [c.id, c.nome])] }),
      campo("conteudos", id, { campo: "status", rotulo: "Status", tipo: "select", opcoes: STATUS_CONTEUDO.map(s => [s.id, s.nome]) }),
      campo("conteudos", id, { campo: "data_planejada", rotulo: "Data planejada", tipo: "data" }),
      campo("conteudos", id, { campo: "link_publicacao", rotulo: "Link da publicação", href: urlHref, placeholder: "https://…" })),
    secao("Texto", grade(
      campo("conteudos", id, { campo: "gancho", rotulo: "Gancho", largo: true, placeholder: "A primeira frase ou a primeira imagem" }),
      campo("conteudos", id, { campo: "texto", rotulo: "Texto ou legenda", tipo: "area", linhas: 7, largo: true }),
      campo("conteudos", id, { campo: "cta", rotulo: "Chamada para ação", largo: true }))),
    secao("Arquivos", grade(
      campo("conteudos", id, { campo: "link_imagem", rotulo: "Link da imagem", href: urlHref, largo: true, placeholder: "https://…" }),
      campo("conteudos", id, { campo: "link_video", rotulo: "Link do vídeo", href: urlHref, largo: true, placeholder: "https://…" }))),
    secao("Observações", campo("conteudos", id, { campo: "observacoes", tipo: "area", linhas: 4 })),
    rodapePainel("conteudos", id),
  ];
}

/* ---------- janela de finalização ---------- */
function pedirFinalizacao(lead) {
  return new Promise(resolve => {
    let resposta = null;
    const radio = (valor, texto) => h("label", { class: "opcao-resultado " + valor }, h("input", { type: "radio", name: "resultado", value: valor, checked: lead.resultado === valor || null }), h("span", { text: texto }));
    const valor = h("input", { type: "text", inputmode: "decimal", placeholder: "Ex.: 2.500,00", value: formatarValor(lead.valor_fechado ?? lead.valor_potencial) });
    const motivo = h("input", { type: "text", placeholder: "Opcional", value: lead.motivo_perda || "" });
    const data = h("input", { type: "date", value: lead.data_fechamento || hojeIso() });
    const campoValor = h("label", {}, "Valor fechado (R$)", valor);
    const campoMotivo = h("label", {}, "Motivo da perda", motivo);
    const erro = h("p", { class: "erro-form", hidden: true });
    const form = h("form", { class: "dialog-form" },
      h("div", { class: "opcoes-resultado", role: "radiogroup", "aria-label": "Resultado" }, radio("ganho", "Ganho"), radio("perda", "Perda")),
      campoValor, campoMotivo, h("label", {}, "Data do fechamento", data), erro,
      h("button", { type: "submit", class: "btn btn-primary btn-lg" }, "Finalizar", icone("direita", 16)));
    const escolhido = () => (form.querySelector("input[name=resultado]:checked") || {}).value;
    const ajustar = () => { const r = escolhido(); campoValor.hidden = r !== "ganho"; campoMotivo.hidden = r !== "perda"; };
    form.addEventListener("change", ajustar); ajustar();
    const { fechar } = abrirJanela({ titulo: "Finalizar " + (lead.empresa || "lead"), descricao: "Ganho ou perda. Dá para ajustar depois no painel do lead.", conteudo: form, aoFechar: () => resolve(resposta) });
    form.addEventListener("submit", e => {
      e.preventDefault();
      const resultado = escolhido();
      if (!resultado) { erro.textContent = "Escolha Ganho ou Perda."; erro.hidden = false; return; }
      const v = lerValor(valor.value);
      if (resultado === "ganho" && v === undefined) { erro.textContent = "Use só números no valor fechado."; erro.hidden = false; return; }
      resposta = { resultado, valor_fechado: resultado === "ganho" ? v : null, motivo_perda: resultado === "perda" ? motivo.value.trim() || null : null, data_fechamento: data.value || hojeIso() };
      fechar();
    });
  });
}

/* ---------- exportar ---------- */
async function exportar() {
  const f = dados.fonte();
  if (f && f.exportarSql) {
    let sql;
    try { sql = await f.exportarSql(); } catch (e) { aviso("Não consegui ler os dados para exportar: " + e.message, "erro"); return; }
    const area = h("textarea", { class: "sql", readonly: true, "aria-label": "SQL de importação", value: sql });
    const copiar = h("button", { class: "btn btn-primary", type: "button" }, icone("copiar", 16), "Copiar SQL");
    copiar.addEventListener("click", () => {
      const selecionar = () => { area.focus(); area.select(); aviso("SQL selecionado. Copie com Ctrl+C."); };
      try { navigator.clipboard.writeText(sql).then(() => aviso("SQL copiado."), selecionar); } catch (e) { selecionar(); }
    });
    abrirJanela({ titulo: "Levar os dados para o Supabase", descricao: "No Supabase, rode supabase/schema.sql, crie seu usuário em Authentication > Users e cole este SQL no SQL Editor. Pode rodar de novo sem duplicar nada.", larga: true, conteudo: [area, h("div", { class: "janela-acoes" }, copiar)] });
    return;
  }
  const conteudo = JSON.stringify({ exportadoEm: new Date().toISOString(), leads: dados.listar("leads"), interacoes: dados.listar("interacoes"), ciclos: dados.listar("ciclos"), conteudos: dados.listar("conteudos") }, null, 2);
  const a = document.createElement("a"), url = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
  a.href = url; a.download = "renderiza-" + hojeIso() + ".json"; a.click(); URL.revokeObjectURL(url);
}
$("#exportar").addEventListener("click", exportar);

/* ---------- estado da conexão ---------- */
function renderEstadoSalvo() {
  const c = dados.estadoDaConexao(), el = $("#save-state");
  let ic = "certo", texto = "Alterações salvas", classe = "saved";
  if (c.estado === "conectando") { ic = "carregando"; texto = "Carregando…"; classe = "loading"; }
  else if (c.estado === "offline") { ic = "alerta"; texto = "Sem conexão com o banco"; classe = "error"; }
  else if (c.salvando) { ic = "carregando"; texto = "Salvando…"; classe = "saving"; }
  el.className = "save-state " + classe;
  el.replaceChildren(icone(ic, 14, ic === "carregando" ? "spin" : ""), h("span", { text: texto }));
}

function renderBanner() {
  const c = dados.estadoDaConexao(), el = $("#banner");
  if (c.estado !== "offline") { el.hidden = true; return; }
  el.hidden = false;
  el.replaceChildren(icone("alerta", 20), h("div", {}, h("strong", { text: "Sem conexão com o banco" }),
    h("p", { text: "Nada do que for digitado agora seria salvo, então a edição fica bloqueada até o banco responder." + (c.detalhe && !/Sem conexão/.test(c.detalhe) ? " (" + c.detalhe + ")" : "") }),
    h("small", { text: "Tentamos de novo sozinhos a cada 15 segundos." })),
    h("button", { class: "btn btn-outline btn-sm", type: "button", onclick: () => dados.reconectar() }, "Tentar novamente"));
}

/* ---------- telas fora do painel (login e configuração) ---------- */
function renderAcesso(estado) {
  const tela = $("#tela-acesso");
  const marca = h("div", { class: "login-brand" }, icone("camadas", 26), "renderiza", h("span", { text: "." }));
  if (estado === "conectando") { tela.replaceChildren(h("div", { class: "login-card" }, marca, h("p", { class: "login-intro", text: "Conectando ao banco…" }))); return; }
  if (estado === "sem_config") {
    tela.replaceChildren(h("div", { class: "login-card" }, marca, h("h1", { text: "Banco não configurado" }),
      h("div", { class: "login-setup" }, h("p", {}, "Defina ", h("code", { text: "SUPABASE_URL" }), " e ", h("code", { text: "SUPABASE_ANON_KEY" }), " nas variáveis de ambiente do projeto na Vercel (ou em ", h("code", { text: ".env.local" }), " para rodar local) e recarregue a página.")),
      h("p", { class: "login-motto", text: "Sem banco, o painel não mostra nem salva nada." })));
    return;
  }
  if (tela.querySelector("form.login-form")) return;
  const email = h("input", { type: "email", autocomplete: "username", required: true, placeholder: "voce@email.com" });
  const senha = h("input", { type: "password", autocomplete: "current-password", required: true });
  const erro = h("p", { class: "login-error", hidden: true });
  const botao = h("button", { type: "submit" }, "Entrar", icone("direita", 16));
  const form = h("form", { class: "login-form" }, h("label", {}, "E-mail", email), h("label", {}, "Senha", senha), erro, botao);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    botao.disabled = true; erro.hidden = true;
    try { await dados.entrar(email.value.trim(), senha.value); }
    catch (err) { erro.textContent = err.message; erro.hidden = false; }
    finally { botao.disabled = false; }
  });
  tela.replaceChildren(h("div", { class: "login-card" }, marca, h("h1", { text: "Entrar no painel" }), h("p", { class: "login-intro", text: "Use o usuário criado no Supabase." }), form));
  setTimeout(() => email.focus(), 0);
}

/* ---------- desenho geral ---------- */
const TITULOS = {
  ritmo: ["Ritmo", "Prospecção e relacionamento: o que você fez, não o que vendeu."],
  pipeline: ["Pipeline", "Seus leads, da primeira conversa ao fechamento. É só clicar e editar."],
  conteudo: ["Conteúdo", "Ideias e publicações da Renderiza. É só clicar e editar."],
};

function render() {
  const c = dados.estadoDaConexao();
  const comDados = c.estado === "online" || c.estado === "offline";
  $("#app").hidden = !comDados;
  $("#tela-acesso").hidden = comDados;
  if (!comDados) { fecharPainel(); renderAcesso(c.estado); return; }
  $("#tela-acesso").replaceChildren();

  porLead = indexar(dados.listar("leads"), dados.listar("interacoes"));
  renderEstadoSalvo();
  renderBanner();
  const f = dados.fonte();
  $("#sair").hidden = !(f && f.precisaLogin);
  $("#exportar").lastChild.textContent = f && f.exportarSql ? "Levar dados para o Supabase" : "Exportar meus dados";
  document.querySelectorAll(".nav-button").forEach(b => { const ativo = b.dataset.aba === ui.aba; b.dataset.active = String(ativo); b.setAttribute("aria-current", ativo ? "page" : "false"); });
  $("#migalha").textContent = TITULOS[ui.aba][0];
  $("#titulo").textContent = TITULOS[ui.aba][0];
  $("#subtitulo").textContent = TITULOS[ui.aba][1];
  const busca = $("#busca");
  if (document.activeElement !== busca) busca.value = ui.busca[ui.aba === "pipeline" ? "leads" : "conteudos"];
  busca.placeholder = ui.aba === "pipeline" ? "Buscar empresa, contato…" : "Buscar ideia ou texto…";
  $(".heading-controls").hidden = ui.aba === "ritmo";

  $("#tela-ritmo").hidden = ui.aba !== "ritmo";
  $("#tela-pipeline").hidden = ui.aba !== "pipeline";
  $("#tela-conteudo").hidden = ui.aba !== "conteudo";
  if (ui.aba === "ritmo") {
    telaRitmo.render();
  } else if (ui.aba === "pipeline") {
    renderBarraPipeline();
    $("#grade-leads").hidden = ui.visao !== "tabela";
    $("#kanban").hidden = ui.visao !== "kanban";
    if (ui.visao === "tabela") planilhaLeads.atualizar(); else renderKanban();
  } else {
    renderBarraConteudo();
    planilhaConteudos.atualizar();
  }
  atualizarPainel();
}

const telaRitmo = criarTelaRitmo({
  host: $("#tela-ritmo"),
  abrirLead: id => abrirPainel("leads", id),
  // Da fila de retornos para o Pipeline já filtrado (sem mudar a ordenação escolhida).
  irParaPipeline: filtro => { ui.etapa = filtro; ui.visao = "tabela"; irPara("pipeline"); },
});

/* ---------- eventos ---------- */
function irPara(aba) {
  ui.aba = aba; guardar();
  history.replaceState(null, "", "#" + aba);
  fecharSidebar();
  render();
  window.scrollTo(0, 0);
}
document.querySelectorAll(".nav-button").forEach(b => b.addEventListener("click", () => irPara(b.dataset.aba)));
window.addEventListener("hashchange", () => { const aba = location.hash.slice(1); if (ABAS.includes(aba) && aba !== ui.aba) irPara(aba); });
$("#busca").addEventListener("input", e => { ui.busca[ui.aba === "pipeline" ? "leads" : "conteudos"] = e.target.value; render(); });
$("#sair").addEventListener("click", () => dados.sair());
function fecharSidebar() { document.body.classList.remove("sidebar-aberta"); }
$("#abrir-menu").addEventListener("click", () => document.body.classList.toggle("sidebar-aberta"));
$("#sidebar-fundo").addEventListener("click", fecharSidebar);
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (janelaAberta()) { fecharJanelaDoTopo(); return; }
  if (painel.tabela && !e.target.closest(".planilhao")) fecharPainel();
  fecharSidebar();
});

dados.aoMudar(motivo => { if (motivo === "salvando") renderEstadoSalvo(); else render(); });
render();
dados.iniciar();
