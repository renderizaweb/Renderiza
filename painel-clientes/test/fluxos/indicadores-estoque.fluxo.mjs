// Os indicadores do Estoque no Meu site (03, "Indicadores"; 12; 26/11/2026), no painel de verdade contra o STG: com
// visitas fictícias gravadas como o site grava (ver.<id> quando um carro é aberto, zap.<id> quando o WhatsApp sai da
// página dele), a aba Indicadores mostra "Carros mais vistos" na ordem, os cliques no WhatsApp de cada um, os botões
// sem os dos carros, e os nomes legíveis ("Estoque (a vitrine)", "Página de um carro", "Pelo painel"). Sem carro
// aberto no período, uma frase neutra. Tudo fictício, criado e apagado pelo próprio fluxo (ambiente.mjs).
//
//   npm run fluxos            (precisa das variáveis PAINEL_* e do Playwright; sem elas, pula)

import { test } from "node:test";
import assert from "node:assert/strict";
import * as A from "./ambiente.mjs";

const COMPUTADOR = { viewport: { width: 1440, height: 900 } };
const INICIAL = { esquema: 1, ordem: ["inicio"], secoes: { inicio: { visivel: true, textos: { titulo: "Garagem dos números" } } }, contato: {} };

test("os indicadores do Estoque, no STG", { skip: A.motivoParaPular(), timeout: 4 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const dono = { email: A.email("dono-numeros") };
  let pagina = null;
  try {
    await A.limparSobras(banco);
    await banco.sql(`insert into public.contas (nome, nicho, codigo, situacao, origem) values ('Garagem dos Números', 'automotivo', ${A.q(A.CODIGO)}, 'ativa', 'renderiza');
      insert into public.contas_modulos (conta_id, modulo_id) select id, m from public.contas, unnest(array['meu-site', 'estoque']) m where codigo = ${A.q(A.CODIGO)};
      insert into public.sites (conta_id, codigo, dominios, situacao, conteudo_inicial) select id, ${A.q(A.CODIGO)}, array[${A.q(A.DOMINIO)}], 'conectado', ${A.q(JSON.stringify(INICIAL))}::jsonb from public.contas where codigo = ${A.q(A.CODIGO)};`);
    const [{ id: conta }] = await banco.sql(`select id from public.contas where codigo = ${A.q(A.CODIGO)}`);
    const [{ id: site }] = await banco.sql(`select id from public.sites where conta_id = ${A.q(conta)}`);
    const carro = async (marca, modelo) => (await banco.sql(`insert into public.estoque_itens (conta_id, esquema, situacao, campos) values (${A.q(conta)}, 'automotivo', 'oculto',
      ${A.q(JSON.stringify({ marca, modelo, ano_fab: 2023, ano_modelo: 2024 }))}::jsonb) returning id`))[0].id;
    const cayenne = await carro("Porsche", "Cayenne"), x1 = await carro("BMW", "X1");
    const visita = (v, origem, secoes, cliques) => `(${A.q(conta)}, ${A.q(site)}, ${A.q(v)}, current_date, 'aparelho-${v}', '/', 'celular', ${origem ? A.q(origem) : "null"}, 30, ${A.q(JSON.stringify(secoes))}::jsonb, ${A.q(JSON.stringify(cliques))}::jsonb)`;
    await banco.sql(`insert into public.sites_visitas (conta_id, site_id, visita, dia, aparelho, pagina, tela, origem, segundos, secoes, cliques) values
      ${visita("visitaaaaaaaaa1", null, { inicio: 10, estoque: 15, carro: 5 }, { ["ver." + x1]: 2, ["zap." + x1]: 1, whatsapp: 1 })},
      ${visita("visitaaaaaaaaa2", "l.instagram.com", { estoque: 20, carro: 10 }, { ["ver." + x1]: 1, ["ver." + cayenne]: 1, ["zap." + cayenne]: 2, whatsapp: 2 })},
      ${visita("visitaaaaaaaaa3", "painel.renderizaweb.com.br", { inicio: 5 }, { instagram: 1 })};`);
    dono.senha = await A.criarLogin(banco, dono.email, "Dono da Garagem");
    await A.porNaConta(banco, dono.email, A.CODIGO, { dono: true, nome: "Dono da Garagem" });

    await t.test("a aba Indicadores: os carros mais vistos, os botões sem os carros e os nomes legíveis", async () => {
      const ctx = await navegador.newContext({ ...COMPUTADOR, locale: "pt-BR" });
      pagina = await ctx.newPage();
      const erros = A.vigiar(pagina);
      await A.entrar(pagina, srv.url, dono.email, dono.senha);
      await pagina.goto(`${srv.url}/meu-site`, { waitUntil: "networkidle" });
      await pagina.click('[data-aba="indicadores"]');
      await pagina.waitForSelector("text=Carros mais vistos", { timeout: 15000 });
      const quadro = pagina.locator('section:has(h2:has-text("Carros mais vistos"))');
      const linhas = (await quadro.locator("li").allInnerTexts()).map(t => t.replace(/\s+/g, " ").trim());
      assert.equal(linhas.length, 2, JSON.stringify(linhas));
      assert.match(linhas[0], /^BMW X1 2023\/2024 · 1 clique no WhatsApp 3 vezes$/, linhas[0]);
      assert.match(linhas[1], /^Porsche Cayenne 2023\/2024 · 2 cliques no WhatsApp 1 vez$/, linhas[1]);
      const tudo = (await pagina.locator("[data-ind]").innerText()).replace(/\s+/g, " ");
      assert.match(tudo, /Cliques em botões 4/, "os botões: 3 do WhatsApp e 1 do Instagram, sem os dos carros");
      assert.doesNotMatch(tudo, /ver\.|zap\./, "nenhum nome cru");
      assert.match(tudo, /Estoque \(a vitrine\)/);
      assert.match(tudo, /Página de um carro/);
      assert.match(tudo, /Pelo painel \(você ou a equipe\)/);
      if (process.env.FLUXO_RETRATOS) await pagina.screenshot({ path: `${process.env.FLUXO_RETRATOS}/indicadores-estoque.png`, fullPage: true });
      // sem carro aberto no período: a frase neutra
      await banco.sql(`update public.sites_visitas set cliques = '{"whatsapp": 1}'::jsonb where site_id = ${A.q(site)}`);
      await pagina.click("[data-atualizar]");
      await pagina.waitForSelector("text=Quando alguém abrir um carro no site, ele aparece aqui", { timeout: 15000 });
      assert.deepEqual(erros, []);
      await ctx.close();
    });
  } finally {
    await navegador.close().catch(() => {});
    srv.parar();
    await A.limpar(banco).catch(() => {});
  }
});
