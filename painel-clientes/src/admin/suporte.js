// Admin (Missão 5A): entrar numa conta para ajudar e exportar os dados a pedido (02, 05, 06; D19). As duas coisas
// passam pelo mesmo registro: acessos_suporte (quem, conta, por quê, nível, até quando; no máximo 8 horas). Enquanto
// ele vale, o banco deixa a Renderiza ver (ou editar) a conta, o dono vê o registro e o histórico marca o que ela fez.
// `ctx`: { banco, sessao, navegar, avisar }.

import { abrirFolha } from "../ui/gaveta.js";
import { icone } from "../ui/icones.js";
import { erroNoCampo, avisoDoFormulario, ocupado } from "../ui/formulario.js";
import { campoTexto, campoSelecao, segmentos, lerFormulario } from "../ui/campos.js";
import { nicho } from "../nichos/index.js";
import { exportarTudo } from "../telas/exportar.js";

const HORAS = [1, 2, 4, 8];

async function registrar(banco, conta, { motivo, nivel, horas }) {
  // o banco limita a 8 horas a partir do relógio dele: um minuto de folga para o relógio deste aparelho
  const fim = new Date(Date.now() + horas * 3600e3 - (horas >= 8 ? 60e3 : 0)).toISOString();
  return banco.resultado(banco.tabela("acessos_suporte").insert({ conta_id: conta.id, motivo, nivel, fim }).select("id, fim").single());
}

/** Encerra o suporte que está valendo nesta conta (o registro fica, com o fim de agora). */
export async function encerrarSuporte(banco, contaId) {
  const agora = new Date().toISOString();
  await banco.resultado(banco.tabela("acessos_suporte").update({ fim: agora }).eq("conta_id", contaId).gt("fim", agora));
}

/** "Entrar para ajudar": o motivo, o nível e por quanto tempo; depois abre o painel da conta. */
export function entrarParaAjudar(conta, ctx) {
  const { banco, sessao, navegar } = ctx;
  const folha = abrirFolha({
    titulo: `Entrar em ${conta.nome}`,
    corpo: `<form class="rz-pilha" novalidate id="form-suporte">
        <div role="alert" hidden></div>
        <p class="rz-texto-2">Fica registrado (quem, quando e por quê) e o dono vê. Acaba sozinho no fim do prazo.</p>
        ${campoTexto({ id: "sup-motivo", nome: "motivo", rotulo: "Por quê", placeholder: "Ex.: ajudar a importar as datas", extra: { maxlength: 300, autocomplete: "off" } })}
        <fieldset class="rz-campo"><legend class="rz-rotulo">O que pode fazer</legend>
          ${segmentos({ nome: "nivel", rotulo: "O que pode fazer", valor: "ver", opcoes: [{ valor: "ver", rotulo: "Só ver" }, { valor: "editar", rotulo: "Ver e editar" }] })}</fieldset>
        ${campoSelecao({ id: "sup-horas", nome: "horas", rotulo: "Por quanto tempo", valor: "2", opcoes: HORAS.map(h => ({ valor: String(h), rotulo: h === 1 ? "1 hora" : `${h} horas` })) })}
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-suporte">${icone("seta")}Entrar</button>`,
  });
  const form = folha.el.querySelector("form");
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const d = lerFormulario(form);
    const motivo = String(d.motivo || "").trim();
    erroNoCampo(form.motivo, motivo.length >= 3 ? "" : "Diga por que vai entrar (fica no registro).");
    if (motivo.length < 3) return;
    const botao = folha.el.querySelector("[type=submit]");
    ocupado(botao, true, "Entrando…");
    try {
      await registrar(banco, conta, { motivo, nivel: d.nivel === "editar" ? "editar" : "ver", horas: Number(d.horas) || 2 });
      await sessao.carregarContas();
      sessao.escolherConta(conta.id);
      folha.fechar();
      navegar("/");
    } catch (e) { ocupado(botao, false); avisoDoFormulario(form.querySelector("[role=alert]"), e.message); }
  });
}

/**
 * Exportar os dados a pedido (D19: quem sai, ou com o teste vencido, pede a planilha pelo WhatsApp): registra o
 * suporte "só ver" com o motivo, monta o .zip (src/telas/exportar.js) e encerra o suporte.
 */
export function exportarAPedido(conta, ctx) {
  const { banco, avisar } = ctx;
  const dono = (conta.donos || [])[0];
  const folha = abrirFolha({
    titulo: `Exportar os dados de ${conta.nome}`,
    corpo: `<form class="rz-pilha" novalidate id="form-exportar">
        <div role="alert" hidden></div>
        <p class="rz-texto-2">Uma planilha por assunto num .zip, como o dono baixaria. Fica registrado como suporte "só ver", com o motivo.</p>
        ${campoTexto({ id: "exp-motivo", nome: "motivo", rotulo: "Quem pediu e como", valor: `Exportar os dados a pedido${dono ? ` de ${dono.nome}` : " do dono"} (WhatsApp)`, extra: { maxlength: 300 } })}
      </form>`,
    rodape: `<button class="rz-botao" type="button" data-fechar>Voltar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-exportar">${icone("baixar")}Exportar</button>`,
  });
  const form = folha.el.querySelector("form");
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const motivo = String(form.motivo.value || "").trim();
    erroNoCampo(form.motivo, motivo.length >= 3 ? "" : "Diga quem pediu (fica no registro).");
    if (motivo.length < 3) return;
    const botao = folha.el.querySelector("[type=submit]");
    ocupado(botao, true, "Exportando…");
    try {
      await registrar(banco, conta, { motivo, nivel: "ver", horas: 1 });
      try {
        await exportarTudo({ banco, conta: { conta_id: conta.id, nome: conta.nome, nicho: conta.nicho, codigo: conta.codigo, fuso: conta.fuso, dono: true }, nicho: nicho(conta.nicho), avisar });
      } finally {
        await encerrarSuporte(banco, conta.id).catch(() => {});
      }
      folha.fechar();
    } catch (e) { ocupado(botao, false); avisoDoFormulario(form.querySelector("[role=alert]"), e.message); }
  });
}
