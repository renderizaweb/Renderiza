// Lista de resultados do Google Maps para buscas como "ótica em Tatuapé São Paulo".
// Uso: node maps-lista.mjs saida.jsonl "busca 1" "busca 2" ...
// Para cada card da lista: nome, nota, nº de avaliações, link do lugar e site (quando o card mostra).
import { spkiProxy } from './proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , out, ...buscas] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy()], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 1000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
for (const q of buscas) {
  const page = await ctx.newPage();
  try {
    await page.goto('https://www.google.com/maps/search/' + encodeURIComponent(q) + '?hl=pt-BR&gl=br', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('div[role=feed], h1.DUwDvf', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(4000);
    for (let i = 0; i < 14; i++) {
      await page.evaluate(() => { const f = document.querySelector('div[role=feed]'); if (f) f.scrollBy(0, 2500); });
      await page.waitForTimeout(1800);
      if (await page.evaluate(() => /chegou ao final|final da lista/i.test(document.querySelector('div[role=feed]')?.innerText || ''))) break;
    }
    const itens = await page.evaluate(() => [...document.querySelectorAll('div[role=feed] a.hfpxzc')].map(a => {
      const card = a.closest('div.Nv2PK') || a.parentElement;
      const txt = (card?.innerText || '').replace(/\s+/g, ' ').trim();
      const site = card?.querySelector('a[data-value="Website"], a[aria-label^="Visitar"], a[aria-label*="site" i]')?.href || [...(card?.querySelectorAll('a[href^="http"]') || [])].map(x => x.href).find(h => !/google\.[a-z.]+\/maps|google\.com\/aclk/.test(h)) || '';
      const r = [...(card?.querySelectorAll('[role=img][aria-label]') || [])].map(e => e.getAttribute('aria-label')).find(l => /estrela/i.test(l)) || '';
      const m = r.match(/([\d,]+)\s*estrelas?\s*([\d.]+)?/i);
      const cnt = (card?.querySelector('span.UY7F9')?.innerText || '').replace(/\D/g, '');
      return { nome: a.getAttribute('aria-label') || '', nota: m ? m[1] : '', aval: cnt || (m && m[2] ? m[2].replace('.', '') : ''), rot: r, site, link: a.href, txt: txt.slice(0, 260) };
    }));
    for (const it of itens) fs.appendFileSync(out, JSON.stringify({ q, ...it }) + '\n');
    console.log(q, '->', itens.length);
  } catch (e) { console.log(q, 'ERRO', e.message.slice(0, 100)); }
  await page.close();
}
await browser.close();
