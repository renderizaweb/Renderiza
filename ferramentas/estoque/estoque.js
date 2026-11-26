// O Estoque no site do cliente (docs/painel-clientes/12-modulo-estoque.md, "Contrato v1", item 3). Entra pelo
// scripts/virar-site.mjs com "painel": { "codigo", "estoque": true }, no fim do <head>, para pedir a lista o quanto antes:
//   um <script data-estoque="<código do site>" [data-api="<base da API pública>"]> com este arquivo dentro
//
// O site tem, no HTML, a VERSÃO DE RESERVA: os itens do dia da entrega, sem preço, com "confirme pelo WhatsApp". Este
// script mostra na hora a lista que a sessão do navegador já tinha, pede SEMPRE a do painel (GET <api>estoque/<código>,
// até 6 s; a rede guarda só 1 s), de novo quando a pessoa volta à aba, confere a resposta e entrega ao site (só se mudou):
//   window.rzEstoque(itens, { esquema, atualizado_em })   o site refaz a vitrine, os filtros, a contagem e a capa
//   window.rzEstoque(null)                                o painel desligou depois de uma lista já mostrada: volte à reserva
// Erro, demora ou resposta fora do contrato: nada é chamado e o site fica como está (sem preço). Foto só da API.
//
// Prévia no painel: dentro de um quadro, com ?rz-estoque=previa, aceita { tipo: "rz-estoque", itens } por postMessage
// só da origem da API e responde { tipo: "rz-estoque-pronto" }.

