// Módulo Agenda (Missão 3, bloco B): a agenda da equipe (eventos) ou do estúdio (fotografia). Referência: os exemplos
// e o 09 ("Agenda (celular)": a faixa da semana e a lista do dia, com o mês a um toque; legenda e equipe no
// "Filtrar"; tocar num dia vazio oferece "Reservar este dia"). No computador, o mês e o painel do dia, lado a lado.
// A reserva mora em reserva.js; os compromissos, em compromisso.js; as campanhas (fotografia), em campanhas.js; as
// regras sem tela, em logica.js. Quem só vê não tem botões (o banco também não deixa).

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { abrirFolha } from "../../ui/gaveta.js";
import { comEstados } from "../../ui/estados.js";
import { interruptor } from "../../ui/campos.js";
import { dia, dataLonga, somarDias, instanteNoFuso, horaDoTexto } from "../../ui/formatos.js";
import {
  DIAS_DA_SEMANA, gradeDoMes, semana, primeiroDoMes, somarMeses, nomeDoMes, itemDaReserva, itemDoCompromisso,
  itensDoDia, filtrarItens, bloqueioDoDia, horariosDoDia, horariosLivres, faixa, quandoFoi, seguraHorario,
} from "./logica.js";
import { COLUNAS_RESERVA, etiquetaDaSituacao, abrirReserva, abrirFormReserva } from "./reserva.js";
import { COLUNAS_COMPROMISSO, abrirCompromisso, abrirFormCompromisso } from "./compromisso.js";

const DIA = /^\d{4}-\d{2}-\d{2}$/;

