import { abrir, B } from './base.mjs';
import * as d from './dados.mjs';
const [,, rota = '/app/diario', saida = 'sonda.png', larg = '390'] = process.argv;
const mocks = {
  'GET /api/v1/me': d.meAluno,
  'GET /api/v1/notifications/unread-count': { unreadCount: 2 },
  'GET /api/v1/food-diary/today': d.diarioHoje,
  ...(d.extras || {}),
};
const { b, p } = await abrir({ log: true, mocks, largura: +larg, altura: +larg < 600 ? 844 : 900 });
await p.goto(B + rota, { waitUntil: 'networkidle', timeout: 120000 });
await p.waitForTimeout(2500);
console.log('URL', p.url());
console.log((await p.evaluate(() => document.querySelector('main')?.innerText || document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700));
await p.screenshot({ path: saida });
await b.close();
