// Monta as páginas "Como funciona" por nicho (/como-funciona/<nicho>): a página que o Kaue manda para o lead que
// já viu a prévia e ainda está na dúvida. HTML pronto no build, com o CSS da home (site/estilo.css) mais o desta
// página (site/como-funciona.css). Os textos de cada nicho ficam em site/nichos/<nicho>.mjs.
//
// A ordem é a de uma página de venda curta: o que muda (antes e depois), o que vai no site, como funciona,
// os pacotes com preço, as perguntas de sempre e o convite. Ao contrário da home, aqui o preço aparece: quem
// recebe este link já está na conversa (pedido de 16/10/2026).
// Regras: nada de "mais vendido", promessa de resultado, superlativo ou "de bairro"; nenhuma foto de lead.

import { readFileSync, readdirSync } from "node:fs";
import { INAUGURACAO, diaEmSaoPaulo, esc, icone, linkWhatsapp, simbolo, telefoneLegivel } from "./pagina.mjs";

// Ícones que só esta página usa (Lucide). Os outros vêm da home.
const MAIS_ICONES = {
  relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  chave: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  carteira: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  calendario: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
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

/** Cartão de um pacote: nome, para quem, preço, o que inclui, o "saber mais" (se houver) e o botão. */
function cartaoPacote(p, { temWa, contato, emInauguracao }) {
  const destaque = Boolean(p.selo);
  const href = temWa ? linkWhatsapp(contato, p.mensagem) : "#contato";
  return `
        <li class="cf-pacote${destaque ? " cf-pacote-destaque" : ""}" id="pacote-${esc(p.id)}">
          ${p.selo ? `<p class="cf-pacote-selo">${ic("brilho", 14)}${esc(p.selo)}</p>` : ""}
          <h3>${esc(p.nome)}</h3>
          <p class="cf-pacote-para">${esc(p.para)}</p>
          <p class="cf-preco"><strong>${esc(p.preco.valor)}</strong><span>${esc(p.preco.forma)}</span></p>
          <p class="cf-parcela">${esc(p.preco.parcela)}</p>
          ${p.inauguracao && emInauguracao ? `<p class="cf-pacote-inauguracao" data-ate="${INAUGURACAO.ate}">${ic("calendario", 15)}<span>${esc(p.inauguracao)}</span></p>` : ""}
          <ul class="cf-inclui">${p.inclui.map(item => `
            <li><span class="cf-marca">${icone("check", 12)}</span><span>${esc(item)}</span></li>`).join("")}
          </ul>
          ${p.saberMais ? `<details class="cf-saber">
            <summary>${esc(p.saberMais.resumo)}${icone("mais", 16)}</summary>
            ${p.saberMais.texto.map(t => `<p>${esc(t)}</p>`).join("")}
            ${p.saberMais.exemplos ? `<ul class="cf-exemplos" aria-label="Exemplos de campanha">${p.saberMais.exemplos.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
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
  const { abertura: a, antesDepois: ad, convite: cv } = nicho;

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
      <a href="#o-que-muda">O que muda</a>
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
          <a class="botao botao-primario botao-grande" href="${esc(waDe(cv.mensagem))}"${attrsWa}>${icone("whatsapp", 20)}Falar no WhatsApp</a>
          <a class="botao botao-contorno botao-grande" href="#pacotes">Ver os pacotes${icone("baixo", 18)}</a>
        </div>
        <ul class="cf-fatos">${a.fatos.map((f, i) => `
          <li>${ic(ICONE_DO_FATO[i] || "check", 17)}<span>${esc(f)}</span></li>`).join("")}
        </ul>
      </div>
${ilustracao(nicho.ilustracao)}
    </div>
  </section>

  <section class="secao" id="o-que-muda" aria-labelledby="muda-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">${esc(ad.sobretitulo)}</p>
      <h2 id="muda-titulo">${esc(ad.h2[0])} <em>${esc(ad.h2[1])}</em></h2>
      <div class="cf-muda" role="table" aria-label="Hoje e com o site">
        <div class="cf-muda-cabeca" role="row"><span role="columnheader">Hoje</span><span role="columnheader">Com o site</span></div>${ad.linhas.map(([hoje, depois]) => `
        <div class="cf-muda-linha" role="row">
          <p class="cf-hoje" role="cell"><span class="cf-x">${icone("fechar", 12)}</span><span><span class="cf-rotulo">Hoje: </span>${esc(hoje)}</span></p>
          <p class="cf-depois" role="cell"><span class="cf-marca">${icone("check", 12)}</span><span><span class="cf-rotulo">Com o site: </span>${esc(depois)}</span></p>
        </div>`).join("")}
      </div>
    </div>
  </section>

  <section class="secao secao-clara" id="no-site" aria-labelledby="no-site-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">O que vai no site</p>
      <h2 id="no-site-titulo">Tudo o que o cliente pergunta, <em>antes de perguntar.</em></h2>
      <ul class="cf-recursos">${nicho.recursos.map(r => `
        <li>
          <span class="cf-recurso-icone">${ic(r.icone, 22)}</span>
          <h3>${esc(r.titulo)}</h3>
          <p>${esc(r.texto)}</p>
        </li>`).join("")}
      </ul>
    </div>
  </section>

  <section class="secao" id="como-funciona" aria-labelledby="como-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Como funciona</p>
      <h2 id="como-titulo">Você vê o site pronto <em>antes de decidir.</em></h2>
      <ol class="passos">${nicho.passos.map(([t, p]) => `
        <li><h3>${esc(t)}</h3><p>${esc(p)}</p></li>`).join("")}
      </ol>
      <p class="passos-nota">${icone("escudo", 20)}<span>Você só paga se decidir colocar o site no ar.</span></p>
    </div>
  </section>

  <section class="secao cf-secao-pacotes" id="pacotes" aria-labelledby="pacotes-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Pacotes</p>
      <h2 id="pacotes-titulo">Preço fechado. <em>Você escolhe até onde ir.</em></h2>
      <p class="secao-lide">Site e Site + campanhas: valor único, no Pix ou em 2x, sem mensalidade.</p>
      <ul class="cf-pacotes">${nicho.pacotes.map(p => cartaoPacote(p, { temWa, contato, emInauguracao })).join("")}
      </ul>
      <p class="cf-pacotes-nota">${esc(nicho.pacotesNota)}</p>
    </div>
  </section>

  <section class="secao secao-clara" id="perguntas" aria-labelledby="perguntas-titulo">
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
${emInauguracao ? `<script>/* mês de inauguração: a linha sai sozinha depois do último dia, mesmo sem um build novo */(function(){var d=new Date(),h=d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);[].forEach.call(document.querySelectorAll("[data-ate]"),function(e){if(h>e.getAttribute("data-ate"))e.parentNode.removeChild(e)})})()</script>
` : ""}</body>
</html>
`;
}
