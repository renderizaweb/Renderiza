// Prazo das demos: a trava do site (middleware.js) e as regras que o painel mostra.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import middleware, { config, pastaDoCaminho, demoLiberada, paginaForaDoAr } from "../middleware.js";
import { pastaDaDemo, hojeEmBrasilia, somarDias, situacaoDaDemo, reabilitar } from "../painel/src/demos.js";
import site from "../site/config.mjs";

const resposta = (corpo, status = 200) => ({ ok: status < 400, status, json: async () => corpo });

test("a trava só olha /demo/<pasta>", () => {
  assert.deepEqual(config.matcher, ["/demo/:path*"]);
  assert.equal(pastaDoCaminho("/demo/otica-sales"), "otica-sales");
  assert.equal(pastaDoCaminho("/demo/otica-sales/"), "otica-sales");
  assert.equal(pastaDoCaminho("/demo/oticas-supreme/artes-instagram"), "oticas-supreme");
  assert.equal(pastaDoCaminho("/demo/Otica-Nina.html"), "otica-nina");
  assert.equal(pastaDoCaminho("/demo"), "");
  assert.equal(pastaDoCaminho("/demo/"), "");
  assert.equal(pastaDoCaminho("/demo/../painel"), "");
  assert.equal(pastaDoCaminho("/painel"), "");
});

test("pergunta ao Supabase e, na dúvida, deixa abrir", async () => {
  let pedido;
  const buscar = async (url, op) => { pedido = { url, ...op }; return resposta(false); };
  assert.equal(await demoLiberada("otica-sales", { url: "https://x.supabase.co/", chave: "sb_publishable_abc", buscar }), false);
  assert.equal(pedido.url, "https://x.supabase.co/rest/v1/rpc/demo_liberada");
  assert.equal(pedido.method, "POST");
  assert.deepEqual(JSON.parse(pedido.body), { pasta: "otica-sales" });
  assert.equal(pedido.headers.apikey, "sb_publishable_abc");
  assert.equal(pedido.headers.Authorization, undefined, "chave nova não vai como Bearer");
  await demoLiberada("x", { url: "https://x.supabase.co", chave: "aaa.bbb.ccc", buscar });
  assert.equal(pedido.headers.Authorization, "Bearer aaa.bbb.ccc", "chave antiga (JWT) vai como Bearer");

  const op = { url: "https://x.supabase.co", chave: "k" };
  assert.equal(await demoLiberada("x", { ...op, buscar: async () => resposta(true) }), true);
  assert.equal(await demoLiberada("x", { ...op, buscar: async () => resposta({ erro: 1 }, 500) }), null);
  assert.equal(await demoLiberada("x", { ...op, buscar: async () => resposta("sim") }), null);
  assert.equal(await demoLiberada("x", { ...op, buscar: async () => { throw new Error("rede"); } }), null);
  // Banco que não responde: o relógio do AbortSignal.timeout não segura o processo, então um setTimeout segura.
  const lento = (_u, { signal }) => new Promise((_r, falhar) => {
    const segura = setTimeout(() => {}, 5000);
    signal.addEventListener("abort", () => { clearTimeout(segura); falhar(signal.reason); });
  });
  assert.equal(await demoLiberada("x", { ...op, buscar: lento, tempo: 20 }), null);
});

