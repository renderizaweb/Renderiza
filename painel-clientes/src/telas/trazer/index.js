// Trazer o que tem (/trazer; Missão 7, bloco F; D44, D48, D49): a pessoa manda fotos, PDFs, prints, planilhas,
// contatos do celular, a agenda do Google, documentos ou um texto colado (um a um, vários de uma vez, ou um .zip); a
// IA lê cada um e propõe pacotes, adicionais, datas, clientes e o modelo de contrato; a pessoa confere numa lista só
// (desmarca, corrige) e grava. Depois, "Desfazer" tira tudo o que entrou. Quem prefere não mexer manda os arquivos
// para a Renderiza, que monta pela mesma tela, no suporte (D48). Só o dono (ou a Renderiza no suporte).
// Vem da conversa de boas-vindas (?de=montar) ou do Início; as regras sem tela estão em logica.js e arquivos.js.

import { icone } from "../../ui/icones.js";
import { escapar, ocupado } from "../../ui/formulario.js";
import { avisar } from "../../ui/aviso.js";
import { CORES } from "../../ui/campos.js";
import { lerCsv } from "../../ui/csv.js";
import { dia, dataCurta, instanteNoFuso, moeda, lerValor, telefone, normalizarWhatsapp, whatsappValido, FUSO_PADRAO } from "../../ui/formatos.js";
import { nicho as acharNicho } from "../../nichos/index.js";
import { etiquetaDoAmbiente, temaDoNicho } from "../acesso.js";
import { linkDaRenderiza } from "../renderiza.js";
import { reservasDosItens } from "../../modulos/inicio/primeiros-passos.js";
import {
  LIMITES, LIDOS_PELA_IA, tipoDoArquivo, porQueNaoLe, tamanhoLegivel, nomeParaCaminho, codigoDaPasta, mimeDo,
  lerVcf, lerIcs, abrirZip, linhasDoXlsx, prepararImagem,
} from "./arquivos.js";
import { TIPOS, vazia, juntar, contar, resumo, marcarExistentes, doVcf, doIcs, mapaPeloCabecalho, daPlanilha, paraGravar, chave, normal } from "./logica.js";

/** Quantos arquivos sobem e são lidos ao mesmo tempo. */
const AO_MESMO_TEMPO = 3;
/** Na conferência, quantos itens de cada tipo aparecem antes do "Mostrar mais". */
const POR_PAGINA = 40;
const chaveDoTrazido = contaId => `painel-renderiza:trazido:${contaId}`;

const ICONES = { imagem: "imagem", pdf: "contrato", documento: "contrato", planilha: "importar", csv: "importar", contatos: "clientes", agenda: "agenda", texto: "editar", zip: "importar" };
const NOMES_DO_TIPO = { imagem: "Foto", pdf: "PDF", documento: "Documento", planilha: "Planilha", csv: "Planilha", contatos: "Contatos", agenda: "Agenda", texto: "Texto", zip: "Pasta compactada" };

