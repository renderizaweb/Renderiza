// A Assinatura de ponta a ponta (13-assinatura.md; 26/11/2026), no painel de verdade contra o STG: a Renderiza
// combina a primeira mensalidade no Admin; o dono vê "Assinatura" no menu e a tela antes da primeira, com uma em
// aberto e em dia (o Pix registrado); no celular, sem rolar para o lado; a equipe não vê a Assinatura. Tudo fictício,
// criado e apagado pelo próprio fluxo (ambiente.mjs).
//
//   npm run fluxos            (precisa das variáveis PAINEL_* e do Playwright; sem elas, pula)

import { test } from "node:test";
import assert from "node:assert/strict";
import * as A from "./ambiente.mjs";

const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const COMPUTADOR = { viewport: { width: 1440, height: 900 } };
const NOME = "Loja da Assinatura";
const hoje = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const somarDias = (d, n) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const texto = async pagina => (await pagina.locator("main").innerText()).replace(/\s+/g, " ");

test("a Assinatura de ponta a ponta, no STG", { skip: A.motivoParaPular(), timeout: 6 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const dono = { email: A.email("dono-assinatura") }, ve = { email: A.email("equipe-assinatura") }, adm = { email: A.email("renderiza-assinatura") };
  let pagina = null, erros = [];
  const passo = async (nome, fazer) => t.test(nome, async () => {
    try { await fazer(); } catch (e) { const r = await A.retrato(pagina, nome); throw new Error(`${e.message}${r ? `\n(print: ${r.arquivo})` : ""}`); }
  });
  try {
    await A.limparSobras(banco);
    await banco.sql(`insert into public.contas (nome, nicho, codigo, situacao, origem) values (${A.q(NOME)}, 'automotivo', ${A.q(A.CODIGO)}, 'ativa', 'renderiza');
      insert into public.contas_modulos (conta_id, modulo_id) select id, m from public.contas, unnest(array['meu-site', 'estoque']) m where codigo = ${A.q(A.CODIGO)};`);
    dono.senha = await A.criarLogin(banco, dono.email, "Dono da Loja");
    ve.senha = await A.criarLogin(banco, ve.email, "Vendedor da Loja");
    adm.senha = await A.criarLogin(banco, adm.email, "Renderiza do fluxo");
    await A.porNaConta(banco, dono.email, A.CODIGO, { dono: true, nome: "Dono da Loja" });
    await A.porNaConta(banco, ve.email, A.CODIGO, { acessos: { estoque: "editar" }, nome: "Vendedor da Loja" });
    await A.porNaEquipeRenderiza(banco, adm.email);
    const [{ id: contaId }] = await banco.sql(`select id from public.contas where codigo = ${A.q(A.CODIGO)}`);
    const primeira = somarDias(hoje(), 20);

    await passo("a Renderiza combina a primeira mensalidade no Admin", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina);
      await A.entrar(pagina, srv.url, adm.email, adm.senha);
      await pagina.goto(`${srv.url}/admin`, { waitUntil: "networkidle" });
      await pagina.click("[data-chip=todas]");
      await pagina.locator(`[data-lista] .rz-linha:has-text("${NOME}")`).click();
      assert.match(await pagina.locator("dialog[open] [data-combinado]").innerText(), /R\$ 49,00 \(do plano\) · o dia ainda não foi combinado/);
      await pagina.click("dialog[open] [data-combinar]");
      await pagina.fill("#cb-inicio", primeira);
      await pagina.click("dialog[open] [type=submit]");
      await pagina.waitForSelector("#cb-inicio", { state: "detached" });
      const [a] = await banco.sql(`select inicio::text, dia, valor from public.assinaturas where conta_id = ${A.q(contaId)}`);
      assert.deepEqual(a, { inicio: primeira, dia: null, valor: null }, "o combinado: só a primeira (o dia e o valor seguem o padrão)");
      assert.deepEqual(erros, []);
      await ctx.close();
    });

    await passo("o dono vê a Assinatura no menu e a primeira mensalidade, no computador", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina);
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.locator('a[href="/assinatura"] >> visible=true').first().click();
      await pagina.waitForSelector("h1:has-text('Assinatura')");
      await pagina.waitForSelector(".rz-assinatura-topo");
      const t1 = await texto(pagina);
      assert.match(t1, /A primeira mensalidade vence em \d+ de [a-zç]+/, t1.slice(0, 300));
      assert.match(t1, /R\$ 49,00 por mês/);
      assert.match(t1, new RegExp(`Todo dia ${Number(primeira.slice(8, 10))}`));
      assert.match(t1, /Estoque/);
      assert.match(t1, /Meu site: incluído em todo plano/);
      assert.match(t1, /A vencer/, "o extrato mostra a primeira");
      assert.match(t1, /Mensal, sem fidelidade/);
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/assinatura-computador.png`, fullPage: true });
      assert.deepEqual(erros, []);
      await ctx.close();
    });

    await passo("com uma mensalidade em aberto, e depois em dia (o Pix registrado), no celular", async () => {
      const inicio = somarDias(hoje(), -40);
      await banco.sql(`update public.assinaturas set inicio = ${A.q(inicio)} where conta_id = ${A.q(contaId)};
        insert into public.pagamentos (conta_id, mes, valor, pago_em, observacao) values (${A.q(contaId)}, ${A.q(inicio.slice(0, 8) + "01")}, 49, ${A.q(inicio)}, 'nota interna do fluxo');`);
      const ctx = await navegador.newContext({ ...CELULAR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina);
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.goto(`${srv.url}/assinatura`, { waitUntil: "networkidle" });
      await pagina.waitForSelector(".rz-assinatura-topo--perigo");
      const t2 = await texto(pagina);
      assert.match(t2, /está em aberto/, t2.slice(0, 300));
      assert.match(t2, /Em aberto/);
      assert.match(t2, /Pago/);
      assert.ok(!/nota interna/.test(t2), "a observação da Renderiza não aparece");
      assert.equal(await A.rolaParaOLado(pagina), false, "no celular, sem rolar para o lado");
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/assinatura-celular-em-aberto.png`, fullPage: true });
      const segundo = await banco.sql(`select to_char((date_trunc('month', ${A.q(inicio)}::date) + interval '1 month')::date, 'YYYY-MM-DD') as mes`);
      await banco.sql(`insert into public.pagamentos (conta_id, mes, valor, pago_em) values (${A.q(contaId)}, ${A.q(segundo[0].mes)}, 49, ${A.q(hoje())});`);
      await pagina.reload({ waitUntil: "networkidle" });
      await pagina.waitForSelector(".rz-assinatura-topo--sucesso");
      assert.match(await texto(pagina), /Tudo em dia/);
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/assinatura-celular-em-dia.png`, fullPage: true });
      assert.deepEqual(erros, []);
      await ctx.close();
    });

    await passo("a equipe não vê a Assinatura", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      erros = A.vigiar(pagina, [/rpc\/minha_assinatura/]);
      await A.entrar(pagina, srv.url, ve.email, ve.senha);
      assert.equal(await pagina.locator('a[href="/assinatura"]').count(), 0, "nem no menu");
      await pagina.goto(`${srv.url}/assinatura`, { waitUntil: "networkidle" });
      assert.equal(await pagina.locator(".rz-assinatura-topo").count(), 0, "nem pelo endereço");
      await ctx.close();
    });
  } finally {
    await navegador.close().catch(() => {});
    srv.parar();
    await A.limpar(banco).catch(() => {});
  }
});
