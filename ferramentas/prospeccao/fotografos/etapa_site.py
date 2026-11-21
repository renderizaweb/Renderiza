# Junta os detalhes (det*.jsonl) com a lista e confere o site dos detalhes. Grava site.jsonl (todos os já detalhados) com passa_site.
import json, glob, sys, os, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from checa_site import situacao
from reclass import reclass
C = {}
for f in glob.glob('site_card_*.jsonl'):
    for l in open(f): x = json.loads(l); C[x['fid']] = x
D = {}
for f in glob.glob('det*.jsonl'):
    for l in open(f):
        x = json.loads(l)
        if x.get('fid'): D[x['fid']] = x
ant = {}
if os.path.exists('site.jsonl'):
    for l in open('site.jsonl'): x = json.loads(l); ant[x['fid']] = x
novos = [{**C.get(fid, {}), **d} for fid, d in D.items() if fid not in ant]
def f(d):
    r = situacao(d.get('site') or '') if d.get('site') else {'tipo_site': d.get('tipo_site') if d.get('site_card') else 'nenhum'}
    if not d.get('site') and d.get('site_card'): r = {k: d.get(k) for k in ('tipo_site', 'morto_por', 'host', 'plataforma')}
    d = reclass({**d, **r})
    d['passa_site'] = d['tipo_site'] != 'funcionando' and not d.get('fechado')
    return d
with cf.ThreadPoolExecutor(10) as ex: res = list(ex.map(f, novos))
with open('site.jsonl', 'a') as o:
    for d in res: o.write(json.dumps(d, ensure_ascii=False) + '\n')
import collections
print('novos', len(res), collections.Counter(d['tipo_site'] for d in res), 'passam', sum(d['passa_site'] for d in res))
