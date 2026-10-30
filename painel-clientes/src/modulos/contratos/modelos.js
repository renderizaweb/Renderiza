// Contratos (Missão 3, bloco E): os modelos. O texto é do cliente da Renderiza (02: a Renderiza não escreve nem
// revisa contrato): ele cola o dele e marca os campos ({cliente}, {data}…) que o painel troca pelos dados da festa
// ou do ensaio. Um toque no campo põe a marca onde está o cursor.

import { abrirGaveta, confirmar } from "../../ui/gaveta.js";
import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado, erroNoCampo } from "../../ui/formulario.js";
import { campoTexto } from "../../ui/campos.js";
import { CAMPOS } from "./logica.js";

const EXEMPLO = "Contratante: {cliente}\nData: {data}, {horario}\nPacote: {pacote}\nValor total: {valor}, com sinal de {sinal}\n\n(cole aqui o texto do seu contrato)";

/** A lista dos modelos, com "Novo modelo". */
export async function abrirModelos(ctx, { novo = false } = {}) {
  const { banco, conta, pode } = ctx;
  const edita = pode("contratos", "editar");
  if (novo && edita) return abrirModelo(ctx, null);
  const modelos = await banco.resultado(banco.tabela("modelos_contrato").select("id, nome, texto, ativo, atualizado_em").eq("conta_id", conta.conta_id).order("nome")).catch(() => []);
  const j = abrirGaveta({
    foco: "fechar",
    titulo: "Modelos de contrato",
    subtitulo: "O texto é seu: cole o contrato e marque os campos que o painel preenche.",
    corpo: modelos.length
      ? `<ul class="rz-linhas rz-cartao">${modelos.map(m => `<li><button class="rz-linha" type="button" data-modelo="${escapar(m.id)}">
          <span class="rz-linha-texto"><b>${escapar(m.nome)}</b><small>${escapar(m.texto.replace(/\s+/g, " ").slice(0, 90))}…</small></span>
          ${m.ativo ? "" : `<span class="rz-linha-fim"><span class="rz-etiqueta">Guardado</span></span>`}</button></li>`).join("")}</ul>`
      : `<p class="rz-texto-2">Nenhum modelo ainda. Cole o texto do seu contrato uma vez e use em todos.</p>`,
    rodape: edita ? `<button class="rz-botao rz-botao--primario" type="button" data-novo-modelo>${icone("adicionar")}Novo modelo</button>` : "",
  });
  j.el.addEventListener("click", e => {
    const b = e.target.closest("[data-modelo]");
    if (b) { j.fechar(); abrirModelo(ctx, modelos.find(m => m.id === b.dataset.modelo)); }
    if (e.target.closest("[data-novo-modelo]")) { j.fechar(); abrirModelo(ctx, null); }
  });
  return j;
}

/** Um modelo: o nome e o texto, com os campos para pôr no cursor. */
function abrirModelo(ctx, modelo) {
  const { banco, conta, pode, avisar } = ctx;
  const edita = pode("contratos", "editar");
  const j = abrirGaveta({
    titulo: modelo ? modelo.nome : "Novo modelo",
    corpo: `<form class="rz-pilha" novalidate id="form-modelo">
        <div role="alert" hidden></div>
        ${campoTexto({ id: "mod-nome", nome: "nome", rotulo: "Nome do modelo", valor: modelo ? modelo.nome : "", placeholder: "Ex.: Contrato de casamento", extra: { maxlength: 80, ...(edita ? {} : { disabled: true }) } })}
        <div class="rz-campo"><label class="rz-rotulo" for="mod-texto">O texto</label>
          <textarea class="rz-entrada rz-contrato-editor" id="mod-texto" name="texto" rows="14" maxlength="50000"${edita ? "" : " disabled"} placeholder="${escapar(EXEMPLO)}">${escapar(modelo ? modelo.texto : "")}</textarea>
          <p class="rz-erro-campo" hidden></p></div>
        ${edita ? `<fieldset class="rz-campo"><legend class="rz-rotulo">Pôr um campo <span class="rz-texto-3">vai onde está o cursor</span></legend>
          <div class="rz-campos-modelo">${CAMPOS.map(c => `<button class="rz-chip" type="button" data-campo="${c.id}" title="${escapar(c.nome)}">{${c.id}}</button>`).join("")}</div></fieldset>
          <p class="rz-texto-3">O painel não escreve nem revisa o contrato: o texto é seu. Na hora de fazer o contrato, cada campo vira o dado ${ctx.nicho.id === "eventos" ? "da festa" : "do ensaio"}, e dá para mexer no texto antes de mandar.</p>` : ""}
        ${edita && modelo ? `<button class="rz-botao rz-botao--fantasma" type="button" data-apagar-modelo>${icone("lixo", { tamanho: 16 })}Apagar o modelo</button>` : ""}
      </form>`,
    rodape: edita ? `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-modelo">Salvar</button>` : "",
  });
  const form = j.el.querySelector("form");
  const area = form.texto;
  form.addEventListener("click", e => {
    const b = e.target.closest("[data-campo]");
    if (!b) return;
    const marca = `{${b.dataset.campo}}`;
    const [ini, fim] = [area.selectionStart ?? area.value.length, area.selectionEnd ?? area.value.length];
    area.setRangeText(marca, ini, fim, "end");
    area.focus();
  });
  form.querySelector("[data-apagar-modelo]")?.addEventListener("click", async () => {
    const ok = await confirmar({ titulo: "Apagar o modelo?", texto: `${escapar(modelo.nome)}. Os contratos já feitos com ele continuam como estão.`, sim: "Apagar", nao: "Voltar", perigo: true });
    if (!ok) return;
    try {
      await banco.resultado(banco.tabela("modelos_contrato").delete().eq("id", modelo.id));
      j.fechar();
      avisar(`Modelo apagado: ${modelo.nome}.`);
      ctx.recarregar();
    } catch (e) { avisar(e.message, { tipo: "erro" }); }
  });
  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    const nome = form.nome.value.trim(), texto = area.value.replace(/\r\n/g, "\n").trim();
    erroNoCampo(form.nome, nome ? "" : "Dê um nome (ex.: Contrato de casamento).");
    erroNoCampo(area, texto ? "" : "Cole o texto do contrato.");
    if (!nome || !texto) return;
    const botao = j.el.querySelector("[type=submit]");
    ocupado(botao, true, "Salvando…");
    try {
      if (modelo) await banco.resultado(banco.tabela("modelos_contrato").update({ nome, texto }).eq("id", modelo.id));
      else await banco.resultado(banco.tabela("modelos_contrato").insert({ conta_id: conta.conta_id, nome, texto }));
      j.fechar();
      avisar(`Modelo salvo: ${nome}.`);
      ctx.recarregar();
    } catch (e) { ocupado(botao, false); avisoDoFormulario(form.querySelector("[role=alert]"), e.message); }
  });
  return j;
}
