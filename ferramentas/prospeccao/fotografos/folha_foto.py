# Folhas de fotos: 5 perfis por folha, foto do perfil ampliada + 6 últimos posts. Uso: python3 -I folha_foto.py lista.json prefixo
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps
fs = json.load(open(sys.argv[1])); pre = sys.argv[2] if len(sys.argv) > 2 else 'folha'
f1 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 19); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
W, H, LAB, PF = 250, 312, 300, 230
os.makedirs('fig', exist_ok=True)
por = 5
for k in range(0, len(fs), por):
    lote = fs[k:k+por]
    fo = Image.new('RGB', (LAB + 6*W, len(lote)*H), 'white'); d = ImageDraw.Draw(fo)
    for i, r in enumerate(lote):
        y = i*H; u = r['ig']
        d.text((8, y+6), f"{r['n']}. @{u}"[:26], fill='black', font=f1)
        try: d_im = ImageOps.fit(Image.open(f'th/{u}/perfil.jpg').convert('RGB'), (150, 150)); fo.paste(d_im, (8, y+36))
        except Exception: pass
        txt = [f"{r['seguidores']} seg", f"{(r.get('onde') or '')[:28]}", f"G {r['nota']} ({r['aval']})", f"últ {r.get('ultimo_post')}", f"site: {r.get('tipo_site')}"]
        for j, t in enumerate(txt): d.text((8, y+192+j*22), t, fill='#333', font=f2)
        for j in range(6):
            try: im = ImageOps.fit(Image.open(f'th/{u}/{j:02d}.jpg').convert('RGB'), (W-4, H-4))
            except Exception: continue
            fo.paste(im, (LAB + j*W + 2, y+2))
        d.line([(0, y+H-1), (fo.width, y+H-1)], fill='#999', width=2)
    fo.save(f'fig/{pre}-{k//por+1:02d}.jpg', quality=72)
print(len(fs), 'perfis em', (len(fs)+por-1)//por, 'folhas')
