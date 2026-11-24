// A ponte do Estoque, provada no STG (trilho docs/entregas/ricardo-motors.md, 2C): o site de entrega da Ricardo Motors
// (gerado de verdade pelo demos/ricardo-motors/entrega.mjs, com o código de uma conta de teste e a API do painel
// local) e o painel de verdade, juntos. O site abre sem preço (a reserva) → o painel cria um carro → o site mostra o
// carro com o preço e a foto do painel → reservado aparece com a etiqueta → vendido sai → o Meu site muda a capa e não
// mexe na vitrine → o Estoque desligado no Admin faz o site voltar à reserva, sem preço. Celular e computador.
// Tudo criado e apagado pelo próprio fluxo (ambiente.mjs).
//
//   npm run fluxos            (precisa das variáveis PAINEL_* e do Playwright; sem elas, pula)

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import * as A from "./ambiente.mjs";

const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const COMPUTADOR = { viewport: { width: 1366, height: 860 } };
const RAIZ = fileURLToPath(new URL("../../../", import.meta.url));
const FOTO = path.join(RAIZ, "exemplos", "site-fotografia", "og.jpg"); // foto fictícia dos exemplos
const TIPOS = { ".html": "text/html; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };

/** Serve a pasta do site como a hospedagem (localhost: o domínio de teste da conta). */
function servirSite(pasta) {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
      const f = path.join(pasta, rel);
      if (!f.startsWith(pasta) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" });
      res.end(fs.readFileSync(f));
    }).listen(0, () => ok({ url: `http://localhost:${s.address().port}`, parar: () => s.close() }));
  });
}

