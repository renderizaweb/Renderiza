// "Para quem?" (05, "Como isso aparece na tela"; 09): criar pedido, reserva, compromisso, contrato ou parcela começa
// por este campo. Busca por nome ou WhatsApp, os mais recentes primeiro, e "+ novo cliente" ali mesmo (nome e
// WhatsApp; o resto depois). Uma peça só, usada em todos os módulos. Também: o nome do cliente sempre clicável
// (abre a ficha, para quem tem o módulo Clientes, ou um cartão com nome e contato).

import { abrirFolha } from "./gaveta.js";
import { avisar } from "./aviso.js";
import { icone } from "./icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "./formulario.js";
import { normalizarWhatsapp, telefone, whatsappValido, iniciais } from "./formatos.js";
import { botoesWhatsapp, ligarCopiar } from "./whatsapp.js";

const COLUNAS = "id, nome, whatsapp, email, instagram, origem, arquivado_em";

/** O texto digitado vira busca por nome (sem os caracteres que a API usa) e por WhatsApp (só os números). */
export function termoDeBusca(texto) {
  const t = String(texto || "").trim();
  const nome = t.replace(/[,()*%\\"'.:]/g, " ").replace(/\s+/g, " ").trim();
  const digitos = t.replace(/\D/g, "");
  return { nome, digitos: digitos.length >= 3 ? normalizarWhatsapp(digitos) || digitos : "" };
}

/** Os clientes da conta que batem com o texto (vazio: os mexidos por último). Sem os arquivados. */
export async function buscarClientes(banco, conta, texto, limite = 8) {
  const { nome, digitos } = termoDeBusca(texto);
  let q = banco.tabela("clientes").select(COLUNAS).eq("conta_id", conta.conta_id).is("arquivado_em", null).limit(limite);
  if (!nome && !digitos) q = q.order("atualizado_em", { ascending: false });
  else {
    const filtros = [];
    if (nome && !/^\d+$/.test(nome.replace(/\s/g, ""))) filtros.push(`nome.ilike.*${nome}*`);
    if (digitos) filtros.push(`whatsapp.like.*${digitos}*`);
    q = q.or(filtros.join(",")).order("nome");
  }
  return banco.resultado(q);
}

/** Cria o cliente (nome e WhatsApp). WhatsApp que já existe na conta: devolve o cliente que já existe. */
export async function criarCliente(banco, conta, { nome, whatsapp, origem = null }) {
  const numero = normalizarWhatsapp(whatsapp);
  if (numero) {
    const ja = await banco.resultado(banco.tabela("clientes").select(COLUNAS).eq("conta_id", conta.conta_id).eq("whatsapp", numero).maybeSingle());
    if (ja) return { cliente: ja, jaExistia: true };
  }
  const cliente = await banco.resultado(banco.tabela("clientes").insert({ conta_id: conta.conta_id, nome: nome.trim(), whatsapp: numero, origem }).select(COLUNAS).single());
  return { cliente, jaExistia: false };
}

function linhaDoCliente(c) {
  const contato = c.whatsapp ? telefone(c.whatsapp) : c.email || c.instagram || "";
  return `<li><button type="button" data-cliente="${escapar(c.id)}">
      <span class="rz-avatar rz-avatar--cliente" aria-hidden="true">${escapar(iniciais(c.nome))}</span>
      <span class="rz-linha-texto"><b>${escapar(c.nome)}</b>${contato ? `<small>${escapar(contato)}</small>` : ""}</span>
    </button></li>`;
}

function formularioNovo(termo) {
  const { digitos } = termoDeBusca(termo);
  const soNumero = digitos && /^[\d\s()+-]+$/.test(termo);
  return `<form class="rz-pilha" data-novo novalidate>
      <div role="alert" hidden></div>
      <div class="rz-campo">
        <label class="rz-rotulo" for="pq-nome">Nome</label>
        <input id="pq-nome" class="rz-entrada" name="nome" autocomplete="off" enterkeyhint="next" value="${soNumero ? "" : escapar(termo)}" placeholder="Ex.: Camila & Rafael">
        <p class="rz-erro-campo" hidden></p>
      </div>
      <div class="rz-campo">
        <label class="rz-rotulo" for="pq-whats">WhatsApp <span class="rz-texto-3">(com DDD)</span></label>
        <input id="pq-whats" class="rz-entrada" name="whatsapp" type="tel" inputmode="tel" autocomplete="off" enterkeyhint="done" value="${soNumero ? escapar(termo) : ""}" placeholder="(11) 98888-7777">
        <p class="rz-erro-campo" hidden></p>
      </div>
      <button class="rz-botao rz-botao--primario rz-botao--grande rz-botao--bloco" type="submit">Salvar e escolher</button>
    </form>`;
}

/** Valida o novo cliente; devolve { nome, whatsapp } ou os erros por campo. */
export function validarNovoCliente({ nome, whatsapp }) {
  const erros = {};
  if (!String(nome || "").trim()) erros.nome = "Digite o nome do cliente.";
  if (String(whatsapp || "").trim() && !whatsappValido(whatsapp)) erros.whatsapp = "Confira o WhatsApp: DDD e número.";
  return erros;
}

/**
 * Abre o "Para quem?" e resolve com o cliente escolhido (ou criado), ou null se a pessoa fechar.
 * `permitirNovo`: mostra "+ novo cliente" (quem edita algum módulo pode criar; o banco confere).
 */
export function abrirParaQuem({ banco, conta, titulo = "Para quem?", permitirNovo = true }) {
  return new Promise(resolver => {
    let escolhido = null;
    let resultados = [];
    const folha = abrirFolha({
      titulo,
      corpo: `<div class="rz-campo">
          <label class="rz-rotulo" for="pq-busca">Nome ou WhatsApp</label>
          <input id="pq-busca" class="rz-entrada" type="search" autocomplete="off" enterkeyhint="search" placeholder="Busque ou escreva um nome novo" autofocus>
        </div>
        <div data-resultados aria-live="polite"></div>`,
      aoFechar: () => resolver(escolhido),
    });
    const busca = folha.corpo.querySelector("#pq-busca");
    const lugar = folha.corpo.querySelector("[data-resultados]");
    let vez = 0;

    const desenhar = termo => {
      const novo = permitirNovo ? `<button class="rz-botao rz-botao--bloco rz-para-quem-novo" type="button" data-novo-cliente>${icone("adicionar")}${termo ? `Novo cliente: <b>${escapar(termo)}</b>` : "Novo cliente"}</button>` : "";
      lugar.innerHTML = (resultados.length
        ? `<p class="rz-texto-3">${termo ? "Encontrados" : "Mexidos por último"}</p><ul class="rz-lista-acoes rz-lista-clientes">${resultados.map(linhaDoCliente).join("")}</ul>`
        : termo ? `<p class="rz-texto-2">Nenhum cliente com “${escapar(termo)}”.</p>` : "") + novo;
    };
    const procurar = async () => {
      const minha = ++vez;
      const termo = busca.value.trim();
      try {
        const r = await buscarClientes(banco, conta, termo);
        if (minha !== vez) return;
        resultados = r;
        desenhar(termo);
      } catch (e) {
        if (minha === vez) lugar.innerHTML = `<p class="rz-erro-campo">${icone("alerta", { tamanho: 16 })}<span>${escapar(e.message)}</span></p>`;
      }
    };
    let espera = null;
    busca.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(procurar, 200); });
    busca.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); lugar.querySelector("[data-cliente], [data-novo-cliente]")?.click(); }
    });
    procurar();

    lugar.addEventListener("click", e => {
      const b = e.target.closest("[data-cliente]");
      if (b) {
        escolhido = resultados.find(c => c.id === b.dataset.cliente) || null;
        folha.fechar();
        return;
      }
      if (!e.target.closest("[data-novo-cliente]")) return;
      lugar.innerHTML = formularioNovo(busca.value.trim());
      busca.closest(".rz-campo").hidden = true;
      const form = lugar.querySelector("form");
      form.nome.value ? form.whatsapp.focus() : form.nome.focus();
      form.addEventListener("submit", async ev => {
        ev.preventDefault();
        const dados = { nome: form.nome.value, whatsapp: form.whatsapp.value };
        const erros = validarNovoCliente(dados);
        erroNoCampo(form.nome, erros.nome);
        erroNoCampo(form.whatsapp, erros.whatsapp);
        if (erros.nome || erros.whatsapp) return (erros.nome ? form.nome : form.whatsapp).focus();
        const botao = form.querySelector("[type=submit]");
        ocupado(botao, true, "Salvando…");
        try {
          const { cliente, jaExistia } = await criarCliente(banco, conta, dados);
          escolhido = cliente;
          folha.fechar();
          avisar(jaExistia ? `Esse WhatsApp já era de ${cliente.nome}: usei a ficha que já existe.` : `${cliente.nome} entrou nos clientes.`);
        } catch (erro) {
          ocupado(botao, false);
          avisoDoFormulario(form.querySelector("[role=alert]"), erro.message);
        }
      });
    });
  });
}

