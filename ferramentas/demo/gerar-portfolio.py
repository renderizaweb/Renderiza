# Transforma a demo de uma fotógrafa (o site e a página de Natal de gerar-fotografia.py) num PORTFÓLIO QUE VENDE:
# a vitrine (index.html: a capa e um bloco por ensaio, com o "a partir de") e uma PÁGINA DE VENDA por ensaio: a capa
# com a promessa, a nota do Google e o botão do WhatsApp; as fotos do ensaio em mosaico (cada foto inteira); o texto e
# o depoimento de quem fez AQUELE ensaio; o "quando fazer" (só quando faz sentido); 3 pacotes com o do meio em
# destaque; e a barra fixa no celular. Mesmo visual (cores e fontes do site), mesma faixa da Renderiza, mesmo rastreio
# (montar-site põe o contador em todas as páginas da pasta, para o mesmo lead, com o nome de cada página).
# O porquê e as regras: docs/nichos/fotografos.md, seção 10 (inclui a lista do que conferir antes de publicar).
#
# Uso: python3 ferramentas/demo/gerar-portfolio.py demos/<pasta> <site.html> <natal.html>
#   <site.html> e <natal.html>: as páginas de gerar-fotografia.py (as fotos saem de dentro delas). Depois que a demo
#   vira portfólio, elas ficam no git: git show <commit>:demos/<pasta>/index.html > site.html (idem natal.html).
#   demo.json -> "portfolio": {h1, frase?, local, tom ("claro" ou escuro; só para tema claro), capa ("galeria:i"),
#     ensaios: [{id, nome, chamada, fotos (["galeria:0-3,5", "pn:1"]: a primeira é a capa da página; pn = as fotos
#     da página de Natal antiga), bloco? (a foto do bloco na vitrine; senão a primeira em pé), titulo, sub, texto,
#     quando?, depo? (nome de quem avaliou; o texto tem de falar daquele ensaio), extra? {titulo, p},
#     pacotes [{nome, preco, itens, destaque?}]}]}. Os pacotes de exemplo levam o selo "valores de exemplo"
#   (some no vídeo, ?video=1).
import html, json, os, re, sys
from urllib.parse import quote

esc = lambda t: html.escape(str(t), quote=True)
SETA = '<svg aria-hidden="true"><use href="#seta"/></svg>'
WA = '<svg aria-hidden="true"><use href="#whats"/></svg>'
BRILHO = '<svg aria-hidden="true"><use href="#brilho"/></svg>'
RELOGIO = '<svg aria-hidden="true"><use href="#relogio"/></svg>'
ATUAL = ' aria-current="page"'


def pegar(rx, texto):
    m = re.search(rx, texto, re.S)
    if not m: sys.exit(f'não achei: {rx[:60]}')
    return m.group(0)


def imgs(trecho):
    out = []
    for m in re.finditer(r'<img src="([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]*)"([^>]*)>', trecho):
        pos = re.search(r'object-position:([^";]+)', m.group(5))
        out.append({'src': m.group(1), 'w': int(m.group(2)), 'h': int(m.group(3)), 'alt': html.unescape(m.group(4)),
                    'pos': pos.group(1) if pos else '50% 40%'})
    return out


def aparar(f):
    """Foto com faixa branca nas bordas (ex.: a foto em pé posta num quadrado branco): guarda a proporção da foto de
    verdade (cw x ch) e o enquadramento que esconde a faixa. Sem a faixa, a foto fica como está."""
    if 'cw' in f: return f
    f['cw'], f['ch'] = f['w'], f['h']
    try:
        import base64, io
        import numpy as np
        from PIL import Image
        im = np.asarray(Image.open(io.BytesIO(base64.b64decode(f['src'].split(',', 1)[1]))).convert('L'))
    except Exception:
        return f
    h, w = im.shape
    branca = im >= 246

    def borda(linhas):
        a, b = 0, len(linhas)
        while a < b and linhas[a]: a += 1
        while b > a and linhas[b - 1]: b -= 1
        return a, b
    x0, x1 = borda(branca.mean(axis=0) > .985); y0, y1 = borda(branca.mean(axis=1) > .985)
    if x1 - x0 < .95 * w or y1 - y0 < .95 * h:
        f['cw'], f['ch'] = (x1 - x0) * f['w'] / w, (y1 - y0) * f['h'] / h
        px = 50 if x1 - x0 == w else x0 / (w - (x1 - x0)) * 100
        py = 50 if y1 - y0 == h else y0 / (h - (y1 - y0)) * 100
        f['pos'] = f'{px:.0f}% {py:.0f}%'
    return f


