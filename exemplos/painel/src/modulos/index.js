// O registro de todos os módulos do painel. Nasce completo na Missão 1; depois disso, mudança aqui só com aviso
// em docs/painel-clientes/missoes.md (arquivo comum, ver 08-trabalho-em-paralelo.md).
//
// Cada módulo mora na sua pasta (src/modulos/<id>/index.js) e exporta:
//   export async function montar(el, contexto)   desenha o módulo dentro de `el`
// `contexto` traz { banco, sessao, navegar } (ver src/app.js); a Missão 2 acrescenta a conta e o acesso da pessoa.
//
// base: true  → vem em toda conta (não conta como módulo no plano; 02-produto.md, "As partes do painel").
// base: false → módulo que o cliente escolhe; a Renderiza liga e desliga no Admin (tabela `modulos`, 05).
// A Agenda online não tem pasta aqui: ela fica dentro do site do cliente (Missão 4) e os pedidos caem no Atendimento.
// Os nomes por nicho ("Agenda da equipe", "Clientes e entregas") vêm de src/nichos/ (Missão 2).

export const MODULOS = [
  { id: "inicio", nome: "Início", base: true, carregar: () => import("./inicio/index.js") },
  { id: "agenda", nome: "Agenda", base: false, carregar: () => import("./agenda/index.js") },
  { id: "atendimento", nome: "Atendimento", base: false, carregar: () => import("./atendimento/index.js") },
  { id: "clientes", nome: "Clientes", base: false, carregar: () => import("./clientes/index.js") },
  { id: "contratos", nome: "Contratos", base: false, carregar: () => import("./contratos/index.js") },
  { id: "financeiro", nome: "Financeiro", base: false, carregar: () => import("./financeiro/index.js") },
  { id: "meu-site", nome: "Meu site", base: false, carregar: () => import("./meu-site/index.js") },
  { id: "servicos", nome: "Serviços", base: true, carregar: () => import("./servicos/index.js") },
  { id: "equipe", nome: "Equipe e acessos", base: true, carregar: () => import("./equipe/index.js") },
  { id: "configuracoes", nome: "Configurações", base: true, carregar: () => import("./configuracoes/index.js") },
];

export function acharModulo(id) {
  return MODULOS.find(m => m.id === id) || null;
}
