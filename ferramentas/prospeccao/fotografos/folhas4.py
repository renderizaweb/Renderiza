# Folhas só de quem passou no corte e ainda não foi olhado (notas.jsonl). 5 perfis por folha. Uso: python3 -I folhas4.py fin.json prefixo
import json, sys, os, subprocess
F = json.load(open(sys.argv[1])); pre = sys.argv[2]
vistas = {json.loads(l)['ig'] for l in open('notas.jsonl')} if os.path.exists('notas.jsonl') else set()
N = [r for r in F if r['ig'] not in vistas]
base = len(vistas)
for i, r in enumerate(N, 1): r['n'] = base + i
json.dump(N, open('prox.json', 'w'), ensure_ascii=False)
subprocess.run(['python3', '-I', 'folha_foto.py', 'prox.json', pre])
for r in N:
    print(f"{r['n']}. @{r['ig']} | {r['nome'][:45]} | {r['seguidores']} seg | G {r['nota']} ({r['aval']}) | {r['onde']} | site {r['tipo_site']} | span {r['span']} | {r['serv']} | locais {r['locais'][:2]} | pinos {r['pinos'][:1]} | prova {r['prova_cidade']} | pre {r['pre']}")
