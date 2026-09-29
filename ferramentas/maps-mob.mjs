// Google Maps (versão celular): nome, nota, nº de avaliações e categoria de cada busca.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , out, ...buscas] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk='], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 430, height: 900 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const res = [];
for (const q of buscas) {
  const page = await ctx.newPage();
  let d = { q };
  try {
    await page.goto('https://www.google.com/maps/search/' + encodeURIComponent(q) + '?hl=pt-BR&gl=br', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(9000);
    const txt = await page.evaluate(() => document.body.innerText);
    const linhas = txt.split('\n').map(s => s.trim()).filter(Boolean).filter(s => !/^(Abrir no app|Seu local|Street View)$/.test(s));
    const iNota = linhas.findIndex(s => /^\d,\d$/.test(s));
    d = { q, nome: iNota > 0 ? linhas[iNota - 1] : linhas[0], nota: iNota >= 0 ? linhas[iNota] : '', avaliacoes: iNota >= 0 ? (linhas[iNota + 1] || '').replace(/[()]/g, '') : '',
      categoria: iNota >= 0 ? (linhas[iNota + 2] || '').replace(/·$/, '') : '', lista: /Resultados|resultados/.test(txt), fechado: /Fechado permanentemente|Fechado temporariamente/.test(txt), texto: linhas.slice(0, 14).join(' | ') };
  } catch (e) { d.erro = e.message.slice(0, 100); }
  res.push(d);
  console.log(JSON.stringify({ q: d.q, nome: d.nome, nota: d.nota, avaliacoes: d.avaliacoes, categoria: d.categoria, fechado: d.fechado, erro: d.erro }));
  await page.close();
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
await browser.close();
