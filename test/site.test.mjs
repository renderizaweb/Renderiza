// Site público (/) e o que vai para o ar.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import config from "../site/config.mjs";
import { montarPagina, pendencias, linkWhatsapp, telefoneLegivel } from "../site/pagina.mjs";
import { arquivosPublicados } from "../scripts/montar-site.mjs";

const comContatos = {
  ...config,
  pessoa: { ...config.pessoa, foto: "/imagens/foto.webp" },
  contato: { ...config.contato, whatsapp: "+55 (11) 90000-0000", linkedin: "https://www.linkedin.com/in/exemplo", instagram: "" },
};

test("home não lista as demos nem trabalhos marcados para não publicar", () => {
  const html = montarPagina(config);
  assert.doesNotMatch(html, /\/demo\//);
  // nome de projeto oculto só pode aparecer como a empresa de quem deu um depoimento publicado
  const empresas = new Set((config.depoimentos || []).filter(d => d.publicar).map(d => d.papel));
  for (const t of config.trabalhos.filter(t => !t.publicar && !empresas.has(t.titulo))) assert.ok(!html.includes(t.titulo), t.titulo);
  for (const t of config.trabalhos.filter(t => t.publicar)) assert.ok(html.includes(t.titulo), t.titulo);
});

test("nenhuma demonstração de ótica na home enquanto não houver aprovação de cliente", () => {
  assert.deepEqual(config.trabalhos.filter(t => t.publicar && t.selo === "demonstracao").map(t => t.id), []);
  const html = montarPagina(config);
  assert.match(html, /<h2 id="trabalhos-titulo">Projetos de clientes\.<\/h2>/);
  assert.doesNotMatch(html, /Demonstração conceitual/);
});

test("WhatsApp da Renderiza aparece legível e com link", () => {
  assert.equal(telefoneLegivel("5511988697165"), "(11) 98869-7165");
  assert.equal(telefoneLegivel("1133334444"), "(11) 3333-4444");
  const html = montarPagina(config);
  assert.match(html, /WhatsApp \(11\) 98869-7165<\/a>/, "número legível no rodapé, com link");
  assert.doesNotMatch(html, /WhatsApp oficial|class="assinatura"/, "abertura sem selo nem assinatura");
  assert.match(html, /href="https:\/\/wa\.me\/5511988697165\?text=[^"]+"/);
});

test("demonstração publicada sempre ganha a etiqueta; selo inválido é recusado", () => {
  const demo = { ...config.trabalhos.find(t => t.selo === "demonstracao"), publicar: true };
  const html = montarPagina({ ...config, trabalhos: [demo] });
  assert.match(html, /Demonstração conceitual/);
  assert.match(html, /Projetos de clientes e demonstrações\./);
  assert.throws(() => montarPagina({ ...config, trabalhos: [{ ...demo, selo: "case" }] }), /selo desconhecido/);
});

test("Move em destaque: print, recursos, crédito ao cliente e link", () => {
  const html = montarPagina(config);
  const move = config.trabalhos.find(t => t.id === "move");
  assert.ok(move.publicar && move.destaque);
  assert.match(html, /<article class="destaque">/);
  for (const r of move.recursos) assert.ok(html.includes(r.titulo), r.titulo);
  // etiqueta IA no cartão e no pop-up de cada recurso com IA
  assert.equal((html.match(/class="selo-ia"/g) || []).length, 2 * move.recursos.filter(r => r.ia).length);
  assert.match(html, /com 3 recursos de inteligência artificial/);
  assert.ok(html.includes("Um produto Move, desenvolvido pela Renderiza."));
  assert.match(html, /href="https:\/\/www\.movexfit\.com\.br" target="_blank" rel="noopener">Conhecer o Move/);
});

test("Quem faz: foco em produto, Warren citada com leveza e Renderiza como projeto paralelo independente", () => {
  const html = montarPagina(config);
  assert.doesNotMatch(html, /abril de 2025|boletagem|CRM/);
  assert.match(html, /desenvolvedor há 5 anos, com foco em produto/);
  assert.match(html, /Atuo em tempo integral na Warren Investimentos e, em paralelo, conduzo a Renderiza, meu projeto independente/);
  assert.doesNotMatch(html, /Recebeu uma mensagem minha|Sou eu mesmo|focado em óticas/);
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
  assert.match(html, /<title>Renderiza · Sites e aplicativos para o seu negócio<\/title>/);
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

test("abertura: frase concreta e trabalho real (Move), sem a ilustração esquemática", () => {
  const html = montarPagina(config);
  assert.match(html, /<h1 id="abertura-titulo">Do site da loja ao <em>aplicativo com IA<\/em>\.<\/h1>/);
  assert.match(html, /<figure class="vitrine">[\s\S]*movexfit\.com\.br[\s\S]*\/imagens\/move-celular\.webp/);
  assert.doesNotMatch(html, /Sites bonitos e leves|class="ilustracao"/);
});

test("por que ter um site: centraliza, profissionaliza e fica pronto para anúncios, sem promessa de Google nem serviço extra", () => {
  const html = montarPagina(config);
  const secao = html.slice(html.indexOf('<section class="dor"'), html.indexOf('<section class="secao" id="servicos"'));
  assert.match(secao, /Seus clientes te conhecem\. <em>O cliente novo, não\.<\/em>/);
  for (const titulo of ["Tudo num lugar só", "Mais profissional", "Pronto para anunciar"]) assert.ok(secao.includes(titulo), titulo);
  assert.doesNotMatch(secao, /landing|tráfego|gatilho/i);
  assert.doesNotMatch(secao, /Google encontra|busca no Google|algoritmo|sem login|QR|manutenção|vender mais|%/i);
  assert.ok(html.indexOf('id="por-que"') < html.indexOf('id="servicos"'));
});

test("cada recurso da Move tem botão 'Ver tela' que abre um pop-up com tela real e link para o site da Move", () => {
  const html = montarPagina(config);
  const move = config.trabalhos.find(t => t.id === "move");
  const botoes = [...html.matchAll(/data-abrir="(recurso-move-[^"]+)"/g)].map(m => m[1]);
  assert.equal(botoes.length, move.recursos.length);
  for (const id of botoes) {
    const janela = html.slice(html.indexOf(`<dialog class="janela-recurso" id="${id}"`), html.indexOf("</dialog>", html.indexOf(`id="${id}"`)));
    assert.ok(janela.length > 0, id);
    assert.match(janela, /<img src="\/imagens\/move\/[a-z-]+\.webp"[^>]*loading="lazy"/);
    assert.match(janela, /href="https:\/\/www\.movexfit\.com\.br\/#[a-z-]+" target="_blank"/);
    assert.match(janela, /Tela real do app, com dados de exemplo\./);
    assert.match(janela, /<form method="dialog">/);
  }
  for (const r of move.recursos) assert.ok(existsSync(new URL(`../site/estatico${r.imagem}`, import.meta.url)), r.imagem);
});

test("Compasso em destaque: problema, recursos com tela real, crédito à Milena e nada da família de verdade", () => {
  const html = montarPagina(config);
  const compasso = config.trabalhos.find(t => t.id === "compasso");
  assert.ok(compasso.publicar && compasso.destaque);
  assert.ok(html.includes("Uma ideia da Milena, desenvolvida pela Renderiza."));
  for (const r of compasso.recursos) assert.ok(html.includes(r.titulo), r.titulo);
  const telas = compasso.recursos.filter(r => r.imagem);
  assert.equal([...html.matchAll(/data-abrir="recurso-compasso-/g)].length, telas.length);
  for (const r of telas) assert.ok(existsSync(new URL(`../site/estatico${r.imagem}`, import.meta.url)), r.imagem);
  assert.match(html, /class="janela-recurso janela-paisagem" id="recurso-compasso-planejamento-em-grade"/);
  assert.doesNotMatch(html, /Kaleb|Babá|Fraldas|KAUE & MILENA/);
  assert.ok(html.indexOf('recurso-move-') < html.indexOf('recurso-compasso-'), "Move vem antes");
});

test("depoimentos: seção só aparece com depoimento aprovado", () => {
  assert.doesNotMatch(montarPagina({ ...config, depoimentos: config.depoimentos.map(d => ({ ...d, publicar: false })) }), /id="depoimentos"/);
  const real = montarPagina(config);
  assert.match(real, /id="depoimentos"/);
  assert.ok(real.includes("Criador do Move"));
  assert.ok(real.includes("Ótica Blulens") && !/BlueLens/.test(real), "nome da ótica como ela escreve");
  assert.doesNotMatch(real, /Graças a Deus/, "na home vai só o trecho do depoimento");
  const aprovado = { ...config, depoimentos: [{ id: "x", nome: "Rafael", papel: "Criador do Move", trabalho: "move", texto: "Texto <aprovado>.", publicar: true }, { id: "y", nome: "Milena", texto: "Ainda não", publicar: false }] };
  const html = montarPagina(aprovado);
  assert.match(html, /id="depoimentos"/);
  assert.ok(html.includes("Texto &lt;aprovado&gt;."));
  assert.doesNotMatch(html, /Ainda não/);
  assert.ok(pendencias({ ...config, depoimentos: [{ nome: "Davi", texto: "Oi", publicar: false }] }).some(p => /depoimento de Davi: aguardando aprovação/.test(p)));
});

test("depoimentos em carrossel: lista rolável com rótulo, setas e pontos (setas/pontos ligados pelo JS)", () => {
  const html = montarPagina(config);
  assert.match(html, /<div class="envoltorio carrossel" data-carrossel>/);
  assert.match(html, /<ul class="depoimentos" id="depoimentos-lista" tabindex="0" aria-label="Depoimentos \(deslize para o lado\)">/);
  assert.match(html, /<div class="carrossel-setas" hidden>/);
  const publicados = config.depoimentos.filter(d => d.publicar && d.texto).length;
  assert.equal((html.match(/data-ir="/g) || []).length, publicados);
});
