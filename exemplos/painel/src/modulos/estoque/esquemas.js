// Os esquemas do Estoque por nicho (docs/painel-clientes/12-modulo-estoque.md, "O item"): os campos do formulário,
// o que vira título, resumo, selo e filtro. Um nicho novo é uma entrada nova aqui, nunca uma cópia do módulo.
// Veio do protótipo (exemplos/estoque/esquemas.js, 20/11/2026); este é o de verdade (24/11/2026).

/** As situações de um item. Só as com noSite aparecem no site. */
export const SITUACOES = [
  { valor: "disponivel", rotulo: "Disponível", plural: "Disponíveis", etiqueta: "sucesso", noSite: true },
  { valor: "reservado", rotulo: "Reservado", plural: "Reservados", etiqueta: "alerta", noSite: true },
  { valor: "vendido", rotulo: "Vendido", plural: "Vendidos", etiqueta: "info", noSite: false },
  { valor: "oculto", rotulo: "Oculto", plural: "Ocultos", etiqueta: "", noSite: false },
];
export const situacao = v => SITUACOES.find(s => s.valor === v) || SITUACOES[0];
/** Sem foto não vai ao site (26/11/2026: um carro sem foto ficou em branco no site e a galeria abria preta). */
export const semFotoNoSite = (valorDaSituacao, fotos) => situacao(valorDaSituacao).noSite && !(Array.isArray(fotos) && fotos.length);

// O que nunca é item de um carro (27/11/2026: na carga inicial da Ricardo Motors, o quadro do vendedor que a página da
// WebMotors mostra logo depois dos itens entrou como opcional: "Sobre o vendedor", "Ricardo Motors", "São Paulo, SP",
// "Loja fechada - Abre quarta às 9h00", "(11)", "9478"). Vale para a colagem do anúncio, para o salvar do painel e para
// as cargas por script (demos/*/estoque-inicial.mjs).
const UF = "ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to";
const NAO_E_ITEM = [
  /^sobre (o|a) (vendedor|vendedora|loja|anunciante|revenda)\b/,
  /^(loja |revenda )?(aberta|fechada|aberto|fechado)\b/,
  /\b(abre|fecha) (hoje|amanha|segunda|terca|quarta|quinta|sexta|sabado|domingo)\b/,
  /^[\d\s()+./-]+$/, // telefone, ou um pedaço dele
  new RegExp(`^[a-z][a-z' -]{1,40}(,| -| /) (${UF})$`), // "São Paulo, SP", a cidade da loja
  /^(ver (telefone|todos|estoque|mais|menos|anuncios|loja)|enviar mensagem|mandar mensagem|ligar|denunciar|compartilhar|favoritar|simul|vendedor verificado|revenda verificada|desde \d{4})/,
];
const plano = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Se o texto é do quadro do vendedor (ou o nome da própria loja), não um item do carro. */
export function naoEItem(texto, loja = "") {
  const t = plano(texto);
  return !t || (plano(loja) !== "" && t === plano(loja)) || NAO_E_ITEM.some(re => re.test(t));
}

/** A lista de itens só com itens: sem o quadro do vendedor, sem repetidos, sem espaço sobrando. */
export function limparOpcionais(lista, loja = "") {
  const vistos = new Set();
  return (Array.isArray(lista) ? lista : []).map(x => String(x ?? "").replace(/\s+/g, " ").trim())
    .filter(x => !naoEItem(x, loja) && !vistos.has(plano(x)) && vistos.add(plano(x)));
}

const SIM_NAO = { tipo: "simnao" };
const num = v => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));
const milhar = v => Number(v).toLocaleString("pt-BR");

