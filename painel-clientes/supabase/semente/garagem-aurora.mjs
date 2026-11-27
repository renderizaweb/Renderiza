// A semente do Estoque: a Garagem Aurora, revenda fictícia do nicho automotivo (trilho docs/entregas/ricardo-motors.md,
// 1A), com o site de teste `garagem-aurora` (domínio localhost), Meu site e Estoque ligados e 5 carros fictícios: um
// oculto, um reservado, um vendido, um sob consulta. Rodar de novo apaga a conta de teste e grava de novo. Só no STG
// (e no "sql", para ver), nunca na produção (08, regra 9).
//
//   node supabase/semente/garagem-aurora.mjs stg    grava no STG e confere pela função pública
//   node supabase/semente/garagem-aurora.mjs sql    só mostra o SQL
//
// O dono é o usuário contato@renderizaweb.com.br do STG (a Renderiza entra e vê o painel como o dono); o vendedor
// (@garagem-aurora.teste, sem senha) tem o "só vê" no Estoque, para a RLS ter quem testar.

import { fileURLToPath } from "node:url";
import { uid, DONO_NO_STG } from "./semente.mjs";

export const CONTA = uid("conta:garagem-aurora");
export const CODIGO = "garagem-aurora";
const q = v => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const json = v => `${q(JSON.stringify(v))}::jsonb`;

const CARROS = [
  { id: "corolla", situacao: "disponivel", destaque: true, ordem: 0, preco: 128900, selos: ["Único dono", "Revisões em dia"],
    campos: { marca: "Toyota", modelo: "Corolla", versao: "2.0 XEi Flex Automático", ano_fab: 2021, ano_modelo: 2022, km: 38000, cor: "Prata", cambio: "Automático", combustivel: "Flex", carroceria: "Sedã" },
    descricao: "Carro de teste da semente (fictício)." },
  { id: "compass", situacao: "reservado", destaque: false, ordem: 1, preco: 154900, selos: ["Blindado"],
    campos: { marca: "Jeep", modelo: "Compass", versao: "1.3 T270 Limited", ano_fab: 2022, ano_modelo: 2022, km: 29000, cor: "Preto", cambio: "Automático", combustivel: "Flex", carroceria: "SUV" },
    descricao: "" },
  { id: "hilux", situacao: "disponivel", destaque: false, ordem: 2, preco: null, selos: [],
    campos: { marca: "Toyota", modelo: "Hilux", versao: "2.8 SRX 4x4 Diesel", ano_fab: 2020, ano_modelo: 2021, km: 61000, cor: "Branco", cambio: "Automático", combustivel: "Diesel", carroceria: "Picape" },
    descricao: "" },
  { id: "golf", situacao: "oculto", destaque: false, ordem: 3, preco: 98900, selos: [],
    campos: { marca: "Volkswagen", modelo: "Golf", versao: "1.4 TSI Highline", ano_fab: 2019, ano_modelo: 2019, km: 54000, cor: "Azul", cambio: "Automático", combustivel: "Flex", carroceria: "Hatch" },
    descricao: "" },
  { id: "civic", situacao: "vendido", destaque: false, ordem: 4, preco: 112000, selos: [],
    campos: { marca: "Honda", modelo: "Civic", versao: "2.0 EXL CVT", ano_fab: 2020, ano_modelo: 2020, km: 47000, cor: "Cinza", cambio: "Automático", combustivel: "Flex", carroceria: "Sedã" },
    descricao: "" },
];

