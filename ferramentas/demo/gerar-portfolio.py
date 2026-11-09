# Transforma a demo de uma fotógrafa (o site e a página de Natal de gerar-fotografia.py) num PORTFÓLIO QUE VENDE:
# a vitrine (index.html: cada ensaio com foto, frase e "a partir de") e uma PÁGINA DE VENDA por ensaio, no formato das
# páginas de campanha que funcionam no mercado: foto grande com a promessa e a prova (nota do Google), as fotos do
# ensaio num carrossel, o depoimento de quem fez, o "quando fazer" (a urgência honesta), 3 pacotes com o do meio em
# destaque e uma barra fixa no celular com o botão do WhatsApp. Mesmo visual, mesma faixa da Renderiza, mesmo rastreio
# (montar-site põe o contador em todas as páginas da pasta, para o mesmo lead, com o nome de cada página).
# O porquê: docs/nichos/fotografos.md, seção 10.
#
# Uso: python3 ferramentas/demo/gerar-portfolio.py demos/<pasta> <site.html> <natal.html>
#   <site.html> e <natal.html>: as páginas de gerar-fotografia.py (as fotos saem de dentro delas). Depois que a demo
#   vira portfólio, elas ficam no git: git show <commit>:demos/<pasta>/index.html > site.html (idem natal.html).
#   demo.json -> "portfolio": {h1, frase?, local, tom ("claro" ou escuro), vitrine ("grade" ou lista), capa?,
#   ensaios: [{id, fotos (["galeria:0-3,5", "pn:1"]: a primeira é a capa; pn = as fotos da página de Natal antiga), nome, chamada, titulo,
#   sub, texto, selos [3], quando, depo (nome de quem avaliou), extra {titulo, p}?, pacotes [{nome, preco, itens,
#   destaque?}]}]}. Os pacotes de exemplo levam o selo "valores de exemplo" (some no vídeo, ?video=1).
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


def tag(f, prioridade=False):
    carga = ' fetchpriority="high"' if prioridade else ' loading="lazy"'
    return f'<img src="{f["src"]}" width="{f["w"]}" height="{f["h"]}" alt="{esc(f["alt"])}"{carga} style="object-position:{f["pos"]}">'


def nome_de(n):  # "RITA DE CASSIA" / "lilian CAMPOS" -> "Rita De Cassia" / "Lilian Campos" (como a pessoa escreveu, se não for quase tudo maiúscula)
    return n.title() if sum(c.isupper() for c in n) > len(n.replace(' ', '')) / 2 else n


def trilho(conteudo, rotulo):
    """Um carrossel (fotos do ensaio, outros ensaios) com as setas para quem usa mouse; no celular, é só passar o dedo."""
    return (f'<div class="pv-trilho">{conteudo}<button class="pv-seta pv-seta--ant" type="button" aria-label="{esc(rotulo)}: voltar" hidden>{SETA}</button>'
            f'<button class="pv-seta pv-seta--prox" type="button" aria-label="{esc(rotulo)}: avançar" hidden>{SETA}</button></div>')


def galeria(nome, fotos):
    itens = ''.join(f'<button class="g-item g-{"l" if f["w"] > f["h"] else "p"}" type="button" style="--a:{f["w"] / f["h"]:.4f}" aria-label="{esc("Abrir em tela cheia: " + f["alt"])}">{tag(f)}</button>' for f in fotos)
    return f'<div class="galeria" data-nome="{esc(nome)}">{itens}</div>'