/** O "+ Novo cliente" das ações rápidas, para quem não tem o módulo Clientes: o mesmo formulário, sem a busca. */
export async function novoCliente({ banco, conta }) {
  const folha = abrirFolha({ titulo: "Novo cliente", corpo: formularioNovo("") });
  const form = folha.corpo.querySelector("form");
  form.querySelector("[type=submit]").textContent = "Salvar";
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const dados = { nome: form.nome.value, whatsapp: form.whatsapp.value };
    const erros = validarNovoCliente(dados);
    erroNoCampo(form.nome, erros.nome);
    erroNoCampo(form.whatsapp, erros.whatsapp);
    if (erros.nome || erros.whatsapp) return;
    const botao = form.querySelector("[type=submit]");
    ocupado(botao, true, "Salvando…");
    try {
      const { cliente, jaExistia } = await criarCliente(banco, conta, dados);
      folha.fechar();
      avisar(jaExistia ? `Esse WhatsApp já é de ${cliente.nome}.` : `${cliente.nome} entrou nos clientes.`);
    } catch (erro) {
      ocupado(botao, false);
      avisoDoFormulario(form.querySelector("[role=alert]"), erro.message);
    }
  });
}

/** O nome do cliente, clicável em qualquer lugar: a ficha (módulo Clientes) ou o cartão com nome e contato. */
export function abrirCliente({ cliente, pode, navegar, mensagem = "" }) {
  if (pode("clientes", "ver")) return navegar(`/clientes?cliente=${encodeURIComponent(cliente.id)}`);
  const contatos = [
    cliente.whatsapp && `<li>${icone("telefone", { tamanho: 18 })}<span>${escapar(telefone(cliente.whatsapp))}</span></li>`,
    cliente.email && `<li>${icone("carta", { tamanho: 18 })}<a href="mailto:${escapar(cliente.email)}">${escapar(cliente.email)}</a></li>`,
    cliente.instagram && `<li>${icone("link", { tamanho: 18 })}<a href="https://instagram.com/${escapar(cliente.instagram)}" target="_blank" rel="noopener">@${escapar(cliente.instagram)}</a></li>`,
  ].filter(Boolean);
  const folha = abrirFolha({
    titulo: cliente.nome,
    corpo: `${contatos.length ? `<ul class="rz-contatos">${contatos.join("")}</ul>` : `<p class="rz-texto-2">Ainda sem contato cadastrado.</p>`}
      ${cliente.whatsapp ? botoesWhatsapp(cliente.whatsapp, mensagem) : ""}`,
  });
  ligarCopiar(folha.corpo);
}
