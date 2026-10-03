import { spkiProxy } from '/home/user/renderiza/ferramentas/proxy.mjs';
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const PROXY = process.env.HTTPS_PROXY.replace(/^https?:\/\//, '');
const [, , arquivo, OUT] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--ignore-certificate-errors-spki-list=' + spkiProxy(), '--proxy-server=https=' + PROXY] });
let falhas = 0;
const ok = (n, c, i = '') => { if (!c) falhas++; console.log((c ? 'OK      ' : 'FALHOU  ') + n + (i ? '  →  ' + i : '')); };
for (const [nome, vw, vh] of [['desktop', 1440, 900], ['celular', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|maps|google/i.test(m.text())) erros.push(m.text()); });
  await page.goto('file://' + arquivo, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'));
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => ({
    imgs: [...document.images].length, quebradas: [...document.images].filter(i => !i.complete || !i.naturalWidth).length,
    reviews: document.querySelectorAll('[data-reviews] li').length, esperadas: window.DEMO_CLIENT.reviews.length,
    dots: [...document.querySelectorAll('[data-carousel]')].map(c => c.querySelectorAll('[data-dots] button').length),
    wa: [...document.querySelectorAll('[data-whatsapp]')].every(a => a.href.startsWith(window.DEMO_CLIENT.whatsapp.split('?')[0])),
    ig: [...document.querySelectorAll('[data-instagram]')].every(a => a.href === window.DEMO_CLIENT.instagram),
    excesso: document.documentElement.scrollWidth - window.innerWidth,
    titulo: document.title, fontes: document.fonts.status,
  }));
  ok(`${nome}: imagens carregadas`, r.quebradas === 0, `${r.imgs} imagens, ${r.quebradas} quebradas`);
  ok(`${nome}: avaliações no carrossel`, r.reviews === r.esperadas && r.reviews >= 3, r.reviews + '/' + r.esperadas);
  ok(`${nome}: carrosséis com pontos`, r.dots.length >= 1 && r.dots.every(n => n >= 2), JSON.stringify(r.dots));
  ok(`${nome}: WhatsApp e Instagram certos`, r.wa && r.ig);
  ok(`${nome}: sem rolagem para o lado`, r.excesso <= 0, r.excesso + 'px');
  // carrossel da vitrine anda
  const track = page.locator('.gallery-section .carousel-track').first();
  if (await track.count()) {
  await track.scrollIntoViewIfNeeded();
  const antes = await track.evaluate(t => t.scrollLeft);
  await page.locator('.gallery-section [data-next]').first().click();
  await page.waitForTimeout(900);
  const depois = await track.evaluate(t => t.scrollLeft);
  ok(`${nome}: seta do carrossel da vitrine anda`, depois > antes, `${antes} → ${depois}`);
  }
  const larguras = await page.evaluate(() => ({ vw: window.innerWidth, controles: [...document.querySelectorAll('.carousel-controls')].map(c => Math.round(c.getBoundingClientRect().right)), secoesRoladas: [...document.querySelectorAll('section')].filter(s => s.scrollLeft !== 0).map(s => s.id) }));
  ok(`${nome}: controles dos carrosséis cabem na tela`, larguras.controles.every(r => r <= larguras.vw), JSON.stringify(larguras.controles));
  ok(`${nome}: nenhuma seção escorregou para o lado`, !larguras.secoesRoladas.length, larguras.secoesRoladas.join(','));
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('.carousel-track').forEach(t => t.scrollLeft = 0); scrollTo(0, 0); document.activeElement && document.activeElement.blur(); document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-visible')); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${nome}.png`, fullPage: true });
  if (nome === 'celular') {
    await page.evaluate(() => scrollTo(0, 0));
    await page.click('[data-menu-button]');
    ok('celular: menu abre', await page.locator('#menu-mobile').isVisible());
    await page.click('#menu-mobile a[href^="#"] >> nth=1');
    await page.waitForTimeout(500);
    ok('celular: menu fecha ao navegar', await page.locator('#menu-mobile').isHidden());
  }
  ok(`${nome}: sem erros no console`, !erros.length, erros.join(' | ').slice(0, 200));
  await page.close();
}
console.log(falhas ? falhas + ' falha(s)' : 'Tudo passou.');
await browser.close();
import { execFileSync } from 'node:child_process';
execFileSync('python3', [new URL('./fatiar.py', import.meta.url).pathname, OUT]);
