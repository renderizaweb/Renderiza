import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const [,, entrada, saida, x, y, w, h, largura] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage();
const dados = 'data:image/png;base64,' + readFileSync(entrada).toString('base64');
const out = await p.evaluate(async ({ dados, x, y, w, h, largura }) => {
  const img = new Image(); img.src = dados; await img.decode();
  const c = document.createElement('canvas'); c.width = largura; c.height = Math.round(h * largura / w);
  c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', 0.84).split(',')[1];
}, { dados, x: +x, y: +y, w: +w, h: +h, largura: +largura });
writeFileSync(saida, Buffer.from(out, 'base64')); await b.close();
