// O esqueleto da Missão 1: todos os módulos e o Admin registrados, cada um com a sua pasta e um `montar`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { MODULOS } from "../src/modulos/index.js";
import { AREAS_ADMIN } from "../src/admin/index.js";

const pasta = new URL("../", import.meta.url);

test("todos os módulos do 04 estão registrados", () => {
  const ids = MODULOS.map(m => m.id).sort();
  assert.deepEqual(ids, ["agenda", "atendimento", "clientes", "configuracoes", "contratos", "equipe", "financeiro", "inicio", "meu-site", "servicos"]);
  assert.deepEqual(MODULOS.filter(m => m.base).map(m => m.id).sort(), ["configuracoes", "equipe", "inicio", "servicos"]);
});

test("todas as partes do Admin estão registradas", () => {
  assert.deepEqual(AREAS_ADMIN.map(a => a.id), ["contas", "modulos", "pessoas", "pagamentos", "indicadores"]);
});

test("cada módulo e cada parte do Admin carrega e tem montar()", async () => {
  for (const item of [...MODULOS, ...AREAS_ADMIN]) {
    const mod = await item.carregar();
    assert.equal(typeof mod.montar, "function", item.id);
  }
});

test("ids únicos e caminhos seguros", () => {
  const ids = MODULOS.map(m => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [...ids, ...AREAS_ADMIN.map(a => a.id)]) assert.match(id, /^[a-z][a-z-]*$/);
  assert.ok(!ids.includes("admin") && !ids.includes("entrar"), "módulo não pode tomar o caminho do Admin ou do login");
});

test("vercel.json: sem build, fora do Google, sem iframe e com CSP", () => {
  const v = JSON.parse(readFileSync(new URL("vercel.json", pasta), "utf8"));
  assert.equal(v.framework, null);
  assert.equal(v.buildCommand, "");
  const todos = v.headers.find(h => h.source === "/(.*)").headers;
  const valor = k => (todos.find(h => h.key === k) || {}).value || "";
  assert.equal(valor("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(valor("X-Frame-Options"), "DENY");
  assert.match(valor("Content-Security-Policy"), /frame-ancestors 'none'/);
  assert.match(valor("Content-Security-Policy"), /script-src 'self' https:\/\/cdn\.jsdelivr\.net;/);
  assert.match(valor("Content-Security-Policy"), /connect-src 'self' https:\/\/\*\.supabase\.co wss:\/\/\*\.supabase\.co;/);
  assert.ok(v.rewrites.some(r => r.destination === "/index.html"));
});

// Na Vercel, o ignoreCommand saindo com 0 pula o deploy; com qualquer outro código, faz o build.
test("vercel.json: pula o deploy só se a pasta não mudou desde o último deploy", () => {
  const { ignoreCommand } = JSON.parse(readFileSync(new URL("vercel.json", pasta), "utf8"));
  const repo = mkdtempSync(join(tmpdir(), "painel-ignore-"));
  try {
    const git = (...a) => execFileSync("git", ["-c", "user.name=Teste", "-c", "user.email=teste@example.com", "-c", "commit.gpgsign=false", ...a], { cwd: repo, encoding: "utf8" }).trim();
    const commit = (arquivo, texto) => {
      mkdirSync(join(repo, dirname(arquivo)), { recursive: true });
      writeFileSync(join(repo, arquivo), texto);
      git("add", "-A");
      git("commit", "-q", "-m", arquivo);
      return git("rev-parse", "HEAD");
    };
    git("init", "-q");
    const inicio = commit("painel-clientes/index.html", "1");
    const painelMudou = commit("painel-clientes/index.html", "2");
    commit("docs/painel-clientes/missoes.md", "só documento");
    const codigo = anterior => spawnSync("sh", ["-c", ignoreCommand], { cwd: join(repo, "painel-clientes"), env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: anterior } }).status;
    assert.equal(codigo(painelMudou), 0, "depois do último deploy só mudou documento: pula");
    assert.notEqual(codigo(inicio), 0, "a pasta mudou num commit antes do último: faz o build");
    assert.notEqual(codigo(""), 0, "sem deploy anterior na branch: faz o build");
    assert.notEqual(codigo("0123456789abcdef0123456789abcdef01234567"), 0, "SHA fora do clone (erro do git): faz o build");
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("o index.html não tem script embutido (a CSP bloquearia)", () => {
  const html = readFileSync(new URL("index.html", pasta), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length >= 1);
  for (const s of scripts) assert.equal(s[1].trim(), "", "script embutido: " + s[0].slice(0, 60));
  assert.doesNotMatch(html, /\son[a-z]+=/i, "atributo on…= embutido");
  for (const arq of ["src/app.js", "src/telas/entrar.js"]) assert.doesNotMatch(readFileSync(new URL(arq, pasta), "utf8"), /\son[a-z]+="/i, arq);
});

test("nenhuma chave nem URL de projeto no código do app", () => {
  for (const arq of ["index.html", "src/app.js", "src/adaptadores/supabase.js", "src/sessao.js", "src/telas/entrar.js", "api/config.js"]) {
    const txt = readFileSync(new URL(arq, pasta), "utf8");
    assert.doesNotMatch(txt, /sb_(publishable|secret)_[A-Za-z0-9]/, arq);
    assert.doesNotMatch(txt, /sbp_[A-Za-z0-9]/, arq);
    assert.doesNotMatch(txt, /eyJ[A-Za-z0-9_-]{20,}/, arq);
    assert.doesNotMatch(txt, /(hxzsiiqhlqxuqkevskwb|qxcxllhmtodsptxffbhx|[a-z0-9]{20}\.supabase\.co)/, arq);
  }
  assert.ok(existsSync(new URL(".vercelignore", pasta)));
});
