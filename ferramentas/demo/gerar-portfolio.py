# Transforma a demo de uma fotógrafa (site + página de Natal, de gerar-fotografia.py) num PORTFÓLIO ONLINE de várias
# páginas: a capa com as galerias, uma página por ensaio, "Ensaios e valores" (o catálogo que substitui o PDF de
# valores e o "me chama no direct") e a página de Natal que já existia. Mesmo visual, mesma faixa da Renderiza, mesmo
# rastreio (montar-site põe o contador em todas as páginas da pasta, para o mesmo lead, com o nome de cada página).
# O posicionamento está em docs/nichos/fotografos.md ("Portfólio online").
#
# Uso: python3 ferramentas/demo/gerar-portfolio.py demos/<pasta> <site.html>
#   <site.html>: o site gerado por gerar-fotografia.py (as fotos saem de dentro dele). Depois de virar portfólio, o
#   index.html é o portfólio; o site antigo fica no git: git show <commit>:demos/<pasta>/index.html > /tmp/site.html
#   -> demos/<pasta>/index.html, <galeria>.html (uma por galeria do site), valores.html; ajusta o texto do natal.html.
#   demo.json: o mesmo da demo; "portfolio" (opcional) = {"catalogo": ["Gestante", ...]} escolhe os ensaios do catálogo.
import html, json, os, re, sys
from urllib.parse import quote

esc = lambda t: html.escape(str(t), quote=True)


def pegar(rx, texto, flags=re.S):
    m = re.search(rx, texto, flags)
    if not m: sys.exit(f'não achei no site: {rx[:60]}')
    return m.group(0)


def imgs(trecho):
    """As fotos de um trecho: src (data URI), largura, altura, alt e posição."""
    out = []
    for m in re.finditer(r'<img src="([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]*)"([^>]*)>', trecho):
        pos = re.search(r'object-position:([^";]+)', m.group(5))
        out.append({'src': m.group(1), 'w': int(m.group(2)), 'h': int(m.group(3)), 'alt': html.unescape(m.group(4)),
                    'pos': pos.group(1) if pos else '50% 40%'})
    return out


def tag(f, extra=''):
    return (f'<img src="{f["src"]}" width="{f["w"]}" height="{f["h"]}" alt="{esc(f["alt"])}" loading="lazy" '
            f'style="object-position:{f["pos"]}"{extra}>')


