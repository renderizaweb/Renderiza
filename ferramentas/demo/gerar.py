# Gera a demo de uma ótica (arquivo HTML único) a partir de um JSON: textos, cores, fotos escolhidas
# e dados do Google. É a "linha comum" das demos: mesma base visual (CSS da Laodiceia, runtime da Perez),
# cores e fonte de cada marca, carrosséis do tamanho que o Instagram da ótica permitir.
#
# Uso: python3 gerar.py <demo.json> [--saida <arquivo.html>]
#   Sem --saida, grava em demos/<pasta>/index.html deste repositório.
#   Depois: node validar.mjs <arquivo.html> <pasta_capturas>
#
# Fotos: cada foto é {"id": n} (número da folha do inventario-fotos.py) ou {"arquivo": caminho}, com
#   "box": [x0, y0, x1, y1] opcional (recorte em frações da foto, 0 a 1) e "c": [cx, cy] opcional
#   (centro do enquadramento, 0 a 1). A foto é recortada no tamanho da vaga e embutida em base64.
# Avaliações: {"nome": "...", "tag": "...", "texto": opcional} (ou {"i": n} = posição na lista do google.json;
#   rode com --avaliacoes para ver a lista numerada; só entram as de 5 estrelas).
# Básico bem feito (pouca foto boa): carrosseis = []; estilos sem "solar" (fica o card de grau + formato
#   de rosto) e cada card aceita "titulo"/"rotulo" (ex.: "Óculos 2 em 1"); insta sem "foto" (só texto e
#   botão); atendimento com "formato": "paisagem" para foto de grupo (equipe) sem cortar ninguém.
import base64, colorsys, html, io, json, os, re, sys
from PIL import Image, ImageFilter, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))

FONTES = {
    'Archivo': ('Archivo:wght@700;800;900', '"Archivo",system-ui,sans-serif', False),
    'Bricolage Grotesque': ('Bricolage+Grotesque:opsz,wght@12..96,600..800', '"Bricolage Grotesque",system-ui,sans-serif', False),
    'Outfit': ('Outfit:wght@600;700;800', '"Outfit",system-ui,sans-serif', False),
    'Sora': ('Sora:wght@600;700;800', '"Sora",system-ui,sans-serif', False),
    'Montserrat': ('Montserrat:wght@700;800;900', '"Montserrat",system-ui,sans-serif', False),
    'Poppins': ('Poppins:wght@600;700;800', '"Poppins",system-ui,sans-serif', False),
    'Fraunces': ('Fraunces:opsz,wght@9..144,600..900', '"Fraunces",Georgia,serif', True),
    'Playfair Display': ('Playfair+Display:ital,wght@0,600..800;1,600..700', '"Playfair Display",Georgia,serif', True),
    'Lora': ('Lora:ital,wght@0,600;0,700;1,600', '"Lora",Georgia,serif', True),
}
VAGAS = {'hero': (800, 960), 'sobre': (576, 720), 'sobre_pol': (420, 479), 'grau': (640, 595), 'solar': (640, 595),
         'atend': (640, 640), 'atend_paisagem': (720, 540), 'atend_pol': (420, 504), 'insta': (600, 750), 'logo': (200, 200)}
FORMATOS = {'quadrado': (560, 560), 'retrato': (520, 650), 'paisagem': (680, 510)}
DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
DIAS_CURTOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
esc = lambda t: html.escape(str(t), quote=True)

# ---------- cores ----------
def hls(h):
    h = h.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)); return colorsys.rgb_to_hls(r, g, b)
def de_hls(h, l, s):
    cl = lambda v: max(0.0, min(1.0, v)); r, g, b = colorsys.hls_to_rgb(h % 1, cl(l), cl(s))
    return '%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255))
