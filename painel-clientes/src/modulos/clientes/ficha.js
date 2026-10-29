// Clientes (Missão 3, bloco A): a ficha (05: a linha do tempo do cliente, cada item abrindo o seu módulo, só o que a
// pessoa pode ver), o formulário de novo e editar (o contato e a ficha completa: anotações e endereço), juntar dois
// clientes (juntar_clientes) e arquivar (com desfazer). Cliente com histórico não se apaga: se arquiva (05, regra 7).
// `ctx`: { banco, conta, nicho, pode, avisar, navegar, fuso, hoje, aoMudar, recarregar }.

import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { abrirParaQuem } from "../../ui/para-quem.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { campoTexto, campoArea, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { botoesWhatsapp, ligarCopiar } from "../../ui/whatsapp.js";
import { telefone, moeda } from "../../ui/formatos.js";
import { SITUACOES, ENTREGAS, ORIGENS, nomeDaOrigem, validarCliente, linhaDoCliente, linhaDoTempo } from "./logica.js";

export const COLUNAS_CLIENTE = "id, nome, whatsapp, email, instagram, origem, arquivado_em, criado_em, situacao";

export const etiquetaDoCliente = s => (SITUACOES[s] ? `<span class="rz-etiqueta${SITUACOES[s].tom ? ` rz-etiqueta--${SITUACOES[s].tom}` : ""}">${escapar(SITUACOES[s].nome)}</span>` : "");
const ETAPA = { novo: "Novo", em_conversa: "Em conversa", visita_marcada: "Visita marcada", orcamento_enviado: "Orçamento enviado", aguardando_sinal: "Aguardando sinal", fechado: "Fechado", perdido: "Perdido" };
const RESERVA = { pre_reserva: "Pré-reserva", confirmada: "Confirmada", realizada: "Realizada", cancelada: "Cancelada" };
const CONTRATO = { orcamento: "Rascunho", enviado: "Enviado", aceito: "Aceito", cancelado: "Cancelado" };

/** Carrega o que a pessoa pode ver do cliente (cada consulta só se ela vê o módulo; a RLS confere de novo). */
async function carregarHistorico(c, ctx) {
  const { banco, pode } = ctx;
  const de = (tabela, colunas, ordem) => banco.resultado(banco.tabela(tabela).select(colunas).eq("cliente_id", c.id).order(ordem, { ascending: false }).limit(100)).catch(() => []);
  const [pedidos, reservas, compromissos, contratos, parcelas, entregas, ficha] = await Promise.all([
    pode("atendimento", "ver") ? de("pedidos", "id, etapa, criado_em, data_desejada, tipos_reserva(nome), servicos(nome)", "criado_em") : [],
    de("reservas", "id, titulo, inicio, situacao, tipos_reserva(nome), servicos(nome)", "inicio"),
    de("compromissos", "id, tipo, titulo, inicio", "inicio"),
    pode("contratos", "ver") ? de("contratos", "id, situacao, enviado_em, aceito_em, criado_em", "criado_em") : [],
    pode("financeiro", "ver") ? de("parcelas", "id, cliente_id, reserva_id, descricao, valor, vence_em, pago_em", "vence_em") : [],
    pode("clientes", "ver") ? de("entregas", "id, situacao, prazo, entregue_em, criado_em", "criado_em") : [],
    pode("clientes", "ver") ? banco.resultado(banco.tabela("clientes_fichas").select("observacoes, endereco").eq("cliente_id", c.id).maybeSingle()).catch(() => null) : null,
  ]);
  return { pedidos, reservas, compromissos, contratos, parcelas, entregas, ficha };
}

