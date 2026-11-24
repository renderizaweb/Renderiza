// O Estoque de ponta a ponta (trilho docs/entregas/ricardo-motors.md, 1E; 12-modulo-estoque.md), no painel de
// verdade contra o STG: o dono de uma revenda fictícia (nicho automotivo, Meu site e Estoque) cria um carro com foto
// pelo celular, muda o preço, marca vendido e desfaz, reserva, destaca, tira do site e põe de novo, e exclui; a cada
// passo, a rota pública (a que o site chama) mostra o que o site vai mostrar. No computador, a mesma tela. Quem "só
// vê" abre a lista e o carro, sem botões de mudar. Tudo fictício, criado e apagado pelo próprio fluxo (ambiente.mjs).
//
//   npm run fluxos            (precisa das variáveis PAINEL_* e do Playwright; sem elas, pula)

import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import * as A from "./ambiente.mjs";

const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const COMPUTADOR = { viewport: { width: 1440, height: 900 } };
const FOTO = fileURLToPath(new URL("../../../exemplos/site-fotografia/og.jpg", import.meta.url)); // foto fictícia dos exemplos
const visivel = (pagina, seletor) => pagina.locator(`${seletor} >> visible=true`).first();
const gaveta = pagina => pagina.locator("dialog[open]").last();

