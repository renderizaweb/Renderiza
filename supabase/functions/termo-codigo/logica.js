// A lógica da função "termo-codigo" (Supabase Edge Function, Deno), sem nada do Deno: testada em
// test/termo-codigo.test.mjs. A página de um termo online (ex.: /contrato/vereador-mateuzinho-silva) pede aqui um
// código de 6 números para o e-mail de quem vai assinar; a função sorteia o código, o banco guarda só o hash
// (registrar_codigo_termo, em supabase/termos-online.sql: vale 15 minutos, 5 tentativas, só o último pedido vale, um
// por minuto e até 3 por hora para o mesmo e-mail, até 6 por hora para o mesmo IP) e o e-mail sai pelo Brevo. Quem
// confere o código é o próprio banco, na assinatura (aceitar_termo_online). Logo depois da assinatura, a página pede
// aqui o comprovante (acao "comprovante"): ele vai, uma vez só, para o e-mail de quem assinou, com cópia para a
// Renderiza (comprovante_termo).
const ORIGENS = [
  /^https:\/\/(www\.)?renderizaweb\.com\.br$/,
  /^https:\/\/renderiza(-[a-z0-9-]+)?\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];
const TERMO = /^[a-z0-9-]{3,80}$/;
const PROTOCOLO = /^[0-9A-F]{12}$/;
export const COPIA = "contato@renderizaweb.com.br";
const PLANOS = { essencial: "Essencial · R$ 300 por mês", gabinete: "Gabinete · R$ 590 por mês", completo: "Completo · R$ 990 por mês", "sem-plano": "Sem plano da Renderiza (estrutura própria)" };
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function cabecalhosCors(origem) {
  return {
    "Access-Control-Allow-Origin": ORIGENS.some(re => re.test(origem || "")) ? origem : "https://www.renderizaweb.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
export const normalizarEmail = e => String(e || "").trim().toLowerCase();
/** O IP de quem pediu, como o Supabase repassa (o primeiro do x-forwarded-for). */
export function ipDe(cabecalhos) {
  const ip = String(cabecalhos["cf-connecting-ip"] || String(cabecalhos["x-forwarded-for"] || "").split(",")[0] || "").trim();
  return /^[0-9a-fA-F.:]{3,45}$/.test(ip) ? ip : "";
}
/** Um código de 6 números, sorteado sem viés (descarta o fim da faixa de 32 bits). */
export function novoCodigo(aleatorio = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
  const teto = 4294000000; // múltiplo de 1.000.000
  let n = aleatorio();
  while (n >= teto) n = aleatorio();
  return String(n % 1000000).padStart(6, "0");
}
/** O hash que o banco guarda e confere: SHA-256 de "<termo>:<email>:<código>", em hexadecimal. */
export async function cifrar(termo, email, codigo) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${termo}:${email}:${codigo}`));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export function emailDoCodigo(codigo) {
  const texto = `Seu código para assinar o contrato com a Renderiza: ${codigo}\n\nDigite o código na página do contrato. Ele vale por 15 minutos.\n\nSe não foi você que pediu, é só ignorar este e-mail: nada é assinado sem o código.\n\nRenderiza · renderizaweb.com.br`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1e2528;max-width:480px">`
    + `<p>Seu código para assinar o contrato com a Renderiza:</p>`
    + `<p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:16px 0">${codigo}</p>`
    + `<p>Digite o código na página do contrato. Ele vale por 15 minutos.</p>`
    + `<p style="color:#5b6670">Se não foi você que pediu, é só ignorar este e-mail: nada é assinado sem o código.</p>`
    + `<p style="color:#5b6670">Renderiza · renderizaweb.com.br</p></div>`;
  return { assunto: `${codigo} é o seu código para assinar o contrato`, texto, html };
}
/** O e-mail do comprovante, com os dados devolvidos por comprovante_termo. */
export function emailDoComprovante(d) {
  const quando = new Date(d.em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const linhas = [
    ["Contrato", d.titulo], ["Protocolo", d.protocolo], ["Data e hora (Brasília)", quando], ["Nome", d.nome], ["CPF", d.cpf],
    ["E-mail", d.email + (d.email_confirmado ? " (confirmado pelo código)" : "")], ["Plano escolhido", PLANOS[d.plano] || d.plano],
    ["IP registrado", d.ip || "não informado"], ["Impressão digital do texto (SHA-256)", d.impressao],
    ["Contratada", d.contratada], ["Texto do contrato", d.pagina],
  ];
  const texto = `Contrato assinado. Este é o comprovante da assinatura eletrônica.\n\n${linhas.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n`
    + `A impressão digital confere com o texto publicado no endereço acima. Guarde este e-mail.\nDúvidas: responda a este e-mail ou chame no WhatsApp (11) 98869-7165.\n\nRenderiza · renderizaweb.com.br`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1e2528;max-width:560px">`
    + `<p style="font-size:18px;font-weight:700">Contrato assinado</p><p>Este é o comprovante da assinatura eletrônica.</p>`
    + `<table style="border-collapse:collapse;width:100%;font-size:14px">${linhas.map(([k, v]) => `<tr><td style="padding:6px 8px;border-top:1px solid #e8e2ee;color:#5b6670;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 8px;border-top:1px solid #e8e2ee;word-break:break-all">${esc(v)}</td></tr>`).join("")}</table>`
    + `<p>A impressão digital confere com o texto publicado no endereço acima. Guarde este e-mail.</p>`
    + `<p style="color:#5b6670">Dúvidas: responda a este e-mail ou chame no WhatsApp (11) 98869-7165.<br>Renderiza · renderizaweb.com.br</p></div>`;
  return { assunto: `Contrato assinado · protocolo ${d.protocolo}`, texto, html };
}

/**
 * Atende o pedido { termo, email } (o código) ou { acao: "comprovante", termo, protocolo }. `deps`: { temChave,
 * registrar({ termo, email, hash, ip }) → { ok, erro }, comprovante({ termo, protocolo }) → { ok, ...dados },
 * enviar({ para, copia, assunto, texto, html }) }. Devolve { status, corpo, headers }. Erros (corpo.erro): "formato",
 * "email", "fora" (termo fechado ou sem código), "espera" (menos de 1 minuto do último), "limite", "desligado"
 * (sem a chave do Brevo), "envio" (o Brevo não aceitou).
 */
export async function atender({ metodo, origem, ip = "", corpo }, deps) {
  const headers = cabecalhosCors(origem);
  const responder = (status, conteudo) => ({ status, corpo: conteudo, headers });
  if (metodo === "OPTIONS") return responder(204, null);
  if (metodo !== "POST") return responder(405, { ok: false, erro: "formato" });
  const termo = String((corpo && corpo.termo) || "");
  if (!TERMO.test(termo)) return responder(400, { ok: false, erro: "formato" });
  if (corpo && corpo.acao === "comprovante") {
    const protocolo = String(corpo.protocolo || "").toUpperCase();
    if (!PROTOCOLO.test(protocolo)) return responder(400, { ok: false, erro: "formato" });
    if (!deps.temChave) return responder(503, { ok: false, erro: "desligado" });
    const d = await deps.comprovante({ termo, protocolo });
    if (!d || !d.ok) return responder(409, { ok: false, erro: (d && d.erro) || "fora" });
    try {
      await deps.enviar({ para: d.email, copia: COPIA, ...emailDoComprovante(d) });
    } catch (e) {
      return responder(502, { ok: false, erro: "envio" });
    }
    return responder(200, { ok: true, para: d.email });
  }
  const email = normalizarEmail(corpo && corpo.email);
  if (!EMAIL.test(email) || email.length > 120) return responder(400, { ok: false, erro: "email" });
  if (!deps.temChave) return responder(503, { ok: false, erro: "desligado" });
  const codigo = novoCodigo();
  const r = await deps.registrar({ termo, email, hash: await cifrar(termo, email, codigo), ip });
  if (!r || !r.ok) {
    const erro = (r && r.erro) || "fora";
    return responder(erro === "espera" || erro === "limite" ? 429 : erro === "email" ? 400 : 409, { ok: false, erro });
  }
  try {
    await deps.enviar({ para: email, ...emailDoCodigo(codigo) });
  } catch (e) {
    return responder(502, { ok: false, erro: "envio" });
  }
  return responder(200, { ok: true });
}
