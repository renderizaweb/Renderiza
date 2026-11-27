// Estoque (docs/painel-clientes/12-modulo-estoque.md): o que a conta vende no site (os carros, numa revenda). A tela é
// a do protótipo aprovado (exemplos/estoque/modulo.js, o vídeo da Ricardo Motors), agora sobre o banco
// (./loja.js): a lista com chips e busca, as ações de um toque (vendido com Desfazer, reservar, destacar, ocultar) e a
// gaveta com fotos primeiro, os campos do nicho (./esquemas.js), preço, selos e situação; no computador, o site ao lado,
// mudando a cada salvamento (no celular, "Ver o site"). Salvou, está no site na hora (a API pública guarda 1 s na rede, e
// o site pede de novo a cada visita e ao voltar à aba). Quem "só vê" lê a lista e abre os itens, sem mudar nada.

import { icone } from "../../ui/icones.js";
import { escapar, ocupado } from "../../ui/formulario.js";
import { campoTexto, campoArea, campoSelecao, interruptor, segmentos, lerFormulario } from "../../ui/campos.js";
import { abrirGaveta, abrirFolha, confirmar } from "../../ui/gaveta.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { vazio } from "../../ui/estados.js";
import { moeda, lerValor } from "../../ui/formatos.js";
import { ESQUEMAS, SITUACOES, situacao, camposDe, semFotoNoSite, limparOpcionais } from "./esquemas.js";
import { criarLoja, urlDaFoto, paraOSite } from "./loja.js";
import { enderecoDoSite } from "../meu-site/conteudo.js";
import { lerAnuncio } from "./webmotors.js";

const MAX_FOTOS = 20; // 26/11/2026: era 15 (pedido da Ricardo Motors); o banco e o script do site acompanham
const TELAS = { celular: 390, computador: 1280 };
const nomeDoErro = e => (e && e.message && !/fetch|network|JWT|PGRST/i.test(e.message) ? e.message : "Não deu certo. Confira a internet e tente de novo.");

