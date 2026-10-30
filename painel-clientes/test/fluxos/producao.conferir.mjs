// Conferência da produção depois de um deploy (Missão 6), SÓ LEITURA: nenhum login, nenhuma gravação. Confere que o
// commit no ar é o esperado, que as páginas abrem sem erro de script (entrar, termos, privacidade, o link de um
// contrato que não existe), os cabeçalhos de segurança e a saúde da API pública.
//
//   npm run conferir-producao              (o commit no ar tem que ser o da main local: git rev-parse origin/main)
//   VERSAO=abc1234 npm run conferir-producao

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { playwright } from "./ambiente.mjs";

const URL_PRODUCAO = process.env.URL_PRODUCAO || "https://painel.renderizaweb.com.br";
const esperada = () => process.env.VERSAO || execFileSync("git", ["rev-parse", "--short=7", "origin/main"], { encoding: "utf8" }).trim();

test("o commit no ar e a configuração pública", async () => {
  const r = await fetch(`${URL_PRODUCAO}/api/config`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control") || "", /no-store/);
  const c = await r.json();
  assert.equal(c.versao, esperada(), "o deploy da Vercel publicou a main");
  assert.doesNotMatch(JSON.stringify(c), /service_role|sb_secret_/, "nenhuma chave secreta no /api/config");
});

test("os cabeçalhos de segurança", async () => {
  const r = await fetch(`${URL_PRODUCAO}/entrar`);
  const h = n => r.headers.get(n) || "";
  assert.match(h("content-security-policy"), /default-src/);
  assert.match(h("strict-transport-security"), /max-age=\d{7,}/);
  assert.equal(h("x-content-type-options"), "nosniff");
  assert.equal(h("x-frame-options"), "DENY");
  assert.match(h("x-robots-tag"), /noindex/);
});

test("a API pública está de pé", async () => {
  const r = await fetch(`${URL_PRODUCAO}/api/publico/saude`);
  assert.equal(r.status, 200);
});

test("as páginas abrem sem erro de script", { skip: playwright() ? false : "sem o Playwright" }, async () => {
  const navegador = await playwright().chromium.launch();
  try {
    const paginas = [
      ["/entrar", /Entrar/],
      ["/termos", /Termos de uso/],
      ["/privacidade", /Política de privacidade/],
      ["/c/naoexiste0123456789abcd", /não|Não/],
    ];
    for (const [caminho, titulo] of paginas) {
      const p = await (await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
      const erros = [];
      p.on("pageerror", e => erros.push(e.message));
      p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erros.push(m.text()); });
      await p.goto(URL_PRODUCAO + caminho, { waitUntil: "networkidle" });
      assert.match(await p.locator("h1").first().innerText(), titulo, caminho);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), false, `${caminho} não rola para o lado`);
      assert.deepEqual(erros, [], caminho);
      await p.context().close();
    }
  } finally { await navegador.close(); }
});
