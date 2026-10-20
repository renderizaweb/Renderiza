// Contas da tela Indicadores: onde focar (nicho e perfil de quem se interessa), o funil de cada ciclo e de cada
// nicho, do primeiro contato à venda. Sem tela (com testes em test/indicadores.test.mjs).
//
// "Respondeu" é uma pessoa ter respondido: resposta registrada (mensagem automática não conta: vira anotação),
// interesse avaliado, passagem por Em negociação ou perda com um motivo que só quem respondeu daria ("já tenho
// site", "sem interesse"). Perda "sem retorno", Sem resposta e Encerrado contam como silêncio.
// "Mostrou interesse" é mais forte: o campo Interesse marcado (pediu o valor, perguntou como funciona…), estar em
// Em negociação agora ou ter fechado.

import { faseDaEtapa } from "./modelo.js";
import { cicloDoLead, cicloDoDia, INICIO_DOS_CICLOS } from "./tags.js";
import { itensDe } from "./checklist.js";
import { primeiroContato } from "./ritmo.js";
import { perfilDoLead, CORTES } from "./perfil.js";

export const SITUACOES = {
  venda: "Venda",
  interessado: "Interessado, em aberto",
  conversando: "Respondeu, em aberto",
  esfriou: "Respondeu e parou",
  nao: "Disse não",
  silencio: "Não respondeu",
  aguardando: "Aguardando",
};

// A ordem importa: "sem recursos para incluir no site" é verba, não site; "sem interesse nesse momento" é agora não.
const RE_SILENCIO = /sem retorno|sem resposta|n[aã]o respond/i;
export const MOTIVOS = [
  { id: "sem_verba", nome: "Sem verba ou sem material", re: /dinheiro|verba|recurso|caro|invest|or[cç]amento/i },
  { id: "ja_tem_site", nome: "Já tem site ou alguém fazendo", re: /site|dev\b|profissional|desenvolv|elabora/i },
  { id: "agora_nao", nome: "Agora não", re: /momento|ano que vem|pr[oó]ximo ano|janeiro|depois/i },
  { id: "sem_interesse", nome: "Sem interesse", re: /interesse/i },
];
export const OUTRO_MOTIVO = { id: "outro", nome: "Outro motivo" };

/** Categoria do motivo de perda, ou null quando a perda foi por silêncio. */
export function categoriaDoMotivo(texto) {
  const t = String(texto || "").trim();
  if (!t || RE_SILENCIO.test(t)) return null;
  return MOTIVOS.find(m => m.re.test(t)) || OUTRO_MOTIVO;
}

const passouPor = (lead, etapa) => (Array.isArray(lead.historico) ? lead.historico : []).some(x => x && x.para === etapa);
// Resultado só vale em Finalizado: card que voltou para Em andamento pode ter ficado com o resultado antigo.
const resultadoDe = lead => (lead.etapa === "finalizado" ? lead.resultado || null : null);

/** Pediu o valor, perguntou como funciona, está em negociação ou fechou. */
export const mostrouInteresse = lead =>
  ["interessado", "perto_de_fechar"].includes(lead.interesse) || lead.etapa === "em_negociacao" || resultadoDe(lead) === "ganho";

/** Ciclo do lead para os indicadores: 0 = antes dos ciclos (lista de agosto, data aproximada), null = sem contato. */
export function cicloDoContato(lead, lista = []) {
  const pc = primeiroContato(lista);
  const fase = faseDaEtapa(lead.etapa);
  const contatado = !!pc || fase === "em_andamento" || fase === "finalizado";
  if (!contatado) return null;
  if (pc && (pc.precisao !== "exata" || (pc.ocorreu_em && pc.ocorreu_em < INICIO_DOS_CICLOS))) return 0;
  return cicloDoLead(lead) || (pc && pc.ocorreu_em ? cicloDoDia(pc.ocorreu_em) : 0);
}

