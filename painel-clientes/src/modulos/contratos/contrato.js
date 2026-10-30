// Contratos (Missão 3, bloco E): o contrato. A gaveta (o aceite registrado, o texto, mandar, "Lembrar do aceite",
// editar antes do aceite, cancelar, imprimir) e o contrato novo de uma festa ou ensaio: o modelo, o texto já com os
// campos trocados (editável), salvar como orçamento ou mandar o link (com confirmação: 09, regra 4).
// `ctx`: { banco, conta, nicho, pode, avisar, navegar, fuso, aoMudar, recarregar, abrirModelos }.

import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { abrirParaQuem } from "../../ui/para-quem.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { campoSelecao, lerFormulario } from "../../ui/campos.js";
import { ligarCopiar } from "../../ui/whatsapp.js";
import { dataCurta, dataNumerica, hora, haQuanto, linkWhatsapp, moeda, normalizarWhatsapp } from "../../ui/formatos.js";
import { SITUACOES, CAMPOS, valoresDosCampos, preencherModelo, camposNoTexto, linkDoContrato, mensagemDoContrato, mensagemDeLembrete } from "./logica.js";

export const COLUNAS_CONTRATO = "id, cliente_id, reserva_id, modelo_id, situacao, codigo, hash, enviado_em, aceito_em, aceito_nome, aceito_contato, "
  + "aceito_ip, aceito_aparelho, cancelado_em, criado_em, atualizado_em, clientes(id, nome, whatsapp), "
  + "reservas(id, inicio, fim, titulo, situacao, tipos_reserva(nome), servicos(nome))";

const nomeDoCampo = id => (CAMPOS.find(c => c.id === id) || {}).nome || id;

export const etiquetaDoContrato = c => {
  const s = SITUACOES[c.situacao] || SITUACOES.orcamento;
  return `<span class="rz-etiqueta${s.tom ? ` rz-etiqueta--${s.tom}` : ""}">${escapar(s.nome)}</span>`;
};
export const daReserva = (r, fuso) => (r ? `${(r.titulo || (r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome) || "Reserva")} · ${dataCurta(new Date(r.inicio), fuso)}` : "");

const link = c => linkDoContrato(location.origin, c.codigo);

/** Mandar (ou mandar de novo): confirma, marca como enviado e abre o jeito de mandar o link. */
export async function mandar(c, ctx, { texto } = {}) {
  const { banco, avisar } = ctx;
  const falta = camposNoTexto(texto ?? "");
  if (falta.length) { avisar(`Antes de mandar, complete no texto: ${falta.map(f => `{${f}}`).join(", ")}.`, { tipo: "erro" }); return false; }
  const ok = await confirmar({
    titulo: "Mandar o contrato?",
    texto: `${escapar((c.clientes && c.clientes.nome) || "O cliente")} vai receber o link para ler e aceitar. Depois do aceite, o texto não muda mais (só dá para cancelar).`,
    sim: "Mandar", nao: "Voltar",
  });
  if (!ok) return false;
  try {
    if (c.situacao !== "enviado") {
      const novo = await banco.resultado(banco.tabela("contratos").update({ situacao: "enviado" }).eq("id", c.id).select(COLUNAS_CONTRATO).single());
      Object.assign(c, novo);
      ctx.recarregar();
    }
    compartilhar(c, ctx, { primeira: true });
    return true;
  } catch (e) { avisar(e.message, { tipo: "erro" }); return false; }
}

