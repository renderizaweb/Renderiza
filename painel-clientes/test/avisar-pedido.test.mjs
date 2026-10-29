// A função do Supabase "avisar-pedido" (supabase/functions/avisar-pedido/logica.js): o e-mail de pedido novo da
// agenda online ao dono. O banco e o Brevo são imitados; a regra de "uma vez só" está em
// supabase/testes/041_aviso_de_pedido.sql.
import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, montarEmail, ambienteDe, dataLonga, foneLegivel } from "../supabase/functions/avisar-pedido/logica.js";

const AVISO = {
  conta: "Villa Alecrim", nicho: "eventos", para: ["dona@villa.teste"],
  cliente: { nome: "Camila <Teste>", whatsapp: "11988887777", email: "camila@exemplo.teste" },
  data: "2026-11-07", inicio: "19:00", fim: "02:00", tipo: "Casamento", pacote: "Clássico", convidados: 120,
  mensagem: "Pré-reserva pela agenda online: À noite, 120 convidados. Quer visitar o espaço.",
};
const PEDIDO = "6c8f0d2e-0000-4000-8000-000000000001";
const deps = (extra = {}) => {
  const enviados = [];
  return { enviados, d: { ambiente: ambienteDe("https://hxzsiiqhlqxuqkevskwb.supabase.co"), temChave: true, aviso: async () => AVISO, enviar: async e => { enviados.push(e); }, ...extra } };
};

test("o e-mail: para os donos, com a data, o cliente, o WhatsApp e o link do painel; HTML escapado", async () => {
  const { enviados, d } = deps();
  const r = await atender({ metodo: "POST", corpo: { pedido: PEDIDO } }, d);
  assert.deepEqual(r.corpo, { enviado: true });
  const e = enviados[0];
  assert.deepEqual(e.para, ["dona@villa.teste"]);
  assert.equal(e.assunto, "Pedido novo pela agenda online: Camila <Teste>, sábado, 7 de novembro");
  assert.match(e.texto, /pediu a pré-reserva de sábado, 7 de novembro, 19h às 2h pela agenda online do site de Villa Alecrim/);
  assert.match(e.texto, /WhatsApp: \(11\) 98888-7777/);
  assert.match(e.texto, /https:\/\/wa\.me\/5511988887777/);
  assert.match(e.texto, /https:\/\/painel\.renderizaweb\.com\.br\/atendimento/);
  assert.ok(e.html.includes("Camila &lt;Teste&gt;") && !e.html.includes("Camila <Teste>"), "o nome do cliente entra escapado");
  assert.match(e.html, /href="https:\/\/wa\.me\/5511988887777"/);
});

test("STG: assunto marcado e link para o painel local", () => {
  const e = montarEmail(AVISO, ambienteDe("https://qxcxllhmtodsptxffbhx.supabase.co"));
  assert.match(e.assunto, /^\[STG\] /);
  assert.match(e.texto, /http:\/\/localhost:5180\/atendimento/);
});

test("fotografia: ensaio e tipo de ensaio no lugar de festa e pacote", () => {
  const e = montarEmail({ ...AVISO, nicho: "fotografia", convidados: null }, ambienteDe(""));
  assert.match(e.texto, /Ensaio: Casamento/);
  assert.match(e.texto, /Tipo de ensaio: Clássico/);
  assert.ok(!/Convidados/.test(e.texto));
});

test("nada a mandar: já avisado, sem e-mail do dono, sem a chave do Brevo; o Brevo recusar não derruba", async () => {
  assert.deepEqual((await atender({ metodo: "POST", corpo: { pedido: PEDIDO } }, deps({ aviso: async () => null }).d)).corpo, { enviado: false });
  assert.equal((await atender({ metodo: "POST", corpo: { pedido: PEDIDO } }, deps({ aviso: async () => ({ ...AVISO, para: [] }) }).d)).corpo.motivo, "sem e-mail do dono");
  const semChave = deps({ temChave: false });
  assert.equal((await atender({ metodo: "POST", corpo: { pedido: PEDIDO } }, semChave.d)).corpo.motivo, "sem a chave do Brevo");
  assert.equal(semChave.enviados.length, 0);
  const r = await atender({ metodo: "POST", corpo: { pedido: PEDIDO } }, deps({ enviar: async () => { throw new Error("401"); } }).d);
  assert.equal(r.status, 502);
});

test("pedido que não é um id, ou outro método: recusado sem perguntar ao banco", async () => {
  let perguntou = false;
  const d = deps({ aviso: async () => { perguntou = true; return AVISO; } }).d;
  for (const corpo of [{}, { pedido: "1 or 1=1" }, null]) assert.equal((await atender({ metodo: "POST", corpo }, d)).status, 400);
  assert.equal((await atender({ metodo: "GET", corpo: {} }, d)).status, 405);
  assert.equal(perguntou, false);
});

test("datas e telefone por extenso", () => {
  assert.equal(dataLonga("2026-11-07"), "sábado, 7 de novembro");
  assert.equal(dataLonga("2027-01-01"), "sexta-feira, 1 de janeiro");
  assert.equal(foneLegivel("11988887777"), "(11) 98888-7777");
  assert.equal(foneLegivel("1133334444"), "(11) 3333-4444");
});
