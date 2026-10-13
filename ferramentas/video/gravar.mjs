// Vídeo de apresentação de uma demo (MP4 vertical 1080 × 1920, 30 quadros por segundo, ~30 s): abertura com a
// marca da ótica, o site rolando no celular com legendas e toques, e fechamento. Vai para a ótica no WhatsApp.
// Uso: node ferramentas/video/gravar.mjs gravacoes/<id-do-lead>.json [saida.mp4] [--ensaio]
//   Sem saída, grava gravacoes/<id>.mp4 (vai ao ar em /gravacao/<id>.mp4; o painel baixa pelo link_gravacao).
//   --ensaio: não grava o vídeo; tira 1 quadro por parada (com a legenda) e das cartelas, em <saida>-ensaio/,
//   para conferir o roteiro em ~20 s. O roteiro padrão sai de: node ferramentas/video/roteiro.mjs <pasta-da-demo>
//
// Grava quadro a quadro com o relógio da página parado (page.clock) e as animações CSS avançadas à mão: cada
// quadro é exatamente 1/30 s, sem engasgo, mesmo com a máquina lenta. O roteiro (JSON) traz:
//   demo (pasta em demos/), marca, local, cores: { fundo, fundo2, acento, claro }, fontes: { titulo, texto },
//   hora (ISO, para "Aberto agora" sair certo), abertura: { selo, foto (seletor da foto na demo) },
//   abertura.estilo "montagem" (fotos: [seletores], 3 a 4, em tela cheia com movimento lento; rotulos_fotos; nome: [linha, destaque],
//   frase) e fechamento.estilo "rolagem" (o site inteiro rolando dentro de um celular): versão "show".
//   fechamento: { titulo, destaque, convite }, musica: "auto" (trilha original de musica.py) | caminho de um
//   arquivo de áudio | ausente (faixa muda), volume_musica (1), resolucao: 720 (padrão leve, ~4 MB; o WhatsApp
//   reduz para isso de todo jeito) | 1080 (Instagram), crf (23),
//   clima: "leve" (padrão) | "sobrio" (confiança: trocas lentas, nome reto, rolagem calma) | "descolado" (cortes
//   rápidos, nome em caixa alta, rolagem ágil) | "grife" (fusões longas, nome fino e espaçado, tudo mais devagar);
//   vale para a montagem, a rolagem e a trilha (musica.py --clima).
//   cenas: [{ rolar: seletor | número (topo da página), alinhar: "centro" | "topo", ajuste (px), mover (s),
//            segura (s), legenda, legenda_no_topo, acoes: [{ em (s depois de parar), tipo: "deslizar" | "tocar", alvo, cartoes, dur, clicar }] }]
//   Site que já está no ar (vídeo de divulgação para o cliente postar): url no lugar de demo, e assinatura com o
//   texto do canto das cartelas ("@loja", "" para nada) no lugar de "feito pela Renderiza" / "Renderiza · renderizaweb.com.br".
//   legenda_baixo: distância da legenda até o pé da tela, em px de 720 (96). Para Reels e Stories, ~170: fica acima da
//   descrição e dos botões que o Instagram põe por cima do vídeo.
//   formato: "reels" (pedido do Kaue, 13/10/2026, no jeito do Reels da Renderiza em instagram/): no meio do vídeo o
//   site real roda dentro de um celular, na parte de baixo, e em cima fica a legenda grande, que conta a história e
//   explica, em frases completas ("Lê o que *os clientes contam.*"; o trecho entre * sai na cor da marca; "sub" é a
//   linha de apoio, que explica a frase). O ensaio avisa quando a legenda encosta no celular.
//   Abertura e fechamento continuam os mesmos. Cada legenda fica até a próxima entrar.
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spkiProxy } from "../proxy.mjs";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FFMPEG = process.env.FFMPEG || "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2";
const argumentos = process.argv.slice(2);
const ENSAIO = argumentos.includes("--ensaio");
const [caminhoRoteiro, saidaArg] = argumentos.filter(x => !x.startsWith("--"));
if (!caminhoRoteiro) { console.error("Uso: node ferramentas/video/gravar.mjs gravacoes/<id>.json [saida.mp4] [--ensaio]"); process.exit(1); }
const R = JSON.parse(readFileSync(caminhoRoteiro, "utf8"));
const saida = resolve(saidaArg || join(dirname(caminhoRoteiro), basename(caminhoRoteiro, ".json") + ".mp4"));
const tmp = join(dirname(saida), ".tmp-" + basename(saida, ".mp4"));
const pastaEnsaio = saida.replace(/\.mp4$/, "") + "-ensaio";
mkdirSync(ENSAIO ? pastaEnsaio : tmp, { recursive: true });

const FPS = 30, DT = 1000 / FPS;
const VIEW = { width: 405, height: 720 }, ESCALA = 8 / 3; // 405 × 720 no celular = 1080 × 1920 no vídeo
const MONTAGEM = R.abertura?.estilo === "montagem", ROLAGEM = R.fechamento?.estilo === "rolagem";
// Reels: a tela do celular (em px do vídeo final 1080 × 1920) e o site nela, num celular de 390 × 740 (1,6×).
const REELS = R.formato === "reels";
const TELA_R = { x: 228, y: 690, w: 624, h: 1184 }, SITE_VIEW = REELS ? { width: 390, height: 740 } : VIEW, SITE_ESC = REELS ? 1.6 : ESCALA;
// Clima: troca das fotos da montagem (fusão e movimento), o desenho do nome e a velocidade da rolagem.
const CLIMAS = {
  leve: { fusao: 0.45, kb: ["scale(1.14)", "scale(1.02)", "scale(1.03) translateX(-8px)", "scale(1.13) translateX(6px)"], mover: [0.75, 1.4] },
  sobrio: { fusao: 0.8, kb: ["scale(1.08)", "scale(1)", "scale(1)", "scale(1.07)"], mover: [0.95, 1.6] },
  descolado: { fusao: 0.16, kb: ["scale(1.2) rotate(-1deg)", "scale(1.04)", "scale(1.04) translateX(-12px)", "scale(1.18) translateX(10px) rotate(1deg)"], mover: [0.62, 1.1] },
  grife: { fusao: 1.0, kb: ["scale(1.07)", "scale(1)", "scale(1)", "scale(1.06)"], mover: [1.0, 1.7] },
};
const CLIMA = R.clima || "leve", K = CLIMAS[CLIMA];
if (!K) throw new Error("clima desconhecido: " + CLIMA);
const ABERTURA = R.abertura?.dur || (MONTAGEM ? 5.6 : 3.2), FECHAMENTO = R.fechamento?.dur || (ROLAGEM ? 5.4 : 3.8), FUSAO = 0.5;
const c = { fundo: "#2b2c3b", fundo2: "#1b1c26", acento: "#d6ae66", claro: "#fffdf6", ...R.cores };
const fT = R.fontes?.titulo || "Montserrat", fX = R.fontes?.texto || "DM Sans";
const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const suave = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // ease-in-out cúbico
const entre = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

