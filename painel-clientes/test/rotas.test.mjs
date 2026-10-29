import { test } from "node:test";
import assert from "node:assert/strict";
import { lerRota, caminhoDe, decidir, voltaSegura } from "../src/rotas.js";
import { MODULOS } from "../src/modulos/index.js";
import { AREAS_ADMIN } from "../src/admin/index.js";

test("lê as rotas do app", () => {
  assert.deepEqual(lerRota("/"), { tipo: "modulo", id: "inicio" });
  assert.deepEqual(lerRota("/agenda"), { tipo: "modulo", id: "agenda" });
  assert.deepEqual(lerRota("/agenda/"), { tipo: "modulo", id: "agenda" });
  assert.deepEqual(lerRota("/meu-site"), { tipo: "modulo", id: "meu-site" });
  assert.deepEqual(lerRota("/entrar"), { tipo: "tela", id: "entrar" });
  assert.deepEqual(lerRota("/admin"), { tipo: "admin", id: "contas" });
  assert.deepEqual(lerRota("/admin/pagamentos"), { tipo: "admin", id: "pagamentos" });
});

test("o que não existe é página não encontrada", () => {
  for (const c of ["/inicio", "/xyz", "/agenda/semana/2", "/admin/xyz", "/entrar/de-novo", "/admin/contas/1/2"]) {
    assert.equal(lerRota(c).tipo, "nao-encontrada", c);
  }
});

test("toda rota do registro vai e volta pelo mesmo caminho", () => {
  for (const m of MODULOS) assert.deepEqual(lerRota(caminhoDe({ tipo: "modulo", id: m.id })), { tipo: "modulo", id: m.id });
  for (const a of AREAS_ADMIN) assert.deepEqual(lerRota(caminhoDe({ tipo: "admin", id: a.id })), { tipo: "admin", id: a.id });
  assert.equal(caminhoDe({ tipo: "tela", id: "entrar" }), "/entrar");
});

test("sem login, tudo leva ao /entrar guardando para onde ia", () => {
  assert.deepEqual(decidir({ caminho: "/", logado: false }), { redirecionar: "/entrar" });
  assert.deepEqual(decidir({ caminho: "/financeiro", logado: false }), { redirecionar: "/entrar?volta=%2Ffinanceiro" });
  assert.deepEqual(decidir({ caminho: "/admin/contas", logado: false }), { redirecionar: "/entrar?volta=%2Fadmin%2Fcontas" });
  assert.deepEqual(decidir({ caminho: "/xyz", logado: false }), { redirecionar: "/entrar" });
  assert.deepEqual(decidir({ caminho: "/entrar", logado: false }), { rota: { tipo: "tela", id: "entrar" } });
});

test("logado, o /entrar volta para onde a pessoa ia (só dentro do painel)", () => {
  assert.deepEqual(decidir({ caminho: "/entrar", busca: "?volta=%2Ffinanceiro", logado: true }), { redirecionar: "/financeiro" });
  assert.deepEqual(decidir({ caminho: "/entrar", logado: true }), { redirecionar: "/" });
  assert.deepEqual(decidir({ caminho: "/entrar", busca: "?volta=https://golpe.com", logado: true }), { redirecionar: "/" });
  assert.deepEqual(decidir({ caminho: "/entrar", busca: "?volta=//golpe.com", logado: true }), { redirecionar: "/" });
  assert.deepEqual(decidir({ caminho: "/agenda", logado: true }), { rota: { tipo: "modulo", id: "agenda" } });
});

test("voltaSegura recusa endereço de fora", () => {
  assert.equal(voltaSegura("/agenda?dia=2"), "/agenda?dia=2");
  for (const v of ["", null, "agenda", "//x.com", "/\\x.com", "https://x.com", "javascript:alert(1)"]) assert.equal(voltaSegura(v), "/", String(v));
});
