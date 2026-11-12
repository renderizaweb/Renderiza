# Demo de fotógrafa com foco em eventos (12/11/2026, Bia Maida: a versão 2 do site, feita à mão a partir da versão 1).
# Uso: python3 -I ferramentas/demo/gerar-fotografia-eventos.py demos/<pasta> <pasta_das_fotos>
#   Lê demos/<pasta>/demo.json, chave "eventos": { "modelo", "fotos": chave -> {arquivo, corte, largura, formato,
#   qualidade, bruto}, "dados": chave -> texto } e o modelo ferramentas/demo/modelos/<modelo>.html, e grava
#   demos/<pasta>/index.html com as fotos dentro (base64, como as outras demos: o build tira as fotos para
#   /demo/<pasta>/f/). As fotos brutas ficam fora do repositório (a ficha.md diz de onde vieram).
#   Em cada foto: "corte" = [x0, y0, x1, y1] em fração da foto (padrão: inteira); "largura" em px depois do corte;
#   "formato" webp (padrão) ou jpeg (a 1ª foto da abertura é JPEG: é a capa da prévia do link); "bruto": true põe o
#   arquivo como está, sem recomprimir.
#   No modelo:
#     {{img:chave}}   a foto (data:image/…;base64,…)
#     {{dim:chave}}   width="…" height="…" da foto já cortada e reduzida (a página não pula enquanto a foto carrega)
#     {{dado:chave}}  um texto de "dados"
# O resto do demo.json (site, natal…) é do gerar-fotografia.py, que faz a página de Natal: rodar aquele gerador de
# novo nesta pasta troca o index.html pela versão 1. Não rodar.
import base64, io, json, os, re, sys
from PIL import Image, ImageOps

pasta, fotos = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(pasta, "demo.json"), encoding="utf8"))["eventos"]
raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
modelo = open(os.path.join(raiz, "ferramentas", "demo", "modelos", cfg["modelo"] + ".html"), encoding="utf8").read()
TIPOS = {".jpg": "jpeg", ".jpeg": "jpeg", ".png": "png", ".webp": "webp"}

prontas = {}
def foto(chave):
    if chave in prontas: return prontas[chave]
    spec = cfg["fotos"][chave]
    arq = os.path.join(fotos, spec["arquivo"])
    if spec.get("bruto"):
        dados = open(arq, "rb").read()
        tipo, tam = TIPOS[os.path.splitext(arq)[1].lower()], Image.open(arq).size
    else:
        im = ImageOps.exif_transpose(Image.open(arq)).convert("RGB")
        w, h = im.size
        x0, y0, x1, y1 = spec.get("corte", [0, 0, 1, 1])
        im = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
        larg = spec.get("largura", 1280)
        if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
        tipo, b = spec.get("formato", "webp"), io.BytesIO()
        if tipo == "jpeg": im.save(b, "JPEG", quality=spec.get("qualidade", 82), optimize=True, progressive=True)
        else: im.save(b, "WEBP", quality=spec.get("qualidade", 80), method=6)
        dados, tam = b.getvalue(), im.size
    prontas[chave] = (f"data:image/{tipo};base64," + base64.b64encode(dados).decode(), tam, len(dados))
    return prontas[chave]

html = re.sub(r"\{\{img:([a-z0-9_-]+)\}\}", lambda m: foto(m.group(1))[0], modelo)
html = re.sub(r"\{\{dim:([a-z0-9_-]+)\}\}", lambda m: 'width="%d" height="%d"' % foto(m.group(1))[1], html)
html = re.sub(r"\{\{dado:([a-z0-9_-]+)\}\}", lambda m: cfg["dados"][m.group(1)], html)
falta = re.findall(r"\{\{[^}]+\}\}", html)
if falta: sys.exit("ficou sem trocar: " + ", ".join(sorted(set(falta))))
sem_uso = set(cfg["fotos"]) - set(prontas)
if sem_uso: print("fotos sem uso no modelo:", ", ".join(sorted(sem_uso)))
open(os.path.join(pasta, "index.html"), "w", encoding="utf8").write(html)
peso = sum(v[2] for v in prontas.values())
print(f"{pasta}/index.html: {len(html) // 1024} KB, {len(prontas)} fotos ({peso // 1024} KB sem o base64)")
for k, v in sorted(prontas.items()): print(f"  {k:<14} {v[1][0]}x{v[1][1]}  {v[2] // 1024} KB")
