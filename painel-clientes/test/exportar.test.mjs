// Exportar tudo (Missão 3, bloco F): a planilha CSV (Excel em português), o zip feito no navegador e o que vai nele.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { csv, crc32, zip, arquivosDaExportacao } from "../src/telas/exportar.js";
import { nicho } from "../src/nichos/index.js";

test("CSV: ponto e vírgula, aspas quando precisa, número com vírgula, BOM e CRLF", () => {
  const t = csv([{ a: "Ana; Bia", b: 1500.5, c: 'diz "oi"', d: null }, { a: "Linha\nnova", b: 0, c: "", d: undefined }], [["Nome", l => l.a], ["Valor", l => l.b], ["Recado", l => l.c], ["Vazio", l => l.d]]);
  assert.equal(t, '﻿Nome;Valor;Recado;Vazio\r\n"Ana; Bia";1500,5;"diz ""oi""";\r\n"Linha\nnova";0;;\r\n');
});

test("CRC-32 conhecido e o zip abre no unzip, com os acentos no nome", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")).toString(16), "cbf43926");
  const bytes = zip([{ nome: "LEIA-ME.txt", conteudo: "olá" }, { nome: "contratos/001-júlia.txt", conteudo: "Contrato\n" }], new Date(2026, 9, 29, 10, 30, 0));
  const pasta = mkdtempSync(join(tmpdir(), "zip-"));
  try {
    writeFileSync(join(pasta, "t.zip"), bytes);
    let lista = null;
    try { lista = execFileSync("unzip", ["-Z1", join(pasta, "t.zip")], { encoding: "utf8" }); } catch (e) { lista = null; }
    if (lista !== null) {
      assert.deepEqual(lista.trim().split("\n"), ["LEIA-ME.txt", "contratos/001-júlia.txt"]);
      execFileSync("unzip", ["-q", join(pasta, "t.zip"), "-d", join(pasta, "x")]);
      assert.equal(readFileSync(join(pasta, "x", "contratos", "001-júlia.txt"), "utf8"), "Contrato\n");
    }
    assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50, "começa pelo cabeçalho de arquivo");
    assert.equal(new DataView(bytes.buffer).getUint32(bytes.length - 22, true), 0x06054b50, "termina pelo fim do diretório");
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

test("o que vai no zip: LEIA-ME, uma planilha por assunto visível e o texto de cada contrato", () => {
  const d = {
    clientes: [{ nome: "Ana", whatsapp: "11999990000", criado_em: "2026-10-01T12:00:00Z" }],
    pedidos: null, // sem acesso ao Atendimento: a planilha não vai
    reservas: [{ titulo: null, inicio: "2026-12-12T22:00:00Z", fim: "2026-12-13T06:00:00Z", situacao: "confirmada", clientes: { nome: "Ana" }, tipos_reserva: { nome: "Casamento" }, reservas_valores: { valor_total: 28900, sinal: 8670, desconto: null } }],
    parcelas: [{ descricao: "Sinal", valor: "8670.00", vence_em: "2026-10-30", pago_em: null, clientes: { nome: "Ana" }, reservas: { inicio: "2026-12-12T22:00:00Z", tipos_reserva: { nome: "Casamento" } } }],
    contratos: [{ texto: "Contrato da Ana.", hash: "abc", situacao: "aceito", aceito_em: "2026-10-28T13:00:00Z", aceito_nome: "Ana Souza", aceito_contato: "ana@x.teste", clientes: { nome: "Ana Souza" }, reservas: null }],
    servicos: [{ nome: "Clássico", valor: 26500, sinal: 7950, ativo: true }],
  };
  const arquivos = arquivosDaExportacao(d, { nicho: nicho("eventos"), fuso: "America/Sao_Paulo", conta: { nome: "Villa Alecrim" }, agora: new Date("2026-10-29T15:00:00Z") });
  assert.deepEqual(arquivos.map(a => a.nome), ["LEIA-ME.txt", "clientes.csv", "festas.csv", "pagamentos.csv", "contratos.csv", "contratos/001-ana-souza.txt", "pacotes.csv"]);
  const festas = arquivos.find(a => a.nome === "festas.csv").conteudo;
  assert.match(festas, /\r\nAna;;Casamento;12\/12\/2026 19h;13\/12\/2026 3h;;Confirmada;28900;8670;;\r\n$/);
  assert.match(arquivos.find(a => a.nome === "pagamentos.csv").conteudo, /\r\nAna;Casamento · 12\/12\/2026 19h;Sinal;8670;30\/10\/2026;;;\r\n$/);
  assert.match(arquivos.find(a => a.nome === "contratos.csv").conteudo, /Aceito;;28\/10\/2026 10h;Ana Souza;ana@x\.teste;;;abc;contratos\/001-ana-souza\.txt/);
  assert.match(arquivos.find(a => a.nome === "contratos/001-ana-souza.txt").conteudo, /^Contrato da Ana\.\n\n---\nAceito em 28\/10\/2026 10h por Ana Souza \(ana@x\.teste\)\. Impressão digital do texto \(SHA-256\): abc\n$/);
  assert.match(arquivos[0].conteudo, /^Os dados de Villa Alecrim no Painel Renderiza, exportados em 29\/10\/2026 às 12h\./);
});
