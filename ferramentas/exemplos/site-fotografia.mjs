// O site de exemplo de fotografia: o Estúdio Ciranda (fictício, o mesmo do painel de exemplo), feito pelo mesmo
// gerador dos sites das fotógrafas (ferramentas/demo/gerar-fotografia.py, com as marcações do Meu site) e virado em
// site pelo scripts/virar-site.mjs, como o site entregue a um cliente. Fotos livres do Unsplash (a lista "unsplash"
// do demo.json; licença do Unsplash: uso comercial liberado), marca feita pelo marca-fotografia.py (monograma).
//
//   node ferramentas/exemplos/site-fotografia.mjs
//     -> exemplos/site-fotografia/ (vai ao ar em /exemplos/site-fotografia): o site com os caminhos dentro de
//        /exemplos/site-fotografia/, noindex, o selo de exemplo, o WhatsApp de mentira avisando que é exemplo, e o
//        Meu site lendo a versão que a pessoa publicou na página /exemplos/meu-site-fotografia (fica no navegador
//        dela: nada vai para servidor nenhum, e cada pessoa vê só o que ela mesma mudou).
//   node ferramentas/exemplos/site-fotografia.mjs --cliente <pasta>
//     -> o mesmo site como sai para um cliente (domínio estudiociranda.exemplo, Meu site no painel de verdade, sem
//        selo): para a bancada do vídeo, que abre o painel de verdade com dados fictícios (instagram/bancada-painel.mjs).
//
// Originais (fotos, marca, fontes) ficam em rascunhos/exemplos/ciranda/ (fora do git); faltando, baixa de novo.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEMO = path.join(RAIZ, "exemplos", "site-fotografia", "demo.json");
const RAS = path.join(RAIZ, "rascunhos", "exemplos", "ciranda");
const DESTINO = path.join(RAIZ, "exemplos", "site-fotografia");
export const BASE = "/exemplos/site-fotografia";
export const CODIGO = "estudio-ciranda";
export const DOMINIO = "estudiociranda.exemplo";
// A "API" do exemplo: o endereço que o script do Meu site pede (na mesma origem da página do editor de exemplo, que é
// a única que o site no quadro escuta). Não existe no servidor: quem responde é o navegador (o trecho EXEMPLO_JS).
export const API_EXEMPLO = "https://www.renderizaweb.com.br" + BASE + "/painel/";
export const CHAVE_PUBLICADA = "rz-exemplo-meu-site:" + CODIGO;

const rodar = (cmd, args, opcoes = {}) => {
  const r = spawnSync(cmd, args, { cwd: RAIZ, encoding: "utf8", ...opcoes });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}\n${r.stdout}\n${r.stderr}`);
  return r.stdout;
};
const baixar = (url, arquivo) => rodar("curl", ["-s", "-f", "-m", "90", "-o", arquivo, url]);

/** As fotos (do Unsplash, pela lista do demo.json) e a marca, quando faltam. */
function originais(cfg) {
  fs.mkdirSync(path.join(RAS, "marca"), { recursive: true });
  for (const [nome, id] of Object.entries(cfg.unsplash)) {
    const arq = path.join(RAS, nome + ".jpg");
    if (!fs.existsSync(arq)) baixar(`https://images.unsplash.com/photo-${id}?w=2000&q=85&fm=jpg`, arq);
  }
  if (fs.existsSync(path.join(RAS, "marca", "logo.png"))) return;
  const fontes = path.join(RAS, "fontes");
  fs.mkdirSync(fontes, { recursive: true });
  const css = rodar("curl", ["-s", "-f", "-m", "60", "https://fonts.googleapis.com/css2?family=Libre+Baskerville&family=Petit+Formal+Script"]);
  const [serif, cursiva] = css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf/g) || [];
  if (!serif || !cursiva) throw new Error("não achei as fontes da marca no Google Fonts");
  baixar(serif, path.join(fontes, "serif.ttf"));
  baixar(cursiva, path.join(fontes, "cursiva.ttf"));
  rodar("python3", ["ferramentas/demo/marca-fotografia.py", path.join(RAS, "marca"), "--nome", cfg.marca, "--script", cfg.titulo_script,
    "--iniciais", "EC", "--serif", path.join(fontes, "serif.ttf"), "--cursiva", path.join(fontes, "cursiva.ttf"),
    "--acento", cfg.cores.acento, "--tinta", cfg.cores.tinta, "--claro", "#f6ece9", "--fundo-favicon", cfg.cores.fundo]);
}

