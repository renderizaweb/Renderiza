// A prova no STG da entrega da Bia Maida (Parada C2/C4): o "Sua data" do site dela ligado à agenda online do painel,
// no jeito escolhido na conta (Configurações: por dia e turno, ou por horário). O site é gerado pelo virar-site.mjs com
// "painel" apontando para o painel local (scripts/servidor.mjs, contra o banco STG) e aberto num Chromium de celular;
// o painel, num de computador. O caminho inteiro:
// - por dia e turno: os tipos de trabalho vêm do painel, o dia mostra os turnos livres, o pedido cai no Atendimento e
//   na Agenda (pré-reserva do turno) e o turno some do site;
// - o painel no jeito por turno: Configurações, Serviços (Horários com começo, fim e nome; sem campanhas) e a Agenda;
// - a dona troca o jeito para "por horário" em Configurações: o site passa a mostrar os horários de começo; volta;
// - o site desconectado no painel: o "Sua data" volta ao WhatsApp, como sem o painel.
//
//   node --test test/bia-stg/prova.mjs
//
// Cria a conta de teste do zero (código t-bia-maida, só no STG) e apaga tudo no fim. Precisa das variáveis PAINEL_* e
// do Playwright; sem elas, fica de fora. PROVA_FOTOS=<pasta> guarda as telas. Dados fictícios.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bancoStg, ligarServidor, entrar, playwright as pw, motivoParaPular, q } from "../../painel-clientes/test/fluxos/ambiente.mjs";

const pular = motivoParaPular();
const so = { skip: pular };
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEMO = path.join(RAIZ, "demos", "bia-maida-fotografia");
const CODIGO = "t-bia-maida";
const DONA = "biamaidateste@acesso.renderizaweb.com.br"; // login de usuário: não recebe e-mail
const MODULOS = ["agenda-online", "agenda", "atendimento", "clientes", "contratos", "financeiro", "meu-site"];
const TIPOS = ["Aniversário", "Chá de bebê", "Casamento", "Batizado", "Evento de empresa", "Ensaio externo", "Corporativo"];
// os turnos: sábado e domingo de manhã, à tarde e à noite; de segunda a sexta, só à noite
const TURNOS = [["Manhã", "08:00", "12:00"], ["Tarde", "13:00", "18:00"], ["Noite", "19:00", "23:00"]];
const TIPO = { ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const FOTOS = process.env.PROVA_FOTOS;
const zap = () => "119" + String(randomBytes(4).readUInt32BE() % 1e8).padStart(8, "0");
const daConta = `(select id from public.contas where codigo = ${q(CODIGO)})`;

let banco, painel, siteServidor, siteUrl, pasta, navegador, senhaDona;

/** O sábado daqui a duas semanas, "aaaa-mm-dd" (longe o bastante para não passar durante a prova). */
function sabado() {
  const d = new Date(); d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7) + 14);
  return d.toISOString().slice(0, 10);
}

function gerarSite(api) {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), "bia-stg-"));
  const copia = path.join(pasta, path.basename(DEMO));
  fs.mkdirSync(copia);
  fs.copyFileSync(path.join(DEMO, "index.html"), path.join(copia, "index.html"));
  const conf = JSON.parse(fs.readFileSync(path.join(DEMO, "site.json"), "utf8"));
  fs.writeFileSync(path.join(copia, "site.json"), JSON.stringify({ ...conf, painel: { codigo: CODIGO, agenda: true, api } }));
  const site = path.join(pasta, "site");
  const r = spawnSync("node", ["scripts/virar-site.mjs", copia, site], { cwd: RAIZ, encoding: "utf8" });
  if (r.status !== 0 || /✗/.test(r.stdout)) throw new Error("virar-site falhou:\n" + r.stdout + r.stderr);
  return site;
}

async function apagar() {
  await banco.sql(`
    delete from public.contas where codigo = ${q(CODIGO)};
    delete from public.pessoas where usuario_id in (select id from auth.users where email = ${q(DONA)});
    delete from auth.users where email = ${q(DONA)};`);
}

