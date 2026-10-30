// Início (Missão 3, bloco F): as regras sem tela, testadas em test/inicio.test.mjs. "Para fazer agora" (09): o que
// pede ação, o mais urgente primeiro, cada item com o próximo passo; os números de cada módulo, compactos; "O que a
// equipe fez" em frases (as atividades que o banco grava sozinho; 05). Só entra o que veio do banco: cada um vê o que
// pode (RLS), e quem chama já não busca o módulo que a pessoa não vê.

import { dia, hora, haQuanto, somarDias, moeda, dataCurta, instanteNoFuso } from "../../ui/formatos.js";
import { ETAPA, ORIGEM } from "../atendimento/logica.js";

/** "Bom dia", "Boa tarde", "Boa noite" pela hora do lugar. */
export const saudacao = horaDoDia => (horaDoDia < 5 ? "Boa noite" : horaDoDia < 12 ? "Bom dia" : horaDoDia < 18 ? "Boa tarde" : "Boa noite");

const nomeDe = x => (x && x.clientes && x.clientes.nome) || "Cliente";
const daReserva = (r, nicho) => (r && ((r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome) || r.titulo)) || nicho.palavras.reserva;
// o título do compromisso já costuma trazer o nome ("Visita · Patrícia Gomes"): o cliente só entra se não estiver lá
const tituloDoCompromisso = c => {
  const t = c.titulo || { visita: "Visita", degustacao: "Degustação", reuniao: "Reunião" }[c.tipo] || "Compromisso";
  return c.clientes && c.clientes.nome && !t.includes(c.clientes.nome) ? `${t} · ${c.clientes.nome}` : t;
};
const diasEntre = (de, ate) => Math.round((Date.parse(ate + "T12:00:00Z") - Date.parse(de + "T12:00:00Z")) / 864e5);

/**
 * "Para fazer agora": parcelas atrasadas, pedidos novos (o mais antigo primeiro), parcelas que vencem hoje ou
 * amanhã, contratos esperando o aceite, e o que tem hoje e amanhã na agenda. Cada item: { id, tipo, icone, titulo,
 * sub, tom, acao: { rotulo, tipo, id } | null, href }.
 */
export function paraFazerAgora({ pedidos = [], parcelas = [], contratos = [], reservas = [], compromissos = [] }, { hoje, fuso, agora = Date.now(), nicho }) {
  const itens = [];
  const amanha = somarDias(hoje, 1);
  const abertas = parcelas.filter(p => !p.pago_em);
  for (const p of abertas.filter(p => p.vence_em < hoje).sort((a, b) => a.vence_em.localeCompare(b.vence_em))) {
    const n = diasEntre(p.vence_em, hoje);
    itens.push({ id: `parcela-${p.id}`, tipo: "parcela", icone: "carteira", tom: "perigo", titulo: `${nomeDe(p)} · ${moeda(p.valor)}`, nome: nomeDe(p), valor: moeda(p.valor),
      sub: `${p.descricao} · atrasada ${n === 1 ? "desde ontem" : `há ${n} dias`}`, acao: { rotulo: "Recebi", tipo: "recebi", id: p.id }, href: `/financeiro?parcela=${p.id}` });
  }
  for (const p of pedidos.filter(p => p.etapa === "novo").sort((a, b) => Date.parse(a.criado_em) - Date.parse(b.criado_em))) {
    const origem = ORIGEM[p.origem] && ORIGEM[p.origem].por;
    itens.push({ id: `pedido-${p.id}`, tipo: "pedido", icone: "conversa", tom: "destaque", titulo: `Pedido de ${nomeDe(p)}`,
      sub: [`chegou ${haQuanto(new Date(p.criado_em), agora)}`, origem, p.data_desejada ? `para ${dataCurta(instanteNoFuso(p.data_desejada, "12:00", fuso), fuso)}` : ""].filter(Boolean).join(" · "),
      acao: { rotulo: "Responder", tipo: "abrir", id: p.id }, href: `/atendimento?pedido=${p.id}` });
  }
  for (const p of abertas.filter(p => p.vence_em === hoje || p.vence_em === amanha).sort((a, b) => a.vence_em.localeCompare(b.vence_em))) {
    itens.push({ id: `parcela-${p.id}`, tipo: "parcela", icone: "carteira", tom: "alerta", titulo: `${nomeDe(p)} · ${moeda(p.valor)}`, nome: nomeDe(p), valor: moeda(p.valor),
      sub: `${p.descricao} · vence ${p.vence_em === hoje ? "hoje" : "amanhã"}`, acao: { rotulo: "Recebi", tipo: "recebi", id: p.id }, href: `/financeiro?parcela=${p.id}` });
  }
  for (const c of contratos.filter(c => c.situacao === "enviado").sort((a, b) => Date.parse(a.enviado_em || a.criado_em) - Date.parse(b.enviado_em || b.criado_em))) {
    itens.push({ id: `contrato-${c.id}`, tipo: "contrato", icone: "contrato", tom: "alerta", titulo: `Contrato de ${nomeDe(c)}`,
      sub: `esperando o aceite ${haQuanto(new Date(c.enviado_em || c.criado_em), agora)}`, acao: { rotulo: "Lembrar", tipo: "lembrar", id: c.id }, href: `/contratos?contrato=${c.id}` });
  }
  const daAgenda = [
    ...reservas.filter(r => r.situacao !== "cancelada").map(r => ({ quando: r.inicio, id: `reserva-${r.id}`, icone: "agenda",
      titulo: `${daReserva(r, nicho).replace(/^./, l => l.toUpperCase())} · ${nomeDe(r)}`, href: `/agenda?reserva=${r.id}`, pre: r.situacao === "pre_reserva" })),
    ...compromissos.map(c => ({ quando: c.inicio, id: `compromisso-${c.id}`, icone: "relogio",
      titulo: tituloDoCompromisso(c), href: `/agenda?dia=${dia(new Date(c.inicio), fuso)}` })),
  ].filter(x => [hoje, amanha].includes(dia(new Date(x.quando), fuso))).sort((a, b) => Date.parse(a.quando) - Date.parse(b.quando));
  for (const x of daAgenda) {
    const d = dia(new Date(x.quando), fuso);
    itens.push({ id: x.id, tipo: "agenda", icone: x.icone, tom: d === hoje ? "sucesso" : "", titulo: x.titulo,
      sub: `${d === hoje ? "Hoje" : "Amanhã"}, ${hora(new Date(x.quando), fuso)}${x.pre ? " · pré-reserva" : ""}`, acao: { rotulo: "Ver", tipo: "ir", id: null }, href: x.href });
  }
  return itens;
}

