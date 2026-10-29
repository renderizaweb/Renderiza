// Atendimento · lista de espera (Missão 3, bloco C; 05, lista_espera): quem não conseguiu horário, por campanha ou
// geral (fotografia: a mini sessão de Natal lotou). Quando abre um horário, um toque chama a pessoa no WhatsApp.
// Tirar da lista tem desfazer (09). Quem só vê não tem botões.

import { icone } from "../../ui/icones.js";
import { escapar, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { abrirGaveta } from "../../ui/gaveta.js";
import { abrirParaQuem } from "../../ui/para-quem.js";
import { campoTexto, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { comEstados, vazio } from "../../ui/estados.js";
import { iniciais, haQuanto, linkWhatsapp, normalizarWhatsapp } from "../../ui/formatos.js";
import { ORIGEM, doNegocio } from "./logica.js";

const COLUNAS = "id, campanha_id, cliente_id, posicao, preferencia, origem, criado_em, clientes(id, nome, whatsapp), campanhas(id, nome)";

/** Agrupa por campanha (as gerais por último), na ordem da posição e de quem chegou primeiro. */
export function gruposDaEspera(linhas) {
  const grupos = new Map();
  for (const l of [...linhas].sort((a, b) => a.posicao - b.posicao || Date.parse(a.criado_em) - Date.parse(b.criado_em))) {
    const chave = l.campanha_id || "";
    if (!grupos.has(chave)) grupos.set(chave, { campanha: l.campanhas || null, linhas: [] });
    grupos.get(chave).linhas.push(l);
  }
  return [...grupos.values()].sort((a, b) => (!a.campanha) - (!b.campanha));
}

/** A mensagem de quando abre um horário. */
export function mensagemDaVaga(l, contaNome, nicho) {
  const primeiro = String((l.clientes && l.clientes.nome) || "").trim().split(/\s+/)[0];
  const de = l.campanhas ? ` na ${l.campanhas.nome}` : "";
  return `Oi${primeiro ? `, ${primeiro}` : ""}! Abriu um horário${de} aqui ${doNegocio(contaNome, nicho, "no")}. Ainda tem interesse?`;
}

export async function montarEspera(el, { banco, conta, nicho, pode, avisar }) {
  const edita = pode("atendimento", "editar") || pode("agenda", "editar");
  let linhas = [];

  const desenhar = () => {
    if (!linhas.length) {
      el.innerHTML = vazio({ icone: "relogio", titulo: "Ninguém na lista de espera", texto: "Quando uma campanha lotar, quem quiser um horário entra aqui. Abriu vaga, um toque chama no WhatsApp.", acao: edita ? { rotulo: "Pôr alguém na lista", dado: "esperar" } : null });
      return;
    }
    el.innerHTML = `
      ${edita ? `<div class="rz-cabeca-acoes rz-acoes-direita"><button class="rz-botao" type="button" data-acao="esperar">${icone("adicionar", { tamanho: 18 })}Pôr alguém na lista</button></div>` : ""}
      ${gruposDaEspera(linhas).map(g => `
        <section class="rz-secao">
          <div class="rz-secao-cabeca"><h2 class="rz-titulo-3">${escapar(g.campanha ? g.campanha.nome : "Geral")}</h2><span class="rz-texto-3">${g.linhas.length} na espera</span></div>
          <ul class="rz-linhas rz-cartao">${g.linhas.map((l, i) => {
            const numero = normalizarWhatsapp(l.clientes && l.clientes.whatsapp);
            return `<li class="rz-com-acao"><div class="rz-linha rz-linha--fixa">
                <span class="rz-avatar rz-avatar--cliente" aria-hidden="true">${i + 1}</span>
                <span class="rz-linha-texto"><b>${escapar((l.clientes && l.clientes.nome) || "Cliente")}</b><small>${escapar([l.preferencia, l.origem && ORIGEM[l.origem] ? ORIGEM[l.origem].nome : null, `entrou ${haQuanto(new Date(l.criado_em))}`].filter(Boolean).join(" · "))}</small></span>
              </div>
              ${numero ? `<a class="rz-botao rz-botao--pequeno" href="${escapar(linkWhatsapp(numero, mensagemDaVaga(l, conta.nome, nicho)))}" target="_blank" rel="noopener">${icone("whatsapp", { tamanho: 16 })}Chamar</a>` : ""}
              ${edita ? `<button class="rz-botao rz-botao--fantasma rz-botao--pequeno" type="button" data-tirar="${escapar(l.id)}" aria-label="Tirar ${escapar((l.clientes && l.clientes.nome) || "")} da lista">${icone("fechar", { tamanho: 16 })}</button>` : ""}
            </li>`;
          }).join("")}</ul>
        </section>`).join("")}`;
  };

  const carregar = () => banco.resultado(banco.tabela("lista_espera").select(COLUNAS).eq("conta_id", conta.conta_id).order("posicao").order("criado_em"));

  el.addEventListener("click", async e => {
    if (e.target.closest("[data-acao=esperar]")) return porNaLista();
    const tirar = e.target.closest("[data-tirar]");
    if (!tirar) return;
    const l = linhas.find(x => x.id === tirar.dataset.tirar);
    if (!l) return;
    linhas = linhas.filter(x => x !== l);
    desenhar();
    try {
      await banco.resultado(banco.tabela("lista_espera").delete().eq("id", l.id));
      avisar(`${(l.clientes && l.clientes.nome) || "Cliente"} saiu da lista de espera.`, {
        desfazer: async () => {
          try {
            const { clientes, campanhas, ...linha } = l;
            await banco.resultado(banco.tabela("lista_espera").insert({ ...linha, conta_id: conta.conta_id }));
            linhas.push(l);
            desenhar();
          } catch (erro) { avisar(erro.message, { tipo: "erro" }); }
        },
      });
    } catch (erro) {
      linhas.push(l);
      desenhar();
      avisar(erro.message, { tipo: "erro" });
    }
  });

  async function porNaLista() {
    const cliente = await abrirParaQuem({ banco, conta, titulo: "Quem vai para a lista?" });
    if (!cliente) return;
    const campanhas = await banco.resultado(banco.tabela("campanhas").select("id, nome").eq("conta_id", conta.conta_id).eq("ativa", true).order("nome")).catch(() => []);
    const j = abrirGaveta({
      titulo: `${cliente.nome} na lista de espera`,
      corpo: `<form class="rz-pilha" novalidate id="form-espera">
          <div role="alert" hidden></div>
          ${campanhas.length ? campoSelecao({ id: "espera-campanha", nome: "campanha_id", rotulo: "Para qual campanha", opcoes: [{ valor: "", rotulo: "Geral (qualquer horário)" }, ...campanhas.map(c => ({ valor: c.id, rotulo: c.nome }))] }) : ""}
          ${campoTexto({ id: "espera-pref", nome: "preferencia", rotulo: "O que a pessoa prefere", opcional: true, placeholder: "Ex.: sábado à tarde", extra: { maxlength: 200 } })}
        </form>`,
      rodape: `<button class="rz-botao" type="button" data-fechar>Cancelar</button><button class="rz-botao rz-botao--primario" type="submit" form="form-espera">Pôr na lista</button>`,
    });
    const form = j.el.querySelector("form");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(form);
      const botao = j.el.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        const doGrupo = linhas.filter(x => (x.campanha_id || "") === (d.campanha_id || ""));
        const nova = await banco.resultado(banco.tabela("lista_espera").insert({
          conta_id: conta.conta_id, cliente_id: cliente.id, campanha_id: d.campanha_id || null,
          preferencia: String(d.preferencia || "").trim() || null, posicao: doGrupo.length ? Math.max(...doGrupo.map(x => x.posicao)) + 1 : 0,
        }).select(COLUNAS).single());
        linhas.push(nova);
        j.fechar();
        desenhar();
        avisar(`${cliente.nome} entrou na lista de espera.`);
      } catch (erro) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), erro.message);
      }
    });
  }

  await comEstados(el, { carregar, desenhar: dados => { linhas = dados; desenhar(); } });
}
