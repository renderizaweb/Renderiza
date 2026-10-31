// A conversa de boas-vindas (/montar; Missão 7, bloco E; D43, D44): quem chega pelo convite já tem a conta (a
// Renderiza criou, muitas vezes a partir da demo), e aqui o painel fica com a cara do negócio, no visual do onboarding
// de sempre (D33: um cartão por vez, toque e segue, a animação). Nesta ordem: a abertura pelo nome do negócio;
// "É isso mesmo?" (o que a demo já sabe, confirmado num toque); os tipos de festa ou os ensaios já marcados; as
// perguntas do roteiro (src/telas/montar/roteiro.js), com a IA escolhendo a próxima e o tom (a função "assistente")
// e o roteiro fixo quando a IA não responde a tempo; "Mande o que tiver"; e a montagem, com os checks, até o Início.
// Nada é gravado sem o toque da pessoa. O progresso fica no aparelho (dá para fechar e voltar), e "Fazer depois"
// deixa um passo no Início. Só o dono passa por aqui; a conta marca contas.ajustes.onboarding.pendente (o Admin põe).

import { telaDeAcesso, focarTitulo } from "../acesso.js";
import { nicho as acharNicho } from "../../nichos/index.js";
import { icone } from "../../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { mascaraTelefone, normalizarWhatsapp, whatsappValido, telefone } from "../../ui/formatos.js";
import { campoTexto, CORES } from "../../ui/campos.js";
import { linkDaRenderiza } from "../renderiza.js";
import { restantes, proximaFixa, perfilDasRespostas, ordemDoMenu, confirmacoes, tiposParaEscolher, assuntosDoNicho } from "./roteiro.js";

export const VERSAO = 1;
const PAUSA_DO_CHECK = 520;
const MINIMO_POR_ETAPA = 450;
/** Quanto a tela espera a IA antes de seguir o roteiro fixo (D43: se ela demorar, ninguém percebe). */
export const ESPERA_DA_IA = 5000;

const esperar = ms => new Promise(r => setTimeout(r, ms));
const fimDaAnimacao = (el, limite) => new Promise(r => {
  const feito = () => { el.removeEventListener("animationend", feito); r(); };
  el.addEventListener("animationend", feito);
  setTimeout(feito, limite);
});
/** A promessa, ou null se passar do tempo. */
const comPrazo = (promessa, ms) => Promise.race([promessa, esperar(ms).then(() => null)]);


const chave = contaId => `painel-renderiza:montar:${contaId}`;
const estadoInicial = () => ({ versao: VERSAO, passo: "abertura", respostas: [], atual: null, comentario: "", tipos: null, corrigido: null, semIa: false, viaIa: 0 });
function ler(contaId) {
  try {
    const s = JSON.parse(localStorage.getItem(chave(contaId)) || "null");
    return s && s.versao === VERSAO ? { ...estadoInicial(), ...s } : estadoInicial();
  } catch (e) { return estadoInicial(); }
}
const guardar = (contaId, e) => { try { localStorage.setItem(chave(contaId), JSON.stringify(e)); } catch (er) { /* segue sem guardar */ } };
const esquecer = contaId => { try { localStorage.removeItem(chave(contaId)); } catch (er) { /* nada */ } };

