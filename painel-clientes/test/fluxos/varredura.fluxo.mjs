// A varredura geral (Missão 6): todas as telas do painel com os dados da semente (Villa Alecrim, eventos; Estúdio
// Ciranda, fotografia), como dono, como quem edita uma parte e como quem só vê; no celular e no computador. Em cada
// tela: abre sem erro de script nem chamada ao banco falhando, tem título, não rola para o lado no celular, e o
// primeiro item de cada lista abre a gaveta. O Admin também. Os logins são temporários (@fluxo-<marca>.teste),
// postos nas contas da semente só durante a varredura.
//
//   npm run fluxos

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as A from "./ambiente.mjs";

/** FLUXO_PRINTS=1 guarda o print de cada tela (para olhar com calma), numa pasta temporária. */
const PRINTS = process.env.FLUXO_PRINTS ? join(tmpdir(), `fluxos-${A.MARCA}`, "varredura") : null;
if (PRINTS) mkdirSync(PRINTS, { recursive: true });

const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const COMPUTADOR = { viewport: { width: 1440, height: 900 } };

const ROTAS = ["/", "/atendimento", "/agenda", "/clientes", "/clientes?aba=entregas", "/financeiro", "/contratos", "/servicos", "/equipe", "/configuracoes", "/meu-site"];
/** O que abrir em cada tela (o primeiro item da lista), para ver a gaveta. */
const ABRIR = {
  "/atendimento": "[data-pedidos] .rz-linha",
  "/agenda": ".rz-item-agenda", // no mês (computador), tocar no dia só escolhe o dia: a festa abre pela lista do dia
  "/clientes": "[data-lista] .rz-linha",
  "/financeiro": "[data-lista] .rz-linha",
  "/contratos": "[data-lista] .rz-linha",
};
const ADMIN = ["/admin", "/admin/modulos", "/admin/pessoas", "/admin/pagamentos", "/admin/indicadores"];

const QUEM = [
  { nome: "dono-villa", conta: "villa-alecrim", dono: true, telas: [CELULAR, COMPUTADOR] },
  { nome: "dono-ciranda", conta: "estudio-ciranda", dono: true, telas: [CELULAR, COMPUTADOR] },
  { nome: "edita-ciranda", conta: "estudio-ciranda", acessos: { agenda: "editar", atendimento: "editar", clientes: "ver" }, telas: [CELULAR] },
  { nome: "ve-ciranda", conta: "estudio-ciranda", acessos: { agenda: "ver", atendimento: "ver", clientes: "ver", contratos: "ver", financeiro: "ver" }, telas: [CELULAR] },
];

