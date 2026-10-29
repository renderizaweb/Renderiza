// Onboarding (09, "Onboarding"): do cadastro ao painel com a cara do negócio, uma pergunta por tela.
// O passo 1 é o cadastro (/cadastro); aqui ficam os passos 2 a 5: o nicho, o nome e o WhatsApp, os módulos do teste
// (a ordem em que a pessoa marca vira a ordem do menu) e a pergunta do nicho (tipos de festa, ou ensaios com a
// duração). As respostas ficam guardadas no aparelho a cada passo e a conta nasce no fim (cadastrar_conta), então
// "voltar" sempre funciona. Pular é sempre possível. A conta real nunca recebe dado de exemplo.

import { telaDeAcesso, focarTitulo } from "./acesso.js";
import { TELAS } from "../rotas.js";
import { nicho as acharNicho } from "../nichos/index.js";
import { icone } from "../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../ui/formulario.js";
import { mascaraTelefone, normalizarWhatsapp, whatsappValido } from "../ui/formatos.js";
import { campoTexto, CORES } from "../ui/campos.js";
import { linkDaRenderiza } from "./renderiza.js";

export const TOTAL_DE_PASSOS = 5; // o 1 é o cadastro
/** Os cartões do passo 4, na ordem do 09 ("Datas e agenda · Pedidos que chegam · Contratos · Pagamentos · Meu site"). */
export const ORDEM_DOS_MODULOS = ["agenda", "atendimento", "contratos", "financeiro", "meu-site", "agenda-online", "clientes"];
/** Já vêm marcados (os dois primeiros do 09): quem pula o passo 4 começa com eles. */
export const MODULOS_SUGERIDOS = ["agenda", "atendimento"];
export const DURACOES = [30, 45, 60, 90, 120, 180, 240];
const ICONE_DO_MODULO = { agenda: "agenda", atendimento: "conversa", contratos: "contrato", financeiro: "carteira", "meu-site": "site", "agenda-online": "link", clientes: "clientes" };
const ICONE_DO_NICHO = { eventos: "festa", fotografia: "camera" };

export function estadoInicial() {
  return { passo: 2, nicho: null, nome: "", whatsapp: "", meuNome: "", modulos: [...MODULOS_SUGERIDOS], escolhas: null, contaId: null, linhasCriadas: false };
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

/** O que vai para o banco no fim: a conta (cadastrar_conta), a ordem do menu e as linhas da pergunta do nicho. */
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
    ajustes: { ordem_menu: modulos },
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

const chave = usuarioId => `painel-renderiza:comecar:${usuarioId}`;
function ler(usuarioId) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave(usuarioId)) || "null");
    return salvo && typeof salvo === "object" ? { ...estadoInicial(), ...salvo } : estadoInicial();
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

