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
import { FORMAS, nomeDaForma, SITUACOES, situacaoDaParcela, textoDoVencimento, mensagemDeLembrete, opcoesDoQueE, OUTRO, dinheiroDaReserva, sugestaoDoValor } from "./logica.js";

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

/** As reservas do cliente com o dinheiro de cada uma (os valores da reserva só para quem vê o Financeiro). */
async function reservasDoCliente(banco, clienteId) {
  const base = "id, inicio, titulo, situacao, tipos_reserva(nome), servicos(nome, valor, sinal)";
  const consulta = colunas => banco.resultado(banco.tabela("reservas").select(colunas).eq("cliente_id", clienteId).neq("situacao", "cancelada").order("inicio", { ascending: false }));
  return consulta(base + ", reservas_valores(valor_total, sinal, desconto)").catch(() => consulta(base)).catch(() => []);
}

/**
 * Nova parcela (ou editar, ou registrar um pagamento que já entrou). Nova: "Para quem?" primeiro, depois a festa
 * desse cliente (opcional: parcela sem reserva é permitida, sempre com cliente; 05, regra 4). O "O que é" é uma lista
 * (Sinal, Restante, Pagamento total, Parcela ou Outro) e o valor já vem sugerido pela reserva: o valor dela (ou do
 * pacote/ensaio em Serviços), menos o que já entrou, com uma frase curta do porquê. A pessoa muda o que quiser.
 */
