# PORTFÓLIO ONLINE de uma fotógrafa (versão 4, 13/11/2026): o link que ela manda quando a cliente pergunta "quanto
# custa?" e põe na bio. Não é a demo antiga convertida: sai dos ORIGINAIS das fotos, com desenho próprio.
#   index.html      a vitrine: a frase dela, uma tira de fotos inteiras (cada uma leva ao ensaio), a lista de ensaios
#                   com o "a partir de", o portfólio com FILTRO por ensaio, as avaliações, quem fotografa e o contato
#   <ensaio>.html   uma página por ensaio: nome grande, as fotos (linhas justificadas, foto sempre inteira), o que é,
#                   quando fazer, o depoimento de quem fez AQUELE ensaio, os pacotes e a barra de reserva no celular
# O porquê, as referências e as regras: docs/nichos/fotografos.md, seção 10.
#
# Uso: python3 ferramentas/demo/gerar-portfolio.py demos/<pasta> [<pasta dos originais>]
#   <pasta dos originais>: onde estão os arquivos de portfolio...fotos[].arq (ex.: drive/..., posts/<post>/..., google/...).
#   Foto bruta não entra no git. Sem a pasta (ou sem um arquivo), o gerador reaproveita a foto JÁ TRATADA por ele
#   mesmo, lida das páginas que estão em demos/<pasta> (mesmos bytes, pela chave data-k): dá para mudar texto e
#   preço sem ter os originais. Para trocar ou acrescentar foto, os originais são obrigatórios.
#
# Fotos (o que a versão anterior errou): nunca saem de dentro de outra página; nunca são ampliadas; nunca são
# cortadas no centro cego (a página mostra a foto inteira, na proporção dela; "box" recorta só quando a curadoria
# pede); um arquivo por foto: 1400 px no lado maior (galeria e tela cheia), 1920 px nas fotos da abertura do ensaio;
# JPEG progressivo, qualidade 82. O build tira as fotos de dentro da página (scripts/fotos-da-demo.mjs).
#
# Mantido igual (a oferta e o rastreio): a faixa e a pílula da Renderiza (mesmas classes e atributos data-rz-* de
# gerar-fotografia.py, de onde vêm o CSS, o JS e o window.RZ), data-whatsapp, data-instagram, data-reviews-link,
# data-directions, o DEMO_CLIENT e o runtime.js. Nenhum evento novo: o contador (exemplos/visitas.js) lê os mesmos
# cliques. Nada cobre a página (sem modal). O filtro por ensaio continua (abas).
#
# demo.json -> "portfolio": {olho, titulo, linha, local, tira ["ensaio:índice"], avaliacoes [{nome, tag, texto}],
#   sobre {olho, titulo, p [], citacao, citacao_quem, fotos [{arq, alt}], numeros [[n, rótulo]]},
#   contato {titulo, p, endereco [], telefone},
#   ensaios [{id, nome, curto?, chamada, pedido ("o ensaio gestante": vai na mensagem do WhatsApp), frase, texto,
#     citacao?, citacao_quem?, quando?, depo? {nome, texto}, capa (quantas fotos na abertura), vitrine [índices no
#     filtro da vitrine], fotos [{arq, alt, box?}], pacotes [{nome, preco, itens, destaque?}]}]}
#   Pacotes e valores são EXEMPLOS: a página mostra o selo (some no vídeo, ?video=1).
import base64, hashlib, html, io, json, math, os, re, sys
from urllib.parse import quote
import importlib.util

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location('gerar_fotografia', os.path.join(AQUI, 'gerar-fotografia.py'))
GF = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(GF)
esc = lambda t: html.escape(str(t), quote=True)

GALERIA, ABERTURA, MINI = 1400, 1920, 220   # lado maior, em px
QUALIDADE = 82
ICONE = lambda n: f'<svg aria-hidden="true"><use href="#{n}"/></svg>'


