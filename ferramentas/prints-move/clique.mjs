import { abrir, B } from './base.mjs';
import * as d from './dados.mjs';
const [,, rota, alvo, saida, larg = '390'] = process.argv;
const mocks = { 'GET /api/v1/me': d.meAluno, 'GET /api/v1/notifications/unread-count': { unreadCount: 2 }, 'GET /api/v1/food-diary/today': d.diarioHoje, ...d.extras, ...(d.extras2 || {}) };
const { b, p } = await abrir({ log: true, mocks, largura: +larg, altura: +larg < 600 ? 844 : 900 });
await p.goto(B + rota, { waitUntil: 'networkidle', timeout: 120000 });
await p.waitForTimeout(1500);
for (const a of alvo.split('>>>')) { await p.locator(a).first().click(); await p.waitForTimeout(2000); }
console.log('URL', p.url());
console.log((await p.evaluate(() => document.querySelector('main')?.innerText || document.body.innerText)).replace(/\s+/g, ' ').slice(0, 500));
await p.screenshot({ path: saida });
await b.close();
