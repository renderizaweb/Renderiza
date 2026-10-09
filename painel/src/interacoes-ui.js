// Interações nos detalhes do lead: registrar (ou corrigir) o que aconteceu, linha do tempo
// e recuperação de óticas contatadas antes do painel. O que é plano (Próxima ação, Follow-up)
// fica separado do que aconteceu, para o placar da tela Ritmo ser honesto.

import * as dados from "./dados.js";
import { h, opcoesDoSelect } from "./dom.js";
import { icone } from "./icones.js";
import { abrirJanela, confirmar, aviso } from "./ui.js";
import { salvar, criar, falhou, patchDeInteresse, patchDeNaoContatar, juntar } from "./acoes.js";
import {
  TIPOS_INTERACAO, CANAIS_CONTATO, INTERESSES, opcoesDeEtapa, nomeDoTipo, nomeDoCanalDeContato, nomeDoInteresse,
  dataDaInteracao, textoDoHistorico, novoLead, rotuloEtapa,
} from "./modelo.js";
import {
  hojeLocal, primeiroContato, retornoSugerido, cicloVigente, validarInteracao, cronologica, retornoPendente,
  pistaDoPainelAntigo, semPrimeiroContato, chaveDoNome, indexar,
} from "./ritmo.js";

const diaMes = iso => (iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : "");
const diaCompleto = iso => (iso ? iso.split("-").reverse().join("/") : "");

export const interacoesDa = leadId => dados.listar("interacoes").filter(i => i.lead_id === leadId).sort(cronologica);
const cicloAtual = () => cicloVigente(dados.listar("ciclos"), hojeLocal());

/** "1º contato em 22/09/2026 · 2 retornos · respondeu" */
export function resumoDoContato(lista) {
  const pc = primeiroContato(lista);
  if (!pc) return lista.length ? "Sem primeiro contato registrado." : "Nenhum contato registrado ainda.";
  const retornos = lista.filter(i => i.tipo === "retorno").length;
  const partes = ["1º contato " + (pc.precisao && pc.precisao !== "exata" ? dataDaInteracao(pc) : "em " + dataDaInteracao(pc))];
  if (retornos) partes.push(retornos === 1 ? "1 retorno" : retornos + " retornos");
  if (lista.some(i => i.tipo === "resposta")) partes.push("respondeu");
  return partes.join(" · ");
}

/* ---------- registrar ou corrigir uma interação ---------- */

/**
 * Janela de registro. Sem `interacao`: registra uma nova e, junto, o próximo passo (plano).
 * Com `interacao`: corrige o que foi registrado (tipo, data, canal, resumo) ou exclui.
 */