function etiquetaDoItem(it) {
  if (it.etapa) return `<span class="rz-etiqueta${it.etapa === "fechado" ? " rz-etiqueta--sucesso" : it.etapa === "novo" ? " rz-etiqueta--destaque" : ""}">${ETAPA[it.etapa] || ""}</span>`;
  if (it.situacaoReserva) return `<span class="rz-etiqueta${it.situacaoReserva === "confirmada" ? " rz-etiqueta--sucesso" : it.situacaoReserva === "pre_reserva" ? " rz-etiqueta--alerta" : it.situacaoReserva === "cancelada" ? " rz-etiqueta--perigo" : ""}">${RESERVA[it.situacaoReserva] || ""}</span>`;
  if (it.contrato) return `<span class="rz-etiqueta${it.contrato === "aceito" ? " rz-etiqueta--sucesso" : ""}">${CONTRATO[it.contrato] || ""}</span>`;
  if (it.tipo === "parcela") return `<span class="rz-etiqueta${it.pago ? " rz-etiqueta--sucesso" : ""}">${it.pago ? "Quitado" : "A receber"}</span>`;
  if (it.entrega) return `<span class="rz-etiqueta${ENTREGAS[it.entrega] && ENTREGAS[it.entrega].tom ? ` rz-etiqueta--${ENTREGAS[it.entrega].tom}` : ""}">${ENTREGAS[it.entrega] ? ENTREGAS[it.entrega].nome : ""}</span>`;
  return "";
}

