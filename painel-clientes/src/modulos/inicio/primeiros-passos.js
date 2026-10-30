// "Primeiros passos" no Início (09, como o guia de configuração do Shopify): 4 itens que se marcam sozinhos quando
// feitos (o banco diz), uma barra de progresso e "Esconder" (contas.ajustes.primeiros_passos_escondidos). Só o dono vê.
// Inclui a importação das datas já marcadas: "digitar rápido" (uma data e um nome por linha) ou planilha CSV.
// O item "Copiar o link da agenda online" do 09 entra quando a agenda online existir (Missão 4).

import { nicho as acharNicho } from "../../nichos/index.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { abrirGaveta } from "../../ui/gaveta.js";
import { segmentos } from "../../ui/campos.js";
import { lerCsv, baixarCsv } from "../../ui/csv.js";
import { FUSO_PADRAO, dia, dataCurta, hora, instanteNoFuso, lerData, lerHora, normalizarWhatsapp, whatsappValido } from "../../ui/formatos.js";

export const MAXIMO_DA_IMPORTACAO = 500;

/** Os itens que fazem sentido para a conta (módulo ligado), com o que o banco já tem (`feitos`). */
export function passosDaConta(conta, feitos = {}) {
  const n = acharNicho(conta.nicho);
  const ligado = id => (conta.modulos || []).includes(id);
  return [
    // a conta criada pelo Admin nasce sem nenhum (a do cadastro já vem com os da pergunta do nicho)
    feitos.semServicos
      ? { id: "valores", titulo: `Cadastrar os seus ${n.palavras.servicos}, com os valores`, texto: "Para os orçamentos, os contratos e o Financeiro saírem certos.",
        feito: false, acao: { href: "/servicos", rotulo: "Cadastrar" } }
      : { id: "valores", titulo: `Pôr os valores dos seus ${n.palavras.servicos}`, texto: "Para os orçamentos e o Financeiro saírem certos.",
        feito: !!feitos.valores, acao: { href: "/servicos", rotulo: "Pôr os valores" } },
    (ligado("agenda") || ligado("atendimento")) && { id: "datas", titulo: "Trazer as datas que já estão marcadas",
      texto: "De uma planilha, ou digitando rápido: uma data e um nome por linha.", feito: !!feitos.reservas, acao: { importar: true, rotulo: "Trazer as datas" } },
    ligado("atendimento") && { id: "pedido", titulo: "Anotar o primeiro pedido", texto: "O próximo cliente que chamar no WhatsApp já entra aqui.",
      feito: !!feitos.pedidos, acao: { href: "/atendimento?novo=pedido", rotulo: "Anotar pedido" } },
    { id: "equipe", titulo: "Convidar alguém da equipe", texto: "Cada pessoa vê só o que você liberar.",
      feito: !!feitos.equipe, acao: { href: "/equipe", rotulo: "Convidar" } },
  ].filter(Boolean);
}

// ---------- importar as datas ----------

const SEPARADOR = /^[\s,;|·–-]+|[\s,;|·–-]+$/g;
const FONE_NO_FIM = /(?:^|[\s,;|·–-])((?:\+?55[\s.-]*)?\(?\d{2}\)?[\s.-]*9?\d{4}[\s.-]?\d{4})\s*$/;

