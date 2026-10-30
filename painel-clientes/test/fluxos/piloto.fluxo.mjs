// O piloto de ponta a ponta (Missão 6; 01, Parada 6; 09, "Teste das 5 tarefas"), no painel de verdade, contra o STG:
// a Renderiza cria a conta pelo Admin; o dono entra pelo celular, aceita os termos e arruma o básico (tipo de festa,
// pacote, Pix, modelo de contrato); faz as 5 tarefas do 09 contando os toques (anotar um pedido do WhatsApp, marcar
// uma visita, fechar a reserva, registrar um pagamento, mandar o contrato); o cliente aceita o contrato pelo link; a
// equipe "só vê" entra e não consegue mudar nada; a Renderiza registra o Pix da mensalidade e entra para ajudar.
// Tudo com dados fictícios, criados e apagados pelo próprio fluxo (ambiente.mjs).
//
//   npm run fluxos            (precisa das variáveis PAINEL_* e do Playwright; sem elas, pula)

import { test } from "node:test";
import assert from "node:assert/strict";
import * as A from "./ambiente.mjs";

const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const COMPUTADOR = { viewport: { width: 1440, height: 900 } };
const NOME_DA_CONTA = "Espaço Jardim do Fluxo";
const CLIENTE = { nome: "Juliana Fluxo Teste", whatsapp: "11900000101" };

/** Um sábado daqui a uns 8 meses (aaaa-mm-dd), para a festa; e um dia de semana antes, para a visita. */
function datas() {
  const d = new Date(); d.setMonth(d.getMonth() + 8); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  const v = new Date(); v.setDate(v.getDate() + 10); if (v.getDay() === 0) v.setDate(v.getDate() + 1);
  const iso = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { festa: iso(d), visita: iso(v) };
}

/** O botão visível dentro da tela (no celular, o "+" do topo do computador fica escondido). */
const visivel = (pagina, seletor) => pagina.locator(`${seletor} >> visible=true`).first();
const gaveta = pagina => pagina.locator("dialog[open]").last();

