// Trazer da WebMotors (12-modulo-estoque.md, "Trazer do anúncio"; 26/11/2026): o que a pessoa copiou da página do
// anúncio dela, no navegador dela (Ctrl+A, Ctrl+C), vira os campos do carro. Sem IA e sem acessar a WebMotors daqui
// (a página recusa leitura automática, e contornar isso não é caminho): a leitura é pelos rótulos da ficha ("Ano",
// "KM", "Câmbio"...), pelo "Valor anunciado", pelo "Sobre este carro" e pelos "Itens de veículo", que a página mostra
// a quem está vendo. Os anúncios "parecidos" e a FIPE da mesma página ficam de fora. Só o link do anúncio dá a marca,
// o modelo, a versão e os anos (estão no endereço). As fotos não vêm: a pessoa põe as dela.

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const LIMITE_DESCRICAO = 3500;

// as marcas mais vistas, na grafia de sempre (a WebMotors escreve "PORSCHE", "MERCEDES-BENZ"...)
const MARCAS = ["Audi", "Aston Martin", "Bentley", "BMW", "BYD", "Caoa Chery", "Chery", "Chevrolet", "Chrysler", "Citroën", "Dodge", "Ferrari", "Fiat", "Ford",
  "GWM", "Haval", "Honda", "Hyundai", "JAC", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Maserati", "McLaren", "Mercedes-Benz", "Mini",
  "Mitsubishi", "Nissan", "Peugeot", "Porsche", "RAM", "Renault", "Rolls-Royce", "Subaru", "Suzuki", "Toyota", "Troller", "Volkswagen", "Volvo", "Zeekr"];
const SIGLAS = new Set(["BMW", "BYD", "GWM", "JAC", "RAM", "GMC", "MG", "AMG", "GT", "GTS", "RS", "SUV", "TFSI", "TSI", "4X4", "AWD", "XC", "M"]);

