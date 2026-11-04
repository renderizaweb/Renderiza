// Trazer o que tem (Missão 7, bloco F): as regras sem tela, testadas em test/trazer.test.mjs. Tudo o que chega (a
// leitura da IA, a planilha, os contatos, a agenda) vira uma proposta só, no mesmo formato: pacotes, adicionais, datas,
// clientes e modelos de contrato. Repetidos se juntam; o que já está no painel vem desmarcado ("já está"); a pessoa
// confere, e só o marcado é gravado (D43: nada sem o toque dela).

import { normalizarWhatsapp, whatsappValido, lerData, lerHora, lerValor } from "../../ui/formatos.js";
import { dataDoExcel, horaDoExcel } from "./arquivos.js";

export const TIPOS = ["pacotes", "adicionais", "datas", "clientes", "modelos"];
/** Acima disso, os contatos de um arquivo vêm desmarcados: é a agenda inteira do celular, não só os clientes. */
export const CONTATOS_MARCADOS_ATE = 40;

export const normal = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
export const vazia = () => ({ pacotes: [], adicionais: [], datas: [], clientes: [], modelos: [] });

let seq = 0;
const novoId = () => `i${++seq}`;

/** A chave que diz que dois itens são o mesmo. */
export function chave(tipo, item) {
  switch (tipo) {
    case "pacotes": case "adicionais": case "modelos": return normal(item.nome);
    case "datas": return `${item.data}|${normal(item.nome)}`;
    case "clientes": return item.whatsapp ? "w:" + item.whatsapp : "n:" + normal(item.nome);
  }
  return "";
}

/** A data de um item da IA ({ dia, mes, ano }); sem ano, a próxima vez que esse dia acontece (como no digitar rápido). */
export function dataDoItem({ dia, mes, ano }, hoje) {
  const texto = `${dia}/${mes}${ano ? "/" + ano : ""}`;
  const d = lerData(texto, hoje);
  if (!d) return null;
  const [, m, di] = d.split("-").map(Number);
  return m === mes && di === dia ? d : null; // 31/02 não vira 03/03
}

const zap = v => (whatsappValido(v) ? normalizarWhatsapp(v) : "");

/**
 * Junta o que veio de um arquivo à proposta. `lido`: { pacotes, adicionais, datas (com data "AAAA-MM-DD" ou dia/mes/ano),
 * clientes, contrato | modelos }. `origem`: o nome do arquivo. Devolve a proposta nova (a antiga não muda) e quantos
 * itens novos entraram.
 */
export function juntar(proposta, lido, origem, { hoje, marcarContatos = true } = {}) {
  const p = Object.fromEntries(TIPOS.map(t => [t, proposta[t].map(i => ({ ...i }))]));
  let novos = 0;
  const por = Object.fromEntries(TIPOS.map(t => [t, new Map(p[t].map(i => [chave(t, i), i]))]));
  const pôr = (tipo, item) => {
    const k = chave(tipo, item);
    if (!k || k === "n:" || k.endsWith("|")) return;
    const ja = por[tipo].get(k);
    if (ja) {
      // o mesmo item de novo: completa o que faltava (o WhatsApp de uma lista, o preço de outra tabela)
      for (const [c, v] of Object.entries(item)) if ((ja[c] === "" || ja[c] === null || ja[c] === undefined) && v !== "" && v !== null && v !== undefined) ja[c] = v;
      if (!ja.origens.includes(origem)) ja.origens.push(origem);
      return;
    }
    const novo = { id: novoId(), origens: [origem], marcado: true, jaExiste: false, ...item };
    p[tipo].push(novo);
    por[tipo].set(k, novo);
    novos++;
  };
  for (const x of lido.pacotes || []) pôr("pacotes", {
    nome: String(x.nome || "").trim(), preco: x.preco ?? null, sinal: x.sinal ?? null, convidados: x.convidados ?? null,
    duracao_min: x.duracao_min ?? null, descricao: x.descricao || "", inclui: x.inclui || [],
  });
  for (const x of lido.adicionais || []) pôr("adicionais", { nome: String(x.nome || "").trim(), preco: x.preco ?? null });
  for (const x of lido.datas || []) {
    const data = x.data || dataDoItem(x, hoje);
    if (!data) continue;
    pôr("datas", {
      data, hora: x.hora || "", nome: String(x.nome || "").trim(), whatsapp: zap(x.whatsapp), tipo: x.tipo || "",
      convidados: x.convidados ?? null, observacao: x.observacao || "", marcado: x.marcado !== false,
    });
  }
  const contatos = lido.clientes || [];
  for (const x of contatos) pôr("clientes", {
    nome: String(x.nome || "").trim(), whatsapp: zap(x.whatsapp), email: x.email || "", observacao: x.observacao || "",
    marcado: marcarContatos,
  });
  const modelos = lido.modelos || (lido.contrato ? [lido.contrato] : []);
  for (const x of modelos) pôr("modelos", { nome: String(x.nome || "Contrato").trim(), texto: x.texto || "" });
  return { proposta: p, novos };
}

