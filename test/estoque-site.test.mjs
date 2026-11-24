// O Estoque no site (ferramentas/estoque/estoque.js; docs/painel-clientes/12-modulo-estoque.md, "Contrato v1", item 3):
// a resposta conferida, o script num navegador imitado (resposta boa, 404, demora, fora do contrato, guardada na sessão),
// o virar-site com "estoque": true e a conferência que não deixa o Meu site marcar a vitrine. Sem rede.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { conferirHtml } from "../scripts/conferir-site.mjs";

const simples = x => JSON.parse(JSON.stringify(x));
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = fs.readFileSync(path.join(RAIZ, "ferramentas", "estoque", "estoque.js"), "utf8");
const API = "https://painel.renderizaweb.com.br";
const CONTA = "0b6c3f2e-1111-4222-8333-944455556666";
const foto = n => ({ url: `/api/publico/imagens/${CONTA}/estoque-abc12${n}.webp`, mini: `/api/publico/imagens/${CONTA}/estoque-abc12${n}-m.webp`, w: 1600, h: 1067 });
const RESPOSTA = { versao: 1, esquema: "automotivo", atualizado_em: "2026-11-24T18:00:00Z", itens: [
  { id: "a", situacao: "disponivel", destaque: true, preco: 689900, preco_antes: null, quantidade: 1, selos: ["Blindado"], descricao: "", campos: { marca: "Porsche" }, fotos: [foto(1), { url: "https://outro.site/x.webp" }] },
  { id: "b", situacao: "reservado", preco: null, campos: { marca: "BMW" }, fotos: [] },
] };

/** Roda o script num navegador imitado. Devolve o que o site recebeu e quantas vezes a API foi chamada. */
async function rodar({ resposta = { status: 200, corpo: RESPOSTA }, guardado = null, atributos = { "data-estoque": "ricardo-motors" }, espera = 30 } = {}) {
  const recebidos = [], pedidos = [];
  const sessao = new Map(guardado ? [["rz-estoque:ricardo-motors", JSON.stringify({ t: Date.now(), r: guardado })]] : []);
  const janela = {
    document: { readyState: "complete", currentScript: { getAttribute: a => atributos[a] ?? null }, addEventListener() {} },
    location: { search: "" },
    sessionStorage: { getItem: k => sessao.get(k) ?? null, setItem: (k, v) => sessao.set(k, v), removeItem: k => sessao.delete(k) },
    fetch: async (url, op) => {
      pedidos.push(url);
      if (resposta === "demora") return new Promise((_, falhar) => op.signal.addEventListener("abort", () => falhar(new Error("abort"))));
      if (resposta.erro) throw new Error("rede");
      return { status: resposta.status, ok: resposta.status < 400, json: async () => (typeof resposta.corpo === "string" ? JSON.parse(resposta.corpo) : resposta.corpo) };
    },
    AbortController, URL, Promise, JSON, Date, Array, Object, setTimeout: (f, ms) => setTimeout(f, Math.min(ms, 50)),
    rzEstoque: (itens, info) => recebidos.push(simples({ itens, info })),
  };
  janela.parent = janela;
  janela.window = janela;
  vm.runInNewContext(FONTE, janela);
  await new Promise(r => setTimeout(r, espera));
  return { recebidos, pedidos, sessao };
}

test("a resposta conferida: fotos no endereço inteiro da API, foto de fora sai, fora do contrato é nada", () => {
  const { conferir } = vm.runInNewContext(FONTE + ";RZ_ESTOQUE", { URL, JSON, Array, Object, document: undefined });
  const d = simples(conferir(RESPOSTA, API));
  assert.equal(d.itens.length, 2);
  assert.deepEqual(d.itens[0].fotos, [{ url: API + foto(1).url, mini: API + foto(1).mini, w: 1600, h: 1067 }]);
  assert.equal(d.itens[1].preco, null);
  assert.equal(d.info.esquema, "automotivo");
  assert.equal(conferir({ ...RESPOSTA, versao: 2 }, API), null, "versão desconhecida");
  assert.equal(conferir({ ...RESPOSTA, itens: [{ ...RESPOSTA.itens[0], situacao: "vendido" }] }, API), null, "vendido nunca chega ao site");
  assert.equal(conferir({ ...RESPOSTA, itens: Array.from({ length: 301 }, (_, k) => ({ id: "x" + k, situacao: "disponivel" })) }, API), null, "mais de 300");
  assert.equal(simples(conferir({ ...RESPOSTA, itens: [{ ...RESPOSTA.itens[0], preco: "689900" }] }, API)).itens[0].preco, null, "preço que não é número vira sob consulta");
});