/** Uma tela: abre, confere e (se tiver lista) abre o primeiro item. Devolve os problemas achados. */
async function conferirTela(pagina, url, rota, { celular, quem }) {
  const problemas = [];
  await pagina.goto(url + rota, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(400);
  if (PRINTS) await pagina.screenshot({ path: join(PRINTS, `${quem}-${celular ? "cel" : "pc"}-${rota.replace(/[^a-z0-9]+/gi, "_") || "inicio"}.png`), fullPage: true });
  if (!(await pagina.locator("h1").count())) problemas.push(`${rota}: sem título`);
  if (celular && (await A.rolaParaOLado(pagina))) problemas.push(`${rota}: rola para o lado no celular`);
  const alvo = ABRIR[rota.split("?")[0]];
  if (alvo === ".rz-item-agenda" && !(await pagina.locator(`${alvo} >> visible=true`).count())) {
    const dia = pagina.locator("[data-dia]:has(.rz-dia-item) >> visible=true").first();
    if (await dia.count()) { await dia.click(); await pagina.waitForTimeout(300); }
  }
  if (alvo) {
    const item = pagina.locator(`${alvo} >> visible=true`).first();
    if (await item.count()) {
      await item.click();
      const gaveta = pagina.locator("dialog[open]").last();
      try {
        await gaveta.waitFor({ timeout: 8000 });
        await pagina.waitForLoadState("networkidle");
        if (await gaveta.evaluate(el => el.scrollWidth > el.clientWidth + 1)) problemas.push(`${rota}: a gaveta rola para o lado`);
        await pagina.keyboard.press("Escape");
        await gaveta.waitFor({ state: "detached", timeout: 5000 }).catch(() => problemas.push(`${rota}: a gaveta não fechou com Esc`));
      } catch { problemas.push(`${rota}: o primeiro item não abriu a gaveta`); }
    }
  }
  return problemas;
}

test("a varredura geral: todas as telas, os papéis, celular e computador", { skip: A.motivoParaPular(), timeout: 20 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  await A.limparSobras(banco);
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const achados = [];
  try {
    for (const q of QUEM) {
      const endereco = A.email(q.nome);
      const senha = await A.criarLogin(banco, endereco, `Varredura ${q.nome}`);
      await A.porNaConta(banco, endereco, q.conta, { dono: !!q.dono, acessos: q.acessos || {}, nome: `Varredura ${q.nome}` });
      for (const tela of q.telas) {
        const celular = tela === CELULAR;
        await t.test(`${q.nome} no ${celular ? "celular" : "computador"}`, async () => {
          const pagina = await (await navegador.newContext(tela)).newPage();
          const erros = A.vigiar(pagina);
          await A.entrar(pagina, srv.url, endereco, senha);
          const problemas = [];
          for (const rota of ROTAS) problemas.push(...await conferirTela(pagina, srv.url, rota, { celular, quem: q.nome }));
          await pagina.context().close();
          achados.push(...problemas.map(p => `${q.nome} (${celular ? "celular" : "computador"}) ${p}`), ...erros.map(e => `${q.nome} (${celular ? "celular" : "computador"}) ${e}`));
          assert.deepEqual([...problemas, ...erros], []);
        });
      }
    }
    const adm = A.email("renderiza");
    const senhaAdm = await A.criarLogin(banco, adm, "Varredura Renderiza");
    await A.porNaEquipeRenderiza(banco, adm);
    for (const tela of [COMPUTADOR, CELULAR]) {
      const celular = tela === CELULAR;
      await t.test(`o Admin no ${celular ? "celular" : "computador"}`, async () => {
        const pagina = await (await navegador.newContext(tela)).newPage();
        const erros = A.vigiar(pagina);
        await A.entrar(pagina, srv.url, adm, senhaAdm);
        const problemas = [];
        for (const rota of ADMIN) {
          await pagina.goto(srv.url + rota, { waitUntil: "networkidle" });
          await pagina.waitForTimeout(400);
          if (!(await pagina.locator("h1").count())) problemas.push(`${rota}: sem título`);
          if (celular && (await A.rolaParaOLado(pagina))) problemas.push(`${rota}: rola para o lado no celular`);
        }
        await pagina.goto(`${srv.url}/admin`, { waitUntil: "networkidle" });
        await pagina.click("[data-chip=todas]");
        await pagina.locator("[data-lista] .rz-linha:has-text('Villa Alecrim')").click();
        await pagina.locator("dialog[open]").waitFor();
        if (await pagina.locator("dialog[open]").evaluate(el => el.scrollWidth > el.clientWidth + 1)) problemas.push("/admin: a gaveta da conta rola para o lado");
        await pagina.context().close();
        achados.push(...problemas.map(p => `admin (${celular ? "celular" : "computador"}) ${p}`), ...erros.map(e => `admin (${celular ? "celular" : "computador"}) ${e}`));
        assert.deepEqual([...problemas, ...erros], []);
      });
    }
  } finally {
    await navegador.close();
    srv.parar();
    await A.limpar(banco);
    if (PRINTS) console.log(`\nOs prints estão em ${PRINTS}`);
    if (achados.length) console.log("\nAchados da varredura:\n" + achados.map(a => `  - ${a}`).join("\n"));
  }
});
