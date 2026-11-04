// A leitura da função "assistente" (Missão 7, bloco F; supabase/functions/assistente/leitura.js): o arquivo só da pasta
// da conta, o link temporário para a IA, o arquivo apagado depois (D49; o do pedido à Renderiza fica), a resposta
// conferida (preços, datas, WhatsApp, os campos do contrato) e o mapa das colunas de uma planilha. A IA e o Supabase
// aqui são de mentira.
import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, montarPedido, paraOpenAI, paraAnthropic, TAREFAS } from "../supabase/functions/assistente/logica.js";
import { CAMPOS_DO_CONTRATO } from "../supabase/functions/assistente/campos.js";
import { CAMPOS } from "../src/modulos/contratos/logica.js";

const CONTA = "11111111-2222-3333-4444-555555555555";
const DA_CONTA = { conta: { id: CONTA, nome: "Espaço Lira", nicho: "eventos" }, contexto: null };
const LIDO = {
  resumo: "Tabela com 2 pacotes e uma agenda",
  pacotes: [
    { nome: "  Pacote Ouro ", preco: 8500, sinal: 2000, convidados: 150, duracao_min: 300, descricao: "Buffet completo", inclui: ["Buffet", "DJ", ""] },
    { nome: "", preco: 1, sinal: null, convidados: null, duracao_min: null, descricao: "", inclui: [] },
    { nome: "Pacote Prata", preco: -5, sinal: null, convidados: 0, duracao_min: 5, descricao: "", inclui: [] },
  ],
  adicionais: [{ nome: "Hora extra", preco: 600 }],
  datas: [
    { dia: 14, mes: 11, ano: null, hora: "19:00", nome: "Ana e Pedro", whatsapp: "(11) 98888-7777", tipo: "Casamento", convidados: 120, observacao: "" },
    { dia: 31, mes: 2, ano: 2027, hora: "25:00", nome: "Joana", whatsapp: "123", tipo: "", convidados: null, observacao: "" },
    { dia: 40, mes: 1, ano: null, hora: "", nome: "Inválida", whatsapp: "", tipo: "", convidados: null, observacao: "" },
  ],
  clientes: [{ nome: "Carla Souza", whatsapp: "+55 11 97777-6666", email: "CARLA@EXEMPLO.COM", observacao: "" }, { nome: "", whatsapp: "", email: "", observacao: "" }],
  contrato: { tem: true, nome: "Contrato de locação", texto: `CONTRATO DE LOCAÇÃO\n\n\nContratante: {cliente}, CPF {cpf}.\nData do evento: {data}. Valor: {valor}. Multa: {multa}.\n${"Cláusula de exemplo. ".repeat(20)}` },
};
const daOpenAI = json => ({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(json) }] }], usage: { input_tokens: 3000, input_tokens_details: { cached_tokens: 0 }, output_tokens: 900 } });

function deps({ ia = true, link = "https://supa.teste/assinado/orcamento.pdf?token=x", gasto = { usd: 0.1, teto: 3, naHora: 1 } } = {}) {
  const ch = { pedidos: [], apagados: [], limpou: 0, registros: [] };
  return {
    ch,
    ia: ia ? { fornecedor: "openai", modelo: "gpt-5.4-mini", chamar: async p => { ch.pedidos.push(p); return daOpenAI(LIDO); } } : null,
    usuarioDoToken: async () => ({ id: "u1" }),
    podeUsar: async (u, c) => (c === CONTA ? DA_CONTA : null),
    gasto: async () => gasto,
    registrar: async u => { ch.registros.push(u); },
    linkDoArquivo: async () => link,
    apagarArquivo: async c => { ch.apagados.push(c); },
    limpar: async () => { ch.limpou++; },
  };
}
const ler = (entrada, conta = CONTA) => ({ metodo: "POST", origem: "http://localhost:5180", token: "t", corpo: { conta, tarefa: "ler", entrada } });
const ARQUIVO = { caminho: `${CONTA}/lote-abc12345/orcamento.pdf`, tipo: "pdf", nome: "orcamento.pdf" };

