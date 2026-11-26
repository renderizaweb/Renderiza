// Trazer do anúncio (src/modulos/estoque/webmotors.js): o texto copiado da página de um anúncio da WebMotors vira os
// campos do carro. O anúncio daqui é fictício, na mesma ordem da página (menus, ficha, FIPE, parecidos, itens).
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { lerAnuncio, lerLink } from "../src/modulos/estoque/webmotors.js";

const PAGINA = readFileSync(new URL("./fixtures/anuncio-webmotors.txt", import.meta.url), "utf8").split("\n").filter(l => !l.startsWith("#")).join("\n").trim();

test("o anúncio copiado vira o carro: marca, modelo, versão, ficha, preço, opcionais e descrição", () => {
  const r = lerAnuncio(PAGINA);
  assert.equal(r.tipo, "anuncio");
  assert.deepEqual(r.campos, {
    marca: "Porsche", modelo: "Cayenne", versao: "3.0 V6 E-HYBRID PLATINUM TIPTRONIC", ano_fab: 2023, ano_modelo: 2024, km: 21500, cor: "Branco",
    cambio: "Automático", combustivel: "Híbrido", carroceria: "SUV", placa: "7",
    blindado: false, troca: true, revisoes: true, ipva: true, licenciado: true, unico_dono: true,
    opcionais: ["Teto solar", "Bancos de couro", "Câmera 360", "Faróis de LED", "Chave presencial"],
  });
  assert.equal(r.preco, 689900, "o Valor anunciado, não a FIPE nem os parecidos");
  assert.equal(r.descricao, "Carro de garagem, com todas as revisões na concessionária.\nPacote Sport Chrono e escapamento esportivo.\n\nItens: Bluetooth, Sensor de ponto cego.");
  assert.deepEqual(r.semCaixa, ["Bluetooth", "Sensor de ponto cego"]);
});

test("as grafias da conta valem; rótulo e valor na mesma linha também; Windows e espaços estranhos", () => {
  const r = lerAnuncio(PAGINA, { conhecidos: ["CAYENNE"] });
  assert.equal(r.campos.modelo, "CAYENNE", "a conta já escreve assim");
  const juntos = PAGINA.replace("Ano\n2023/2024", "Ano: 2023/2024").replace("KM\n21.500", "KM\t21.500").replace(/\n/g, "\r\n").replace("Final de placa", "Final de placa ");
  const j = lerAnuncio(juntos);
  assert.equal(j.campos.ano_modelo, 2024);
  assert.equal(j.campos.km, 21500);
  assert.equal(j.campos.placa, "7");
});

test("sem o 'Valor anunciado': o primeiro preço que não é FIPE nem parcela; sem preço, null", () => {
  assert.equal(lerAnuncio(PAGINA.replace("Valor anunciado\nR$ 689.900\n", "")).preco, 689900, "o das parcelas não conta; sobra o do Ver parcelas");
  assert.equal(lerAnuncio(PAGINA.replace(/R\$ [\d.]+/g, "")).preco, null);
});

test("marca e modelo numa linha só, e outras carrocerias e câmbios", () => {
  const r = lerAnuncio(["MERCEDES-BENZ GLC 300", "2.0 CGI GASOLINA 4MATIC 9G-TRONIC", "Ano", "2021", "Câmbio", "Automatizada", "Carroceria", "Sedã", "Combustível", "Gasolina e álcool"].join("\n"));
  assert.equal(r.campos.marca, "Mercedes-Benz");
  assert.equal(r.campos.modelo, "GLC 300");
  assert.equal(r.campos.ano_fab, 2021);
  assert.equal(r.campos.ano_modelo, 2021);
  assert.equal(r.campos.cambio, "Automatizado");
  assert.equal(r.campos.combustivel, "Flex");
});

test("o link sozinho: marca, modelo, versão (com o ponto de volta) e anos; texto qualquer: nada", () => {
  const l = lerAnuncio("https://www.webmotors.com.br/comprar/land-rover/range-rover-evoque/20-p250-gasolina-r-dynamic-se-automatico/4-portas/2023-2024/55555555?pos=a");
  assert.equal(l.tipo, "link");
  assert.deepEqual(l.campos, { marca: "Land Rover", modelo: "Range Rover Evoque", versao: "2.0 P250 GASOLINA R DYNAMIC SE AUTOMATICO", ano_fab: 2023, ano_modelo: 2024 });
  assert.equal(lerLink("https://www.webmotors.com.br/comprar/bmw/x1/20-turbo/4-portas/2022/1").campos.modelo, "X1");
  assert.deepEqual(lerAnuncio("Oi, tudo bem? Quero ver o carro."), { tipo: null, campos: {}, preco: null, descricao: "", semCaixa: [], achou: { ficha: false, itens: false, descricao: false } });
  assert.equal(lerAnuncio("").tipo, null);
});

test("o que veio da página (para a edição saber o que trocar)", () => {
  assert.deepEqual(lerAnuncio(PAGINA).achou, { ficha: true, itens: true, descricao: true });
  const soFicha = PAGINA.split("Sobre os diferenciais do anúncio")[0];
  assert.deepEqual(lerAnuncio(soFicha).achou, { ficha: true, itens: false, descricao: false }, "copiou só o começo da página: os itens e a descrição ficam como estão");
});
