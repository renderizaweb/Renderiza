// A API pública (api/publico/): o que os sites dos clientes chamam. O banco é imitado (a função fetch), então aqui
// se testa o que a API faz antes e depois do banco: CORS, cache, códigos, campo-isca, tempo mínimo, domínio,
// endereço embaralhado e o aviso. As regras do banco estão em supabase/testes/040_publico_agenda.sql (eventos) e
// 044_publico_agenda_fotografia.sql (fotografia, por horário).
import { test } from "node:test";
import assert from "node:assert/strict";
import { tratar as agenda } from "../api/publico/agenda/[codigo]/index.js";
import { tratar as pedido, TEMPO_MINIMO } from "../api/publico/agenda/[codigo]/pedido.js";
import { tratar as saude } from "../api/publico/saude.js";
import { enderecoEmbaralhado, dominioDe, adaptar, resposta } from "../api/publico/_comum.js";

const ENV = { SUPABASE_URL: "https://qxcxllhmtodsptxffbhx.supabase.co", SUPABASE_ANON_KEY: "sb_publishable_teste" };

/** Um fetch falso que responde por endereço e guarda o que foi pedido. */
function bancoFalso(respostas) {
  const chamadas = [];
  const buscar = async (url, op) => {
    const corpo = op.body ? JSON.parse(op.body) : null;
    chamadas.push({ url, corpo, headers: op.headers });
    const r = respostas(url, corpo);
    if (r instanceof Error) throw r;
    return { ok: r.status ? r.status < 400 : true, status: r.status || 200, json: async () => r.json ?? null };
  };
  return { buscar, chamadas };
}

test("agenda: pergunta ao banco com a chave pública e devolve com CORS e cache curto", async () => {
  const b = bancoFalso(() => ({ json: { esquema: 1, dias: [] } }));
  const r = await agenda({ metodo: "GET", caminho: "/api/publico/agenda/villa-alecrim", busca: new URLSearchParams("de=2026-11-01&ate=2026-11-30"), env: ENV }, b.buscar);
  assert.equal(r.status, 200);
  assert.equal(r.cabecalhos["Access-Control-Allow-Origin"], "*");
  assert.match(r.cabecalhos["Cache-Control"], /s-maxage=20/);
  assert.equal(b.chamadas[0].url, ENV.SUPABASE_URL + "/rest/v1/rpc/publico_disponibilidade");
  assert.deepEqual(b.chamadas[0].corpo, { p_codigo: "villa-alecrim", p_de: "2026-11-01", p_ate: "2026-11-30" });
  assert.equal(b.chamadas[0].headers.apikey, "sb_publishable_teste");
  assert.equal(b.chamadas[0].headers.Authorization, undefined, "só a chave pública, sem login");
});

test("agenda: site que não responde é 404; código ou data estranhos, 400; OPTIONS e outros métodos", async () => {
  const nulo = bancoFalso(() => ({ json: null }));
  assert.equal((await agenda({ metodo: "GET", caminho: "/api/publico/agenda/villa-alecrim", busca: new URLSearchParams(), env: ENV }, nulo.buscar)).status, 404);
  for (const [caminho, busca] of [["/api/publico/agenda/Villa", ""], ["/api/publico/agenda/a", ""], ["/api/publico/agenda/villa-alecrim", "de=amanha"]]) {
    assert.equal((await agenda({ metodo: "GET", caminho, busca: new URLSearchParams(busca), env: ENV }, nulo.buscar)).status, 400, caminho + busca);
  }
  assert.equal(nulo.chamadas.length, 1, "pedido estranho nem chega ao banco");
  assert.equal((await agenda({ metodo: "OPTIONS", caminho: "/api/publico/agenda/villa-alecrim", busca: new URLSearchParams(), env: ENV })).status, 204);
  assert.equal((await agenda({ metodo: "POST", caminho: "/api/publico/agenda/villa-alecrim", busca: new URLSearchParams(), env: ENV })).status, 405);
});

