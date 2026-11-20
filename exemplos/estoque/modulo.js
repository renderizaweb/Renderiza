// Módulo Estoque (protótipo, Fase 0; docs/painel-clientes/12-modulo-estoque.md): a lista dos itens do site, com
// situação, destaque, fotos e os campos do nicho, e o site ao lado mudando na hora (a mesma prévia do Meu site).
// Mesmo contrato dos módulos do painel: montar(el, contexto). Usa só peças do painel de verdade (campos, gaveta,
// chips, aviso com Desfazer, estados, moeda). Na Fase 1, a `loja` (aqui, o navegador) vira o banco (estoque_itens).
//
// contexto: { esquema, loja, avisar, previa: { endereco } }
//   loja: listar, achar, salvar, mudar, remover, aoMudar (exemplos/estoque/loja-local.js)
//   previa.endereco: o site com ?rz-estoque=exemplo; o site recebe a lista por mensagem (como recebe do painel)

import { icone } from "/exemplos/painel/src/ui/icones.js";
import { escapar } from "/exemplos/painel/src/ui/formulario.js";
import { campoTexto, campoArea, campoSelecao, interruptor, segmentos, lerFormulario } from "/exemplos/painel/src/ui/campos.js";
import { abrirGaveta, abrirFolha } from "/exemplos/painel/src/ui/gaveta.js";
import { chips, ligarChips } from "/exemplos/painel/src/ui/filtros.js";
import { vazio } from "/exemplos/painel/src/ui/estados.js";
import { moeda, lerValor } from "/exemplos/painel/src/ui/formatos.js";
import { SITUACOES, situacao, camposDe, selosDoItem } from "./esquemas.js";

const TELAS = { celular: 390, computador: 1280 };
const novoId = () => "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** O que o site recebe: só o que aparece (disponível e reservado), destaque primeiro. É o contrato da API pública. */
export function paraOSite(esquema, itens) {
  const noSite = itens.filter(i => situacao(i.situacao).noSite);
  return [...noSite.filter(i => i.destaque), ...noSite.filter(i => !i.destaque)].map(i => ({
    id: i.id, titulo: esquema.titulo(i.campos), linha: esquema.linha(i.campos), campos: i.campos, preco: i.preco,
    preco_antes: i.preco_antes || null, selos: selosDoItem(esquema, i), situacao: i.situacao, destaque: !!i.destaque,
    descricao: i.descricao || "", fotos: (i.fotos || []).map(f => f.src),
  }));
}

/** A foto escolhida, reduzida no navegador antes de ir (lado maior 1600 px, WebP): chega boa e leve. */
async function reduzir(arquivo, lado = 1600, qualidade = 0.84) {
  const bmp = await createImageBitmap(arquivo);
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const tela = document.createElement("canvas");
  tela.width = w; tela.height = h;
  tela.getContext("2d").drawImage(bmp, 0, 0, w, h);
  return { src: tela.toDataURL("image/webp", qualidade), largura: w, altura: h };
}

