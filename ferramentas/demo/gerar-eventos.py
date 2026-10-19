# Gera a demo de um salão de festas, espaço de eventos ou chácara (arquivo HTML único) a partir de um JSON.
# Usa a linha comum das óticas (gerar.py: topo, história, carrosséis, passos, avaliações, Instagram e mapa) e
# acrescenta duas seções do nicho (docs/nichos/eventos.md):
#   "estrutura": {"eyebrow", "h2", "p", "itens": [[icone, texto], ...]}   o que o lugar tem, só o confirmado.
#       ícones: piscina, churrasqueira, cozinha, salao, jardim, estacionamento, brinquedos, ar, som, pessoas,
#       quartos, coberto, lago, campo, bar, cerimonia, mesa (outro nome: estrela)
#   "consulta": {"h2", "p", "tipos": [...], "mensagem_inicio"}   consultar uma data: dia, tipo de festa e
#       convidados abrem o WhatsApp do lugar com a mensagem pronta (sem preço, sem promessa).
#   "estilo": "gala" (opcional): visual elegante de revista para casamento, 15 anos e formatura (ver GALA abaixo).
# O resto do JSON é o do gerar.py ("estilos": null, carrosséis com ids próprios, ex.: "espaco" e "festas").
# Uso: python3 gerar-eventos.py demos/<pasta>/demo.json   ->  demos/<pasta>/index.html e ficha.md
#   Depois: node validar.mjs <index.html absoluto> <pasta_capturas>
import html, json, os, re, sys, urllib.parse
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import importlib.util
_spec = importlib.util.spec_from_file_location('gerar_base', os.path.join(AQUI, 'gerar.py'))
G = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(G)
esc = lambda t: html.escape(str(t), quote=True)

ICONES = {
    'piscina': '<path d="M3 17c2 0 2-1.5 4.5-1.5S9.5 17 12 17s2-1.5 4.5-1.5S18.5 17 21 17M3 20.5c2 0 2-1.5 4.5-1.5s2 1.5 4.5 1.5 2-1.5 4.5-1.5 2 1.5 4.5 1.5M8 14V5.5a2 2 0 0 1 4 0M16 14V5.5a2 2 0 0 0-4 0M8 8.5h8M8 11.5h8"/>',
    'churrasqueira': '<path d="M4 10h16a8 8 0 0 1-16 0ZM8 17l-2 4M16 17l2 4M9 3c1 1 1 2 0 3M12 2c1 1 1 2.5 0 4M15 3c1 1 1 2 0 3"/>',
    'cozinha': '<path d="M4 9h16v11H4zM4 13h16M8 5v4M12 5v4M16 5v4M8 16.5h2"/>',
    'salao': '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
    'jardim': '<path d="M12 21v-8M12 13c-4 0-6-3-6-7 4 0 6 3 6 7ZM12 13c4 0 6-3 6-7-4 0-6 3-6 7ZM5 21h14"/>',
    'estacionamento': '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M10 16.5v-9h3a3 3 0 0 1 0 6h-3"/>',
    'brinquedos': '<path d="M5 20 12 4l7 16M8 13h8M3 20h18"/>',
    'ar': '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
    'som': '<path d="M4 9v6h4l5 4V5L8 9H4ZM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    'pessoas': '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.5M18 20a6 6 0 0 0-3-5.2"/>',
    'quartos': '<path d="M3 19V7M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-8v6M7 11.5a1.5 1.5 0 1 0 0-.1"/>',
    'coberto': '<path d="M2 11 12 4l10 7M5 10v10h14V10M9 20v-5h6v5"/>',
    'lago': '<path d="M3 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2M3 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 3 2M8 10l4-6 4 6"/>',
    'campo': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M3 9.5h3v5H3M21 9.5h-3v5h3"/><circle cx="12" cy="12" r="2.5"/>',
    'bar': '<path d="M6 4h12l-6 8-6-8ZM12 12v7M8 20h8"/>',
    'cerimonia': '<path d="M12 21V8M7 21h10M12 8c-3 0-5-2-5-4.5C9 3.5 12 5 12 8Zm0 0c3 0 5-2 5-4.5C15 3.5 12 5 12 8Z"/>',
    'mesa': '<path d="M3 9h18l-2-4H5L3 9ZM6 9v11M18 9v11M6 14h12"/>',
    'estrela': '<path d="M12 3.5l2.4 5 5.4.7-4 3.8 1 5.4L12 15.8 7.2 18.4l1-5.4-4-3.8 5.4-.7Z"/>',
}
CSS = (
    '.estrutura-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}'
    '.estrutura-grid li{display:flex;align-items:center;gap:14px;padding:18px 20px;background:var(--paper);border:1px solid var(--line);border-radius:18px;line-height:1.35}'
    '.estrutura-grid svg{flex:0 0 34px;width:34px;height:34px;fill:none;stroke:var(--orange-deep);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}'
    '.estrutura-grid strong{font-weight:700;color:var(--ink)}'
    '.estrutura-grid--3{grid-template-columns:repeat(3,1fr)}'
    '@media(max-width:980px){.estrutura-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.estrutura-grid{grid-template-columns:1fr}}'
    '.consulta-section{background:var(--sage)}.consulta-copy h2{margin-bottom:20px}'
    '.consulta-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}.consulta-copy p{color:var(--muted);max-width:470px}'
    '.consulta-form{display:grid;gap:16px;background:var(--green);color:#fff;border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.18)}'
    '.consulta-form label{display:grid;gap:8px;font-weight:700;font-size:.9375rem}'
    '.consulta-form input,.consulta-form select{font:inherit;font-weight:500;min-height:52px;padding:12px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.28);background:#fff;color:var(--ink);width:100%}'
    '.consulta-form .button{width:100%;margin-top:4px}.consulta-form small{color:rgba(255,255,255,.7);line-height:1.45}'
    '@media(max-width:860px){.consulta-grid{grid-template-columns:1fr;gap:28px}.consulta-form{padding:22px}}'
    # a foto do topo respira (zoom lento): no vídeo, a primeira frase já não fica sobre uma tela parada
    '@keyframes ev-kb{from{transform:scale(1.01)}to{transform:scale(1.12) translate(-1.2%,-.8%)}}'
    '.hero-photo>img{animation:ev-kb 18s ease-in-out infinite alternate;transform-origin:50% 40%}'
    '@media(prefers-reduced-motion:reduce){.hero-photo>img{animation:none}}'
)

