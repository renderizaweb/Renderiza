import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { camposDoSite, montarTermoDoSite, opcoesDoSite, idDoTermo, baseDoId, lerReais, reais, camposDoLead, situacaoDoTermo, linkDoTermo, CAMPOS_DO_SITE, PADRAO_DO_SITE } from "../painel/src/termos.js";
import { blocosDoTexto, pedacosDaLinha, pendencias, impressaoDoTexto, ancoraDoTitulo } from "../painel/src/termos-texto.js";
import { readFileSync } from "node:fs";

const RICARDO_MOTORS = JSON.parse(readFileSync(new URL("../termos/clientes/ricardo-motors.json", import.meta.url), "utf8")).campos;

const COMPLETO = {
  projeto: "Site da Loja Teste", contratante: "Ana Souza, dona da Loja Teste", referencia: "a demonstração em renderizaweb.com.br/demo/loja-teste",
  escopo: "Página inicial\n- Galeria de produtos\n\n  • Contato  ", valor: "1.200,50", pagamento: "metade", prazo: "12", garantia: "45",
  dominio: "LojaTeste.com.br", condicoes: "Uma condição só dela",
};

test("termo completo: sem pendências, título, opções com e sem o painel", () => {
  const t = montarTermoDoSite(COMPLETO);
  assert.deepEqual(pendencias(t.texto), []);
  assert.equal(t.titulo, "Termo de contratação · Site da Loja Teste");
  assert.equal(t.modelo, "site-v1");
  assert.equal(t.tipo_contratante, "pf_ou_pj");
  assert.deepEqual(t.opcoes.map(o => o.id), ["com-painel", "so-site"]);
  assert.match(t.opcoes[0].detalhe, /a partir de R\$ 49,00 por mês, com os módulos que você escolher/);
  assert.match(t.texto, /\*\*R\$ 1\.200,50\*\*/);
  assert.match(t.texto, /R\$ 600,25 em até 2 dias úteis depois da assinatura e R\$ 600,25 até o dia útil seguinte/);
  assert.match(t.texto, /\*\*lojateste\.com\.br\*\*/);
  assert.match(t.texto, /Inclui:\n\n- Página inicial\n- Galeria de produtos\n- Contato\n- As páginas e seções combinadas/, "um item por linha, sem marcador repetido");
  assert.match(t.texto, /no modelo da demonstração em renderizaweb\.com\.br\/demo\/loja-teste/);
  assert.match(t.texto, /# \d+\. Condições deste projeto\n\n1\. Uma condição só dela/);
  assert.ok(t.texto.length < 9000, `texto enxuto (${t.texto.length} caracteres)`);
});

test("o que falta vira pendência, e o termo não abre assim", () => {
  const t = montarTermoDoSite({});
  assert.deepEqual(pendencias(t.texto), ["nome do projeto", "valor do site", "quem contrata"], "o que é entregue é opcional: a entrega genérica já vale");
  assert.equal(montarTermoDoSite({ ...COMPLETO, pagamento: "outro" }).texto.includes("[[forma de pagamento]]"), true);
  assert.equal(montarTermoDoSite({ ...COMPLETO, prazo: "0" }).texto.includes("[[prazo]]"), true);
});

test("cada 'cláusula N' aponta para um título que existe, e a numeração é seguida", () => {
  for (const campos of [COMPLETO, { ...COMPLETO, painel: "nao", condicoes: "" }, { ...COMPLETO, painel: "incluido", hospedagem: "vercel", dominio_primeiro_ano: "contratante" }]) {
    const { texto } = montarTermoDoSite(campos);
    const titulos = blocosDoTexto(texto).filter(b => b.tipo === "titulo").map(b => Number((/^(\d+)\./.exec(b.texto) || [])[1])).filter(Boolean);
    assert.deepEqual(titulos, titulos.map((_, i) => i + 1));
    for (const m of texto.matchAll(/cláusula (\d+)/g)) assert.ok(titulos.includes(Number(m[1])), `cláusula ${m[1]} existe`);
  }
});

test("painel: opcional dá a escolha; incluído e 'não' não dão; sem painel, a cláusula some", () => {
  assert.equal(opcoesDoSite({ painel: "incluido" }).length, 0);
  assert.equal(opcoesDoSite({ painel: "nao" }).length, 0);
  const sem = montarTermoDoSite({ ...COMPLETO, painel: "nao" });
  assert.equal(/Painel Renderiza\n/.test(sem.texto), false);
  assert.equal(sem.texto.includes("Painel Renderiza"), false);
  assert.equal(sem.texto.includes("a opção escolhida"), false);
  assert.match(montarTermoDoSite(COMPLETO).texto, /a opção escolhida/);
});

test("domínio: o cliente já tem (só uma linha, sem custo), a Renderiza registra com o 1º ano, ou o cliente registra", () => {
  const tem = montarTermoDoSite({ ...COMPLETO, dominio: "" }).texto;
  assert.match(tem, /publicado no domínio que o Contratante já tem, que continua sob a responsabilidade dele/);
  assert.equal(/Registro\.br|registro do domínio|primeiro ano|R\$ 40/.test(tem), false, "sem valor nem registro quando ele já tem");
  assert.equal((tem.match(/\*\*Domínio:\*\*/g) || []).length, 1, "uma linha só sobre o domínio");
  const inc = montarTermoDoSite({ ...COMPLETO, dominio_situacao: "registrar_incluido" }).texto;
  assert.match(inc, /com o primeiro ano incluído no preço\. A partir do segundo ano, a renovação é dele/);
  assert.match(inc, /Inclui o registro do domínio por 1 ano/);
  const cli = montarTermoDoSite({ ...COMPLETO, dominio_situacao: "registrar_cliente" }).texto;
  assert.match(cli, /registrado e pago pelo Contratante, no nome dele, assim como a renovação anual/);
  assert.equal(cli.includes("Inclui o registro do domínio"), false);
  // campos da primeira versão (dominio_primeiro_ano) continuam valendo
  assert.equal(camposDoSite({ dominio_primeiro_ano: "contratante" }).dominio_situacao, "registrar_cliente");
  assert.equal(camposDoSite({ dominio_primeiro_ano: "incluido" }).dominio_situacao, "registrar_incluido");
  assert.equal("dominio_primeiro_ano" in camposDoSite({ dominio_primeiro_ano: "incluido" }), false);
});

test("painel: outro contrato; o termo do site não fixa módulos nem preço, aponta para os Termos de uso", () => {
  const t = montarTermoDoSite(COMPLETO).texto;
  assert.match(t, /regido pelos \*\*Termos de uso do painel\*\* \(painel\.renderizaweb\.com\.br\/termos\), que o Contratante aceita no primeiro acesso/);
  assert.match(t, /O Contratante liga ou desliga módulos quando quiser, e o valor acompanha/);
  assert.equal(t.includes("módulos combinados"), false, "sem módulos combinados, não fixa nenhum");
  assert.match(montarTermoDoSite({ ...COMPLETO, painel_modulos: "Meu site e Estoque" }).texto, /os módulos combinados são: Meu site e Estoque/);
  assert.equal(/R\$ 49/.test(montarTermoDoSite({ ...COMPLETO, painel_preco: "" }).texto), false);
});

test("valores em reais", () => {
  assert.equal(lerReais("399"), 399);
  assert.equal(lerReais("R$ 1.200,50"), 1200.5);
  assert.equal(lerReais("1.200"), 1200);
  assert.equal(lerReais("399.90"), 399.9);
  assert.equal(lerReais("abc"), null);
  assert.equal(lerReais("0"), null);
  assert.equal(reais(1200.5), "R$ 1.200,50");
});

test("id do termo: a empresa sem acento e a próxima versão", () => {
  assert.equal(baseDoId("Ricardo Motors | RM Consult Car"), "ricardo-motors");
  assert.equal(baseDoId("Ótica São João (Centro)"), "otica-sao-joao");
  assert.equal(baseDoId("A"), "termo");
  assert.equal(idDoTermo("Ricardo Motors", []), "ricardo-motors-v1");
  assert.equal(idDoTermo("Ricardo Motors", ["ricardo-motors-v1", "ricardo-motors-v3", "outro-v9"]), "ricardo-motors-v4");
  assert.match(idDoTermo("x".repeat(200)), /^[a-z0-9-]{3,80}$/);
});

test("campos a partir do lead", () => {
  const c = camposDoLead({ empresa: "Ricardo Motors | RM Consult Car", link_demo: "/demo/ricardo-motors", valor_potencial: 399 });
  assert.equal(c.projeto, "Site da Ricardo Motors");
  assert.equal(c.referencia, "a demonstração em renderizaweb.com.br/demo/ricardo-motors");
  assert.equal(c.valor, "399");
  assert.equal(c.painel, PADRAO_DO_SITE.painel);
  assert.ok(CAMPOS_DO_SITE.every(f => f.id in PADRAO_DO_SITE), "todo campo da tela tem padrão");
});

test("situação do termo no card", () => {
  assert.equal(situacaoDoTermo(null).id, "nenhum");
  assert.equal(situacaoDoTermo({ texto: "[[x]]", aberto: false }).nome, "Rascunho · falta 1");
  assert.equal(situacaoDoTermo({ texto: "ok", aberto: false }).id, "rascunho");
  assert.equal(situacaoDoTermo({ texto: "ok", aberto: true }).id, "aberto");
  assert.equal(situacaoDoTermo({ texto: "ok", aberto: false }, [{}]).id, "assinado");
  assert.equal(linkDoTermo("ricardo-motors-v1"), "https://www.renderizaweb.com.br/termo/ricardo-motors-v1");
});

test("leitor do texto: títulos, listas, parágrafos, negrito e pendência", () => {
  const b = blocosDoTexto("# 1. As partes\nlinha um\nlinha dois\n\n## Sub\n- a\n- b\n3. três\n4. quatro\n\nfim");
  assert.deepEqual(b, [
    { tipo: "titulo", texto: "1. As partes" }, { tipo: "paragrafo", texto: "linha um linha dois" }, { tipo: "subtitulo", texto: "Sub" },
    { tipo: "lista", itens: ["a", "b"] }, { tipo: "numerada", itens: ["três", "quatro"], inicio: 3 }, { tipo: "paragrafo", texto: "fim" },
  ]);
  assert.deepEqual(pedacosDaLinha("a **b** c [[d]]"), [{ texto: "a " }, { texto: "b", negrito: true }, { texto: " c " }, { texto: "d", pendente: true }]);
  assert.deepEqual(pendencias("x [[a]] y [[a]] [[b]]"), ["a", "b"]);
  assert.deepEqual(pendencias("sem fechar [[ aqui"), ["marcação [[ sem fechar"]);
  assert.equal(ancoraDoTitulo("12. Foro"), "c12");
  assert.equal(ancoraDoTitulo("Em poucas palavras"), "");
});

test("o texto do modelo não tem asterisco solto: todo ** abre e fecha um negrito", () => {
  const { texto } = montarTermoDoSite(COMPLETO);
  for (const linha of texto.split("\n")) {
    const semNegrito = pedacosDaLinha(linha).filter(p => !p.negrito).map(p => p.texto).join("");
    assert.equal(semNegrito.includes("*"), false, linha);
  }
  assert.match(texto, /CPF sob o nº •••\.406\.148-••/);
});

test("a impressão é o SHA-256 do texto exato, como o banco calcula", async () => {
  const { texto } = montarTermoDoSite(COMPLETO);
  assert.equal(await impressaoDoTexto(texto), createHash("sha256").update(texto, "utf8").digest("hex"));
});

test("Ricardo Motors: o termo monta enxuto, e só falta o valor", () => {
  const t = montarTermoDoSite(RICARDO_MOTORS);
  assert.equal(t.titulo, "Termo de contratação · Site da Ricardo Motors");
  assert.equal(t.tipo_contratante, "pf_ou_pj");
  assert.deepEqual(t.opcoes.map(o => o.id), ["com-painel", "so-site"]);
  assert.match(t.texto, /Webmotors/);
  assert.match(t.texto, /publicado no domínio que o Contratante já tem/);
  assert.equal(/Estoque|Registro\.br/.test(t.texto), false, "o Estoque é assunto do painel, não do termo do site");
  const falta = pendencias(t.texto);
  assert.ok(falta.includes("valor do site"), falta.join(" | "));
  assert.deepEqual(falta, ["valor do site"], "só o valor falta decidir");
});

test("os arquivos da tela e da página dos termos não têm erro de sintaxe (nenhum teste carrega a tela)", async () => {
  const { execFileSync } = await import("node:child_process");
  for (const f of ["painel/src/termos-ui.js", "painel/src/termos-texto.js", "painel/src/termos.js"]) {
    execFileSync(process.execPath, ["--check", new URL("../" + f, import.meta.url).pathname]);
  }
  const html = readFileSync(new URL("../termos/pagina.html", import.meta.url), "utf8");
  const modulo = /<script type="module">([\s\S]*?)<\/script>/.exec(html)[1].replace(/^import .*$/m, "");
  assert.doesNotThrow(() => new Function(modulo.replace(/\bawait\b/g, "")), "o script da página /termo");
});
