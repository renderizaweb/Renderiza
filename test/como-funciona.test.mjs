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

test("página de venda curta: abertura, tudo junto (o sol), como funciona, pacotes, perguntas e convite, e nada além", () => {
  const ordem = ["inicio", "tudo-junto", "como-funciona", "pacotes", "perguntas", "contato"].map(id => html.indexOf(`id="${id}"`));
  assert.ok(ordem.every(i => i > 0), "todas as seções existem");
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem, "na ordem");
  assert.equal((html.match(/<section\b/g) || []).length, 6);
  assert.ok(eventos.passos.length <= 3 && eventos.perguntas.length <= 4, "3 passos e até 4 perguntas");
  for (const p of eventos.pacotes) assert.ok(p.inclui.length <= 4, `${p.id}: até 4 itens`);
});

test("lê em uma passada: o texto à vista (sem o que fica fechado em 'saber mais' e nas perguntas, e sem os desenhos) é curto", () => {
  const aberto = textoVisivel(html.replace(/<details[\s\S]*?<\/details>|<div [^>]*hidden>[\s\S]*?<\/div>|<figure[\s\S]*?<\/figure>/g, "")).trim().split(" ").length;
  assert.ok(aberto <= 450, `${aberto} palavras à vista`);
});

test("o sol: o site no centro e, em volta, as redes, o WhatsApp, as avaliações, as fotos e os depoimentos, com uma luz em loop", () => {
  const sol = html.slice(html.indexOf('id="tudo-junto"'), html.indexOf('id="como-funciona"'));
  const nomes = [...sol.matchAll(/<span class="cf-sol-nome">([^<]+)<\/span>/g)].map(m => m[1]);
  assert.deepEqual(nomes, eventos.sol.pontas.map(([, n]) => n));
  for (const n of ["Instagram", "Facebook", "TikTok", "WhatsApp", "Avaliações", "Fotos reais", "Depoimentos"]) assert.ok(nomes.includes(n), n);
  assert.equal((sol.match(/class="cf-luz"/g) || []).length, nomes.length, "uma luz por ponta");
  assert.match(sol, /<div class="cf-sol-site">[\s\S]*seuespaco\.com\.br/, "o site no centro");
  assert.match(sol, /<div class="cf-sol-palco" aria-hidden="true">/);
  assert.match(sol, /<figcaption class="sr-only">Ilustração: Instagram, /, "quem usa leitor de tela ouve a lista");
  // cada ponta fica no círculo, a 38% do centro; as de cima com o nome acima do ícone
  for (const m of sol.matchAll(/--x:([\d.]+)%;--y:([\d.]+)%/g)) assert.ok(Math.abs(Math.hypot(m[1] - 50, m[2] - 50) - 38) < 0.05);
  assert.equal((sol.match(/class="cf-sol-cima"/g) || []).length, 3);
});

test("o sol se move só para quem não pediu menos movimento, e escala pela largura do desenho", () => {
  const css = readFileSync(new URL("../site/como-funciona.css", import.meta.url), "utf8");
  const comMovimento = css.slice(css.indexOf("@media (prefers-reduced-motion:no-preference){\n  .cf-sol"));
  assert.match(comMovimento.slice(0, comMovimento.indexOf("\n}\n")), /\.cf-luz\{animation:cf-luz [^}]*infinite/);
  assert.doesNotMatch(css.replace(/@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*?\n\}\n/g, ""), /\.cf-(luz|sol-[a-z-]+)(::after)?\{[^}]*animation:/, "fora do bloco, nada se mexe");
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\s*\.cf-luz\{display:none\}/);
  assert.match(css, /\.cf-sol\{[^}]*container-type:inline-size/);
});

test("símbolos das redes: só dado de caminho SVG, com a cor de cada marca", async () => {
  const { MARCAS } = await import("../site/marcas.mjs");
  assert.deepEqual(Object.keys(MARCAS).sort(), ["facebook", "google", "instagram", "tiktok", "whatsapp"]);
  for (const [k, m] of Object.entries(MARCAS)) {
    assert.match(m.d, /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/, k);
    assert.match(m.cor, /^#[0-9A-F]{6}$/, k);
  }
});

test("três pacotes com preço (Essencial, Completo, Completo + Anúncios); só o do meio é o recomendado, e ninguém é 'mais vendido' sem venda que prove", () => {
  assert.equal((html.match(/class="cf-pacote(?: cf-pacote-destaque)?"/g) || []).length, 3);
  assert.equal((html.match(/cf-pacote-destaque/g) || []).length - (html.match(/\.cf-pacote-destaque/g) || []).length, 1);
  assert.deepEqual(eventos.pacotes.map(p => p.nome), ["Essencial", "Completo", "Completo + Anúncios"]);
  assert.ok(html.indexOf('id="pacote-completo"') > html.indexOf('cf-pacote cf-pacote-destaque') - 200);
  for (const p of ["R$ 499", "2x de R$ 299", "R$ 699", "2x de R$ 399", "R$ 1.490"]) assert.ok(texto.includes(p), p);
  assert.match(texto, /Mínimo de 3 meses\. Mais o valor dos anúncios, pago direto à Meta/, "anúncios: um valor por mês e o dos anúncios à parte, à vista no cartão");
  assert.match(texto, /O site Completo, já incluso/);
  assert.doesNotMatch(texto, /Preço fechado|pagamento único/, "nada que a própria página desminta");
  assert.doesNotMatch(texto, /mais vendido|campeão de vendas/i);
});

test("o 'saber mais' do Completo explica as páginas extras: 2 pedidos em 12 meses, depois orçadas à parte", () => {
  assert.equal((html.match(/<details class="cf-saber">/g) || []).length, 1);
  assert.match(texto, /2 pedidos nos 12 meses depois de fechar; a partir do 3º, cada página é orçada à parte/);
});

test("cada botão abre o WhatsApp da Renderiza com a mensagem do pacote já escrita", () => {
  const numero = String(config.contato.whatsapp).replace(/\D/g, "");
  for (const p of eventos.pacotes) assert.ok(html.includes(`https://wa.me/${numero}?text=${encodeURIComponent(p.mensagem).replace(/'/g, "&#39;")}`), p.id);
  assert.ok(html.includes(encodeURIComponent(eventos.convite.mensagem)));
});

test("mês de inauguração: até 31/10 o preço grande do Essencial é o do CONTEXTO; depois, volta o de sempre", () => {
  const essencial = html.slice(html.indexOf('id="pacote-essencial"'), html.indexOf('id="pacote-completo"'));
  assert.match(textoVisivel(essencial), /R\$ 399 no Pix ou 2x de R\$ 199 · sem mensalidade Mês de inauguração, até 31\/10\. Depois, R\$ 499\./);
  assert.match(essencial, /<div data-ate="2026-10-31">/, "o script tira o bloco da inauguração depois do dia");
  assert.match(essencial, /<div data-depois="2026-10-31" hidden>\s*<p class="cf-preco"><strong>R\$ 499<\/strong>/, "e mostra o de sempre");
  assert.match(html, /removeAttribute\("hidden"\)/);
  const depois = montarComoFunciona(eventos, config, { hoje: new Date("2026-11-02T12:00:00Z") });
  assert.doesNotMatch(textoVisivel(depois), /inauguração|R\$ 399 no Pix|R\$ 199/i);
  assert.doesNotMatch(depois, /data-ate|data-depois|<script>/);
  assert.match(textoVisivel(depois), /R\$ 499 no Pix ou 2x de R\$ 299/);
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
