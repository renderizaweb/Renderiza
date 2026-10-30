// Primeiros passos no Início: os itens por conta e a leitura das datas (digitar rápido e CSV).
import { test } from "node:test";
import assert from "node:assert/strict";
import { passosDaConta, lerLinhaRapida, lerDatas, reservasDosItens, duracaoPadrao, chaveDoCliente, colunasDoCabecalho, MAXIMO_DA_IMPORTACAO } from "../src/modulos/inicio/primeiros-passos.js";

const HOJE = "2026-10-29";

test("os itens seguem os módulos ligados e o que o banco já tem", () => {
  const conta = { nicho: "eventos", modulos: ["agenda", "atendimento"] };
  assert.deepEqual(passosDaConta(conta).map(p => p.id), ["valores", "datas", "pedido", "equipe"]);
  assert.match(passosDaConta(conta)[0].titulo, /pacotes/);
  assert.match(passosDaConta({ nicho: "fotografia", modulos: [] })[0].titulo, /tipos de ensaio/);
  const semNenhum = passosDaConta(conta, { semServicos: true })[0];
  assert.match(semNenhum.titulo, /^Cadastrar os seus pacotes, com os valores/, "a conta criada pelo Admin começa sem pacotes");
  assert.equal(semNenhum.acao.rotulo, "Cadastrar");
  assert.deepEqual(passosDaConta({ nicho: "eventos", modulos: ["contratos"] }).map(p => p.id), ["valores", "equipe"], "sem Agenda nem Atendimento, não importa datas");
  const feitos = passosDaConta(conta, { reservas: true, equipe: true }).filter(p => p.feito).map(p => p.id);
  assert.deepEqual(feitos, ["datas", "equipe"]);
});

test("digitar rápido: data, hora se tiver, nome, WhatsApp se tiver", () => {
  assert.deepEqual(lerLinhaRapida("31/10 Juliana Souza", HOJE), { data: "2026-10-31", hora: null, nome: "Juliana Souza", whatsapp: null, tipo: "" });
  assert.deepEqual(lerLinhaRapida("07/11 20h Ana e Pedro (11) 98888-7777", HOJE), { data: "2026-11-07", hora: "20:00", nome: "Ana e Pedro", whatsapp: "11988887777", tipo: "" });
  assert.equal(lerLinhaRapida("14/11/2026 - Festa da Bia", HOJE).nome, "Festa da Bia");
  assert.equal(lerLinhaRapida("2027-03-14 19:30 Lu, 11988887777", HOJE).hora, "19:30");
  assert.equal(lerLinhaRapida("15/12 15 anos da Bia", HOJE).nome, "15 anos da Bia", "número sem h não é hora");
  assert.equal(lerLinhaRapida("28/10 Antiga", HOJE).data, "2027-10-28", "sem ano: a próxima");
  assert.match(lerLinhaRapida("32/10 X", HOJE).erro, /data/);
  assert.match(lerLinhaRapida("31/10", HOJE).erro, /nome/);
});

test("CSV: pelo cabeçalho (com a hora junto da data) ou como o digitar rápido", () => {
  assert.deepEqual(colunasDoCabecalho(["Data", "Horário", "Cliente", "Celular", "Tipo de festa"]), { data: 0, hora: 1, nome: 2, whatsapp: 3, tipo: 4 });
  assert.equal(colunasDoCabecalho(["31/10", "Juliana"]), null);
  const r = lerDatas("Data;Hora;Nome;WhatsApp;Tipo\n31/10/2026;19:00;Juliana;(11) 98888-7777;Casamento\n07/11/2026 20:00:00;;Ana;;\n08/11/2026 00:00:00;;Lia;;\nxx;;Bia;;\n", { csv: true, hoje: HOJE });
  assert.deepEqual(r.itens.map(i => [i.linha, i.data, i.hora, i.nome, i.whatsapp, i.tipo]), [
    [2, "2026-10-31", "19:00", "Juliana", "11988887777", "Casamento"],
    [3, "2026-11-07", "20:00", "Ana", null, ""],
    [4, "2026-11-08", null, "Lia", null, ""],
  ]);
  assert.deepEqual(r.erros, [{ linha: 5, erro: "Não entendi a data (use 31/10/2026)." }]);
  const semCabecalho = lerDatas("31/10/2026,Juliana,11988887777\n", { csv: true, hoje: HOJE });
  assert.equal(semCabecalho.itens[0].whatsapp, "11988887777");
  const muitas = Array.from({ length: MAXIMO_DA_IMPORTACAO + 1 }, (_, i) => `31/10 Pessoa ${i}`).join("\n");
  assert.equal(lerDatas(muitas, { hoje: HOJE }).erros[0].linha, 0);
});

test("as reservas: no fuso da conta, com a duração do nicho e o tipo pelo nome", () => {
  assert.equal(duracaoPadrao("eventos"), 480);
  assert.equal(duracaoPadrao("fotografia"), 60);
  const itens = [{ data: "2026-10-31", hora: null, nome: "Ju", whatsapp: null, tipo: "CASAMENTO" }, { data: "2026-10-01", hora: "10:00", nome: "Lu", whatsapp: null, tipo: "" }];
  const [a, b] = reservasDosItens(itens, { nicho: "eventos", fuso: "America/Sao_Paulo", tipos: [{ id: "t1", nome: "Casamento" }], hoje: HOJE });
  assert.deepEqual(a, { inicio: "2026-10-31T22:00:00.000Z", fim: "2026-11-01T06:00:00.000Z", situacao: "confirmada", tipo_id: "t1" });
  assert.equal(b.situacao, "realizada", "data que já passou");
  const [f] = reservasDosItens([{ data: "2026-11-02", hora: "09:00", nome: "Mi", tipo: "Newborn" }], { nicho: "fotografia", tipos: [{ id: "s1", nome: "Newborn", duracao_min: 180 }], hoje: HOJE });
  assert.equal(f.servico_id, "s1");
  assert.equal(Date.parse(f.fim) - Date.parse(f.inicio), 180 * 60000);
  assert.equal(chaveDoCliente({ whatsapp: "11988887777", nome: "X" }), "w:11988887777");
  assert.equal(chaveDoCliente({ whatsapp: null, nome: " Júlia " }), "n:julia");
});