const PROXY = (process.env.HTTPS_PROXY || "").replace(/^https?:\/\//, "");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", "--hide-scrollbars", ...(PROXY ? ["--ignore-certificate-errors-spki-list=" + spkiProxy(), "--proxy-server=https=" + PROXY] : [])] });
const contexto = (viewport = VIEW, deviceScaleFactor = ESCALA) => browser.newContext({ viewport, deviceScaleFactor, isMobile: true, hasTouch: true, locale: "pt-BR", timezoneId: "America/Sao_Paulo",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });

// Avança as animações CSS (transições e @keyframes) do mesmo tanto que o relógio: nada corre sozinho entre quadros.
const AVANCAR = () => {
  window.__quadro = dt => {
    for (const a of document.getAnimations()) {
      if (a.__vt === undefined) { a.__vt = 0; a.pause(); }
      a.__vt += dt;
      a.currentTime = a.__vt;
    }
  };
};

/** Encoder: recebe JPEGs e grava um MP4 intermediário quase sem perda. */
function codificador(arquivo) {
  const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p", arquivo], { stdio: ["pipe", "inherit", "inherit"] });
  const fim = new Promise((ok, falha) => ff.on("close", code => (code === 0 ? ok() : falha(new Error("ffmpeg saiu com " + code)))));
  return {
    quadro: buf => new Promise(ok => (ff.stdin.write(buf) ? ok() : ff.stdin.once("drain", ok))),
    fechar: () => { ff.stdin.end(); return fim; },
  };
}
// Captura pelo Playwright: ele respeita a escala do celular (o CDP direto volta a 1x e sai 405 × 720).
const capturar = p => p.screenshot({ type: "jpeg", quality: 92, caret: "hide" });

/* ---------- 1. o site rolando ---------- */
const ctx = await contexto(SITE_VIEW, SITE_ESC);
const pagina = await ctx.newPage();
await pagina.clock.install({ time: new Date(R.hora || "2026-10-06T10:30:00-03:00") });
await pagina.addInitScript(AVANCAR);
await pagina.goto(R.url || "file://" + join(RAIZ, "demos", R.demo, "index.html"), { waitUntil: "load", timeout: 90000 });
await pagina.evaluate(async () => {
  document.documentElement.style.scrollBehavior = "auto";
  document.querySelectorAll("img[loading=lazy]").forEach(i => { i.loading = "eager"; });
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  await document.fonts.ready;
});
await pagina.clock.runFor(800);
await pagina.waitForTimeout(600);

// Camada por cima do site: legenda e o "dedo" que mostra os toques.
const BAIXO = R.legenda_baixo ?? 96;
await pagina.evaluate(({ c, fX, BAIXO }) => {
  const css = document.createElement("style");
  css.textContent = `
  #__legenda{position:fixed;left:50%;bottom:${BAIXO}px;z-index:2147483646;transform:translate(-50%,0);max-width:340px;width:max-content;
    display:flex;align-items:center;gap:10px;padding:13px 20px 13px 16px;border-radius:999px;background:${c.fundo}f2;color:${c.claro};
    font:600 17px/1.25 "${fX}",system-ui,sans-serif;letter-spacing:-.1px;box-shadow:0 14px 34px #0000004d,0 0 0 1px #ffffff14;opacity:0;pointer-events:none}
  #__legenda i{flex:none;width:9px;height:9px;border-radius:50%;background:${c.acento};box-shadow:0 0 0 4px ${c.acento}33}
  #__dedo{position:fixed;left:0;top:0;z-index:2147483647;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;pointer-events:none;
    background:#ffffff59;border:2px solid #fffffff2;box-shadow:0 6px 18px #0000004d;opacity:0}
  #__dedo b{position:absolute;inset:-2px;border-radius:50%;border:2px solid #fff;opacity:0}`;
  document.head.append(css);
  const leg = document.createElement("div"); leg.id = "__legenda"; leg.innerHTML = "<i></i><span></span>";
  const dedo = document.createElement("div"); dedo.id = "__dedo"; dedo.innerHTML = "<b></b>";
  document.body.append(leg, dedo);
}, { c, fX, BAIXO });

// Mede onde cada cena para (posição de rolagem) e monta a linha do tempo. Com legenda embaixo, procura perto
// do ponto pedido a parada em que a faixa da legenda não cobre título nem texto (e o alvo continua inteiro na tela).
const medidas = await pagina.evaluate(({ cenas, BAIXO, REELS }) => {
  const vh = innerHeight, cab = (document.querySelector(".site-header")?.offsetHeight || 70);
  const max = document.documentElement.scrollHeight - vh;
  const faixa = { topo: vh - BAIXO - 46 - 10, base: vh - BAIXO + 10, esq: 30, dir: innerWidth - 30 };
  // Posição final na página: desconta o deslocamento das animações de entrada (.reveal desce 22 px até aparecer).
  const desvio = e => { let dy = 0; for (let x = e; x && x !== document.body; x = x.parentElement) { const t = getComputedStyle(x).transform; if (t && t !== "none") dy += new DOMMatrix(t).m42; } return dy; };
  const abs = e => { const r = e.getBoundingClientRect(), dy = desvio(e); return { top: r.top + scrollY - dy, bottom: r.bottom + scrollY - dy, left: r.left, right: r.right, h: r.height }; };
  // nas demos o conteúdo fica em <main>; num site sem <main>, vale a página inteira (fora o topo fixo)
  const em = document.querySelector("main") ? "main " : "";
  const seletor = ["h1", "h2", "h3", "p", "li", "blockquote", "img", ".stat", ".button", ".btn"].map(x => em + x).join(", ");
  const textos = [...document.querySelectorAll(seletor + ", footer p, footer a, footer h2, footer strong")]
    .filter(e => e.offsetHeight > 0 && !e.closest("#__legenda, #__dedo, header, .site-header"))
    .map(e => ({ ...abs(e), peso: /^H\d$/.test(e.tagName) ? 6 : e.tagName === "IMG" ? 0.6 : 4 }));
  const limitar = y => Math.round(Math.max(0, Math.min(max, y)));
  return cenas.map(ce => {
    if (typeof ce.rolar === "number") return { y: limitar(ce.rolar) };
    const e = document.querySelector(ce.rolar);
    if (!e) return { y: null, erro: "não achei " + ce.rolar };
    const a = abs(e);
    const y0 = limitar((ce.alinhar === "topo" ? a.top - cab - 10 : a.top + a.h / 2 - (cab + (vh - cab) / 2)) + (ce.ajuste || 0));
    if (!ce.legenda || ce.legenda_no_topo || REELS) return { y: y0 }; // no Reels a legenda fica fora do site
    let melhor = y0, nota = Infinity;
    for (let d = -240; d <= 240; d += 3) {
      const y = limitar(y0 + d);
      const cabe = a.h <= faixa.topo - cab - 12;
      if (a.top - y < cab + 2 || (cabe && a.bottom - y > faixa.topo - 4)) continue; // alvo cortado ou embaixo da legenda
      let n = Math.abs(d) * 0.12;
      for (const t of textos) {
        const sobre = Math.min(y + faixa.base, t.bottom) - Math.max(y + faixa.topo, t.top);
        if (sobre > 0 && t.right > faixa.esq && t.left < faixa.dir) n += sobre * t.peso;
      }
      if (n < nota) { nota = n; melhor = y; }
    }
    return { y: melhor };
  });
}, { cenas: R.cenas, BAIXO, REELS });
medidas.forEach((m, i) => { if (m.erro) throw new Error("cena " + (i + 1) + ": " + m.erro); });

const linha = []; // [{ini, fim, de, ate}] rolagem; legendas; ações
const legendas = [], acoes = [];
let t = 0, yAtual = medidas[0].y;
R.cenas.forEach((ce, i) => {
  const y = medidas[i].y;
  if (i > 0 && y !== yAtual) {
    const mover = ce.mover ?? Math.min(K.mover[1], K.mover[0] + Math.abs(y - yAtual) / 3000);
    linha.push({ ini: t, fim: t + mover, de: yAtual, ate: y });
    t += mover;
  }
  yAtual = y;
  const parada = t;
  // no Reels a legenda entra um pouco antes de parar (durante a rolagem) e fica até a próxima
  if (ce.legenda) legendas.push({ ini: REELS && i > 0 ? Math.max(0, t - Math.min(0.45, ce.mover ?? 0.45)) : parada + (i === 0 ? 0.35 : 0.1), fim: parada + ce.segura, texto: ce.legenda, sub: ce.sub, topo: ce.legenda_no_topo });
  (ce.acoes || []).forEach(a => acoes.push({ ...a, ini: parada + a.em, y }));
  t += ce.segura;
});
const DUR_SITE = t;
if (REELS) legendas.forEach((L, k) => { L.fim = k + 1 < legendas.length ? legendas[k + 1].ini : DUR_SITE + 1; });
const yEm = s => { let y = medidas[0].y; for (const seg of linha) { if (s >= seg.fim) y = seg.ate; else if (s > seg.ini) return seg.de + (seg.ate - seg.de) * suave(entre(seg.ini, seg.fim, s)); } return y; };

// Posições dos alvos das ações (em coordenadas da página) para o dedo.
const alvos = await pagina.evaluate(lista => lista.map(a => {
  const e = document.querySelector(a.alvo);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  let dy = 0; // mesma correção das animações de entrada
  for (let x = e; x && x !== document.body; x = x.parentElement) { const t = getComputedStyle(x).transform; if (t && t !== "none") dy += new DOMMatrix(t).m42; }
  const passo = e.children.length > 1 ? e.children[1].offsetLeft - e.children[0].offsetLeft : r.width;
  return { x: r.left + r.width / 2, y: r.top + scrollY - dy + r.height / 2, w: r.width, passo };
}), acoes);
acoes.forEach((a, i) => { if (!alvos[i]) throw new Error("ação sem alvo: " + a.alvo); a.box = alvos[i]; a.dur = a.dur || (a.tipo === "deslizar" ? 0.8 : 0.55); });

// Foto da abertura e a primeira tela do site (para o fechamento).
const fotoAbertura = R.abertura?.foto ? await pagina.evaluate(s => document.querySelector(s)?.src || "", R.abertura.foto) : "";
const fotosMontagem = MONTAGEM ? await pagina.evaluate(sels => sels.map(s => document.querySelector(s)?.src || ""), R.abertura.fotos || []) : [];
if (MONTAGEM && (fotosMontagem.length < 2 || fotosMontagem.some(f => !f))) throw new Error("abertura.fotos: preciso de 2 a 4 seletores de foto que existam na demo");
await pagina.evaluate(() => window.scrollTo(0, 0));
const primeiraTela = "data:image/jpeg;base64," + (await capturar(pagina)).toString("base64");

if (ENSAIO) {
  // Cada parada como vai aparecer: rolagem final, entradas já concluídas e a legenda inteira.
  for (const [i, ce] of R.cenas.entries()) {
    await pagina.evaluate(({ y, texto, topo }) => {
      window.scrollTo({ top: y, behavior: "instant" });
      const L = document.getElementById("__legenda");
      L.lastChild.textContent = texto || ""; L.style.opacity = texto ? 1 : 0; L.style.transform = "translate(-50%, 0)";
      L.style.bottom = topo ? "auto" : ""; L.style.top = topo ? "86px" : "";
    }, { y: medidas[i].y, texto: REELS ? "" : ce.legenda, topo: ce.legenda_no_topo });
    for (let k = 0; k < 4; k++) { await pagina.clock.runFor(250); await pagina.evaluate(() => window.__quadro(400)); }
    await pagina.screenshot({ path: join(pastaEnsaio, `${String(i + 2).padStart(2, "0")}-cena${i + 1}${REELS ? "-site" : ""}.jpg`), type: "jpeg", quality: 80 });
  }
}
const site = ENSAIO ? null : codificador(join(tmp, "site.mp4"));
const clicados = new Set();
const total = ENSAIO ? 0 : Math.round(DUR_SITE * FPS);
const inicio = Date.now();
// a legenda no instante s (no Reels ela vai para a moldura, fora do site)
function legEm(s) {
  let leg = { texto: "", op: 0, dy: 12 };
  for (const L of legendas) {
    if (s < L.ini || s > L.fim) continue;
    const entra = entre(L.ini, L.ini + 0.3, s), sai = 1 - entre(L.fim - 0.25, L.fim, s);
    leg = { texto: L.texto, sub: L.sub, op: Math.min(entra, sai), dy: 12 * (1 - suave(entra)), topo: !!L.topo };
  }
  return leg;
}
for (let f = 0; f < total; f++) {
  const s = f / FPS, y = yEm(s);
  const leg = REELS ? { texto: "", op: 0, dy: 12 } : legEm(s);
  // ações: carrossel e dedo
  const carrosseis = {};
  let dedo = { op: 0, x: 0, y: 0, s: 1, anel: 0 };
  const cliques = [];
  for (const [i, a] of acoes.entries()) {
    const k = entre(a.ini, a.ini + a.dur, s);
    if (a.tipo === "deslizar") {
      const ja = acoes.slice(0, i).filter(b => b.tipo === "deslizar" && b.alvo === a.alvo && s >= b.ini).reduce((n, b) => n + (b.cartoes || 1), 0);
      if (s >= a.ini) carrosseis[a.alvo] = (ja + (a.cartoes || 1) * suave(k)) * a.box.passo;
      if (s >= a.ini - 0.25 && s <= a.ini + a.dur + 0.3) {
        const ap = entre(a.ini - 0.25, a.ini, s), some = 1 - entre(a.ini + a.dur, a.ini + a.dur + 0.3, s);
        dedo = { op: Math.min(ap, some), x: a.box.x + a.box.w * 0.28 - a.box.w * 0.56 * suave(k), y: a.box.y - y, s: 1 - 0.08 * Math.sin(Math.PI * k), anel: 0 };
      }
    } else if (a.tipo === "tocar") {
      if (s >= a.ini - 0.2 && s <= a.ini + a.dur) {
        const ap = entre(a.ini - 0.2, a.ini, s), toque = entre(a.ini, a.ini + a.dur, s);
        dedo = { op: Math.min(ap, 1 - entre(a.ini + a.dur * 0.6, a.ini + a.dur, s)), x: a.box.x, y: a.box.y - y, s: 1 - 0.15 * Math.sin(Math.PI * Math.min(1, toque * 2)), anel: toque };
      }
      const chave = i + ":" + a.alvo;
      if (a.clicar && s >= a.ini + 0.12 && !clicados.has(chave)) { clicados.add(chave); cliques.push(a.alvo); }
    }
  }
  await pagina.evaluate(({ y, leg, carrosseis, dedo, cliques }) => {
    window.scrollTo({ top: y, behavior: "instant" });
    for (const [sel, x] of Object.entries(carrosseis)) {
      const el = document.querySelector(sel);
      el.style.scrollSnapType = "none"; el.style.scrollBehavior = "auto"; el.scrollLeft = x;
    }
    const L = document.getElementById("__legenda");
    if (leg.texto && L.lastChild.textContent !== leg.texto) L.lastChild.textContent = leg.texto;
    L.style.opacity = leg.op; L.style.transform = `translate(-50%, ${leg.dy}px)`;
    L.style.bottom = leg.topo ? "auto" : ""; L.style.top = leg.topo ? "86px" : "";
    const D = document.getElementById("__dedo");
    D.style.opacity = dedo.op; D.style.transform = `translate(${dedo.x}px, ${dedo.y}px) scale(${dedo.s})`;
    D.firstChild.style.opacity = dedo.anel ? 1 - dedo.anel : 0; D.firstChild.style.transform = `scale(${1 + dedo.anel * 1.4})`;
    cliques.forEach(sel => document.querySelector(sel)?.click());
  }, { y, leg, carrosseis, dedo, cliques });
  await pagina.clock.runFor(DT);
  await pagina.evaluate(dt => window.__quadro(dt), DT);
  await site.quadro(await capturar(pagina));
  if (f % 90 === 0) process.stdout.write(`site ${Math.round(s)}s/${Math.round(DUR_SITE)}s (${Math.round((Date.now() - inicio) / 1000)}s)\n`);
}
if (site) await site.fechar();

// Fechamento "rolagem": a página inteira, já com tudo aparecido e sem botões flutuantes, para rolar no celular.
let paginaInteira = "", alturaInteira = 0;
if (ROLAGEM) {
  await pagina.evaluate(() => {
    document.querySelectorAll("#__legenda, #__dedo").forEach(e => e.remove());
    document.querySelectorAll("body *").forEach(e => { if (getComputedStyle(e).position === "fixed") e.style.visibility = "hidden"; });
    document.querySelectorAll(".reveal").forEach(e => e.classList.add("is-visible"));
    document.querySelectorAll("[style*='scroll-snap-type']").forEach(e => { e.scrollLeft = 0; });
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await pagina.evaluate(() => window.__quadro(4000));
  let foto = pagina, ctx3 = null;
  if (R.url) {
    // site no ar: a foto da página inteira sai de uma aba sem o relógio falso, senão o mapa do Google fica em branco
    ctx3 = await contexto(); foto = await ctx3.newPage();
    await foto.goto(R.url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
    await foto.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      document.querySelectorAll("img[loading=lazy], iframe[loading=lazy]").forEach(e => { e.loading = "eager"; });
      for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
      document.querySelectorAll(".reveal").forEach(e => e.classList.add("is-visible"));
      await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
    });
    await foto.waitForTimeout(3000);
    // iframe de outro site (o mapa) fora da tela não é desenhado na foto da página inteira: troca por uma foto dele
    for (const f of await foto.$$("iframe")) {
      await f.scrollIntoViewIfNeeded().catch(() => {});
      await foto.waitForTimeout(2500);
      const b64 = (await f.screenshot({ type: "jpeg", quality: 88 }).catch(() => null))?.toString("base64");
      if (b64) await f.evaluate((el, src) => {
        const img = document.createElement("img"), cs = getComputedStyle(el);
        img.src = src; img.style.cssText = `display:block;width:${el.offsetWidth}px;height:${el.offsetHeight}px;border-radius:${cs.borderRadius}`;
        el.replaceWith(img);
      }, "data:image/jpeg;base64," + b64);
    }
    await foto.evaluate(() => {
      document.querySelectorAll("body *").forEach(e => { if (getComputedStyle(e).position === "fixed") e.style.visibility = "hidden"; });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await foto.waitForTimeout(600);
  }
  alturaInteira = await foto.evaluate(() => document.documentElement.scrollHeight);
  paginaInteira = "data:image/jpeg;base64," + (await foto.screenshot({ fullPage: true, scale: "css", type: "jpeg", quality: 82 })).toString("base64");
  if (ctx3) await ctx3.close();
}
await ctx.close();

/* ---------- 2. abertura e fechamento ---------- */
const simbolo = readFileSync(join(RAIZ, "site", "estatico", "simbolo.svg"), "utf8").replace(/<\?xml[^>]*>/, "");
// o canto das cartelas: a marca da Renderiza nas prévias; no vídeo de um site já no ar, o que o roteiro pedir (ou nada)
const assinatura = (padrao, estilo) => R.assinatura === undefined
  ? `<div class="marca-rz entra" style="${estilo}">${simbolo}<span>${padrao}</span></div>`
  : R.assinatura ? `<div class="marca-rz entra" style="${estilo}"><span>${esc(R.assinatura)}</span></div>` : "";
const base = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${fT.replace(/ /g, "+")}:ital,wght@0,600;0,700;0,800;1,700;1,800&family=${fX.replace(/ /g, "+")}:wght@400;500;600;700&display=block" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=${fT.replace(/ /g, "+")}:ital,wght@0,600;0,700;1,600;1,700&family=${fX.replace(/ /g, "+")}:wght@400;500;600;700&display=block" rel="stylesheet"><!-- fontes que vão só até 700, como a Lora -->
<link href="https://fonts.googleapis.com/css2?family=${fT.replace(/ /g, "+")}:wght@600;700;800&family=${fX.replace(/ /g, "+")}:wght@400;500;600;700&display=block" rel="stylesheet"><!-- fontes sem itálico, como a Outfit -->
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:405px;height:720px;overflow:hidden}
body{font-family:"${fX}",system-ui,sans-serif;color:${c.claro};background:radial-gradient(120% 75% at 80% 8%, ${c.fundo} 0%, ${c.fundo2} 72%);position:relative}
.bola{position:absolute;border-radius:50%;background:${c.acento}}
.entra{animation:entra .9s cubic-bezier(.2,.8,.2,1) both}
.foto-entra{animation:foto 1.1s cubic-bezier(.2,.8,.2,1) both}
@keyframes entra{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes foto{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
.vivo{animation:vivo 1.4s cubic-bezier(.2,.8,.2,1) both}
.assenta{animation:assenta 1s cubic-bezier(.2,.8,.2,1) both}
@keyframes vivo{from{transform:scale(1.05)}to{transform:none}}
@keyframes assenta{from{transform:translateY(12px)}to{transform:none}}
@keyframes cresce{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes linha{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.selo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:12px;letter-spacing:3.2px;text-transform:uppercase;color:${c.acento}}
.selo:before{content:"";width:28px;height:2px;background:${c.acento};transform-origin:left;animation:linha .8s .1s ease both}
.marca-rz{display:flex;align-items:center;gap:8px;font-size:12.5px;color:${c.claro};opacity:.78;font-weight:500}
.marca-rz svg{width:18px;height:18px}
</style></head><body>`;

// Nome de 3+ palavras: as duas últimas ficam juntas ("Óptica / Cris Masson"), se couberem numa linha.
function marcaEmLinhas(m) {
  const p = String(m || "").trim().split(/\s+/);
  return p.length >= 3 && (p.at(-2) + " " + p.at(-1)).length <= 12 ? [...p.slice(0, -2), p.at(-2) + "&nbsp;" + p.at(-1)].map((x, i, a) => (i === a.length - 1 ? x.split("&nbsp;").map(esc).join("&nbsp;") : esc(x))).join(" ") : esc(m);
}
const abertura = base + `
<div class="bola" style="width:150px;height:150px;right:-48px;top:-44px;animation:cresce 1s .05s cubic-bezier(.2,.8,.2,1) both"></div>
<div class="bola" style="width:46px;height:46px;right:40px;top:170px;animation:cresce .8s .35s cubic-bezier(.2,.8,.2,1) both"></div>
<div class="bola" style="width:300px;height:300px;left:-170px;bottom:40px;opacity:.08"></div>
<div style="position:absolute;left:36px;top:92px;right:36px">
  <p class="selo entra" style="animation-delay:.05s">${esc(R.abertura?.selo || "Prévia do site")}</p>
</div>
${fotoAbertura ? `<div class="vivo" style="position:absolute;left:72px;top:138px;width:261px;height:300px;border-radius:131px 131px 26px 26px;overflow:hidden;border:5px solid ${c.acento};box-shadow:0 26px 60px #00000066;animation-delay:.15s">
  <img src="${fotoAbertura}" style="width:100%;height:100%;object-fit:cover;object-position:${R.abertura?.pos || "50% 30%"}"></div>` : ""}
<div style="position:absolute;left:36px;right:36px;top:470px">
  <p class="entra" style="animation-delay:.35s;font-size:15px;opacity:.85;font-weight:500">${esc(R.abertura?.chamada || "O novo site da")}</p>
  <h1 class="assenta" style="font-family:'${fT}',sans-serif;font-weight:800;font-size:44px;line-height:1.02;letter-spacing:-1px;margin-top:6px;color:#fff;text-wrap:balance">${marcaEmLinhas(R.marca)}</h1>
  <p class="entra" style="animation-delay:.6s;margin-top:12px;font-size:14px;font-weight:600;color:${c.acento}">${esc(R.local)}</p>
</div>
${assinatura("feito pela Renderiza", "position:absolute;left:36px;bottom:44px;animation-delay:.8s")}
</body></html>`;

// Abertura "montagem": fotos da demo em tela cheia, uma cobrindo a outra, com movimento lento (Ken Burns);
// o nome já está no 1º quadro (vira a miniatura no WhatsApp) e a frase da ótica entra no fim.
const PASSO = (ABERTURA - 0.6) / Math.max(1, fotosMontagem.length);
const trocas = fotosMontagem.map((_, i) => +(i * PASSO).toFixed(2)).slice(1);
const nome = R.abertura?.nome || [R.marca];
// O nome na montagem: duas linhas (a de cima menor, o destaque grande na cor da marca), com o desenho do clima.
function nomeMontagem() {
  // Nome comprido encolhe; com mais de uma palavra, quebra em duas linhas equilibradas antes de encolher.
  const destaque = nome[1] || nome[0], palavras = destaque.split(" ");
  const linha = destaque.length > 11 && palavras.length > 1
    ? Math.min(...palavras.slice(1).map((_, k) => Math.max(palavras.slice(0, k + 1).join(" ").length, palavras.slice(k + 1).join(" ").length)))
    : destaque.length;
  const tam = Math.min(58, Math.round(330 / Math.max(5, linha * 0.6)));
  if (nome.length < 2) return `<span style="font-size:44px">${esc(nome[0])}</span>`;
  if (CLIMA === "grife") return `<span style="display:block;font-size:13px;font-weight:600;letter-spacing:6px;text-transform:uppercase;opacity:.9;margin-bottom:10px">${esc(nome[0])}</span><span style="display:block;font-size:${tam}px;font-weight:600;letter-spacing:1px;color:${c.acento};text-wrap:balance">${esc(nome[1])}</span>`;
  if (CLIMA === "descolado") return `<span style="display:block;font-size:24px;font-weight:700;opacity:.95">${esc(nome[0])}</span><span style="display:inline-block;margin-top:6px;padding:2px 12px 6px;background:${c.acento};color:${c.fundo2};font-size:${Math.min(54, tam)}px;font-weight:800;letter-spacing:-1px;text-transform:uppercase;transform:rotate(-2deg);transform-origin:left">${esc(nome[1])}</span>`;
  if (CLIMA === "sobrio") return `<span style="display:block;font-size:26px;font-weight:600;opacity:.92">${esc(nome[0])}</span><span style="display:block;font-size:${tam}px;font-weight:800;letter-spacing:-1px;color:${c.acento};text-wrap:balance">${esc(nome[1])}</span>`;
  return `<span style="display:block;font-size:27px;font-weight:600;opacity:.92">${esc(nome[0])}</span><em style="display:block;font-size:${tam}px;color:${c.acento};font-style:italic;text-wrap:balance">${esc(nome[1])}</em>`;
}
const aberturaMontagem = base + `
<style>
.quadro{position:absolute;inset:0;overflow:hidden}
.quadro img{width:100%;height:100%;object-fit:cover;display:block}
@keyframes surge{from{opacity:0}to{opacity:1}}
@keyframes kb0{from{transform:${K.kb[0]}}to{transform:${K.kb[1]}}}
@keyframes kb1{from{transform:${K.kb[2]}}to{transform:${K.kb[3]}}}
.veu{position:absolute;inset:0;background:linear-gradient(180deg, ${c.fundo2}cc 0%, ${c.fundo2}00 22%, ${c.fundo2}00 44%, ${c.fundo2}e6 70%, ${c.fundo2} 100%)}
</style>
${fotosMontagem.map((src, i) => `<div class="quadro" style="z-index:${i + 1};${i ? `animation:surge ${K.fusao}s ${(i * PASSO - (K.fusao > 0.5 ? K.fusao / 2 : 0)).toFixed(2)}s ease both` : ""}">
  <img src="${src}" style="object-position:${(R.abertura.pos_fotos || [])[i] || "50% 30%"};animation:kb${i % 2} ${(PASSO + 0.9).toFixed(2)}s ${(i * PASSO).toFixed(2)}s linear both"></div>`).join("")}
${fotosMontagem.map((_, i) => (R.abertura.rotulos_fotos || [])[i] ? `<span style="position:absolute;z-index:${22 + i};right:32px;top:54px;min-width:86px;text-align:center;padding:7px 12px;border-radius:999px;background:${c.acento};color:${c.fundo2};font:700 12px/1 '${fX}',sans-serif;letter-spacing:2.4px;text-transform:uppercase;box-shadow:0 6px 18px #0000004d;${i ? `animation:surge .35s ${(i * PASSO).toFixed(2)}s ease both` : ""}">${esc(R.abertura.rotulos_fotos[i])}</span>` : "").join("")}
<div class="veu" style="z-index:20"></div>
<div style="position:absolute;z-index:21;left:32px;top:58px;right:32px"><p class="selo entra" style="animation-delay:.05s">${esc(R.abertura?.selo || "Prévia do site")}</p></div>
<div style="position:absolute;z-index:21;left:32px;right:32px;bottom:112px">
  <p class="entra" style="animation-delay:.3s;font-size:15px;opacity:.88;font-weight:500">${esc(R.abertura?.chamada || "O novo site da")}</p>
  <h1 class="assenta" style="font-family:'${fT}',serif;font-weight:700;line-height:.98;margin-top:8px;color:#fff;letter-spacing:-.5px">
    ${nomeMontagem()}
  </h1>
  <p class="entra" style="animation-delay:.55s;margin-top:14px;font-size:14px;font-weight:600;color:${c.claro};opacity:.9">${esc(R.local)}</p>
  ${R.abertura?.frase ? `<p class="entra" style="animation-delay:${(ABERTURA - 2.2).toFixed(2)}s;margin-top:18px;font-family:'${fT}',serif;font-style:${CLIMA === "leve" || CLIMA === "grife" ? "italic" : "normal"};font-size:19px;color:${CLIMA === "grife" ? c.claro : c.acento}">“${esc(R.abertura.frase)}”</p>` : ""}
</div>
${assinatura("feito pela Renderiza", "position:absolute;z-index:21;left:32px;bottom:44px;animation-delay:.8s")}
</body></html>`;

const F = R.fechamento || {};
// Fechamento "rolagem": o site inteiro passando dentro de um celular enquanto o convite aparece.
const TELA = { w: 196, h: 348 };
const desce = Math.max(0, Math.round(alturaInteira * TELA.w / SITE_VIEW.width - TELA.h));
const fechamentoRolagem = base + `
<style>@keyframes rola{from{transform:translateY(0)}to{transform:translateY(-${desce}px)}}</style>
<div class="bola" style="width:150px;height:150px;left:-50px;top:-50px;animation:cresce 1s cubic-bezier(.2,.8,.2,1) both"></div>
<div class="bola" style="width:300px;height:300px;right:-170px;bottom:60px;opacity:.08"></div>
<div class="foto-entra" style="position:absolute;left:${(VIEW.width - TELA.w - 16) / 2}px;top:46px;padding:8px;border-radius:32px;background:#0d0d12;box-shadow:0 30px 70px #00000088,0 0 0 1px #ffffff26;animation-delay:.05s">
  <div style="width:${TELA.w}px;height:${TELA.h}px;border-radius:24px;overflow:hidden;background:#fff">
    <img src="${paginaInteira}" style="width:100%;display:block;animation:rola ${(FECHAMENTO - 1.2).toFixed(2)}s .45s cubic-bezier(.55,0,.25,1) both">
  </div>
</div>
<div style="position:absolute;left:34px;right:34px;top:452px">
  <h2 class="entra" style="animation-delay:.3s;font-family:'${fT}',serif;font-weight:700;font-size:33px;line-height:1.08;letter-spacing:-.6px;color:#fff">${esc(F.titulo || "Seu site novo")}<br><em style="color:${c.acento}">${esc(F.destaque || "já está pronto.")}</em></h2>
  <p class="entra" style="animation-delay:.6s;margin-top:16px;font-size:16px;line-height:1.45;opacity:.92">${esc(F.convite || "Gostou? É só responder esta mensagem.")}</p>
</div>
${assinatura("Renderiza · renderizaweb.com.br", "position:absolute;left:34px;bottom:44px;animation-delay:.9s")}
</body></html>`;

const fechamento = base + `
<div class="bola" style="width:150px;height:150px;left:-50px;top:-50px;animation:cresce 1s cubic-bezier(.2,.8,.2,1) both"></div>
<div class="bola" style="width:300px;height:300px;right:-170px;bottom:60px;opacity:.08"></div>
<div class="foto-entra" style="position:absolute;left:112px;top:70px;width:181px;height:330px;border-radius:30px;padding:7px;background:#0d0d12;box-shadow:0 28px 60px #00000080,0 0 0 1px #ffffff22;animation-delay:.05s;transform:rotate(-3deg)">
  <img src="${primeiraTela}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:23px;display:block">
</div>
<div style="position:absolute;left:36px;right:36px;top:440px">
  <h2 class="entra" style="animation-delay:.25s;font-family:'${fT}',sans-serif;font-weight:800;font-size:34px;line-height:1.06;letter-spacing:-.8px;color:#fff">${esc(F.titulo || "Seu site,")}<br><span style="color:${c.acento}">${esc(F.destaque || "pronto para ir ao ar.")}</span></h2>
  <p class="entra" style="animation-delay:.5s;margin-top:16px;font-size:16px;line-height:1.45;opacity:.9">${esc(F.convite || "Gostou? É só responder esta mensagem.")}</p>
</div>
${assinatura("Renderiza · renderizaweb.com.br", "position:absolute;left:36px;bottom:44px;animation-delay:.75s")}
</body></html>`;

async function cartela(html, dur, arquivo) {
  const ctx2 = await contexto();
  const p = await ctx2.newPage();
  await p.clock.install({ time: new Date(R.hora || "2026-10-06T10:30:00-03:00") });
  await p.addInitScript(AVANCAR);
  await p.setContent(html, { waitUntil: "networkidle" });
  await p.evaluate(AVANCAR); // setContent não roda o addInitScript
  await p.evaluate(async ([t, x]) => {
    const amostra = document.body.innerText;
    await Promise.all([`800 44px "${t}"`, `600 15px "${x}"`, `500 15px "${x}"`, `700 12px "${x}"`].map(f => document.fonts.load(f, amostra)));
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  }, [fT, fX]);
  // Fonte sem itálico (Outfit): o destaque fica reto, na cor, em vez de um itálico falso.
  await p.evaluate(t => {
    if (![...document.fonts].some(f => f.family.includes(t) && f.style === "italic" && f.status === "loaded"))
      document.querySelectorAll("h1 em, h2 em").forEach(e => { e.style.fontStyle = "normal"; });
  }, fT);
  const familias = await p.evaluate(() => [...document.fonts].filter(f => f.status === "loaded").map(f => f.family));
  if (!familias.some(f => f.includes(fT))) console.log("AVISO fonte " + fT + " não carregou na cartela");
  if (ENSAIO) {
    // o 1º quadro (vira a miniatura no WhatsApp) e mais alguns ao longo da cartela
    let antes = 0;
    for (const ms of [0, 1500, 3000, (dur - 0.1) * 1000]) {
      await p.evaluate(dt => window.__quadro(dt), ms - antes); antes = ms;
      await p.screenshot({ path: arquivo.replace(/\.mp4$/, `-${String(Math.round(ms / 100)).padStart(2, "0")}.jpg`), type: "jpeg", quality: 80 });
    }
    await ctx2.close();
    return;
  }
  const enc = codificador(arquivo);
  for (let f = 0; f < Math.round(dur * FPS); f++) {
    await p.evaluate(dt => window.__quadro(dt), f === 0 ? 0 : DT);
    await enc.quadro(await capturar(p));
  }
  await enc.fechar();
  await ctx2.close();
}
await cartela(MONTAGEM ? aberturaMontagem : abertura, ABERTURA, join(ENSAIO ? pastaEnsaio : tmp, ENSAIO ? "01-abertura.mp4" : "abertura.mp4"));
await cartela(ROLAGEM ? fechamentoRolagem : fechamento, FECHAMENTO, join(ENSAIO ? pastaEnsaio : tmp, ENSAIO ? "99-fechamento.mp4" : "fechamento.mp4"));

/* ---------- 2b. Reels: a moldura (fundo da marca e legenda grande) e o celular com o site ---------- */
const rodar = (cmd, args) => new Promise((ok, falha) => spawn(cmd, args, { stdio: "inherit" }).on("close", code => (code === 0 ? ok() : falha(new Error(cmd + " saiu com " + code)))));
let arquivoSite = join(tmp, "site.mp4");
if (REELS) {
  const M = { x: TELA_R.x / ESCALA, y: TELA_R.y / ESCALA, w: TELA_R.w / ESCALA, h: TELA_R.h / ESCALA }, BORDA = 7, RAIO = 30;
  const destaque = t => esc(t).replace(/\*([^*]+)\*/g, '<span class="tom">$1</span>');
  const moldura = base + `<style>
body{background:radial-gradient(130% 62% at 88% 0%, ${c.fundo} 0%, ${c.fundo2} 72%)}
#leg{position:absolute;left:26px;right:26px;top:90px;text-align:center;font-family:'${fT}',serif;font-weight:700;font-size:28px;line-height:1.12;letter-spacing:-.4px;color:#fff;text-wrap:balance}
#leg .tom{color:${c.acento}}
#sub{display:block;margin-top:12px;font-family:'${fX}',system-ui,sans-serif;font-weight:500;font-size:16px;line-height:1.38;letter-spacing:0;color:${c.claro};opacity:.88;text-wrap:balance}
.brilho{position:absolute;left:50%;top:${Math.round(M.y + 30)}px;width:330px;height:330px;margin-left:-165px;border-radius:50%;background:${c.acento};opacity:.13;filter:blur(46px)}
</style>
<div class="bola" style="width:92px;height:92px;right:-38px;top:-46px;opacity:.9"></div>
<p class="selo" style="position:absolute;left:0;right:0;top:58px;justify-content:center">${esc(R.reels_selo || "Prévia do site")}</p>
<div class="brilho"></div>
<div id="leg"><span id="txt"></span><small id="sub"></small></div>
</body></html>`;
  const celular = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;width:405px;height:720px;background:transparent;overflow:hidden}
.cel{position:absolute;left:${M.x - BORDA}px;top:${M.y - BORDA}px;width:${M.w}px;height:${M.h}px;border:${BORDA}px solid #0b0b0f;border-radius:${RAIO}px;box-shadow:0 26px 60px #00000099,0 0 0 1px #ffffff26}
</style></head><body><div class="cel"></div></body></html>`;
  // o celular por cima do site: borda e cantos arredondados (o miolo é transparente)
  const ctxC = await contexto(); const pc = await ctxC.newPage();
  await pc.setContent(celular); await pc.screenshot({ path: join(ENSAIO ? pastaEnsaio : tmp, "celular.png"), omitBackground: true, type: "png" });
  await ctxC.close();
  // a máscara da tela: o site com os cantos arredondados por dentro da borda (senão o canto reto aparece por fora)
  const ctxT = await contexto({ width: M.w, height: M.h }); const pt = await ctxT.newPage();
  await pt.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;width:${M.w}px;height:${M.h}px;background:#000;overflow:hidden}div{width:100%;height:100%;border-radius:${RAIO - BORDA}px;background:#fff}</style></head><body><div></div></body></html>`);
  await pt.screenshot({ path: join(ENSAIO ? pastaEnsaio : tmp, "tela.png"), type: "png" });
  await ctxT.close();
  const juntar = `[3:v]format=gray[m];[1:v][m]alphamerge[s];[0:v][s]overlay=${TELA_R.x}:${TELA_R.y}`;
  const ctxM = await contexto(); const pm = await ctxM.newPage();
  await pm.clock.install({ time: new Date(R.hora || "2026-10-06T10:30:00-03:00") });
  await pm.setContent(moldura, { waitUntil: "networkidle" });
  await pm.evaluate(AVANCAR);
  await pm.evaluate(async ([t, x]) => { await Promise.all([`700 28px "${t}"`, `500 15px "${x}"`, `700 12px "${x}"`].map(f => document.fonts.load(f, "Áá"))); await document.fonts.ready; }, [fT, fX]);
  const pintar = leg => pm.evaluate(({ html, sub, op, dy }) => {
    const L = document.getElementById("leg"), T = document.getElementById("txt"), S = document.getElementById("sub");
    if (T.dataset.v !== html) { T.innerHTML = html; S.textContent = sub || ""; S.style.display = sub ? "block" : "none"; T.dataset.v = html; }
    L.style.opacity = op; L.style.transform = `translateY(${dy}px)`;
  }, { html: destaque(leg.texto), sub: leg.sub, op: leg.op, dy: leg.dy });
  if (ENSAIO) {
    // cada parada como vai sair: moldura com a legenda, o site e o celular por cima
    for (const [i, ce] of R.cenas.entries()) {
      const nome = `${String(i + 2).padStart(2, "0")}-cena${i + 1}`;
      await pintar({ texto: ce.legenda || "", sub: ce.sub, op: ce.legenda ? 1 : 0, dy: 0 });
      await pm.evaluate(() => window.__quadro(2000));
      // a legenda (frase e linha de apoio) tem que caber acima do celular
      const pe = await pm.evaluate(() => document.getElementById("leg").getBoundingClientRect().bottom);
      if (pe > M.y - BORDA - 8) console.log(`AVISO cena ${i + 1}: a legenda desce até ${Math.round(pe)} px e encosta no celular (${Math.round(M.y - BORDA)}); encurte o texto`);
      await pm.screenshot({ path: join(pastaEnsaio, nome + "-moldura.png"), type: "png" });
      await rodar(FFMPEG, ["-y", "-loglevel", "error", "-i", join(pastaEnsaio, nome + "-moldura.png"), "-i", join(pastaEnsaio, nome + "-site.jpg"), "-i", join(pastaEnsaio, "celular.png"), "-i", join(pastaEnsaio, "tela.png"),
        "-filter_complex", `${juntar}[a];[a][2:v]overlay=0:0`, "-frames:v", "1", "-q:v", "3", join(pastaEnsaio, nome + ".jpg")]);
      rmSync(join(pastaEnsaio, nome + "-moldura.png")); rmSync(join(pastaEnsaio, nome + "-site.jpg"));
    }
  } else {
    const enc = codificador(join(tmp, "moldura.mp4"));
    for (let f = 0; f < total; f++) {
      await pintar(legEm(f / FPS));
      await pm.evaluate(dt => window.__quadro(dt), f === 0 ? 0 : DT);
      await enc.quadro(await capturar(pm));
    }
    await enc.fechar();
    arquivoSite = join(tmp, "site-reels.mp4");
    await rodar(FFMPEG, ["-y", "-loglevel", "error", "-i", join(tmp, "moldura.mp4"), "-i", join(tmp, "site.mp4"), "-i", join(tmp, "celular.png"), "-i", join(tmp, "tela.png"),
      "-filter_complex", `${juntar}:shortest=1[a];[a][2:v]overlay=0:0,format=yuv420p[v]`,
      "-map", "[v]", "-r", String(FPS), "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", arquivoSite]);
  }
  await ctxM.close();
}
await browser.close();
const o1 = ABERTURA - FUSAO, o2 = ABERTURA + DUR_SITE - 2 * FUSAO;
const seg = (ABERTURA + DUR_SITE + FECHAMENTO - 2 * FUSAO).toFixed(1);
if (ENSAIO) {
  console.log(`ensaio em ${pastaEnsaio}: ${R.cenas.length} paradas (${medidas.map(m => m.y).join(", ")}), vídeo teria ${seg}s`);
  process.exit(0);
}

/* ---------- 3. montagem: fusões, trilha (ou faixa muda: o WhatsApp trata como vídeo, não GIF) e compressão leve ---------- */
let audio = ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"], filtroAudio = [];
if (R.musica === "auto") {
  // Trilha original no tempo do vídeo: o groove entra com o site e o acorde final cai no fechamento.
  const wav = join(tmp, "trilha.wav");
  await rodar("python3", [join(RAIZ, "ferramentas", "video", "musica.py"), wav, seg, "--entrada", o1.toFixed(2), "--fechamento", (o2 + 0.4).toFixed(2), "--clima", CLIMA,
    ...(trocas.length ? ["--toques", [0.05, ...trocas].join(",")] : [])]);
  audio = ["-i", wav];
} else if (R.musica) {
  const arq = resolve(dirname(resolve(caminhoRoteiro)), R.musica);
  if (!existsSync(arq)) throw new Error("música não encontrada: " + arq);
  audio = ["-stream_loop", "-1", "-i", arq];
  filtroAudio = ["-af", `afade=t=in:d=0.4,afade=t=out:st=${(Number(seg) - 1.8).toFixed(2)}:d=1.8`];
}
if (R.musica && R.volume_musica && R.volume_musica !== 1) filtroAudio = ["-af", [filtroAudio[1], `volume=${R.volume_musica}`].filter(Boolean).join(",")];
await rodar(FFMPEG, ["-y", "-loglevel", "error",
  "-i", join(tmp, "abertura.mp4"), "-i", arquivoSite, "-i", join(tmp, "fechamento.mp4"), ...audio,
  // Grava em 1080 e reduz com lanczos: o texto sai mais nítido do que gravando direto em 720.
  "-filter_complex", `[0:v][1:v]xfade=transition=fade:duration=${FUSAO}:offset=${o1.toFixed(3)}[a];[a][2:v]xfade=transition=fade:duration=${FUSAO}:offset=${o2.toFixed(3)}${Number(R.resolucao) === 1080 ? "" : ",scale=720:1280:flags=lanczos"},format=yuv420p[v]`,
  "-map", "[v]", "-map", "3:a", ...filtroAudio, "-t", seg,
  // Leve para o WhatsApp: tela de site comprime bem; aq-mode 3 evita faixas nos degradês escuros.
  "-c:v", "libx264", "-preset", "slow", "-crf", String(R.crf || 23), "-maxrate", "4M", "-bufsize", "8M", "-x264-params", "aq-mode=3",
  "-profile:v", "high", "-level", "4.1", "-r", String(FPS),
  "-c:a", "aac", "-b:a", R.musica ? "112k" : "32k", "-movflags", "+faststart", saida]);
if (!process.env.MANTER) rmSync(tmp, { recursive: true, force: true });
console.log(`${saida} pronto: ${seg}s (site ${DUR_SITE.toFixed(1)}s, paradas ${medidas.map(m => m.y).join(", ")}), ${Math.round((Date.now() - inicio) / 1000)}s de gravação`);
