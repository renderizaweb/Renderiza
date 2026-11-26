// Assinatura (base, só o dono; 13-assinatura.md, 26/11/2026): o plano do Painel Renderiza, a próxima mensalidade, o
// extrato dos pagamentos e como funciona (os termos, cláusulas 6 a 8, em linguagem simples). A mensalidade é por Pix,
// por fora: a Renderiza registra cada pagamento no Admin e ele aparece aqui. Lê por minha_assinatura (sem a
// observação interna do pagamento); mudar o plano é pelo WhatsApp da Renderiza.

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { dia, dataNumerica, moeda } from "../../ui/formatos.js";
import { comEstados } from "../../ui/estados.js";
import { nicho as nichoDe } from "../../nichos/index.js";
import { linkDaRenderiza } from "../../telas/renderiza.js";
import { INCLUIDOS } from "../../admin/logica.js";
import { valorDoMes, diaDoVencimento, situacaoDaAssinatura, extrato, nomeDoMes } from "./logica.js";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
/** "26 de dezembro" (e o ano, quando não é o de hoje) de um "aaaa-mm-dd". */
const porExtenso = (d, hoje) => `${Number(d.slice(8, 10))} de ${MESES[Number(d.slice(5, 7)) - 1]}${d.slice(0, 4) !== hoje.slice(0, 4) ? ` de ${d.slice(0, 4)}` : ""}`;
const numerica = d => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
const mesCurto = m => nomeDoMes(m).replace(/^./, x => x.toUpperCase());
const emDias = n => (n === 1 ? "amanhã" : `em ${n} dias`);

