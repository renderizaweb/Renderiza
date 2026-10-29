// A casca (src/telas/casca.js) e as regras de acesso na tela (src/sessao.js): o que aparece no menu, na barra de
// baixo e no "+", conforme a conta e o acesso da pessoa. O banco é quem garante (supabase/testes/); aqui, a tela.
import { test } from "node:test";
import assert from "node:assert/strict";
import { podeNaConta, estadoDoModulo, diasDeTeste, contaQueAbre, criarSessao } from "../src/sessao.js";
import { itensDoMenu, itensDaBarra, acoesRapidas, textoDoBloqueio } from "../src/telas/casca.js";
import { etiquetaDaConta } from "../src/telas/contas.js";

const base = { conta_id: "c1", nome: "Villa Alecrim", nicho: "eventos", situacao: "ativa", liberada: true, ajustes: {},
  modulos: ["agenda", "clientes", "contratos", "financeiro", "atendimento"] };
const dono = { ...base, dono: true, acessos: {} };
const carla = { ...base, dono: false, acessos: { agenda: "ver" } };
const rafael = { ...base, dono: false, acessos: { agenda: "editar", atendimento: "editar", clientes: "editar", financeiro: null } };

test("podeNaConta: a mesma regra do banco", () => {
  assert.ok(podeNaConta(dono, "financeiro", "editar"));
  assert.ok(podeNaConta(dono, "equipe", "editar"));
  assert.ok(!podeNaConta(dono, "meu-site", "ver"), "módulo não ligado: nem o dono");
  assert.ok(podeNaConta(carla, "agenda", "ver"));
  assert.ok(!podeNaConta(carla, "agenda", "editar"), "só vê");
  assert.ok(!podeNaConta(carla, "clientes", "ver"));
  assert.ok(podeNaConta(carla, "inicio", "ver") && podeNaConta(carla, "servicos", "ver"));
  assert.ok(!podeNaConta(carla, "servicos", "editar"));
  assert.ok(!podeNaConta(carla, "equipe", "ver") && !podeNaConta(carla, "configuracoes", "ver"));
  assert.ok(!podeNaConta(rafael, "financeiro", "ver"), "null é sem acesso");
  assert.ok(!podeNaConta({ ...dono, liberada: false }, "inicio", "ver"), "conta bloqueada: nada");
  assert.ok(!podeNaConta(dono, "agenda", "qualquer"));
  assert.equal(estadoDoModulo(carla, "agenda"), "livre");
  assert.equal(estadoDoModulo(carla, "financeiro"), "trancado");
  assert.equal(estadoDoModulo(carla, "meu-site"), "fora");
});

test("menu: Início, os módulos ligados (trancados sem acesso) e os da conta", () => {
  const menuCarla = itensDoMenu(carla);
  assert.deepEqual(menuCarla.map(i => i.id), ["inicio", "agenda", "atendimento", "clientes", "contratos", "financeiro", "servicos", "equipe", "configuracoes"]);
  assert.deepEqual(menuCarla.filter(i => i.estado === "livre").map(i => i.id), ["inicio", "agenda", "servicos"]);
  assert.ok(!menuCarla.some(i => i.id === "meu-site"), "o que a conta não tem não aparece");
  const ordenado = itensDoMenu({ ...dono, ajustes: { ordem_menu: ["financeiro", "agenda"] } });
  assert.deepEqual(ordenado.slice(0, 3).map(i => i.id), ["inicio", "financeiro", "agenda"], "a ordem do onboarding vale");
  const foto = itensDoMenu({ ...dono, nicho: "fotografia" });
  assert.equal(foto.find(i => i.id === "clientes").nome, "Clientes e entregas");
});

test("barra de baixo: Início e até três que a pessoa usa, Atendimento primeiro", () => {
  assert.deepEqual(itensDaBarra(itensDoMenu(dono)).map(i => i.id), ["inicio", "atendimento", "agenda", "clientes"]);
  assert.deepEqual(itensDaBarra(itensDoMenu(carla)).map(i => i.id), ["inicio", "agenda"]);
});

test("o + mostra só o que a pessoa pode fazer", () => {
  const pode = conta => (m, n) => podeNaConta(conta, m, n);
  assert.deepEqual(acoesRapidas(dono, pode(dono)).map(a => a.id), ["novo-pedido", "nova-reserva", "nova-visita", "novo-pagamento", "novo-cliente"]);
  assert.deepEqual(acoesRapidas(carla, pode(carla)), [], "só vê: nada a fazer");
  assert.deepEqual(acoesRapidas(rafael, pode(rafael)).map(a => a.id), ["novo-pedido", "nova-reserva", "nova-visita", "novo-cliente"]);
  const foto = { ...dono, nicho: "fotografia" };
  assert.equal(acoesRapidas(foto, pode(foto)).find(a => a.id === "nova-reserva").rotulo, "Marcar ensaio");
  assert.ok(!acoesRapidas(foto, pode(foto)).some(a => a.id === "nova-visita"));
});

test("teste, bloqueio e a conta que abre", () => {
  const agora = Date.parse("2026-10-29T12:00:00Z");
  assert.equal(diasDeTeste({ situacao: "teste", teste_ate: "2026-11-03T12:00:00Z" }, agora), 5);
  assert.equal(diasDeTeste({ situacao: "ativa" }, agora), null);
  assert.match(textoDoBloqueio({ situacao: "teste", nome: "Buffet Ipê" }).titulo, /teste grátis acabou/);
  assert.match(textoDoBloqueio({ situacao: "desligada", nome: "Buffet Ipê" }).titulo, /desligada/);
  assert.equal(etiquetaDaConta({ liberada: false, situacao: "teste" }).texto, "Teste acabou");
  const contas = [{ conta_id: "a" }, { conta_id: "b" }];
  assert.equal(contaQueAbre(contas, "b"), "b");
  assert.equal(contaQueAbre(contas, "x"), null, "duas contas e nenhuma guardada: a pessoa escolhe");
  assert.equal(contaQueAbre([{ conta_id: "a" }], null), "a");
});

test("sessão: carrega as contas, aceita os convites antes e guarda a escolhida", async () => {
  const chamadas = [];
  const guardado = new Map();
  const adaptador = {
    sessao: async () => ({ user: { id: "u1", email: "ana@villa.teste" } }),
    aoMudarSessao: () => () => {},
    rpc: async (nome, args) => { chamadas.push(nome); if (nome === "minhas_contas") return [dono, { ...carla, conta_id: "c2" }]; return null; },
    tabela: () => ({ select: () => ({ limit: () => Promise.resolve({ data: [], error: null }), eq: () => ({ maybeSingle: () => ({}) }) }) }),
    resultado: async q => (await q).data,
  };
  const sessao = criarSessao(adaptador, { armazenamento: { ler: k => guardado.get(k) ?? null, gravar: (k, v) => guardado.set(k, v) } });
  await sessao.iniciar();
  await Promise.all([sessao.carregarContas(), sessao.carregarContas()]);
  assert.deepEqual(chamadas, ["aceitar_convites", "minhas_contas"], "convites antes; uma carga só");
  assert.equal(sessao.conta(), null, "duas contas: a pessoa escolhe");
  sessao.escolherConta("c2");
  assert.equal(sessao.conta().conta_id, "c2");
  assert.ok(sessao.pode("agenda", "ver") && !sessao.pode("agenda", "editar"));
  assert.throws(() => sessao.escolherConta("de-outro"));
  await sessao.carregarContas();
  assert.equal(sessao.conta().conta_id, "c2", "a escolha fica guardada no aparelho");
});
