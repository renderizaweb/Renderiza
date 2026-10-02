// Transforma uma demo aprovada em site de cliente, pronto para ter repositório e domínio próprios.
//
// Uso: node scripts/virar-site.mjs <pasta-da-demo> [pasta-de-saida]
//      (lê demos/<pasta>/index.html e demos/<pasta>/site.json; a saída padrão é ../sites/<domínio>)
//
// O que muda em relação à demo:
// - as fotos saem de dentro do HTML e viram arquivos em img/ (página mais leve, cache, Google Imagens);
// - entram endereço oficial (canonical), prévia para WhatsApp/redes (og:*), ícone da aba e dados
//   estruturados da empresa (schema.org) a partir do site.json;
// - robots.txt e sitemap.xml liberam o Google (as demos da Renderiza ficam fora do Google; o site real não);
// - cabeçalhos para Cloudflare Pages (_headers) e Vercel (vercel.json): serve nas duas hospedagens.
//
// site.json: { dominio, nome, corTema, favicon: { texto, cor }, previaCentro: [x, y] (0 a 1; onde centrar o
//             recorte da prévia, padrão [0.5, 0.1]), dadosEstruturados: [ {...schema.org} ] }
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [pasta, saidaArg] = process.argv.slice(2);
if (!pasta) { console.error('Uso: node scripts/virar-site.mjs <pasta-da-demo> [pasta-de-saida]'); process.exit(1); }
const dirDemo = path.join(raiz, 'demos', pasta);
const conf = JSON.parse(fs.readFileSync(path.join(dirDemo, 'site.json'), 'utf8'));
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(conf.dominio || '')) throw new Error('site.json: "dominio" inválido');
const url = `https://${conf.dominio}/`;
const saida = path.resolve(saidaArg || path.join(raiz, '..', 'sites', conf.dominio));
const hoje = new Date().toISOString().slice(0, 10);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'foto';

let html = fs.readFileSync(path.join(dirDemo, 'index.html'), 'utf8');
fs.rmSync(saida, { recursive: true, force: true });
fs.mkdirSync(path.join(saida, 'img'), { recursive: true });

// 1. Fotos: data URI → img/<descrição>-<hash>.<ext>. A mesma foto usada duas vezes vira um arquivo só.
const arquivos = new Map();
let primeira = null;
html = html.replace(/<img\b[^>]*>/g, tag => {
  const m = tag.match(/src="data:image\/(jpeg|jpg|png|webp|gif|avif);base64,([A-Za-z0-9+/=]+)"/);
  if (!m) return tag;
  const dados = Buffer.from(m[2], 'base64');
  const hash = crypto.createHash('sha1').update(dados).digest('hex').slice(0, 8);
  let nome = arquivos.get(hash);
  if (!nome) {
    const alt = (tag.match(/\salt="([^"]*)"/) || [])[1] || 'foto';
    nome = `img/${slug(alt)}-${hash}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
    fs.writeFileSync(path.join(saida, nome), dados);
    arquivos.set(hash, nome);
  }
  primeira ??= nome;
  return tag.replace(/src="data:[^"]+"/, `src="/${nome}"`);
});
if (/data:image\//.test(html)) console.warn('Atenção: sobrou imagem embutida fora de <img> (CSS ou atributo).');

// 2. Prévia para WhatsApp e redes: 1200×630 em JPG, recortada da primeira foto da página (a da capa).
let og = primeira;
try {
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageOps
im = Image.open(sys.argv[1]).convert('RGB')
im = ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(float(sys.argv[3]), float(sys.argv[4])))
im.save(sys.argv[2], 'JPEG', quality=82, optimize=True)`, path.join(saida, primeira), path.join(saida, 'og.jpg'), ...(conf.previaCentro || [0.5, 0.1]).map(String)]);
  og = 'og.jpg';
} catch { console.warn('Sem Python/Pillow: a prévia usa a foto da capa como está.'); }

