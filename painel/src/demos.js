// Prazo das demos: as mesmas regras da função demo_liberada do Supabase, que o site (middleware.js)
// consulta antes de abrir /demo/<pasta>. Demo no ar = no_ar e vale_ate >= hoje (Brasília) ou sem prazo.

export const DIAS_DE_PRAZO = 7;

/** "/demo/otica-sales", "renderizaweb.com.br/demo/otica-sales/artes-instagram" -> "otica-sales". Sem /demo/, "". */
export function pastaDaDemo(link) {
  const m = /\/demo\/([A-Za-z0-9-]+)/.exec(String(link || ""));
  return m && /^[a-z0-9]/i.test(m[1]) ? m[1].toLowerCase() : "";
}

/** Dia de hoje no horário de Brasília, "AAAA-MM-DD" (o mesmo relógio do banco). */
export function hojeEmBrasilia(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

export function somarDias(iso, n) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const diasEntre = (de, ate) => Math.round((Date.parse(ate + "T12:00:00Z") - Date.parse(de + "T12:00:00Z")) / 86400000);
const diaMes = v => v.slice(8, 10) + "/" + v.slice(5, 7);

/**
 * Situação da demo para mostrar no painel.
 * estado: "no_ar" | "ultimo_dia" | "sem_prazo" | "expirada" | "fora" | "sem_controle" (pasta sem linha: fica no ar).
 */
export function situacaoDaDemo(demo, hoje = hojeEmBrasilia()) {
  if (!demo) return { estado: "sem_controle", noAr: true, texto: "Ainda sem prazo: fica no ar até alguém pôr um." };
  if (!demo.no_ar) return { estado: "fora", noAr: false, texto: "Desligada: quem abrir o link vê o aviso de demo fora do ar." };
  if (!demo.vale_ate) return { estado: "sem_prazo", noAr: true, texto: "Sem prazo: fica no ar até alguém desligar." };
  const faltam = diasEntre(hoje, demo.vale_ate);
  if (faltam < 0) return { estado: "expirada", noAr: false, texto: `Ficou no ar até ${diaMes(demo.vale_ate)}. Quem abrir o link vê o aviso de demo fora do ar.` };
  if (faltam === 0) return { estado: "ultimo_dia", noAr: true, texto: `Hoje (${diaMes(demo.vale_ate)}) é o último dia: amanhã sai do ar.` };
  return { estado: "no_ar", noAr: true, texto: `Até ${diaMes(demo.vale_ate)} (${faltam === 1 ? "falta 1 dia" : `faltam ${faltam} dias`}).` };
}

/** Patch que deixa a demo no ar por mais 7 dias a partir de hoje. */
export const reabilitar = (hoje = hojeEmBrasilia()) => ({ no_ar: true, vale_ate: somarDias(hoje, DIAS_DE_PRAZO) });
