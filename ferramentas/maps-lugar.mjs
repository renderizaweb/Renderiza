// Detalhes de lugares do Google Maps a partir dos links da lista: site, telefone, endereço, categoria.
// Uso: node maps-lugar.mjs entrada.jsonl saida.jsonl   (entrada: uma linha JSON com {link, nome} por lugar)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , entrada, out] = process.argv;
const lugares = fs.readFileSync(entrada, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk='], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 1000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
for (const l of lugares) {
  const page = await ctx.newPage();
  try {
    const m = l.link.match(/place\/([^/]+)\/data=.*?!1s(0x[0-9a-f]+:0x[0-9a-f]+).*?!3d(-?[\d.]+)!4d(-?[\d.]+).*?!16s([^!?]+)/);
    const u = m ? `https://www.google.com/maps/place/${m[1]}/@${m[3]},${m[4]},17z/data=!4m6!3m5!1s${m[2]}!8m2!3d${m[3]}!4d${m[4]}!16s${m[5]}?hl=pt-BR` : l.link;
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('h1.DUwDvf', { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(3500);
    const d = await page.evaluate(() => {
      const aria = s => document.querySelector(s)?.getAttribute('aria-label') || '';
      const itens = [...document.querySelectorAll('[data-item-id]')].map(e => e.getAttribute('data-item-id') + ' :: ' + (e.getAttribute('aria-label') || e.innerText).replace(/\s+/g, ' ').trim());
      const links = [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => /instagram\.com|facebook\.com|wa\.me|whatsapp|linktr/.test(h));
      return {
        nomeMaps: (document.querySelector('h1.DUwDvf')?.innerText || '').trim(),
        categoria: (document.querySelector('button.DkEaL')?.innerText || '').trim(),
        endereco: aria('button[data-item-id="address"]').replace(/^Endereço:\s*/, ''),
        telefone: aria('button[data-item-id^="phone"]').replace(/^Telefone:\s*/, ''),
        site: document.querySelector('a[data-item-id="authority"]')?.href || '',
        redes: [...new Set(links)].slice(0, 6),
        atributos: itens.filter(i => /place-info-links/.test(i)).map(i => i.split(' :: ')[1]),
        fechado: /Fechado permanentemente|Fechado temporariamente/.test(document.body.innerText),
      };
    });
    fs.appendFileSync(out, JSON.stringify({ ...l, ...d }) + '\n');
  } catch (e) { fs.appendFileSync(out, JSON.stringify({ ...l, erro: e.message.slice(0, 100) }) + '\n'); }
  await page.close();
}
await browser.close();