CSS = r'''
/* ---------- portfólio que vende (gerar-portfolio.py) ---------- */
.nav a[aria-current="page"],.menu-mobile a[aria-current="page"]{color:var(--acento)}
.pv-hero{position:relative;min-height:min(86vh,760px);display:flex;align-items:flex-end;color:#fff;overflow:hidden;background:#2b2a28}
.pv-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pv-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,14,13,0) 28%,rgba(15,14,13,.74))}
.pv-hero .container{position:relative;z-index:1;padding:90px 0 clamp(30px,6vw,64px)}
.pv-hero .eyebrow{color:#fff;margin-bottom:14px}
.pv-hero h1{font-size:clamp(2.5rem,6.6vw,4.9rem);line-height:1;max-width:15ch;color:#fff}
.pv-hero p{max-width:520px;margin:14px 0 0;color:#f3eee9;font-size:1.02rem}
.pv-prova{display:inline-flex;gap:8px;align-items:center;margin-top:18px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-size:.86rem;color:#fff;text-decoration:none}
.pv-prova .estrelas{color:#f6c56e;letter-spacing:1px}
.pv-acoes{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.pv-acoes .botao--vidro{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.65)}
.pv-acoes .botao--vidro:hover{background:#fff;color:var(--tinta)}
.pv-selos{display:flex;gap:8px;list-style:none;margin:0;padding:16px 0;overflow-x:auto;scrollbar-width:none}
.pv-selos li{flex:none;padding:8px 14px;border:1px solid var(--linha);border-radius:999px;font-size:.82rem;background:var(--papel);white-space:nowrap}
.pv-bloco{padding:clamp(40px,7vw,96px) 0}
.pv-cab{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:20px}
.pv-cab h2{font-size:clamp(2rem,4vw,3rem)}
.pv-cab small{color:var(--tinta-2);font-size:.85rem;white-space:nowrap}
.pv-galeria .galeria{display:flex;grid-template-columns:none;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px}
.pv-galeria .galeria::-webkit-scrollbar{display:none}
.pv-galeria .galeria{align-items:center}
.pv-galeria .g-item{flex:0 0 auto;aspect-ratio:var(--a);height:min(64vh,560px,calc(86vw / var(--a)));width:auto;scroll-snap-align:start}
.pv-galeria .g-item::before{display:none}
.pv-dica{color:var(--tinta-2);font-size:.85rem;margin:10px 0 0}
.pv-historia{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,5vw,64px);align-items:center}
.pv-historia>p{font-family:var(--serif);font-size:clamp(1.45rem,2.6vw,2rem);line-height:1.3;margin:0}
.pv-depo{margin:0;padding:clamp(22px,3vw,32px);background:var(--areia);border-left:3px solid var(--acento)}
.pv-depo blockquote{margin:0;font-size:1.02rem;line-height:1.6}
.pv-depo figcaption{margin-top:14px;font-size:.85rem;color:var(--tinta-2)}
.pv-depo figcaption b{color:var(--tinta);font-weight:500}
.pv-depo .estrelas{color:#d9a441;letter-spacing:1px}
.pv-quando{display:flex;gap:14px;align-items:flex-start;padding:18px 20px;background:#1f1d1b;color:#f4efe9;margin:clamp(28px,4vw,44px) 0 0}
.pv-quando svg{width:22px;height:22px;flex:none;color:#e9b8a2;margin-top:2px}
.pv-quando b{color:#fff;font-weight:500}
.pv-exemplo{display:inline-flex;align-items:center;gap:8px;margin:0 0 18px;padding:7px 12px;border-radius:999px;background:#1f1d1b;color:#fff;font-size:.74rem;letter-spacing:.04em}
.pv-exemplo svg{width:13px;height:13px;color:#e9b8a2}
.modo-video .pv-exemplo{display:none!important}
.pv-pacotes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch;padding-top:12px}
.pv-pac{position:relative;display:flex;flex-direction:column;background:var(--papel);border:1px solid var(--linha);padding:28px 24px 24px}
.pv-pac--destaque{border:2px solid var(--acento);box-shadow:0 20px 44px rgba(30,25,20,.10)}
.pv-selo{position:absolute;top:-13px;left:22px;background:var(--acento);color:#fff;font-size:.66rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;padding:6px 12px;border-radius:999px}
.pv-pac h3{font-family:var(--sans);font-size:.78rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--tinta-2)}
.pv-preco{font-family:var(--serif);font-size:clamp(2.4rem,4vw,3rem);line-height:1;margin:10px 0 2px}
.pv-pac ul{list-style:none;padding:0;margin:16px 0 22px;display:grid;gap:9px;font-size:.96rem}
.pv-pac li{display:flex;gap:10px;align-items:baseline}
.pv-pac li::before{content:"✓";color:var(--acento);font-weight:600}
.pv-pac .botao{margin-top:auto;width:100%}
.pv-pac:not(.pv-pac--destaque) .botao{background:transparent;color:var(--tinta);border-color:color-mix(in srgb,var(--tinta) 30%,transparent)}
.pv-pac:not(.pv-pac--destaque) .botao:hover{background:var(--tinta);color:var(--fundo)}
.pv-extra{margin-top:18px;padding:20px 22px;border:1px dashed var(--acento);display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}
.pv-extra b{font-family:var(--serif);font-size:1.4rem;font-weight:500}
.pv-extra p{margin:2px 0 0;color:var(--tinta-2);font-size:.95rem}
.pv-fim{text-align:center;padding:clamp(48px,8vw,100px) 0;background:var(--areia)}
.pv-fim h2{font-size:clamp(2.2rem,4.6vw,3.4rem)}
.pv-fim p{color:var(--tinta-2);margin:12px auto 22px;max-width:480px}
.pv-outros{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}
.pv-outro{flex:0 0 min(46%,240px);position:relative;display:block;aspect-ratio:4/5;overflow:hidden;color:#fff;text-decoration:none;background:var(--areia)}
.pv-outro img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pv-outro span{position:absolute;inset:auto 0 0;padding:40px 14px 14px;background:linear-gradient(transparent,rgba(15,14,13,.66));display:flex;flex-direction:column}
.pv-outro b{font-family:var(--serif);font-weight:500;font-size:1.3rem;line-height:1.05}
.pv-outro small{font-size:.78rem;opacity:.92}
.pv-vitrine{display:grid;gap:14px}
.pv-vitrine:not(.pv-vitrine--grade){grid-template-columns:1fr 1fr}
.pv-vitrine:not(.pv-vitrine--grade) .pv-card:last-child:nth-child(odd){grid-column:1/-1;width:calc(50% - 7px);justify-self:center}
.pv-card{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);background:var(--papel);border:1px solid var(--linha);text-decoration:none;color:inherit;overflow:hidden}
.pv-card figure{aspect-ratio:4/5;align-self:stretch}
.pv-card figure{margin:0;position:relative;overflow:hidden}
.pv-card figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.pv-card:hover figure img{transform:scale(1.04)}
.pv-card>div{padding:clamp(20px,3.4vw,40px);display:flex;flex-direction:column;justify-content:center;gap:6px}
.pv-card .eyebrow{margin:0 0 4px}
.pv-card h2{font-size:clamp(1.7rem,3.4vw,2.6rem)}
.pv-card p{margin:4px 0 0;color:var(--tinta-2);font-size:.96rem}
.pv-card .pv-apartir{margin-top:12px;font-size:.84rem;color:var(--tinta-2)}
.pv-card .pv-apartir b{font-family:var(--serif);font-size:1.7rem;font-weight:500;color:var(--tinta);margin-left:4px}
.pv-card .link{margin-top:12px;display:inline-flex;align-items:center;gap:8px;font-weight:500;color:var(--acento);font-size:.9rem}
.pv-card .link svg{width:18px;height:18px}
.pv-barra{position:fixed;left:0;right:0;bottom:0;z-index:65;display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--papel) 94%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid var(--linha);transform:translateY(110%);transition:transform .35s}
.pv-barra.ver{transform:none}
.pv-barra span{display:flex;flex-direction:column;line-height:1.25;font-size:.78rem;color:var(--tinta-2)}
.pv-barra span b{font-family:var(--serif);font-size:1.15rem;font-weight:500;color:var(--tinta)}
.pv-barra .botao{min-height:46px;padding:10px 18px;font-size:.86rem;flex:none}
.pv-trilho{position:relative}
.pv-seta{position:absolute;top:50%;z-index:2;width:46px;height:46px;margin-top:-23px;border-radius:50%;background:var(--papel);color:var(--tinta);border:1px solid var(--linha);box-shadow:0 8px 24px rgba(0,0,0,.14);display:none;align-items:center;justify-content:center}
.pv-seta svg{width:20px;height:20px}.pv-seta--ant{left:-14px}.pv-seta--ant svg{transform:rotate(180deg)}.pv-seta--prox{right:-14px}
@media(hover:hover) and (min-width:861px){.pv-seta{display:flex}.pv-seta[hidden]{display:none}}
.pv-preco-hero{display:inline-flex;align-items:baseline;gap:6px;margin:18px 0 0 8px;padding:7px 14px;border-radius:999px;background:var(--acento);color:#fff;font-size:.86rem;text-decoration:none}
.pv-preco-hero b{font-family:var(--serif);font-size:1.12rem;font-weight:500}
.pv-hero--deitada{background:#1f1d1b}
.pv-hero--deitada::after{display:none}
@media(max-width:860px){.pv-hero--deitada{display:block;min-height:0}.pv-hero--deitada>img{position:relative;height:auto;aspect-ratio:auto}.pv-hero--deitada .container{padding:26px 0 34px}}
@media(min-width:861px){.pv-hero--deitada>img{height:auto;align-self:center;max-height:min(84vh,780px)}.pv-claro .pv-hero--deitada{background:var(--areia)}}
.rz-folha .pv-dica-rz{background:#ffffff14;border-radius:12px;padding:10px 12px;font-size:.86rem}
/* no computador, a capa fica ao lado do texto: a foto em pé aparece inteira, sem cortar rosto */
@media(min-width:861px){.pv-hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);min-height:0;background:var(--tinta)}
.pv-hero::after{display:none}.pv-hero>img{position:relative;grid-column:2;grid-row:1;height:min(84vh,780px);width:100%}
.pv-hero .container{grid-column:1;grid-row:1;width:auto;max-width:640px;margin:0 0 0 auto;padding:clamp(48px,6vw,90px) clamp(28px,4vw,64px);align-self:center}
.pv-claro .pv-hero{background:var(--areia);color:var(--tinta)}.pv-claro .pv-hero h1,.pv-claro .pv-hero .eyebrow{color:var(--tinta)}.pv-claro .pv-hero h1 em{color:var(--acento)}
.pv-claro .pv-hero p{color:var(--tinta-2)}.pv-claro .pv-prova{background:var(--papel);color:var(--tinta);border:1px solid var(--linha)}
.pv-claro .pv-acoes .botao--vidro{color:var(--tinta);border-color:color-mix(in srgb,var(--tinta) 35%,transparent);background:transparent}}
.pv-vitrine--grade{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.pv-vitrine--grade .pv-card{grid-template-columns:1fr;min-height:0}
.pv-vitrine--grade .pv-card figure{aspect-ratio:4/5}
.pv-vitrine--grade .pv-card>div{padding:16px 16px 18px;justify-content:flex-start}
.pv-vitrine--grade .pv-card h2{font-size:clamp(1.3rem,2vw,1.6rem)}
.pv-vitrine--grade .pv-card>div>p:not(.pv-apartir):not(.eyebrow){display:none}
@media(max-width:860px){.pv-vitrine--grade{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pv-vitrine--grade .pv-card figure{aspect-ratio:3/4}.pv-vitrine--grade .pv-card>div{padding:44px 12px 12px}
.pv-vitrine--grade .pv-card h2{font-size:1.12rem}.pv-vitrine--grade .pv-card .eyebrow{display:none}.pv-vitrine--grade .pv-card .pv-apartir{font-size:.72rem}.pv-vitrine--grade .pv-card .pv-apartir b{font-size:1.1rem}
.pv-vitrine--grade .pv-card:last-child:nth-child(odd){grid-column:span 2}.pv-vitrine--grade .pv-card:last-child:nth-child(odd) figure{aspect-ratio:1/1}}
@media(max-width:860px){.pv-pacotes{grid-template-columns:1fr;gap:22px}.pv-pac--destaque{order:-1}.pv-historia{grid-template-columns:1fr}
.pv-vitrine:not(.pv-vitrine--grade){grid-template-columns:1fr}.pv-vitrine:not(.pv-vitrine--grade) .pv-card:last-child:nth-child(odd){width:auto}
.pv-vitrine .pv-card{display:block;position:relative;min-height:0;border:0;color:#fff;background:#2b2a28}.pv-vitrine .pv-card figure{position:relative;aspect-ratio:4/5}
.pv-vitrine .pv-card>div{position:absolute;inset:auto 0 0 0;padding:64px 18px 18px;background:linear-gradient(180deg,rgba(15,14,13,0),rgba(15,14,13,.82));gap:2px}
.pv-vitrine .pv-card .eyebrow{color:#fff;opacity:.92;margin:0}.pv-vitrine .pv-card h2{color:#fff;font-size:1.65rem}.pv-vitrine .pv-card h2 em{color:#fff}
.pv-vitrine .pv-card p{display:none}.pv-vitrine .pv-card .pv-apartir{display:block;color:#efe8e1;margin-top:6px}.pv-vitrine .pv-card .pv-apartir b{color:#fff;font-size:1.4rem}.pv-vitrine .pv-card .link{display:none}
.pv-barra{display:flex}.pv-tem-barra{padding-bottom:72px}.pv-tem-barra .flutuante{display:none}.pv-tem-barra .rz-pilula{bottom:84px}.pv-tem-barra .rz-folha{bottom:138px}}
@media(max-width:520px){.pv-hero{min-height:82vh}.pv-acoes .botao{flex:1 1 100%}.pv-cab{flex-direction:column;align-items:flex-start;gap:4px}}
'''

