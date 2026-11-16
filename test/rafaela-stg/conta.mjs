// A conta de teste da Rafaela Damaceno no STG (entrega da Rafaela, Parada C5): fotografia, com o site dela gerado pelo
// virar-site.mjs, os ensaios, os horários e a campanha "Natal 2026" que estão no demo.json dela (os da demo: ela ainda
// vai mandar os de verdade, Parada B1). Só o STG: conferirProjeto("stg") recusa outro banco. Nada de dado pessoal: o
// login da dona é fictício (usuário, sem e-mail: o aviso de pedido novo não sai para ninguém) e a senha é sorteada
// a cada uso, nunca impressa nem gravada.
//
//   node test/rafaela-stg/conta.mjs conferir      o que a conta tem no STG (só lê)
//   node test/rafaela-stg/conta.mjs criar         apaga a conta de teste, se existir, e cria de novo, limpa (as pessoas
//                                                 e os convites que a Renderiza pôs nela voltam; o resto, não)
//   node test/rafaela-stg/conta.mjs apagar        apaga a conta de teste e o login dela
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { bancoStg, q } from "../../painel-clientes/test/fluxos/ambiente.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEMO = path.join(RAIZ, "demos", "rafaela-damaceno-fotografia");

export const CODIGO = "rafaela-damaceno"; // o da conta e o do site (o script do site usa este)
export const NOME = "Rafaela Damaceno (teste)";
export const DOMINIOS = ["localhost", "estudiorafaeladamaceno.pages.dev"];
export const DONA = "rafaelateste@acesso.renderizaweb.com.br"; // login de usuário: não recebe e-mail
const MODULOS = ["agenda-online", "agenda", "atendimento", "clientes", "meu-site"];
const NATAL = "Natal 2026";

/**
 * Gera o site dela a partir da demo, com o painel no site.json (o código e a API dada), numa pasta nova. Devolve
 * { site, apagar }. A pasta da cópia tem o nome da demo (o virar-site troca os links /demo/<pasta>).
 */
export function gerarSite(api) {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "rafaela-stg-"));
  const copia = path.join(pasta, path.basename(DEMO));
  fs.mkdirSync(copia);
  for (const a of ["index.html", "natal.html"]) fs.copyFileSync(path.join(DEMO, a), path.join(copia, a));
  const conf = JSON.parse(fs.readFileSync(path.join(DEMO, "site.json"), "utf8"));
  fs.writeFileSync(path.join(copia, "site.json"), JSON.stringify({ ...conf, painel: { codigo: CODIGO, agenda: true, api } }));
  const site = path.join(pasta, "site");
  const r = spawnSync("node", ["scripts/virar-site.mjs", copia, site], { cwd: RAIZ, encoding: "utf8" });
  if (r.status !== 0 || /✗/.test(r.stdout)) throw new Error("virar-site falhou:\n" + r.stdout + r.stderr);
  return { site, apagar: () => fs.rmSync(pasta, { recursive: true, force: true }) };
}

/** O conteúdo inicial do site gerado (o que o extrair.mjs tira do index.html): o ponto de partida do Meu site. */
export function conteudoInicial(site) {
  const r = spawnSync("node", ["ferramentas/meu-site/extrair.mjs", path.join(site, "index.html")], { cwd: RAIZ, encoding: "utf8", maxBuffer: 1 << 24 });
  if (r.status !== 0) throw new Error("extrair.mjs falhou:\n" + r.stderr);
  return JSON.parse(r.stdout);
}

/** A agenda do demo.json: os ensaios, os horários de cada dia da semana e a campanha de Natal. */
function agendaDaDemo() {
  const { agenda } = JSON.parse(fs.readFileSync(path.join(DEMO, "demo.json"), "utf8"));
  const natal = agenda.campanhas.find(c => c.nome === NATAL);
  if (!natal) throw new Error(`demo.json sem a campanha "${NATAL}"`);
  return { duracao: agenda.duracao, ensaios: agenda.ensaios, semana: agenda.semana, natal };
}

const arr = (lista, tipo) => `array[${lista.map(q).join(", ")}]::${tipo}[]`;
const daConta = `(select id from public.contas where codigo = ${q(CODIGO)})`;