const ENSAIO = "6c8f0d2e-0000-4000-8000-0000000000aa", CAMPANHA = "6c8f0d2e-0000-4000-8000-0000000000bb";

test("agenda (fotografia): com horarios, ensaio ou campanha, pergunta os horários livres; id estranho é 400", async () => {
  const b = bancoFalso(() => ({ json: { esquema: 1, nicho: "fotografia", dias: [] } }));
  for (const [busca, servico, campanha] of [["horarios=1", null, null], [`servico=${ENSAIO}`, ENSAIO, null], [`campanha=${CAMPANHA}&de=2026-11-19`, null, CAMPANHA]]) {
    const r = await agenda({ metodo: "GET", caminho: "/api/publico/agenda/rafaela-damaceno", busca: new URLSearchParams(busca), env: ENV }, b.buscar);
    assert.equal(r.status, 200, busca);
    const c = b.chamadas.at(-1);
    assert.equal(c.url, ENV.SUPABASE_URL + "/rest/v1/rpc/publico_horarios");
    assert.deepEqual(c.corpo, { p_codigo: "rafaela-damaceno", p_de: busca.includes("de=") ? "2026-11-19" : null, p_ate: null, p_servico: servico, p_campanha: campanha });
  }
  const nulo = bancoFalso(() => ({ json: null }));
  assert.equal((await agenda({ metodo: "GET", caminho: "/api/publico/agenda/rafaela-damaceno", busca: new URLSearchParams("horarios=1"), env: ENV }, nulo.buscar)).status, 404);
  for (const busca of ["servico=1", "campanha=natal", `servico=${ENSAIO}x`]) {
    assert.equal((await agenda({ metodo: "GET", caminho: "/api/publico/agenda/rafaela-damaceno", busca: new URLSearchParams(busca), env: ENV }, nulo.buscar)).status, 400, busca);
  }
  assert.equal(nulo.chamadas.length, 1, "id estranho nem chega ao banco");
});

test("a API recusa chave secreta e o banco do Painel de prospecção", async () => {
  const b = bancoFalso(() => ({ json: {} }));
  for (const env of [{ ...ENV, SUPABASE_ANON_KEY: "sb_secret_abc" }, { ...ENV, SUPABASE_URL: "https://gxdwluswpczlfgvzxqvg.supabase.co" }, {}]) {
    await assert.rejects(agenda({ metodo: "GET", caminho: "/api/publico/agenda/villa-alecrim", busca: new URLSearchParams(), env }, b.buscar));
  }
  assert.equal(b.chamadas.length, 0);
});

const PEDIDO = { nome: "Camila", whatsapp: "11988887777", data: "2026-11-07", turno: "6c8f0d2e-0000-4000-8000-000000000001", convidados: 120, tempo: 45000, website: "" };

test("pedido: manda ao banco só os campos do pedido, o domínio de quem chamou e o endereço embaralhado; avisa o dono", async () => {
  const agora = new Date("2026-10-29T15:00:00Z");
  const b = bancoFalso(url => url.endsWith("/rpc/publico_pedido")
    ? { json: { ok: true, pedido: "pedido-1", separada_ate: "2026-10-31T15:00:00Z" } }
    : { json: {} });
  const r = await pedido({ metodo: "POST", caminho: "/api/publico/agenda/villa-alecrim/pedido", corpo: { ...PEDIDO, extra: "ignorado" }, origem: "https://www.villa-alecrim.com.br", ip: "200.1.2.3", env: ENV }, b.buscar, agora);
  assert.equal(r.status, 201);
  assert.deepEqual(r.corpo, { ok: true, separada_ate: "2026-10-31T15:00:00Z" });
  const rpc = b.chamadas[0];
  assert.deepEqual(Object.keys(rpc.corpo.p_dados).sort(), ["convidados", "data", "nome", "turno", "whatsapp"]);
  assert.equal(rpc.corpo.p_dominio, "www.villa-alecrim.com.br");
  assert.equal(rpc.corpo.p_endereco, enderecoEmbaralhado("200.1.2.3", "villa-alecrim", agora));
  assert.ok(!JSON.stringify(rpc.corpo).includes("200.1.2.3"), "o endereço não vai ao banco");
  assert.equal(b.chamadas[1].url, ENV.SUPABASE_URL + "/functions/v1/avisar-pedido");
  assert.deepEqual(b.chamadas[1].corpo, { pedido: "pedido-1" });
  assert.equal(r.cabecalhos["Cache-Control"], "no-store");
});

