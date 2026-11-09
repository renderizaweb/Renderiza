// Telas do painel de exemplo de fotografia (Estúdio Ciranda, fictício) para o Reels "Site e painel"
// (reels-site-painel.html). Cada tela sai como no celular (390 px de largura, na escala do Reels), sem o topo fixo,
// que sai à parte (cab.jpg) para ficar parado enquanto a tela rola.
// A tela "Meu site" não existe no exemplo: ela é montada aqui com as peças do próprio exemplo, no jeito da tela de
// verdade do Painel Renderiza (painel-clientes/src/modulos/meu-site): as partes do site, a gaveta que salva no
// rascunho, o "Há mudanças no rascunho" e o Publicar. Os textos são os do painel de verdade.
// O exemplo também mostra a agenda online, que na fotografia ainda não existe de verdade (09/11/2026): nas telas do
// Reels saem o link, a legenda e a origem "Agenda online", e os textos que falam dela.
// Uso: node instagram/telas-ciranda.mjs  → instagram/telas-ciranda/*.jpg e posicoes.json
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spkiProxy } from "../ferramentas/proxy.mjs";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = resolve(AQUI, "..");
const SAIDA = join(AQUI, "telas-ciranda");
const ESCALA = 1.44; // a tela do celular do Reels: 390 px × 1,44 = 562 px do vídeo, um para um
const ALTURA = 1150; // quanto de cada tela sai (px do celular): o bastante para rolar um pouco
mkdirSync(SAIDA, { recursive: true });

const PROXY = (process.env.HTTPS_PROXY || "").replace(/^https?:\/\//, "");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox", ...(PROXY ? ["--ignore-certificate-errors-spki-list=" + spkiProxy(), "--proxy-server=https=" + PROXY] : [])] });
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: ESCALA });
p.on("pageerror", e => console.error("erro na página:", e.message));
// os pedidos de exemplo que vieram "pela agenda online" passam a ter vindo pelo WhatsApp (antes de a página desenhar)
await p.addInitScript(() => {
  let dados;
  Object.defineProperty(window, "CIRANDA", { configurable: true, get: () => dados, set: x => {
    for (const ped of x.PEDIDOS || []) if (ped.origem === "agenda") { ped.origem = "whatsapp"; ped.msg = "Oi! Ainda tem horário na mini sessão de Natal?"; }
    for (const l of x.LISTA_ESPERA || []) if (l.origem === "agenda") l.origem = "whatsapp";
    dados = x;
  } });
});
await p.goto("file://" + join(RAIZ, "exemplos", "painel-fotografia.html") + "?video=1", { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);

// 1. tira a agenda online (fotografia ainda não tem) e o selo do exemplo (o celular do Reels já leva o "exemplo")
const sobrou = await p.evaluate(() => {
  document.querySelectorAll('a[href="/exemplos/agenda-fotografia"], .link-agenda, .selo-demo').forEach(e => e.remove());
  const troca = [
    ["Quem pediu pelo direct, pelo WhatsApp ou pela agenda online, num lugar só.", "Quem pediu pelo direct ou pelo WhatsApp, num lugar só."],
    ["A cliente escolhe o horário pelo link, e o horário fica separado até o sinal pelo Pix.", "Cada horário com quem reservou e se o sinal já foi pago."],
    ["Livre na agenda online", "Livre"],
    [": aparece na agenda online", ""],
  ];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) for (const [a, b] of troca) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.replace(a, b);
  document.querySelectorAll(".item-bar").forEach(e => { if (/agenda online/i.test(e.textContent)) e.remove(); });
  return [...document.querySelectorAll("main *")].filter(e => !e.children.length && /agenda online/i.test(e.textContent)).map(e => e.textContent.trim());
});
if (sobrou.length) { console.error("ainda fala da agenda online:", sobrou); process.exit(1); }

