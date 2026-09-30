import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const estado = readFileSync('estado.json', 'utf8');
const [,, saida = 'x.png', larg = '1366', alt = '900', acoes = ''] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: +larg, height: +alt }, deviceScaleFactor: +larg < 600 ? 2 : 1, isMobile: +larg < 600, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
// esconde o indicador do Next e o nome do casal (KAUE & MILENA) no cabeçalho
await ctx.addInitScript(() => { const css = 'nextjs-portal{display:none!important} .page-heading .eyebrow{visibility:hidden!important} .family-profile{visibility:hidden!important}'; const add = () => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }; if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); });
await ctx.route('**/api/finance', r => r.request().method() === 'GET' ? r.fulfill({ status: 200, contentType: 'application/json', body: estado }) : r.fulfill({ status: 409, contentType: 'application/json', body: '{"error":"somente leitura"}' }));
const p = await ctx.newPage();
p.on('pageerror', e => console.log('ERRO', e.message.slice(0, 200)));
await p.goto('http://localhost:3200/print-demo', { waitUntil: 'networkidle', timeout: 180000 });
await p.waitForTimeout(2500);
for (const a of acoes.split('>>>').filter(Boolean)) { if (a === 'ESC') await p.keyboard.press('Escape'); else await p.locator(a).first().click(); await p.waitForTimeout(1500); }
console.log((await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 500));
await p.screenshot({ path: saida, fullPage: process.env.INTEIRA === '1' });
await b.close();
