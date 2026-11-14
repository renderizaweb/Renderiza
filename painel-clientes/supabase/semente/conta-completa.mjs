// A conta completa de teste NA PRODUÇÃO: um login só, dono de duas contas cheias de movimento (a Villa Alecrim, de
// eventos, com o site de teste ligado no Meu site e na agenda online; e o Estúdio Ciranda, de fotografia), para a
// Renderiza validar o painel como quem já usa tudo há meses.
//
// Exceção à regra 9 do 08 ("a semente nunca na produção"), pedida pela Renderiza em 14/11/2026, até o fim dos testes.
// Tudo é fictício (os exemplos de /exemplos) e tem id fixo: "apagar" tira exatamente o que "criar" pôs, e nada mais.
//
//   node supabase/semente/conta-completa.mjs conferir                       o que existe hoje (só lê)
//   node supabase/semente/conta-completa.mjs criar --projeto <ref>          apaga a anterior e grava de novo (datas frescas)
//   node supabase/semente/conta-completa.mjs apagar --projeto <ref>         tira as duas contas e os logins de teste
//
// A senha do login vem de CONTA_TESTE_SENHA; sem ela, o "criar" gera uma e mostra uma vez (nunca vai para o git).
// O site de teste (test/site-teste) fica no endereço de CONTA_TESTE_SITE (ex.: villa-alecrim-teste.vercel.app), o
// primeiro domínio do site: é para onde o "Ver no meu site" leva.

process.env.TZ = "America/Sao_Paulo";

import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { gerarSql, sqlDaConferencia, CONTAS, uid } from "./semente.mjs";

export const USUARIO = "teste.completo";
export const EMAIL = `${USUARIO}@acesso.renderizaweb.com.br`; // o endereço interno do login por usuário: não recebe e-mail
export const DONO = uid("usuario:conta-completa:dono");
const VERSAO_DOS_TERMOS = "2026-11-04"; // a de src/telas/termos.js

const q = v => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const json = v => `${q(JSON.stringify(v))}::jsonb`;