/** O que o formulário vira no item (os campos do nicho já no tipo certo), ou o erro para mostrar. */
export function lerItem(esquema, d, loja = "") {
  const campos = {};
  for (const c of camposDe(esquema)) {
    if (c.tipo === "simnao") campos[c.id] = !!d[c.id];
    else if (c.tipo === "marcar") campos[c.id] = limparOpcionais([].concat(d[c.id] || []), loja);
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
  // o site ao lado (como no protótipo do vídeo): o site de verdade num quadro (?rz-estoque=previa), que recebe a lista
  // do painel por mensagem a cada mudança, sem esperar a rede. Só com o site ligado (o endereço vem de "sites").
  const site = await banco.resultado(banco.tabela("sites").select("dominios, situacao").eq("conta_id", conta.conta_id)).then(l => l[0] || null).catch(() => null);
  const endereco = site && site.situacao === "conectado" ? enderecoDoSite((site.dominios || [])[0]) : "";

  el.innerHTML = `
    <section class="et${endereco ? " rz-ms" : ""}">
      <header class="rz-cabeca">
        <div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Estoque</h1>
          <p class="rz-texto-2">Os ${ITENS} do seu site. Salvou aqui, aparece no site na hora.</p></div>
        <div class="rz-cabeca-acoes">${endereco ? `<a class="rz-botao et-abrir-site" href="${escapar(endereco)}" target="_blank" rel="noopener">${icone("link", { tamanho: 18 })}Abrir o site</a>` : ""}
          ${edita ? `<button class="rz-botao rz-botao--primario" type="button" data-novo-item>${icone("adicionar", { tamanho: 18 })}${escapar(novoRotulo)}</button>` : ""}</div>
      </header>
      ${!edita ? `<p class="rz-alerta" role="note">${icone("cadeado", { tamanho: 18 })}<span>Você só vê o estoque. Quem muda é o dono ou quem ele deixar.</span></p>` : ""}
      ${endereco ? `<div class="rz-ms-grade"><div class="rz-ms-editor">` : ""}
      <div class="et-ferramentas" data-filtros></div>
      <label class="et-busca">${icone("buscar", { tamanho: 18 })}<input class="rz-entrada" type="search" placeholder="Buscar por marca, modelo ou ano" aria-label="Buscar no estoque" data-busca></label>
      <div data-lista aria-live="polite"><div class="rz-cartao"><div class="rz-linhas">${'<div class="rz-linha et-linha et-linha--esqueleto"><span class="et-mini"></span><span class="rz-linha-texto"><b>&nbsp;</b><small>&nbsp;</small></span></div>'.repeat(4)}</div></div></div>
      ${endereco ? `</div>
        <aside class="rz-ms-previa" aria-label="O seu site, com o estoque de agora">
          <div class="rz-ms-barra">
            <button class="rz-botao rz-botao--pequeno rz-ms-fechar" type="button" data-fechar-previa>${icone("voltar", { tamanho: 16 })}Voltar ao estoque</button>
            <div class="rz-segmentos" role="group" aria-label="Tamanho da tela">
              <button type="button" data-tela="celular" aria-pressed="true">Celular</button><button type="button" data-tela="computador" aria-pressed="false">Computador</button>
            </div>
            <span class="rz-texto-3 rz-ms-dica">O seu site, com o estoque de agora</span>
          </div>
          <div class="rz-ms-palco" data-palco>
            <iframe title="O seu site, com o estoque de agora" src="${escapar(endereco)}/?rz-estoque=previa" sandbox="allow-scripts allow-same-origin allow-popups" data-quadro></iframe>
            <div class="rz-ms-sem-ponte" data-sem-ponte hidden><p><b>O site ainda não respondeu.</b></p>
              <p class="rz-texto-2">Se ele ainda não está no ar, a prévia aparece aqui quando estiver. O que você salva já vale.</p>
              <a class="rz-botao" href="${escapar(endereco)}" target="_blank" rel="noopener">${icone("link", { tamanho: 18 })}Abrir o site</a></div>
          </div>
        </aside></div>
      <button class="rz-botao rz-botao--primario rz-ms-ver" type="button" data-ver>${icone("olho", { tamanho: 18 })}Ver o site</button>` : ""}
    </section>`;
  const lista = el.querySelector("[data-lista]"), filtros = el.querySelector("[data-filtros]");

  // ---------- o site ao lado ----------
  const quadro = el.querySelector("[data-quadro]"), palco = el.querySelector("[data-palco]"), raiz = el.querySelector(".et");
  const origemDoSite = endereco ? new URL(endereco).origin : "";
  let tela = "celular", siteOuvindo = false;
  function ajustar() {
    const grade = el.querySelector(".rz-ms-grade");
    if (grade) grade.style.setProperty("--rz-ms-altura", Math.max(420, innerHeight - (grade.getBoundingClientRect().top + scrollY) - 24) + "px");
    if (!palco || !palco.clientWidth || !quadro) return;
    const largura = TELAS[tela], escala = Math.min(1, palco.clientWidth / largura);
    quadro.style.width = largura + "px";
    quadro.style.height = Math.round(palco.clientHeight / escala) + "px";
    quadro.style.transform = `scale(${escala})`;
    quadro.style.left = Math.max(0, Math.round((palco.clientWidth - largura * escala) / 2)) + "px";
  }
  function mandarAoSite() {
    if (!quadro || !siteOuvindo || !quadro.contentWindow) return;
    quadro.contentWindow.postMessage({ tipo: "rz-estoque", esquema: conta.nicho, itens: paraOSite(loja.listar()) }, origemDoSite);
  }
  if (quadro) {
    const ouvir = e => {
      if (e.origin !== origemDoSite || e.source !== quadro.contentWindow || !e.data || e.data.tipo !== "rz-estoque-pronto") return;
      siteOuvindo = true;
      el.querySelector("[data-sem-ponte]").hidden = true;
      quadro.hidden = false;
      mandarAoSite();
    };
    addEventListener("message", ouvir);
    // o site não respondeu (fora do ar, ou ainda sem o script do estoque): avisa, sem travar nada
    setTimeout(() => { if (!siteOuvindo && el.isConnected) { quadro.hidden = true; el.querySelector("[data-sem-ponte]").hidden = false; } }, 9000);
    new ResizeObserver(ajustar).observe(palco);
    addEventListener("resize", ajustar);
    setTimeout(ajustar, 0);
  }

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
          <span class="et-preco-linha"><b>${i.preco != null ? moeda(i.preco) : "Sob consulta"}</b>${s.valor !== "disponivel" ? `<span class="rz-etiqueta${s.etiqueta ? " rz-etiqueta--" + s.etiqueta : ""}">${s.rotulo}</span>` : ""}${foto ? "" : `<span class="rz-etiqueta rz-etiqueta--alerta">Sem foto${s.noSite ? " · fora do site" : ""}</span>`}</span>
        </span>
        ${edita ? `<button class="rz-botao rz-botao--fantasma et-acoes" type="button" data-acoes aria-label="Ações de ${escapar(titulo)}">${icone("mais", { tamanho: 20 })}</button>` : ""}
      </div>`;
    }).join("")}</div></div>`;
  }
  const tudo = () => { desenharFiltros(); desenharLista(); };
  ligarChips(filtros, v => { filtro = v; desenharLista(); });
  el.querySelector("[data-busca]").addEventListener("input", e => { busca = e.target.value; desenharLista(); });
  loja.aoMudar(() => { tudo(); mandarAoSite(); });

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
      if (semFotoNoSite(o, i.fotos)) {
        avisar(`${nome}: ponha pelo menos uma foto antes. Sem foto, o ${ITEM} fica em branco no site.`, { tipo: "erro" });
        return editar(i, { semFoto: true });
      }
      const fora = o === "vendido" || o === "oculto" ? { destaque: false } : {};
      const texto = { vendido: `${nome}: vendido. Já saiu do site.`, reservado: `${nome}: reservado. No site, aparece com a etiqueta.`,
        oculto: `${nome}: fora do site.`, disponivel: `${nome}: no site de novo.` }[o];
      return mudar(i, { situacao: o, ...fora }, texto);
    });
  }

  // ---------- trazer do anúncio da WebMotors (./webmotors.js; 12, "Trazer do anúncio") ----------
  // Só no carro novo e no computador (copiar a página inteira é coisa de computador): a pessoa abre o anúncio dela,
  // copia a página (Ctrl+A, Ctrl+C) e cola aqui; os campos se preenchem e piscam, e ela confere e põe as fotos.
  const noComputador = () => typeof matchMedia === "function" && matchMedia("(min-width: 900px) and (pointer: fine)").matches;
  const CTRL = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "") ? "⌘" : "Ctrl";
  const teclas = l => `<kbd>${CTRL}</kbd><span>+</span><kbd>${l}</kbd>`;
  const telinha = (extra = "") => `<div class="et-tela"><div class="et-tela-barra"><i></i><i></i><i></i><span>webmotors.com.br/comprar/…</span></div>
      <div class="et-tela-corpo"><span class="et-tela-foto"></span><span class="et-tela-linha et-tela-linha--titulo"></span><span class="et-tela-linha"></span><span class="et-tela-linha et-tela-linha--curta"></span>${extra}</div></div>`;
  const blocoTrazer = novo => `<section class="et-bloco et-trazer" data-trazer>
      <div class="et-trazer-topo">
        <span class="et-trazer-icone" aria-hidden="true">${icone(novo ? "importar" : "trocar", { tamanho: 20 })}</span>
        <span class="et-trazer-texto">${novo
          ? `<b>Já anunciou este ${ITEM} na WebMotors?</b><small>Traga os dados do anúncio com 3 teclas. Você só confere e põe as fotos.</small>`
          : `<b>Mudou alguma coisa no anúncio da WebMotors?</b><small>Cole a página do anúncio e o que está aqui é trocado pelo que está lá. Você confere antes de salvar.</small>`}</span>
        <button class="rz-botao" type="button" data-trazer-abrir aria-expanded="false" aria-controls="et-trazer-painel">${novo ? "Trazer do anúncio" : "Atualizar pelo anúncio"}</button>
      </div>
      <div class="et-trazer-painel" id="et-trazer-painel" hidden>
        ${novo ? "" : `<p class="rz-alerta rz-alerta--aviso">${icone("alerta", { tamanho: 18 })}<span>O que vier do anúncio <b>substitui o que está aqui</b>: a ficha, o preço, os opcionais e a descrição. As fotos, o destaque e a situação no site ficam como estão. Nada muda no site até você tocar em Salvar.</span></p>`}
        <ol class="et-passos">
          <li class="et-passo" style="--i:0"><div class="et-cena" aria-hidden="true">${telinha()}</div>
            <span class="et-passo-n">1</span><b>Abra o anúncio</b><small>Na WebMotors, neste computador.</small></li>
          <li class="et-passo" style="--i:1"><div class="et-cena et-cena--copiar" aria-hidden="true">${telinha('<span class="et-tela-selecao"></span>')}
              <span class="et-cena-teclas et-cena-teclas--a">${teclas("A")}</span><span class="et-cena-teclas et-cena-teclas--c">${teclas("C")}</span></div>
            <span class="et-passo-n">2</span><b>Copie a página toda</b><span class="et-passo-teclas">${teclas("A")}<small>depois</small>${teclas("C")}</span></li>
          <li class="et-passo" style="--i:2"><div class="et-cena et-cena--colar" aria-hidden="true"><div class="et-tela et-tela--painel">
              <div class="et-tela-corpo">${"<span class=\"et-tela-campo\"><i></i></span>".repeat(4)}</div></div><span class="et-cena-teclas et-cena-teclas--v">${teclas("V")}</span></div>
            <span class="et-passo-n">3</span><b>Cole aqui</b><span class="et-passo-teclas">${teclas("V")}<small>e os campos se preenchem</small></span></li>
        </ol>
        <label class="et-colar"><span class="et-colar-rotulo">${icone("importar", { tamanho: 18 })}<b>Cole aqui o anúncio</b><span>(${CTRL} + V)</span></span>
          <textarea data-colar rows="2" placeholder="Clique aqui e aperte ${CTRL} + V" aria-describedby="et-trazer-ajuda"></textarea></label>
        <p class="rz-texto-3" id="et-trazer-ajuda">O link do anúncio também serve, mas traz menos: só a marca, o modelo, a versão e o ano. As fotos não vêm: ponha as suas, que ficam melhores no site.</p>
        <p class="rz-alerta rz-alerta--erro" data-trazer-erro role="alert" hidden></p>
      </div>
      <div class="et-trazer-feito" data-trazer-feito role="status" hidden></div>
    </section>`;

  /**
   * Põe no formulário o que veio do anúncio. No carro novo, preenche; na edição (`trocar`), troca o que está aqui pelo
   * que está lá: um "sim" que não está na ficha do anúncio vira "não" e um opcional que não está nos itens sai (só
   * quando a ficha ou os itens vieram na colagem); o que o anúncio não trouxe fica como está. Os campos que mudaram
   * piscam. Devolve { mudou: [{ rotulo, antes, depois }], iguais: [rótulos] }.
   */
  function preencher(form, r, { trocar = false } = {}) {
    const mudou = [], iguais = [];
    const piscar = el => { const alvo = el.matches("input[type=checkbox]") ? el.closest("label") || el : el; alvo.classList.remove("et-trazido"); void alvo.offsetWidth; alvo.classList.add("et-trazido"); setTimeout(() => alvo.classList.remove("et-trazido"), 2600); };
    const anotar = (rotulo, antes, depois, el) => {
      if (antes === depois) { iguais.push(rotulo); return; }
      mudou.push({ rotulo, antes, depois });
      if (el) piscar(el);
    };
    const sn = v => (v ? "Sim" : "Não");
    for (const c of camposDe(esquema)) {
      const veio = c.id in r.campos;
      if (c.tipo === "simnao") {
        if (!veio && !(trocar && r.achou && r.achou.ficha)) continue;
        const el = form.querySelector(`input[type=checkbox][name="${c.id}"]`);
        if (!el) continue;
        const antes = el.checked;
        el.checked = veio && r.campos[c.id] === true;
        anotar(c.rotulo, sn(antes), sn(el.checked), el);
      } else if (c.tipo === "marcar") {
        if (!veio && !(trocar && r.achou && r.achou.itens)) continue;
        const quer = veio ? r.campos[c.id] : [];
        const caixas = [...form.querySelectorAll(`input[type=checkbox][name="${c.id}"]`)];
        const marcadas = () => caixas.filter(x => x.checked).map(x => x.value).sort().join(", ");
        const antes = marcadas();
        caixas.forEach(x => {
          const marcar = quer.includes(x.value) || (!trocar && x.checked);
          if (x.checked !== marcar) { x.checked = marcar; piscar(x); }
        });
        anotar(c.rotulo, antes, marcadas(), null);
      } else {
        if (!veio) continue;
        const el = form.querySelector(`[name="${c.id}"]`), v = r.campos[c.id];
        if (!el || (c.tipo === "lista" && ![...el.options].some(o => o.value === v))) continue;
        const antes = el.value.trim(), depois = c.id === "km" ? Number(v).toLocaleString("pt-BR") : String(v).trim();
        el.value = depois;
        const igual = c.tipo === "numero" ? antes.replace(/\D/g, "") === depois.replace(/\D/g, "") : antes === depois;
        if (igual) iguais.push(c.rotulo);
        else {
          const km = v2 => `${Number(String(v2).replace(/\D/g, "")).toLocaleString("pt-BR")} km`;
          mudou.push({ rotulo: c.rotulo, antes: antes ? (c.id === "km" ? km(antes) : antes) : "vazio", depois: c.id === "km" ? km(depois) : depois });
          piscar(el);
        }
      }
    }
    if (r.preco != null) {
      const el = form.querySelector('[name="preco"]'), antes = el.value ? lerValor(el.value) : null;
      el.value = Number(r.preco).toLocaleString("pt-BR");
      if (antes === r.preco) iguais.push("Preço");
      else { mudou.push({ rotulo: "Preço", antes: antes != null ? moeda(antes) : "sob consulta", depois: moeda(r.preco) }); piscar(el); }
    }
    if (r.descricao) {
      const el = form.querySelector('[name="descricao"]'), antes = el.value.trim();
      el.value = r.descricao;
      anotar("Descrição", antes, r.descricao.trim(), el);
    }
    return { mudou, iguais };
  }

  function ligarTrazer(g, form, { novo, temFotos }) {
    const caixa = g.corpo.querySelector("[data-trazer]");
    if (!caixa) return;
    const abrir = caixa.querySelector("[data-trazer-abrir]"), painel = caixa.querySelector(".et-trazer-painel"), area = caixa.querySelector("[data-colar]");
    const erroT = caixa.querySelector("[data-trazer-erro]"), feito = caixa.querySelector("[data-trazer-feito]");
    const mostrar = aberto => {
      painel.hidden = !aberto;
      abrir.setAttribute("aria-expanded", String(aberto));
      abrir.textContent = aberto ? "Fechar" : feito.hidden ? (novo ? "Trazer do anúncio" : "Atualizar pelo anúncio") : "Colar de novo";
      if (aberto) { erroT.hidden = true; caixa.scrollIntoView({ block: "start" }); area.focus({ preventScroll: true }); }
    };
    abrir.addEventListener("click", () => mostrar(painel.hidden));
    const conhecidos = () => [...new Set(loja.listar().flatMap(i => [i.campos && i.campos.marca, i.campos && i.campos.modelo]).filter(Boolean))];
    const igualA = (a, b) => String(a || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim() === String(b || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const usar = async texto => {
      const r = lerAnuncio(texto, { conhecidos: conhecidos(), loja: conta.nome });
      if (!r.tipo || !Object.keys(r.campos).length) {
        erroT.hidden = false;
        erroT.innerHTML = `Não achamos um anúncio nesse texto. Abra o anúncio na WebMotors, aperte ${teclas("A")} e ${teclas("C")}, e cole aqui de novo.`;
        return;
      }
      const c = r.campos;
      // na edição, um anúncio de outro carro pede confirmação (colou o anúncio errado?)
      if (!novo) {
        const aqui = lerFormulario(form);
        const outro = (c.marca && aqui.marca && !igualA(c.marca, aqui.marca)) || (c.modelo && aqui.modelo && !igualA(c.modelo, aqui.modelo));
        if (outro && !(await confirmar({ titulo: "Esse anúncio parece ser de outro carro", sim: "Trocar mesmo assim",
          texto: `O anúncio é de ${escapar([c.marca, c.modelo].filter(Boolean).join(" "))}, e este é ${escapar([aqui.marca, aqui.modelo].filter(Boolean).join(" "))}. Trocar os dados deste carro pelos do anúncio?` }))) return;
      }
      const { mudou, iguais } = preencher(form, r, { trocar: !novo });
      const falta = ["marca", "modelo"].filter(k => !c[k]);
      const titulo = [c.marca, c.modelo, c.ano_fab && c.ano_modelo ? `${c.ano_fab}/${c.ano_modelo}` : ""].filter(Boolean).join(" ");
      const resumo = [c.km != null ? `${Number(c.km).toLocaleString("pt-BR")} km` : "", r.preco != null ? moeda(r.preco) : ""].filter(Boolean).join(" · ");
      const curto = t => (String(t).length > 42 ? String(t).slice(0, 40) + "…" : String(t));
      const linhaDe = m => (m.rotulo === "Descrição" ? "<li><b>Descrição</b>: mudou</li>" : m.rotulo === "Opcionais" ? "<li><b>Opcionais</b>: mudaram</li>"
        : `<li><b>${escapar(m.rotulo)}</b>: ${escapar(curto(m.antes))} → ${escapar(curto(m.depois))}</li>`);
      const vieram = mudou.length + iguais.length;
      const cabeca = novo
        ? `<b>Pronto: ${vieram} ${vieram === 1 ? "campo veio" : "campos vieram"} do anúncio.</b><small>${escapar([titulo, resumo].filter(Boolean).join(" · "))}. Confira os campos destacados e ponha as fotos.</small>`
        : mudou.length
          ? `<b>Atualizado pelo anúncio: ${mudou.length} ${mudou.length === 1 ? "campo mudou" : "campos mudaram"}.</b><small>Confira e toque em Salvar para valer no site.${iguais.length ? ` ${iguais.length} ${iguais.length === 1 ? "ficou igual" : "ficaram iguais"}.` : ""}</small>
            <ul class="et-mudou">${mudou.slice(0, 8).map(linhaDe).join("")}${mudou.length > 8 ? `<li>e mais ${mudou.length - 8}</li>` : ""}</ul>`
          : `<b>Tudo igual ao anúncio.</b><small>Nada mudou aqui.</small>`;
      feito.hidden = false;
      feito.innerHTML = `<span class="et-trazer-icone et-trazer-icone--ok" aria-hidden="true">${icone("ok", { tamanho: 20 })}</span>
        <span class="et-trazer-texto">${cabeca}
          ${r.tipo === "link" ? `<small>Pelo link vieram só a marca, o modelo, a versão e o ano. Para trazer km, preço, cor, opcionais e descrição, copie a página toda (${CTRL} + A, ${CTRL} + C) e cole de novo.</small>` : ""}
          ${falta.length && novo ? `<small>Não achamos ${falta.length === 2 ? "a marca e o modelo" : falta[0] === "marca" ? "a marca" : "o modelo"}: preencha.</small>` : ""}
          ${r.semCaixa.length ? `<small>${r.semCaixa.length} ${r.semCaixa.length === 1 ? "item sem caixa aqui foi" : "itens sem caixa aqui foram"} para o fim da descrição.</small>` : ""}</span>`;
      mostrar(false);
      caixa.scrollIntoView({ block: "start", behavior: "smooth" });
      // o próximo passo é pôr as fotos (as do anúncio não vêm), quando ainda não tem
      const mais = g.corpo.querySelector(".et-foto--mais");
      if (mais && !temFotos()) { mais.classList.add("et-chama"); setTimeout(() => mais.classList.remove("et-chama"), 4000); }
    };
    area.addEventListener("paste", e => {
      const t = e.clipboardData && e.clipboardData.getData("text/plain");
      if (!t) return;
      e.preventDefault();
      usar(t);
    });
    // colou de outro jeito (o menu do botão direito sem a área de transferência, arrastar) ou digitou o link e deu Enter
    area.addEventListener("input", e => { if (/^insertFrom(Paste|Drop)/.test(e.inputType || "")) { usar(area.value); area.value = ""; } });
    area.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && area.value.trim()) { e.preventDefault(); usar(area.value); area.value = ""; } });
    // com a área aberta, o Ctrl+V vale em qualquer lugar da gaveta que não seja um campo
    g.el.addEventListener("paste", e => {
      if (painel.hidden || e.target === area || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return;
      const t = e.clipboardData && e.clipboardData.getData("text/plain");
      if (t) { e.preventDefault(); usar(t); }
    });
  }

  // ---------- adicionar e editar ----------
  function campo(c, valor, travado) {
    const id = "et-" + c.id;
    if (c.tipo === "simnao") return interruptor({ nome: c.id, rotulo: c.rotulo, marcado: valor === true });
    if (c.tipo === "lista") return campoSelecao({ id, nome: c.id, rotulo: c.rotulo, valor: valor || "", opcoes: [{ valor: "", rotulo: "Escolher" }, ...c.opcoes.map(o => ({ valor: o, rotulo: o }))], opcional: !c.obrigatorio });
    if (c.tipo === "marcar") {
      const marcados = limparOpcionais(valor, conta.nome); // o quadro do vendedor que entrou numa carga antiga não vira caixa (e sai ao salvar)
      return `<fieldset class="rz-campo"><legend class="rz-rotulo">${escapar(c.rotulo)}</legend><div class="et-marcar">${[...new Set([...c.opcoes, ...marcados])].map(o =>
        `<label><input type="checkbox" name="${c.id}" value="${escapar(o)}"${marcados.includes(o) ? " checked" : ""}${travado ? " disabled" : ""}><span>${escapar(o)}</span></label>`).join("")}</div></fieldset>`;
    }
    const sugestoes = c.sugerir ? [...new Set(loja.listar().map(i => i.campos && i.campos[c.id]).filter(Boolean))] : [];
    return campoTexto({ id, nome: c.id, rotulo: c.rotulo + (c.sufixo ? ` (${c.sufixo})` : ""), valor: valor ?? "", teclado: c.tipo === "numero" ? "numeric" : undefined,
      placeholder: c.placeholder, opcional: !c.obrigatorio && c.tipo !== "numero" ? true : undefined, extra: { ...(c.maximo ? { maxlength: c.maximo } : {}), ...(sugestoes.length ? { list: "et-sug-" + c.id } : {}) } })
      + (sugestoes.length ? `<datalist id="et-sug-${c.id}">${sugestoes.map(s => `<option value="${escapar(s)}">`).join("")}</datalist>` : "");
  }

  function editar(original, { semFoto = false } = {}) {
    const novo = !original;
    const i = original ? JSON.parse(JSON.stringify(original)) : { situacao: "disponivel", destaque: false, campos: {}, selos: [], fotos: [], preco: null, descricao: "" };
    const fotos = [...(i.fotos || [])];
    const enviadas = []; // as que subiram nesta gaveta: apagadas se ela fechar sem salvar
    const tiradas = []; // as que já estavam salvas e saíram: apagadas depois de salvar
    let enviando = 0, salvo = false;
    const trazer = edita && conta.nicho === "automotivo" && noComputador();
    const corpo = `<form class="rz-pilha et-form" novalidate data-form>
      ${trazer ? blocoTrazer(novo) : ""}
      <section class="et-bloco"><h3 class="rz-titulo-3">Fotos</h3><p class="rz-texto-3">A primeira é a capa. Do celular, dá para tirar na hora. Sem foto, o ${ITEM} não vai ao site.</p><div class="et-fotos" data-fotos></div>
        <p class="rz-alerta rz-alerta--aviso" data-sem-foto role="alert" hidden>${icone("camera", { tamanho: 18 })}<span>Ponha pelo menos uma foto: sem foto, o ${ITEM} fica em branco no site. Para terminar depois, escolha <b>Oculto</b> em "No site" e salve.</span></p></section>
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
    if (trazer) ligarTrazer(g, form, { novo, temFotos: () => fotos.length > 0 });
    const avisoSemFoto = g.corpo.querySelector("[data-sem-foto]");
    const pedirFoto = () => {
      avisoSemFoto.hidden = false;
      avisoSemFoto.scrollIntoView({ block: "center", behavior: "smooth" });
      const mais = g.corpo.querySelector(".et-foto--mais");
      if (mais) { mais.classList.add("et-chama"); setTimeout(() => mais.classList.remove("et-chama"), 4000); }
    };
    if (semFoto) setTimeout(pedirFoto, 300);

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
        try { const f = await loja.enviarFoto(a); fotos.push(f); enviadas.push(f); avisoSemFoto.hidden = true; }
        catch (x) { avisar(nomeDoErro(x) || "Uma das fotos não subiu.", { tipo: "erro" }); }
        enviando--;
        desenharFotos();
      }
    });

    const salvar = g.pe.querySelector("[data-salvar]");
    if (salvar) salvar.addEventListener("click", async () => {
      if (enviando) { erro.hidden = false; erro.textContent = "Espere as fotos terminarem de subir."; return; }
      const r = lerItem(esquema, lerFormulario(form), conta.nome);
      if (r.erro) { erro.hidden = false; erro.textContent = r.erro; erro.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      // sem foto não vai ao site: a pessoa põe a foto ou salva como oculto (26/11/2026)
      if (semFotoNoSite(r.item.situacao, fotos)) { erro.hidden = true; pedirFoto(); return; }
      erro.hidden = true;
      ocupado(salvar, true, "Salvando…");
      try {
        const linha = await loja.salvar({ ...(original ? { id: original.id } : {}), ...r.item, fotos });
        salvo = true;
        g.fechar();
        if (tiradas.length) loja.tirarArquivos(tiradas).catch(() => {});
        const s = situacao(linha.situacao), titulo = esquema.titulo(linha.campos);
        avisar(s.noSite ? `${titulo}: salvo. Já está no site.` : `${titulo}: salvo, fora do site (${s.rotulo.toLowerCase()}).`);
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
    const botaoDaTela = e.target.closest("[data-tela]");
    if (botaoDaTela) { tela = botaoDaTela.dataset.tela; el.querySelectorAll("[data-tela]").forEach(x => x.setAttribute("aria-pressed", String(x === botaoDaTela))); return ajustar(); }
    if (e.target.closest("[data-ver]")) { raiz.classList.add("rz-ms--vendo"); return setTimeout(ajustar, 0); }
    if (e.target.closest("[data-fechar-previa]")) return raiz.classList.remove("rz-ms--vendo");
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
