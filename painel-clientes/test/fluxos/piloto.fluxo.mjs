// O piloto de ponta a ponta (Missão 6; 01, Parada 6; 09, "Teste das 5 tarefas"), no painel de verdade, contra o STG:
// a Renderiza cria a conta pelo Admin e gera o link do WhatsApp (Missão 7, D42); o dono abre o link no celular, cria a
// senha, aceita os termos e arruma o básico (tipo de festa,
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
  const br = (meses, dia) => { const x = new Date(); x.setMonth(x.getMonth() + meses, dia); return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`; };
  return { festa: iso(d), visita: iso(v), marcadas: [br(3, 12), br(4, 20)] };
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
  let tela = null; // a página do passo, para o retrato se ele falhar
  const passo = (nome, fn) => t.test(nome, async s => {
    if (quebrou) return s.skip("um passo anterior falhou");
    try { await fn(s); } catch (e) {
      quebrou = true;
      const r = await A.retrato(tela, nome);
      if (r) e.message += `\n    tela: ${r.url}\n    print: ${r.arquivo}\n    campos: ${r.campos.join(" | ")}`;
      throw e;
    }
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
      tela = pAdm;
      await A.entrar(pAdm, srv.url, adm.email, adm.senha);
      assert.equal(new URL(pAdm.url()).pathname, "/admin", "quem é da Renderiza e não tem conta cai no Admin");
      await pAdm.click("[data-nova]");
      const f = pAdm.locator("#form-nova-conta");
      // a conta pode nascer da demo do lead (Missão 7, bloco C): escolher a demo preenche o que ela sabe
      await f.locator("#nc-demo option[value=espaco-lira]").waitFor({ state: "attached" });
      await f.locator("#nc-demo").selectOption("espaco-lira");
      assert.equal(await f.getByLabel("Nome do negócio").inputValue(), "Espaço Lira", "o nome vem da demo");
      assert.equal(await f.getByLabel("Código público").inputValue(), "espaco-lira", "o código é o da demo");
      assert.match(await f.locator("#nc-whats").inputValue(), /^\(11\) 9/, "o WhatsApp vem da demo");
      await f.locator("#nc-conversa").fill("Lead do fluxo: quer ver a agenda das festas de 15 anos.");
      // o fluxo segue com o nome e o código dele (os dados da demo são públicos, mas a conta do teste é outra)
      await f.getByLabel("Nome do negócio").fill(NOME_DA_CONTA);
      await f.getByLabel("Código público").fill(A.CODIGO);
      for (const m of ["agenda", "atendimento", "clientes", "financeiro", "contratos"]) {
        const caixa = f.locator(`input[name=modulos][value=${m}]`);
        if (!(await caixa.isChecked())) await f.locator(`label.rz-chip:has(input[value=${m}])`).click();
      }
      assert.match(await f.locator("[data-preco]").innerText(), /93,97/, "R$ 49 com 2 módulos e R$ 14,99 por módulo a mais");
      await f.getByLabel("Nome do dono").fill("Dono do Fluxo");
      // o convite por link no WhatsApp é o padrão; o usuário sai do nome, e o fluxo usa um só dele
      assert.equal(await f.locator("#nc-usuario").inputValue(), "espacojardimdofluxo", "o usuário sugerido pelo nome");
      await f.locator("#nc-usuario").fill(A.USUARIO);
      await pAdm.click("button[form=form-nova-conta]");
      await pAdm.waitForSelector("#form-nova-conta", { state: "detached" });
      assert.match(await A.aviso(pAdm), /criada/);
      // a folha "Mandar o acesso": a mensagem pronta com o link e o usuário
      const folha = pAdm.locator("dialog[open]").last();
      await folha.locator("[data-mensagem]").waitFor();
      assert.match(await folha.locator("[data-mensagem]").innerText(), new RegExp(`Seu usuário: ${A.USUARIO}`));
      dono.link = await folha.locator("button:has-text('Copiar só o link')").getAttribute("data-copiar");
      const [ctxDaConta] = await banco.sql(`select x.demo, x.conversa, x.dados ->> 'nome' as nome from public.contas_contexto x join public.contas c on c.id = x.conta_id where c.codigo = ${A.q(A.CODIGO)}`);
      assert.deepEqual([ctxDaConta.demo, ctxDaConta.nome], ["espaco-lira", "Espaço Lira"], "a demo e o que ela sabia ficam no contexto da conta");
      assert.match(ctxDaConta.conversa, /15 anos/, "a conversa colada fica guardada");
      assert.match(dono.link, /\/boas-vindas\/[a-z0-9]{32}$/);
      await folha.locator("button:has-text('Pronto')").click();
      const [conta] = await banco.sql(`select id, situacao, origem from public.contas where codigo = ${A.q(A.CODIGO)}`);
      assert.deepEqual([conta.situacao, conta.origem], ["ativa", "renderiza"]);
      contaId = conta.id;
      const [{ n }] = await banco.sql(`select count(*)::int as n from public.convites where conta_id = ${A.q(contaId)} and dono and usuario = ${A.q(A.USUARIO)}`);
      assert.equal(n, 1, "o convite por link do dono foi gravado");
    });

    await passo("2. o dono abre o link no celular, cria a senha, aceita os termos e vê os primeiros passos", async () => {
      dono.email = `${A.USUARIO}@acesso.renderizaweb.com.br`;
      dono.senha = "jardim-do-fluxo-2026";
      pDono = await (await navegador.newContext(CELULAR)).newPage();
      erros.push(A.vigiar(pDono, [/functions\/v1\/convidar/]));
      await pDono.route(/functions\/v1\/convidar/, r => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
      c = A.contador(pDono);
      tela = pDono;
      await pDono.goto(dono.link.replace(/^https?:\/\/[^/]+/, srv.url), { waitUntil: "networkidle" });
      assert.match(await pDono.locator("h1").innerText(), new RegExp(`Olá, ${NOME_DA_CONTA}!`), "a boas-vindas pelo nome do espaço");
      assert.equal(await pDono.locator(".rz-usuario-do-convite b").innerText(), A.USUARIO);
      await pDono.fill("#bv-senha", dono.senha);
      await pDono.click("[data-boas-vindas] [type=submit]");
      await pDono.waitForSelector("[data-aceite-termos]", { timeout: 20000 });
      await pDono.check("[data-aceite-termos] [name=li]");
      await pDono.click("[data-aceite-termos] [type=submit]");
      await pDono.waitForSelector("[data-aceite-termos]", { state: "detached", timeout: 15000 });
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
      await m.getByLabel("O texto").fill("CONTRATO DE LOCAÇÃO\n\nContratante: {cliente}.\nEvento: {tipo} em {data_extenso}, {horario}, para {convidados} convidados.\nPacote: {pacote}. Valor total: {valor}. Sinal: {sinal}.\n\n{negocio}, {hoje}.");
      await m.locator("button:has-text('Salvar')").click();
      await pDono.waitForTimeout(800);
      const [r] = await banco.sql(`select
        (select count(*)::int from public.tipos_reserva where conta_id = ${A.q(contaId)}) as tipos,
        (select count(*)::int from public.servicos where conta_id = ${A.q(contaId)} and valor = 12000) as pacotes,
        (select ajustes->'pix'->>'chave' from public.contas where id = ${A.q(contaId)}) as pix,
        (select count(*)::int from public.modelos_contrato where conta_id = ${A.q(contaId)}) as modelos`);
      assert.deepEqual(r, { tipos: 1, pacotes: 1, pix: "pix-ficticio@fluxo.teste", modelos: 1 });
    });

    await passo("3b. o dono traz as festas que já estavam marcadas (digitando rápido)", async () => {
      await pDono.goto(`${srv.url}/`, { waitUntil: "networkidle" });
      await visivel(pDono, ".rz-passos :is(a,button):has-text('Trazer as datas')").click();
      await pDono.fill("#importar-texto", `${D.marcadas[0]} 19h Carla Fluxo Teste (11) 90000-0202\n${D.marcadas[1]} Bruno e Lia Fluxo Teste`);
      await pDono.waitForSelector("dialog[open] [data-trazer]:not([disabled])");
      assert.match(await pDono.locator("dialog[open] [data-previa]").innerText(), /2 datas/);
      await pDono.click("dialog[open] [data-trazer]");
      await pDono.waitForSelector("#importar-texto", { state: "detached" });
      const [r] = await banco.sql(`select count(*)::int as reservas, count(distinct cliente_id)::int as clientes from public.reservas where conta_id = ${A.q(contaId)}`);
      assert.deepEqual(r, { reservas: 2, clientes: 2 }, "as duas festas entraram na agenda, cada uma com o seu cliente");
      await pDono.goto(`${srv.url}/`, { waitUntil: "networkidle" });
      assert.match(await pDono.locator(".rz-passos").innerText(), /2 de 4 feitos/, "os pacotes (passo 3) e as datas se marcam sozinhos");
    });

    await passo("4. as 5 tarefas do 09, no celular", async () => {
      const linhaDoPedido = () => pDono.locator(`[data-pedidos] .rz-linha:has-text("${CLIENTE.nome}") >> visible=true`).first();

      await tarefa("anotar um pedido do WhatsApp", c, async () => {
        await pDono.goto(`${srv.url}/atendimento`, { waitUntil: "networkidle" });
        await c.tocar(visivel(pDono, "main [data-anotar]"));
        await c.digitar("#pq-busca", CLIENTE.nome);
        await c.tocar("dialog[open] [data-novo-cliente]");
        await c.digitar("#pq-whats", CLIENTE.whatsapp);
        await c.tocar("dialog[open] [data-novo] [type=submit]");
        await pDono.waitForSelector("#form-novo-pedido");
        await c.digitar("#novo-data", D.festa);
        await c.digitar("#novo-conv", "120");
        await c.escolher("#novo-tipo", { label: "Casamento" });
        await c.tocar("button[form=form-novo-pedido]");
        await pDono.waitForSelector("#form-novo-pedido", { state: "detached" });
      });
      const [pedido] = await banco.sql(`select p.id, p.etapa, p.origem, p.data_desejada::text as data from public.pedidos p join public.clientes cl on cl.id = p.cliente_id where cl.nome = ${A.q(CLIENTE.nome)} and p.conta_id = ${A.q(contaId)}`);
      assert.ok(pedido, "o pedido foi gravado");
      assert.equal(pedido.data, D.festa);

      await tarefa("marcar uma visita", c, async () => {
        await c.tocar(linhaDoPedido());
        await c.tocar("dialog[open] [data-visita]");
        await c.digitar("#visita-data", D.visita);
        await c.digitar("#visita-hora", "15:00");
        await c.tocar("dialog[open] [data-confirmar]");
        await pDono.waitForSelector("#visita-data", { state: "detached" });
      });
      const [visita] = await banco.sql(`select (select etapa from public.pedidos where id = ${A.q(pedido.id)}) as etapa, (select count(*)::int from public.compromissos where conta_id = ${A.q(contaId)} and tipo = 'visita') as visitas`);
      assert.deepEqual(visita, { etapa: "visita_marcada", visitas: 1 });

      await tarefa("fechar a reserva", c, async () => {
        await c.tocar(linhaDoPedido());
        await c.tocar("dialog[open] [data-fechar-pedido]");
        await pDono.waitForSelector("#fechar-pacote");
        await c.escolher("#fechar-pacote", { label: "Pacote Jardim" });
        await c.tocar("dialog[open] [data-confirmar]");
        await pDono.waitForSelector("[data-fechar-form]", { state: "detached" });
      });
      const [reserva] = await banco.sql(`select r.id, r.situacao, (select nome from public.servicos where id = r.servico_id) as pacote, (select etapa from public.pedidos where id = ${A.q(pedido.id)}) as etapa from public.reservas r where r.conta_id = ${A.q(contaId)} and r.pedido_id = ${A.q(pedido.id)}`);
      assert.equal(reserva.etapa, "fechado");
      assert.equal(reserva.pacote, "Pacote Jardim", "o pacote escolhido no fechar foi para a festa");
      assert.ok(["confirmada", "pre_reserva"].includes(reserva.situacao), reserva.situacao);

      await tarefa("registrar um pagamento", c, async () => {
        await pDono.goto(`${srv.url}/financeiro`, { waitUntil: "networkidle" });
        await c.tocar(visivel(pDono, "main :is(a,button):has-text('Registrar pagamento')"));
        await c.digitar("#pq-busca", "Juliana");
        await c.tocar(pDono.locator(`dialog[open] :is(button,a):has-text("${CLIENTE.nome}")`).first());
        await pDono.waitForSelector("#parc-valor");
        await c.digitar("#parc-desc", "Sinal");
        await c.digitar("#parc-valor", "3000");
        await c.tocar("dialog[open] button:has-text('Registrar')");
        await pDono.waitForSelector("#parc-valor", { state: "detached" });
      });
      const [pago] = await banco.sql(`select count(*)::int as n, sum(valor)::int as total from public.parcelas where conta_id = ${A.q(contaId)} and reserva_id = ${A.q(reserva.id)} and pago_em is not null`);
      assert.deepEqual(pago, { n: 1, total: 3000 }, "o sinal entrou como pago, na festa certa");

      let link;
      await tarefa("mandar o contrato", c, async () => {
        await pDono.goto(`${srv.url}/contratos`, { waitUntil: "networkidle" });
        await c.tocar(visivel(pDono, `main li:has-text("${CLIENTE.nome}") [data-fazer]`));
        await pDono.waitForSelector("#ct-texto");
        await c.tocar("dialog[open] [data-usar-pacote]");
        await pDono.waitForFunction(() => !document.querySelector("dialog[open] [data-falta]").textContent.trim());
        await c.tocar("dialog[open] [data-mandar]");
        await c.tocar("dialog[open] [data-sim]");
        await pDono.waitForSelector("#ct-link");
        link = await pDono.inputValue("#ct-link");
      });
      assert.match(link, /\/c\/[a-z0-9]{16,}/);
      const [valores] = await banco.sql(`select valor_total::int as total, sinal::int as sinal from public.reservas_valores where reserva_id = ${A.q(reserva.id)}`);
      assert.deepEqual(valores, { total: 12000, sinal: 3000 }, "os valores do pacote foram para a festa (o Financeiro vê os mesmos)");
    });

    await passo("5. a cliente aceita o contrato pelo link, no celular, sem login", async () => {
      const link = await pDono.inputValue("#ct-link");
      const pCli = await (await navegador.newContext(CELULAR)).newPage();
      erros.push(A.vigiar(pCli));
      tela = pCli;
      await pCli.goto(link.replace(/^https?:\/\/[^/]+/, srv.url), { waitUntil: "networkidle" });
      assert.match(await pCli.locator(".rz-contrato-resumo").innerText(), /Casamento/);
      await pCli.click("[data-ler]");
      await pCli.fill("#ac-nome", CLIENTE.nome);
      await pCli.fill("#ac-contato", "(11) 90000-0101");
      await pCli.check("[name=li]");
      await pCli.click("[data-aceite] [type=submit]");
      await pCli.waitForSelector("#ct-pronto");
      assert.match(await pCli.locator("h1").first().innerText(), /Contrato aceito/);
      assert.match(await pCli.locator("main").innerText(), /pix-ficticio@fluxo\.teste/, "depois do aceite, a cliente vê o Pix do espaço");
      const [ct] = await banco.sql(`select situacao, aceito_nome, aceito_ip is not null as tem_ip from public.contratos where conta_id = ${A.q(contaId)}`);
      assert.deepEqual(ct, { situacao: "aceito", aceito_nome: CLIENTE.nome, tem_ip: true });
      tela = pDono;
    });

    await passo("6. a equipe: o dono convida pelo link alguém que só vê a agenda, os pedidos e os clientes; a pessoa entra e não muda nada", async () => {
      await pDono.goto(`${srv.url}/equipe`, { waitUntil: "networkidle" });
      await visivel(pDono, "main button:has-text('Convidar')").click();
      const g = gaveta(pDono);
      await g.locator("#convite-nome").fill("Ana Só Vê");
      assert.equal(await g.locator("#convite-usuario").inputValue(), "ana.espacojardim", "o usuário sai do nome e do negócio");
      await g.locator("#convite-usuario").fill(A.USUARIO_EQUIPE);
      for (const [modulo, nivel] of [["agenda", "Só vê"], ["clientes", "Só vê"], ["atendimento", "Só vê"], ["financeiro", "Sem acesso"], ["contratos", "Sem acesso"]])
        await g.locator(`label:has(input[name=acesso-${modulo}]):has-text("${nivel}")`).click();
      await g.locator("button:has-text('Criar o convite')").click();
      const folha = pDono.locator("dialog[open]:has([data-mensagem])");
      await folha.waitFor();
      assert.match(await folha.locator("[data-mensagem]").innerText(), new RegExp(`Oi, Ana!.*\\n.*Seu usuário: ${A.USUARIO_EQUIPE}`, "s"), "a mensagem pronta, com o usuário");
      const link = await folha.locator("button:has-text('Copiar só o link')").getAttribute("data-copiar");
      await folha.locator("button:has-text('Pronto')").click();
      await pDono.waitForSelector(`main :text("usuário ${A.USUARIO_EQUIPE}")`);
      ve.email = `${A.USUARIO_EQUIPE}@acesso.renderizaweb.com.br`;
      ve.senha = "so-ve-do-fluxo-2026";
      const pVe = await (await navegador.newContext(CELULAR)).newPage();
      erros.push(A.vigiar(pVe));
      tela = pVe;
      await pVe.goto(link.replace(/^https?:\/\/[^/]+/, srv.url), { waitUntil: "networkidle" });
      assert.match(await pVe.locator("h1").innerText(), new RegExp(`Olá, ${NOME_DA_CONTA}!`), "a pessoa da equipe também é recebida pelo nome do espaço");
      await pVe.fill("#bv-senha", ve.senha);
      await pVe.click("[data-boas-vindas] [type=submit]");
      await pVe.waitForSelector("[data-aceite-termos]", { timeout: 20000 });
      await pVe.check("[data-aceite-termos] [name=li]");
      await pVe.click("[data-aceite-termos] [type=submit]");
      await pVe.waitForSelector("[data-aceite-termos]", { state: "detached", timeout: 15000 });
      await pVe.waitForSelector("h1");
      const [pessoa] = await banco.sql(`select dono, acessos from public.pessoas p join auth.users u on u.id = p.usuario_id where u.email = ${A.q(ve.email)} and p.conta_id = ${A.q(contaId)}`);
      assert.equal(pessoa.dono, false, "entrou pelo convite como equipe");
      await pVe.goto(`${srv.url}/atendimento`, { waitUntil: "networkidle" });
      await pVe.click("[data-chip=fechado]");
      await pVe.waitForSelector(`[data-pedidos] .rz-linha:has-text("${CLIENTE.nome}") >> visible=true`);
      assert.equal(await pVe.locator("main [data-anotar] >> visible=true").count(), 0, "quem só vê não anota pedido");
      await pVe.goto(`${srv.url}/agenda?dia=${D.festa}`, { waitUntil: "networkidle" });
      assert.equal(await pVe.locator("main button:has-text('Reservar data') >> visible=true").count(), 0, "quem só vê não reserva data");
      const texto = await pVe.locator("body").innerText();
      assert.doesNotMatch(texto, /Financeiro|Contratos/, "sem acesso, o Financeiro e Contratos nem aparecem no menu");
      await pVe.goto(`${srv.url}/financeiro`, { waitUntil: "networkidle" });
      assert.doesNotMatch(await pVe.locator("main").innerText(), /3\.000|12\.000/, "e os valores não aparecem nem pelo endereço");
      tela = pDono;
    });

    await passo("7. a Renderiza registra o Pix da mensalidade, vê os números e entra para ajudar (com registro)", async () => {
      tela = pAdm;
      await pAdm.goto(`${srv.url}/admin`, { waitUntil: "networkidle" });
      await pAdm.click("[data-chip=todas]");
      const linha = pAdm.locator(`[data-lista] .rz-linha:has-text("${NOME_DA_CONTA}")`);
      assert.match(await linha.innerText(), /2 pessoas/, "o dono e a pessoa da equipe");
      await linha.click();
      await pAdm.click("dialog[open] [data-pagar]");
      assert.equal(await pAdm.inputValue("#pg-valor"), "93,97", "o Pix sugerido é a mensalidade da conta");
      await pAdm.click("dialog[open] [type=submit]");
      await pAdm.waitForSelector("#pg-valor", { state: "detached" });
      await linha.click();
      await pAdm.click("dialog[open] [data-entrar]");
      await pAdm.fill("#sup-motivo", "Teste do fluxo: conferir a agenda com o dono");
      await pAdm.click("dialog[open] [type=submit]");
      await pAdm.waitForSelector(".rz-faixa-suporte");
      await pAdm.goto(`${srv.url}/agenda?dia=${D.festa}`, { waitUntil: "networkidle" });
      assert.match(await pAdm.locator("main").innerText(), /Juliana/, "em suporte, a Renderiza vê a agenda da conta");
      await pAdm.click("[data-encerrar-suporte]");
      await pAdm.waitForURL(/\/admin/);
      const [r] = await banco.sql(`select
        (select count(*)::int from public.pagamentos where conta_id = ${A.q(contaId)} and valor = 93.97) as pix,
        (select count(*)::int from public.acessos_suporte where conta_id = ${A.q(contaId)} and fim <= now()) as suporte_encerrado`);
      assert.deepEqual(r, { pix: 1, suporte_encerrado: 1 });
      await pAdm.goto(`${srv.url}/admin/indicadores`, { waitUntil: "networkidle" });
      assert.doesNotMatch(await pAdm.locator("main").innerText(), /Juliana/, "os indicadores são só números, sem nome de cliente");
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
