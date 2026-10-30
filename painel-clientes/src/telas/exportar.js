// Exportar tudo (Missão 3, bloco F; 02 e 05: "exportar tudo junta tudo num zip"): uma planilha CSV por assunto
// (abre no Excel e no Google Planilhas: separador ";", acentos com BOM), o texto de cada contrato num .txt e um
// LEIA-ME, num .zip feito no próprio navegador (sem biblioteca: arquivos guardados sem compressão). Só o que a
// pessoa vê sai (a RLS decide); a tela só mostra o botão para o dono. As partes puras (csv, zip) são testadas em
// test/exportar.test.mjs.

import { dataNumerica, hora, dia } from "../ui/formatos.js";

// ---------- CSV ----------

const celula = v => {
  if (v === null || v === undefined) return "";
  const t = typeof v === "number" ? String(v).replace(".", ",") : String(v);
  return /[";\r\n]/.test(t) || /^\s|\s$/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** Uma planilha: `colunas` [[cabeçalho, (linha) => valor]], separador ";" e quebra CRLF, com BOM (o Excel lê os acentos). */
export function csv(linhas, colunas) {
  const corpo = [colunas.map(([c]) => celula(c)).join(";"), ...linhas.map(l => colunas.map(([, f]) => celula(f(l))).join(";"))];
  return "﻿" + corpo.join("\r\n") + "\r\n";
}

// ---------- ZIP (método "guardado", sem compressão) ----------

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** O .zip com os arquivos [{ nome, conteudo (texto) }]. Nomes em UTF-8 (bit 11). Devolve os bytes. */
export function zip(arquivos, quando = new Date()) {
  const cod = new TextEncoder();
  const hora = (quando.getHours() << 11) | (quando.getMinutes() << 5) | Math.floor(quando.getSeconds() / 2);
  const data = ((quando.getFullYear() - 1980) << 9) | ((quando.getMonth() + 1) << 5) | quando.getDate();
  const partes = [], central = [];
  let posicao = 0;
  for (const a of arquivos) {
    const nome = cod.encode(a.nome), dados = typeof a.conteudo === "string" ? cod.encode(a.conteudo) : a.conteudo;
    const crc = crc32(dados);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true); local.setUint16(8, 0, true);
    local.setUint16(10, hora, true); local.setUint16(12, data, true); local.setUint32(14, crc, true);
    local.setUint32(18, dados.length, true); local.setUint32(22, dados.length, true); local.setUint16(26, nome.length, true); local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), nome, dados);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true); cen.setUint16(10, 0, true);
    cen.setUint16(12, hora, true); cen.setUint16(14, data, true); cen.setUint32(16, crc, true); cen.setUint32(20, dados.length, true); cen.setUint32(24, dados.length, true);
    cen.setUint16(28, nome.length, true); cen.setUint16(30, 0, true); cen.setUint16(32, 0, true); cen.setUint16(34, 0, true); cen.setUint16(36, 0, true);
    cen.setUint32(38, 0, true); cen.setUint32(42, posicao, true);
    central.push(new Uint8Array(cen.buffer), nome);
    posicao += 30 + nome.length + dados.length;
  }
  const tamanhoCentral = central.reduce((t, p) => t + p.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true); fim.setUint32(16, posicao, true);
  const tudo = [...partes, ...central, new Uint8Array(fim.buffer)];
  const saida = new Uint8Array(tudo.reduce((t, p) => t + p.length, 0));
  let i = 0;
  for (const p of tudo) { saida.set(p, i); i += p.length; }
  return saida;
}

// ---------- o que vai no zip ----------

const SITUACAO_RESERVA = { pre_reserva: "Pré-reserva", confirmada: "Confirmada", realizada: "Realizada", cancelada: "Cancelada" };
const SITUACAO_CONTRATO = { orcamento: "Orçamento", enviado: "Enviado", aceito: "Aceito", cancelado: "Cancelado" };
const ETAPA = { novo: "Novo", em_conversa: "Em conversa", visita_marcada: "Visita marcada", orcamento_enviado: "Orçamento enviado", aguardando_sinal: "Aguardando sinal", fechado: "Fechado", perdido: "Perdido" };
const ENTREGA = { escolhendo: "Escolhendo as fotos", edicao: "Em edição", entregue: "Entregue" };

