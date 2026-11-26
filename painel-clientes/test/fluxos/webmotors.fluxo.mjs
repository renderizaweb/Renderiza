// Trazer do anúncio da WebMotors de ponta a ponta (12-modulo-estoque.md, "Trazer do anúncio"; 26/11/2026), no painel de
// verdade contra o STG: no computador, o dono abre "Adicionar carro", vê o passo a passo, copia um anúncio (fictício,
// test/fixtures/anuncio-webmotors.txt) para a área de transferência e cola com Ctrl+V: os campos se preenchem, ele salva
// e o carro está no banco; um texto que não é anúncio dá o aviso; no celular, o cartão não aparece. Tudo fictício,
// criado e apagado pelo próprio fluxo (ambiente.mjs).
//
//   npm run fluxos            (precisa das variáveis PAINEL_* e do Playwright; sem elas, pula)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as A from "./ambiente.mjs";

const COMPUTADOR = { viewport: { width: 1440, height: 900 } };
const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const ANUNCIO = readFileSync(new URL("../fixtures/anuncio-webmotors.txt", import.meta.url), "utf8").split("\n").filter(l => !l.startsWith("#")).join("\n").trim();
const gaveta = pagina => pagina.locator("dialog[open]").last();

test("trazer do anúncio da WebMotors, no STG", { skip: A.motivoParaPular(), timeout: 5 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const dono = { email: A.email("dono-trazer") };
  let pagina = null, erros = [];
  const passo = async (nome, fazer) => t.test(nome, async () => {
    try { await fazer(); } catch (e) { const r = await A.retrato(pagina, nome); throw new Error(`${e.message}${r ? `\n(print: ${r.arquivo})` : ""}`); }
  });
  try {
    await A.limparSobras(banco);
    await banco.sql(`insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Garagem que Traz', 'automotivo', ${A.q(A.CODIGO)}, 'ativa', 'renderiza');
      insert into public.contas_modulos (conta_id, modulo_id) select id, m from public.contas, unnest(array['meu-site', 'estoque']) m where codigo = ${A.q(A.CODIGO)};`);
    dono.senha = await A.criarLogin(banco, dono.email, "Dono da Garagem");
    await A.porNaConta(banco, dono.email, A.CODIGO, { dono: true, nome: "Dono da Garagem" });

    await passo("no computador: o passo a passo, o Ctrl+V preenche os campos, e o carro salvo vem do anúncio", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR", permissions: ["clipboard-read", "clipboard-write"] });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina);
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      await pagina.locator("[data-novo-item] >> visible=true").first().click();
      const g = gaveta(pagina);
      await g.locator("[data-trazer]").waitFor();
      assert.match(await g.locator("[data-trazer]").innerText(), /Já anunciou este carro na WebMotors\?/);
      await g.locator("[data-trazer-abrir]").click();
      assert.equal(await g.locator(".et-passo").count(), 3, "os três passos");
      assert.match(await g.locator(".et-passos").innerText(), /Abra o anúncio[\s\S]*Copie a página toda[\s\S]*Ctrl[\s\S]*A[\s\S]*depois[\s\S]*Ctrl[\s\S]*C[\s\S]*Cole aqui[\s\S]*Ctrl[\s\S]*V/);
      if (process.env.FLUXO_RETRATOS) { await pagina.waitForTimeout(3600); await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/trazer-passos.png` }); }
      // copia o anúncio como a pessoa faria, e cola com o teclado
      await pagina.evaluate(texto => navigator.clipboard.writeText(texto), ANUNCIO);
      await g.locator("[data-colar]").click();
      await pagina.keyboard.press("Control+V");
      await g.locator("[data-trazer-feito]:not([hidden])").waitFor();
      assert.match(await g.locator("[data-trazer-feito]").innerText(), /Pronto: \d+ campos vieram do anúncio\.[\s\S]*Porsche Cayenne 2023\/2024 · 21\.500 km · R\$ 689\.900[\s\S]*2 itens sem caixa aqui foram para o fim da descrição/);
      const valor = s => g.locator(s).inputValue();
      assert.equal(await valor("#et-marca"), "Porsche");
      assert.equal(await valor("#et-modelo"), "Cayenne");
      assert.equal(await valor("#et-versao"), "3.0 V6 E-HYBRID PLATINUM TIPTRONIC");
      assert.equal(await valor("#et-ano_fab"), "2023");
      assert.equal(await valor("#et-ano_modelo"), "2024");
      assert.equal(await valor("#et-km"), "21.500");
      assert.equal(await valor("#et-cambio"), "Automático");
      assert.equal(await valor("#et-combustivel"), "Híbrido");
      assert.equal(await valor("#et-carroceria"), "SUV");
      assert.equal(await valor("#et-placa"), "7");
      assert.equal(await valor("#et-preco"), "689.900");
      assert.match(await valor("#et-descricao"), /^Carro de garagem[\s\S]*Itens: Bluetooth, Sensor de ponto cego\.$/);
      assert.equal(await g.locator('input[name="blindado"]').isChecked(), false);
      assert.equal(await g.locator('input[name="troca"]').isChecked(), true);
      assert.equal(await g.locator('input[name="unico_dono"]').isChecked(), true);
      assert.equal(await g.locator('input[name="opcionais"][value="Câmera 360"]').isChecked(), true);
      assert.equal(await g.locator(".et-trazer-painel").isHidden(), true, "a área de colar fecha depois de trazer");
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/trazer-pronto.png` });
      await g.locator("[data-salvar]").click();
      await g.waitFor({ state: "detached" }).catch(() => {});
      await pagina.waitForFunction(() => /Porsche Cayenne: salvo/.test(document.body.innerText), null, { timeout: 15000 });
      const [c] = await banco.sql(`select campos, preco::float as preco, descricao from public.estoque_itens where conta_id = (select id from public.contas where codigo = ${A.q(A.CODIGO)})`);
      assert.equal(c.campos.marca, "Porsche");
      assert.equal(c.campos.km, 21500);
      assert.equal(c.campos.cambio, "Automático");
      assert.equal(c.campos.troca, true);
      assert.deepEqual(c.campos.opcionais, ["Teto solar", "Bancos de couro", "Câmera 360", "Faróis de LED", "Chave presencial"]);
      assert.equal(c.preco, 689900);
      assert.match(c.descricao, /Sport Chrono/);
      assert.deepEqual(erros, []);
      await ctx.close();
    });

    await passo("um texto que não é anúncio: o aviso, e nada muda", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      await pagina.locator("[data-novo-item] >> visible=true").first().click();
      const g = gaveta(pagina);
      await g.locator("[data-trazer-abrir]").click();
      await g.locator("[data-colar]").evaluate(el => {
        const dt = new DataTransfer();
        dt.setData("text/plain", "Oi, tudo bem? Quero ver o carro amanhã.");
        el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
      });
      assert.match(await g.locator("[data-trazer-erro]").innerText(), /Não achamos um anúncio nesse texto/);
      assert.equal(await g.locator("#et-marca").inputValue(), "");
      await ctx.close();
    });

    await passo("no celular, o cartão não aparece", async () => {
      const ctx = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      await pagina.locator("[data-novo-item] >> visible=true").first().click();
      await gaveta(pagina).locator("[data-fotos]").waitFor();
      assert.equal(await gaveta(pagina).locator("[data-trazer]").count(), 0);
      await ctx.close();
    });
  } finally {
    await navegador.close().catch(() => {});
    srv.parar();
    await A.limpar(banco).catch(() => {});
  }
});
