// Visitas ao link do Painel Renderiza (/exemplos?c=<código do lead>) e às demos (/demo/<pasta>), gravadas na
// tabela visitas pelo contador da página (exemplos/visitas.js → api/visita.js → registrar_visita). Aqui: o link
// de cada lead, o "mapa de interação" (cada visita com o que a pessoa fez), separando o cliente de nós mesmos, e
// a linha do tempo de todos os leads (tela Atividade).

export const SITE = "https://www.renderizaweb.com.br";
/** O link vai para os leads de eventos (o painel de exemplo é de espaço de eventos) e de fotografia (o do Estúdio Ciranda). */
const DE_FOTOGRAFIA = /fotogra|est[úu]dio de foto/i;
export const mostraPainel = l => !!l && !!l.codigo && (/event|buffet|festa|chácara|chacara|sítio|sitio/i.test(String(l.segmento || "")) || DE_FOTOGRAFIA.test(String(l.segmento || "")));
export const linkDoPainel = l => (l && l.codigo ? `${SITE}/exemplos${DE_FOTOGRAFIA.test(String(l.segmento || "")) ? "/fotografia" : ""}?c=${l.codigo}` : "");
export const linkCurto = l => linkDoPainel(l).replace(/^https:\/\/www\./, "");

/** Os passos que a página manda (os mesmos da tabela visitas e da função registrar_visita do supabase/schema.sql). */
export const EVENTOS = ["abriu", "viu_precos", "viu_detalhes", "abriu_exemplo", "clicou_whatsapp", "clicou", "mudou_tela", "pediu_reserva", "rolou_fim", "tempo"];
export const PAGINAS_CONTADAS = ["exemplos", "painel-eventos", "agenda-online", "demo"];
/** Visita à demo de um lead (as outras são do link do Painel Renderiza). */
export const daDemo = v => v.pagina === "demo";

const MODULOS = { "agenda-online": "Agenda online", agenda: "Agenda da equipe", clientes: "Clientes", contratos: "Contratos", financeiro: "Financeiro", atendimento: "Atendimento" };
const TELAS = { inicio: "a visão geral", agenda: "a agenda", clientes: "os clientes", contratos: "os contratos", financeiro: "o financeiro", atendimento: "o atendimento", equipe: "a equipe e acessos", campanha: "a campanha de Natal" };
const PAGINAS = { exemplos: "a página do painel", "painel-eventos": "o exemplo do painel", "agenda-online": "a agenda online de exemplo", demo: "a demo do site" };
/** Outras páginas de uma demo (detalhe.sub do "abriu"). */
const SUBPAGINAS = { natal: "a página de Natal da demo", "artes-instagram": "as artes para Instagram da demo", proposta: "a proposta comercial", contrato: "o contrato para assinar" };
const LUGARES = { exemplos: "Página do Painel Renderiza", "painel-eventos": "Exemplo do painel", "agenda-online": "Agenda online de exemplo" };
/** Onde foi: "Página do Painel Renderiza", "Demo otica-nina"… */
export const lugarDe = v => (daDemo(v) ? "Demo " + (v.demo || "") : LUGARES[v.pagina] || v.pagina).trim();
const reais = v => "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * O alvo de um clique na demo. "valor": abriu o card de valor da Renderiza (a pílula ou "Ver a condição"); antes de
 * 05/11/2026 a página gravava esse clique como um botão "Renderiza R$ 399 · até …", que conta igual.
 */
export const alvoDoClique = d => (!d ? "" : d.alvo === "botao" && /^Renderiza R\$/.test(String(d.texto || "")) ? "valor" : d.alvo || "");
/** O WhatsApp clicado é o da Renderiza (a página de demo fora do ar ou o número da Renderiza), não o do cliente. */
export const whatsappDaRenderiza = (v, d = v.detalhe || {}) => d.para === "renderiza" || d.onde === "fora" || (v.pagina !== "demo" && v.evento === "clicou_whatsapp");

