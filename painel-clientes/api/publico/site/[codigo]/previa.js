// GET /api/publico/site/<código>/previa?t=<código da prévia> — o rascunho, para o cliente ver no site de verdade antes
// de publicar ("Ver no meu site" do painel abre o site com ?rz-previa=<código>). Sem cache; 404 depois que a prévia
// expira.

import { CODIGO, adaptar, cors, resposta, rpc } from "../../_comum.js";

const PREVIA = /^[a-z0-9]{16,64}$/; // o de sites_previas.codigo

export async function tratar({ metodo, caminho, busca, env }, buscar = fetch) {
  const cabecalhos = { ...cors("GET"), "Cache-Control": "no-store" };
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "GET") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "GET, OPTIONS" });
  const codigo = (caminho.match(/^\/api\/publico\/site\/([^/]+)\/previa\/?$/) || [])[1];
  const previa = busca.get("t") || "";
  if (!CODIGO.test(codigo || "") || !PREVIA.test(previa)) return resposta(400, { erro: "pedido" }, cabecalhos);
  const r = await rpc(env, "publico_previa", { p_codigo: codigo, p_previa: previa }, buscar);
  if (r === null) return resposta(404, { erro: "fora" }, cabecalhos);
  return resposta(200, r, cabecalhos);
}

export default adaptar(tratar);
