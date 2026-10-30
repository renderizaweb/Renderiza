// Módulo Início (Missão 3, bloco F; 09): começa por "Para fazer agora" (o que pede ação, com o próximo passo na
// linha: "Responder", "Recebi", "Lembrar", "Ver"), depois os números de cada módulo, compactos, as próximas festas ou
// ensaios e "O que a equipe fez". Cada um vê só os módulos que pode (a RLS também filtra). Os primeiros passos
// (Missão 2) ficam no topo, só para o dono; "Exportar tudo" (src/telas/exportar.js), no fim, só para o dono.
// As regras sem tela: logica.js.

import { montarPrimeirosPassos } from "./primeiros-passos.js";
import { saudacao, paraFazerAgora, numeros, frase } from "./logica.js";
import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados } from "../../ui/estados.js";
import { dia, dataLonga, dataCurta, hora, haQuanto, partes, instanteNoFuso, somarDias, iniciais } from "../../ui/formatos.js";
import { resumo } from "../financeiro/logica.js";
import { COLUNAS_PARCELA, receber } from "../financeiro/parcela.js";
import { COLUNAS_CONTRATO, compartilhar } from "../contratos/contrato.js";
import { exportarTudo } from "../../telas/exportar.js";

const MAXIMO = 8;

export async function montar(el, contexto) {
  const { banco, conta, nicho, pode, avisar, navegar, pessoa } = contexto;
  const fuso = conta.fuso || undefined;
  const agora = new Date();
  const hoje = dia(agora, fuso);
  const ve = m => pode(m, "ver");
  let dados = null;
  let todos = false;
  const ctx = { banco, conta, nicho, pode, avisar, navegar, fuso, hoje, aoMudar: () => {}, recarregar: () => atualizar() };

  const nomeDaPessoa = String((pessoa && pessoa.nome) || "").trim().split(/\s+/)[0];
  el.innerHTML = `
    <header class="rz-cabeca"><div class="rz-cabeca-titulos">
      <h1 class="rz-titulo-1">${escapar(saudacao(partes(agora, fuso).hora))}${nomeDaPessoa ? `, ${escapar(nomeDaPessoa)}` : ""}</h1>
      <p class="rz-texto-2" data-dia>${escapar(dataLonga(agora, fuso).replace(/^./, l => l.toUpperCase()))}.</p></div></header>
    <div data-primeiros-passos></div>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");
  try {
    await montarPrimeirosPassos(el.querySelector("[data-primeiros-passos]"), contexto);
  } catch (e) {
    el.querySelector("[data-primeiros-passos]").innerHTML = ""; // os primeiros passos são ajuda: sem eles, o Início segue
  }

  const linhaDeFazer = it => {
    const acao = it.acao && it.acao.tipo === "recebi" && !pode("financeiro", "editar") ? { rotulo: "Ver", tipo: "ir" }
      : it.acao && it.acao.tipo === "lembrar" && !pode("contratos", "editar") ? { rotulo: "Ver", tipo: "ir" } : it.acao;
    return `<li class="rz-com-acao"><a class="rz-linha" href="${escapar(it.href)}">
        <span class="rz-tempo-icone rz-fazer-icone${it.tom ? ` rz-fazer-icone--${it.tom}` : ""}" aria-hidden="true">${icone(it.icone, { tamanho: 16 })}</span>
        <span class="rz-linha-texto">${it.valor ? `<b class="rz-titulo-valor"><span>${escapar(it.nome)}</span><span>· ${escapar(it.valor)}</span></b>` : `<b>${escapar(it.titulo)}</b>`}<small>${escapar(it.sub)}</small></span></a>
        ${acao ? `<button class="rz-botao rz-botao--pequeno" type="button" data-fazer="${escapar(it.id)}">${acao.tipo === "recebi" ? icone("ok", { tamanho: 16 }) : acao.tipo === "lembrar" ? icone("whatsapp", { tamanho: 16 }) : ""}${escapar(acao.rotulo)}</button>` : ""}</li>`;
  };

  function desenhar() {
    const { fazer, nums, proximas, atividades, clientes } = dados;
    const hojeNaAgenda = fazer.filter(i => i.tipo === "agenda" && i.sub.startsWith("Hoje")).length;
    el.querySelector("[data-dia]").textContent = `${dataLonga(agora, fuso).replace(/^./, l => l.toUpperCase())}. ${hojeNaAgenda ? `Hoje tem ${hojeNaAgenda} ${hojeNaAgenda === 1 ? "compromisso" : "compromissos"} na agenda.` : "Nada marcado para hoje."}`;
    const mostrar = todos ? fazer : fazer.slice(0, MAXIMO);
    corpo.innerHTML = `
      <section class="rz-secao" aria-labelledby="fazer-titulo">
        <div class="rz-secao-cabeca"><h2 class="rz-titulo-3" id="fazer-titulo">Para fazer agora</h2>${fazer.length ? `<span class="rz-texto-3">${fazer.length} ${fazer.length === 1 ? "item" : "itens"}</span>` : ""}</div>
        ${fazer.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-linhas--com-botao rz-cartao">${mostrar.map(linhaDeFazer).join("")}</ul>
          ${fazer.length > MAXIMO && !todos ? `<button class="rz-link" type="button" data-ver-todos>Ver mais ${fazer.length - MAXIMO}</button>` : ""}`
          : `<p class="rz-alerta rz-alerta--sucesso">${icone("okCirculo", { tamanho: 18 })}<span>Tudo em dia. Nada pede ação agora.</span></p>`}
      </section>
      ${nums.length ? `<section class="rz-secao" aria-label="Os números"><dl class="rz-funil rz-numeros">${nums.map(n => `<div${n.tom ? ` class="rz-numero--${n.tom}"` : ""}><dt><a class="rz-numero-link" href="${escapar(n.href)}">${escapar(n.rotulo)}</a></dt><dd>${escapar(n.valor)}</dd><small>${escapar(n.sub)}</small></div>`).join("")}</dl></section>` : ""}
      <div class="rz-inicio-colunas">
        <section class="rz-secao" aria-labelledby="proximas-titulo">
          <div class="rz-secao-cabeca"><h2 class="rz-titulo-3" id="proximas-titulo">Próxim${nicho.id === "eventos" ? "as" : "os"} ${escapar(nicho.palavras.reservas)}</h2><a class="rz-link" href="/agenda">Ver a agenda</a></div>
          ${proximas.length ? `<ul class="rz-linhas rz-cartao">${proximas.map(r => `<li><a class="rz-linha" href="/agenda?reserva=${escapar(r.id)}">
              <span class="rz-data-bloco" aria-hidden="true"><b>${escapar(String(partes(new Date(r.inicio), fuso).dia))}</b><small>${escapar(dataCurta(new Date(r.inicio), fuso).slice(0, 3))}</small></span>
              <span class="rz-linha-texto"><b>${escapar((r.clientes && r.clientes.nome) || r.titulo || "Cliente")}</b><small>${escapar([(r.tipos_reserva && r.tipos_reserva.nome) || (r.servicos && r.servicos.nome), `${dataCurta(new Date(r.inicio), fuso)}, ${hora(new Date(r.inicio), fuso)}`, r.situacao === "pre_reserva" ? "pré-reserva" : ""].filter(Boolean).join(" · "))}</small></span></a></li>`).join("")}</ul>`
            : `<p class="rz-texto-2">Nada marcado pela frente.</p>`}
        </section>
        <section class="rz-secao" aria-labelledby="equipe-titulo">
          <div class="rz-secao-cabeca"><h2 class="rz-titulo-3" id="equipe-titulo">O que a equipe fez</h2></div>
          ${atividades.length ? `<ol class="rz-tempo rz-cartao rz-cartao-corpo">${atividades.map(a => {
              const f = frase(a, { cliente: clientes[a.cliente_id] || "", pessoa: a.pessoas && a.pessoas.nome, nicho });
              return `<li><div class="rz-tempo-item">
                <span class="rz-tempo-icone" aria-hidden="true">${f.quem ? `<span class="rz-avatar rz-avatar--tempo">${escapar(iniciais(f.quem))}</span>` : icone("link", { tamanho: 16 })}</span>
                <span class="rz-linha-texto"><b>${f.quem ? `${escapar(f.quem)} ` : ""}<span class="rz-peso-normal">${escapar(f.texto)}</span></b><small>${escapar(haQuanto(new Date(a.quando)))}</small></span></div></li>`;
            }).join("")}</ol>`
            : `<p class="rz-texto-2">Quando alguém da equipe anotar um pedido, reservar uma data ou registrar um pagamento, aparece aqui.</p>`}
        </section>
      </div>
      ${conta.dono ? `<section class="rz-secao" aria-labelledby="dados-titulo">
          <h2 class="rz-titulo-3" id="dados-titulo">Seus dados</h2>
          <div class="rz-cartao rz-cartao-corpo rz-exportar">
            <p class="rz-texto-2">Uma planilha por assunto (clientes, pedidos, ${escapar(nicho.palavras.reservas)}, pagamentos, contratos…) num arquivo .zip. Abre no Excel e no Google Planilhas.</p>
            <button class="rz-botao" type="button" data-exportar>${icone("baixar", { tamanho: 18 })}Exportar tudo</button>
          </div>
        </section>` : ""}`;
  }

  const carregar = async () => {
    const amanhaFim = instanteNoFuso(somarDias(hoje, 2), "00:00", fuso).toISOString();
    const hojeIni = instanteNoFuso(hoje, "00:00", fuso).toISOString();
    const mesIni = instanteNoFuso(hoje.slice(0, 8) + "01", "00:00", fuso).toISOString();
    const [a, m] = hoje.split("-").map(Number);
    const mesFim = instanteNoFuso(`${m === 12 ? a + 1 : a}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`, "00:00", fuso).toISOString();
    const semana = new Date(agora.getTime() - 7 * 864e5).toISOString();
    const nada = Promise.resolve([]);
    const vazio = p => p.catch(() => []);
    const [pedidos, parcelas, contratos, reservasDoMes, reservasPerto, proximas, compromissos, atividades] = await Promise.all([
      ve("atendimento") ? vazio(banco.resultado(banco.tabela("pedidos").select("id, etapa, origem, criado_em, data_desejada, clientes(id, nome, whatsapp)").eq("conta_id", conta.conta_id).or(`etapa.eq.novo,criado_em.gte.${semana}`).limit(1000))) : nada,
      ve("financeiro") ? vazio(banco.resultado(banco.tabela("parcelas").select(COLUNAS_PARCELA).eq("conta_id", conta.conta_id).or(`pago_em.is.null,pago_em.gte.${hoje.slice(0, 8)}01`).limit(5000))) : nada,
      ve("contratos") ? vazio(banco.resultado(banco.tabela("contratos").select(COLUNAS_CONTRATO).eq("conta_id", conta.conta_id).or(`situacao.eq.enviado,aceito_em.gte.${mesIni}`).limit(1000))) : nada,
      vazio(banco.resultado(banco.tabela("reservas").select("id, inicio, situacao").eq("conta_id", conta.conta_id).gte("inicio", mesIni).lt("inicio", mesFim).limit(2000))),
      vazio(banco.resultado(banco.tabela("reservas").select("id, inicio, fim, titulo, situacao, clientes(id, nome), tipos_reserva(nome), servicos(nome)").eq("conta_id", conta.conta_id).gte("inicio", hojeIni).lt("inicio", amanhaFim).neq("situacao", "cancelada").order("inicio"))),
      vazio(banco.resultado(banco.tabela("reservas").select("id, inicio, fim, titulo, situacao, clientes(id, nome), tipos_reserva(nome), servicos(nome)").eq("conta_id", conta.conta_id).gte("fim", agora.toISOString()).neq("situacao", "cancelada").order("inicio").limit(5))),
      vazio(banco.resultado(banco.tabela("compromissos").select("id, tipo, titulo, inicio, clientes(id, nome)").eq("conta_id", conta.conta_id).gte("inicio", hojeIni).lt("inicio", amanhaFim).order("inicio"))),
      vazio(banco.resultado(banco.tabela("atividades").select("id, acao, tabela, cliente_id, reserva_id, modulo, mudou, detalhe, quando, pelo_suporte, pessoas(nome)").eq("conta_id", conta.conta_id).order("quando", { ascending: false }).limit(12))),
    ]);
    const ids = [...new Set(atividades.map(x => x.cliente_id).filter(Boolean))];
    const nomes = ids.length ? await vazio(banco.resultado(banco.tabela("clientes").select("id, nome").in("id", ids))) : [];
    return calcular({ pedidos, parcelas, contratos, reservasDoMes, reservasPerto, proximas, compromissos, atividades, semana, clientes: Object.fromEntries(nomes.map(c => [c.id, c.nome])) });
  };
  // "Para fazer agora" e os números saem do que veio; refeitos quando um "Recebi" muda uma parcela (e no desfazer)
  function calcular(d) {
    const c = { hoje, fuso, agora: agora.getTime(), nicho, pode: ve };
    d.fazer = paraFazerAgora({ pedidos: d.pedidos, parcelas: d.parcelas, contratos: d.contratos, reservas: d.reservasPerto, compromissos: d.compromissos }, c);
    d.nums = numeros({ reservasDoMes: d.reservasDoMes, pedidosDaSemana: d.pedidos.filter(p => p.criado_em >= d.semana), resumoFinanceiro: ve("financeiro") ? resumo(d.parcelas, hoje) : null, contratos: d.contratos }, c);
    return d;
  }
  async function atualizar() { try { dados = await carregar(); desenhar(); } catch (e) { avisar(e.message, { tipo: "erro" }); } }

  el.addEventListener("click", async e => {
    if (e.target.closest("[data-ver-todos]")) { todos = true; return desenhar(); }
    if (e.target.closest("[data-exportar]")) {
      const b = e.target.closest("[data-exportar]");
      b.disabled = true;
      try { await exportarTudo({ banco, conta, nicho, avisar }); } catch (er) { avisar(er.message, { tipo: "erro" }); } finally { b.disabled = false; }
      return;
    }
    const b = e.target.closest("[data-fazer]");
    if (!b || !dados) return;
    const it = dados.fazer.find(x => x.id === b.dataset.fazer);
    if (!it) return;
    if (it.acao && it.acao.tipo === "recebi" && pode("financeiro", "editar")) {
      const p = dados.parcelas.find(x => x.id === it.acao.id);
      if (p) return receber(p, { ...ctx, aoMudar: () => { calcular(dados); desenhar(); } });
    }
    if (it.acao && it.acao.tipo === "lembrar" && pode("contratos", "editar")) {
      const c = dados.contratos.find(x => x.id === it.acao.id);
      if (c) return compartilhar(c, ctx, { lembrete: true });
    }
    navegar(it.href);
  });

  await comEstados(corpo, { carregar, desenhar: d => { dados = d; desenhar(); }, linhas: 5 });
}
