# Corte do Instagram: ativo e com público; folha de fotos para avaliar.
# Uso: python3 juntar.py [--seguidores 1000] [--posts 60] [--celular]
#   padrão = lote 3; lote 4 (perfil do estudo do ciclo 1): --seguidores 300 --posts 30 --celular
#   --celular: só fica quem tem WhatsApp de celular (no Google, num link wa.me ou nas legendas); fixo é atendente.
import argparse, json, re, unicodedata, datetime, collections
from celular import eh_celular, achar_celulares
ap = argparse.ArgumentParser()
ap.add_argument('--seguidores', type=int, default=1000)
ap.add_argument('--posts', type=int, default=60)
ap.add_argument('--celular', action='store_true')
a = ap.parse_args()
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii','ignore').decode()
def bairro(r):
    # o bairro é o trecho logo antes de ", Cidade - SP" (sem "sala", "loja", "bloco" e números)
    m = re.search(r'(?:^|\s-\s)([^,\-]+?),\s*([^,]+?)\s*-\s*[A-Z]{2}\b', r.get('endereco') or '')
    if not m: return '', ''
    b = m.group(1).strip()
    return ('' if re.match(r'(?i)^(bl|sl|sala|lj|loja|andar|box|piso|\d)', b) else b), m.group(2).strip()
rs = [json.loads(l) for l in open('ig.jsonl')]
hoje = datetime.date.today()
fora = collections.Counter(); ok = []; vistos = set()
for r in rs:
    if not r.get('ig') or r.get('seguidores') is None: fora['sem instagram achado/legível']+=1; continue
    h = r['ig'].lower(); fn = norm(r.get('ig_nome')) + ' ' + h
    if h in vistos: fora['@ repetido']+=1; continue
    vistos.add(h)
    if not re.search(r'otic|optic|oculo|eye|lente|visao|vision|olhar|opti|lunet|glass|visio', fn): fora['@ não parece ótica']+=1; continue
    datas = [u[0] for u in r.get('ultimos', []) if u and u[0]]
    ult = max(datas) if datas else None
    r['ultimo_post'] = ult; r['dias'] = (hoje - datetime.date.fromisoformat(ult)).days if ult else 9999
    if r['dias'] > 45: fora['sem post em 45 dias']+=1; continue
    if r['seguidores'] < a.seguidores: fora[f'menos de {a.seguidores} seguidores']+=1; continue
    if (r.get('posts_total') or 0) < a.posts: fora[f'menos de {a.posts} posts']+=1; continue
    legendas = ' '.join(u[1] for u in r.get('ultimos', []) if u and u[1])
    links = ' '.join(r.get('redes', []) + [r.get('site', '')])
    r['cel_google'] = eh_celular(r.get('telefone'))
    r['cel_wa'] = [x for x in re.findall(r'wa\.me/(\d+)|phone=(\d+)', links) for x in x if x and eh_celular(x)][:1]
    r['cel_legenda'] = achar_celulares(legendas)[:2]
    if a.celular and not (r['cel_google'] or r['cel_wa'] or r['cel_legenda']):
        fora['só fixo (sem celular no Google, no link nem nas legendas)']+=1; continue
    b, cidade = bairro(r)
    r['bairro'], r['cidade'] = b, cidade or r.get('cidade', '')
    r['onde'] = ' · '.join(x for x in (b, r['cidade']) if x) or r['q'].replace('ótica em ', '')
    ok.append(r)
print(len(rs), '->', len(ok), dict(fora))
ok.sort(key=lambda r: -r['seguidores'])
for i, r in enumerate(ok, 1): r['n'] = i
json.dump(ok, open('finalistas.json', 'w'), ensure_ascii=False, indent=0)
for r in ok: print(f"{r['n']:>3} {r['nome'][:34]:34} @{r['ig']:24} {r['seguidores']:>6} | {r['posts_total']:>4} p | {r['ultimo_post']} | {r['nota']} ({r['aval']}) | {r['tipo_site']} {r.get('site_status','')} | {r['ig_fonte']} | {r['onde'][:40]}")