export async function montar(el, { sessao, banco, ambiente, navegar }) {
  if (location.hash || location.search) history.replaceState(history.state, "", location.pathname);
  const usuario = sessao.usuario();
  const pedirMeuNome = !(usuario.user_metadata && String(usuario.user_metadata.nome || "").trim());
  let estado = ler(usuario.id);
  const salvar = () => guardar(usuario.id, estado);

  const cabeca = (titulo, texto = "") => `
    <div class="rz-passo-topo">
      ${estado.passo > 2 ? `<button class="rz-acesso-voltar" type="button" data-voltar>${icone("voltar", { tamanho: 18 })}Voltar</button>`
        : sessao.contas().length ? `<a class="rz-acesso-voltar" href="${TELAS.contas.caminho}">${icone("voltar", { tamanho: 18 })}Minhas contas</a>` : "<span></span>"}
      <span class="rz-texto-3">${estado.passo} de ${TOTAL_DE_PASSOS}</span>
    </div>
    <div class="rz-progresso" role="progressbar" aria-label="Passo ${estado.passo} de ${TOTAL_DE_PASSOS}" aria-valuemin="1" aria-valuemax="${TOTAL_DE_PASSOS}" aria-valuenow="${estado.passo}"><span style="width:${Math.round((estado.passo / TOTAL_DE_PASSOS) * 100)}%"></span></div>
    <div class="rz-acesso-cabeca rz-passo-cabeca">
      <h1 class="rz-titulo-1">${titulo}</h1>
      ${texto ? `<p class="rz-texto-2">${texto}</p>` : ""}
    </div>`;

  const telas = {
    2: () => `
      ${cabeca("Qual é o seu negócio?", "Assim o painel já fala a sua língua: festa ou ensaio, pacote ou tipo de ensaio.")}
      <form class="rz-pilha" novalidate>
        <div class="rz-opcoes" role="radiogroup" aria-label="Seu negócio">
          ${["eventos", "fotografia"].map(id => {
            const n = acharNicho(id);
            return `<label class="rz-opcao"><input type="radio" name="nicho" value="${id}"${estado.nicho === id ? " checked" : ""}>
              <span class="rz-opcao-icone">${icone(ICONE_DO_NICHO[id])}</span>
              <span class="rz-opcao-texto"><b>${escapar(n.nome)}</b><small>${escapar(n.descricao)}</small></span>
              <span class="rz-opcao-marca">${icone("ok", { tamanho: 14 })}</span></label>`;
          }).join("")}
          <label class="rz-opcao"><input type="radio" name="nicho" value="outro"${estado.nicho === "outro" ? " checked" : ""}>
            <span class="rz-opcao-icone">${icone("mais")}</span>
            <span class="rz-opcao-texto"><b>Outro</b><small>Outro tipo de negócio</small></span>
            <span class="rz-opcao-marca">${icone("ok", { tamanho: 14 })}</span></label>
        </div>
        <div class="rz-alerta rz-alerta--aviso" data-outro role="status" hidden>${icone("alerta", { tamanho: 20 })}
          <p>Por enquanto, o Painel Renderiza é feito para espaços de eventos e fotografia. Quer conversar sobre o seu negócio?
          <a href="${linkDaRenderiza("Oi! Quero saber se o Painel Renderiza serve para o meu negócio.")}" target="_blank" rel="noopener">Fale com a gente no WhatsApp</a>.</p></div>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Continuar</button>
      </form>`,

    3: () => {
      const p = acharNicho(estado.nicho).palavras;
      return `
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
      ${cabeca("O que você quer organizar primeiro?", "Marque quantos quiser: no teste de 7 dias você usa todos os que marcar. A ordem em que marcar vira a ordem do menu.")}
      <form class="rz-pilha" novalidate>
        <div class="rz-opcoes">
          ${ORDEM_DOS_MODULOS.map(id => `<label class="rz-opcao"><input type="checkbox" name="modulo" value="${id}"${estado.modulos.includes(id) ? " checked" : ""}>
            <span class="rz-opcao-icone">${icone(ICONE_DO_MODULO[id])}</span>
            <span class="rz-opcao-texto"><b>${escapar(n.modulos[id].nome)}</b><small>${escapar(n.modulos[id].curto)}</small></span>
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
      ${cabeca(escapar(n.perguntaDoNicho), n.temTiposDeFesta
        ? "Cada tipo ganha uma cor na agenda. Os pacotes e os valores vêm depois, nos primeiros passos."
        : "Viram os seus tipos de ensaio, com a duração de cada um. Os valores você põe depois.")}
      <form class="rz-pilha" novalidate>
        <div role="alert" hidden></div>
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
  };

  function irPara(passo) {
    estado.passo = passo;
    salvar();
    desenhar();
  }

  async function criarConta(botao, aviso) {
    ocupado(botao, true, "Montando o painel…");
    try {
      const plano = planoDoCadastro(estado);
      if (!estado.contaId) {
        estado.contaId = await banco.rpc("cadastrar_conta", plano.conta);
        salvar();
        // a ordem do menu é preferência: se falhar, o menu usa a ordem padrão
        await banco.resultado(banco.tabela("contas").update({ ajustes: plano.ajustes }).eq("id", estado.contaId)).catch(() => null);
      }
      if (plano.linhas.length && !estado.linhasCriadas) {
        await banco.resultado(banco.tabela(plano.tabela).insert(plano.linhas.map(l => ({ ...l, conta_id: estado.contaId }))));
        estado.linhasCriadas = true;
        salvar();
      }
      await sessao.carregarContas();
      sessao.escolherConta(estado.contaId);
      esquecer(usuario.id);
      navegar("/", { substituir: true });
    } catch (e) {
      ocupado(botao, false);
      avisoDoFormulario(aviso, e.message);
    }
  }

  function desenhar() {
    if (estado.passo > 2 && (!estado.nicho || estado.nicho === "outro")) estado.passo = 2;
    if (estado.passo > 3 && !estado.nome.trim()) estado.passo = 3;
    el.innerHTML = telaDeAcesso({
      ambiente,
      conteudo: telas[estado.passo](),
      rodape: `Entrou com ${escapar(usuario.email)} · <button class="rz-link" type="button" data-sair>Sair</button>`,
    });
    const form = el.querySelector("form");
    const voltar = el.querySelector("[data-voltar]");
    if (voltar) voltar.addEventListener("click", () => irPara(estado.passo - 1));
    focarTitulo(el);
    ligar[estado.passo](form);
  }

  const ligar = {
    2(form) {
      const outro = form.querySelector("[data-outro]");
      const botao = form.querySelector("button[type=submit]");
      const mostrar = () => {
        outro.hidden = estado.nicho !== "outro";
        botao.disabled = !estado.nicho || estado.nicho === "outro";
      };
      form.addEventListener("change", () => {
        const novo = form.nicho.value;
        if (novo !== estado.nicho) estado.escolhas = null; // as sugestões do passo 5 são do nicho
        estado.nicho = novo;
        salvar();
        mostrar();
      });
      form.addEventListener("submit", e => { e.preventDefault(); if (!botao.disabled) irPara(3); });
      mostrar();
    },
    3(form) {
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
        irPara(4);
      });
      (estado.nome ? whatsapp : nome).focus({ preventScroll: true });
    },
    4(form) {
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
        irPara(5);
      });
      form.querySelector("[data-pular]").addEventListener("click", () => {
        if (!estado.modulos.length) estado.modulos = [...MODULOS_SUGERIDOS];
        irPara(5);
      });
    },
    5(form) {
      const aviso = form.querySelector("[role=alert]");
      const outro = form.outro;
      const adicionar = () => {
        if (!outro.value.trim()) return outro.focus();
        estado.escolhas = adicionarEscolha(estado.escolhas, outro.value, estado.nicho);
        salvar();
        desenhar();
        el.querySelector("#comecar-outro").focus();
      };
      form.addEventListener("click", e => {
        const chip = e.target.closest("[data-escolha]");
        if (chip) {
          const i = Number(chip.dataset.escolha);
          estado.escolhas = estado.escolhas.map((x, j) => (j === i ? { ...x, marcada: !x.marcada } : x));
          salvar();
          if (acharNicho(estado.nicho).temTiposDeFesta) chip.setAttribute("aria-pressed", String(estado.escolhas[i].marcada));
          else { desenhar(); el.querySelector(`[data-escolha="${i}"]`).focus(); }
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
      form.addEventListener("submit", e => {
        e.preventDefault();
        criarConta(form.querySelector("button[type=submit]"), aviso);
      });
      form.querySelector("[data-pular]").addEventListener("click", e => {
        estado.escolhas = estado.escolhas.map(x => ({ ...x, marcada: false }));
        criarConta(e.currentTarget, aviso);
      });
    },
  };

  desenhar();
}
