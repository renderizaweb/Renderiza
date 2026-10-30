// Admin · Contas (Missão 5A; 02): todas as contas pela situação (para aprovar, ativas, em teste, desligadas), com o
// nicho, desde quando e o último acesso; a gaveta da conta (conta.js: aprovar, prazo, desligar, religar, módulos,
// pessoas, pagamentos, entrar para ajudar, exportar a pedido) e criar uma conta à mão (nova.js).

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { dataNumerica } from "../../ui/formatos.js";
import { nicho } from "../../nichos/index.js";
import { carregarContas } from "../dados.js";
import { chipsDeContas, filtrarContas, estadoDaConta, ultimoAcesso } from "../logica.js";
import { abrirConta } from "./conta.js";
import { abrirNovaConta } from "./nova.js";

export async function montar(el, contexto) {
  const { banco, avisar } = contexto;
  const params = new URLSearchParams(location.search);
  let dados = { contas: [], catalogo: [] };
  let filtro = { grupo: null, busca: "" };
  const ctx = { ...contexto, recarregar: () => atualizar() };

  el.innerHTML = `
    <header class="rz-cabeca">
      <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Contas</h1>
        <p class="rz-texto-2">Todas as contas do painel: aprovar os cadastros, dar prazo, desligar quem não pagou e criar a conta de quem fechou com a Renderiza.</p></div>
      <div class="rz-cabeca-acoes"><button class="rz-botao rz-botao--primario" type="button" data-nova>${icone("adicionar", { tamanho: 18 })}Criar conta</button></div>
    </header>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const linha = c => {
    const e = estadoDaConta(c);
    const sub = [nicho(c.nicho).nome, `desde ${dataNumerica(new Date(c.criado_em))}`, `${c.ativas} ${c.ativas === 1 ? "pessoa" : "pessoas"}`, ultimoAcesso([c.vistoEm])].join(" · ");
    return `<li><button class="rz-linha" type="button" data-conta="${escapar(c.id)}">
        <span class="rz-conta-sinal" aria-hidden="true">${escapar(c.nome.slice(0, 2).toUpperCase())}</span>
        <span class="rz-linha-texto"><b>${escapar(c.nome)}</b><small>${escapar(sub)}</small></span>
        <span class="rz-linha-fim"><span class="rz-etiqueta${e.tom ? ` rz-etiqueta--${e.tom}` : ""}">${escapar(e.nome)}</span>${e.sub ? `<small>${escapar(e.sub)}</small>` : ""}</span></button></li>`;
  };
  const lista = () => {
    const l = filtrarContas(dados.contas, filtro);
    return l.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-cartao rz-linhas--contas">${l.map(linha).join("")}</ul>`
      : `<p class="rz-estado-curto">${filtro.busca ? "Nada com essa busca." : "Nada aqui."}</p>`;
  };

  function desenhar() {
    if (!dados.contas.length) {
      corpo.innerHTML = vazio({ icone: "inicio", titulo: "Nenhuma conta ainda", texto: "Crie a conta do primeiro cliente: ela já nasce ativa, e o dono recebe o convite por e-mail.", acao: { rotulo: "Criar conta", dado: "nova" } });
      return;
    }
    if (!filtro.grupo) filtro.grupo = chipsDeContas(dados.contas).find(c => c.valor === "aprovar").quantos ? "aprovar" : "todas";
    corpo.innerHTML = `
      <div class="rz-barra-ferramentas">
        <input class="rz-entrada rz-campo-busca" type="search" placeholder="Buscar pelo nome, código ou e-mail do dono" aria-label="Buscar conta" value="${escapar(filtro.busca)}" data-busca>
        ${chips({ rotulo: "Contas", opcoes: chipsDeContas(dados.contas), ativo: filtro.grupo })}
      </div>
      <div data-lista>${lista()}</div>`;
    const busca = corpo.querySelector("[data-busca]");
    busca.addEventListener("input", () => { filtro.busca = busca.value; corpo.querySelector("[data-lista]").innerHTML = lista(); });
    ligarChips(corpo.querySelector(".rz-barra-ferramentas .rz-chips"), v => { filtro.grupo = v; desenhar(); });
  }

  const carregar = () => carregarContas(banco);
  async function atualizar() { try { dados = await carregar(); desenhar(); } catch (e) { avisar(e.message, { tipo: "erro" }); } }

  let carregou = null; // a primeira carga: "Criar conta" antes dela abria o formulário sem os módulos
  el.addEventListener("click", async e => {
    if (e.target.closest("[data-nova], [data-acao=nova]")) { await carregou; return abrirNovaConta({ ...ctx, catalogo: dados.catalogo }); }
    const b = e.target.closest("[data-conta]");
    if (b && corpo.contains(b)) { const c = dados.contas.find(x => x.id === b.dataset.conta); if (c) abrirConta(c, { ...ctx, catalogo: dados.catalogo }); }
  });

  carregou = comEstados(corpo, { carregar, desenhar: d => { dados = d; desenhar(); }, linhas: 6 });
  await carregou;

  // ?conta=<id> (dos Pagamentos e de Pessoas), ?nova=1
  if (params.has("conta") || params.has("nova")) history.replaceState(history.state, "", location.pathname);
  const pedida = params.get("conta") && dados.contas.find(c => c.id === params.get("conta"));
  if (pedida) abrirConta(pedida, { ...ctx, catalogo: dados.catalogo });
  else if (params.get("nova")) abrirNovaConta({ ...ctx, catalogo: dados.catalogo });
}