async function criar(site) {
  await apagar();
  const r = spawnSync("node", ["ferramentas/meu-site/extrair.mjs", path.join(site, "index.html")], { cwd: RAIZ, encoding: "utf8", maxBuffer: 1 << 24 });
  if (r.status !== 0) throw new Error("extrair.mjs falhou:\n" + r.stderr);
  const horarios = [0, 1, 2, 3, 4, 5, 6].flatMap(d => TURNOS.filter(([nome]) => d === 0 || d === 6 || nome === "Noite")
    .map(([nome, ini, fim]) => `(${daConta}, ${d}, ${q(ini)}, ${q(fim)}, ${q(nome)})`));
  await banco.sql(`
    insert into public.contas (nome, nicho, codigo, cores, situacao, origem, ajustes)
      values ('Bia Maida Fotografia (teste)', 'fotografia', ${q(CODIGO)}, '{"principal": "#1f5470"}'::jsonb, 'ativa', 'renderiza', '{"agenda": {"modo": "turno"}}'::jsonb);
    insert into public.contas_modulos (conta_id, modulo_id) select ${daConta}, m from unnest(array[${MODULOS.map(q).join(", ")}]::text[]) as m;
    insert into public.sites (conta_id, codigo, dominios, conteudo_inicial) values (${daConta}, ${q(CODIGO)}, array['localhost'], ${q(r.stdout)}::jsonb);
    insert into public.servicos (conta_id, nome, duracao_min, ordem) values ${TIPOS.map((t, i) => `(${daConta}, ${q(t)}, 240, ${i + 1})`).join(", ")};
    insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) values ${horarios.join(", ")};`);
  senhaDona = randomBytes(18).toString("base64url");
  await banco.sql(`
    with u as (
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', ${q(DONA)}, extensions.crypt(${q(senhaDona)}, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"nome":"Bia (teste)"}'::jsonb, now(), now(), '', '', '', '', '', '', '', '')
      returning id
    ), i as (
      insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      select id::text, id, json_build_object('sub', id::text, 'email', ${q(DONA)}, 'email_verified', true)::jsonb, 'email', now(), now(), now() from u
    )
    insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select ${daConta}, id, 'Bia (teste)', ${q(DONA)}, true from u;`);
}

/** O site gerado, servido como no Cloudflare Pages (com os cabeçalhos do _headers). */
function servirSite(dir) {
  const cabecalhos = Object.fromEntries(fs.readFileSync(path.join(dir, "_headers"), "utf8").split("\n/img/")[0].split("\n").slice(1)
    .map(l => l.trim().match(/^([^:]+): (.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      let caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (caminho === "/") caminho = "/index.html";
      const arquivo = path.join(dir, caminho);
      if (!arquivo.startsWith(dir) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { ...cabecalhos, "Content-Type": TIPO[path.extname(arquivo)] || "application/octet-stream" });
      fs.createReadStream(arquivo).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => ok(s));
  });
}

async function foto(pagina, nome) {
  if (!FOTOS) return;
  fs.mkdirSync(FOTOS, { recursive: true });
  await pagina.screenshot({ path: path.join(FOTOS, nome + ".png") });
}

/** O site num celular, já na seção "Sua data"; só ele e o painel local (o WhatsApp fica anotado, não abre). */
async function abrirSite({ largura = 390, altura = 844, celular = true } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, isMobile: celular, hasTouch: celular, reducedMotion: "reduce" });
  const pagina = await ctx.newPage();
  const erros = [];
  pagina.on("pageerror", e => erros.push(e.message));
  await ctx.route("**/*", rota => {
    const u = new URL(rota.request().url());
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return rota.continue();
    return rota.abort(); // fontes, mapa, WhatsApp: nada de fora
  });
  await pagina.goto(siteUrl + "/#data");
  await pagina.locator("#data").scrollIntoViewIfNeeded();
  return { pagina, ctx, erros, form: pagina.locator("[data-consulta]") };
}

async function abrirPainel() {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
  const pagina = await ctx.newPage();
  await entrar(pagina, painel.url, DONA, senhaDona);
  return { pagina, ctx };
}

/** Escolhe o dia no campo de data (como a pessoa faz: o evento "change"). */
async function escolherDia(pagina, dia) {
  await pagina.locator("[name=dia]").fill(dia);
  await pagina.locator("[name=dia]").dispatchEvent("change");
}
const vagas = pagina => pagina.locator("[data-ag-opcoes] .chip").evaluateAll(ls => ls.map(l => ({ texto: l.textContent.trim(), livre: !l.querySelector("input").disabled })));

