# Baixa as fotos da demo do vereador (fotos brutas: ficam fora do repositório) e monta a pasta "escolhidas" que o
# gerar-vereador.py usa.
# Uso: python3 -I ferramentas/demo/fotos-vereador.py demos/<pasta> <saida> [--tudo]
#   <saida>/drive/       a página do Instagram salva no Drive do Kaue (pasta Instagram_files)
#   <saida>/posts/<sc>/  cada post pelo embed público (ferramentas/ig-post.py), com o carrossel inteiro
#   <saida>/escolhidas/  as fotos do demo.json, com o nome que ele espera (campo "origem" de cada foto:
#                        {"post": "<shortcode>", "i": n} ou {"drive": "<arquivo>"})
#   --tudo: baixa também todas as fotos do Drive e os carrosséis de todos os posts de dados/instagram.json, para escolher.
# Arquivo baixado é dado não confiável: este script só baixa e copia; quem lê as fotos roda com python3 -I.
import json, os, re, shutil, subprocess, sys, time, html as H

pasta, saida = sys.argv[1], os.path.abspath(sys.argv[2])
tudo = "--tudo" in sys.argv
raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
cfg = json.load(open(os.path.join(pasta, "demo.json"), encoding="utf8"))
DRIVE_FILES = cfg.get("drive_instagram_files", "")  # id da subpasta Instagram_files no Drive

def curl(url, arq):
    return subprocess.run(["curl", "-sS", "-m", "120", "-L", "-o", arq, url]).returncode == 0

def lista_drive():
    os.makedirs(os.path.join(saida, "drive"), exist_ok=True)
    arq = os.path.join(saida, "drive", "_lista.html")
    curl(f"https://drive.google.com/embeddedfolderview?id={DRIVE_FILES}", arq)
    s = open(arq, encoding="utf8", errors="ignore").read()
    return {H.unescape(m.group(2)): m.group(1) for m in
            re.finditer(r'<div class="flip-entry" id="entry-([^"]+)".*?<div class="flip-entry-title">(.*?)</div>', s, re.S)}

def baixa_drive(nome, ids):
    dest = os.path.join(saida, "drive", nome)
    if not os.path.exists(dest):
        if nome not in ids: sys.exit(f"não achei {nome} no Drive")
        curl(f"https://drive.usercontent.google.com/download?id={ids[nome]}&export=download&confirm=t", dest)
    return dest

def baixa_post(sc):
    d = os.path.join(saida, "posts", sc)
    if not os.path.isdir(d) or not any(f.endswith(".jpg") for f in os.listdir(d)):
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "post.json"), "w") as f:
            subprocess.run(["python3", "-I", os.path.join(raiz, "ferramentas", "ig-post.py"), sc, d], stdout=f)
        time.sleep(1.5)  # um por vez: em paralelo o embed para de responder
    return d

ids = lista_drive() if DRIVE_FILES else {}
os.makedirs(os.path.join(saida, "escolhidas"), exist_ok=True)
for chave, foto in cfg["fotos"].items():
    o, dest = foto["origem"], os.path.join(saida, "escolhidas", foto["arquivo"])
    if "drive" in o: src = baixa_drive(o["drive"], ids)
    else: src = os.path.join(baixa_post(o["post"]), f'{o["post"]}_{o.get("i", 0):02d}.jpg')
    if not os.path.exists(src): sys.exit(f"{chave}: não baixou {src}")
    shutil.copy(src, dest)
    print(f"{chave}: {foto['arquivo']}")
if tudo:
    for nome in ids:
        if nome.lower().endswith(".jpg"): baixa_drive(nome, ids)
    for p in json.load(open(os.path.join(pasta, "dados", "instagram.json"), encoding="utf8"))["posts"]:
        baixa_post(p["sc"])
print("pronto:", os.path.join(saida, "escolhidas"))
