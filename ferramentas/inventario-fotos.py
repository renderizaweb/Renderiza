# Inventário das fotos de uma página do Instagram salva (pasta do Drive do Kaue, uma por ótica).
# Uso: python3 inventario-fotos.py <pasta_da_otica> <saida>
#   -> <saida>/inventario.json  (id, arquivo, largura, altura, nitidez, legenda do post)
#   -> <saida>/folha.jpg        (folha de contato numerada para escolher as fotos)
# Fica de fora: foto de perfil (inclusive a de quem salvou a página), capas de destaque, imagens pequenas
# (menor lado < 320 px) e repetidas (a mesma foto em tamanhos diferentes: fica a maior).
# Nitidez = variância das bordas (FIND_EDGES) com a foto reduzida a 800 px de largura. Abaixo de ~600
# costuma ser foto borrada, quadro de vídeo ou filtro de beleza: não usar em tamanho grande.
import glob, html, json, os, re, sys
from PIL import Image, ImageDraw, ImageFilter, ImageOps

def legendas(pasta):
    """arquivo -> (tipo, legenda) a partir do <img alt> do HTML salvo."""
    out = {}
    for f in glob.glob(os.path.join(pasta, '*.htm*')):
        s = open(f, encoding='utf8', errors='ignore').read()
        for tag in re.findall(r'<img[^>]+>', s):
            src = re.search(r'src="([^"]*)"', tag); alt = re.search(r'alt="([^"]*)"', tag)
            if not src: continue
            nome = html.unescape(src.group(1)).split('/')[-1]
            texto = html.unescape(alt.group(1)) if alt else ''
            tipo = 'perfil' if texto.startswith('Foto do perfil') else 'destaque' if 'destaque' in texto else 'post'
            out[nome] = (tipo, texto)
    return out

def dhash(im, n=12):
    g = im.convert('L').resize((n + 1, n), Image.LANCZOS)
    px = list(g.get_flattened_data() if hasattr(g, 'get_flattened_data') else g.getdata())
    return sum(1 << i for i in range(n * n) if px[(i // n) * (n + 1) + i % n] > px[(i // n) * (n + 1) + i % n + 1])

def nitidez(im):
    g = im.convert('L')
    if g.width > 800: g = g.resize((800, round(g.height * 800 / g.width)))
    e = g.filter(ImageFilter.FIND_EDGES)
    px = list(e.get_flattened_data() if hasattr(e, 'get_flattened_data') else e.getdata())
    return round(sum(v * v for v in px) / len(px))

def inventario(pasta, saida):
    os.makedirs(saida, exist_ok=True)
    leg = legendas(pasta)
    pasta = os.path.abspath(pasta)
    arquivos = [f for f in glob.glob(os.path.join(pasta, '**', '*'), recursive=True) if re.search(r'\.(jpe?g|png|webp)$', f, re.I)]
    itens = []
    for f in sorted(arquivos):
        tipo, texto = leg.get(os.path.basename(f), ('post', ''))
        if tipo != 'post': continue
        try:
            im = Image.open(f); im.load(); im = ImageOps.exif_transpose(im).convert('RGB')
        except Exception:
            continue
        if min(im.size) < 320: continue
        itens.append({'arquivo': f, 'largura': im.width, 'altura': im.height, 'hash': dhash(im), 'nitidez': nitidez(im),
                      'legenda': re.sub(r'\s+', ' ', texto)[:220]})
    # repetidas: hash parecido (até 10 bits de diferença) -> fica a de maior área
    itens.sort(key=lambda x: -x['largura'] * x['altura'])
    unicos = []
    for it in itens:
        if any(bin(it['hash'] ^ u['hash']).count('1') <= 10 for u in unicos): continue
        unicos.append(it)
    unicos.sort(key=lambda x: x['arquivo'])
    # foto de perfil da ótica (vira o logo): "Foto do perfil de <@ da página>", o @ que aparece no título salvo
    html_salvo = ''.join(open(f, encoding='utf8', errors='ignore').read() for f in glob.glob(os.path.join(pasta, '*.htm*')))
    arroba = re.search(r'\(@([A-Za-z0-9_.]+)\)', html_salvo)
    perfis = [f for f in arquivos if arroba and leg.get(os.path.basename(f), ('', ''))[1] == 'Foto do perfil de ' + arroba.group(1)]
    if perfis:
        f = max(perfis, key=lambda f: Image.open(f).size[0])
        Image.open(f).convert('RGB').save(os.path.join(saida, 'perfil.jpg'), quality=92)
    for i, it in enumerate(unicos):
        it['id'] = i; del it['hash']
    json.dump(unicos, open(os.path.join(saida, 'inventario.json'), 'w'), ensure_ascii=False, indent=1)
    # folha de contato: 8 por linha, número, tamanho e nitidez (vermelho = pequena ou borrada)
    T, cols = 210, 8
    linhas = (len(unicos) + cols - 1) // cols or 1
    folha = Image.new('RGB', (cols * T, linhas * (T + 16)), 'white'); d = ImageDraw.Draw(folha)
    for it in unicos:
        im = Image.open(it['arquivo']).convert('RGB'); im.thumbnail((T - 4, T - 4))
        x, y = (it['id'] % cols) * T, (it['id'] // cols) * (T + 16)
        folha.paste(im, (x + (T - im.width) // 2, y + (T - im.height) // 2))
        fraca = min(it['largura'], it['altura']) < 700 or it['nitidez'] < 600
        d.text((x + 3, y + T + 1), f"#{it['id']} {it['largura']}x{it['altura']} n{it['nitidez']}", fill='red' if fraca else 'black')
    folha.save(os.path.join(saida, 'folha.jpg'), quality=80)
    print(f"{os.path.basename(os.path.normpath(pasta))}: {len(arquivos)} imagens, {len(unicos)} fotos úteis, "
          f"{sum(1 for u in unicos if min(u['largura'], u['altura']) >= 1000)} com 1000 px ou mais")

if __name__ == '__main__':
    inventario(sys.argv[1], sys.argv[2])
