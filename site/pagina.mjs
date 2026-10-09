// Monta a home pública (/) a partir de site/config.mjs e site/estilo.css.
// HTML pronto no build: sem JavaScript para mostrar o conteúdo, com o CSS dentro da página.
//
// A ordem da página é a da venda consultiva (SPIN, de Neil Rackham), a mesma das conversas no WhatsApp
// (doc "SPIN no WhatsApp · Renderiza"). Cada seção tem um papel; mudar a ordem muda a venda:
//   abertura     o que fazemos, em 5 segundos, com dois sites de clientes no ar
//   S · Situação o caminho do cliente novo hoje (a gente mostra que conhece, não pergunta)
//   P · Problema o teste: o dono marca o que o negócio já tem
//   I · Implicação no próprio teste, o que cada item que falta custa
//   N · Necessidade "e se o cliente já chegasse sabendo?"; só então o site aparece, como resposta
//   capacidade   como funciona, trabalhos, depoimentos e quem somos
//   compromisso  objeções prevenidas (perguntas) e um avanço concreto: pedir a prévia no WhatsApp
// Regras: nada de preço (é para a conversa), promessa de resultado, superlativo, dado inventado ou "de bairro".

import { readFileSync } from "node:fs";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const ICONES = {
  // Logo do WhatsApp (Simple Icons, CC0): é preenchido, os outros são de traço (Lucide).
  whatsapp: '<path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  seta: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  baixo: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  externo: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  mensagem: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  pergunta: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  mais: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  // Ícones dos recursos (Lucide).
  haltere: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  escanear: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  painel: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  sino: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  grade: '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>',
  escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  grafico: '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
  pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  aspas: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  voltar: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  brilho: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
};
// Símbolo da Renderiza (vetorizado do logo original em site/marca/logo-original.webp). Cor = currentColor.
const SIMBOLO = readFileSync(new URL("./estatico/simbolo.svg", import.meta.url), "utf8");
const simbolo = tam => SIMBOLO.replace("<svg ", `<svg width="${tam}" height="${tam}" aria-hidden="true" focusable="false" `);

const icone = (nome, tam = 18) =>
  `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONES[nome]}</svg>`;

/** A frase da abertura: o h1 da home e a imagem de compartilhamento (scripts/imagens-do-site.mjs). */
export const FRASE = { inicio: "O site do seu negócio,", destaque: "pronto antes de você pedir." };

// S · Situação: o caminho do cliente novo hoje. A gente mostra que conhece; o problema aparece sozinho no 3º passo.
const CAMINHO = [
  { icone: "pessoas", titulo: "Ouve falar de você", texto: "Por indicação, num post ou passando na frente." },
  { icone: "busca", titulo: "Pesquisa antes de chamar", texto: "Procura no Instagram e no Google as fotos, o endereço, o horário e o que os outros clientes acham." },
  { icone: "pergunta", titulo: "Encontra tudo espalhado", texto: "Um pouco no feed, um pouco no Google, um pouco no link da bio. O resto, precisa perguntar." },
];

// P · Problema e I · Implicação: o teste. Cada item é uma situação que o dono reconhece (P); "custo" é o que
// acontece quando falta (I). "rotulo" vai na mensagem do WhatsApp ("Ainda não tenho ..."): o cliente já chega
// dizendo, com as palavras dele, o que falta.
export const TESTE = [
  { id: "link", rotulo: "um link oficial", texto: "Quando pedem informações, você manda um link oficial com tudo.", custo: "Sem ele, vai tudo picado: o endereço numa mensagem, o horário em outra, as fotos em outra." },
  { id: "endereco", rotulo: "endereço e horário a um toque", texto: "Endereço, mapa e horário estão a um toque, sem precisar perguntar.", custo: "Quem precisa perguntar se você abre no sábado nem sempre pergunta. Às vezes só vai a outro lugar." },
  { id: "avaliacoes", rotulo: "avaliações à vista", texto: "Quem chega pelo Instagram vê o que os seus clientes dizem de você.", custo: "As avaliações ficam no Google, longe de quem está decidindo se chama você." },
  { id: "servicos", rotulo: "serviços explicados", texto: "O cliente entende o que você faz sem rolar o feed inteiro.", custo: "O resto vira pergunta no direct, e você responde as mesmas coisas todos os dias." },
  { id: "toque", rotulo: "contato em um toque", texto: "O cliente fala com você em um toque, com a mensagem já começada.", custo: "Cada passo a mais entre a vontade e a mensagem é uma chance de desistir." },
];