export function abrirRegistro(leadId, { interacao = null, tipo: tipoInicial = null } = {}) {
  const lead = dados.buscar("leads", leadId);
  if (!lead) return;
  const editando = !!interacao;
  const hoje = hojeLocal();
  const outras = interacoesDa(leadId).filter(i => !interacao || i.id !== interacao.id);
  const pc = primeiroContato(outras);
  const ciclo = cicloAtual();

  // Tipo
  const bloqueio = t => (t === "primeiro_contato" && pc ? `Já registrado: ${dataDaInteracao(pc)}.`
    : t === "retorno" && !pc ? "Registre o primeiro contato antes." : "");
  const inicial = editando ? interacao.tipo : tipoInicial && !bloqueio(tipoInicial) ? tipoInicial : !pc ? "primeiro_contato" : "retorno";
  const radios = TIPOS_INTERACAO.map(t => {
    const motivo = bloqueio(t.id);
    const input = h("input", { type: "radio", name: "tipo", value: t.id, checked: t.id === inicial || null, disabled: motivo ? true : null });
    return h("label", { class: "tipo-opcao" + (motivo ? " bloqueada" : ""), "data-tipo": t.id }, input,
      h("span", {}, h("strong", { text: t.nome }), h("small", { text: motivo || t.ajuda })));
  });
  const tipo = () => (radios.map(r => r.querySelector("input")).find(i => i.checked) || {}).value;

  // Quando
  const precisaoSel = h("select", { class: "select-trigger largo", "aria-label": "Precisão da data" },
    h("option", { value: "exata", text: "Sei o dia" }),
    h("option", { value: "aproximada", text: "Foi antes, sei só o mês" }),
    h("option", { value: "desconhecida", text: "Foi antes, não sei quando" }));
  precisaoSel.value = (interacao && interacao.precisao) || "exata";
  const data = h("input", { type: "date", max: hoje, value: (interacao && interacao.precisao !== "aproximada" && interacao.ocorreu_em) || hoje, "aria-label": "Dia em que aconteceu" });
  const mes = h("input", { type: "month", max: hoje.slice(0, 7), value: (interacao && interacao.precisao === "aproximada" && interacao.ocorreu_em ? interacao.ocorreu_em.slice(0, 7) : ""), "aria-label": "Mês aproximado" });
  const campoPrecisao = h("label", {}, "Quando", precisaoSel);
  const campoData = h("label", {}, "Dia em que aconteceu", data);
  const campoMes = h("label", {}, "Mês aproximado", mes);
  const avisoPrecisao = h("p", { class: "dica-form" });

  // Detalhes
  const canal = h("select", { class: "select-trigger largo", "aria-label": "Canal" }, h("option", { value: "", text: "—" }), ...CANAIS_CONTATO.map(c => h("option", { value: c.id, text: c.nome })));
  canal.value = (interacao && interacao.canal) || "";
  const resumo = h("input", { type: "text", maxlength: "280", value: (interacao && interacao.resumo) || "", autocomplete: "off" });
  const interesse = h("select", { class: "select-trigger largo", "aria-label": "Interesse demonstrado" },
    h("option", { value: "", text: "Não muda" }), ...INTERESSES.filter(x => x.id !== "nao_avaliado").map(x => h("option", { value: x.id, text: x.nome })));
  interesse.value = (interacao && interacao.interesse) || "";
  const campoInteresse = h("label", {}, "Interesse", interesse);
  const naoContatar = h("input", { type: "checkbox" });
  const campoNaoContatar = h("label", { class: "check-form" }, naoContatar, "Pediu para não receber mais contato (sai da fila de retornos)");

  // Próximo passo (plano) — só no registro novo
  const proxima = h("input", { type: "text", value: lead.proxima_acao || "", autocomplete: "off", placeholder: "Ex.: mandar o vídeo" });
  const followup = h("input", { type: "date", value: lead.followup_em || "" });
  const dicaFollowup = h("p", { class: "dica-form" });
  let followupMexido = false;
  followup.addEventListener("input", () => { followupMexido = true; });

  const erro = h("p", { class: "erro-form", hidden: true });
  const botao = h("button", { type: "submit", class: "btn btn-primary btn-lg" }, editando ? "Salvar correção" : "Registrar", icone("certo", 16));

  const montar = () => {
    const t = tipo();
    const p = t === "primeiro_contato" ? precisaoSel.value : "exata";
    const ocorreu_em = p === "desconhecida" ? null : p === "aproximada" ? (mes.value ? mes.value + "-01" : "") : data.value;
    return { lead_id: leadId, tipo: t, precisao: p, ocorreu_em, canal: canal.value || null, resumo: resumo.value.trim(), interesse: interesse.value || null };
  };

  function ajustar() {
    const t = tipo();
    const p = t === "primeiro_contato" ? precisaoSel.value : "exata";
    campoPrecisao.hidden = t !== "primeiro_contato";
    campoData.hidden = p !== "exata";
    campoMes.hidden = p !== "aproximada";
    avisoPrecisao.textContent = t !== "primeiro_contato" ? ""
      : p === "exata" ? "Conta como ótica nova na semana e no mês desse dia."
      : "Fica registrada como já contatada, sem contar como ótica nova em nenhum período.";
    campoInteresse.hidden = !(t === "resposta" || t === "anotacao");
    campoNaoContatar.hidden = t !== "resposta" || editando;
    resumo.placeholder = t === "resposta" ? "Ex.: pediu para receber o vídeo" : t === "anotacao" ? "Ex.: dono volta de férias dia 10" : t === "retorno" ? "Ex.: mandei o vídeo da demo" : "Ex.: mandei a demo pelo WhatsApp";
    if (editando) return;
    followup.disabled = naoContatar.checked;
    if (naoContatar.checked) { followup.value = ""; dicaFollowup.textContent = "Sem follow-up: a ótica sai da fila de retornos."; return; }
    const nova = montar();
    const sugestao = (t === "primeiro_contato" || t === "retorno") && nova.ocorreu_em !== ""
      ? retornoSugerido(lead, [...outras, { ...nova, id: "_nova" }].sort(cronologica), ciclo) : null;
    if (t === "primeiro_contato" || t === "retorno") {
      if (!followupMexido) followup.value = sugestao ? sugestao.data : "";
      dicaFollowup.textContent = sugestao ? `Cadência: ${diaCompleto(sugestao.data)} (${sugestao.texto}). É só uma sugestão.`
        : t === "retorno" && outras.some(i => i.tipo === "resposta") ? "A ótica já respondeu: use a data combinada, se houver."
        : t === "retorno" ? "Depois de dois retornos sem resposta, a ótica fica em espera até haver um motivo para retomar."
        : "Sem o dia do primeiro contato, a cadência não sugere data.";
    } else if (t === "resposta") {
      if (!followupMexido) followup.value = lead.followup_em && lead.followup_em >= hoje ? lead.followup_em : "";
      dicaFollowup.textContent = "Se combinaram uma data, coloque aqui.";
    } else {
      if (!followupMexido) followup.value = lead.followup_em || "";
      dicaFollowup.textContent = "";
    }
  }

  const form = h("form", { class: "dialog-form form-interacao" },
    h("div", { class: "tipo-opcoes", role: "radiogroup", "aria-label": "O que aconteceu" }, radios),
    h("div", { class: "linha-form" }, campoPrecisao, campoData, campoMes, h("label", {}, "Canal (opcional)", canal), campoInteresse),
    avisoPrecisao,
    h("label", {}, "Resumo curto", resumo),
    campoNaoContatar,
    editando ? null : h("div", { class: "secao-form" },
      h("span", { class: "section-eyebrow", text: "Próximo passo (planejado)" }),
      h("div", { class: "linha-form" }, h("label", { class: "duplo" }, "Próxima ação", proxima), h("label", {}, "Follow-up", followup)),
      dicaFollowup),
    erro,
    h("div", { class: "janela-acoes" },
      editando ? h("button", { type: "button", class: "btn btn-ghost-destructive", onclick: () => excluirInteracao(interacao, fechar) }, icone("lixo", 15), "Excluir") : null,
      botao));
  form.addEventListener("change", ajustar);
  data.addEventListener("input", ajustar);
  mes.addEventListener("input", ajustar);
  ajustar();

  const { fechar } = abrirJanela({
    titulo: (editando ? "Corrigir interação · " : "Registrar interação · ") + (lead.empresa || "ótica"),
    descricao: editando ? "Corrija o que foi registrado. O próximo passo se ajusta nos detalhes da ótica."
      : "Só o que já aconteceu. O que você pretende fazer vai em Próxima ação e Follow-up.",
    conteudo: form, larga: true,
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    erro.hidden = true;
    const nova = montar();
    if (!nova.tipo) { erro.textContent = "Escolha o que aconteceu."; erro.hidden = false; return; }
    if (nova.ocorreu_em === "") { erro.textContent = nova.precisao === "aproximada" ? "Escolha o mês aproximado." : "Escolha o dia."; erro.hidden = false; return; }
    const msg = validarInteracao({ ...nova, id: interacao ? interacao.id : "_nova" }, outras, hojeLocal());
    if (msg) { erro.textContent = msg; erro.hidden = false; return; }
    if (!dados.podeEditar()) { erro.textContent = "Sem conexão com o banco. Nada foi salvo."; erro.hidden = false; return; }
    botao.disabled = true;
    try {
      if (editando) {
        const mudancas = {};
        for (const k of ["tipo", "precisao", "ocorreu_em", "canal", "resumo", "interesse"]) if ((nova[k] ?? null) !== (interacao[k] ?? null)) mudancas[k] = nova[k];
        if (nova.tipo !== "retorno") mudancas.previsto_para = null;
        if (Object.keys(mudancas).length) await salvar("interacoes", interacao.id, mudancas);
        aviso("Interação corrigida.");
        fechar();
        return;
      }
      const atual = dados.buscar("leads", leadId) || lead;
      const registro = { ...nova, origem: "painel" };
      if (nova.tipo === "retorno") registro.previsto_para = atual.followup_em || null; // o follow-up que este retorno cumpre
      await criar("interacoes", registro);
      fechar();
      // O próximo passo e o interesse ficam na ótica.
      const plano = {};
      if ((followup.value || null) !== (atual.followup_em || null)) plano.followup_em = followup.value || null;
      if (proxima.value.trim() !== (atual.proxima_acao || "")) plano.proxima_acao = proxima.value.trim();
      const patch = juntar(atual, plano,
        nova.interesse ? patchDeInteresse(atual, nova.interesse, nova.resumo || atual.interesse_motivo || null) : {},
        naoContatar.checked ? patchDeNaoContatar(atual, true) : {});
      if (Object.keys(patch).length) {
        try { await dados.salvar("leads", leadId, patch); }
        catch (err) { if (!err.rede) aviso("A interação foi registrada, mas o próximo passo não: " + err.message, "erro"); return; }
      }
      aviso({ primeiro_contato: "Primeiro contato registrado.", retorno: "Retorno registrado.", resposta: "Resposta registrada.", anotacao: "Anotação registrada." }[nova.tipo]);
    } catch (err) { /* aviso já mostrado; a janela continua aberta se não fechou */ }
    finally { botao.disabled = false; }
  });
}