CSS = r'''
/* ---------- portfólio (gerar-portfolio.py) ---------- */
.nav a[aria-current="page"],.menu-mobile a[aria-current="page"]{color:var(--acento)}
.pf-topo{padding:clamp(44px,7vw,92px) 0 clamp(26px,4vw,44px);text-align:center}
.pf-topo .eyebrow{justify-content:center}
.pf-topo .eyebrow::after{content:"";width:28px;height:1px;background:currentColor;opacity:.6}
.pf-topo h1{font-size:clamp(2.5rem,6vw,4.6rem);font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:.98}
.pf-topo h1 .script{display:block;font-family:var(--script);font-weight:400;text-transform:none;letter-spacing:0;color:var(--rosa);font-size:.86em;line-height:.8}
.pf-topo h1.pf-h1-ensaio{text-transform:none;letter-spacing:-.01em;font-size:clamp(2.6rem,6vw,4.4rem)}
.pf-topo p{color:var(--tinta-2);max-width:580px;margin:18px auto 0}
.pf-topo .pf-acoes{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:26px}
.pf-faixa{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:10px}
.pf-faixa figure{margin:0;position:relative;overflow:hidden;background:var(--areia);aspect-ratio:4/5}
.pf-faixa img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pf-faixa figure:first-child{aspect-ratio:auto}
.pf-grade{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.pf-tile{position:relative;display:block;overflow:hidden;text-decoration:none;color:#fff;background:var(--areia)}
.pf-tile::before{content:"";display:block;padding-top:128%}
.pf-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.pf-tile:hover img{transform:scale(1.04)}
.pf-tile>span{position:absolute;inset:auto 0 0 0;padding:56px 16px 16px;background:linear-gradient(transparent,rgba(20,18,16,.62));display:flex;flex-direction:column;gap:4px}
.pf-tile b{font-family:var(--serif);font-weight:500;font-size:clamp(1.35rem,2.2vw,1.75rem);line-height:1.05}
.pf-tile small{font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;opacity:.92}
.pf-cartoes{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.pf-cartao{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1fr);background:var(--papel);border:1px solid var(--linha);text-decoration:none;color:inherit;overflow:hidden;min-height:260px}
.pf-cartao figure{margin:0;position:relative}
.pf-cartao figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pf-cartao div{padding:clamp(22px,3vw,34px);display:flex;flex-direction:column;justify-content:center;gap:10px}
.pf-cartao .eyebrow{margin:0}
.pf-cartao h2{font-size:clamp(1.8rem,3vw,2.4rem)}
.pf-cartao p{margin:0;color:var(--tinta-2);font-size:.98rem}
.pf-cartao .link{display:inline-flex;align-items:center;gap:8px;font-weight:500;color:var(--acento);font-size:.9rem;letter-spacing:.04em}
.pf-cartao .link svg{width:18px;height:18px}
.pf-cartao--escuro{background:var(--cafe);border-color:var(--cafe);color:#f6eee6}
.pf-cartao--escuro p{color:#e5d8cc}.pf-cartao--escuro .eyebrow,.pf-cartao--escuro .link{color:#e9b8a2}
.pf-pagina .galeria{grid-template-columns:repeat(3,minmax(0,1fr))}
.pf-info{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(24px,5vw,64px);align-items:start;margin-top:clamp(44px,6vw,76px);padding-top:clamp(36px,5vw,56px);border-top:1px solid var(--linha)}
.pf-info h2{font-size:clamp(2rem,3.4vw,2.7rem);margin-bottom:16px}
.pf-info>div>p{color:var(--tinta-2)}
.pf-ficha{background:var(--areia);padding:clamp(22px,3vw,32px)}
.pf-ficha dl{margin:0 0 22px}
.pf-ficha dl div{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--linha);align-items:baseline;flex-wrap:wrap}
.pf-ficha dt{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--tinta-2)}
.pf-ficha dd{margin:0;font-weight:500;text-align:right}
.pf-ficha .botao{width:100%}
.pf-valor dd{font-family:var(--serif);font-size:1.45rem;font-weight:500}
.pf-aqui{display:inline-flex;align-items:center;gap:6px;margin:6px 0 0;font-family:var(--sans);font-size:.68rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;background:#1f1d1b;color:#fff;border-radius:999px;padding:5px 11px;line-height:1.3}
.pf-aqui svg{width:12px;height:12px;flex:none}
.modo-video .pf-aqui,.modo-video .pf-recado{display:none!important}
.pf-recado{display:flex;gap:12px;align-items:flex-start;max-width:760px;margin:0 auto clamp(30px,4vw,44px);padding:16px 18px;background:#1f1d1b;color:#f4efe9;font-size:.92rem;line-height:1.55}
.pf-recado svg{width:18px;height:18px;flex:none;margin-top:3px;color:#e9b8a2}
.pf-recado b{color:#fff}
.pf-catalogo{display:grid;gap:clamp(34px,5vw,60px)}
.pf-item{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(22px,5vw,64px);align-items:center;padding-bottom:clamp(34px,5vw,60px);border-bottom:1px solid var(--linha)}
.pf-item:last-child{border-bottom:0;padding-bottom:0}
.pf-item:nth-child(even) figure{order:2}
.pf-item figure{margin:0;position:relative;overflow:hidden;aspect-ratio:4/5;background:var(--areia)}
.pf-item figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pf-item h2{font-size:clamp(2.1rem,3.8vw,3rem)}
.pf-item .pf-sub{font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;color:var(--acento);margin:0 0 10px}
.pf-item>div>p{color:var(--tinta-2);margin:14px 0 0}
.pf-linha{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px 16px;margin:22px 0 22px;padding:14px 0;border-top:1px solid var(--linha);border-bottom:1px solid var(--linha)}
.pf-linha span{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--tinta-2)}
.pf-linha b{font-family:var(--serif);font-weight:500;font-size:1.45rem}
.pf-item .pf-acoes{display:flex;gap:10px;flex-wrap:wrap}
.pf-passos{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;list-style:none;padding:0;margin:0;counter-reset:p}
.pf-passos li{background:var(--papel);border:1px solid var(--linha);padding:24px;counter-increment:p}
.pf-passos li::before{content:counter(p);display:block;font-family:var(--serif);font-size:2.2rem;line-height:1;color:var(--acento);margin-bottom:10px}
.pf-passos b{display:block;font-family:var(--serif);font-weight:500;font-size:1.3rem;margin-bottom:4px}
.pf-passos p{margin:0;color:var(--tinta-2);font-size:.95rem}
@media(max-width:860px){.pf-grade{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pf-cartoes{grid-template-columns:1fr}.pf-info{grid-template-columns:1fr}.pf-passos{grid-template-columns:1fr}}
@media(max-width:620px){.pf-faixa{grid-template-columns:1fr 1fr}.pf-faixa figure:first-child{grid-column:span 2;aspect-ratio:4/3}.pf-faixa figure:nth-child(n+2){aspect-ratio:4/5}
.pf-cartao{grid-template-columns:1fr}.pf-cartao figure{aspect-ratio:16/10}.pf-item{grid-template-columns:1fr}.pf-item:nth-child(even) figure{order:0}.pf-pagina .galeria{grid-template-columns:repeat(2,minmax(0,1fr))}}
'''

