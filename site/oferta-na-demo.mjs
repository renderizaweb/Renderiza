// A oferta dentro da demo (site/ofertas.mjs): uma faixa fina no topo, que leva ao card, e o card de valor no fim do
// conteúdo, antes do rodapé. Usa as cores da própria demo (--green, --mustard, --cream, --display), com reserva para
// demo de outro modelo. O contador (exemplos/visitas.js) vê: a faixa tocada (clique "faixa"), o card na tela
// (viu_precos) e o tempo nele (parte "Valor do site"). Um script pequeno conta os dias que faltam pelo relógio de
// Brasília e tira a faixa e o card depois do prazo.

const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const diaMes = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7);

const CSS = `
.rz-faixa{display:block;background:var(--mustard,#d8b47a);color:var(--green,#1f2a24);text-align:center;text-decoration:none;font-weight:600;font-size:.875rem;line-height:1.35;padding:10px 16px;position:relative;z-index:31}
.rz-faixa b{font-weight:800}
.rz-faixa span{text-decoration:underline;text-underline-offset:3px;white-space:nowrap;font-weight:700}
.rz-oferta{padding:72px 0;background:var(--cream,#f2efe8);scroll-margin-top:80px}
.rz-oferta-caixa{width:var(--container,min(1180px,calc(100% - 40px)));margin-inline:auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:36px;align-items:center;background:var(--green,#1f2a24);color:#fff;border-radius:28px;padding:44px 48px;box-shadow:0 24px 60px rgba(0,0,0,.18)}
.rz-oferta-rotulo{display:inline-block;font-size:.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--mustard,#d8b47a);margin:0 0 12px}
.rz-oferta h2{font-family:var(--display,Georgia,serif);font-size:clamp(2rem,3.4vw,2.8rem);line-height:1.08;margin:0 0 20px;color:#fff;letter-spacing:-.02em}
.rz-oferta-preco{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0}
.rz-oferta-preco strong{font-family:var(--display,Georgia,serif);font-size:clamp(3rem,6vw,4.4rem);line-height:1;color:var(--mustard,#d8b47a);letter-spacing:-.03em}
.rz-oferta-preco span{font-size:1rem;color:rgba(255,255,255,.85)}
.rz-oferta-parcela{margin:6px 0 18px;color:rgba(255,255,255,.85)}
.rz-oferta-prazo{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:7px 14px;font-size:.875rem;margin:0}
.rz-oferta-prazo b{color:var(--mustard,#d8b47a)}
.rz-oferta-depois{margin:14px 0 0;font-size:.9rem;color:rgba(255,255,255,.75)}
.rz-oferta ul{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:10px}
.rz-oferta li{display:flex;gap:10px;align-items:flex-start;line-height:1.45}
.rz-oferta li::before{content:"";flex:none;width:20px;height:20px;margin-top:1px;border-radius:50%;background:var(--mustard,#d8b47a) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5 9-10'/%3E%3C/svg%3E") center/12px no-repeat}
.rz-oferta-nota{font-size:.85rem;color:rgba(255,255,255,.7);margin:0 0 16px}
.rz-oferta-fecho{margin:0;padding-top:16px;border-top:1px solid rgba(255,255,255,.18);font-weight:600}
@media(max-width:860px){
  .rz-oferta{padding:48px 0}
  .rz-oferta-caixa{grid-template-columns:1fr;gap:26px;padding:30px 22px;border-radius:22px;width:min(100% - 28px,640px)}
  .rz-faixa{font-size:.8125rem;padding:9px 12px}
}`;

/** A faixa e o card prontos (HTML), para a oferta e a pasta da demo. */
export function blocosDaOferta(oferta) {
  const ate = diaMes(oferta.ate);
  const faixa = `<a class="rz-faixa" href="#valor-do-site" data-rz-oferta data-rz-alvo="faixa">${esc(oferta.titulo)} por <b>${esc(oferta.valor)}</b> até ${ate} · <span>ver condições</span></a>`;
  const card = `<section class="rz-oferta" id="valor-do-site" aria-label="Valor do site" data-rz-oferta data-rz-precos>
  <div class="rz-oferta-caixa">
    <div>
      <p class="rz-oferta-rotulo">${esc(oferta.rotulo)}</p>
      <h2>${esc(oferta.titulo)}</h2>
      <p class="rz-oferta-preco"><strong>${esc(oferta.valor)}</strong><span>${esc(oferta.forma)}</span></p>
      <p class="rz-oferta-parcela">${esc(oferta.parcela)}</p>
      <p class="rz-oferta-prazo">Até ${ate} · <b data-rz-faltam></b></p>
      <p class="rz-oferta-depois">Depois de ${ate}, ${esc(oferta.depois)}. Esta demonstração também sai do ar no dia ${ate.slice(0, 2)}.</p>
    </div>
    <div>
      <ul>${oferta.inclui.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
      <p class="rz-oferta-nota">${esc(oferta.nota)}</p>
      <p class="rz-oferta-fecho">${esc(oferta.fecho)}</p>
    </div>
  </div>
</section>`;
  // Dias que faltam pelo relógio de Brasília; depois do prazo, a faixa e o card saem.
  const script = `<script>(function(){try{var ate=${JSON.stringify(oferta.ate)};var hoje=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());var d=Math.round((Date.parse(ate+"T12:00:00Z")-Date.parse(hoje+"T12:00:00Z"))/864e5);if(d<0){document.querySelectorAll("[data-rz-oferta]").forEach(function(e){e.remove()});return}var t=d===0?"último dia: hoje":d===1?"falta 1 dia":"faltam "+d+" dias";document.querySelectorAll("[data-rz-faltam]").forEach(function(e){e.textContent=t})}catch(e){}})();</script>`;
  return { css: `<style id="rz-oferta-estilo">${CSS}</style>`, faixa, card: card + script };
}

/** Põe a oferta na demo: o estilo no <head>, a faixa logo depois do <body> e o card no fim do <main>. */
export function comOferta(html, oferta) {
  if (!oferta || /id="rz-oferta-estilo"/.test(html) || !/<\/head>/i.test(html) || !/<body[^>]*>/i.test(html)) return html;
  const { css, faixa, card } = blocosDaOferta(oferta);
  let saida = html.replace(/<\/head>/i, css + "</head>").replace(/<body([^>]*)>/i, m => m + faixa);
  if (/<\/main>/i.test(saida)) saida = saida.replace(/<\/main>(?![\s\S]*<\/main>)/i, card + "</main>");
  else if (/<footer/i.test(saida)) saida = saida.replace(/<footer/i, card + "<footer");
  else saida = saida.replace(/<\/body>/i, card + "</body>");
  return saida;
}
