// Seção "Termo de aceite" do card do lead (painel de prospecção) e a janela que gera e edita o termo. As contas e o
// texto do modelo ficam em termos.js (testado); o banco é termos_online e termos_aceites (supabase/termos-online.sql),
// lidos e gravados por dados.js como as outras tabelas. O cliente lê e assina em /termo/<id> (termos/pagina.html).
//
// Fluxo: Gerar termo → campos do modelo (o que é deste cliente) → o texto sai pronto e ainda dá para mexer nele →
// Salvar rascunho ou Salvar e abrir → Copiar mensagem com o link → a assinatura aparece aqui (e na Atividade).
// Assinado, o texto não muda mais: "Nova versão" faz o -v2 a partir dos mesmos campos.

import * as dados from "./dados.js";
import { h } from "./dom.js";
import { icone } from "./icones.js";
import { abrirJanela, confirmar, aviso } from "./ui.js";
import { salvar, criar } from "./acoes.js";
import { CAMPOS_DO_SITE, MODELO_SITE, camposDoSite, camposDoLead, montarTermoDoSite, idDoTermo, situacaoDoTermo, linkDoTermo } from "./termos.js";
import { desenharTexto, pendencias } from "./termos-texto.js";

const termosDoLead = id => dados.listar("termos_online").filter(t => t.lead_id === id).sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)));
const aceitesDo = termoId => dados.listar("termos_aceites").filter(a => a.termo_id === termoId).sort((a, b) => String(a.criado_em).localeCompare(String(b.criado_em)));
const quando = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
const cnpjBonito = c => String(c || "").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
const protocolo = a => String(a.id || "").replace(/-/g, "").slice(0, 12).toUpperCase();
/** O endereço do termo: o que o banco guarda (o do vereador é /contrato/…) ou /termo/<id>. */
const enderecoDo = t => (/^https:\/\//.test(t.pagina || "") ? t.pagina : linkDoTermo(t.id));

function copiar(texto, ok) {
  const mostrar = () => aviso("Copie: " + texto);
  try { navigator.clipboard.writeText(texto).then(() => aviso(ok), mostrar); } catch (e) { mostrar(); }
}
/** A mensagem para mandar no WhatsApp com o link do termo. */
export function mensagemDoTermo(termo) {
  return `Oi! Segue o termo para formalizar o ${termo.titulo.replace(/^Termo de contratação\s*·\s*/i, "") || "projeto"}: ${enderecoDo(termo)}\n\n`
    + "É só ler, preencher os dados e confirmar com o código de 6 números que chega no seu e-mail. No fim, o comprovante chega por e-mail também. Qualquer dúvida, me chama aqui.";
}

/**
 * A seção do card. ctx: { id, vincular, cartao, mapaDeVisitas } (do app.js). Mostra o termo mais novo do lead (link,
 * situação, pendências, assinaturas e quem abriu) e as versões anteriores.
 */
export function secaoTermo({ id, vincular, cartao, mapaDeVisitas }) {
  const gerar = h("button", { type: "button", class: "btn btn-primary btn-sm" }, icone("documento", 15), "Gerar termo");
  gerar.addEventListener("click", () => abrirEditor(id, null));
  const vazio = h("div", { class: "termo-vazio" },
    h("p", { text: "Quando o cliente fechar, gere aqui o termo de contratação: a base geral do site com o que é deste cliente. Ele lê e assina online, com um código no e-mail, e a assinatura aparece aqui." }),
    gerar);

  const situacao = h("span", { class: "termo-situacao" });
  const titulo = h("strong", { class: "termo-titulo" });
  const versao = h("span", { class: "termo-versao" });
  const link = h("code", { class: "pr-link" });
  const copiarLink = h("button", { type: "button", class: "btn btn-outline btn-sm" }, icone("copiar", 15), "Copiar link");
  const abrir = h("a", { class: "btn btn-outline btn-sm", target: "_blank", rel: "noopener" }, icone("abrirLink", 15), "Abrir");
  const copiarMsg = h("button", { type: "button", class: "btn btn-primary btn-sm" }, icone("mensagem", 15), "Copiar mensagem");
  const falta = h("div", { class: "termo-falta" });
  const chave = h("input", { type: "checkbox", role: "switch", "aria-label": "Aberto para assinar" });
  const chaveRotulo = h("label", { class: "demo-chave" }, chave, h("span", { text: "Aberto para assinar" }));
  const editar = h("button", { type: "button", class: "btn btn-outline btn-sm" }, icone("editar", 15), "Editar");
  const novaVersao = h("button", { type: "button", class: "btn btn-outline btn-sm" }, icone("mais", 15), "Nova versão");
  const apagar = h("button", { type: "button", class: "text-link termo-apagar" }, icone("lixo", 14), "Apagar este rascunho");
  const assinaturas = h("div", { class: "termo-assinaturas" });
  const anteriores = h("p", { class: "termo-anteriores" });

  // Quem abriu o termo: as sessões que abriram /termo (ou o contrato do vereador, data-sub "contrato") e a assinatura.
  let sessoes = new Set();
  const mapa = mapaDeVisitas(id, v => v.pagina === "demo" && (sessoes.has(v.sessao) || (v.detalhe || {}).alvo === "contrato-assinado"), {
    ninguem: "Ninguém abriu o termo ainda.", soVoces: "Só vocês abriram o termo até agora.",
    sinais: r => [r.cliques.includes("contrato-assinar") && "tocou em assinar", r.cliques.includes("contrato-reenviar") && "pediu outro código",
      r.cliques.includes("contrato-assinado") && "assinou", r.cliques.includes("contrato-duvida") && "clicou em tirar dúvida", r.aparelhos > 1 && `abriu em ${r.aparelhos} aparelhos`],
  });
  const visitas = h("div", { class: "demo-visitas" }, h("span", { class: "demo-visitas-titulo", text: "Quem abriu o termo" }), ...mapa.els);

  const cheio = h("div", { class: "termo-cheio" },
    h("div", { class: "termo-cabeca" }, titulo, versao, situacao),
    h("div", { class: "pr-topo" }, link, h("div", { class: "pr-botoes" }, copiarLink, abrir)),
    falta,
    h("div", { class: "termo-acoes" }, chaveRotulo, copiarMsg, editar, novaVersao),
    assinaturas, visitas, anteriores, apagar);
  const indisponivel = h("p", { class: "pr-dica", text: "Os termos ainda não estão no banco: rode supabase/termos-online.sql no Supabase da prospecção." });

  let atual = null;
  vincular(l => {
    if (dados.tabelaFaltando("termos_online")) { indisponivel.hidden = false; vazio.hidden = cheio.hidden = true; return; }
    indisponivel.hidden = true;
    const termos = termosDoLead(id);
    atual = termos[0] || null;
    vazio.hidden = !!atual; cheio.hidden = !atual;
    gerar.disabled = !dados.podeEditar();
    if (!atual) return;
    const aceites = aceitesDo(atual.id);
    const s = situacaoDoTermo(atual, aceites);
    titulo.textContent = atual.titulo.replace(/^Termo de contratação\s*·\s*/i, "");
    versao.textContent = atual.id;
    situacao.className = "termo-situacao " + s.id;
    situacao.textContent = s.nome;
    link.textContent = enderecoDo(atual).replace(/^https:\/\//, "");
    abrir.href = enderecoDo(atual);
    falta.hidden = !s.falta.length || !!aceites.length;
    falta.replaceChildren(h("strong", { text: "Falta preencher antes de abrir: " }), s.falta.join(" · "));
    chave.checked = !!atual.aberto;
    const podeEditar = dados.podeEditar();
    chave.disabled = !podeEditar || (!atual.aberto && s.falta.length > 0);
    chaveRotulo.title = chave.disabled && s.falta.length ? "Preencha o que falta para abrir" : "";
    copiarMsg.hidden = !atual.aberto;
    // Termo feito à mão, fora do modelo (o contrato do vereador, com página própria): só o link, abrir/fechar e as assinaturas.
    const doModelo = !!atual.modelo;
    editar.hidden = !doModelo || !!aceites.length; novaVersao.hidden = !doModelo || !aceites.length; apagar.hidden = !doModelo || !!aceites.length;
    [editar, novaVersao, apagar].forEach(b => { b.disabled = !podeEditar; });
    assinaturas.replaceChildren(...aceites.map(a => h("div", { class: "termo-aceite" },
      h("div", { class: "termo-aceite-topo" }, icone("certo", 15), h("strong", { text: `Assinado por ${a.nome}` }), h("span", { text: quando(a.criado_em) })),
      h("p", { text: [a.empresa && `${a.empresa} · CNPJ ${cnpjBonito(a.cnpj)}`, a.opcao_nome, `${a.email}${a.email_confirmado ? " (e-mail confirmado)" : ""}`, `WhatsApp ${a.whatsapp}`].filter(Boolean).join(" · ") }),
      h("p", { class: "termo-aceite-prova", text: `Protocolo ${protocolo(a)} · IP ${a.ip || "não informado"}${a.comprovante_em ? " · comprovante enviado" : " · comprovante não saiu"}` }),
      // A ligação com o outro contrato: o painel tem Termos de uso próprios, aceitos no primeiro acesso a ele.
      a.plano === "com-painel" ? h("p", { class: "termo-proximo" }, icone("painel", 14),
        h("span", { text: "Escolheu o painel. Próximo passo: criar a conta dele no Admin do Painel Renderiza, com os módulos que ele quiser. Os Termos de uso do painel (plano, módulos e valor) ele aceita no primeiro acesso." })) : null)));
    assinaturas.hidden = !aceites.length;
    const velhos = termos.slice(1);
    anteriores.hidden = !velhos.length;
    anteriores.replaceChildren("Versões anteriores: ", ...velhos.flatMap((t, i) => [i ? " · " : "",
      h("a", { href: enderecoDo(t), target: "_blank", rel: "noopener", text: t.id }), ` (${situacaoDoTermo(t, aceitesDo(t.id)).nome.toLowerCase()})`]));
    sessoes = new Set(dados.listar("visitas").filter(v => v.lead_id === id && v.evento === "abriu" && (v.detalhe || {}).sub === "contrato").map(v => v.sessao));
    visitas.hidden = dados.tabelaFaltando("visitas");
    mapa.desenhar(l);
  });

  copiarLink.addEventListener("click", () => atual && copiar(enderecoDo(atual), "Link do termo copiado."));
  copiarMsg.addEventListener("click", () => atual && copiar(mensagemDoTermo(atual), "Mensagem copiada: é só colar no WhatsApp do cliente."));
  editar.addEventListener("click", () => atual && abrirEditor(id, atual));
  novaVersao.addEventListener("click", () => atual && abrirEditor(id, null, atual.campos));
  chave.addEventListener("change", async () => {
    if (!atual) return;
    try {
      await salvar("termos_online", atual.id, { aberto: chave.checked });
      aviso(chave.checked ? "Termo aberto: copie a mensagem e mande o link ao cliente." : "Termo fechado: o link mostra o texto, mas não aceita assinatura.");
    } catch (e) { chave.checked = !chave.checked; }
  });
  apagar.addEventListener("click", async () => {
    if (!atual) return;
    if (!await confirmar({ titulo: "Apagar este rascunho?", descricao: `${atual.id}. O link deixa de abrir. Termo assinado não pode ser apagado.`, confirmarTexto: "Apagar", destrutivo: true })) return;
    try { await dados.excluir("termos_online", atual.id); aviso("Rascunho apagado."); } catch (e) { aviso(e.message, "erro"); }
  });

  return cartao("Termo de aceite", { classe: "secao-termo" }, indisponivel, vazio, cheio);
}

/**
 * A janela do termo: os campos do modelo, o texto final (dá para mexer) e a prévia como o cliente vê.
 * termo: o termo a editar (rascunho, sem assinatura) ou null para um novo; base: campos para começar (nova versão).
 */
export function abrirEditor(leadId, termo, base = null) {
  const lead = dados.buscar("leads", leadId) || {};
  let campos = camposDoSite(termo ? termo.campos : base || camposDoLead(lead));
  let montado = montarTermoDoSite(campos);
  let mexido = !!termo && termo.texto !== montado.texto; // o texto salvo foi ajustado à mão
  const novoId = termo ? termo.id : idDoTermo(lead.empresa, termosDoLead(leadId).map(t => t.id));

  // aba Campos
  const controles = {};
  const linhas = CAMPOS_DO_SITE.map(f => {
    let el;
    if (f.tipo === "opcoes") el = h("select", {}, ...f.opcoes.map(o => h("option", { value: o.id, text: o.nome })));
    else if (f.tipo === "linhas") el = h("textarea", { rows: "5", placeholder: "Um item por linha" });
    else el = h("input", { type: "text", inputmode: f.tipo === "valor" ? "decimal" : f.tipo === "numero" ? "numeric" : null, autocomplete: "off" });
    el.value = campos[f.id] == null ? "" : String(campos[f.id]);
    controles[f.id] = el;
    const rotulo = h("label", { class: "campo" + (f.tipo === "linhas" || f.tipo === "texto" && /projeto|contratante|referencia|painel_inicio|pagamento_outro/.test(f.id) ? " largo" : "") },
      h("span", { text: f.rotulo }), el, f.dica ? h("small", { class: "termo-dica", text: f.dica }) : null);
    el.addEventListener(f.tipo === "opcoes" ? "change" : "input", () => { campos = { ...campos, [f.id]: el.value }; aoMudarCampos(); });
    return [f, rotulo];
  });
  const mostrarSo = () => linhas.forEach(([f, r]) => { r.hidden = !!f.so && !f.so(campos); });
  const paneCampos = h("div", { class: "termo-editor-campos campos campos-2" }, ...linhas.map(([, r]) => r));

  // aba Texto
  const texto = h("textarea", { class: "termo-texto", rows: "18", spellcheck: "true", "aria-label": "Texto do termo" });
  texto.value = termo ? termo.texto : montado.texto;
  const refazer = h("button", { type: "button", class: "text-link" }, icone("recuperar", 14), "Refazer o texto pelos campos");
  const avisoMexido = h("p", { class: "termo-mexido" }, "Você ajustou o texto à mão: mudar os campos não mexe mais nele. ", refazer);
  texto.addEventListener("input", () => { mexido = texto.value !== montado.texto; avisoMexido.hidden = !mexido; atualizarFalta(); });
  refazer.addEventListener("click", () => { texto.value = montado.texto; mexido = false; avisoMexido.hidden = true; atualizarFalta(); });
  const paneTexto = h("div", { class: "termo-editor-texto" },
    h("p", { class: "termo-dica", text: "# título · ## subtítulo · - item · 1. item numerado · **negrito** · [[pendência]] (segura a assinatura até sair)." }),
    avisoMexido, texto);

  // aba Prévia
  const previa = h("article", { class: "termo-previa" });
  const panePrevia = h("div", { class: "termo-editor-previa" }, previa);

  const abas = [["Campos", paneCampos], ["Texto", paneTexto], ["Como o cliente vê", panePrevia]];
  const botoesAba = abas.map(([nome, pane], i) => {
    const b = h("button", { type: "button", class: "tabs-trigger", role: "tab", "data-state": i ? "inactive" : "active", text: nome });
    b.addEventListener("click", () => {
      botoesAba.forEach((x, j) => x.setAttribute("data-state", j === i ? "active" : "inactive"));
      abas.forEach(([, p], j) => { p.hidden = j !== i; });
      if (pane === panePrevia) desenharTexto(document, previa, texto.value);
    });
    pane.hidden = i > 0;
    return b;
  });

  const falta = h("p", { class: "termo-falta" });
  const salvarRascunho = h("button", { type: "button", class: "btn btn-outline" }, "Salvar rascunho");
  const salvarAbrir = h("button", { type: "button", class: "btn btn-primary" }, "Salvar e abrir para assinar");
  function atualizarFalta() {
    const f = pendencias(texto.value);
    falta.hidden = !f.length;
    falta.replaceChildren(h("strong", { text: `Falta ${f.length === 1 ? "1 coisa" : f.length + " coisas"}: ` }), f.join(" · "));
    salvarAbrir.disabled = !!f.length || !texto.value.trim();
    salvarAbrir.title = f.length ? "Preencha o que está entre [[ ]] para abrir" : "";
  }
  function aoMudarCampos() {
    montado = montarTermoDoSite(campos);
    mostrarSo();
    if (!mexido) texto.value = montado.texto;
    atualizarFalta();
  }

  const { fechar } = abrirJanela({
    titulo: termo ? `Editar ${termo.id}` : `Novo termo · ${novoId}`,
    descricao: "A base geral do site (entrega única, sem manutenção, tudo no nome do cliente, painel à parte) com o que é deste cliente. Só o que estiver em branco e for obrigatório vira pendência. Assinado, o texto não muda mais.",
    larga: true,
    conteudo: [
      h("div", { class: "tabs-list termo-abas", role: "tablist" }, ...botoesAba),
      paneCampos, paneTexto, panePrevia, falta,
      h("div", { class: "janela-acoes" }, h("button", { type: "button", class: "btn btn-outline", text: "Cancelar", onclick: () => fechar() }), salvarRascunho, salvarAbrir),
    ],
  });
  avisoMexido.hidden = !mexido;
  mostrarSo();
  atualizarFalta();

  async function gravar(abrirJa) {
    const linha = {
      titulo: montado.titulo, texto: texto.value.replace(/\r\n/g, "\n").trim(), opcoes: montado.opcoes,
      tipo_contratante: montado.tipo_contratante, modelo: MODELO_SITE, campos, aberto: !!abrirJa,
    };
    if (!linha.texto) { aviso("O texto está vazio.", "erro"); return; }
    [salvarRascunho, salvarAbrir].forEach(b => { b.disabled = true; });
    try {
      if (termo) await salvar("termos_online", termo.id, linha);
      else await criar("termos_online", { id: novoId, lead_id: leadId, exige_codigo: true, ...linha });
      fechar();
      aviso(abrirJa ? "Termo salvo e aberto: copie a mensagem e mande o link ao cliente." : "Rascunho salvo. O link já abre, mas só aceita assinatura quando você abrir.");
    } catch (e) {
      salvarRascunho.disabled = false; atualizarFalta();
    }
  }
  salvarRascunho.addEventListener("click", () => gravar(false));
  salvarAbrir.addEventListener("click", () => gravar(true));
}