// N · Necessidade: depois do teste, o site entra como resposta. Uma linha para cada item do teste, na mesma ordem.
const HOJE_E_NO_SITE = [
  ["O endereço numa mensagem, o horário em outra, as fotos em outra.", "Um link com o nome do seu negócio e tudo dentro."],
  ["“Onde fica?” “Abre no sábado?”", "Endereço, mapa e horário logo de cara, com a rota a um toque."],
  ["As avaliações, só para quem procura no Google.", "O que os seus clientes dizem, logo na entrada."],
  ["“Como funciona?” “Vocês fazem…?” no direct.", "Suas fotos reais e seus serviços explicados antes da pergunta."],
  ["Procurar onde clicar para falar com você.", "WhatsApp em um toque, com a mensagem já começada."],
];

// Como funciona: o caminho da prévia até o ar, para quem quer entender o fluxo antes de chamar.
const PASSOS = [
  ["A gente conhece o seu negócio", "Pelo Instagram e pelo Google: as fotos, o que você faz e o que os clientes dizem."],
  ["Monta a prévia com as suas fotos", "Fotos reais da equipe, do espaço e dos clientes, escolhidas uma a uma."],
  ["Você vê no celular", "Um vídeo curto e o link da prévia, só seu. Sem compromisso."],
  ["Ajusta com a gente", "Você diz o que mudar, e a gente ajusta até ficar com a cara do seu negócio."],
  ["Vai para o ar no seu nome", "Com o endereço do seu negócio, como seunegocio.com.br. Os acessos ficam com você."],
];

// Objeções prevenidas: as que aparecem na conversa, respondidas antes de virar objeção. Preço fica para a conversa.
const PERGUNTAS = [
  ["Recebi uma prévia do meu site. O que é?", "Uma demonstração feita só para você, com o que o seu negócio já mostra em público: as fotos do Instagram, as avaliações e o horário do Google. O link não aparece no Google e sai do ar sozinho em 7 dias; se preferir, a gente tira antes. Para ver, você não passa nenhum dado nem paga nada."],
  ["Já tenho Instagram. Preciso de um site?", "O Instagram mostra o seu dia a dia e continua importante. O site junta, num link só, o que o cliente novo procura antes de chamar: endereço, horário, serviços, avaliações e WhatsApp. E ainda leva para o seu Instagram."],
  ["Quanto custa?", "Um valor fechado, combinado na conversa, depois que você vê a prévia. Ver a prévia não custa nada, e você só paga se decidir colocar o site no ar. O domínio e a hospedagem ficam no seu nome e podem ter custos próprios."],
  ["O site fica no meu nome?", "Fica. O endereço, a hospedagem e os acessos são do seu negócio, não da Renderiza. Se um dia quiser que outra pessoa cuide do site, é só passar os acessos."],
  ["Quem decide é outra pessoa. E agora?", "Encaminhe o vídeo e o link da prévia para quem decide: abrem em qualquer celular. Se preferir, conte o nome e o melhor horário dessa pessoa, e a gente fala direto com ela."],
];

// Mensagens que já chegam escritas no WhatsApp: cada botão pede um avanço concreto, não um "vou ver".
const MENSAGEM = {
  teste: "Oi! Fiz o teste no site da Renderiza e quero ver como ficaria o site do meu negócio.",
  convite: "Oi! Quero ver como ficaria o site do meu negócio. O Instagram é @",
  aplicativo: "Oi! Vi o site da Renderiza e quero conversar sobre um aplicativo.",
};

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

/** Link do WhatsApp com a mensagem já escrita (a do config, se nenhuma for passada). */
export function linkWhatsapp(contato, mensagem = contato.mensagemWhatsapp) {
  const numero = String(contato.whatsapp || "").replace(/\D/g, "");
  if (!numero) return "";
  return `https://wa.me/${numero}` + (mensagem ? "?text=" + encodeURIComponent(mensagem) : "");
}

