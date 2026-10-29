// GET /api/publico/site/<código> — o que o script do Meu site (dentro do site do cliente) pede: a última versão
// publicada, no contrato v1 (docs/painel-clientes/03-modulo-meu-site.md). 404 quando o site não responde
// (desconectado, versão final, conta não liberada, módulo desligado): o script volta à versão inicial. Cache de
// 60 s na rede: uma publicação aparece em até 1 minuto e a maioria das visitas nem chega ao banco.

import { CODIGO, adaptar, cors, resposta, rpc } from "../../_comum.js";

export async function tratar({ metodo, caminho, env }, buscar = fetch) {
  const cabecalhos = cors("GET");
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "GET") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "GET, OPTIONS" });
  const codigo = (caminho.match(/^\/api\/publico\/site\/([^/]+)\/?$/) || [])[1];
  if (!CODIGO.test(codigo || "")) return resposta(400, { erro: "pedido" }, { ...cabecalhos, "Cache-Control": "no-store" });
  const r = await rpc(env, "publico_site", { p_codigo: codigo }, buscar);
  const cache = { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" };
  if (r === null) return resposta(404, { erro: "fora" }, { ...cabecalhos, ...cache });
  return resposta(200, r, { ...cabecalhos, ...cache });
}

export default adaptar(tratar);
