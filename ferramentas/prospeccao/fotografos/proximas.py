# Próximas folhas: roda o corte no ig.jsonl atual e gera folhas só de quem ainda não tem nota. Uso: python3 -I proximas.py prefixo
import json, subprocess, sys
subprocess.run(['python3', '-I', __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'juntar_foto.py'), 'ig.jsonl', 'fin_all.json'])
F = json.load(open('fin_all.json'))
vistas = {json.loads(l)['ig'] for l in open('notas.jsonl')}
N = [r for r in F if r['ig'] not in vistas]
base = len(vistas)
for i, r in enumerate(N, 1): r['n'] = base + i
json.dump(N, open('prox.json', 'w'), ensure_ascii=False)
subprocess.run(['python3', '-I', __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'folha_foto.py'), 'prox.json', sys.argv[1]])
for r in N: print(r['n'], r['ig'], r['seguidores'], r['onde'], '| natal', r['natal'], '| esp', {k: v for k, v in r['esp'].items() if v}, '| neg', r['neg'], '| locais', r['locais'][:2], '| prova', r['prova_cidade'])
