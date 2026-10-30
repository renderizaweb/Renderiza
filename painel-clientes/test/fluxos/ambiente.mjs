// O que os fluxos de ponta a ponta usam (Missão 6): o painel de verdade num Chromium (Playwright), servido pelo
// scripts/servidor.mjs numa porta só dele, contra o banco STG. Cada execução cria o que precisa (usuários
// @fluxo-<marca>.teste, a conta t-fluxo-<marca>, a equipe Renderiza de teste) e apaga tudo no fim, mesmo se falhar.
// Precisa das variáveis PAINEL_* do ambiente (as mesmas das migrações) e do Playwright; sem elas, os fluxos são pulados.
// Nunca toca na produção: conferirProjeto("stg") recusa outro banco.

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { consultar } from "../../scripts/lib/supabase-api.mjs";
import { conferirProjeto } from "../../scripts/lib/projetos.mjs";

const PASTA = fileURLToPath(new URL("../..", import.meta.url));

/** O Playwright, se estiver instalado (senão, null e os fluxos são pulados). */
export function playwright() {
  try { return createRequire(import.meta.url)("playwright"); } catch { return null; }
}

/** Por que pular os fluxos aqui (ou false para rodar). */
export function motivoParaPular() {
  if (!playwright()) return "sem o Playwright";
  if (!process.env.PAINEL_SUPABASE_ACCESS_TOKEN || !process.env.PAINEL_STG_SUPABASE_URL) return "sem as variáveis PAINEL_* (o banco STG)";
  return false;
}

/** Uma marca curta desta execução: entra nos e-mails e no código da conta, para achar e apagar tudo no fim. */
/** (Para investigar um fluxo, FLUXO_MARCA fixa a marca: dá para rodar de novo em cima do que ficou.) */
export const MARCA = process.env.FLUXO_MARCA || Date.now().toString(36).slice(-6) + randomBytes(2).toString("hex");
export const DOMINIO = `fluxo-${MARCA}.teste`;
export const CODIGO = `t-fluxo-${MARCA}`;
export const email = nome => `${nome}@${DOMINIO}`;

/** Texto como literal do Postgres. */
export const q = v => `'${String(v).replace(/'/g, "''")}'`;

/** O banco STG: { ref, sql(consulta) }. */
export async function bancoStg() {
  const p = await conferirProjeto("stg");
  return { ref: p.ref, sql: texto => consultar(p.ref, texto) };
}

/** Cria um login (e-mail confirmado) com uma senha aleatória, que só existe nesta execução. Devolve a senha. */
export async function criarLogin(banco, endereco, nome = "Pessoa do fluxo") {
  if (!endereco.endsWith(`@${DOMINIO}`)) throw new Error("só e-mail do fluxo");
  const senha = randomBytes(18).toString("base64url");
  await banco.sql(`
    with u as (
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', ${q(endereco)}, extensions.crypt(${q(senha)}, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', ${q(JSON.stringify({ nome }))}::jsonb, now(), now(), '', '', '', '', '', '', '', '')
      returning id
    )
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    select id::text, id, json_build_object('sub', id::text, 'email', ${q(endereco)}, 'email_verified', true)::jsonb, 'email', now(), now(), now() from u;`);
  return senha;
}

/** Põe o login na equipe Renderiza (abre o Admin). */
export async function porNaEquipeRenderiza(banco, endereco) {
  await banco.sql(`insert into public.equipe_renderiza (usuario_id, nome) select id, 'Renderiza do fluxo' from auth.users where email = ${q(endereco)}`);
}

/** Apaga tudo desta execução: as contas t-fluxo-<marca>, o suporte e a equipe Renderiza de teste e os logins. */
export async function limpar(banco) {
  const deles = `(select id from auth.users where email like ${q(`%@${DOMINIO}`)})`;
  await banco.sql(`
    delete from public.contas where codigo like ${q(`${CODIGO}%`)};
    delete from public.acessos_suporte where usuario_id in ${deles};
    delete from public.equipe_renderiza where usuario_id in ${deles};
    delete from public.pessoas where usuario_id in ${deles};
    delete from auth.users where email like ${q(`%@${DOMINIO}`)};`);
}

