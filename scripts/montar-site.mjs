// Monta a pasta publico/, que é o que a Vercel coloca no ar (ver vercel.json):
//   /                          → site público da Renderiza (site/pagina.mjs com os dados de site/config.mjs)
//   /painel                    → painel (painel/index.html e painel/src/); sem sessão, manda para /login
//   /login                     → a mesma página do painel: mostra o login; com sessão, vai para /painel
//   /demo/<ótica>              → demos/<ótica>/index.html, com as meta og: para a prévia do link
//   /demo/<ótica>/capa.jpg     → a foto do topo da demo: é a imagem da prévia no WhatsApp
//   /demo/<ótica>/<arquivo>    → outros .html da pasta da ótica (ex.: artes-instagram)
//   /flyer/<lead>.png          → flyers/<lead>.png (flyer de Stories que o painel baixa; só o PNG vai ao ar)
//   /gravacao/<lead>.mp4       → gravacoes/<lead>.mp4 (vídeo de apresentação da demo; só o MP4 vai ao ar)
//   /fontes, /favicon.svg…     → site/estatico/ (arquivos do site público)
// Fichas (.md), contexto, ferramentas, banco e scripts nunca entram.
//   npm run build

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const SAIDA = join(RAIZ, "publico");

function arquivosDe(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? arquivosDe(join(pasta, e.name)).map(f => join(e.name, f)) : [e.name]);
}

// Importa de novo a cada chamada: no servidor local, mudar a config ou o modelo aparece ao recarregar.
async function modulosDoSite() {
  const versao = "?v=" + Date.now();
  const { montarPagina, pendencias } = await import(pathToFileURL(join(RAIZ, "site", "pagina.mjs")).href + versao);
  const { default: config } = await import(pathToFileURL(join(RAIZ, "site", "config.mjs")).href + versao);
  return { config, montarPagina, pendencias };
}

/** HTML da home pública, montado a partir de site/config.mjs. */
export async function paginaInicial() {
  const { config, montarPagina } = await modulosDoSite();
  return montarPagina(config);
}

/** O que ainda falta preencher em site/config.mjs. */
export async function pendenciasDoSite() {
  const { config, pendencias } = await modulosDoSite();
  return pendencias(config);
}

/* ---------- prévia do link da demo (WhatsApp, Instagram): a foto e o nome da própria loja ---------- */
const SITE = "https://www.renderizaweb.com.br";
const escAttr = t => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** A foto do topo da demo (a primeira do .hero-photo, ou a primeira foto da página), em JPEG ou PNG. */
export function fotoDaCapa(html) {
  const m = /class="hero-photo[^"]*"[^>]*>[\s\S]*?<img[^>]+src="data:image\/(jpeg|png);base64,([^"]+)"/.exec(html)
    || /<img[^>]+src="data:image\/(jpeg|png);base64,([^"]+)"/.exec(html);
  return m ? { tipo: m[1] === "png" ? "png" : "jpg", dados: Buffer.from(m[2], "base64") } : null;
}

/**
 * Põe na demo as meta og: (título, descrição e a foto da capa) para o link chegar no WhatsApp com a foto
 * e o nome da loja, e não como um link qualquer. Demo que já tem og: fica como está.
 */
export function comPreviaDoLink(html, otica, tipoDaCapa) {
  if (/<meta\s+property="og:/i.test(html) || !/<\/head>/i.test(html)) return html;
  const titulo = (/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "").replace(/\s+/g, " ").trim();
  const descricao = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html)?.[1] || "";
  const url = `${SITE}/demo/${otica}`;
  const metas = [
    ["og:type", "website"], ["og:url", url], ["og:title", titulo], ["og:description", descricao],
    ...(tipoDaCapa ? [["og:image", `${url}/capa.${tipoDaCapa}`]] : []),
  ].filter(([, v]) => v).map(([p, v]) => `<meta property="${p}" content="${p === "og:description" || p === "og:title" ? escAttr(v.replace(/&amp;/g, "&")) : v}">`);
  if (tipoDaCapa) metas.push('<meta name="twitter:card" content="summary_large_image">');
  return html.replace(/<\/head>/i, metas.join("") + "</head>");
}

/**
 * Lista [caminho publicado, origem]. A origem é um arquivo ou uma função que gera o conteúdo.
 * É a mesma lista para o build e para o servidor local.
 */
export function arquivosPublicados() {
  const painel = join(RAIZ, "painel", "index.html");
  const lista = [["index.html", paginaInicial], [join("painel", "index.html"), painel], [join("login", "index.html"), painel]];
  for (const f of arquivosDe(join(RAIZ, "painel", "src"))) lista.push([join("painel", "src", f), join(RAIZ, "painel", "src", f)]);
  for (const f of arquivosDe(join(RAIZ, "site", "estatico"))) lista.push([f, join(RAIZ, "site", "estatico", f)]);
  for (const otica of readdirSync(join(RAIZ, "demos"), { withFileTypes: true })) {
    if (!otica.isDirectory()) continue;
    for (const f of readdirSync(join(RAIZ, "demos", otica.name))) {
      if (!f.endsWith(".html")) continue;
      const arquivo = join(RAIZ, "demos", otica.name, f);
      if (f !== "index.html") { lista.push([join("demo", otica.name, f), arquivo]); continue; }
      // A página principal sai com as meta og: e a foto do topo vira capa.jpg (a imagem da prévia do link).
      const capa = fotoDaCapa(readFileSync(arquivo, "utf8"));
      lista.push([join("demo", otica.name, f), Object.assign(async () => comPreviaDoLink(readFileSync(arquivo, "utf8"), otica.name, capa?.tipo), { tipo: ".html" })]);
      if (capa) lista.push([join("demo", otica.name, "capa." + capa.tipo), Object.assign(async () => fotoDaCapa(readFileSync(arquivo, "utf8")).dados, { tipo: "." + capa.tipo })]);
    }
  }
  const flyers = join(RAIZ, "flyers");
  if (existsSync(flyers)) for (const f of readdirSync(flyers)) if (f.endsWith(".png")) lista.push([join("flyer", f), join(flyers, f)]);
  const gravacoes = join(RAIZ, "gravacoes");
  if (existsSync(gravacoes)) for (const f of readdirSync(gravacoes)) if (f.endsWith(".mp4")) lista.push([join("gravacao", f), join(gravacoes, f)]);
  const vistos = new Set();
  for (const [destino] of lista) {
    if (vistos.has(destino)) throw new Error(`Dois arquivos querem ser publicados em ${destino}.`);
    vistos.add(destino);
  }
  return lista;
}

export async function montarSite() {
  rmSync(SAIDA, { recursive: true, force: true });
  const lista = arquivosPublicados();
  for (const [destino, origem] of lista) {
    mkdirSync(dirname(join(SAIDA, destino)), { recursive: true });
    if (typeof origem === "function") writeFileSync(join(SAIDA, destino), await origem());
    else copyFileSync(origem, join(SAIDA, destino));
  }
  return lista;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lista = await montarSite();
  const demos = lista.filter(([d]) => /^demo[\\/][^\\/]+[\\/]index\.html$/.test(d)).length;
  const painel = lista.filter(([d]) => d.startsWith("painel")).length;
  console.log(`publico/ pronto: site público, painel (${painel} arquivos, também em /login) e ${demos} demo(s).`);
  const falta = await pendenciasDoSite();
  if (falta.length) console.log("Site público: ainda falta em site/config.mjs →\n  - " + falta.join("\n  - "));
}
