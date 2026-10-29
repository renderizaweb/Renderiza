// As rotas do painel (endereços de verdade, sem #; a Vercel devolve o index.html para todos, ver vercel.json).
//   /entrar              tela de login (sem login)
//   /                    Início
//   /<módulo>            um módulo de src/modulos/index.js
//   /admin[/<parte>]     o Admin (src/admin/index.js)
// Funções puras, testadas em test/rotas.test.mjs. Arquivo comum: mudança só com aviso em missoes.md.

import { MODULOS } from "./modulos/index.js";
import { AREAS_ADMIN } from "./admin/index.js";

/** Telas fora dos módulos. A Missão 2 acrescenta cadastro, convite, esqueci a senha e escolher a conta. */
export const TELAS = {
  entrar: { caminho: "/entrar", semLogin: true, carregar: () => import("./telas/entrar.js") },
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
  if (segunda) return { tipo: "nao-encontrada" };
  const tela = Object.entries(TELAS).find(([, t]) => t.caminho === "/" + primeira);
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
