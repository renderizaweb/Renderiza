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
// Textos e valor: "pagina" em demos/<pasta>/planilha.json ("itens", "valor", "frase_valor"; sem "valor", sai sem o bloco); a foto da
// prévia do link vem da demo do site do mesmo cliente ("demo_do_site"). Como funciona e o porquê:
// docs/produtos/planilha-financeira.md.

import { createHash, webcrypto } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

export function pagina({ pasta, cfg, imagens, teste, cifrada, capa }) {
  const p = cfg.pagina || {};
  const dados = nome => `data:image/webp;base64,${imagens[nome].b64}`;
  // A coluna é estreita em qualquer tela: vai o recorte sem a rosquinha (<nome>-cel.webp), quando existe.
  const img = (nome, alt) => {
    const usar = imagens[nome + "-cel"] ? nome + "-cel" : nome;
    const { w, h } = imagens[usar];
    return `<img src="${dados(usar)}" width="${w}" height="${h}" alt="${esc(alt)}" fetchpriority="high">`;
  };
  const itens = p.itens || [];
  const online = p.online ? `<a class="bt bt-linha" href="${esc(p.online)}" target="_blank" rel="noopener" data-rz-alvo="testar-online">Testar sem baixar</a>` : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planilha financeira · ${esc(cfg.nome)}</title>
<meta name="description" content="A planilha financeira do ${esc(cfg.nome)}: soma sozinha, mês a mês.">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#fbf8f7">
<meta property="og:type" content="website">
<meta property="og:title" content="Planilha financeira · ${esc(cfg.nome)}">
<meta property="og:description" content="Soma sozinha, mês a mês. Baixe a versão de teste.">
${capa ? `<meta property="og:image" content="${capa}">\n` : ""}<meta property="og:url" content="https://www.renderizaweb.com.br/demo/${pasta}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fontes/geist.woff2" as="font" type="font/woff2" crossorigin>
<!-- Gerada por ferramentas/planilha/gerar-pagina.mjs (não editar à mão), ${new Date().toISOString().slice(0, 10)}.
     O contador conta as visitas no lead com link_demo = /demo/${pasta}. -->
<script src="/exemplos/visitas.js" data-pagina="demo" data-demo="${pasta}" defer></script>
<style>
@font-face{font-family:"Geist";font-style:normal;font-weight:100 900;font-display:swap;src:url(/fontes/geist.woff2) format("woff2")}
:root{--fundo:#fbf8f7;--cartao:#fff;--tinta:#231c1d;--suave:#6f6365;--linha:#ece4e1;--acento:${cfg.cores.acento};--escuro:${cfg.cores.acento_escuro}}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Geist,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--fundo);color:var(--tinta);font-size:17px;line-height:1.5;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}
img{display:block;max-width:100%;height:auto}
:focus-visible{outline:3px solid var(--acento);outline-offset:3px;border-radius:8px}
main{width:min(560px,100% - 32px);margin:0 auto;padding:28px 0 8px}
.marca{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--acento)}
h1{font-size:clamp(32px,9vw,42px);line-height:1.1;letter-spacing:-.03em;font-weight:700;margin-top:18px}
h2{font-size:20px;letter-spacing:-.01em;font-weight:650}
.sub{color:var(--suave);margin-top:10px}
.tela{margin-top:24px;border-radius:16px;overflow:hidden;border:1px solid var(--linha);background:#fff;box-shadow:0 18px 40px -28px rgba(35,28,29,.45)}
.legenda{font-size:13px;color:var(--suave);margin-top:8px}
.bt{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;margin-top:22px;border-radius:14px;border:0;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;background:var(--acento);color:#fff}
.bt:hover{background:var(--escuro)}
.bt svg{width:20px;height:20px}
.bt-linha{background:var(--cartao);color:var(--escuro);border:1.5px solid var(--linha);margin-top:10px}
.bt:disabled{opacity:.6;cursor:default}
.nota{font-size:14px;color:var(--suave);margin-top:10px;text-align:center}
section{margin-top:44px}
.itens{list-style:none;margin-top:10px}
.itens li{padding:7px 0 7px 22px;position:relative}
.itens li::before{content:"";position:absolute;left:2px;top:.95em;width:8px;height:8px;border-radius:50%;background:var(--acento)}
.valor{background:var(--cartao);border:1px solid var(--linha);border-radius:16px;padding:22px 20px}
.preco{font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1}
.preco small{font-size:15px;font-weight:500;color:var(--suave);letter-spacing:0;margin-left:6px}
.valor p+p{margin-top:8px;color:var(--suave)}
form{display:grid;gap:10px;margin-top:14px}
input{min-height:54px;border-radius:14px;border:1.5px solid var(--linha);background:#fff;padding:0 16px;font:inherit;font-size:18px;letter-spacing:.08em;text-transform:uppercase;color:var(--tinta)}
input::placeholder{letter-spacing:0;text-transform:none;color:#a99c9e}
form .bt{margin-top:0;background:var(--tinta)}
[data-aviso]{min-height:1.5em;margin-top:10px;font-size:15px;color:var(--escuro)}
footer{width:min(560px,100% - 32px);margin:48px auto 0;padding:20px 0 40px;border-top:1px solid var(--linha);font-size:13px;color:var(--suave)}
</style>
</head>
<body>
<main>
<section id="inicio" aria-label="Início" style="margin-top:0">
  <p class="marca">Renderiza · para o ${esc(cfg.nome)}</p>
  <h1>Sua planilha financeira</h1>
  <p class="sub">Você anota cada ensaio e cada gasto. Ela soma sozinha, mês a mês.</p>
  <a class="bt" href="/demo/${pasta}/${esc(teste.nome)}?v=${teste.v}" download="${esc(teste.nome)}" data-rz-alvo="baixar-teste"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14"/></svg>Baixar a versão de teste</a>
  ${online}
  <p class="nota">Abre no Excel ou no Google Planilhas.</p>
  <div class="tela">${img("inicio", "A primeira aba: quanto entrou, quanto saiu e quanto sobrou no mês")}</div>
  <p class="legenda">Valores de exemplo.</p>
</section>

<section id="tem" aria-label="O que tem">
  <h2>O que tem nela</h2>
  <ul class="itens">${itens.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
</section>
${p.valor ? `
<section id="valor" aria-label="Valor">
  <div class="valor">
    <p class="preco">${esc(p.valor)}<small>valor único</small></p>
    <p>${esc(p.frase_valor || "")}</p>
  </div>
</section>
` : ""}
<section id="sua" aria-label="Baixar a sua">
  <h2>Já tem o código?</h2>
  <form data-liberar${cifrada ? ` data-cifrada="/demo/${pasta}/planilha.bin?v=${cifrada.v}"` : ""} data-nome="${esc(cfg.arquivo)}.xlsx" autocomplete="off">
    <label for="codigo" style="position:absolute;left:-9999px">Código</label>
    <input id="codigo" name="codigo" inputmode="text" autocapitalize="characters" spellcheck="false" placeholder="Digite o código" maxlength="14">
    <button class="bt" type="submit" data-rz-alvo="liberar-planilha">Baixar a minha</button>
  </form>
  <p data-aviso role="status" aria-live="polite"></p>
</section>
</main>
<footer>Renderiza · renderizaweb.com.br</footer>

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
    if (!codigo) { aviso.textContent = "Digite o código que mandamos no WhatsApp."; campo.focus(); return; }
    if (!f.dataset.cifrada) { aviso.textContent = "A sua ainda está sendo preparada. Mandamos o código quando ficar pronta."; return; }
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) { aviso.textContent = "Este navegador não abre. Peça a planilha pelo WhatsApp."; return; }
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
      aviso.textContent = "Pronto! Está em Downloads.";
      conta("baixou a dela");
    }).catch(function (e) {
      aviso.textContent = e && e.message === "codigo" ? "Código não confere. Confira as letras e os números." : "Não deu para abrir agora. Tente de novo.";
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
  for (const nome of ["inicio", "inicio-cel"]) { // a página mostra só o Início
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
  const site_ = cfg.demo_do_site;
  const capa = site_ && existsSync(join(RAIZ, "demos", site_, "index.html")) ? `https://www.renderizaweb.com.br/demo/${site_}/capa.jpg` : "";
  const html = pagina({ pasta, cfg, imagens, teste, cifrada, capa });
  writeFileSync(join(saida, "index.html"), html);
  console.log(`demos/${pasta}/index.html (${Math.round(html.length / 1024)} KB; no ar, as fotos saem da página) → /demo/${pasta}${cifrada ? " · com a planilha dela (cifrada)" : " · a dela ainda não está na página"}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
