// Fotos da página da ótica no Facebook (que costuma replicar os posts do Instagram), sem login.
// Uso: node fb-fotos.mjs <pagina> <pasta-saida>   (ex.: node fb-fotos.mjs oticanina ./fotos)
// Rola a grade de /photos_by e /photos, junta as fotos e baixa cada uma em até 1024 px.
// Depois é só montar uma folha de contato e escolher (fotos repetidas saem pelo hash).
import { spkiProxy } from './proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , pagina, saida] = process.argv;
if (!pagina || !saida) { console.error('Uso: node fb-fotos.mjs <pagina> <pasta-saida>'); process.exit(1); }
fs.mkdirSync(saida, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy()], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1280, height: 1400 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
const p = await ctx.newPage();
const vistos = new Map();
// t51.82787-15 / t51.29350-15: posts vindos do Instagram; t39.30808-6: fotos postadas no Facebook.
p.on('response', r => { const u = r.url(); if (/scontent.*\.(jpg|webp)/.test(u) && /t51\.82787-15|t39\.30808-6|t51\.29350-15/.test(u)) { const id = u.split('?')[0].split('/').pop(); if (!vistos.has(id)) vistos.set(id, u); } });
for (const aba of ['photos_by', 'photos']) {
  await p.goto(`https://www.facebook.com/${pagina}/${aba}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await p.waitForTimeout(6000);
  for (let i = 0; i < 40; i++) {
    await p.evaluate(() => document.querySelectorAll('[aria-label="Fechar"],[aria-label="Close"]').forEach(x => x.click()));
    await p.mouse.wheel(0, 2200); await p.waitForTimeout(1200);
  }
}
let k = 0;
for (const u of vistos.values()) {
  // A grade pede miniatura (ctp=s206x206); sem esse parâmetro o CDN entrega até 1024 px, com a mesma assinatura.
  const r = await ctx.request.get(u.replace(/&ctp=[^&]*/, ''));
  if (r.ok()) fs.writeFileSync(`${saida}/f${String(k++).padStart(3, '0')}.jpg`, await r.body());
}
console.log(`${k} fotos em ${saida}`);
await b.close();
