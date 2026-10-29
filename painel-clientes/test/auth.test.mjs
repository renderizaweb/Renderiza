// O login (Auth) guardado no repositório: endereços, senha mínima e os e-mails de supabase/emails/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EMAILS, ENDERECOS, VALIDADE_DOS_LINKS, lerEmails, configDesejada, semEnderecos, semEmails, ehCampoDeEmail, diferencas, rotulo, preencher, assuntoDe } from "../scripts/lib/auth.mjs";
import { SENHA_MINIMA } from "../src/sessao.js";

const pasta = fileURLToPath(new URL("../supabase/emails/", import.meta.url));
const emails = lerEmails(pasta);

test("endereços: só os combinados, sem curinga mais aberto", () => {
  const stg = configDesejada("stg", emails);
  const prod = configDesejada("producao", emails);
  assert.equal(prod.site_url, "https://painel.renderizaweb.com.br");
  assert.equal(prod.uri_allow_list, "https://painel.renderizaweb.com.br/**,https://renderiza-painel-clientes.vercel.app/**");
  assert.equal(stg.site_url, "http://localhost:5180");
  assert.equal(stg.uri_allow_list, "http://localhost:5180/**,https://renderiza-painel-clientes-*.vercel.app/**");
  // No domínio, o único curinga é o das prévias do STG; na produção, só o caminho (/**) é livre.
  const dominios = Object.values(ENDERECOS).flatMap(e => e.retorno).map(r => r.split("/")[2]);
  assert.deepEqual(dominios.filter(d => d.includes("*")), ["renderiza-painel-clientes-*.vercel.app"]);
  assert.deepEqual(ENDERECOS.producao.retorno.map(r => r.split("/")[2]), ["painel.renderizaweb.com.br", "renderiza-painel-clientes.vercel.app"]);
});

test("senha mínima de 8, a mesma da tela", () => {
  for (const alvo of ["stg", "producao"]) assert.equal(configDesejada(alvo, emails).password_min_length, 8);
  assert.equal(SENHA_MINIMA, 8);
});

test("confirmação de e-mail ligada e troca de e-mail confirmada nos dois endereços", () => {
  const c = configDesejada("producao", emails);
  assert.equal(c.mailer_autoconfirm, false);
  assert.equal(c.mailer_secure_email_change_enabled, true);
});

test("os 5 e-mails, com assunto e corpo, nos dois projetos", () => {
  assert.deepEqual(EMAILS.map(e => e.tipo), ["confirmation", "invite", "recovery", "email_change", "magic_link"]);
  for (const alvo of ["stg", "producao"]) {
    const c = configDesejada(alvo, emails);
    for (const e of emails) {
      assert.equal(c[`mailer_subjects_${e.tipo}`], e.assunto);
      assert.equal(c[`mailer_templates_${e.tipo}_content`], e.html);
    }
  }
  assert.deepEqual(semEnderecos(configDesejada("stg", emails)), semEnderecos(configDesejada("producao", emails)), "fora os endereços, STG e produção iguais");
});

test("assunto: em português, curto e sem variável (o Supabase escaparia & e <)", () => {
  for (const e of emails) {
    assert.match(e.assunto, /Painel Renderiza/, e.arquivo);
    assert.ok(e.assunto.length <= 60, e.arquivo);
    assert.doesNotMatch(e.assunto, /[{}&<>]/, e.arquivo);
  }
  assert.throws(() => assuntoDe("<html></html>"), /title/);
});

