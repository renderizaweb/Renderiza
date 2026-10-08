# Gera a demo de um(a) dentista (arquivo HTML único) a partir de um JSON, no padrão da demo da MS Odontologia
# (demos/ms-odontologia): capa com o(a) dentista, faixa de diferenciais, "Quem cuida do seu sorriso", carrosséis
# de atendimento e de sorrisos, experiência, tratamentos, o consultório, avaliações do Google e contato com mapa.
# Cores e fontes de cada clínica; fotos recortadas no tamanho da vaga e embutidas em base64.
#
# Uso: python3 gerar-odonto.py <demo.json> [--saida <arquivo.html>]
#      python3 gerar-odonto.py <google.json> --avaliacoes   (lista numerada das avaliações de 5 estrelas)
#   Sem --saida, grava em demos/<pasta>/index.html deste repositório.
#   Depois: node validar.mjs <arquivo.html> <pasta_capturas>
#
# Fotos: {"id": n} (número na folha do inventario-fotos.py) ou {"arquivo": caminho}, com "box" (recorte em frações,
#   0 a 1) e "c" (centro do enquadramento) opcionais, como no gerar.py.
# Seções: "ordem" diz quais entram e em que ordem: hero, faixa, dentista, carrossel:<id>, experiencia, tratamentos,
#   espaco, depoimentos, contato. Seção sem dados no JSON fica de fora.
# Avaliações: {"i": n} ou {"nome": ...} (lista do --avaliacoes), com "trecho" (tem que estar no texto) ou "texto" (o
#   trecho com ajuste leve de pontuação, nunca palavra nova) e "nome_exibido" opcional (nome sem apelido).
# Regras do CFO (ver CONTEXTO.md, "Dentistas"): nome e CRO visíveis, nada de preço, promoção ou superlativo; a nota
#   do Google só aparece se for 5,0 (como nas óticas).
import html, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gerar import Fotos, ler_google, horario, linhas_horario, avaliacoes, trecho, iniciais, mostrar_nota  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
esc = lambda t: html.escape(str(t), quote=True)
TAM = {'hero': (900, 1150), 'dentista': (840, 1120), 'tira': (480, 640), 'galeria': (620, 980), 'quadrado': (640, 640),
       'retrato': (600, 750), 'experiencia': (800, 1100), 'espaco_alto': (760, 1040), 'espaco': (640, 640),
       'contato': (800, 1100), 'logo': (200, 200)}
SERIFAS = {
    'Cormorant Garamond': 'Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600',
    'Playfair Display': 'Playfair+Display:ital,wght@0,500;0,600;1,500;1,600',
    'Fraunces': 'Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500',
    'Lora': 'Lora:ital,wght@0,500;0,600;1,500;1,600',
    'Marcellus': 'Marcellus',
}
SANS = {'Manrope': 'Manrope:wght@400;500;600;700;800', 'DM Sans': 'DM+Sans:opsz,wght@9..40,400..800',
        'Outfit': 'Outfit:wght@400;500;600;700;800'}

# ---------- cores ----------
def rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def mistura(a, b, t):
    """t = quanto de b (0 a 1)."""
    ra, rb = rgb(a), rgb(b)
    return '#' + ''.join('%02x' % round(x + (y - x) * t) for x, y in zip(ra, rb))
def trio(h): return ' '.join(str(x) for x in rgb(h))

def variaveis(c):
    """Cores da clínica -> variáveis do CSS (os nomes seguem a demo da MS)."""
    v = {
        'ink': c['tinta'], 'ink-soft': mistura(c['tinta'], '#ffffff', .28), 'teal': c['primaria'], 'teal-deep': c['primaria_escura'],
        'night': c['noite'], 'mint': c['clara'], 'mint-pale': c['clara2'], 'cream': c['creme'], 'paper': c['papel'],
        'coral': c['destaque'], 'gold': c['ouro'],
        'on-dark': mistura(c['clara'], '#ffffff', .25), 'muted': mistura(c['tinta'], '#ffffff', .45),
        'visit-card': mistura(c['tinta'], c['primaria_escura'], .45), 'footer': mistura(c['noite'], '#000000', .3),
    }
    out = ''.join(f'--{k}: {x};' for k, x in v.items())
    for k in ('ink', 'teal-deep', 'night', 'coral', 'teal'): out += f'--{k}-rgb: {trio(v[k])};'
    return out

