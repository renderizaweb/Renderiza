// POST /api/publico/agenda/<código>/pedido — o pedido da agenda online, com a pré-reserva de 48 horas.
// Corpo: { nome, whatsapp, email?, tipo?, pacote?, adicionais?, data, turno, convidados?, visita?, mensagem?,
//          website (o campo-isca: robô preenche), tempo (ms desde que a agenda abriu) }.
// Contra robô: campo-isca e tempo mínimo (fingem que deu certo, sem gravar); o banco confere o domínio do site e os
// limites por endereço (embaralhado), WhatsApp e conta. Deu certo: pede o aviso por e-mail ao dono (a função do
// Supabase avisar-pedido) e responde { ok, separada_ate }.

import { CODIGO, adaptar, ambiente, cors, dominioDe, enderecoEmbaralhado, resposta, rpc } from "../../_comum.js";

export const TEMPO_MINIMO = 3000; // ms: ninguém escolhe festa, data, convidados e contato em menos que isso
const STATUS = { fora: 404, dominio: 403, dados: 422, ocupada: 409, limite: 429 };
const CAMPOS = ["nome", "whatsapp", "email", "tipo", "pacote", "adicionais", "data", "turno", "convidados", "visita", "mensagem"];

/** Pede à função do Supabase o aviso ao dono. Falhou ou demorou: o pedido já está gravado e aparece no painel. */
async function avisar(env, pedido, buscar) {
  try {
    const { url, chave } = ambiente(env);
    await buscar(`${url}/functions/v1/avisar-pedido`, {
      method: "POST",
      headers: { apikey: chave, "Content-Type": "application/json" },
      body: JSON.stringify({ pedido }),
      signal: AbortSignal.timeout(3000),
    });
  } catch { /* sem aviso por e-mail desta vez */ }
}

export async function tratar({ metodo, caminho, corpo, origem, ip, env }, buscar = fetch, agora = new Date()) {
  const cabecalhos = { ...cors("POST"), "Cache-Control": "no-store" };
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "POST") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "POST, OPTIONS" });
  const codigo = (caminho.match(/^\/api\/publico\/agenda\/([^/]+)\/pedido\/?$/) || [])[1];
  if (!CODIGO.test(codigo || "")) return resposta(400, { erro: "pedido" }, cabecalhos);
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) return resposta(400, { erro: "pedido" }, cabecalhos);

  const separadaAte = new Date(agora.getTime() + 48 * 3600e3).toISOString();
  if ((corpo.website && String(corpo.website).trim()) || !(Number(corpo.tempo) >= TEMPO_MINIMO)) {
    return resposta(201, { ok: true, separada_ate: separadaAte }, cabecalhos); // robô: finge que deu certo
  }

  const dados = Object.fromEntries(CAMPOS.filter(k => corpo[k] !== undefined).map(k => [k, corpo[k]]));
  const r = await rpc(env, "publico_pedido", {
    p_codigo: codigo,
    p_dados: dados,
    p_dominio: dominioDe(origem),
    p_endereco: enderecoEmbaralhado(ip, codigo, agora),
  }, buscar);
  if (!r || r.ok !== true) {
    const erro = r && STATUS[r.erro] ? r.erro : "dados";
    return resposta(STATUS[erro], { ok: false, erro, ...(r && r.campo ? { campo: r.campo } : {}) }, cabecalhos);
  }
  await avisar(env, r.pedido, buscar);
  return resposta(201, { ok: true, separada_ate: r.separada_ate }, cabecalhos);
}

export default adaptar(tratar);
