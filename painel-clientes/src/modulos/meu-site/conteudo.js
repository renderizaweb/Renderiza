// Meu site (Missão 4, bloco C): as regras do editor, sem tela (testadas em test/meu-site.test.mjs).
// O conteúdo segue o contrato v1 (docs/painel-clientes/03-modulo-meu-site.md). O mapa do que cada site deixa editar é
// o conteúdo inicial dele (sites.conteudo_inicial, a saída de ferramentas/meu-site/extrair.mjs). O rascunho guarda o
// conteúdo inteiro do que já foi mexido; o que não está nele fica como a versão inicial.

const NOMES = {
  cabecalho: "Topo e menu", inicio: "Capa", sobre: "Sobre", estilos: "Estilos", estrutura: "Estrutura",
  atendimento: "Como funciona", depoimentos: "Avaliações", consulta: "Consultar uma data", instagram: "Instagram",
  visite: "Como chegar", rodape: "Rodapé", portfolio: "Portfólio", ensaios: "Ensaios", natal: "Natal",
  agendar: "Agenda", contato: "Contato e endereço",
  // as partes do Estoque no site (não se editam aqui, mas aparecem nos indicadores; 26/11/2026)
  estoque: "Estoque (a vitrine)", carro: "Página de um carro",
};
// Onde a parte fica no site, em uma linha (aparece embaixo do nome, na lista e na parte aberta).
const ONDE = {
  cabecalho: "A barra presa no alto do site, com o menu e o botão principal.",
  inicio: "A primeira tela que a pessoa vê: a frase, as fotos e os botões.",
  sobre: "A apresentação: quem é, a história e os números.",
  portfolio: "As galerias de fotos, uma por tipo de trabalho.",
  ensaios: "A lista do que você oferece, com foto, descrição e preço.",
  depoimentos: "O que os clientes disseram.",
  natal: "O bloco da campanha, com a foto e o botão para escolher o horário.",
  agendar: "O título e o texto acima da agenda (os horários vêm da Agenda do painel).",
  contato: "O endereço, o telefone e o botão de falar com você.",
  estrutura: "O que o espaço oferece.", estilos: "Os tipos de festa.", atendimento: "O passo a passo de como funciona.",
  consulta: "O formulário de consultar uma data.", instagram: "O convite para seguir no Instagram.",
  visite: "O mapa e como chegar.", rodape: "O fim da página.",
};
const TEXTOS = {
  eyebrow: "Chamada pequena, acima do título", titulo: "Título", texto: "Texto", selo: "Selo", legenda: "Legenda da foto",
  aviso: "Faixa no alto do site", slogan: "Frase do rodapé", botao: "Texto do botão", frase: "Frase principal",
  rotulo: "Etiqueta da foto grande", rotulo2: "Etiqueta da foto de cima", rotulo3: "Etiqueta da foto de baixo",
  nota: "Observação pequena", citacao: "Frase em destaque", autor: "Quem assina a frase", telefone: "Telefone escrito",
};
const BOTOES = { botao: "Botão principal", link: "Link ao lado do botão", chip: "Etiqueta sobre a foto", agenda: "Link da agenda online" };
const IMAGENS = { foto: "Foto principal", foto2: "Segunda foto", foto3: "Terceira foto" };
const LISTAS = {
  paragrafos: "Parágrafos", numeros: "Números em destaque", fotos: "Fotos", itens: "Itens", passos: "Passos",
  tipos: "Tipos de festa do formulário", avaliacoes: "Avaliações", infantil: "Galeria · Infantil",
  gestante: "Galeria · Gestante", familia: "Galeria · Família",
};
const CAMPOS_DE_ITEM = {
  texto: "Texto", valor: "Número", foto: "Foto", legenda: "Legenda", nome: "Nome", tag: "Etiqueta (ex.: Casamento)",
  sub: "Descrição curta", preco: "Preço (em branco, não aparece)",
};
// Como se chama um item de cada lista ("Adicionar avaliação", "Foto 3").
const ITEM = { avaliacoes: "avaliação", paragrafos: "parágrafo", numeros: "número", passos: "passo", tipos: "tipo" };

export const ACOES = [
  { valor: "whatsapp", rotulo: "Abrir o WhatsApp" },
  { valor: "secao", rotulo: "Ir para uma parte da página" },
  { valor: "link", rotulo: "Abrir um link" },
  { valor: "telefone", rotulo: "Ligar" },
  { valor: "instagram", rotulo: "Abrir o Instagram" },
  { valor: "rota", rotulo: "Como chegar (mapa)" },
  { valor: "email", rotulo: "Mandar e-mail" },
];