test("demo fora do ar responde 410 com a página de aviso; no ar ou na dúvida, segue", async () => {
  const fetchOriginal = globalThis.fetch;
  const envOriginal = { ...process.env };
  try {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_ANON_KEY = "sb_publishable_abc";
    let consultas = 0;
    let liberada = false;
    globalThis.fetch = async () => { consultas++; return resposta(liberada); };

    const fora = await middleware(new Request("https://www.renderizaweb.com.br/demo/otica-sales"));
    assert.equal(fora.status, 410);
    assert.equal(fora.headers.get("cache-control"), "no-store");
    assert.equal(fora.headers.get("x-robots-tag"), "noindex, nofollow");
    assert.match(await fora.text(), /saiu do ar/);
    assert.equal((await middleware(new Request("https://x/demo/otica-sales", { method: "HEAD" }))).body, null);

    liberada = true;
    assert.equal(await middleware(new Request("https://x/demo/otica-sales")), undefined);
    globalThis.fetch = async () => { throw new Error("banco fora"); };
    assert.equal(await middleware(new Request("https://x/demo/otica-sales")), undefined);

    const antes = consultas;
    assert.equal(await middleware(new Request("https://x/painel")), undefined);
    assert.equal(consultas, antes, "fora de /demo/ nem consulta");

    delete process.env.SUPABASE_URL;
    globalThis.fetch = async () => resposta(false);
    assert.equal(await middleware(new Request("https://x/demo/otica-sales")), undefined, "sem configuração, abre");
  } finally {
    globalThis.fetch = fetchOriginal;
    for (const k of Object.keys(process.env)) if (!(k in envOriginal)) delete process.env[k];
    Object.assign(process.env, envOriginal);
  }
});

test("a página de demo fora do ar chama a Renderiza no WhatsApp e não entra no Google", () => {
  const html = paginaForaDoAr();
  assert.match(html, new RegExp(`https://wa\\.me/${site.contato.whatsapp}\\?text=`));
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<meta name="viewport"/);
});

test("painel: pasta da demo a partir do link do lead", () => {
  assert.equal(pastaDaDemo("/demo/otica-sales"), "otica-sales");
  assert.equal(pastaDaDemo("renderizaweb.com.br/demo/otica-nina"), "otica-nina");
  assert.equal(pastaDaDemo("https://www.renderizaweb.com.br/demo/oticas-supreme/artes-instagram"), "oticas-supreme");
  assert.equal(pastaDaDemo("/demo/Otica-Dois"), "otica-dois");
  assert.equal(pastaDaDemo("https://outro-site.com/x"), "");
  assert.equal(pastaDaDemo(""), "");
});

test("painel: prazo em dias de Brasília", () => {
  assert.equal(hojeEmBrasilia(new Date("2026-10-07T02:30:00Z")), "2026-10-06", "23h30 em Brasília ainda é dia 6");
  assert.equal(hojeEmBrasilia(new Date("2026-10-07T03:00:00Z")), "2026-10-07");
  assert.equal(somarDias("2026-10-06", 7), "2026-10-13");
  assert.equal(somarDias("2026-12-28", 7), "2027-01-04");
  assert.deepEqual(reabilitar("2026-10-20"), { no_ar: true, vale_ate: "2026-10-27" });
});

test("painel: situação da demo (as mesmas regras do banco)", () => {
  const hoje = "2026-10-06";
  assert.equal(situacaoDaDemo(null, hoje).estado, "sem_controle");
  assert.equal(situacaoDaDemo(null, hoje).noAr, true);
  const no = situacaoDaDemo({ no_ar: true, vale_ate: "2026-10-13" }, hoje);
  assert.equal(no.estado, "no_ar");
  assert.match(no.texto, /13\/10 \(faltam 7 dias\)/);
  assert.match(situacaoDaDemo({ no_ar: true, vale_ate: "2026-10-07" }, hoje).texto, /falta 1 dia/);
  assert.equal(situacaoDaDemo({ no_ar: true, vale_ate: hoje }, hoje).estado, "ultimo_dia");
  assert.equal(situacaoDaDemo({ no_ar: true, vale_ate: hoje }, hoje).noAr, true);
  const vencida = situacaoDaDemo({ no_ar: true, vale_ate: "2026-10-05" }, hoje);
  assert.equal(vencida.estado, "expirada");
  assert.equal(vencida.noAr, false);
  assert.equal(situacaoDaDemo({ no_ar: true, vale_ate: null }, hoje).estado, "sem_prazo");
  assert.equal(situacaoDaDemo({ no_ar: false, vale_ate: "2026-12-31" }, hoje).estado, "fora");
  assert.equal(situacaoDaDemo({ no_ar: false, vale_ate: "2026-12-31" }, hoje).noAr, false);
});
