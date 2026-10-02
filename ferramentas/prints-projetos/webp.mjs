import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const DEST = new URL('../../site/estatico/imagens/projetos/', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage();
const conv = async (entrada, saida, larg, recorteAlt = null, q = 0.86) => {
  const dados = 'data:image/png;base64,' + readFileSync(entrada).toString('base64');
  const r = await p.evaluate(async ({ dados, larg, recorteAlt, q }) => {
    const img = new Image(); img.src = dados; await img.decode();
    const w = img.naturalWidth, h = recorteAlt ? Math.min(img.naturalHeight, Math.round(w * recorteAlt)) : img.naturalHeight;
    const c = document.createElement('canvas'); c.width = larg; c.height = Math.round(h * larg / w);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h, 0, 0, c.width, c.height);
    return { b64: c.toDataURL('image/webp', q).split(',')[1], w: c.width, h: c.height };
  }, { dados, larg, recorteAlt, q });
  writeFileSync(DEST + saida, Buffer.from(r.b64, 'base64'));
  console.log(saida, r.w + 'x' + r.h, Math.round(r.b64.length * 0.75 / 1024) + 'KB');
};
for (const [png, nome] of [['move', 'move'], ['compasso', 'compasso'], ['blulens', 'blulens'], ['lu', 'lu-elegante']]) {
  await conv(`${png}-desk.png`, `${nome}-1400.webp`, 1400);
  await conv(`${png}-desk.png`, `${nome}-2400.webp`, 2400, null, 0.84);
  await conv(`${png}-cel.png`, `${nome}-celular.webp`, 720, 2.0);
}
await b.close();
