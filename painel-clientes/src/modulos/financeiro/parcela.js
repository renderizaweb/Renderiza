// Financeiro (Missão 3, bloco D): a parcela. "Recebi" (dar baixa: a forma e a data, com desfazer; 09), a gaveta
// (editar, desfazer o recebimento, apagar a que não foi paga, o lembrete no WhatsApp) e registrar uma parcela nova ou
// um pagamento que já entrou ("+ Registrar pagamento": "Para quem?", a festa, o valor).
// `ctx`: { banco, conta, nicho, pode, avisar, navegar, fuso, hoje, aoMudar, recarregar }.

import { abrirGaveta, abrirFolha, confirmar } from "../../ui/gaveta.js";
import { abrirParaQuem } from "../../ui/para-quem.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { campoTexto, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { ligarCopiar } from "../../ui/whatsapp.js";
import { moeda, lerValor, dataCurta, instanteNoFuso, linkWhatsapp, normalizarWhatsapp } from "../../ui/formatos.js";
import { FORMAS, nomeDaForma, SITUACOES, situacaoDaParcela, textoDoVencimento, mensagemDeLembrete } from "./logica.js";

export const COLUNAS_PARCELA = "id, cliente_id, reserva_id, descricao, valor, vence_em, pago_em, forma, observacao, criado_em, "
  + "clientes(id, nome, whatsapp), reservas(id, inicio, titulo, tipos_reserva(nome), servicos(nome))";

export const etiquetaDaParcela = (p, hoje) => {
  const s = SITUACOES[situacaoDaParcela(p, hoje)];
  return `<span class="rz-etiqueta${s.tom ? ` rz-etiqueta--${s.tom}` : ""}">${escapar(s.nome)}</span>`;
};
export const daReserva = (r, fuso) => (r ? `${(r.titulo || (r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome) || "Reserva")} · ${dataCurta(new Date(r.inicio), fuso)}` : "");

async function gravarPagamento(p, mudanca, ctx, texto) {
  const { banco, avisar } = ctx;
  const antes = { pago_em: p.pago_em, forma: p.forma };
  const gravar = m => banco.resultado(banco.tabela("parcelas").update(m).eq("id", p.id));
  Object.assign(p, mudanca);
  ctx.aoMudar();
  try {
    await gravar(mudanca);
    avisar(texto, { desfazer: async () => { Object.assign(p, antes); ctx.aoMudar(); try { await gravar(antes); } catch (e) { avisar(e.message, { tipo: "erro" }); ctx.recarregar(); } } });
  } catch (e) {
    Object.assign(p, antes);
    ctx.aoMudar();
    avisar(e.message, { tipo: "erro" });
  }
}

/** "Recebi": pergunta a forma (e a data, hoje por padrão) e dá baixa na hora. */
export function receber(p, ctx) {
  const { hoje, fuso } = ctx;
  const folha = abrirFolha({
    titulo: `Recebi ${moeda(p.valor)}`,
    corpo: `<form class="rz-pilha" novalidate id="form-receber">
        <p class="rz-texto-2">${escapar((p.clientes && p.clientes.nome) || "")} · ${escapar(p.descricao)}</p>
        <fieldset class="rz-campo"><legend class="rz-rotulo">Como entrou</legend>
          <div class="rz-chips rz-chips--quebra" role="radiogroup" aria-label="Como entrou">${FORMAS.map(f => `<label class="rz-chip"><input type="radio" name="forma" value="${f.id}"${(p.forma || "pix") === f.id ? " checked" : ""}>${escapar(f.nome)}</label>`).join("")}</div></fieldset>
        ${campoTexto({ id: "receber-data", nome: "data", rotulo: "Quando", tipo: "date", valor: hoje })}
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-receber">${icone("ok")}Recebi</button>`,
  });
  const form = folha.el.querySelector("form");
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const d = lerFormulario(form);
    folha.fechar();
    gravarPagamento(p, { pago_em: d.data || hoje, forma: d.forma || null }, ctx, `${moeda(p.valor)} de ${(p.clientes && p.clientes.nome) || "cliente"}: recebido${d.data && d.data !== hoje ? ` em ${dataCurta(instanteNoFuso(d.data, "12:00", fuso), fuso)}` : ""}.`);
  });
}