// 3. Ícone da aba.
const fav = conf.favicon || { texto: conf.nome.slice(0, 1), cor: conf.corTema || '#222' };
fs.writeFileSync(path.join(saida, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${esc(fav.cor)}"/><text x="32" y="43" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${fav.texto.length > 1 ? 28 : 36}" fill="#fff">${esc(fav.texto)}</text></svg>\n`);

// 4. Cabeça da página: endereço oficial, prévia, ícone e dados da empresa.
const titulo = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || conf.nome;
const descricao = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const dados = (conf.dadosEstruturados || []).map(d => ({ url, image: url + og, ...d }));
const cabeca = [
  `<link rel="canonical" href="${url}">`,
  `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:locale" content="pt_BR">`,
  `<meta property="og:site_name" content="${esc(conf.nome)}">`,
  `<meta property="og:title" content="${titulo}">`,
  `<meta property="og:description" content="${descricao}">`,
  `<meta property="og:url" content="${url}">`,
  `<meta property="og:image" content="${url}${og}">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  ...(dados.length ? [`<script type="application/ld+json">${JSON.stringify(dados.length === 1 ? dados[0] : dados).replace(/</g, '\\u003c')}</script>`] : []),
].map(l => '  ' + l).join('\n');
if (!html.includes('</title>')) throw new Error('index.html sem <title>');
html = html.replace(/(<\/title>\n)/, `$1${cabeca}\n`);
fs.writeFileSync(path.join(saida, 'index.html'), html);

// 5. Google, cabeçalhos e instruções.
fs.writeFileSync(path.join(saida, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`);
fs.writeFileSync(path.join(saida, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${url}</loc><lastmod>${hoje}</lastmod></url>\n</urlset>\n`);
fs.writeFileSync(path.join(saida, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n/img/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
fs.writeFileSync(path.join(saida, 'vercel.json'), JSON.stringify({
  cleanUrls: true,
  headers: [
    { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
    { source: '/img/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
  ],
}, null, 2) + '\n');
const readme = `# ${conf.nome}

Site oficial: ${url}

Site estático: um \`index.html\` com o texto, o estilo e o código da página, e as fotos em \`img/\`.
Não tem build, banco de dados nem dependências. Qualquer hospedagem de site estático serve.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| \`index.html\` | a página inteira (textos, cores, botões de WhatsApp e Instagram, mapa) |
| \`img/\` | fotos da página (o nome do arquivo descreve a foto) |
| \`og.jpg\` | imagem que aparece quando o link é compartilhado no WhatsApp e nas redes |
| \`favicon.svg\` | ícone da aba do navegador |
| \`robots.txt\`, \`sitemap.xml\` | orientações para o Google |
| \`vercel.json\` | configuração para a Vercel |
| \`_headers\` | a mesma configuração para Cloudflare Pages ou Netlify, se um dia mudar de hospedagem |

## Como alterar

- Texto: edite direto no \`index.html\`.
- WhatsApp, Instagram e endereços: no fim do \`index.html\`, no bloco \`window.DEMO_CLIENT\`.
- Foto: troque o arquivo em \`img/\` (mesmo nome) ou aponte o \`<img src>\` para um arquivo novo.

A cada alteração enviada para a branch principal, a hospedagem publica sozinha.

## Publicação (Vercel)

Importar este repositório na Vercel: preset **Other**, sem comando de build, pasta publicada = raiz.
Domínio: em *Settings > Domains*, adicionar \`${conf.dominio}\` e \`www.${conf.dominio}\` e criar no
Registro.br os registros DNS que a Vercel mostrar.

Feito pela Renderiza em ${hoje}.
`;
fs.writeFileSync(path.join(saida, 'README.md'), readme);

const tam = d => fs.readdirSync(d, { withFileTypes: true }).reduce((t, e) => t + (e.isDirectory() ? tam(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`${saida}\n  index.html: ${Math.round(fs.statSync(path.join(saida, 'index.html')).size / 1024)} KB · ${arquivos.size} fotos em img/ · total ${Math.round(tam(saida) / 1024)} KB · prévia: ${og}`);
