// A prova no STG da entrega da Rafaela (Parada C5): o site dela, gerado pelo virar-site.mjs com "painel" apontando
// para o painel local (scripts/servidor.mjs, contra o banco STG), num Chromium do tamanho de um celular, e o painel
// de verdade. O caminho inteiro: a agenda do site com os ensaios, os horários e a campanha do painel; um pedido cai no
// Atendimento e na Agenda e o horário some do site; uma edição publicada no Meu site aparece no site; desligar a conta
// no Admin volta o site à versão inicial e a agenda ao WhatsApp; com o painel fora do ar, o site fica de pé.
//
//   node --test test/rafaela-stg/prova.mjs
//
// Cria a conta de teste do zero (conta.mjs) e, no fim, deixa ela limpa de novo (sem pedidos nem versões). Precisa das
// variáveis PAINEL_* e do Playwright; sem elas, fica de fora. PROVA_FOTOS=<pasta> guarda as telas.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { bancoStg, ligarServidor, entrar, playwright as pw, motivoParaPular, q } from "../../painel-clientes/test/fluxos/ambiente.mjs";
import { CODIGO, DONA, gerarSite, conteudoInicial, criar, novaSenhaDaDona } from "./conta.mjs";

const pular = motivoParaPular();
const so = { skip: pular };
const FRASE = "Onde as memórias florescem.";
const FRASE_NOVA = "Prova C5: publicado pelo painel.";
const EQUIPE = `equipe-${Date.now().toString(36)}@rafaela-stg.teste`;
const TIPO = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const FOTOS = process.env.PROVA_FOTOS;
const zap = () => "119" + String(randomBytes(4).readUInt32BE() % 1e8).padStart(8, "0"); // celular fictício, um por pedido

let banco, painel, siteServidor, siteUrl, gerado, navegador, senhaDona, senhaEquipe, contaId;

/** O site gerado, servido como no Cloudflare Pages (/natal → natal.html, com os cabeçalhos do _headers). */
function servirSite(pasta) {
  const cabecalhos = Object.fromEntries(fs.readFileSync(path.join(pasta, "_headers"), "utf8").split("\n/img/")[0].split("\n").slice(1)
    .map(l => l.trim().match(/^([^:]+): (.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      let caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (caminho === "/") caminho = "/index.html";
      let arquivo = path.join(pasta, caminho);
      if (!fs.existsSync(arquivo) && fs.existsSync(arquivo + ".html")) arquivo += ".html";
      if (!arquivo.startsWith(pasta) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { ...cabecalhos, "Content-Type": TIPO[path.extname(arquivo)] || "application/octet-stream" });
      fs.createReadStream(arquivo).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => ok(s));
  });
}

async function foto(pagina, nome) {
  if (!FOTOS) return;
  fs.mkdirSync(FOTOS, { recursive: true });
  await pagina.screenshot({ path: path.join(FOTOS, nome + ".png"), fullPage: false });
}

/** O site num celular: só ele e o painel local; o WhatsApp fica anotado (não abre). */
async function abrirSite(caminho = "/") {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  const pagina = await ctx.newPage();
  const erros = [], whatsapp = [];
  pagina.on("pageerror", e => erros.push(e.message));
  await ctx.route("**/*", rota => {
    const u = new URL(rota.request().url());
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return rota.continue();
    if (u.hostname === "wa.me") whatsapp.push(u.href);
    return rota.abort(); // fontes, mapa, WhatsApp: nada de fora
  });
  await pagina.goto(siteUrl + caminho);
  return { pagina, ctx, erros, whatsapp };
}

/** O painel num computador, já dentro. */
async function abrirPainel(email, senha) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
  const pagina = await ctx.newPage();
  await entrar(pagina, painel.url, email, senha);
  return { pagina, ctx };
}

/** Um pedido na agenda: a opção (ou a campanha já escolhida), o primeiro dia e o primeiro horário livres. */
async function pedir(ag, pagina, { opcao, nome }) {
  if (opcao) await ag.locator(".ag-opcao", { hasText: opcao }).tap();
  await ag.locator("button.ag-d").first().waitFor();
  const dia = await ag.locator("button.ag-d").first().getAttribute("aria-label");
  await ag.locator("button.ag-d").first().tap();
  const hora = (await ag.locator(".ag-hora").first().textContent()).trim();
  await ag.locator(".ag-hora").first().tap();
  await ag.locator("input[name=nome]").fill(nome);
  const whatsapp = zap();
  await ag.locator("input[name=whatsapp]").fill(whatsapp);
  await pagina.waitForTimeout(3500); // o tempo mínimo da API contra robô (3 s desde que a agenda abriu)
  await ag.locator(".ag-enviar").tap();
  await ag.locator(".ag-pronto").waitFor();
  return { dia, hora, whatsapp };
}

