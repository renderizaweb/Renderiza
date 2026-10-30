// Admin · Pagamentos (Missão 5A; 02): a mensalidade por Pix, registrada à mão. O mês (com as setas para os outros),
// quem pagou e quem não pagou, o valor que o plano sugere e "Registrar Pix" na linha. Contas em teste não pagam ainda.

import { icone } from "../../ui/icones.js";
import { escapar } from "../../ui/formulario.js";
import { comEstados } from "../../ui/estados.js";
import { dia, moeda, dataNumerica } from "../../ui/formatos.js";
import { carregarContas } from "../dados.js";
import { pagamentosDoMes, mensalidadeSugerida, mesDe, somarMeses, nomeDoMes } from "../logica.js";
import { abrirPagamento } from "./pagamento.js";

export async function montar(el, contexto) {
  const { banco, avisar } = contexto;
  let mes = mesDe(dia(new Date()));
  let dados = null;
  const ctx = { ...contexto, recarregar: () => atualizar() };
  el.innerHTML = `
    <header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Pagamentos</h1>
      <p class="rz-texto-2">O Pix de cada mês, registrado à mão: quem pagou e quem não pagou. Quem não paga, a Renderiza desliga em Contas.</p></div></header>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const carregar = async () => {
    const [base, pagamentos] = await Promise.all([
      carregarContas(banco),
      banco.resultado(banco.tabela("pagamentos").select("id, conta_id, mes, valor, pago_em, observacao").order("pago_em", { ascending: false }).limit(5000)),
    ]);
    return { ...base, pagamentos };
  };
  async function atualizar() { try { dados = await carregar(); desenhar(); } catch (e) { avisar(e.message, { tipo: "erro" }); } }

  function desenhar() {
    const linhas = pagamentosDoMes(dados.contas, dados.pagamentos, mes);
    const pagaram = linhas.filter(l => l.pago > 0);
    const total = pagaram.reduce((t, l) => t + l.pago, 0);
    corpo.innerHTML = `
      <div class="rz-mes-navegar">
        <button class="rz-botao rz-botao--fantasma" type="button" data-mes="-1" aria-label="Mês anterior">${icone("voltar")}</button>
        <h2 class="rz-titulo-2">${escapar(nomeDoMes(mes).replace(/^./, l => l.toUpperCase()))}</h2>
        <button class="rz-botao rz-botao--fantasma" type="button" data-mes="1" aria-label="Próximo mês">${icone("seta")}</button>
      </div>
      <dl class="rz-funil rz-numeros">
        <div><dt>Pagaram</dt><dd>${pagaram.length}</dd><small>${escapar(moeda(total, { centavos: true }))}</small></div>
        <div${linhas.length - pagaram.length ? ' class="rz-numero--atencao"' : ""}><dt>Faltam</dt><dd>${linhas.length - pagaram.length}</dd><small>de ${linhas.length} ${linhas.length === 1 ? "conta ativa" : "contas ativas"}</small></div>
      </dl>
      ${linhas.length ? `<ul class="rz-linhas rz-linhas--pedidos rz-linhas--com-botao rz-cartao">${linhas.map(l => {
          const c = l.conta;
          const esperado = mensalidadeSugerida(c.ligados, dados.catalogo);
          const sub = l.pago > 0 ? l.pagamentos.map(p => `${moeda(p.valor, { centavos: true })} em ${dataNumerica(new Date(p.pago_em + "T12:00:00Z"))}`).join(" + ") : `pelo plano: ${moeda(esperado, { centavos: true })} (${c.ligados.length} módulos)`;
          return `<li class="rz-com-acao"><a class="rz-linha" href="/admin/contas?conta=${escapar(c.id)}">
              <span class="rz-linha-texto"><b>${escapar(c.nome)}</b><small>${escapar(sub)}</small></span>
              <span class="rz-linha-fim"><span class="rz-etiqueta ${l.pago > 0 ? "rz-etiqueta--sucesso" : "rz-etiqueta--alerta"}">${l.pago > 0 ? "Pago" : "Falta"}</span></span></a>
            ${l.pago > 0 ? "" : `<button class="rz-botao rz-botao--pequeno" type="button" data-pagar="${escapar(c.id)}">${icone("ok", { tamanho: 16 })}Registrar Pix</button>`}</li>`;
        }).join("")}</ul>` : `<p class="rz-estado-curto">Nenhuma conta ativa neste mês.</p>`}`;
  }

  el.addEventListener("click", e => {
    const m = e.target.closest("[data-mes]");
    if (m) { mes = somarMeses(mes, Number(m.dataset.mes)); return desenhar(); }
    const p = e.target.closest("[data-pagar]");
    if (p) { const c = dados.contas.find(x => x.id === p.dataset.pagar); if (c) abrirPagamento(c, { ...ctx, catalogo: dados.catalogo }, { mes }); }
  });

  await comEstados(corpo, { carregar, desenhar: d => { dados = d; desenhar(); }, linhas: 6 });
}
