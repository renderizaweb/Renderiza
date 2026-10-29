// Versão final do Meu site (vendida à parte, 03 do painel): o site do cliente com o conteúdo publicado embutido no
// HTML e sem o script do Meu site. Daí em diante o site não depende mais do painel.
//
// Uso: node scripts/versao-final.mjs <pasta-do-site> <conteudo.json> [pasta-de-saida]
//   <pasta-do-site>  o site do cliente, como saiu do scripts/virar-site.mjs (com o script do Meu site)
//   <conteudo.json>  a última versão publicada: o JSON que o painel entrega em /api/publico/site/<código>
//   saída padrão: <pasta-do-site>-final
//
// O que faz: copia o site; baixa as imagens publicadas para img/ (o site final não busca nada no painel); aplica o
// conteúdo com a mesma biblioteca do script (ferramentas/meu-site/meu-site.js), com o contato e as avaliações gravados
// no DEMO_CLIENT; tira o script e as marcações data-site-*; anota no README.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BIBLIOTECA, noNavegador } from '../ferramentas/meu-site/no-navegador.mjs';

const lib = (() => { const m = { exports: {} }; new Function('module', BIBLIOTECA)(m); return m.exports; })();
const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };

/** As imagens do conteúdo (fora as do próprio site) viram arquivos em img/; devolve o conteúdo com os caminhos novos. */
async function baixarImagens(conteudo, pastaImg, baixar) {
  const copia = JSON.parse(JSON.stringify(conteudo));
  const imagens = [];
  for (const s of Object.values(copia.secoes || {})) {
    imagens.push(...Object.values(s.imagens || {}));
    for (const itens of Object.values(s.listas || {})) for (const it of itens) imagens.push(...Object.values(it.imagens || {}));
  }
  const feitos = new Map();
  for (const img of imagens) {
    if (typeof img.src !== 'string' || img.src.startsWith('/')) continue;
    if (!feitos.has(img.src)) {
      const { tipo, dados } = await baixar(img.src);
      const ext = TIPOS[tipo];
      if (!ext) throw new Error(`imagem com tipo inesperado (${tipo}): ${img.src}`);
      const nome = `img/painel-${crypto.createHash('sha1').update(dados).digest('hex').slice(0, 10)}.${ext}`;
      fs.writeFileSync(path.join(pastaImg, '..', nome), dados);
      feitos.set(img.src, '/' + nome);
    }
    img.src = feitos.get(img.src);
  }
  return { conteudo: copia, baixadas: feitos.size };
}

async function baixarDaRede(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`não baixou ${url}: ${r.status}`);
  return { tipo: (r.headers.get('content-type') || '').split(';')[0].trim(), dados: Buffer.from(await r.arrayBuffer()) };
}

export async function versaoFinal(pastaSite, conteudo, saida, { baixar = baixarDaRede } = {}) {
  const erros = lib.validar(conteudo);
  if (erros.length) throw new Error('conteúdo inválido:\n  ' + erros.join('\n  '));
  if (!fs.existsSync(path.join(pastaSite, 'index.html'))) throw new Error(`${pastaSite} não tem index.html`);
  fs.rmSync(saida, { recursive: true, force: true });
  fs.cpSync(pastaSite, saida, { recursive: true });
  fs.mkdirSync(path.join(saida, 'img'), { recursive: true });
  const { conteudo: local, baixadas } = await baixarImagens(conteudo, path.join(saida, 'img'), baixar);

  const html = fs.readFileSync(path.join(saida, 'index.html'), 'utf8');
  const doctype = (html.match(/^\s*<!doctype[^>]*>/i) || ['<!DOCTYPE html>'])[0].trim();
  const r = await noNavegador(html, (doc, lib, c) => {
    if (!doc.querySelector('script[data-codigo]')) return { erro: 'o site não tem o script do Meu site (já é uma versão final?)' };
    if (!lib.aplicar(doc, c, { parado: true, imagem: src => (/^\/img\//.test(src) ? src : null) })) return { erro: 'o conteúdo não foi aplicado' };
    doc.querySelectorAll('script[data-codigo]').forEach(s => s.remove());
    doc.querySelectorAll('*').forEach(el => Array.from(el.attributes).forEach(a => { if (a.name.startsWith('data-site')) el.removeAttribute(a.name); }));
    return { html: doc.documentElement.outerHTML };
  }, local);
  if (r.erro) throw new Error(r.erro);
  fs.writeFileSync(path.join(saida, 'index.html'), doctype + '\n' + r.html + '\n');

  const readme = path.join(saida, 'README.md');
  if (fs.existsSync(readme)) {
    const hoje = new Date().toISOString().slice(0, 10);
    const texto = fs.readFileSync(readme, 'utf8').replace(/\n## Meu site \(Painel Renderiza\)\n[\s\S]*?(?=\n## |\nA cada alteração|\nFeito pela)/, '\n');
    fs.writeFileSync(readme, texto.trimEnd() + `\n\nVersão final do Meu site, gerada em ${hoje} (versão ${conteudo.versao ?? '?'} publicada no painel): o conteúdo está todo\nno \`index.html\` e em \`img/\`, e o site não depende mais do Painel Renderiza.\n`);
  }
  return { saida, baixadas };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [pasta, json, saidaArg] = process.argv.slice(2);
  if (!pasta || !json) { console.error('Uso: node scripts/versao-final.mjs <pasta-do-site> <conteudo.json> [pasta-de-saida]'); process.exit(1); }
  const site = path.resolve(pasta);
  const r = await versaoFinal(site, JSON.parse(fs.readFileSync(json, 'utf8')), path.resolve(saidaArg || site + '-final'));
  console.log(`${r.saida}\n  ${r.baixadas} imagem(ns) do painel em img/ · sem o script do Meu site`);
}