export const ESQUEMAS = {
  automotivo: {
    item: "carro", itens: "carros", umItem: "um carro", novo: "Adicionar carro", fim: "vendido",
    vazio: "Nenhum carro aqui ainda. Comece pelo que está no pátio.",
    grupos: [
      { titulo: "O carro", campos: [
        { id: "marca", rotulo: "Marca", tipo: "texto", obrigatorio: true, sugerir: true, placeholder: "Ex.: Porsche" },
        { id: "modelo", rotulo: "Modelo", tipo: "texto", obrigatorio: true, sugerir: true, placeholder: "Ex.: Cayenne" },
        { id: "versao", rotulo: "Versão", tipo: "texto", placeholder: "Ex.: 3.0 V6 E-Hybrid Coupé", largo: true },
        { id: "ano_fab", rotulo: "Ano de fabricação", tipo: "numero", meio: true },
        { id: "ano_modelo", rotulo: "Ano do modelo", tipo: "numero", meio: true },
        { id: "km", rotulo: "Quilometragem", tipo: "numero", sufixo: "km", meio: true },
        { id: "cor", rotulo: "Cor", tipo: "texto", meio: true },
        { id: "cambio", rotulo: "Câmbio", tipo: "lista", opcoes: ["Automático", "Manual", "Automatizado", "CVT"], meio: true },
        { id: "combustivel", rotulo: "Combustível", tipo: "lista", opcoes: ["Gasolina", "Flex", "Diesel", "Híbrido", "Elétrico"], meio: true, filtro: true },
        { id: "carroceria", rotulo: "Carroceria", tipo: "lista", opcoes: ["SUV", "Sedã", "Hatch", "Picape", "Cupê", "Conversível", "Perua"], meio: true, filtro: true },
        { id: "placa", rotulo: "Final da placa", tipo: "texto", meio: true, maximo: 1 },
      ] },
      { titulo: "Procedência e documentos", campos: [
        { id: "blindado", rotulo: "Blindado", ...SIM_NAO, selo: "Blindado", filtro: true },
        { id: "unico_dono", rotulo: "Único dono", ...SIM_NAO },
        { id: "revisoes", rotulo: "Revisões na concessionária", ...SIM_NAO },
        { id: "garantia", rotulo: "Garantia de fábrica", ...SIM_NAO },
        { id: "ipva", rotulo: "IPVA pago", ...SIM_NAO },
        { id: "licenciado", rotulo: "Licenciado", ...SIM_NAO },
        { id: "troca", rotulo: "Aceita troca", ...SIM_NAO },
      ] },
      { titulo: "Opcionais", campos: [
        { id: "opcionais", rotulo: "Opcionais", tipo: "marcar", opcoes: ["Teto solar", "Bancos de couro", "Bancos aquecidos", "Câmera 360", "Sensor de estacionamento",
          "Piloto automático adaptativo", "Central multimídia", "Som premium", "Faróis de LED", "Chave presencial", "Partida por botão", "Rodas de liga leve"] },
      ] },
    ],
    selos: ["Abaixo da FIPE", "Novo no estoque", "Baixou o preço"],
    titulo: c => [c.marca, c.modelo].filter(Boolean).join(" ") || "Carro sem nome",
    linha: c => c.versao || "",
    resumo: c => {
      const anos = c.ano_fab && c.ano_modelo ? `${c.ano_fab}/${c.ano_modelo}` : c.ano_modelo || c.ano_fab || "";
      return [anos, num(c.km) != null ? `${milhar(c.km)} km` : ""].filter(Boolean).join(" · ");
    },
  },

  otica: {
    item: "produto", itens: "produtos", umItem: "um produto", novo: "Adicionar produto", fim: "esgotado", quantidade: true,
    vazio: "Nenhum produto aqui ainda. Comece pelas armações da vitrine.",
    grupos: [
      { titulo: "O produto", campos: [
        { id: "tipo", rotulo: "Tipo", tipo: "lista", opcoes: ["Armação", "Óculos de sol", "Lente de contato", "Acessório"], obrigatorio: true, filtro: true },
        { id: "marca", rotulo: "Marca", tipo: "texto", obrigatorio: true, sugerir: true },
        { id: "modelo", rotulo: "Modelo ou referência", tipo: "texto" },
        { id: "publico", rotulo: "Para quem", tipo: "lista", opcoes: ["Feminino", "Masculino", "Unissex", "Infantil"], filtro: true, meio: true },
        { id: "formato", rotulo: "Formato", tipo: "lista", opcoes: ["Redondo", "Quadrado", "Gatinho", "Aviador", "Retangular", "Hexagonal"], filtro: true, meio: true },
        { id: "material", rotulo: "Material", tipo: "lista", opcoes: ["Acetato", "Metal", "Titânio", "Misto"], meio: true },
        { id: "cor", rotulo: "Cor", tipo: "texto", meio: true },
        { id: "medidas", rotulo: "Medidas", tipo: "texto", placeholder: "Aro-ponte-haste, ex.: 52-18-145" },
        { id: "polarizada", rotulo: "Lente polarizada", ...SIM_NAO },
      ] },
    ],
    selos: ["Lançamento", "Mais vendido", "Promoção"],
    titulo: c => [c.marca, c.modelo].filter(Boolean).join(" ") || "Produto sem nome",
    linha: c => [c.tipo, c.formato].filter(Boolean).join(" · "),
    resumo: c => [c.publico, c.material, c.cor].filter(Boolean).join(" · "),
  },
};

/** Todos os campos de um esquema, numa lista só. */
export const camposDe = esquema => esquema.grupos.flatMap(g => g.campos);

/** Os selos que o item mostra: os escolhidos e os que saem dos campos (Blindado). */
export function selosDoItem(esquema, item) {
  const doCampo = camposDe(esquema).filter(c => c.selo && item.campos && item.campos[c.id] === true).map(c => c.selo);
  return [...new Set([...doCampo, ...(item.selos || [])])];
}
