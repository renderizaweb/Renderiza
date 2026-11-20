// Kit de divulgação de quem FECHOU (pedido do Kaue, 20/11/2026): o que a Renderiza prepara para o cliente divulgar o
// site novo, numa página só dele, com tudo para baixar ou copiar e com o contador (o card do lead no Painel de prospecção
// mostra o que ele abriu, viu, baixou e copiou). Não é para vender: é o material dele, com a marca e a assinatura dele.
//   - o vídeo de divulgação do site (ferramentas/video/gravar.mjs com url do site no ar e assinatura dele; gravacoes/);
//   - o flyer de Stories e a arte do feed (ferramentas/flyer/gerar.mjs, formato stories e post), com fotos da demo dele;
//   - os textos prontos (legenda, bio, Status, pedido de avaliação no Google) e o endereço do site.
// Uso: node ferramentas/kit/gerar.mjs demos/<pasta>/kit.json
//   -> flyers/<pasta>-kit-stories.png e -kit-post.png (no ar em /flyer/...), demos/<pasta>/kit.html (no ar em
//      /kit/<pasta>, fora de /demo: não sai do ar quando a demo é desligada; o build põe o contador com data-sub="kit",
//      que conta para o lead da demo). O vídeo tem de existir em gravacoes/<video>.
// O que o contador conta (cliques com alvo kit-*, nomes em painel/src/visitas.js): abriu o kit; viu na tela o vídeo, o
// flyer e a arte (meio segundo à vista, uma vez); deu play e viu o vídeo até o fim; baixou cada peça; copiou cada texto
// e o endereço; abriu o site. Passo a passo e o que mandar ao cliente: docs/fechamento.md, "Kit de divulgação".

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fam = n => n.replace(/ /g, "+");

/**
 * A foto tratada da demo, gravada em rascunhos/kit/<pasta>/<k>.jpg: pelo data-k que o gerador põe em cada uma
 * (`da_demo`) ou, na demo feita à mão sem data-k (a da Bia, gerar-fotografia-eventos.py), pelo texto exato do alt
 * (`alt`).
 */
const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function fotoDaDemo(pasta, k, alt = "") {
  const html = fs.readFileSync(path.join(RAIZ, "demos", pasta, "index.html"), "utf8");
  if (alt) k = "alt-" + alt.normalize("NFD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 48);
  const m = alt
    ? new RegExp(`<img\\b[^>]*src="data:image/[^"]+"[^>]*alt="${reEsc(alt)}"[^>]*>`).exec(html)
    : new RegExp(`<img\\b[^>]*data-k="${k}[0-9a-f]*"[^>]*>`).exec(html) || new RegExp(`<img\\b[^>]*src="data:image/[^"]+"[^>]*data-k="${k}`).exec(html);
  const src = m && /src="data:image\/(\w+);base64,([^"]+)"/.exec(m[0]);
  if (!src) throw new Error(`kit: não achei a foto ${k} na demo ${pasta}`);
  const dir = path.join(RAIZ, "rascunhos", "kit", pasta);
  fs.mkdirSync(dir, { recursive: true });
  const arq = path.join(dir, `${k}.${src[1] === "jpeg" ? "jpg" : src[1]}`);
  fs.writeFileSync(arq, Buffer.from(src[2], "base64"));
  return arq;
}