/** Monta os arquivos a partir das linhas do banco (sem rede; testável). `fuso` para as datas. */
export function arquivosDaExportacao(d, { nicho, fuso, conta, agora = new Date() }) {
  const quando = v => (v ? `${dataNumerica(new Date(v), fuso)} ${hora(new Date(v), fuso)}` : "");
  const diaDe = v => (v ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : "");
  const nome = x => (x && x.clientes && x.clientes.nome) || "";
  const doTipo = r => (r && ((r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome))) || "";
  const daReserva = r => (r ? [r.titulo || doTipo(r), quando(r.inicio)].filter(Boolean).join(" · ") : "");
  const valores = r => (Array.isArray(r.reservas_valores) ? r.reservas_valores[0] : r.reservas_valores) || {};
  const reservas = nicho.palavras.reservas;
  const arquivos = [];
  const planilha = (arquivo, linhas, colunas) => { if (linhas) arquivos.push({ nome: arquivo, conteudo: csv(linhas, colunas) }); };

  planilha("clientes.csv", d.clientes, [["Nome", c => c.nome], ["WhatsApp", c => c.whatsapp], ["E-mail", c => c.email], ["Instagram", c => c.instagram],
    ["Origem", c => c.origem], ["Arquivado em", c => quando(c.arquivado_em)], ["Cadastrado em", c => quando(c.criado_em)]]);
  planilha("pedidos.csv", d.pedidos, [["Cliente", nome], ["Etapa", p => ETAPA[p.etapa] || p.etapa], ["Origem", p => p.origem], ["Data desejada", p => diaDe(p.data_desejada)],
    ["Tipo", doTipo], ["Convidados", p => p.convidados], ["Mensagem", p => p.mensagem], ["Chegou em", p => quando(p.criado_em)]]);
  planilha(`${reservas}.csv`, d.reservas, [["Cliente", nome], ["Título", r => r.titulo], ["Tipo", doTipo], ["Início", r => quando(r.inicio)], ["Fim", r => quando(r.fim)],
    ["Convidados", r => r.convidados], ["Situação", r => SITUACAO_RESERVA[r.situacao] || r.situacao], ["Valor total", r => valores(r).valor_total], ["Sinal", r => valores(r).sinal],
    ["Desconto", r => valores(r).desconto], ["Observações", r => r.observacoes]]);
  planilha("compromissos.csv", d.compromissos, [["Tipo", c => c.tipo], ["Título", c => c.titulo], ["Quando", c => quando(c.inicio)], ["Cliente", nome], ["Observações", c => c.observacoes]]);
  planilha("pagamentos.csv", d.parcelas, [["Cliente", nome], [nicho.id === "eventos" ? "Festa" : "Ensaio", p => daReserva(p.reservas)], ["Descrição", p => p.descricao], ["Valor", p => Number(p.valor)],
    ["Vence em", p => diaDe(p.vence_em)], ["Pago em", p => diaDe(p.pago_em)], ["Forma", p => p.forma], ["Anotação", p => p.observacao]]);
  if (d.contratos) {
    // o texto de cada contrato num .txt (a planilha não cabe um contrato inteiro numa célula), com o aceite no fim
    const arquivo = (c, i) => `contratos/${String(i + 1).padStart(3, "0")}-${(nome(c) || "cliente").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "cliente"}.txt`;
    const contratos = d.contratos.map((c, i) => ({ ...c, arquivo: c.texto ? arquivo(c, i) : "" }));
    planilha("contratos.csv", contratos, [["Cliente", nome], [nicho.id === "eventos" ? "Festa" : "Ensaio", c => daReserva(c.reservas)], ["Situação", c => SITUACAO_CONTRATO[c.situacao] || c.situacao],
      ["Enviado em", c => quando(c.enviado_em)], ["Aceito em", c => quando(c.aceito_em)], ["Aceito por", c => c.aceito_nome], ["Contato de quem aceitou", c => c.aceito_contato],
      ["IP", c => c.aceito_ip], ["Aparelho", c => c.aceito_aparelho], ["Impressão digital (SHA-256)", c => c.hash], ["Arquivo do texto", c => c.arquivo]]);
    for (const c of contratos.filter(c => c.texto)) {
      arquivos.push({ nome: c.arquivo, conteudo: c.texto + (c.aceito_em ? `\n\n---\nAceito em ${quando(c.aceito_em)} por ${c.aceito_nome}${c.aceito_contato ? ` (${c.aceito_contato})` : ""}. Impressão digital do texto (SHA-256): ${c.hash}\n` : "\n") });
    }
  }
  planilha("entregas.csv", d.entregas, [["Cliente", nome], ["Ensaio", e => daReserva(e.reservas)], ["Situação", e => ENTREGA[e.situacao] || e.situacao], ["Prazo", e => diaDe(e.prazo)],
    ["Link da galeria", e => e.link_galeria], ["Entregue em", e => diaDe(e.entregue_em)]]);
  planilha("lista-de-espera.csv", d.espera, [["Cliente", nome], ["Posição", e => e.posicao], ["Preferência", e => e.preferencia], ["Entrou em", e => quando(e.criado_em)]]);
  planilha(`${nicho.palavras.servicos.replace(/\s+/g, "-")}.csv`, d.servicos, [["Nome", s => s.nome], ["Descrição", s => s.descricao], ["Valor", s => (s.valor == null ? "" : Number(s.valor))],
    ["Sinal", s => (s.sinal == null ? "" : Number(s.sinal))], ["Duração (min)", s => s.duracao_min], ["Ativo", s => (s.ativo ? "sim" : "não")]]);
  planilha("adicionais.csv", d.adicionais, [["Nome", a => a.nome], ["Preço", a => (a.preco == null ? "" : Number(a.preco))], ["Ativo", a => (a.ativo ? "sim" : "não")]]);
  planilha("equipe.csv", d.equipe, [["Nome", p => p.nome], ["E-mail", p => p.email], ["Dono", p => (p.dono ? "sim" : "não")], ["Ativa", p => (p.ativa === false ? "não" : "sim")],
    ["Acessos", p => (p.dono ? "tudo" : Object.entries(p.acessos || {}).filter(([, v]) => v).map(([m, v]) => `${m}: ${v}`).join(", "))]]);

  const lista = arquivos.filter(a => a.nome.endsWith(".csv")).map(a => `- ${a.nome}`).join("\n");
  arquivos.unshift({ nome: "LEIA-ME.txt", conteudo: `Os dados de ${conta.nome} no Painel Renderiza, exportados em ${dataNumerica(agora, fuso)} às ${hora(agora, fuso)}.\n\n`
    + `Cada planilha (.csv) abre no Excel e no Google Planilhas (separador: ponto e vírgula). Os textos dos contratos estão na pasta contratos/, um por arquivo, com o registro do aceite no fim.\n\n${lista}\n` });
  return arquivos;
}

