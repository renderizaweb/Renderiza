// GET /api/publico/imagens/<conta>/<arquivo>.webp — as imagens do Meu site, servidas pelo endereço do painel (o script
// no site do cliente só aceita imagem do mesmo endereço da API). Vem do Storage público "site-imagens" do projeto
// (produção na Vercel, STG nas prévias e no local). O nome do arquivo muda a cada envio, então o cache é de 1 ano.

import { ambiente } from "../_comum.js";

const CAMINHO = /^\/api\/publico\/imagens\/([0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}\.webp)$/;

export async function tratar({ metodo, caminho, env }, buscar = fetch) {
  if (metodo !== "GET" && metodo !== "HEAD") return { status: 405, corpo: null, cabecalhos: { Allow: "GET, HEAD" } };
  const m = caminho.match(CAMINHO);
  if (!m || m[1].includes("..")) return { status: 404, corpo: null, cabecalhos: { "Cache-Control": "no-store" } };
  const { url } = ambiente(env);
  const r = await buscar(`${url}/storage/v1/object/public/site-imagens/${m[1]}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return { status: r.status === 404 || r.status === 400 ? 404 : 502, corpo: null, cabecalhos: { "Cache-Control": "no-store" } };
  return {
    status: 200,
    corpo: Buffer.from(await r.arrayBuffer()),
    cabecalhos: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  };
}

export default async function handler(req, res, env = process.env) {
  let r;
  try {
    r = await tratar({ metodo: req.method, caminho: new URL(req.url, "http://local").pathname, env });
  } catch {
    r = { status: 502, corpo: null, cabecalhos: { "Cache-Control": "no-store" } };
  }
  res.statusCode = r.status;
  for (const [k, v] of Object.entries(r.cabecalhos)) res.setHeader(k, v);
  res.end(req.method === "HEAD" ? undefined : r.corpo || undefined);
}
