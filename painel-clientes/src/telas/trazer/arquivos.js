// Trazer o que tem (Missão 7, bloco F): os arquivos no aparelho. O que dá para ler aqui não passa pela IA nem sobe:
// planilhas (CSV e Excel), contatos do celular (.vcf), Google Agenda (.ics) e texto. Fotos, PDFs e documentos sobem
// para a pasta da conta e a IA lê (a função assistente); as fotos encolhem antes (a IA lê até 2048 px). O .zip abre
// aqui e cada arquivo dele entra na lista. As funções sem tela são testadas em test/trazer.test.mjs.

const MB = 1024 * 1024;
export const LIMITES = {
  porVez: 50, // arquivos na lista (o zip conta cada arquivo de dentro)
  tamanho: 45 * MB, // cada arquivo que sobe (o Supabase grátis aceita até 50 MB)
  planilha: 25 * MB, // lida no aparelho
  zip: 150 * MB,
  lado: 2048,
};
const FFLATE = "https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js";

const EXTENSOES = {
  imagem: ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"],
  pdf: ["pdf"],
  documento: ["docx", "doc", "odt", "rtf"],
  planilha: ["xlsx", "xlsm"],
  csv: ["csv", "tsv"],
  contatos: ["vcf", "vcard"],
  agenda: ["ics", "ical"],
  texto: ["txt", "md"],
  zip: ["zip"],
};
const MIMES = {
  pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", doc: "application/msword",
  odt: "application/vnd.oasis.opendocument.text", rtf: "application/rtf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", heic: "image/heic", heif: "image/heif", txt: "text/plain", md: "text/plain",
  csv: "text/csv", tsv: "text/csv", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xlsm: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", vcf: "text/vcard", vcard: "text/vcard", ics: "text/calendar", ical: "text/calendar",
};
/** O que a IA lê (sobe para o Storage). */
export const LIDOS_PELA_IA = ["imagem", "pdf", "documento"];

export const extensao = nome => (String(nome || "").toLowerCase().match(/\.([a-z0-9]{1,6})$/) || [])[1] || "";

/** O tipo do arquivo pela extensão (e pelo tipo, quando a extensão falta): imagem, pdf, documento, planilha, csv, contatos, agenda, texto, zip; null se o painel não lê. */
export function tipoDoArquivo(nome, mime = "") {
  const ext = extensao(nome);
  for (const [tipo, lista] of Object.entries(EXTENSOES)) if (lista.includes(ext)) return tipo;
  if (/^image\//.test(mime)) return "imagem";
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/plain") return "texto";
  if (/\.(xls|ods|numbers|pages|key|pptx?)$/i.test(nome)) return null;
  return null;
}
export const mimeDo = nome => MIMES[extensao(nome)] || "application/octet-stream";

/** O motivo de um arquivo não entrar, para a lista: formatos que quase dão certo ganham a saída. */
export function porQueNaoLe(nome) {
  const ext = extensao(nome);
  if (ext === "xls" || ext === "ods" || ext === "numbers") return "Planilha antiga: salve como .xlsx ou .csv e mande de novo.";
  if (ext === "pages" || ext === "key" || ext === "ppt" || ext === "pptx") return "Formato que o painel não lê: salve como PDF.";
  if (["mp4", "mov", "mp3", "ogg", "opus", "m4a", "wav"].includes(ext)) return "Áudio e vídeo não: mande um print ou o texto.";
  return "Formato que o painel não lê. Mande como foto, PDF, Word, planilha, contatos (.vcf) ou agenda (.ics).";
}

export function tamanhoLegivel(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / MB).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
}

