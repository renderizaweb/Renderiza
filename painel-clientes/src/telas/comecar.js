// Onboarding (09, "Onboarding"): do cadastro ao painel com a cara do negócio, como um trilho.
// - Boas-vindas: o roteiro dos 5 passos e quanto tempo leva; nada de cair direto numa pergunta.
// - 5 perguntas, uma por tela: o negócio e o site (toque e já vai: o cartão marca, a tela sai e entra a próxima),
//   o nome e o WhatsApp, os módulos do teste (a ordem em que marca vira a ordem do menu) e os tipos de festa ou os
//   ensaios. Ao escolher o nicho, a tela ganha a cor dele (verde dos eventos, vinho da fotografia; 10, "Tema do
//   nicho"). "Voltar" sempre à mão.
// - Montagem: a conta nasce no fim (cadastrar_conta), com cada parte marcando o seu check enquanto acontece.
// As respostas ficam no aparelho a cada passo, então dá para fechar e voltar. A conta real nunca recebe dado de exemplo.

import { telaDeAcesso, focarTitulo, painelDaMarca, temaDoNicho } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { nicho as acharNicho } from "../nichos/index.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../ui/formulario.js";
import { mascaraTelefone, normalizarWhatsapp, whatsappValido } from "../ui/formatos.js";
import { campoTexto, CORES } from "../ui/campos.js";
import { linkDaRenderiza } from "./renderiza.js";

export const VERSAO = 2; // muda quando os passos mudam: o progresso guardado de outra versão é descartado
export const TOTAL_DE_PASSOS = 5;
/** Os cartões do passo 4, na ordem do 09 ("Datas e agenda · Pedidos que chegam · Contratos · Pagamentos · Meu site"). */
export const ORDEM_DOS_MODULOS = ["agenda", "atendimento", "contratos", "financeiro", "meu-site", "agenda-online", "clientes"];
/** Já vêm marcados (os dois primeiros do 09): quem pula o passo 4 começa com eles. */
export const MODULOS_SUGERIDOS = ["agenda", "atendimento"];
/** Os módulos que dependem de um site (o cliente pede a data pelo site; o site é editado pelo painel). */
export const MODULOS_DO_SITE = ["agenda-online", "meu-site"];
export const DURACOES = [30, 45, 60, 90, 120, 180, 240];
/** "Você já tem site?": guardado em contas.ajustes.onboarding.site (a Renderiza vê no Admin). */
export const OPCOES_DE_SITE = [
  { id: "tenho", titulo: "Tenho site", texto: "Ele pode ganhar a agenda online e o Meu site.", icone: "site" },
  { id: "instagram", titulo: "Só Instagram ou WhatsApp", texto: "Os pedidos chegam por mensagem.", icone: "conversa" },
  { id: "nao", titulo: "Ainda não tenho", texto: "Dá para começar só com o painel.", icone: "estrela" },
];
const ICONE_DO_MODULO = { agenda: "agenda", atendimento: "conversa", contratos: "contrato", financeiro: "carteira", "meu-site": "site", "agenda-online": "link", clientes: "clientes" };
const ICONE_DO_NICHO = { eventos: "festa", fotografia: "camera" };
const PAUSA_DO_CHECK = 520; // o check aparece, a pessoa vê, e a tela segue
const MINIMO_POR_ETAPA = 450; // na montagem, cada check fica à vista pelo menos isso

/** Os 5 passos do trilho, com o nome do último no jeito do nicho. */
export function passosDoTrilho(idNicho) {
  const ultimo = idNicho === "fotografia" ? ["Seus ensaios", "O que você fotografa, com a duração"]
    : idNicho === "eventos" ? ["Suas festas", "Os tipos de festa, com a cor na agenda"]
    : ["Festas ou ensaios", "O que você faz, já pronto na agenda"];
  return [
    { titulo: "Seu negócio", texto: "Espaço de eventos ou fotografia" },
    { titulo: "Seu site", texto: "Se você já tem um" },
    { titulo: "Nome e WhatsApp", texto: "Como o cliente te encontra" },
    { titulo: "O que organizar", texto: "Os módulos do teste de 7 dias" },
    { titulo: ultimo[0], texto: ultimo[1] },
  ];
}

