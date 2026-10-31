// O roteiro da conversa de boas-vindas (Missão 7, bloco E; o 11, "O roteiro do que extrair"; D43, D44), sem tela:
// testado em test/montar.test.mjs. Os assuntos com a pergunta e as opções de sempre (é o roteiro fixo, e as opções que
// a IA pode usar), o que a demo já sabe para confirmar num toque, e o que as respostas mudam no painel: a ordem do
// menu pelo objetivo e o plano para começar no Início.

/** A conta precisa da conversa? Só o dono, e só quando o Admin marcou (contas.ajustes.onboarding.pendente). */
export const precisaMontar = conta => !!(conta && conta.dono && conta.ajustes && conta.ajustes.onboarding && conta.ajustes.onboarding.pendente);

/** A conversa ficou para depois (e ainda não foi feita): o Início mostra o passo "Terminar de montar o painel". */
export const montarAdiado = conta => !!(conta && conta.ajustes && conta.ajustes.onboarding && conta.ajustes.onboarding.adiado && !conta.ajustes.onboarding.feito_em);

/**
 * Os assuntos, na ordem do roteiro fixo. As opções são as únicas que a IA pode oferecer; a terceira parte de cada uma
 * é o que o painel faz com ela (a base da reação que aparece no toque, e a própria reação quando a IA não responde). `depois`: fica fora da
 * conversa de boas-vindas (a Renderiza testou em 31/10: 11 perguntas cansam; ficam as 5 que mudam o painel na hora, e as
 * outras entram depois, quando fizerem sentido). `so`: só para um nicho.
 */
export const ASSUNTOS = [
  { assunto: "objetivo", pergunta: "O que mais te ajudaria agora?", opcoes: [
    ["pedidos", "Não perder nenhum pedido", "O menu começa pelo Atendimento: todo pedido num lugar só."],
    ["agenda", "Organizar a agenda", "O menu começa pela Agenda, com tudo o que está marcado."],
    ["dinheiro", "Controlar o dinheiro", "O menu começa pelo Financeiro: o que entrou e o que falta."],
    ["vender", "Vender mais", "O menu começa pelo Atendimento, para nenhum pedido esfriar."]] },
  { assunto: "tamanho", pergunta: "Quantas pessoas trabalham com você?", opcoes: [
    ["so_eu", "Só eu", "O painel fica do seu jeito, sem passo de equipe."],
    ["2_3", "De 2 a 3", "Depois você convida a equipe, e cada um vê só o que você deixar."],
    ["4_mais", "4 ou mais", "Depois você convida a equipe, e cada um vê só o que você deixar."]] },
  { assunto: "organiza", pergunta: "Onde ficam as datas que você já tem marcadas?", opcoes: [
    ["caderno", "Caderno ou agenda de papel", "Dá para trazer digitando rápido: uma data e um nome por linha."],
    ["planilha", "Planilha", "Dá para trazer a planilha de uma vez, no Início."],
    ["google", "Google Agenda", "Dá para trazer digitando rápido, uma por linha, ou por planilha."],
    ["sistema", "Outro sistema", "Exporte uma planilha de lá e traga de uma vez, no Início."],
    ["cabeca", "Na cabeça", "Comece pelas próximas: uma data e um nome por linha, rapidinho."]] },
  { assunto: "pacotes", pergunta: "Você já tem pacotes com preço?", opcoes: [
    ["com_preco", "Sim, com preço", "Eles entram nos orçamentos, nos contratos e no Financeiro."],
    ["arquivo", "Tenho num PDF ou arte", "Mande o arquivo para a Renderiza, que a gente cadastra para você."],
    ["nao", "Ainda não", "Você cadastra os primeiros em Serviços, quando quiser."]] },
  { assunto: "contrato", pergunta: "E contrato, você usa?", opcoes: [
    ["modelo", "Tenho um modelo", "Você cola o seu texto no painel e marca os campos que se preenchem sozinhos."],
    ["quero", "Quero um modelo pronto", "Você monta o modelo no painel, com os campos que se preenchem sozinhos."],
    ["nao", "Não uso", "Tudo bem: quando quiser, o contrato vai por link e o cliente aceita no celular."]] },
  { assunto: "quem", depois: true, pergunta: "Quem está falando com a gente?", opcoes: [["dono", "Sou a dona ou o dono"], ["socio", "Sou sócia ou sócio"], ["gerente", "Cuido do dia a dia"], ["outro", "Outra pessoa"]] },
  { assunto: "volume", depois: true, pergunta: { eventos: "Quantas festas vocês fazem por mês?", fotografia: "Quantos ensaios você faz por mês?" }, opcoes: [["ate_4", "Até 4"], ["5_15", "De 5 a 15"], ["mais_15", "Mais de 15"]] },
  { assunto: "porte", depois: true, so: "eventos", pergunta: "Quantos convidados tem uma festa típica?", opcoes: [["ate_50", "Até 50"], ["50_150", "De 50 a 150"], ["150_300", "De 150 a 300"], ["mais_300", "Mais de 300"]] },
  { assunto: "origem", depois: true, pergunta: "Por onde chega a maioria dos pedidos?", opcoes: [["whatsapp", "WhatsApp"], ["instagram", "Instagram"], ["indicacao", "Indicação"], ["site", "Site ou Google"]] },
  { assunto: "sinal", depois: true, pergunta: "Você cobra sinal para reservar a data?", opcoes: [["30", "Sim, uns 30%"], ["50", "Sim, uns 50%"], ["outro", "Sim, outro valor"], ["nao", "Não cobro"]] },
  { assunto: "clientes", depois: true, pergunta: "E a lista de clientes?", opcoes: [["lista", "Tenho numa lista"], ["celular", "Só no celular"], ["zero", "Começo do zero"]] },
].map(a => ({ ...a, opcoes: a.opcoes.map(([valor, rotulo, efeito]) => (efeito ? { valor, rotulo, efeito } : { valor, rotulo })) }));

