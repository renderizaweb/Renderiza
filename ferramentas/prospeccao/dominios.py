# Site próprio fora do Google: confere no DNS (dns.google) os domínios óbvios de cada loja e abre os que existem.
# Uso: python3 dominios.py lojas.json   (lojas.json: {"dafe": ["oticadafe.com.br", "oticadafe.com"], ...})
# Domínio que existe não quer dizer que é da loja: abra e confira o título e o telefone (no lote 4, gaiotto.com.br
# era de esquadrias e oticaimperio.com.br de uma ótica de Sumaré). "000" no curl pode ser bloqueio do proxy.
import json, subprocess, sys, concurrent.futures as cf
def dns(d):
    r = subprocess.run(['curl', '-sS', '--max-time', '15', f'https://dns.google/resolve?name={d}&type=A'], capture_output=True, text=True)
    try: return [a['data'] for a in json.loads(r.stdout).get('Answer', []) if a.get('type') == 1]
    except Exception: return None
def http(d):
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '20', '-o', '/dev/null', '-w', '%{http_code} %{url_effective}', f'https://{d}'], capture_output=True, text=True)
    return r.stdout.strip() or r.stderr.strip()[:80]
def checa(d):
    ips = dns(d)
    return d, ips, (http(d) if ips else '')
lojas = json.load(open(sys.argv[1]))
todos = [(l, d) for l, ds in lojas.items() for d in ds]
with cf.ThreadPoolExecutor(12) as ex:
    res = list(ex.map(lambda x: (x[0], checa(x[1])), todos))
for l, (d, ips, h) in res:
    if ips: print(f'{l:12} {d:34} DNS={ips[:2]} HTTP={h}')
print('checados:', len(res), 'existem:', sum(1 for _, (d, ips, h) in res if ips))
