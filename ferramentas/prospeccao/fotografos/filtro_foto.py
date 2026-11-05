# Filtro do lote 2 de fotógrafos: categoria do card, exclusões pelo nome, nota 4,7+, 15 a 150 avaliações,
# fora as 20 do lote 1 (pelo id do lugar) e os conferidos no lote 1 com site próprio ou fora do perfil.
import json, re, unicodedata, collections, glob
def norm(s): return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', (s or '').lower()).encode('ascii','ignore').decode())).strip()
rows = [json.loads(l) for f in sorted(glob.glob('lista*.jsonl')) for l in open(f)]
por = {}
for r in rows:
    m = re.search(r'!1s(0x[0-9a-f]+:0x[0-9a-f]+)', r['link'])
    if not m: continue
    fid = m.group(1)
    if fid not in por: por[fid] = {**r, 'fid': fid, 'qs': [r['q']]}
    else: por[fid]['qs'].append(r['q'])
lug = list(por.values())
CATS = ['Estúdio de fotografia', 'Estúdio fotográfico', 'Fotógrafo', 'Serviço de fotografia']
def categoria(r):
    t = r.get('txt', '')
    m = re.search(r'\d,\d\(\d[\d.]*\)\s*(.+?)\s*(?:·|$)', t)
    c = m.group(1).strip() if m else ''
    for k in ['Fotógrafo de casamento', 'Fotógrafo comercial'] + CATS:
        if c.startswith(k): return k
    return c[:40] or '?'
L1 = {'0x94ce411042e885c9:0x4220462b0854b78','0x94ce8b83aa5cc32f:0xd31281bdd6bd8a9a','0x94ce5deb3311f7f3:0x8e819a65a46effc0','0x94ce695deb3d8f9d:0x10e805d813854f56','0x94ce4f91821cb337:0xa3ab38dac98d4078','0x94cfabbae3cad3b5:0x69546c9affea7cf0','0x94cef93610ce8905:0x89a07c5a99a9fb41','0x94ce5fc20af7375f:0x70b8209dee0f29b7','0x94cef5e575119459:0xd19c368f099fca1b','0x94ce5f7bc12c0ad7:0x6d7218c76a02942b','0x94ce5f6cede464b7:0x601aff7d74fe7ab7','0x94ce677fdd035c39:0x532630f0dbbf19a','0x94cef988e3a457f9:0x7f81362266133476','0x94ce43e31b1188f9:0xbe7d3b6f3c9bda57','0x94ce43702f721a25:0x23ca46f7dffd4253','0x94ce5ea96740c14b:0xf852743fd9f958dd','0x94ce43d5a63684b5:0x4a1fa4ec22087e91','0x94ce7b53916f576b:0x1edbc9ac10a2a31a','0x94ce7dfc436cc1ad:0xd57077056dc65546','0x94cef9fa7ebd9359:0x430c20b80c103344'}
# conferidos no lote 1 (docs/nichos/fotografos.md): site próprio funcionando ou cobertura de festa
L1_FORA = ['lu schoti','eternize','jhonatan santos','wellington noronha','adelia marinho','lari ferreira','click bambini','thalita silva']
L1_RESERVA = ['cris ribeiro','estudio anny fotografia','rosangela rocha','fabi santos','gabi nascimento']
EXC = r'\b(3x4|revela\w*|impress\w*|grafica|cabine|aluguel|locacao|drone|aere\w*|imobili\w*|corporativ\w*|empresarial|escola|curso|cursos|workshop|loja|kodak|casamento\w*|wedding|noivas?|eventos?|formatura\w*|buffet|festas?|produtora|filmes|filmagem|video|videos|cinema|podcast|gravacao|book rosa|sensual|boudoir|moda|fashion|modelos?|agencia|pet|pets|animal|produto|produtos|gastronomi\w*|arquitetura|documento\w*|passaporte|foto ?digital|minuto|expresso|copiadora|xerox|papelaria|otica|salao|beleza|maquiagem|cerimonial|dj|som|lab|laboratorio)\b'
cont = collections.Counter(norm(l['nome']).split(' fotografia')[0][:18] for l in lug)
ok, fora = [], collections.Counter()
for l in lug:
    n = norm(l['nome']); nota = float(l['nota'].replace(',','.')) if l['nota'] else 0; av = int(l['aval'] or 0)
    l['categoria'] = categoria(l)
    if l['fid'] in L1: fora['lote 1 (já no ar)']+=1; continue
    if l['categoria'] not in CATS: fora['categoria fora: ' + ('casamento' if 'casamento' in l['categoria'] else 'outra')]+=1; continue
    if any(k in n for k in L1_FORA): fora['conferido no lote 1 (site ou fora)']+=1; continue
    l['reserva_l1'] = any(k in n for k in L1_RESERVA)
    if re.search(EXC, n) and not l['reserva_l1']: fora['nome fora do perfil']+=1; continue
    if re.search(r'\bunidade\b|\bfilial\b|\bshopping\b', n): fora['unidade/shopping']+=1; continue
    if cont[n.split(' fotografia')[0][:18]] >= 3 and len(n.split(' fotografia')[0]) > 4: fora['varias unidades']+=1; continue
    if nota < 4.7: fora['nota < 4,7']+=1; continue
    if av < 15: fora['menos de 15 avaliacoes']+=1; continue
    if av > 150: fora['mais de 150 avaliacoes']+=1; continue
    ok.append(l)
fotog = sum(1 for l in lug if l['categoria'] in CATS + ['Fotógrafo de casamento','Fotógrafo comercial'])
print(len(rows), 'linhas |', len(lug), 'lugares |', fotog, 'fotógrafos |', len(ok), 'no perfil do Google |', dict(fora))
print('reservas do lote 1 achadas:', [l['nome'] for l in ok if l.get('reserva_l1')])
with open('candidatos.jsonl','w') as f:
    for l in ok: f.write(json.dumps({'nome': l['nome'], 'link': l['link'], 'fid': l['fid'], 'nota': l['nota'], 'aval': l['aval'], 'q': l['q'], 'qs': l['qs'], 'categoria': l['categoria'], 'site_card': l.get('site',''), 'reserva_l1': l.get('reserva_l1', False)}, ensure_ascii=False)+'\n')
