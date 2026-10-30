// Os formatos do painel, iguais em todo lugar (09, "Formatos"): valores "R$ 1.900", datas "sáb, 31/10", horas
// "19h30". Datas e horas sempre no fuso da conta (contas.fuso), não no do aparelho. Funções puras, testadas em
// test/formatos.test.mjs.

export const FUSO_PADRAO = "America/Sao_Paulo";

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const SEMANA_LONGA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA_EN = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const formatadores = new Map();
function formatador(fuso) {
  if (!formatadores.has(fuso)) {
    formatadores.set(fuso, new Intl.DateTimeFormat("en-US", {
      timeZone: fuso, hourCycle: "h23", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }));
  }
  return formatadores.get(fuso);
}

/** Ano, mês, dia, hora, minuto e dia da semana (0 = domingo) de um instante, no fuso dado. */
export function partes(data, fuso = FUSO_PADRAO) {
  const d = data instanceof Date ? data : new Date(data);
  const p = Object.fromEntries(formatador(fuso).formatToParts(d).map(x => [x.type, x.value]));
  return { ano: +p.year, mes: +p.month, dia: +p.day, hora: +p.hour % 24, minuto: +p.minute, semana: SEMANA_EN[p.weekday] };
}

const dois = n => String(n).padStart(2, "0");

/** "aaaa-mm-dd" de um instante, no fuso (o dia de hoje na conta: dia(new Date(), fuso)). */
export function dia(data, fuso = FUSO_PADRAO) {
  const p = partes(data, fuso);
  return `${p.ano}-${dois(p.mes)}-${dois(p.dia)}`;
}

/** O instante de um dia ("aaaa-mm-dd") e uma hora ("hh:mm") no fuso da conta. */
export function instanteNoFuso(diaTexto, horaTexto = "00:00", fuso = FUSO_PADRAO) {
  const [a, m, d] = diaTexto.split("-").map(Number);
  const [h, mi] = horaTexto.split(":").map(Number);
  const desejado = Date.UTC(a, m - 1, d, h, mi);
  let t = desejado;
  for (let i = 0; i < 2; i++) {
    const p = partes(new Date(t), fuso);
    const visto = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
    t += desejado - visto;
  }
  return new Date(t);
}

/** Soma dias a "aaaa-mm-dd". */
export function somarDias(diaTexto, n) {
  const [a, m, d] = diaTexto.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1, d + n));
  return `${x.getUTCFullYear()}-${dois(x.getUTCMonth() + 1)}-${dois(x.getUTCDate())}`;
}

/** "sáb, 31/10" */
export function dataCurta(data, fuso = FUSO_PADRAO) {
  const p = partes(data, fuso);
  return `${SEMANA[p.semana]}, ${dois(p.dia)}/${dois(p.mes)}`;
}

/** "sábado, 31 de outubro" */
export function dataLonga(data, fuso = FUSO_PADRAO) {
  const p = partes(data, fuso);
  return `${SEMANA_LONGA[p.semana]}, ${p.dia} de ${MESES[p.mes - 1]}`;
}

/** "31/10/2026" */
export function dataNumerica(data, fuso = FUSO_PADRAO) {
  const p = partes(data, fuso);
  return `${dois(p.dia)}/${dois(p.mes)}/${p.ano}`;
}

/** "19h30" ou "19h" */
export function hora(data, fuso = FUSO_PADRAO) {
  const p = partes(data, fuso);
  return p.minuto ? `${p.hora}h${dois(p.minuto)}` : `${p.hora}h`;
}

/** "19h30" a partir de "19:30" (os horários da conta, sem dia). */
export function horaDoTexto(texto) {
  const [h, m] = String(texto || "").split(":").map(Number);
  if (Number.isNaN(h)) return "";
  return m ? `${h}h${dois(m)}` : `${h}h`;
}