test("pedido (fotografia): com hora, vai para o pedido por horário só com os campos dele; avisa o dono", async () => {
  const b = bancoFalso(url => url.endsWith("/rpc/publico_pedido_horario")
    ? { json: { ok: true, pedido: "pedido-2", separada_ate: "2026-11-18T15:00:00Z" } }
    : { json: {} });
  const corpo = { nome: "Lia", whatsapp: "11988887777", servico: ENSAIO, campanha: CAMPANHA, data: "2026-11-19", hora: "09:00", mensagem: "Oi", turno: "x", convidados: 3, tempo: 9000, website: "" };
  const r = await pedido({ metodo: "POST", caminho: "/api/publico/agenda/rafaela-damaceno/pedido", corpo, origem: "https://estudiorafaeladamaceno.com.br", ip: "200.1.2.3", env: ENV }, b.buscar);
  assert.equal(r.status, 201);
  assert.deepEqual(r.corpo, { ok: true, separada_ate: "2026-11-18T15:00:00Z" });
  assert.equal(b.chamadas[0].url, ENV.SUPABASE_URL + "/rest/v1/rpc/publico_pedido_horario");
  assert.deepEqual(Object.keys(b.chamadas[0].corpo.p_dados).sort(), ["campanha", "data", "hora", "mensagem", "nome", "servico", "whatsapp"]);
  assert.equal(b.chamadas[0].corpo.p_dominio, "estudiorafaeladamaceno.com.br");
  assert.deepEqual(b.chamadas[1].corpo, { pedido: "pedido-2" });
  const ocupada = bancoFalso(() => ({ json: { ok: false, erro: "ocupada" } }));
  assert.equal((await pedido({ metodo: "POST", caminho: "/api/publico/agenda/rafaela-damaceno/pedido", corpo, origem: "", ip: "", env: ENV }, ocupada.buscar)).status, 409);
});

test("pedido: o aviso falhar não derruba o pedido", async () => {
  const b = bancoFalso(url => url.endsWith("/rpc/publico_pedido") ? { json: { ok: true, pedido: "p", separada_ate: "x" } } : new Error("fora do ar"));
  const r = await pedido({ metodo: "POST", caminho: "/api/publico/agenda/villa-alecrim/pedido", corpo: PEDIDO, origem: "https://villa.teste", ip: "1.1.1.1", env: ENV }, b.buscar);
  assert.equal(r.status, 201);
});

test("pedido: robô (campo-isca ou rápido demais) recebe ok falso e nada vai ao banco", async () => {
  const b = bancoFalso(() => ({ json: { ok: true } }));
  for (const corpo of [{ ...PEDIDO, website: "http://spam" }, { ...PEDIDO, tempo: TEMPO_MINIMO - 1 }, { ...PEDIDO, tempo: undefined }]) {
    const r = await pedido({ metodo: "POST", caminho: "/api/publico/agenda/villa-alecrim/pedido", corpo, origem: "https://villa.teste", ip: "1.1.1.1", env: ENV }, b.buscar);
    assert.equal(r.status, 201);
    assert.equal(r.corpo.ok, true);
  }
  assert.equal(b.chamadas.length, 0);
});

