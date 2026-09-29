// Mapeamento seguro dos dados do painel antigo (banco do artifact do Claude) para o modelo novo.
//
// Regras:
// - Nada é apagado: o documento original inteiro vai para o campo `legado`.
// - Status sem equivalente direto NÃO são convertidos em silêncio: o registro recebe
//   a etapa mais próxima, `revisar = true` e um `revisar_motivo` dizendo o que conferir.
// - Usado em dois lugares: no adaptador do Claude (lê documentos antigos) e na
//   exportação de SQL para importar tudo no Supabase.

import { ehData } from "./modelo.js";

const ETAPA_POR_STATUS = {
  lead: "a_trabalhar",
  pronto: "gravacao_realizada",
  enviado: "demo_enviada",
};
const AMBIGUOS = { respondeu: "Respondeu", conversando: "Conversando", proposta: "Proposta" };

/** Documento de lead ainda no formato antigo? (o formato novo sempre tem `etapa`) */
export const leadEhLegado = doc => doc && !("etapa" in doc);
/** Documento de conteúdo ainda no formato antigo? (o formato novo sempre tem `criado_em`) */
export const conteudoEhLegado = doc => doc && !("criado_em" in doc);

const texto = v => (v == null ? "" : String(v));
const numero = v => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const data = v => (ehData(v) ? v : null);
const instante = v => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null);

function etapaDoLeadAntigo(doc) {
  const st = doc.status;
  const demoPronta = doc.demoStatus === "pronta" || (doc.demoStatus == null && doc.demo === true);
  const gravado = doc.videoStatus === "gravado" || (doc.videoStatus == null && doc.video === true);

  if (st === "fechado") return { etapa: "finalizado", resultado: "ganho" };
  if (st === "perdido") return { etapa: "finalizado", resultado: "perda" };
  if (st in AMBIGUOS) {
    return { etapa: "follow_up", revisar: `No painel antigo o status era "${AMBIGUOS[st]}", que não existe mais. Foi para Follow-up; confira a etapa.` };
  }
  if (st === "producao") {
    if (demoPronta && gravado) return { etapa: "gravacao_realizada" };
    if (demoPronta) return { etapa: "demo_criada" };
    return { etapa: "a_trabalhar" };
  }
  if (st in ETAPA_POR_STATUS) {
    const etapa = ETAPA_POR_STATUS[st];
    if (st === "lead" && (demoPronta || gravado)) {
      return { etapa, revisar: 'No painel antigo estava como "Lead", mas com demo ou vídeo marcados como prontos. Confira a etapa.' };
    }
    return { etapa };
  }
  // Primeira versão do painel: campo `situacao` + caixas demo/vídeo/enviado.
  if (st == null) {
    const s = doc.situacao;
    if (s === "fechado") return { etapa: "finalizado", resultado: "ganho" };
    if (s === "perdido") return { etapa: "finalizado", resultado: "perda" };
    if (s === "conversa" || s === "proposta") {
      return { etapa: "follow_up", revisar: `No painel antigo a situação era "${s}". Foi para Follow-up; confira a etapa.` };
    }
    if (s === "aguardando" || doc.enviado === true) return { etapa: "demo_enviada" };
    if (demoPronta && gravado) return { etapa: "gravacao_realizada" };
    if (demoPronta) return { etapa: "demo_criada" };
    return { etapa: "a_trabalhar" };
  }
  return { etapa: "a_trabalhar", revisar: `Status antigo desconhecido ("${st}"). Ficou em Leads a trabalhar; confira a etapa.` };
}

/** Documento antigo de lead → linha no formato novo (colunas da tabela `leads`). */
export function migrarLead(doc, id) {
  const e = etapaDoLeadAntigo(doc);
  const historico = Array.isArray(doc.historico)
    ? doc.historico.filter(h => h && (h.t || h.texto)).map(h => ({ em: h.d || h.em || null, texto: String(h.t || h.texto) }))
    : [];
  return {
    id,
    empresa: texto(doc.nome),
    etapa: e.etapa,
    resultado: e.resultado || null,
    motivo_perda: null,
    valor_fechado: e.resultado === "ganho" ? numero(doc.valorFechado) : null,
    data_fechamento: e.etapa === "finalizado" ? data(doc.dataFechamento) || data((doc.fechadoEm || doc.perdidoEm || "").slice(0, 10)) : null,
    whatsapp: texto(doc.whatsapp),
    instagram: texto(doc.instagram),
    proxima_acao: texto(doc.proximaAcao),
    followup_em: data(doc.followup),
    valor_potencial: numero(doc.valor),
    cidade: texto(doc.cidade),
    segmento: texto(doc.segmento),
    site_atual: texto(doc.siteAtual),
    link_demo: texto(doc.linkDemo),
    link_gravacao: texto(doc.linkVideo),
    observacoes: texto(doc.obs),
    historico,
    revisar: !!e.revisar,
    revisar_motivo: e.revisar || null,
    legado: doc,
    // O painel antigo não sabia de interesse nem de interações: começa "Não avaliado" e sem primeiro contato.
    // (datas como ultimoContato/enviadoEm ficam só em `legado`; a tela Ritmo mostra como pista, sem contar.)
    interesse: "nao_avaliado",
    interesse_motivo: null,
    nao_contatar: false,
    criado_em: instante(doc.criadoEm) || new Date().toISOString(),
    atualizado_em: instante(doc.atualizadoEm) || instante(doc.criadoEm) || new Date().toISOString(),
  };
}

