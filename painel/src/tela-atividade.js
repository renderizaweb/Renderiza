// Tela Atividade: a linha do tempo de quem abriu o link do Painel Renderiza (/exemplos?c=…) e as demos
// (/demo/<pasta>), de todos os leads, o mais recente primeiro. Ao vivo: o tempo real do banco avisa na hora e,
// com a tela aberta, ela também lê de novo a cada 30 s. Período e busca na barra; o resto no botão Filtrar, com os
// mesmos chips do Pipeline (o que fez, em que clicou, parte que viu, tempo, quem, onde, aparelho, nicho e etapa:
// filtros-atividade.js). Os números do topo e os indicadores são do que está filtrado. As contas estão em
// visitas.js (com testes).

import * as dados from "./dados.js";
import { h } from "./dom.js";
import { icone } from "./icones.js";
import { atividade, filtrarAtividade, indicadoresDaAtividade, inicioDoPeriodo, duracao, PERIODOS, SINAIS, fraseDaVisita, complementoDaVisita, vendoAgora, textoDoRepasse } from "./visitas.js";
import { criarFiltros } from "./filtros-ui.js";
import { ATIVIDADE, filtrosDoEstadoAntigo } from "./filtros-atividade.js";

const A_CADA = 30000;
const POR_PAGINA = 40;
const QUEM_ABRIU = { cliente: "Cliente", equipe: "Vocês", equipe_ip: "Provavelmente vocês" };
const DICA_QUEM = { cliente: "Navegador que nunca abriu o painel da Renderiza e IP diferente dos de vocês", equipe: "Navegador com o painel da Renderiza aberto", equipe_ip: "Mesmo IP de uma visita de vocês" };

const estado = { periodo: "7d", busca: "", filtros: [], indicadores: false };
try {
  const salvo = JSON.parse(localStorage.getItem("renderiza:atividade") || "{}");
  if (salvo.periodo && PERIODOS[salvo.periodo]) estado.periodo = salvo.periodo;
  // Antes de 05/11/2026 eram as abas Quem e Onde: viram chips.
  estado.filtros = ATIVIDADE.limpar(Array.isArray(salvo.filtros) ? salvo.filtros : filtrosDoEstadoAntigo(salvo));
  estado.indicadores = !!salvo.indicadores;
} catch (e) { /* opcional */ }
const guardar = () => { try { localStorage.setItem("renderiza:atividade", JSON.stringify({ periodo: estado.periodo, filtros: estado.filtros, indicadores: estado.indicadores })); } catch (e) { /* opcional */ } };
const NOME_DO_SINAL = Object.fromEntries(SINAIS);

// Até onde já foi visto (a última ação mostrada na tela): o que chegar depois pisca e conta no menu.
let vistoAte = 0;
try { vistoAte = Number(localStorage.getItem("renderiza:atividade-vista")) || 0; } catch (e) { /* opcional */ }
const marcarVisto = ms => { if (ms <= vistoAte) return; vistoAte = ms; try { localStorage.setItem("renderiza:atividade-vista", String(ms)); } catch (e) { /* opcional */ } };
const ultimaAcao = grupos => grupos.reduce((m, g) => Math.max(m, Date.parse(g.fim) || 0), 0);