/** O que a pessoa fez, em português. Tempo na página não é passo (vira a duração da visita). */
export function textoDoPasso(v) {
  const d = v.detalhe || {};
  switch (v.evento) {
    case "abriu": return d.fora ? FORA[d.fora] || FORA.fora : "Abriu " + (daDemo(v) && d.sub ? SUBPAGINAS[d.sub] || `a página "${d.sub}" da demo` : PAGINAS[v.pagina] || "a página");
    case "viu_precos": return daDemo(v) ? "Viu o card com o valor do site" : "Chegou nos preços";
    case "viu_detalhes": return "Viu os detalhes de " + (MODULOS[d.m] || "um módulo");
    case "abriu_exemplo": return d.qual === "agenda online" ? "Foi testar a agenda online" : "Foi ver no exemplo " + (TELAS[d.qual] || "o painel");
    case "mudou_tela": return "No exemplo, abriu " + (TELAS[d.tela] || "outra tela");
    case "clicou_whatsapp": {
      if (daDemo(v)) return d.onde === "fora" ? "Chamou vocês no WhatsApp para liberar a demo de novo"
        : d.para === "renderiza" ? (d.parte === "Aviso" ? "Chamou vocês no WhatsApp (pelo aviso da Renderiza)" : "Chamou vocês no WhatsApp (botão da Renderiza na demo)")
        : "Clicou no WhatsApp do próprio site, na demo (testou o botão)";
      const mods = Array.isArray(d.modulos) ? d.modulos.map(m => MODULOS[m] || m) : [];
      return mods.length ? `Clicou no WhatsApp com o plano: ${mods.join(", ")}${d.total ? ` (${reais(d.total)}/mês)` : ""}` : "Clicou no WhatsApp";
    }
    case "pediu_reserva": return "Testou a agenda online até o fim (pré-reserva de teste)";
    case "rolou_fim": return "Rolou até o fim d" + (v.pagina === "exemplos" ? "a página" : v.pagina === "agenda-online" ? "a agenda" : daDemo(v) ? "a demo" : "o exemplo");
    case "clicou": {
      const onde = d.parte ? ` (em ${d.parte})` : "";
      if (alvoDoClique(d) === "valor") return "Abriu o card de valor da Renderiza" + onde;
      if (d.alvo === "aviso") return textoDoAviso(d);
      if (d.alvo === "menu") return "Pelo menu, foi para " + (d.para || "outra parte");
      if (d.alvo === "botao") return `Clicou em "${d.texto || "um botão"}"` + onde;
      if (d.alvo === "link") return "Abriu um link" + (d.para ? ` (${d.para})` : "");
      if (d.alvo === "oferta") return (d.texto === "negociar" ? 'Clicou em "Negociar"' : 'Clicou em "Garantir o meu"') + " (WhatsApp da Renderiza)" + onde;
      return (CLIQUES[d.alvo] || "Clicou em algo") + onde;
    }
    default: return v.evento;
  }
}
/**
 * O aviso da Renderiza na demo de fotógrafa (modal leve que abre uma vez depois de um tempo na página): a página grava
 * como "clicou" com alvo "aviso", acao "viu" (s: segundos na página, rolagem: % rolado, gatilho) ou "fechou" (como e
 * s: quanto tempo ficou aberto).
 */
const COMO_FECHOU = { continuar: 'em "Continuar vendo"', x: "no X", fora: "tocando fora", esc: "no Esc", whatsapp: "indo para o WhatsApp", saiu: "saindo da página com ele aberto" };
export const avisoVisto = d => !!d && d.alvo === "aviso" && d.acao === "viu";
function textoDoAviso(d) {
  if (d.acao === "viu") {
    const contexto = [d.gatilho === "teste" ? "aberto pelo link de teste" : d.s ? `com ${duracao(d.s)} na página` : "", d.rolagem != null && d.gatilho !== "teste" ? `${d.rolagem}% rolado` : ""].filter(Boolean).join(", ");
    return "Viu o aviso da Renderiza" + (contexto ? ` (${contexto})` : "");
  }
  const tempo = d.s == null ? "" : d.s >= 1 ? ` depois de ${duracao(d.s)}` : " na hora";
  return "Fechou o aviso" + tempo + (COMO_FECHOU[d.como] ? ", " + COMO_FECHOU[d.como] : "");
}
// A demo fora do ar (middleware.js): a pessoa voltou no link e viu o aviso.
const FORA = { vencida: "Voltou na demo, que estava vencida (viu o aviso e o botão de reabrir)", reaberta: "Voltou na demo vencida, que já tinha sido reaberta uma vez",
  fora: "Voltou na demo, que está desligada (viu o aviso de fora do ar)" };
