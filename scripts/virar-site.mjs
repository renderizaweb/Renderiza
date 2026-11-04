// Transforma uma demo aprovada em site de cliente, pronto para ter repositório e domínio próprios.
//
// Uso: node scripts/virar-site.mjs <pasta-da-demo> [pasta-de-saida]
//      (lê demos/<pasta>/index.html e demos/<pasta>/site.json, ou de qualquer pasta com esses dois arquivos, como o
//      test/site-teste; a saída padrão é ../sites/<domínio>)
//
// O que muda em relação à demo:
// - as fotos saem de dentro do HTML e viram arquivos em img/ (página mais leve, cache, Google Imagens);
// - entram endereço oficial (canonical), prévia para WhatsApp/redes (og:*), ícone da aba e dados
//   estruturados da empresa (schema.org) a partir do site.json;
// - robots.txt e sitemap.xml liberam o Google (as demos da Renderiza ficam fora do Google; o site real não);
// - sai o que é só da demo: o noindex dos geradores e o ícone embutido (vira favicon.svg se o site.json não trouxer um);
// - no fim, a conferência (scripts/conferir-site.mjs): rastreio, oferta, link de /demo/, texto provisório e foto
//   faltando saem como problema, com código 1. Roteiro completo da entrega: docs/fechamento.md;
// - cabeçalhos para Cloudflare Pages (_headers) e Vercel (vercel.json): serve nas duas hospedagens;
// - com "painel" no site.json, entra o script do Meu site (ferramentas/meu-site/meu-site.js) com o código do site:
//   o cliente edita pelo Painel Renderiza e, sem o painel, o site mostra o que está no index.html (03 do painel);
// - com "painel": { "agenda": true }, entra a agenda online em /agenda/ (ferramentas/demo/agenda-online/), com um
//   link na seção "Consulte a sua data": os dias livres e a pré-reserva vêm do painel; sem ele, vira WhatsApp.
//
// site.json: { dominio, nome, corTema, favicon: { texto, cor }, previaCentro: [x, y] (0 a 1; onde centrar o
//             recorte da prévia, padrão [0.5, 0.1]), dadosEstruturados: [ {...schema.org} ],
//             painel: { codigo, agenda, meuSite } (opcional: o código do site no Painel Renderiza; agenda: true liga a
//             agenda online; meuSite: false deixa sem o script do Meu site; "api" = a base da API pública, só para teste) }
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { paginaDaAgenda, ligarNoSite } from '../ferramentas/demo/agenda-online/gerar.mjs';
import { conferirSite, relatorio } from './conferir-site.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [pasta, saidaArg] = process.argv.slice(2);
if (!pasta) { console.error('Uso: node scripts/virar-site.mjs <pasta-da-demo> [pasta-de-saida]'); process.exit(1); }
const dirDemo = /[\\/]/.test(pasta) ? path.resolve(pasta) : path.join(raiz, 'demos', pasta);
const conf = JSON.parse(fs.readFileSync(path.join(dirDemo, 'site.json'), 'utf8'));
if (!conf.dominio) { console.error('site.json: falta o "dominio" (o cliente já escolheu e registrou? docs/fechamento.md, passos 2 e 4).'); process.exit(1); }
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(conf.dominio)) throw new Error('site.json: "dominio" inválido');
const url = `https://${conf.dominio}/`;
const saida = path.resolve(saidaArg || path.join(raiz, '..', 'sites', conf.dominio));
const hoje = new Date().toISOString().slice(0, 10);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'foto';

let html = fs.readFileSync(path.join(dirDemo, 'index.html'), 'utf8');
fs.rmSync(saida, { recursive: true, force: true });
fs.mkdirSync(path.join(saida, 'img'), { recursive: true });

