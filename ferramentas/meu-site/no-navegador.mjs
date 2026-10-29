// Roda a biblioteca do Meu site (meu-site.js) sobre um HTML parado, num Chromium sem abrir a página: o HTML é lido
// com DOMParser, então nenhum script do site roda. Usado pelo extrair.mjs e pelo scripts/versao-final.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const BIBLIOTECA = fs.readFileSync(path.join(AQUI, 'meu-site.js'), 'utf8');

function playwright() {
  try {
    return createRequire(import.meta.url)('playwright');
  } catch {
    throw new Error('Precisa do Playwright (já vem nas sessões do Claude; numa máquina: npm i -g playwright && npx playwright install chromium).');
  }
}

/** fn(doc, lib, arg) roda no navegador, com doc = o HTML lido; devolve o que fn devolver (tem que ser JSON). */
export async function noNavegador(html, fn, arg) {
  const navegador = await playwright().chromium.launch();
  try {
    const pagina = await navegador.newPage();
    await pagina.addScriptTag({ content: BIBLIOTECA });
    return await pagina.evaluate(([html, fonte, arg]) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return new Function('return ' + fonte)()(doc, window.RZ_MEU_SITE, arg);
    }, [html, fn.toString(), arg]);
  } finally {
    await navegador.close();
  }
}