const CLIQUES = { aviso_painel: "Foi ver o painel do estúdio (agenda online)", reabrir: "Reabriu a demo por 1 hora (botão grátis)", faixa: "Tocou na faixa do valor, no topo", instagram: "Abriu o Instagram da loja", facebook: "Abriu o Facebook da loja", tiktok: "Abriu o TikTok da loja", rota: "Pediu a rota até a loja",
  mapa: "Abriu o mapa", avaliacoes: "Foi ver as avaliações no Google", avaliar: "Foi deixar uma avaliação no Google", telefone: "Tocou para ligar", email: "Tocou no e-mail" };
/** Passos que mostram interesse de verdade (para o resumo). */
const FORTES = new Set(["viu_precos", "clicou_whatsapp", "viu_detalhes", "abriu_exemplo", "pediu_reserva"]);
const CLIQUES_FORTES = new Set(["aviso_painel", "reabrir", "faixa", "valor", "oferta", "instagram", "rota", "mapa", "avaliacoes", "telefone"]);
const forte = v => FORTES.has(v.evento) || (v.evento === "clicou" && CLIQUES_FORTES.has(alvoDoClique(v.detalhe))) || (v.evento === "abriu" && !!(v.detalhe || {}).fora);

/** IPs vistos em visitas marcadas como nossas: outra visita com o mesmo IP provavelmente também é nossa. */
export const ipsDaEquipe = visitas => new Set(visitas.filter(v => v.equipe && v.ip).map(v => v.ip));
/** Navegadores que já se marcaram como nossos em alguma visita (de qualquer lead). */
export const visitantesDaEquipe = visitas => new Set(visitas.filter(v => v.equipe && v.visitante).map(v => v.visitante));

/**
 * Visitas de um lead agrupadas: mesmo navegador, sem parar mais de 30 minutos = uma visita (pode passar por
 * mais de uma página). Mais nova primeiro.
 * quem: "equipe" (navegador com o painel da Renderiza), "equipe_ip" (mesmo IP de uma visita nossa) ou "cliente".
 * fim: a última ação, contando o tempo que a página manda a cada 30 s (detalhe.ate, a hora do banco).
 * secoes: na demo, quanto tempo ficou em cada parte ([nome, segundos], a mais vista primeiro).
 * saiu: a página avisou que a pessoa saiu (ou trocou de app) depois da última ação.
 * repasse: { aparelho, local } quando a visita do cliente veio de outro aparelho (veja marcarRepasses).
 */