def prop(f): return f['cw'] / f['ch']


def tag(f, prioridade=False):
    """A foto com a proporção dela (--a = largura/altura, sem a faixa branca): os quadros usam --a para nunca cortar."""
    carga = ' fetchpriority="high"' if prioridade else ' loading="lazy"'
    return (f'<img src="{f["src"]}" width="{f["w"]}" height="{f["h"]}" alt="{esc(f["alt"])}"{carga} '
            f'style="--a:{prop(f):.4f};object-position:{f["pos"]}">')


def nome_de(n):  # "RITA DE CASSIA" -> "Rita De Cassia" (como a pessoa escreveu, se não for quase tudo maiúscula)
    return n.title() if sum(c.isupper() for c in n) > len(n.replace(' ', '')) / 2 else n


def escuro(cor):
    c = cor.lstrip('#')
    if len(c) != 6: return False
    r, g, b = (int(c[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4


def galeria(nome, fotos):
    itens = ''.join(f'<button class="g-item" type="button" style="--a:{prop(f):.4f}" aria-label="{esc("Abrir em tela cheia: " + f["alt"])}">{tag(f)}</button>' for f in fotos)
    return f'<div class="galeria" data-nome="{esc(nome)}">{itens}</div>'


CSS = r'''
/* ---------- portfólio que vende (gerar-portfolio.py) ---------- */
.nav a[aria-current="page"],.menu-mobile a[aria-current="page"]{color:var(--acento)}
/* a capa: no celular, a foto na tela toda com o texto embaixo; no computador, o texto à esquerda e a foto inteira à direita */
.pv-hero{position:relative;overflow:hidden;background:#1d1b19;color:#fff}
.pv-hero>img{display:block}
.pv-hero-txt{position:relative;z-index:1}
.pv-hero .eyebrow{color:inherit;opacity:.85;margin-bottom:14px}
.pv-hero h1{font-size:clamp(2.3rem,4.2vw,4rem);line-height:1.02;color:inherit;max-width:16ch}
.pv-hero-sub{margin:14px 0 0;max-width:46ch;opacity:.86;font-size:1.02rem}
.pv-meta{margin:18px 0 0;font-size:.9rem;opacity:.9}
.pv-meta a{color:inherit;text-decoration:none}
.pv-meta .estrelas{color:#e8b54d;letter-spacing:1px;margin-right:6px}
.pv-meta b{font-weight:600}
.pv-acoes{display:flex;gap:14px 22px;flex-wrap:wrap;align-items:center;margin-top:26px}
.pv-link{color:inherit;font-weight:500;font-size:.92rem;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:3px;display:inline-flex;gap:8px;align-items:center}
.pv-link svg{width:16px;height:16px}
@media(max-width:860px){
.pv-hero>img{width:100%;height:auto;aspect-ratio:var(--a);max-height:66svh;object-fit:cover}
.pv-hero-txt{padding:24px 0 32px}
.pv-hero h1{font-size:clamp(2.1rem,9.4vw,2.7rem)}
.pv-acoes .botao{flex:1 1 100%}}
@media(min-width:861px){
.pv-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;background:var(--pv-hero-bg);color:var(--pv-hero-tx)}
.pv-hero>img{grid-column:2;grid-row:1;width:min(50vw,calc(86vh * var(--a)),calc(780px * var(--a)));aspect-ratio:var(--a);height:auto;object-fit:cover}
.pv-hero-txt{grid-column:1;grid-row:1;width:auto;max-width:600px;margin:0 auto;padding:56px clamp(28px,4vw,64px)}
.pv-hero .botao{background:var(--acento);border-color:var(--acento);color:#fff}}
/* blocos de ensaio (a vitrine e "outros ensaios"): a foto inteira no quadro em pé, o nome e o preço sobre ela */
.pv-bloco{padding:clamp(48px,7vw,96px) 0}
.pv-cab{display:flex;justify-content:space-between;align-items:flex-end;gap:12px 24px;flex-wrap:wrap;margin-bottom:24px}
.pv-cab h2{font-size:clamp(2rem,3.8vw,3rem)}
.pv-cab small{color:var(--tinta-2);font-size:.86rem}
.pv-exemplo{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;padding:6px 12px;border-radius:999px;background:#1f1d1b;color:#fff;font-size:.72rem;letter-spacing:.03em}
.pv-exemplo svg{width:12px;height:12px;color:#e9b8a2}
.modo-video .pv-exemplo{display:none!important}
.pv-blocos{display:grid;grid-template-columns:repeat(var(--n),minmax(0,var(--max)));gap:14px;justify-content:center}
.pv-tile{position:relative;display:block;aspect-ratio:4/5;overflow:hidden;background:#2b2a28;color:#fff;text-decoration:none}
.pv-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.pv-tile:hover img{transform:scale(1.04)}
.pv-tile::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,14,13,0) 52%,rgba(15,14,13,.78))}
.pv-tile-txt{position:absolute;inset:auto 0 0 0;z-index:1;padding:18px 18px 16px;display:flex;flex-direction:column;gap:3px}
.pv-tile-txt b{font-family:var(--serif);font-weight:500;font-size:clamp(1.3rem,1.9vw,1.75rem);line-height:1.05;overflow-wrap:anywhere;hyphens:auto}
.pv-tile-txt small{font-size:.8rem;color:#efe8e1}
.pv-tile-txt small strong{font-family:var(--serif);font-size:1.12rem;font-weight:500;color:#fff;margin-left:2px}
@media(max-width:860px){.pv-blocos{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pv-blocos--impar .pv-tile:first-child{grid-column:1/-1}
.pv-tile-txt{padding:12px}.pv-tile-txt b{font-size:1.05rem}.pv-tile-txt small{font-size:.72rem}.pv-blocos--impar .pv-tile:first-child .pv-tile-txt b{font-size:1.6rem}
.pv-outros{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.pv-outros .pv-tile{flex:0 0 44%;scroll-snap-align:start}.pv-outros.pv-blocos--impar .pv-tile:first-child{grid-column:auto}}
/* as fotos do ensaio: mosaico, cada foto inteira, tamanho de portfólio */
.pv-galeria .galeria{display:block;columns:4 210px;column-gap:12px}
.pv-galeria .g-item{display:block;width:100%;margin:0 0 12px;break-inside:avoid;position:relative;cursor:zoom-in;background:var(--areia)}
.pv-galeria .g-item::before{content:"";display:block;padding-top:calc(100% / var(--a))}
.pv-galeria .g-item img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
@media(max-width:860px){.pv-galeria .galeria{columns:2;column-gap:8px}.pv-galeria .g-item{margin-bottom:8px}}
/* sobre o ensaio */
.pv-historia{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(24px,5vw,72px);align-items:center}
.pv-historia--so{grid-template-columns:minmax(0,760px);justify-content:center}
.pv-texto{font-family:var(--serif);font-size:clamp(1.4rem,2.4vw,1.9rem);line-height:1.32;margin:0}
.pv-quando{display:flex;gap:12px;align-items:flex-start;margin:24px 0 0;padding:2px 0 2px 16px;border-left:2px solid var(--acento);color:var(--tinta-2);font-size:.95rem}
.pv-quando svg{width:18px;height:18px;flex:none;margin-top:3px;color:var(--acento)}
.pv-quando b{color:var(--tinta);font-weight:500}
.pv-depo{margin:0;padding:clamp(22px,3vw,32px);background:var(--areia);border-radius:2px}
.pv-depo blockquote{margin:0;font-size:1.02rem;line-height:1.6}
.pv-depo figcaption{margin-top:14px;font-size:.85rem;color:var(--tinta-2)}
.pv-depo figcaption b{color:var(--tinta);font-weight:500}
.pv-depo .estrelas{color:#d9a441;letter-spacing:1px;margin-right:4px}
@media(max-width:860px){.pv-historia{grid-template-columns:1fr}}
/* pacotes */
.pv-pacotes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch;padding-top:12px}
.pv-pac{position:relative;display:flex;flex-direction:column;background:var(--papel);border:1px solid var(--linha);padding:28px 24px 24px}
.pv-pac--destaque{border:2px solid var(--acento);box-shadow:0 20px 44px rgba(30,25,20,.10)}
.pv-selo{position:absolute;top:-13px;left:22px;background:var(--acento);color:#fff;font-size:.66rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;padding:6px 12px;border-radius:999px}
.pv-pac h3{font-family:var(--sans);font-size:.78rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--tinta-2)}
.pv-preco{font-family:var(--serif);font-size:clamp(2.3rem,3.6vw,2.9rem);line-height:1;margin:10px 0 2px}
.pv-pac ul{list-style:none;padding:0;margin:16px 0 22px;display:grid;gap:9px;font-size:.96rem}
.pv-pac li{display:flex;gap:10px;align-items:baseline}
.pv-pac li::before{content:"✓";color:var(--acento);font-weight:600}
.pv-pac .botao{margin-top:auto;width:100%}
.pv-pac:not(.pv-pac--destaque) .botao{background:transparent;color:var(--tinta);border-color:color-mix(in srgb,var(--tinta) 30%,transparent)}
.pv-pac:not(.pv-pac--destaque) .botao:hover{background:var(--tinta);color:var(--fundo)}
.pv-extra{margin-top:18px;padding:20px 22px;border:1px dashed var(--acento);display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}
.pv-extra b{font-family:var(--serif);font-size:1.4rem;font-weight:500}
.pv-extra p{margin:2px 0 0;color:var(--tinta-2);font-size:.95rem}
@media(max-width:860px){.pv-pacotes{grid-template-columns:1fr;gap:22px}.pv-pac--destaque{order:-1}}
.pv-fim{text-align:center;padding:clamp(48px,8vw,96px) 0;background:var(--areia)}
.pv-fim h2{font-size:clamp(2.1rem,4.4vw,3.2rem)}
.pv-fim p{color:var(--tinta-2);margin:12px auto 22px;max-width:480px}
/* barra fixa no celular, nas páginas de ensaio */
.pv-barra{position:fixed;left:0;right:0;bottom:0;z-index:65;display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--papel) 94%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid var(--linha);transform:translateY(110%);transition:transform .35s}
.pv-barra.ver{transform:none}
.pv-barra span{display:flex;flex-direction:column;line-height:1.25;font-size:.78rem;color:var(--tinta-2)}
.pv-barra span b{font-family:var(--serif);font-size:1.15rem;font-weight:500;color:var(--tinta)}
.pv-barra .botao{min-height:46px;padding:10px 18px;font-size:.86rem;flex:none}
@media(max-width:860px){.pv-barra{display:flex}.pv-tem-barra{padding-bottom:72px}.pv-tem-barra .flutuante{display:none}.pv-tem-barra .rz-pilula{bottom:84px}.pv-tem-barra .rz-folha{bottom:138px}}
.rz-folha .pv-dica-rz{background:#ffffff14;border-radius:12px;padding:10px 12px;font-size:.86rem}
'''

BARRA_JS = '''<script>(function(){var b=document.querySelector(".pv-barra"),h=document.querySelector(".pv-hero");if(!b||!h)return;
function f(){b.classList.toggle("ver",window.scrollY>h.offsetHeight*.7)}window.addEventListener("scroll",f,{passive:true});f()})();</script>'''


def gerar(pasta, site_html, natal_html):
    cfg = json.load(open(os.path.join(pasta, 'demo.json'), encoding='utf-8'))
    pf = cfg['portfolio']; slug = cfg['pasta']; base = f'/demo/{slug}'
    s = open(site_html, encoding='utf-8').read(); natal = open(natal_html, encoding='utf-8').read()
    if 'gerar-portfolio' in s or 'gerar-portfolio' in natal: sys.exit('use o site e o Natal antigos (git show), não o portfólio')

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
    # o runtime antigo: o carrossel de avaliações sem conferir se existe; a raiz da demo tirando só "/natal" do
    # endereço; e os links entre páginas que só sabiam "natal". Com uma página por ensaio, os três mudam.
    velho = ('const avaliacoes = () => $("[data-reviews]").innerHTML =', '}).join("");\n  avaliacoes();')
    if all(v in fim for v in velho):
        fim = fim.replace(velho[0], 'const avaliacoes = () => $("[data-reviews]") && ($("[data-reviews]").innerHTML =', 1).replace(velho[1], '}).join(""));\n  avaliacoes();', 1)
    velha_base = 'const base = location.pathname.replace(/\\/(index|natal)(\\.html)?$/, "").replace(/\\/$/, "");'
    if velha_base in fim: fim = fim.replace(velha_base, 'const base = location.pathname.replace(/^(\\/demo\\/[^\\/]+).*$/, "$1").replace(/\\/$/, "");')
    elif 'const base = location.pathname' in fim: sys.exit('o runtime mudou: confira a raiz da demo (const base)')
    troca_link = '(e.dataset.pagina === "natal" ? "/natal" : "")'
    if troca_link not in fim: sys.exit('o runtime mudou: confira como os links entre páginas são montados')
    fim = fim.replace(troca_link, '(e.dataset.pagina && e.dataset.pagina !== "site" && e.dataset.pagina !== "index" ? "/" + e.dataset.pagina : "")')
    fone = re.search(r'phone: "\+?(\d+)"', s).group(1)
    avals = {a['name']: a for a in (json.loads(x) for x in re.findall(r'\{"name": .*?"quote": ".*?"\}', s))}
    galerias = {}
    for m in re.finditer(r'<div class="painel[^"]*" id="painel-([a-z0-9-]+)".*?<h3 class="painel-titulo">.*?</h3>(<div class="galeria".*?</div>)</div>', s, re.S):
        galerias[m.group(1)] = imgs(m.group(2))
    galerias['pn'] = [f for f in imgs(natal) if f['w'] >= 500]  # as fotos da página de Natal antiga, na ordem

    def fotos_de(refs):
        """["natal:2-7,9", "pn:2"] -> as fotos, na ordem (a primeira é a capa)."""
        out = []
        for r in ([refs] if isinstance(refs, str) else refs):
            g, _, idx = r.partition(':'); lista = galerias.get(g) or sys.exit(f'galeria {g} não existe ({", ".join(galerias)})')
            if not idx: out += lista; continue
            for parte in idx.split(','):
                a, _, b = parte.partition('-')
                for i in range(int(a), int(b or a) + 1): out.append(lista[i])
        return [aparar(f) for f in out]

    for e in pf['ensaios']:
        e['_fotos'] = fotos_de(e['fotos'])
        if len({f['src'] for f in e['_fotos']}) != len(e['_fotos']): sys.exit(f'{e["id"]}: foto repetida na lista')
        if e.get('depo') and e['depo'] not in avals: sys.exit(f'{e["id"]}: não há avaliação de {e["depo"]}')
    curtos = [e['id'] for e in pf['ensaios'] if len(e['_fotos']) < 5]
    if curtos: sys.exit(f'ensaio com menos de 5 fotos (a capa e pelo menos 4 no mosaico): {curtos}')
    ensaios = pf['ensaios']
    local = pf.get('local', '')
    nota, total = str(cfg['google_nota']), cfg['google_total']
    nome_marca = cfg['marca']

    # cores da capa no computador: tema escuro usa o fundo dele; tema claro, o escuro neutro ou (tom claro) a areia
    if escuro(cfg['cores']['fundo']): vars_capa = '--pv-hero-bg:var(--fundo);--pv-hero-tx:var(--tinta)'
    elif pf.get('tom') == 'claro': vars_capa = '--pv-hero-bg:var(--areia);--pv-hero-tx:var(--tinta)'
    else: vars_capa = '--pv-hero-bg:#1d1b19;--pv-hero-tx:#fff'

    def wa(msg): return f'https://wa.me/{fone}?text={quote(msg)}'

    def link(nome, ancora=''):
        h = base if nome == 'index' else f'{base}/{nome}'
        return f'href="{h}{ancora}" data-local="{nome}.html{ancora}" data-pagina="{nome}"'

    curto = lambda e: e['nome'].split(' e ')[0]

    def troca(atual):
        itens = [('index', 'Início')] + [(e['id'], curto(e)) for e in ensaios]
        return ('<nav class="rz-troca" aria-label="As páginas montadas para você">'
                + ''.join(f'<a {link(n)}{ATUAL if n == atual else ""}>{esc(t)}</a>' for n, t in itens) + '</nav>')

    def rz(t, atual):
        t = re.sub(r'<nav class="rz-troca".*?</nav>', lambda _: troca(atual), t, flags=re.S)
        n = len(ensaios) + 1
        for de, para in [('O site e a página de Natal, prontos, por', f'O portfólio completo ({n} páginas: a vitrine e uma página de venda para cada ensaio), pronto, por'),
                         ('depois disso o site é 100% seu', 'depois disso o portfólio é 100% seu'),
                         ('O site e a página de Natal por', f'O portfólio completo ({n} páginas) por'),
                         ('o site fica 100% seu', 'o portfólio fica 100% seu'),
                         ('Vi o site e a página de Natal que a Renderiza montou para mim', 'Vi o portfólio que a Renderiza montou para mim'),
                         ('Vi o site do ', 'Vi o portfólio do ')]:
            t = t.replace(de, para)
        if 'class="rz-folha"' in t and 'pv-dica-rz' not in t:
            ex = (ensaios[1] if len(ensaios) > 1 else ensaios[0])['nome'].lower()
            dica = f'\n  <p class="pv-dica-rz">Perguntaram “quanto custa o {esc(ex)}?” no direct? Mande o link da página do {esc(ex)}: a cliente vê as fotos, os pacotes e já chama você no WhatsApp.</p>'
            t = re.sub(r'(<div class="rz-folha".*?</nav>)', lambda m: m.group(1) + dica, t, count=1, flags=re.S)
        return t

    def cabecalho(atual):
        itens = ([f'<a {link("index")}{ATUAL if atual == "index" else ""}>Ensaios</a>']
                 + [f'<a {link(e["id"])}{ATUAL if atual == e["id"] else ""}>{esc(curto(e))}</a>' for e in ensaios]
                 + [f'<a {link("index", "#contato")}>Contato</a>'])
        m = re.sub(r'href="[^"]*"', link('index'), marca, count=1)
        return f'''<header class="site-header">
  <div class="container topo-in">
    {m}
    <nav class="nav" aria-label="Páginas">{"".join(itens)}</nav>
    {cta}
    <button class="menu-botao" type="button" data-menu-button aria-expanded="false" aria-controls="menu-mobile" aria-label="Abrir menu"><span></span></button>
    <nav class="menu-mobile" id="menu-mobile" aria-label="Menu" hidden>{"".join(itens)}{cta.replace('topo-cta', '')}</nav>
  </div>
</header>'''

    feitas = []

    def montar(nome, titulo, descricao, corpo, barra=''):
        h = head.replace('</style>', CSS + f':root{{{vars_capa}}}\n</style>', 1)
        h = re.sub(r'<title>.*?</title>', f'<title>{esc(titulo)}</title>', h, flags=re.S)
        h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(descricao)}">', h)
        h = re.sub(r'<!-- .*? -->', f'<!-- Portfólio de {esc(nome_marca)} (demo da Renderiza): gerado por ferramentas/demo/gerar-portfolio.py. Pacotes e valores de exemplo. -->', h, count=1, flags=re.S)
        links = ''.join(f'<a {link(e["id"])}>{esc(e["nome"])}</a>' for e in ensaios)
        r = re.sub(r'<nav aria-label="Links">.*?</nav>', lambda _: f'<nav aria-label="Links">{links}<a data-whatsapp href="#">WhatsApp</a><a data-instagram href="#" target="_blank" rel="noopener noreferrer">Instagram</a></nav>', rodape, flags=re.S)
        classe = 'pagina-site pv-pagina' + (' pv-tem-barra' if barra else '')
        doc = (h + f'\n<body class="{classe}">\n' + sprite + '\n' + rz(faixa, nome) + '\n' + cabecalho(nome)
               + f'\n<main id="inicio">\n{corpo}\n</main>\n' + r + '\n' + barra + '\n' + lb + '\n' + rz(folha, nome) + rz(fim, nome)
               + (BARRA_JS if barra else '') + '</body>\n</html>\n')
        open(os.path.join(pasta, nome + '.html'), 'w', encoding='utf-8').write(doc)
        feitas.append(nome + '.html')

    def retrato(e):
        if e.get('bloco'): return fotos_de(e['bloco'])[0]
        return next((f for f in e['_fotos'] if f['ch'] >= f['cw'] * .95), e['_fotos'][0])

    def a_partir(e): return min(e['pacotes'], key=lambda p: int(re.sub(r'\D', '', p['preco']) or 0))['preco']

    def blocos(lista, outros=False):
        n = len(lista); larg = '400px' if n <= 2 else '340px' if n == 3 else '1fr'
        tiles = ''.join(f'<a class="pv-tile reveal" {link(e["id"])}>{tag(retrato(e))}<span class="pv-tile-txt"><b>{esc(e["nome"])}</b><small>a partir de <strong>{esc(a_partir(e))}</strong></small></span></a>' for e in lista)
        return f'<div class="pv-blocos{" pv-outros" if outros else ""}{" pv-blocos--impar" if n % 2 else ""}" style="--n:{n};--max:{larg}">{tiles}</div>'

    meta_google = (f'<a data-reviews-link href="#" target="_blank" rel="noopener noreferrer"><span class="estrelas" aria-hidden="true">★★★★★</span>'
                   + (f'<b>{esc(nota)}</b> no Google · {esc(total)} avaliações' if nota.startswith('5') else f'{esc(total)} avaliações no Google') + '</a>')
    exemplo = f'<p class="pv-exemplo">{BRILHO}Pacotes e valores de exemplo: você coloca os seus</p>'

    def capa_html(f, eyebrow, h1, sub, meta, acoes, rotulo):
        return f'''<section class="pv-hero" aria-labelledby="{rotulo}">
  {tag(f, True)}
  <div class="container pv-hero-txt">
    <p class="eyebrow">{eyebrow}</p>
    <h1 id="{rotulo}">{esc(h1)}</h1>
    {f'<p class="pv-hero-sub">{esc(sub)}</p>' if sub else ''}
    <p class="pv-meta">{meta}</p>
    <div class="pv-acoes">{acoes}</div>
  </div>
</section>'''

    # ---------- a vitrine ----------
    capa = fotos_de(pf['capa'])[0]
    corpo = capa_html(capa, esc(nome_marca), pf['h1'], pf.get('frase', ''), meta_google,
                      f'<a class="botao" href="#ensaios">Ver os ensaios e valores</a><a class="pv-link" data-whatsapp href="#">{WA}Chamar no WhatsApp</a>', 'titulo-site') + f'''
<section class="pv-bloco" id="ensaios" aria-labelledby="ensaios-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="ensaios-titulo">Escolha <em>o seu ensaio.</em></h2><small>Toque para ver as fotos, os pacotes e os valores</small></div>
    {exemplo}
    {blocos(ensaios)}
  </div>
</section>
{depo}
{sobre}
{contato}'''
    montar('index', f'{nome_marca} | Ensaios e valores', f'{pf["h1"]} Fotos, pacotes e valores de cada ensaio.', corpo)

    # ---------- uma página de venda por ensaio ----------
    for e in ensaios:
        fotos = e['_fotos']

        def msg(pac=None, e=e):
            return f'Olá! Vi o portfólio de {nome_marca} e quero o {e["chamada"].lower()}' + (f', pacote {pac}' if pac else '') + '. Quais datas vocês têm?'
        av = avals.get(e.get('depo'))
        depo_html = (f'<figure class="pv-depo reveal"><blockquote>“{esc(av["quote"].strip("…").strip())}”</blockquote>'
                     f'<figcaption><span class="estrelas" aria-hidden="true">★★★★★</span><b>{esc(nome_de(av["name"]))}</b>, no Google</figcaption></figure>') if av else ''
        quando = f'<p class="pv-quando">{RELOGIO}<span><b>Quando fazer.</b> {esc(e["quando"])}</span></p>' if e.get('quando') else ''
        pacotes = ''.join(f'''<article class="pv-pac{" pv-pac--destaque" if p.get("destaque") else ""}">{'<span class="pv-selo">Mais escolhido</span>' if p.get("destaque") else ''}
  <h3>{esc(p["nome"])}</h3><p class="pv-preco">{esc(p["preco"])}</p>
  <ul>{"".join(f"<li>{esc(i)}</li>" for i in p["itens"])}</ul>
  <a class="botao" href="{esc(wa(msg(p["nome"])))}" target="_blank" rel="noopener noreferrer">{WA}Quero o {esc(p["nome"])}</a></article>''' for p in e['pacotes'])
        extra = ''
        if e.get('extra'):
            x = e['extra']; pedido = wa(f'Olá! Vi o portfólio de {nome_marca} e quero saber do {x["titulo"].lower()}.')
            extra = (f'<div class="pv-extra reveal"><div><b>{esc(x["titulo"])}</b><p>{esc(x["p"])}</p></div>'
                     f'<a class="botao botao--linha" href="{esc(pedido)}" target="_blank" rel="noopener noreferrer">Quero saber</a></div>')
        meta = meta_google + f' · a partir de <b>{esc(a_partir(e))}</b>'
        acoes = f'<a class="botao" href="{esc(wa(msg()))}" target="_blank" rel="noopener noreferrer">{WA}Quero o meu ensaio</a><a class="pv-link" href="#pacotes">Ver pacotes e valores {SETA}</a>'
        outros = [o for o in ensaios if o is not e]
        corpo = capa_html(fotos[0], esc(e['chamada']) + (' · ' + esc(local) if local else ''), e['titulo'], e['sub'], meta, acoes, 'titulo-ensaio') + f'''
<section class="pv-bloco pv-galeria" aria-labelledby="fotos-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="fotos-titulo">As fotos <em>do ensaio.</em></h2><small>Toque numa foto para ver em tela cheia</small></div>
    {galeria(e["nome"], fotos[1:])}
  </div>
</section>
<section class="pv-bloco" style="padding-top:0" aria-label="Sobre o ensaio">
  <div class="container pv-historia{"" if depo_html else " pv-historia--so"}">
    <div class="reveal"><p class="eyebrow">Sobre o ensaio</p><p class="pv-texto">{esc(e["texto"])}</p>{quando}</div>
    {depo_html}
  </div>
</section>
<section class="pv-bloco secao--areia" id="pacotes" aria-labelledby="pacotes-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="pacotes-titulo">Pacotes <em>e valores.</em></h2><small>Reserve pelo WhatsApp</small></div>
    {exemplo}
    <div class="pv-pacotes">{pacotes}</div>
    {extra}
  </div>
</section>
<section class="pv-fim" aria-labelledby="fim-titulo">
  <div class="container">
    <h2 id="fim-titulo">Vamos marcar <em>o seu?</em></h2>
    <p>Chame no WhatsApp: a mensagem já vai com o ensaio escolhido.</p>
    <a class="botao" href="{esc(wa(msg()))}" target="_blank" rel="noopener noreferrer">{WA}Quero o meu ensaio</a>
  </div>
</section>''' + (f'''
<section class="pv-bloco" aria-labelledby="outros-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="outros-titulo">Outros <em>ensaios.</em></h2></div>
    {blocos(outros, True)}
  </div>
</section>''' if outros else '')
        barra = (f'<div class="pv-barra" aria-label="Reservar"><span>{esc(e["nome"])}<b>a partir de {esc(a_partir(e))}</b></span>'
                 f'<a class="botao" href="{esc(wa(msg()))}" target="_blank" rel="noopener noreferrer">{WA}Quero o meu</a></div>')
        montar(e['id'], f'{e["chamada"]} | {nome_marca}', f'{e["chamada"]} com {nome_marca}: {e["sub"]} Fotos, pacotes e valores.', corpo, barra)

    # páginas que sobraram de versões antigas (o natal.html de quem não tem Natal, ensaios que saíram) saem do ar
    for f in os.listdir(pasta):
        if f.endswith('.html') and f not in feitas: os.remove(os.path.join(pasta, f)); feitas.append(f'({f} removida)')
    print('portfólio:', ', '.join(feitas))


if __name__ == '__main__':
    if len(sys.argv) != 4: sys.exit('uso: gerar-portfolio.py demos/<pasta> <site.html> <natal.html>')
    gerar(sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3])
