// Meu site (Painel Renderiza, Missão 4 bloco B): o script dentro do site do cliente, as marcações dos geradores, o
// virar-site.mjs com o código do site e a versão final. Os de navegador usam o site de teste (test/site-teste, dados
// fictícios) num Chromium, com o painel imitado; sem o Playwright, ficam de fora.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { montar } from "./site-teste/montar.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = fs.readFileSync(path.join(RAIZ, "ferramentas", "meu-site", "meu-site.js"), "utf8");
const lib = (() => { const m = { exports: {} }; new Function("module", FONTE)(m); return m.exports; })();
const SITE = "https://villa-alecrim.teste/";
const API = "https://painel.renderizaweb.com.br/api/publico/site/villa-alecrim";
const IMG = "https://painel.renderizaweb.com.br/imagens/sites/villa-alecrim/topo-novo.png";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

let playwright = null;
try { playwright = createRequire(import.meta.url)("playwright"); } catch { /* sem navegador: só os testes de Node */ }
const comNavegador = { skip: playwright ? false : "sem o Playwright" };

/** Um conteúdo publicado (o que o painel devolve), com o mínimo do contrato. */
const publicado = (secoes = {}, extra = {}) => ({ esquema: 1, site: "villa-alecrim", versao: 7, publicado_em: "2026-11-20T14:03:00-03:00", secoes, ...extra });

// ---------- biblioteca (Node) ----------
test("validar: aceita o contrato e recusa o que pode quebrar o site", () => {
  assert.deepEqual(lib.validar(publicado({ inicio: { textos: { titulo: "Festas *no verde.*" }, botoes: { botao: { rotulo: "Reservar", acao: "link", destino: "https://exemplo.com.br/x" } } } })), []);
  const ruins = [
    [{ esquema: 2 }, /esquema/],
    [publicado({ Inicio: {} }), /nome inválido/],
    [publicado({ inicio: { visivel: false } }), /início não some/],
    [publicado({ sobre: { textos: { titulo: "x".repeat(601) } } }), /passa de 600/],
    [publicado({ sobre: { textos: { titulo: 7 } } }), /não é texto/],
    [publicado({ inicio: { botoes: { botao: { acao: "link", destino: "javascript:alert(1)" } } } }), /destino inválido/],
    [publicado({ inicio: { botoes: { botao: { acao: "link", destino: "http://exemplo.com" } } } }), /destino inválido/],
    [publicado({ inicio: { botoes: { botao: { acao: "abrir" } } } }), /ação desconhecida/],
    [publicado({ inicio: { imagens: { foto: { src: "javascript:x" } } } }), /endereço inválido/],
    [publicado({ espaco: { listas: { fotos: Array(61).fill({}) } } }), /passa de 60 itens/],
    [publicado({ espaco: { listas: { fotos: [{ de: -1 }] } } }), /posição/],
    [publicado({}, { contato: { whatsapp: "11 99999-0000" } }), /whatsapp/],
    [publicado({}, { contato: { instagram: "nome com espaço" } }), /instagram/],
  ];
  for (const [c, erro] of ruins) assert.match(lib.validar(c).join("\n"), erro, JSON.stringify(c).slice(0, 120));
});

test("destaque: *trecho* vira as partes em destaque", () => {
  assert.deepEqual(lib.partes("Festas e casamentos *no meio do verde.*"), [["Festas e casamentos ", false], ["no meio do verde.", true]]);
  assert.deepEqual(lib.partes("sem destaque"), [["sem destaque", false]]);
  assert.deepEqual(lib.partes("*a* e *b*"), [["a", true], [" e ", false], ["b", true]]);
});

