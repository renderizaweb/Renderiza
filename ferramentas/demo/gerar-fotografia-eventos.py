# Site de fotógrafa com foco em eventos, feito à mão (Bia Maida: versão 2 em 12/11/2026; site final em 17/11/2026).
# Uso: python3 -I ferramentas/demo/gerar-fotografia-eventos.py demos/<pasta> <pasta_das_fotos>
#   Lê demos/<pasta>/demo.json, chave "eventos", e o modelo ferramentas/demo/modelos/<modelo>.html, e grava
#   demos/<pasta>/index.html com as fotos dentro (base64, como as outras demos: o build tira as fotos para
#   /demo/<pasta>/f/ e o virar-site, para img/). As fotos brutas ficam fora do repositório (a ficha.md diz de onde vieram).
#
#   "eventos": {
#     "modelo": "bia-maida-eventos",
#     "dados": { chave: texto },                      {{dado:chave}} no modelo
#     "fotos": { chave: foto },                       {{img:chave}} e {{dim:chave}} no modelo
#     "galeria_padrao": foto,                         o que vale para toda foto das galerias (ex.: {"lado": 2000})
#     "galerias": { nome: [ {"f": arquivo sem .jpg, "alt", "leg"} ] }   {{galeria:nome}} e {{n:nome}} no modelo
#   }
#   foto = {"arquivo", "corte": [x0, y0, x1, y1] em fração (padrão: inteira), "largura" (px depois do corte) ou "lado"
#           (o lado maior, em px), "formato": "webp" (padrão) ou "jpeg", "qualidade", "bruto": true (o arquivo como está)}.
#   A 1ª foto da abertura (.hero-photo) tem de ser JPEG: é a capa da prévia do link.
#
#   {{galeria:nome}} vira as linhas do portfólio: cada linha soma perto de 2,9 "larguras" (deitada 3:2 = 1,5; em pé 2:3 =
#   0,67), para todas terem altura parecida; cada foto leva a proporção real (--ar), então aparece inteira, sem corte.
import base64, io, json, os, re, sys
from html import escape
from PIL import Image, ImageOps

pasta, fotos = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(pasta, "demo.json"), encoding="utf8"))["eventos"]
raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
modelo = open(os.path.join(raiz, "ferramentas", "demo", "modelos", cfg["modelo"] + ".html"), encoding="utf8").read()
TIPOS = {".jpg": "jpeg", ".jpeg": "jpeg", ".png": "png", ".webp": "webp"}

especies = dict(cfg["fotos"])
for nome, lista in cfg.get("galerias", {}).items():
    for item in lista:
        especies.setdefault(item["f"], {**cfg.get("galeria_padrao", {}), "arquivo": item["f"] + ".jpg"})

prontas = {}
def foto(chave):
    if chave in prontas: return prontas[chave]
    spec = especies[chave]
    arq = os.path.join(fotos, spec["arquivo"])
    if spec.get("bruto"):
        dados = open(arq, "rb").read()
        tipo, tam = TIPOS[os.path.splitext(arq)[1].lower()], Image.open(arq).size
    else:
        im = ImageOps.exif_transpose(Image.open(arq)).convert("RGB")
        w, h = im.size
        x0, y0, x1, y1 = spec.get("corte", [0, 0, 1, 1])
        im = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
        if "lado" in spec: im.thumbnail((spec["lado"], spec["lado"]), Image.LANCZOS)
        elif im.width > spec.get("largura", 1280):
            larg = spec.get("largura", 1280)
            im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
        tipo, b = spec.get("formato", "webp"), io.BytesIO()
        if tipo == "jpeg": im.save(b, "JPEG", quality=spec.get("qualidade", 82), optimize=True, progressive=True)
        else: im.save(b, "WEBP", quality=spec.get("qualidade", 80), method=6)
        dados, tam = b.getvalue(), im.size
    prontas[chave] = (f"data:image/{tipo};base64," + base64.b64encode(dados).decode(), tam, len(dados))
    return prontas[chave]