const horaDoSite = h => h.replace(/^0/, "").replace(/:00$/, "h").replace(":", "h"); // "08:00" → "8h", "10:30" → "10h30"

before(async () => {
  if (pular) return;
  banco = await bancoStg();
  painel = await ligarServidor();
  gerado = gerarSite(`${painel.url}/api/publico/`);
  await criar(banco, conteudoInicial(gerado.site));
  [{ id: contaId }] = await banco.sql(`select id from public.contas where codigo = ${q(CODIGO)}`);
  senhaDona = await novaSenhaDaDona(banco);
  // alguém da equipe Renderiza, só desta execução (para o Admin)
  senhaEquipe = randomBytes(18).toString("base64url");
  await banco.sql(`
    with u as (
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', ${q(EQUIPE)}, extensions.crypt(${q(senhaEquipe)}, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"nome":"Renderiza da prova"}'::jsonb, now(), now(), '', '', '', '', '', '', '', '')
      returning id
    ), i as (
      insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      select id::text, id, json_build_object('sub', id::text, 'email', ${q(EQUIPE)}, 'email_verified', true)::jsonb, 'email', now(), now(), now() from u
    )
    insert into public.equipe_renderiza (usuario_id, nome) select id, 'Renderiza da prova' from u;`);
  siteServidor = await servirSite(gerado.site);
  siteUrl = `http://localhost:${siteServidor.address().port}`;
  // o editor ao vivo abre o primeiro domínio do site: nesta prova, o site servido aqui (com a porta)
  await banco.sql(`update public.sites set dominios = array[${q("localhost:" + siteServidor.address().port)}] || dominios where codigo = ${q(CODIGO)}`);
  navegador = await pw().chromium.launch();
});

after(async () => {
  if (pular) return;
  await navegador?.close();
  siteServidor?.close();
  painel?.parar();
  try {
    if (banco) {
      await banco.sql(`
        delete from public.equipe_renderiza where usuario_id in (select id from auth.users where email = ${q(EQUIPE)});
        delete from auth.users where email = ${q(EQUIPE)};`);
      await criar(banco, conteudoInicial(gerado.site)); // a conta de teste fica limpa, pronta para a próxima vez
    }
  } finally {
    gerado?.apagar();
  }
});

