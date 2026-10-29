// Serviços (base: todos veem; edita quem tem "editar" em Serviços, ou o dono): o que a conta vende e quando atende,
// que os módulos usam. Por nicho (05, "Os nomes que mudam por nicho"):
//   eventos:    Pacotes · Tipos de festa · Adicionais · Horários (turnos) · Datas fechadas
//   fotografia: Ensaios · Horários · Campanhas · Folgas · Adicionais
// Pacote, tipo e adicional não se apagam (as reservas apontam para eles): desativam. Horário e data fechada, sim.

import { icone } from "../../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { moeda, lerValor, horaDoTexto, dataCurta, lerData, lerHora, dia as diaDe, instanteNoFuso } from "../../ui/formatos.js";
import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { campoTexto, campoArea, campoSelecao, interruptor, escolherCor, lerFormulario, linhas } from "../../ui/campos.js";

export const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** As abas do nicho, na ordem. */
export function abasDoNicho(nicho) {
  const p = nicho.palavras;
  const servicos = { id: "servicos", nome: p.servicos[0].toUpperCase() + p.servicos.slice(1), novo: `Novo ${p.servico}` };
  const adicionais = { id: "adicionais", nome: "Adicionais", novo: "Novo adicional" };
  const horarios = { id: "horarios", nome: "Horários", novo: "Novo horário" };
  return nicho.id === "fotografia"
    ? [servicos, horarios, { id: "campanhas", nome: "Campanhas", novo: "Nova campanha" }, { id: "bloqueios", nome: "Folgas", novo: "Nova folga" }, adicionais]
    : [servicos, { id: "tipos", nome: "Tipos de festa", novo: "Novo tipo de festa" }, adicionais, horarios, { id: "bloqueios", nome: "Datas fechadas", novo: "Nova data fechada" }];
}

/** O que o formulário de pacote ou ensaio vira no banco, ou os erros por campo. */
export function lerServico(dados, nicho) {
  const erros = {};
  if (!dados.nome) erros.nome = "Digite o nome.";
  const valor = dados.valor ? lerValor(dados.valor) : null;
  if (dados.valor && valor === null) erros.valor = "Confira o valor (ex.: 1.900 ou 750,00).";
  const sinal = dados.sinal ? lerValor(dados.sinal) : null;
  if (dados.sinal && sinal === null) erros.sinal = "Confira o valor do sinal.";
  if (sinal !== null && valor !== null && sinal > valor) erros.sinal = "O sinal não pode passar do valor.";
  const linha = { nome: dados.nome, descricao: dados.descricao || null, valor, sinal, ativo: dados.ativo !== false, na_agenda_online: dados.na_agenda_online !== false };
  if (nicho.temConvidados) {
    linha.convidados_inclusos = dados.convidados_inclusos ? Number(dados.convidados_inclusos) : null;
    if (dados.convidados_inclusos && !(linha.convidados_inclusos >= 0)) erros.convidados_inclusos = "Só números.";
    linha.valor_convidado_extra = dados.valor_convidado_extra ? lerValor(dados.valor_convidado_extra) : null;
    if (dados.valor_convidado_extra && linha.valor_convidado_extra === null) erros.valor_convidado_extra = "Confira o valor.";
    linha.inclui = linhas(dados.inclui);
  } else {
    linha.duracao_min = dados.duracao_min ? Number(dados.duracao_min) : null;
    if (dados.duracao_min && !(linha.duracao_min >= 5 && linha.duracao_min <= 1440)) erros.duracao_min = "Entre 5 e 1440 minutos.";
    linha.entrega = dados.entrega || null;
    linha.cor = dados.cor || null;
  }
  return { linha, erros };
}

