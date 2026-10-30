// O backup do Painel Renderiza (Missão 5B; 06, "Backup"; D11). O banco é lido pela API de gerenciamento do Supabase
// (a mesma das migrações: a senha do banco não fica em lugar nenhum), em consultas só de leitura: as tabelas do
// schema public, os logins (auth.users e auth.identities), o registro do Storage e as imagens dos buckets públicos.
// Tudo vira um JSON, comprimido e cifrado com uma senha (AES-256-GCM, chave pela scrypt). Sem a senha, o arquivo não
// abre; com a senha errada ou o arquivo mexido, a decifragem falha.
// A restauração monta o SQL que põe os dados de volta num banco com as mesmas migrações (gatilhos e chaves
// estrangeiras desligados enquanto entra, as tabelas zeradas antes), testada em test/backup.test.mjs.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";

export const FORMATO = "RZBK1";
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** A senha do backup: no ambiente (BACKUP_SENHA), nunca no código; no mínimo 16 caracteres. */
export function senhaDoAmbiente(env = process.env) {
  const s = env.BACKUP_SENHA || "";
  if (s.length < 16) throw new Error("Falta BACKUP_SENHA no ambiente (no mínimo 16 caracteres). Ela nunca vai para o código nem para o chat.");
  return s;
}

/** Comprime e cifra: "RZBK1" + sal (16) + iv (12) + etiqueta (16) + o conteúdo cifrado. */
export function cifrar(dados, senha) {
  const sal = randomBytes(16), iv = randomBytes(12);
  const chave = scryptSync(senha, sal, 32, SCRYPT);
  const c = createCipheriv("aes-256-gcm", chave, iv);
  const corpo = Buffer.concat([c.update(gzipSync(Buffer.from(dados))), c.final()]);
  return Buffer.concat([Buffer.from(FORMATO), sal, iv, c.getAuthTag(), corpo]);
}

/** Decifra e descomprime. Senha errada ou arquivo mexido: erro. */
export function decifrar(arquivo, senha) {
  const b = Buffer.from(arquivo);
  if (b.subarray(0, 5).toString() !== FORMATO) throw new Error("Este arquivo não é um backup do painel (formato RZBK1).");
  const sal = b.subarray(5, 21), iv = b.subarray(21, 33), tag = b.subarray(33, 49), corpo = b.subarray(49);
  const chave = scryptSync(senha, sal, 32, SCRYPT);
  const d = createDecipheriv("aes-256-gcm", chave, iv);
  d.setAuthTag(tag);
  try {
    return gunzipSync(Buffer.concat([d.update(corpo), d.final()])).toString("utf8");
  } catch (e) {
    throw new Error("Não deu para abrir o backup: senha errada ou arquivo mexido.");
  }
}

const ident = t => `"${String(t).replace(/"/g, '""')}"`;
const nomeDe = ({ schema, tabela }) => `${ident(schema)}.${ident(tabela)}`;

/** As tabelas que entram no backup (além das do public, que vêm do próprio banco). */
export const EXTRAS = [
  { schema: "auth", tabela: "users" },
  { schema: "auth", tabela: "identities" },
  { schema: "storage", tabela: "buckets" },
  { schema: "storage", tabela: "objects" },
];

/**
 * Lê o banco inteiro por `consultar(sql)` (só leitura), de `lote` em `lote` linhas. Devolve o objeto do backup:
 * { formato, projeto, criado_em, migracoes, tabelas: { "schema.tabela": [linhas] }, contagens, imagens: [] }.
 */
export async function lerBanco(consultar, { projeto, lote = 5000 } = {}) {
  const publicas = await consultar(`select table_name as tabela from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1`);
  const lista = [...publicas.map(t => ({ schema: "public", tabela: t.tabela })), ...EXTRAS];
  const tabelas = {}, contagens = {};
  for (const t of lista) {
    const existe = await consultar(`select to_regclass('${nomeDe(t).replace(/'/g, "''")}') is not null as ok`);
    if (!existe[0].ok) continue;
    const [{ n }] = await consultar(`select count(*)::int as n from ${nomeDe(t)}`);
    const linhas = [];
    for (let desde = 0; desde < n; desde += lote) {
      const [{ linhas: parte }] = await consultar(`select coalesce(json_agg(x), '[]'::json) as linhas from (select * from ${nomeDe(t)} order by ctid limit ${lote} offset ${desde}) as x`);
      linhas.push(...parte);
    }
    tabelas[`${t.schema}.${t.tabela}`] = linhas;
    contagens[`${t.schema}.${t.tabela}`] = linhas.length;
  }
  const migracoes = await consultar(`select coalesce(json_agg(version order by version), '[]'::json) as v from supabase_migrations.schema_migrations`).then(r => r[0].v).catch(() => []);
  return { formato: FORMATO, projeto, criado_em: new Date().toISOString(), migracoes, tabelas, contagens, imagens: [] };
}

