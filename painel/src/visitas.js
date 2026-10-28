// Visitas ao link do Painel Renderiza (/exemplos?c=<código do lead>) e às demos (/demo/<pasta>), gravadas na
// tabela visitas pelo contador da página (exemplos/visitas.js → api/visita.js → registrar_visita). Aqui: o link
// de cada lead, o "mapa de interação" (cada visita com o que a pessoa fez), separando o cliente de nós mesmos, e
// a linha do tempo de todos os leads (tela Atividade).

export const SITE = "https://www.renderizaweb.com.br";
/** O link vai para os leads de eventos (o painel de exemplo é de espaço de eventos). */
export const mostraPainel = l => !!l && !!l.codigo && /event|buffet|festa|chácara|chacara|sítio|sitio/i.test(String(l.segmento || ""));
export const linkDoPainel = l => (l && l.codigo ? `${SITE}/exemplos?c=${l.codigo}` : "");
export const linkCurto = l => linkDoPainel(l).replace(/^https:\/\/www\./, "");

/** Os passos que a página manda (os mesmos da tabela visitas e da função registrar_visita do supabase/schema.sql). */
export const EVENTOS = ["abriu", "viu_precos", "viu_detalhes", "abriu_exemplo", "clicou_whatsapp", "clicou", "mudou_tela", "pediu_reserva", "rolou_fim", "tempo"];
export const PAGINAS_CONTADAS = ["exemplos", "painel-eventos", "agenda-online", "demo"];
/** Visita à demo de um lead (as outras são do link do Painel Renderiza). */
export const daDemo = v => v.pagina === "demo";

const MODULOS = { "agenda-online": "Agenda online", agenda: "Agenda da equipe", clientes: "Clientes", contratos: "Contratos", financeiro: "Financeiro", atendimento: "Atendimento" };
const TELAS = { inicio: "a visão geral", agenda: "a agenda", clientes: "os clientes", contratos: "os contratos", financeiro: "o financeiro", atendimento: "o atendimento", equipe: "a equipe e acessos" };
const PAGINAS = { exemplos: "a página do painel", "painel-eventos": "o exemplo do painel", "agenda-online": "a agenda online de exemplo", demo: "a demo do site" };
/** Outras páginas de uma demo (detalhe.sub do "abriu"). */
const SUBPAGINAS = { natal: "a página de Natal da demo", "artes-instagram": "as artes para Instagram da demo" };
const LUGARES = { exemplos: "Página do Painel Renderiza", "painel-eventos": "Exemplo do painel", "agenda-online": "Agenda online de exemplo" };
/** Onde foi: "Página do Painel Renderiza", "Demo otica-nina"… */
export const lugarDe = v => (daDemo(v) ? "Demo " + (v.demo || "") : LUGARES[v.pagina] || v.pagina).trim();
const reais = v => "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** O que a pessoa fez, em português. Tempo na página não é passo (vira a duração da visita). */
export function textoDoPasso(v) {
  const d = v.detalhe || {};
  switch (v.evento) {
    case "abriu": return "Abriu " + (daDemo(v) && d.sub ? SUBPAGINAS[d.sub] || `a página "${d.sub}" da demo` : PAGINAS[v.pagina] || "a página");
    case "viu_precos": return "Chegou nos preços";
    case "viu_detalhes": return "Viu os detalhes de " + (MODULOS[d.m] || "um módulo");
    case "abriu_exemplo": return d.qual === "agenda online" ? "Foi testar a agenda online" : "Foi ver no exemplo " + (TELAS[d.qual] || "o painel");
    case "mudou_tela": return "No exemplo, abriu " + (TELAS[d.tela] || "outra tela");
    case "clicou_whatsapp": {
      if (daDemo(v)) return "Clicou no WhatsApp da loja, na demo";
      const mods = Array.isArray(d.modulos) ? d.modulos.map(m => MODULOS[m] || m) : [];
      return mods.length ? `Clicou no WhatsApp com o plano: ${mods.join(", ")}${d.total ? ` (${reais(d.total)}/mês)` : ""}` : "Clicou no WhatsApp";
    }
    case "pediu_reserva": return "Testou a agenda online até o fim (pré-reserva de teste)";
    case "rolou_fim": return "Rolou até o fim d" + (v.pagina === "exemplos" ? "a página" : v.pagina === "agenda-online" ? "a agenda" : daDemo(v) ? "a demo" : "o exemplo");
    case "clicou": {
      const onde = d.parte ? ` (em ${d.parte})` : "";
      if (d.alvo === "menu") return "Pelo menu, foi para " + (d.para || "outra parte");
      if (d.alvo === "botao") return `Clicou em "${d.texto || "um botão"}"` + onde;
      if (d.alvo === "link") return "Abriu um link" + (d.para ? ` (${d.para})` : "");
      if (d.alvo === "oferta") return (d.texto === "negociar" ? 'Clicou em "Negociar"' : 'Clicou em "Garantir o meu"') + " (WhatsApp da Renderiza)" + onde;
      return (CLIQUES[d.alvo] || "Clicou em algo") + onde;
    }
    default: return v.evento;
  }
}
const CLIQUES = { instagram: "Abriu o Instagram da loja", facebook: "Abriu o Facebook da loja", tiktok: "Abriu o TikTok da loja", rota: "Pediu a rota até a loja",
  mapa: "Abriu o mapa", avaliacoes: "Foi ver as avaliações no Google", avaliar: "Foi deixar uma avaliação no Google", telefone: "Tocou para ligar", email: "Tocou no e-mail" };
