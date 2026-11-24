// Estoque (docs/painel-clientes/12-modulo-estoque.md): o que a conta vende no site (os carros, numa revenda). A tela é
// a do protótipo aprovado (exemplos/estoque/modulo.js, o vídeo da Ricardo Motors), agora sobre o banco
// (./loja.js): a lista com chips e busca, as ações de um toque (vendido com Desfazer, reservar, destacar, ocultar) e a
// gaveta com fotos primeiro, os campos do nicho (./esquemas.js), preço, selos e situação. Salvou, está no site em
// menos de 1 minuto (o cache da API pública é de 20 s). Quem "só vê" lê a lista e abre os itens, sem mudar nada.

import { icone } from "../../ui/icones.js";
import { escapar, ocupado } from "../../ui/formulario.js";
import { campoTexto, campoArea, campoSelecao, interruptor, segmentos, lerFormulario } from "../../ui/campos.js";
import { abrirGaveta, abrirFolha, confirmar } from "../../ui/gaveta.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { vazio } from "../../ui/estados.js";
import { moeda, lerValor } from "../../ui/formatos.js";
import { ESQUEMAS, SITUACOES, situacao, camposDe } from "./esquemas.js";
import { criarLoja, urlDaFoto } from "./loja.js";

const MAX_FOTOS = 15;
const nomeDoErro = e => (e && e.message && !/fetch|network|JWT|PGRST/i.test(e.message) ? e.message : "Não deu certo. Confira a internet e tente de novo.");

/** O que o formulário vira no item (os campos do nicho já no tipo certo), ou o erro para mostrar. */
export function lerItem(esquema, d) {
  const campos = {};
  for (const c of camposDe(esquema)) {
    if (c.tipo === "simnao") campos[c.id] = !!d[c.id];
    else if (c.tipo === "marcar") campos[c.id] = [].concat(d[c.id] || []);
    else if (c.tipo === "numero") campos[c.id] = d[c.id] ? Number(String(d[c.id]).replace(/\D/g, "")) || null : null;
    else campos[c.id] = String(d[c.id] || "").trim();
  }
  const falta = camposDe(esquema).filter(c => c.obrigatorio && !campos[c.id]).map(c => c.rotulo);
  if (falta.length) return { erro: `Falta preencher: ${falta.join(" e ")}.` };
  const preco = d.preco ? lerValor(d.preco) : null;
  if (d.preco && preco == null) return { erro: "O preço não ficou claro. Escreva só os números, como 237.990." };
  const precoAntes = d.preco_antes ? lerValor(d.preco_antes) : null;
  return { item: { campos, preco, preco_antes: precoAntes, selos: [].concat(d.selos || []), descricao: String(d.descricao || "").trim(), situacao: d.situacao || "disponivel", destaque: !!d.destaque } };
}