# ---------- fotos ----------
class Fotos:
    """Cada foto sai do original (maior tamanho, sem ampliar) uma vez por tamanho. Sem o original, reaproveita os
    bytes que o próprio gerador já pôs nas páginas da pasta (atributo data-k)."""
    def __init__(self, originais, pasta):
        self.originais, self.feitas, self.bytes, self.avisos = originais, {}, 0, []
        self.antigas = {}
        for f in sorted(os.listdir(pasta)):
            if not f.endswith('.html'): continue
            t = open(os.path.join(pasta, f), encoding='utf-8').read()
            if 'gerar-portfolio.py, versão 4' not in t[:600]: continue
            for m in re.finditer(r'<img[^>]*? src="(data:image/jpeg;base64,[^"]+)" width="(\d+)" height="(\d+)"[^>]*? data-k="([0-9a-f]+)"', t):
                self.antigas[m.group(4)] = (m.group(1), int(m.group(2)), int(m.group(3)))

    def foto(self, spec, lado=GALERIA):
        chave = hashlib.sha1(json.dumps([spec['arq'], spec.get('box'), lado, QUALIDADE]).encode()).hexdigest()[:12]
        if chave in self.feitas: return self.feitas[chave]
        caminho = os.path.join(self.originais, spec['arq']) if self.originais else ''
        if caminho and os.path.exists(caminho):
            from PIL import Image, ImageOps
            im = ImageOps.exif_transpose(Image.open(caminho)).convert('RGB')
            if spec.get('box'):
                x0, y0, x1, y1 = spec['box']; W, H = im.size
                im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
            if max(im.size) > lado: im.thumbnail((lado, lado), Image.LANCZOS)   # só reduz: nunca amplia
            elif lado == GALERIA and max(im.size) < 1000: self.avisos.append(f'{spec["arq"]}: original pequeno ({im.width}x{im.height})')
            buf = io.BytesIO(); im.save(buf, 'JPEG', quality=QUALIDADE, optimize=True, progressive=True)
            r = ('data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode(), im.width, im.height)
        elif chave in self.antigas: r = self.antigas[chave]
        else: sys.exit(f'sem o original e sem a foto tratada: {spec["arq"]} (passe a pasta dos originais)')
        self.bytes += len(r[0]) * 3 // 4
        self.feitas[chave] = {'uri': r[0], 'w': r[1], 'h': r[2], 'k': chave, 'alt': spec['alt'], 'a': r[1] / r[2]}
        return self.feitas[chave]


def img(f, prioridade=False, classe=''):
    carga = ' fetchpriority="high"' if prioridade else ' loading="lazy"'
    c = f' class="{classe}"' if classe else ''
    return f'<img{c} src="{f["uri"]}" width="{f["w"]}" height="{f["h"]}" alt="{esc(f["alt"])}"{carga} decoding="async" data-k="{f["k"]}">'


# ---------- estilo ----------
CSS = r'''
:root{--fundo:{{fundo}};--papel:{{papel}};--areia:{{areia}};--linha:{{linha}};--tinta:{{tinta}};--tinta-2:{{tinta2}};--rosa:{{rosa}};--acento:{{acento}};--acento-escuro:{{acento_escuro}};--cafe:{{cafe}};
--serif:{{serif}};--sans:{{sans}};--script:{{script}};--w:min(1240px,calc(100% - 64px));--topo:76px;--suave:cubic-bezier(.2,.7,.2,1);--destaque:{{destaque}};--claro-ac:color-mix(in srgb,var(--acento) 40%,#f4f1ec)}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:calc(var(--topo) + 16px);-webkit-text-size-adjust:100%}
body{margin:0;background:var(--fundo);color:var(--tinta);font-family:var(--sans);font-size:1.0625rem;line-height:1.65;overflow-x:hidden;-webkit-font-smoothing:antialiased;font-variant-numeric:lining-nums}
img{display:block;max-width:100%;height:auto}a{color:inherit}button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0}
[hidden]{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
:focus-visible{outline:2px solid var(--destaque);outline-offset:3px}
.container{width:var(--w);margin-inline:auto}
h1,h2,h3{font-family:var(--serif);font-weight:400;line-height:1.06;letter-spacing:-.005em;margin:0;text-wrap:balance}
h2{font-size:clamp(2.1rem,4vw,3.3rem)}p{margin:0 0 1em}
.olho{font-weight:500;font-size:.72rem;line-height:1.5;letter-spacing:.26em;text-transform:uppercase;color:var(--destaque);margin:0 0 16px}
.secao{padding:clamp(72px,9vw,128px) 0}.secao--areia{background:var(--areia)}
.cab{display:flex;align-items:flex-end;justify-content:space-between;gap:16px 40px;flex-wrap:wrap;margin-bottom:clamp(28px,4vw,48px)}
.cab p:not(.olho):not(.selo){color:var(--tinta-2);margin:0;max-width:44ch}
.botao{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:14px 28px;background:var(--acento-escuro);border:1px solid var(--acento-escuro);color:#fff;text-decoration:none;font-weight:500;font-size:.76rem;letter-spacing:.2em;text-transform:uppercase;transition:background .3s,color .3s,border-color .3s}
.botao:hover{background:var(--cafe);border-color:var(--cafe)}.botao svg{width:18px;height:18px;flex:none}
.botao--linha{background:transparent;color:var(--tinta);border-color:color-mix(in srgb,var(--tinta) 38%,transparent)}.botao--linha:hover{background:var(--tinta);border-color:var(--tinta);color:var(--fundo)}
.link{display:inline-flex;align-items:center;gap:10px;font-weight:500;font-size:.76rem;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;padding-bottom:5px;border-bottom:1px solid currentColor}
.link svg{width:16px;height:16px;transition:transform .35s var(--suave)}.link:hover svg{transform:translateX(5px)}
.selo{display:inline-flex;align-items:center;gap:8px;margin:0;padding:7px 14px;border:1px dashed color-mix(in srgb,var(--tinta) 40%,transparent);color:var(--tinta-2);font-size:.74rem;letter-spacing:.04em}
.selo svg{width:12px;height:12px;color:var(--destaque)}.modo-video .selo{display:none!important}
.estrelas{color:#c99a3b;letter-spacing:2px}
.js .reveal{opacity:0;transform:translateY(18px);transition:opacity .9s ease,transform .9s var(--suave);transition-delay:calc(var(--i,0) * 70ms)}.js .reveal.is-visible{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.js .reveal{opacity:1;transform:none;transition:none}*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}

{{rz}}
.rz-troca{max-width:100%;overflow-x:auto;scrollbar-width:none}.rz-troca::-webkit-scrollbar{display:none}
.rz-folha .rz-dica{background:#ffffff14;border-radius:12px;padding:10px 12px;font-size:.86rem}
@media(max-width:860px){.rz-troca a{flex:0 0 auto;padding:7px 13px}}

/* topo */
.site-header{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--fundo) 90%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid transparent;transition:border-color .3s}
.site-header.rolou{border-bottom-color:var(--linha)}
.topo-in{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:var(--topo);position:relative}
.marca{display:inline-flex;align-items:baseline;gap:8px;text-decoration:none;white-space:nowrap}
.marca{font-size:min(1.32rem,calc((100vw - 112px) / var(--mk,10)))}
.marca b{font-family:var(--serif);font-weight:400;font-size:1em;letter-spacing:.2em;text-transform:uppercase}
.marca i{font-family:var(--script);font-style:normal;font-size:1.29em;line-height:.6;color:var(--destaque)}
.nav{display:flex;gap:clamp(16px,2.2vw,32px);margin-left:auto}
.nav a,.menu-mobile a:not(.botao){font-size:.74rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;padding:8px 0;position:relative}
.nav a::after{content:"";position:absolute;left:0;right:0;bottom:2px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .4s var(--suave)}.nav a:hover::after{transform:none}
.topo-cta{min-height:42px;padding:9px 18px;font-size:.7rem}
.menu-botao{display:none;width:44px;height:44px;place-items:center;margin-right:-10px}
.menu-botao span,.menu-botao span::before{display:block;width:24px;height:1px;background:currentColor;transition:transform .3s}.menu-botao span::before{content:"";transform:translateY(7px)}
.menu-botao[aria-expanded="true"] span{transform:translateY(3px) rotate(45deg)}.menu-botao[aria-expanded="true"] span::before{transform:rotate(-90deg)}
.menu-mobile{position:absolute;top:100%;left:-16px;right:-16px;display:grid;gap:2px;padding:10px 16px 22px;background:var(--fundo);border-bottom:1px solid var(--linha);box-shadow:0 24px 40px #2d2c2a14}
.menu-mobile a:not(.botao){padding:14px 0;border-bottom:1px solid var(--linha)}.menu-mobile .botao{margin-top:16px}
@media(max-width:980px){.nav,.topo-cta{display:none}.menu-botao{display:grid}:root{--topo:64px}}
@media(min-width:981px){.menu-mobile{display:none!important}}

/* capa da vitrine: a frase dela e a tira de fotos inteiras */
.capa{display:grid;grid-template-columns:minmax(32px,1fr) minmax(0,840px) minmax(0,400px) minmax(32px,1fr);align-items:end;row-gap:clamp(24px,3vw,40px);padding:clamp(26px,3.6vw,52px) 0 clamp(40px,5vw,72px)}
.capa-titulo{grid-column:2;padding-right:clamp(24px,5vw,72px)}.capa-lado{grid-column:3}.capa .tira{grid-column:1/-1}
.capa h1{font-size:clamp(2.6rem,5.6vw,5rem);line-height:1.02}
.capa-lado p{color:var(--tinta-2);margin:0 0 14px}
.nota{display:inline-flex;align-items:center;gap:10px;font-size:.88rem;text-decoration:none;color:var(--tinta-2)}.nota b{color:var(--tinta);font-weight:500}
.acoes{display:flex;gap:14px 26px;flex-wrap:wrap;align-items:center;margin-top:22px}
.tira{--th:clamp(360px,56vh,600px);overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch}.tira::-webkit-scrollbar{display:none}
.tira-trilho{display:flex;gap:12px;width:max-content;padding-inline:max(32px,calc((100vw - 1240px) / 2))}
.tira-item{display:block;flex:none;text-decoration:none;color:inherit}
.tira-foto{display:block;height:var(--th);aspect-ratio:var(--a);overflow:hidden;background:var(--areia)}
.tira-foto img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--suave)}
.tira-item:hover img{transform:scale(1.035)}
.tira-item span.rot{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:12px;font-size:.72rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase}
.tira-item span.rot svg{width:16px;height:16px;opacity:.55;transition:transform .35s var(--suave),opacity .3s}.tira-item:hover span.rot svg{transform:translateX(4px);opacity:1}
@media(max-width:860px){.capa{display:flex;flex-direction:column;align-items:stretch;gap:20px;padding-top:22px}.capa-titulo,.capa-lado{width:var(--w);margin-inline:auto;padding-right:0}.capa-titulo{order:1}.capa .tira{order:2;width:100%;min-width:0}.capa-lado{order:3}.capa h1{font-size:clamp(2.3rem,10.4vw,3rem)}.tira{--th:min(54svh,460px);scroll-snap-type:x mandatory}.tira-trilho{gap:8px;padding-inline:16px}.tira-item{scroll-snap-align:center}.acoes .botao{flex:1 1 100%}}

/* lista de ensaios com o "a partir de" */
.lista{list-style:none;margin:0;padding:0;border-top:1px solid var(--linha);counter-reset:n}
.lista li{border-bottom:1px solid var(--linha);counter-increment:n}
.ens{display:grid;grid-template-columns:56px 76px minmax(0,1.1fr) minmax(0,1.3fr) auto 28px;gap:0 clamp(14px,2.4vw,36px);align-items:center;padding:18px 8px;text-decoration:none;transition:background .35s,padding .45s var(--suave)}
.ens::before{content:counter(n,decimal-leading-zero);font-size:.74rem;letter-spacing:.2em;color:var(--tinta-2)}
.ens .mini{width:76px;height:96px;object-fit:cover;background:var(--areia)}.ens .mini--deitada{height:57px}
.ens b{font-family:var(--serif);font-weight:400;font-size:clamp(1.7rem,3.2vw,2.7rem);line-height:1.05}
.ens .frase{color:var(--tinta-2)}
.ens .preco{text-align:right;white-space:nowrap;font-family:var(--serif);font-size:1.5rem;line-height:1.1}.ens .preco small{display:block;font-family:var(--sans);font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--tinta-2);margin-bottom:4px}
.ens>svg{width:22px;height:22px;transition:transform .45s var(--suave)}
.ens:hover{background:var(--papel);padding-left:20px}.ens:hover>svg{transform:translateX(6px)}
@media(max-width:860px){.ens{grid-template-columns:64px minmax(0,1fr) auto;gap:2px 14px;padding:14px 0}.ens::before{display:none}.ens .mini{width:64px;height:80px;grid-row:1/3}.ens .mini--deitada{height:48px}.ens b{font-size:1.65rem;align-self:end}.ens .frase{grid-column:2;grid-row:2;font-size:.9rem;line-height:1.35;align-self:start}.ens .preco{grid-column:3;grid-row:1/3;font-size:1.2rem}.ens .preco small{font-size:.6rem;letter-spacing:.12em}.ens>svg{display:none}.ens:hover{padding-left:0;background:none}}

/* galeria: linhas justificadas, cada foto inteira na proporção dela (o JS fecha as linhas; sem JS, o flex resolve) */
.galeria{--h:380px;display:flex;flex-wrap:wrap;gap:10px}
.galeria::after{content:"";flex:999 1 0}
.g-item{position:relative;display:block;flex:var(--a) 1 calc(var(--a) * var(--h));aspect-ratio:var(--a);overflow:hidden;background:var(--areia);cursor:zoom-in}
.g-item img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.1s var(--suave)}
.g-item:hover img{transform:scale(1.03)}
.galeria.just::after{display:none}.galeria.just .g-item{flex:none;aspect-ratio:auto}
.galeria--abre{--h:520px}
@media(max-width:1100px){.galeria{--h:320px}.galeria--abre{--h:420px}}
@media(max-width:640px){.galeria{--h:200px;gap:6px}.galeria--abre{--h:320px}}

/* filtro por ensaio */
.filtro{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 clamp(20px,3vw,32px)}
.filtro [role=tab]{padding:11px 20px;border:1px solid var(--linha);font-size:.74rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;transition:background .3s,color .3s,border-color .3s}
.filtro [role=tab]:hover{border-color:var(--tinta)}
.filtro [role=tab][aria-selected="true"]{background:var(--tinta);border-color:var(--tinta);color:var(--fundo)}
.painel.entra{animation:entra .7s var(--suave)}
@keyframes entra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.painel-pe{display:flex;justify-content:space-between;align-items:center;gap:12px 24px;flex-wrap:wrap;margin-top:clamp(18px,2.4vw,28px);color:var(--tinta-2);font-size:.92rem}
@media(max-width:640px){.filtro{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-inline:-16px;padding-inline:16px}.filtro::-webkit-scrollbar{display:none}.filtro [role=tab]{flex:none;padding:10px 15px;letter-spacing:.14em}}

/* avaliações (cartões do runtime.js) */
.nota-g{display:flex;align-items:baseline;gap:12px;text-decoration:none}.nota-g b{font-family:var(--serif);font-weight:400;font-size:2.6rem;line-height:1}.nota-g span{font-size:.88rem;color:var(--tinta-2)}
.carousel-track{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 28px) / 2.35);gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;list-style:none;margin:0;padding:0}.carousel-track::-webkit-scrollbar{display:none}
.carousel-track>li{scroll-snap-align:start;display:flex}
.review-card{display:flex;flex-direction:column;gap:18px;width:100%;padding:clamp(22px,2.6vw,34px);background:var(--papel);border:1px solid var(--linha)}
.review-card-top{display:flex;justify-content:space-between;align-items:center;gap:12px}.stars{color:#c99a3b;letter-spacing:2px;font-size:.9rem}
.review-tag{font-size:.66rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--tinta-2)}
.review-card blockquote{margin:0;font-family:var(--serif);font-size:clamp(1.18rem,1.7vw,1.42rem);line-height:1.42;flex:1}
.review-person{display:flex;align-items:center;gap:12px;font-size:.84rem}.review-person strong{display:block;font-weight:500}.review-person a{color:var(--tinta-2);text-underline-offset:3px;font-size:.78rem}
.review-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--areia);font-size:.7rem;letter-spacing:.08em;flex:none}
.carousel-footer{display:flex;justify-content:flex-end;margin-top:22px}.carousel-controls{display:flex;align-items:center;gap:14px}
.arrow-button{width:46px;height:46px;border:1px solid color-mix(in srgb,var(--tinta) 30%,transparent);display:grid;place-items:center;transition:background .3s,color .3s,opacity .3s}.arrow-button:hover:not(:disabled){background:var(--tinta);color:var(--fundo)}.arrow-button:disabled{opacity:.3;cursor:default}
.carousel-dots{display:flex;gap:8px}.carousel-dots button{width:22px;height:22px;display:grid;place-items:center}.carousel-dots button::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--tinta);opacity:.25;transition:opacity .3s,transform .3s}.carousel-dots button[aria-current="true"]::before{opacity:1;transform:scale(1.4)}
@media(max-width:860px){.carousel-track{grid-auto-columns:86%}}

/* quem fotografa */
.sobre{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(32px,7vw,112px);align-items:center}
.sobre-fotos{position:relative;padding:0 0 12% 0}
.sobre-fotos img{background:var(--areia)}
.sobre-fotos .f1{width:68%}.sobre-fotos--so{padding:0}.sobre-fotos--so .f1{width:min(100%,520px)}.sobre-fotos .f2{position:absolute;right:0;bottom:0;width:42%;border:10px solid var(--fundo)}
.sobre-txt p{color:var(--tinta-2)}
.fala{margin:28px 0 0;padding-left:22px;border-left:1px solid var(--acento)}
.fala p{font-family:var(--serif);font-size:clamp(1.4rem,2.2vw,1.8rem);line-height:1.3;color:var(--tinta);margin:0 0 10px}.fala cite{font-style:normal;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--tinta-2)}
.numeros{display:flex;gap:clamp(24px,4vw,56px);flex-wrap:wrap;margin:34px 0 0;padding:0;list-style:none}
.numeros b{display:block;font-family:var(--serif);font-weight:400;font-size:2.3rem;line-height:1}.numeros span{font-size:.82rem;color:var(--tinta-2)}
@media(max-width:860px){.sobre{grid-template-columns:1fr}}

/* contato */
.contato{background:var(--cafe);color:#f4f1ec;padding:clamp(72px,9vw,128px) 0}
.contato .olho{color:var(--claro-ac)}
.contato-in{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:clamp(32px,6vw,96px);align-items:end}
.contato h2{font-size:clamp(2.4rem,5vw,4.2rem);max-width:12ch}
.contato p{color:#cfcbc3;max-width:40ch}
.contato .botao{background:#f4f1ec;border-color:#f4f1ec;color:var(--cafe)}.contato .botao:hover{background:#fff;border-color:#fff}
.contato .botao--linha{background:transparent;color:#f4f1ec;border-color:#f4f1ec66}.contato .botao--linha:hover{background:#f4f1ec;color:var(--cafe)}
.onde{display:grid;gap:14px;font-size:.95rem;border-top:1px solid #ffffff26;padding-top:22px}
.onde div{display:flex;gap:14px;align-items:flex-start}.onde svg{width:20px;height:20px;flex:none;margin-top:3px;color:var(--claro-ac)}.onde a{text-underline-offset:4px}
@media(max-width:860px){.contato-in{grid-template-columns:1fr;align-items:start}}

/* rodapé e WhatsApp flutuante */
.rodape{background:var(--cafe);color:#cfcbc3;border-top:1px solid #ffffff1f;padding:34px 0 40px;font-size:.84rem}
.rodape-in{display:flex;justify-content:space-between;align-items:center;gap:16px 32px;flex-wrap:wrap}
.rodape .marca{color:#f4f1ec}.rodape .marca i{color:var(--claro-ac)}
.rodape nav{display:flex;gap:8px 22px;flex-wrap:wrap}.rodape nav a{text-decoration:none;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase}.rodape nav a:hover{color:#fff}
.rodape small{display:block;width:100%;font-size:.76rem;color:#9b978f}
.flutuante{position:fixed;right:18px;bottom:18px;z-index:55;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--acento-escuro);color:#fff;box-shadow:0 12px 30px #2d2c2a33;transition:transform .3s var(--suave),background .3s}.flutuante:hover{transform:translateY(-3px);background:var(--cafe)}.flutuante svg{width:26px;height:26px}
.modo-video .flutuante{display:none}

/* página do ensaio */
.e-capa{padding:clamp(28px,4vw,60px) 0 clamp(36px,5vw,64px)}
.e-grade{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:clamp(24px,3.4vw,44px) clamp(32px,6vw,96px);align-items:end}
.e-fotos{grid-column:1/-1;min-width:0}
.e-capa h1{font-size:min(clamp(2.9rem,9vw,7rem),calc((min(1240px,100vw - 64px) - 400px - 6vw) / var(--k,6)));line-height:.95;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
@media(max-width:860px){.e-capa h1{font-size:min(clamp(2.9rem,9vw,7rem),calc((100vw - 32px) / var(--k,6)))}}
.e-frase{font-family:var(--serif);font-size:clamp(1.5rem,2.6vw,2.1rem);line-height:1.2;margin:14px 0 0}
.e-lado p{color:var(--tinta-2);margin:0 0 14px}
.e-preco{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 4px;color:var(--tinta-2);font-size:.86rem}.e-preco b{font-family:var(--serif);font-weight:400;font-size:1.7rem;color:var(--tinta)}
.voltar{display:inline-flex;align-items:center;gap:8px;font-size:.7rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;color:var(--tinta-2);margin-bottom:22px}.voltar svg{width:15px;height:15px;transform:rotate(180deg)}.voltar:hover{color:var(--tinta)}
.e-sobre{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(32px,7vw,112px);align-items:start}
.e-sobre .grande{font-family:var(--serif);font-size:clamp(1.6rem,2.9vw,2.5rem);line-height:1.22;margin:0}
.fatos{list-style:none;margin:0;padding:0;border-top:1px solid var(--linha)}
.fatos li{display:grid;grid-template-columns:112px minmax(0,1fr);gap:16px;padding:16px 0;border-bottom:1px solid var(--linha)}.fatos b{font-size:.7rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--acento-escuro);padding-top:5px}.fatos span{color:var(--tinta-2)}
.depo{margin:clamp(40px,6vw,72px) 0 0;padding:clamp(26px,4vw,48px);background:var(--papel);border:1px solid var(--linha);display:grid;gap:18px}
.depo blockquote{margin:0;font-family:var(--serif);font-size:clamp(1.3rem,2.2vw,1.75rem);line-height:1.36;max-width:34em}
.depo figcaption{font-size:.84rem;color:var(--tinta-2)}.depo figcaption b{color:var(--tinta);font-weight:500}
.pacotes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:stretch}
.pac{display:flex;flex-direction:column;padding:clamp(24px,2.8vw,36px);background:var(--papel);border:1px solid var(--linha)}
.pac--destaque{background:var(--cafe);border-color:var(--cafe);color:#f4f1ec}
.pac h3{font-family:var(--sans);font-size:.72rem;font-weight:500;letter-spacing:.24em;text-transform:uppercase;color:var(--tinta-2)}.pac--destaque h3{color:var(--claro-ac)}
.pac .valor{font-family:var(--serif);font-size:clamp(2.4rem,3.6vw,3.1rem);line-height:1;margin:14px 0 0}
.pac ul{list-style:none;padding:0;margin:22px 0 26px;flex:1}.pac li{padding:11px 0;border-top:1px solid var(--linha);font-size:.95rem}.pac--destaque li{border-top-color:#ffffff26}
.pac .botao{width:100%}.pac:not(.pac--destaque) .botao{background:transparent;color:var(--tinta);border-color:color-mix(in srgb,var(--tinta) 38%,transparent)}.pac:not(.pac--destaque) .botao:hover{background:var(--tinta);color:var(--fundo)}
.pac--destaque .botao{background:#f4f1ec;border-color:#f4f1ec;color:var(--cafe)}.pac--destaque .botao:hover{background:#fff}
.outros{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:14px}
.outro{display:block;text-decoration:none}.outro span.q{display:block;aspect-ratio:var(--qa,.8);overflow:hidden;background:var(--areia)}
.outro img{width:100%;height:100%;object-fit:cover;transition:transform 1.1s var(--suave)}.outro:hover img{transform:scale(1.04)}
.outro b{display:flex;justify-content:space-between;align-items:center;gap:8px;font-family:var(--serif);font-weight:400;font-size:1.45rem;padding-top:12px}.outro b svg{width:18px;height:18px;opacity:.5;transition:transform .35s var(--suave)}.outro:hover b svg{transform:translateX(4px)}
.outro small{color:var(--tinta-2);font-size:.82rem}
.barra{position:fixed;left:0;right:0;bottom:0;z-index:56;display:none;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--fundo) 94%,transparent);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-top:1px solid var(--linha);transform:translateY(110%);transition:transform .4s var(--suave)}
.barra.ver{transform:none}.barra span{display:flex;flex-direction:column;line-height:1.25;font-size:.74rem;color:var(--tinta-2)}.barra span b{font-family:var(--serif);font-weight:400;font-size:1.15rem;color:var(--tinta)}
.barra .botao{min-height:46px;padding:10px 18px;font-size:.7rem;letter-spacing:.16em;flex:none}
.modo-video .barra{display:none!important}
@media(max-width:860px){.e-sobre{grid-template-columns:1fr;align-items:start}.e-grade{display:flex;flex-direction:column;align-items:stretch;gap:22px}.e-titulo{order:1}.e-fotos{order:2;width:100%}.e-lado{order:3}.pacotes{grid-template-columns:1fr}.pac--destaque{order:-1}.outros{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 10px}.outro b{font-size:1.2rem}
.tem-barra .barra{display:flex}.tem-barra{padding-bottom:70px}.tem-barra .flutuante{display:none}.tem-barra .rz-pilula{bottom:84px}.tem-barra .rz-folha{bottom:138px}.fatos li{grid-template-columns:1fr;gap:2px}}

/* tema escuro (fundo escuro no demo.json) */
.escuro .contato,.escuro .rodape{background:var(--areia)}.escuro .rodape{border-top-color:var(--linha)}
.escuro .pac--destaque{background:var(--areia);border:1px solid var(--acento)}
.escuro .review-card,.escuro .pac:not(.pac--destaque),.escuro .depo{background:color-mix(in srgb,var(--fundo) 70%,var(--areia))}
.escuro .site-header{background:color-mix(in srgb,var(--fundo) 90%,transparent)}
/* tela cheia */
.lb{position:fixed;inset:0;z-index:100;background:#141312f5;color:#f4f1ec;display:grid;grid-template-rows:auto minmax(0,1fr);opacity:0;visibility:hidden;transition:opacity .35s,visibility .35s}
.lb.aberto{opacity:1;visibility:visible}
.lb-topo{display:flex;align-items:center;gap:16px;padding:12px 16px 12px 22px;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase}.lb-cont{margin-left:auto;color:#bdb8af}
.lb-fechar{width:46px;height:46px;display:grid;place-items:center}.lb-fechar svg,.lb-seta svg{width:24px;height:24px}
.lb-trilho{display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none}.lb-trilho::-webkit-scrollbar{display:none}
.lb-slide{flex:0 0 100%;scroll-snap-align:center;scroll-snap-stop:always;display:grid;place-items:center;padding:0 12px 20px;min-height:0}
.lb-slide img{max-width:100%;max-height:calc(100svh - 96px);width:auto;height:auto;object-fit:contain}
.lb-seta{position:absolute;top:50%;width:54px;height:54px;margin-top:-10px;display:grid;place-items:center;border:1px solid #ffffff40;border-radius:50%;background:#14131299;transition:background .3s,opacity .3s}.lb-seta:hover{background:#f4f1ec;color:#141312}.lb-seta:disabled{opacity:0;pointer-events:none}
.lb-ant{left:20px}.lb-ant svg{transform:rotate(180deg)}.lb-prox{right:20px}
@media(max-width:860px){.lb-seta{display:none}.lb-slide{padding:0 0 16px}}
@media(max-width:860px){:root{--w:calc(100% - 32px)}body{font-size:1rem}.cab{align-items:flex-start;flex-direction:column}}
'''

JS = r'''
  // ---------- topo ----------
  const topo = $(".site-header");
  if (topo) { const f = () => topo.classList.toggle("rolou", scrollY > 10 && topo.getBoundingClientRect().top <= 0); addEventListener("scroll", f, { passive: true }); f(); }
  const calmo = matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- galerias: linhas justificadas, sem cortar nenhuma foto ----------
  // Cada foto fica na proporção dela (data-a = largura / altura) e todas as fotos de uma linha têm a mesma altura.
  // As quebras de linha saem de uma partição: entre as divisões possíveis, a que deixa as linhas mais perto da altura
  // pedida (--h). Assim a última linha também fecha na largura, sem foto órfã e sem foto gigante.
  const justificar = g => {
    const itens = $$(".g-item", g), W = g.clientWidth - .5;
    if (W < 50 || !itens.length) return;
    const cs = getComputedStyle(g), gap = parseFloat(cs.columnGap) || 0, h = parseFloat(cs.getPropertyValue("--h")) || 320;
    const a = itens.map(e => Number(e.dataset.a) || 1), n = a.length, soma = [0];
    a.forEach((x, i) => soma.push(soma[i] + x));
    const alt = (i, j) => (W - gap * (j - i - 1)) / (soma[j] - soma[i]); // altura da linha com as fotos i..j-1
    const custo = (i, j) => { const x = alt(i, j); return x > h * 1.6 ? 1e9 + x : (x - h) * (x - h); };
    const k0 = Math.max(1, Math.round((soma[n] * h + gap * (n - 1)) / W));
    let melhor = null;
    for (let k = Math.max(1, k0 - 1); k <= Math.min(n, k0 + 1); k++) {
      const c = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity)), de = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0));
      c[0][0] = 0;
      for (let r = 1; r <= k; r++) for (let j = r; j <= n; j++) for (let i = r - 1; i < j; i++) {
        const v = c[r - 1][i] + custo(i, j);
        if (v < c[r][j]) { c[r][j] = v; de[r][j] = i; }
      }
      if (!melhor || c[k][n] / k < melhor.c) {
        const linhas = []; for (let r = k, j = n; r > 0; r--) { linhas.unshift([de[r][j], j]); j = de[r][j]; }
        melhor = { c: c[k][n] / k, linhas };
      }
    }
    melhor.linhas.forEach(([i, j]) => {
      const x = Math.min(alt(i, j), h * 1.6);
      for (let m = i; m < j; m++) { itens[m].style.width = (Math.floor(x * a[m] * 100) / 100) + "px"; itens[m].style.height = (Math.round(x * 100) / 100) + "px"; }
    });
    g.classList.add("just");
  };
  const galerias = $$(".galeria");
  const arrumar = () => galerias.forEach(g => { if (g.offsetParent !== null) justificar(g); });
  arrumar();
  if ("ResizeObserver" in window) { const ro = new ResizeObserver(() => arrumar()); galerias.forEach(g => ro.observe(g)); } else addEventListener("resize", arrumar);

  // ---------- filtro por ensaio ----------
  const abas = $$("[role=tab]");
  const escolher = (aba, foco) => {
    abas.forEach(x => {
      const sim = x === aba, p = document.getElementById(x.getAttribute("aria-controls"));
      x.setAttribute("aria-selected", String(sim)); x.tabIndex = sim ? 0 : -1;
      if (p) { p.hidden = !sim; p.classList.toggle("entra", sim); if (sim) $$(".galeria", p).forEach(justificar); }
    });
    if (foco) aba.focus();
  };
  abas.forEach((x, i) => {
    x.addEventListener("click", () => escolher(x));
    x.addEventListener("keydown", e => {
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 }[e.key];
      if (k === undefined) return; e.preventDefault(); escolher(abas[(k + abas.length) % abas.length], true);
    });
  });

  // ---------- tira da capa: anda bem devagar no computador; para quando a pessoa mexe ----------
  const tira = $("[data-tira]");
  if (tira && !calmo.matches && matchMedia("(hover: hover) and (pointer: fine)").matches && !document.documentElement.classList.contains("modo-video")) {
    let x = 0, dir = 1, parada = false, ultimo = 0, visivel = true;
    const larga = matchMedia("(min-width: 861px)"); // na tela estreita a tira passa no dedo (com encaixe): não anda sozinha
    const passo = t => {
      const d = Math.min(64, t - ultimo); ultimo = t;
      const max = tira.scrollWidth - tira.clientWidth;
      if (!parada && visivel && larga.matches && max > 4) {
        if (Math.abs(tira.scrollLeft - x) > 2) x = tira.scrollLeft; // a pessoa rolou: continua de onde ela deixou
        x += dir * d * .018;
        if (x >= max) { x = max; dir = -1; } else if (x <= 0) { x = 0; dir = 1; }
        tira.scrollLeft = x;
      }
      requestAnimationFrame(passo);
    };
    ["pointerenter", "focusin", "pointerdown"].forEach(ev => tira.addEventListener(ev, () => { parada = true; }));
    ["pointerleave", "focusout"].forEach(ev => tira.addEventListener(ev, () => { parada = false; x = tira.scrollLeft; }));
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { visivel = es[0].isIntersecting; }).observe(tira);
    requestAnimationFrame(t => { ultimo = t; requestAnimationFrame(passo); });
  }

  // ---------- tela cheia: toque abre; no celular passa para o lado; setas e teclado no computador ----------
  const lb = $(".lb");
  if (lb) {
    const trilho = $(".lb-trilho", lb), cat = $(".lb-cat", lb), cont = $(".lb-cont", lb), ant = $(".lb-ant", lb), prox = $(".lb-prox", lb), fecharB = $(".lb-fechar", lb);
    let fotos = [], atual = 0, origem = null;
    const largura = () => trilho.clientWidth || innerWidth;
    const marcar = () => {
      atual = Math.max(0, Math.min(fotos.length - 1, Math.round(trilho.scrollLeft / largura())));
      cont.textContent = (atual + 1) + " / " + fotos.length; ant.disabled = atual === 0; prox.disabled = atual === fotos.length - 1;
    };
    const ir = (i, suave) => trilho.scrollTo({ left: i * largura(), behavior: suave && !calmo.matches ? "smooth" : "auto" });
    const abrir = botao => {
      const grupo = botao.closest("[data-grupo]") || document;
      fotos = $$(".g-item img", grupo); origem = botao;
      trilho.replaceChildren(...fotos.map((f, i) => {
        const s = document.createElement("div"); s.className = "lb-slide"; s.setAttribute("role", "group"); s.setAttribute("aria-label", (i + 1) + " de " + fotos.length);
        const im = document.createElement("img"); im.src = f.currentSrc || f.src; im.alt = f.alt; im.width = f.naturalWidth || f.width; im.height = f.naturalHeight || f.height; im.decoding = "async"; s.append(im); return s;
      }));
      cat.textContent = grupo.dataset ? grupo.dataset.grupo || "" : "";
      lb.classList.add("aberto"); lb.setAttribute("aria-hidden", "false"); document.documentElement.style.overflow = "hidden";
      ir(fotos.indexOf($("img", botao)), false); marcar(); fecharB.focus({ preventScroll: true });
    };
    const fechar = () => {
      lb.classList.remove("aberto"); lb.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = "";
      if (origem) origem.focus({ preventScroll: true });
    };
    document.addEventListener("click", e => { const b = e.target.closest && e.target.closest(".g-item"); if (b) abrir(b); });
    trilho.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });
    trilho.addEventListener("click", e => { if (e.target === trilho || e.target.classList.contains("lb-slide")) fechar(); });
    ant.addEventListener("click", () => ir(atual - 1, true)); prox.addEventListener("click", () => ir(atual + 1, true));
    fecharB.addEventListener("click", fechar);
    document.addEventListener("keydown", e => {
      if (!lb.classList.contains("aberto")) return;
      if (e.key === "Escape") fechar(); else if (e.key === "ArrowRight") ir(atual + 1, true); else if (e.key === "ArrowLeft") ir(atual - 1, true);
      else if (e.key === "Tab") { e.preventDefault(); const f = [fecharB, ant, prox].filter(b => !b.disabled && b.offsetParent !== null); f[(f.indexOf(document.activeElement) + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); }
    });
    addEventListener("resize", () => { if (lb.classList.contains("aberto")) ir(atual, false); });
  }

  // ---------- barra de reserva (celular, página do ensaio): aparece depois da abertura ----------
  const barra = $(".barra"), abertura = $(".e-capa");
  if (barra && abertura) { const f = () => barra.classList.toggle("ver", scrollY > abertura.offsetTop + abertura.offsetHeight * .6); addEventListener("scroll", f, { passive: true }); f(); }

  // No vídeo (?video=1) nada abre o WhatsApp durante a gravação.
  if (document.documentElement.classList.contains("modo-video")) document.addEventListener("click", e => { if (e.target.closest('a[href^="https://wa.me"]')) e.preventDefault(); }, true);
'''


def trecho_rz_css():
    c = GF.CSS
    a, b = c.index('/* camada da Renderiza'), c.index('/* aviso da Renderiza')
    m = re.search(r'@media\(max-width:860px\)\{\.rz-in\{.*?\n\n', c, re.S)
    p = re.search(r'@media\(max-width:520px\)\{[^\n]*\.rz-pilula\{[^}]*\}\}', c)
    if not m or not p: sys.exit('gerar-fotografia.py mudou: não achei o CSS da camada da Renderiza')
    return c[a:b] + m.group(0).strip() + '\n@media(max-width:520px){.rz-pilula{left:14px;bottom:20px}}\n'


def trecho_rz_js():
    j = GF.JS
    return j[j.index('// ---------- camada da Renderiza'):j.index('// ---------- aviso da Renderiza')]


def gerar(pasta, originais=None):
    pasta = pasta.rstrip('/')
    cfg = json.load(open(os.path.join(pasta, 'demo.json'), encoding='utf-8'))
    pf = cfg['portfolio']
    if pf.get('versao') != 4: sys.exit('este gerador é o da versão 4: o demo.json precisa de portfolio.versao = 4 (ver o cabeçalho)')
    slug = cfg['pasta']; base = f'/demo/{slug}'
    ensaios = pf['ensaios']; marca = cfg['marca']; q = GF.quem(cfg)
    estudio = cfg.get('quem_da', 'de ' + marca)            # "do Estúdio Olivares"
    r = cfg['renderiza']; d = r['valido_ate'].split('-')
    F = Fotos(originais, pasta)

    # o ícone da aba continua o da demo (vem da página que já está na pasta)
    favicon = ''
    antiga = os.path.join(pasta, 'index.html')
    if os.path.exists(antiga):
        m = re.search(r'<link rel="icon" type="image/png" href="(data:image/png;base64,[^"]+)">', open(antiga, encoding='utf-8').read())
        if m: favicon = f'<link rel="icon" type="image/png" href="{m.group(1)}">'

    for e in ensaios:
        if len(e['fotos']) < 6: sys.exit(f'{e["id"]}: menos de 6 fotos')
        e['_n'] = e.get('capa', 2)
        e['_fotos'] = [F.foto(x, ABERTURA if i < e['_n'] else GALERIA) for i, x in enumerate(e['fotos'])]
        e['_pe'] = next((x for x in e['fotos'][:8] if F.foto(x)['a'] <= 1.0), None)   # a primeira em pé (ou quadrada), para os quadros em pé
        e['_mini'] = F.foto(e['_pe'] or e['fotos'][0], MINI)
        e['_de'] = min(e['pacotes'], key=lambda p: int(re.sub(r'\D', '', p['preco']) or 0))['preco']
        e['_curto'] = e.get('curto', e['nome'])
    por_id = {e['id']: e for e in ensaios}

    def ref(t):  # "gestante:3" -> (ensaio, foto no tamanho de galeria)
        i, _, n = t.partition(':'); e = por_id[i]
        return e, F.foto(e['fotos'][int(n)], GALERIA)

    wa = lambda msg: f'https://wa.me/{cfg["whatsapp"]}?text={quote(msg)}'
    pedido = lambda e, pac=None: wa(f'Olá! Vi o portfólio {estudio} e quero {e["pedido"]}' + (f', pacote {pac}' if pac else '') + '. Quais datas vocês têm?')

    def link(pagina, ancora=''):
        destino = base if pagina == 'index' else f'{base}/{pagina}'
        return f'href="{destino}{ancora}" data-local="{pagina}.html{ancora}"'

    ATUAL = ' aria-current="page"'
    paginas = [('index', 'Vitrine')] + [(e['id'], e['_curto']) for e in ensaios]

    def troca(atual):
        return ('<nav class="rz-troca" aria-label="As páginas montadas para você">'
                + ''.join(f'<a {link(p)}{ATUAL if p == atual else ""}>{esc(t)}</a>' for p, t in paginas) + '</nav>')

    n_pag = len(paginas)
    preco = f'<b data-rz="preco">{esc(r["preco_pix"])} no Pix ou {esc(r["parcelado"])}</b>'
    botoes_rz = (f'<div class="rz-acoes"><a class="rz-botao" data-rz-garantir href="https://wa.me/{r["whatsapp"]}" target="_blank" rel="noopener noreferrer">{ICONE("whats")}Garantir o meu</a>'
                 f'<a class="rz-botao rz-botao--linha" data-rz-negociar href="https://wa.me/{r["whatsapp"]}" target="_blank" rel="noopener noreferrer">Negociar</a></div>')
    ex = ensaios[min(1, len(ensaios) - 1)]

    def faixa(atual):
        """A camada da Renderiza no topo (mesma estrutura de gerar-fotografia.faixa_rz, com o texto do portfólio)."""
        return f'''<aside class="rz-faixa" aria-label="Recado da Renderiza">
  <div class="rz-in">
    <p class="rz-ola" style="margin:0">{ICONE("brilho")}{esc(r.get("ola", "Ana"))}, a Renderiza montou o seu portfólio online:</p>
    {troca(atual)}
    <p class="rz-preco" style="margin:0"><span>{preco} <span class="rz-unico">pagamento único</span></span>
      <span class="rz-alerta" data-rz-prazo>{ICONE("relogio")}Promoção de 1 semana: até <b data-rz="validade-curta">{d[2]}/{d[1]}</b></span>
      <button class="rz-abrir" type="button" aria-expanded="false" aria-controls="rz-mais" aria-label="Ver a condição e os botões"><span class="rz-abrir-txt">Ver condição</span> {ICONE("seta")}</button></p>
  </div>
  <div class="rz-mais" id="rz-mais" hidden>
    <div class="rz-in">
      <p class="rz-prazo">O portfólio completo ({n_pag} páginas: a vitrine e uma página para cada ensaio), pronto, por {preco}. É um pagamento único: depois disso o portfólio é 100% seu, <b>sem mensalidade</b>.<span data-rz-prazo> Promoção de lançamento, válida por uma semana: até <b data-rz="validade">{d[2]}/{d[1]}/{d[0]}</b>.</span></p>
      {botoes_rz}
      <span class="rz-assina">Demonstração feita pela Renderiza · renderizaweb.com.br</span>
    </div>
  </div>
</aside>'''

    def pilula(atual):
        return f'''<button class="rz-pilula" type="button" aria-expanded="false" aria-controls="rz-folha">{ICONE("brilho")}<b>Renderiza</b> <span data-rz="curta">{esc(r["preco_pix"])} · até {d[2]}/{d[1]}</span></button>
<div class="rz-folha" id="rz-folha" role="dialog" aria-label="O que a Renderiza montou" hidden>
  <button class="rz-folha-fechar" type="button" aria-label="Fechar">{ICONE("fechar")}</button>
  <h2>{esc(r.get("ola", "Ana"))}, a Renderiza montou o seu portfólio online</h2>
  {troca(atual)}
  <p class="rz-dica">Perguntaram “quanto custa {esc(ex["pedido"])}?” no direct? Mande o link da página desse ensaio: a cliente vê as fotos e os pacotes e já chama você no WhatsApp.</p>
  <p>O portfólio completo ({n_pag} páginas) por {preco}. Pagamento único: o portfólio fica 100% seu, <b>sem mensalidade</b>.</p>
  <p data-rz-prazo>Promoção de lançamento, válida por uma semana: até <b data-rz="validade">{d[2]}/{d[1]}/{d[0]}</b>.</p>
  {botoes_rz}
</div>'''

    def cabecalho(nav):
        itens = ''.join(f'<a {h}>{esc(t)}</a>' for h, t in nav)
        cta = f'data-whatsapp href="#">{ICONE("whats")}Agendar'
        return f'''<header class="site-header">
  <div class="container topo-in">
    <a class="marca" {link("index")} style="--mk:{mk:.1f}" aria-label="{esc(marca)}, início"><b>{esc(q["nome"])}</b><i>{esc(q["script"])}</i></a>
    <nav class="nav" aria-label="Seções">{itens}</nav>
    <a class="botao botao--linha topo-cta" {cta}</a>
    <button class="menu-botao" type="button" data-menu-button aria-expanded="false" aria-controls="menu-mobile" aria-label="Abrir menu"><span></span></button>
    <nav class="menu-mobile" id="menu-mobile" aria-label="Menu" hidden>{itens}<a class="botao" {cta} pelo WhatsApp</a></nav>
  </div>
</header>'''

    ct = pf['contato']
    mk = len(q['nome']) * .85 + .5 + len(q['script']) * .38   # largura da marca, em em (encolhe no celular quando o nome é longo)

    def contato(titulo, texto, botao):
        return f'''<section class="contato" id="contato" aria-labelledby="contato-t">
  <div class="container contato-in">
    <div class="reveal">
      <p class="olho">Contato</p>
      <h2 id="contato-t">{esc(titulo)}</h2>
    </div>
    <div class="reveal" style="--i:1">
      <p>{esc(texto)}</p>
      <div class="acoes" style="margin:0 0 30px">{botao}<a class="botao botao--linha" data-instagram href="#" target="_blank" rel="noopener noreferrer">{ICONE("insta")}Instagram</a></div>
      <div class="onde">
        <div>{ICONE("pin")}<span>{esc(" · ".join(ct["endereco"]))}{"" if ct.get("rota") is False else '<br><a data-directions href="#" target="_blank" rel="noopener noreferrer">Como chegar</a>'}</span></div>
        <div>{ICONE("whats")}<a data-whatsapp href="#">{esc(ct["telefone"])}</a></div>
      </div>
    </div>
  </div>
</section>'''

    def rodape():
        links = ''.join(f'<a {link(p)}>{esc(t)}</a>' for p, t in paginas)
        return f'''<footer class="rodape">
  <div class="container rodape-in">
    <a class="marca" {link("index")} style="--mk:{mk:.1f}" aria-label="{esc(marca)}, início"><b>{esc(q["nome"])}</b><i>{esc(q["script"])}</i></a>
    <nav aria-label="Páginas">{links}</nav>
    <small>© <span data-year>2026</span> {esc(marca)} · {esc(" · ".join(ct["endereco"]))}</small>
  </div>
</footer>
<a class="flutuante" data-whatsapp href="#" aria-label="Conversar com {esc(q["a"])} no WhatsApp">{ICONE("whats")}</a>'''

    LIGHTBOX = f'''<div class="lb" role="dialog" aria-modal="true" aria-label="Fotos em tela cheia" aria-hidden="true">
  <div class="lb-topo"><span class="lb-cat"></span><span class="lb-cont"></span><button class="lb-fechar" type="button" aria-label="Fechar">{ICONE("fechar")}</button></div>
  <div class="lb-trilho" tabindex="-1"></div>
  <button class="lb-seta lb-ant" type="button" aria-label="Foto anterior">{ICONE("seta")}</button>
  <button class="lb-seta lb-prox" type="button" aria-label="Próxima foto">{ICONE("seta")}</button>
</div>'''

    def galeria(fotos, classe=''):
        itens = ''.join(f'<button class="g-item reveal" type="button" style="--a:{f["a"]:.4f};--i:{i % 4}" data-a="{f["a"]:.4f}" aria-label="{esc("Abrir em tela cheia: " + f["alt"])}">{img(f, prioridade=bool(classe) and i == 0)}</button>'
                        for i, f in enumerate(fotos))
        return f'<div class="galeria{" " + classe if classe else ""}">{itens}</div>'

    nota = str(cfg['google_nota']); total = cfg['google_total']
    google = (f'<b>{esc(nota)}</b> no Google · {esc(total)} avaliações' if nota.startswith('5') else f'{esc(total)} avaliações no Google')
    selo = f'<p class="selo">{ICONE("brilho")}Pacotes e valores de exemplo: você coloca os seus</p>'

    # ---------- DEMO_CLIENT (o mesmo do runtime.js das outras demos) ----------
    g = cfg['google']; lat, lng = g['coords'].split(',')
    aval = (f'https://www.google.com/maps/place/{quote(cfg["google_nome"]).replace("%20", "+")}/@{g["coords"]},17z/data='
            f'!4m8!3m7!1s{g["fid"]}!8m2!3d{lat}!4d{lng}!9m1!1b1!16s{quote(g["gid"], safe="")}?hl=pt-BR')
    lugar = ', '.join(x for x in (cfg.get('google_nome'), cfg['endereco_maps']) if x)
    cliente = {
        'brand': cfg.get('marca_completa', marca),
        'whatsapp': wa(cfg['mensagem']), 'phone': cfg.get('fone_link', '+' + cfg['whatsapp']),
        'instagram': f'https://www.instagram.com/{cfg["instagram"]}/',
        'maps': f'https://www.google.com/maps?cid={int(g["fid"].split(":")[1], 16)}',
        'directions': 'https://www.google.com/maps/dir/?api=1&destination=' + quote(lugar),
        'reviewsUrl': aval, 'writeReviewUrl': aval, 'rating': nota, 'reviewTotal': str(total), 'hours': None,
        'reviews': [{'name': a['nome'], 'initials': GF.G.iniciais(a['nome']), 'tag': a['tag'], 'quote': a['texto']} for a in pf['avaliacoes']],
        'verifiedOn': cfg['verificado'],
    }
    runtime = open(os.path.join(AQUI, 'runtime.js'), encoding='utf-8').read()
    runtime = re.sub(r'^\s*//[^\n]*\bsite\b[^\n]*\n', '', runtime, flags=re.M | re.I)   # nem em comentário a página fala em "site"
    c = cfg['cores']; fo = (cfg.get('estilo') or {}).get('fontes') or {}
    tema = ' escuro' if GF.G.lum(c['fundo']) < .4 else ''
    pilha = lambda k, resto: (f'"{fo[k][0]}",' if k in fo else '') + resto
    css = GF.T(CSS, fundo=c['fundo'], papel=c['papel'], areia=c['areia'], linha=c.get('linha', '#e6dbcf'), tinta=c['tinta'], tinta2=c['tinta2'],
               rosa=c['rosa'], acento=c['acento'], acento_escuro=c['acento_escuro'], cafe=c['cafe'], rz=trecho_rz_css(), destaque=c['acento'] if tema else c['acento_escuro'],
               serif=pilha('serif', 'Georgia,serif'), sans=pilha('sans', 'system-ui,-apple-system,"Segoe UI",sans-serif'), script=pilha('script', '"Brush Script MT",cursive'))
    fontes = GF.fontes_link(fo) if fo else GF.FONTES
    fim = ('<script>\nwindow.DEMO_CLIENT = ' + json.dumps(cliente, ensure_ascii=False, indent=1) + ';\n</script>\n<script>\n' + runtime + '\n</script>\n' + GF.rz_js(cfg)
           + '\n<script>\n(() => {\n  "use strict";\n  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));\n\n  '
           + trecho_rz_js() + JS + '})();\n</script>\n'
           + '<script>if(location.protocol==="file:")document.querySelectorAll("a[data-local]").forEach(function(a){a.setAttribute("href",a.getAttribute("data-local"))})</script>')

    feitas = []

    def montar(nome, titulo, descricao, classe, nav, corpo, extra=''):
        doc = f'''<!doctype html>
<!-- Portfólio online de {esc(marca)} (demo da Renderiza): gerar-portfolio.py, versão 4. Pacotes e valores de exemplo. Fotos: os originais dela, tratados pelo gerador. -->
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="{esc(descricao)}">
  <meta name="theme-color" content="{c["fundo"]}">
  <meta name="robots" content="noindex,nofollow">
  <title>{esc(titulo)}</title>
  {favicon}
  <script>document.documentElement.classList.add("js");if(/[?&]video=1(&|$)/.test(location.search))document.documentElement.classList.add("modo-video");</script>
  {fontes}
  <style>{css}</style>
</head>
<body class="{classe}">
{GF.SIMBOLOS}
{faixa(nome)}
{cabecalho(nav)}
<main id="inicio">
{corpo}
</main>
{rodape()}
{extra}
{LIGHTBOX}
{pilula(nome)}
{fim}
</body>
</html>
'''
        assert '{{' not in doc
        open(os.path.join(pasta, nome + '.html'), 'w', encoding='utf-8').write(doc)
        feitas.append((nome + '.html', len(doc)))

    # ---------- a vitrine ----------
    tira = []
    for i, t in enumerate(pf['tira']):
        e, f = ref(t)
        tira.append(f'<a class="tira-item" {link(e["id"])} style="--a:{f["a"]:.4f}"><span class="tira-foto">{img(f, prioridade=i < 2)}</span>'
                    f'<span class="rot">{esc(e["_curto"])}{ICONE("seta")}</span></a>')
    lista = ''.join(f'<li class="reveal"><a class="ens" {link(e["id"])}>{img(e["_mini"], classe="mini" if e["_mini"]["a"] <= 1.05 else "mini mini--deitada")}<b>{esc(e["nome"])}</b><span class="frase">{esc(e["frase"])}</span>'
                    f'<span class="preco"><small>a partir de</small>{esc(e["_de"])}</span>{ICONE("seta")}</a></li>' for e in ensaios)
    abas = ''.join(f'<button type="button" role="tab" id="aba-{e["id"]}" aria-controls="painel-{e["id"]}" aria-selected="{"true" if i == 0 else "false"}"{"" if i == 0 else " tabindex=" + chr(34) + "-1" + chr(34)}>{esc(e["_curto"])}</button>'
                   for i, e in enumerate(ensaios))
    paineis = ''.join(f'''<div class="painel" id="painel-{e["id"]}" role="tabpanel" aria-labelledby="aba-{e["id"]}" data-grupo="{esc(e["nome"])}"{"" if i == 0 else " hidden"}>
      {galeria([F.foto(e["fotos"][k], GALERIA) for k in e["vitrine"]])}
      <p class="painel-pe"><span>{esc(e["frase"])} A partir de {esc(e["_de"])}.</span><a class="link" {link(e["id"])}>Ver {esc(e["pedido"])} e os valores {ICONE("seta")}</a></p>
    </div>''' for i, e in enumerate(ensaios))
    sb = pf['sobre']; sf = [F.foto(x, GALERIA) for x in sb['fotos']]
    numeros = ''.join(f'<li><b>{esc(a)}</b><span>{esc(b)}</span></li>' for a, b in sb.get('numeros', []))
    corpo = f'''<section class="capa" aria-label="Capa">
  <div class="capa-titulo">
    <p class="olho">{esc(pf["olho"])}</p>
    <h1>{esc(pf["titulo"])}</h1>
  </div>
  <div class="capa-lado">
    <p>{esc(pf["linha"])}</p>
    <a class="nota" data-reviews-link href="#" target="_blank" rel="noopener noreferrer"><span class="estrelas" aria-hidden="true">★★★★★</span><span>{google}</span></a>
    <div class="acoes"><a class="botao" href="#ensaios">Ensaios e valores</a><a class="link" data-whatsapp href="#">{ICONE("whats")}Chamar no WhatsApp</a></div>
  </div>
  <div class="hero-photo tira" data-tira>
    <div class="tira-trilho">{"".join(tira)}</div>
  </div>
</section>
<section class="secao" id="ensaios" aria-labelledby="ensaios-t">
  <div class="container">
    <div class="cab reveal"><div><p class="olho">Ensaios e valores</p><h2 id="ensaios-t">Escolha o seu ensaio.</h2></div>{selo}</div>
    <ol class="lista">{lista}</ol>
  </div>
</section>
<section class="secao secao--areia" id="portfolio" aria-labelledby="portfolio-t">
  <div class="container">
    <div class="cab reveal"><div><p class="olho">Portfólio</p><h2 id="portfolio-t">Um pouco de cada ensaio.</h2></div><p>Escolha o tipo de ensaio. Toque numa foto para ver em tela cheia.</p></div>
    <div class="filtro" role="tablist" aria-label="Filtrar por tipo de ensaio">{abas}</div>
    {paineis}
  </div>
</section>
<section class="secao" id="depoimentos" aria-labelledby="depoimentos-t">
  <div class="container">
    <div class="cab reveal"><div><p class="olho">Avaliações no Google</p><h2 id="depoimentos-t">{esc(pf.get("depo_titulo") or "Quem já fotografou com " + q["a"] + ".")}</h2></div>
      <a class="nota-g" data-reviews-link href="#" target="_blank" rel="noopener noreferrer" aria-label="Ver as avaliações no Google">{f"<b>{esc(nota)}</b>" if nota.startswith("5") else ""}<span><span class="estrelas" aria-hidden="true">★★★★★</span><br>{esc(total)} avaliações no Google</span></a></div>
    <div class="carousel reveal" data-carousel role="region" aria-roledescription="carrossel" aria-label="Avaliações do Google">
      <ul class="carousel-track" id="reviews-track" data-reviews tabindex="0" aria-label="Avaliações; use as setas para navegar"></ul>
      <div class="carousel-footer"><div class="carousel-controls"><button class="arrow-button" type="button" data-prev aria-controls="reviews-track" aria-label="Avaliações anteriores">←</button><div class="carousel-dots" data-dots></div><button class="arrow-button" type="button" data-next aria-controls="reviews-track" aria-label="Próximas avaliações">→</button><span class="sr-only" data-status aria-live="polite"></span></div></div>
    </div>
  </div>
</section>
<section class="secao secao--areia" id="sobre" aria-labelledby="sobre-t">
  <div class="container sobre">
    <div class="sobre-fotos{"" if len(sf) > 1 else " sobre-fotos--so"} reveal">{img(sf[0], classe="f1")}{img(sf[1], classe="f2") if len(sf) > 1 else ""}</div>
    <div class="sobre-txt reveal" style="--i:1">
      <p class="olho">{esc(sb["olho"])}</p>
      <h2 id="sobre-t">{esc(sb["titulo"])}</h2>
      <div style="margin-top:22px">{"".join(f"<p>{esc(x)}</p>" for x in sb["p"])}</div>
      <figure class="fala"><p>“{esc(sb["citacao"])}”</p><cite>{esc(sb["citacao_quem"])}</cite></figure>
      <ul class="numeros">{numeros}</ul>
    </div>
  </div>
</section>
{contato(ct["titulo"], ct["p"], f'<a class="botao" data-whatsapp href="#">{ICONE("whats")}Chamar no WhatsApp</a>')}'''
    nav = [('href="#ensaios"', 'Ensaios'), ('href="#portfolio"', 'Portfólio'), ('href="#depoimentos"', 'Depoimentos'), ('href="#sobre"', 'Sobre'), ('href="#contato"', 'Contato')]
    montar('index', f'{marca} | Portfólio, ensaios e valores', f'{pf["titulo"]} {pf["linha"]} Fotos, pacotes e valores de cada ensaio.', 'pf' + tema, nav, corpo)

    # ---------- uma página por ensaio ----------
    for e in ensaios:
        fotos = e['_fotos']; n = e['_n']
        fatos = [('Como é', e['texto'])] + ([('Quando', e['quando'])] if e.get('quando') else []) + [('Onde', e.get('onde') or pf.get('onde') or f'O estúdio fica em {ct["endereco"][-1].replace(" · ", ", ")}. Datas pelo WhatsApp.')]
        grande = (f'<figure class="fala" style="margin:0"><p>“{esc(e["citacao"])}”</p><cite>{esc(e["citacao_quem"])}</cite></figure>' if e.get('citacao')
                  else f'<p class="grande">{esc(e["texto"])}</p>')
        if e.get('citacao'): pass
        else: fatos = fatos[1:]
        dp = e.get('depo')
        depo = (f'<figure class="depo reveal"><blockquote>“{esc(dp["texto"])}”</blockquote><figcaption><span class="estrelas" aria-hidden="true">★★★★★</span> '
                f'<b>{esc(dp["nome"])}</b>, no <a data-reviews-link href="#" target="_blank" rel="noopener noreferrer">Google</a></figcaption></figure>') if dp else ''
        pacotes = ''.join(f'''<article class="pac{" pac--destaque" if p.get("destaque") else ""} reveal" style="--i:{i}">
        <h3>{esc(p["nome"])}</h3><p class="valor">{esc(p["preco"])}</p>
        <ul>{"".join(f"<li>{esc(x)}</li>" for x in p["itens"])}</ul>
        <a class="botao" href="{esc(pedido(e, p["nome"]))}" target="_blank" rel="noopener noreferrer" aria-label="{esc("Quero o pacote " + p["nome"] + ": pedir pelo WhatsApp")}">{ICONE("whats")}Quero este</a></article>''' for i, p in enumerate(e['pacotes']))
        resto = [o for o in ensaios if o is not e]
        # quadros dos outros ensaios: em pé (4:5) quando todos têm foto em pé; senão deitados (3:2), com a foto deitada de cada um
        em_pe = all(o['_pe'] for o in resto); alvo = .8 if em_pe else 1.5
        def capa_de(o):
            if em_pe: return o['_pe']
            return min(o['fotos'][:8], key=lambda x: abs(math.log(F.foto(x)['a'] / alvo)))
        outros = ''.join(f'<a class="outro reveal" style="--i:{i}" {link(o["id"])}><span class="q">{img(F.foto(capa_de(o), 900))}</span><b>{esc(o["nome"])}{ICONE("seta")}</b><small>a partir de {esc(o["_de"])}</small></a>'
                         for i, o in enumerate(resto))
        quero = f'<a class="botao" href="{esc(pedido(e))}" target="_blank" rel="noopener noreferrer">{ICONE("whats")}Quero o meu ensaio</a>'
        corpo = f'''<div data-grupo="{esc(e["nome"])}">
<section class="e-capa" aria-label="Capa">
  <div class="container">
    <a class="voltar" {link("index", "#ensaios")}>{ICONE("seta")}Todos os ensaios</a>
    <div class="e-grade">
      <div class="e-titulo">
        <p class="olho">{esc(e["chamada"])} · {esc(pf["local"])}</p>
        <h1 style="--k:{len(e["nome"]) * .78:.2f}">{esc(e["nome"])}</h1>
        <p class="e-frase">{esc(e["frase"])}</p>
      </div>
      <div class="e-lado">
        <p class="e-preco">a partir de <b>{esc(e["_de"])}</b><span class="selo" style="padding:3px 10px">valor de exemplo</span></p>
        <a class="nota" data-reviews-link href="#" target="_blank" rel="noopener noreferrer"><span class="estrelas" aria-hidden="true">★★★★★</span><span>{google}</span></a>
        <div class="acoes">{quero}<a class="link" href="#valores">Ver os pacotes {ICONE("seta")}</a></div>
      </div>
      <div class="e-fotos">{galeria(fotos[:n], "galeria--abre")}</div>
    </div>
  </div>
</section>
<section class="secao" id="fotos" aria-labelledby="fotos-t" style="padding-top:0">
  <div class="container">
    <h2 class="sr-only" id="fotos-t">As fotos do ensaio</h2>
    {galeria(fotos[n:])}
  </div>
</section>
</div>
<section class="secao secao--areia" id="sobre" aria-labelledby="sobre-t">
  <div class="container">
    <div class="e-sobre">
      <div class="reveal"><p class="olho">O ensaio</p><h2 class="sr-only" id="sobre-t">Sobre {esc(e["pedido"])}</h2>{grande}</div>
      <ul class="fatos reveal" style="--i:1">{"".join(f"<li><b>{esc(a)}</b><span>{esc(b)}</span></li>" for a, b in fatos)}</ul>
    </div>
    {depo}
  </div>
</section>
<section class="secao" id="valores" aria-labelledby="valores-t">
  <div class="container">
    <div class="cab reveal"><div><p class="olho">Valores</p><h2 id="valores-t">Pacotes e valores.</h2></div>{selo}</div>
    <div class="pacotes">{pacotes}</div>
  </div>
</section>
<section class="secao secao--areia" id="outros" aria-labelledby="outros-t">
  <div class="container">
    <div class="cab reveal"><div><p class="olho">Portfólio</p><h2 id="outros-t">Outros ensaios.</h2></div></div>
    <div class="outros" style="--n:{max(len(resto), 3)};--qa:{alvo}">{outros}</div>
  </div>
</section>
{contato("Vamos marcar o seu?", "A mensagem já vai com o ensaio escolhido. É só mandar.", quero)}'''
        barra = (f'<div class="barra" role="region" aria-label="Reservar"><span>{esc(e["nome"])}<b>a partir de {esc(e["_de"])}</b></span>'
                 f'<a class="botao" href="{esc(pedido(e))}" target="_blank" rel="noopener noreferrer">{ICONE("whats")}Quero o meu</a></div>')
        nav = [(link('index', '#ensaios'), 'Ensaios'), ('href="#fotos"', 'Fotos'), ('href="#sobre"', 'O ensaio'), ('href="#valores"', 'Valores'), ('href="#contato"', 'Contato')]
        montar(e['id'], f'{e["chamada"]} | {marca}', f'{e["chamada"]} {estudio}, em {pf["local"]}: {e["frase"]} Fotos, pacotes e valores.', 'pf tem-barra' + tema, nav, corpo, barra)

    # páginas de versões antigas que sobraram na pasta saem do ar
    nomes = {n for n, _ in feitas}
    for f in os.listdir(pasta):
        if f.endswith('.html') and f not in nomes: os.remove(os.path.join(pasta, f)); print('removida:', f)
    for n, t in feitas: print(f'{pasta}/{n}: {t / 1e6:.1f} MB')
    for a in F.avisos: print('  AVISO', a)
    print(f'{len(F.feitas)} imagens tratadas, {F.bytes / 1e6:.1f} MB de fotos (somando as páginas)')


if __name__ == '__main__':
    if len(sys.argv) not in (2, 3): sys.exit('uso: gerar-portfolio.py demos/<pasta> [<pasta dos originais>]')
    gerar(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