async function excluirInteracao(interacao, fecharJanela) {
  if (interacao.tipo === "primeiro_contato" && interacoesDa(interacao.lead_id).some(i => i.tipo === "retorno")) {
    aviso("Esta ótica tem retornos registrados. Exclua ou corrija os retornos antes de excluir o primeiro contato.", "erro");
    return;
  }
  const ok = await confirmar({
    titulo: "Excluir esta interação?",
    descricao: `${nomeDoTipo(interacao.tipo)} de ${dataDaInteracao(interacao)}${interacao.resumo ? ": " + interacao.resumo : ""}. O placar da tela Ritmo muda junto.`,
    confirmarTexto: "Excluir interação", destrutivo: true,
  });
  if (!ok) return;
  try { await dados.excluir("interacoes", interacao.id); fecharJanela(); aviso("Interação excluída."); } catch (e) { falhou(e); }
}

/* ---------- linha do tempo ---------- */

/** Linha do tempo da ótica: interações (o que aconteceu) e mudanças (etapa, interesse). Mais recente primeiro. */
export function criarLinhaDoTempo(leadId) {
  const lista = h("ol", { class: "linha-do-tempo" });
  const resumo = h("p", { class: "resumo-contato" });
  const alerta = h("p", { class: "grid-notice alerta-retorno", hidden: true });
  const el = h("div", { class: "bloco-interacoes" }, resumo, alerta, lista);

  function atualizar(lead) {
    const ints = interacoesDa(leadId);
    resumo.textContent = resumoDoContato(ints);
    const hoje = hojeLocal();
    const pendente = retornoPendente(lead, ints);
    alerta.hidden = !(pendente && pendente < hoje);
    if (pendente && pendente < hoje) alerta.textContent = `Retorno previsto para ${diaCompleto(pendente)} ainda não foi feito. Reagendar não conta como feito.`;
    const itens = [
      ...ints.map(i => ({ data: i.ocorreu_em || "", ordem: String(i.criado_em || ""), i })),
      ...(Array.isArray(lead.historico) ? lead.historico : []).map(x => ({ data: String(x.em || "").slice(0, 10), ordem: String(x.em || ""), x })),
    ].sort((a, b) => b.data.localeCompare(a.data) || b.ordem.localeCompare(a.ordem));
    if (!itens.length) {
      lista.replaceChildren(h("li", { class: "vazio" }, "Nada registrado ainda. O placar da tela Ritmo só conta o que for registrado aqui (ou pela IA a partir do seu relato)."));
      return;
    }
    const editavel = dados.podeEditar();
    lista.replaceChildren(...itens.map(({ i, x }) => {
      if (x) return h("li", { class: "tl-item tl-mudanca" }, h("time", { text: x.em ? diaCompleto(String(x.em).slice(0, 10)) : "—" }), h("div", { class: "tl-corpo" }, h("span", { text: textoDoHistorico(x) })));
      return h("li", { class: "tl-item tl-" + i.tipo },
        h("time", { text: dataDaInteracao(i) }),
        h("div", { class: "tl-corpo" },
          h("div", { class: "tl-topo" },
            h("strong", { text: nomeDoTipo(i.tipo) }),
            i.canal ? h("span", { class: "tl-canal", text: nomeDoCanalDeContato(i.canal) }) : null,
            i.interesse ? h("span", { class: "chip-interesse " + i.interesse, text: "→ " + nomeDoInteresse(i.interesse) }) : null,
            i.origem === "ia" ? h("span", { class: "tl-origem", text: "pela IA" }) : i.origem === "importacao" ? h("span", { class: "tl-origem", text: "importado" }) : null,
            editavel ? h("button", { type: "button", class: "tl-editar", title: "Corrigir", "aria-label": "Corrigir interação", onclick: () => abrirRegistro(leadId, { interacao: i }) }, icone("editar", 13)) : null),
          i.resumo ? h("p", { class: "tl-resumo", text: i.resumo }) : null,
          i.tipo === "retorno" && i.previsto_para ? h("small", { class: "tl-nota", text: "Cumpriu o follow-up de " + diaCompleto(i.previsto_para) + "." }) : null));
    }));
  }
  return { el, atualizar };
}