/** O link e as mensagens prontas: WhatsApp, copiar, o compartilhar do celular (09). */
export function compartilhar(c, ctx, { primeira = false, lembrete = false } = {}) {
  const { conta, nicho } = ctx;
  const url = link(c);
  const msg = (lembrete ? mensagemDeLembrete : mensagemDoContrato)(c, { conta, nicho, link: url });
  const numero = normalizarWhatsapp(c.clientes && c.clientes.whatsapp);
  const j = abrirGaveta({
    foco: "fechar",
    titulo: primeira ? "Contrato pronto para mandar" : lembrete ? "Lembrar do aceite" : "O link do contrato",
    subtitulo: escapar((c.clientes && c.clientes.nome) || ""),
    corpo: `<div class="rz-pilha">
        ${primeira ? `<p class="rz-alerta rz-alerta--sucesso">${icone("okCirculo", { tamanho: 18 })}<span>Marcado como enviado. Mande o link pelo WhatsApp ou como preferir.</span></p>` : ""}
        <div class="rz-campo"><label class="rz-rotulo" for="ct-link">Link do contrato</label>
          <div class="rz-com-acao"><input class="rz-entrada" id="ct-link" value="${escapar(url)}" readonly>
            <button class="rz-acao-campo" type="button" data-copiar="${escapar(url)}" aria-label="Copiar o link">${icone("copiar", { tamanho: 16 })}</button></div></div>
        <div><p class="rz-rotulo">Mensagem</p><div class="rz-balao">${escapar(msg)}</div></div>
        <div class="rz-whatsapp">
          ${numero ? `<a class="rz-botao rz-botao--primario" href="${escapar(linkWhatsapp(numero, msg))}" target="_blank" rel="noopener">${icone("whatsapp")}Mandar no WhatsApp</a>` : ""}
          <button class="rz-botao" type="button" data-copiar="${escapar(msg)}">${icone("copiar")}Copiar mensagem</button>
          ${typeof navigator.share === "function" ? `<button class="rz-botao rz-botao--fantasma" type="button" data-compartilhar>${icone("link")}Compartilhar</button>` : ""}
        </div>
        ${!numero ? `<p class="rz-texto-3">${escapar((c.clientes && c.clientes.nome) || "O cliente")} não tem WhatsApp na ficha: copie a mensagem e mande como preferir.</p>` : ""}
      </div>`,
  });
  ligarCopiar(j.el);
  j.el.querySelector("[data-compartilhar]")?.addEventListener("click", () => navigator.share({ title: "Contrato", text: msg }).catch(() => {}));
  return j;
}

