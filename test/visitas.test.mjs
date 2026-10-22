// Link do Painel Renderiza por lead e o mapa de quem abriu.   npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EVENTOS, PAGINAS_CONTADAS, mostraPainel, linkDoPainel, linkCurto, agruparVisitas, ipsDaEquipe, resumoDasVisitas, textoDoPasso, duracao,
  atividade, filtrarAtividade, resumoDaAtividade, inicioDoPeriodo, lugarDe } from "../painel/src/visitas.js";
import { aparelhoDe, ipDe, localDe, paraRegistro } from "../api/visita.js";
import { comContador } from "../scripts/montar-site.mjs";

const V = (min, evento, extra = {}) => ({ id: min, lead_id: "lira", criado_em: new Date(Date.UTC(2026, 9, 22, 12, min)).toISOString(), pagina: "exemplos", evento, detalhe: {}, visitante: "v1", sessao: "s1", equipe: false, ip: "200.1.1.1", local: "São Paulo · SP", aparelho: "celular · Android · Chrome", ...extra });

test("o link vai só para os leads de eventos, com o código curto", () => {
  assert.equal(mostraPainel({ codigo: "k3f9", segmento: "Eventos" }), true);
  assert.equal(mostraPainel({ codigo: "k3f9", segmento: "Ótica" }), false);
  assert.equal(mostraPainel({ segmento: "Eventos" }), false, "sem código, sem link");
  assert.equal(linkDoPainel({ codigo: "k3f9" }), "https://www.renderizaweb.com.br/exemplos?c=k3f9");
  assert.equal(linkCurto({ codigo: "k3f9" }), "renderizaweb.com.br/exemplos?c=k3f9");
});

test("visitas: mesmo navegador sem parar 30 min é uma visita; tempo vira duração, não passo", () => {
  const grupos = agruparVisitas([
    V(0, "abriu"), V(1, "viu_precos"), V(2, "viu_detalhes", { detalhe: { m: "financeiro" } }), V(3, "tempo", { detalhe: { s: 50 } }), V(3, "tempo", { detalhe: { s: 95 } }),
    V(4, "abriu", { pagina: "painel-eventos", sessao: "s2" }), V(5, "tempo", { pagina: "painel-eventos", sessao: "s2", detalhe: { s: 30 } }),
    V(50, "abriu", { sessao: "s3" }),
  ]);
  assert.equal(grupos.length, 2);
  assert.equal(grupos[1].passos.map(p => p.evento).join(","), "abriu,viu_precos,viu_detalhes,abriu");
  assert.equal(grupos[1].segundos, 125, "95 s numa página + 30 s na outra");
  assert.equal(grupos[1].passos[2].texto, "Viu os detalhes de Financeiro");
  assert.equal(grupos[0].passos.length, 1, "a mais nova vem primeiro");
});

test("quem abriu: navegador da equipe, mesmo IP de uma visita nossa ou o cliente", () => {
  const nossa = V(0, "abriu", { visitante: "eu", equipe: true, ip: "10.0.0.1" });
  const celularNosso = V(5, "abriu", { visitante: "eu-cel", ip: "10.0.0.1" });
  const cliente = V(9, "abriu", { visitante: "cli", ip: "177.2.2.2" });
  const grupos = agruparVisitas([nossa, celularNosso, cliente]);
  assert.deepEqual(grupos.map(g => g.quem), ["cliente", "equipe_ip", "equipe"]);
  const r = resumoDasVisitas(grupos);
  assert.equal(r.visitas, 1);
  assert.equal(r.nossas, 2);
  // o IP da equipe vale entre leads: ipsDaEquipe olha todas as visitas
  assert.deepEqual([...ipsDaEquipe([nossa, cliente])], ["10.0.0.1"]);
});

test("resumo: só os passos do cliente contam para os sinais", () => {
  const r = resumoDasVisitas(agruparVisitas([
    V(0, "abriu", { visitante: "cli" }), V(1, "viu_precos", { visitante: "cli" }),
    V(2, "clicou_whatsapp", { visitante: "cli", detalhe: { onde: "precos", modulos: ["agenda-online", "financeiro"], total: 49 } }),
    V(3, "abriu_exemplo", { visitante: "eu", equipe: true, ip: "10.0.0.1" }),
  ]));
  assert.equal(r.precos, true); assert.equal(r.whatsapp, true); assert.equal(r.exemplo, false);
});

