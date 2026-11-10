# Demo de site de mandato de vereador (nicho novo, 10/11/2026; pesquisa em docs/nichos/vereadores.md).
# Uso: python3 -I ferramentas/demo/gerar-vereador.py demos/<pasta> <pasta_das_fotos>
#   Lê demos/<pasta>/demo.json ("fotos": chave -> {arquivo, corte: [x0, y0, x1, y1] em fração, largura}) e o modelo
#   ferramentas/demo/modelos/vereador.html, e grava demos/<pasta>/index.html com as fotos dentro (JPEG em base64,
#   como as outras demos: o build tira as fotos para /demo/<pasta>/f/). As fotos brutas ficam fora do repositório.
#   No modelo, {{img:chave}} vira a foto e {{dado:chave}} vira um texto do demo.json ("dados").
import base64, io, json, os, re, sys
from PIL import Image, ImageOps

pasta, fotos = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(pasta, "demo.json"), encoding="utf8"))
raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
modelo = open(os.path.join(raiz, "ferramentas", "demo", "modelos", cfg.get("modelo", "vereador") + ".html"), encoding="utf8").read()

def foto(spec):
    im = ImageOps.exif_transpose(Image.open(os.path.join(fotos, spec["arquivo"]))).convert("RGB")
    w, h = im.size
    x0, y0, x1, y1 = spec.get("corte", [0, 0, 1, 1])
    im = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
    larg = spec.get("largura", 900)
    if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=spec.get("qualidade", 80), optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode(), im.size

tamanhos = {}
def troca_img(m):
    uri, tam = foto(cfg["fotos"][m.group(1)]); tamanhos[m.group(1)] = tam
    return uri
html = re.sub(r"\{\{img:([a-z0-9_-]+)\}\}", troca_img, modelo)
html = re.sub(r"\{\{dado:([a-z0-9_-]+)\}\}", lambda m: cfg["dados"][m.group(1)], html)
falta = re.findall(r"\{\{[^}]+\}\}", html)
if falta: sys.exit("ficou sem trocar: " + ", ".join(sorted(set(falta))))
sem_uso = set(cfg["fotos"]) - set(tamanhos)
if sem_uso: print("fotos sem uso no modelo:", ", ".join(sorted(sem_uso)))
open(os.path.join(pasta, "index.html"), "w", encoding="utf8").write(html)
print(f"{pasta}/index.html: {len(html) // 1024} KB, {len(tamanhos)} fotos", {k: v for k, v in sorted(tamanhos.items())})