/** Liga o servidor do painel (STG) numa porta própria. Devolve { url, parar }. */
export async function ligarServidor(porta = 5190 + Math.floor(Math.random() * 50)) {
  const filho = spawn(process.execPath, ["scripts/servidor.mjs"], { cwd: PASTA, env: { ...process.env, PORT: String(porta) }, stdio: "ignore" });
  const url = `http://localhost:${porta}`;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${url}/api/config`)).ok) return { url, parar: () => filho.kill() }; } catch { /* ainda subindo */ }
    await new Promise(r => setTimeout(r, 100));
  }
  filho.kill();
  throw new Error("O servidor do painel não subiu.");
}

/**
 * Vigia a página: erro de script, erro no console e chamada ao banco que falhou (fora as que o fluxo espera, em
 * `esperados`, uma lista de expressões). Devolve a lista, que o fluxo confere no fim.
 */
export function vigiar(pagina, esperados = []) {
  const erros = [];
  pagina.on("pageerror", e => erros.push(`script: ${e.message}`));
  pagina.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erros.push(`console: ${m.text()}`); });
  pagina.on("response", r => {
    const u = r.url();
    if (r.status() >= 400 && /supabase\.co/.test(u) && !esperados.some(e => e.test(u))) erros.push(`${r.status()} ${r.request().method()} ${u.replace(/^https:\/\/[^/]+/, "").split("?")[0]}`);
  });
  return erros;
}

/** Conta os toques e o que foi digitado (o teste das 5 tarefas do 09). */
export function contador(pagina) {
  const c = {
    toques: 0, digitados: [],
    async tocar(alvo) { c.toques++; await (typeof alvo === "string" ? pagina.locator(alvo).first() : alvo).click(); },
    async digitar(alvo, valor) { c.digitados.push(valor); await (typeof alvo === "string" ? pagina.locator(alvo).first() : alvo).fill(valor); },
    async escolher(alvo, opcao) { c.toques++; await pagina.locator(alvo).first().selectOption(opcao); },
    zerar() { c.toques = 0; c.digitados = []; },
  };
  return c;
}

/** Entra no painel. Se aparecer o aceite dos termos (Missão 5B), aceita. */
export async function entrar(pagina, url, endereco, senha) {
  await pagina.goto(`${url}/entrar`, { waitUntil: "networkidle" });
  await pagina.fill("#entrar-email", endereco);
  await pagina.fill("#entrar-senha", senha);
  // depois de entrar, o painel confere o aceite dos termos no banco antes de mostrar qualquer tela
  const conferiu = pagina.waitForResponse(r => /\/rest\/v1\/termos_aceites/.test(r.url()), { timeout: 20000 });
  await pagina.click("button[type=submit]");
  await conferiu;
  await pagina.waitForSelector("#entrar-email", { state: "detached", timeout: 15000 });
  await pagina.waitForLoadState("networkidle");
  if (await pagina.locator("[data-aceite-termos]").count()) {
    await pagina.check("[data-aceite-termos] [name=li]");
    await pagina.click("[data-aceite-termos] [type=submit]");
    await pagina.waitForSelector("[data-aceite-termos]", { state: "detached", timeout: 15000 });
    await pagina.waitForLoadState("networkidle");
  }
  await pagina.waitForSelector("h1", { timeout: 15000 });
}

/** O último aviso que apareceu (o "toast"), em uma linha. */
export async function aviso(pagina) {
  return (await pagina.locator(".rz-aviso").last().innerText().catch(() => "")).replace(/\s+/g, " ").trim();
}

/** A página rola para o lado? (no celular, não pode) */
export function rolaParaOLado(pagina) {
  return pagina.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}
