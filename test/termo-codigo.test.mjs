import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { atender, cabecalhosCors, cifrar, emailDoCodigo, ipDe, novoCodigo } from "../supabase/functions/termo-codigo/logica.js";

const TERMO = "vereador-mateuzinho-silva-v1";
function deps(resposta = { ok: true }) {
  const d = { temChave: true, registros: [], enviados: [] };
  d.registrar = async r => { d.registros.push(r); return resposta; };
  d.enviar = async e => { d.enviados.push(e); };
  return d;
}

test("o hash é o mesmo que o banco confere: sha256 de termo:email:código", async () => {
  const esperado = createHash("sha256").update(`${TERMO}:a@b.com:012345`).digest("hex");
  assert.equal(await cifrar(TERMO, "a@b.com", "012345"), esperado);
});

test("o código tem 6 números e descarta o fim da faixa (sem viés)", () => {
  const seq = [4294967295, 4294000000, 1234];
  assert.equal(novoCodigo(() => seq.shift()), "001234");
  for (let i = 0; i < 50; i++) assert.match(novoCodigo(), /^\d{6}$/);
});

test("manda o código: registra o hash com o IP e envia o e-mail com o mesmo código", async () => {
  const d = deps();
  const r = await atender({ metodo: "POST", origem: "https://www.renderizaweb.com.br", ip: "200.1.2.3", corpo: { termo: TERMO, email: "  Pessoa@Exemplo.com.BR " } }, d);
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo, { ok: true });
  assert.equal(r.headers["Access-Control-Allow-Origin"], "https://www.renderizaweb.com.br");
  assert.equal(d.registros.length, 1);
  const { termo, email, hash, ip } = d.registros[0];
  assert.equal(termo, TERMO); assert.equal(email, "pessoa@exemplo.com.br"); assert.equal(ip, "200.1.2.3");
  assert.equal(d.enviados[0].para, "pessoa@exemplo.com.br");
  const codigo = d.enviados[0].assunto.slice(0, 6);
  assert.match(codigo, /^\d{6}$/);
  assert.ok(d.enviados[0].texto.includes(codigo) && d.enviados[0].html.includes(codigo));
  assert.equal(hash, await cifrar(TERMO, "pessoa@exemplo.com.br", codigo));
});

test("recusa formato, e-mail inválido e sem a chave do Brevo, sem registrar nada", async () => {
  const d = deps();
  assert.equal((await atender({ metodo: "POST", corpo: { termo: "X!", email: "a@b.com" } }, d)).corpo.erro, "formato");
  assert.equal((await atender({ metodo: "POST", corpo: { termo: TERMO, email: "nao-e-email" } }, d)).corpo.erro, "email");
  const sem = { ...deps(), temChave: false };
  const r = await atender({ metodo: "POST", corpo: { termo: TERMO, email: "a@b.com" } }, sem);
  assert.equal(r.status, 503); assert.equal(r.corpo.erro, "desligado");
  assert.equal(d.registros.length + sem.registros.length, 0);
  assert.equal((await atender({ metodo: "GET", corpo: {} }, d)).status, 405);
  assert.equal((await atender({ metodo: "OPTIONS", corpo: {} }, d)).status, 204);
});

test("os limites do banco voltam para a página e nada é enviado", async () => {
  for (const [erro, status] of [["espera", 429], ["limite", 429], ["fora", 409], ["email", 400]]) {
    const d = deps({ ok: false, erro });
    const r = await atender({ metodo: "POST", corpo: { termo: TERMO, email: "a@b.com" } }, d);
    assert.equal(r.status, status); assert.equal(r.corpo.erro, erro); assert.equal(d.enviados.length, 0);
  }
});

test("se o Brevo recusar, a página sabe", async () => {
  const d = deps();
  d.enviar = async () => { throw new Error("Brevo 401"); };
  const r = await atender({ metodo: "POST", corpo: { termo: TERMO, email: "a@b.com" } }, d);
  assert.equal(r.status, 502); assert.equal(r.corpo.erro, "envio");
});

test("CORS só devolve a origem pedida quando é do site; IP só no formato certo", () => {
  assert.equal(cabecalhosCors("https://renderizaweb.com.br")["Access-Control-Allow-Origin"], "https://renderizaweb.com.br");
  assert.equal(cabecalhosCors("https://malicioso.com")["Access-Control-Allow-Origin"], "https://www.renderizaweb.com.br");
  assert.equal(ipDe({ "x-forwarded-for": "177.10.20.30, 10.0.0.1" }), "177.10.20.30");
  assert.equal(ipDe({ "cf-connecting-ip": "2804:14c::1" }), "2804:14c::1");
  assert.equal(ipDe({ "x-forwarded-for": "<script>" }), "");
  assert.equal(emailDoCodigo("123456").assunto, "123456 é o seu código para assinar o contrato");
});

test("comprovante: busca uma vez no banco e manda para quem assinou, com cópia para a Renderiza", async () => {
  const d = deps();
  const dados = { ok: true, protocolo: "ABC123DEF456", titulo: "Contrato · <b>Teste</b>", pagina: "https://www.renderizaweb.com.br/contrato/x", contratada: "Fulano, CPF 000",
    nome: "Maria <script>", email: "maria@exemplo.com.br", email_confirmado: true, cpf: "***.444.777-**", plano: "sem-plano", em: "2026-11-16T13:00:00Z", ip: "200.1.2.3", impressao: "a".repeat(64) };
  const pedidos = [];
  d.comprovante = async q => { pedidos.push(q); return dados; };
  const r = await atender({ metodo: "POST", corpo: { acao: "comprovante", termo: TERMO, protocolo: "abc123def456" } }, d);
  assert.equal(r.status, 200);
  assert.deepEqual(pedidos, [{ termo: TERMO, protocolo: "ABC123DEF456" }]);
  const e = d.enviados[0];
  assert.equal(e.para, "maria@exemplo.com.br"); assert.equal(e.copia, "contato@renderizaweb.com.br");
  assert.equal(e.assunto, "Contrato assinado · protocolo ABC123DEF456");
  assert.ok(e.html.includes("Maria &lt;script&gt;") && !e.html.includes("<script>") && e.html.includes("&lt;b&gt;Teste"));
  assert.ok(e.texto.includes("16/11/2026, 10:00:00") && e.texto.includes("Sem plano da Renderiza") && e.texto.includes("***.444.777-**") && e.texto.includes("Fulano, CPF 000"));
  assert.equal(d.registros.length, 0);
});

test("comprovante: protocolo fora do formato ou já enviado não manda nada", async () => {
  const d = deps();
  d.comprovante = async () => ({ ok: false, erro: "fora" });
  assert.equal((await atender({ metodo: "POST", corpo: { acao: "comprovante", termo: TERMO, protocolo: "XYZ" } }, d)).corpo.erro, "formato");
  const r = await atender({ metodo: "POST", corpo: { acao: "comprovante", termo: TERMO, protocolo: "ABC123DEF456" } }, d);
  assert.equal(r.status, 409); assert.equal(d.enviados.length, 0);
});