/** Gera as duas páginas e vira site, como para um cliente. `api`: a do Meu site (sem: o painel de verdade). */
export function montarComoCliente(saida, { api } = {}) {
  const cfg = JSON.parse(fs.readFileSync(DEMO, "utf8"));
  originais(cfg);
  rodar("python3", ["ferramentas/demo/gerar-fotografia.py", DEMO]);
  const fonte = path.join(RAIZ, cfg.saida);
  fs.writeFileSync(path.join(fonte, "site.json"), JSON.stringify({
    dominio: DOMINIO, nome: cfg.marca, corTema: cfg.cores.acento, previaCentro: [0.45, 0.45], paginas: ["natal"],
    painel: { codigo: CODIGO, ...(api ? { api } : {}) },
  }, null, 1));
  rodar("node", ["scripts/virar-site.mjs", fonte, saida]);
  return saida;
}

// Só no exemplo (nunca no site de um cliente): a versão publicada vem do navegador de quem testa; o WhatsApp e o
// Instagram do estúdio fictício não abrem (avisam que é exemplo); e o selo de exemplo no canto.
const EXEMPLO_JS = `<script>
// Site de EXEMPLO (Estúdio Ciranda é fictício). O Meu site daqui lê a versão que você publicou na página do Meu site
// de exemplo, guardada no seu navegador; os links do WhatsApp e do Instagram não abrem.
(function () {
  var CHAVE = ${JSON.stringify(CHAVE_PUBLICADA)}, VERSOES = "rz-exemplo-meu-site:versoes", API = ${JSON.stringify(API_EXEMPLO + "site/" + CODIGO)}, buscar = window.fetch;
  window.fetch = function (u, o) {
    var url = String(u && u.url || u);
    var json = function (v) { return Promise.resolve(v ? new Response(v, { status: 200, headers: { "content-type": "application/json" } }) : new Response("{}", { status: 404 })); };
    if (url === API) { var v = null; try { v = localStorage.getItem(CHAVE); } catch (e) { /* sem navegador */ } return json(v); }
    if (url.indexOf(API + "/previa?t=") === 0) { // "Ver o rascunho no site": o rascunho que está no navegador
      var r = null; try { r = (JSON.parse(localStorage.getItem(VERSOES)) || []).filter(function (x) { return x.estado === "rascunho"; })[0]; } catch (e) { /* sem rascunho */ }
      return json(r ? JSON.stringify(Object.assign({}, r.conteudo, { esquema: 1, site: ${JSON.stringify(CODIGO)}, versao: r.numero, publicado_em: null })) : null);
    }
    return buscar.apply(this, arguments);
  };
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[data-whatsapp], a[data-instagram], a[href*='wa.me'], a[href*='instagram.com']");
    if (!a) return;
    ev.preventDefault();
    alert("Este é um site de exemplo: no site de verdade, este botão abre o WhatsApp (ou o Instagram) do estúdio.");
  }, true);
  // dentro do editor do Meu site (o quadro), sem o selo: lá a página já diz que é exemplo
  if (/[?&]rz-editor=1/.test(location.search)) document.addEventListener("DOMContentLoaded", function () { var s = document.getElementById("rz-exemplo-selo"); if (s) s.remove(); });
})();
</script>`;
const SELO = `<a id="rz-exemplo-selo" href="/exemplos/fotografia" style="position:fixed;left:12px;bottom:12px;z-index:2147483000;padding:7px 12px;border-radius:999px;background:#1e2528;color:#fff;font:600 12px/1.2 system-ui,sans-serif;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.2)">Site de exemplo · Estúdio Ciranda é fictício</a>`;