// 1. Fotos: data URI → img/<descrição>-<hash>.<ext>. A mesma foto usada duas vezes vira um arquivo só.
// A prévia sai da primeira foto de verdade (30 KB ou mais): a primeira <img> pode ser um ícone ou o logo.
const arquivos = new Map();
let primeira = null, primeiraGrande = null;
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
  if (dados.length >= 30 * 1024) primeiraGrande ??= nome;
  return tag.replace(/src="data:[^"]+"/, `src="/${nome}"`);
});
if (/data:image\//.test(html)) console.warn('Atenção: sobrou imagem embutida fora de <img> (CSS ou atributo).');

// 2. Prévia para WhatsApp e redes: 1200×630 em JPG, recortada da primeira foto da página (a da capa).
// Com Python/Pillow; sem ele, com o Chromium do Playwright; sem os dois, a foto como está (a conferência avisa).
primeira = primeiraGrande || primeira;
if (!primeira) throw new Error('index.html sem nenhuma foto em <img> embutida: de onde sai a prévia?');
const centro = (conf.previaCentro || [0.5, 0.1]).map(Number);
let og = primeira;
async function previaPeloNavegador(origem, destino) {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = createRequire(import.meta.url)('playwright')); }
  const nav = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const pag = await nav.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    const tipo = path.extname(origem).slice(1).replace('jpg', 'jpeg');
    const foto = `data:image/${tipo};base64,${fs.readFileSync(origem).toString('base64')}`;
    await pag.setContent(`<body style="margin:0;width:1200px;height:630px;background:url(${foto}) ${centro[0] * 100}% ${centro[1] * 100}%/cover no-repeat"></body>`);
    await pag.screenshot({ path: destino, type: 'jpeg', quality: 82 });
  } finally { await nav.close(); }
}
try {
  execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageOps
im = Image.open(sys.argv[1]).convert('RGB')
im = ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(float(sys.argv[3]), float(sys.argv[4])))
im.save(sys.argv[2], 'JPEG', quality=82, optimize=True)`, path.join(saida, primeira), path.join(saida, 'og.jpg'), ...centro.map(String)], { stdio: ['ignore', 'ignore', 'ignore'] });
  og = 'og.jpg';
} catch {
  try { await previaPeloNavegador(path.join(saida, primeira), path.join(saida, 'og.jpg')); og = 'og.jpg'; }
  catch { console.warn('Sem Python/Pillow nem Playwright: a prévia usa a foto da capa como está.'); }
}

// 3. Ícone da aba. O da demo (SVG embutido, dos geradores) vira o favicon.svg quando o site.json não traz "favicon";
// com "favicon", vale o do site.json. Nos dois casos sai o embutido: a página fica com um ícone só.
let iconeDaDemo = null;
html = html.replace(/[ \t]*<link\b[^>]*\brel="(?:shortcut )?icon"[^>]*>\n?/g, tag => {
  const href = (tag.match(/\shref="data:image\/svg\+xml(;base64)?,([^"]+)"/) || []);
  if (!href[2]) return tag;
  iconeDaDemo ??= href[1] ? Buffer.from(href[2], 'base64').toString('utf8') : decodeURIComponent(href[2]);
  return '';
});
const fav = conf.favicon || { texto: conf.nome.slice(0, 1), cor: conf.corTema || '#222' };
fs.writeFileSync(path.join(saida, 'favicon.svg'), !conf.favicon && iconeDaDemo ? iconeDaDemo.trim() + '\n' : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${esc(fav.cor)}"/><text x="32" y="43" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${fav.texto.length > 1 ? 28 : 36}" fill="#fff">${esc(fav.texto)}</text></svg>\n`);

// 3b. O que é só da demo: o pedido para o Google não indexar (os geradores põem noindex; o site real quer o Google).
html = html.replace(/[ \t]*<meta name="robots" content="[^"]*noindex[^"]*">\n?/gi, '');

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

// 4b. Painel Renderiza: a agenda online em /agenda/ e o script do Meu site no fim do <head> (para pedir a versão
// publicada o quanto antes). "api" é a base da API pública (só para teste; o padrão é o painel).
if (conf.painel) {
  const { codigo, api, agenda = false, meuSite = true } = conf.painel;
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(codigo || '')) throw new Error('site.json: "painel.codigo" inválido (o mesmo formato da tabela sites)');
  if (api && !/^https?:\/\/[^\s"<>]+\/$/.test(api)) throw new Error('site.json: "painel.api" inválido (termina com /)');
  if (!html.includes('</head>')) throw new Error('index.html sem </head>');
  if (agenda) {
    fs.mkdirSync(path.join(saida, 'agenda'), { recursive: true });
    fs.writeFileSync(path.join(saida, 'agenda', 'index.html'), paginaDaAgenda(html, { codigo, ...(api ? { api } : {}) }));
    const r = ligarNoSite(html);
    html = r.html;
    if (!r.ligou) console.warn('Atenção: o site não tem a seção "Consulte a sua data"; a agenda está em /agenda/, sem link na página.');
  }
  if (meuSite) {
    const js = fs.readFileSync(path.join(raiz, 'ferramentas', 'meu-site', 'meu-site.js'), 'utf8');
    if (/<\/script/i.test(js)) throw new Error('meu-site.js não pode ter </script');
    html = html.replace('</head>', () => `  <script data-codigo="${codigo}"${api ? ` data-api="${esc(api + 'site/')}"` : ''}>\n${js}  </script>\n</head>`);
  }
}
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
${conf.painel && conf.painel.meuSite !== false ? `
## Meu site (Painel Renderiza)

O \`<script data-codigo="${conf.painel.codigo}">\` no fim do \`<head>\` liga o site ao Meu site: o que o cliente publica no
Painel Renderiza aparece por cima do que está no \`index.html\`. Se o painel não responder, a conta for desconectada ou o
script sair, o site mostra o \`index.html\` como está (a versão inicial). Não apague as marcações \`data-site-*\`: são
elas que dizem ao script o que pode mudar.
` : ''}${conf.painel && conf.painel.agenda ? `
## Agenda online (Painel Renderiza)

\`agenda/index.html\` é a agenda online: mostra os dias livres e manda o pedido de pré-reserva para o Painel
Renderiza. Se o painel não responder, ela vira um botão de WhatsApp com a data escrita. O link para ela está na seção
"Consulte a sua data".
` : ''}
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

// 6. Conferência: o que é da demo e não pode ir para o site do cliente (scripts/conferir-site.mjs).
const conferencia = conferirSite(saida);
console.log(relatorio(conferencia));
if (conferencia.problemas.length) process.exitCode = 1;