test("o Estoque de ponta a ponta, no STG", { skip: A.motivoParaPular(), timeout: 8 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const dono = { email: A.email("dono-garagem") }, ve = { email: A.email("so-ve-garagem") };
  const api = async () => { const r = await fetch(`${srv.url}/api/publico/estoque/${A.CODIGO}`); return { status: r.status, corpo: r.status === 200 ? await r.json() : null }; };
  /** A rota pública muda logo depois do banco (aqui sem o cache da Vercel): espera até 10 s pelo que se espera. */
  const noSite = async (conferir, oQue) => {
    let ultimo;
    for (let k = 0; k < 20; k++) { ultimo = await api(); if (conferir(ultimo)) return ultimo; await new Promise(r => setTimeout(r, 500)); }
    assert.fail(`${oQue}: a rota pública respondeu ${JSON.stringify(ultimo).slice(0, 300)}`);
  };
  let pagina = null, erros = [];
  try {
    await A.limparSobras(banco);
    await banco.sql(`insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Garagem do Fluxo', 'automotivo', ${A.q(A.CODIGO)}, 'ativa', 'renderiza');
      update public.contas set ajustes = '{"onboarding": {"pendente": true}}' where codigo = ${A.q(A.CODIGO)};
      insert into public.contas_modulos (conta_id, modulo_id) select id, m from public.contas, unnest(array['meu-site', 'estoque']) m where codigo = ${A.q(A.CODIGO)};
      insert into public.sites (conta_id, codigo, dominios) select id, ${A.q(A.CODIGO)}, array['localhost', ${A.q(A.DOMINIO)}] from public.contas where codigo = ${A.q(A.CODIGO)};`);
    dono.senha = await A.criarLogin(banco, dono.email, "Dono da Garagem");
    ve.senha = await A.criarLogin(banco, ve.email, "Vendedor da Garagem");
    await A.porNaConta(banco, dono.email, A.CODIGO, { dono: true, nome: "Dono da Garagem" });
    await A.porNaConta(banco, ve.email, A.CODIGO, { acessos: { estoque: "ver" }, nome: "Vendedor da Garagem" });

    await t.test("a conversa de boas-vindas da loja: perguntas de revenda, serviços e o Estoque primeiro no menu", async () => {
      const ctx = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina, [/functions\/v1\/assistente/]);
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.waitForURL(/\/montar/, { timeout: 15000 });
      await pagina.locator("[data-seguir]").click();
      await pagina.locator("[data-certo]").click();
      await pagina.locator("[data-tipo]:has-text('Consignação')").click();
      await pagina.locator("[data-tipo]:has-text('Financiamento')").click();
      await pagina.locator("form button[type=submit]").click();
      const perguntas = [];
      for (let k = 0; k < 8 && !(await pagina.locator("[data-seguir]").count()); k++) {
        await pagina.locator("[data-resposta]").first().waitFor({ timeout: 20000 });
        perguntas.push(await pagina.locator("h1").innerText());
        await pagina.locator("[data-resposta]").first().click();
        await pagina.waitForFunction(n => document.querySelectorAll("h1").length && document.querySelector("h1").innerText !== n || document.querySelector("[data-seguir]"), perguntas[perguntas.length - 1], { timeout: 15000 });
      }
      assert.ok(perguntas.some(p => /carros/i.test(p)), "pergunta dos carros: " + perguntas.join(" | "));
      assert.ok(!perguntas.some(p => /datas|horários|pacotes|ensaios/i.test(p)), "nada de agenda nem pacotes: " + perguntas.join(" | "));
      assert.match(await pagina.locator("h1").innerText(), /carros/i, "o passo dos arquivos fala dos carros");
      await pagina.locator("[data-seguir]").click();
      await pagina.waitForSelector("#estoque-titulo", { timeout: 30000 });
      const [c] = await banco.sql(`select ajustes -> 'ordem_menu' ->> 0 as primeiro, (select string_agg(nome, ', ' order by nome) from public.servicos s where s.conta_id = c.id) as servicos from public.contas c where codigo = ${A.q(A.CODIGO)}`);
      assert.equal(c.primeiro, "estoque", "o Estoque primeiro no menu");
      assert.equal(c.servicos, "Consignação, Financiamento");
      assert.ok(await pagina.locator("text=Pôr os carros no estoque").count(), "o primeiro passo é pôr os carros");
    });

    await t.test("o dono, no celular: o Estoque vazio, com a cor da loja e o Estoque na barra", async () => {
      await pagina.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      await pagina.waitForSelector("h1:has-text('Estoque')");
      assert.ok(await pagina.locator(".rz-app.rz-tema-automotivo").count(), "o tema do nicho automotivo");
      assert.ok(await visivel(pagina, '.rz-barra a[href="/estoque"]').count(), "o Estoque na barra de baixo");
      await pagina.waitForSelector(".rz-vazio, [data-acao=novo]");
      assert.equal((await api()).corpo.itens.length, 0);
    });

    await t.test("cria um carro com foto e ele vai ao site com o preço e as duas medidas da foto", async () => {
      await visivel(pagina, "[data-novo-item]").click();
      const g = gaveta(pagina);
      await g.locator("[data-enviar]").setInputFiles(FOTO);
      await g.locator(".et-foto img").first().waitFor({ timeout: 20000 });
      await g.locator("#et-marca").fill("Toyota");
      await g.locator("#et-modelo").fill("Corolla Fluxo");
      await g.locator("#et-ano_fab").fill("2021");
      await g.locator("#et-ano_modelo").fill("2022");
      await g.locator("#et-km").fill("38000");
      await g.locator("#et-preco").fill("128.900");
      await g.locator("[data-salvar]").click();
      await pagina.waitForSelector("dialog[open]", { state: "detached", timeout: 15000 });
      assert.match(await A.aviso(pagina), /salvo/i);
      const r = await noSite(x => x.corpo && x.corpo.itens.length === 1, "o carro novo");
      const c = r.corpo.itens[0];
      assert.equal(c.preco, 128900);
      assert.equal(c.campos.modelo, "Corolla Fluxo");
      assert.equal(c.campos.km, 38000);
      assert.equal(c.fotos.length, 1);
      assert.match(c.fotos[0].mini, /^\/api\/publico\/imagens\/[0-9a-f-]{36}\/estoque-[a-z0-9]+-m\.webp$/);
      const [grande, pequena] = await Promise.all([fetch(srv.url + c.fotos[0].url), fetch(srv.url + c.fotos[0].mini)]);
      assert.equal(grande.headers.get("content-type"), "image/webp");
      const [bg, bp] = [(await grande.arrayBuffer()).byteLength, (await pequena.arrayBuffer()).byteLength];
      assert.ok(bp < bg, `a pequena (${bp} bytes) é menor que a grande (${bg})`);
      assert.ok(c.fotos[0].w <= 1600 && c.fotos[0].w > 0);
    });

    const acao = async rotulo => {
      await pagina.locator(".et-linha [data-acoes]").first().click();
      await pagina.locator(`dialog[open] [data-fazer]:has-text("${rotulo}")`).click();
      await pagina.waitForSelector("dialog[open]", { state: "detached" });
    };
    await t.test("vendido sai do site; Desfazer volta", async () => {
      await acao("Marcar como vendido");
      await noSite(x => x.corpo.itens.length === 0, "vendido");
      await pagina.locator(".rz-aviso button:has-text('Desfazer')").click();
      await noSite(x => x.corpo.itens.length === 1 && x.corpo.itens[0].situacao === "disponivel", "desfeito");
    });
    await t.test("reservar, destacar, tirar do site e pôr de novo", async () => {
      await acao("Reservar");
      await noSite(x => x.corpo.itens[0] && x.corpo.itens[0].situacao === "reservado", "reservado");
      await acao("Destacar no site");
      await noSite(x => x.corpo.itens[0] && x.corpo.itens[0].destaque === true, "destaque");
      await acao("Tirar do site");
      await noSite(x => x.corpo.itens.length === 0, "fora do site");
      await acao("Pôr no site");
      await noSite(x => x.corpo.itens.length === 1 && x.corpo.itens[0].situacao === "disponivel", "de volta no site");
    });
    await t.test("muda o preço pela gaveta", async () => {
      await pagina.locator(".et-linha").first().click();
      const g = gaveta(pagina);
      await g.locator("#et-preco").fill("124.900");
      await g.locator("[data-salvar]").click();
      await pagina.waitForSelector("dialog[open]", { state: "detached" });
      await noSite(x => x.corpo.itens[0] && x.corpo.itens[0].preco === 124900, "o preço novo");
      assert.deepEqual(erros, [], "sem erro na tela do dono");
      await pagina.context().close();
    });

    await t.test("no computador, a mesma lista e a gaveta", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina);
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      await pagina.waitForSelector(".et-linha[data-id]");
      assert.ok(await visivel(pagina, '.rz-lateral a[href="/estoque"]').count(), "o Estoque no menu do lado");
      await pagina.locator(".et-linha[data-id]").first().click();
      await gaveta(pagina).locator("#et-modelo").waitFor();
      assert.equal(await gaveta(pagina).locator("#et-modelo").inputValue(), "Corolla Fluxo");
      await gaveta(pagina).locator("[data-fechar]").last().click();
      assert.deepEqual(erros, [], "sem erro no computador");
      await ctx.close();
    });

    await t.test("quem só vê abre a lista e o carro, sem mudar nada", async () => {
      const ctx = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina);
      await A.entrar(pagina, srv.url, ve.email, ve.senha);
      await pagina.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      await pagina.waitForSelector(".et-linha[data-id]");
      assert.equal(await pagina.locator("[data-novo-item], .et-linha [data-acoes]").count(), 0, "sem botão de criar nem de ações");
      await pagina.locator(".et-linha[data-id]").first().click();
      assert.ok(await gaveta(pagina).locator("#et-preco").isDisabled(), "os campos ficam travados");
      assert.equal(await gaveta(pagina).locator("[data-salvar], [data-excluir]").count(), 0);
      assert.deepEqual(erros, [], "sem erro para quem só vê");
      await ctx.close();
    });

    await t.test("excluir tira do site e apaga as fotos", async () => {
      const ctx = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.goto(`${srv.url}/estoque`, { waitUntil: "networkidle" });
      const antes = (await api()).corpo.itens[0];
      await pagina.locator(".et-linha[data-id]").first().click();
      await gaveta(pagina).locator("[data-excluir]").click();
      await pagina.locator("dialog[open] [data-sim]").click();
      await noSite(x => x.corpo.itens.length === 0, "excluído");
      // no Storage (o endereço público ainda responde um tempo pelo cache da CDN do Supabase; o site já não pede)
      const nome = antes.fotos[0].url.replace("/api/publico/imagens/", "");
      let sobra;
      for (let k = 0; k < 10; k++) { [sobra] = await banco.sql(`select count(*)::int as n from storage.objects where bucket_id = 'site-imagens' and name in (${A.q(nome)}, ${A.q(nome.replace(/\.webp$/, "-m.webp"))})`); if (sobra.n === 0) break; await new Promise(r => setTimeout(r, 500)); }
      assert.equal(sobra.n, 0, "as duas medidas da foto saíram do Storage");
      await ctx.close();
    });

    await t.test("Estoque desligado: a rota responde 404 (o site fica sem preço)", async () => {
      await banco.sql(`update public.contas_modulos set ligado = false where modulo_id = 'estoque' and conta_id = (select id from public.contas where codigo = ${A.q(A.CODIGO)})`);
      assert.equal((await api()).status, 404);
    });
  } finally {
    if (pagina) await pagina.context().close().catch(() => {});
    await navegador.close();
    srv.parar();
    await banco.sql(`delete from storage.objects where bucket_id = 'site-imagens' and name like (select id::text || '/estoque-%' from public.contas where codigo = ${A.q(A.CODIGO)})`).catch(() => {});
    await A.limpar(banco);
  }
});
