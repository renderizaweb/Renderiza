// Agenda (Missão 3, bloco B): a reserva (a festa ou o ensaio). A gaveta (exemplo de eventos: resumo, checklist), a
// situação (confirmar, realizada, cancelar, com desfazer) e o formulário de reservar e editar, que avisa do conflito
// de horário antes de gravar (a mesma regra da agenda online). Valores ficam no Financeiro (05): aqui não aparecem.
// `ctx`: { banco, conta, nicho, pode, avisar, navegar, pessoa, equipe, fuso, hoje, aoMudar, recarregar }.

import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { abrirParaQuem, abrirCliente } from "../../ui/para-quem.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { campoTexto, campoArea, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { dataLonga, dataCurta, instanteNoFuso, linkWhatsapp, normalizarWhatsapp, dia, hora, horaDoTexto } from "../../ui/formatos.js";
import { SITUACOES, itemDaReserva, faixa, quandoFoi, conflitos, bloqueioDoDia, horariosDoDia, linhaDaReserva } from "./logica.js";

export const COLUNAS_RESERVA = "id, cliente_id, pedido_id, servico_id, tipo_id, campanha_id, titulo, inicio, fim, convidados, situacao, responsavel_id, producao_id, observacoes, criado_em, "
  + "clientes(id, nome, whatsapp, email, instagram), tipos_reserva(nome, cor), servicos(nome, cor, duracao_min), campanhas(nome)";

export const etiquetaDaSituacao = s => (SITUACOES[s] ? `<span class="rz-etiqueta${SITUACOES[s].tom ? ` rz-etiqueta--${SITUACOES[s].tom}` : ""}">${escapar(SITUACOES[s].nome)}</span>` : "");
const nomeDaPessoa = (equipe, id) => (equipe.find(p => p.id === id) || {}).nome || "";
const aReserva = nicho => nicho.palavras.aReserva; // "a festa", "o ensaio"

/** Muda a situação na hora, com desfazer (09). */
async function mudarSituacao(r, situacao, ctx, texto) {
  const { banco, avisar } = ctx;
  const antes = r.situacao;
  const gravar = s => banco.resultado(banco.tabela("reservas").update({ situacao: s }).eq("id", r.id));
  r.situacao = situacao;
  ctx.aoMudar();
  try {
    await gravar(situacao);
    avisar(texto, { desfazer: async () => { r.situacao = antes; ctx.aoMudar(); try { await gravar(antes); } catch (e) { avisar(e.message, { tipo: "erro" }); ctx.recarregar(); } } });
  } catch (e) {
    r.situacao = antes;
    ctx.aoMudar();
    avisar(e.message, { tipo: "erro" });
  }
}