before(async () => {
  if (pular) return;
  banco = await bancoStg();
  painel = await ligarServidor();
  const site = gerarSite(`${painel.url}/api/publico/`);
  await criar(site);
  siteServidor = await servirSite(site);
  siteUrl = `http://localhost:${siteServidor.address().port}`;
  navegador = await pw().chromium.launch();
});

after(async () => {
  if (pular) return;
  await navegador?.close();
  siteServidor?.close();
  painel?.parar();
  try { if (banco) await apagar(); } finally { if (pasta) fs.rmSync(pasta, { recursive: true, force: true }); }
});

const DIA = sabado();

test("por dia e turno: os tipos e os turnos vêm do painel, e o pedido vira pré-reserva do turno", so, async () => {
  const { pagina, ctx, erros, form } = await abrirSite();
  await form.locator("[data-ag-pedir]").waitFor({ state: "visible", timeout: 10000 });
  assert.deepEqual(await form.locator("[name=tipo]").evaluateAll(is => is.map(i => i.nextElementSibling.textContent)), [...TIPOS, "Outro"], "os tipos de trabalho do painel, mais Outro");
  assert.equal(await form.locator("[data-ag-zap-rotulo]").textContent(), "Prefiro falar no WhatsApp", "o WhatsApp vira a segunda opção");
  await form.locator(".chip", { hasText: "Chá de bebê" }).click();
  await escolherDia(pagina, DIA);
  await form.locator("[data-ag-opcoes] .chip").first().waitFor();
  assert.equal(await form.locator("[data-ag-rotulo]").textContent(), "Qual turno?");
  assert.deepEqual(await vagas(pagina), [{ texto: "Manhã8h às 12h", livre: true }, { texto: "Tarde13h às 18h", livre: true }, { texto: "Noite19h às 23h", livre: true }]);
  await form.locator("[data-ag-opcoes] .chip", { hasText: "Manhã" }).click();
  await form.locator("[name=onde]").fill("Moema");
  assert.match(await pagina.locator("[data-consulta-previa]").textContent(), /chá de bebê no dia \d\d\/\d\d\/\d{4} \(sábado\), manhã \(8h às 12h\), em Moema\.$/, "a prévia leva o turno");
  await foto(pagina, "1-turnos");
  // sem nome: não manda
  await pagina.waitForTimeout(3200); // o tempo mínimo da API contra robô
  await form.locator("[data-ag-pedir]").click();
  assert.equal(await form.locator("[data-ag-erro]").textContent(), "Diga o seu nome.");
  await form.locator("[name=nome]").fill("Carla da Prova");
  const whatsapp = zap();
  await form.locator("[name=whatsapp]").fill(`(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`);
  await form.locator("[data-ag-pedir]").click();
  await pagina.locator("[data-ag-pronto]").waitFor({ state: "visible", timeout: 15000 });
  assert.match(await pagina.locator("[data-ag-quando]").textContent(), /^Chá de bebê · sábado, \d\d\/\d\d\/\d{4} · Manhã \(8h às 12h\) · Moema$/);
  await foto(pagina, "2-pedido-enviado");
  const [r] = await banco.sql(`select p.origem, p.etapa, p.mensagem, s.nome as tipo, c.nome as cliente, c.whatsapp, x.situacao,
      to_char(x.inicio at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI') as inicio, to_char(x.fim at time zone 'America/Sao_Paulo', 'HH24:MI') as fim
    from public.pedidos p join public.reservas x on x.id = p.reserva_id join public.clientes c on c.id = p.cliente_id left join public.servicos s on s.id = p.servico_id
    where p.conta_id = ${daConta}`);
  assert.deepEqual({ ...r, mensagem: undefined }, { origem: "agenda_online", etapa: r.etapa, mensagem: undefined, tipo: "Chá de bebê", cliente: "Carla da Prova", whatsapp, situacao: "pre_reserva", inicio: `${DIA} 08:00`, fim: "12:00" });
  assert.match(r.mensagem, /Manhã/); assert.match(r.mensagem, /Chá de bebê, em Moema\./);
  assert.deepEqual(erros, []);
  await ctx.close();

  // de novo, outra pessoa: a manhã aparece ocupada, a tarde segue livre
  const s2 = await abrirSite({ largura: 1440, altura: 900, celular: false });
  await s2.form.locator("[data-ag-pedir]").waitFor({ state: "visible", timeout: 10000 });
  await escolherDia(s2.pagina, DIA);
  await s2.form.locator("[data-ag-opcoes] .chip").first().waitFor();
  assert.deepEqual((await vagas(s2.pagina)).map(v => v.livre), [false, true, true], "a manhã pedida some do site");
  assert.match(await s2.form.locator("[data-ag-opcoes] .chip").first().textContent(), /ocupado/);
  await foto(s2.pagina, "3-manha-ocupada-computador");
  // um dia de semana só tem a noite; um dia sem turno livre oferece os dias livres perto
  assert.deepEqual(s2.erros, []);
  await s2.ctx.close();
});

