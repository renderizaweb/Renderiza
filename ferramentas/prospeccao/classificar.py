# Site de cada lugar: fica quem não tem site próprio funcionando (site quebrado é bom sinal).
import json, re, subprocess, os, collections, concurrent.futures as cf
fs = sorted(f for f in os.listdir('.') if f.startswith('det') and f.endswith('.jsonl'))
det = [json.loads(l) for f in fs for l in open(f)]
def tipo_site(u):
    if not u: return 'sem site'
    if re.search(r'instagram\.com', u): return 'instagram'
    if re.search(r'facebook\.com|fb\.com', u): return 'facebook'
    if re.search(r'wa\.me|whatsapp|api\.whatsapp', u): return 'whatsapp'
    if re.search(r'linktr\.ee|linkbio|bio\.link|beacons|taplink|linkin\.bio|lnk\.bio|linkme|meulink', u): return 'link na bio'
    if re.search(r'business\.site|sites\.google|wixsite|negocio\.site|ueniweb|webnode|goo\.gl|bit\.ly|tinyurl|g\.page|wa\.link', u): return 'site simples/gratuito'
    return 'dominio'
def checa(u):
    r = subprocess.run(['curl', '-sS', '-L', '--max-time', '15', '-o', '/dev/null', '-w', '%{http_code}', u], capture_output=True, text=True)
    return r.stdout.strip() or 'erro'
for d in det: d['tipo_site'] = tipo_site(d.get('site', ''))
doms = [d for d in det if d['tipo_site'] in ('dominio', 'site simples/gratuito')]
with cf.ThreadPoolExecutor(12) as ex:
    for d, st in zip(doms, ex.map(lambda d: checa(d['site']), doms)): d['site_status'] = st
for d in det:
    funciona = d['tipo_site'] in ('dominio', 'site simples/gratuito') and str(d.get('site_status', '')).startswith(('2', '3'))
    d['passa_site'] = not d.get('erro') and not d.get('fechado') and not funciona
print(len(det), collections.Counter(d['tipo_site'] for d in det), '| passam:', sum(d['passa_site'] for d in det))
print(collections.Counter(d.get('site_status') for d in doms))
for i, f in enumerate(fs): pass
json.dump(det, open('detalhes.json', 'w'), ensure_ascii=False, indent=0)
# o ig-etapa lê os det*.jsonl: regrava com a marcação
for f in fs: os.remove(f)
with open('det-all.jsonl', 'w') as o:
    for d in det: o.write(json.dumps(d, ensure_ascii=False) + '\n')