TRILHO_JS = '''<script>(function(){document.querySelectorAll(".pv-trilho").forEach(function(t){var l=t.querySelector(".galeria,.pv-outros"),a=t.querySelector(".pv-seta--ant"),p=t.querySelector(".pv-seta--prox");if(!l)return;
function f(){var fim=l.scrollWidth-l.clientWidth;a.hidden=l.scrollLeft<8;p.hidden=l.scrollLeft>fim-8||fim<8}
a.onclick=function(){l.scrollBy({left:-l.clientWidth*.8,behavior:"smooth"})};p.onclick=function(){l.scrollBy({left:l.clientWidth*.8,behavior:"smooth"})};
l.addEventListener("scroll",f,{passive:true});window.addEventListener("resize",f);f()})})();</script>'''

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
    # o runtime antigo: o carrossel de avaliações sem conferir se existe; e os links entre páginas só sabiam "natal"
    velho = ('const avaliacoes = () => $("[data-reviews]").innerHTML =', '}).join("");\n  avaliacoes();')
    if all(v in fim for v in velho):
        fim = fim.replace(velho[0], 'const avaliacoes = () => $("[data-reviews]") && ($("[data-reviews]").innerHTML =', 1).replace(velho[1], '}).join(""));\n  avaliacoes();', 1)
    # a raiz da demo: o runtime antigo só tirava "/natal" do endereço; com uma página por ensaio, é sempre /demo/<pasta>
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
    if 'natal' not in galerias: galerias['natal'] = [f for f in galerias['pn'] if 'Natal' in f['alt'] or 'cenário' in f['alt']]

    def fotos_de(refs):
        """["natal:2-7,9", "pn:2", "familia"] -> as fotos, na ordem (a primeira é a capa)."""
        out = []
        for r in ([refs] if isinstance(refs, str) else refs):
            g, _, idx = r.partition(':'); lista = galerias.get(g) or sys.exit(f'galeria {g} não existe ({", ".join(galerias)})')
            if not idx: out += lista; continue
            for parte in idx.split(','):
                a, _, b = parte.partition('-')
                for i in range(int(a), int(b or a) + 1): out.append(lista[i])
        return out
    capa_site = imgs(pegar(r'<div class="mosaico">.*?</div>', s))
    nota, total = cfg['google_nota'], cfg['google_total']
    prova_txt = (f'{nota} · ' if str(nota).startswith('5') else '') + f'{total} avaliações no Google'
    nome_marca = cfg['marca']
    for e in pf['ensaios']: e['_fotos'] = fotos_de(e.get('fotos') or e['galeria'])
    ensaios = [e for e in pf['ensaios'] if len(e['_fotos']) >= 2]
    local = pf.get('local', '')

    def wa(msg): return f'https://wa.me/{fone}?text={quote(msg)}'

    def link(nome, ancora=''):
        h = base if nome == 'index' else f'{base}/{nome}'
        return f'href="{h}{ancora}" data-local="{nome}.html{ancora}" data-pagina="{nome}"'

    curto = lambda e: e['nome'].split(' e ')[0]

    def troca(atual):
        itens = [('index', 'A vitrine')] + [(e['id'], curto(e)) for e in ensaios]
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

    def montar(nome, titulo, descricao, corpo, barra=''):
        h = head.replace('</style>', CSS + '</style>', 1)
        h = re.sub(r'<title>.*?</title>', f'<title>{esc(titulo)}</title>', h, flags=re.S)
        h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(descricao)}">', h)
        h = re.sub(r'<!-- .*? -->', f'<!-- Portfólio de {esc(nome_marca)} (demo da Renderiza): gerado por ferramentas/demo/gerar-portfolio.py. Pacotes e valores de exemplo. -->', h, count=1, flags=re.S)
        links = ''.join(f'<a {link(e["id"])}>{esc(e["nome"])}</a>' for e in ensaios)
        r = re.sub(r'<nav aria-label="Links">.*?</nav>', lambda _: f'<nav aria-label="Links">{links}<a data-whatsapp href="#">WhatsApp</a><a data-instagram href="#" target="_blank" rel="noopener noreferrer">Instagram</a></nav>', rodape, flags=re.S)
        classe = 'pagina-site pv-pagina' + (' pv-tem-barra' if barra else '') + (' pv-claro' if pf.get('tom') == 'claro' else '')
        doc = (h + f'\n<body class="{classe}">\n' + sprite + '\n' + rz(faixa, nome) + '\n' + cabecalho(nome)
               + f'\n<main id="inicio">\n{corpo}\n</main>\n' + r + '\n' + barra + '\n' + lb + '\n' + rz(folha, nome) + rz(fim, nome)
               + (BARRA_JS if barra else '') + (TRILHO_JS if 'pv-trilho' in corpo else '') + '</body>\n</html>\n')
        open(os.path.join(pasta, nome + '.html'), 'w', encoding='utf-8').write(doc)
        return nome + '.html'

    def retrato(e): return next((f for f in e['_fotos'] if f['h'] >= f['w'] * .95), e['_fotos'][0])

    def a_partir(e): return min(e['pacotes'], key=lambda p: int(re.sub(r'\D', '', p['preco']) or 0))['preco']

    def outro(e):
        return f'<a class="pv-outro" {link(e["id"])}>{tag(retrato(e))}<span><b>{esc(e["nome"])}</b><small>a partir de {esc(a_partir(e))}</small></span></a>'

    prova = f'<a class="pv-prova" data-reviews-link href="#" target="_blank" rel="noopener noreferrer"><span class="estrelas" aria-hidden="true">★★★★★</span>{esc(prova_txt)}</a>'
    exemplo = f'<p class="pv-exemplo">{BRILHO}Pacotes e valores de exemplo: você coloca os seus</p>'
    feitas = []

    # ---------- a vitrine ----------
    cards = ''.join(f'''<a class="pv-card reveal" {link(e["id"])}><figure>{tag(retrato(e))}</figure><div>
  <p class="eyebrow">{esc(e["chamada"])}</p><h2>{esc(e["titulo"])}</h2><p>{esc(e["sub"])}</p>
  <p class="pv-apartir">a partir de <b>{esc(a_partir(e))}</b></p><span class="link">Ver fotos e pacotes {SETA}</span></div></a>''' for e in ensaios)
    capa = fotos_de(pf['capa'])[0] if pf.get('capa') else (capa_site[0] if capa_site else ensaios[0]['_fotos'][0])
    corpo = f'''<section class="pv-hero{" pv-hero--deitada" if capa["w"] > capa["h"] * 1.08 else ""}" aria-labelledby="titulo-site">
  {tag(capa, True)}
  <div class="container">
    <p class="eyebrow">{esc(nome_marca)}</p>
    <h1 id="titulo-site">{esc(pf["h1"])}</h1>
    {f'<p>{esc(pf["frase"])}</p>' if pf.get("frase") else ""}
    {prova}
    <div class="pv-acoes"><a class="botao" href="#ensaios">Ver ensaios e valores {SETA}</a><a class="botao botao--vidro" data-whatsapp href="#">{WA}WhatsApp</a></div>
  </div>
</section>
<section class="pv-bloco" id="ensaios" aria-labelledby="ensaios-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="ensaios-titulo">Escolha <em>o seu ensaio.</em></h2><small>fotos, pacotes e valores</small></div>
    {exemplo}
    <div class="pv-vitrine{" pv-vitrine--grade" if pf.get("vitrine") == "grade" else ""}">{cards}</div>
  </div>
</section>
{depo}
{sobre}
{contato}'''
    feitas.append(montar('index', f'{nome_marca} | Ensaios e valores', f'{pf["h1"]} Fotos, pacotes e valores de cada ensaio.', corpo))

    # ---------- uma página de venda por ensaio ----------
    for e in ensaios:
        fotos = e['_fotos']

        def msg(pac=None, e=e):
            return f'Olá! Vi o portfólio de {nome_marca} e quero o {e["chamada"].lower()}' + (f', pacote {pac}' if pac else '') + '. Quais datas vocês têm?'
        av = avals.get(e.get('depo')) or next(iter(avals.values()), None)
        depo_html = (f'<figure class="pv-depo reveal"><blockquote>“{esc(av["quote"].strip("…").strip())}”</blockquote>'
                     f'<figcaption><span class="estrelas" aria-hidden="true">★★★★★</span> <b>{esc(nome_de(av["name"]))}</b>, no Google</figcaption></figure>') if av else ''
        pacotes = ''.join(f'''<article class="pv-pac{" pv-pac--destaque" if p.get("destaque") else ""}">{'<span class="pv-selo">Mais escolhido</span>' if p.get("destaque") else ''}
  <h3>{esc(p["nome"])}</h3><p class="pv-preco">{esc(p["preco"])}</p>
  <ul>{"".join(f"<li>{esc(i)}</li>" for i in p["itens"])}</ul>
  <a class="botao" href="{esc(wa(msg(p["nome"])))}" target="_blank" rel="noopener noreferrer">{WA}Quero o {esc(p["nome"])}</a></article>''' for p in e['pacotes'])
        extra = ''
        if e.get('extra'):
            x = e['extra']; pedido = wa(f'Olá! Vi o portfólio de {nome_marca} e quero saber do {x["titulo"].lower()}.')
            extra = (f'<div class="pv-extra reveal"><div><b>{esc(x["titulo"])}</b><p>{esc(x["p"])}</p></div>'
                     f'<a class="botao botao--linha" href="{esc(pedido)}" target="_blank" rel="noopener noreferrer">Quero saber</a></div>')
        corpo = f'''<section class="pv-hero{" pv-hero--deitada" if fotos[0]["w"] > fotos[0]["h"] * 1.08 else ""}" aria-labelledby="titulo-ensaio">
  {tag(fotos[0], True)}
  <div class="container">
    <p class="eyebrow">{esc(e["chamada"])}{" · " + esc(local) if local else ""}</p>
    <h1 id="titulo-ensaio">{esc(e["titulo"])}</h1>
    <p>{esc(e["sub"])}</p>
    {prova}<a class="pv-preco-hero" href="#pacotes">a partir de <b>{esc(a_partir(e))}</b></a>
    <div class="pv-acoes"><a class="botao" href="{esc(wa(msg()))}" target="_blank" rel="noopener noreferrer">{WA}Quero o meu ensaio</a><a class="botao botao--vidro" href="#pacotes">Ver pacotes e valores</a></div>
  </div>
</section>
<div class="container"><ul class="pv-selos" aria-label="Destaques">{"".join(f"<li>{esc(x)}</li>" for x in e["selos"])}</ul></div>
<section class="pv-bloco pv-galeria" style="padding-top:12px" aria-labelledby="fotos-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="fotos-titulo">As fotos <em>do ensaio.</em></h2><small>{len(fotos)} fotos · passe para o lado</small></div>
    {trilho(galeria(e["nome"], fotos), "Fotos")}
    <p class="pv-dica">Toque numa foto para ver em tela cheia.</p>
  </div>
</section>
<section class="pv-bloco" style="padding-top:0" aria-label="Como é o ensaio">
  <div class="container">
    <div class="pv-historia"><p class="reveal">{esc(e["texto"])}</p>{depo_html}</div>
    <p class="pv-quando reveal">{RELOGIO}<span><b>Quando fazer.</b> {esc(e["quando"])}</span></p>
  </div>
</section>
<section class="pv-bloco secao--areia" id="pacotes" aria-labelledby="pacotes-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="pacotes-titulo">Pacotes <em>e valores.</em></h2><small>reserve pelo WhatsApp</small></div>
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
</section>
<section class="pv-bloco" aria-labelledby="outros-titulo">
  <div class="container">
    <div class="pv-cab"><h2 id="outros-titulo">Outros <em>ensaios.</em></h2></div>
    {trilho('<div class="pv-outros">' + "".join(outro(o) for o in ensaios if o is not e) + '</div>', "Outros ensaios")}
  </div>
</section>'''
        barra = (f'<div class="pv-barra" aria-label="Reservar"><span>{esc(e["nome"])}<b>a partir de {esc(a_partir(e))}</b></span>'
                 f'<a class="botao" href="{esc(wa(msg()))}" target="_blank" rel="noopener noreferrer">{WA}Quero o meu</a></div>')
        feitas.append(montar(e['id'], f'{e["chamada"]} | {nome_marca}', f'{e["chamada"]} com {nome_marca}: {e["sub"]} Fotos, pacotes e valores.', corpo, barra))

    # páginas que sobraram da demo antiga (o natal.html de quem não tem Natal, o valores.html da versão 1) saem do ar
    for f in os.listdir(pasta):
        if f.endswith('.html') and f not in feitas: os.remove(os.path.join(pasta, f)); feitas.append(f'({f} removida)')
    print('portfólio:', ', '.join(feitas))


if __name__ == '__main__':
    if len(sys.argv) != 4: sys.exit('uso: gerar-portfolio.py demos/<pasta> <site.html> <natal.html>')
    gerar(sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3])