/** A gaveta da parcela. */
export function abrirParcela(p, ctx) {
  const { pode, hoje, fuso, conta, nicho, banco, avisar } = ctx;
  const edita = pode("financeiro", "editar");
  const numero = normalizarWhatsapp(p.clientes && p.clientes.whatsapp);
  const lembrete = mensagemDeLembrete(p, { conta, nicho, hoje, fuso });
  const j = abrirGaveta({
    foco: "fechar",
    titulo: `${p.descricao} · ${moeda(p.valor)}`,
    subtitulo: escapar([(p.clientes && p.clientes.nome), daReserva(p.reservas, fuso)].filter(Boolean).join(" · ")),
    corpo: `<div class="rz-pilha">
        <div class="rz-etiquetas">${etiquetaDaParcela(p, hoje)}</div>
        <dl class="rz-fatos">
          <div><dt>Vencimento</dt><dd>${escapar(dataCurta(instanteNoFuso(p.vence_em, "12:00", fuso), fuso))}</dd></div>
          <div><dt>Situação</dt><dd>${escapar(textoDoVencimento(p, hoje, fuso))}</dd></div>
          ${p.pago_em ? `<div><dt>Como entrou</dt><dd>${escapar(nomeDaForma(p.forma) || "não anotado")}</dd></div>` : ""}
        </dl>
        ${p.observacao ? `<div class="rz-balao">${escapar(p.observacao)}</div>` : ""}
        ${!p.pago_em ? `<div><p class="rz-rotulo">Lembrete</p><div class="rz-balao">${escapar(lembrete)}</div>
          <div class="rz-whatsapp">${numero ? `<a class="rz-botao" href="${escapar(linkWhatsapp(numero, lembrete))}" target="_blank" rel="noopener">${icone("whatsapp")}Lembrar no WhatsApp</a>` : ""}<button class="rz-botao rz-botao--fantasma" type="button" data-copiar="${escapar(lembrete)}">${icone("copiar")}Copiar mensagem</button></div></div>` : ""}
        <div class="rz-pilha-p">
          ${p.reservas ? `<button class="rz-link" type="button" data-ver-festa>${icone("carteira", { tamanho: 16 })} Ver ${escapar(nicho.palavras.aReserva)} no Financeiro</button>` : ""}
          ${p.clientes && pode("clientes", "ver") ? `<a class="rz-link" href="/clientes?cliente=${escapar(p.cliente_id)}">${icone("clientes", { tamanho: 16 })} Ver ${escapar(p.clientes.nome)}</a>` : ""}
        </div>
        ${edita && p.pago_em ? `<button class="rz-botao rz-botao--fantasma" type="button" data-desfazer-recebimento>Não recebi (voltar a "a receber")</button>` : ""}
        ${edita && !p.pago_em ? `<button class="rz-botao rz-botao--fantasma" type="button" data-apagar>${icone("lixo", { tamanho: 16 })}Apagar a parcela</button>` : ""}
      </div>`,
    rodape: [
      edita ? `<button class="rz-botao" type="button" data-editar>${icone("editar")}Editar</button>` : "",
      edita && !p.pago_em ? `<button class="rz-botao rz-botao--primario" type="button" data-recebi>${icone("ok")}Recebi</button>` : "",
    ].filter(Boolean).join(""),
  });
  const el = j.el;
  ligarCopiar(el);
  el.querySelector("[data-recebi]")?.addEventListener("click", () => { j.fechar(); receber(p, ctx); });
  el.querySelector("[data-editar]")?.addEventListener("click", () => { j.fechar(); abrirFormParcela(ctx, { parcela: p }); });
  el.querySelector("[data-ver-festa]")?.addEventListener("click", () => { j.fechar(); ctx.abrirFesta(p.reserva_id); });
  el.querySelector("[data-desfazer-recebimento]")?.addEventListener("click", () => { j.fechar(); gravarPagamento(p, { pago_em: null, forma: p.forma }, ctx, `${p.descricao}: de volta a "a receber".`); });
  el.querySelector("[data-apagar]")?.addEventListener("click", async () => {
    const ok = await confirmar({ titulo: "Apagar a parcela?", texto: `${escapar(p.descricao)}, ${escapar(moeda(p.valor))}.`, sim: "Apagar", nao: "Voltar", perigo: true });
    if (!ok) return;
    j.fechar();
    try {
      await banco.resultado(banco.tabela("parcelas").delete().eq("id", p.id));
      ctx.recarregar();
      avisar(`${p.descricao}: apagada.`, { desfazer: async () => {
        try {
          const { clientes, reservas, id, criado_em, ...linha } = p;
          await banco.resultado(banco.tabela("parcelas").insert({ ...linha, conta_id: conta.conta_id }));
          ctx.recarregar();
        } catch (e) { avisar(e.message, { tipo: "erro" }); }
      } });
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
  });
  return j;
}

/**
 * Nova parcela (ou editar, ou registrar um pagamento que já entrou). Nova: "Para quem?" primeiro, depois a festa
 * desse cliente (opcional: parcela sem reserva é permitida, sempre com cliente; 05, regra 4).
 */
export async function abrirFormParcela(ctx, { parcela = null, cliente = null, reserva = null, jaRecebido = false } = {}) {
  const { banco, conta, avisar, fuso, hoje, nicho } = ctx;
  let quem = parcela ? parcela.clientes : cliente || await abrirParaQuem({ banco, conta, titulo: jaRecebido ? "Quem pagou?" : "Parcela de quem?" });
  if (!quem) return null;
  const reservas = await banco.resultado(banco.tabela("reservas").select("id, inicio, titulo, situacao, tipos_reserva(nome), servicos(nome)").eq("cliente_id", quem.id).neq("situacao", "cancelada").order("inicio", { ascending: false })).catch(() => []);
  const reservaInicial = parcela ? parcela.reserva_id : reserva || (reservas[0] && reservas[0].id) || "";
  return new Promise(resolver => {
    let gravada = null;
    const j = abrirGaveta({
      titulo: parcela ? "Editar a parcela" : jaRecebido ? "Registrar pagamento" : "Nova parcela",
      subtitulo: escapar(quem.nome),
      corpo: `<form class="rz-pilha" novalidate id="form-parcela">
          <div role="alert" hidden></div>
          ${reservas.length ? campoSelecao({ id: "parc-reserva", nome: "reserva_id", rotulo: `De qual ${nicho.palavras.reserva}`, valor: reservaInicial, opcoes: [...reservas.map(r => ({ valor: r.id, rotulo: daReserva(r, fuso) })), { valor: "", rotulo: "Nenhuma (avulsa)" }] }) : ""}
          ${campoTexto({ id: "parc-desc", nome: "descricao", rotulo: "O que é", valor: parcela ? parcela.descricao : jaRecebido ? "Pagamento" : "Sinal", extra: { maxlength: 80 } })}
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "parc-valor", nome: "valor", rotulo: "Valor (R$)", teclado: "decimal", valor: parcela ? String(parcela.valor).replace(".", ",") : "", placeholder: "Ex.: 1.900" })}
            ${campoTexto({ id: "parc-vence", nome: "vence_em", rotulo: jaRecebido ? "Quando entrou" : "Vence em", tipo: "date", valor: parcela ? parcela.vence_em : hoje })}
          </div>
          ${jaRecebido ? `<fieldset class="rz-campo"><legend class="rz-rotulo">Como entrou</legend>
            <div class="rz-chips rz-chips--quebra" role="radiogroup" aria-label="Como entrou">${FORMAS.map((f, i) => `<label class="rz-chip"><input type="radio" name="forma" value="${f.id}"${i === 0 ? " checked" : ""}>${escapar(f.nome)}</label>`).join("")}</div></fieldset>` : ""}
          ${campoTexto({ id: "parc-obs", nome: "observacao", rotulo: "Anotação", opcional: true, valor: (parcela && parcela.observacao) || "", extra: { maxlength: 300 } })}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-parcela">${parcela ? "Salvar" : jaRecebido ? "Registrar" : "Lançar"}</button>`,
      aoFechar: () => resolver(gravada),
    });
    const form = j.el.querySelector("form");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      const valor = lerValor(d.valor);
      erroNoCampo(form.descricao, String(d.descricao || "").trim() ? "" : "Diga o que é (ex.: Sinal).");
      erroNoCampo(form.valor, valor > 0 ? "" : "Digite o valor.");
      erroNoCampo(form.vence_em, d.vence_em ? "" : "Escolha a data.");
      if (!String(d.descricao || "").trim() || !(valor > 0) || !d.vence_em) return;
      const linha = {
        cliente_id: quem.id, reserva_id: d.reserva_id || null, descricao: d.descricao.trim().slice(0, 80), valor,
        vence_em: d.vence_em, observacao: String(d.observacao || "").trim() || null,
        ...(jaRecebido ? { pago_em: d.vence_em, forma: d.forma || null } : {}),
      };
      const botao = j.el.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        gravada = parcela
          ? await banco.resultado(banco.tabela("parcelas").update(linha).eq("id", parcela.id).select(COLUNAS_PARCELA).single())
          : await banco.resultado(banco.tabela("parcelas").insert({ ...linha, conta_id: conta.conta_id }).select(COLUNAS_PARCELA).single());
        j.fechar();
        avisar(parcela ? `${gravada.descricao}: salva.` : jaRecebido ? `${moeda(valor)} de ${quem.nome}: registrado.` : `${gravada.descricao} de ${quem.nome}: lançada.`);
        ctx.recarregar();
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
      }
    });
  });
}