/** Uma senha fácil de digitar no celular: letras e números, sem os que se confundem (0/O, 1/l/I). */
export function senhaNova() {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(12);
  const s = Array.from(b, x => letras[x % letras.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

function sqlDoDono(senha) {
  return `-- o dono de teste: login por usuário (${USUARIO}), com senha
delete from auth.users where id = ${q(DONO)} or lower(email) = ${q(EMAIL)};
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', ${q(DONO)}, 'authenticated', 'authenticated', ${q(EMAIL)},
  extensions.crypt(${q(senha)}, extensions.gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}',
  ${json({ nome: "Conta de teste", email_verified: true })}, now() - interval '120 days', now(), '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
values (${q(DONO)}, ${q(DONO)}, ${json({ sub: DONO, email: EMAIL, email_verified: true, phone_verified: false })}, 'email', now(), now());
`;
}

/** O que a semente não traz e uma conta em uso tem: a conversa de boas-vindas feita, o Pix, o WhatsApp dos clientes. */
function sqlDoUso(site) {
  const { villa, ciranda } = CONTAS;
  const feito = (perfil, ordem) => ({ onboarding: { pendente: false, feito_em: new Date(Date.now() - 120 * 864e5).toISOString(), perfil, via_ia: false }, ordem_menu: ordem });
  const ajustesVilla = {
    ...feito({ quem: "dono", objetivo: "agenda", organiza: "planilha", tamanho: "equipe", pacotes: "com_preco", contrato: "modelo", sinal: "sim" },
      ["atendimento", "agenda", "financeiro", "contratos", "clientes", "agenda-online", "meu-site"]),
    pix: { chave: "financeiro@villa-alecrim.teste", nome: "Villa Alecrim Eventos (teste)" },
  };
  const ajustesCiranda = {
    ...feito({ quem: "dono", objetivo: "agenda", organiza: "caderno", tamanho: "equipe", pacotes: "com_preco", contrato: "modelo", sinal: "sim" },
      ["agenda", "atendimento", "clientes", "financeiro", "contratos", "agenda-online"]),
    pix: { chave: "lia@estudio-ciranda.teste", nome: "Estúdio Ciranda (teste)" },
  };
  const dominios = [site, "villa-alecrim.teste", "localhost"].filter(Boolean);
  return `-- a conta em uso: conversa de boas-vindas feita, menu na ordem dela, Pix e WhatsApp (tudo fictício)
update public.contas set whatsapp = '11900000000', ajustes = ${json(ajustesVilla)}, criado_em = now() - interval '120 days' where id = ${q(villa)};
update public.contas set whatsapp = '11900000001', ajustes = ${json(ajustesCiranda)}, criado_em = now() - interval '120 days' where id = ${q(ciranda)};
update public.sites set dominios = array[${dominios.map(q).join(", ")}]::text[] where conta_id = ${q(villa)};

-- os clientes com WhatsApp (11 9 0000-NNNN: números que não existem), Instagram quando veio de lá e uma nota em alguns
with numerados as (
  select id, conta_id, nome, origem, row_number() over (order by conta_id, nome) as n from public.clientes where conta_id in (${q(villa)}, ${q(ciranda)})
)
update public.clientes c set
  whatsapp = '1190000' || lpad(numerados.n::text, 4, '0'),
  instagram = case when numerados.origem = 'instagram' then lower(regexp_replace(translate(split_part(numerados.nome, ' ', 1), 'áàâãéêíóôõúçÁÉÍÓÚ', 'aaaaeeiooouc'), '[^A-Za-z]', '', 'g')) || '.teste' end,
  criado_em = least(c.criado_em, coalesce((select min(r.criado_em) from public.reservas r where r.cliente_id = c.id), (select min(p.criado_em) from public.pedidos p where p.cliente_id = c.id), c.criado_em))
from numerados where c.id = numerados.id;
insert into public.clientes_fichas (cliente_id, conta_id, observacoes)
select c.id, c.conta_id, (array['Prefere falar à noite, depois das 19h.', 'Indicou duas amigas; mandar um mimo na entrega.', 'Pediu nota fiscal no nome da empresa.', 'Alérgica a lírio: avisar a decoração.'])[1 + (row_number() over (order by c.nome))::int % 4]
from public.clientes c where c.conta_id in (${q(villa)}, ${q(ciranda)}) and exists (select 1 from public.reservas r where r.cliente_id = c.id and r.situacao = 'confirmada')
on conflict (cliente_id) do update set observacoes = excluded.observacoes;

-- os termos já aceitos (é uma conta em uso); quem entra pela primeira vez continua vendo os termos
insert into public.termos_aceites (usuario_id, versao, aparelho) values (${q(DONO)}, ${q(VERSAO_DOS_TERMOS)}, 'conta de teste (script)')
on conflict do nothing;

-- nada disto é histórico de ninguém
delete from public.atividades where conta_id in (${q(villa)}, ${q(ciranda)});
`;
}

/** Os ids da semente e do dono: o que "apagar" tira. */
export function sqlDeApagar() {
  const { sql } = gerarSql({ donoReal: EMAIL });
  const ficticios = sql.match(/delete from auth\.users where id = any \((array\[[^\]]*\]::uuid\[\])\);/)[1];
  return `delete from public.contas where id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)});
delete from auth.users where id = any (${ficticios});
delete from auth.users where id = ${q(DONO)} or lower(email) = ${q(EMAIL)};
`;
}

export function sqlDeCriar({ senha, site = null }) {
  return `-- Conta completa de teste na produção (fictícia; pedida pela Renderiza em 14/11/2026)\n${sqlDoDono(senha)}\n${gerarSql({ donoReal: EMAIL }).sql}\n${sqlDoUso(site)}`;
}

function sqlDoQueExiste() {
  const ids = `(${q(CONTAS.villa)}, ${q(CONTAS.ciranda)})`;
  return `select json_build_object(
    'login', (select json_build_object('email', email, 'entrou_em', last_sign_in_at) from auth.users where id = ${q(DONO)}),
    'contas', (select json_agg(json_build_object('nome', nome, 'codigo', codigo, 'nicho', nicho, 'situacao', situacao) order by nome) from public.contas where id in ${ids}),
    'site', (select json_agg(json_build_object('codigo', codigo, 'dominios', dominios, 'situacao', situacao, 'versoes', (select count(*) from public.sites_versoes v where v.site_id = s.id))) from public.sites s where conta_id in ${ids})
  ) as existe`;
}

// ---------- linha de comando ----------

async function principal([comando, ...resto]) {
  const { consultar } = await import("../../scripts/lib/supabase-api.mjs");
  const { conferirProjeto, exigirConfirmacaoDaProducao } = await import("../../scripts/lib/projetos.mjs");
  const p = await conferirProjeto("producao");
  console.log(`Produção: ${p.nome} (${p.ref})`);
  if (comando === "conferir") {
    const [a] = await consultar(p.ref, sqlDoQueExiste(), { somenteLeitura: true });
    const [b] = await consultar(p.ref, sqlDaConferencia(), { somenteLeitura: true });
    console.log(JSON.stringify(a.existe, null, 1));
    console.log(JSON.stringify(b.conferencia));
    return;
  }
  const i = resto.indexOf("--projeto");
  exigirConfirmacaoDaProducao(p, i >= 0 ? resto[i + 1] : null);
  if (comando === "apagar") {
    await consultar(p.ref, sqlDeApagar());
    console.log("Apagadas: Villa Alecrim, Estúdio Ciranda e os logins de teste.");
    return;
  }
  if (comando === "criar") {
    const senha = process.env.CONTA_TESTE_SENHA || senhaNova();
    if (senha.length < 8) throw new Error("CONTA_TESTE_SENHA precisa de 8 caracteres ou mais.");
    await consultar(p.ref, sqlDeCriar({ senha, site: process.env.CONTA_TESTE_SITE || null }));
    const [b] = await consultar(p.ref, sqlDaConferencia(), { somenteLeitura: true });
    console.log("Na produção:", JSON.stringify(b.conferencia));
    console.log(`Entrar em https://painel.renderizaweb.com.br com o usuário ${USUARIO}` + (process.env.CONTA_TESTE_SENHA ? " (senha de CONTA_TESTE_SENHA)" : ` e a senha ${senha} (anote: não aparece de novo)`));
    return;
  }
  throw new Error("Use: conferir, criar --projeto <ref> ou apagar --projeto <ref>.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await principal(process.argv.slice(2));
  } catch (e) {
    console.error("Parou: " + e.message);
    process.exit(1);
  }
}
