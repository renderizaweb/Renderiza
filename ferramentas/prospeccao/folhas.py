# Folhas com os 6 últimos posts de cada perfil, para avaliar as fotos a olho.
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps
fs = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'finalistas.json'))
fonte = ImageFont.load_default(size=20); peq = ImageFont.load_default(size=17)
W, H, LAB = 210, 262, 330
os.makedirs('fig', exist_ok=True)
por = 7
for k in range(0, len(fs), por):
    lote = fs[k:k+por]
    fo = Image.new('RGB', (LAB + 6*W, len(lote)*H), 'white'); d = ImageDraw.Draw(fo)
    for i, r in enumerate(lote):
        y = i*H; n = r.get('n', k+i+1)
        d.text((8, y+8), f"{n}. @{r['ig']}", fill='black', font=fonte)
        d.text((8, y+40), r['nome'][:30], fill='#333', font=peq)
        d.text((8, y+66), r['onde'][:32], fill='#333', font=peq)
        d.text((8, y+92), f"{r['seguidores']} seg · {r['posts_total']} posts", fill='#333', font=peq)
        d.text((8, y+118), f"Google {r['nota']} ({r['aval']})", fill='#333', font=peq)
        d.text((8, y+144), f"último post {r['ultimo_post']}", fill='#333', font=peq)
        d.text((8, y+170), f"site: {r['tipo_site']} {r.get('site_status','')}", fill='#333', font=peq)
        for j in range(6):
            p = f"th/{r['ig']}/{r['ig']}_{j:02d}.jpg"
            try: im = ImageOps.fit(Image.open(p).convert('RGB'), (W-4, H-4))
            except Exception: continue
            fo.paste(im, (LAB + j*W + 2, y+2))
        d.line([(0, y+H-1), (fo.width, y+H-1)], fill='#999', width=2)
    fo.save(f'fig/folha-{k//por+1:02d}.jpg', quality=74)
print(len(fs), 'perfis em', (len(fs)+por-1)//por, 'folhas')
