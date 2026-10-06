// Flyer de Stories (PNG 1080 × 1920) de um lead: a arte que vai de cortesia para retomar o contato.
// Uso: node ferramentas/flyer/gerar.mjs flyers/<id>.json [saida.png]
//   Sem saída, grava flyers/<id>.png (vai ao ar em /flyer/<id>.png e o painel baixa pelo link_flyer).
//
// O JSON (flyers/<id>.json) traz os dados da demo da ótica:
//   marca, local (linha pequena acima do nome), fontes: { titulo, texto } (Google Fonts),
//   cores: { fundo, fundo2, acento, tinta_acento (texto em cima do acento), claro },
//   foto: { arquivo, pos: "50% 40%", largura (até 860; menor para foto pequena) }, foto2 opcional: { arquivo, pos, legenda, lado: "esquerda" } (polaroid; o selo
//     vai para o lado oposto),
//   selo: { nota: "5,0", total: "22" } (a nota só aparece se for 5,0; senão, só as estrelas e o total)
//     ou selo: { texto: "Desde 1951" },
//   titulo (aceita <em> para a parte em destaque), texto, whatsapp, cta ("Chame no WhatsApp"), endereco, instagram,
//   tamanho_titulo (84), italico: false (fonte sem itálico, como a Bricolage Grotesque: o destaque fica só na cor).
// Margens de Stories: nada importante nos 200 px de cima nem nos 170 de baixo (o Instagram cobre).
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spkiProxy } from "../proxy.mjs";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const [, , caminhoCfg, saidaArg] = process.argv;
if (!caminhoCfg) { console.error("Uso: node ferramentas/flyer/gerar.mjs flyers/<id>.json [saida.png]"); process.exit(1); }
const cfg = JSON.parse(readFileSync(caminhoCfg, "utf8"));
const saida = saidaArg || join(dirname(caminhoCfg), basename(caminhoCfg, ".json") + ".png");
const base = dirname(resolve(caminhoCfg));

const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const titulo = t => esc(t).replace(/&lt;em&gt;/g, "<em>").replace(/&lt;\/em&gt;/g, "</em>").replace(/&lt;br&gt;/g, "<br>");
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
const dataUri = arq => { const f = resolve(base, arq); return `data:${MIME[extname(f).toLowerCase()] || "image/jpeg"};base64,${readFileSync(f).toString("base64")}`; };
const fam = n => n.replace(/ /g, "+");

const c = { fundo: "#1b1b1f", fundo2: "#0f0f12", acento: "#f4c542", tinta_acento: "#1b1b1f", claro: "#f6f2ea", ...cfg.cores };
const fT = cfg.fontes?.titulo || "Poppins", fX = cfg.fontes?.texto || "DM Sans";
// moldura da foto: 860 px de largura, ou menos quando a foto é pequena (para não ampliar demais)
const FW = Math.round(cfg.foto.largura || 860), FX = Math.round((1080 - FW) / 2);
const ESTRELAS = "★★★★★";
const selo = cfg.selo?.texto
  ? `<div class="selo"><span class="selo-txt">${esc(cfg.selo.texto)}</span></div>`
  : cfg.selo ? `<div class="selo">${String(cfg.selo.nota).trim() === "5,0" ? `<strong>5,0</strong>` : ""}<span><span class="estrelas">${ESTRELAS}</span><small>${cfg.selo.total ? esc(cfg.selo.total) + " avaliações no Google" : "nota no Google"}</small></span></div>` : "";