test("o painel no jeito por turno: Configurações, Serviços e a Agenda", so, async () => {
  const { pagina, ctx } = await abrirPainel();
  await pagina.goto(`${painel.url}/configuracoes`, { waitUntil: "networkidle" });
  const jeito = pagina.locator("#form-agenda");
  assert.equal(await jeito.locator("[name=modo]:checked").getAttribute("value"), "turno", "a conta está por dia e turno");
  assert.match(await jeito.innerText(), /Por horário\s*Padrão/, "o padrão da fotografia aparece marcado como padrão");
  await jeito.scrollIntoViewIfNeeded();
  await foto(pagina, "4-configuracoes");
  await pagina.goto(`${painel.url}/servicos?aba=horarios`, { waitUntil: "networkidle" });
  const abas = await pagina.locator(".rz-abas a").allInnerTexts();
  assert.ok(!abas.includes("Campanhas"), "sem campanhas no jeito por turno");
  assert.match(await pagina.locator("main").innerText(), /A agenda online oferece o dia e o turno/);
  assert.match(await pagina.locator("main").innerText(), /8h às 12h · Manhã/);
  await pagina.locator(".rz-cabeca-acoes [data-novo]").click();
  assert.equal(await pagina.locator("#h-fim").count(), 1, "o turno novo pede o fim");
  assert.equal(await pagina.locator("#h-nome").count(), 1, "e o nome");
  await foto(pagina, "5-servicos-turno");
  await pagina.goto(`${painel.url}/agenda?dia=${DIA}`, { waitUntil: "networkidle" });
  const corpo = await pagina.locator("main").innerText();
  assert.match(corpo, /Carla da Prova/, "a pré-reserva está na agenda");
  assert.ok(!/Meus horários de trabalho/.test(corpo), "sem a jornada de horários (é do jeito por horário)");
  const turnos = await pagina.locator(".rz-painel-dia .rz-livres li").allInnerTexts();
  assert.deepEqual(turnos.map(t => t.replace(/\s+/g, " ").trim()), [
    "Manhã 8h às 12h · Ocupado", "Tarde 13h às 18h · Livre · no site Marcar", "Noite 19h às 23h · Livre · no site Marcar"],
    "o dia mostra cada turno, livre ou ocupado");
  await foto(pagina, "6-agenda");
  // "Marcar" na tarde: escolhe a cliente e o formulário já vem com o turno (13h às 18h)
  await pagina.locator("[data-marcar-turno]").first().click();
  await pagina.locator("[data-cliente]").first().click({ timeout: 15000 });
  await pagina.locator("#res-inicio").waitFor();
  assert.deepEqual([await pagina.locator("#res-inicio").inputValue(), await pagina.locator("#res-fim").inputValue()], ["13:00", "18:00"]);
  await ctx.close();
});