def lum(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def contraste(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)

def paleta(escuro, acento, tinta='escuro'):
    """Cores da base (amarelo e quase-preto da Laodiceia) -> cores da marca, mantendo as relações de luz."""
    hD, lD, sD = hls(escuro); hA, lA, sA = hls(acento)
    hT, _, sT = (hD, lD, sD) if tinta == 'escuro' else (hA, lA, sA)
    base = open(os.path.join(AQUI, 'base-head.html'), encoding='utf-8').read()
    mapa = {}
    for c in set(m.lower() for m in re.findall(r'#([0-9a-fA-F]{6})(?:[0-9a-fA-F]{2})?(?![0-9a-fA-F])', base)):
        if c in ('ffffff', '4fe08a', '169b55', '0b3a22'): continue          # branco e o verde de "aberto"
        h, l, s = hls(c)
        if l < 0.3 and s < 0.3: mapa[c] = de_hls(hD, lD + (l - 0.10), sD)    # escuros (fundo, texto)
        elif s >= 0.9 and l <= 0.7: mapa[c] = de_hls(hA, lA + (l - 0.50), sA)  # acento e variações
        elif s >= 0.9 and l <= 0.86: mapa[c] = de_hls(hA, max(l, 0.86), sA * 0.85)  # acento suave
        else: mapa[c] = de_hls(hT, l, min(s * 0.55, 0.35) * (1 if sT > 0.08 else 0.3))  # neutros e claros
    return mapa

def mostrar_nota(cfg):
    """A nota só aparece quando é 5,0; com 4,9 ou menos ficam as estrelas e o número de avaliações."""
    return cfg.get('mostrar_nota', cfg['google_nota'].strip() in ('5,0', '5'))

def tema(cfg):
    c = cfg['cores']; escuro = c['escuro'].lstrip('#'); acento = c['acento'].lstrip('#')
    # o acento vira texto no fundo escuro e fundo de texto escuro: precisa de contraste 4,5 com o escuro
    hA, lA, sA = hls(acento); passos = 0
    while contraste(acento, escuro) < 4.5 and passos < 40:
        lA += 0.015; acento = de_hls(hA, lA, sA); passos += 1
    if passos: print(f'  acento clareado para #{acento} (contraste {contraste(acento, escuro):.1f})')
    mapa = paleta(escuro, acento, c.get('tinta', 'escuro'))
    head = open(os.path.join(AQUI, 'base-head.html'), encoding='utf-8').read()
    head = re.sub(r'#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?(?![0-9a-fA-F])', lambda m: '#' + mapa.get(m.group(1).lower(), m.group(1)) + (m.group(2) or ''), head)
    head = head.replace('%23ffde00', '%23' + mapa['ffde00']).replace('%231d1b16', '%23' + mapa['1d1b16'])
    link, css, serifa = FONTES[cfg.get('fonte', 'Archivo')]
    extra = '.logo-mark{background:#fff;border:1px solid var(--line)}.logo-mark img{width:100%;height:100%;object-fit:cover}'
    extra += '.gallery-track--quadrado .vitrine-card{aspect-ratio:1}.gallery-track--retrato .vitrine-card{aspect-ratio:4/5}.gallery-track--paisagem .vitrine-card{aspect-ratio:4/3}'
    extra += '.vitrine-card figcaption{background:#fff;color:var(--ink)}.vitrine-grade{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.vitrine-grade .vitrine-card{aspect-ratio:1}@media(max-width:620px){.vitrine-grade{grid-template-columns:1fr}}'
    if serifa: extra += 'h1,h2{font-weight:700;letter-spacing:-.02em}h1 em,h2 em{font-style:italic;font-weight:600}.logo-text b{font-weight:800;letter-spacing:-.01em}.hero-proof-score,.stat strong,.google-score>strong{font-weight:700}'
    extra += '.logo,.logo-text{min-width:0}.logo-text b{overflow-wrap:anywhere}@media(max-width:620px){.logo-text b{font-size:1.05rem;line-height:1.15}}'
    # variantes do "básico bem feito": um card de estilo + formato de rosto; Instagram só com texto
    extra += '@media(min-width:621px){.styles-grid--dois{grid-template-columns:repeat(2,1fr)}.styles-grid--dois .style-card--tool{grid-column:auto}}'
    extra += '.insta-grid--solo{grid-template-columns:1fr;justify-items:center;text-align:center}.insta-grid--solo .insta-copy>p:not(.eyebrow){margin-inline:auto}.insta-grid--solo .insta-actions{justify-content:center}'
    # foto de grupo (equipe) na horizontal, sem cortar ninguém
    extra += '.experience-main.experience-main--paisagem{height:auto;aspect-ratio:4/3;border-radius:16px 64px 16px 16px}.experience-main--paisagem~.exam-card{top:auto;bottom:4px}'
    # no celular o número do destaque não pode passar por cima do texto ("Hoya e Zeiss", "5+ anos")
    extra += '@media(max-width:620px){.stat{grid-template-columns:minmax(110px,auto) 1fr}}@media(min-width:621px){.stats--2{grid-template-columns:repeat(2,1fr)}}'
    extra += cfg.get('css_extra', '')
    descricao = cfg['descricao'] if mostrar_nota(cfg) else re.sub(r'\s*Nota \d,\d no Google\.?', f' {cfg["google_total"]} avaliações no Google.', cfg['descricao'])
    troca = {'{{comentario}}': cfg['comentario'], '{{descricao}}': esc(descricao), '{{titulo}}': esc(cfg['titulo']),
             '{{fonte_link}}': link, '{{fonte_css}}': css, '{{css_extra}}': extra}
    for a, b in troca.items(): head = head.replace(a, b)
    return head

# ---------- fotos ----------
class Fotos:
    def __init__(self, inventario):
        self.inv = {i['id']: i for i in json.load(open(inventario))} if inventario else {}
        self.avisos = []
    def uri(self, spec, tam, nome):
        caminho = spec.get('arquivo') or self.inv[spec['id']]['arquivo']
        im = ImageOps.exif_transpose(Image.open(caminho)).convert('RGB')
        if 'box' in spec:
            x0, y0, x1, y1 = spec['box']; W, H = im.size
            im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
        escala = max(tam[0] / im.width, tam[1] / im.height)
        if escala > 1.25: self.avisos.append(f'{nome}: foto pequena para a vaga ({im.width}x{im.height} -> {tam[0]}x{tam[1]})')
        im = ImageOps.fit(im, tam, Image.LANCZOS, centering=tuple(spec.get('c', (0.5, 0.5))))
        if escala > 1.0:  # foto ampliada: um pouco de nitidez para não parecer borrada
            im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=min(90, round(40 + 60 * (escala - 1))), threshold=2))
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=spec.get('q', 80), optimize=True, progressive=True)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

# ---------- Google: horário e avaliações ----------
def ler_google(caminho):
    return json.load(open(caminho)) if caminho and os.path.exists(caminho) else {}

def horario(google):
    """['segunda-feira09:00–18:00', 'domingoFechado', ...] -> {0..6: [ini, fim] em minutos ou None}"""
    out = {}
    for linha in google.get('horas', []):
        linha = linha.replace('', '').strip()
        for i, d in enumerate(DIAS):
            if linha.lower().startswith(d):
                resto = linha[len(d):]
                faixas = re.findall(r'(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})', resto)
                if 'Fechado' in resto or not faixas: out[i] = None
                else: out[i] = [int(faixas[0][0]) * 60 + int(faixas[0][1]), int(faixas[-1][2]) * 60 + int(faixas[-1][3])]
    return out if len(out) == 7 else None

def fmt_h(m):
    h, mm = divmod(m, 60); return f'{h}h' + (f'{mm:02d}' if mm else '')