/** Dias digitados (um por linha) viram "aaaa-mm-dd"; horários ("09:00, 9h40") viram "hh:mm". */
export function lerCampanha(dados, hoje) {
  const erros = {};
  if (!dados.nome) erros.nome = "Digite o nome da campanha.";
  const dias = linhas(dados.dias).map(d => ({ texto: d, data: lerData(d, hoje) }));
  if (dias.some(d => !d.data)) erros.dias = `Não entendi: ${dias.filter(d => !d.data).map(d => d.texto).join(", ")}. Use 14/12 ou 14/12/2026.`;
  const horarios = String(dados.horarios || "").split(/[,;\s]+/).filter(Boolean).map(h => ({ texto: h, hora: lerHora(h) }));
  if (horarios.some(h => !h.hora)) erros.horarios = `Não entendi: ${horarios.filter(h => !h.hora).map(h => h.texto).join(", ")}. Use 09:00 ou 9h40.`;
  const vagas = dados.vagas ? Number(dados.vagas) : null;
  if (dados.vagas && !(vagas > 0)) erros.vagas = "Só números.";
  const prazo = dados.prazo_sinal_horas ? Number(dados.prazo_sinal_horas) : null;
  if (dados.prazo_sinal_horas && !(prazo >= 1 && prazo <= 720)) erros.prazo_sinal_horas = "Entre 1 e 720 horas.";
  return {
    erros,
    linha: {
      nome: dados.nome, servico_id: dados.servico_id || null, dias: [...new Set(dias.map(d => d.data))].sort(),
      horarios: [...new Set(horarios.map(h => h.hora))].sort(), vagas, prazo_sinal_horas: prazo,
      texto_stories: dados.texto_stories || null, ativa: dados.ativa !== false,
    },
  };
}

const etiqueta = (texto, tipo = "") => `<span class="rz-etiqueta${tipo ? " rz-etiqueta--" + tipo : ""}">${escapar(texto)}</span>`;