/** O nome do arquivo no Storage: só letras sem acento, números e hífen (a extensão fica), com a ordem na frente. */
export function nomeParaCaminho(nome, ordem) {
  const ext = extensao(nome);
  const base = String(nome || "arquivo").replace(/\.[^.]*$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "arquivo";
  return `${String(ordem).padStart(2, "0")}-${base}${ext ? "." + ext : ""}`;
}

/** Um código curto para a pasta do lote ("lote-xxxxxxxx") ou do pedido. */
export function codigoDaPasta(prefixo, sorteio = () => Math.random().toString(36).slice(2, 12)) {
  return `${prefixo}-${(sorteio() + sorteio()).replace(/[^a-z0-9]/g, "").slice(0, 12).padEnd(8, "0")}`;
}

// ---------- texto dos formatos ----------

const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
export const desfazerXml = t => String(t).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENTIDADES[e.toLowerCase()]);

/** Linhas "dobradas" (as que continuam com espaço no começo) dos formatos .vcf e .ics. */
const desdobrar = texto => String(texto || "").replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");

/** quoted-printable dos contatos antigos do Android (=C3=A9 é "é"). */
function quotedPrintable(t) {
  const bytes = [];
  const s = t.replace(/=\n/g, "");
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "=" && /^[0-9A-F]{2}$/i.test(s.slice(i + 1, i + 3))) { bytes.push(parseInt(s.slice(i + 1, i + 3), 16)); i += 2; }
    else bytes.push(...new TextEncoder().encode(s[i]));
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Contatos do celular (.vcf): [{ nome, whatsapp, email }] (só os que têm nome e telefone ou e-mail). */
export function lerVcf(texto) {
  // as linhas quoted-printable continuam na de baixo quando terminam em "=" (a quebra "mole" do formato)
  let bruto = String(texto || "").replace(/\r\n?/g, "\n"), antes;
  do { antes = bruto; bruto = bruto.replace(/(ENCODING=QUOTED-PRINTABLE[^\n]*)=\n/gi, "$1"); } while (bruto !== antes);
  const linhas = desdobrar(bruto);
  const contatos = [];
  let atual = null;
  for (const linha of linhas) {
    if (/^BEGIN:VCARD/i.test(linha)) { atual = { nome: "", partes: "", telefones: [], email: "" }; continue; }
    if (/^END:VCARD/i.test(linha)) {
      if (atual) {
        const nome = (atual.nome || atual.partes).replace(/\s+/g, " ").trim();
        const zap = atual.telefones.find(t => t.celular) || atual.telefones[0];
        if (nome && (zap || atual.email)) contatos.push({ nome: nome.slice(0, 120), whatsapp: zap ? zap.numero : "", email: atual.email });
      }
      atual = null;
      continue;
    }
    if (!atual) continue;
    const m = linha.match(/^(?:item\d+\.)?([A-Z-]+)((?:;[^:]*)?):(.*)$/i);
    if (!m) continue;
    const [, chave, params, bruto] = m;
    const valor = /ENCODING=QUOTED-PRINTABLE/i.test(params) ? quotedPrintable(bruto) : bruto.replace(/\\([,;\\])/g, "$1").replace(/\\n/gi, " ");
    const k = chave.toUpperCase();
    if (k === "FN") atual.nome = valor;
    else if (k === "N" && !atual.partes) {
      const [sobrenome, nome, meio] = valor.split(";");
      atual.partes = [nome, meio, sobrenome].filter(Boolean).join(" ");
    } else if (k === "TEL") {
      const numero = valor.replace(/\D/g, "").replace(/^0+/, "");
      if (numero.length >= 10 && numero.length <= 13) atual.telefones.push({ numero, celular: /CELL|MOBILE|WHATSAPP|IPHONE/i.test(params) });
    } else if (k === "EMAIL" && !atual.email) {
      const e = valor.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) atual.email = e;
    }
  }
  return contatos;
}

/** O instante de um DTSTART do .ics: { data: "AAAA-MM-DD", hora: "HH:MM" | "" } no fuso da conta. */
function quandoDoIcs(params, valor, fuso) {
  const v = valor.trim();
  const d = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})\d{0,2}(Z)?)?$/);
  if (!d) return null;
  const [, a, m, di, h, mi, z] = d;
  if (!h || /VALUE=DATE(?!-)/i.test(params)) return { data: `${a}-${m}-${di}`, hora: "" };
  if (!z) return { data: `${a}-${m}-${di}`, hora: `${h}:${mi}` }; // hora local (com ou sem TZID): fica como está
  const instante = new Date(Date.UTC(+a, +m - 1, +di, +h, +mi));
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(instante).map(x => [x.type, x.value]));
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