test("os campos do contrato da função são os do painel", () => {
  assert.deepEqual(CAMPOS_DO_CONTRATO, CAMPOS);
});

test("ler: só arquivo da pasta da conta, no formato; texto colado também", () => {
  const v = TAREFAS.ler.entradaValida;
  assert.ok(v({ arquivo: ARQUIVO, hoje: "2026-11-04" }));
  assert.ok(v({ arquivo: { ...ARQUIVO, caminho: `${CONTA}/pedido-abc12345/agenda.jpg`, tipo: "imagem" }, hoje: "2026-11-04" }));
  assert.ok(!v({ arquivo: { ...ARQUIVO, caminho: `${CONTA}/../x/orcamento.pdf` }, hoje: "2026-11-04" }), "sem subir pasta");
  assert.ok(!v({ arquivo: { ...ARQUIVO, tipo: "planilha" }, hoje: "2026-11-04" }), "planilha é lida no aparelho");
  assert.ok(!v({ arquivo: ARQUIVO }), "sem o dia de hoje");
  assert.ok(v({ texto: "14/11 Ana e Pedro casamento", hoje: "2026-11-04" }));
  assert.ok(!v({ texto: "x".repeat(120001), hoje: "2026-11-04" }));
});

test("ler: o arquivo de outra conta não passa, nem com a conta certa no pedido", async () => {
  const d = deps();
  const r = await atender(ler({ arquivo: { ...ARQUIVO, caminho: `99999999-2222-3333-4444-555555555555/lote-abc12345/a.pdf` }, hoje: "2026-11-04" }), d);
  assert.equal(r.status, 400);
  assert.equal(d.ch.pedidos.length, 0);
});

test("ler: o link temporário vai para a IA, a resposta volta conferida e o arquivo sai do Storage", async () => {
  const d = deps();
  const r = await atender(ler({ arquivo: ARQUIVO, hoje: "2026-11-04" }), d);
  assert.equal(r.status, 200);
  assert.equal(r.corpo.ok, true);
  const p = d.ch.pedidos[0];
  assert.deepEqual(p.anexo, { tipo: "pdf", nome: "orcamento.pdf", url: "https://supa.teste/assinado/orcamento.pdf?token=x" });
  assert.equal(p.prazo, 130000, "ler espera mais que as perguntas");
  const o = paraOpenAI(p, "gpt-5.4-mini");
  assert.deepEqual(o.input[2].content[1], { type: "input_file", file_url: p.anexo.url });
  assert.equal(o.input[2].content[0].type, "input_text");
  assert.match(o.input[2].content[0].text, /Hoje é 2026-11-04/);
  const res = r.corpo.resultado;
  assert.deepEqual(res.pacotes.map(x => x.nome), ["Pacote Ouro", "Pacote Prata"], "sem nome sai; o nome sem espaço sobrando");
  assert.deepEqual(res.pacotes[0].inclui, ["Buffet", "DJ"]);
  assert.equal(res.pacotes[1].preco, null, "preço negativo vira sem preço");
  assert.equal(res.pacotes[1].convidados, null);
  assert.equal(res.pacotes[1].duracao_min, null);
  assert.equal(res.datas.length, 2, "dia 40 sai");
  assert.equal(res.datas[0].whatsapp, "11988887777");
  assert.equal(res.datas[1].hora, "", "hora impossível vira sem hora");
  assert.equal(res.datas[1].whatsapp, "", "número curto não é WhatsApp");
  assert.deepEqual(res.clientes, [{ nome: "Carla Souza", whatsapp: "5511977776666", email: "carla@exemplo.com", observacao: "" }]);
  assert.match(res.contrato.texto, /^CONTRATO DE LOCAÇÃO\n\nContratante: \{cliente\}, CPF \{cpf\}/, "parágrafos mantidos, três quebras viram duas");
  assert.match(res.contrato.texto, /Multa: multa\./, "campo que o painel não tem vira texto");
  assert.deepEqual(d.ch.apagados, [ARQUIVO.caminho], "o arquivo lido sai do Storage (D49)");
  assert.equal(d.ch.limpou, 1);
  assert.equal(d.ch.registros[0].tarefa, "ler");
});

