// A assinatura do painel (13-assinatura.md): as contas da tela, sem banco nem tela (testadas em test/assinatura.test.mjs).
// A mensalidade é por Pix, por fora, e a Renderiza registra cada pagamento no Admin (02); aqui só se lê o combinado
// (assinaturas: valor, dia, início) e os pagamentos, e se diz como está: a próxima mensalidade, o que está em aberto e
// o extrato mês a mês. Datas no formato "aaaa-mm-dd", no fuso da conta.

import { mensalidadeSugerida, mesDe, somarMeses, nomeDoMes } from "../../admin/logica.js";

export { nomeDoMes };

/** Até quantos dias antes do vencimento a tela avisa ("vence em 3 dias"). */
export const AVISO_DIAS = 5;

/** O valor do mês: o combinado (assinaturas.valor) ou o do plano (R$ 49 com 2 módulos; o Meu site fora da conta). */
export function valorDoMes(assinatura, modulos = [], catalogo = []) {
  return assinatura && assinatura.valor !== null && assinatura.valor !== undefined ? Number(assinatura.valor) : mensalidadeSugerida(modulos, catalogo);
}

/** O dia do vencimento: o combinado ou o da primeira mensalidade; null sem nenhum dos dois. */
export function diaDoVencimento(a) {
  if (a && a.dia) return Number(a.dia);
  return a && a.inicio ? Number(String(a.inicio).slice(8, 10)) : null;
}

const diasEntre = (de, ate) => Math.round((Date.UTC(...ate.split("-").map((x, i) => Number(x) - (i === 1 ? 1 : 0))) - Date.UTC(...de.split("-").map((x, i) => Number(x) - (i === 1 ? 1 : 0)))) / 864e5);
const ultimoDia = mes => new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate();
// o vencimento de cada mês no dia combinado (no último dia do mês, quando ele é mais curto: a primeira em 31/01 vence em 28/02)
const vencimentoDo = (mes, primeiroMes, inicio, d) => (mes === primeiroMes ? String(inicio).slice(0, 10) : `${mes.slice(0, 8)}${String(Math.min(d, ultimoDia(mes))).padStart(2, "0")}`);

/**
 * O extrato, do mês mais novo para o mais antigo: cada mês do combinado até a próxima mensalidade (e os meses com
 * pagamento fora disso), com o vencimento, o que entrou e a situação: "pago", "em-aberto" (venceu sem pagamento),
 * "vence-hoje" ou "a-vencer". Sem o combinado, só os meses pagos.
 */
export function extrato(a, pagamentos = [], hoje) {
  const porMes = new Map();
  for (const p of pagamentos) {
    const m = mesDe(p.mes);
    if (!porMes.has(m)) porMes.set(m, []);
    porMes.get(m).push({ valor: Number(p.valor), pago_em: p.pago_em });
  }
  const d = diaDoVencimento(a);
  const linhas = new Map();
  const pago = m => porMes.has(m);
  if (a && a.inicio && d) {
    const primeiro = mesDe(a.inicio);
    // até a próxima mensalidade sem pagamento depois de hoje (no máximo 10 anos: um combinado errado não trava a tela)
    for (let m = primeiro, k = 0; k < 120; m = somarMeses(m, 1), k++) {
      const vencimento = vencimentoDo(m, primeiro, a.inicio, d);
      const estado = pago(m) ? "pago" : vencimento < hoje ? "em-aberto" : vencimento === hoje ? "vence-hoje" : "a-vencer";
      linhas.set(m, { mes: m, vencimento, estado, pagamentos: porMes.get(m) || [] });
      if (vencimento > hoje && !pago(m)) break;
    }
  }
  for (const [m, lista] of porMes) if (!linhas.has(m)) linhas.set(m, { mes: m, vencimento: null, estado: "pago", pagamentos: lista });
  return [...linhas.values()].sort((x, y) => (x.mes < y.mes ? 1 : -1));
}

/**
 * Como está a assinatura hoje:
 *   { estado: "a-combinar" }                                    sem a primeira mensalidade combinada
 *   { estado: "comeca", vencimento, mes, dias }                 antes da primeira
 *   { estado: "em-dia" | "vence-logo", vencimento, mes, dias }  a próxima ainda não venceu (vence-logo: até AVISO_DIAS)
 *   { estado: "vence-hoje", vencimento, mes }
 *   { estado: "atrasada", vencimento, mes, dias, meses }        a mais antiga sem pagamento já venceu
 */
export function situacaoDaAssinatura(a, pagamentos = [], hoje) {
  const d = diaDoVencimento(a);
  if (!a || !a.inicio || !d) return { estado: "a-combinar" };
  const inicio = String(a.inicio).slice(0, 10);
  if (hoje < inicio) return { estado: "comeca", vencimento: inicio, mes: mesDe(inicio), dias: diasEntre(hoje, inicio) };
  const meses = extrato(a, pagamentos, hoje).filter(l => l.vencimento).reverse(); // do mais antigo ao mais novo
  const abertos = meses.filter(l => l.estado === "em-aberto");
  if (abertos.length) return { estado: "atrasada", vencimento: abertos[0].vencimento, mes: abertos[0].mes, dias: diasEntre(abertos[0].vencimento, hoje), meses: abertos.length };
  const hojeVence = meses.find(l => l.estado === "vence-hoje");
  if (hojeVence) return { estado: "vence-hoje", vencimento: hojeVence.vencimento, mes: hojeVence.mes };
  const proxima = meses.find(l => l.estado === "a-vencer");
  if (!proxima) return { estado: "em-dia", vencimento: null, mes: null, dias: null };
  const dias = diasEntre(hoje, proxima.vencimento);
  return { estado: dias <= AVISO_DIAS ? "vence-logo" : "em-dia", vencimento: proxima.vencimento, mes: proxima.mes, dias };
}