export async function montar(el, { banco, conta, nicho, pode, avisar }) {
  const esquema = ESQUEMAS[conta.nicho];
  if (!esquema) {
    el.innerHTML = vazio({ icone: "estoque", titulo: "O Estoque ainda não tem o jeito do seu negócio", texto: "Fale com a Renderiza: a gente monta os campos do que você vende." });
    return;
  }
  const edita = pode("estoque", "editar");
  const ITEM = esquema.item, ITENS = esquema.itens;
  const novoRotulo = (nicho.palavras && nicho.palavras.novoItem) || esquema.novo;
  const loja = criarLoja({ banco, conta });
  let filtro = "todos", busca = "";

  el.innerHTML = `
    <section class="et">
      <header class="rz-cabeca">
        <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Estoque</h1>
          <p class="rz-texto-2">Os ${ITENS} do seu site. Salvou aqui, aparece no site em menos de 1 minuto.</p></div>
        ${edita ? `<div class="rz-cabeca-acoes"><button class="rz-botao rz-botao--primario" type="button" data-novo-item>${icone("adicionar", { tamanho: 18 })}${escapar(novoRotulo)}</button></div>` : ""}
      </header>
      ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê o estoque. Quem muda é o dono ou quem ele deixar.</span></p>` : ""}
      <div class="et-ferramentas" data-filtros></div>
      <label class="et-busca">${icone("buscar", { tamanho: 18 })}<input class="rz-entrada" type="search" placeholder="Buscar por marca, modelo ou ano" aria-label="Buscar no estoque" data-busca></label>
      <div data-lista aria-live="polite"><div class="rz-cartao"><div class="rz-linhas">${'<div class="rz-linha et-linha et-linha--esqueleto"><span class="et-mini"></span><span class="rz-linha-texto"><b>&nbsp;</b><small>&nbsp;</small></span></div>'.repeat(4)}</div></div></div>
    </section>`;
  const lista = el.querySelector("[data-lista]"), filtros = el.querySelector("[data-filtros]");

  // ---------- a lista ----------
  const quantos = s => loja.listar().filter(i => s === "todos" || i.situacao === s).length;
  function desenharFiltros() {
    const opcoes = [{ valor: "todos", rotulo: "Todos", quantos: quantos("todos") },
      ...SITUACOES.map(s => ({ valor: s.valor, rotulo: s.plural, quantos: quantos(s.valor) })).filter(o => o.quantos || o.valor === "disponivel")];
    filtros.innerHTML = chips({ rotulo: "Filtrar por situação", opcoes, ativo: filtro });
  }
  const casa = (i, q) => !q || [esquema.titulo(i.campos), esquema.linha(i.campos), esquema.resumo(i.campos), i.codigo_interno].join(" ").toLowerCase().includes(q);
  function desenharLista() {
    const q = busca.trim().toLowerCase();
    const itens = loja.listar().filter(i => (filtro === "todos" || i.situacao === filtro) && casa(i, q));
    if (!itens.length) {
      lista.innerHTML = loja.listar().length && (q || filtro !== "todos")
        ? `<p class="rz-texto-2 et-nada">Nada com esse filtro. <button class="rz-link" type="button" data-limpar>Ver todos</button></p>`
        : vazio({ icone: "estoque", titulo: `Nenhum ${ITEM} aqui ainda`, texto: esquema.vazio, acao: edita ? { rotulo: novoRotulo, dado: "novo" } : null });
      return;
    }
    lista.innerHTML = `<div class="rz-cartao"><div class="rz-linhas">${itens.map(i => {
      const s = situacao(i.situacao), foto = i.fotos && i.fotos[0], titulo = esquema.titulo(i.campos);
      return `<div class="rz-linha et-linha${s.noSite ? "" : " et-linha--fora"}" data-id="${escapar(i.id)}" role="button" tabindex="0" aria-label="${edita ? "Editar" : "Ver"} ${escapar(titulo)}">
        ${foto ? `<img class="et-mini" src="${escapar(urlDaFoto(foto))}" alt="" loading="lazy" decoding="async">` : `<span class="et-mini et-mini--vazia">${icone("camera", { tamanho: 20 })}</span>`}
        <span class="rz-linha-texto">
          <span class="rz-linha-titulo"><b>${escapar(titulo)}</b>${i.destaque ? `<span class="et-estrela" title="Destaque">${icone("estrela", { tamanho: 14 })}</span>` : ""}</span>
          <small>${escapar(esquema.resumo(i.campos) || esquema.linha(i.campos))}</small>
          <span class="et-preco-linha"><b>${i.preco != null ? moeda(i.preco) : "Sob consulta"}</b>${s.valor !== "disponivel" ? `<span class="rz-etiqueta${s.etiqueta ? " rz-etiqueta--" + s.etiqueta : ""}">${s.rotulo}</span>` : ""}</span>
        </span>
        ${edita ? `<button class="rz-botao rz-botao--fantasma et-acoes" type="button" data-acoes aria-label="Ações de ${escapar(titulo)}">${icone("mais", { tamanho: 20 })}</button>` : ""}
      </div>`;
    }).join("")}</div></div>`;
  }
  const tudo = () => { desenharFiltros(); desenharLista(); };
  ligarChips(filtros, v => { filtro = v; desenharLista(); });
  el.querySelector("[data-busca]").addEventListener("input", e => { busca = e.target.value; desenharLista(); });
  loja.aoMudar(tudo);

  // ---------- ações de um toque ----------
  async function mudar(i, patch, texto, { desfazer = true } = {}) {
    const antes = { situacao: i.situacao, destaque: i.destaque };
    try {
      await loja.mudar(i.id, patch);
      avisar(texto, desfazer ? { desfazer: () => loja.mudar(i.id, antes).catch(e => avisar(nomeDoErro(e), { tipo: "erro" })) } : {});
    } catch (e) { avisar(nomeDoErro(e), { tipo: "erro" }); }
  }
  function acoes(i) {
    const nome = esquema.titulo(i.campos);
    const linha = (dado, ic, rotulo) => `<button class="rz-linha" type="button" data-fazer="${dado}">${icone(ic)}<span class="rz-linha-texto"><b>${rotulo}</b></span></button>`;
    const f = abrirFolha({ titulo: nome, subtitulo: escapar(esquema.resumo(i.campos)), corpo: `<div class="rz-linhas">
      ${linha("editar", "editar", "Editar")}
      ${i.situacao !== "vendido" ? linha("vendido", "ok", esquema.fim === "vendido" ? "Marcar como vendido" : "Marcar como esgotado") : linha("disponivel", "desfazer", "Voltar a vender")}
      ${i.situacao === "disponivel" ? linha("reservado", "relogio", "Reservar") : i.situacao === "reservado" ? linha("disponivel", "desfazer", "Tirar a reserva") : ""}
      ${situacao(i.situacao).noSite ? linha("destaque", "estrela", i.destaque ? "Tirar do destaque" : "Destacar no site") : ""}
      ${i.situacao !== "oculto" ? linha("oculto", "olho", "Tirar do site") : linha("disponivel", "olho", "Pôr no site")}
    </div>` });
    f.corpo.addEventListener("click", e => {
      const b = e.target.closest("[data-fazer]");
      if (!b) return;
      f.fechar();
      const o = b.dataset.fazer;
      if (o === "editar") return editar(i);
      if (o === "destaque") return mudar(i, { destaque: !i.destaque }, i.destaque ? `${nome}: saiu do destaque.` : `${nome}: em destaque, aparece primeiro no site.`, { desfazer: false });
      const fora = o === "vendido" || o === "oculto" ? { destaque: false } : {};
      const texto = { vendido: `${nome}: vendido. Sai do site em até 1 minuto.`, reservado: `${nome}: reservado. No site, aparece com a etiqueta.`,
        oculto: `${nome}: fora do site.`, disponivel: `${nome}: no site de novo.` }[o];
      return mudar(i, { situacao: o, ...fora }, texto);
    });
  }

  // ---------- adicionar e editar ----------
  function campo(c, valor, travado) {
    const id = "et-" + c.id;
    if (c.tipo === "simnao") return interruptor({ nome: c.id, rotulo: c.rotulo, marcado: valor === true });
    if (c.tipo === "lista") return campoSelecao({ id, nome: c.id, rotulo: c.rotulo, valor: valor || "", opcoes: [{ valor: "", rotulo: "Escolher" }, ...c.opcoes.map(o => ({ valor: o, rotulo: o }))], opcional: !c.obrigatorio });
    if (c.tipo === "marcar") return `<fieldset class="rz-campo"><legend class="rz-rotulo">${escapar(c.rotulo)}</legend><div class="et-marcar">${[...new Set([...c.opcoes, ...(Array.isArray(valor) ? valor : [])])].map(o =>
      `<label><input type="checkbox" name="${c.id}" value="${escapar(o)}"${Array.isArray(valor) && valor.includes(o) ? " checked" : ""}${travado ? " disabled" : ""}><span>${escapar(o)}</span></label>`).join("")}</div></fieldset>`;
    const sugestoes = c.sugerir ? [...new Set(loja.listar().map(i => i.campos && i.campos[c.id]).filter(Boolean))] : [];
    return campoTexto({ id, nome: c.id, rotulo: c.rotulo + (c.sufixo ? ` (${c.sufixo})` : ""), valor: valor ?? "", teclado: c.tipo === "numero" ? "numeric" : undefined,
      placeholder: c.placeholder, opcional: !c.obrigatorio && c.tipo !== "numero" ? true : undefined, extra: { ...(c.maximo ? { maxlength: c.maximo } : {}), ...(sugestoes.length ? { list: "et-sug-" + c.id } : {}) } })
      + (sugestoes.length ? `<datalist id="et-sug-${c.id}">${sugestoes.map(s => `<option value="${escapar(s)}">`).join("")}</datalist>` : "");
  }

  function editar(original) {
    const novo = !original;
    const i = original ? JSON.parse(JSON.stringify(original)) : { situacao: "disponivel", destaque: false, campos: {}, selos: [], fotos: [], preco: null, descricao: "" };
    const fotos = [...(i.fotos || [])];
    const enviadas = []; // as que subiram nesta gaveta: apagadas se ela fechar sem salvar
    const tiradas = []; // as que já estavam salvas e saíram: apagadas depois de salvar
    let enviando = 0, salvo = false;
    const corpo = `<form class="rz-pilha et-form" novalidate data-form>
      <section class="et-bloco"><h3 class="rz-titulo-3">Fotos</h3><p class="rz-texto-3">A primeira é a capa. Do celular, dá para tirar na hora.</p><div class="et-fotos" data-fotos></div></section>
      ${esquema.grupos.map(g => `<section class="et-bloco"><h3 class="rz-titulo-3">${escapar(g.titulo)}</h3><div class="et-campos">${g.campos.map(c =>
        `<div class="${c.meio ? "et-meio" : "et-inteiro"}">${campo(c, i.campos[c.id], !edita)}</div>`).join("")}</div></section>`).join("")}
      <section class="et-bloco"><h3 class="rz-titulo-3">Preço e selos</h3><div class="et-campos">
        <div class="et-meio">${campoTexto({ id: "et-preco", nome: "preco", rotulo: "Preço (R$)", valor: i.preco != null ? Number(i.preco).toLocaleString("pt-BR") : "", teclado: "decimal", ajuda: "Vazio: aparece \"sob consulta\"" })}</div>
        <div class="et-meio">${campoTexto({ id: "et-preco-antes", nome: "preco_antes", rotulo: "Preço anterior (R$)", valor: i.preco_antes ? Number(i.preco_antes).toLocaleString("pt-BR") : "", teclado: "decimal", opcional: true, ajuda: "Para mostrar que baixou" })}</div>
        <div class="et-inteiro"><fieldset class="rz-campo"><legend class="rz-rotulo">Selos</legend><div class="et-marcar">${esquema.selos.map(s =>
          `<label><input type="checkbox" name="selos" value="${escapar(s)}"${(i.selos || []).includes(s) ? " checked" : ""}><span>${escapar(s)}</span></label>`).join("")}</div></fieldset></div>
        <div class="et-inteiro">${campoArea({ id: "et-descricao", nome: "descricao", rotulo: "Sobre este " + ITEM, valor: i.descricao || "", opcional: true, linhas: 4 })}</div>
      </div></section>
      <section class="et-bloco"><h3 class="rz-titulo-3">No site</h3>
        <div class="rz-campo"><span class="rz-rotulo">Situação</span>${segmentos({ nome: "situacao", rotulo: "Situação", opcoes: SITUACOES.map(s => ({ valor: s.valor, rotulo: s.rotulo })), valor: i.situacao })}</div>
        ${interruptor({ nome: "destaque", rotulo: "Destaque", ajuda: "Aparece primeiro na vitrine do site", marcado: !!i.destaque })}
      </section>
      <p class="rz-alerta rz-alerta--erro" data-erro role="alert" hidden></p>
    </form>`;
    const rodape = edita ? `${novo ? "" : `<button class="rz-botao rz-botao--fantasma rz-botao--perigo" type="button" data-excluir>${icone("lixo", { tamanho: 18 })}Excluir</button>`}
      <button class="rz-botao" type="button" data-fechar>Cancelar</button>
      <button class="rz-botao rz-botao--primario" type="button" data-salvar>${novo ? "Salvar e pôr no site" : "Salvar"}</button>` : `<button class="rz-botao" type="button" data-fechar>Fechar</button>`;
    const g = abrirGaveta({
      titulo: novo ? novoRotulo : esquema.titulo(i.campos), subtitulo: novo ? "Preencha o que souber; dá para completar depois." : escapar(esquema.resumo(i.campos)), corpo, rodape, foco: "fechar",
      aoFechar: () => { if (!salvo && enviadas.length) loja.tirarArquivos(enviadas).catch(() => {}); },
    });
    g.el.classList.add("et-gaveta");
    const caixaFotos = g.corpo.querySelector("[data-fotos]"), form = g.corpo.querySelector("[data-form]"), erro = g.corpo.querySelector("[data-erro]");
    if (!edita) form.querySelectorAll("input, select, textarea, button").forEach(x => { x.disabled = true; });

    function desenharFotos() {
      caixaFotos.innerHTML = fotos.map((f, k) => `<figure class="et-foto">
          <img src="${escapar(urlDaFoto(f))}" alt="Foto ${k + 1}" decoding="async">
          ${k === 0 ? '<span class="et-capa">Capa</span>' : edita ? `<button type="button" class="et-foto-b et-foto-capa" data-capa="${k}" aria-label="Usar como capa">${icone("estrela", { tamanho: 14 })}</button>` : ""}
          ${edita ? `<button type="button" class="et-foto-b et-foto-tirar" data-tirar="${k}" aria-label="Tirar a foto ${k + 1}">${icone("fechar", { tamanho: 14 })}</button>` : ""}
        </figure>`).join("")
        + '<figure class="et-foto et-foto--subindo" aria-hidden="true"></figure>'.repeat(enviando)
        + (edita && fotos.length + enviando < MAX_FOTOS ? `<label class="et-foto et-foto--mais">${icone("camera", { tamanho: 22 })}<span>Adicionar fotos</span>
          <input type="file" accept="image/*" multiple hidden data-enviar></label>` : "");
      if (enviando) caixaFotos.setAttribute("aria-busy", "true"); else caixaFotos.removeAttribute("aria-busy");
    }
    desenharFotos();
    caixaFotos.addEventListener("click", e => {
      const capa = e.target.closest("[data-capa]"), tirar = e.target.closest("[data-tirar]");
      if (capa) { fotos.unshift(...fotos.splice(+capa.dataset.capa, 1)); desenharFotos(); }
      if (tirar) { const [f] = fotos.splice(+tirar.dataset.tirar, 1); (enviadas.includes(f) ? enviadas : tiradas).push(f); desenharFotos(); }
    });
    caixaFotos.addEventListener("change", async e => {
      if (!e.target.matches("[data-enviar]")) return;
      const arquivos = [...e.target.files].slice(0, MAX_FOTOS - fotos.length - enviando);
      enviando += arquivos.length;
      desenharFotos();
      // uma de cada vez, na ordem escolhida (a primeira vira a capa), sem travar o formulário
      for (const a of arquivos) {
        try { const f = await loja.enviarFoto(a); fotos.push(f); enviadas.push(f); }
        catch (x) { avisar(nomeDoErro(x) || "Uma das fotos não subiu.", { tipo: "erro" }); }
        enviando--;
        desenharFotos();
      }
    });

    const salvar = g.pe.querySelector("[data-salvar]");
    if (salvar) salvar.addEventListener("click", async () => {
      if (enviando) { erro.hidden = false; erro.textContent = "Espere as fotos terminarem de subir."; return; }
      const r = lerItem(esquema, lerFormulario(form));
      if (r.erro) { erro.hidden = false; erro.textContent = r.erro; erro.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      erro.hidden = true;
      ocupado(salvar, true, "Salvando…");
      try {
        const linha = await loja.salvar({ ...(original ? { id: original.id } : {}), ...r.item, fotos });
        salvo = true;
        g.fechar();
        if (tiradas.length) loja.tirarArquivos(tiradas).catch(() => {});
        const s = situacao(linha.situacao), titulo = esquema.titulo(linha.campos);
        avisar(s.noSite ? `${titulo}: salvo. Aparece no site em até 1 minuto.` : `${titulo}: salvo, fora do site (${s.rotulo.toLowerCase()}).`);
      } catch (e) {
        ocupado(salvar, false);
        erro.hidden = false;
        erro.textContent = nomeDoErro(e);
      }
    });
    const excluir = g.pe.querySelector("[data-excluir]");
    if (excluir) excluir.addEventListener("click", async () => {
      const titulo = esquema.titulo(i.campos);
      if (!(await confirmar({ titulo: `Excluir ${titulo}?`, texto: `Some do painel e do site, com as fotos. Para só tirar do site, use "Tirar do site".`, sim: "Excluir", perigo: true }))) return;
      try { salvo = true; g.fechar(); await loja.remover(original.id); avisar(`${titulo}: excluído.`); }
      catch (e) { avisar(nomeDoErro(e), { tipo: "erro" }); }
    });
  }

  // ---------- cliques ----------
  el.addEventListener("click", e => {
    if (edita && (e.target.closest("[data-novo-item]") || e.target.closest('[data-acao="novo"]'))) return editar(null);
    if (e.target.closest("[data-recarregar]")) return location.reload();
    if (e.target.closest("[data-limpar]")) { filtro = "todos"; busca = ""; el.querySelector("[data-busca]").value = ""; return tudo(); }
    const linha = e.target.closest(".et-linha[data-id]");
    if (!linha) return;
    const i = loja.achar(linha.dataset.id);
    if (!i) return;
    if (e.target.closest("[data-acoes]")) return acoes(i);
    editar(i);
  });
  el.addEventListener("keydown", e => {
    const linha = e.target.closest && e.target.closest(".et-linha[data-id]");
    if (linha && e.target === linha && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); const i = loja.achar(linha.dataset.id); if (i) editar(i); }
  });

  try {
    await loja.carregar();
  } catch (e) {
    lista.innerHTML = `<div class="rz-alerta rz-alerta--erro" role="alert">${icone("alerta", { tamanho: 18 })}<span>Não consegui abrir o estoque. ${escapar(nomeDoErro(e))} <button class="rz-link" type="button" data-recarregar>Tentar de novo</button></span></div>`;
    return;
  }
  if (edita && new URLSearchParams(location.search).get("novo") === "item") { history.replaceState(null, "", location.pathname); editar(null); }
}