test("destino dos botões: só WhatsApp, telefone, https, seção da página, rota, Instagram e e-mail", () => {
  const ctx = { whatsapp: "5511900000000", mensagem: "Olá!", telefone: "5511900000000", instagram: "villa", temSecao: id => id === "espaco" };
  assert.equal(lib.destino({ acao: "whatsapp" }, ctx).href, "https://wa.me/5511900000000?text=Ol%C3%A1!");
  assert.equal(lib.destino({ acao: "whatsapp", mensagem: "Quero uma data" }, ctx).href, "https://wa.me/5511900000000?text=Quero%20uma%20data");
  assert.equal(lib.destino({ acao: "telefone" }, ctx).href, "tel:+5511900000000");
  assert.equal(lib.destino({ acao: "secao", destino: "espaco" }, ctx).href, "#espaco");
  assert.equal(lib.destino({ acao: "secao", destino: "nao-existe" }, ctx), null);
  assert.equal(lib.destino({ acao: "instagram", destino: "@outro.perfil" }, ctx).href, "https://www.instagram.com/outro.perfil/");
  assert.equal(lib.destino({ acao: "email", destino: "oi@villa.com.br" }, ctx).href, "mailto:oi@villa.com.br");
  assert.match(lib.destino({ acao: "rota", destino: "Estrada do Alecrim, 100" }, ctx).href, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=Estrada/);
  for (const d of ["javascript:alert(1)", "data:text/html,x", "http://exemplo.com", "https://exemplo.com/\"onclick", "//exemplo.com"]) {
    assert.equal(lib.destino({ acao: "link", destino: d }, ctx), null, d);
  }
});

test("iniciais do depoimento, como no gerar.py", () => {
  assert.equal(lib.iniciais("Ana Souza"), "AS");
  assert.equal(lib.iniciais("Bruno (Local Guide) Lima"), "BL");
  assert.equal(lib.iniciais("Érica"), "É");
});

// ---------- site de teste no navegador ----------
let pasta, site, demo, navegador;
before(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "meu-site-"));
  ({ site, demo } = montar(path.join(pasta, "saida")));
  if (playwright) navegador = await playwright.chromium.launch();
});
after(async () => {
  await navegador?.close();
  fs.rmSync(pasta, { recursive: true, force: true });
});

const TIPO = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".png": "image/png" };
const espera = ms => new Promise(r => setTimeout(r, ms));

/**
 * Abre o site de teste num contexto novo (ou no dado). painel: { conteudo, status, atraso } diz como o painel imitado
 * responde (status 0 = fora do ar). Devolve a página, os erros de script e os pedidos ao painel.
 */
async function abrir({ contexto, painel = { status: 404 }, pastaSite = site, endereco = SITE } = {}) {
  const ctx = contexto || await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const pagina = await ctx.newPage();
  const erros = [], pedidos = [];
  pagina.on("pageerror", e => erros.push(e.message));
  await pagina.route("**/*", async rota => {
    const u = new URL(rota.request().url());
    if (u.origin === "https://villa-alecrim.teste") {
      const arquivo = path.join(pastaSite, u.pathname === "/" ? "index.html" : decodeURIComponent(u.pathname));
      if (!arquivo.startsWith(pastaSite) || !fs.existsSync(arquivo)) return rota.fulfill({ status: 404, body: "" });
      return rota.fulfill({ status: 200, contentType: TIPO[path.extname(arquivo)] || "application/octet-stream", body: fs.readFileSync(arquivo) });
    }
    if (u.origin === "https://painel.renderizaweb.com.br") {
      pedidos.push(u.pathname + u.search);
      if (u.pathname.startsWith("/imagens/")) return rota.fulfill({ status: 200, contentType: "image/png", body: PNG });
      if (painel.atraso) await espera(painel.atraso);
      if (painel.status === 0) return rota.abort();
      return rota.fulfill({
        status: painel.status ?? 200,
        headers: { "access-control-allow-origin": "*", "content-type": "application/json" },
        body: painel.corpo ?? JSON.stringify(painel.conteudo ?? {}),
      });
    }
    return rota.abort(); // fontes, mapa: nada de fora
  });
  await pagina.goto(endereco);
  return { pagina, contexto: ctx, erros, pedidos };
}

const textoDe = (p, seletor) => p.$eval(seletor, el => el.innerHTML);
const inicial = async p => p.evaluate(() => ({
  titulo: document.querySelector("#hero-heading").innerHTML,
  fotos: document.querySelectorAll("#espaco-track > li").length,
  depoimentos: document.querySelectorAll("#reviews-track > li").length,
  whatsapp: document.querySelector(".floating-whatsapp").href,
  festas: document.querySelector("#festas").hidden,
}));
const ORIGINAL = { titulo: "Festas e casamentos <em>no meio do verde.</em>", fotos: 4, depoimentos: 3, festas: false };

