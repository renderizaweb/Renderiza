// Agenda online no site do cliente (Painel Renderiza, Missão 4 bloco A): a página /agenda/ que o virar-site.mjs gera
// (ferramentas/demo/agenda-online/), no site de teste fictício, com a API do painel imitada num Chromium. Sem o
// Playwright, ficam de fora. A API e o banco têm os próprios testes (painel-clientes/test/publico.test.mjs e
// supabase/testes/040_publico_agenda.sql).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { montar } from "./site-teste/montar.mjs";
import { doSite, ligarNoSite } from "../ferramentas/demo/agenda-online/gerar.mjs";

let playwright = null;
try { playwright = createRequire(import.meta.url)("playwright"); } catch { /* sem navegador */ }
const comNavegador = { skip: playwright ? false : "sem o Playwright" };

const SITE = "https://villa-alecrim.teste";
const API = "https://painel.renderizaweb.com.br/api/publico/agenda/villa-alecrim";
const TIPO = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

/** Dias com turno no mês que vem (o 5 com os dois turnos livres; o 6 com a noite ocupada), como o banco devolve. */
function disponibilidade() {
  const hoje = new Date();
  const ano = hoje.getMonth() === 11 ? hoje.getFullYear() + 1 : hoje.getFullYear(), mes = (hoje.getMonth() + 1) % 12;
  const dia = d => `${ano}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const turnos = noite => [
    { id: "t-dia", nome: "De dia", inicio: "11:00", fim: "17:00", pacote: null, livre: true },
    { id: "t-noite", nome: "À noite", inicio: "19:00", fim: "02:00", pacote: null, livre: noite },
  ];
  return {
    esquema: 1, nicho: "eventos", hoje: hoje.toISOString().slice(0, 10), separa_horas: 48,
    tipos: [{ id: "tipo-casamento", nome: "Casamento" }, { id: "tipo-15", nome: "15 anos" }],
    pacotes: [{ id: "pac-classico", nome: "Clássico", inclui: ["Salão", "Buffet"], convidados: 100 }],
    adicionais: [{ id: "ad-dj", nome: "DJ" }],
    dias: [{ data: dia(5), turnos: turnos(true) }, { data: dia(6), turnos: turnos(false) }],
    _dias: [dia(5), dia(6)],
  };
}

let pasta, site, navegador;
before(async () => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "agenda-online-"));
  ({ site } = montar(path.join(pasta, "saida")));
  if (playwright) navegador = await playwright.chromium.launch();
});
after(async () => {
  await navegador?.close();
  fs.rmSync(pasta, { recursive: true, force: true });
});

/** Abre /agenda/ com o painel imitado: agenda(url) e pedido(corpo) devolvem { status, json } ou null (fora do ar). */
async function abrir({ agenda, pedido }) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const pagina = await ctx.newPage();
  const erros = [], enviados = [];
  pagina.on("pageerror", e => erros.push(e.message));
  await pagina.route("**/*", async rota => {
    const u = new URL(rota.request().url());
    if (u.origin === SITE) {
      const arquivo = path.join(site, u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname);
      if (!fs.existsSync(arquivo)) return rota.fulfill({ status: 404, body: "" });
      return rota.fulfill({ status: 200, contentType: TIPO[path.extname(arquivo)] || "application/octet-stream", body: fs.readFileSync(arquivo) });
    }
    if (u.href.startsWith(API)) {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "Content-Type", "access-control-allow-methods": "GET, POST, OPTIONS" };
      if (rota.request().method() === "OPTIONS") return rota.fulfill({ status: 204, headers: cors });
      const r = u.pathname.endsWith("/pedido") ? (enviados.push(JSON.parse(rota.request().postData())), pedido()) : agenda(u);
      if (!r) return rota.abort();
      return rota.fulfill({ status: r.status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(r.json) });
    }
    return rota.abort();
  });
  await pagina.goto(SITE + "/agenda/");
  return { pagina, ctx, erros, enviados };
}

test("o site sai com a agenda em /agenda/ e o link na seção \"Consulte a sua data\"", () => {
  const html = fs.readFileSync(path.join(site, "index.html"), "utf8");
  assert.match(html, /<a class="text-link" data-site-botao="consulta\.agenda" href="\/agenda\/">Ver as datas livres e pedir a pré-reserva /);
  const agenda = fs.readFileSync(path.join(site, "agenda", "index.html"), "utf8");
  assert.ok(!agenda.includes("{{"), "sem marcação sobrando");
  assert.match(agenda, /window\.AGENDA_ONLINE = \{"codigo":"villa-alecrim","api":"https:\/\/painel\.renderizaweb\.com\.br\/api\/publico\/","whatsapp":"5511900000000","marca":"Villa Alecrim"\}/);
  assert.match(agenda, /:root\{--green:#/, "as cores do site");
  assert.match(fs.readFileSync(path.join(site, "README.md"), "utf8"), /## Agenda online/);
});

test("o que a agenda tira do site, e site sem a seção de consulta fica como está", () => {
  const s = doSite(fs.readFileSync(path.join(site, "index.html"), "utf8"));
  assert.equal(s.marca, "Villa Alecrim");
  assert.equal(s.sub, "Espaço de eventos");
  assert.equal(s.whatsapp, "5511900000000");
  assert.deepEqual(ligarNoSite("<html><head></head><body>sem consulta</body></html>"), { html: "<html><head></head><body>sem consulta</body></html>", ligou: false });
  assert.throws(() => doSite("<html></html>"), /não tem as cores/);
});

test("pré-reserva: festa, data e turno livres, convidados, pacote e contato; o pedido vai ao painel", comNavegador, async () => {
  const d = disponibilidade();
  const { pagina, ctx, erros, enviados } = await abrir({
    agenda: () => ({ status: 200, json: d }),
    pedido: () => ({ status: 201, json: { ok: true, separada_ate: "2026-11-01T10:00:00Z" } }),
  });
  await pagina.waitForSelector(".festa");
  assert.deepEqual(await pagina.$$eval(".festa b", b => b.map(x => x.textContent)), ["Casamento", "15 anos"]);
  await pagina.click(".festa >> nth=0");
  await pagina.click("#mes-prox");
  await pagina.waitForSelector(`[data-d="${d._dias[0]}"].livre`);
  assert.ok(await pagina.$(`[data-d="${d._dias[1]}"].meio`), "dia com um turno ocupado aparece como parte livre");
  await pagina.click(`[data-d="${d._dias[1]}"]`);
  assert.equal(await pagina.$eval('[data-t="t-noite"]', b => b.disabled), true, "o turno ocupado não dá para escolher");
  await pagina.click(`[data-d="${d._dias[0]}"]`);
  await pagina.click('[data-t="t-dia"]');
  await pagina.click("#ir-3");
  await pagina.click('[data-conv="10"]');
  await pagina.click('[data-pac="pac-classico"]');
  await pagina.click('[data-ad="ad-dj"]');
  await pagina.click("#ir-4");
  await pagina.fill("#nome", "Camila Teste");
  await pagina.fill("#zap", "11988887777");
  await pagina.waitForTimeout(3100);
  await pagina.click("#enviar");
  await pagina.waitForSelector('.etapa[data-etapa="5"].ativa');
  assert.match(await pagina.textContent("#pronto-sub"), /separada por 48 horas/);
  const e = enviados[0];
  assert.equal(e.nome, "Camila Teste");
  assert.equal(e.whatsapp, "11988887777");
  assert.equal(e.tipo, "tipo-casamento");
  assert.equal(e.data, d._dias[0]);
  assert.equal(e.turno, "t-dia");
  assert.equal(e.convidados, 110);
  assert.equal(e.pacote, "pac-classico");
  assert.deepEqual(e.adicionais, ["ad-dj"]);
  assert.equal(e.visita, true);
  assert.equal(e.website, "", "o campo-isca vai vazio");
  assert.ok(e.tempo >= 3000, "o tempo desde que a agenda abriu");
  assert.deepEqual(erros, []);
  await ctx.close();
});

test("a data acabou de ser pega por outra pessoa (409): volta ao calendário com o aviso", comNavegador, async () => {
  const d = disponibilidade();
  let vez = 0;
  const { pagina, ctx } = await abrir({
    agenda: () => { vez++; return { status: 200, json: vez > 2 ? { ...d, dias: [{ data: d._dias[0], turnos: d.dias[0].turnos.map(t => ({ ...t, livre: false })) }] } : d }; },
    pedido: () => ({ status: 409, json: { ok: false, erro: "ocupada" } }),
  });
  await pagina.waitForSelector(".festa");
  await pagina.click(".festa >> nth=1");
  await pagina.click("#mes-prox");
  await pagina.click(`[data-d="${d._dias[0]}"]`);
  await pagina.click("#ir-3");
  await pagina.click("#ir-4");
  await pagina.fill("#nome", "Bruno Teste");
  await pagina.fill("#zap", "11977776666");
  await pagina.waitForTimeout(3100);
  await pagina.click("#enviar");
  await pagina.waitForSelector("#aviso-data:not([hidden])");
  assert.match(await pagina.textContent("#aviso-data"), /acabou de ser reservada/);
  assert.equal(await pagina.$eval(".etapa.ativa", e => e.getAttribute("data-etapa")), "2");
  assert.ok(await pagina.$(`[data-d="${d._dias[0]}"].cheio`), "o calendário foi lido de novo");
  await ctx.close();
});

test("painel fora do ar ou site desligado: a agenda vira WhatsApp, com a mensagem pronta", comNavegador, async () => {
  for (const agenda of [() => null, () => ({ status: 404, json: { erro: "fora" } }), () => ({ status: 502, json: {} })]) {
    const { pagina, ctx, erros } = await abrir({ agenda, pedido: () => null });
    await pagina.waitForSelector('.etapa[data-etapa="0"].ativa');
    assert.match(await pagina.getAttribute("#zap-link", "href"), /^https:\/\/wa\.me\/5511900000000\?text=Ol%C3%A1!/);
    assert.equal(await pagina.isVisible("#passos"), false);
    assert.deepEqual(erros, []);
    await ctx.close();
  }
  // o pedido falhar (rede) também leva ao WhatsApp, com a data escrita
  const d = disponibilidade();
  const { pagina, ctx } = await abrir({ agenda: () => ({ status: 200, json: d }), pedido: () => null });
  await pagina.waitForSelector(".festa");
  await pagina.click(".festa >> nth=0");
  await pagina.click("#mes-prox");
  await pagina.click(`[data-d="${d._dias[0]}"]`);
  await pagina.click("#ir-3");
  await pagina.click("#ir-4");
  await pagina.fill("#nome", "Ana Teste");
  await pagina.fill("#zap", "11966665555");
  await pagina.waitForTimeout(3100);
  await pagina.click("#enviar");
  await pagina.waitForSelector('.etapa[data-etapa="0"].ativa');
  const zap = decodeURIComponent(await pagina.getAttribute("#zap-link", "href"));
  assert.match(zap, /Dia: .* \(À noite\)\. Festa: Casamento\. Cerca de 100 convidados\./);
  await ctx.close();
});
