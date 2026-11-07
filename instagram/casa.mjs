// Peças de "Eu ainda não nasci" (SERIE.md) que aparecem em mais de um episódio: o Louro, papagaio da mãe da Helena;
// o Rafa, pai do bebê, com o bebê-conforto; a Dona Lurdes, mãe da Helena; a casa dela, por fora (o endereço velho do
// mapa) e por dentro (a sala onde o estúdio começou em 2019); o cartão de capítulo de cada ponto de vista; e os balões
// das falas dos personagens (frases com "quem" na narração, que vão em soBalao para não sair também na legenda).
import { $, fase, sai, lerp, pos, attr, entra, pulso, dePe, boca, pernas, fecha } from "./historia.mjs";

const CSS = `
.fl{position:absolute;left:0;top:0;z-index:30;max-width:760px;padding:18px 30px 22px;border-radius:38px;background:#f1eee9;color:#1e2528;font:800 46px/1.08 "Geist",sans-serif;letter-spacing:-.03em;box-shadow:0 26px 60px rgba(0,0,0,.4);opacity:0;text-wrap:balance}
.fl small{display:block;margin-bottom:6px;font-size:22px;letter-spacing:.1em;text-transform:uppercase;color:#b25134}
.fl::after{content:"";position:absolute;width:40px;height:40px;background:inherit;border-radius:0 0 0 10px}
.fl.esq::after{left:56px;bottom:-15px;transform:rotate(60deg) skewX(-10deg)}
.fl.dir::after{right:56px;bottom:-15px;transform:rotate(30deg) skewX(10deg)}
.fl.cima::after{left:56px;top:-15px;transform:rotate(-30deg) skewX(10deg)}
.fl.sem::after{display:none}
.fl.louro{background:#f2cf4a;color:#1e2528;font-size:52px}
.fl.louro small{color:#2e7a3d}
.fl.audio{background:#d8f0c6;color:#1d3b14;font-size:38px;max-width:820px}
.fl.audio .onda{display:flex;align-items:center;gap:5px;height:52px;margin:4px 0 10px}
.fl.audio .onda b{flex:none;width:44px;height:44px;margin-right:10px;border-radius:50%;background:#25a35a;display:grid;place-items:center}
.fl.audio .onda b::after{content:"";border-left:16px solid #fff;border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:4px}
.fl.audio .onda i{flex:none;width:7px;border-radius:4px;background:#7aa86a}
.fl.audio .onda i.ja{background:#1f7a45}
.cap{position:absolute;left:0;top:0;z-index:44;opacity:0;pointer-events:none}
.cap.grande{left:0;width:1080px;padding:34px 0 38px;background:rgba(10,14,16,.86);text-align:center;color:#f6f3ee;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.cap.grande small{display:block;font:800 34px/1 "Geist",sans-serif;letter-spacing:.14em;color:#e8855e}
.cap.grande b{display:block;margin-top:14px;font:800 96px/1 "Geist",sans-serif;letter-spacing:-.045em}
.cap.chip{display:flex;align-items:center;gap:12px;padding:10px 22px 10px 12px;border-radius:999px;background:rgba(10,14,16,.74);color:#f1eee9;font:800 26px/1 "Geist",sans-serif;white-space:nowrap}
.cap.chip em{font-style:normal;padding:7px 12px;border-radius:999px;background:#b25134;color:#fff;font-size:22px;letter-spacing:.04em}`;
const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

