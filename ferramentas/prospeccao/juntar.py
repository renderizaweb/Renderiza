# Corte do lote 3: Instagram ativo e com público; folha de fotos para avaliar.
import json, re, unicodedata, datetime, collections
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii','ignore').decode()
rs = [json.loads(l) for l in open('ig.jsonl')]
hoje = datetime.date.today()
fora = collections.Counter(); ok = []; vistos = set()
for r in rs:
    if not r.get('ig') or r.get('seguidores') is None: fora['sem instagram achado/legível']+=1; continue
    h = r['ig'].lower(); fn = norm(r.get('ig_nome')) + ' ' + h
    if h in vistos: fora['@ repetido']+=1; continue
    vistos.add(h)
    if not re.search(r'otic|optic|oculo|eye|lente|visao|vision|olhar|opti|lunet|glass', fn): fora['@ não parece ótica']+=1; continue
    datas = [u[0] for u in r.get('ultimos', []) if u[0]]
    ult = max(datas) if datas else None
    r['ultimo_post'] = ult; r['dias'] = (hoje - datetime.date.fromisoformat(ult)).days if ult else 9999
    if r['dias'] > 45: fora['sem post em 45 dias']+=1; continue
    if r['seguidores'] < 1000: fora['menos de 1.000 seguidores']+=1; continue
    if (r.get('posts_total') or 0) < 60: fora['menos de 60 posts']+=1; continue
    end = (r.get('endereco') or '').split(' - ')
    r['onde'] = ' · '.join(x.split(',')[0].strip() for x in end[-2:]) if len(end) >= 2 else r['q'].replace('ótica em ', '')
    ok.append(r)
print(len(rs), '->', len(ok), dict(fora))
ok.sort(key=lambda r: -r['seguidores'])
for i, r in enumerate(ok, 1): r['n'] = i
json.dump(ok, open('finalistas.json', 'w'), ensure_ascii=False, indent=0)
for r in ok: print(f"{r['n']:>3} {r['nome'][:34]:34} @{r['ig']:24} {r['seguidores']:>6} | {r['posts_total']:>4} p | {r['ultimo_post']} | {r['nota']} ({r['aval']}) | {r['tipo_site']} {r.get('site_status','')} | {r['ig_fonte']} | {r['onde'][:40]}")
