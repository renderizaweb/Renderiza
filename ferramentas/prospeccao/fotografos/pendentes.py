# Aprovadas na folha (nota 3,5+, sem "fora") que ainda não tiveram avaliações lidas ou domínios testados.
import json, os, glob, sys
F = {r['ig']: r for r in json.load(open('fin_tmp.json'))}
N = {}
for l in open('notas.jsonl'): n = json.loads(l); N[n['ig']] = {**N.get(n['ig'], {}), **n}
ok = [F[ig] for ig, n in N.items() if ig in F and not n.get('fora') and n['f'] >= 3.5]
sin = {json.loads(l)['fid'] for f in glob.glob('sin[0-9]*.jsonl') for l in open(f)}
dom = set(json.load(open('dom_feitos.json'))) if os.path.exists('dom_feitos.json') else set()
a = [r for r in ok if r['fid'] not in sin]; b = [r for r in ok if r['ig'] not in dom]
k = len(glob.glob('sin[0-9]*.jsonl'))
for i in range(2):
    part = a[i::2]
    if part: open(f'sin{k+i}.jsonl', 'w').write(''.join(json.dumps({'fid': r['fid'], 'nome': r['nome'], 'link': r['link']}, ensure_ascii=False) + '\n' for r in part)); print(f'sin{k+i}.jsonl', len(part))
json.dump(b, open('dom_in.json', 'w'), ensure_ascii=False); print('domínios', len(b))
