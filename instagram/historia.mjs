// Peças comuns dos Reels narrados com história (desde a semana de 04/11/2026), tiradas do reels-carro-de-som.html:
// contas de animação, gente desenhada, ícones, balões, legendas palavra a palavra, marca, convite e o tranco dos
// impactos. Cada Reels tem o seu HTML com as cenas próprias; o tempo de tudo sai de narracao/<nome>.tempos.json.
// Uso:
//   const R = await historia({ nome: "reels-x", ordem: [...cenas], trilha: { cena: "abre" | "google" | ... }, soBalao: [...ids] });
//   window.quadro = t => { ...cenas...; R.comum(t); };   window.preparar = () => R.preparar(ensaio);
import { MARCAS } from "../site/marcas.mjs";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- contas ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const fase = (t, a, b) => clamp((t - a) / (b - a));
export const ease = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const sai = x => 1 - Math.pow(1 - x, 3);
export const saiX = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const volta = x => (x <= 0 ? 0 : 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2)); // passa do ponto e volta
export const lerp = (a, b, x) => a + (b - a) * x;
export const pulso = (t, t0, d = 0.5) => { const x = fase(t, t0, t0 + d); return x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0; };
export const h = (i, k = 0) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
export function pos(el, { x = 0, y = 0, s = 1, r = 0, o = 1, b = 0 } = {}) {
  el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)})`;
  el.style.opacity = o.toFixed(3);
  el.style.filter = b > 0.15 ? `blur(${b.toFixed(1)}px)` : "";
  el.style.visibility = o <= 0.002 ? "hidden" : "";
}
export const attr = (el, k, v) => el.setAttribute(k, v);
export const entra = (t, t0, d = 0.32) => { const x = fase(t, t0 - 0.04, t0 + d); return { x, s: x > 0 ? lerp(0.6, 1, volta(x)) : 0.6, o: x > 0 ? Math.min(1, x * 3) : 0, y: (1 - sai(x)) * 30 }; };
export const em = (t, a, b) => t >= a && t < b;
export const vis = (el, v) => { el.style.display = v ? "block" : "none"; };
export const E = 0.001;
export function pose(P, t) {
  if (t <= P[0][0]) return P[0].slice(1);
  for (let k = 0; k < P.length - 1; k++) if (t < P[k + 1][0]) { const a = P[k], b = P[k + 1], x = ease(fase(t, a[0], b[0])); return a.slice(1).map((v, i) => lerp(v, b[i + 1], x)); }
  return P[P.length - 1].slice(1);
}
// câmera de um desenho: o ponto (cx, cy) fica no centro da tela, com zoom s
export const camera = (g, [cx, cy, s]) => attr(g, "transform", `translate(${(540 - cx * s).toFixed(1)} ${(960 - cy * s).toFixed(1)}) scale(${s.toFixed(4)})`);
export const naTela = (cam, x, y) => [540 + (x - cam[0]) * cam[2], 960 + (y - cam[1]) * cam[2]];
export const xd = (el, ax) => clamp(ax - el.offsetWidth + 70, 24, 1056 - el.offsetWidth); // balão com a ponta à direita
export const xe = (el, ax) => clamp(ax - 70, 24, 1056 - el.offsetWidth); // balão com a ponta à esquerda
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mix = (a, b, x) => { const p = hex(a), q = hex(b); return `rgb(${p.map((v, i) => Math.round(lerp(v, q[i], clamp(x)))).join(",")})`; };
// um elemento que aparece em t0 e some em t1, com a entrada de mola
export function aparece(el, t, t0, t1, extra = {}) {
  const a = entra(t, t0), o = em(t, t0 - 0.05, t1) ? a.o * (1 - fase(t, t1 - 0.15, t1)) : 0;
  pos(el, { ...extra, y: (extra.y || 0) + a.y, s: (extra.s || 1) * a.s, o });
  return o;
}

// ---------- ícones (Lucide) ----------
export const IC = {
  relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  mapa: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  mensagem: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  voltar: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  etiqueta: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  usuario: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  coracao: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  enviar: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  olho: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  cadeado: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  estrela: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  calendario: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  sino: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  sacola: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  telefone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  tesoura: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
};
export const ic = (n, extra = "") => `<svg class="i" viewBox="0 0 24 24" ${extra}>${IC[n]}</svg>`;
export const ZAP_B = `<svg viewBox="0 0 24 24" fill="#fff"><path d="${MARCAS.whatsapp.d}"/></svg>`;
export const ZAP_D = MARCAS.whatsapp.d;
export const INSTA_D = MARCAS.instagram ? MARCAS.instagram.d : "";

// ---------- gente ----------
export const PELE = "#d79d79", PELE2 = "#c4876a";
// cabeça: olhos, sobrancelhas, cabelo, óculos. (cx, cy) = centro da cabeça
export function cabeca(o, cx, cy, r) {
  const k = r / 40, id = o.id || "";
  let s = `<g id="${id}cab">`;
  if (o.cabelo === "longo") s += `<path d="M${cx - r * 1.08} ${cy + r * 1.3} Q${cx - r * 1.2} ${cy - r * 1.14} ${cx} ${cy - r * 1.12} Q${cx + r * 1.2} ${cy - r * 1.14} ${cx + r * 1.08} ${cy + r * 1.3} Z" fill="${o.corCabelo}"/>`;
  s += `<circle cx="${cx - r}" cy="${cy + 2 * k}" r="${8 * k}" fill="${o.pele2 || PELE2}"/><circle cx="${cx + r}" cy="${cy + 2 * k}" r="${8 * k}" fill="${o.pele2 || PELE2}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.pele || PELE}"/>`;
  if (o.cabelo === "curto") {
    s += `<path d="M${cx - r * 1.03} ${cy - r * 0.05} Q${cx - r * 1.05} ${cy - r * 1.12} ${cx} ${cy - r * 1.1} Q${cx + r * 1.05} ${cy - r * 1.12} ${cx + r * 1.03} ${cy - r * 0.05} Q${cx + r * 0.6} ${cy - r * 0.62} ${cx} ${cy - r * 0.6} Q${cx - r * 0.6} ${cy - r * 0.62} ${cx - r * 1.03} ${cy - r * 0.05} Z" fill="${o.corCabelo}"/>`;
  } else if (o.cabelo === "coque") {
    s += `<circle cx="${cx}" cy="${cy - r * 1.12}" r="${r * 0.42}" fill="${o.corCabelo}"/>`;
    s += `<path d="M${cx - r * 1.03} ${cy - r * 0.05} Q${cx - r * 1.05} ${cy - r * 1.1} ${cx} ${cy - r * 1.06} Q${cx + r * 1.05} ${cy - r * 1.1} ${cx + r * 1.03} ${cy - r * 0.05} Q${cx + r * 0.6} ${cy - r * 0.55} ${cx} ${cy - r * 0.52} Q${cx - r * 0.6} ${cy - r * 0.55} ${cx - r * 1.03} ${cy - r * 0.05} Z" fill="${o.corCabelo}"/>`;
  } else if (o.cabelo === "longo") {
    s += `<path d="M${cx - r * 1.04} ${cy + r * 0.1} Q${cx - r * 1.08} ${cy - r * 1.12} ${cx} ${cy - r * 1.1} Q${cx + r * 1.08} ${cy - r * 1.12} ${cx + r * 1.04} ${cy + r * 0.1} Q${cx + r * 0.9} ${cy - r * 0.5} ${cx + r * 0.2} ${cy - r * 0.62} Q${cx - r * 0.5} ${cy - r * 0.5} ${cx - r * 1.04} ${cy + r * 0.1} Z" fill="${o.corCabelo}"/>`;
  } else if (o.cabelo === "careca") {
    s += `<path d="M${cx - r * 1.02} ${cy + r * 0.1} Q${cx - r * 1.04} ${cy - r * 0.5} ${cx - r * 0.8} ${cy - r * 0.62} L${cx - r * 0.86} ${cy + r * 0.1} Z M${cx + r * 1.02} ${cy + r * 0.1} Q${cx + r * 1.04} ${cy - r * 0.5} ${cx + r * 0.8} ${cy - r * 0.62} L${cx + r * 0.86} ${cy + r * 0.1} Z" fill="${o.corCabelo}"/>`;
  }
  const ey = cy - 2 * k;
  s += `<g id="${id}sob" fill="${o.corSob || "#3a2f2a"}"><rect x="${cx - 24 * k}" y="${ey - 16 * k}" width="${16 * k}" height="${4 * k}" rx="${2 * k}"/><rect x="${cx + 8 * k}" y="${ey - 16 * k}" width="${16 * k}" height="${4 * k}" rx="${2 * k}"/></g>`;
  s += `<g id="${id}olhos" fill="#1e2528"><circle cx="${cx - 15 * k}" cy="${ey}" r="${4.6 * k}"/><circle cx="${cx + 15 * k}" cy="${ey}" r="${4.6 * k}"/></g>`;
  if (o.oculos) s += `<g fill="none" stroke="${o.corOculos || "#1e2528"}" stroke-width="${2.6 * k}"><circle cx="${cx - 15 * k}" cy="${ey}" r="${11 * k}"/><circle cx="${cx + 15 * k}" cy="${ey}" r="${11 * k}"/><path d="M${cx - 4 * k} ${ey} h${8 * k}"/></g>`;
  if (o.brinco) s += `<circle cx="${cx - r - 2 * k}" cy="${cy + 14 * k}" r="${4 * k}" fill="${o.brinco}"/><circle cx="${cx + r + 2 * k}" cy="${cy + 14 * k}" r="${4 * k}" fill="${o.brinco}"/>`;
  s += `<ellipse cx="${cx}" cy="${cy + 12 * k}" rx="${7 * k}" ry="${9 * k}" fill="${o.pele2 || PELE2}"/>`;
  if (o.bigode) s += `<path d="M${cx - 22 * k} ${cy + 25 * k} Q${cx - 12 * k} ${cy + 14 * k} ${cx} ${cy + 20 * k} Q${cx + 12 * k} ${cy + 14 * k} ${cx + 22 * k} ${cy + 25 * k} Q${cx} ${cy + 22 * k} ${cx - 22 * k} ${cy + 25 * k} Z" fill="${o.corCabelo}"/>`;
  if (o.barba) s += `<path d="M${cx - r * 0.98} ${cy + r * 0.1} Q${cx - r * 0.9} ${cy + r * 1.05} ${cx} ${cy + r * 1.08} Q${cx + r * 0.9} ${cy + r * 1.05} ${cx + r * 0.98} ${cy + r * 0.1} Q${cx + r * 0.7} ${cy + r * 0.62} ${cx} ${cy + r * 0.5} Q${cx - r * 0.7} ${cy + r * 0.62} ${cx - r * 0.98} ${cy + r * 0.1} Z" fill="${o.corCabelo}"/>`;
  s += `<path id="${id}sorriso" d="M${cx - 11 * k} ${cy + 26 * k} Q${cx} ${cy + 36 * k} ${cx + 11 * k} ${cy + 26 * k}" stroke="#7a3d2e" stroke-width="${3.4 * k}" fill="none" stroke-linecap="round" opacity="0"/>`;
  s += `<path id="${id}reta" d="M${cx - 9 * k} ${cy + 29 * k} H${cx + 9 * k}" stroke="#7a3d2e" stroke-width="${3.4 * k}" stroke-linecap="round" opacity="1"/>`;
  s += `<path id="${id}triste" d="M${cx - 10 * k} ${cy + 32 * k} Q${cx} ${cy + 24 * k} ${cx + 10 * k} ${cy + 32 * k}" stroke="#7a3d2e" stroke-width="${3.4 * k}" fill="none" stroke-linecap="round" opacity="0"/>`;
  s += `<ellipse id="${id}oh" cx="${cx}" cy="${cy + 30 * k}" rx="${6 * k}" ry="${8 * k}" fill="#7a3d2e" opacity="0"/>`;
  return s + "</g>";
}
// de pé: origem nos pés. Pernas em grupos próprios, para andar. bracos: "peito" (cruzados), "celular" (um no celular)
export function dePe(o) {
  const braco = o.braco || o.roupa, pele = o.pele || PELE;
  let s = `<g id="${o.id}">`;
  s += `<ellipse cx="0" cy="4" rx="58" ry="9" fill="#000" opacity=".22"/>`;
  if (o.vestido) s += `<path d="M-30 -150 L-74 -6 Q0 14 74 -6 L30 -150 Z" fill="${o.vestido}"/>`;
  s += `<g id="${o.id}p1"><rect x="-29" y="-150" width="26" height="146" rx="11" fill="${o.calca}"/><ellipse cx="-18" cy="-4" rx="21" ry="9" fill="#141819"/></g>`;
  s += `<g id="${o.id}p2"><rect x="3" y="-150" width="26" height="146" rx="11" fill="${o.calca}"/><ellipse cx="18" cy="-4" rx="21" ry="9" fill="#141819"/></g>`;
  if (o.vestido) s += `<path d="M-34 -160 L-80 -2 Q0 16 80 -2 L34 -160 Z" fill="${o.vestido}"/>`;
  s += `<path d="M-50 -140 L-46 -262 Q-44 -288 -20 -290 L20 -290 Q44 -288 46 -262 L50 -140 Z" fill="${o.roupa}"/>`;
  if (o.avental) s += `<path d="M-34 -262 L34 -262 L40 -120 L-40 -120 Z" fill="${o.avental}"/>`;
  if (o.bracos === "peito") s += `<path d="M-47 -272 Q-80 -226 -24 -246" stroke="${braco}" stroke-width="24" stroke-linecap="round" fill="none"/><path d="M47 -272 Q80 -226 24 -246" stroke="${braco}" stroke-width="24" stroke-linecap="round" fill="none"/><circle cx="-22" cy="-246" r="12" fill="${pele}"/><circle cx="22" cy="-246" r="12" fill="${pele}"/>`;
  else {
    s += `<path d="M-47 -272 Q-62 -210 -54 -150" stroke="${braco}" stroke-width="24" stroke-linecap="round" fill="none"/><circle cx="-54" cy="-146" r="12" fill="${pele}"/>`;
    if (o.bracos === "celular") s += `<path d="M47 -272 Q70 -222 30 -206" stroke="${braco}" stroke-width="24" stroke-linecap="round" fill="none"/><rect x="6" y="-238" width="30" height="50" rx="6" fill="#111"/><rect id="${o.id}tela" x="9" y="-234" width="24" height="40" rx="3" fill="#9cc6e0" opacity=".9"/><circle cx="26" cy="-204" r="12" fill="${pele}"/>`;
    else s += `<path d="M47 -272 Q62 -210 54 -150" stroke="${braco}" stroke-width="24" stroke-linecap="round" fill="none"/><circle cx="54" cy="-146" r="12" fill="${pele}"/>`;
  }
  s += `<rect x="-11" y="-306" width="22" height="20" fill="${o.pele2 || PELE2}"/>`;
  s += cabeca(o, 0, -346, 40);
  return s + "</g>";
}
export const boca = (pre, qual) => ["sorriso", "reta", "triste", "oh"].forEach(k => attr($(`#${pre}${k}`), "opacity", k === qual ? 1 : 0));
export const pernas = (pre, t, andando) => { const p = andando ? Math.sin(t * 9) : 0; attr($(`#${pre}p1`), "transform", `rotate(${(p * 14).toFixed(2)} -16 -150)`); attr($(`#${pre}p2`), "transform", `rotate(${(-p * 14).toFixed(2)} 16 -150)`); };
export const fecha = (pre, x, cy = -348) => attr($(`#${pre}olhos`), "transform", x > 0 ? `translate(0 ${cy}) scale(1 ${lerp(1, 0.15, x).toFixed(3)}) translate(0 ${-cy})` : "");