test("pedido: os erros do banco viram os códigos certos, com o campo quando é dado", async () => {
  const casos = { fora: 404, dominio: 403, ocupada: 409, limite: 429, dados: 422, estranho: 422 };
  for (const [erro, status] of Object.entries(casos)) {
    const b = bancoFalso(() => ({ json: { ok: false, erro, ...(erro === "dados" ? { campo: "whatsapp" } : {}) } }));
    const r = await pedido({ metodo: "POST", caminho: "/api/publico/agenda/villa-alecrim/pedido", corpo: PEDIDO, origem: "", ip: "", env: ENV }, b.buscar);
    assert.equal(r.status, status, erro);
    if (erro === "dados") assert.equal(r.corpo.campo, "whatsapp");
    assert.equal(b.chamadas.length, 1, "sem aviso quando não gravou");
  }
});

test("pedido: sem Origin, o domínio não confere; corpo que não é objeto, 400", async () => {
  assert.equal(dominioDe(""), "sem-origem");
  assert.equal(dominioDe("https://Villa.Teste:443"), "villa.teste");
  const b = bancoFalso(() => ({ json: { ok: false, erro: "dominio" } }));
  for (const corpo of [null, [], "texto", Symbol.for("invalido")]) {
    const r = await pedido({ metodo: "POST", caminho: "/api/publico/agenda/villa-alecrim/pedido", corpo, origem: "", ip: "", env: ENV }, b.buscar);
    assert.equal(r.status, 400);
  }
  assert.equal((await pedido({ metodo: "GET", caminho: "/api/publico/agenda/villa-alecrim/pedido", env: ENV })).status, 405);
});

test("endereço embaralhado: muda por dia e por site, e não dá para voltar ao original", () => {
  const a = enderecoEmbaralhado("200.1.2.3", "villa-alecrim", new Date("2026-10-29T10:00:00Z"));
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.equal(a, enderecoEmbaralhado("200.1.2.3", "villa-alecrim", new Date("2026-10-29T23:00:00Z")));
  assert.notEqual(a, enderecoEmbaralhado("200.1.2.3", "villa-alecrim", new Date("2026-10-30T10:00:00Z")));
  assert.notEqual(a, enderecoEmbaralhado("200.1.2.3", "outro-site", new Date("2026-10-29T10:00:00Z")));
});

test("saúde: 200 quando o banco responde, 503 quando não", async () => {
  assert.equal((await saude({ metodo: "GET", env: ENV }, bancoFalso(() => ({ json: null })).buscar)).status, 200);
  assert.equal((await saude({ metodo: "GET", env: ENV }, bancoFalso(() => new Error("x")).buscar)).status, 503);
});

test("adaptar: lê o corpo do (req, res), devolve JSON e esconde o erro interno", async () => {
  const { Readable } = await import("node:stream");
  const req = Object.assign(Readable.from([Buffer.from('{"a":1}')]), { method: "POST", url: "/api/x?y=1", headers: { origin: "https://v.teste", "x-forwarded-for": "9.9.9.9, 10.0.0.1" } });
  let visto;
  const res = { statusCode: 0, cabecalhos: {}, setHeader(k, v) { this.cabecalhos[k] = v; }, end(t) { this.texto = t; } };
  await adaptar(async d => { visto = d; return resposta(201, { ok: true }, { "X-A": "1" }); })(req, res, ENV);
  assert.deepEqual(visto.corpo, { a: 1 });
  assert.equal(visto.ip, "9.9.9.9");
  assert.equal(visto.origem, "https://v.teste");
  assert.equal(visto.busca.get("y"), "1");
  assert.equal(res.statusCode, 201);
  assert.equal(res.texto, '{"ok":true}');
  const res2 = { statusCode: 0, cabecalhos: {}, setHeader(k, v) { this.cabecalhos[k] = v; }, end(t) { this.texto = t; } };
  await adaptar(async () => { throw new Error("segredo interno"); })({ method: "GET", url: "/", headers: {} }, res2, ENV);
  assert.equal(res2.statusCode, 502);
  assert.ok(!res2.texto.includes("segredo"));
});

