// O Meu site de verdade nos exemplos: copia de painel-clientes/src para exemplos/painel/src o código que a casca do
// painel e o módulo Meu site usam (os imports, um por um, a partir das entradas abaixo), sem mudar nada, para a página
// /exemplos/meu-site-fotografia montar o editor de verdade com o banco de mentira (exemplos/painel/banco-de-exemplo.js).
// Única troca: o endereço da fonte no estilo.css (/src/ui/fontes/geist.woff2 → /fontes/geist.woff2, o mesmo arquivo,
// que o site da Renderiza já publica).
//
//   node ferramentas/exemplos/painel-de-verdade.mjs           copia (rodar de novo sempre que o painel mudar)
//   node ferramentas/exemplos/painel-de-verdade.mjs conferir  só confere se a cópia está igual ao painel
// O teste test/meu-site-exemplo.test.mjs confere: cópia velha = teste vermelho.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORIGEM = path.join(RAIZ, "painel-clientes");
const DESTINO = path.join(RAIZ, "exemplos", "painel");
// O que a página do exemplo importa (e o que o Meu site carrega na hora: a validação e os indicadores).
const ENTRADAS = ["src/adaptadores/supabase.js", "src/sessao.js", "src/telas/casca.js", "src/ui/aviso.js", "src/nichos/index.js",
  "src/modulos/meu-site/index.js", "src/modulos/meu-site/indicadores.js", "src/modulos/meu-site/meu-site.js", "src/ui/estilo.css"];
const FONTE = ["url(/src/ui/fontes/geist.woff2)", "url(/fontes/geist.woff2)"];

/** Os arquivos a copiar: as entradas e tudo o que elas importam de forma fixa (import ... from "./..."). */
export function arquivos() {
  const vistos = new Set();
  const ir = rel => {
    if (vistos.has(rel)) return;
    vistos.add(rel);
    if (!rel.endsWith(".js")) return;
    const texto = fs.readFileSync(path.join(ORIGEM, rel), "utf8");
    for (const [, alvo] of texto.matchAll(/(?:import|export)\s[^;]*?from\s+"(\.{1,2}\/[^"]+)"/g)) {
      ir(path.posix.normalize(path.posix.join(path.posix.dirname(rel), alvo)));
    }
  };
  ENTRADAS.forEach(ir);
  return [...vistos].sort();
}

/** O conteúdo que a cópia deve ter. */
const copia = rel => {
  const texto = fs.readFileSync(path.join(ORIGEM, rel), "utf8");
  return rel === "src/ui/estilo.css" ? texto.replace(FONTE[0], FONTE[1]) : texto;
};

/** O que está diferente entre o painel e a cópia (vazio = em dia). */
export function diferencas() {
  const lista = arquivos(), erros = [];
  for (const rel of lista) {
    const destino = path.join(DESTINO, rel);
    if (!fs.existsSync(destino)) erros.push(`falta ${rel}`);
    else if (fs.readFileSync(destino, "utf8") !== copia(rel)) erros.push(`velho ${rel}`);
  }
  const sobra = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? sobra(p) : [path.relative(DESTINO, p).split(path.sep).join("/")];
  });
  if (fs.existsSync(path.join(DESTINO, "src"))) for (const rel of sobra(path.join(DESTINO, "src"))) if (!lista.includes(rel)) erros.push(`sobra ${rel}`);
  return erros;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "conferir") {
    const d = diferencas();
    console.log(d.length ? d.join("\n") : "A cópia do painel nos exemplos está em dia.");
    process.exit(d.length ? 1 : 0);
  }
  fs.rmSync(path.join(DESTINO, "src"), { recursive: true, force: true });
  const lista = arquivos();
  for (const rel of lista) {
    fs.mkdirSync(path.dirname(path.join(DESTINO, rel)), { recursive: true });
    fs.writeFileSync(path.join(DESTINO, rel), copia(rel));
  }
  if (!fs.readFileSync(path.join(DESTINO, "src/ui/estilo.css"), "utf8").includes(FONTE[1])) throw new Error("estilo.css: a fonte mudou de endereço; ajuste FONTE");
  console.log(`${lista.length} arquivos do painel em exemplos/painel/src (${lista.reduce((t, r) => t + fs.statSync(path.join(DESTINO, r)).size, 0) >> 10} KB)`);
}
