// O login (Auth) do Painel Renderiza nos dois projetos do Supabase: endereço do painel, endereços de retorno, senha
// mínima e os e-mails de supabase/emails/. A configuração mora em scripts/lib/auth.mjs; este script aplica pela API
// de gerenciamento (PAINEL_SUPABASE_ACCESS_TOKEN) e confere lendo de volta. Sempre STG primeiro (08).
//
//   node scripts/auth.mjs                       situação: o Auth dos dois projetos comparado com o repositório (só lê)
//   node scripts/auth.mjs stg                   aplica no STG o que estiver diferente e confere
//   node scripts/auth.mjs producao --projeto <ref da produção>
//                                               aplica na produção (só depois de o STG estar igual ao repositório)
//   node scripts/auth.mjs previa [pasta]        grava os e-mails preenchidos com dados fictícios, para abrir no navegador
// Opção: --simular (mostra o que mudaria, sem mudar)

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { lerEmails, configDesejada, semEnderecos, diferencas, rotulo, preencher } from "./lib/auth.mjs";
import { configDoAuth, mudarConfigDoAuth } from "./lib/supabase-api.mjs";
import { ALVOS, conferirProjeto, exigirConfirmacaoDaProducao, refDo } from "./lib/projetos.mjs";

const PASTA = resolve(fileURLToPath(new URL("..", import.meta.url)));
const EMAILS = join(PASTA, "supabase", "emails");

const args = process.argv.slice(2);
const [comando = "situacao", argumento] = args.filter(a => !a.startsWith("--") && a !== valorDe("projeto"));
const opcao = nome => args.includes("--" + nome);
function valorDe(nome) {
  return args.includes("--" + nome) ? args[args.indexOf("--" + nome) + 1] : undefined;
}

const dia = () => new Date().toLocaleDateString("pt-BR");

/** Endereços e números aparecem; e-mails, só o nome (o corpo é grande e está no repositório). */
function mudanca(campo, antes, depois) {
  if (/^mailer_(subjects|templates)_/.test(campo)) return `   ${rotulo(campo)}`;
  return `   ${campo}: ${JSON.stringify(antes ?? null)} → ${JSON.stringify(depois)}`;
}

async function situacao() {
  const emails = lerEmails(EMAILS);
  for (const alvo of ["stg", "producao"]) {
    const p = await conferirProjeto(alvo);
    const desejada = configDesejada(alvo, emails);
    const atual = await configDoAuth(p.ref);
    const dif = diferencas(desejada, atual);
    console.log(`${ALVOS[alvo].nome}: ${p.nome} (${p.ref}) · ${dif.length ? `${dif.length} campo(s) diferente(s) do repositório:` : "igual ao repositório"}`);
    for (const c of dif) console.log(mudanca(c, atual[c], desejada[c]));
  }
}

async function aplicar(alvo) {
  const p = await conferirProjeto(alvo);
  if (alvo === "producao") exigirConfirmacaoDaProducao(p, valorDe("projeto"));
  console.log(`Alvo: ${ALVOS[alvo].nome} · ${p.nome} (${p.ref}, ${p.regiao}, ${p.situacao})`);

  const emails = lerEmails(EMAILS);
  const desejada = configDesejada(alvo, emails);

  if (alvo === "producao") {
    const stg = await configDoAuth(refDo("stg"));
    const faltaNoStg = diferencas(semEnderecos(configDesejada("stg", emails)), stg);
    if (faltaNoStg.length) throw new Error(`O STG ainda não tem: ${faltaNoStg.map(rotulo).join(", ")}. Sempre STG primeiro: node scripts/auth.mjs stg.`);
    console.log("1. O STG já tem a mesma configuração (fora os endereços).");
  }

  const atual = await configDoAuth(p.ref);
  const dif = diferencas(desejada, atual);
  if (!dif.length) {
    console.log(`Nada a mudar: ${ALVOS[alvo].o} já está igual ao repositório.`);
    return;
  }
  console.log(`A mudar ${ALVOS[alvo].no}:`);
  for (const c of dif) console.log(mudanca(c, atual[c], desejada[c]));
  if (opcao("simular")) {
    console.log("(--simular: nada foi mudado)");
    return;
  }

  await mudarConfigDoAuth(p.ref, Object.fromEntries(dif.map(c => [c, desejada[c]])));
  const depois = diferencas(desejada, await configDoAuth(p.ref));
  if (depois.length) throw new Error(`Mudou, mas lendo de volta ainda não bate: ${depois.map(rotulo).join(", ")}. Pare e confira.`);
  console.log(`Conferido lendo de volta: ${ALVOS[alvo].o} está igual ao repositório (${Object.keys(desejada).length} campos).`);
  console.log(`\nAgora: push da branch e, em docs/painel-clientes/missoes.md, o Auth aplicado ${ALVOS[alvo].no} em ${dia()}.`);
}

/** Dados fictícios, como os de /exemplos. */
const EXEMPLO = {
  ConfirmationURL: "https://painel.renderizaweb.com.br/nova-senha#exemplo",
  SiteURL: "https://painel.renderizaweb.com.br",
  Email: "ana@villa-alecrim.teste",
  NewEmail: "ana.souza@villa-alecrim.teste",
  Data: { nome_da_conta: "Villa Alecrim" },
};

function previa() {
  const pasta = resolve(argumento || join(tmpdir(), "painel-renderiza-emails"));
  mkdirSync(pasta, { recursive: true });
  for (const e of lerEmails(EMAILS)) {
    const arquivo = join(pasta, e.arquivo);
    writeFileSync(arquivo, preencher(e.html, EXEMPLO));
    console.log(`${e.assunto}\n   ${arquivo}`);
  }
}

const COMANDOS = { situacao, stg: () => aplicar("stg"), producao: () => aplicar("producao"), previa };

if (!COMANDOS[comando]) {
  console.error(`Comando desconhecido: ${comando}. Use: situacao, stg, producao --projeto <ref> ou previa [pasta].`);
  process.exit(1);
}
try {
  await COMANDOS[comando]();
} catch (e) {
  console.error("\nParou: " + e.message);
  process.exit(1);
}
