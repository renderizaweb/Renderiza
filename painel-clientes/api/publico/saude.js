// GET /api/publico/saude — o painel e o banco estão de pé? Para o aviso automático (04, Acompanhamento) e para
// conferir na mão. Pergunta ao banco por um site que não existe: a resposta (vazia) prova que ele respondeu.

import { adaptar, cors, resposta, rpc } from "./_comum.js";

export async function tratar({ metodo, env }, buscar = fetch) {
  const cabecalhos = { ...cors("GET"), "Cache-Control": "no-store" };
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "GET") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "GET, OPTIONS" });
  const inicio = Date.now();
  try {
    await rpc(env, "publico_disponibilidade", { p_codigo: "saude-do-painel", p_de: null, p_ate: null }, buscar);
    return resposta(200, { ok: true, banco: true, ms: Date.now() - inicio }, cabecalhos);
  } catch {
    return resposta(503, { ok: false, banco: false }, cabecalhos);
  }
}

export default adaptar(tratar);