/** Quantos itens a proposta tem, por tipo (e o total). `so`: "marcados" conta só os marcados. */
export function contar(proposta, so = null) {
  const c = Object.fromEntries(TIPOS.map(t => [t, proposta[t].filter(i => (so === "marcados" ? i.marcado : true)).length]));
  c.total = TIPOS.reduce((s, t) => s + c[t], 0);
  return c;
}

/** "3 pacotes, 12 datas e 40 clientes" (só o que tem). */
export function resumo(c, { nicho = "eventos" } = {}) {
  const nomes = {
    pacotes: nicho === "fotografia" ? ["ensaio", "ensaios"] : ["pacote", "pacotes"], adicionais: ["adicional", "adicionais"],
    datas: ["data", "datas"], clientes: ["cliente", "clientes"], modelos: ["modelo de contrato", "modelos de contrato"],
  };
  const partes = TIPOS.filter(t => c[t]).map(t => `${c[t]} ${nomes[t][c[t] === 1 ? 0 : 1]}`);
  if (!partes.length) return "nada";
  return partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}

/**
 * Marca o que já está no painel (vem desmarcado, com "já está"). `existentes`: { pacotes: [nome], adicionais: [nome],
 * modelos: [nome], clientes: [{ nome, whatsapp }], datas: [{ data, nome }] }.
 */
export function marcarExistentes(proposta, existentes) {
  const p = Object.fromEntries(TIPOS.map(t => [t, proposta[t].map(i => ({ ...i }))]));
  const nomes = lista => new Set((lista || []).map(normal));
  const sets = { pacotes: nomes(existentes.pacotes), adicionais: nomes(existentes.adicionais), modelos: nomes(existentes.modelos) };
  const zaps = new Set((existentes.clientes || []).map(c => c.whatsapp).filter(Boolean));
  const nomesDeClientes = new Set((existentes.clientes || []).map(c => normal(c.nome)));
  const datas = new Set((existentes.datas || []).map(d => `${d.data}|${normal(d.nome)}`));
  const marca = (i, ja) => { if (ja && !i.jaExiste) { i.jaExiste = true; i.marcado = false; } };
  for (const t of ["pacotes", "adicionais", "modelos"]) for (const i of p[t]) marca(i, sets[t].has(normal(i.nome)));
  for (const i of p.clientes) marca(i, i.whatsapp ? zaps.has(i.whatsapp) : nomesDeClientes.has(normal(i.nome)));
  for (const i of p.datas) marca(i, datas.has(`${i.data}|${normal(i.nome)}`));
  return p;
}

// ---------- de cada fonte para o formato da proposta ----------

/** Contatos do celular: os clientes (com muitos, desmarcados: é a agenda inteira). */
export const doVcf = contatos => ({ lido: { clientes: contatos }, marcarContatos: contatos.length <= CONTATOS_MARCADOS_ATE });

/** Google Agenda: as datas; as que já passaram e as que se repetem (aniversário, rotina) vêm desmarcadas. */
export function doIcs(eventos, hoje) {
  return { lido: { datas: eventos.map(e => ({ data: e.data, hora: e.hora, nome: e.nome, observacao: e.observacao, marcado: !e.repete && e.data >= hoje })) } };
}

const CABECALHOS = {
  nome: /^(nome|cliente|contratante|noiv|responsavel|pacote|ensaio|servico|produto|item)/,
  whatsapp: /(whats|zap|telefone|celular|fone|contato|tel\b)/,
  email: /(e-?mail)/,
  instagram: /(insta)/,
  data: /^(data|dia|quando)\b/,
  hora: /^(hora|horario|inicio)\b/,
  tipo: /^(tipo|evento|festa|ocasiao)/,
  valor: /(valor|preco|total|r\$)/,
  convidados: /(convidad|pessoas|qtd|quantidade)/,
  observacao: /(obs|nota|detalhe|descri)/,
};

/** O mapa das colunas pelo cabeçalho, sem a IA (o mesmo formato da tarefa "colunas"); null se não reconhece. */
export function mapaPeloCabecalho(cabecalho) {
  const colunas = Object.fromEntries(Object.keys(CABECALHOS).map(c => [c, null]));
  const usadas = new Set();
  // os mais específicos primeiro (a coluna "Valor do pacote" é valor, não nome)
  for (const campo of ["email", "instagram", "whatsapp", "data", "hora", "valor", "convidados", "tipo", "observacao", "nome"]) {
    const i = cabecalho.findIndex((c, j) => !usadas.has(j) && CABECALHOS[campo].test(normal(c)));
    if (i >= 0) { colunas[campo] = i; usadas.add(i); }
  }
  if (colunas.nome === null) return null;
  const assunto = colunas.data !== null ? "datas" : colunas.valor !== null && colunas.whatsapp === null ? "pacotes" : "clientes";
  return { assunto, tem_cabecalho: true, colunas };
}

