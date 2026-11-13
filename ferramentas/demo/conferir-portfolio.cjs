// Conferência do portfólio online (gerar-portfolio.py, versão 4).
// Uso: node ferramentas/demo/conferir-portfolio.cjs <pasta de saída> <demo> [<demo> ...]
// Em cada página da demo, no celular (390) e no computador (1280 e 1440), ROLANDO a página de verdade:
//   erros no console, rolagem lateral, foto quebrada, foto ampliada (borrada), foto cortada (a página promete a foto
//   inteira), texto estourando, bloco que nunca aparece (animação de entrada presa) e a palavra "site" em qualquer
//   texto, rótulo ou mensagem de WhatsApp. Grava a página inteira em <saída>/<demo>--<página>-<cel|pc|pcg>.jpg.
// Depois, na vitrine e numa página de ensaio, com cliques de verdade: cada aba do filtro, a tela cheia (abrir, passar,
// fechar), o menu do celular, a faixa e a pílula da Renderiza, a barra de reserva e as mensagens do WhatsApp.
// Sai com código 1 se achar problema. OLHAR as capturas continua obrigatório (rosto, enquadramento, ritmo).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const REPO = path.resolve(__dirname, '..', '..');
const TELAS = [[390, 844, 'cel'], [1280, 800, 'pc'], [1440, 900, 'pcg']];

function argsDoNavegador() {
  // No ambiente da nuvem, a internet (as fontes do Google) passa pelo proxy: sem ele, a captura sai com a fonte errada.
  const args = ['--no-sandbox'];
  try {
    const cert = new crypto.X509Certificate(fs.readFileSync('/root/.ccr/agent-proxy-ca.crt'));
    const spki = crypto.createHash('sha256').update(cert.publicKey.export({ type: 'spki', format: 'der' })).digest('base64');
    if (process.env.HTTPS_PROXY) args.push('--ignore-certificate-errors-spki-list=' + spki, '--proxy-server=https=' + process.env.HTTPS_PROXY.replace(/^https?:\/\//, ''));
  } catch (e) { /* fora da nuvem: abre direto */ }
  return args;
}

const rolar = async p => {
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const passo = Math.round((await p.evaluate(() => innerHeight)) * 0.7);
  for (let y = 0; y < total; y += passo) { await p.mouse.wheel(0, passo); await p.waitForTimeout(140); }
  await p.waitForTimeout(500);
  await p.evaluate(async () => { await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 6000); }))); });
};

const medir = () => {
  const o = [], R = e => e.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  if (document.documentElement.scrollWidth > innerWidth + 1) o.push('rolagem lateral: ' + document.documentElement.scrollWidth + ' px');
  for (const im of document.images) {
    const r = R(im); if (r.width < 2 || r.height < 2) continue;
    const nome = (im.alt || im.className || 'sem alt').slice(0, 40);
    if (!im.naturalWidth) { if (im.complete) o.push('foto quebrada: ' + nome); continue; } // a que ainda não foi pedida (fora da tela, na tira) não conta
    if (r.width > 120 && r.width * dpr > im.naturalWidth * 1.03) o.push(`foto ampliada ${(r.width * dpr / im.naturalWidth).toFixed(2)}x: ${nome} (${im.naturalWidth} px em ${Math.round(r.width * dpr)})`);
    const fit = getComputedStyle(im).objectFit;
    if (fit === 'cover') {
      const corte = 1 - Math.min((r.width / r.height) / (im.naturalWidth / im.naturalHeight), (im.naturalWidth / im.naturalHeight) / (r.width / r.height));
      const quadro = im.closest('.g-item, .tira-foto'); // aqui a foto tem de aparecer inteira; nas miniaturas o corte é do desenho
      if (corte > (quadro ? 0.02 : 0.3)) o.push(`foto cortada ${Math.round(corte * 100)}%: ${nome}`);
    }
  }
  for (const el of document.querySelectorAll('h1,h2,h3,.botao,.ens b,.preco,.valor,[role=tab],.rz-troca a,.marca,.menu-botao')) {
    if (!el.offsetParent || el.classList.contains('sr-only')) continue;
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== 'auto') o.push('texto estoura: ' + el.textContent.trim().slice(0, 40));
    const r = R(el); if (r.right > innerWidth + 1 && !el.closest('.rz-troca, .filtro, .tira')) o.push('texto fora da tela: ' + el.textContent.trim().slice(0, 40));
  }
  // a tira da capa tem de começar na primeira foto e passar para o lado (rolagem lateral não acusa foto empurrada para a esquerda)
  const tira = document.querySelector('[data-tira]');
  if (tira) {
    const primeira = tira.querySelector('.tira-item'), x = primeira ? R(primeira).left + tira.scrollLeft : 0;
    if (tira.scrollWidth <= tira.clientWidth + 4) o.push('a tira da capa não passa para o lado');
    if (!primeira || x < -2 || x > innerWidth * .4) o.push('a tira da capa não começa na primeira foto (x = ' + Math.round(x) + ')');
  }
  const presos = [...document.querySelectorAll('.reveal:not(.is-visible)')].filter(e => e.offsetParent);
  if (presos.length) o.push(presos.length + ' bloco(s) com a animação de entrada presa: ' + (presos[0].className || '').slice(0, 40));
  // a palavra "site": no texto que aparece, nos rótulos e nas mensagens de WhatsApp
  const textos = [document.body.innerText, document.title, ...[...document.querySelectorAll('[alt],[aria-label],[title],meta[name=description]')].map(e => e.getAttribute('alt') || e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('content') || ''),
    ...[...document.querySelectorAll('a[href*="wa.me"]')].map(a => decodeURIComponent(a.href)), JSON.stringify(window.RZ || {}), JSON.stringify((window.DEMO_CLIENT || {}).whatsapp || '')];
  const comSite = textos.filter(t => /\bsites?\b/i.test(t.replace(/renderizaweb\.com\.br/g, '')));
  if (comSite.length) o.push('fala em "site": ' + comSite[0].slice(0, 80));
  return [...new Set(o)];
};