/** "R$ 1.900"; com `centavos`, "R$ 14,99". Vazio para valor que não existe. */
export function moeda(valor, { centavos = false } = {}) {
  if (valor === null || valor === undefined || valor === "" || Number.isNaN(Number(valor))) return "";
  const n = Number(valor);
  const casas = centavos || !Number.isInteger(n) ? 2 : 0;
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Lê um valor digitado ("1.900", "1900,50", "R$ 14,99") como número; null se não der. */
export function lerValor(texto) {
  const t = String(texto ?? "").replace(/[R$\s]/g, "");
  if (!t) return null;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t;
  const n = Number(normal);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** Só os números, com DDD; tira o 55 do Brasil (igual ao banco: public.normalizar_whatsapp). */
export function normalizarWhatsapp(texto) {
  const d = String(texto ?? "").replace(/\D/g, "");
  if (!d) return null;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d.slice(2);
  return d;
}

/** "(11) 98888-7777" */
export function telefone(texto) {
  const d = normalizarWhatsapp(texto);
  if (!d) return "";
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}

/** Máscara enquanto a pessoa digita: "(11", "(11) 9888", "(11) 98888-7777" (até 11 números). */
export function mascaraTelefone(texto) {
  const d = String(texto ?? "").replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  const meio = d.length === 11 ? 7 : 6;
  if (d.length <= meio) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, meio)}-${d.slice(meio)}`;
}

/** O WhatsApp parece certo (DDD + número)? */
export function whatsappValido(texto) {
  const d = normalizarWhatsapp(texto);
  return !!d && d.length >= 10 && d.length <= 15;
}

/** Link do WhatsApp com a mensagem pronta (wa.me). Número brasileiro sem o 55 ganha o 55. */
export function linkWhatsapp(numero, mensagem = "") {
  const d = normalizarWhatsapp(numero);
  if (!d) return "";
  const comPais = d.length <= 11 ? "55" + d : d;
  return `https://wa.me/${comPais}${mensagem ? "?text=" + encodeURIComponent(mensagem) : ""}`;
}

/** "há 5 min", "há 2 h", "ontem", "há 3 dias" */
export function haQuanto(data, agora = Date.now()) {
  const minutos = Math.max(1, Math.round((agora - new Date(data).getTime()) / 60000));
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ontem" : `há ${dias} dias`;
}

/** "hoje", "amanhã", "ontem", "em 3 dias", "há 2 dias", contando os dias no fuso da conta. */
export function emQuanto(data, fuso = FUSO_PADRAO, agora = Date.now()) {
  const alvo = dia(data, fuso), hoje = dia(new Date(agora), fuso);
  const n = Math.round((Date.parse(alvo + "T00:00:00Z") - Date.parse(hoje + "T00:00:00Z")) / 864e5);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n === -1) return "ontem";
  return n > 0 ? `em ${n} dias` : `há ${-n} dias`;
}

/** Até duas iniciais ("Juliana & Pedro" → "JP"). */
export function iniciais(nome) {
  return String(nome || "").replace(/[^\p{L}& ]/gu, "").split(/\s+|&/).filter(p => p.length > 1 && !/^(da|de|do|dos|das|e)$/i.test(p))
    .slice(0, 2).map(p => p[0].toUpperCase()).join("") || "?";
}

/**
 * Lê uma data digitada: "14/03/2027", "14/3/27", "14/03" (a próxima, a partir de `hoje`), "2027-03-14".
 * Devolve "aaaa-mm-dd" ou null.
 */
export function lerData(texto, hoje = dia(new Date())) {
  const t = String(texto || "").trim();
  let a, m, d;
  let x = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (x) [, a, m, d] = x.map(Number);
  else if ((x = t.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/))) {
    d = +x[1]; m = +x[2];
    if (x[3]) a = x[3].length === 2 ? 2000 + +x[3] : +x[3];
    else {
      const [ha, hm, hd] = hoje.split("-").map(Number);
      a = m < hm || (m === hm && d < hd) ? ha + 1 : ha;
    }
  } else return null;
  const data = new Date(Date.UTC(a, m - 1, d));
  if (data.getUTCFullYear() !== a || data.getUTCMonth() !== m - 1 || data.getUTCDate() !== d) return null;
  return `${a}-${dois(m)}-${dois(d)}`;
}

/** Lê uma hora digitada: "19:30", "19h30", "19h", "9". Devolve "hh:mm" ou null. */
export function lerHora(texto) {
  const x = String(texto || "").trim().toLowerCase().match(/^(\d{1,2})(?:\s*(?:h|:)\s*(\d{2})?)?\s*(?:h|hs|horas)?$/);
  if (!x) return null;
  const h = +x[1], m = x[2] ? +x[2] : 0;
  if (h > 23 || m > 59) return null;
  return `${dois(h)}:${dois(m)}`;
}