test("o script entrega ao site a lista do painel e guarda na sessão; a próxima página não pede de novo", async () => {
  const r = await rodar();
  assert.deepEqual(r.pedidos, ["https://painel.renderizaweb.com.br/api/publico/estoque/ricardo-motors"]);
  assert.equal(r.recebidos.length, 1);
  assert.deepEqual(r.recebidos[0].itens.map(i => i.id), ["a", "b"]);
  const guardado = JSON.parse(r.sessao.get("rz-estoque:ricardo-motors")).r;
  const outra = await rodar({ guardado });
  assert.deepEqual(outra.pedidos, [], "veio da sessão");
  assert.equal(outra.recebidos.length, 1);
});

test("404, erro, demora ou resposta fora do contrato: o site fica com a versão de reserva (nada é chamado)", async () => {
  for (const resposta of [{ status: 404, corpo: { erro: "fora" } }, { status: 500, corpo: {} }, { erro: true }, { status: 200, corpo: "{}" }, { status: 200, corpo: { versao: 9, itens: [] } }]) {
    const r = await rodar({ resposta });
    assert.equal(r.recebidos.length, 0, JSON.stringify(resposta));
  }
  const lenta = await rodar({ resposta: "demora", espera: 120 });
  assert.equal(lenta.recebidos.length, 0, "demorou: desiste");
  const semCodigo = await rodar({ atributos: { "data-estoque": "Código Ruim" } });
  assert.deepEqual(semCodigo.pedidos, [], "código fora do formato: nem pede");
  const local = await rodar({ atributos: { "data-estoque": "garagem-aurora", "data-api": "http://localhost:5180/api/publico/" } });
  assert.deepEqual(local.pedidos, ["http://localhost:5180/api/publico/estoque/garagem-aurora"]);
  assert.equal(local.recebidos[0].itens[0].fotos[0].url, "http://localhost:5180" + foto(1).url, "a foto vem da API que respondeu");
});

test("o virar-site põe o script do Estoque no <head>, uma vez, com o código; a conferência não deixa o Meu site marcar a vitrine", () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "estoque-site-"));
  const saida = path.join(pasta, "saida");
  fs.writeFileSync(path.join(pasta, "index.html"), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Garagem Aurora</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body><header><h1 data-site="inicio.titulo">Garagem Aurora</h1></header><main><section id="estoque" data-estoque><article class="card"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" alt="Toyota Corolla"><h3>Toyota Corolla</h3><p>Consulte</p></article></section></main></body></html>`);
  fs.writeFileSync(path.join(pasta, "site.json"), JSON.stringify({ dominio: "garagem-aurora.com.br", nome: "Garagem Aurora", corTema: "#141416", favicon: { texto: "GA", cor: "#87672b" }, painel: { codigo: "garagem-aurora", estoque: true } }));
  const r = spawnSync("node", ["scripts/virar-site.mjs", pasta, saida], { cwd: RAIZ, encoding: "utf8" });
  assert.ok(fs.existsSync(path.join(saida, "index.html")), r.stderr || r.stdout);
  const html = fs.readFileSync(path.join(saida, "index.html"), "utf8");
  const cabeca = html.slice(0, html.indexOf("</head>"));
  assert.equal((html.match(/<script data-estoque="garagem-aurora">/g) || []).length, 1);
  assert.ok(cabeca.includes('<script data-estoque="garagem-aurora">'));
  assert.ok(cabeca.includes('<script data-codigo="garagem-aurora">'), "o Meu site continua");
  assert.deepEqual(conferirHtml(html, { dominio: "garagem-aurora.com.br" }).problemas.filter(p => /Estoque/.test(p)), []);
  const errado = html.replace("<h3>Toyota Corolla</h3>", '<h3 data-site="estoque.titulo">Toyota Corolla</h3>');
  assert.equal(conferirHtml(errado, { dominio: "garagem-aurora.com.br" }).problemas.filter(p => /Estoque/.test(p)).length, 1);
  fs.rmSync(pasta, { recursive: true, force: true });
});