/** As linhas de uma planilha, pelo mapa, no formato da proposta. Datas do Excel (número) e do texto ("31/10/2026"). */
export function daPlanilha(linhas, mapa, hoje) {
  const { assunto, tem_cabecalho: cabecalho, colunas: c } = mapa;
  const corpo = cabecalho ? linhas.slice(1) : linhas;
  const cel = (l, campo) => (c[campo] !== null && c[campo] !== undefined ? String(l[c[campo]] ?? "").trim() : "");
  const lido = { pacotes: [], datas: [], clientes: [] };
  for (const l of corpo) {
    const nome = cel(l, "nome").slice(0, 120);
    if (!nome) continue;
    if (assunto === "pacotes") {
      const valor = cel(l, "valor");
      lido.pacotes.push({ nome: nome.slice(0, 80), preco: valor ? lerValor(valor) : null, convidados: Number(cel(l, "convidados")) || null, descricao: cel(l, "observacao").slice(0, 400), inclui: [] });
      continue;
    }
    if (assunto === "datas") {
      const bruto = cel(l, "data");
      // a planilha manda "31/10/2026", "31/10/2026 19:00", "2026-10-31" ou o número de data do Excel
      const [soData, horaJunto] = bruto.split(/\s+/);
      const data = dataDoExcel(bruto) || lerData(soData, hoje);
      if (!data) continue;
      const horaCel = cel(l, "hora");
      const hora = lerHora(horaCel) || horaDoExcel(horaCel) || (horaJunto && !/^00:00/.test(horaJunto) ? lerHora(horaJunto.slice(0, 5)) : null) || horaDoExcel(bruto) || "";
      lido.datas.push({ data, hora, nome, whatsapp: cel(l, "whatsapp"), tipo: cel(l, "tipo").slice(0, 60), convidados: Number(cel(l, "convidados")) || null, observacao: cel(l, "observacao").slice(0, 300) });
      continue;
    }
    const email = cel(l, "email").toLowerCase();
    lido.clientes.push({ nome, whatsapp: cel(l, "whatsapp"), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "", observacao: cel(l, "observacao").slice(0, 300) });
  }
  return lido;
}

// ---------- o que vai para o banco ----------

/**
 * As linhas de cada tabela para o que está marcado. `opcoes`: { contaId, nicho (o objeto de src/nichos), tipos (os
 * tipos de festa, ou os ensaios na fotografia: [{ id, nome }]) }. Os clientes das datas entram também (o mesmo
 * WhatsApp ou o mesmo nome é o mesmo cliente). `tiposNovos`: os tipos de festa que as datas citam e o painel não tem.
 */
export function paraGravar(proposta, { contaId, nicho, tipos = [] }) {
  const m = t => proposta[t].filter(i => i.marcado);
  const servicos = m("pacotes").map(p => {
    const linha = { conta_id: contaId, nome: p.nome, descricao: p.descricao || null, valor: p.preco, sinal: p.sinal !== null && p.preco !== null && p.sinal > p.preco ? null : p.sinal };
    if (nicho.temConvidados) { linha.convidados_inclusos = p.convidados; linha.inclui = p.inclui && p.inclui.length ? p.inclui : null; }
    else linha.duracao_min = p.duracao_min >= 5 && p.duracao_min <= 1440 ? p.duracao_min : null;
    return linha;
  });
  const adicionais = m("adicionais").map(a => ({ conta_id: contaId, nome: a.nome, preco: a.preco }));
  const modelos = m("modelos").map(x => ({ conta_id: contaId, nome: x.nome, texto: x.texto }));
  const datas = m("datas");
  // os clientes: os marcados da lista e os das datas marcadas, sem repetir
  const clientes = new Map();
  for (const c of m("clientes")) clientes.set(chave("clientes", c), { conta_id: contaId, nome: c.nome, whatsapp: c.whatsapp || null, email: c.email || null });
  for (const d of datas) {
    const k = chave("clientes", d);
    if (!clientes.has(k)) clientes.set(k, { conta_id: contaId, nome: d.nome, whatsapp: d.whatsapp || null, email: null });
  }
  const conhecidos = new Set(tipos.map(t => normal(t.nome)));
  const tiposNovos = nicho.temTiposDeFesta
    ? [...new Map(datas.filter(d => d.tipo && !conhecidos.has(normal(d.tipo))).map(d => [normal(d.tipo), d.tipo])).values()]
    : [];
  return { servicos, adicionais, modelos, clientes: [...clientes.entries()].map(([k, linha]) => ({ chave: k, linha })), datas, tiposNovos };
}
