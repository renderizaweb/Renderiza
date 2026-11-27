# Folhas de contato GRANDES dos originais de uma fotógrafa, para a curadoria do portfólio (gerar-portfolio.py).
#
# 1) Tudo o que veio (Drive, carrosséis do ig-post.py, Google), para escolher:
#      python3 -I ferramentas/demo/folha-originais.py <pasta dos originais> <saída>
#    Tira do caminho: capa de vídeo (9:16 ou mais alta), foto pequena (menor que 900 px no lado maior) e a mesma foto em
#    dois tamanhos (fica a maior). Grava <saída>/folha-01.jpg, folha-02.jpg… (6 colunas, miniatura de 320 px, 30 por
#    folha) e <saída>/lista.txt (o rótulo de cada miniatura = o caminho que vai no "arq" do demo.json, e o tamanho).
#    O que saiu fica em <saída>/fora.txt, com o motivo: confira, às vezes uma foto pequena é a única boa de um ensaio.
#
# 2) As escolhidas, na ordem do demo.json, com o alt de cada uma, para conferir ANTES de gerar:
#      python3 -I ferramentas/demo/folha-originais.py <pasta dos originais> <saída> --escolhidas demos/<pasta>/demo.json
#    Uma folha por ensaio (escolhidas-<id>.jpg), a capa marcada. É aqui que se pega índice trocado (foto de mês a mês na
#    página de Natal, print de WhatsApp no meio da galeria, alt que não descreve a foto).
#
# Rode com python3 -I (os originais são arquivos baixados). Nada aqui vai para o git: a saída fica na pasta de trabalho.
import json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageOps

EXT = ('.jpg', '.jpeg', '.png', '.webp')
L, COLS, POR_FOLHA, MIN_LADO = 320, 6, 30, 900
try: FONTE = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
except OSError: FONTE = ImageFont.load_default()

def abrir(caminho):
    im = Image.open(caminho); im = ImageOps.exif_transpose(im); return im.convert('RGB')

def ahash(im):
    p = im.resize((16, 16)).convert('L'); px = list(p.tobytes()); m = sum(px) / len(px)
    return ''.join('1' if v > m else '0' for v in px)

def parecidas(a, b): return sum(x != y for x, y in zip(a, b)) <= 12

def folha(itens, saida, titulo=''):
    """itens: [(rótulo, imagem PIL, destaque)]"""
    alt_rot = 46
    ch = int(L * 1.34) + alt_rot
    linhas = (len(itens) + COLS - 1) // COLS
    topo = 34 if titulo else 0
    out = Image.new('RGB', (COLS * (L + 8) + 8, topo + linhas * ch + 8), 'white'); d = ImageDraw.Draw(out)
    if titulo: d.text((10, 8), titulo, fill='black', font=FONTE)
    for k, (rot, im, destaque) in enumerate(itens):
        x, y = 8 + (k % COLS) * (L + 8), topo + (k // COLS) * ch
        t = im.copy(); t.thumbnail((L, int(L * 1.34)))
        out.paste(t, (x + (L - t.width) // 2, y))
        if destaque: d.rectangle([x - 3, y - 3, x + L + 2, y + t.height + 2], outline=(200, 40, 40), width=4)
        for i, linha in enumerate(textwrap.wrap(rot, 44)[:3]):
            d.text((x, y + int(L * 1.34) + 2 + i * 14), linha, fill='black', font=FONTE)
    out.save(saida, quality=78)

def tudo(pasta, saida):
    arqs = sorted(os.path.relpath(os.path.join(r, f), pasta) for r, _, fs in os.walk(pasta) for f in fs if f.lower().endswith(EXT))
    boas, fora, hashes = [], [], []
    for a in arqs:
        try: im = abrir(os.path.join(pasta, a))
        except Exception as e: fora.append((a, f'não abre ({e.__class__.__name__})')); continue
        w, h = im.size
        if h / w >= 1.7: fora.append((a, f'capa de vídeo / 9:16 ({w}x{h})')); continue
        if max(w, h) < MIN_LADO: fora.append((a, f'pequena ({w}x{h})')); continue
        hs = ahash(im)
        igual = next((i for i, (_, _, h2) in enumerate(hashes) if parecidas(hs, h2)), None)
        if igual is not None:
            a2, im2, _ = hashes[igual]
            if w * h > im2.size[0] * im2.size[1]:
                fora.append((a2, f'repetida (fica {a}, maior)')); hashes[igual] = (a, im, hs)
            else: fora.append((a, f'repetida (fica {a2}, maior)'))
            continue
        hashes.append((a, im, hs))
    boas = [(f'{a}  {im.size[0]}x{im.size[1]}', im, False) for a, im, _ in hashes]
    os.makedirs(saida, exist_ok=True)
    for n in range(0, len(boas), POR_FOLHA):
        folha(boas[n:n + POR_FOLHA], os.path.join(saida, f'folha-{n // POR_FOLHA + 1:02d}.jpg'), f'{pasta}  ·  {n + 1} a {min(n + POR_FOLHA, len(boas))} de {len(boas)}')
    open(os.path.join(saida, 'lista.txt'), 'w').write('\n'.join(r for r, _, _ in boas) + '\n')
    open(os.path.join(saida, 'fora.txt'), 'w').write('\n'.join(f'{a}: {m}' for a, m in fora) + '\n')
    print(f'{len(boas)} fotos em {(len(boas) + POR_FOLHA - 1) // POR_FOLHA} folha(s); {len(fora)} fora (veja fora.txt)')

def escolhidas(pasta, saida, demo):
    with open(demo, encoding='utf-8') as fh: p = json.load(fh).get('portfolio') or sys.exit('sem "portfolio" no demo.json')
    os.makedirs(saida, exist_ok=True)
    blocos = [('sobre', 'Quem fotografa', (p.get('sobre') or {}).get('fotos', []), 0)] + [(e['id'], e.get('nome', e['id']), e.get('fotos', []), e.get('capa', 0)) for e in p.get('ensaios', [])]
    for bid, nome, fotos, capa in blocos:
        itens = []
        for i, f in enumerate(fotos):
            c = os.path.join(pasta, f['arq'])
            if not os.path.exists(c): itens.append((f'{i}. FALTA {f["arq"]}', Image.new('RGB', (L, L), (240, 200, 200)), True)); continue
            im = abrir(c)
            if f.get('box'):
                x0, y0, x1, y1 = f['box']; W, H = im.size; im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
            itens.append((f'{i}. {f.get("alt", "")}', im, i < capa))
        if itens: folha(itens, os.path.join(saida, f'escolhidas-{bid}.jpg'), f'{nome}: {len(fotos)} fotos (em vermelho, as {capa} da abertura)')
    print('folhas das escolhidas em', saida)

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) < 2: sys.exit(__doc__ or 'uso: folha-originais.py <originais> <saída> [--escolhidas demo.json]')
    if '--escolhidas' in a: escolhidas(a[0], a[1], a[a.index('--escolhidas') + 1])
    else: tudo(a[0], a[1])