// ---------- o Louro (origem nos pés, em cima do poleiro; uns 340 de altura) ----------
export const LOURO = (p = "lo") => `<g id="${p}-pos"><g id="${p}">
  <path d="M-14 -46 L-78 104 Q-66 118 -50 110 L10 -30 Z" fill="#2e7a3d"/><path d="M-78 104 Q-66 118 -50 110 L-42 88 L-68 80 Z" fill="#3a76c9"/>
  <ellipse cx="4" cy="-88" rx="52" ry="78" fill="#3e9b4f" transform="rotate(14 4 -88)"/><ellipse cx="22" cy="-82" rx="30" ry="56" fill="#5bb36a" transform="rotate(14 22 -82)"/>
  <g fill="#8a8f93"><ellipse cx="-6" cy="-4" rx="13" ry="7"/><ellipse cx="18" cy="-4" rx="13" ry="7"/></g>
  <g id="${p}-asa"><path d="M-10 -132 Q-62 -110 -54 -30 Q-42 12 -20 -8 Q12 -70 -10 -132 Z" fill="#2e7a3d"/><path d="M-54 -30 Q-42 12 -20 -8 L-26 -26 Q-40 -20 -52 -42 Z" fill="#3a76c9"/>
    <path d="M-8 -128 Q-32 -118 -36 -94 Q-18 -98 -6 -112 Z" fill="#d4483b"/></g>
  <g id="${p}-cab"><circle cx="22" cy="-182" r="46" fill="#3e9b4f"/><path d="M-2 -220 Q24 -238 52 -214 Q36 -206 22 -208 Q8 -206 -2 -220 Z" fill="#3a76c9"/>
    <ellipse cx="38" cy="-178" rx="27" ry="25" fill="#f2cf4a"/><circle cx="38" cy="-186" r="12" fill="#f4f0e4"/>
    <g id="${p}-olho"><circle cx="40" cy="-186" r="6.5" fill="#1e2528"/><circle cx="42.5" cy="-188.5" r="2.2" fill="#fff"/></g>
    <path id="${p}-bb" d="M60 -168 Q78 -166 80 -155 Q70 -144 57 -151 Z" fill="#5a5a5a"/>
    <path d="M56 -198 Q88 -200 90 -172 Q90 -156 81 -149 Q79 -166 60 -167 Z" fill="#3a3a3a"/></g></g></g>`;
// poleiro de pé (origem no galho, onde o Louro pisa)
export const POLEIRO = (x, y, alto = 420) => `<g transform="translate(${x} ${y})"><rect x="-110" y="-6" width="220" height="18" rx="9" fill="#7d573c"/><rect x="-8" y="8" width="16" height="${alto}" fill="#5a3d2b"/>
  <path d="M-70 ${alto + 8} L0 ${alto - 30} L70 ${alto + 8}" stroke="#5a3d2b" stroke-width="16" fill="none" stroke-linecap="round"/><rect x="58" y="10" width="40" height="22" rx="6" fill="#c9a77c"/></g>`;
// o Louro no quadro t: posição, a cabeça que balança (inclina: -1 a 1, de lado, curioso), o bico que abre nas falas
// dele (ids da narração) e a asa que bate quando ele começa a falar
export function louro(t, F, { p = "lo", x, y, s = 1, falas = [], inclina = 0, flip = false, olhos = null }) {
  let bico = 0, ag = 0;
  for (const id of falas) {
    const f = F[id]; if (!f) continue;
    if (t >= f.ini - 0.03 && t <= f.fim) bico = 0.35 + 0.65 * Math.abs(Math.sin((t - f.ini) * 12));
    ag = Math.max(ag, pulso(t, f.ini - 0.12, 0.5));
  }
  attr($(`#${p}-bb`), "transform", `rotate(${(bico * 24).toFixed(1)} 60 -166)`);
  attr($(`#${p}-cab`), "transform", `rotate(${(Math.sin(t * 2.3) * 4 + inclina * 22 - ag * 10).toFixed(2)} 14 -150)`);
  attr($(`#${p}-asa`), "transform", `rotate(${(-ag * 38 * Math.abs(Math.sin(t * 24))).toFixed(1)} -10 -130)`);
  const fe = olhos !== null ? olhos : (t % 3.3) < 0.12 ? 1 : 0;
  attr($(`#${p}-olho`), "transform", fe > 0 ? `translate(0 -186) scale(1 ${lerp(1, 0.1, fe).toFixed(2)}) translate(0 186)` : "");
  attr($(`#${p}-pos`), "transform", `translate(${x.toFixed(1)} ${(y - ag * 12).toFixed(1)}) scale(${(flip ? -s : s).toFixed(3)} ${s.toFixed(3)})`);
}

