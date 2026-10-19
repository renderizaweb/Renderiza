# O @ achado pelo nome é mesmo da loja do Google? O embed público traz o local marcado em cada post e a legenda
# inteira: confira cidade, bairro, rua e telefone. No lote 4, 9 dos 84 @ adivinhados eram de outra cidade.
# Uso:
#   python3 conferir-ig.py usuario1 usuario2 ...   → por perfil: locais dos posts, telefones, 📍, "nossas lojas", links
#   python3 conferir-ig.py --procurar casos.json    → testa variações do nome e marca as que batem com a loja
#     casos.json: [{"base": "faby", "bairro": "Artur Alvim", "cidade": "São Paulo", "rua": "Maciel Monteiro",
#                   "tel": "986555733", "extras": ["fabyotica"]}]
#   Telefone fora do DDD da região, 📍 de outra cidade ou "nossas lojas" pedem atenção.
import json, re, sys, subprocess, time, unicodedata, concurrent.futures as cf
def sem_acento(t): return ''.join(c for c in unicodedata.normalize('NFD', (t or '').lower()) if unicodedata.category(c) != 'Mn')
def embed(u):
    r = subprocess.run(['curl', '-sS', '--max-time', '25', f'https://www.instagram.com/{u}/embed/'], capture_output=True)
    h = r.stdout.decode('utf8', 'ignore')
    m = re.search(r'"contextJSON":"((?:[^"\\]|\\.)*)"', h)
    if not m: return {'u': u, 'erro': 'sem embed'}
    ctx = json.loads(json.loads('"' + m.group(1) + '"'))['context']
    locs, caps = [], []
    for e in ctx.get('graphql_media') or []:
        n = e.get('shortcode_media') or e
        if n.get('location'): locs.append(n['location']['name'])
        try: caps.append(n['edge_media_to_caption']['edges'][0]['node']['text'])
        except Exception: caps.append('')
    return {'u': u, 'nome': ctx.get('full_name'), 'locs': locs, 'caps': caps}
fone = re.compile(r'\(?\b(\d{2})\)?\s?(9?\d{4})[-\s.]?(\d{4})\b')
def resumo(d):
    if 'erro' in d: return d
    t = '\n'.join(d['caps'])
    return {'u': d['u'], 'nome': d['nome'], 'locs': sorted(set(d['locs'])),
            'fones': sorted(set(f'({a}) {b}-{c}' for a, b, c in fone.findall(t))),
            'pinos': sorted(set(x.strip()[:90] for x in re.findall(r'📍([^\n]{3,90})', t)))[:4],
            'unidades': sorted(set(m.group(0).lower() for m in re.finditer(r'(nossas lojas|nossas unidades|unidade [A-ZÁ-Úa-zá-ú]+|filial|duas lojas|nova loja|inaugura\w*)', t)))[:5],
            'links': sorted(set(re.findall(r'(?:https?://)?(?:www\.)?[\w-]+\.(?:com\.br|com|net\.br|site|linktr\.ee/[\w.]+)\b', t)))[:5]}
def variantes(c):
    b, br, cd = (re.sub(r'[^a-z0-9]', '', sem_acento(c.get(k, ''))) for k in ('base', 'bairro', 'cidade'))
    v = []
    for p in ['otica', 'oticas', 'optica']:
        for s in ['', 'sp', '_sp', br, '_' + br, cd, '_' + cd, 'oficial', '_oficial', 'zl', 'zn', 'abc']:
            v += [f'{p}{b}{s}', f'{p}_{b}{s}', f'{p}.{b}{s}']
    for s in ['otica', 'oticas', '_otica', '.otica', 'optica', 'oticasp']:
        v += [f'{b}{s}', f'{b}{s}{br}', f'{b}{s}{cd}']
    v += [b, b + br, b + cd, b + '_' + br, b + '.' + cd] + c.get('extras', [])
    return [x for i, x in enumerate(v) if x not in v[:i] and 3 <= len(x) <= 30]
def procurar(c):
    achados = []
    for u in variantes(c):
        d = embed(u)
        if 'erro' in d: continue
        t = sem_acento(' '.join(d['locs']) + ' ' + ' '.join(d['caps']))
        bate = [k for k in (sem_acento(c.get('bairro')), sem_acento(c.get('cidade')), sem_acento(c.get('rua'))) if k and len(k) > 3 and k in t]
        if c.get('tel') and c['tel'][-8:] in re.sub(r'\D', '', ' '.join(d['caps'])): bate.append('telefone')
        achados.append({'u': u, 'nome': d['nome'], 'locs': sorted(set(d['locs']))[:4], 'bate': bate})
        time.sleep(0.3)
    return {'loja': c['base'], 'achados': achados}
if __name__ == '__main__':
    if sys.argv[1:2] == ['--procurar']:
        casos = json.load(open(sys.argv[2]))
        with cf.ThreadPoolExecutor(4) as ex:
            for r in ex.map(procurar, casos):
                print('==', r['loja'])
                for x in r['achados']: print('   ', ('BATE ' if x['bate'] else '     ') + json.dumps(x, ensure_ascii=False))
    else:
        with cf.ThreadPoolExecutor(6) as ex:
            for d in ex.map(embed, sys.argv[1:]): print(json.dumps(resumo(d), ensure_ascii=False))