test("textos dos passos", () => {
  assert.equal(textoDoPasso({ evento: "abriu", pagina: "agenda-online" }), "Abriu a agenda online de exemplo");
  assert.equal(textoDoPasso({ evento: "clicou_whatsapp", detalhe: { modulos: ["agenda-online", "financeiro"], total: 63.99 } }), "Clicou no WhatsApp com o plano: Agenda online, Financeiro (R$ 63,99/mês)");
  assert.equal(textoDoPasso({ evento: "abriu_exemplo", detalhe: { qual: "financeiro" } }), "Foi ver no exemplo o financeiro");
  assert.equal(textoDoPasso({ evento: "mudou_tela", detalhe: { tela: "contratos" } }), "No exemplo, abriu os contratos");
  assert.equal(duracao(130), "2 min 10 s"); assert.equal(duracao(40), "40 s"); assert.equal(duracao(0), "");
});

test("api/visita: aparelho, IP, cidade e robôs fora", () => {
  assert.equal(aparelhoDe("Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36"), "celular · Android · Chrome");
  assert.equal(aparelhoDe("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Instagram 340.0"), "celular · iPhone · Instagram");
  assert.equal(aparelhoDe("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36"), "computador · Windows · Chrome");
  const h = { "x-forwarded-for": "177.10.20.30, 76.76.21.21", "x-vercel-ip-city": "S%C3%A3o%20Paulo", "x-vercel-ip-country-region": "SP", "x-vercel-ip-country": "BR", "user-agent": "Mozilla/5.0 (iPhone) Safari/604.1" };
  assert.equal(ipDe(h), "177.10.20.30");
  assert.equal(localDe(h), "São Paulo · SP");
  const r = paraRegistro({ c: "K3F9", p: "exemplos", e: "abriu", d: { tela: "390x844" }, v: "abc", s: "def", eq: false }, h);
  assert.equal(r.p_codigo, "k3f9"); assert.equal(r.p_ip, "177.10.20.30"); assert.equal(r.p_aparelho, "celular · iPhone · Safari");
  assert.equal(paraRegistro({ c: "k3f9", p: "exemplos", e: "abriu" }, { ...h, "user-agent": "WhatsApp/2.24.1 A" }), null, "prévia do link no WhatsApp não conta");
  assert.equal(paraRegistro({ c: "x", p: "exemplos", e: "abriu" }, h), null, "código inválido");
  assert.equal(r.p_demo, "", "fora da demo vai p_demo vazio (a função do banco tem um único formato)");
});

test("api/visita: na demo o lead vem da pasta, sem código", () => {
  const h = { "user-agent": "Mozilla/5.0 (iPhone) Safari/604.1" };
  const r = paraRegistro({ p: "demo", demo: "Otica-Nina", e: "abriu", v: "abc", s: "def" }, h);
  assert.equal(r.p_demo, "otica-nina"); assert.equal(r.p_codigo, ""); assert.equal(r.p_pagina, "demo");
  assert.equal(paraRegistro({ p: "demo", demo: "../x", e: "abriu" }, h), null, "pasta estranha");
  assert.equal(paraRegistro({ p: "demo", e: "abriu" }, h), null, "sem pasta");
  assert.equal(paraRegistro({ c: "k3f9", p: "exemplos", demo: "otica-nina", e: "abriu" }, h).p_demo, "", "pasta só vale na demo");
});

test("build: a demo sai com o contador e a pasta; sem </head> ou já com o contador, fica igual", () => {
  const html = "<html><head><title>X</title></head><body></body></html>";
  const com = comContador(html, "otica-nina");
  assert.match(com, /<script src="\/exemplos\/visitas\.js" data-pagina="demo" data-demo="otica-nina" defer><\/script><\/head>/);
  assert.equal(comContador(com, "otica-nina"), com);
  assert.equal(comContador("<p>sem head</p>", "otica-nina"), "<p>sem head</p>");
  assert.equal(comContador(html, "Pasta Estranha"), html);
});

test("textos e lugares da demo", () => {
  assert.equal(textoDoPasso({ evento: "abriu", pagina: "demo" }), "Abriu a demo do site");
  assert.equal(textoDoPasso({ evento: "clicou_whatsapp", pagina: "demo", detalhe: { onde: "demo" } }), "Clicou no WhatsApp da loja, na demo");
  assert.equal(textoDoPasso({ evento: "rolou_fim", pagina: "demo" }), "Rolou até o fim da demo");
  assert.equal(lugarDe({ pagina: "demo", demo: "otica-nina" }), "Demo otica-nina");
  assert.equal(lugarDe({ pagina: "exemplos" }), "Página do Painel Renderiza");
});