(async () => {
  const [S, ...demos] = process.argv.slice(2);
  if (!S || !demos.length) { console.error('uso: conferir-portfolio.cjs <pasta de saída> <demo> [<demo> ...]'); process.exit(2); }
  fs.mkdirSync(S, { recursive: true });
  const b = await chromium.launch({ args: argsDoNavegador() }); const prob = []; const ok = [];
  const abrir = async (arquivo, w, h, extra = '') => {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const err = [];
    p.on('pageerror', e => err.push('erro: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/i.test(m.text())) err.push('console: ' + m.text().slice(0, 120)); });
    await p.goto('file://' + arquivo + extra, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    return { p, err };
  };
  for (const demo of demos) {
    const D = path.join(REPO, 'demos', demo);
    const paginas = fs.readdirSync(D).filter(x => x.endsWith('.html')).sort((x, y) => (x === 'index.html' ? -1 : y === 'index.html' ? 1 : x.localeCompare(y)));
    for (const f of paginas) {
      const pag = f.replace('.html', '');
      for (const [w, h, tipo] of TELAS) {
        const { p, err } = await abrir(path.join(D, f), w, h);
        await p.waitForTimeout(700); // a primeira tela, como a pessoa vê ao abrir
        await p.screenshot({ path: path.join(S, `${demo}--${pag}-${tipo}-topo.jpg`), type: 'jpeg', quality: 76 });
        await rolar(p);
        const r = await p.evaluate(medir);
        const fontes = await p.evaluate(() => [...new Set(['h1', 'body', '.marca i'].map(s => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '') + (document.fonts.check('16px ' + getComputedStyle(e).fontFamily.split(',')[0]) ? '' : ' (não carregou)') : ''; }))].join(', '));
        if (/não carregou/.test(fontes)) r.push('fonte: ' + fontes);
        if (err.length || r.length) prob.push(`${demo}/${pag} ${tipo}: ${[...new Set(err), ...r].join(' | ')}`);
        // Na captura da página inteira, o que é fixo (topo grudado, pílula, botão e barra) sairia no meio da imagem: fica parado ou some.
        await p.addStyleTag({ content: '.site-header{position:relative!important}.rz-pilula,.rz-folha,.flutuante,.barra{display:none!important}' });
        await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); }); await p.waitForTimeout(300);
        await p.screenshot({ path: path.join(S, `${demo}--${pag}-${tipo}.jpg`), type: 'jpeg', quality: 72, fullPage: true });
        await p.close();
      }
    }
    // ---------- cliques de verdade ----------
    const teste = async (nome, fn) => { try { const r = await fn(); if (r) prob.push(`${demo} ${nome}: ${r}`); else ok.push(nome); } catch (e) { prob.push(`${demo} ${nome}: ${e.message.split('\n')[0].slice(0, 160)}`); } };
    const ensaio = paginas.find(x => x !== 'index.html');
    for (const [w, h, tipo] of [TELAS[0], TELAS[2]]) {
      const { p, err } = await abrir(path.join(D, 'index.html'), w, h);
      await teste(`${tipo}: filtro por ensaio`, async () => {
        const abas = p.locator('[role=tab]'); const n = await abas.count(); if (n < 2) return 'menos de 2 abas';
        for (let i = 0; i < n; i++) {
          await abas.nth(i).scrollIntoViewIfNeeded(); await abas.nth(i).click(); await p.waitForTimeout(450);
          const r = await p.evaluate(async i => {
            const a = document.querySelectorAll('[role=tab]')[i], pn = document.getElementById(a.getAttribute('aria-controls'));
            const vis = [...document.querySelectorAll('[role=tabpanel]')].filter(x => !x.hidden);
            await Promise.all([...pn.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; setTimeout(r, 5000); })));
            const fotos = [...pn.querySelectorAll('.g-item')].map(x => x.getBoundingClientRect());
            return { sel: a.getAttribute('aria-selected'), vis: vis.length, mesmo: vis[0] === pn, n: fotos.length, zero: fotos.filter(r => r.width < 40 || r.height < 40).length, fora: fotos.filter(r => r.right > innerWidth + 1).length,
              quebradas: [...pn.querySelectorAll('img')].filter(im => !im.naturalWidth).length, lado: document.documentElement.scrollWidth > innerWidth + 1, nome: a.textContent };
          }, i);
          if (r.sel !== 'true' || r.vis !== 1 || !r.mesmo) return `aba ${r.nome} não ficou sozinha na tela`;
          if (r.n < 4 || r.zero || r.fora || r.quebradas || r.lado) return `aba ${r.nome}: ${JSON.stringify(r)}`;
          if (i === 1) await p.locator('[role=tabpanel]:not([hidden])').screenshot({ path: path.join(S, `${demo}--filtro-${tipo}.jpg`), type: 'jpeg', quality: 72 });
        }
      });
      await teste(`${tipo}: tela cheia`, async () => {
        const item = p.locator('[role=tabpanel]:not([hidden]) .g-item').nth(1); await item.scrollIntoViewIfNeeded(); await item.click(); await p.waitForTimeout(600);
        let r = await p.evaluate(() => { const lb = document.querySelector('.lb'), im = lb.querySelectorAll('.lb-slide img'), v = [...im].find(i => { const r = i.getBoundingClientRect(); return r.left >= -2 && r.right <= innerWidth + 2 && r.width > 50; });
          const q = v && v.getBoundingClientRect(); return { aberto: lb.classList.contains('aberto'), n: im.length, cont: lb.querySelector('.lb-cont').textContent, cabe: !!q && q.top >= 0 && q.bottom <= innerHeight + 1, amp: q ? q.width * devicePixelRatio / v.naturalWidth : 9 }; });
        if (!r.aberto || r.n < 4 || !/^2 \/ /.test(r.cont) || !r.cabe) return 'não abriu na foto certa: ' + JSON.stringify(r);
        if (r.amp > 1.03) return 'foto ampliada na tela cheia: ' + r.amp.toFixed(2) + 'x';
        await p.screenshot({ path: path.join(S, `${demo}--telacheia-${tipo}.jpg`), type: 'jpeg', quality: 72 });
        if (tipo === 'cel') { await p.locator('.lb-trilho').evaluate(t => t.scrollBy({ left: t.clientWidth, behavior: 'instant' })); } else await p.keyboard.press('ArrowRight');
        await p.waitForTimeout(900);
        if (!/^3 \/ /.test(await p.locator('.lb-cont').textContent())) return 'não passou para a próxima foto';
        await p.keyboard.press('Escape'); await p.waitForTimeout(500);
        r = await p.evaluate(() => ({ aberto: document.querySelector('.lb').classList.contains('aberto'), trava: document.documentElement.style.overflow }));
        if (r.aberto || r.trava) return 'não fechou no Esc';
      });
      await teste(`${tipo}: Renderiza (faixa e pílula)`, async () => {
        await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
        await p.click('.rz-abrir'); if (!(await p.locator('#rz-mais').isVisible())) return 'a faixa não abriu';
        const links = await p.evaluate(() => [...document.querySelectorAll('[data-rz-garantir],[data-rz-negociar]')].map(a => decodeURIComponent(a.href)));
        if (!links.length || !links.every(l => /wa\.me\/5511988697165\?text=/.test(l) && /portfólio/.test(l))) return 'botões da oferta: ' + (links[0] || 'nenhum').slice(0, 140);
        if (!(await p.evaluate(() => /R\$ 399 no Pix ou 2x de R\$ 199/.test(document.querySelector('.rz-faixa').innerText) && /pagamento único/.test(document.querySelector('.rz-faixa').innerText) && /sem mensalidade/.test(document.querySelector('.rz-faixa').innerText)))) return 'a faixa não mostra a oferta inteira';
        await p.click('.rz-abrir'); await p.mouse.wheel(0, 1800); await p.waitForTimeout(700);
        if (!(await p.evaluate(() => document.querySelector('.rz-pilula').classList.contains('visivel')))) return 'a pílula não apareceu';
        await p.click('.rz-pilula'); if (!(await p.locator('#rz-folha').isVisible())) return 'a folha da pílula não abriu';
        const r = await p.locator('#rz-folha').boundingBox(); if (r.x < 0 || r.x + r.width > w + 1 || r.y < 0) return 'a folha sai da tela';
        await p.screenshot({ path: path.join(S, `${demo}--renderiza-${tipo}.jpg`), type: 'jpeg', quality: 72 });
        await p.click('.rz-folha-fechar');
      });
      await teste(`${tipo}: WhatsApp e Instagram da vitrine`, async () => {
        const r = await p.evaluate(() => ({ wa: [...document.querySelectorAll('[data-whatsapp]')].map(a => decodeURIComponent(a.href)), ig: [...document.querySelectorAll('[data-instagram]')].map(a => a.href), c: window.DEMO_CLIENT }));
        if (!r.wa.length || !r.wa.every(x => x === decodeURIComponent(r.c.whatsapp) && /Vi o portfólio/.test(x))) return 'mensagem: ' + (r.wa[0] || '').slice(0, 140);
        if (!r.ig.length || !r.ig.every(x => x === r.c.instagram)) return 'Instagram errado';
      });
      if (tipo === 'cel') await teste('cel: menu', async () => {
        await p.evaluate(() => scrollTo(0, 0)); await p.click('[data-menu-button]'); if (!(await p.locator('#menu-mobile').isVisible())) return 'não abriu';
        await p.screenshot({ path: path.join(S, `${demo}--menu-cel.jpg`), type: 'jpeg', quality: 72 });
        await p.click('#menu-mobile a[href^="#"] >> nth=1'); await p.waitForTimeout(500); if (!(await p.locator('#menu-mobile').isHidden())) return 'não fechou ao navegar';
      });
      if (err.length) prob.push(`${demo}/index ${tipo} (cliques): ${[...new Set(err)].join(' | ')}`);
      await p.close();
      if (!ensaio) continue;
      const e = await abrir(path.join(D, ensaio), w, h);
      await teste(`${tipo}: página do ensaio (${ensaio})`, async () => {
        const nome = ensaio.replace('.html', '');
        const r = await e.p.evaluate(() => ({ wa: [...document.querySelectorAll('main a[href*="wa.me"]:not([data-whatsapp]), .barra a')].map(a => decodeURIComponent(a.href)), pac: document.querySelectorAll('.pac').length, selo: [...document.querySelectorAll('.selo')].filter(s => s.offsetParent).length,
          locais: [...document.querySelectorAll('a[data-local]')].map(a => a.getAttribute('href')) }));
        if (r.pac < 2) return 'sem pacotes'; if (!r.selo) return 'pacotes sem o selo "valores de exemplo"';
        if (!r.wa.length || !r.wa.every(x => /Vi o portfólio .* e quero o ensaio/.test(x))) return 'mensagem do ensaio: ' + (r.wa.find(x => !/quero o ensaio/.test(x)) || '').slice(0, 140);
        if (!r.wa.some(x => /, pacote /.test(x))) return 'o botão do pacote não leva o pacote na mensagem';
        if (r.locais.some(l => !fs.existsSync(path.join(D, l.split('#')[0])))) return 'link para página que não existe: ' + r.locais.find(l => !fs.existsSync(path.join(D, l.split('#')[0])));
        if (tipo === 'cel') {
          await e.p.mouse.wheel(0, 2400); await e.p.waitForTimeout(700);
          if (!(await e.p.evaluate(() => { const b = document.querySelector('.barra'); return b && b.classList.contains('ver') && b.getBoundingClientRect().bottom <= innerHeight + 1; }))) return 'a barra de reserva não apareceu';
          const sob = await e.p.evaluate(() => { const b = document.querySelector('.barra').getBoundingClientRect(), pi = document.querySelector('.rz-pilula').getBoundingClientRect(); return pi.bottom > b.top + 1 && pi.width > 0; });
          if (sob) return 'a pílula da Renderiza fica em cima da barra';
          await e.p.screenshot({ path: path.join(S, `${demo}--barra-cel.jpg`), type: 'jpeg', quality: 72 });
        }
        await e.p.locator('.g-item').nth(0).scrollIntoViewIfNeeded(); await e.p.locator('.g-item').nth(0).click(); await e.p.waitForTimeout(500);
        if (!(await e.p.evaluate(() => document.querySelector('.lb').classList.contains('aberto')))) return 'a tela cheia não abriu';
        await e.p.click('.lb-fechar');
      });
      if (e.err.length) prob.push(`${demo}/${ensaio} ${tipo} (cliques): ${[...new Set(e.err)].join(' | ')}`);
      await e.p.close();
    }
  }
  fs.writeFileSync(path.join(S, 'problemas.txt'), prob.join('\n') || 'nenhum');
  console.log('cliques que passaram: ' + ok.join('; '));
  console.log(prob.length ? prob.join('\n') : 'nenhum problema');
  await b.close(); process.exit(prob.length ? 1 : 0);
})();
