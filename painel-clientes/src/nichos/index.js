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