export function estadoInicial() {
  return { versao: VERSAO, passo: 0, nicho: null, site: null, nome: "", whatsapp: "", meuNome: "", modulos: [...MODULOS_SUGERIDOS], escolhas: null, contaId: null, linhasCriadas: false };
}

/** Marca ou desmarca um módulo; a ordem em que foram marcados é a ordem do menu. */
export function alternarModulo(modulos, id) {
  return modulos.includes(id) ? modulos.filter(m => m !== id) : [...modulos, id];
}

/** As sugestões do nicho (passo 5), nenhuma marcada: a pessoa escolhe. */
export function escolhasIniciais(idNicho) {
  const n = acharNicho(idNicho);
  return n.sugestoes.map((s, i) => ({ nome: s.nome, cor: s.cor || CORES[i % CORES.length], duracao: s.duracao || null, marcada: false }));
}

/** "Outro tipo": entra marcado, com uma cor que ainda não foi usada; repetido só marca o que já existe. */
export function adicionarEscolha(escolhas, nome, idNicho) {
  const limpo = String(nome || "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (!limpo) return escolhas;
  const igual = escolhas.find(e => e.nome.toLowerCase() === limpo.toLowerCase());
  if (igual) return escolhas.map(e => (e === igual ? { ...e, marcada: true } : e));
  const usadas = escolhas.map(e => e.cor);
  const cor = CORES.find(c => !usadas.includes(c)) || CORES[escolhas.length % CORES.length];
  const n = acharNicho(idNicho);
  return [...escolhas, { nome: limpo, cor, duracao: n.temTiposDeFesta ? null : n.horarioPadrao.duracao, marcada: true }];
}

export function validarNegocio({ nome, whatsapp, meuNome }, { pedirMeuNome = false } = {}) {
  return {
    nome: String(nome || "").trim() ? null : "Digite o nome do negócio.",
    whatsapp: !String(whatsapp || "").trim() || whatsappValido(whatsapp) ? null : "Confira o número: DDD e o número, como (11) 98888-7777.",
    meuNome: !pedirMeuNome || String(meuNome || "").trim() ? null : "Digite o seu nome.",
  };
}

/** O que vai para o banco no fim: a conta (cadastrar_conta), os ajustes (ordem do menu e a resposta do site) e as linhas da pergunta do nicho. */
export function planoDoCadastro(estado) {
  const n = acharNicho(estado.nicho);
  const marcadas = (estado.escolhas || []).filter(e => e.marcada);
  const modulos = estado.modulos.length ? estado.modulos : [...MODULOS_SUGERIDOS];
  return {
    conta: {
      nome: estado.nome.trim(),
      nicho: n.id,
      whatsapp: normalizarWhatsapp(estado.whatsapp),
      modulos,
      meu_nome: String(estado.meuNome || "").trim() || null,
    },
    ajustes: { ordem_menu: modulos, onboarding: { site: OPCOES_DE_SITE.some(o => o.id === estado.site) ? estado.site : null } },
    tabela: n.temTiposDeFesta ? "tipos_reserva" : "servicos",
    linhas: marcadas.map((e, ordem) => (n.temTiposDeFesta
      ? { nome: e.nome, cor: e.cor, ordem }
      : { nome: e.nome, cor: e.cor, duracao_min: e.duracao || n.horarioPadrao.duracao, ordem })),
  };
}

export function textoDaDuracao(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60), m = minutos % 60;
  return m ? `${h}h${m}` : `${h}h`;
}

/** "Agenda", "Agenda e Contratos", "Agenda, Contratos e Financeiro". */
export function listaEmTexto(itens) {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

const chave = usuarioId => `painel-renderiza:comecar:${usuarioId}`;
function ler(usuarioId) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave(usuarioId)) || "null");
    return salvo && typeof salvo === "object" && salvo.versao === VERSAO ? { ...estadoInicial(), ...salvo } : estadoInicial();
  } catch (e) {
    return estadoInicial();
  }
}
function guardar(usuarioId, estado) {
  try { localStorage.setItem(chave(usuarioId), JSON.stringify(estado)); } catch (e) { /* sem espaço: segue sem guardar */ }
}
function esquecer(usuarioId) {
  try { localStorage.removeItem(chave(usuarioId)); } catch (e) { /* nada */ }
}

