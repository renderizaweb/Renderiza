# Demo de site de mandato de vereador (nicho novo, 10/11/2026; pesquisa em docs/nichos/vereadores.md).
# Uso: python3 -I ferramentas/demo/gerar-vereador.py demos/<pasta> <pasta_das_fotos>
#   Lê demos/<pasta>/demo.json ("fotos": chave -> {arquivo, corte: [x0, y0, x1, y1] em fração, largura}) e o modelo
#   ferramentas/demo/modelos/vereador.html, e grava demos/<pasta>/index.html com as fotos dentro (JPEG em base64,
#   como as outras demos: o build tira as fotos para /demo/<pasta>/f/). As fotos brutas ficam fora do repositório.
#   No modelo:
#     {{img:chave}}     a foto (data:image/jpeg;base64,…); a mesma chave duas vezes vira um arquivo só no build
#     {{dim:chave}}     width="…" height="…" da foto já cortada e reduzida (a página não pula enquanto a foto carrega)
#     {{dado:chave}}    um texto do demo.json ("dados")
#     {{n:chave}}       um número contado em demos/<pasta>/dados/proposituras.json (lista em "numeros", abaixo)
#     {{json:pedidos}}  os pedidos por bairro: dados/pedidos.json (título, bairro e tema, escritos à mão) com a data,
#                       a situação e o protocolo da Prefeitura de cada indicação, que vêm de proposituras.json
import base64, io, json, os, re, sys
from PIL import Image, ImageOps

pasta, fotos = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(pasta, "demo.json"), encoding="utf8"))
raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
modelo = open(os.path.join(raiz, "ferramentas", "demo", "modelos", cfg.get("modelo", "vereador") + ".html"), encoding="utf8").read()

