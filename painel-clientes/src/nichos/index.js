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

/**
 * O jeito da agenda online da conta (Configurações, contas.ajustes.agenda.modo; 18/11/2026): "horario" (a pessoa
 * escolhe o horário de início; os horários são começos, com a duração do ensaio, e há campanhas) ou "turno" (escolhe
 * o dia e o turno; os horários têm começo, fim e nome: manhã, tarde, noite). Sem escolha, o do nicho. A mesma regra do
 * banco (modo_da_agenda, migração 20261118200000), que decide o que o site recebe.
 */
export const MODOS_DA_AGENDA = ["horario", "turno"];
export function modoDaAgenda(conta, n = nicho(conta && conta.nicho)) {
  const m = conta && conta.ajustes && conta.ajustes.agenda && conta.ajustes.agenda.modo;
  return MODOS_DA_AGENDA.includes(m) ? m : n.agendaPadrao;
}

/**
 * A agenda online está ligada no site? (contas.ajustes.agenda.site, 20/11/2026: as contas novas nascem com false, e a
 * dona liga em Configurações quando conferir os horários; sem o valor, ligada, como sempre.) Desligada, o site manda
 * consultar a data pelo WhatsApp. A mesma regra do banco (conta_do_site, migração 20261120190000).
 */
export const agendaNoSite = conta => !(conta && conta.ajustes && conta.ajustes.agenda && conta.ajustes.agenda.site === false);

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
