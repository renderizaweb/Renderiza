// Meu site no painel (Missão 4, bloco C): as regras do editor (src/modulos/meu-site/conteudo.js). A tela, no
// navegador; a validação do conteúdo é a do site (ferramentas/meu-site/meu-site.js, com testes na raiz).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  nomeDaSecao, rotulo, resumoDaSecao, mesclar, igual, novoItem, imagemParaVer, caminhoDaImagem, enderecoDaImagem,
  linkDaPrevia, whatsappDoContrato,
} from "../src/modulos/meu-site/conteudo.js";

const INICIAL = {
  esquema: 1,
  secoes: {
    inicio: { visivel: true, textos: { titulo: "Festas *no verde.*", texto: "Salão e jardim." }, imagens: { foto: { src: "/img/topo.jpg", alt: "Salão" } },
      botoes: { botao: { rotulo: "Chamar no WhatsApp", acao: "whatsapp" } } },
    espaco: { visivel: true, textos: { eyebrow: "O espaço", titulo: "Cada canto *pronto.*" }, listas: { fotos: [{ de: 0, imagens: { foto: { src: "/img/1.jpg", alt: "Salão" } } }, { de: 1, imagens: { foto: { src: "/img/2.jpg", alt: "Jardim" } } }] } },
    estrutura: { visivel: true, listas: { itens: [{ de: 0, textos: { texto: "Piscina" } }] } },
  },
  contato: { whatsapp: "5511900000000", instagram: "villa" },
};

test("nomes: as seções conhecidas, as galerias pela chamada e os campos por extenso", () => {
  assert.equal(nomeDaSecao("inicio"), "Capa");
  assert.equal(nomeDaSecao("espaco", INICIAL.secoes.espaco), "Galeria · O espaço");
  assert.equal(nomeDaSecao("festas", { textos: { titulo: "Festas *aqui.*" } }), "Festas aqui.");
  assert.equal(rotulo("textos", "eyebrow"), "Chamada acima do título");
  assert.equal(rotulo("listas", "avaliacoes"), "Avaliações");
  assert.equal(rotulo("textos", "outro-campo"), "Outro campo");
  assert.equal(resumoDaSecao(INICIAL.secoes.inicio), "Festas no verde.");
  assert.equal(resumoDaSecao(INICIAL.secoes.estrutura), "1 item");
});

test("mesclar: o rascunho por cima da inicial, campo a campo; listas inteiras; o resto fica", () => {
  const m = mesclar(INICIAL, {
    secoes: {
      inicio: { textos: { titulo: "Casamentos *no jardim.*" }, botoes: { botao: { rotulo: "Reservar" } } },
      espaco: { visivel: false, listas: { fotos: [{ de: 1 }] } },
    },
    contato: { whatsapp: "5511988887777" },
  });
  assert.equal(m.secoes.inicio.textos.titulo, "Casamentos *no jardim.*");
  assert.equal(m.secoes.inicio.textos.texto, "Salão e jardim.", "o que o rascunho não tem fica como o inicial");
  assert.deepEqual(m.secoes.inicio.botoes.botao, { rotulo: "Reservar", acao: "whatsapp" });
  assert.deepEqual(m.secoes.inicio.imagens.foto, { src: "/img/topo.jpg", alt: "Salão" });
  assert.equal(m.secoes.espaco.visivel, false);
  assert.deepEqual(m.secoes.espaco.listas.fotos, [{ de: 1 }]);
  assert.equal(m.secoes.estrutura.visivel, true);
  assert.deepEqual(m.contato, { whatsapp: "5511988887777", instagram: "villa" });
  assert.deepEqual(Object.keys(m.secoes), ["inicio", "espaco", "estrutura"], "a ordem é a do site");
  // vazio = a versão inicial
  assert.ok(igual(mesclar(INICIAL, { esquema: 1, secoes: {} }).secoes, mesclar(INICIAL, {}).secoes));
  // mesclar não muda o que recebeu
  assert.equal(INICIAL.secoes.espaco.listas.fotos.length, 2);
});