test("o site sai do virar-site.mjs com o script do Meu site no <head>, uma vez, com o código do site", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const cabeca = html.slice(0, html.indexOf("</head>"));
  assert.equal((html.match(/<script data-codigo="villa-alecrim">/g) || []).length, 1);
  assert.ok(cabeca.includes('<script data-codigo="villa-alecrim">'));
  assert.ok(!fs.readFileSync(demo, "utf8").includes("data-codigo"), "a demo não leva o script");
});

test("o gerador marca o que pode mudar, com um nome por campo", () => {
  const html = fs.readFileSync(demo, "utf8");
  for (const m of ['data-site-secao="inicio"', 'data-site="inicio.titulo"', 'data-site-botao="inicio.botao"', 'data-site-img="inicio.foto"',
    'data-site-lista="espaco.fotos"', 'data-site-lista="estrutura.itens"', 'data-site-lista="consulta.tipos"', 'data-site-lista="sobre.paragrafos"',
    'data-site-lista="depoimentos.avaliacoes" data-site-runtime="avaliacoes"', 'data-site-secao="rodape"']) {
    assert.ok(html.includes(m), m);
  }
  const chaves = [...html.matchAll(/data-site(?:-botao|-img)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(chaves.every(k => /^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$/.test(k)), "seção.campo");
});

test("painel fora do ar, com erro ou sem a conta: o site abre com a versão inicial, sem erro", comNavegador, async () => {
  for (const painel of [{ status: 404 }, { status: 0 }, { status: 500 }, { status: 200, corpo: "não é json" }, { status: 200, conteudo: { esquema: 99 } }]) {
    const { pagina, contexto, erros } = await abrir({ painel });
    await espera(400);
    assert.deepEqual({ ...(await inicial(pagina)), whatsapp: undefined }, { ...ORIGINAL, whatsapp: undefined }, JSON.stringify(painel));
    assert.deepEqual(erros, []);
    await contexto.close();
  }
});

test("versão publicada: textos, botões, imagens, listas, seções, avaliações e contato", comNavegador, async () => {
  const conteudo = publicado({
    inicio: {
      textos: { titulo: "Casamentos *no jardim.*", texto: "Texto novo do topo." },
      botoes: { botao: { rotulo: "Reservar a data", acao: "link", destino: "https://exemplo.com.br/reserva" }, link: { rotulo: "Ver as festas", acao: "secao", destino: "estrutura" } },
      imagens: { foto: { src: IMG, alt: "Topo novo" } },
    },
    cabecalho: { botoes: { botao: { visivel: false } } },
    sobre: { listas: { paragrafos: [{ de: 1 }, { textos: { texto: "Um parágrafo novo." } }] } },
    espaco: { listas: { fotos: [{ de: 2 }, { de: 0, imagens: { foto: { alt: "Salão, de novo" } } }] } },
    estrutura: { listas: { itens: [{ de: 1, textos: { texto: "Piscina aquecida" } }] } },
    consulta: { listas: { tipos: [{ textos: { texto: "Formatura" } }, { de: 0 }] } },
    festas: { visivel: false },
    depoimentos: { listas: { avaliacoes: [{ textos: { nome: "Diego Alves", texto: "Formatura impecável.", tag: "Formatura" } }] } },
  }, { contato: { whatsapp: "5511988887777", mensagem: "Oi, Villa!", instagram: "outro.perfil", telefone: "5511988887777" } });
  const { pagina, contexto, erros } = await abrir({ painel: { conteudo } });
  await pagina.waitForFunction(() => document.querySelector("#hero-heading").textContent.includes("jardim"));
  const r = await pagina.evaluate(() => {
    const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    return {
      titulo: $("#hero-heading").innerHTML,
      texto: $(".hero-intro").textContent,
      botao: [$('[data-site-botao="inicio.botao"]').textContent.trim(), $('[data-site-botao="inicio.botao"]').href, $('[data-site-botao="inicio.botao"]').target, !!$('[data-site-botao="inicio.botao"] svg')],
      link: [$('[data-site-botao="inicio.link"]').textContent.trim(), $('[data-site-botao="inicio.link"]').getAttribute("href")],
      cta: $(".header-cta").hidden,
      foto: [$('[data-site-img="inicio.foto"]').src, $('[data-site-img="inicio.foto"]').alt],
      paragrafos: $$("#sobre .story-copy > p[data-site-item]").map(p => p.textContent),
      fotos: $$("#espaco-track > li img").map(i => i.alt),
      estrutura: $$("#estrutura li").map(li => [li.textContent, !!li.querySelector("svg")]),
      tipos: $$("#consulta select option").map(o => o.textContent),
      festas: [$("#festas").hidden, getComputedStyle($("#festas")).display],
      depoimentos: $$("#reviews-track > li").map(li => [li.querySelector("strong").textContent, li.querySelector(".review-avatar").textContent]),
      whatsapp: $(".floating-whatsapp").href,
      instagram: $(".insta-actions [data-instagram]").href,
      telefone: $("[data-phone]").textContent,
      pontos: $$("#espaco [data-dots] button").length,
    };
  });
  assert.equal(r.titulo, "Casamentos <em>no jardim.</em>");
  assert.equal(r.texto, "Texto novo do topo.");
  assert.deepEqual(r.botao, ["Reservar a data", "https://exemplo.com.br/reserva", "_blank", true]);
  assert.deepEqual(r.link, ["Ver as festas ↓", "#estrutura"]); // a seta é um elemento à parte e fica
  assert.equal(r.cta, true);
  assert.deepEqual(r.foto, [IMG, "Topo novo"]);
  assert.deepEqual(r.paragrafos, ["Hoje recebe casamentos, 15 anos e aniversários de até 300 convidados.", "Um parágrafo novo."]);
  assert.deepEqual(r.fotos, ["Piscina", "Salão, de novo"]);
  assert.deepEqual(r.estrutura, [["Piscina aquecida", true]]);
  assert.deepEqual(r.tipos, ["Formatura", "Casamento"]);
  assert.deepEqual(r.festas, [true, "none"]);
  assert.deepEqual(r.depoimentos, [["Diego Alves", "DA"]]);
  assert.equal(r.whatsapp, "https://wa.me/5511988887777?text=Oi%2C%20Villa!");
  assert.equal(r.instagram, "https://www.instagram.com/outro.perfil/");
  assert.equal(r.telefone, "(11) 98888-7777");
  assert.ok(r.pontos >= 1, "o carrossel refez os pontos");
  assert.deepEqual(erros, []);
  await contexto.close();
});

test("texto entra como texto e imagem de fora não entra", comNavegador, async () => {
  const conteudo = publicado({
    inicio: { textos: { titulo: '<img src=x onerror="window.invadiu=1">*<b>oi</b>*' }, imagens: { foto: { src: "https://outro-site.com/foto.png" } } },
  });
  const { pagina, contexto } = await abrir({ painel: { conteudo } });
  await pagina.waitForFunction(() => document.querySelector("#hero-heading").textContent.includes("img"));
  assert.equal(await pagina.evaluate(() => document.querySelector("#hero-heading img")), null);
  assert.equal(await pagina.evaluate(() => window.invadiu), undefined);
  assert.equal(await textoDe(pagina, "#hero-heading"), '&lt;img src=x onerror="window.invadiu=1"&gt;<em>&lt;b&gt;oi&lt;/b&gt;</em>');
  assert.match(await pagina.$eval('[data-site-img="inicio.foto"]', i => i.getAttribute("src")), /^\/img\//);
  await contexto.close();
  // um link proibido invalida a versão inteira: o site fica com a inicial
  const ruim = publicado({ inicio: { textos: { titulo: "Não pode" }, botoes: { botao: { acao: "link", destino: "javascript:alert(1)" } } } });
  const b = await abrir({ painel: { conteudo: ruim } });
  await espera(400);
  assert.equal((await inicial(b.pagina)).titulo, ORIGINAL.titulo);
  await b.contexto.close();
});

test("resposta demorada (mais de 1,5 s): a página fica com a inicial; a próxima visita já abre com a publicada", comNavegador, async () => {
  const conteudo = publicado({ inicio: { textos: { titulo: "Versão *guardada.*" } } });
  const a = await abrir({ painel: { conteudo, atraso: 2200 } });
  await espera(2600);
  assert.equal((await inicial(a.pagina)).titulo, ORIGINAL.titulo);
  const guardada = await a.pagina.evaluate(() => localStorage.getItem("rz-meu-site:villa-alecrim"));
  assert.ok(guardada && JSON.parse(guardada).conteudo.versao === 7, "a resposta foi para o navegador");
  // segunda visita com o painel fora do ar: abre com a guardada
  const b = await abrir({ contexto: a.contexto, painel: { status: 0 } });
  await b.pagina.waitForFunction(() => document.querySelector("#hero-heading").textContent.includes("guardada"));
  assert.equal(await textoDe(b.pagina, "#hero-heading"), "Versão <em>guardada.</em>");
  await a.contexto.close();
});

test("a versão guardada vale 24 horas, e \"não encontrado\" (conta desconectada) apaga e volta à inicial", comNavegador, async () => {
  const guardar = (horas) => (c => localStorage.setItem("rz-meu-site:villa-alecrim", JSON.stringify({ em: Date.now() - c.horas * 3600e3, conteudo: c.conteudo })));
  const conteudo = publicado({ inicio: { textos: { titulo: "Guardada" } }, festas: { visivel: false } });
  // velha: não aplica
  const ctx = await navegador.newContext({ reducedMotion: "reduce" });
  await ctx.addInitScript(guardar(), { horas: 25, conteudo });
  const a = await abrir({ contexto: ctx, painel: { status: 0 } });
  await espera(400);
  assert.equal((await inicial(a.pagina)).titulo, ORIGINAL.titulo);
  await ctx.close();
  // nova, mas o painel diz que a conta saiu: some na hora e o navegador esquece
  const ctx2 = await navegador.newContext({ reducedMotion: "reduce" });
  await ctx2.addInitScript(guardar(), { horas: 1, conteudo });
  const b = await abrir({ contexto: ctx2, painel: { status: 404, atraso: 300 } });
  await espera(900);
  assert.deepEqual({ ...(await inicial(b.pagina)), whatsapp: undefined }, { ...ORIGINAL, whatsapp: undefined });
  assert.equal(await b.pagina.evaluate(() => localStorage.getItem("rz-meu-site:villa-alecrim")), null);
  await ctx2.close();
});

test("a guardada aparece primeiro e a do painel por cima, sem sobrar nada da guardada", comNavegador, async () => {
  const velha = publicado({ inicio: { textos: { titulo: "Velha" } }, festas: { visivel: false }, espaco: { listas: { fotos: [{ de: 3 }] } } }, { versao: 6 });
  const nova = publicado({ sobre: { textos: { titulo: "Nova" } } }, { versao: 8 });
  const ctx = await navegador.newContext({ reducedMotion: "reduce" });
  await ctx.addInitScript(c => localStorage.setItem("rz-meu-site:villa-alecrim", JSON.stringify({ em: Date.now(), conteudo: c })), velha);
  const { pagina, erros } = await abrir({ contexto: ctx, painel: { conteudo: nova, atraso: 300 } });
  await pagina.waitForFunction(() => document.querySelector("#story-heading").textContent === "Nova");
  assert.deepEqual({ ...(await inicial(pagina)), whatsapp: undefined }, { ...ORIGINAL, whatsapp: undefined });
  assert.deepEqual(erros, []);
  await ctx.close();
});

test("prévia: ?rz-previa=<código> pede o rascunho, mostra o aviso e não guarda nada", comNavegador, async () => {
  const rascunho = publicado({ inicio: { textos: { titulo: "Rascunho" } } });
  const { pagina, contexto, pedidos } = await abrir({ painel: { conteudo: rascunho }, endereco: SITE + "?rz-previa=abc123def456" });
  await pagina.waitForFunction(() => document.querySelector("#hero-heading").textContent === "Rascunho");
  assert.deepEqual(pedidos, ["/api/publico/site/villa-alecrim/previa?t=abc123def456"]);
  assert.match(await pagina.textContent("#rz-previa"), /Prévia/);
  assert.equal(await pagina.evaluate(() => localStorage.getItem("rz-meu-site:villa-alecrim")), null);
  await contexto.close();
});

test("extrair: o conteúdo inicial sai no formato do contrato, válido, e aplicá-lo não muda nada", comNavegador, async () => {
  const { pagina, contexto } = await abrir({ painel: { status: 404 } });
  await espera(300);
  const r = await pagina.evaluate(() => {
    const antes = document.body.innerText;
    const c = window.RZ_MEU_SITE.extrair(document);
    const erros = window.RZ_MEU_SITE.validar(c);
    const aplicou = window.RZ_MEU_SITE.aplicar(document, c, { imagem: () => null });
    return { c, erros, aplicou, igual: document.body.innerText === antes };
  });
  assert.ok(r.aplicou && r.igual, "aplicar o conteúdo inicial deixa a página igual");
  assert.deepEqual(r.erros, []);
  assert.equal(r.c.secoes.inicio.textos.titulo, "Festas e casamentos *no meio do verde.*");
  assert.deepEqual(r.c.secoes.inicio.botoes.link, { rotulo: "Ver o espaço", acao: "secao", destino: "espaco" });
  assert.equal(r.c.secoes.espaco.listas.fotos.length, 4);
  assert.deepEqual(r.c.ordem, Object.keys(r.c.secoes), "a ordem das seções vai junto (o jsonb do banco reordena as chaves)");
  assert.equal(r.c.ordem[0], "cabecalho");
  assert.equal(r.c.secoes.depoimentos.listas.avaliacoes[0].textos.nome, "Ana Souza");
  assert.deepEqual(r.c.contato, { whatsapp: "5511900000000", mensagem: "Olá! Vim pelo site da Villa Alecrim.", telefone: "5511900000000", instagram: "villa.alecrim.teste" });
  assert.deepEqual({ ...(await inicial(pagina)), whatsapp: undefined }, { ...ORIGINAL, whatsapp: undefined });
  await contexto.close();
});

test("versão final: conteúdo embutido, imagens em img/, sem o script e sem depender do painel", comNavegador, async () => {
  const { versaoFinal } = await import("../scripts/versao-final.mjs");
  const conteudo = publicado({
    inicio: { textos: { titulo: "Casamentos *no jardim.*" }, imagens: { foto: { src: IMG, alt: "Topo novo" } } },
    festas: { visivel: false },
    depoimentos: { listas: { avaliacoes: [{ textos: { nome: "Diego Alves", texto: "Formatura impecável.", tag: "Formatura" } }] } },
  }, { contato: { whatsapp: "5511988887777", instagram: "outro.perfil" } });
  const saida = path.join(pasta, "final");
  const r = await versaoFinal(site, conteudo, saida, { baixar: async () => ({ tipo: "image/png", dados: PNG }) });
  assert.equal(r.baixadas, 1);
  const html = fs.readFileSync(path.join(saida, "index.html"), "utf8");
  assert.ok(!/data-codigo|data-site|RZ_MEU_SITE/.test(html), "sem script nem marcações");
  assert.ok(/^<!doctype html>\n<html/i.test(html));
  assert.match(fs.readFileSync(path.join(saida, "README.md"), "utf8"), /Versão final do Meu site/);
  const { pagina, contexto, erros, pedidos } = await abrir({ pastaSite: saida, painel: { status: 0 } });
  await espera(400);
  const v = await pagina.evaluate(() => ({
    titulo: document.querySelector("#hero-heading").innerHTML,
    foto: document.querySelector(".hero-photo img").getAttribute("src"),
    festas: document.querySelector("#festas").hidden,
    depoimentos: [...document.querySelectorAll("#reviews-track > li strong")].map(s => s.textContent),
    whatsapp: document.querySelector(".floating-whatsapp").href,
    instagram: document.querySelector(".insta-actions a").href,
  }));
  assert.equal(v.titulo, "Casamentos <em>no jardim.</em>");
  assert.match(v.foto, /^\/img\/painel-[0-9a-f]{10}\.png$/);
  assert.ok(fs.existsSync(path.join(saida, v.foto)));
  assert.equal(v.festas, true);
  assert.deepEqual(v.depoimentos, ["Diego Alves"]);
  assert.match(v.whatsapp, /^https:\/\/wa\.me\/5511988887777\?text=Ol%C3%A1/);
  assert.equal(v.instagram, "https://www.instagram.com/outro.perfil/");
  assert.deepEqual(pedidos, [], "não pede nada ao painel");
  assert.deepEqual(erros, []);
  await contexto.close();
  await assert.rejects(versaoFinal(saida, conteudo, path.join(pasta, "final2"), { baixar: async () => ({ tipo: "image/png", dados: PNG }) }), /já é uma versão final/);
});
