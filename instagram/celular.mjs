// Peças da série "O celular da fotógrafa" (SERIE.md) que se repetem de uma parte para outra: as fotos dos ensaios,
// o estúdio da Helena, o celular com WhatsApp e os narradores com cara (o PDF, o comprovante...).
import { $, $$, fase, sai, lerp, pos, attr, ic, ZAP_B, PELE, PELE2, cabeca, dePe, boca, pernas, fecha, barra } from "./historia.mjs";

// ---------- as fotos dos ensaios (desenhos de 100 × 100) ----------
const BEBES = [["#efe3d4", "#d9c4ad", "#c96f55"], ["#e6ebee", "#b9cad6", null], ["#ece8dc", "#cfd6c0", "#f4efe6"], ["#f3e6d6", "#e7c99a", "#a6b8c8"]];
export const ARTE = {
  bebe: v => { const [bg, manta, gorro] = BEBES[v % 4]; return `<rect width="100" height="100" fill="${bg}"/><ellipse cx="52" cy="72" rx="48" ry="22" fill="#fff" opacity=".45"/>
    <ellipse cx="60" cy="64" rx="31" ry="17" fill="${manta}"/><path d="M42 57 Q58 66 80 56 M46 72 Q62 77 84 66" stroke="#000" stroke-opacity=".12" stroke-width="2" fill="none"/>
    <circle cx="47" cy="63" r="3.6" fill="#eab9a0"/><circle cx="34" cy="57" r="14" fill="#eab9a0"/><circle cx="29" cy="62" r="3.2" fill="#e39a86" opacity=".6"/>
    ${gorro ? `<path d="M20 53 Q20 39 34 39 Q48 39 48 53 Q34 47 20 53 Z" fill="${gorro}"/><circle cx="34" cy="37" r="4.2" fill="${gorro}"/>` : ""}
    <g stroke="#6b4a3a" stroke-width="1.4" fill="none" stroke-linecap="round"><path d="M26.5 57 q2.8 2.4 5.6 0"/><path d="M36 57 q2.8 2.4 5.6 0"/></g><path d="M32.6 64 h3" stroke="#a0604c" stroke-width="1.3" stroke-linecap="round"/>`; },
  gestante: v => `<rect width="100" height="100" fill="${["#e9d6cc", "#e2d6cf", "#dfe3dc"][v % 3]}"/><circle cx="72" cy="24" r="14" fill="#fff" opacity=".4"/>
    <path d="M38 22 Q36 46 40 52 L52 50 Q56 30 52 22 Z" fill="#4a2c1c"/><circle cx="46" cy="26" r="8.5" fill="${PELE}"/>
    <path d="M40 34 Q36 50 38 60 Q30 76 28 100 L68 100 Q64 74 58 62 Q74 56 64 42 Q58 34 52 34 Z" fill="${["#f4efe6", "#c98a73", "#f4efe6"][v % 3]}"/><circle cx="58" cy="54" r="3.6" fill="${PELE}"/><circle cx="62" cy="58" r="3.4" fill="${PELE}"/>`,
  familia: v => `<rect width="100" height="100" fill="${["#e7ded2", "#dfe6e0"][v % 2]}"/><rect y="82" width="100" height="18" fill="#000" opacity=".06"/>
    <path d="M18 100 Q18 64 34 62 Q50 64 50 100 Z" fill="#7a8f6a"/><circle cx="34" cy="46" r="11" fill="${PELE}"/><path d="M23 45 Q24 33 34 33 Q44 33 45 43 Q36 38 23 45 Z" fill="#3b2418"/>
    <path d="M50 100 Q50 66 66 64 Q82 66 82 100 Z" fill="#c47b6a"/><circle cx="66" cy="48" r="11" fill="#c4876a"/><path d="M54 52 Q53 34 66 34 Q79 34 78 52 Q74 40 66 40 Q58 40 54 52 Z" fill="#5a3a22"/>
    <path d="M40 100 Q40 80 50 79 Q60 80 60 100 Z" fill="#e0b04a"/><circle cx="50" cy="70" r="8" fill="${PELE}"/>`,
  flor: () => `<rect width="100" height="100" fill="#f3e3e8"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="32" rx="12" ry="20" fill="#e79bb0" transform="rotate(${a} 50 50)"/>`).join("")}<circle cx="50" cy="50" r="11" fill="#f2c25a"/>
    <path d="M50 62 Q48 82 52 98" stroke="#6f8f5a" stroke-width="5" fill="none"/><ellipse cx="62" cy="82" rx="10" ry="5" fill="#6f8f5a" transform="rotate(-30 62 82)"/>`,
};
export const arte = (tipo, v = 0) => `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${ARTE[tipo](v)}</svg>`;

// ---------- o estúdio da Helena (cena de 1080 × 1920; Helena de pé, com a câmera e o celular) ----------
export const HELENA = { id: "he", cabelo: "coque", corCabelo: "#2b1a12", brinco: "#e0b04a", roupa: "#2f4b5a", braco: "#2f4b5a", calca: "#1e2528", bracos: "celular" };
const CAMERA = `<path d="M-38 -284 L-30 -206 M38 -284 L30 -206" stroke="#141819" stroke-width="5" fill="none"/><g transform="translate(-22 -196)"><rect x="-34" y="-22" width="68" height="44" rx="9" fill="#1e2528"/><rect x="-22" y="-30" width="20" height="10" rx="3" fill="#1e2528"/><circle cx="2" cy="0" r="15" fill="#3b4447" stroke="#8c9598" stroke-width="3.5"/><circle cx="2" cy="0" r="6" fill="#0b0f11"/></g>`;
export const estudio = () => `<g id="g-estudio"><rect id="es-parede" width="1080" height="1920" fill="#3a4a58"/>
    <g><rect x="690" y="520" width="300" height="420" rx="16" fill="#1c2a33"/><rect id="es-ceu" x="706" y="536" width="268" height="388" rx="10" fill="#9cc6e0"/>
      <circle id="es-sol" cx="850" cy="650" r="48" fill="#f2c25a"/><path d="M840 536 V924 M706 730 H974" stroke="#1c2a33" stroke-width="12"/></g>
    <g><rect x="120" y="590" width="230" height="280" rx="10" fill="#c9a77c"/><svg x="132" y="602" width="206" height="256" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${ARTE.gestante(0)}</svg></g>
    <g><rect x="386" y="650" width="200" height="200" rx="10" fill="#c9a77c"/><svg x="398" y="662" width="176" height="176" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${ARTE.bebe(0)}</svg></g>
    <g transform="translate(930 1720)"><rect x="-6" y="-560" width="12" height="560" fill="#3a3f45"/><path d="M-40 0 L0 -60 L40 0" stroke="#3a3f45" stroke-width="10" fill="none"/>
      <path d="M-80 -620 L80 -620 L56 -500 L-56 -500 Z" fill="#e9e3d6"/><path d="M-80 -620 L80 -620 L74 -598 L-74 -598 Z" fill="#1e2528"/></g>
    <rect y="1720" width="1080" height="200" fill="#141a1d"/><rect y="1712" width="1080" height="12" fill="#1f2b33"/>
    <g id="he-pos">${dePe(HELENA)}${CAMERA}</g></g>`;
// Helena no estúdio: posição, expressão ("sorriso" | "reta" | "triste" | "oh") e o rosto corado de vergonha
export function helena(t, { x = 300, jeito = "sorriso", corada = 0, olhos = null } = {}) {
  attr($("#he-pos"), "transform", `translate(${x.toFixed(1)} 1730) scale(1.75)`);
  pernas("he", t, false); boca("he", jeito);
  fecha("he", olhos !== null ? olhos : (t % 2.9) < 0.12 ? 1 : 0);
  attr($("#hesob"), "transform", jeito === "triste" ? "translate(0 5)" : jeito === "oh" ? "translate(0 -7)" : "");
  let c = $("#he-cora");
  if (!c) { $("#hecab").insertAdjacentHTML("beforeend", `<g id="he-cora"><ellipse cx="-24" cy="-334" rx="11" ry="6" fill="#e0606a"/><ellipse cx="24" cy="-334" rx="11" ry="6" fill="#e0606a"/></g>`); c = $("#he-cora"); }
  attr(c, "opacity", (0.55 * corada).toFixed(3));
}

// ---------- o comprovante de Pix, com cara (parte 2) ----------
export function recibo(p) {
  return `<g id="${p}"><ellipse cx="0" cy="186" rx="96" ry="12" fill="#000" opacity=".28"/>
    <path d="M-100 -170 H100 V150 L83 168 L67 150 L50 168 L33 150 L17 168 L0 150 L-17 168 L-33 150 L-50 168 L-67 150 L-83 168 L-100 150 Z" fill="#fbf8f3"/>
    <circle cx="-62" cy="-132" r="16" fill="#25a35a"/><path d="M-69 -132 L-63 -126 L-54 -138" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="-38" y="-125" font-family="Geist" font-weight="800" font-size="20" fill="#1e2528">Pix enviado</text>
    <text x="0" y="-74" text-anchor="middle" font-family="Geist" font-weight="800" font-size="34" letter-spacing="-1" fill="#1e2528">R$ 300,00</text>
    <g fill="#e2dbd0"><rect x="-70" y="96" width="140" height="10" rx="5"/><rect x="-50" y="118" width="100" height="10" rx="5"/></g>
    <g id="${p}sob" fill="#3a2f2a"><rect x="-58" y="-34" width="36" height="8" rx="4"/><rect x="22" y="-34" width="36" height="8" rx="4"/></g>
    <g id="${p}olhos"><circle cx="-40" cy="-6" r="14" fill="#1e2528"/><circle cx="40" cy="-6" r="14" fill="#1e2528"/><circle cx="-35" cy="-11" r="4.5" fill="#fff"/><circle cx="45" cy="-11" r="4.5" fill="#fff"/></g>
    <circle cx="-70" cy="28" r="12" fill="#e8855e" opacity=".22"/><circle cx="70" cy="28" r="12" fill="#e8855e" opacity=".22"/>
    <path id="${p}sorriso" d="M-20 34 Q0 56 20 34" stroke="#7a3d2e" stroke-width="7" fill="none" stroke-linecap="round" opacity="0"/>
    <path id="${p}reta" d="M-15 42 H15" stroke="#7a3d2e" stroke-width="7" stroke-linecap="round"/>
    <path id="${p}triste" d="M-18 50 Q0 32 18 50" stroke="#7a3d2e" stroke-width="7" fill="none" stroke-linecap="round" opacity="0"/>
    <ellipse id="${p}oh" cx="0" cy="42" rx="11" ry="14" fill="#7a3d2e" opacity="0"/></g>`;
}
// expressão de um narrador desenhado (PDF, comprovante): boca, olhos (0 aberto, 1 fechado), sobrancelhas (-1 a 1)
export function cara(p, b, olho = 0, sob = 0, cy = -6) {
  boca(p, b);
  attr($(`#${p}olhos`), "transform", olho > 0 ? `translate(0 ${cy}) scale(1 ${lerp(1, 0.1, olho).toFixed(3)}) translate(0 ${-cy})` : "");
  const sb = $(`#${p}sob`).children;
  attr(sb[0], "transform", `translate(0 ${(-10 * sob).toFixed(1)}) rotate(${(sob < 0 ? 14 * sob : 0).toFixed(1)} -40 -30)`);
  attr(sb[1], "transform", `translate(0 ${(-10 * sob).toFixed(1)}) rotate(${(sob < 0 ? -14 * sob : 0).toFixed(1)} 40 -30)`);
}

