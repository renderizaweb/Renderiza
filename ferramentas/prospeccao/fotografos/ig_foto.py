# Instagram de cada candidata: @ do Google (link, site, Linktree) ou variações do nome no embed; lê o embed completo.
# Uso: python3 -I ig_foto.py site.jsonl ig.jsonl   (só quem não tem site funcionando; retoma de onde parou)
import json, re, sys, os, time, unicodedata, subprocess, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from igler import ler
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode()
NAO = {'p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'direct', 'about', 'legal', 'developer', 'instagram'}
def ig_de(texto):
    for m in re.finditer(r'instagram\.com/([A-Za-z0-9_.]+)', texto or ''):
        u = m.group(1).rstrip('.').lower()
        if u not in NAO: return u
def pagina(u):
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '20', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0 Safari/537.36', u], capture_output=True)
    return r.stdout.decode('utf8', 'ignore')
GEN = set('fotografia fotografias fotografa fotografo fotografos fotos foto photo photos photography photographer fotografico fotografica studio studios estudio ensaio ensaios gestante gestantes newborn newborns infantil infantis familia familias bebe bebes kids smash cake the de da do das dos e sp sao paulo recem nascido nascidos book arte art by atelie imagem imagens maternidade especializada especializado em ensaio para e com lifestyle registros memorias acompanhamento parto pre wedding'.split())
LUG = set(norm('santana tucuruvi mooca penha tatuape guarulhos osasco barueri cotia santo andre sao bernardo campo caetano sul diadema maua mogi cruzes suzano aruja poa embu artes taboao serra carapicuiba jandira itapevi zona norte leste oeste abc paulista grande capital vila jardim parque itaquera pirituba lapa butanta moema ipiranga saude carrao').split())
def palavras(nome):
    n = norm(re.split(r'\s[|\-–(:,]\s?|\s-\s|[|:(,]', nome)[0])
    return [w for w in re.sub(r'[^a-z0-9 ]', ' ', n).split() if w not in GEN and w not in LUG and len(w) > 1]
def variantes(nome):
    w = palavras(nome)
    if not w: return []
    bases = [''.join(w[:2])]
    if len(w) >= 3: bases += [w[0] + w[-1], ''.join(w[:3])]
    if len(w) == 1: bases = [w[0]]
    stu = bool(re.search(r'\b(studio|estudio)\b', norm(nome)))
    v = []
    for c in bases:
        v += [c + 'fotografia', c + '.fotografia', c + '_fotografia', c + 'fotografa', c + '.fotografa', c + '_fotografa', c + 'foto', c + '.foto', c + 'fotos', c, c + 'fotografias', 'fotografa' + c, 'fotografia' + c, c + 'photo', c + 'photography', c + '.foto_', c + 'newborn']
        if stu: v += ['studio' + c, 'estudio' + c, 'studio.' + c, 'estudio.' + c, c + 'studio', c + '.studio']
    return [x for i, x in enumerate(v) if x not in v[:i] and 3 <= len(x) <= 30]
def bate_nome(p, nome):
    w = palavras(nome)
    fn = re.sub(r'[^a-z0-9]', '', norm(p.get('nome'))) + ' ' + re.sub(r'[^a-z0-9]', '', norm(p['u']))
    return bool(w) and all(x in fn for x in w[:2])
def um(d):
    fonte, u = None, None
    for x in [d.get('site', '')] + d.get('redes', []):
        u = ig_de(x)
        if u: fonte = 'google'; break
    if not u and d.get('tipo_site') == 'link na bio' and d.get('site'):
        u = ig_de(pagina(d['site']));  fonte = 'link na bio' if u else None
    tent = []
    if not u:
        for v in variantes(d['nome']):
            p = ler(v); tent.append(v); time.sleep(0.5)
            if 'erro' not in p and (p.get('seguidores') or 0) >= 300 and bate_nome(p, d['nome']):
                u = p['u']; fonte = 'variação do nome'; break
    if not u: return {**d, 'ig': None, 'tentativas': len(tent)}
    p = ler(u, f'th/{u.lower()}'); time.sleep(0.5)
    return {**d, 'ig': p.get('u', u).lower(), 'ig_fonte': fonte, 'ig_nome': p.get('nome'), 'seguidores': p.get('seguidores'), 'posts_total': p.get('posts_total'),
            'posts': [{k: x[k] for k in ('data', 'legenda', 'local', 'video', 'sc')} for x in p.get('posts', [])], 'ig_erro': p.get('erro'), 'tentativas': len(tent)}
if __name__ == '__main__':
    entrada, saida = sys.argv[1], sys.argv[2]
    feitos = set()
    if os.path.exists(saida): feitos = {json.loads(l)['fid'] for l in open(saida)}
    alvo = [json.loads(l) for l in open(entrada)]
    alvo = [d for d in alvo if d.get('passa_site') and d['fid'] not in feitos]
    print(len(alvo), 'para ler', flush=True)
    os.makedirs('th', exist_ok=True)
    with cf.ThreadPoolExecutor(int(os.environ.get('FILAS', '3'))) as ex, open(saida, 'a') as out:
        for r in ex.map(um, alvo):
            out.write(json.dumps(r, ensure_ascii=False) + '\n'); out.flush()
            print((r['nome'] or '')[:40], '->', r.get('ig'), r.get('seguidores'), r.get('ig_fonte'), flush=True)