/** Apaga a conta de teste (com tudo dela) e o login da dona. */
export async function apagar(banco) {
  await banco.sql(`
    delete from public.contas where codigo = ${q(CODIGO)};
    delete from public.pessoas where usuario_id in (select id from auth.users where email = ${q(DONA)});
    delete from auth.users where email = ${q(DONA)};`);
}

/** Cria a conta do zero (apaga a de antes): conta, módulos, site, ensaios, horários, campanha e a dona. Quem mais
 *  estava na conta (o login de teste da Renderiza) e os convites pendentes voltam, iguais. */
export async function criar(banco, conteudo) {
  const { duracao, ensaios, semana, natal } = agendaDaDemo();
  const [{ pessoas, convites }] = await banco.sql(`select
    (select coalesce(json_agg(json_build_object('usuario_id', usuario_id, 'nome', nome, 'email', email, 'papel', papel, 'cor', cor, 'dono', dono, 'acessos', acessos)), '[]')
       from public.pessoas where conta_id = ${daConta} and email is distinct from ${q(DONA)}) as pessoas,
    (select coalesce(json_agg(json_build_object('email', email, 'nome', nome, 'dono', dono, 'acessos', acessos, 'usuario', usuario, 'link_codigo', link_codigo, 'expira_em', expira_em, 'pela_renderiza', pela_renderiza)), '[]')
       from public.convites where conta_id = ${daConta} and aceito_em is null and cancelado_em is null) as convites`);
  await apagar(banco);
  const servicos = [...ensaios.map((e, i) => ({ nome: e.nome, descricao: e.sub || null, online: true, ordem: i + 1 })),
    { nome: NATAL, descricao: natal.sub || null, online: false, ordem: ensaios.length + 1 }]; // o Natal só pela campanha
  const horarios = Object.entries(semana).flatMap(([d, hs]) => hs.map(h => `(${daConta}, ${Number(d)}, ${q(h)})`));
  await banco.sql(`
    insert into public.contas (nome, nicho, codigo, cores, situacao, origem)
      values (${q(NOME)}, 'fotografia', ${q(CODIGO)}, ${q(JSON.stringify({ principal: "#a7674b" }))}::jsonb, 'ativa', 'renderiza');
    insert into public.contas_modulos (conta_id, modulo_id) select ${daConta}, m from unnest(${arr(MODULOS, "text")}) as m;
    insert into public.sites (conta_id, codigo, dominios, conteudo_inicial)
      values (${daConta}, ${q(CODIGO)}, ${arr(DOMINIOS, "text")}, ${q(JSON.stringify(conteudo))}::jsonb);
    insert into public.servicos (conta_id, nome, descricao, duracao_min, na_agenda_online, ordem) values
      ${servicos.map(s => `(${daConta}, ${q(s.nome)}, ${s.descricao ? q(s.descricao) : "null"}, ${Number(duracao)}, ${s.online}, ${s.ordem})`).join(",\n      ")};
    insert into public.horarios (conta_id, dia_semana, inicio) values ${horarios.join(", ")};
    insert into public.campanhas (conta_id, nome, servico_id, dias, horarios)
      values (${daConta}, ${q(NATAL)}, (select id from public.servicos where conta_id = ${daConta} and nome = ${q(NATAL)}),
        ${arr(natal.dias, "date")}, ${arr(natal.horarios, "time")});`);
  await criarDona(banco);
  if (pessoas.length) await banco.sql(`insert into public.pessoas (conta_id, usuario_id, nome, email, papel, cor, dono, acessos)
    select ${daConta}, p.usuario_id, p.nome, p.email, p.papel, p.cor, p.dono, p.acessos
    from jsonb_to_recordset(${q(JSON.stringify(pessoas))}::jsonb) as p(usuario_id uuid, nome text, email text, papel text, cor text, dono boolean, acessos jsonb)
    where p.usuario_id is null or exists (select 1 from auth.users u where u.id = p.usuario_id)`);
  if (convites.length) await banco.sql(`insert into public.convites (conta_id, email, nome, dono, acessos, usuario, link_codigo, expira_em, pela_renderiza)
    select ${daConta}, c.email, c.nome, c.dono, c.acessos, c.usuario, c.link_codigo, c.expira_em, c.pela_renderiza
    from jsonb_to_recordset(${q(JSON.stringify(convites))}::jsonb) as c(email text, nome text, dono boolean, acessos jsonb, usuario text, link_codigo text, expira_em timestamptz, pela_renderiza boolean)`);
  return conferir(banco);
}

