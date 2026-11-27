// O Estúdio Ciranda (fictício) para o painel de verdade dos exemplos: a conta como o banco devolve (minhas_contas, tirada
// da semente: painel-clientes/supabase/semente), a Lia e a Duda, o site com o conteúdo inicial (o do site de exemplo,
// exemplos/site-fotografia, extraído pelo ferramentas/meu-site/extrair.mjs) e as visitas de exemplo dos Indicadores.
// Tudo inventado; o painel avisa que é exemplo.

export const CONTA = "05cc0504-8c4f-440d-adc9-1d85d2130243";
export const LIA = { pessoa: "7332dddb-8c07-4b90-abba-da667deb4b0d", usuario: "695a01c6-0821-4f27-ab8d-a66eda90abdd", email: "lia@estudio-ciranda.teste" };
export const SITE = "5a1e0c1d-0000-4000-8000-00000000c1a0";
export const CODIGO = "estudio-ciranda";

/** As visitas de exemplo dos últimos `dias` dias (sempre as mesmas, contadas a partir de hoje). */
function indicadores(dias) {
  const n = Math.min(Math.max(Number(dias) || 30, 1), 90);
  const por_dia = Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 864e5), dia = d.toISOString().slice(0, 10);
    const visitas = 9 + ((i * 7 + 3) % 11) + (d.getDay() === 0 || d.getDay() === 6 ? 6 : 0);
    return { dia, visitas, aparelhos: Math.round(visitas * 0.8) };
  });
  const visitas = por_dia.reduce((t, d) => t + d.visitas, 0);
  return {
    visitas, aparelhos: por_dia.reduce((t, d) => t + d.aparelhos, 0), segundos: 74, por_dia,
    secoes: [["inicio", 0.96, 9], ["portfolio", 0.71, 26], ["ensaios", 0.52, 14], ["sobre", 0.38, 8], ["natal", 0.34, 6], ["contato", 0.29, 5]]
      .map(([secao, p, s]) => ({ secao, visitas: Math.round(visitas * p), segundos: Math.round(visitas * p * s) })),
    cliques: [{ nome: "whatsapp", cliques: Math.round(visitas * 0.09) }, { nome: "inicio.botao", cliques: Math.round(visitas * 0.05) }],
    origens: [{ origem: "instagram", visitas: Math.round(visitas * 0.55) }, { origem: "google", visitas: Math.round(visitas * 0.25) }, { origem: "", visitas: Math.round(visitas * 0.2) }],
  };
}

/**
 * As tabelas e as funções do banco de mentira. dominio: o primeiro domínio do site (para onde o editor olha);
 * conteudoInicial: o mapa do site; termos: a versão dos termos já aceita (a bancada do vídeo abre o painel inteiro).
 */
export function dadosDoCiranda({ dominio, conteudoInicial, termos = null }) {
  const conta = {
    conta_id: CONTA, nome: "Estúdio Ciranda", nicho: "fotografia", codigo: "estudio-ciranda", logo: null, cores: { principal: "#8a4a5f" },
    situacao: "ativa", teste_ate: null, ativa_ate: null, liberada: true, ajustes: {}, pessoa_id: LIA.pessoa, dono: true, acessos: {},
    modulos: ["agenda", "atendimento", "clientes", "contratos", "financeiro", "meu-site"], suporte_ate: null,
  };
  const tabelas = {
    contas: [{ id: CONTA, nome: conta.nome, nicho: conta.nicho, codigo: conta.codigo, situacao: "ativa", ajustes: {} }],
    pessoas: [
      { id: LIA.pessoa, conta_id: CONTA, usuario_id: LIA.usuario, nome: "Lia Moreno", cor: "#8a4a5f", papel: "Fotógrafa e proprietária", email: LIA.email, preferencias: {}, dono: true, ativa: true },
      { id: "2fb709c6-1927-4f50-a116-01e7cf03b183", conta_id: CONTA, nome: "Duda Reis", cor: "#2f6f86", papel: "Atendimento e agenda", email: "duda@estudio-ciranda.teste", preferencias: {}, dono: false, ativa: true },
    ],
    sites: [{ id: SITE, conta_id: CONTA, codigo: CODIGO, dominios: [dominio], situacao: "conectado", conteudo_inicial: conteudoInicial }],
    sites_versoes: [], sites_previas: [], equipe_renderiza: [],
    termos_aceites: termos ? [{ usuario_id: LIA.usuario, versao: termos, aceito_em: new Date().toISOString() }] : [],
  };
  const rpc = {
    minhas_contas: () => [conta],
    aceitar_convites: () => null,
    registrar_entrada: () => null,
    site_indicadores: ({ p_dias }) => indicadores(p_dias),
  };
  return { tabelas, rpc, usuario: { id: LIA.usuario, email: LIA.email }, pessoaId: LIA.pessoa };
}