/** A ficha do cliente. */
export function abrirFicha(c, ctx) {
  const { pode, nicho, navegar, avisar, banco } = ctx;
  const edita = pode("clientes", "editar");
  const mensagem = `Oi, ${String(c.nome || "").split(/\s+/)[0]}!`;
  const contatos = [
    c.whatsapp && `<li>${icone("telefone", { tamanho: 18 })}<span>${escapar(telefone(c.whatsapp))}</span></li>`,
    c.email && `<li>${icone("carta", { tamanho: 18 })}<a href="mailto:${escapar(c.email)}">${escapar(c.email)}</a></li>`,
    c.instagram && `<li>${icone("link", { tamanho: 18 })}<a href="https://instagram.com/${escapar(c.instagram)}" target="_blank" rel="noopener">@${escapar(c.instagram)}</a></li>`,
  ].filter(Boolean);
  const j = abrirGaveta({
    foco: "fechar",
    titulo: c.nome,
    subtitulo: escapar([nomeDaOrigem(c.origem) && `Chegou por ${nomeDaOrigem(c.origem)}`, c.arquivado_em && "arquivado"].filter(Boolean).join(" · ")),
    corpo: `<div class="rz-pilha">
        <div class="rz-etiquetas">${etiquetaDoCliente(c.situacao)}${c.arquivado_em ? `<span class="rz-etiqueta">Arquivado</span>` : ""}</div>
        ${contatos.length ? `<ul class="rz-contatos">${contatos.join("")}</ul>` : `<p class="rz-texto-2">Ainda sem contato cadastrado.</p>`}
        ${c.whatsapp ? botoesWhatsapp(c.whatsapp, mensagem) : ""}
        <div data-ficha></div>
        <section><h3 class="rz-titulo-3">Linha do tempo</h3><div data-tempo><p class="rz-texto-3">Carregando…</p></div></section>
        ${edita ? `<div class="rz-acoes-ficha">
          <button class="rz-botao rz-botao--fantasma" type="button" data-juntar>${icone("trocar", { tamanho: 16 })}Juntar com outro cliente</button>
          <button class="rz-botao rz-botao--fantasma" type="button" data-arquivar>${c.arquivado_em ? "Tirar do arquivo" : "Arquivar"}</button>
          <button class="rz-botao rz-botao--fantasma" type="button" data-apagar hidden>${icone("lixo", { tamanho: 16 })}Apagar</button>
        </div>` : ""}
      </div>`,
    rodape: [
      pode("atendimento", "editar") ? `<a class="rz-botao" href="/atendimento?novo=pedido&cliente=${escapar(c.id)}">${icone("conversa")}Novo pedido</a>` : "",
      edita ? `<button class="rz-botao rz-botao--primario" type="button" data-editar>${icone("editar")}Editar</button>` : "",
    ].filter(Boolean).join(""),
  });
  const el = j.el;
  ligarCopiar(el);

  carregarHistorico(c, ctx).then(h => {
    if (!el.isConnected) return;
    const itens = linhaDoTempo(h, { fuso: ctx.fuso, nicho, moeda });
    el.querySelector("[data-tempo]").innerHTML = itens.length
      ? `<ol class="rz-tempo">${itens.map(it => `<li><a class="rz-tempo-item" href="${escapar(it.href)}">
          <span class="rz-tempo-icone" aria-hidden="true">${icone(it.icone, { tamanho: 16 })}</span>
          <span class="rz-linha-texto"><b>${escapar(it.titulo)}</b><small>${escapar(it.sub)}</small></span>${etiquetaDoItem(it)}</a></li>`).join("")}</ol>`
      : `<p class="rz-texto-2">Nada ainda: os pedidos, as ${escapar(nicho.palavras.reservas)} e os pagamentos aparecem aqui.</p>`;
    if (h.ficha && (h.ficha.observacoes || h.ficha.endereco)) {
      el.querySelector("[data-ficha]").innerHTML = `${h.ficha.observacoes ? `<div><p class="rz-rotulo">Anotações</p><div class="rz-balao">${escapar(h.ficha.observacoes)}</div></div>` : ""}
        ${h.ficha.endereco ? `<dl class="rz-fatos"><div><dt>Endereço</dt><dd>${escapar(h.ficha.endereco)}</dd></div></dl>` : ""}`;
    }
    c._ficha = h.ficha;
    const apagar = el.querySelector("[data-apagar]");
    if (apagar && !itens.length && !h.pedidos.length && !h.reservas.length) apagar.hidden = false; // só quem não tem história
  }).catch(e => { el.querySelector("[data-tempo]").innerHTML = `<p class="rz-alerta rz-alerta--erro">${escapar(e.message)}</p>`; });

  el.addEventListener("click", e => { if (e.target.closest(".rz-tempo-item")) j.fechar(); });
  el.querySelector("[data-editar]")?.addEventListener("click", () => { j.fechar(); abrirFormCliente(ctx, { cliente: c }); });
  el.querySelector("[data-arquivar]")?.addEventListener("click", async () => {
    j.fechar();
    const antes = c.arquivado_em;
    const gravar = valor => banco.resultado(banco.tabela("clientes").update({ arquivado_em: valor }).eq("id", c.id));
    c.arquivado_em = antes ? null : new Date().toISOString();
    ctx.aoMudar();
    try {
      await gravar(c.arquivado_em);
      avisar(`${c.nome}: ${antes ? "voltou para a lista" : "arquivado"}.`, { desfazer: async () => { c.arquivado_em = antes; ctx.aoMudar(); try { await gravar(antes); } catch (erro) { avisar(erro.message, { tipo: "erro" }); ctx.recarregar(); } } });
    } catch (erro) { c.arquivado_em = antes; ctx.aoMudar(); avisar(erro.message, { tipo: "erro" }); }
  });
  el.querySelector("[data-apagar]")?.addEventListener("click", async () => {
    const ok = await confirmar({ titulo: `Apagar ${escapar(c.nome)}?`, texto: "Sem pedido nem reserva, a ficha some de vez.", sim: "Apagar", nao: "Voltar", perigo: true });
    if (!ok) return;
    j.fechar();
    try { await banco.resultado(banco.tabela("clientes").delete().eq("id", c.id)); avisar(`${c.nome} saiu dos clientes.`); ctx.recarregar(); }
    catch (erro) { avisar(/foreign key|violates/i.test(erro.message) ? "Esse cliente tem histórico: arquive em vez de apagar." : erro.message, { tipo: "erro" }); }
  });
  el.querySelector("[data-juntar]")?.addEventListener("click", async () => {
    j.fechar();
    const outro = await abrirParaQuem({ banco, conta: ctx.conta, titulo: `Juntar ${c.nome} com quem?`, permitirNovo: false });
    if (!outro || outro.id === c.id) return;
    const ok = await confirmar({
      titulo: "Juntar os dois?",
      texto: `Fica <b>${escapar(c.nome)}</b>. Tudo de <b>${escapar(outro.nome)}</b> (pedidos, ${escapar(nicho.palavras.reservas)}, contratos, pagamentos) passa para ${escapar(c.nome)}, e a ficha de ${escapar(outro.nome)} some. Não dá para desfazer.`,
      sim: "Juntar", nao: "Voltar",
    });
    if (!ok) return;
    try {
      await banco.rpc("juntar_clientes", { fica: c.id, sai: outro.id });
      avisar(`${outro.nome} foi junto com ${c.nome}.`);
      ctx.recarregar(c.id);
    } catch (erro) { avisar(erro.message, { tipo: "erro" }); }
  });
  return j;
}

