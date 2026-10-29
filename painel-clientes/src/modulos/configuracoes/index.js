// Configurações do negócio (só o dono): nome, WhatsApp, fuso e logo. O plano (situação, prazos, módulos, código
// público) é da Renderiza e aparece só para consulta; mudar, pelo WhatsApp. O logo vira WebP no próprio aparelho
// antes de subir (06: só imagem, tamanho máximo; o original não é guardado).

import { icone } from "../../ui/icones.js";
import { escapar, erroNoCampo, avisoDoFormulario, ocupado } from "../../ui/formulario.js";
import { telefone, whatsappValido, normalizarWhatsapp, dataNumerica, iniciais } from "../../ui/formatos.js";
import { campoTexto, campoSelecao, lerFormulario } from "../../ui/campos.js";
import { comEstados } from "../../ui/estados.js";
import { nicho as nichoDe } from "../../nichos/index.js";
import { linkDaRenderiza } from "../../telas/renderiza.js";

export const FUSOS = [
  { valor: "America/Sao_Paulo", rotulo: "Horário de Brasília (SP, RJ, MG, Sul, Nordeste, GO, DF)" },
  { valor: "America/Manaus", rotulo: "Amazonas, Mato Grosso, Rondônia, Roraima (1 h a menos)" },
  { valor: "America/Rio_Branco", rotulo: "Acre (2 h a menos)" },
  { valor: "America/Noronha", rotulo: "Fernando de Noronha (1 h a mais)" },
];

const SITUACAO = { teste: "Teste grátis", ativa: "Ativa", desligada: "Desligada", cancelada: "Cancelada" };

/** Reduz a imagem (no máximo `lado` px) e converte para WebP. Devolve um Blob. */
export async function paraWebp(arquivo, lado = 512) {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
  const tela = document.createElement("canvas");
  tela.width = Math.round(imagem.width * escala);
  tela.height = Math.round(imagem.height * escala);
  tela.getContext("2d").drawImage(imagem, 0, 0, tela.width, tela.height);
  const blob = await new Promise(r => tela.toBlob(r, "image/webp", 0.86));
  if (!blob || blob.type !== "image/webp") throw new Error("Este aparelho não conseguiu converter a imagem. Tente outra, ou outro navegador.");
  return blob;
}