// ---------- o celular ----------
export const TK = c => `<svg class="tk" viewBox="0 0 26 18" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 9.5 6 14 14.5 4"/><path d="M10.5 13 12 14 20.5 4"/></svg>`;
export const ZAP_V = ZAP_B.replace('fill="#fff"', 'fill="#25d366"');
// monta o celular em #fa com as telas dadas e devolve as ajudas: mostrar uma tela, achar o centro de um elemento, o dedo
export function celular(telas, hora = "21:14") {
  const FA = $("#fa");
  FA.innerHTML = `<span class="exemplo claro">exemplo</span><div class="visor">${barra(hora)}${telas}<div class="dedo" id="dedo"></div></div>`;
  const VISOR = $(".visor", FA);
  const mostra = id => $$(".tela", FA).forEach(el => { el.style.display = el.id === id ? "block" : "none"; });
  const centro = el => { let x = el.offsetWidth / 2, y = el.offsetHeight / 2; for (let e = el; e && e !== VISOR; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };
  function toque(t, t0, el) {
    const d = $("#dedo"), x = fase(t, t0 - 0.4, t0 + 0.25), [cx, cy] = centro(el);
    d.style.left = `${cx}px`; d.style.top = `${cy}px`;
    pos(d, { s: lerp(1.5, 0.8, sai(x)), o: x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0 });
  }
  const hora_ = h => { $(".status .hora", FA).textContent = h; };
  return { FA, VISOR, mostra, centro, toque, hora: hora_ };
}
// a capa da parte 1 em miniatura (o PDF com cara), para o cartão do resumo
export const MINI_P1 = `<svg viewBox="0 0 150 200"><rect width="150" height="200" fill="#111618"/>
  <text x="75" y="34" text-anchor="middle" font-family="Geist" font-weight="800" font-size="17" fill="#f6f3ee">Só <tspan fill="#e8855e">quatro</tspan> me</text>
  <text x="75" y="54" text-anchor="middle" font-family="Geist" font-weight="800" font-size="17" fill="#f6f3ee">abriram</text>
  <g transform="translate(75 128) scale(.3)"><path d="M-130 -170 H66 L130 -106 V166 Q130 180 116 180 H-116 Q-130 180 -130 166 Z" fill="#fbf8f3"/><path d="M66 -170 V-120 Q66 -106 80 -106 H130 Z" fill="#d6cec1"/>
    <path d="M-130 108 H130 V166 Q130 180 116 180 H-116 Q-130 180 -130 166 Z" fill="#b25134"/><circle cx="-48" cy="-6" r="17" fill="#1e2528"/><circle cx="48" cy="-6" r="17" fill="#1e2528"/>
    <path d="M-24 40 Q0 66 24 40" stroke="#7a3d2e" stroke-width="8" fill="none" stroke-linecap="round"/></g></svg>`;
export { PELE, PELE2, cabeca };
