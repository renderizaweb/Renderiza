// Trava das demos (Routing Middleware da Vercel): antes de abrir /demo/<pasta>, pergunta ao Supabase
// se a demo está no ar (função demo_situacao, tabela demos; se ela falhar, a antiga demo_liberada). Fora do ar
// ou vencida, responde com a página "demo fora do ar" (410); no ar, deixa a Vercel entregar o arquivo normalmente.
// Demo vencida que nunca foi reaberta pelo link mostra o botão "Reabrir por 1 hora" (api/reabrir-demo.js, uma
// vez por demo; depois, só pelo painel). A página tem o contador de visitas: a volta da pessoa aparece no painel.
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

/**
 * { liberada, motivo, pode_reabrir } da função demo_situacao, ou null se não deu para saber.
 * motivo: "no_ar" | "reaberta" (dentro da 1 hora) | "vencida" | "fora" (desligada no painel) | "sem_controle".
 */
export async function situacaoDaDemo(pasta, { url, chave, buscar = fetch, tempo = TEMPO_MAXIMO }) {
  const cabecalhos = { apikey: chave, "Content-Type": "application/json", Accept: "application/json" };
  if (chave.split(".").length === 3) cabecalhos.Authorization = "Bearer " + chave;
  try {
    const r = await buscar(url.replace(/\/+$/, "") + "/rest/v1/rpc/demo_situacao", {
      method: "POST", headers: cabecalhos, body: JSON.stringify({ pasta }), signal: AbortSignal.timeout(tempo),
    });
    if (!r.ok) return null;
    const v = await r.json();
    return v && typeof v === "object" && typeof v.liberada === "boolean" ? v : null;
  } catch (e) {
    return null;
  }
}

const TEXTOS_FORA = {
  vencida: "O prazo da demo do site venceu. Você pode abrir de novo agora, por 1 hora, sem custo.",
  reaberta: "O prazo da demo do site venceu e ela já foi reaberta uma vez por aqui. Para ver de novo, é só chamar que a gente libera.",
  fora: "O link da demo do site tinha prazo e venceu. Se quiser ver de novo, é só chamar que a gente libera.",
};

/**
 * A página de demo fora do ar. situacao (de demo_situacao) escolhe o texto: vencida e nunca reaberta mostra o
 * botão de reabrir por 1 hora; já reaberta ou desligada, só o WhatsApp. Sem pasta (sem situação), a de sempre.
 */
export function paginaForaDoAr(situacao = null, pasta = "") {
  const motivo = !situacao ? "fora" : situacao.motivo === "vencida" ? (situacao.pode_reabrir ? "vencida" : "reaberta") : "fora";
  const podeReabrir = motivo === "vencida" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(pasta);
  // Quem abre um link vencido é o lead: o botão já puxa a conversa de volta, com o link para a gente saber qual é.
  const texto = encodeURIComponent(`Oi! Tentei abrir a demo do site que vocês me mandaram${pasta ? ` (renderizaweb.com.br/demo/${pasta})` : ""} e ela saiu do ar. Consegue liberar de novo?`);
  const contador = pasta ? `<script src="/exemplos/visitas.js" data-pagina="demo" data-demo="${pasta}" data-fora="${motivo}" defer></script>` : "";
  const reabrir = podeReabrir ? `<button class="botao" type="button" data-reabrir data-rz-alvo="reabrir">Reabrir por 1 hora, grátis</button>
<p class="aviso" data-aviso role="status">Dá para reabrir assim uma vez só. Depois, é só chamar a gente.</p>
<script>(function(){var b=document.querySelector("[data-reabrir]"),a=document.querySelector("[data-aviso]");b.addEventListener("click",function(){b.disabled=true;b.textContent="Reabrindo…";fetch("/api/reabrir-demo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pasta:${JSON.stringify(pasta)}})}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok){b.textContent="Pronto! Abrindo a demo…";setTimeout(function(){location.reload()},700);return}b.textContent="Não deu para reabrir";a.textContent=j&&j.motivo==="ja_reabriu"?"Esta demo já foi reaberta uma vez. Chame a gente no WhatsApp que a gente libera.":"Não deu para reabrir agora. Chame a gente no WhatsApp que a gente libera."}).catch(function(){b.disabled=false;b.textContent="Reabrir por 1 hora, grátis";a.textContent="Sem conexão agora. Tente de novo ou chame a gente no WhatsApp."})})})();</script>` : "";
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
.botao{display:inline-block;margin-top:22px;background:var(--verde);color:#fff;text-decoration:none;font:inherit;font-weight:600;padding:13px 22px;border-radius:999px;border:0;cursor:pointer}
.botao:disabled{opacity:.7;cursor:default}
.botao.contorno{background:transparent;color:var(--verde);border:1.5px solid var(--verde);margin-top:12px}
.aviso{font-size:14px;margin-top:12px}
@media (prefers-color-scheme:dark){.botao{color:#0d1a12}.botao.contorno{color:var(--verde)}}
</style></head>
<body><main>
<p class="marca">Renderiza</p>
<h1>Esta demonstração saiu do ar</h1>
<p>${TEXTOS_FORA[motivo]}</p>
${reabrir}
<a class="botao${podeReabrir ? " contorno" : ""}" href="https://wa.me/${site.contato.whatsapp}?text=${texto}">Pedir pelo WhatsApp</a>
</main>${contador}</body></html>`;
}

export default async function middleware(request) {
  try {
    const pasta = pastaDoCaminho(new URL(request.url).pathname);
    if (!pasta) return;
    const env = typeof process !== "undefined" ? process.env : {};
    const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
    const chave = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
    if (!url || !chave) return;
    const situacao = await situacaoDaDemo(pasta, { url, chave });
    if (situacao ? situacao.liberada : (await demoLiberada(pasta, { url, chave })) !== false) return; // segue para o arquivo da demo
    return new Response(request.method === "HEAD" ? null : paginaForaDoAr(situacao, pasta), {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch (e) {
    return; // erro aqui nunca derruba a demo
  }
}