export async function abrirFormParcela(ctx, { parcela = null, cliente = null, reserva = null, jaRecebido = false } = {}) {
  const { banco, conta, avisar, fuso, nicho } = ctx;
  const hoje = ctx.hoje;
  let quem = parcela ? parcela.clientes : cliente || await abrirParaQuem({ banco, conta, titulo: jaRecebido ? "Quem pagou?" : "Parcela de quem?" });
  if (!quem) return null;
  const [reservas, doCliente] = await Promise.all([
    reservasDoCliente(banco, quem.id),
    banco.resultado(banco.tabela("parcelas").select(COLUNAS_PARCELA).eq("cliente_id", quem.id)).catch(() => []),
  ]);
  const nomeDa = r => (r && ((r.servicos && r.servicos.nome) || (r.tipos_reserva && r.tipos_reserva.nome))) || "";
  const dinheiroDe = id => {
    const r = reservas.find(x => x.id === id);
    if (!r) return null;
    const outras = doCliente.filter(x => x.reserva_id === id && (!parcela || x.id !== parcela.id));
    return { r, d: dinheiroDaReserva({ valores: r.reservas_valores, servico: r.servicos, parcelas: outras }) };
  };
  const sugestaoDe = id => { const x = dinheiroDe(id); return x ? sugestaoDoValor(x.d, { jaRecebido, nome: nomeDa(x.r) }) : null; };
  // a reserva que abre: a pedida; senão, a mais recente que ainda tem o que pagar; senão, a mais recente
  const reservaInicial = parcela ? parcela.reserva_id || ""
    : reserva || (reservas.find(r => { const s = sugestaoDe(r.id); return s && s.valor; }) || reservas[0] || {}).id || "";
  const sugestao = parcela ? null : sugestaoDe(reservaInicial);
  const tipoInicial = parcela ? parcela.descricao : (sugestao && sugestao.tipo) || (jaRecebido ? "Pagamento total" : "Sinal");
  const valorInicial = parcela ? parcela.valor : sugestao && sugestao.valor;
  const campoValor = v => (v == null ? "" : String(v).replace(".", ","));

  return new Promise(resolver => {
    let gravada = null;
    const j = abrirGaveta({
      titulo: parcela ? "Editar a parcela" : jaRecebido ? "Registrar pagamento" : "Nova parcela",
      subtitulo: escapar(quem.nome),
      corpo: `<form class="rz-pilha" novalidate id="form-parcela">
          <div role="alert" hidden></div>
          ${reservas.length ? campoSelecao({ id: "parc-reserva", nome: "reserva_id", rotulo: `De qual ${nicho.palavras.reserva}`, valor: reservaInicial, opcoes: [...reservas.map(r => ({ valor: r.id, rotulo: daReserva(r, fuso) })), { valor: "", rotulo: "Nenhuma (avulsa)" }] }) : ""}
          ${campoSelecao({ id: "parc-tipo", nome: "tipo", rotulo: "O que é", valor: tipoInicial, opcoes: opcoesDoQueE(parcela && parcela.descricao).map(o => ({ valor: o, rotulo: o === OUTRO ? "Outro (escrever)" : o })) })}
          <div data-outro hidden>${campoTexto({ id: "parc-outro", nome: "outro", rotulo: "Qual?", placeholder: "Ex.: Álbum, hora extra", extra: { maxlength: 80 } })}</div>
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "parc-valor", nome: "valor", rotulo: "Valor (R$)", teclado: "decimal", valor: campoValor(valorInicial), placeholder: "Ex.: 1.900" })}
            ${campoTexto({ id: "parc-vence", nome: "vence_em", rotulo: jaRecebido ? "Quando entrou" : "Vence em", tipo: "date", valor: parcela ? parcela.vence_em : hoje })}
          </div>
          <div class="rz-pilha-p" data-sugestao aria-live="polite"></div>
          ${jaRecebido ? `<fieldset class="rz-campo"><legend class="rz-rotulo">Como entrou</legend>
            <div class="rz-chips rz-chips--quebra" role="radiogroup" aria-label="Como entrou">${FORMAS.map((f, i) => `<label class="rz-chip"><input type="radio" name="forma" value="${f.id}"${i === 0 ? " checked" : ""}>${escapar(f.nome)}</label>`).join("")}</div></fieldset>` : ""}
          ${campoTexto({ id: "parc-obs", nome: "observacao", rotulo: "Anotação", opcional: true, valor: (parcela && parcela.observacao) || "", extra: { maxlength: 300 } })}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-parcela">${parcela ? "Salvar" : jaRecebido ? "Registrar" : "Lançar"}</button>`,
      aoFechar: () => resolver(gravada),
    });
    const form = j.el.querySelector("form");
    const caixaOutro = form.querySelector("[data-outro]");
    const lugarDaSugestao = form.querySelector("[data-sugestao]");
    let atual = sugestao;
    let valorMexido = !!parcela; // editando, ou a pessoa digitou: o valor não muda sozinho

    // a frase do porquê do valor e, ao registrar, a parcela já lançada que pode receber a baixa no lugar de uma nova
    const mostrarSugestao = () => {
      const x = !parcela && form.reserva_id ? dinheiroDe(form.reserva_id.value) : null;
      const aberta = jaRecebido && x && x.d.abertas[0];
      lugarDaSugestao.innerHTML = (atual ? `<p class="rz-ajuda">${icone("estrela", { tamanho: 14 })} ${escapar(atual.texto)} Dá para mudar o valor.</p>` : "")
        + (aberta ? `<p class="rz-ajuda">Já tem ${escapar(aberta.descricao)} de ${escapar(moeda(aberta.valor))} lançada (${escapar(textoDoVencimento(aberta, hoje, fuso))}). Para não contar duas vezes, dê baixa nela:</p>
          <div><button class="rz-botao rz-botao--pequeno" type="button" data-baixa="${escapar(aberta.id)}">${icone("ok", { tamanho: 16 })}Recebi ${escapar(aberta.descricao)} · ${escapar(moeda(aberta.valor))}</button></div>` : "");
    };
    const mostrarOutro = () => { caixaOutro.hidden = form.tipo.value !== OUTRO; if (!caixaOutro.hidden) form.outro.focus(); };
    form.valor.addEventListener("input", () => { valorMexido = true; });
    form.tipo.addEventListener("change", () => {
      mostrarOutro();
      const v = atual && atual.porTipo && atual.porTipo[form.tipo.value];
      if (!valorMexido && v != null) form.valor.value = campoValor(v);
    });
    form.reserva_id?.addEventListener("change", () => {
      if (parcela) return;
      atual = sugestaoDe(form.reserva_id.value);
      if (atual) form.tipo.value = atual.tipo;
      if (!valorMexido) form.valor.value = campoValor(atual && atual.valor);
      mostrarOutro();
      mostrarSugestao();
    });
    lugarDaSugestao.addEventListener("click", e => {
      const b = e.target.closest("[data-baixa]");
      if (!b) return;
      // a mesma parcela que a lista do Financeiro já tem (o "Recebi" de lá); fora dela, recarrega depois de gravar
      const daLista = ctx.parcela && ctx.parcela(b.dataset.baixa);
      const p = daLista || doCliente.find(x => x.id === b.dataset.baixa);
      if (!p) return;
      j.fechar();
      receber(p, daLista ? ctx : { ...ctx, aoMudar: () => setTimeout(() => ctx.recarregar(), 800) });
    });
    mostrarSugestao();

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      const valor = lerValor(d.valor);
      const descricao = (d.tipo === OUTRO ? String(d.outro || "") : String(d.tipo || "")).trim().slice(0, 80);
      if (d.tipo === OUTRO) erroNoCampo(form.outro, descricao ? "" : "Escreva o que é (ex.: Álbum).");
      erroNoCampo(form.valor, valor > 0 ? "" : "Digite o valor.");
      erroNoCampo(form.vence_em, d.vence_em ? "" : "Escolha a data.");
      if (!descricao || !(valor > 0) || !d.vence_em) return;
      const linha = {
        cliente_id: quem.id, reserva_id: d.reserva_id || null, descricao, valor,
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
