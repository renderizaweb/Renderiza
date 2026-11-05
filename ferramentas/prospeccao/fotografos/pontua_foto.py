# Pontuação do lote 2 de fotógrafos (0 a 100), com fórmula aberta:
#   Fotos na folha (0 a 5, olhadas a olho) x 6 ............................. até 30
#   Especialidade nas legendas (família, gestante, newborn, infantil, smash):
#       10+ menções 15 | 5 a 9: 12 | 1 a 4: 8 | 0: 4; menos 4 se faz casamento, 15 anos, formatura, evento, corporativo ou feminino sensual
#   Natal 2026 nos últimos posts: vendendo (vaga, agenda, lote, reserva, pré-venda) 15 | só mostrando 11 | mini sessão 5 | nada 0
#   Site: morto confirmado 15 | nenhum, Instagram, Linktree, Facebook ou WhatsApp 8
#   Dona: rosto no perfil 5 + nome dela nas avaliações do Google 5 .......... até 10
#   WhatsApp de celular: no Google 5 | só no Instagram 3
#   Instagram: 2 mil a 15 mil seguidores 5 | 1 a 2 mil ou 15 a 30 mil 3
#   Post na última semana (desde 29/10) 5
#   Quem atende: menos 5 quando as avaliações mostram equipe ou mais de uma pessoa ("as meninas", "eles", dois nomes)
import json, re, glob, sys, unicodedata
sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..'))
from ler_sinais import ler
def norm(s): return unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii', 'ignore').decode()
N = {}
for l in open('notas.jsonl'):
    n = json.loads(l); N[n['ig']] = {**N.get(n['ig'], {}), **n}
F = {r['ig']: r for r in json.load(open('fin_all.json'))}
S = {}
for f in glob.glob('sinais-out*.jsonl'):
    for l in open(f):
        x = json.loads(l); S[x['fid']] = ler(x)
EXTRA = json.load(open('extra.json')) if glob.glob('extra.json') else {}
out = []
for ig, n in N.items():
    if n.get('fora') or n['f'] < 3.5 or ig not in F: continue
    r = F[ig]; e = EXTRA.get(ig, {}); p = {}
    p['fotos'] = round(n['f'] * 6)
    t = sum(r['esp'].values())
    p['especialidade'] = 15 if t >= 10 else 12 if t >= 5 else 8 if t >= 1 else 4
    if re.search(r'casamento|wedding|noiva|15 anos|debutante|formatura|evento|corporativ|marca pessoal|sensual', ' '.join(r['neg']) + ' ' + norm(n['c'])): p['especialidade'] = max(0, p['especialidade'] - 4)
    natal_txt = re.search(r'natal', norm(n['c']))
    if r['natal'] and r['natal_vagas']: p['natal'] = 15
    elif r['natal'] or natal_txt: p['natal'] = 11
    elif r['mini']: p['natal'] = 5
    else: p['natal'] = 0
    p['site'] = 15 if e.get('site_morto') else 8
    c = norm(n['c'])
    rosto = bool(re.search(r'dona com rosto|dona aparece|dona com camera|perfil com a dona|casal no perfil|duas mulheres no perfil|perfil com o casal|dona com camera', c))
    g = S.get(r['fid'])
    nome_dona = e.get('dona')
    if not nome_dona and g and g['nomes']:
        cand = [(a, b) for a, b in g['nomes'] if norm(a) not in ('estudio', 'studio', 'fotografia', 'foto', 'photo', 'smash', 'natal')]
        top, k = cand[0] if cand else ('', 0)
        if top and k >= 2 and norm(top) in norm(r['nome'] + ' ' + (r.get('ig_nome') or '') + ' ' + ig): nome_dona = top
    p['dona'] = (5 if rosto else 0) + (5 if nome_dona else 0)
    p['quem_atende'] = -5 if e.get('equipe') else 0
    p['whatsapp'] = 5 if r['cel_google'] else 3 if (r['cel_legenda'] or r['cel_wa']) else 0
    s = r['seguidores']; p['instagram'] = 5 if 2000 <= s <= 15000 else 3
    p['ativa'] = 5 if r['dias'] <= 7 else 0
    tot = sum(p.values())
    out.append({'ig': ig, 'pontos': tot, 'partes': p, 'nota_folha': n['f'], 'comentario': n['c'], 'dona': nome_dona, 'rosto': rosto, 'avaliacoes_lidas': g, **{k: r.get(k) for k in ('nome', 'nomeMaps', 'onde', 'endereco', 'telefone', 'seguidores', 'ultimo_post', 'nota', 'aval', 'tipo_site', 'morto_por', 'site', 'ig_fonte', 'ig_nome', 'natal', 'natal_vagas', 'esp', 'neg', 'cel_google', 'cel_legenda', 'prova_cidade', 'locais', 'pinos', 'link', 'fid', 'categoria')}, 'extra': e})
out.sort(key=lambda x: (-x['pontos'], -x['nota_folha'], int(str(x['aval']).replace('.', ''))))  # empate: nota das fotos, depois menos avaliações
for i, x in enumerate(out, 1): x['rank'] = i
json.dump(out, open('ranking.json', 'w'), ensure_ascii=False, indent=0)
for x in out[:45]:
    print(f"{x['rank']:>2} {x['pontos']:>3} @{x['ig'][:26]:26} {x['seguidores']:>6} {x['nota']}({x['aval']:>3}) {x['onde'][:26]:26} {x['partes']} dona={x['dona']}")
