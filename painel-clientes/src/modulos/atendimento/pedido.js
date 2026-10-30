// Atendimento (Missão 3, bloco C): o que se faz num pedido. A gaveta (exemplo de eventos: a mensagem, os fatos, se a
// data está livre, mudar a etapa, Responder e Marcar visita), mudar a etapa com desfazer (09), fechar (vira reserva
// pelo banco: fechar_pedido) e anotar um pedido novo em poucos toques ("Para quem?" primeiro).
// `ctx`: { banco, conta, nicho, pode, avisar, navegar, pessoa, equipe, fuso, pedidos, aoMudar, recarregar }.

import { abrirGaveta, abrirFolha } from "../../ui/gaveta.js";
import { abrirParaQuem, abrirCliente } from "../../ui/para-quem.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { campoTexto, campoArea, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { ligarCopiar } from "../../ui/whatsapp.js";
import { dataCurta, hora, instanteNoFuso, dia, linkWhatsapp } from "../../ui/formatos.js";
import {
  ETAPA, etapasDoNicho, ORIGENS, chegou, mensagemDeResposta, dataLivre, horarioParaFechar, instantesDaReserva,
  limitesDoDia, linhaDoNovoPedido, whatsappDoCliente,
} from "./logica.js";

export const COLUNAS = "id, cliente_id, data_desejada, hora_desejada, servico_id, tipo_id, convidados, mensagem, origem, etapa, responsavel_id, reserva_id, criado_em, atualizado_em, "
  + "clientes(id, nome, whatsapp, email, instagram), tipos_reserva(nome, cor), servicos(nome, cor, duracao_min), pessoas(id, nome, cor)";

export const etiquetaDaEtapa = id => {
  const e = ETAPA[id];
  return e ? `<span class="rz-etiqueta${e.tom ? ` rz-etiqueta--${e.tom}` : ""}">${escapar(e.nome)}</span>` : "";
};
const nomeDoCliente = p => (p.clientes && p.clientes.nome) || "Cliente";
const umaReserva = nicho => (nicho.palavras.reserva === "festa" ? "uma festa" : "um ensaio");

/** Muda a etapa na hora (atualização otimista) e oferece desfazer; se o banco recusar, volta. */
export async function mudarEtapa(p, etapa, ctx, { silencioso = false } = {}) {
  if (!p || p.etapa === etapa) return;
  const { banco, avisar } = ctx;
  const antes = p.etapa;
  const gravar = valor => banco.resultado(banco.tabela("pedidos").update({ etapa: valor }).eq("id", p.id));
  p.etapa = etapa;
  ctx.aoMudar();
  try {
    await gravar(etapa);
    if (!silencioso) {
      avisar(`${nomeDoCliente(p)}: ${ETAPA[etapa].nome.toLowerCase()}.`, {
        desfazer: async () => {
          p.etapa = antes;
          ctx.aoMudar();
          try { await gravar(antes); } catch (e) { avisar(e.message, { tipo: "erro" }); ctx.recarregar(); }
        },
      });
    }
  } catch (e) {
    p.etapa = antes;
    ctx.aoMudar();
    avisar(e.message, { tipo: "erro" });
  }
}

/** A data desejada está livre? Busca as reservas do dia e as datas fechadas, com a regra da agenda online. */
async function verLivre(p, ctx) {
  const { banco, conta, fuso, pedidos } = ctx;
  const { de, ate } = limitesDoDia(p.data_desejada, fuso);
  const [reservas, bloqueios] = await Promise.all([
    banco.resultado(banco.tabela("reservas").select("id, situacao, criado_em, pedido_id").eq("conta_id", conta.conta_id).lt("inicio", ate).gt("fim", de)),
    banco.resultado(banco.tabela("bloqueios").select("id").eq("conta_id", conta.conta_id).lte("de", p.data_desejada).gte("ate", p.data_desejada).limit(1)),
  ]);
  const origem = id => (pedidos.find(x => x.id === id) || {}).origem || null;
  return dataLivre({ reservas, bloqueado: bloqueios.length > 0, pedido: p, origemDoPedido: origem });
}

