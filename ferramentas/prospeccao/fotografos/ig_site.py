# Segunda passada do @: para quem ficou sem @ e tem página (subdomínio, Linktree, site morto não), abre a página e pega o instagram.com/<@>.
import json, re, sys, os, time, subprocess, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from igler import ler
from ig_foto import ig_de, pagina
def um(d):
    if d.get('ig') or not d.get('site') or d.get('tipo_site') in ('morto', 'instagram'): return None
    u = ig_de(pagina(d['site']))
    if not u: return None
    p = ler(u, f'th/{u.lower()}'); time.sleep(0.5)
    if p.get('erro'): return None
    return {**d, 'ig': p.get('u', u).lower(), 'ig_fonte': 'página do site', 'ig_nome': p.get('nome'), 'seguidores': p.get('seguidores'), 'posts_total': p.get('posts_total'),
            'posts': [{k: x[k] for k in ('data', 'legenda', 'local', 'video', 'sc')} for x in p.get('posts', [])], 'ig_erro': p.get('erro')}
if __name__ == '__main__':
    rs = [json.loads(l) for l in open('ig.jsonl')]
    feitos = set()
    if os.path.exists('ig2.jsonl'): feitos = {json.loads(l)['fid'] for l in open('ig2.jsonl')}
    alvo = [d for d in rs if not d.get('ig') and d['fid'] not in feitos]
    with cf.ThreadPoolExecutor(4) as ex, open('ig2.jsonl', 'a') as out:
        for d, r in zip(alvo, ex.map(um, alvo)):
            out.write(json.dumps(r or {'fid': d['fid'], 'ig': None}, ensure_ascii=False) + '\n')
            if r: print(d['nome'][:40], '->', r['ig'], r['seguidores'], flush=True)