export function agruparVisitas(visitas, ipsEquipe = ipsDaEquipe(visitas), visitantesEquipe = visitantesDaEquipe(visitas)) {
  const ordem = [...visitas].sort((a, b) => Date.parse(a.criado_em) - Date.parse(b.criado_em));
  const grupos = [], abertoPor = new Map();
  for (const v of ordem) {
    const chave = v.visitante || v.sessao || String(v.id);
    const d = v.detalhe || {};
    const t = Date.parse(v.criado_em), ate = v.evento === "tempo" && d.ate ? Math.max(t, Date.parse(d.ate) || t) : t;
    let g = abertoPor.get(chave);
    if (!g || t - g.fimMs > 30 * 60000) {
      g = { lead_id: v.lead_id, inicio: v.criado_em, fimMs: t, ultimoPassoMs: 0, visitante: v.visitante, aparelho: v.aparelho, local: v.local, ip: v.ip, equipe: false, passos: [], tempos: new Map() };
      grupos.push(g); abertoPor.set(chave, g);
    }
    g.fimMs = Math.max(g.fimMs, ate);
    g.equipe = g.equipe || !!v.equipe;
    if (!g.aparelho && v.aparelho) g.aparelho = v.aparelho;
    if (!g.local && v.local) g.local = v.local;
    if (!g.ip && v.ip) g.ip = v.ip;
    if (v.evento === "tempo") {
      const k = v.sessao + "/" + v.pagina, s = Number(d.s) || 0, antes = g.tempos.get(k);
      // Antes de 22/10/2026 o tempo só ia ao sair (sem "saiu"): conta como saiu.
      if (!antes || s >= antes.s) g.tempos.set(k, { s, ateMs: ate, saiu: d.saiu === undefined ? true : !!d.saiu, secoes: Array.isArray(d.secoes) ? d.secoes : [] });
      continue;
    }
    g.ultimoPassoMs = Math.max(g.ultimoPassoMs, t);
    g.passos.push({ evento: v.evento, texto: textoDoPasso(v), em: v.criado_em, forte: forte(v), pagina: v.pagina, demo: v.demo || "", lugar: lugarDe(v), detalhe: d });
  }
  const prontos = grupos.map(g => {
    const tempos = [...g.tempos.values()];
    const segundos = tempos.reduce((a, x) => a + x.s, 0);
    const porParte = new Map();
    for (const x of tempos) for (const [nome, s] of x.secoes) if (nome && Number(s) > 0) porParte.set(String(nome), (porParte.get(String(nome)) || 0) + Number(s));
    const ultimoTempo = tempos.reduce((m, x) => (!m || x.ateMs > m.ateMs ? x : m), null);
    const quem = g.equipe || visitantesEquipe.has(g.visitante) ? "equipe" : g.ip && ipsEquipe.has(g.ip) ? "equipe_ip" : "cliente";
    const { tempos: _t, fimMs, ultimoPassoMs, ...resto } = g;
    return {
      ...resto, fim: new Date(fimMs).toISOString(), segundos, quem,
      secoes: [...porParte].sort((a, b) => b[1] - a[1]),
      saiu: !!ultimoTempo && ultimoTempo.saiu && ultimoTempo.ateMs >= ultimoPassoMs,
    };
  });
  return marcarRepasses(prontos).reverse();
}

const baseDoAparelho = a => String(a || "").split(" · ").slice(0, 2).join(" · "); // "celular · iPhone"
const cidadeDe = l => String(l || "").split(" · ")[0];

/**
 * "Repassou para alguém": a visita do cliente vem de um aparelho que ainda não tinha aberto o link do lead. Conta
 * como outro aparelho o sistema diferente (iPhone, Android, Windows…) ou o mesmo sistema em outra cidade. O mesmo
 * celular em outro navegador (o do WhatsApp e o Chrome) não conta: o sistema e a cidade são os mesmos.
 * Recebe os grupos em ordem de tempo (do mais antigo) e marca g.repasse.
 */
export function marcarRepasses(grupos) {
  const vistos = new Map(); // lead → [{ base, cidade }]
  for (const g of grupos) {
    g.repasse = null;
    if (g.quem !== "cliente") continue;
    const base = baseDoAparelho(g.aparelho), cidade = cidadeDe(g.local);
    const lista = vistos.get(g.lead_id) || [];
    const conhecido = lista.some(x => x.base === base && (!cidade || !x.cidade || x.cidade === cidade));
    if (lista.length && !conhecido && (base || cidade)) g.repasse = { aparelho: base, local: g.local || "" };
    if (!conhecido) lista.push({ base, cidade });
    vistos.set(g.lead_id, lista);
  }
  return grupos;
}

/** Ainda com a página aberta: a última notícia tem menos de 75 s (a página manda a cada 30 s) e não avisou que saiu. */
export const vendoAgora = (g, agora = Date.now()) => !g.saiu && agora - Date.parse(g.fim) < 75000;

const juntar = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]);
const ALVOS = { reabrir: "reabriu por 1 hora", instagram: "abriu o Instagram", facebook: "abriu o Facebook", tiktok: "abriu o TikTok", rota: "pediu a rota até a loja", mapa: "abriu o mapa",
  avaliacoes: "foi ver as avaliações", avaliar: "foi avaliar no Google", telefone: "tocou para ligar", email: "tocou no e-mail",
  oferta: "clicou na oferta da Renderiza", aviso_painel: "foi ver o painel do estúdio" };
const ABERTURAS = { demo: "abriu a demo", exemplos: "abriu o link do painel", "painel-eventos": "viu o exemplo do painel", "agenda-online": "abriu a agenda online" };
// O que pode sair da frase quando ela fica longa (o resto continua nos detalhes).
const MENOS_IMPORTANTE = ["botoes", "menu", "telas", "fim", "aviso", "clicou:mapa", "clicou:email", "clicou:facebook", "clicou:tiktok"];