export async function montar(el, { banco, conta, avisar, sessao, navegar }) {
  const n = nichoDe(conta.nicho);
  el.innerHTML = `<header class="rz-cabeca"><div class="rz-cabeca-titulos"><h1 class="rz-titulo-1">Configurações</h1>
      <p class="rz-texto-2">Os dados ${escapar(n.palavras.daConta)} que aparecem no painel e nas mensagens.</p></div></header><div data-corpo></div>`;
  const corpo = el.querySelector("[data-corpo]");

  const carregar = () => banco.resultado(banco.tabela("contas").select("id, nome, nicho, codigo, logo, whatsapp, fuso, situacao, teste_ate, ativa_ate, origem, limite_pessoas, ajustes").eq("id", conta.conta_id).single());
  const desenhar = c => {
    corpo.innerHTML = `
      <section class="rz-secao">
        <form class="rz-cartao rz-cartao-corpo rz-pilha" id="form-conta" novalidate>
          <div role="alert" hidden></div>
          <div class="rz-logo-campo">
            <span class="rz-logo" data-logo>${c.logo ? `<img src="${escapar(c.logo)}" alt="Logo de ${escapar(c.nome)}">` : escapar(iniciais(c.nome))}</span>
            <div class="rz-pilha-p">
              <b>Logo</b><span class="rz-texto-3">PNG, JPG ou WebP. A gente reduz e guarda em WebP.</span>
              <div class="rz-cabeca-acoes">
                <label class="rz-botao rz-botao--pequeno">${icone("imagem", { tamanho: 16 })}${c.logo ? "Trocar" : "Enviar"}<input type="file" accept="image/png,image/jpeg,image/webp" data-arquivo hidden></label>
                ${c.logo ? `<button class="rz-botao rz-botao--pequeno rz-botao--fantasma" type="button" data-tirar-logo>Tirar</button>` : ""}
              </div>
            </div>
          </div>
          ${campoTexto({ id: "conta-nome", nome: "nome", rotulo: `Nome ${n.palavras.daConta}`, valor: c.nome, autocompletar: "organization" })}
          ${campoTexto({ id: "conta-whatsapp", nome: "whatsapp", rotulo: "WhatsApp", valor: telefone(c.whatsapp), tipo: "tel", teclado: "tel", opcional: true, placeholder: "(11) 98888-7777", ajuda: "O número que os clientes chamam. Vai nas mensagens prontas." })}
          ${campoSelecao({ id: "conta-fuso", nome: "fuso", rotulo: "Fuso horário", valor: c.fuso, opcoes: FUSOS.some(f => f.valor === c.fuso) ? FUSOS : [...FUSOS, { valor: c.fuso, rotulo: c.fuso }] })}
          <div><button class="rz-botao rz-botao--primario" type="submit">Salvar</button></div>
        </form>
      </section>
      <section class="rz-secao">
        <h2 class="rz-titulo-3">Pix</h2>
        <form class="rz-cartao rz-cartao-corpo rz-pilha" id="form-pix" novalidate>
          <div role="alert" hidden></div>
          <p class="rz-texto-2">Aparece para o cliente depois que ele aceita o contrato, para pagar o sinal. O painel não recebe: o Pix cai direto na sua conta.</p>
          ${campoTexto({ id: "pix-chave", nome: "chave", rotulo: "Chave Pix", valor: (c.ajustes && c.ajustes.pix && c.ajustes.pix.chave) || "", opcional: true, ajuda: "CPF, CNPJ, e-mail, celular ou a chave aleatória.", extra: { maxlength: 120 } })}
          ${campoTexto({ id: "pix-nome", nome: "nome", rotulo: "Em nome de", valor: (c.ajustes && c.ajustes.pix && c.ajustes.pix.nome) || "", opcional: true, ajuda: "O nome que o banco mostra, para o cliente conferir.", extra: { maxlength: 120 } })}
          <div><button class="rz-botao" type="submit">Salvar o Pix</button></div>
        </form>
      </section>
      <section class="rz-secao">
        <h2 class="rz-titulo-3">O plano</h2>
        <dl class="rz-cartao rz-cartao-corpo rz-fatos">
          <div><dt>Situação</dt><dd>${escapar(SITUACAO[c.situacao] || c.situacao)}${c.situacao === "teste" ? ` até ${escapar(dataNumerica(c.teste_ate))}` : c.ativa_ate ? ` até ${escapar(dataNumerica(c.ativa_ate + "T12:00:00Z"))}` : ""}</dd></div>
          <div><dt>Tipo de negócio</dt><dd>${escapar(n.nome)}</dd></div>
          <div><dt>Módulos</dt><dd>${escapar((conta.modulos || []).map(m => (n.modulos[m] && n.modulos[m].nome) || m).join(", ") || "nenhum")}</dd></div>
          <div><dt>Pessoas</dt><dd>até ${c.limite_pessoas}</dd></div>
          <div><dt>Código público</dt><dd><code>${escapar(c.codigo)}</code></dd></div>
        </dl>
        <p class="rz-texto-3">Para mudar os módulos ou o plano, <a href="${linkDaRenderiza(`Oi! Quero mudar o plano do Painel Renderiza de ${c.nome}.`)}" target="_blank" rel="noopener">fale com a gente</a>. O valor novo vale a partir da mensalidade seguinte.</p>
      </section>`;
    ligar(c);
  };

  function ligar(c) {
    const form = corpo.querySelector("#form-conta");
    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      const dados = lerFormulario(form);
      const erros = { nome: dados.nome ? "" : "Digite o nome.", whatsapp: dados.whatsapp && !whatsappValido(dados.whatsapp) ? "Confira o WhatsApp: DDD e número." : "" };
      erroNoCampo(form.nome, erros.nome);
      erroNoCampo(form.whatsapp, erros.whatsapp);
      if (erros.nome || erros.whatsapp) return;
      const botao = form.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        await banco.resultado(banco.tabela("contas").update({ nome: dados.nome, whatsapp: normalizarWhatsapp(dados.whatsapp), fuso: dados.fuso }).eq("id", c.id));
        ocupado(botao, false);
        avisar("Configurações salvas.");
        await sessao.carregarContas();
        navegar(location.pathname, { substituir: true }); // o nome novo aparece no menu
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(form.querySelector("[role=alert]"), e.message);
      }
    });
    // o Pix (Contratos, Missão 3E): em contas.ajustes.pix, sem apagar os outros ajustes
    const formPix = corpo.querySelector("#form-pix");
    formPix.addEventListener("submit", async ev => {
      ev.preventDefault();
      const d = lerFormulario(formPix);
      const chave = String(d.chave || "").trim(), nome = String(d.nome || "").trim();
      const { pix, ...outros } = c.ajustes || {};
      const ajustes = chave ? { ...outros, pix: { chave, nome: nome || null } } : outros;
      const botao = formPix.querySelector("[type=submit]");
      ocupado(botao, true, "Salvando…");
      try {
        await banco.resultado(banco.tabela("contas").update({ ajustes }).eq("id", c.id));
        c.ajustes = ajustes;
        ocupado(botao, false);
        avisar(chave ? "Pix salvo. O cliente vê depois de aceitar o contrato." : "Pix tirado.");
      } catch (e) {
        ocupado(botao, false);
        avisoDoFormulario(formPix.querySelector("[role=alert]"), e.message);
      }
    });
    corpo.querySelector("[data-arquivo]").addEventListener("change", async ev => {
      const arquivo = ev.target.files[0];
      if (!arquivo) return;
      if (!/^image\/(png|jpeg|webp)$/.test(arquivo.type)) return avisar("Use uma imagem PNG, JPG ou WebP.", { tipo: "erro" });
      if (arquivo.size > 8 * 1024 * 1024) return avisar("A imagem passa de 8 MB. Use uma menor.", { tipo: "erro" });
      try {
        const webp = await paraWebp(arquivo);
        const url = await banco.enviarArquivo("logos", `${c.id}/logo.webp`, webp, "image/webp");
        await banco.resultado(banco.tabela("contas").update({ logo: `${url}?v=${Date.now()}` }).eq("id", c.id));
        avisar("Logo atualizado.");
        await sessao.carregarContas();
        navegar(location.pathname, { substituir: true });
      } catch (e) {
        avisar(e.message, { tipo: "erro" });
      }
    });
    corpo.querySelector("[data-tirar-logo]")?.addEventListener("click", async () => {
      try {
        await banco.resultado(banco.tabela("contas").update({ logo: null }).eq("id", c.id));
        avisar("Logo tirado.");
        await sessao.carregarContas();
        navegar(location.pathname, { substituir: true });
      } catch (e) {
        avisar(e.message, { tipo: "erro" });
      }
    });
  }

  await comEstados(corpo, { carregar, desenhar });
}
