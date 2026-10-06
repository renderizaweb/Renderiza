# Tira as fotos embutidas (data URI) do index.html de uma demo, para escolher as do flyer de Stories.
# Uso: python3 ferramentas/flyer/extrair.py <pasta-da-demo>
#   -> rascunhos/flyer/fotos/<demo>/NN.jpg, lista.json (tamanho e alt de cada uma) e folha.jpg (todas lado a lado).
#   rascunhos/ fica fora do git: foto bruta não entra na main.
import base64, json, os, re, sys, html
from PIL import Image, ImageDraw
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
demo = sys.argv[1]
s = open(os.path.join(RAIZ, 'demos', demo, 'index.html'), encoding='utf-8').read()
pasta = os.path.join(RAIZ, 'rascunhos', 'flyer')
os.makedirs(pasta, exist_ok=True)
os.chdir(pasta)
os.makedirs(f'fotos/{demo}', exist_ok=True)
out = []; vistos = set()
for m in re.finditer(r'<img\b[^>]*>', s):
    tag = m.group(0)
    src = re.search(r'src="data:image/(\w+);base64,([^"]+)"', tag)
    if not src: continue
    b = base64.b64decode(src.group(2))
    if b in vistos: continue
    vistos.add(b)
    alt = re.search(r'alt="([^"]*)"', tag)
    n = len(out); ext = 'jpg' if src.group(1) in ('jpeg', 'jpg') else src.group(1)
    f = f'fotos/{demo}/{n:02d}.{ext}'; open(f, 'wb').write(b)
    im = Image.open(f); ctx = s[max(0, m.start() - 300):m.start()]
    classe = re.findall(r'class="([^"]+)"', ctx)
    out.append({'n': n, 'arquivo': f, 'w': im.width, 'h': im.height, 'alt': html.unescape(alt.group(1)) if alt else '', 'onde': classe[-1] if classe else ''})
json.dump(out, open(f'fotos/{demo}/lista.json', 'w'), ensure_ascii=False, indent=1)
H = 260; tiles = []
for x in out:
    im = Image.open(x['arquivo']).convert('RGB'); im = im.resize((max(1, round(im.width * H / im.height)), H))
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 140, 16), fill='white'); d.text((3, 3), f"{x['n']} {x['w']}x{x['h']}", fill='red'); tiles.append(im)
W = 1900; linhas = [[]]; lg = 0
for t in tiles:
    if lg + t.width > W and linhas[-1]: linhas.append([]); lg = 0
    linhas[-1].append(t); lg += t.width + 6
c = Image.new('RGB', (W, len(linhas) * (H + 6)), 'white')
for r, l in enumerate(linhas):
    x = 0
    for t in l: c.paste(t, (x, r * (H + 6))); x += t.width + 6
c.save(f'fotos/{demo}/folha.jpg', quality=82)
print(demo, len(out), 'fotos')