const semAsteriscos = t => String(t || "").replace(/\*/g, "");

/** O nome da seção para quem edita. As galerias levam a chamada delas ("Galeria · O espaço"). */
export function nomeDaSecao(id, secao = {}) {
  if (NOMES[id]) return NOMES[id];
  const chamada = semAsteriscos(secao.textos && (secao.textos.eyebrow || secao.textos.titulo));
  return secao.listas && secao.listas.fotos ? `Galeria · ${chamada || id}` : chamada || id;
}

/** Onde a parte fica no site (uma linha); vazio se o painel não conhece a parte. */
export const ondeFica = id => ONDE[id] || "";

/** O nome de um item da lista: "avaliação", "foto" (lista só de fotos) ou "item". */
export function nomeDoItem(campo, itens = []) {
  if (ITEM[campo]) return ITEM[campo];
  const base = itens[0] || {};
  return base.imagens && !Object.keys(base.textos || {}).length ? "foto" : "item";
}

/** O que identifica um item na lista recolhida: o nome, o primeiro texto ou a posição. */
export function resumoDoItem(item = {}, i = 0, nome = "item") {
  const t = item.textos || {};
  const texto = semAsteriscos(t.nome || t.titulo || t.valor || t.texto || Object.values(t).find(Boolean) || "").trim();
  if (!texto) return `${nome.charAt(0).toUpperCase() + nome.slice(1)} ${i + 1}`;
  return texto.length > 46 ? texto.slice(0, 44) + "…" : texto;
}

/** O endereço do site a partir do domínio cadastrado (o localhost dos testes vai sem https). */
export function enderecoDoSite(dominio) {
  return dominio ? `${/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(dominio) ? "http" : "https"}://${dominio}` : "";
}

const FORMATOS = [[1, "1:1"], [4 / 3, "4:3"], [3 / 2, "3:2"], [16 / 9, "16:9"], [3 / 4, "3:4"], [2 / 3, "2:3"], [4 / 5, "4:5"], [9 / 16, "9:16"]];
/**
 * A orientação para trocar uma foto, a partir do tamanho que ela tem na página ([largura, altura], que o site manda):
 * o formato (em pé, deitada, quadrada), a proporção mais próxima e a largura boa (o dobro da tela, de 800 a 1600).
 */
export function dicaDaFoto(medida) {
  const fim = "O site corta as sobras sozinho: deixe o assunto no centro. JPG, PNG ou WebP; o painel reduz e deixa leve.";
  if (!Array.isArray(medida) || !(medida[0] > 0) || !(medida[1] > 0)) return fim;
  const r = medida[0] / medida[1];
  const formato = r > 1.15 ? "deitada" : r < 0.87 ? "em pé" : "quadrada";
  const perto = FORMATOS.reduce((a, b) => (Math.abs(Math.log(b[0] / r)) < Math.abs(Math.log(a[0] / r)) ? b : a))[1];
  const largura = Math.min(1600, Math.max(800, Math.ceil(medida[0] * 2 / 100) * 100));
  return `Aqui a foto aparece ${formato}${formato === "quadrada" ? "" : ` (perto de ${perto})`}. Use uma com ${largura.toLocaleString("pt-BR")} px de largura ou mais. ${fim}`;
}

export function rotulo(tipo, campo) {
  const mapa = { textos: TEXTOS, botoes: BOTOES, imagens: IMAGENS, listas: LISTAS, item: CAMPOS_DE_ITEM }[tipo] || {};
  return mapa[campo] || campo.charAt(0).toUpperCase() + campo.slice(1).replace(/-/g, " ");
}

/** O resumo da seção na lista (o título, o primeiro texto ou quantos itens). */
export function resumoDaSecao(secao = {}) {
  const t = secao.textos || {};
  const texto = semAsteriscos(t.titulo || t.texto || t.aviso || t.slogan || Object.values(t)[0] || "");
  if (texto) return texto.length > 90 ? texto.slice(0, 88) + "…" : texto;
  const l = Object.entries(secao.listas || {})[0];
  return l ? `${l[1].length} ${l[1].length === 1 ? "item" : "itens"}` : "";
}

const copia = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