CSS = r'''
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; scroll-padding-top: 80px; }
    body { margin: 0; color: var(--ink); background: var(--paper); font-family: var(--sans); font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
    img { display: block; max-width: 100%; height: auto; }
    a { color: inherit; text-decoration: none; }
    p { margin: 0; }
    h1, h2, h3 { margin: 0; font-family: var(--serif); font-weight: 500; letter-spacing: -.02em; line-height: 1; }
    h2 { font-size: clamp(40px, 5.4vw, 72px); }
    h2 em, h1 em { color: var(--teal); font-style: italic; }
    svg.ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
    .shell { width: var(--shell); margin-inline: auto; }
    .section { padding: clamp(80px, 9vw, 128px) 0; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
    .eyebrow { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; color: var(--teal); font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    .eyebrow::before { content: ""; width: 24px; height: 2px; background: var(--coral); flex: none; }
    .lead { color: var(--ink-soft); font-size: clamp(16px, 1.35vw, 18px); line-height: 1.75; }
    .lead + .lead { margin-top: 14px; }
    .stars { color: #e3a73a; letter-spacing: 1px; }

    .button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 56px; padding: 0 26px; border-radius: 999px; font-size: 15px; font-weight: 800; transition: transform .18s ease, background .18s ease, box-shadow .18s ease; }
    .button:hover { transform: translateY(-2px); }
    .button-primary { color: #fff; background: var(--teal-deep); box-shadow: 0 16px 34px rgb(var(--teal-deep-rgb) / .25); }
    .button-primary:hover { background: var(--teal); }
    .button-light { color: var(--teal-deep); background: #fff; }
    .button-light:hover { background: var(--mint); }
    .text-link { display: inline-flex; align-items: center; gap: 8px; color: var(--teal-deep); font-size: 15px; font-weight: 800; }
    .text-link span { color: var(--coral); font-size: 18px; }
    a:focus-visible, button:focus-visible { outline: 3px solid rgb(var(--coral-rgb) / .8); outline-offset: 3px; }

    /* Cabeçalho */
    .site-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--paper) 90%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgb(var(--ink-rgb) / .08); }
    .nav { min-height: 74px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
    .brand { display: flex; align-items: center; gap: 11px; min-width: 0; }
    .brand img, .brand .mono { width: 44px; height: 44px; flex: none; border-radius: 50%; object-fit: cover; box-shadow: 0 5px 18px rgb(var(--teal-deep-rgb) / .14); }
    .brand .mono { display: grid; place-items: center; color: #fff; background: var(--teal-deep); font-family: var(--serif); font-size: 19px; font-weight: 600; letter-spacing: .02em; }
    .brand span { display: grid; min-width: 0; }
    .brand strong { font-family: var(--serif); font-size: 21px; font-weight: 600; line-height: 1.05; }
    .brand small { margin-top: 3px; color: var(--teal); font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .nav-links { display: flex; align-items: center; gap: 24px; }
    .nav-links a:not(.button) { color: var(--ink-soft); font-size: 14px; font-weight: 700; }
    .nav-links a:not(.button):hover { color: var(--teal); }
    .nav-links .button { min-height: 46px; padding: 0 20px; font-size: 14px; }
    .menu-button { display: none; width: 46px; height: 46px; padding: 0; border: 1px solid var(--line); border-radius: 50%; background: #fff; cursor: pointer; flex: none; }
    .menu-button span { display: block; width: 18px; height: 2px; margin: 4px auto; background: var(--ink); border-radius: 2px; }
    #menu-mobile { border-top: 1px solid var(--line); background: var(--paper); }
    #menu-mobile nav { display: grid; padding: 6px 0 18px; }
    #menu-mobile a:not(.button) { padding: 14px 2px; border-bottom: 1px solid var(--line); font-weight: 700; }
    #menu-mobile .button { margin-top: 14px; }

    /* Capa */
    .hero { position: relative; overflow: hidden; background: radial-gradient(circle at 92% 6%, rgb(var(--coral-rgb) / .24), transparent 30%), linear-gradient(145deg, var(--mint-pale) 0%, var(--cream) 66%, color-mix(in srgb, var(--cream) 80%, var(--coral)) 100%); }
    .hero::before { content: ""; position: absolute; top: 180px; left: -230px; width: 320px; height: 320px; border: 1px solid rgb(var(--teal-rgb) / .18); border-radius: 50%; box-shadow: 0 0 0 44px rgb(var(--teal-rgb) / .035), 0 0 0 88px rgb(var(--teal-rgb) / .025); }
    .hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(400px, .78fr); align-items: end; gap: 64px; padding-top: 64px; }
    .hero-copy { padding-bottom: 80px; }
    .hero h1 { font-size: clamp(60px, 8.6vw, 124px); line-height: .88; letter-spacing: -.045em; }
    .hero h1 em { display: block; margin-top: .08em; }
    .hero .lead { max-width: 600px; margin-top: 26px; }
    .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 22px; margin-top: 32px; }
    .hero-proof { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; gap: 0; margin-top: 36px; border-top: 1px solid var(--line); }
    .hero-proof div { padding: 20px 26px 0 0; margin-right: 26px; border-right: 1px solid var(--line); }
    .hero-proof div:last-child { border-right: 0; margin-right: 0; }
    .hero-proof strong { display: block; color: var(--teal); font-family: var(--serif); font-size: 34px; font-weight: 600; line-height: 1; white-space: nowrap; }
    .hero-proof .rot { display: block; margin-top: 6px; max-width: 170px; color: var(--ink-soft); font-size: 13px; line-height: 1.45; }
    .hero-proof .stars { font-size: .7em; }
    .hero-media { position: relative; margin: 0; min-height: 700px; overflow: hidden; border-radius: 220px 220px 0 0; background: var(--mint); box-shadow: var(--shadow); }
    .hero-media > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .hero-media::after { content: ""; position: absolute; inset: 60% 0 0; background: linear-gradient(transparent, rgb(var(--night-rgb) / .45)); pointer-events: none; }
    .hero-media figcaption { position: absolute; z-index: 2; left: 18px; right: 18px; bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 18px; background: color-mix(in srgb, var(--paper) 92%, transparent); border-radius: 18px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 16px 40px rgb(var(--night-rgb) / .18); }
    .hero-media figcaption strong { display: block; font-family: var(--serif); font-size: 22px; font-weight: 600; line-height: 1.1; }
    .hero-media figcaption small { color: var(--teal); font-size: 11px; font-weight: 800; letter-spacing: .1em; }
    .award-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; color: #fff; background: var(--night); border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: .04em; white-space: nowrap; }
    .award-chip b { color: var(--gold); }

    /* Faixa */
    .trust { color: #fff; background: var(--teal-deep); }
    .trust-list { display: grid; grid-template-columns: repeat(3, 1fr); }
    .trust-list div { display: flex; align-items: center; gap: 14px; min-height: 92px; padding: 0 26px; border-right: 1px solid rgba(255, 255, 255, .14); }
    .trust-list div:first-child { padding-left: 0; }
    .trust-list div:last-child { border-right: 0; }
    .trust-list span { color: var(--coral); font-family: var(--serif); font-size: 22px; font-weight: 600; }
    .trust-list strong { font-size: 15px; letter-spacing: .01em; }

    .section-head { max-width: 760px; }
    .section-head .lead { margin-top: 20px; max-width: 620px; }

    /* Quem cuida */
    .doutor { position: relative; overflow: hidden; color: #fff; background: radial-gradient(circle at 85% 15%, rgb(var(--coral-rgb) / .14), transparent 34%), var(--night); }
    .doutor::after { content: ""; position: absolute; right: -220px; bottom: -220px; width: 520px; height: 520px; border: 1px solid rgba(255, 255, 255, .07); border-radius: 50%; box-shadow: 0 0 0 60px rgba(255, 255, 255, .02); }
    .doutor-grid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(380px, .9fr) minmax(0, 1.1fr); align-items: center; gap: clamp(48px, 7vw, 96px); }
    .doutor .eyebrow { color: var(--on-dark); }
    .doutor h2 em { color: var(--gold); }
    .doutor-foto { position: relative; margin: 0; }
    .doutor-foto img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 28px 28px 220px 28px; box-shadow: 0 30px 80px rgba(0, 0, 0, .35); }
    .doutor-foto figcaption { position: absolute; left: -16px; bottom: 34px; padding: 14px 18px; color: var(--ink); background: var(--paper); border-radius: 16px; box-shadow: 0 16px 40px rgba(0, 0, 0, .25); font-size: 13px; font-weight: 700; line-height: 1.35; }
    .doutor-foto figcaption b { display: block; color: var(--teal); font-family: var(--serif); font-size: 24px; font-weight: 600; }
    .doutor-copy .lead { margin-top: 22px; color: rgba(255, 255, 255, .76); }
    .doutor-copy .lead + .lead { margin-top: 14px; }
    .citacao { margin: 28px 0 0; padding: 4px 0 4px 22px; border-left: 2px solid var(--gold); font-family: var(--serif); font-size: clamp(22px, 2.2vw, 28px); font-style: italic; line-height: 1.3; }
    .citacao cite { display: block; margin-top: 10px; color: rgba(255, 255, 255, .6); font-family: var(--sans); font-size: 13px; font-style: normal; font-weight: 700; }
    .doutor-tira { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 34px; }
    .doutor-tira img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 16px; }

    /* Experiência */
    .experience { background: var(--mint-pale); }
    .experience-grid { display: grid; grid-template-columns: minmax(380px, .86fr) minmax(0, 1fr); align-items: center; gap: clamp(48px, 7vw, 90px); }
    .experience-photo { position: relative; margin: 0; min-height: 720px; overflow: hidden; border-radius: 28px; background: var(--mint); box-shadow: 0 22px 60px rgb(var(--teal-deep-rgb) / .12); }
    .experience-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .experience-photo::after { content: ""; position: absolute; inset: 60% 0 0; background: linear-gradient(transparent, rgb(var(--night-rgb) / .55)); }
    .experience-photo figcaption { position: absolute; z-index: 2; left: 22px; right: 22px; bottom: 22px; color: #fff; font-family: var(--serif); font-size: 28px; font-weight: 500; line-height: 1.15; }
    .experience-copy .lead { margin-top: 22px; }
    .care-points { margin: 30px 0 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
    .care-points li { display: flex; align-items: center; gap: 14px; min-height: 62px; border-bottom: 1px solid var(--line); font-size: 16px; font-weight: 700; }
    .care-points span { width: 32px; height: 32px; flex: none; display: grid; place-items: center; color: var(--teal); background: var(--mint); border-radius: 50%; font-family: var(--serif); font-size: 15px; font-weight: 600; }

    /* Tratamentos */
    .treatments { position: relative; overflow: hidden; color: #fff; background: var(--teal-deep); }
    .treatments::after { content: ""; position: absolute; top: 60px; right: -200px; width: 320px; height: 320px; border: 1px solid rgba(255, 255, 255, .13); border-radius: 50%; box-shadow: 0 0 0 46px rgba(255, 255, 255, .025), 0 0 0 92px rgba(255, 255, 255, .02); }
    .treatments .shell { position: relative; z-index: 1; }
    .treatments .eyebrow { color: var(--on-dark); }
    .treatments h2 em { color: var(--on-dark); }
    .treatments .section-head .lead { color: rgba(255, 255, 255, .72); }
    .treatment-list { display: grid; grid-template-columns: 1fr 1fr; column-gap: 56px; margin-top: 52px; border-top: 1px solid rgba(255, 255, 255, .16); }
    .treatment-list article { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 10px; padding: 30px 0; border-bottom: 1px solid rgba(255, 255, 255, .16); }
    .treatment-list article > span { padding-top: 4px; color: var(--coral); font-family: var(--serif); font-size: 20px; font-weight: 600; }
    .treatment-list h3 { font-size: 30px; font-weight: 500; }
    .treatment-list p { max-width: 470px; margin-top: 8px; color: rgba(255, 255, 255, .72); font-size: 15px; line-height: 1.65; }
    .mais { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 40px; }
    .mais div { padding: 24px 26px; background: rgba(255, 255, 255, .06); border: 1px solid rgba(255, 255, 255, .14); border-radius: 20px; }
    .mais h3 { font-size: 26px; }
    .mais ul { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; padding: 0; list-style: none; }
    .mais li { padding: 6px 13px; color: #fff; background: rgba(255, 255, 255, .1); border-radius: 999px; font-size: 13px; font-weight: 700; }
    .treatments .button { margin-top: 36px; }

    /* Carrossel */
    .carousel-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
    .carousel-head > div { max-width: 760px; }
    .carousel-head .lead { margin-top: 18px; max-width: 620px; }
    .carousel-track { display: flex; gap: 18px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; margin: 44px 0 0; padding: 4px 2px 10px; outline: none; list-style: none; }
    .carousel-track::-webkit-scrollbar { display: none; }
    .carousel-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-top: 22px; }
    .carousel-footer p { color: var(--ink-soft); font-size: 14px; }
    .carousel-controls { display: flex; align-items: center; gap: 12px; }
    .arrow-button { width: 48px; height: 48px; display: grid; place-items: center; color: var(--ink); background: #fff; border: 1px solid var(--line); border-radius: 50%; font-size: 18px; cursor: pointer; transition: background .2s ease, color .2s ease; }
    .arrow-button:hover:not(:disabled) { color: #fff; background: var(--teal-deep); border-color: var(--teal-deep); }
    .arrow-button:disabled { opacity: .35; cursor: default; }
    .carousel-dots { display: flex; flex-wrap: wrap; gap: 6px; max-width: 200px; }
    .carousel-dots button { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 99px; background: rgb(var(--ink-rgb) / .2); cursor: pointer; transition: width .2s ease, background .2s ease; }
    .carousel-dots button[aria-current="true"] { width: 22px; background: var(--teal); }
    .nota-caso { margin-top: 14px; color: var(--muted); font-size: 13px; }

    /* Galeria (cartões altos com legenda) */
    .gallery-section { background: var(--cream); }
    .gallery-section--clara { background: var(--paper); }
    .gallery-card { position: relative; flex: none; width: min(78vw, 380px); height: 600px; margin: 0; overflow: hidden; border-radius: 26px; background: var(--mint); scroll-snap-align: start; }
    .gallery-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .gallery-card::after { content: ""; position: absolute; inset: 50% 0 0; background: linear-gradient(transparent, rgb(var(--night-rgb) / .8)); }
    .gallery-card figcaption { position: absolute; z-index: 2; left: 22px; right: 22px; bottom: 22px; display: grid; color: #fff; }
    .gallery-card small { color: var(--on-dark); font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
    .gallery-card strong { margin-top: 8px; font-family: var(--serif); font-size: 25px; font-weight: 500; line-height: 1.15; }
    /* Sorrisos (cartões quadrados ou retrato, legenda curta) */
    .smile-card { position: relative; flex: none; width: min(74vw, 340px); margin: 0; scroll-snap-align: start; }
    .smile-card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 24px; background: var(--mint); box-shadow: 0 16px 40px rgb(var(--teal-deep-rgb) / .1); }
    .carousel-track--retrato .smile-card img { aspect-ratio: 4 / 5; }
    .smile-card figcaption { margin-top: 12px; color: var(--ink-soft); font-size: 14px; font-weight: 700; }

    /* O consultório (mosaico) */
    .space-grid { display: grid; grid-template-columns: minmax(400px, .9fr) minmax(0, 1fr); align-items: center; gap: clamp(48px, 7vw, 92px); }
    .space-photos { position: relative; display: grid; grid-template-columns: 1.35fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; height: 680px; }
    .space-photos figure { position: relative; margin: 0; overflow: hidden; border-radius: 24px; background: var(--cream); }
    .space-photos figure:first-child { grid-row: 1 / span 2; }
    .space-photos img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .space-photos figcaption { position: absolute; left: 12px; bottom: 12px; padding: 6px 12px; background: color-mix(in srgb, var(--paper) 94%, transparent); border-radius: 999px; font-size: 11px; font-weight: 800; }
    .space-copy .lead { margin-top: 22px; }
    .premios { display: grid; gap: 14px; margin-top: 30px; }
    .premio { display: flex; align-items: center; gap: 18px; padding: 20px 22px; background: var(--cream); border: 1px solid var(--line); border-radius: 20px; }
    .premio strong { flex: none; min-width: 112px; color: var(--teal); font-family: var(--serif); font-size: 34px; font-weight: 600; line-height: 1; }
    .premio span { color: var(--ink-soft); font-size: 14px; line-height: 1.5; }
    .premio span b { display: block; color: var(--ink); font-size: 15px; }
    .premio--ouro { color: #fff; background: var(--night); border-color: var(--night); }
    .premio--ouro strong { color: var(--gold); }
    .premio--ouro span { color: rgba(255, 255, 255, .72); }
    .premio--ouro span b { color: #fff; }

    /* Depoimentos */
    .testimonials { background: var(--mint-pale); }
    .nota-google { display: inline-flex; align-items: center; gap: 12px; margin-top: 22px; padding: 10px 16px; background: #fff; border: 1px solid var(--line); border-radius: 999px; font-size: 14px; font-weight: 700; }
    .nota-google b { color: var(--teal); font-family: var(--serif); font-size: 24px; font-weight: 600; line-height: 1; }
    .review-card { flex: none; display: flex; flex-direction: column; width: min(84vw, 440px); min-height: 380px; padding: 30px; background: var(--paper); border: 1px solid rgb(var(--teal-deep-rgb) / .1); border-radius: 26px; box-shadow: 0 16px 45px rgb(var(--teal-deep-rgb) / .08); scroll-snap-align: start; list-style: none; }
    .review-card .aspas { color: var(--coral); font-family: var(--serif); font-size: 64px; line-height: .6; }
    .review-card blockquote { flex: 1; margin: 20px 0 26px; font-family: var(--serif); font-size: 22px; line-height: 1.4; }
    .review-card footer { display: flex; align-items: center; gap: 12px; padding-top: 18px; border-top: 1px solid var(--line); }
    .review-card footer > span { width: 42px; height: 42px; display: grid; place-items: center; flex: none; color: #fff; background: var(--teal); border-radius: 50%; font-family: var(--serif); font-size: 18px; font-weight: 600; }
    .review-card footer strong { display: block; font-size: 15px; }
    .review-card footer small { color: var(--muted); font-size: 12px; }

    /* Contato */
    .visit { color: #fff; background: var(--ink); }
    .visit-card { display: grid; grid-template-columns: minmax(340px, .8fr) minmax(0, 1.2fr); overflow: hidden; background: var(--visit-card); border: 1px solid rgba(255, 255, 255, .12); border-radius: 30px; }
    .visit-photo { position: relative; margin: 0; min-height: 640px; background: var(--teal); }
    .visit-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .visit-copy { display: flex; flex-direction: column; justify-content: center; padding: clamp(36px, 5vw, 64px); }
    .visit .eyebrow { color: var(--on-dark); }
    .visit h2 em { color: var(--on-dark); }
    .visit-copy .lead { margin-top: 18px; color: rgba(255, 255, 255, .72); }
    .contact-lines { display: grid; margin-top: 28px; border-top: 1px solid rgba(255, 255, 255, .13); }
    .contact-lines a, .contact-lines div { display: flex; align-items: center; gap: 14px; min-height: 74px; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, .13); }
    .contact-lines .ico { width: 24px; height: 24px; color: var(--coral); }
    .contact-lines span { display: grid; }
    .contact-lines strong { font-size: 15px; }
    .contact-lines small { margin-top: 2px; color: rgba(255, 255, 255, .62); font-size: 13px; }
    .contact-lines a:hover strong { color: var(--coral); }
    .visit .button { margin-top: 28px; align-self: flex-start; }
    .mapa { margin-top: 26px; overflow: hidden; border-radius: 22px; border: 1px solid rgba(255, 255, 255, .12); background: var(--visit-card); }
    .mapa iframe { display: block; width: 100%; height: 340px; border: 0; }

    .footer { color: #fff; background: var(--footer); }
    .footer-main { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 28px; padding: 44px 0 32px; }
    .footer .brand small { color: var(--on-dark); }
    .footer nav { display: flex; flex-wrap: wrap; gap: 12px 26px; }
    .footer nav a { color: rgba(255, 255, 255, .68); font-size: 14px; font-weight: 700; }
    .footer nav a:hover { color: #fff; }
    .footer-bottom { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 20px 0 30px; color: rgba(255, 255, 255, .5); border-top: 1px solid rgba(255, 255, 255, .1); font-size: 12px; }

    .mobile-dock { display: none; }
    .reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s ease, transform .7s ease; }
    .reveal.is-visible { opacity: 1; transform: none; }

    @media (max-width: 980px) {
      .nav-links { display: none; }
      .menu-button { display: block; }
      .hero-grid, .doutor-grid, .experience-grid, .space-grid, .visit-card { grid-template-columns: 1fr; }
      .hero-grid { padding-top: 48px; gap: 0; }
      .hero-copy { padding-bottom: 40px; }
      .hero-media { min-height: 600px; border-radius: 200px 200px 0 0; }
      .experience-photo { min-height: 600px; }
      .space-photos { height: 560px; }
      .visit-photo { min-height: 460px; }
      body { padding-bottom: 76px; }
      .mobile-dock { position: fixed; z-index: 60; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: 58px 1fr; gap: 9px; padding: 9px 12px calc(9px + env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--paper) 95%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid var(--line); box-shadow: 0 -10px 35px rgb(var(--night-rgb) / .12); }
      .mobile-dock a:first-child { display: grid; place-items: center; min-height: 52px; color: var(--teal); background: #fff; border: 1px solid var(--line); border-radius: 999px; }
      .mobile-dock .dock-main { display: flex; align-items: center; justify-content: center; gap: 9px; min-height: 52px; color: #fff; background: var(--teal-deep); border-radius: 999px; font-size: 15px; font-weight: 800; }
    }
    @media (min-width: 981px) { #menu-mobile { display: none !important; } }
    @media (max-width: 640px) {
      :root { --shell: calc(100% - 32px); }
      .brand strong { font-size: 19px; }
      .hero h1 { font-size: clamp(50px, 15.5vw, 70px); }
      .hero-actions { display: grid; justify-items: center; }
      .hero-actions .button { width: 100%; }
      .hero-proof { grid-template-columns: 1fr 1fr; row-gap: 4px; }
      .hero-proof div { margin-right: 14px; padding-right: 14px; }
      .hero-proof div:nth-child(2) { border-right: 0; }
      .hero-proof div:nth-child(3) { grid-column: 1 / -1; }
      .hero-proof strong { font-size: 30px; }
      .hero-media { min-height: 500px; border-radius: 160px 160px 0 0; }
      .hero-media figcaption { flex-direction: column; align-items: flex-start; }
      .trust-list { grid-template-columns: 1fr; }
      .trust-list div { min-height: 64px; padding: 0; border-right: 0; border-bottom: 1px solid rgba(255, 255, 255, .14); }
      .trust-list div:last-child { border-bottom: 0; }
      .doutor-foto figcaption { left: 10px; }
      .doutor-tira { gap: 8px; }
      .experience-photo { min-height: 520px; }
      .treatment-list, .mais { grid-template-columns: 1fr; }
      .treatment-list h3 { font-size: 26px; }
      .treatments .button { width: 100%; }
      .carousel-head { flex-direction: column; align-items: flex-start; }
      .gallery-card { height: 520px; }
      .carousel-footer { flex-direction: column; align-items: flex-start; }
      .space-photos { height: 460px; grid-template-columns: 1.2fr 1fr; gap: 10px; }
      .premio { flex-direction: column; align-items: flex-start; gap: 8px; }
      .review-card { padding: 24px; min-height: 360px; }
      .review-card blockquote { font-size: 20px; }
      .visit-photo { min-height: 420px; }
      .visit .button { width: 100%; }
      .footer-main { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      .reveal { opacity: 1; transform: none; transition: none; }
      .button, .arrow-button { transition: none; }
    }'''

