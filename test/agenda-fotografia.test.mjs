// A agenda do site da fotografia ligada ao Painel Renderiza (entrega da Rafaela, Paradas C3 e C4): o site que o
// virar-site.mjs gera da demo dela, com "painel": { "agenda": true }, num Chromium do tamanho de um celular e com a
// API do painel imitada. Com o painel, os ensaios, a campanha e os horários vêm dele e o pedido vai para ele; sem o
// painel (fora do ar ou desligado), tudo como na demo: os horários da página e o pedido pelo WhatsApp. Sem o
// Playwright, ficam de fora. A API e o banco têm os próprios testes (painel-clientes/test/publico.test.mjs e
// painel-clientes/supabase/testes/044_publico_agenda_fotografia.sql).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

let playwright = null;
try { playwright = createRequire(import.meta.url)("playwright"); } catch { /* sem navegador */ }
const comNavegador = { skip: playwright ? false : "sem o Playwright" };

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEMO = path.join(RAIZ, "demos", "rafaela-damaceno-fotografia");
const SITE = "https://estudio.teste";
const API = "https://painel.teste/api/publico/";
const AGENDA = API + "agenda/estudio-teste";
const TIPO = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
const GESTANTE = "6c8f0d2e-0000-4000-8000-0000000000a1", FAMILIA = "6c8f0d2e-0000-4000-8000-0000000000a2", NATAL = "6c8f0d2e-0000-4000-8000-0000000000c1";

/** Dias a partir de hoje (no fuso de São Paulo), como o banco devolve. */
const hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const dia = n => { const d = new Date(hoje() + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const horarios = (hs, ocupadas = []) => hs.map(hora => ({ hora, livre: !ocupadas.includes(hora) }));

/** O painel imitado: os horários gerais, os de cada ensaio e os da campanha (com 2 vagas, mas 3 horários livres). */
function painel(url) {
  const q = url.searchParams, base = { esquema: 1, nicho: "fotografia", hoje: hoje(), separa_horas: 48, duracao: 60 };
  const ensaios = [{ id: GESTANTE, nome: "Gestante", descricao: "No estúdio, com figurino", duracao: 60 }, { id: FAMILIA, nome: "Família", descricao: null, duracao: 90 }];
  const campanhas = [{ id: NATAL, nome: "Natal 2026", servico: null, dias: [dia(4), dia(6)], horarios: ["09:00", "10:30"], restam: 2 }];
  let dias;
  if (q.get("campanha") === NATAL) dias = [{ data: dia(4), horarios: horarios(["09:00", "10:30"], ["09:00"]) }, { data: dia(6), horarios: horarios(["09:00", "10:30"]) }];
  else if (q.get("servico") === GESTANTE) dias = [{ data: dia(3), horarios: horarios(["09:00", "14:00"], ["09:00"]) }, { data: dia(5), horarios: horarios(["10:00"], ["10:00"]) }];
  else if (q.get("servico") === FAMILIA) dias = [{ data: dia(3), horarios: horarios(["14:00"]) }];
  else dias = [{ data: dia(3), horarios: horarios(["09:00", "14:00"]) }];
  return { status: 200, json: { ...base, ensaios, campanhas, dias } };
}

let pasta, saida, navegador;
before(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "agenda-fotografia-"));
  // a demo dela, com o painel no site.json (o código e a API de teste)
  const copia = path.join(pasta, "rafaela-damaceno-fotografia");
  fs.mkdirSync(copia);
  for (const a of ["index.html", "natal.html"]) fs.copyFileSync(path.join(DEMO, a), path.join(copia, a));
  const conf = JSON.parse(fs.readFileSync(path.join(DEMO, "site.json"), "utf8"));
  fs.writeFileSync(path.join(copia, "site.json"), JSON.stringify({ ...conf, painel: { codigo: "estudio-teste", api: API, agenda: true } }));
  saida = path.join(pasta, "saida");
  const r = spawnSync("node", ["scripts/virar-site.mjs", copia, saida], { cwd: RAIZ, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  if (playwright) navegador = await playwright.chromium.launch();
});
after(async () => {
  await navegador?.close();
  fs.rmSync(pasta, { recursive: true, force: true });
});

/** Abre uma página do site. agenda(url) e pedido(corpo) devolvem { status, json } ou null (fora do ar). */
async function abrir(caminho, { agenda = painel, pedido = () => ({ status: 201, json: { ok: true, separada_ate: "x" } }) } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const pagina = await ctx.newPage();
  const erros = [], enviados = [], perguntas = [], abertas = [], whatsapp = [];
  pagina.on("pageerror", e => erros.push(e.message));
  ctx.on("page", p => abertas.push(p));
  await ctx.route("**/*", async rota => {
    const u = new URL(rota.request().url());
    if (u.origin === SITE) {
      let arquivo = path.join(saida, u.pathname === "/" ? "index.html" : u.pathname);
      if (!fs.existsSync(arquivo) && fs.existsSync(arquivo + ".html")) arquivo += ".html";
      if (!fs.existsSync(arquivo)) return rota.fulfill({ status: 404, body: "" });
      return rota.fulfill({ status: 200, contentType: TIPO[path.extname(arquivo)] || "application/octet-stream", body: fs.readFileSync(arquivo) });
    }
    if (u.href.startsWith(AGENDA)) {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "Content-Type", "access-control-allow-methods": "GET, POST, OPTIONS" };
      if (rota.request().method() === "OPTIONS") return rota.fulfill({ status: 204, headers: cors });
      let r;
      if (u.pathname.endsWith("/pedido")) { const corpo = JSON.parse(rota.request().postData()); enviados.push(corpo); r = pedido(corpo); }
      else { perguntas.push(u); r = agenda(u); }
      if (!r) return rota.abort();
      return rota.fulfill({ status: r.status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(r.json) });
    }
    if (u.hostname === "wa.me") { whatsapp.push(u.href); return rota.abort(); }
    if (u.href.startsWith(API + "site/")) return rota.fulfill({ status: 404, headers: { "access-control-allow-origin": "*" }, body: "{}" }); // o Meu site: sem versão publicada
    return rota.abort();
  });
  await pagina.goto(SITE + caminho);
  return { pagina, ctx, erros, enviados, perguntas, abertas, whatsapp };
}