test("o site abre com a agenda do painel: os ensaios, a campanha de Natal e as vagas da conta", so, async () => {
  const { pagina, ctx, erros } = await abrirSite("/");
  try {
    const ag = pagina.locator("#agendar [data-agenda]");
    await ag.locator(".ag-opcao").first().waitFor();
    assert.deepEqual(await ag.locator(".ag-opcao b").allTextContents(), ["Natal 2026", "Gestante", "Newborn", "Acompanhamento", "Smash the cake", "Família"]);
    assert.equal(await ag.locator(".ag-exemplo").isHidden(), true, "sem o aviso de horários de exemplo: são os do painel");
    assert.equal(await pagina.locator("[data-ag-vagas]").first().textContent(), "40", "as vagas da campanha: 10 dias × 4 horários");
    await ag.scrollIntoViewIfNeeded();
    await foto(pagina, "1-agenda-do-painel");
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
});

test("pedir na agenda: o pedido cai no Atendimento, a pré-reserva na Agenda e o horário some do site", so, async () => {
  const { pagina, ctx, erros } = await abrirSite("/");
  let pedido;
  try {
    const ag = pagina.locator("#agendar [data-agenda]");
    await ag.locator(".ag-opcao").first().waitFor();
    pedido = await pedir(ag, pagina, { opcao: "Gestante", nome: "Cliente Prova Gestante" });
    assert.equal(await ag.locator(".ag-pronto .ag-titulo").textContent(), "Pedido enviado.");
    assert.match(await ag.locator(".ag-pronto").textContent(), /separado por 48 horas/);
    await foto(pagina, "2-pedido-enviado");
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }

  const linhas = await banco.sql(`select p.origem, p.data_desejada::text as data, to_char(p.hora_desejada, 'HH24:MI') as hora, s.nome as ensaio, c.nome as cliente, c.whatsapp,
      r.situacao, to_char(r.inicio at time zone 'America/Sao_Paulo', 'HH24:MI') as inicio, to_char(r.fim at time zone 'America/Sao_Paulo', 'HH24:MI') as fim
    from public.pedidos p join public.clientes c on c.id = p.cliente_id left join public.servicos s on s.id = p.servico_id
    left join public.reservas r on r.pedido_id = p.id where p.conta_id = ${q(contaId)}`);
  assert.equal(linhas.length, 1, "um pedido, com uma reserva");
  const [l] = linhas;
  assert.equal(l.origem, "agenda_online");
  assert.equal(l.ensaio, "Gestante");
  assert.equal(l.cliente, "Cliente Prova Gestante");
  assert.equal(l.whatsapp, pedido.whatsapp);
  assert.equal(horaDoSite(l.hora), pedido.hora, "o horário escolhido no site");
  assert.equal(l.situacao, "pre_reserva");
  assert.equal(l.inicio, l.hora);

  // o horário some do site (o mesmo dia, de novo)
  const outra = await abrirSite("/");
  try {
    const ag = outra.pagina.locator("#agendar [data-agenda]");
    await ag.locator(".ag-opcao", { hasText: "Gestante" }).tap();
    await ag.locator(`button.ag-d[aria-label="${pedido.dia}"]`).tap();
    const horas = (await ag.locator(".ag-hora").allTextContents()).map(h => h.trim());
    assert.ok(horas.length > 0, "o dia ainda tem outros horários");
    assert.ok(!horas.includes(pedido.hora), `${pedido.hora} não aparece mais (${horas.join(", ")})`);
    await foto(outra.pagina, "3-horario-sumiu");
    assert.deepEqual(outra.erros, []);
  } finally { await outra.ctx.close(); }

  // no painel, com o login da dona: no Atendimento e na Agenda
  const { pagina: p, ctx: c } = await abrirPainel(DONA, senhaDona);
  try {
    await p.goto(`${painel.url}/atendimento`, { waitUntil: "networkidle" });
    await p.getByText("Cliente Prova Gestante").first().waitFor({ timeout: 15000 });
    await foto(p, "4-painel-atendimento");
    await p.goto(`${painel.url}/agenda`, { waitUntil: "networkidle" });
    await p.waitForSelector("h1");
    await p.locator(".rz-dia-item--pre").first().waitFor({ timeout: 15000 }); // a pré-reserva no mês (o pedido é para os próximos dias)
    await foto(p, "5-painel-agenda");
  } finally { await c.close(); }
});

test("a página de Natal: o pedido na campanha gasta uma vaga", so, async () => {
  const { pagina, ctx, erros } = await abrirSite("/natal");
  try {
    const ag = pagina.locator("[data-agenda][data-so]").first();
    await ag.locator("button.ag-d").first().waitFor();
    assert.equal(await ag.locator("button.ag-d").count() > 0, true);
    await pedir(ag, pagina, { nome: "Cliente Prova Natal" });
    assert.equal(await ag.locator(".ag-pronto .ag-titulo").textContent(), "Pedido enviado.");
    assert.deepEqual(erros, []);
  } finally { await ctx.close(); }
  const [r] = await banco.sql(`select count(*)::int as n, public.campanha_restam(${q(contaId)}, (select id from public.campanhas where conta_id = ${q(contaId)})) as restam
    from public.reservas where conta_id = ${q(contaId)} and campanha_id is not null and situacao = 'pre_reserva'`);
  assert.deepEqual(r, { n: 1, restam: 39 });
  const de_novo = await abrirSite("/natal");
  try {
    await de_novo.pagina.waitForFunction(() => document.querySelector("[data-ag-vagas]")?.textContent === "39", null, { timeout: 15000 });
    await foto(de_novo.pagina, "6-natal-39-vagas");
  } finally { await de_novo.ctx.close(); }
});

test("Meu site: clicar no site abre o campo, o rascunho aparece ao vivo e o que a dona publica vai para o site", so, async () => {
  const { pagina: p, ctx: c } = await abrirPainel(DONA, senhaDona);
  try {
    const erros = [];
    p.on("pageerror", e => erros.push(e.message));
    await p.goto(`${painel.url}/meu-site`, { waitUntil: "networkidle" });
    const site = p.frameLocator("[data-quadro]");
    await site.locator('[data-site="inicio.frase"]', { hasText: FRASE }).waitFor({ timeout: 20000 });
    // um clique na frase da capa, no site, abre a Capa com o cursor na frase
    await site.locator('[data-site="inicio.frase"]').click();
    await p.locator('[name="t:frase"]').waitFor();
    assert.equal(await p.evaluate(() => document.activeElement.name), "t:frase");
    assert.equal(await p.locator(".rz-ms-parte h2").textContent(), "Capa");
    await p.locator('[name="t:frase"]').fill(FRASE_NOVA);
    await site.locator('[data-site="inicio.frase"]', { hasText: FRASE_NOVA }).waitFor({ timeout: 5000 }); // ao vivo, antes de gravar
    // o botão do topo (o que a Renderiza tentou em 16/11 e não mudava): muda nos dois lugares em que ele aparece
    await p.locator("[data-voltar]").click();
    await p.locator('[data-secao="cabecalho"]').click();
    await p.locator('[name="b:botao:rotulo"]').fill("Agendar 2");
    await assert.doesNotReject(site.locator('[data-site-botao="cabecalho.botao"]', { hasText: "Agendar 2" }).nth(1).waitFor({ state: "attached", timeout: 5000 }));
    await p.getByText("Rascunho salvo. Falta publicar.").waitFor({ timeout: 10000 });
    const [r] = await banco.sql(`select conteudo->'secoes'->'cabecalho'->'botoes'->'botao'->>'rotulo' as rotulo, conteudo->'secoes'->'inicio'->'textos'->>'frase' as frase
      from public.sites_versoes where conta_id = ${q(contaId)} and estado = 'rascunho'`);
    assert.deepEqual(r, { rotulo: "Agendar 2", frase: FRASE_NOVA }, "o rascunho gravou sozinho");
    await foto(p, "7-painel-editor-ao-vivo");
    await p.locator("[data-publicar]:not([disabled])").click();
    await p.getByText("Publicado. Aparece no site em até 1 minuto.").waitFor({ timeout: 15000 });
    await p.getByText(/^No ar: versão 1/).waitFor({ timeout: 10000 });
    assert.deepEqual(erros, []);
  } finally { await c.close(); }

  const inicio = Date.now();
  let visto = false;
  while (!visto && Date.now() - inicio < 60000) {
    const s = await abrirSite("/");
    try {
      await s.pagina.waitForLoadState("networkidle");
      visto = (await s.pagina.locator('[data-site-secao="inicio"]').textContent()).includes(FRASE_NOVA);
      if (visto) { await foto(s.pagina, "8-site-com-a-edicao"); assert.deepEqual(s.erros, []); }
    } finally { await s.ctx.close(); }
    if (!visto) await new Promise(r => setTimeout(r, 3000));
  }
  assert.ok(visto, "a frase nova apareceu no site");
});

test("indicadores: a visita de uma pessoa conta (tempo, parte vista, botão clicado) e aparece no painel; robô não conta", so, async () => {
  // até aqui o site foi aberto várias vezes pelo navegador do teste, que se apresenta como robô: nada contado
  assert.deepEqual(await banco.sql(`select count(*)::int as n from public.sites_visitas where conta_id = ${q(contaId)}`), [{ n: 0 }]);
  // como uma pessoa: o navegador de um celular de verdade (o do teste diz "HeadlessChrome", que a API trata como robô)
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
  await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false }));
  try {
    const p = await ctx.newPage();
    await p.goto(siteUrl + "/");
    await p.locator('[data-site-botao="inicio.link"]').tap(); // "Ver o portfólio": fica na página
    await p.waitForTimeout(4200);
    await p.evaluate(() => window.dispatchEvent(new Event("pagehide"))); // como fechar a aba
    await p.waitForTimeout(800);
  } finally { await ctx.close(); }
  const [v] = await banco.sql(`select pagina, tela, origem, segundos, cliques, secoes, length(aparelho) as aparelho, length(visita) as visita from public.sites_visitas where conta_id = ${q(contaId)}`);
  assert.ok(v, "a visita foi contada");
  assert.deepEqual({ pagina: v.pagina, tela: v.tela, origem: v.origem, cliques: v.cliques, aparelho: v.aparelho, visita: v.visita },
    { pagina: "/", tela: "celular", origem: null, cliques: { "inicio.link": 1 }, aparelho: 32, visita: 16 });
  assert.ok(v.segundos >= 3 && v.segundos <= 8, `uns 4 segundos (${v.segundos})`);
  assert.ok(Object.keys(v.secoes).length >= 1 && Object.values(v.secoes).reduce((a, b) => a + b, 0) <= v.segundos, JSON.stringify(v.secoes));

  const { pagina: p, ctx: c } = await abrirPainel(DONA, senhaDona);
  try {
    await p.goto(`${painel.url}/meu-site`, { waitUntil: "networkidle" });
    await p.locator('[data-aba="indicadores"]').click();
    await p.getByText("Os botões mais clicados").waitFor({ timeout: 15000 });
    const quadros = (await p.locator('[data-painel="indicadores"]').innerText()).replace(/\s+/g, " ");
    assert.match(quadros, /Visitas 1 páginas abertas Aparelhos 1 somando dia a dia Tempo médio \d s com a página à vista Cliques em botões 1/);
    assert.match(quadros, /Capa · Ver o portfólio 1/);
    assert.match(quadros, /Celular 100%/);
    await foto(p, "9-painel-indicadores");
  } finally { await c.close(); }
});

