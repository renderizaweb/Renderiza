// Financeiro (Missão 3, bloco D): as regras sem tela, testadas em test/financeiro.test.mjs. É controle (02): o painel
// não recebe nem cobra; registra o que entrou e o que falta. Datas "aaaa-mm-dd" no fuso da conta; valores em reais.

import { dataCurta, instanteNoFuso, somarDias, moeda } from "../../ui/formatos.js";
import { doNegocio } from "../../nichos/index.js";

export const FORMAS = [
  { id: "pix", nome: "Pix" }, { id: "dinheiro", nome: "Dinheiro" }, { id: "cartao", nome: "Cartão" },
  { id: "transferencia", nome: "Transferência" }, { id: "boleto", nome: "Boleto" }, { id: "outro", nome: "Outro" },
];
export const nomeDaForma = id => (FORMAS.find(f => f.id === id) || {}).nome || "";

const dias = (de, ate) => Math.round((Date.parse(ate + "T12:00:00Z") - Date.parse(de + "T12:00:00Z")) / 864e5);
const mesDe = d => String(d || "").slice(0, 7);
const curta = (d, fuso) => dataCurta(instanteNoFuso(d, "12:00", fuso), fuso);
const soma = lista => Math.round(lista.reduce((t, p) => t + Number(p.valor || 0), 0) * 100) / 100;

/** A situação da parcela: paga, atrasada, vence hoje ou aberta (a vencer). */
export function situacaoDaParcela(p, hoje) {
  if (p.pago_em) return "paga";
  if (p.vence_em < hoje) return "atrasada";
  return p.vence_em === hoje ? "hoje" : "aberta";
}
export const SITUACOES = {
  paga: { nome: "Recebido", tom: "sucesso" },
  atrasada: { nome: "Atrasada", tom: "perigo" },
  hoje: { nome: "Vence hoje", tom: "alerta" },
  aberta: { nome: "A vencer", tom: "" },
};

/** "vence em 3 dias", "vence hoje", "atrasada há 5 dias", "recebido em sáb, 31/10". */
export function textoDoVencimento(p, hoje, fuso) {
  if (p.pago_em) return `recebido em ${curta(p.pago_em, fuso)}`;
  const n = dias(hoje, p.vence_em);
  if (n === 0) return "vence hoje";
  if (n > 0) return n === 1 ? "vence amanhã" : n <= 30 ? `vence em ${n} dias` : `vence ${curta(p.vence_em, fuso)}`;
  return -n === 1 ? "atrasada desde ontem" : `atrasada há ${-n} dias`;
}

/** Os números do mês (o exemplo: recebido, falta receber, a receber nos próximos 30 dias, atrasadas). */
export function resumo(parcelas, hoje) {
  const mes = mesDe(hoje);
  const abertas = parcelas.filter(p => !p.pago_em);
  const atrasadas = abertas.filter(p => p.vence_em < hoje);
  const em30 = abertas.filter(p => p.vence_em >= hoje && p.vence_em <= somarDias(hoje, 30));
  return {
    recebidoNoMes: soma(parcelas.filter(p => p.pago_em && mesDe(p.pago_em) === mes)),
    faltaNoMes: soma(abertas.filter(p => mesDe(p.vence_em) === mes && p.vence_em >= hoje)),
    aReceber30: soma(em30), quantasEm30: em30.length,
    atrasadas: soma(atrasadas), quantasAtrasadas: atrasadas.length,
  };
}

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Os chips: a receber (as abertas, atrasadas primeiro), atrasadas, recebidas, todas. */
export function chipsDeParcelas(parcelas, hoje) {
  const abertas = parcelas.filter(p => !p.pago_em);
  return [
    { valor: "receber", rotulo: "A receber", quantos: abertas.length },
    { valor: "atrasadas", rotulo: "Atrasadas", quantos: abertas.filter(p => p.vence_em < hoje).length },
    { valor: "recebidas", rotulo: "Recebidas", quantos: parcelas.length - abertas.length },
    { valor: "todas", rotulo: "Todas", quantos: parcelas.length },
  ];
}

/** Filtra e ordena: a receber e atrasadas pelo vencimento; recebidas da mais recente; busca pelo cliente ou descrição. */
export function filtrarParcelas(parcelas, { grupo = "receber", busca = "", cliente = null, reserva = null, hoje }) {
  const termo = semAcento(busca).trim();
  let lista = parcelas.filter(p => (!cliente || p.cliente_id === cliente) && (!reserva || p.reserva_id === reserva));
  if (grupo === "receber") lista = lista.filter(p => !p.pago_em);
  if (grupo === "atrasadas") lista = lista.filter(p => !p.pago_em && p.vence_em < hoje);
  if (grupo === "recebidas") lista = lista.filter(p => p.pago_em);
  if (termo) lista = lista.filter(p => semAcento(p.clientes && p.clientes.nome).includes(termo) || semAcento(p.descricao).includes(termo));
  return lista.sort((a, b) => (grupo === "recebidas" ? String(b.pago_em).localeCompare(String(a.pago_em)) : a.vence_em.localeCompare(b.vence_em)));
}