// ---------- gente ----------
export const RAFA = { id: "ra", cabelo: "curto", corCabelo: "#2a1d16", barba: true, roupa: "#4f6f8f", braco: "#4f6f8f", calca: "#2b3540" };
export const LURDES = { id: "dl", cabelo: "curto", corCabelo: "#c9c2b8", oculos: true, corOculos: "#5a4a3a", roupa: "#9b6b84", vestido: "#9b6b84", calca: "#9b6b84", bracos: "celular" };
export const CAMILA_P = { id: "cm", cabelo: "longo", corCabelo: "#5a3422", brinco: "#e0b04a", roupa: "#7a6a9a", calca: "#2b3540" };
// o bebê de olhos fechados (cabeça e manta), para colo e bebê-conforto
const BEBEZINHO = `<path d="M-46 0 Q-50 -40 -10 -44 L40 -40 Q58 -20 50 6 Q10 22 -46 0 Z" fill="#9cc6e0"/><circle cx="-22" cy="-34" r="26" fill="#eab9a0"/>
  <g stroke="#6b4a3a" stroke-width="3" fill="none" stroke-linecap="round"><path d="M-34 -36 q5 4 10 0"/><path d="M-18 -36 q5 4 10 0"/></g>`;
// o bebê-conforto pendurado na mão (origem na alça)
export const CONFORTO = `<g><path d="M-62 70 Q0 -26 62 70" stroke="#3a434c" stroke-width="12" fill="none"/><path d="M-80 60 Q-86 150 -20 156 L70 150 Q92 110 76 60 Z" fill="#4a5560"/>
  <g transform="translate(6 108) scale(.9)">${BEBEZINHO}</g><path d="M-80 60 Q-86 150 -20 156 L70 150 Q92 110 76 60 Q60 96 0 100 Q-60 96 -80 60 Z" fill="#3a434c" opacity=".5"/></g>`;
// o bebê no colo (por cima do peito de quem está de pé com bracos: "peito")
export const COLO = `<g transform="translate(6 -236)">${BEBEZINHO}</g>`;
// um adulto de pé com extras: o Rafa com o bebê-conforto na mão esquerda, ou com o bebê no colo
export const rafa = (extra = "conforto") => extra === "colo"
  ? `<g id="ra-pos">${dePe({ ...RAFA, bracos: "peito" })}${COLO}</g>`
  : `<g id="ra-pos">${dePe(RAFA)}<g transform="translate(-54 -146) scale(.8)">${CONFORTO}</g></g>`;