/** Busca tudo (o que a pessoa vê), monta o zip e baixa. */
export async function exportarTudo({ banco, conta, nicho, avisar }) {
  const fuso = conta.fuso || undefined;
  const t = nome => banco.tabela(nome);
  const ler = q => banco.resultado(q).catch(() => null);
  const id = conta.conta_id;
  avisar("Juntando os dados… pode levar alguns segundos.");
  const [clientes, pedidos, reservas, compromissos, parcelas, contratos, entregas, espera, servicos, adicionais, equipe] = await Promise.all([
    ler(t("clientes").select("nome, whatsapp, email, instagram, origem, arquivado_em, criado_em").eq("conta_id", id).order("nome").limit(20000)),
    ler(t("pedidos").select("etapa, origem, data_desejada, convidados, mensagem, criado_em, clientes(nome), tipos_reserva(nome), servicos(nome)").eq("conta_id", id).order("criado_em").limit(20000)),
    ler(t("reservas").select("id, titulo, inicio, fim, convidados, situacao, observacoes, clientes(nome), tipos_reserva(nome), servicos(nome)").eq("conta_id", id).order("inicio").limit(20000)),
    ler(t("compromissos").select("tipo, titulo, inicio, observacoes, clientes(nome)").eq("conta_id", id).order("inicio").limit(20000)),
    ler(t("parcelas").select("descricao, valor, vence_em, pago_em, forma, observacao, clientes(nome), reservas(titulo, inicio, tipos_reserva(nome), servicos(nome))").eq("conta_id", id).order("vence_em").limit(50000)),
    ler(t("contratos").select("texto, hash, situacao, enviado_em, aceito_em, aceito_nome, aceito_contato, aceito_ip, aceito_aparelho, clientes(nome), reservas(titulo, inicio, tipos_reserva(nome), servicos(nome))").eq("conta_id", id).order("criado_em").limit(5000)),
    conta.nicho === "fotografia" ? ler(t("entregas").select("situacao, prazo, link_galeria, entregue_em, clientes(nome), reservas(titulo, inicio, tipos_reserva(nome), servicos(nome))").eq("conta_id", id).limit(20000)) : null,
    ler(t("lista_espera").select("posicao, preferencia, criado_em, clientes(nome)").eq("conta_id", id).order("posicao").limit(20000)),
    ler(t("servicos").select("nome, descricao, valor, sinal, duracao_min, ativo").eq("conta_id", id).order("ordem")),
    ler(t("adicionais").select("nome, preco, ativo").eq("conta_id", id).order("ordem")),
    conta.dono ? ler(t("pessoas").select("nome, email, dono, ativa, acessos").eq("conta_id", id).order("nome")) : null,
  ]);
  // os valores das reservas só para quem vê (Financeiro ou Contratos); sem eles, as colunas de valor saem vazias
  const valores = await ler(t("reservas_valores").select("reserva_id, valor_total, sinal, desconto").eq("conta_id", id).limit(20000));
  const porId = Object.fromEntries((valores || []).map(v => [v.reserva_id, v]));
  const listaReservas = reservas && reservas.map(({ id: rid, ...r }) => ({ ...r, reservas_valores: porId[rid] || null }));
  const arquivos = arquivosDaExportacao({ clientes, pedidos, reservas: listaReservas, compromissos, parcelas, contratos, entregas, espera, servicos, adicionais, equipe }, { nicho, fuso, conta });
  const bytes = zip(arquivos);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `painel-${conta.codigo || "conta"}-${dia(new Date(), fuso)}.zip`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  avisar(`Pronto: ${arquivos.length} arquivos no .zip, na pasta de downloads.`);
}
