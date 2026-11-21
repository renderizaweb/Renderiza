# Página na Alboom (plataforma paga de fotógrafo): testa <slug>.alboompro.com com o @ e variações do nome.
# 200 = existe (confere telefone, @ ou nome na página); 403 "Website não localizado" = não existe.
# Uso: python3 -I alboom.py finalistas.json saida.json
import json, re, sys, subprocess, unicodedata, concurrent.futures as cf
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode()
GEN = set('fotografia fotografias fotografa fotografo fotos foto photo photography studio estudio ensaio ensaios gestante newborn infantil familia bebe kids de da do das dos e sp sao paulo the'.split())
def slugs(r):
    w = [x for x in re.sub(r'[^a-z0-9 ]', ' ', norm(re.split(r'[|:(,\-–]', r['nome'])[0])).split() if x not in GEN and len(x) > 1]
    c = ''.join(w[:2]) if w else ''
    ig = re.sub(r'[^a-z0-9]', '', r['ig'])
    ig2 = re.sub(r'[^a-z0-9-]', '', r['ig'].replace('.', '-').replace('_', '-'))
    return [s for s in dict.fromkeys([ig, ig2, c, c + 'fotografia', c + 'fotografias', c + 'fotografa', 'studio' + c, 'estudio' + c, c + 'photography']) if len(s) >= 4]
def um(r):
    achou = []
    for s in slugs(r):
        p = subprocess.run(['curl', '-sS', '-L', '--max-time', '20', '-o', '-', '-w', '\n@@%{http_code}', f'https://{s}.alboompro.com'], capture_output=True)
        out = p.stdout.decode('utf8', 'ignore'); m = re.search(r'\n@@(\d{3})$', out); code = m.group(1) if m else '000'
        if code != '200': continue
        corpo = out[:m.start()]; low = norm(corpo)
        tit = re.search(r'<title[^>]*>(.*?)</title>', corpo, re.S | re.I)
        t8 = re.sub(r'\D', '', r.get('telefone') or '')[-8:]
        prova = [k for k, ok in [('telefone', t8 and t8 in re.sub(r'\D', '', corpo)), ('@', r['ig'] in low), ('cidade', r.get('cidade') and norm(r['cidade']) in low)] if ok]
        achou.append({'url': f'https://{s}.alboompro.com', 'titulo': (tit.group(1).strip()[:90] if tit else ''), 'prova': prova})
    return {'ig': r['ig'], 'testados': len(slugs(r)), 'alboom': achou}
if __name__ == '__main__':
    fs = json.load(open(sys.argv[1]))
    with cf.ThreadPoolExecutor(6) as ex: res = list(ex.map(um, fs))
    json.dump(res, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
    for x in res:
        for a in x['alboom']: print(f"{x['ig'][:26]:26} {a['url']:50} prova={a['prova']} | {a['titulo'][:60]}")