/** Uma linha do "digitar rápido": "31/10 19h Juliana Souza (11) 98888-7777". A hora e o WhatsApp são opcionais. */
export function lerLinhaRapida(texto, hoje) {
  const t = String(texto || "").trim().replace(/\s+/g, " ");
  const x = t.match(/^(\S+)(?:\s+(.*))?$/);
  const data = x && lerData(x[1].replace(/[,;|·–-]+$/, ""), hoje);
  if (!data) return { erro: "Não entendi a data (use 31/10 ou 31/10/2026)." };
  let resto = (x[2] || "").replace(/^[\s,;|·–-]+/, "");
  let horaLida = null;
  const h = resto.match(/^(\d{1,2}(?::\d{2}|h(?:\d{2})?))(?:hs?)?(?=$|[\s,;|·–-])(.*)$/i);
  if (h && lerHora(h[1])) { horaLida = lerHora(h[1]); resto = h[2]; }
  let whatsapp = null;
  const f = resto.match(FONE_NO_FIM);
  if (f && whatsappValido(f[1])) { whatsapp = normalizarWhatsapp(f[1]); resto = resto.slice(0, f.index); }
  const nome = resto.replace(SEPARADOR, "").trim().slice(0, 120);
  if (!nome) return { erro: "Falta o nome (de quem é a data)." };
  return { data, hora: horaLida, nome, whatsapp, tipo: "" };
}

const normal = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const COLUNAS = {
  data: /^(data|dia)\b/,
  hora: /^(hora|horario|inicio)\b/,
  nome: /^(nome|cliente|contratante|noiv)/,
  whatsapp: /(whats|telefone|celular|fone|contato)/,
  tipo: /^(tipo|evento|festa|ensaio|servico|pacote)/,
};

/** As colunas pelo cabeçalho; sem data e nome no cabeçalho, cada linha é lida como no "digitar rápido". */
export function colunasDoCabecalho(cabecalho) {
  const achadas = {};
  cabecalho.forEach((c, i) => {
    for (const [campo, re] of Object.entries(COLUNAS)) if (!(campo in achadas) && re.test(normal(c))) { achadas[campo] = i; break; }
  });
  return "data" in achadas && "nome" in achadas ? achadas : null;
}

/** Lê o texto (digitado ou CSV). Devolve { itens: [{ linha, data, hora, nome, whatsapp, tipo }], erros: [{ linha, erro }] }. */
export function lerDatas(texto, { csv = false, hoje = dia(new Date()) } = {}) {
  const itens = [], erros = [];
  if (!csv) {
    String(texto || "").split(/\r?\n/).forEach((l, i) => {
      if (!l.trim()) return;
      const r = lerLinhaRapida(l, hoje);
      (r.erro ? erros : itens).push({ linha: i + 1, ...r });
    });
  } else {
    const linhas = lerCsv(texto);
    const col = linhas.length ? colunasDoCabecalho(linhas[0]) : null;
    linhas.forEach((cel, i) => {
      if (col && i === 0) return;
      if (!col) {
        const r = lerLinhaRapida(cel.filter(Boolean).join(" "), hoje);
        return (r.erro ? erros : itens).push({ linha: i + 1, ...r });
      }
      const celula = campo => (campo in col ? String(cel[col[campo]] || "").trim() : "");
      // a planilha pode mandar a data com a hora junto ("31/10/2026 19:00"; meia-noite é "sem hora")
      const [soData, horaJunto] = celula("data").split(/\s+/);
      const data = lerData(soData, hoje);
      const nome = celula("nome").slice(0, 120);
      if (!data) return erros.push({ linha: i + 1, erro: "Não entendi a data (use 31/10/2026)." });
      if (!nome) return erros.push({ linha: i + 1, erro: "Falta o nome." });
      const fone = celula("whatsapp");
      const horaDaData = horaJunto && !/^00:00/.test(horaJunto) ? lerHora(horaJunto.slice(0, 5)) : null;
      itens.push({ linha: i + 1, data, hora: lerHora(celula("hora")) || horaDaData, nome, whatsapp: whatsappValido(fone) ? normalizarWhatsapp(fone) : null, tipo: celula("tipo") });
    });
  }
  if (itens.length > MAXIMO_DA_IMPORTACAO) erros.unshift({ linha: 0, erro: `São ${itens.length} datas: traga até ${MAXIMO_DA_IMPORTACAO} por vez.` });
  return { itens, erros };
}