// ---------- Meu site (Missão 4C) ----------
import { tratar as site } from "../api/publico/site/[codigo]/index.js";
import { tratar as previa } from "../api/publico/site/[codigo]/previa.js";
import { tratar as imagem } from "../api/publico/imagens/[conta]/[arquivo].js";

test("site: a versão publicada com CORS e 60 s de cache; 404 quando não responde, com o mesmo cache", async () => {
  const b = bancoFalso(() => ({ json: { esquema: 1, site: "villa-alecrim", versao: 3, secoes: {} } }));
  const r = await site({ metodo: "GET", caminho: "/api/publico/site/villa-alecrim", env: ENV }, b.buscar);
  assert.equal(r.status, 200);
  assert.equal(r.corpo.versao, 3);
  assert.equal(r.cabecalhos["Access-Control-Allow-Origin"], "*");
  assert.match(r.cabecalhos["Cache-Control"], /^public, max-age=0, s-maxage=1$/);
  assert.deepEqual(b.chamadas[0].corpo, { p_codigo: "villa-alecrim" });
  const nulo = await site({ metodo: "GET", caminho: "/api/publico/site/villa-alecrim", env: ENV }, bancoFalso(() => ({ json: null })).buscar);
  assert.equal(nulo.status, 404);
  assert.equal((await site({ metodo: "GET", caminho: "/api/publico/site/Villa!", env: ENV })).status, 400);
});

test("prévia: só com o código da prévia, sem cache", async () => {
  const b = bancoFalso(() => ({ json: { esquema: 1, site: "villa-alecrim", versao: 4, secoes: {} } }));
  const ok = await previa({ metodo: "GET", caminho: "/api/publico/site/villa-alecrim/previa", busca: new URLSearchParams("t=abc123def456ghi789"), env: ENV }, b.buscar);
  assert.equal(ok.status, 200);
  assert.equal(ok.cabecalhos["Cache-Control"], "no-store");
  assert.deepEqual(b.chamadas[0].corpo, { p_codigo: "villa-alecrim", p_previa: "abc123def456ghi789" });
  assert.equal((await previa({ metodo: "GET", caminho: "/api/publico/site/villa-alecrim/previa", busca: new URLSearchParams("t=CURTO"), env: ENV })).status, 400);
  assert.equal((await previa({ metodo: "GET", caminho: "/api/publico/site/villa-alecrim/previa", busca: new URLSearchParams("t=abc123def456ghi789"), env: ENV }, bancoFalso(() => ({ json: null })).buscar)).status, 404);
});

test("imagens: só .webp da pasta de uma conta, do Storage do projeto, com cache de 1 ano", async () => {
  const chamadas = [];
  const buscar = async url => { chamadas.push(url); return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([82, 73, 70, 70]).buffer }; };
  const conta = "0d6f2c4e-1111-4222-8333-944445555666";
  const r = await imagem({ metodo: "GET", caminho: `/api/publico/imagens/${conta}/topo-1a2b.webp`, env: ENV }, buscar);
  assert.equal(r.status, 200);
  assert.equal(r.cabecalhos["Content-Type"], "image/webp");
  assert.match(r.cabecalhos["Cache-Control"], /max-age=31536000, immutable/);
  assert.equal(chamadas[0], `${ENV.SUPABASE_URL}/storage/v1/object/public/site-imagens/${conta}/topo-1a2b.webp`);
  for (const c of [`/api/publico/imagens/${conta}/x.png`, `/api/publico/imagens/${conta}/../segredo.webp`, "/api/publico/imagens/outra-pasta/x.webp", `/api/publico/imagens/${conta}/a/b.webp`]) {
    assert.equal((await imagem({ metodo: "GET", caminho: c, env: ENV }, buscar)).status, 404, c);
  }
  assert.equal(chamadas.length, 1, "caminho estranho nem chega ao Storage");
  const fora = await imagem({ metodo: "GET", caminho: `/api/publico/imagens/${conta}/nao.webp`, env: ENV }, async () => ({ ok: false, status: 400 }));
  assert.equal(fora.status, 404);
});

