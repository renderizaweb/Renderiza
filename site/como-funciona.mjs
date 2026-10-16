// Monta as páginas "Como funciona" por nicho (/como-funciona/<nicho>): a página que o Kaue manda para o lead que
// já viu a prévia e ainda está na dúvida. HTML pronto no build, com o CSS da home (site/estilo.css) mais o desta
// página (site/como-funciona.css). Os textos de cada nicho ficam em site/nichos/<nicho>.mjs.
//
// Página de venda curta, para ler em uma passada de olho quando o lead pergunta "como funciona?" ou "quanto
// custa?": abertura, 3 passos, os pacotes com preço, 4 perguntas e o convite. Ao contrário da home, aqui o preço
// aparece: quem recebe este link já está na conversa (pedidos de 16/10/2026).
// Regras: nada de "mais vendido", promessa de resultado, superlativo ou "de bairro"; nenhuma foto de lead.

import { readFileSync, readdirSync } from "node:fs";
import { INAUGURACAO, diaEmSaoPaulo, esc, icone, linkWhatsapp, simbolo, telefoneLegivel } from "./pagina.mjs";
import { MARCAS } from "./marcas.mjs";

// Ícones que só esta página usa (Lucide). Os outros vêm da home.
const MAIS_ICONES = {
  relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  chave: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  carteira: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  calendario: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  fotos: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  mapa: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};
const ic = (nome, tam = 18) => MAIS_ICONES[nome]
  ? `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${MAIS_ICONES[nome]}</svg>`
  : icone(nome, tam);
const ICONE_DO_FATO = ["relogio", "carteira", "chave"];

/** Os nichos com página: um arquivo por nicho em site/nichos/ (o nome do arquivo é o fim do endereço). */
export function nichosComPagina() {
  return readdirSync(new URL("./nichos/", import.meta.url)).filter(f => f.endsWith(".mjs")).map(f => f.replace(/\.mjs$/, ""));
}

/** Texto do nicho: site/nichos/<id>.mjs. Importa de novo a cada chamada (no servidor local, é só recarregar). */
export async function textosDoNicho(id) {
  const { default: n } = await import(new URL(`./nichos/${id}.mjs`, import.meta.url).href + "?v=" + Date.now());
  return n;
}

/** Ilustração do topo: a consulta de data no celular e a mensagem que chega no WhatsApp do espaço. Sem foto. */
function ilustracao(il) {
  return `
      <figure class="cf-ilustracao">
        <div class="cf-celular" aria-hidden="true">
          <div class="cf-tela">
            <div class="cf-tela-topo"><span class="cf-tela-logo"></span><span>${esc(il.espaco)}</span><span class="cf-tela-menu"></span></div>
            <div class="cf-tela-foto"><span></span><span></span><span></span></div>
            <p class="cf-tela-titulo">Consultar uma data</p>
            <div class="cf-tela-campos">${il.campos.map(([r, v]) => `
              <div class="cf-tela-campo"><small>${esc(r)}</small><span>${esc(v)}</span></div>`).join("")}
            </div>
            <span class="cf-tela-botao">${icone("whatsapp", 14)}Consultar no WhatsApp</span>
          </div>
        </div>
        <div class="cf-bolha" aria-hidden="true">
          <p class="cf-bolha-de">${icone("whatsapp", 14)}No WhatsApp do espaço</p>
          ${il.mensagem.map((l, i) => `<p${i === 0 ? ' class="cf-bolha-abre"' : ""}>${esc(l)}</p>`).join("")}
          <span class="cf-bolha-hora">14:32 ✓✓</span>
        </div>
        <figcaption class="sr-only">Ilustração: no site, o cliente escolhe a data, o tipo de festa e os convidados, e a mensagem chega pronta no WhatsApp do espaço.</figcaption>
      </figure>`;
}

/** O "sol": as pontas (redes, WhatsApp, avaliações, fotos) em volta e o site no centro; de cada ponta sai uma luz
 * que corre até o site, uma depois da outra, em loop. Desenhado em SVG e CSS, sem foto; mede tudo pela largura
 * do desenho (cqw), então escala igual do celular ao computador. Quem prefere menos movimento vê o desenho parado. */
