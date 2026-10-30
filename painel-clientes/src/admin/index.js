// O registro das partes do Admin (só a equipe Renderiza; 02-produto.md, "Admin"). Nasce completo na Missão 1;
// depois disso, mudança aqui só com aviso em docs/painel-clientes/missoes.md.
//
// Cada parte mora em src/admin/<id>/index.js e exporta `montar(el, contexto)`, como os módulos; a casca do Admin
// (o menu com as partes, sem precisar de conta escolhida) é src/admin/casca.js (Missão 5A). Quem pode entrar no
// Admin é decidido pelo banco (`equipe_renderiza` e RLS): a tela só esconde.

export const AREAS_ADMIN = [
  { id: "contas", nome: "Contas", icone: "inicio", carregar: () => import("./contas/index.js") },
  { id: "modulos", nome: "Módulos", icone: "servicos", carregar: () => import("./modulos/index.js") },
  { id: "pessoas", nome: "Pessoas e acessos", curto: "Pessoas", icone: "equipe", carregar: () => import("./pessoas/index.js") },
  { id: "pagamentos", nome: "Pagamentos", icone: "carteira", carregar: () => import("./pagamentos/index.js") },
  { id: "indicadores", nome: "Indicadores", curto: "Números", icone: "estrela", carregar: () => import("./indicadores/index.js") },
];

export function acharAreaAdmin(id) {
  return AREAS_ADMIN.find(a => a.id === id) || null;
}