/** "PORSCHE" → "Porsche"; "RANGE ROVER EVOQUE" → "Range Rover Evoque"; com número ou sigla curta fica como está ("330e", "X1", "GLC"). */
function grafia(texto, conhecidos = []) {
  const t = String(texto || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const igual = conhecidos.find(k => semAcento(k) === semAcento(t)) || MARCAS.find(k => semAcento(k) === semAcento(t));
  if (igual) return igual;
  return t.split(" ").map(p => (/\d/.test(p) || SIGLAS.has(p.toUpperCase()) || (p.length <= 3 && p === p.toUpperCase()) ? p : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
    .join(" ").replace(/-([a-z])/g, (_, l) => "-" + l.toUpperCase());
}

// ---------- os valores da ficha → as opções do painel (ESQUEMAS.automotivo) ----------
function cambio(v) {
  const s = semAcento(v);
  if (/automatizad|semi/.test(s)) return "Automatizado";
  if (/cvt/.test(s)) return "CVT";
  if (/autom/.test(s)) return "Automático";
  if (/manual/.test(s)) return "Manual";
  return null;
}
function combustivel(v) {
  const s = semAcento(v);
  if (/hibrid/.test(s) || (/eletric/.test(s) && /gasolina|alcool|diesel|flex|etanol/.test(s))) return "Híbrido";
  if (/eletric/.test(s)) return "Elétrico";
  if (/diesel/.test(s)) return "Diesel";
  if (/flex/.test(s) || (/gasolina/.test(s) && /alcool|etanol/.test(s))) return "Flex";
  if (/gasolina/.test(s)) return "Gasolina";
  return null;
}
function carroceria(v) {
  const s = semAcento(v);
  if (/utilitario esportivo|\bsuv\b/.test(s)) return "SUV";
  if (/seda/.test(s)) return "Sedã";
  if (/hatch/.test(s)) return "Hatch";
  if (/picape|pick-?up|cabine/.test(s)) return "Picape";
  if (/conversivel|cabriol|roadster/.test(s)) return "Conversível";
  if (/cupe|coupe/.test(s)) return "Cupê";
  if (/perua|\bsw\b|station|wagon/.test(s)) return "Perua";
  return null;
}
const simNao = v => (/^sim\b/.test(semAcento(v)) ? true : /^nao\b/.test(semAcento(v)) ? false : null);
const numero = v => { const d = String(v || "").replace(/\D/g, ""); return d ? Number(d) : null; };
const reais = v => { const m = String(v || "").match(/R\$\s*([\d.]+)(?:,(\d{1,2}))?/); return m ? Number(m[1].replace(/\./g, "")) + (m[2] ? Number(m[2].padEnd(2, "0")) / 100 : 0) : null; };

/** Os itens do anúncio que têm caixa no painel (ESQUEMAS.automotivo, "Opcionais"). */
const OPCIONAIS = [
  ["Teto solar", /teto solar|teto panoramico/],
  ["Bancos de couro", /bancos? (de|em) couro|revestimento (de|em) couro|bancos? revestidos? de couro/],
  ["Bancos aquecidos", /bancos? (dianteiros? )?aquecid|aquecimento (dos|de) bancos?/],
  ["Câmera 360", /camera (de )?360/],
  ["Sensor de estacionamento", /sensor(es)? de estacionamento|sensor(es)? de re\b|sensor(es)? de manobra|park assist/],
  ["Piloto automático adaptativo", /piloto automatico adaptativo|controle de cruzeiro adaptativo|cruise control adaptativo/],
  ["Central multimídia", /central multimidia|tela multimidia|sistema multimidia/],
  ["Som premium", /som premium|sistema de som premium|harman|bose|burmester|bowers|meridian|mark levinson|bang ?& ?olufsen/],
  ["Faróis de LED", /farois? (full |de )?led|farol (full |de )?led/],
  ["Chave presencial", /chave (inteligente|presencial)|keyless/],
  ["Partida por botão", /botao de (ignicao|partida)|start button|partida (por|com|no) botao/],
  ["Rodas de liga leve", /rodas? de liga( leve)?/],
];

// ---------- as partes da página ----------
const ROTULOS = [
  ["todas as revisoes feitas pela concessionaria", "revisoes"], ["revisoes feitas pela concessionaria", "revisoes"], ["revisoes na concessionaria", "revisoes"],
  ["garantia de fabrica", "garantia"], ["final de placa", "placa"], ["final da placa", "placa"], ["aceita troca", "troca"], ["quilometragem", "km"],
  ["combustivel", "combustivel"], ["carroceria", "carroceria"], ["unico dono", "unico_dono"], ["licenciado", "licenciado"], ["ipva pago", "ipva"],
  ["blindado", "blindado"], ["cidade", "cidade"], ["cambio", "cambio"], ["ano", "anos"], ["cor", "cor"], ["km", "km"],
];
const FIM_DA_FICHA = /^(sobre (os diferenciais|este carro|este veiculo)|itens d[eo] veiculo|videochamada|denunciar|compare os precos|simule)/;
const PARECE_VERSAO = /\b\d\.\d\b|\b(v\d{1,2}|turbo|aut\.?|automatic[oa]|manual|flex|hibrido|eletrico|diesel|gasolina|pdk|tiptronic|cvt|4x4|awd|quattro|xdrive|4matic|cabine)\b/;

function linhasDe(texto) {
  return String(texto || "").replace(/\r/g, "").split(/\n/).map(l => l.replace(/ /g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** Onde a ficha começa: a linha "Ano" seguida do ano (ou "Ano 2022/2022" na mesma linha); recua até "Cidade". */
function inicioDaFicha(linhas) {
  for (let k = 0; k < linhas.length; k++) {
    const s = semAcento(linhas[k]);
    const anoNaLinha = /^ano[\s:]+\d{4}(\s*\/\s*\d{4})?$/.test(s);
    const anoNaSeguinte = s === "ano" && /^\d{4}(\s*\/\s*\d{4})?$/.test(linhas[k + 1] || "");
    if (anoNaLinha || anoNaSeguinte) {
      for (let j = k - 1; j >= Math.max(0, k - 4); j--) if (/^cidade\b/.test(semAcento(linhas[j]))) return j;
      return k;
    }
  }
  return -1;
}

function lerFicha(linhas, de) {
  const achado = {};
  for (let k = de; k < Math.min(linhas.length, de + 70); k++) {
    const s = semAcento(linhas[k]);
    if (k > de && FIM_DA_FICHA.test(s)) break;
    for (const [rotulo, campo] of ROTULOS) {
      if (achado[campo] !== undefined) continue;
      if (s === rotulo && linhas[k + 1] !== undefined) { achado[campo] = linhas[k + 1]; k++; break; }
      if (s.startsWith(rotulo + " ") || s.startsWith(rotulo + ":")) { achado[campo] = linhas[k].slice(rotulo.length).replace(/^[\s:]+/, ""); break; }
    }
  }
  return achado;
}

/** Marca, modelo e versão: as linhas logo antes da ficha (a versão é a que tem cara de versão: "2.0", "TURBO", "AUTOMÁTICO"…). */
function lerTitulo(linhas, de) {
  for (let k = de - 1; k >= Math.max(0, de - 10); k--) {
    if (!PARECE_VERSAO.test(semAcento(linhas[k]))) continue;
    const versao = linhas[k], modelo = linhas[k - 1] || "", marca = linhas[k - 2] || "";
    const curta = (x, n) => x && x.length <= n && x.split(" ").length <= 4 && !/[|:]/.test(x);
    // marca e modelo em linhas separadas ("BMW", "330e"), ou juntos numa linha ("BMW 330e")
    if (curta(marca, 25) && curta(modelo, 40) && MARCAS.some(m => semAcento(m) === semAcento(marca))) return { marca, modelo, versao };
    const junto = MARCAS.filter(m => semAcento(modelo).startsWith(semAcento(m) + " ")).sort((a, b) => b.length - a.length)[0];
    if (junto) return { marca: junto, modelo: modelo.slice(junto.length).trim(), versao };
    if (curta(marca, 25) && curta(modelo, 40)) return { marca, modelo, versao };
    return { versao };
  }
  return {};
}

function lerPreco(linhas) {
  const k = linhas.findIndex(l => semAcento(l) === "valor anunciado");
  if (k >= 0 && reais(linhas[k + 1]) !== null) return reais(linhas[k + 1]);
  // sem o "Valor anunciado": o primeiro preço que não é da FIPE, da média, de entrada ou de um anúncio parecido (que vem
  // seguido dos anos, "2022/2023")
  for (let j = 0; j < linhas.length; j++) {
    if (!/^R\$\s*[\d.]+(,\d{2})?$/.test(linhas[j])) continue;
    const perto = semAcento([linhas[j - 1], linhas[j + 1]].join(" "));
    if (/fipe|valor medio|entrada|por mes|\d+x de/.test(perto) || /^\d{4}\s*\/\s*\d{4}$/.test(linhas[j + 1] || "")) continue;
    return reais(linhas[j]);
  }
  return null;
}

function lerDepoisDe(linhas, inicio, fim, maximo = 80) {
  const k = linhas.findIndex(l => inicio.test(semAcento(l)));
  if (k < 0) return [];
  const out = [];
  for (let j = k + 1; j < Math.min(linhas.length, k + 1 + maximo); j++) {
    if (fim.test(semAcento(linhas[j]))) break;
    out.push(linhas[j]);
  }
  return out;
}

/** O endereço de um anúncio: /comprar/<marca>/<modelo>/<versão>/<n>-portas/<ano>[-<ano>]/<id>. */
export function lerLink(texto) {
  const m = String(texto || "").match(/webmotors\.com\.br\/comprar\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)\/\d+-portas\/(\d{4})(?:-(\d{4}))?\/(\d+)/i);
  if (!m) return null;
  // no endereço tudo vem em minúsculas: "x1", "q5" voltam a "X1", "Q5" ("330e" fica)
  const palavras = s => s.split("-").map(p => (/^[a-z]+\d+[a-z]*$/.test(p) ? p.toUpperCase() : p)).join(" ");
  const versao = palavras(m[3]).toUpperCase().replace(/^(\d)(\d)\b/, "$1.$2"); // "20 16V…" → "2.0 16V…" (o endereço perde o ponto)
  return {
    campos: { marca: grafia(palavras(m[1])), modelo: grafia(palavras(m[2])), versao, ano_fab: Number(m[4]), ano_modelo: Number(m[5] || m[4]) },
    id: m[6],
  };
}

/**
 * O que veio na colagem. `conhecidos`: as marcas e os modelos que a conta já tem (para escrever igual).
 * Devolve { tipo: "anuncio" | "link" | null, campos, preco, descricao, semCaixa, achou } (só o que achou). `achou` diz
 * que partes da página vieram (ficha, itens, descrição): na edição, só uma parte que veio troca o que está no painel
 * (um "sim" que sumiu da ficha vira "não"; um opcional que sumiu dos itens sai).
 */
export function lerAnuncio(texto, { conhecidos = [] } = {}) {
  const linhas = linhasDe(texto);
  const de = inicioDaFicha(linhas);
  if (de < 0) {
    const link = lerLink(texto);
    const nada = { ficha: false, itens: false, descricao: false };
    return link ? { tipo: "link", campos: link.campos, preco: null, descricao: "", semCaixa: [], achou: nada } : { tipo: null, campos: {}, preco: null, descricao: "", semCaixa: [], achou: nada };
  }
  const f = lerFicha(linhas, de);
  const t = lerTitulo(linhas, de);
  const campos = {};
  if (t.marca) campos.marca = grafia(t.marca, conhecidos);
  if (t.modelo) campos.modelo = grafia(t.modelo, conhecidos);
  if (t.versao) campos.versao = t.versao;
  if (f.anos) {
    const a = String(f.anos).match(/(\d{4})(?:\s*\/\s*(\d{4}))?/);
    if (a) { campos.ano_fab = Number(a[1]); campos.ano_modelo = Number(a[2] || a[1]); }
  }
  if (f.km !== undefined && numero(f.km) !== null) campos.km = numero(f.km);
  if (f.cor) campos.cor = f.cor.charAt(0).toUpperCase() + f.cor.slice(1);
  const lista = { cambio: cambio(f.cambio), combustivel: combustivel(f.combustivel), carroceria: carroceria(f.carroceria) };
  for (const [k, v] of Object.entries(lista)) if (v) campos[k] = v;
  if (f.placa && /\d/.test(f.placa)) campos.placa = f.placa.match(/\d/)[0];
  for (const k of ["blindado", "troca", "revisoes", "ipva", "licenciado", "unico_dono", "garantia"]) {
    if (f[k] !== undefined && simNao(f[k]) !== null) campos[k] = simNao(f[k]);
  }
  // os itens: os que têm caixa no painel viram opcionais; os outros vão para o fim da descrição
  const itens = lerDepoisDe(linhas, /^itens d[eo] veiculo/, /^(sobre o vendedor|denunciar|ver todos|compare|conquistas|simule|sobre este)/, 60).filter(l => l.length <= 60);
  const opcionais = [], semCaixa = [];
  for (const item of itens) {
    const achou = OPCIONAIS.find(([, re]) => re.test(semAcento(item)));
    if (achou) { if (!opcionais.includes(achou[0])) opcionais.push(achou[0]); } else semCaixa.push(item);
  }
  if (opcionais.length) campos.opcionais = opcionais;
  const sobre = lerDepoisDe(linhas, /^(sobre este (carro|veiculo)|observacoes do vendedor)$/, /^(denunciar|itens d[eo] veiculo|sobre o vendedor|ver mais$|ver menos$|simule)/, 30);
  let descricao = sobre.join("\n");
  if (semCaixa.length) descricao = `${descricao}${descricao ? "\n\n" : ""}Itens: ${semCaixa.join(", ")}.`;
  const achou = { ficha: Boolean(f.anos || f.km), itens: itens.length > 0, descricao: sobre.length > 0 };
  return { tipo: "anuncio", campos, preco: lerPreco(linhas), descricao: descricao.slice(0, LIMITE_DESCRICAO), semCaixa, achou };
}
