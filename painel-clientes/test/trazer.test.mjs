// Trazer o que tem (Missão 7, bloco F): os formatos lidos no aparelho (contatos .vcf, Google Agenda .ics, Excel,
// planilha), os nomes dos arquivos no Storage, e a proposta: juntar o que veio de cada arquivo, o que já está no
// painel, e as linhas para o banco. A tela, no navegador (o fluxo de ponta a ponta no STG).
import { test } from "node:test";
import assert from "node:assert/strict";
import { tipoDoArquivo, porQueNaoLe, nomeParaCaminho, codigoDaPasta, lerVcf, lerIcs, lerXlsx, indiceDaColuna, dataDoExcel, horaDoExcel, tamanhoLegivel } from "../src/telas/trazer/arquivos.js";
import { vazia, juntar, contar, resumo, marcarExistentes, dataDoItem, doVcf, doIcs, mapaPeloCabecalho, daPlanilha, paraGravar, CONTATOS_MARCADOS_ATE } from "../src/telas/trazer/logica.js";
import { nicho } from "../src/nichos/index.js";

const HOJE = "2026-11-04";

test("arquivos: o tipo pela extensão, o motivo de não ler e o nome no Storage", () => {
  assert.equal(tipoDoArquivo("Orçamento 2026.PDF"), "pdf");
  assert.equal(tipoDoArquivo("IMG_1234.HEIC"), "imagem");
  assert.equal(tipoDoArquivo("foto", "image/jpeg"), "imagem");
  assert.equal(tipoDoArquivo("clientes.xlsx"), "planilha");
  assert.equal(tipoDoArquivo("contatos.vcf"), "contatos");
  assert.equal(tipoDoArquivo("agenda.ics"), "agenda");
  assert.equal(tipoDoArquivo("tudo.zip"), "zip");
  assert.equal(tipoDoArquivo("velha.xls"), null);
  assert.match(porQueNaoLe("velha.xls"), /\.xlsx ou \.csv/);
  assert.match(porQueNaoLe("audio.opus"), /print/);
  assert.equal(nomeParaCaminho("Orçamento Festa (final).pdf", 3), "03-orcamento-festa-final.pdf");
  assert.equal(nomeParaCaminho("....", 12), "12-arquivo");
  assert.match(codigoDaPasta("lote"), /^lote-[a-z0-9]{8,12}$/);
  assert.equal(tamanhoLegivel(2.4 * 1024 * 1024), "2,4 MB");
});

test("contatos do celular: nome, celular e e-mail; quoted-printable do Android; sem telefone nem e-mail fica de fora", () => {
  const vcf = [
    "BEGIN:VCARD", "VERSION:3.0", "N:Souza;Ana;;;", "FN:Ana Souza", "TEL;TYPE=HOME:+55 11 3333-4444", "TEL;TYPE=CELL:+55 (11) 98888-7777",
    "EMAIL;TYPE=INTERNET:ANA@EXEMPLO.COM", "END:VCARD",
    "BEGIN:VCARD", "VERSION:2.1", "N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Ara=C3=BAjo;Jos=C3=A9;;;",
    "FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Jos=C3=A9 Ara=", "=C3=BAjo", "TEL;CELL:11977776666", "END:VCARD",
    "BEGIN:VCARD", "VERSION:3.0", "FN:Sem Contato", "END:VCARD",
    "BEGIN:VCARD", "VERSION:3.0", "N:Lima;Bia;;;", "item1.TEL:21 96666-5555", "END:VCARD",
  ].join("\r\n");
  assert.deepEqual(lerVcf(vcf), [
    { nome: "Ana Souza", whatsapp: "5511988887777", email: "ana@exemplo.com" },
    { nome: "José Araújo", whatsapp: "11977776666", email: "" },
    { nome: "Bia Lima", whatsapp: "21966665555", email: "" },
  ]);
});