prontas = {}
def foto(chave):
    if chave in prontas: return prontas[chave]
    spec = cfg["fotos"][chave]
    im = ImageOps.exif_transpose(Image.open(os.path.join(fotos, spec["arquivo"]))).convert("RGB")
    w, h = im.size
    x0, y0, x1, y1 = spec.get("corte", [0, 0, 1, 1])
    im = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))
    larg = spec.get("largura", 900)
    if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=spec.get("qualidade", 80), optimize=True, progressive=True)
    prontas[chave] = ("data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode(), im.size, len(b.getvalue()))
    return prontas[chave]

# ---------- os números oficiais e os pedidos por bairro (só para a demo que tem a pasta dados/) ----------
def le(nome):
    arq = os.path.join(pasta, "dados", nome)
    return json.load(open(arq, encoding="utf8")) if os.path.exists(arq) else None

props, curado = le("proposituras.json"), le("pedidos.json")
numeros, pedidos_json = {}, None
if props:
    def conta(tipo, situacao=None, ano=None, mes=None):
        return sum(1 for x in props if x["tipo"] == tipo and (situacao is None or x.get("situação") == situacao)
                   and (ano is None or x["data"][-4:] == ano) and (mes is None or x["data"][3:5] == mes))
    numeros = {
        "indicacoes": conta("Indicação"), "requerimentos": conta("Requerimento"), "projetos": conta("Projeto de Lei"),
        "aprovados": conta("Projeto de Lei", "Aprovado"), "aplausos": conta("Aplauso"),
        "encaminhadas": conta("Indicação", "Encaminhado à Prefeitura"),
        "ind-2025": conta("Indicação", ano="2025"), "ind-2026": conta("Indicação", ano="2026"),
        "req-2025": conta("Requerimento", ano="2025"), "req-2026": conta("Requerimento", ano="2026"),
        "pl-2025": conta("Projeto de Lei", ano="2025"), "pl-2026": conta("Projeto de Lei", ano="2026"),
        "ind-jan-2026": conta("Indicação", ano="2026", mes="01"),
    }
if props and curado:
    ind = {x["num"]: x for x in props if x["tipo"] == "Indicação"}
    usadas = [n for p in curado["pedidos"] for n in p["n"]]
    erros = [f"{n}: não é uma indicação do sistema" for n in usadas + list(curado["fora"]) if n not in ind]
    erros += [f"{n}: está em dois pedidos" for n in set(usadas) if usadas.count(n) > 1]
    erros += [f"{n}: está em um pedido e em \"fora\"" for n in set(usadas) & set(curado["fora"])]
    erros += [f"{n}: não está em nenhum pedido nem em \"fora\"" for n in sorted(set(ind) - set(usadas) - set(curado["fora"]))]
    erros += [f"{p['t']}: tema {p['c']} não existe" for p in curado["pedidos"] if p["c"] not in curado["temas"]]
    if erros: sys.exit("dados/pedidos.json:\n  " + "\n  ".join(erros))
    ordem = lambda n: (ind[n]["data"][6:], ind[n]["data"][3:5], ind[n]["data"][:2], int(n.split("/")[0]))
    sit = {"Encaminhado à Prefeitura": "P", "Tramitando": "T", "Impresso": "I"}
    lista = []
    for p in curado["pedidos"]:
        ns = sorted(p["n"], key=ordem, reverse=True)  # a indicação mais nova primeiro: é a situação que vale
        lista.append([p["t"], p["b"], p["c"], [[n, ind[n]["data"], sit[ind[n]["situação"]], (ind[n].get("protocolo prefeitura") or "").replace("PMI ", "")] for n in ns]])
    lista.sort(key=lambda p: ordem(p[3][0][0]), reverse=True)
    bairros = {b for p in curado["pedidos"] for b in p["b"]} - {"Toda a cidade", "Outros locais"}
    # indicações de janeiro de 2026 que estão no mesmo pedido de uma indicação de 2025 (o pedido foi reapresentado)
    reap = sum(1 for p in curado["pedidos"] if any(n.endswith("/2025") for n in p["n"])
               for n in p["n"] if ind[n]["data"][3:] == "01/2026")
    numeros.update({"pedidos": len(lista), "bairros": len(bairros), "ind-nos-pedidos": len(usadas), "reap-jan-2026": reap})
    pedidos_json = json.dumps({"consulta": curado["consulta"], "temas": curado["temas"], "pedidos": lista}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

def troca_json(m):
    if m.group(1) != "pedidos" or pedidos_json is None: sys.exit("falta dados/pedidos.json ou dados/proposituras.json para {{json:" + m.group(1) + "}}")
    return pedidos_json

html = re.sub(r"\{\{img:([a-z0-9_-]+)\}\}", lambda m: foto(m.group(1))[0], modelo)
html = re.sub(r"\{\{dim:([a-z0-9_-]+)\}\}", lambda m: 'width="%d" height="%d"' % foto(m.group(1))[1], html)
html = re.sub(r"\{\{dado:([a-z0-9_-]+)\}\}", lambda m: cfg["dados"][m.group(1)], html)
html = re.sub(r"\{\{n:([a-z0-9_-]+)\}\}", lambda m: str(numeros[m.group(1)]), html)
html = re.sub(r"\{\{json:([a-z0-9_-]+)\}\}", troca_json, html)
falta = re.findall(r"\{\{[^}]+\}\}", html)
if falta: sys.exit("ficou sem trocar: " + ", ".join(sorted(set(falta))))
sem_uso = set(cfg["fotos"]) - set(prontas)
if sem_uso: print("fotos sem uso no modelo:", ", ".join(sorted(sem_uso)))
open(os.path.join(pasta, "index.html"), "w", encoding="utf8").write(html)
peso = sum(v[2] for v in prontas.values())
print(f"{pasta}/index.html: {len(html) // 1024} KB, {len(prontas)} fotos ({peso // 1024} KB sem o base64)", {k: (v[1], v[2] // 1024) for k, v in sorted(prontas.items())})
if numeros: print("números:", numeros)
