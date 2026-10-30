// Agenda (Missão 3, bloco B): os compromissos (05: visita, degustação, reunião, outro), com ou sem cliente, ligados
// (ou não) a uma reserva ou ao pedido que marcou a visita (Atendimento). A gaveta e o formulário de marcar e editar.

import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { abrirParaQuem, abrirCliente } from "../../ui/para-quem.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { campoTexto, campoArea, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { dataLonga, dataCurta, instanteNoFuso, linkWhatsapp, normalizarWhatsapp, dia } from "../../ui/formatos.js";
import { COMPROMISSOS, tiposDeCompromisso, itemDoCompromisso, faixa, quandoFoi } from "./logica.js";

export const COLUNAS_COMPROMISSO = "id, tipo, titulo, inicio, fim, cliente_id, reserva_id, pedido_id, responsavel_id, observacoes, clientes(id, nome, whatsapp, email, instagram)";

const podeMexer = pode => pode("agenda", "editar") || pode("atendimento", "editar");

export function abrirCompromisso(c, ctx) {
  const { pode, navegar, equipe, fuso, hoje, banco, avisar } = ctx;
  const edita = podeMexer(pode);
  const it = itemDoCompromisso(c, fuso);
  const numero = normalizarWhatsapp(c.clientes && c.clientes.whatsapp);
  const primeiro = String((c.clientes && c.clientes.nome) || "").trim().split(/\s+/)[0];
  const mensagem = `Oi${primeiro ? `, ${primeiro}` : ""}! Confirmando: ${(COMPROMISSOS[c.tipo] || COMPROMISSOS.outro).nome.toLowerCase()} em ${dataCurta(new Date(c.inicio), fuso)}, ${it.ini}. Até lá!`;
  const j = abrirGaveta({
    foco: "fechar",
    titulo: it.titulo,
    subtitulo: escapar(`${dataLonga(new Date(c.inicio), fuso)}, ${faixa(it)} · ${quandoFoi(it.dia, hoje)}`),
    corpo: `<div class="rz-pilha">
        <div class="rz-etiquetas"><span class="rz-etiqueta rz-etiqueta--info">${escapar((COMPROMISSOS[c.tipo] || COMPROMISSOS.outro).nome)}</span></div>
        <dl class="rz-fatos">
          <div><dt>Com</dt><dd>${escapar((c.clientes && c.clientes.nome) || "ninguém de fora")}</dd></div>
          <div><dt>Quem cuida</dt><dd>${escapar((equipe.find(p => p.id === c.responsavel_id) || {}).nome || "ninguém ainda")}</dd></div>
        </dl>
        ${c.observacoes ? `<div class="rz-balao">${escapar(c.observacoes)}</div>` : ""}
        <div class="rz-pilha-p">
          ${c.clientes ? `<button class="rz-link" type="button" data-ver-cliente>${icone("clientes", { tamanho: 16 })} Ver ${escapar(c.clientes.nome)}</button>` : ""}
          ${c.pedido_id && pode("atendimento", "ver") ? `<a class="rz-link" href="/atendimento?pedido=${escapar(c.pedido_id)}">${icone("conversa", { tamanho: 16 })} Ver o pedido</a>` : ""}
          ${c.reserva_id ? `<button class="rz-link" type="button" data-ver-reserva>${icone("agenda", { tamanho: 16 })} Ver a reserva</button>` : ""}
        </div>
        ${edita ? `<button class="rz-botao rz-botao--fantasma" type="button" data-apagar>${icone("lixo", { tamanho: 16 })}Desmarcar</button>` : ""}
      </div>`,
    rodape: [
      numero ? `<a class="rz-botao" href="${escapar(linkWhatsapp(numero, mensagem))}" target="_blank" rel="noopener">${icone("whatsapp")}Confirmar no WhatsApp</a>` : "",
      edita ? `<button class="rz-botao rz-botao--primario" type="button" data-editar>${icone("editar")}Editar</button>` : "",
    ].filter(Boolean).join(""),
  });
  const el = j.el;
  el.querySelector("[data-ver-cliente]")?.addEventListener("click", () => { j.fechar(); abrirCliente({ cliente: c.clientes, pode, navegar, mensagem }); });
  el.querySelector("[data-ver-reserva]")?.addEventListener("click", () => { j.fechar(); ctx.abrirReservaPorId(c.reserva_id); });
  el.querySelector("[data-editar]")?.addEventListener("click", () => { j.fechar(); abrirFormCompromisso(ctx, { compromisso: c }); });
  el.querySelector("[data-apagar]")?.addEventListener("click", async () => {
    const ok = await confirmar({ titulo: "Desmarcar?", texto: `${escapar(it.titulo)}, ${escapar(dataCurta(new Date(c.inicio), fuso))}. Sai da agenda.`, sim: "Desmarcar", nao: "Voltar", perigo: true });
    if (!ok) return;
    j.fechar();
    try {
      await banco.resultado(banco.tabela("compromissos").delete().eq("id", c.id));
      avisar(`${it.titulo}: saiu da agenda.`, { desfazer: async () => {
        try {
          const { clientes, ...linha } = c;
          await banco.resultado(banco.tabela("compromissos").insert({ ...linha, conta_id: ctx.conta.conta_id }));
          ctx.recarregar();
        } catch (e) { avisar(e.message, { tipo: "erro" }); }
      } });
      ctx.recarregar();
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
  });
  return j;
}

/** Marcar (ou editar) um compromisso. `tipo`: o que veio do "+" (visita). Com quem é opcional. */
export async function abrirFormCompromisso(ctx, { compromisso = null, dia: diaInicial = "", tipo = "" } = {}) {
  const { banco, conta, nicho, avisar, equipe, pessoa, fuso } = ctx;
  const tipos = tiposDeCompromisso(nicho.id);
  let cliente = compromisso ? compromisso.clientes || null : null;
  const it = compromisso ? itemDoCompromisso(compromisso, fuso) : null;
  const paraCampo = t => { const m = String(t || "").match(/^(\d{1,2})h(\d{2})?$/); return m ? `${m[1].padStart(2, "0")}:${m[2] || "00"}` : ""; };
  const tipoInicial = (compromisso && compromisso.tipo) || (tipos.some(t => t.id === tipo) ? tipo : tipos[0].id);
  return new Promise(resolver => {
    let gravado = null;
    const j = abrirGaveta({
      titulo: compromisso ? "Editar" : "Marcar na agenda",
      corpo: `<form class="rz-pilha" novalidate id="form-compromisso">
          <div role="alert" hidden></div>
          <fieldset class="rz-campo"><legend class="rz-rotulo">O que é</legend>
            <div class="rz-chips rz-chips--quebra" role="radiogroup" aria-label="O que é">${tipos.map(t => `<label class="rz-chip"><input type="radio" name="tipo" value="${t.id}"${t.id === tipoInicial ? " checked" : ""}>${escapar(t.nome)}</label>`).join("")}</div></fieldset>
          <div class="rz-escolhido"><span class="rz-linha-texto"><b data-com>${escapar(cliente ? cliente.nome : "Sem cliente")}</b><small>Com quem (opcional)</small></span>
            <button class="rz-botao rz-botao--pequeno" type="button" data-escolher-cliente>${cliente ? "Trocar" : "Escolher"}</button></div>
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "comp-data", nome: "data", rotulo: "Dia", tipo: "date", valor: compromisso ? it.dia : diaInicial })}
            ${campoTexto({ id: "comp-hora", nome: "hora", rotulo: "Hora", tipo: "time", valor: compromisso ? paraCampo(it.ini) : "10:00" })}
          </div>
          ${campoTexto({ id: "comp-titulo", nome: "titulo", rotulo: "Título", opcional: true, valor: (compromisso && compromisso.titulo) || "", placeholder: "Ex.: Degustação do cardápio" })}
          ${equipe.length ? campoSelecao({ id: "comp-resp", nome: "responsavel_id", rotulo: "Quem cuida", valor: (compromisso ? compromisso.responsavel_id : pessoa && pessoa.id) || "", opcoes: [{ valor: "", rotulo: "Ninguém ainda" }, ...equipe.map(x => ({ valor: x.id, rotulo: x.nome }))] }) : ""}
          ${campoArea({ id: "comp-obs", nome: "observacoes", rotulo: "Anotação", opcional: true, linhas: 2, valor: (compromisso && compromisso.observacoes) || "" })}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-compromisso">${compromisso ? "Salvar" : "Marcar"}</button>`,
      aoFechar: () => resolver(gravado),
    });
    const form = j.el.querySelector("form");
    j.el.querySelector("[data-escolher-cliente]").addEventListener("click", async () => {
      const outro = await abrirParaQuem({ banco, conta, titulo: "Com quem?" });
      if (!outro) return;
      cliente = outro;
      j.el.querySelector("[data-com]").textContent = cliente.nome;
      j.el.querySelector("[data-escolher-cliente]").textContent = "Trocar";
    });
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      erroNoCampo(form.data, d.data ? "" : "Escolha o dia.");
      erroNoCampo(form.hora, d.hora ? "" : "Diga a hora.");
      if (!d.data || !d.hora) return;
      const inicio = instanteNoFuso(d.data, d.hora, fuso);
      const linha = {
        tipo: d.tipo || tipoInicial, titulo: String(d.titulo || "").trim() || null,
        inicio: inicio.toISOString(), fim: new Date(inicio.getTime() + 3600000).toISOString(),
        cliente_id: cliente ? cliente.id : null, responsavel_id: d.responsavel_id || null,
        observacoes: String(d.observacoes || "").trim() || null,
      };
      const botao = j.el.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        gravado = compromisso
          ? await banco.resultado(banco.tabela("compromissos").update(linha).eq("id", compromisso.id).select(COLUNAS_COMPROMISSO).single())
          : await banco.resultado(banco.tabela("compromissos").insert({ ...linha, conta_id: conta.conta_id }).select(COLUNAS_COMPROMISSO).single());
        j.fechar();
        avisar(`${linha.tipo === "outro" ? "Compromisso marcado" : `${COMPROMISSOS[linha.tipo].nome} marcada`}: ${dataCurta(inicio, fuso)}.`);
        ctx.recarregar(dia(inicio, fuso));
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
      }
    });
  });
}