def linhas_horario(horas):
    """Agrupa dias seguidos com o mesmo horário: Segunda a sexta, Sábado, Domingo."""
    ordem = [1, 2, 3, 4, 5, 6, 0]; grupos = []
    for d in ordem:
        if grupos and grupos[-1][1] == horas[d]: grupos[-1][0].append(d)
        else: grupos.append([[d], horas[d]])
    out = []
    for dias, h in grupos:
        nome = DIAS_CURTOS[dias[0]] if len(dias) == 1 else f'{DIAS_CURTOS[dias[0]]} {"e" if len(dias) == 2 else "a"} {DIAS_CURTOS[dias[-1]].lower()}'
        out.append((nome, 'Fechado' if not h else f'{fmt_h(h[0])} às {fmt_h(h[1])}', ','.join(map(str, dias))))
    return out

def avaliacoes(google):
    """Avaliações de 5 estrelas, limpas: [{'nome', 'texto'}] na ordem do google.json."""
    out = []
    for a in google.get('avaliacoes', []):
        t = a['t']; linhas = t.split('\n')
        # (as 5 estrelas aparecem no texto mesmo quando a nota é 1: a nota vem do campo "nota")
        # linha da data ("5 meses atrás"); \b para não pegar nomes como "Adriano"
        k = next((i for i, l in enumerate(linhas) if i > 0 and len(l) < 40 and 'avalia' not in l
                  and re.search(r'\b(atrás|semanas?|m[eê]s|meses|anos?|dias?|horas?|minutos?)\b', l)), None)
        if k is None: continue
        corpo = []
        for l in linhas[k + 1:]:
            if l and '\ue000' <= l[0] <= '\uf8ff':
                if corpo: break  # \u00edcone de "Gostei" depois do texto: o que vem a seguir \u00e9 o contador de curtidas
                continue
            if l.strip() in ('', 'NOVA', 'Novo'): continue
            if l.strip() in ('Gostei', 'Compartilhar') or l.startswith(('Resposta do proprietário', 'Visitado em')): break
            corpo.append(l.strip())
        texto = ' '.join(corpo).strip()
        texto = re.sub(r'^\d+ avalia\S*\s+(?:.*?\batrás\s+)?', '', texto)  # cabeçalho do avaliador que às vezes vem junto
        texto = re.sub(r'\s*…\s*\d*$', '', texto)  # "… 1" do fim (contador de fotos da avaliação)
        nota = re.match(r'(\d)', a.get('nota') or '')
        if nota and nota.group(1) != '5': continue  # só 5 estrelas (a nota vem do aria-label "5 estrelas")
        if re.search(r'p[ée]ssim|horr[íi]vel|n[ãa]o recomendo|decepcion|descaso|nunca mais|absurd|mal atendid|demora|reclama|ruim', texto, re.I): continue
        if texto: out.append({'nome': linhas[0].strip(), 'texto': texto, 'nota': (nota.group(1) if nota else '?')})
    return out

LIMITE_DEPOIMENTO = 175  # caracteres: os cards de avaliação ficam da mesma altura

def trecho(texto, escolhido=None, limite=LIMITE_DEPOIMENTO):
    """Depoimento no tamanho padrão: o trecho escolhido (tem que estar no texto da avaliação) ou o começo,
    cortado no fim de uma frase; "…" marca o que ficou de fora antes e depois."""
    texto = re.sub(r'\s+', ' ', texto).strip()
    if escolhido:
        escolhido = re.sub(r'\s+', ' ', escolhido).strip()
        i = texto.find(escolhido)
        if i < 0: raise SystemExit(f'trecho não está na avaliação: {escolhido[:60]}')
        if len(escolhido) > limite + 25: print(f'  trecho longo ({len(escolhido)}): {escolhido[:50]}…')
        fim = i + len(escolhido) < len(texto)
        return ('…' if i > 0 else '') + (escolhido.rstrip('.,;: ') + '…' if fim else escolhido)
    if len(texto) <= limite: return texto
    t = ''
    for f in re.split(r'(?<=[.!?])\s+', texto):
        if len(t) + len(f) + 1 > limite: break
        t = (t + ' ' + f).strip()
    if not t:  # a primeira frase já passa do limite: corta na última palavra inteira
        t = texto[:limite].rsplit(' ', 1)[0].rstrip(',;:')
    return t.rstrip('.,;: ') + '…'

def iniciais(nome):
    p = [x for x in re.split(r'\s+', re.sub(r'\(.*?\)', '', nome)) if x and x[0].isalpha()]
    return (p[0][0] + (p[-1][0] if len(p) > 1 else '')).upper()

# ---------- HTML ----------
SIMBOLOS = '''  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <symbol id="whats" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M20.5 11.5A8.5 8.5 0 0 1 7.3 19L3 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5Z"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M8.5 7.5c0 4 2.5 6.5 6.5 6.5l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2Z"/></symbol>
    <symbol id="pin" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/></symbol>
    <symbol id="eye" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></g></symbol>
    <symbol id="insta" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/></g><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></symbol>
    <symbol id="spark" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2Z"/></symbol>
    <symbol id="clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g></symbol>
  </svg>'''

