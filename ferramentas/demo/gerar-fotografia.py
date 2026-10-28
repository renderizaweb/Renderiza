# Gera a demo de uma fotógrafa (família, gestante, newborn e infantil): o site dela (index.html) e a página da
# campanha de Natal (natal.html), as duas em arquivo único com as fotos dentro, no mesmo visual de portfólio.
# Desenho novo (docs/nichos/fotografos.md e o prompt do lote 1 de fotógrafos): imagem em primeiro lugar, muito
# respiro, serifa fina; galerias por categoria que abrem em tela cheia ao tocar (passa para o lado no celular);
# a história dela; avaliações do Google; o bloco que leva à campanha de Natal; e a camada da Renderiza (faixa no
# topo + pílula), que explica o que foi montado, o preço e o prazo. Usa do gerar.py: fotos (recorte), avaliações
# (trecho do mesmo tamanho), horário e o DEMO_CLIENT do runtime.js (avaliações, carrossel, links, menu, entrada).
#
# Uso: python3 ferramentas/demo/gerar-fotografia.py demos/<pasta>/demo.json
#   -> demos/<pasta>/index.html, demos/<pasta>/natal.html e demos/<pasta>/ficha.md
#   Depois: node ferramentas/demo/validar.mjs <index.html absoluto> <pasta_capturas> (e o mesmo para natal.html)
#
# demo.json (o que muda de uma fotógrafa para outra):
#   pasta, marca, google_json, google {coords, fid, gid}, google_nome, endereco_maps, google_nota, google_total,
#   verificado, whatsapp, instagram, seguidores, mensagem, cores {fundo, papel, areia, tinta, tinta2, rosa, acento,
#   acento_escuro, cafe}, marca_img {simbolo, logo, logo_claro, favicon},
#   site {titulo, descricao, hero {...}, galerias [{id, nome, fotos: [{arquivo, f: "p"|"l", c, box, alt}]}],
#         sobre {...}, jornada {...}, natal_bloco {...}, avaliacoes [...], contato {...}},
#   natal {titulo, descricao, hero {...}, ensaio {...}, cenario [...], galeria {...}, avaliacoes [...]},
#   horarios {dias, horas, reservados, exemplo, mensagem},
#   renderiza {whatsapp, preco_pix, parcelado, nota_preco, valido_ate, msg_garantir, msg_negociar}
#     -> os valores e a data da oferta ficam só aqui; no HTML, num objeto só (window.RZ), que preenche a faixa.
#   ficha {...}: o que vai para a ficha.md.
# No vídeo (gravar.mjs), a página aberta com ?video=1 esconde a camada da Renderiza (o vídeo não mostra preço).
import base64, datetime, html, io, json, os, re, sys, urllib.parse
from PIL import Image, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
import importlib.util
_spec = importlib.util.spec_from_file_location('gerar_base', os.path.join(AQUI, 'gerar.py'))
G = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(G)
esc = lambda t: html.escape(str(t), quote=True)

MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
DIAS_SEM = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']


def quem(cfg):
    """Como o site chama a fotógrafa: o nome da marca no topo (nome + palavra em letra cursiva) e "a Ana"/"da Ana"
    (demo.json: titulo_nome, titulo_script, quem_a, quem_da; o padrão sai de marca e dona)."""
    dona = cfg.get('dona', 'Ana')
    nome = cfg.get('titulo_nome') or re.sub(r'\s+fotografia$', '', cfg['marca'], flags=re.I)
    a = cfg.get('quem_a', 'a ' + dona); da = cfg.get('quem_da', 'da ' + dona)
    return {'nome': nome, 'script': cfg.get('titulo_script', 'fotografia'), 'a': a, 'A': a[:1].upper() + a[1:], 'da': da}


def T(modelo, **kw):
    """Troca {{chave}} pelo valor (para os blocos grandes de HTML, CSS e JS, sem brigar com chaves de f-string)."""
    for k, v in kw.items():
        modelo = modelo.replace('{{' + k + '}}', str(v))
    falta = re.findall(r'\{\{[a-z_0-9]+\}\}', modelo)
    assert not falta, falta[:5]
    return modelo


# ---------- fotos ----------
class Fotos:
    """Cada foto entra uma vez, comprimida (WebP; a do topo em JPEG para a prévia do link), e é reaproveitada
    pela tela cheia. "tam" = recorte exato (cover, centro "c"); sem "tam", só reduz para caber em (mw, mh)."""
    def __init__(self):
        self.cache, self.bytes, self.n, self.avisos = {}, 0, 0, []

    def abrir(self, spec):
        im = ImageOps.exif_transpose(Image.open(spec['arquivo'])).convert('RGB')
        if 'box' in spec:
            x0, y0, x1, y1 = spec['box']; W, H = im.size
            im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
        return im

    def uri(self, spec, mw, mh, fmt='webp', q=62, tam=None):
        chave = (spec['arquivo'], json.dumps(spec.get('box')), json.dumps(spec.get('c')), mw, mh, fmt, q, json.dumps(tam))
        if chave in self.cache: return self.cache[chave]
        im = self.abrir(spec)
        if tam:
            if max(tam[0] / im.width, tam[1] / im.height) > 1.2:
                self.avisos.append(f'{os.path.basename(spec["arquivo"])}: pequena para {tam[0]}x{tam[1]} ({im.width}x{im.height})')
            im = ImageOps.fit(im, tuple(tam), Image.LANCZOS, centering=tuple(spec.get('c', (0.5, 0.5))))
        else:
            im.thumbnail((mw, mh), Image.LANCZOS)
        buf = io.BytesIO()
        if fmt == 'jpeg':
            im.save(buf, 'JPEG', quality=q, optimize=True, progressive=True); mime = 'image/jpeg'
        else:
            im.save(buf, 'WEBP', quality=q, method=6); mime = 'image/webp'
        dados = buf.getvalue(); self.bytes += len(dados); self.n += 1
        r = ('data:%s;base64,%s' % (mime, base64.b64encode(dados).decode()), im.width, im.height)
        self.cache[chave] = r
        return r

    def png(self, caminho, largura, fmt='webp'):
        im = Image.open(caminho).convert('RGBA')
        if im.width > largura: im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        if fmt == 'png': im.save(buf, 'PNG', optimize=True); mime = 'image/png'
        else: im.save(buf, 'WEBP', quality=90, method=6); mime = 'image/webp'
        self.bytes += len(buf.getvalue())
        return 'data:%s;base64,%s' % (mime, base64.b64encode(buf.getvalue()).decode()), im.width, im.height


def img(uri_wh, alt, classe='', extra=''):
    u, w, h = uri_wh
    c = f' class="{classe}"' if classe else ''
    return f'<img{c} src="{u}" width="{w}" height="{h}" alt="{esc(alt)}"{extra}>'


# ---------- horários de exemplo (campanha) ----------
def horarios(cfg):
    """Grade de exemplo: [{iso, dia, mes, semana, horas: [{h, livre, link}]}], com o total e quantos restam."""
    H = cfg['horarios']; reservados = set(H.get('reservados', []))
    msg = H['mensagem']
    dias, total, livres = [], 0, 0
    for iso in H['dias']:
        d = datetime.date.fromisoformat(iso)
        linha = {'iso': iso, 'dia': d.day, 'mes': MESES[d.month - 1], 'semana': DIAS_SEM[d.weekday()], 'horas': []}
        for h in H['horas']:
            livre = f'{iso} {h}' not in reservados
            texto = msg.replace('{data}', f'{d.day:02d}/{d.month:02d}').replace('{semana}', DIAS_SEM[d.weekday()]).replace('{hora}', h)
            link = f'https://wa.me/{cfg["whatsapp"]}?text=' + urllib.parse.quote(texto)
            linha['horas'].append({'h': h, 'livre': livre, 'link': link})
            total += 1; livres += livre
        dias.append(linha)
    return dias, total, livres


def grade_html(dias):
    out = []
    for d in dias:
        botoes = ''.join(
            f'<a class="hora" href="{esc(x["link"])}" target="_blank" rel="noopener noreferrer" data-hora="{esc(d["iso"] + " " + x["h"])}" '
            f'aria-label="{esc(d["semana"].capitalize() + ", " + str(d["dia"]) + " de " + d["mes"] + ", às " + x["h"] + ": pedir pelo WhatsApp")}">{esc(x["h"])}</a>'
            if x['livre'] else
            f'<span class="hora is-reservado" aria-label="{esc(x["h"] + ": reservado")}"><s>{esc(x["h"])}</s></span>'
            for x in d['horas'])
        livres = sum(x['livre'] for x in d['horas'])
        out.append(f'<li class="dia"><div class="dia-nome"><b>{d["dia"]}</b><span>{esc(d["mes"])}</span><small>{esc(d["semana"])}</small></div>'
                   f'<div class="dia-horas">{botoes}</div><p class="dia-resta">{livres} livre{"s" if livres != 1 else ""}</p></li>')
    return '<ol class="grade-dias" aria-label="Horários de exemplo">' + ''.join(out) + '</ol>'


def proximos(dias, n):
    """O primeiro horário livre de cada dia, nos n primeiros dias que têm vaga."""
    out = []
    for d in dias:
        x = next((x for x in d['horas'] if x['livre']), None)
        if x: out.append((d, x))
        if len(out) == n: break
    return out


# ---------- avaliações (as do gerar.py: só 5 estrelas, trecho do mesmo tamanho) ----------
def cliente_js(cfg, google, horas, lista):
    c = dict(cfg); c['avaliacoes'] = lista
    js = G.cliente(c, google, horas)
    for a in lista:
        if 'nome' in a:
            x = next(x for x in G.avaliacoes(google) if x['nome'].strip().lower() == a['nome'].strip().lower())
            t = G.trecho(x['texto'], a.get('trecho'))
            print(f'  avaliação {a["nome"]}: {len(t)} caracteres')
    return js


# ---------- pedaços do HTML ----------
SIMBOLOS = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="whats" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M20.5 11.5A8.5 8.5 0 0 1 7.3 19L3 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5Z"/><path fill="none" stroke="currentColor" stroke-width="1.7" d="M8.5 7.5c0 4 2.5 6.5 6.5 6.5l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2Z"/></symbol>
  <symbol id="insta" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/></g><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></symbol>
  <symbol id="pin" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>
  <symbol id="relogio" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g></symbol>
  <symbol id="seta" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="fechar" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></symbol>
  <symbol id="brilho" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2Z"/></symbol>
  <symbol id="cal" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></g></symbol>
