// O design system (src/ui/estilo.css; docs/painel-clientes/10-design-system.md): os tokens que os módulos usam
// existem, a fonte é a da marca e está no painel, e nada depende de fonte ou estilo de fora.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { erroDoLink } from "../src/telas/nova-senha.js";
import { etiquetaDoAmbiente } from "../src/telas/acesso.js";
import { icone, ICONES } from "../src/ui/icones.js";
import { escapar } from "../src/ui/formulario.js";

const pasta = new URL("../", import.meta.url);
const css = readFileSync(new URL("src/ui/estilo.css", pasta), "utf8");
const html = readFileSync(new URL("index.html", pasta), "utf8");

test("os tokens do design system existem", () => {
  for (const token of ["--rz-grafite", "--rz-fundo", "--rz-superficie", "--rz-tinta", "--rz-tinta-2", "--rz-tinta-3", "--rz-linha",
    "--rz-destaque", "--rz-destaque-escuro", "--rz-destaque-claro", "--rz-sucesso", "--rz-alerta", "--rz-perigo", "--rz-info",
    "--rz-fonte", "--rz-t-base", "--rz-4", "--rz-raio", "--rz-sombra-2", "--rz-foco", "--rz-alvo", "--rz-campo", "--rz-rapido", "--rz-curva"]) {
    assert.match(css, new RegExp(token + ":"), token);
  }
});

test("a fonte é a Geist da marca, servida pelo próprio painel", () => {
  assert.match(css, /@font-face\{font-family:"Geist";[^}]*url\(\/src\/ui\/fontes\/geist\.woff2\)/);
  assert.ok(existsSync(new URL("src/ui/fontes/geist.woff2", pasta)));
  assert.ok(existsSync(new URL("src/ui/fontes/OFL-Geist.txt", pasta)), "a licença da fonte vai junto");
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/, "nada de fonte de fora");
  assert.match(html, /<link rel="stylesheet" href="\/src\/ui\/estilo\.css">/);
  assert.doesNotMatch(html, /<style/, "o estilo mora no estilo.css, não no index.html");
});

test("conforto: alvo de 44 px, campos de 16 px e respeito a 'reduzir movimento'", () => {
  assert.match(css, /--rz-alvo:44px/);
  assert.match(css, /\.rz-entrada\{[^}]*font-size:16px/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)/);
});

test("o link vencido do e-mail é reconhecido", () => {
  assert.equal(erroDoLink("#error=access_denied&error_code=otp_expired", ""), "otp_expired");
  assert.equal(erroDoLink("", "?error=access_denied"), "access_denied");
  assert.equal(erroDoLink("#access_token=x&type=recovery", ""), "");
});

test("a etiqueta do ambiente só aparece fora da produção", () => {
  assert.equal(etiquetaDoAmbiente("production"), "");
  assert.equal(etiquetaDoAmbiente(""), "");
  assert.equal(etiquetaDoAmbiente("preview"), "Teste · STG");
  assert.equal(etiquetaDoAmbiente("development"), "Local · STG");
});

test("ícones são decorativos e escapar protege o HTML", () => {
  assert.ok(ICONES.length >= 10);
  assert.match(icone("olho"), /aria-hidden="true"/);
  assert.throws(() => icone("nao-existe"));
  assert.equal(escapar('<b>"a"&</b>'), "&lt;b&gt;&quot;a&quot;&amp;&lt;/b&gt;");
});