/** {contatado, ciclo, respondeu, interesse, situacao, motivo, diasAteResposta, cobrancas:{feitas,total}, primeiro} de um lead. */
export function analisar(lead, lista = []) {
  const ciclo = cicloDoContato(lead, lista);
  const pc = primeiroContato(lista);
  const itens = itensDe(lead).filter(i => /^cobranca_/.test(i.id));
  const cobrancas = { feitas: itens.filter(i => i.feito).length, total: itens.length };
  const base = { contatado: ciclo !== null, ciclo, primeiro: pc ? pc.ocorreu_em : null, cobrancas, motivo: null, diasAteResposta: null };
  if (ciclo === null) return { ...base, respondeu: false, interesse: false, situacao: null };

  const resultado = resultadoDe(lead);
  const motivo = resultado === "perda" ? categoriaDoMotivo(lead.motivo_perda) : null;
  const resposta = lista.find(i => i.tipo === "resposta");
  const negociou = lead.etapa === "em_negociacao" || passouPor(lead, "em_negociacao");
  const interesse = mostrouInteresse(lead);
  const respondeu = !!resposta || (lead.interesse && lead.interesse !== "nao_avaliado") || negociou || !!motivo || interesse;

  let situacao;
  if (resultado === "ganho") situacao = "venda";
  else if (motivo) situacao = "nao";
  else if (resultado) situacao = respondeu ? "esfriou" : "silencio"; // perda sem motivo, encerrado
  else if (lead.etapa === "sem_resposta") situacao = respondeu ? "esfriou" : "silencio";
  else situacao = interesse ? "interessado" : respondeu ? "conversando" : "aguardando";

  // Dias do primeiro contato até o primeiro sinal de resposta (resposta registrada ou mudança de etapa que a mostra).
  let diasAteResposta = null;
  if (respondeu && pc && pc.precisao === "exata" && pc.ocorreu_em) {
    const sinais = [];
    if (resposta && resposta.ocorreu_em) sinais.push(resposta.ocorreu_em);
    for (const x of Array.isArray(lead.historico) ? lead.historico : []) {
      if (x && x.em && (x.para === "em_negociacao" || (x.para === "finalizado" && motivo))) sinais.push(String(x.em).slice(0, 10));
    }
    const depois = sinais.filter(d => d >= pc.ocorreu_em).sort();
    if (depois.length) diasAteResposta = Math.round((Date.parse(depois[0]) - Date.parse(pc.ocorreu_em)) / 86400000);
  }
  return { ...base, respondeu, interesse, situacao, motivo, diasAteResposta };
}

const mediana = ns => {
  if (!ns.length) return null;
  const s = [...ns].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);

/** Números de um grupo de leads já analisados ([{lead, a}]). */
export function resumo(grupo) {
  const contatados = grupo.filter(x => x.a.contatado);
  const conta = s => contatados.filter(x => x.a.situacao === s).length;
  const respondeu = contatados.filter(x => x.a.respondeu).length;
  const aguardando = conta("aguardando");
  const motivos = {};
  for (const x of contatados) if (x.a.motivo) motivos[x.a.motivo.id] = (motivos[x.a.motivo.id] || 0) + 1;
  const comCobranca = contatados.filter(x => x.a.cobrancas.total > 0 && !x.a.respondeu);
  const interessados = contatados.filter(x => x.a.interesse).length;
  return {
    contatados: contatados.length,
    respondeu,
    interessados,
    vendas: conta("venda"),
    faturado: contatados.filter(x => x.a.situacao === "venda").reduce((s, x) => s + Number(x.lead.valor_fechado || 0), 0),
    nao: conta("nao"),
    silencio: conta("silencio"),
    esfriou: conta("esfriou"),
    interessadoAberto: conta("interessado"),
    conversando: conta("conversando"),
    aguardando,
    taxaResposta: pct(respondeu, contatados.length),
    taxaInteresse: pct(interessados, contatados.length),
    taxaNao: pct(conta("nao"), contatados.length),
    diasAteResposta: mediana(contatados.map(x => x.a.diasAteResposta).filter(n => n !== null)),
    motivos,
    semRespostaComCobranca: comCobranca.length,
    cobrancasFeitas: comCobranca.filter(x => x.a.cobrancas.feitas > 0).length,
  };
}

