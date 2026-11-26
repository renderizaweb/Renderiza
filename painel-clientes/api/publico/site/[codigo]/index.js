// GET /api/publico/site/<código> — o que o script do Meu site (dentro do site do cliente) pede: a última versão
// publicada, no contrato v1 (docs/painel-clientes/03-modulo-meu-site.md). 404 quando o site não responde
// (desconectado, versão final, conta não liberada, módulo desligado): o script volta à versão inicial. Cache de
// 1 s na rede, como o Estoque (26/11/2026: com 20 + 10 s, a publicação demorava a aparecer; antes, 17/11, 60 + 300 s):
// o que foi publicado aparece na próxima vez que o site é aberto, e a rede ainda junta as visitas do mesmo segundo.

import { CODIGO, adaptar, cors, resposta, rpc } from "../../_comum.js";

export async function tratar({ metodo, caminho, env }, buscar = fetch) {
  const cabecalhos = cors("GET");
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "GET") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "GET, OPTIONS" });
  const codigo = (caminho.match(/^\/api\/publico\/site\/([^/]+)\/?$/) || [])[1];
  if (!CODIGO.test(codigo || "")) return resposta(400, { erro: "pedido" }, { ...cabecalhos, "Cache-Control": "no-store" });
  const r = await rpc(env, "publico_site", { p_codigo: codigo }, buscar);
  const cache = { "Cache-Control": "public, max-age=0, s-maxage=1" };
  if (r === null) return resposta(404, { erro: "fora" }, { ...cabecalhos, ...cache });
  return resposta(200, r, { ...cabecalhos, ...cache });
}

export default adaptar(tratar);