test("mesclar: as seções na ordem da página e os campos na ordem dos sites, mesmo vindo do banco embaralhados", () => {
  // o jsonb devolve as chaves pela ordem dele (as curtas primeiro)
  const doBanco = {
    esquema: 1, ordem: ["cabecalho", "inicio", "sobre", "espaco", "rodape"],
    secoes: { sobre: { visivel: true }, espaco: { visivel: true }, inicio: { visivel: true, textos: { selo: "4,9", texto: "T", titulo: "Ti", eyebrow: "E" } }, rodape: { visivel: true }, cabecalho: { visivel: true } },
  };
  const m = mesclar(doBanco, { secoes: { extra: { visivel: true } } });
  assert.deepEqual(Object.keys(m.secoes), ["cabecalho", "inicio", "sobre", "espaco", "rodape", "extra"]);
  assert.deepEqual(Object.keys(m.secoes.inicio.textos), ["eyebrow", "titulo", "texto", "selo"]);
  assert.equal(m.ordem, undefined, "a ordem não vai para o rascunho");
});

test("igual: não olha a ordem das chaves (o jsonb do banco volta em outra ordem)", () => {
  assert.ok(igual({ a: 1, b: { c: [1, { d: 2, e: 3 }] } }, { b: { c: [1, { e: 3, d: 2 }] }, a: 1 }));
  assert.ok(!igual({ a: [1, 2] }, { a: [2, 1] }), "a ordem da lista conta");
  assert.ok(igual(null, undefined));
});

test("item novo: nasce do primeiro, com os campos vazios e a mesma foto de partida", () => {
  assert.deepEqual(novoItem(INICIAL.secoes.estrutura.listas.itens), { de: 0, textos: { texto: "" } });
  assert.deepEqual(novoItem(INICIAL.secoes.espaco.listas.fotos), { de: 0, imagens: { foto: { src: "/img/1.jpg", alt: "Salão" } } });
  assert.deepEqual(novoItem([{ textos: { nome: "Ana", texto: "Ótimo", tag: "Casamento" } }]), { textos: { nome: "", texto: "", tag: "" } });
});

test("imagens: ver a inicial no domínio do site; enviar para a pasta da conta; o endereço é o do painel", () => {
  assert.equal(imagemParaVer("/img/topo.jpg", ["villa-alecrim.com.br"]), "https://villa-alecrim.com.br/img/topo.jpg");
  assert.equal(imagemParaVer("https://painel.renderizaweb.com.br/api/publico/imagens/x.webp", []), "https://painel.renderizaweb.com.br/api/publico/imagens/x.webp");
  assert.equal(imagemParaVer("/img/topo.jpg", []), "");
  const conta = "0d6f2c4e-1111-4222-8333-944445555666";
  assert.equal(caminhoDaImagem(conta, "inicio", "foto", "abc123"), `${conta}/inicio-foto-abc123.webp`);
  assert.match(caminhoDaImagem(conta, "Espaço!", "fotos-0-foto"), new RegExp(`^${conta}/espa-o--fotos-0-foto-[a-z0-9]+\\.webp$`));
  assert.equal(enderecoDaImagem("c/x.webp", { ambiente: "production", origem: "https://renderiza-painel-clientes.vercel.app" }), "https://painel.renderizaweb.com.br/api/publico/imagens/c/x.webp");
  assert.equal(enderecoDaImagem("c/x.webp", { ambiente: "development", origem: "http://localhost:5180" }), "http://localhost:5180/api/publico/imagens/c/x.webp");
});

test("prévia e WhatsApp no formato do contrato", () => {
  assert.equal(linkDaPrevia(["villa-alecrim.com.br", "www.villa-alecrim.com.br"], "abc123def456ghi789"), "https://villa-alecrim.com.br/?rz-previa=abc123def456ghi789");
  assert.equal(linkDaPrevia([], "x"), "");
  assert.equal(whatsappDoContrato("(11) 98888-7777"), "5511988887777");
  assert.equal(whatsappDoContrato("+55 11 98888-7777"), "5511988887777");
  assert.equal(whatsappDoContrato(""), "");
});

test("a validação do painel é a mesma do site (cópia igual a ferramentas/meu-site/meu-site.js)", () => {
  const copia = readFileSync(new URL("../src/modulos/meu-site/meu-site.js", import.meta.url), "utf8");
  const original = readFileSync(new URL("../../ferramentas/meu-site/meu-site.js", import.meta.url), "utf8");
  assert.equal(copia, original, "mudou o meu-site.js? copie para painel-clientes/src/modulos/meu-site/");
});