RUNTIME = r'''(() => {
  const client = window.DEMO_CLIENT;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  $$("[data-whatsapp]").forEach(a => a.href = client.whatsapp);
  $$("[data-instagram]").forEach(a => a.href = client.instagram);
  $$("[data-directions]").forEach(a => a.href = client.directions);
  $$("[data-reviews-url]").forEach(a => a.href = client.maps);
  $$("[data-review-write]").forEach(a => a.href = client.writeReviewUrl);
  const iframe = $("[data-map-embed]"); if (iframe) iframe.src = client.mapEmbed;

  // Depoimentos.
  const lista = $("[data-reviews]");
  client.reviews.forEach(r => {
    const li = document.createElement("li");
    li.className = "review-card";
    const aspas = document.createElement("span"); aspas.className = "aspas"; aspas.setAttribute("aria-hidden", "true"); aspas.textContent = "“";
    const q = document.createElement("blockquote"); q.textContent = r.quote;
    const f = document.createElement("footer");
    const ini = document.createElement("span"); ini.textContent = r.initials; ini.setAttribute("aria-hidden", "true");
    const quem = document.createElement("div");
    const n = document.createElement("strong"); n.textContent = r.name;
    const s = document.createElement("small"); s.textContent = r.tag || "Avaliação no Google";
    quem.append(n, s); f.append(ini, quem); li.append(aspas, q, f); lista.append(li);
  });

  // Carrosséis.
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  $$("[data-carousel]").forEach(root => {
    const track = $(".carousel-track", root), prev = $("[data-prev]", root), next = $("[data-next]", root), dots = $("[data-dots]", root), status = $("[data-status]", root);
    let stops = [0], active = 0, frame = 0;
    const go = index => track.scrollTo({ left: stops[Math.max(0, Math.min(index, stops.length - 1))], behavior: motion.matches ? "auto" : "smooth" });
    const update = () => {
      frame = 0;
      active = stops.reduce((best, point, i) => Math.abs(point - track.scrollLeft) < Math.abs(stops[best] - track.scrollLeft) ? i : best, 0);
      prev.disabled = active === 0;
      next.disabled = active === stops.length - 1;
      Array.from(dots.children).forEach((dot, i) => dot.setAttribute("aria-current", String(i === active)));
      const label = "Posição " + (active + 1) + " de " + stops.length;
      if (status.textContent !== label) status.textContent = label;
    };
    const measure = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const origin = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().left + track.scrollLeft : 0;
      stops = Array.from(track.children).map(item => Math.min(max, Math.max(0, item.getBoundingClientRect().left + track.scrollLeft - origin)));
      stops = stops.filter((v, i, all) => i === 0 || Math.abs(v - all[i - 1]) > 3);
      if (!stops.length) stops = [0];
      dots.replaceChildren(...stops.map((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Ir para a posição " + (i + 1));
        b.setAttribute("aria-controls", track.id);
        b.addEventListener("click", () => go(i));
        return b;
      }));
      update();
    };
    prev.addEventListener("click", () => go(active - 1));
    next.addEventListener("click", () => go(active + 1));
    track.addEventListener("keydown", e => {
      const keys = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: stops.length - 1 };
      if (e.key in keys) { e.preventDefault(); go(keys[e.key]); }
    });
    track.addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(track); else window.addEventListener("resize", measure);
    measure();
  });

  // Animação de entrada.
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !motion.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: .1, rootMargin: "0px 0px -40px" });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add("is-visible"));

  // Menu do celular.
  const menuButton = $("[data-menu-button]"), menu = $("#menu-mobile");
  const closeMenu = () => { menu.hidden = true; menuButton.setAttribute("aria-expanded", "false"); menuButton.setAttribute("aria-label", "Abrir menu"); };
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });
  menu.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { closeMenu(); menuButton.focus(); } });
  document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest(".site-header")) closeMenu(); });
  window.matchMedia("(min-width: 981px)").addEventListener("change", e => { if (e.matches) closeMenu(); });
})();'''