test("ler: uma foto vai como imagem; o arquivo do pedido à Renderiza fica até ela atender", async () => {
  const d = deps();
  const foto = { caminho: `${CONTA}/pedido-abc12345/agenda.jpg`, tipo: "imagem", nome: "agenda.jpg" };
  await atender(ler({ arquivo: foto, hoje: "2026-11-04" }), d);
  assert.deepEqual(paraOpenAI(d.ch.pedidos[0], "m").input[2].content[1], { type: "input_image", image_url: "https://supa.teste/assinado/orcamento.pdf?token=x", detail: "high" });
  assert.deepEqual(paraAnthropic(d.ch.pedidos[0], "m").messages[0].content[0], { type: "image", source: { type: "url", url: "https://supa.teste/assinado/orcamento.pdf?token=x" } });
  assert.deepEqual(d.ch.apagados, []);
});

test("ler: sem IA ou no teto, o arquivo sai e o painel oferece a Renderiza; sem arquivo no Storage, 404", async () => {
  let d = deps({ ia: false });
  let r = await atender(ler({ arquivo: ARQUIVO, hoje: "2026-11-04" }), d);
  assert.deepEqual(r.corpo, { ok: false, fallback: true, motivo: "sem_ia" });
  assert.deepEqual(d.ch.apagados, [ARQUIVO.caminho]);
  d = deps({ gasto: { usd: 3, teto: 3, naHora: 0 } });
  r = await atender(ler({ arquivo: ARQUIVO, hoje: "2026-11-04" }), d);
  assert.equal(r.corpo.motivo, "teto");
  d = deps({ link: null });
  r = await atender(ler({ arquivo: ARQUIVO, hoje: "2026-11-04" }), d);
  assert.equal(r.status, 404);
  assert.equal(d.ch.pedidos.length, 0);
});

test("ler: texto colado vai dentro da mensagem, sem anexo", async () => {
  const d = deps();
  await atender(ler({ texto: "14/11 19h Ana e Pedro (11) 98888-7777 casamento", nome: "Colado", hoje: "2026-11-04" }), d);
  const p = d.ch.pedidos[0];
  assert.equal(p.anexo, null);
  assert.match(p.mensagem, /<texto_colado>\n14\/11 19h Ana e Pedro/);
  assert.equal(typeof paraOpenAI(p, "m").input[2].content, "string");
  assert.deepEqual(d.ch.apagados, []);
});

test("colunas: o mapa volta só com colunas que existem, sem repetir", () => {
  const e = { nome: "clientes.xlsx", linhas: [["Nome", "Celular", "E-mail"], ["Ana", "11 98888-7777", "ana@x.com"]] };
  assert.ok(TAREFAS.colunas.entradaValida(e));
  assert.ok(!TAREFAS.colunas.entradaValida({ linhas: Array(11).fill(["a"]) }));
  const r = TAREFAS.colunas.validar({ assunto: "clientes", tem_cabecalho: true, colunas: { nome: 0, whatsapp: 1, email: 2, instagram: 1, data: 7, hora: null, tipo: null, valor: null, convidados: null, observacao: null } }, e);
  assert.deepEqual(r, { assunto: "clientes", tem_cabecalho: true, colunas: { nome: 0, whatsapp: 1, email: 2, instagram: null, data: null, hora: null, tipo: null, valor: null, convidados: null, observacao: null } });
  assert.equal(TAREFAS.colunas.validar({ assunto: "planilha", colunas: {} }, e), null);
  assert.match(montarPedido("colunas", e, DA_CONTA).mensagem, /0: \[0\] Nome \| \[1\] Celular/);
});
