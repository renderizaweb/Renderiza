# Corte do Instagram (1 mil a 30 mil seguidores, post nos últimos 30 dias) e sinais das legendas para a pré-nota.
# Uso: python3 -I juntar_foto.py ig.jsonl finalistas.json [AAAA-MM-DD de hoje]
import json, re, sys, unicodedata, datetime, collections
sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..'))
from celular import eh_celular, achar_celulares
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode()
hoje = datetime.date.fromisoformat(sys.argv[3]) if len(sys.argv) > 3 else datetime.date.today()
rs = [json.loads(l) for l in open(sys.argv[1])]
ESP = {'gestante': r'gestant|gravidez|barriga|maternidade|gesta(cao|ção)', 'newborn': r'newborn|recem.nascid|rn\b|recem chegad', 'familia': r'familia|família|pais e filhos|mae e filh', 'infantil': r'infantil|crianca|kids|aniversario|mesversario|acompanhamento|1 aninho|primeiro ano|bebe', 'smash': r'smash'}
NEG = r'casamento|noiva|wedding|15 anos|debutante|corporativ|marca pessoal|evento|festa infantil|cobertura|formatura|pre.wedding|ensaio sensual|boudoir|pet\b|imovel|imobili'
def bairro(end):
    m = re.search(r'(?:^|\s-\s)([^,\-]+?),\s*([^,]+?)\s*-\s*SP\b', end or '')
    if not m: return '', ''
    b = m.group(1).strip()
    return ('' if re.match(r'(?i)^(bl|sl|sala|lj|loja|andar|box|piso|casa|\d)', b) else b), m.group(2).strip()
fora = collections.Counter(); ok = []; vistos = set()
for r in rs:
    if not r.get('ig'): fora['sem @ achado']+=1; continue
    if r.get('seguidores') is None: fora['embed não leu']+=1; continue
    h = r['ig'].lower()
    if h in vistos: fora['@ repetido']+=1; continue
    vistos.add(h)
    datas = [p['data'] for p in r.get('posts', []) if p.get('data')]
    ult = max(datas) if datas else None
    r['ultimo_post'] = ult; r['dias'] = (hoje - datetime.date.fromisoformat(ult)).days if ult else 9999
    if r['dias'] > 30: fora['sem post em 30 dias']+=1; continue
    if r['seguidores'] < 1000: fora['menos de 1 mil']+=1; continue
    if r['seguidores'] > 30000: fora['mais de 30 mil']+=1; continue
    leg = ' \n '.join(p.get('legenda') or '' for p in r.get('posts', []))
    ln = norm(leg + ' ' + (r.get('ig_nome') or '') + ' ' + r['nome'])
    r['esp'] = {k: len(re.findall(rx, ln)) for k, rx in ESP.items()}
    r['neg'] = sorted(set(re.findall(NEG, ln)))
    # Natal 2026: legenda de post de 2026 com "natal" (sem ser a cidade Natal-RN)
    nat = [p for p in r.get('posts', []) if (p.get('data') or '') >= '2026-08-01' and re.search(r'\bnatal(ino|ina|inas|inos)?\b', norm(p.get('legenda'))) and not re.search(r'natal.?(rn|/rn|- rn)', norm(p.get('legenda')))]
    r['natal'] = len(nat)
    r['natal_vagas'] = bool(re.search(r'vaga|horario|agenda|lote|garant|reserv|pre.venda|lista vip|ultim|whatsapp|informac|aberto|aberta', norm(' '.join(p.get('legenda') or '' for p in nat))))
    r['mini'] = bool(re.search(r'mini.?sess|mini.?ensaio', ln))
    b, cid = bairro(r.get('endereco'))
    r['bairro'], r['cidade'] = b, cid
    r['onde'] = ' · '.join(x for x in (b, cid) if x)
    # cidade conferida pelo Instagram: local marcado, 📍, nome da cidade/bairro nas legendas ou o telefone do Google
    locs = [p.get('local') for p in r.get('posts', []) if p.get('local')]
    tg = re.sub(r'\D', '', r.get('telefone') or '')[-8:]
    prova = []
    if tg and tg in re.sub(r'\D', '', leg): prova.append('telefone do Google na legenda')
    for k in (b, cid):
        if k and len(k) > 3 and norm(k) in norm(leg + ' ' + ' '.join(locs)): prova.append(f'"{k}" no Instagram')
    r['locais'] = sorted(set(locs))[:4]
    r['pinos'] = sorted(set(x.strip()[:60] for x in re.findall(r'📍([^\n]{3,60})', leg)))[:3]
    r['prova_cidade'] = prova
    r['cel_google'] = eh_celular(r.get('telefone'))
    r['cel_legenda'] = [c for c in achar_celulares(leg)][:2]
    r['cel_wa'] = [x for x in re.findall(r'wa\.me/(\d+)|phone=(\d+)', ' '.join(r.get('redes', []) + [r.get('site') or ''])) for x in x if x and eh_celular(x)][:1]
    r['tem_cel'] = bool(r['cel_google'] or r['cel_legenda'] or r['cel_wa'])
    ok.append(r)
print(len(rs), '->', len(ok), dict(fora))
json.dump(ok, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