/** O login da dona (usuário fictício), dona da conta. A senha nasce aqui e só vive na memória de quem chamou. */
async function criarDona(banco) {
  const senha = randomBytes(18).toString("base64url");
  await banco.sql(`
    with u as (
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
      values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', ${q(DONA)}, extensions.crypt(${q(senha)}, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"nome":"Rafaela (teste)"}'::jsonb, now(), now(), '', '', '', '', '', '', '', '')
      returning id
    ), i as (
      insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      select id::text, id, json_build_object('sub', id::text, 'email', ${q(DONA)}, 'email_verified', true)::jsonb, 'email', now(), now(), now() from u
    )
    insert into public.pessoas (conta_id, usuario_id, nome, email, dono) select ${daConta}, id, 'Rafaela (teste)', ${q(DONA)}, true from u;`);
  return senha;
}

/** Troca a senha da dona por uma nova (para a prova entrar no painel). Devolve a senha. */
export async function novaSenhaDaDona(banco) {
  const senha = randomBytes(18).toString("base64url");
  await banco.sql(`update auth.users set encrypted_password = extensions.crypt(${q(senha)}, extensions.gen_salt('bf')), updated_at = now() where email = ${q(DONA)}`);
  return senha;
}

/** O que a conta tem (só lê). */
export async function conferir(banco) {
  const [r] = await banco.sql(`select json_build_object(
    'conta', (select json_build_object('nome', nome, 'nicho', nicho, 'situacao', situacao) from public.contas where codigo = ${q(CODIGO)}),
    'modulos', (select json_agg(modulo_id order by modulo_id) from public.contas_modulos where conta_id = ${daConta} and ligado),
    'site', (select json_build_object('codigo', codigo, 'dominios', dominios, 'situacao', situacao, 'secoes', (select count(*) from jsonb_object_keys(conteudo_inicial->'secoes'))) from public.sites where conta_id = ${daConta}),
    'ensaios', (select json_agg(nome || ' (' || duracao_min || ' min' || case when na_agenda_online then '' else ', só na campanha' end || ')' order by ordem) from public.servicos where conta_id = ${daConta}),
    'horarios', (select count(*) from public.horarios where conta_id = ${daConta}),
    'campanha', (select json_build_object('nome', nome, 'dias', cardinality(dias), 'horarios', cardinality(horarios), 'vagas', public.campanha_restam(conta_id, id)) from public.campanhas where conta_id = ${daConta}),
    'dona', (select count(*) from public.pessoas where conta_id = ${daConta} and dono and email = ${q(DONA)}),
    'outras_pessoas', (select count(*) from public.pessoas where conta_id = ${daConta} and email is distinct from ${q(DONA)}),
    'convites_pendentes', (select count(*) from public.convites where conta_id = ${daConta} and aceito_em is null and cancelado_em is null),
    'pedidos', (select count(*) from public.pedidos where conta_id = ${daConta}),
    'reservas', (select count(*) from public.reservas where conta_id = ${daConta}),
    'versoes', (select count(*) from public.sites_versoes where conta_id = ${daConta})
  ) as conta`);
  return r.conta;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const comando = process.argv[2] || "conferir";
  const banco = await bancoStg();
  if (comando === "criar") {
    const { site, apagar: apagarPasta } = gerarSite("https://painel.renderizaweb.com.br/api/publico/");
    try { console.log(JSON.stringify(await criar(banco, conteudoInicial(site)), null, 2)); } finally { apagarPasta(); }
  } else if (comando === "apagar") {
    await apagar(banco);
    console.log("Conta de teste apagada do STG.");
  } else if (comando === "conferir") {
    console.log(JSON.stringify(await conferir(banco), null, 2));
  } else {
    console.error("Uso: node test/rafaela-stg/conta.mjs conferir | criar | apagar");
    process.exit(1);
  }
}