/**
 * Os números de cada módulo que a pessoa vê (o exemplo: 4 cartões; 09: compactos, depois do "Para fazer agora").
 * `pode(modulo)` diz se a pessoa vê o módulo. Cada número: { id, rotulo, valor, sub, href }.
 */
export function numeros({ reservasDoMes = [], pedidosDaSemana = [], resumoFinanceiro = null, contratos = [] }, { hoje, fuso, agora = Date.now(), nicho, pode }) {
  const lista = [];
  if (pode("agenda")) {
    const ativas = reservasDoMes.filter(r => r.situacao !== "cancelada");
    const passaram = ativas.filter(r => Date.parse(r.inicio) < agora).length;
    lista.push({ id: "agenda", rotulo: `${nicho.palavras.reservas.replace(/^./, l => l.toUpperCase())} no mês`, valor: String(ativas.length),
      sub: `${passaram} ${passaram === 1 ? "já foi" : "já foram"} · ${ativas.length - passaram} pela frente`, href: "/agenda" });
  }
  if (pode("financeiro") && resumoFinanceiro) {
    lista.push({ id: "recebido", rotulo: "Recebido no mês", valor: moeda(resumoFinanceiro.recebidoNoMes), sub: `falta ${moeda(resumoFinanceiro.faltaNoMes)} no mês`, href: "/financeiro" });
    lista.push({ id: "receber", rotulo: "A receber em 30 dias", valor: moeda(resumoFinanceiro.aReceber30),
      sub: resumoFinanceiro.quantasAtrasadas ? `${resumoFinanceiro.quantasAtrasadas} ${resumoFinanceiro.quantasAtrasadas === 1 ? "atrasada" : "atrasadas"}` : "nenhuma atrasada", href: "/financeiro" });
  }
  if (pode("atendimento")) {
    const novos = pedidosDaSemana.filter(p => p.etapa === "novo").length;
    lista.push({ id: "pedidos", rotulo: "Pedidos na semana", valor: String(pedidosDaSemana.length), sub: `${novos} ${novos === 1 ? "esperando resposta" : "esperando resposta"}`, href: "/atendimento" });
  }
  if (pode("contratos")) {
    const esperando = contratos.filter(c => c.situacao === "enviado").length;
    const mes = hoje.slice(0, 7);
    const aceitos = contratos.filter(c => c.situacao === "aceito" && c.aceito_em && dia(new Date(c.aceito_em), fuso).slice(0, 7) === mes).length;
    lista.push({ id: "contratos", rotulo: "Contratos esperando aceite", valor: String(esperando), sub: `${aceitos} ${aceitos === 1 ? "aceito" : "aceitos"} no mês`, href: "/contratos" });
  }
  return lista.slice(0, 4);
}

/**
 * Como está cada uma das próximas (o exemplo, "Próximos eventos"; Missão 7, bloco A): a etiqueta e o quanto já foi
 * pago. Usa o que vier junto da reserva (contratos, parcelas, reservas_valores), que só vem para quem vê Contratos ou
 * Financeiro. Devolve { etiqueta: { texto, tom } | null, pago: "86% pago" | "" }.
 */