FACES = '''<div class="style-card style-card--tool reveal">
            <div class="style-image face-tool" data-face-tool>
              <span class="image-label">03 / SEU ROSTO</span>
              <div class="face-options" role="group" aria-label="Escolha o formato do seu rosto">
                <button class="face-option" type="button" data-face="oval" aria-pressed="true"><svg viewBox="0 0 32 36" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><ellipse cx="16" cy="18" rx="10" ry="14"/></svg>Oval</button>
                <button class="face-option" type="button" data-face="redondo" aria-pressed="false"><svg viewBox="0 0 32 36" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="16" cy="18" r="12.5"/></svg>Redondo</button>
                <button class="face-option" type="button" data-face="quadrado" aria-pressed="false"><svg viewBox="0 0 32 36" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4.5" y="5" width="23" height="26" rx="5"/></svg>Quadrado</button>
                <button class="face-option" type="button" data-face="coracao" aria-pressed="false"><svg viewBox="0 0 32 36" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9.5Q16 1 28 9.5q0 12-12 23.5Q4 21.5 4 9.5Z"/></svg>Coração</button>
              </div>
              <div class="face-result" aria-live="polite"><strong data-face-title>Rosto oval</strong><p data-face-text></p><div class="face-tags" data-face-tags></div></div>
            </div>
            <div class="style-description"><div><h3>Qual armação combina?</h3><p>Escolha o formato do seu rosto.</p></div></div>
          </div>'''