test("atividade: todos os leads, a última ação primeiro, e quem é nosso vale entre leads", () => {
  const visitas = [
    V(0, "abriu", { visitante: "eu", equipe: true, ip: "10.0.0.1" }),
    V(2, "abriu", { lead_id: "nina", pagina: "demo", demo: "otica-nina", visitante: "eu", sessao: "d1" }), // mesmo navegador, outro lead, sem a marca
    V(4, "abriu", { lead_id: "nina", pagina: "demo", demo: "otica-nina", visitante: "cli", ip: "177.2.2.2", sessao: "d2" }),
    V(9, "clicou_whatsapp", { lead_id: "nina", pagina: "demo", demo: "otica-nina", visitante: "cli", ip: "177.2.2.2", sessao: "d2", detalhe: { onde: "demo" } }),
    V(6, "abriu", { visitante: "cel", ip: "10.0.0.1", sessao: "s9" }),
  ];
  const g = atividade(visitas);
  assert.deepEqual(g.map(x => [x.lead_id, x.quem]), [["nina", "cliente"], ["lira", "equipe_ip"], ["nina", "equipe"], ["lira", "equipe"]]);
  assert.equal(g[0].passos.at(-1).texto, "Clicou no WhatsApp da loja, na demo");
  const r = resumoDaAtividade(g);
  assert.deepEqual(r, { visitas: 1, leads: 1, demos: 1, whatsapp: 1, nossas: 3 });
});

test("atividade: filtros de quem, onde, período e busca", () => {
  const nomes = { lira: "Espaço Lira", nina: "Ótica Nina" };
  const g = atividade([
    V(0, "abriu", { visitante: "eu", equipe: true }),
    V(1, "abriu", { visitante: "cli", ip: "177.2.2.2" }),
    V(2, "abriu", { visitante: "cli", ip: "177.2.2.2", pagina: "demo", demo: "espaco-lira", sessao: "d1" }),
    V(3, "abriu", { lead_id: "nina", visitante: "cli2", ip: "189.3.3.3", pagina: "demo", demo: "otica-nina", local: "Niterói · RJ" }),
  ]);
  const f = (o) => filtrarAtividade(g, o, id => nomes[id]);
  assert.equal(f({ quem: "clientes" }).length, 2);
  assert.equal(f({ quem: "voces" }).length, 1);
  const soPainel = f({ onde: "painel", quem: "clientes" });
  assert.deepEqual(soPainel.map(x => x.passos.map(p => p.pagina)), [["exemplos"]], "a visita fica só com os passos do painel");
  assert.equal(f({ onde: "demos" }).length, 2);
  assert.deepEqual(f({ busca: "otica" }).map(x => x.lead_id), ["nina"], "sem acento e pelo nome do lead");
  assert.deepEqual(f({ busca: "niteroi" }).map(x => x.lead_id), ["nina"], "pela cidade");
  assert.equal(f({ desde: Date.UTC(2026, 9, 23) }).length, 0);
  const agora = new Date(2026, 9, 22, 15, 0);
  assert.equal(inicioDoPeriodo("hoje", agora), new Date(2026, 9, 22).getTime());
  assert.equal(inicioDoPeriodo("7d", agora), new Date(2026, 9, 16).getTime());
  assert.equal(inicioDoPeriodo("tudo", agora), 0);
});

test("os passos e páginas do painel são os mesmos do banco (supabase/schema.sql)", () => {
  const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  const lista = re => [...new RegExp(re).exec(sql)[1].matchAll(/'([a-z_-]+)'/g)].map(m => m[1]);
  assert.deepEqual(lista(/evento\s+text not null check \(evento in \(([^)]*)\)\)/.source), EVENTOS);
  assert.deepEqual(lista(/pagina\s+text not null check \(pagina in \(([^)]*)\)\)/.source), PAGINAS_CONTADAS);
  assert.deepEqual(lista(/p_evento not in \(([^)]*)\)/.source), EVENTOS, "registrar_visita aceita os mesmos passos");
  assert.deepEqual(lista(/p_pagina not in \(([^)]*)\)/.source), PAGINAS_CONTADAS);
  // a página só manda passos que o banco aceita
  assert.match(sql, /p_aparelho text default '', p_demo text default ''\)/, "registrar_visita com a pasta da demo");
  assert.doesNotMatch(sql, /grant execute on function public\.registrar_visita\(text, text, text, jsonb, text, text, boolean, text, text, text\) to/, "só a versão com p_demo fica aberta");
  const paginas = ["../exemplos/index.html", "../exemplos/painel-eventos.html", "../exemplos/agenda-online.html", "../exemplos/visitas.js"].map(f => readFileSync(new URL(f, import.meta.url), "utf8")).join("\n");
  const usados = new Set([...paginas.matchAll(/(?:rzVisita\??\.?\(|enviar\()"([a-z_]+)"/g)].map(m => m[1]));
  for (const e of usados) assert.ok(EVENTOS.includes(e), "evento que o banco não aceita: " + e);
  assert.ok(usados.size >= 8, "a página manda os passos: " + [...usados].join(", "));
});
