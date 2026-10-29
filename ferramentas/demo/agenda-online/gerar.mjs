// A página da agenda online de um site (ferramentas/demo/agenda-online/agenda.html, o desenho do exemplo), com as
// cores, as fontes, a marca e o WhatsApp tirados do próprio site. Usada pelo scripts/virar-site.mjs quando o site.json
// tem "painel": { "codigo", "agenda": true }. Sem o painel, a página vira um botão de WhatsApp com a data escrita.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODELO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'agenda.html');
const API = 'https://painel.renderizaweb.com.br/api/publico/';
const desescapar = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&');
const escapar = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** O que a agenda precisa do site: as variáveis de cor, o link das fontes, o nome, a linha de baixo e o WhatsApp. */
export function doSite(html) {
  const raiz = (html.match(/:root\{[^}]*--green:[^}]*\}/) || [])[0];
  const fontes = (html.match(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet">/) || [])[0] || '';
  const logo = html.match(/<span class="logo-text"><b>([^<]*)<\/b><small>([^<]*)<\/small><\/span>/);
  const whatsapp = (html.match(/whatsapp: "https:\/\/wa\.me\/(\d{10,15})/) || [])[1];
  if (!raiz || !logo || !whatsapp) throw new Error('agenda online: o site não tem as cores (--green), o nome no logo ou o WhatsApp do DEMO_CLIENT');
  return { raiz, fontes, marca: desescapar(logo[1]), sub: desescapar(logo[2]), whatsapp };
}

export function paginaDaAgenda(htmlDoSite, { codigo, api = API }) {
  const s = doSite(htmlDoSite);
  const config = JSON.stringify({ codigo, api, whatsapp: s.whatsapp, marca: s.marca }).replace(/</g, '\\u003c');
  const troca = { '{{raiz}}': s.raiz, '{{fontes}}': s.fontes, '{{marca}}': escapar(s.marca), '{{sub}}': escapar(s.sub), '{{config}}': config };
  let html = fs.readFileSync(MODELO, 'utf8');
  for (const [a, b] of Object.entries(troca)) html = html.split(a).join(b);
  if (html.includes('{{')) throw new Error('agenda online: sobrou marcação {{…}} no modelo');
  return html;
}

/** O link para a agenda na seção "Consulte a sua data" do site (depois do texto). Sem a seção, nada muda. */
export function ligarNoSite(html) {
  const re = /(<p data-site="consulta\.texto">[^<]*<\/p>)/;
  if (!re.test(html)) return { html, ligou: false };
  const link = '\n          <p class="consulta-agenda"><a class="text-link" data-site-botao="consulta.agenda" href="/agenda/">Ver as datas livres e pedir a pré-reserva <span aria-hidden="true">→</span></a></p>';
  const css = '<style>.consulta-agenda{margin-top:18px}.consulta-agenda .text-link{color:inherit;text-decoration:underline;text-underline-offset:4px}</style>\n</head>';
  return { html: html.replace(re, '$1' + link).replace('</head>', css), ligou: true };
}
