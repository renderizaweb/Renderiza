# Filtro do lote 3: independentes, nota 4,8+, 40 a 1.500 avaliações, fora quem já está no painel ou no lote 2.
import json, re, unicodedata, collections, glob
def norm(s): return re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', s.lower()).encode('ascii','ignore').decode()).strip()
rows = [json.loads(l) for f in sorted(glob.glob('lista*.jsonl')) for l in open(f)]
por = {}
for r in rows:
    m = re.search(r'!1s(0x[0-9a-f]+:0x[0-9a-f]+)', r['link'])
    if not m: continue
    fid = m.group(1)
    if fid not in por: por[fid] = {**r, 'fid': fid, 'qs': [r['q']]}
    else: por[fid]['qs'].append(r['q'])
lug = list(por.values())
def base(n):
    b = norm(n.split(' - ')[0].split(' | ')[0].split(',')[0])
    b = re.sub(r'\b(oticas?|opticas?|oculos|otica e relojoaria|relojoaria)\b', ' ', b)
    return re.sub(r'\s+', ' ', b).strip()
stop = {'de','do','da','dos','das','e','sao','santo','santa','centro','nova','novo','vila','jardim','a','o','the','sua','seu','mega','super','bela','boa','bom','casa','central','art','arte','la','le','my','meu','minha'}
def tok(n):
    t = [w for w in base(n).split() if w not in stop and len(w) > 2]
    return t[0] if t else base(n)
cont = collections.Counter(base(l['nome']) for l in lug)
cont1 = collections.Counter(tok(l['nome']) for l in lug)
redes = ['diniz','carol','chilli','otica max','opticalia','gassi','oticas brasil','santo grau','otica center','mercadotica','wanny','fabrica de oculos','les lunettes','oculos mania','sunglass','ceci','oticas paris','qoculos','hi oculos','zeiss','oticas visao','ray ban','oakley','oticas veja','precisao','grupo','lojas','drogaria','drogasil','pague menos','atacadao','hellen','vision express','vision center','bluevision','life is','isis','kosmos','tropical','oticas ideal','ultra optics','ultraoptics','multi optica','varilux','hoya','prevent','otica popular','oculos pronto','estacao','visao total','lunetterie','olhar certo','eyewear store','oticas carol','oculos e cia','otica do povo','oticas boa vista','santa lucia','fototica','otica brasil','oticas lux','luxottica','sol e cia','chilli beans','mais visao','oticas mais','otica mais','olho no olho','grupo otica','ponto de visao','oticas paulista','pao de acucar','carrefour','assai','walmart','oticas diniz','oculos store','otica salvador','oticas toscana','oticas uniao','oticas carol']
ja = ['catglass','perez','franco','sales','d r','der','laodiceia','iadala','amitie','atelie optico','lider','mogi otica','interativa','dutra','wagner','italo setti','cupece','perfil','pocopetz','boutique dos oculos','nina','rvn','studio7','studio 7','lez','haramaki','bonsucesso','vitoria','martinez ramos','mk','pl vyanna','owl','supreme','zoio','sao pedro','veneza','menezes','magnolia','embu otica','orbis','abreu','ll vision','lumina','portal','qlupa','estancia','suzan',
      'evangelica','yannis','nomura','vizzuti','juda','alianza','millennium','spaziani','dr otica','pontes','ojota','majestic','studio do oculos','gold vision','renova','ricoo','queirooz','imagem otica','medotica','de oculos','l oren','top otica','imperio vision','beni','plena visao','esther','future','realce','mabucu','rocha vision','juarez']
ok, fora = [], collections.Counter()
for l in lug:
    n = norm(l['nome']); nota = float(l['nota'].replace(',','.')) if l['nota'] else 0; av = int(l['aval'] or 0)
    txt = norm(l.get('txt',''))
    if not re.search(r'otic|optic|oculos|lente|visao|olhar|vision|eyewear', n + ' ' + txt): fora['nao e otica']+=1; continue
    if any(re.search(r'\b'+re.escape(k)+r'\b', n) for k in redes): fora['rede/franquia']+=1; continue
    gen = {'visao','vision','vista','bella','new','cidade','ideal','pro','olho','vitoria','sophia','jose','via','mundo','brasil','','cia','instituto','especialista','foto','oculos','optica','otica','vida','luz','sol','top','premium','gold','real','prime','style','estilo','arte','visual','lentes'}
    if cont[base(l['nome'])] >= 3 or (tok(l['nome']) not in gen and cont1[tok(l['nome'])] >= 3): fora['varias unidades']+=1; continue
    if re.search(r'\bunidade\b|\bloja \d|\bfilial\b|\bshopping\b', n): fora['unidade/shopping']+=1; continue
    if any(re.search(r'\b'+re.escape(k)+r'\b', n) for k in ja): fora['ja analisada']+=1; continue
    if nota < 4.8: fora['nota < 4,8']+=1; continue
    if av < 40: fora['menos de 40 avaliacoes']+=1; continue
    if av > 1500: fora['mais de 1500 (porte de rede)']+=1; continue
    ok.append(l)
print(len(rows), 'linhas |', len(lug), 'lugares unicos |', len(ok), 'passam |', dict(fora))
with open('candidatos.jsonl','w') as f:
    for l in ok: f.write(json.dumps({'nome': l['nome'], 'link': l['link'], 'fid': l['fid'], 'nota': l['nota'], 'aval': l['aval'], 'q': l['q'], 'site_card': l.get('site','')}, ensure_ascii=False)+'\n')
