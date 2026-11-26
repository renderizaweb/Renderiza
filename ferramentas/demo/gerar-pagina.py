# Demo feita sob medida a partir de um modelo HTML (ex.: a versão 2 da Dra. Milena Ferreira, 26/11/2026), com as fotos
# dentro (base64, como as outras demos: o build tira as fotos para /demo/<pasta>/f/) e a camada da Renderiza (a faixa
# de valor e a pílula) com o mesmo CSS e JS do gerar-fotografia.py, para o contador de visitas ler igual.
#
# Uso: python3 -I ferramentas/demo/gerar-pagina.py demos/<pasta> <pasta_das_fotos>
#      python3 -I ferramentas/demo/gerar-pagina.py --fotos-da-pagina <arquivo.html> <pasta>   (tira as fotos de uma demo
#        já pronta, sem recomprimir: a00.jpg, a01.jpg… na ordem da página; serve para refazer uma demo sem as originais)
# demo.json: "modelo" (ferramentas/demo/modelos/<modelo>.html), "fotos" (chave -> {arquivo, corte: [x0, y0, x1, y1] em
#   fração, largura, qualidade}), "dados" (textos soltos) e "renderiza" (validade, mensagens e WhatsApp da faixa).
# No modelo: {{img:chave}}, {{dim:chave}} (width/height da foto pronta), {{dado:chave}}, {{simbolos}}, {{rz_css}},
#   {{rz_js}} e {{rz_json}}. Foto sem corte e sem redução entra com os bytes originais (sem perder qualidade).
import base64, hashlib, importlib.util, io, json, os, re, sys
from PIL import Image, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__))


def fotos_da_pagina(html, pasta):
    os.makedirs(pasta, exist_ok=True)
    t, vistos, n = open(html, encoding="utf8").read(), set(), 0
    for m in re.finditer(r"data:image/(jpeg|jpg|webp|png);base64,([A-Za-z0-9+/=]+)", t):
        h = hashlib.md5(m.group(2).encode()).hexdigest()
        if h in vistos: continue
        vistos.add(h); b = base64.b64decode(m.group(2))
        if Image.open(io.BytesIO(b)).width < 200: continue
        ext = {"jpeg": "jpg"}.get(m.group(1), m.group(1))
        open(os.path.join(pasta, f"a{n:02d}.{ext}"), "wb").write(b); n += 1
    print(f"{n} fotos em {pasta}")


def gerar(pasta, fotos):
    cfg = json.load(open(os.path.join(pasta, "demo.json"), encoding="utf8"))
    modelo = open(os.path.join(AQUI, "modelos", cfg["modelo"] + ".html"), encoding="utf8").read()
    spec = importlib.util.spec_from_file_location("gf", os.path.join(AQUI, "gerar-fotografia.py"))
    gf = importlib.util.module_from_spec(spec); spec.loader.exec_module(gf)
    c, j = gf.CSS, gf.JS
    rz_css = c[c.index("/* camada da Renderiza"):c.index("/* aviso da Renderiza")]
    m = re.search(r"@media\(max-width:860px\)\{\.rz-in\{.*?\n\n", c, re.S)
    if not m: sys.exit("gerar-fotografia.py mudou: não achei o CSS da camada da Renderiza")
    rz_css += m.group(0).strip() + "\n@media(max-width:520px){.rz-pilula{left:14px;bottom:20px}}\n"
    rz_js = j[j.index("// ---------- camada da Renderiza"):j.index("// ---------- aviso da Renderiza")]
    r = cfg["renderiza"]
    rz = {"precoPix": r["preco_curto"], "parcelado": r.get("parcelado", ""), "notaPreco": r.get("nota_preco", ""), "validoAte": r["valido_ate"],
          "whatsapp": r["whatsapp"], "msgGarantir": r["msg_garantir"], "msgNegociar": r["msg_negociar"]}

    prontas = {}
    def foto(chave):
        if chave in prontas: return prontas[chave]
        s = cfg["fotos"][chave]; arq = os.path.join(fotos, s["arquivo"]); bruto = open(arq, "rb").read()
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(bruto)))
        corte, larg = s.get("corte"), s.get("largura", 1200)
        if not corte and im.width <= larg and im.format in ("JPEG", "WEBP"):
            dados, tam, tipo = bruto, im.size, im.format.lower()
        else:
            im = im.convert("RGB"); w, h = im.size
            if corte: im = im.crop((round(corte[0] * w), round(corte[1] * h), round(corte[2] * w), round(corte[3] * h)))
            if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
            b = io.BytesIO(); im.save(b, "JPEG", quality=s.get("qualidade", 84), optimize=True, progressive=True)
            dados, tam, tipo = b.getvalue(), im.size, "jpeg"
        prontas[chave] = (f"data:image/{tipo};base64," + base64.b64encode(dados).decode(), tam, len(dados))
        return prontas[chave]

    html = modelo
    for a, b in [("{{rz_css}}", rz_css), ("{{rz_js}}", rz_js), ("{{simbolos}}", gf.SIMBOLOS),
                 ("{{rz_json}}", json.dumps(rz, ensure_ascii=False).replace("</", "<\\/"))]:
        if html.count(a) != 1: sys.exit(f"o modelo precisa ter {a} uma vez")
        html = html.replace(a, b)
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


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) == 3 and a[0] == "--fotos-da-pagina": fotos_da_pagina(a[1], a[2])
    elif len(a) == 2: gerar(a[0].rstrip("/"), a[1])
    else: sys.exit("uso: gerar-pagina.py demos/<pasta> <pasta_das_fotos>  |  gerar-pagina.py --fotos-da-pagina <arquivo.html> <pasta>")