/** A duração padrão do nicho, em minutos (eventos: das 19h às 3h; fotografia: 1 hora). */
export function duracaoPadrao(idNicho) {
  const hp = acharNicho(idNicho).horarioPadrao;
  if (hp.duracao) return hp.duracao;
  const min = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const d = min(hp.fim) - min(hp.inicio);
  return d > 0 ? d : d + 24 * 60;
}

/**
 * As linhas da tabela reservas para os itens (sem o cliente_id, que sai da gravação). `tipos`: os tipos de festa
 * (eventos) ou serviços (fotografia) da conta, para casar pelo nome da coluna "tipo".
 */
export function reservasDosItens(itens, { nicho: idNicho, fuso = FUSO_PADRAO, tipos = [], hoje }) {
  const n = acharNicho(idNicho);
  const porNome = new Map(tipos.map(t => [normal(t.nome), t]));
  return itens.map(item => {
    const tipo = item.tipo ? porNome.get(normal(item.tipo)) : null;
    const minutos = (!n.temTiposDeFesta && tipo && tipo.duracao_min) || duracaoPadrao(n.id);
    const inicio = instanteNoFuso(item.data, item.hora || n.horarioPadrao.inicio, fuso);
    return {
      inicio: inicio.toISOString(),
      fim: new Date(inicio.getTime() + minutos * 60000).toISOString(),
      situacao: item.data < hoje ? "realizada" : "confirmada",
      ...(tipo ? (n.temTiposDeFesta ? { tipo_id: tipo.id } : { servico_id: tipo.id }) : {}),
    };
  });
}

/** A chave do cliente dentro da importação: o WhatsApp, ou o nome (sem WhatsApp, o mesmo nome é o mesmo cliente). */
export const chaveDoCliente = item => (item.whatsapp ? "w:" + item.whatsapp : "n:" + normal(item.nome));

/** Grava: os clientes que faltam (o WhatsApp que já existe na conta é o mesmo cliente) e as reservas. */
async function gravar(banco, conta, itens, opcoes) {
  const contaId = conta.conta_id;
  const numeros = [...new Set(itens.map(i => i.whatsapp).filter(Boolean))];
  const clientes = new Map();
  for (let i = 0; i < numeros.length; i += 100) {
    const ja = await banco.resultado(banco.tabela("clientes").select("id, whatsapp").eq("conta_id", contaId).in("whatsapp", numeros.slice(i, i + 100)));
    for (const c of ja) clientes.set("w:" + c.whatsapp, c.id);
  }
  const novos = [];
  for (const item of itens) {
    const k = chaveDoCliente(item);
    if (!clientes.has(k) && !novos.some(x => x.k === k)) novos.push({ k, linha: { conta_id: contaId, nome: item.nome, whatsapp: item.whatsapp } });
  }
  for (let i = 0; i < novos.length; i += 200) {
    const parte = novos.slice(i, i + 200);
    const criados = await banco.resultado(banco.tabela("clientes").insert(parte.map(x => x.linha)).select("id, nome, whatsapp"));
    // a volta vem na ordem do envio; o WhatsApp e o nome conferem
    parte.forEach((x, j) => {
      const c = criados[j];
      if (!c || (x.linha.whatsapp ? c.whatsapp !== x.linha.whatsapp : c.nome !== x.linha.nome)) throw new Error("A gravação dos clientes voltou fora de ordem. Tente de novo.");
      clientes.set(x.k, c.id);
    });
  }
  const reservas = reservasDosItens(itens, opcoes).map((r, i) => ({ ...r, conta_id: contaId, cliente_id: clientes.get(chaveDoCliente(itens[i])) }));
  for (let i = 0; i < reservas.length; i += 200) await banco.resultado(banco.tabela("reservas").insert(reservas.slice(i, i + 200)));
  return { reservas: reservas.length, clientesNovos: novos.length };
}

