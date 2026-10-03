// Fotos da ficha do Google Maps de um lugar (a foto de capa e as miniaturas da seção "Fotos"), em até 2000 px.
// O visualizador de fotos não abre sem tela; as miniaturas do painel bastam para fachada e loja por dentro.
// Uso: node fotos-google.mjs "Nome" "lat,lng" "0x…:0x…" "/g/…" <pasta-saida>
import { spkiProxy } from './proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , nome, coords, fid, gid, saida] = process.argv;
const [lat, lng] = coords.split(',');
const url = `https://www.google.com/maps/place/${encodeURIComponent(nome).replace(/%20/g, '+')}/@${coords},17z/data=!4m6!3m5!1s${fid}!8m2!3d${lat}!4d${lng}!16s${encodeURIComponent(gid)}?hl=pt-BR`;
fs.mkdirSync(saida, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy()], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 1000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(8000);
const achar = () => p.evaluate(() => {
  const us = [];
  document.querySelectorAll('img[src*="googleusercontent"]').forEach(i => us.push(i.src));
  document.querySelectorAll('[style*="googleusercontent"]').forEach(e => { const m = e.getAttribute('style').match(/url\("?([^")]+)/); if (m) us.push(m[1]); });
  return us;
});
const todas = new Set();
for (let i = 0; i < 8; i++) {
  (await achar()).forEach(u => todas.add(u));
  await p.evaluate(() => { const r = document.querySelector('div[role="main"]'); const el = r && [...r.querySelectorAll('div')].find(d => d.scrollHeight > d.clientHeight + 100 && getComputedStyle(d).overflowY !== 'visible'); if (el) el.scrollTop += 900; });
  await p.waitForTimeout(1200);
}
// fora: avatares de quem avaliou e ícones (a-/, /a/, tamanhos pequenos fixos)
const base = [...new Set([...todas].map(u => u.split('=')[0]))].filter(u => !/\/a-\/|\/a\/|=s\d{2}-|default-user/.test(u));
let k = 0;
for (const u of base) {
  const r = await ctx.request.get(u + '=s2000').catch(() => null);
  if (!r || !r.ok()) continue;
  const buf = await r.body();
  if (buf.length < 20000) continue;
  fs.writeFileSync(`${saida}/g${String(k++).padStart(2, '0')}.jpg`, buf);
}
console.log(`${k} fotos do Google em ${saida}`);
await b.close();