/** Google Agenda (.ics): [{ data, hora, nome, observacao, repete }] (os que se repetem vêm marcados: aniversário, rotina). */
export function lerIcs(texto, fuso = "America/Sao_Paulo") {
  const eventos = [];
  let atual = null;
  for (const linha of desdobrar(texto)) {
    if (/^BEGIN:VEVENT/i.test(linha)) { atual = {}; continue; }
    if (/^END:VEVENT/i.test(linha)) {
      if (atual && atual.quando && atual.nome && !atual.cancelado) eventos.push({ ...atual.quando, nome: atual.nome, observacao: atual.observacao || "", repete: !!atual.repete });
      atual = null;
      continue;
    }
    if (!atual) continue;
    const m = linha.match(/^([A-Z-]+)((?:;[^:]*)?):(.*)$/i);
    if (!m) continue;
    const [, chave, params, valor] = m;
    const texto2 = valor.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
    switch (chave.toUpperCase()) {
      case "DTSTART": atual.quando = quandoDoIcs(params, valor, fuso); break;
      case "SUMMARY": atual.nome = texto2.slice(0, 120); break;
      case "DESCRIPTION": atual.observacao = texto2.slice(0, 300); break;
      case "RRULE": atual.repete = true; break;
      case "STATUS": atual.cancelado = /CANCELLED/i.test(valor); break;
    }
  }
  return eventos;
}

/** "AB" → 27 (a coluna da célula "AB12"). */
export function indiceDaColuna(ref) {
  const letras = String(ref || "").match(/^[A-Z]+/i);
  if (!letras) return 0;
  return [...letras[0].toUpperCase()].reduce((n, c) => n * 26 + (c.charCodeAt(0) - 64), 0) - 1;
}

/** O número de data do Excel (dias desde 30/12/1899) como "AAAA-MM-DD"; null se não parece data. */
export function dataDoExcel(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 20000 || v > 80000) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
  return d.toISOString().slice(0, 10);
}

