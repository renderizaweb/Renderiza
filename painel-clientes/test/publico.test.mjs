// A API pública (api/publico/): o que os sites dos clientes chamam. O banco é imitado (a função fetch), então aqui
// se testa o que a API faz antes e depois do banco: CORS, cache, códigos, campo-isca, tempo mínimo, domínio,
// endereço embaralhado e o aviso. As regras do banco estão em supabase/testes/040_publico_agenda.sql.
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
import { tratar as imagem } from "../api/publico/imagens/[...caminho].js";

test("site: a versão publicada com CORS e 60 s de cache; 404 quando não responde, com o mesmo cache", async () => {
  const b = bancoFalso(() => ({ json: { esquema: 1, site: "villa-alecrim", versao: 3, secoes: {} } }));
  const r = await site({ metodo: "GET", caminho: "/api/publico/site/villa-alecrim", env: ENV }, b.buscar);
  assert.equal(r.status, 200);
  assert.equal(r.corpo.versao, 3);
  assert.equal(r.cabecalhos["Access-Control-Allow-Origin"], "*");
  assert.match(r.cabecalhos["Cache-Control"], /s-maxage=60/);
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