test("a ponte do Estoque: o site de entrega e o painel, no STG", { skip: A.motivoParaPular(), timeout: 8 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const pastaSite = fs.mkdtempSync(path.join(os.tmpdir(), "ponte-estoque-"));
  const { gerar } = await import(path.join(RAIZ, "demos", "ricardo-motors", "entrega.mjs"));
  gerar(pastaSite, { codigo: A.CODIGO, api: `${srv.url}/api/publico/`, silencioso: true });
  const site = await servirSite(pastaSite);
  const dono = { email: A.email("dono-ponte") };
  const contaId = async () => (await banco.sql(`select id from public.contas where codigo = ${A.q(A.CODIGO)}`))[0].id;
  /** Abre o site numa aba nova (a sessão do navegador começa vazia: nada guardado) e devolve o que ele mostra. */
  const abrirSite = async (ctx, espera = c => true, oQue = "o site") => {
    let ultimo;
    for (let k = 0; k < 12; k++) {
      const p = await ctx.newPage();
      const erros = A.vigiar(p);
      await p.goto(site.url + "/", { waitUntil: "networkidle" });
      await p.waitForTimeout(400);
      ultimo = await p.evaluate(() => ({
        precos: (document.body.innerText.match(/R\$ ?[\d.]+/g) || []),
        aviso: !document.querySelector("[data-estoque-aviso]").hidden,
        cards: [...document.querySelectorAll("#grade .card h3")].map(h => h.textContent),
        etiquetas: [...document.querySelectorAll("#grade .card .selo")].map(s => s.textContent),
        capa: document.getElementById("vc-txt").textContent,
        titulo: document.querySelector("[data-site='inicio.titulo']").textContent,
      }));
      ultimo.erros = erros;
      if (espera(ultimo)) return { pagina: p, ...ultimo };
      await p.close();
      await new Promise(r => setTimeout(r, 2000));
    }
    assert.fail(`${oQue}: ${JSON.stringify(ultimo)}`);
  };
  let ctxSite, ctxPainel, painel;
  try {
    await A.limparSobras(banco);
    await banco.sql(`insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Ricardo Motors (teste do fluxo)', 'automotivo', ${A.q(A.CODIGO)}, 'ativa', 'renderiza');
      insert into public.contas_modulos (conta_id, modulo_id) select id, m from public.contas, unnest(array['meu-site', 'estoque']) m where codigo = ${A.q(A.CODIGO)};
      insert into public.sites (conta_id, codigo, dominios) select id, ${A.q(A.CODIGO)}, array['localhost'] from public.contas where codigo = ${A.q(A.CODIGO)};`);
    dono.senha = await A.criarLogin(banco, dono.email, "Dono da Ponte");
    await A.porNaConta(banco, dono.email, A.CODIGO, { dono: true, nome: "Dono da Ponte" });
    ctxSite = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });

    await t.test("o painel ainda vazio: nenhum preço no site", async () => {
      // o painel responde com a lista vazia; a reserva só fica quando ele não responde (o último passo)
      const r = await abrirSite(ctxSite, x => x.precos.length === 0, "a reserva");
      assert.deepEqual(r.precos, []);
      await r.pagina.close();
    });

    await t.test("o dono cria um carro no painel e ele aparece no site com o preço e a foto do painel", async () => {
      ctxPainel = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });
      painel = await ctxPainel.newPage();
      await A.entrar(painel, srv.url, dono.email, dono.senha);
      await painel.goto(`${srv.url}/estoque?novo=item`, { waitUntil: "networkidle" });
      const g = painel.locator("dialog[open]").last();
      await g.locator("[data-enviar]").setInputFiles(FOTO);
      await g.locator(".et-foto img").first().waitFor({ timeout: 20000 });
      await g.locator("#et-marca").fill("Toyota");
      await g.locator("#et-modelo").fill("Corolla");
      await g.locator("#et-ano_fab").fill("2021");
      await g.locator("#et-ano_modelo").fill("2022");
      await g.locator("#et-km").fill("38000");
      await g.locator("#et-preco").fill("128.900");
      await g.locator("[data-salvar]").click();
      await painel.waitForSelector("dialog[open]", { state: "detached", timeout: 15000 });
      const id = (await banco.sql(`select gen_random_uuid() as id`))[0].id;
      await banco.sql(`insert into public.estoque_itens (id, conta_id, esquema, situacao, preco, campos) select ${A.q(id)}, id, 'automotivo', 'disponivel', 98900, '{"marca": "Honda", "modelo": "Civic", "ano_fab": 2020, "ano_modelo": 2020, "km": 47000, "carroceria": "Sedã"}' from public.contas where codigo = ${A.q(A.CODIGO)}`);
      const r = await abrirSite(ctxSite, x => x.cards.length === 2, "os 2 carros do painel");
      assert.ok(r.precos.includes("R$ 128.900") && r.precos.includes("R$ 98.900"), JSON.stringify(r.precos));
      assert.equal(r.aviso, false, "com o painel, o aviso da reserva some");
      assert.match(r.capa, /Toyota Corolla · R\$ 128\.900/, "a capa com o carro que tem foto");
      const src = await r.pagina.locator("#grade .card img").first().getAttribute("src");
      assert.ok(src.startsWith(`${srv.url}/api/publico/imagens/`) && src.endsWith("-m.webp"), "o card usa a foto pequena do painel: " + src);
      await r.pagina.locator("#grade .card .trilho img").first().click();
      await r.pagina.waitForFunction(() => /#carro-[0-9a-f-]{36}/.test(location.hash));
      assert.match(await r.pagina.locator("#dt .caixa .preco").innerText(), /R\$ 128\.900/);
      assert.equal(await r.pagina.locator("#dt .aviso-carro").count(), 0, "com o painel, a página do carro não pede para confirmar");
      assert.ok((await r.pagina.locator("#g-img").getAttribute("src")).endsWith(".webp") && !(await r.pagina.locator("#g-img").getAttribute("src")).endsWith("-m.webp"), "a galeria usa a foto grande");
      assert.deepEqual(r.erros, []);
      await r.pagina.close();
    });

    const acao = async (titulo, rotulo) => {
      await painel.locator(`.et-linha:has-text("${titulo}") [data-acoes]`).click();
      await painel.locator(`dialog[open] [data-fazer]:has-text("${rotulo}")`).click();
      await painel.waitForSelector("dialog[open]", { state: "detached" });
    };
    await t.test("reservado aparece com a etiqueta; vendido sai do site", async () => {
      await acao("Toyota Corolla", "Reservar");
      const r1 = await abrirSite(ctxSite, x => x.etiquetas.includes("Reservado"), "a etiqueta Reservado");
      await r1.pagina.close();
      // o Civic entrou direto no banco: o painel aberto só lê a lista ao abrir a tela
      await painel.reload({ waitUntil: "networkidle" });
      await painel.waitForSelector('.et-linha:has-text("Honda Civic")');
      await acao("Honda Civic", "Marcar como vendido");
      const r2 = await abrirSite(ctxSite, x => x.cards.length === 1, "o vendido fora");
      assert.deepEqual(r2.cards.map(c => c.toLowerCase()), ["toyota corolla"]);
      await r2.pagina.close();
    });

    await t.test("o Meu site muda a capa e não mexe na vitrine", async () => {
      await banco.sql(`insert into public.sites_versoes (conta_id, site_id, numero, conteudo, estado, publicada_em)
        select s.conta_id, s.id, 1, '{"secoes": {"inicio": {"textos": {"titulo": "Carros com *procedência*."}}}}'::jsonb, 'publicada', now() from public.sites s where s.codigo = ${A.q(A.CODIGO)}`);
      const r = await abrirSite(ctxSite, x => /procedência/.test(x.titulo), "a capa nova do Meu site");
      assert.deepEqual(r.cards.map(c => c.toLowerCase()), ["toyota corolla"], "a vitrine continua a do Estoque");
      assert.ok(r.precos.includes("R$ 128.900"));
      await r.pagina.close();
    });

    await t.test("no computador, o mesmo site com o painel", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR" });
      const r = await abrirSite(ctx, x => x.cards.length === 1, "o computador");
      assert.ok(r.precos.includes("R$ 128.900"));
      assert.deepEqual(r.erros, []);
      await ctx.close();
    });

    await t.test("o Estoque desligado no Admin: o site volta à reserva, sem preço e com o aviso", async () => {
      await banco.sql(`update public.contas_modulos set ligado = false where modulo_id = 'estoque' and conta_id = ${A.q(await contaId())}`);
      const r = await abrirSite(ctxSite, x => x.cards.length === 15, "a reserva de volta");
      assert.deepEqual(r.precos, [], "nenhum preço");
      assert.equal(r.aviso, true, "o aviso do WhatsApp");
      assert.match(r.titulo, /procedência/, "o Meu site continua");
      await r.pagina.close();
    });
  } finally {
    await navegador.close();
    site.parar();
    srv.parar();
    fs.rmSync(pastaSite, { recursive: true, force: true });
    await A.limpar(banco);
  }
});