/**
 * "Lançar parcelas" (05): o sinal (se houver) e o resto em `vezes` iguais, mês a mês a partir de `primeira`. O que
 * sobra de centavos vai na última. `total` já com o desconto tirado. Devolve as linhas (descrição, valor, vence_em).
 */
export function planoDeParcelas({ total, sinal = 0, vezes = 1, primeira, vencimentoDoSinal }) {
  const centavos = v => Math.round(Number(v || 0) * 100);
  const totalC = centavos(total), sinalC = Math.min(centavos(sinal), totalC);
  const restoC = totalC - sinalC;
  const n = Math.max(1, Math.min(48, Math.floor(Number(vezes) || 1)));
  const linhas = [];
  if (sinalC > 0) linhas.push({ descricao: "Sinal", valor: sinalC / 100, vence_em: vencimentoDoSinal || primeira });
  if (restoC > 0) {
    const cada = Math.floor(restoC / n);
    for (let i = 0; i < n; i++) {
      const [a, m, d] = primeira.split("-").map(Number);
      const mes = new Date(Date.UTC(a, m - 1 + i + (sinalC > 0 && !vencimentoDoSinal ? 1 : 0), 1));
      const ultimoDia = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 0)).getUTCDate();
      const vence = `${mes.getUTCFullYear()}-${String(mes.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, ultimoDia)).padStart(2, "0")}`;
      const valor = i === n - 1 ? restoC - cada * (n - 1) : cada;
      linhas.push({ descricao: n === 1 ? "Restante" : `Parcela ${i + 1}/${n}`, valor: valor / 100, vence_em: vence });
    }
  }
  return linhas;
}

/** O lembrete (09: WhatsApp num toque para lembrete e cobrança), sem cobrar: avisa o que vence ou venceu. */
export function mensagemDeLembrete(p, { conta, nicho, hoje, fuso }) {
  const primeiro = String((p.clientes && p.clientes.nome) || "").trim().split(/\s+/)[0];
  const quando = p.vence_em < hoje ? `que venceu em ${curta(p.vence_em, fuso)}` : p.vence_em === hoje ? "que vence hoje" : `que vence em ${curta(p.vence_em, fuso)}`;
  return `Oi${primeiro ? `, ${primeiro}` : ""}! Aqui é ${doNegocio(conta && conta.nome, nicho)}. Passando para lembrar da parcela de ${moeda(p.valor)} (${p.descricao}) ${quando}. Se já pagou, é só me mandar o comprovante. Obrigado!`;
}

/** Mês a mês (o exemplo: o que entrou em cada mês e o que está previsto): de `antes` meses atrás até `depois` à frente. */
export function mesAMes(parcelas, hoje, { antes = 5, depois = 2 } = {}) {
  const [a, m] = hoje.split("-").map(Number);
  return Array.from({ length: antes + 1 + depois }, (_, i) => {
    const x = new Date(Date.UTC(a, m - 1 - antes + i, 1));
    const mes = `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      mes, atual: mes === mesDe(hoje), futuro: mes > mesDe(hoje),
      recebido: soma(parcelas.filter(p => p.pago_em && mesDe(p.pago_em) === mes)),
      previsto: soma(parcelas.filter(p => !p.pago_em && mesDe(p.vence_em) === mes)),
    };
  });
}

/**
 * O que mais vende (02): pelo tipo de festa ou ensaio, quantas reservas fechadas e o total (reservas_valores). O banco
 * entrega reservas_valores como lista (a chave estrangeira é composta, conta_id + reserva_id); aceita lista ou objeto.
 */
export function maisVendidos(reservas) {
  const grupos = new Map();
  for (const r of reservas) {
    const v = Array.isArray(r.reservas_valores) ? r.reservas_valores[0] : r.reservas_valores;
    if (r.situacao === "cancelada" || !v) continue;
    const nome = (r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome) || "Sem tipo";
    const g = grupos.get(nome) || { nome, n: 0, total: 0 };
    g.n += 1;
    g.total = Math.round((g.total + Number(v.valor_total || 0) - Number(v.desconto || 0)) * 100) / 100;
    grupos.set(nome, g);
  }
  return [...grupos.values()].sort((x, y) => y.total - x.total);
}
