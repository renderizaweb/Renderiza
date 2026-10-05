# Instagram de cada candidato: @ do Google (redes/site) ou adivinhado pelo nome; seguidores, posts, 6 últimos e as fotos.
import json, re, sys, os, datetime, subprocess, concurrent.futures as cf
FERR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, FERR)
from igembed import perfil
import importlib.util
spec = importlib.util.spec_from_file_location('achar', os.path.join(FERR, 'achar-ig.py')); achar = importlib.util.module_from_spec(spec); spec.loader.exec_module(achar)
det = [json.loads(l) for f in sorted(os.listdir('.')) if f == 'det-all.jsonl' for l in open(f)]
def ig_do_google(d):
    for u in [d.get('site', '')] + d.get('redes', []):
        m = re.search(r'instagram\.com/([A-Za-z0-9_.]+)', u or '')
        if m and m.group(1).lower() not in ('p', 'reel', 'explore', 'accounts', 'stories'): return m.group(1).rstrip('.')
    return None
def um(d):
    u = ig_do_google(d); fonte = 'google'
    if not u:
        r = achar.acha(d); u = r.get('ig'); fonte = 'adivinhado'
    if not u: return {**d, 'ig': None}
    p = perfil(u, f'th/{u}')
    return {**d, 'ig': u, 'ig_fonte': fonte, 'ig_nome': p.get('nome'), 'seguidores': p.get('seguidores'), 'posts_total': p.get('posts_total'),
            'ultimos': [(x['data'], x['legenda'][:160], x['video']) for x in p.get('posts', [])], 'ig_erro': p.get('erro')}
alvo = [d for d in det if d.get('passa_site')]
print(len(alvo), 'para olhar o Instagram')
os.makedirs('th', exist_ok=True)
with cf.ThreadPoolExecutor(5) as ex, open('ig.jsonl', 'w') as out:
    for r in ex.map(um, alvo):
        out.write(json.dumps(r, ensure_ascii=False) + '\n'); out.flush()