export async function montar(el, { esquema, loja, avisar, previa = null }) {
  let filtro = "todos", busca = "", tela = "celular", siteOuvindo = false, focoNoSite = null;
  const ITEM = esquema.item, ITENS = esquema.itens;

  el.innerHTML = `
    <section class="rz-ms et">
      <header class="rz-cabeca">
        <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Estoque</h1>
          <p class="rz-texto-2">Os ${ITENS} do seu site. Mudou aqui, muda no site na hora.</p></div>
        <div class="rz-cabeca-acoes"><button class="rz-botao rz-botao--primario" type="button" data-novo-item>${icone("adicionar", { tamanho: 18 })}${escapar(esquema.novo)}</button></div>
      </header>
      <div class="rz-ms-grade">
        <div class="rz-ms-editor">
          <div class="et-ferramentas" data-filtros></div>
          <label class="et-busca">${icone("buscar", { tamanho: 18 })}<input class="rz-entrada" type="search" placeholder="Buscar por marca, modelo ou ano" aria-label="Buscar no estoque" data-busca></label>
          <div data-lista></div>
        </div>
        ${previa ? `<aside class="rz-ms-previa" aria-label="O site, com o estoque de agora">
          <div class="rz-ms-barra">
            <button class="rz-botao rz-botao--pequeno rz-ms-fechar" type="button" data-fechar-previa>${icone("voltar", { tamanho: 16 })}Voltar ao estoque</button>
            <div class="rz-segmentos" role="group" aria-label="Tamanho da tela">
              <button type="button" data-tela="celular" aria-pressed="true">Celular</button><button type="button" data-tela="computador" aria-pressed="false">Computador</button>
            </div>
            <span class="rz-texto-3 rz-ms-dica">O seu site, com o estoque de agora</span>
          </div>
          <div class="rz-ms-palco" data-palco><iframe title="O seu site, com o estoque de agora" src="${escapar(previa.endereco)}" data-quadro></iframe></div>
        </aside>` : ""}
      </div>
      ${previa ? `<button class="rz-botao rz-botao--primario rz-ms-ver" type="button" data-ver>${icone("olho", { tamanho: 18 })}Ver o site</button>` : ""}
    </section>`;

  const raiz = el.querySelector(".et"), lista = el.querySelector("[data-lista]"), filtros = el.querySelector("[data-filtros]");
  const quadro = el.querySelector("[data-quadro]"), palco = el.querySelector("[data-palco]");

  // ---------- a prévia (o site ao lado) ----------
  function ajustar() {
    const grade = el.querySelector(".rz-ms-grade");
    if (grade) grade.style.setProperty("--rz-ms-altura", Math.max(420, innerHeight - (grade.getBoundingClientRect().top + scrollY) - 24) + "px");
    if (!palco || !palco.clientWidth) return;
    const largura = TELAS[tela], escala = Math.min(1, palco.clientWidth / largura);
    quadro.style.width = largura + "px";
    quadro.style.height = Math.round(palco.clientHeight / escala) + "px";
    quadro.style.transform = `scale(${escala})`;
    quadro.style.left = Math.max(0, Math.round((palco.clientWidth - largura * escala) / 2)) + "px";
  }
  function mandarAoSite() {
    if (!quadro || !siteOuvindo || !quadro.contentWindow) return;
    quadro.contentWindow.postMessage({ tipo: "rz-estoque", itens: paraOSite(esquema, loja.listar()), foco: focoNoSite }, location.origin);
    focoNoSite = null;
  }
  addEventListener("message", e => {
    if (e.origin !== location.origin || !quadro || e.source !== quadro.contentWindow || !e.data || e.data.tipo !== "rz-estoque-pronto") return;
    siteOuvindo = true;
    mandarAoSite();
  });
  if (palco) { new ResizeObserver(ajustar).observe(palco); addEventListener("resize", ajustar); setTimeout(ajustar, 0); }

  // ---------- a lista ----------
  const conta = s => loja.listar().filter(i => s === "todos" || i.situacao === s).length;
  function desenharFiltros() {
    const opcoes = [{ valor: "todos", rotulo: "Todos", quantos: conta("todos") },
      ...SITUACOES.map(s => ({ valor: s.valor, rotulo: s.plural, quantos: conta(s.valor) })).filter(o => o.quantos || o.valor === "disponivel")];
    filtros.innerHTML = chips({ rotulo: "Filtrar por situação", opcoes, ativo: filtro });
  }
  const casa = (i, q) => !q || [esquema.titulo(i.campos), esquema.linha(i.campos), esquema.resumo(i.campos)].join(" ").toLowerCase().includes(q);
  function desenharLista() {
    const q = busca.trim().toLowerCase();
    const itens = loja.listar().filter(i => (filtro === "todos" || i.situacao === filtro) && casa(i, q));
    if (!itens.length) {
      lista.innerHTML = loja.listar().length && (q || filtro !== "todos")
        ? `<p class="rz-texto-2 et-nada">Nada com esse filtro. <button class="rz-link" type="button" data-limpar>Ver todos</button></p>`
        : vazio({ icone: "camera", titulo: `Nenhum ${ITEM} aqui ainda`, texto: esquema.vazio, acao: { rotulo: esquema.novo, dado: "novo" } });
      return;
    }
    lista.innerHTML = `<div class="rz-cartao"><div class="rz-linhas">${itens.map(i => {
      const s = situacao(i.situacao), foto = i.fotos && i.fotos[0];
      return `<div class="rz-linha et-linha" data-id="${escapar(i.id)}" role="button" tabindex="0" aria-label="Editar ${escapar(esquema.titulo(i.campos))}">
        ${foto ? `<img class="et-mini" src="${escapar(foto.src)}" alt="" loading="lazy">` : `<span class="et-mini et-mini--vazia">${icone("camera", { tamanho: 20 })}</span>`}
        <span class="rz-linha-texto">
          <span class="rz-linha-titulo"><b>${escapar(esquema.titulo(i.campos))}</b>${i.destaque ? `<span class="et-estrela" title="Destaque">${icone("estrela", { tamanho: 14 })}</span>` : ""}</span>
          <small>${escapar(esquema.resumo(i.campos) || esquema.linha(i.campos))}</small>
          <span class="et-preco-linha"><b>${i.preco != null ? moeda(i.preco) : "Sob consulta"}</b>${s.valor !== "disponivel" ? `<span class="rz-etiqueta${s.etiqueta ? " rz-etiqueta--" + s.etiqueta : ""}">${s.rotulo}</span>` : ""}</span>
        </span>
        <button class="rz-botao rz-botao--fantasma et-acoes" type="button" data-acoes aria-label="Ações de ${escapar(esquema.titulo(i.campos))}">${icone("mais", { tamanho: 20 })}</button>
      </div>`;
    }).join("")}</div></div>`;
  }
  function tudo() { desenharFiltros(); desenharLista(); }

  ligarChips(filtros, v => { filtro = v; desenharLista(); });
  el.querySelector("[data-busca]").addEventListener("input", e => { busca = e.target.value; desenharLista(); });
  loja.aoMudar(() => { tudo(); mandarAoSite(); });

  // ---------- ações rápidas ----------
  function mudarSituacao(i, nova, texto) {
    const antes = { situacao: i.situacao, destaque: i.destaque };
    loja.mudar(i.id, { situacao: nova, ...(nova === "vendido" || nova === "oculto" ? { destaque: false } : {}) });
    avisar(texto, { desfazer: () => loja.mudar(i.id, antes) });
  }
  function acoes(i) {
    const nome = esquema.titulo(i.campos);
    const linha = (dado, ic, rotulo) => `<button class="rz-linha" type="button" data-fazer="${dado}">${icone(ic)}<span class="rz-linha-texto"><b>${rotulo}</b></span></button>`;
    const f = abrirFolha({ titulo: nome, subtitulo: escapar(esquema.resumo(i.campos)), corpo: `<div class="rz-linhas">
      ${linha("editar", "editar", "Editar")}
      ${i.situacao !== "vendido" ? linha("vendido", "ok", esquema.fim === "vendido" ? "Marcar como vendido" : "Marcar como esgotado") : linha("disponivel", "desfazer", "Voltar a vender")}
      ${i.situacao === "disponivel" ? linha("reservado", "relogio", "Reservar") : i.situacao === "reservado" ? linha("disponivel", "desfazer", "Tirar a reserva") : ""}
      ${situacao(i.situacao).noSite ? linha("destaque", "estrela", i.destaque ? "Tirar do destaque" : "Destacar no site") : ""}
      ${i.situacao !== "oculto" ? linha("oculto", "olho", "Ocultar do site") : linha("disponivel", "olho", "Mostrar no site")}
    </div>` });
    f.corpo.addEventListener("click", e => {
      const b = e.target.closest("[data-fazer]");
      if (!b) return;
      f.fechar();
      const o = b.dataset.fazer;
      if (o === "editar") return editar(i);
      if (o === "destaque") { loja.mudar(i.id, { destaque: !i.destaque }); return avisar(i.destaque ? "Saiu do destaque." : "Em destaque: aparece primeiro no site."); }
      if (o === "vendido") return mudarSituacao(i, "vendido", `${nome}: vendido. Já saiu do site.`);
      if (o === "reservado") return mudarSituacao(i, "reservado", `${nome}: reservado. No site, aparece com a etiqueta.`);
      if (o === "oculto") return mudarSituacao(i, "oculto", `${nome}: oculto. Não aparece no site.`);
      focoNoSite = i.id;
      return mudarSituacao(i, "disponivel", `${nome}: de volta no site.`);
    });
  }

  // ---------- adicionar e editar ----------
  function campo(c, valor) {
    const id = "et-" + c.id;
    if (c.tipo === "simnao") return interruptor({ nome: c.id, rotulo: c.rotulo, marcado: valor === true });
    if (c.tipo === "lista") return campoSelecao({ id, nome: c.id, rotulo: c.rotulo, valor: valor || "", opcoes: [{ valor: "", rotulo: "Escolher" }, ...c.opcoes.map(o => ({ valor: o, rotulo: o }))], opcional: !c.obrigatorio });
    if (c.tipo === "marcar") return `<fieldset class="rz-campo"><legend class="rz-rotulo">${escapar(c.rotulo)}</legend><div class="et-marcar">${[...new Set([...c.opcoes, ...(Array.isArray(valor) ? valor : [])])].map(o =>
      `<label><input type="checkbox" name="${c.id}" value="${escapar(o)}"${Array.isArray(valor) && valor.includes(o) ? " checked" : ""}><span>${escapar(o)}</span></label>`).join("")}</div></fieldset>`;
    const sugestoes = c.sugerir ? [...new Set(loja.listar().map(i => i.campos && i.campos[c.id]).filter(Boolean))] : [];
    return campoTexto({ id, nome: c.id, rotulo: c.rotulo + (c.sufixo ? ` (${c.sufixo})` : ""), valor: valor ?? "", tipo: "text", teclado: c.tipo === "numero" ? "numeric" : undefined,
      placeholder: c.placeholder, opcional: !c.obrigatorio && c.tipo !== "numero" ? true : undefined, extra: { ...(c.maximo ? { maxlength: c.maximo } : {}), ...(sugestoes.length ? { list: "et-sug-" + c.id } : {}) } })
      + (sugestoes.length ? `<datalist id="et-sug-${c.id}">${sugestoes.map(s => `<option value="${escapar(s)}">`).join("")}</datalist>` : "");
  }

  function editar(original) {
    const novo = !original;
    const i = original ? JSON.parse(JSON.stringify(original)) : { id: novoId(), situacao: "disponivel", destaque: false, campos: {}, selos: [], fotos: [], preco: null, descricao: "" };
    const fotos = [...(i.fotos || [])];
    const corpo = `<form class="rz-pilha et-form" novalidate data-form>
      <section class="et-bloco"><h3 class="rz-titulo-3">Fotos</h3><p class="rz-texto-3">A primeira é a capa. Do celular, dá para tirar na hora.</p><div class="et-fotos" data-fotos></div></section>
      ${esquema.grupos.map(g => `<section class="et-bloco"><h3 class="rz-titulo-3">${escapar(g.titulo)}</h3><div class="et-campos">${g.campos.map(c =>
        `<div class="${c.meio ? "et-meio" : "et-inteiro"}">${campo(c, i.campos[c.id])}</div>`).join("")}</div></section>`).join("")}
      <section class="et-bloco"><h3 class="rz-titulo-3">Preço e selos</h3><div class="et-campos">
        <div class="et-meio">${campoTexto({ id: "et-preco", nome: "preco", rotulo: "Preço (R$)", valor: i.preco != null ? i.preco.toLocaleString("pt-BR") : "", teclado: "decimal", ajuda: "Vazio: aparece \"sob consulta\"" })}</div>
        <div class="et-meio">${campoTexto({ id: "et-preco-antes", nome: "preco_antes", rotulo: "Preço anterior (R$)", valor: i.preco_antes ? i.preco_antes.toLocaleString("pt-BR") : "", teclado: "decimal", opcional: true, ajuda: "Para mostrar que baixou" })}</div>
        <div class="et-inteiro"><fieldset class="rz-campo"><legend class="rz-rotulo">Selos</legend><div class="et-marcar">${esquema.selos.map(s =>
          `<label><input type="checkbox" name="selos" value="${escapar(s)}"${(i.selos || []).includes(s) ? " checked" : ""}><span>${escapar(s)}</span></label>`).join("")}</div></fieldset></div>
        <div class="et-inteiro">${campoArea({ id: "et-descricao", nome: "descricao", rotulo: "Sobre este " + ITEM, valor: i.descricao || "", opcional: true, linhas: 4 })}</div>
      </div></section>
      <section class="et-bloco"><h3 class="rz-titulo-3">No site</h3>
        <div class="rz-campo"><span class="rz-rotulo">Situação</span>${segmentos({ nome: "situacao", rotulo: "Situação", opcoes: SITUACOES.map(s => ({ valor: s.valor, rotulo: s.rotulo })), valor: i.situacao })}</div>
        ${interruptor({ nome: "destaque", rotulo: "Destaque", ajuda: "Aparece primeiro na vitrine do site", marcado: !!i.destaque })}
      </section>
      <p class="rz-alerta rz-alerta--erro" data-erro hidden></p>
    </form>`;
    const rodape = `${novo ? "" : `<button class="rz-botao rz-botao--fantasma rz-botao--perigo" type="button" data-excluir>${icone("lixo", { tamanho: 18 })}Excluir</button>`}
      <button class="rz-botao" type="button" data-fechar>Cancelar</button>
      <button class="rz-botao rz-botao--primario" type="button" data-salvar>${novo ? "Salvar e mostrar no site" : "Salvar"}</button>`;
    const g = abrirGaveta({ titulo: novo ? esquema.novo : esquema.titulo(i.campos), subtitulo: novo ? "Preencha o que souber; dá para completar depois." : escapar(esquema.resumo(i.campos)), corpo, rodape, foco: "fechar" });
    g.el.classList.add("et-gaveta");
    const caixaFotos = g.corpo.querySelector("[data-fotos]"), form = g.corpo.querySelector("[data-form]"), erro = g.corpo.querySelector("[data-erro]");

    function desenharFotos() {
      caixaFotos.innerHTML = fotos.map((f, k) => `<figure class="et-foto">
          <img src="${escapar(f.src)}" alt="Foto ${k + 1}">
          ${k === 0 ? '<span class="et-capa">Capa</span>' : `<button type="button" class="et-foto-b et-foto-capa" data-capa="${k}" aria-label="Usar como capa">${icone("estrela", { tamanho: 14 })}</button>`}
          <button type="button" class="et-foto-b et-foto-tirar" data-tirar="${k}" aria-label="Tirar a foto ${k + 1}">${icone("fechar", { tamanho: 14 })}</button>
        </figure>`).join("") + `<label class="et-foto et-foto--mais">${icone("camera", { tamanho: 22 })}<span>Adicionar fotos</span>
          <input type="file" accept="image/*" multiple hidden data-enviar></label>`;
    }
    desenharFotos();
    caixaFotos.addEventListener("click", e => {
      const capa = e.target.closest("[data-capa]"), tirar = e.target.closest("[data-tirar]");
      if (capa) { fotos.unshift(...fotos.splice(+capa.dataset.capa, 1)); desenharFotos(); }
      if (tirar) { fotos.splice(+tirar.dataset.tirar, 1); desenharFotos(); }
    });
    caixaFotos.addEventListener("change", async e => {
      if (!e.target.matches("[data-enviar]")) return;
      const arquivos = [...e.target.files].slice(0, 15 - fotos.length);
      for (const a of arquivos) { try { fotos.push(await reduzir(a)); } catch (x) { avisar("Não consegui abrir uma das fotos.", { tipo: "erro" }); } }
      desenharFotos();
    });

    g.pe.querySelector("[data-salvar]").addEventListener("click", () => {
      const d = lerFormulario(form);
      const campos = {};
      for (const c of camposDe(esquema)) {
        if (c.tipo === "simnao") campos[c.id] = !!d[c.id];
        else if (c.tipo === "marcar") campos[c.id] = d[c.id] || [];
        else if (c.tipo === "numero") campos[c.id] = d[c.id] ? Number(String(d[c.id]).replace(/\D/g, "")) : null;
        else campos[c.id] = d[c.id] || "";
      }
      const falta = camposDe(esquema).filter(c => c.obrigatorio && !campos[c.id]).map(c => c.rotulo);
      const preco = lerValor(d.preco);
      if (falta.length || (d.preco && preco == null)) {
        erro.hidden = false;
        erro.textContent = falta.length ? `Falta preencher: ${falta.join(" e ")}.` : "O preço não ficou claro. Escreva só os números, como 237.990.";
        erro.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      const salvo = loja.salvar({ ...i, campos, fotos, preco, preco_antes: lerValor(d.preco_antes), selos: d.selos || [], descricao: d.descricao || "",
        situacao: d.situacao || "disponivel", destaque: !!d.destaque });
      g.fechar();
      if (situacao(salvo.situacao).noSite) { focoNoSite = salvo.id; mandarAoSite(); }
      avisar(situacao(salvo.situacao).noSite ? `${esquema.titulo(campos)}: salvo. Já está no site.` : `${esquema.titulo(campos)}: salvo. Não aparece no site (${situacao(salvo.situacao).rotulo.toLowerCase()}).`);
      if (loja.semEspaco()) avisar("Neste exemplo, as fotos novas ficam só até você recarregar a página.", { tipo: "erro" });
    });
    const excluir = g.pe.querySelector("[data-excluir]");
    if (excluir) excluir.addEventListener("click", () => {
      const copia = loja.achar(i.id);
      g.fechar();
      loja.remover(i.id);
      avisar(`${esquema.titulo(i.campos)}: excluído.`, { desfazer: () => loja.salvar(copia) });
    });
  }

  // ---------- cliques ----------
  el.addEventListener("click", e => {
    if (e.target.closest("[data-novo-item]") || e.target.closest('[data-acao="novo"]')) return editar(null);
    if (e.target.closest("[data-limpar]")) { filtro = "todos"; busca = ""; el.querySelector("[data-busca]").value = ""; return tudo(); }
    const b = e.target.closest("[data-tela]");
    if (b) { tela = b.dataset.tela; el.querySelectorAll("[data-tela]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); return ajustar(); }
    if (e.target.closest("[data-ver]")) { raiz.classList.add("rz-ms--vendo"); return setTimeout(ajustar, 0); }
    if (e.target.closest("[data-fechar-previa]")) return raiz.classList.remove("rz-ms--vendo");
    const linha = e.target.closest(".et-linha");
    if (!linha) return;
    const i = loja.achar(linha.dataset.id);
    if (!i) return;
    if (e.target.closest("[data-acoes]")) return acoes(i);
    editar(i);
  });
  el.addEventListener("keydown", e => {
    const linha = e.target.closest && e.target.closest(".et-linha");
    if (linha && e.target === linha && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); editar(loja.achar(linha.dataset.id)); }
  });

  tudo();
  return { editar, ajustar };
}
