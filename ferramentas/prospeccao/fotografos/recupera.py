# Recupera o @ de quem ficou sem: (1) página na Alboom pelo nome ou pelo domínio morto, com o telefone do Google na página;
# (2) o @ igual ao nome do domínio morto ou do subdomínio, aceito só com prova (telefone nas legendas, cidade nos posts ou
# @ na página). Uso: python3 -I recupera.py  → rec.jsonl (mesmo formato do ig.jsonl)
import json, re, sys, os, time, subprocess, unicodedata, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from igler import ler
from alboom import slugs as slugs_nome
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode()
NAO = {'p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'direct', 'about', 'legal', 'developer', 'instagram', 'alboom', 'alboompro', 'alboomoficial'}
def get(u):
    p = subprocess.run(['curl', '-sS', '-L', '--max-time', '20', '-o', '-', '-w', '\n@@%{http_code}', u], capture_output=True)
    out = p.stdout.decode('utf8', 'ignore'); m = re.search(r'\n@@(\d{3})$', out)
    return (m.group(1) if m else '000'), (out[:m.start()] if m else out)
def base_host(r):
    h = (r.get('host') or r.get('subdominio') or '').lower()
    h = re.sub(r'^www\.', '', h)
    if re.search(r'alboompro\.com$|46graus\.com$|myportfolio\.com$|wixsite\.com$|canva\.site$', h): return h.split('.')[0]
    return h.split('.')[0] if h else ''
def um(r):
    t8 = re.sub(r'\D', '', r.get('telefone') or '')[-8:]
    cid = norm((r.get('endereco') or '').split(' - SP')[0].split(',')[-1]).strip()
    bases = [b for b in dict.fromkeys([base_host(r)] + slugs_nome({'nome': r['nome'], 'ig': ''})) if b and len(b) >= 4]
    achados = []
    # (1) Alboom
    for s in bases[:9]:
        code, h = get(f'https://{s}.alboompro.com')
        if code != '200': continue
        if not (t8 and t8 in re.sub(r'\D', '', h)): continue
        for u in re.findall(r'instagram\.com/([A-Za-z0-9_.]+)', h):
            u = u.rstrip('.').lower()
            if u not in NAO: achados.append((u, f'página da Alboom ({s}.alboompro.com) com o telefone do Google'))
        if achados: break
    # (2) @ = nome do domínio morto / subdomínio
    if not achados and base_host(r):
        b = base_host(r)
        for u in dict.fromkeys([b, b.replace('fotografia', '.fotografia'), b.replace('fotografia', '_fotografia'), b + '_', b + 'oficial']):
            p = ler(u); time.sleep(0.6)
            if p.get('erro') or not p.get('posts'): continue
            leg = ' '.join((x.get('legenda') or '') for x in p['posts'])
            locs = ' '.join((x.get('local') or '') for x in p['posts'])
            prova = (t8 and t8 in re.sub(r'\D', '', leg)) or (cid and len(cid) > 3 and cid in norm(leg + ' ' + locs))
            if prova: achados.append((p.get('u', u).lower(), f'@ igual ao domínio ({b}), com ' + ('o telefone do Google nas legendas' if t8 and t8 in re.sub(r'\D', '', leg) else 'a cidade nos posts'))); break
    if not achados: return None
    u, fonte = achados[0]
    p = ler(u, f'th/{u}'); time.sleep(0.6)
    if p.get('erro'): return {**r, 'ig': u, 'ig_fonte': fonte, 'seguidores': None, 'ig_erro': p.get('erro')}
    return {**r, 'ig': p.get('u', u).lower(), 'ig_fonte': fonte, 'ig_nome': p.get('nome'), 'seguidores': p.get('seguidores'), 'posts_total': p.get('posts_total'),
            'posts': [{k: x[k] for k in ('data', 'legenda', 'local', 'video', 'sc')} for x in p.get('posts', [])], 'ig_erro': None}
if __name__ == '__main__':
    I = [json.loads(l) for l in open('ig_all.jsonl')]
    sem = [r for r in I if not r.get('ig')]
    with cf.ThreadPoolExecutor(5) as ex, open('rec.jsonl', 'w') as out:
        for r, x in zip(sem, ex.map(um, sem)):
            if x:
                out.write(json.dumps(x, ensure_ascii=False) + '\n'); out.flush()
                print(r['nome'][:40], '->', x['ig'], x.get('seguidores'), '|', x['ig_fonte'], flush=True)