// O banco (jsonb) devolve as chaves em outra ordem: as seções vão na ordem da página (o "ordem" do conteúdo inicial)
// e os campos, na ordem em que aparecem nos sites (os nomes do contrato primeiro).
const ORDEM_DOS_CAMPOS = ["aviso", "eyebrow", "titulo", "texto", "selo", "legenda", "slogan", "botao", "link", "chip", "agenda", "foto", "foto2"];
const naOrdem = (chaves, ordem) => [...chaves].sort((a, b) =>
  (ordem.includes(a) ? ordem.indexOf(a) : ordem.length) - (ordem.includes(b) ? ordem.indexOf(b) : ordem.length));

/** O que o editor mostra: a versão inicial com o rascunho por cima (seção a seção, campo a campo; listas inteiras). */
export function mesclar(inicial = {}, rascunho = {}) {
  const r = { esquema: 1, secoes: {}, contato: { ...(inicial.contato || {}), ...(rascunho.contato || {}) } };
  const ids = naOrdem([...Object.keys(inicial.secoes || {}), ...Object.keys((rascunho && rascunho.secoes) || {}).filter(k => !(inicial.secoes || {})[k])],
    Array.isArray(inicial.ordem) ? inicial.ordem : []);
  for (const id of ids) {
    const a = (inicial.secoes || {})[id] || {}, b = ((rascunho && rascunho.secoes) || {})[id] || {};
    const s = { visivel: b.visivel !== undefined ? b.visivel : a.visivel !== false };
    for (const tipo of ["textos", "botoes", "imagens"]) {
      if (a[tipo] || b[tipo]) {
        s[tipo] = {};
        for (const campo of naOrdem(new Set([...Object.keys(a[tipo] || {}), ...Object.keys(b[tipo] || {})]), ORDEM_DOS_CAMPOS)) {
          const va = (a[tipo] || {})[campo], vb = (b[tipo] || {})[campo];
          s[tipo][campo] = tipo === "textos" ? (vb !== undefined ? vb : va) : { ...(va || {}), ...(vb || {}) };
        }
      }
    }
    if (a.listas || b.listas) {
      s.listas = {};
      for (const campo of new Set([...Object.keys(a.listas || {}), ...Object.keys(b.listas || {})])) {
        s.listas[campo] = copia((b.listas || {})[campo] || (a.listas || {})[campo]);
      }
    }
    r.secoes[id] = s;
  }
  return r;
}

/** Igual sem olhar a ordem das chaves (o banco devolve o jsonb com as chaves em outra ordem). */
export function igual(a, b) {
  const ordenar = v => (Array.isArray(v) ? v.map(ordenar) : v && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordenar(v[k])])) : v);
  return JSON.stringify(ordenar(a ?? null)) === JSON.stringify(ordenar(b ?? null));
}

/** Um item novo de lista: nasce do primeiro (mantém o que não é editável, como o ícone), com os mesmos campos. */
export function novoItem(itens) {
  const base = itens[0] || {};
  const item = {};
  if (base.de !== undefined) item.de = base.de;
  if (base.textos) item.textos = Object.fromEntries(Object.keys(base.textos).map(k => [k, ""]));
  if (base.imagens) item.imagens = Object.fromEntries(Object.keys(base.imagens).map(k => [k, { ...base.imagens[k] }]));
  return item;
}

/** Para ver a imagem no painel: as do painel como estão; as da versão inicial (/img/…), no domínio do site. */
export function imagemParaVer(src, dominios = []) {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  return dominios[0] ? `${enderecoDoSite(dominios[0])}${src.startsWith("/") ? "" : "/"}${src}` : "";
}

/** Onde a imagem enviada fica: na pasta da conta (a regra do Storage), com um nome novo a cada envio. */
export function caminhoDaImagem(contaId, secao, campo, sorteio = Math.random().toString(36).slice(2, 10)) {
  const limpo = t => String(t).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 30);
  return `${contaId}/${limpo(secao)}-${limpo(campo)}-${sorteio}.webp`;
}

/** O endereço público da imagem: o do painel (o site do cliente só aceita imagem do endereço da API). */
export function enderecoDaImagem(caminho, { ambiente, origem }) {
  const base = ambiente === "production" ? "https://painel.renderizaweb.com.br" : origem;
  return `${base}/api/publico/imagens/${caminho}`;
}

/** O link da prévia no site de verdade. */
export function linkDaPrevia(dominios = [], codigo) {
  return dominios[0] ? `${enderecoDoSite(dominios[0])}/?rz-previa=${encodeURIComponent(codigo)}` : "";
}

