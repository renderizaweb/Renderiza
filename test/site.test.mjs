// Site público (/) e o que vai para o ar.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import config from "../site/config.mjs";
import { montarPagina, pendencias, linkWhatsapp } from "../site/pagina.mjs";
import { arquivosPublicados } from "../scripts/montar-site.mjs";

const comContatos = {
  ...config,
  pessoa: { ...config.pessoa, foto: "/imagens/foto.webp" },
  contato: { ...config.contato, whatsapp: "+55 (11) 90000-0000", linkedin: "https://www.linkedin.com/in/exemplo", instagram: "" },
};

test("home não lista as demos nem trabalhos marcados para não publicar", () => {
  const html = montarPagina(config);
  assert.doesNotMatch(html, /\/demo\//);
  for (const t of config.trabalhos.filter(t => !t.publicar)) assert.ok(!html.includes(t.titulo), t.titulo);
  for (const t of config.trabalhos.filter(t => t.publicar)) assert.ok(html.includes(t.titulo), t.titulo);
});

test("cada trabalho publicado diz se é projeto de cliente ou demonstração", () => {
  const html = montarPagina(config);
  const publicados = config.trabalhos.filter(t => t.publicar);
  const selos = (html.match(/class="selo selo-(cliente|demonstracao)"/g) || []).length;
  assert.equal(selos, publicados.length);
  assert.throws(() => montarPagina({ ...config, trabalhos: [{ ...publicados[0], selo: "case" }] }), /selo desconhecido/);
});

test("sem WhatsApp configurado, nenhum link quebrado: os botões levam ao bloco de contato", () => {
  const html = montarPagina({ ...config, contato: { ...config.contato, whatsapp: "", linkedin: "" } });
  assert.doesNotMatch(html, /wa\.me/);
  assert.match(html, /href="#contato"/);
  assert.match(pendencias({ ...config, contato: { ...config.contato, whatsapp: "" } }).join(), /WhatsApp/);
});

test("com contatos preenchidos, aparecem WhatsApp (com mensagem), LinkedIn e foto", () => {
  const html = montarPagina(comContatos);
  const wa = linkWhatsapp(comContatos.contato);
  assert.match(wa, /^https:\/\/wa\.me\/5511900000000\?text=Oi/);
  assert.ok(html.includes(wa.replace(/&/g, "&amp;")));
  assert.ok((html.match(/linkedin\.com\/in\/exemplo/g) || []).length >= 2);
  assert.match(html, /<img src="\/imagens\/foto\.webp" alt="Foto de /);
  assert.doesNotMatch(html, /Os canais de contato estão sendo atualizados/);
  assert.ok(!pendencias(comContatos).some(p => /WhatsApp|LinkedIn|foto real/.test(p)));
});

test("metadados de compartilhamento são da home, com imagem em endereço completo", () => {
  const html = montarPagina(config);
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<title>Renderiza · Sites para pequenos negócios<\/title>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/[^"]+\/compartilhar\.jpg">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/">/);
  assert.doesNotMatch(html, /Painel Renderiza|noindex|supabase/i);
  assert.ok(html.includes(config.pessoa.trabalhoAtual));
});

test("textos do config são escapados", () => {
  const html = montarPagina({ ...config, trabalhos: [{ ...config.trabalhos[0], titulo: "A <b>&</b>", publicar: true }] });
  assert.ok(html.includes("A &lt;b&gt;&amp;&lt;/b&gt;"));
});

test("vão para o ar: home, painel em /painel e /login, demos e arquivos do site; nada de fichas, config ou banco", () => {
  const destinos = arquivosPublicados().map(([d]) => d.split("\\").join("/"));
  for (const d of ["index.html", "painel/index.html", "login/index.html", "painel/src/app.js", "compartilhar.jpg", "favicon.svg", "fontes/inter.woff2"]) assert.ok(destinos.includes(d), d);
  assert.ok(destinos.some(d => /^demo\/[^/]+\/index\.html$/.test(d)));
  for (const d of destinos) assert.doesNotMatch(d, /\.(md|mjs|sql|py)$|^(site|supabase|ferramentas|scripts|src)\//, d);
});

test("o painel carrega seus arquivos por caminho absoluto (abre em /painel e em /login)", () => {
  const html = readFileSync(new URL("../painel/index.html", import.meta.url), "utf8");
  assert.match(html, /<script type="module" src="\/painel\/src\/app\.js"><\/script>/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(readFileSync(new URL("../painel/src/dados.js", import.meta.url), "utf8"), /fetch\("\/api\/config"/);
});

test("vercel.json: só a home pode ser indexada; painel, login, demos e api não", () => {
  const v = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const semIndice = v.headers.filter(h => h.headers.some(x => x.key === "X-Robots-Tag" && /noindex/.test(x.value))).map(h => h.source);
  for (const s of ["/demo/(.*)", "/painel", "/painel/(.*)", "/login", "/api/(.*)"]) assert.ok(semIndice.includes(s), s);
  assert.ok(!v.headers.some(h => h.source === "/(.*)"));
});
