// Trazer do anúncio da WebMotors e a trava de foto, de ponta a ponta (12-modulo-estoque.md, "Trazer do anúncio";
// 26/11/2026), no painel de verdade contra o STG. No computador, o dono:
// - abre "Adicionar carro", vê o passo a passo, copia um anúncio (fictício, test/fixtures/anuncio-webmotors.txt) e cola
//   com Ctrl+V: os campos se preenchem; sem foto, o painel não deixa ir ao site; com a foto, salva;
// - edita o carro e "atualiza pelo anúncio" com o anúncio mudado: o painel diz o que mudou, e o salvo vale;
// - cola o anúncio de outro carro: o painel pergunta antes de trocar;
// - tenta pôr no site um carro sem foto pela lista: o painel pede a foto.
// Um texto que não é anúncio dá o aviso; no celular, o cartão não aparece. Tudo fictício, criado e apagado pelo
// próprio fluxo (ambiente.mjs; a foto sai do Storage quando o carro é excluído).
//
//   npm run fluxos            (precisa das variáveis PAINEL_* e do Playwright; sem elas, pula)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as A from "./ambiente.mjs";

const COMPUTADOR = { viewport: { width: 1440, height: 900 } };
const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const FOTO = fileURLToPath(new URL("../../../exemplos/site-fotografia/og.jpg", import.meta.url)); // foto fictícia dos exemplos
const ANUNCIO = readFileSync(new URL("../fixtures/anuncio-webmotors.txt", import.meta.url), "utf8").split("\n").filter(l => !l.startsWith("#")).join("\n").trim();
// o mesmo anúncio, depois de mudado na WebMotors: preço, km, blindado, e a câmera 360 saiu dos itens
const MUDADO = ANUNCIO.replace("Valor anunciado\nR$ 689.900", "Valor anunciado\nR$ 659.900").replace("KM\n21.500", "KM\n22.300")
  .replace("Blindado\nNão", "Blindado\nSim").replace("Câmera 360\n", "");
const OUTRO = ANUNCIO.replace("PORSCHE\nCAYENNE", "BMW\n330e");
const gaveta = pagina => pagina.locator("dialog[open]").last();
const colar = (g, texto) => g.locator("[data-colar]").evaluate((el, t) => {
  const dt = new DataTransfer();
  dt.setData("text/plain", t);
  el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
}, texto);