export async function montar(el, { banco, conta }) {
  const n = nichoDe(conta.nicho);
  el.innerHTML = `<header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Assinatura</h1>
      <p class="rz-texto-2">O seu plano do Painel Renderiza, a próxima mensalidade e os pagamentos.</p></div></header><div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");
  const hoje = dia(new Date(), conta.fuso || undefined);

  const carregar = async () => {
    const [a, catalogo] = await Promise.all([
      banco.rpc("minha_assinatura", { p_conta: conta.conta_id }),
      banco.resultado(banco.tabela("modulos").select("id, nome, preco")).catch(() => []),
    ]);
    return { a: a || { pagamentos: [] }, catalogo: catalogo || [] };
  };

  const desenhar = ({ a, catalogo }) => {
    const modulos = conta.modulos || [];
    const valor = valorDoMes(a, modulos, catalogo);
    const valorTexto = moeda(valor, { centavos: true });
    const d = diaDoVencimento(a);
    const s = situacaoDaAssinatura(a, a.pagamentos || [], hoje);
    const linhas = extrato(a, a.pagamentos || [], hoje).slice(0, 24);
    const nomeDe = id => (n.modulos[id] && n.modulos[id].nome) || ((catalogo.find(m => m.id === id) || {}).nome) || id;
    const doPlano = modulos.filter(m => !INCLUIDOS.includes(m)).map(nomeDe);
    const incluidos = modulos.filter(m => INCLUIDOS.includes(m)).map(nomeDe);
    const contaParada = conta.situacao === "desligada" || conta.situacao === "cancelada";
    const mensagem = texto => linkDaRenderiza(`Oi! ${texto} (Painel de ${conta.nome})`);

    // o cartão de cima: como está hoje, em uma frase
    const topo = (() => {
      if (contaParada) return { tom: "perigo", icone: "alerta", titulo: conta.situacao === "cancelada" ? "A assinatura foi cancelada" : "A conta está desligada",
        texto: conta.situacao === "cancelada" ? "Para voltar, fale com a gente: os dados ficam guardados por 90 dias depois do cancelamento." : "Nada foi apagado. Pagou, a Renderiza religa e tudo volta como estava.",
        botao: ["Falar com a Renderiza", mensagem("Quero religar a conta.")] };
      if (conta.situacao === "teste") return { tom: "destaque", icone: "relogio", titulo: `Teste grátis até ${escapar(dataNumerica(conta.teste_ate))}`,
        texto: `Depois, ${escapar(valorTexto)} por mês, sem fidelidade.`, botao: ["Fechar o plano", mensagem("Quero fechar o plano.")] };
      switch (s.estado) {
        case "a-combinar": return { tom: "info", icone: "carteira", titulo: `${escapar(valorTexto)} por mês`,
          texto: "O dia do vencimento ainda vai ser combinado com a Renderiza.", botao: ["Combinar o dia", mensagem("Quero combinar o dia da mensalidade.")] };
        case "comeca": return { tom: "info", icone: "carteira", titulo: `A primeira mensalidade vence ${s.dias <= 5 ? emDias(s.dias) : `em ${escapar(porExtenso(s.vencimento, hoje))}`}`,
          texto: `${escapar(valorTexto)} por Pix, no dia ${escapar(numerica(s.vencimento))}. Depois, todo dia ${d}.`, botao: s.dias <= 5 ? ["Pedir o Pix", mensagem(`Quero pagar a mensalidade de ${nomeDoMes(s.mes)}.`)] : null };
        case "em-dia": return { tom: "sucesso", icone: "ok", titulo: "Tudo em dia",
          texto: s.vencimento ? `A próxima mensalidade vence em ${escapar(porExtenso(s.vencimento, hoje))}: ${escapar(valorTexto)} por Pix.` : "Nenhuma mensalidade em aberto.", botao: null };
        case "vence-logo": return { tom: "alerta", icone: "relogio", titulo: `A mensalidade vence ${emDias(s.dias)}`,
          texto: `${escapar(valorTexto)} por Pix, no dia ${escapar(numerica(s.vencimento))}.`, botao: ["Pedir o Pix", mensagem(`Quero pagar a mensalidade de ${nomeDoMes(s.mes)}.`)] };
        case "vence-hoje": return { tom: "alerta", icone: "relogio", titulo: "A mensalidade vence hoje",
          texto: `${escapar(valorTexto)} por Pix.`, botao: ["Pedir o Pix", mensagem(`Quero pagar a mensalidade de ${nomeDoMes(s.mes)}.`)] };
        default: return { tom: "perigo", icone: "alerta", titulo: s.meses > 1 ? `${s.meses} mensalidades em aberto` : `A mensalidade de ${escapar(nomeDoMes(s.mes).split(" de ")[0])} está em aberto`,
          texto: `Venceu em ${escapar(numerica(s.vencimento))} (há ${s.dias} ${s.dias === 1 ? "dia" : "dias"}). Já pagou? A Renderiza registra e some daqui.`, botao: ["Falar sobre o pagamento", mensagem(`Sobre a mensalidade de ${nomeDoMes(s.mes)}.`)] };
      }
    })();

    const etiqueta = l => l.estado === "pago" ? `<span class="rz-etiqueta rz-etiqueta--sucesso">${icone("ok", { tamanho: 14 })}Pago</span>`
      : l.estado === "em-aberto" ? `<span class="rz-etiqueta rz-etiqueta--perigo">Em aberto</span>`
        : l.estado === "vence-hoje" ? `<span class="rz-etiqueta rz-etiqueta--alerta">Vence hoje</span>`
          : `<span class="rz-etiqueta">A vencer</span>`;
    const detalhe = l => {
      if (l.estado === "pago") {
        const total = l.pagamentos.reduce((t, p) => t + p.valor, 0);
        const quando = l.pagamentos.map(p => p.pago_em).filter(Boolean).sort().pop();
        return `${moeda(total, { centavos: true })}${quando ? ` · pago em ${numerica(quando)}` : ""}`;
      }
      return `${valorTexto} · vence em ${numerica(l.vencimento)}`;
    };

    corpo.innerHTML = `
      <section class="rz-secao">
        <div class="rz-cartao rz-assinatura-topo rz-assinatura-topo--${topo.tom}">
          <span class="rz-assinatura-icone" aria-hidden="true">${icone(topo.icone, { tamanho: 22 })}</span>
          <div class="rz-pilha-p">
            <h2 class="rz-titulo-2">${topo.titulo}</h2>
            <p class="rz-texto-2">${topo.texto}</p>
            ${topo.botao ? `<div><a class="rz-botao rz-botao--primario" href="${escapar(topo.botao[1])}" target="_blank" rel="noopener">${icone("whatsapp", { tamanho: 18 })}${escapar(topo.botao[0])}</a></div>` : ""}
          </div>
        </div>
      </section>

      <section class="rz-secao">
        <h2 class="rz-titulo-3">O seu plano</h2>
        <dl class="rz-cartao rz-cartao-corpo rz-fatos rz-assinatura-plano">
          <div><dt>Valor</dt><dd>${escapar(valorTexto)} por mês</dd></div>
          <div><dt>Vencimento</dt><dd>${d ? `Todo dia ${d}` : "A combinar"}</dd></div>
          <div><dt>Forma de pagamento</dt><dd>Pix</dd></div>
          <div><dt>Módulos</dt><dd>${escapar(doPlano.join(", ") || "nenhum")}${incluidos.length ? `<br><small class="rz-texto-3">${escapar(incluidos.join(", "))}: ${incluidos.length > 1 ? "incluídos" : "incluído"} em todo plano</small>` : ""}</dd></div>
          <div><dt>Pessoas</dt><dd>até 5 no plano</dd></div>
          <div><dt>Fidelidade</dt><dd>Nenhuma: renova todo mês</dd></div>
          ${conta.ativa_ate ? `<div><dt>Prazo combinado</dt><dd>até ${escapar(numerica(String(conta.ativa_ate)))}</dd></div>` : ""}
        </dl>
        <p class="rz-texto-3">Para mudar os módulos ou o plano, <a href="${escapar(mensagem("Quero mudar o plano."))}" target="_blank" rel="noopener">fale com a gente</a>. O valor novo vale a partir da mensalidade seguinte.</p>
      </section>

      <section class="rz-secao">
        <h2 class="rz-titulo-3">Pagamentos</h2>
        ${linhas.length ? `<ul class="rz-cartao rz-linhas">${linhas.map(l => `<li><div class="rz-linha rz-linha--fixa">
            <span class="rz-linha-texto"><b>${escapar(mesCurto(l.mes))}</b><small>${escapar(detalhe(l))}</small></span>
            <span class="rz-linha-fim">${etiqueta(l)}</span></div></li>`).join("")}</ul>
          <p class="rz-texto-3">Pagou? A Renderiza registra o Pix e ele aparece aqui como pago.</p>`
          : `<p class="rz-cartao rz-cartao-corpo rz-texto-2">Nenhum pagamento ainda.</p>`}
      </section>

      <section class="rz-secao">
        <h2 class="rz-titulo-3">Como funciona</h2>
        <ul class="rz-cartao rz-cartao-corpo rz-assinatura-regras">
          <li>${icone("relogio", { tamanho: 18 })}<span><b>Mensal, sem fidelidade.</b> A assinatura renova sozinha todo mês${d ? `, no dia ${d}` : ""}, enquanto você quiser.</span></li>
          <li>${icone("carteira", { tamanho: 18 })}<span><b>Por Pix.</b> Você paga na data, e a Renderiza registra o pagamento aqui.</span></li>
          <li>${icone("alerta", { tamanho: 18 })}<span><b>Se atrasar.</b> A gente avisa. Com 10 dias de atraso depois do aviso, a conta pode ser desligada até o pagamento. Nada é apagado: pagou, volta tudo como estava.</span></li>
          <li>${icone("trocar", { tamanho: 18 })}<span><b>Mudar o plano.</b> Ligar ou desligar um módulo muda o valor a partir da mensalidade seguinte.</span></li>
          <li>${icone("sair", { tamanho: 18 })}<span><b>Cancelar.</b> Pelo WhatsApp, quando quiser. Vale no fim do mês já pago, e você leva os seus dados numa planilha.</span></li>
        </ul>
        <p class="rz-texto-3">Tudo isso está nos <a href="/termos/#preco" target="_blank" rel="noopener">Termos de uso</a> (cláusulas 6 a 8).</p>
      </section>`;
  };

  comEstados(corpo, { carregar, desenhar });
}