export function gerarSql({ donoReal = DONO_NO_STG } = {}) {
  const vendedor = { id: uid("usuario:garagem:vendedor"), email: "vendedor@garagem-aurora.teste" };
  const donoFicticio = { id: uid("usuario:garagem:dono"), email: "dono@garagem-aurora.teste" };
  const criar = (u, cond = "true") => `insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  select ${q(u.id)}, 'authenticated', 'authenticated', ${q(u.email)}, now(), '{"provider": "email", "providers": ["email"]}', '{}' where ${cond};`;
  return `-- Semente da Garagem Aurora (fictícia, Estoque). Nunca na produção.
delete from public.contas where id = ${q(CONTA)};
delete from auth.users where id in (${q(vendedor.id)}, ${q(donoFicticio.id)});
create temporary table _dono_aurora (id uuid, email text) on commit drop;
insert into _dono_aurora select id, email from auth.users where email = ${q(donoReal)};
insert into _dono_aurora select ${q(donoFicticio.id)}, ${q(donoFicticio.email)} where not exists (select 1 from _dono_aurora);
${criar(donoFicticio, `exists (select 1 from _dono_aurora where id = ${q(donoFicticio.id)})`)}
${criar(vendedor)}
insert into public.contas (id, nome, nicho, codigo, cores, situacao, origem, whatsapp)
  values (${q(CONTA)}, 'Garagem Aurora', 'automotivo', ${q(CODIGO)}, ${json({ principal: "#c8a24a" })}, 'ativa', 'renderiza', '11999990000');
insert into public.contas_modulos (conta_id, modulo_id) values (${q(CONTA)}, 'meu-site'), (${q(CONTA)}, 'estoque');
insert into public.sites (id, conta_id, codigo, dominios) values (${q(uid("site:garagem-aurora"))}, ${q(CONTA)}, ${q(CODIGO)}, array['garagem-aurora.teste', 'localhost']);
insert into public.pessoas (conta_id, usuario_id, nome, email, dono, acessos)
  select ${q(CONTA)}::uuid, id, 'Renderiza (dono de teste)', email, true, '{}'::jsonb from _dono_aurora
  union all select ${q(CONTA)}::uuid, ${q(vendedor.id)}::uuid, 'Vendedor de teste', ${q(vendedor.email)}, false, '{"estoque": "ver"}'::jsonb;
insert into public.estoque_itens (id, conta_id, esquema, situacao, destaque, ordem, preco, selos, campos, descricao) values
${CARROS.map(c => `  (${q(uid("estoque:garagem:" + c.id))}, ${q(CONTA)}, 'automotivo', ${q(c.situacao)}, ${c.destaque}, ${c.ordem}, ${c.preco ?? "null"}, array[${c.selos.map(q).join(", ")}]::text[], ${json(c.campos)}, ${q(c.descricao)})`).join(",\n")};
delete from public.atividades where conta_id = ${q(CONTA)};
`;
}

async function principal(comando) {
  if (comando === "sql") return void process.stdout.write(gerarSql());
  if (comando !== "stg") throw new Error("Use: stg ou sql. (A semente nunca vai para a produção.)");
  const { consultar } = await import("../../scripts/lib/supabase-api.mjs");
  const { conferirProjeto } = await import("../../scripts/lib/projetos.mjs");
  const p = await conferirProjeto("stg");
  console.log(`STG: ${p.nome} (${p.ref})`);
  await consultar(p.ref, gerarSql());
  const [l] = await consultar(p.ref, `select (select count(*) from public.estoque_itens where conta_id = ${q(CONTA)}) as todos,
    (select email from public.pessoas where conta_id = ${q(CONTA)} and dono) as dono`, { somenteLeitura: true });
  // a conferência pelo caminho do site: a rota da API pública com a chave pública do STG
  const { tratar } = await import("../../api/publico/estoque/[codigo]/index.js");
  const env = { SUPABASE_URL: process.env.PAINEL_STG_SUPABASE_URL, SUPABASE_ANON_KEY: process.env.PAINEL_STG_SUPABASE_ANON_KEY };
  const r = await tratar({ metodo: "GET", caminho: "/api/publico/estoque/" + CODIGO, env });
  if (r.status !== 200) throw new Error("a rota respondeu " + r.status);
  console.log(`No STG: ${l.todos} carros; o site recebe ${r.corpo.itens.length} (${r.corpo.itens.map(i => i.campos.modelo + " " + i.situacao).join(", ")}); dono: ${l.dono}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { await principal(process.argv[2]); } catch (e) { console.error("Parou: " + e.message); process.exit(1); }
}