export async function montar(el, { sessao, banco, ambiente, navegar }) {
  const conta = sessao.conta();
  if (!conta) return navegar("/contas", { substituir: true });
  const suporte = !!conta.suporte_ate;
  if (!conta.dono && !suporte) return navegar("/", { substituir: true });
  // os termos vêm antes de tudo (o app pede no Início)
  const termos = await import("../termos.js");
  const aceite = await termos.situacaoDoAceite(banco).catch(() => null);
  if (aceite && !aceite.aceitou) return navegar("/", { substituir: true });
  const deMontar = new URLSearchParams(location.search).get("de") === "montar";
  const voltar = deMontar ? { href: "/montar", texto: "Voltar para a conversa" } : { href: "/", texto: "Voltar ao painel" };
  const n = acharNicho(conta.nicho);
  const temModulo = m => (conta.modulos || []).includes(m);
  const hoje = dia(new Date());
  const contaLinha = await banco.resultado(banco.tabela("contas").select("fuso").eq("id", conta.conta_id).single()).catch(() => ({}));
  const fuso = contaLinha.fuso || FUSO_PADRAO;
  const lote = codigoDaPasta("lote");

  // ---------- o estado ----------
  const itens = []; // { id, nome, tamanho, tipo, arquivo, caminho, estado, progresso, mensagem, resultado, tentar }
  let seqItem = 0;
  let fase = "arquivos"; // arquivos · conferir · gravando · pronto · pedido
  let proposta = vazia();
  const ajustes = new Map(); // "tipo|chave" → { marcado, campos }: o que a pessoa mexeu na conferência
  const mostrar = Object.fromEntries(TIPOS.map(t => [t, POR_PAGINA]));
  let busca = "";
  let gravado = null; // { criados, contagem, importacao }
  let tipos = [];
  let existentesClientes = [];
  let pedidosAbertos = [];

  el.innerHTML = `
    <div class="rz-trazer${temaDoNicho(conta.nicho) ? " " + temaDoNicho(conta.nicho) : ""}">
      <header class="rz-trazer-topo">
        <a class="rz-acesso-voltar" href="${voltar.href}" data-voltar>${icone("voltar", { tamanho: 18 })}${voltar.texto}</a>
        ${etiquetaDoAmbiente(ambiente) ? `<span class="rz-etiqueta rz-etiqueta--alerta">${etiquetaDoAmbiente(ambiente)}</span>` : ""}
      </header>
      <main class="rz-trazer-corpo" data-corpo></main>
      <div class="rz-trazer-barra" data-barra hidden></div>
    </div>`;
  const corpo = el.querySelector("[data-corpo]");
  const barra = el.querySelector("[data-barra]");
  document.body.classList.add("rz-com-barra");

  // a Renderiza no suporte vê os pedidos abertos desta conta, com os arquivos
  if (suporte) {
    pedidosAbertos = await banco.resultado(banco.tabela("pedidos_a_renderiza").select("id, pasta, arquivos, recado, criado_em")
      .eq("conta_id", conta.conta_id).is("atendido_em", null).order("criado_em")).catch(() => []);
  }

  // ---------- os arquivos ----------
  const ocupados = () => itens.filter(i => ["fila", "preparando", "subindo", "lendo"].includes(i.estado)).length;
  const prontos = () => itens.filter(i => i.estado === "pronto");

  function adicionar(arquivos, doZip = "") {
    for (const arquivo of arquivos) {
      const tipo = tipoDoArquivo(arquivo.name, arquivo.type);
      const item = { id: "a" + ++seqItem, nome: arquivo.name, tamanho: arquivo.size, tipo, arquivo, doZip, estado: "fila", progresso: 0, mensagem: "" };
      const fora = mensagem => Object.assign(item, { estado: "fora", mensagem });
      const naLista = itens.filter(i => i.estado !== "fora").length;
      if (!tipo) fora(porQueNaoLe(arquivo.name));
      else if (tipo !== "zip" && naLista >= LIMITES.porVez) fora(`Até ${LIMITES.porVez} arquivos por vez: grave estes e traga o resto depois.`);
      else if (LIDOS_PELA_IA.includes(tipo) && tipo !== "imagem" && arquivo.size > LIMITES.tamanho) fora(`Passa de ${tamanhoLegivel(LIMITES.tamanho)}. Divida o arquivo ou mande as páginas como foto.`);
      else if (["planilha", "csv", "contatos", "agenda", "texto"].includes(tipo) && arquivo.size > LIMITES.planilha) fora(`Passa de ${tamanhoLegivel(LIMITES.planilha)}. Divida em partes menores.`);
      itens.push(item);
    }
    desenhar();
    andar();
  }

  function adicionarTexto(texto) {
    itens.push({ id: "a" + ++seqItem, nome: "Texto colado", tamanho: new Blob([texto]).size, tipo: "texto", texto, estado: "fila", progresso: 0, mensagem: "" });
    desenhar();
    andar();
  }

  function adicionarDoPedido(pedido, lista) {
    for (const a of lista) {
      const tipo = tipoDoArquivo(a.nome, a.tipo);
      itens.push({ id: "a" + ++seqItem, nome: a.nome.replace(/^\d{2}-/, ""), tamanho: a.tamanho, tipo, caminho: a.caminho, pedido: pedido.id, estado: tipo ? "fila" : "fora", progresso: 0, mensagem: tipo ? "" : porQueNaoLe(a.nome) });
    }
    desenhar();
    andar();
  }

  /** Leva os arquivos da fila, até 3 ao mesmo tempo. */
  function andar() {
    while (itens.filter(i => ["preparando", "subindo", "lendo"].includes(i.estado)).length < AO_MESMO_TEMPO) {
      const proximo = itens.find(i => i.estado === "fila");
      if (!proximo) break;
      processar(proximo).catch(() => {}).finally(() => { desenhar(); andar(); });
    }
    desenhar();
  }

  const mudar = (item, campos) => { Object.assign(item, campos); desenharItem(item); desenharBarra(); };

  async function lerComIa(item, entrada) {
    if (item.removido) return;
    mudar(item, { estado: "lendo", mensagem: "Lendo com a IA…" });
    let r;
    try {
      r = await banco.funcao("assistente", { conta: conta.conta_id, tarefa: "ler", entrada: { ...entrada, hoje } });
    } catch (e) {
      return mudar(item, { estado: "erro", mensagem: e.message || "Não deu para ler agora.", tentar: true, caminho: item.pedido ? item.caminho : null });
    }
    if (item.removido) return;
    if (!r || !r.ok) {
      const semIa = r && ["sem_ia", "teto", "limite"].includes(r.motivo);
      return mudar(item, {
        estado: "erro", tentar: !semIa, semIa, caminho: item.pedido ? item.caminho : null,
        mensagem: semIa ? "A leitura com IA não está disponível agora. Envie para a Renderiza montar." : "Não consegui ler este arquivo. Tente de novo.",
      });
    }
    const lido = r.resultado;
    const c = contar({ pacotes: lido.pacotes, adicionais: lido.adicionais, datas: lido.datas, clientes: lido.clientes, modelos: lido.contrato ? [lido.contrato] : [] });
    mudar(item, c.total ? { estado: "pronto", resultado: { lido }, mensagem: `Achei ${resumo(c, { nicho: n.id })}.` } : { estado: "vazio", mensagem: lido.resumo || "Não achei nada para trazer neste arquivo." });
  }

  async function processar(item) {
    try {
      // a planilha, os contatos e a agenda do pedido à Renderiza estão no Storage: abrem aqui, como os da pessoa
      if (!item.arquivo && item.caminho && !LIDOS_PELA_IA.includes(item.tipo)) {
        mudar(item, { estado: "preparando", mensagem: "Abrindo…" });
        item.arquivo = new File([await banco.baixarArquivo("importacoes", item.caminho)], item.nome, { type: mimeDo(item.nome) });
      }
      if (item.tipo === "zip") {
        mudar(item, { estado: "preparando", mensagem: "Abrindo a pasta compactada…" });
        const { arquivos, ignorados } = await abrirZip(item.arquivo);
        item.removido = true;
        itens.splice(itens.indexOf(item), 1);
        if (!arquivos.length) avisar("A pasta compactada não tem arquivos que o painel lê.", { tipo: "erro" });
        else if (ignorados.length) avisar(`${arquivos.length === 1 ? "1 arquivo aberto" : `${arquivos.length} arquivos abertos`}. ${ignorados.length === 1 ? "1 ficou" : `${ignorados.length} ficaram`} de fora (formato que o painel não lê).`);
        adicionar(arquivos, item.nome);
        return;
      }
      if (item.tipo === "contatos" || item.tipo === "agenda" || item.tipo === "csv" || item.tipo === "planilha" || (item.tipo === "texto" && item.arquivo)) {
        mudar(item, { estado: "preparando", mensagem: "Abrindo…" });
        if (item.tipo === "texto") {
          const texto = await item.arquivo.text();
          return lerComIa(item, { texto: texto.slice(0, 120000), nome: item.nome });
        }
        if (item.tipo === "contatos") {
          const contatos = lerVcf(await item.arquivo.text());
          if (!contatos.length) return mudar(item, { estado: "vazio", mensagem: "Nenhum contato com nome e telefone." });
          const { lido, marcarContatos } = doVcf(contatos);
          return mudar(item, { estado: "pronto", resultado: { lido, marcarContatos }, mensagem: `${contatos.length} contatos.${marcarContatos ? "" : " Vêm desmarcados: marque só os clientes."}` });
        }
        if (item.tipo === "agenda") {
          const eventos = lerIcs(await item.arquivo.text(), fuso);
          if (!eventos.length) return mudar(item, { estado: "vazio", mensagem: "Nenhum compromisso nesta agenda." });
          const futuros = eventos.filter(e => e.data >= hoje && !e.repete).length;
          return mudar(item, { estado: "pronto", resultado: doIcs(eventos, hoje), mensagem: `${eventos.length} compromissos (${futuros} daqui para a frente, que vêm marcados).` });
        }
        const linhas = item.tipo === "csv" ? lerCsv(await item.arquivo.text()) : await linhasDoXlsx(item.arquivo);
        if (linhas.length < 1) return mudar(item, { estado: "vazio", mensagem: "A planilha está vazia." });
        let mapa = mapaPeloCabecalho(linhas[0]);
        const claro = mapa && (mapa.colunas.data !== null || mapa.colunas.whatsapp !== null || mapa.colunas.valor !== null || mapa.colunas.email !== null);
        if (!claro) {
          mudar(item, { estado: "lendo", mensagem: "Entendendo as colunas com a IA…" });
          const r = await banco.funcao("assistente", { conta: conta.conta_id, tarefa: "colunas", entrada: { nome: item.nome, linhas: linhas.slice(0, 8).map(l => l.slice(0, 60).map(c => String(c).slice(0, 300))) } }).catch(() => null);
          if (r && r.ok && r.resultado.assunto !== "outro" && r.resultado.colunas.nome !== null) mapa = r.resultado;
        }
        if (!mapa) return mudar(item, { estado: "erro", mensagem: "Não achei a coluna do nome. Ponha um cabeçalho (Nome, WhatsApp, Data…) e mande de novo." });
        const lido = daPlanilha(linhas, mapa, hoje);
        const c = contar({ pacotes: lido.pacotes, adicionais: [], datas: lido.datas, clientes: lido.clientes, modelos: [] });
        return mudar(item, c.total ? { estado: "pronto", resultado: { lido, marcarContatos: lido.clientes.length <= 400 }, mensagem: `Achei ${resumo(c, { nicho: n.id })}.` } : { estado: "vazio", mensagem: "Não achei linhas com nome." });
      }
      if (item.tipo === "texto") return lerComIa(item, { texto: item.texto, nome: "Texto colado" });

      // foto, PDF, documento: sobe (ou já está no pedido à Renderiza) e a IA lê
      if (!item.caminho) {
        let arquivo = item.arquivo;
        if (item.tipo === "imagem") {
          mudar(item, { estado: "preparando", mensagem: "Preparando a foto…" });
          arquivo = await prepararImagem(item.arquivo);
          if (!arquivo) return mudar(item, { estado: "erro", mensagem: "O aparelho não abriu esta foto (HEIC?). Mande como JPEG ou tire um print dela." });
          if (arquivo.size > LIMITES.tamanho) return mudar(item, { estado: "erro", mensagem: `Passa de ${tamanhoLegivel(LIMITES.tamanho)}.` });
        }
        item.preparado = arquivo;
        const caminho = `${conta.conta_id}/${lote}/${nomeParaCaminho(item.nome, seqItem + Number(item.id.slice(1)))}`;
        mudar(item, { estado: "subindo", progresso: 0, mensagem: "Subindo…" });
        const envio = banco.enviarComProgresso("importacoes", caminho, arquivo, arquivo.type || mimeDo(item.nome), p => mudar(item, { progresso: p, mensagem: `Subindo… ${Math.round(p * 100)}%` }));
        item.cancelar = envio.cancelar;
        await envio;
        item.cancelar = null;
        if (item.removido) { banco.removerArquivos("importacoes", [caminho]).catch(() => {}); return; }
        await lerComIa(item, { arquivo: { caminho, tipo: item.tipo, nome: item.nome } });
        return;
      }
      await lerComIa(item, { arquivo: { caminho: item.caminho, tipo: item.tipo, nome: item.nome } });
    } catch (e) {
      if (e && e.cancelado) return;
      mudar(item, { estado: "erro", mensagem: e.message || "Não deu certo. Tente de novo.", tentar: true });
    }
  }

  function tirar(item) {
    item.removido = true;
    if (item.cancelar) item.cancelar();
    itens.splice(itens.indexOf(item), 1);
    desenhar();
    andar();
  }

  function tentarDeNovo(item) {
    Object.assign(item, { estado: "fila", mensagem: "", progresso: 0, tentar: false, semIa: false });
    // o arquivo que já foi lido saiu do Storage: sobe de novo (o do pedido à Renderiza continua lá)
    if (!item.pedido) item.caminho = null;
    andar();
  }

  // ---------- desenhar: os arquivos ----------
  const formatos = "Fotos, prints, PDF, Word, planilhas (Excel ou CSV), contatos do celular (.vcf), Google Agenda (.ics) ou uma pasta compactada (.zip)";

  function linhaDoItem(i) {
    const tom = { pronto: "sucesso", erro: "perigo", fora: "perigo", vazio: "" }[i.estado];
    const andamento = ["fila", "preparando", "subindo", "lendo"].includes(i.estado);
    return `<li data-item="${i.id}" class="rz-trazer-item" data-estado="${i.estado}">
      <span class="rz-trazer-item-icone" aria-hidden="true">${icone(i.estado === "pronto" ? "ok" : i.estado === "erro" || i.estado === "fora" ? "alerta" : ICONES[i.tipo] || "importar", { tamanho: 18 })}</span>
      <span class="rz-linha-texto">
        <b title="${escapar(i.nome)}">${escapar(i.nome)}</b>
        <small class="${tom ? "rz-trazer-tom-" + tom : ""}">${escapar(i.mensagem || (i.estado === "fila" ? "Na fila" : ""))}${i.tamanho ? ` · ${tamanhoLegivel(i.tamanho)}` : ""}${i.doZip ? ` · de ${escapar(i.doZip)}` : ""}</small>
        ${andamento ? `<span class="rz-progresso rz-trazer-progresso${i.estado === "lendo" || i.estado === "preparando" || i.estado === "fila" ? " rz-trazer-progresso--indefinido" : ""}" aria-hidden="true"><span style="width:${Math.round((i.estado === "subindo" ? i.progresso : 0) * 100)}%"></span></span>` : ""}
      </span>
      <span class="rz-linha-fim rz-trazer-item-acoes">
        ${i.tentar ? `<button class="rz-botao rz-botao--pequeno" type="button" data-tentar="${i.id}">Tentar de novo</button>` : ""}
        <button class="rz-botao rz-botao--fantasma" type="button" data-tirar="${i.id}" aria-label="Tirar ${escapar(i.nome)} da lista">${icone("fechar", { tamanho: 18 })}</button>
      </span>
    </li>`;
  }

  function desenharItem(item) {
    const li = corpo.querySelector(`[data-item="${item.id}"]`);
    if (li && fase === "arquivos") li.outerHTML = linhaDoItem(item);
  }

  function desenharArquivos() {
    const temSemIa = itens.some(i => i.semIa);
    corpo.innerHTML = `
      <div class="rz-trazer-cabeca">
        <h1 class="rz-titulo-1" tabindex="-1">${suporte ? `Montar o painel de ${escapar(conta.nome)}` : "Traga o que você já tem"}</h1>
        <p class="rz-texto-2">${n.temTiposDeFesta ? "Orçamento, agenda, lista de clientes, contrato" : "Tabela de ensaios, agenda, lista de clientes, contrato"}: a IA lê e organiza, e você confere tudo antes de entrar no painel.</p>
      </div>
      ${pedidosAbertos.length ? `<section class="rz-cartao rz-cartao-corpo rz-pilha-p rz-trazer-pedidos">
        <h2 class="rz-titulo-3">${pedidosAbertos.length === 1 ? "Pedido para a Renderiza" : "Pedidos para a Renderiza"}</h2>
        ${pedidosAbertos.map(p => `<div class="rz-trazer-pedido"><span class="rz-linha-texto"><b>${p.arquivos} ${p.arquivos === 1 ? "arquivo" : "arquivos"} · ${escapar(dataCurta(new Date(p.criado_em), fuso))}</b>${p.recado ? `<small>"${escapar(p.recado)}"</small>` : ""}</span>
          <span class="rz-trazer-pedido-acoes"><button class="rz-botao rz-botao--pequeno" type="button" data-ler-pedido="${p.id}">Ler os arquivos</button>
          <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-atender="${p.id}">Marcar como feito</button></span></div>`).join("")}
      </section>` : ""}
      <div class="rz-trazer-zona" data-zona tabindex="-1">
        <span class="rz-trazer-zona-icone" aria-hidden="true">${icone("importar", { tamanho: 28 })}</span>
        <p class="rz-trazer-zona-titulo"><span class="rz-so-computador">Arraste os arquivos para cá</span><span class="rz-so-celular">Escolha os arquivos ou tire uma foto</span></p>
        <p class="rz-texto-3 rz-trazer-zona-formatos">${formatos}. Pode mandar vários de uma vez.</p>
        <div class="rz-trazer-zona-botoes">
          <label class="rz-botao rz-botao--primario">${icone("adicionar", { tamanho: 18 })}Escolher arquivos<input type="file" multiple data-escolher hidden
            accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.pdf,.doc,.docx,.odt,.rtf,.xlsx,.xlsm,.csv,.tsv,.vcf,.ics,.txt,.zip,image/*,application/pdf"></label>
          <label class="rz-botao rz-so-celular">${icone("camera", { tamanho: 18 })}Tirar foto<input type="file" accept="image/*" capture="environment" data-escolher hidden></label>
          <button class="rz-botao rz-botao--fantasma" type="button" data-colar>${icone("editar", { tamanho: 18 })}Colar um texto</button>
        </div>
        <div class="rz-trazer-colar" data-area-colar hidden>
          <label class="rz-rotulo" for="trazer-texto">Cole a lista, a conversa ou a tabela</label>
          <textarea id="trazer-texto" class="rz-entrada" rows="6" placeholder="14/11 19h Ana e Pedro (11) 98888-7777 casamento&#10;Pacote Ouro R$ 8.500 até 150 convidados"></textarea>
          <div class="rz-trazer-colar-botoes"><button class="rz-botao rz-botao--pequeno rz-botao--primario" type="button" data-ler-texto>Ler este texto</button>
          <button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-fechar-colar>Cancelar</button></div>
        </div>
      </div>
      ${itens.length ? `<ul class="rz-cartao rz-linhas rz-trazer-lista" aria-live="polite">${itens.map(linhaDoItem).join("")}</ul>` : `
      <ul class="rz-trazer-dicas">
        <li>${icone("contrato", { tamanho: 16 })}<span><b>${n.temTiposDeFesta ? "Pacotes e preços" : "Ensaios e preços"}:</b> o PDF ou a arte do orçamento, ou um print da tabela.</span></li>
        <li>${icone("agenda", { tamanho: 16 })}<span><b>Datas marcadas:</b> foto da agenda de papel, a planilha ou a agenda do Google (.ics).</span></li>
        <li>${icone("clientes", { tamanho: 16 })}<span><b>Clientes:</b> a planilha, os contatos do celular (.vcf) ou prints das conversas.</span></li>
        <li>${icone("contrato", { tamanho: 16 })}<span><b>Contrato:</b> o modelo em Word ou PDF; vira modelo com os campos preenchidos sozinhos.</span></li>
      </ul>`}
      ${!suporte ? `<p class="rz-texto-3 rz-trazer-renderiza${temSemIa ? " rz-trazer-renderiza--destaque" : ""}">${icone("conversa", { tamanho: 16 })}<span>Prefere que a gente faça? <button class="rz-link" type="button" data-pedir>Enviar para a Renderiza montar</button></span></p>` : ""}
      <p class="rz-texto-3 rz-trazer-privacidade">${icone("cadeado", { tamanho: 14 })}<span>Os arquivos só passam pela IA para ler e saem do painel logo depois. Só entra o que você conferir.</span></p>`;
    ligarArquivos();
  }

  function ligarArquivos() {
    corpo.querySelectorAll("[data-escolher]").forEach(input => input.addEventListener("change", () => {
      const lista = [...input.files];
      input.value = "";
      if (lista.length) adicionar(lista);
    }));
    const zona = corpo.querySelector("[data-zona]");
    zona.addEventListener("dragover", e => { e.preventDefault(); zona.classList.add("rz-trazer-zona--sobre"); });
    zona.addEventListener("dragleave", e => { if (!zona.contains(e.relatedTarget)) zona.classList.remove("rz-trazer-zona--sobre"); });
    zona.addEventListener("drop", async e => {
      e.preventDefault();
      zona.classList.remove("rz-trazer-zona--sobre");
      adicionar(await arquivosDoArrasto(e.dataTransfer));
    });
    const area = corpo.querySelector("[data-area-colar]");
    corpo.querySelector("[data-colar]").addEventListener("click", () => { area.hidden = false; area.querySelector("textarea").focus(); });
    corpo.querySelector("[data-fechar-colar]").addEventListener("click", () => { area.hidden = true; });
    corpo.querySelector("[data-ler-texto]").addEventListener("click", () => {
      const t = area.querySelector("textarea").value.trim();
      if (t.length < 3) return area.querySelector("textarea").focus();
      area.hidden = true;
      adicionarTexto(t.slice(0, 120000));
    });
    corpo.addEventListener("click", e => {
      const t = e.target.closest("[data-tirar]");
      if (t) return tirar(itens.find(i => i.id === t.dataset.tirar));
      const r = e.target.closest("[data-tentar]");
      if (r) return tentarDeNovo(itens.find(i => i.id === r.dataset.tentar));
      if (e.target.closest("[data-pedir]")) return pedirARenderiza();
      const lp = e.target.closest("[data-ler-pedido]");
      if (lp) return lerPedido(lp);
      const at = e.target.closest("[data-atender]");
      if (at) return atender(at.dataset.atender, at);
    });
  }

  /** O que veio no arrasto: arquivos soltos e, no computador, as pastas inteiras (com o que tiver dentro). */
  async function arquivosDoArrasto(dt) {
    const entradas = [...(dt.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
    if (!entradas.some(e => e.isDirectory)) return [...dt.files];
    const saida = [];
    const ler = async entrada => {
      if (saida.length > LIMITES.porVez * 2) return;
      if (entrada.isFile) saida.push(await new Promise((ok, falhou) => entrada.file(ok, falhou)));
      else if (entrada.isDirectory) {
        const leitor = entrada.createReader();
        let lote2;
        do {
          lote2 = await new Promise((ok, falhou) => leitor.readEntries(ok, falhou));
          for (const x of lote2) if (!x.name.startsWith(".")) await ler(x);
        } while (lote2.length);
      }
    };
    for (const e of entradas) await ler(e);
    return saida;
  }

  async function lerPedido(botao) {
    const p = pedidosAbertos.find(x => x.id === botao.dataset.lerPedido);
    ocupado(botao, true, "Abrindo…");
    try {
      const lista = await banco.listarArquivos("importacoes", `${conta.conta_id}/${p.pasta}`);
      if (!lista.length) { ocupado(botao, false); return avisar("Os arquivos deste pedido já não estão mais aqui (passou de 7 dias).", { tipo: "erro" }); }
      botao.remove();
      adicionarDoPedido(p, lista);
    } catch (e) {
      ocupado(botao, false);
      avisar(e.message, { tipo: "erro" });
    }
  }

  async function atender(id, botao) {
    const p = pedidosAbertos.find(x => x.id === id);
    ocupado(botao, true, "Marcando…");
    try {
      await banco.resultado(banco.tabela("pedidos_a_renderiza").update({ atendido_em: new Date().toISOString(), atendido_por: (await banco.sessao()).user.id }).eq("id", id));
      const lista = await banco.listarArquivos("importacoes", `${conta.conta_id}/${p.pasta}`).catch(() => []);
      await banco.removerArquivos("importacoes", lista.map(a => a.caminho)).catch(() => {});
      pedidosAbertos = pedidosAbertos.filter(x => x.id !== id);
      avisar("Pedido marcado como feito. Os arquivos saíram do painel.");
      desenhar();
    } catch (e) {
      ocupado(botao, false);
      avisar(e.message, { tipo: "erro" });
    }
  }

  // ---------- pedir à Renderiza ----------
  function pedirARenderiza() {
    fase = "pedido";
    const comArquivo = itens.filter(i => i.arquivo || i.texto);
    corpo.innerHTML = `
      <div class="rz-trazer-cabeca">
        <h1 class="rz-titulo-1" tabindex="-1">A Renderiza monta para você</h1>
        <p class="rz-texto-2">Envie os arquivos por aqui: a equipe da Renderiza coloca tudo no seu painel e te avisa no WhatsApp quando estiver pronto.</p>
      </div>
      <div class="rz-cartao rz-cartao-corpo rz-pilha">
        ${comArquivo.length
          ? `<p class="rz-texto-2"><b>${comArquivo.length} ${comArquivo.length === 1 ? "arquivo vai" : "arquivos vão"} junto:</b> ${escapar(comArquivo.slice(0, 6).map(i => i.nome).join(", "))}${comArquivo.length > 6 ? "…" : ""}</p>`
          : `<label class="rz-botao">${icone("adicionar", { tamanho: 18 })}Escolher arquivos<input type="file" multiple data-escolher-pedido hidden></label><p class="rz-texto-3" data-escolhidos></p>`}
        <div class="rz-campo"><label class="rz-rotulo" for="trazer-recado">Recado para a Renderiza <span class="rz-texto-3">(opcional)</span></label>
          <textarea id="trazer-recado" class="rz-entrada" rows="3" maxlength="500" placeholder="Ex.: a agenda de papel vai até março; o PDF tem os preços novos."></textarea></div>
        <div role="alert" class="rz-alerta rz-alerta--erro" hidden data-erro-pedido></div>
        <div class="rz-trazer-pedido-botoes">
          <button class="rz-botao rz-botao--primario" type="button" data-mandar>Enviar para a Renderiza</button>
          <button class="rz-botao rz-botao--fantasma" type="button" data-cancelar-pedido>Voltar</button>
        </div>
      </div>`;
    desenharBarra();
    let escolhidos = comArquivo.map(i => (i.texto ? new File([i.texto], "texto-colado.txt", { type: "text/plain" }) : i.arquivo));
    corpo.querySelector("[data-escolher-pedido]")?.addEventListener("change", e => {
      escolhidos = [...e.target.files].filter(f => tipoDoArquivo(f.name, f.type) && f.size <= LIMITES.tamanho);
      corpo.querySelector("[data-escolhidos]").textContent = escolhidos.length ? `${escolhidos.length} ${escolhidos.length === 1 ? "arquivo" : "arquivos"}: ${escolhidos.map(f => f.name).join(", ")}` : "";
    });
    corpo.querySelector("[data-cancelar-pedido]").addEventListener("click", () => { fase = "arquivos"; desenhar(); });
    corpo.querySelector("[data-mandar]").addEventListener("click", async e => {
      const botao = e.currentTarget;
      const erro = corpo.querySelector("[data-erro-pedido]");
      erro.hidden = true;
      if (!escolhidos.length) { erro.textContent = "Escolha pelo menos um arquivo."; erro.hidden = false; return; }
      ocupado(botao, true, "Enviando…");
      const pasta = codigoDaPasta("pedido");
      try {
        // os .zip vão abertos (a Renderiza lê arquivo por arquivo)
        let lista = [];
        for (const f of escolhidos) {
          if (tipoDoArquivo(f.name, f.type) === "zip") lista.push(...(await abrirZip(f)).arquivos);
          else lista.push(f);
        }
        lista = lista.slice(0, 200);
        for (let i = 0; i < lista.length; i++) {
          botao.textContent = `Enviando ${i + 1} de ${lista.length}…`;
          let f = lista[i];
          if (tipoDoArquivo(f.name, f.type) === "imagem") f = (await prepararImagem(f)) || f;
          await banco.enviarComProgresso("importacoes", `${conta.conta_id}/${pasta}/${nomeParaCaminho(f.name, i + 1)}`, f, f.type || mimeDo(f.name));
        }
        const recado = corpo.querySelector("#trazer-recado").value.trim().slice(0, 500) || null;
        await banco.resultado(banco.tabela("pedidos_a_renderiza").insert({ conta_id: conta.conta_id, pasta, arquivos: lista.length, recado }));
        corpo.innerHTML = `
          <div class="rz-trazer-feito rz-cartao rz-cartao-corpo">
            <span class="rz-trazer-feito-icone" aria-hidden="true">${icone("ok", { tamanho: 28 })}</span>
            <h1 class="rz-titulo-2" tabindex="-1">Arquivos enviados para a equipe da Renderiza</h1>
            <p class="rz-texto-2">${lista.length === 1 ? "O arquivo chegou" : `Os ${lista.length} arquivos chegaram`} para a gente. A equipe coloca tudo no seu painel e te avisa no WhatsApp quando estiver pronto. Quer adiantar? Mande uma mensagem.</p>
            <div class="rz-trazer-feito-botoes">
              <a class="rz-botao" href="${escapar(linkDaRenderiza(`Oi! Enviei ${lista.length} ${lista.length === 1 ? "arquivo" : "arquivos"} pelo painel para vocês montarem (${conta.nome}).`))}" target="_blank" rel="noopener">${icone("whatsapp", { tamanho: 18 })}Avisar no WhatsApp</a>
              <a class="rz-botao rz-botao--primario" href="${voltar.href}">${deMontar ? "Voltar para a conversa" : "Voltar ao painel"}</a>
            </div>
          </div>`;
        corpo.querySelector("h1").focus();
        lembrar({ pedido: true });
      } catch (er) {
        ocupado(botao, false);
        erro.textContent = er.message || "Não deu para enviar. Tente de novo.";
        erro.hidden = false;
      }
    });
    corpo.querySelector("h1").focus();
  }

  // ---------- a conferência ----------
  function reconstruir() {
    let p = vazia();
    for (const i of itens) if (i.estado === "pronto" && i.resultado) p = juntar(p, i.resultado.lido, i.nome, { hoje, marcarContatos: i.resultado.marcarContatos !== false }).proposta;
    p = marcarExistentes(p, existentes);
    // o que a pessoa já mexeu (voltou aos arquivos e trouxe mais) continua mexido
    for (const t of TIPOS) for (const it of p[t]) {
      const a = ajustes.get(`${t}|${chave(t, it)}`);
      if (a) Object.assign(it, a.campos, { marcado: a.marcado });
    }
    // sem o módulo, o tipo não entra (a regra do banco recusaria)
    if (!temModulo("agenda")) p.datas = [];
    if (!temModulo("contratos")) p.modelos = [];
    proposta = p;
  }

  let existentes = { pacotes: [], adicionais: [], modelos: [], clientes: [], datas: [] };
  async function carregarExistentes() {
    const tudo = async (consulta, max = 20) => {
      const lista = [];
      for (let pag = 0; pag < max; pag++) {
        const parte = await banco.resultado(consulta().range(pag * 1000, pag * 1000 + 999));
        lista.push(...parte);
        if (parte.length < 1000) break;
      }
      return lista;
    };
    const [servicos, adicionais, modelos, clientes, reservas, tiposDaConta] = await Promise.all([
      tudo(() => banco.tabela("servicos").select("id, nome, duracao_min").eq("conta_id", conta.conta_id)),
      tudo(() => banco.tabela("adicionais").select("nome").eq("conta_id", conta.conta_id)),
      temModulo("contratos") ? tudo(() => banco.tabela("modelos_contrato").select("nome").eq("conta_id", conta.conta_id)) : [],
      tudo(() => banco.tabela("clientes").select("id, nome, whatsapp").eq("conta_id", conta.conta_id)),
      temModulo("agenda") ? tudo(() => banco.tabela("reservas").select("inicio, clientes(nome)").eq("conta_id", conta.conta_id).neq("situacao", "cancelada"), 10) : [],
      n.temTiposDeFesta ? tudo(() => banco.tabela("tipos_reserva").select("id, nome").eq("conta_id", conta.conta_id)) : [],
    ]);
    existentesClientes = clientes;
    tipos = n.temTiposDeFesta ? tiposDaConta : servicos;
    existentes = {
      pacotes: servicos.map(s => s.nome), adicionais: adicionais.map(a => a.nome), modelos: modelos.map(m => m.nome), clientes,
      datas: reservas.map(r => ({ data: dia(new Date(r.inicio), fuso), nome: r.clientes ? r.clientes.nome : "" })),
    };
  }

  async function irConferir() {
    const b = barra.querySelector("[data-conferir]");
    if (b) ocupado(b, true, "Preparando…");
    try {
      await carregarExistentes();
    } catch (e) {
      if (b) ocupado(b, false);
      return avisar(e.message, { tipo: "erro" });
    }
    reconstruir();
    fase = "conferir";
    desenhar();
    window.scrollTo(0, 0);
    corpo.querySelector("h1").focus();
  }

  const TITULOS = {
    pacotes: n.temTiposDeFesta ? "Pacotes" : "Ensaios", adicionais: "Adicionais", datas: "Datas marcadas", clientes: "Clientes", modelos: "Modelos de contrato",
  };
  const origem = it => `<small class="rz-trazer-origem">de ${escapar(it.origens.slice(0, 2).join(", "))}${it.origens.length > 2 ? "…" : ""}</small>`;
  const campo = (it, nome, valor, { tipo = "text", rotulo, largura = "", teclado = "", lista = "" } = {}) =>
    `<label class="rz-trazer-campo${largura ? " rz-trazer-campo--" + largura : ""}"><span>${rotulo}</span><input class="rz-entrada" type="${tipo}" data-campo="${nome}" value="${escapar(valor ?? "")}"${teclado ? ` inputmode="${teclado}"` : ""}${lista ? ` list="${lista}"` : ""}></label>`;

  function linhaDaConferencia(t, it) {
    let campos = "";
    if (t === "pacotes") {
      campos = campo(it, "nome", it.nome, { rotulo: "Nome", largura: "largo" }) + campo(it, "preco", it.preco !== null ? String(it.preco).replace(".", ",") : "", { rotulo: "Preço (R$)", largura: "curto", teclado: "decimal" })
        + (n.temConvidados ? campo(it, "convidados", it.convidados ?? "", { rotulo: "Convidados", largura: "curto", teclado: "numeric" }) : campo(it, "duracao_min", it.duracao_min ?? "", { rotulo: "Minutos", largura: "curto", teclado: "numeric" }));
      if (it.inclui && it.inclui.length) campos += `<small class="rz-trazer-detalhe">Inclui: ${escapar(it.inclui.join(", "))}</small>`;
    } else if (t === "adicionais") {
      campos = campo(it, "nome", it.nome, { rotulo: "Nome", largura: "largo" }) + campo(it, "preco", it.preco !== null ? String(it.preco).replace(".", ",") : "", { rotulo: "Preço (R$)", largura: "curto", teclado: "decimal" });
    } else if (t === "datas") {
      campos = campo(it, "data", it.data, { tipo: "date", rotulo: "Data", largura: "medio" }) + campo(it, "hora", it.hora, { tipo: "time", rotulo: "Hora", largura: "curto" })
        + campo(it, "nome", it.nome, { rotulo: "De quem", largura: "largo" }) + campo(it, "whatsapp", it.whatsapp ? telefone(it.whatsapp) : "", { tipo: "tel", rotulo: "WhatsApp", largura: "medio", teclado: "tel" })
        + campo(it, "tipo", it.tipo, { rotulo: n.temTiposDeFesta ? "Tipo de festa" : "Ensaio", largura: "medio", lista: "trazer-tipos" });
      if (it.data < hoje) campos += `<small class="rz-trazer-detalhe">Já passou: entra como realizada.</small>`;
    } else if (t === "clientes") {
      campos = campo(it, "nome", it.nome, { rotulo: "Nome", largura: "largo" }) + campo(it, "whatsapp", it.whatsapp ? telefone(it.whatsapp) : "", { tipo: "tel", rotulo: "WhatsApp", largura: "medio", teclado: "tel" })
        + campo(it, "email", it.email, { tipo: "email", rotulo: "E-mail", largura: "medio" });
    } else if (t === "modelos") {
      const usados = [...new Set((it.texto.match(/\{([a-z_]+)\}/g) || []))];
      campos = campo(it, "nome", it.nome, { rotulo: "Nome do modelo", largura: "largo" })
        + `<details class="rz-trazer-texto"><summary>Ver o texto (${Math.round(it.texto.length / 1000) || 1} mil letras${usados.length ? `, ${usados.length} campos que se preenchem sozinhos` : ""})</summary>
          <textarea class="rz-entrada" rows="12" data-campo="texto">${escapar(it.texto)}</textarea></details>`;
    }
    return `<li class="rz-trazer-conferir-item${it.marcado ? "" : " rz-trazer-desmarcado"}" data-tipo="${t}" data-id="${it.id}">
      <label class="rz-trazer-marca"><input type="checkbox" data-marcar${it.marcado ? " checked" : ""} aria-label="Trazer este item"></label>
      <div class="rz-trazer-campos">${campos}
        <div class="rz-trazer-rodape-item">${it.jaExiste ? `<span class="rz-etiqueta">Já está no painel</span>` : ""}${origem(it)}</div>
      </div>
    </li>`;
  }

  function desenharConferencia() {
    const c = contar(proposta);
    const visiveis = TIPOS.filter(t => proposta[t].length);
    const semModulo = [!temModulo("agenda") && itens.some(i => i.resultado && (i.resultado.lido.datas || []).length) && "as datas (ligue a Agenda)",
      !temModulo("contratos") && itens.some(i => i.resultado && i.resultado.lido.contrato) && "o contrato (ligue Contratos)"].filter(Boolean);
    corpo.innerHTML = `
      <div class="rz-trazer-cabeca">
        <h1 class="rz-titulo-1" tabindex="-1">Confira antes de gravar</h1>
        <p class="rz-texto-2">O que está marcado entra no painel. Desmarque o que não quiser e corrija o que precisar.</p>
      </div>
      ${semModulo.length ? `<p class="rz-alerta rz-alerta--aviso" role="note">${icone("alerta", { tamanho: 18 })}<span>Ficaram de fora ${semModulo.join(" e ")}: o módulo não está na sua conta.</span></p>` : ""}
      ${!c.total ? `<div class="rz-cartao">${"<div class=\"rz-vazio\"><p class=\"rz-titulo-3\">Nada para conferir</p><p class=\"rz-texto-2\">Volte e mande outros arquivos.</p></div>"}</div>` : ""}
      <datalist id="trazer-tipos">${tipos.map(x => `<option value="${escapar(x.nome)}">`).join("")}</datalist>
      ${visiveis.map(t => {
        const lista = proposta[t].filter(it => t !== "clientes" || !busca || normal(it.nome).includes(normal(busca)) || (it.whatsapp || "").includes(busca.replace(/\D/g, "") || "#"));
        const marcados = proposta[t].filter(i => i.marcado).length;
        return `<section class="rz-trazer-secao" data-secao="${t}">
          <div class="rz-trazer-secao-cabeca">
            <h2 class="rz-titulo-3">${TITULOS[t]} <span class="rz-texto-3">${marcados} de ${proposta[t].length} marcados</span></h2>
            <span class="rz-trazer-secao-acoes">
              <button class="rz-link" type="button" data-todos="${t}">Marcar todos</button>
              <button class="rz-link" type="button" data-nenhum="${t}">Desmarcar todos</button>
            </span>
          </div>
          ${t === "datas" ? `<p class="rz-texto-3">Quem é de cada data entra também em Clientes, sem repetir.</p>` : ""}
          ${t === "clientes" && proposta.clientes.length > 20 ? `<input class="rz-entrada rz-trazer-busca" type="search" placeholder="Buscar pelo nome ou WhatsApp" value="${escapar(busca)}" data-busca aria-label="Buscar cliente">` : ""}
          <ul class="rz-cartao rz-trazer-conferir">${lista.slice(0, mostrar[t]).map(it => linhaDaConferencia(t, it)).join("")}</ul>
          ${lista.length > mostrar[t] ? `<button class="rz-botao rz-botao--fantasma rz-botao--bloco" type="button" data-mais="${t}">Mostrar mais ${Math.min(POR_PAGINA, lista.length - mostrar[t])} de ${lista.length - mostrar[t]}</button>` : ""}
        </section>`;
      }).join("")}`;
    ligarConferencia();
  }

  function ajustar(t, it) {
    ajustes.set(`${t}|${it.chaveOriginal || chave(t, it)}`, { marcado: it.marcado, campos: Object.fromEntries(["nome", "preco", "convidados", "duracao_min", "data", "hora", "whatsapp", "tipo", "email", "texto"].filter(k => k in it).map(k => [k, it[k]])) });
  }

  function ligarConferencia() {
    const achar = li => proposta[li.dataset.tipo].find(x => x.id === li.dataset.id);
    corpo.addEventListener("change", e => {
      const li = e.target.closest("[data-id]");
      if (!li) return;
      const t = li.dataset.tipo;
      const it = achar(li);
      if (!it.chaveOriginal) it.chaveOriginal = chave(t, it);
      if (e.target.matches("[data-marcar]")) {
        it.marcado = e.target.checked;
        li.classList.toggle("rz-trazer-desmarcado", !it.marcado);
      } else if (e.target.matches("[data-campo]")) {
        const k = e.target.dataset.campo, v = e.target.value.trim();
        if (k === "preco") it.preco = v ? lerValor(v) : null;
        else if (k === "convidados" || k === "duracao_min") it[k] = v ? Math.max(1, Math.round(Number(v.replace(/\D/g, "")))) || null : null;
        else if (k === "whatsapp") it.whatsapp = whatsappValido(v) ? normalizarWhatsapp(v) : "";
        else it[k] = k === "texto" ? e.target.value : v;
        // marcou ao corrigir: a pessoa quer o item
        if (!it.marcado && k !== "texto") { it.marcado = true; li.querySelector("[data-marcar]").checked = true; li.classList.remove("rz-trazer-desmarcado"); }
      }
      ajustar(t, it);
      const sec = li.closest("[data-secao]");
      const s = sec.querySelector("h2 .rz-texto-3");
      s.textContent = `${proposta[t].filter(i => i.marcado).length} de ${proposta[t].length} marcados`;
      desenharBarra();
    });
    corpo.addEventListener("click", e => {
      const todos = e.target.closest("[data-todos]"), nenhum = e.target.closest("[data-nenhum]"), mais = e.target.closest("[data-mais]");
      if (todos || nenhum) {
        const t = (todos || nenhum).dataset.todos || nenhum.dataset.nenhum;
        for (const it of proposta[t]) { it.marcado = !!todos; ajustar(t, it); }
        return desenhar();
      }
      if (mais) { mostrar[mais.dataset.mais] += POR_PAGINA; return desenhar(); }
    });
    corpo.querySelector("[data-busca]")?.addEventListener("input", e => {
      busca = e.target.value;
      const pos = e.target.selectionStart;
      desenhar();
      const b = corpo.querySelector("[data-busca]");
      b.focus();
      b.setSelectionRange(pos, pos);
    });
  }

  // ---------- gravar e desfazer ----------
  async function gravar() {
    const marcados = contar(proposta, "marcados");
    if (!marcados.total) return;
    // a conferência pode deixar uma data sem dia ou sem nome: isso não entra
    const invalidas = proposta.datas.filter(d => d.marcado && (!/^\d{4}-\d{2}-\d{2}$/.test(d.data) || !d.nome));
    if (invalidas.length) return avisar(`${invalidas.length === 1 ? "Uma data está" : `${invalidas.length} datas estão`} sem dia ou sem nome. Corrija ou desmarque.`, { tipo: "erro" });
    if (proposta.pacotes.concat(proposta.adicionais, proposta.clientes, proposta.modelos).some(i => i.marcado && !String(i.nome || "").trim())) return avisar("Tem item marcado sem nome. Corrija ou desmarque.", { tipo: "erro" });
    fase = "gravando";
    desenharBarra();
    const botao = barra.querySelector("[data-gravar]");
    const criados = { reservas: [], clientes: [], servicos: [], adicionais: [], modelos: [], tipos: [] };
    const passo = t => { if (botao) botao.textContent = t; };
    try {
      const g = paraGravar(proposta, { contaId: conta.conta_id, nicho: n, tipos });
      const inserir = async (tabela, linhas, colunas = "id") => {
        const saida = [];
        for (let i = 0; i < linhas.length; i += 200) saida.push(...(await banco.resultado(banco.tabela(tabela).insert(linhas.slice(i, i + 200)).select(colunas))));
        return saida;
      };
      if (g.tiposNovos.length) {
        passo("Criando os tipos de festa…");
        const novos = await inserir("tipos_reserva", g.tiposNovos.map((nome, i) => ({ conta_id: conta.conta_id, nome: nome.slice(0, 60), cor: CORES[(tipos.length + i) % CORES.length] })), "id, nome");
        criados.tipos = novos.map(x => x.id);
        tipos = tipos.concat(novos);
      }
      if (g.servicos.length) {
        passo(`Gravando ${g.servicos.length === 1 ? "o pacote" : "os pacotes"}…`);
        const novos = await inserir("servicos", g.servicos, "id, nome, duracao_min");
        criados.servicos = novos.map(x => x.id);
        if (!n.temTiposDeFesta) tipos = tipos.concat(novos); // na fotografia, o ensaio da data é um serviço
      }
      if (g.adicionais.length) { passo("Gravando os adicionais…"); criados.adicionais = (await inserir("adicionais", g.adicionais)).map(x => x.id); }
      if (g.modelos.length) { passo("Gravando o contrato…"); criados.modelos = (await inserir("modelos_contrato", g.modelos)).map(x => x.id); }
      // os clientes: o mesmo WhatsApp (ou, sem WhatsApp, o mesmo nome) já no painel é o mesmo cliente
      const ids = new Map();
      for (const c of existentesClientes) {
        if (c.whatsapp) ids.set("w:" + c.whatsapp, c.id);
        if (!ids.has("n:" + normal(c.nome))) ids.set("n:" + normal(c.nome), c.id);
      }
      const faltam = g.clientes.filter(c => !ids.has(c.chave));
      if (faltam.length) {
        passo(`Gravando ${faltam.length === 1 ? "o cliente" : `os ${faltam.length} clientes`}…`);
        for (let i = 0; i < faltam.length; i += 200) {
          const parte = faltam.slice(i, i + 200);
          const novos = await banco.resultado(banco.tabela("clientes").insert(parte.map(x => x.linha)).select("id, nome, whatsapp"));
          parte.forEach((x, j) => {
            const c = novos[j];
            if (!c || (x.linha.whatsapp ? c.whatsapp !== x.linha.whatsapp : c.nome !== x.linha.nome)) throw new Error("A gravação dos clientes voltou fora de ordem. Tente de novo.");
            ids.set(x.chave, c.id);
            criados.clientes.push(c.id);
          });
        }
      }
      if (g.datas.length) {
        passo(`Gravando ${g.datas.length === 1 ? "a data" : `as ${g.datas.length} datas`}…`);
        const linhas = reservasDosItens(g.datas.map(d => ({ data: d.data, hora: d.hora, nome: d.nome, whatsapp: d.whatsapp, tipo: d.tipo })), { nicho: n.id, fuso, tipos, hoje })
          .map((r, i) => {
            const d = g.datas[i];
            return { ...r, conta_id: conta.conta_id, cliente_id: ids.get(chave("clientes", d)), convidados: d.convidados >= 1 && d.convidados <= 10000 ? d.convidados : null, observacoes: d.observacao ? d.observacao.slice(0, 2000) : null };
          });
        criados.reservas = (await inserir("reservas", linhas)).map(x => x.id);
      }
      const contagem = { arquivos: itens.filter(i => i.estado === "pronto").length, pacotes: criados.servicos.length, adicionais: criados.adicionais.length, datas: criados.reservas.length, clientes: criados.clientes.length, modelos: criados.modelos.length };
      const [importacao] = await banco.resultado(banco.tabela("importacoes").insert({ conta_id: conta.conta_id, ...contagem, pela_renderiza: suporte }).select("id")).catch(() => [null]);
      gravado = { criados, contagem, importacao: importacao && importacao.id };
      lembrar({ contagem });
      fase = "pronto";
      desenhar();
      corpo.querySelector("h1").focus();
    } catch (e) {
      // o que entrou até o erro sai, para não ficar pela metade
      await desfazerCriados(criados).catch(() => {});
      fase = "conferir";
      desenhar();
      avisar(`${e.message || "Não deu para gravar."} Nada foi gravado: tente de novo.`, { tipo: "erro", duracao: 9000 });
    }
  }

  async function desfazerCriados(criados) {
    const tirarDe = async (tabela, ids) => { for (let i = 0; i < ids.length; i += 200) await banco.resultado(banco.tabela(tabela).delete().in("id", ids.slice(i, i + 200))); };
    await tirarDe("reservas", criados.reservas);
    await tirarDe("clientes", criados.clientes);
    await tirarDe("servicos", criados.servicos);
    await tirarDe("adicionais", criados.adicionais);
    await tirarDe("modelos_contrato", criados.modelos);
    await tirarDe("tipos_reserva", criados.tipos);
  }

  async function desfazer(botao) {
    if (!gravado) return;
    ocupado(botao, true, "Desfazendo…");
    try {
      await desfazerCriados(gravado.criados);
      if (gravado.importacao) await banco.resultado(banco.tabela("importacoes").update({ desfeita_em: new Date().toISOString() }).eq("id", gravado.importacao)).catch(() => {});
      gravado = null;
      esquecer();
      fase = "conferir";
      desenhar();
      avisar("Desfeito: nada do que veio ficou no painel. Confira de novo ou volte.");
    } catch (e) {
      ocupado(botao, false);
      avisar(e.message, { tipo: "erro" });
    }
  }

  // o que foi trazido fica no aparelho, para a conversa de boas-vindas mostrar ("Pronto: trouxe…")
  function lembrar(v) { try { localStorage.setItem(chaveDoTrazido(conta.conta_id), JSON.stringify({ ...v, em: Date.now() })); } catch (e) { /* sem armazenamento */ } }
  function esquecer() { try { localStorage.removeItem(chaveDoTrazido(conta.conta_id)); } catch (e) { /* nada */ } }

  function desenharPronto() {
    const c = gravado.contagem;
    const links = [
      c.datas && temModulo("agenda") && `<a class="rz-botao" href="/agenda">${icone("agenda", { tamanho: 18 })}Ver na Agenda</a>`,
      c.clientes && `<a class="rz-botao" href="/clientes">${icone("clientes", { tamanho: 18 })}Ver os clientes</a>`,
      (c.pacotes || c.adicionais) && `<a class="rz-botao" href="/servicos">${icone("servicos", { tamanho: 18 })}Ver ${n.temTiposDeFesta ? "os pacotes" : "os ensaios"}</a>`,
      c.modelos && temModulo("contratos") && `<a class="rz-botao" href="/contratos?aba=modelos">${icone("contrato", { tamanho: 18 })}Ver o contrato</a>`,
    ].filter(Boolean);
    corpo.innerHTML = `
      <div class="rz-trazer-feito rz-cartao rz-cartao-corpo">
        <span class="rz-trazer-feito-icone" aria-hidden="true">${icone("ok", { tamanho: 28 })}</span>
        <h1 class="rz-titulo-2" tabindex="-1">Pronto: entrou no painel</h1>
        <p class="rz-texto-2">${escapar(resumo(c, { nicho: n.id }).replace(/^./, x => x.toUpperCase()))}.${c.pacotes && proposta.pacotes.some(p => p.marcado && p.preco === null) ? " Os pacotes sem preço ficaram para você completar em Serviços." : ""}</p>
        ${links.length ? `<div class="rz-trazer-feito-botoes">${links.join("")}</div>` : ""}
        <div class="rz-trazer-feito-botoes">
          <button class="rz-botao rz-botao--fantasma" type="button" data-desfazer>${icone("desfazer", { tamanho: 18 })}Desfazer</button>
          <button class="rz-botao rz-botao--fantasma" type="button" data-mais-arquivos>${icone("adicionar", { tamanho: 18 })}Trazer mais</button>
          <a class="rz-botao rz-botao--primario" href="${voltar.href}">${deMontar ? "Voltar para a conversa" : "Ir para o painel"}</a>
        </div>
      </div>`;
    corpo.querySelector("[data-desfazer]").addEventListener("click", e => desfazer(e.currentTarget));
    corpo.querySelector("[data-mais-arquivos]").addEventListener("click", () => {
      itens.length = 0; ajustes.clear(); gravado = null; proposta = vazia(); fase = "arquivos";
      desenhar();
    });
  }

  // ---------- a barra de baixo ----------
  function desenharBarra() {
    if (fase === "arquivos") {
      const ocupadosAgora = ocupados();
      const c = contar(itens.filter(i => i.estado === "pronto").reduce((p, i) => juntar(p, i.resultado.lido, i.nome, { hoje }).proposta, vazia()));
      barra.hidden = !itens.length;
      if (!itens.length) return;
      barra.innerHTML = `<div class="rz-trazer-barra-dentro">
        <p class="rz-trazer-barra-texto" aria-live="polite">${ocupadosAgora ? `${icone("relogio", { tamanho: 16 })}<span>Lendo ${ocupadosAgora} de ${itens.filter(i => i.estado !== "fora").length}…${c.total ? ` Já achei ${escapar(resumo(c, { nicho: n.id }))}.` : ""}</span>` : c.total ? `<span>Pronto para conferir: ${escapar(resumo(c, { nicho: n.id }))}.</span>` : `<span>Nada para conferir ainda.</span>`}</p>
        <button class="rz-botao rz-botao--primario" type="button" data-conferir${c.total && !ocupadosAgora ? "" : " disabled"}>Conferir e gravar</button>
      </div>`;
      barra.querySelector("[data-conferir]").addEventListener("click", irConferir);
      return;
    }
    if (fase === "conferir" || fase === "gravando") {
      const m = contar(proposta, "marcados");
      barra.hidden = false;
      barra.innerHTML = `<div class="rz-trazer-barra-dentro">
        <button class="rz-botao rz-botao--fantasma" type="button" data-voltar-arquivos${fase === "gravando" ? " disabled" : ""}>${icone("voltar", { tamanho: 18 })}<span class="rz-so-computador">Voltar aos arquivos</span><span class="rz-so-celular">Arquivos</span></button>
        <button class="rz-botao rz-botao--primario" type="button" data-gravar${m.total && fase !== "gravando" ? "" : " disabled"}>${fase === "gravando" ? "Gravando…" : m.total ? `Gravar ${m.total} ${m.total === 1 ? "item" : "itens"}` : "Nada marcado"}</button>
      </div>`;
      barra.querySelector("[data-voltar-arquivos]").addEventListener("click", () => { fase = "arquivos"; desenhar(); });
      barra.querySelector("[data-gravar]").addEventListener("click", gravar);
      return;
    }
    barra.hidden = true;
  }

  function desenhar() {
    if (fase === "arquivos") desenharArquivos();
    else if (fase === "conferir" || fase === "gravando") { if (fase === "conferir" || !corpo.querySelector(".rz-trazer-conferir")) desenharConferencia(); }
    else if (fase === "pronto") desenharPronto();
    desenharBarra();
  }

  // sair no meio da leitura perde o que estava sendo lido: confirma
  const antesDeSair = e => { if (ocupados() || (fase === "conferir" && contar(proposta, "marcados").total)) { e.preventDefault(); e.returnValue = ""; } };
  window.addEventListener("beforeunload", antesDeSair);

  desenhar();
  corpo.querySelector("h1").focus();
  return () => {
    document.body.classList.remove("rz-com-barra");
    window.removeEventListener("beforeunload", antesDeSair);
    for (const i of itens) if (i.cancelar) i.cancelar();
  };
}