# "estilo": "gala" (pedido do Kaue, 16/10/2026: demo "mais gourmetizada" para casamento, 15 anos, formatura): visual de
# revista, com a foto do topo em tela cheia, serifa fina (Cormorant Garamond) e texto em Jost, fios dourados, cantos
# retos, galerias amplas e a consulta de data em fundo escuro. Mesmo conteúdo e mesmas seções da demo comum.
FONTES_GALA = ('<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;'
               '1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">')
GALA = (
    ':root{--display:"Cormorant Garamond",Georgia,serif;--texto:"Jost",system-ui,sans-serif;--paper:#faf7f2;--cream:#f4eee5;--sage:#f2ece3;--sage-2:#e4dacb;--line:#e8dfd1;--muted:#6c645a}'
    'body{font-family:var(--texto);font-weight:400}'
    'h1,h2,h3{font-family:var(--display);font-weight:500;letter-spacing:-.005em;line-height:1.02}'
    'h1 em,h2 em{font-style:italic;font-weight:500;background:none;padding:0;color:var(--orange-deep)}'
    'h2{font-size:clamp(2.5rem,4.6vw,3.8rem)}'
    '.eyebrow{font-family:var(--texto);font-weight:500;letter-spacing:.3em;font-size:.7rem}'
    '.section-heading{display:block;text-align:center;max-width:780px;margin:0 auto 54px}.section-heading>p{margin:18px auto 0;max-width:560px}'
    '.section-heading .eyebrow{display:inline-flex;align-items:center;gap:14px}'
    '.section-heading .eyebrow::before,.section-heading .eyebrow::after{content:"";width:34px;height:1px;background:currentColor;opacity:.55}'
    '.topline{font-size:.66rem;letter-spacing:.22em;text-transform:uppercase}'
    '.site-header{background:rgba(250,247,242,.94)}'
    '.site-header .logo-text b{font-family:var(--display);font-weight:600;font-size:1.5rem;letter-spacing:.01em;text-transform:none}'
    '.site-header .logo-text small{letter-spacing:.24em;font-weight:500}'
    '.logo-mark{border-radius:50%}'
    '.desktop-nav{gap:22px}.desktop-nav a{font-weight:500;letter-spacing:.14em;text-transform:uppercase;font-size:.66rem;white-space:nowrap}'
    '.header-cta{white-space:nowrap;padding-inline:20px}'
    '.desktop-nav a::after{height:1px;bottom:-7px;background:var(--orange-deep)}'
    '.button{border-radius:2px;letter-spacing:.16em;text-transform:uppercase;font-size:.74rem;font-weight:500;min-height:54px;padding:16px 28px}'
    '.button:hover{transform:none}'
    '.text-link{letter-spacing:.14em;text-transform:uppercase;font-size:.74rem;font-weight:500}'
    # topo em tela cheia
    '.hero{min-height:min(94vh,900px);display:flex;flex-direction:column;justify-content:flex-end;background:#120f0c}'
    '.hero::before{display:none}'
    '.hero::after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(70% 46% at 50% 62%,rgba(12,10,8,.5),transparent 72%),linear-gradient(180deg,rgba(12,10,8,.5) 0%,rgba(12,10,8,.22) 28%,rgba(12,10,8,.55) 58%,rgba(12,10,8,.92) 100%)}'
    '.hero-copy{text-shadow:0 2px 22px rgba(0,0,0,.45)}.hero-copy .button,.hero-copy .proof-badge{text-shadow:none}'
    '.hero .hero-visual{position:absolute;inset:0;width:auto;padding:0;z-index:-2;align-self:auto}'
    '.hero .hero-photo{position:absolute;inset:0;border:0;border-radius:0;transform:none;box-shadow:none;background:#120f0c}'
    '.hero .hero-photo>img{height:100%;width:100%}'
    '.hero .address-tag{display:none}'
    '.hero .hero-grid{display:block;min-height:0;padding-block:190px 44px}'
    '.hero-copy{max-width:780px;margin-inline:auto;text-align:center}'
    '.hero .eyebrow{justify-content:center;letter-spacing:.3em;text-transform:uppercase;font-size:.7rem;color:#f0e5d1}'
    '.hero .eyebrow .small-line{display:none}'
    '.hero h1{font-size:clamp(3.4rem,7.2vw,6.2rem);font-weight:400;max-width:none;line-height:.96;color:#fff}'
    '.hero h1 em{display:block;color:var(--mustard)}'
    '.hero-intro{margin:26px auto 0;color:#eee5d6;font-size:1.125rem;font-weight:300;max-width:580px}'
    '.hero-actions,.hero-proof{justify-content:center}'
    '.proof-badge{border-radius:2px}'
    '.hero-bottom{border-top-color:#ffffff2e;color:#dcd2c1;letter-spacing:.04em}'
    # faixa
    '.marquee{background:var(--green);color:#efe6d6}'
    '.marquee-group{font-family:var(--display);font-style:italic;font-weight:500;text-transform:none;letter-spacing:.01em;font-size:1.35rem;padding-block:20px}'
    '.marquee-group i{color:var(--mustard);font-size:.65rem}'
    # sobre e quem recebe
    '.story-section{background:var(--paper)}'
    '.story-photos::before{content:"";position:absolute;left:-18px;top:-18px;width:62%;height:72%;border:1px solid var(--orange-deep);opacity:.45}'
    '.story-main,.experience-main{position:relative;border-radius:0!important}'
    '.polaroid{border:0;padding:8px 8px 0;background:#fff;box-shadow:0 24px 50px rgba(20,16,10,.16)}'
    '.story-polaroid,.experience-polaroid{transform:none}'
    '.polaroid figcaption{font-family:var(--display);font-style:italic;font-weight:500;font-size:1.05rem;letter-spacing:0}'
    '.stat{background:transparent;border-radius:0;border-top:1px solid var(--line);padding:18px 0 0}'
    '.stat strong{font-family:var(--display);font-weight:500;font-size:2.5rem;letter-spacing:0;color:var(--orange-deep)}'
    '.experience-section{background:var(--cream)}'
    # galerias
    '.gallery-card,.vitrine-card{border-radius:2px;box-shadow:none;border:0}'
    '.gallery-card figcaption,.vitrine-card figcaption{left:0;right:0;bottom:0;border-radius:0;background:linear-gradient(transparent,rgba(10,8,6,.72));color:#fff;padding:30px 16px 14px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;font-size:.66rem}'
    '.carousel-dots button[aria-current="true"]::after{background:var(--orange-deep)}'
    # estrutura
    '.estrutura-grid{gap:0 28px}'
    '.estrutura-grid li{background:transparent;border:0;border-top:1px solid var(--line);border-radius:0;padding:22px 2px;flex-direction:column;align-items:flex-start;gap:12px}'
    '.estrutura-grid svg{stroke-width:1.2;width:30px;height:30px;flex-basis:30px}'
    '.estrutura-grid strong{font-weight:500;font-size:1.0625rem}'
    # avaliações
    '.reviews-section::before{display:none}'
    '.review-card{border-radius:2px;background:#fffdf9}'
    '.review-card blockquote{font-family:var(--display);font-style:italic;font-size:1.4rem;font-weight:500;line-height:1.32}'
    '.review-card blockquote.is-long{font-size:1.2rem;line-height:1.38}'
    '.review-tag{border-radius:2px;letter-spacing:.14em;text-transform:uppercase;font-weight:500}'
    '.review-avatar{background:transparent;border:1px solid var(--orange-deep);color:var(--orange-deep);font-weight:600}'
    '.google-score>strong{font-weight:500;letter-spacing:0}'
    # consulta de data em fundo escuro
    '.consulta-section{background:var(--green);color:#f3ece0}'
    '.consulta-copy h2{color:#fff}.consulta-copy h2 em{color:var(--mustard)}.consulta-copy p{color:#d9d0c1}'
    '.consulta-section .eyebrow{color:var(--mustard)}'
    '.consulta-form{background:#fffdf9;color:var(--ink);border-radius:2px;box-shadow:none}'
    '.consulta-form input,.consulta-form select{border-radius:2px;border:1px solid var(--sage-2)}'
    '.consulta-form small{color:var(--muted)}'
    # instagram, visita e rodapé
    '.insta-photo{border-radius:2px;transform:none;border:0}.insta-chip{border-radius:2px}'
    '.visit-section{background:var(--paper)}.map-card{border-radius:2px;border:0}.visit-note,.visit-status{border-radius:2px}'
    '.footer-slogan{font-family:var(--display);font-style:italic;font-weight:500;font-size:1.6rem}'
    '@media(max-width:620px){'
    '.hero{min-height:88svh}.hero .hero-grid{padding-block:150px 30px}'
    '.topline .container>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.12em}'
    '.hero h1{font-size:clamp(2.7rem,12.5vw,3.5rem)}.hero-intro{font-size:1rem}'
    '.story-photos::before{left:-10px;top:-10px}'
    '.section-heading{margin-bottom:34px}.section-heading .eyebrow::before,.section-heading .eyebrow::after{width:20px}'
    '.marquee-group{font-size:1.1rem;padding-block:16px}'
    '.site-header .logo-text b{font-size:1.2rem}'
    '.review-card blockquote{font-size:1.25rem}}'
)

