// Clientes e entregas · as entregas das fotos (Missão 3, bloco A; fotografia; 02: o painel não guarda as fotos,
// guarda o link da galeria). Em andamento (escolhendo, em edição) pelo prazo; entregues; e os ensaios feitos que
// ainda não começaram a entrega. Mudar a situação tem desfazer; "Entregue" pede o link e oferece o WhatsApp.

import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { abrirGaveta } from "../../ui/gaveta.js";
import { campoTexto, lerFormulario } from "../../ui/campos.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { chips, ligarChips } from "../../ui/filtros.js";
import { dataCurta, instanteNoFuso, linkWhatsapp, normalizarWhatsapp, somarDias } from "../../ui/formatos.js";
import { ENTREGAS, prazoDaEntrega } from "./logica.js";

const COLUNAS = "id, reserva_id, cliente_id, situacao, prazo, link_galeria, entregue_em, criado_em, clientes(id, nome, whatsapp), reservas(id, inicio, servicos(nome))";
export const PRAZO_PADRAO = 30; // dias para a entrega, quando o ensaio não diz (dá para mudar)

export async function montarEntregas(el, ctx, { entrega: abrirId } = {}) {
  const { banco, conta, pode, avisar, fuso, hoje } = ctx;
  const edita = pode("clientes", "editar");
  let grupo = "andamento";
  let dados = { entregas: [], semEntrega: [] };

  const etiqueta = s => (ENTREGAS[s] ? `<span class="rz-etiqueta${ENTREGAS[s].tom ? ` rz-etiqueta--${ENTREGAS[s].tom}` : ""}">${escapar(ENTREGAS[s].nome)}</span>` : "");
  const linha = e => {
    const p = prazoDaEntrega(e, hoje);
    return `<li><button class="rz-linha" type="button" data-entrega="${escapar(e.id)}">
      <span class="rz-linha-texto"><b>${escapar((e.clientes && e.clientes.nome) || "Cliente")}</b><small>${escapar([e.reservas && e.reservas.servicos && e.reservas.servicos.nome, e.reservas && `fotografado ${dataCurta(new Date(e.reservas.inicio), fuso)}`].filter(Boolean).join(" · "))}</small></span>
      <span class="rz-linha-fim">${etiqueta(e.situacao)}<span class="rz-linha-quando${p.tom === "perigo" ? " rz-texto-perigo" : ""}">${escapar(p.texto)}</span></span></button></li>`;
  };
  const desenhar = () => {
    const andamento = dados.entregas.filter(e => e.situacao !== "entregue").sort((a, b) => String(a.prazo || "9").localeCompare(String(b.prazo || "9")));
    const entregues = dados.entregas.filter(e => e.situacao === "entregue").sort((a, b) => String(b.entregue_em || "").localeCompare(String(a.entregue_em || "")));
    const lista = grupo === "andamento" ? andamento : entregues;
    el.innerHTML = `
      <div class="rz-barra-ferramentas">${chips({ rotulo: "Entregas", opcoes: [{ valor: "andamento", rotulo: "Em andamento", quantos: andamento.length }, { valor: "entregues", rotulo: "Entregues", quantos: entregues.length }], ativo: grupo })}</div>
      ${lista.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-cartao">${lista.map(linha).join("")}</ul>`
        : vazio({ icone: "imagem", titulo: grupo === "andamento" ? "Nenhuma entrega em andamento" : "Nenhuma entrega feita ainda", texto: "Depois do ensaio, comece a entrega: o prazo fica à vista e, no fim, o link da galeria vai pelo WhatsApp." })}
      ${edita && dados.semEntrega.length ? `<section class="rz-secao rz-resumo"><div class="rz-secao-cabeca"><h2 class="rz-titulo-3">Ensaios feitos sem entrega</h2><span class="rz-texto-3">${dados.semEntrega.length}</span></div>
        <ul class="rz-linhas rz-cartao">${dados.semEntrega.slice(0, 30).map(r => `<li class="rz-com-acao"><div class="rz-linha rz-linha--fixa"><span class="rz-linha-texto"><b>${escapar((r.clientes && r.clientes.nome) || "Cliente")}</b><small>${escapar([r.servicos && r.servicos.nome, dataCurta(new Date(r.inicio), fuso)].filter(Boolean).join(" · "))}</small></span></div>
          <button class="rz-botao rz-botao--pequeno" type="button" data-comecar="${escapar(r.id)}">Começar a entrega</button></li>`).join("")}</ul></section>` : ""}`;
    ligarChips(el.querySelector(".rz-chips"), v => { grupo = v; desenhar(); });
  };

  const carregar = async () => {
    const [entregas, feitas] = await Promise.all([
      banco.resultado(banco.tabela("entregas").select(COLUNAS).eq("conta_id", conta.conta_id).order("prazo")),
      banco.resultado(banco.tabela("reservas").select("id, cliente_id, inicio, situacao, clientes(id, nome, whatsapp), servicos(nome)").eq("conta_id", conta.conta_id).in("situacao", ["confirmada", "realizada"]).lt("inicio", new Date().toISOString()).order("inicio", { ascending: false }).limit(200)),
    ]);
    const comEntrega = new Set(entregas.map(e => e.reserva_id));
    return { entregas, semEntrega: feitas.filter(r => !comEntrega.has(r.id)) };
  };

  function abrirEntrega(e) {
    const numero = normalizarWhatsapp(e.clientes && e.clientes.whatsapp);
    const primeiro = String((e.clientes && e.clientes.nome) || "").split(/\s+/)[0];
    const msg = link => `Oi${primeiro ? `, ${primeiro}` : ""}! As suas fotos estão prontas: ${link}`;
    const j = abrirGaveta({
      foco: "fechar",
      titulo: (e.clientes && e.clientes.nome) || "Entrega",
      subtitulo: escapar([e.reservas && e.reservas.servicos && e.reservas.servicos.nome, e.reservas && `fotografado ${dataCurta(new Date(e.reservas.inicio), fuso)}`].filter(Boolean).join(" · ")),
      corpo: `<form class="rz-pilha" novalidate id="form-entrega">
          <div role="alert" hidden></div>
          <fieldset class="rz-campo"${edita ? "" : " disabled"}><legend class="rz-rotulo">Em que pé está</legend>
            <div class="rz-chips rz-chips--quebra" role="radiogroup" aria-label="Em que pé está">${Object.entries(ENTREGAS).map(([id, s]) => `<label class="rz-chip"><input type="radio" name="situacao" value="${id}"${e.situacao === id ? " checked" : ""}>${escapar(s.nome)}</label>`).join("")}</div></fieldset>
          ${campoTexto({ id: "ent-prazo", nome: "prazo", rotulo: "Prazo da entrega", tipo: "date", valor: e.prazo || "", extra: edita ? {} : { disabled: true } })}
          ${campoTexto({ id: "ent-link", nome: "link_galeria", rotulo: "Link da galeria", tipo: "url", teclado: "url", opcional: true, valor: e.link_galeria || "", placeholder: "https://…", ajuda: "O painel não guarda as fotos: só o link de onde elas estão.", extra: edita ? { autocapitalize: "none", spellcheck: "false" } : { disabled: true } })}
          ${numero && e.link_galeria ? `<a class="rz-botao" href="${escapar(linkWhatsapp(numero, msg(e.link_galeria)))}" target="_blank" rel="noopener">${icone("whatsapp")}Mandar o link no WhatsApp</a>` : ""}
        </form>`,
      rodape: edita ? `<button class="rz-botao" type="button" data-fechar>Fechar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-entrega">Salvar</button>` : "",
    });
    const form = j.el.querySelector("form");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      const link = String(d.link_galeria || "").trim();
      const problema = link && !/^https:\/\/\S+$/.test(link) ? "Use o endereço completo, começando com https://"
        : !link && d.situacao === "entregue" ? "Para marcar como entregue, cole o link da galeria." : "";
      erroNoCampo(form.link_galeria, problema);
      if (problema) return form.link_galeria.focus();
      const antes = { situacao: e.situacao, prazo: e.prazo, link_galeria: e.link_galeria, entregue_em: e.entregue_em };
      const mudar = { situacao: d.situacao, prazo: d.prazo || null, link_galeria: link || null, entregue_em: d.situacao === "entregue" ? (e.entregue_em || hoje) : null };
      const botao = j.el.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        await banco.resultado(banco.tabela("entregas").update(mudar).eq("id", e.id));
        Object.assign(e, mudar);
        j.fechar();
        desenhar();
        avisar(`${(e.clientes && e.clientes.nome) || "Entrega"}: ${ENTREGAS[e.situacao].nome.toLowerCase()}.`, {
          desfazer: async () => {
            try { await banco.resultado(banco.tabela("entregas").update(antes).eq("id", e.id)); Object.assign(e, antes); desenhar(); }
            catch (erro) { avisar(erro.message, { tipo: "erro" }); }
          },
        });
        if (mudar.situacao === "entregue" && numero && antes.situacao !== "entregue") abrirEntrega(e); // já com o botão do WhatsApp
      } catch (erro) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), erro.message);
      }
    });
  }

  el.addEventListener("click", async ev => {
    const b = ev.target.closest("[data-entrega]");
    if (b) { const e = dados.entregas.find(x => x.id === b.dataset.entrega); if (e) abrirEntrega(e); return; }
    const c = ev.target.closest("[data-comecar]");
    if (c && edita) {
      const r = dados.semEntrega.find(x => x.id === c.dataset.comecar);
      if (!r) return;
      ocupado(c, true, "Começando…");
      try {
        const nova = await banco.resultado(banco.tabela("entregas").insert({ conta_id: conta.conta_id, reserva_id: r.id, cliente_id: r.cliente_id, situacao: "escolhendo", prazo: somarDias(hoje, PRAZO_PADRAO) }).select(COLUNAS).single());
        dados.entregas.push(nova);
        dados.semEntrega = dados.semEntrega.filter(x => x !== r);
        grupo = "andamento";
        desenhar();
        avisar(`Entrega de ${(r.clientes && r.clientes.nome) || "cliente"} começou: prazo ${dataCurta(instanteNoFuso(nova.prazo, "12:00", fuso), fuso)}.`);
      } catch (erro) { ocupado(c, false); avisar(erro.message, { tipo: "erro" }); }
    }
  });

  await comEstados(el, { carregar, desenhar: d => { dados = d; desenhar(); } });
  if (abrirId) { const e = dados.entregas.find(x => x.id === abrirId); if (e) abrirEntrega(e); }
}
