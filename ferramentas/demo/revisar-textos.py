# Revisor dos textos do portfólio de fotógrafa (demo.json → "portfolio"), ANTES de gerar e publicar.
# Pega o "pastelão": clichê de fotografia, superlativo, propaganda vazia, pressão de venda, a palavra "site", preço fora
# dos pacotes, emoji e exclamação no nosso texto, frase repetida e texto comprido demais.
#
# Uso: python3 -I ferramentas/demo/revisar-textos.py demos/<pasta> [demos/<pasta> ...]
# Sai com código 1 se houver ERRO. Regras e o porquê: .claude/skills/demo-portfolio-fotografa/SKILL.md ("Texto").
#
# Dois tipos de texto:
#   - o NOSSO (títulos, frases, "o que é", "quando fazer", quem fotografa, contato, pacotes): clichê e exagero são ERRO;
#   - a PALAVRA DOS OUTROS (avaliações, depoimentos, citação dela): não se reescreve, então clichê é só AVISO
#     ("escolha outro trecho, que conte algo concreto").
# Frase DELA usada num campo nosso (título tirado da legenda, nome da campanha de Natal): declare em
#   "portfolio": {"_dela": {"titulo": "legenda de 03/10/2026", "ensaios[0].frase": "nome da campanha"}}
# e o clichê vira AVISO. Use pouco: frase dela que é clichê ("momentos que merecem ser eternizados") continua ruim de
# título; prefira a frase dela que diz algo concreto (um lugar, um jeito de trabalhar, um número).
# Campos que começam com "_" (anotações para a ficha) não são revisados.
import json, os, re, sys

NOSSO_NAO = [
    # superlativo e propaganda vazia
    (r'\b(o|a|os|as) melhor(es)?\b', 'superlativo ("o melhor"): diga o fato (anos de estúdio, nº de avaliações, o que ela faz)'),
    (r'\bmelhor(es)? (do|da) (mundo|brasil|cidade|regi[aã]o|bairro|zona)', 'superlativo'),
    (r'\bn[uú]mero 1\b|\bn[ºo°] ?1\b|\btop\b', 'superlativo'),
    (r'\bincr[ií]ve(l|is)|\bperfeit[oa]s?\b|\bimpec[aá]ve(l|is)|\bespetacula|\bsensaciona|\bmaravilhos|\bextraordin[aá]ri|\bfant[aá]stic|\bdeslumbrant|\bespetacular', 'adjetivo de propaganda: mostre com a foto, não com o adjetivo'),
    (r'como (voc[eê] )?nunca (viu|imaginou|sonhou)|nunca (visto|antes visto)|de outro mundo|fora do comum|sem igual|[uú]nic[oa] (no|na|em) ', 'promessa vazia'),
    (r'\bimperd[ií]ve(l|is)|\bsurpreend|\bapaixonar|\bencantad|\bencant(a|ar|o|ador|adora)\b', 'propaganda vazia'),
    # clichê de fotografia
    (r'\bsonh(o|os|ar|ado|ada)\b', 'clichê ("sonho")'),
    (r'\bm[aá]gic[oa]s?\b|\bmagia\b', 'clichê ("mágico", "magia")'),
    (r'\binesquec[ií]ve(l|is)', 'clichê ("inesquecível")'),
    (r'\beterniz', 'clichê ("eternizar")'),
    (r'para (todo o )?sempre', 'clichê ("para sempre")'),
    (r'transform(a|ar|o|amos|ando) (os |seus |cada |esses? )?(momentos?|sorrisos?|vidas?|sonhos?|hist[oó]rias?|instantes?)', 'clichê ("transformar momentos em...")'),
    (r'momentos? (m[aá]gicos?|[uú]nicos?|especiais|inesquec)', 'clichê ("momentos únicos")'),
    (r'experi[eê]ncia (([uú]nica)|(inesquec)|(incr[ií]vel)|(m[aá]gica))', 'clichê ("experiência única")'),
    (r'cada detalhe', 'clichê ("cada detalhe")'),
    (r'(com|feito com|de) (muito |todo o )?(amor|carinho) e (muito )?(amor|carinho|dedica)', 'clichê ("com amor e carinho")'),
    (r'do jeitinho', 'clichê ("do jeitinho")'),
    (r'congel(ar|a) (o|um|esse) (momento|tempo)|parar o tempo', 'clichê ("congelar o momento")'),
    (r'registr(ar|amos|o) (sorrisos|emo[cç][oõ]es|sentimentos)', 'clichê ("registrar sorrisos/emoções")'),
    (r'mem[oó]rias? (afetivas?|eternas?|para a vida)|lembran[cç]as? eternas?', 'clichê ("memórias eternas")'),
    (r'o tempo (passa|voa)', 'clichê ("o tempo voa"): só se for a frase dela, entre aspas, como citação'),
    # pressão de venda e promessa
    (r'\bgarant(a|ido|imos|e o seu)\b|n[aã]o perca|corra|s[oó] hoje|aproveite|[uú]ltimas vagas|vagas limitadas|agora mesmo', 'pressão de venda ou promessa: a urgência honesta é o "quando fazer"'),
    # palavras proibidas da Renderiza
    (r'\bsite\b', 'a palavra "site" (no portfólio é "portfólio", "página", "ensaio")'),
    (r'de bairro', '"de bairro" é proibido em tudo da Renderiza'),
]
OUTROS_NAO = [r for r in NOSSO_NAO if r[0] not in (r'\bsite\b', r'de bairro')]
EMOJI = re.compile('[\U0001F300-\U0001FAFF☀-➿⭐❤]')
DE_OUTROS = ('avaliacoes', 'depo', 'citacao')         # palavra de cliente ou dela: não reescrever
NAO_E_TEXTO = ('arq', 'id', 'pedido', 'curto', 'capa', 'vitrine', 'tira', 'box', 'versao', '_sobre', 'local', 'preco', 'destaque', 'nome', 'tag', 'telefone', 'citacao_quem', 'alt')
LIMITE = {'titulo': 70, 'frase': 90, 'linha': 160, 'chamada': 40, 'texto': 320, 'quando': 220, 'olho': 60}
QUANDO_OK = re.compile(r'gestant|newborn|rec[eé]m|mes|m[eê]s|smash|natal|bolo|parto', re.I)