</svg>'''

FONTES = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
          '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'
          '&family=Jost:wght@300;400;500&family=Allura&display=swap" rel="stylesheet">')

CSS = r'''
:root{--fundo:{{fundo}};--papel:{{papel}};--areia:{{areia}};--linha:{{linha}};--tinta:{{tinta}};--tinta-2:{{tinta2}};--rosa:{{rosa}};--acento:{{acento}};--acento-escuro:{{acento_escuro}};--cafe:{{cafe}};--claro:#f6eee6;
--serif:"Cormorant Garamond",Georgia,serif;--sans:"Jost",system-ui,-apple-system,"Segoe UI",sans-serif;--script:"Allura","Brush Script MT",cursive;--container:min(1200px,calc(100% - 48px))}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:86px;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--fundo);color:var(--tinta);font-family:var(--sans);font-weight:400;font-size:1.0625rem;line-height:1.7;overflow-x:hidden;-webkit-font-smoothing:antialiased;font-variant-numeric:lining-nums}
img{display:block;max-width:100%;height:auto}a{color:inherit}button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0}
[hidden]{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
:focus-visible{outline:2px solid var(--acento);outline-offset:3px}
.container{width:var(--container);margin-inline:auto}
h1,h2,h3{font-family:var(--serif);font-weight:500;line-height:1.04;letter-spacing:-.01em;margin:0;text-wrap:balance}
h1 em,h2 em,h3 em{font-style:italic;font-weight:500;color:var(--acento)}
h2{font-size:clamp(2.35rem,4.6vw,3.7rem)}p{margin:0 0 1em}
.eyebrow{display:flex;align-items:center;gap:12px;font-weight:500;font-size:.72rem;line-height:1.4;letter-spacing:.28em;text-transform:uppercase;color:var(--acento);margin:0 0 18px}
.eyebrow::before{content:"";width:28px;height:1px;background:currentColor;opacity:.6}
.secao{padding:clamp(76px,10vw,132px) 0}.secao--areia{background:var(--areia)}
.cabeca{max-width:680px;margin:0 auto clamp(36px,5vw,56px);text-align:center}.cabeca .eyebrow{justify-content:center}.cabeca .eyebrow::after{content:"";width:28px;height:1px;background:currentColor;opacity:.6}
.cabeca>p{color:var(--tinta-2);margin:18px auto 0;max-width:540px}
.botao{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:14px 28px;border-radius:999px;background:var(--acento);border:1px solid var(--acento);color:#fff;text-decoration:none;font-weight:500;font-size:.92rem;letter-spacing:.06em;transition:background .25s,color .25s,border-color .25s}
.botao:hover{background:var(--acento-escuro);border-color:var(--acento-escuro)}.botao svg{width:20px;height:20px;flex:none}
.botao--linha{background:transparent;color:var(--tinta);border-color:color-mix(in srgb,var(--tinta) 35%,transparent)}.botao--linha:hover{background:var(--tinta);border-color:var(--tinta);color:var(--fundo)}
.link{display:inline-flex;align-items:center;gap:8px;font-weight:500;font-size:.8rem;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:3px}
.link svg{width:16px;height:16px}
.js .reveal{opacity:0;transform:translateY(22px);transition:opacity .9s ease,transform .9s cubic-bezier(.2,.7,.2,1)}.js .reveal.is-visible{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.js .reveal{opacity:1;transform:none;transition:none}}

/* camada da Renderiza: faixa no topo (some com a rolagem), pílula e folha; ?video=1 esconde tudo */
.rz-faixa{background:#1e2528;color:#eef0ee;font-size:.86rem;line-height:1.45;position:relative;z-index:60}
.rz-in{width:min(1200px,calc(100% - 32px));margin-inline:auto;display:flex;align-items:center;gap:10px 20px;flex-wrap:wrap;padding:10px 0}
.rz-ola{display:flex;align-items:center;gap:8px;font-weight:500}.rz-ola svg{width:14px;height:14px;color:#e8855e;flex:none}
.rz-troca{display:inline-flex;padding:3px;border-radius:999px;background:#ffffff14;gap:2px}
.rz-troca a{padding:6px 14px;border-radius:999px;text-decoration:none;color:#d7dcd9;font-size:.8rem;white-space:nowrap}
.rz-troca a[aria-current="page"]{background:#f1eee9;color:#1e2528;font-weight:500}
.rz-preco{display:flex;align-items:center;gap:6px 14px;flex-wrap:wrap;margin-left:auto}
.rz-preco b{font-weight:500;color:#fff}.rz-preco small{color:#aab3ae;font-size:.78rem}
.rz-abrir{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;border:1px solid #ffffff38;font-size:.8rem;white-space:nowrap}
.rz-abrir svg{width:12px;height:12px;transform:rotate(90deg);transition:transform .2s}.rz-faixa.aberta .rz-abrir svg{transform:rotate(-90deg)}
.rz-mais{border-top:1px solid #ffffff1f}.rz-mais .rz-in{padding:14px 0 16px;align-items:center}
.rz-prazo{margin:0;color:#d7dcd9;max-width:640px}.rz-prazo b{color:#fff;font-weight:500}
.rz-acoes{display:flex;gap:10px;flex-wrap:wrap;margin-left:auto}
.rz-botao{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:9px 18px;border-radius:999px;background:#b25134;color:#fff;text-decoration:none;font-weight:500;font-size:.86rem}
.rz-botao:hover{background:#c55f40}.rz-botao--linha{background:transparent;border:1px solid #ffffff59}.rz-botao--linha:hover{background:#ffffff14}.rz-botao svg{width:17px;height:17px}
.rz-assina{color:#8e9894;font-size:.74rem;letter-spacing:.04em}
.rz-pilula{position:fixed;left:16px;bottom:18px;z-index:70;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:#1e2528;color:#f1eee9;font-size:.8rem;box-shadow:0 10px 30px #1e252840;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .3s,transform .3s}
.rz-pilula.visivel{opacity:1;transform:none;pointer-events:auto}.rz-pilula svg{width:13px;height:13px;color:#e8855e}.rz-pilula b{font-weight:500}
.rz-folha{position:fixed;left:16px;bottom:72px;z-index:71;width:min(360px,calc(100vw - 32px));background:#1e2528;color:#eef0ee;border-radius:18px;padding:20px 20px 18px;box-shadow:0 24px 60px #0000004d;font-size:.9rem;line-height:1.5}
.rz-folha h2{font-family:var(--sans);font-size:1rem;font-weight:500;letter-spacing:0;color:#fff;margin:0 0 10px;padding-right:28px}
.rz-folha p{margin:0 0 10px;color:#d7dcd9}.rz-folha .rz-troca{margin:4px 0 14px}.rz-folha .rz-acoes{margin:12px 0 0}
.rz-folha-fechar{position:absolute;top:12px;right:12px;width:32px;height:32px;display:grid;place-items:center;border-radius:50%;color:#d7dcd9}.rz-folha-fechar svg{width:18px;height:18px}
.modo-video .rz-faixa,.modo-video .rz-pilula,.modo-video .rz-folha{display:none!important}
@media(max-width:860px){.rz-in{gap:8px 12px;padding:10px 0 11px}.rz-ola{width:100%;font-size:.84rem}.rz-troca{width:100%}.rz-troca a{flex:1;text-align:center;padding:7px 8px}
.rz-preco{margin-left:0;width:100%;justify-content:space-between;flex-wrap:nowrap;gap:10px}.rz-preco>span{font-size:.8rem}.rz-preco small{display:none}.rz-abrir{padding:6px 10px}.rz-abrir .rz-abrir-txt{display:none}.rz-acoes{margin-left:0;width:100%}.rz-acoes .rz-botao{flex:1;justify-content:center}}

/* topo do site */
.site-header{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--fundo) 92%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid transparent;transition:border-color .3s}
.site-header.rolou{border-bottom-color:var(--linha)}
.topo-in{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:78px;position:relative}
.marca{display:flex;align-items:center;gap:12px;text-decoration:none;min-width:0}
.marca img{width:48px;height:48px;flex:none}
.marca-nome{display:grid;line-height:1;min-width:0}
.marca-nome b{font-family:var(--serif);font-weight:500;font-size:1.06rem;letter-spacing:.24em;text-transform:uppercase;white-space:nowrap}
.marca-nome i{font-family:var(--script);font-style:normal;font-size:1.45rem;line-height:.9;color:var(--rosa);margin:2px 0 0 1px}
.nav{display:flex;align-items:center;gap:clamp(16px,2.2vw,30px)}
.nav a{font-size:.7rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;white-space:nowrap;padding:6px 0;border-bottom:1px solid transparent}
.nav a:hover{border-bottom-color:currentColor}
.topo-cta{min-height:44px;padding:10px 20px;font-size:.82rem}
.menu-botao{display:none;width:46px;height:46px;border-radius:50%;border:1px solid var(--linha);place-items:center}
.menu-botao span{display:block;width:18px;height:1.5px;background:var(--tinta);position:relative}.menu-botao span::before,.menu-botao span::after{content:"";position:absolute;left:0;width:18px;height:1.5px;background:var(--tinta)}
.menu-botao span::before{top:-6px}.menu-botao span::after{top:6px}
.menu-mobile{position:absolute;top:100%;left:0;right:0;background:var(--papel);border-bottom:1px solid var(--linha);box-shadow:0 18px 40px #3a2b2314;padding:8px 24px 22px}
.menu-mobile a{display:block;padding:14px 0;border-bottom:1px solid var(--linha);text-decoration:none;font-family:var(--serif);font-size:1.4rem}
.menu-mobile .botao{margin-top:18px;width:100%;font-family:var(--sans);font-size:.92rem;border:0}
@media(max-width:1060px){.nav,.topo-cta{display:none}.menu-botao{display:grid}}
@media(min-width:1061px){.menu-mobile{display:none!important}}
@media(max-width:520px){.topo-in{min-height:68px}.marca img{width:40px;height:40px}.marca-nome b{font-size:.9rem;letter-spacing:.18em}.marca-nome i{font-size:1.25rem}}

/* abertura */
.abertura{padding:clamp(28px,5vw,72px) 0 clamp(56px,7vw,96px)}
.abertura-grid{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(32px,5vw,80px);align-items:center}
.abertura h1{font-size:clamp(3.1rem,6.4vw,5.6rem);font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:.98}
.abertura h1 .script{display:block;font-family:var(--script);font-weight:400;text-transform:none;letter-spacing:0;color:var(--rosa);font-size:.86em;line-height:.8;margin:.04em 0 0 .08em}
.frase{font-family:var(--serif);font-style:italic;font-size:clamp(1.5rem,2.4vw,2rem);line-height:1.2;color:var(--tinta);margin:26px 0 14px}
.abertura-intro{color:var(--tinta-2);max-width:470px}
.abertura-acoes{display:flex;flex-wrap:wrap;align-items:center;gap:16px 26px;margin:30px 0 26px}
.prova{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:var(--tinta-2);font-size:.92rem;text-decoration:none}
.prova .estrelas{color:#c4935a;letter-spacing:2px}.prova b{font-family:var(--serif);font-size:1.5rem;font-weight:600;color:var(--tinta)}
.mosaico{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:12px}
.mosaico figure{margin:0;position:relative;overflow:hidden;background:var(--areia);min-height:0}
.mosaico figure:first-child{grid-row:1/3;aspect-ratio:4/5}
.mosaico img{width:100%;height:100%;object-fit:cover}.mosaico figure+figure img{position:absolute;inset:0}
.mosaico figcaption{position:absolute;left:12px;bottom:12px;padding:5px 12px;border-radius:999px;background:#fffdf9e6;font-size:.68rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--tinta)}
.especialidades{border-block:1px solid var(--linha);padding:18px 16px;margin:0;text-align:center;font-family:var(--serif);font-style:italic;font-size:clamp(1.05rem,1.8vw,1.35rem);color:var(--tinta-2)}
.especialidades span{white-space:nowrap}.especialidades i{font-style:normal;color:var(--rosa);margin:0 .7em;font-size:.7em;vertical-align:middle}
@media(max-width:900px){.abertura-grid{grid-template-columns:1fr;gap:28px}.abertura-texto{display:contents}
.abertura-topo{order:1}.mosaico{order:2}.abertura-baixo{order:3}.frase{margin:16px 0 0}.abertura-acoes{margin:0 0 22px}.abertura-intro{margin-bottom:22px}}
@media(max-width:520px){.eyebrow{letter-spacing:.2em}.especialidades{font-size:.98rem;line-height:1.9}.especialidades i{margin:0 .45em}.abertura h1{font-size:clamp(2.5rem,11.6vw,3.3rem)}.mosaico{gap:8px}.mosaico figcaption{left:8px;bottom:8px;font-size:.58rem;padding:4px 9px;letter-spacing:.12em}.abertura-acoes .botao{width:100%}}

/* portfólio: abas por categoria, grade e tela cheia */
.abas{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin:0 auto clamp(26px,4vw,40px)}
.aba{min-height:46px;padding:10px 22px;border:1px solid var(--linha);border-radius:999px;font-size:.74rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;transition:background .2s,color .2s,border-color .2s}
.aba small{font-size:.92em;opacity:.55;margin-left:6px;letter-spacing:0}
.aba[aria-selected="true"]{background:var(--tinta);border-color:var(--tinta);color:var(--fundo)}
.aba:hover:not([aria-selected="true"]){border-color:var(--tinta-2)}
.js .paineis{display:grid}.js .painel{grid-area:1/1}.js .painel:not(.ativo){visibility:hidden;pointer-events:none}
.painel-titulo{font-size:1.6rem;margin:36px 0 18px}.js .painel-titulo{display:none}
.galeria{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-flow:dense;gap:10px}
.g-item{position:relative;display:block;width:100%;overflow:hidden;background:var(--areia);cursor:zoom-in}
.g-item::before{content:"";display:block;padding-top:125%}.g-l{grid-column:span 2}.g-l::before{padding-top:66.6%}
.g-item img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1),filter .4s}
.g-item:hover img{transform:scale(1.035)}.g-item:focus-visible{outline-offset:-3px}
.galeria-nota{text-align:center;color:var(--tinta-2);font-size:.9rem;margin:26px 0 0}
@media(max-width:760px){.abas{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.aba{padding:10px 4px;letter-spacing:.06em;font-size:.7rem}.aba small{display:none}.galeria{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}}
.lb{position:fixed;inset:0;z-index:200;background:#18120e;color:#f3ebe2;display:flex;flex-direction:column;visibility:hidden;opacity:0;pointer-events:none;transition:opacity .28s ease,visibility 0s linear .28s}
.lb.aberto{visibility:visible;opacity:1;pointer-events:auto;transition:opacity .28s ease}
.lb-topo{display:flex;align-items:center;gap:14px;padding:14px 14px 10px 20px;font-size:.74rem;letter-spacing:.2em;text-transform:uppercase}
.lb-cat{color:#d9b9a6}.lb-cont{opacity:.75;letter-spacing:.1em}
.lb-fechar{margin-left:auto;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;border:1px solid #ffffff2e}.lb-fechar svg{width:22px;height:22px}
.lb-trilho{flex:1;min-height:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior:contain;scrollbar-width:none}
.lb-trilho::-webkit-scrollbar{display:none}
.lb-slide{flex:0 0 100%;height:100%;scroll-snap-align:center;scroll-snap-stop:always;display:flex;align-items:center;justify-content:center;padding:0 clamp(0px,5vw,80px) 14px}
.lb-slide img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}
.lb-seta{position:absolute;top:50%;width:52px;height:52px;margin-top:-26px;border-radius:50%;display:grid;place-items:center;background:#ffffff14;color:#fff}
.lb-seta svg{width:22px;height:22px}.lb-ant{left:18px}.lb-ant svg{transform:rotate(180deg)}.lb-prox{right:18px}.lb-seta:disabled{opacity:.25}
.lb-dica{text-align:center;font-size:.76rem;letter-spacing:.06em;opacity:.6;padding:0 0 16px}
@media(max-width:760px){.lb-seta{display:none}.lb-slide{padding:0 0 10px}}@media(min-width:761px){.lb-dica{display:none}}

/* sobre */
.sobre-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(36px,6vw,96px);align-items:center}
.sobre-foto{position:relative;margin:0}.sobre-foto img{width:100%;aspect-ratio:4/5;object-fit:cover}
.sobre-foto::before{content:"";position:absolute;inset:-16px 16px 16px -16px;border:1px solid var(--rosa);opacity:.55;z-index:-1}
.sobre-texto p{color:var(--tinta-2)}.sobre-texto h2{margin-bottom:26px}
.citacao{margin:30px 0;padding:0 0 0 26px;border-left:1px solid var(--rosa);font-family:var(--serif);font-style:italic;font-size:clamp(1.35rem,2.1vw,1.7rem);line-height:1.32;color:var(--tinta)}
.citacao footer{font-family:var(--sans);font-style:normal;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--acento);margin-top:14px}
.numeros{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:34px 0 0;padding:0;list-style:none}
.numeros li{border-top:1px solid var(--linha);padding-top:14px;font-size:.84rem;line-height:1.4;color:var(--tinta-2)}
.numeros b{display:block;font-family:var(--serif);font-weight:500;font-size:2.1rem;line-height:1.1;color:var(--tinta)}
@media(max-width:900px){.sobre-grid{grid-template-columns:1fr}.sobre-foto{max-width:460px;margin-left:16px}}
@media(max-width:520px){.numeros{gap:12px}.numeros b{font-size:1.65rem}.numeros li{font-size:.78rem}}

/* jornada */
.jornada{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 clamp(24px,4vw,56px);counter-reset:passo}
.jornada li{counter-increment:passo;border-top:1px solid var(--linha);padding:26px 0 34px}
.jornada li::before{content:counter(passo,decimal-leading-zero);display:block;font-family:var(--serif);font-style:italic;color:var(--rosa);font-size:1.15rem;margin-bottom:10px}
.jornada h3{font-size:1.75rem;margin-bottom:4px}.jornada .sub{font-family:var(--serif);font-style:italic;color:var(--acento);font-size:1.15rem;margin:0 0 12px}
.jornada p{color:var(--tinta-2);font-size:.98rem;margin:0}
.fonte{font-size:.8rem;color:var(--tinta-2);text-align:center;margin:18px 0 0;opacity:.85}
@media(max-width:900px){.jornada{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.jornada{grid-template-columns:1fr}.jornada li{padding:22px 0 26px}}

/* bloco e página de Natal */
.natal{background:var(--cafe);color:var(--claro)}
.natal .eyebrow{color:#e2b9a4}.natal h2 em{color:#e9b8a2}.natal p{color:#e2d6cb}
.natal-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(32px,6vw,88px);align-items:center}
.natal-foto{margin:0}.natal-foto img{width:100%;aspect-ratio:3/2;object-fit:cover}
.natal-foto figcaption,.legenda{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;opacity:.7;margin-top:12px}
.contador{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 12px;margin:26px 0 8px}
.contador b{font-family:var(--serif);font-size:3rem;font-weight:500;line-height:1}
.contador span{font-size:1rem}
.exemplo{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border:1px dashed currentColor;border-radius:999px;font-size:.76rem;letter-spacing:.04em;line-height:1.35;opacity:.9}
.exemplo svg{width:14px;height:14px;flex:none}
.proximos{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 28px;padding:0;list-style:none}
.proximos a{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;border:1px solid #ffffff40;text-decoration:none;font-size:.86rem;transition:background .2s}
.proximos a:hover,.proximos a.escolhido{background:#fff;color:var(--cafe)}.proximos small{opacity:.7}
.natal .botao{background:#f3e7dc;border-color:#f3e7dc;color:var(--cafe)}.natal .botao:hover{background:#fff;border-color:#fff}
@media(max-width:900px){.natal-grid{grid-template-columns:1fr}.natal-foto{order:-1}}
.n-abertura{padding:clamp(28px,5vw,64px) 0 clamp(60px,8vw,104px)}
.n-abertura-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(32px,5vw,72px);align-items:center}
.n-abertura h1{font-size:clamp(3rem,6.2vw,5.4rem)}
.n-abertura .citacao{font-size:clamp(1.25rem,1.9vw,1.55rem);margin:26px 0}
.n-abertura .foto img{width:100%;aspect-ratio:3/2;object-fit:cover}.n-abertura .foto{margin:0}
@media(max-width:900px){.n-abertura-grid{grid-template-columns:1fr}.n-abertura .foto{order:-1}}
.ensaio-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6vw,88px);align-items:center}
.itens{list-style:none;margin:26px 0 0;padding:0}
.itens li{display:flex;gap:14px;align-items:flex-start;padding:15px 0;border-top:1px solid var(--linha)}
.itens svg{width:18px;height:18px;flex:none;margin-top:5px;color:var(--acento)}
.cenario{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cenario figure{margin:0;overflow:hidden;background:var(--areia)}
.cenario figure:first-child{grid-row:span 2}.cenario img{width:100%;height:100%;object-fit:cover}
.cenario-legenda{grid-column:1/-1;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--tinta-2);margin:6px 0 0}
@media(max-width:900px){.ensaio-grid{grid-template-columns:1fr}}
.agenda-topo{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:18px 32px;margin-bottom:28px}
.agenda-topo .contador{margin:0}.agenda-topo .contador b{color:var(--acento)}
.agenda-aviso{flex-basis:100%;margin:0;color:var(--tinta-2);font-size:.95rem;max-width:760px}
.grade-dias{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.dia{background:var(--papel);border:1px solid var(--linha);padding:18px 18px 14px;display:grid;grid-template-columns:auto 1fr;gap:4px 18px;align-items:start}
.dia-nome{display:grid;justify-items:center;min-width:56px;line-height:1.1;padding-top:2px}
.dia-nome b{font-family:var(--serif);font-weight:500;font-size:2.4rem;line-height:1}.dia-nome span{font-size:.78rem;letter-spacing:.18em;text-transform:uppercase}
.dia-nome small{font-size:.7rem;color:var(--tinta-2);margin-top:2px}
.dia-horas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.hora{display:grid;place-items:center;min-height:42px;border:1px solid var(--acento);color:var(--acento-escuro);text-decoration:none;font-weight:500;font-size:.92rem;border-radius:999px;transition:background .2s,color .2s}
a.hora:hover,a.hora.escolhido{background:var(--acento);color:#fff}
.hora.is-reservado{border-color:var(--linha);color:#a3958b;background:transparent;cursor:not-allowed;font-weight:400}.hora s{text-decoration-thickness:1px}
.dia-resta{grid-column:2;margin:6px 0 0;font-size:.74rem;letter-spacing:.06em;color:var(--tinta-2)}
.legenda-grade{display:flex;flex-wrap:wrap;gap:8px 22px;margin:18px 0 0;font-size:.82rem;color:var(--tinta-2)}
.legenda-grade span{display:inline-flex;align-items:center;gap:8px}.legenda-grade i{width:22px;height:14px;border-radius:999px;border:1px solid var(--acento)}.legenda-grade i.r{border-color:var(--linha);background:repeating-linear-gradient(-45deg,transparent 0 3px,var(--linha) 3px 4px)}
@media(max-width:1000px){.grade-dias{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.grade-dias{grid-template-columns:1fr}.dia{padding:14px}}
.passos{list-style:none;margin:44px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;counter-reset:p}
.passos li{counter-increment:p;padding:20px 0 0;border-top:1px solid var(--linha);color:var(--tinta-2);font-size:.96rem}
.passos li::before{content:counter(p);display:grid;place-items:center;width:32px;height:32px;border-radius:50%;border:1px solid var(--rosa);color:var(--acento);font-family:var(--serif);font-size:1.1rem;margin-bottom:12px}
.passos b{display:block;color:var(--tinta);font-weight:500;margin-bottom:2px}
@media(max-width:760px){.passos{grid-template-columns:1fr}}

/* avaliações (cartões montados pelo runtime) */
.avaliacoes-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:36px}
.avaliacoes-topo h2{max-width:620px}
.nota-google{display:flex;align-items:center;gap:16px;text-decoration:none}
.nota-google>b{font-family:var(--serif);font-size:3.4rem;font-weight:500;line-height:1}
.nota-google span{display:grid;line-height:1.35;font-size:.86rem;color:var(--tinta-2)}.nota-google .estrelas{color:#c4935a;letter-spacing:3px;font-size:1rem}
.carousel{min-width:0}.carousel-track{list-style:none;padding:0;margin:0;display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain}
.carousel-track::-webkit-scrollbar{display:none}.carousel-track>li{scroll-snap-align:start;min-width:0;flex:0 0 calc((100% - 32px)/3);display:flex}
.review-card{background:var(--papel);border:1px solid var(--linha);padding:28px 28px 24px;display:flex;flex-direction:column;width:100%}
.review-card-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}
.stars{color:#c4935a;letter-spacing:2px;font-size:.9rem}.review-tag{font-size:.64rem;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--acento);text-align:right}
.review-card blockquote{margin:0 0 22px;font-family:var(--serif);font-style:italic;font-size:1.32rem;line-height:1.36;flex:1}
.review-card blockquote.is-long{font-size:1.22rem}
.review-person{display:flex;align-items:center;gap:12px;font-size:.86rem;border-top:1px solid var(--linha);padding-top:16px}
.review-avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--rosa);color:var(--acento);font-family:var(--serif);font-size:1rem;flex:none}
.review-person strong{display:block;font-weight:500}.review-person a{color:var(--tinta-2);font-size:.78rem;text-decoration:none}
.carousel-footer{display:flex;justify-content:flex-end;padding-top:24px}.carousel-controls{display:flex;gap:12px;align-items:center}
.arrow-button{width:46px;height:46px;display:grid;place-content:center;border:1px solid var(--linha);border-radius:50%;background:var(--papel);font-size:1.15rem;transition:background .2s}
.arrow-button:hover:not(:disabled){background:var(--areia)}.arrow-button:disabled{opacity:.3;cursor:default}
.carousel-dots{display:flex;gap:2px}.carousel-dots button{width:22px;height:30px;display:grid;place-content:center}
.carousel-dots button::after{content:"";width:6px;height:6px;border-radius:50%;background:#d6c7ba;transition:width .2s}.carousel-dots button[aria-current="true"]::after{width:18px;border-radius:999px;background:var(--acento)}
@media(max-width:980px){.carousel-track>li{flex-basis:calc((100% - 16px)/2)}}@media(max-width:640px){.carousel-track>li{flex-basis:88%}.review-card{padding:22px 20px 18px}.review-card blockquote{font-size:1.2rem}.carousel-dots{display:none}}

/* contato */
.contato-grid{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:clamp(32px,6vw,80px);align-items:stretch}
.canais{list-style:none;margin:28px 0 30px;padding:0}
.canais>li{display:flex;gap:16px;align-items:flex-start;padding:16px 0;border-top:1px solid var(--linha)}
.canais svg{width:22px;height:22px;flex:none;color:var(--acento);margin-top:3px}
.canais b{display:block;font-weight:500}.canais span,.canais a{color:var(--tinta-2);text-decoration:none;font-size:.96rem}
.canais a:hover{color:var(--tinta)}
.hours{list-style:none;margin:4px 0 0;padding:0;font-size:.92rem;color:var(--tinta-2)}.hours li{display:flex;justify-content:space-between;gap:18px;width:min(280px,100%);padding:2px 0}.hours li.is-today{color:var(--tinta);font-weight:500}
.mapa{position:relative;min-height:380px;background:var(--papel);border:1px solid var(--linha)}.mapa iframe{position:absolute;inset:0;width:100%;height:100%;border:0;filter:sepia(.18) saturate(.85)}
.mapa-alt{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:10px;padding:24px;text-align:center;text-decoration:none;color:var(--tinta-2)}
.mapa-alt svg{width:34px;height:34px;color:var(--acento)}.mapa-alt b{font-family:var(--serif);font-weight:500;font-size:1.5rem;color:var(--tinta)}.mapa-alt span{font-size:.92rem}.mapa-alt .link{margin-top:8px;color:var(--tinta)}
@media(max-width:900px){.contato-grid{grid-template-columns:1fr}.mapa{min-height:300px}}

/* rodapé */
.rodape{background:var(--cafe);color:#d9cdc2;padding:64px 0 34px;text-align:center}
.rodape img{width:min(240px,62vw);margin:0 auto 18px}
.rodape-frase{font-family:var(--serif);font-style:italic;font-size:1.45rem;color:#efe4d9;margin:0 0 22px}
.rodape nav{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 26px;margin-bottom:30px}
.rodape nav a{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;text-decoration:none}
.rodape small{display:block;font-size:.78rem;color:#a99b8f;line-height:1.6}
.flutuante{position:fixed;right:18px;bottom:18px;z-index:70;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#2f7d55;color:#fff;box-shadow:0 12px 30px #1f4a3340}
.flutuante svg{width:28px;height:28px}
@media(max-width:520px){.flutuante{width:54px;height:54px;right:14px;bottom:14px}.rz-pilula{left:14px;bottom:20px}}
'''

JS = r'''
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- camada da Renderiza (valores e prazo só no window.RZ) ----------
  const RZ = window.RZ;
  if (RZ) {
    const [a, m, d] = RZ.validoAte.split("-");
    const data = d + "/" + m + "/" + a;
    const wa = msg => "https://wa.me/" + RZ.whatsapp + "?text=" + encodeURIComponent(msg);
    $$("[data-rz=preco]").forEach(e => e.textContent = RZ.precoPix + " no Pix ou " + RZ.parcelado);
    $$("[data-rz=nota]").forEach(e => e.textContent = RZ.notaPreco);
    $$("[data-rz=validade]").forEach(e => e.textContent = data);
    $$("[data-rz=curta]").forEach(e => e.textContent = RZ.precoPix + " · até " + d + "/" + m);
    $$("[data-rz-garantir]").forEach(e => e.href = wa(RZ.msgGarantir));
    $$("[data-rz-negociar]").forEach(e => e.href = wa(RZ.msgNegociar));
  }
  const faixa = $(".rz-faixa"), abrir = $(".rz-abrir"), mais = $(".rz-mais");
  if (faixa && abrir && mais) abrir.addEventListener("click", () => {
    const aberta = !faixa.classList.contains("aberta");
    faixa.classList.toggle("aberta", aberta); mais.hidden = !aberta; abrir.setAttribute("aria-expanded", String(aberta));
  });
  const pilula = $(".rz-pilula"), folha = $(".rz-folha");
  if (pilula && folha) {
    const mostrar = () => pilula.classList.toggle("visivel", faixa ? faixa.getBoundingClientRect().bottom < -40 : scrollY > 300);
    addEventListener("scroll", mostrar, { passive: true }); mostrar();
    const fechar = () => { folha.hidden = true; pilula.setAttribute("aria-expanded", "false"); };
    pilula.addEventListener("click", () => { const abre = folha.hidden; folha.hidden = !abre; pilula.setAttribute("aria-expanded", String(abre)); if (abre) $(".rz-folha-fechar", folha).focus(); });
    $(".rz-folha-fechar", folha).addEventListener("click", () => { fechar(); pilula.focus(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !folha.hidden) fechar(); });
  }
  // Links entre o site e a página de Natal: no ar o endereço não tem ".html" (/demo/<pasta> e /demo/<pasta>/natal)
  // e leva junto o ?c= do link do lead; aberto do computador (file://), vai para o arquivo.
  if (location.protocol !== "file:") {
    const base = location.pathname.replace(/\/(index|natal)(\.html)?$/, "").replace(/\/$/, "");
    const q = location.search.replace(/([?&])video=1&?/, "$1").replace(/[?&]$/, "");
    $$("[data-pagina]").forEach(e => { const [pag, hash] = e.getAttribute("href").split("#"); e.href = base + (e.dataset.pagina === "natal" ? "/natal" : "") + q + (hash ? "#" + hash : ""); });
  }

  // ---------- topo ----------
  const topo = $(".site-header");
  if (topo) { const f = () => topo.classList.toggle("rolou", topo.getBoundingClientRect().top <= 0 && scrollY > 10); addEventListener("scroll", f, { passive: true }); f(); }

  // ---------- abas do portfólio ----------
  const abas = $$("[role=tab]");
  const escolher = (aba, foco) => {
    abas.forEach(a => {
      const sim = a === aba, p = document.getElementById(a.getAttribute("aria-controls"));
      a.setAttribute("aria-selected", String(sim)); a.tabIndex = sim ? 0 : -1;
      if (p) { p.classList.toggle("ativo", sim); p.setAttribute("aria-hidden", String(!sim)); $$("button", p).forEach(b => b.tabIndex = sim ? 0 : -1); }
    });
    if (foco) aba.focus();
  };
  abas.forEach((a, i) => {
    a.addEventListener("click", () => escolher(a));
    a.addEventListener("keydown", e => {
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 }[e.key];
      if (k === undefined) return; e.preventDefault(); escolher(abas[(k + abas.length) % abas.length], true);
    });
  });
  const ativa = abas.find(a => a.getAttribute("aria-selected") === "true"); if (ativa) escolher(ativa);

  // ---------- tela cheia (toque abre; no celular passa para o lado; setas e teclado no computador) ----------
  const lb = $(".lb");
  if (lb) {
    const trilho = $(".lb-trilho", lb), cat = $(".lb-cat", lb), cont = $(".lb-cont", lb), ant = $(".lb-ant", lb), prox = $(".lb-prox", lb), fecharB = $(".lb-fechar", lb);
    let fotos = [], atual = 0, origem = null;
    const montar = galeria => {
      fotos = $$(".g-item img", galeria);
      trilho.replaceChildren(...fotos.map((f, i) => {
        const s = document.createElement("div"); s.className = "lb-slide"; s.setAttribute("role", "group"); s.setAttribute("aria-label", (i + 1) + " de " + fotos.length);
        const im = document.createElement("img"); im.src = f.currentSrc || f.src; im.alt = f.alt; im.decoding = "async"; s.append(im); return s;
      }));
      cat.textContent = galeria.dataset.nome || "";
    };
    const largura = () => trilho.clientWidth || innerWidth;
    const marcar = () => {
      atual = Math.max(0, Math.min(fotos.length - 1, Math.round(trilho.scrollLeft / largura())));
      cont.textContent = (atual + 1) + " / " + fotos.length; ant.disabled = atual === 0; prox.disabled = atual === fotos.length - 1;
    };
    const ir = (i, suave) => { trilho.scrollTo({ left: i * largura(), behavior: suave ? "smooth" : "auto" }); };
    const abrirLb = (galeria, i, botao) => {
      origem = botao; montar(galeria); trilho.style.scrollSnapType = ""; trilho.style.scrollBehavior = "";
      lb.classList.add("aberto"); lb.setAttribute("aria-hidden", "false"); document.documentElement.style.overflow = "hidden";
      ir(i, false); marcar(); fecharB.focus({ preventScroll: true });
    };
    const fecharLb = () => {
      lb.classList.remove("aberto"); lb.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = "";
      if (origem) origem.focus({ preventScroll: true });
    };
    $$(".galeria").forEach(g => $$(".g-item", g).forEach((b, i) => b.addEventListener("click", () => abrirLb(g, i, b))));
    trilho.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });
    ant.addEventListener("click", () => ir(atual - 1, true)); prox.addEventListener("click", () => ir(atual + 1, true));
    fecharB.addEventListener("click", fecharLb);
    document.addEventListener("keydown", e => {
      if (!lb.classList.contains("aberto")) return;
      if (e.key === "Escape") fecharLb(); else if (e.key === "ArrowRight") ir(atual + 1, true); else if (e.key === "ArrowLeft") ir(atual - 1, true);
      else if (e.key === "Tab") { e.preventDefault(); (document.activeElement === fecharB ? (prox.disabled ? fecharB : prox) : fecharB).focus(); }
    });
    addEventListener("resize", () => { if (lb.classList.contains("aberto")) ir(atual, false); });
    const primeira = $(".galeria"); if (primeira) montar(primeira); // já montado: o vídeo mede o passo das fotos
  }

  // No vídeo (?video=1) o toque só marca o horário: nada abre o WhatsApp durante a gravação.
  if (document.documentElement.classList.contains("modo-video")) document.addEventListener("click", e => { if (e.target.closest('a[href^="https://wa.me"]')) e.preventDefault(); }, true);
  // ---------- horários: o toque marca o escolhido (o link já abre o WhatsApp com a mensagem pronta) ----------
  $$("a.hora, .proximos a").forEach(a => a.addEventListener("click", () => { $$(".escolhido").forEach(x => x.classList.remove("escolhido")); a.classList.add("escolhido"); }));
})();
'''


def faixa_rz(cfg, pagina):
    """A camada da Renderiza no topo: o que foi montado (com a troca entre as duas páginas), o preço e o prazo.
    Os textos de preço e prazo saem do window.RZ; os daqui são o mesmo valor, para quem abre sem JavaScript."""
    r = cfg['renderiza']; d = r['valido_ate'].split('-')
    site_atual = ' aria-current="page"' if pagina == 'site' else ''
    natal_atual = ' aria-current="page"' if pagina == 'natal' else ''
    troca = (f'<nav class="rz-troca" aria-label="As páginas montadas para você"><a href="index.html" data-pagina="site"{site_atual}>O seu site</a>'
             f'<a href="natal.html" data-pagina="natal"{natal_atual}>A sua página de Natal</a></nav>')
    nome = esc(cfg['renderiza'].get('ola', 'Ana'))
    return f'''<aside class="rz-faixa" aria-label="Recado da Renderiza">
  <div class="rz-in">
    <p class="rz-ola" style="margin:0"><svg aria-hidden="true"><use href="#brilho"/></svg>{nome}, a Renderiza montou para você:</p>
    {troca}
    <p class="rz-preco" style="margin:0"><span>Tudo incluso: <b data-rz="preco">{esc(r["preco_pix"])} no Pix ou {esc(r["parcelado"])}</b> <small>(<span data-rz="nota">{esc(r["nota_preco"])}</span>)</small></span>
      <button class="rz-abrir" type="button" aria-expanded="false" aria-controls="rz-mais" aria-label="Ver a condição e os botões"><span class="rz-abrir-txt">Ver condição</span> <svg aria-hidden="true"><use href="#seta"/></svg></button></p>
  </div>
  <div class="rz-mais" id="rz-mais" hidden>
    <div class="rz-in">
      <p class="rz-prazo">Tudo incluso: o site e a página de Natal, prontos, por <b data-rz="preco">{esc(r["preco_pix"])} no Pix ou {esc(r["parcelado"])}</b> (<span data-rz="nota">{esc(r["nota_preco"])}</span>). Condição válida até <b data-rz="validade">{d[2]}/{d[1]}/{d[0]}</b>, o dia em que esta demonstração sai do ar.</p>
      <div class="rz-acoes"><a class="rz-botao" data-rz-garantir href="https://wa.me/{r["whatsapp"]}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#whats"/></svg>Garantir o meu</a><a class="rz-botao rz-botao--linha" data-rz-negociar href="https://wa.me/{r["whatsapp"]}" target="_blank" rel="noopener noreferrer">Negociar</a></div>
      <span class="rz-assina">Demonstração feita pela Renderiza · renderizaweb.com.br</span>
    </div>
  </div>
</aside>'''


def pilula_rz(cfg, pagina):
    r = cfg['renderiza']; d = r['valido_ate'].split('-')
    site_atual = ' aria-current="page"' if pagina == 'site' else ''
    natal_atual = ' aria-current="page"' if pagina == 'natal' else ''
    return f'''<button class="rz-pilula" type="button" aria-expanded="false" aria-controls="rz-folha"><svg aria-hidden="true"><use href="#brilho"/></svg><b>Renderiza</b> <span data-rz="curta">{esc(r["preco_pix"])} · até {d[2]}/{d[1]}</span></button>
<div class="rz-folha" id="rz-folha" role="dialog" aria-label="O que a Renderiza montou" hidden>
  <button class="rz-folha-fechar" type="button" aria-label="Fechar"><svg aria-hidden="true"><use href="#fechar"/></svg></button>
  <h2>{esc(r.get("ola", "Ana"))}, a Renderiza montou para você</h2>
  <nav class="rz-troca" aria-label="As páginas montadas para você"><a href="index.html" data-pagina="site"{site_atual}>O seu site</a><a href="natal.html" data-pagina="natal"{natal_atual}>A sua página de Natal</a></nav>
  <p>Tudo incluso: <b data-rz="preco">{esc(r["preco_pix"])} no Pix ou {esc(r["parcelado"])}</b> (<span data-rz="nota">{esc(r["nota_preco"])}</span>).</p>
  <p>Condição válida até <b data-rz="validade">{d[2]}/{d[1]}/{d[0]}</b>, o dia em que esta demonstração sai do ar.</p>
  <div class="rz-acoes"><a class="rz-botao" data-rz-garantir href="https://wa.me/{r["whatsapp"]}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#whats"/></svg>Garantir o meu</a><a class="rz-botao rz-botao--linha" data-rz-negociar href="https://wa.me/{r["whatsapp"]}" target="_blank" rel="noopener noreferrer">Negociar</a></div>
</div>'''


def rz_js(cfg):
    r = cfg['renderiza']
    dados = {'whatsapp': r['whatsapp'], 'precoPix': r['preco_pix'], 'parcelado': r['parcelado'], 'notaPreco': r['nota_preco'],
             'validoAte': r['valido_ate'], 'msgGarantir': r['msg_garantir'], 'msgNegociar': r['msg_negociar']}
    linhas = ',\n'.join(f'  {k}: {json.dumps(v, ensure_ascii=False)}' for k, v in dados.items())
    return ('<script>\n// Oferta da Renderiza nesta demo (provisória): troque aqui os valores e o prazo. O prazo é o dia em que a demo\n'
            '// sai do ar (vale_ate no painel), sem contagem regressiva.\nwindow.RZ = {\n' + linhas + '\n};\n</script>')


def cabecalho(cfg, F, pagina, nav, cta):
    simb = F.png(cfg['marca_img']['simbolo'], 120)
    inicio = 'index.html' if pagina == 'natal' else '#inicio'
    dp = ' data-pagina="site"' if pagina == 'natal' else ''
    links = ''.join(f'<a href="{esc(h)}"{" data-pagina=" + chr(34) + p + chr(34) if p else ""}>{esc(t)}</a>' for h, t, p in nav)
    return f'''<header class="site-header">
  <div class="container topo-in">
    <a class="marca" href="{inicio}"{dp} aria-label="{esc(cfg["marca"])}, início"><img src="{simb[0]}" width="48" height="48" alt=""><span class="marca-nome"><b>{esc(quem(cfg)["nome"])}</b><i>{esc(quem(cfg)["script"])}</i></span></a>
    <nav class="nav" aria-label="Seções">{links}</nav>
    <a class="botao topo-cta" {cta}</a>
    <button class="menu-botao" type="button" data-menu-button aria-expanded="false" aria-controls="menu-mobile" aria-label="Abrir menu"><span></span></button>
    <nav class="menu-mobile" id="menu-mobile" aria-label="Menu" hidden>{links}<a class="botao" {cta}</a></nav>
  </div>
</header>'''


def head(cfg, F, titulo, descricao, comentario):
    fav = F.png(cfg['marca_img']['favicon'], 64, fmt='png')
    c = cfg['cores']
    linha = c.get('linha', '#e6dbcf')
    css = T(CSS, fundo=c['fundo'], papel=c['papel'], areia=c['areia'], linha=linha, tinta=c['tinta'], tinta2=c['tinta2'],
            rosa=c['rosa'], acento=c['acento'], acento_escuro=c['acento_escuro'], cafe=c['cafe'])
    return f'''<!doctype html>
<!-- {comentario} -->
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="{esc(descricao)}">
  <meta name="theme-color" content="{c['fundo']}">
  <meta name="robots" content="noindex,nofollow">
  <title>{esc(titulo)}</title>
  <link rel="icon" type="image/png" href="{fav[0]}">
  <script>document.documentElement.classList.add("js");if(/[?&]video=1(&|$)/.test(location.search))document.documentElement.classList.add("modo-video");</script>
  {FONTES}
  <style>{css}</style>
</head>'''


def rodape(cfg, F, links):
    logo = F.png(cfg['marca_img']['logo_claro'], 480)
    nav = ''.join(f'<a href="{esc(h)}"{" data-pagina=" + chr(34) + p + chr(34) if p else ""}>{esc(t)}</a>' for h, t, p in links)
    v = cfg['site']['contato']
    return f'''<footer class="rodape">
  <div class="container">
    <img src="{logo[0]}" width="{logo[1]}" height="{logo[2]}" alt="{esc(cfg["marca"])}" loading="lazy">
    <p class="rodape-frase">{esc(cfg["slogan"])}</p>
    <nav aria-label="Links">{nav}<a data-whatsapp href="#">WhatsApp</a><a data-instagram href="#" target="_blank" rel="noopener noreferrer">Instagram</a></nav>
    <small>© <span data-year>2026</span> {esc(cfg["marca"])} · {esc(" · ".join(v["endereco"]))}</small>
  </div>
</footer>
<a class="flutuante" data-whatsapp href="#" aria-label="Conversar com a {esc(cfg["dona"])} no WhatsApp"><svg aria-hidden="true"><use href="#whats"/></svg></a>'''


def galeria_html(F, gal, ativa):
    itens = []
    for i, f in enumerate(gal['fotos']):
        forma = f.get('f', 'p')
        u = F.uri(f, 1200, 800) if forma == 'l' else F.uri(f, 880, 1100)
        pos = f.get('pos', '50% 40%')
        alt = f.get('alt') or gal['nome']
        itens.append(f'<button class="g-item g-{forma}" type="button" aria-label="{esc("Abrir em tela cheia: " + alt)}">'
                     f'<img src="{u[0]}" width="{u[1]}" height="{u[2]}" alt="{esc(alt)}" loading="lazy" style="object-position:{pos}"></button>')
    classe = 'painel ativo' if ativa else 'painel'
    escondido = '' if ativa else ' aria-hidden="true"'
    return (f'<div class="{classe}" id="painel-{gal["id"]}" role="tabpanel" aria-labelledby="aba-{gal["id"]}"{escondido}>'
            f'<h3 class="painel-titulo">{esc(gal["nome"])}</h3>'
            f'<div class="galeria" data-nome="{esc(gal["nome"])}">{"".join(itens)}</div></div>')


def lightbox():
    return '''<div class="lb" role="dialog" aria-modal="true" aria-label="Fotos em tela cheia" aria-hidden="true">
  <div class="lb-topo"><span class="lb-cat"></span><span class="lb-cont"></span><button class="lb-fechar" type="button" aria-label="Fechar"><svg aria-hidden="true"><use href="#fechar"/></svg></button></div>
  <div class="lb-trilho" tabindex="-1"></div>
  <p class="lb-dica" style="margin:0">Passe para o lado para ver a próxima</p>
  <button class="lb-seta lb-ant" type="button" aria-label="Foto anterior"><svg aria-hidden="true"><use href="#seta"/></svg></button>
  <button class="lb-seta lb-prox" type="button" aria-label="Próxima foto"><svg aria-hidden="true"><use href="#seta"/></svg></button>
</div>'''


def avaliacoes_html(cfg, titulo, sub, id_secao='depoimentos'):
    nota = G.mostrar_nota(cfg)
    placar = (f'<b>{esc(cfg["google_nota"])}</b>' if nota else '') + f'<span><span class="estrelas" aria-hidden="true">★★★★★</span>{esc(cfg["google_total"])} avaliações no Google</span>'
    return f'''<section class="secao" id="{id_secao}" aria-labelledby="{id_secao}-titulo">
  <div class="container">
    <div class="avaliacoes-topo reveal">
      <div><p class="eyebrow">{esc(sub)}</p><h2 id="{id_secao}-titulo">{titulo}</h2></div>
      <a class="nota-google" data-reviews-link href="#" target="_blank" rel="noopener noreferrer" aria-label="Ver as avaliações no Google">{placar}</a>
    </div>
    <div class="carousel reveal" data-carousel role="region" aria-roledescription="carrossel" aria-label="Avaliações do Google">
      <ul class="carousel-track" id="reviews-track" data-reviews tabindex="0" aria-label="Avaliações; use as setas para navegar"></ul>
      <div class="carousel-footer"><div class="carousel-controls"><button class="arrow-button" type="button" data-prev aria-controls="reviews-track" aria-label="Avaliações anteriores">←</button><div class="carousel-dots" data-dots></div><button class="arrow-button" type="button" data-next aria-controls="reviews-track" aria-label="Próximas avaliações">→</button><span class="sr-only" data-status aria-live="polite"></span></div></div>
    </div>
  </div>
</section>'''


def wa_botao(texto, classe='botao'):
    return f'class="{classe}" data-whatsapp href="#"><svg aria-hidden="true"><use href="#whats"/></svg>{esc(texto)}'


# ---------- o site ----------
def pagina_site(cfg, F, google, horas, dias, total, livres):
    s = cfg['site']; h = s['hero']
    hero1 = F.uri(h['fotos'][0], 0, 0, fmt='jpeg', q=78, tam=(1000, 1250))
    hero2 = F.uri(h['fotos'][1], 0, 0, q=66, tam=(600, 750))
    hero3 = F.uri(h['fotos'][2], 0, 0, q=66, tam=(600, 750))
    q = quem(cfg)
    nav = [('#portfolio', 'Portfólio', ''), ('#sobre', q['A'], ''), ('#ensaios', 'Ensaios', ''), ('#depoimentos', 'Depoimentos', ''), ('#natal', 'Natal 2026', ''), ('#contato', 'Contato', '')]
    out = [head(cfg, F, s['titulo'], s['descricao'], s['comentario']), '<body class="pagina-site">', SIMBOLOS, faixa_rz(cfg, 'site'),
           cabecalho(cfg, F, 'site', nav, 'data-whatsapp href="#"><svg aria-hidden="true"><use href="#whats"/></svg>Chamar no WhatsApp'),
           '<main id="inicio">']
    nota = G.mostrar_nota(cfg)
    prova = (f'<a class="prova" href="#depoimentos"><span class="estrelas" aria-hidden="true">★★★★★</span>'
             + (f'<b>{esc(cfg["google_nota"])}</b>' if nota else '') + f'<span>{esc(cfg["google_total"])} avaliações no Google</span></a>')
    rot = h.get('rotulos', ['Gestação', 'Newborn', 'Primeiros passos'])
    out.append(f'''<section class="abertura" aria-labelledby="titulo-site">
  <div class="container abertura-grid">
    <div class="abertura-texto">
      <div class="abertura-topo">
        <p class="eyebrow">{esc(h["eyebrow"])}</p>
        <h1 id="titulo-site">{esc(q["nome"])} <span class="script">{esc(q["script"])}</span></h1>
        <p class="frase">{esc(h["frase"])}</p>
      </div>
      <div class="abertura-baixo">
        <p class="abertura-intro">{esc(h["intro"])}</p>
        <div class="abertura-acoes"><a {wa_botao("Agendar pelo WhatsApp")}</a><a class="link" href="#portfolio">Ver o portfólio <svg aria-hidden="true"><use href="#seta"/></svg></a></div>
        {prova}
      </div>
    </div>
    <div class="mosaico">
      <figure class="hero-photo">{img(hero1, h["fotos"][0]["alt"], extra=' fetchpriority="high"')}<figcaption>{esc(rot[0])}</figcaption></figure>
      <figure>{img(hero2, h["fotos"][1]["alt"])}<figcaption>{esc(rot[1])}</figcaption></figure>
      <figure>{img(hero3, h["fotos"][2]["alt"])}<figcaption>{esc(rot[2])}</figcaption></figure>
    </div>
  </div>
</section>
<p class="especialidades">{' <i aria-hidden="true">✦</i> '.join(f'<span>{esc(x)}</span>' for x in h["especialidades"])}</p>''')

    # portfólio
    gals = s['galerias']
    abas = ''.join(f'<button class="aba" type="button" role="tab" id="aba-{g["id"]}" data-aba="{g["id"]}" aria-controls="painel-{g["id"]}" aria-selected="{"true" if i == 0 else "false"}">{esc(g["nome"])}<small>{len(g["fotos"])}</small></button>' for i, g in enumerate(gals))
    paineis = ''.join(galeria_html(F, g, i == 0) for i, g in enumerate(gals))
    p = s['portfolio']
    out.append(f'''<section class="secao" id="portfolio" aria-labelledby="portfolio-titulo">
  <div class="container">
    <div class="cabeca reveal"><p class="eyebrow">{esc(p["eyebrow"])}</p><h2 id="portfolio-titulo">{p["h2"]}</h2><p>{esc(p["p"])}</p></div>
    <div class="abas" role="tablist" aria-label="Categorias do portfólio">{abas}</div>
    <div class="paineis">{paineis}</div>
    <p class="galeria-nota">{esc(p["nota"])}</p>
  </div>
</section>''')

    # sobre
    so = s['sobre']; foto = F.uri(so['foto'], 0, 0, q=70, tam=(760, 950))
    nums = ''.join(f'<li><b>{esc(a)}</b>{esc(b)}</li>' for a, b in so['numeros'])
    ps1 = ''.join(f'<p>{esc(x)}</p>' for x in so['p'])
    ps2 = ''.join(f'<p>{esc(x)}</p>' for x in so.get('p2', []))
    out.append(f'''<section class="secao secao--areia" id="sobre" aria-labelledby="sobre-titulo">
  <div class="container sobre-grid">
    <figure class="sobre-foto reveal">{img(foto, so["foto"]["alt"], extra=' loading="lazy"')}</figure>
    <div class="sobre-texto reveal">
      <p class="eyebrow">{esc(so["eyebrow"])}</p><h2 id="sobre-titulo">{so["h2"]}</h2>
      {ps1}
      <blockquote class="citacao">“{esc(so["citacao"])}”<footer>{esc(so["citacao_quem"])}</footer></blockquote>
      {ps2}
      <ul class="numeros">{nums}</ul>
    </div>
  </div>
</section>''')

    # jornada (os ensaios, nas palavras dela)
    j = s['jornada']
    passos = ''.join(f'<li><h3>{esc(x["nome"])}</h3><p class="sub">{esc(x["sub"])}</p><p>{esc(x["p"])}</p></li>' for x in j['passos'])
    out.append(f'''<section class="secao" id="ensaios" aria-labelledby="ensaios-titulo">
  <div class="container">
    <div class="cabeca reveal"><p class="eyebrow">{esc(j["eyebrow"])}</p><h2 id="ensaios-titulo">{j["h2"]}</h2><p>{esc(j["p"])}</p></div>
    <ol class="jornada reveal">{passos}</ol>
    <p class="fonte">{esc(j["fonte"])}</p>
  </div>
</section>''')

    out.append(avaliacoes_html(cfg, s['avaliacoes_h2'], s.get('avaliacoes_eyebrow', 'Depoimentos')))

    # bloco de Natal (leva à página da campanha)
    n = s['natal_bloco']; nf = F.uri(n['foto'], 0, 0, q=66, tam=(1200, 800))
    prox = ''.join(f'<li><a href="{esc(x["link"])}" target="_blank" rel="noopener noreferrer" data-hora="{esc(d["iso"] + " " + x["h"])}">{esc(d["semana"][:3])} {d["dia"]}/{datetime.date.fromisoformat(d["iso"]).month:02d} <small>·</small> {esc(x["h"])}</a></li>' for d, x in proximos(dias, 4))
    out.append(f'''<section class="secao natal" id="natal" aria-labelledby="natal-titulo">
  <div class="container natal-grid">
    <div class="reveal">
      <p class="eyebrow">{esc(n["eyebrow"])}</p><h2 id="natal-titulo">{n["h2"]}</h2>
      <p style="margin-top:22px">{esc(n["p"])}</p>
      <p class="contador"><b data-restam>{livres}</b> <span>de {total} horários livres</span></p>
      <p class="exemplo"><svg aria-hidden="true"><use href="#cal"/></svg>{esc(cfg["horarios"]["exemplo"])}</p>
      <ul class="proximos" aria-label="O primeiro horário livre de cada sábado">{prox}</ul>
      <a class="botao" href="natal.html#horarios" data-pagina="natal">Ver todos os horários <svg aria-hidden="true"><use href="#seta"/></svg></a>
    </div>
    <figure class="natal-foto reveal">{img(nf, n["foto"]["alt"], extra=' loading="lazy"')}<figcaption>{esc(n["legenda"])}</figcaption></figure>
  </div>
</section>''')

    # contato
    v = s['contato']
    horas_html = ''.join(f'<li data-days="{d}"><span>{esc(nm)}</span><span>{esc(t)}</span></li>' for nm, t, d in G.linhas_horario(horas)) if horas else ''
    out.append(f'''<section class="secao secao--areia" id="contato" aria-labelledby="contato-titulo">
  <div class="container contato-grid">
    <div class="reveal">
      <p class="eyebrow">{esc(v["eyebrow"])}</p><h2 id="contato-titulo">{v["h2"]}</h2>
      <p style="color:var(--tinta-2);margin-top:20px">{esc(v["p"])}</p>
      <ul class="canais">
        <li><svg aria-hidden="true"><use href="#whats"/></svg><div><b>WhatsApp</b><a data-whatsapp href="#">{esc(v["telefone"])}</a></div></li>
        <li><svg aria-hidden="true"><use href="#insta"/></svg><div><b>Instagram</b><a data-instagram href="#" target="_blank" rel="noopener noreferrer">@{esc(cfg["instagram"])} · {esc(cfg["seguidores"])} seguidores</a></div></li>
        <li><svg aria-hidden="true"><use href="#pin"/></svg><div><b>Estúdio</b><a data-directions href="#" target="_blank" rel="noopener noreferrer">{esc(" · ".join(v["endereco"]))}</a></div></li>
        <li><svg aria-hidden="true"><use href="#relogio"/></svg><div><b>Atendimento</b><ul class="hours">{horas_html}</ul></div></li>
      </ul>
      <a {wa_botao("Chamar " + q["a"] + " no WhatsApp")}</a>
    </div>
    <div class="mapa reveal"><a class="mapa-alt" data-directions href="#" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#pin"/></svg><b>Estúdio {esc(q["da"])}</b><span>{esc(" · ".join(v["endereco"]))}</span><span class="link">Como chegar <svg aria-hidden="true" style="width:16px;height:16px"><use href="#seta"/></svg></span></a><iframe data-map-embed title="Mapa do estúdio da {esc(cfg["marca"])}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
  </div>
</section>''')
    out.append('</main>')
    out.append(rodape(cfg, F, [('#portfolio', 'Portfólio', ''), ('#sobre', q['A'], ''), ('natal.html', 'Natal 2026', 'natal')]))
    out.append(lightbox())
    out.append(pilula_rz(cfg, 'site'))
    return out


# ---------- a página de Natal ----------
def pagina_natal(cfg, F, google, horas, dias, total, livres):
    n = cfg['natal']; h = n['hero']
    capa = F.uri(h['foto'], 0, 0, fmt='jpeg', q=76, tam=(1500, 1000))
    q = quem(cfg)
    nav = [('#ensaio', 'O ensaio', ''), ('#horarios', 'Horários', ''), ('#natal-2025', n['galeria']['nome'], ''), ('#depoimentos', 'Depoimentos', ''), ('index.html', 'O site ' + q['da'], 'site')]
    out = [head(cfg, F, n['titulo'], n['descricao'], n['comentario']), '<body class="pagina-natal">', SIMBOLOS, faixa_rz(cfg, 'natal'),
           cabecalho(cfg, F, 'natal', nav, 'href="#horarios"><svg aria-hidden="true"><use href="#cal"/></svg>Escolher horário'),
           '<main id="inicio">']
    out.append(f'''<section class="n-abertura" aria-labelledby="titulo-natal">
  <div class="container n-abertura-grid">
    <div>
      <p class="eyebrow">{esc(h["eyebrow"])}</p>
      <h1 id="titulo-natal">{h["h1"]}</h1>
      <blockquote class="citacao">“{esc(h["citacao"])}”<footer>{esc(h["citacao_quem"])}</footer></blockquote>
      <div class="abertura-acoes" style="margin-bottom:0"><a class="botao" href="#horarios"><svg aria-hidden="true"><use href="#cal"/></svg>Escolher o meu horário</a><a class="link" data-whatsapp href="#">Valores pelo WhatsApp <svg aria-hidden="true"><use href="#seta"/></svg></a></div>
    </div>
    <figure class="foto hero-photo">{img(capa, h["foto"]["alt"], extra=' fetchpriority="high"')}<figcaption class="legenda">{esc(h["legenda"])}</figcaption></figure>
  </div>
</section>''')

    e = n['ensaio']
    itens = ''.join(f'<li><svg aria-hidden="true"><use href="#brilho"/></svg><span>{esc(x)}</span></li>' for x in e['itens'])
    cen = []
    for i, f in enumerate(n['cenario']):
        u = F.uri(f, 0, 0, q=66, tam=(720, 900) if i == 0 else (720, 560))
        cen.append(f'<figure>{img(u, f["alt"], extra=" loading=" + chr(34) + "lazy" + chr(34))}</figure>')
    out.append(f'''<section class="secao secao--areia" id="ensaio" aria-labelledby="ensaio-titulo">
  <div class="container ensaio-grid">
    <div class="reveal">
      <p class="eyebrow">{esc(e["eyebrow"])}</p><h2 id="ensaio-titulo">{e["h2"]}</h2>
      <p style="color:var(--tinta-2);margin-top:22px">{esc(e["p"])}</p>
      <ul class="itens">{itens}</ul>
    </div>
    <div class="cenario reveal">{"".join(cen)}<p class="cenario-legenda">{esc(e["legenda_fotos"])}</p></div>
  </div>
</section>''')

    a = n['agenda']
    out.append(f'''<section class="secao" id="horarios" aria-labelledby="horarios-titulo">
  <div class="container">
    <div class="cabeca reveal"><p class="eyebrow">{esc(a["eyebrow"])}</p><h2 id="horarios-titulo">{a["h2"]}</h2><p>{esc(a["p"])}</p></div>
    <div class="agenda-topo reveal">
      <p class="contador"><b data-restam>{livres}</b> <span>de {total} horários livres</span></p>
      <p class="exemplo"><svg aria-hidden="true"><use href="#cal"/></svg>{esc(cfg["horarios"]["exemplo"])}</p>
      <p class="agenda-aviso">{esc(a["aviso"])}</p>
    </div>
    {grade_html(dias)}
    <p class="legenda-grade"><span><i></i>livre: toque para pedir pelo WhatsApp</span><span><i class="r"></i>reservado</span></p>
    <ol class="passos reveal">{"".join(f"<li><b>{esc(t)}</b>{esc(x)}</li>" for t, x in a["passos"])}</ol>
  </div>
</section>''')

    g = n['galeria']
    out.append(f'''<section class="secao secao--areia" id="natal-2025" aria-labelledby="n25-titulo">
  <div class="container">
    <div class="cabeca reveal"><p class="eyebrow">{esc(g["eyebrow"])}</p><h2 id="n25-titulo">{g["h2"]}</h2><p>{esc(g["p"])}</p></div>
    <div class="paineis">{galeria_html(F, {"id": "natal25", "nome": g["nome"], "fotos": g["fotos"]}, True)}</div>
    <p class="galeria-nota">Toque numa foto para ver em tela cheia.</p>
  </div>
</section>''')

    out.append(avaliacoes_html(cfg, n['avaliacoes_h2'], 'Depoimentos'))
    v = cfg['site']['contato']
    out.append(f'''<section class="secao natal" id="contato" aria-labelledby="contato-titulo">
  <div class="container" style="text-align:center;max-width:760px">
    <p class="eyebrow" style="justify-content:center">{esc(n["final"]["eyebrow"])}</p><h2 id="contato-titulo">{n["final"]["h2"]}</h2>
    <p style="margin:20px auto 30px;max-width:560px">{esc(n["final"]["p"])}</p>
    <div class="abertura-acoes" style="justify-content:center;margin:0 0 26px"><a class="botao" href="#horarios"><svg aria-hidden="true"><use href="#cal"/></svg>Ver os horários</a><a class="botao" data-whatsapp href="#" style="background:transparent;color:#f3e7dc;border-color:#f3e7dc66"><svg aria-hidden="true"><use href="#whats"/></svg>{esc(v["telefone"])}</a></div>
    <p style="font-size:.9rem">{esc(" · ".join(v["endereco"]))} · <a data-instagram href="#" target="_blank" rel="noopener noreferrer">@{esc(cfg["instagram"])}</a></p>
  </div>
</section>''')
    out.append('</main>')
    out.append(rodape(cfg, F, [('index.html', 'O site ' + q['da'], 'site'), ('index.html#portfolio', 'Portfólio', 'site'), ('#horarios', 'Horários de Natal', '')]))
    out.append(lightbox())
    out.append(pilula_rz(cfg, 'natal'))
    return out


def fechar(cfg, partes, google, horas, lista):
    runtime = open(os.path.join(AQUI, 'runtime.js'), encoding='utf-8').read()
    partes += [cliente_js(cfg, google, horas, lista), '<script>\n' + runtime + '\n</script>', rz_js(cfg), '<script>\n' + JS + '\n</script>', '</body>', '</html>', '']
    doc = '\n'.join(partes)
    assert '{{' not in doc, re.findall(r'\{\{[^}]*\}\}', doc)[:5]
    return doc


def ficha(cfg, horas, total, livres, F):
    f = cfg['ficha']; dmy = lambda iso: '/'.join(reversed(iso.split('-')))
    w = cfg['whatsapp']
    linhas = [f'# {cfg["marca"]}', '', '| | |', '|---|---|',
              f'| Onde | {cfg["endereco_maps"]} |',
              f'| Instagram | [@{cfg["instagram"]}](https://www.instagram.com/{cfg["instagram"]}/) · {cfg["seguidores"]} seguidores |',
              f'| Google | nota {cfg["google_nota"]} · {cfg["google_total"]} avaliações · conferido em {dmy(cfg["verificado"])} |',
              f'| WhatsApp | ({w[2:4]}) {w[4:-4]}-{w[-4:]} · {f["whatsapp_fonte"]} |',
              '| Horário | ' + ('; '.join(f'{n} {t}' for n, t, _ in G.linhas_horario(horas)) if horas else 'não confirmado') + ' |',
              f'| Site | {f["site"]} |',
              '| Entregável | o site (`index.html`) e a página da campanha de Natal (`natal.html`), gerados por `ferramentas/demo/gerar-fotografia.py` a partir do `demo.json` |',
              f'| Situação | {f["situacao"]} |',
              f'| Oferta na demo | {cfg["renderiza"]["preco_pix"]} no Pix ou {cfg["renderiza"]["parcelado"]} ({cfg["renderiza"]["nota_preco"]}), válida até {dmy(cfg["renderiza"]["valido_ate"])}: trocar no `demo.json` (`renderiza`) e gerar de novo, ou no `window.RZ` das duas páginas |',
              f'| Horários de exemplo | {livres} livres de {total} (`horarios` no `demo.json`) |', '']
    for titulo, chave in (('Direção da demo', 'direcao'), ('O que tem na demo', 'demo'), ('Fotos', 'fotos'), ('Textos e fontes', 'textos'), ('Conferir antes de mandar', 'conferir')):
        if f.get(chave): linhas += [f'## {titulo}'] + [f'- {x}' for x in f[chave]] + ['']
    return '\n'.join(linhas)


def links_publicados(doc, pasta):
    """No ar, a demo abre em /demo/<pasta> (sem barra no fim): um link relativo "natal.html" iria para /demo/natal.html,
    que não existe. Os links entre as páginas viram absolutos (/demo/<pasta> e /demo/<pasta>/natal), com o arquivo
    local em data-local; aberta do disco (validar, gravador de vídeo), um script troca de volta para o arquivo."""
    def troca(m):
        arquivo, ancora = m.group(1), m.group(2) or ''
        destino = f'/demo/{pasta}' + ('' if arquivo == 'index' else '/' + arquivo)
        return f'href="{destino}{ancora}" data-local="{arquivo}.html{ancora}"'
    doc = re.sub(r'href="(index|natal)\.html(#[^"]*)?"', troca, doc)
    local = ('<script>if(location.protocol==="file:")document.querySelectorAll("a[data-local]")'
             '.forEach(function(a){a.setAttribute("href",a.getAttribute("data-local"))})</script>')
    return doc.replace('</body>', local + '</body>', 1) if 'data-local=' in doc else doc


def gerar(caminho):
    cfg = json.load(open(caminho, encoding='utf-8'))
    google = G.ler_google(cfg.get('google_json'))
    horas = G.horario(google)
    dias, total, livres = horarios(cfg)
    pasta = os.path.join(REPO, 'demos', cfg['pasta']); os.makedirs(pasta, exist_ok=True)
    F = Fotos()
    saidas = []
    for nome, fn, lista in (('index.html', pagina_site, cfg['site']['avaliacoes']), ('natal.html', pagina_natal, cfg['natal']['avaliacoes'])):
        antes = F.bytes
        doc = links_publicados(fechar(cfg, fn(cfg, F, google, horas, dias, total, livres), google, horas, lista), cfg['pasta'])
        arq = os.path.join(pasta, nome); open(arq, 'w', encoding='utf-8').write(doc)
        print(f'{arq}: {len(doc) // 1024} KB (imagens novas: {(F.bytes - antes) // 1024} KB)')
        saidas.append(arq)
    for a in F.avisos: print('  AVISO', a)
    print(f'horários de exemplo: {livres} livres de {total}')
    gal = cfg['site']['galerias']
    for g in gal:
        p = sum(1 for x in g['fotos'] if x.get('f', 'p') != 'l'); l = len(g['fotos']) - p
        print(f'  galeria {g["id"]}: {p} em pé + {l} deitadas = {p + 2 * l} colunas (celular: {p / 2:.1f} linhas em pé + {l} deitadas)')
    if cfg.get('ficha'):
        open(os.path.join(pasta, 'ficha.md'), 'w', encoding='utf-8').write(ficha(cfg, horas, total, livres, F))
        print(os.path.join(pasta, 'ficha.md'))
    return saidas


if __name__ == '__main__':
    gerar(sys.argv[1])
