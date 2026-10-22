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
export const EVENTOS = ["abriu", "viu_precos", "viu_detalhes", "abriu_exemplo", "clicou_whatsapp", "mudou_tela", "pediu_reserva", "rolou_fim", "tempo"];
export const PAGINAS_CONTADAS = ["exemplos", "painel-eventos", "agenda-online", "demo"];
/** Visita à demo de um lead (as outras são do link do Painel Renderiza). */
export const daDemo = v => v.pagina === "demo";

const MODULOS = { "agenda-online": "Agenda online", agenda: "Agenda da equipe", clientes: "Clientes", contratos: "Contratos", financeiro: "Financeiro", atendimento: "Atendimento" };
const TELAS = { inicio: "a visão geral", agenda: "a agenda", clientes: "os clientes", contratos: "os contratos", financeiro: "o financeiro", atendimento: "o atendimento", equipe: "a equipe e acessos" };
const PAGINAS = { exemplos: "a página do painel", "painel-eventos": "o exemplo do painel", "agenda-online": "a agenda online de exemplo", demo: "a demo do site" };
const LUGARES = { exemplos: "Página do Painel Renderiza", "painel-eventos": "Exemplo do painel", "agenda-online": "Agenda online de exemplo" };
/** Onde foi: "Página do Painel Renderiza", "Demo otica-nina"… */
export const lugarDe = v => (daDemo(v) ? "Demo " + (v.demo || "") : LUGARES[v.pagina] || v.pagina).trim();
const reais = v => "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** O que a pessoa fez, em português. Tempo na página não é passo (vira a duração da visita). */
export function textoDoPasso(v) {
  const d = v.detalhe || {};
  switch (v.evento) {
    case "abriu": return "Abriu " + (PAGINAS[v.pagina] || "a página");
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
    default: return v.evento;
  }
}
/** Passos que mostram interesse de verdade (para o resumo). */
const FORTES = new Set(["viu_precos", "clicou_whatsapp", "viu_detalhes", "abriu_exemplo", "pediu_reserva"]);

/** IPs vistos em visitas marcadas como nossas: outra visita com o mesmo IP provavelmente também é nossa. */
export const ipsDaEquipe = visitas => new Set(visitas.filter(v => v.equipe && v.ip).map(v => v.ip));
/** Navegadores que já se marcaram como nossos em alguma visita (de qualquer lead). */
export const visitantesDaEquipe = visitas => new Set(visitas.filter(v => v.equipe && v.visitante).map(v => v.visitante));

/**
 * Visitas de um lead agrupadas: mesmo navegador, sem parar mais de 30 minutos = uma visita (pode passar por
 * mais de uma página). Mais nova primeiro.
 * quem: "equipe" (navegador com o painel da Renderiza), "equipe_ip" (mesmo IP de uma visita nossa) ou "cliente".
 */
export function agruparVisitas(visitas, ipsEquipe = ipsDaEquipe(visitas), visitantesEquipe = visitantesDaEquipe(visitas)) {
  const ordem = [...visitas].sort((a, b) => String(a.criado_em).localeCompare(String(b.criado_em)));
  const grupos = [], abertoPor = new Map();
  for (const v of ordem) {
    const chave = v.visitante || v.sessao || String(v.id);
    const t = Date.parse(v.criado_em);
    let g = abertoPor.get(chave);
    if (!g || t - g.fimMs > 30 * 60000) {
      g = { lead_id: v.lead_id, inicio: v.criado_em, fim: v.criado_em, fimMs: t, visitante: v.visitante, aparelho: v.aparelho, local: v.local, ip: v.ip, equipe: false, passos: [], tempos: new Map() };
      grupos.push(g); abertoPor.set(chave, g);
    }
    g.fim = v.criado_em; g.fimMs = Math.max(g.fimMs, t);
    g.equipe = g.equipe || !!v.equipe;
    if (!g.aparelho && v.aparelho) g.aparelho = v.aparelho;
    if (!g.local && v.local) g.local = v.local;
    if (!g.ip && v.ip) g.ip = v.ip;
    if (v.evento === "tempo") { const k = v.sessao + "/" + v.pagina; g.tempos.set(k, Math.max(g.tempos.get(k) || 0, Number((v.detalhe || {}).s) || 0)); continue; }
    g.passos.push({ evento: v.evento, texto: textoDoPasso(v), em: v.criado_em, forte: FORTES.has(v.evento), pagina: v.pagina, demo: v.demo || "", lugar: lugarDe(v) });
  }
  return grupos.map(g => {
    const segundos = [...g.tempos.values()].reduce((a, b) => a + b, 0);
    const quem = g.equipe || visitantesEquipe.has(g.visitante) ? "equipe" : g.ip && ipsEquipe.has(g.ip) ? "equipe_ip" : "cliente";
    const { tempos, fimMs, ...resto } = g;
    return { ...resto, segundos, quem };
  }).reverse();
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
    .sort((a, b) => String(b.fim).localeCompare(String(a.fim)));
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
