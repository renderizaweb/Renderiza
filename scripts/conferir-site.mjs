// Conferência do site do cliente antes de ir para o repositório dele (roteiro: docs/fechamento.md, passo 5).
//
// Uso: node scripts/conferir-site.mjs <pasta-do-site>   (a saída do scripts/virar-site.mjs, que já chama esta conferência)
//
// Problema = não pode ir para o ar assim (sai com código 1). Aviso = olhar antes de entregar.
// Pega o que é da demo e não do site: rastreio da Renderiza, card de valor da oferta, link de /demo/, noindex,
// texto provisório ("espaço reservado"…), foto que não existe em img/, endereço oficial faltando.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARQUIVOS = ['index.html', 'README.md', 'robots.txt', 'sitemap.xml', 'vercel.json', '_headers', 'favicon.svg'];
// Texto que só existe enquanto falta alguma coisa do cliente. Procurado no texto visível e nos alt das fotos.
const PROVISORIO = /espa[çc]o reservado|lorem ipsum|\bplaceholder\b|\bTODO\b|\bFIXME\b|a definir|XXXX|\[(?:nome|foto|telefone|texto)[^\]]*\]/i;
// Pode ser de verdade ("em breve, nova unidade"), mas vale olhar.
const TALVEZ_PROVISORIO = /\bem breve\b|\bem constru[çc][ãa]o\b/i;

/** O texto que a pessoa vê: sem <style>, <script>, comentários e tags (com os alt das fotos). */
export function textoVisivel(html) {
  const alts = [...html.matchAll(/<img\b[^>]*\salt="([^"]*)"/gi)].map(m => m[1]);
  const corpo = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(style|script|template|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return (corpo + ' ' + alts.join(' ')).replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Confere o HTML de um site já gerado. Devolve { problemas: [], avisos: [] } (frases curtas, em português). */
export function conferirHtml(html, { dominio, existe = () => true } = {}) {
  const problemas = [], avisos = [];
  if (/\/exemplos\/visitas\.js|data-pagina="demo"|\sdata-demo="/.test(html)) problemas.push('Ficou o rastreio de visitas da Renderiza (visitas.js / data-demo).');
  if (/data-rz-oferta|class="rz-(?:oferta|faixa)|id="valor-do-site"/.test(html)) problemas.push('Ficou o card de valor ou a faixa da oferta da demo.');
  if (/renderizaweb\.com\.br\/demo|href="\/demo\//.test(html)) problemas.push('Ficou link para a demo (/demo/…).');
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) problemas.push('A página pede para o Google não indexar (noindex).');
  const texto = textoVisivel(html);
  const provisorio = texto.match(PROVISORIO);
  if (provisorio) problemas.push(`Texto provisório na página: "${provisorio[0]}" (falta algo do cliente?).`);
  const faltando = [...new Set([...html.matchAll(/\ssrc="\/?(img\/[^"?#]+)"/g)].map(m => m[1]))].filter(f => !existe(f));
  if (faltando.length) problemas.push(`Foto que não existe em img/: ${faltando.join(', ')}.`);
  if (!/<title>[^<]+<\/title>/.test(html)) problemas.push('Sem <title>.');
  if (dominio && !html.includes(`<link rel="canonical" href="https://${dominio}/">`)) problemas.push(`Sem o endereço oficial (canonical) https://${dominio}/.`);

  if (!/<meta name="description" content="[^"]+"/.test(html)) avisos.push('Sem descrição (meta description): a prévia do WhatsApp e o Google ficam sem texto.');
  if (!/wa\.me\/55\d{10,11}|api\.whatsapp\.com\/send\?phone=55\d{10,11}/.test(html)) avisos.push('Nenhum link de WhatsApp com número (wa.me/55…).');
  const talvez = texto.match(TALVEZ_PROVISORIO);
  if (talvez) avisos.push(`"${talvez[0]}" na página: é de verdade ou ficou da demo?`);
  // Ícone em SVG embutido é leve; foto embutida (base64 de 4 KB ou mais) pesa e não entra no cache.
  if (/data:image\/(?:png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]{5400}/.test(html)) avisos.push('Sobrou foto embutida no HTML (CSS ou atributo): a página fica mais pesada.');
  if (/<meta property="og:image" content="[^"]+\.(?:webp|avif)"/.test(html)) avisos.push('A prévia (og:image) está em WebP/AVIF: o WhatsApp pode não mostrar. O normal é og.jpg.');
  return { problemas, avisos };
}

/** Confere a pasta inteira do site (arquivos obrigatórios + HTML). */
export function conferirSite(pasta) {
  const problemas = [], avisos = [];
  for (const a of ARQUIVOS) if (!fs.existsSync(path.join(pasta, a))) problemas.push(`Falta o arquivo ${a}.`);
  if (!fs.existsSync(path.join(pasta, 'index.html'))) return { problemas, avisos };
  const html = fs.readFileSync(path.join(pasta, 'index.html'), 'utf8');
  const dominio = (html.match(/<link rel="canonical" href="https:\/\/([^/"]+)\/">/) || [])[1];
  const r = conferirHtml(html, { dominio, existe: f => fs.existsSync(path.join(pasta, f)) });
  if (!dominio) r.problemas.push('Sem o endereço oficial (canonical): o site saiu do scripts/virar-site.mjs?');
  if (fs.existsSync(path.join(pasta, 'agenda', 'index.html'))) {
    const agenda = conferirHtml(fs.readFileSync(path.join(pasta, 'agenda', 'index.html'), 'utf8'), { existe: f => fs.existsSync(path.join(pasta, f)) });
    r.problemas.push(...agenda.problemas.map(p => 'Agenda: ' + p));
  }
  return { problemas: [...problemas, ...r.problemas], avisos: r.avisos };
}

/** Texto para o terminal. */
export function relatorio({ problemas, avisos }) {
  if (!problemas.length && !avisos.length) return 'Conferência: tudo certo.';
  return ['Conferência:', ...problemas.map(p => '  ✗ ' + p), ...avisos.map(a => '  ! ' + a),
    problemas.length ? '  Corrija os ✗ na demo e gere de novo antes de subir para o repositório do cliente.' : '  Sem problemas; olhe os avisos.'].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pasta = process.argv[2];
  if (!pasta) { console.error('Uso: node scripts/conferir-site.mjs <pasta-do-site>'); process.exit(1); }
  const r = conferirSite(path.resolve(pasta));
  console.log(relatorio(r));
  if (r.problemas.length) process.exitCode = 1;
}