# ---------- portfólio: linhas de altura parecida, perto da ordem da lista ----------
# As deitadas e as em pé andam cada uma na sua fila (na ordem da lista); cada linha pega as primeiras de cada fila
# (duas deitadas; uma deitada e duas em pé; quatro em pé...). A escolha (programação dinâmica) busca a soma perto de
# ALVO em todas as linhas (com mais peso nas duas primeiras: são as que aparecem antes do "Ver mais fotos") e pune pegar
# foto muito à frente da ordem da lista. Dentro da linha, vale a ordem da lista.
ALVO, ATRASO = 2.9, 0.04
def linhas(itens):
    ars = [foto(i["f"])[1][0] / foto(i["f"])[1][1] for i in itens]
    dei = [k for k, a in enumerate(ars) if a > 1.05]
    pe = [k for k, a in enumerate(ars) if a <= 1.05]
    from functools import lru_cache
    @lru_cache(None)
    def melhor(a, b, r=0):  # a deitadas e b em pé já usadas; r = linhas já feitas (até 2)
        if a == len(dei) and b == len(pe): return (0.0, ())
        res = (float("inf"), ())
        for nd in range(0, 4):
            for ne in range(0, 5):
                if not 1 <= nd + ne <= 4 or a + nd > len(dei) or b + ne > len(pe): continue
                idx = dei[a:a + nd] + pe[b:b + ne]
                s = sum(ars[k] for k in idx)
                c = (s - ALVO) ** 2 * (3 if r < 2 else 1) + ATRASO * max(0, max(idx) - (a + b + nd + ne - 1))
                resto = melhor(a + nd, b + ne, min(r + 1, 2))
                if c + resto[0] < res[0]: res = (c + resto[0], (tuple(sorted(idx)),) + resto[1])
        return res
    return [[(itens[k], ars[k]) for k in linha] for linha in melhor(0, 0)[1]]

def galeria(nome):
    itens = cfg["galerias"][nome]
    saida = []
    for linha in linhas(itens):
        botoes = []
        for i, (item, ar) in enumerate(linha):
            img, (w, h), _ = foto(item["f"])
            classe = "g-l" if ar > 1.05 else "g-p"
            alt, leg = escape(item["alt"]), escape(item.get("leg", ""))
            botoes.append(f'<button class="g-item {classe} reveal foto" type="button" style="--i:{i};--ar:{ar:.4f}" data-legenda="{leg}" '
                          f'aria-label="Abrir em tela cheia: {alt}"><img src="{img}" width="{w}" height="{h}" alt="{alt}" loading="lazy" decoding="async"></button>')
        saida.append('      <div class="linha">\n        ' + "\n        ".join(botoes) + "\n      </div>")
    return "\n".join(saida)

html = re.sub(r"\{\{galeria:([a-z0-9_-]+)\}\}", lambda m: galeria(m.group(1)), modelo)
html = re.sub(r"\{\{n:([a-z0-9_-]+)\}\}", lambda m: str(len(cfg["galerias"][m.group(1)])), html)
html = re.sub(r"\{\{img:([a-z0-9_-]+)\}\}", lambda m: foto(m.group(1))[0], html)
html = re.sub(r"\{\{dim:([a-z0-9_-]+)\}\}", lambda m: 'width="%d" height="%d"' % foto(m.group(1))[1], html)
html = re.sub(r"\{\{dado:([a-z0-9_-]+)\}\}", lambda m: cfg["dados"][m.group(1)], html)
falta = re.findall(r"\{\{[^}]+\}\}", html)
if falta: sys.exit("ficou sem trocar: " + ", ".join(sorted(set(falta))))
sem_uso = set(cfg["fotos"]) - set(prontas)
if sem_uso: print("fotos sem uso no modelo:", ", ".join(sorted(sem_uso)))
open(os.path.join(pasta, "index.html"), "w", encoding="utf8").write(html)
peso = sum(v[2] for v in prontas.values())
print(f"{pasta}/index.html: {len(html) // 1024} KB, {len(prontas)} fotos ({peso // 1024} KB sem o base64)")
for nome, lista in cfg.get("galerias", {}).items():
    print(f"  galeria {nome}: {len(lista)} fotos em {len(linhas(lista))} linhas:",
          " | ".join("".join("D" if ar > 1.05 else "E" for _, ar in l) for l in linhas(lista)))