test("a dona troca o jeito para \"por horário\": o site mostra os horários de começo; e volta", so, async () => {
  const { pagina, ctx } = await abrirPainel();
  await pagina.goto(`${painel.url}/configuracoes`, { waitUntil: "networkidle" });
  await pagina.locator("#form-agenda .rz-opcao", { hasText: "Por horário" }).click();
  await pagina.locator("#form-agenda [type=submit]").click();
  await pagina.waitForFunction(() => /horário de início/.test(document.querySelector(".rz-aviso:last-of-type")?.textContent || ""), null, { timeout: 15000 });
  const [{ modo }] = await banco.sql(`select ajustes #>> '{agenda,modo}' as modo from public.contas where codigo = ${q(CODIGO)}`);
  assert.equal(modo, "horario");
  await pagina.goto(`${painel.url}/servicos?aba=horarios`, { waitUntil: "networkidle" });
  assert.ok((await pagina.locator(".rz-abas a").allInnerTexts()).includes("Campanhas"), "por horário, as campanhas voltam");

  await new Promise(r => setTimeout(r, 21000)); // o cache curto da agenda na rede (s-maxage=20)
  const s = await abrirSite();
  await s.form.locator("[data-ag-pedir]").waitFor({ state: "visible", timeout: 12000 });
  await escolherDia(s.pagina, DIA);
  await s.form.locator("[data-ag-opcoes] .chip").first().waitFor();
  assert.equal(await s.form.locator("[data-ag-rotulo]").textContent(), "Qual horário?");
  const hs = await vagas(s.pagina);
  assert.deepEqual(hs.map(v => v.texto.replace("ocupado", "")), ["8h", "13h", "19h"], "os começos dos horários, por horário");
  await foto(s.pagina, "7-por-horario");
  assert.deepEqual(s.erros, []);
  await s.ctx.close();

  await pagina.goto(`${painel.url}/configuracoes`, { waitUntil: "networkidle" });
  await pagina.locator("#form-agenda .rz-opcao", { hasText: "Por dia e turno" }).click();
  await pagina.locator("#form-agenda [type=submit]").click();
  await pagina.waitForFunction(() => /dia e o turno/.test(document.querySelector(".rz-aviso:last-of-type")?.textContent || ""), null, { timeout: 15000 });
  const [{ modo: volta }] = await banco.sql(`select ajustes #>> '{agenda,modo}' as modo from public.contas where codigo = ${q(CODIGO)}`);
  assert.equal(volta, "turno");
  await ctx.close();
});

/** O "Sua data" está como sem o painel: sem pedido pelo site, sem turnos, a mensagem pronta no WhatsApp. */
async function semPainel(s) {
  await s.pagina.waitForTimeout(6000); // as duas perguntas ao painel
  assert.equal(await s.form.locator("[data-ag-pedir]").isVisible(), false, "sem o botão do pedido pelo site");
  assert.equal(await s.form.locator("[data-ag-zap-rotulo]").textContent(), "Consultar a data no WhatsApp");
  await escolherDia(s.pagina, DIA);
  assert.equal(await s.form.locator("[data-ag-vagas]").isVisible(), false, "sem os turnos");
  assert.match(await s.form.locator("[data-consulta-enviar]").getAttribute("href"), /^https:\/\/wa\.me\/5511987191135\?text=.*agenda/, "a mensagem pronta no WhatsApp, como sem o painel");
  assert.deepEqual(s.erros, []);
}

test("a conta sem nenhum turno cadastrado: o \"Sua data\" fica no WhatsApp (não diz que não há data)", so, async () => {
  const [{ guardados }] = await banco.sql(`select json_agg(json_build_object('d', dia_semana, 'i', inicio, 'f', fim, 'n', nome)) as guardados from public.horarios where conta_id = ${daConta}`);
  await banco.sql(`delete from public.horarios where conta_id = ${daConta}`);
  try {
    await new Promise(r => setTimeout(r, 21000)); // o cache curto da agenda na rede
    const s = await abrirSite();
    await semPainel(s);
    await s.ctx.close();
  } finally {
    await banco.sql(`insert into public.horarios (conta_id, dia_semana, inicio, fim, nome) select ${daConta}, x.d, x.i, x.f, x.n
      from jsonb_to_recordset(${q(JSON.stringify(guardados))}::jsonb) as x(d int, i time, f time, n text)`);
  }
});

test("o site desconectado no painel: o \"Sua data\" volta ao WhatsApp", so, async () => {
  await banco.sql(`update public.sites set situacao = 'desconectado' where codigo = ${q(CODIGO)}`);
  await new Promise(r => setTimeout(r, 21000));
  const s = await abrirSite();
  await semPainel(s);
  await foto(s.pagina, "8-desconectado");
  await s.ctx.close();
});
