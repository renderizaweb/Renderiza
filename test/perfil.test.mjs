// Perfil do lead para a tela Indicadores (seguidores, Google, região, WhatsApp, site, quem atendeu).   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { seguidoresDe, googleDe, atendeuDe, telefoneDe, regiaoDe, siteDe, cidadeDe, perfilDoLead, CORTES } from "../painel/src/perfil.js";

test("seguidores: os formatos escritos nas fichas", () => {
  assert.equal(seguidoresDe("Instagram: 3,6 mil seguidores, último post 28/09"), 3600);
  assert.equal(seguidoresDe("Instagram @espaco: 7673 seguidores"), 7673);
  assert.equal(seguidoresDe("@x (\"Ótica X\", 2 mil seguidores)"), 2000);
  assert.equal(seguidoresDe("Instagram: 1.065 seguidores"), 1065);
  assert.equal(seguidoresDe("Instagram @buffet: 10,2 mil seguidores"), 10200);
  assert.equal(seguidoresDe("sem Instagram"), null);
  assert.equal(seguidoresDe(""), null);
});

test("Google: nota e avaliações nos dois jeitos de escrever", () => {
  assert.deepEqual(googleDe("Google: 4,9 · 228 avaliações (mostrar a nota)"), { nota: 4.9, avaliacoes: 228 });
  assert.deepEqual(googleDe("00000-000 · (11) 90000-0000. Nota 5,0 com 90 avaliações."), { nota: 5, avaliacoes: 90 });
  assert.deepEqual(googleDe("Cidade, nota 5,0 com 126 avaliações"), { nota: 5, avaliacoes: 126 });
  assert.deepEqual(googleDe("SP, 00000-000. Nota 5,0 · 56 avaliações"), { nota: 5, avaliacoes: 56 });
  assert.deepEqual(googleDe("Nota 4,8 com 1.099 avaliações"), { nota: 4.8, avaliacoes: 1099 });
  assert.equal(googleDe("Google: 5,0 (nº de avaliações não confirmado)"), null);
  assert.equal(googleDe("Equipe: Ana e Beto (avaliações)"), null);
});

test("quem atendeu: a linha do bloco do WhatsApp", () => {
  assert.equal(atendeuDe("x\n\n[WhatsApp · conferido]\nSituação: Quente\nQuem atendeu: dono — Fulano"), "dono");
  assert.equal(atendeuDe("Quem atendeu: equipe — Beltrana"), "equipe");
  assert.equal(atendeuDe("Quem atendeu: robô — só a mensagem automática"), "robo");
  assert.equal(atendeuDe("Quem atendeu: ninguém — não respondeu"), "ninguem");
  assert.equal(atendeuDe("Quem atendeu: não identificado — Sicrana"), "nao_identificado");
  assert.equal(atendeuDe("Quem atende: Fulana (citada nas avaliações)"), null);
  assert.equal(atendeuDe(""), null);
});

test("telefone, região, cidade e site", () => {
  assert.deepEqual(telefoneDe("(11) 99000-0001"), { ddd: "11", tipo: "celular" });
  assert.deepEqual(telefoneDe("(11) 4000-0001"), { ddd: "11", tipo: "fixo" });
  assert.deepEqual(telefoneDe("5521990000001"), { ddd: "21", tipo: "celular" });
  assert.equal(telefoneDe(""), null);
  assert.equal(cidadeDe("Jardim Um · São Paulo"), "São Paulo");
  assert.equal(cidadeDe("Itaquaquecetuba (não confirmei)"), "Itaquaquecetuba");
  assert.equal(regiaoDe({ cidade: "Lapa · São Paulo", whatsapp: "" }), "capital");
  assert.equal(regiaoDe({ cidade: "Centro · Mauá", whatsapp: "(11) 99000-0002" }), "grande_sp");
  assert.equal(regiaoDe({ cidade: "Centro · Peruíbe", whatsapp: "(13) 99000-0003" }), "interior_sp");
  assert.equal(regiaoDe({ cidade: "Méier · Rio de Janeiro", whatsapp: "(21) 99000-0004" }), "outros_estados");
  assert.equal(regiaoDe({ cidade: "não confirmei", whatsapp: "" }), null);
  assert.equal(siteDe("não tem (o Google aponta o Instagram)"), "sem_site");
  assert.equal(siteDe("otica-x.com.br (fora do ar)"), "fora_do_ar");
  assert.equal(siteDe("otica-y.com.br (dá erro 404)"), "fora_do_ar");
  assert.equal(siteDe("otica-z.com.br"), "tem_site");
  assert.equal(siteDe(""), null);
});

test("perfil do lead e cortes: cada faixa cobre um intervalo sem buraco", () => {
  const p = perfilDoLead({ observacoes: "Google: 5,0 · 17 avaliações. Instagram: 2,9 mil seguidores.\nQuem atendeu: dono — Fulana", whatsapp: "(11) 99000-0005", cidade: "Centro · Cotia", site_atual: "não tem" });
  assert.deepEqual(p, { seguidores: 2900, nota: 5, avaliacoes: 17, regiao: "grande_sp", whatsapp: "celular", site: "sem_site", atendeu: "dono" });
  const cabe = (corte, perfil) => CORTES.find(c => c.id === corte).faixas.filter(f => f.cabe(perfil)).map(f => f.id);
  for (const n of [0, 1000, 1001, 3000, 3001, 10000, 10001, 89700]) assert.equal(cabe("seguidores", { seguidores: n }).length, 1, `seguidores ${n}`);
  for (const n of [0, 50, 51, 100, 101, 300, 301, 1397]) assert.equal(cabe("avaliacoes", { avaliacoes: n }).length, 1, `avaliações ${n}`);
  for (const n of [4.7, 4.8, 4.9, 5]) assert.equal(cabe("nota", { nota: n }).length, 1, `nota ${n}`);
  assert.deepEqual(cabe("seguidores", { seguidores: null }), []);
});