const MODELO = [
  { data: "31/10/2026", hora: "19:00", nome: "Juliana Souza", whatsapp: "(11) 98888-7777", tipo: "" },
  { data: "07/11/2026", hora: "", nome: "Ana e Pedro", whatsapp: "", tipo: "" },
];

/** A gaveta de importar. Resolve com o total trazido (0 se fechou sem trazer). */
export function abrirImportacao({ banco, conta }) {
  const n = acharNicho(conta.nicho);
  const hoje = dia(new Date());
  let modo = "rapido", texto = "", arquivo = "";
  return new Promise(resolver => {
    let trazidas = 0;
    const j = abrirGaveta({
      titulo: "Trazer as datas marcadas",
      subtitulo: `Cada data vira ${n.palavras.reserva === "festa" ? "uma festa" : "um ensaio"} confirmado na Agenda, com o cliente. Nada vai para o seu cliente.`,
      corpo: `
        <div class="rz-pilha">
          ${segmentos({ nome: "modo", rotulo: "Como trazer", opcoes: [{ valor: "rapido", rotulo: "Digitar rápido" }, { valor: "csv", rotulo: "Planilha (CSV)" }], valor: modo })}
          <div class="rz-campo" data-modo="rapido">
            <label class="rz-rotulo" for="importar-texto">Uma data por linha</label>
            <textarea id="importar-texto" class="rz-entrada" rows="7" spellcheck="false" placeholder="31/10 Juliana Souza&#10;07/11 20h Ana e Pedro (11) 98888-7777&#10;14/11/2026 Festa da Bia"></textarea>
            <p class="rz-ajuda">A data, a hora se quiser (sem hora, ${escapar(n.horarioPadrao.inicio.replace(":00", "h"))}), o nome e o WhatsApp se tiver.</p>
          </div>
          <div class="rz-campo" data-modo="csv" hidden>
            <label class="rz-rotulo" for="importar-arquivo">Arquivo CSV</label>
            <input id="importar-arquivo" class="rz-entrada" type="file" accept=".csv,text/csv,text/plain">
            <p class="rz-ajuda">No Excel ou no Google Planilhas: salvar ou baixar como CSV. Colunas: data, hora, nome, WhatsApp e tipo (só data e nome são obrigatórias).</p>
            <div><button class="rz-link" type="button" data-modelo>${icone("baixar", { tamanho: 16 })} Baixar o modelo</button></div>
          </div>
          <div role="alert" hidden></div>
          <div data-previa aria-live="polite"></div>
        </div>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button>
        <button class="rz-botao rz-botao--primario" type="button" data-trazer disabled>Trazer as datas</button>`,
      aoFechar: () => resolver(trazidas),
    });
    const el = j.el;
    const previa = el.querySelector("[data-previa]");
    const aviso = el.querySelector("[role=alert]");
    const trazer = el.querySelector("[data-trazer]");
    let lido = { itens: [], erros: [] };

    const mostrar = () => {
      lido = modo === "csv" ? lerDatas(arquivo, { csv: true, hoje }) : lerDatas(texto, { hoje });
      const { itens, erros } = lido;
      const demais = erros.some(e => e.linha === 0);
      trazer.disabled = !itens.length || demais;
      trazer.textContent = itens.length && !demais ? `Trazer ${itens.length} ${itens.length === 1 ? "data" : "datas"}` : "Trazer as datas";
      if (!itens.length && !erros.length) { previa.innerHTML = ""; return; }
      const exemplo = itens.slice(0, 50);
      previa.innerHTML = `
        ${erros.length ? `<div class="rz-alerta rz-alerta--aviso">${icone("alerta", { tamanho: 20 })}<div><b>${erros.length === 1 ? "1 linha ficou de fora" : `${erros.length} linhas ficaram de fora`}</b>
          <ul class="rz-importar-erros">${erros.slice(0, 8).map(e => `<li>${e.linha ? `Linha ${e.linha}: ` : ""}${escapar(e.erro)}</li>`).join("")}${erros.length > 8 ? `<li>e mais ${erros.length - 8}</li>` : ""}</ul></div></div>` : ""}
        ${itens.length ? `<p class="rz-rotulo">Vão entrar ${itens.length === 1 ? "1 data" : `${itens.length} datas`}</p>
        <ul class="rz-linhas rz-importar-lista">${exemplo.map(i => `<li class="rz-linha"><span class="rz-linha-texto"><b>${escapar(i.nome)}</b>
          <small>${escapar(dataCurta(instanteNoFuso(i.data, i.hora || "12:00")))}${i.data.slice(0, 4) !== hoje.slice(0, 4) ? "/" + i.data.slice(0, 4) : ""}${i.hora ? " · " + escapar(hora(instanteNoFuso(i.data, i.hora))) : ""}${i.whatsapp ? " · WhatsApp" : ""}${i.tipo ? " · " + escapar(i.tipo) : ""}</small></span></li>`).join("")}
          ${itens.length > exemplo.length ? `<li class="rz-linha"><span class="rz-texto-3">e mais ${itens.length - exemplo.length}</span></li>` : ""}</ul>` : ""}`;
    };

    el.querySelector(".rz-segmentos").addEventListener("change", e => {
      modo = e.target.value;
      el.querySelectorAll("[data-modo]").forEach(c => { c.hidden = c.dataset.modo !== modo; });
      mostrar();
    });
    el.querySelector("#importar-texto").addEventListener("input", e => { texto = e.target.value; mostrar(); });
    el.querySelector("#importar-arquivo").addEventListener("change", async e => {
      const f = e.target.files[0];
      avisoDoFormulario(aviso, "");
      if (!f) { arquivo = ""; return mostrar(); }
      if (f.size > 2 * 1024 * 1024) { arquivo = ""; avisoDoFormulario(aviso, "Arquivo grande demais (até 2 MB)."); return mostrar(); }
      arquivo = await f.text();
      mostrar();
    });
    el.querySelector("[data-modelo]").addEventListener("click", () => baixarCsv("modelo-datas", MODELO, [
      { titulo: "data", valor: l => l.data }, { titulo: "hora", valor: l => l.hora }, { titulo: "nome", valor: l => l.nome },
      { titulo: "whatsapp", valor: l => l.whatsapp }, { titulo: "tipo", valor: l => l.tipo },
    ]));
    trazer.addEventListener("click", async () => {
      if (trazer.disabled) return;
      avisoDoFormulario(aviso, "");
      ocupado(trazer, true, "Trazendo…");
      try {
        const [contaLinha, tipos] = await Promise.all([
          banco.resultado(banco.tabela("contas").select("fuso").eq("id", conta.conta_id).single()),
          banco.resultado(banco.tabela(n.temTiposDeFesta ? "tipos_reserva" : "servicos").select(n.temTiposDeFesta ? "id, nome" : "id, nome, duracao_min").eq("conta_id", conta.conta_id)),
        ]);
        const r = await gravar(banco, conta, lido.itens, { nicho: n.id, fuso: contaLinha.fuso || FUSO_PADRAO, tipos, hoje });
        trazidas = r.reservas;
        j.fechar();
      } catch (e) {
        ocupado(trazer, false);
        avisoDoFormulario(aviso, e.message);
      }
    });
  });
}

