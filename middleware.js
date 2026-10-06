// Trava das demos (Routing Middleware da Vercel): antes de abrir /demo/<pasta>, pergunta ao Supabase
// se a demo está no ar (função demo_liberada, tabela demos). Fora do ar ou vencida, responde com a
// página "demo fora do ar" (410); no ar, deixa a Vercel entregar o arquivo normalmente.
// O prazo se muda no painel, no card do lead (seção Demo). Regras: CONTEXTO.md, "Prazo das demos".
//
// Na dúvida, abre: sem configuração, banco fora ou resposta estranha, a demo aparece. Só fica fora
// do ar quando o banco diz que está fora.

import site from "./site/config.mjs";

export const config = { matcher: ["/demo/:path*"] };

const TEMPO_MAXIMO = 2500; // ms; passou disso, abre a demo

/** "/demo/otica-sales/artes-instagram" -> "otica-sales". Fora de /demo/<pasta>, "". */
export function pastaDoCaminho(caminho) {
  const m = /^\/demo\/([a-z0-9][a-z0-9-]{0,79})(?:\/|\.html$|$)/i.exec(String(caminho || ""));
  return m ? m[1].toLowerCase() : "";
}

/** true = no ar, false = fora do ar, null = não deu para saber (aí a demo abre). */
export async function demoLiberada(pasta, { url, chave, buscar = fetch, tempo = TEMPO_MAXIMO }) {
  const cabecalhos = { apikey: chave, "Content-Type": "application/json", Accept: "application/json" };
  // Chave antiga (JWT anon) vai também no Authorization; a nova (sb_publishable_) vai só no apikey.
  if (chave.split(".").length === 3) cabecalhos.Authorization = "Bearer " + chave;
  try {
    const r = await buscar(url.replace(/\/+$/, "") + "/rest/v1/rpc/demo_liberada", {
      method: "POST", headers: cabecalhos, body: JSON.stringify({ pasta }), signal: AbortSignal.timeout(tempo),
    });
    if (!r.ok) return null;
    const v = await r.json();
    return typeof v === "boolean" ? v : null;
  } catch (e) {
    return null;
  }
}

export function paginaForaDoAr() {
  // Quem abre um link vencido é a ótica: o botão já puxa a conversa de volta.
  const texto = encodeURIComponent("Oi! Tentei abrir a demo do site que vocês me mandaram e ela saiu do ar. Consegue liberar de novo?");
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Demo fora do ar · Renderiza</title>
<style>
:root{--fundo:#f6f7f4;--cartao:#fff;--tinta:#16201a;--suave:#5b6660;--verde:#1f7a4d;--borda:#e1e6e1}
@media (prefers-color-scheme:dark){:root{--fundo:#121614;--cartao:#1b201d;--tinta:#eef2ee;--suave:#a7b2ab;--verde:#4fc488;--borda:#2b332e}}
*{box-sizing:border-box;margin:0}
body{min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:var(--fundo);color:var(--tinta);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:440px;width:100%;background:var(--cartao);border:1px solid var(--borda);border-radius:18px;padding:32px 28px;text-align:center}
.marca{font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:13px;color:var(--verde)}
h1{font-size:24px;line-height:1.25;margin:14px 0 10px}
p{color:var(--suave)}
a.botao{display:inline-block;margin-top:22px;background:var(--verde);color:#fff;text-decoration:none;font-weight:600;padding:13px 22px;border-radius:999px}
@media (prefers-color-scheme:dark){a.botao{color:#0d1a12}}
</style></head>
<body><main>
<p class="marca">Renderiza</p>
<h1>Esta demonstração saiu do ar</h1>
<p>O link da demo do site tinha prazo e venceu. Se quiser ver de novo, é só chamar que a gente libera.</p>
<a class="botao" href="https://wa.me/${site.contato.whatsapp}?text=${texto}">Pedir pelo WhatsApp</a>
</main></body></html>`;
}

export default async function middleware(request) {
  try {
    const pasta = pastaDoCaminho(new URL(request.url).pathname);
    if (!pasta) return;
    const env = typeof process !== "undefined" ? process.env : {};
    const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
    const chave = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    if (!url || !chave) return;
    if ((await demoLiberada(pasta, { url, chave })) !== false) return; // segue para o arquivo da demo
    return new Response(request.method === "HEAD" ? null : paginaForaDoAr(), {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch (e) {
    return; // erro aqui nunca derruba a demo
  }
}
