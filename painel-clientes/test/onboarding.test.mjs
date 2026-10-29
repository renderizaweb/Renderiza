// Onboarding (/comecar) e cadastro (/cadastro): o que vira conta, ordem do menu, tipos de festa e ensaios.
import { test } from "node:test";
import assert from "node:assert/strict";
import { alternarModulo, adicionarEscolha, escolhasIniciais, planoDoCadastro, validarNegocio, estadoInicial, textoDaDuracao, passosDoTrilho, listaEmTexto, MODULOS_SUGERIDOS, OPCOES_DE_SITE, VERSAO } from "../src/telas/comecar.js";
import { painelDaMarca, temaDoNicho, telaDeAcesso } from "../src/telas/acesso.js";
import { mensagemDoCadastro } from "../src/telas/cadastro.js";
import { mascaraTelefone } from "../src/ui/formatos.js";

test("a ordem em que marca os módulos é a ordem do menu", () => {
  let m = [...MODULOS_SUGERIDOS];
  m = alternarModulo(m, "atendimento");
  m = alternarModulo(m, "financeiro");
  m = alternarModulo(m, "contratos");
  assert.deepEqual(m, ["agenda", "financeiro", "contratos"]);
});

test("outro tipo: entra marcado, com cor nova; repetido só marca", () => {
  let e = escolhasIniciais("eventos");
  assert.ok(e.every(x => !x.marcada), "nada vem marcado: a pessoa escolhe");
  e = adicionarEscolha(e, "  Bodas  de prata ", "eventos");
  const bodas = e.at(-1);
  assert.equal(bodas.nome, "Bodas de prata");
  assert.equal(bodas.marcada, true);
  assert.ok(!e.slice(0, -1).some(x => x.cor === bodas.cor), "cor que ainda não foi usada");
  const antes = e.length;
  e = adicionarEscolha(e, "casamento", "eventos");
  assert.equal(e.length, antes);
  assert.equal(e.find(x => x.nome === "Casamento").marcada, true);
  assert.equal(adicionarEscolha(e, "   ", "eventos"), e);
});

test("eventos: a conta, a ordem do menu e os tipos de festa com cor", () => {
  const estado = { ...estadoInicial(), nicho: "eventos", site: "tenho", nome: " Villa Teste ", whatsapp: "(11) 98888-7777", modulos: ["agenda", "contratos"] };
  estado.escolhas = adicionarEscolha(escolhasIniciais("eventos").map((x, i) => ({ ...x, marcada: i === 0 })), "Bodas", "eventos");
  const p = planoDoCadastro(estado);
  assert.deepEqual(p.conta, { nome: "Villa Teste", nicho: "eventos", whatsapp: "11988887777", modulos: ["agenda", "contratos"], meu_nome: null });
  assert.deepEqual(p.ajustes, { ordem_menu: ["agenda", "contratos"], onboarding: { site: "tenho" } });
  assert.equal(p.tabela, "tipos_reserva");
  assert.deepEqual(p.linhas.map(l => [l.nome, l.ordem]), [["Casamento", 0], ["Bodas", 1]]);
  assert.ok(p.linhas.every(l => /^#[0-9a-f]{6}$/i.test(l.cor) && !("duracao_min" in l)));
});

test("fotografia: os ensaios viram serviços com a duração, sem valor", () => {
  const estado = { ...estadoInicial(), nicho: "fotografia", nome: "Estúdio", modulos: [] };
  estado.escolhas = escolhasIniciais("fotografia").map((x, i) => ({ ...x, marcada: i < 2 }));
  estado.escolhas[0].duracao = 120;
  const p = planoDoCadastro(estado);
  assert.deepEqual(p.conta.modulos, MODULOS_SUGERIDOS, "sem módulo marcado: os sugeridos");
  assert.equal(p.conta.whatsapp, null);
  assert.equal(p.tabela, "servicos");
  assert.deepEqual(p.linhas.map(l => [l.nome, l.duracao_min]), [["Ensaio gestante", 120], ["Newborn", 180]]);
  assert.ok(p.linhas.every(l => !("valor" in l)));
  assert.equal(textoDaDuracao(45), "45 min");
  assert.equal(textoDaDuracao(90), "1h30");
  assert.equal(textoDaDuracao(120), "2h");
});

test("nome e WhatsApp: nome obrigatório, WhatsApp opcional mas certo", () => {
  assert.deepEqual(validarNegocio({ nome: "", whatsapp: "" }), { nome: "Digite o nome do negócio.", whatsapp: null, meuNome: null });
  assert.match(validarNegocio({ nome: "X", whatsapp: "1234" }).whatsapp, /DDD/);
  assert.equal(validarNegocio({ nome: "X", whatsapp: "(11) 3333-4444" }).whatsapp, null);
  assert.equal(validarNegocio({ nome: "X", meuNome: "" }, { pedirMeuNome: true }).meuNome, "Digite o seu nome.");
  assert.equal(mascaraTelefone("11988887777"), "(11) 98888-7777");
  assert.equal(mascaraTelefone("119"), "(11) 9");
  assert.equal(mascaraTelefone("1133334444"), "(11) 3333-4444");
});

test("cadastro: os erros do Auth em português", () => {
  assert.match(mensagemDoCadastro({ message: "x", original: { message: "Signups not allowed for this instance" } }), /fechado/);
  assert.match(mensagemDoCadastro({ message: "x", original: { message: "captcha protection: request disallowed (invalid-input-response)" } }), /robô/);
  assert.equal(mensagemDoCadastro(new Error("Sem conexão. Confira a internet e tente de novo.")), "Sem conexão. Confira a internet e tente de novo.");
});

test("o trilho: boas-vindas primeiro, 5 passos com o último no jeito do nicho, a resposta do site só das opções", () => {
  assert.equal(estadoInicial().passo, 0, "começa nas boas-vindas, não numa pergunta");
  assert.equal(estadoInicial().versao, VERSAO);
  assert.equal(passosDoTrilho(null).length, 5);
  assert.equal(passosDoTrilho("eventos")[4].titulo, "Suas festas");
  assert.equal(passosDoTrilho("fotografia")[4].titulo, "Seus ensaios");
  assert.deepEqual(OPCOES_DE_SITE.map(o => o.id), ["tenho", "instagram", "nao"]);
  assert.equal(planoDoCadastro({ ...estadoInicial(), nicho: "eventos", nome: "X", site: "qualquer" }).ajustes.onboarding.site, null);
  assert.equal(listaEmTexto(["Agenda"]), "Agenda");
  assert.equal(listaEmTexto(["Agenda", "Contratos", "Financeiro"]), "Agenda, Contratos e Financeiro");
});

test("tema do nicho: a cor e o painel da marca mudam; sem nicho, o da Renderiza", () => {
  assert.equal(temaDoNicho("eventos"), "rz-tema-eventos");
  assert.equal(temaDoNicho("outro"), "");
  assert.match(painelDaMarca("fotografia"), /ensaios do seu estúdio/);
  assert.match(painelDaMarca("eventos"), /festas do seu espaço/);
  assert.match(painelDaMarca(""), /dia a dia do seu negócio/);
  assert.match(telaDeAcesso({ conteudo: "", nicho: "eventos" }), /class="rz-acesso rz-tema-eventos"/);
});