const esperar = ms => new Promise(r => setTimeout(r, ms));
/** Espera a animação do elemento acabar (com um limite, para nunca travar). */
const fimDaAnimacao = (el, limite) => new Promise(r => {
  const feito = () => { el.removeEventListener("animationend", feito); r(); };
  el.addEventListener("animationend", feito);
  setTimeout(feito, limite);
});

export async function montar(el, { sessao, banco, ambiente, navegar }) {
  if (location.hash || location.search) history.replaceState(history.state, "", location.pathname);
  const usuario = sessao.usuario();
  const nomeDoUsuario = String((usuario.user_metadata && usuario.user_metadata.nome) || "").trim();
  const pedirMeuNome = !nomeDoUsuario;
  const estado = ler(usuario.id);
  const salvar = () => guardar(usuario.id, estado);
  const nichoValido = () => (["eventos", "fotografia"].includes(estado.nicho) ? estado.nicho : "");

  el.innerHTML = telaDeAcesso({
    ambiente,
    nicho: nichoValido(),
    conteudo: `<div class="rz-palco" data-palco></div>`,
    rodape: `Entrou com ${escapar(usuario.email)} · <button class="rz-link" type="button" data-sair>Sair</button>`,
  });
  const raiz = el.querySelector(".rz-acesso");
  const palco = el.querySelector("[data-palco]");
  const painel = el.querySelector("[data-painel-da-marca]");
  let andando = false;

  /** A cor e o painel da marca acompanham o nicho escolhido. */
  function aplicarNicho() {
    const n = nichoValido();
    for (const t of ["rz-tema-eventos", "rz-tema-fotografia"]) raiz.classList.toggle(t, t === temaDoNicho(n));
    if (painel.dataset.nicho !== n) {
      painel.dataset.nicho = n;
      painel.innerHTML = painelDaMarca(n);
      painel.classList.remove("rz-entra");
      void painel.offsetWidth; // reinicia a animação
      painel.classList.add("rz-entra");
    }
  }

  const topo = () => {
    const passos = passosDoTrilho(estado.nicho);
    const voltar = `<button class="rz-acesso-voltar" type="button" data-voltar>${icone("voltar", { tamanho: 18 })}Voltar</button>`;
    return `
    <div class="rz-passo-topo">${voltar}<span class="rz-texto-3">${estado.passo} de ${TOTAL_DE_PASSOS} · ${escapar(passos[estado.passo - 1].titulo)}</span></div>
    <div class="rz-trilho" role="progressbar" aria-label="Passo ${estado.passo} de ${TOTAL_DE_PASSOS}" aria-valuemin="1" aria-valuemax="${TOTAL_DE_PASSOS}" aria-valuenow="${estado.passo}">
      ${passos.map((_, i) => `<span data-estado="${i + 1 < estado.passo ? "feito" : i + 1 === estado.passo ? "agora" : "falta"}"></span>`).join("")}
    </div>`;
  };
  const cabeca = (titulo, texto = "") => `
    <div class="rz-acesso-cabeca rz-passo-cabeca">
      <h1 class="rz-titulo-1">${titulo}</h1>
      ${texto ? `<p class="rz-texto-2">${texto}</p>` : ""}
    </div>`;
  const opcaoUnica = ({ valor, titulo, texto, icone: ic, escolhida }) => `
    <button class="rz-opcao" type="button" data-unica="${escapar(valor)}" aria-pressed="${escolhida}">
      <span class="rz-opcao-icone">${icone(ic)}</span>
      <span class="rz-opcao-texto"><b>${escapar(titulo)}</b><small>${escapar(texto)}</small></span>
      <span class="rz-opcao-marca">${icone("ok", { tamanho: 14 })}</span>
    </button>`;

  const telas = {
    0: () => {
      const primeiroNome = nomeDoUsuario.split(" ")[0];
      return `
      ${sessao.contas().length ? `<div class="rz-passo-topo"><a class="rz-acesso-voltar" href="${TELAS.contas.caminho}">${icone("voltar", { tamanho: 18 })}Minhas contas</a><span></span></div>` : ""}
      ${cabeca(`${primeiroNome ? `Oi, ${escapar(primeiroNome)}! ` : ""}Vamos montar o seu painel`,
        "São 5 perguntas rápidas, uns 2 minutos. Com elas, o painel já nasce com a cara do seu negócio.")}
      <ol class="rz-roteiro">
        ${passosDoTrilho(estado.nicho).map((p, i) => `<li style="--i:${i}"><span class="rz-roteiro-marca">${i + 1}</span>
          <span class="rz-roteiro-texto"><b>${escapar(p.titulo)}</b><small>${escapar(p.texto)}</small></span></li>`).join("")}
      </ol>
      <div class="rz-acesso-acoes">
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="button" data-comecar>Vamos começar ${icone("seta", { tamanho: 18 })}</button>
        <p class="rz-texto-3 rz-centro">Dá para voltar a qualquer passo, e o que você responder fica guardado.</p>
      </div>`;
    },

    1: () => `
      ${topo()}
      ${cabeca("Qual é o seu negócio?", "Toque numa opção: o painel muda de cara e passa a falar a sua língua.")}
      <div class="rz-opcoes" role="group" aria-label="Seu negócio">
        ${["eventos", "fotografia"].map(id => {
          const n = acharNicho(id);
          return opcaoUnica({ valor: id, titulo: n.nome, texto: n.descricao, icone: ICONE_DO_NICHO[id], escolhida: estado.nicho === id });
        }).join("")}
        ${opcaoUnica({ valor: "outro", titulo: "Outro", texto: "Outro tipo de negócio", icone: "mais", escolhida: estado.nicho === "outro" })}
      </div>
      <div class="rz-alerta rz-alerta--aviso" data-outro role="status"${estado.nicho === "outro" ? "" : " hidden"}>${icone("alerta", { tamanho: 20 })}
        <p>Por enquanto, o Painel Renderiza é feito para espaços de eventos e fotografia. Quer conversar sobre o seu negócio?
        <a href="${linkDaRenderiza("Oi! Quero saber se o Painel Renderiza serve para o meu negócio.")}" target="_blank" rel="noopener">Fale com a gente no WhatsApp</a>.</p></div>`,

    2: () => `
      ${topo()}
      ${cabeca("Você já tem site?", "Assim a gente sabe o que faz sentido ligar no seu painel.")}
      <div class="rz-opcoes" role="group" aria-label="Seu site">
        ${OPCOES_DE_SITE.map(o => opcaoUnica({ valor: o.id, titulo: o.titulo, texto: o.texto, icone: o.icone, escolhida: estado.site === o.id })).join("")}
      </div>`,

    3: () => {
      const p = acharNicho(estado.nicho).palavras;
      return `
      ${topo()}
      ${cabeca(`Como se chama ${p.aConta}?`, "O nome aparece no painel e nos links que o seu cliente recebe.")}
      <form class="rz-pilha" novalidate>
        ${campoTexto({ id: "comecar-nome", nome: "nome", rotulo: `Nome ${p.daConta}`, valor: estado.nome, autocompletar: "organization", extra: { maxlength: 80 } })}
        ${campoTexto({ id: "comecar-whatsapp", nome: "whatsapp", rotulo: "WhatsApp do negócio", valor: mascaraTelefone(estado.whatsapp), tipo: "tel", teclado: "tel", autocompletar: "tel-national", placeholder: "(11) 98888-7777", opcional: true, proximo: pedirMeuNome ? "next" : "done" })}
        ${pedirMeuNome ? campoTexto({ id: "comecar-meu-nome", nome: "meuNome", rotulo: "Seu nome", valor: estado.meuNome, autocompletar: "name", proximo: "done" }) : ""}
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Continuar</button>
      </form>`;
    },

    4: () => {
      const n = acharNicho(estado.nicho);
      return `
      ${topo()}
      ${cabeca("O que você quer organizar primeiro?", "Marque quantos quiser: no teste de 7 dias você usa todos os que marcar. A ordem em que marcar vira a ordem do menu.")}
      <form class="rz-pilha" novalidate>
        <div class="rz-opcoes">
          ${ORDEM_DOS_MODULOS.map(id => `<label class="rz-opcao"><input type="checkbox" name="modulo" value="${id}"${estado.modulos.includes(id) ? " checked" : ""}>
            <span class="rz-opcao-icone">${icone(ICONE_DO_MODULO[id])}</span>
            <span class="rz-opcao-texto"><b>${escapar(n.modulos[id].nome)}${estado.site === "tenho" && MODULOS_DO_SITE.includes(id) ? ` <span class="rz-etiqueta rz-etiqueta--destaque">combina com o seu site</span>` : ""}</b><small>${escapar(n.modulos[id].curto)}</small></span>
            <span class="rz-opcao-marca">${icone("ok", { tamanho: 14 })}</span></label>`).join("")}
        </div>
        <p class="rz-erro-campo" data-erro-modulos hidden></p>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Continuar</button>
        <button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-pular>Pular</button>
      </form>`;
    },

    5: () => {
      const n = acharNicho(estado.nicho);
      if (!estado.escolhas) estado.escolhas = escolhasIniciais(n.id);
      const marcadas = estado.escolhas.filter(e => e.marcada);
      return `
      ${topo()}
      ${cabeca(escapar(n.perguntaDoNicho), n.temTiposDeFesta
        ? "Cada tipo ganha uma cor na agenda. Os pacotes e os valores vêm depois, nos primeiros passos."
        : "Viram os seus tipos de ensaio, com a duração de cada um. Os valores você põe depois.")}
      <form class="rz-pilha" novalidate>
        <div class="rz-chips rz-chips--quebra" role="group" aria-label="${escapar(n.palavras.tipos)}">
          ${estado.escolhas.map((e, i) => `<button class="rz-chip" type="button" data-escolha="${i}" aria-pressed="${e.marcada}">
            ${n.temTiposDeFesta ? `<span class="rz-cor" style="--cor:${escapar(e.cor)}"></span>` : ""}${escapar(e.nome)}</button>`).join("")}
        </div>
        <div class="rz-campo">
          <label class="rz-rotulo" for="comecar-outro">Outro ${escapar(n.palavras.tipo)}</label>
          <div class="rz-com-botao">
            <input id="comecar-outro" class="rz-entrada" name="outro" maxlength="60" enterkeyhint="done" autocomplete="off">
            <button class="rz-botao" type="button" data-adicionar>${icone("adicionar", { tamanho: 18 })}Adicionar</button>
          </div>
        </div>
        ${!n.temTiposDeFesta && marcadas.length ? `
        <fieldset class="rz-duracoes"><legend class="rz-rotulo">Quanto tempo dura cada um</legend>
          ${estado.escolhas.map((e, i) => (e.marcada ? `<label class="rz-duracao"><span>${escapar(e.nome)}</span>
            <select class="rz-entrada" data-duracao="${i}" aria-label="Duração: ${escapar(e.nome)}">
              ${DURACOES.map(d => `<option value="${d}"${d === (e.duracao || n.horarioPadrao.duracao) ? " selected" : ""}>${textoDaDuracao(d)}</option>`).join("")}
            </select></label>` : "")).join("")}
        </fieldset>` : ""}
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Abrir o meu painel</button>
        <button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-pular>Pular por agora</button>
      </form>`;
    },

    montagem: () => {
      const n = acharNicho(estado.nicho);
      const plano = planoDoCadastro(estado);
      const nomes = plano.conta.modulos.map(m => (n.modulos[m] && n.modulos[m].nome) || m);
      const etapas = [
        ["conta", `Criando ${n.palavras.aConta} ${escapar(plano.conta.nome)}`],
        ["modulos", `Ligando ${nomes.length === 1 ? "o módulo" : "os módulos"}: ${escapar(listaEmTexto(nomes))}`],
        plano.linhas.length && ["tipos", n.temTiposDeFesta ? `Separando as cores das festas (${plano.linhas.length})` : `Guardando os ensaios e as durações (${plano.linhas.length})`],
        ["pronto", "Abrindo o seu painel"],
      ].filter(Boolean);
      return `
      ${cabeca("Montando o seu painel", "Só um instante.")}
      <ol class="rz-roteiro rz-montagem" aria-live="polite">
        ${etapas.map(([id, texto]) => `<li data-etapa="${id}" data-estado="espera"><span class="rz-roteiro-marca">${icone("ok", { tamanho: 16 })}</span>
          <span class="rz-roteiro-texto"><b>${texto}</b></span></li>`).join("")}
      </ol>
      <div role="alert" hidden></div>
      <div class="rz-acesso-acoes" data-falhou hidden>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="button" data-tentar>Tentar de novo</button>
        <button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-voltar-ao-5>Voltar</button>
      </div>`;
    },
  };

  /** Troca o passo com a animação de sair e entrar (para trás, ao contrário). */
  async function trocar(passo, { voltando = false } = {}) {
    if (andando) return;
    andando = true;
    if (passo !== "montagem") { estado.passo = passo; salvar(); }
    if (palco.childElementCount) {
      palco.className = `rz-palco ${voltando ? "rz-sai-voltando" : "rz-sai"}`;
      await fimDaAnimacao(palco, 320);
    }
    desenhar(passo);
    palco.className = `rz-palco ${voltando ? "rz-entra-voltando" : "rz-entra"}`;
    andando = false;
  }

  function desenhar(passo) {
    if (passo !== "montagem") {
      if (passo > 1 && (!estado.nicho || estado.nicho === "outro")) passo = estado.passo = 1;
      if (passo > 3 && !estado.nome.trim()) passo = estado.passo = 3;
    }
    aplicarNicho();
    palco.innerHTML = telas[passo]();
    const voltar = palco.querySelector("[data-voltar]");
    if (voltar) voltar.addEventListener("click", () => trocar(estado.passo - 1, { voltando: true }));
    focarTitulo(palco);
    ligar[passo]();
  }

  /** Escolha única: marca o cartão (o check aparece), espera um instante e segue sozinho. */
  function ligarEscolhaUnica(aoEscolher) {
    let escolhendo = false;
    palco.querySelectorAll("[data-unica]").forEach(botao => botao.addEventListener("click", async () => {
      if (escolhendo || andando) return;
      palco.querySelectorAll("[data-unica]").forEach(b => b.setAttribute("aria-pressed", String(b === botao)));
      const seguir = aoEscolher(botao.dataset.unica);
      salvar();
      if (!seguir) return;
      escolhendo = true;
      await esperar(PAUSA_DO_CHECK);
      trocar(seguir);
    }));
  }

  async function montarConta() {
    const aviso = palco.querySelector("[role=alert]");
    const falhou = palco.querySelector("[data-falhou]");
    avisoDoFormulario(aviso, "");
    falhou.hidden = true;
    const plano = planoDoCadastro(estado);
    const etapa = async (id, fazer) => {
      const li = palco.querySelector(`[data-etapa="${id}"]`);
      if (!li || li.dataset.estado === "feito") return;
      li.dataset.estado = "andando";
      const inicio = Date.now();
      try {
        await fazer();
      } catch (e) {
        li.dataset.estado = "erro";
        throw e;
      }
      const falta = MINIMO_POR_ETAPA - (Date.now() - inicio);
      if (falta > 0) await esperar(falta);
      li.dataset.estado = "feito";
    };
    try {
      await etapa("conta", async () => {
        if (!estado.contaId) { estado.contaId = await banco.rpc("cadastrar_conta", plano.conta); salvar(); }
      });
      // a ordem do menu e a resposta do site são preferência: se falhar, o painel segue com o padrão
      await etapa("modulos", () => banco.resultado(banco.tabela("contas").update({ ajustes: plano.ajustes }).eq("id", estado.contaId)).catch(() => null));
      await etapa("tipos", async () => {
        if (estado.linhasCriadas) return;
        await banco.resultado(banco.tabela(plano.tabela).insert(plano.linhas.map(l => ({ ...l, conta_id: estado.contaId }))));
        estado.linhasCriadas = true;
        salvar();
      });
      await etapa("pronto", async () => {
        await sessao.carregarContas();
        sessao.escolherConta(estado.contaId);
      });
      esquecer(usuario.id);
      await esperar(250);
      navegar("/", { substituir: true });
    } catch (e) {
      avisoDoFormulario(aviso, e.message);
      falhou.hidden = false;
    }
  }

  const ligar = {
    0() {
      palco.querySelector("[data-comecar]").addEventListener("click", () => trocar(1));
    },
    1() {
      const outro = palco.querySelector("[data-outro]");
      ligarEscolhaUnica(valor => {
        if (valor !== estado.nicho) estado.escolhas = null; // as sugestões do passo 5 são do nicho
        estado.nicho = valor;
        outro.hidden = valor !== "outro";
        aplicarNicho();
        return valor === "outro" ? null : 2;
      });
    },
    2() {
      ligarEscolhaUnica(valor => { estado.site = valor; return 3; });
    },
    3() {
      const form = palco.querySelector("form");
      const { nome, whatsapp } = form;
      const meuNome = form.meuNome;
      whatsapp.addEventListener("input", () => {
        const fim = whatsapp.selectionStart === whatsapp.value.length;
        whatsapp.value = mascaraTelefone(whatsapp.value);
        if (fim) whatsapp.setSelectionRange(whatsapp.value.length, whatsapp.value.length);
        erroNoCampo(whatsapp, "");
      });
      for (const campo of [nome, whatsapp, meuNome].filter(Boolean)) {
        campo.addEventListener("input", () => {
          estado[campo.name] = campo.value;
          salvar();
          if (campo !== whatsapp) erroNoCampo(campo, "");
        });
      }
      whatsapp.addEventListener("blur", () => erroNoCampo(whatsapp, validarNegocio({ nome: "x", whatsapp: whatsapp.value }).whatsapp));
      form.addEventListener("submit", e => {
        e.preventDefault();
        const erros = validarNegocio({ nome: nome.value, whatsapp: whatsapp.value, meuNome: meuNome && meuNome.value }, { pedirMeuNome });
        erroNoCampo(nome, erros.nome);
        erroNoCampo(whatsapp, erros.whatsapp);
        if (meuNome) erroNoCampo(meuNome, erros.meuNome);
        const primeiro = [erros.nome && nome, erros.whatsapp && whatsapp, erros.meuNome && meuNome].find(Boolean);
        if (primeiro) return primeiro.focus();
        estado.nome = nome.value.trim();
        estado.whatsapp = whatsapp.value;
        if (meuNome) estado.meuNome = meuNome.value.trim();
        trocar(4);
      });
      (estado.nome ? whatsapp : nome).focus({ preventScroll: true });
    },
    4() {
      const form = palco.querySelector("form");
      const erro = form.querySelector("[data-erro-modulos]");
      form.addEventListener("change", e => {
        if (e.target.name !== "modulo") return;
        estado.modulos = alternarModulo(estado.modulos, e.target.value);
        salvar();
        erro.hidden = true;
      });
      form.addEventListener("submit", e => {
        e.preventDefault();
        if (!estado.modulos.length) {
          erro.textContent = "Marque pelo menos um (ou toque em Pular para começar com a Agenda e o Atendimento).";
          erro.hidden = false;
          return;
        }
        trocar(5);
      });
      form.querySelector("[data-pular]").addEventListener("click", () => {
        if (!estado.modulos.length) estado.modulos = [...MODULOS_SUGERIDOS];
        trocar(5);
      });
    },
    5() {
      const form = palco.querySelector("form");
      const outro = form.outro;
      const redesenhar = foco => { palco.innerHTML = telas[5](); palco.querySelector("[data-voltar]").addEventListener("click", () => trocar(4, { voltando: true })); ligar[5](); if (foco) palco.querySelector(foco).focus(); };
      const adicionar = () => {
        if (!outro.value.trim()) return outro.focus();
        estado.escolhas = adicionarEscolha(estado.escolhas, outro.value, estado.nicho);
        salvar();
        redesenhar("#comecar-outro");
      };
      form.addEventListener("click", e => {
        const chip = e.target.closest("[data-escolha]");
        if (chip) {
          const i = Number(chip.dataset.escolha);
          estado.escolhas = estado.escolhas.map((x, j) => (j === i ? { ...x, marcada: !x.marcada } : x));
          salvar();
          if (acharNicho(estado.nicho).temTiposDeFesta) chip.setAttribute("aria-pressed", String(estado.escolhas[i].marcada));
          else redesenhar(`[data-escolha="${i}"]`);
        }
        if (e.target.closest("[data-adicionar]")) adicionar();
      });
      outro.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } });
      form.addEventListener("change", e => {
        const i = e.target.dataset.duracao;
        if (i === undefined) return;
        estado.escolhas[Number(i)].duracao = Number(e.target.value);
        salvar();
      });
      form.addEventListener("submit", e => { e.preventDefault(); trocar("montagem"); });
      form.querySelector("[data-pular]").addEventListener("click", () => {
        estado.escolhas = estado.escolhas.map(x => ({ ...x, marcada: false }));
        salvar();
        trocar("montagem");
      });
    },
    montagem() {
      palco.querySelector("[data-tentar]").addEventListener("click", e => { ocupado(e.currentTarget, true, "Tentando…"); montarConta().finally(() => ocupado(e.currentTarget, false)); });
      palco.querySelector("[data-voltar-ao-5]").addEventListener("click", () => trocar(5, { voltando: true }));
      montarConta();
    },
  };

  desenhar(estado.passo);
}
