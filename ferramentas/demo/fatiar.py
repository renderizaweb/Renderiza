import sys
from PIL import Image
out = sys.argv[1]
for nome, p in (('desktop', 1500), ('celular', 2400)):
    im = Image.open(f'{out}/{nome}.png'); w, h = im.size
    for i, y in enumerate(range(0, h, p), 1): im.crop((0, y, w, min(h, y+p))).convert('RGB').save(f'{out}/{nome}-{i}.jpg', quality=78)
