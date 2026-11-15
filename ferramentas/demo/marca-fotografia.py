# Marca de uma demo de fotógrafa. Três usos:
#
# 1) SEM LOGO em boa resolução: monograma (as iniciais num círculo fino, na cor de destaque) e o nome em serifa com a
#    palavra em letra cursiva embaixo, como nas 20 do lote 1 ("feitos para a demo").
#    Uso: python3 ferramentas/demo/marca-fotografia.py <saida> --nome "Katia Rodrigues" --script "fotografia"
#           --iniciais KR --serif <fonte.ttf> --cursiva <fonte.ttf> --acento "#24406b" --tinta "#22262e"
#           [--claro "#f3ece4"] [--peso Medium] [--fundo-favicon "#fbf9f6"]
#      -> <saida>/simbolo.png (240 px, fundo transparente), logo.png (tinta), logo-claro.png (para o rodapé escuro)
#         e favicon.png (64 px, com fundo). As fontes são TTF do Google Fonts (github.com/google/fonts).
#
# 2) COM O LOGO REAL que a fotógrafa mandou (PNG com fundo transparente): os mesmos arquivos, tirados dos dela
#    (só apara a área vazia em volta e reduz; nada é redesenhado).
#    Uso: python3 ferramentas/demo/marca-fotografia.py <saida> --logo <logo.png> --logo-claro <logo claro.png>
#           --simbolo <ícone.png> [--favicon <selo.png>] [--topo <logo do topo.png>]
#      -> <saida>/simbolo.png, logo.png, logo-claro.png, favicon.png e, com --topo, topo.png (o logo que vai no
#         topo do site no lugar do símbolo com o nome escrito: marca_img.topo no demo.json).
#
# 3) MARCA D'ÁGUA nas fotos: python3 ferramentas/demo/marca-fotografia.py --marcar <foto> <saida.jpg>
#           --marca-clara <logo branco.png> [--marca-escura <logo escuro.png>] [--largura .22] [--margem .035]
#           [--opacidade .82] [--limiar .66] [--posicao centro|direita|esquerda]
#    O gerar-fotografia.py usa a mesma função (marcar) quando o demo.json tem "marca_dagua": a marca entra no JPEG
#    tratado, nunca no original. Sobre fundo claro (onde o branco some), entra a versão escura, se houver.
import argparse, os
from PIL import Image, ImageDraw, ImageFont, ImageStat


# ---------- logo real ----------
def aparar(caminho, folga=0.0):
    """O PNG sem a área vazia em volta (com uma folga, em fração do lado maior)."""
    im = Image.open(caminho).convert('RGBA')
    caixa = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not caixa: return im
    f = round(max(caixa[2] - caixa[0], caixa[3] - caixa[1]) * folga)
    return im.crop((max(0, caixa[0] - f), max(0, caixa[1] - f), min(im.width, caixa[2] + f), min(im.height, caixa[3] + f)))


def reduzir(im, largura=None, altura=None):
    if largura and im.width > largura: im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
    if altura and im.height > altura: im = im.resize((round(im.width * altura / im.height), altura), Image.LANCZOS)
    return im


def do_logo(saida, logo, logo_claro, simbolo, favicon=None, topo=None):
    os.makedirs(saida, exist_ok=True)
    reduzir(aparar(simbolo), altura=240).save(os.path.join(saida, 'simbolo.png'))
    reduzir(aparar(logo), largura=960).save(os.path.join(saida, 'logo.png'))
    reduzir(aparar(logo_claro), largura=960).save(os.path.join(saida, 'logo-claro.png'))
    fav = aparar(favicon or simbolo, 0 if favicon else .12)
    lado = max(fav.size); quadro = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    quadro.alpha_composite(fav, ((lado - fav.width) // 2, (lado - fav.height) // 2))
    quadro.resize((64, 64), Image.LANCZOS).save(os.path.join(saida, 'favicon.png'))
    if topo: reduzir(aparar(topo), altura=220).save(os.path.join(saida, 'topo.png'))
    print('marca (do logo real) em', saida)


# ---------- marca d'água ----------
_marcas = {}


def _marca(caminho):
    if caminho not in _marcas: _marcas[caminho] = aparar(caminho)
    return _marcas[caminho]


def marcar(im, clara, escura=None, largura=.22, margem=.035, opacidade=.82, limiar=.66, posicao='centro', minimo=520):
    """A foto (RGB) com a marca d'água embaixo: no centro, à direita ou à esquerda. "largura" e "margem" são frações
    da largura da foto. Onde o fundo é claro (luminância média acima de "limiar"), usa a marca escura, se houver.
    Foto mais estreita que "minimo" px sai sem marca (ficaria ilegível)."""
    if im.width < minimo or not posicao: return im
    m = _marca(clara)
    w = max(120, round(im.width * largura)); h = round(m.height * w / m.width)
    mg = round(im.width * margem)
    x = {'direita': im.width - w - mg, 'esquerda': mg}.get(posicao, (im.width - w) // 2)
    y = im.height - h - mg
    if y < 0 or x < 0: return im
    if escura:
        lum = ImageStat.Stat(im.crop((x, y, x + w, y + h)).convert('L')).mean[0] / 255
        if lum > limiar: m = _marca(escura)
    m = m.resize((w, h), Image.LANCZOS)
    m.putalpha(m.getchannel('A').point(lambda a: round(a * opacidade)))
    base = im.convert('RGBA'); base.alpha_composite(m, (x, y))
    return base.convert('RGB')


# ---------- monograma (sem logo) ----------
def monograma(a):
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


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('saida'); ap.add_argument('--nome'); ap.add_argument('--script', default='fotografia')
    ap.add_argument('--iniciais'); ap.add_argument('--serif'); ap.add_argument('--cursiva')
    ap.add_argument('--acento'); ap.add_argument('--tinta'); ap.add_argument('--claro', default='#f3ece4')
    ap.add_argument('--peso', default=''); ap.add_argument('--fundo-favicon', default='#fbf9f6')
    ap.add_argument('--logo'); ap.add_argument('--logo-claro'); ap.add_argument('--simbolo'); ap.add_argument('--favicon'); ap.add_argument('--topo')
    ap.add_argument('--marcar'); ap.add_argument('--marca-clara'); ap.add_argument('--marca-escura')
    ap.add_argument('--largura', type=float, default=.22); ap.add_argument('--margem', type=float, default=.035)
    ap.add_argument('--opacidade', type=float, default=.82); ap.add_argument('--limiar', type=float, default=.66)
    ap.add_argument('--posicao', default='centro')
    a = ap.parse_args()
    if a.marcar:
        if not a.marca_clara: ap.error('--marcar pede --marca-clara')
        from PIL import ImageOps
        foto = ImageOps.exif_transpose(Image.open(a.marcar)).convert('RGB')
        marcar(foto, a.marca_clara, a.marca_escura, a.largura, a.margem, a.opacidade, a.limiar, a.posicao).save(a.saida, 'JPEG', quality=90)
        print('foto com a marca em', a.saida)
    elif a.logo:
        if not (a.logo_claro and a.simbolo): ap.error('--logo pede --logo-claro e --simbolo')
        do_logo(a.saida, a.logo, a.logo_claro, a.simbolo, a.favicon, a.topo)
    else:
        falta = [n for n in ('nome', 'iniciais', 'serif', 'cursiva', 'acento', 'tinta') if not getattr(a, n)]
        if falta: ap.error('falta ' + ', '.join('--' + n for n in falta))
        monograma(a)