test("desligar a conta no Admin: o site volta à versão inicial e a agenda ao WhatsApp; religar, volta tudo", so, async () => {
  const { pagina: p, ctx: c } = await abrirPainel(EQUIPE, senhaEquipe);
  const conta = () => p.locator(`[data-conta="${contaId}"]`).click();
  try {
    await p.goto(`${painel.url}/admin/contas`, { waitUntil: "networkidle" });
    await conta();
    await p.locator("[data-desligar]").click();
    await p.locator("[data-sim]").click();
    await p.getByText(/desligada\./).first().waitFor({ timeout: 15000 });

    const s = await abrirSite("/");
    try {
      const ag = s.pagina.locator("#agendar [data-agenda]");
      await ag.locator(".ag-opcao").first().waitFor();
      await s.pagina.waitForLoadState("networkidle");
      assert.ok((await s.pagina.locator('[data-site-secao="inicio"]').textContent()).includes(FRASE), "a frase da versão inicial");
      assert.equal(await ag.locator(".ag-exemplo").isVisible(), true, "os horários da página, como na demo");
      const antes = await banco.sql(`select count(*)::int as n from public.pedidos where conta_id = ${q(contaId)}`);
      await pedir(ag, s.pagina, { opcao: "Newborn", nome: "Cliente Prova Desligado" });
      await s.pagina.waitForTimeout(500);
      assert.match(decodeURIComponent(s.whatsapp[0] || ""), /^https:\/\/wa\.me\/5511994794869\?text=.*Newborn/, "o pedido sai pelo WhatsApp");
      assert.deepEqual(await banco.sql(`select count(*)::int as n from public.pedidos where conta_id = ${q(contaId)}`), antes, "nada vai ao painel");
      await foto(s.pagina, "9-desligado-whatsapp");
      assert.deepEqual(s.erros, []);
    } finally { await s.ctx.close(); }

    await p.keyboard.press("Escape").catch(() => {});
    await p.goto(`${painel.url}/admin/contas`, { waitUntil: "networkidle" });
    await conta();
    await p.locator("[data-religar]").click();
    await p.locator('button[type=submit][form="form-prazo"]').click();
    await p.getByText(/religada\./).first().waitFor({ timeout: 15000 });
  } finally { await c.close(); }

  const s = await abrirSite("/");
  try {
    await s.pagina.waitForFunction(t => document.querySelector('[data-site-secao="inicio"]')?.textContent.includes(t), FRASE_NOVA, { timeout: 15000 });
    assert.deepEqual(s.erros, []);
  } finally { await s.ctx.close(); }
});

test("painel fora do ar: o site abre com a versão inicial e a agenda da página", so, async () => {
  painel.parar();
  await new Promise(r => setTimeout(r, 500));
  const s = await abrirSite("/");
  try {
    const ag = s.pagina.locator("#agendar [data-agenda]");
    await ag.locator(".ag-opcao").first().waitFor();
    await s.pagina.waitForLoadState("networkidle");
    assert.ok((await s.pagina.locator('[data-site-secao="inicio"]').textContent()).includes(FRASE));
    assert.deepEqual(await ag.locator(".ag-opcao b").allTextContents(), ["Natal 2026", "Gestante", "Newborn", "Acompanhamento", "Smash the cake", "Família"]);
    assert.equal(await ag.locator(".ag-exemplo").isVisible(), true);
    await foto(s.pagina, "10-painel-fora");
    assert.deepEqual(s.erros, []);
  } finally { await s.ctx.close(); }
});