export async function montar(el, { sessao, banco, ambiente, navegar }) {
  const conta = sessao.conta();
  if (!conta) return navegar("/contas", { substituir: true });
  if (!conta.dono) return navegar("/", { substituir: true });
  // os termos vêm antes de tudo (o app pede no Início)
  const termos = await import("../termos.js");
  const aceite = await termos.situacaoDoAceite(banco).catch(() => null);
  if (aceite && !aceite.aceitou) return navegar("/", { substituir: true });

  const n = acharNicho(conta.nicho);
  const [linha, dados, existentes] = await Promise.all([
    banco.resultado(banco.tabela("contas").select("nome, whatsapp").eq("id", conta.conta_id).single()).catch(() => ({ nome: conta.nome, whatsapp: null })),
    banco.rpc("contexto_da_minha_conta", { p_conta: conta.conta_id }).catch(() => null),
    banco.resultado(banco.tabela(n.temTiposDeFesta ? "tipos_reserva" : "servicos").select("nome").eq("conta_id", conta.conta_id)).catch(() => []),
  ]);
  const sabe = confirmacoes({ conta: { nome: linha.nome, whatsapp: linha.whatsapp }, dados });
  const estado = ler(conta.conta_id);
  const salvar = () => guardar(conta.conta_id, estado);
  if (!estado.tipos) estado.tipos = tiposParaEscolher(sabe.tipos, n.sugestoes);
  const usuario = sessao.usuario() || {};
  const pessoa = sessao.pessoa ? sessao.pessoa() : null;
  const primeiroNome = String((pessoa && pessoa.nome) || (usuario.user_metadata && usuario.user_metadata.nome) || "").trim().split(/\s+/)[0];
  const total = assuntosDoNicho(n.id).length;
  // cada passo fica registrado para o acompanhamento no Admin (bloco G): sem esperar, e sem atrapalhar se falhar
  const registrar = (evento, detalhe = null) => { banco.resultado(banco.tabela("onboarding_eventos").insert({ conta_id: conta.conta_id, evento, detalhe })).catch(() => {}); };

  el.innerHTML = telaDeAcesso({
    ambiente,
    nicho: n.id,
    conteudo: `<div class="rz-palco" data-palco></div>`,
    rodape: `<button class="rz-link" type="button" data-depois>Fazer depois</button>`,
  });
  const palco = el.querySelector("[data-palco]");
  let andando = false;

  const cabeca = (titulo, texto = "") => `
    <div class="rz-acesso-cabeca rz-passo-cabeca">
      <h1 class="rz-titulo-1">${titulo}</h1>
      ${texto ? `<p class="rz-texto-2">${texto}</p>` : ""}
    </div>`;
  const trilho = feitos => `
    <div class="rz-passo-topo"><span class="rz-texto-3">Pergunta ${feitos + 1} de ${total}</span><span class="rz-texto-3">dá para pular</span></div>
    <div class="rz-progresso rz-montar-progresso" role="progressbar" aria-label="Perguntas respondidas" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${feitos}"><span style="width:${Math.round((feitos / total) * 100)}%"></span></div>`;

  const telas = {
    abertura: () => `
      ${cabeca(`${primeiroNome ? `Oi, ${escapar(primeiroNome)}! ` : ""}Vamos deixar o painel ${escapar(n.palavras.daConta)} pronto`,
        `${escapar(sabe.nome)} já tem um painel. A gente trouxe o que sabe, você confere e responde umas perguntas de um toque. Uns 2 minutos.`)}
      <ol class="rz-roteiro">
        ${[["Conferir o que a gente já sabe", "Nome, WhatsApp e o que vocês fazem"], [n.temTiposDeFesta ? "Seus tipos de festa" : "Seus ensaios", "Já marcados, é só conferir"],
          ["Umas perguntas rápidas", "Para o painel falar a sua língua"], ["Pronto", "O seu plano para começar"]]
          .map(([t, s], i) => `<li style="--i:${i}"><span class="rz-roteiro-marca">${i + 1}</span><span class="rz-roteiro-texto"><b>${t}</b><small>${s}</small></span></li>`).join("")}
      </ol>
      <div class="rz-acesso-acoes"><button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="button" data-seguir>Vamos lá ${icone("seta", { tamanho: 18 })}</button></div>`,

    confirma: () => {
      const c = estado.corrigido || { nome: sabe.nome, whatsapp: sabe.whatsapp };
      const fatos = [["Nome", c.nome], ["WhatsApp", c.whatsapp ? telefone(c.whatsapp) : "ainda sem"], sabe.regiao && ["Onde", sabe.regiao],
        sabe.instagram && ["Instagram", `@${sabe.instagram}`], sabe.google && ["Avaliações", sabe.google]].filter(Boolean);
      return `
      ${cabeca("É isso mesmo?", "É o que a gente já sabe do seu negócio. Se algo mudou, é só corrigir.")}
      <dl class="rz-fatos rz-cartao rz-cartao-corpo">${fatos.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapar(v)}</dd></div>`).join("")}</dl>
      <div class="rz-acesso-acoes">
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="button" data-certo>${icone("ok", { tamanho: 18 })}Sim, está certo</button>
        <button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-corrigir>Corrigir</button>
      </div>`;
    },

    corrige: () => {
      const c = estado.corrigido || { nome: sabe.nome, whatsapp: sabe.whatsapp };
      return `
      ${cabeca("O que mudou?")}
      <form class="rz-pilha" novalidate>
        ${campoTexto({ id: "montar-nome", nome: "nome", rotulo: `Nome ${n.palavras.daConta}`, valor: c.nome, extra: { maxlength: 120 } })}
        ${campoTexto({ id: "montar-whatsapp", nome: "whatsapp", rotulo: "WhatsApp do negócio", valor: mascaraTelefone(c.whatsapp || ""), tipo: "tel", teclado: "tel", opcional: true, placeholder: "(11) 98888-7777" })}
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Continuar</button>
      </form>`;
    },

    tipos: () => `
      ${cabeca(escapar(n.perguntaDoNicho), sabe.tipos.length ? "Os que estão na sua página já vêm marcados. Toque para tirar ou pôr." : "Toque nos que vocês fazem. Cada um ganha uma cor na agenda.")}
      <form class="rz-pilha" novalidate>
        <div class="rz-chips rz-chips--quebra" role="group" aria-label="${escapar(n.palavras.tipos)}">
          ${estado.tipos.map((t, i) => `<button class="rz-chip" type="button" data-tipo="${i}" aria-pressed="${t.marcada}">${escapar(t.nome)}</button>`).join("")}
        </div>
        <div class="rz-campo"><label class="rz-rotulo" for="montar-outro">Outro ${escapar(n.palavras.tipo)}</label>
          <div class="rz-com-botao"><input id="montar-outro" class="rz-entrada" name="outro" maxlength="60" autocomplete="off" enterkeyhint="done">
            <button class="rz-botao" type="button" data-adicionar>${icone("adicionar", { tamanho: 18 })}Adicionar</button></div></div>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Confirmar</button>
      </form>`,

    pergunta: () => {
      const q = estado.atual;
      return `
      ${trilho(estado.respostas.length)}
      ${estado.comentario ? `<p class="rz-montar-comentario" role="status">${icone("estrela", { tamanho: 16 })}${escapar(estado.comentario)}</p>` : ""}
      ${cabeca(escapar(q.pergunta))}
      <div class="rz-opcoes" role="group" aria-label="${escapar(q.pergunta)}">
        ${q.opcoes.map(o => `<button class="rz-opcao" type="button" data-resposta="${escapar(o.valor)}" aria-pressed="false">
          <span class="rz-opcao-texto"><b>${escapar(o.rotulo)}</b></span><span class="rz-opcao-marca">${icone("ok", { tamanho: 14 })}</span></button>`).join("")}
      </div>
      <p class="rz-texto-3 rz-montar-preparando" data-preparando role="status" hidden>Preparando a próxima pergunta…</p>
      <button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-pular>Pular</button>`;
    },

    arquivos: () => `
      ${cabeca("Tem orçamento, contrato ou lista de clientes?", "Em foto, PDF ou planilha. Mande para a Renderiza pelo WhatsApp que a gente coloca no seu painel. Logo, logo você manda por aqui, e a IA monta junto com você.")}
      <div class="rz-acesso-acoes">
        <a class="rz-botao rz-botao--grande rz-botao--bloco" href="${escapar(linkDaRenderiza(`Oi! Sou ${primeiroNome || "dono"} do ${sabe.nome}. Vou mandar o que tenho para o painel (orçamento, contrato, clientes).`))}" target="_blank" rel="noopener">${icone("whatsapp", { tamanho: 18 })}Mandar pelo WhatsApp</a>
        <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="button" data-seguir>Montar o meu painel ${icone("seta", { tamanho: 18 })}</button>
      </div>`,

    montagem: () => {
      const marcadas = estado.tipos.filter(t => t.marcada && !existentes.some(x => x.nome.toLowerCase() === t.nome.toLowerCase()));
      const etapas = [
        ["dados", `Confirmando os dados ${escapar(n.palavras.daConta)}`],
        marcadas.length && ["tipos", n.temTiposDeFesta ? `Separando as cores das festas (${marcadas.length})` : `Guardando os ensaios (${marcadas.length})`],
        ["menu", "Arrumando o menu do seu jeito"],
        ["pronto", "Preparando o seu plano para começar"],
      ].filter(Boolean);
      return `
      ${cabeca("Montando o seu painel", "Só um instante.")}
      <ol class="rz-roteiro rz-montagem" aria-live="polite">
        ${etapas.map(([id, t]) => `<li data-etapa="${id}" data-estado="espera"><span class="rz-roteiro-marca">${icone("ok", { tamanho: 16 })}</span><span class="rz-roteiro-texto"><b>${t}</b></span></li>`).join("")}
      </ol>
      <div role="alert" hidden></div>
      <div class="rz-acesso-acoes" data-falhou hidden><button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="button" data-tentar>Tentar de novo</button></div>`;
    },
  };

  async function trocar(passo) {
    if (andando) return;
    andando = true;
    estado.passo = passo;
    salvar();
    if (palco.childElementCount) { palco.className = "rz-palco rz-sai"; await fimDaAnimacao(palco, 320); }
    desenhar();
    palco.className = "rz-palco rz-entra";
    andando = false;
  }
  function desenhar() {
    if (estado.passo === "pergunta" && !estado.atual) estado.passo = "arquivos";
    palco.innerHTML = telas[estado.passo]();
    focarTitulo(palco);
    (ligar[estado.passo] || (() => {}))();
  }

  /** A próxima pergunta: a da IA, se ela responder a tempo e dentro do roteiro; senão, a do roteiro fixo. */
  async function proxima() {
    const falta = restantes(n.id, estado.respostas);
    if (!falta.length) return { atual: null, comentario: "" };
    if (!estado.semIa) {
      const r = await comPrazo(banco.funcao("assistente", {
        conta: conta.conta_id, tarefa: "proxima_pergunta",
        entrada: { respostas: estado.respostas.filter(x => x.valor).map(x => ({ assunto: x.assunto, pergunta: x.pergunta, resposta: x.resposta })), restantes: falta },
      }).catch(() => null), ESPERA_DA_IA);
      if (r && r.ok && r.resultado) { estado.viaIa++; return { atual: r.resultado, comentario: r.resultado.comentario || "" }; }
      // sem a IA na conta (sem chave, no teto): não pergunta de novo nesta conversa
      if (r && ["sem_ia", "teto", "limite"].includes(r.motivo)) estado.semIa = true;
    }
    return { atual: proximaFixa(n.id, estado.respostas), comentario: "" };
  }

  async function responder(valor, rotulo) {
    const q = estado.atual;
    estado.respostas.push({ assunto: q.assunto, pergunta: q.pergunta, resposta: rotulo, valor });
    salvar();
    registrar("pergunta", q.assunto);
    // se a IA demorar, a pessoa vê que a próxima está vindo (e não acha que travou)
    const aviso = setTimeout(() => {
      const p = palco.querySelector("[data-preparando]");
      if (p) p.hidden = false;
    }, PAUSA_DO_CHECK + 300);
    const [seguinte] = await Promise.all([proxima(), esperar(PAUSA_DO_CHECK)]);
    clearTimeout(aviso);
    estado.atual = seguinte.atual;
    estado.comentario = seguinte.comentario;
    trocar(estado.atual ? "pergunta" : "arquivos");
  }

  async function terminar() {
    const aviso = palco.querySelector("[role=alert]");
    const falhou = palco.querySelector("[data-falhou]");
    avisoDoFormulario(aviso, "");
    falhou.hidden = true;
    const etapa = async (id, fazer) => {
      const li = palco.querySelector(`[data-etapa="${id}"]`);
      if (!li || li.dataset.estado === "feito") return;
      li.dataset.estado = "andando";
      const inicio = Date.now();
      try { await fazer(); } catch (e) { li.dataset.estado = "erro"; throw e; }
      const falta = MINIMO_POR_ETAPA - (Date.now() - inicio);
      if (falta > 0) await esperar(falta);
      li.dataset.estado = "feito";
    };
    const perfil = perfilDasRespostas(estado.respostas);
    try {
      await etapa("dados", async () => {
        const c = estado.corrigido;
        if (c) await banco.resultado(banco.tabela("contas").update({ nome: c.nome, whatsapp: normalizarWhatsapp(c.whatsapp) || null }).eq("id", conta.conta_id));
        else if (!linha.whatsapp && sabe.whatsapp) await banco.resultado(banco.tabela("contas").update({ whatsapp: normalizarWhatsapp(sabe.whatsapp) }).eq("id", conta.conta_id));
      });
      await etapa("tipos", async () => {
        const novos = estado.tipos.filter(t => t.marcada && !existentes.some(x => x.nome.toLowerCase() === t.nome.toLowerCase()));
        if (!novos.length) return;
        const usadas = [];
        const linhas = novos.map((t, i) => {
          const cor = t.cor && !usadas.includes(t.cor) ? t.cor : CORES.find(x => !usadas.includes(x)) || CORES[i % CORES.length];
          usadas.push(cor);
          return n.temTiposDeFesta ? { conta_id: conta.conta_id, nome: t.nome, cor, ordem: existentes.length + i }
            : { conta_id: conta.conta_id, nome: t.nome, cor, duracao_min: t.duracao || n.horarioPadrao.duracao, ordem: existentes.length + i };
        });
        await banco.resultado(banco.tabela(n.temTiposDeFesta ? "tipos_reserva" : "servicos").insert(linhas));
        existentes.push(...novos.map(t => ({ nome: t.nome })));
      });
      await etapa("menu", async () => {
        const antes = conta.ajustes || {};
        const ajustes = {
          ...antes,
          ordem_menu: ordemDoMenu(perfil.objetivo, conta.modulos || [], antes.ordem_menu || []),
          onboarding: { ...(antes.onboarding || {}), pendente: false, feito_em: new Date().toISOString(), perfil, via_ia: estado.viaIa },
        };
        await banco.resultado(banco.tabela("contas").update({ ajustes }).eq("id", conta.conta_id));
        conta.ajustes = ajustes;
      });
      await etapa("pronto", () => sessao.carregarContas());
      registrar("conversa_terminou");
      esquecer(conta.conta_id);
      await esperar(250);
      navegar("/", { substituir: true });
    } catch (e) {
      avisoDoFormulario(aviso, e.message);
      falhou.hidden = false;
    }
  }

  const ligar = {
    abertura() { palco.querySelector("[data-seguir]").addEventListener("click", () => { registrar("conversa_comecou"); trocar("confirma"); }); },
    confirma() {
      palco.querySelector("[data-certo]").addEventListener("click", () => trocar("tipos"));
      palco.querySelector("[data-corrigir]").addEventListener("click", () => trocar("corrige"));
    },
    corrige() {
      const form = palco.querySelector("form");
      form.whatsapp.addEventListener("input", () => { form.whatsapp.value = mascaraTelefone(form.whatsapp.value); erroNoCampo(form.whatsapp, ""); });
      form.addEventListener("submit", e => {
        e.preventDefault();
        const nome = form.nome.value.trim();
        erroNoCampo(form.nome, nome ? "" : "Digite o nome do negócio.");
        const zap = form.whatsapp.value.trim();
        erroNoCampo(form.whatsapp, !zap || whatsappValido(zap) ? "" : "Confira o número: DDD e o número.");
        if (!nome || (zap && !whatsappValido(zap))) return;
        estado.corrigido = { nome, whatsapp: normalizarWhatsapp(zap) || "" };
        trocar("tipos");
      });
    },
    tipos() {
      const form = palco.querySelector("form");
      const adicionar = () => {
        const nome = form.outro.value.trim().replace(/\s+/g, " ").slice(0, 60);
        if (!nome) return form.outro.focus();
        const igual = estado.tipos.find(t => t.nome.toLowerCase() === nome.toLowerCase());
        if (igual) igual.marcada = true; else estado.tipos.push({ nome, marcada: true });
        salvar();
        desenhar();
        palco.querySelector("#montar-outro").focus();
      };
      form.addEventListener("click", e => {
        const chip = e.target.closest("[data-tipo]");
        if (chip) { const t = estado.tipos[Number(chip.dataset.tipo)]; t.marcada = !t.marcada; chip.setAttribute("aria-pressed", String(t.marcada)); salvar(); }
        if (e.target.closest("[data-adicionar]")) adicionar();
      });
      form.outro.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } });
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const botao = form.querySelector("[type=submit]");
        ocupado(botao, true, "Um instante…");
        const primeira = await proxima();
        estado.atual = primeira.atual;
        estado.comentario = primeira.comentario;
        trocar(estado.atual ? "pergunta" : "arquivos");
      });
    },
    pergunta() {
      let escolhendo = false;
      palco.querySelectorAll("[data-resposta]").forEach(b => b.addEventListener("click", () => {
        if (escolhendo || andando) return;
        escolhendo = true;
        palco.querySelectorAll("[data-resposta]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        responder(b.dataset.resposta, b.querySelector("b").textContent);
      }));
      palco.querySelector("[data-pular]").addEventListener("click", async e => {
        if (escolhendo || andando) return;
        escolhendo = true;
        ocupado(e.currentTarget, true, "Pulando…");
        estado.respostas.push({ assunto: estado.atual.assunto, pergunta: estado.atual.pergunta, resposta: "", valor: null });
        const seguinte = await proxima();
        estado.atual = seguinte.atual;
        estado.comentario = "";
        trocar(estado.atual ? "pergunta" : "arquivos");
      });
    },
    arquivos() { palco.querySelector("[data-seguir]").addEventListener("click", () => trocar("montagem")); },
    montagem() {
      palco.querySelector("[data-tentar]").addEventListener("click", e => { ocupado(e.currentTarget, true, "Tentando…"); terminar().finally(() => ocupado(e.currentTarget, false)); });
      terminar();
    },
  };

  // "Fazer depois": o painel abre, e o Início guarda o passo "Terminar de montar o painel"
  el.querySelector("[data-depois]").addEventListener("click", async e => {
    ocupado(e.currentTarget, true, "Abrindo…");
    const antes = conta.ajustes || {};
    const ajustes = { ...antes, onboarding: { ...(antes.onboarding || {}), pendente: false, adiado: true } };
    registrar("conversa_adiada");
    await banco.resultado(banco.tabela("contas").update({ ajustes }).eq("id", conta.conta_id)).catch(() => null);
    conta.ajustes = ajustes;
    await sessao.carregarContas().catch(() => null);
    navegar("/", { substituir: true });
  });

  if (estado.passo === "montagem") estado.passo = "arquivos"; // a montagem recomeça pelo último cartão
  desenhar();
}
