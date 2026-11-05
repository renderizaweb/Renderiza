// Abre URLs no Chromium e grava título, trecho do texto, @ e telefones achados e uma captura. Uso: node abrir.mjs entrada.json saida.jsonl pasta
import { spkiProxy } from './proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [, , entrada, out, pasta] = process.argv;
const itens = JSON.parse(fs.readFileSync(entrada, 'utf8'));
fs.mkdirSync(pasta, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy()], proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
for (const it of itens) {
  const page = await ctx.newPage(); let r = { ...it };
  try {
    const resp = await page.goto(it.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    r.status = resp ? resp.status() : null; r.final = page.url(); r.titulo = await page.title();
    const txt = (await page.evaluate(() => document.body?.innerText || '')).replace(/\s+/g, ' ');
    r.texto = txt.slice(0, 400);
    r.igs = [...new Set((await page.content()).match(/instagram\.com\/[A-Za-z0-9_.]+/g) || [])].slice(0, 4);
    r.fones = [...new Set(txt.match(/\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/g) || [])].slice(0, 4);
    await page.screenshot({ path: `${pasta}/${it.id}.png` });
  } catch (e) { r.erro = String(e).slice(0, 140); }
  fs.appendFileSync(out, JSON.stringify(r) + '\n');
  await page.close();
}
await browser.close();