/** As duas artes (flyer de Stories e arte do feed), pelo gerador de flyer. Devolve os nomes publicados em /flyer/. */
function artes(cfg) {
  const feitas = {};
  for (const [peca, formato] of [["stories", "stories"], ["post", "post"]]) {
    const p = cfg[peca];
    if (!p) continue;
    const nome = `${cfg.pasta}-kit-${peca}`;
    const json = path.join(RAIZ, "flyers", nome + ".json");
    const arte = { ...cfg.arte, ...p, formato, foto: { arquivo: fotoDaDemo(cfg.pasta, p.foto.da_demo, p.foto.alt), pos: p.foto.pos } };
    fs.writeFileSync(json, JSON.stringify({ _sobre: `Arte do kit de divulgação (${peca}), gerada por ferramentas/kit/gerar.mjs a partir de demos/${cfg.pasta}/kit.json.`, ...arte }, null, 1));
    const r = spawnSync("node", [path.join(RAIZ, "ferramentas", "flyer", "gerar.mjs"), json], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(r.stdout + r.stderr);
    process.stdout.write(r.stdout);
    feitas[peca] = nome + ".png";
  }
  return feitas;
}

const ICONE = {
  baixar: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const svg = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONE[n]}</svg>`;

/** A página do kit. */
export function pagina(cfg, feitas) {
  const c = cfg.cores, fT = cfg.fontes.titulo, fX = cfg.fontes.texto, a = cfg.arquivos || cfg.pasta;
  const curto = cfg.site.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const peca = (id, titulo, sobre, midia, baixar, nomeArq) => `
  <section class="peca" aria-labelledby="${id}-t" data-kit-viu="${id}">
    <h2 id="${id}-t">${esc(titulo)}</h2><p>${esc(sobre)}</p>
    ${midia}
    <a class="botao" href="${esc(baixar)}" download="${esc(nomeArq)}" data-rz-alvo="kit-baixou-${id}">${svg("baixar")}Baixar</a>
  </section>`;
  const textos = cfg.textos.map(t => `
    <div class="texto">
      <h3>${esc(t.titulo)}</h3>${t.onde ? `<p class="onde">${esc(t.onde)}</p>` : ""}
      <p class="caixa" id="tx-${esc(t.id)}">${esc(t.texto)}</p>
      <button class="botao botao--linha" type="button" data-copiar="tx-${esc(t.id)}" data-rz-alvo="kit-copiou-${esc(t.id)}">${svg("copiar")}Copiar</button>
      <p class="feito" aria-live="polite"></p>
    </div>`).join("");
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Kit de divulgação · ${esc(cfg.para)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${c.tinta}">
<meta property="og:title" content="Os materiais de divulgação do seu site">
<meta property="og:description" content="O vídeo, o flyer de Stories, a arte do feed e os textos prontos, para baixar e postar quando quiser.">
<!-- Kit de divulgação de ${esc(cfg.para)} (gerado por ferramentas/kit/gerar.mjs a partir de demos/${esc(cfg.pasta)}/kit.json:
     não editar à mão). O build põe o contador de visitas (data-sub="kit"); os cliques levam data-rz-alvo (kit-*). -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fam(fT)}:ital,wght@0,400;0,500;1,400&family=${fam(fX)}:wght@300;400;500&display=swap" rel="stylesheet">
<style>
:root{--fundo:${c.fundo};--papel:${c.papel};--linha:${c.linha};--tinta:${c.tinta};--tinta2:${c.tinta2};--acento:${c.acento};--acento2:${c.acento2};--areia:${c.areia}}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"${fX}",system-ui,sans-serif;font-size:17px;line-height:1.55;color:var(--tinta);background:var(--fundo);-webkit-font-smoothing:antialiased}
main{width:min(600px,100% - 32px);margin:0 auto;padding:40px 0 56px}
.eyebrow{font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;color:var(--acento)}
h1{font-family:"${fT}",Georgia,serif;font-weight:500;font-size:clamp(2.2rem,8vw,2.9rem);line-height:1.05;margin:10px 0 14px}
h1 em{font-style:italic;color:var(--acento)}
h2{font-family:"${fT}",Georgia,serif;font-weight:500;font-size:1.75rem;line-height:1.1;margin-bottom:6px}
h3{font-size:1.02rem;font-weight:500;margin-bottom:4px}
p{color:var(--tinta2)}
.peca,.textos{margin-top:30px;padding:24px;border-radius:20px;background:var(--papel);border:1px solid var(--linha)}
.midia{display:block;margin:18px auto;width:min(320px,100%);border-radius:18px;overflow:hidden;background:var(--areia);box-shadow:0 26px 50px -26px rgba(0,0,0,.45)}
.midia.stories{aspect-ratio:9/16}.midia.post{aspect-ratio:4/5;width:min(380px,100%)}
.midia video,.midia img{display:block;width:100%;height:100%;object-fit:cover}
.botao{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;padding:13px 22px;border-radius:999px;border:0;background:var(--acento);color:#fff;font:500 1.03rem "${fX}",sans-serif;text-decoration:none;cursor:pointer}
.botao:hover{background:var(--acento2)}
.botao--linha{background:transparent;color:var(--acento2);border:1.5px solid color-mix(in srgb,var(--acento) 55%,transparent)}
.botao--linha:hover{background:var(--areia)}
.botao svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.textos .texto+.texto{margin-top:26px;padding-top:24px;border-top:1px solid var(--linha)}
.onde{font-size:.92rem;margin-bottom:8px}
.caixa{white-space:pre-line;overflow-wrap:anywhere;padding:14px 16px;border-radius:14px;background:var(--areia);color:var(--tinta);margin:8px 0 12px;font-size:.98rem}
.feito{font-size:.9rem;color:#1f7a4d;text-align:center;margin-top:6px;min-height:1.2em}
.rodape{margin-top:40px;text-align:center;font-size:.85rem;color:var(--tinta2)}
.rodape a{color:var(--acento2)}
</style>
</head>
<body>
<main>
  <section aria-label="Kit de divulgação">
    <p class="eyebrow">Para ${esc(cfg.para)}</p>
    <h1>Os materiais para divulgar <em>o seu site.</em></h1>
    <p>Preparamos para você mostrar o site novo: o vídeo, o flyer de Stories, a arte do feed e os textos prontos. Use se quiser, quando quiser: é só baixar ou copiar.</p>
  </section>
${peca("video", "Vídeo do site", "Para os Stories, o Reels e o Status do WhatsApp: o site rolando no celular.",
  `<div class="midia stories"><video id="video" src="/gravacao/${esc(cfg.video)}#t=0.5" controls playsinline preload="metadata"></video></div>`,
  `/gravacao/${cfg.video}`, `${a}-video.mp4`)}
${feitas.stories ? peca("flyer", "Flyer para os Stories", "Para postar nos Stories e pôr a figurinha de link com o endereço do site.",
  `<img class="midia stories" src="/flyer/${esc(feitas.stories)}" alt="Flyer de Stories: nosso site novo está no ar" loading="lazy">`, `/flyer/${feitas.stories}`, `${a}-stories.png`) : ""}
${feitas.post ? peca("post", "Arte para o feed", "Para o feed do Instagram (4:5), com a legenda abaixo.",
  `<img class="midia post" src="/flyer/${esc(feitas.post)}" alt="Arte do feed: nosso site novo está no ar" loading="lazy">`, `/flyer/${feitas.post}`, `${a}-post.png`) : ""}
  <section class="textos" aria-labelledby="textos-t">
    <h2 id="textos-t">Textos prontos</h2>
    <p>É só copiar e colar.</p>
    <div class="texto" style="margin-top:18px">
      <h3>Endereço do site</h3><p class="onde">Para a figurinha de link nos Stories e para o campo Links do perfil.</p>
      <p class="caixa" id="tx-site">${esc(cfg.site)}</p>
      <button class="botao botao--linha" type="button" data-copiar="tx-site" data-rz-alvo="kit-copiou-link">${svg("link")}Copiar o endereço</button>
      <p class="feito" aria-live="polite"></p>
    </div>${textos}
  </section>
  <p class="rodape"><a href="${esc(cfg.site)}" target="_blank" rel="noopener" data-rz-alvo="kit-ver-site">Ver o site (${esc(curto)})</a> · preparado pela Renderiza</p>
</main>
<script>
(function () {
  "use strict";
  // O contador (exemplos/visitas.js, posto pelo build) conta sozinho os cliques com data-rz-alvo (baixar, copiar, ver o
  // site). Daqui: o play e o "até o fim" do vídeo, e o "viu na tela" de cada peça (meio segundo à vista, uma vez só).
  var contar = function (alvo) { try { if (window.rzVisita) window.rzVisita("clicou", { alvo: alvo }, alvo); } catch (e) { /* o contador nunca atrapalha */ } };
  var video = document.getElementById("video");
  if (video) {
    video.addEventListener("play", function () { contar("kit-play"); });
    video.addEventListener("ended", function () { contar("kit-fim"); });
  }
  if ("IntersectionObserver" in window) {
    var tempos = new Map();
    var olho = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var id = e.target.getAttribute("data-kit-viu");
        if (e.isIntersecting) tempos.set(id, setTimeout(function () { contar("kit-viu-" + id); olho.unobserve(e.target); }, 500));
        else clearTimeout(tempos.get(id));
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-kit-viu] .midia").forEach(function (m) { m.setAttribute("data-kit-viu", m.closest("[data-kit-viu]").getAttribute("data-kit-viu")); olho.observe(m); });
  }
  document.querySelectorAll("[data-copiar]").forEach(function (b) {
    b.addEventListener("click", function () {
      var texto = document.getElementById(b.getAttribute("data-copiar")).textContent, aviso = b.nextElementSibling;
      var feito = function (ok) { aviso.textContent = ok ? "Copiado." : "Não deu para copiar: selecione o texto e copie."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(function () { feito(true); }, function () { feito(false); });
      else feito(false);
    });
  });
})();
</script>
</body>
</html>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arq = process.argv[2];
  if (!arq) { console.error("Uso: node ferramentas/kit/gerar.mjs demos/<pasta>/kit.json"); process.exit(1); }
  const cfg = JSON.parse(fs.readFileSync(arq, "utf8"));
  if (!fs.existsSync(path.join(RAIZ, "gravacoes", cfg.video))) throw new Error(`kit: falta o vídeo gravacoes/${cfg.video} (ferramentas/video/gravar.mjs)`);
  const feitas = artes(cfg);
  const saida = path.join(RAIZ, "demos", cfg.pasta, "kit.html");
  fs.writeFileSync(saida, pagina(cfg, feitas));
  console.log(`${saida} pronto: no ar em /kit/${cfg.pasta}`);
}
