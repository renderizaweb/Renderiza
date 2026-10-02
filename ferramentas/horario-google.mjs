// Horário da semana inteira de um lugar no Google Maps (a ficha às vezes abre só com a linha de hoje).
// Uso: node horario-google.mjs "Nome" "lat,lng" "0x…:0x…" "/g/…"   -> imprime JSON com as linhas da tabela
import { spkiProxy } from './proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [, , nome, coords, fid, gid] = process.argv;
const [lat, lng] = coords.split(',');
const url = `https://www.google.com/maps/place/${encodeURIComponent(nome).replace(/%20/g, '+')}/@${coords},17z/data=!4m6!3m5!1s${fid}!8m2!3d${lat}!4d${lng}!16s${encodeURIComponent(gid)}?hl=pt-BR`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy()], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 1000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);
const linhas = () => page.evaluate(() => [...document.querySelectorAll('table tr')].map(tr => tr.innerText.replace(/\s+/g, ' ').trim()).filter(t => /feira|sábado|domingo/i.test(t)));
let rows = await linhas();
for (let tentativa = 0; tentativa < 4 && rows.length < 7; tentativa++) {
  // o resumo "Aberto · Fecha 18:00" / "Fecha em breve" / "Abre ..." abre a tabela ao clicar
  await page.evaluate(n => {
    const alvos = [...document.querySelectorAll('[aria-expanded="false"], [role="button"], button, div[jsaction]')]
      .filter(e => /Fecha|Abre|Aberto|Fechado|horário/i.test((e.getAttribute('aria-label') || '') + ' ' + (e.innerText || '').slice(0, 80)) && e.offsetParent);
    const e = alvos.sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)[n % Math.max(1, alvos.length)];
    if (e) e.click();
  }, tentativa);
  await page.waitForTimeout(1500);
  rows = await linhas();
}
console.log(JSON.stringify({ nome, horas: rows }));
await browser.close();