/** "5511988697165" → "(11) 98869-7165" (números do Brasil); outros ficam como vieram. */
export function telefoneLegivel(numero) {
  const d = String(numero || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

const TIPOS_DE_TRABALHO = ["cliente", "demonstracao"];


function validarTrabalho(t) {
  if (!TIPOS_DE_TRABALHO.includes(t.selo)) throw new Error(`site/config.mjs: trabalho "${t.id}" com selo desconhecido (${t.selo}). Use "cliente" ou "demonstracao".`);
}

const slug = texto => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const idDoRecurso = (t, r) => `recurso-${t.id}-${slug(r.titulo)}`;
const seloIa = () => `<span class="selo-ia">${icone("brilho", 12)}IA</span>`;
// Print do desktop: 1400 px no cartão, 2400 px no pop-up (o navegador escolhe pela tela).
const srcsetDe = t => (t.imagemGrande ? `${esc(t.imagem)} 1400w, ${esc(t.imagemGrande)} 2400w` : "");
// "a, b e c"
const emLista = itens => (itens.length < 2 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`);

/** Cartão do portfólio: print grande e uma frase. Clicar em qualquer parte abre o pop-up do projeto. */
function cartaoProjeto(t) {
  validarTrabalho(t);
  const categoria = String(t.tipo || "").split("·")[0].trim();
  const temIa = (t.recursos || []).some(r => r.ia);
  const tela = t.imagem
    ? `<img src="${esc(t.imagem)}"${t.imagemGrande ? ` srcset="${srcsetDe(t)}" sizes="(min-width:1120px) 520px, (min-width:720px) 46vw, 84vw"` : ""} alt="${esc(t.alt || "Tela do " + t.titulo)}" width="1400" height="875" loading="lazy" decoding="async">`
    : `<span class="projeto-monograma" aria-hidden="true">${esc(t.titulo.replace(/^Óticas?\s+/i, "").charAt(0).toUpperCase())}</span>`;
  return `
        <li class="projeto">
          <div class="projeto-tela">${tela}</div>
          <div class="projeto-info">
            <p class="projeto-meta">${t.selo === "demonstracao" ? '<span class="selo selo-demonstracao">Demonstração conceitual</span>' : ""}<span>${esc(categoria)}</span>${temIa ? seloIa() : ""}</p>
            <h3><button class="projeto-abrir" type="button" data-abrir="projeto-${esc(t.id)}" aria-haspopup="dialog">${esc(t.titulo)}</button></h3>
            <p class="projeto-resumo">${esc(t.resumo || t.texto)}</p>
            <span class="projeto-ver" aria-hidden="true">Ver projeto${icone("seta", 16)}</span>
          </div>
        </li>`;
}

/** Pop-up do projeto: prints em alta, descrição, o que foi desenvolvido (com "Ver tela"), depoimento e link. */
function janelaProjeto(t, depoimento) {
  const id = `projeto-${esc(t.id)}`;
  const comIa = (t.recursos || []).filter(r => r.ia).length;
  const recursos = (t.recursos || []).map(r => `
              <li>
                <span class="recurso-icone">${icone(ICONES[r.icone] ? r.icone : "check", 18)}</span>
                <div><h4>${esc(r.titulo)}${r.ia ? seloIa() : ""}</h4><p>${esc(r.texto)}</p>
                ${r.imagem ? `<button class="recurso-ver" type="button" data-abrir="${idDoRecurso(t, r)}" aria-haspopup="dialog">Ver tela${icone("seta", 14)}<span class="sr-only">: ${esc(r.titulo)}</span></button>` : ""}</div>
              </li>`).join("");
  return `
  <dialog class="janela-projeto" id="${id}" aria-labelledby="${id}-titulo">
    <div class="janela-rolagem">
      ${t.imagem ? `<div class="projeto-palco${t.imagemCelular ? " com-celular" : ""}">
        <img class="palco-desktop" src="${esc(t.imagem)}"${t.imagemGrande ? ` srcset="${srcsetDe(t)}" sizes="(min-width:1040px) 760px, 92vw"` : ""} alt="${esc(t.alt || "Tela do " + t.titulo)}" width="1400" height="875" loading="lazy" decoding="async">
        ${t.imagemCelular ? `<img class="palco-celular" src="${esc(t.imagemCelular)}" alt="${esc(t.titulo)} no celular" width="720" height="1440" loading="lazy" decoding="async">` : ""}
      </div>` : ""}
      <div class="projeto-corpo">
        <p class="projeto-meta">${t.selo === "demonstracao" ? '<span class="selo selo-demonstracao">Demonstração conceitual</span>' : ""}<span>${esc(t.tipo)}</span></p>
        <h3 id="${id}-titulo">${esc(t.titulo)}</h3>
        <p class="projeto-texto">${esc(t.texto)}</p>
        ${recursos ? `<p class="recursos-titulo">O que a Renderiza desenvolveu${comIa ? `, com ${comIa} recursos de inteligência artificial` : ""}</p>
        <ul class="recursos">${recursos}
        </ul>` : ""}
        ${depoimento ? `<figure class="projeto-depoimento"><blockquote><p>${esc(depoimento.texto)}</p></blockquote><figcaption><strong>${esc(depoimento.nome || depoimento.papel)}</strong>${depoimento.nome && depoimento.papel ? `, ${esc(depoimento.papel)}` : ""}</figcaption></figure>` : ""}
        <div class="projeto-rodape">
          ${t.credito ? `<p class="credito">${esc(t.credito)}</p>` : ""}
          ${t.link ? `<a class="botao botao-primario" href="${esc(t.link)}" target="_blank" rel="noopener">${esc(t.linkTexto || "Ver o projeto")}${icone("externo", 16)}<span class="sr-only"> (abre em outra aba)</span></a>` : ""}
        </div>
      </div>
    </div>
    <form method="dialog"><button class="janela-fechar" type="submit" aria-label="Fechar">${icone("fechar", 20)}</button></form>
  </dialog>`;
}

/** Um pop-up por recurso com tela: abre por cima do pop-up do projeto. Fechado, a imagem não carrega. */
function janelasDeRecursos(t) {
  return (t.recursos || []).filter(r => r.imagem).map(r => `
  <dialog class="janela-recurso${r.formato === "paisagem" ? " janela-paisagem" : ""}" id="${idDoRecurso(t, r)}" aria-labelledby="${idDoRecurso(t, r)}-titulo">
    <div class="janela-grade">
      <figure class="janela-tela">
        <img src="${esc(r.imagem)}" alt="Tela ${esc(r.titulo)} do app ${esc(t.titulo)}" width="${r.largura || 540}" height="${r.altura || 1169}" loading="lazy" decoding="async">
        <figcaption>Tela real do app, com dados de exemplo.</figcaption>
      </figure>
      <div class="janela-texto">
        <p class="projeto-meta"><span>${esc(t.titulo)}</span></p>
        <h3 id="${idDoRecurso(t, r)}-titulo">${esc(r.titulo)}${r.ia ? seloIa() : ""}</h3>
        <p>${esc(r.detalhe || r.texto)}</p>
        ${r.link ? `<a class="botao botao-primario" href="${esc(r.link)}" target="_blank" rel="noopener">Ver no site ${t.titulo === "Move" ? "do" : "de"} ${esc(t.titulo)}${icone("externo", 16)}<span class="sr-only"> (abre em outra aba)</span></a>` : ""}
      </div>
    </div>
    <form method="dialog"><button class="janela-fechar" type="submit" aria-label="Fechar">${icone("fechar", 20)}</button></form>
  </dialog>`).join("");
}

/** Abertura: dois sites de clientes no celular (os trabalhos com destaque). Tocar abre o pop-up do projeto. */
function vitrine(destaques) {
  if (!destaques.length) return "";
  return `
      <figure class="vitrine">
        <div class="vitrine-celulares">${destaques.map((t, i) => `
          <button class="celular" type="button" data-abrir="projeto-${esc(t.id)}" aria-haspopup="dialog">
            <img src="${esc(t.imagemCelular)}" alt="${esc(t.titulo)}: site no celular" width="720" height="1440"${i === 0 ? ' fetchpriority="high"' : ""} decoding="async">
            <span class="celular-rotulo" aria-hidden="true">${esc(t.titulo)}</span>
          </button>`).join("")}
        </div>
        <figcaption>${emLista(destaques.map(t => `<strong>${esc(t.titulo)}</strong>`))}: ${destaques.length > 1 ? "sites de clientes, no ar" : "site de cliente, no ar"}.</figcaption>
      </figure>`;
}

/** P e I: o teste. Funciona sem JavaScript (placar e barra no CSS); o JS escreve a frase e a mensagem do WhatsApp. */
function secaoTeste({ temWa, contato }) {
  const href = temWa ? linkWhatsapp(contato, MENSAGEM.teste) : "#contato";
  return `
  <section class="secao secao-clara" id="teste" aria-labelledby="teste-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Faça o teste</p>
      <h2 id="teste-titulo">Seu negócio passa <em>nesse teste?</em></h2>
      <p class="secao-lide">Marque o que o cliente novo já encontra hoje, sem precisar perguntar. Embaixo de cada item está o que acontece quando ele falta.</p>
      <div class="teste" data-teste>
        <fieldset class="teste-itens">
          <legend class="sr-only">O que o seu negócio já tem</legend>${TESTE.map(item => `
          <input type="checkbox" id="teste-${item.id}" name="teste" value="${item.id}" data-rotulo="${esc(item.rotulo)}" aria-describedby="teste-${item.id}-custo">
          <label class="teste-item" for="teste-${item.id}">
            <span class="teste-caixa">${icone("check", 16)}</span>
            <span class="teste-texto">
              <strong>${esc(item.texto)}</strong>
              <span class="teste-custo"><span id="teste-${item.id}-custo">${esc(item.custo)}</span></span>
            </span>
          </label>`).join("")}
        </fieldset>
        <div class="teste-resultado">
          <p class="teste-placar"><span class="teste-numero" aria-hidden="true"></span><span>de ${TESTE.length}</span></p>
          <div class="teste-barra" aria-hidden="true">${TESTE.map(() => "<span></span>").join("")}</div>
          <p class="teste-frase" data-frase aria-live="polite">Marque o que o seu negócio já tem.</p>
          <p class="teste-pergunta" data-pergunta>Se o cliente novo não precisasse perguntar, quanto tempo sobraria para quem já está na sua frente?</p>
          <a class="botao botao-claro botao-grande" href="${esc(href)}"${temWa ? ` target="_blank" rel="noopener" data-teste-link data-base="${esc(linkWhatsapp(contato, ""))}"` : ""}>${icone("whatsapp", 20)}Quero ver o meu site</a>
        </div>
      </div>
    </div>
  </section>`;
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
  const temDemo = trabalhos.some(t => t.selo === "demonstracao");
  // Abertura: os trabalhos em destaque com print de celular (sites de clientes do público de hoje).
  const destaques = trabalhos.filter(t => t.destaque && t.imagemCelular).slice(0, 2);
  const depoimentos = (config.depoimentos || []).filter(d => d.publicar && d.texto && d.texto.trim());
  // N nas palavras de um cliente: o trecho do depoimento em que ele mesmo diz o que o site resolveu.
  const fala = depoimentos.find(d => d.valor && d.valor.trim());
  const fundadoresComFoto = (config.fundadores || []).filter(f => f.foto);
  const nomesFundadores = emLista((config.fundadores || []).map(f => esc(f.nome)));

  const titulo = "Renderiza · Sites e aplicativos para o seu negócio";
  const descricao = "A Renderiza monta uma prévia do site do seu negócio com as suas fotos reais e as avaliações dos seus clientes. Você vê no celular, sem compromisso, e só depois decide.";

  const fundadores = (config.fundadores || []).map(f => `
        <article class="fundador">
          ${f.foto ? `<div class="fundador-foto"><img src="${esc(f.foto)}" alt="Foto de ${esc(f.nome)}" width="720" height="960" loading="lazy" decoding="async"></div>` : ""}
          <h3>${esc(f.nome)}</h3>
          <p class="fundador-papel">${esc(f.papel)}${f.area ? ` · ${esc(f.area)}` : ""}</p>
          <p class="fundador-texto">${esc(f.texto)}</p>
          ${f.linkedin ? `<a class="fundador-link" href="${esc(f.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 16)}LinkedIn<span class="sr-only"> de ${esc(f.nome)} (abre em outra aba)</span></a>` : ""}
        </article>`).join("");

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
<meta name="theme-color" content="#ffffff">
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
<meta property="og:image:alt" content="Renderiza: ${esc(FRASE.inicio.toLowerCase())} ${esc(FRASE.destaque)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fontes/geist.woff2" as="font" type="font/woff2" crossorigin>
<style>
${css.trim()}
</style>
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>

<header class="topo">
  <div class="topo-dentro">
    <a class="marca" href="#inicio" aria-label="Renderiza, início">${simbolo(30)}<span>renderiza</span></a>
    <nav class="topo-nav" aria-label="Seções">
      <a href="#teste">Faça o teste</a>
      <a href="#como-funciona">Como funciona</a>
      <a href="#trabalhos">Trabalhos</a>
      <a href="#sobre">Quem somos</a>
    </nav>
    <a class="botao botao-primario botao-topo" href="${esc(hrefWa)}"${attrsWa}>${icone("whatsapp", 17)}<span>WhatsApp</span></a>
  </div>
</header>

<main id="conteudo">
  <section class="abertura" id="inicio" aria-labelledby="abertura-titulo">
    <div class="envoltorio abertura-grade">
      <div class="abertura-texto">
        <a class="aviso" href="#como-funciona">Recebeu uma prévia do seu site? <span>Veja como funciona${icone("seta", 14)}</span></a>
        <h1 id="abertura-titulo">${esc(FRASE.inicio)} <em>${esc(FRASE.destaque)}</em></h1>
        <p class="abertura-lide">Para lojas, clínicas e consultórios: a gente monta uma prévia com as suas fotos reais e as avaliações dos seus clientes. Você vê no celular, sem compromisso, e só depois decide.</p>
        <div class="acoes">
          <a class="botao botao-primario botao-grande" href="${esc(hrefWa)}"${attrsWa}>${icone("whatsapp", 20)}Quero ver o meu site</a>
          <a class="botao botao-secundario botao-grande" href="#teste">Fazer o teste${icone("baixo", 18)}</a>
        </div>
        ${nomesFundadores ? `<p class="abertura-gente">${fundadoresComFoto.length ? `<span class="rostos">${fundadoresComFoto.map(f => `<img src="${esc(f.foto)}" alt="" width="720" height="960" decoding="async">`).join("")}</span>` : ""}<span><strong>${nomesFundadores}</strong>, ${(config.fundadores || []).length > 1 ? "os fundadores" : "o fundador"}. Você fala direto com a gente.</span></p>` : ""}
      </div>
${vitrine(destaques)}
    </div>
  </section>

  <section class="dor" id="por-que" aria-labelledby="dor-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Como é hoje</p>
      <h2 id="dor-titulo">Seus clientes te conhecem. <em>O cliente novo, não.</em></h2>
      <p class="dor-lide">Quem ouviu falar de você pesquisa antes de chamar. Hoje, esse caminho costuma ser assim:</p>
      <ol class="caminho">${CAMINHO.map(p => `
        <li>
          <span class="caminho-icone">${icone(p.icone, 20)}</span>
          <h3>${esc(p.titulo)}</h3>
          <p>${esc(p.texto)}</p>
        </li>`).join("")}
      </ol>
      <p class="dor-fecho">É nessa pesquisa que ele decide se chama você. <em>E você nem fica sabendo.</em></p>
    </div>
  </section>
${secaoTeste({ temWa, contato })}

  <section class="secao" id="solucao" aria-labelledby="solucao-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">O que o site faz</p>
      <h2 id="solucao-titulo">E se o cliente já chegasse <em>sabendo de tudo?</em></h2>
      <p class="secao-lide">É para isso que serve o site: o cliente novo encontra sozinho o que hoje precisa perguntar, e chama você já sabendo o que quer.</p>
      <div class="contraste">
        <p class="contraste-cabeca" aria-hidden="true"><span>Hoje</span><span>No seu site</span></p>
        <ul>${HOJE_E_NO_SITE.map(([hoje, site]) => `
          <li>
            <p class="contraste-hoje"><span class="contraste-marca">${icone("fechar", 14)}</span><span><span class="contraste-rotulo">Hoje</span>${esc(hoje)}</span></p>
            <p class="contraste-site"><span class="contraste-marca">${icone("check", 14)}</span><span><span class="contraste-rotulo">No seu site</span>${esc(site)}</span></p>
          </li>`).join("")}
        </ul>
      </div>
${fala ? `      <figure class="fala">
        <span class="fala-aspas">${icone("aspas", 26)}</span>
        <blockquote><p>${esc(fala.valor)}</p></blockquote>
        <figcaption><strong>${esc(fala.nome || fala.papel)}</strong>${fala.nome && fala.papel ? `, ${esc(fala.papel)}` : ""}</figcaption>
      </figure>
` : ""}    </div>
  </section>

  <section class="secao secao-clara" id="como-funciona" aria-labelledby="como-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Como funciona</p>
      <h2 id="como-titulo">Você vê o seu site <em>antes de decidir.</em></h2>
      <p class="secao-lide">Sem reunião, sem formulário e sem pagar nada para ver.</p>
      <ol class="passos">${PASSOS.map(([t, p]) => `
        <li><h3>${esc(t)}</h3><p>${esc(p)}</p></li>`).join("")}
      </ol>
      <p class="passos-nota">${icone("escudo", 20)}<span>Você só paga se decidir colocar o site no ar.</span></p>
    </div>
  </section>

  <section class="secao" id="trabalhos" aria-labelledby="trabalhos-titulo">
    <div class="envoltorio carrossel" data-carrossel>
      <div class="carrossel-topo">
        <div>
          <p class="sobretitulo">Trabalhos realizados</p>
          <h2 id="trabalhos-titulo">${temDemo ? "Projetos de clientes e demonstrações." : "Projetos de clientes."}</h2>
        </div>
        <div class="carrossel-setas" hidden>
          <button type="button" data-anterior aria-label="Projeto anterior" aria-controls="projetos-lista">${icone("voltar", 20)}</button>
          <button type="button" data-proximo aria-label="Próximo projeto" aria-controls="projetos-lista">${icone("seta", 20)}</button>
        </div>
      </div>
      <p class="secao-lide">Sites de negócios como o seu e, quando o projeto pede mais, aplicativos sob medida.</p>
      <ul class="projetos" id="projetos-lista" data-trilho tabindex="0" aria-label="Projetos (no celular, deslize para o lado)">${trabalhos.map(cartaoProjeto).join("")}
      </ul>
      <div class="carrossel-pontos" hidden>${trabalhos.map((t, i) => `<button type="button" data-ir="${i}" aria-label="Ver projeto ${i + 1} de ${trabalhos.length}"></button>`).join("")}</div>
    </div>
    <div class="envoltorio">
      <div class="alem">
        <div>
          <h3>Precisa de mais que um site?</h3>
          <p>A gente também desenvolve aplicativos e sistemas sob medida: login e área do cliente, painel de gestão, integrações e recursos com inteligência artificial.</p>
        </div>
        <a class="alem-link" href="${esc(temWa ? linkWhatsapp(contato, MENSAGEM.aplicativo) : "#contato")}"${attrsWa}>Conversar sobre um aplicativo${icone("seta", 16)}</a>
      </div>
    </div>
${trabalhos.map(t => janelaProjeto(t, depoimentos.find(d => d.trabalho === t.id))).join("")}
${trabalhos.map(janelasDeRecursos).join("")}
  </section>

${depoimentos.length ? `  <section class="secao secao-clara" id="depoimentos" aria-labelledby="depoimentos-titulo">
    <div class="envoltorio carrossel" data-carrossel>
      <div class="carrossel-topo">
        <div>
          <p class="sobretitulo">Depoimentos</p>
          <h2 id="depoimentos-titulo">Quem já trabalhou com a gente.</h2>
        </div>
        <div class="carrossel-setas" hidden>
          <button type="button" data-anterior aria-label="Depoimento anterior" aria-controls="depoimentos-lista">${icone("voltar", 20)}</button>
          <button type="button" data-proximo aria-label="Próximo depoimento" aria-controls="depoimentos-lista">${icone("seta", 20)}</button>
        </div>
      </div>
      <ul class="depoimentos" id="depoimentos-lista" data-trilho tabindex="0" aria-label="Depoimentos (deslize para o lado)">${depoimentos.map((d, i) => `
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

` : ""}  <section class="secao" id="sobre" aria-labelledby="sobre-titulo">
    <div class="envoltorio sobre">
      <div class="sobre-abertura">
        <p class="sobretitulo">Quem está por trás</p>
        <h2 id="sobre-titulo">Somos ${(config.fundadores || []).map(f => esc(f.nome)).join(" e ")}.</h2>
        <p class="sobre-lide">Unimos tecnologia e organização para criar sites e aplicativos com a cara do seu negócio. Você fala com a gente, do primeiro contato ao pós-venda.</p>
      </div>
      <div class="fundadores">${fundadores}
      </div>
    </div>
  </section>

  <section class="secao secao-clara" id="perguntas" aria-labelledby="perguntas-titulo">
    <div class="envoltorio">
      <p class="sobretitulo">Perguntas frequentes</p>
      <h2 id="perguntas-titulo">Antes de chamar.</h2>
      <div class="perguntas">${PERGUNTAS.map(([p, r]) => `
        <details>
          <summary>${esc(p)}${icone("mais", 18)}</summary>
          <p>${esc(r)}</p>
        </details>`).join("")}
      </div>
    </div>
  </section>

  <section class="convite" id="contato" aria-labelledby="contato-titulo">
    <div class="envoltorio envoltorio-estreito">
      <h2 id="contato-titulo">Quer ver como ficaria <em>o seu?</em></h2>
      <p>Mande o nome ou o Instagram do seu negócio. A gente monta a prévia e te mostra, sem compromisso.</p>
      <div class="acoes acoes-convite">
        ${temWa ? `<a class="botao botao-claro botao-grande" href="${esc(linkWhatsapp(contato, MENSAGEM.convite))}" target="_blank" rel="noopener">${icone("whatsapp", 20)}Quero ver o meu site</a>` : ""}
        ${!temWa && contato.linkedin ? `<a class="botao botao-contorno botao-grande" href="${esc(contato.linkedin)}" target="_blank" rel="noopener">${icone("linkedin", 18)}LinkedIn</a>` : ""}
        ${!temWa && !contato.linkedin ? `<p class="convite-pendente">Os canais de contato estão sendo atualizados.</p>` : ""}
      </div>
      ${temWa ? `<p class="convite-numero">Ou salve o nosso número: WhatsApp ${esc(telefone)}</p>` : ""}
    </div>
  </section>
</main>

<footer class="rodape">
  <div class="envoltorio rodape-grade">
    <div>
      <a class="marca marca-rodape" href="#inicio" aria-label="Renderiza, voltar ao início">${simbolo(30)}<span>renderiza</span></a>
      <p>Sites e aplicativos para negócios.<br>Um projeto independente de ${esc(nomeCompleto)}.</p>
    </div>
    ${redes.length ? `<nav class="rodape-redes" aria-label="Contato">${redes.join("")}</nav>` : ""}
  </div>
  <div class="envoltorio rodape-base">
    <span>© ${ano} Renderiza</span>
  </div>
</footer>
<script>/* carrosséis (projetos no celular e depoimentos): setas e pontos sobre a rolagem nativa (sem JS, desliza do mesmo jeito) */document.querySelectorAll("[data-carrossel]").forEach(function(c){var t=c.querySelector("[data-trilho]"),it=[].slice.call(t.children),a=c.querySelector("[data-anterior]"),p=c.querySelector("[data-proximo]"),ps=[].slice.call(c.querySelectorAll("[data-ir]"));if(it.length<2)return;c.querySelectorAll("[hidden]").forEach(function(e){e.hidden=false});var suave=matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";function passo(){return it[1].offsetLeft-it[0].offsetLeft}function fim(){return t.scrollLeft>=t.scrollWidth-t.clientWidth-4}function ultimo(){return Math.max(0,Math.ceil((t.scrollWidth-t.clientWidth-4)/passo()))}function ir(i){t.scrollTo({left:Math.max(0,Math.min(i,ultimo()))*passo(),behavior:suave})}function atual(){return fim()?ultimo():Math.round(t.scrollLeft/passo())}function marcar(){var i=atual(),u=ultimo();a.disabled=t.scrollLeft<4;p.disabled=fim();ps.forEach(function(b,k){b.hidden=k>u;b.setAttribute("aria-current",k===i?"true":"false")});c.classList.toggle("tudo-visivel",t.scrollWidth<=t.clientWidth+4)}a.addEventListener("click",function(){ir(atual()-1)});p.addEventListener("click",function(){ir(atual()+1)});ps.forEach(function(b){b.addEventListener("click",function(){ir(+b.dataset.ir)})});var r;t.addEventListener("scroll",function(){cancelAnimationFrame(r);r=requestAnimationFrame(marcar)},{passive:true});addEventListener("resize",marcar);marcar()})</script>
<script>/* pop-ups (projeto e "Ver tela" do recurso): tocar fora ou Esc fecha */document.querySelectorAll("[data-abrir]").forEach(function(b){var d=document.getElementById(b.dataset.abrir);if(!d||!d.showModal)return;b.addEventListener("click",function(){d.showModal()});d.addEventListener("click",function(e){if(e.target===d)d.close()})})</script>
<script>/* teste: a frase muda com o placar e a mensagem do WhatsApp leva o resultado (o cliente já chega dizendo o que falta) */(function(){var t=document.querySelector("[data-teste]");if(!t)return;var cx=[].slice.call(t.querySelectorAll("input[type=checkbox]")),fr=t.querySelector("[data-frase]"),pg=t.querySelector("[data-pergunta]"),lk=t.querySelector("[data-teste-link]");function lista(a){return a.length<2?a.join(""):a.slice(0,-1).join(", ")+" e "+a[a.length-1]}function atualizar(){var n=cx.filter(function(c){return c.checked}).length,falta=cx.filter(function(c){return!c.checked}).map(function(c){return c.dataset.rotulo});fr.textContent=n===cx.length?"O cliente novo já encontra tudo. Se quiser comparar com uma prévia feita para você, é só chamar.":n>=3?"Falta pouco: o cliente novo já encontra boa parte sozinho.":n>0?"O cliente novo ainda precisa perguntar quase tudo antes de chamar.":"Por enquanto, o cliente novo precisa perguntar tudo antes de chamar.";pg.hidden=n===cx.length;if(lk)lk.href=lk.dataset.base+"?text="+encodeURIComponent("Oi! Fiz o teste no site da Renderiza: meu negócio tem "+n+" de "+cx.length+"."+(falta.length?" Ainda não tenho "+lista(falta)+".":"")+" Quero ver como ficaria o site do meu negócio.")}cx.forEach(function(c){c.addEventListener("change",atualizar)})})()</script>
</body>
</html>
`;
}