def corpo(cfg, fotos, google):
    m = cfg['marca']; mc = cfg.get('marca_completa', m); sub = cfg['logo_sub']; ml = cfg.get('marca_logo', m)
    img = lambda vaga, spec, nome=None: fotos.uri(spec, VAGAS[vaga], nome or vaga)
    logo = img('logo', cfg['logo']) if cfg.get('logo') else None
    logo_mark = (f'<span class="logo-mark" aria-hidden="true"><img src="{logo}" width="200" height="200" alt=""></span>' if logo
                 else '<span class="logo-mark" aria-hidden="true"><svg><use href="#eye"/></svg></span>')
    nav = ''.join(f'<a href="{a}">{esc(t)}</a>' for a, t in cfg['nav'])
    horas = cfg.get('horas_override') or horario(google)
    status = ('<span class="open-status" data-open-status><span class="status-dot" aria-hidden="true"></span><span class="status-label" data-status-label>{a}</span>'
              '<span class="status-sep" aria-hidden="true">·</span><span data-status-detail>{b}</span></span>')
    h = cfg['hero']; end = cfg['endereco']
    hero_bottom = (status.format(a='Horário de atendimento', b=esc(cfg.get('dias_curto', ''))) if horas
                   else f'<span class="hero-note"><span class="note-dot" aria-hidden="true"></span>{h.get("nota", "")}</span>')
    marquee = ''.join(f'<span>{esc(x)}</span><i>✦</i>' for x in cfg['marquee'])
    s = cfg['sobre']
    pol_sobre = (f'<figure class="polaroid story-polaroid"><img src="{img("sobre_pol", s["pol"])}" width="420" height="479" loading="lazy" alt="{esc(s["pol_alt"])}"><figcaption>{esc(s["pol_cap"])}</figcaption></figure>'
                 if s.get('pol') else '')
    # nota abaixo de 5,0 (4,9, 4,8...) não aparece: ficam as estrelas e o número de avaliações
    nota = mostrar_nota(cfg)
    lista_stats = [(v, t) for v, t in s['stats'] if nota or v != '{nota}']
    stats = ''.join(f'<div class="stat"><strong{" data-rating" if v == "{nota}" else ""}>{esc(cfg["google_nota"] if v == "{nota}" else v)}</strong><span>{esc(t)}</span></div>' for v, t in lista_stats)
    total = esc(cfg['google_total'])
    out = [SIMBOLOS, '  <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>',
      f'  <div class="topline"><div class="container"><span>{esc(cfg["topline"])}</span><a class="topline-rating" href="#depoimentos"><span class="stars" aria-hidden="true">★★★★★</span> ' + (f'<span data-rating>{esc(cfg["google_nota"])}</span> no Google' if nota else f'{total} avaliações no Google') + '</a></div></div>',
      f'''  <header class="site-header">
    <div class="container header-inner">
      <a class="logo" href="#inicio" aria-label="{esc(mc)}, início">{logo_mark}<span class="logo-text"><b>{esc(ml)}</b><small>{esc(sub)}</small></span></a>
      <nav class="desktop-nav" aria-label="Navegação principal">{nav}</nav>
      <a class="button header-cta" data-whatsapp href="#">{esc(cfg.get("cta_topo", "Fale com a gente"))} <span aria-hidden="true">↗</span></a>
      <button class="menu-button" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-mobile" data-menu-button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
    <nav class="mobile-nav" id="menu-mobile" aria-label="Navegação para celular" hidden>{nav}<a data-whatsapp href="#">Falar no WhatsApp ↗</a></nav>
  </header>''',
      f'''  <main id="conteudo">
    <section class="hero" id="inicio" aria-labelledby="hero-heading">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow"><span class="small-line" aria-hidden="true"></span> {esc(h["eyebrow"])}</p>
          <h1 id="hero-heading">{h["h1"]}</h1>
          <p class="hero-intro">{esc(h["intro"])}</p>
          <div class="hero-actions">
            <a class="button button--mustard" data-whatsapp href="#"><svg aria-hidden="true"><use href="#whats"/></svg>Chamar no WhatsApp</a>
            <a class="text-link text-link--light" href="#{h.get("alvo") or (cfg["carrosseis"][0]["id"] if cfg["carrosseis"] else "estilos")}">{esc(h.get("link", "Ver a vitrine"))} <span aria-hidden="true">↓</span></a>
          </div>
          <div class="hero-proof">
            <a class="proof-google" href="#depoimentos">{f'<span class="hero-proof-score" data-rating>{esc(cfg["google_nota"])}</span>' if nota else ''}<span><span class="stars" aria-label="Cinco estrelas">★★★★★</span><span class="proof-caption">{esc(cfg["google_total"])} avaliações no Google</span></span></a>
            <a class="proof-badge" href="#sobre"><svg aria-hidden="true"><use href="#spark"/></svg>{esc(h["selo"])}</a>
          </div>
        </div>
        <div class="hero-visual">
          <figure class="hero-photo"><img src="{img("hero", h["foto"])}" width="800" height="960" alt="{esc(h["alt"])}" fetchpriority="high"></figure>
          <a class="address-tag" data-maps href="#" target="_blank" rel="noopener noreferrer"><span class="tag-icon" aria-hidden="true"><svg><use href="#pin"/></svg></span><span><strong>{esc(end[0])}</strong><small>{esc(end[1])}</small></span></a>
        </div>
      </div>
      <div class="hero-bottom container">{hero_bottom}<a href="#sobre" aria-label="Conhecer a {esc(m)}"><span aria-hidden="true">↓</span></a></div>
    </section>

    <div class="marquee" aria-label="{esc(", ".join(cfg["marquee"]))}">
      <div class="marquee-track" aria-hidden="true">
        <div class="marquee-group">{marquee}</div>
        <div class="marquee-group">{marquee}</div>
      </div>
    </div>

    <section class="section story-section" id="sobre" aria-labelledby="story-heading">
      <div class="container story-grid">
        <div class="story-photos reveal">
          <figure class="story-main"><img src="{img("sobre", s["foto"])}" width="576" height="720" loading="lazy" alt="{esc(s["alt"])}"></figure>
          {pol_sobre}
        </div>
        <div class="story-copy reveal">
          <p class="eyebrow">{esc(s["eyebrow"])}</p>
          <h2 id="story-heading">{s["h2"]}</h2>
          {"".join(f"<p>{esc(p)}</p>" for p in s["p"])}
          <div class="stats{" stats--2" if len(lista_stats) == 2 else ""}">{stats}</div>
        </div>
      </div>
    </section>''']
    for k, car in enumerate(cfg['carrosseis']):
        if car.get('formato') == 'grade':
            itens = ''.join(
                f'<li><figure class="vitrine-card"><img src="{fotos.uri({"q": 76, **it["foto"]}, (560, 560), car["id"] + str(n))}" width="560" height="560" loading="lazy" alt="{esc(it["alt"])}">'
                + (f'<figcaption>{esc(it["cap"])}</figcaption>' if it.get('cap') else '') + '</figure></li>'
                for n, it in enumerate(car['itens'], 1))
            out.append(f'''
    <section class="section gallery-section" id="{car["id"]}" aria-labelledby="{car["id"]}-heading">
      <div class="container">
        <div class="section-heading reveal">
          <div><p class="eyebrow">{esc(car["eyebrow"])}</p><h2 id="{car["id"]}-heading">{car["h2"]}</h2></div>
          <p>{esc(car["p"])}</p>
        </div>
        <ul class="vitrine-grade reveal" aria-label="{esc(car["rotulo"])}">{itens}</ul>
      </div>
    </section>''')
            continue
        tam = FORMATOS[car.get('formato', 'quadrado')]
        itens = ''.join(
            f'<li><figure class="vitrine-card"><img src="{fotos.uri({"q": 70, **it["foto"]}, tam, car["id"] + str(n))}" width="{tam[0]}" height="{tam[1]}" loading="lazy" alt="{esc(it["alt"])}">'
            + (f'<figcaption>{esc(it["cap"])}</figcaption>' if it.get('cap') else '') + '</figure></li>\n            '
            for n, it in enumerate(car['itens'], 1))
        out.append(f'''
    <section class="section gallery-section" id="{car["id"]}" aria-labelledby="{car["id"]}-heading">
      <div class="container">
        <div class="section-heading reveal">
          <div><p class="eyebrow">{esc(car["eyebrow"])}</p><h2 id="{car["id"]}-heading">{car["h2"]}</h2></div>
          <p>{esc(car["p"])}</p>
        </div>
        <div class="carousel carousel--light reveal" data-carousel role="region" aria-roledescription="carrossel" aria-label="{esc(car["rotulo"])}">
          <ul class="carousel-track gallery-track gallery-track--{car.get("formato", "quadrado")}" id="{car["id"]}-track" tabindex="0" aria-label="{esc(car["rotulo"])}; use as setas para navegar">
            {itens}</ul>
          <div class="carousel-footer"><div class="carousel-controls"><button class="arrow-button" type="button" data-prev aria-controls="{car["id"]}-track" aria-label="Fotos anteriores">←</button><div class="carousel-dots" data-dots></div><button class="arrow-button" type="button" data-next aria-controls="{car["id"]}-track" aria-label="Próximas fotos">→</button><span class="sr-only" data-status aria-live="polite"></span></div></div>
        </div>
      </div>
    </section>''')
    # estilos: card de grau e de sol (título e rótulo trocáveis); sem foto boa de sol, fica só o de grau + formato de rosto
    e = cfg.get('estilos') or {}  # sem foto boa de óculos: "estilos": null e a seção não entra
    cards = [(k, e[k], t, r) for k, t, r in (('grau', 'Óculos de grau', '01 / GRAU'), ('solar', 'Óculos de sol', '02 / SOLAR')) if e.get(k)]
    cards_html = ''.join(f'''
          <a class="style-card reveal" data-whatsapp href="#">
            <div class="style-image"><img src="{img(k, c["foto"])}" width="640" height="595" loading="lazy" alt="{esc(c["alt"])}"><span class="image-label">{esc(c.get("rotulo", r))}</span></div>
            <div class="style-description"><div><h3>{esc(c.get("titulo", t))}</h3><p>{esc(c["texto"])}</p></div><span class="circle-arrow" aria-hidden="true">↗</span></div>
          </a>''' for k, c, t, r in cards)
    if cards: out.append(f'''
    <section class="section styles-section" id="estilos" aria-labelledby="styles-heading">
      <div class="container">
        <div class="section-heading reveal">
          <div><p class="eyebrow">{esc(e.get("eyebrow", "Qual é a sua?"))}</p><h2 id="styles-heading">{e.get("h2", "Tem um estilo que é <em>a sua cara.</em>")}</h2></div>
          <p>{esc(e["p"])}</p>
        </div>
        <div class="styles-grid{" styles-grid--dois" if len(cards) == 1 else ""}">{cards_html}
          {FACES.replace("03 / SEU ROSTO", f"0{len(cards) + 1} / SEU ROSTO")}
        </div>
      </div>
    </section>''')
    a = cfg['atendimento']
    pol_at = (f'<figure class="polaroid experience-polaroid"><img src="{img("atend_pol", a["pol"])}" width="420" height="504" loading="lazy" alt="{esc(a["pol_alt"])}"><figcaption>{esc(a["pol_cap"])}</figcaption></figure>'
              if a.get('pol') else '')
    card = (f'<a class="exam-card" data-whatsapp href="#"><strong><svg aria-hidden="true"><use href="#eye"/></svg>{esc(a["card"][0])}</strong>{esc(a["card"][1])} <span>Ver ↗</span></a>'
            if a.get('card') else '')
    out.append(f'''
    <section class="section experience-section" id="atendimento" aria-labelledby="experience-heading">
      <div class="container experience-grid">
        <div class="experience-copy reveal">
          <p class="eyebrow">{esc(a["eyebrow"])}</p>
          <h2 id="experience-heading">{a["h2"]}</h2>
          <ol class="steps">{"".join(f"<li><strong>{esc(p)}</strong></li>" for p in a["passos"])}</ol>
          <div class="experience-actions"><a class="button" data-whatsapp href="#"><svg aria-hidden="true"><use href="#whats"/></svg>{esc(a.get("botao", "Falar no WhatsApp"))}</a></div>
        </div>
        <div class="experience-photos reveal">
          {f'<figure class="experience-main experience-main--paisagem"><img src="{img("atend_paisagem", a["foto"])}" width="720" height="540" loading="lazy" alt="{esc(a["alt"])}"></figure>'
           if a.get("formato") == "paisagem" else
           f'<figure class="experience-main"><img src="{img("atend", a["foto"])}" width="640" height="640" loading="lazy" alt="{esc(a["alt"])}"></figure>'}
          {pol_at}
          {card}
        </div>
      </div>
    </section>''')
    r = cfg['avaliacoes_secao']
    out.append(f'''
    <section class="section reviews-section" id="depoimentos" aria-labelledby="reviews-heading">
      <div class="container">
        <div class="reviews-heading reveal">
          <div><p class="eyebrow">{esc(r.get("eyebrow", "Quem conhece, conta"))}</p><h2 id="reviews-heading">{r["h2"]}</h2></div>
          <a class="google-score" data-reviews-link href="#" target="_blank" rel="noopener noreferrer">{f'<strong data-rating>{esc(cfg["google_nota"])}</strong>' if nota else ''}<span><span class="stars" aria-label="Cinco estrelas">★★★★★</span><span>{esc(cfg["google_total"])} avaliações no Google</span><small>Ler todas <span aria-hidden="true">↗</span></small></span></a>
        </div>
        <div class="carousel review-carousel" data-carousel role="region" aria-roledescription="carrossel" aria-label="Avaliações de clientes">
          <ul class="carousel-track reviews-track" id="reviews-track" tabindex="0" aria-label="Avaliações; use as setas para navegar" data-reviews></ul>
          <div class="carousel-footer"><a class="text-link text-link--light review-write" data-review-write href="#" target="_blank" rel="noopener noreferrer">Já é cliente? Avalie no Google <span aria-hidden="true">↗</span></a><div class="carousel-controls"><button class="arrow-button" type="button" data-prev aria-controls="reviews-track" aria-label="Avaliações anteriores">←</button><div class="carousel-dots" data-dots></div><button class="arrow-button" type="button" data-next aria-controls="reviews-track" aria-label="Próximas avaliações">→</button><span class="sr-only" data-status aria-live="polite"></span></div></div>
        </div>
      </div>
    </section>''')
    # Instagram: sem foto boa, a seção fica só com o texto e os botões, centralizada
    i = cfg['insta']; ig = cfg['instagram']
    midia = f'''
        <div class="insta-media reveal">
          <div class="insta-photo"><img src="{img("insta", i["foto"])}" width="600" height="750" loading="lazy" alt="{esc(i["alt"])}"></div>
          <a class="insta-chip insta-chip--ig" data-instagram href="#" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#insta"/></svg>@{esc(ig)}</a>
          <a class="insta-chip insta-chip--ship" data-whatsapp href="#"><svg aria-hidden="true"><use href="#spark"/></svg>{esc(i.get("chip", "Peça pelo WhatsApp"))}</a>
        </div>''' if i.get('foto') else ''
    out.append(f'''
    <section class="section insta-section" id="instagram" aria-labelledby="insta-heading">
      <div class="container insta-grid{"" if midia else " insta-grid--solo"}">
        <div class="insta-copy reveal">
          <p class="eyebrow">@{esc(ig)}{" · " + esc(i["seguidores"]) if i.get("seguidores") else ""}</p>
          <h2 id="insta-heading">Acompanhe no <em>Instagram.</em></h2>
          <p>{esc(i["p"])}</p>
          <div class="insta-actions"><a class="button" data-instagram href="#" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#insta"/></svg>Seguir no Instagram</a><a class="text-link" data-whatsapp href="#">Tirar uma dúvida <span aria-hidden="true">↗</span></a></div>
        </div>{midia}
      </div>
    </section>''')
    v = cfg['visita']
    if horas:
        lista = ''.join(f'<li data-days="{d}"><span>{esc(n)}</span><span>{esc(t)}</span></li>' for n, t, d in linhas_horario(horas))
        bloco_h = status.replace('class="open-status"', 'class="visit-status open-status"').format(a='Horário de atendimento', b=esc(cfg.get('dias_curto', ''))) + f'\n          <ul class="hours" aria-label="Horário de atendimento">{lista}</ul>'
    else:
        bloco_h = f'<p class="visit-note"><svg aria-hidden="true"><use href="#clock"/></svg>{esc(v.get("nota", "Horário: confirme pelo WhatsApp."))}</p>'
    fone = f'<span>{esc(v.get("rotulo_fone", "Telefone"))} <a data-phone href="#">{esc(v["telefone"])}</a></span>' if v.get('telefone') else ''
    out.append(f'''
    <section class="visit-section" id="visite" aria-labelledby="visit-heading">
      <div class="container visit-grid">
        <div class="map-card reveal">
          <div class="map-fallback" aria-hidden="true"><svg><use href="#pin"/></svg><span>{esc(end[0])}<br>{esc(end[1])}</span></div>
          <iframe data-map-embed title="Mapa com a localização da {esc(m)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          <a class="map-pin" data-directions href="#" target="_blank" rel="noopener noreferrer"><span class="pin-mark" aria-hidden="true"><svg><use href="#pin"/></svg></span><span><strong>{esc(m)}</strong><small>{esc(end[0])}</small></span><span aria-hidden="true">↗</span></a>
        </div>
        <div class="visit-copy reveal">
          <p class="eyebrow">Como chegar</p>
          <h2 id="visit-heading">{v["h2"]}</h2>
          {bloco_h}
          <address><strong>{esc(mc)}</strong><span>{"<br>".join(esc(x) for x in v["endereco"])}</span>{fone}</address>
          <div class="visit-actions"><a class="button button--mustard" data-whatsapp href="#"><svg aria-hidden="true"><use href="#whats"/></svg>Chamar no WhatsApp</a><a class="text-link" data-directions href="#" target="_blank" rel="noopener noreferrer">Como chegar <span aria-hidden="true">↗</span></a></div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-top">
      <a class="logo" href="#inicio" aria-label="{esc(mc)}, voltar ao início">{logo_mark}<span class="logo-text"><b>{esc(ml)}</b><small>{esc(sub)}</small></span></a>
      <p class="footer-slogan">{esc(cfg["slogan"])}</p>
      <nav class="footer-links" aria-label="Links da {esc(m)}"><a data-whatsapp href="#">WhatsApp</a><a data-instagram href="#" target="_blank" rel="noopener noreferrer">Instagram</a><a data-reviews-link href="#" target="_blank" rel="noopener noreferrer">Avaliações</a><a data-directions href="#" target="_blank" rel="noopener noreferrer">Como chegar</a></nav>
    </div>
    <div class="container footer-bottom"><span>© <span data-year>2026</span> {esc(mc)}</span><span>{esc(" · ".join(v["endereco"]))}</span></div>
  </footer>
  <a class="floating-whatsapp" data-whatsapp href="#" aria-label="Conversar com a {esc(m)} no WhatsApp"><svg aria-hidden="true"><use href="#whats"/></svg><span>WhatsApp</span></a>''')
    return '\n'.join(out), horas

