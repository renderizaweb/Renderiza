// Módulo Clientes (Missão 3, bloco A): todo mundo que chegou (05, "O cliente no centro"), com a situação calculada
// pelo banco, a próxima (ou a última) reserva na linha e a ficha como linha do tempo. Na fotografia, "Clientes e
// entregas": a aba das entregas das fotos (entregas.js). A ficha, o novo, juntar e arquivar moram em ficha.js.

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { dia, dataCurta, iniciais, telefone } from "../../ui/formatos.js";
import { chipsDeClientes, filtrarClientes, reservasPorCliente, nomeDaOrigem } from "./logica.js";
import { COLUNAS_CLIENTE, etiquetaDoCliente, abrirFicha, abrirFormCliente } from "./ficha.js";

export async function montar(el, contexto) {
  const { banco, conta, nicho, pode, avisar, navegar } = contexto;
  const edita = pode("clientes", "editar");
  const fuso = conta.fuso || undefined;
  const hoje = dia(new Date(), fuso);
  const params = new URLSearchParams(location.search);
  const fotografia = nicho.id === "fotografia";
  const aba = fotografia && params.get("aba") === "entregas" ? "entregas" : "clientes";
  const nomeDoModulo = (nicho.modulos.clientes && nicho.modulos.clientes.nomeLongo) || "Clientes";
  let filtro = { grupo: "todos", busca: "" };
  let dados = { clientes: [], proxima: {}, ultima: {} };
  const ctx = { banco, conta, nicho, pode, avisar, navegar, fuso, hoje, aoMudar: () => desenhar(), recarregar: id => atualizar(id) };

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">${escapar(nomeDoModulo)}</h1>
        <p class="rz-texto-2">${fotografia ? "A ficha de cada cliente e em que pé está a entrega das fotos." : `A ficha de cada cliente: os pedidos, ${escapar(nicho.palavras.aReserva)}, os contratos e os pagamentos.`}</p></div>
      ${edita && aba === "clientes" ? `<div class="rz-cabeca-acoes"><button class="rz-botao rz-botao--primario" type="button" data-novo-cliente-lista>${icone("adicionar", { tamanho: 18 })}Novo cliente</button></div>` : ""}
    </header>
    ${fotografia ? `<nav class="rz-abas" aria-label="Partes de Clientes"><a href="/clientes"${aba === "clientes" ? ' aria-current="page"' : ""}>Clientes</a><a href="/clientes?aba=entregas"${aba === "entregas" ? ' aria-current="page"' : ""}>Entregas</a></nav>` : ""}
    ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê os clientes. Quem muda é o dono ou quem ele deixar.</span></p>` : ""}
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  if (aba === "entregas") {
    const { montarEntregas } = await import("./entregas.js");
    return montarEntregas(corpo, ctx, { entrega: params.get("entrega") });
  }

  const reservaNaLinha = c => {
    const r = dados.proxima[c.id] || dados.ultima[c.id];
    if (!r) return "";
    const tipo = (r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome) || nicho.palavras.reserva;
    return `${tipo} · ${dataCurta(new Date(r.inicio), fuso)}${dados.proxima[c.id] ? "" : " (já foi)"}`;
  };
  const linha = c => `<li><button class="rz-linha" type="button" data-cliente="${escapar(c.id)}">
      <span class="rz-avatar rz-avatar--cliente" aria-hidden="true">${escapar(iniciais(c.nome))}</span>
      <span class="rz-linha-texto"><b>${escapar(c.nome)}</b><small>${escapar([reservaNaLinha(c), c.whatsapp ? telefone(c.whatsapp) : c.email || (c.instagram ? "@" + c.instagram : ""), nomeDaOrigem(c.origem)].filter(Boolean).join(" · ") || "sem contato")}</small></span>
      <span class="rz-linha-fim">${etiquetaDoCliente(c.situacao)}</span></button></li>`;

  function desenharLista(alvo) {
    const lista = filtrarClientes(dados.clientes, { ...filtro, proxima: dados.proxima });
    if (!dados.clientes.length) {
      alvo.innerHTML = vazio({ icone: "clientes", titulo: "Nenhum cliente ainda", texto: "Todo mundo que pede orçamento, reserva ou chama no WhatsApp vira cliente aqui. Dá para cadastrar direto também.", acao: edita ? { rotulo: "Novo cliente", dado: "novo-cliente" } : null });
      return;
    }
    alvo.innerHTML = lista.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-cartao">${lista.slice(0, 300).map(linha).join("")}</ul>${lista.length > 300 ? `<p class="rz-estado-curto">Mostrando 300 de ${lista.length}. Use a busca.</p>` : ""}`
      : `<p class="rz-estado-curto">${filtro.busca ? "Nenhum cliente com essa busca." : "Ninguém aqui."}</p>`;
  }
  function desenhar() {
    corpo.innerHTML = `
      <div class="rz-barra-ferramentas">
        <input class="rz-entrada rz-campo-busca" type="search" placeholder="Buscar por nome, WhatsApp, e-mail ou Instagram" aria-label="Buscar cliente" value="${escapar(filtro.busca)}" data-busca>
        ${chips({ rotulo: "Situação", opcoes: chipsDeClientes(dados.clientes), ativo: filtro.grupo })}
      </div>
      <div data-lista></div>`;
    const alvo = corpo.querySelector("[data-lista]");
    desenharLista(alvo);
    const busca = corpo.querySelector("[data-busca]");
    busca.addEventListener("input", () => { filtro.busca = busca.value; desenharLista(alvo); });
    ligarChips(corpo.querySelector(".rz-chips"), v => { filtro.grupo = v; desenharLista(alvo); });
  }

  const carregar = async () => {
    const [clientes, reservas] = await Promise.all([
      banco.resultado(banco.tabela("clientes").select(COLUNAS_CLIENTE).eq("conta_id", conta.conta_id).order("nome").limit(5000)),
      banco.resultado(banco.tabela("reservas").select("cliente_id, inicio, fim, situacao, tipos_reserva(nome), servicos(nome)").eq("conta_id", conta.conta_id).neq("situacao", "cancelada").limit(5000)).catch(() => []),
    ]);
    return { clientes, ...reservasPorCliente(reservas) };
  };
  const usar = d => { dados = d; desenhar(); };
  async function atualizar(abrirId) {
    try {
      usar(await carregar());
      const c = abrirId && dados.clientes.find(x => x.id === abrirId);
      if (c) abrirFicha(c, ctx);
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
  }

  el.addEventListener("click", e => {
    if (e.target.closest("[data-novo-cliente-lista], [data-acao=novo-cliente]")) return abrirFormCliente(ctx);
    const b = e.target.closest("[data-cliente]");
    if (b && corpo.contains(b)) { const c = dados.clientes.find(x => x.id === b.dataset.cliente); if (c) abrirFicha(c, ctx); }
  });

  await comEstados(corpo, { carregar, desenhar: usar, linhas: 8 });

  // ?cliente=<id> (o nome clicável dos outros módulos) e ?novo=cliente (o "+")
  if (params.has("cliente") || params.has("novo")) history.replaceState(history.state, "", location.pathname);
  if (params.get("cliente")) {
    const c = dados.clientes.find(x => x.id === params.get("cliente"));
    if (c) abrirFicha(c, ctx); else avisar("Esse cliente não está na lista (pode ter sido juntado com outro).", { tipo: "erro" });
  } else if (params.get("novo") === "cliente" && pode("clientes", "editar")) abrirFormCliente(ctx);
}
