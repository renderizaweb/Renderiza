// Tela Indicadores: onde focar (qual nicho e qual perfil de negócio mais vira interesse), o funil de cada ciclo e de
// cada nicho, do primeiro contato à venda, e a leitura franca do que os números mostram. Só leitura. As contas estão
// em indicadores.js e perfil.js (com testes).

import * as dados from "./dados.js";
import { h } from "./dom.js";
import { hojeLocal, indexar } from "./ritmo.js";
import { nomeDoCiclo } from "./tags.js";
import { indicadores, MOTIVOS, OUTRO_MOTIVO, SITUACOES, AMOSTRA_MINIMA, pct } from "./indicadores.js";

const estado = { nicho: "" };
try { estado.nicho = JSON.parse(localStorage.getItem("renderiza:indicadores") || "{}").nicho || ""; } catch (e) { /* opcional */ }
const guardar = () => { try { localStorage.setItem("renderiza:indicadores", JSON.stringify({ nicho: estado.nicho })); } catch (e) { /* opcional */ } };

const ORDEM = ["venda", "interessado", "conversando", "esfriou", "nao", "silencio", "aguardando"];
const plural = (n, um, varios) => n + " " + (n === 1 ? um : varios);
const dm = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const nomeDoGrupo = c => (c === 0 ? "Antes dos ciclos · lista de agosto" : nomeDoCiclo(c));
const fmtPct = n => (n === null || n === undefined ? "—" : n + "%");

/**
 * @param {{host: HTMLElement, abrirLead: (id) => void}} ctx
 */
