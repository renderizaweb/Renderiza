// As palavras do painel mudam pelo nicho da conta (espaço/festa; estúdio/ensaio), sempre por configuração e nunca
// por cópia de código (04, princípio 7). Um nicho novo é um arquivo novo aqui, com as mesmas chaves.

import eventos from "./eventos.js";
import fotografia from "./fotografia.js";

export const NICHOS = { eventos, fotografia };

/** O nicho pelo id (o da conta); sem conta ainda, o de eventos. */
export function nicho(id) {
  return NICHOS[id] || eventos;
}

/** O nome do módulo no menu, já no jeito do nicho ("Clientes e entregas" na fotografia). */
export function nomeDoModulo(idNicho, modulo, nomePadrao) {
  const m = nicho(idNicho).modulos[modulo];
  return (m && m.nome) || nomePadrao;
}

const semAcento = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * O nome do negócio com a preposição certa, sem adivinhar o gênero do nome: pela palavra do nicho ("espaço",
 * "estúdio", ambas masculinas). "do espaço Villa Alecrim", "no Estúdio Ciranda" (o nome já começa com a palavra).
 */
export function doNegocio(nomeDaConta, n, preposicao = "do") {
  const nome = String(nomeDaConta || "").trim();
  const palavra = n.palavras.conta;
  if (!nome) return `${preposicao} ${palavra}`;
  return semAcento(nome).startsWith(semAcento(palavra)) ? `${preposicao} ${nome}` : `${preposicao} ${palavra} ${nome}`;
}
