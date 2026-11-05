# Embed público do Instagram, completo: seguidores, posts, foto do perfil, 6 últimos posts (data, legenda inteira, local).
import re, json, subprocess, datetime, os, time
def ler(u, pasta=None):
    r = subprocess.run(['curl', '-sS', '--max-time', '25', f'https://www.instagram.com/{u}/embed/'], capture_output=True)
    h = r.stdout.decode('utf8', 'ignore')
    m = re.search(r'"contextJSON":"((?:[^"\\]|\\.)*)"', h)
    if not m: return {'u': u, 'erro': 'sem embed' if len(h) > 1000 else f'vazio ({len(h)})'}
    try: ctx = json.loads(json.loads('"' + m.group(1) + '"'))['context']
    except Exception as e: return {'u': u, 'erro': 'json ' + str(e)[:40]}
    if ctx.get('followers_count') is None and not ctx.get('graphql_media'): return {'u': u, 'erro': 'sem perfil'}
    posts = []
    for e in ctx.get('graphql_media') or []:
        n = e.get('shortcode_media') or e
        cap = ''
        try: cap = n['edge_media_to_caption']['edges'][0]['node']['text']
        except Exception: pass
        ts = n.get('taken_at_timestamp')
        posts.append({'sc': n.get('shortcode'), 'data': datetime.datetime.fromtimestamp(ts, datetime.UTC).strftime('%Y-%m-%d') if ts else None,
                      'video': n.get('is_video'), 'img': n.get('display_url'), 'legenda': cap[:1500], 'local': (n.get('location') or {}).get('name')})
    out = {'u': ctx.get('username') or u, 'nome': ctx.get('full_name'), 'seguidores': ctx.get('followers_count'), 'posts_total': ctx.get('posts_count'),
           'foto_perfil': ctx.get('profile_pic_url'), 'posts': posts}
    if pasta:
        os.makedirs(pasta, exist_ok=True)
        if out['foto_perfil']: subprocess.run(['curl', '-sS', '--max-time', '20', '-o', f'{pasta}/perfil.jpg', out['foto_perfil']])
        for k, p in enumerate(posts[:6]):
            if p['img']: subprocess.run(['curl', '-sS', '--max-time', '20', '-o', f'{pasta}/{k:02d}.jpg', p['img']])
    return out
