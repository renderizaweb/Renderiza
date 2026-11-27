# Pontuação do lote 4 (régua do estudo de quem esquentou, docs/nichos/fotografos.md, seção 11). Até 100:
#   Vitrine além do Instagram: site morto, página Alboom/portfólio grátis dela 25 · Facebook, Linktree ou WhatsApp 12 · sem link 8 · só Instagram 0
#   Ela atende e decide: nome dela nas avaliações 10 · sem equipe, sócia ou casal 10
#   Tamanho no Instagram: até 3 mil 15 · 3 a 6 mil 10 · 6 a 10 mil 5 · 10 a 15 mil 0
#   Google forte para o tamanho (avaliações por mil seguidores): 15+ 15 · 8+ 10 · 4+ 5
#   Ritmo: 6 posts em até 10 dias 10 · em até 20 dias 5
#   Negócio organizado: agenda, vagas ou pacotes nas legendas 5 · dois ou mais tipos de ensaio 5
#   Fotos (folha): 4,5+ 5 · 4+ 3
# Corte: folha 3,5+, sem "fora", celular, sem site próprio funcionando (domínio com o @ ou o telefone dela).
import json, re, glob, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ler_sinais import ler
try:
    from extra import E   # anotações à mão (dona, equipe, fora, site), fora do git: {"@": {"dona": ..., "equipe": bool, "fora": "motivo"}}
except ImportError:
    E = {}
F = {r['ig']: r for r in json.load(open('fin_tmp.json'))}
N = {}
for l in open('notas.jsonl'): n = json.loads(l); N[n['ig']] = {**N.get(n['ig'], {}), **n}
S = {}
for f in glob.glob('sinais-out*.jsonl'):
    for l in open(f): x = json.loads(l); S[x['fid']] = x
DOM, ALB = {}, {}
for f in glob.glob('dom_out_*.json'):
    for x in json.load(open(f)): DOM[x['ig']] = x
for f in glob.glob('alb_out_*.json'):
    for x in json.load(open(f)): ALB[x['ig']] = x
EQ = r'\b(equipe|as meninas|meninas|eles|voc[eê]s|os fot[oó]grafos|profissionais|assistente|maquiadora|o casal|s[oó]ci[ao])\b'
def avaliacoes(x):
    out = []
    for t in (x or {}).get('avaliacoes', []):
        c = re.split(r'Resposta do propriet[áa]rio', t)[0]
        ls = c.split('\n'); out.append(re.sub(r'\s+', ' ', '\n'.join(ls[2:]) if len(ls) > 2 else c))
    return out
res = []
for ig, n in N.items():
    if ig not in F or n.get('fora') or n['f'] < 3.5: continue
    r = F[ig]; e = E.get(ig, {}); p = {}; al = []
    if e.get('fora'): continue
    d = DOM.get(ig, {}); a = ALB.get(ig, {})
    proprio = [x for x in d.get('achados', []) if x['code'] == '200' and set(x['prova']) & {'@', 'telefone'}]
    if proprio and not e.get('site_ok'): r['site_proprio'] = proprio[0]['dominio']; continue
    alb = [x for x in a.get('alboom', []) if x['prova']]
    if not r.get('tem_cel'): al.append('sem celular achado')
    ts = r.get('tipo_site')
    p['vitrine'] = 25 if (ts in ('morto', 'subdominio') or alb or e.get('alboom')) else 12 if ts in ('facebook', 'link na bio', 'whatsapp') else 8 if ts == 'nenhum' else 0
    av = avaliacoes(S.get(r['fid']))
    txt = ' '.join(av)
    dona = e.get('dona')
    if dona is None:
        nomes = ler(S[r['fid']])['nomes'] if r['fid'] in S else []
        dona = next((k for k, c in nomes if c >= 2), '')
    equipe = e.get('equipe')
    if equipe is None: equipe = bool(re.search(EQ, txt, re.I))
    p['dona'] = (10 if dona else 0) + (0 if equipe else 10)
    s = r['seguidores']; p['tamanho'] = 15 if s < 3000 else 10 if s < 6000 else 5 if s < 10000 else 0
    p['google'] = 15 if r['ratio'] >= 15 else 10 if r['ratio'] >= 8 else 5 if r['ratio'] >= 4 else 0
    p['ritmo'] = 10 if r['span'] <= 10 else 5 if r['span'] <= 20 else 0
    p['negocio'] = (5 if r['agenda'] else 0) + (5 if len(r['serv']) >= 2 else 0)
    p['fotos'] = 5 if n['f'] >= 4.5 else 3 if n['f'] >= 4 else 0
    res.append({'ig': ig, 'nome': r['nome'], 'pontos': sum(p.values()), 'p': p, 'f': n['f'], 'c': n.get('c', ''), 'dona': dona, 'equipe': equipe,
                'seg': s, 'nota': r['nota'], 'aval': r['aval'], 'ratio': r['ratio'], 'onde': r['onde'], 'endereco': r.get('endereco'), 'telefone': r.get('telefone'),
                'cel': r.get('cel_google') or (r.get('cel_legenda') or [''])[0] or (r.get('cel_wa') or [''])[0], 'tipo_site': ts, 'site': r.get('site') or r.get('site_card'),
                'morto_por': r.get('morto_por'), 'alboom': [x['url'] for x in alb], 'ultimo_post': r['ultimo_post'], 'span': r['span'], 'natal': r['natal'], 'serv': r['serv'],
                'agenda': r['agenda'], 'locais': r['locais'], 'pinos': r['pinos'], 'prova': r['prova_cidade'], 'lidas': len(av), 'nota_extra': e.get('nota', ''),
                'fid': r['fid'], 'link': r['link'], 'alertas': al, 'av': av[:5], 'categoria': r.get('categoria')})
res.sort(key=lambda x: (-x['pontos'], -x['f']))
json.dump(res, open('ranking.json', 'w'), ensure_ascii=False, indent=1)
for i, x in enumerate(res, 1):
    print(f"{i:3}. {x['pontos']:3} {x['ig'][:28]:28} {x['seg']:6} {x['nota']}({x['aval']}) r{x['ratio']:5} {x['tipo_site'][:6]:6} alb{len(x['alboom'])} dona={x['dona'][:12] if x['dona'] else '-':12} eq={int(bool(x['equipe']))} lidas={x['lidas']} f{x['f']} | {x['onde'][:30]} | {x['p']}")
