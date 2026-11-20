// Telas do Reels "Estoque" (reels-estoque.html), tiradas do Estoque de VERDADE em protótipo: o painel da Ricardo
// Motors (/demo/ricardo-motors/painel: a casca do Painel Renderiza com o módulo de exemplos/estoque) e o site dele
// (/demo/ricardo-motors), que recebe a lista do painel (docs/painel-clientes/12-modulo-estoque.md). Nada é desenhado:
// cada imagem é uma captura, no celular (412 × 812, a tela do celular do Reels, em 2×).
//   site-topo.jpg (a capa), site-pagina.jpg (a página inteira, sem o topo fixo) e site-cabeca.jpg (o topo fixo)
//   site-novo.jpg (o carro novo chegando na vitrine) · pn-lista, pn-novo, pn-foto, pn-dados, pn-preco, pn-salvo,
//   pn-acoes, pn-vendido (o painel) · posicoes.json (onde ficam os botões tocados, em px de 412 × 812)
// O carro novo do vídeo é um exemplo: a foto (de um carro que já passou pela loja) vem por argumento e não entra no
// repositório; só as capturas entram.
// Uso: node instagram/telas-estoque.mjs <foto-do-carro-novo.jpg>   (rodar de novo quando o painel ou o site mudarem)

import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";
import { RAIZ, ORIGEM, arquivo } from "../ferramentas/exemplos/servir.mjs";

const FOTO = process.argv[2];
if (!FOTO || !fs.existsSync(FOTO)) { console.error("Uso: node instagram/telas-estoque.mjs <foto-do-carro-novo.jpg>"); process.exit(1); }
const SAIDA = path.join(RAIZ, "instagram", "telas-estoque");
fs.mkdirSync(SAIDA, { recursive: true });
const TIPO = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const DEMO = path.join(RAIZ, "demos", "ricardo-motors");
const NOVO = { id: "novo-911", situacao: "disponivel", destaque: true, preco: 689900, selos: ["Novo no estoque"], descricao: "",
  campos: { marca: "Porsche", modelo: "911 Carrera", versao: "3.0 24V H6 GASOLINA PDK", ano_fab: 2019, ano_modelo: 2020, km: 21000, cor: "Branco", cambio: "Automático", combustivel: "Gasolina", carroceria: "Cupê" } };