/** A hora do Excel (a fração do dia) como "HH:MM"; null se não tem. */
export function horaDoExcel(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const minutos = Math.round((v - Math.floor(v)) * 1440);
  if (!minutos || minutos >= 1440) return null;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

/**
 * A primeira planilha (com algo dentro) de um .xlsx: as linhas, como texto. `ler(caminho)` devolve o XML de dentro do
 * arquivo (ou null). Números ficam como estão (a data do Excel é um número: quem sabe que a coluna é data converte).
 */
export function lerXlsx(ler) {
  const compartilhados = [];
  const sst = ler("xl/sharedStrings.xml");
  if (sst) for (const si of sst.match(/<si\b[\s\S]*?<\/si>/g) || []) {
    compartilhados.push(desfazerXml((si.match(/<t\b[^>]*>[\s\S]*?<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, "")).join("")));
  }
  const livro = ler("xl/workbook.xml") || "";
  const rels = ler("xl/_rels/workbook.xml.rels") || "";
  const alvos = (livro.match(/<sheet\b[^>]*>/g) || []).map(s => {
    const id = (s.match(/r:id="([^"]+)"/) || [])[1];
    const rel = id && (rels.match(new RegExp(`<Relationship\\b[^>]*Id="${id}"[^>]*>`)) || [])[0];
    const alvo = rel && (rel.match(/Target="([^"]+)"/) || [])[1];
    return alvo ? (alvo.startsWith("/") ? alvo.slice(1) : "xl/" + alvo.replace(/^\.\//, "")) : null;
  }).filter(Boolean);
  if (!alvos.length) alvos.push("xl/worksheets/sheet1.xml");
  for (const alvo of alvos) {
    const xml = ler(alvo);
    if (!xml) continue;
    const linhas = [];
    for (const row of xml.match(/<row\b[\s\S]*?<\/row>|<row\b[^>]*\/>/g) || []) {
      const linha = [];
      for (const c of row.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || []) {
        const abre = c.match(/^<c\b[^>]*>/)[0];
        const ref = (abre.match(/\br="([A-Z]+)\d+"/) || [])[1];
        const t = (abre.match(/\bt="([^"]+)"/) || [])[1];
        const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        let valor = "";
        if (t === "s") valor = compartilhados[Number(v)] || "";
        else if (t === "inlineStr") valor = desfazerXml(((c.match(/<is>[\s\S]*?<\/is>/) || [""])[0].match(/<t\b[^>]*>[\s\S]*?<\/t>/g) || []).map(x => x.replace(/<[^>]+>/g, "")).join(""));
        else if (t === "b") valor = v === "1" ? "sim" : "não";
        else valor = v !== undefined ? desfazerXml(v) : "";
        const i = ref ? indiceDaColuna(ref) : linha.length;
        while (linha.length < i) linha.push("");
        linha[i] = String(valor).trim();
      }
      if (linha.some(x => x)) linhas.push(linha);
    }
    if (linhas.length) return linhas;
  }
  return [];
}

// ---------- no navegador ----------

let fflate = null;
const carregarFflate = async () => (fflate = fflate || (await import(FFLATE)));

/** Abre um .zip: os arquivos de dentro (sem pastas de sistema), e os que não entram. */
export async function abrirZip(arquivo) {
  if (arquivo.size > LIMITES.zip) throw new Error(`O .zip passa de ${tamanhoLegivel(LIMITES.zip)}. Divida em partes menores.`);
  const { unzipSync } = await carregarFflate();
  const dados = new Uint8Array(await arquivo.arrayBuffer());
  const ignorados = [];
  const dentro = unzipSync(dados, {
    filter: f => {
      const nome = f.name.split("/").pop();
      if (!nome || f.name.endsWith("/") || /(^|\/)(__MACOSX|\.)/.test(f.name)) return false;
      if (!tipoDoArquivo(nome) || tipoDoArquivo(nome) === "zip") { ignorados.push(nome); return false; }
      if (f.originalSize > LIMITES.tamanho) { ignorados.push(nome); return false; }
      return true;
    },
  });
  const arquivos = Object.entries(dentro).map(([caminho, bytes]) => {
    const nome = caminho.split("/").pop();
    return new File([bytes], nome, { type: mimeDo(nome) });
  });
  return { arquivos, ignorados };
}

/** As linhas de um .xlsx (aberto aqui, no aparelho). */
export async function linhasDoXlsx(arquivo) {
  const { unzipSync, strFromU8 } = await carregarFflate();
  const dentro = unzipSync(new Uint8Array(await arquivo.arrayBuffer()), { filter: f => /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(f.name) });
  return lerXlsx(c => (dentro[c] ? strFromU8(dentro[c]) : null));
}

/** Uma foto grande encolhe para 2048 px (JPEG); a pequena vai como está. Foto que o aparelho não abre (HEIC fora do iPhone) volta null. */
export async function prepararImagem(arquivo) {
  let bitmap;
  try { bitmap = await createImageBitmap(arquivo); } catch (e) { return null; }
  const escala = Math.min(1, LIMITES.lado / Math.max(bitmap.width, bitmap.height));
  if (escala === 1 && arquivo.size <= 4 * MB && /^image\/(jpeg|png|webp)$/.test(arquivo.type)) { bitmap.close && bitmap.close(); return arquivo; }
  const tela = document.createElement("canvas");
  tela.width = Math.round(bitmap.width * escala);
  tela.height = Math.round(bitmap.height * escala);
  const ctx = tela.getContext("2d");
  ctx.fillStyle = "#fff"; // PNG transparente vira fundo branco (no JPEG o transparente ficaria preto)
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.drawImage(bitmap, 0, 0, tela.width, tela.height);
  bitmap.close && bitmap.close();
  const blob = await new Promise(r => tela.toBlob(r, "image/jpeg", 0.88));
  return blob ? new File([blob], arquivo.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : arquivo;
}