/** WhatsApp digitado ("(11) 98888-7777") para o contrato ("5511988887777"); vazio fica vazio. */
export function whatsappDoContrato(texto) {
  const d = String(texto || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return d ? "55" + d : "";
}

// ---------- os indicadores (as visitas do site) ----------

/** Segundos por extenso: "45 s", "1 min 20 s", "2 h 05 min". */
export function duracao(segundos) {
  const s = Math.max(0, Math.round(Number(segundos) || 0));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}`;
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")} min`;
}

const CLIQUES = { whatsapp: "WhatsApp (o botão flutuante e os links)", instagram: "Instagram", telefone: "Ligar", agenda: "Enviar o pedido na agenda" };
/** O nome de um botão clicado: os fixos, ou a parte e o que está escrito nele hoje ("Capa · Agendar um ensaio"). */
export function nomeDoClique(nome, conteudo = {}) {
  if (CLIQUES[nome]) return CLIQUES[nome];
  const [secao, campo = ""] = String(nome).split("."), s = (conteudo.secoes || {})[secao];
  if (!s) return String(nome);
  const b = s.botoes && s.botoes[campo];
  return `${nomeDaSecao(secao, s)} · ${semAsteriscos(b && b.rotulo) || rotulo("botoes", campo)}`;
}

const ORIGENS = [[/^painel\.renderizaweb\.com\.br$/, "Pelo painel (você ou a equipe)"], [/(^|\.)instagram\./, "Instagram"], [/(^|\.)google\./, "Google"], [/(^|\.)(facebook\.|fb\.)/, "Facebook"], [/whatsapp\.|(^|\.)wa\.me$/, "WhatsApp"],
  [/(^|\.)bing\./, "Bing"], [/(^|\.)tiktok\./, "TikTok"], [/youtube\.|youtu\.be$/, "YouTube"]];
/**
 * Os itens do Estoque mais vistos no site (26/11/2026): o site conta "ver.<id>" quando um item é aberto e "zap.<id>"
 * quando o WhatsApp sai da página dele (ferramentas/meu-site/meu-site.js, rzContar e data-rz-clique). `cliques`: os de
 * site_indicadores; `itens`: [{ id, nome }] do Estoque. Devolve as linhas (as mais vistas primeiro) e, à parte, os que
 * já saíram do Estoque (somados). Só conta o que o site registrou: sem registro, sem linha.
 */
export function itensMaisVistos(cliques = [], itens = []) {
  const por = new Map();
  for (const c of cliques) {
    const m = /^(ver|zap)\.([0-9a-f-]{36})$/.exec(c.nome || "");
    if (!m) continue;
    const l = por.get(m[2]) || { id: m[2], vistas: 0, zap: 0 };
    if (m[1] === "ver") l.vistas += Number(c.cliques) || 0; else l.zap += Number(c.cliques) || 0;
    por.set(m[2], l);
  }
  const nomes = new Map(itens.map(i => [i.id, i.nome]));
  const linhas = [], saiu = { vistas: 0, zap: 0 };
  for (const l of por.values()) {
    if (nomes.has(l.id)) linhas.push({ ...l, nome: nomes.get(l.id) });
    else { saiu.vistas += l.vistas; saiu.zap += l.zap; }
  }
  linhas.sort((a, b) => b.vistas - a.vistas || b.zap - a.zap || a.nome.localeCompare(b.nome));
  return { linhas, saiu };
}

/** Os cliques nos botões do site, sem os dos itens do Estoque (que têm quadro próprio). */
export const cliquesDosBotoes = (cliques = []) => cliques.filter(c => !/^(ver|zap)\./.test(c.nome || ""));

/** De onde a visita veio, pelo site anterior ("" = sem site anterior). */
export function nomeDaOrigem(host) {
  if (!host) return "Direto (link no WhatsApp, QR code ou o endereço digitado)";
  const o = ORIGENS.find(([re]) => re.test(host));
  return o ? o[1] : host;
}

/** A escala do gráfico de visitas: o topo redondo e as linhas (no máximo 5), como no Financeiro. */
export function escalaDoGrafico(maximo) {
  const passo = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000].find(p => maximo / p <= 4) || 20000;
  const topo = Math.max(passo, Math.ceil(maximo / passo) * passo);
  return { topo, linhas: Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => i * passo) };
}