const polaroid = cfg.foto2 ? `<figure class="polaroid"><img src="${dataUri(cfg.foto2.arquivo)}" style="object-position:${cfg.foto2.pos || "50% 50%"}"><figcaption>${esc(cfg.foto2.legenda || "")}</figcaption></figure>` : "";
const ICONES = {
  whats: '<path d="M16.04 4C9.4 4 4 9.38 4 16c0 2.11.55 4.18 1.6 6L4 28l6.18-1.6A12.02 12.02 0 0 0 28.06 16C28.06 9.38 22.67 4 16.04 4Zm0 21.9c-1.8 0-3.56-.48-5.1-1.4l-.37-.22-3.67.95.98-3.57-.24-.37A9.86 9.86 0 0 1 6.1 16c0-5.46 4.46-9.9 9.94-9.9 5.47 0 9.92 4.44 9.92 9.9 0 5.46-4.45 9.9-9.92 9.9Zm5.44-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" fill="currentColor"/>',
  pin: '<path d="M16 3a10 10 0 0 0-10 10c0 7.5 10 16 10 16s10-8.5 10-16A10 10 0 0 0 16 3Zm0 13.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" fill="currentColor"/>',
  insta: '<rect x="5" y="5" width="22" height="22" rx="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="16" cy="16" r="5.2" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="22.4" cy="9.7" r="1.5" fill="currentColor"/>',
};
const svg = n => `<svg viewBox="0 0 32 32" aria-hidden="true">${ICONES[n]}</svg>`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fam(fT)}:${cfg.italico === false ? "wght@500;600;700;800" : "ital,wght@0,500;0,600;0,700;0,800;1,500;1,600;1,700"}&family=${fam(fX)}:wght@400;500;600;700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:"${fX}",system-ui,sans-serif;font-variant-numeric:lining-nums;color:${c.claro};background:radial-gradient(130% 80% at 85% 8%, ${c.fundo} 0%, ${c.fundo2} 70%);position:relative}
.bola{position:absolute;border-radius:50%;background:${c.acento}}
.b1{width:300px;height:300px;right:-90px;top:-80px;opacity:.95}
.b2{width:110px;height:110px;right:70px;top:372px;opacity:.95;z-index:2}
.b3{width:520px;height:520px;left:-260px;bottom:120px;opacity:.10}
.topo{position:absolute;left:96px;right:96px;top:206px}
.local{font-weight:600;font-size:26px;letter-spacing:5px;text-transform:uppercase;color:${c.acento};display:flex;align-items:center;gap:18px}
.local:before{content:"";width:46px;height:3px;background:${c.acento};border-radius:2px}
.marca{font-family:"${fT}",serif;font-weight:700;font-size:64px;line-height:1.05;margin-top:14px;letter-spacing:-.5px;color:#fff}
.foto{position:absolute;left:${FX}px;top:390px;width:${FW}px;height:840px;border-radius:${FW / 2}px ${FW / 2}px 48px 48px;overflow:hidden;border:10px solid ${c.acento};box-shadow:0 40px 90px #00000066;background:#222}
.foto img{width:100%;height:100%;object-fit:cover;display:block}
.polaroid{position:absolute;left:${FX + FW + 52 - 282}px;top:858px;width:282px;padding:15px 15px 0;z-index:3;background:#fff;border-radius:6px;box-shadow:0 26px 60px #00000059;transform:rotate(5deg)}
.polaroid img{width:252px;height:262px;object-fit:cover;display:block;border-radius:2px}
.polaroid figcaption{font-family:"${fT}",serif;font-weight:600;font-size:23px;color:#262626;text-align:center;padding:14px 4px 18px;line-height:1.15}
.selo{position:absolute;left:${FX - 26}px;top:1150px;z-index:3;display:flex;align-items:center;gap:18px;background:#fff;color:#1d1d1f;border-radius:26px;padding:20px 30px 20px 26px;box-shadow:0 22px 50px #00000052}
.selo strong{font-family:"${fT}",serif;font-size:62px;line-height:1;font-weight:700;letter-spacing:-1px}
.selo span{display:flex;flex-direction:column;gap:4px}
body.polaroid-esquerda .polaroid{left:${FX - 52}px;transform:rotate(-5deg)}
body.polaroid-esquerda .selo{left:auto;right:${1080 - FX - FW - 26}px}
.estrelas{color:${c.estrela || c.acento};font-size:32px;letter-spacing:4px;line-height:1}
.selo small{font-size:24px;color:#4b4b52;font-weight:500}
.selo-txt{font-family:"${fT}",serif;font-size:38px;font-weight:700}
.texto{position:absolute;left:96px;right:96px;top:1300px}
h1{font-family:"${fT}",serif;font-weight:700;font-size:${cfg.tamanho_titulo || 84}px;line-height:1.02;letter-spacing:-1.5px;color:#fff}
h1 em{font-style:${cfg.italico === false ? "normal" : "italic"};color:${c.acento}}
.apoio{font-size:31px;line-height:1.38;margin-top:20px;color:${c.claro};opacity:.92;max-width:870px}
.cta{position:absolute;left:96px;right:96px;top:1630px;height:104px;border-radius:52px;background:${c.acento};color:${c.tinta_acento};display:flex;align-items:center;justify-content:center;gap:18px;font-weight:700;font-size:38px;box-shadow:0 18px 40px #00000040}
.cta svg{width:50px;height:50px}
.rodape{position:absolute;left:96px;right:96px;top:1758px;display:flex;justify-content:center;gap:34px;font-size:25px;color:${c.claro};opacity:.88;font-weight:500;white-space:nowrap}
.rodape span{display:flex;align-items:center;gap:9px}
.rodape svg{width:30px;height:30px;color:${c.acento}}
</style></head><body class="${cfg.foto2?.lado === "esquerda" ? "polaroid-esquerda" : ""}">
<div class="bola b1"></div><div class="bola b2"></div><div class="bola b3"></div>
<header class="topo"><p class="local">${esc(cfg.local)}</p><p class="marca">${esc(cfg.marca)}</p></header>
<div class="foto"><img src="${dataUri(cfg.foto.arquivo)}" style="object-position:${cfg.foto.pos || "50% 50%"}"></div>
${polaroid}
${selo}
<section class="texto"><h1>${titulo(cfg.titulo)}</h1>${cfg.texto ? `<p class="apoio">${esc(cfg.texto)}</p>` : ""}</section>
<div class="cta">${svg("whats")}<span>${esc(cfg.cta || "Chame no WhatsApp")} · ${esc(cfg.whatsapp)}</span></div>
<footer class="rodape"><span>${svg("pin")}${esc(cfg.endereco)}</span>${cfg.instagram ? `<span>${svg("insta")}${esc(cfg.instagram)}</span>` : ""}</footer>
</body></html>`;

const PROXY = (process.env.HTTPS_PROXY || "").replace(/^https?:\/\//, "");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", ...(PROXY ? ["--ignore-certificate-errors-spki-list=" + spkiProxy(), "--proxy-server=https=" + PROXY] : [])] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
// carrega todas as letras usadas em cada peso antes da foto (sem isso, sai letra faltando)
await page.evaluate(async ([t, x]) => {
  const amostra = document.body.innerText;
  await Promise.all([`700 84px "${t}"`, `italic 700 84px "${t}"`, `600 24px "${t}"`, `400 31px "${x}"`, `500 25px "${x}"`, `700 38px "${x}"`].map(f => document.fonts.load(f, amostra)));
  await document.fonts.ready;
}, [fT, fX]);
await page.waitForTimeout(400);
const fontes = await page.evaluate(() => [...document.fonts].filter(f => f.status === "loaded").map(f => f.family));
// texto que passou da largura ou encostou no bloco de baixo: avisa para encurtar
const sobra = await page.evaluate(() => {
  const r = s => document.querySelector(s)?.getBoundingClientRect();
  const t = r(".texto"), cta = r(".cta"), rod = r(".rodape");
  return { textoAte: Math.round(t.bottom), cta: Math.round(cta.top), rodapeLargura: Math.round(rod.width), rodapeConteudo: Math.round(document.querySelector(".rodape").scrollWidth) };
});
await page.screenshot({ path: saida, type: "png" });
await browser.close();
const avisos = [];
if (sobra.textoAte > sobra.cta - 24) avisos.push(`texto encosta no botão (${sobra.textoAte} > ${sobra.cta - 24}): encurte o título ou o texto`);
if (sobra.rodapeConteudo > sobra.rodapeLargura) avisos.push("rodapé maior que a largura: encurte o endereço");
if (!fontes.some(f => f.includes(fT))) avisos.push(`fonte ${fT} não carregou`);
console.log(`${saida} pronto${avisos.length ? "\n  AVISO " + avisos.join("\n  AVISO ") : ""}`);
