# Monta gravacoes/<id>.json no formato "reels" (gravar.mjs) a partir do roteiro padrão (roteiro.mjs --show) e de
# um spec curto com a história do vídeo, uma legenda por parada:
#   {"acento": "#…" (opcional: o acento clareado que o gerar.py imprimiu, para a legenda ler bem no escuro),
#    "fotos": [seletores da montagem] (opcional), "fechamento": {"titulo", "destaque"} (opcional),
#    "clima": "leve" | "sobrio" | "descolado" | "grife" (opcional, como no gravar.mjs),
#    "nome": [linha de cima, destaque] (opcional: o nome da abertura, quando a quebra automática fica estranha),
#    "cenas": [[tipo, legenda, sub opcional, {ajustes} opcional], …]}
#   tipos (na ordem da página): topo, story, stats, armacoes, estilo, estilos, rosto, atendimento, reviews, insta, visite.
#   Legenda: pergunta ou dor que o dono da ótica nem percebeu, e o site respondendo; o trecho entre * sai na cor da marca.
# Uso: python3 ferramentas/video/reels.py <id> <spec.json>   (depois: gravar.mjs gravacoes/<id>.json --ensaio)
import json, os, subprocess, sys

RZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TIPOS = {
    'topo': {'rolar': 0, 'segura': 2.3},
    'story': {'rolar': '.story-photos', 'segura': 2},
    'stats': {'rolar': '.stats', 'segura': 2},
    'armacoes': {'rolar': '#armacoes-track', 'alinhar': 'topo', 'segura': 2.6, 'acoes': [
        {'em': 0.5, 'tipo': 'deslizar', 'alvo': '#armacoes-track', 'cartoes': 1},
        {'em': 1.5, 'tipo': 'deslizar', 'alvo': '#armacoes-track', 'cartoes': 1}]},
    'estilo': {'rolar': '#estilo-track', 'alinhar': 'topo', 'segura': 2.2, 'acoes': [
        {'em': 0.45, 'tipo': 'deslizar', 'alvo': '#estilo-track', 'cartoes': 1, 'dur': 0.75},
        {'em': 1.3, 'tipo': 'deslizar', 'alvo': '#estilo-track', 'cartoes': 1, 'dur': 0.75}]},
    'estilos': {'rolar': '#estilos h2', 'alinhar': 'topo', 'segura': 2.2},
    'rosto': {'rolar': '.face-tool', 'alinhar': 'topo', 'segura': 2.4, 'acoes': [
        {'em': 0.6, 'tipo': 'tocar', 'alvo': '.face-option[data-face=redondo]', 'clicar': True},
        {'em': 1.5, 'tipo': 'tocar', 'alvo': '.face-option[data-face=coracao]', 'clicar': True}]},
    'atendimento': {'rolar': '#atendimento h2', 'alinhar': 'topo', 'segura': 2.2},
    'reviews': {'rolar': '#reviews-track', 'alinhar': 'topo', 'segura': 2.5, 'acoes': [
        {'em': 0.7, 'tipo': 'deslizar', 'alvo': '#reviews-track', 'cartoes': 1}]},
    'insta': {'rolar': '.insta-photo', 'segura': 2},
    'visite': {'rolar': '#visite .button--mustard', 'segura': 2.6, 'acoes': [
        {'em': 1, 'tipo': 'tocar', 'alvo': '#visite .button--mustard'}]},
}

ident, spec_arq = sys.argv[1], sys.argv[2]
spec = json.load(open(spec_arq, encoding='utf-8'))
saida = f'{RZ}/gravacoes/{ident}.json'
subprocess.run(['node', f'{RZ}/ferramentas/video/roteiro.mjs', ident, ident, '--show'], cwd=RZ, check=True, stdout=subprocess.DEVNULL, env={**os.environ, 'SOBRESCREVER': '1'})
R = json.load(open(saida, encoding='utf-8'))
R = {'demo': R['demo'], 'formato': 'reels', **{k: v for k, v in R.items() if k not in ('demo', 'cenas')}}
if spec.get('acento'): R['cores']['acento'] = spec['acento']
if spec.get('fotos'): R['abertura']['fotos'] = spec['fotos']
if spec.get('clima'): R['clima'] = spec['clima']
if spec.get('nome'): R['abertura']['nome'] = spec['nome']
R['fechamento'].update({'titulo': 'Tudo num lugar só,', 'destaque': f'com a cara da {R["abertura"]["nome"][-1]}.'})
R['fechamento'].update(spec.get('fechamento', {}))
cenas = []
for c in spec['cenas']:
    tipo, leg = c[0], c[1]
    ce = json.loads(json.dumps(TIPOS[tipo]))
    if isinstance(c[-1], dict): ce.update(c[-1])
    ce['legenda'] = leg
    if len(c) > 2 and isinstance(c[2], str): ce['sub'] = c[2]
    cenas.append(ce)
R['cenas'] = cenas
json.dump(R, open(saida, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(saida, 'a').write('\n')
print(saida, len(cenas), 'cenas')
