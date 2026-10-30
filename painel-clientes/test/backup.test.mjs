// O backup (Missão 5B): cifrar e decifrar (senha errada e arquivo mexido não abrem), ler o banco em lotes, as
// imagens com o sha256, o SQL de restauração (zera, desliga gatilhos, só as colunas do backup, pula o que o destino
// não tem) e o workflow semanal (segredos só pelo GitHub, artefato de 90 dias, teste de restauração).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cifrar, decifrar, senhaDoAmbiente, lerBanco, lerImagens, sqlDeRestauracao, sqlDasSequencias, marcador, resumo } from "../scripts/lib/backup.mjs";

const SENHA = "uma-senha-de-teste-comprida";

test("cifra e decifra; senha errada, arquivo mexido ou outro formato não abrem", () => {
  const texto = JSON.stringify({ ola: "mundo", acento: "Júlia & Caio" });
  const a = cifrar(texto, SENHA);
  assert.equal(a.subarray(0, 5).toString(), "RZBK1");
  assert.ok(!a.toString("latin1").includes("Júlia"), "o conteúdo não aparece no arquivo");
  assert.equal(decifrar(a, SENHA), texto);
  assert.notDeepEqual(cifrar(texto, SENHA), a, "sal e iv novos a cada vez");
  assert.throws(() => decifrar(a, "outra-senha-bem-comprida"), /senha errada ou arquivo mexido/);
  const mexido = Buffer.from(a); mexido[mexido.length - 1] ^= 1;
  assert.throws(() => decifrar(mexido, SENHA), /senha errada ou arquivo mexido/);
  assert.throws(() => decifrar(Buffer.from("PK\u0003\u0004qualquer"), SENHA), /formato RZBK1/);
  assert.throws(() => senhaDoAmbiente({ BACKUP_SENHA: "curta" }), /16 caracteres/);
  assert.equal(senhaDoAmbiente({ BACKUP_SENHA: SENHA }), SENHA);
});

