// POST /api/publico/site/<código>/visita — a contagem de uma página aberta no site do cliente (os indicadores do Meu
// site, 03): o script do site manda { v (um sorteio que só vale naquela página), p (o caminho), t ("celular" ou
// "computador"), o? (o site de onde veio), s (segundos à vista), se? ({ parte: segundos }), c? ({ botão: cliques }) },
// 2 segundos depois de abrir, a cada 30 segundos se mudou e quando a página some (navigator.sendBeacon, sem login).
// A API junta o "aparelho": o endereço e o navegador embaralhados com o site e o dia. Nada disso fica guardado, e no
// dia seguinte o mesmo aparelho tem outro valor: dá para contar, não dá para seguir ninguém. Robô não conta.
// Responde sempre 204, sem corpo: quem conta não precisa de resposta, e quem sonda não descobre nada.

import { createHash } from "node:crypto";
import { CODIGO, adaptar, cors, dominioDe, resposta, rpc } from "../../_comum.js";

const ROBO = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|monitor|curl|wget|python|scrapy|axios|node-fetch/i;
const CAMPOS = ["v", "p", "t", "o", "s", "se", "c"];
const diaDeSaoPaulo = agora => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);

/** O aparelho: endereço e navegador embaralhados com o site e o dia (o daqui, não o de Londres). */
export function aparelho(ip, agente, codigo, agora = new Date()) {
  return createHash("sha256").update(`${ip || "?"}|${agente}|${codigo}|${diaDeSaoPaulo(agora)}`).digest("hex").slice(0, 32);
}

export async function tratar({ metodo, caminho, corpo, origem, ip, agente, env }, buscar = fetch, agora = new Date()) {
  const cabecalhos = { ...cors("POST"), "Cache-Control": "no-store" };
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "POST") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "POST, OPTIONS" });
  const codigo = (caminho.match(/^\/api\/publico\/site\/([^/]+)\/visita\/?$/) || [])[1];
  const valido = CODIGO.test(codigo || "") && corpo && typeof corpo === "object" && !Array.isArray(corpo) && agente && !ROBO.test(agente);
  if (valido) {
    const dados = Object.fromEntries(CAMPOS.filter(k => corpo[k] !== undefined).map(k => [k, corpo[k]]));
    try {
      await rpc(env, "publico_visita", { p_codigo: codigo, p_dados: dados, p_dominio: dominioDe(origem), p_aparelho: aparelho(ip, agente, codigo, agora) }, buscar);
    } catch { /* sem contagem desta vez */ }
  }
  return resposta(204, null, cabecalhos);
}

export default adaptar(tratar);