/** Baixa as imagens dos buckets públicos (Storage) pela URL pública e põe no backup (base64, com o sha256). */
export async function lerImagens(backup, urlDoProjeto, buscar = fetch) {
  const objetos = backup.tabelas["storage.objects"] || [];
  const buckets = new Map((backup.tabelas["storage.buckets"] || []).map(b => [b.id, b]));
  for (const o of objetos) {
    const b = buckets.get(o.bucket_id);
    if (!b || !b.public || !o.name || o.name.endsWith("/.emptyFolderPlaceholder")) continue;
    const r = await buscar(`${urlDoProjeto.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(o.bucket_id)}/${o.name.split("/").map(encodeURIComponent).join("/")}`);
    if (!r.ok) throw new Error(`A imagem ${o.bucket_id}/${o.name} não baixou (${r.status}).`);
    const bytes = Buffer.from(await r.arrayBuffer());
    backup.imagens.push({ bucket: o.bucket_id, nome: o.name, sha256: createHash("sha256").update(bytes).digest("hex"), base64: bytes.toString("base64") });
  }
  return backup;
}

/** Um marcador de texto do Postgres ($rz…$) que não aparece no conteúdo. */
export function marcador(texto) {
  let n = 0;
  while (texto.includes(`$rz${n}$`)) n++;
  return `$rz${n}$`;
}

/**
 * O SQL que põe o backup num banco com as mesmas migrações. `colunas(nome)` diz as colunas que o banco de destino
 * tem (sem as geradas): as do backup que o destino não tem ficam de fora. Tabelas que o destino não tem são puladas
 * (`existe(nome)`). Gatilhos e chaves estrangeiras ficam desligados enquanto entra (session_replication_role).
 */
export function sqlDeRestauracao(backup, { existe = () => true, colunas = null } = {}) {
  const nomes = Object.keys(backup.tabelas).filter(existe);
  const partes = ["set session_replication_role = replica;"];
  if (nomes.length) partes.push(`truncate ${nomes.map(n => n.split(".").map(ident).join(".")).join(", ")} cascade;`);
  for (const n of nomes) {
    const linhas = backup.tabelas[n];
    if (!linhas.length) continue;
    const json = JSON.stringify(linhas);
    const m = marcador(json);
    const tab = n.split(".").map(ident).join(".");
    // só as colunas que vieram no backup (uma coluna nova no destino fica com o padrão dela) e que o destino tem
    const doBackup = new Set(Object.keys(linhas[0]));
    const cols = (colunas ? colunas(n) : [...doBackup]).filter(c => doBackup.has(c));
    const lista = cols.map(ident).join(", ");
    partes.push(`insert into ${tab} (${lista}) overriding system value select ${lista} from json_populate_recordset(null::${tab}, ${m}${json}${m}::json);`);
  }
  partes.push("set session_replication_role = origin;");
  return partes.join("\n");
}

/** Depois de restaurar, as sequências das colunas de identidade voltam a andar a partir do maior id. */
export function sqlDasSequencias(identidades) {
  return identidades.map(({ tabela, coluna }) => {
    const tab = tabela.split(".").map(ident).join(".");
    return `select setval(pg_get_serial_sequence('${tab.replace(/'/g, "''")}', '${coluna}'), coalesce((select max(${ident(coluna)}) from ${tab}), 0) + 1, false);`;
  }).join("\n");
}

/** O resumo do backup para o log (só números: nada de dado de cliente). */
export function resumo(backup) {
  const total = Object.values(backup.contagens).reduce((t, n) => t + n, 0);
  return `${Object.keys(backup.contagens).length} tabelas, ${total} linhas, ${backup.imagens.length} imagens, ${backup.migracoes.length} migrações`;
}
