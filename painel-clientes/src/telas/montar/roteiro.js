// O roteiro da conversa de boas-vindas (Missão 7, bloco E; o 11, "O roteiro do que extrair"; D43, D44), sem tela:
// testado em test/montar.test.mjs. Os assuntos com a pergunta e as opções de sempre (é o roteiro fixo, e as opções que
// a IA pode usar), o que a demo já sabe para confirmar num toque, e o que as respostas mudam no painel: a ordem do
// menu pelo objetivo e o plano para começar no Início.

/** A conta precisa da conversa? Só o dono, e só quando o Admin marcou (contas.ajustes.onboarding.pendente). */
export const precisaMontar = conta => !!(conta && conta.dono && conta.ajustes && conta.ajustes.onboarding && conta.ajustes.onboarding.pendente);

/** A conversa ficou para depois (e ainda não foi feita): o Início mostra o passo "Terminar de montar o painel". */
export const montarAdiado = conta => !!(conta && conta.ajustes && conta.ajustes.onboarding && conta.ajustes.onboarding.adiado && !conta.ajustes.onboarding.feito_em);

/** Os assuntos, na ordem do roteiro fixo. `so`: só para um nicho. As opções são as únicas que a IA pode oferecer. */
export const ASSUNTOS = [
  { assunto: "quem", pergunta: "Quem está falando com a gente?", opcoes: [["dono", "Sou a dona ou o dono"], ["socio", "Sou sócia ou sócio"], ["gerente", "Cuido do dia a dia"], ["outro", "Outra pessoa"]] },
  { assunto: "objetivo", pergunta: "O que mais te ajudaria agora?", opcoes: [["pedidos", "Não perder nenhum pedido"], ["agenda", "Organizar a agenda"], ["dinheiro", "Controlar o dinheiro"], ["vender", "Vender mais"]] },
  { assunto: "tamanho", pergunta: "Quantas pessoas trabalham com você?", opcoes: [["so_eu", "Só eu"], ["2_3", "De 2 a 3"], ["4_mais", "4 ou mais"]] },
  { assunto: "volume", pergunta: { eventos: "Quantas festas vocês fazem por mês?", fotografia: "Quantos ensaios você faz por mês?" }, opcoes: [["ate_4", "Até 4"], ["5_15", "De 5 a 15"], ["mais_15", "Mais de 15"]] },
  { assunto: "porte", so: "eventos", pergunta: "Quantos convidados tem uma festa típica?", opcoes: [["ate_50", "Até 50"], ["50_150", "De 50 a 150"], ["150_300", "De 150 a 300"], ["mais_300", "Mais de 300"]] },
  { assunto: "origem", pergunta: "Por onde chega a maioria dos pedidos?", opcoes: [["whatsapp", "WhatsApp"], ["instagram", "Instagram"], ["indicacao", "Indicação"], ["site", "Site ou Google"]] },
  { assunto: "organiza", pergunta: "Como você organiza a agenda hoje?", opcoes: [["caderno", "Caderno ou agenda de papel"], ["planilha", "Planilha"], ["google", "Google Agenda"], ["sistema", "Outro sistema"], ["cabeca", "De cabeça"]] },
  { assunto: "pacotes", pergunta: "Você já tem pacotes com preço?", opcoes: [["com_preco", "Sim, com preço"], ["arquivo", "Tenho num PDF ou arte"], ["nao", "Ainda não"]] },
  { assunto: "contrato", pergunta: "E contrato, você usa?", opcoes: [["modelo", "Tenho um modelo"], ["quero", "Quero um modelo pronto"], ["nao", "Não uso"]] },
  { assunto: "sinal", pergunta: "Você cobra sinal para reservar a data?", opcoes: [["30", "Sim, uns 30%"], ["50", "Sim, uns 50%"], ["outro", "Sim, outro valor"], ["nao", "Não cobro"]] },
  { assunto: "clientes", pergunta: "E a lista de clientes?", opcoes: [["lista", "Tenho numa lista"], ["celular", "Só no celular"], ["zero", "Começo do zero"]] },
].map(a => ({ ...a, opcoes: a.opcoes.map(([valor, rotulo]) => ({ valor, rotulo })) }));

/** Os assuntos do nicho, com a pergunta no jeito dele. */
export function assuntosDoNicho(idNicho) {
  return ASSUNTOS.filter(a => !a.so || a.so === idNicho)
    .map(a => ({ assunto: a.assunto, pergunta: typeof a.pergunta === "string" ? a.pergunta : a.pergunta[idNicho] || a.pergunta.eventos, opcoes: a.opcoes }));
}

/** O que ainda falta perguntar (sem os respondidos nem os pulados). */
export function restantes(idNicho, respostas) {
  const feitos = new Set((respostas || []).map(r => r.assunto));
  return assuntosDoNicho(idNicho).filter(a => !feitos.has(a.assunto));
}

/** A pergunta da vez sem a IA: o primeiro assunto que falta, como está no roteiro. */
export const proximaFixa = (idNicho, respostas) => restantes(idNicho, respostas)[0] || null;

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
