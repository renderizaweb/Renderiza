// Monta a pasta publico/, que é o que a Vercel coloca no ar (ver vercel.json):
//   /                          → painel (painel/index.html e painel/src/), com login
//   /demo/<ótica>              → demos/<ótica>/index.html
//   /demo/<ótica>/<arquivo>    → outros .html da pasta da ótica (ex.: artes-instagram)
// Fichas (.md), contexto, ferramentas, banco e scripts nunca entram.
//   npm run build

import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const SAIDA = join(RAIZ, "publico");

function arquivosDe(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? arquivosDe(join(pasta, e.name)).map(f => join(e.name, f)) : [e.name]);
}

/** Lista [caminho publicado, arquivo de origem]. É a mesma lista para o build e para o servidor local. */
export function arquivosPublicados() {
  const lista = [["index.html", join(RAIZ, "painel", "index.html")]];
  for (const f of arquivosDe(join(RAIZ, "painel", "src"))) lista.push([join("src", f), join(RAIZ, "painel", "src", f)]);
  for (const otica of readdirSync(join(RAIZ, "demos"), { withFileTypes: true })) {
    if (!otica.isDirectory()) continue;
    for (const f of readdirSync(join(RAIZ, "demos", otica.name))) {
      if (f.endsWith(".html")) lista.push([join("demo", otica.name, f), join(RAIZ, "demos", otica.name, f)]);
    }
  }
  return lista;
}

export function montarSite() {
  rmSync(SAIDA, { recursive: true, force: true });
  const lista = arquivosPublicados();
  for (const [destino, origem] of lista) {
    mkdirSync(dirname(join(SAIDA, destino)), { recursive: true });
    copyFileSync(origem, join(SAIDA, destino));
  }
  return lista;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lista = montarSite();
  const demos = lista.filter(([d]) => d.startsWith("demo")).length;
  console.log(`publico/ pronto: painel (${lista.length - demos} arquivos) e ${demos} demo(s).`);
}
