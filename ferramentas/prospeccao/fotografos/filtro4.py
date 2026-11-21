# Lote 4: junta as listas, tira repetidos (id do lugar), categoria de fotografia, exclusões pelo nome (negócio que não é
# fotógrafa), nota 4,8+, 15 a 250 avaliações, fora quem já está no painel ou nos lotes 1 a 3 (nome, @ e telefone).
import json, re, unicodedata, collections, glob, sys
def norm(s): return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii','ignore').decode())).strip()
rows = [json.loads(l) for f in sorted(glob.glob('lista*.jsonl')) for l in open(f)]
por = {}
for r in rows:
    m = re.search(r'!1s(0x[0-9a-f]+:0x[0-9a-f]+)', r['link'])
    if not m: continue
    fid = m.group(1)
    if fid not in por: por[fid] = {**r, 'fid': fid, 'qs': [r['q']]}
    else: por[fid]['qs'].append(r['q'])
lug = list(por.values())
CATS = ['Estúdio de fotografia', 'Estúdio fotográfico', 'Fotógrafo', 'Serviço de fotografia', 'Fotógrafo de casamento']
def categoria(r):
    t = r.get('txt', '')
    m = re.search(r'\d,\d\(\d[\d.]*\)\s*(.+?)\s*(?:·|$)', t)
    c = m.group(1).strip() if m else ''
    for k in ['Fotógrafo de casamento', 'Fotógrafo comercial'] + CATS:
        if c.startswith(k): return k
    return c[:40] or '?'
JA = json.load(open('ja.json')); JN = set(JA['nomes']); JT = set(JA['tels'])
EXC = r'\b(3x4|revela\w*|impress\w*|grafica|cabine|aluguel|locacao|drone|aere\w*|imobili\w*|escola|curso|cursos|workshop|loja|kodak|buffet|cerimonial|produtora|filmes|filmagem|cinema|podcast|gravacao|book rosa|sensual|boudoir|moda|fashion|agencia|modelos?|pet|pets|animal|produto|produtos|gastronomi\w*|arquitetura|documento\w*|passaporte|foto ?digital|minuto|expresso|copiadora|xerox|papelaria|otica|salao|beleza|maquiagem|dj|som|lab|laboratorio|formaturas?|colacao|tattoo|tatuagem|igreja)\b'
cont = collections.Counter(norm(l['nome']).split(' fotografia')[0][:18] for l in lug)
ok, fora = [], collections.Counter()
for l in lug:
    n = norm(l['nome']); nota = float(l['nota'].replace(',','.')) if l['nota'] else 0; av = int(l['aval'] or 0)
    l['categoria'] = categoria(l)
    tel = re.sub(r'\D', '', re.search(r'\(?\d{2}\)?\s?9?\d{4}-?\d{4}', l.get('txt','')).group(0)) if re.search(r'\(?\d{2}\)?\s?9?\d{4}-?\d{4}', l.get('txt','')) else ''
    if l['categoria'] not in CATS: fora['categoria fora: ' + l['categoria'][:25]]+=1; continue
    if n in JN or (tel and tel[-8:] in JT): fora['já no painel ou nos lotes 1 a 3']+=1; continue
    if re.search(EXC, n): fora['nome fora do perfil']+=1; continue
    if re.search(r'\bunidade\b|\bfilial\b|\bshopping\b', n): fora['unidade/shopping']+=1; continue
    if cont[n.split(' fotografia')[0][:18]] >= 3 and len(n.split(' fotografia')[0]) > 4: fora['várias unidades']+=1; continue
    if nota < 4.8: fora['nota < 4,8']+=1; continue
    if av < 15: fora['menos de 15 avaliações']+=1; continue
    if av > 250: fora['mais de 250 avaliações']+=1; continue
    ok.append(l)
fotog = sum(1 for l in lug if l['categoria'] in CATS + ['Fotógrafo comercial'])
cats = collections.Counter(k for k in fora if k.startswith('categoria'))
print(len(rows), 'linhas |', len(lug), 'lugares |', fotog, 'fotógrafos |', len(ok), 'no perfil do Google')
print({k: v for k, v in fora.items() if not k.startswith('categoria')})
with open('candidatos.jsonl','w') as f:
    for l in ok: f.write(json.dumps({'nome': l['nome'], 'link': l['link'], 'fid': l['fid'], 'nota': l['nota'], 'aval': l['aval'], 'q': l['q'], 'qs': l['qs'], 'categoria': l['categoria'], 'site_card': l.get('site',''), 'txt': l.get('txt','')}, ensure_ascii=False)+'\n')
