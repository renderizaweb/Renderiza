// Grava o catálogo das demos no banco do painel (Missão 7, bloco C; D51): lê ../demos/<pasta>/demo.json, fica com
// as de eventos e de fotografia e, de cada uma, só o que o painel e a IA usam (scripts/lib/demos.mjs). Grava ou
// atualiza (nada é apagado: a demo que sumiu da pasta continua no catálogo). Rode quando uma demo nova ficar pronta.
//   node scripts/demos.mjs stg
//   node scripts/demos.mjs producao --projeto <ref da produção>
//   (com --simular, só mostra o que gravaria)

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { ALVOS, conferirProjeto, exigirConfirmacaoDaProducao } from "./lib/projetos.mjs";
import { consultar } from "./lib/supabase-api.mjs";
import { dadosDaDemo } from "./lib/demos.mjs";

const DEMOS = fileURLToPath(new URL("../../demos", import.meta.url));
const args = process.argv.slice(2);
const alvo = args[0];
const valorDe = nome => { const i = args.indexOf("--" + nome); return i >= 0 ? args[i + 1] : undefined; };
const q = v => `'${String(v).replace(/'/g, "''")}'`;

if (!ALVOS[alvo]) {
  console.error("Use: node scripts/demos.mjs stg | producao --projeto <ref> [--simular]");
  process.exit(1);
}

const linhas = [];
for (const pasta of readdirSync(DEMOS)) {
  const arquivo = join(DEMOS, pasta, "demo.json");
  if (!existsSync(arquivo)) continue;
  const linha = dadosDaDemo(JSON.parse(readFileSync(arquivo, "utf8")), pasta);
  if (linha) linhas.push(linha);
}
const conta = n => linhas.filter(l => l.nicho === n).length;
console.log(`${linhas.length} demos para o painel: ${conta("eventos")} de eventos e ${conta("fotografia")} de fotografia.`);

if (args.includes("--simular")) {
  for (const l of linhas) console.log(`  ${l.nicho.padEnd(10)} ${l.pasta}  ${l.nome}`);
  process.exit(0);
}

const p = await conferirProjeto(alvo);
if (alvo === "producao") exigirConfirmacaoDaProducao(p, valorDe("projeto"));
console.log(`Alvo: ${ALVOS[alvo].nome} · ${p.nome} (${p.ref})`);
const valores = linhas.map(l => `(${q(l.pasta)}, ${q(l.nicho)}, ${q(l.nome)}, ${q(JSON.stringify(l.dados))}::jsonb)`).join(",\n  ");
await consultar(p.ref, `insert into public.demos (pasta, nicho, nome, dados) values
  ${valores}
on conflict (pasta) do update set nicho = excluded.nicho, nome = excluded.nome, dados = excluded.dados, atualizado_em = now();`);
const [{ n }] = await consultar(p.ref, "select count(*)::int as n from public.demos", { somenteLeitura: true });
console.log(`ok: ${linhas.length} gravadas ou atualizadas; o catálogo ${ALVOS[alvo].no} tem ${n}.`);