function sol(sl) {
  // nas pontas de cima o nome fica acima do ícone (longe do centro), para não encostar no site nem no raio
  const n = sl.pontas.length, R = 38;
  const pos = sl.pontas.map((_, i) => {
    const a = (-90 + (360 / n) * i) * Math.PI / 180;
    return [50 + R * Math.cos(a), 50 + R * Math.sin(a), a];
  });
  const f = v => Math.round(v * 100) / 100;
  // a estrela do sol: 16 pontas atrás do site
  const estrela = Array.from({ length: 32 }, (_, i) => {
    const a = (i * 11.25 - 90) * Math.PI / 180, r = i % 2 ? 22.5 : 30;
    return `${f(50 + r * Math.cos(a))},${f(50 + r * Math.sin(a))}`;
  }).join(" ");
  const simboloDa = nome => MARCAS[nome]
    ? `<svg viewBox="0 0 24 24" fill="${MARCAS[nome].cor}" aria-hidden="true" focusable="false"><path d="${MARCAS[nome].d}"/></svg>`
    : ic(nome, 24).replace("<svg ", '<svg class="cf-sol-traco" ');
  return `
      <figure class="cf-sol">
        <div class="cf-sol-palco" aria-hidden="true">
          <span class="cf-sol-halo"></span>
          <svg class="cf-sol-desenho" viewBox="0 0 100 100" focusable="false">
            <defs>
              <radialGradient id="cf-sol-brilho"><stop offset="0" stop-color="#e8855e" stop-opacity=".42"/><stop offset=".7" stop-color="#e8855e" stop-opacity=".12"/><stop offset="1" stop-color="#e8855e" stop-opacity=".05"/></radialGradient>
              <filter id="cf-sol-luz" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <polygon class="cf-sol-estrela" points="${estrela}"/>
            <circle class="cf-sol-orbita" cx="50" cy="50" r="${R}"/>
            <circle class="cf-sol-orbita-fora" cx="50" cy="50" r="46.5"/>
            ${pos.map(([x, y, a]) => `<line class="cf-raio" x1="${f(x)}" y1="${f(y)}" x2="${f(50 + 12 * Math.cos(a))}" y2="${f(50 + 12 * Math.sin(a))}"/>`).join("")}
            <g filter="url(#cf-sol-luz)">${pos.map(([x, y, a], i) => `<line class="cf-luz" style="--i:${i}" pathLength="100" x1="${f(x)}" y1="${f(y)}" x2="${f(50 + 12 * Math.cos(a))}" y2="${f(50 + 12 * Math.sin(a))}"/>`).join("")}</g>
          </svg>
          <div class="cf-sol-site">
            <div class="cf-sol-barra"><i></i><i></i><i></i><span>${esc(sl.endereco)}</span></div>
            <div class="cf-sol-tela">
              <div class="cf-sol-foto"><span></span><span></span><span></span></div>
              <span class="cf-sol-estrelas">★★★★★</span>
              <span class="cf-sol-linha"></span><span class="cf-sol-linha cf-sol-linha-curta"></span>
              <span class="cf-sol-botao">Consultar data</span>
            </div>
          </div>
          <ul class="cf-sol-pontas">${sl.pontas.map(([icone_, nome], i) => `
            <li${pos[i][1] < 45 ? ' class="cf-sol-cima"' : ""} style="--x:${f(pos[i][0])}%;--y:${f(pos[i][1])}%;--i:${i}"><span class="cf-sol-ponta">${simboloDa(icone_)}</span><span class="cf-sol-nome">${esc(nome)}</span></li>`).join("")}
          </ul>
        </div>
        <figcaption class="sr-only">Ilustração: ${esc(sl.pontas.map(([, nome]) => nome).join(", "))}, tudo indo para o site do espaço, no centro.</figcaption>
      </figure>`;
}

/** Preço grande, a forma (no Pix, por mês) e a linha de baixo (o 2x ou as condições). */
const preco = pr => `
          <p class="cf-preco"><strong>${esc(pr.valor)}</strong><span>${esc(pr.forma)}</span></p>
          <p class="cf-parcela">${esc(pr.parcela)}</p>`;

