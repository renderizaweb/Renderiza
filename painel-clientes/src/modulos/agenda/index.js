// Módulo Agenda (Missão 3, bloco B): a agenda da equipe (eventos) ou do estúdio (fotografia). Referência: os exemplos
// e o 09 ("Agenda (celular)"). Desde a Missão 7 (bloco A), como o exemplo: abre no mês também no celular, com a lista
// do dia embaixo, e a legenda das cores à vista; a equipe e o esconder tipos ficam no "Filtrar"; tocar num dia vazio
// oferece "Reservar este dia". No computador, o mês e o painel do dia, lado a lado.
// A reserva mora em reserva.js; os compromissos, em compromisso.js; as campanhas (fotografia), em campanhas.js; as
// regras sem tela, em logica.js. Quem só vê não tem botões (o banco também não deixa).
// O que é horário ou turno segue o jeito da agenda da conta (Configurações; 18/11/2026), não o nicho: por horário, os
// horários livres do dia, a semana de horários, a jornada e as campanhas; por turno, os turnos do dia e "Reservar este
// dia". As palavras (ensaio, festa, reunião, visita) seguem o nicho.

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { abrirFolha, abrirGaveta } from "../../ui/gaveta.js";
import { comEstados } from "../../ui/estados.js";
import { interruptor, campoTexto, campoSelecao } from "../../ui/campos.js";
import { dia, dataLonga, somarDias, instanteNoFuso, horaDoTexto, nomeCurto } from "../../ui/formatos.js";
import {
  DIAS_DA_SEMANA, gradeDoMes, semana, primeiroDoMes, somarMeses, nomeDoMes, itemDaReserva, itemDoCompromisso,
  itensDoDia, filtrarItens, bloqueioDoDia, horariosDoDia, horariosLivres, faixa, quandoFoi, seguraHorario,
  fechadosDoDia, horariosDoDiaComSituacao, gerarHorarios, jornadaDaSemana, conflitos, fimDoTurno,
} from "./logica.js";
import { COLUNAS_RESERVA, etiquetaDaSituacao, abrirReserva, abrirFormReserva } from "./reserva.js";
import { modoDaAgenda } from "../../nichos/index.js";
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
  const porHorario = modoDaAgenda(conta, nicho) === "horario";
  const comCampanhas = nicho.temCampanhas && porHorario;
  const temAgendaOnline = (conta.modulos || []).includes("agenda-online");
  const aba = comCampanhas && params.get("aba") === "campanhas" ? "campanhas" : "agenda";
  let diaSel = DIA.test(params.get("dia") || "") ? params.get("dia") : hoje;
  let mes = primeiroDoMes(diaSel);
  let vistaCelular = "mes"; // como o exemplo validado (cara-dos-exemplos.md, A1): o mês, com o dia embaixo
  // fotografia: "mes" ou "horarios" (a semana com cada horário e a situação dele; 17/11/2026), no celular e no computador
  let vista = "mes";
  const mexeNosHorarios = porHorario && pode("servicos", "editar"); // a regra do banco: os horários são de Serviços
  const duracao = nicho.horarioPadrao.duracao;
  const filtro = { pessoa: null, escondidas: [], canceladas: false };
  let dados = { reservas: [], compromissos: [], bloqueios: [], horarios: [], campanhas: [], de: "", ate: "" };
  const ctx = { banco, conta, nicho, pode, avisar, navegar, pessoa, fuso, hoje, equipe: [], aoMudar: () => desenhar(), recarregar: d => atualizar(d), abrirReservaPorId: id => abrirPorId(id), origemDoPedido: () => null };
  const nomeDoModulo = (nicho.modulos.agenda && nicho.modulos.agenda.nomeLongo) || "Agenda";

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">${escapar(nomeDoModulo)}</h1>
        <p class="rz-texto-2">${porHorario ? "Os ensaios por horário. Em \"Semana\", cada horário com a situação dele: livre, marcado ou fechado." : fotografia ? "Os trabalhos por dia e turno. Toque num dia para ver os turnos e reservar." : "Festas, visitas, degustações e reuniões. Toque num dia ou numa festa."}</p></div>
      <div class="rz-cabeca-acoes">
        ${mexeNosHorarios ? `<button class="rz-botao" type="button" data-jornada>${icone("relogio", { tamanho: 18 })}Meus horários de trabalho</button>` : ""}
        ${marca ? `<button class="rz-botao" type="button" data-compromisso>${icone("relogio", { tamanho: 18 })}${fotografia ? "Marcar reunião" : "Marcar visita"}</button>` : ""}
        ${edita ? `<button class="rz-botao rz-botao--primario" type="button" data-reservar>${icone("adicionar", { tamanho: 18 })}${escapar(nicho.palavras.novaReserva)}</button>` : ""}
      </div>
    </header>
    ${comCampanhas ? `<nav class="rz-abas" aria-label="Partes da agenda"><a href="/agenda"${aba === "agenda" ? ' aria-current="page"' : ""}>Agenda</a><a href="/agenda?aba=campanhas"${aba === "campanhas" ? ' aria-current="page"' : ""}>Campanhas</a></nav>` : ""}
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

  const chipDoItem = it => `<span class="rz-dia-item${it.situacao === "pre_reserva" ? " rz-dia-item--pre" : ""}${it.tipo === "compromisso" ? " rz-dia-item--compromisso" : ""}"${it.cor ? ` style="--cor:${escapar(it.cor)}"` : ""}><time>${escapar(it.ini)}</time>${escapar(nomeCurto(it.titulo))}</span>`;
  const pontos = lista => `<span class="rz-dia-pontos" aria-hidden="true">${lista.slice(0, 4).map(it => `<i class="${it.tipo === "compromisso" ? "rz-ponto-compromisso" : ""}"${it.cor ? ` style="--cor:${escapar(it.cor)}"` : ""}></i>`).join("")}</span>`;
  const rotuloDoDia = (d, lista, bloq) => `${dataLonga(instanteNoFuso(d, "12:00", fuso), fuso)}${bloq ? ", data fechada" : ""}${lista.length ? `, ${lista.length} ${lista.length === 1 ? "item" : "itens"}` : ""}`;

  function gradeHtml() {
    const todos = itens();
    return `<div class="rz-mes" role="grid" aria-label="${escapar(nomeDoMes(mes))}">
        <div class="rz-mes-semana" role="row">${DIAS_DA_SEMANA.map(d => `<span role="columnheader">${d}</span>`).join("")}</div>
        <div class="rz-mes-dias">${gradeDoMes(mes).map(d => {
          const lista = itensDoDia(todos, d);
          const bloq = bloqueioDoDia(dados.bloqueios, d);
          const extra = porHorario ? doMes(d, bloq) : null;
          const classes = ["rz-dia", d.slice(0, 7) !== mes.slice(0, 7) && "rz-dia--fora", d === hoje && "rz-dia--hoje", bloq && "rz-dia--fechado", extra && extra.semTrabalho && "rz-dia--sem-trabalho", extra && extra.campanha && "rz-dia--campanha"].filter(Boolean).join(" ");
          return `<button type="button" role="gridcell" class="${classes}" data-dia="${d}" aria-pressed="${d === diaSel}" aria-label="${escapar(rotuloDoDia(d, lista, bloq))}">
            <span class="rz-dia-n">${Number(d.slice(8))}</span>
            <span class="rz-dia-itens">${lista.slice(0, 3).map(chipDoItem).join("")}${lista.length > 3 ? `<span class="rz-dia-mais">+${lista.length - 3}</span>` : ""}</span>
            ${extra && extra.texto ? `<span class="rz-dia-livres${extra.livres ? "" : " rz-dia-livres--zero"}">${escapar(extra.texto)}</span>` : ""}
            ${pontos(lista)}</button>`;
        }).join("")}</div>
      </div>`;
  }

  /** Fotografia, no mês: quantos horários livres o dia tem (de hoje em diante), se não atende e se é dia de campanha. */
  function doMes(d, bloq) {
    const campanha = dados.campanhas.find(c => (c.dias || []).includes(d)) || null;
    if (bloq) return { campanha, texto: "Folga" };
    if (d < hoje) return { campanha };
    const lista = horariosDoDiaComSituacao({ d, horarios: dados.horarios, campanha, reservas: dados.reservas, bloqueios: dados.bloqueios, duracao, fuso });
    if (!lista.length) return { campanha, semTrabalho: true };
    const livres = lista.filter(x => x.situacao === "livre").length;
    return { campanha, livres, texto: livres ? `${livres} ${livres === 1 ? "livre" : "livres"}` : "Cheio" };
  }

  const rotuloDoHorario = x => x.situacao === "livre" ? (temAgendaOnline ? "Livre · no site" : "Livre")
    : x.situacao === "fechado" ? `Fechado${x.bloqueio.motivo ? ` · ${x.bloqueio.motivo}` : ""}`
    : x.reserva ? `${x.situacao === "pedido" ? "Pedido · " : ""}${nomeCurto((x.reserva.clientes && x.reserva.clientes.nome) || itemDaReserva(x.reserva, fuso).titulo)}` : "Passou";

  /** Fotografia: a semana de horários, um dia por coluna (no celular, um embaixo do outro). */
  function horariosDaSemanaHtml() {
    const dias = semana(diaSel);
    const mesDe = d => nomeDoMes(primeiroDoMes(d)).split(" ")[0].toLowerCase();
    const titulo = `${Number(dias[0].slice(8))} de ${mesDe(dias[0])} a ${Number(dias[6].slice(8))} de ${mesDe(dias[6])}`;
    return `<div class="rz-agenda-barra">
        <div class="rz-mes-nav"><button class="rz-botao rz-botao--fantasma rz-botao--pequeno" type="button" data-semana="-7" aria-label="Semana anterior">${icone("voltar", { tamanho: 18 })}</button>
          <b>${escapar(titulo)}</b>
          <button class="rz-botao rz-botao--fantasma rz-botao--pequeno rz-girar" type="button" data-semana="7" aria-label="Próxima semana">${icone("voltar", { tamanho: 18 })}</button></div>
        <button class="rz-chip" type="button" data-hoje>Hoje</button>${seletorDeVista()}
      </div>
      <ul class="rz-hs-legenda" aria-label="O que cada cor quer dizer"><li data-situacao="livre">Livre${temAgendaOnline ? " (aparece no site)" : ""}</li><li data-situacao="pedido">Pedido esperando</li><li data-situacao="marcado">Marcado</li><li data-situacao="fechado">Fechado</li></ul>
      <div class="rz-hs">${dias.map(d => {
        const campanha = dados.campanhas.find(c => (c.dias || []).includes(d)) || null;
        const bloq = bloqueioDoDia(dados.bloqueios, d);
        const lista = horariosDoDiaComSituacao({ d, horarios: dados.horarios, campanha, reservas: dados.reservas, bloqueios: dados.bloqueios, duracao, fuso });
        const livres = lista.filter(x => x.situacao === "livre").length;
        const resumo = bloq ? `Folga${bloq.motivo && bloq.motivo !== "Folga" ? ` · ${bloq.motivo}` : ""}` : !lista.length ? "Não atende" : d < hoje ? "" : livres ? `${livres} ${livres === 1 ? "livre" : "livres"}` : "Cheio";
        return `<section class="rz-hs-dia${d === hoje ? " rz-hs-dia--hoje" : ""}${bloq ? " rz-hs-dia--folga" : ""}" aria-label="${escapar(dataLonga(instanteNoFuso(d, "12:00", fuso), fuso))}">
          <header><b>${DIAS_DA_SEMANA[new Date(d + "T12:00:00Z").getUTCDay()]} ${Number(d.slice(8))}</b><small>${escapar(resumo)}${campanha ? ` · ${escapar(campanha.nome)}` : ""}</small></header>
          ${lista.length ? `<ul>${lista.map(x => `<li><button type="button" class="rz-hs-slot" data-slot="${d}|${x.hora}" data-situacao="${x.situacao}"${x.situacao === "passou" || (!edita && !x.reserva) ? " disabled" : ""}>
            <b>${escapar(horaDoTexto(x.hora))}</b><span>${escapar(rotuloDoHorario(x))}</span></button></li>`).join("")}</ul>` : ""}
          ${edita && d >= hoje ? (bloq ? `<button class="rz-link" type="button" data-reabrir="${escapar(bloq.id)}">Reabrir o dia</button>` : lista.length ? `<button class="rz-link" type="button" data-fechar-dia="${d}">Fechar o dia</button>` : "") : ""}
        </section>`;
      }).join("")}</div>`;
  }

  const seletorDeVista = () => porHorario ? `<div class="rz-segmentos" role="group" aria-label="Ver"><button type="button" data-ver="mes" aria-pressed="${vista === "mes"}">Mês</button><button type="button" data-ver="horarios" aria-pressed="${vista === "horarios"}">Semana</button></div>` : "";

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
    if (porHorario && diaSel >= hoje) {
      const campanha = dados.campanhas.find(c => (c.dias || []).includes(diaSel)) || null;
      livres = horariosLivres({ d: diaSel, horarios: dados.horarios, campanha, reservas: dados.reservas, bloqueios: dados.bloqueios, duracao: nicho.horarioPadrao.duracao, fuso });
    }
    const turnos = !porHorario ? horariosDoDia(dados.horarios, diaSel) : [];
    // fotografia por turno (18/11/2026): cada turno do dia, livre ou ocupado, com "Marcar" (os eventos seguem como eram)
    const turnosDoDia = !porHorario && fotografia && diaSel >= hoje && !bloq ? turnos.filter(t => t.fim).map(t => {
      const f = fimDoTurno(diaSel, t.inicio, t.fim);
      const comeca = instanteNoFuso(diaSel, t.inicio.slice(0, 5), fuso), termina = instanteNoFuso(f.dia, f.hora, fuso);
      const ocupado = conflitos(dados.reservas, { inicio: comeca.toISOString(), fim: termina.toISOString() }).length > 0;
      return { nome: t.nome || "Turno", ini: t.inicio.slice(0, 5), fim: t.fim.slice(0, 5), ocupado, passou: comeca.getTime() <= Date.now() };
    }) : [];
    const diaLivre = !porHorario && !turnosDoDia.length && diaSel >= hoje && !bloq && !reservasDoDia.length && turnos.length;
    const campanhaDoDia = comCampanhas ? dados.campanhas.find(c => (c.dias || []).includes(diaSel)) : null;
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
        ${livres.length ? `<ul class="rz-livres">${livres.map(h => `<li><b>${escapar(horaDoTexto(h))}</b><span>Horário livre${temAgendaOnline ? ": aparece na agenda online" : ""}</span>${edita ? `<span class="rz-livres-acoes"><button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-fechar-hora="${diaSel}|${h}">Fechar</button><button class="rz-botao rz-botao--pequeno" type="button" data-marcar-hora="${h}">Marcar</button></span>` : ""}</li>`).join("")}</ul>` : ""}
        ${turnosDoDia.length ? `<ul class="rz-livres">${turnosDoDia.map(t => `<li${t.ocupado || t.passou ? ' class="rz-livres-ocupado"' : ""}><b>${escapar(t.nome)}</b><span>${escapar(horaDoTexto(t.ini))} às ${escapar(horaDoTexto(t.fim))} · ${t.ocupado ? "Ocupado" : t.passou ? "Já passou" : temAgendaOnline ? "Livre · no site" : "Livre"}</span>${edita && !t.ocupado && !t.passou ? `<span class="rz-livres-acoes"><button class="rz-botao rz-botao--pequeno" type="button" data-marcar-turno="${t.ini}-${t.fim}">Marcar</button></span>` : ""}</li>`).join("")}</ul>` : ""}
        ${porHorario && fechadosDoDia(dados.bloqueios, diaSel).length ? `<ul class="rz-livres rz-livres--fechados">${fechadosDoDia(dados.bloqueios, diaSel).map(b => `<li><b>${escapar(horaDoTexto(b.inicio.slice(0, 5)))}</b><span>Fechado${b.motivo ? `: ${escapar(b.motivo)}` : ""}</span>${edita && diaSel >= hoje ? `<button class="rz-botao rz-botao--pequeno" type="button" data-reabrir="${escapar(b.id)}">Reabrir</button>` : ""}</li>`).join("")}</ul>` : ""}
        ${fotografia && edita && diaSel >= hoje ? (bloq ? `<button class="rz-botao rz-botao--bloco" type="button" data-reabrir="${escapar(bloq.id)}">Reabrir este dia</button>` : `<button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-fechar-dia="${diaSel}">${icone("cadeado", { tamanho: 18 })}Fechar este dia (folga)</button>`) : ""}
        ${diaLivre && temAgendaOnline ? `<p class="rz-alerta rz-alerta--sucesso">${icone("estrela", { tamanho: 18 })}<span>Dia livre: já aparece na agenda online para o cliente pedir.</span></p>` : ""}
        ${edita && !bloq && diaSel >= hoje && !lista.some(i => i.tipo === "reserva" && i.situacao !== "cancelada") && !porHorario && !turnosDoDia.length ? `<button class="rz-botao rz-botao--primario rz-botao--bloco" type="button" data-reservar-dia>${icone("adicionar", { tamanho: 18 })}Reservar este dia</button>` : ""}
      </section>`;
  }

  const nomeDe = id => (ctx.equipe.find(p => p.id === id) || {}).nome || "";
  const filtroAtivo = () => !!filtro.pessoa || filtro.escondidas.length > 0 || filtro.canceladas;

  /** Os tipos do que está carregado (a legenda e o "O que mostrar" do Filtrar), na ordem em que aparecem. */
  function categorias() {
    const todos = [...dados.reservas.filter(r => filtro.canceladas || r.situacao !== "cancelada").map(r => itemDaReserva(r, fuso)), ...dados.compromissos.map(c => itemDoCompromisso(c, fuso))];
    const lista = [];
    for (const it of todos) if (!lista.some(c => c.id === it.categoria)) lista.push({ id: it.categoria, nome: it.tipo === "compromisso" ? it.sub : (it.sub || "Sem tipo"), cor: it.cor, compromisso: it.tipo === "compromisso" });
    return lista;
  }
  const corDe = c => `<span class="rz-cor${c.compromisso ? " rz-ponto-compromisso" : ""}"${c.cor ? ` style="--cor:${escapar(c.cor)}"` : ""}></span>`;

  function desenhar() {
    if (porHorario && vista === "horarios") { corpo.innerHTML = horariosDaSemanaHtml(); return; }
    const legenda = categorias();
    corpo.innerHTML = `
      <div class="rz-agenda-barra">
        <div class="rz-mes-nav"><button class="rz-botao rz-botao--fantasma rz-botao--pequeno" type="button" data-mes="-1" aria-label="Mês anterior">${icone("voltar", { tamanho: 18 })}</button>
          <b>${escapar(nomeDoMes(mes))}</b>
          <button class="rz-botao rz-botao--fantasma rz-botao--pequeno rz-girar" type="button" data-mes="1" aria-label="Próximo mês">${icone("voltar", { tamanho: 18 })}</button></div>
        <button class="rz-chip" type="button" data-hoje>Hoje</button>
        ${seletorDeVista()}${porHorario ? "" : `<div class="rz-segmentos rz-so-celular" role="group" aria-label="Ver"><button type="button" data-vista="semana" aria-pressed="${vistaCelular === "semana"}">Semana</button><button type="button" data-vista="mes" aria-pressed="${vistaCelular === "mes"}">Mês</button></div>`}
        <button class="rz-botao rz-botao--pequeno" type="button" data-filtrar aria-pressed="${filtroAtivo()}">${icone("filtro", { tamanho: 16 })}Filtrar${filtroAtivo() ? " ·" : ""}</button>
      </div>
      ${legenda.length ? `<ul class="rz-legenda" aria-label="O que cada cor quer dizer">${legenda.map(c => `<li${filtro.escondidas.includes(c.id) ? ' data-escondida="true"' : ""}>${corDe(c)}${escapar(c.nome)}</li>`).join("")}</ul>` : ""}
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
      banco.resultado(banco.tabela("bloqueios").select("id, de, ate, inicio, fim, motivo").eq("conta_id", conta.conta_id).lte("de", ate).gte("ate", de)),
      primeiraVez ? Promise.all([
        banco.resultado(banco.tabela("horarios").select("dia_semana, inicio, fim, nome, servico_id").eq("conta_id", conta.conta_id)).catch(() => []),
        comCampanhas ? banco.resultado(banco.tabela("campanhas").select("id, nome, dias, horarios, vagas, servico_id").eq("conta_id", conta.conta_id).eq("ativa", true)).catch(() => []) : [],
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
    const tipos = categorias();
    const folha = abrirFolha({
      titulo: "Filtrar",
      corpo: `<div class="rz-pilha">
          <fieldset class="rz-campo"><legend class="rz-rotulo">Quem cuida</legend>
            <div class="rz-chips rz-chips--quebra" role="group">
              <button class="rz-chip" type="button" data-pessoa="" aria-pressed="${!filtro.pessoa}">Toda a equipe</button>
              ${pessoa ? `<button class="rz-chip" type="button" data-pessoa="${escapar(pessoa.id)}" aria-pressed="${filtro.pessoa === pessoa.id}">Só o meu</button>` : ""}
              ${ctx.equipe.filter(p => !pessoa || p.id !== pessoa.id).map(p => `<button class="rz-chip" type="button" data-pessoa="${escapar(p.id)}" aria-pressed="${filtro.pessoa === p.id}">${escapar(p.nome)}</button>`).join("")}
            </div></fieldset>
          ${tipos.length ? `<fieldset class="rz-campo"><legend class="rz-rotulo">O que mostrar</legend>
            <div class="rz-chips rz-chips--quebra" role="group">${tipos.map(c => `<button class="rz-chip" type="button" data-categoria="${escapar(c.id)}" aria-pressed="${!filtro.escondidas.includes(c.id)}">${corDe(c)}${escapar(c.nome)}</button>`).join("")}</div></fieldset>` : ""}
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

  // ---------- fechar e reabrir (folga do dia ou de um horário) e a semana de trabalho ----------
  async function gravar(acao, mensagem) {
    try { await acao(); avisar(mensagem); await atualizar(); } catch (er) { avisar(er.message, { tipo: "erro" }); }
  }
  const somar = (h, min) => { const m = Math.min(24 * 60 - 1, Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5)) + min); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
  const fecharHorario = (d, h, motivo = "") => gravar(() => banco.resultado(banco.tabela("bloqueios").insert({ conta_id: conta.conta_id, de: d, ate: d, inicio: h, fim: somar(h, duracao), motivo: motivo || null })),
    `${horaDoTexto(h)} fechado: não aparece mais no site.`);
  const fecharDia = d => gravar(() => banco.resultado(banco.tabela("bloqueios").insert({ conta_id: conta.conta_id, de: d, ate: d, motivo: "Folga" })), "Dia fechado: o site não oferece horário nele.");
  const reabrir = id => gravar(() => banco.resultado(banco.tabela("bloqueios").delete().eq("id", id)), "Reaberto: volta a aparecer no site.");

  /** Tocar num horário da semana: o livre marca ou fecha; o fechado reabre; o marcado abre o ensaio. */
  function tocarHorario(d, h) {
    const campanha = dados.campanhas.find(c => (c.dias || []).includes(d)) || null;
    const x = horariosDoDiaComSituacao({ d, horarios: dados.horarios, campanha, reservas: dados.reservas, bloqueios: dados.bloqueios, duracao, fuso }).find(y => y.hora === h);
    if (!x) return;
    if (x.reserva) return abrirReserva(x.reserva, ctx);
    if (!edita) return;
    const quando = `${dataLonga(instanteNoFuso(d, "12:00", fuso), fuso)}, ${horaDoTexto(h)}`;
    if (x.situacao === "fechado") {
      const f = abrirFolha({ titulo: quando, corpo: `<p class="rz-texto-2">Este horário está fechado${x.bloqueio.motivo ? ` (${escapar(x.bloqueio.motivo)})` : ""}: o site não oferece.</p>`,
        rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="button" data-sim>Reabrir este horário</button>` });
      f.el.querySelector("[data-sim]").addEventListener("click", () => { f.fechar(); reabrir(x.bloqueio.id); });
      return;
    }
    const f = abrirFolha({ titulo: quando, corpo: `<p class="rz-texto-2">Horário livre${temAgendaOnline ? ": aparece no site para pedirem" : ""}.</p>
        ${campoTexto({ id: "fechar-motivo", nome: "motivo", rotulo: "Se for fechar, o motivo (só você vê)", opcional: true, placeholder: "Ex.: médico, compromisso", extra: { maxlength: 200 } })}`,
      rodape: `<button class="rz-botao" type="button" data-fechar-este>Fechar este horário</button><button class="rz-botao rz-botao--primario" type="button" data-marcar-este>Marcar um ensaio</button>` });
    f.el.querySelector("[data-marcar-este]").addEventListener("click", () => { f.fechar(); abrirFormReserva(ctx, { dia: d, hora: h, campanha }); });
    f.el.querySelector("[data-fechar-este]").addEventListener("click", () => { const m = f.el.querySelector("[name=motivo]").value.trim(); f.fechar(); fecharHorario(d, h, m); });
  }

  /** Meus horários de trabalho: por dia da semana, liga e desliga, o primeiro e o último horário e de quanto em quanto. */
  function abrirJornada() {
    const j = jornadaDaSemana(dados.horarios);
    const NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const CADA = [30, 45, 60, 90, 120].map(m => ({ valor: String(m), rotulo: m < 60 ? `${m} minutos` : m === 60 ? "1 hora" : m === 90 ? "1 hora e meia" : "2 horas" }));
    const linha = ds => `<fieldset class="rz-jornada-dia" data-ds="${ds}">
        ${interruptor({ nome: `l-${ds}`, rotulo: NOMES[ds], marcado: j[ds].ligado })}
        <div class="rz-campos--tres rz-jornada-horas"${j[ds].ligado ? "" : " hidden"}>
          ${campoTexto({ id: `p-${ds}`, nome: `p-${ds}`, rotulo: "Primeiro horário", tipo: "time", valor: j[ds].primeiro })}
          ${campoTexto({ id: `u-${ds}`, nome: `u-${ds}`, rotulo: "Último horário", tipo: "time", valor: j[ds].ultimo })}
          ${campoSelecao({ id: `c-${ds}`, nome: `c-${ds}`, rotulo: "A cada", valor: String(CADA.some(c => c.valor === String(j[ds].cada)) ? j[ds].cada : 60), opcoes: CADA })}
        </div><p class="rz-ajuda" data-conta></p></fieldset>`;
    const g = abrirGaveta({
      titulo: "Meus horários de trabalho",
      subtitulo: "Os horários em que começa um ensaio. O site e a agenda online oferecem só estes (menos os marcados e os fechados).",
      corpo: `<form class="rz-pilha" id="form-jornada" novalidate><div role="alert" hidden></div>${[1, 2, 3, 4, 5, 6, 0].map(linha).join("")}
        <p class="rz-texto-3">Ensaio com horário próprio (em Serviços) continua com os dele. Para um dia só (feriado, viagem), use "Fechar o dia" na Agenda.</p></form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-jornada">Salvar os horários</button>`,
    });
    const form = g.corpo.querySelector("form");
    const ler = ds => ({ ligado: form[`l-${ds}`].checked, primeiro: form[`p-${ds}`].value, ultimo: form[`u-${ds}`].value, cada: Number(form[`c-${ds}`].value) });
    const contar = () => form.querySelectorAll("[data-ds]").forEach(fs => {
      const ds = Number(fs.dataset.ds), x = ler(ds), hs = x.ligado ? gerarHorarios(x) : [];
      fs.querySelector(".rz-jornada-horas").hidden = !x.ligado;
      fs.querySelector("[data-conta]").textContent = !x.ligado ? "Não atende." : hs.length ? `${hs.length} ${hs.length === 1 ? "horário" : "horários"}: ${hs.map(h => horaDoTexto(h)).join(", ")}` : "Confira: o último horário vem antes do primeiro.";
    });
    form.addEventListener("input", contar); form.addEventListener("change", contar); contar();
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const linhas = [];
      for (const ds of [0, 1, 2, 3, 4, 5, 6]) { const x = ler(ds); if (x.ligado) for (const h of gerarHorarios(x)) linhas.push({ conta_id: conta.conta_id, servico_id: null, dia_semana: ds, inicio: h }); }
      const botao = g.pe.querySelector("[type=submit]");
      botao.disabled = true;
      try {
        await banco.resultado(banco.tabela("horarios").delete().eq("conta_id", conta.conta_id).is("servico_id", null));
        if (linhas.length) await banco.resultado(banco.tabela("horarios").insert(linhas));
        g.fechar();
        dados = { ...dados, de: "" }; // recarrega os horários
        await atualizar();
        avisar("Horários salvos: o site já oferece os novos.");
      } catch (er) { botao.disabled = false; avisar(er.message, { tipo: "erro" }); }
    });
  }

  // ---------- eventos ----------
  el.addEventListener("click", async e => {
    const alvo = e.target;
    if (alvo.closest("[data-jornada]")) return abrirJornada();
    const ver = alvo.closest("[data-ver]");
    if (ver) { vista = ver.dataset.ver; return desenhar(); }
    const slot = alvo.closest("[data-slot]");
    if (slot) { const [d, h] = slot.dataset.slot.split("|"); return tocarHorario(d, h); }
    const fh = alvo.closest("[data-fechar-hora]");
    if (fh) { const [d, h] = fh.dataset.fecharHora.split("|"); return fecharHorario(d, h); }
    const fd = alvo.closest("[data-fechar-dia]");
    if (fd) return fecharDia(fd.dataset.fecharDia);
    const ra = alvo.closest("[data-reabrir]");
    if (ra) return reabrir(ra.dataset.reabrir);
    if (alvo.closest("[data-reservar]")) return abrirFormReserva(ctx, { dia: diaSel >= hoje ? diaSel : "" });
    if (alvo.closest("[data-reservar-dia]")) return abrirFormReserva(ctx, { dia: diaSel });
    const turno = alvo.closest("[data-marcar-turno]");
    if (turno) { const [ini, fim] = turno.dataset.marcarTurno.split("-"); return abrirFormReserva(ctx, { dia: diaSel, hora: ini, fim }); }
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