/* ---------- óticas contatadas antes do painel ---------- */

/**
 * Recuperar aos poucos óticas que já foram contatadas (por exemplo, conversas antigas no WhatsApp).
 * Elas ficam registradas como já contatadas, com data aproximada ou desconhecida, e NÃO contam como
 * ótica nova. Data exata só se você tiver certeza (aí conta no período daquele dia).
 */
export function abrirRecuperacao() {
  const corpo = h("div", { class: "recuperacao" });
  const { fechar } = abrirJanela({
    titulo: "Óticas já contatadas",
    descricao: "Registre aos poucos as conversas que começaram fora do painel. Com mês aproximado ou sem data, a ótica fica como já contatada e não conta como nova em nenhum período.",
    conteudo: corpo, larga: true,
  });

  function desenhar() {
    const leads = dados.listar("leads"), interacoes = dados.listar("interacoes");
    const porLead = indexar(leads, interacoes);
    const faltam = semPrimeiroContato({ leads, interacoes, porLead });
    corpo.replaceChildren(
      h("section", {}, h("h3", { class: "section-eyebrow", text: faltam.length ? `No painel, sem primeiro contato registrado (${faltam.length})` : "No painel" }),
        faltam.length ? h("div", { class: "lista-recuperar" }, faltam.map(linhaExistente))
          : h("p", { class: "muted", text: "Todas as óticas que parecem já contatadas têm primeiro contato registrado." })),
      h("section", {}, h("h3", { class: "section-eyebrow", text: "Ótica que ainda não está no painel" }), formNova()));
  }

  function controlesDeData(sugestao) {
    const precisao = h("select", { class: "select-trigger", "aria-label": "Quando foi o primeiro contato" },
      h("option", { value: "aproximada", text: "Sei só o mês" }), h("option", { value: "desconhecida", text: "Não sei quando" }), h("option", { value: "exata", text: "Sei o dia" }));
    const mes = h("input", { type: "month", max: hojeLocal().slice(0, 7), "aria-label": "Mês aproximado" });
    const dia = h("input", { type: "date", max: hojeLocal(), "aria-label": "Dia exato", hidden: true });
    const nota = h("small", { class: "dica-form", hidden: true, text: "Com o dia exato ela conta como ótica nova no período desse dia. Use só se tiver certeza (olhando a conversa, por exemplo)." });
    const usar = sugestao ? h("button", { type: "button", class: "text-link", onclick: () => { precisao.value = "exata"; dia.value = sugestao.data; ajustar(); } }, "Usar " + diaCompleto(sugestao.data)) : null;
    const ajustar = () => { mes.hidden = precisao.value !== "aproximada"; dia.hidden = precisao.value !== "exata"; nota.hidden = precisao.value !== "exata"; };
    precisao.addEventListener("change", ajustar);
    ajustar();
    const valor = () => ({
      precisao: precisao.value,
      ocorreu_em: precisao.value === "desconhecida" ? null : precisao.value === "aproximada" ? (mes.value ? mes.value + "-01" : "") : dia.value,
    });
    return { els: [precisao, mes, dia], nota, usar, valor };
  }

  async function registrarPrimeiro(leadId, datas, resumo) {
    const v = datas.valor();
    if (v.ocorreu_em === "") { aviso(v.precisao === "aproximada" ? "Escolha o mês aproximado (ou \"Não sei quando\")." : "Escolha o dia.", "erro"); return false; }
    const nova = { lead_id: leadId, tipo: "primeiro_contato", ...v, canal: null, resumo, origem: "painel" };
    const msg = validarInteracao({ ...nova, id: "_nova" }, interacoesDa(leadId), hojeLocal());
    if (msg) { aviso(msg, "erro"); return false; }
    await criar("interacoes", nova);
    return true;
  }

  function linhaExistente(lead) {
    const pista = pistaDoPainelAntigo(lead);
    const datas = controlesDeData(pista);
    const contexto = h("input", { type: "text", placeholder: "Contexto (opcional)", maxlength: "280", "aria-label": "Contexto" });
    const botao = h("button", { type: "button", class: "btn btn-outline btn-sm" }, "Registrar");
    botao.addEventListener("click", async () => {
      botao.disabled = true;
      try { if (await registrarPrimeiro(lead.id, datas, contexto.value.trim())) { aviso(lead.empresa + ": registrada como já contatada."); desenhar(); } }
      catch (e) { /* aviso já mostrado */ } finally { botao.disabled = false; }
    });
    return h("div", { class: "item-recuperar" },
      h("div", { class: "item-recuperar-nome" }, h("strong", { text: lead.empresa || "Sem nome" }), h("span", { class: "muted", text: rotuloEtapa(lead) }),
        pista ? h("small", { class: "pista" }, pista.texto + " ", datas.usar) : null),
      h("div", { class: "item-recuperar-campos" }, datas.els, contexto, botao),
      datas.nota);
  }

  function formNova() {
    const nome = h("input", { type: "text", required: true, maxlength: "120", placeholder: "Nome da ótica", autocomplete: "off" });
    const etapa = h("select", { class: "select-trigger largo", "aria-label": "Etapa" }, opcoesDoSelect(opcoesDeEtapa({ finalizado: false })));
    etapa.value = "sem_resposta"; // conversa antiga que parou; se ainda estiver andando, escolha Em negociação
    const datas = controlesDeData(null);
    const contexto = h("input", { type: "text", maxlength: "280", placeholder: "Ex.: conversamos em junho, pediu para falar depois das férias", autocomplete: "off" });
    const proxima = h("input", { type: "text", autocomplete: "off", placeholder: "Opcional" });
    const followup = h("input", { type: "date" });
    const duplicata = h("p", { class: "erro-form", hidden: true });
    const botao = h("button", { type: "submit", class: "btn btn-primary" }, icone("mais", 15), "Adicionar como já contatada");
    const form = h("form", { class: "dialog-form" },
      h("div", { class: "linha-form" }, h("label", { class: "duplo" }, "Ótica", nome), h("label", {}, "Etapa", etapa)),
      h("div", { class: "campo-datas" }, h("span", { text: "Primeiro contato" }), h("div", { class: "item-recuperar-campos" }, datas.els), datas.nota),
      h("label", {}, "Contexto", contexto),
      h("div", { class: "linha-form" }, h("label", { class: "duplo" }, "Próxima ação", proxima), h("label", {}, "Follow-up", followup)),
      duplicata,
      h("div", { class: "janela-acoes" }, botao));
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const empresa = nome.value.trim();
      if (!empresa) return;
      const igual = dados.listar("leads").find(l => chaveDoNome(l.empresa) === chaveDoNome(empresa));
      if (igual) {
        duplicata.textContent = `Já existe "${igual.empresa}" no painel${igual.cidade ? " (" + igual.cidade + ")" : ""}. Se for a mesma ótica, registre pela lista acima ou nos detalhes dela.`;
        duplicata.hidden = false;
        return;
      }
      duplicata.hidden = true;
      if (datas.valor().ocorreu_em === "") { aviso("Escolha o mês aproximado (ou \"Não sei quando\").", "erro"); return; }
      botao.disabled = true;
      try {
        const posicao = Math.max(0, ...dados.listar("leads").map(l => (typeof l.posicao === "number" ? l.posicao : Date.parse(l.criado_em) / 1000 || 0))) + 1000;
        const lead = await criar("leads", { ...novoLead(empresa), etapa: etapa.value, proxima_acao: proxima.value.trim(), followup_em: followup.value || null, posicao });
        if (await registrarPrimeiro(lead.id, datas, contexto.value.trim())) { aviso(empresa + ": adicionada como já contatada."); desenhar(); }
      } catch (err) { /* aviso já mostrado */ } finally { botao.disabled = false; }
    });
    return form;
  }

  desenhar();
  return { fechar };
}
