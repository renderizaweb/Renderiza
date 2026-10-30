// Admin · Módulos (Missão 5A; 02): o catálogo (o mesmo para todas as contas), o preço, quantas contas usam cada um
// e o "só pago" (bloqueado no teste: o que custa caro oferecer de graça). Ligar e desligar o módulo de uma conta é na
// gaveta da conta (Contas).

import { escapar } from "../../ui/formulario.js";
import { comEstados } from "../../ui/estados.js";
import { interruptor } from "../../ui/campos.js";
import { moeda } from "../../ui/formatos.js";
import { carregarContas } from "../dados.js";
import { PLANO } from "../logica.js";

export async function montar(el, { banco, avisar }) {
  el.innerHTML = `
    <header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Módulos</h1>
      <p class="rz-texto-2">O plano: ${escapar(moeda(PLANO.valor))} por mês com ${PLANO.modulosInclusos} módulos; cada um a mais pelo preço dele. Ligar e desligar numa conta é na gaveta da conta.</p></div></header>
    <div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const desenhar = ({ contas, catalogo }) => {
    const usando = contas.filter(c => c.situacao === "ativa" || c.situacao === "teste");
    corpo.innerHTML = `<form class="rz-cartao rz-cartao-corpo rz-pilha" data-catalogo>
        ${catalogo.map(m => {
          const n = usando.filter(c => c.ligados.includes(m.id)).length;
          return `<div class="rz-admin-modulo">
              <div class="rz-linha-texto"><b>${escapar(m.nome)} · ${escapar(moeda(Number(m.preco), { centavos: true }))}</b><small>${n} de ${usando.length} ${usando.length === 1 ? "conta" : "contas"} em uso</small>
                <span class="rz-progresso" aria-hidden="true"><span style="width:${usando.length ? Math.round((n / usando.length) * 100) : 0}%"></span></span></div>
              ${interruptor({ nome: m.id, rotulo: "Liberado no teste", ajuda: m.liberado_no_teste ? "" : "só pago", marcado: m.liberado_no_teste })}
            </div>`;
        }).join("")}
      </form>`;
    corpo.querySelector("[data-catalogo]").addEventListener("change", async ev => {
      const caixa = ev.target.closest("input[type=checkbox]");
      if (!caixa) return;
      caixa.disabled = true;
      try {
        await banco.resultado(banco.tabela("modulos").update({ liberado_no_teste: caixa.checked }).eq("id", caixa.name));
        const m = catalogo.find(x => x.id === caixa.name);
        m.liberado_no_teste = caixa.checked;
        avisar(`${m.nome}: ${caixa.checked ? "liberado no teste" : "só pago (bloqueado no teste)"}.`);
        desenhar({ contas, catalogo });
      } catch (e) { caixa.checked = !caixa.checked; caixa.disabled = false; avisar(e.message, { tipo: "erro" }); }
    });
  };
  await comEstados(corpo, { carregar: () => carregarContas(banco), desenhar, linhas: 7 });
}