/** A gaveta da reserva. `aba`: "resumo" ou "checklist". */
export function abrirReserva(r, ctx, { aba = "resumo" } = {}) {
  const { nicho, pode, navegar, equipe, fuso, hoje, banco, conta } = ctx;
  const edita = pode("agenda", "editar");
  const it = itemDaReserva(r, fuso);
  const eventos = nicho.id === "eventos";
  const passou = it.dia < hoje;
  const numero = normalizarWhatsapp(r.clientes && r.clientes.whatsapp);
  const primeiro = String((r.clientes && r.clientes.nome) || "").trim().split(/\s+/)[0];
  const mensagem = `Oi${primeiro ? `, ${primeiro}` : ""}! Passando sobre ${aReserva(nicho)} de ${dataCurta(new Date(r.inicio), fuso)}, ${faixa(it)}. Qualquer coisa, é só me chamar por aqui.`;
  const verChecklist = pode("agenda", "ver") || pode("clientes", "ver");

  const j = abrirGaveta({
    foco: "fechar",
    titulo: it.titulo,
    subtitulo: escapar(`${dataLonga(new Date(r.inicio), fuso)} · ${quandoFoi(it.dia, hoje)}`),
    corpo: `
      <div class="rz-pilha">
        <div class="rz-etiquetas">${etiquetaDaSituacao(r.situacao)}${it.sub ? `<span class="rz-etiqueta">${escapar(it.sub)}</span>` : ""}${r.campanhas ? `<span class="rz-etiqueta rz-etiqueta--info">${escapar(r.campanhas.nome)}</span>` : ""}</div>
        ${verChecklist ? `<div class="rz-abas" role="tablist"><button type="button" role="tab" data-aba="resumo" aria-selected="${aba === "resumo"}">Resumo</button><button type="button" role="tab" data-aba="checklist" aria-selected="${aba === "checklist"}">Checklist</button></div>` : ""}
        <div data-conteudo></div>
      </div>`,
    rodape: [
      numero ? `<a class="rz-botao" href="${escapar(linkWhatsapp(numero, mensagem))}" target="_blank" rel="noopener">${icone("whatsapp")}WhatsApp</a>` : "",
      edita ? `<button class="rz-botao" type="button" data-editar>${icone("editar")}Editar</button>` : "",
      edita && r.situacao === "pre_reserva" ? `<button class="rz-botao rz-botao--primario" type="button" data-situacao="confirmada">${icone("ok")}Confirmar</button>` : "",
      edita && r.situacao === "confirmada" && passou ? `<button class="rz-botao rz-botao--primario" type="button" data-situacao="realizada">${icone("ok")}Realizada</button>` : "",
    ].filter(Boolean).join(""),
  });
  const el = j.el;
  const conteudo = el.querySelector("[data-conteudo]");

  const resumo = () => {
    conteudo.innerHTML = `
      <dl class="rz-fatos">
        <div><dt>Data</dt><dd>${escapar(dataCurta(new Date(r.inicio), fuso))}</dd></div>
        <div><dt>Horário</dt><dd>${escapar(faixa(it))}</dd></div>
        ${eventos ? `<div><dt>Convidados</dt><dd>${r.convidados || "?"}</dd></div>` : ""}
        <div><dt>${eventos ? "Tipo de festa" : "Ensaio"}</dt><dd>${escapar(it.sub || "a definir")}</dd></div>
        <div><dt>Quem cuida</dt><dd>${escapar(nomeDaPessoa(equipe, r.responsavel_id) || "ninguém ainda")}</dd></div>
        ${eventos ? `<div><dt>Produção no dia</dt><dd>${escapar(nomeDaPessoa(equipe, r.producao_id) || "ninguém ainda")}</dd></div>` : ""}
      </dl>
      <div data-adicionais></div>
      ${r.observacoes ? `<div><p class="rz-rotulo">Anotações</p><div class="rz-balao">${escapar(r.observacoes)}</div></div>` : ""}
      <div class="rz-pilha-p">
        ${r.clientes ? `<button class="rz-link" type="button" data-ver-cliente>${icone("clientes", { tamanho: 16 })} Ver ${escapar(r.clientes.nome)}</button>` : ""}
        ${r.pedido_id && pode("atendimento", "ver") ? `<a class="rz-link" href="/atendimento?pedido=${escapar(r.pedido_id)}">${icone("conversa", { tamanho: 16 })} Ver o pedido</a>` : ""}
        ${pode("financeiro", "ver") ? `<a class="rz-link" href="/financeiro?reserva=${escapar(r.id)}">${icone("carteira", { tamanho: 16 })} Ver os pagamentos</a>` : ""}
      </div>
      ${edita && r.situacao !== "cancelada" ? `<button class="rz-botao rz-botao--fantasma" type="button" data-cancelar>Cancelar ${escapar(aReserva(nicho))}</button>` : ""}
      ${edita && r.situacao === "cancelada" ? `<button class="rz-botao" type="button" data-reativar>Voltar como pré-reserva</button>` : ""}`;
    banco.resultado(banco.tabela("reservas_adicionais").select("quantidade, adicionais(nome)").eq("reserva_id", r.id)).then(linhas => {
      const alvo = conteudo.querySelector("[data-adicionais]");
      if (alvo && linhas.length) alvo.innerHTML = `<p class="rz-rotulo">Adicionais</p><div class="rz-etiquetas">${linhas.map(a => `<span class="rz-etiqueta">${escapar(a.adicionais ? a.adicionais.nome : "")}${a.quantidade > 1 ? ` × ${a.quantidade}` : ""}</span>`).join("")}</div>`;
    }).catch(() => null);
    conteudo.querySelector("[data-ver-cliente]")?.addEventListener("click", () => { j.fechar(); abrirCliente({ cliente: r.clientes, pode, navegar, mensagem }); });
    conteudo.querySelector("[data-cancelar]")?.addEventListener("click", async () => {
      const ok = await confirmar({ titulo: `Cancelar ${aReserva(nicho)}?`, texto: `A data de ${escapar(dataCurta(new Date(r.inicio), fuso))} volta a ficar livre na agenda (e na agenda online).`, sim: "Cancelar", nao: "Voltar", perigo: true });
      if (!ok) return;
      j.fechar();
      mudarSituacao(r, "cancelada", ctx, `${it.titulo}: cancelada.`);
    });
    conteudo.querySelector("[data-reativar]")?.addEventListener("click", () => { j.fechar(); mudarSituacao(r, "pre_reserva", ctx, `${it.titulo}: de volta como pré-reserva.`); });
  };

  const checklist = async () => {
    conteudo.innerHTML = `<p class="rz-texto-3">Carregando…</p>`;
    let itens = [];
    try {
      itens = await banco.resultado(banco.tabela("reservas_checklist").select("id, texto, feito, ordem").eq("reserva_id", r.id).order("ordem").order("texto"));
    } catch (e) {
      conteudo.innerHTML = `<p class="rz-alerta rz-alerta--erro">${escapar(e.message)}</p>`;
      return;
    }
    const desenhar = () => {
      const feitos = itens.filter(x => x.feito).length;
      conteudo.innerHTML = `
        ${itens.length ? `<p class="rz-texto-3">${feitos} de ${itens.length} feitos</p>
          <ul class="rz-checklist">${itens.map(x => `<li><button type="button" class="rz-check" data-item="${escapar(x.id)}" aria-pressed="${x.feito}"${edita ? "" : " disabled"}>
            <span class="rz-check-marca" aria-hidden="true">${icone("ok", { tamanho: 14 })}</span><span>${escapar(x.texto)}</span></button>
            ${edita ? `<button class="rz-botao rz-botao--fantasma rz-botao--pequeno" type="button" data-tirar-item="${escapar(x.id)}" aria-label="Tirar ${escapar(x.texto)}">${icone("fechar", { tamanho: 14 })}</button>` : ""}</li>`).join("")}</ul>`
          : `<p class="rz-texto-2">Sem checklist ainda. ${eventos ? "O tipo de festa pode trazer um pronto (em Serviços, Tipos de festa)." : ""}</p>`}
        ${edita ? `<form class="rz-com-botao" data-novo-item><input class="rz-entrada" name="texto" maxlength="200" placeholder="Novo item (ex.: confirmar o DJ)" aria-label="Novo item do checklist"><button class="rz-botao" type="submit">${icone("adicionar", { tamanho: 18 })}Pôr</button></form>` : ""}`;
    };
    desenhar();
    conteudo.addEventListener("click", async e => {
      const b = e.target.closest("[data-item]");
      if (b && edita) {
        const x = itens.find(i => i.id === b.dataset.item);
        x.feito = !x.feito;
        desenhar();
        try { await banco.resultado(banco.tabela("reservas_checklist").update({ feito: x.feito }).eq("id", x.id)); }
        catch (erro) { x.feito = !x.feito; desenhar(); ctx.avisar(erro.message, { tipo: "erro" }); }
        return;
      }
      const t = e.target.closest("[data-tirar-item]");
      if (t && edita) {
        const x = itens.find(i => i.id === t.dataset.tirarItem);
        itens = itens.filter(i => i !== x);
        desenhar();
        try {
          await banco.resultado(banco.tabela("reservas_checklist").delete().eq("id", x.id));
          ctx.avisar(`"${x.texto}" saiu do checklist.`, { desfazer: async () => {
            try {
              const volta = await banco.resultado(banco.tabela("reservas_checklist").insert({ conta_id: conta.conta_id, reserva_id: r.id, texto: x.texto, feito: x.feito, ordem: x.ordem }).select("id, texto, feito, ordem").single());
              itens.push(volta); itens.sort((a, b) => a.ordem - b.ordem); if (conteudo.isConnected) desenhar();
            } catch (erro) { ctx.avisar(erro.message, { tipo: "erro" }); }
          } });
        } catch (erro) { itens.push(x); desenhar(); ctx.avisar(erro.message, { tipo: "erro" }); }
      }
    });
    conteudo.addEventListener("submit", async e => {
      e.preventDefault();
      const campo = e.target.texto;
      const texto = campo.value.trim();
      if (!texto) return campo.focus();
      try {
        const novo = await banco.resultado(banco.tabela("reservas_checklist").insert({ conta_id: conta.conta_id, reserva_id: r.id, texto, ordem: itens.length ? Math.max(...itens.map(i => i.ordem)) + 1 : 0 }).select("id, texto, feito, ordem").single());
        itens.push(novo);
        desenhar();
        conteudo.querySelector("[data-novo-item] input").focus();
      } catch (erro) { ctx.avisar(erro.message, { tipo: "erro" }); }
    });
  };

  const mostrar = qual => {
    el.querySelectorAll("[data-aba]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.aba === qual)));
    if (qual === "checklist") checklist(); else resumo();
  };
  el.querySelectorAll("[data-aba]").forEach(b => b.addEventListener("click", () => mostrar(b.dataset.aba)));
  mostrar(verChecklist ? aba : "resumo");
  el.querySelector("[data-editar]")?.addEventListener("click", () => { j.fechar(); abrirFormReserva(ctx, { reserva: r }); });
  el.querySelectorAll("[data-situacao]").forEach(b => b.addEventListener("click", () => {
    j.fechar();
    mudarSituacao(r, b.dataset.situacao, ctx, `${it.titulo}: ${SITUACOES[b.dataset.situacao].nome.toLowerCase()}.`);
  }));
  return j;
}

/** As reservas que cruzam [inicio, fim) e seguram o horário (consulta fresca, para o conflito). */
async function verConflito(ctx, { inicio, fim, data, ignorar }) {
  const { banco, conta } = ctx;
  const [reservas, bloqueios] = await Promise.all([
    banco.resultado(banco.tabela("reservas").select("id, inicio, fim, situacao, criado_em, pedido_id, titulo, clientes(nome)").eq("conta_id", conta.conta_id).lt("inicio", fim).gt("fim", inicio)),
    banco.resultado(banco.tabela("bloqueios").select("de, ate, motivo").eq("conta_id", conta.conta_id).lte("de", data).gte("ate", data)),
  ]);
  return { cruzam: conflitos(reservas, { inicio, fim, ignorar, origemDoPedido: ctx.origemDoPedido }), bloqueio: bloqueioDoDia(bloqueios, data) };
}

/**
 * Reservar (ou editar) uma data. Nova: primeiro "Para quem?". `dia` e `hora`: o que veio do calendário ("Reservar
 * este dia", um horário livre da fotografia). Resolve com a reserva gravada (ou null).
 */
export async function abrirFormReserva(ctx, { reserva = null, dia: diaInicial = "", hora: horaInicial = "", campanha = null } = {}) {
  const { banco, conta, nicho, avisar, equipe, pessoa, fuso } = ctx;
  const eventos = nicho.id === "eventos";
  let cliente = reserva ? reserva.clientes : await abrirParaQuem({ banco, conta, titulo: eventos ? "A festa é de quem?" : "O ensaio é de quem?" });
  if (!cliente) return null;
  const [tipos, horarios, adicionais, escolhidos] = await Promise.all([
    banco.resultado(banco.tabela(eventos ? "tipos_reserva" : "servicos").select(eventos ? "id, nome" : "id, nome, duracao_min").eq("conta_id", conta.conta_id).eq("ativo", true).order("ordem").order("nome")).catch(() => []),
    banco.resultado(banco.tabela("horarios").select("dia_semana, inicio, fim, nome, servico_id").eq("conta_id", conta.conta_id)).catch(() => []),
    eventos ? banco.resultado(banco.tabela("adicionais").select("id, nome").eq("conta_id", conta.conta_id).eq("ativo", true).order("ordem").order("nome")).catch(() => []) : [],
    reserva && eventos ? banco.resultado(banco.tabela("reservas_adicionais").select("adicional_id").eq("reserva_id", reserva.id)).catch(() => []) : [],
  ]);
  const it = reserva ? itemDaReserva(reserva, fuso) : null;
  const paraCampo = t => { const m = String(t || "").match(/^(\d{1,2})h(\d{2})?$/); return m ? `${m[1].padStart(2, "0")}:${m[2] || "00"}` : ""; };
  const valores = reserva ? {
    data: it.dia, inicio: paraCampo(it.ini), fim: paraCampo(it.fim), tipo_id: reserva.tipo_id, servico_id: reserva.servico_id,
    convidados: reserva.convidados || "", titulo: reserva.titulo || "", responsavel_id: reserva.responsavel_id || "", producao_id: reserva.producao_id || "", observacoes: reserva.observacoes || "",
  } : { data: diaInicial, inicio: horaInicial || (eventos ? nicho.horarioPadrao.inicio : ""), fim: eventos && !horaInicial ? nicho.horarioPadrao.fim : "", responsavel_id: (pessoa && pessoa.id) || "" };
  const comAdicionais = new Set(escolhidos.map(x => x.adicional_id));

  return new Promise(resolver => {
    let gravada = null;
    let aceitouConflito = false;
    const j = abrirGaveta({
      titulo: reserva ? `Editar ${aReserva(nicho)}` : nicho.palavras.novaReserva,
      subtitulo: escapar(cliente.nome),
      corpo: `<form class="rz-pilha" novalidate id="form-reserva">
          <div role="alert" hidden></div>
          ${campoTexto({ id: "res-data", nome: "data", rotulo: "Data", tipo: "date", valor: valores.data })}
          <div data-turnos></div>
          <div class="rz-campos rz-campos--duas">
            ${campoTexto({ id: "res-inicio", nome: "inicio", rotulo: "Começa", tipo: "time", valor: valores.inicio })}
            ${campoTexto({ id: "res-fim", nome: "fim", rotulo: "Termina", tipo: "time", valor: valores.fim, opcional: !eventos })}
          </div>
          ${tipos.length ? campoSelecao({ id: "res-tipo", nome: eventos ? "tipo_id" : "servico_id", rotulo: eventos ? "Tipo de festa" : "Ensaio", valor: (eventos ? valores.tipo_id : valores.servico_id) || (campanha && campanha.servico_id) || "", opcoes: [{ valor: "", rotulo: "A definir" }, ...tipos.map(t => ({ valor: t.id, rotulo: t.nome }))] }) : ""}
          ${eventos ? campoTexto({ id: "res-conv", nome: "convidados", rotulo: "Convidados", teclado: "numeric", valor: valores.convidados || "", opcional: true, placeholder: "Ex.: 120" }) : ""}
          ${campoTexto({ id: "res-titulo", nome: "titulo", rotulo: eventos ? "Nome da festa" : "Título", valor: valores.titulo || "", opcional: true, placeholder: eventos ? "Ex.: 50 anos da Sônia (quando não é o nome do cliente)" : "Ex.: Família Souza" })}
          ${reserva ? "" : `<fieldset class="rz-campo"><legend class="rz-rotulo">Como fica na agenda</legend>
            <div class="rz-chips rz-chips--quebra" role="radiogroup" aria-label="Como fica na agenda">
              <label class="rz-chip"><input type="radio" name="situacao" value="pre_reserva" checked>Pré-reserva (falta o sinal)</label>
              <label class="rz-chip"><input type="radio" name="situacao" value="confirmada">Confirmada</label>
            </div></fieldset>`}
          ${equipe.length ? `<div class="rz-campos rz-campos--duas">
            ${campoSelecao({ id: "res-resp", nome: "responsavel_id", rotulo: "Quem cuida", valor: valores.responsavel_id || "", opcoes: [{ valor: "", rotulo: "Ninguém ainda" }, ...equipe.map(x => ({ valor: x.id, rotulo: x.nome }))] })}
            ${eventos ? campoSelecao({ id: "res-prod", nome: "producao_id", rotulo: "Produção no dia", valor: valores.producao_id || "", opcoes: [{ valor: "", rotulo: "Ninguém ainda" }, ...equipe.map(x => ({ valor: x.id, rotulo: x.nome }))] }) : ""}
          </div>` : ""}
          ${adicionais.length ? `<fieldset class="rz-campo"><legend class="rz-rotulo">Adicionais <span class="rz-texto-3">(opcional)</span></legend>
            <div class="rz-chips rz-chips--quebra">${adicionais.map(a => `<label class="rz-chip"><input type="checkbox" name="adicional" value="${escapar(a.id)}"${comAdicionais.has(a.id) ? " checked" : ""}>${escapar(a.nome)}</label>`).join("")}</div></fieldset>` : ""}
          ${campoArea({ id: "res-obs", nome: "observacoes", rotulo: "Anotações", valor: valores.observacoes || "", opcional: true, linhas: 2 })}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-reserva">${reserva ? "Salvar" : eventos ? "Reservar a data" : "Marcar"}</button>`,
      aoFechar: () => resolver(gravada),
    });
    const form = j.el.querySelector("form");
    const aviso = form.querySelector("[role=alert]");
    const botao = j.el.querySelector("[type=submit]");
    const textoDoBotao = botao.textContent;

    // eventos: os turnos do dia da semana viram atalhos ("À noite", 19h às 2h)
    const desenharTurnos = () => {
      const alvo = form.querySelector("[data-turnos]");
      const turnos = eventos && form.data.value ? horariosDoDia(horarios, form.data.value).filter(h => h.fim) : [];
      alvo.innerHTML = turnos.length ? `<div class="rz-chips rz-chips--quebra" role="group" aria-label="Turnos">${turnos.map(t => `<button class="rz-chip" type="button" data-turno="${t.inicio.slice(0, 5)}-${t.fim.slice(0, 5)}">${escapar(t.nome || "Turno")} · ${horaDoTexto(t.inicio)} às ${horaDoTexto(t.fim)}</button>`).join("")}</div>` : "";
    };
    desenharTurnos();
    form.data.addEventListener("change", () => { desenharTurnos(); aceitouConflito = false; botao.textContent = textoDoBotao; });
    form.addEventListener("click", e => {
      const t = e.target.closest("[data-turno]");
      if (!t) return;
      const [a, b] = t.dataset.turno.split("-");
      form.inicio.value = a; form.fim.value = b;
      aceitouConflito = false; botao.textContent = textoDoBotao;
    });
    // fotografia: escolher o ensaio sugere o fim pela duração
    const tipo = form.querySelector("#res-tipo");
    const sugerirFim = () => {
      if (eventos || !tipo || !form.inicio.value) return;
      const s = tipos.find(x => x.id === tipo.value);
      if (!s || !s.duracao_min) return;
      const [h, m] = form.inicio.value.split(":").map(Number);
      const total = h * 60 + m + s.duracao_min;
      form.fim.value = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    };
    tipo?.addEventListener("change", sugerirFim);
    form.inicio.addEventListener("change", () => { sugerirFim(); aceitouConflito = false; botao.textContent = textoDoBotao; });
    if (!reserva && !eventos && valores.inicio) sugerirFim();

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      erroNoCampo(form.data, d.data ? "" : "Escolha a data.");
      erroNoCampo(form.inicio, d.inicio ? "" : "Diga a hora.");
      if (eventos) erroNoCampo(form.fim, d.fim ? "" : "Diga até que horas.");
      if (!d.data || !d.inicio || (eventos && !d.fim)) return;
      const linha = linhaDaReserva({ ...d, situacao: d.situacao || (reserva && reserva.situacao) }, { contaId: conta.conta_id, cliente, idNicho: nicho.id, fuso });
      if (campanha && !reserva) linha.campanha_id = campanha.id;
      avisoDoFormulario(aviso, "");
      ocupado(botao, true, "Conferindo…");
      try {
        if (!aceitouConflito) {
          const { cruzam, bloqueio } = await verConflito(ctx, { inicio: linha.inicio, fim: linha.fim, data: d.data, ignorar: reserva && reserva.id });
          if (cruzam.length || bloqueio) {
            ocupado(botao, false);
            const quem = cruzam.map(x => `${x.titulo || (x.clientes && x.clientes.nome) || "outra reserva"} (${hora(new Date(x.inicio), fuso)} às ${hora(new Date(x.fim), fuso)})`).join(", ");
            avisoDoFormulario(aviso, bloqueio ? `Essa data está fechada na agenda${bloqueio.motivo ? ` (${bloqueio.motivo})` : ""}.${cruzam.length ? ` E já tem: ${quem}.` : ""}` : `Esse horário já tem: ${quem}.`);
            aceitouConflito = true;
            botao.textContent = "Reservar mesmo assim";
            return;
          }
        }
        ocupado(botao, true, "Salvando…");
        const { conta_id, cliente_id, ...mudancas } = linha;
        gravada = reserva
          ? await banco.resultado(banco.tabela("reservas").update({ ...mudancas, situacao: reserva.situacao }).eq("id", reserva.id).select(COLUNAS_RESERVA).single())
          : await banco.resultado(banco.tabela("reservas").insert(linha).select(COLUNAS_RESERVA).single());
        if (adicionais.length) {
          const marcados = new Set(form.querySelectorAll("[name=adicional]:checked").length ? [...form.querySelectorAll("[name=adicional]:checked")].map(x => x.value) : []);
          const sair = [...comAdicionais].filter(id => !marcados.has(id));
          const entrar = [...marcados].filter(id => !comAdicionais.has(id));
          if (sair.length) await banco.resultado(banco.tabela("reservas_adicionais").delete().eq("reserva_id", gravada.id).in("adicional_id", sair));
          if (entrar.length) await banco.resultado(banco.tabela("reservas_adicionais").insert(entrar.map(id => ({ conta_id: conta.conta_id, reserva_id: gravada.id, adicional_id: id }))));
        }
        j.fechar();
        avisar(reserva ? `${itemDaReserva(gravada, fuso).titulo}: salvo.` : `${eventos ? "Data reservada" : "Ensaio marcado"}: ${cliente.nome}, ${dataCurta(instanteNoFuso(d.data, d.inicio, fuso), fuso)}.`);
        ctx.recarregar(dia(new Date(gravada.inicio), fuso));
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(aviso, e.message);
      }
    });
  });
}
