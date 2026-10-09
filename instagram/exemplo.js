// O site de exemplo dos posts: "Lume Estética", um negócio fictício (nenhum cliente aparece sem autorização).
// Fotos de banco livres (Unsplash), baixadas pelo gerar.mjs para rascunhos/instagram/fotos/. Avaliações e textos
// longos ficam como linhas cinza: nada de depoimento inventado.
const FOTOS = "../rascunhos/instagram/fotos/";
const foto = n => FOTOS + n + ".jpg";
const linhas = (...larguras) => larguras.map(w => `<span class="sk" style="width:${w}%"></span>`).join("");
const ZAP = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 4C9.4 4 4 9.38 4 16c0 2.11.55 4.18 1.6 6L4 28l6.18-1.6A12.02 12.02 0 0 0 28.06 16C28.06 9.38 22.67 4 16.04 4Zm5.44 14.49c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/></svg>';
const MAPA = `<svg viewBox="0 0 360 190" preserveAspectRatio="xMidYMid slice"><g stroke="#fff" stroke-linecap="round" fill="none">
  <path d="M-10 60 L380 20" stroke-width="14"/><path d="M-10 150 L380 110" stroke-width="10"/><path d="M90 -10 L130 200" stroke-width="10"/>
  <path d="M250 -10 L220 200" stroke-width="14"/><path d="M-10 105 L380 70" stroke-width="5" opacity=".8"/><path d="M170 -10 L180 200" stroke-width="5" opacity=".8"/></g>
  <rect x="140" y="128" width="60" height="40" rx="6" fill="#d9e8cf"/><rect x="20" y="10" width="54" height="34" rx="6" fill="#d9e8cf"/>
  <g transform="translate(196 58)"><path d="M0 0c-13 0-22 9-22 21 0 16 22 37 22 37s22-21 22-37C22 9 13 0 0 0Z" fill="#b6806a"/><circle cx="0" cy="20" r="8" fill="#fff"/></g></svg>`;

export function siteDeExemplo() {
  return `<div class="lume">
  <header class="l-topo"><span class="l-logo">Lume <small>estética</small></span><span class="l-menu"></span></header>
  <section class="l-hero" data-parada="hero"><img src="${foto("hero")}" alt="">
    <div class="l-hero-txt"><p class="l-eyebrow">Estética facial e corporal</p><h1>Sua pele, <em>bem cuidada.</em></h1>
      <a class="l-btn" data-alvo="agendar">${ZAP}Agendar pelo WhatsApp</a><p class="l-nota"><b>★★★★★</b>Avaliações no Google</p></div></section>
  <section class="l-sec l-sobre" data-parada="sobre"><img src="${foto("ambiente")}" alt=""><h2>Um espaço feito <em>para você relaxar.</em></h2>${linhas(96, 88, 64)}</section>
  <section class="l-sec" data-parada="servicos"><h2>Tratamentos</h2><div class="l-cards">
    <div class="l-card"><img src="${foto("facial")}" alt=""><p>Limpeza de pele</p></div>
    <div class="l-card"><img src="${foto("massagem")}" alt=""><p>Massagem relaxante</p></div>
    <div class="l-card"><img src="${foto("unhas")}" alt=""><p>Mãos e unhas</p></div></div></section>
  <section class="l-sec" data-parada="avaliacoes"><h2>Quem vem, <em>volta.</em></h2>
    <div class="l-av-topo"><span class="l-g"></span><div><b>★★★★★</b><span>Avaliações no Google</span></div></div>
    <div class="l-av"><b>★★★★★</b>${linhas(94, 86, 52)}</div><div class="l-av"><b>★★★★★</b>${linhas(90, 70)}</div></section>
  <section class="l-sec" data-parada="fotos"><h2>Nosso dia a dia</h2><div class="l-galeria">
    <img src="${foto("sorriso")}" alt=""><img src="${foto("toalha")}" alt=""><img src="${foto("pedras")}" alt=""><img src="${foto("luvas")}" alt=""></div></section>
  <section class="l-sec" data-parada="contato"><h2>Fale com a gente</h2><a class="l-btn l-zap" data-alvo="whatsapp">${ZAP}Chamar no WhatsApp</a></section>
  <section class="l-sec" data-parada="mapa"><h2>Como chegar</h2><div class="l-mapa">${MAPA}</div>
    <p class="l-horario"><span>Seg a sex</span><b>9h às 19h</b></p><p class="l-horario"><span>Sábado</span><b>9h às 14h</b></p></section>
  <footer class="l-rodape">Lume estética</footer></div>`;
}

/** Perfil de Instagram de exemplo (foto, nome, grade de 3 × 3). */
export function instagramDeExemplo() {
  const grade = ["hero", "ambiente", "facial", "sorriso", "massagem", "toalha", "unhas", "pedras", "luvas"];
  return `<div class="ig">
  <div class="ig-topo"><b>lume.estetica</b></div>
  <div class="ig-perfil"><img class="ig-avatar" src="${foto("toalha")}" alt=""><div class="ig-nums"><span><b></b>posts</span><span><b></b>seguidores</span><span><b></b>seguindo</span></div></div>
  <p class="ig-nome">Lume Estética</p>${linhas(80, 62)}
  <div class="ig-botoes"><span>Seguir</span><span>Mensagem</span></div>
  <div class="ig-grade">${grade.map(n => `<img src="${foto(n)}" alt="">`).join("")}</div></div>`;
}

/** Página de "link na bio" cheia de botões: o antes do Reels. */
export function linkNaBio() {
  const botoes = ["WhatsApp", "Agende aqui", "Promoções do mês", "Tabela de tratamentos", "Localização", "Avaliações", "Formulário de cadastro", "Fale conosco"];
  return `<div class="bio"><img class="bio-avatar" src="${foto("toalha")}" alt=""><p class="bio-nome">@lume.estetica</p>
  ${botoes.map((b, i) => `<span class="bio-btn" data-i="${i}">${b}</span>`).join("")}</div>`;
}

export const fotosDoExemplo = foto;
export { ZAP };
