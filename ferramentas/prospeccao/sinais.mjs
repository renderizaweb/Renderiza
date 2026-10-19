// Sinais de que o dono atende: avaliações do Google (texto, nomes citados e respostas do proprietário).
// Uso: node sinais.mjs entrada.jsonl saida.jsonl   (entrada: {fid, nome, link} por linha, ex.: os finalistas)
// Sem login o Google mostra só umas 5 avaliações por lugar (rolar e reordenar não traz mais). ~40 s por lugar;
// rode 4 em paralelo. Leia a saída com ler_sinais.py (ou pontuar.py).
import { spkiProxy } from './proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , entrada, out] = process.argv;
const lugares = fs.readFileSync(entrada, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy()], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1366, height: 1000 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
for (const l of lugares) {
  const page = await ctx.newPage();
  const r = { fid: l.fid, nome: l.nome, avaliacoes: [] };
  try {
    const m = l.link.match(/place\/([^/]+)\/data=.*?!1s(0x[0-9a-f]+:0x[0-9a-f]+).*?!3d(-?[\d.]+)!4d(-?[\d.]+).*?!16s([^!?]+)/);
    const u = `https://www.google.com/maps/place/${m[1]}/@${m[3]},${m[4]},17z/data=!4m8!3m7!1s${m[2]}!8m2!3d${m[3]}!4d${m[4]}!9m1!1b1!16s${m[5]}?hl=pt-BR`;
    await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('[data-review-id]', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(7000);
    const todas = {};
    const coletar = async () => {
      await page.evaluate(() => document.querySelectorAll('button').forEach(b => { if (/^(Mais|Ver mais)$/.test((b.innerText || '').trim())) b.click(); }));
      await page.waitForTimeout(500);
      for (const x of await page.evaluate(() => [...document.querySelectorAll('[data-review-id]')].map(e => ({ id: e.getAttribute('data-review-id'), t: e.innerText })))) if (!todas[x.id] || todas[x.id].t.length < x.t.length) todas[x.id] = x;
    };
    const rolar = () => page.evaluate(() => { const a = document.querySelector('[data-review-id]'); if (!a) return; let el = a.parentElement; while (el && !(el.scrollHeight > el.clientHeight + 50 && getComputedStyle(el).overflowY !== 'visible')) el = el.parentElement; if (el) el.scrollTop = el.scrollHeight; });
    const caixa = await page.evaluate(() => { const a = document.querySelector('[data-review-id]'); if (!a) return null; const b = a.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 40 }; });
    for (let i = 0; i < 3; i++) {
      await coletar(); await rolar();
      if (caixa) { await page.mouse.move(caixa.x, caixa.y); await page.mouse.wheel(0, 4000); }
      await page.waitForTimeout(1300);
    }
    for (const opt of ['Mais recentes', 'Maior nota']) {
      await page.evaluate(() => document.querySelector('button[aria-label="Classificar avaliações"], button[aria-label="Ordenar avaliações"]')?.click());
      await page.waitForTimeout(1200);
      await page.evaluate(opt => { const el = [...document.querySelectorAll('[role=menuitemradio],[role=menuitem],[role=option]')].find(e => (e.innerText || '').trim() === opt); if (el) el.click(); }, opt);
      await page.waitForTimeout(3500);
      for (let i = 0; i < 2; i++) { await coletar(); await rolar(); await page.waitForTimeout(1200); }
    }
    r.avaliacoes = Object.values(todas).map(x => x.t);
  } catch (e) { r.erro = String(e).slice(0, 200); }
  fs.appendFileSync(out, JSON.stringify(r) + '\n');
  await page.close();
}
await browser.close();
