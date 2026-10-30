// O backup do Painel Renderiza (Missão 5B; 06; D11): lê o banco pela API de gerenciamento (só leitura), junta as
// tabelas, os logins, o registro do Storage e as imagens públicas num arquivo comprimido e cifrado com BACKUP_SENHA.
// Roda toda semana no GitHub Actions (raiz .github/workflows/backup-painel.yml), que guarda o arquivo como artefato
// cifrado por 90 dias e testa a restauração (scripts/restaurar-backup.mjs). Nunca imprime dado: só os números.
//
//   node scripts/backup.mjs stg --saida <pasta>
//   node scripts/backup.mjs producao --projeto <ref> --saida <pasta>
//
// Precisa de PAINEL_SUPABASE_ACCESS_TOKEN, PAINEL_STG_SUPABASE_URL, PAINEL_PROD_SUPABASE_URL e BACKUP_SENHA.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { consultar } from "./lib/supabase-api.mjs";
import { ALVOS, conferirProjeto, exigirConfirmacaoDaProducao } from "./lib/projetos.mjs";
import { lerBanco, lerImagens, cifrar, senhaDoAmbiente, resumo } from "./lib/backup.mjs";

const args = process.argv.slice(2);
const alvo = args[0];
const opcao = nome => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
if (!ALVOS[alvo]) throw new Error("Use: node scripts/backup.mjs stg|producao [--projeto <ref>] --saida <pasta>");
const senha = senhaDoAmbiente();
const saida = opcao("--saida") || ".";

const p = await conferirProjeto(alvo);
if (alvo === "producao") exigirConfirmacaoDaProducao(p, opcao("--projeto"));
console.log(`Backup ${ALVOS[alvo].no}: ${p.nome} (${p.ref})`);
const backup = await lerBanco(sql => consultar(p.ref, sql, { somenteLeitura: true }), { projeto: p.ref });
await lerImagens(backup, process.env[ALVOS[alvo].variavel]);
const arquivo = cifrar(JSON.stringify(backup), senha);
mkdirSync(saida, { recursive: true });
const nome = join(saida, `painel-${alvo}-${backup.criado_em.slice(0, 10)}.rzbk`);
writeFileSync(nome, arquivo);
console.log(`Pronto: ${nome} (${(arquivo.length / 1024).toFixed(0)} KB, cifrado) · ${resumo(backup)}`);