test("trazer do anúncio da WebMotors e a trava de foto, no STG", { skip: A.motivoParaPular(), timeout: 8 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const dono = { email: A.email("dono-trazer") };
  let pagina = null, ctx = null, erros = [];
  const passo = async (nome, fazer) => t.test(nome, async () => {
    try { await fazer(); } catch (e) { const r = await A.retrato(pagina, nome); throw new Error(`${e.message}${r ? `\n(print: ${r.arquivo})` : ""}`); }
  });
  const carro = async () => (await banco.sql(`select campos, preco::float as preco, descricao, situacao, jsonb_array_length(fotos) as fotos from public.estoque_itens
    where conta_id = (select id from public.contas where codigo = ${A.q(A.CODIGO)}) and campos ->> 'modelo' = 'Cayenne'`))[0];
  try {
    await A.limparSobras(banco);
    await banco.sql(`insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Garagem que Traz', 'automotivo', ${A.q(A.CODIGO)}, 'ativa', 'renderiza');
      insert into public.contas_modulos (conta_id, modulo_id) select id, m from public.contas, unnest(array['meu-site', 'estoque']) m where codigo = ${A.q(A.CODIGO)};`);
    dono.senha = await A.criarLogin(banco, dono.email, "Dono da Garagem");
    await A.porNaConta(banco, dono.email, A.CODIGO, { dono: true, nome: "Dono da Garagem" });
    ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR", permissions: ["clipboard-read", "clipboard-write"] });
    pagina = await ctx.newPage();
    erros = A.vigiar(pagina);
    await A.entrar(pagina, srv.url, dono.email, dono.senha);

    await passo("carro novo: o passo a passo, o Ctrl+V preenche; sem foto não vai ao site; com a foto, salva", async () => {
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
      assert.equal(await valor("#et-ano_modelo"), "2024");
      assert.equal(await valor("#et-km"), "21.500");
      assert.equal(await valor("#et-cambio"), "Automático");
      assert.equal(await valor("#et-combustivel"), "Híbrido");
      assert.equal(await valor("#et-carroceria"), "SUV");
      assert.equal(await valor("#et-placa"), "7");
      assert.equal(await valor("#et-preco"), "689.900");
      assert.match(await valor("#et-descricao"), /^Carro de garagem[\s\S]*Itens: Bluetooth, Sensor de ponto cego\.$/);
      assert.equal(await g.locator('input[name="troca"]').isChecked(), true);
      assert.equal(await g.locator('input[name="opcionais"][value="Câmera 360"]').isChecked(), true);
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/trazer-pronto.png` });
      // sem foto, não vai
      await g.locator("[data-salvar]").click();
      await g.locator("[data-sem-foto]:not([hidden])").waitFor();
      assert.match(await g.locator("[data-sem-foto]").innerText(), /Ponha pelo menos uma foto/);
      assert.equal(await carro(), undefined, "nada foi salvo");
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/trazer-sem-foto.png` });
      await g.locator("[data-enviar]").setInputFiles(FOTO);
      await g.locator(".et-foto img").first().waitFor({ timeout: 20000 });
      assert.equal(await g.locator("[data-sem-foto]").isHidden(), true, "pôs a foto: o aviso sai");
      await g.locator("[data-salvar]").click();
      await pagina.waitForFunction(() => /Porsche Cayenne: salvo/.test(document.body.innerText), null, { timeout: 15000 });
      const c = await carro();
      assert.equal(c.campos.km, 21500);
      assert.equal(c.preco, 689900);
      assert.equal(c.fotos, 1);
      assert.deepEqual(c.campos.opcionais, ["Teto solar", "Bancos de couro", "Câmera 360", "Faróis de LED", "Chave presencial"]);
    });

    await passo("editar: atualizar pelo anúncio mudado diz o que mudou, e o salvo vale (a foto fica)", async () => {
      await pagina.locator(".et-linha[data-id]").first().click();
      const g = gaveta(pagina);
      assert.match(await g.locator("[data-trazer]").innerText(), /Mudou alguma coisa no anúncio da WebMotors\?/);
      await g.locator("[data-trazer-abrir]").click();
      assert.match(await g.locator(".et-trazer-painel").innerText(), /substitui o que está aqui/);
      await colar(g, MUDADO);
      await g.locator("[data-trazer-feito]:not([hidden])").waitFor();
      const feito = await g.locator("[data-trazer-feito]").innerText();
      assert.match(feito, /Atualizado pelo anúncio: 4 campos mudaram\./, feito);
      assert.match(feito, /Quilometragem: 21\.500 km → 22\.300 km/);
      assert.match(feito, /Blindado: Não → Sim/);
      assert.match(feito, /Opcionais: mudaram/);
      assert.match(feito, /Preço: R\$ 689\.900 → R\$ 659\.900/);
      assert.doesNotMatch(feito, /Descrição: mudou/, "a descrição é a mesma (a câmera saiu dos opcionais, que têm caixa)");
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/trazer-atualizar.png` });
      await g.locator("[data-salvar]").click();
      await pagina.waitForFunction(() => /Porsche Cayenne: salvo/.test(document.body.innerText), null, { timeout: 15000 });
      const c = await carro();
      assert.equal(c.campos.km, 22300);
      assert.equal(c.campos.blindado, true);
      assert.equal(c.preco, 659900);
      assert.equal(c.campos.opcionais.includes("Câmera 360"), false);
      assert.equal(c.fotos, 1, "a foto ficou");
    });

    await passo("o anúncio de outro carro: o painel pergunta, e nada muda se não confirmar", async () => {
      await pagina.locator(".et-linha[data-id]").first().click();
      const g = gaveta(pagina);
      await g.locator("[data-trazer-abrir]").click();
      await colar(g, OUTRO);
      const pergunta = pagina.locator("dialog[open]").last();
      await pergunta.locator("[data-sim]").waitFor();
      assert.match(await pergunta.innerText(), /Esse anúncio parece ser de outro carro[\s\S]*BMW 330e[\s\S]*Porsche Cayenne/);
      await pergunta.locator("[data-fechar]").first().click();
      await pagina.waitForTimeout(300);
      assert.equal(await gaveta(pagina).locator("#et-marca").inputValue(), "Porsche", "nada mudou");
      await gaveta(pagina).locator("[data-fechar]").last().click();
    });

    await passo("pela lista, pôr no site um carro sem foto pede a foto", async () => {
      await banco.sql(`insert into public.estoque_itens (conta_id, esquema, situacao, campos) select id, 'automotivo', 'oculto', '{"marca": "Fiat", "modelo": "Sem Foto"}' from public.contas where codigo = ${A.q(A.CODIGO)}`);
      await pagina.reload({ waitUntil: "networkidle" });
      const linha = pagina.locator('.et-linha:has-text("Fiat Sem Foto")');
      assert.match(await linha.innerText(), /Sem foto/);
      await linha.locator("[data-acoes]").click();
      await pagina.locator('dialog[open] [data-fazer="disponivel"]').click();
      await gaveta(pagina).locator("[data-sem-foto]:not([hidden])").waitFor();
      assert.match(await A.aviso(pagina), /ponha pelo menos uma foto antes/);
      const [f] = await banco.sql(`select situacao from public.estoque_itens where campos ->> 'modelo' = 'Sem Foto' and conta_id = (select id from public.contas where codigo = ${A.q(A.CODIGO)})`);
      assert.equal(f.situacao, "oculto", "continua fora do site");
      await gaveta(pagina).locator("[data-fechar]").last().click();
    });

    await passo("um texto que não é anúncio: o aviso, e nada muda", async () => {
      await pagina.locator("[data-novo-item] >> visible=true").first().click();
      const g = gaveta(pagina);
      await g.locator("[data-trazer-abrir]").click();
      await colar(g, "Oi, tudo bem? Quero ver o carro amanhã.");
      assert.match(await g.locator("[data-trazer-erro]").innerText(), /Não achamos um anúncio nesse texto/);
      assert.equal(await g.locator("#et-marca").inputValue(), "");
      await g.locator("[data-fechar]").last().click();
      assert.deepEqual(erros, []);
    });

    await passo("no celular, o cartão não aparece", async () => {
      const cel = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });
      const p = await cel.newPage();
      await A.entrar(p, srv.url, dono.email, dono.senha);
      await p.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      await p.locator("[data-novo-item] >> visible=true").first().click();
      await gaveta(p).locator("[data-fotos]").waitFor();
      assert.equal(await gaveta(p).locator("[data-trazer]").count(), 0);
      await cel.close();
    });

    await passo("excluir o carro tira a foto do Storage (limpeza)", async () => {
      await pagina.locator('.et-linha:has-text("Porsche Cayenne")').click();
      await gaveta(pagina).locator("[data-excluir]").click();
      await pagina.locator("dialog[open] [data-sim]").click();
      await pagina.waitForFunction(() => /excluído/.test(document.body.innerText), null, { timeout: 15000 });
      assert.equal(await carro(), undefined);
    });
  } finally {
    await navegador.close().catch(() => {});
    srv.parar();
    await A.limpar(banco).catch(() => {});
  }
});