SETA = '<svg aria-hidden="true"><use href="#seta"/></svg>'
WA = '<svg aria-hidden="true"><use href="#whats"/></svg>'
BRILHO = '<svg aria-hidden="true"><use href="#brilho"/></svg>'


def gerar(pasta, site_html):
    cfg = json.load(open(os.path.join(pasta, 'demo.json'), encoding='utf-8'))
    slug = cfg['pasta']; base = f'/demo/{slug}'
    s = open(site_html, encoding='utf-8').read()
    if 'gerar-portfolio' in s: sys.exit('o <site.html> já é o portfólio: use o site antigo (git show)')
    natal_path = os.path.join(pasta, 'natal.html')
    natal = open(natal_path, encoding='utf-8').read()

    # ---------- as peças do site ----------
    head = pegar(r'<!doctype html>.*?</head>', s)
    sprite = pegar(r'<svg width="0" height="0".*?</svg>', s)
    faixa = pegar(r'<aside class="rz-faixa".*?</aside>', s)
    marca = pegar(r'<a class="marca".*?</a>', s)
    cta = pegar(r'<a class="botao topo-cta".*?</a>', s)
    sobre = pegar(r'<section class="secao secao--areia" id="sobre".*?</section>', s)
    depo = pegar(r'<section class="secao" id="depoimentos".*?</section>', s)
    contato = pegar(r'<section class="secao secao--areia" id="contato".*?</section>', s)
    rodape = pegar(r'<footer class="rodape">.*?</footer>\s*<a class="flutuante".*?</a>', s)
    lb = pegar(r'<div class="lb".*?lb-prox.*?</button>\s*</div>', s)
    folha = pegar(r'<button class="rz-pilula".*?<div class="rz-folha".*?</div>\s*</div>', s)
    fim = s[s.index(folha) + len(folha):s.rindex('</body>')]
    # as páginas sem avaliações (galerias, valores): o runtime antigo não confere se o carrossel existe (o novo confere)
    velho = ('const avaliacoes = () => $("[data-reviews]").innerHTML =', '}).join("");\n  avaliacoes();')
    if all(v in fim for v in velho):
        fim = fim.replace(velho[0], 'const avaliacoes = () => $("[data-reviews]") && ($("[data-reviews]").innerHTML =', 1).replace(velho[1], '}).join(""));\n  avaliacoes();', 1)
    fone = re.search(r'phone: "\+?(\d+)"', s).group(1)
    galerias = []
    for m in re.finditer(r'<div class="painel[^"]*" id="painel-([a-z0-9-]+)".*?<h3 class="painel-titulo">(.*?)</h3>(<div class="galeria".*?</div>)</div>', s, re.S):
        galerias.append({'id': m.group(1), 'nome': html.unescape(m.group(2)), 'html': m.group(3), 'fotos': imgs(m.group(3))})
    if not galerias: sys.exit('o site não tem galerias')
    abertura = imgs(pegar(r'<div class="mosaico">.*?</div>', s))
    fotos_natal = [f for f in imgs(natal) if f['w'] >= 600 and ('Natal' in f['alt'] or 'cenário' in f['alt'])]
    todas = [f for g in galerias for f in g['fotos']] + fotos_natal

    def achar(*palavras, padrao=None):
        for p in palavras:
            for f in todas:
                if p.lower() in f['alt'].lower(): return f
        return padrao or todas[0]

    # ---------- textos ----------
    st = cfg['site']; passos = st['jornada']['passos']
    passo = {p['nome'].lower(): p for p in passos}
    marca_nome = cfg['marca']; quem_a = cfg.get('quem_a', 'o estúdio')
    texto_galeria = {}
    for g in galerias:
        chave = g['nome'].split(' ')[0].lower()
        ps = [p for p in passos if p['nome'].lower() in g['nome'].lower() or p['nome'].lower().startswith(chave)]
        if g['id'] == 'familia': ps = [passo[k] for k in ('infantil', 'irmãos') if k in passo] or ps
        texto_galeria[g['id']] = ' '.join(p['p'] for p in ps) or st['hero']['intro']

    def wa(msg):
        return f'https://wa.me/{fone}?text={quote(msg)}'

    def pagina_link(nome):  # href no ar (sem .html) e o arquivo local (aberto do disco)
        return (base if nome == 'index' else f'{base}/{nome}'), f'{nome}.html'

    def a(nome, texto, ancora='', atual=False, classe=''):
        h, l = pagina_link(nome)
        cl = f' class="{classe}"' if classe else ''
        cur = ' aria-current="page"' if atual else ''
        return f'<a{cl} href="{h}{ancora}" data-local="{l}{ancora}" data-pagina="{nome}"{cur}>{texto}</a>'

    paginas_rz = [('index', 'O portfólio'), ('valores', 'Ensaios e valores'), ('natal', 'A página de Natal')]

    def troca(atual):
        return ('<nav class="rz-troca" aria-label="As páginas montadas para você">'
                + ''.join(a(n, t, atual=(n == atual)) for n, t in paginas_rz) + '</nav>')

    def rz_textos(t, atual):
        t = re.sub(r'<nav class="rz-troca".*?</nav>', lambda _: troca(atual), t, flags=re.S)
        for de, para in [('O site e a página de Natal, prontos, por', 'O portfólio completo (as galerias, os ensaios com os valores e a página de Natal), pronto, por'),
                         ('depois disso o site é 100% seu', 'depois disso o portfólio é 100% seu'),
                         ('O site e a página de Natal por', 'O portfólio completo por'),
                         ('o site fica 100% seu', 'o portfólio fica 100% seu'),
                         ('Vi o site e a página de Natal que a Renderiza montou para mim', 'Vi o portfólio que a Renderiza montou para mim'),
                         ('Vi o site do ', 'Vi o portfólio do ')]:
            t = t.replace(de, para)
        return t

    def cabecalho(atual):
        itens = [a('index', 'Portfólio', '#portfolio', atual == 'galeria'), a('valores', 'Ensaios e valores', atual=atual == 'valores'),
                 a('natal', 'Natal 2026'), a('index', 'Sobre', '#sobre'), a('index', 'Contato', '#contato')]
        m = re.sub(r'href="[^"]*"', f'href="{base}" data-local="index.html" data-pagina="index"', marca, count=1)
        return f'''<header class="site-header">
  <div class="container topo-in">
    {m}
    <nav class="nav" aria-label="Páginas">{"".join(itens)}</nav>
    {cta}
    <button class="menu-botao" type="button" data-menu-button aria-expanded="false" aria-controls="menu-mobile" aria-label="Abrir menu"><span></span></button>
    <nav class="menu-mobile" id="menu-mobile" aria-label="Menu" hidden>{"".join(itens)}{cta.replace('topo-cta', '')}</nav>
  </div>
</header>'''

    def cabeca_html(titulo, descricao):
        h = head.replace('</style>', CSS + '</style>', 1)
        h = re.sub(r'<title>.*?</title>', f'<title>{esc(titulo)}</title>', h, flags=re.S)
        h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(descricao)}">', h)
        return re.sub(r'<!-- .*? -->', f'<!-- Portfólio online de {esc(marca_nome)} (demo da Renderiza): gerado por ferramentas/demo/gerar-portfolio.py a partir do site da demo. -->', h, count=1, flags=re.S)

    def montar(nome, atual, titulo, descricao, corpo, rodape_extra=''):
        r = rodape.replace('href="#portfolio"', f'href="{base}#portfolio" data-local="index.html#portfolio"').replace('href="#sobre"', f'href="{base}#sobre" data-local="index.html#sobre"')
        doc = (cabeca_html(titulo, descricao) + f'\n<body class="pagina-site pf-pagina pf-{nome}">\n' + sprite + '\n' + rz_textos(faixa, nome)
               + '\n' + cabecalho(atual) + f'\n<main id="inicio">\n{corpo}\n</main>\n' + r + '\n' + lb + '\n' + rz_textos(folha, nome) + rz_textos(fim, nome) + '</body>\n</html>\n')
        open(os.path.join(pasta, nome + '.html'), 'w', encoding='utf-8').write(doc)
        return nome + '.html'

    def tile(nome_pag, titulo, sub, foto, natal_pag=False):
        h, l = pagina_link(nome_pag)
        return (f'<a class="pf-tile reveal" href="{h}" data-local="{l}" data-pagina="{nome_pag}">{tag(foto)}'
                f'<span><small>{esc(sub)}</small><b>{esc(titulo)}</b></span></a>')

    tiles = [(g['id'], g['nome'], f'{len(g["fotos"])} fotos', g['fotos'][0]) for g in galerias]
    if fotos_natal: tiles.append(('natal', 'Natal 2026', 'Campanha · agenda aberta', fotos_natal[0]))
    feitas = []

    # ---------- a capa (index) ----------
    hero = st['hero']; capa = (abertura + [g['fotos'][0] for g in galerias])[:3]
    faixa_fotos = ''.join('<figure>' + (tag(f).replace(' loading="lazy"', ' fetchpriority="high"') if i == 0 else tag(f)) + '</figure>' for i, f in enumerate(capa))
    especial = ' · '.join(hero.get('especialidades', [])[:6])
    f_val = achar('gestante', padrao=capa[0]); f_nat = fotos_natal[0] if fotos_natal else capa[-1]
    corpo = f'''<section class="pf-topo" aria-labelledby="titulo-site">
  <div class="container">
    <p class="eyebrow">{esc(hero["eyebrow"])}</p>
    <h1 id="titulo-site">{esc(cfg["titulo_nome"])} <span class="script">{esc(cfg["titulo_script"])}</span></h1>
    <p>{esc(especial)}</p>
  </div>
</section>
<div class="container pf-faixa">{faixa_fotos}</div>
<section class="secao" id="portfolio" aria-labelledby="portfolio-titulo">
  <div class="container">
    <div class="cabeca reveal"><p class="eyebrow">Portfólio</p><h2 id="portfolio-titulo">Escolha <em>o ensaio.</em></h2><p>Cada galeria abre numa página, com as fotos, como é o ensaio e o valor.</p></div>
    <div class="pf-grade">{"".join(tile(*t) for t in tiles)}</div>
  </div>
</section>
<section class="secao" style="padding-top:0" aria-label="Ensaios, valores e Natal">
  <div class="container pf-cartoes">
    <a class="pf-cartao reveal" href="{base}/valores" data-local="valores.html" data-pagina="valores"><figure>{tag(f_val)}</figure><div><p class="eyebrow">Ensaios e valores</p><h2>Todos os ensaios, <em>num lugar só.</em></h2><p>O que é cada ensaio, como funciona e quanto custa, sem precisar perguntar no direct.</p><span class="link">Ver os ensaios e valores {SETA}</span></div></a>
    <a class="pf-cartao pf-cartao--escuro reveal" href="{base}/natal" data-local="natal.html" data-pagina="natal"><figure>{tag(f_nat)}</figure><div><p class="eyebrow">Promoção · Natal 2026</p><h2>O Natal é feito <em>de encontros.</em></h2><p>Os cenários deste ano e os horários livres.</p><span class="link">Ver o Natal 2026 {SETA}</span></div></a>
  </div>
</section>
{sobre}
{depo}
{contato}'''
    feitas.append(montar('index', 'index', f'{marca_nome} | Portfólio', f'Portfólio de {marca_nome}: {especial}.', corpo))

    # ---------- uma página por galeria ----------
    for g in galerias:
        outros = [t for t in tiles if t[0] != g['id']]
        msg = f'Olá! Vi o portfólio de {marca_nome} e quero saber do ensaio {g["nome"].lower()}: valores e datas.'
        corpo = f'''<section class="pf-topo" aria-labelledby="titulo-ensaio">
  <div class="container">
    <p class="eyebrow">Portfólio</p>
    <h1 class="pf-h1-ensaio" id="titulo-ensaio">{esc(g["nome"])}</h1>
    <p>{esc(texto_galeria[g["id"]])}</p>
  </div>
</section>
<section class="secao" style="padding-top:0" aria-label="Fotos do ensaio {esc(g["nome"])}">
  <div class="container">
    {g["html"].replace('class="galeria"', 'class="galeria" data-nome="' + esc(g["nome"]) + '"', 1) if 'data-nome' not in g["html"] else g["html"]}
    <p class="galeria-nota">Toque numa foto para ver em tela cheia.</p>
    <div class="pf-info">
      <div class="reveal"><p class="eyebrow">Sobre o ensaio</p><h2>{esc(g["nome"])} <em>com {esc(quem_a)}.</em></h2><p>{esc(texto_galeria[g["id"]])}</p><p>{esc(st["contato"]["p"])}</p></div>
      <aside class="pf-ficha reveal" aria-label="Valor e agenda">
        <dl><div><dt>Ensaio</dt><dd>{esc(g["nome"])}</dd></div><div><dt>No portfólio</dt><dd>{len(g["fotos"])} fotos</dd></div>
        <div class="pf-valor"><dt>Valor</dt><dd>sob consulta<br><span class="pf-aqui">{BRILHO}aqui entra o seu valor</span></dd></div></dl>
        <a class="botao" href="{esc(wa(msg))}" target="_blank" rel="noopener noreferrer">{WA}Quero este ensaio</a>
      </aside>
    </div>
  </div>
</section>
<section class="secao secao--areia" aria-labelledby="outros-titulo">
  <div class="container">
    <div class="cabeca reveal"><p class="eyebrow">Portfólio</p><h2 id="outros-titulo">Outros <em>ensaios.</em></h2></div>
    <div class="pf-grade">{"".join(tile(*t) for t in outros)}</div>
  </div>
</section>'''
        feitas.append(montar(g['id'], 'galeria', f'{g["nome"]} | {marca_nome}', f'Ensaio {g["nome"].lower()} de {marca_nome}: fotos, como é e o valor.', corpo))

    # ---------- ensaios e valores (o catálogo) ----------
    escolha = (cfg.get('portfolio') or {}).get('catalogo') or [p['nome'] for p in passos]
    pagina_do_passo = {'gestante': 'gestante', 'newborn': 'newborn', 'acompanhamento': 'newborn', 'infantil': 'familia', 'irmãos': 'familia', 'família': 'familia', 'natal': 'natal'}
    busca = {'gestante': ('gestante',), 'newborn': ('recém', 'newborn'), 'acompanhamento': ('barquinho', 'bebê'), 'infantil': ('patinhos', 'menina'),
             'irmãos': ('irm', 'menino'), 'natal': ('árvore', 'natal')}
    itens = []
    for nome in escolha:
        p = passo.get(nome.lower())
        if not p: continue
        k = nome.lower(); foto = achar(*busca.get(k, (k,)))
        pag = pagina_do_passo.get(k)
        ver = a(pag, f'Ver as fotos {SETA}', classe='botao botao--linha') if pag and (pag == 'natal' or any(g['id'] == pag for g in galerias)) else ''
        msg = f'Olá! Vi o portfólio de {marca_nome} e quero saber do ensaio {nome.lower()}: valores e datas.'
        itens.append(f'''<article class="pf-item reveal"><figure>{tag(foto)}</figure><div>
  <p class="pf-sub">{esc(p["sub"])}</p><h2>{esc(nome)}</h2><p>{esc(p["p"])}</p>
  <div class="pf-linha"><span>Valor</span><b>sob consulta</b><span class="pf-aqui">{BRILHO}aqui entra o seu valor e o que inclui</span></div>
  <div class="pf-acoes"><a class="botao" href="{esc(wa(msg))}" target="_blank" rel="noopener noreferrer">{WA}Quero este ensaio</a>{ver}</div>
</div></article>''')
    corpo = f'''<section class="pf-topo" aria-labelledby="titulo-valores">
  <div class="container">
    <p class="eyebrow">Ensaios e valores</p>
    <h1 class="pf-h1-ensaio" id="titulo-valores">Os ensaios <em>de {esc(cfg["titulo_nome"])}.</em></h1>
    <p>Como é cada ensaio e quanto custa. Escolheu? É só chamar no WhatsApp para ver as datas.</p>
  </div>
</section>
<section class="secao" style="padding-top:0" aria-label="Catálogo de ensaios">
  <div class="container">
    <p class="pf-recado">{BRILHO}<span><b>Recado da Renderiza:</b> aqui entram os seus valores e pacotes, como numa tabela de preços, só que sempre atualizada. Mande a que você já usa (PDF, print ou texto) e a gente monta. Mudou o preço ou abriu promoção? É só pedir.</span></p>
    <div class="pf-catalogo">{"".join(itens)}</div>
  </div>
</section>
<section class="secao secao--areia" aria-labelledby="como-titulo">
  <div class="container">
    <div class="cabeca reveal"><p class="eyebrow">Como funciona</p><h2 id="como-titulo">Do primeiro oi <em>ao ensaio.</em></h2></div>
    <ol class="pf-passos reveal"><li><b>Escolha o ensaio</b><p>Veja as fotos e os valores aqui no portfólio.</p></li><li><b>Chame no WhatsApp</b><p>Para ver as datas livres e tirar as dúvidas.</p></li><li><b>Dia do ensaio</b><p>{esc(st["contato"]["p"].split(". ")[-1].rstrip("."))}.</p></li></ol>
  </div>
</section>'''
    feitas.append(montar('valores', 'valores', f'Ensaios e valores | {marca_nome}', f'Os ensaios de {marca_nome} e os valores.', corpo))

    # ---------- natal.html: o mesmo texto do portfólio ----------
    n = rz_textos(natal, 'natal')
    n = n.replace(f'>O site do {cfg["titulo_nome"]}<', '>O portfólio<').replace(f'>O site de {cfg["titulo_nome"]}<', '>O portfólio<')
    n = re.sub(r'>O site d[aoe] [^<]{2,60}</a>', '>O portfólio</a>', n)
    open(natal_path, 'w', encoding='utf-8').write(n)
    feitas.append('natal.html (textos)')
    print('portfólio:', ', '.join(feitas))


if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit(__doc__ or 'uso: gerar-portfolio.py demos/<pasta> <site.html>')
    gerar(sys.argv[1].rstrip('/'), sys.argv[2])
