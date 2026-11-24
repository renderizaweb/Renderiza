// GET /api/publico/estoque/<código> — o estoque que o site do cliente mostra (docs/painel-clientes/12-modulo-estoque.md,
// "Contrato v1", item 2): só disponível e reservado, já na ordem. 404 quando o site não responde (desconectado, conta
// não liberada, Estoque desligado): o script do site fica com a versão de reserva, sem preço. Cache de 20 s na rede
// (mais 10 s servindo a anterior enquanto busca a nova), como o Meu site: uma mudança aparece em menos de 1 minuto e a
// maioria das visitas nem chega ao banco. As fotos saem como caminho desta API (/api/publico/imagens/…): o script
// completa com o endereço que chamou, então o local, o STG e a produção funcionam igual.

import { CODIGO, adaptar, cors, resposta, rpc } from "../../_comum.js";

const IMAGENS = "/api/publico/imagens/";
const ARQUIVO = /^[0-9a-f-]{36}\/estoque-[A-Za-z0-9_-]{6,80}\.webp$/;

function foto(f) {
  if (!f || !ARQUIVO.test(f.arquivo || "")) return null;
  const url = IMAGENS + f.arquivo;
  return { url, mini: ARQUIVO.test(f.mini || "") ? IMAGENS + f.mini : url, w: Number(f.w) || 0, h: Number(f.h) || 0 };
}

/** Só o que o contrato promete, nada a mais (o banco já filtra; isto é a segunda trava). */
export function paraOSite(r) {
  return {
    versao: 1,
    esquema: String(r.esquema || ""),
    atualizado_em: r.atualizado_em || null,
    itens: (Array.isArray(r.itens) ? r.itens : [])
      .filter(i => i && (i.situacao === "disponivel" || i.situacao === "reservado"))
      .map(i => ({
        id: i.id, situacao: i.situacao, destaque: !!i.destaque,
        preco: i.preco == null ? null : Number(i.preco), preco_antes: i.preco_antes == null ? null : Number(i.preco_antes),
        quantidade: i.quantidade == null ? 1 : Number(i.quantidade),
        selos: Array.isArray(i.selos) ? i.selos : [], descricao: String(i.descricao || ""),
        campos: i.campos && typeof i.campos === "object" && !Array.isArray(i.campos) ? i.campos : {},
        fotos: (Array.isArray(i.fotos) ? i.fotos : []).map(foto).filter(Boolean),
      })),
  };
}

export async function tratar({ metodo, caminho, env }, buscar = fetch) {
  const cabecalhos = cors("GET");
  if (metodo === "OPTIONS") return resposta(204, null, cabecalhos);
  if (metodo !== "GET") return resposta(405, { erro: "metodo" }, { ...cabecalhos, Allow: "GET, OPTIONS" });
  const codigo = (caminho.match(/^\/api\/publico\/estoque\/([^/]+)\/?$/) || [])[1];
  if (!CODIGO.test(codigo || "")) return resposta(400, { erro: "pedido" }, { ...cabecalhos, "Cache-Control": "no-store" });
  const r = await rpc(env, "publico_estoque", { p_codigo: codigo }, buscar);
  const cache = { "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=10" };
  if (r === null) return resposta(404, { erro: "fora" }, { ...cabecalhos, ...cache });
  return resposta(200, paraOSite(r), { ...cabecalhos, ...cache });
}

export default adaptar(tratar);
