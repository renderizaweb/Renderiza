// Captura sites no ar em alta resolução. Cada arquivo é baixado com curl (o proxy deste ambiente
// às vezes corta a conexão do navegador), com novas tentativas.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
const [,, nome, url, modo = 'desk'] = process.argv;
const TIPOS = { css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', woff2: 'font/woff2', woff: 'font/woff', json: 'application/json', ico: 'image/x-icon', mp4: 'video/mp4' };
const baixar = (u, ua) => { for (let i = 0; i < 4; i++) { try { return execFileSync('curl', ['-sS', '-f', '-m', '60', '-L', '-A', ua, u], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { if (i === 3) throw e; } } };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const cel = modo === 'cel';
const ctx = await b.newContext({ viewport: cel ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: cel ? 3 : 2, isMobile: cel, hasTouch: cel, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
await ctx.route('**/*', async r => {
  const u = r.request().url();
  if (!/^https?:/.test(u)) return r.continue();
  const real = u.includes('luelegantemodas') ? u.replace(/^https:/, 'http:') : u;
  try {
    const corpo = baixar(real, r.request().headers()['user-agent']);
    const ext = (new URL(u).pathname.match(/\.(\w+)$/) || [])[1] || '';
    const doc = r.request().resourceType() === 'document';
    const tipo = r.request().resourceType() === 'stylesheet' ? 'text/css' : r.request().resourceType() === 'font' ? 'font/woff2' : null;
    return r.fulfill({ status: 200, headers: { 'content-type': tipo || TIPOS[ext.toLowerCase()] || (doc ? 'text/html; charset=utf-8' : 'application/octet-stream'), 'access-control-allow-origin': '*' }, body: corpo });
  } catch (e) { return r.abort(); }
});
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'load', timeout: 240000 });
await p.waitForTimeout(4000);
// espera as imagens visíveis carregarem
await p.evaluate(() => Promise.race([Promise.all([...document.images].filter(i => i.getBoundingClientRect().top < innerHeight).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))), new Promise(r => setTimeout(r, 15000))]));
await p.waitForTimeout(1500);
await p.screenshot({ path: `${nome}-${modo}.png` });
console.log(nome, modo, await p.title());
await b.close();