// 2. a tela "Meu site", com as peças do exemplo (cartão, botões, gaveta, campos)
await p.addStyleTag({ content: `
  *{transition:none!important;animation:none!important}
  .ms-acoes{display:flex;gap:8px;margin:0 0 14px}
  .ms-acoes .botao{flex:1;width:auto;padding:0 14px;display:inline-flex}
  .ms-acoes .botao.leve{display:inline-flex}
  .ms-acoes .botao.desligado{opacity:.42;box-shadow:none}
  .ms-estado{color:var(--tinta-2);font-size:13.5px;line-height:1.5;margin:0 0 18px}
  .ms-tag{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:700;background:#fdf3d8;color:#8a5a00;vertical-align:1px;white-space:nowrap}
  .ms-tit{font-size:15.5px;font-weight:800;letter-spacing:-.01em;margin:0 0 10px}
  .ms-lista{padding:2px 0}
  .ms-linha{display:flex;align-items:center;gap:12px;padding:12px 14px;border-top:1px solid var(--linha-2)}
  .ms-linha:first-child{border-top:0}
  .ms-ic{width:38px;height:38px;border-radius:11px;background:var(--verde-claro);color:var(--verde-2);display:grid;place-items:center;flex:none}
  .ms-ic svg{width:19px;height:19px}
  .ms-tx{flex:1;min-width:0}
  .ms-tx b{display:block;font-size:14.5px}
  .ms-tx small{display:block;color:var(--suave);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ms-ed{color:var(--suave);display:grid}
  .ms-ed svg{width:18px;height:18px}
  #gaveta .campo label{font-size:13px}
  #gaveta .campo input{font-size:16px;font-weight:600;color:var(--tinta)}
` });
const marcas = await p.evaluate(() => {
  const svg = d => `<svg class="i" viewBox="0 0 24 24">${d}</svg>`;
  const IC = {
    foto: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/>'),
    preco: svg('<path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5"/>'),
    grade: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    pessoa: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    conversa: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
    olho: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
    editar: svg('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  };
  const linha = (id, ic, nome, resumo) => `<div class="ms-linha" id="${id}"><span class="ms-ic">${IC[ic]}</span><span class="ms-tx"><b>${nome}</b><small>${resumo}</small></span><span class="ms-fim"></span><span class="ms-ed">${IC.editar}</span></div>`;
  const s = document.createElement("section");
  s.className = "vista"; s.id = "meusite";
  s.innerHTML = `<div class="vista-cab"><div><h2>Meu site</h2><p>O que as suas clientes veem no site. Você muda aqui e publica.</p></div></div>
    <div class="ms-acoes"><button class="botao leve" type="button">${IC.olho}Ver no meu site</button><button class="botao primario desligado" type="button" id="ms-publicar">Publicar</button></div>
    <p class="ms-estado" id="ms-estado">No ar: versão 3, publicada ontem por Lia.</p>
    <h3 class="ms-tit">As partes do site</h3>
    <div class="cartao ms-lista">
      ${linha("ms-capa", "foto", "Capa", "A foto, o título e o botão do WhatsApp")}
      ${linha("ms-ensaios", "preco", "Ensaios e valores", "4 ensaios na vitrine")}
      ${linha("ms-galeria", "grade", "Galeria", "12 fotos")}
      ${linha("ms-sobre", "pessoa", "Sobre o estúdio", "O texto e a foto da Lia")}
      ${linha("ms-contato", "conversa", "Contato e WhatsApp", "O WhatsApp e o Instagram do estúdio")}
    </div>`;
  document.querySelector("main").append(s);
  return true;
});

// 3. o topo fixo, uma vez; depois some, para cada tela sair sem ele
await p.evaluate(() => scrollTo(0, 0));
await p.locator("header.topo").screenshot({ path: join(SAIDA, "cab.jpg"), type: "jpeg", quality: 90 });
const cab = await p.evaluate(() => { const h = document.querySelector("header.topo"); const r = h.getBoundingClientRect(); h.style.visibility = "hidden"; return Math.round(r.height); });

const pos = { escala: ESCALA, largura: 390, cab, telas: {} };
async function tela(id, nome = id) {
  const caixa = await p.evaluate(i => { const s = document.getElementById(i); s.style.borderTop = "0"; const r = s.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; }, id);
  const alto = Math.min(ALTURA, Math.ceil(caixa.h) + 24);
  await p.screenshot({ path: join(SAIDA, nome + ".jpg"), type: "jpeg", quality: 90, fullPage: true, clip: { x: 0, y: caixa.y, width: 390, height: alto } });
  pos.telas[nome] = { alto, y: caixa.y };
  return caixa;
}
for (const id of ["inicio", "agenda", "campanha", "clientes", "contratos", "financeiro", "atendimento"]) await tela(id);

// 4. Meu site: publicado (a), com mudança no rascunho (b), e onde ficam os toques
const naTela = async (sel, base) => p.evaluate(([s, b]) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + scrollY + r.height / 2 - b) }; }, [sel, base]);
const ms = await tela("meusite", "meusite-a");
pos.toques = { ensaios: await naTela("#ms-ensaios", ms.y) };
await p.evaluate(() => {
  document.querySelector("#ms-estado").insertAdjacentHTML("beforeend", ' <span class="ms-tag">Há mudanças no rascunho</span>');
  document.querySelector("#ms-ensaios .ms-fim").innerHTML = '<span class="ms-tag">Não publicado</span>';
  document.querySelector("#ms-publicar").classList.remove("desligado");
});
await tela("meusite", "meusite-b");
pos.toques.publicar = await naTela("#ms-publicar", ms.y);

