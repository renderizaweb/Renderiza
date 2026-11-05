# Marca de uma demo de fotógrafa sem logo em boa resolução: monograma (as iniciais num círculo fino, na cor de
# destaque) e o nome em serifa com a palavra em letra cursiva embaixo, como nas 20 do lote 1 ("feitos para a demo").
# Uso: python3 ferramentas/demo/marca-fotografia.py <saida> --nome "Katia Rodrigues" --script "fotografia"
#        --iniciais KR --serif <fonte.ttf> --cursiva <fonte.ttf> --acento "#24406b" --tinta "#22262e"
#        [--claro "#f3ece4"] [--peso Medium] [--fundo-favicon "#fbf9f6"]
#   -> <saida>/simbolo.png (240 px, fundo transparente), logo.png (tinta), logo-claro.png (para o rodapé escuro)
#      e favicon.png (64 px, com fundo). As fontes são TTF do Google Fonts (github.com/google/fonts).
import argparse, os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('saida'); ap.add_argument('--nome', required=True); ap.add_argument('--script', default='fotografia')
ap.add_argument('--iniciais', required=True); ap.add_argument('--serif', required=True); ap.add_argument('--cursiva', required=True)
ap.add_argument('--acento', required=True); ap.add_argument('--tinta', required=True); ap.add_argument('--claro', default='#f3ece4')
ap.add_argument('--peso', default=''); ap.add_argument('--fundo-favicon', default='#fbf9f6')
a = ap.parse_args()
os.makedirs(a.saida, exist_ok=True)


def fonte(caminho, tam):
    f = ImageFont.truetype(caminho, tam)
    if a.peso and caminho == a.serif:
        try: f.set_variation_by_name(a.peso)
        except Exception: pass
    return f


def simbolo(lado, fundo=None):
    k = 4; L = lado * k
    im = Image.new('RGBA', (L, L), fundo or (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    m = round(L * .03); esp = max(2, round(L * .012))
    d.ellipse((m, m, L - m, L - m), outline=a.acento, width=esp)
    tam = round(L * (.42 if len(a.iniciais) <= 2 else .32))
    f = fonte(a.serif, tam)
    x0, y0, x1, y1 = d.textbbox((0, 0), a.iniciais, font=f)
    d.text(((L - (x1 - x0)) / 2 - x0, (L - (y1 - y0)) / 2 - y0), a.iniciais, font=f, fill=a.acento)
    return im.resize((lado, lado), Image.LANCZOS)


def logo(cor):
    W, H = 960, 296
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    tam = 118
    while True:
        f = fonte(a.serif, tam); b = d.textbbox((0, 0), a.nome, font=f)
        if b[2] - b[0] <= W - 40 or tam < 40: break
        tam -= 4
    fs = fonte(a.cursiva, round(tam * 1.05))
    bs = d.textbbox((0, 0), a.script, font=fs)
    while bs[2] - bs[0] > W - 40:
        fs = fonte(a.cursiva, round(fs.size * .92)); bs = d.textbbox((0, 0), a.script, font=fs)
    hn = b[3] - b[1]; hs = bs[3] - bs[1]
    total = hn + hs * .78
    y = (H - total) / 2
    d.text(((W - (b[2] - b[0])) / 2 - b[0], y - b[1]), a.nome, font=f, fill=cor)
    d.text(((W - (bs[2] - bs[0])) / 2 - bs[0], y + hn - hs * .22 - bs[1]), a.script, font=fs, fill=cor)
    return im


simbolo(240).save(os.path.join(a.saida, 'simbolo.png'))
fav = simbolo(64, a.fundo_favicon)
mask = Image.new('L', (64 * 4, 64 * 4), 0); ImageDraw.Draw(mask).ellipse((0, 0, 64 * 4, 64 * 4), fill=255)
fav.putalpha(mask.resize((64, 64), Image.LANCZOS)); fav.save(os.path.join(a.saida, 'favicon.png'))
logo(a.tinta).save(os.path.join(a.saida, 'logo.png'))
logo(a.claro).save(os.path.join(a.saida, 'logo-claro.png'))
print('marca em', a.saida)
