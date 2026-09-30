// Monta a home pública (/) a partir de site/config.mjs e site/estilo.css.
// HTML pronto no build: sem JavaScript para mostrar o conteúdo, com o CSS dentro da página.

import { readFileSync } from "node:fs";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const ICONES = {
  marca: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  // Logo do WhatsApp (Simple Icons, CC0): é preenchido, os outros são de traço (Lucide).
  whatsapp: '<path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  seta: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  baixo: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  externo: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  mensagem: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  mais: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};
const icone = (nome, tam = 18) =>
  `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONES[nome]}</svg>`;

/** O que ainda falta preencher em site/config.mjs (o build mostra no terminal). */
export function pendencias(config) {
  const p = [];
  if (!config.contato.whatsapp) p.push("WhatsApp Business (contato.whatsapp)");
  if (!config.contato.linkedin) p.push("LinkedIn pessoal (contato.linkedin)");
  if (!config.pessoa.foto) p.push("foto real (pessoa.foto)");
  for (const t of config.trabalhos) if (t.publicar && t.falta && !/^Nada/.test(t.falta)) p.push(`trabalho "${t.titulo}": ${t.falta}`);
  return p;
}

export function linkWhatsapp(contato) {
  const numero = String(contato.whatsapp || "").replace(/\D/g, "");
  if (!numero) return "";
  return `https://wa.me/${numero}` + (contato.mensagemWhatsapp ? "?text=" + encodeURIComponent(contato.mensagemWhatsapp) : "");
}

/** "5511988697165" → "(11) 98869-7165" (números do Brasil); outros ficam como vieram. */
export function telefoneLegivel(numero) {
  const d = String(numero || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

const SELOS = { cliente: "Projeto de cliente", demonstracao: "Demonstração conceitual" };

function cartaoTrabalho(t) {
  const selo = SELOS[t.selo];
  if (!selo) throw new Error(`site/config.mjs: trabalho "${t.id}" com selo desconhecido (${t.selo}). Use "cliente" ou "demonstracao".`);
  // Sem print real, o cartão mostra só uma inicial (não finge ser imagem do trabalho).
  const visual = t.imagem
    ? `<div class="trabalho-imagem"><img src="${esc(t.imagem)}" alt="${esc(t.alt || "Tela do trabalho " + t.titulo)}" loading="lazy" decoding="async"></div>`
    : `<span class="trabalho-monograma monograma-${esc(t.selo)}" aria-hidden="true">${esc(t.titulo.charAt(0).toUpperCase())}</span>`;
  const externo = t.link && /^https?:/.test(t.link);
  const link = t.link
    ? `<a class="trabalho-link" href="${esc(t.link)}"${externo ? ' target="_blank" rel="noopener"' : ""}>Ver o trabalho${icone("externo", 15)}<span class="sr-only"> ${esc(t.titulo)}${externo ? " (abre em outra aba)" : ""}</span></a>`
    : "";
  return `
        <li class="trabalho${t.imagem ? " com-imagem" : ""}">
          ${visual}
          <div class="trabalho-corpo">
            <p class="trabalho-meta"><span class="selo selo-${esc(t.selo)}">${selo}</span><span>${esc(t.tipo)}</span></p>
            <h3>${esc(t.titulo)}</h3>
            <p>${esc(t.texto)}</p>
            ${link}
          </div>
        </li>`;
}

export function montarPagina(config, { css = readFileSync(new URL("./estilo.css", import.meta.url), "utf8"), ano = new Date().getFullYear() } = {}) {
  const { pessoa, contato } = config;
  const nomeCompleto = pessoa.nomeCompleto || pessoa.nome;
  const base = config.endereco.replace(/\/+$/, "");
  const wa = linkWhatsapp(contato);
  const temWa = Boolean(wa);
  // Sem WhatsApp configurado, os botões levam ao bloco de contato (nada de link quebrado).
  const hrefWa = temWa ? wa : "#contato";
  const attrsWa = temWa ? ' target="_blank" rel="noopener"' : "";
  const trabalhos = config.trabalhos.filter(t => t.publicar);
  const temDemo = trabalhos.some(t => t.selo === "demonstracao");
  const telefone = telefoneLegivel(contato.whatsapp);

  const titulo = "Renderiza · Sites para pequenos negócios";
  const descricao = `Sites bonitos e leves para pequenos negócios, com fotos reais, informação clara e contato direto pelo WhatsApp. Feitos por ${nomeCompleto}, que também desenvolve aplicativos e outras soluções digitais.`;

  const avatar = pessoa.foto
    ? `<img src="${esc(pessoa.foto)}" alt="" width="40" height="40" decoding="async">`
    : `<span aria-hidden="true">${esc(pessoa.nome.charAt(0))}</span>`;
  const foto = pessoa.foto
    ? `<div class="sobre-foto"><img src="${esc(pessoa.foto)}" alt="Foto de ${esc(nomeCompleto)}" width="480" height="600" loading="lazy" decoding="async"></div>`
    : "";

  const redes = [
    temWa && `<a href="${esc(wa)}" target="_blank" rel="noopener">${icone("whatsapp", 17)}WhatsApp</a>`,
    contato.linkedin && `<a href="${esc(contato.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 17)}LinkedIn</a>`,
    contato.instagram && `<a href="${esc(contato.instagram)}" target="_blank" rel="noopener">${icone("instagram", 17)}Instagram</a>`,
  ].filter(Boolean);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${esc(base)}/">
<meta name="color-scheme" content="only light">
<meta name="theme-color" content="#f6f5f0">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Renderiza">
<meta property="og:url" content="${esc(base)}/">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:image" content="${esc(base)}/compartilhar.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Renderiza: sites bonitos e leves para pequenos negócios">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fontes/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fontes/instrument-serif.woff2" as="font" type="font/woff2" crossorigin>
<script>/* endereços antigos do painel (/#pipeline…) */if(/^#(ritmo|pipeline|conteudo)$/.test(location.hash))location.replace("/painel"+location.hash)</script>
<style>
${css.trim()}
</style>
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>

<header class="topo">
  <div class="topo-dentro">
    <a class="marca" href="#inicio" aria-label="Renderiza, início">${icone("marca", 22)}<span>renderiza<span class="marca-ponto">.</span></span></a>
    <nav class="topo-nav" aria-label="Seções">
      <a href="#servicos">O que faço</a>
      <a href="#como-funciona">Como funciona</a>
      <a href="#trabalhos">Trabalhos</a>
      <a href="#sobre">Sobre</a>
    </nav>
    <a class="botao botao-primario botao-topo" href="${esc(hrefWa)}"${attrsWa}>${icone("whatsapp", 17)}<span>WhatsApp</span></a>
  </div>
</header>

<main id="conteudo">
  <section class="abertura" id="inicio" aria-labelledby="abertura-titulo">
    <div class="envoltorio abertura-grade">
      <div class="abertura-texto">
        <p class="assinatura"><span class="avatar">${avatar}</span><span>${esc(pessoa.nome)}, fundador da Renderiza</span></p>
        <h1 id="abertura-titulo">Sites bonitos e leves para <em>pequenos negócios</em>.</h1>
        <p class="abertura-lide">Eu crio o site do seu negócio com fotos reais, informação clara e um caminho direto para o cliente chamar você no WhatsApp. Para começar, é só uma conversa.</p>
        <div class="acoes">
          <a class="botao botao-primario botao-grande" href="${esc(hrefWa)}"${attrsWa}>${icone("whatsapp", 20)}Conversar no WhatsApp</a>
          <a class="botao botao-secundario botao-grande" href="#trabalhos">Ver trabalhos${icone("baixo", 18)}</a>
        </div>
        <p class="recado">${icone("mensagem", 16)}<span>Recebeu uma mensagem minha? Sou eu mesmo. Aqui você conhece quem está do outro lado.</span></p>
      </div>

      <figure class="ilustracao" aria-labelledby="ilustracao-legenda">
        <div class="celular" aria-hidden="true">
          <div class="celular-tela">
            <div class="mini-topo"><span class="mini-logo"></span><span class="mini-linha curta"></span></div>
            <div class="mini-fotos"><span></span><span></span><span></span></div>
            <p class="mini-rotulo">Fotos reais</p>
            <div class="mini-bloco"><span class="mini-estrelas">★★★★★</span><span class="mini-linha"></span><span class="mini-linha media"></span></div>
            <p class="mini-rotulo">Avaliações do Google</p>
            <div class="mini-bloco mini-mapa"><span class="mini-pino"></span></div>
            <p class="mini-rotulo">Horário, endereço e mapa</p>
            <div class="mini-botao">${icone("whatsapp", 13)}Chamar no WhatsApp</div>
          </div>
        </div>
        <figcaption id="ilustracao-legenda">Ilustração: o que um site pode reunir.</figcaption>
      </figure>
    </div>
  </section>

  <section class="secao" id="servicos" aria-labelledby="servicos-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">O que eu faço</p>
      <h2 id="servicos-titulo">Um site que mostra o seu negócio como ele é.</h2>
      <div class="servicos">
        <article class="servico servico-principal">
          <h3>Sites para pequenos negócios</h3>
          <p>É o meu trabalho principal hoje: uma página rápida no celular, com o que o cliente precisa saber antes de entrar em contato.</p>
          <ul class="lista-check">
            <li>${icone("check", 17)}Fotos reais do seu negócio</li>
            <li>${icone("check", 17)}Avaliações do Google</li>
            <li>${icone("check", 17)}Horário, endereço e mapa</li>
            <li>${icone("check", 17)}Botão para falar no WhatsApp</li>
          </ul>
          <p class="nota">Neste momento estou focado em óticas de bairro, mas o mesmo formato serve para outros negócios locais.</p>
        </article>
        <article class="servico">
          <h3>Aplicativos e outras soluções digitais</h3>
          <p>Também desenvolvo aplicativos e outras soluções digitais, quando o projeto pede mais do que um site.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="secao secao-clara" id="como-funciona" aria-labelledby="como-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Como é trabalhar comigo</p>
      <h2 id="como-titulo">Direto, sem burocracia.</h2>
      <ol class="passos">
        <li><h3>Conversa</h3><p>Você me conta sobre o seu negócio. Eu entendo o que você faz, quem são seus clientes e o que vale mostrar.</p></li>
        <li><h3>Proposta</h3><p>Sugiro o que faz sentido para você. Em alguns casos, já chego com uma demonstração feita com as fotos e informações do seu negócio.</p></li>
        <li><h3>Combinado</h3><p>Antes de começar, a gente combina o que entra no projeto e o valor.</p></li>
        <li><h3>Entrega</h3><p>Faço o que foi combinado e entrego o projeto pronto para usar.</p></li>
      </ol>
    </div>
  </section>

  <section class="secao" id="trabalhos" aria-labelledby="trabalhos-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Trabalhos selecionados</p>
      <h2 id="trabalhos-titulo">${temDemo ? "Projetos de clientes e demonstrações." : "Projetos de clientes."}</h2>
      <p class="secao-lide">${temDemo ? "Cada item diz o que é: projeto de cliente ou demonstração conceitual." : "Além de sites, também desenvolvo aplicativos."}</p>
      <ul class="trabalhos">${trabalhos.map(cartaoTrabalho).join("")}
      </ul>
    </div>
  </section>

  <section class="secao secao-clara" id="sobre" aria-labelledby="sobre-titulo">
    <div class="envoltorio sobre${pessoa.foto ? "" : " sem-foto"}">
      ${foto}
      <div class="sobre-texto">
        <p class="sobretitulo">Sobre mim</p>
        <h2 id="sobre-titulo">Oi, eu sou o ${esc(pessoa.nome)}.</h2>
        <p class="sobre-nome">${esc(nomeCompleto)} · fundador da Renderiza</p>
        <p>Desde ${esc(pessoa.desde)} crio soluções digitais para clientes, como sites e aplicativos. A Renderiza é o nome que dei a esse trabalho, e agora estou organizando a marca.</p>
        <p>Trabalho em tempo integral na ${esc(pessoa.trabalhoAtual)}. A Renderiza é um projeto meu, paralelo e independente, sem vínculo com a empresa.</p>
        <p>Quando você fala com a Renderiza, fala comigo.</p>
        ${contato.linkedin ? `<a class="botao botao-secundario" href="${esc(contato.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 17)}Ver meu perfil no LinkedIn</a>` : ""}
      </div>
    </div>
  </section>

  <section class="secao" id="perguntas" aria-labelledby="perguntas-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Antes de conversar</p>
      <h2 id="perguntas-titulo">Perguntas úteis.</h2>
      <div class="perguntas">
        <details>
          <summary>Como a gente começa?${icone("mais", 18)}</summary>
          <p>Você me chama no WhatsApp e conta um pouco sobre o seu negócio. Eu faço algumas perguntas, entendo o que faz sentido e sugiro o próximo passo.</p>
        </details>
        <details>
          <summary>Recebi uma demonstração. O que é isso?${icone("mais", 18)}</summary>
          <p>É uma versão de exemplo do site, feita por mim com as fotos e informações públicas do seu negócio, para você ver como ficaria antes de decidir qualquer coisa. O link é só seu e não aparece no Google. Se preferir que eu tire do ar, é só pedir.</p>
        </details>
        <details>
          <summary>Quanto custa?${icone("mais", 18)}</summary>
          <p>Depende do que o seu negócio precisa. O escopo e o valor são combinados caso a caso, antes de começar. Domínio (o endereço do site) e hospedagem podem ter custos próprios, e isso fica claro na conversa.</p>
        </details>
      </div>
    </div>
  </section>

  <section class="convite" id="contato" aria-labelledby="contato-titulo">
    <div class="envoltorio envoltorio-estreito">
      <h2 id="contato-titulo">Vamos conversar sobre o seu negócio?</h2>
      <p>Me chame no WhatsApp e conte um pouco sobre o que você faz.</p>
      <div class="acoes acoes-convite">
        ${temWa ? `<a class="botao botao-lima botao-grande" href="${esc(wa)}" target="_blank" rel="noopener">${icone("whatsapp", 20)}Conversar no WhatsApp</a>` : ""}
        ${contato.linkedin ? `<a class="botao botao-contorno botao-grande" href="${esc(contato.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 18)}LinkedIn</a>` : ""}
        ${!temWa && !contato.linkedin ? `<p class="convite-pendente">Os canais de contato estão sendo atualizados.</p>` : ""}
      </div>
      ${telefone ? `<p class="convite-numero">WhatsApp da Renderiza: <a href="${esc(wa)}" target="_blank" rel="noopener">${esc(telefone)}</a></p>` : ""}
    </div>
  </section>
</main>

<footer class="rodape">
  <div class="envoltorio rodape-grade">
    <div>
      <a class="marca marca-rodape" href="#inicio" aria-label="Renderiza, voltar ao início">${icone("marca", 20)}<span>renderiza<span class="marca-ponto">.</span></span></a>
      <p>Sites e soluções digitais para pequenos negócios.<br>Um projeto independente de ${esc(nomeCompleto)}.</p>
    </div>
    ${redes.length ? `<nav class="rodape-redes" aria-label="Contato">${redes.join("")}</nav>` : ""}
  </div>
  <div class="envoltorio rodape-base">
    <span>© ${ano} Renderiza</span>
    <a class="rodape-entrar" href="/login">Entrar</a>
  </div>
</footer>
</body>
</html>
`;
}