/** Tudo o que a tela mostra. `porLead` = Map(lead_id → interações em ordem), de ritmo.indexar. */
export function indicadores(leads, porLead, { nicho = "", hoje } = {}) {
  const todos = leads.map(lead => ({ lead, a: analisar(lead, porLead.get(lead.id) || []) }));
  const nichos = [...new Set(leads.map(l => (l.segmento || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const doNicho = nicho ? todos.filter(x => (x.lead.segmento || "").trim() === nicho) : todos;

  const ciclos = [...new Set(doNicho.filter(x => x.a.contatado).map(x => x.a.ciclo))].sort((a, b) => a - b);
  const porCiclo = ciclos.map(c => ({ ciclo: c, ...resumo(doNicho.filter(x => x.a.ciclo === c)) }));
  const porNicho = nichos.map(n => {
    const grupo = todos.filter(x => (x.lead.segmento || "").trim() === n);
    const r = resumo(grupo), demos = grupo.filter(x => x.lead.link_demo).length;
    return { nicho: n, ...r, demos, demosPorInteressado: r.interessados ? Math.round((10 * demos) / r.interessados) / 10 : null };
  });

  const producao = {
    demos: doNicho.filter(x => x.lead.link_demo).length,
    videos: doNicho.filter(x => x.lead.link_gravacao).length,
    flyers: doNicho.filter(x => x.lead.link_flyer).length,
    prontasSemEnvio: doNicho.filter(x => !x.a.contatado && x.lead.link_demo).length,
  };
  const perfil = porPerfil(doNicho);

  // Conversas quentes: responderam e seguem em aberto. Dias parados contam da última interação ou mudança.
  const ultimoMovimento = x => {
    const datas = [x.lead.atualizado_em, ...(porLead.get(x.lead.id) || []).map(i => i.ocorreu_em),
      ...(Array.isArray(x.lead.historico) ? x.lead.historico : []).map(h => h && h.em)].filter(Boolean).map(d => String(d).slice(0, 10));
    return datas.sort().pop() || null;
  };
  const quentes = doNicho.filter(x => x.a.situacao === "interessado").map(x => {
    const ultimo = ultimoMovimento(x);
    return { id: x.lead.id, empresa: x.lead.empresa, nicho: x.lead.segmento, interesse: x.lead.interesse, ultimo,
      diasParado: ultimo && hoje ? Math.max(0, Math.round((Date.parse(hoje) - Date.parse(ultimo)) / 86400000)) : null };
  }).sort((a, b) => (b.diasParado ?? -1) - (a.diasParado ?? -1));

  const interacoes = doNicho.flatMap(x => porLead.get(x.lead.id) || []);
  const qualidade = {
    respostasRegistradas: interacoes.filter(i => i.tipo === "resposta").length,
    retornosRegistrados: interacoes.filter(i => i.tipo === "retorno").length,
    interesseAvaliado: doNicho.filter(x => x.a.contatado && x.lead.interesse && x.lead.interesse !== "nao_avaliado").length,
  };

  const total = resumo(doNicho);
  const foco = ondeFocar(total, porNicho, perfil, { nicho });
  return { nichos, nicho, total, porCiclo, porNicho, producao, perfil, foco, quentes, qualidade, alertas: alertas(total, producao, quentes, qualidade) };
}

/* ---------- perfil de quem responde e de quem se interessa ---------- */

/** Faixa com menos contatos que isso não entra na leitura nem no perfil para focar (a tela mostra apagada). */
export const AMOSTRA_MINIMA = 8;

function taxas(grupo) {
  const n = grupo.length, respondeu = grupo.filter(x => x.a.respondeu).length, interessados = grupo.filter(x => x.a.interesse).length;
  const nao = grupo.filter(x => x.a.situacao === "nao").length;
  return { contatados: n, respondeu, interessados, nao, taxaResposta: pct(respondeu, n), taxaInteresse: pct(interessados, n), taxaNao: pct(nao, n) };
}

/** Cada corte de perfil.js (seguidores, avaliações, nota, região, quem atendeu…) com os números de cada faixa. */
export function porPerfil(grupo) {
  const contatados = grupo.filter(x => x.a.contatado).map(x => ({ ...x, p: perfilDoLead(x.lead) }));
  return CORTES.map(c => ({
    id: c.id, nome: c.nome, fonte: c.fonte,
    faixas: c.faixas.map(f => ({ id: f.id, nome: f.nome, semPessoa: !!f.semPessoa, ...taxas(contatados.filter(x => f.cabe(x.p))) })),
    semDado: contatados.filter(x => !c.faixas.some(f => f.cabe(x.p))).length,
  }));
}

const melhorPorInteresse = (a, b) => b.taxaInteresse - a.taxaInteresse || b.contatados - a.contatados;
const deTantos = g => `${g.interessados} de ${g.contatados}`;

/**
 * Onde focar: frases curtas com o nicho e as faixas que mais viraram interesse, e o perfil para focar (a melhor
 * faixa de cada corte, quando ela tem amostra e fica acima da média). Só o que os números sustentam.
 */
export function ondeFocar(total, porNicho, perfil, { nicho = "" } = {}) {
  const frases = [];
  const nichos = porNicho.filter(g => g.contatados >= 5).sort(melhorPorInteresse);
  if (!nicho && nichos.length >= 2) {
    const [primeiro] = nichos;
    const maisResponde = [...nichos].sort((a, b) => b.taxaResposta - a.taxaResposta)[0];
    frases.push({ tom: "foco", texto: `Interesse por contato, por nicho: ${nichos.map(g => `${g.nicho} ${g.taxaInteresse}% (${deTantos(g)})`).join(", ")}.` +
      (primeiro.contatados < 10 ? ` ${primeiro.nicho} lidera com poucos contatos: vale abrir mais conversas para confirmar.` : "") +
      (maisResponde !== primeiro && maisResponde.taxaResposta - primeiro.taxaResposta >= 10
        ? ` ${maisResponde.nicho} é o que mais responde (${maisResponde.taxaResposta}%), mas a resposta vira menos interesse.` : "") });
  }

  const alvo = [];
  for (const c of perfil) {
    const validas = c.faixas.filter(f => !f.semPessoa && f.contatados >= AMOSTRA_MINIMA).sort(melhorPorInteresse);
    if (validas.length < 2) continue;
    const melhor = validas[0];
    // Em "quem atendeu", a comparação que importa é dono contra funcionário.
    const pior = c.id === "atendeu" ? validas.find(f => f.id === "equipe") || validas[validas.length - 1] : validas[validas.length - 1];
    if (melhor.taxaInteresse >= (total.taxaInteresse ?? 0) + 5) alvo.push({ corte: c.nome, faixa: melhor.nome, taxaInteresse: melhor.taxaInteresse, contatados: melhor.contatados });
    if (melhor === pior || melhor.taxaInteresse - pior.taxaInteresse < 10) continue;
    frases.push({ tom: "foco", texto: `${c.nome}: ${melhor.nome}, ${melhor.taxaInteresse}% mostraram interesse (${deTantos(melhor)}); ${pior.nome}, ${pior.taxaInteresse}% (${deTantos(pior)}).` });
  }

  const atendeu = perfil.find(c => c.id === "atendeu");
  if (atendeu) {
    const f = id => atendeu.faixas.find(x => x.id === id);
    const parou = f("robo").contatados + f("ninguem").contatados;
    if (parou) frases.push({ tom: "atencao", texto: `${parou} ${parou === 1 ? "conversa parou" : "conversas pararam"} antes de uma pessoa responder (${f("robo").contatados} na mensagem automática, ${f("ninguem").contatados} sem resposta nenhuma). Nelas a demo não chegou a ninguém: vale outro canal (Instagram do dono, ligação).` });
  }
  return { frases, alvo, mediaInteresse: total.taxaInteresse };
}

/** A leitura franca: frases curtas, só com o que os números sustentam. */
export function alertas(total, producao, quentes, qualidade) {
  const lista = [];
  if (total.contatados && !qualidade.respostasRegistradas) {
    lista.push({ tom: "atencao", texto: `Nenhuma resposta registrada no painel. A taxa de resposta é estimada pela etapa e pelo motivo da perda; registrar quem respondeu (dono, funcionário) e o que disse deixa o próximo diagnóstico exato.` });
  }
  if (total.semRespostaComCobranca) {
    const sem = total.semRespostaComCobranca - total.cobrancasFeitas;
    if (sem > 0) lista.push({ tom: "alerta", texto: `${sem} de ${total.semRespostaComCobranca} conversas sem resposta não têm nenhuma cobrança marcada como feita. Ou a cobrança não está acontecendo, ou não está sendo marcada.` });
  }
  if (total.conversando) {
    lista.push({ tom: "atencao", texto: `${total.conversando} ${total.conversando === 1 ? "lead respondeu e segue" : "leads responderam e seguem"} em aberto sem interesse avaliado. Marcar o interesse (ou o não) de cada um mostra quantos estão de fato perto de comprar.` });
  }
  const parados = quentes.filter(q => q.diasParado !== null && q.diasParado >= 5);
  if (parados.length) {
    lista.push({ tom: "alerta", texto: `${parados.length === 1 ? "1 conversa quente está parada" : parados.length + " conversas quentes estão paradas"} há 5 dias ou mais (${parados.slice(0, 4).map(q => q.empresa).join(", ")}). São os leads mais perto de virar venda.` });
  }
  if (producao.prontasSemEnvio) {
    lista.push({ tom: "atencao", texto: `${producao.prontasSemEnvio} ${producao.prontasSemEnvio === 1 ? "demo pronta ainda não foi enviada" : "demos prontas ainda não foram enviadas"}.` });
  }
  const naoSite = total.motivos.ja_tem_site || 0;
  if (total.nao >= 3 && naoSite / total.nao >= 0.25) {
    lista.push({ tom: "atencao", texto: `${naoSite} de ${total.nao} "não" foram "já tem site ou alguém fazendo". A checagem de "sem site" antes da demo está deixando passar.` });
  }
  if (total.contatados >= 20 && !total.vendas) {
    const onde = (total.taxaResposta ?? 0) < 40 ? "na resposta" : "entre a resposta e o interesse";
    lista.push({ tom: "alerta", texto: `${total.contatados} contatos e nenhuma venda. ${total.respondeu} responderam (${total.taxaResposta ?? 0}%), mas ${total.interessados} ${total.interessados === 1 ? "mostrou" : "mostraram"} interesse (${total.taxaInteresse ?? 0}%): o funil perde mais ${onde} e no fechamento.` });
  }
  return lista;
}
