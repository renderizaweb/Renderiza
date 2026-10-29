// Meu site (Missão 4, bloco C): as regras do editor, sem tela (testadas em test/meu-site.test.mjs).
// O conteúdo segue o contrato v1 (docs/painel-clientes/03-modulo-meu-site.md). O mapa do que cada site deixa editar é
// o conteúdo inicial dele (sites.conteudo_inicial, a saída de ferramentas/meu-site/extrair.mjs). O rascunho guarda o
// conteúdo inteiro do que já foi mexido; o que não está nele fica como a versão inicial.

const NOMES = {
  cabecalho: "Topo e menu", inicio: "Capa", sobre: "Sobre", estilos: "Estilos", estrutura: "Estrutura",
  atendimento: "Como funciona", depoimentos: "Avaliações", consulta: "Consultar uma data", instagram: "Instagram",
  visite: "Como chegar", rodape: "Rodapé",
};
const TEXTOS = {
  eyebrow: "Chamada acima do título", titulo: "Título", texto: "Texto", selo: "Selo", legenda: "Legenda da foto pequena",
  aviso: "Faixa no alto do site", slogan: "Frase do rodapé", botao: "Texto do botão",
};
const BOTOES = { botao: "Botão", link: "Link", chip: "Etiqueta sobre a foto", agenda: "Link da agenda online" };
const IMAGENS = { foto: "Foto", foto2: "Foto pequena" };
const LISTAS = {
  paragrafos: "Parágrafos", numeros: "Números em destaque", fotos: "Fotos", itens: "Itens", passos: "Passos",
  tipos: "Tipos de festa do formulário", avaliacoes: "Avaliações",
};
const CAMPOS_DE_ITEM = { texto: "Texto", valor: "Número", foto: "Foto", legenda: "Legenda", nome: "Nome", tag: "Etiqueta (ex.: Casamento)" };

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
  return dominios[0] ? `https://${dominios[0]}${src.startsWith("/") ? "" : "/"}${src}` : "";
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
  return dominios[0] ? `https://${dominios[0]}/?rz-previa=${encodeURIComponent(codigo)}` : "";
}

/** WhatsApp digitado ("(11) 98888-7777") para o contrato ("5511988887777"); vazio fica vazio. */
export function whatsappDoContrato(texto) {
  const d = String(texto || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  return d ? "55" + d : "";
}