// ---------- celular ----------
export const barra = hora => `<div class="status"><span class="hora">${hora}</span><i><span class="sin"><b style="height:6px"></b><b style="height:10px"></b><b style="height:14px"></b><b style="height:18px"></b></span><span class="bat"></span></i></div>`;
export function balao(txt, cls, onde = "#baloes") { const el = document.createElement("div"); el.className = "balao " + cls; el.innerHTML = txt; $(onde).appendChild(el); return el; }

// ---------- a história: tempos, legendas, marca, convite e trilha ----------
const limpa = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, "");
export async function historia(cfg) {
  const { nome, ordem, trilha, soBalao = [], juntas = [], fora = ["marca", "cta"], cta = "PRÉVIA", nota = "", bpm = 124, tom = 0 } = cfg;
  const { duracao: VOZ, frases } = await (await fetch(`narracao/${nome}.tempos.json`)).json();
  const F = Object.fromEntries(frases.map(f => [f.id, f]));
  // sem as frases moral, marca e cta, o convite é mudo: depois da voz, só na tela (episódios de série que terminam em "Siga")
  const MUDO = !F.moral, T0 = VOZ + 0.1;
  const DUR = MUDO ? Math.round((VOZ + (cfg.fimMudo || 4.2)) * 10) / 10 : Math.round((VOZ + 1.67) * 10) / 10; // a voz acaba e o convite fica mais 1,5 s na tela
  const palco = $("#palco");
  palco.style.setProperty("--zap", `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='#fff'><path d='${ZAP_D}'/></svg>`)}")`);
  const S = {};
  ordem.forEach((c, i) => { const f = frases.find(f => f.cena === c); if (!f) throw new Error("sem frase na cena " + c); S[c] = i === 0 ? 0 : f.ini; });
  const I = id => F[id].ini, FIM = id => F[id].fim;
  function W(id, pal, n = 0) {
    const ps = F[id].palavras, alvo = limpa(pal);
    const xs = ps.filter(p => limpa(p.p) === alvo).length ? ps.filter(p => limpa(p.p) === alvo) : ps.filter(p => limpa(p.p).startsWith(alvo));
    if (!xs[n]) throw new Error(`sem a palavra "${pal}" na frase ${id}`);
    return xs[n].ini;
  }

  // marca e convite
  if (MUDO) {
    const est = Array.from({ length: 32 }, (_, i) => { const a = (i * 11.25 - 90) * Math.PI / 180, r = i % 2 ? 190 : 255; return `${(540 + r * Math.cos(a)).toFixed(1)},${(960 + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
    $("#c-fim").style.background = "radial-gradient(70% 50% at 50% 42%,#1a2124 0%,#0a0d0f 75%)";
    $("#c-fim").innerHTML = `<svg id="mc-estrela" viewBox="0 0 1080 1920"><defs><radialGradient id="mc-g" cx="540" cy="960" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8855e" stop-opacity=".5"/><stop offset=".6" stop-color="#e8855e" stop-opacity=".12"/><stop offset="1" stop-color="#e8855e" stop-opacity="0"/></radialGradient></defs>
      <circle cx="540" cy="960" r="420" fill="url(#mc-g)"/><polygon points="${est}" fill="#e8855e" fill-opacity=".13" id="mc-poli"/></svg>
      <div id="mc-simbolo"><span class="simbolo"></span></div><div id="mc-nome">renderiza</div>
      <div id="cta-botao"><span id="cta-luz"></span>${ic("mensagem", 'style="stroke-width:2.2"')}<span>Comenta <em id="cta-previa">${cta}</em></span></div>
      <p id="cta-texto">${cfg.ctaTexto || "que a gente monta a prévia do site do seu estúdio, sem compromisso."}</p>
      <p id="cta-nota">${nota}</p>`;
  } else {
    const L = F.moral.palavras, M = F.marca.palavras, C = F.cta.palavras, ip = C.findIndex(p => p.p.includes(cta)), ir = M.findIndex(p => /Renderiza/.test(p.p));
    const est = Array.from({ length: 32 }, (_, i) => { const a = (i * 11.25 - 90) * Math.PI / 180, r = i % 2 ? 190 : 255; return `${(540 + r * Math.cos(a)).toFixed(1)},${(960 + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
    $("#c-fim").innerHTML = `<svg id="mc-estrela" viewBox="0 0 1080 1920"><defs><radialGradient id="mc-g" cx="540" cy="960" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8855e" stop-opacity=".5"/><stop offset=".6" stop-color="#e8855e" stop-opacity=".12"/><stop offset="1" stop-color="#e8855e" stop-opacity="0"/></radialGradient></defs>
      <circle cx="540" cy="960" r="420" fill="url(#mc-g)"/><polygon points="${est}" fill="#e8855e" fill-opacity=".13" id="mc-poli"/></svg>
      <p id="mc-linha">${L.map(p => `<span class="w${p.tom ? " tom" : ""}">${p.p}</span>`).join(" ")}</p>
      <div id="mc-simbolo"><span class="simbolo"></span></div><div id="mc-nome">renderiza</div>
      <p id="mc-sub">${M.slice(ir + 1).map(p => `<span class="w">${p.p}</span>`).join(" ")}</p>
      <div id="cta-botao"><span id="cta-luz"></span>${ic("mensagem", 'style="stroke-width:2.2"')}<span>Comenta <em id="cta-previa">${cta}</em></span></div>
      <p id="cta-texto">${C.slice(ip + 1).map(p => `<span class="w">${p.p}</span>`).join(" ")}</p>
      <p id="cta-nota">${nota}</p>`;
  }
  const mcPal = MUDO ? [] : $$("#mc-linha .w").map((el, k) => ({ el, ini: F.moral.palavras[k].ini }));
  const subPal = MUDO ? [] : (() => { const M = F.marca.palavras, ir = M.findIndex(p => /Renderiza/.test(p.p)); return $$("#mc-sub .w").map((el, k) => ({ el, ini: M[ir + 1 + k].ini })); })();
  const ctaPal = MUDO ? [] : (() => { const C = F.cta.palavras, ip = C.findIndex(p => p.p.includes(cta)); return $$("#cta-texto .w").map((el, k) => ({ el, ini: C[ip + 1 + k].ini })); })();
  const T_REN = MUDO ? T0 : W("marca", "renderiza"), T_CTA = MUDO ? T0 + 0.6 : W("cta", limpa(cta));

  // poeira, sempre igual a cada gravação
  const POEIRA = Array.from({ length: 22 }, (_, i) => { const el = document.createElement("i"); $("#poeira").appendChild(el); return { el, x: h(i, 1) * 1080, y: h(i, 2) * 2100, v: 14 + h(i, 3) * 34, s: 0.4 + h(i, 4) * 1.1, f: h(i, 5) * 6.28 }; });

  // legendas: frases longas viram pedaços de até duas linhas
  function partir(ws) {
    const txt = a => a.map(p => p.p).join(" ");
    for (let k = 0; k < ws.length - 1; k++) if (/[.?!:…]$/.test(ws[k].p)) return [...partir(ws.slice(0, k + 1)), ...partir(ws.slice(k + 1))];
    if (txt(ws).length <= 44) return [ws];
    let melhor = 1, nota_ = Infinity;
    for (let k = 1; k < ws.length; k++) {
      let n = Math.abs(txt(ws.slice(0, k)).length - txt(ws.slice(k)).length);
      if (/[,:;]$/.test(ws[k - 1].p)) n -= 20; else if (/^(e|com|sem|para|que)$/i.test(ws[k].p)) n -= 6;
      if (n < nota_) { nota_ = n; melhor = k; }
    }
    return [...partir(ws.slice(0, melhor)), ...partir(ws.slice(melhor))];
  }
  const pedacos = [], grupos = [];
  for (const f of frases) {
    const j = juntas.find(g => g.includes(f.id));
    if (j && j[0] !== f.id) { grupos[grupos.length - 1].ws.push(...f.palavras); continue; }
    grupos.push({ f, ws: [...f.palavras], junto: !!j });
  }
  for (const g of grupos) for (const ws of (g.ws.map(p => p.p).join(" ").length <= (g.junto ? 50 : 44) ? [g.ws] : partir(g.ws))) pedacos.push({ f: g.f, ws });
  pedacos.forEach((p, i) => { p.de = i === 0 ? -1 : p.ws[0].ini - 0.06; });
  pedacos.forEach((p, i) => { p.ate = i < pedacos.length - 1 ? pedacos[i + 1].de : DUR + 1; });
  for (const p of pedacos) {
    if (fora.includes(p.f.cena) || soBalao.includes(p.f.id)) continue;
    p.el = document.createElement("p");
    p.el.className = "fala";
    p.wel = p.ws.map(w => { const s = document.createElement("span"); s.className = "w" + (w.tom ? " tom" : ""); s.textContent = w.p; p.el.append(s, " "); return s; });
    $("#falas").appendChild(p.el);
  }

  function qFim(t) {
    for (const w of mcPal) { const x = fase(t, w.ini - 0.05, w.ini + 0.22); pos(w.el, { y: (1 - sai(x)) * 22, s: x > 0 ? lerp(0.85, 1, volta(x)) : 0.85, o: x > 0 ? Math.min(1, x * 3) : 0 }); }
    const m = fase(t, T_REN - 0.04, T_REN + 0.6), c = ease(fase(t, S.cta - 0.32, S.cta + 0.22));
    pos($("#mc-linha"), { y: lerp(0, -150, ease(m)) - 200 * c, s: lerp(1, 0.74, ease(m)), o: (1 - 0.35 * ease(m)) * (1 - c) });
    pos($("#mc-simbolo"), { y: lerp(0, -330, c), s: (m > 0 ? lerp(0.3, 1, volta(m)) : 0.3) * lerp(1, 0.44, c), r: lerp(-140, 0, saiX(m)), o: m > 0 ? Math.min(1, m * 3) : 0, b: (1 - saiX(m)) * 14 });
    const nm = ease(fase(t, T_REN + 0.1, T_REN + 0.62));
    $("#mc-nome").style.clipPath = `inset(-30% ${(100 - 100 * nm).toFixed(2)}% -30% 0)`;
    pos($("#mc-nome"), { y: lerp(0, -462, c) + (1 - nm) * 20, s: lerp(1, 0.5, c) });
    for (const w of subPal) { const x = fase(t, w.ini - 0.05, w.ini + 0.22); pos(w.el, { y: (1 - sai(x)) * 18, o: x > 0 ? Math.min(1, x * 3) : 0 }); }
    pos($("#mc-sub"), { y: lerp(0, -560, c), s: lerp(1, 0.78, c), o: 1 - fase(t, S.cta + 0.3, S.cta + 0.7) });
    const est = saiX(fase(t, T_REN - 0.05, T_REN + 1));
    $("#mc-poli").setAttribute("transform", `translate(540 960) rotate(${(5 * (t - T_REN)).toFixed(2)}) scale(${lerp(0.3, 1, est).toFixed(3)}) translate(-540 -960)`);
    $("#mc-estrela").style.transform = `translateY(${lerp(0, -330, c).toFixed(1)}px)`; $("#mc-estrela").style.opacity = est.toFixed(3);
    const b = fase(t, S.cta + 0.04, S.cta + 0.4), pb = pulso(t, T_CTA, 0.32);
    pos($("#cta-botao"), { y: (1 - sai(b)) * 40, s: (b > 0 ? lerp(0.5, 1, volta(b)) : 0.5) * (1 + 0.05 * pb + 0.015 * Math.sin(t * 3.2) * fase(t, DUR - 2, DUR - 1)), o: b > 0 ? Math.min(1, b * 3) : 0 });
    $("#cta-previa").style.transform = `scale(${(1 + 0.14 * pb).toFixed(3)})`;
    const lz = ((t - T_CTA) % 2.4) / 0.7; $("#cta-luz").style.transform = `translateX(${(t > T_CTA && lz < 1 ? lerp(-200, 900, lz) : -300).toFixed(0)}px) skewX(-18deg)`;
    for (const w of ctaPal) { const x = fase(t, w.ini - 0.05, w.ini + 0.22); pos(w.el, { y: (1 - sai(x)) * 20, o: x > 0 ? Math.min(1, x * 3) : 0 }); }
    $("#cta-nota").style.opacity = fase(t, S.cta + 1.3, S.cta + 1.8).toFixed(3);
    $("#c-fim").style.opacity = fase(t, S.marca - 0.3, S.marca).toFixed(3);
  }

  // o convite mudo: a marca e o "Comenta" aparecem na tela depois da voz, sem nada falado
  function qFimMudo(t) {
    const a = fase(t, T0, T0 + 0.6), nm = ease(fase(t, T0 + 0.1, T0 + 0.6));
    pos($("#mc-simbolo"), { y: -330, s: (a > 0 ? lerp(0.3, 1, volta(a)) : 0.3) * 0.44, r: lerp(-140, 0, saiX(a)), o: a > 0 ? Math.min(1, a * 3) : 0, b: (1 - saiX(a)) * 10 });
    $("#mc-nome").style.clipPath = `inset(-30% ${(100 - 100 * nm).toFixed(2)}% -30% 0)`; pos($("#mc-nome"), { y: -462, s: 0.5 });
    const est = saiX(fase(t, T0, T0 + 1));
    $("#mc-poli").setAttribute("transform", `translate(540 960) rotate(${(5 * (t - T0)).toFixed(2)}) scale(${lerp(0.3, 1, est).toFixed(3)}) translate(-540 -960)`);
    $("#mc-estrela").style.transform = "translateY(-330px)"; $("#mc-estrela").style.opacity = est.toFixed(3);
    const b = fase(t, T0 + 0.35, T0 + 0.7), pb = pulso(t, T_CTA, 0.32);
    pos($("#cta-botao"), { y: (1 - sai(b)) * 40, s: (b > 0 ? lerp(0.5, 1, volta(b)) : 0.5) * (1 + 0.05 * pb + 0.015 * Math.sin(t * 3.2) * fase(t, T0 + 1, T0 + 1.5)), o: b > 0 ? Math.min(1, b * 3) : 0 });
    $("#cta-previa").style.transform = `scale(${(1 + 0.14 * pb).toFixed(3)})`;
    const lz = ((t - T_CTA) % 2.4) / 0.7; $("#cta-luz").style.transform = `translateX(${(t > T_CTA && lz < 1 ? lerp(-200, 900, lz) : -300).toFixed(0)}px) skewX(-18deg)`;
    const x = fase(t, T0 + 0.7, T0 + 1.05); pos($("#cta-texto"), { y: (1 - sai(x)) * 20, o: x });
    $("#cta-nota").style.opacity = fase(t, T0 + 1.3, T0 + 1.8).toFixed(3);
    $("#c-fim").style.opacity = fase(t, T0 - 0.3, T0).toFixed(3);
  }

  // o que todo quadro faz depois das cenas: marca e convite, poeira, legendas e o tranco dos impactos
  function comum(t, { poeira = true } = {}) {
    const fim = MUDO ? t >= T0 - 0.3 : t >= S.marca - 0.3;
    vis($("#c-fim"), fim); if (fim) (MUDO ? qFimMudo : qFim)(t);
    for (const p of POEIRA) {
      const y = ((p.y - t * p.v) % 2100 + 2100) % 2100 - 90, x = p.x + Math.sin(t * 0.35 + p.f) * 34, tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.7 + p.f));
      p.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${p.s.toFixed(2)})`;
      p.el.style.background = poeira || fim ? `radial-gradient(closest-side,rgba(236,150,112,${(0.45 * tw).toFixed(3)}),rgba(236,150,112,0))` : "none";
    }
    for (const p of pedacos) {
      if (!p.el) continue;
      const v = t >= p.de && t < p.ate;
      p.el.style.display = v ? "" : "none";
      if (!v) continue;
      const sai_ = fase(t, p.ate - 0.08, p.ate);
      p.ws.forEach((w, k) => {
        const x = p.de < 0 ? 1 : fase(t, w.ini - 0.05, w.ini + 0.2);
        pos(p.wel[k], { y: (1 - sai(x)) * 22 - 14 * sai_, s: x > 0 ? lerp(0.86, 1, volta(x)) : 0.86, o: (x > 0 ? Math.min(1, x * 3) : 0) * (1 - sai_) });
      });
    }
    let soco = 0, tremor = 0, flash = 0;
    for (const f of frases) if (f.impacto) {
      const x = fase(t, f.ini - 0.03, f.ini + 0.38); if (x > 0 && x < 1) { soco = Math.max(soco, 1 - sai(x)); tremor = Math.max(tremor, x < 0.35 ? 1 - x / 0.35 : 0); }
      const y = fase(t, f.ini - 0.03, f.ini + 0.2); if (y > 0 && y < 1) flash = Math.max(flash, 0.34 * (1 - y));
    }
    palco.style.transform = soco > 0 ? `translate(${(tremor * 9 * Math.sin(t * 97)).toFixed(1)}px,${(tremor * 7 * Math.cos(t * 83)).toFixed(1)}px) scale(${(1 + 0.045 * soco).toFixed(4)})` : "";
    $("#flash").style.opacity = flash.toFixed(3);
  }

  // a trilha (ferramentas/video/trilha-pulso.py) só conhece abre, google, insta, volta, meio, ese, site, fim, cta, brinca (papagaio) e pos (pós-créditos)
  // sons: efeitos de cena [{ t, tipo: "toc" | "quica" | "ding" | "apito" | "toque" | "tesoura" | "campainha" | "caixinha" | "baque" | "pi" | "louro" | "passa" | "ronco", ganho }], mixados pela trilha
  const preparar = (ensaio = [], sons = []) => {
    window.quadro(0);
    return {
      duracao: DUR, narracao: nome, bpm, tom, sons: sons.map(s => ({ ...s, t: +s.t.toFixed(3) })),
      pulso: frases.map(f => ({ id: f.id, cena: trilha[f.cena], ini: f.ini, fim: f.fim, pausa: f.pausa || 0, impacto: !!f.impacto })),
      ensaio: ensaio.map(x => +x.toFixed(2)),
    };
  };
  const pronto = async () => {
    await Promise.all(["800 76px Geist", "700 30px Geist", "600 30px Geist", "italic 600 30px Fraunces"].map(f => document.fonts.load(f).catch(() => {})));
    await document.fonts.ready;
    window.quadro(0);
    window.pronto = true;
  };
  return { F, frases, DUR, S, I, FIM, W, palco, comum, preparar, pronto, MUDO, T0 };
}