ICO = {
    'seta': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    'pin': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    'relogio': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    'insta': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg>',
    'whats': '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.5A8.5 8.5 0 0 1 7.3 19L3 20l1.2-4.1A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.5 7.5c0 4 2.5 6.5 6.5 6.5l1-2-2-1-1 1c-1.5-.5-2.5-1.5-3-3l1-1-1-2Z"/></svg>',
}
WA = lambda txt, classe='button button-primary': f'<a class="{classe}" data-whatsapp href="#" target="_blank" rel="noopener">{esc(txt)} {ICO["seta"]}</a>'

def titulo(h2, em, tag='h2', idt=None):
    i = f' id="{idt}"' if idt else ''
    return f'<{tag}{i}>{esc(h2)}' + (f' <em>{esc(em)}</em>' if em else '') + f'</{tag}>'

def controles(track, rotulo):
    return (f'<div class="carousel-controls"><button class="arrow-button" type="button" data-prev aria-controls="{track}" aria-label="{esc(rotulo)} anteriores">←</button>'
            f'<div class="carousel-dots" data-dots></div><button class="arrow-button" type="button" data-next aria-controls="{track}" aria-label="Próximas {esc(rotulo.lower())}">→</button>'
            '<span class="sr-only" data-status aria-live="polite"></span></div>')