def textos(no, caminho=''):
    if isinstance(no, dict):
        for k, v in no.items(): yield from textos(v, f'{caminho}.{k}' if caminho else k)
    elif isinstance(no, list):
        for i, v in enumerate(no): yield from textos(v, f'{caminho}[{i}]')
    elif isinstance(no, str):
        yield caminho, no

def chave_final(caminho): return re.sub(r'\[\d+\]', '', caminho).split('.')[-1]

def revisar(pasta):
    d = json.load(open(os.path.join(pasta, 'demo.json'), encoding='utf-8'))
    p = d.get('portfolio')
    if not p: return [('ERRO', '-', 'sem "portfolio" no demo.json (é a demo antiga, não o portfólio v4)')], 0
    achados, vistos = [], {}
    dela = p.get('_dela') or {}
    for caminho, t in textos(p):
        if caminho.startswith('_'): continue
        k = chave_final(caminho)
        if k in NAO_E_TEXTO and not caminho.startswith(('sobre.p', 'contato.p')):
            if k == 'alt' and len(t) > 90: achados.append(('AVISO', caminho, f'alt comprido ({len(t)} letras): descreva a foto em uma linha'))
            continue
        de_outros = any(f'.{x}' in f'.{caminho}' or caminho.startswith(x) for x in DE_OUTROS) or caminho in dela
        regras = OUTROS_NAO if de_outros else NOSSO_NAO
        nivel = 'AVISO' if de_outros else 'ERRO'
        for rx, porque in regras:
            m = re.search(rx, t, re.I)
            if m:
                dica = ' (é palavra de cliente ou dela: troque por um trecho que conte algo concreto)' if de_outros else ''
                achados.append((nivel, caminho, f'{porque}{dica}: "…{t[max(0, m.start() - 25):m.end() + 25]}…"'))
        if not de_outros:
            if EMOJI.search(t): achados.append(('ERRO', caminho, 'emoji no nosso texto'))
            if '!' in t: achados.append(('AVISO', caminho, 'exclamação no nosso texto: o tom é calmo e direto'))
            if re.search(r'R\$', t) and not caminho.startswith('ensaios') or (re.search(r'R\$', t) and k not in ('preco', 'itens')):
                achados.append(('ERRO', caminho, 'preço fora dos pacotes'))
            if re.search(r'\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{5,}\b', t) and not re.search(r'\b(WHATSAPP|INSTAGRAM)\b', t): achados.append(('AVISO', caminho, 'palavra em CAIXA ALTA'))
            if k in LIMITE and len(t) > LIMITE[k]: achados.append(('AVISO', caminho, f'{k} comprido ({len(t)} letras; até ~{LIMITE[k]})'))
        else:
            if chave_final(caminho) == 'texto' and caminho.startswith('avaliacoes') and len(t) > 190:
                achados.append(('AVISO', caminho, f'trecho de avaliação comprido ({len(t)} letras; até ~175, com "…" onde cortou)'))
        norm = re.sub(r'\W+', ' ', t.lower()).strip()
        if len(norm) > 30:
            if norm in vistos and not de_outros: achados.append(('AVISO', caminho, f'frase repetida (igual a {vistos[norm]})'))
            vistos.setdefault(norm, caminho)
    for i, e in enumerate(p.get('ensaios', [])):
        if e.get('quando') and not QUANDO_OK.search(e.get('id', '') + ' ' + e.get('nome', '')):
            achados.append(('AVISO', f'ensaios[{i}].quando', f'"quando fazer" no ensaio "{e.get("nome")}": só em gestante, newborn, mês a mês, smash e Natal, e só com o que ela publicou'))
        if not e.get('depo'): achados.append(('AVISO', f'ensaios[{i}]', f'"{e.get("nome")}" sem depoimento: ok se nenhuma avaliação fala desse ensaio'))
    return achados, sum(1 for a in achados if a[0] == 'ERRO')

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit('uso: python3 -I ferramentas/demo/revisar-textos.py demos/<pasta> [...]')
    total = 0
    for pasta in sys.argv[1:]:
        achados, erros = revisar(pasta.rstrip('/'))
        total += erros
        print(f'== {os.path.basename(pasta.rstrip("/"))}: {erros} erro(s), {len(achados) - erros} aviso(s)')
        for nivel, caminho, msg in sorted(achados, key=lambda a: (a[0] != 'ERRO', a[1])):
            print(f'  {nivel:5} {caminho}: {msg}')
    sys.exit(1 if total else 0)
