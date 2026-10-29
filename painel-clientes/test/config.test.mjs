import { test } from "node:test";
import assert from "node:assert/strict";
import { configDoAmbiente } from "../api/config.js";

const URL_STG = "https://abcdefghijklmnopqrst.supabase.co";

test("entrega a URL e a chave pública, com o ambiente", () => {
  const r = configDoAmbiente({ SUPABASE_URL: URL_STG, SUPABASE_ANON_KEY: "sb_publishable_xyz", VERCEL_ENV: "preview" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, { supabaseUrl: URL_STG, supabaseAnonKey: "sb_publishable_xyz", ambiente: "preview" });
});

test("recusa chave secreta (nova e JWT service_role)", () => {
  assert.equal(configDoAmbiente({ SUPABASE_URL: URL_STG, SUPABASE_ANON_KEY: "sb_secret_abc" }).status, 500);
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  const r = configDoAmbiente({ SUPABASE_URL: URL_STG, SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiJ9." + payload + ".x" });
  assert.equal(r.status, 500);
  assert.doesNotMatch(JSON.stringify(r.corpo), /sb_secret|eyJ/);
});

test("recusa o banco do Painel de prospecção", () => {
  const r = configDoAmbiente({ SUPABASE_URL: "https://gxdwluswpczlfgvzxqvg.supabase.co", SUPABASE_ANON_KEY: "sb_publishable_xyz" });
  assert.equal(r.status, 500);
  assert.match(r.corpo.erro, /prospecção/);
});

test("avisa quando falta variável", () => {
  assert.equal(configDoAmbiente({}).status, 500);
  assert.equal(configDoAmbiente({ SUPABASE_URL: URL_STG }).status, 500);
});
