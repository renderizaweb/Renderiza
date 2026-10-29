// A lógica da função "avisar-pedido" (Supabase Edge Function), sem nada do Deno: testada em test/avisar-pedido.test.mjs.
// A API pública (api/publico/agenda/<código>/pedido) chama depois de gravar um pedido da agenda online. A função pega
// no banco o que vai no e-mail (aviso_do_pedido: uma vez só por pedido, só da agenda online, só nos primeiros 15
// minutos) e manda aos donos da conta pelo Brevo. Sem a chave do Brevo no ambiente da função, não manda nada: o
// pedido continua no painel. A chave secreta do Supabase e a do Brevo ficam só no ambiente da função.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PRODUCAO = "hxzsiiqhlqxuqkevskwb"; // o projeto de produção (docs/painel-clientes/04-arquitetura.md)
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEMANA = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const COR = { fundo: "#f6f5f2", tinta: "#1e2528", suave: "#5b6467", linha: "#e6e4df", destaque: "#b25134" }; // os do design system (10)
const FONTE = "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** O painel de onde o pedido veio: produção ou o STG (que roda no localhost e nas prévias). */
export function ambienteDe(urlDoProjeto) {
  const producao = String(urlDoProjeto || "").includes(PRODUCAO);
  return { producao, painel: producao ? "https://painel.renderizaweb.com.br" : "http://localhost:5180" };
}

export function dataLonga(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return `${SEMANA[dt.getUTCDay()]}, ${d} de ${MES[m - 1]}`;
}
const hora = h => (h ? h.replace(/^0/, "").replace(/:00$/, "h").replace(":", "h") : "");
export function foneLegivel(n) {
  const m = String(n || "").match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : String(n || "");
}

/** O e-mail ao dono: assunto, HTML (o mesmo jeito dos e-mails do login) e texto. */
export function montarEmail(a, { producao, painel }) {
  const quando = dataLonga(a.data) + (a.inicio ? `, ${hora(a.inicio)}${a.fim ? " às " + hora(a.fim) : ""}` : "");
  const assunto = `${producao ? "" : "[STG] "}Pedido novo pela agenda online: ${a.cliente.nome}, ${dataLonga(a.data)}`;
  const linhas = [
    ["Data", quando],
    a.tipo && [a.nicho === "fotografia" ? "Ensaio" : "Festa", a.tipo],
    a.convidados && ["Convidados", String(a.convidados)],
    a.pacote && [a.nicho === "fotografia" ? "Tipo de ensaio" : "Pacote", a.pacote],
    ["WhatsApp", foneLegivel(a.cliente.whatsapp)],
    a.cliente.email && ["E-mail", a.cliente.email],
  ].filter(Boolean);
  const zap = `https://wa.me/55${a.cliente.whatsapp}`;
  const atendimento = painel + "/atendimento";
  const texto = [
    `${a.cliente.nome} pediu a pré-reserva de ${quando} pela agenda online do site de ${a.conta}.`,
    "",
    ...linhas.map(([k, v]) => `${k}: ${v}`),
    a.mensagem ? `\n${a.mensagem}` : "",
    "",
    "A data fica separada por 48 horas. Confirme com o cliente pelo WhatsApp e no painel, em Atendimento.",
    `WhatsApp do cliente: ${zap}`,
    `Painel: ${atendimento}`,
    "",
    "E-mail automático do Painel Renderiza.",
  ].join("\n");
  const td = `font-family:${FONTE};font-size:15px;line-height:22px;padding:8px 0;border-top:1px solid ${COR.linha};`;
  const tabela = linhas.map(([k, v]) => `<tr><td style="${td}color:${COR.suave};width:38%;">${esc(k)}</td><td style="${td}color:${COR.tinta};font-weight:600;">${esc(v)}</td></tr>`).join("");
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(assunto)}</title></head>
<body style="margin:0;padding:0;background-color:${COR.fundo};font-family:${FONTE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COR.fundo};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td style="padding:0 4px 16px;font-family:${FONTE};font-size:17px;line-height:24px;font-weight:600;color:${COR.tinta};">Painel Renderiza</td></tr>
<tr><td style="background-color:#ffffff;border:1px solid ${COR.linha};border-radius:16px;padding:32px 28px;font-family:${FONTE};">
<h1 style="margin:0 0 12px;font-size:24px;line-height:30px;font-weight:600;letter-spacing:-0.02em;color:${COR.tinta};">Pedido novo pela agenda online</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:24px;color:${COR.suave};"><b style="color:${COR.tinta};">${esc(a.cliente.nome)}</b> pediu a pré-reserva de <b style="color:${COR.tinta};">${esc(quando)}</b> pelo site de ${esc(a.conta)}. A data fica separada por 48 horas.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${tabela}</table>
${a.mensagem ? `<p style="margin:16px 0 0;font-size:14px;line-height:21px;color:${COR.suave};">${esc(a.mensagem)}</p>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr>
<td style="border-radius:12px;background-color:${COR.destaque};"><a href="${esc(zap)}" style="display:inline-block;padding:14px 22px;font-family:${FONTE};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">Chamar no WhatsApp</a></td>
<td style="width:12px;"></td>
<td style="border-radius:12px;border:1px solid ${COR.linha};"><a href="${esc(atendimento)}" style="display:inline-block;padding:13px 20px;font-family:${FONTE};font-size:16px;line-height:20px;font-weight:600;color:${COR.tinta};text-decoration:none;border-radius:12px;">Abrir o painel</a></td>
</tr></table>
</td></tr>
<tr><td style="padding:20px 4px 0;font-family:${FONTE};font-size:13px;line-height:20px;color:${COR.suave};">E-mail automático do Painel Renderiza, feito pela Renderiza.<br>Para falar com a gente: <a href="mailto:contato@renderizaweb.com.br" style="color:${COR.suave};">contato@renderizaweb.com.br</a></td></tr>
</table></td></tr></table>
</body></html>`;
  return { assunto, html, texto };
}

/** A chamada: { pedido } → o aviso, se é a primeira vez e há para quem e com o quê mandar. */
export async function atender({ metodo, corpo }, deps) {
  const headers = { "Cache-Control": "no-store" };
  if (metodo === "OPTIONS") return { status: 204, corpo: null, headers };
  if (metodo !== "POST") return { status: 405, corpo: { erro: "metodo" }, headers };
  const pedido = corpo && corpo.pedido;
  if (!UUID.test(String(pedido || ""))) return { status: 400, corpo: { erro: "pedido" }, headers };
  const aviso = await deps.aviso(pedido);
  if (!aviso) return { status: 200, corpo: { enviado: false }, headers };
  if (!aviso.para || !aviso.para.length) return { status: 200, corpo: { enviado: false, motivo: "sem e-mail do dono" }, headers };
  if (!deps.temChave) return { status: 200, corpo: { enviado: false, motivo: "sem a chave do Brevo" }, headers };
  const email = montarEmail(aviso, deps.ambiente);
  try {
    await deps.enviar({ para: aviso.para, ...email });
    return { status: 200, corpo: { enviado: true }, headers };
  } catch (e) {
    return { status: 502, corpo: { enviado: false, motivo: "o Brevo não aceitou" }, headers };
  }
}
