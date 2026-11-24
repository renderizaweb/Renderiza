// O lead de fotografia no painel de prospecção, sem o conector do Supabase (sessão na nuvem): entra COM O LOGIN DO
// PAINEL, como scripts/relato.mjs, então valem as regras de RLS (só as linhas do Kaue). Nada de chave secreta.
// Variáveis do ambiente: SUPABASE_URL, SUPABASE_ANON_KEY, RENDERIZA_EMAIL, RENDERIZA_SENHA.
//
//   node ferramentas/demo/painel-lead.mjs ver <id>                o lead (etapa, código, link, checklist, mensagem)
//   node ferramentas/demo/painel-lead.mjs busca <texto>           leads parecidos (empresa, @ ou id), para não duplicar
//   node ferramentas/demo/painel-lead.mjs inserir <arq.json>      cadastra (docs/como-trabalhamos.md, 4.4); devolve o código
//   node ferramentas/demo/painel-lead.mjs atualizar <id> <arq.json>   muda só esse lead (where id = <id>)
//   node ferramentas/demo/painel-lead.mjs demo <id>               a janela da demo (tabela demos: no_ar, vale_ate)
//
// O que o banco faz sozinho (supabase/schema.sql), e por isso NÃO se manda junto:
//   - gravar o link_demo cria a linha em demos com vale_ate = hoje (Brasília) + 7: o renderiza.valido_ate do
//     demo.json tem de ser essa data (gere a versão final no mesmo dia em que gravar o link);
//   - mudar a etapa para demo_pronta ("Prontas para trabalhar") põe a checklist padrão e a próxima ação: não mande
//     proxima_acao no mesmo pedido, senão o gatilho não troca.
import { readFileSync } from "node:fs";

const U = (process.env.SUPABASE_URL || "").replace(/\/$/, ""), K = process.env.SUPABASE_ANON_KEY || "";
if (!U || !K || !process.env.RENDERIZA_EMAIL || !process.env.RENDERIZA_SENHA) {
  console.error("Faltam SUPABASE_URL, SUPABASE_ANON_KEY, RENDERIZA_EMAIL ou RENDERIZA_SENHA no ambiente.");
  process.exit(1);
}
const sessao = await (await fetch(U + "/auth/v1/token?grant_type=password", {
  method: "POST", headers: { apikey: K, "Content-Type": "application/json" },
  body: JSON.stringify({ email: process.env.RENDERIZA_EMAIL, password: process.env.RENDERIZA_SENHA }),
})).json();
if (!sessao.access_token) { console.error("Não entrou com o login do painel:", sessao.error_description || sessao.msg); process.exit(1); }
const cab = { apikey: K, Authorization: "Bearer " + sessao.access_token, "Content-Type": "application/json" };

async function pedir(caminho, op = {}) {
  const r = await fetch(U + caminho, { ...op, headers: { ...cab, ...(op.headers || {}) } });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) { console.error("ERRO", r.status, JSON.stringify(j)); process.exit(1); }
  return j;
}

const CAMPOS = "id,empresa,etapa,codigo,link_demo,whatsapp,instagram,cidade,segmento,site_atual,proxima_acao,tags,checklist,mensagem_whatsapp,observacoes,criado_em";
const [cmd, a, b] = process.argv.slice(2);
const id = s => encodeURIComponent(s || "");

if (cmd === "ver") {
  console.log(JSON.stringify(await pedir(`/rest/v1/leads?id=eq.${id(a)}&select=${CAMPOS}`), null, 1));
} else if (cmd === "busca") {
  const t = id(a);
  console.log(JSON.stringify(await pedir(`/rest/v1/leads?or=(empresa.ilike.*${t}*,instagram.ilike.*${t}*,id.ilike.*${t}*)&select=id,empresa,instagram,etapa`), null, 1));
} else if (cmd === "inserir") {
  const corpo = JSON.parse(readFileSync(a, "utf8"));
  const r = await pedir(`/rest/v1/leads?select=${CAMPOS}`, { method: "POST", body: JSON.stringify(corpo), headers: { Prefer: "return=representation" } });
  console.log(JSON.stringify(r.map(x => ({ id: x.id, empresa: x.empresa, etapa: x.etapa, codigo: x.codigo })), null, 1));
} else if (cmd === "atualizar") {
  if (!a || !b) { console.error("uso: atualizar <id> <arq.json>"); process.exit(1); }
  const corpo = JSON.parse(readFileSync(b, "utf8"));
  const r = await pedir(`/rest/v1/leads?id=eq.${id(a)}&select=${CAMPOS}`, { method: "PATCH", body: JSON.stringify(corpo), headers: { Prefer: "return=representation" } });
  if (r.length !== 1) console.error("ATENÇÃO: mudou", r.length, "linhas");
  console.log(JSON.stringify(r.map(x => ({ id: x.id, etapa: x.etapa, codigo: x.codigo, link_demo: x.link_demo, proxima_acao: x.proxima_acao, checklist: (x.checklist || []).map(c => c.texto) })), null, 1));
} else if (cmd === "demo") {
  console.log(JSON.stringify(await pedir(`/rest/v1/demos?id=eq.${id(a)}&select=*`), null, 1));
} else {
  console.error("uso: ver <id> | busca <texto> | inserir <arq.json> | atualizar <id> <arq.json> | demo <id>");
  process.exit(1);
}