/** A gaveta do pedido. */
export function abrirPedido(p, ctx) {
  const { nicho, pode, navegar, conta, pessoa, equipe, fuso } = ctx;
  const edita = pode("atendimento", "editar");
  const aberta = ETAPA[p.etapa] && ETAPA[p.etapa].aberta;
  const eventos = nicho.id === "eventos";
  const tipo = (p.tipos_reserva && p.tipos_reserva.nome) || (p.servicos && p.servicos.nome);
  const quando = p.data_desejada ? dataCurta(instanteNoFuso(p.data_desejada, "12:00", fuso), fuso) : "a combinar";
  const numero = whatsappDoCliente(p);
  const mensagem = mensagemDeResposta(p, { conta, pessoa, nicho, fuso });
  const etapasParaEscolher = etapasDoNicho(nicho.id).filter(e => e.aberta);

  const j = abrirGaveta({
    foco: "fechar",
    titulo: nomeDoCliente(p),
    subtitulo: escapar(chegou(p)),
    corpo: `
      <div class="rz-pilha">
        <div class="rz-etiquetas">${etiquetaDaEtapa(p.etapa)}${tipo ? `<span class="rz-etiqueta">${escapar(tipo)}</span>` : ""}</div>
        ${p.mensagem ? `<div class="rz-balao">${escapar(p.mensagem)}</div>` : ""}
        <dl class="rz-fatos">
          <div><dt>Data desejada</dt><dd>${escapar(quando)}${p.hora_desejada ? `, ${escapar(hora(instanteNoFuso(p.data_desejada || dia(new Date(), fuso), p.hora_desejada.slice(0, 5), fuso), fuso))}` : ""}</dd></div>
          ${eventos ? `<div><dt>Convidados</dt><dd>${p.convidados || "?"}</dd></div>` : ""}
          <div><dt>${eventos ? "Tipo de festa" : "Ensaio"}</dt><dd>${escapar(tipo || "a definir")}</dd></div>
        </dl>
        <div data-livre></div>
        ${p.reserva_id && aberta ? `<p class="rz-alerta rz-alerta--aviso">${icone("agenda", { tamanho: 18 })}<span>${p.origem === "agenda_online" ? "A agenda online já separou essa data por 48 horas (pré-reserva)." : "Este pedido já tem uma reserva na Agenda."} Ao fechar, ela fica confirmada.</span></p>` : ""}
        ${edita ? campoSelecao({ id: "pedido-resp", nome: "responsavel_id", rotulo: "Quem está atendendo", valor: p.responsavel_id || "", opcoes: [{ valor: "", rotulo: "Ninguém ainda" }, ...equipe.map(x => ({ valor: x.id, rotulo: x.nome }))] })
          : `<dl class="rz-fatos"><div><dt>Quem está atendendo</dt><dd>${escapar((p.pessoas && p.pessoas.nome) || "Ninguém ainda")}</dd></div></dl>`}
        ${edita && aberta ? `<fieldset class="rz-campo"><legend class="rz-rotulo">Etapa</legend>
          <div class="rz-chips rz-chips--quebra" role="group" aria-label="Mudar a etapa">${etapasParaEscolher.map(e => `<button class="rz-chip" type="button" data-etapa="${e.id}" aria-pressed="${p.etapa === e.id}">${escapar(e.nome)}</button>`).join("")}</div></fieldset>` : ""}
        <div class="rz-pilha-p">
          <button class="rz-link" type="button" data-ver-cliente>${icone("clientes", { tamanho: 16 })} Ver ${escapar(nomeDoCliente(p))}</button>
          ${p.reserva_id && pode("agenda", "ver") ? `<a class="rz-link" href="/agenda?reserva=${escapar(p.reserva_id)}">${icone("agenda", { tamanho: 16 })} Ver na Agenda</a>` : ""}
        </div>
        ${edita && aberta ? `<button class="rz-botao rz-botao--fantasma" type="button" data-perdido>Marcar como perdido</button>` : ""}
        ${edita && p.etapa === "perdido" ? `<button class="rz-botao" type="button" data-reabrir>Reabrir o pedido</button>` : ""}
        ${numero ? "" : `<p class="rz-texto-3">Sem WhatsApp no cadastro: copie a mensagem e mande por onde a pessoa chamou.</p>`}
      </div>`,
    rodape: [
      numero ? `<a class="rz-botao" href="${escapar(linkWhatsapp(numero, mensagem))}" target="_blank" rel="noopener" data-responder>${icone("whatsapp")}Responder</a>`
        : `<button class="rz-botao" type="button" data-copiar="${escapar(mensagem)}">${icone("copiar")}Copiar mensagem</button>`,
      edita && aberta && eventos && p.etapa !== "visita_marcada" ? `<button class="rz-botao" type="button" data-visita>${icone("relogio")}Marcar visita</button>` : "",
      edita && aberta ? `<button class="rz-botao rz-botao--primario" type="button" data-fechar-pedido>${icone("ok")}Fechar</button>` : "",
    ].filter(Boolean).join(""),
  });
  const el = j.el;
  ligarCopiar(el);

  if (p.data_desejada && aberta) {
    verLivre(p, ctx).then(r => {
      const alvo = el.querySelector("[data-livre]");
      if (!alvo) return;
      alvo.innerHTML = r.livre
        ? `<p class="rz-alerta rz-alerta--sucesso">${icone("okCirculo", { tamanho: 18 })}<span>A data está livre na agenda.</span></p>`
        : `<p class="rz-alerta rz-alerta--aviso">${icone("alerta", { tamanho: 18 })}<span>${r.motivo === "fechada" ? "Essa data está fechada na agenda." : `Essa data já tem ${umaReserva(nicho)}. Ofereça outra.`}</span></p>`;
    }).catch(() => null);
  }

  el.querySelector("[data-ver-cliente]").addEventListener("click", () => { j.fechar(); abrirCliente({ cliente: p.clientes, pode, navegar, mensagem }); });
  const responder = el.querySelector("[data-responder]");
  if (responder && edita) responder.addEventListener("click", () => { if (p.etapa === "novo") { mudarEtapa(p, "em_conversa", ctx); j.fechar(); } });
  el.querySelectorAll("[data-etapa]").forEach(b => b.addEventListener("click", () => {
    el.querySelectorAll("[data-etapa]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    mudarEtapa(p, b.dataset.etapa, ctx);
  }));
  const resp = el.querySelector("#pedido-resp");
  if (resp) resp.addEventListener("change", async () => {
    const antes = p.responsavel_id;
    p.responsavel_id = resp.value || null;
    p.pessoas = equipe.find(x => x.id === p.responsavel_id) || null;
    try {
      await ctx.banco.resultado(ctx.banco.tabela("pedidos").update({ responsavel_id: p.responsavel_id }).eq("id", p.id));
      ctx.aoMudar();
    } catch (e) {
      p.responsavel_id = antes;
      resp.value = antes || "";
      ctx.avisar(e.message, { tipo: "erro" });
    }
  });
  el.querySelector("[data-perdido]")?.addEventListener("click", () => { j.fechar(); mudarEtapa(p, "perdido", ctx); });
  el.querySelector("[data-reabrir]")?.addEventListener("click", () => { j.fechar(); mudarEtapa(p, "em_conversa", ctx); });
  el.querySelector("[data-visita]")?.addEventListener("click", () => { j.fechar(); marcarVisita(p, ctx); });
  el.querySelector("[data-fechar-pedido]")?.addEventListener("click", () => { j.fechar(); abrirFechar(p, ctx); });
  return j;
}

/** "Fechar": vira reserva (fechar_pedido). Pré-reserva (falta o sinal) ou confirmada. */
export function abrirFechar(p, ctx) {
  const { banco, conta, nicho, avisar, fuso } = ctx;
  const sugestao = horarioParaFechar(p, nicho);
  const fimSugerido = sugestao.data ? hora(new Date(instanteNoFuso(sugestao.data, sugestao.inicio, fuso).getTime() + sugestao.duracao * 60000), fuso) : "";
  const paraHorario = t => { const m = String(t).match(/^(\d{1,2})h(\d{2})?$/); return m ? `${m[1].padStart(2, "0")}:${m[2] || "00"}` : ""; };
  const folha = abrirFolha({
    titulo: `Fechar o pedido de ${nomeDoCliente(p)}`,
    corpo: `<form class="rz-pilha" novalidate data-fechar-form>
        <div role="alert" hidden></div>
        <p class="rz-texto-2">Vira ${umaReserva(nicho)} na Agenda, sem digitar de novo.</p>
        ${campoTexto({ id: "fechar-data", nome: "data", rotulo: "Data", tipo: "date", valor: sugestao.data })}
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "fechar-inicio", nome: "inicio", rotulo: "Começa", tipo: "time", valor: sugestao.inicio })}
          ${campoTexto({ id: "fechar-fim", nome: "fim", rotulo: "Termina", tipo: "time", valor: paraHorario(fimSugerido) })}
        </div>
        <div data-pacote></div>
        <fieldset class="rz-campo"><legend class="rz-rotulo">Como fica na agenda</legend>
          <div class="rz-opcoes">
            <label class="rz-opcao"><input type="radio" name="situacao" value="pre_reserva" checked><span class="rz-opcao-texto"><b>Pré-reserva</b><small>Segura a data enquanto o sinal não chega.</small></span><span class="rz-opcao-marca">${icone("ok", { tamanho: 14 })}</span></label>
            <label class="rz-opcao"><input type="radio" name="situacao" value="confirmada"><span class="rz-opcao-texto"><b>Confirmada</b><small>O sinal já entrou ou o contrato está aceito.</small></span><span class="rz-opcao-marca">${icone("ok", { tamanho: 14 })}</span></label>
          </div>
        </fieldset>
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="button" data-confirmar>${icone("ok")}Fechar e reservar</button>`,
  });
  const form = folha.corpo.querySelector("form");
  const botao = folha.el.querySelector("[data-confirmar]");
  // Eventos: o pacote já no fechar (o pedido anotado à mão não tem); vai para a festa, e o contrato e o Financeiro
  // saem com ele (Missão 6, o teste das 5 tarefas). Sem pacote em Serviços, o campo nem aparece.
  if (nicho.id === "eventos") {
    banco.resultado(banco.tabela("servicos").select("id, nome").eq("conta_id", conta.conta_id).eq("ativo", true).order("nome")).then(pacotes => {
      if (!pacotes.length || !form.isConnected) return;
      form.querySelector("[data-pacote]").innerHTML = campoSelecao({ id: "fechar-pacote", nome: "servico_id", rotulo: "Pacote", valor: p.servico_id || "", opcoes: [{ valor: "", rotulo: "A definir" }, ...pacotes.map(x => ({ valor: x.id, rotulo: x.nome }))] });
    }).catch(() => {});
  }
  botao.addEventListener("click", async () => {
    const d = lerFormulario(form);
    erroNoCampo(form.data, d.data ? "" : "Escolha a data.");
    erroNoCampo(form.inicio, d.inicio ? "" : "Diga a hora.");
    if (!d.data || !d.inicio) return;
    let duracao = sugestao.duracao;
    if (d.fim) {
      const min = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      duracao = min(d.fim) - min(d.inicio);
      if (duracao <= 0) duracao += 24 * 60;
    }
    const { inicio, fim } = instantesDaReserva({ data: d.data, inicio: d.inicio, duracao }, fuso);
    ocupado(botao, true, "Fechando…");
    try {
      if (form.servico_id && (d.servico_id || null) !== (p.servico_id || null)) {
        await banco.resultado(banco.tabela("pedidos").update({ servico_id: d.servico_id || null }).eq("id", p.id));
        p.servico_id = d.servico_id || null;
      }
      const reserva = await banco.rpc("fechar_pedido", { pedido: p.id, inicio, fim, situacao: d.situacao || "pre_reserva" });
      p.etapa = "fechado";
      p.reserva_id = reserva;
      folha.fechar();
      ctx.aoMudar();
      avisar(`Fechado: ${nomeDoCliente(p)} em ${dataCurta(instanteNoFuso(d.data, d.inicio, fuso), fuso)} na Agenda.`);
      ctx.recarregar();
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
    }
  });
}

/** "Marcar visita" (eventos): um compromisso na agenda, ligado ao pedido e ao cliente; o pedido vai para "Visita marcada". */
export function marcarVisita(p, ctx) {
  const { banco, conta, avisar, fuso, pessoa } = ctx;
  const folha = abrirFolha({
    titulo: `Visita de ${nomeDoCliente(p)}`,
    corpo: `<form class="rz-pilha" novalidate>
        <div role="alert" hidden></div>
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "visita-data", nome: "data", rotulo: "Dia", tipo: "date", valor: "" })}
          ${campoTexto({ id: "visita-hora", nome: "hora", rotulo: "Hora", tipo: "time", valor: "10:00" })}
        </div>
        ${campoArea({ id: "visita-obs", nome: "observacoes", rotulo: "Anotação", opcional: true, linhas: 2, placeholder: "Ex.: vem com a mãe e a cerimonialista" })}
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="button" data-confirmar>Marcar visita</button>`,
  });
  const form = folha.corpo.querySelector("form");
  const botao = folha.el.querySelector("[data-confirmar]");
  botao.addEventListener("click", async () => {
    const d = lerFormulario(form);
    erroNoCampo(form.data, d.data ? "" : "Escolha o dia.");
    erroNoCampo(form.hora, d.hora ? "" : "Diga a hora.");
    if (!d.data || !d.hora) return;
    const inicio = instanteNoFuso(d.data, d.hora, fuso);
    ocupado(botao, true, "Marcando…");
    try {
      await banco.resultado(banco.tabela("compromissos").insert({
        conta_id: conta.conta_id, tipo: "visita", inicio: inicio.toISOString(), fim: new Date(inicio.getTime() + 3600000).toISOString(),
        cliente_id: p.cliente_id, pedido_id: p.id, responsavel_id: p.responsavel_id || (pessoa && pessoa.id) || null,
        observacoes: String(d.observacoes || "").trim() || null,
      }));
      folha.fechar();
      await mudarEtapa(p, "visita_marcada", ctx, { silencioso: true });
      avisar(`Visita de ${nomeDoCliente(p)} marcada: ${dataCurta(inicio, fuso)}, ${hora(inicio, fuso)}.`);
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
    }
  });
}

/** Anotar pedido (o "+ Novo pedido"): primeiro "Para quem?", depois o que a pessoa pediu. Resolve com o pedido criado. */
export async function anotarPedido(ctx, { cliente: jaEscolhido = null } = {}) {
  const { banco, conta, nicho, avisar, equipe, pessoa } = ctx;
  let cliente = jaEscolhido || await abrirParaQuem({ banco, conta, titulo: "Pedido de quem?" });
  if (!cliente) return null;
  const eventos = nicho.id === "eventos";
  const tabela = eventos ? "tipos_reserva" : "servicos";
  const tipos = await banco.resultado(banco.tabela(tabela).select("id, nome").eq("conta_id", conta.conta_id).eq("ativo", true).order("ordem").order("nome")).catch(() => []);
  return new Promise(resolver => {
    let criado = null;
    const j = abrirGaveta({
      titulo: "Novo pedido",
      corpo: `<form class="rz-pilha" novalidate id="form-novo-pedido">
          <div role="alert" hidden></div>
          <div class="rz-escolhido"><span class="rz-linha-texto"><b data-cliente-nome>${escapar(cliente.nome)}</b><small>${escapar(cliente.whatsapp ? "WhatsApp " + cliente.whatsapp : "sem WhatsApp")}</small></span>
            <button class="rz-botao rz-botao--pequeno" type="button" data-trocar-cliente>Trocar</button></div>
          <fieldset class="rz-campo"><legend class="rz-rotulo">Por onde chegou</legend>
            <div class="rz-chips rz-chips--quebra" role="radiogroup" aria-label="Por onde chegou">
              ${ORIGENS.filter(o => o.id !== "agenda_online").map((o, i) => `<label class="rz-chip"><input type="radio" name="origem" value="${o.id}"${i === 0 ? " checked" : ""}>${escapar(o.nome)}</label>`).join("")}
            </div></fieldset>
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "novo-data", nome: "data_desejada", rotulo: "Data desejada", tipo: "date", opcional: true })}
            ${eventos ? campoTexto({ id: "novo-conv", nome: "convidados", rotulo: "Convidados", teclado: "numeric", opcional: true, placeholder: "Ex.: 120" })
              : campoTexto({ id: "novo-hora", nome: "hora_desejada", rotulo: "Horário", tipo: "time", opcional: true })}
          </div>
          ${tipos.length ? campoSelecao({ id: "novo-tipo", nome: eventos ? "tipo_id" : "servico_id", rotulo: eventos ? "Tipo de festa" : "Ensaio", opcoes: [{ valor: "", rotulo: "A definir" }, ...tipos.map(t => ({ valor: t.id, rotulo: t.nome }))] }) : ""}
          ${campoArea({ id: "novo-msg", nome: "mensagem", rotulo: "O que a pessoa pediu", opcional: true, linhas: 3, placeholder: eventos ? "Ex.: casamento à noite, quer saber do pacote com buffet" : "Ex.: ensaio de família no parque, 4 pessoas" })}
          ${equipe.length > 1 ? campoSelecao({ id: "novo-resp", nome: "responsavel", rotulo: "Quem vai atender", valor: (pessoa && pessoa.id) || "", opcoes: [{ valor: "", rotulo: "Ninguém ainda" }, ...equipe.map(x => ({ valor: x.id, rotulo: x.nome }))] }) : ""}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-novo-pedido">Anotar pedido</button>`,
      aoFechar: () => resolver(criado),
    });
    const form = j.el.querySelector("form");
    j.el.querySelector("[data-trocar-cliente]").addEventListener("click", async () => {
      const outro = await abrirParaQuem({ banco, conta, titulo: "Pedido de quem?" });
      if (!outro) return;
      cliente = outro;
      j.el.querySelector("[data-cliente-nome]").textContent = cliente.nome;
      j.el.querySelector("[data-cliente-nome] + small").textContent = cliente.whatsapp ? "WhatsApp " + cliente.whatsapp : "sem WhatsApp";
    });
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const botao = j.el.querySelector("[type=submit]");
      const d = lerFormulario(form);
      ocupado(botao, true, "Anotando…");
      try {
        const linha = linhaDoNovoPedido(d, { contaId: conta.conta_id, cliente, idNicho: nicho.id, responsavel: d.responsavel || (equipe.length <= 1 && pessoa ? pessoa.id : null) });
        ctx.anotouEm = Date.now(); // o tempo real não avisa de novo o que a pessoa acabou de anotar
        criado = await banco.resultado(banco.tabela("pedidos").insert(linha).select(COLUNAS).single());
        j.fechar();
        avisar(`Pedido de ${cliente.nome} anotado.`);
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
      }
    });
  });
}