// 5. a gaveta "Ensaios e valores" (preenchida só agora: aberta antes, ela aparecia por cima das outras telas)
await p.evaluate(() => {
  const x = '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const g = document.querySelector("#gaveta");
  const campo = (rot, v, id = "") => `<div class="campo"><label>${rot} · a partir de</label><input ${id ? `id="${id}" ` : ""}value="${v}"></div>`;
  g.innerHTML = `<div class="gaveta-cab"><button class="fechar" type="button" aria-label="Fechar">${x}</button>
      <h3>Ensaios e valores</h3><p>A vitrine do site: cada ensaio com o valor.</p></div>
    <div class="gaveta-corpo">${campo("Newborn", "R$ 1.190")}${campo("Ensaio gestante", "R$ 750")}${campo("Ensaio de família", "R$ 650")}${campo("Mini sessão de Natal", "R$ 220", "ms-natal")}</div>
    <div class="gaveta-pe"><button class="botao leve" type="button" style="display:inline-flex">Voltar</button><button class="botao primario" type="button" id="ms-salvar" style="width:auto;padding:0 16px">Salvar no rascunho</button></div>`;
});
// o valor da Mini sessão de Natal passa de R$ 220 para R$ 250
await p.evaluate(() => document.querySelector("#gaveta").classList.add("aberta"));
const gav = await p.evaluate(() => { const r = document.querySelector("#gaveta").getBoundingClientRect(); return { y: r.top, h: Math.round(r.height) }; });
pos.gaveta = { alto: gav.h, natal: await p.evaluate(y => { const r = document.querySelector("#ms-natal").getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2 - y) }; }, gav.y),
  salvar: await p.evaluate(y => { const r = document.querySelector("#ms-salvar").getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2 - y) }; }, gav.y) };
const estados = [["gaveta-0", "R$ 220", false], ["gaveta-1", "R$ 2", true], ["gaveta-2", "R$ 25", true], ["gaveta-3", "R$ 250", true]];
for (const [nome, valor, foco] of estados) {
  await p.evaluate(([v, f]) => { const i = document.querySelector("#ms-natal"); i.value = v; if (f) i.focus(); else i.blur(); }, [valor, foco]);
  await p.locator("#gaveta").screenshot({ path: join(SAIDA, nome + ".jpg"), type: "jpeg", quality: 90 });
}

writeFileSync(join(SAIDA, "posicoes.json"), JSON.stringify(pos, null, 1) + "\n");
console.log("telas em", SAIDA, JSON.stringify(pos));
await browser.close();
