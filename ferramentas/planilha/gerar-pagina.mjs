#!/usr/bin/env node
// Demo/proposta da planilha financeira: demos/<pasta>/index.html → /demo/<pasta>, como qualquer demo (scripts/montar-site.mjs):
// o lead do painel com link_demo = /demo/<pasta> ganha o contador (tela Atividade), o prazo de 7 dias (seção Demo),
// "Copiar link da demo" e a prévia com foto no WhatsApp. As imagens vão dentro da página (o build as separa em
// /demo/<pasta>/f/); os dois arquivos para baixar ficam ao lado e o build os publica como estão: a versão de teste
// (<arquivo>-TESTE.xlsx) e, depois do Pix, a planilha do cliente cifrada com um código (planilha.bin; AES-GCM, chave tirada
// do código por PBKDF2). A página só decifra no navegador de quem digita o código certo: sem servidor, sem banco e sem a
// planilha do cliente à vista no repositório.
//
// Antes: python3 -I ferramentas/planilha/gerar-planilha.py demos/<pasta>/planilha.json --conferir --imagens
// Uso:
//   node ferramentas/planilha/gerar-pagina.mjs <pasta>                    página + versão de teste (a dela fica "sendo preparada")
//   node ferramentas/planilha/gerar-pagina.mjs <pasta> --codigo           também cifra a dela, com um código novo (aparece aqui)
//   node ferramentas/planilha/gerar-pagina.mjs <pasta> --codigo ABCD-2345 com este código
//   node ferramentas/planilha/gerar-pagina.mjs <pasta> --sem-a-dela       tira a cifrada (volta a "sendo preparada")
// O código nunca vai para o git: fica só em rascunhos/planilha/<pasta>/codigo.txt e no WhatsApp do cliente.
// Textos e valor: "pagina" em demos/<pasta>/planilha.json (sem "valor", a página sai sem o bloco de investimento); a foto da
// prévia do link vem da demo do site do mesmo cliente ("demo_do_site"). Como funciona e o porquê:
// docs/produtos/planilha-financeira.md.

import { createHash, webcrypto } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ITERACOES = 600000;
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I/L: não confunde ao digitar

export const normalizar = codigo => String(codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export function codigoNovo() {
  const b = webcrypto.getRandomValues(new Uint8Array(8));
  const s = Array.from(b, x => ALFABETO[x % ALFABETO.length]).join("");
  return s.slice(0, 4) + "-" + s.slice(4);
}

/** "RZP1" + iterações (4 bytes) + sal (16) + iv (12) + dados cifrados com a etiqueta do GCM. */
export async function cifrar(dados, codigo, iteracoes = ITERACOES) {
  const sal = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const base = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(normalizar(codigo)), "PBKDF2", false, ["deriveKey"]);
  const chave = await webcrypto.subtle.deriveKey({ name: "PBKDF2", salt: sal, iterations: iteracoes, hash: "SHA-256" }, base,
    { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const cifrado = new Uint8Array(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, chave, dados));
  const cab = new Uint8Array(8);
  cab.set(new TextEncoder().encode("RZP1"));
  new DataView(cab.buffer).setUint32(4, iteracoes);
  return Buffer.concat([cab, sal, iv, cifrado]);
}

export async function decifrar(pacote, codigo) {
  const b = new Uint8Array(pacote);
  const iteracoes = new DataView(b.buffer, b.byteOffset).getUint32(4);
  const base = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(normalizar(codigo)), "PBKDF2", false, ["deriveKey"]);
  const chave = await webcrypto.subtle.deriveKey({ name: "PBKDF2", salt: b.slice(8, 24), iterations: iteracoes, hash: "SHA-256" }, base,
    { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  return Buffer.from(await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(24, 36) }, chave, b.slice(36)));
}

const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const versao = arquivo => createHash("sha256").update(readFileSync(arquivo)).digest("hex").slice(0, 10);