export function comoEstaAProxima(r) {
  const lista = v => (Array.isArray(v) ? v : v ? [v] : []);
  const valores = lista(r.reservas_valores)[0];
  const total = valores ? Number(valores.valor_total || 0) - Number(valores.desconto || 0) : 0;
  const pagas = lista(r.parcelas).filter(p => p.pago_em).reduce((s, p) => s + Number(p.valor || 0), 0);
  const pct = total > 0 ? Math.min(100, Math.floor((pagas / total) * 100)) : null;
  const contratos = lista(r.contratos).map(c => c.situacao);
  let etiqueta = null;
  if (pct === 100) etiqueta = { texto: "Quitado", tom: "sucesso" };
  else if (contratos.includes("aceito")) etiqueta = { texto: "Contrato aceito", tom: "sucesso" };
  else if (contratos.includes("enviado")) etiqueta = { texto: "Esperando o aceite", tom: "alerta" };
  else if (r.situacao === "pre_reserva") etiqueta = { texto: "Pré-reserva", tom: "info" };
  return { etiqueta, pago: pct != null && pct < 100 ? `${pct}% pago` : "" };
}

const primeiro = nome => String(nome || "").trim().split(/\s+/)[0];

/**
 * Uma atividade em frase ("O que a equipe fez"): { quem, texto }. `quem`: o primeiro nome de quem fez, "Suporte da
 * Renderiza" ou "" (o sistema, a agenda online, o link do contrato). O texto não leva valores (o histórico não
 * guarda; 05), só o que aconteceu e com quem.
 */
export function frase(a, { cliente = "", pessoa = "", nicho }) {
  const quem = a.pelo_suporte ? "Suporte da Renderiza" : primeiro(pessoa);
  const de = cliente ? ` de ${cliente}` : "";
  const com = cliente ? ` com ${cliente}` : "";
  const r = nicho.palavras.reserva;
  const aR = nicho.id === "eventos" ? `a ${r}` : `o ${r}`;
  const d = a.detalhe || {};
  const para = k => (Array.isArray(d[k]) ? d[k][1] : undefined);
  const T = {
    pedidos: () => a.acao === "criou" ? (quem ? `anotou o pedido${de}` : `chegou um pedido${de}`)
      : a.acao === "apagou" ? `apagou o pedido${de}`
      : para("etapa") ? `passou${cliente ? ` ${cliente}` : " um pedido"} para ${((ETAPA[para("etapa")] || {}).nome || para("etapa")).toLowerCase()}` : `atualizou o pedido${de}`,
    reservas: () => a.acao === "criou" ? `reservou ${aR}${de}` : a.acao === "apagou" ? `apagou ${aR}${de}`
      : para("situacao") === "confirmada" ? `confirmou ${aR}${de}` : para("situacao") === "cancelada" ? `cancelou ${aR}${de}`
      : para("situacao") === "realizada" ? `marcou ${aR}${de} como feit${nicho.id === "eventos" ? "a" : "o"}` : `mudou ${aR}${de}`,
    compromissos: () => a.acao === "criou" ? `marcou um compromisso${com}` : a.acao === "apagou" ? `desmarcou um compromisso${com}` : `mudou um compromisso${com}`,
    parcelas: () => a.acao === "criou" ? `lançou uma parcela${de}` : a.acao === "apagou" ? `apagou uma parcela${de}`
      : d.pago === true ? `registrou um pagamento${de}` : d.pago === false ? `desfez um recebimento${de}` : `mudou uma parcela${de}`,
    reservas_valores: () => `pôs os valores d${nicho.id === "eventos" ? "a" : "o"} ${r}${de}`,
    contratos: () => a.acao === "criou" ? `fez o contrato${de}` : a.acao === "apagou" ? `apagou o contrato${de}`
      : para("situacao") === "enviado" ? `mandou o contrato${cliente ? ` para ${cliente}` : ""}`
      : para("situacao") === "aceito" ? (quem ? `registrou o aceite do contrato${de}` : `${cliente || "O cliente"} aceitou o contrato pelo link`)
      : para("situacao") === "cancelado" ? `cancelou o contrato${de}` : `mudou o contrato${de}`,
    clientes: () => a.acao === "criou" ? `cadastrou ${cliente || "um cliente"}` : a.acao === "apagou" ? `apagou ${cliente || "um cliente"}`
      : d.arquivado === true ? `arquivou ${cliente || "um cliente"}` : d.arquivado === false ? `tirou ${cliente || "um cliente"} do arquivo` : `atualizou o contato${de}`,
    clientes_fichas: () => `atualizou a ficha${de}`,
    reservas_checklist: () => para("feito") === true ? `marcou um item do checklist${de}` : `desmarcou um item do checklist${de}`,
    lista_espera: () => a.acao === "criou" ? `pôs ${cliente || "um cliente"} na lista de espera` : a.acao === "apagou" ? `tirou ${cliente || "um cliente"} da lista de espera` : `mudou a lista de espera`,
    entregas: () => para("situacao") === "entregue" ? `entregou as fotos${de}` : a.acao === "criou" ? `começou a entrega das fotos${de}` : `mudou a entrega das fotos${de}`,
  };
  let texto = (T[a.tabela] || (() => `mudou ${a.tabela}`))();
  // sem pessoa (a agenda online, o link do contrato, a semente, quem saiu da equipe): a frase começa maiúscula
  if (!quem) texto = texto.replace(/^./, l => l.toUpperCase());
  return { quem, texto };
}
