// scripts/limpar-deploys-vercel.mjs: o que fica e o que vai (a parte que fala com a Vercel precisa do token).
import { test } from "node:test";
import assert from "node:assert/strict";
import { escolher } from "../scripts/limpar-deploys-vercel.mjs";

const d = (uid, created, state, target = null) => ({ uid, created, state, target });

test("limpar deploys: fica o que está no ar, os últimos de produção prontos e o que está montando", () => {
  const deploys = [
    d("p1", 100, "READY", "production"), d("v1", 90, "READY"), d("p2", 80, "READY", "production"),
    d("e1", 70, "ERROR", "production"), d("p3", 60, "READY", "production"), d("c1", 50, "CANCELED"),
    d("p4", 40, "READY", "production"), d("b1", 110, "BUILDING"), d("v2", 30, "READY"),
  ];
  const { manter, apagar } = escolher(deploys, { noAr: "p4", manter: 2 });
  assert.deepEqual(manter.map(x => x.uid), ["b1", "p1", "p2", "p4"], "o no ar fica mesmo sendo antigo (voltou para ele)");
  assert.deepEqual(apagar.map(x => x.uid), ["v1", "e1", "p3", "c1", "v2"]);
});

test("limpar deploys: sem saber o que está no ar, ficam os últimos 3 de produção prontos", () => {
  const deploys = [d("p1", 3, "READY", "production"), d("p2", 2, "READY", "production"), d("p3", 1, "READY", "production"), d("p4", 0, "READY", "production")];
  assert.deepEqual(escolher(deploys).apagar.map(x => x.uid), ["p4"]);
  assert.deepEqual(escolher([]).apagar, []);
});