test("Google Agenda: data e hora no fuso, dia inteiro, o que se repete e o cancelado", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT", "DTSTART:20261114T220000Z", "SUMMARY:Casamento Ana e Pedro", "DESCRIPTION:120 convidados\\, salão", "END:VEVENT",
    "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20261205", "SUMMARY:15 anos da Júlia", "END:VEVENT",
    "BEGIN:VEVENT", "DTSTART;TZID=America/Sao_Paulo:20261210T190000", "SUMMARY:Formatura", "END:VEVENT",
    "BEGIN:VEVENT", "DTSTART;VALUE=DATE:20200101", "RRULE:FREQ=YEARLY", "SUMMARY:Aniversário da mãe", "END:VEVENT",
    "BEGIN:VEVENT", "DTSTART:20261120T200000Z", "STATUS:CANCELLED", "SUMMARY:Cancelado", "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const e = lerIcs(ics, "America/Sao_Paulo");
  assert.deepEqual(e, [
    { data: "2026-11-14", hora: "19:00", nome: "Casamento Ana e Pedro", observacao: "120 convidados, salão", repete: false },
    { data: "2026-12-05", hora: "", nome: "15 anos da Júlia", observacao: "", repete: false },
    { data: "2026-12-10", hora: "19:00", nome: "Formatura", observacao: "", repete: false },
    { data: "2020-01-01", hora: "", nome: "Aniversário da mãe", observacao: "", repete: true },
  ]);
  const { lido } = doIcs(e, HOJE);
  assert.deepEqual(lido.datas.map(d => d.marcado), [true, true, true, false], "o que se repete vem desmarcado");
});

test("Excel: textos compartilhados, texto na célula, número, células puladas e a primeira aba com conteúdo", () => {
  const arquivos = {
    "xl/workbook.xml": '<workbook><sheets><sheet name="Vazia" sheetId="1" r:id="rId1"/><sheet name="Clientes" sheetId="2" r:id="rId2"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>',
    "xl/sharedStrings.xml": "<sst><si><t>Nome</t></si><si><t>WhatsApp</t></si><si><r><t>Ana </t></r><r><t>&amp; Pedro</t></r></si><si><t>Data</t></si></sst>",
    "xl/worksheets/sheet1.xml": "<worksheet><sheetData/></worksheet>",
    "xl/worksheets/sheet2.xml": '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="D1" t="s"><v>3</v></c></row>'
      + '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>11988887777</v></c><c r="D2"><v>46340.791666666664</v></c></row>'
      + '<row r="3"><c r="A3" t="inlineStr"><is><t>Carla</t></is></c></row></sheetData></worksheet>',
  };
  const linhas = lerXlsx(c => arquivos[c] || null);
  assert.deepEqual(linhas, [["Nome", "WhatsApp", "", "Data"], ["Ana & Pedro", "11988887777", "", "46340.791666666664"], ["Carla"]]);
  assert.equal(indiceDaColuna("AB12"), 27);
  assert.equal(dataDoExcel("46340.791666666664"), "2026-11-14");
  assert.equal(horaDoExcel("46340.791666666664"), "19:00");
  assert.equal(dataDoExcel("12"), null);
});

