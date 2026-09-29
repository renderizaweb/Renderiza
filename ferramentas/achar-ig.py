# Acha o @ do Instagram de cada ótica testando variações do nome no embed público do perfil.
# Uso: python3 achar-ig.py entrada.json saida.jsonl
import json, re, sys, unicodedata, subprocess, concurrent.futures as cf, time
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from igembed import perfil

def norm(s): return unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode()
GEN = r'\b(oticas?|opticas?|oculos|otica e relojoaria|relojoaria|e|de|do|da|dos|das|exame de vista( gratuito)?|oculos de grau|loja|centro|optical|eyewear)\b'
def nucleo(nome):
    n = norm(re.split(r'\s[|\-–(]\s?|\s-\s|\|', nome)[0])
    n = re.sub(GEN, ' ', n)
    return re.sub(r'[^a-z0-9]', '', n), [w for w in re.sub(r'[^a-z0-9 ]', ' ', n).split() if len(w) > 2]
def variantes(nome, cidade):
    c, palavras = nucleo(nome)
    if not c: return []
    cid = re.sub(r'[^a-z]', '', norm(cidade))
    v = [f'otica{c}', f'oticas{c}', f'{c}otica', f'{c}oticas', f'otica_{c}', f'oticas_{c}', f'otica.{c}', f'oticas.{c}', c, f'optica{c}', f'{c}.otica', f'{c}_otica', f'otica{c}oficial', f'oticas{c}oficial', f'{c}oficial', f'otica{c}{cid}'[:30], f'oticas{c}{cid}'[:30]]
    out = []
    for x in v:
        if x not in out and 3 <= len(x) <= 30: out.append(x)
    return out
def confere(ig, nome):
    c, palavras = nucleo(nome)
    fn = re.sub(r'[^a-z0-9]', '', norm(ig.get('nome') or '')) + re.sub(r'[^a-z0-9]', '', norm(ig['u']))
    return bool(palavras) and all(w in fn for w in palavras[:2])
def acha(l):
    cidade = l.get('q', '').replace('ótica em ', '').replace(' São Paulo', '').replace(' SP', '')
    tent = []
    for u in variantes(l['nome'], cidade):
        try: ig = perfil(u)
        except Exception as e: ig = {'erro': str(e)}
        tent.append(u)
        if (ig.get('seguidores') or 0) >= 80 and (ig.get('posts_total') or 0) >= 15 and confere(ig, l['nome']):
            return {**l, 'ig': u, 'ig_nome': ig.get('nome'), 'seguidores': ig['seguidores'], 'posts_total': ig['posts_total'], 'ultimos': [(p['data'], p['legenda'][:80]) for p in ig['posts']], 'tentativas': tent}
        time.sleep(0.4)
    return {**l, 'ig': None, 'tentativas': tent}
if __name__ == '__main__':
    lst = json.load(open(sys.argv[1]))
    with cf.ThreadPoolExecutor(4) as ex, open(sys.argv[2], 'a') as f:
        for r in ex.map(acha, lst):
            f.write(json.dumps(r, ensure_ascii=False) + '\n'); f.flush()
            print(r['nome'][:40], '->', r.get('ig'), r.get('seguidores'))
