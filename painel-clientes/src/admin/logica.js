// O Admin (Missão 5A): as regras sem tela, testadas em test/admin.test.mjs. Como a conta nasce e vive (02): teste
// de 7 dias, aprovar (com ou sem prazo), desligar, religar; a mensalidade por Pix, registrada à mão; só números nos
// indicadores. Quem pode o quê continua sendo o banco (equipe_renderiza e a RLS).

import { dataNumerica, dia, somarDias, moeda, haQuanto, instanteNoFuso } from "../ui/formatos.js";

/** O plano (02): R$ 49 com 2 módulos; cada módulo a mais pelo preço dele (modulos.preco). */
export const PLANO = { valor: 49, modulosInclusos: 2 };

export const SITUACOES = {
  teste: { nome: "Em teste", tom: "destaque" },
  ativa: { nome: "Ativa", tom: "sucesso" },
  desligada: { nome: "Desligada", tom: "perigo" },
  cancelada: { nome: "Cancelada", tom: "" },
};

const diaDe = d => String(d || "").slice(0, 10);
const dataDe = d => dataNumerica(instanteNoFuso(diaDe(d), "12:00"));

/** Como está a conta, em palavras: a situação e o prazo ("teste até 05/11, 3 dias", "prazo venceu 01/10"). */
export function estadoDaConta(c, agora = new Date()) {
  const s = SITUACOES[c.situacao] || { nome: c.situacao, tom: "" };
  const hoje = dia(agora);
  if (c.situacao === "teste") {
    const fim = new Date(c.teste_ate);
    const dias = Math.ceil((fim.getTime() - agora.getTime()) / 864e5);
    return dias > 0
      ? { ...s, sub: `teste até ${dataNumerica(fim)} (${dias === 1 ? "último dia" : `${dias} dias`})`, liberada: true }
      : { ...s, nome: "Teste acabou", tom: "alerta", sub: `o teste acabou em ${dataNumerica(fim)}`, liberada: false };
  }
  if (c.situacao === "ativa") {
    if (!c.ativa_ate) return { ...s, sub: "sem prazo", liberada: true };
    return diaDe(c.ativa_ate) >= hoje
      ? { ...s, sub: `até ${dataDe(c.ativa_ate)}`, liberada: true }
      : { ...s, nome: "Prazo venceu", tom: "alerta", sub: `o prazo venceu em ${dataDe(c.ativa_ate)}`, liberada: false };
  }
  return { ...s, sub: "", liberada: false };
}

/** Os chips: para aprovar (cadastro em teste), em teste, ativas, desligadas e todas. */
export function chipsDeContas(contas) {
  const n = g => contas.filter(c => grupoDaConta(c) === g).length;
  return [
    { valor: "aprovar", rotulo: "Para aprovar", quantos: n("aprovar") },
    { valor: "ativas", rotulo: "Ativas", quantos: n("ativas") },
    { valor: "teste", rotulo: "Em teste", quantos: n("teste") },
    { valor: "desligadas", rotulo: "Desligadas", quantos: n("desligadas") },
    { valor: "todas", rotulo: "Todas", quantos: contas.length },
  ];
}
export function grupoDaConta(c) {
  if (c.situacao === "teste") return c.origem === "cadastro" ? "aprovar" : "teste";
  if (c.situacao === "ativa") return "ativas";
  return "desligadas";
}

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtra pelo grupo e pela busca (nome, código ou e-mail do dono); as mais novas primeiro. */
export function filtrarContas(contas, { grupo = "todas", busca = "" } = {}) {
  const termo = semAcento(busca).trim();
  return contas
    .filter(c => grupo === "todas" || grupoDaConta(c) === grupo)
    .filter(c => !termo || semAcento(c.nome).includes(termo) || semAcento(c.codigo).includes(termo) || (c.donos || []).some(d => semAcento(d.email).includes(termo) || semAcento(d.nome).includes(termo)))
    .sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)));
}

/** O código público da conta, a partir do nome (contas.codigo: letras minúsculas, números e hífen, 3 a 40). */
export function codigoDoNome(nome) {
  const base = semAcento(nome).replace(/&/g, " e ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return base.length >= 3 ? base : (base + "-conta").replace(/^-/, "");
}
export const codigoValido = c => /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(String(c || ""));

/** O valor sugerido da mensalidade: o plano com 2 módulos e cada um a mais pelo preço dele (os mais caros entram no plano). */
export function mensalidadeSugerida(modulosLigados, catalogo) {
  const precos = modulosLigados.map(id => Number((catalogo.find(m => m.id === id) || {}).preco || 0)).sort((a, b) => b - a);
  const extra = precos.slice(PLANO.modulosInclusos).reduce((t, p) => t + p, 0);
  return Math.round((PLANO.valor + extra) * 100) / 100;
}

/** O primeiro dia do mês ("2026-10-01") de um dia "aaaa-mm-dd", e o mês a mais ou a menos. */
export const mesDe = d => `${String(d).slice(0, 7)}-01`;
export function somarMeses(mes, n) {
  const [a, m] = mes.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const nomeDoMes = mes => `${MESES[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`;

/**
 * Os pagamentos do mês: cada conta que paga (ativa, ou desligada que pagou no mês), com o que pagou e se falta.
 * Contas em teste não pagam ainda.
 */
export function pagamentosDoMes(contas, pagamentos, mes) {
  return contas
    .filter(c => c.situacao === "ativa" || pagamentos.some(p => p.conta_id === c.id && p.mes === mes))
    .map(c => {
      const doMes = pagamentos.filter(p => p.conta_id === c.id && p.mes === mes);
      return { conta: c, pagamentos: doMes, pago: Math.round(doMes.reduce((t, p) => t + Number(p.valor), 0) * 100) / 100 };
    })
    .sort((a, b) => (a.pago > 0) - (b.pago > 0) || semAcento(a.conta.nome).localeCompare(semAcento(b.conta.nome)));
}

/** "há 5 min" ou "nunca entrou", pelo último acesso (entradas) ou o "visto em" das pessoas. */
export function ultimoAcesso(datas, agora = Date.now()) {
  const d = datas.filter(Boolean).sort().at(-1);
  return d ? haQuanto(new Date(d), agora) : "nunca entrou";
}

/** Usando agora: visto nos últimos 15 minutos. */
export const usandoAgora = (vistoEm, agora = Date.now()) => !!vistoEm && agora - Date.parse(vistoEm) < 15 * 60000;

/** O aparelho em poucas palavras, a partir do user-agent (sem guardar mais nada). */
export function aparelho(ua) {
  const t = String(ua || "");
  if (!t) return "";
  const so = /iPhone|iPad/.test(t) ? "iPhone" : /Android/.test(t) ? "Android" : /Windows/.test(t) ? "Windows" : /Mac OS X|Macintosh/.test(t) ? "Mac" : /Linux/.test(t) ? "Linux" : "";
  const nav = /Edg\//.test(t) ? "Edge" : /Chrome\//.test(t) ? "Chrome" : /Firefox\//.test(t) ? "Firefox" : /Safari\//.test(t) ? "Safari" : "";
  return [nav, so].filter(Boolean).join(" no ") || "outro";
}

/** Os prazos que o Admin oferece ao aprovar ou dar prazo: sem prazo, 30, 90 e 365 dias, ou uma data. */
export function prazoAte(opcao, hoje) {
  if (!opcao || opcao === "sem") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(opcao)) return opcao;
  return somarDias(hoje, Number(opcao));
}

export { moeda };
