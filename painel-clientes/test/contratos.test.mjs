// Contratos (Missão 3, bloco E): os campos do modelo, o texto preenchido, o que falta, o link, as mensagens, as
// festas sem contrato e a ordem da lista.
import { test } from "node:test";
import assert from "node:assert/strict";
import { valoresDosCampos, preencherModelo, camposNoTexto, linkDoContrato, mensagemDoContrato, mensagemDeLembrete, esperandoHa, semContrato, chipsDeContratos, grupoInicial, filtrarContratos } from "../src/modulos/contratos/logica.js";
import { nicho } from "../src/nichos/index.js";

const SP = "America/Sao_Paulo";
const reserva = { inicio: "2026-12-12T22:00:00Z", fim: "2026-12-13T06:00:00Z", convidados: 150, tipos_reserva: { nome: "Casamento" }, servicos: { nome: "Clássico" } };

test("os campos saem da festa, dos valores, do cliente e da conta", () => {
  const v = valoresDosCampos({ reserva, valores: { valor_total: 28900, sinal: 8670, desconto: 900 }, cliente: { nome: "Juliana & Pedro" },
    ficha: { endereco: "Rua das Flores, 10", cpf: null }, adicionais: ["Cabine de fotos", "Mesa de doces"], conta: { nome: "Villa Alecrim" }, fuso: SP, agora: new Date("2026-10-29T15:00:00Z") });
  assert.deepEqual(v, {
    cliente: "Juliana & Pedro", data: "12/12/2026", data_extenso: "sábado, 12 de dezembro", horario: "19h às 3h", tipo: "Casamento", pacote: "Clássico",
    convidados: "150", adicionais: "Cabine de fotos, Mesa de doces", valor: "R$ 28.000,00", sinal: "R$ 8.670,00", desconto: "R$ 900,00",
    endereco: "Rua das Flores, 10", negocio: "Villa Alecrim", hoje: "29/10/2026",
  });
  assert.deepEqual(Object.keys(valoresDosCampos({ cliente: { nome: "Ana" }, fuso: SP })), ["cliente", "hoje"], "sem festa: só o que existe");
});

test("preencher o modelo: troca os conhecidos, avisa os que faltam, deixa os desconhecidos", () => {
  const { texto, faltando } = preencherModelo("Contratante: {cliente}\nData: {data}\nSinal: {sinal}\nCPF: {cpf}\nOutro: {qualquer_coisa}", { cliente: "Ana", data: "12/12/2026" });
  assert.equal(texto, "Contratante: Ana\nData: 12/12/2026\nSinal: {sinal}\nCPF: {cpf}\nOutro: {qualquer_coisa}");
  assert.deepEqual(faltando, ["sinal", "cpf"]);
  assert.deepEqual(camposNoTexto(texto), ["sinal", "cpf"], "o contrato não sai com {sinal} no texto");
  assert.deepEqual(camposNoTexto("Tudo certo, {qualquer_coisa} é texto do cliente."), []);
});

test("o link e as mensagens (sem cobrar, com o nome do negócio)", () => {
  const link = linkDoContrato("https://painel.renderizaweb.com.br/", "abc123def456ghi789");
  assert.equal(link, "https://painel.renderizaweb.com.br/c/abc123def456ghi789");
  const c = { clientes: { nome: "Juliana Souza" } };
  assert.equal(mensagemDoContrato(c, { conta: { nome: "Villa Alecrim" }, nicho: nicho("eventos"), link }),
    `Oi, Juliana! Aqui é do espaço Villa Alecrim. Segue o contrato da sua festa para você ler e aceitar pelo celular: ${link}`);
  assert.match(mensagemDeLembrete(c, { conta: { nome: "Estúdio Ciranda" }, nicho: nicho("fotografia"), link }), /^Oi, Juliana! Aqui é do Estúdio Ciranda\. Passando para lembrar do contrato do seu ensaio: /);
  const agora = Date.parse("2026-10-29T15:00:00Z");
  assert.equal(esperandoHa({ situacao: "enviado", enviado_em: "2026-10-26T15:00:00Z" }, agora), "Esperando o aceite há 3 dias");
  assert.equal(esperandoHa({ situacao: "aceito", enviado_em: "2026-10-26T15:00:00Z" }, agora), "");
});

test("sem contrato: festas futuras, não canceladas, sem contrato ativo (cancelado não conta)", () => {
  const agora = Date.parse("2026-10-29T15:00:00Z");
  const reservas = [
    { id: "a", inicio: "2026-11-20T22:00:00Z", fim: "2026-11-21T03:00:00Z", situacao: "confirmada" },
    { id: "b", inicio: "2026-11-10T22:00:00Z", fim: "2026-11-11T03:00:00Z", situacao: "pre_reserva" },
    { id: "c", inicio: "2026-12-01T22:00:00Z", fim: "2026-12-02T03:00:00Z", situacao: "confirmada" },
    { id: "d", inicio: "2026-10-01T22:00:00Z", fim: "2026-10-02T03:00:00Z", situacao: "realizada" },
    { id: "e", inicio: "2026-12-05T22:00:00Z", fim: "2026-12-06T03:00:00Z", situacao: "cancelada" },
  ];
  const contratos = [{ reserva_id: "a", situacao: "aceito" }, { reserva_id: "c", situacao: "cancelado" }];
  assert.deepEqual(semContrato(reservas, contratos, agora).map(r => r.id), ["b", "c"]);
});

test("chips, o grupo que abre primeiro e a ordem da lista", () => {
  const agora = Date.parse("2026-10-29T15:00:00Z");
  const contratos = [
    { id: "1", situacao: "enviado", enviado_em: "2026-10-27T10:00:00Z", clientes: { nome: "Bruno" } },
    { id: "2", situacao: "enviado", enviado_em: "2026-10-20T10:00:00Z", clientes: { nome: "Ana" } },
    { id: "3", situacao: "aceito", reservas: { inicio: "2026-12-12T22:00:00Z" }, clientes: { nome: "Júlia" } },
    { id: "4", situacao: "aceito", reservas: { inicio: "2026-11-01T22:00:00Z" }, clientes: { nome: "Caio" } },
    { id: "5", situacao: "aceito", reservas: { inicio: "2026-09-01T22:00:00Z" }, clientes: { nome: "Davi" } },
    { id: "6", situacao: "orcamento", criado_em: "2026-10-28T10:00:00Z", clientes: { nome: "Érica" } },
  ];
  assert.deepEqual(chipsDeContratos(contratos, [{}, {}]).map(c => [c.valor, c.quantos]), [["enviado", 2], ["orcamento", 1], ["sem", 2], ["aceito", 3], ["cancelado", 0]]);
  assert.equal(grupoInicial(contratos, []), "enviado");
  assert.equal(grupoInicial(contratos.filter(c => c.situacao === "aceito"), [{}]), "sem");
  assert.equal(grupoInicial([], []), "aceito");
  assert.deepEqual(filtrarContratos(contratos, { grupo: "enviado", agora }).map(c => c.id), ["2", "1"], "quem espera mais vem primeiro");
  assert.deepEqual(filtrarContratos(contratos, { grupo: "aceito", agora }).map(c => c.id), ["4", "3", "5"], "a festa mais perto primeiro; as que passaram no fim");
  assert.deepEqual(filtrarContratos(contratos, { grupo: "aceito", busca: "julia", agora }).map(c => c.id), ["3"], "busca sem acento");
});