class Demo:
    def __init__(self, cfg):
        self.cfg = cfg
        self.google = ler_google(cfg.get('google_json'))
        self.fotos = Fotos(cfg.get('inventario'))
        self.horas = cfg.get('horas_override')
        if self.horas: self.horas = {int(k): v for k, v in self.horas.items()}
        else: self.horas = horario(self.google)
        self.nota = mostrar_nota(cfg)

    def img(self, spec, vaga, alt, w=None, h=None, lazy=True, nome=None):
        tam = TAM[vaga]
        uri = self.fotos.uri(spec, tam, nome or vaga)
        return f'<img src="{uri}" alt="{esc(alt)}" width="{tam[0]}" height="{tam[1]}"' + (' loading="lazy"' if lazy else '') + '>'

    # ---------- seções ----------
    def cabecalho(self):
        c = self.cfg; lg = c.get('logo') or {}
        marca = (f'<img src="{self.fotos.uri(lg["foto"], TAM["logo"], "logo")}" alt="" width="200" height="200">' if lg.get('foto')
                 else f'<span class="mono" aria-hidden="true">{esc(lg.get("monograma", iniciais(c["marca"])))}</span>')
        self.marca_html = marca
        links = ''.join(f'<a href="{a}">{esc(t)}</a>' for a, t in c['nav'])
        cta = WA(c.get('cta', 'Agendar avaliação')).replace(' ' + ICO['seta'], '')
        return f'''  <header class="site-header">
    <div class="shell nav">
      <a class="brand" href="#inicio" aria-label="{esc(c['marca_completa'])}, início">
        {marca}
        <span><strong>{esc(c['marca'])}</strong><small>{esc(c['marca_sub'])}</small></span>
      </a>
      <nav class="nav-links" aria-label="Principal">
        {links}
        {cta}
      </nav>
      <button class="menu-button" type="button" data-menu-button aria-expanded="false" aria-controls="menu-mobile" aria-label="Abrir menu"><span></span><span></span><span></span></button>
    </div>
    <div id="menu-mobile" hidden>
      <nav class="shell" aria-label="Menu">
        {links}
        {cta}
      </nav>
    </div>
  </header>'''

    def prova(self, v, t):
        c = self.cfg
        if v == '{nota}':
            if not self.nota: return f'<div><strong><span class="stars" aria-hidden="true">★★★★★</span></strong><span class="rot">{esc(c["google_total"])} avaliações no Google</span></div>'
            return f'<div><strong>{esc(c["google_nota"])} <span class="stars" aria-hidden="true">★</span></strong><span class="rot">{esc(c["google_total"])} avaliações no Google</span></div>'
        return f'<div><strong>{esc(v)}</strong><span class="rot">{esc(t)}</span></div>'

    def hero(self):
        h = self.cfg['hero']
        link = h.get('link')
        acoes = WA(h.get('cta', 'Quero agendar minha avaliação')) + (f'<a class="text-link" href="{link[0]}">{esc(link[1])} <span aria-hidden="true">↓</span></a>' if link else '')
        chip = f'<span class="award-chip"><b>★</b> {esc(h["chip"])}</span>' if h.get('chip') else ''
        return f'''    <section class="hero">
      <div class="shell hero-grid">
        <div class="hero-copy reveal">
          <p class="eyebrow">{esc(h['eyebrow'])}</p>
          <h1>{esc(h['h1'])}<em>{esc(h['h1_em'])}</em></h1>
          <p class="lead">{esc(h['lead'])}</p>
          <div class="hero-actions">{acoes}</div>
          <div class="hero-proof">{''.join(self.prova(v, t) for v, t in h['provas'])}</div>
        </div>
        <figure class="hero-media reveal">
          {self.img(h['foto'], 'hero', h['alt'], lazy=False)}
          <figcaption><span><strong>{esc(h['nome'])}</strong><small>{esc(h['registro'])}</small></span>{chip}</figcaption>
        </figure>
      </div>
    </section>'''

    def faixa(self):
        itens = ''.join(f'<div><span>{i:02d}</span><strong>{esc(t)}</strong></div>' for i, t in enumerate(self.cfg['faixa'], 1))
        return f'''    <section class="trust" aria-label="Diferenciais">
      <div class="shell trust-list">{itens}</div>
    </section>'''

    def dentista(self):
        d = self.cfg['dentista']
        ps = ''.join(f'<p class="lead">{esc(p)}</p>' for p in d['p'])
        cit = (f'<blockquote class="citacao">“{esc(d["citacao"])}”<cite>{esc(d["citacao_fonte"])}</cite></blockquote>' if d.get('citacao') else '')
        tira = ('<div class="doutor-tira">' + ''.join(self.img(t['foto'], 'tira', t['alt'], nome='tira') for t in d['tira']) + '</div>') if d.get('tira') else ''
        b1, b2 = d['selo']
        return f'''    <section class="section doutor" id="{d.get('id', 'dentista')}">
      <div class="shell doutor-grid">
        <figure class="doutor-foto reveal">
          {self.img(d['foto'], 'dentista', d['alt'])}
          <figcaption><b>{esc(b1)}</b>{esc(b2)}</figcaption>
        </figure>
        <div class="doutor-copy reveal">
          <p class="eyebrow">{esc(d['eyebrow'])}</p>
          {titulo(d['h2'], d.get('h2_em'))}
          {ps}
          {cit}
          {tira}
        </div>
      </div>
    </section>'''

    def carrossel(self, k):
        car = next(x for x in self.cfg['carrosseis'] if x['id'] == k)
        tipo = car.get('tipo', 'galeria')
        track = f'{k}-track'
        if tipo == 'galeria':
            itens = ''.join(f'<figure class="gallery-card">{self.img(i["foto"], "galeria", i["alt"], nome=k)}<figcaption><small>{esc(i["rotulo"])}</small><strong>{esc(i["titulo"])}</strong></figcaption></figure>'
                            for i in car['itens'])
        else:
            vaga = 'retrato' if car.get('formato') == 'retrato' else 'quadrado'
            itens = ''.join(f'<figure class="smile-card">{self.img(i["foto"], vaga, i["alt"], nome=k)}' + (f'<figcaption>{esc(i["legenda"])}</figcaption>' if i.get('legenda') else '') + '</figure>'
                            for i in car['itens'])
        mod = ' carousel-track--retrato' if car.get('formato') == 'retrato' else ''
        fundo = {'creme': 'gallery-section', 'clara': 'gallery-section gallery-section--clara'}[car.get('fundo', 'creme')]
        lead = f'<p class="lead">{esc(car["p"])}</p>' if car.get('p') else ''
        nota = f'<p class="nota-caso">{esc(car["nota"])}</p>' if car.get('nota') else ''
        return f'''    <section class="section {fundo}" id="{k}" aria-labelledby="{k}-titulo">
      <div class="shell">
        <div class="carousel-head reveal">
          <div>
            <p class="eyebrow">{esc(car['eyebrow'])}</p>
            {titulo(car['h2'], car.get('h2_em'), idt=k + '-titulo')}
            {lead}
          </div>
        </div>
        <div class="carousel" data-carousel role="region" aria-roledescription="carrossel" aria-label="{esc(car['rotulo'])}">
          <div class="carousel-track{mod}" id="{track}" tabindex="0">{itens}</div>
          <div class="carousel-footer">
            <p>Arraste para o lado ou use as setas.</p>
            {controles(track, 'Fotos')}
          </div>
          {nota}
        </div>
      </div>
    </section>'''

    def experiencia(self):
        e = self.cfg['experiencia']
        pts = ''.join(f'<li><span>{i:02d}</span> {esc(p)}</li>' for i, p in enumerate(e['pontos'], 1))
        return f'''    <section class="section experience" id="{e.get('id', 'experiencia')}">
      <div class="shell experience-grid">
        <figure class="experience-photo reveal">{self.img(e['foto'], 'experiencia', e['alt'])}<figcaption>{esc(e['legenda'])}</figcaption></figure>
        <div class="experience-copy reveal">
          <p class="eyebrow">{esc(e['eyebrow'])}</p>
          {titulo(e['h2'], e.get('h2_em'))}
          <p class="lead">{esc(e['lead'])}</p>
          <ul class="care-points">{pts}</ul>
        </div>
      </div>
    </section>'''

    def tratamentos(self):
        t = self.cfg['tratamentos']
        itens = ''.join(f'<article class="reveal"><span>{i:02d}</span><div><h3>{esc(a)}</h3><p>{esc(b)}</p></div></article>' for i, (a, b) in enumerate(t['itens'], 1))
        mais = ''.join(f'<div><h3>{esc(a)}</h3><ul>' + ''.join(f'<li>{esc(x)}</li>' for x in lst) + '</ul></div>' for a, lst in t.get('mais', []))
        lead = f'<p class="lead">{esc(t["lead"])}</p>' if t.get('lead') else ''
        return f'''    <section class="section treatments" id="tratamentos">
      <div class="shell">
        <div class="section-head reveal">
          <p class="eyebrow">{esc(t['eyebrow'])}</p>
          {titulo(t['h2'], t.get('h2_em'))}
          {lead}
        </div>
        <div class="treatment-list">{itens}</div>
        {f'<div class="mais reveal">{mais}</div>' if mais else ''}
        {WA(t.get('cta', 'Conversar sobre meu caso'), 'button button-light')}
      </div>
    </section>'''

    def espaco(self):
        e = self.cfg['espaco']
        figs = ''
        for n, f in enumerate(e['fotos']):
            cap = f'<figcaption>{esc(f["legenda"])}</figcaption>' if f.get('legenda') else ''
            figs += f'<figure>{self.img(f["foto"], "espaco_alto" if n == 0 else "espaco", f["alt"], nome="espaco")}{cap}</figure>'
        cards = ''.join(f'<div class="premio{" premio--ouro" if n == 0 else ""}"><strong>{esc(a)}</strong><span><b>{esc(b)}</b>{esc(x)}</span></div>' for n, (a, b, x) in enumerate(e.get('cards', [])))
        return f'''    <section class="section" id="{e.get('id', 'consultorio')}">
      <div class="shell space-grid">
        <div class="space-photos reveal">{figs}</div>
        <div class="space-copy reveal">
          <p class="eyebrow">{esc(e['eyebrow'])}</p>
          {titulo(e['h2'], e.get('h2_em'))}
          <p class="lead">{esc(e['lead'])}</p>
          {f'<div class="premios">{cards}</div>' if cards else ''}
        </div>
      </div>
    </section>'''

    def depoimentos(self):
        d = self.cfg['depoimentos']; c = self.cfg
        selo = (f'<a class="nota-google" data-reviews-url href="#" target="_blank" rel="noopener"><b>{esc(c["google_nota"])}</b><span class="stars" aria-hidden="true">★★★★★</span><span>{esc(c["google_total"])} avaliações no Google ↗</span></a>'
                if self.nota else f'<a class="nota-google" data-reviews-url href="#" target="_blank" rel="noopener"><span class="stars" aria-hidden="true">★★★★★</span><span>{esc(c["google_total"])} avaliações no Google ↗</span></a>')
        return f'''    <section class="section testimonials" id="depoimentos" aria-labelledby="depoimentos-titulo">
      <div class="shell">
        <div class="carousel-head reveal">
          <div>
            <p class="eyebrow">{esc(d['eyebrow'])}</p>
            {titulo(d['h2'], d.get('h2_em'), idt='depoimentos-titulo')}
            {selo}
          </div>
        </div>
        <div class="carousel" data-carousel role="region" aria-roledescription="carrossel" aria-label="Avaliações de pacientes">
          <ul class="carousel-track" id="reviews-track" data-reviews tabindex="0"></ul>
          <div class="carousel-footer">
            <a class="text-link" data-review-write href="#" target="_blank" rel="noopener">Já é paciente? Avalie no Google <span aria-hidden="true">↗</span></a>
            {controles('reviews-track', 'Avaliações')}
          </div>
        </div>
      </div>
    </section>'''

    def linhas_hora(self):
        if not self.horas: return [(self.cfg['contato'].get('sem_horario', 'Atendimento com hora marcada'), 'Confirme o horário pelo WhatsApp')]
        ls = linhas_horario(self.horas)
        abertos = [(n, t) for n, t, _ in ls if t != 'Fechado']
        fechados = [n for n, t, _ in ls if t == 'Fechado']
        out = [(f'{n}: {t}', '') for n, t in abertos]
        if out: out[-1] = (out[-1][0], ('Fechado ' + ' e '.join(x.lower() for x in fechados).replace('sábado e domingo', 'aos sábados e domingos').replace('domingo', 'aos domingos')) if fechados else 'Atendimento com hora marcada')
        return out

    def contato(self):
        k = self.cfg['contato']; c = self.cfg
        horas = ''.join(f'<div>{ICO["relogio"]}<span><strong>{esc(a)}</strong>' + (f'<small>{esc(b)}</small>' if b else '') + '</span></div>' for a, b in self.linhas_hora())
        insta = f'<a data-instagram href="#" target="_blank" rel="noopener">{ICO["insta"]}<span><strong>@{esc(c["instagram"])}</strong><small>{esc(k.get("insta_rotulo", "Acompanhe casos e novidades"))}</small></span></a>'
        fone = f'<a data-whatsapp href="#" target="_blank" rel="noopener">{ICO["whats"]}<span><strong>{esc(k["whatsapp_texto"])}</strong><small>WhatsApp</small></span></a>'
        return f'''    <section class="section visit" id="contato">
      <div class="shell visit-card reveal">
        <figure class="visit-photo">{self.img(k['foto'], 'contato', k['alt'])}</figure>
        <div class="visit-copy">
          <p class="eyebrow">{esc(k['eyebrow'])}</p>
          {titulo(k['h2'], k.get('h2_em'))}
          <p class="lead">{esc(k['lead'])}</p>
          <div class="contact-lines">
            <a data-directions href="#" target="_blank" rel="noopener">{ICO['pin']}<span><strong>{esc(k['endereco'][0])}</strong><small>{esc(k['endereco'][1])}</small></span></a>
            {horas}
            {fone}
            {insta}
          </div>
          {WA(k.get('cta', 'Agendar pelo WhatsApp'), 'button button-light')}
          <div class="mapa"><iframe data-map-embed title="Mapa: {esc(c['marca_completa'])}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
        </div>
      </div>
    </section>'''

    def rodape(self):
        c = self.cfg; r = c['rodape']
        links = ''.join(f'<a href="{a}">{esc(t)}</a>' for a, t in c['nav'])
        return f'''  <footer class="footer">
    <div class="shell footer-main">
      <a class="brand" href="#inicio">{self.marca_html}<span><strong>{esc(c['marca'])}</strong><small>{esc(r['registro'])}</small></span></a>
      <nav aria-label="Rodapé">{links}</nav>
    </div>
    <div class="shell footer-bottom"><span>{esc(r['esq'])}</span><span>{esc(r['dir'])}</span></div>
  </footer>

  <nav class="mobile-dock" aria-label="Ações rápidas">
    <a data-directions href="#" target="_blank" rel="noopener" aria-label="Abrir localização no mapa">{ICO['pin']}</a>
    <a class="dock-main" data-whatsapp href="#" target="_blank" rel="noopener">{esc(c.get('cta', 'Agendar avaliação'))} {ICO['seta']}</a>
  </nav>'''

    def cliente(self):
        c = self.cfg
        lista = avaliacoes(self.google)
        revs = []
        for a in c['depoimentos']['itens']:
            if 'nome' in a:
                achadas = [x for x in lista if x['nome'].strip().lower() == a['nome'].strip().lower()]
                if not achadas: raise SystemExit(f'avaliação de {a["nome"]} não está entre as de 5 estrelas')
                x = achadas[0]
            else: x = lista[a['i']]
            nome = x['nome'].strip()
            if nome == nome.lower(): nome = ' '.join(p if p in ('de', 'da', 'do', 'dos', 'das', 'e') else p[:1].upper() + p[1:] for p in nome.split())
            nome = a.get('nome_exibido', nome)
            revs.append({'name': nome, 'initials': iniciais(nome), 'tag': a.get('tag', 'Avaliação no Google'), 'quote': a['texto'] if 'texto' in a else trecho(x['texto'], a.get('trecho'))})
        destino = c['google_nome'] + ', ' + c['endereco_maps']
        msg = c.get('mensagem', f'Olá! Vim pelo site e gostaria de agendar uma avaliação.')
        linhas = [
            f'  brand: {json.dumps(c["marca_completa"], ensure_ascii=False)},',
            f'  whatsapp: "https://wa.me/{c["whatsapp"]}?text=" + encodeURIComponent({json.dumps(msg, ensure_ascii=False)}),',
            f'  instagram: "https://www.instagram.com/{c["instagram"]}/",',
            f'  maps: {json.dumps(c["maps_url"])},',
            f'  directions: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent({json.dumps(destino, ensure_ascii=False)}),',
            f'  mapEmbed: "https://www.google.com/maps?q=" + encodeURIComponent({json.dumps(destino, ensure_ascii=False)}) + "&z=16&hl=pt-BR&output=embed",',
            f'  writeReviewUrl: {json.dumps(c.get("avaliar_url", c["maps_url"]))},',
            f'  rating: {json.dumps(c["google_nota"])},', f'  reviewTotal: {json.dumps(c["google_total"])},',
            '  reviews: [\n' + ',\n'.join('    ' + json.dumps(r, ensure_ascii=False) for r in revs) + '\n  ],',
            f'  verifiedOn: {json.dumps(c["verificado"])}',
        ]
        return '  <script>\nwindow.DEMO_CLIENT = {\n' + '\n'.join(linhas) + '\n};\n' + RUNTIME + '\n  </script>'

    def documento(self):
        c = self.cfg; f = c['fontes']
        serif, sans = f.get('titulo', 'Cormorant Garamond'), f.get('texto', 'Manrope')
        fontes = f'family={SERIFAS[serif]}&family={SANS[sans]}'
        secoes = {'hero': self.hero, 'faixa': self.faixa, 'dentista': self.dentista, 'experiencia': self.experiencia,
                  'tratamentos': self.tratamentos, 'espaco': self.espaco, 'depoimentos': self.depoimentos, 'contato': self.contato}
        cab = self.cabecalho()
        corpo = []
        for s in c['ordem']:
            corpo.append(self.carrossel(s.split(':', 1)[1]) if s.startswith('carrossel:') else secoes[s]())
        # título da capa com palavra comprida ("Transformando"): diminui a letra para a palavra caber na coluna
        maior = max(len(w) for w in (c['hero']['h1'] + ' ' + c['hero']['h1_em']).split())
        k = min(1.0, 10.5 / maior)
        if k < 1: c['css_extra'] = c.get('css_extra', '') + (f'.hero h1 {{ font-size: clamp({round(60 * k)}px, {8.6 * k:.1f}vw, {round(124 * k)}px); }}'
                                                             f'@media (max-width: 640px) {{ .hero h1 {{ font-size: clamp({round(50 * k)}px, {15.5 * k:.1f}vw, {round(70 * k)}px); }} }}')
        raiz = (variaveis(c['cores']) + f'--line: rgb({trio(c["cores"]["tinta"])} / .13); --shadow: 0 26px 70px rgb({trio(c["cores"]["primaria_escura"])} / .16);'
                + f'--serif: "{serif}", Georgia, "Times New Roman", serif; --sans: "{sans}", "Segoe UI", Arial, sans-serif; --shell: min(1180px, calc(100% - 48px));')
        return f'''<!DOCTYPE html>
<!-- {c['comentario']} -->
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="{c['cores']['primaria_escura']}">
  <meta name="robots" content="noindex">
  <meta name="description" content="{esc(c['descricao'])}">
  <title>{esc(c['titulo'])}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?{fontes}&display=swap" rel="stylesheet">
  <style>
    :root {{ {raiz} }}{CSS}{c.get('css_extra', '')}
  </style>
</head>
<body>
{cab}

  <main id="inicio">
{chr(10).join(corpo)}
  </main>

{self.rodape()}

{self.cliente()}
</body>
</html>
'''

def gerar(caminho, saida=None):
    cfg = json.load(open(caminho, encoding='utf-8'))
    d = Demo(cfg)
    doc = d.documento()
    saida = saida or os.path.join(REPO, 'demos', cfg['pasta'], 'index.html')
    os.makedirs(os.path.dirname(saida), exist_ok=True)
    open(saida, 'w', encoding='utf-8').write(doc)
    n = sum(len(x['itens']) for x in cfg.get('carrosseis', []))
    print(f'{saida}: {len(doc) // 1024} KB, {n} fotos nos carrosséis, {doc.count("data:image")} imagens')
    for a in d.fotos.avisos: print('  AVISO', a)
    return saida

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--avaliacoes' in args:
        for n, a in enumerate(avaliacoes(ler_google(args[0]))): print(f'[{n}] ({a["nota"]}★) {a["nome"]}: {a["texto"][:300]}')
        sys.exit()
    gerar(args[0], args[args.index('--saida') + 1] if '--saida' in args else None)
