# Quem já está no painel ou nas listas dos lotes 1 a 3, para o filtro4.py e o juntar4.py não trazerem de novo:
# nomes normalizados, @ e os 8 últimos dígitos do WhatsApp. Uso (na pasta de trabalho, com o leads.json do estudo-baixar.mjs):
#   python3 -I ja_painel.py leads.json <raiz do repositório>   → ja.json
import json, re, sys, unicodedata
def norm(s): return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode())).strip()
L = json.load(open(sys.argv[1])); raiz = sys.argv[2] if len(sys.argv) > 2 else '.'
igs, tels, nomes = set(), set(), set()
for l in L:
    txt = l['observacoes'] + ' ' + l['instagram'] + ' ' + l['site_atual']
    igs |= {x.lower().rstrip('.') for x in re.findall(r'@([A-Za-z0-9_.]{3,})', l['instagram'] + ' ' + l['observacoes'])}
    igs |= {x.lower().rstrip('.') for x in re.findall(r'instagram\.com/([A-Za-z0-9_.]{3,})', txt)}
    d = re.sub(r'\D', '', l['whatsapp'])
    if len(d) >= 10: tels.add(d[-8:])
    nomes.add(norm(l['empresa']))
for f in ['fotografos-lote2.md', 'fotografos-lote3.md', 'fotografos-lote4.md']:
    try: t = open(f'{raiz}/docs/nichos/{f}').read()
    except FileNotFoundError: continue
    igs |= {x.lower() for x in re.findall(r'instagram\.com/([A-Za-z0-9_.]+)/', t)}
    nomes |= {norm(x) for x in re.findall(r'^### \d+\. ([^·\n]+)', t, re.M)}
json.dump({'igs': sorted(igs), 'tels': sorted(tels), 'nomes': sorted(nomes)}, open('ja.json', 'w'), ensure_ascii=False)
print(len(igs), '@ ·', len(tels), 'telefones ·', len(nomes), 'nomes')
