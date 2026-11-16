// GET /api/publico/agenda/<código>?de=AAAA-MM-DD&ate=AAAA-MM-DD — a agenda online do site: os dias com turno e se
// cada um está livre, mais os tipos de festa, os pacotes e os adicionais (sem preço). 404 quando o site não responde
// (desconectado, conta não liberada, módulo desligado). Cache curto na rede: o pedido confere a data de novo.
// Fotografia: com &horarios=1 (ou &servico=<id do ensaio>, ou &campanha=<id>), os horários de início livres de cada
// dia, os ensaios e as campanhas com as vagas que restam (publico_horarios; 404 também se a conta não é de fotografia).

import { CODIGO, adaptar, cors, resposta, rpc } from "../../_comum.js";

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function tratar({ metodo, caminho, busca, env }, buscar = fetch) {
  const cabecalhos = cors("GET");
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "GET") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "GET, OPTIONS" });
  const codigo = (caminho.match(/^\/api\/publico\/agenda\/([^/]+)\/?$/) || [])[1];
  const de = busca.get("de"), ate = busca.get("ate"), servico = busca.get("servico"), campanha = busca.get("campanha");
  if (!CODIGO.test(codigo || "") || (de && !DATA.test(de)) || (ate && !DATA.test(ate))
      || (servico && !ID.test(servico)) || (campanha && !ID.test(campanha))) {
    return resposta(400, { erro: "pedido" }, { ...cabecalhos, "Cache-Control": "no-store" });
  }
  const r = busca.has("horarios") || servico || campanha
    ? await rpc(env, "publico_horarios", { p_codigo: codigo, p_de: de || null, p_ate: ate || null, p_servico: servico || null, p_campanha: campanha || null }, buscar)
    : await rpc(env, "publico_disponibilidade", { p_codigo: codigo, p_de: de || null, p_ate: ate || null }, buscar);
  if (r === null) return resposta(404, { erro: "fora" }, { ...cabecalhos, "Cache-Control": "public, max-age=0, s-maxage=60" });
  return resposta(200, r, { ...cabecalhos, "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=40" });
}

export default adaptar(tratar);