/** Tira o site da raiz do domínio e põe em /exemplos/site-fotografia/, com o que só o exemplo tem. */
export function paraOExemplo(html) {
  let h = html
    .replace(/(["'\s,(])\/img\//g, `$1${BASE}/img/`)
    .replace(/href="\/favicon\.(png|svg)"/g, `href="${BASE}/favicon.$1"`)
    .replace(/href="\/natal(#[^"]*)?"/g, (_, a) => `href="${BASE}/natal${a || ""}"`)
    .replace(/href="\/(#[^"]*)?"/g, (_, a) => `href="${BASE}/${a || ""}"`)
    .replace(/\s*<link rel="canonical"[^>]*>/, "")
    .replace(/\s*<meta property="og:url"[^>]*>/, "")
    .replace(new RegExp(`https://${DOMINIO.replace(/\./g, "\\.")}/`, "g"), `https://www.renderizaweb.com.br${BASE}/`)
    .replace(/(<\/title>)/, `$1\n  <meta name="robots" content="noindex, nofollow">`)
    .replace(/<script data-codigo=/, `${EXEMPLO_JS}\n  <script data-sem-visitas data-codigo=`)
    .replace(/<\/body>/, `${SELO}\n</body>`);
  if (!h.includes("data-sem-visitas")) h = h.replace(/(<\/title>)/, `$1\n  ${EXEMPLO_JS}`); // a página sem Meu site (Natal)
  return h;
}

async function montarExemplo() {
  const tmp = path.join(RAS, "saida-exemplo");
  montarComoCliente(tmp, { api: API_EXEMPLO });
  fs.rmSync(path.join(DESTINO, "img"), { recursive: true, force: true });
  fs.mkdirSync(path.join(DESTINO, "img"), { recursive: true });
  for (const f of fs.readdirSync(path.join(tmp, "img"))) fs.copyFileSync(path.join(tmp, "img", f), path.join(DESTINO, "img", f));
  for (const f of ["favicon.png", "og.jpg"]) fs.copyFileSync(path.join(tmp, f), path.join(DESTINO, f));
  for (const p of ["index.html", "natal.html"]) fs.writeFileSync(path.join(DESTINO, p), paraOExemplo(fs.readFileSync(path.join(tmp, p), "utf8")));
  const faltam = [];
  for (const p of ["index.html", "natal.html"]) {
    const html = fs.readFileSync(path.join(DESTINO, p), "utf8");
    for (const [, u] of html.matchAll(/(?:src|href)="(\/exemplos\/site-fotografia\/[^"#?]+)"/g)) {
      const arq = path.join(RAIZ, u.slice(1));
      if (!fs.existsSync(arq) && !fs.existsSync(arq + ".html") && !fs.existsSync(path.join(arq, "index.html"))) faltam.push(`${p}: ${u}`);
    }
    if (/href="\/(?!exemplos\/)/.test(html.replace(/href="\/\/[^"]*"/g, ""))) faltam.push(`${p}: link para a raiz do domínio`);
  }
  if (faltam.length) throw new Error("Caminhos quebrados no exemplo:\n" + faltam.join("\n"));
  // o mapa do Meu site (o conteúdo inicial que o editor de exemplo abre), tirado do site como ele está
  const { extrair } = await import("../meu-site/extrair.mjs");
  const conteudo = await extrair(fs.readFileSync(path.join(DESTINO, "index.html"), "utf8"));
  fs.writeFileSync(path.join(DESTINO, "conteudo-inicial.js"), "// O conteúdo inicial do site de exemplo (gerado por ferramentas/exemplos/site-fotografia.mjs, com o extrair.mjs do Meu site).\nexport default " + JSON.stringify(conteudo) + ";\n");
  console.log(`${DESTINO}: index.html, natal.html, ${fs.readdirSync(path.join(DESTINO, "img")).length} fotos em img/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--cliente");
  if (i > 0) console.log(montarComoCliente(path.resolve(process.argv[i + 1])));
  else await montarExemplo();
}
