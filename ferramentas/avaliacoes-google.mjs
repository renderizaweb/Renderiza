// Ficha e avaliações de um lugar no Google Maps (desktop, pela URL com o id do lugar).
// Uso: node avaliacoes-google.mjs "Nome" "lat,lng" "0x…:0x…" "/g/…" saida.json
// Sem login o Google mostra só uma parte das avaliações (costuma vir 8 a 20).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , nome, coords, fid, gid, saida] = process.argv;
const base = `https://www.google.com/maps/place/${encodeURIComponent(nome).replace(/%20/g, '+')}/@${coords},17z/data=`;
const [lat, lng] = coords.split(',');
const urlFicha = base + `!4m6!3m5!1s${fid}!8m2!3d${lat}!4d${lng}!16s${encodeURIComponent(gid)}?hl=pt-BR`;
const urlAval = base + `!4m8!3m7!1s${fid}!8m2!3d${lat}!4d${lng}!9m1!1b1!16s${encodeURIComponent(gid)}?hl=pt-BR`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk='], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 1000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
await page.goto(urlFicha, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(9000);
await page.evaluate(() => document.querySelectorAll('[aria-label*="horário" i],[data-item-id="oh"],[aria-expanded="false"]').forEach(b => { try { if (/hor/i.test(b.getAttribute('aria-label') || '')) b.click(); } catch (e) {} }));
await page.waitForTimeout(1500);
const ficha = await page.evaluate(() => document.body.innerText);
const itens = await page.evaluate(() => [...document.querySelectorAll('[data-item-id]')].map(e => e.getAttribute('data-item-id') + ' :: ' + (e.getAttribute('aria-label') || e.innerText).replace(/\s+/g, ' ').trim()));
const horas = await page.evaluate(() => [...document.querySelectorAll('table tr')].map(tr => tr.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean));
await page.screenshot({ path: saida.replace(/\.json$/, '-ficha.png') });
await page.goto(urlAval, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(9000);
const todas = {};
const coletar = async () => {
  await page.evaluate(() => document.querySelectorAll('button').forEach(b => { if (/^(Mais|Ver mais)$/.test((b.innerText || '').trim()) || b.getAttribute('aria-label') === 'Ver mais') b.click(); }));
  await page.waitForTimeout(700);
  const lista = await page.evaluate(() => [...document.querySelectorAll('[data-review-id]')].map(e => ({ id: e.getAttribute('data-review-id'), t: e.innerText })));
  for (const r of lista) if (!todas[r.id] || todas[r.id].t.length < r.t.length) todas[r.id] = r;
};
const rolar = async () => page.evaluate(() => {
  const r = document.querySelector('[data-review-id]'); if (!r) return;
  let el = r.parentElement; while (el && !(el.scrollHeight > el.clientHeight + 50 && getComputedStyle(el).overflowY !== 'visible')) el = el.parentElement;
  if (el) el.scrollTop = el.scrollHeight;
});
for (let i = 0; i < 12; i++) { await coletar(); await rolar(); await page.waitForTimeout(1500); }
for (const opt of ['Mais recentes', 'Maior nota']) {
  await page.evaluate(() => document.querySelector('button[aria-label="Classificar avaliações"], button[aria-label="Ordenar avaliações"]')?.click());
  await page.waitForTimeout(1500);
  await page.evaluate(opt => { const el = [...document.querySelectorAll('[role=menuitemradio],[role=menuitem],[role=option]')].find(e => (e.innerText || '').trim() === opt); if (el) el.click(); }, opt);
  await page.waitForTimeout(3000);
  for (let i = 0; i < 6; i++) { await coletar(); await rolar(); await page.waitForTimeout(1500); }
}
fs.writeFileSync(saida, JSON.stringify({ urlFicha, urlAval, itens, horas, ficha, avaliacoes: Object.values(todas) }, null, 1));
console.log('itens:', itens.length, '| horas:', horas.length, '| avaliações:', Object.keys(todas).length);
await browser.close();