def cliente(cfg, google, horas):
    g = cfg['google']; lat, lng = g['coords'].split(',')
    from urllib.parse import quote
    base = f'https://www.google.com/maps/place/{quote(cfg["google_nome"]).replace("%20", "+")}/@{g["coords"]},17z/data='
    aval = base + f'!4m8!3m7!1s{g["fid"]}!8m2!3d{lat}!4d{lng}!9m1!1b1!16s{quote(g["gid"], safe="")}?hl=pt-BR'
    cid = int(g['fid'].split(':')[1], 16)
    lista = avaliacoes(google); revs = []
    for a in cfg['avaliacoes']:
        if 'nome' in a:
            achadas = [x for x in lista if x['nome'].strip().lower() == a['nome'].strip().lower()]
            if not achadas: raise SystemExit(f'avaliação de {a["nome"]} não está entre as de 5 estrelas')
            x = achadas[0]
        else:
            x = lista[a['i']]
        nome = x['nome'].strip()
        if nome == nome.lower():  # "alexandra ferreira" -> "Alexandra Ferreira"
            nome = ' '.join(p if p in ('de', 'da', 'do', 'dos', 'das', 'e') else p[:1].upper() + p[1:] for p in nome.split())
        revs.append({'name': nome, 'initials': iniciais(nome), 'tag': a['tag'],
                     'quote': a['texto'] if 'texto' in a else trecho(x['texto'], a.get('trecho'))})
    js_horas = 'null' if not horas else '{ ' + ', '.join(f'{d}: {json.dumps(horas[d])}' for d in range(7)) + ' }'
    msg = cfg.get('mensagem', f'Olá! Vim pelo site da {cfg["marca"]}.')
    linhas = [
        f'  brand: {json.dumps(cfg.get("marca_completa", cfg["marca"]), ensure_ascii=False)},',
        f'  whatsapp: "https://wa.me/{cfg["whatsapp"]}?text=" + encodeURIComponent({json.dumps(msg, ensure_ascii=False)}),',
        f'  phone: {json.dumps(cfg.get("fone_link", "+" + cfg["whatsapp"]))},',
        f'  instagram: "https://www.instagram.com/{cfg["instagram"]}/",',
        f'  maps: "https://www.google.com/maps?cid={cid}",',
        f'  directions: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent({json.dumps(cfg["google_nome"] + ", " + cfg["endereco_maps"], ensure_ascii=False)}),',
        f'  mapEmbed: "https://www.google.com/maps?q=" + encodeURIComponent({json.dumps(cfg["google_nome"] + ", " + cfg["endereco_maps"], ensure_ascii=False)}) + "&z=17&hl=pt-BR&output=embed",',
        f'  reviewsUrl: {json.dumps(aval)},', f'  writeReviewUrl: {json.dumps(aval)},',
        f'  rating: {json.dumps(cfg["google_nota"])},', f'  reviewTotal: {json.dumps(cfg["google_total"])},',
        '  // Horário do Perfil da Empresa no Google (0 = domingo), em minutos desde 00h.' if horas else '  // Horário não confirmado no Google: sem aviso de aberto/fechado.',
        f'  hours: {js_horas},',
        '  reviews: [\n' + ',\n'.join('    ' + json.dumps(r, ensure_ascii=False) for r in revs) + '\n  ],',
        '''  faces: {
    oval: { title: "Rosto oval", text: "Combina com quase todos os formatos.", tags: ["Gatinho", "Aviador", "Quadrada"] },
    redondo: { title: "Rosto redondo", text: "Armações retas, com cantos marcados.", tags: ["Retangular", "Quadrada"] },
    quadrado: { title: "Rosto quadrado", text: "Formatos arredondados suavizam o rosto.", tags: ["Redonda", "Oval", "Aviador"] },
    coracao: { title: "Rosto coração", text: "Armações leves em cima, mais marcadas embaixo.", tags: ["Redonda", "Aviador"] }
  },''',
        f'  verifiedOn: {json.dumps(cfg["verificado"])}',
    ]
    return '  <script>\nwindow.DEMO_CLIENT = {\n' + '\n'.join(linhas) + '\n};\n  </script>'

