// Conferência do portfólio (gerar-portfolio.py). Uso: node ferramentas/demo/conferir-portfolio.cjs <pasta de saída> <demo> [<demo> ...]
// Conferência v3: em cada página, no computador (1280 e 1440) e no celular (390): erros, rolagem lateral,
// texto e foto da capa se sobrepondo, foto ampliada demais (borrada), e capturas da capa, da vitrine e do mosaico.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [S, ...pastas] = process.argv.slice(2); const b = await chromium.launch(); const prob = [];
  for (const pasta of pastas) {
    const D = '/home/user/renderiza/demos/' + pasta + '/';
    for (const f of fs.readdirSync(D).filter(x => x.endsWith('.html'))) {
      const pag = f.replace('.html', '');
      for (const [w, h, tipo] of [[390, 844, 'cel'], [1280, 800, 'pc'], [1440, 900, 'pcg']]) {
        const p = await b.newPage({ viewport: { width: w, height: h } }); const err = [];
        p.on('pageerror', e => err.push(e.message));
        await p.goto('file://' + D + f + '?video=1'); await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-visible'))); await p.waitForTimeout(250);
        const r = await p.evaluate(() => {
          const o = [], R = e => e.getBoundingClientRect();
          if (document.documentElement.scrollWidth > innerWidth + 1) o.push('rolagem lateral ' + document.documentElement.scrollWidth);
          const hero = document.querySelector('.pv-hero'), img = hero && hero.querySelector('img'), txt = hero && hero.querySelector('.pv-hero-txt');
          if (img && txt) { const a = R(img), t = R(txt); const x = Math.max(0, Math.min(a.right, t.right) - Math.max(a.left, t.left)), y = Math.max(0, Math.min(a.bottom, t.bottom) - Math.max(a.top, t.top)); if (x * y > 50) o.push('capa: texto sobre a foto'); }
          for (const im of document.querySelectorAll('.pv-hero img, .pv-tile img, .g-item img')) {
            const s = im.clientWidth / (im.naturalWidth || 1); if (s > 1.5 && im.clientWidth > 300) o.push(`ampliada ${s.toFixed(1)}x: ${im.alt.slice(0, 30)} (${im.naturalWidth}px em ${im.clientWidth}px)`);
          }
          for (const el of document.querySelectorAll('h1,h2,.pv-tile-txt b,.pv-preco')) if (el.scrollWidth > el.clientWidth + 2) o.push('texto estoura: ' + el.textContent.slice(0, 30));
          return o;
        });
        if (err.length || r.length) prob.push(`${pasta}/${pag} ${tipo}: ${[...err, ...new Set(r)].join(' | ')}`);
        if (tipo !== 'pcg') { const he = await p.$('.pv-hero'); if (he) await he.screenshot({ path: `${S}/v3/h-${tipo}-${pasta}--${pag}.png` }); }
        if (tipo === 'pc') { const g = await p.$('.pv-galeria .container'); if (g) await g.screenshot({ path: `${S}/v3/g-${pasta}--${pag}.png` });
          const v = await p.$('#ensaios .container'); if (v) await v.screenshot({ path: `${S}/v3/v-${pasta}.png` }); }
        await p.close();
      }
    }
  }
  fs.writeFileSync(S + '/v3/problemas.txt', prob.join('\n') || 'nenhum'); console.log(prob.length ? prob.join('\n') : 'nenhum problema'); await b.close();
})();