function tamanhoWebp(arquivo) {
  const b = readFileSync(arquivo); // VP8X/VP8/VP8L: o suficiente para width/height no <img>
  const tipo = b.toString("ascii", 12, 16);
  if (tipo === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (tipo === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (tipo === "VP8L") { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  return [1200, 800];
}

export function pagina({ pasta, cfg, imagens, teste, cifrada, whatsapp, capa }) {
  const p = cfg.pagina || {};
  const base = `/demo/${pasta}`;
  const dados = nome => `data:image/webp;base64,${imagens[nome].b64}`;
  // Com a versão de celular (<nome>-cel.webp), a tela estreita recebe o recorte feito para ela.
  const img = (nome, alt, primeira = false) => {
    const { w, h } = imagens[nome];
    const cel = imagens[nome + "-cel"];
    const fonte = cel ? `<source media="(max-width: 700px)" srcset="${dados(nome + "-cel")}" width="${cel.w}" height="${cel.h}">` : "";
    return `<a class="foto" href="${dados(nome)}" target="_blank" rel="noopener"><picture>${fonte}<img src="${dados(nome)}" width="${w}" height="${h}" alt="${esc(alt)}"${primeira ? ' fetchpriority="high"' : ' loading="lazy"'}></picture></a>`;
  };
  const textoWa = encodeURIComponent("Oi! Vi a proposta da planilha financeira e queria tirar uma dúvida.");
  const pedidos = [
    ["que vai somando sozinho, por mês", "O <b>Início</b> mostra o mês que você escolher: quanto entrou, quanto saiu e quanto sobrou. O <b>Resumo do ano</b> põe os 12 meses lado a lado."],
    ["espaço para aniversários, ensaios", "Aba <b>Ensaios</b>: uma linha por ensaio, com o tipo (aniversário, smash the cake, acompanhamento mensal, gestante, Natal…). Você vê quanto rendeu cada tipo."],
    ["aba de foto extra", "Aba <b>Fotos extras</b>: o cliente, quantas fotos e o valor. O Início conta quantas você vendeu no mês."],
    ["gastos estúdio por nicho: aluguel, bexigas, cenários, luz", "Aba <b>Estúdio</b>, com 14 tipos de gasto e espaço para criar os seus. O Resumo separa tipo por tipo."],
    ["gastos fixos pessoais", "Aba <b>Fixos pessoais</b>, como a sua de hoje: uma conta por linha, os meses lado a lado e o dia em que vence. Cabem 30 contas."],
    ["gastos mensais como Uber, Shopee, Mercado Livre", "Aba <b>Gastos do mês</b>: Uber, Shopee, Mercado Livre, mercado, iFood, farmácia e o que mais você quiser."],
    ["escrever o que é cada gasto e cada valor", "Em todas as abas: <b>o que foi</b>, com as suas palavras, e o <b>valor</b>."],
    ["mais linhas pras coisas", "<b>2.000 linhas</b> em cada aba de lançamento. Dá para anos."],
  ];
  const vem = (p.o_que_vem || []).map(t => `<li>${esc(t)}</li>`).join("");
  const online = p.online ? `<a class="bt bt-linha" href="${esc(p.online)}" target="_blank" rel="noopener" data-rz-alvo="testar-online">Testar no navegador, sem baixar</a>` : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sua planilha financeira · ${esc(cfg.nome)}</title>
<meta name="description" content="Proposta da Renderiza: a planilha financeira do ${esc(cfg.nome)}, que soma sozinha, mês a mês. Teste antes de decidir.">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${cfg.cores.acento}">
<meta property="og:type" content="website">
<meta property="og:title" content="Sua planilha financeira · ${esc(cfg.nome)}">
<meta property="og:description" content="Tudo o que entra e sai do estúdio e da casa, somando sozinho, mês a mês. Teste antes de decidir.">
${capa ? `<meta property="og:image" content="${capa}">\n` : ""}<meta property="og:url" content="https://www.renderizaweb.com.br${base}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<!-- Gerada por ferramentas/planilha/gerar-pagina.mjs (não editar à mão): demo/proposta da planilha financeira, ${new Date().toISOString().slice(0, 10)}.
     O contador conta as visitas no lead com link_demo = /demo/${pasta}. -->
<script src="/exemplos/visitas.js" data-pagina="demo" data-demo="${pasta}" defer></script>
<style>
:root{--fundo:#fbf8f7;--papel:#fffefd;--areia:${cfg.cores.areia};--linha:#e8ddd9;--tinta:${cfg.cores.tinta};--tinta-2:#6a5b5d;
  --rosa:${cfg.cores.rosa};--acento:${cfg.cores.acento};--escuro:${cfg.cores.acento_escuro};--verde:#2f6b47;
  --titulo:"Cormorant Garamond",Georgia,serif;--raio:18px;--sombra:0 1px 2px rgba(47,38,39,.05),0 18px 40px -26px rgba(47,38,39,.35)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;scroll-padding-top:70px;-webkit-text-size-adjust:100%}
body{font-family:Jost,system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--fundo);color:var(--tinta);font-size:16.5px;line-height:1.6;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%;height:auto}
a{color:inherit}
b{font-weight:600}
:focus-visible{outline:3px solid var(--rosa);outline-offset:3px;border-radius:6px}
.cx{width:min(1060px,100% - 32px);margin-inline:auto}
/* Títulos na itálica 500: na reta (400 a 600) do Google Fonts, o Chromium põe o acento de "mês", "Você" e "Está" fora do lugar
   (conferido em 18/11/2026; a demo dela tem o mesmo no "Quem está"). A itálica 500 sai certa. */
h1,h2{font-family:var(--titulo);font-style:italic;font-weight:500;letter-spacing:-.005em;line-height:1.08;color:var(--escuro)}
h1{font-size:clamp(36px,8.4vw,58px)}
h2{font-size:clamp(30px,6.6vw,44px)}
h3{font-size:18px;font-weight:600}
.kicker{font-size:12.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--acento)}
.sub{color:var(--tinta-2);max-width:620px;margin-top:14px}
section{padding:64px 0}
.bt{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 24px;border-radius:999px;font:inherit;font-weight:600;font-size:16px;text-decoration:none;border:0;cursor:pointer;text-align:center}
.bt svg{width:20px;height:20px;flex:none}
.bt-cheio{background:var(--acento);color:#fff}
.bt-cheio:hover{background:var(--escuro)}
.bt-linha{background:var(--papel);color:var(--escuro);border:1.5px solid var(--rosa)}
.bt:disabled{opacity:.65;cursor:default}
.botoes{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.nota{font-size:14px;color:var(--tinta-2);margin-top:14px}

.topo{position:sticky;top:0;z-index:20;background:rgba(251,248,247,.92);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--linha)}
.topo .cx{display:flex;align-items:center;gap:12px;height:60px}
.topo .marca{font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:13px;color:var(--escuro)}
.topo small{color:var(--tinta-2);font-size:13px}
.topo .bt{margin-left:auto;min-height:40px;padding:0 16px;font-size:14px}
@media (max-width:420px){.topo small{display:none}}

.capa{padding:44px 0 56px;background:radial-gradient(80% 70% at 100% 0,#f6e3e5 0,rgba(246,227,229,0) 70%)}
.capa .cx{display:grid;gap:34px;align-items:center}
.script{font-family:Allura,cursive;font-size:clamp(34px,8vw,44px);color:var(--acento);line-height:1;margin:10px 0 6px}
.capa .foto{border-radius:var(--raio);overflow:hidden;box-shadow:var(--sombra);border:1px solid var(--linha);background:#fff}
figure figcaption{font-size:13.5px;color:var(--tinta-2);margin-top:10px}
@media (min-width:880px){.capa .cx{grid-template-columns:1fr 1.05fr}}

.pedidos{display:grid;gap:14px;margin-top:30px}
@media (min-width:720px){.pedidos{grid-template-columns:1fr 1fr}}
.pedido{background:var(--papel);border:1px solid var(--linha);border-radius:var(--raio);padding:20px 20px 22px}
.pedido q{display:block;font-family:var(--titulo);font-style:italic;font-size:22px;line-height:1.2;color:var(--escuro);quotes:"“" "”"}
.pedido p{margin-top:10px;color:var(--tinta-2);font-size:15.5px}
.pedido p::before{content:"";display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--verde);margin-right:9px;vertical-align:1px}

.passos{display:grid;gap:34px;margin-top:34px;counter-reset:passo}
.passo{display:grid;gap:16px}
.passo h3{display:flex;align-items:center;gap:12px;font-size:20px}
.passo h3::before{counter-increment:passo;content:counter(passo);display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50%;background:var(--acento);color:#fff;font-size:15px}
.passo p{color:var(--tinta-2);max-width:640px}
.passo .foto{border-radius:14px;overflow:hidden;border:1px solid var(--linha);background:#fff;box-shadow:var(--sombra)}
.foto{display:block}
.rolar{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:14px}
.rolar .foto{width:max-content}
.rolar .foto img{max-width:none;width:880px}
@media (max-width:700px){.rolar .foto img.resumo{width:640px}}
@media (min-width:880px){.rolar .foto{width:auto}.rolar .foto img{width:100%}}
.dica{font-size:13px;color:var(--tinta-2);margin-top:6px}
@media (min-width:880px){.dica{display:none}}

.cartao{background:var(--areia);border-radius:var(--raio);padding:30px 24px}
.cartao h2{font-size:clamp(26px,5.6vw,36px)}
.cartao p{margin-top:12px;max-width:700px}

.teste{display:grid;gap:26px}
.teste ul{list-style:none;display:grid;gap:10px;margin-top:20px}
.teste li{padding-left:28px;position:relative}
.teste li::before{content:"";position:absolute;left:4px;top:.62em;width:10px;height:10px;border-radius:3px;background:var(--rosa)}

.valor{background:var(--papel);border:1px solid var(--linha);border-radius:24px;padding:34px 24px;box-shadow:var(--sombra)}
.valor .preco{font-family:var(--titulo);font-weight:600;font-size:clamp(46px,11vw,64px);color:var(--escuro);line-height:1;margin-top:12px}
.valor .preco small{font-family:Jost,sans-serif;font-size:16px;font-weight:500;color:var(--tinta-2);margin-left:8px;letter-spacing:0}
.valor ul{list-style:none;display:grid;gap:12px;margin:22px 0 4px}
.valor li{padding-left:30px;position:relative}
.valor li::before{content:"✓";position:absolute;left:2px;top:0;color:var(--verde);font-weight:600}

.sua{background:var(--escuro);color:#fff;border-radius:24px;padding:34px 24px}
.sua h2{color:#fff}
.sua p{color:#f3dfe2;margin-top:10px}
.sua form{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.sua input{flex:1 1 220px;min-height:52px;border-radius:999px;border:0;padding:0 22px;font:inherit;font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:var(--tinta);background:#fff}
.sua input::placeholder{letter-spacing:.02em;text-transform:none;color:#9b8f91}
.sua .bt{background:var(--rosa);color:var(--tinta)}
.sua [data-aviso]{min-height:1.6em;margin-top:14px;font-weight:500;color:#fff}

footer{padding:40px 0 56px;color:var(--tinta-2);font-size:14px;border-top:1px solid var(--linha);margin-top:30px}
footer .cx{display:grid;gap:8px}
footer a{color:var(--escuro);font-weight:600}
</style>
</head>
<body>
<header class="topo"><div class="cx">
  <span class="marca">Renderiza</span><small>proposta · planilha financeira</small>
  <a class="bt bt-cheio" href="#teste">Testar</a>
</div></header>

<main>
<section class="capa" id="inicio" aria-label="Início"><div class="cx">
  <div>
    <p class="kicker">Planilha financeira sob medida</p>
    <p class="script">${esc(cfg.nome)}</p>
    <h1>Tudo o que entra e sai, somando sozinho, mês a mês.</h1>
    <p class="sub">Do jeito que você pediu: os ensaios e aniversários, as fotos extras, os gastos do estúdio por tipo, os fixos da casa e os gastos do mês. Em cada linha, você escreve o que foi e o valor. O resto a planilha faz.</p>
    <div class="botoes">
      <a class="bt bt-cheio" href="#teste">Quero testar</a>
      <a class="bt bt-linha" href="#como-funciona">Ver como funciona</a>
    </div>
    <p class="nota">No Excel ou no Google Planilhas, no computador ou no celular. Sem login e sem mensalidade.</p>
  </div>
  <figure>${img("inicio", "A primeira aba da planilha: o mês com entrou, saiu e sobrou em números grandes", true)}
    <figcaption>A primeira aba: o mês em números grandes. Os valores são de exemplo, inventados.</figcaption></figure>
</div></section>

<section id="pedidos" aria-label="O que você pediu" style="padding-top:20px"><div class="cx">
  <p class="kicker">O que você pediu</p>
  <h2>Você pediu. Está aqui.</h2>
  <div class="pedidos">
${pedidos.map(([q, r]) => `    <div class="pedido"><q>${esc(q)}</q><p>${r}</p></div>`).join("\n")}
  </div>
</div></section>

<section id="como-funciona" aria-label="Como funciona" style="padding-top:20px"><div class="cx">
  <p class="kicker">Como funciona</p>
  <h2>Você lança. A planilha soma.</h2>
  <div class="passos">
    <div class="passo">
      <h3>Uma linha para cada coisa</h3>
      <p>A data, o que foi, o tipo (escolhido na setinha) e o valor. Esqueceu a data? A célula fica vermelha para avisar, e o Início mostra quantas linhas ficaram de fora das contas.</p>
      <div class="rolar">${img("ensaios", "A aba Ensaios: data, cliente, tipo de ensaio, valor e observação")}</div>
      <p class="dica">Arraste para o lado para ver a imagem inteira.</p>
    </div>
    <div class="passo">
      <h3>O Resumo do ano se preenche sozinho</h3>
      <p>Cada tipo de ensaio e cada tipo de gasto, mês a mês: quanto rendeu o Natal, quanto foi em bexigas, quanto o estúdio deu depois de pagar as contas dele. O tracinho quer dizer zero.</p>
      <div class="rolar">${img("resumo", "O Resumo do ano: entrou, saiu, sobrou e cada tipo de ensaio, mês a mês").replace("<img ", '<img class="resumo" ')}</div>
      <p class="dica">Arraste para o lado para ver até o total do ano. No celular, a imagem mostra de agosto em diante.</p>
    </div>
    <div class="passo">
      <h3>E o gráfico mostra o ano</h3>
      <p>Os meses bons e os apertados, lado a lado. No exemplo, outubro ficou no vermelho por causa do cenário de Natal, e novembro pagou a conta.</p>
      ${img("grafico", "Gráfico com o que entrou, saiu e sobrou em cada mês")}
    </div>
  </div>
</div></section>

<section id="cartao" aria-label="Cartão de crédito" style="padding-top:10px"><div class="cx">
  <div class="cartao">
    <p class="kicker">Um detalhe que faz diferença</p>
    <h2>O cartão de crédito não é um gasto. É um jeito de pagar.</h2>
    <p>Quando o cartão entra como uma linha de gasto, a compra some lá dentro: não dá para saber se foi bexiga, consulta ou Shopee. Aqui, cada compra vai para o tipo dela, e você marca “Crédito” em <b>Como pagou</b>. A planilha mostra quanto foi no cartão no mês, para você conferir com a fatura, sem contar nada duas vezes.</p>
  </div>
</div></section>

<section id="teste" aria-label="Teste antes" style="padding-top:10px"><div class="cx teste">
  <div>
    <p class="kicker">Teste antes de decidir</p>
    <h2>Baixe, abra e mexa à vontade.</h2>
    <p class="sub">A versão de teste vem com dados de exemplo (inventados) para você ver tudo funcionando. Troque valores, apague, escreva: é para mexer.</p>
    <div class="botoes">
      <a class="bt bt-cheio" href="${base}/${esc(teste.nome)}?v=${teste.v}" download="${esc(teste.nome)}" data-rz-alvo="baixar-teste"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14"/></svg>Baixar a versão de teste</a>
      ${online}
    </div>
    <ul>
      <li><b>No celular:</b> toque em Baixar e abra com o app Excel ou o Planilhas Google.</li>
      <li><b>No computador:</b> abra com o Excel (ou envie para o Google Drive e abra com o Planilhas).</li>
      <li><b>Para ver outro mês:</b> na primeira aba, troque o mês na setinha.</li>
      <li>A versão de teste tem 60 linhas por aba. A sua vem com 2.000.</li>
    </ul>
  </div>
</div></section>

${p.valor ? `<section id="investimento" aria-label="Investimento" style="padding-top:10px"><div class="cx">
  <div class="valor">
    <p class="kicker">Investimento</p>
    <p class="preco">${esc(p.valor || "")}<small>valor único</small></p>
    <p class="sub">A planilha é sua: sem mensalidade, sem login, sem depender da gente para usar.</p>
    <ul>${vem}</ul>
    <p class="nota">Gostou? É só responder a nossa mensagem no WhatsApp. Depois do Pix, você recebe a sua planilha pelo WhatsApp e um código para baixar aqui quando quiser.</p>
  </div>
</div></section>` : ""}

<section id="sua" aria-label="Baixar a sua" style="padding-top:10px"><div class="cx">
  <div class="sua">
    <p class="kicker" style="color:var(--rosa)">Sua planilha</p>
    <h2>Já recebeu o código?</h2>
    <p>Digite aqui o código que a gente mandou no WhatsApp para baixar a sua planilha.</p>
    <form data-liberar${cifrada ? ` data-cifrada="${base}/planilha.bin?v=${cifrada.v}"` : ""} data-nome="${esc(cfg.arquivo)}.xlsx" autocomplete="off">
      <label for="codigo" style="position:absolute;left:-9999px">Código</label>
      <input id="codigo" name="codigo" inputmode="text" autocapitalize="characters" spellcheck="false" placeholder="Ex.: ABCD-2345" maxlength="14">
      <button class="bt" type="submit" data-rz-alvo="liberar-planilha">Baixar a minha planilha</button>
    </form>
    <p data-aviso role="status" aria-live="polite"></p>
  </div>
</div></section>
</main>

<footer><div class="cx">
  <p>Feita sob medida pela <b>Renderiza</b> · renderizaweb.com.br</p>
  <p>Dúvida? <a href="https://wa.me/${whatsapp}?text=${textoWa}">Fale com a gente no WhatsApp</a>.</p>
  <p>As imagens mostram dados de exemplo, inventados.</p>
</div></footer>

<script>
(function () {
  var f = document.querySelector("[data-liberar]");
  if (!f) return;
  var campo = f.querySelector("input"), botao = f.querySelector("button"), aviso = document.querySelector("[data-aviso]");
  var rotulo = botao.textContent;
  var conta = function (texto) { try { window.rzVisita && window.rzVisita("clicou", { alvo: "planilha", texto: texto }); } catch (e) {} };
  f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var codigo = campo.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!codigo) { aviso.textContent = "Digite o código que a gente mandou no WhatsApp."; campo.focus(); return; }
    if (!f.dataset.cifrada) { aviso.textContent = "A sua planilha ainda está sendo preparada. Assim que ficar pronta, a gente te manda o código."; return; }
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) { aviso.textContent = "Este navegador não consegue abrir. Peça a planilha pelo WhatsApp."; return; }
    botao.disabled = true; botao.textContent = "Abrindo…"; aviso.textContent = "";
    fetch(f.dataset.cifrada).then(function (r) { if (!r.ok) throw new Error("rede"); return r.arrayBuffer(); }).then(function (buf) {
      var b = new Uint8Array(buf), iter = new DataView(buf).getUint32(4);
      return crypto.subtle.importKey("raw", new TextEncoder().encode(codigo), "PBKDF2", false, ["deriveKey"]).then(function (base) {
        return crypto.subtle.deriveKey({ name: "PBKDF2", salt: b.slice(8, 24), iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      }).then(function (chave) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(24, 36) }, chave, b.slice(36)).catch(function () { throw new Error("codigo"); });
      });
    }).then(function (claro) {
      var url = URL.createObjectURL(new Blob([claro], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      var a = document.createElement("a");
      a.href = url; a.download = f.dataset.nome; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      aviso.textContent = "Pronto! A sua planilha foi baixada. No celular, ela fica em Downloads.";
      conta("baixou a dela");
    }).catch(function (e) {
      aviso.textContent = e && e.message === "codigo" ? "Esse código não confere. Confira as letras e os números (pode ser com ou sem o tracinho)." : "Não deu para abrir agora. Tente de novo ou peça a planilha pelo WhatsApp.";
      conta(e && e.message === "codigo" ? "código errado" : "erro ao abrir");
    }).then(function () { botao.disabled = false; botao.textContent = rotulo; });
  });
})();
</script>
</body>
</html>
`;
}

async function main() {
  const args = process.argv.slice(2);
  const pasta = args.find(a => !a.startsWith("--") && !/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(a));
  if (!pasta || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(pasta)) {
    console.error("Uso: node ferramentas/planilha/gerar-pagina.mjs <pasta> [--codigo [ABCD-2345]] [--sem-a-dela]");
    process.exit(1);
  }
  const cfg = JSON.parse(readFileSync(join(RAIZ, "demos", pasta, "planilha.json"), "utf8"));
  const rasc = join(RAIZ, "rascunhos", "planilha", pasta);
  const saida = join(RAIZ, "demos", pasta);
  mkdirSync(saida, { recursive: true });
  const imagens = {};
  for (const nome of ["inicio", "ensaios", "resumo", "grafico", "inicio-cel", "resumo-cel"]) {
    const origem = join(rasc, "img", nome + ".webp");
    if (!existsSync(origem)) {
      if (nome.endsWith("-cel")) continue;
      throw new Error(`Falta ${origem}: rode antes o gerar-planilha.py com --imagens.`);
    }
    const [w, h] = tamanhoWebp(origem);
    imagens[nome] = { w, h, b64: readFileSync(origem).toString("base64") };
  }
  const nomeTeste = cfg.arquivo + "-TESTE.xlsx";
  copyFileSync(join(rasc, nomeTeste), join(saida, nomeTeste));
  const teste = { nome: nomeTeste, v: versao(join(saida, nomeTeste)) };

  const bin = join(saida, "planilha.bin");
  const i = args.indexOf("--codigo");
  if (args.includes("--sem-a-dela")) rmSync(bin, { force: true });
  if (i >= 0) {
    const dado = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1].toUpperCase() : codigoNovo();
    if (normalizar(dado).length < 8) throw new Error("O código precisa de pelo menos 8 letras ou números.");
    const final = readFileSync(join(rasc, cfg.arquivo + ".xlsx"));
    const pacote = await cifrar(final, dado);
    if (!(await decifrar(pacote, dado)).equals(final)) throw new Error("A cifrada não volta igual: nada foi gravado.");
    writeFileSync(bin, pacote);
    writeFileSync(join(rasc, "codigo.txt"), dado + "\n");
    console.log(`Código da planilha dela: ${dado}  (guardado em rascunhos/planilha/${pasta}/codigo.txt; mande pelo WhatsApp, nunca pelo git)`);
  }
  const cifrada = existsSync(bin) ? { v: versao(bin) } : null;
  const { default: site } = await import(pathToFileURL(join(RAIZ, "site", "config.mjs")).href);
  const site_ = cfg.demo_do_site;
  const capa = site_ && existsSync(join(RAIZ, "demos", site_, "index.html")) ? `https://www.renderizaweb.com.br/demo/${site_}/capa.jpg` : "";
  const html = pagina({ pasta, cfg, imagens, teste, cifrada, whatsapp: site.contato.whatsapp, capa });
  writeFileSync(join(saida, "index.html"), html);
  console.log(`demos/${pasta}/index.html (${Math.round(html.length / 1024)} KB; no ar, as fotos saem da página) → /demo/${pasta}${cifrada ? " · com a planilha dela (cifrada)" : " · a dela ainda não está na página"}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