export async function montar(el, contexto) {
  const { banco, conta, nicho, pode, avisar, navegar, pessoa } = contexto;
  const edita = pode("agenda", "editar");
  const marca = edita || pode("atendimento", "editar"); // compromissos: Agenda ou Atendimento (05)
  const fuso = conta.fuso || undefined;
  const hoje = dia(new Date(), fuso);
  const params = new URLSearchParams(location.search);
  const fotografia = nicho.id === "fotografia";
  const temAgendaOnline = (conta.modulos || []).includes("agenda-online");
  const aba = fotografia && params.get("aba") === "campanhas" ? "campanhas" : "agenda";
  let diaSel = DIA.test(params.get("dia") || "") ? params.get("dia") : hoje;
  let mes = primeiroDoMes(diaSel);
  let vistaCelular = "mes"; // como o exemplo validado (cara-dos-exemplos.md, A1): o mês, com o dia embaixo
  const filtro = { pessoa: null, escondidas: [], canceladas: false };
  let dados = { reservas: [], compromissos: [], bloqueios: [], horarios: [], campanhas: [], de: "", ate: "" };
  const ctx = { banco, conta, nicho, pode, avisar, navegar, pessoa, fuso, hoje, equipe: [], aoMudar: () => desenhar(), recarregar: d => atualizar(d), abrirReservaPorId: id => abrirPorId(id), origemDoPedido: () => null };
  const nomeDoModulo = (nicho.modulos.agenda && nicho.modulos.agenda.nomeLongo) || "Agenda";

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">${escapar(nomeDoModulo)}</h1>
        <p class="rz-texto-2">${fotografia ? "Os ensaios por horário. Toque num dia para ver os horários livres." : "Festas, visitas, degustações e reuniões. Toque num dia ou numa festa."}</p></div>
      <div class="rz-cabeca-acoes">
        ${marca ? `<button class="rz-botao" type="button" data-compromisso>${icone("relogio", { tamanho: 18 })}${fotografia ? "Marcar reunião" : "Marcar visita"}</button>` : ""}
        ${edita ? `<button class="rz-botao rz-botao--primario" type="button" data-reservar>${icone("adicionar", { tamanho: 18 })}${escapar(nicho.palavras.novaReserva)}</button>` : ""}
      </div>
    </header>
    ${fotografia ? `<nav class="rz-abas" aria-label="Partes da agenda"><a href="/agenda"${aba === "agenda" ? ' aria-current="page"' : ""}>Agenda</a><a href="/agenda?aba=campanhas"${aba === "campanhas" ? ' aria-current="page"' : ""}>Campanhas</a></nav>` : ""}
    ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê a agenda. Quem muda é o dono ou quem ele deixar.</span></p>` : ""}
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  if (aba === "campanhas") {
    const { montarCampanhas } = await import("./campanhas.js");
    return montarCampanhas(corpo, ctx);
  }

  // ---------- os itens visíveis ----------
  const itens = () => filtrarItens([
    ...dados.reservas.map(r => itemDaReserva(r, fuso)),
    ...dados.compromissos.map(c => itemDoCompromisso(c, fuso)),
  ], filtro);

  const chipDoItem = it => `<span class="rz-dia-item${it.situacao === "pre_reserva" ? " rz-dia-item--pre" : ""}${it.tipo === "compromisso" ? " rz-dia-item--compromisso" : ""}"${it.cor ? ` style="--cor:${escapar(it.cor)}"` : ""}><time>${escapar(it.ini)}</time>${escapar(it.titulo.split(/\s+/)[0])}</span>`;
  const pontos = lista => `<span class="rz-dia-pontos" aria-hidden="true">${lista.slice(0, 4).map(it => `<i class="${it.tipo === "compromisso" ? "rz-ponto-compromisso" : ""}"${it.cor ? ` style="--cor:${escapar(it.cor)}"` : ""}></i>`).join("")}</span>`;
  const rotuloDoDia = (d, lista, bloq) => `${dataLonga(instanteNoFuso(d, "12:00", fuso), fuso)}${bloq ? ", data fechada" : ""}${lista.length ? `, ${lista.length} ${lista.length === 1 ? "item" : "itens"}` : ""}`;

  function gradeHtml() {
    const todos = itens();
    return `<div class="rz-mes" role="grid" aria-label="${escapar(nomeDoMes(mes))}">
        <div class="rz-mes-semana" role="row">${DIAS_DA_SEMANA.map(d => `<span role="columnheader">${d}</span>`).join("")}</div>
        <div class="rz-mes-dias">${gradeDoMes(mes).map(d => {
          const lista = itensDoDia(todos, d);
          const bloq = bloqueioDoDia(dados.bloqueios, d);
          const classes = ["rz-dia", d.slice(0, 7) !== mes.slice(0, 7) && "rz-dia--fora", d === hoje && "rz-dia--hoje", bloq && "rz-dia--fechado"].filter(Boolean).join(" ");
          return `<button type="button" role="gridcell" class="${classes}" data-dia="${d}" aria-pressed="${d === diaSel}" aria-label="${escapar(rotuloDoDia(d, lista, bloq))}">
            <span class="rz-dia-n">${Number(d.slice(8))}</span>
            <span class="rz-dia-itens">${lista.slice(0, 3).map(chipDoItem).join("")}${lista.length > 3 ? `<span class="rz-dia-mais">+${lista.length - 3}</span>` : ""}</span>
            ${pontos(lista)}</button>`;
        }).join("")}</div>
      </div>`;
  }

  function semanaHtml() {
    const todos = itens();
    return `<div class="rz-semana">
        <button class="rz-botao rz-botao--fantasma rz-botao--pequeno" type="button" data-semana="-7" aria-label="Semana anterior">${icone("voltar", { tamanho: 18 })}</button>
        <div class="rz-semana-dias">${semana(diaSel).map(d => {
          const lista = itensDoDia(todos, d);
          const bloq = bloqueioDoDia(dados.bloqueios, d);
          return `<button type="button" class="rz-dia-curto${d === hoje ? " rz-dia--hoje" : ""}${bloq ? " rz-dia--fechado" : ""}" data-dia="${d}" aria-pressed="${d === diaSel}" aria-label="${escapar(rotuloDoDia(d, lista, bloq))}">
            <small>${DIAS_DA_SEMANA[new Date(d + "T12:00:00Z").getUTCDay()]}</small><b>${Number(d.slice(8))}</b>${pontos(lista)}</button>`;
        }).join("")}</div>
        <button class="rz-botao rz-botao--fantasma rz-botao--pequeno rz-girar" type="button" data-semana="7" aria-label="Próxima semana">${icone("voltar", { tamanho: 18 })}</button>
      </div>`;
  }

  function painelDoDia() {
    const lista = itensDoDia(itens(), diaSel);
    const bloq = bloqueioDoDia(dados.bloqueios, diaSel);
    const reservasDoDia = dados.reservas.filter(r => dia(new Date(r.inicio), fuso) === diaSel && seguraHorario(r));
    let livres = [];
    if (fotografia && diaSel >= hoje) {
      const campanha = dados.campanhas.find(c => (c.dias || []).includes(diaSel)) || null;
      livres = horariosLivres({ d: diaSel, horarios: dados.horarios, campanha, reservas: dados.reservas, bloqueios: dados.bloqueios, duracao: nicho.horarioPadrao.duracao, fuso });
    }
    const turnos = !fotografia ? horariosDoDia(dados.horarios, diaSel) : [];
    const diaLivre = !fotografia && diaSel >= hoje && !bloq && !reservasDoDia.length && turnos.length;
    const campanhaDoDia = fotografia ? dados.campanhas.find(c => (c.dias || []).includes(diaSel)) : null;
    return `<section class="rz-cartao rz-painel-dia" aria-labelledby="painel-dia-titulo">
        <div class="rz-painel-dia-cabeca"><h2 class="rz-titulo-3" id="painel-dia-titulo">${escapar(dataLonga(instanteNoFuso(diaSel, "12:00", fuso), fuso))}</h2><span class="rz-texto-3">${escapar(quandoFoi(diaSel, hoje))}</span></div>
        ${bloq ? `<p class="rz-alerta rz-alerta--aviso">${icone("cadeado", { tamanho: 18 })}<span>Data fechada${bloq.motivo ? `: ${escapar(bloq.motivo)}` : ""}.</span></p>` : ""}
        ${campanhaDoDia ? `<p class="rz-alerta rz-alerta--info">${icone("estrela", { tamanho: 18 })}<span>Dia de ${escapar(campanhaDoDia.nome)}. <a href="/agenda?aba=campanhas">Ver o quadro de horários</a></span></p>` : ""}
        ${lista.length ? `<ul class="rz-linhas">${lista.map(it => `<li><button class="rz-linha rz-item-agenda${it.situacao === "cancelada" ? " rz-item-agenda--cancelado" : ""}" type="button" data-item="${it.tipo}:${escapar(it.id)}">
            <span class="rz-item-agenda-hora"><b>${escapar(it.ini)}</b>${it.fim ? `<small>${escapar(it.fim)}</small>` : ""}</span>
            <span class="rz-item-agenda-cor${it.tipo === "compromisso" ? " rz-ponto-compromisso" : ""}"${it.cor ? ` style="--cor:${escapar(it.cor)}"` : ""} aria-hidden="true"></span>
            <span class="rz-linha-texto"><b>${escapar(it.titulo)}</b><small>${escapar((it.tipo === "reserva" ? [it.sub, it.original.convidados && nicho.temConvidados ? `${it.original.convidados} convidados` : null, nomeDe(it.responsaveis[0])] : [it.com, nomeDe(it.responsaveis[0])]).filter(Boolean).join(" · ") || " ")}</small></span>
            <span class="rz-linha-fim">${it.situacao ? etiquetaDaSituacao(it.situacao) : `<span class="rz-etiqueta rz-etiqueta--info">${escapar(it.sub)}</span>`}</span></button></li>`).join("")}</ul>`
          : `<p class="rz-texto-2">${bloq ? "" : diaSel < hoje ? "Nada marcado neste dia." : "Nada marcado ainda."}</p>`}
        ${livres.length ? `<ul class="rz-livres">${livres.map(h => `<li><b>${escapar(horaDoTexto(h))}</b><span>Horário livre${temAgendaOnline ? ": aparece na agenda online" : ""}</span>${edita ? `<button class="rz-botao rz-botao--pequeno" type="button" data-marcar-hora="${h}">Marcar</button>` : ""}</li>`).join("")}</ul>` : ""}
        ${diaLivre && temAgendaOnline ? `<p class="rz-alerta rz-alerta--sucesso">${icone("estrela", { tamanho: 18 })}<span>Dia livre: já aparece na agenda online para o cliente pedir.</span></p>` : ""}
        ${edita && !bloq && diaSel >= hoje && !lista.some(i => i.tipo === "reserva" && i.situacao !== "cancelada") && !fotografia ? `<button class="rz-botao rz-botao--primario rz-botao--bloco" type="button" data-reservar-dia>${icone("adicionar", { tamanho: 18 })}Reservar este dia</button>` : ""}
      </section>`;
  }

  const nomeDe = id => (ctx.equipe.find(p => p.id === id) || {}).nome || "";
  const filtroAtivo = () => !!filtro.pessoa || filtro.escondidas.length > 0 || filtro.canceladas;

  function desenhar() {
    corpo.innerHTML = `
      <div class="rz-agenda-barra">
        <div class="rz-mes-nav"><button class="rz-botao rz-botao--fantasma rz-botao--pequeno" type="button" data-mes="-1" aria-label="Mês anterior">${icone("voltar", { tamanho: 18 })}</button>
          <b>${escapar(nomeDoMes(mes))}</b>
          <button class="rz-botao rz-botao--fantasma rz-botao--pequeno rz-girar" type="button" data-mes="1" aria-label="Próximo mês">${icone("voltar", { tamanho: 18 })}</button></div>
        <button class="rz-chip" type="button" data-hoje>Hoje</button>
        <div class="rz-segmentos rz-so-celular" role="group" aria-label="Ver"><button type="button" data-vista="semana" aria-pressed="${vistaCelular === "semana"}">Semana</button><button type="button" data-vista="mes" aria-pressed="${vistaCelular === "mes"}">Mês</button></div>
        <button class="rz-botao rz-botao--pequeno" type="button" data-filtrar aria-pressed="${filtroAtivo()}">${icone("filtro", { tamanho: 16 })}Filtrar${filtroAtivo() ? " ·" : ""}</button>
      </div>
      <div class="rz-agenda" data-vista="${vistaCelular}">
        <div class="rz-agenda-calendario">${semanaHtml()}${gradeHtml()}</div>
        ${painelDoDia()}
      </div>`;
  }

  // ---------- carregar ----------
  function intervalo() {
    const grade = gradeDoMes(mes);
    const sem = semana(diaSel);
    const de = [grade[0], sem[0]].sort()[0];
    const ate = somarDias([grade[grade.length - 1], sem[6]].sort()[1], 1);
    return { de, ate };
  }
  async function carregar() {
    const { de, ate } = intervalo();
    const deIso = instanteNoFuso(de, "00:00", fuso).toISOString();
    const ateIso = instanteNoFuso(ate, "00:00", fuso).toISOString();
    const primeiraVez = !dados.de;
    const [reservas, compromissos, bloqueios, fixos] = await Promise.all([
      banco.resultado(banco.tabela("reservas").select(COLUNAS_RESERVA).eq("conta_id", conta.conta_id).lt("inicio", ateIso).gt("fim", deIso).order("inicio")),
      banco.resultado(banco.tabela("compromissos").select(COLUNAS_COMPROMISSO).eq("conta_id", conta.conta_id).gte("inicio", deIso).lt("inicio", ateIso).order("inicio")),
      banco.resultado(banco.tabela("bloqueios").select("id, de, ate, motivo").eq("conta_id", conta.conta_id).lte("de", ate).gte("ate", de)),
      primeiraVez ? Promise.all([
        banco.resultado(banco.tabela("horarios").select("dia_semana, inicio, fim, nome, servico_id").eq("conta_id", conta.conta_id)).catch(() => []),
        fotografia ? banco.resultado(banco.tabela("campanhas").select("id, nome, dias, horarios, vagas, servico_id").eq("conta_id", conta.conta_id).eq("ativa", true)).catch(() => []) : [],
        banco.resultado(banco.tabela("pessoas").select("id, nome, cor").eq("conta_id", conta.conta_id).eq("ativa", true).order("nome")).catch(() => []),
      ]) : null,
    ]);
    const novo = { ...dados, reservas, compromissos, bloqueios, de, ate };
    if (fixos) { [novo.horarios, novo.campanhas, ctx.equipe] = fixos; }
    return novo;
  }
  const usar = novo => { dados = novo; desenhar(); };
  async function atualizar(novoDia) {
    if (novoDia && DIA.test(novoDia)) { diaSel = novoDia; mes = primeiroDoMes(novoDia); }
    try { usar(await carregar()); } catch (e) { avisar(e.message, { tipo: "erro" }); }
  }
  /** Muda o dia (e o mês, se precisar); carrega só se sair do que já está carregado. */
  function irPara(d) {
    diaSel = d;
    mes = primeiroDoMes(d);
    const { de, ate } = intervalo();
    if (de < dados.de || ate > dados.ate) return atualizar();
    desenhar();
  }

  async function abrirPorId(id) {
    let r = dados.reservas.find(x => x.id === id);
    if (!r) r = await banco.resultado(banco.tabela("reservas").select(COLUNAS_RESERVA).eq("id", id).maybeSingle()).catch(() => null);
    if (!r) return avisar("Essa reserva não está na sua agenda.", { tipo: "erro" });
    const d = dia(new Date(r.inicio), fuso);
    if (d !== diaSel) await atualizar(d);
    abrirReserva(r, ctx);
  }

  // ---------- o "Filtrar": quem cuida, o que mostrar (a legenda), canceladas ----------
  function abrirFiltro() {
    const todos = [...dados.reservas.map(r => itemDaReserva(r, fuso)), ...dados.compromissos.map(c => itemDoCompromisso(c, fuso))];
    const categorias = [];
    for (const it of todos) if (!categorias.some(c => c.id === it.categoria)) categorias.push({ id: it.categoria, nome: it.tipo === "compromisso" ? it.sub : (it.sub || "Sem tipo"), cor: it.cor, compromisso: it.tipo === "compromisso" });
    const folha = abrirFolha({
      titulo: "Filtrar",
      corpo: `<div class="rz-pilha">
          <fieldset class="rz-campo"><legend class="rz-rotulo">Quem cuida</legend>
            <div class="rz-chips rz-chips--quebra" role="group">
              <button class="rz-chip" type="button" data-pessoa="" aria-pressed="${!filtro.pessoa}">Toda a equipe</button>
              ${pessoa ? `<button class="rz-chip" type="button" data-pessoa="${escapar(pessoa.id)}" aria-pressed="${filtro.pessoa === pessoa.id}">Só o meu</button>` : ""}
              ${ctx.equipe.filter(p => !pessoa || p.id !== pessoa.id).map(p => `<button class="rz-chip" type="button" data-pessoa="${escapar(p.id)}" aria-pressed="${filtro.pessoa === p.id}">${escapar(p.nome)}</button>`).join("")}
            </div></fieldset>
          ${categorias.length ? `<fieldset class="rz-campo"><legend class="rz-rotulo">O que mostrar</legend>
            <div class="rz-chips rz-chips--quebra" role="group">${categorias.map(c => `<button class="rz-chip" type="button" data-categoria="${escapar(c.id)}" aria-pressed="${!filtro.escondidas.includes(c.id)}"><span class="rz-cor${c.compromisso ? " rz-ponto-compromisso" : ""}"${c.cor ? ` style="--cor:${escapar(c.cor)}"` : ""}></span>${escapar(c.nome)}</button>`).join("")}</div></fieldset>` : ""}
          ${interruptor({ nome: "canceladas", rotulo: "Mostrar as canceladas", marcado: filtro.canceladas })}
        </div>`,
      rodape: `<button class="rz-botao" type="button" data-limpar>Limpar</button><button class="rz-botao rz-botao--primario" type="button" data-fechar>Ver a agenda</button>`,
      aoFechar: () => desenhar(),
    });
    folha.el.addEventListener("click", e => {
      const p = e.target.closest("[data-pessoa]");
      if (p) {
        filtro.pessoa = p.dataset.pessoa || null;
        folha.el.querySelectorAll("[data-pessoa]").forEach(b => b.setAttribute("aria-pressed", String(b === p)));
      }
      const c = e.target.closest("[data-categoria]");
      if (c) {
        const id = c.dataset.categoria;
        filtro.escondidas = filtro.escondidas.includes(id) ? filtro.escondidas.filter(x => x !== id) : [...filtro.escondidas, id];
        c.setAttribute("aria-pressed", String(!filtro.escondidas.includes(id)));
      }
      if (e.target.closest("[data-limpar]")) {
        filtro.pessoa = null; filtro.escondidas = []; filtro.canceladas = false;
        folha.fechar();
      }
    });
    folha.el.querySelector("[name=canceladas]").addEventListener("change", e => { filtro.canceladas = e.target.checked; });
  }

  // ---------- eventos ----------
  el.addEventListener("click", async e => {
    const alvo = e.target;
    if (alvo.closest("[data-reservar]")) return abrirFormReserva(ctx, { dia: diaSel >= hoje ? diaSel : "" });
    if (alvo.closest("[data-reservar-dia]")) return abrirFormReserva(ctx, { dia: diaSel });
    if (alvo.closest("[data-compromisso]")) return abrirFormCompromisso(ctx, { dia: diaSel >= hoje ? diaSel : "", tipo: fotografia ? "reuniao" : "visita" });
    const hora = alvo.closest("[data-marcar-hora]");
    if (hora) return abrirFormReserva(ctx, { dia: diaSel, hora: hora.dataset.marcarHora, campanha: dados.campanhas.find(c => (c.dias || []).includes(diaSel)) || null });
    if (alvo.closest("[data-filtrar]")) return abrirFiltro();
    if (alvo.closest("[data-hoje]")) { mes = primeiroDoMes(hoje); return irPara(hoje); }
    const m = alvo.closest("[data-mes]");
    if (m) { mes = somarMeses(mes, Number(m.dataset.mes)); const d = mes.slice(0, 7) === hoje.slice(0, 7) ? hoje : mes; diaSel = d; return atualizar(); }
    const s = alvo.closest("[data-semana]");
    if (s) { const d = somarDias(diaSel, Number(s.dataset.semana)); mes = primeiroDoMes(d); return irPara(d); }
    const v = alvo.closest("button[data-vista]");
    if (v && corpo.contains(v)) { vistaCelular = v.dataset.vista; return desenhar(); }
    const d = alvo.closest("[data-dia]");
    if (d) {
      irPara(d.dataset.dia);
      corpo.querySelector(".rz-painel-dia")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    const it = alvo.closest("[data-item]");
    if (it) {
      const [tipo, id] = it.dataset.item.split(":");
      if (tipo === "reserva") { const r = dados.reservas.find(x => x.id === id); if (r) abrirReserva(r, ctx); }
      else { const c = dados.compromissos.find(x => x.id === id); if (c) abrirCompromisso(c, ctx); }
    }
  });

  await comEstados(corpo, { carregar, desenhar: usar, linhas: 6 });

  // ?reserva=<id> (do Atendimento), ?novo=reserva|visita (o "+"), ?dia=aaaa-mm-dd
  if (params.has("reserva") || params.has("novo") || params.has("dia")) history.replaceState(history.state, "", location.pathname);
  if (params.get("reserva")) abrirPorId(params.get("reserva"));
  else if (params.get("novo") === "reserva" && edita) abrirFormReserva(ctx, { dia: diaSel });
  else if (params.get("novo") === "visita" && marca) abrirFormCompromisso(ctx, { dia: diaSel, tipo: fotografia ? "reuniao" : "visita" });
}