export async function montar(el, { banco, conta, nicho, pode, avisar }) {
  const abas = abasDoNicho(nicho);
  const aba = abas.find(a => a.id === new URLSearchParams(location.search).get("aba")) || abas[0];
  const editaServicos = pode("servicos", "editar");
  const edita = aba.id === "bloqueios" || aba.id === "campanhas" ? editaServicos || pode("agenda", "editar") : editaServicos;
  const fuso = conta.fuso || undefined;
  const temAgendaOnline = (conta.modulos || []).includes("agenda-online");
  const p = nicho.palavras;

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Serviços</h1>
        <p class="rz-texto-2">${nicho.id === "fotografia" ? "Os ensaios, os horários e as campanhas que o painel e a agenda online usam." : "Os pacotes, os tipos de festa e os horários que o painel e a agenda online usam."}</p></div>
      ${edita ? `<div class="rz-cabeca-acoes"><button class="rz-botao rz-botao--primario" type="button" data-novo>${icone("adicionar", { tamanho: 18 })}Novo</button></div>` : ""}
    </header>
    <nav class="rz-abas" aria-label="Partes de Serviços">${abas.map(a => `<a href="/servicos?aba=${a.id}"${a.id === aba.id ? ' aria-current="page"' : ""}>${escapar(a.nome)}</a>`).join("")}</nav>
    ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê esta parte. Quem muda é o dono ou quem ele deixar.</span></p>` : ""}
    <div data-lista></div>`;
  const lista = el.querySelector("[data-lista]");
  el.querySelector(".rz-abas [aria-current=page]")?.scrollIntoView({ block: "nearest", inline: "center" });
  let itens = [], servicos = [];

  // ---------- cada aba: o que carrega, como mostra, o formulário e o que grava ----------
  const ABA = {
    servicos: {
      tabela: "servicos",
      carregar: () => banco.resultado(banco.tabela("servicos").select("*").eq("conta_id", conta.conta_id).order("ativo", { ascending: false }).order("ordem").order("nome")),
      vazio: { titulo: `Nenhum ${p.servico} ainda`, texto: nicho.id === "fotografia" ? "Cadastre os ensaios que você faz, com a duração e o valor." : "Cadastre os pacotes, com o valor e quantos convidados cada um cobre." },
      linha: s => {
        const partes = nicho.temConvidados
          ? [s.valor != null ? moeda(s.valor) : null, s.convidados_inclusos != null ? `até ${s.convidados_inclusos} convidados` : null, s.valor_convidado_extra != null ? `${moeda(s.valor_convidado_extra)} por convidado a mais` : null]
          : [s.duracao_min ? `${s.duracao_min} min` : null, s.valor != null ? moeda(s.valor) : null, s.sinal != null ? `sinal ${moeda(s.sinal)}` : null, s.entrega];
        return `${s.cor ? `<span class="rz-cor" style="--cor:${escapar(s.cor)}"></span>` : ""}<span class="rz-linha-texto"><b>${escapar(s.nome)}</b><small>${escapar(partes.filter(Boolean).join(" · ") || "Sem detalhes ainda")}</small></span>
          <span class="rz-linha-fim">${s.valor == null ? etiqueta("Sem valor", "alerta") : ""}${!s.ativo ? etiqueta("Desativado") : temAgendaOnline && !s.na_agenda_online ? etiqueta("Fora da agenda online") : ""}</span>`;
      },
      form: s => `
        ${campoTexto({ id: "s-nome", nome: "nome", rotulo: "Nome", valor: s.nome, placeholder: nicho.id === "fotografia" ? "Ex.: Ensaio gestante" : "Ex.: Clássico" })}
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "s-valor", nome: "valor", rotulo: "Valor (R$)", valor: s.valor != null ? String(s.valor).replace(".", ",") : "", teclado: "decimal", opcional: true, placeholder: "Ex.: 1.900" })}
          ${campoTexto({ id: "s-sinal", nome: "sinal", rotulo: "Sinal (R$)", valor: s.sinal != null ? String(s.sinal).replace(".", ",") : "", teclado: "decimal", opcional: true })}
        </div>
        ${nicho.temConvidados ? `<div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "s-conv", nome: "convidados_inclusos", rotulo: "Convidados inclusos", valor: s.convidados_inclusos ?? "", teclado: "numeric", opcional: true })}
          ${campoTexto({ id: "s-extra", nome: "valor_convidado_extra", rotulo: "Por convidado a mais (R$)", valor: s.valor_convidado_extra != null ? String(s.valor_convidado_extra).replace(".", ",") : "", teclado: "decimal", opcional: true })}
        </div>
        ${campoArea({ id: "s-inclui", nome: "inclui", rotulo: "O que inclui", valor: (s.inclui || []).join("\n"), opcional: true, ajuda: "Um item por linha.", placeholder: "Espaço por 6 horas\nBuffet completo" })}`
        : `<div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "s-dur", nome: "duracao_min", rotulo: "Duração (minutos)", valor: s.duracao_min ?? "", teclado: "numeric", opcional: true })}
          ${campoTexto({ id: "s-entrega", nome: "entrega", rotulo: "O que entrega", valor: s.entrega || "", opcional: true, placeholder: "Ex.: 25 fotos editadas" })}
        </div>
        ${escolherCor({ valor: s.cor })}`}
        ${campoArea({ id: "s-desc", nome: "descricao", rotulo: "Descrição", valor: s.descricao || "", opcional: true, linhas: 2 })}
        ${temAgendaOnline ? interruptor({ nome: "na_agenda_online", rotulo: "Aparece na agenda online", marcado: s.na_agenda_online !== false }) : ""}
        ${interruptor({ nome: "ativo", rotulo: "Ativo", ajuda: "Desativado não aparece para escolher, mas continua nas reservas que já tem.", marcado: s.ativo !== false })}`,
      ler: d => lerServico(d, nicho),
    },
    tipos: {
      tabela: "tipos_reserva",
      carregar: () => banco.resultado(banco.tabela("tipos_reserva").select("*").eq("conta_id", conta.conta_id).order("ativo", { ascending: false }).order("ordem").order("nome")),
      vazio: { titulo: "Nenhum tipo de festa ainda", texto: "Casamento, 15 anos, infantil... Cada tipo ganha uma cor na agenda e o checklist de cada festa." },
      linha: t => `${t.cor ? `<span class="rz-cor" style="--cor:${escapar(t.cor)}"></span>` : ""}<span class="rz-linha-texto"><b>${escapar(t.nome)}</b><small>${t.checklist.length ? `${t.checklist.length} ${t.checklist.length === 1 ? "item" : "itens"} no checklist` : "Sem checklist"}</small></span>
        <span class="rz-linha-fim">${!t.ativo ? etiqueta("Desativado") : ""}</span>`,
      form: t => `${campoTexto({ id: "t-nome", nome: "nome", rotulo: "Nome", valor: t.nome, placeholder: "Ex.: Casamento" })}
        ${escolherCor({ valor: t.cor })}
        ${campoArea({ id: "t-check", nome: "checklist", rotulo: "Checklist de cada festa", valor: (t.checklist || []).join("\n"), opcional: true, ajuda: "Um item por linha. Cada festa nova deste tipo já nasce com ele.", placeholder: "Contrato assinado\nDegustação do cardápio\nLista de convidados" })}
        ${interruptor({ nome: "ativo", rotulo: "Ativo", marcado: t.ativo !== false })}`,
      ler: d => ({ erros: d.nome ? {} : { nome: "Digite o nome." }, linha: { nome: d.nome, cor: d.cor, checklist: linhas(d.checklist), ativo: d.ativo !== false } }),
    },
    adicionais: {
      tabela: "adicionais",
      carregar: () => banco.resultado(banco.tabela("adicionais").select("*").eq("conta_id", conta.conta_id).order("ativo", { ascending: false }).order("ordem").order("nome")),
      vazio: { titulo: "Nenhum adicional ainda", texto: nicho.id === "fotografia" ? "Fotos a mais, álbum, maquiagem... o que se vende junto com o ensaio." : "Open bar, DJ, hora extra... o que se vende junto com a festa." },
      linha: a => `<span class="rz-linha-texto"><b>${escapar(a.nome)}</b><small>${a.preco != null ? moeda(a.preco) : "Sem preço"}</small></span><span class="rz-linha-fim">${!a.ativo ? etiqueta("Desativado") : ""}</span>`,
      form: a => `${campoTexto({ id: "a-nome", nome: "nome", rotulo: "Nome", valor: a.nome, placeholder: "Ex.: Hora extra" })}
        ${campoTexto({ id: "a-preco", nome: "preco", rotulo: "Preço (R$)", valor: a.preco != null ? String(a.preco).replace(".", ",") : "", teclado: "decimal", opcional: true })}
        ${interruptor({ nome: "ativo", rotulo: "Ativo", marcado: a.ativo !== false })}`,
      ler: d => {
        const preco = d.preco ? lerValor(d.preco) : null;
        const erros = {};
        if (!d.nome) erros.nome = "Digite o nome.";
        if (d.preco && preco === null) erros.preco = "Confira o preço.";
        return { erros, linha: { nome: d.nome, preco, ativo: d.ativo !== false } };
      },
    },
    horarios: {
      tabela: "horarios",
      apaga: true,
      carregar: async () => {
        servicos = await banco.resultado(banco.tabela("servicos").select("id, nome").eq("conta_id", conta.conta_id).eq("ativo", true).order("nome"));
        return banco.resultado(banco.tabela("horarios").select("*").eq("conta_id", conta.conta_id).order("dia_semana").order("inicio"));
      },
      vazio: { titulo: "Nenhum horário ainda", texto: nicho.id === "fotografia" ? "Os dias e os horários em que você fotografa. A agenda online só oferece esses." : "Os dias e os turnos que o espaço aluga (de dia, à noite). A agenda online só oferece esses." },
      agrupar: h => DIAS[h.dia_semana],
      linha: h => `<span class="rz-linha-texto"><b>${escapar(horaDoTexto(h.inicio))}${h.fim ? " às " + escapar(horaDoTexto(h.fim)) : ""}${h.nome ? " · " + escapar(h.nome) : ""}</b>
        <small>${escapar(h.servico_id ? (servicos.find(s => s.id === h.servico_id) || {}).nome || "" : nicho.id === "fotografia" ? "Todos os ensaios sem horário próprio" : "")}</small></span>`,
      form: h => `${h.id ? campoSelecao({ id: "h-dia", nome: "dia_semana", rotulo: "Dia", valor: h.dia_semana, opcoes: DIAS.map((d, i) => ({ valor: i, rotulo: d })) })
          : `<fieldset class="rz-campo"><legend class="rz-rotulo">Dias</legend><div class="rz-chips rz-chips--quebra">${DIAS.map((d, i) => `<label class="rz-chip"><input type="checkbox" name="dias" value="${i}" class="rz-oculto">${d.slice(0, 3)}</label>`).join("")}</div><p class="rz-erro-campo" hidden></p></fieldset>`}
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "h-ini", nome: "inicio", rotulo: "Começa", valor: (h.inicio || "").slice(0, 5), tipo: "time" })}
          ${nicho.id === "eventos" ? campoTexto({ id: "h-fim", nome: "fim", rotulo: "Termina", valor: (h.fim || "").slice(0, 5), tipo: "time", ajuda: "Antes do começo = passa da meia-noite." }) : ""}
        </div>
        ${nicho.id === "eventos" ? campoTexto({ id: "h-nome", nome: "nome", rotulo: "Nome do turno", valor: h.nome || "", opcional: true, placeholder: "Ex.: À noite" })
          : campoSelecao({ id: "h-serv", nome: "servico_id", rotulo: "Para qual ensaio", valor: h.servico_id || "", opcoes: [{ valor: "", rotulo: "Todos os ensaios sem horário próprio" }, ...servicos.map(s => ({ valor: s.id, rotulo: s.nome }))] })}`,
      ler: (d, h) => {
        const erros = {};
        const dias = h.id ? [Number(d.dia_semana)] : (d.dias || []).map(Number);
        if (!dias.length) erros.dias = "Escolha pelo menos um dia.";
        if (!d.inicio) erros.inicio = "Diga a hora.";
        const base = { inicio: d.inicio, fim: d.fim || null, nome: d.nome || null, servico_id: d.servico_id || null };
        return { erros, linha: h.id ? { ...base, dia_semana: dias[0] } : dias.map(dia_semana => ({ ...base, dia_semana })) };
      },
    },
    bloqueios: {
      tabela: "bloqueios",
      apaga: true,
      carregar: () => banco.resultado(banco.tabela("bloqueios").select("*").eq("conta_id", conta.conta_id).gte("ate", diaDe(new Date(), fuso)).order("de")),
      vazio: { titulo: nicho.id === "fotografia" ? "Nenhuma folga marcada" : "Nenhuma data fechada", texto: nicho.id === "fotografia" ? "Férias, folgas, dias sem ensaio: a agenda online não oferece." : "Reforma, feriado, uso próprio: a agenda online não oferece essas datas." },
      linha: b => {
        const de = instanteNoFuso(b.de, "12:00", fuso), ate = instanteNoFuso(b.ate, "12:00", fuso);
        return `<span class="rz-linha-texto"><b>${escapar(b.de === b.ate ? dataCurta(de, fuso) : `${dataCurta(de, fuso)} a ${dataCurta(ate, fuso)}`)}</b><small>${escapar(b.motivo || "Sem motivo anotado")}</small></span>`;
      },
      form: b => `<div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "b-de", nome: "de", rotulo: "De", valor: b.de || "", tipo: "date" })}
          ${campoTexto({ id: "b-ate", nome: "ate", rotulo: "Até", valor: b.ate || "", tipo: "date", opcional: true, ajuda: "Vazio: um dia só." })}
        </div>
        ${campoTexto({ id: "b-motivo", nome: "motivo", rotulo: "Motivo", valor: b.motivo || "", opcional: true, placeholder: "Ex.: Férias" })}`,
      ler: d => {
        const erros = {};
        if (!d.de) erros.de = "Escolha a data.";
        const ate = d.ate || d.de;
        if (d.de && ate < d.de) erros.ate = "O fim vem depois do começo.";
        return { erros, linha: { de: d.de, ate, motivo: d.motivo || null } };
      },
    },
    campanhas: {
      tabela: "campanhas",
      carregar: async () => {
        servicos = await banco.resultado(banco.tabela("servicos").select("id, nome").eq("conta_id", conta.conta_id).eq("ativo", true).order("nome"));
        return banco.resultado(banco.tabela("campanhas").select("*").eq("conta_id", conta.conta_id).order("ativa", { ascending: false }).order("criado_em", { ascending: false }));
      },
      vazio: { titulo: "Nenhuma campanha ainda", texto: "Mini sessões com vagas (Natal, Dia das Mães): os dias, os horários e o texto pronto para o Stories." },
      linha: c => `<span class="rz-linha-texto"><b>${escapar(c.nome)}</b><small>${escapar([`${c.dias.length} ${c.dias.length === 1 ? "dia" : "dias"}`, `${c.vagas || c.dias.length * c.horarios.length} vagas`, (servicos.find(s => s.id === c.servico_id) || {}).nome].filter(Boolean).join(" · "))}</small></span>
        <span class="rz-linha-fim">${!c.ativa ? etiqueta("Encerrada") : ""}</span>`,
      form: c => `${campoTexto({ id: "c-nome", nome: "nome", rotulo: "Nome", valor: c.nome, placeholder: "Ex.: Mini sessão de Natal" })}
        ${campoSelecao({ id: "c-serv", nome: "servico_id", rotulo: "Ensaio", valor: c.servico_id || "", opcoes: [{ valor: "", rotulo: "Escolha" }, ...servicos.map(s => ({ valor: s.id, rotulo: s.nome }))] })}
        ${campoArea({ id: "c-dias", nome: "dias", rotulo: "Dias", valor: (c.dias || []).map(d => d.split("-").reverse().join("/")).join("\n"), ajuda: "Um por linha (14/12 ou 14/12/2026).", linhas: 3 })}
        ${campoTexto({ id: "c-horas", nome: "horarios", rotulo: "Horários", valor: (c.horarios || []).map(h => h.slice(0, 5)).join(", "), placeholder: "09:00, 09:40, 10:20", ajuda: "Separados por vírgula." })}
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "c-vagas", nome: "vagas", rotulo: "Vagas", valor: c.vagas ?? "", teclado: "numeric", opcional: true, ajuda: "Vazio: dias × horários." })}
          ${campoTexto({ id: "c-prazo", nome: "prazo_sinal_horas", rotulo: "Prazo do sinal (horas)", valor: c.prazo_sinal_horas ?? "", teclado: "numeric", opcional: true })}
        </div>
        ${campoArea({ id: "c-stories", nome: "texto_stories", rotulo: "Texto para o Stories", valor: c.texto_stories || "", opcional: true, linhas: 3 })}
        ${interruptor({ nome: "ativa", rotulo: "Aberta", ajuda: "Encerrada sai da agenda online.", marcado: c.ativa !== false })}`,
      ler: d => lerCampanha(d, diaDe(new Date(), fuso)),
    },
  };
  const atual = ABA[aba.id];

  const desenhar = dados => {
    itens = dados;
    if (!itens.length) {
      lista.innerHTML = `<div class="rz-cartao">${vazio({ icone: "servicos", ...atual.vazio, acao: edita ? { rotulo: "Cadastrar", dado: "novo" } : null })}</div>`;
      return;
    }
    const linha = i => `<li>${edita ? `<button class="rz-linha" type="button" data-item="${escapar(i.id)}">` : `<div class="rz-linha">`}${atual.linha(i)}${edita ? `${icone("editar", { tamanho: 18, classe: "rz-texto-3" })}</button>` : "</div>"}</li>`;
    if (atual.agrupar) {
      const grupos = new Map();
      for (const i of itens) { const g = atual.agrupar(i); if (!grupos.has(g)) grupos.set(g, []); grupos.get(g).push(i); }
      lista.innerHTML = [...grupos].map(([g, l]) => `<section class="rz-secao"><h2 class="rz-titulo-3">${escapar(g)}</h2><ul class="rz-cartao rz-linhas">${l.map(linha).join("")}</ul></section>`).join("");
    } else {
      lista.innerHTML = `<ul class="rz-cartao rz-linhas">${itens.map(linha).join("")}</ul>`;
    }
  };
  const atualizar = () => comEstados(lista, { carregar: atual.carregar, desenhar });

  const abrirItem = (item = {}) => {
    const novo = !item.id;
    const g = abrirGaveta({
      titulo: novo ? aba.novo : item.nome || aba.nome,
      corpo: `<form class="rz-pilha" id="form-servico" novalidate><div role="alert" hidden></div>${atual.form(item)}</form>`,
      rodape: `${!novo && atual.apaga ? `<button class="rz-botao rz-botao--fantasma" type="button" data-apagar>${icone("lixo", { tamanho: 18 })}Apagar</button>` : `<button class="rz-botao" type="button" data-fechar>Voltar</button>`}
        <button class="rz-botao rz-botao--primario" type="submit" form="form-servico">Salvar</button>`,
    });
    const form = g.corpo.querySelector("form");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const { linha, erros } = atual.ler(lerFormulario(form), item);
      let primeiro = null;
      for (const campo of form.querySelectorAll("[name]")) {
        const erro = erros[campo.name] || "";
        if (campo.type === "checkbox" && campo.name === "dias") {
          const alvo = campo.closest("fieldset").querySelector(".rz-erro-campo");
          alvo.hidden = !erro; alvo.textContent = erro;
          if (erro && !primeiro) primeiro = campo;
        } else if (campo.closest(".rz-campo")) {
          erroNoCampo(campo, erro);
          if (erro && !primeiro) primeiro = campo;
        }
      }
      if (primeiro) return primeiro.focus();
      const botao = g.pe.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        const tabela = banco.tabela(atual.tabela);
        if (novo) {
          const linhas = (Array.isArray(linha) ? linha : [linha]).map(l => ({ ...l, conta_id: conta.conta_id }));
          await banco.resultado(tabela.insert(linhas));
        } else {
          await banco.resultado(tabela.update(linha).eq("id", item.id));
        }
        g.fechar();
        avisar(novo ? "Cadastrado." : "Salvo.");
        atualizar();
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
      }
    });
    g.pe.querySelector("[data-apagar]")?.addEventListener("click", async () => {
      if (!(await confirmar({ titulo: "Apagar?", texto: "Isso sai da agenda online também.", sim: "Apagar", perigo: true }))) return;
      try {
        await banco.resultado(banco.tabela(atual.tabela).delete().eq("id", item.id));
        g.fechar();
        avisar("Apagado.", {
          desfazer: async () => {
            const { id, criado_em, atualizado_em, ...resto } = item;
            await banco.resultado(banco.tabela(atual.tabela).insert(resto));
            atualizar();
          },
        });
        atualizar();
      } catch (e) {
        avisar(e.message, { tipo: "erro" });
      }
    });
  };

  el.addEventListener("click", e => {
    if (e.target.closest("[data-novo], [data-acao=novo]")) return abrirItem();
    const b = e.target.closest("[data-item]");
    if (b) abrirItem(itens.find(i => i.id === b.dataset.item));
  });
  // os cliques já estão ligados: agora carrega (um toque rápido não se perde)
  await atualizar();
}
