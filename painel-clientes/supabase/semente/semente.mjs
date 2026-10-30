// A semente de teste: as duas contas fictícias dos exemplos (Villa Alecrim, eventos; Estúdio Ciranda, fotografia)
// no banco, com a equipe, os serviços e um mês de movimento. Lê exemplos/dados-villa-alecrim.js e
// exemplos/dados-estudio-ciranda.js (sem mexer neles): o que o exemplo mostra é o que a conta de teste tem, com as
// datas a partir de hoje, como lá. Rodar de novo apaga as duas contas de teste e grava de novo (datas frescas).
// Só no banco local e no STG, nunca na produção (08, regra 9).
//
//   node supabase/semente/semente.mjs local    banco local à parte (painel_clientes_semente): migrações + semente + conferência
//   node supabase/semente/semente.mjs stg      grava no STG e confere
//   node supabase/semente/semente.mjs sql      só mostra o SQL
//
// No STG, se existir o usuário contato@renderizaweb.com.br (Missão 1), ele vira o dono das duas contas de teste
// (a Marina e a Lia): a Renderiza entra com ele e vê o painel como o dono. O resto da equipe são usuários
// fictícios (@villa-alecrim.teste, @estudio-ciranda.teste), sem senha: existem para a RLS ter quem testar.

process.env.TZ = "America/Sao_Paulo"; // as datas dos exemplos são do relógio de quem abre; aqui, o de São Paulo

import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const PASTA = fileURLToPath(new URL("../..", import.meta.url));
const RAIZ = join(PASTA, "..");
const FUSO = "America/Sao_Paulo";
export const DONO_NO_STG = "contato@renderizaweb.com.br";

// ---------- ler os exemplos ----------

function lerExemplo(arquivo, nome) {
  const janela = {};
  const sandbox = { window: janela, localStorage: { getItem: () => null, setItem() {} } };
  vm.runInNewContext(readFileSync(join(RAIZ, "exemplos", arquivo), "utf8"), sandbox, { filename: arquivo });
  if (!janela[nome]) throw new Error(`${arquivo} não definiu window.${nome}`);
  return janela[nome];
}

// ---------- SQL ----------