/**
 * A visita numa frase, sem termo técnico: "abriu a demo, viu até o fim e clicou no WhatsApp do site". Na ordem
 * em que aconteceu, no máximo 4 coisas (o que é menos importante sai primeiro; tudo fica nos detalhes).
 */
export function fraseDaVisita(g) {
  const itens = new Map(), modulos = new Set();
  let telas = 0, botoes = 0, ultimoBotao = "";
  const add = (chave, texto) => { if (!itens.has(chave)) itens.set(chave, texto); };
  for (const p of g.passos) {
    const d = p.detalhe || {};
    if (p.evento === "abriu" && d.fora) add("abriu:fora", () => (d.fora === "fora" ? "voltou na demo, que está desligada" : "voltou na demo, que estava vencida"));
    else if (p.evento === "abriu") add("abriu:" + p.pagina, () => ABERTURAS[p.pagina] || "abriu a página");
    else if (p.evento === "abriu_exemplo") { const pg = d.qual === "agenda online" ? "agenda-online" : "painel-eventos"; add("abriu:" + pg, () => ABERTURAS[pg]); }
    else if (p.evento === "mudou_tela") { telas++; add("telas", () => (telas > 1 ? `passou por ${telas} telas do exemplo` : "mudou de tela no exemplo")); }
    else if (p.evento === "viu_precos") add("precos", () => (p.pagina === "demo" ? "viu o valor do site" : "chegou nos preços"));
    else if (p.evento === "viu_detalhes") { modulos.add(MODULOS[d.m] || d.m || "um módulo"); add("detalhes", () => (modulos.size === 1 ? "viu os detalhes de " + [...modulos][0] : `viu os detalhes de ${modulos.size} módulos`)); }
    else if (p.evento === "pediu_reserva") add("reserva", () => "fez uma reserva de teste");
    else if (p.evento === "rolou_fim") add("fim", () => (p.pagina === "demo" ? "viu até o fim" : "rolou até o fim"));
    else if (p.evento === "clicou_whatsapp") add("whatsapp", () => (d.onde === "fora" || d.para === "renderiza" ? "chamou vocês no WhatsApp" : p.pagina === "demo" ? "clicou no WhatsApp do site" : "clicou no WhatsApp"));
    else if (p.evento === "clicou" && alvoDoClique(d) === "valor") add("precos", () => "abriu o valor do site");
    else if (p.evento === "clicou" && d.alvo === "aviso") { if (d.acao === "viu") add("aviso", () => "viu o aviso"); }
    else if (p.evento === "clicou" && ALVOS[d.alvo]) add("clicou:" + d.alvo, () => ALVOS[d.alvo]);
    else if (p.evento === "clicou" && d.alvo === "menu") add("menu", () => "usou o menu");
    else if (p.evento === "clicou" && d.alvo === "botao") { botoes++; ultimoBotao = d.texto || ""; add("botoes", () => (botoes > 1 || !ultimoBotao ? `clicou em ${botoes > 1 ? botoes + " botões" : "um botão"}` : `clicou em "${ultimoBotao}"`)); }
  }
  let chaves = [...itens.keys()];
  for (const tirar of MENOS_IMPORTANTE) { if (chaves.length <= 4) break; chaves = chaves.filter(c => c !== tirar); }
  while (chaves.length > 4) chaves.splice(chaves.length - 2, 1);
  const textos = chaves.map(c => itens.get(c)());
  if (!textos.length) return g.secoes && g.secoes.length ? "ficou na página" : "abriu a página";
  return juntar(textos);
}

/** O aviso de repasse: "Outro aparelho (celular · iPhone, em Santo André): pode ter sido repassado". */
export const textoDoRepasse = g => (g.repasse ? `Outro aparelho${g.repasse.aparelho || g.repasse.local ? ` (${[g.repasse.aparelho, g.repasse.local && "em " + cidadeDe(g.repasse.local)].filter(Boolean).join(", ")})` : ""}: pode ter sido repassado` : "");