test("lê o banco em lotes, só o que existe, com as migrações", async () => {
  const dados = { "public.contas": [{ id: 1 }, { id: 2 }, { id: 3 }], "auth.users": [{ id: "u" }] };
  const chamadas = [];
  const consultar = async sql => {
    chamadas.push(sql);
    if (sql.includes("information_schema.tables")) return [{ tabela: "contas" }];
    if (sql.includes("to_regclass")) return [{ ok: /"public"\."contas"|"auth"\."users"/.test(sql) }];
    const nome = (/from ("[a-z_]+")\.("[a-z_]+")/.exec(sql) || []).slice(1).join(".").replace(/"/g, "");
    if (sql.includes("count(*)")) return [{ n: (dados[nome] || []).length }];
    if (sql.includes("json_agg(x)")) { const [, lim, off] = /limit (\d+) offset (\d+)/.exec(sql); return [{ linhas: dados[nome].slice(Number(off), Number(off) + Number(lim)) }]; }
    if (sql.includes("schema_migrations")) return [{ v: ["20261029110000"] }];
    throw new Error("consulta inesperada: " + sql);
  };
  const b = await lerBanco(consultar, { projeto: "abc", lote: 2 });
  assert.deepEqual(b.tabelas["public.contas"], dados["public.contas"]);
  assert.deepEqual(Object.keys(b.tabelas), ["public.contas", "auth.users"], "auth.identities e storage não existem aqui: ficam de fora");
  assert.deepEqual(b.migracoes, ["20261029110000"]);
  assert.equal(chamadas.filter(c => c.includes("json_agg(x)") && c.includes('"contas"')).length, 2, "3 linhas em lotes de 2");
  assert.ok(chamadas.every(c => !/\b(insert|update|delete|drop)\b/i.test(c)), "só leitura");
  assert.equal(resumo(b), "2 tabelas, 4 linhas, 0 imagens, 1 migrações");
});

test("as imagens dos buckets públicos, pela URL pública, com o sha256", async () => {
  const b = { tabelas: { "storage.buckets": [{ id: "site-imagens", public: true }, { id: "privado", public: false }], "storage.objects": [{ bucket_id: "site-imagens", name: "c1/foto um.webp" }, { bucket_id: "privado", name: "c1/x.pdf" }] }, imagens: [] };
  const urls = [];
  await lerImagens(b, "https://abc.supabase.co/", async url => { urls.push(url); return { ok: true, arrayBuffer: async () => new TextEncoder().encode("bytes").buffer }; });
  assert.deepEqual(urls, ["https://abc.supabase.co/storage/v1/object/public/site-imagens/c1/foto%20um.webp"], "o privado não vai pela URL pública");
  assert.equal(b.imagens[0].sha256, "277089d91c0bdf4f2e6862ba7e4a07605119431f5d13f726dd352b06f1b206a9");
  await assert.rejects(lerImagens({ ...b, imagens: [] }, "https://abc.supabase.co", async () => ({ ok: false, status: 404 })), /não baixou \(404\)/);
});

test("o SQL de restauração: zera, desliga gatilhos, só as colunas do backup, pula o que o destino não tem", () => {
  const backup = { tabelas: { "public.contas": [{ id: "a", nome: "Villa $rz0$ Alecrim", velha: 1 }], "public.atividades": [], "auth.identities": [{ id: "i" }] } };
  const sql = sqlDeRestauracao(backup, { existe: n => n !== "auth.identities", colunas: n => (n === "public.contas" ? ["id", "nome", "nova"] : ["id"]) });
  assert.match(sql, /^set session_replication_role = replica;\ntruncate "public"\."contas", "public"\."atividades" cascade;/);
  assert.match(sql, /insert into "public"\."contas" \("id", "nome"\) overriding system value select "id", "nome" from json_populate_recordset\(null::"public"\."contas", \$rz1\$/, "sem a coluna que o destino não tem nem a que o backup não tem; o marcador não colide com o texto");
  assert.ok(!sql.includes("auth"), "a tabela que o destino não tem fica de fora");
  assert.match(sql, /set session_replication_role = origin;$/);
  assert.equal(marcador("nada aqui"), "$rz0$");
  assert.match(sqlDasSequencias([{ tabela: "public.atividades", coluna: "id" }]), /setval\(pg_get_serial_sequence\('"public"\."atividades"', 'id'\), coalesce\(\(select max\("id"\) from "public"\."atividades"\), 0\) \+ 1, false\)/);
});

test("o workflow semanal: segredos pelo GitHub, artefato de 90 dias e o teste de restauração", () => {
  const y = readFileSync(new URL("../../.github/workflows/backup-painel.yml", import.meta.url), "utf8");
  assert.match(y, /cron: "17 6 \* \* 1"/);
  assert.match(y, /workflow_dispatch/);
  for (const s of ["PAINEL_SUPABASE_ACCESS_TOKEN", "PAINEL_STG_SUPABASE_URL", "PAINEL_PROD_SUPABASE_URL", "BACKUP_SENHA"]) assert.ok(y.includes(`\${{ secrets.${s} }}`), s);
  assert.match(y, /retention-days: 90/);
  assert.match(y, /scripts\/backup\.mjs producao --projeto/);
  assert.match(y, /scripts\/restaurar-backup\.mjs/);
  assert.match(y, /permissions:\n  contents: read/);
  assert.doesNotMatch(y, /sbp_|sb_secret_|eyJ/, "nenhuma chave no arquivo");
  // sem os segredos, termina com aviso em vez de falhar; com eles, todo passo roda
  assert.match(y, /id: segredos/);
  const passos = y.split("\n      - ").slice(2);
  assert.ok(passos.length >= 5 && passos.every(p => p.includes("if: steps.segredos.outputs.ok == 'true'")), "todo passo depois da conferência depende dos segredos");
});