// ---------- o cartão no Início ----------

async function lerFeitos(banco, contaId) {
  const existe = consulta => banco.resultado(consulta.limit(1)).then(l => l.length > 0).catch(() => false);
  const [valores, servicos, reservas, pedidos, pessoas, convites] = await Promise.all([
    existe(banco.tabela("servicos").select("id").eq("conta_id", contaId).not("valor", "is", null)),
    existe(banco.tabela("servicos").select("id").eq("conta_id", contaId)),
    existe(banco.tabela("reservas").select("id").eq("conta_id", contaId)),
    existe(banco.tabela("pedidos").select("id").eq("conta_id", contaId)),
    banco.resultado(banco.tabela("pessoas").select("id").eq("conta_id", contaId).limit(2)).then(l => l.length > 1).catch(() => false),
    existe(banco.tabela("convites").select("id").eq("conta_id", contaId).is("aceito_em", null).is("cancelado_em", null)),
  ]);
  return { valores, semServicos: !servicos, reservas, pedidos, equipe: pessoas || convites };
}

/** Monta o cartão dentro de `el` (some sozinho para quem não é dono ou escondeu). */
export async function montarPrimeirosPassos(el, { banco, conta, navegar, avisar }) {
  if (!conta || !conta.dono || (conta.ajustes && conta.ajustes.primeiros_passos_escondidos)) { el.innerHTML = ""; return; }
  const feitos = await lerFeitos(banco, conta.conta_id);
  const passos = passosDaConta(conta, feitos);
  const prontos = passos.filter(p => p.feito).length;
  const todos = prontos === passos.length;
  el.innerHTML = `
    <section class="rz-cartao rz-passos" aria-labelledby="passos-titulo">
      <div class="rz-passos-cabeca">
        <div class="rz-cabeca-titulos">
          <h2 class="rz-titulo-3" id="passos-titulo">${todos ? "Pronto: o painel está montado" : "Primeiros passos"}</h2>
          <p class="rz-texto-3">${prontos} de ${passos.length} feitos</p>
        </div>
        <button class="rz-botao rz-botao--fantasma" type="button" data-esconder>${todos ? "Fechar" : "Esconder"}</button>
      </div>
      <div class="rz-progresso" role="progressbar" aria-label="Primeiros passos" aria-valuemin="0" aria-valuemax="${passos.length}" aria-valuenow="${prontos}"><span style="width:${Math.round((prontos / passos.length) * 100)}%"></span></div>
      <ol class="rz-passos-lista">
        ${passos.map(p => `<li class="rz-passo" data-feito="${p.feito}">
          <span class="rz-passo-marca" aria-hidden="true">${p.feito ? icone("ok", { tamanho: 14 }) : ""}</span>
          <span class="rz-linha-texto"><b>${escapar(p.titulo)}</b><small>${p.feito ? "Feito" : escapar(p.texto)}</small></span>
          ${p.feito ? "" : p.acao.importar
            ? `<button class="rz-botao" type="button" data-importar>${escapar(p.acao.rotulo)}</button>`
            : `<a class="rz-botao" href="${p.acao.href}">${escapar(p.acao.rotulo)}</a>`}
        </li>`).join("")}
      </ol>
    </section>`;

  const importar = el.querySelector("[data-importar]");
  if (importar) importar.addEventListener("click", async () => {
    const total = await abrirImportacao({ banco, conta });
    if (!total) return;
    await montarPrimeirosPassos(el, { banco, conta, navegar, avisar }).catch(() => null);
    avisar(`${total === 1 ? "1 data trazida" : `${total} datas trazidas`} para a Agenda.`);
  });
  el.querySelector("[data-esconder]").addEventListener("click", async () => {
    const antes = conta.ajustes || {};
    const mudar = async ajustes => {
      await banco.resultado(banco.tabela("contas").update({ ajustes }).eq("id", conta.conta_id));
      conta.ajustes = ajustes;
    };
    try {
      await mudar({ ...antes, primeiros_passos_escondidos: true });
      el.innerHTML = "";
      avisar("Primeiros passos escondidos.", {
        desfazer: async () => {
          try { await mudar(antes); montarPrimeirosPassos(el, { banco, conta, navegar, avisar }); }
          catch (e) { avisar(e.message, { tipo: "erro" }); }
        },
      });
    } catch (e) {
      avisar(e.message, { tipo: "erro" });
    }
  });
}
