// O aceite do contrato pelo link (/c/<código>; Missão 3, bloco E): as regras sem tela, testadas em
// test/contrato-publico.test.mjs. Quem abre é o cliente final, no celular, sem login. O banco decide o que sai
// (publico_contrato) e grava o aceite com o IP e o aparelho do pedido (publico_aceitar_contrato); aqui só o jeito
// de mostrar e o que conferir antes de mandar.

import { dataLonga, hora, moeda, linkWhatsapp } from "../../src/ui/formatos.js";
import { nicho, doNegocio } from "../../src/nichos/index.js";

/** O código do link, de /c/<código> (o mesmo formato que o banco aceita). */
export function codigoDoCaminho(caminho) {
  const m = /^\/c\/([a-z0-9]{16,64})\/?$/.exec(String(caminho || ""));
  return m ? m[1] : null;
}

const temValor = v => v !== null && v !== undefined && v !== "";

/** O resumo antes do texto (09: resumo → aceite → dados do Pix): o que foi contratado, em linhas [rótulo, valor]. */
export function linhasDoResumo(c) {
  const r = c.resumo || {};
  const fuso = (c.negocio && c.negocio.fuso) || undefined;
  const n = nicho(c.negocio && c.negocio.nicho);
  const linhas = [];
  if (r.cliente) linhas.push(["Para", r.cliente]);
  if (r.inicio) {
    const ini = new Date(r.inicio);
    linhas.push(["Data", dataLonga(ini, fuso).replace(/^./, l => l.toUpperCase())]);
    linhas.push(["Horário", r.fim ? `${hora(ini, fuso)} às ${hora(new Date(r.fim), fuso)}` : hora(ini, fuso)]);
  }
  if (r.tipo && r.tipo !== r.pacote) linhas.push([n.id === "eventos" ? "Tipo de festa" : "Ensaio", r.tipo]);
  if (r.pacote) linhas.push([n.id === "eventos" ? "Pacote" : "Ensaio", r.pacote]);
  if (temValor(r.convidados)) linhas.push(["Convidados", String(r.convidados)]);
  if (Array.isArray(r.adicionais) && r.adicionais.length) linhas.push(["Adicionais", r.adicionais.join(", ")]);
  if (temValor(r.valor_total)) {
    const desconto = Number(r.desconto || 0);
    if (desconto > 0) linhas.push(["Desconto", moeda(desconto)]);
    linhas.push(["Valor total", moeda(Number(r.valor_total) - desconto)]);
  }
  if (Number(r.sinal) > 0) linhas.push(["Sinal", moeda(Number(r.sinal))]);
  return linhas;
}

/** A cabeça da página: "Seu contrato com Villa Alecrim" e "Casamento · sábado, 12 de dezembro". */
export function cabecaDoContrato(c) {
  const neg = c.negocio || {};
  const r = c.resumo || {};
  const tipo = r.tipo || r.pacote;
  return {
    titulo: neg.nome ? `Seu contrato com ${neg.nome}` : "Seu contrato",
    sub: [tipo, r.inicio ? dataLonga(new Date(r.inicio), neg.fuso || undefined) : ""].filter(Boolean).join(" · "),
  };
}

/** Confere o aceite antes de mandar (o banco confere de novo). */
export function validarAceite({ nome, contato, li }) {
  const erros = {};
  const n = String(nome || "").trim().replace(/\s+/g, " ");
  if (n.length < 3 || !/\p{L}/u.test(n)) erros.nome = "Digite o seu nome completo.";
  const k = String(contato || "").trim();
  if (k.length < 6) erros.contato = "Digite o seu WhatsApp ou e-mail.";
  if (!li) erros.li = "Marque que leu e aceita o contrato.";
  return erros;
}

/** "Aceito em sexta, 30 de outubro, às 14h32, por Juliana Teste." */
export function textoDoAceite(c) {
  if (!c.aceito_em) return "";
  const fuso = (c.negocio && c.negocio.fuso) || undefined;
  const quando = new Date(c.aceito_em);
  return `Aceito em ${dataLonga(quando, fuso)}, às ${hora(quando, fuso)}, por ${c.aceito_nome}.`;
}

/** O WhatsApp do negócio, para mandar o comprovante do sinal (sem número, nada). */
export function linkDoComprovante(c) {
  const neg = c.negocio || {};
  const n = nicho(neg.nicho);
  const primeiro = String((c.resumo && c.resumo.cliente) || c.aceito_nome || "").trim().split(/\s+/)[0];
  const mensagem = `Oi! ${primeiro ? `Aqui é ${primeiro}. ` : ""}Aceitei o contrato ${doNegocio(neg.nome, n)} e estou mandando o comprovante do sinal.`;
  return linkWhatsapp(neg.whatsapp, mensagem);
}

/** A mensagem de cada erro do aceite (o que o banco devolve). */
export function mensagemDoErro(r) {
  if (!r) return "Não consegui falar com o servidor. Confira a internet e tente de novo.";
  if (r.erro === "mudou") return "O contrato foi atualizado enquanto você lia. Abra de novo para ler a versão nova.";
  if (r.erro === "fora") return "Este link não está valendo. Fale com quem mandou o contrato.";
  if (r.erro === "dados") return r.campo === "contato" ? "Confira o seu WhatsApp ou e-mail." : "Confira o seu nome completo.";
  return "Algo deu errado. Tente de novo em instantes.";
}