/** Passos que mostram interesse de verdade (para o resumo). */
const FORTES = new Set(["viu_precos", "clicou_whatsapp", "viu_detalhes", "abriu_exemplo", "pediu_reserva"]);
const CLIQUES_FORTES = new Set(["instagram", "rota", "mapa", "avaliacoes", "telefone", "oferta"]);
const forte = v => FORTES.has(v.evento) || (v.evento === "clicou" && CLIQUES_FORTES.has((v.detalhe || {}).alvo));

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
  return grupos.map(g => {
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
  }).reverse();
}

/** Ainda com a página aberta: a última notícia tem menos de 75 s (a página manda a cada 30 s) e não avisou que saiu. */
export const vendoAgora = (g, agora = Date.now()) => !g.saiu && agora - Date.parse(g.fim) < 75000;

const juntar = l => (l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]);
const ALVOS = { instagram: "abriu o Instagram", facebook: "abriu o Facebook", tiktok: "abriu o TikTok", rota: "pediu a rota até a loja", mapa: "abriu o mapa",
  avaliacoes: "foi ver as avaliações", avaliar: "foi avaliar no Google", telefone: "tocou para ligar", email: "tocou no e-mail",
  oferta: "clicou na oferta da Renderiza" };
const ABERTURAS = { demo: "abriu a demo", exemplos: "abriu o link do painel", "painel-eventos": "viu o exemplo do painel", "agenda-online": "abriu a agenda online" };
// O que pode sair da frase quando ela fica longa (o resto continua nos detalhes).
const MENOS_IMPORTANTE = ["botoes", "menu", "telas", "fim", "clicou:mapa", "clicou:email", "clicou:facebook", "clicou:tiktok"];

/**
 * A visita numa frase, sem termo técnico: "abriu a demo, viu até o fim e clicou no WhatsApp da loja". Na ordem
 * em que aconteceu, no máximo 4 coisas (o que é menos importante sai primeiro; tudo fica nos detalhes).
 */
export function fraseDaVisita(g) {
  const itens = new Map(), modulos = new Set();
  let telas = 0, botoes = 0, ultimoBotao = "";
  const add = (chave, texto) => { if (!itens.has(chave)) itens.set(chave, texto); };
  for (const p of g.passos) {
    const d = p.detalhe || {};
    if (p.evento === "abriu") add("abriu:" + p.pagina, () => ABERTURAS[p.pagina] || "abriu a página");
    else if (p.evento === "abriu_exemplo") { const pg = d.qual === "agenda online" ? "agenda-online" : "painel-eventos"; add("abriu:" + pg, () => ABERTURAS[pg]); }
    else if (p.evento === "mudou_tela") { telas++; add("telas", () => (telas > 1 ? `passou por ${telas} telas do exemplo` : "mudou de tela no exemplo")); }
    else if (p.evento === "viu_precos") add("precos", () => "chegou nos preços");
    else if (p.evento === "viu_detalhes") { modulos.add(MODULOS[d.m] || d.m || "um módulo"); add("detalhes", () => (modulos.size === 1 ? "viu os detalhes de " + [...modulos][0] : `viu os detalhes de ${modulos.size} módulos`)); }
    else if (p.evento === "pediu_reserva") add("reserva", () => "fez uma reserva de teste");
    else if (p.evento === "rolou_fim") add("fim", () => (p.pagina === "demo" ? "viu até o fim" : "rolou até o fim"));
    else if (p.evento === "clicou_whatsapp") add("whatsapp", () => (p.pagina === "demo" ? "clicou no WhatsApp da loja" : "clicou no WhatsApp"));
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