// ---------- os indicadores do site (a contagem de visitas) ----------
import { tratar as visita, aparelho } from "../api/publico/site/[codigo]/visita.js";

test("visita: conta pelo banco com o aparelho embaralhado, responde sempre 204 e robô não chega ao banco", async () => {
  const CELULAR = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
  const agora = new Date("2026-11-16T15:00:00Z");
  const b = bancoFalso(() => ({ json: true }));
  const pedir = extra => visita({ metodo: "POST", caminho: "/api/publico/site/villa-alecrim/visita", origem: "https://villa-alecrim.teste", ip: "203.0.113.7", agente: CELULAR, env: ENV,
    corpo: { v: "abcdefgh12345678", p: "/", t: "celular", s: 12, se: { inicio: 12 }, c: { whatsapp: 1 }, nome: "não entra", ip: "nem isto" }, ...extra }, b.buscar, agora);
  const r = await pedir();
  assert.equal(r.status, 204);
  assert.equal(r.corpo, null);
  assert.equal(r.cabecalhos["Access-Control-Allow-Origin"], "*");
  assert.equal(r.cabecalhos["Cache-Control"], "no-store");
  assert.equal(b.chamadas.length, 1);
  assert.match(b.chamadas[0].url, /\/rest\/v1\/rpc\/publico_visita$/);
  assert.deepEqual(b.chamadas[0].corpo, {
    p_codigo: "villa-alecrim", p_dominio: "villa-alecrim.teste", p_aparelho: aparelho("203.0.113.7", CELULAR, "villa-alecrim", agora),
    p_dados: { v: "abcdefgh12345678", p: "/", t: "celular", s: 12, se: { inicio: 12 }, c: { whatsapp: 1 } },
  }, "só os campos da contagem vão ao banco; o endereço e o navegador, só embaralhados");
  assert.doesNotMatch(JSON.stringify(b.chamadas[0].corpo), /203\.0\.113\.7|iPhone/);

  // o que não conta: robô, sem navegador, corpo que não é objeto, código fora do formato; e nada disso vira erro
  for (const extra of [{ agente: "Mozilla/5.0 (compatible; Googlebot/2.1)" }, { agente: "HeadlessChrome/126" }, { agente: "" }, { corpo: Symbol.for("invalido") }, { corpo: [1] }, { caminho: "/api/publico/site/X!/visita" }]) {
    assert.equal((await pedir(extra)).status, 204);
  }
  assert.equal(b.chamadas.length, 1, "nenhum deles chegou ao banco");
  const fora = bancoFalso(() => new Error("fora do ar"));
  assert.equal((await visita({ metodo: "POST", caminho: "/api/publico/site/villa-alecrim/visita", origem: "", ip: "", agente: CELULAR, corpo: {}, env: ENV }, fora.buscar)).status, 204, "banco fora: o site nem percebe");
  assert.equal((await visita({ metodo: "GET", caminho: "/api/publico/site/villa-alecrim/visita", env: ENV }, b.buscar)).status, 405);
  assert.equal((await visita({ metodo: "OPTIONS", caminho: "/api/publico/site/villa-alecrim/visita", env: ENV }, b.buscar)).status, 204);
});

test("visita: o aparelho é o mesmo no dia (o de São Paulo) e outro no dia seguinte, em outro site ou em outro navegador", () => {
  const a = (ip, ua, site, quando) => aparelho(ip, ua, site, new Date(quando));
  const base = a("203.0.113.7", "Safari", "villa-alecrim", "2026-11-16T15:00:00Z");
  assert.match(base, /^[0-9a-f]{32}$/);
  assert.equal(a("203.0.113.7", "Safari", "villa-alecrim", "2026-11-17T02:30:00Z"), base, "23h30 em São Paulo ainda é o mesmo dia");
  assert.notEqual(a("203.0.113.7", "Safari", "villa-alecrim", "2026-11-17T03:30:00Z"), base, "no dia seguinte, outro valor: ninguém é seguido");
  assert.notEqual(a("203.0.113.7", "Safari", "outro-site", "2026-11-16T15:00:00Z"), base);
  assert.notEqual(a("203.0.113.7", "Chrome", "villa-alecrim", "2026-11-16T15:00:00Z"), base);
  assert.notEqual(a("203.0.113.8", "Safari", "villa-alecrim", "2026-11-16T15:00:00Z"), base);
});