/** Novo cliente ou editar: o contato (quem edita algum módulo pode) e a ficha completa (Clientes). Resolve com o cliente gravado. */
export function abrirFormCliente(ctx, { cliente = null } = {}) {
  const { banco, conta, avisar, pode } = ctx;
  const ficha = (cliente && cliente._ficha) || {};
  return new Promise(resolver => {
    let gravado = null;
    const j = abrirGaveta({
      titulo: cliente ? `Editar ${cliente.nome}` : "Novo cliente",
      corpo: `<form class="rz-pilha" novalidate id="form-cliente">
          <div role="alert" hidden></div>
          ${campoTexto({ id: "cli-nome", nome: "nome", rotulo: "Nome", valor: cliente ? cliente.nome : "", placeholder: "Ex.: Camila & Rafael", extra: { maxlength: 120 } })}
          ${campoTexto({ id: "cli-whats", nome: "whatsapp", rotulo: "WhatsApp", tipo: "tel", teclado: "tel", opcional: true, valor: cliente && cliente.whatsapp ? telefone(cliente.whatsapp) : "", placeholder: "(11) 98888-7777", ajuda: "Uma pessoa, um WhatsApp: se o número já existir, o painel avisa." })}
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "cli-email", nome: "email", rotulo: "E-mail", tipo: "email", teclado: "email", opcional: true, valor: (cliente && cliente.email) || "", extra: { autocapitalize: "none", spellcheck: "false" } })}
            ${campoTexto({ id: "cli-insta", nome: "instagram", rotulo: "Instagram", opcional: true, valor: (cliente && cliente.instagram) || "", placeholder: "@usuario", extra: { autocapitalize: "none", spellcheck: "false" } })}
          </div>
          ${campoSelecao({ id: "cli-origem", nome: "origem", rotulo: "Por onde chegou", valor: (cliente && cliente.origem) || "", opcoes: [{ valor: "", rotulo: "Não sei" }, ...ORIGENS.map(o => ({ valor: o.id, rotulo: o.nome }))] })}
          ${pode("clientes", "editar") ? `${campoArea({ id: "cli-obs", nome: "observacoes", rotulo: "Anotações", opcional: true, linhas: 3, valor: ficha.observacoes || "", placeholder: "O que foi combinado, preferências, quem decide…" })}
          ${campoTexto({ id: "cli-end", nome: "endereco", rotulo: "Endereço", opcional: true, valor: ficha.endereco || "", extra: { maxlength: 300 } })}` : ""}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-cliente">Salvar</button>`,
      aoFechar: () => resolver(gravado),
    });
    const form = j.el.querySelector("form");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      const erros = validarCliente(d);
      for (const campo of ["nome", "whatsapp", "email", "instagram"]) erroNoCampo(form[campo], erros[campo] || "");
      const primeiro = ["nome", "whatsapp", "email", "instagram"].find(k => erros[k]);
      if (primeiro) return form[primeiro].focus();
      const botao = j.el.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        const linha = linhaDoCliente(d);
        gravado = cliente
          ? await banco.resultado(banco.tabela("clientes").update(linha).eq("id", cliente.id).select(COLUNAS_CLIENTE).single())
          : await banco.resultado(banco.tabela("clientes").insert({ ...linha, conta_id: conta.conta_id }).select(COLUNAS_CLIENTE).single());
        if (pode("clientes", "editar") && (d.observacoes || d.endereco || ficha.observacoes || ficha.endereco)) {
          await banco.resultado(banco.tabela("clientes_fichas").upsert({ cliente_id: gravado.id, conta_id: conta.conta_id, observacoes: String(d.observacoes || "").trim() || null, endereco: String(d.endereco || "").trim() || null }));
        }
        j.fechar();
        avisar(cliente ? `${gravado.nome}: salvo.` : `${gravado.nome} entrou nos clientes.`);
        ctx.recarregar(gravado.id);
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), /clientes_conta_id_whatsapp_key|duplicate key/i.test(e.message) ? "Esse WhatsApp já é de outro cliente. Busque por ele na lista (ou junte os dois)." : e.message);
      }
    });
  });
}