(function (global) {
  "use strict";

  var API = "https://painel.renderizaweb.com.br/api/publico/";
  var CODIGO = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
  var FOTO = /^\/api\/publico\/imagens\/[0-9a-f-]{36}\/estoque-[A-Za-z0-9_-]{6,80}\.webp$/;
  // GUARDA: até quando a lista da sessão serve para a primeira pintura (a nova vem logo atrás); INTERVALO: o mínimo
  // entre dois pedidos (voltar à aba várias vezes seguidas não vira uma enxurrada)
  var GUARDA = 600000, ESPERA = 6000, MAXIMO = 300, INTERVALO = 3000;

  var ehObjeto = function (o) { return !!o && typeof o === "object" && !Array.isArray(o); };
  var numero = function (v) { return typeof v === "number" && isFinite(v) && v >= 0 ? v : null; };

  /** A resposta do painel, conferida, com as fotos no endereço inteiro da API; ou null (fora do contrato). */
  function conferir(r, origem) {
    if (!ehObjeto(r) || r.versao !== 1 || !Array.isArray(r.itens) || r.itens.length > MAXIMO) return null;
    var itens = [];
    for (var k = 0; k < r.itens.length; k++) {
      var i = r.itens[k];
      if (!ehObjeto(i) || typeof i.id !== "string" || (i.situacao !== "disponivel" && i.situacao !== "reservado")) return null;
      var fotos = [];
      var lista = Array.isArray(i.fotos) ? i.fotos : [];
      for (var f = 0; f < lista.length && fotos.length < 20; f++) { // até 20 por item (o banco aceita 20; 26/11/2026)
        var x = lista[f];
        if (!ehObjeto(x) || !FOTO.test(x.url || "")) continue;
        fotos.push({ url: origem + x.url, mini: origem + (FOTO.test(x.mini || "") ? x.mini : x.url), w: numero(x.w) || 0, h: numero(x.h) || 0 });
      }
      itens.push({
        id: i.id, situacao: i.situacao, destaque: i.destaque === true, preco: numero(i.preco), preco_antes: numero(i.preco_antes),
        quantidade: numero(i.quantidade) === null ? 1 : i.quantidade,
        selos: Array.isArray(i.selos) ? i.selos.filter(function (s) { return typeof s === "string"; }).slice(0, 8) : [],
        descricao: typeof i.descricao === "string" ? i.descricao.slice(0, 4000) : "",
        campos: ehObjeto(i.campos) ? i.campos : {}, fotos: fotos,
      });
    }
    return { itens: itens, info: { esquema: typeof r.esquema === "string" ? r.esquema : "", atualizado_em: typeof r.atualizado_em === "string" ? r.atualizado_em : null } };
  }

  function lerGuardado(chave) {
    try { var g = JSON.parse(global.sessionStorage.getItem(chave)); return g && Date.now() - g.t < GUARDA ? g.r : null; } catch (e) { return null; }
  }
  function guardar(chave, r) { try { global.sessionStorage.setItem(chave, JSON.stringify({ t: Date.now(), r: r })); } catch (e) { /* sem espaço ou bloqueado */ } }
  function esquecer(chave) { try { global.sessionStorage.removeItem(chave); } catch (e) { /* bloqueado */ } }

  function iniciar(script) {
    var doc = global.document;
    var codigo = script && script.getAttribute("data-estoque");
    if (!doc || !codigo || !CODIGO.test(codigo) || typeof global.fetch !== "function") return;
    var api = script.getAttribute("data-api") || API, origem;
    try { origem = new URL(api).origin; } catch (e) { return; }
    var mostrou = false;
    var pronto = new Promise(function (ok) {
      if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { ok(); }); else ok();
    });
    var entregar = function (d) {
      pronto.then(function () {
        if (typeof global.rzEstoque !== "function") return;
        try {
          if (d) { global.rzEstoque(d.itens, d.info); mostrou = true; }
          else if (mostrou) { global.rzEstoque(null); mostrou = false; }
        } catch (e) { /* o site fica como está */ }
      });
    };

    // dentro do painel: a lista chega por mensagem, a cada mudança, sem pedir à API
    if (global.parent !== global && /[?&]rz-estoque=previa(?:&|$)/.test(global.location.search)) {
      global.addEventListener("message", function (e) {
        if (e.origin !== origem || e.source !== global.parent || !ehObjeto(e.data) || e.data.tipo !== "rz-estoque") return;
        entregar(conferir({ versao: 1, esquema: e.data.esquema, itens: e.data.itens }, origem));
      });
      pronto.then(function () { global.parent.postMessage({ tipo: "rz-estoque-pronto" }, origem); });
      return;
    }

    // Rápido e sempre em dia (25/11/2026): o que a sessão guardou aparece na hora, e a lista do painel é pedida SEMPRE
    // (a rede guarda só 1 s); de novo quando a pessoa volta à aba ou à janela. Só redesenha se a lista mudou.
    var chave = "rz-estoque:" + codigo, ultimo = null, buscando = false, ultimaBusca = 0;
    var aplicar = function (j) {
      var s = JSON.stringify(j);
      if (s === ultimo) return;
      var d = conferir(j, origem);
      if (!d) return;
      ultimo = s;
      guardar(chave, j);
      entregar(d);
    };
    var guardado = lerGuardado(chave);
    if (guardado) aplicar(guardado);
    var buscar = function () {
      if (buscando || Date.now() - ultimaBusca < INTERVALO) return;
      buscando = true;
      ultimaBusca = Date.now();
      var ctrl = typeof global.AbortController === "function" ? new global.AbortController() : null;
      if (ctrl) setTimeout(function () { ctrl.abort(); }, ESPERA);
      global.fetch(api + "estoque/" + encodeURIComponent(codigo), { credentials: "omit", signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          if (r.status === 404) { esquecer(chave); ultimo = null; entregar(null); return; }
          if (!r.ok) return;
          return r.json().then(aplicar);
        })
        .catch(function () { /* fora do ar, demorou ou bloqueado: fica o que está na tela (a reserva, sem preço) */ })
        .then(function () { buscando = false; });
    };
    buscar();
    if (typeof doc.addEventListener === "function") doc.addEventListener("visibilitychange", function () { if (doc.visibilityState === "visible") buscar(); });
    if (typeof global.addEventListener === "function") global.addEventListener("focus", buscar);
  }

  var exportar = { API: API, conferir: conferir };
  if (typeof module === "object" && module && module.exports) module.exports = exportar;
  else {
    global.RZ_ESTOQUE = exportar;
    try { iniciar(global.document && global.document.currentScript); } catch (e) { /* o site fica como está */ }
  }
})(this);