import { tratar as estoque } from "../api/publico/estoque/[codigo]/index.js";

test("estoque: só o disponível e o reservado, com as fotos pelo endereço da API e o mesmo cache do site; 404 quando não responde", async () => {
  const conta = "0b6c3f2e-1111-4222-8333-944455556666";
  const b = bancoFalso(() => ({ json: { versao: 1, esquema: "automotivo", atualizado_em: "2026-11-24T18:00:00Z", itens: [
    { id: "a", situacao: "disponivel", destaque: true, preco: 189900, preco_antes: null, quantidade: 1, selos: ["Blindado"], descricao: "", campos: { marca: "Aurora" }, codigo_interno: "ABC1D23",
      fotos: [{ arquivo: conta + "/estoque-aaaaaa11.webp", mini: conta + "/estoque-aaaaaa11-m.webp", w: 1600, h: 1067 }, { arquivo: "../fora.webp", w: 1, h: 1 }] },
    { id: "b", situacao: "reservado", preco: null, campos: { marca: "Aurora" }, fotos: [{ arquivo: conta + "/estoque-bbbbbb22.webp", w: 800, h: 600 }] },
    { id: "c", situacao: "oculto", campos: {} },
  ] } }));
  const r = await estoque({ metodo: "GET", caminho: "/api/publico/estoque/garagem-aurora", env: ENV }, b.buscar);
  assert.equal(r.status, 200);
  assert.deepEqual(b.chamadas[0].corpo, { p_codigo: "garagem-aurora" });
  assert.match(b.chamadas[0].url, /\/rest\/v1\/rpc\/publico_estoque$/);
  assert.equal(r.cabecalhos["Access-Control-Allow-Origin"], "*");
  assert.equal(r.cabecalhos["Cache-Control"], "public, max-age=0, s-maxage=1", "o estoque aparece na hora: 1 s na rede");
  assert.deepEqual(r.corpo.itens.map(i => i.id), ["a", "b"], "o oculto não passa nem se o banco mandar");
  assert.equal(JSON.stringify(r.corpo).includes("ABC1D23"), false, "o código interno nunca sai");
  assert.deepEqual(r.corpo.itens[0].fotos, [{ url: "/api/publico/imagens/" + conta + "/estoque-aaaaaa11.webp", mini: "/api/publico/imagens/" + conta + "/estoque-aaaaaa11-m.webp", w: 1600, h: 1067 }]);
  assert.equal(r.corpo.itens[1].fotos[0].mini, r.corpo.itens[1].fotos[0].url, "sem a pequena, vai a grande");
  assert.equal(r.corpo.itens[1].preco, null);
  const nulo = await estoque({ metodo: "GET", caminho: "/api/publico/estoque/garagem-aurora", env: ENV }, bancoFalso(() => ({ json: null })).buscar);
  assert.equal(nulo.status, 404);
  assert.match(nulo.cabecalhos["Cache-Control"], /s-maxage=1$/);
  assert.equal((await estoque({ metodo: "GET", caminho: "/api/publico/estoque/Garagem!", env: ENV })).status, 400);
  assert.equal((await estoque({ metodo: "POST", caminho: "/api/publico/estoque/garagem-aurora", env: ENV })).status, 405);
  assert.equal((await estoque({ metodo: "OPTIONS", caminho: "/api/publico/estoque/garagem-aurora", env: ENV })).status, 204);
});
