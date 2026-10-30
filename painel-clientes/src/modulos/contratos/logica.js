// Contratos (Missão 3, bloco E): as regras sem tela, testadas em test/contratos.test.mjs. O texto é do cliente da
// Renderiza (02): o painel só troca os campos ({cliente}, {data}…) pelos dados da festa ou do ensaio, congela o
// texto e manda o link (/c/<código>). O aceite é gravado pelo banco, na página do link.

import { dataLonga, dataNumerica, hora, moeda, haQuanto } from "../../ui/formatos.js";
import { doNegocio } from "../../nichos/index.js";

export const SITUACOES = {
  orcamento: { nome: "Orçamento", tom: "" },
  enviado: { nome: "Esperando o aceite", tom: "alerta" },
  aceito: { nome: "Aceito", tom: "sucesso" },
  cancelado: { nome: "Cancelado", tom: "" },
};

/** Os campos que um modelo pode ter (05: {cliente}, {data}, {pacote}, {valor}; e os que ajudam no dia a dia). */
export const CAMPOS = [
  { id: "cliente", nome: "Nome do cliente" },
  { id: "data", nome: "Data (31/10/2026)" },
  { id: "data_extenso", nome: "Data por extenso" },
  { id: "horario", nome: "Horário (19h às 3h)" },
  { id: "tipo", nome: "Tipo (festa ou ensaio)" },
  { id: "pacote", nome: "Pacote ou ensaio" },
  { id: "convidados", nome: "Convidados" },
  { id: "adicionais", nome: "Adicionais" },
  { id: "valor", nome: "Valor total" },
  { id: "sinal", nome: "Sinal" },
  { id: "desconto", nome: "Desconto" },
  { id: "endereco", nome: "Endereço do cliente" },
  { id: "cpf", nome: "CPF do cliente" },
  { id: "negocio", nome: "Nome do seu negócio" },
  { id: "hoje", nome: "Data de hoje" },
];
const IDS = new Set(CAMPOS.map(c => c.id));

/** Os valores dos campos para uma reserva (o que não tiver, fica de fora e o campo aparece como "falta"). */
export function valoresDosCampos({ reserva = null, valores = null, cliente = null, ficha = null, adicionais = [], conta = null, fuso, agora = new Date() }) {
  const v = {};
  const por = (k, x) => { if (x !== null && x !== undefined && String(x).trim() !== "") v[k] = String(x); };
  por("cliente", cliente && cliente.nome);
  if (reserva) {
    const ini = new Date(reserva.inicio);
    por("data", dataNumerica(ini, fuso));
    por("data_extenso", dataLonga(ini, fuso));
    por("horario", reserva.fim ? `${hora(ini, fuso)} às ${hora(new Date(reserva.fim), fuso)}` : hora(ini, fuso));
    por("tipo", (reserva.tipos_reserva && reserva.tipos_reserva.nome) || (reserva.servicos && reserva.servicos.nome));
    por("pacote", reserva.servicos && reserva.servicos.nome);
    por("convidados", reserva.convidados);
  }
  if (adicionais.length) por("adicionais", adicionais.join(", "));
  if (valores && valores.valor_total !== null && valores.valor_total !== undefined) {
    por("valor", moeda(Number(valores.valor_total) - Number(valores.desconto || 0), { centavos: true }));
    if (Number(valores.sinal) > 0) por("sinal", moeda(Number(valores.sinal), { centavos: true }));
    if (Number(valores.desconto) > 0) por("desconto", moeda(Number(valores.desconto), { centavos: true }));
  }
  por("endereco", ficha && ficha.endereco);
  por("cpf", ficha && ficha.cpf);
  por("negocio", conta && conta.nome);
  por("hoje", dataNumerica(agora, fuso));
  return v;
}

/**
 * Troca os campos do modelo pelos valores. Devolve o texto e os campos que ficaram sem valor (continuam escritos
 * como {campo}, para a pessoa ver e completar). Chaves desconhecidas ({qualquer}) ficam como estão.
 */
export function preencherModelo(texto, valores) {
  const faltando = new Set();
  const final = String(texto || "").replace(/\{([a-z_]+)\}/g, (inteiro, id) => {
    if (!IDS.has(id)) return inteiro;
    if (valores[id] !== undefined) return valores[id];
    faltando.add(id);
    return inteiro;
  });
  return { texto: final, faltando: [...faltando] };
}

/** Os campos conhecidos que ainda estão no texto ({sinal} sem valor): o contrato não sai assim. */
export const camposNoTexto = texto => [...new Set([...String(texto || "").matchAll(/\{([a-z_]+)\}/g)].map(m => m[1]).filter(id => IDS.has(id)))];

