# Lê o embed público do perfil do Instagram: seguidores, posts, últimos posts (data, legenda, foto).
# Uso: python3 igembed.py usuario [pasta_para_thumbs]
import re, json, sys, subprocess, datetime, os
def perfil(u, pasta=None):
    r = subprocess.run(['curl', '-sS', '--max-time', '25', f'https://www.instagram.com/{u}/embed/'], capture_output=True)
    h = r.stdout.decode('utf8', 'ignore')
    m = re.search(r'"contextJSON":"((?:[^"\\]|\\.)*)"', h)
    if not m: return {'u': u, 'erro': 'sem contextJSON', 'tam': len(h)}
    ctx = json.loads(json.loads('"' + m.group(1) + '"'))['context']
    g = ctx.get('graphql_media') or []
    posts = []
    for e in g:
        n = e.get('shortcode_media') or e
        cap = ''
        try: cap = n['edge_media_to_caption']['edges'][0]['node']['text']
        except Exception: pass
        ts = n.get('taken_at_timestamp')
        posts.append({'sc': n.get('shortcode'), 'data': datetime.datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d') if ts else None, 'video': n.get('is_video'), 'img': n.get('display_url'), 'legenda': cap[:300]})
    out = {'u': u, 'nome': ctx.get('full_name'), 'seguidores': ctx.get('followers_count'), 'posts_total': ctx.get('posts_count'), 'posts': posts}
    if pasta:
        os.makedirs(pasta, exist_ok=True)
        for k, p in enumerate(posts[:12]):
            if p['img']: subprocess.run(['curl', '-sS', '--max-time', '20', '-o', f'{pasta}/{u}_{k:02d}.jpg', p['img']])
    return out
if __name__ == '__main__':
    o = perfil(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    print(json.dumps({k: v for k, v in o.items() if k != 'posts'}, ensure_ascii=False), [(p['data'], p['legenda'][:60]) for p in o.get('posts', [])][:12])
