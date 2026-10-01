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
  // Ícones dos recursos (Lucide).
  haltere: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  escanear: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  painel: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  sino: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  estrela: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  loja: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
  megafone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  grade: '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>',
  escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  grafico: '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
  pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  aspas: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  voltar: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  brilho: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  selo: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
};
const icone = (nome, tam = 18) =>
  `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONES[nome]}</svg>`;

/** O que ainda falta preencher em site/config.mjs (o build mostra no terminal). */
export function pendencias(config) {
  const p = [];
  if (!config.contato.whatsapp) p.push("WhatsApp Business (contato.whatsapp)");
  if (!config.contato.linkedin) p.push("LinkedIn pessoal (contato.linkedin)");
  if (!config.pessoa.foto) p.push("foto real (pessoa.foto)");
  for (const t of config.trabalhos) if (t.publicar && t.falta) p.push(`trabalho "${t.titulo}": ${t.falta}`);
  for (const d of config.depoimentos || []) if (!d.texto || !d.publicar) p.push(`depoimento de ${d.nome || d.papel}: ${d.texto ? "aguardando aprovação (publicar: false)" : "texto ainda não recebido"}`);
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

const dominio = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

const TIPOS_DE_TRABALHO = ["cliente", "demonstracao"];

function linkDoTrabalho(t, texto) {
  if (!t.link) return "";
  const externo = /^https?:/.test(t.link);
  return `<a class="trabalho-link" href="${esc(t.link)}"${externo ? ' target="_blank" rel="noopener"' : ""}>${esc(texto)}${icone("externo", 15)}${externo ? '<span class="sr-only"> (abre em outra aba)</span>' : ""}</a>`;
}

function validarTrabalho(t) {
  if (!TIPOS_DE_TRABALHO.includes(t.selo)) throw new Error(`site/config.mjs: trabalho "${t.id}" com selo desconhecido (${t.selo}). Use "cliente" ou "demonstracao".`);
}

/** Trabalho em destaque: print grande, o que o produto faz e os recursos que a Renderiza desenvolveu. */
function trabalhoDestaque(t) {
  validarTrabalho(t);
  const idDe = r => `recurso-${t.id}-${r.titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const recursos = (t.recursos || []).map(r => `
              <li${r.ia ? ' class="com-ia"' : ""}>
                <span class="recurso-icone">${icone(ICONES[r.icone] ? r.icone : "check", 20)}</span>
                <div><h4>${esc(r.titulo)}${r.ia ? `<span class="selo-ia">${icone("brilho", 12)}IA</span>` : ""}</h4><p>${esc(r.texto)}</p>
                ${r.imagem ? `<button class="recurso-ver" type="button" data-abrir="${idDe(r)}" aria-haspopup="dialog">Ver tela${icone("seta", 14)}<span class="sr-only">: ${esc(r.titulo)}</span></button>` : ""}</div>
              </li>`).join("");
  // Um <dialog> por recurso: tela real, texto e link para o produto. Fechado, a imagem não carrega.
  const janelas = (t.recursos || []).filter(r => r.imagem).map(r => `
      <dialog class="janela-recurso${r.formato === "paisagem" ? " janela-paisagem" : ""}" id="${idDe(r)}" aria-labelledby="${idDe(r)}-titulo">
        <div class="janela-grade">
          <figure class="janela-tela">
            <img src="${esc(r.imagem)}" alt="Tela ${esc(r.titulo)} do app ${esc(t.titulo)}" width="${r.largura || 540}" height="${r.altura || 1169}" loading="lazy" decoding="async">
            <figcaption>Tela real do app, com dados de exemplo.</figcaption>
          </figure>
          <div class="janela-texto">
            <p class="trabalho-meta"><span>${esc(t.titulo)}</span></p>
            <h3 id="${idDe(r)}-titulo">${esc(r.titulo)}${r.ia ? `<span class="selo-ia">${icone("brilho", 12)}IA</span>` : ""}</h3>
            <p>${esc(r.detalhe || r.texto)}</p>
            ${r.link ? `<a class="botao botao-primario" href="${esc(r.link)}" target="_blank" rel="noopener">Ver no site ${t.titulo === "Move" ? "do" : "de"} ${esc(t.titulo)}${icone("externo", 16)}<span class="sr-only"> (abre em outra aba)</span></a>` : ""}
          </div>
        </div>
        <form method="dialog"><button class="janela-fechar" type="submit" aria-label="Fechar">${icone("fechar", 20)}</button></form>
      </dialog>`).join("");
  const comIa = (t.recursos || []).filter(r => r.ia).length;
  return `
      <article class="destaque">
        ${t.imagem ? `<div class="destaque-imagem"><img src="${esc(t.imagem)}" alt="${esc(t.alt || "Tela do " + t.titulo)}" width="1200" height="672" loading="lazy" decoding="async"></div>` : ""}
        <div class="destaque-corpo">
          <p class="trabalho-meta">${t.selo === "demonstracao" ? '<span class="selo selo-demonstracao">Demonstração conceitual</span>' : ""}<span>${esc(t.tipo)}</span></p>
          <h3>${esc(t.titulo)}</h3>
          <p class="destaque-texto">${esc(t.texto)}</p>
          ${recursos ? `<p class="recursos-titulo">O que a Renderiza desenvolveu${comIa ? `, com ${comIa} recursos de inteligência artificial` : ""}</p>
          <ul class="recursos">${recursos}
          </ul>` : ""}
          <div class="destaque-rodape">
            ${t.credito ? `<p class="credito">${esc(t.credito)}</p>` : ""}
            ${linkDoTrabalho(t, t.linkTexto || "Ver o projeto")}
          </div>
        </div>${janelas}
      </article>`;
}

function cartaoTrabalho(t) {
  validarTrabalho(t);
  // Sem print real, o cartão mostra só uma inicial (não finge ser imagem do trabalho).
  const visual = t.imagem
    ? `<div class="trabalho-imagem"><img src="${esc(t.imagem)}" alt="${esc(t.alt || "Tela do trabalho " + t.titulo)}" loading="lazy" decoding="async"></div>`
    : `<span class="trabalho-monograma monograma-${esc(t.selo)}" aria-hidden="true">${esc(t.titulo.replace(/^Óticas?\s+/i, "").charAt(0).toUpperCase())}</span>`;
  return `
        <li class="trabalho${t.imagem ? " com-imagem" : ""}">
          ${visual}
          <div class="trabalho-corpo">
            <p class="trabalho-meta">${t.selo === "demonstracao" ? '<span class="selo selo-demonstracao">Demonstração conceitual</span>' : ""}<span>${esc(t.tipo)}</span></p>
            <h3>${esc(t.titulo)}</h3>
            <p>${esc(t.texto)}</p>
            ${linkDoTrabalho(t, "Ver o trabalho")}
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
  const telefone = telefoneLegivel(contato.whatsapp);
  const trabalhos = config.trabalhos.filter(t => t.publicar);
  const destaques = trabalhos.filter(t => t.destaque);
  const demais = trabalhos.filter(t => !t.destaque);
  const temDemo = trabalhos.some(t => t.selo === "demonstracao");
  // Abertura mostra trabalho real: o primeiro destaque com print.
  const vitrine = destaques.find(t => t.imagem);
  const depoimentos = (config.depoimentos || []).filter(d => d.publicar && d.texto && d.texto.trim());

  const titulo = "Renderiza · Sites e aplicativos para o seu negócio";
  const descricao = `Sites rápidos e bem-feitos para pequenos negócios e aplicativos sob medida. Renderiza, de ${nomeCompleto}, desenvolvedor de software há ${pessoa.anosDeExperiencia} anos.`;

  const avatar = pessoa.avatar || pessoa.foto
    ? `<img src="${esc(pessoa.avatar || pessoa.foto)}" alt="" width="44" height="44" decoding="async" fetchpriority="high">`
    : `<span aria-hidden="true">${esc(pessoa.nome.charAt(0))}</span>`;
  const foto = pessoa.foto
    ? `<div class="sobre-foto"><img src="${esc(pessoa.foto)}" alt="Foto de ${esc(nomeCompleto)}" width="720" height="960" loading="lazy" decoding="async"></div>`
    : "";

  const redes = [
    temWa && `<a href="${esc(wa)}" target="_blank" rel="noopener">${icone("whatsapp", 17)}WhatsApp ${esc(telefone)}</a>`,
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
<meta property="og:image:alt" content="Renderiza: do site da loja ao aplicativo com IA">
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
      <a href="#trabalhos">Trabalhos</a>
      <a href="#como-funciona">Como funciona</a>
      <a href="#sobre">Quem faz</a>
    </nav>
    <a class="botao botao-primario botao-topo" href="${esc(hrefWa)}"${attrsWa}>${icone("whatsapp", 17)}<span>WhatsApp</span></a>
  </div>
</header>

<main id="conteudo">
  <section class="abertura" id="inicio" aria-labelledby="abertura-titulo">
    <div class="envoltorio abertura-grade">
      <div class="abertura-texto">
        <p class="assinatura"><span class="avatar">${avatar}</span><span><strong>${esc(nomeCompleto)}</strong><small>Fundador da Renderiza</small></span></p>
        <h1 id="abertura-titulo">Do site da loja ao <em>aplicativo com IA</em>.</h1>
        <p class="abertura-lide">Sites e aplicativos sob medida, feitos de ponta a ponta por um desenvolvedor com ${esc(pessoa.anosDeExperiencia)} anos de experiência em produto. Você fala direto com quem desenvolve.</p>
        <div class="acoes">
          <a class="botao botao-primario botao-grande" href="${esc(hrefWa)}"${attrsWa}>${icone("whatsapp", 20)}Conversar no WhatsApp</a>
          <a class="botao botao-secundario botao-grande" href="#trabalhos">Ver trabalhos${icone("baixo", 18)}</a>
        </div>
        ${telefone ? `<p class="canal-oficial">${icone("selo", 16)}<span>WhatsApp oficial: <strong>${esc(telefone)}</strong></span></p>` : ""}
      </div>

${vitrine ? `<figure class="vitrine">
        <div class="navegador">
          <div class="navegador-barra" aria-hidden="true"><span></span><span></span><span></span><em>${esc(dominio(vitrine.link))}</em></div>
          <img src="${esc(vitrine.imagem)}" alt="${esc(vitrine.alt || "Tela do " + vitrine.titulo)}" width="1200" height="672" loading="lazy" decoding="async">
        </div>
        ${vitrine.imagemCelular ? `<div class="vitrine-celular"><img src="${esc(vitrine.imagemCelular)}" alt="" width="360" height="779" loading="lazy" decoding="async"></div>` : ""}
        <figcaption><a href="#trabalhos"><strong>${esc(vitrine.titulo)}</strong> · ${esc(vitrine.legenda || vitrine.tipo)}${icone("baixo", 14)}</a></figcaption>
      </figure>` : ""}
    </div>
  </section>

  <section class="dor" id="por-que" aria-labelledby="dor-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Por que ter um site</p>
      <h2 id="dor-titulo">Seus clientes te conhecem. <em>O cliente novo, não.</em></h2>
      <p class="dor-lide">Quem foi indicado ou ouviu falar da sua loja pesquisa antes de ir. O site é o que ele encontra: a melhor versão do seu negócio, a um toque do WhatsApp.</p>
      <ul class="dores">
        <li>
          <span class="dor-icone">${icone("painel", 20)}</span>
          <h3>Tudo num lugar só</h3>
          <p>Fotos, avaliações, endereço, horário, Instagram e WhatsApp numa página. Um link para mandar a qualquer cliente.</p>
        </li>
        <li>
          <span class="dor-icone">${icone("loja", 20)}</span>
          <h3>Mais profissional</h3>
          <p>Sua loja com cara de negócio estabelecido, lado a lado com as grandes redes, mostrando o que elas não têm: o seu atendimento.</p>
        </li>
        <li>
          <span class="dor-icone">${icone("megafone", 20)}</span>
          <h3>Pronto para anunciar</h3>
          <p>Se um dia quiser investir em anúncios, eles já têm para onde levar: uma página feita para virar conversa no WhatsApp.</p>
        </li>
      </ul>
      <p class="dor-fecho">O Instagram continua sendo o seu dia a dia. <em>O site é a sua primeira impressão.</em></p>
    </div>
  </section>

  <section class="secao" id="servicos" aria-labelledby="servicos-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">O que eu faço</p>
      <h2 id="servicos-titulo">Do tamanho que o seu negócio precisa.</h2>
      <div class="servicos">
        <article class="servico servico-principal">
          <h3>Sites para pequenos negócios</h3>
          <p>Uma página rápida no celular, com o que o cliente precisa saber antes de entrar em contato.</p>
          <ul class="lista-check">
            <li>${icone("check", 17)}Fotos reais do seu negócio</li>
            <li>${icone("check", 17)}Avaliações do Google</li>
            <li>${icone("check", 17)}Horário, endereço e mapa</li>
            <li>${icone("check", 17)}Botão para falar no WhatsApp</li>
          </ul>
        </article>
        <article class="servico">
          <h3>Aplicativos e sistemas sob medida</h3>
          <p>Para projetos que pedem mais que um site: login, painel de gestão, integrações e recursos com inteligência artificial.</p>
          ${destaques.length ? `<a class="trabalho-link" href="#trabalhos">Ver um exemplo${icone("baixo", 15)}</a>` : ""}
        </article>
      </div>
    </div>
  </section>

  <section class="secao secao-clara" id="trabalhos" aria-labelledby="trabalhos-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Trabalhos realizados</p>
      <h2 id="trabalhos-titulo">${temDemo ? "Projetos de clientes e demonstrações." : "Projetos de clientes."}</h2>
      ${destaques.map(trabalhoDestaque).join("")}
      ${demais.length ? `<ul class="trabalhos">${demais.map(cartaoTrabalho).join("")}
      </ul>` : ""}
    </div>
  </section>

${depoimentos.length ? `  <section class="secao" id="depoimentos" aria-labelledby="depoimentos-titulo">
    <div class="envoltorio carrossel" data-carrossel>
      <div class="carrossel-topo">
        <div>
          <p class="sobretitulo">Depoimentos</p>
          <h2 id="depoimentos-titulo">Quem já trabalhou comigo.</h2>
        </div>
        <div class="carrossel-setas" hidden>
          <button type="button" data-anterior aria-label="Depoimento anterior" aria-controls="depoimentos-lista">${icone("voltar", 20)}</button>
          <button type="button" data-proximo aria-label="Próximo depoimento" aria-controls="depoimentos-lista">${icone("seta", 20)}</button>
        </div>
      </div>
      <ul class="depoimentos" id="depoimentos-lista" tabindex="0" aria-label="Depoimentos (deslize para o lado)">${depoimentos.map((d, i) => `
        <li aria-label="${i + 1} de ${depoimentos.length}">
          <figure>
            <span class="depoimento-aspas">${icone("aspas", 22)}</span>
            <blockquote><p>${esc(d.texto)}</p></blockquote>
            <figcaption>
              ${d.foto ? `<img src="${esc(d.foto)}" alt="" width="44" height="44" loading="lazy" decoding="async">` : `<span class="depoimento-inicial" aria-hidden="true">${esc((d.nome || d.papel).charAt(0))}</span>`}
              <span><strong>${esc(d.nome || d.papel)}</strong>${d.nome && d.papel ? `<small>${esc(d.papel)}</small>` : ""}</span>
            </figcaption>
          </figure>
        </li>`).join("")}
      </ul>
      <div class="carrossel-pontos" hidden>${depoimentos.map((d, i) => `<button type="button" data-ir="${i}" aria-label="Ver depoimento ${i + 1} de ${depoimentos.length}"></button>`).join("")}</div>
    </div>
  </section>

` : ""}  <section class="secao" id="como-funciona" aria-labelledby="como-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Como funciona</p>
      <h2 id="como-titulo">Direto, sem burocracia.</h2>
      <ol class="passos">
        <li><h3>Conversa</h3><p>Entendo o seu negócio, seus clientes e o que vale mostrar.</p></li>
        <li><h3>Proposta</h3><p>Apresento a solução. Em alguns casos, já com uma prévia feita com as informações do seu negócio.</p></li>
        <li><h3>Combinado</h3><p>Escopo e valor definidos antes de começar.</p></li>
        <li><h3>Entrega</h3><p>Desenvolvo o que foi combinado e entrego pronto para usar.</p></li>
      </ol>
    </div>
  </section>

  <section class="secao secao-clara" id="sobre" aria-labelledby="sobre-titulo">
    <div class="envoltorio sobre${pessoa.foto ? "" : " sem-foto"}">
      ${foto}
      <div class="sobre-texto">
        <p class="sobretitulo">Quem faz</p>
        <h2 id="sobre-titulo">${esc(nomeCompleto)}</h2>
        <p class="sobre-cargo">Desenvolvedor de software e fundador da Renderiza</p>
        <p>Sou desenvolvedor há ${esc(pessoa.anosDeExperiencia)} anos, com foco em produto: entender o problema de quem vai usar e entregar algo simples, bonito e que funciona.</p>
        <p>Atuo em tempo integral na ${esc(pessoa.trabalhoAtual)} e, em paralelo, conduzo a Renderiza, meu projeto independente de sites e aplicativos. Aqui, cada projeto é feito por mim, do primeiro contato à entrega.</p>
        <div class="sobre-acoes">
          ${contato.linkedin ? `<a class="botao botao-secundario" href="${esc(contato.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 17)}Ver perfil no LinkedIn</a>` : ""}
        </div>
      </div>
    </div>
  </section>

  <section class="secao" id="perguntas" aria-labelledby="perguntas-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Perguntas frequentes</p>
      <h2 id="perguntas-titulo">Antes de começar.</h2>
      <div class="perguntas">
        <details>
          <summary>Como começamos?${icone("mais", 18)}</summary>
          <p>Pelo WhatsApp. Você conta sobre o seu negócio e eu indico o próximo passo.</p>
        </details>
        <details>
          <summary>Recebi uma prévia do meu site. O que é?${icone("mais", 18)}</summary>
          <p>Uma demonstração feita com informações públicas do seu negócio, para você avaliar antes de qualquer compromisso. O link é privado e sai do ar quando você pedir.</p>
        </details>
        <details>
          <summary>Quanto custa?${icone("mais", 18)}</summary>
          <p>Depende do escopo, combinado caso a caso antes de começar. Domínio e hospedagem podem ter custos próprios.</p>
        </details>
      </div>
    </div>
  </section>

  <section class="convite" id="contato" aria-labelledby="contato-titulo">
    <div class="envoltorio envoltorio-estreito">
      <h2 id="contato-titulo">Vamos conversar sobre o seu projeto?</h2>
      <p>Conte pelo WhatsApp o que você precisa.</p>
      <div class="acoes acoes-convite">
        ${temWa ? `<a class="botao botao-lima botao-grande" href="${esc(wa)}" target="_blank" rel="noopener">${icone("whatsapp", 20)}Conversar no WhatsApp</a>` : ""}
        ${contato.linkedin ? `<a class="botao botao-contorno botao-grande" href="${esc(contato.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 18)}LinkedIn</a>` : ""}
        ${!temWa && !contato.linkedin ? `<p class="convite-pendente">Os canais de contato estão sendo atualizados.</p>` : ""}
      </div>
    </div>
  </section>
</main>

<footer class="rodape">
  <div class="envoltorio rodape-grade">
    <div>
      <a class="marca marca-rodape" href="#inicio" aria-label="Renderiza, voltar ao início">${icone("marca", 20)}<span>renderiza<span class="marca-ponto">.</span></span></a>
      <p>Sites e aplicativos para negócios.<br>Um projeto independente de ${esc(nomeCompleto)}.</p>
    </div>
    ${redes.length ? `<nav class="rodape-redes" aria-label="Contato">${redes.join("")}</nav>` : ""}
  </div>
  <div class="envoltorio rodape-base">
    <span>© ${ano} Renderiza</span>
    <a class="rodape-entrar" href="/login">Entrar</a>
  </div>
</footer>
<script>/* carrossel de depoimentos: setas e pontos sobre a rolagem nativa (sem JS, desliza do mesmo jeito) */document.querySelectorAll("[data-carrossel]").forEach(function(c){var t=c.querySelector(".depoimentos"),it=[].slice.call(t.children),a=c.querySelector("[data-anterior]"),p=c.querySelector("[data-proximo]"),ps=[].slice.call(c.querySelectorAll("[data-ir]"));if(it.length<2)return;c.querySelectorAll("[hidden]").forEach(function(e){e.hidden=false});var suave=matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";function passo(){return it[1].offsetLeft-it[0].offsetLeft}function fim(){return t.scrollLeft>=t.scrollWidth-t.clientWidth-4}function ultimo(){return Math.max(0,Math.ceil((t.scrollWidth-t.clientWidth-4)/passo()))}function ir(i){t.scrollTo({left:Math.max(0,Math.min(i,ultimo()))*passo(),behavior:suave})}function atual(){return fim()?ultimo():Math.round(t.scrollLeft/passo())}function marcar(){var i=atual(),u=ultimo();a.disabled=t.scrollLeft<4;p.disabled=fim();ps.forEach(function(b,k){b.hidden=k>u;b.setAttribute("aria-current",k===i?"true":"false")});c.classList.toggle("tudo-visivel",t.scrollWidth<=t.clientWidth+4)}a.addEventListener("click",function(){ir(atual()-1)});p.addEventListener("click",function(){ir(atual()+1)});ps.forEach(function(b){b.addEventListener("click",function(){ir(+b.dataset.ir)})});var r;t.addEventListener("scroll",function(){cancelAnimationFrame(r);r=requestAnimationFrame(marcar)},{passive:true});addEventListener("resize",marcar);marcar()})</script>
<script>/* "Ver tela": abre o pop-up do recurso; tocar fora ou Esc fecha */document.querySelectorAll("[data-abrir]").forEach(function(b){var d=document.getElementById(b.dataset.abrir);if(!d||!d.showModal)return;b.addEventListener("click",function(){d.showModal()});d.addEventListener("click",function(e){if(e.target===d)d.close()})})</script>
</body>
</html>
`;
}
