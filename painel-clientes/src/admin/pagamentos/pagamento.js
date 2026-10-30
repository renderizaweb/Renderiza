// Admin · registrar o Pix de um mês (Missão 5A; 02: a mensalidade por Pix, por fora, registrada à mão). O mês de
// referência, o valor (sugerido pelo plano: R$ 49 com 2 módulos e cada um a mais pelo preço dele), quando entrou e
// uma observação. Quem registrou o banco guarda sozinho.
// `ctx`: { banco, avisar, recarregar, catalogo }.

import { abrirFolha } from "../../ui/gaveta.js";
import { icone } from "../../ui/icones.js";
import { erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { campoTexto, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { dia, lerValor, moeda } from "../../ui/formatos.js";
import { mensalidadeSugerida, mesDe, somarMeses, nomeDoMes } from "../logica.js";

export function abrirPagamento(c, ctx, { mes = null } = {}) {
  const { banco, avisar, catalogo = [] } = ctx;
  const hoje = dia(new Date());
  const atual = mesDe(hoje);
  const sugerido = mensalidadeSugerida(c.ligados || [], catalogo);
  const meses = [-2, -1, 0, 1].map(k => somarMeses(atual, k));
  const folha = abrirFolha({
    titulo: `Pix de ${c.nome}`,
    corpo: `<form class="rz-pilha" novalidate id="form-pix-admin">
        <div role="alert" hidden></div>
        ${campoSelecao({ id: "pg-mes", nome: "mes", rotulo: "Mês da mensalidade", valor: mes || atual, opcoes: meses.map(m => ({ valor: m, rotulo: nomeDoMes(m) })) })}
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "pg-valor", nome: "valor", rotulo: "Valor (R$)", teclado: "decimal", valor: String(sugerido).replace(".", ","), ajuda: `Pelo plano: ${moeda(sugerido, { centavos: true })} (${(c.ligados || []).length} módulos).` })}
          ${campoTexto({ id: "pg-data", nome: "pago_em", rotulo: "Quando entrou", tipo: "date", valor: hoje })}
        </div>
        ${campoTexto({ id: "pg-obs", nome: "observacao", rotulo: "Observação", opcional: true, extra: { maxlength: 300 } })}
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-pix-admin">${icone("ok")}Registrar</button>`,
  });
  const form = folha.el.querySelector("form");
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const d = lerFormulario(form);
    const valor = lerValor(d.valor);
    erroNoCampo(form.valor, valor > 0 ? "" : "Digite o valor.");
    erroNoCampo(form.pago_em, d.pago_em ? "" : "Escolha a data.");
    if (!(valor > 0) || !d.pago_em) return;
    const botao = folha.el.querySelector("[type=submit]");
    ocupado(botao, true, "Registrando…");
    try {
      await banco.resultado(banco.tabela("pagamentos").insert({ conta_id: c.id, mes: d.mes, valor, pago_em: d.pago_em, observacao: String(d.observacao || "").trim() || null }));
      folha.fechar();
      avisar(`${c.nome}: ${moeda(valor, { centavos: true })} de ${nomeDoMes(d.mes)} registrado.`);
      ctx.recarregar();
    } catch (e) { ocupado(botao, false); avisoDoFormulario(form.querySelector("[role=alert]"), e.message); }
  });
  return folha;
}
