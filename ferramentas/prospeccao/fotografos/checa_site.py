# Situação do site do Google de cada lugar: nenhum, instagram, link na bio, facebook, whatsapp, funcionando ou morto (e por quê).
# Uso: python3 -I checa_site.py det.jsonl saida.jsonl
import json, re, sys, subprocess, urllib.parse, concurrent.futures as cf
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
def tipo(u):
    if not u: return 'nenhum'
    if re.search(r'instagram\.com', u): return 'instagram'
    if re.search(r'facebook\.com|fb\.com|fb\.me', u): return 'facebook'
    if re.search(r'wa\.me|whatsapp|wa\.link', u): return 'whatsapp'
    if re.search(r'linktr\.ee|linkbio|bio\.link|beacons|taplink|linkin\.bio|lnk\.bio|linkme|meulink|campsite|lnkd\.in|allmylinks|linkr\.bio|biolink', u): return 'link na bio'
    if re.search(r'google\.com/maps|g\.page|goo\.gl|maps\.app', u): return 'nenhum'
    return 'dominio'
def dns(host):
    r = subprocess.run(['curl', '-sS', '--max-time', '12', f'https://dns.google/resolve?name={host}&type=A'], capture_output=True, text=True)
    try: j = json.loads(r.stdout)
    except Exception: return 'erro', []
    st = {0: 'ok', 2: 'SERVFAIL', 3: 'NXDOMAIN'}.get(j.get('Status'), str(j.get('Status')))
    return st, [a.get('data') for a in j.get('Answer', [])]
def abre(u):
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '20', '-A', UA, '-o', '-', '-w', '\n@@%{http_code}@@%{url_effective}', u], capture_output=True)
    out = r.stdout.decode('utf8', 'ignore'); err = r.stderr.decode('utf8', 'ignore')
    m = re.search(r'\n@@(\d{3})@@(\S*)$', out)
    code, final = (m.group(1), m.group(2)) if m else ('000', '')
    corpo = out[:m.start()] if m else out
    return code, final, corpo, err.strip()[:120]
def situacao(u):
    t = tipo(u)
    if t != 'dominio': return {'tipo_site': t}
    host = urllib.parse.urlparse(u if '://' in u else 'http://' + u).hostname or ''
    st, ans = dns(host)
    if st in ('NXDOMAIN', 'SERVFAIL'): return {'tipo_site': 'morto', 'morto_por': f'domínio {st} ({host})', 'host': host}
    code, final, corpo, err = abre(u)
    low = corpo.lower(); txt = re.sub(r'<[^>]+>', ' ', low)
    plat = next((p for p, rx in [('alboom', r'alboom'), ('46graus', r'46graus'), ('wix', r'wix\.com|wixstatic|parastorage'), ('wordpress', r'wp-content|wordpress'), ('squarespace', r'squarespace'), ('pixieset', r'pixieset'), ('picsize', r'picsize'), ('google sites', r'sites\.google'), ('canva', r'canva\.site|my\.canva')] if re.search(rx, low + final)), '')
    morto = None
    if code == '000': morto = f'não abre ({err[:60]})'
    elif code.startswith(('4', '5')): morto = f'erro {code}'
    elif re.search(r'connectyourdomain|this domain is not connected|domain is not connected|isn.t connected to a website', low): morto = 'Wix desconectado'
    elif re.search(r'site (está )?(congelado|suspenso|desativado|indispon)|conta (suspensa|congelada)|website (suspended|frozen)|account suspended', txt): morto = 'site congelado/suspenso'
    elif re.search(r'domain (is )?(for sale|parked)|dom[ií]nio (est[aá] )?(à venda|a venda|dispon[ií]vel)|registro\.br|hostgator.*(parked|default)|parkingcrew|sedoparking|godaddy.*(parked|forsale)|this domain has expired|domínio expirado|dominio expirado', txt + low[:4000]): morto = 'domínio estacionado/à venda'
    elif len(re.sub(r'\s+', '', txt)) < 200 and not re.search(r'<script', low): morto = 'página vazia'
    elif re.search(r'error 1001|dns resolution error|origin dns error|error 52[0-9]', txt): morto = 'erro Cloudflare'
    elif re.search(r'p[aá]gina n[aã]o encontrada|page not found|404 not found', txt[:3000]) and len(txt) < 6000: morto = 'página não encontrada'
    titulo = re.search(r'<title[^>]*>(.*?)</title>', corpo, re.S | re.I)
    return {'tipo_site': 'morto' if morto else 'funcionando', 'morto_por': morto, 'host': host, 'site_code': code, 'site_final': final[:120], 'plataforma': plat, 'site_titulo': (titulo.group(1).strip()[:100] if titulo else ''), 'tam': len(corpo)}
if __name__ == '__main__':
    det = [json.loads(l) for l in open(sys.argv[1])]
    with cf.ThreadPoolExecutor(10) as ex:
        res = list(ex.map(lambda d: situacao(d.get('site') or d.get('site_card') or ''), det))
    with open(sys.argv[2], 'w') as f:
        for d, r in zip(det, res): f.write(json.dumps({**d, **r}, ensure_ascii=False) + '\n')
    import collections
    print(collections.Counter(r['tipo_site'] for r in res)); print(collections.Counter(r.get('morto_por') for r in res if r.get('morto_por')))