/** Cartão de um pacote: nome, para quem, preço, o que inclui, o "saber mais" (se houver) e o botão. */
function cartaoPacote(p, { temWa, contato, emInauguracao }) {
  const destaque = Boolean(p.selo);
  const href = temWa ? linkWhatsapp(contato, p.mensagem) : "#contato";
  return `
        <li class="cf-pacote${destaque ? " cf-pacote-destaque" : ""}" id="pacote-${esc(p.id)}">
          ${p.selo ? `<p class="cf-pacote-selo">${ic("brilho", 14)}${esc(p.selo)}</p>` : ""}
          <h3>${esc(p.nome)}</h3>
          <p class="cf-pacote-para">${esc(p.para)}</p>
          ${p.inauguracao && emInauguracao
            ? `<div data-ate="${INAUGURACAO.ate}">${preco(p.inauguracao)}
            <p class="cf-pacote-inauguracao">${ic("calendario", 15)}<span>${esc(p.inauguracao.nota)}</span></p></div>
          <div data-depois="${INAUGURACAO.ate}" hidden>${preco(p.preco)}</div>`
            : preco(p.preco)}
          <ul class="cf-inclui">${p.inclui.map(item => `
            <li><span class="cf-marca">${icone("check", 12)}</span><span>${esc(item)}</span></li>`).join("")}
          </ul>
          ${p.saberMais ? `<details class="cf-saber">
            <summary>${esc(p.saberMais.resumo)}${icone("mais", 16)}</summary>
            ${p.saberMais.texto.map(t => `<p>${esc(t)}</p>`).join("")}
            ${p.saberMais.exemplos ? `<ul class="cf-exemplos" aria-label="Exemplos de datas">${p.saberMais.exemplos.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
          </details>` : ""}
          <a class="botao ${destaque ? "botao-primario" : "botao-secundario"} cf-pacote-botao" href="${esc(href)}"${temWa ? ' target="_blank" rel="noopener"' : ""}>${icone("whatsapp", 18)}${esc(p.botao)}</a>
        </li>`;
}

export function montarComoFunciona(nicho, config, {
  css = readFileSync(new URL("./estilo.css", import.meta.url), "utf8") + "\n" + readFileSync(new URL("./como-funciona.css", import.meta.url), "utf8"),
  ano = new Date().getFullYear(),
  hoje = new Date(),
} = {}) {
  const { pessoa, contato } = config;
  const base = config.endereco.replace(/\/+$/, "");
  const url = `${base}/como-funciona/${nicho.id}`;
  const temWa = Boolean(linkWhatsapp(contato));
  const waDe = mensagem => (temWa ? linkWhatsapp(contato, mensagem) : "#contato");
  const attrsWa = temWa ? ' target="_blank" rel="noopener"' : "";
  const telefone = telefoneLegivel(contato.whatsapp);
  const emInauguracao = diaEmSaoPaulo(hoje) <= INAUGURACAO.ate;
  const { abertura: a, convite: cv } = nicho;

  const redes = [
    temWa && `<a href="${esc(linkWhatsapp(contato))}" target="_blank" rel="noopener">${icone("whatsapp", 17)}WhatsApp ${esc(telefone)}</a>`,
    contato.linkedin && `<a href="${esc(contato.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 17)}LinkedIn</a>`,
    contato.instagram && `<a href="${esc(contato.instagram)}" target="_blank" rel="noopener">${icone("instagram", 17)}Instagram</a>`,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(nicho.titulo)}</title>
<meta name="description" content="${esc(nicho.descricao)}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${esc(url)}">
<meta name="color-scheme" content="only light">
<meta name="theme-color" content="#1e2528">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Renderiza">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(nicho.titulo)}">
<meta property="og:description" content="${esc(nicho.descricao)}">
<meta property="og:image" content="${esc(base)}/compartilhar.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fontes/geist.woff2" as="font" type="font/woff2" crossorigin>
<style>
${css.trim()}
</style>
</head>
<body class="cf">
<a class="pular" href="#conteudo">Pular para o conteúdo</a>

<header class="topo">
  <div class="topo-dentro">
    <a class="marca" href="/" aria-label="Renderiza, ir para a página inicial">${simbolo(30)}<span>renderiza</span></a>
    <nav class="topo-nav" aria-label="Seções">
      <a href="#como-funciona">Como funciona</a>
      <a href="#pacotes">Pacotes</a>
      <a href="#perguntas">Perguntas</a>
    </nav>
    <a class="botao botao-primario botao-topo" href="${esc(waDe(cv.mensagem))}"${attrsWa}>${icone("whatsapp", 17)}<span>WhatsApp</span></a>
  </div>
</header>

<main id="conteudo">
  <section class="cf-abertura" id="inicio" aria-labelledby="cf-titulo">
    <div class="envoltorio cf-abertura-grade">
      <div class="cf-abertura-texto">
        <p class="cf-aviso">${esc(a.aviso)}</p>
        <h1 id="cf-titulo">${esc(a.h1[0])} <em>${esc(a.h1[1])}</em></h1>
        <p class="cf-lide">${esc(a.lide)}</p>
        <div class="acoes">
          <a class="botao botao-primario botao-grande" href="#pacotes">Ver pacotes e preços${icone("baixo", 18)}</a>
          <a class="botao botao-contorno botao-grande" href="${esc(waDe(cv.mensagem))}"${attrsWa}>${icone("whatsapp", 20)}Falar no WhatsApp</a>
        </div>
        <ul class="cf-fatos">${a.fatos.map((f, i) => `
          <li>${ic(ICONE_DO_FATO[i] || "check", 17)}<span>${esc(f)}</span></li>`).join("")}
        </ul>
      </div>