test("planilha: o mapa pelo cabeçalho e as linhas viram datas, clientes ou pacotes", () => {
  const m = mapaPeloCabecalho(["Data", "Horário", "Cliente", "Celular", "Tipo de festa", "Valor"]);
  assert.equal(m.assunto, "datas");
  assert.deepEqual([m.colunas.data, m.colunas.hora, m.colunas.nome, m.colunas.whatsapp, m.colunas.tipo, m.colunas.valor], [0, 1, 2, 3, 4, 5]);
  const datas = daPlanilha([["Data", "Horário", "Cliente", "Celular", "Tipo de festa", "Valor"], ["14/11/2026", "19h", "Ana e Pedro", "(11) 98888-7777", "Casamento", "R$ 8.500"], ["46361", "", "Júlia", "", "15 anos", ""], ["sem data", "", "X", "", "", ""]], m, HOJE);
  assert.deepEqual(datas.datas.map(d => [d.data, d.hora, d.nome, d.tipo]), [["2026-11-14", "19:00", "Ana e Pedro", "Casamento"], ["2026-12-05", "", "Júlia", "15 anos"]]);
  const p = mapaPeloCabecalho(["Pacote", "Preço", "Convidados"]);
  assert.equal(p.assunto, "pacotes");
  assert.deepEqual(daPlanilha([["Pacote", "Preço", "Convidados"], ["Ouro", "8.500,00", "150"]], p, HOJE).pacotes[0], { nome: "Ouro", preco: 8500, convidados: 150, descricao: "", inclui: [] });
  const c = mapaPeloCabecalho(["Nome completo", "E-mail", "Telefone"]);
  assert.equal(c.assunto, "clientes");
  assert.equal(mapaPeloCabecalho(["Coluna A", "Coluna B"]), null, "sem nome no cabeçalho: pede a IA");
});

test("proposta: junta arquivos, o repetido completa o que faltava, a data sem ano é a próxima", () => {
  assert.equal(dataDoItem({ dia: 14, mes: 11, ano: null }, HOJE), "2026-11-14");
  assert.equal(dataDoItem({ dia: 2, mes: 11, ano: null }, HOJE), "2027-11-02", "já passou este ano: o ano que vem");
  assert.equal(dataDoItem({ dia: 31, mes: 2, ano: 2027 }, HOJE), null);
  let { proposta: p, novos } = juntar(vazia(), {
    pacotes: [{ nome: "Pacote Ouro", preco: null, sinal: null, convidados: 150, duracao_min: null, descricao: "", inclui: [] }],
    datas: [{ dia: 14, mes: 11, ano: null, hora: "19:00", nome: "Ana e Pedro", whatsapp: "", tipo: "Casamento", convidados: 120, observacao: "" }],
    clientes: [{ nome: "Carla", whatsapp: "5511977776666", email: "", observacao: "" }],
    contrato: { nome: "Contrato", texto: "Contratante {cliente}" },
  }, "orcamento.pdf", { hoje: HOJE });
  assert.equal(novos, 4);
  ({ proposta: p, novos } = juntar(p, {
    pacotes: [{ nome: "pacote  ouro", preco: 8500, sinal: 2000, convidados: null, duracao_min: null, descricao: "", inclui: [] }],
    datas: [{ data: "2026-11-14", hora: "", nome: "ANA E PEDRO", whatsapp: "(11) 98888-7777", tipo: "", convidados: null, observacao: "" }],
  }, "agenda.jpg", { hoje: HOJE }));
  assert.equal(novos, 0, "os dois já estavam");
  assert.equal(p.pacotes[0].preco, 8500, "o preço que faltava veio da outra tabela");
  assert.equal(p.pacotes[0].convidados, 150, "o que já tinha fica");
  assert.equal(p.datas[0].whatsapp, "11988887777");
  assert.deepEqual(p.datas[0].origens, ["orcamento.pdf", "agenda.jpg"]);
  assert.equal(p.clientes[0].whatsapp, "11977776666", "WhatsApp sem o 55, como no painel");
  assert.deepEqual(contar(p), { pacotes: 1, adicionais: 0, datas: 1, clientes: 1, modelos: 1, total: 4 });
  assert.equal(resumo(contar(p)), "1 pacote, 1 data, 1 cliente e 1 modelo de contrato");
  assert.equal(resumo(contar(p), { nicho: "fotografia" }), "1 ensaio, 1 data, 1 cliente e 1 modelo de contrato");
});