/** O link do aceite (04: /c/<código>), no endereço do próprio painel. */
export const linkDoContrato = (origem, codigo) => `${String(origem || "").replace(/\/$/, "")}/c/${codigo}`;

const primeiroNome = c => String((c && c.nome) || "").trim().split(/\s+/)[0];

/** A mensagem que leva o link (o painel não manda sozinho: abre o WhatsApp de quem está usando). */
export function mensagemDoContrato(contrato, { conta, nicho, link }) {
  const nome = primeiroNome(contrato.clientes);
  return `Oi${nome ? `, ${nome}` : ""}! Aqui é ${doNegocio(conta && conta.nome, nicho)}. Segue o contrato ${nicho.id === "eventos" ? "da sua festa" : "do seu ensaio"} para você ler e aceitar pelo celular: ${link}`;
}

/** "Lembrar do aceite" (o exemplo): o mesmo link, com um lembrete curto. */
export function mensagemDeLembrete(contrato, { conta, nicho, link }) {
  const nome = primeiroNome(contrato.clientes);
  return `Oi${nome ? `, ${nome}` : ""}! Aqui é ${doNegocio(conta && conta.nome, nicho)}. Passando para lembrar do contrato ${nicho.id === "eventos" ? "da sua festa" : "do seu ensaio"}: é só abrir, ler e aceitar pelo celular. ${link}`;
}

/** "Esperando o aceite há 3 dias" (o exemplo), a partir de quando foi enviado. */
export function esperandoHa(contrato, agora = Date.now()) {
  if (contrato.situacao !== "enviado" || !contrato.enviado_em) return "";
  return `Esperando o aceite ${haQuanto(contrato.enviado_em, agora)}`;
}

/** As festas ou ensaios que ainda não têm contrato (nem orçamento): futuros e não cancelados. */
export function semContrato(reservas, contratos, agora = Date.now()) {
  const com = new Set(contratos.filter(c => c.situacao !== "cancelado" && c.reserva_id).map(c => c.reserva_id));
  return reservas
    .filter(r => r.situacao !== "cancelada" && Date.parse(r.fim) >= agora && !com.has(r.id))
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}

const semAcento = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Os chips: esperando o aceite, orçamento, sem contrato, aceitos e cancelados, com quantos. */
export function chipsDeContratos(contratos, pendentes) {
  const n = s => contratos.filter(c => c.situacao === s).length;
  return [
    { valor: "enviado", rotulo: "Esperando o aceite", quantos: n("enviado") },
    { valor: "orcamento", rotulo: "Orçamento", quantos: n("orcamento") },
    { valor: "sem", rotulo: "Sem contrato", quantos: pendentes.length },
    { valor: "aceito", rotulo: "Aceitos", quantos: n("aceito") },
    { valor: "cancelado", rotulo: "Cancelados", quantos: n("cancelado") },
  ];
}

/** O chip que abre primeiro: o que pede ação (esperando o aceite, orçamento, sem contrato) ou os aceitos. */
export function grupoInicial(contratos, pendentes) {
  if (contratos.some(c => c.situacao === "enviado")) return "enviado";
  if (contratos.some(c => c.situacao === "orcamento")) return "orcamento";
  return pendentes.length ? "sem" : "aceito";
}

/**
 * Filtra pela situação e pela busca (o cliente). Esperando o aceite: o mais antigo primeiro (quem espera mais);
 * aceitos: a festa mais perto primeiro, as que já passaram no fim; o resto, o mais novo primeiro.
 */
export function filtrarContratos(contratos, { grupo = "enviado", busca = "", agora = Date.now() } = {}) {
  const termo = semAcento(busca).trim();
  const lista = contratos.filter(c => c.situacao === grupo && (!termo || semAcento(c.clientes && c.clientes.nome).includes(termo)));
  const inicio = c => (c.reservas ? Date.parse(c.reservas.inicio) : Infinity);
  if (grupo === "enviado") return lista.sort((a, b) => Date.parse(a.enviado_em || a.criado_em) - Date.parse(b.enviado_em || b.criado_em));
  if (grupo === "aceito") {
    return lista.sort((a, b) => {
      const fa = inicio(a) < agora, fb = inicio(b) < agora;
      if (fa !== fb) return fa ? 1 : -1;
      return fa ? inicio(b) - inicio(a) : inicio(a) - inicio(b);
    });
  }
  return lista.sort((a, b) => Date.parse(b.atualizado_em || b.criado_em) - Date.parse(a.atualizado_em || a.criado_em));
}
