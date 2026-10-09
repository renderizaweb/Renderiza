// Site público (/) e o que vai para o ar.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import config from "../site/config.mjs";
import { montarPagina, pendencias, linkWhatsapp, telefoneLegivel, FRASE, TESTE } from "../site/pagina.mjs";
import { arquivosPublicados, comPreviaDoLink, fotoDaCapa } from "../scripts/montar-site.mjs";

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

test("portfólio: um cartão por projeto publicado, com print em alta e pop-up do projeto", () => {
  const html = montarPagina(config);
  const publicados = config.trabalhos.filter(t => t.publicar);
  assert.equal((html.match(/<li class="projeto">/g) || []).length, publicados.length);
  for (const t of publicados) {
    assert.match(html, new RegExp(`data-abrir="projeto-${t.id}"`), t.id);
    assert.match(html, new RegExp(`<dialog class="janela-projeto" id="projeto-${t.id}"`), t.id);
    for (const img of [t.imagem, t.imagemGrande, t.imagemCelular]) {
      assert.ok(img, `${t.id}: falta print`);
      assert.ok(existsSync(new URL(`../site/estatico${img}`, import.meta.url)), img);
    }
    assert.ok(t.resumo && t.resumo.length <= 100, `${t.id}: resumo curto para o cartão`);
  }
  // no celular vira carrossel: setas e pontos para os projetos
  assert.match(html, /<ul class="projetos" id="projetos-lista" data-trilho/);
  assert.equal((html.match(/aria-label="Ver projeto \d+ de/g) || []).length, publicados.length);
});

test("Move: recursos, crédito ao cliente e link dentro do pop-up do projeto", () => {
  const html = montarPagina(config);
  const move = config.trabalhos.find(t => t.id === "move");
  assert.ok(move.publicar);
  for (const r of move.recursos) assert.ok(html.includes(r.titulo), r.titulo);
  // etiqueta IA: uma no cartão e uma por recurso com IA no pop-up do projeto e no "Ver tela"
  assert.equal((html.match(/class="selo-ia"/g) || []).length, 1 + 2 * move.recursos.filter(r => r.ia).length);
  assert.match(html, /com 3 recursos de inteligência artificial/);
  assert.ok(html.includes("Um produto Move, desenvolvido pela Renderiza."));
  assert.match(html, /href="https:\/\/www\.movexfit\.com\.br" target="_blank" rel="noopener">Conhecer o Move/);
});

test("Quem está por trás: os dois cofundadores com o mesmo destaque, foto, papel e texto curto", () => {
  const html = montarPagina(config);
  assert.match(html, /<p class="sobretitulo">Quem está por trás<\/p>/);
  assert.match(html, /<h2 id="sobre-titulo">Somos Kaue e Milena\.<\/h2>/);
  assert.equal((html.match(/<article class="fundador">/g) || []).length, 2);
  for (const f of config.fundadores) {
    assert.ok(f.foto && existsSync(new URL(`../site/estatico${f.foto}`, import.meta.url)), f.foto);
    assert.ok(html.includes(`alt="Foto de ${f.nome}"`), f.nome);
    assert.ok(f.texto.length <= 300, `${f.nome}: texto curto`);
  }
  assert.match(html, /Cofundador · Tecnologia e desenvolvimento/);
  assert.match(html, /Cofundadora · Relacionamento e operações/);
  // Warren citada com leveza; nada de detalhes do trabalho nem de empregadores anteriores da Milena
  assert.match(html, /Desenvolvedor há 5 anos, com foco em produto\. Trabalha em tempo integral na Warren Investimentos/);
  assert.doesNotMatch(html, /abril de 2025|boletagem|CRM|Cauê/);
  assert.match(html, /<a href="#sobre">Quem somos<\/a>/);
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
  assert.ok(html.includes("linkedin.com/in/exemplo"), "LinkedIn no rodapé");
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

test("o site não tem nenhum caminho para o painel: sem link de entrar nem menção a /painel ou /login", () => {
  const html = montarPagina(config);
  assert.doesNotMatch(html, /["'(]\/(login|painel)\b|>Entrar</);
});

test("vão para o ar: home, painel em /painel e /login, demos e arquivos do site; nada de fichas, config ou banco", () => {
  const destinos = arquivosPublicados().map(([d]) => d.split("\\").join("/"));
  for (const d of ["index.html", "painel/index.html", "login/index.html", "painel/src/app.js", "compartilhar.jpg", "favicon.svg", "fontes/geist.woff2"]) assert.ok(destinos.includes(d), d);
  assert.ok(destinos.some(d => /^demo\/[^/]+\/index\.html$/.test(d)));
  for (const d of destinos) assert.doesNotMatch(d, /\.(md|mjs|sql|py)$|^(site|supabase|ferramentas|scripts|src)\//, d);
});

test("demo sai com a prévia do link: meta og: com o nome da loja e a foto do topo em capa.jpg", async () => {
  const lista = new Map(arquivosPublicados().map(([d, o]) => [d.split("\\").join("/"), o]));
  const pagina = lista.get("demo/otica-flash/index.html"), capa = lista.get("demo/otica-flash/capa.jpg");
  assert.equal(typeof pagina, "function");
  const html = await pagina();
  assert.match(html, /<meta property="og:title" content="Ótica Flash[^"]*">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.renderizaweb\.com\.br\/demo\/otica-flash\/capa\.jpg">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/www\.renderizaweb\.com\.br\/demo\/otica-flash">/);
  const jpg = await capa();
  assert.ok(jpg[0] === 0xff && jpg[1] === 0xd8 && jpg.length < 600 * 1024, "JPEG de até 600 KB (limite da prévia do WhatsApp)");
  assert.equal(comPreviaDoLink('<head><meta property="og:title" content="x"></head>', "x", "jpg"), '<head><meta property="og:title" content="x"></head>');
  assert.equal(fotoDaCapa("<p>sem foto</p>"), null);
});

test("vídeos de apresentação: só o MP4 vai ao ar, em /gravacao/<lead>.mp4", () => {
  const destinos = arquivosPublicados().map(([d]) => d.split("\\").join("/")).filter(d => d.startsWith("gravacao/"));
  for (const d of destinos) assert.match(d, /^gravacao\/[\w-]+\.mp4$/, d);
  const pasta = new URL("../gravacoes/", import.meta.url);
  const mp4 = existsSync(pasta) ? readdirSync(pasta).filter(f => f.endsWith(".mp4")) : [];
  assert.equal(destinos.length, mp4.length);
});

test("flyers de Stories: só o PNG vai ao ar, em /flyer/<lead>.png", () => {
  const destinos = arquivosPublicados().map(([d]) => d.split("\\").join("/")).filter(d => d.startsWith("flyer/"));
  for (const d of destinos) assert.match(d, /^flyer\/[\w-]+\.png$/, d);
  const pasta = new URL("../flyers/", import.meta.url);
  const pngs = existsSync(pasta) ? readdirSync(pasta).filter(f => f.endsWith(".png")) : [];
  assert.equal(destinos.length, pngs.length);
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

const secao = (html, id) => html.slice(html.indexOf(`id="${id}"`), html.indexOf("</section>", html.indexOf(`id="${id}"`)));
// Só o texto que a pessoa lê: sem CSS, sem scripts e sem tags.
const textoVisivel = html => html.replace(/<style>[\s\S]*?<\/style>|<script>[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

test("abertura: o que fazemos em 5 segundos, um pedido concreto e dois sites de clientes no celular", () => {
  const html = montarPagina(config);
  const abertura = secao(html, "inicio");
  assert.match(abertura, /<h1 id="abertura-titulo">O site do seu negócio, <em>pronto antes de você pedir\.<\/em><\/h1>/);
  assert.equal(`${FRASE.inicio} ${FRASE.destaque}`, "O site do seu negócio, pronto antes de você pedir.");
  // quem recebeu a prévia confere o perfil: a página confirma em uma linha e mostra quem está por trás
  assert.match(abertura, /<a class="aviso" href="#como-funciona">Recebeu uma prévia do seu site\?/);
  // nome e rosto dos fundadores ficam em "Quem está por trás", não na abertura (já tinham sido tirados antes)
  assert.doesNotMatch(abertura, /Kaue|Milena|fundador|class="rostos"/);
  assert.match(abertura, /href="https:\/\/wa\.me\/5511988697165\?text=[^"]+"[^>]*>.*Quero ver o meu site<\/a>/);
  // os exemplos são sites de clientes do público de hoje (autorizados), não o aplicativo
  const destaques = config.trabalhos.filter(t => t.publicar && t.destaque);
  assert.deepEqual(destaques.map(t => t.id), ["blue-lens", "lu-elegante-modas"]);
  for (const t of destaques) {
    assert.match(abertura, new RegExp(`data-abrir="projeto-${t.id}"[\\s\\S]*?${t.imagemCelular}`), t.id);
    assert.ok(existsSync(new URL(`../site/estatico${t.imagemCelular}`, import.meta.url)), t.imagemCelular);
  }
  assert.doesNotMatch(abertura, /movexfit|aplicativo com IA|class="ilustracao"/);
});

test("a ordem da página é a da venda consultiva (SPIN): situação, problema, necessidade, capacidade e compromisso", () => {
  const html = montarPagina(config);
  const ordem = ["inicio", "por-que", "teste", "solucao", "como-funciona", "trabalhos", "depoimentos", "sobre", "perguntas", "contato"];
  const posicoes = ordem.map(id => html.indexOf(`id="${id}"`));
  for (const [i, id] of ordem.entries()) assert.ok(posicoes[i] > 0, `falta a seção #${id}`);
  for (let i = 1; i < ordem.length; i++) assert.ok(posicoes[i - 1] < posicoes[i], `#${ordem[i - 1]} vem antes de #${ordem[i]}`);
  // o site só aparece como resposta: nada de lista de recursos antes do teste
  const antesDoTeste = html.slice(html.indexOf('id="inicio"'), html.indexOf('id="teste"'));
  assert.doesNotMatch(antesDoTeste, /class="lista-check"|Avaliações do Google<\/li>|Botão para falar no WhatsApp/);
});

test("S · situação: o caminho do cliente novo hoje, sem promessa de Google nem serviço extra", () => {
  const html = montarPagina(config);
  const s = secao(html, "por-que");
  assert.match(s, /Seus clientes te conhecem\. <em>O cliente novo, não\.<\/em>/);
  for (const passo of ["Ouve falar de você", "Pesquisa antes de chamar", "Encontra tudo espalhado"]) assert.ok(s.includes(passo), passo);
  assert.match(s, /E você nem fica sabendo\./);
  assert.doesNotMatch(s, /landing|tráfego|gatilho/i);
  assert.doesNotMatch(s, /Google encontra|busca no Google|algoritmo|sem login|QR|manutenção|vender mais|%/i);
});

test("P e I · o teste: cinco situações, cada uma com o que custa, placar sem JavaScript e WhatsApp com o resultado", () => {
  const html = montarPagina(config);
  const t = secao(html, "teste");
  assert.match(t, /Seu negócio passa <em>nesse teste\?<\/em>/);
  assert.equal(TESTE.length, 5);
  assert.equal((t.match(/<input type="checkbox"/g) || []).length, 5);
  for (const item of TESTE) {
    assert.ok(t.includes(`id="teste-${item.id}"`) && t.includes(`data-rotulo="${item.rotulo}"`), item.id);
    assert.ok(t.includes(item.texto) && t.includes(item.custo), `${item.id}: situação e custo`);
  }
  // sem JS: o placar é um contador do CSS e a barra enche com :has(); o botão já leva uma mensagem pronta
  assert.match(html, /\.teste-itens input:checked\{counter-increment:tem\}/);
  assert.match(html, /\.teste-numero::before\{content:counter\(tem\)\}/);
  assert.match(t, /data-teste-link data-base="https:\/\/wa\.me\/5511988697165"/);
  assert.ok(t.includes(linkWhatsapp(config.contato, "Oi! Fiz o teste no site da Renderiza e quero ver como ficaria o site do meu negócio.").replace(/&/g, "&amp;")));
  // N: a pergunta de necessidade vem antes do pedido
  assert.match(t, /data-pergunta>Se o cliente novo não precisasse perguntar, quanto tempo sobraria para quem já está na sua frente\?/);
  // com JS, a mensagem diz o placar e o que falta, com as palavras do dono
  assert.ok(html.includes('"Oi! Fiz o teste no site da Renderiza: meu negócio tem "+n+" de "+cx.length+"."+(falta.length?" Ainda não tenho "'));
});

test("N · e se o cliente já chegasse sabendo? O site entra como resposta, item por item, e o valor nas palavras de um cliente", () => {
  const html = montarPagina(config);
  const n = secao(html, "solucao");
  assert.match(n, /E se o cliente já chegasse <em>sabendo de tudo\?<\/em>/);
  assert.equal((n.match(/class="contraste-hoje"/g) || []).length, TESTE.length, "uma linha para cada item do teste");
  assert.equal((n.match(/class="contraste-site"/g) || []).length, TESTE.length);
  const davi = config.depoimentos.find(d => d.id === "blue-lens");
  assert.ok(davi.publicar && davi.valor && n.includes(davi.valor), "trecho real do Davi, sem mudar uma palavra");
});

test("capacidade e compromisso: como funciona da prévia ao ar, objeções respondidas antes e um avanço concreto no fim", () => {
  const html = montarPagina(config);
  const como = secao(html, "como-funciona");
  assert.equal((como.match(/<li><h3>/g) || []).length, 5);
  assert.match(como, /Você só paga se decidir colocar o site no ar\./);
  const perguntas = secao(html, "perguntas");
  for (const p of ["Recebi uma prévia do meu site. O que é?", "Já tenho Instagram. Preciso de um site?", "Quanto custa?", "O site fica no meu nome?", "Quem decide é outra pessoa. E agora?"]) assert.ok(perguntas.includes(p), p);
  assert.match(perguntas, /sai do ar sozinho em 7 dias/, "a prévia tem prazo de verdade (middleware.js)");
  const convite = secao(html, "contato");
  assert.match(convite, /Quer ver como ficaria <em>o seu\?<\/em>/);
  assert.ok(convite.includes(linkWhatsapp(config.contato, "Oi! Quero ver como ficaria o site do meu negócio. O Instagram é @").replace(/&/g, "&amp;")));
});

test("sem preço, promessa de resultado, superlativo nem \"de bairro\" no texto da home", () => {
  const texto = textoVisivel(montarPagina(config));
  assert.doesNotMatch(texto, /R\$\s?\d|\d+\s?reais|promoção|desconto/i, "preço é para a conversa");
  assert.doesNotMatch(texto, /de bairro/i);
  assert.doesNotMatch(texto, /melhor(es)? (site|agência|empresa|preço|do Brasil)|n[úu]mero 1|garant|vender mais|mais vendas|\d+\s?%/i);
  assert.doesNotMatch(texto, /Google encontra|busca no Google|primeiro lugar no Google|algoritmo/i);
});

test("imagem de compartilhamento: a mesma frase da abertura", () => {
  const script = readFileSync(new URL("../scripts/imagens-do-site.mjs", import.meta.url), "utf8");
  assert.match(script, /FRASE\.inicio/);
  assert.doesNotMatch(script, /aplicativo com IA|fundadores? da Renderiza/);
  assert.match(montarPagina(config), /<meta property="og:image:alt" content="Renderiza: o site do seu negócio, pronto antes de você pedir\.">/);
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

test("Compasso: problema, recursos com tela real, crédito à Milena e nada da família de verdade", () => {
  const html = montarPagina(config);
  const compasso = config.trabalhos.find(t => t.id === "compasso");
  assert.ok(compasso.publicar);
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
  const aprovado = { ...config, depoimentos: [{ id: "x", nome: "Rafael", papel: "Criador do Move", trabalho: "move", texto: "Texto <aprovado>.", publicar: true }, { id: "y", nome: "Milena", texto: "Texto sem aprovação", publicar: false }] };
  const html = montarPagina(aprovado);
  assert.match(html, /id="depoimentos"/);
  assert.ok(html.includes("Texto &lt;aprovado&gt;."));
  assert.doesNotMatch(html, /Texto sem aprovação/);
  assert.ok(pendencias({ ...config, depoimentos: [{ nome: "Davi", texto: "Oi", publicar: false }] }).some(p => /depoimento de Davi: aguardando aprovação/.test(p)));
});

test("depoimentos em carrossel: lista rolável com rótulo, setas e pontos (setas/pontos ligados pelo JS)", () => {
  const html = montarPagina(config);
  assert.match(html, /<div class="envoltorio carrossel" data-carrossel>/);
  assert.match(html, /<ul class="depoimentos" id="depoimentos-lista" data-trilho tabindex="0" aria-label="Depoimentos \(deslize para o lado\)">/);
  assert.match(html, /<div class="carrossel-setas" hidden>/);
  const publicados = config.depoimentos.filter(d => d.publicar && d.texto).length;
  assert.equal((html.match(/aria-label="Ver depoimento \d+ de/g) || []).length, publicados);
});