test("proposta: o que já está no painel vem desmarcado; contatos demais vêm desmarcados", () => {
  let { proposta: p } = juntar(vazia(), {
    pacotes: [{ nome: "Pacote Ouro" }, { nome: "Pacote Prata" }],
    clientes: [{ nome: "Carla", whatsapp: "11977776666" }, { nome: "Bruno Lima", whatsapp: "" }, { nome: "Nova", whatsapp: "11911112222" }],
    datas: [{ data: "2026-11-14", nome: "Ana e Pedro" }],
  }, "a.pdf", { hoje: HOJE });
  p = marcarExistentes(p, { pacotes: ["pacote ouro"], clientes: [{ nome: "Carla S.", whatsapp: "11977776666" }, { nome: "bruno lima", whatsapp: null }], datas: [{ data: "2026-11-14", nome: "Ana e Pedro" }] });
  assert.deepEqual(p.pacotes.map(x => [x.nome, x.marcado, x.jaExiste]), [["Pacote Ouro", false, true], ["Pacote Prata", true, false]]);
  assert.deepEqual(p.clientes.map(x => x.marcado), [false, false, true]);
  assert.equal(p.datas[0].jaExiste, true);
  const muitos = Array.from({ length: CONTATOS_MARCADOS_ATE + 1 }, (_, i) => ({ nome: `Contato ${i}`, whatsapp: `119${String(i).padStart(8, "0")}`, email: "" }));
  const v = doVcf(muitos);
  assert.equal(v.marcarContatos, false);
  assert.ok(juntar(vazia(), v.lido, "contatos.vcf", { hoje: HOJE, marcarContatos: v.marcarContatos }).proposta.clientes.every(c => !c.marcado));
});

test("gravar: as linhas de cada tabela, os clientes das datas e os tipos de festa novos", () => {
  let { proposta: p } = juntar(vazia(), {
    pacotes: [{ nome: "Ouro", preco: 8500, sinal: 9000, convidados: 150, duracao_min: null, descricao: "", inclui: ["Buffet"] }, { nome: "Fora", preco: 1 }],
    adicionais: [{ nome: "Hora extra", preco: 600 }],
    datas: [{ data: "2026-11-14", hora: "19:00", nome: "Ana e Pedro", whatsapp: "11988887777", tipo: "Casamento", convidados: 120, observacao: "" },
      { data: "2026-12-05", hora: "", nome: "Júlia", whatsapp: "", tipo: "Debutante", convidados: null, observacao: "" }],
    clientes: [{ nome: "Ana e Pedro", whatsapp: "11988887777", email: "ana@x.com" }],
    contrato: { nome: "Contrato", texto: "Contratante {cliente}" },
  }, "a.pdf", { hoje: HOJE });
  p.pacotes[1].marcado = false;
  const g = paraGravar(p, { contaId: "c1", nicho: nicho("eventos"), tipos: [{ id: "t1", nome: "casamento" }] });
  assert.deepEqual(g.servicos, [{ conta_id: "c1", nome: "Ouro", descricao: null, valor: 8500, sinal: null, convidados_inclusos: 150, inclui: ["Buffet"] }], "sinal maior que o preço não entra");
  assert.deepEqual(g.adicionais, [{ conta_id: "c1", nome: "Hora extra", preco: 600 }]);
  assert.deepEqual(g.modelos, [{ conta_id: "c1", nome: "Contrato", texto: "Contratante {cliente}" }]);
  assert.deepEqual(g.clientes.map(c => [c.chave, c.linha.email]), [["w:11988887777", "ana@x.com"], ["n:julia", null]], "a cliente da data entra uma vez, com o e-mail da lista");
  assert.deepEqual(g.tiposNovos, ["Debutante"]);
  const foto = paraGravar(juntar(vazia(), { pacotes: [{ nome: "Gestante", preco: 900, duracao_min: 5000 }] }, "a", { hoje: HOJE }).proposta, { contaId: "c1", nicho: nicho("fotografia") });
  assert.equal(foto.servicos[0].duracao_min, null, "duração fora do limite do banco fica vazia");
  assert.deepEqual(foto.tiposNovos, []);
});