/** id fixo para cada coisa da semente: rodar de novo dá os mesmos ids. */
export function uid(chave) {
  const h = createHash("sha256").update("painel-renderiza:semente:" + chave).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const q = v => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const n = v => (v === null || v === undefined ? "null" : String(Number(v)));
const arr = (lista, tipo = "text") => `array[${lista.map(q).join(", ")}]::${tipo}[]`;
const json = v => `${q(JSON.stringify(v))}::jsonb`;
const pad = x => String(x).padStart(2, "0");
const dia = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const data = d => (d ? `${q(dia(d))}::date` : "null");
/** Data e hora "HH:MM" de São Paulo; com `depoisDe`, passa para o dia seguinte se a hora for antes (festa que vira a noite). */
function quando(d, hora, depoisDe) {
  let x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (depoisDe && hora <= depoisDe) x = new Date(x.getFullYear(), x.getMonth(), x.getDate() + 1);
  return `(${q(`${dia(x)} ${hora}`)}::timestamp at time zone ${q(FUSO)})`;
}
const instante = t => `${q(new Date(t).toISOString())}::timestamptz`;

function inserir(tabela, linhas) {
  if (!linhas.length) return "";
  const colunas = Object.keys(linhas[0]);
  const valores = linhas.map(l => `  (${colunas.map(c => l[c]).join(", ")})`).join(",\n");
  return `insert into public.${tabela} (${colunas.join(", ")}) values\n${valores};\n`;
}

const SITE_DE_TESTE = JSON.parse(readFileSync(join(RAIZ, "test", "site-teste", "conteudo-inicial.json"), "utf8"));

const ORIGEM = { agenda: "agenda_online", whatsapp: "whatsapp", instagram: "instagram", google: "google", indicacao: "indicacao" };
const FORMA = { Pix: "pix", Boleto: "boleto", "Cartão": "cartao" };

// Os checklists de cada tipo de festa, como em exemplos/painel-eventos.html (checklistDe).
const CHECKLIST = {
  casamento: ["Contrato assinado", "Degustação do cardápio", "Planta das mesas", "Lista de convidados", "Reunião final com o cerimonial"],
  quinze: ["Contrato assinado", "Degustação do cardápio", "Música da valsa", "Lista de convidados", "Reunião final"],
  corporativo: ["Contrato assinado", "Nota fiscal", "Lista de convidados", "Roteiro da noite"],
  outro: ["Contrato assinado", "Cardápio escolhido", "Lista de convidados", "Reunião final"],
};

const MODELO_TESTE = "Contrato de teste (dados fictícios, só para o STG).\n\nContratante: {cliente}\nData: {data}\nPacote: {pacote}\nValor total: {valor}\n\nO texto de verdade é de cada cliente da Renderiza.";
const preencher = (modelo, campos) => modelo.replace(/\{(\w+)\}/g, (_, k) => campos[k] ?? `{${k}}`);
const moeda = v => "R$ " + Math.round(v).toLocaleString("pt-BR");
const dm = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// ---------- as duas contas ----------

export const CONTAS = { villa: uid("conta:villa-alecrim"), ciranda: uid("conta:estudio-ciranda") };

function usuario(chave, email, nome) {
  return { id: uid("usuario:" + chave), email, nome };
}

function villa(V) {
  const conta = CONTAS.villa;
  const sql = [];
  const usuarios = V.EQUIPE.map(p => usuario("villa:" + p.id, `${p.id}@villa-alecrim.teste`, p.nome));
  const pessoa = id => uid("pessoa:villa:" + id);
  const HOJE = V.HOJE;

  sql.push(inserir("contas", [{ id: q(conta), nome: q("Villa Alecrim"), nicho: q("eventos"), codigo: q("villa-alecrim"), cores: json({ principal: "#2d6a4f" }), situacao: q("ativa"), origem: q("renderiza") }]));
  sql.push(inserir("contas_modulos", ["agenda-online", "agenda", "atendimento", "clientes", "contratos", "financeiro", "meu-site"].map(m => ({ conta_id: q(conta), modulo_id: q(m) }))));
  // O site de teste da Missão 4 (test/site-teste, fictício): a agenda online e o Meu site respondem por ele. O conteúdo
  // inicial é o que o extrair.mjs tira do site de teste (o teste da raiz confere que segue igual).
  sql.push(inserir("sites", [{ id: q(uid("site:villa-alecrim")), conta_id: q(conta), codigo: q("villa-alecrim"),
    dominios: arr(["villa-alecrim.teste", "localhost"]), conteudo_inicial: json(SITE_DE_TESTE) }]));

  const visto = t => (t === "online agora" ? "now()" : /há (\d+) min/.test(t) ? `now() - interval '${t.match(/\d+/)[0]} minutes'` : /há (\d+) h/.test(t) ? `now() - interval '${t.match(/\d+/)[0]} hours'` : "null");
  sql.push(inserir("pessoas", V.EQUIPE.map((p, i) => {
    const acessos = {};
    for (const m of ["agenda", "atendimento", "clientes", "contratos", "financeiro"]) if (p.acesso[m]) acessos[m] = p.acesso[m];
    const dono = i === 0;
    return {
      id: q(pessoa(p.id)), conta_id: q(conta), usuario_id: dono ? "(select id from _dono_marina)" : q(usuarios[i].id),
      nome: q(p.nome), email: dono ? "(select email from _dono_marina)" : q(usuarios[i].email), papel: q(p.papel), cor: q(p.cor),
      dono: String(dono), acessos: json(dono ? {} : acessos), visto_em: visto(p.visto),
    };
  })));

  const tipos = ["casamento", "quinze", "aniversario", "infantil", "corporativo"];
  const tipo = t => uid("tipo:villa:" + t);
  sql.push(inserir("tipos_reserva", tipos.map((t, i) => ({ id: q(tipo(t)), conta_id: q(conta), nome: q(V.TIPOS[t].nome), cor: q(V.TIPOS[t].cor), checklist: arr(CHECKLIST[t] || CHECKLIST.outro), ordem: n(i + 1) }))));

  const servico = k => uid("servico:villa:" + k);
  sql.push(inserir("servicos", Object.entries(V.PACOTES).map(([k, p], i) => ({
    id: q(servico(k)), conta_id: q(conta), nome: q(p.nome), valor: n(p.base), convidados_inclusos: n(p.ate), valor_convidado_extra: n(V.POR_CONVIDADO), inclui: arr(p.inclui), ordem: n(i + 1),
  }))));
  const adicional = k => uid("adicional:villa:" + k);
  sql.push(inserir("adicionais", Object.entries(V.ADICIONAIS).map(([k, a], i) => ({ id: q(adicional(k)), conta_id: q(conta), nome: q(a.nome), preco: n(a.preco), ordem: n(i + 1) }))));
  // agenda online do exemplo: qualquer dia, de dia (11h às 17h) ou à noite (19h às 2h)
  const turnos = [];
  for (let d = 0; d < 7; d++) turnos.push({ conta_id: q(conta), dia_semana: n(d), inicio: q("11:00"), fim: q("17:00"), nome: q("De dia") }, { conta_id: q(conta), dia_semana: n(d), inicio: q("19:00"), fim: q("02:00"), nome: q("À noite") });
  sql.push(inserir("horarios", turnos));
  const modelo = uid("modelo:villa");
  sql.push(inserir("modelos_contrato", [{ id: q(modelo), conta_id: q(conta), nome: q("Contrato de teste"), texto: q(MODELO_TESTE) }]));

  // clientes: quem tem festa, quem pediu e quem tem visita marcada (um nome, um cliente)
  const origemDe = {};
  for (const e of V.EVENTOS) origemDe[e.cliente] ||= e.origem;
  for (const p of V.PEDIDOS) origemDe[p.nome] ||= p.origem;
  for (const c of V.COMPROMISSOS) if (!(c.cliente in origemDe)) origemDe[c.cliente] = null;
  const cliente = nome => uid("cliente:villa:" + nome);
  sql.push(inserir("clientes", Object.entries(origemDe).map(([nome, o]) => ({ id: q(cliente(nome)), conta_id: q(conta), nome: q(nome), origem: q(ORIGEM[o] || null) }))));

  // cada festa veio de um pedido (fechado quando o contrato foi aceito) e virou reserva
  const pedidoDe = id => uid("pedido:villa:" + id), reservaDe = id => uid("reserva:villa:" + id);
  const fechouEm = e => e.fechado || V.somar(HOJE, -6);
  sql.push(inserir("pedidos", V.EVENTOS.map(e => ({
    id: q(pedidoDe(e.id)), conta_id: q(conta), cliente_id: q(cliente(e.cliente)), data_desejada: data(e.data), servico_id: q(servico(e.pacote)), tipo_id: q(tipo(e.tipo)),
    convidados: n(e.conv), origem: q(ORIGEM[e.origem]), etapa: q(e.fechado ? "fechado" : "orcamento_enviado"), responsavel_id: q(pessoa(e.resp)),
    criado_em: quando(V.somar(fechouEm(e), -24), "10:00"),
  }))));
  const situacaoDa = e => (e.data < HOJE ? "realizada" : e.status === "orcamento" || e.status === "contrato" ? "pre_reserva" : "confirmada");
  sql.push(inserir("reservas", V.EVENTOS.map(e => ({
    id: q(reservaDe(e.id)), conta_id: q(conta), cliente_id: q(cliente(e.cliente)), pedido_id: q(pedidoDe(e.id)), servico_id: q(servico(e.pacote)), tipo_id: q(tipo(e.tipo)),
    inicio: quando(e.data, e.ini), fim: quando(e.data, e.fim, e.ini), convidados: n(e.conv), situacao: q(situacaoDa(e)),
    responsavel_id: q(pessoa(e.resp)), producao_id: q(pessoa(e.producao)), criado_em: quando(fechouEm(e), "18:00"),
  }))));
  sql.push(...V.EVENTOS.map(e => `update public.pedidos set reserva_id = ${q(reservaDe(e.id))} where id = ${q(pedidoDe(e.id))};\n`));
  sql.push(inserir("reservas_adicionais", V.EVENTOS.flatMap(e => e.adic.map(a => ({ conta_id: q(conta), reserva_id: q(reservaDe(e.id)), adicional_id: q(adicional(a)) })))));
  sql.push(inserir("reservas_valores", V.EVENTOS.map(e => ({ reserva_id: q(reservaDe(e.id)), conta_id: q(conta), valor_total: n(e.valor), sinal: n(e.parcelas[0] ? e.parcelas[0].valor : null) }))));
  sql.push(inserir("parcelas", V.PARCELAS.map(p => ({
    conta_id: q(conta), cliente_id: q(cliente(p.cliente)), reserva_id: q(reservaDe(p.evento)), descricao: q(`Parcela ${p.n}/${p.de}`), valor: n(p.valor),
    vence_em: data(p.vence), pago_em: data(p.pagoEm), forma: q(FORMA[p.forma] || "outro"),
  }))));
  // contrato: aceito quando a festa fechou; enviado (esperando o aceite) quando o status é "contrato"
  const comContrato = V.EVENTOS.filter(e => e.fechado || e.status === "contrato");
  sql.push(inserir("contratos", comContrato.map(e => ({
    conta_id: q(conta), cliente_id: q(cliente(e.cliente)), reserva_id: q(reservaDe(e.id)), modelo_id: q(modelo),
    texto: q(preencher(MODELO_TESTE, { cliente: e.cliente, data: dm(e.data), pacote: V.PACOTES[e.pacote].nome, valor: moeda(e.valor) })),
    situacao: q(e.fechado ? "aceito" : "enviado"), enviado_em: quando(V.somar(fechouEm(e), -1), "18:00"),
    aceito_em: e.fechado ? quando(e.fechado, "20:00") : "null", aceito_nome: e.fechado ? q(e.cliente) : "null",
  }))));
  // checklist (nasce do tipo; marcado como no exemplo)
  for (const e of V.EVENTOS) {
    const itens = (CHECKLIST[e.tipo] || CHECKLIST.outro).length;
    const falta = e.status === "realizado" || e.status === "quitado" ? 0 : Math.min(itens - 1, Math.max(1, Math.round(V.dias(HOJE, e.data) / 25)));
    const feitos = e.status !== "contrato" && e.status !== "orcamento" ? itens - falta : 0;
    if (feitos > 0) sql.push(`update public.reservas_checklist set feito = true where reserva_id = ${q(reservaDe(e.id))} and ordem <= ${feitos};\n`);
  }
  // pedidos em aberto (Atendimento)
  const ETAPA = { novo: "novo", conversa: "em_conversa", visita: "visita_marcada", orcamento: "orcamento_enviado" };
  sql.push(inserir("pedidos", V.PEDIDOS.map(p => ({
    id: q(uid("pedido:villa:" + p.id)), conta_id: q(conta), cliente_id: q(cliente(p.nome)), data_desejada: data(p.data || null), servico_id: p.pacote ? q(servico(p.pacote)) : "null",
    tipo_id: q(tipo(p.tipo)), convidados: n(p.conv || null), mensagem: q(p.msg), origem: q(ORIGEM[p.origem]), etapa: q(ETAPA[p.status]), responsavel_id: q(pessoa(p.resp)),
    criado_em: instante(p.quando),
  }))));
  // visitas, degustações e reuniões
  const festaFutura = nome => V.EVENTOS.find(e => e.cliente === nome && e.data >= HOJE);
  const pedidoAberto = nome => V.PEDIDOS.find(p => p.nome === nome);
  sql.push(inserir("compromissos", V.COMPROMISSOS.map(c => ({
    conta_id: q(conta), tipo: q(c.tipo), titulo: q(c.titulo), inicio: quando(c.data, c.ini), cliente_id: q(cliente(c.cliente)),
    reserva_id: festaFutura(c.cliente) ? q(reservaDe(festaFutura(c.cliente).id)) : "null",
    pedido_id: pedidoAberto(c.cliente) ? q(uid("pedido:villa:" + pedidoAberto(c.cliente).id)) : "null", responsavel_id: q(pessoa(c.resp)),
  }))));
  return { sql: sql.join("\n"), usuarios: usuarios.slice(1), dono: usuarios[0], resumo: { festas: V.EVENTOS.length, pedidos: V.PEDIDOS.length, parcelas: V.PARCELAS.length } };
}

function ciranda(C) {
  const conta = CONTAS.ciranda;
  const sql = [];
  const usuarios = C.EQUIPE.map(p => usuario("ciranda:" + p.id, `${p.id}@estudio-ciranda.teste`, p.nome));
  const pessoa = id => uid("pessoa:ciranda:" + id);
  const HOJE = C.HOJE;

  sql.push(inserir("contas", [{ id: q(conta), nome: q("Estúdio Ciranda"), nicho: q("fotografia"), codigo: q("estudio-ciranda"), cores: json({ principal: "#8a4a5f" }), situacao: q("ativa"), origem: q("renderiza") }]));
  sql.push(inserir("contas_modulos", ["agenda-online", "agenda", "atendimento", "clientes", "contratos", "financeiro"].map(m => ({ conta_id: q(conta), modulo_id: q(m) }))));
  // o exemplo não mostra os acessos da Duda: os do papel dela ("Atendimento e agenda")
  const ACESSOS = { duda: { agenda: "editar", atendimento: "editar" } };
  sql.push(inserir("pessoas", C.EQUIPE.map((p, i) => {
    const dono = i === 0;
    return {
      id: q(pessoa(p.id)), conta_id: q(conta), usuario_id: dono ? "(select id from _dono_lia)" : q(usuarios[i].id),
      nome: q(p.nome), email: dono ? "(select email from _dono_lia)" : q(usuarios[i].email), papel: q(p.papel), cor: q(p.cor),
      dono: String(dono), acessos: json(dono ? {} : ACESSOS[p.id] || {}),
    };
  })));

  const servico = k => uid("servico:ciranda:" + k);
  sql.push(inserir("servicos", Object.entries(C.ENSAIOS).map(([k, e], i) => ({
    id: q(servico(k)), conta_id: q(conta), nome: q(e.nome), descricao: q(e.desc), duracao_min: n(e.dur), valor: n(e.valor), sinal: n(e.sinal), cor: q(e.cor), entrega: q(e.entrega), ordem: n(i + 1),
  }))));
  // terça a sábado: os horários padrão para todos; newborn só às 9h; Natal só na campanha
  const horas = [];
  for (let d = 2; d <= 6; d++) {
    for (const h of ["09:00", "10:30", "14:00", "16:00"]) horas.push({ conta_id: q(conta), servico_id: "null", dia_semana: n(d), inicio: q(h) });
    horas.push({ conta_id: q(conta), servico_id: q(servico("newborn")), dia_semana: n(d), inicio: q("09:00") });
  }
  sql.push(inserir("horarios", horas));
  const campanha = uid("campanha:ciranda:natal");
  sql.push(inserir("campanhas", [{
    id: q(campanha), conta_id: q(conta), nome: q("Mini sessão de Natal"), servico_id: q(servico("natal")),
    dias: `array[${C.NATAL_DIAS.map(d => q(dia(d))).join(", ")}]::date[]`, horarios: arr(C.NATAL_HORAS, "time"), vagas: n(C.NATAL_DIAS.length * C.NATAL_HORAS.length),
  }]));
  const modelo = uid("modelo:ciranda");
  sql.push(inserir("modelos_contrato", [{ id: q(modelo), conta_id: q(conta), nome: q("Contrato de teste"), texto: q(MODELO_TESTE) }]));

  const origemDe = {};
  for (const p of C.PEDIDOS) origemDe[p.nome] ||= p.origem;
  for (const l of C.LISTA_ESPERA) origemDe[l.nome] ||= l.origem;
  for (const s of C.SESSOES) if (!(s.cliente in origemDe)) origemDe[s.cliente] = null;
  const cliente = nome => uid("cliente:ciranda:" + nome);
  sql.push(inserir("clientes", Object.entries(origemDe).map(([nome, o]) => ({ id: q(cliente(nome)), conta_id: q(conta), nome: q(nome), origem: q(ORIGEM[o] || null) }))));

  const reservaDe = id => uid("reserva:ciranda:" + id);
  const SITUACAO = { feito: "realizada", confirmada: "confirmada", pre: "pre_reserva" };
  sql.push(inserir("reservas", C.SESSOES.map(s => ({
    id: q(reservaDe(s.id)), conta_id: q(conta), cliente_id: q(cliente(s.cliente)), servico_id: q(servico(s.tipo)), campanha_id: s.natal ? q(campanha) : "null",
    inicio: quando(s.data, s.ini), fim: quando(s.data, s.fim), situacao: q(SITUACAO[s.status]), responsavel_id: q(pessoa(s.resp)), criado_em: quando(s.criada, "12:00"),
  }))));
  sql.push(inserir("reservas_valores", C.SESSOES.map(s => ({ reserva_id: q(reservaDe(s.id)), conta_id: q(conta), valor_total: n(C.ENSAIOS[s.tipo].valor), sinal: n(C.ENSAIOS[s.tipo].sinal) }))));
  const sessao = Object.fromEntries(C.SESSOES.map(s => [s.id, s]));
  sql.push(inserir("parcelas", C.PARCELAS.map(p => ({
    conta_id: q(conta), cliente_id: q(cliente(sessao[p.sessao].cliente)), reserva_id: q(reservaDe(p.sessao)), descricao: q(p.rot), valor: n(p.valor),
    vence_em: data(p.vence), pago_em: data(p.pagoEm), forma: q(p.rot.includes("Pix") ? "pix" : null),
  }))));
  sql.push(inserir("contratos", C.SESSOES.map(s => ({
    conta_id: q(conta), cliente_id: q(cliente(s.cliente)), reserva_id: q(reservaDe(s.id)), modelo_id: q(modelo),
    texto: q(preencher(MODELO_TESTE, { cliente: s.cliente, data: dm(s.data), pacote: C.ENSAIOS[s.tipo].nome, valor: moeda(C.ENSAIOS[s.tipo].valor) })),
    situacao: q(s.contrato), enviado_em: quando(s.criada, "11:00"), aceito_em: s.contrato === "aceito" ? quando(s.criada, "21:00") : "null",
    aceito_nome: s.contrato === "aceito" ? q(s.cliente) : "null",
  }))));
  const ENTREGA = { selecao: "escolhendo", edicao: "edicao", entregue: "entregue" };
  sql.push(inserir("entregas", C.SESSOES.filter(s => ENTREGA[s.entrega]).map(s => ({
    conta_id: q(conta), reserva_id: q(reservaDe(s.id)), cliente_id: q(cliente(s.cliente)), situacao: q(ENTREGA[s.entrega]), prazo: data(s.prazo), entregue_em: data(s.entregueEm || null),
  }))));
  const ETAPA = { novo: "novo", orcamento: "orcamento_enviado", aguardando_sinal: "aguardando_sinal", fechado: "fechado", perdido: "perdido" };
  sql.push(inserir("pedidos", C.PEDIDOS.map(p => ({
    id: q(uid("pedido:ciranda:" + p.id)), conta_id: q(conta), cliente_id: q(cliente(p.nome)), servico_id: q(servico(p.interesse)), mensagem: q(p.msg),
    origem: q(ORIGEM[p.origem]), etapa: q(ETAPA[p.status]), responsavel_id: q(pessoa("duda")), criado_em: instante(p.quando),
  }))));
  sql.push(inserir("lista_espera", C.LISTA_ESPERA.map((l, i) => ({
    conta_id: q(conta), campanha_id: q(campanha), cliente_id: q(cliente(l.nome)), posicao: n(i + 1), preferencia: q(l.quer), origem: q(ORIGEM[l.origem]), criado_em: instante(l.quando),
  }))));
  return { sql: sql.join("\n"), usuarios: usuarios.slice(1), dono: usuarios[0], resumo: { ensaios: C.SESSOES.length, pedidos: C.PEDIDOS.length, parcelas: C.PARCELAS.length } };
}

/** O SQL da semente inteira (apaga as duas contas de teste e grava de novo). `donoReal`: e-mail que vira o dono. */
export function gerarSql({ donoReal = null } = {}) {
  const V = villa(lerExemplo("dados-villa-alecrim.js", "VILLA"));
  const C = ciranda(lerExemplo("dados-estudio-ciranda.js", "CIRANDA"));
  const ficticios = [...V.usuarios, ...C.usuarios, V.dono, C.dono];
  const criarUsuario = (u, condicao = "true") => `insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  select ${q(u.id)}, 'authenticated', 'authenticated', ${q(u.email)}, now(), '{"provider": "email", "providers": ["email"]}', ${json({ nome: u.nome })} where ${condicao};`;
  // O dono de cada conta: o usuário de verdade (donoReal), se existir; senão, o fictício.
  const dono = (tabela, u) => `create temporary table ${tabela} (id uuid, email text) on commit drop;
${donoReal ? `insert into ${tabela} select id, email from auth.users where email = ${q(donoReal)};\n` : ""}insert into ${tabela} select ${q(u.id)}, ${q(u.email)} where not exists (select 1 from ${tabela});
${criarUsuario(u, `exists (select 1 from ${tabela} where id = ${q(u.id)})`)}`;
  const ids = `array[${ficticios.map(u => q(u.id)).join(", ")}]::uuid[]`;
  return {
    resumo: { villa: V.resumo, ciranda: C.resumo },
    sql: `-- Semente de teste do Painel Renderiza (dados fictícios dos exemplos). Nunca na produção.
-- Apaga as duas contas de teste (e tudo delas) e os usuários fictícios, e grava de novo.
delete from public.contas where id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)});
delete from auth.users where id = any (${ids});

${[...V.usuarios, ...C.usuarios].map(u => criarUsuario(u)).join("\n")}
${dono("_dono_marina", V.dono)}
${dono("_dono_lia", C.dono)}

-- O Auth de verdade não aceita null nas colunas de código (dá erro ao listar ou entrar): vazio, como ele grava.
do $$
declare c text;
begin
  foreach c in array array['confirmation_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'email_change', 'phone_change', 'phone_change_token', 'reauthentication_token'] loop
    if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = c) then
      execute format('update auth.users set %I = coalesce(%I, '''') where id = any ($1)', c, c) using ${ids};
    end if;
  end loop;
  if exists (select 1 from information_schema.columns where table_schema = 'auth' and table_name = 'users' and column_name = 'instance_id') then
    execute 'update auth.users set instance_id = ''00000000-0000-0000-0000-000000000000'' where instance_id is null and id = any ($1)' using ${ids};
  end if;
end $$;

${V.sql}
${C.sql}
-- a semente não é histórico de ninguém
delete from public.atividades where conta_id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)});
`,
  };
}

// A conferência depois de gravar: as contagens batem com os exemplos.
export function sqlDaConferencia() {
  return `select json_build_object(
    'contas', (select count(*) from public.contas where id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)})),
    'pessoas', (select count(*) from public.pessoas where conta_id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)})),
    'donos', (select json_agg(email order by email) from public.pessoas where dono and conta_id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)})),
    'festas', (select count(*) from public.reservas where conta_id = ${q(CONTAS.villa)}),
    'ensaios', (select count(*) from public.reservas where conta_id = ${q(CONTAS.ciranda)}),
    'pedidos_villa', (select count(*) from public.pedidos where conta_id = ${q(CONTAS.villa)} and etapa not in ('fechado')),
    'pedidos_ciranda', (select count(*) from public.pedidos where conta_id = ${q(CONTAS.ciranda)}),
    'parcelas', (select count(*) from public.parcelas where conta_id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)})),
    'contratos_aceitos', (select count(*) from public.contratos where situacao = 'aceito' and conta_id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)})),
    'checklist_feito', (select count(*) from public.reservas_checklist where feito and conta_id = ${q(CONTAS.villa)}),
    'entregas', (select count(*) from public.entregas where conta_id = ${q(CONTAS.ciranda)}),
    'atividades', (select count(*) from public.atividades where conta_id in (${q(CONTAS.villa)}, ${q(CONTAS.ciranda)}))
  ) as conferencia`;
}

// ---------- linha de comando ----------

async function principal(comando) {
  if (comando === "sql") {
    process.stdout.write(gerarSql({ donoReal: DONO_NO_STG }).sql);
    return;
  }
  if (comando === "local") {
    const local = await import("../../scripts/lib/banco-local.mjs");
    const { lerMigracoes, sqlDeAplicacao } = await import("../../scripts/lib/migracoes.mjs");
    const BANCO = "painel_clientes_semente";
    if (!local.temPsql()) throw new Error("Sem psql: o banco local precisa do Postgres do ambiente.");
    local.garantirServidor();
    local.rodar(`drop database if exists ${BANCO} with (force);\ncreate database ${BANCO};`, { banco: null });
    local.rodar(readFileSync(join(PASTA, "supabase", "local", "imitacao-supabase.sql"), "utf8"), { banco: BANCO, transacao: true });
    for (const m of lerMigracoes(join(PASTA, "supabase", "migrations"))) local.rodar(sqlDeAplicacao(m), { banco: BANCO, transacao: true });
    const { sql, resumo } = gerarSql();
    local.rodar(sql, { banco: BANCO, transacao: true });
    local.rodar(sql, { banco: BANCO, transacao: true }); // de novo: rodar duas vezes dá o mesmo resultado
    console.log("Exemplos:", JSON.stringify(resumo));
    console.log("Banco local (" + BANCO + "):", local.valor(sqlDaConferencia(), { banco: BANCO }));
    return;
  }
  if (comando === "stg") {
    const { consultar } = await import("../../scripts/lib/supabase-api.mjs");
    const { conferirProjeto } = await import("../../scripts/lib/projetos.mjs");
    const p = await conferirProjeto("stg"); // só o STG: o nome do projeto tem que ter "STG"
    console.log(`STG: ${p.nome} (${p.ref})`);
    const { sql, resumo } = gerarSql({ donoReal: DONO_NO_STG });
    await consultar(p.ref, sql);
    console.log("Exemplos:", JSON.stringify(resumo));
    const [linha] = await consultar(p.ref, sqlDaConferencia(), { somenteLeitura: true });
    console.log("No STG:", JSON.stringify(linha.conferencia));
    return;
  }
  throw new Error("Use: local, stg ou sql. (A semente nunca vai para a produção.)");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    await principal(process.argv[2]);
  } catch (e) {
    console.error("Parou: " + e.message);
    process.exit(1);
  }
}
