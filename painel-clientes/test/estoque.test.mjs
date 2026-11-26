// Estoque (12-modulo-estoque.md): a lógica sem banco nem tela: ler o formulário, a ordem da lista e do site, o
// endereço das fotos, o nicho automotivo e o Estoque no menu.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerItem } from "../src/modulos/estoque/index.js";
import { ordenar, urlDaFoto } from "../src/modulos/estoque/loja.js";
import { ESQUEMAS } from "../src/modulos/estoque/esquemas.js";
import { NICHOS, nicho } from "../src/nichos/index.js";
import { itensDoMenu, itensDaBarra, acoesRapidas } from "../src/telas/casca.js";
import { abasDoNicho } from "../src/modulos/servicos/index.js";

const E = ESQUEMAS.automotivo;

test("o formulário vira o item: números como números, preço lido, obrigatórios conferidos", () => {
  const r = lerItem(E, { marca: " Porsche ", modelo: "Cayenne", ano_fab: "2019", km: "21.000", preco: "689.900", selos: "Blindado", situacao: "reservado", destaque: "on" });
  assert.equal(r.erro, undefined);
  assert.equal(r.item.campos.marca, "Porsche");
  assert.equal(r.item.campos.km, 21000);
  assert.equal(r.item.preco, 689900);
  assert.deepEqual(r.item.selos, ["Blindado"]);
  assert.equal(r.item.situacao, "reservado");
  assert.equal(r.item.destaque, true);
  assert.match(lerItem(E, { marca: "Porsche" }).erro, /Modelo/);
  assert.match(lerItem(E, { marca: "Porsche", modelo: "911", preco: "muito" }).erro, /preço/);
  assert.equal(lerItem(E, { marca: "Porsche", modelo: "911", preco: "" }).item.preco, null, "sem preço: sob consulta");
});

test("a ordem é a do site: destaque, a ordem e o mais novo", () => {
  const itens = [
    { id: "velho", destaque: false, ordem: 0, criado_em: "2026-11-01" },
    { id: "novo", destaque: false, ordem: 0, criado_em: "2026-11-20" },
    { id: "destaque", destaque: true, ordem: 5, criado_em: "2026-10-01" },
    { id: "primeiro", destaque: false, ordem: -1, criado_em: "2026-09-01" },
  ];
  assert.deepEqual(ordenar(itens).map(i => i.id), ["destaque", "primeiro", "novo", "velho"]);
});

test("as fotos saem pelo endereço do próprio painel; a lista usa a pequena", () => {
  const f = { arquivo: "c/estoque-a.webp", mini: "c/estoque-a-m.webp" };
  assert.equal(urlDaFoto(f), "/api/publico/imagens/c/estoque-a-m.webp");
  assert.equal(urlDaFoto(f, "grande"), "/api/publico/imagens/c/estoque-a.webp");
  assert.equal(urlDaFoto({ arquivo: "c/estoque-b.webp" }), "/api/publico/imagens/c/estoque-b.webp", "sem a pequena, a grande");
});

test("o nicho automotivo: as mesmas chaves dos outros, o Estoque primeiro na barra e no +, Serviços simples", () => {
  const chaves = o => Object.keys(o).sort();
  assert.deepEqual(chaves(NICHOS.automotivo.palavras).filter(k => k !== "novoItem"), chaves(NICHOS.fotografia.palavras));
  assert.equal(nicho("automotivo").palavras.daConta, "da loja");
  const conta = { nicho: "automotivo", modulos: ["meu-site", "estoque"], liberada: true, dono: true, acessos: {} };
  const itens = itensDoMenu(conta);
  assert.deepEqual(itens.filter(i => i.grupo === "principal").map(i => i.id), ["inicio", "estoque", "meu-site"]);
  assert.equal(itens.find(i => i.id === "estoque").icone, "estoque");
  assert.deepEqual(itensDaBarra(itens.map(i => ({ ...i, estado: "livre" }))).map(i => i.id), ["inicio", "estoque", "meu-site"]);
  const pode = m => m === "estoque";
  assert.deepEqual(acoesRapidas(conta, pode).map(a => [a.rotulo, a.caminho]), [["Novo carro", "/estoque?novo=item"]]);
  assert.deepEqual(abasDoNicho(NICHOS.automotivo).map(a => a.id), ["servicos"]);
  // Serviços só aparece com o Atendimento (o único que usa a lista na loja); nos outros nichos, sempre
  assert.equal(itens.some(i => i.id === "servicos"), false, "a loja só com Meu site e Estoque não vê Serviços");
  assert.ok(itensDoMenu({ ...conta, modulos: ["meu-site", "estoque", "atendimento"] }).some(i => i.id === "servicos"));
  assert.ok(itensDoMenu({ ...conta, nicho: "fotografia" }).some(i => i.id === "servicos"));
});

import { assuntosDoNicho, ordemDoMenu } from "../src/telas/montar/roteiro.js";
test("o onboarding da loja: perguntas de revenda (sem agenda nem pacotes) e o Estoque primeiro no menu; os outros nichos não mudam", () => {
  assert.deepEqual(assuntosDoNicho("automotivo").map(a => a.assunto), ["objetivo", "estoque_hoje", "anuncia", "tamanho"]);
  assert.deepEqual(assuntosDoNicho("automotivo")[0].opcoes.map(o => o.valor), ["estoque_certo", "mais_contatos", "pedidos"]);
  assert.deepEqual(assuntosDoNicho("eventos").map(a => a.assunto), ["objetivo", "tamanho", "organiza", "horarios", "pacotes"]);
  assert.deepEqual(assuntosDoNicho("fotografia").map(a => a.assunto), ["objetivo", "tamanho", "organiza", "horarios", "pacotes"]);
  assert.deepEqual(ordemDoMenu("estoque_certo", ["meu-site", "estoque"]), ["estoque", "meu-site"]);
  assert.deepEqual(ordemDoMenu("pedidos", ["meu-site", "estoque"]), ["meu-site", "estoque"]);
});

import { paraOSite } from "../src/modulos/estoque/loja.js";
test("a prévia ao lado manda ao site o mesmo formato da API: só disponível e reservado, na ordem, fotos pelo caminho da API", () => {
  const itens = [
    { id: "v", situacao: "vendido", campos: {} },
    { id: "a", situacao: "disponivel", destaque: false, ordem: 1, preco: "189900.00", campos: { marca: "Toyota" }, fotos: [{ arquivo: "c/estoque-a.webp", mini: "c/estoque-a-m.webp", w: 1600, h: 1067 }], codigo_interno: "ABC" },
    { id: "r", situacao: "reservado", destaque: true, ordem: 2, preco: null, campos: {}, fotos: [] },
  ];
  const s = paraOSite(itens);
  assert.deepEqual(s.map(i => i.id), ["r", "a"]);
  assert.equal(s[1].preco, 189900);
  assert.deepEqual(s[1].fotos, [{ url: "/api/publico/imagens/c/estoque-a.webp", mini: "/api/publico/imagens/c/estoque-a-m.webp", w: 1600, h: 1067 }]);
  assert.equal(JSON.stringify(s).includes("ABC"), false, "o código interno não vai para o site");
});
