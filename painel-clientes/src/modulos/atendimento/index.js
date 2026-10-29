// Módulo Atendimento (Missão 3, bloco C): todo pedido de orçamento num lugar só (02). Referência: o exemplo de
// eventos e o 09 ("Atendimento"): a lista primeiro, com o próximo passo na linha; o funil e "De onde vêm"
// recolhidos depois dela; no computador, o quadro em colunas por etapa (arrastar muda a etapa, com desfazer).
// O que se faz num pedido mora em pedido.js; as regras sem tela, em logica.js. A lista de espera (fotografia), em
// espera.js. Quem só vê não tem botões nem arrastar (o banco também não deixa).

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { iniciais, haQuanto, linkWhatsapp } from "../../ui/formatos.js";
import { ETAPA, etapasDoNicho, chipsDaLista, filtrar, resumoDoPedido, funil, deOndeVem, mensagemDeResposta, whatsappDoCliente } from "./logica.js";
import { COLUNAS, etiquetaDaEtapa, abrirPedido, abrirFechar, anotarPedido, mudarEtapa } from "./pedido.js";

const CHAVE_DA_VISTA = "painel-renderiza:atendimento:vista";
const lerVista = () => { try { return localStorage.getItem(CHAVE_DA_VISTA) === "quadro" ? "quadro" : "lista"; } catch (e) { return "lista"; } };
const guardarVista = v => { try { localStorage.setItem(CHAVE_DA_VISTA, v); } catch (e) { /* sem espaço: segue */ } };
const computador = () => window.matchMedia("(min-width: 960px)").matches;