def estrutura_html(e):
    col = ' estrutura-grid--3' if len(e['itens']) % 4 and len(e['itens']) % 3 == 0 else ''
    itens = ''.join(f'<li><svg viewBox="0 0 24 24" aria-hidden="true">{ICONES.get(ic, ICONES["estrela"])}</svg><strong>{esc(t)}</strong></li>' for ic, t in e['itens'])
    return f'''
    <section class="section estrutura-section" id="estrutura" aria-labelledby="estrutura-heading">
      <div class="container">
        <div class="section-heading reveal">
          <div><p class="eyebrow">{esc(e.get("eyebrow", "Estrutura"))}</p><h2 id="estrutura-heading">{e["h2"]}</h2></div>
          <p>{esc(e["p"])}</p>
        </div>
        <ul class="estrutura-grid{col} reveal" aria-label="O que o espaço oferece">{itens}</ul>
      </div>
    </section>'''

def consulta_html(c, whatsapp, marca):
    tipos = ''.join(f'<option>{esc(t)}</option>' for t in c['tipos'])
    inicio = c.get('mensagem_inicio', f'Olá! Vim pelo site da {marca} e queria consultar uma data.')
    return f'''
    <section class="section consulta-section" id="consulta" aria-labelledby="consulta-heading">
      <div class="container consulta-grid">
        <div class="consulta-copy reveal">
          <p class="eyebrow">Consultar uma data</p>
          <h2 id="consulta-heading">{c["h2"]}</h2>
          <p>{esc(c["p"])}</p>
        </div>
        <form class="consulta-form reveal" data-consulta novalidate>
          <label>Data da festa<input type="date" name="data" required></label>
          <label>Tipo de festa<select name="tipo">{tipos}</select></label>
          <label>Convidados (aproximado)<input type="number" name="convidados" min="10" max="2000" step="10" inputmode="numeric" placeholder="ex.: 80"></label>
          <button class="button button--mustard" type="submit"><svg aria-hidden="true"><use href="#whats"/></svg>Consultar no WhatsApp</button>
          <small>A mensagem já vai pronta com o dia, o tipo de festa e o número de convidados.</small>
        </form>
      </div>
    </section>
    <script>
(function () {{
  var f = document.querySelector("[data-consulta]"); if (!f) return;
  var hoje = new Date(); f.data.min = hoje.toISOString().slice(0, 10);
  f.addEventListener("submit", function (ev) {{
    ev.preventDefault();
    var msg = {json.dumps(inicio, ensure_ascii=False)};
    if (f.data.value) {{ var p = f.data.value.split("-"); msg += " Dia: " + p[2] + "/" + p[1] + "/" + p[0] + "."; }}
    if (f.tipo.value) msg += " Festa: " + f.tipo.value + ".";
    if (f.convidados.value) msg += " Cerca de " + f.convidados.value + " convidados.";
    window.open("https://wa.me/{whatsapp}?text=" + encodeURIComponent(msg), "_blank", "noopener");
  }});
}})();
    </script>'''