test("o piloto de ponta a ponta, no STG", { skip: A.motivoParaPular(), timeout: 15 * 60_000 }, async t => {
  const banco = await A.bancoStg();
  const srv = await A.ligarServidor();
  const navegador = await A.playwright().chromium.launch();
  const D = datas();
  const tarefas = [];
  const erros = [];
  let quebrou = false;
  const passo = (nome, fn) => t.test(nome, async s => {
    if (quebrou) return s.skip("um passo anterior falhou");
    try { await fn(s); } catch (e) { quebrou = true; throw e; }
  });
  /** Uma das 5 tarefas: conta os toques, o que foi digitado e o tempo do robô (o de gente é no roteiro do piloto). */
  const tarefa = async (nome, c, fn) => {
    c.zerar(); const t0 = Date.now();
    await fn();
    tarefas.push({ nome, toques: c.toques, digitados: c.digitados.length, segundos: Math.round((Date.now() - t0) / 100) / 10 });
  };

  const adm = { email: A.email("renderiza") }, dono = { email: A.email("dono") }, ve = { email: A.email("so-ve") };
  let pAdm, pDono, c, contaId;

  try {
    await passo("1. a Renderiza cria a conta pelo Admin (computador)", async () => {
      adm.senha = await A.criarLogin(banco, adm.email, "Renderiza do Fluxo");
      await A.porNaEquipeRenderiza(banco, adm.email);
      pAdm = await (await navegador.newContext(COMPUTADOR)).newPage();
      erros.push(A.vigiar(pAdm, [/functions\/v1\/convidar/]));
      // o e-mail do convite não sai no fluxo: a chamada à função convidar é respondida aqui
      await pAdm.route(/functions\/v1\/convidar/, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
      await A.entrar(pAdm, srv.url, adm.email, adm.senha);
      assert.equal(new URL(pAdm.url()).pathname, "/admin", "quem é da Renderiza e não tem conta cai no Admin");
      await pAdm.click("[data-nova]");
      const f = pAdm.locator("#form-nova-conta");
      await f.getByLabel("Nome do negócio").fill(NOME_DA_CONTA);
      await f.getByLabel("Código público").fill(A.CODIGO);
      for (const m of ["agenda", "atendimento", "clientes", "financeiro", "contratos"]) {
        const caixa = f.locator(`input[name=modulos][value=${m}]`);
        if (!(await caixa.isChecked())) await f.locator(`label.rz-chip:has(input[value=${m}])`).click();
      }
      assert.match(await f.locator("[data-preco]").innerText(), /93,97/, "R$ 49 com 2 módulos e R$ 14,99 por módulo a mais");
      await f.getByLabel("Nome do dono").fill("Dono do Fluxo");
      await f.getByLabel("E-mail do dono").fill(dono.email);
      await pAdm.click("button[form=form-nova-conta]");
      await pAdm.waitForSelector("#form-nova-conta", { state: "detached" });
      assert.match(await A.aviso(pAdm), /criada/);
      const [conta] = await banco.sql(`select id, situacao, origem from public.contas where codigo = ${A.q(A.CODIGO)}`);
      assert.deepEqual([conta.situacao, conta.origem], ["ativa", "renderiza"]);
      contaId = conta.id;
      const [{ n }] = await banco.sql(`select count(*)::int as n from public.convites where conta_id = ${A.q(contaId)} and dono and email = ${A.q(dono.email)}`);
      assert.equal(n, 1, "o convite do dono foi gravado");
    });

    await passo("2. o dono entra pelo celular, aceita os termos e vê os primeiros passos", async () => {
      dono.senha = await A.criarLogin(banco, dono.email, "Dono do Fluxo");
      pDono = await (await navegador.newContext(CELULAR)).newPage();
      erros.push(A.vigiar(pDono));
      c = A.contador(pDono);
      await A.entrar(pDono, srv.url, dono.email, dono.senha);
      const [{ n }] = await banco.sql(`select count(*)::int as n from public.termos_aceites a join auth.users u on u.id = a.usuario_id where u.email = ${A.q(dono.email)}`);
      assert.equal(n, 1, "o aceite dos termos ficou registrado");
      await pDono.waitForSelector(".rz-passos");
      assert.match(await pDono.locator("h1").first().innerText(), /Dono/, "o Início cumprimenta pelo nome");
      assert.match(await pDono.locator(".rz-passos").innerText(), /0 de 4 feitos/);
      assert.equal(await A.rolaParaOLado(pDono), false, "o Início não rola para o lado no celular");
    });

    await passo("3. o dono arruma o básico: tipo de festa, pacote, Pix e o modelo de contrato", async () => {
      await pDono.goto(`${srv.url}/servicos?aba=tipos`, { waitUntil: "networkidle" });
      await visivel(pDono, "main [data-novo]").click();
      await gaveta(pDono).getByLabel("Nome").fill("Casamento");
      await gaveta(pDono).locator("button:has-text('Salvar')").click();
      await pDono.waitForTimeout(800);
      await pDono.goto(`${srv.url}/servicos`, { waitUntil: "networkidle" });
      await visivel(pDono, "main [data-novo]").click();
      const g = gaveta(pDono);
      await g.getByLabel("Nome").fill("Pacote Jardim");
      await g.getByLabel(/^Valor/).fill("12000");
      await g.getByLabel(/^Sinal/).fill("3000");
      await g.getByLabel(/^Convidados inclusos/).fill("150");
      await g.locator("button:has-text('Salvar')").click();
      await pDono.waitForTimeout(800);
      await pDono.goto(`${srv.url}/configuracoes`, { waitUntil: "networkidle" });
      await pDono.getByLabel(/^Chave Pix/).fill("pix-ficticio@fluxo.teste");
      await pDono.getByLabel(/^Em nome de/).fill("Espaço Jardim do Fluxo");
      await pDono.locator("#form-pix button:has-text('Salvar')").click();
      await pDono.waitForTimeout(800);
      await pDono.goto(`${srv.url}/contratos`, { waitUntil: "networkidle" });
      await visivel(pDono, "main :is(a,button):has-text('Fazer o modelo')").click();
      const m = gaveta(pDono);
      await m.getByLabel("Nome do modelo").fill("Contrato de locação");
      await m.getByLabel("O texto").fill("CONTRATO DE LOCAÇÃO\n\nContratante: {cliente}, CPF {cpf}.\nEvento: {tipo} em {data_extenso}, {horario}, para {convidados} convidados.\nPacote: {pacote}. Valor total: {valor}. Sinal: {sinal}.\n\n{negocio}, {hoje}.");
      await m.locator("button:has-text('Salvar')").click();
      await pDono.waitForTimeout(800);
      const [r] = await banco.sql(`select
        (select count(*)::int from public.tipos_reserva where conta_id = ${A.q(contaId)}) as tipos,
        (select count(*)::int from public.servicos where conta_id = ${A.q(contaId)} and valor = 12000) as pacotes,
        (select ajustes->'pix'->>'chave' from public.contas where id = ${A.q(contaId)}) as pix,
        (select count(*)::int from public.modelos_contrato where conta_id = ${A.q(contaId)}) as modelos`);
      assert.deepEqual(r, { tipos: 1, pacotes: 1, pix: "pix-ficticio@fluxo.teste", modelos: 1 });
    });
  } finally {
    await navegador.close();
    srv.parar();
    await A.limpar(banco);
    if (tarefas.length) {
      console.log("\nAs 5 tarefas (09), no celular, pelo robô:");
      console.table(tarefas);
    }
    const todos = erros.flat();
    if (!quebrou) assert.deepEqual(todos, [], "nenhum erro de script nem chamada ao banco falhando");
    else if (todos.length) console.log("erros vistos:", todos);
  }
});