def gerar(caminho_cfg, saida=None):
    cfg = json.load(open(caminho_cfg, encoding='utf-8'))
    google = ler_google(cfg.get('google_json'))
    fotos = Fotos(cfg.get('inventario'))
    head = tema(cfg)
    corpo_html, horas = corpo(cfg, fotos, google)
    runtime = open(os.path.join(AQUI, 'runtime.js'), encoding='utf-8').read()
    doc = head + '<body>\n' + corpo_html + '\n\n' + cliente(cfg, google, horas) + '\n  <script>\n' + runtime + '\n  </script>\n</body>\n</html>\n'
    assert '{{' not in doc, re.findall(r'\{\{[^}]*\}\}', doc)[:5]
    saida = saida or os.path.join(REPO, 'demos', cfg['pasta'], 'index.html')
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    open(saida, 'w', encoding='utf-8').write(doc)
    print(f'{saida}: {len(doc) // 1024} KB, {sum(len(c["itens"]) for c in cfg["carrosseis"])} fotos nos carrosséis')
    for a in fotos.avisos: print('  AVISO', a)
    if cfg.get('ficha'):
        caminho = os.path.join(os.path.dirname(saida), 'ficha.md')
        antiga = open(caminho, encoding='utf-8').read() if os.path.exists(caminho) else ''
        open(caminho, 'w', encoding='utf-8').write(ficha(cfg, horas, antiga))
        print(caminho)
    return saida