/** Do ensaio ao pedido: escolhe a opção, o primeiro dia livre, o primeiro horário e preenche nome e WhatsApp. */
async function pedir(p, opcao) {
  const ag = p.locator("#agendar [data-agenda]");
  if (opcao) await ag.locator(".ag-opcao", { hasText: opcao }).tap();
  await ag.locator("button.ag-d").first().tap();
  await ag.locator(".ag-hora").first().tap();
  await ag.locator("input[name=nome]").fill("Lia Teste");
  await ag.locator("input[name=whatsapp]").fill("11988887777");
  await ag.locator(".ag-enviar").tap();
  return ag;
}

test("o site sai com a agenda dela ligada ao painel, sem a página /agenda/ de eventos", () => {
  for (const pagina of ["index.html", "natal.html"]) {
    const html = fs.readFileSync(path.join(saida, pagina), "utf8");
    assert.match(html, /<script>window\.RZ_AGENDA_PAINEL = \{"api":"https:\/\/painel\.teste\/api\/publico\/","codigo":"estudio-teste"\};<\/script>\n/, pagina);
    assert.match(html, /window\.AGENDA = \{/, pagina + ": a versão inicial continua na página");
  }
  assert.ok(!fs.existsSync(path.join(saida, "agenda")), "sem /agenda/");
  assert.match(fs.readFileSync(path.join(saida, "README.md"), "utf8"), /pergunta ao Painel Renderiza os ensaios/);
  assert.ok(!fs.readFileSync(path.join(DEMO, "index.html"), "utf8").includes("<script>window.RZ_AGENDA_PAINEL"), "a demo continua sem o painel");
});

test("com o painel: os ensaios, a campanha e os horários são os dele, e o pedido vai para ele", comNavegador, async () => {
  const { pagina: p, ctx, erros, enviados, perguntas, abertas } = await abrir("/");
  try {
    const ag = p.locator("#agendar [data-agenda]");
    await ag.locator(".ag-opcao").first().waitFor();
    assert.deepEqual(await ag.locator(".ag-opcao b").allTextContents(), ["Natal 2026", "Gestante", "Família"]);
    assert.equal(await ag.locator(".ag-opcao.campanha em").textContent(), "2 horários livres", "3 livres, mas só 2 vagas");
    assert.equal(await ag.locator(".ag-opcao", { hasText: "Gestante" }).locator("span").textContent(), "No estúdio, com figurino");
    assert.equal(await ag.locator(".ag-exemplo").isHidden(), true, "sem o aviso de horários de exemplo");
    assert.equal(await p.locator("[data-ag-vagas]").first().textContent(), "2", "o bloco de Natal mostra as vagas do painel");

    await ag.locator(".ag-opcao", { hasText: "Gestante" }).tap();
    await ag.locator("button.ag-d").first().waitFor();
    assert.equal(await ag.locator("button.ag-d").count(), 1, "só o dia com horário livre");
    assert.ok(perguntas.some(u => u.searchParams.get("servico") === GESTANTE), "pergunta os horários do ensaio");
    await ag.locator("button.ag-d").first().tap();
    assert.deepEqual(await ag.locator(".ag-hora").allTextContents(), ["14h"]);
    assert.match(await ag.locator(".ag-nota").textContent(), /recebe o pedido na agenda/);

    await ag.locator(".ag-voltar").tap(); // e volta ao começo para fazer o pedido inteiro
    await ag.locator(".ag-voltar").waitFor({ state: "hidden" });
    await pedir(p, "Gestante");
    await ag.locator(".ag-pronto").waitFor();
    assert.equal(enviados.length, 1);
    const { tempo, ...corpo } = enviados[0];
    assert.deepEqual(corpo, { nome: "Lia Teste", whatsapp: "11988887777", data: dia(3), hora: "14:00", website: "", servico: GESTANTE });
    assert.equal(typeof tempo, "number");
    assert.equal(await ag.locator(".ag-pronto .ag-titulo").textContent(), "Pedido enviado.");
    assert.match(await ag.locator(".ag-pronto").textContent(), /separado por 48 horas/);
    assert.match(await ag.locator("[data-ag-abrir]").getAttribute("href"), /^https:\/\/wa\.me\/5511994794869\?text=/);
    assert.equal(abertas.length, 0, "o WhatsApp não abre sozinho: o pedido já está no painel");
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
});

test("com o painel: horário pego no meio do caminho volta para a escolha do dia, com os horários de novo", comNavegador, async () => {
  let vez = 0;
  const { pagina: p, ctx, erros, perguntas } = await abrir("/", { pedido: () => (++vez === 1 ? { status: 409, json: { ok: false, erro: "ocupada" } } : { status: 201, json: { ok: true } }) });
  try {
    const ag = await pedir(p, "Família");
    await ag.locator(".ag-aviso").waitFor();
    assert.match(await ag.locator(".ag-aviso").textContent(), /acabou de ser reservado/);
    assert.equal(await ag.locator("[data-etapa=dia]").isVisible(), true);
    assert.equal(perguntas.filter(u => u.searchParams.get("servico") === FAMILIA).length, 2, "pergunta os horários de novo");
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
});

test("com o painel, mas ele falha na hora do pedido: o pedido segue pelo WhatsApp", comNavegador, async () => {
  const { pagina: p, ctx, erros } = await abrir("/", { pedido: () => ({ status: 500, json: {} }) });
  try {
    const ag = await pedir(p, "Gestante");
    await ag.locator(".ag-pronto").waitFor();
    assert.equal(await ag.locator(".ag-pronto .ag-titulo").textContent(), "Falta enviar pelo WhatsApp.");
    assert.match(await ag.locator("[data-ag-abrir]").getAttribute("href"), /^https:\/\/wa\.me\/5511994794869\?text=.*Gestante/);
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
});

test("painel desligado (404): a agenda é a da página e o pedido sai pelo WhatsApp, como na demo", comNavegador, async () => {
  const { pagina: p, ctx, erros, enviados, abertas, whatsapp } = await abrir("/", { agenda: () => ({ status: 404, json: { erro: "fora" } }) });
  try {
    const ag = p.locator("#agendar [data-agenda]");
    await ag.locator(".ag-opcao").first().waitFor();
    assert.deepEqual(await ag.locator(".ag-opcao b").allTextContents(), ["Natal 2026", "Gestante", "Newborn", "Acompanhamento", "Smash the cake", "Família"]);
    assert.equal(await ag.locator(".ag-exemplo").isVisible(), true);
    await pedir(p, "Newborn");
    await ag.locator(".ag-pronto").waitFor();
    assert.equal(enviados.length, 0, "nada vai ao painel");
    assert.equal(await ag.locator(".ag-pronto .ag-titulo").textContent(), "Pedido enviado.");
    await p.waitForTimeout(300);
    assert.equal(abertas.length, 1, "abre o WhatsApp com o pedido escrito");
    assert.match(decodeURIComponent(whatsapp[0] || ""), /^https:\/\/wa\.me\/5511994794869\?text=.*Newborn/);
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
});

test("a página de Natal, com o painel: os dias e as vagas da campanha dele, e o pedido com a campanha", comNavegador, async () => {
  const { pagina: p, ctx, erros, enviados } = await abrir("/natal");
  try {
    const ag = p.locator("[data-agenda][data-so]").first();
    await ag.locator("button.ag-d").first().waitFor();
    assert.equal(await ag.locator("button.ag-d").count(), 2, "os dois dias da campanha");
    await ag.locator("button.ag-d").first().tap();
    assert.deepEqual(await ag.locator(".ag-hora").allTextContents(), ["10h30"], "o 09:00 já foi");
    await ag.locator(".ag-hora").first().tap();
    await ag.locator("input[name=nome]").fill("Bia Teste");
    await ag.locator("input[name=whatsapp]").fill("(11) 95555-4444");
    await ag.locator(".ag-enviar").tap();
    await ag.locator(".ag-pronto").waitFor();
    const { tempo, ...corpo } = enviados[0];
    assert.deepEqual(corpo, { nome: "Bia Teste", whatsapp: "11955554444", data: dia(4), hora: "10:30", website: "", campanha: NATAL });
    for (const e of await p.locator("[data-ag-vagas]").allTextContents()) assert.equal(e, "2");
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
});

test("com o painel: o \"voltar\" do celular volta um passo, sem sair da página", comNavegador, async () => {
  const { pagina: p, ctx, erros } = await abrir("/");
  try {
    const ag = p.locator("#agendar [data-agenda]");
    await ag.locator(".ag-opcao", { hasText: "Família" }).tap();
    await ag.locator("button.ag-d").first().tap();
    await ag.locator(".ag-hora").first().tap();
    await ag.locator("[data-etapa=dados]").waitFor();
    await p.goBack();
    await ag.locator("[data-etapa=dia]").waitFor();
    assert.equal(await ag.locator("button.ag-d.escolhido").count(), 1, "o dia escolhido continua marcado");
    await p.goBack();
    await ag.locator("[data-etapa=ensaio]").waitFor();
    assert.equal(new URL(p.url()).origin, SITE);
    assert.deepEqual(await ag.locator(".ag-opcao b").allTextContents(), ["Natal 2026", "Gestante", "Família"]);
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
});
