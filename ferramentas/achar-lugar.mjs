// Acha o id do lugar no Google Maps (modo celular). Uso: node achar-lugar.mjs "Nome da ótica cidade"
// Devolve fids (0x…:0x…), coordenadas e ids /g/…, que o avaliacoes-google.mjs usa.
import { spkiProxy } from './proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const q = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy()], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 430, height: 900 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const page = await ctx.newPage();
const corpos = [];
page.on('response', async r => { if (/search\?|preview\/place|maps\/search/.test(r.url())) { try { corpos.push(await r.text()); } catch (e) {} } });
await page.goto('https://www.google.com/maps/search/' + encodeURIComponent(q) + '?hl=pt-BR&gl=br', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(9000);
const html = await page.content();
const tudo = html + corpos.join('\n');
const fids = [...new Set(tudo.match(/0x[0-9a-f]{8,}:0x[0-9a-f]{8,}/g) || [])];
const coords = [...new Set((tudo.match(/-23\.\d{4,},-46\.\d{4,}/g) || []))].slice(0, 5);
const gids = [...new Set(tudo.match(/\/g\/[0-9a-z_]{6,}/g) || [])].slice(0, 5);
console.log(JSON.stringify({ url: page.url(), fids: fids.slice(0, 5), coords, gids }));
console.log((await page.evaluate(() => document.body.innerText)).split('\n').filter(Boolean).slice(0, 25).join(' | '));
await browser.close();