def ficha(cfg, horas, antiga=''):
    """ficha.md da ótica: dados conferidos, o que tem na demo, de onde vieram as fotos e o que conferir."""
    f = cfg['ficha']; dmy = lambda iso: '/'.join(reversed(iso.split('-')))
    fone = cfg['visita'].get('telefone', '')
    linhas = [f'# {cfg.get("marca_completa", cfg["marca"])}', '', '| | |', '|---|---|',
              f'| Onde | {cfg["endereco_maps"]} |',
              f'| Instagram | [@{cfg["instagram"]}](https://www.instagram.com/{cfg["instagram"]}/)'
              + (f' · {cfg["insta"]["seguidores"]}' if cfg['insta'].get('seguidores') else '') + ' |',
              f'| Google | nota {cfg["google_nota"]} · {cfg["google_total"]} avaliações · conferido em {dmy(cfg["verificado"])} |',
              f'| WhatsApp | ({cfg["whatsapp"][2:4]}) {cfg["whatsapp"][4:-4]}-{cfg["whatsapp"][-4:]} · {f.get("whatsapp_fonte", "")} |',
              '| Horário | ' + ('; '.join(f'{n} {t}' for n, t, _ in linhas_horario(horas)) if horas else 'não confirmado no Google (a demo pede para confirmar no WhatsApp)') + ' |',
              f'| Site | {f.get("site", "não tem (o Google aponta o Instagram)")} |',
              '| Entregável | demo de site (`index.html`), gerada por `ferramentas/demo/gerar.py` |',
              f'| Situação | pronta · {dmy(cfg["verificado"])} · `/demo/{cfg["pasta"]}` |', '']
    for titulo, chave in (('Direção da demo', 'direcao'), ('O que tem na demo', 'demo'), ('Fotos', 'fotos'), ('Conferir antes de mandar', 'conferir')):
        if f.get(chave): linhas += [f'## {titulo}'] + [f'- {x}' for x in f[chave]] + ['']
    # o que foi levantado na triagem (ficha antiga) continua valendo: fica no fim
    m = re.search(r'^## Levantado.*?(?=^## |\Z)', antiga, flags=re.S | re.M)
    if m and '## Levantado' not in '\n'.join(linhas): linhas += [m.group(0).strip(), '']
    return '\n'.join(linhas)

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--avaliacoes' in args:
        for n, a in enumerate(avaliacoes(ler_google(args[0]))): print(f'[{n}] ({a["nota"]}★) {a["nome"]}: {a["texto"][:240]}')
        sys.exit()
    gerar(args[0], args[args.index('--saida') + 1] if '--saida' in args else None)