def gerar(caminho):
    cfg = json.load(open(caminho, encoding='utf-8'))
    cfg.setdefault('estilos', None)
    gala = cfg.get('estilo') == 'gala'
    cfg['css_extra'] = CSS + (GALA if gala else '') + cfg.get('css_extra', '')
    tmp = caminho + '.tmp.json'
    json.dump(cfg, open(tmp, 'w', encoding='utf-8'), ensure_ascii=False)
    try: saida = G.gerar(tmp)
    finally: os.remove(tmp)
    doc = open(saida, encoding='utf-8').read()
    if gala:
        assert '</head>' in doc; doc = doc.replace('</head>', '  ' + FONTES_GALA + '\n</head>', 1)
    if cfg.get('estrutura'):
        alvo = '\n    <section class="section experience-section" id="atendimento"'
        assert alvo in doc; doc = doc.replace(alvo, estrutura_html(cfg['estrutura']) + '\n' + alvo, 1)
    if cfg.get('consulta'):
        alvo = '\n    <section class="section insta-section" id="instagram"'
        assert alvo in doc; doc = doc.replace(alvo, consulta_html(cfg['consulta'], cfg['whatsapp'], cfg['marca']) + '\n' + alvo, 1)
    open(saida, 'w', encoding='utf-8').write(doc)
    fic = os.path.join(os.path.dirname(saida), 'ficha.md')
    if os.path.exists(fic):
        s = open(fic, encoding='utf-8').read().replace('ferramentas/demo/gerar.py', 'ferramentas/demo/gerar-eventos.py')
        open(fic, 'w', encoding='utf-8').write(s)
    print(f'{saida}: {len(doc) // 1024} KB (com estrutura e consulta de data)')
    return saida

if __name__ == '__main__':
    gerar(sys.argv[1])