/** O complemento da frase: "Ficou 2 min, mais tempo em Armações". */
export function complementoDaVisita(g) {
  const partes = [g.segundos >= 5 && "ficou " + duracao(g.segundos), g.secoes && g.secoes.length && "mais tempo em " + g.secoes[0][0]].filter(Boolean);
  const t = partes.join(", ");
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

/** Resumo para o topo da seção e para o selo no cartão: só as visitas do cliente contam. */
export function resumoDasVisitas(grupos) {
  const doCliente = grupos.filter(g => g.quem === "cliente");
  const passos = doCliente.flatMap(g => g.passos);
  return {
    visitas: doCliente.length,
    ultima: doCliente[0] ? doCliente[0].fim : null,
    nossas: grupos.length - doCliente.length,
    precos: passos.some(p => p.evento === "viu_precos"),
    whatsapp: passos.some(p => p.evento === "clicou_whatsapp"),
    exemplo: passos.some(p => p.evento === "abriu_exemplo" || p.evento === "mudou_tela" || p.evento === "pediu_reserva"),
    demo: passos.some(p => p.pagina === "demo"),
    painel: passos.some(p => p.pagina !== "demo"),
    fim: passos.some(p => p.evento === "rolou_fim"),
    aviso: passos.some(p => p.evento === "clicou" && avisoVisto(p.detalhe)),
    aparelhos: doCliente.length ? 1 + doCliente.filter(g => g.repasse).length : 0,
    cliques: [...new Set(passos.filter(p => p.evento === "clicou").map(p => (p.detalhe || {}).alvo).filter(Boolean))],
    segundos: doCliente.reduce((s, g) => s + g.segundos, 0),
  };
}

/** "2 min 10 s", "40 s". */
export function duracao(s) {
  if (!s) return "";
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return m ? `${m} min${r ? " " + r + " s" : ""}` : `${r} s`;
}

/** Visitas por lead, para o selo no cartão sem reagrupar tudo a cada desenho. */
export function visitasPorLead(visitas) {
  const m = new Map();
  for (const v of visitas) { if (!m.has(v.lead_id)) m.set(v.lead_id, []); m.get(v.lead_id).push(v); }
  return m;
}

/* ---------- tela Atividade: a linha do tempo de todos os leads ---------- */

/**
 * Todas as visitas, de todos os leads, agrupadas como no lead (mesmo navegador sem parar 30 min) e com a mais
 * recente primeiro (pela última ação). Quem é da equipe vale entre leads: o navegador ou o IP que já foi nosso
 * em qualquer lead.
 */
export function atividade(visitas) {
  const ips = ipsDaEquipe(visitas), visitantes = visitantesDaEquipe(visitas);
  return [...visitasPorLead(visitas).values()]
    .flatMap(doLead => agruparVisitas(doLead, ips, visitantes))
    .sort((a, b) => Date.parse(b.fim) - Date.parse(a.fim));
}

const semAcento = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const PERIODOS = { hoje: "Hoje", "7d": "7 dias", "30d": "30 dias", tudo: "Tudo" };
/** Início do período (ms), no fuso de quem olha. */
export function inicioDoPeriodo(periodo, agora = new Date()) {
  if (periodo === "tudo") return 0;
  const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  if (periodo === "7d") dia.setDate(dia.getDate() - 6);
  if (periodo === "30d") dia.setDate(dia.getDate() - 29);
  return dia.getTime();
}

/**
 * Filtros da tela: quem ("todos" | "clientes" | "voces"), onde ("tudo" | "painel" | "demos"), desde (ms) e
 * busca (nome do lead, a pasta da demo, a cidade ou o IP). No filtro "onde", a visita fica só com os passos
 * daquele lugar.
 */
export function filtrarAtividade(grupos, { quem = "todos", onde = "tudo", desde = 0, busca = "" } = {}, nomeDoLead = () => "") {
  const termo = semAcento(busca).trim();
  return grupos.flatMap(g => {
    if (quem === "clientes" && g.quem !== "cliente") return [];
    if (quem === "voces" && g.quem === "cliente") return [];
    if (desde && Date.parse(g.fim) < desde) return [];
    const passos = onde === "tudo" ? g.passos : g.passos.filter(p => (onde === "demos") === (p.pagina === "demo"));
    if (!passos.length) return [];
    if (termo && ![nomeDoLead(g.lead_id), ...passos.map(p => p.demo), g.local, g.ip].some(t => semAcento(t).includes(termo))) return [];
    return [passos === g.passos ? g : { ...g, passos }];
  });
}

/** Números do topo: só os clientes contam. */
export function resumoDaAtividade(grupos) {
  const doCliente = grupos.filter(g => g.quem === "cliente");
  const passos = doCliente.flatMap(g => g.passos);
  return {
    visitas: doCliente.length,
    leads: new Set(doCliente.map(g => g.lead_id)).size,
    demos: new Set(passos.filter(p => p.pagina === "demo").map(p => p.demo)).size,
    whatsapp: passos.filter(p => p.evento === "clicou_whatsapp").length,
    nossas: grupos.length - doCliente.length,
  };
}

/* ---------- filtros e indicadores da tela Atividade ---------- */

/** O que a visita teve de importante (o campo "Fez" dos filtros da Atividade). */
export const SINAIS = [
  ["valor", "Viu o valor"], ["oferta", "Clicou em Garantir ou Negociar"], ["whatsapp_renderiza", "Chamou vocês no WhatsApp"],
  ["whatsapp", "Clicou no WhatsApp do site"], ["aviso", "Viu o aviso da Renderiza"], ["fim", "Foi até o fim"], ["natal", "Abriu a página de Natal"],
  ["exemplo", "Mexeu no exemplo do painel"], ["reabriu", "Voltou na demo vencida"], ["repasse", "Outro aparelho"],
];
export function sinaisDaVisita(g) {
  const s = new Set();
  for (const p of g.passos) {
    const d = p.detalhe || {}, v = { evento: p.evento, pagina: p.pagina, detalhe: d };
    if (p.evento === "viu_precos" || (p.evento === "clicou" && ["valor", "faixa"].includes(alvoDoClique(d)))) s.add("valor");
    if (p.evento === "clicou" && d.alvo === "oferta") s.add("oferta");
    if (p.evento === "clicou" && avisoVisto(d)) s.add("aviso");
    if (p.evento === "clicou_whatsapp") s.add(whatsappDaRenderiza(v) ? "whatsapp_renderiza" : "whatsapp");
    if (p.evento === "rolou_fim") s.add("fim");
    if (p.evento === "abriu" && d.sub === "natal") s.add("natal");
    if (["abriu_exemplo", "mudou_tela", "viu_detalhes", "pediu_reserva"].includes(p.evento)) s.add("exemplo");
    if ((p.evento === "abriu" && d.fora) || (p.evento === "clicou" && d.alvo === "reabrir")) s.add("reabriu");
  }
  if (g.repasse) s.add("repasse");
  return s;
}

/** Em que clicou, agrupado para filtrar e contar ("Menu: Portfólio", "Botões em Portfólio", "Instagram"…). */
const NOMES_DOS_CLIQUES = { reabrir: "Reabrir a demo", faixa: "Faixa do valor", valor: "Card de valor da Renderiza", oferta: "Garantir ou Negociar",
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", rota: "Rota", mapa: "Mapa", avaliacoes: "Avaliações no Google",
  avaliar: "Avaliar no Google", telefone: "Telefone", email: "E-mail", link: "Link para outro site", aviso_painel: "Aviso: ver o painel do estúdio" };
/** Como fecharam o aviso, nos cliques (o "viu" não é clique; o WhatsApp do aviso já conta como WhatsApp da Renderiza). */
const FECHOU_O_AVISO = { continuar: "Aviso: Continuar vendo", x: "Aviso: fechou no X", fora: "Aviso: tocou fora", esc: "Aviso: fechou no Esc", saiu: "Aviso: saiu com ele aberto" };
export function categoriaDoClique(p) {
  const d = p.detalhe || {};
  if (p.evento === "clicou_whatsapp") return whatsappDaRenderiza({ evento: p.evento, pagina: p.pagina, detalhe: d }) ? "WhatsApp da Renderiza" : "WhatsApp do site";
  if (p.evento !== "clicou") return null;
  const alvo = alvoDoClique(d);
  if (alvo === "menu") return "Menu: " + (d.para || "outra parte");
  if (alvo === "aviso") return d.acao === "fechou" ? FECHOU_O_AVISO[d.como] || null : null;
  if (alvo === "botao") return /^fechar$/i.test(String(d.texto || "").trim()) ? null : d.parte ? "Botões em " + d.parte : "Outros botões";
  return NOMES_DOS_CLIQUES[alvo] || "Outros cliques";
}

const mediana = ns => { if (!ns.length) return 0; const o = [...ns].sort((a, b) => a - b), m = Math.floor(o.length / 2); return o.length % 2 ? o[m] : Math.round((o[m - 1] + o[m]) / 2); };

/**
 * Indicadores de um recorte de visitas (a tela Atividade, depois dos filtros): visitas, leads, tempo, quantas foram
 * até o fim, quantos leads viram o valor, chamaram no WhatsApp ou clicaram na oferta, o tempo em cada parte e os
 * cliques. `pontos` ordena os leads (mesma régua do painel de indicadores das demos de fotógrafa).
 */
export function indicadoresDaAtividade(grupos) {
  const porLead = new Map(), partes = new Map(), cliques = new Map(), avisoAberto = [];
  let fim = 0;
  for (const g of grupos) {
    const sinais = sinaisDaVisita(g);
    if (sinais.has("fim")) fim++;
    const l = porLead.get(g.lead_id) || { lead_id: g.lead_id, visitas: 0, segundos: 0, sinais: new Set(), ultima: g.fim };
    l.visitas++; l.segundos += g.segundos || 0;
    for (const x of sinais) l.sinais.add(x);
    if (Date.parse(g.fim) > Date.parse(l.ultima)) l.ultima = g.fim;
    porLead.set(g.lead_id, l);
    for (const [nome, s] of g.secoes || []) { const x = partes.get(nome) || { nome, visitas: 0, segundos: 0 }; x.visitas++; x.segundos += s; partes.set(nome, x); }
    const vistos = new Set();
    for (const p of g.passos) {
      const d = p.detalhe || {};
      if (p.evento === "clicou" && d.alvo === "aviso" && d.acao === "fechou" && d.s >= 0) avisoAberto.push(Number(d.s));
      const c = categoriaDoClique(p);
      if (!c) continue;
      const x = cliques.get(c) || { nome: c, cliques: 0, leads: new Set() };
      if (!vistos.has(c)) { x.cliques++; vistos.add(c); }
      x.leads.add(g.lead_id);
      cliques.set(c, x);
    }
  }
  const leads = [...porLead.values()].map(l => ({ ...l,
    pontos: Math.min(l.visitas, 5) + Math.min(Math.floor(l.segundos / 60), 5) + (l.sinais.has("fim") ? 1 : 0) + (l.sinais.has("repasse") ? 2 : 0)
      + (l.sinais.has("whatsapp") ? 2 : 0) + (l.sinais.has("valor") ? 3 : 0) + (l.sinais.has("whatsapp_renderiza") ? 5 : 0) + (l.sinais.has("oferta") ? 5 : 0) }))
    .sort((a, b) => b.pontos - a.pontos || b.segundos - a.segundos || Date.parse(b.ultima) - Date.parse(a.ultima));
  const com = sinal => leads.filter(l => l.sinais.has(sinal)).length;
  const comTempo = grupos.map(g => g.segundos || 0).filter(s => s > 0);
  return {
    visitas: grupos.length,
    leads: leads.length,
    segundosMediana: mediana(comTempo),
    fim, fimPct: grupos.length ? Math.round(100 * fim / grupos.length) : 0,
    valor: com("valor"), whatsapp: com("whatsapp"), whatsappRenderiza: com("whatsapp_renderiza"), oferta: com("oferta"),
    aviso: com("aviso"), avisoSegundosMediana: mediana(avisoAberto),
    partes: [...partes.values()].map(x => ({ ...x, media: Math.round(x.segundos / x.visitas), pct: grupos.length ? Math.round(100 * x.visitas / grupos.length) : 0 }))
      .sort((a, b) => b.segundos - a.segundos || b.media - a.media),
    cliques: [...cliques.values()].map(x => ({ nome: x.nome, cliques: x.cliques, leads: x.leads.size })).sort((a, b) => b.leads - a.leads || b.cliques - a.cliques),
    porLead: leads,
  };
}