/** Lead no formato novo, com os campos que surgiram depois preenchidos pelo padrão. */
export function completarLead(l) {
  return {
    ...l,
    historico: Array.isArray(l.historico) ? l.historico : [],
    interesse: l.interesse || "nao_avaliado",
    interesse_motivo: l.interesse_motivo || null,
    nao_contatar: !!l.nao_contatar,
  };
}

const CANAL_ANTIGO = { "Instagram Renderiza": "instagram", "LinkedIn Kaue": "linkedin", "Portfólio": "portfolio" };
const STATUS_ANTIGO = { ideia: "ideia", produzindo: "em_producao", publicado: "publicado" };

/** Documento antigo de conteúdo → linha no formato novo (colunas da tabela `conteudos`). */
export function migrarConteudo(doc, id) {
  const avisos = [];
  let status = STATUS_ANTIGO[doc.status];
  if (!status) {
    if (doc.status === "pronto") { status = "em_producao"; avisos.push('status antigo "Pronto" virou "Em produção"'); }
    else { status = "ideia"; if (doc.status) avisos.push(`status antigo "${doc.status}" virou "Ideia"`); }
  }
  let canal = CANAL_ANTIGO[doc.canal] || null;
  if (!canal && doc.canal) { canal = "outro"; avisos.push(`canal antigo "${doc.canal}" virou "Outro"`); }
  return {
    id,
    titulo: texto(doc.titulo),
    canal,
    status,
    data_planejada: data(doc.dataPlanejada),
    link_publicacao: texto(doc.linkPublicado),
    texto: texto(doc.texto),
    gancho: texto(doc.gancho),
    cta: texto(doc.cta),
    link_imagem: texto(doc.linkImagem),
    link_video: texto(doc.linkVideo),
    observacoes: texto(doc.obs),
    revisar: avisos.length > 0,
    revisar_motivo: avisos.length ? "No painel antigo: " + avisos.join("; ") + ". Confira." : null,
    legado: doc,
    criado_em: instante(doc.criadoEm) || new Date().toISOString(),
    atualizado_em: instante(doc.atualizadoEm) || instante(doc.criadoEm) || new Date().toISOString(),
  };
}

/* ---------- Exportação para o Supabase ---------- */

const COLUNAS_LEADS = ["id", "empresa", "etapa", "resultado", "motivo_perda", "valor_fechado", "data_fechamento", "whatsapp", "instagram", "proxima_acao", "followup_em", "valor_potencial", "cidade", "segmento", "site_atual", "link_demo", "link_gravacao", "observacoes", "historico", "revisar", "revisar_motivo", "legado", "posicao", "interesse", "interesse_motivo", "nao_contatar", "criado_em", "atualizado_em"];
const COLUNAS_INTERACOES = ["id", "lead_id", "tipo", "ocorreu_em", "precisao", "canal", "resumo", "interesse", "previsto_para", "origem", "criado_em", "atualizado_em"];
const COLUNAS_CICLOS = ["id", "nome", "inicio", "fim", "meta_novas", "dias_primeiro_retorno", "dias_segundo_retorno", "criado_em", "atualizado_em"];
const COLUNAS_CONTEUDOS = ["id", "titulo", "canal", "status", "data_planejada", "link_publicacao", "texto", "gancho", "cta", "link_imagem", "link_video", "observacoes", "revisar", "revisar_motivo", "legado", "posicao", "criado_em", "atualizado_em"];
const JSONB = new Set(["historico", "legado"]);

