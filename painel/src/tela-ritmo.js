// Tela Ritmo: o placar do processo (o que você controla), em semana, mês ou ciclo.
//   Novas óticas prospectadas = primeiro contato com data exata no período.
//   Relacionamento = retornos feitos x previstos no período, e a fila de retornos daqui para frente.
// Fechamentos aparecem só como contexto. Todas as contas estão em ritmo.js (com testes).

import * as dados from "./dados.js";
import { h } from "./dom.js";
import { icone } from "./icones.js";
import { abrirJanela, confirmar, aviso } from "./ui.js";
import { salvar, criar, falhou } from "./acoes.js";
import { rotuloEtapa, nomeDoInteresse, nomeDoTipo } from "./modelo.js";
import {
  hojeLocal, semanaDe, mesDe, somarDias, diasEntre, cicloComoPeriodo, cicloParaMostrar, indexar, placar,
  metaProporcional, ritmoNecessario, filaDeRetornos, semanasDoCiclo, turma, semPrimeiroContato, dentro,
} from "./ritmo.js";
import { abrirRecuperacao } from "./interacoes-ui.js";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_CURTOS = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
const dm = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const dma = iso => dm(iso) + "/" + iso.slice(0, 4);
const plural = (n, um, varios) => n + " " + (n === 1 ? um : varios);
const dinheiro = n => "R$ " + Number(n || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const estado = { visao: "semana", ref: null, cicloId: null, turmaAberta: false };
try {
  const salvo = JSON.parse(localStorage.getItem("renderiza:ritmo") || "{}");
  if (["semana", "mes", "ciclo"].includes(salvo.visao)) estado.visao = salvo.visao;
} catch (e) { /* opcional */ }
const guardar = () => { try { localStorage.setItem("renderiza:ritmo", JSON.stringify({ visao: estado.visao })); } catch (e) { /* opcional */ } };

function rotuloSemana(p) {
  const [, m1, d1] = p.inicio.split("-").map(Number), [, m2, d2] = p.fim.split("-").map(Number);
  return m1 === m2 ? `${d1} a ${d2} de ${MESES_CURTOS[m2 - 1]}` : `${d1} de ${MESES_CURTOS[m1 - 1]} a ${d2} de ${MESES_CURTOS[m2 - 1]}`;
}
const rotuloMes = p => MESES[Number(p.inicio.slice(5, 7)) - 1] + " de " + p.inicio.slice(0, 4);
const rotuloCiclo = c => c.nome || `${dm(c.inicio)} a ${dma(c.fim)}`;

/**
 * @param {{host: HTMLElement, abrirLead: (id) => void, irParaPipeline: (filtro) => void}} ctx
 */
export function criarTelaRitmo(ctx) {
  function periodoAtual(hoje, ciclo) {
    if (estado.visao === "ciclo") return ciclo ? cicloComoPeriodo(ciclo) : null;
    const ref = estado.ref || hoje;
    return estado.visao === "mes" ? mesDe(ref) : semanaDe(ref);
  }

  function mover(passo) {
    const hoje = hojeLocal();
    if (estado.visao === "ciclo") {
      const ciclos = ordenarCiclos();
      const i = ciclos.findIndex(c => c.id === estado.cicloId);
      const alvo = ciclos[i + passo];
      if (alvo) { estado.cicloId = alvo.id; render(); }
      return;
    }
    const ref = estado.ref || hoje;
    if (estado.visao === "semana") estado.ref = somarDias(ref, 7 * passo);
    else { const [a, m] = ref.split("-").map(Number); const d = new Date(Date.UTC(a, m - 1 + passo, 1)); estado.ref = d.toISOString().slice(0, 10); }
    render();
  }

  const ordenarCiclos = () => [...dados.listar("ciclos")].sort((a, b) => a.inicio.localeCompare(b.inicio));

  function render() {
    const hoje = hojeLocal();
    // Clientes fora do funil (só relacionamento) não entram no placar de prospecção.
    const leads = dados.listar("leads").filter(l => !l.fora_do_funil), interacoes = dados.listar("interacoes"), ciclos = ordenarCiclos();
    let ciclo = ciclos.find(c => c.id === estado.cicloId);
    if (!ciclo) { ciclo = cicloParaMostrar(ciclos, hoje); estado.cicloId = ciclo ? ciclo.id : null; }
    const porLead = indexar(leads, interacoes);
    const periodo = periodoAtual(hoje, ciclo);
    const ehAtual = periodo && dentro(hoje, periodo);
    // A meta de semana e mês vem do ciclo que cobre o período (se houver).
    const cicloDoPeriodo = periodo && estado.visao !== "ciclo" ? ciclos.find(c => c.inicio <= periodo.fim && c.fim >= periodo.inicio) || null : ciclo;

    ctx.host.replaceChildren(...[
      barra(periodo, ciclo, ciclos, hoje, ehAtual),
      avisoDadosAntigos(leads, interacoes, porLead),
      interacoes.length ? null : h("p", { class: "grid-notice" }, "O placar começa com os contatos registrados daqui para frente. Registre nos detalhes de cada ótica (", h("strong", { text: "Registrar interação" }), ") ou peça para a IA registrar a partir do seu relato do dia."),
      periodo ? corpo(periodo, cicloDoPeriodo, ciclos, hoje, ehAtual, leads, interacoes, porLead) : semCiclo(),
    ].filter(Boolean));
  }

  /* ---------- barra ---------- */
  function barra(periodo, ciclo, ciclos, hoje, ehAtual) {
    const tabs = h("div", { class: "tabs-list", role: "tablist", "aria-label": "Período" }, ...[["semana", "Semana"], ["mes", "Mês"], ["ciclo", "Ciclo"]].map(([v, t]) =>
      h("button", { type: "button", role: "tab", class: "tabs-trigger", "aria-selected": String(estado.visao === v), "data-state": estado.visao === v ? "active" : "inactive",
        onclick: () => { estado.visao = v; estado.ref = null; estado.turmaAberta = false; guardar(); render(); } }, t)));
    const rotulo = !periodo ? "Sem ciclo" : estado.visao === "semana" ? rotuloSemana(periodo) : estado.visao === "mes" ? rotuloMes(periodo) : rotuloCiclo(ciclo);
    const i = ciclo ? ciclos.findIndex(c => c.id === ciclo.id) : -1;
    const podeVoltar = estado.visao !== "ciclo" || i > 0, podeAvancar = estado.visao !== "ciclo" || (i >= 0 && i < ciclos.length - 1);
    const nav = h("div", { class: "periodo-nav" },
      h("button", { type: "button", class: "icon-button", "aria-label": "Período anterior", disabled: !podeVoltar || !periodo || null, onclick: () => mover(-1) }, icone("esquerda", 16)),
      h("strong", { class: "periodo-rotulo", text: rotulo }),
      h("button", { type: "button", class: "icon-button", "aria-label": "Próximo período", disabled: !podeAvancar || !periodo || null, onclick: () => mover(1) }, icone("direita", 16)),
      !ehAtual && periodo && estado.visao !== "ciclo" ? h("button", { type: "button", class: "text-link", onclick: () => { estado.ref = null; render(); } }, "Voltar para hoje") : null);
    const acoes = h("div", { class: "sheet-actions" },
      h("button", { type: "button", class: "btn btn-outline", onclick: () => abrirCiclo(estado.visao === "ciclo" ? ciclo : cicloParaMostrar(ciclos, hoje)) },
        icone("ajustes", 16), ciclos.length ? "Ciclo e meta" : "Definir ciclo"),
      h("button", { type: "button", class: "btn btn-outline", onclick: () => abrirRecuperacao(), disabled: !dados.podeEditar() || null }, icone("recuperar", 16), "Óticas já contatadas"));
    return h("div", { class: "sheet-toolbar ritmo-barra" }, h("div", { class: "sheet-actions" }, tabs, nav), acoes);
  }

  function avisoDadosAntigos(leads, interacoes, porLead) {
    const faltam = semPrimeiroContato({ leads, interacoes, porLead });
    if (!faltam.length) return null;
    return h("div", { class: "grid-notice aviso-dados" },
      h("span", {}, h("strong", { text: plural(faltam.length, "ótica parece", "óticas parecem") + " já contatada" + (faltam.length === 1 ? "" : "s") }),
        ` (etapa ou painel antigo), mas sem primeiro contato registrado: ${faltam.slice(0, 3).map(l => l.empresa).join(", ")}${faltam.length > 3 ? ` e mais ${faltam.length - 3}` : ""}. ${faltam.length === 1 ? "Ela não entra" : "Elas não entram"} no placar até você registrar.`),
      h("button", { type: "button", class: "text-link", onclick: () => abrirRecuperacao(), disabled: !dados.podeEditar() || null }, "Registrar", icone("direita", 14)));
  }

  function semCiclo() {
    return h("section", { class: "card-placar vazio-ciclo" },
      h("span", { class: "section-eyebrow", text: "Ciclo" }),
      h("p", { text: "Defina o início, o fim e a meta de novas óticas do ciclo para ver o ritmo necessário. A semana e o mês funcionam sem ciclo." }),
      h("button", { type: "button", class: "btn btn-primary", onclick: () => abrirCiclo(null) }, icone("ajustes", 16), "Definir ciclo"));
  }

  /* ---------- placar ---------- */
  function corpo(periodo, ciclo, ciclos, hoje, ehAtual, leads, interacoes, porLead) {
    const p = placar({ leads, interacoes, periodo, porLead });
    const nomePeriodo = estado.visao === "ciclo" ? "o ciclo" : estado.visao === "mes" ? (ehAtual ? "este mês" : rotuloMes(periodo)) : (ehAtual ? "esta semana" : "a semana de " + rotuloSemana(periodo));
    const partes = [
      h("div", { class: "placar" }, cardNovas(p, periodo, ciclo, hoje, ehAtual, leads, interacoes, porLead), cardRelacionamento(p, nomePeriodo)),
      cardFila(leads, interacoes, porLead, hoje, ciclo),
    ];
    if (estado.visao === "mes") partes.push(cardTurma(leads, interacoes, porLead, periodo));
    if (estado.visao === "ciclo") partes.push(cardSemanas(ciclo, leads, interacoes, porLead, hoje));
    partes.push(contextoComercial(p, nomePeriodo));
    return h("div", { class: "ritmo-corpo" }, partes);
  }

  function cardNovas(p, periodo, ciclo, hoje, ehAtual, leads, interacoes, porLead) {
    const n = p.novas.length;
    const meta = estado.visao === "ciclo" ? (ciclo ? ciclo.meta_novas : null) : metaProporcional(ciclo, periodo);
    const linhas = [];
    if (ciclo && (estado.visao === "ciclo" || ehAtual)) {
      const noCiclo = placar({ leads, interacoes, periodo: cicloComoPeriodo(ciclo), porLead }).novas.length;
      const r = ritmoNecessario({ ciclo, feitas: noCiclo, hoje });
      if (r.estado === "encerrado") linhas.push(`O ciclo terminou com ${noCiclo} de ${r.meta}.`);
      else if (r.estado === "futuro") linhas.push(`O ciclo começa em ${dma(ciclo.inicio)}: cerca de ${r.porSemana} por semana para chegar a ${r.meta} até ${dma(ciclo.fim)}.`);
      else if (r.faltam === 0) linhas.push(`Meta do ciclo alcançada: ${noCiclo} de ${r.meta}.`);
      else linhas.push(r.dias < 7
        ? `Ritmo necessário: ${r.faltam} nos ${plural(r.dias, "dia", "dias")} que restam para chegar a ${r.meta}.`
        : `Ritmo necessário: ${r.porSemana} por semana até ${dma(ciclo.fim)} (faltam ${r.faltam} de ${r.meta}).`);
      if (estado.visao === "ciclo" && r.mediaPorSemana != null && r.estado === "andamento") linhas.push(`Média até aqui: ${String(r.mediaPorSemana).replace(".", ",")} por semana.`);
    } else if (!ciclo) {
      linhas.push("Sem ciclo para este período: defina um ciclo para ver meta e ritmo.");
    }
    const pct = meta ? Math.min(100, Math.round((n / meta) * 100)) : 0;
    return h("section", { class: "card-placar", "aria-label": "Novas óticas prospectadas" },
      h("span", { class: "section-eyebrow", text: "Novas óticas prospectadas" }),
      h("div", { class: "numero-linha" }, h("strong", { class: "numero-grande", text: String(n) }),
        h("span", { class: "numero-contexto", text: meta ? (estado.visao === "ciclo" ? `de ${meta} (meta do ciclo)` : `de ${meta} pela meta ${estado.visao === "mes" ? "do mês" : "da semana"}`) : "primeiros contatos" })),
      meta ? h("div", { class: "progress-track", role: "meter", "aria-label": "Novas óticas em relação à meta", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(pct) }, h("span", { style: `width:${pct}%` })) : null,
      linhas.map(t => h("p", { class: "linha-placar", text: t })),
      h("p", { class: "nota-placar", text: "Conta cada ótica uma vez, no dia do primeiro contato que você fez. Cadastrar, criar demo ou mudar etapa não conta." }));
  }

  function cardRelacionamento(p, nomePeriodo) {
    const feitos = p.retornosFeitos.length;
    const previstos = p.previstos;
    const linha = previstos
      ? h("p", { class: "linha-placar" }, `Previstos para ${nomePeriodo}: `, h("strong", { text: String(previstos) }),
          ` · ${p.cumpridos.length} feito${p.cumpridos.length === 1 ? "" : "s"} · ${p.pendentes.length} pendente${p.pendentes.length === 1 ? "" : "s"} (${Math.round((p.cumpridos.length / previstos) * 100)}% dos previstos).`)
      : h("p", { class: "linha-placar", text: `Nenhum retorno estava previsto para ${nomePeriodo}.` });
    return h("section", { class: "card-placar", "aria-label": "Relacionamento" },
      h("span", { class: "section-eyebrow", text: "Relacionamento" }),
      h("div", { class: "numero-linha" }, h("strong", { class: "numero-grande", text: String(feitos) }), h("span", { class: "numero-contexto", text: feitos === 1 ? "retorno feito" : "retornos feitos" })),
      linha,
      h("p", { class: "nota-placar", text: `Respostas recebidas: ${p.respostas}. Resposta da ótica não conta como retorno seu, e reagendar não conta como feito.` }));
  }

  function cardFila(leads, interacoes, porLead, hoje, ciclo) {
    const f = filaDeRetornos({ leads, interacoes, hoje, porLead });
    const celula = (rotulo, lista, filtro, classe = "") => h("button", { type: "button", class: "fila-celula " + classe + (lista.length ? "" : " zerada"),
      onclick: () => ctx.irParaPipeline(filtro), title: lista.length ? lista.slice(0, 8).map(x => `${x.lead.empresa} (${dm(x.data)})`).join("\n") : "" },
      h("strong", { text: String(lista.length) }), h("span", { text: rotulo }));
    const semanal = ciclo ? Math.round(ciclo.meta_novas * 7 / (diasEntre(ciclo.inicio, ciclo.fim) + 1)) : null;
    return h("section", { class: "card-placar card-fila", "aria-label": "Fila de retornos" },
      h("div", { class: "card-topo" }, h("span", { class: "section-eyebrow", text: "Retornos previstos daqui para frente" }),
        h("button", { type: "button", class: "text-link", onclick: () => ctx.irParaPipeline("retornos") }, "Ver no Pipeline", icone("direita", 14))),
      h("div", { class: "fila-celulas" },
        celula("atrasados", f.atrasados, "retornos_atrasados", f.atrasados.length ? "alerta" : ""),
        celula("esta semana", f.estaSemana, "retornos_semana"),
        celula("próxima semana", f.proxima, "retornos"),
        celula("em 2 semanas", f.emDuas, "retornos"),
        celula("depois", f.depois, "retornos")),
      semanal ? h("p", { class: "nota-placar", text: `Com cerca de ${semanal} óticas novas por semana e até 2 retornos para cada uma, a fila tende a uns ${semanal * 2} retornos por semana quando o processo estiver cheio.` }) : null);
  }

  function cardTurma(leads, interacoes, porLead, periodo) {
    const linhas = turma({ leads, interacoes, periodo, porLead });
    const nome = MESES[Number(periodo.inicio.slice(5, 7)) - 1];
    const comInteresse = linhas.filter(x => x.lead.interesse && x.lead.interesse !== "nao_avaliado").length;
    const responderam = linhas.filter(x => x.respondeu).length;
    const ganhos = linhas.filter(x => x.lead.etapa === "finalizado" && x.lead.resultado === "ganho").length;
    const perdas = linhas.filter(x => x.lead.etapa === "finalizado" && x.lead.resultado === "perda").length;
    const resumo = linhas.length
      ? `${plural(linhas.length, "ótica teve", "óticas tiveram")} o primeiro contato em ${nome}. Hoje: ${comInteresse} com interesse registrado, ${plural(responderam, "respondeu", "responderam")}` + (ganhos || perdas ? `, ${ganhos} ganho${ganhos === 1 ? "" : "s"} e ${perdas} perda${perdas === 1 ? "" : "s"}.` : ".")
      : `Nenhuma ótica teve o primeiro contato registrado em ${nome}.`;
    const tabela = estado.turmaAberta && linhas.length ? h("div", { class: "table-container turma-container" }, h("table", { class: "planilhao turma-tabela" },
      h("thead", {}, h("tr", {}, ["Ótica", "1º contato", "Etapa", "Interesse", "Última interação", "Próximo passo"].map((t, i) => h("th", { scope: "col", class: i === 0 ? "sticky-name" : "col", text: t })))),
      h("tbody", {}, linhas.map(x => {
        const u = x.ultima;
        const proximo = x.lead.nao_contatar ? "Não contatar" : x.lead.etapa === "finalizado" ? "—"
          : [x.lead.proxima_acao, x.lead.followup_em ? dm(x.lead.followup_em) : ""].filter(Boolean).join(" · ") || "Em espera";
        return h("tr", { "data-id": x.lead.id, class: "linha-clicavel", tabindex: "0", onclick: () => ctx.abrirLead(x.lead.id), onkeydown: e => { if (e.key === "Enter") ctx.abrirLead(x.lead.id); } },
          h("td", { class: "sticky-name" }, h("span", { class: "turma-nome", text: x.lead.empresa || "Sem nome" })),
          h("td", { class: "col", text: dm(x.primeiro) }),
          h("td", { class: "col", text: rotuloEtapa(x.lead) }),
          h("td", { class: "col" }, h("span", { class: "chip-interesse " + (x.lead.interesse || "nao_avaliado"), text: nomeDoInteresse(x.lead.interesse) })),
          h("td", { class: "col ultima" }, u ? h("span", { title: u.resumo || "" }, h("b", { text: (u.ocorreu_em ? dm(u.ocorreu_em) : "—") + " · " + nomeDoTipo(u.tipo) }), u.resumo ? " — " + u.resumo : "") : "—"),
          h("td", { class: "col", text: proximo }));
      })))) : null;
    return h("section", { class: "card-placar card-turma", "aria-label": "Turma do mês" },
      h("div", { class: "card-topo" }, h("span", { class: "section-eyebrow", text: "Turma de " + nome }),
        linhas.length ? h("button", { type: "button", class: "btn btn-outline btn-sm", "aria-expanded": String(estado.turmaAberta), onclick: () => { estado.turmaAberta = !estado.turmaAberta; render(); } },
          icone("lista", 15), estado.turmaAberta ? "Fechar lista" : `Ver as ${linhas.length}`) : null),
      h("p", { class: "linha-placar", text: resumo }),
      tabela);
  }

  function cardSemanas(ciclo, leads, interacoes, porLead, hoje) {
    if (hoje < ciclo.inicio) return h("section", { class: "card-placar" }, h("span", { class: "section-eyebrow", text: "Semana a semana" }), h("p", { class: "linha-placar", text: `O ciclo começa em ${dma(ciclo.inicio)}.` }));
    const linhas = semanasDoCiclo({ ciclo, leads, interacoes, hoje, porLead });
    const atual = semanaDe(hoje).inicio;
    return h("section", { class: "card-placar", "aria-label": "Semana a semana" },
      h("span", { class: "section-eyebrow", text: "Semana a semana" }),
      h("div", { class: "table-container semanas-container" }, h("table", { class: "planilhao semanas-tabela" },
        h("thead", {}, h("tr", {}, ["Semana", "Novas", "Meta", "Retornos feitos", "Previstos"].map((t, i) => h("th", { scope: "col", class: i === 0 ? "sticky-name" : "col", text: t })))),
        h("tbody", {}, [...linhas].reverse().map(l => h("tr", { class: l.periodo.inicio === atual ? "semana-atual" : "" },
          h("td", { class: "sticky-name", text: rotuloSemana(l.periodo) + (l.periodo.inicio === atual ? " (esta)" : "") }),
          h("td", { class: "col num", text: String(l.novas) }),
          h("td", { class: "col num", text: String(l.meta) }),
          h("td", { class: "col num", text: String(l.retornosFeitos) }),
          h("td", { class: "col num", text: l.previstos ? String(l.previstos) : "—" })))))));
  }

  function contextoComercial(p, nomePeriodo) {
    const soma = p.ganhos.reduce((s, l) => s + (Number(l.valor_fechado) || 0), 0);
    const texto = p.ganhos.length || p.perdas.length
      ? `Fechamentos em ${nomePeriodo} (contexto): ${plural(p.ganhos.length, "ganho", "ganhos")}${soma ? " (" + dinheiro(soma) + ")" : ""} · ${plural(p.perdas.length, "perda", "perdas")}.`
      : `Nenhum fechamento em ${nomePeriodo}.`;
    return h("p", { class: "contexto-comercial", text: texto });
  }

  /* ---------- ciclo ---------- */
  function abrirCiclo(ciclo) {
    const editando = !!ciclo;
    const hoje = hojeLocal();
    const inicio = h("input", { type: "date", required: true, value: ciclo ? ciclo.inicio : hoje });
    const fim = h("input", { type: "date", required: true, value: ciclo ? ciclo.fim : hoje.slice(0, 4) + "-12-31" });
    const meta = h("input", { type: "number", min: "1", step: "1", required: true, inputmode: "numeric", value: ciclo ? String(ciclo.meta_novas) : "", placeholder: "Ex.: 180" });
    const d1 = h("input", { type: "number", min: "1", max: "120", step: "1", required: true, value: String(ciclo ? ciclo.dias_primeiro_retorno : 7) });
    const d2 = h("input", { type: "number", min: "2", max: "365", step: "1", required: true, value: String(ciclo ? ciclo.dias_segundo_retorno : 21) });
    const nome = h("input", { type: "text", maxlength: "60", value: (ciclo && ciclo.nome) || "", placeholder: "Opcional. Ex.: Até dezembro" });
    const previa = h("p", { class: "dica-form" });
    const erro = h("p", { class: "erro-form", hidden: true });
    const atualizarPrevia = () => {
      const n = Number(meta.value);
      if (!inicio.value || !fim.value || !n || fim.value < inicio.value) { previa.textContent = ""; return; }
      const dias = diasEntre(inicio.value, fim.value) + 1;
      previa.textContent = `${dias} dias: cerca de ${Math.round(n * 7 / dias)} por semana e ${Math.round(n * 30.4 / dias)} por mês.`;
    };
    const form = h("form", { class: "dialog-form" },
      h("div", { class: "linha-form" }, h("label", {}, "Início", inicio), h("label", {}, "Fim", fim), h("label", {}, "Meta de novas óticas", meta)),
      previa,
      h("div", { class: "linha-form" }, h("label", {}, "1º retorno (dias depois do contato)", d1), h("label", {}, "2º retorno (dias depois do contato)", d2), h("label", {}, "Nome", nome)),
      h("p", { class: "dica-form", text: "A cadência vale para óticas que não responderam e é só uma sugestão de data de follow-up; nenhuma mensagem é enviada. Depois do 2º retorno a ótica fica em espera." }),
      erro,
      h("div", { class: "janela-acoes" },
        editando ? h("button", { type: "button", class: "btn btn-ghost-destructive", onclick: () => excluirCiclo(ciclo, fechar) }, icone("lixo", 15), "Excluir ciclo") : null,
        editando ? h("button", { type: "button", class: "btn btn-outline", onclick: () => { fechar(); abrirCiclo(null); } }, icone("mais", 15), "Novo ciclo") : null,
        h("button", { type: "submit", class: "btn btn-primary" }, "Salvar")));
    form.addEventListener("input", atualizarPrevia);
    atualizarPrevia();
    const { fechar } = abrirJanela({ titulo: editando ? "Ciclo e meta" : "Novo ciclo", descricao: "Os números são seus: início, fim e quantas óticas novas quer prospectar no ciclo.", conteudo: form, larga: true });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const valores = { nome: nome.value.trim(), inicio: inicio.value, fim: fim.value, meta_novas: Number(meta.value), dias_primeiro_retorno: Number(d1.value), dias_segundo_retorno: Number(d2.value) };
      const msg = !valores.inicio || !valores.fim ? "Preencha início e fim." : valores.fim < valores.inicio ? "O fim precisa ser depois do início."
        : !(valores.meta_novas >= 1) ? "A meta precisa ser um número maior que zero."
        : !(valores.dias_segundo_retorno > valores.dias_primeiro_retorno) ? "O 2º retorno precisa vir depois do 1º." : "";
      if (msg) { erro.textContent = msg; erro.hidden = false; return; }
      try {
        const salvo = editando ? await salvar("ciclos", ciclo.id, valores) : await criar("ciclos", valores);
        estado.cicloId = salvo.id;
        fechar();
        aviso("Ciclo salvo.");
      } catch (err) { /* aviso já mostrado */ }
    });
  }

  async function excluirCiclo(ciclo, fecharJanela) {
    const ok = await confirmar({ titulo: "Excluir este ciclo?", descricao: "Só a configuração (datas, meta e cadência) sai. Óticas e interações continuam.", confirmarTexto: "Excluir ciclo", destrutivo: true });
    if (!ok) return;
    try { await dados.excluir("ciclos", ciclo.id); estado.cicloId = null; fecharJanela(); aviso("Ciclo excluído."); } catch (e) { falhou(e); }
  }

  return { render };
}
