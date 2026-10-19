# Nota de cada finalista pelo perfil de quem respondeu no ciclo 1 (docs/ciclos/ciclo-01-estudo.md):
# loja pequena, WhatsApp de celular, Instagram vivo, site quebrado e, das avaliações, sinal de que o dono atende.
# Uso: python3 pontuar.py   (lê finalistas.json e sinais-out*.jsonl; grava pontuados.json, do maior para o menor)
# A nota só ordena a leitura: as avaliações das primeiras ainda precisam ser lidas a olho (quem é o dono, se ele
# responde) e o @ de cada uma conferido com conferir-ig.py.
import json, re, glob, unicodedata
from ler_sinais import ler
def sem_acento(t): return ''.join(c for c in unicodedata.normalize('NFD', (t or '').lower()) if unicodedata.category(c) != 'Mn')
def limpar_nomes(g, r):
    # tira do ranking de nomes as palavras do próprio nome da loja e do @ (Óticas, Dafe, Nippon...)
    proibidas = set(re.findall(r'\w+', sem_acento(r['nome'] + ' ' + (r.get('ig_nome') or '') + ' ' + r['ig'].replace('.', ' ').replace('_', ' '))))
    g['nomes'] = [(n, k) for n, k in g['nomes'] if sem_acento(n) not in proibidas and not any(sem_acento(n) in p for p in proibidas if len(sem_acento(n)) >= 4)]
    g['n_nomes_distintos'] = sum(1 for n, k in g['nomes'] if k >= 2)
    return g
fs = json.load(open('finalistas.json'))
sinais = {}
for f in glob.glob('sinais-out*.jsonl'):
    for l in open(f):
        if l.strip(): x = json.loads(l); sinais[x['fid']] = ler(x)
for r in fs:
    s = 0.0; por = []
    av = int(str(r['aval']).replace('.', ''))
    if 15 <= av <= 100: s += 2; por.append('loja pequena')
    elif 100 < av <= 150: s += 1; por.append('loja pequena/média')
    else: s += 0.5
    if r.get('cel_google'): s += 2; por.append('celular no Google')
    elif r.get('cel_wa') or r.get('cel_legenda'): s += 1; por.append('celular no Instagram')
    if r['dias'] <= 21: s += 1; por.append('posta toda semana')
    if 1000 <= r['seguidores'] <= 30000: s += 1
    elif r['seguidores'] >= 500: s += 0.5
    if r['tipo_site'] in ('dominio', 'site simples/gratuito'): s += 1; por.append(f"site quebrado ({r.get('site_status')})")
    g = sinais.get(r['fid'])
    if g:
        g = limpar_nomes(g, r)
        if g['mencoes_dono']: s += 2; por.append('avaliação cita o dono/dona')
        if g['respostas_dono'] >= 2: s += 1; por.append(f"dono responde avaliações ({g['respostas_dono']} de {g['n_aval_lidas']})")
        if g['nomes'] and g['nomes'][0][1] >= 2 and g['n_nomes_distintos'] <= 2: s += 1; por.append(f"atendimento com nome: {g['nomes'][0][0]}")
    r['sinais'] = g; r['pontos'] = s; r['por'] = por
fs.sort(key=lambda r: (-r['pontos'], int(str(r['aval']).replace('.', ''))))
for i, r in enumerate(fs, 1): r['n'] = i
json.dump(fs, open('pontuados.json', 'w'), ensure_ascii=False, indent=0)
print('com avaliações lidas:', sum(1 for r in fs if r['sinais']), 'de', len(fs))
for r in fs:
    g = r['sinais'] or {}
    print(f"{r['n']:>3} {r['pontos']:>4} {r['nome'][:30]:30} @{r['ig'][:22]:22} {r['seguidores']:>6} {r['nota']}({r['aval']:>3}) {r['onde'][:28]:28} nomes={g.get('nomes', [])[:2]} resp={g.get('respostas_dono')} dono={g.get('mencoes_dono')}")
