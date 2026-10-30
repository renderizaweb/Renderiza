// As rotas do painel (endereços de verdade, sem #; a Vercel devolve o index.html para todos, ver vercel.json).
//   /entrar              tela de login (sem login)
//   /esqueci-a-senha     pedir o link para criar uma senha nova (sem login)
//   /nova-senha          onde o link do e-mail chega (com ou sem login: o link é que abre a sessão)
//   /cadastro            teste de 7 dias grátis (sem login)
//   /convite             onde o link do convite chega (o link abre a sessão; a pessoa cria a senha)
//   /boas-vindas/<código> o convite por link do WhatsApp (Missão 7, D42): a pessoa cria a senha e entra
//   /contas              escolher a conta (quem é de mais de uma)
//   /comecar             o onboarding: as 5 perguntas que criam a conta (09)
//   /                    Início
//   /<módulo>            um módulo de src/modulos/index.js
//   /admin[/<parte>]     o Admin (src/admin/index.js)
// Funções puras, testadas em test/rotas.test.mjs. Arquivo comum: mudança só com aviso em missoes.md.

import { MODULOS } from "./modulos/index.js";
import { AREAS_ADMIN } from "./admin/index.js";

/**
 * Telas fora dos módulos (sem o menu). semLogin: só para quem não entrou (logado, volta para o painel). livre: abre
 * com ou sem login (a própria tela decide). As outras pedem login.
 */
export const TELAS = {
  entrar: { caminho: "/entrar", semLogin: true, carregar: () => import("./telas/entrar.js") },
  esqueciSenha: { caminho: "/esqueci-a-senha", semLogin: true, carregar: () => import("./telas/esqueci-a-senha.js") },
  novaSenha: { caminho: "/nova-senha", livre: true, carregar: () => import("./telas/nova-senha.js") },
  cadastro: { caminho: "/cadastro", semLogin: true, carregar: () => import("./telas/cadastro.js") },
  convite: { caminho: "/convite", livre: true, carregar: () => import("./telas/convite.js") },
  boasVindas: { caminho: "/boas-vindas", livre: true, comCodigo: true, carregar: () => import("./telas/boas-vindas.js") },
  contas: { caminho: "/contas", carregar: () => import("./telas/contas.js") },
  comecar: { caminho: "/comecar", carregar: () => import("./telas/comecar.js") },
};

export function lerRota(caminho) {
  const partes = String(caminho || "/").split("?")[0].split("/").filter(Boolean);
  if (partes.length === 0) return { tipo: "modulo", id: "inicio" };
  const [primeira, segunda, ...resto] = partes;
  if (resto.length) return { tipo: "nao-encontrada" };
  if (primeira === "admin") {
    const id = segunda || AREAS_ADMIN[0].id;
    return AREAS_ADMIN.some(a => a.id === id) ? { tipo: "admin", id } : { tipo: "nao-encontrada" };
  }
  const tela = Object.entries(TELAS).find(([, t]) => t.caminho === "/" + primeira);
  // telas com um código no endereço (/boas-vindas/<código>): só elas aceitam a segunda parte
  if (segunda) return tela && tela[1].comCodigo ? { tipo: "tela", id: tela[0], codigo: segunda } : { tipo: "nao-encontrada" };
  if (tela) return { tipo: "tela", id: tela[0] };
  if (primeira !== "inicio" && MODULOS.some(m => m.id === primeira)) return { tipo: "modulo", id: primeira };
  return { tipo: "nao-encontrada" };
}

export function caminhoDe(rota) {
  if (rota.tipo === "tela") return TELAS[rota.id].caminho;
  if (rota.tipo === "admin") return "/admin/" + rota.id;
  if (rota.tipo === "modulo") return rota.id === "inicio" ? "/" : "/" + rota.id;
  return "/";
}

/** Só aceita voltar para um caminho do próprio painel (nada de "//outro-site" ou "https://…"). */
export function voltaSegura(volta) {
  const v = String(volta || "");
  return /^\/(?![/\\])/.test(v) ? v : "/";
}

/**
 * O que fazer com uma rota: mostrar ou mandar para outro lugar.
 * Sem login, tudo leva ao /entrar (guardando para onde a pessoa ia); logado, o /entrar leva de volta.
 */
export function decidir({ caminho, busca = "", logado }) {
  const rota = lerRota(caminho);
  if (rota.tipo === "tela" && TELAS[rota.id].livre) return { rota };
  const semLogin = rota.tipo === "tela" && TELAS[rota.id].semLogin;
  if (semLogin && logado) {
    return { redirecionar: voltaSegura(new URLSearchParams(busca).get("volta")) };
  }
  if (!semLogin && !logado) {
    const destino = caminho && caminho !== "/" && rota.tipo !== "nao-encontrada" ? "?volta=" + encodeURIComponent(caminho) : "";
    return { redirecionar: TELAS.entrar.caminho + destino };
  }
  return { rota };
}
