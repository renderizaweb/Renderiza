// O login (Auth) dos dois projetos do Supabase, guardado no repositório: endereço do painel, endereços de retorno,
// senha mínima e os e-mails (supabase/emails/). Funções puras (sem rede), testadas em test/auth.test.mjs; quem aplica
// é scripts/auth.mjs, pela API de gerenciamento.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Quanto os links dos e-mails valem, em segundos (no Supabase, o mesmo prazo para todos, convite inclusive). */
export const VALIDADE_DOS_LINKS = 3600; // os e-mails dizem "1 hora": mudou aqui, mude os textos

/** O que vale nos dois projetos. */
const COMUM = {
  // Cadastro só pelo convite ou pela Renderiza, até existir a tela de cadastro com verificação contra robô (06):
  // quem fizer essa tela liga a verificação aqui e abre o cadastro, STG primeiro.
  disable_signup: true,
  password_min_length: 8, // o mesmo de SENHA_MINIMA em src/sessao.js
  mailer_autoconfirm: false, // a conta só entra depois de confirmar o e-mail
  mailer_secure_email_change_enabled: true, // troca de e-mail confirmada no endereço atual e no novo (o e-mail diz isso)
  mailer_otp_exp: VALIDADE_DOS_LINKS,
};

/**
 * Endereço do painel (site_url: para onde o link leva quando o pedido não diz) e os endereços de retorno permitidos
 * (para onde um link do e-mail pode levar). Nada de curinga mais aberto que isto.
 */
export const ENDERECOS = {
  stg: {
    site_url: "http://localhost:5180",
    retorno: ["http://localhost:5180/**", "https://renderiza-painel-clientes-*.vercel.app/**"], // local e prévias da Vercel
  },
  producao: {
    site_url: "https://painel.renderizaweb.com.br",
    retorno: ["https://painel.renderizaweb.com.br/**", "https://renderiza-painel-clientes.vercel.app/**"],
  },
};

/** Os e-mails: arquivo em supabase/emails/ e o tipo dele no Supabase. O assunto é o <title> do arquivo. */
export const EMAILS = [
  { arquivo: "confirmacao.html", tipo: "confirmation", nome: "confirmação de cadastro" },
  { arquivo: "convite.html", tipo: "invite", nome: "convite" },
  { arquivo: "recuperar-senha.html", tipo: "recovery", nome: "recuperar a senha" },
  { arquivo: "troca-de-email.html", tipo: "email_change", nome: "troca de e-mail" },
  { arquivo: "link-de-acesso.html", tipo: "magic_link", nome: "link de acesso" },
];

export function assuntoDe(html) {
  const m = String(html).match(/<title>([^<]+)<\/title>/);
  if (!m || !m[1].trim()) throw new Error("e-mail sem <title> (o assunto)");
  return m[1].trim();
}

export function lerEmails(pasta) {
  return EMAILS.map(e => {
    const html = readFileSync(join(pasta, e.arquivo), "utf8");
    try {
      return { ...e, html, assunto: assuntoDe(html) };
    } catch (erro) {
      throw new Error(`${e.arquivo}: ${erro.message}`);
    }
  });
}

/** A configuração que o projeto tem que ter, nos nomes da API (PATCH /v1/projects/<ref>/config/auth). */
export function configDesejada(alvo, emails) {
  const { site_url, retorno } = ENDERECOS[alvo];
  const config = { ...COMUM, site_url, uri_allow_list: retorno.join(",") };
  for (const e of emails) {
    config[`mailer_subjects_${e.tipo}`] = e.assunto;
    config[`mailer_templates_${e.tipo}_content`] = e.html;
  }
  return config;
}

export const ehCampoDeEmail = campo => /^mailer_(subjects|templates)_/.test(campo);

/**
 * Tudo menos os e-mails. No plano grátis, o Supabase só aceita e-mail próprio num projeto com SMTP próprio
 * (o Brevo, Missão 1, item 4): até lá, os e-mails esperam e o resto já vale.
 */
export function semEmails(config) {
  return Object.fromEntries(Object.entries(config).filter(([campo]) => !ehCampoDeEmail(campo)));
}

/** Tudo menos os endereços: o que é igual nos dois projetos e precisa ter passado pelo STG antes da produção. */
export function semEnderecos(config) {
  const { site_url, uri_allow_list, ...resto } = config;
  return resto;
}

/** Os campos em que o projeto (`atual`, como a API devolve) não bate com o repositório. */
export function diferencas(desejada, atual) {
  return Object.keys(desejada).filter(k => (atual || {})[k] !== desejada[k]);
}

/** Nome legível de um campo, sem mostrar o conteúdo dos e-mails. */
export function rotulo(campo) {
  const m = ehCampoDeEmail(campo) && campo.match(/^mailer_(subjects|templates)_(.+?)(_content)?$/);
  const email = m && EMAILS.find(e => e.tipo === m[2]);
  if (email) return `e-mail "${email.nome}" (${m[1] === "subjects" ? "assunto" : "corpo"})`;
  return campo;
}

const escapar = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const valorDe = (dados, caminho) => caminho.split(".").filter(Boolean).reduce((v, chave) => (v == null ? undefined : v[chave]), dados);

/**
 * Preenche as variáveis como o Supabase faz ({{ .Email }}, {{ .Data.chave }}, {{ if … }}…{{ else }}…{{ end }}, sem
 * aninhar), escapando o HTML: para ver um e-mail no navegador sem mandar nada.
 */
export function preencher(html, dados) {
  return String(html)
    .replace(/\{\{\s*if\s+\.([\w.]+)\s*\}\}([\s\S]*?)(?:\{\{\s*else\s*\}\}([\s\S]*?))?\{\{\s*end\s*\}\}/g,
      (_, caminho, sim, nao = "") => (valorDe(dados, caminho) ? sim : nao))
    .replace(/\{\{\s*\.([\w.]+)\s*\}\}/g, (_, caminho) => escapar(valorDe(dados, caminho) ?? ""));
}
