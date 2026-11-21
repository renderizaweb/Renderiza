# Lote 4: corte do Instagram (1 mil a 15 mil seguidores, post em 30 dias) e os sinais do estudo de quem esquentou.
# Uso: python3 -I juntar4.py ig.jsonl finalistas.json 2026-11-21
import json, re, sys, unicodedata, datetime, collections, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from celular import eh_celular, achar_celulares
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode()
hoje = datetime.date.fromisoformat(sys.argv[3])
rs = [json.loads(l) for l in open(sys.argv[1])]
SERV = {'gestante': r'gestant|gravidez|barrig', 'newborn': r'newborn|recem.nascid', 'familia': r'familia|pais e filhos', 'infantil': r'infantil|crianca|kids|smash|mesversario|acompanhamento', 
        'eventos': r'evento|aniversario|festa|cha de bebe|batizado|15 anos|debutante', 'casamento': r'casamento|noiv|wedding', 'corporativo': r'corporativ|marca pessoal|empresari|linkedin', 'feminino': r'ensaio feminino|autoestima'}
NEG = r'boudoir|sensual|imobili|pet\b|curso de fotografia|mentoria para fotografos'
def bairro(end):
    m = re.search(r'(?:^|\s-\s)([^,\-]+?),\s*([^,]+?)\s*-\s*SP\b', end or '')
    if not m: return '', ''
    b = m.group(1).strip()
    return ('' if re.match(r'(?i)^(bl|sl|sala|lj|loja|andar|box|piso|casa|\d)', b) else b), m.group(2).strip()
JA = set(json.load(open('ja.json'))['igs'])
fora = collections.Counter(); ok = []; vistos = set()
for r in rs:
    if not r.get('ig'): fora['sem @ achado']+=1; continue
    if r.get('seguidores') is None: fora['embed não leu']+=1; continue
    h = r['ig'].lower()
    if h in vistos: fora['@ repetido']+=1; continue
    vistos.add(h)
    if h in JA: fora['@ já no painel ou nos lotes 1 a 3']+=1; continue
    datas = sorted([p['data'] for p in r.get('posts', []) if p.get('data')], reverse=True)
    ult = datas[0] if datas else None
    r['ultimo_post'] = ult; r['dias'] = (hoje - datetime.date.fromisoformat(ult)).days if ult else 9999
    r['span'] = (hoje - datetime.date.fromisoformat(datas[-1])).days if len(datas) >= 6 else 99
    if r['dias'] > 30: fora['sem post em 30 dias']+=1; continue
    if r['seguidores'] < 1000: fora['menos de 1 mil']+=1; continue
    if r['seguidores'] > 15000: fora['mais de 15 mil']+=1; continue
    leg = ' \n '.join(p.get('legenda') or '' for p in r.get('posts', []))
    ln = norm(leg + ' ' + (r.get('ig_nome') or '') + ' ' + r['nome'])
    r['serv'] = [k for k, rx in SERV.items() if re.search(rx, ln)]
    r['neg'] = sorted(set(re.findall(NEG, ln)))
    r['agenda'] = bool(re.search(r'agenda|vagas?\b|datas? (disponi|livre|abert)|horarios?|reserv|garanta|pacote|orcamento|investimento|condic', ln))
    r['natal'] = sum(1 for p in r.get('posts', []) if (p.get('data') or '') >= '2026-09-01' and re.search(r'\bnatal(ino|ina|inas|inos)?\b', norm(p.get('legenda'))) and not re.search(r'natal.?(rn|/rn|- rn)', norm(p.get('legenda'))))
    r['nos'] = len(re.findall(r'\b(nos|nosso|nossa|nossos|nossas|equipe|time)\b', norm(leg)))
    r['eu'] = len(re.findall(r'\b(eu|meu|minha|meus|minhas)\b', norm(leg)))
    r['videos'] = sum(1 for p in r.get('posts', []) if p.get('video'))
    b, cid = bairro(r.get('endereco'))
    r['bairro'], r['cidade'] = b, cid
    r['onde'] = ' · '.join(x for x in (b, cid) if x)
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
    av = int(r.get('aval') or 0); r['ratio'] = round(av / r['seguidores'] * 1000, 1)
    # pré-nota (sem fotos, avaliações, domínios e Alboom): só para ordenar as folhas
    ts = r.get('tipo_site'); pres = 25 if ts in ('morto', 'subdominio') else 12 if ts in ('facebook', 'link na bio', 'whatsapp') else 8 if ts == 'nenhum' else 0
    tam = 15 if r['seguidores'] < 3000 else 10 if r['seguidores'] < 6000 else 5 if r['seguidores'] < 10000 else 0
    rat = 15 if r['ratio'] >= 15 else 10 if r['ratio'] >= 8 else 5 if r['ratio'] >= 4 else 0
    rit = 10 if r['span'] <= 10 else 5 if r['span'] <= 20 else 0
    neg = (5 if r['agenda'] else 0) + (5 if len(r['serv']) >= 2 else 0)
    r['pre'] = pres + tam + rat + rit + neg
    ok.append(r)
ok.sort(key=lambda r: -r['pre'])
print(len(rs), '->', len(ok), dict(fora))
json.dump(ok, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