export async function montar(el, contexto) {
  const { banco, conta, nicho, pode, avisar, navegar, pessoa } = contexto;
  const edita = pode("atendimento", "editar");
  const fuso = conta.fuso || undefined;
  const params = new URLSearchParams(location.search);
  const temEspera = !!nicho.temCampanhas;
  const aba = temEspera && params.get("aba") === "espera" ? "espera" : "pedidos";
  let vista = lerVista();
  let filtro = { etapa: "abertos", busca: "" };
  const ctx = { banco, conta, nicho, pode, avisar, navegar, pessoa, fuso, equipe: [], pedidos: [], aoMudar: () => desenhar(), recarregar: () => atualizar() };

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Atendimento</h1>
        <p class="rz-texto-2">Quem pediu pelo WhatsApp, pelo Instagram ou pela agenda online, num lugar só.</p></div>
      <div class="rz-cabeca-acoes">
        ${aba === "pedidos" ? `<div class="rz-so-computador" data-vistas>${vistaEscolha(vista)}</div>` : ""}
        ${edita && aba === "pedidos" ? `<button class="rz-botao rz-botao--primario" type="button" data-anotar>${icone("adicionar", { tamanho: 18 })}Anotar pedido</button>` : ""}
      </div>
    </header>
    ${temEspera ? `<nav class="rz-abas" aria-label="Partes do Atendimento"><a href="/atendimento"${aba === "pedidos" ? ' aria-current="page"' : ""}>Pedidos</a><a href="/atendimento?aba=espera"${aba === "espera" ? ' aria-current="page"' : ""}>Lista de espera</a></nav>` : ""}
    ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê o Atendimento. Quem muda é o dono ou quem ele deixar.</span></p>` : ""}
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  if (aba === "espera") {
    const { montarEspera } = await import("./espera.js");
    return montarEspera(corpo, contexto);
  }

  // ---------- desenhar ----------
  function linhaDaLista(p) {
    const novo = p.etapa === "novo";
    const numero = whatsappDoCliente(p);
    let acao = "";
    if (edita && novo && numero) acao = `<a class="rz-botao rz-botao--pequeno rz-linha-acao" href="${escapar(linkWhatsapp(numero, mensagemDeResposta(p, { conta, pessoa, nicho, fuso })))}" target="_blank" rel="noopener" data-responder="${escapar(p.id)}">${icone("whatsapp", { tamanho: 16 })}Responder</a>`;
    else if (edita && ["orcamento_enviado", "aguardando_sinal"].includes(p.etapa)) acao = `<button class="rz-botao rz-botao--pequeno rz-linha-acao" type="button" data-fechar-pedido="${escapar(p.id)}">Fechar</button>`;
    return `<li class="rz-com-acao"><button class="rz-linha" type="button" data-pedido="${escapar(p.id)}">
        <span class="rz-avatar rz-avatar--cliente" aria-hidden="true">${escapar(iniciais((p.clientes && p.clientes.nome) || "?"))}</span>
        <span class="rz-linha-texto"><b>${escapar((p.clientes && p.clientes.nome) || "Cliente")}</b><small>${escapar(resumoDoPedido(p, nicho, { fuso }))}</small></span>
        <span class="rz-linha-fim">${etiquetaDaEtapa(p.etapa)}<span class="rz-linha-quando">${escapar(haQuanto(new Date(p.criado_em)))}</span></span>
      </button>${acao}</li>`;
  }

  function desenharLista(alvo) {
    const lista = filtrar(ctx.pedidos, filtro);
    if (!ctx.pedidos.length) {
      alvo.innerHTML = vazio({ icone: "conversa", titulo: "Nenhum pedido ainda", texto: (conta.modulos || []).includes("agenda-online") ? "Os pedidos da agenda online entram aqui sozinhos. Os do WhatsApp e do Instagram, anote em poucos toques." : "Anote aqui cada pedido que chega pelo WhatsApp, pelo Instagram ou por indicação, e acompanhe até fechar.", acao: edita ? { rotulo: "Anotar pedido", dado: "anotar" } : null });
      return;
    }
    alvo.innerHTML = lista.length
      ? `<ul class="rz-linhas rz-linhas--pedidos rz-cartao">${lista.map(linhaDaLista).join("")}</ul>`
      : `<p class="rz-estado-curto">${filtro.busca ? "Nenhum pedido com essa busca." : "Nenhum pedido nesta etapa."}</p>`;
  }

  function desenharQuadro(alvo) {
    const busca = filtrar(ctx.pedidos, { etapa: "todas", busca: filtro.busca });
    const colunas = [...etapasDoNicho(nicho.id)];
    alvo.innerHTML = `<div class="rz-quadro" role="list" aria-label="Pedidos por etapa" style="--abertas:${colunas.filter(e => e.aberta).length}">${colunas.map(e => {
      let doEstagio = busca.filter(p => p.etapa === e.id).sort((a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em));
      const total = doEstagio.length;
      if (!e.aberta) doEstagio = doEstagio.slice(0, 6); // fechados e perdidos: só os mais recentes
      return `<section class="rz-coluna" role="listitem" data-coluna="${e.id}" aria-label="${escapar(e.nome)}">
        <div class="rz-coluna-cabeca">${escapar(e.nome)} <span>${total}</span></div>
        ${doEstagio.map(p => `<button class="rz-cartao-pedido" type="button" data-pedido="${escapar(p.id)}"${edita ? ' draggable="true"' : ""}>
            <b>${escapar((p.clientes && p.clientes.nome) || "Cliente")}</b><small>${escapar(resumoDoPedido(p, nicho, { fuso }))}</small><small>${escapar(haQuanto(new Date(p.criado_em)))}</small></button>`).join("")
          || `<p class="rz-coluna-vazia">${edita && e.aberta ? "Arraste um pedido para cá" : "Nada aqui"}</p>`}
        ${!e.aberta && total > doEstagio.length ? `<p class="rz-coluna-vazia">e mais ${total - doEstagio.length}</p>` : ""}
      </section>`;
    }).join("")}</div>`;
  }

  function desenharResumo(alvo) {
    const f = funil(ctx.pedidos, { idNicho: nicho.id });
    const origens = deOndeVem(ctx.pedidos);
    alvo.innerHTML = ctx.pedidos.length ? `
      <details class="rz-cartao rz-resumo">
        <summary>Como vão os pedidos ${icone("setaBaixo", { tamanho: 18 })}</summary>
        <div class="rz-resumo-corpo">
          <div><p class="rz-rotulo">Últimos 30 dias</p>
            <dl class="rz-funil">${f.map(l => `<div><dt>${escapar(l.nome)}</dt><dd>${l.n}</dd>${l.pct != null ? `<small>${l.pct}% de ${l.de}</small>` : ""}</div>`).join("")}</dl></div>
          <div><p class="rz-rotulo">De onde vêm (90 dias)</p>
            <ul class="rz-origens">${origens.map(o => `<li><span>${escapar(o.nome)}</span><b>${o.pct}%</b><span class="rz-progresso" aria-hidden="true"><span style="width:${o.pct}%"></span></span></li>`).join("") || `<li class="rz-texto-3">Ainda sem pedidos no período.</li>`}</ul>
            ${origens.some(o => o.id === "agenda_online") ? `<p class="rz-texto-3">${icone("estrela", { tamanho: 16 })} A agenda online trouxe ${origens.find(o => o.id === "agenda_online").n} pedidos sem ninguém precisar responder na hora.</p>` : ""}</div>
        </div>
      </details>` : "";
  }

  function desenhar() {
    const quadro = vista === "quadro" && computador();
    const resumoAberto = corpo.querySelector("details.rz-resumo")?.open;
    corpo.innerHTML = `
      <div class="rz-barra-ferramentas">
        <input class="rz-entrada rz-campo-busca" type="search" placeholder="Buscar por nome ou WhatsApp" aria-label="Buscar pedido" value="${escapar(filtro.busca)}" data-busca>
        ${quadro ? "" : chips({ rotulo: "Etapa", opcoes: chipsDaLista(ctx.pedidos, nicho.id), ativo: filtro.etapa })}
      </div>
      <div data-pedidos></div>
      <div data-resumo></div>`;
    const alvo = corpo.querySelector("[data-pedidos]");
    if (quadro) desenharQuadro(alvo); else desenharLista(alvo);
    desenharResumo(corpo.querySelector("[data-resumo]"));
    if (resumoAberto) corpo.querySelector("details.rz-resumo").open = true;
    const busca = corpo.querySelector("[data-busca]");
    busca.addEventListener("input", () => {
      filtro.busca = busca.value;
      if (quadro) desenharQuadro(alvo); else desenharLista(alvo);
    });
    const grupoDeChips = corpo.querySelector(".rz-chips");
    if (grupoDeChips) ligarChips(grupoDeChips, valor => { filtro.etapa = valor; desenharLista(alvo); });
    if (quadro && edita) ligarArrastar(alvo);
  }

  // ---------- arrastar (quadro) ----------
  function ligarArrastar(alvo) {
    let arrastando = null;
    alvo.addEventListener("dragstart", e => {
      const cartao = e.target.closest("[data-pedido]");
      if (!cartao) return;
      arrastando = cartao.dataset.pedido;
      cartao.setAttribute("aria-grabbed", "true");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", arrastando);
    });
    alvo.addEventListener("dragend", e => { e.target.closest("[data-pedido]")?.removeAttribute("aria-grabbed"); alvo.querySelectorAll("[data-sobre]").forEach(c => c.removeAttribute("data-sobre")); });
    alvo.addEventListener("dragover", e => {
      const coluna = e.target.closest("[data-coluna]");
      if (!coluna || !arrastando) return;
      e.preventDefault();
      alvo.querySelectorAll("[data-sobre]").forEach(c => { if (c !== coluna) c.removeAttribute("data-sobre"); });
      coluna.dataset.sobre = "true";
    });
    alvo.addEventListener("drop", e => {
      const coluna = e.target.closest("[data-coluna]");
      if (!coluna || !arrastando) return;
      e.preventDefault();
      const p = ctx.pedidos.find(x => x.id === arrastando);
      arrastando = null;
      coluna.removeAttribute("data-sobre");
      if (!p || p.etapa === coluna.dataset.coluna) return;
      if (coluna.dataset.coluna === "fechado") return abrirFechar(p, ctx); // fechar pede a data: vira reserva
      mudarEtapa(p, coluna.dataset.coluna, ctx);
    });
  }

  // ---------- eventos ----------
  el.addEventListener("click", async e => {
    if (e.target.closest("[data-anotar], [data-acao=anotar]")) {
      const novo = await anotarPedido(ctx);
      if (novo) { ctx.pedidos.unshift(novo); filtro.etapa = "abertos"; desenhar(); }
      return;
    }
    const vistaBotao = e.target.closest("[data-vista]");
    if (vistaBotao) {
      vista = vistaBotao.dataset.vista;
      guardarVista(vista);
      el.querySelector("[data-vistas]").innerHTML = vistaEscolha(vista);
      return desenhar();
    }
    const responder = e.target.closest("[data-responder]");
    if (responder) {
      const p = ctx.pedidos.find(x => x.id === responder.dataset.responder);
      if (p && p.etapa === "novo") mudarEtapa(p, "em_conversa", ctx);
      return; // o link abre o WhatsApp
    }
    const fechar = e.target.closest("[data-fechar-pedido]");
    if (fechar && corpo.contains(fechar)) {
      const p = ctx.pedidos.find(x => x.id === fechar.dataset.fecharPedido);
      if (p) abrirFechar(p, ctx);
      return;
    }
    const linha = e.target.closest("[data-pedido]");
    if (linha && corpo.contains(linha)) {
      const p = ctx.pedidos.find(x => x.id === linha.dataset.pedido);
      if (p) abrirPedido(p, ctx);
    }
  });

  // ---------- carregar ----------
  const carregar = async () => {
    const desde = new Date(Date.now() - 90 * 864e5).toISOString();
    const abertas = etapasDoNicho("eventos").filter(x => x.aberta).map(x => x.id).join(",");
    const [pedidos, equipe] = await Promise.all([
      banco.resultado(banco.tabela("pedidos").select(COLUNAS).eq("conta_id", conta.conta_id)
        .or(`etapa.in.(${abertas}),criado_em.gte.${desde}`).order("criado_em", { ascending: false }).limit(500)),
      banco.resultado(banco.tabela("pessoas").select("id, nome, cor").eq("conta_id", conta.conta_id).eq("ativa", true).order("nome")).catch(() => []),
    ]);
    return { pedidos, equipe };
  };
  const usar = ({ pedidos, equipe }) => { ctx.pedidos = pedidos; ctx.equipe = equipe; desenhar(); };
  async function atualizar() {
    try { usar(await carregar()); } catch (e) { avisar(e.message, { tipo: "erro" }); }
  }

  await comEstados(corpo, { carregar, desenhar: usar, linhas: 6 });

  // tempo real (09): o pedido novo da agenda online (ou de outra pessoa da equipe) aparece sozinho
  let pendente = null;
  const parar = banco.ouvir ? banco.ouvir("pedidos", {
    filtro: `conta_id=eq.${conta.conta_id}`,
    aoMudar: async ({ eventType, new: novo, old }) => {
      if (eventType === "DELETE") { ctx.pedidos = ctx.pedidos.filter(p => p.id !== old.id); return desenhar(); }
      const id = novo && novo.id;
      if (!id) return;
      try {
        const linha = await banco.resultado(banco.tabela("pedidos").select(COLUNAS).eq("id", id).maybeSingle());
        if (!linha || !el.isConnected) return;
        const i = ctx.pedidos.findIndex(p => p.id === id);
        if (i >= 0) ctx.pedidos[i] = Object.assign(ctx.pedidos[i], linha); else ctx.pedidos.unshift(linha);
        clearTimeout(pendente);
        pendente = setTimeout(desenhar, 150); // várias mudanças juntas desenham uma vez
        const acabeiDeAnotar = Date.now() - (ctx.anotouEm || 0) < 8000 && linha.origem !== "agenda_online";
        if (eventType === "INSERT" && i < 0 && !acabeiDeAnotar) avisar(`Pedido novo: ${(linha.clientes && linha.clientes.nome) || "cliente"}${linha.origem === "agenda_online" ? ", pela agenda online" : ""}.`);
      } catch (e) { /* a lista se acerta no próximo carregamento */ }
    },
  }) : null;

  // ?novo=pedido (o "+" das ações rápidas) e ?pedido=<id> (um link para o pedido)
  if (params.get("novo") === "pedido" || params.get("pedido")) history.replaceState(history.state, "", location.pathname);
  if (params.get("novo") === "pedido" && edita) {
    const novo = await anotarPedido(ctx);
    if (novo) { ctx.pedidos.unshift(novo); desenhar(); }
  } else if (params.get("pedido")) {
    const p = ctx.pedidos.find(x => x.id === params.get("pedido"));
    if (p) abrirPedido(p, ctx);
  }
  return () => { clearTimeout(pendente); if (parar) parar(); };
}

function vistaEscolha(vista) {
  return `<div class="rz-segmentos" role="group" aria-label="Ver como">
      <button type="button" class="rz-segmento" data-vista="lista" aria-pressed="${vista === "lista"}">Lista</button>
      <button type="button" class="rz-segmento" data-vista="quadro" aria-pressed="${vista === "quadro"}">Quadro</button>
    </div>`;
}
