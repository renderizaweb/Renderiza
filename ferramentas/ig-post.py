# Lê o embed público de um post do Instagram: legenda, fotos do carrossel em tamanho cheio e vídeo.
# Uso: python3 ig-post.py <shortcode> [pasta]   -> imprime JSON e baixa as mídias (jpg e mp4) para a pasta.
# Vídeo vira foto: tirar quadros com o ffmpeg (pip install imageio-ffmpeg) e escolher os nítidos.
import re, json, sys, subprocess, datetime, os
def post(sc, pasta=None):
    r = subprocess.run(['curl', '-sS', '--max-time', '25', f'https://www.instagram.com/p/{sc}/embed/captioned/'], capture_output=True)
    h = r.stdout.decode('utf8', 'ignore')
    m = re.search(r'"contextJSON":"((?:[^"\\]|\\.)*)"', h)
    if not m: return {'sc': sc, 'erro': 'sem contextJSON', 'tam': len(h)}
    ctx = json.loads(json.loads('"' + m.group(1) + '"'))
    def acha(o):
        if isinstance(o, dict):
            if 'shortcode' in o and ('display_url' in o or 'edge_sidecar_to_children' in o): return o
            for v in o.values():
                x = acha(v)
                if x: return x
        if isinstance(o, list):
            for v in o:
                x = acha(v)
                if x: return x
    md = acha(ctx) or {}
    kids = [e['node'] for e in md.get('edge_sidecar_to_children', {}).get('edges', [])] or [md]
    cap = ''
    try: cap = md['edge_media_to_caption']['edges'][0]['node']['text']
    except Exception: pass
    ts = md.get('taken_at_timestamp')
    out = {'sc': sc, 'data': datetime.datetime.utcfromtimestamp(ts).strftime('%Y-%m-%d') if ts else None, 'legenda': cap, 'midias': []}
    for k, n in enumerate(kids):
        item = {'img': n.get('display_url'), 'video': n.get('video_url'), 'w': (n.get('dimensions') or {}).get('width')}
        out['midias'].append(item)
        if pasta:
            os.makedirs(pasta, exist_ok=True)
            if item['img']: subprocess.run(['curl', '-sS', '--max-time', '30', '-o', f'{pasta}/{sc}_{k:02d}.jpg', item['img']])
            if item['video']: subprocess.run(['curl', '-sS', '--max-time', '90', '-o', f'{pasta}/{sc}_{k:02d}.mp4', item['video']])
    return out
if __name__ == '__main__':
    print(json.dumps(post(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None), ensure_ascii=False))
