// Meu site (Painel Renderiza): o script que vai dentro do site do cliente e mostra, por cima da versão inicial, a
// versão publicada no painel. Regras em docs/painel-clientes/03-modulo-meu-site.md:
// - a versão inicial está no HTML e nunca depende do painel: erro, demora (1,5 s) ou "não encontrado" = fica ela;
// - texto entra como texto (só *destaque* vira <em>, e só nos títulos), links só dos tipos permitidos, imagens só do
//   endereço do painel;
// - a última versão fica no navegador por até 24 horas, para aparecer logo nas visitas seguintes.
// Entra no site pelo scripts/virar-site.mjs, num <script data-codigo="<código do site>"> no fim do <head>.
// O mesmo arquivo é a biblioteca (validar, aplicar, extrair) do painel, dos testes e do scripts/versao-final.mjs.
//
// O que o site marca (os geradores em ferramentas/demo/ põem as marcações):
//   data-site-secao="<seção>"          a seção (some com "visivel": false)
//   data-site="<seção>.<campo>"        um texto
//   data-site-botao="<seção>.<campo>"  um botão (o rótulo é o texto direto dentro dele, fora dos ícones e setas)
//   data-site-img="<seção>.<campo>"    uma imagem
//   data-site-lista="<seção>.<campo>"  uma lista: os filhos [data-site-item] são os itens, com os campos marcados por
//                                      data-site-campo="<campo>" (texto ou imagem); data-site-runtime="avaliacoes" =
//                                      a lista é montada pelo runtime das demos (DEMO_CLIENT.reviews)
(function (global) {
  "use strict";
  var ESQUEMA = 1;
  var API = "https://painel.renderizaweb.com.br/api/publico/site/";
  var ESPERA = 1500; // ms: depois disso a página fica como está (a resposta ainda vai para o cache)
  var VALIDADE = 24 * 3600 * 1000; // ms: quanto a última versão vale no navegador
  var LIMITE = { texto: 600, rotulo: 60, alt: 200, mensagem: 500, destino: 300, itens: 60, endereco: 1000 };
  var ACOES = ["whatsapp", "telefone", "link", "secao", "rota", "instagram", "email"];
  var NOME = /^[a-z0-9][a-z0-9-]{0,40}$/;
  var INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;
  var FONE = /^\d{12,13}$/; // com o 55: 5511900000000
  var LINKS_DO_RUNTIME = ["data-whatsapp", "data-instagram", "data-maps", "data-directions", "data-phone", "data-reviews-link", "data-review-write"];

  var ehObjeto = function (v) { return v !== null && typeof v === "object" && !Array.isArray(v); };
  var todos = function (raiz, seletor) { return Array.prototype.slice.call(raiz.querySelectorAll(seletor)); };
  // num item de lista, o campo pode ser o próprio item (<p data-site-item data-site-campo="texto">)
  var noItem = function (item, seletor) { return (item.matches(seletor) ? [item] : []).concat(todos(item, seletor)); };
  var cada = function (obj, fn) { if (ehObjeto(obj)) Object.keys(obj).forEach(function (k) { fn(k, obj[k]); }); };
  var itensDe = function (lista) { return Array.prototype.filter.call(lista.children, function (n) { return n.hasAttribute("data-site-item"); }); };
  // o rótulo de um botão: os textos diretos dele (o ícone e a seta ficam em elementos à parte, que não mudam)
  var textosDe = function (el) { return Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 3 && n.nodeValue.trim(); }); };

  function urlSegura(texto, soHttps) {
    if (typeof texto !== "string" || texto.length > LIMITE.endereco || /[\s"<>]/.test(texto)) return false;
    try {
      var u = new URL(texto);
      return u.protocol === "https:" || (!soHttps && u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"));
    } catch (e) { return false; }
  }

  /** Os problemas do conteúdo (lista vazia = pode aplicar). O painel valida o mesmo antes de publicar. */
  function validar(c) {
    var erros = [];
    var erro = function (onde, o) { erros.push(onde + ": " + o); };
    var texto = function (onde, v, max) { if (typeof v !== "string") erro(onde, "não é texto"); else if (v.length > max) erro(onde, "passa de " + max + " caracteres"); };
    var sim = function (onde, v) { if (v !== undefined && typeof v !== "boolean") erro(onde, "não é sim/não"); };
    var nomes = function (onde, obj, fn) {
      if (obj === undefined) return;
      if (!ehObjeto(obj)) return erro(onde, "não é um objeto");
      cada(obj, function (k, v) { if (!NOME.test(k)) erro(onde + "." + k, "nome inválido"); else fn(onde + "." + k, v); });
    };
    var imagem = function (onde, v) {
      if (!ehObjeto(v)) return erro(onde, "não é um objeto");
      // endereço do painel (o site só aceita os do painel) ou caminho do próprio site (/img/…, o da versão inicial)
      if (v.src !== undefined && !urlSegura(v.src) && !/^\/[A-Za-z0-9._~\/-]{1,300}$/.test(v.src)) erro(onde + ".src", "endereço inválido");
      if (v.alt !== undefined) texto(onde + ".alt", v.alt, LIMITE.alt);
    };
    var botao = function (onde, b) {
      if (!ehObjeto(b)) return erro(onde, "não é um objeto");
      if (b.rotulo !== undefined) texto(onde + ".rotulo", b.rotulo, LIMITE.rotulo);
      sim(onde + ".visivel", b.visivel);
      if (b.mensagem !== undefined) texto(onde + ".mensagem", b.mensagem, LIMITE.mensagem);
      if (b.destino !== undefined) texto(onde + ".destino", b.destino, LIMITE.destino);
      if (b.acao === undefined) return;
      if (ACOES.indexOf(b.acao) < 0) return erro(onde + ".acao", "ação desconhecida");
      var site = { whatsapp: "5500000000000", telefone: "5500000000000", instagram: "usuario", temSecao: function (id) { return NOME.test(id); } };
      if (!destino(b, site)) erro(onde + ".destino", "destino inválido para " + b.acao);
    };
    if (!ehObjeto(c)) return ["o conteúdo não é um objeto"];
    if (c.esquema !== ESQUEMA) erro("esquema", "tem que ser " + ESQUEMA);
    nomes("secoes", c.secoes, function (onde, s) {
      if (!ehObjeto(s)) return erro(onde, "não é um objeto");
      sim(onde + ".visivel", s.visivel);
      if (onde === "secoes.inicio" && s.visivel === false) erro(onde, "o início não some");
      nomes(onde + ".textos", s.textos, function (o, v) { texto(o, v, LIMITE.texto); });
      nomes(onde + ".botoes", s.botoes, botao);
      nomes(onde + ".imagens", s.imagens, imagem);
      nomes(onde + ".listas", s.listas, function (o, itens) {
        if (!Array.isArray(itens)) return erro(o, "não é uma lista");
        if (itens.length > LIMITE.itens) erro(o, "passa de " + LIMITE.itens + " itens");
        itens.forEach(function (it, i) {
          var oi = o + "[" + i + "]";
          if (!ehObjeto(it)) return erro(oi, "não é um objeto");
          if (it.de !== undefined && !(Number.isInteger(it.de) && it.de >= 0 && it.de < 200)) erro(oi + ".de", "não é a posição de um item");
          sim(oi + ".visivel", it.visivel);
          nomes(oi + ".textos", it.textos, function (ot, v) { texto(ot, v, LIMITE.texto); });
          nomes(oi + ".imagens", it.imagens, imagem);
        });
      });
    });
    if (c.contato !== undefined) {
      var k = c.contato;
      if (!ehObjeto(k)) erro("contato", "não é um objeto");
      else {
        if (k.whatsapp !== undefined && !FONE.test(k.whatsapp)) erro("contato.whatsapp", "use só números, com o 55 e o DDD");
        if (k.telefone !== undefined && !FONE.test(k.telefone)) erro("contato.telefone", "use só números, com o 55 e o DDD");
        if (k.instagram !== undefined && !INSTAGRAM.test(k.instagram)) erro("contato.instagram", "nome de usuário inválido");
        if (k.mensagem !== undefined) texto("contato.mensagem", k.mensagem, LIMITE.mensagem);
      }
    }
    return erros;
  }

  /** "Festas *no verde.*" -> [["Festas ", false], ["no verde.", true]] */
  function partes(texto) {
    var out = [], re = /\*([^*]+)\*/g, i = 0, m;
    while ((m = re.exec(texto))) {
      if (m.index > i) out.push([texto.slice(i, m.index), false]);
      out.push([m[1], true]);
      i = re.lastIndex;
    }
    if (i < texto.length) out.push([texto.slice(i), false]);
    return out;
  }

  /** O endereço de um botão, só dos tipos permitidos; null quando não dá. */
  function destino(b, ctx) {
    var d = typeof b.destino === "string" ? b.destino.trim() : "";
    switch (b.acao) {
      case "whatsapp":
        var m = typeof b.mensagem === "string" ? b.mensagem : ctx.mensagem;
        return ctx.whatsapp ? { href: "https://wa.me/" + ctx.whatsapp + (m ? "?text=" + encodeURIComponent(m) : ""), fora: true } : null;
      case "telefone":
        var t = d ? d.replace(/\D/g, "") : ctx.telefone;
        return t && FONE.test(t) ? { href: "tel:+" + t } : null;
      case "link":
        return urlSegura(d, true) ? { href: d, fora: true } : null;
      case "secao":
        return ctx.temSecao(d) ? { href: "#" + d } : null;
      case "rota":
        return d && d.length <= LIMITE.destino ? { href: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(d), fora: true } : null;
      case "instagram":
        var u = d ? d.replace(/^@/, "") : ctx.instagram;
        return u && INSTAGRAM.test(u) ? { href: "https://www.instagram.com/" + u + "/", fora: true } : null;
      case "email":
        return /^[^\s@<>"]+@[^\s@<>"]+\.[A-Za-z]{2,}$/.test(d) ? { href: "mailto:" + d } : null;
    }
    return null;
  }

  function iniciais(nome) {
    var p = String(nome).replace(/\(.*?\)/g, "").split(/\s+/).filter(function (x) { return x && /\p{L}/u.test(x[0]); });
    return p.length ? (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() : "";
  }

  /** (11) 90000-0000 a partir de 5511900000000 */
  function foneLegivel(n) {
    var m = String(n).match(/^55(\d{2})(\d{4,5})(\d{4})$/);
    return m ? "(" + m[1] + ") " + m[2] + "-" + m[3] : "+" + n;
  }

  // ---------- os dados do runtime das demos (window.DEMO_CLIENT) ----------
  // Na página aberta, lê o objeto; no HTML parado (versão final, extrair), lê o texto do <script>, no formato que o
  // gerar.py escreve.
  function scriptDoCliente(doc) {
    return todos(doc, "script").filter(function (s) { return /window\.DEMO_CLIENT\s*=/.test(s.textContent); })[0] || null;
  }

  function lerCliente(doc) {
    var w = doc.defaultView, cl = w && w.DEMO_CLIENT, out = {};
    var zap = function (url) {
      var m = String(url || "").match(/wa\.me\/(\d+)(?:\?text=([^"]*))?/);
      if (!m) return;
      out.whatsapp = m[1];
      if (m[2] !== undefined) try { out.mensagem = decodeURIComponent(m[2]); } catch (e) { /* fica sem */ }
    };
    if (cl) {
      zap(cl.whatsapp);
      out.telefone = String(cl.phone || "").replace(/\D/g, "") || undefined;
      out.instagram = (String(cl.instagram || "").match(/instagram\.com\/([^/?#]+)/) || [])[1];
      out.avaliacoes = (cl.reviews || []).map(function (r) { return { nome: r.name, texto: r.quote, tag: r.tag || "" }; });
      return out;
    }
    var s = scriptDoCliente(doc), t = s ? s.textContent : "";
    var json = function (re) { var m = t.match(re); try { return m ? JSON.parse(m[1]) : undefined; } catch (e) { return undefined; } };
    var num = (t.match(/whatsapp: "https:\/\/wa\.me\/(\d+)/) || [])[1];
    if (num) { out.whatsapp = num; out.mensagem = json(/whatsapp: "[^"]*" \+ encodeURIComponent\(("(?:[^"\\]|\\.)*")\)/); }
    out.telefone = (json(/\n\s*phone: ("(?:[^"\\]|\\.)*")/) || "").replace(/\D/g, "") || undefined;
    out.instagram = (t.match(/instagram: "https:\/\/www\.instagram\.com\/([^/"]+)\/?"/) || [])[1];
    var bloco = t.match(/\n\s*reviews: \[\n([\s\S]*?)\n\s*\],/);
    out.avaliacoes = bloco ? bloco[1].split("\n").map(function (l) {
      try { var r = JSON.parse(l.trim().replace(/,$/, "")); return { nome: r.name, texto: r.quote, tag: r.tag || "" }; } catch (e) { return null; }
    }).filter(Boolean) : [];
    return out;
  }

  var paraReview = function (a) { return { name: a.nome, initials: iniciais(a.nome), tag: a.tag || "", quote: a.texto }; };

  /** Leva o contato e as avaliações para o DEMO_CLIENT (página aberta) ou para o texto do <script> (HTML parado). */
  function gravarCliente(doc, ctx, avaliacoes, parado) {
    var zap = "https://wa.me/" + ctx.whatsapp + "?text=";
    if (!parado) {
      var w = doc.defaultView, cl = w && w.DEMO_CLIENT;
      if (!cl) return;
      if (ctx.whatsapp) cl.whatsapp = zap + encodeURIComponent(ctx.mensagem || "");
      if (ctx.telefone) cl.phone = "+" + ctx.telefone;
      if (ctx.instagram) cl.instagram = "https://www.instagram.com/" + ctx.instagram + "/";
      if (avaliacoes) cl.reviews = avaliacoes.map(paraReview);
      var rt = w.DEMO_RUNTIME;
      if (rt) { rt.links(); if (avaliacoes) rt.avaliacoes(); }
      return;
    }
    var s = scriptDoCliente(doc);
    if (!s) return;
    var t = s.textContent;
    var trocar = function (re, novo) { t = t.replace(re, function () { return novo; }); };
    if (ctx.whatsapp) trocar(/whatsapp: "https:\/\/wa\.me\/[^"]*" \+ encodeURIComponent\("(?:[^"\\]|\\.)*"\),/, "whatsapp: " + JSON.stringify(zap) + " + encodeURIComponent(" + JSON.stringify(ctx.mensagem || "") + "),");
    if (ctx.telefone) trocar(/\n(\s*)phone: "(?:[^"\\]|\\.)*",/, "\n  phone: " + JSON.stringify("+" + ctx.telefone) + ",");
    if (ctx.instagram) trocar(/instagram: "https:\/\/www\.instagram\.com\/[^"]*",/, "instagram: " + JSON.stringify("https://www.instagram.com/" + ctx.instagram + "/") + ",");
    if (avaliacoes) trocar(/\n(\s*)reviews: \[\n[\s\S]*?\n\s*\],/, "\n  reviews: [\n" + avaliacoes.map(function (a) { return "    " + JSON.stringify(paraReview(a)).replace(/</g, "\\u003c"); }).join(",\n") + "\n  ],");
    s.textContent = t;
  }

  // ---------- aplicar ----------
  function porTexto(el, valor) {
    var titulo = /^H[1-6]$/.test(el.tagName), doc = el.ownerDocument;
    while (el.firstChild) el.removeChild(el.firstChild);
    partes(valor).forEach(function (p) {
      if (p[1] && titulo) el.appendChild(doc.createElement("em")).appendChild(doc.createTextNode(p[0]));
      else el.appendChild(doc.createTextNode(p[0]));
    });
    if (valor.trim() === "") el.hidden = true;
  }

  function porImagem(el, img, opcoes) {
    if (img.src !== undefined) {
      var src = opcoes.imagem(img.src);
      if (!src) return;
      el.setAttribute("src", src);
      el.removeAttribute("srcset");
    }
    if (img.alt !== undefined) el.setAttribute("alt", img.alt);
  }

  function porBotao(el, b, ctx) {
    if (b.visivel === false) { el.hidden = true; return; }
    if (b.rotulo) {
      var textos = textosDe(el);
      if (textos.length) {
        textos[0].nodeValue = textos[0].nodeValue.replace(/\S[\s\S]*\S|\S/, b.rotulo.replace(/\*/g, ""));
        textos.slice(1).forEach(function (n) { el.removeChild(n); });
      }
    }
    if (!b.acao) return;
    var d = destino(b, ctx);
    if (!d) return;
    LINKS_DO_RUNTIME.forEach(function (a) { el.removeAttribute(a); });
    el.setAttribute("href", d.href);
    if (d.fora) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener noreferrer"); }
    else { el.removeAttribute("target"); el.removeAttribute("rel"); }
  }

  function porLista(lista, itens, modelos, opcoes) {
    var atuais = itensDe(lista);
    if (!modelos.length || !atuais.length) return;
    var depois = atuais[atuais.length - 1].nextSibling;
    var novos = itens.filter(function (it) { return it.visivel !== false; }).map(function (it) {
      var novo = (modelos[it.de] || modelos[0]).cloneNode(true);
      cada(it.textos, function (campo, v) {
        noItem(novo, '[data-site-campo="' + campo + '"]').forEach(function (e) { if (e.tagName !== "IMG") porTexto(e, v); });
      });
      cada(it.imagens, function (campo, img) { noItem(novo, 'img[data-site-campo="' + campo + '"]').forEach(function (e) { porImagem(e, img, opcoes); }); });
      return novo;
    });
    atuais.forEach(function (n) { lista.removeChild(n); });
    novos.forEach(function (n) { lista.insertBefore(n, depois); });
  }

  // Na página aberta, o conteúdo pode chegar mais de uma vez (o do navegador e depois o do painel): antes de aplicar,
  // tudo volta à versão inicial, guardada na primeira vez.
  var atributos = function (el) { return Array.prototype.map.call(el.attributes, function (a) { return [a.name, a.value]; }); };
  function guardar(doc) {
    if (doc.__meuSite) return doc.__meuSite;
    var g = { atributos: [], html: [], listas: [], cliente: null };
    todos(doc, "[data-site-secao],[data-site],[data-site-botao],[data-site-img],a[href^='#'],[data-phone]").forEach(function (el) {
      g.atributos.push([el, atributos(el)]);
      if (el.matches("[data-site],[data-site-botao],[data-phone]")) g.html.push([el, el.innerHTML]);
    });
    todos(doc, "[data-site-lista]").forEach(function (el) {
      if (!el.hasAttribute("data-site-runtime")) g.listas.push([el, itensDe(el).map(function (n) { return n.cloneNode(true); })]);
    });
    var w = doc.defaultView, cl = w && w.DEMO_CLIENT;
    if (cl) g.cliente = { whatsapp: cl.whatsapp, phone: cl.phone, instagram: cl.instagram, reviews: (cl.reviews || []).slice() };
    doc.__meuSite = g;
    return g;
  }

  function restaurar(doc, g) {
    g.listas.forEach(function (par) {
      var lista = par[0], atuais = itensDe(lista);
      var depois = atuais.length ? atuais[atuais.length - 1].nextSibling : null;
      atuais.forEach(function (n) { lista.removeChild(n); });
      par[1].forEach(function (n) { lista.insertBefore(n.cloneNode(true), depois); });
    });
    g.atributos.forEach(function (par) {
      var el = par[0];
      atributos(el).forEach(function (a) { el.removeAttribute(a[0]); });
      par[1].forEach(function (a) { el.setAttribute(a[0], a[1]); });
    });
    g.html.forEach(function (par) { if (par[0].innerHTML !== par[1]) par[0].innerHTML = par[1]; });
    var w = doc.defaultView, cl = w && w.DEMO_CLIENT;
    if (cl && g.cliente) {
      Object.keys(g.cliente).forEach(function (k) { cl[k] = k === "reviews" ? g.cliente.reviews.slice() : g.cliente[k]; });
      if (w.DEMO_RUNTIME) { w.DEMO_RUNTIME.links(); w.DEMO_RUNTIME.avaliacoes(); }
    }
  }

  /**
   * Aplica o conteúdo publicado sobre a versão inicial. opcoes.parado = HTML que não está aberto num navegador
   * (versão final): o contato e as avaliações vão para o texto do <script> do DEMO_CLIENT. opcoes.imagem(src) devolve o
   * endereço a usar ou null (padrão: nenhuma imagem de fora). Devolve false se o conteúdo for inválido.
   */
  function aplicar(doc, c, opcoes) {
    opcoes = opcoes || {};
    if (validar(c).length) return false;
    var parado = !!opcoes.parado;
    var op = { imagem: opcoes.imagem || function () { return null; } };
    var g = parado ? null : guardar(doc);
    if (g) restaurar(doc, g);
    var cliente = lerCliente(doc), k = c.contato || {};
    var ctx = {
      whatsapp: k.whatsapp || cliente.whatsapp,
      mensagem: k.mensagem !== undefined ? k.mensagem : cliente.mensagem,
      telefone: k.telefone || cliente.telefone,
      instagram: k.instagram || cliente.instagram,
      temSecao: function (id) { return NOME.test(id) && !!doc.getElementById(id); },
    };
    var avaliacoes = null;
    cada(c.secoes, function (nome, s) {
      var secao = doc.querySelector('[data-site-secao="' + nome + '"]');
      if (!secao) return;
      if (s.visivel === false) {
        secao.hidden = true;
        if (secao.id) todos(doc, 'a[href="#' + secao.id + '"]').forEach(function (a) { a.hidden = true; });
      }
      cada(s.textos, function (campo, v) { todos(doc, '[data-site="' + nome + "." + campo + '"]').forEach(function (el) { porTexto(el, v); }); });
      cada(s.imagens, function (campo, img) { todos(doc, 'img[data-site-img="' + nome + "." + campo + '"]').forEach(function (el) { porImagem(el, img, op); }); });
      cada(s.listas, function (campo, itens) {
        var lista = doc.querySelector('[data-site-lista="' + nome + "." + campo + '"]');
        if (!lista) return;
        if (lista.getAttribute("data-site-runtime") === "avaliacoes") {
          avaliacoes = itens.filter(function (it) { return it.visivel !== false && it.textos && it.textos.nome && it.textos.texto; })
            .map(function (it) { return { nome: it.textos.nome, texto: it.textos.texto, tag: it.textos.tag || "" }; });
          return;
        }
        var modelos = g ? (g.listas.filter(function (p) { return p[0] === lista; })[0] || [null, []])[1] : itensDe(lista);
        porLista(lista, itens, modelos, op);
      });
      cada(s.botoes, function (campo, b) { todos(doc, '[data-site-botao="' + nome + "." + campo + '"]').forEach(function (el) { porBotao(el, b, ctx); }); });
    });
    if (c.contato || avaliacoes) gravarCliente(doc, ctx, avaliacoes, parado);
    if (k.telefone) todos(doc, "[data-phone]").forEach(function (el) { el.textContent = foneLegivel(k.telefone); });
    var rt = !parado && doc.defaultView && doc.defaultView.DEMO_RUNTIME;
    if (rt) rt.carrosseis();
    return true;
  }

  /** Volta a página aberta à versão inicial (conta desconectada no meio da visita). */
  function voltar(doc) { if (doc.__meuSite) restaurar(doc, doc.__meuSite); }

  // ---------- extrair: o conteúdo inicial de um site, no mesmo formato (para a montagem no painel) ----------
  function deTexto(el) {
    return Array.prototype.map.call(el.childNodes, function (n) {
      return n.nodeName === "EM" ? "*" + n.textContent + "*" : n.textContent;
    }).join("").replace(/\s+/g, " ").trim();
  }

  function deBotao(el) {
    var href = el.getAttribute("href") || "", b = { rotulo: textosDe(el).map(function (n) { return n.nodeValue; }).join(" ").replace(/\s+/g, " ").trim() };
    if (el.hasAttribute("data-whatsapp")) b.acao = "whatsapp";
    else if (el.hasAttribute("data-instagram")) b.acao = "instagram";
    else if (el.hasAttribute("data-phone")) b.acao = "telefone";
    else if (el.hasAttribute("data-directions") || el.hasAttribute("data-maps")) b.acao = "rota";
    else if (/^#[a-z0-9-]+$/.test(href) && href.length > 1) { b.acao = "secao"; b.destino = href.slice(1); }
    else if (/^https:\/\/wa\.me\//.test(href)) { b.acao = "whatsapp"; var m = href.match(/[?&]text=([^&]*)/); if (m) b.mensagem = decodeURIComponent(m[1]); }
    else if (/^tel:/.test(href)) { b.acao = "telefone"; b.destino = href.replace(/\D/g, ""); }
    else if (/^mailto:/.test(href)) { b.acao = "email"; b.destino = href.slice(7); }
    else if (/^https:\/\//.test(href)) { b.acao = "link"; b.destino = href; }
    if (el.hidden) b.visivel = false;
    return b;
  }

  function extrair(doc) {
    var c = { esquema: ESQUEMA, secoes: {} };
    var secao = function (n) { return c.secoes[n] || (c.secoes[n] = { visivel: true }); };
    var campo = function (chave, tipo) {
      var p = chave.split("."), s = secao(p[0]);
      return [s[tipo] || (s[tipo] = {}), p[1]];
    };
    var foraDeItem = function (el) { return !el.closest("[data-site-item]"); };
    todos(doc, "[data-site-secao]").forEach(function (el) { secao(el.getAttribute("data-site-secao")).visivel = !el.hidden; });
    todos(doc, "[data-site]").filter(foraDeItem).forEach(function (el) { var a = campo(el.getAttribute("data-site"), "textos"); a[0][a[1]] = deTexto(el); });
    todos(doc, "[data-site-img]").filter(foraDeItem).forEach(function (el) {
      var a = campo(el.getAttribute("data-site-img"), "imagens");
      a[0][a[1]] = { src: el.getAttribute("src") || "", alt: el.getAttribute("alt") || "" };
    });
    todos(doc, "[data-site-botao]").filter(foraDeItem).forEach(function (el) { var a = campo(el.getAttribute("data-site-botao"), "botoes"); a[0][a[1]] = deBotao(el); });
    var cliente = lerCliente(doc);
    todos(doc, "[data-site-lista]").forEach(function (el) {
      var a = campo(el.getAttribute("data-site-lista"), "listas");
      if (el.getAttribute("data-site-runtime") === "avaliacoes") {
        a[0][a[1]] = cliente.avaliacoes.map(function (r) { return { textos: { nome: r.nome, texto: r.texto, tag: r.tag } }; });
        return;
      }
      a[0][a[1]] = itensDe(el).map(function (item, i) {
        var it = { de: i };
        noItem(item, "[data-site-campo]").forEach(function (e) {
          var nome = e.getAttribute("data-site-campo");
          if (e.tagName === "IMG") (it.imagens || (it.imagens = {}))[nome] = { src: e.getAttribute("src") || "", alt: e.getAttribute("alt") || "" };
          else (it.textos || (it.textos = {}))[nome] = deTexto(e);
        });
        return it;
      });
    });
    c.contato = {};
    ["whatsapp", "mensagem", "telefone", "instagram"].forEach(function (k) { if (cliente[k] !== undefined) c.contato[k] = cliente[k]; });
    return c;
  }

  // ---------- no site ----------
  function lerCache(chave) {
    try {
      var g = JSON.parse(global.localStorage.getItem(chave));
      if (g && Date.now() - g.em < VALIDADE && g.em <= Date.now() && !validar(g.conteudo).length) return g.conteudo;
    } catch (e) { /* sem cache */ }
    return null;
  }
  function gravarCache(chave, c) { try { global.localStorage.setItem(chave, JSON.stringify({ em: Date.now(), conteudo: c })); } catch (e) { /* cheio ou bloqueado */ } }
  function apagarCache(chave) { try { global.localStorage.removeItem(chave); } catch (e) { /* nada */ } }

  function marcarPrevia(doc) {
    if (doc.getElementById("rz-previa")) return;
    var p = doc.createElement("div");
    p.id = "rz-previa";
    p.textContent = "Prévia do rascunho (Meu site)";
    p.setAttribute("style", "position:fixed;left:12px;bottom:12px;z-index:2147483647;padding:8px 12px;border-radius:8px;background:#1c1b19;color:#fff;font:600 13px/1.3 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25)");
    doc.body.appendChild(p);
  }

  function iniciar(script) {
    var doc = global.document;
    var codigo = script && script.getAttribute("data-codigo");
    if (!doc || !codigo || !NOME.test(codigo) || typeof global.fetch !== "function") return;
    var api = script.getAttribute("data-api") || API, origem;
    try { origem = new URL(api).origin; } catch (e) { return; }
    var previa = (global.location.search.match(/[?&]rz-previa=([A-Za-z0-9_-]{8,200})(?:&|$)/) || [])[1];
    var chave = "rz-meu-site:" + codigo, aplicada = null, noPrazo = true;
    var opcoes = { imagem: function (src) { try { return new URL(src).origin === origem ? src : null; } catch (e) { return null; } } };
    var assinatura = function (c) { return c.versao + "|" + c.publicado_em; };
    var pronto = new Promise(function (ok) {
      if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { ok(); });
      else ok();
    });
    var mostrar = function (c) {
      pronto.then(function () {
        try {
          if (!c) { if (aplicada !== null) { voltar(doc); aplicada = null; } return; }
          if (assinatura(c) === aplicada) return;
          if (aplicar(doc, c, opcoes)) aplicada = assinatura(c);
          if (previa) marcarPrevia(doc);
        } catch (e) { /* o site fica como está */ }
      });
    };
    if (!previa) { var guardada = lerCache(chave); if (guardada) mostrar(guardada); }
    setTimeout(function () { noPrazo = false; }, ESPERA);
    var ctrl = typeof global.AbortController === "function" ? new global.AbortController() : null;
    if (ctrl) setTimeout(function () { ctrl.abort(); }, 10000);
    var url = api + encodeURIComponent(codigo) + (previa ? "/previa?t=" + previa : "");
    global.fetch(url, { credentials: "omit", cache: previa ? "no-store" : "default", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (r.status === 404) { if (!previa) apagarCache(chave); if (noPrazo) mostrar(null); return; }
        if (!r.ok) return;
        var naHora = noPrazo;
        return r.json().then(function (c) {
          if (!ehObjeto(c) || c.site !== codigo || validar(c).length) return;
          if (!previa) gravarCache(chave, c);
          if (naHora || previa) mostrar(c);
        });
      })
      .catch(function () { /* fora do ar, demorou ou bloqueado: fica a versão que está na tela */ });
  }

  var api = { ESQUEMA: ESQUEMA, API: API, validar: validar, partes: partes, destino: destino, iniciais: iniciais, aplicar: aplicar, voltar: voltar, extrair: extrair, lerCliente: lerCliente };
  if (typeof module === "object" && module && module.exports) module.exports = api;
  else {
    global.RZ_MEU_SITE = api;
    try { iniciar(global.document && global.document.currentScript); } catch (e) { /* o site fica como está */ }
  }
})(this);
