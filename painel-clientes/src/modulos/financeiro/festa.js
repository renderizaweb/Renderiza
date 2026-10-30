// Financeiro (Missão 3, bloco D): a festa (ou o ensaio) vista pelo dinheiro. Os valores (reservas_valores: total,
// sinal, desconto; só Financeiro e Contratos veem, 05), quanto entrou e quanto falta, as parcelas dela e "Lançar
// parcelas" (05: "na reserva, Lançar parcelas"): o sinal e o resto em vezes, com a prévia antes de gravar.

import { abrirGaveta } from "../../ui/gaveta.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { campoTexto, lerFormulario } from "../../ui/campos.js";
import { moeda, lerValor, dataCurta, instanteNoFuso, somarDias, dataLonga } from "../../ui/formatos.js";
import { planoDeParcelas, textoDoVencimento } from "./logica.js";
import { COLUNAS_PARCELA, etiquetaDaParcela, abrirParcela, receber, abrirFormParcela } from "./parcela.js";

const valorDoCampo = v => (v == null ? "" : String(v).replace(".", ","));

export async function abrirFesta(reservaId, ctx) {
  const { banco, conta, pode, nicho, avisar, fuso, hoje } = ctx;
  const edita = pode("financeiro", "editar") || pode("contratos", "editar");
  const editaParcelas = pode("financeiro", "editar");
  const [r, valores, parcelas] = await Promise.all([
    banco.resultado(banco.tabela("reservas").select("id, cliente_id, inicio, titulo, situacao, clientes(id, nome, whatsapp), tipos_reserva(nome), servicos(nome, valor, sinal)").eq("id", reservaId).maybeSingle()),
    banco.resultado(banco.tabela("reservas_valores").select("valor_total, sinal, desconto").eq("reserva_id", reservaId).maybeSingle()).catch(() => null),
    banco.resultado(banco.tabela("parcelas").select(COLUNAS_PARCELA).eq("reserva_id", reservaId).order("vence_em")).catch(() => []),
  ]);
  if (!r) return avisar("Essa reserva não foi encontrada.", { tipo: "erro" });
  const ctxFesta = { ...ctx, aoMudar: () => { desenhar(); ctx.aoMudar(); }, recarregar: () => { ctx.recarregar(); j.fechar(); abrirFesta(reservaId, ctx); } };
  // sugestão: o valor do pacote ou ensaio (Serviços), quando a reserva ainda não tem valor
  const sugerido = !valores && r.servicos ? { valor_total: r.servicos.valor, sinal: r.servicos.sinal, desconto: null } : null;
  const v = valores || sugerido || { valor_total: null, sinal: null, desconto: null };
  const nome = r.titulo || (r.clientes && r.clientes.nome) || "Reserva";

  const j = abrirGaveta({
    foco: "fechar",
    titulo: nome,
    subtitulo: escapar([(r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome), dataLonga(new Date(r.inicio), fuso)].filter(Boolean).join(" · ")),
    corpo: `<div class="rz-pilha" data-festa></div>`,
    rodape: editaParcelas ? `<button class="rz-botao" type="button" data-nova-parcela>${icone("adicionar")}Parcela avulsa</button>` : "",
  });
  const el = j.el.querySelector("[data-festa]");

  function desenhar() {
    const total = Number(v.valor_total || 0) - Number(v.desconto || 0);
    const recebido = parcelas.filter(p => p.pago_em).reduce((t, p) => t + Number(p.valor), 0);
    const lancado = parcelas.reduce((t, p) => t + Number(p.valor), 0);
    el.innerHTML = `
      <form class="rz-pilha" novalidate data-valores>
        <div role="alert" hidden></div>
        ${sugerido ? `<p class="rz-alerta rz-alerta--info">${icone("estrela", { tamanho: 18 })}<span>Sugerido pelo valor ${nicho.id === "eventos" ? "do pacote" : "do ensaio"} em Serviços. Confira e salve.</span></p>` : ""}
        <div class="rz-campos rz-campos--tres">
          ${campoTexto({ id: "fv-total", nome: "valor_total", rotulo: "Valor total", teclado: "decimal", valor: valorDoCampo(v.valor_total), extra: edita ? {} : { disabled: true } })}
          ${campoTexto({ id: "fv-sinal", nome: "sinal", rotulo: "Sinal", teclado: "decimal", opcional: true, valor: valorDoCampo(v.sinal), extra: edita ? {} : { disabled: true } })}
          ${campoTexto({ id: "fv-desc", nome: "desconto", rotulo: "Desconto", teclado: "decimal", opcional: true, valor: valorDoCampo(v.desconto), extra: edita ? {} : { disabled: true } })}
        </div>
        ${edita ? `<button class="rz-botao" type="submit">Salvar os valores</button>` : ""}
      </form>
      ${v.valor_total != null ? `<dl class="rz-funil">
        <div><dt>Total</dt><dd>${escapar(moeda(total))}</dd></div>
        <div><dt>Recebido</dt><dd>${escapar(moeda(recebido))}</dd><small>${total ? Math.round((recebido / total) * 100) : 0}%</small></div>
        <div><dt>Falta</dt><dd>${escapar(moeda(Math.max(0, total - recebido)))}</dd>${lancado < total - 0.009 ? `<small>${escapar(moeda(total - lancado))} sem parcela</small>` : ""}</div>
      </dl>` : ""}
      <section><div class="rz-secao-cabeca"><h3 class="rz-titulo-3">Parcelas</h3>${editaParcelas && v.valor_total != null && lancado < total - 0.009 ? `<button class="rz-botao rz-botao--primario rz-botao--pequeno" type="button" data-lancar>Lançar parcelas</button>` : ""}</div>
        ${parcelas.length ? `<ul class="rz-linhas">${parcelas.map(p => `<li class="rz-com-acao"><button class="rz-linha" type="button" data-parcela="${escapar(p.id)}">
            <span class="rz-linha-texto"><b>${escapar(p.descricao)} · ${escapar(moeda(p.valor))}</b><small>${escapar(textoDoVencimento(p, hoje, fuso))}</small></span>
            <span class="rz-linha-fim">${etiquetaDaParcela(p, hoje)}</span></button>
            ${editaParcelas && !p.pago_em ? `<button class="rz-botao rz-botao--pequeno" type="button" data-recebi="${escapar(p.id)}">Recebi</button>` : ""}</li>`).join("")}</ul>`
          : `<p class="rz-texto-2">${v.valor_total == null ? "Ponha o valor total para lançar as parcelas." : "Nenhuma parcela ainda."}</p>`}
      </section>`;
    const form = el.querySelector("[data-valores]");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      const novo = { valor_total: lerValor(d.valor_total), sinal: d.sinal ? lerValor(d.sinal) : null, desconto: d.desconto ? lerValor(d.desconto) : null };
      erroNoCampo(form.valor_total, novo.valor_total >= 0 && d.valor_total ? "" : "Digite o valor total.");
      if (!(novo.valor_total >= 0) || !d.valor_total) return;
      const botao = form.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        await banco.resultado(banco.tabela("reservas_valores").upsert({ reserva_id: r.id, conta_id: conta.conta_id, ...novo }));
        Object.assign(v, novo);
        avisar(`Valores de ${nome}: salvos.`);
        desenhar();
      } catch (e) { ocupado(botao, false); avisoDoFormulario(form.querySelector("[role=alert]"), e.message); }
    });
    el.querySelector("[data-lancar]")?.addEventListener("click", () => lancar(total - lancado));
  }

  function lancar(restante) {
    const temSinal = Number(v.sinal || 0) > 0 && !parcelas.some(p => /sinal/i.test(p.descricao));
    el.innerHTML = `<form class="rz-pilha" novalidate data-lancar-form>
        <p class="rz-texto-2">Faltam <b>${escapar(moeda(restante))}</b> em parcelas.${temSinal ? ` O sinal de ${escapar(moeda(v.sinal))} entra primeiro.` : ""}</p>
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "lc-vezes", nome: "vezes", rotulo: temSinal ? "O resto em quantas vezes" : "Em quantas vezes", teclado: "numeric", valor: "3" })}
          ${campoTexto({ id: "lc-primeira", nome: "primeira", rotulo: "Primeira parcela", tipo: "date", valor: somarDias(hoje, 30) })}
        </div>
        ${temSinal ? campoTexto({ id: "lc-sinal", nome: "vencimentoDoSinal", rotulo: "O sinal vence em", tipo: "date", valor: hoje }) : ""}
        <div data-previa></div>
        <div class="rz-acoes-ficha"><button class="rz-botao" type="button" data-voltar-valores>Voltar</button><button class="rz-botao rz-botao--primario" type="submit">Lançar</button></div>
      </form>`;
    const form = el.querySelector("form");
    const plano = () => {
      const d = lerFormulario(form);
      return planoDeParcelas({ total: restante, sinal: temSinal ? v.sinal : 0, vezes: d.vezes, primeira: d.primeira || somarDias(hoje, 30), vencimentoDoSinal: temSinal ? d.vencimentoDoSinal || hoje : null });
    };
    const previa = () => {
      el.querySelector("[data-previa]").innerHTML = `<ul class="rz-linhas rz-cartao">${plano().map(l => `<li><div class="rz-linha rz-linha--fixa"><span class="rz-linha-texto"><b>${escapar(l.descricao)} · ${escapar(moeda(l.valor))}</b><small>vence ${escapar(dataCurta(instanteNoFuso(l.vence_em, "12:00", fuso), fuso))}</small></span></div></li>`).join("")}</ul>`;
    };
    previa();
    form.addEventListener("input", previa);
    el.querySelector("[data-voltar-valores]").addEventListener("click", desenhar);
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const linhas = plano();
      if (!linhas.length) return;
      const botao = form.querySelector("[type=submit]");
      ocupado(botao, true, "Lançando…");
      try {
        const novas = await banco.resultado(banco.tabela("parcelas").insert(linhas.map(l => ({ ...l, conta_id: conta.conta_id, cliente_id: r.cliente_id, reserva_id: r.id }))).select(COLUNAS_PARCELA));
        parcelas.push(...novas);
        parcelas.sort((a, b) => a.vence_em.localeCompare(b.vence_em));
        avisar(`${novas.length} ${novas.length === 1 ? "parcela lançada" : "parcelas lançadas"} para ${nome}.`);
        ctx.recarregar();
        desenhar();
      } catch (e) { ocupado(botao, false); avisar(e.message, { tipo: "erro" }); }
    });
  }

  el.addEventListener("click", e => {
    const rec = e.target.closest("[data-recebi]");
    if (rec) { const p = parcelas.find(x => x.id === rec.dataset.recebi); if (p) receber(p, ctxFesta); return; }
    const b = e.target.closest("[data-parcela]");
    if (b) { const p = parcelas.find(x => x.id === b.dataset.parcela); if (p) { j.fechar(); abrirParcela(p, ctx); } }
  });
  j.el.querySelector("[data-nova-parcela]")?.addEventListener("click", () => { j.fechar(); abrirFormParcela(ctx, { cliente: r.clientes, reserva: r.id }); });
  desenhar();
  return j;
}
