// As peças comuns (src/ui/): "Para quem?", paleta, CSV e filtros. As partes puras; as telas, no fluxo do navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { termoDeBusca, validarNovoCliente } from "../src/ui/para-quem.js";
import { filtrarItens } from "../src/ui/paleta.js";
import { paraCsv, lerCsv } from "../src/ui/csv.js";
import { chips } from "../src/ui/filtros.js";
import { vazio, erro } from "../src/ui/estados.js";
import { botoesWhatsapp } from "../src/ui/whatsapp.js";

test("Para quem?: a busca não leva os caracteres da API e acha pelo WhatsApp", () => {
  assert.deepEqual(termoDeBusca("Juliana"), { nome: "Juliana", digitos: "" });
  assert.deepEqual(termoDeBusca("ana,(x)*"), { nome: "ana x", digitos: "" });
  assert.deepEqual(termoDeBusca("(11) 98888"), { nome: "11 98888", digitos: "1198888" });
  assert.equal(termoDeBusca("+55 11 98888-7777").digitos, "11988887777");
  assert.equal(termoDeBusca("12").digitos, "", "dois números ainda não buscam WhatsApp");
  assert.deepEqual(validarNovoCliente({ nome: "", whatsapp: "" }), { nome: "Digite o nome do cliente." });
  assert.deepEqual(validarNovoCliente({ nome: "Ana", whatsapp: "123" }), { whatsapp: "Confira o WhatsApp: DDD e número." });
  assert.deepEqual(validarNovoCliente({ nome: "Ana", whatsapp: "(11) 98888-7777" }), {});
});

test("paleta: acha pelo nome, sem acento e pelos sinônimos", () => {
  const itens = [
    { id: "novo-pagamento", rotulo: "Registrar pagamento" }, { id: "agenda", rotulo: "Agenda" },
    { id: "configuracoes", rotulo: "Configurações" }, { id: "servicos", rotulo: "Serviços" },
  ];
  assert.deepEqual(filtrarItens(itens, "recebi").map(i => i.id), ["novo-pagamento"]);
  assert.deepEqual(filtrarItens(itens, "configuracoes").map(i => i.id), ["configuracoes"]);
  assert.deepEqual(filtrarItens(itens, "festas").map(i => i.id), ["agenda"]);
  assert.deepEqual(filtrarItens(itens, "pacotes").map(i => i.id), ["servicos"]);
  assert.equal(filtrarItens(itens, "").length, 4);
});

test("CSV: abre no Excel em português e não roda fórmula", () => {
  const csv = paraCsv([{ nome: "Ana; Pedro", valor: 1900.5, obs: '=HYPERLINK("x")' }, { nome: "Bia", valor: null, obs: "linha 1\nlinha 2" }],
    [{ titulo: "Nome", valor: l => l.nome }, { titulo: "Valor", valor: l => l.valor }, { titulo: "Obs", valor: l => l.obs }]);
  assert.ok(csv.startsWith("﻿Nome;Valor;Obs\r\n"));
  assert.match(csv, /"Ana; Pedro";1900\.5;"'=HYPERLINK\(""x""\)"/);
  assert.match(csv, /Bia;;"linha 1\nlinha 2"/);
  assert.deepEqual(lerCsv(csv.replace(/^﻿/, "")), [["Nome", "Valor", "Obs"], ["Ana; Pedro", "1900.5", `'=HYPERLINK("x")`], ["Bia", "", "linha 1\nlinha 2"]]);
  assert.deepEqual(lerCsv("data,nome\n14/03/2027,Juliana\n\n21/03/2027,Bia\n"), [["data", "nome"], ["14/03/2027", "Juliana"], ["21/03/2027", "Bia"]]);
});

test("filtros, estados e WhatsApp escapam o texto", () => {
  assert.match(chips({ rotulo: "Etapa", opcoes: [{ valor: "novo", rotulo: "Novo", quantos: 3 }, { valor: "todos", rotulo: "<b>Todos</b>" }], ativo: "novo" }), /aria-pressed="true">Novo <span class="rz-chip-n">3<\/span>/);
  assert.doesNotMatch(chips({ rotulo: "x", opcoes: [{ valor: "a", rotulo: "<b>" }], ativo: "" }), /<b>/);
  assert.match(vazio({ titulo: "Nenhum pacote ainda", texto: "Cadastre o primeiro.", acao: { rotulo: "Novo pacote", dado: "novo" } }), /data-acao="novo"/);
  assert.match(erro("Sem conexão."), /data-tentar/);
  assert.match(botoesWhatsapp("(11) 98888-7777", "Oi!"), /https:\/\/wa\.me\/5511988887777\?text=Oi!/);
  assert.doesNotMatch(botoesWhatsapp("", "Oi!"), /wa\.me/, "sem número: só copiar");
});