/** Os assuntos do nicho, com a pergunta no jeito dele. Sem `todos`, só os da conversa de boas-vindas. */
export function assuntosDoNicho(idNicho, { todos = false } = {}) {
  return ASSUNTOS.filter(a => (!a.so || a.so === idNicho) && (todos || !a.depois))
    .map(a => ({ assunto: a.assunto, pergunta: typeof a.pergunta === "string" ? a.pergunta : a.pergunta[idNicho] || a.pergunta.eventos, opcoes: a.opcoes }));
}

/**
 * As perguntas da conversa: as que a IA preparou (na ordem e no tom dela, já conferidas pela função), completadas com
 * as do roteiro que faltarem. Sem a IA, as do roteiro, como estão.
 */
export function perguntasDaConversa(idNicho, daIa) {
  const fixas = assuntosDoNicho(idNicho);
  const efeito = (assunto, valor) => ((fixas.find(f => f.assunto === assunto) || { opcoes: [] }).opcoes.find(o => o.valor === valor) || {}).efeito || "";
  const lista = [];
  for (const p of Array.isArray(daIa) ? daIa : []) {
    if (fixas.some(f => f.assunto === p.assunto) && !lista.some(x => x.assunto === p.assunto) && Array.isArray(p.opcoes) && p.opcoes.length >= 2) {
      lista.push({ ...p, opcoes: p.opcoes.map(o => ({ ...o, reacao: o.reacao || efeito(p.assunto, o.valor) })) });
    }
  }
  // sem a IA (ou o que ela não mandou): a reação é o que o painel faz com a resposta
  const doRoteiro = fixas.filter(f => !lista.some(x => x.assunto === f.assunto)).map(f => ({ ...f, opcoes: f.opcoes.map(o => ({ ...o, reacao: o.efeito || "" })) }));
  return [...lista, ...doRoteiro];
}

/** O perfil para guardar (contas.ajustes.onboarding.perfil): { assunto: valor }, sem os pulados. */
export function perfilDasRespostas(respostas) {
  const perfil = {};
  for (const r of respostas || []) if (r.valor) perfil[r.assunto] = r.valor;
  return perfil;
}

const PRIMEIRO_PELO_OBJETIVO = { pedidos: ["atendimento", "agenda"], agenda: ["agenda", "atendimento"], dinheiro: ["financeiro", "agenda"], vender: ["atendimento", "meu-site", "agenda-online"] };

/** A ordem do menu pelo objetivo: o que mais ajuda vem primeiro; o resto, como estava. Só os módulos ligados. */
export function ordemDoMenu(objetivo, ligados, atual = []) {
  const base = [...atual.filter(m => ligados.includes(m)), ...ligados.filter(m => !atual.includes(m))];
  const primeiro = (PRIMEIRO_PELO_OBJETIVO[objetivo] || []).filter(m => base.includes(m));
  return [...primeiro, ...base.filter(m => !primeiro.includes(m))];
}

/**
 * O que a demo já sabe, para confirmar num toque: o nome, o WhatsApp, a região, o Google e os tipos de festa ou de
 * ensaio. `dados`: o que veio de contexto_da_minha_conta (pode ser null: conta sem demo).
 */
export function confirmacoes({ conta, dados }) {
  const d = dados || {};
  return {
    nome: conta.nome,
    whatsapp: conta.whatsapp || d.whatsapp || "",
    regiao: d.regiao || "",
    google: d.google && d.google.nota ? `nota ${d.google.nota} no Google${d.google.total ? `, ${d.google.total} avaliações` : ""}` : "",
    instagram: d.instagram || "",
    tipos: Array.isArray(d.tipos) ? d.tipos.filter(Boolean).slice(0, 12) : [],
  };
}

/** Os tipos (ou ensaios) para marcar: os da demo já marcados, depois as sugestões do nicho; sem repetir. */
export function tiposParaEscolher(daDemo, sugestoes) {
  const vistos = new Set();
  const lista = [];
  const por = (nome, marcada, extra = {}) => {
    const chave = String(nome || "").trim().toLowerCase();
    if (!chave || vistos.has(chave)) return;
    vistos.add(chave);
    lista.push({ nome: String(nome).trim().slice(0, 60), marcada, ...extra });
  };
  for (const t of daDemo || []) por(t, true);
  for (const s of sugestoes || []) por(s.nome, false, { cor: s.cor, duracao: s.duracao });
  return lista;
}