test("corpo: link do Supabase, só variáveis que existem e nada de fora (imagem, script, fonte)", () => {
  for (const e of emails) {
    const h = e.html;
    assert.match(h, /<html lang="pt-BR">/, e.arquivo);
    assert.match(h, /<a href="\{\{ \.ConfirmationURL \}\}"/, e.arquivo);
    assert.doesNotMatch(h, /<(img|script|link|style|iframe|form)\b/i, e.arquivo);
    assert.doesNotMatch(h, /\bsrc=|url\(/i, e.arquivo);
    const variaveis = [...h.matchAll(/\{\{\s*(?:if\s+)?\.([\w.]+)\s*\}\}/g)].map(m => m[1]);
    const permitidas = ["ConfirmationURL", "Email", ...(e.tipo === "email_change" ? ["NewEmail"] : []), ...(e.tipo === "invite" ? ["Data.nome_da_conta"] : [])];
    for (const v of variaveis) assert.ok(permitidas.includes(v), `${e.arquivo}: {{ .${v} }}`);
    const abre = (h.match(/\{\{\s*if\b/g) || []).length;
    assert.equal(abre, (h.match(/\{\{\s*end\s*\}\}/g) || []).length, e.arquivo + ": if sem end");
    assert.equal((h.match(/\{\{/g) || []).length, (h.match(/\}\}/g) || []).length, e.arquivo);
  }
  assert.match(emails.find(e => e.tipo === "email_change").html, /\{\{ \.NewEmail \}\}/);
});

test("o prazo dito nos e-mails é o configurado (1 hora)", () => {
  assert.equal(VALIDADE_DOS_LINKS, 3600);
  for (const alvo of ["stg", "producao"]) assert.equal(configDesejada(alvo, emails).mailer_otp_exp, VALIDADE_DOS_LINKS);
  for (const e of emails) assert.match(e.html, /vale por 1 hora/, e.arquivo);
});

test("design system: só as cores dos tokens --rz-* e o mesmo layout nos 5", () => {
  const css = readFileSync(new URL("../src/ui/estilo.css", import.meta.url), "utf8");
  const tokens = new Set([...css.matchAll(/--rz-[\w-]+:\s*(#[0-9a-f]{6})/gi)].map(m => m[1].toLowerCase()));
  for (const e of emails) {
    for (const [cor] of e.html.matchAll(/#[0-9a-f]{3,8}\b/gi)) assert.ok(tokens.has(cor.toLowerCase()), `${e.arquivo}: ${cor} não é token`);
    assert.match(e.html, /background-color:#b25134/, e.arquivo + ": botão na terracota");
  }
  const layout = h => h
    .replace(/<title>[^<]*<\/title>/, "")
    .replace(/<!-- previa -->[\s\S]*?<!-- \/previa -->/, "")
    .replace(/<!-- conteudo -->[\s\S]*?<!-- \/conteudo -->/, "");
  for (const e of emails.slice(1)) assert.equal(layout(e.html), layout(emails[0].html), `${e.arquivo}: layout diferente de ${emails[0].arquivo}`);
  for (const e of emails) {
    const previa = e.html.match(/<!-- previa --><div[^>]*>([^<]+)<\/div><!-- \/previa -->/);
    assert.ok(previa && previa[1].trim(), e.arquivo + ": sem a prévia (o texto ao lado do assunto)");
  }
});

test("prévia: preenche como o Supabase, escapando o HTML", () => {
  const convite = emails.find(e => e.tipo === "invite").html;
  const com = preencher(convite, { ConfirmationURL: "https://x.teste/?a=1&b=2", Data: { nome_da_conta: "Villa <b>Alecrim</b>" } });
  assert.match(com, /Villa &lt;b&gt;Alecrim&lt;\/b&gt; convidou você/);
  assert.match(com, /href="https:\/\/x\.teste\/\?a=1&amp;b=2"/);
  assert.doesNotMatch(com, /\{\{|\}\}/);
  assert.match(preencher(convite, { Data: {} }), /Você recebeu um convite para o Painel Renderiza/);
  assert.match(preencher(convite, {}), /Você recebeu um convite/);
  for (const e of emails) assert.doesNotMatch(preencher(e.html, { ConfirmationURL: "u", Email: "e", NewEmail: "n", Data: {} }), /\{\{|\}\}/, e.arquivo);
});

test("diferenças e nomes dos campos (sem mostrar o corpo dos e-mails)", () => {
  const desejada = configDesejada("stg", emails);
  assert.deepEqual(diferencas(desejada, desejada), []);
  assert.deepEqual(diferencas({ a: 1, b: "x" }, { a: 1, b: "y", c: 3 }), ["b"]);
  assert.equal(diferencas(desejada, {}).length, Object.keys(desejada).length);
  assert.equal(rotulo("mailer_templates_invite_content"), 'e-mail "convite" (corpo)');
  assert.equal(rotulo("mailer_subjects_recovery"), 'e-mail "recuperar a senha" (assunto)');
  assert.equal(rotulo("site_url"), "site_url");
});

test("sem SMTP próprio, os e-mails esperam e o resto vale (o Supabase grátis recusa e-mail próprio)", () => {
  const c = semEmails(configDesejada("producao", emails));
  assert.deepEqual(Object.keys(c).sort(), ["mailer_autoconfirm", "mailer_otp_exp", "mailer_secure_email_change_enabled", "password_min_length", "site_url", "uri_allow_list"]);
  assert.equal(Object.keys(configDesejada("producao", emails)).filter(ehCampoDeEmail).length, 10);
  assert.ok(!ehCampoDeEmail("mailer_otp_exp") && !ehCampoDeEmail("mailer_autoconfirm"));
});
