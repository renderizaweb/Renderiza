# Folha de contato grande de uma demo de fotógrafa: todas as fotos (galerias do site + pn = as fotos da página de
# Natal antiga), com o rótulo galeria:índice e o tamanho, para escolher as fotos do portfólio (gerar-portfolio.py).
# Uso: python3 -I ferramentas/demo/folha-de-contato.py <site.html> <natal.html> <saida.jpg> [largura da miniatura]
import sys, re, base64, io, html
from PIL import Image, ImageDraw
site, natal, saida = sys.argv[1:4]; L = int(sys.argv[4]) if len(sys.argv) > 4 else 230
s = open(site, encoding='utf-8').read(); n = open(natal, encoding='utf-8').read()
def imgs(t):
    return [(m.group(1), int(m.group(2)), int(m.group(3)), html.unescape(m.group(4))) for m in re.finditer(r'<img src="data:image/[a-z]+;base64,([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]*)"', t)]
gal = [(m.group(1), imgs(m.group(2))) for m in re.finditer(r'<div class="painel[^"]*" id="painel-([a-z0-9-]+)".*?<h3 class="painel-titulo">.*?</h3>(<div class="galeria".*?</div>)</div>', s, re.S)]
gal.append(('pn', [x for x in imgs(n) if x[1] >= 500]))
th = []
for gid, fs in gal:
    for i, (b, w, h, alt) in enumerate(fs):
        im = Image.open(io.BytesIO(base64.b64decode(b))).convert('RGB'); im.thumbnail((L, int(L * 1.3)))
        th.append((f'{gid}:{i} {w}x{h}', im))
cols = 6; ch = int(L * 1.3) + 18; rows = (len(th) + cols - 1) // cols
out = Image.new('RGB', (cols * (L + 6), rows * ch), 'white'); d = ImageDraw.Draw(out)
for k, (lab, im) in enumerate(th):
    x, y = (k % cols) * (L + 6), (k // cols) * ch; out.paste(im, (x, y)); d.text((x + 2, y + im.height + 2), lab, fill='black')
out.save(saida, quality=70); print(saida, out.size, len(th))
