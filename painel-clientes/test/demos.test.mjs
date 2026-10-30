// O catálogo das demos (Missão 7, bloco C; scripts/lib/demos.mjs): de cada demo.json de eventos e de fotografia, só
// o que o painel e a IA usam; as outras (óticas, consultórios) ficam de fora. Dados fictícios.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dadosDaDemo, nichoDaDemo } from "../scripts/lib/demos.mjs";

const EVENTOS = {
  marca: "Espaço Teste", marca_completa: "Espaço Teste Eventos", whatsapp: "55 11 99999-0000", instagram: "@espaco.teste",
  endereco_maps: "R. das Flores, 10 - Centro, São Paulo - SP", logo_sub: "Centro · São Paulo", google_nota: "4,8", google_total: "120",
  cores: { escuro: "#2A2233", acento: "#d9a877" }, descricao: "Salão <em>com</em> buffet.", slogan: "Venha celebrar.", dias_curto: "ter a dom",
  consulta: { tipos: ["Casamento", "15 anos", "Outra festa"] }, carrosseis: [],
  estrutura: { itens: [["salao", "Salão para a festa"], ["cozinha", "Buffet"]] }, sobre: { p: ["Quem cuida é a Ana."] },
  avaliacoes: [{ nome: "Fulana de Tal", tag: "Casamento", trecho: "Tudo perfeito." }],
  inventario: "/tmp/qualquer/coisa.json", ficha: { direcao: ["nota interna"] },
};
const FOTOGRAFIA = {
  marca: "Studio Teste", dona: "Bia", whatsapp: "5511988887777", cores: { acento: "#76563f", tinta: "#2a2522" },
  site: { descricao: "Gestante e newborn.", hero: { eyebrow: "Santo André", especialidades: ["Gestante", "Newborn"] }, sobre: { p: "Estúdio claro." },
    avaliacoes: [{ nome: "Cliente", tag: "Bebês", trecho: "Muito carinho." }] },
  horarios: { horas: ["10h", "14h"] },
};

test("eventos: o negócio, o contato, os tipos (sem o 'outra festa'), o que oferece e as avaliações sem o nome", () => {
  const r = dadosDaDemo(EVENTOS, "espaco-teste");
  assert.equal(r.nicho, "eventos");
  assert.equal(r.nome, "Espaço Teste Eventos");
  assert.equal(r.dados.whatsapp, "5511999990000");
  assert.equal(r.dados.instagram, "espaco.teste");
  assert.deepEqual(r.dados.tipos, ["Casamento", "15 anos"]);
  assert.deepEqual(r.dados.oferece, ["Salão para a festa", "Buffet"]);
  assert.equal(r.dados.descricao, "Salão com buffet.", "sem HTML");
  assert.equal(r.dados.cor_escura, "#2a2233");
  assert.deepEqual(r.dados.avaliacoes, [{ tipo: "Casamento", trecho: "Tudo perfeito." }]);
  const tudo = JSON.stringify(r);
  assert.doesNotMatch(tudo, /Fulana|\/tmp\/|nota interna/, "nada de nome de quem avaliou, caminho de arquivo ou nota interna");
});

test("fotografia: a dona, as especialidades, os horários; e as outras demos ficam de fora", () => {
  const r = dadosDaDemo(FOTOGRAFIA, "studio-teste-fotografia");
  assert.equal(r.nicho, "fotografia");
  assert.equal(r.dados.dono, "Bia");
  assert.deepEqual(r.dados.tipos, ["Gestante", "Newborn"]);
  assert.deepEqual(r.dados.horas, ["10h", "14h"]);
  assert.equal(r.dados.regiao, "Santo André");
  assert.deepEqual(r.dados.sobre, ["Estúdio claro."]);
  assert.deepEqual(r.dados.avaliacoes, [{ tipo: "Bebês", trecho: "Muito carinho." }]);
  assert.equal(nichoDaDemo({ marca: "Ótica", carrosseis: [] }), null);
  assert.equal(dadosDaDemo({ marca: "Ótica", carrosseis: [] }, "otica-x"), null);
  assert.equal(dadosDaDemo(EVENTOS, "Pasta Inválida"), null, "a pasta vira chave: só no formato");
});