export function criarTelaIndicadores(ctx) {
  function render() {
    const leads = dados.listar("leads"), interacoes = dados.listar("interacoes");
    const hoje = hojeLocal();
    const porLead = indexar(leads, interacoes);
    const nichos = [...new Set(leads.map(l => (l.segmento || "").trim()).filter(Boolean))];
    if (estado.nicho && !nichos.includes(estado.nicho)) estado.nicho = "";
    const r = indicadores(leads, porLead, { nicho: estado.nicho, hoje });

    if (!r.total.contatados) {
      ctx.host.replaceChildren(barra(r), h("p", { class: "grid-notice", text: "Ainda não há contatos registrados para mostrar indicadores." }));
      return;
    }
    ctx.host.replaceChildren(barra(r), h("div", { class: "ind-corpo" },
      cardFoco(r),
      cardNumeros(r),
      estado.nicho ? null : cardNichos(r),
      secaoPerfil(r),
      cardFunil(r),
      cardLeitura(r),
      h("div", { class: "ind-duas" }, cardMotivos(r), cardQuentes(r)),
      secaoGrupos("Por ciclo", "A conversa conta no ciclo em que começou (a etiqueta C1, C2… do card).", r.porCiclo.map(c => ({ titulo: nomeDoGrupo(c.ciclo), ...c }))),
      notaDeComoConta(r)));
  }

  function barra(r) {
    const opcoes = [["", "Todos"], ...r.nichos.map(n => [n, n])];
    const tabs = h("div", { class: "tabs-list rolavel", role: "tablist", "aria-label": "Nicho" }, opcoes.map(([v, t]) =>
      h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(estado.nicho === v), "data-state": estado.nicho === v ? "active" : "inactive",
        onclick: () => { estado.nicho = v; guardar(); render(); } }, t)));
    return h("div", { class: "sheet-toolbar ind-barra" }, h("div", { class: "sheet-actions" }, tabs));
  }

  function cardFoco(r) {
    const { frases, alvo, mediaInteresse } = r.foco;
    if (!frases.length && !alvo.length) return null;
    return h("section", { class: "card-placar ind-foco", "aria-label": "Onde focar" },
      h("span", { class: "section-eyebrow", text: estado.nicho ? "Onde focar · " + estado.nicho : "Onde focar" }),
      alvo.length ? h("div", { class: "ind-alvo" },
        h("p", { class: "linha-placar" }, h("strong", { text: "Perfil que mais vira interesse" }), ` (média: ${fmtPct(mediaInteresse)} dos contatados mostram interesse)`),
        h("ul", { class: "ind-chips" }, alvo.map(a => h("li", {}, h("small", { text: a.corte }), h("strong", { text: a.faixa }),
          h("span", { text: `${a.taxaInteresse}% com interesse · ${plural(a.contatados, "contato", "contatos")}` }))))) : null,
      frases.length ? h("ul", { class: "ind-alertas" }, frases.map(a => h("li", { class: "ind-alerta " + a.tom, text: a.texto }))) : null,
      h("p", { class: "nota-placar", text: `Interesse = pediu o valor, perguntou como funciona, está em negociação ou fechou. Faixa com menos de ${AMOSTRA_MINIMA} contatos não entra na leitura: ainda é sorte.` }));
  }

  function cardLeitura(r) {
    if (!r.alertas.length) return null;
    return h("section", { class: "card-placar ind-leitura", "aria-label": "Leitura dos números" },
      h("span", { class: "section-eyebrow", text: "Leitura dos números" }),
      h("ul", { class: "ind-alertas" }, r.alertas.map(a => h("li", { class: "ind-alerta " + a.tom, text: a.texto }))));
  }

  // Comparação dos nichos lado a lado (só em "Todos").
  function cardNichos(r) {
    const nichos = r.porNicho.filter(n => n.contatados);
    if (nichos.length < 2) return null;
    const melhor = Math.max(...nichos.filter(n => n.contatados >= 5).map(n => n.taxaInteresse ?? 0));
    const col = (rotulo, dica) => h("th", { scope: "col", title: dica || null, text: rotulo });
    return h("section", { class: "card-placar", "aria-label": "Qual nicho focar" },
      h("span", { class: "section-eyebrow", text: "Qual nicho focar" }),
      h("div", { class: "ind-tabela-rolagem" }, h("table", { class: "ind-tabela" },
        h("thead", {}, h("tr", {}, col("Nicho"), col("Contatos"), col("Responderam", "Uma pessoa respondeu"), col("Interesse", "Pediu o valor, perguntou como funciona, em negociação ou venda"),
          col("Disseram não"), col("Em aberto", "Responderam e seguem sem desfecho"), col("Demos por interessado", "Demos feitas no nicho ÷ quem mostrou interesse"))),
        h("tbody", {}, nichos.map(n => h("tr", { class: n.contatados >= 5 && (n.taxaInteresse ?? 0) === melhor && melhor > 0 ? "destaque" : "" },
          h("th", { scope: "row" }, n.nicho, n.contatados < 10 ? h("small", { text: "poucos contatos" }) : null),
          h("td", { class: "num", text: String(n.contatados) }),
          celulaTaxa(n.taxaResposta, n.respondeu),
          celulaTaxa(n.taxaInteresse, n.interessados, true),
          celulaTaxa(n.taxaNao, n.nao),
          h("td", { class: "num", text: String(n.interessadoAberto + n.conversando) }),
          h("td", { class: "num", text: n.demosPorInteressado === null ? "—" : String(n.demosPorInteressado).replace(".", ",") })))))),
      h("p", { class: "nota-placar", text: "Todos os ciclos somados. Demos por interessado mostra o esforço: quantas demos foram feitas no nicho para cada um que mostrou interesse (menor é melhor)." }));
  }

  function celulaTaxa(taxa, n, forte = false) {
    return h("td", { class: "ind-taxa" + (forte ? " forte" : "") },
      h("span", { class: "num", text: fmtPct(taxa) }), h("small", { text: String(n) }),
      h("i", { class: "ind-barrinha", "aria-hidden": "true" }, h("b", { style: `width:${taxa || 0}%` })));
  }

  // Um cartão por corte (seguidores, avaliações, nota, região, quem atendeu, WhatsApp, site).
  function secaoPerfil(r) {
    const cortes = r.perfil.filter(c => c.faixas.some(f => f.contatados));
    if (!cortes.length) return null;
    return h("section", { class: "ind-secao", "aria-label": "Perfil de quem responde e se interessa" },
      h("div", { class: "ind-secao-topo" }, h("h2", { text: "Perfil de quem responde e se interessa" }),
        h("p", { class: "nota-placar", text: "Tamanho e jeito do negócio contra o resultado da conversa. Entre parênteses, quantos." })),
      h("div", { class: "ind-cortes" }, cortes.map(c => {
        const comAmostra = c.faixas.filter(f => !f.semPessoa && f.contatados >= AMOSTRA_MINIMA);
        const melhor = comAmostra.length >= 2 ? Math.max(...comAmostra.map(f => f.taxaInteresse ?? 0)) : null;
        return h("article", { class: "card-placar ind-corte" },
          h("h3", { text: c.nome }),
          h("table", { class: "ind-tabela compacta" },
            h("thead", {}, h("tr", {}, h("th", { scope: "col", text: "Faixa" }), h("th", { scope: "col", text: "Contatos" }), h("th", { scope: "col", text: "Responderam" }), h("th", { scope: "col", text: "Interesse" }))),
            h("tbody", {}, c.faixas.filter(f => f.contatados).map(f => h("tr", {
              class: [f.contatados < AMOSTRA_MINIMA ? "pouco" : "", melhor !== null && melhor > 0 && !f.semPessoa && f.contatados >= AMOSTRA_MINIMA && f.taxaInteresse === melhor ? "destaque" : ""].join(" ").trim() || null,
              title: f.contatados < AMOSTRA_MINIMA ? "Poucos contatos: ainda não diz muito" : null },
              h("th", { scope: "row", text: f.nome }),
              h("td", { class: "num", text: String(f.contatados) }),
              celulaTaxa(f.taxaResposta, f.respondeu),
              f.semPessoa ? h("td", { class: "ind-taxa vazia", text: "—" }) : celulaTaxa(f.taxaInteresse, f.interessados, true))))),
          h("p", { class: "nota-placar", text: `Fonte: ${c.fonte}.` + (c.semDado ? ` ${plural(c.semDado, "contato sem o dado", "contatos sem o dado")}.` : "") }));
      })));
  }

  function celula(valor, rotulo, detalhe, classe = "") {
    return h("div", { class: "ind-celula " + classe }, h("strong", { class: "num", text: String(valor) }), h("span", { text: rotulo }), detalhe ? h("small", { text: detalhe }) : null);
  }

  function cardNumeros(r) {
    const t = r.total, p = r.producao;
    return h("section", { class: "card-placar", "aria-label": "Números" },
      h("span", { class: "section-eyebrow", text: estado.nicho ? "Desde o início · " + estado.nicho : "Desde o início" }),
      h("div", { class: "ind-celulas" },
        celula(t.contatados, "contatados", t.aguardando ? plural(t.aguardando, "aguardando resposta", "aguardando resposta") : null),
        celula(fmtPct(t.taxaResposta), "responderam", `${t.respondeu} de ${t.contatados}` + (t.conversando ? ` · ${t.conversando} em conversa` : "")),
        celula(t.interessados, "mostraram interesse", fmtPct(t.taxaInteresse) + " dos contatados"),
        celula(t.vendas, t.vendas === 1 ? "venda" : "vendas", t.vendas ? "R$ " + t.faturado.toLocaleString("pt-BR") : "nenhuma ainda", t.vendas ? "" : "zerada")),
      h("p", { class: "linha-placar" }, "Produzido: ", h("strong", { text: plural(p.demos, "demo", "demos") }), ", ", plural(p.videos, "vídeo", "vídeos"), " e ", plural(p.flyers, "flyer", "flyers"), ". ",
        p.prontasSemEnvio ? h("span", {}, h("strong", { text: plural(p.prontasSemEnvio, "pronta", "prontas") }), " sem envio.") : "Tudo o que ficou pronto foi enviado."),
      t.diasAteResposta !== null ? h("p", { class: "nota-placar", text: `Quem responde, responde rápido: mediana de ${plural(t.diasAteResposta, "dia", "dias")} entre o primeiro contato e a resposta (estimado pela mudança de etapa).` }) : null);
  }

  function cardFunil(r) {
    const t = r.total;
    const passos = [["Contatados", t.contatados], ["Responderam", t.respondeu], ["Mostraram interesse", t.interessados], ["Fecharam", t.vendas]];
    return h("section", { class: "card-placar", "aria-label": "Funil" },
      h("span", { class: "section-eyebrow", text: "Funil" }),
      h("div", { class: "ind-funil" }, passos.map(([nome, n], i) => {
        const largura = t.contatados ? Math.max(n ? 2 : 0, Math.round((100 * n) / t.contatados)) : 0;
        const doAnterior = i ? pct(n, passos[i - 1][1]) : null;
        return h("div", { class: "ind-passo" },
          h("div", { class: "ind-passo-topo" }, h("span", { text: nome }), h("strong", { class: "num", text: String(n) }),
            i ? h("small", { text: fmtPct(doAnterior) + " do passo anterior" }) : null),
          h("div", { class: "progress-track" }, h("span", { style: `width:${largura}%` })));
      })));
  }

  function barraSituacoes(g) {
    const total = g.contatados || 1;
    const n = { venda: g.vendas, interessado: g.interessadoAberto, conversando: g.conversando, esfriou: g.esfriou, nao: g.nao, silencio: g.silencio, aguardando: g.aguardando };
    return h("div", { class: "ind-pilha", role: "img", "aria-label": ORDEM.filter(s => n[s]).map(s => `${SITUACOES[s]}: ${n[s]}`).join(", ") },
      ORDEM.filter(s => n[s]).map(s => h("span", { class: "sit-" + s, style: `width:${(100 * n[s]) / total}%`, title: `${SITUACOES[s]}: ${n[s]}` })));
  }

  function legenda() {
    return h("div", { class: "ind-legenda" }, ORDEM.map(s => h("span", {}, h("i", { class: "sit-" + s }), SITUACOES[s])));
  }

  function secaoGrupos(titulo, nota, grupos) {
    if (!grupos.length) return null;
    return h("section", { class: "ind-secao", "aria-label": titulo },
      h("div", { class: "ind-secao-topo" }, h("h2", { text: titulo }), h("p", { class: "nota-placar", text: nota })),
      legenda(),
      h("div", { class: "ind-grupos" }, grupos.map(g => h("article", { class: "card-placar ind-grupo" },
        h("h3", { text: g.titulo }),
        h("div", { class: "numero-linha" }, h("span", { class: "numero-grande ind-medio" + (g.contatados < 10 ? " pouco" : ""), text: fmtPct(g.taxaResposta) }), h("span", { class: "numero-contexto", text: `responderam (${g.respondeu} de ${g.contatados})` })),
        g.contatados < 10 ? h("p", { class: "nota-placar", text: "Amostra pequena: a porcentagem ainda não diz muito." }) : null,
        barraSituacoes(g),
        h("dl", { class: "ind-lista" },
          linha("Contatados", g.contatados),
          linha("Mostraram interesse", g.interessados),
          g.conversando ? linha("Responderam, em aberto", g.conversando) : null,
          linha("Disseram não", g.nao),
          linha("Não responderam", g.silencio),
          g.esfriou ? linha("Responderam e pararam", g.esfriou) : null,
          linha("Aguardando", g.aguardando),
          linha("Vendas", g.vendas),
          g.semRespostaComCobranca ? linha("Cobranças marcadas", `${g.cobrancasFeitas} de ${g.semRespostaComCobranca}`) : null)))));
  }
  const linha = (rotulo, valor) => h("div", {}, h("dt", { text: rotulo }), h("dd", { class: "num", text: String(valor) }));

  function cardMotivos(r) {
    const m = r.total.motivos, total = r.total.nao;
    const lista = [...MOTIVOS, OUTRO_MOTIVO].filter(x => m[x.id]).sort((a, b) => m[b.id] - m[a.id]);
    return h("section", { class: "card-placar", "aria-label": "Por que disseram não" },
      h("span", { class: "section-eyebrow", text: "Por que disseram não" }),
      !total ? h("p", { class: "linha-placar", text: "Ninguém disse não com um motivo registrado." }) :
        h("div", { class: "ind-funil" }, lista.map(x => h("div", { class: "ind-passo" },
          h("div", { class: "ind-passo-topo" }, h("span", { text: x.nome }), h("strong", { class: "num", text: String(m[x.id]) }), h("small", { text: fmtPct(pct(m[x.id], total)) })),
          h("div", { class: "progress-track motivo" }, h("span", { style: `width:${(100 * m[x.id]) / total}%` }))))),
      h("p", { class: "nota-placar", text: "Do motivo da perda escrito no card. Perda \"sem retorno\" conta como não respondeu." }));
  }

  function cardQuentes(r) {
    return h("section", { class: "card-placar", "aria-label": "Conversas quentes" },
      h("span", { class: "section-eyebrow", text: "Conversas quentes, em aberto" }),
      !r.quentes.length ? h("p", { class: "linha-placar", text: "Nenhuma conversa com interesse em aberto." }) :
        h("ul", { class: "ind-quentes" }, r.quentes.map(q => h("li", {},
          h("button", { type: "button", onclick: () => ctx.abrirLead(q.id) },
            h("span", { class: "turma-nome", text: q.empresa }),
            h("small", { text: [q.nicho, q.ultimo ? "última mudança no painel " + dm(q.ultimo) : null].filter(Boolean).join(" · ") }),
            q.diasParado !== null ? h("em", { class: q.diasParado >= 5 ? "parado" : "", text: plural(q.diasParado, "dia", "dias") + " parado" }) : null)))),
      h("p", { class: "nota-placar", text: "Interesse marcado ou em negociação, sem venda nem perda. Os dias contam da última mudança registrada no painel, que pode ser mais recente que a última conversa. Toque para abrir." }));
  }

  function notaDeComoConta(r) {
    const q = r.qualidade;
    return h("p", { class: "grid-notice ind-nota" },
      h("strong", { text: "Como cada número é contado. " }),
      "Contatado: tem primeiro contato ou já está em Em andamento ou Finalizado. Respondeu: uma pessoa respondeu (resposta registrada; mensagem automática não conta), interesse marcado, passagem por Em negociação ou perda com motivo (\"já tenho site\", \"sem interesse\"). ",
      "Mostrou interesse: o campo Interesse marcado (pediu o valor, perguntou como funciona), em Em negociação agora ou venda. ",
      "Não respondeu: Sem resposta, Encerrado ou perda \"sem retorno\". Aguardando: em conversa, sem sinal de resposta ainda. ",
      "Perfil: seguidores, nota e avaliações saem das Observações da triagem (o primeiro número escrito); quem atendeu sai da linha \"Quem atendeu:\" das Observações; região, do DDD do WhatsApp. ",
      `Hoje o painel tem ${plural(q.respostasRegistradas, "resposta registrada", "respostas registradas")}, ${plural(q.retornosRegistrados, "retorno registrado", "retornos registrados")} e ${plural(q.interesseAvaliado, "contato com interesse avaliado", "contatos com interesse avaliado")}.`);
  }

  return { render };
}
