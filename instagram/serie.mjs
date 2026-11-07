// O padrão da série "O celular da fotógrafa" (instagram/SERIE.md): o selo da parte no topo da abertura, o cartão do
// resumo da parte anterior e a cena pós-créditos que anuncia a próxima. Cada parte chama:
//   const quadroSerie = serie(R, { parte: 2, abertura: "resumo",            // até o fim desta frase o selo fica no topo
//     resumo: { id: "resumo", titulo: "Só quatro me abriram", arte: "<svg…>" },   // só da parte 2 em diante
//     proxima: { arte: "<svg…>", anima: (t, t0, W) => {…} } });              // o que aparece no pós-créditos
//   window.quadro = t => { …cenas…; quadroSerie(t); R.comum(t); };
// A narração tem uma frase de id "pos" (cena "pos") depois do convite: "Na parte N+1: …".
import { $, fase, pos, entra, em, vis, ic, IC } from "./historia.mjs";

export const NOME_SERIE = "O celular da fotógrafa";
IC.seguir = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>';

const CSS = `
#sr-selo{position:absolute;left:50%;top:118px;z-index:46;translate:-50% 0;display:flex;align-items:center;gap:14px;padding:9px 22px 9px 9px;border-radius:999px;background:rgba(10,14,16,.72);color:#f1eee9;font:700 27px/1 "Geist",sans-serif;letter-spacing:-.01em;white-space:nowrap;opacity:0;box-shadow:0 10px 30px rgba(0,0,0,.35)}
#sr-selo b{padding:8px 16px;border-radius:999px;background:#b25134;color:#fff;font-weight:800;font-size:24px;letter-spacing:.08em}
#sr-resumo{position:absolute;left:50%;top:1380px;z-index:42;width:620px;margin-left:-310px;display:flex;align-items:center;gap:22px;padding:18px;border-radius:30px;background:rgba(10,14,16,.86);color:#f1eee9;opacity:0;box-shadow:0 30px 70px rgba(0,0,0,.5)}
#sr-resumo .mini{width:150px;height:200px;border-radius:16px;overflow:hidden;flex:none;background:#0d1113}
#sr-resumo .mini svg{width:100%;height:100%;display:block}
#sr-resumo b{display:inline-block;padding:6px 14px;border-radius:999px;background:#b25134;color:#fff;font:800 20px/1 "Geist",sans-serif;letter-spacing:.08em}
#sr-resumo p{margin:14px 0 0;font:800 40px/1.02 "Geist",sans-serif;letter-spacing:-.04em;text-wrap:balance}
#sr-pos{position:absolute;inset:0;z-index:43;background:radial-gradient(70% 50% at 50% 55%,#1d2528 0%,#0a0d0f 75%);opacity:0;display:none}
#sr-pos>svg{position:absolute;left:0;top:0;width:1080px;height:1920px}
#sr-parte{position:absolute;left:50%;top:560px;translate:-50% 0;padding:12px 30px;border-radius:30px;background:#b25134;color:#fff;font:800 40px/1 "Geist",sans-serif;letter-spacing:.08em;opacity:0;white-space:nowrap}
#sr-siga{position:absolute;left:50%;top:1650px;translate:-50% 0;display:inline-flex;align-items:center;gap:20px;height:128px;padding:0 54px;border-radius:64px;background:#f1eee9;color:#1e2528;font:800 54px/1 "Geist",sans-serif;letter-spacing:-.025em;white-space:nowrap;opacity:0}
#sr-siga svg{width:54px;height:54px;flex:none}`;

export function serie(R, { parte, abertura, resumo = null, proxima }) {
  const { F, DUR } = R, palco = $("#palco");
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  palco.insertAdjacentHTML("beforeend", `
    <div id="sr-selo"><b>PARTE ${parte}</b><span>${NOME_SERIE}</span></div>
    ${resumo ? `<div id="sr-resumo"><div class="mini">${resumo.arte}</div><div><b>PARTE ${parte - 1}</b><p>${resumo.titulo}</p></div></div>` : ""}
    <div id="sr-pos"><svg viewBox="0 0 1080 1920">${proxima.arte}</svg><div id="sr-parte">PARTE ${parte + 1}</div>
      <div id="sr-siga">${ic("seguir", 'style="stroke-width:2.3"')}Siga para ver a parte ${parte + 1}</div></div>`);
  const fimAbertura = F[abertura].fim + 0.35;
  return function quadro(t) {
    // o selo da parte: fica no topo durante o gancho e o resumo
    const sl = entra(t, 0.05, 0.35);
    pos($("#sr-selo"), { y: sl.y * 0.4, s: sl.s, o: t < fimAbertura ? sl.o * (1 - fase(t, fimAbertura - 0.3, fimAbertura)) : 0 });
    // o cartão da parte anterior, enquanto o resumo é falado
    if (resumo) {
      const f = F[resumo.id], a = entra(t, f.ini, 0.35);
      pos($("#sr-resumo"), { y: a.y, s: a.s, r: -2, o: em(t, f.ini - 0.05, f.fim + 0.3) ? a.o * (1 - fase(t, f.fim, f.fim + 0.3)) : 0 });
    }
    // o pós-créditos: a próxima parte e o convite para seguir
    const el = $("#sr-pos"), p = F.pos, on = t >= p.ini - 0.35;
    vis(el, on); if (!on) return;
    el.style.opacity = fase(t, p.ini - 0.35, p.ini).toFixed(3);
    const e = entra(t, p.ini + 0.1, 0.35); pos($("#sr-parte"), { y: e.y, s: e.s, o: e.o });
    proxima.anima(t, p);
    const sg = entra(t, p.fim + 0.05, 0.35);
    pos($("#sr-siga"), { y: sg.y, s: sg.s * (1 + 0.03 * Math.sin(t * 4) * fase(t, p.fim + 0.4, DUR)), o: sg.o });
  };
}