// a página que embrulha o site como o painel faz (o quadro com ?rz-estoque=exemplo), para mandar uma lista e capturar
const EMBRULHO = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0b0b0c"><iframe id="f" src="/demo/ricardo-motors?rz-estoque=exemplo&video=1" style="border:0;width:100vw;height:100vh;display:block"></iframe>
<script type="module">import { paraOSite } from "/exemplos/estoque/modulo.js"; import { ESQUEMAS } from "/exemplos/estoque/esquemas.js";
addEventListener("message", e => { if (e.data && e.data.tipo === "rz-estoque-pronto") window.pronto = true; });
window.mandar = (itens, foco) => document.getElementById("f").contentWindow.postMessage({ tipo: "rz-estoque", itens: paraOSite(ESQUEMAS.automotivo, itens), foco }, location.origin);
</script></body></html>`;

async function rotas(ctx) {
  await ctx.route("**/*", r => {
    const u = new URL(r.request().url());
    if (u.origin === ORIGEM) {
      if (u.pathname.startsWith("/api/visita")) return r.fulfill({ status: 204, body: "" });
      if (u.pathname === "/embrulho") return r.fulfill({ status: 200, contentType: TIPO[".html"], body: EMBRULHO });
      if (u.pathname.startsWith("/demo/ricardo-motors/f/")) return r.continue(); // as fotos publicadas (não saem do ar)
      const m = /^\/demo\/ricardo-motors(?:\/([a-z0-9-]+))?\/?$/.exec(u.pathname);
      const f = m ? path.join(DEMO, (m[1] || "index") + ".html") : arquivo(u.pathname);
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: "" });
      return r.fulfill({ status: 200, contentType: TIPO[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });
    }
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return r.continue();
    return r.abort();
  });
}
const caixa = async (p, sel) => p.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }, sel);
const foto = async (p, nome, opcoes = {}) => p.screenshot({ path: path.join(SAIDA, nome + ".jpg"), type: "jpeg", quality: 90, ...opcoes });
const espera = ms => new Promise(r => setTimeout(r, ms));

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 412, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "pt-BR" });
await rotas(ctx);
const P = {};

// ---------- o site ----------
{
  const p = await ctx.newPage();
  await p.goto(ORIGEM + "/demo/ricardo-motors?video=1", { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "*{animation-play-state:paused!important}.slides img{transition:none!important}" });
  await espera(1500);
  await foto(p, "site-topo");
  await foto(p, "site-cabeca", { clip: { x: 0, y: 0, width: 412, height: 68 } });
  P.estoque = await p.evaluate(() => document.getElementById("estoque").offsetTop);
  await p.addStyleTag({ content: ".topo{visibility:hidden}.wa-f{display:none}" });
  await p.evaluate(() => document.querySelectorAll("#grade img").forEach(i => { i.loading = "eager"; }));
  await espera(1500);
  await foto(p, "site-pagina", { fullPage: true });
  P.pagina = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.close();
}

// ---------- o painel ----------
const pn = await ctx.newPage();
await pn.goto(ORIGEM + "/demo/ricardo-motors/painel?video=1", { waitUntil: "networkidle" });
await pn.addStyleTag({ content: ".ex-faixa{display:none}" }); // no vídeo, o celular leva a etiqueta "exemplo"
await espera(2500);
await foto(pn, "pn-lista");
P.mais = await caixa(pn, ".rz-topo-mais");
P.barraEstoque = await caixa(pn, '.rz-barra a[href="/estoque"]');
P.barraMeuSite = await caixa(pn, '.rz-barra a[href="/meu-site"]');
await pn.tap(".rz-topo-mais");
await espera(900);
await foto(pn, "pn-novo");
P.adicionarFotos = await caixa(pn, ".et-foto--mais");
await pn.setInputFiles("[data-enviar]", FOTO);
await espera(1200);
await pn.fill("#et-marca", NOVO.campos.marca);
await pn.fill("#et-modelo", NOVO.campos.modelo);
await foto(pn, "pn-foto");
await pn.fill("#et-versao", "3.0 24V H6 Gasolina PDK");
await pn.fill("#et-ano_fab", "2019");
await pn.fill("#et-ano_modelo", "2020");
await pn.fill("#et-km", "21000");
await pn.fill("#et-cor", "Branco");
await pn.selectOption("#et-cambio", "Automático");
await pn.selectOption("#et-combustivel", "Gasolina");
await pn.selectOption("#et-carroceria", "Cupê");
await pn.evaluate(() => document.querySelector("#et-marca").blur());
await pn.locator(".rz-janela-corpo").evaluate(e => { e.scrollTop = document.querySelector("#et-versao").closest(".rz-campo").offsetTop - 70; });
await espera(500);
await foto(pn, "pn-dados");
await pn.fill("#et-preco", "689.900");
await pn.locator('input[name="selos"][value="Novo no estoque"]').check({ force: true });
await pn.locator('input[name="destaque"]').check({ force: true });
await pn.evaluate(() => document.activeElement && document.activeElement.blur());
await pn.locator(".rz-janela-corpo").evaluate(e => { e.scrollTop = document.querySelector("#et-preco").closest(".et-bloco").offsetTop - 40; });
await espera(500);
await foto(pn, "pn-preco");
P.salvar = await caixa(pn, "[data-salvar]");
await pn.tap("[data-salvar]");
await espera(1300);
await foto(pn, "pn-salvo");
const linhaCayenne = '.et-linha[data-id="81662220"]';
P.acoesCayenne = await caixa(pn, linhaCayenne + " [data-acoes]");
await pn.tap(linhaCayenne + " [data-acoes]");
await espera(900);
await foto(pn, "pn-acoes");
P.vendido = await caixa(pn, '[data-fazer="vendido"]');
await pn.tap('[data-fazer="vendido"]');
await espera(1200);
await foto(pn, "pn-vendido");
// a foto do carro novo, como o painel guardou (reduzida no navegador), para o site receber igual
const salvo = await pn.evaluate(() => JSON.parse(localStorage.getItem("rz-exemplo-estoque:ricardo-motors")));
await pn.close();

// ---------- o carro novo chegando no site ----------
{
  const p = await ctx.newPage();
  await p.goto(ORIGEM + "/embrulho", { waitUntil: "networkidle" });
  await p.waitForFunction(() => window.pronto === true, null, { timeout: 15000 });
  const comNovo = salvo.map(i => (i.situacao === "vendido" ? { ...i, situacao: "disponivel" } : i));
  await p.evaluate(([itens, foco]) => window.mandar(itens, foco), [comNovo, salvo[0].id]);
  await espera(1700);
  const quadro = p.frameLocator("#f");
  await quadro.locator("body").evaluate(() => { document.querySelectorAll(".card.novo").forEach(c => { c.style.animationPlayState = "paused"; }); document.querySelector(".wa-f").style.display = "none"; });
  await foto(p, "site-novo");
  P.cardNovo = await quadro.locator(".card.novo").evaluate(e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; });
  await p.close();
}
await navegador.close();
fs.writeFileSync(path.join(SAIDA, "posicoes.json"), JSON.stringify(P, null, 1));
console.log("telas em", SAIDA, P);
