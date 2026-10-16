// Páginas "Como funciona" por nicho (/como-funciona/<nicho>): estrutura, pacotes com preço, contato e as regras de texto.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import config from "../site/config.mjs";
import eventos from "../site/nichos/eventos.mjs";
import { montarComoFunciona, nichosComPagina } from "../site/como-funciona.mjs";
import { arquivosPublicados } from "../scripts/montar-site.mjs";

const html = montarComoFunciona(eventos, config, { hoje: new Date("2026-10-16T12:00:00Z") });
const textoVisivel = h => h.replace(/<style>[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
const texto = textoVisivel(html);

test("cada nicho de site/nichos vira /como-funciona/<nicho>; eventos já está no ar", () => {
  assert.ok(nichosComPagina().includes("eventos"));
  const destinos = arquivosPublicados().map(([d]) => d.split("\\").join("/"));
  assert.ok(destinos.includes("como-funciona/eventos.html"));
});

test("vercel.json: a página não entra no Google e /eventos leva até ela", () => {
  const v = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.ok(v.headers.some(h => h.source === "/como-funciona/(.*)" && h.headers.some(x => x.key === "X-Robots-Tag" && /noindex/.test(x.value))));
  assert.ok(v.redirects.some(r => r.source === "/eventos" && r.destination === "/como-funciona/eventos"));
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
});

test("página de venda curta: abertura, como funciona, pacotes, perguntas e convite, e nada além", () => {
  const ordem = ["inicio", "como-funciona", "pacotes", "perguntas", "contato"].map(id => html.indexOf(`id="${id}"`));
  assert.ok(ordem.every(i => i > 0), "todas as seções existem");
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem, "na ordem");
  assert.equal((html.match(/<section\b/g) || []).length, 5);
  assert.ok(eventos.passos.length <= 3 && eventos.perguntas.length <= 4, "3 passos e até 4 perguntas");
  for (const p of eventos.pacotes) assert.ok(p.inclui.length <= 4, `${p.id}: até 4 itens`);
});

test("lê em uma passada: o texto à vista (sem o que fica fechado em 'saber mais' e nas perguntas) é curto", () => {
  const aberto = textoVisivel(html.replace(/<details[\s\S]*?<\/details>/g, "")).trim().split(" ").length;
  assert.ok(aberto <= 470, `${aberto} palavras à vista`);
});

test("três pacotes com preço (Essencial, Completo, Completo + Anúncios); só o do meio é o recomendado, e ninguém é 'mais vendido' sem venda que prove", () => {
  assert.equal((html.match(/class="cf-pacote(?: cf-pacote-destaque)?"/g) || []).length, 3);
  assert.equal((html.match(/cf-pacote-destaque/g) || []).length - (html.match(/\.cf-pacote-destaque/g) || []).length, 1);
  assert.deepEqual(eventos.pacotes.map(p => p.nome), ["Essencial", "Completo", "Completo + Anúncios"]);
  assert.ok(html.indexOf('id="pacote-completo"') > html.indexOf('cf-pacote cf-pacote-destaque') - 200);
  for (const p of ["R$ 499", "2x de R$ 299", "R$ 699", "2x de R$ 399", "R$ 1.490"]) assert.ok(texto.includes(p), p);
  assert.match(texto, /Mínimo de 3 meses, com o site Completo incluso/, "anúncios: um valor por mês, o site já dentro");
  assert.doesNotMatch(texto, /mais vendido|campeão de vendas/i);
});

test("o 'saber mais' explica as páginas de datas (2 em 12 meses) e o valor dos anúncios (pago direto à Meta)", () => {
  assert.equal((html.match(/<details class="cf-saber">/g) || []).length, 2);
  assert.match(texto, /2 pedidos nos 12 meses depois de fechar/);
  assert.match(texto, /pago direto para a Meta/);
  assert.match(texto, /não faz sessão de fotos/);
});

test("cada botão abre o WhatsApp da Renderiza com a mensagem do pacote já escrita", () => {
  const numero = String(config.contato.whatsapp).replace(/\D/g, "");
  for (const p of eventos.pacotes) assert.ok(html.includes(`https://wa.me/${numero}?text=${encodeURIComponent(p.mensagem).replace(/'/g, "&#39;")}`), p.id);
  assert.ok(html.includes(encodeURIComponent(eventos.convite.mensagem)));
});

test("mês de inauguração: o valor do CONTEXTO aparece no Essencial até 31/10 e some depois", () => {
  assert.match(html, /data-ate="2026-10-31"/);
  const depois = textoVisivel(montarComoFunciona(eventos, config, { hoje: new Date("2026-11-02T12:00:00Z") }));
  assert.doesNotMatch(depois, /mês de inauguração/);
  assert.match(texto, /Mês de inauguração: R\$ 399 no Pix ou 2x de R\$ 199, até 31\/10/);
  assert.doesNotMatch(depois, /R\$ 399 no Pix|R\$ 199/);
});

test("sem promessa de resultado, superlativo, 'de bairro', foto de lead nem caminho para o painel", () => {
  assert.doesNotMatch(texto, /garant|vender mais|mais clientes|mais vendas|melhor(es)? (site|espaço|agência|empresa|preço|do Brasil)|n[úu]mero 1|de bairro|\d+\s?%/i);
  assert.doesNotMatch(html, /<img\b/i, "a ilustração é desenhada, sem foto");
  assert.doesNotMatch(html, /["'(]\/(login|painel|demo)\b/);
});

test("textos do nicho são escapados", () => {
  const n = { ...eventos, abertura: { ...eventos.abertura, aviso: "<b>x</b>" } };
  assert.ok(montarComoFunciona(n, config).includes("&lt;b&gt;x&lt;/b&gt;"));
});
