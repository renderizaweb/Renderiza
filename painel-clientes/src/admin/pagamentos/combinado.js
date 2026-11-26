// Admin · o combinado da mensalidade de uma conta (13-assinatura.md, 26/11/2026): a primeira mensalidade, o dia do
// vencimento e o valor (vazio: o do plano). É o que o dono vê em "Assinatura" (a próxima mensalidade, o que está em
// aberto) junto com os Pix registrados. Só a Renderiza grava (RLS de assinaturas).
// `ctx`: { banco, avisar, recarregar, catalogo }.

import { abrirFolha } from "../../ui/gaveta.js";
import { icone } from "../../ui/icones.js";
import { erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { campoTexto, lerFormulario } from "../../ui/campos.js";
import { lerValor, moeda } from "../../ui/formatos.js";
import { mensalidadeSugerida } from "../logica.js";

/** O combinado numa linha, para a ficha da conta: "R$ 49 (do plano) · todo dia 26 · a primeira em 26/12/2026". */
export function resumoDoCombinado(a, sugerido) {
  if (!a || !a.inicio) return `${moeda(sugerido, { centavos: true })} (do plano) · o dia ainda não foi combinado`;
  const [ano, mes, d] = String(a.inicio).slice(0, 10).split("-");
  const valor = a.valor !== null && a.valor !== undefined ? `${moeda(a.valor, { centavos: true })} (combinado)` : `${moeda(sugerido, { centavos: true })} (do plano)`;
  return `${valor} · todo dia ${a.dia || Number(d)} · a primeira em ${d}/${mes}/${ano}`;
}

export function abrirCombinado(c, ctx, atual = null) {
  const { banco, avisar, catalogo = [] } = ctx;
  const sugerido = mensalidadeSugerida(c.ligados || [], catalogo);
  const folha = abrirFolha({
    titulo: `Mensalidade de ${c.nome}`,
    corpo: `<form class="rz-pilha" novalidate id="form-combinado">
        <div role="alert" hidden></div>
        <p class="rz-texto-3">O dono vê isso em "Assinatura": a próxima mensalidade e o que estiver em aberto, junto com os Pix registrados.</p>
        ${campoTexto({ id: "cb-inicio", nome: "inicio", rotulo: "A primeira mensalidade vence em", tipo: "date", valor: (atual && atual.inicio) || "", ajuda: "Ex.: no termo do site, “a partir de 30 dias depois da entrega”." })}
        <div class="rz-campos rz-campos--duas">
          ${campoTexto({ id: "cb-dia", nome: "dia", rotulo: "Dia do vencimento", teclado: "numeric", opcional: true, valor: atual && atual.dia ? String(atual.dia) : "", ajuda: "De 1 a 28. Vazio: o dia da primeira." })}
          ${campoTexto({ id: "cb-valor", nome: "valor", rotulo: "Valor (R$)", teclado: "decimal", opcional: true, valor: atual && atual.valor !== null && atual.valor !== undefined ? String(atual.valor).replace(".", ",") : "", ajuda: `Vazio: o do plano, hoje ${moeda(sugerido, { centavos: true })}.` })}
        </div>
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-combinado">${icone("ok")}Salvar</button>`,
  });
  const form = folha.el.querySelector("form");
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const d = lerFormulario(form);
    const dia = String(d.dia || "").trim() ? Number(d.dia) : null;
    const valor = String(d.valor || "").trim() ? lerValor(d.valor) : null;
    erroNoCampo(form.inicio, d.inicio ? "" : "Escolha a data da primeira mensalidade.");
    erroNoCampo(form.dia, dia === null || (Number.isInteger(dia) && dia >= 1 && dia <= 28) ? "" : "Um dia de 1 a 28.");
    erroNoCampo(form.valor, String(d.valor || "").trim() === "" || valor >= 0 ? "" : "Confira o valor (ex.: 49 ou 39,90).");
    if (!d.inicio || (dia !== null && !(dia >= 1 && dia <= 28 && Number.isInteger(dia))) || (String(d.valor || "").trim() && !(valor >= 0))) return;
    const botao = folha.el.querySelector("[type=submit]");
    ocupado(botao, true, "Salvando…");
    try {
      await banco.resultado(banco.tabela("assinaturas").upsert({ conta_id: c.id, inicio: d.inicio, dia, valor }, { onConflict: "conta_id" }));
      folha.fechar();
      avisar(`${c.nome}: mensalidade combinada.`);
      ctx.recarregar();
    } catch (e) { ocupado(botao, false); avisoDoFormulario(form.querySelector("[role=alert]"), e.message); }
  });
  return folha;
}