${ilustracao(nicho.ilustracao)}
    </div>
  </section>

${nicho.sol ? `
  <section class="secao secao-clara cf-sol-secao" id="tudo-junto" aria-labelledby="sol-titulo">
    <div class="envoltorio cf-sol-grade">
      <div class="cf-sol-texto">
        <p class="sobretitulo">${esc(nicho.sol.sobretitulo)}</p>
        <h2 id="sol-titulo">${esc(nicho.sol.h2[0])} <em>${esc(nicho.sol.h2[1])}</em></h2>
        <p class="secao-lide">${esc(nicho.sol.lide)}</p>
      </div>
${sol(nicho.sol)}
    </div>
  </section>
` : ""}
  <section class="secao" id="como-funciona" aria-labelledby="como-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Como funciona</p>
      <h2 id="como-titulo">Você vê o site pronto <em>antes de pagar.</em></h2>
      <ol class="passos">${nicho.passos.map(([t, p]) => `
        <li><h3>${esc(t)}</h3><p>${esc(p)}</p></li>`).join("")}
      </ol>
    </div>
  </section>

  <section class="secao cf-secao-pacotes" id="pacotes" aria-labelledby="pacotes-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Pacotes</p>
      <h2 id="pacotes-titulo">Pacotes e preços. <em>Você escolhe até onde ir.</em></h2>
      <ul class="cf-pacotes">${nicho.pacotes.map(p => cartaoPacote(p, { temWa, contato, emInauguracao })).join("")}
      </ul>
      <p class="cf-pacotes-nota">${esc(nicho.pacotesNota)}</p>
    </div>
  </section>

  <section class="secao" id="perguntas" aria-labelledby="perguntas-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Perguntas frequentes</p>
      <h2 id="perguntas-titulo">O que todo mundo pergunta.</h2>
      <div class="perguntas">${nicho.perguntas.map(([p, r]) => `
        <details>
          <summary>${esc(p)}${icone("mais", 18)}</summary>
          <p>${esc(r)}</p>
        </details>`).join("")}
      </div>
    </div>
  </section>

  <section class="convite" id="contato" aria-labelledby="contato-titulo">
    <div class="envoltorio envoltorio-estreito">
      <h2 id="contato-titulo">${esc(cv.h2[0])} <em>${esc(cv.h2[1])}</em></h2>
      <p>${esc(cv.texto)}</p>
      <div class="acoes acoes-convite">
        ${temWa ? `<a class="botao botao-primario botao-grande" href="${esc(linkWhatsapp(contato, cv.mensagem))}" target="_blank" rel="noopener">${icone("whatsapp", 20)}${esc(cv.botao)}</a>` : `<p class="convite-pendente">Os canais de contato estão sendo atualizados.</p>`}
      </div>
      ${temWa ? `<p class="convite-numero">Ou salve o nosso número: WhatsApp ${esc(telefone)}</p>` : ""}
    </div>
  </section>
</main>

<footer class="rodape">
  <div class="envoltorio rodape-grade">
    <div>
      <a class="marca marca-rodape" href="/" aria-label="Renderiza, ir para a página inicial">${simbolo(30)}<span>renderiza</span></a>
      <p>Sites e aplicativos para negócios.<br>Um projeto independente de ${esc(pessoa.nomeCompleto || pessoa.nome)}.</p>
    </div>
    ${redes.length ? `<nav class="rodape-redes" aria-label="Contato">${redes.join("")}</nav>` : ""}
  </div>
  <div class="envoltorio rodape-base">
    <span>© ${ano} Renderiza</span>
  </div>
</footer>
${emInauguracao ? `<script>/* mês de inauguração: depois do último dia, o preço da inauguração sai e o de sempre volta, mesmo sem um build novo */(function(){var d=new Date(),h=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);[].forEach.call(document.querySelectorAll("[data-ate]"),function(e){if(h>e.getAttribute("data-ate"))e.parentNode.removeChild(e)});[].forEach.call(document.querySelectorAll("[data-depois]"),function(e){if(h>e.getAttribute("data-depois"))e.removeAttribute("hidden")})})()</script>
` : ""}</body>
</html>
`;
}