// posiciona e anima uma pessoa de pé (id do dePe), com a boca de quem fala
export function gente(t, F, { id, x, y = 1730, s = 1.6, jeito = "reta", falas = [], andando = false, olhos = null, balanca = 0 }) {
  let fala = false; for (const k of falas) { const f = F[k]; if (f && t >= f.ini && t <= f.fim) fala = true; }
  pernas(id, t, andando);
  boca(id, fala ? ((t * 9) % 1 < 0.5 ? "oh" : jeito) : jeito);
  fecha(id, olhos !== null ? olhos : ((t + id.length) % 3.1) < 0.12 ? 1 : 0);
  const g = $(`#${id}-pos`) || $(`#${id}`).parentNode;
  attr(g, "transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(balanca * Math.sin(t * 2.4)).toFixed(2)}) scale(${s})`);
}

// ---------- a casa da Dona Lurdes ----------
// por fora, de noite: o endereço velho do mapa. "janela" vai dentro da janela da esquerda (o Louro, por exemplo).
export const casaFora = (janela = "") => `<g id="g-fora"><rect width="1080" height="1920" fill="#141d2b"/><circle cx="860" cy="430" r="58" fill="#e9e3d6"/><circle cx="884" cy="414" r="54" fill="#141d2b"/>
    ${[[120, 300], [320, 220], [520, 340], [700, 250], [980, 300], [200, 480]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#e9e3d6" opacity=".7"/>`).join("")}
    <rect y="1480" width="1080" height="440" fill="#26352a"/><rect y="1600" width="1080" height="320" fill="#1f2b22"/>
    <path d="M200 900 L540 600 L880 900 Z" fill="#6e3424"/><rect x="250" y="900" width="580" height="600" fill="#8f826e"/>
    <rect x="300" y="1000" width="200" height="200" rx="12" fill="#f2d79a"/>${janela}
    <rect x="580" y="1000" width="200" height="200" rx="12" fill="#2a3440"/>
    <rect x="300" y="1000" width="200" height="200" rx="12" fill="none" stroke="#d9d2c4" stroke-width="12"/><path d="M400 1000 V1200 M300 1100 H500" stroke="#d9d2c4" stroke-width="5" opacity=".7"/>
    <rect x="580" y="1000" width="200" height="200" rx="12" fill="none" stroke="#d9d2c4" stroke-width="12"/>
    <rect x="460" y="1260" width="160" height="240" rx="10" fill="#4f3624"/><circle cx="595" cy="1385" r="9" fill="#e0b04a"/>
    <circle cx="660" cy="1250" r="16" fill="#f2d79a"/><circle cx="660" cy="1250" r="60" fill="#f2d79a" opacity=".12"/>
    <g transform="translate(700 1330) rotate(-3)"><rect x="-4" y="-50" width="190" height="96" rx="8" fill="#e9e3d6" opacity=".55"/><text x="91" y="-12" text-anchor="middle" font-family="Fraunces" font-style="italic" font-weight="600" font-size="26" fill="#3a2f2a" opacity=".7">Helena</text><text x="91" y="24" text-anchor="middle" font-family="Geist" font-weight="800" font-size="20" fill="#3a2f2a" opacity=".6">FOTOGRAFIA · 2019</text></g>
    ${[[160, 1440], [920, 1440], [130, 1500]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="70" fill="#1d2a1f"/>`).join("")}</g>`;
// por dentro: a sala onde o estúdio começou, com o fundo de papel velho, a placa de 2019, a janela e o poleiro.
// "dentro" vai por cima do cenário (o Louro, a Dona Lurdes).
export const sala = (dentro = "") => `<g id="g-sala"><rect width="1080" height="1920" fill="#4a3f38"/><rect y="1600" width="1080" height="320" fill="#2f2620"/><rect y="1592" width="1080" height="14" fill="#5a4a3e"/>
    <rect x="70" y="420" width="420" height="1190" fill="#7d8c96"/><rect x="60" y="400" width="440" height="40" rx="20" fill="#2a2f33"/><path d="M70 1500 Q280 1560 490 1500 V1610 H70 Z" fill="#6c7b85"/>
    <g transform="translate(280 760)"><rect x="-130" y="-70" width="260" height="140" rx="10" fill="#e9e3d6" opacity=".85"/><text x="0" y="-12" text-anchor="middle" font-family="Fraunces" font-style="italic" font-weight="600" font-size="46" fill="#3a2f2a">Helena</text><text x="0" y="36" text-anchor="middle" font-family="Geist" font-weight="800" font-size="26" letter-spacing="3" fill="#3a2f2a">FOTOGRAFIA · 2019</text></g>
    <rect x="640" y="520" width="320" height="420" rx="16" fill="#1c2a33"/><rect x="656" y="536" width="288" height="388" rx="10" fill="#18233a"/><circle cx="880" cy="620" r="34" fill="#e9e3d6" opacity=".9"/><path d="M800 536 V924 M656 730 H944" stroke="#1c2a33" stroke-width="12"/>
    <g transform="translate(900 1600)"><rect x="-6" y="-420" width="12" height="420" fill="#3a3f45"/><path d="M-70 -480 L70 -480 L50 -380 L-50 -380 Z" fill="#e9d7b0"/><circle cx="0" cy="-380" r="190" fill="#f2d79a" opacity=".1"/></g>
    ${dentro}</g>`;

// ---------- balões das falas dos personagens ----------
// linhas: { idDaFrase: { quem: "LOURO", x, y, cauda: "esq" | "dir" | "cima" | "sem", cls: "louro" | "audio", ate, r } }.
// Em vez de x, "ax" é onde a ponta do balão aponta (o balão se alinha pela largura dele).
export function dialogo(R, linhas) {
  const els = Object.entries(linhas).map(([id, o]) => {
    const f = R.F[id], el = document.createElement("div");
    el.className = `fl ${o.cauda || "esq"} ${o.cls || ""}`;
    const txt = f.palavras.map(p => p.p).join(" ");
    el.innerHTML = `<small>${o.quem}</small>${o.cls === "audio" ? `<div class="onda"><b></b>${Array.from({ length: 30 }, (_, k) => `<i style="height:${(10 + 34 * Math.abs(Math.sin(k * 1.7) * Math.cos(k * 0.6))).toFixed(0)}px"></i>`).join("")}</div>` : ""}<span>${txt}</span>`;
    $("#baloes").appendChild(el);
    return { el, o, f, barras: [...el.querySelectorAll(".onda i")] };
  });
  return t => {
    for (const { el, o, f, barras } of els) {
      const fim = o.ate ?? f.fim + 0.45, a = entra(t, f.ini - 0.12, 0.3), on = t >= f.ini - 0.16 && t < fim;
      const treme = o.cls === "louro" && t < f.fim ? 3 * Math.sin(t * 40) : 0;
      const x = o.ax === undefined ? o.x : o.cauda === "dir" ? o.ax - el.offsetWidth + 76 : o.ax - 76;
      pos(el, { x, y: o.y + a.y * 0.6, s: a.s, r: (o.r || 0) + treme, o: on ? a.o * (1 - fase(t, fim - 0.2, fim)) : 0 });
      if (barras.length) { const k = Math.floor(fase(t, f.ini, f.fim) * barras.length); barras.forEach((b, i) => b.classList.toggle("ja", i < k)); }
    }
  };
}

// ---------- capítulos: quem está contando agora ----------
// lista: [{ t0, ate, hora: "23h51", quem: "A FOTÓGRAFA", grande }]. Na entrada, uma faixa grande no meio por 1 s
// (menos com grande: false); depois, uma etiqueta pequena no canto de cima, até "ate".
export function capitulos(lista, { yGrande = 700, yChip = 404 } = {}) {
  const els = lista.map(c => {
    const g = document.createElement("div"); g.className = "cap grande"; g.innerHTML = `<small>${c.hora}</small><b>${c.quem}</b>`;
    const k = document.createElement("div"); k.className = "cap chip"; k.innerHTML = `<em>${c.hora}</em>${c.quem}`;
    $("#palco").append(g, k);
    return { c, g, k };
  });
  return t => {
    for (const { c, g, k } of els) {
      const a = c.grande === false ? 0 : fase(t, c.t0 - 0.12, c.t0 + 0.18), z = fase(t, c.t0 + 1.0, c.t0 + 1.3);
      pos(g, { y: yGrande, s: lerp(1.08, 1, sai(a)), o: a * (1 - z) });
      g.style.clipPath = `inset(0 ${(50 - 50 * sai(a)).toFixed(1)}% 0 ${(50 - 50 * sai(a)).toFixed(1)}%)`;
      const b = c.grande === false ? fase(t, c.t0 - 0.1, c.t0 + 0.2) : fase(t, c.t0 + 1.1, c.t0 + 1.4), fim = c.ate ?? 1e9;
      pos(k, { x: 44, y: yChip + (1 - sai(b)) * 16, o: t < fim ? b * (1 - fase(t, fim - 0.25, fim)) : 0 });
    }
  };
}
// os sons de cada capítulo (o whoosh na entrada)
export const sonsCapitulos = lista => lista.filter(c => c.grande !== false).map(c => ({ t: c.t0 - 0.2, tipo: "passa", ganho: 0.55 }));
