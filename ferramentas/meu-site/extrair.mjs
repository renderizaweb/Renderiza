// O conteúdo inicial de um site com Meu site, no formato do contrato (03 do painel): tudo o que as marcações data-site-*
// deixam mudar, com o valor que está no HTML. É o ponto de partida da montagem no painel (o editor abre mostrando o que
// está no ar) e o mapa do que cada site deixa editar.
//
// Uso: node ferramentas/meu-site/extrair.mjs <index.html> [saida.json]
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { noNavegador } from './no-navegador.mjs';

export async function extrair(html) {
  return noNavegador(html, (doc, lib) => lib.extrair(doc));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada) { console.error('Uso: node ferramentas/meu-site/extrair.mjs <index.html> [saida.json]'); process.exit(1); }
  const conteudo = await extrair(fs.readFileSync(entrada, 'utf8'));
  const json = JSON.stringify(conteudo, null, 2) + '\n';
  if (saida) fs.writeFileSync(saida, json); else process.stdout.write(json);
}