const hora = iso => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
function haQuanto(iso, agora = Date.now()) {
  const s = Math.max(0, (agora - Date.parse(iso)) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 6 * 3600) return `há ${Math.floor(s / 3600)} h`;
  return "";
}
function nomeDoDia(iso) {
  const d = new Date(iso), hoje = new Date();
  const dias = Math.round((new Date(hoje.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Ontem";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}
const plural = (n, um, varios) => n + " " + (n === 1 ? um : varios);

/** Visitas de clientes que chegaram depois da última vez que a tela foi aberta (o número no menu). */
export function naoVistas() {
  if (dados.tabelaFaltando("visitas")) return 0;
  const grupos = atividade(dados.listar("visitas"));
  if (!vistoAte) { marcarVisto(ultimaAcao(grupos) || Date.now()); return 0; }
  return grupos.filter(g => g.quem === "cliente" && Date.parse(g.fim) > vistoAte).length;
}

/**
 * @param {{host: HTMLElement, abrirLead: (id) => void}} ctx
 */
export function criarTelaAtividade(ctx) {
  let pagina = 1, relogio = null, conferidoEm = null, conferindo = false;
  const abertos = new Set(); // visitas com os detalhes abertos (continuam abertas quando a lista se redesenha)
  const chaveDe = g => g.lead_id + "/" + g.visitante + "/" + g.inicio;

  // Barra fixa (criada uma vez): a busca não perde o foco quando a lista se redesenha.
  const abas = (rotulo, opcoes, chave) => {
    const lista = h("div", { class: "tabs-list rolavel", role: "tablist", "aria-label": rotulo });
    const desenhar = () => lista.replaceChildren(...Object.entries(opcoes).map(([v, t]) =>
      h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(estado[chave] === v), "data-state": estado[chave] === v ? "active" : "inactive",
        onclick: () => { estado[chave] = v; pagina = 1; guardar(); render(); } }, t)));
    return { lista, desenhar };
  };
  const filtroPeriodo = abas("Período", PERIODOS, "periodo");
  const nomeDoLead = id => (dados.buscar("leads", id) || {}).empresa || "Lead apagado";
  const ctxDosFiltros = () => ({ leadDe: id => dados.buscar("leads", id) });
  /** As visitas do período e da busca: a base dos filtros e das contagens deles. */
  const daBase = () => (dados.tabelaFaltando("visitas") ? [] : filtrarAtividade(atividade(dados.listar("visitas")), { desde: inicioDoPeriodo(estado.periodo), busca: estado.busca }, nomeDoLead));
  let base = [];
  const filtros = criarFiltros({ modelo: ATIVIDADE, nomes: ["visita", "visitas"], leads: () => base, ctx: ctxDosFiltros, ler: () => estado.filtros,
    gravar: lista => { estado.filtros = lista; pagina = 1; guardar(); render(); } });
  const busca = h("input", { type: "search", autocomplete: "off", placeholder: "Lead, demo, cidade ou IP…", "aria-label": "Buscar na atividade" });
  busca.addEventListener("input", () => { estado.busca = busca.value; pagina = 1; render(); });
  const situacao = h("span", { class: "atv-situacao" });
  const atualizar = h("button", { type: "button", class: "btn btn-outline btn-sm", title: "Ler de novo agora" }, icone("recuperar", 15), "Atualizar");
  atualizar.addEventListener("click", () => conferir(true));
  const barra = h("div", { class: "sheet-toolbar atv-barra" },
    h("div", { class: "sheet-actions atv-filtros" }, filtroPeriodo.lista, filtros.botao,
      h("label", { class: "search-control" }, icone("buscar", 16), busca)),
    h("div", { class: "atv-ao-vivo" }, situacao, atualizar));
  const numeros = h("div", { class: "atv-numeros" });
  const verIndicadores = h("button", { type: "button", class: "btn btn-outline btn-sm atv-ver-ind", "aria-expanded": "false" });
  verIndicadores.addEventListener("click", () => { estado.indicadores = !estado.indicadores; guardar(); render(); });
  const indicadores = h("div", { class: "atv-ind", hidden: true });
  const lista = h("div", { class: "atv-lista" });
  const mais = h("button", { type: "button", class: "btn btn-outline atv-mais", hidden: true });
  mais.addEventListener("click", () => { pagina++; render(); });

  async function conferir(manual = false) {
    if (conferindo || (!manual && document.visibilityState !== "visible")) return;
    conferindo = true;
    if (manual) atualizar.disabled = true;
    await dados.recarregar("visitas");
    conferindo = false;
    atualizar.disabled = false;
    conferidoEm = new Date();
    render(); // mesmo sem novidade: o "há 3 min" anda
  }

  /** A tela aberta lê o banco a cada 30 s; fechada, só o tempo real. */
  function ativar(sim) {
    if (sim && !relogio) { conferidoEm = conferidoEm || new Date(); relogio = setInterval(conferir, A_CADA); }
    if (!sim && relogio) { clearInterval(relogio); relogio = null; }
  }
  document.addEventListener("visibilitychange", () => { if (relogio && document.visibilityState === "visible") conferir(); });

  function render() {
    if (!ctx.host.contains(barra)) ctx.host.replaceChildren(barra, filtros.faixa, numeros, indicadores, lista, mais);
    filtroPeriodo.desenhar();
    if (document.activeElement !== busca) busca.value = estado.busca;
    const online = dados.estadoDaConexao().estado === "online";
    situacao.className = "atv-situacao" + (online ? " ao-vivo" : "");
    situacao.textContent = online ? `Ao vivo · conferido às ${(conferidoEm || new Date()).toLocaleTimeString("pt-BR")}` : "Sem conexão: mostrando o que já tinha";

    if (dados.tabelaFaltando("visitas")) {
      numeros.replaceChildren();
      indicadores.hidden = true;
      lista.replaceChildren(h("p", { class: "grid-notice", text: "O contador de visitas ainda não está no banco (supabase/schema.sql, tabela visitas)." }));
      mais.hidden = true;
      return;
    }
    const todos = atividade(dados.listar("visitas"));
    const nome = nomeDoLead;
    base = daBase();
    const grupos = ATIVIDADE.aplicar(base, estado.filtros, ctxDosFiltros());
    filtros.atualizar(grupos.length, base.length);
    // Os números contam só os clientes, a menos que o filtro "Quem abriu" diga outra coisa.
    const porQuem = estado.filtros.some(f => f.campo === "quem");
    const contados = porQuem ? grupos : grupos.filter(g => g.quem === "cliente");
    const r = indicadoresDaAtividade(contados);
    const nossas = grupos.length - contados.length;
    const agoraMesmo = contados.filter(g => vendoAgora(g)).length;
    const de = porQuem ? "" : " de clientes";
    numeros.replaceChildren(...[
      agoraMesmo ? h("div", { class: "atv-numero agora" }, h("strong", { text: String(agoraMesmo) }), h("span", { text: agoraMesmo === 1 ? "vendo agora" : "vendo agora" })) : null,
      numero(r.visitas, "visitas" + de, "visita" + (porQuem ? "" : " de cliente")),
      numero(r.leads, "leads diferentes", "lead"),
      r.segundosMediana ? numeroTexto(duracao(r.segundosMediana), "por visita (mediana)") : null,
      r.visitas ? numeroTexto(r.fimPct + "%", "foram até o fim") : null,
      numero(r.valor, "leads viram o valor", "lead viu o valor", r.valor > 0),
      numero(r.whatsapp, "leads clicaram no WhatsApp do site", "lead clicou no WhatsApp do site"),
      r.whatsappRenderiza ? numero(r.whatsappRenderiza, "leads chamaram vocês no WhatsApp", "lead chamou vocês no WhatsApp", true) : null,
      r.oferta ? numero(r.oferta, "leads clicaram em Garantir ou Negociar", "lead clicou em Garantir ou Negociar", true) : null,
      r.aviso ? numero(r.aviso, "leads viram o aviso da Renderiza", "lead viu o aviso da Renderiza") : null,
      r.aviso && r.avisoSegundosMediana ? numeroTexto(duracao(r.avisoSegundosMediana), "com o aviso aberto (mediana)") : null,
      nossas ? h("p", { class: "atv-nossas", text: `${plural(nossas, "visita", "visitas")} de vocês no período` }) : null,
      contados.length ? verIndicadores : null].filter(Boolean));
    verIndicadores.replaceChildren(icone(estado.indicadores ? "abaixo" : "direita", 14), estado.indicadores ? "Esconder os indicadores" : "Ver os indicadores");
    verIndicadores.setAttribute("aria-expanded", String(estado.indicadores));
    indicadores.hidden = !estado.indicadores || !contados.length;
    if (!indicadores.hidden) desenharIndicadores(r);

    const anterior = vistoAte;
    const mostrar = grupos.slice(0, pagina * POR_PAGINA);
    if (!todos.length) {
      lista.replaceChildren(h("p", { class: "grid-notice", text: "Ninguém abriu ainda. Quando alguém abrir o link do painel de um lead ou uma demo, aparece aqui na hora." }));
    } else if (!grupos.length) {
      lista.replaceChildren(h("div", { class: "atv-vazio" }, h("p", { text: "Nada com esses filtros." }),
        h("button", { type: "button", class: "text-link", text: "Limpar os filtros", onclick: () => { Object.assign(estado, { filtros: [], periodo: "tudo", busca: "" }); busca.value = ""; guardar(); render(); } })));
    } else {
      const agora = Date.now();
      const dias = [];
      for (const g of mostrar) {
        const dia = nomeDoDia(g.fim);
        if (!dias.length || dias[dias.length - 1].dia !== dia) dias.push({ dia, grupos: [] });
        dias[dias.length - 1].grupos.push(g);
      }
      lista.replaceChildren(...dias.map(d => h("section", { class: "atv-dia" },
        h("h2", { class: "atv-dia-nome" }, d.dia, h("span", { text: plural(d.grupos.length, "visita", "visitas") })),
        h("ol", { class: "atv-itens" }, d.grupos.map(g => item(g, nome(g.lead_id), anterior && Date.parse(g.fim) > anterior, agora))))));
    }
    mais.hidden = grupos.length <= mostrar.length;
    mais.textContent = `Mostrar mais (${grupos.length - mostrar.length})`;
    marcarVisto(ultimaAcao(todos));
  }

  const numero = (n, varios, um, forte = false) => h("div", { class: "atv-numero" + (forte ? " forte" : "") }, h("strong", { text: String(n) }), h("span", { text: n === 1 ? um : varios }));
  const numeroTexto = (valor, rotulo) => h("div", { class: "atv-numero" }, h("strong", { text: valor }), h("span", { text: rotulo }));

  // Os indicadores do que está filtrado: onde ficaram mais tempo, em que clicaram e quem mais se interessou.
  function desenharIndicadores(r) {
    const barras = (itens, valor, texto) => {
      const maior = Math.max(1, ...itens.map(valor));
      return h("ul", { class: "atv-ind-lista" }, itens.map(x => h("li", {},
        h("span", { class: "atv-parte-nome", text: x.nome, title: x.nome }),
        h("span", { class: "atv-barra-fundo" }, h("span", { class: "atv-barra-cheia", style: `width:${Math.max(4, Math.round(valor(x) / maior * 100))}%` })),
        h("span", { class: "atv-parte-tempo", text: texto(x) }))));
    };
    const vazio = t => h("p", { class: "atv-ind-vazio", text: t });
    const sinais = l => SINAIS.map(([id]) => id).filter(id => l.sinais.has(id) && id !== "fim").map(id => NOME_DO_SINAL[id][0].toLowerCase() + NOME_DO_SINAL[id].slice(1));
    indicadores.replaceChildren(
      h("section", { class: "atv-ind-bloco" },
        h("h3", { text: "Onde ficaram mais tempo" }),
        h("p", { class: "atv-ind-nota", text: "As partes com mais tempo somado: o tempo médio de quem viu e quantas visitas passaram por ela." }),
        r.partes.length ? barras(r.partes.slice(0, 8), x => x.media, x => `${duracao(x.media)} · ${x.pct}%`) : vazio("Sem tempo por parte nessas visitas (só as demos medem).")),
      h("section", { class: "atv-ind-bloco" },
        h("h3", { text: "Em que clicaram" }),
        h("p", { class: "atv-ind-nota", text: "Quantos leads clicaram em cada coisa (e em quantas visitas)." }),
        r.cliques.length ? barras(r.cliques.slice(0, 8), x => x.leads, x => `${plural(x.leads, "lead", "leads")} · ${x.cliques}`) : vazio("Ninguém clicou em nada nessas visitas.")),
      h("section", { class: "atv-ind-bloco" },
        h("h3", { text: "Quem mais se interessou" }),
        h("p", { class: "atv-ind-nota", text: "Pela soma de visitas, tempo, valor visto e WhatsApp. Clique para abrir o lead." }),
        h("ol", { class: "atv-ind-leads" }, r.porLead.slice(0, 10).map(l => h("li", {},
          h("button", { type: "button", class: "text-link", text: nomeDoLead(l.lead_id), onclick: () => ctx.abrirLead(l.lead_id) }),
          h("span", { class: "atv-ind-meta", text: [plural(l.visitas, "visita", "visitas"), l.segundos >= 5 && duracao(l.segundos), ...sinais(l)].filter(Boolean).join(" · ") })))),
        r.porLead.length > 10 ? h("p", { class: "atv-ind-nota", text: `e mais ${r.porLead.length - 10}` }) : null));
  }

  // Fechada, a visita é uma frase ("Ótica Nina abriu a demo e clicou no WhatsApp do site"); clicar abre os
  // detalhes: onde, aparelho, cidade, IP, o que mais olhou e cada passo com a hora.
  function item(g, nomeDoLead, novo, agora) {
    const chave = chaveDe(g), aberto = abertos.has(chave), aoVivo = vendoAgora(g, agora);
    const quando = haQuanto(g.fim, agora);
    const complemento = complementoDaVisita(g);
    const detalhes = h("div", { class: "atv-detalhes", hidden: !aberto });
    const resumo = h("button", { type: "button", class: "atv-resumo", "aria-expanded": String(aberto), title: aberto ? "Fechar os detalhes" : "Ver os detalhes" },
      h("span", { class: "atv-texto" },
        h("span", { class: "atv-frase" },
          h("span", { class: "pr-quem", title: DICA_QUEM[g.quem], text: QUEM_ABRIU[g.quem] }),
          h("strong", { text: nomeDoLead }), " ", fraseDaVisita(g)),
        complemento ? h("span", { class: "atv-sub", text: complemento }) : null,
        g.repasse ? h("span", { class: "atv-repasse", text: textoDoRepasse(g) }) : null),
      h("span", { class: "atv-quando", title: new Date(g.fim).toLocaleString("pt-BR") },
        aoVivo ? h("span", { class: "atv-agora", text: "vendo agora" }) : h("span", { text: quando || hora(g.fim) })),
      h("span", { class: "atv-seta", "aria-hidden": "true" }, icone("abaixo", 16)));
    const li = h("li", { class: "atv-item quem-" + g.quem + (novo ? " novo" : "") + (aberto ? " aberto" : "") + (aoVivo ? " ao-vivo" : "") }, resumo, detalhes);
    const desenharDetalhes = () => {
      const lugares = [...new Map(g.passos.map(p => [p.lugar, p])).values()];
      const meta = [g.aparelho, g.local, g.ip && "IP " + g.ip, hora(g.inicio) === hora(g.fim) ? hora(g.fim) : `das ${hora(g.inicio)} às ${hora(g.fim)}`].filter(Boolean).join(" · ");
      const maior = g.secoes.length ? g.secoes[0][1] : 0;
      detalhes.replaceChildren(
        h("div", { class: "atv-acoes" },
          h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => ctx.abrirLead(g.lead_id) }, icone("painel", 14), "Abrir o lead"),
          lugares.map(p => p.pagina === "demo"
            ? h("a", { class: "btn btn-outline btn-sm", href: "/demo/" + p.demo, target: "_blank", rel: "noopener", title: "/demo/" + p.demo + " (conta como visita de vocês)" }, icone("abrirLink", 14), "Abrir a demo")
            : h("span", { class: "atv-lugar", text: p.lugar }))),
        h("p", { class: "atv-meta", text: meta }),
        g.secoes.length ? h("div", { class: "atv-partes" },
          h("span", { class: "atv-rotulo", text: "O que mais olhou" }),
          h("ul", {}, g.secoes.slice(0, 6).map(([nome, s]) => h("li", {},
            h("span", { class: "atv-parte-nome", text: nome }),
            h("span", { class: "atv-barra-fundo" }, h("span", { class: "atv-barra-cheia", style: `width:${Math.max(6, Math.round(s / maior * 100))}%` })),
            h("span", { class: "atv-parte-tempo", text: duracao(s) }))))) : null,
        h("div", { class: "atv-passos-caixa" },
          h("span", { class: "atv-rotulo", text: "Passo a passo" }),
          h("ol", { class: "atv-passos" }, [...g.passos].reverse().map(p =>
            h("li", { class: p.forte ? "forte" : "" }, h("time", { text: hora(p.em) }), h("span", { text: p.texto }))))));
    };
    if (aberto) desenharDetalhes();
    resumo.addEventListener("click", () => {
      const abrir = !abertos.has(chave);
      if (abrir) { abertos.add(chave); desenharDetalhes(); } else abertos.delete(chave);
      detalhes.hidden = !abrir;
      li.classList.toggle("aberto", abrir);
      resumo.setAttribute("aria-expanded", String(abrir));
      resumo.title = abrir ? "Fechar os detalhes" : "Ver os detalhes";
    });
    return li;
  }

  return { render, ativar };
}
