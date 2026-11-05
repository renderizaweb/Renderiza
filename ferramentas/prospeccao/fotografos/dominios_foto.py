# Site próprio fora do Google: testa no DNS os domínios óbvios (nome, nome+fotografia/fotografa/foto/photography, o @; .com.br e .com)
# e abre os que existem, conferindo telefone, @ e nome na página. Uso: python3 -I dominios_foto.py finalistas.json saida.json
import json, re, sys, subprocess, unicodedata, concurrent.futures as cf
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from checa_site import dns, abre
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode()
GEN = set('fotografia fotografias fotografa fotografo fotos foto photo photography studio estudio ensaio ensaios gestante newborn infantil familia bebe kids de da do das dos e sp sao paulo the'.split())
def doms(r):
    w = [x for x in re.sub(r'[^a-z0-9 ]', ' ', norm(re.split(r'[|:(,\-–]', r['nome'])[0])).split() if x not in GEN and len(x) > 1]
    c = ''.join(w[:2]) if w else ''
    ig = re.sub(r'[^a-z0-9]', '', r['ig'])
    bases = [b for b in dict.fromkeys([c, c + 'fotografia', c + 'fotografa', c + 'foto', c + 'fotos', c + 'photography', c + 'photo', 'studio' + c, 'estudio' + c, ig, ''.join(w[:3]) + 'fotografia' if len(w) >= 3 else '']) if len(b) >= 4]
    return [p + b + t for b in bases for t in ('.com.br', '.com') for p in ('', 'www.')]
def tel8(t): return re.sub(r'\D', '', t or '')[-8:]
def um(r):
    achados = []
    for d in doms(r):
        st, ans = dns(d)
        if st != 'ok' or not ans: continue
        code, final, corpo, err = abre('https://' + d)
        low = norm(corpo)
        prova = []
        if r['ig'] and r['ig'] in low: prova.append('@')
        t = tel8(r.get('telefone'))
        if t and t in re.sub(r'\D', '', corpo): prova.append('telefone')
        w = [x for x in re.sub(r'[^a-z0-9 ]', ' ', norm(r['nome'])).split() if x not in GEN and len(x) > 2][:2]
        if w and all(x in low for x in w): prova.append('nome')
        tit = re.search(r'<title[^>]*>(.*?)</title>', corpo, re.S | re.I)
        achados.append({'dominio': d, 'code': code, 'final': final[:80], 'titulo': (tit.group(1).strip()[:80] if tit else ''), 'prova': prova, 'tam': len(corpo)})
    return {'fid': r['fid'], 'ig': r['ig'], 'nome': r['nome'], 'testados': len(doms(r)), 'achados': achados}
if __name__ == '__main__':
    fs = json.load(open(sys.argv[1]))
    with cf.ThreadPoolExecutor(6) as ex: res = list(ex.map(um, fs))
    json.dump(res, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
    for x in res:
        for a in x['achados']: print(f"{x['ig'][:24]:24} {a['dominio']:36} {a['code']} prova={a['prova']} | {a['titulo'][:50]}")