function literal(v, coluna) {
  if (v === null || v === undefined) return "null";
  if (JSONB.has(coluna)) return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function inserts(tabela, colunas, linhas) {
  if (!linhas.length) return `  -- nenhum registro em ${tabela}\n`;
  const valores = linhas.map(l => "    (" + colunas.map(c => literal(l[c], c)).join(", ") + ", v_dono)").join(",\n");
  return `  insert into public.${tabela} (${colunas.join(", ")}, dono) values\n${valores}\n  on conflict (id) do nothing;\n`;
}

/**
 * Gera o SQL que importa os dados atuais no Supabase.
 * @param {{leads: {id:string, doc:object}[], conteudos: {id:string, doc:object}[], interacoes?: {id:string, doc:object}[],
 *          ciclos?: {id:string, doc:object}[], outras: Record<string, {id:string, doc:object}[]>}} colecoes
 * Pode ser executado mais de uma vez: registros que já existem são ignorados (on conflict do nothing).
 */
export function gerarSqlDeImportacao(colecoes, geradoEm = new Date()) {
  const leads = colecoes.leads.map(({ id, doc }) => (leadEhLegado(doc) ? migrarLead(doc, id) : completarLead({ ...doc, id })));
  const idsDeLeads = new Set(leads.map(l => l.id));
  const todasInteracoes = (colecoes.interacoes || []).map(({ id, doc }) => ({ precisao: "exata", origem: "painel", resumo: "", ...doc, id }));
  // Primeiros contatos antes dos retornos, para as regras do banco aceitarem a ordem.
  const interacoes = todasInteracoes.filter(i => idsDeLeads.has(i.lead_id))
    .sort((a, b) => (a.tipo === "primeiro_contato" ? 0 : 1) - (b.tipo === "primeiro_contato" ? 0 : 1) || String(a.ocorreu_em || "").localeCompare(String(b.ocorreu_em || "")));
  const orfas = todasInteracoes.length - interacoes.length;
  const ciclos = (colecoes.ciclos || []).map(({ id, doc }) => ({ dias_primeiro_retorno: 7, dias_segundo_retorno: 21, ...doc, id }));
  const conteudos = colecoes.conteudos.map(({ id, doc }) => (conteudoEhLegado(doc) ? migrarConteudo(doc, id) : { ...doc, id }));
  const outras = Object.entries(colecoes.outras || {}).flatMap(([colecao, docs]) => docs.map(({ id, doc }) => ({ colecao, id, doc })));
  const revisar = [...leads, ...conteudos].filter(l => l.revisar);
  const resumo = [
    `-- ${leads.length} leads, ${interacoes.length} interações, ${ciclos.length} ciclo(s), ${conteudos.length} conteúdos, ${outras.length} documentos arquivados (${[...new Set(outras.map(o => o.colecao))].join(", ") || "nenhum"}).`,
    ...(orfas ? [`-- ${orfas} interação(ões) de óticas que não existem mais ficaram de fora.`] : []),
    revisar.length ? `-- ${revisar.length} registro(s) marcados para revisão: ${revisar.map(r => r.empresa || r.titulo).join(", ")}.` : "-- Nenhum registro precisou ser marcado para revisão.",
  ].join("\n");
  const arquivo = outras.length
    ? `  insert into public.arquivo_legado (colecao, doc_id, dados, dono) values\n${outras.map(o => `    (${literal(o.colecao)}, ${literal(o.id)}, ${literal(o.doc, "legado")}, v_dono)`).join(",\n")}\n  on conflict (colecao, doc_id) do nothing;\n`
    : "  -- nenhum documento para arquivar\n";
  return `-- Importação dos dados do painel antigo (banco do artifact) para o Supabase.
-- Gerado em ${geradoEm.toISOString()}.
${resumo}
--
-- Antes de rodar: execute supabase/schema.sql e crie seu usuário em Authentication > Users.
-- Pode rodar mais de uma vez: o que já foi importado é ignorado.

do $$
declare
  v_dono uuid;
  v_total int;
begin
  select count(*) into v_total from auth.users;
  if v_total = 0 then
    raise exception 'Nenhum usuário encontrado. Crie o seu em Authentication > Users e rode de novo.';
  elsif v_total > 1 then
    raise exception 'Há % usuários neste projeto. Troque a linha "select id into v_dono" abaixo por: select id into v_dono from auth.users where email = ''seu@email'';', v_total;
  end if;
  select id into v_dono from auth.users limit 1;

${inserts("leads", COLUNAS_LEADS, leads)}
${inserts("interacoes", COLUNAS_INTERACOES, interacoes)}
${inserts("ciclos", COLUNAS_CICLOS, ciclos)}
${inserts("conteudos", COLUNAS_CONTEUDOS, conteudos)}
${arquivo}end $$;
`;
}
