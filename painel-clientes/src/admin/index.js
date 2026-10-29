// O registro das partes do Admin (só a equipe Renderiza; 02-produto.md, "Admin"). Nasce completo na Missão 1;
// depois disso, mudança aqui só com aviso em docs/painel-clientes/missoes.md.
//
// Cada parte mora em src/admin/<id>/index.js e exporta `montar(el, contexto)`, como os módulos.
// Quem pode entrar no Admin é decidido pelo banco (`equipe_renderiza` e RLS, Missões 2 e 5); por enquanto
// as partes estão vazias e não leem nada.

export const AREAS_ADMIN = [
  { id: "contas", nome: "Contas", carregar: () => import("./contas/index.js") },
  { id: "modulos", nome: "Módulos", carregar: () => import("./modulos/index.js") },
  { id: "pessoas", nome: "Pessoas e acessos", carregar: () => import("./pessoas/index.js") },
  { id: "pagamentos", nome: "Pagamentos", carregar: () => import("./pagamentos/index.js") },
  { id: "indicadores", nome: "Indicadores", carregar: () => import("./indicadores/index.js") },
];

export function acharAreaAdmin(id) {
  return AREAS_ADMIN.find(a => a.id === id) || null;
}