/** A gaveta do contrato. Carrega o texto (a lista não traz, para ficar leve). */
export async function abrirContrato(c, ctx) {
  const { banco, pode, fuso, avisar, nicho } = ctx;
  const edita = pode("contratos", "editar");
  const completo = await banco.resultado(banco.tabela("contratos").select("texto").eq("id", c.id).single()).catch(() => null);
  const texto = completo ? completo.texto : "";
  const aceito = c.situacao === "aceito";
  const espera = c.situacao === "enviado" && c.enviado_em ? `enviado ${haQuanto(c.enviado_em)}` : "";
  const j = abrirGaveta({
    foco: "fechar",
    titulo: `Contrato · ${(c.clientes && c.clientes.nome) || "cliente"}`,
    subtitulo: escapar(daReserva(c.reservas, fuso)),
    corpo: `<div class="rz-pilha">
        <div class="rz-etiquetas">${etiquetaDoContrato(c)}${espera ? `<span class="rz-texto-3">${escapar(espera)}</span>` : ""}</div>
        ${aceito ? `<div class="rz-cartao rz-contrato-prova">
            <p class="rz-rotulo">${icone("okCirculo", { tamanho: 18 })} O aceite registrado</p>
            <dl class="rz-fatos">
              <div><dt>Quem aceitou</dt><dd>${escapar(c.aceito_nome)}</dd></div>
              <div><dt>Contato</dt><dd>${escapar(c.aceito_contato || "não informado")}</dd></div>
              <div><dt>Quando</dt><dd>${escapar(`${dataNumerica(new Date(c.aceito_em), fuso)}, às ${hora(new Date(c.aceito_em), fuso)}`)}</dd></div>
              <div><dt>IP</dt><dd>${escapar(c.aceito_ip || "não registrado")}</dd></div>
            </dl>
            ${c.aceito_aparelho ? `<p class="rz-texto-3">Aparelho: ${escapar(c.aceito_aparelho)}</p>` : ""}
            <p class="rz-texto-3 rz-quebra">Impressão digital do texto (SHA-256): <code>${escapar(c.hash)}</code></p>
          </div>` : ""}
        ${c.situacao === "cancelado" && c.cancelado_em ? `<p class="rz-texto-2">Cancelado ${escapar(dataCurta(new Date(c.cancelado_em), fuso))}.</p>` : ""}
        <details class="rz-detalhes"${aceito ? "" : " open"}><summary>O texto do contrato ${icone("setaBaixo", { tamanho: 18 })}</summary>
          <div class="rz-contrato-texto-painel">${escapar(texto)}</div></details>
        <div class="rz-pilha-p">
          ${c.situacao !== "orcamento" && c.situacao !== "cancelado" ? `<a class="rz-link" href="${escapar(link(c))}" target="_blank" rel="noopener">${icone("link", { tamanho: 16 })} Abrir o link ${aceito ? "(imprimir ou salvar em PDF)" : "como o cliente vê"}</a>` : ""}
          ${c.reservas && pode("agenda", "ver") ? `<a class="rz-link" href="/agenda?reserva=${escapar(c.reserva_id)}">${icone("agenda", { tamanho: 16 })} Ver ${escapar(nicho.palavras.aReserva)} na Agenda</a>` : ""}
          ${c.reservas && pode("financeiro", "ver") ? `<a class="rz-link" href="/financeiro?reserva=${escapar(c.reserva_id)}">${icone("carteira", { tamanho: 16 })} Ver os pagamentos</a>` : ""}
          ${c.clientes && pode("clientes", "ver") ? `<a class="rz-link" href="/clientes?cliente=${escapar(c.cliente_id)}">${icone("clientes", { tamanho: 16 })} Ver ${escapar(c.clientes.nome)}</a>` : ""}
        </div>
        ${edita && c.situacao !== "cancelado" ? `<button class="rz-botao rz-botao--fantasma" type="button" data-cancelar>${icone("fechar", { tamanho: 16 })}Cancelar o contrato</button>` : ""}
      </div>`,
    rodape: [
      edita && !aceito && c.situacao !== "cancelado" ? `<button class="rz-botao" type="button" data-editar>${icone("editar")}Editar</button>` : "",
      edita && c.situacao === "orcamento" ? `<button class="rz-botao rz-botao--primario" type="button" data-mandar>${icone("whatsapp")}Mandar</button>` : "",
      edita && c.situacao === "enviado" ? `<button class="rz-botao rz-botao--primario" type="button" data-lembrar>${icone("whatsapp")}Lembrar do aceite</button>` : "",
      c.situacao === "cancelado" && edita ? `<button class="rz-botao" type="button" data-refazer>${icone("adicionar")}Fazer outro</button>` : "",
    ].filter(Boolean).join(""),
  });
  const el = j.el;
  el.querySelector("[data-editar]")?.addEventListener("click", () => { j.fechar(); abrirFormContrato(ctx, { contrato: c, texto }); });
  el.querySelector("[data-mandar]")?.addEventListener("click", async () => { if (await mandar(c, ctx, { texto })) j.fechar(); });
  el.querySelector("[data-lembrar]")?.addEventListener("click", () => { j.fechar(); compartilhar(c, ctx, { lembrete: true }); });
  el.querySelector("[data-refazer]")?.addEventListener("click", () => { j.fechar(); abrirFormContrato(ctx, { cliente: c.clientes, reserva: c.reserva_id }); });
  el.querySelector("[data-cancelar]")?.addEventListener("click", async () => {
    const ok = await confirmar({
      titulo: "Cancelar o contrato?",
      texto: aceito ? "O aceite continua guardado como prova, mas o contrato fica como cancelado. Não dá para desfazer." : "O link para de funcionar. Não dá para desfazer; se precisar, faça outro.",
      sim: "Cancelar o contrato", nao: "Voltar", perigo: true,
    });
    if (!ok) return;
    try {
      await banco.resultado(banco.tabela("contratos").update({ situacao: "cancelado" }).eq("id", c.id));
      j.fechar();
      avisar("Contrato cancelado.");
      ctx.recarregar();
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
  });
  return j;
}

/** Os dados da festa ou ensaio que preenchem os campos. */
async function dadosDaReserva(banco, reservaId, cliente) {
  const [r, valores, adicionais, ficha] = await Promise.all([
    banco.resultado(banco.tabela("reservas").select("id, inicio, fim, convidados, titulo, tipos_reserva(nome), servicos(nome, valor, sinal)").eq("id", reservaId).maybeSingle()).catch(() => null),
    banco.resultado(banco.tabela("reservas_valores").select("valor_total, sinal, desconto").eq("reserva_id", reservaId).maybeSingle()).catch(() => null),
    banco.resultado(banco.tabela("reservas_adicionais").select("adicionais(nome)").eq("reserva_id", reservaId)).catch(() => []),
    cliente ? banco.resultado(banco.tabela("clientes_fichas").select("endereco, cpf").eq("cliente_id", cliente.id).maybeSingle()).catch(() => null) : null,
  ]);
  return { reserva: r, valores, adicionais: adicionais.map(a => a.adicionais && a.adicionais.nome).filter(Boolean).sort(), ficha };
}

/**
 * Contrato novo (ou editar antes do aceite). Novo: "Para quem?", a festa ou ensaio dele e o modelo; o texto vem com
 * os campos trocados e dá para mexer. "Salvar como orçamento" guarda; "Mandar" guarda, confirma e abre o link.
 */
export async function abrirFormContrato(ctx, { contrato = null, texto = "", cliente = null, reserva = null } = {}) {
  const { banco, conta, nicho, fuso, avisar } = ctx;
  const quem = contrato ? contrato.clientes : cliente || await abrirParaQuem({ banco, conta, titulo: "Contrato de quem?" });
  if (!quem) return null;
  const [reservas, modelos] = await Promise.all([
    banco.resultado(banco.tabela("reservas").select("id, inicio, titulo, situacao, tipos_reserva(nome), servicos(nome)").eq("cliente_id", quem.id).neq("situacao", "cancelada").order("inicio", { ascending: false })).catch(() => []),
    banco.resultado(banco.tabela("modelos_contrato").select("id, nome, texto").eq("conta_id", conta.conta_id).eq("ativo", true).order("nome")).catch(() => []),
  ]);
  if (!contrato && !modelos.length) {
    avisar("Primeiro, um modelo: cole o texto do seu contrato e marque os campos.", { tipo: "erro" });
    return ctx.abrirModelos({ novo: true });
  }
  const reservaInicial = contrato ? contrato.reserva_id : reserva || (reservas.find(r => Date.parse(r.inicio) >= Date.now()) || reservas[0] || {}).id || "";
  const modeloInicial = contrato ? contrato.modelo_id || "" : (modelos[0] || {}).id || "";
  let valores = {};
  let daReservaAtual = null; // os dados da festa ou ensaio escolhido (para "Usar os valores do pacote")

  const j = abrirGaveta({
    titulo: contrato ? "Editar o contrato" : "Novo contrato",
    subtitulo: escapar(quem.nome),
    corpo: `<form class="rz-pilha" novalidate id="form-contrato">
        <div role="alert" hidden></div>
        ${reservas.length ? campoSelecao({ id: "ct-reserva", nome: "reserva_id", rotulo: `De qual ${nicho.palavras.reserva}`, valor: reservaInicial, opcoes: [...reservas.map(r => ({ valor: r.id, rotulo: daReserva(r, fuso) })), { valor: "", rotulo: "Nenhuma" }] })
          : `<p class="rz-alerta">${icone("alerta", { tamanho: 18 })}<span>${escapar(quem.nome)} ainda não tem ${escapar(nicho.palavras.reserva)} marcada. Dá para fazer o contrato assim mesmo, mas os campos da data e dos valores ficam por sua conta.</span></p>`}
        ${modelos.length ? campoSelecao({ id: "ct-modelo", nome: "modelo_id", rotulo: "Modelo", valor: modeloInicial, opcoes: [...modelos.map(m => ({ valor: m.id, rotulo: m.nome })), ...(contrato ? [{ valor: "", rotulo: "Manter o texto como está" }] : [])] }) : ""}
        <div class="rz-campo"><label class="rz-rotulo" for="ct-texto">O texto <span class="rz-texto-3">o que o cliente vai ler</span></label>
          <textarea class="rz-entrada rz-contrato-editor" id="ct-texto" name="texto" rows="14" maxlength="100000">${escapar(texto)}</textarea></div>
        <div data-falta></div>
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-salvar>${contrato && contrato.situacao === "enviado" ? "Salvar" : "Salvar como orçamento"}</button>
      ${!contrato || contrato.situacao === "orcamento" ? `<button class="rz-botao rz-botao--primario" type="button" data-mandar>${icone("whatsapp")}Salvar e mandar</button>` : ""}`,
  });
  const form = j.el.querySelector("form");
  const area = form.texto;
  // Faltam os valores e o pacote (ou ensaio) tem preço em Serviços: um toque grava os valores dele na festa, como o
  // Financeiro sugere (Missão 6: sem isso, mandar o contrato de uma festa recém-fechada pedia passar pelo Financeiro).
  const pacoteComValor = () => {
    const s = daReservaAtual && daReservaAtual.reserva && daReservaAtual.reserva.servicos;
    return !daReservaAtual?.valores && s && Number(s.valor) > 0 ? s : null;
  };
  const mostrarFalta = () => {
    const falta = camposNoTexto(area.value);
    const pacote = falta.some(f => f === "valor" || f === "sinal") ? pacoteComValor() : null;
    form.querySelector("[data-falta]").innerHTML = falta.length
      ? `<div class="rz-alerta rz-alerta--aviso">${icone("alerta", { tamanho: 18 })}<span>Sem valor ainda: ${falta.map(f => `<b>{${escapar(f)}}</b> (${escapar(nomeDoCampo(f))})`).join(", ")}. Escreva no texto ou complete ${escapar(nicho.palavras.aReserva)} (na Agenda, ${nicho.id === "eventos" ? "o pacote" : "o ensaio"}; no Financeiro, os valores).${pacote ? `<br><button class="rz-link" type="button" data-usar-pacote>Usar os valores ${nicho.id === "eventos" ? "do pacote" : "do ensaio"}: ${escapar(moeda(Number(pacote.valor)))}${Number(pacote.sinal) > 0 ? `, sinal de ${escapar(moeda(Number(pacote.sinal)))}` : ""}</button>` : ""}</span></div>`
      : "";
  };
  form.querySelector("[data-falta]").addEventListener("click", async e => {
    const b = e.target.closest("[data-usar-pacote]");
    const pacote = pacoteComValor();
    if (!b || !pacote) return;
    ocupado(b, true, "Gravando…");
    try {
      const novo = { valor_total: Number(pacote.valor), sinal: Number(pacote.sinal) > 0 ? Number(pacote.sinal) : null };
      await banco.resultado(banco.tabela("reservas_valores").upsert({ reserva_id: daReservaAtual.reserva.id, conta_id: conta.conta_id, ...novo }));
      daReservaAtual = { ...daReservaAtual, valores: novo };
      valores = valoresDosCampos({ ...daReservaAtual, cliente: quem, conta, fuso });
      area.value = preencherModelo(area.value, valores).texto; // só os campos que faltavam: o que foi escrito fica
      mostrarFalta();
    } catch (erro) { ocupado(b, false); avisoDoFormulario(form.querySelector("[role=alert]"), erro.message); }
  });
  async function preencher() {
    const reservaId = form.reserva_id ? form.reserva_id.value : "";
    const d = reservaId ? await dadosDaReserva(banco, reservaId, quem) : { reserva: null, valores: null, adicionais: [], ficha: null };
    daReservaAtual = d;
    valores = valoresDosCampos({ ...d, cliente: quem, conta, fuso });
    const modelo = modelos.find(m => m.id === (form.modelo_id ? form.modelo_id.value : ""));
    if (modelo) area.value = preencherModelo(modelo.texto, valores).texto;
    mostrarFalta();
  }
  form.reserva_id?.addEventListener("change", preencher);
  form.modelo_id?.addEventListener("change", preencher);
  area.addEventListener("input", mostrarFalta);
  if (!contrato) await preencher(); else mostrarFalta();

  async function gravar(depois) {
    const d = lerFormulario(form);
    const textoFinal = String(area.value || "").replace(/\r\n/g, "\n").trim();
    if (!textoFinal) return avisoDoFormulario(form.querySelector("[role=alert]"), "Escreva o texto do contrato (ou escolha um modelo).");
    const linha = { cliente_id: quem.id, reserva_id: d.reserva_id || null, modelo_id: d.modelo_id || null, texto: textoFinal };
    if (contrato && !d.modelo_id) delete linha.modelo_id;
    const botoes = j.el.querySelectorAll(".rz-janela-pe button");
    botoes.forEach(b => ocupado(b, true, "Salvando…"));
    try {
      const gravado = contrato
        ? await banco.resultado(banco.tabela("contratos").update(linha).eq("id", contrato.id).select(COLUNAS_CONTRATO).single())
        : await banco.resultado(banco.tabela("contratos").insert({ ...linha, conta_id: conta.conta_id, situacao: "orcamento" }).select(COLUNAS_CONTRATO).single());
      j.fechar();
      ctx.recarregar();
      if (depois === "mandar") return mandar(gravado, ctx, { texto: textoFinal });
      avisar(contrato ? "Contrato salvo." : `Orçamento de ${quem.nome}: salvo.`);
    } catch (e) {
      botoes.forEach(b => ocupado(b, false));
      avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
    }
  }
  j.el.querySelector("[data-salvar]").addEventListener("click", () => gravar("salvar"));
  j.el.querySelector("[data-mandar]")?.addEventListener("click", () => {
    const falta = camposNoTexto(area.value);
    if (falta.length) { mostrarFalta(); return avisoDoFormulario(form.querySelector("[role=alert]"), "Antes de mandar, complete os campos sem valor (veja abaixo do texto)."); }
    gravar("mandar");
  });
  return j;
}
